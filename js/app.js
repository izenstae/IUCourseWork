/* ============================================================
 * App shell — routing, course hub, dashboard, learn, reference,
 * schedule and progress.
 *
 * Routes:  #/                      course hub
 *          #/<course>/<view>[/<arg>]  e.g. #/econ-b251/learn/m2
 * ============================================================ */
const App = (() => {
  const view = document.getElementById("view");
  const titleEl = document.getElementById("topbarTitle");
  const weekEl = document.getElementById("topbarWeek");
  let active = null;   // current course object (null on the hub)

  const VIEWS = [
    { id: "dashboard", label: "Dashboard", ico: "◧" },
    { id: "learn", label: "Learn", ico: "❖" },
    { id: "flashcards", label: "Flashcards", ico: "⧉" },
    { id: "practice", label: "Practice", ico: "✎" },
    { id: "exam", label: "Exam Mode", ico: "⏱" },
    { id: "sqllab", label: "SQL Lab", ico: "⌨", only: c => !!c.sqlLab },
    { id: "reference", label: "Reference", ico: "☰" },
    { id: "schedule", label: "Schedule", ico: "▦" },
    { id: "progress", label: "Progress", ico: "▤" },
  ];

  /* ---------- helpers ---------- */
  function typeset(el) {
    if (!window.renderMathInElement || !el) return;
    try {
      renderMathInElement(el, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
        throwOnError: false,
      });
    } catch (e) { /* leave raw TeX visible */ }
  }
  const DAY = 864e5;
  function fmtDate(iso, long) {
    return new Date(iso + "T12:00:00").toLocaleDateString(undefined, long ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "short", month: "short", day: "numeric" });
  }
  function daysUntil(iso) { return Math.ceil((new Date(iso + "T23:59:59") - new Date()) / DAY); }
  function inDays(n) { return n === 0 ? "today" : n === 1 ? "tomorrow" : n < 0 ? `${-n} days ago` : "in " + n + " days"; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function plain(h) { return String(h).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase(); }
  function link(viewId, arg) { return `#/${active ? active.id : ""}/${viewId}${arg ? "/" + arg : ""}`; }
  function course() { return active; }
  /* A unit file can be registered before its content is written (a stub);
   * only units with lessons, cards or practice are shown as available. */
  function hasContent(u) { return !!u && ((u.notes || []).length + (u.flashcards || []).length + (u.generators || []).length) > 0; }
  function liveUnit(c, id) { const u = STUDY.getUnit(c, id); return hasContent(u) ? u : null; }
  function pctPill(p) { return `<span class="pill ${p >= 80 ? "pill-green" : p >= 60 ? "pill-amber" : "pill-red"}">${p}%</span>`; }

  function nowLabel(c) {
    const { row, status } = STUDY.scheduleNow(c);
    if (!row) return status === "done" ? "Term complete" : "";
    return (status === "now" ? "Now: " : "Next: ") + row.title + (status === "next" ? " · " + fmtDate(row.start) : "");
  }

  /* ---------- Hub ---------- */
  function hub(el) {
    const courses = STUDY.courses;
    el.innerHTML = `
      <div class="card hero hub-hero">
        <h2>${greeting()}</h2>
        <p class="muted">Pick a course. Each one has its own lessons, flashcards, practice questions, timed exam rehearsals and progress, built from that course's syllabus and lecture material and added to as the term goes on.</p>
      </div>
      <div class="grid-2">
        ${courses.map(c => {
          const sm = Store.summary(c);
          const nUnits = c.units.filter(hasContent).length;
          const nTypes = c.units.reduce((a, u) => a + (u.generators || []).reduce((b, g) => b + g.variantNames.length, 0), 0);
          const nextExam = c.keyDates.find(k => k.kind === "exam" && daysUntil(k.date) >= 0);
          return `
          <a class="card course-card" href="#/${c.id}/dashboard" style="--course:${c.color}">
            <div class="course-top">
              <div class="course-mark">${c.mark}</div>
              <div style="min-width:0">
                <div class="course-code">${c.code} · ${c.term}</div>
                <div class="course-name">${c.name}</div>
              </div>
            </div>
            <p class="muted">${c.tagline || ""}</p>
            <div class="course-stats">
              <span class="pill">${nUnits} ${(c.unitNoun || "unit").toLowerCase()}${nUnits === 1 ? "" : "s"} loaded</span>
              <span class="pill">${sm.deck.total} cards</span>
              <span class="pill">${nTypes} question types</span>
            </div>
            <div class="progress-bar"><div style="width:${Math.round(sm.deck.mastery * 100)}%"></div></div>
            <div class="muted course-foot">
              <span>${Math.round(sm.deck.mastery * 100)}% card mastery · ${sm.practice.attempts ? Math.round(100 * sm.practice.accuracy) + "% first-try" : "no practice yet"}</span>
              <span>${nextExam ? `${nextExam.label.split("·")[0].trim()} ${inDays(daysUntil(nextExam.date))}` : ""}</span>
            </div>
            <div class="muted course-now">${nowLabel(c)}</div>
          </a>`;
        }).join("")}
        <div class="card course-card ghost-card">
          <div class="course-top"><div class="course-mark ghost">+</div><div><div class="course-name">More courses coming</div></div></div>
          <p class="muted">New courses and modules are added as their material arrives. Each gets the same toolkit. See <code>docs/ADDING_CONTENT.md</code> in the repository.</p>
        </div>
      </div>
      <div class="card">
        <h3 class="mt0">How the toolkit fits together</h3>
        <div class="grid-4 how">
          <div><b>❖ Learn</b><p class="muted">Short lessons per learning objective, with an example and the common trap for each.</p></div>
          <div><b>⧉ Flashcards</b><p class="muted">Spaced repetition for definitions and distinctions, so they are there when you need them.</p></div>
          <div><b>✎ Practice</b><p class="muted">Freshly generated questions in many shapes. A miss buys a hint and a second try.</p></div>
          <div><b>⏱ Exam mode</b><p class="muted">Timed and mixed, with no feedback until the end — the way it is graded.</p></div>
        </div>
      </div>`;
  }

  /* ---------- Dashboard ---------- */
  function studyPlan(c) {
    const plan = [];
    const decks = c.units.filter(u => u.flashcards && u.flashcards.length);
    const gens = c.units.flatMap(u => u.generators || []);
    let due = 0, fresh = 0;
    for (const u of decks) { const s = Store.deckStats(u.flashcards); due += s.due; fresh += s.fresh; }
    const upcoming = c.keyDates.filter(k => daysUntil(k.date) >= 0);
    const quiz = upcoming.find(k => k.kind === "quiz");
    const exam = upcoming.find(k => k.kind === "exam");

    // A unit whose lessons have not been opened yet, newest first.
    const unread = c.units.filter(u => (u.notes || []).length && Store.readCount(u.id) < u.notes.length)
      .sort((a, b) => (b.order || 0) - (a.order || 0))[0];
    if (unread) {
      const n = Store.readCount(unread.id);
      plan.push({ pri: n ? 2 : 1, icon: "❖", href: link("learn", unread.id),
        title: n ? `Finish the ${unread.short} lessons (${n}/${unread.notes.length} done)` : `Learn ${unread.title}`,
        why: "Read a lesson, then press its practice button straight away. Testing yourself right after reading is what makes it stick." });
    }
    if (due) plan.push({ pri: fresh === due ? 2 : 1, icon: "⧉", href: link("flashcards"),
      title: `Review ${due} flashcard${due === 1 ? "" : "s"}`,
      why: (fresh ? `${fresh} you have never seen; the rest are scheduled for today. ` : "Scheduled for today by the spacing system. ") + `About ${Math.max(1, Math.round(due * 0.2))} min.` });
    if (gens.length) plan.push({ pri: 0.5, icon: "▶", href: link("practice", "daily"),
      title: "Daily mix · about 15 minutes",
      why: Practice.dailySummary() });
    if (quiz && daysUntil(quiz.date) <= 3 && gens.length) {
      const has = quiz.unit && liveUnit(c, quiz.unit);
      plan.push({ pri: 0, icon: "✎", href: has ? link("practice", quiz.unit) : link("exam"),
        title: `${quiz.label.replace(/ due.*/, "")} due ${inDays(daysUntil(quiz.date))}`,
        why: has ? `Run a mixed session on ${has.short}, then a 10-question timed set in Exam mode.` : "Its module isn't loaded yet. Meanwhile, keep earlier material fresh with a timed set." });
    }
    if (exam && daysUntil(exam.date) <= 14 && gens.length) plan.push({ pri: 0, icon: "▦", href: link("exam"),
      title: `${exam.label.split("·")[0].trim()} ${inDays(daysUntil(exam.date))}`,
      why: "Sit a full-length rehearsal under the clock, then drill whatever it finds. Exams are cumulative." });
    return plan.sort((a, b) => a.pri - b.pri).slice(0, 4);
  }

  function dashboard(el) {
    const c = active;
    const decks = c.units.filter(u => u.flashcards && u.flashcards.length);
    const gens = c.units.flatMap(u => u.generators || []);
    let dueTotal = 0, mastered = 0, cardTotal = 0;
    for (const u of decks) { const s = Store.deckStats(u.flashcards); dueTotal += s.due; mastered += s.mastered; cardTotal += s.total; }
    const ps = Store.practiceStats(gens);
    const upcoming = c.keyDates.filter(k => daysUntil(k.date) >= 0).slice(0, 4);
    const plan = studyPlan(c);
    const lastExam = Store.exams()[0];
    const today = new Date().toISOString().slice(0, 10);

    const unitCards = c.units.filter(hasContent).map(u => {
      const s = Store.deckStats(u.flashcards || []);
      const p = Store.practiceStats(u.generators || []);
      const row = c.schedule.find(r => r.unit === u.id);
      const read = Store.readCount(u.id), nNotes = (u.notes || []).length;
      return `
        <div class="card unit-card">
          <div class="unit-head">
            <h3>${u.title}</h3>
            ${row ? `<span class="pill ${row.start <= today ? "pill-accent" : ""}">${fmtDate(row.start)}</span>` : ""}
          </div>
          <p class="muted">${u.description || ""}</p>
          <div class="mini-stats muted">
            <span>Lessons ${read}/${nNotes}</span><span>Cards ${Math.round(s.mastery * 100)}%</span>
            <span>${p.attempts ? Math.round(100 * p.accuracy) + "% first-try" : "No practice yet"}</span>
          </div>
          <div class="progress-bar"><div style="width:${Math.round(s.mastery * 100)}%"></div></div>
          <div class="btn-row">
            ${nNotes ? `<a class="btn btn-sm btn-ghost" href="${link("learn", u.id)}">Learn</a>` : ""}
            <a class="btn btn-sm btn-ghost" href="${link("flashcards")}">Cards</a>
            ${(u.generators || []).length ? `<a class="btn btn-sm btn-ghost" href="${link("practice", u.id)}">Practice</a>` : ""}
          </div>
        </div>`;
    }).join("");

    const missing = c.schedule.filter(r => r.unit && !liveUnit(c, r.unit) && r.start <= addDays(today, 7));
    el.innerHTML = `
      <div class="card hero">
        <h2>${c.code}: ${c.name}</h2>
        <p class="muted">${nowLabel(c)}${dueTotal ? ` — <b>${dueTotal}</b> flashcard${dueTotal === 1 ? "" : "s"} ready.` : ""}</p>
      </div>
      <div class="card">
        <h3 class="mt0">Today's plan</h3>
        ${plan.map((p, i) => `
          <a class="plan-row ${i === 0 ? "lead" : ""}" href="${p.href}">
            <span class="plan-ico">${p.icon}</span>
            <span class="plan-body"><span class="plan-title">${p.title}</span><span class="muted plan-why">${p.why}</span></span>
            <span class="plan-go">→</span>
          </a>`).join("") || `<p class="muted">Nothing registered to study yet.</p>`}
      </div>
      <div class="grid-4">
        <div class="card stat"><div class="num">${Store.streak()}</div><div class="lbl">day streak</div></div>
        <div class="card stat"><div class="num">${mastered}<span class="muted of">/${cardTotal}</span></div><div class="lbl">cards mastered</div></div>
        <div class="card stat"><div class="num">${ps.attempts}</div><div class="lbl">questions attempted</div></div>
        <div class="card stat"><div class="num">${ps.attempts ? Math.round(100 * ps.accuracy) + "%" : "—"}</div><div class="lbl">first-try accuracy</div></div>
      </div>
      ${lastExam ? `<div class="card"><h3 class="mt0">Last timed sitting</h3>
        <div class="topic-row">${pctPill(Math.round(100 * lastExam.correct / lastExam.n))}
          <div style="flex:1">${lastExam.label} · ${lastExam.correct}/${lastExam.n} · ${lastExam.scopeLabel || ""}</div>
          <a class="btn btn-sm btn-ghost" href="${link("exam")}">Sit another</a></div></div>` : ""}
      ${c.sqlLab ? `<div class="card topic-row"><span class="plan-ico">⌨</span>
        <div style="flex:1"><b>SQL Lab</b> <span class="muted">· ${SqlLab.solvedCount(c)}/${c.sqlLab.exercises.length} exercises solved. Write and run real queries against a practice database.</span></div>
        <a class="btn btn-sm" href="${link("sqllab")}">Open</a></div>` : ""}
      <div class="grid-2">${unitCards}</div>
      ${missing.length ? `<div class="card callout-card"><b>Waiting for material:</b> ${missing.map(r => r.title).join(" · ")}. Add the lecture files when they're released and they will show up here.</div>` : ""}
      <div class="card">
        <h3 class="mt0">Coming up</h3>
        ${upcoming.length ? upcoming.map(k => dateRow(k)).join("") : `<p class="muted">No upcoming dates on record.</p>`}
        <p class="muted">Full calendar on the <a href="${link("schedule")}">schedule</a>.</p>
      </div>`;
    typeset(el);
  }
  function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function dateRow(k) {
    const cls = k.kind === "exam" ? "pill-red" : k.kind === "quiz" ? "pill-accent" : k.kind === "hw" ? "pill-amber" : "";
    const d = daysUntil(k.date);
    return `<div class="topic-row ${d < 0 ? "past" : ""}"><span class="pill ${cls} date-pill">${fmtDate(k.date)}</span><div style="flex:1">${k.label}</div><span class="muted">${inDays(d)}</span></div>`;
  }
  function greeting() {
    const h = new Date().getHours();
    return (h < 5 ? "Late-night session" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + " 👋";
  }

  /* ---------- Learn ---------- */
  function learn(el, arg) {
    const c = active;
    const units = c.units.filter(u => (u.notes || []).length);
    if (!units.length) { el.innerHTML = `<div class="empty-state"><div class="big">❖</div>No lessons for this course yet.</div>`; return; }
    const u = STUDY.getUnit(c, arg) && (STUDY.getUnit(c, arg).notes || []).length ? STUDY.getUnit(c, arg) : units[0];
    const genName = id => ((u.generators || []).find(g => g.id === id) || {}).name || id;
    el.innerHTML = `
      <div class="card">
        <div class="learn-tabs">${units.map(x => `<a class="tab ${x.id === u.id ? "on" : ""}" href="${link("learn", x.id)}">${x.short}</a>`).join("")}</div>
        <h2>${u.title}</h2>
        <p class="muted">${u.description || ""}</p>
        <div class="learn-progress muted"><span id="readCount">${Store.readCount(u.id)}</span>/${u.notes.length} lessons marked done</div>
        <ol class="toc">${u.notes.map((n, i) => `<li><a href="#lesson-${i}" data-scroll="${i}">${n.title}</a> ${Store.isRead(u.id, i) ? "✓" : ""}</li>`).join("")}</ol>
      </div>
      ${u.notes.map((n, i) => `
        <div class="card lesson" id="lesson-${i}">
          <div class="lesson-head"><span class="lesson-num">${i + 1}</span><h2>${n.title}</h2></div>
          ${n.lo ? `<p class="lesson-lo"><b>Objective:</b> ${n.lo}</p>` : ""}
          <div class="lesson-body">${n.html}</div>
          <div class="lesson-foot">
            ${(n.gens || []).map(g => `<a class="btn btn-sm" href="#" data-practice="${g}">✎ Practice: ${genName(g)}</a>`).join("")}
            <span style="flex:1"></span>
            <label class="read-toggle"><input type="checkbox" data-read="${i}" ${Store.isRead(u.id, i) ? "checked" : ""}> I've got this</label>
          </div>
        </div>`).join("")}
      <div class="card center">
        <p class="muted">Done reading? The best next step is retrieval: flashcards for this module, then a mixed practice session with the topic hidden.</p>
        <div class="btn-row center"><a class="btn" href="${link("flashcards")}">Flashcards</a><a class="btn btn-ghost" href="${link("practice", u.id)}">Practice ${u.short}</a></div>
      </div>`;
    el.querySelectorAll("[data-read]").forEach(b => b.addEventListener("change", () => {
      Store.setRead(u.id, Number(b.dataset.read), b.checked);
      el.querySelector("#readCount").textContent = Store.readCount(u.id);
    }));
    el.querySelectorAll("[data-scroll]").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      el.querySelector("#lesson-" + a.dataset.scroll).scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    el.querySelectorAll("[data-practice]").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      location.hash = link("practice", "topic:" + a.dataset.practice);
    }));
    typeset(el);
  }

  /* ---------- Reference ---------- */
  function reference(el) {
    const c = active;
    const sel = Store.sheet();
    const key = (...parts) => esc(parts.map(plain).join(" "));
    let html = "";
    for (const u of c.units) {
      if (!(u.cues || []).length) continue;
      html += `
        <div class="card no-print ref-sec" data-sec>
          <h2>${u.short} — spotting the concept</h2>
          <p class="muted">Definitions are the easy half. The hard half is recognising which idea a question is testing. The wording is the clue.</p>
          <div class="tbl-wrap"><table class="tbl guide-tbl">
            <tr><th>When the question says…</th><th>Think</th><th>Because</th></tr>
            ${u.cues.map(g => `<tr class="ref-hit" data-k="${key(g.when, g.think, g.why)}"><td>${g.when}</td><td><b>${g.think}</b></td><td class="muted">${g.why}</td></tr>`).join("")}
          </table></div>
        </div>`;
    }
    for (const u of c.units) {
      if (!(u.flashcards || []).length) continue;
      html += `
        <div class="card ref-group ref-sec" data-sec>
          <div class="ref-group-head no-print">
            <h2>${u.title}</h2>
            <button class="btn btn-ghost btn-sm" data-all="${u.id}">Select all</button>
            <button class="btn btn-ghost btn-sm" data-none="${u.id}">Clear</button>
          </div>
          ${u.flashcards.map(cd => `
            <div class="ident-item ref-hit ${sel.has(cd.id) ? "picked" : ""}" data-ident="${cd.id}" data-k="${key(cd.front, cd.back, cd.tag || "")}">
              <label class="ident-pick no-print"><input type="checkbox" data-pick="${esc(cd.id)}" ${sel.has(cd.id) ? "checked" : ""} aria-label="Add to study sheet"></label>
              <div class="ident-main">
                <div class="ident-name">${cd.tag ? `<span class="pill">${cd.tag}</span> ` : ""}${cd.front}</div>
                <div class="ident-formula">${cd.back}</div>
              </div>
            </div>`).join("")}
        </div>`;
    }
    el.innerHTML = `
      <div class="card no-print">
        <h2>Reference &amp; study sheet</h2>
        <p class="muted">Every definition and principle on one searchable page, plus each module's "spotting the concept" table. Tick entries and print to get a compact two-column study sheet. Writing the sheet is itself good revision. Your selection is saved.</p>
        <div class="toolbar">
          <input type="search" class="select grow" id="refSearch" placeholder="Search terms, definitions, cues…" aria-label="Search reference">
          <span class="pill ${sel.size ? "pill-accent" : ""}" id="selCount">${sel.size} selected</span>
          <button class="btn" id="refPrint" ${sel.size ? "" : "disabled"}>⎙ Print study sheet</button>
          <button class="btn btn-ghost" id="refClear" ${sel.size ? "" : "disabled"}>Clear</button>
        </div>
      </div>
      ${html || `<div class="empty-state"><div class="big">☰</div>No reference material yet.</div>`}
      <div class="empty-state no-print" id="refEmpty" hidden>Nothing matches that search.</div>
      <div class="print-only sheet-head"><b>${c.code} ${c.name}</b> — study sheet · ${sel.size} entries</div>`;
    const hits = [...el.querySelectorAll(".ref-hit")];
    const secs = [...el.querySelectorAll("[data-sec]")];
    el.querySelector("#refSearch").addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      for (const h of hits) h.hidden = !!q && !h.dataset.k.includes(q);
      let any = false;
      for (const sec of secs) { const live = [...sec.querySelectorAll(".ref-hit")].some(h => !h.hidden); sec.hidden = !live; any = any || live; }
      el.querySelector("#refEmpty").hidden = any;
    });
    const refreshSel = () => {
      const n = Store.sheet().size;
      el.querySelector("#selCount").textContent = n + " selected";
      el.querySelector("#selCount").classList.toggle("pill-accent", n > 0);
      el.querySelector("#refPrint").disabled = !n;
      el.querySelector("#refClear").disabled = !n;
    };
    el.querySelectorAll("[data-pick]").forEach(box => box.addEventListener("change", () => {
      Store.toggleSheet(box.dataset.pick);
      box.closest("[data-ident]").classList.toggle("picked", box.checked);
      refreshSel();
    }));
    el.querySelectorAll("[data-all]").forEach(b => b.addEventListener("click", () => {
      Store.setSheet([...Store.sheet(), ...STUDY.getUnit(c, b.dataset.all).flashcards.map(x => x.id)]); reference(el);
    }));
    el.querySelectorAll("[data-none]").forEach(b => b.addEventListener("click", () => {
      const ids = new Set(STUDY.getUnit(c, b.dataset.none).flashcards.map(x => x.id));
      Store.setSheet([...Store.sheet()].filter(id => !ids.has(id))); reference(el);
    }));
    el.querySelector("#refPrint").addEventListener("click", () => {
      document.body.classList.add("printing-sheet");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-sheet"), 500);
    });
    el.querySelector("#refClear").addEventListener("click", () => { Store.setSheet([]); reference(el); });
    typeset(el);
  }

  /* ---------- Schedule ---------- */
  function schedule(el) {
    const c = active;
    const { row: cur, status } = STUDY.scheduleNow(c);
    const today = new Date().toISOString().slice(0, 10);
    el.innerHTML = `
      <div class="card">
        <h2>Course schedule</h2>
        <p class="muted">${c.code} · ${c.term} · ${c.instructor}${c.meets ? " · " + c.meets : ""}. Tentative, per the syllabus${c.text ? `; readings from ${c.text}` : ""}.</p>
        <div class="tbl-wrap"><table class="tbl sched">
          <tr><th>Dates</th><th>Topic</th><th>Due</th><th></th></tr>
          ${c.schedule.map(r => {
            const u = r.unit && liveUnit(c, r.unit);
            const isCur = cur === r;
            return `<tr class="${isCur ? "current-week" : ""} ${(r.end || r.start) < today ? "past" : ""} ${r.exam ? "exam-row" : ""}">
              <td class="nowrap">${fmtDate(r.start)}${r.end && r.end !== r.start ? " – " + fmtDate(r.end) : ""}${isCur ? ` <span class="pill pill-accent">${status === "now" ? "now" : "next"}</span>` : ""}</td>
              <td>${r.exam ? "<b>" + r.title + "</b>" : r.title}</td>
              <td class="muted">${r.due || ""}</td>
              <td>${u ? `<a class="btn btn-sm btn-ghost" href="${link("learn", u.id)}">Study</a>` : r.unit ? `<span class="muted small">not added yet</span>` : ""}</td>
            </tr>`;
          }).join("")}
        </table></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 class="mt0">Key dates</h3>
          ${c.keyDates.filter(k => daysUntil(k.date) >= -3).map(dateRow).join("") || `<p class="muted">Nothing left this term.</p>`}
        </div>
        <div class="card">
          <h3 class="mt0">Grade weighting</h3>
          ${c.gradeWeights.map(g => `
            <div class="weight-row"><div class="weight-name">${g.name}</div>
              <div class="progress-bar" style="flex:1"><div style="width:${Math.min(100, g.pct * 3)}%"></div></div>
              <div class="muted weight-pct">${g.pct}%</div></div>`).join("")}
          ${c.gradeNote ? `<p class="muted">${c.gradeNote}</p>` : ""}
          ${c.examFormat ? `<p class="muted"><b>Exam format:</b> ${c.examFormat}</p>` : ""}
        </div>
      </div>`;
  }

  /* ---------- Progress ---------- */
  function progress(el) {
    const c = active;
    const deckRows = c.units.filter(u => (u.flashcards || []).length).map(u => {
      const s = Store.deckStats(u.flashcards);
      return `<div class="deck-row"><div class="deck-info"><div class="deck-name">${u.title}</div>
        <div class="deck-meta">${s.started}/${s.total} cards started · ${s.mastered} mastered (box ${Store.MASTER_BOX}+)</div></div>
        <div class="deck-bar"><div class="progress-bar green"><div style="width:${Math.round(s.mastery * 100)}%"></div></div>
        <div class="muted bar-pct">${Math.round(s.mastery * 100)}%</div></div></div>`;
    }).join("");
    let topicRows = "", weakShapes = "";
    for (const u of c.units) for (const g of (u.generators || [])) {
      const p = Store.getPractice(g.id);
      if (!p.attempts) continue;
      const acc = Math.round(100 * p.correct / p.attempts);
      const ra = p.recent.length ? Math.round(100 * p.recent.reduce((a, b) => a + b, 0) / p.recent.length) : null;
      topicRows += `<tr><td>${g.name}<div class="muted small">${u.short} · ${Object.keys(p.variants).length}/${g.variantNames.length} types seen</div></td>
        <td>${p.correct}/${p.attempts}</td><td>${acc}%</td>
        <td>${ra == null ? "—" : ra + "%"} ${ra != null && ra >= 80 ? `<span class="pill pill-green">solid</span>` : ra != null && ra < 50 ? `<span class="pill pill-red">review</span>` : ""}</td></tr>`;
      for (const v of Store.weakVariants(g.id)) weakShapes += `<tr><td>${v.name}<div class="muted small">${g.name}</div></td><td>${v.correct}/${v.attempts}</td><td>${Math.round(100 * v.acc)}%</td></tr>`;
    }
    let cells = "";
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const n = Store.activityOn(d);
      const lvl = n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : 3;
      cells += `<div class="act act-${lvl}" title="${d.toDateString()}: ${n}"></div>`;
    }
    const exams = Store.exams();
    const misses = Store.missCount();
    el.innerHTML = `
      <div class="grid-3">
        <div class="card stat"><div class="num">${Store.streak()}</div><div class="lbl">day streak</div></div>
        <div class="card stat"><div class="num">${Store.totalReviews()}</div><div class="lbl">reviews, lessons &amp; questions</div></div>
        <div class="card stat"><div class="num">${misses}</div><div class="lbl">in redo queue</div></div>
      </div>
      <div class="card"><h3 class="mt0">Last 4 weeks</h3><div class="act-strip">${cells}</div></div>
      ${exams.length ? `<div class="card"><h3 class="mt0">Timed sittings</h3><table class="tbl"><tr><th>When</th><th>Set</th><th>Score</th></tr>
        ${exams.slice(0, 8).map(e => `<tr><td class="muted">${new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
          <td>${e.label}<div class="muted small">${e.scopeLabel || ""}</div></td><td><b>${e.correct}/${e.n}</b> ${pctPill(Math.round(100 * e.correct / e.n))}</td></tr>`).join("")}
        </table></div>` : ""}
      <div class="card"><h3 class="mt0">Flashcard mastery</h3>${deckRows || `<p class="muted">No decks yet.</p>`}</div>
      <div class="card"><h3 class="mt0">Practice accuracy by topic</h3>
        <p class="muted">First-try, unaided answers only.</p>
        ${topicRows ? `<div class="tbl-wrap"><table class="tbl"><tr><th>Topic</th><th>Correct</th><th>Overall</th><th>Last 10</th></tr>${topicRows}</table></div>` : `<p class="muted">No attempts yet — try <a href="${link("practice")}">Practice</a>.</p>`}
      </div>
      ${weakShapes ? `<div class="card"><h3 class="mt0">Question types to work on</h3>
        <p class="muted">A topic's average can hide one question type that keeps catching you. These are below 60%.</p>
        <table class="tbl"><tr><th>Type</th><th>Correct</th><th>Rate</th></tr>${weakShapes}</table></div>` : ""}
      <div class="card"><h3 class="mt0">Backup</h3>
        <p class="muted">Progress for ${c.code} lives in this browser. Export it to move devices or before clearing browser data.</p>
        <div class="btn-row">
          <button class="btn btn-ghost btn-sm" id="expBtn">Export progress</button>
          <button class="btn btn-ghost btn-sm" id="impBtn">Import progress</button>
          <button class="btn btn-ghost btn-sm" id="clrMiss" ${misses ? "" : "disabled"}>Clear redo queue</button>
          <button class="btn btn-ghost btn-sm c-red" id="rstBtn">Reset ${c.code} progress</button>
          <input type="file" id="impFile" accept="application/json" hidden>
        </div></div>`;
    el.querySelector("#expBtn").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: "application/json" }));
      a.download = `${c.id}-progress.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    const f = el.querySelector("#impFile");
    el.querySelector("#impBtn").addEventListener("click", () => f.click());
    f.addEventListener("change", () => {
      if (!f.files[0]) return;
      f.files[0].text().then(t => { try { Store.importJSON(t); progress(el); } catch (e) { alert("Could not import: " + e.message); } });
    });
    el.querySelector("#clrMiss").addEventListener("click", () => { if (misses && confirm(`Discard all ${misses} questions in the redo queue?`)) { Store.clearAllMisses(); progress(el); } });
    el.querySelector("#rstBtn").addEventListener("click", () => { if (confirm(`Reset ALL ${c.code} progress? This cannot be undone.`)) { Store.reset(); progress(el); } });
  }

  /* ---------- Router ---------- */
  const MOUNT = {
    dashboard, learn, reference, schedule, progress,
    flashcards: el => Flashcards.mount(el),
    practice: (el, arg) => {
      if (arg === "daily") { Practice.mount(el); Practice.startDaily(el); return; }
      if (arg && arg.startsWith("topic:")) {
        Practice.mount(el);
        const btn = el.querySelector(`[data-gen="${arg.slice(6)}"]`);
        if (btn) btn.click();
        return;
      }
      Practice.mount(el, arg ? { unit: arg } : null);
    },
    exam: el => Exam.mount(el),
    sqllab: (el, arg) => SqlLab.mount(el, arg),
  };

  function renderNav() {
    const nav = document.getElementById("nav");
    const brandMark = document.getElementById("brandMark");
    if (!active) {
      brandMark.textContent = "IU";
      brandMark.style.background = "";
      document.getElementById("brandTitle").textContent = "IU Study Hub";
      document.getElementById("brandSub").textContent = "All courses";
      nav.innerHTML = `<div class="nav-label">Courses</div>` + STUDY.courses.map(c =>
        `<a href="#/${c.id}/dashboard"><span class="nav-ico">${c.mark.slice(0, 2)}</span> ${c.code}</a>`).join("");
      document.getElementById("footNote").textContent = "Progress is saved in this browser, per course.";
      return;
    }
    brandMark.textContent = active.mark;
    brandMark.style.background = active.color;
    document.getElementById("brandTitle").textContent = active.code;
    document.getElementById("brandSub").textContent = active.name;
    nav.innerHTML = `<a href="#/" class="nav-back"><span class="nav-ico">←</span> All courses</a>
      <div class="nav-label">${active.code}</div>` +
      VIEWS.filter(v => !v.only || v.only(active)).map(v => `<a href="#/${active.id}/${v.id}" data-route="${v.id}"><span class="nav-ico">${v.ico}</span> ${v.label}</a>`).join("") +
      (STUDY.courses.length > 1 ? `<div class="nav-label">Switch course</div>` + STUDY.courses.filter(c => c !== active).map(c => `<a href="#/${c.id}/dashboard"><span class="nav-ico">${c.mark.slice(0, 2)}</span> ${c.code}</a>`).join("") : "");
    document.getElementById("footNote").textContent = active.text || "";
  }

  let currentView = null;
  function route() {
    const parts = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    const c = parts.length ? STUDY.getCourse(parts[0]) : null;
    if (parts.length && !c) { location.replace("#/"); return; }
    const known = c && MOUNT[parts[1]] && (VIEWS.find(v => v.id === parts[1]) || {}).only?.(c) !== false;
    const viewId = c ? (known ? parts[1] : "dashboard") : null;
    const arg = parts.slice(2).join("/") || null;

    // An unfinished sitting survives navigation (its clock is wall-time
    // based) and resumes when you return to that course's Exam view.
    if (viewId !== "exam") Exam.leave();

    if ((c && c.id) !== (active && active.id) || !currentView) {
      active = c;
      Store.use(c ? c.id : null);
      renderNav();
    }
    currentView = viewId || "hub";
    document.body.dataset.view = currentView;
    document.title = c ? `${c.code} · ${(VIEWS.find(v => v.id === viewId) || {}).label} — IU Study Hub` : "IU Study Hub";
    titleEl.textContent = c ? (VIEWS.find(v => v.id === viewId) || {}).label : "Your courses";
    weekEl.textContent = c ? nowLabel(c) : new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    document.querySelectorAll(".nav a[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === viewId));
    if (active) document.documentElement.style.setProperty("--course", active.color); else document.documentElement.style.removeProperty("--course");
    window.scrollTo(0, 0);
    if (c) MOUNT[viewId](view, arg); else hub(view);
    document.getElementById("sidebar").classList.remove("open");
    document.body.classList.remove("nav-open");
  }

  function applyTheme(t) {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.setAttribute("data-theme", "light");
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("click", e => {
    const a = e.target.closest(".nav a[data-route]");
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); route(); }
  });
  window.addEventListener("beforeunload", e => { if (Exam.inProgress()) { e.preventDefault(); e.returnValue = ""; } });
  window.addEventListener("DOMContentLoaded", () => {
    applyTheme(Store.getTheme());
    document.getElementById("themeToggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      Store.setTheme(next);
      applyTheme(next);
    });
    const sidebar = document.getElementById("sidebar");
    const setNav = open => { sidebar.classList.toggle("open", open); document.body.classList.toggle("nav-open", open); };
    document.getElementById("hamburger").addEventListener("click", e => { e.stopPropagation(); setNav(!sidebar.classList.contains("open")); });
    document.addEventListener("click", e => { if (sidebar.classList.contains("open") && !e.target.closest("#sidebar")) setNav(false); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && sidebar.classList.contains("open")) { setNav(false); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (currentView === "flashcards" && !e.target.matches("input, textarea, select")) Flashcards.onKey(e, view);
      else if (currentView === "practice") { if (!(Identify.active() && Identify.onKey(e, view))) Practice.onKey(e, view); }
      else if (currentView === "exam") Exam.onKey(e, view);
    });
    route();
  });
  window.addEventListener("load", () => typeset(view));

  return { typeset, course, link };
})();
