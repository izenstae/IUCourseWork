/* ============================================================
 * Progress store — one localStorage record per course.
 *
 * Store.use(courseId) switches the active course; every other call
 * reads and writes that course's record. Shape (schema v1):
 * {
 *   v: 1,
 *   cards:    { [cardId]: { box, due, seen, lapses } },
 *   practice: { [genId]: { attempts, correct, recent: [0|1,...],
 *                          variants: { [name]: { a, c } } } },
 *   misses:   [ { key, genId, genName, unitId, unitShort, variant, problem, at } ],
 *   exams:    [ { at, label, scopeLabel, n, correct, seconds, limit } ],
 *   sheet:    [ cardId, ... ],           // study-sheet selection (Reference page)
 *   read:     { [unitId]: [sectionIdx, ...] },   // Learn sections marked done
 *   activity: { [YYYY-MM-DD]: count },
 * }
 * ============================================================ */
const Store = (() => {
  const PREFIX = "iu-study:";
  const THEME_KEY = "iu-study-theme";
  const SCHEMA = 1;

  /* Leitner ladder: intervals[box] = days until due again. Six boxes,
   * topping out at three weeks, so a card learned in week 2 still comes
   * back before a cumulative final. */
  const INTERVALS = [0, 0, 1, 2, 4, 9, 21];
  const MAX_BOX = INTERVALS.length - 1;
  const MASTER_BOX = 4;
  const MAX_MISSES = 60;
  const MAX_PER_VARIANT = 3;
  const MAX_EXAMS = 20;

  let courseId = null;
  let state = blank();

  function blank() {
    return { v: SCHEMA, cards: {}, practice: {}, misses: [], exams: [], sheet: [], read: {}, activity: {} };
  }

  function normalise(raw) {
    const s = blank();
    if (!raw || typeof raw !== "object") return s;
    for (const k of ["cards", "practice", "activity", "read"]) if (raw[k] && typeof raw[k] === "object") s[k] = raw[k];
    for (const k of ["misses", "exams", "sheet"]) if (Array.isArray(raw[k])) s[k] = raw[k];
    for (const p of Object.values(s.practice)) {
      if (!p.variants) p.variants = {};
      if (!Array.isArray(p.recent)) p.recent = [];
    }
    return s;
  }

  function loadFor(id) {
    try {
      const raw = localStorage.getItem(PREFIX + id);
      if (raw) return normalise(JSON.parse(raw));
    } catch (e) { /* unavailable or corrupt — start fresh */ }
    return blank();
  }

  function save() {
    if (!courseId) return;
    try { localStorage.setItem(PREFIX + courseId, JSON.stringify(state)); }
    catch (e) {
      try {
        state.misses = state.misses.slice(-10);
        localStorage.setItem(PREFIX + courseId, JSON.stringify(state));
      } catch (e2) { /* keep working in memory */ }
    }
  }

  function dayKey(dt) {
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  }
  function bumpActivity(n) {
    const k = dayKey(new Date());
    state.activity[k] = (state.activity[k] || 0) + (n || 1);
  }

  function streakOf(activity) {
    let s = 0;
    const d = new Date();
    if (!activity[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (activity[dayKey(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }

  function deckStatsOf(st, cards) {
    let started = 0, mastered = 0, due = 0, fresh = 0, boxSum = 0;
    const now = Date.now();
    for (const card of cards) {
      const c = st.cards[card.id];
      if (c && c.seen > 0) {
        started++; boxSum += c.box;
        if (c.box >= MASTER_BOX) mastered++;
        if (c.due <= now) due++;
      } else { fresh++; due++; }
    }
    return { total: cards.length, started, mastered, due, fresh, mastery: cards.length ? boxSum / (cards.length * MAX_BOX) : 0 };
  }

  function practiceStatsOf(st, generators) {
    let attempts = 0, correct = 0, recentN = 0, recentHits = 0;
    for (const g of generators) {
      const p = st.practice[g.id];
      if (!p) continue;
      attempts += p.attempts; correct += p.correct;
      recentN += p.recent.length; recentHits += p.recent.reduce((a, b) => a + b, 0);
    }
    return { attempts, correct, accuracy: attempts ? correct / attempts : null, recentAcc: recentN ? recentHits / recentN : null };
  }

  return {
    MAX_BOX, MASTER_BOX, INTERVALS,

    use(id) {
      if (id === courseId) return;
      courseId = id;
      state = id ? loadFor(id) : blank();
    },
    current() { return courseId; },

    /* Read-only summary of any course, for the hub page. */
    summary(course) {
      const st = course.id === courseId ? state : loadFor(course.id);
      const cards = course.units.flatMap(u => u.flashcards || []);
      const gens = course.units.flatMap(u => u.generators || []);
      return {
        deck: deckStatsOf(st, cards),
        practice: practiceStatsOf(st, gens),
        streak: streakOf(st.activity),
        misses: st.misses.length,
        lastActive: Object.keys(st.activity).sort().pop() || null,
      };
    },

    // ---- flashcards ----
    getCard(id) { return state.cards[id] || { box: 0, due: 0, seen: 0, lapses: 0 }; },
    gradeCard(id, correct) {
      const c = { ...this.getCard(id) };
      if (correct) c.box = Math.min((c.box || 0) + 1, MAX_BOX);
      else { c.box = 1; c.lapses = (c.lapses || 0) + 1; }
      c.seen = (c.seen || 0) + 1;
      c.due = Date.now() + INTERVALS[c.box] * 24 * 3600 * 1000;
      state.cards[id] = c;
      bumpActivity();
      save();
      return c;
    },
    deckStats(cards) { return deckStatsOf(state, cards); },
    weakCards(cards, limit) {
      const scored = cards.map(card => {
        const c = this.getCard(card.id);
        const score = c.seen ? (MAX_BOX - c.box) * 2 + Math.min(c.lapses, 5) : MAX_BOX;
        return { card, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.filter(s => s.score > 0).slice(0, limit || scored.length).map(s => s.card);
    },

    // ---- practice ----
    getPractice(genId) {
      const p = state.practice[genId];
      if (!p) return { attempts: 0, correct: 0, recent: [], variants: {} };
      if (!p.variants) p.variants = {};
      return p;
    },
    recordPractice(genId, correct, variant) {
      const p = this.getPractice(genId);
      p.attempts++;
      if (correct) p.correct++;
      p.recent.push(correct ? 1 : 0);
      if (p.recent.length > 10) p.recent.shift();
      if (variant) {
        const v = p.variants[variant] || { a: 0, c: 0 };
        v.a++; if (correct) v.c++;
        p.variants[variant] = v;
      }
      state.practice[genId] = p;
      bumpActivity();
      save();
      return p;
    },
    practiceStats(generators) { return practiceStatsOf(state, generators); },

    /* How badly a topic needs work, in [0, 1]. Untried topics score high,
     * small samples shrink toward the middle, recent answers weigh more. */
    weakness(genId) {
      const p = state.practice[genId];
      if (!p || !p.attempts) return 0.85;
      let num = 0, den = 0;
      p.recent.forEach((r, i) => { const w = i + 1; num += r * w; den += w; });
      const recentAcc = den ? num / den : p.correct / p.attempts;
      const acc = 0.7 * recentAcc + 0.3 * (p.correct / p.attempts);
      const conf = Math.min(p.attempts, 8) / 8;
      const adj = acc * conf + 0.5 * (1 - conf);
      return Math.min(1, Math.max(0.05, 1 - adj));
    },
    weakVariants(genId) {
      const p = this.getPractice(genId);
      return Object.entries(p.variants)
        .filter(([, v]) => v.a >= 2 && v.c / v.a < 0.6)
        .sort((a, b) => (a[1].c / a[1].a) - (b[1].c / b[1].a))
        .map(([name, v]) => ({ name, attempts: v.a, correct: v.c, acc: v.c / v.a }));
    },
    pickWeighted(generators, exclude) {
      const pool = generators.filter(g => generators.length < 2 || g.id !== exclude);
      if (!pool.length) return generators[0] || null;
      const weights = pool.map(g => Math.pow(this.weakness(g.id), 1.6) + 0.05);
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
      return pool[pool.length - 1];
    },

    // ---- mistake log ----
    recordMiss(entry) {
      const key = entry.genId + "|" + (entry.variant || "") + "|" + Date.now() + "|" + Math.random().toString(36).slice(2, 7);
      const sameShape = state.misses.filter(m => m.genId === entry.genId && m.variant === entry.variant);
      if (sameShape.length >= MAX_PER_VARIANT) {
        const oldest = sameShape[0];
        state.misses = state.misses.filter(m => m !== oldest);
      }
      state.misses.push({ ...entry, key, at: Date.now() });
      if (state.misses.length > MAX_MISSES) state.misses = state.misses.slice(-MAX_MISSES);
      save();
    },
    misses() { return state.misses.slice().reverse(); },
    missCount() { return state.misses.length; },
    clearMiss(key) { state.misses = state.misses.filter(m => m.key !== key); save(); },
    clearAllMisses() { state.misses = []; save(); },

    // ---- exams ----
    recordExam(result) {
      state.exams.push({ at: Date.now(), ...result });
      if (state.exams.length > MAX_EXAMS) state.exams = state.exams.slice(-MAX_EXAMS);
      bumpActivity(result.n || 1);
      save();
    },
    exams() { return state.exams.slice().reverse(); },

    // ---- learn: sections read ----
    isRead(unitId, idx) { return (state.read[unitId] || []).includes(idx); },
    setRead(unitId, idx, on) {
      const set = new Set(state.read[unitId] || []);
      if (on) set.add(idx); else set.delete(idx);
      state.read[unitId] = [...set];
      if (on) bumpActivity();
      save();
    },
    readCount(unitId) { return (state.read[unitId] || []).length; },

    // ---- activity ----
    activityOn(dt) { return state.activity[dayKey(dt)] || 0; },
    streak() { return streakOf(state.activity); },
    totalReviews() { return Object.values(state.activity).reduce((a, b) => a + b, 0); },

    // ---- export / import / reset ----
    exportJSON() { return JSON.stringify({ course: courseId, ...state }, null, 2); },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !parsed.cards) throw new Error("Not a valid progress file.");
      if (parsed.course && parsed.course !== courseId) throw new Error(`That file is for ${parsed.course}, not ${courseId}.`);
      state = normalise(parsed);
      save();
    },
    reset() { state = blank(); save(); },

    // ---- study sheet ----
    sheet() { return new Set(state.sheet || []); },
    toggleSheet(id) {
      const set = new Set(state.sheet || []);
      if (set.has(id)) set.delete(id); else set.add(id);
      state.sheet = [...set];
      save();
      return set;
    },
    setSheet(ids) { state.sheet = [...new Set(ids)]; save(); },

    // ---- theme ----
    getTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } },
    setTheme(t) { try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ } },
  };
})();
