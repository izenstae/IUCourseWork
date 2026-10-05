/* ============================================================
 * Practice — generated problems with worked solutions.
 *
 * Session types share one runner:
 *   · topic  — drill one concept
 *   · mixed  — interleaved topics, topic hidden until you answer
 *   · weak   — like mixed, weighted toward your weakest topics
 *   · redo   — re-attempt problems you previously missed
 * plus a "Which concept?" recognition drill.
 *
 * Feedback rules (carried over from the MATH 340 tool):
 *   1. A wrong first answer buys a hint and a second attempt — and,
 *      for multiple choice, the misconception behind the option you
 *      picked — rather than the answer.
 *   2. Only unaided first attempts count as correct in your stats.
 * ============================================================ */
const Practice = (() => {
  let current = null;
  let filterUnit = "all";
  let filterCourse = null;

  function course() { return App.course(); }

  function solSteps(sol) {
    const parts = (String(sol || "").match(/<div class="sol-step">[\s\S]*?<\/div>/g) || []);
    return parts.length ? parts : [sol];
  }

  function unitsWithGenerators() {
    return course().units.filter(u => u.generators && u.generators.length);
  }
  function poolFor(unitId) {
    const pool = [];
    for (const u of unitsWithGenerators()) {
      if (Array.isArray(unitId) ? !unitId.includes(u.id) : (unitId && unitId !== "all" && unitId !== u.id)) continue;
      pool.push(...u.generators);
    }
    return pool;
  }
  function findGen(id) {
    for (const u of course().units) {
      for (const g of (u.generators || [])) if (g.id === id) return { gen: g, unit: u };
    }
    return null;
  }

  /* ---------------- home ---------------- */

  function home(el, opts) {
    current = null;
    Identify.stop();
    if (filterCourse !== course().id) { filterCourse = course().id; filterUnit = "all"; }
    if (opts && opts.unit) filterUnit = opts.unit;
    const units = unitsWithGenerators();
    if (!units.length) {
      el.innerHTML = `<div class="empty-state"><div class="big">✎</div>No practice topics for this course yet — they appear as modules are added.</div>`;
      return;
    }
    const options = [`<option value="all">All modules</option>`]
      .concat(units.map(u => `<option value="${u.id}" ${filterUnit === u.id ? "selected" : ""}>${u.title}</option>`)).join("");

    const missCount = Store.missCount();
    const scopePool = poolFor(filterUnit);
    const weakest = scopePool
      .map(g => ({ g, w: Store.weakness(g.id), p: Store.getPractice(g.id) }))
      .filter(x => x.p.attempts >= 2)
      .sort((a, b) => b.w - a.w).slice(0, 3);
    const nTypes = scopePool.reduce((a, g) => a + g.variantNames.length, 0);

    let rows = "";
    for (const u of units) {
      if (filterUnit !== "all" && filterUnit !== u.id) continue;
      rows += `<div class="topic-group-head">${u.title}</div>`;
      for (const g of u.generators) {
        const p = Store.getPractice(g.id);
        const acc = p.attempts ? Math.round(100 * p.correct / p.attempts) : null;
        const recent = p.recent.slice(-5).map(r => `<span class="dot ${r ? "dot-ok" : "dot-bad"}">●</span>`).join("");
        const seenTypes = Object.keys(p.variants || {}).length;
        rows += `
          <div class="topic-row">
            <div style="flex:1; min-width:0;">
              <div class="deck-name">${g.name}</div>
              <div class="deck-meta">${g.blurb || ""} <span class="pill">${seenTypes}/${g.variantNames.length} question types seen</span></div>
            </div>
            <div class="muted topic-score">${p.attempts ? `${p.correct}/${p.attempts} (${acc}%)<br>${recent}` : "not started"}</div>
            <button class="btn btn-sm" data-gen="${g.id}">Practice</button>
          </div>`;
      }
    }

    el.innerHTML = `
      <div class="card">
        <h2>Practice</h2>
        <p class="muted">${scopePool.length} topics · ${nTypes} structurally different question types. Every topic cycles through all of its types before any repeats, and the numbers, names and scenarios are regenerated each time — so you learn to <em>recognise and apply the idea</em>, not to remember an answer. Questions come in the same formats as the exams: multiple choice, drop-down, select-all, numerical and graph-reading.</p>
        <div class="toolbar">
          <select class="select" id="pFilter" aria-label="Module filter">${options}</select>
          <button class="btn" id="pWeak">◎ Target my weak spots</button>
          <button class="btn btn-ghost" id="pMix">▶ Mixed session</button>
          <button class="btn btn-ghost" id="pIdent">⁇ Which concept? drill</button>
          <button class="btn btn-ghost" id="pRedo" ${missCount ? "" : "disabled"}>↺ Redo my misses${missCount ? ` (${missCount})` : ""}</button>
        </div>
        <p class="muted" style="margin:-6px 0 14px;">In a mixed session the topic stays hidden until you answer, because spotting <em>which</em> idea a question is testing is half of what the exam tests. Percentages are <b>first-try, unaided</b> — a hint or second attempt counts as a miss.</p>
        ${weakest.length ? `<div class="callout"><b>Weakest right now:</b> ${weakest.map(x => `${x.g.name} <span class="muted">(${Math.round(100 * x.p.correct / x.p.attempts)}%)</span>`).join(" · ")}. "Target my weak spots" draws mostly from these.</div>` : ""}
        <div>${rows}</div>
      </div>`;

    el.querySelector("#pFilter").addEventListener("change", e => { filterUnit = e.target.value; home(el); });
    el.querySelector("#pMix").addEventListener("click", () => startMixed(el, "mixed"));
    el.querySelector("#pWeak").addEventListener("click", () => startMixed(el, "weak"));
    el.querySelector("#pIdent").addEventListener("click", () => Identify.start(el, filterUnit));
    if (missCount) el.querySelector("#pRedo").addEventListener("click", () => startRedo(el));
    el.querySelectorAll("[data-gen]").forEach(b => b.addEventListener("click", () => startTopic(el, b.dataset.gen)));
    App.typeset(el);
  }

  /* ---------------- sessions ---------------- */

  function newProblem(gen, unit, opts) {
    return {
      gen, unit, problem: gen.make(), mode: opts.mode, filter: opts.filter,
      attempts: 0, hintsShown: 0, answered: false, aided: false,
      response: null, eliminated: new Set(), streak: opts.streak || { n: 0, right: 0 },
    };
  }
  function startTopic(el, genId) {
    const found = findGen(genId);
    if (!found) return home(el);
    current = newProblem(found.gen, found.unit, { mode: "topic" });
    render(el);
  }
  function startMixed(el, mode) {
    const pool = poolFor(filterUnit);
    if (!pool.length) return home(el);
    const gen = mode === "weak" ? Store.pickWeighted(pool, null) : STUDY.util.rotate("mixed:" + course().id + filterUnit, pool);
    const found = findGen(gen.id);
    current = newProblem(found.gen, found.unit, { mode, filter: filterUnit });
    render(el);
  }
  function startRedo(el) {
    const queue = Store.misses();
    if (!queue.length) return home(el);
    runRedo(el, queue, 0);
  }
  function runRedo(el, queue, idx) {
    if (idx >= queue.length) {
      el.innerHTML = `
        <div class="card narrow center">
          <div class="big-mark">✓</div>
          <h2>Redo queue worked through</h2>
          <p class="muted">Problems you got right this time have been cleared; the ones you missed again are still waiting.</p>
          <button class="btn" id="redoDone">Back to practice</button>
        </div>`;
      el.querySelector("#redoDone").addEventListener("click", () => home(el));
      return;
    }
    const m = queue[idx];
    const found = findGen(m.genId);
    current = {
      gen: found ? found.gen : { id: m.genId, name: m.genName || m.genId },
      unit: found ? found.unit : { id: m.unitId, short: m.unitShort || "" },
      problem: { ...m.problem, variant: m.variant },
      mode: "redo", redo: { queue, idx, key: m.key },
      attempts: 0, hintsShown: 0, answered: false, aided: false, response: null, eliminated: new Set(),
      streak: { n: 0, right: 0 },
    };
    render(el);
  }
  function nextProblem(el) {
    const c = current;
    if (c.mode === "redo") return runRedo(el, c.redo.queue, c.redo.idx + 1);
    if (c.mode === "topic") {
      current = newProblem(c.gen, c.unit, { mode: "topic", streak: c.streak });
      return render(el);
    }
    const pool = poolFor(c.filter);
    if (!pool.length) return home(el);
    const gen = c.mode === "weak" ? Store.pickWeighted(pool, c.gen.id) : STUDY.util.rotate("mixed:" + course().id + (c.filter || "all"), pool);
    const found = findGen(gen.id);
    current = newProblem(found.gen, found.unit, { mode: c.mode, filter: c.filter, streak: c.streak });
    render(el);
  }

  /* ---------------- runner ---------------- */

  function render(el) {
    const c = current;
    if (!c) return home(el);
    const p = c.problem;
    const steps = solSteps(p.sol);
    const stats = Store.getPractice(c.gen.id);
    const hideTopic = (c.mode === "mixed" || c.mode === "weak") && !c.answered;

    const label = c.mode === "redo"
      ? `<span class="pill pill-amber">Redo · ${c.redo.idx + 1} of ${c.redo.queue.length}</span>`
      : hideTopic
        ? `<span class="pill">${c.mode === "weak" ? "Weak-spot session" : "Mixed session"} · topic hidden</span>`
        : `<span class="pill pill-accent">${c.unit.short || c.unit.title}</span>` + (c.answered && p.variant ? ` <span class="pill">${p.variant}</span>` : "");

    el.innerHTML = `
      <div class="card narrow">
        <div class="run-head">
          <span>${label}</span>
          <span class="muted">${hideTopic ? "" : c.gen.name + " · "}${c.streak.n ? `session ${c.streak.right}/${c.streak.n}` : stats.attempts ? `${stats.correct}/${stats.attempts} first-try` : "first attempt"}</span>
        </div>
        <div class="q-text">${p.q}</div>
        <div id="ansZone">${Answers.render(p, c.response, { reveal: c.answered, eliminated: c.eliminated })}</div>
        <div class="answer-actions" id="actZone">
          ${c.answered ? "" : `<button class="btn" id="ansCheck">Check</button>
          <button class="btn btn-ghost" id="ansHint">${steps.length > 1 ? "Hint" : "Show solution"}</button>`}
        </div>
        <div id="resultZone"></div>
        <div id="hintZone"></div>
        <div class="run-foot">
          <button class="btn btn-ghost btn-sm" id="pBack">← All topics</button>
          <span style="flex:1"></span>
          <span id="nextSlot"></span>
        </div>
      </div>`;

    const ansZone = el.querySelector("#ansZone");
    const hintZone = el.querySelector("#hintZone");
    const resultZone = el.querySelector("#resultZone");
    const nextSlot = el.querySelector("#nextSlot");
    let read = Answers.bind(ansZone, p, c.response, r => { c.response = r; }, () => el.querySelector("#ansCheck")?.click());

    const showHint = () => {
      if (c.answered) return;
      c.aided = true;
      c.hintsShown = Math.min(c.hintsShown + 1, steps.length);
      if (c.hintsShown >= steps.length) return reveal(false, true);
      hintZone.innerHTML = `<div class="hint-box"><b>Hint ${c.hintsShown}</b>
        <span class="muted">— step ${c.hintsShown} of the worked solution. Using a hint logs this problem as a miss.</span>
        ${steps.slice(0, c.hintsShown).join("")}</div>`;
      const btn = el.querySelector("#ansHint");
      if (btn) btn.textContent = c.hintsShown + 1 >= steps.length ? "Show full solution" : "Another hint";
      App.typeset(hintZone);
    };

    const reveal = (solved, gaveUp, note) => {
      if (c.answered) return;
      const unaided = solved && !c.aided && c.attempts <= 1;
      c.answered = true;
      c.streak.n++; if (unaided) c.streak.right++;

      if (c.mode === "redo") {
        if (solved) Store.clearMiss(c.redo.key);
      } else {
        Store.recordPractice(c.gen.id, unaided, p.variant);
        if (!unaided) {
          Store.recordMiss({
            genId: c.gen.id, genName: c.gen.name, unitId: c.unit.id,
            unitShort: c.unit.short || c.unit.title, variant: p.variant, problem: stripVariant(p),
          });
        }
      }
      const verdict = solved
        ? (unaided ? "✓ Correct!" : `✓ Correct — but with ${c.aided ? "a hint" : "a second attempt"}, so it is logged as a miss and will come back in your redo queue.`)
        : gaveUp ? "Solution revealed — logged as a miss." : "✗ Not quite.";

      ansZone.innerHTML = Answers.render(p, c.response, { reveal: true, eliminated: c.eliminated });
      resultZone.innerHTML = `
        <div class="verdict ${solved && unaided ? "ok" : solved ? "warn" : "bad"}">${verdict}
          ${!solved && p.kind !== "classify" ? ` <span class="verdict-ans">The answer is ${Answers.describe(p)}.</span>` : ""}</div>
        ${note ? `<p class="muted note">${note}</p>` : ""}
        ${(c.mode === "mixed" || c.mode === "weak") ? `<p class="muted note">Topic: <b>${c.gen.name}</b> · question type: <b>${p.variant}</b></p>` : ""}
        <div class="solution"><b>Worked solution</b>${p.sol}${Answers.whyList(p, c.response)}</div>`;
      hintZone.innerHTML = "";
      el.querySelector("#actZone").innerHTML = "";
      const next = document.createElement("button");
      next.className = "btn"; next.id = "pNext";
      next.textContent = c.mode === "redo" ? (c.redo.idx + 1 >= c.redo.queue.length ? "Finish redo →" : "Next miss →") : "Next problem →";
      nextSlot.appendChild(next);
      next.addEventListener("click", () => nextProblem(el));
      next.focus();
      App.typeset(ansZone);
      App.typeset(resultZone);
    };

    if (!c.answered) {
      el.querySelector("#ansCheck").addEventListener("click", () => {
        const r = read();
        c.response = r;
        const g = Answers.grade(p, r);
        if (!g.valid) {
          const msg = p.kind === "num" || p.kind === "count" ? "Please enter a number (e.g. <code>12</code>, <code>2.5</code>, <code>3/4</code>, <code>$40</code>)."
            : p.kind === "classify" ? "Choose a category for every item first." : "Pick an answer first.";
          resultZone.innerHTML = `<div class="verdict bad">${msg}</div>`;
          return;
        }
        c.attempts++;
        if (g.correct) {
          return reveal(true, false, g.rounded ? `Accepted as a correct rounding — the exact value is ${Answers.fmtNum(p)}.` : null);
        }
        const why = Answers.diagnose(p, r);
        // Two-option questions get no second try: the retry would be a coin flip.
        const canRetry = c.attempts === 1 && !c.aided && !(p.kind === "mc" && p.choices.length <= 2);
        if (canRetry) {
          if (p.kind === "mc") {
            c.eliminated.add(r);
            c.response = null;
            ansZone.innerHTML = Answers.render(p, null, { eliminated: c.eliminated });
            read = Answers.bind(ansZone, p, null, rr => { c.response = rr; });
            App.typeset(ansZone);
          }
          resultZone.innerHTML = `<div class="verdict bad">✗ Not quite — try once more.</div>
            ${why ? `<p class="muted note">${why}</p>` : ""}`;
          App.typeset(resultZone);
          showHint();
          ansZone.querySelector("[data-ans]")?.select();
          return;
        }
        reveal(false, false, why);
      });
      el.querySelector("#ansHint").addEventListener("click", showHint);
      ansZone.querySelector("[data-ans]")?.focus();
    }
    el.querySelector("#pBack").addEventListener("click", () => home(el));
    App.typeset(el);
  }

  function stripVariant(p) {
    const { variant, ...rest } = p;
    return rest;
  }

  function onKey(e, el) {
    if (!current || e.target.matches("input, textarea, select")) return;
    // Enter on a focused button is already a click.
    if (e.key === "Enter" && e.target.matches("button, a")) return;
    if (current.answered) {
      if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); el.querySelector("#pNext")?.click(); }
      return;
    }
    if (e.key === "Enter") { e.preventDefault(); el.querySelector("#ansCheck")?.click(); return; }
    if (Answers.key(el.querySelector("#ansZone"), current.problem, e)) e.preventDefault();
  }

  return { mount: home, solSteps, poolFor, findGen, onKey, active: () => !!current };
})();

/* ============================================================
 * "Which concept?" drill — read a question stem and name the idea
 * it is testing, without answering it. Recognising which tool a
 * question wants is a separate skill from using the tool.
 * ============================================================ */
const Identify = (() => {
  let s = null;

  function start(el, unitId) {
    const pool = Practice.poolFor(unitId).filter(g => g.identify);
    if (pool.length < 4) {
      el.innerHTML = `<div class="card narrow center"><p class="muted">The concept drill needs at least four topics in scope — choose "All modules".</p><button class="btn" id="idBack">Back</button></div>`;
      el.querySelector("#idBack").addEventListener("click", () => Practice.mount(el));
      return;
    }
    s = { pool, asked: 0, right: 0 };
    nextQ(el);
  }

  function nextQ(el) {
    const gen = STUDY.util.rotate("identify", s.pool);
    s.q = gen.make();
    s.gen = gen;
    s.options = STUDY.util.shuffle([gen, ...STUDY.util.shuffle(s.pool.filter(g => g.id !== gen.id)).slice(0, 3)]);
    s.picked = null;
    render(el);
  }

  function render(el) {
    const picked = s.picked;
    const p = s.q;
    const preview = p.kind === "mc" || p.kind === "multi"
      ? `<ul class="stem-opts">${p.choices.map(c => `<li>${c}</li>`).join("")}</ul>`
      : p.kind === "classify" ? `<ul class="stem-opts">${p.items.map(c => `<li>${c}</li>`).join("")}</ul>` : "";
    el.innerHTML = `
      <div class="card narrow">
        <div class="run-head">
          <span class="pill pill-accent">Which concept?</span>
          <span class="muted">${s.asked ? `${s.right}/${s.asked} correct` : "don't solve it — name the idea"}</span>
        </div>
        <div class="q-text">${p.q}${preview}</div>
        <p class="muted">Which topic is this question really testing?</p>
        <div class="mc-opts">
          ${s.options.map((g, i) => {
            let cls = "";
            if (picked != null) {
              if (g.id === s.gen.id) cls = picked === i ? "sel-right" : "reveal-right";
              else if (picked === i) cls = "sel-wrong";
            }
            return `<button class="mc-opt ${cls}" data-opt="${i}" ${picked != null ? "disabled" : ""}><span class="opt-key">${String.fromCharCode(65 + i)}</span><span class="opt-text">${g.name}<span class="muted opt-sub">${g.blurb || ""}</span></span></button>`;
          }).join("")}
        </div>
        <div id="idResult"></div>
        <div class="run-foot">
          <button class="btn btn-ghost btn-sm" id="idBack">← All topics</button>
          <span style="flex:1"></span>
          ${picked != null ? `<button class="btn" id="idNext">Next →</button>` : ""}
        </div>
      </div>`;

    el.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
      s.picked = Number(b.dataset.opt);
      s.asked++;
      const correct = s.options[s.picked].id === s.gen.id;
      if (correct) s.right++;
      render(el);
      const zone = el.querySelector("#idResult");
      zone.innerHTML = `<div class="verdict ${correct ? "ok" : "bad"}">${correct ? "✓ Right" : "✗ It is " + s.gen.name}</div>
        <div class="solution"><b>Why</b><div class="sol-step">${s.gen.blurb || ""}</div>
        <div class="sol-step">Question type: <b>${p.variant}</b>. First step of the worked solution:</div>
        ${Practice.solSteps(p.sol)[0]}</div>`;
      App.typeset(zone);
      el.querySelector("#idNext")?.focus();
    }));
    el.querySelector("#idBack").addEventListener("click", () => { s = null; Practice.mount(el); });
    el.querySelector("#idNext")?.addEventListener("click", () => nextQ(el));
    App.typeset(el);
  }

  function onKey(e, el) {
    if (!s) return false;
    if (e.key === "Enter" && e.target.matches("button, a")) return true;
    if (s.picked != null && (e.key === "Enter" || e.key === "ArrowRight")) { el.querySelector("#idNext")?.click(); return true; }
    if (s.picked == null && /^[1-4a-d]$/i.test(e.key)) {
      const i = /\d/.test(e.key) ? Number(e.key) - 1 : e.key.toLowerCase().charCodeAt(0) - 97;
      el.querySelector(`[data-opt="${i}"]`)?.click();
      return true;
    }
    return false;
  }

  return { start, onKey, active: () => !!s, stop() { s = null; } };
})();
