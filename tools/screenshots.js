#!/usr/bin/env node
/* ============================================================
 * Regenerate the README screenshots in docs/assets/.
 *
 *   node tools/screenshots.js [output-dir]
 *
 * Needs Playwright (a global install is fine). Not part of CI. Seeds a
 * plausible few-weeks-in study history for the first course, then
 * captures the hub, dashboard, a lesson, a practice question mid-hint
 * and an exam question. Math.random is seeded for repeatability.
 * ============================================================ */
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright")); }
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const OUT = process.argv[2] || path.join(ROOT, "docs", "assets");
const URL = "file://" + path.join(ROOT, "index.html");
fs.mkdirSync(OUT, { recursive: true });

const seedRandom = `(() => { let s = 20261005; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;

function seed() {
  const c = STUDY.courses[0];
  const DAY = 864e5, now = Date.now();
  const st = { v: 1, cards: {}, practice: {}, misses: [], exams: [], sheet: [], read: {}, activity: {} };
  let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  c.units.forEach((u, ui) => {
    const lvl = ui === 0 ? 0.8 : 0.45;
    (u.flashcards || []).forEach(cd => {
      if (rnd() > lvl + 0.1) return;
      const box = Math.max(1, Math.min(6, Math.round(lvl * 6 * (0.6 + rnd() * 0.7))));
      st.cards[cd.id] = { box, due: now + (rnd() < 0.3 ? -DAY : DAY * box), seen: box + 1, lapses: rnd() < 0.3 ? 1 : 0 };
    });
    st.read[u.id] = (u.notes || []).map((_, i) => i).filter(i => ui === 0 || i < 3);
    (u.generators || []).forEach(g => {
      const acc = ui === 0 ? 0.8 : 0.6;
      const n = 4 + Math.floor(rnd() * 8);
      const p = { attempts: 0, correct: 0, recent: [], variants: {} };
      for (let k = 0; k < n; k++) {
        const ok = rnd() < acc ? 1 : 0;
        p.attempts++; p.correct += ok; p.recent.push(ok); if (p.recent.length > 10) p.recent.shift();
        const v = g.variantNames[k % g.variantNames.length];
        p.variants[v] = p.variants[v] || { a: 0, c: 0 }; p.variants[v].a++; p.variants[v].c += ok;
      }
      st.practice[g.id] = p;
    });
  });
  const gens = c.units.flatMap(u => (u.generators || []).map(g => ({ g, u })));
  for (let i = 0; i < 4 && gens.length; i++) {
    const { g, u } = gens[(i * 3) % gens.length];
    const { variant, ...problem } = g.make();
    st.misses.push({ key: "seed" + i, genId: g.id, genName: g.name, unitId: u.id, unitShort: u.short, variant, problem, at: now - i * DAY });
  }
  st.exams.push({ at: now - 3 * DAY, label: "Weekly Canvas quiz", scopeLabel: "M2 · PPC", n: 10, correct: 7, seconds: 980, limit: 20 });
  for (let d = 0; d < 20; d++) if (rnd() < 0.75) st.activity[new Date(now - d * DAY).toISOString().slice(0, 10)] = 5 + Math.floor(rnd() * 30);
  localStorage.setItem("iu-study:" + c.id, JSON.stringify(st));
  localStorage.setItem("iu-study-theme", "light");
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript(seedRandom);
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.evaluate(seed);
  const cid = await page.evaluate(() => STUDY.courses[0].id);
  const shot = async (hash, file, prep) => {
    await page.goto(URL + hash);
    await page.waitForTimeout(400);
    if (prep) await prep();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, file) });
    console.log("wrote", file);
  };
  await shot("#/", "hub.png");
  await shot(`#/${cid}/dashboard`, "dashboard.png");
  await shot(`#/${cid}/learn/m2`, "learn.png", async () => { await page.evaluate(() => document.querySelector("#lesson-4")?.scrollIntoView()); });
  await shot(`#/${cid}/practice`, "practice.png", async () => {
    // A multiple-choice question answered wrong once: struck option, misconception note, hint.
    for (let i = 0; i < 20; i++) {
      await page.click(`[data-gen="b251-m2-compadv"]`).catch(() => page.click("[data-gen]"));
      if (await page.$("[data-opt]")) break;
      await page.click("#pBack");
    }
    const opts = await page.$$("[data-opt]");
    const ans = await page.evaluate(() => {
      const picked = [...document.querySelectorAll("[data-opt]")];
      return picked.length;
    });
    if (opts.length) {
      // pick a wrong option: try each until the retry note appears
      for (let k = ans - 1; k >= 0; k--) {
        await opts[k].click();
        await page.click("#ansCheck");
        if (await page.$(".hint-box") || await page.$("#pNext")) break;
      }
    }
  });
  await shot(`#/${cid}/exam`, "exam.png", async () => {
    await page.click('[data-preset="quiz"]');
    await page.waitForTimeout(200);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { const o = document.querySelector("[data-opt]"); if (o) o.click(); const s = document.querySelector("[data-cls]"); if (s) { s.value = "0"; s.dispatchEvent(new Event("change")); } });
      await page.click("#exNext");
    }
  });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
