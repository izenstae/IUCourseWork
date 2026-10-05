#!/usr/bin/env node
/* ============================================================
 * Learning-quality audit — does each unit *teach*, not just test?
 *
 *   node tools/audit-learning.js [course-id] [--strict]
 *
 * For every unit it samples each generator and reports:
 *   · lessons: count, and whether each has a key idea, an example
 *     and a common trap, and links to practice
 *   · coverage: every practice topic is reachable from some lesson
 *   · variety: question types per topic, and the mix of formats
 *     (multiple choice / numeric / drop-down / select-all)
 *   · feedback: share of wrong MC options that explain the
 *     misconception; share of numeric questions with named traps
 *   · hint ladder: share of solutions with 2+ steps
 *   · flashcards and cue-table size
 * --strict exits non-zero if any unit falls below the thresholds.
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const ONLY = args.find(a => !a.startsWith("--")) || null;

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="((?:js\/core\.js)|(?:courses\/[^"]+))"><\/script>/g)].map(m => m[1]);
const ctx = vm.createContext({ console });
ctx.window = ctx;
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });

const T = { lessons: 3, typesPerTopic: 5, whyShare: 0.8, stepShare: 0.9, cards: 15, cues: 8, kinds: 3 };
let failures = 0;
const pct = x => (x * 100).toFixed(0) + "%";

for (const course of ctx.STUDY.courses) {
  if (ONLY && course.id !== ONLY) continue;
  console.log(`\n${course.code} — learning audit`);
  for (const u of course.units) {
    const gens = u.generators || [];
    if (!gens.length && !(u.notes || []).length) { console.log(`  ${u.id}: (no content yet)`); continue; }
    const notes = u.notes || [];
    const lessonIssues = [];
    notes.forEach((n, i) => {
      const miss = ["keyidea", "example", "trap"].filter(k => !new RegExp(`class="${k}"`).test(n.html));
      if (miss.length) lessonIssues.push(`lesson ${i + 1} lacks ${miss.join("/")}`);
      if (!(n.gens || []).length) lessonIssues.push(`lesson ${i + 1} links no practice`);
    });
    const linked = new Set(notes.flatMap(n => n.gens || []));
    const orphans = gens.filter(g => !linked.has(g.id)).map(g => g.id);

    let mcWrong = 0, mcWhy = 0, nums = 0, numTraps = 0, sols = 0, multiStep = 0;
    const kinds = {};
    const thinTopics = [];
    for (const g of gens) {
      if (g.variantNames.length < T.typesPerTopic) thinTopics.push(`${g.id} (${g.variantNames.length})`);
      for (let i = 0; i < 120; i++) {
        const p = g.make();
        kinds[p.kind] = (kinds[p.kind] || 0) + 1;
        sols++;
        if (((p.sol || "").match(/class="sol-step"/g) || []).length >= 2) multiStep++;
        if (p.kind === "mc" && p.choices.length > 2) {
          p.choices.forEach((_, k) => { if (k !== p.answer) { mcWrong++; if (p.whys && p.whys[k]) mcWhy++; } });
        }
        if (p.kind === "num" || p.kind === "count") { nums++; if ((p.traps || []).length) numTraps++; }
      }
    }
    const whyShare = mcWrong ? mcWhy / mcWrong : 1;
    const stepShare = sols ? multiStep / sols : 1;
    const nKinds = Object.keys(kinds).length;
    const problems = [];
    if (notes.length < T.lessons) problems.push(`only ${notes.length} lessons`);
    if (lessonIssues.length) problems.push(...lessonIssues);
    if (orphans.length) problems.push(`topics not linked from any lesson: ${orphans.join(", ")}`);
    if (thinTopics.length) problems.push(`topics with < ${T.typesPerTopic} question types: ${thinTopics.join(", ")}`);
    if (whyShare < T.whyShare) problems.push(`only ${pct(whyShare)} of wrong options explain the misconception`);
    if (stepShare < T.stepShare) problems.push(`only ${pct(stepShare)} of solutions have a 2+ step hint ladder`);
    if ((u.flashcards || []).length < T.cards) problems.push(`only ${(u.flashcards || []).length} flashcards`);
    if ((u.cues || []).length < T.cues) problems.push(`only ${(u.cues || []).length} cue rows`);
    if (gens.length && nKinds < T.kinds) problems.push(`only ${nKinds} question formats`);

    const kindMix = Object.entries(kinds).map(([k, n]) => `${k} ${pct(n / sols)}`).join(", ");
    console.log(`  ${u.id.padEnd(4)} ${problems.length ? "✗" : "✓"} ${notes.length} lessons · ${(u.flashcards || []).length} cards · ${(u.cues || []).length} cues · ${gens.length} topics / ${gens.reduce((a, g) => a + g.variantNames.length, 0)} types`);
    console.log(`        formats: ${kindMix || "—"} · wrong-option explanations ${pct(whyShare)} · numeric traps ${nums ? pct(numTraps / nums) : "n/a"} · multi-step hints ${pct(stepShare)}`);
    for (const pb of problems) console.log(`        ! ${pb}`);
    if (problems.length) failures++;
  }
}
if (STRICT && failures) { console.error(`\n✗ ${failures} unit(s) below the learning-quality bar`); process.exit(1); }
console.log(failures ? `\n${failures} unit(s) need attention` : "\n✓ every unit meets the learning-quality bar");
