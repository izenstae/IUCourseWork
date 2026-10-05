#!/usr/bin/env node
/* ============================================================
 * End-to-end UI smoke test in headless Chromium.
 *
 *   node tools/check-browser.js [--shots <dir>]
 *
 * Needs Playwright (global install is fine). Not run in CI. Drives
 * every view of every course: hub, dashboard, learn, flashcards,
 * every practice topic (wrong answer → hint → second attempt →
 * reveal), the concept drill, the redo queue, a full exam sitting,
 * reference search, schedule and progress — at desktop and phone
 * widths, light and dark — and fails on any page error, console
 * error, KaTeX render error or horizontal overflow.
 * ============================================================ */
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright")); }
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const URL = "file://" + path.join(ROOT, "index.html");
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? process.argv[shotsAt + 1] : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
let steps = 0;

async function run() {
  const browser = await chromium.launch();
  for (const vp of [{ name: "desktop", width: 1280, height: 860 }, { name: "phone", width: 390, height: 844 }]) {
    for (const theme of ["light", "dark"]) {
      if (vp.name === "phone" && theme === "light") continue;
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
      const page = await ctx.newPage();
      const tag = `${vp.name}/${theme}`;
      page.on("pageerror", e => errors.push(`[${tag}] pageerror: ${e.message}`));
      page.on("console", m => { if (m.type() === "error") errors.push(`[${tag}] console: ${m.text()}`); });
      page.on("dialog", d => d.accept());
      await page.goto(URL);
      await page.waitForSelector(".course-card");
      await check(page, tag, "hub");

      const courses = await page.evaluate(() => STUDY.courses.map(c => ({ id: c.id, units: c.units.map(u => u.id) })));
      for (const c of courses) {
        for (const v of ["dashboard", "learn", "flashcards", "reference", "schedule", "progress", "exam", "practice"]) {
          await go(page, `#/${c.id}/${v}`);
          await check(page, tag, `${c.id}/${v}`);
        }
        for (const u of c.units) { await go(page, `#/${c.id}/learn/${u}`); await check(page, tag, `${c.id}/learn/${u}`); }
        if (vp.name === "desktop" && theme === "light") await deep(page, c, tag);
      }
      await ctx.close();
    }
  }
  await browser.close();
}

async function go(page, hash) {
  // Same hash fires no hashchange; re-dispatch so the view re-mounts like a nav click.
  await page.evaluate(h => { if (location.hash === h) window.dispatchEvent(new HashChangeEvent("hashchange")); else location.hash = h; }, hash);
  await page.waitForTimeout(120);
  steps++;
}

async function check(page, tag, where) {
  const issues = await page.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 2) out.push(`horizontal overflow ${document.documentElement.scrollWidth}px > ${window.innerWidth}px`);
    document.querySelectorAll(".katex-error").forEach(e => out.push("katex error: " + e.textContent.slice(0, 80)));
    const txt = document.getElementById("view").innerText;
    if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(txt)) out.push("leaked undefined/NaN in view text");
    return out;
  });
  for (const i of issues) errors.push(`[${tag}] ${where}: ${i}`);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${tag.replace("/", "-")}-${where.replace(/[/:]/g, "_")}.png`), fullPage: false });
}

/* Answer the problem on screen. mode: "right" | "wrong". */
async function answer(page, mode) {
  return page.evaluate(m => {
    const zone = document.querySelector("#ansZone, #exAnsZone");
    if (!zone) return "no zone";
    const input = zone.querySelector("[data-ans]");
    if (input) { input.value = m === "right" ? "__RIGHT__" : "-98765"; input.dispatchEvent(new Event("input")); return "num"; }
    const opts = zone.querySelectorAll("[data-opt]:not([disabled])");
    if (opts.length) { opts[m === "right" ? 0 : opts.length - 1].click(); return "mc"; }
    const multi = zone.querySelectorAll("[data-multi]");
    if (multi.length) { multi[0].click(); return "multi"; }
    const sels = zone.querySelectorAll("[data-cls]");
    if (sels.length) { sels.forEach(s => { s.value = "0"; s.dispatchEvent(new Event("change")); }); return "classify"; }
    return "unknown";
  }, mode);
}

async function deep(page, c, tag) {
  // Flashcards: study a deck, flip, grade both ways.
  await go(page, `#/${c.id}/flashcards`);
  if (await page.$("[data-deck]")) {
    await page.click("[data-deck]");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Space");
      await page.keyboard.press(i % 2 ? "1" : "2");
    }
    await check(page, tag, "flashcard session");
  }

  // Learn: mark a lesson read and follow a practice link.
  await go(page, `#/${c.id}/learn`);
  const box = await page.$("[data-read]");
  if (box) { await box.check(); }
  const link = await page.$("[data-practice]");
  if (link) { await link.click(); await page.waitForTimeout(150); await check(page, tag, "lesson → practice"); }

  // Practice: every topic, wrong → hint → second try → reveal, then a right answer.
  const gens = await page.evaluate(id => STUDY.getCourse(id).units.flatMap(u => (u.generators || []).map(g => g.id)), c.id);
  for (const g of gens) {
    for (let k = 0; k < 3; k++) {
      await go(page, `#/${c.id}/practice`);
      await page.click(`[data-gen="${g}"]`);
      await answer(page, "wrong");
      await page.click("#ansCheck");
      if (await page.$("#ansCheck")) { await answer(page, "wrong"); await page.click("#ansCheck"); }
      while (await page.$("#ansHint")) await page.click("#ansHint");
      await check(page, tag, `practice ${g} #${k}`);
      if (!(await page.$("#pNext"))) errors.push(`[${tag}] practice ${g}: no Next button after two misses`);
    }
  }
  // Mixed and weak sessions + keyboard flow.
  await go(page, `#/${c.id}/practice`);
  await page.click("#pMix");
  for (let i = 0; i < 6; i++) {
    await answer(page, "right");
    await page.click("#ansCheck").catch(() => {});
    if (await page.$("#ansCheck")) await page.click("#ansHint").catch(() => {});
    while (await page.$("#ansHint")) await page.click("#ansHint");
    await page.click("#pNext");
  }
  await check(page, tag, "mixed session");
  // Daily mix: dashboard link → full session → summary screen.
  await go(page, `#/${c.id}/practice/daily`);
  for (let i = 0; i < 30 && !(await page.$("#dAgain")); i++) {
    await answer(page, i % 3 ? "right" : "wrong");
    if (await page.$("#ansCheck")) await page.click("#ansCheck");
    while (await page.$("#ansHint")) await page.click("#ansHint");
    if (await page.$("#pNext")) await page.click("#pNext");
  }
  if (!(await page.$("#dAgain"))) errors.push(`[${tag}] daily mix never reached its summary screen`);
  await check(page, tag, "daily mix summary");
  await go(page, `#/${c.id}/dashboard`);
  if (!/Daily mix/.test(await page.innerText("#view"))) errors.push(`[${tag}] dashboard does not offer the daily mix`);
  // Concept drill.
  await go(page, `#/${c.id}/practice`);
  await page.click("#pIdent");
  if (await page.$("[data-opt]")) {
    for (let i = 0; i < 3; i++) { await page.click("[data-opt]"); await page.click("#idNext"); }
    await check(page, tag, "concept drill");
  }
  // Redo queue.
  await go(page, `#/${c.id}/practice`);
  if (await page.$("#pRedo:not([disabled])")) {
    await page.click("#pRedo");
    await answer(page, "wrong");
    await page.click("#ansCheck");
    await check(page, tag, "redo");
  }

  // Exam: custom 8-question sitting, answer everything, navigate, flag, submit.
  await go(page, `#/${c.id}/exam`);
  await page.click('[data-preset="custom"]');
  await page.selectOption("#exN", "10");
  await page.click("#exStartCustom");
  for (let i = 0; i < 10; i++) {
    await answer(page, i % 2 ? "wrong" : "right");
    if (i === 3) await page.click("#exFlag");
    if (await page.$("#exNext")) await page.click("#exNext");
  }
  await page.click("[data-jump='0']");
  await check(page, tag, "exam question");
  await page.click("#exSubmitEarly");
  await page.waitForSelector(".exam-review");
  await check(page, tag, "exam report");
  // A preset that exists.
  await go(page, `#/${c.id}/exam`);
  const preset = await page.$(".preset-card:not(.disabled)[data-preset]:not([data-preset='custom'])");
  if (preset) { await preset.click(); await page.click("#exAbandon"); }

  // Reference search + selection.
  await go(page, `#/${c.id}/reference`);
  await page.fill("#refSearch", "cost");
  await page.waitForTimeout(80);
  const pick = await page.$(".ref-hit:not([hidden]) [data-pick]");
  if (pick) await pick.check();
  await check(page, tag, "reference search");
  await page.fill("#refSearch", "zzzzqqq");
  if (await page.$eval("#refEmpty", e => e.hidden)) errors.push(`[${tag}] reference: empty-search message not shown`);

  // Progress shows the work.
  await go(page, `#/${c.id}/progress`);
  const txt = await page.innerText("#view");
  if (!/Practice accuracy by topic/.test(txt) || /No attempts yet/.test(txt)) errors.push(`[${tag}] progress did not record practice`);
  await check(page, tag, "progress after study");
  await go(page, `#/`);
  await check(page, tag, "hub after study");
}

run().then(() => {
  console.log(`${steps} navigation steps`);
  if (errors.length) {
    console.error(`✗ ${errors.length} issue(s):`);
    [...new Set(errors)].slice(0, 80).forEach(e => console.error("  " + e));
    process.exit(1);
  }
  console.log("✓ browser smoke test passed");
}).catch(e => { console.error(e); process.exit(1); });
