#!/usr/bin/env node
/* ============================================================
 * Content smoke test — every course, every unit, every generator.
 *
 *   node tools/check-content.js [runs-per-generator]   (default 300)
 *   node tools/check-content.js 300 econ-b251          (one course)
 *
 * Loads js/core.js and every courses/** script listed in index.html
 * into a sandbox, then checks:
 *
 *   · course + unit + card + generator ids are unique and well formed
 *   · every flashcard has a front and a back; notes link to real topics
 *   · every generated problem is well posed for its kind:
 *       num/count  finite answer (whole number for count)
 *       mc         >= 2 distinct choices, answer index in range
 *       multi      >= 3 distinct choices, answers valid
 *       classify   >= 2 categories, >= 2 items, every answer a real category
 *   · no "undefined"/"NaN"/"[object Object]" leaked into any text
 *   · LaTeX delimiters balanced, HTML tags whitelisted and balanced
 *   · every declared variant actually appears, and every topic has
 *     at least 4 variants and a multi-step solution most of the time
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const RUNS = Number(process.argv[2]) || 300;
const ONLY = process.argv[3] || null;

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="((?:js\/core\.js)|(?:courses\/[^"]+))"><\/script>/g)].map(m => m[1]);
if (!files.length) { console.error("no course scripts found in index.html"); process.exit(1); }

const ctx = vm.createContext({ console });
ctx.window = ctx;
for (const f of files) {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) { console.error(`index.html loads ${f}, which does not exist`); process.exit(1); }
  vm.runInContext(fs.readFileSync(full, "utf8"), ctx, { filename: f });
}
const STUDY = ctx.STUDY;

const problems = [];
const warnings = [];
const fail = m => problems.push(m);
const warn = m => warnings.push(m);

const OK_TAGS = new Set(["div", "span", "b", "i", "em", "strong", "br", "code", "sup", "sub", "small", "p", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th", "caption", "svg", "g", "line", "polyline", "polygon", "path", "circle", "rect",
  "text", "tspan", "defs", "marker", "a", "hr", "blockquote", "u", "mark"]);
const VOID = new Set(["br", "hr"]);

function checkText(where, s) {
  if (typeof s !== "string") { fail(`${where}: expected a string, got ${typeof s}`); return; }
  if (!s.trim()) fail(`${where}: empty`);
  if (/\bundefined\b|\bNaN\b|\[object Object\]|Infinity/.test(s.replace(/<svg[\s\S]*?<\/svg>/g, ""))) fail(`${where}: leaked undefined/NaN/object: ${s.slice(0, 140)}`);
  const dd = (s.match(/\$\$/g) || []).length;
  if (dd % 2) fail(`${where}: unbalanced $$`);
  const open = (s.match(/\\\(/g) || []).length, close = (s.match(/\\\)/g) || []).length;
  if (open !== close) fail(`${where}: unbalanced \\( \\)`);
  // tags: whitelist + balance (self-closing svg elements allowed)
  const stack = [];
  for (const m of s.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const [, closing, nameRaw, self] = m;
    const name = nameRaw.toLowerCase();
    if (!OK_TAGS.has(name)) { fail(`${where}: unexpected <${name}> (a stray "<" before a letter? write &lt;)`); continue; }
    if (self || VOID.has(name)) continue;
    if (closing) {
      if (stack[stack.length - 1] === name) stack.pop();
      else { fail(`${where}: mismatched </${name}> (open: ${stack.join(">") || "none"})`); return; }
    } else stack.push(name);
  }
  if (stack.length) fail(`${where}: unclosed <${stack.join("> <")}>`);
}

const plain = s => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

function checkProblem(where, p) {
  if (!p || typeof p !== "object") return fail(`${where}: make() returned ${p}`);
  checkText(where + " q", p.q);
  checkText(where + " sol", p.sol);
  if (!/class="sol-step"/.test(p.sol || "")) fail(`${where}: solution has no <div class="sol-step"> steps`);
  switch (p.kind) {
    case "num": case "count":
      if (!Number.isFinite(p.answer)) fail(`${where}: non-finite answer ${p.answer}`);
      if (p.kind === "count" && !Number.isInteger(p.answer)) fail(`${where}: count answer ${p.answer} is not whole`);
      if (p.tol != null && !(p.tol >= 0)) fail(`${where}: bad tol ${p.tol}`);
      for (const t of (p.traps || [])) {
        if (!Number.isFinite(t.value)) fail(`${where}: trap value ${t.value}`);
        checkText(where + " trap", t.why);
        if (Math.abs(t.value - p.answer) <= Math.max(0.011, Math.abs(p.answer) * 0.01)) fail(`${where}: trap value ${t.value} equals the answer ${p.answer}`);
      }
      break;
    case "mc": {
      if (!Array.isArray(p.choices) || p.choices.length < 2) { fail(`${where}: mc needs >= 2 choices`); break; }
      p.choices.forEach((c, i) => checkText(`${where} choice ${i}`, c));
      const keys = p.choices.map(plain);
      if (new Set(keys).size !== keys.length) fail(`${where}: duplicate choices: ${keys.join(" | ")}`);
      if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer >= p.choices.length) fail(`${where}: mc answer index ${p.answer} out of range`);
      if (p.whys) p.whys.forEach((w, i) => w != null && checkText(`${where} why ${i}`, w));
      break;
    }
    case "multi": {
      if (!Array.isArray(p.choices) || p.choices.length < 3) { fail(`${where}: multi needs >= 3 choices`); break; }
      p.choices.forEach((c, i) => checkText(`${where} choice ${i}`, c));
      const keys = p.choices.map(plain);
      if (new Set(keys).size !== keys.length) fail(`${where}: duplicate choices`);
      if (!Array.isArray(p.answer) || p.answer.some(i => !Number.isInteger(i) || i < 0 || i >= p.choices.length)) fail(`${where}: bad multi answer`);
      if (!p.answer.length) warn(`${where}: multi with no correct options`);
      break;
    }
    case "classify": {
      if (!Array.isArray(p.cats) || p.cats.length < 2) { fail(`${where}: classify needs >= 2 cats`); break; }
      if (!Array.isArray(p.items) || p.items.length < 2) { fail(`${where}: classify needs >= 2 items`); break; }
      p.items.forEach((c, i) => checkText(`${where} item ${i}`, c));
      const keys = p.items.map(plain);
      if (new Set(keys).size !== keys.length) fail(`${where}: duplicate items`);
      if (!Array.isArray(p.answer) || p.answer.length !== p.items.length || p.answer.some(a => !Number.isInteger(a) || a < 0 || a >= p.cats.length)) fail(`${where}: classify answers must index cats (got ${JSON.stringify(p.answer)})`);
      break;
    }
    default:
      fail(`${where}: unknown kind "${p.kind}"`);
  }
}

const ids = new Map();
function claim(id, where) {
  if (!id || typeof id !== "string") return fail(`${where}: missing id`);
  if (ids.has(id)) fail(`${where}: id "${id}" already used by ${ids.get(id)}`);
  ids.set(id, where);
}

let totalGens = 0, totalVariants = 0, totalCards = 0;
for (const course of STUDY.courses) {
  if (ONLY && course.id !== ONLY) continue;
  claim(course.id, "course");
  for (const k of ["code", "name", "term"]) if (!course[k]) fail(`${course.id}: course.${k} missing`);
  const unitIds = new Set(course.units.map(u => u.id));
  for (const r of course.schedule) if (!r.start || !/^\d{4}-\d\d-\d\d$/.test(r.start)) fail(`${course.id}: schedule row "${r.title}" has bad start`);
  for (const k of course.keyDates) if (!/^\d{4}-\d\d-\d\d$/.test(k.date)) fail(`${course.id}: keyDate "${k.label}" has bad date`);
  const pct = course.gradeWeights.reduce((a, g) => a + g.pct, 0);
  if (course.gradeWeights.length && Math.abs(pct - 100) > 0.01) fail(`${course.id}: grade weights sum to ${pct}`);
  console.log(`\n${course.code} — ${course.name}`);

  for (const u of course.units) {
    const where = `${course.id}/${u.id}`;
    for (const k of ["id", "title", "short"]) if (!u[k]) fail(`${where}: unit.${k} missing`);
    const cards = u.flashcards || [];
    totalCards += cards.length;
    for (const c of cards) {
      claim(c.id, `${where} card`);
      checkText(`${where} card ${c.id} front`, c.front);
      checkText(`${where} card ${c.id} back`, c.back);
    }
    const genIds = new Set((u.generators || []).map(g => g.id));
    for (const [i, n] of (u.notes || []).entries()) {
      checkText(`${where} note ${i} title`, n.title);
      checkText(`${where} note ${i} html`, n.html);
      for (const g of (n.gens || [])) if (!genIds.has(g)) fail(`${where} note "${n.title}": links unknown topic ${g}`);
    }
    for (const [i, c] of (u.cues || []).entries()) {
      checkText(`${where} cue ${i} when`, c.when);
      checkText(`${where} cue ${i} think`, c.think);
      checkText(`${where} cue ${i} why`, c.why);
    }
    let unitVariants = 0;
    for (const g of (u.generators || [])) {
      claim(g.id, `${where} generator`);
      totalGens++;
      const names = g.variantNames || [];
      unitVariants += names.length;
      if (names.length < 4) warn(`${where}/${g.id}: only ${names.length} variants (aim for 5–8)`);
      if (new Set(names).size !== names.length) fail(`${where}/${g.id}: duplicate variant names`);
      const seen = new Map();
      let oneStep = 0;
      for (let r = 0; r < RUNS; r++) {
        let p;
        try { p = g.make(); }
        catch (e) { fail(`${where}/${g.id}: make() threw: ${e.stack.split("\n").slice(0, 3).join(" | ")}`); break; }
        const vw = `${where}/${g.id} [${p && p.variant}]`;
        seen.set(p.variant, (seen.get(p.variant) || 0) + 1);
        checkProblem(vw, p);
        if (((p.sol || "").match(/class="sol-step"/g) || []).length < 2) oneStep++;
        if (problems.length > 60) break;
      }
      for (const n of names) if (!seen.has(n)) fail(`${where}/${g.id}: variant "${n}" never appeared`);
      if (oneStep > RUNS * 0.5) warn(`${where}/${g.id}: most solutions are a single step — the hint ladder needs 2+`);
      console.log(`  ${u.id.padEnd(5)} ${g.id.padEnd(30)} ${String(names.length).padStart(2)} types`);
    }
    totalVariants += unitVariants;
    console.log(`  ${u.id}: ${cards.length} cards · ${(u.generators || []).length} topics · ${unitVariants} question types · ${(u.notes || []).length} lessons · ${(u.cues || []).length} cues`);
  }
  for (const r of course.schedule) if (r.unit && !unitIds.has(r.unit)) { /* not added yet — fine */ }
}

console.log(`\nTotal: ${totalCards} cards · ${totalGens} topics · ${totalVariants} question types`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); warnings.slice(0, 30).forEach(w => console.log("  ! " + w)); }
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  problems.slice(0, 60).forEach(p => console.error("  ✗ " + p));
  process.exit(1);
}
console.log("\n✓ all content checks passed");
