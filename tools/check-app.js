#!/usr/bin/env node
/* ============================================================
 * Application-logic tests — no browser, no dependencies.
 *
 *   node tools/check-app.js
 *
 * Covers what decides how a study session behaves: answer parsing and
 * grading for every question kind, misconception diagnosis, the
 * per-course progress store (namespacing, Leitner ladder, weakness
 * model, mistake log, import/export), schedule lookup and the exam
 * builder. Loads the same scripts index.html does into a sandbox with
 * a stub localStorage and a stub App.
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error("  ✗ " + msg); } }
function eq(a, b, msg) { ok(Object.is(a, b), `${msg} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function section(n) { console.log("\n" + n); }

function freshContext() {
  const mem = new Map();
  const ctx = vm.createContext({ console, Date, Math, JSON });
  ctx.window = ctx;
  ctx.localStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k),
  };
  ctx.document = { getElementById: () => null, addEventListener() {}, querySelectorAll: () => [], documentElement: { style: {} } };
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const files = [...html.matchAll(/<script src="((?:js|courses)\/[^"]+)"><\/script>/g)].map(m => m[1])
    .filter(f => !/js\/app\.js$/.test(f));
  const src = files.map(f => `/* ${f} */\n` + fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
  const stubApp = `const App = { _c: null, course() { return this._c; }, link: v => "#/x/" + v, typeset() {} };`;
  const api = vm.runInContext(stubApp + "\n" + src + "\n;({ STUDY: window.STUDY, Store, Answers, Practice, Exam, Flashcards, App });", ctx, { filename: "bundle.js" });
  return { ...api, mem };
}

const { STUDY, Store, Answers, Practice, Exam, App, mem } = freshContext();
const course = STUDY.getCourse("econ-b251");
App._c = course;

/* ---------- number parsing ---------- */
section("Number parsing");
{
  const P = Answers.parseNumber;
  eq(P("12"), 12, "plain integer");
  eq(P(" 2.5 "), 2.5, "decimal with spaces");
  eq(P("$1,200"), 1200, "dollars with thousands separator");
  eq(P("$12.50"), 12.5, "dollars and cents");
  eq(P("3/4"), 0.75, "fraction");
  eq(P("40%"), 0.4, "percent as a fraction by default");
  eq(P("3.5%", "%"), 3.5, "percent stays a percent when the unit is %");
  eq(P("23.3 years"), 23.3, "trailing unit word ignored");
  ok(Number.isNaN(P("abc")), "garbage is NaN");
  ok(Number.isNaN(P("1/0")), "division by zero is NaN");
  ok(Number.isNaN(P("")), "empty is NaN");
  eq(P("-4"), -4, "negative");
  eq(P("\u221212"), -12, "Unicode minus sign accepted");
  eq(P("\u2013$445"), -445, "en dash before dollars accepted");
}

/* ---------- numeric grading ---------- */
section("Numeric grading");
{
  const g = (p, r) => Answers.grade(p, r).correct;
  const p = { kind: "num", answer: 23.333333 };
  ok(g(p, "23.33"), "two-decimal rounding accepted");
  ok(g(p, "23.3"), "one-decimal rounding accepted for answers >= 1");
  ok(!g(p, "23"), "bare integer is not a rounding of 23.33 under default tolerance");
  ok(!g(p, "24"), "wrong answer rejected");
  ok(g({ kind: "num", answer: 23.333, tol: 0.5 }, "23"), "custom tol widens acceptance");
  ok(g({ kind: "num", answer: 0.125 }, "1/8"), "fraction form accepted");
  ok(!g({ kind: "num", answer: 0.125 }, "0.1"), "too-coarse rounding of a small answer rejected");
  ok(g({ kind: "count", answer: 80 }, "80"), "count exact");
  ok(!g({ kind: "count", answer: 80 }, "80.4"), "count is exact");
  ok(g({ kind: "num", answer: 3.5, unit: "%" }, "3.5"), "percent unit, typed as number");
  ok(g({ kind: "num", answer: 3.5, unit: "%" }, "3.5%"), "percent unit, typed with %");
  ok(g({ kind: "num", answer: 3.5, unit: "%" }, "0.035"), "percent unit, typed as decimal fraction");
  ok(g({ kind: "num", answer: 1500, unit: "$" }, "$1,500"), "dollar unit");
  ok(Answers.grade({ kind: "num", answer: 4 }, "four").valid === false, "non-number is invalid, not wrong");
}

section("Answer display");
{
  eq(Answers.fmtNum({ answer: 1, unit: "tons" }), "1 ton", "singular unit for 1");
  eq(Answers.fmtNum({ answer: 3, unit: "tons" }), "3 tons", "plural unit otherwise");
  eq(Answers.fmtNum({ answer: 1, unit: "acre-feet of water" }), "1 acre-feet of water", "only a trailing plural s on the first word is touched");
  eq(Answers.fmtNum({ answer: 1500, unit: "$" }), "$1,500", "money");
}

/* ---------- diagnosis ---------- */
section("Misconception diagnosis");
{
  const p = { kind: "num", answer: 40, traps: [{ value: 90, why: "You added the alternatives." }] };
  eq(Answers.diagnose(p, "90"), "You added the alternatives.", "named trap fires");
  ok(/reciprocal/.test(Answers.diagnose({ kind: "num", answer: 4 }, "0.25") || ""), "reciprocal detected");
  ok(/sign/.test(Answers.diagnose({ kind: "num", answer: 5 }, "-5") || ""), "sign flip detected");
  eq(Answers.diagnose({ kind: "num", answer: 5 }, "7"), null, "no diagnosis for an unrecognised miss");
  const mc = STUDY.q.mc({ q: "?", right: "R", wrong: [{ t: "W1", why: "because W1" }, "W2"], sol: "s" });
  const w1 = mc.choices.indexOf("W1");
  eq(Answers.diagnose(mc, w1), "because W1", "mc option why returned");
  eq(Answers.diagnose(mc, mc.choices.indexOf("W2")), null, "mc option without why");
}

/* ---------- mc / multi / classify ---------- */
section("Choice-based kinds");
{
  for (let i = 0; i < 30; i++) {
    const mc = STUDY.q.mc({ q: "?", right: "right", wrong: ["a", "b", "c"], sol: "s" });
    eq(mc.choices[mc.answer], "right", "mc answer index tracks the shuffled correct choice");
  }
  for (const right of ["It increases", "It decreases", "It stays the same"]) {
    const kept = STUDY.q.mc({ q: "?", right, wrong: ["It increases", "It decreases", "It stays the same"].filter(x => x !== right), keepOrder: true, sol: "s" });
    eq(kept.choices.join(","), "It increases,It decreases,It stays the same", `keepOrder uses natural order whatever the answer (${right})`);
  }
  const posFirst = new Set();
  for (const right of ["Cat", "Ant", "Bee"]) posFirst.add(STUDY.q.mc({ q: "?", right, wrong: ["Cat", "Ant", "Bee"].filter(x => x !== right), keepOrder: true, sol: "s" }).answer);
  eq(posFirst.size, 3, "keepOrder never pins the right answer to one position");
  const ex = STUDY.q.mc({ q: "?", right: "b", wrong: ["a", "c"], keepOrder: ["c", "b", "a"], sol: "s" });
  eq(ex.choices.join(","), "c,b,a", "explicit keepOrder list is honoured");
  const tf = STUDY.q.tf({ q: "?", truth: false, why: "no", sol: "s" });
  eq(tf.answer, 1, "tf false → index 1");
  ok(Answers.grade(tf, 1).correct && !Answers.grade(tf, 0).correct, "tf grading");

  const multi = STUDY.q.multi({ q: "?", options: [{ t: "a", ok: true }, { t: "b", ok: false }, { t: "c", ok: true }, { t: "d", ok: false }], sol: "s" });
  const right = multi.answer.slice();
  ok(Answers.grade(multi, right).correct, "multi: exact set is correct");
  ok(!Answers.grade(multi, right.slice(0, 1)).correct, "multi: missing one is wrong");
  eq(Answers.grade(multi, right.slice(0, 1)).wrongCount, 1, "multi: wrongCount counts the miss");
  const extra = [...right, [0, 1, 2, 3].find(i => !right.includes(i))];
  eq(Answers.grade(multi, extra).wrongCount, 1, "multi: an extra tick counts as one wrong");
  ok(!Answers.grade(multi, []).valid, "multi: empty selection invalid");

  const cl = STUDY.q.classify({ q: "?", cats: ["Pos", "Norm"], items: [{ t: "x", cat: "Pos" }, { t: "y", cat: "Norm" }, { t: "z", cat: 1 }], sol: "s" });
  ok(cl.items.every((t, i) => cl.answer[i] === ({ x: 0, y: 1, z: 1 })[t]), "classify answers follow shuffled items");
  ok(Answers.grade(cl, cl.answer.slice()).correct, "classify: all right");
  const oneOff = cl.answer.slice(); oneOff[0] = 1 - oneOff[0];
  eq(Answers.grade(cl, oneOff).wrongCount, 1, "classify: wrongCount");
  ok(!Answers.grade(cl, [0, null, 1]).valid, "classify: incomplete is invalid");
  ok(Answers.isBlank(cl, [null, null, null]) && !Answers.isBlank(cl, [0, null, null]), "classify blank detection");
}

/* ---------- store ---------- */
section("Store: per-course namespacing");
{
  Store.use("econ-b251");
  Store.gradeCard("card-a", true);
  Store.recordPractice("gen-a", true, "Shape 1");
  Store.use("other-course");
  eq(Store.getCard("card-a").seen, 0, "another course does not see the card");
  eq(Store.getPractice("gen-a").attempts, 0, "another course does not see practice");
  Store.gradeCard("card-a", false);
  Store.use("econ-b251");
  eq(Store.getCard("card-a").box, 1, "original course kept its own box");
  ok(mem.has("iu-study:econ-b251") && mem.has("iu-study:other-course"), "one localStorage record per course");
  const sm = Store.summary({ id: "other-course", units: [{ flashcards: [{ id: "card-a" }], generators: [] }] });
  eq(sm.deck.started, 1, "summary reads another course without switching");
  eq(Store.current(), "econ-b251", "summary did not switch the active course");
}

section("Store: Leitner ladder");
{
  Store.use("ladder-test");
  let c;
  for (let i = 1; i <= 8; i++) c = Store.gradeCard("L", true);
  eq(c.box, Store.MAX_BOX, "box caps at MAX_BOX");
  c = Store.gradeCard("L", false);
  eq(c.box, 1, "a miss drops to box 1");
  eq(c.lapses, 1, "lapse counted");
  c = Store.gradeCard("L", true);
  ok(c.due > Date.now(), "box 2 is due in the future");
  const st = Store.deckStats([{ id: "L" }, { id: "fresh" }]);
  eq(st.fresh, 1, "unseen card counted fresh");
  eq(st.due, 1, "fresh cards are available to study");
}

section("Store: weakness model & weighted picking");
{
  Store.use("weak-test");
  eq(Store.weakness("never"), 0.85, "untried topic scores high");
  for (let i = 0; i < 10; i++) Store.recordPractice("good", true);
  for (let i = 0; i < 10; i++) Store.recordPractice("bad", false);
  ok(Store.weakness("bad") > Store.weakness("good"), "a failing topic is weaker than a passing one");
  Store.recordPractice("lucky", true);
  ok(Store.weakness("lucky") > Store.weakness("good"), "one lucky answer does not retire a topic");
  const counts = { good: 0, bad: 0 };
  for (let i = 0; i < 2000; i++) counts[Store.pickWeighted([{ id: "good" }, { id: "bad" }]).id]++;
  ok(counts.bad > counts.good * 3, `weighted pick favours weak topics (${counts.bad} vs ${counts.good})`);
  for (let i = 0; i < 4; i++) Store.recordPractice("mixed", i === 0, "Hard shape");
  for (let i = 0; i < 4; i++) Store.recordPractice("mixed", true, "Easy shape");
  const wv = Store.weakVariants("mixed");
  eq(wv.length, 1, "one weak shape surfaced");
  eq(wv[0] && wv[0].name, "Hard shape", "the right shape surfaced");
}

section("Store: mistake log");
{
  Store.use("miss-test");
  for (let i = 0; i < 5; i++) Store.recordMiss({ genId: "g", variant: "v", problem: { q: "q" + i } });
  eq(Store.missCount(), 3, "at most 3 misses kept per shape");
  eq(Store.misses()[0].problem.q, "q4", "newest first");
  for (let i = 0; i < 80; i++) Store.recordMiss({ genId: "g" + i, variant: "v", problem: { q: "x" } });
  eq(Store.missCount(), 60, "log capped at 60");
  const k = Store.misses()[0].key;
  Store.clearMiss(k);
  eq(Store.missCount(), 59, "clearMiss removes one");
  ok(new Set(Store.misses().map(m => m.key)).size === 59, "keys unique");
}

section("Store: export / import / learn progress");
{
  Store.use("io-test");
  Store.gradeCard("X", true);
  Store.setRead("m1", 2, true);
  eq(Store.readCount("m1"), 1, "lesson marked read");
  const dump = Store.exportJSON();
  Store.reset();
  eq(Store.getCard("X").seen, 0, "reset clears");
  Store.importJSON(dump);
  eq(Store.getCard("X").seen, 1, "import restores cards");
  ok(Store.isRead("m1", 2), "import restores lesson progress");
  let threw = false;
  Store.use("io-other");
  try { Store.importJSON(dump); } catch (e) { threw = true; }
  ok(threw, "importing another course's file is refused");
  threw = false;
  try { Store.importJSON("{}"); } catch (e) { threw = true; }
  ok(threw, "a non-progress file is refused");
}

section("Store: spaced practice topics & delayed misses");
{
  Store.use("spacing-test");
  eq(Store.topicStatus("t").state, "new", "untried topic is new");
  Store.recordPractice("t", true);
  eq(Store.topicStatus("t").state, "scheduled", "one correct answer schedules a review");
  ok(Store.topicStatus("t").dueAt > Date.now() + 20 * 3600e3, "first interval is about a day");
  Store.recordPractice("t", true); Store.recordPractice("t", true);
  const st3 = Store.topicStatus("t");
  eq(st3.streak, 3, "streak counts consecutive correct answers");
  eq(st3.state, "mastered", "three in a row with high accuracy is mastered");
  ok(st3.dueAt > Date.now() + 6 * 864e5, "interval grows with the streak (7 days)");
  Store.recordPractice("t", false);
  eq(Store.topicStatus("t").state, "due", "a miss resets the streak and makes the topic due now");
  // Forgetting: simulate time passing by back-dating the last practice.
  Store.recordPractice("old", true); Store.recordPractice("old", true);
  const fresh = Store.weakness("old");
  const raw = JSON.parse(mem.get("iu-study:spacing-test"));
  raw.practice.old.last = Date.now() - 40 * 864e5;
  mem.set("iu-study:spacing-test", JSON.stringify(raw));
  Store.use("x"); Store.use("spacing-test");
  ok(Store.retention("old") < 0.2, "retention decays after a long gap");
  ok(Store.weakness("old") > fresh + 0.2, "weakness rises as a topic is forgotten");
  eq(Store.topicStatus("old").state, "due", "long-unpractised topic is due");
  // Misses wait before they come back.
  Store.recordMiss({ genId: "g1", variant: "v", unitId: "m1", problem: { q: "q" } });
  eq(Store.dueMisses().length, 0, "a fresh miss is not offered again straight away");
  const raw2 = JSON.parse(mem.get("iu-study:spacing-test"));
  raw2.misses[0].at = Date.now() - Store.MISS_DELAY_MS - 1000;
  mem.set("iu-study:spacing-test", JSON.stringify(raw2));
  Store.use("x"); Store.use("spacing-test");
  eq(Store.dueMisses().length, 1, "after the delay the miss is due");
  Store.touchMiss(Store.dueMisses()[0].key);
  eq(Store.dueMisses().length, 0, "missing it again restarts the delay");
}

section("Same-type retry and the daily mix");
{
  const g = course.units.flatMap(u => u.generators || [])[0];
  if (g) {
    const name = g.variantNames[g.variantNames.length - 1];
    for (let i = 0; i < 5; i++) eq(g.makeVariant(name).variant, name, "makeVariant returns the requested type");
    Store.use("econ-b251");
    const q = Practice.buildDaily();
    ok(q.length >= Math.min(6, course.units.flatMap(u => u.generators || []).length), `daily mix has a full queue (${q.length})`);
    let adj = 0;
    for (let i = 1; i < q.length; i++) if (q[i].genId && q[i].genId === q[i - 1].genId) adj++;
    eq(adj, 0, "daily mix never serves the same topic twice in a row");
    ok(q.every(it => it.type === "gen" || it.type === "miss"), "daily items are topics or due misses");
  }
}

/* ---------- schedule ---------- */
section("Schedule lookup");
{
  const at = iso => STUDY.scheduleNow(course, new Date(iso + "T12:00:00"));
  eq(at("2026-09-09").row.unit, "m2", "mid-module date → that module");
  eq(at("2026-09-09").status, "now", "status now");
  eq(at("2026-10-05").row.unit, "m5", "gap between rows → next row");
  eq(at("2026-10-05").status, "next", "status next");
  eq(at("2027-01-10").status, "done", "after the term");
}

/* ---------- course + content wiring ---------- */
section("Course wiring");
{
  ok(course && course.units.length >= 1, "econ-b251 has units");
  const ids = course.units.map(u => u.id);
  for (const r of course.schedule) if (r.unit && ids.includes(r.unit)) ok(true, "");
  for (const p of course.examPresets) ok(p.n > 0 && p.minutes > 0, `preset ${p.id} sized`);
  for (const k of course.keyDates) if (k.unit) ok(course.schedule.some(r => r.unit === k.unit), `key date ${k.label} links a scheduled unit`);
}

/* ---------- exam builder ---------- */
section("Exam builder");
{
  Store.use("econ-b251");
  const ids = Exam._resolveScope("all");
  const withTopics = course.units.filter(u => (u.generators || []).length).length;
  eq(ids.length, withTopics, "resolveScope(all) finds every unit with topics");
  eq(Exam._resolveScope(["m1", "m99"]).filter(x => x === "m99").length, 0, "unknown units are dropped from a scope");
  const pool = Practice.poolFor(ids);
  if (pool.length) {
    const s = Exam._build({ label: "t", ids, n: pool.length, minutes: 10 });
    eq(s.items.length, pool.length, "builds the requested number of items");
    eq(new Set(s.items.map(i => i.genId)).size, pool.length, "spreads across every topic before repeating");
    for (const it of s.items) ok(Answers.isBlank(it.problem, it.response), "items start blank");
    const exp = Exam._build({ label: "t", ids, n: 40, minutes: 10, emphasis: [ids[ids.length - 1]] });
    const inEmph = exp.items.filter(i => i.unitId === ids[ids.length - 1]).length;
    if (ids.length > 1) ok(inEmph >= 16, `emphasis unit over-represented (${inEmph}/40)`);
  }
}

/* ---------- every generated problem round-trips through the grader ---------- */
section("Every topic grades its own answer as correct");
{
  for (const u of course.units) for (const g of (u.generators || [])) {
    for (let i = 0; i < 40; i++) {
      const p = g.make();
      let r;
      if (p.kind === "num" || p.kind === "count") r = String(p.answer);
      else if (p.kind === "mc") r = p.answer;
      else if (p.kind === "multi") r = p.answer.slice();
      else if (p.kind === "classify") r = p.answer.slice();
      const res = Answers.grade(p, r);
      if (!res.correct) { ok(false, `${g.id} [${p.variant}] does not accept its own answer ${JSON.stringify(r)}`); break; }
      if (p.kind === "mc") {
        const wrong = (p.answer + 1) % p.choices.length;
        ok(!Answers.grade(p, wrong).correct, `${g.id} [${p.variant}] accepted a wrong option`);
      }
      ok(true, "");
    }
  }
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) { console.error(`✗ ${failures} failure(s)`); process.exit(1); }
console.log("✓ all app checks passed");
