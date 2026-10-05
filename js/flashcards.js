/* ============================================================
 * Flashcards — Leitner spaced repetition over the active course's
 * decks (one deck per unit).
 *
 *   · review — due cards first, then new ones (the daily habit)
 *   · cram   — everything in scope, weakest first (the night before)
 *
 * A missed card comes back a few cards later in the same session:
 * relearning it now is what stops it lapsing again next week.
 * ============================================================ */
const Flashcards = (() => {
  let session = null;
  const RELEARN_GAP = 4;

  function decks() { return App.course().units.filter(u => u.flashcards && u.flashcards.length); }

  function home(el) {
    session = null;
    const ds = decks();
    if (!ds.length) {
      el.innerHTML = `<div class="empty-state"><div class="big">⧉</div>No flashcards for this course yet.</div>`;
      return;
    }
    const all = ds.flatMap(u => u.flashcards);
    const allStats = Store.deckStats(all);
    el.innerHTML = `
      <div class="card">
        <h2>Flashcard decks</h2>
        <p class="muted">Spaced repetition: a card you know moves up a box and comes back less often; a card you miss drops to box 1 <em>and returns later in the same session</em>. Box ${Store.MASTER_BOX}+ of ${Store.MAX_BOX} counts as mastered, and the top box waits three weeks — long enough to carry early material to a cumulative exam.</p>
        <div class="toolbar">
          <button class="btn" id="fcAll" ${allStats.due ? "" : "disabled"}>▶ Review everything due (${allStats.due})</button>
          <button class="btn btn-ghost" id="fcCramAll">⚡ Cram all decks, weakest first</button>
        </div>
        ${ds.map(u => {
          const s = Store.deckStats(u.flashcards);
          return `
          <div class="deck-row">
            <div class="deck-info">
              <div class="deck-name">${u.title}</div>
              <div class="deck-meta">${s.total} cards · ${s.mastered} mastered · ${s.due} ready${s.fresh ? ` · ${s.fresh} never seen` : ""}</div>
            </div>
            <div class="deck-bar">
              <div class="progress-bar"><div style="width:${Math.round(s.mastery * 100)}%"></div></div>
              <div class="muted bar-pct">${Math.round(s.mastery * 100)}%</div>
            </div>
            <button class="btn btn-sm btn-ghost" data-cram="${u.id}" title="Every card, weakest first">Cram</button>
            <button class="btn btn-sm" data-deck="${u.id}">Study</button>
          </div>`;
        }).join("")}
      </div>
      <div class="card">
        <h3 class="mt0">How to use these well</h3>
        <ul class="muted tips">
          <li>Answer <em>out loud or on paper</em> before flipping. Recognising an answer is not the same as recalling it.</li>
          <li>Grade yourself strictly: "nearly" is a miss. An extra review costs seconds; a false "got it" costs exam points.</li>
          <li>Many cards ask for an <em>example</em> or a <em>why</em>. Come up with your own example before you look at the card's.</li>
          <li>Ten minutes daily beats an hour once a week. The schedule handles the spacing for you.</li>
        </ul>
      </div>`;
    el.querySelectorAll("[data-deck]").forEach(b => b.addEventListener("click", () => start(el, b.dataset.deck, "review")));
    el.querySelectorAll("[data-cram]").forEach(b => b.addEventListener("click", () => start(el, b.dataset.cram, "cram")));
    el.querySelector("#fcAll").addEventListener("click", () => start(el, null, "review"));
    el.querySelector("#fcCramAll").addEventListener("click", () => start(el, null, "cram"));
    App.typeset(el);
  }

  function start(el, unitId, mode) {
    const units = unitId ? [STUDY.getUnit(App.course(), unitId)] : decks();
    const cards = units.flatMap(u => u.flashcards || []);
    let queue;
    if (mode === "cram") {
      queue = Store.weakCards(cards);
      if (!queue.length) queue = STUDY.util.shuffle(cards);
    } else {
      const now = Date.now();
      const due = [], fresh = [], later = [];
      for (const c of cards) {
        const st = Store.getCard(c.id);
        if (!st.seen) fresh.push(c); else if (st.due <= now) due.push(c); else later.push(c);
      }
      queue = STUDY.util.shuffle(due).concat(fresh, STUDY.util.shuffle(later));
    }
    session = {
      title: unitId ? units[0].title : "All decks", short: unitId ? (units[0].short || units[0].title) : "All decks",
      unitId, mode, queue, idx: 0, revealed: false, right: 0, wrong: 0, relearned: 0,
    };
    render(el);
  }

  function render(el) {
    const s = session;
    if (!s) return home(el);
    if (s.idx >= s.queue.length) return done(el);
    const card = s.queue[s.idx];
    const st = Store.getCard(card.id);
    const dots = Array.from({ length: Store.MAX_BOX }, (_, i) => `<span class="${i < st.box ? "on" : ""}"></span>`).join("");
    const second = s.queue.slice(0, s.idx).some(c => c.id === card.id);
    el.innerHTML = `
      <div class="fc-stage">
        <div class="fc-progress">
          ${s.short} · ${s.mode === "cram" ? "cram · " : ""}card ${s.idx + 1} of ${s.queue.length}
          <span class="pill pill-green">${s.right} ✓</span> <span class="pill pill-red">${s.wrong} ✗</span>
          ${second ? `<span class="pill pill-amber">second look</span>` : ""}
        </div>
        <div class="fc-card" id="fcCard" tabindex="0" role="button" aria-label="Flashcard — press to flip">
          <div class="fc-tag"><span>${card.tag || ""}</span><span class="box-dots" title="Box ${st.box} of ${Store.MAX_BOX}">${dots}</span></div>
          <div class="fc-front">${card.front}</div>
          ${s.revealed ? `<div class="fc-back">${card.back}</div>` : `<div class="fc-hint">Answer it first — then click or press Space</div>`}
        </div>
        <div class="fc-actions">
          ${s.revealed
            ? `<button class="btn btn-red" id="fcMiss">✗ Missed it <span class="kbd">1</span></button>
               <button class="btn btn-green" id="fcGot">✓ Got it <span class="kbd">2</span></button>`
            : `<button class="btn btn-ghost" id="fcBack">Back to decks</button>
               <button class="btn" id="fcReveal">Reveal <span class="kbd">space</span></button>`}
        </div>
      </div>`;
    const flip = () => { if (!s.revealed) { s.revealed = true; render(el); } };
    el.querySelector("#fcCard").addEventListener("click", flip);
    if (s.revealed) {
      el.querySelector("#fcGot").addEventListener("click", () => grade(el, true));
      el.querySelector("#fcMiss").addEventListener("click", () => grade(el, false));
    } else {
      el.querySelector("#fcReveal").addEventListener("click", flip);
      el.querySelector("#fcBack").addEventListener("click", () => home(el));
    }
    App.typeset(el);
  }

  function done(el) {
    const s = session;
    const total = s.right + s.wrong;
    const pct = total ? Math.round(100 * s.right / total) : 0;
    el.innerHTML = `
      <div class="fc-stage">
        <div class="card center" style="padding:40px 24px;">
          <div class="big-mark">✓</div>
          <h2>Deck complete</h2>
          <p class="muted">${s.title}${s.mode === "cram" ? " · cram session" : ""}</p>
          <div class="grid-3 tight">
            <div class="stat"><div class="num">${total}</div><div class="lbl">Reviewed</div></div>
            <div class="stat"><div class="num c-green">${s.right}</div><div class="lbl">Correct</div></div>
            <div class="stat"><div class="num c-red">${s.wrong}</div><div class="lbl">Missed</div></div>
          </div>
          <p class="muted narrow-text">${s.relearned ? `${s.relearned} missed ${s.relearned === 1 ? "card was" : "cards were"} re-tested later in the session. ` : ""}${pct >= 85
            ? "Strong recall — these cards are now spaced further out."
            : "Missed cards are back in box 1 and due again tomorrow. That is the system working."}</p>
          <div class="btn-row center">
            <button class="btn" id="fcAgain">Study again</button>
            <button class="btn btn-ghost" id="fcDecks">All decks</button>
            <a class="btn btn-ghost" href="${App.link("practice")}">Practice questions</a>
          </div>
        </div>
      </div>`;
    el.querySelector("#fcAgain").addEventListener("click", () => start(el, s.unitId, s.mode));
    el.querySelector("#fcDecks").addEventListener("click", () => home(el));
  }

  function grade(el, correct) {
    const s = session;
    const card = s.queue[s.idx];
    Store.gradeCard(card.id, correct);
    if (correct) s.right++;
    else {
      s.wrong++;
      if (!s.queue.slice(s.idx + 1).some(c => c.id === card.id)) {
        s.queue.splice(Math.min(s.idx + 1 + RELEARN_GAP, s.queue.length), 0, card);
        s.relearned++;
      }
    }
    s.idx++;
    s.revealed = false;
    render(el);
  }

  function onKey(e, el) {
    if (!session || session.idx >= session.queue.length) return;
    if (e.code === "Space" || e.key === " ") {
      if (!session.revealed) { e.preventDefault(); session.revealed = true; render(el); }
    } else if (session.revealed) {
      if (e.key === "1" || e.key === "j") grade(el, false);
      if (e.key === "2" || e.key === "k") grade(el, true);
    }
  }

  return { mount: home, onKey };
})();
