/* ============================================================
 * IU Study Hub — core registry, shared utilities, question builders.
 * ------------------------------------------------------------
 * Every course lives in its own folder under courses/<id>/ and is
 * made of plain, self-registering script files:
 *
 *   courses/<id>/course.js   STUDY.registerCourse({...})  — syllabus facts
 *   courses/<id>/<unit>.js   STUDY.registerUnit("<id>", {...}) — one module
 *
 * Add the files to index.html with one <script> tag each and the app
 * picks them up everywhere: hub, dashboard, learn, flashcards,
 * practice, exam mode, reference and progress. See docs/ADDING_CONTENT.md.
 * ============================================================ */

window.STUDY = {
  courses: [],

  registerCourse(def) {
    const course = Object.assign({
      units: [], schedule: [], keyDates: [], gradeWeights: [], examPresets: [],
      color: "#990000", mark: "IU",
    }, def);
    course.units = [];
    this.courses.push(course);
    this.courses.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return course;
  },

  registerUnit(courseId, unit) {
    const course = this.getCourse(courseId);
    if (!course) throw new Error(`registerUnit: unknown course "${courseId}" — load course.js first`);
    unit.courseId = courseId;
    course.units.push(unit);
    course.units.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  },

  getCourse(id) { return this.courses.find(c => c.id === id) || null; },
  getUnit(course, id) { return (course && course.units.find(u => u.id === id)) || null; },

  /* The schedule row that is happening now, else the next one coming up. */
  scheduleNow(course, now) {
    const t = now || new Date();
    const day = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    const rows = course.schedule || [];
    const cur = rows.find(r => r.start <= day && day <= (r.end || r.start));
    if (cur) return { row: cur, status: "now" };
    const next = rows.find(r => r.start > day);
    if (next) return { row: next, status: "next" };
    return { row: null, status: rows.length && day > rows[rows.length - 1].start ? "done" : "none" };
  },

  /* ---------------- shared utilities ---------------- */
  util: {
    randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample(arr, k) { return this.shuffle(arr).slice(0, k); },
    gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; },
    round(x, d) { const p = Math.pow(10, d); return Math.round(x * p) / p; },
    fmt(x, d = 4) {
      if (!Number.isFinite(x)) return String(x);
      if (Number.isInteger(x)) return x.toLocaleString("en-US");
      return String(Math.round(x * Math.pow(10, d)) / Math.pow(10, d));
    },
    money(x, d) {
      const digits = d != null ? d : (Number.isInteger(x) ? 0 : 2);
      return (x < 0 ? "−$" : "$") + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    },
    plural(n, one, many) { return n === 1 ? one : (many != null ? many : one + "s"); },
    /* A reduced fraction as plain HTML text, e.g. frac(6, 8) -> "3/4". */
    frac(n, d) {
      const g = this.gcd(n, d) || 1;
      const num = n / g, den = d / g;
      return den === 1 ? String(num) : `${num}/${den}`;
    },
    /* Strip tags — used to compare choices and to search. */
    plain(html) { return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); },

    /* Round-robin picker: cycles through the whole list in random order
     * before any entry repeats, and never repeats back-to-back across
     * cycles. It is what keeps a topic from serving one shape twice running. */
    _queues: {},
    _last: {},
    rotate(key, list) {
      if (!list || !list.length) return null;
      if (list.length === 1) return list[0];
      let q = this._queues[key];
      // A queue built for a longer list (e.g. another course's pool) is stale.
      if (q && q.some(i => i >= list.length)) q = null;
      if (!q || !q.length) {
        q = this.shuffle(list.map((_, i) => i));
        if (q[0] === this._last[key]) [q[0], q[1]] = [q[1], q[0]];
        this._queues[key] = q;
      }
      const i = q.shift();
      this._last[key] = i;
      return list[i];
    },
    /* Draw from a bank without repeating until the bank is exhausted —
     * statement banks use this so a session does not show the same
     * sentence twice in five problems. */
    deal(key, bank, k) {
      const out = [];
      const seen = new Set();
      let guard = 0;
      while (out.length < k && guard++ < k * 6) {
        const item = this.rotate("deal:" + key, bank);
        if (!seen.has(item)) { seen.add(item); out.push(item); }
      }
      return out;
    },
  },

  /* A practice topic is a family of *structurally different* problem
   * variants, handed out round-robin. Each variant is { name, make() }.
   * The variant name describes the thinking the problem demands and is
   * revealed with the solution, never before. */
  makeGenerator({ id, name, blurb, variants, identify }) {
    return {
      id, name, blurb, identify: identify !== false,
      variantNames: variants.map(v => v.name),
      make() {
        const v = STUDY.util.rotate(id, variants);
        return { variant: v.name, ...v.make() };
      },
      /* A fresh question of one named type — used to re-test the exact
       * shape a student just missed, with new numbers and wording. */
      makeVariant(name) {
        const v = variants.find(x => x.name === name);
        return v ? { variant: v.name, ...v.make() } : this.make();
      },
    };
  },

  /* ---------------- question builders ----------------
   * Problems come in five kinds. All share { q, sol, kind } plus:
   *   num       answer: number, tol?, unit?, traps?: [{ value, why }]
   *   count     answer: integer (exact)
   *   mc        choices: [html], answer: index, whys?: [html|null]
   *   multi     choices: [html], answer: [indices]   (select all that apply)
   *   classify  cats: [label], items: [html], answer: [cat index per item], whys?: [html]
   * The builders below shuffle and normalise so content files stay short.
   */
  q: {
    /* mc({ q, right, wrong: [..] | [{t, why}], sol, why? , keepOrder? })
     * `right` is the correct choice; each wrong choice may carry a `why`
     * that names the misconception behind it. */
    mc({ q, right, wrong, sol, why, keepOrder, rightWhy }) {
      const opts = [{ t: right, ok: true, why: rightWhy || null }]
        .concat(wrong.map(w => (typeof w === "object" && w !== null && "t" in w) ? { t: w.t, ok: false, why: w.why || null } : { t: w, ok: false, why: null }));
      /* keepOrder: true → a canonical order that never depends on which option
       * is correct (direction words in natural order, then alphabetical);
       * keepOrder: [labels] → exactly that order. Never "right answer first". */
      let order;
      if (Array.isArray(keepOrder)) {
        const pos = t => { const i = keepOrder.indexOf(t); return i < 0 ? 999 : i; };
        order = opts.slice().sort((a, b) => pos(a.t) - pos(b.t));
      } else if (keepOrder) {
        order = opts.slice().sort((a, b) => STUDY.q._rank(a.t) - STUDY.q._rank(b.t) ||
          STUDY.util.plain(a.t).localeCompare(STUDY.util.plain(b.t)));
      } else order = STUDY.util.shuffle(opts);
      return {
        kind: "mc", q, sol: sol || why || "",
        choices: order.map(o => o.t),
        whys: order.map(o => o.why),
        answer: order.findIndex(o => o.ok),
      };
    },
    _rank(t) {
      const x = STUDY.util.plain(t).toLowerCase();
      if (/\b(increas|rise|rises|raise|more|higher|up|grow|expand|larger)/.test(x)) return 0;
      if (/\b(decreas|fall|falls|lower|less|fewer|down|shrink|smaller|reduce)/.test(x)) return 1;
      if (/\b(same|unchanged|no change|constant|stays)/.test(x)) return 2;
      if (/\b(ambiguous|indetermin|cannot|can't|depends|uncertain)/.test(x)) return 3;
      return 4;
    },
    tf({ q, truth, sol, why }) {
      return {
        kind: "mc", q, sol: sol || why || "",
        choices: ["True", "False"],
        whys: [truth ? null : why || null, truth ? why || null : null],
        answer: truth ? 0 : 1,
      };
    },
    /* multi({ q, options: [{t, ok, why?}], sol }) */
    multi({ q, options, sol }) {
      const order = STUDY.util.shuffle(options);
      return {
        kind: "multi", q, sol,
        choices: order.map(o => o.t),
        whys: order.map(o => o.why || null),
        answer: order.map((o, i) => o.ok ? i : -1).filter(i => i >= 0),
      };
    },
    /* classify({ q, cats: [..], items: [{t, cat, why?}], sol }) — `cat` is
     * the category label (or its index). Rendered as drop-downs, which is
     * one of the exam's own question formats. */
    classify({ q, cats, items, sol }) {
      const order = STUDY.util.shuffle(items);
      return {
        kind: "classify", q, sol, cats,
        items: order.map(i => i.t),
        whys: order.map(i => i.why || null),
        answer: order.map(i => typeof i.cat === "number" ? i.cat : cats.indexOf(i.cat)),
      };
    },
    num({ q, answer, sol, tol, unit, traps, kind }) {
      return { kind: kind || "num", q, answer, sol, tol, unit, traps };
    },
  },

  /* ---------------- tiny SVG graph helper ----------------
   * plot({ xLabel, yLabel, xMax, yMax, xTicks, yTicks, curves, points, arrows })
   *   curves: [{ pts: [[x, y], ...], style: "main"|"alt"|"dash"|"faint", label? }]
   *   points: [{ x, y, label, style?: "dot"|"hollow" }]
   * Colours come from CSS classes, so graphs follow the light/dark theme.
   */
  svg: {
    plot(o) {
      const W = o.width || 420, H = o.height || 300;
      const L = 58, R = 18, T = 16, B = 46;
      const pw = W - L - R, ph = H - T - B;
      const X = x => L + (x / o.xMax) * pw;
      const Y = y => T + ph - (y / o.yMax) * ph;
      const f = v => Math.round(v * 10) / 10;
      let s = `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || "graph"}" xmlns="http://www.w3.org/2000/svg">`;
      // gridlines + ticks
      for (const t of (o.xTicks || [])) {
        s += `<line class="g-grid" x1="${f(X(t))}" y1="${T}" x2="${f(X(t))}" y2="${T + ph}"/>`;
        s += `<text class="g-tick" x="${f(X(t))}" y="${T + ph + 16}" text-anchor="middle">${t}</text>`;
      }
      for (const t of (o.yTicks || [])) {
        s += `<line class="g-grid" x1="${L}" y1="${f(Y(t))}" x2="${L + pw}" y2="${f(Y(t))}"/>`;
        s += `<text class="g-tick" x="${L - 7}" y="${f(Y(t)) + 4}" text-anchor="end">${t}</text>`;
      }
      s += `<line class="g-axis" x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}"/>`;
      s += `<line class="g-axis" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/>`;
      s += `<text class="g-label" x="${L + pw / 2}" y="${H - 6}" text-anchor="middle">${o.xLabel || ""}</text>`;
      s += `<text class="g-label" x="14" y="${T + ph / 2}" text-anchor="middle" transform="rotate(-90 14 ${T + ph / 2})">${o.yLabel || ""}</text>`;
      for (const c of (o.curves || [])) {
        const d = c.pts.map(p => `${f(X(p[0]))},${f(Y(p[1]))}`).join(" ");
        s += `<polyline class="g-curve g-${c.style || "main"}" points="${d}"/>`;
        if (c.label) {
          const at = c.labelAt != null ? c.pts[c.labelAt] : c.pts[Math.floor(c.pts.length * 0.15)];
          s += `<text class="g-clabel g-${c.style || "main"}-t" x="${f(X(at[0])) + 6}" y="${f(Y(at[1])) - 6}">${c.label}</text>`;
        }
      }
      for (const a of (o.arrows || [])) {
        s += `<line class="g-arrow" x1="${f(X(a.from[0]))}" y1="${f(Y(a.from[1]))}" x2="${f(X(a.to[0]))}" y2="${f(Y(a.to[1]))}" marker-end="url(#gArrowHead)"/>`;
      }
      if ((o.arrows || []).length) {
        s += `<defs><marker id="gArrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="g-arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
      }
      for (const p of (o.points || [])) {
        s += `<circle class="g-pt ${p.style === "hollow" ? "g-pt-hollow" : ""}" cx="${f(X(p.x))}" cy="${f(Y(p.y))}" r="5"/>`;
        if (p.label) s += `<text class="g-ptlabel" x="${f(X(p.x)) + 8}" y="${f(Y(p.y)) - 8}">${p.label}</text>`;
      }
      return s + `</svg>`;
    },
    /* Points on a bowed-out (concave) PPC through (0, yMax) and (xMax, 0). */
    bowed(xMax, yMax, n) {
      const pts = [];
      const N = n || 40;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI / 2;
        pts.push([xMax * Math.sin(t), yMax * Math.cos(t)]);
      }
      return pts;
    },
    /* Height of that bowed curve at x — for deciding whether a point is
     * inside, on, or beyond the frontier. */
    bowedY(x, xMax, yMax) {
      const r = x / xMax;
      return r >= 1 ? 0 : yMax * Math.sqrt(1 - r * r);
    },
  },
};
