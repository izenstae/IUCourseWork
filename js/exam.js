/* ============================================================
 * Exam mode — timed, mixed, deferred-feedback question sets.
 *
 * Exams and quizzes are taken under a clock, with no hints, no topic
 * labels and no feedback until the end. Nothing else in the tool
 * rehearses that, so this does:
 *   · questions spread across as many topics as possible, interleaved
 *   · presets sized from the course syllabus (course.examPresets)
 *   · flag-for-review and free navigation, like a real exam
 *   · afterwards: score, per-topic breakdown, every worked solution,
 *     and every miss pushed into practice stats and the redo queue
 * ============================================================ */
const Exam = (() => {
  let s = null;
  let ticker = null;

  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }
  function course() { return App.course(); }

  /* The unit whose scheduled start most recently passed — what a weekly
   * quiz covers. Falls back to the last registered unit. */
  function recentUnitId() {
    const c = course();
    const today = new Date().toISOString().slice(0, 10);
    const have = new Set(c.units.filter(u => u.generators && u.generators.length).map(u => u.id));
    const rows = c.schedule.filter(r => r.unit && have.has(r.unit) && r.start <= today);
    if (rows.length) return rows[rows.length - 1].unit;
    const units = c.units.filter(u => have.has(u.id));
    return units.length ? units[units.length - 1].id : null;
  }

  function resolveScope(scope) {
    const have = course().units.filter(u => u.generators && u.generators.length).map(u => u.id);
    if (scope === "recent") { const r = recentUnitId(); return r ? [r] : []; }
    if (Array.isArray(scope)) return scope.filter(id => have.includes(id));
    if (scope && scope !== "all") return have.includes(scope) ? [scope] : [];
    return have;
  }
  function scopeLabel(ids) {
    const c = course();
    const all = c.units.filter(u => u.generators && u.generators.length);
    if (ids.length === all.length && ids.length > 1) return `All ${c.unitNoun ? c.unitNoun.toLowerCase() + "s" : "units"} so far`;
    return ids.map(id => (STUDY.getUnit(c, id) || {}).short || id).join(", ");
  }

  /* ---------------- setup ---------------- */

  function home(el) {
    stopTicker();
    s = null;
    const c = course();
    const units = c.units.filter(u => u.generators && u.generators.length);
    if (!units.length) {
      el.innerHTML = `<div class="empty-state"><div class="big">⏱</div>No practice topics yet, so there is nothing to build an exam from.</div>`;
      return;
    }
    const presets = (c.examPresets || []).map(p => ({ ...p, ids: resolveScope(p.scope) }));
    const past = Store.exams();
    el.innerHTML = `
      <div class="card">
        <h2>Exam mode</h2>
        <p class="muted">A timed, mixed set with no hints, no topic labels and no feedback until you submit — the conditions quizzes and exams are graded under. ${c.examFormat ? `<b>Real format:</b> ${c.examFormat}` : ""} Everything you miss goes into your practice stats and redo queue.</p>
        <div class="grid-2">
          ${presets.map(p => `
            <div class="preset-card ${p.ids.length ? "" : "disabled"}" data-preset="${p.id}" role="button" tabindex="0" aria-disabled="${!p.ids.length}">
              <div class="preset-head"><span class="preset-ico">${p.icon || "▦"}</span><b>${p.label}</b></div>
              <p class="muted preset-blurb">${p.blurb || ""}</p>
              <span class="pill">${p.n} questions</span> <span class="pill">${p.minutes} min</span>
              <div class="muted preset-scope">${p.ids.length ? "Covers: " + scopeLabel(p.ids) : "Unlocks when its modules are added"}</div>
            </div>`).join("")}
          <div class="preset-card" data-preset="custom" role="button" tabindex="0">
            <div class="preset-head"><span class="preset-ico">⚙</span><b>Custom set</b></div>
            <p class="muted preset-blurb">Pick the modules, length and time limit yourself.</p>
          </div>
        </div>
      </div>
      <div class="card" id="customCard" hidden>
        <h3 class="mt0">Custom set</h3>
        <div class="toolbar">
          <label class="muted">Scope
            <select class="select" id="exScope">
              <option value="all">All modules</option>
              ${units.map(u => `<option value="${u.id}">${u.title}</option>`).join("")}
            </select></label>
          <label class="muted">Questions
            <select class="select" id="exN">${[5, 10, 15, 20, 25, 30, 40].map(n => `<option ${n === 10 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="muted">Time limit
            <select class="select" id="exMin">${[10, 15, 20, 30, 45, 60, 75, 90, 120].map(m => `<option ${m === 20 ? "selected" : ""}>${m}</option>`).join("")}<option value="0">no limit</option></select></label>
          <button class="btn" id="exStartCustom">Start</button>
        </div>
      </div>
      ${past.length ? `<div class="card">
        <h3 class="mt0">Past sittings</h3>
        <table class="tbl">
          <tr><th>When</th><th>Set</th><th>Score</th><th>Time</th></tr>
          ${past.map(e => {
            const pct = Math.round(100 * e.correct / e.n);
            return `<tr><td>${new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
              <td>${e.label}<div class="muted small">${e.scopeLabel || ""}</div></td>
              <td><b>${e.correct}/${e.n}</b> <span class="pill ${pct >= 80 ? "pill-green" : pct >= 60 ? "pill-amber" : "pill-red"}">${pct}%</span></td>
              <td class="muted">${fmtClock(e.seconds)}${e.limit ? " of " + e.limit + ":00" : ""}</td></tr>`;
          }).join("")}
        </table></div>` : ""}`;

    const customCard = el.querySelector("#customCard");
    el.querySelectorAll("[data-preset]").forEach(node => {
      const go = () => {
        if (node.dataset.preset === "custom") { customCard.hidden = false; customCard.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
        const p = presets.find(x => x.id === node.dataset.preset);
        if (!p || !p.ids.length) return;
        begin(el, { label: p.label, ids: p.ids, emphasis: p.emphasis, n: p.n, minutes: p.minutes });
      };
      node.addEventListener("click", go);
      node.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    el.querySelector("#exStartCustom").addEventListener("click", () => {
      const v = el.querySelector("#exScope").value;
      begin(el, { label: "Custom set", ids: resolveScope(v), n: Number(el.querySelector("#exN").value), minutes: Number(el.querySelector("#exMin").value) });
    });
    App.typeset(el);
  }

  /* ---------------- building ---------------- */

  function build(opts) {
    const pool = Practice.poolFor(opts.ids);
    if (!pool.length) return null;
    const emph = opts.emphasis ? Practice.poolFor(resolveScope(opts.emphasis)) : [];
    const items = [];
    let bag = [], ebag = [];
    for (let i = 0; i < opts.n; i++) {
      // With an emphasis list, ~60% of questions come from it (when it exists).
      let gen;
      if (emph.length && Math.random() < 0.6) {
        if (!ebag.length) ebag = STUDY.util.shuffle(emph.slice());
        gen = ebag.shift();
      } else {
        if (!bag.length) bag = STUDY.util.shuffle(pool.slice());
        gen = bag.shift();
      }
      const found = Practice.findGen(gen.id);
      items.push({
        genId: gen.id, genName: gen.name, unitId: found.unit.id, unitShort: found.unit.short || found.unit.title,
        problem: gen.make(), response: null, flagged: false,
      });
    }
    return {
      label: opts.label, scopeLabel: scopeLabel(opts.ids), items, idx: 0,
      limit: opts.minutes || 0, started: Date.now(), submitted: false, courseId: course().id,
    };
  }

  function begin(el, opts) {
    const sitting = build(opts);
    if (!sitting) return home(el);
    s = sitting;
    startTicker(el);
    renderQ(el);
  }

  /* ---------------- clock ---------------- */

  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }
  function startTicker(el) {
    stopTicker();
    ticker = setInterval(() => {
      if (!s || s.submitted || !el.isConnected || !el.querySelector("#exClock")) return stopTicker();
      const left = remaining();
      const clock = el.querySelector("#exClock");
      clock.textContent = s.limit ? fmtClock(left) : fmtClock(elapsed());
      clock.classList.toggle("urgent", !!s.limit && left <= 60);
      if (s.limit && left <= 0) { stopTicker(); submit(el, true); }
    }, 1000);
  }
  function elapsed() { return (Date.now() - s.started) / 1000; }
  function remaining() { return s.limit * 60 - elapsed(); }

  /* ---------------- question screen ---------------- */

  function renderQ(el) {
    const it = s.items[s.idx];
    const p = it.problem;
    const answered = s.items.filter(i => !Answers.isBlank(i.problem, i.response)).length;
    el.innerHTML = `
      <div class="exam-bar">
        <div><b>${s.label}</b><span class="muted"> · ${s.scopeLabel} · ${answered}/${s.items.length} answered</span></div>
        <div class="exam-clock"><span id="exClock">${s.limit ? fmtClock(remaining()) : fmtClock(elapsed())}</span>
          <span class="muted">${s.limit ? "left" : "elapsed"}</span></div>
      </div>
      <div class="exam-palette">
        ${s.items.map((i, k) => `<button class="pal ${k === s.idx ? "on" : ""} ${Answers.isBlank(i.problem, i.response) ? "" : "done"} ${i.flagged ? "flag" : ""}" data-jump="${k}" title="Question ${k + 1}${i.flagged ? " (flagged)" : ""}">${k + 1}</button>`).join("")}
      </div>
      <div class="card narrow">
        <div class="run-head">
          <span class="pill pill-accent">Question ${s.idx + 1} of ${s.items.length}</span>
          <button class="btn btn-ghost btn-sm" id="exFlag">${it.flagged ? "⚑ Flagged" : "⚐ Flag for review"}</button>
        </div>
        <div class="q-text">${p.q}</div>
        <div id="exAnsZone">${Answers.render(p, it.response, {})}</div>
        <p class="muted note">No feedback until you submit. Answers are kept as you move around.</p>
        <div class="run-foot">
          <button class="btn btn-ghost btn-sm" id="exPrev" ${s.idx === 0 ? "disabled" : ""}>← Previous</button>
          <span style="flex:1"></span>
          ${s.idx < s.items.length - 1 ? `<button class="btn" id="exNext">Next →</button>` : `<button class="btn" id="exSubmit">Submit</button>`}
        </div>
      </div>
      <div class="narrow center">
        <button class="btn btn-ghost btn-sm" id="exSubmitEarly">Submit and grade now</button>
        <button class="btn btn-ghost btn-sm c-red" id="exAbandon">Abandon</button>
      </div>`;

    const zone = el.querySelector("#exAnsZone");
    const goto = k => { s.idx = Math.max(0, Math.min(s.items.length - 1, k)); renderQ(el); };
    Answers.bind(zone, p, it.response, r => {
      it.response = r;
      const pal = el.querySelector(`[data-jump="${s.idx}"]`);
      if (pal) pal.classList.toggle("done", !Answers.isBlank(p, r));
    }, () => { if (s.idx < s.items.length - 1) goto(s.idx + 1); else confirmSubmit(el); });
    el.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => goto(Number(b.dataset.jump))));
    el.querySelector("#exPrev").addEventListener("click", () => goto(s.idx - 1));
    el.querySelector("#exNext")?.addEventListener("click", () => goto(s.idx + 1));
    el.querySelector("#exSubmit")?.addEventListener("click", () => confirmSubmit(el));
    el.querySelector("#exSubmitEarly").addEventListener("click", () => confirmSubmit(el));
    el.querySelector("#exFlag").addEventListener("click", () => { it.flagged = !it.flagged; renderQ(el); });
    el.querySelector("#exAbandon").addEventListener("click", () => {
      if (confirm("Abandon this sitting? Nothing will be recorded.")) { stopTicker(); s = null; home(el); }
    });
    const input = zone.querySelector("[data-ans]");
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    App.typeset(el);
  }

  function confirmSubmit(el) {
    const blank = s.items.filter(i => !Answers.isComplete(i.problem, i.response)).length;
    const flagged = s.items.filter(i => i.flagged).length;
    if (blank || flagged) {
      const bits = [];
      if (blank) bits.push(`${blank} unanswered or incomplete`);
      if (flagged) bits.push(`${flagged} still flagged`);
      if (!confirm(`Submit with ${bits.join(" and ")}?`)) return;
    }
    submit(el, false);
  }

  /* ---------------- grading ---------------- */

  function submit(el, timedOut) {
    stopTicker();
    s.submitted = true;
    s.seconds = Math.round(Math.min(elapsed(), s.limit ? s.limit * 60 : elapsed()));
    s.timedOut = timedOut;
    let correct = 0;
    const byTopic = {};
    for (const it of s.items) {
      it.correct = Answers.grade(it.problem, it.response).correct;
      if (it.correct) correct++;
      Store.recordPractice(it.genId, it.correct, it.problem.variant);
      if (!it.correct) {
        const { variant, ...problem } = it.problem;
        Store.recordMiss({ genId: it.genId, genName: it.genName, unitId: it.unitId, unitShort: it.unitShort, variant, problem });
      }
      const t = byTopic[it.genId] || (byTopic[it.genId] = { name: it.genName, n: 0, c: 0 });
      t.n++; if (it.correct) t.c++;
    }
    s.correct = correct;
    s.byTopic = byTopic;
    Store.recordExam({ label: s.label, scopeLabel: s.scopeLabel, n: s.items.length, correct, seconds: s.seconds, limit: s.limit });
    renderReport(el);
  }

  function renderReport(el) {
    const pct = Math.round(100 * s.correct / s.items.length);
    const weak = Object.values(s.byTopic).filter(t => t.c < t.n).sort((a, b) => (a.c / a.n) - (b.c / b.n));
    el.innerHTML = `
      <div class="card center">
        <div class="big-mark">${pct >= 80 ? "★" : pct >= 60 ? "◑" : "◔"}</div>
        <h2>${s.correct} / ${s.items.length} &nbsp;<span class="pill ${pct >= 80 ? "pill-green" : pct >= 60 ? "pill-amber" : "pill-red"}">${pct}%</span></h2>
        <p class="muted">${s.label} · ${s.scopeLabel} · ${fmtClock(s.seconds)} used${s.limit ? ` of ${s.limit}:00` : ""}${s.timedOut ? " · <b>time expired</b>" : ""}</p>
        <p class="muted narrow-text">${pct >= 80 ? "Solid. Keep the weak topics below in rotation so they do not fade."
          : pct >= 60 ? "Passing, but the topics below are where the points went. Drill those before the next sitting."
          : "This is the useful kind of bad score: it found the gaps while they cost nothing. Work the topics below, then sit another set."}</p>
        <div class="btn-row center">
          <a class="btn" href="${App.link("practice")}">Drill the misses</a>
          <button class="btn btn-ghost" id="exAgain">Another sitting</button>
          <a class="btn btn-ghost" href="${App.link("progress")}">See progress</a>
        </div>
      </div>
      ${weak.length ? `<div class="card">
        <h3 class="mt0">Where the points went</h3>
        ${weak.map(t => `<div class="topic-row"><div style="flex:1"><b>${t.name}</b></div><div class="muted">${t.c}/${t.n}</div>
          <div class="deck-bar"><div class="progress-bar"><div style="width:${Math.round(100 * t.c / t.n)}%"></div></div></div></div>`).join("")}
        <p class="muted">Every missed question is now in your redo queue on the Practice page, with its worked solution.</p>
      </div>` : ""}
      <div class="card">
        <h3 class="mt0">Every question</h3>
        ${s.items.map((it, k) => `
          <div class="exam-review ${it.correct ? "ok" : "bad"}">
            <div class="exam-review-head">
              <span class="pill ${it.correct ? "pill-green" : "pill-red"}">${k + 1} · ${it.correct ? "correct" : "missed"}</span>
              <span class="pill">${it.genName}</span><span class="pill">${it.problem.variant || ""}</span>
            </div>
            <div class="q-text small-q">${it.problem.q}</div>
            ${Answers.render(it.problem, it.response, { reveal: true })}
            <p class="muted note">You answered <b>${Answers.describeResponse(it.problem, it.response)}</b>${it.correct || it.problem.kind === "classify" ? "" : ` · correct: ${Answers.describe(it.problem)}`}</p>
            <details ${it.correct ? "" : "open"}><summary class="muted">Worked solution</summary>
              <div class="solution">${it.problem.sol}${Answers.whyList(it.problem, it.response)}</div></details>
          </div>`).join("")}
      </div>`;
    el.querySelector("#exAgain").addEventListener("click", () => home(el));
    App.typeset(el);
  }

  return {
    mount(el) {
      if (s && !s.submitted && s.courseId === course().id) { startTicker(el); return renderQ(el); }
      home(el);
    },
    leave() { stopTicker(); if (s && s.submitted) s = null; },
    inProgress() { return !!(s && !s.submitted); },
    inProgressFor() { return s && !s.submitted ? s.courseId : null; },
    onKey(e, el) {
      if (!s || s.submitted || e.target.matches("input, textarea, select")) return;
      const it = s.items[s.idx];
      if (Answers.key(el.querySelector("#exAnsZone"), it.problem, e)) e.preventDefault();
    },
    _build: build, _resolveScope: resolveScope,
  };
})();
