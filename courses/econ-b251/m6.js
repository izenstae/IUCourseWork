/* ============================================================
 * ECON B251 · Module 6 — Markets: Price Ceilings, Floors, Taxes and Subsidies
 * Price controls (rent ceilings and minimum wages), binding vs non-binding
 * controls, shortages, surpluses, search activity, black markets,
 * deadweight loss and fairness; tax incidence, revenue and deadweight loss;
 * incidence and elasticity; subsidies and production quotas.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const S = (...a) => a.map(s => `<div class="sol-step">${s}</div>`).join("");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const $ = (x, d) => U.money(x, d);
  const f = x => U.fmt(x);
  /* "a $6 tax" but "an $8 tax" / "an $11 tax" */
  const a$ = x => (/^(8|11|18)(\D|$)/.test(String(x)) || /^8/.test(String(x)) ? "an " : "a ") + $(x);
  const pctS = x => `${U.fmt(U.round(x, 1))}%`;
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const PB = "P<sub>B</sub>", PS = "P<sub>S</sub>";

  function tbl(head, rows) {
    return `<table class="data-tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  }
  /* Keep only traps that differ from the answer and from each other. */
  function traps(answer, list) {
    const out = [];
    for (const t of list) {
      if (!t || !Number.isFinite(t.value)) continue;
      if (Math.abs(t.value - answer) <= Math.max(0.02, Math.abs(answer) * 0.015)) continue;
      if (out.some(o => Math.abs(o.value - t.value) <= Math.max(0.011, Math.abs(t.value) * 0.01))) continue;
      out.push(t);
    }
    return out;
  }
  /* Retry a random draw until its constraints hold. */
  function draw(fn) {
    for (let i = 0; i < 2000; i++) { const r = fn(); if (r) return r; }
    throw new Error("m6: could not draw a well-posed problem");
  }

  /* Linear curves in quantity form: Q_D = A − bP, Q_S = C + dP. */
  const coef = b => (b === 1 ? "" : f(b));
  const dExpr = (A, b, v) => `${f(A)} − ${coef(b)}${v}`;
  const sExpr = (C0, d, v) => (C0 > 0 ? `${f(C0)} + ${coef(d)}${v}` : C0 === 0 ? `${coef(d)}${v}` : `${coef(d)}${v} − ${f(-C0)}`);
  const arg = (k, x) => (k === 1 ? f(x) : `(${f(x)})`);   // value substituted after a coefficient
  const eqD = (A, b, v = "P") => `Q<sub>D</sub> = ${dExpr(A, b, v)}`;
  const eqS = (C0, d, v = "P") => `Q<sub>S</sub> = ${sExpr(C0, d, v)}`;
  const aMinusC = (A, C0) => (C0 < 0 ? `${f(A)} + ${f(-C0)}` : C0 === 0 ? f(A) : `${f(A)} − ${f(C0)}`);
  function eqStep(m, v = "P", noun = "price") {
    return `Find the equilibrium first by setting Q<sub>D</sub> = Q<sub>S</sub>: ${dExpr(m.A, m.b, v)} = ${sExpr(m.C0, m.d, v)}, so ${f(m.b + m.d)}${v} = ${aMinusC(m.A, m.C0)} = ${f(m.A - m.C0)}. The equilibrium ${noun} is ${$(m.P0 != null ? m.P0 : m.W0)} and the equilibrium quantity is ${f(m.Q0)}.`;
  }

  const CITIES = ["Riverton", "Lakeport", "Cedar Falls", "Harbor City", "Maplewood", "Fairhaven", "Brookside", "Granite Bay",
    "Westvale", "Pine Ridge", "Ashford", "Kingsbridge", "Silver Lake", "Oakmont"];
  const NAMES = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils", "Rosa", "Idris",
    "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix"];
  const LABOR_WHO = ["fast-food workers", "grocery clerks", "warehouse workers", "car-wash attendants", "farmhands",
    "hotel housekeepers", "movie-theater staff", "retail cashiers"];
  const GOODS = [
    { s: "pizza", p: "pizzas", lo: 12, hi: 22, per: "week" },
    { s: "movie ticket", p: "movie tickets", lo: 10, hi: 18, per: "week" },
    { s: "yoga class", p: "yoga classes", lo: 14, hi: 28, per: "week" },
    { s: "haircut", p: "haircuts", lo: 18, hi: 36, per: "week" },
    { s: "bag of coffee beans", p: "bags of coffee beans", lo: 12, hi: 24, per: "week" },
    { s: "hoodie", p: "hoodies", lo: 25, hi: 48, per: "month" },
    { s: "board game", p: "board games", lo: 20, hi: 45, per: "month" },
    { s: "concert ticket", p: "concert tickets", lo: 35, hi: 75, per: "month" },
    { s: "car wash", p: "car washes", lo: 10, hi: 20, per: "week" },
    { s: "bottle of olive oil", p: "bottles of olive oil", lo: 12, hi: 26, per: "week" },
    { s: "phone case", p: "phone cases", lo: 14, hi: 30, per: "month" },
    { s: "bouquet of flowers", p: "bouquets of flowers", lo: 18, hi: 40, per: "week" },
    { s: "bike tune-up", p: "bike tune-ups", lo: 30, hi: 60, per: "month" },
    { s: "pair of running socks", p: "pairs of running socks", lo: 10, hi: 18, per: "week" },
  ];

  /* A goods market with integer-friendly wedges.
   * Slopes b = sc·bb, d = sc·dd. A wedge of size t = k(bb + dd) (tax, subsidy or
   * quota gap) splits into k·dd on the demand side and k·bb on the supply side,
   * and moves the quantity by sc·bb·dd·k. */
  function goodsMkt(tMax) {
    return draw(() => {
      const g = U.pick(GOODS);
      const bb = U.randInt(1, 4), dd = U.randInt(1, 4);
      const kMax = Math.min(2, Math.floor((tMax || 12) / (bb + dd)));
      if (kMax < 1) return null;
      const k = U.randInt(1, kMax);
      const P0 = U.randInt(g.lo, g.hi);
      const sc = U.pick([10, 20, 50, 100]);
      const m = bb * dd * k * U.randInt(3, 6) + U.randInt(0, 5);
      const t = k * (bb + dd), tb = k * dd, ts = k * bb, dQ = sc * bb * dd * k;
      if (P0 - ts < Math.max(4, 0.35 * P0) || P0 - tb < Math.max(4, 0.35 * P0)) return null;
      return { g, bb, dd, k, P0, sc, b: sc * bb, d: sc * dd, Q0: sc * m, A: sc * (m + bb * P0), C0: sc * (m - dd * P0), t, tb, ts, dQ, city: U.pick(CITIES) };
    });
  }
  /* A rental-housing market (rent in $ per month, quantity in apartments) with a binding ceiling. */
  function rentMkt() {
    return draw(() => {
      const bb = U.randInt(1, 3), dd = U.randInt(1, 3), j = U.randInt(1, 3);
      const gap = 50 * bb * j;
      const P0 = U.randInt(10, 22) * 100;
      if (gap > 450 || gap > P0 * 0.35) return null;
      const Q0 = Math.ceil(dd * gap * (1.8 + Math.random() * 2.2) / 100) * 100 + 500;
      const Pc = P0 - gap;
      return { city: U.pick(CITIES), b: bb, d: dd, P0, Q0, A: Q0 + bb * P0, C0: Q0 - dd * P0, Pc, gap,
        Qd: Q0 + bb * gap, Qs: Q0 - dd * gap, short: (bb + dd) * gap, P2: P0 + 50 * dd * j };
    });
  }
  /* A labor market (wage in $ per hour, quantity in thousands of workers) with a binding minimum wage. */
  function laborMkt() {
    return draw(() => {
      const W0 = U.randInt(10, 17), b = U.randInt(2, 6), d = U.randInt(2, 6), g = U.randInt(1, 4);
      const Q0 = U.randInt(6, 16) * 5;
      if (Q0 - b * g < Q0 * 0.5) return null;
      return { city: U.pick(CITIES), who: U.pick(LABOR_WHO), W0, b, d, g, Q0, A: Q0 + b * W0, C0: Q0 - d * W0, Wm: W0 + g,
        Qd: Q0 - b * g, Qs: Q0 + d * g, unemp: (b + d) * g };
    });
  }
  const rentEqs = r => `${eqD(r.A, r.b)} and ${eqS(r.C0, r.d)}, where P is the monthly rent in dollars and Q is the number of apartments`;
  const laborEqs = l => `${eqD(l.A, l.b, "W")} and ${eqS(l.C0, l.d, "W")}, where W is the hourly wage in dollars and Q is thousands of workers`;
  const goodsEqs = m => `${eqD(m.A, m.b)} and ${eqS(m.C0, m.d)}, where P is the price in dollars and Q is ${m.g.p} per ${m.g.per}`;

  /* ---------------- graph helpers ---------------- */
  /* Clip a line given as quantity = fQ(price) to the drawing box; returns 2 points sorted by quantity. */
  function lineQ(fQ, xMax, yMax) {
    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const P = yMax * 0.94 * i / 600, q = fQ(P);
      if (q >= 0 && q <= xMax * 0.82) pts.push([q, P]);
    }
    if (pts.length < 2) return null;
    const a = pts[0], b = pts[pts.length - 1];
    return a[0] <= b[0] ? [a, b] : [b, a];
  }
  /* Market graph: lines [{fQ | pts, style, label}], guides [[q, p]] (dotted drop lines),
   * notes [{x, y, t}] (region labels added as plain SVG text). */
  function mktPlot(o) {
    const curves = [];
    for (const g of (o.guides || [])) {
      curves.push({ pts: [[g[0], 0], [g[0], g[1]]], style: "faint" }, { pts: [[0, g[1]], [g[0], g[1]]], style: "faint" });
    }
    for (const L of o.lines) {
      const pts = L.pts || lineQ(L.fQ, o.xMax, o.yMax);
      if (!pts) continue;
      const labelAt = L.labelAt != null ? L.labelAt : (pts[0][1] >= pts[1][1] ? 0 : 1);
      curves.push({ pts, style: L.style || "main", label: L.label, labelAt });
    }
    let svg = G.plot({ xLabel: o.xLabel, yLabel: o.yLabel, xMax: o.xMax, yMax: o.yMax, xTicks: o.xTicks, yTicks: o.yTicks,
      curves, points: o.points || [], aria: o.aria || "market graph" });
    if (o.notes && o.notes.length) {
      const W = 420, H = 300, L = 58, R = 18, T = 16, B = 46, pw = W - L - R, ph = H - T - B;
      const X = x => Math.round((L + (x / o.xMax) * pw) * 10) / 10, Y = y => Math.round((T + ph - (y / o.yMax) * ph) * 10) / 10;
      const txt = o.notes.map(n => `<text class="g-tick" x="${X(n.x)}" y="${Y(n.y)}" text-anchor="middle" font-weight="700">${n.t}</text>`).join("");
      svg = svg.replace(/<\/svg>$/, txt + "</svg>");
    }
    return svg;
  }
  const hLine = (p, xMax, frac) => [[0, p], [xMax * (frac || 0.6), p]];
  const vLine = (q, yMax) => [[q, yMax * 0.04], [q, yMax * 0.9]];

  /* Wedge geometry for graph questions. kind: "tax" | "subsidy" | "quota".
   * a = price change on the demand side, c = on the supply side, dq = quantity change. */
  function wedgeGeo(kind) {
    return draw(() => {
      const g = U.pick(GOODS);
      const P0 = U.randInt(10, 30), a = U.randInt(2, 8), c = U.randInt(2, 8);
      const Q0 = U.pick([200, 300, 400, 500, 600]), dq = U.pick([50, 100, 150, 200]);
      const Q1 = kind === "subsidy" ? Q0 + dq : Q0 - dq;
      if (Q1 < 100) return null;
      const hiP = kind === "subsidy" ? P0 + c : P0 + a, loP = kind === "subsidy" ? P0 - a : P0 - c;
      if (loP < 4) return null;
      const xMax = Math.ceil(Math.max(Q0, Q1) * 1.45 / 50) * 50, yMax = Math.ceil(hiP * 1.4);
      if (dq < 0.1 * xMax || Math.min(a, c) < 0.07 * yMax) return null;
      const fD = P => Q0 - (P - P0) * dq / a, fS = P => Q0 + (P - P0) * dq / c;
      return { g, P0, a, c, Q0, Q1, dq, xMax, yMax, fD, fS, w: a + c, hiP, loP };
    });
  }
  function wedgePlot(w, kind) {
    const lines = [{ fQ: w.fD, style: "main", label: "D" }, { fQ: w.fS, style: "alt", label: "S" }];
    let guides, points, xT = [w.Q1, w.Q0].sort((x, y) => x - y), yT = [w.loP, w.P0, w.hiP];
    if (kind === "tax") {
      lines.push({ fQ: P => w.fS(P - w.w), style: "dash", label: "S + tax" });
      guides = [[w.Q0, w.P0], [w.Q1, w.hiP], [w.Q1, w.loP]];
      points = [{ x: w.Q0, y: w.P0, label: "E₀" }, { x: w.Q1, y: w.hiP, label: "E₁" }, { x: w.Q1, y: w.loP, label: "", style: "hollow" }];
    } else if (kind === "subsidy") {
      lines.push({ fQ: P => w.fS(P + w.w), style: "dash", label: "S − subsidy" });
      guides = [[w.Q0, w.P0], [w.Q1, w.hiP], [w.Q1, w.loP]];
      points = [{ x: w.Q0, y: w.P0, label: "E₀" }, { x: w.Q1, y: w.loP, label: "E₁" }, { x: w.Q1, y: w.hiP, label: "", style: "hollow" }];
    } else {
      lines.push({ pts: vLine(w.Q1, w.yMax), style: "dash", label: "Quota", labelAt: 1 });
      guides = [[w.Q0, w.P0], [w.Q1, w.hiP], [w.Q1, w.loP]];
      points = [{ x: w.Q0, y: w.P0, label: "E₀" }, { x: w.Q1, y: w.hiP, label: "E₁" }, { x: w.Q1, y: w.loP, label: "", style: "hollow" }];
    }
    return mktPlot({ xLabel: `${cap(w.g.p)} per ${w.g.per}`, yLabel: "Price ($)", xMax: w.xMax, yMax: w.yMax, xTicks: xT, yTicks: yT,
      lines, guides, points, aria: `${kind} graph` });
  }

  /* Statement-bank helpers */
  function selectAll(key, bank, n, q, sol) {
    const opts = U.deal(key, bank, n);
    if (!opts.some(o => o.ok)) opts[0] = U.pick(bank.filter(o => o.ok && !opts.includes(o)));
    if (opts.every(o => o.ok) && Math.random() < 0.6) opts[opts.length - 1] = U.pick(bank.filter(o => !o.ok));
    return Q.multi({ q, options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })), sol });
  }
  function whichNot(bank, q, rightWhyLead, sol) {
    const r = U.pick(bank.filter(o => !o.ok));
    const w = U.sample(bank.filter(o => o.ok), 3);
    return Q.mc({ q, right: r.t, rightWhy: `${rightWhyLead} ${r.why}`, wrong: w.map(x => ({ t: x.t, why: `This does happen. ${x.why}` })), sol });
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const ceilFig = mktPlot({
    xLabel: "Apartments (thousands)", yLabel: "Rent ($ per month)", xMax: 80, yMax: 2400,
    xTicks: [30, 40, 50], yTicks: [1100, 1500, 1900],
    lines: [{ fQ: P => 40 - (P - 1500) / 40, style: "main", label: "D" }, { fQ: P => 40 + (P - 1500) / 40, style: "alt", label: "S" },
      { pts: hLine(1100, 80, 0.7), style: "dash", label: "Rent ceiling", labelAt: 0 }],
    guides: [[40, 1500], [30, 1900], [50, 1100]],
    points: [{ x: 40, y: 1500, label: "E" }, { x: 30, y: 1100, label: "A" }, { x: 50, y: 1100, label: "B" }, { x: 30, y: 1900, label: "K" }],
    notes: [{ x: 40, y: 950, t: "shortage" }, { x: 33.6, y: 1480, t: "DWL" }],
    aria: "Rent ceiling below equilibrium creates a shortage",
  });
  const floorFig = mktPlot({
    xLabel: "Workers (thousands)", yLabel: "Wage ($ per hour)", xMax: 110, yMax: 28,
    xTicks: [48, 60, 78], yTicks: [13, 15, 18],
    lines: [{ fQ: W => 120 - 4 * W, style: "main", label: "D (firms)" }, { fQ: W => 6 * W - 30, style: "alt", label: "S (workers)" },
      { pts: hLine(18, 110, 0.78), style: "dash", label: "Minimum wage", labelAt: 0 }],
    guides: [[60, 15], [48, 18], [78, 18], [48, 13]],
    points: [{ x: 60, y: 15, label: "E" }, { x: 48, y: 18, label: "A" }, { x: 78, y: 18, label: "C" }],
    notes: [{ x: 63, y: 20.6, t: "unemployment" }, { x: 52, y: 15.9, t: "DWL" }],
    aria: "Minimum wage above equilibrium creates unemployment",
  });
  const taxFig = mktPlot({
    xLabel: "Bags of coffee per week", yLabel: "Price ($)", xMax: 1000, yMax: 26,
    xTicks: [400, 600], yTicks: [12, 14, 18],
    lines: [{ fQ: P => 1300 - 50 * P, style: "main", label: "D" }, { fQ: P => 100 * P - 800, style: "alt", label: "S" },
      { fQ: P => 100 * (P - 6) - 800, style: "dash", label: "S + tax" }],
    guides: [[600, 14], [400, 18], [400, 12]],
    points: [{ x: 600, y: 14, label: "E₀" }, { x: 400, y: 18, label: "E₁" }, { x: 400, y: 12, label: "", style: "hollow" }],
    notes: [{ x: 200, y: 14.5, t: "tax revenue" }, { x: 462, y: 14.4, t: "DWL" }],
    aria: "A tax drives a wedge between the price buyers pay and the price sellers receive",
  });
  const inelFig = mktPlot({
    xLabel: "Doses per week", yLabel: "Price ($)", xMax: 100, yMax: 30,
    xTicks: [50], yTicks: [12, 20],
    lines: [{ pts: vLine(50, 30), style: "main", label: "D", labelAt: 1 },
      { fQ: P => 50 + (P - 12) * 4, style: "alt", label: "S" }, { fQ: P => 50 + (P - 20) * 4, style: "dash", label: "S + tax" }],
    guides: [[50, 12], [50, 20]],
    points: [{ x: 50, y: 12, label: "E₀" }, { x: 50, y: 20, label: "E₁" }],
    aria: "With perfectly inelastic demand the price rises by the whole tax",
  });
  const subFig = mktPlot({
    xLabel: "Water heaters per month", yLabel: "Price ($)", xMax: 900, yMax: 64,
    xTicks: [500, 600], yTicks: [30, 40, 45],
    lines: [{ fQ: P => 900 - 10 * P, style: "main", label: "D" }, { fQ: P => 20 * P - 300, style: "alt", label: "S" },
      { fQ: P => 20 * (P + 15) - 300, style: "dash", label: "S − subsidy" }],
    guides: [[500, 40], [600, 45], [600, 30]],
    points: [{ x: 500, y: 40, label: "E₀" }, { x: 600, y: 30, label: "E₁" }, { x: 600, y: 45, label: "", style: "hollow" }],
    notes: [{ x: 568, y: 37.5, t: "DWL" }],
    aria: "A subsidy lowers the price buyers pay and raises output above the efficient level",
  });
  const quotaFig = mktPlot({
    xLabel: "Crates of oysters per week", yLabel: "Price ($)", xMax: 650, yMax: 50,
    xTicks: [300, 400], yTicks: [25, 30, 35],
    lines: [{ fQ: P => 1000 - 20 * P, style: "main", label: "D" }, { fQ: P => 20 * P - 200, style: "alt", label: "S" },
      { pts: vLine(300, 50), style: "dash", label: "Quota", labelAt: 1 }],
    guides: [[400, 30], [300, 35], [300, 25]],
    points: [{ x: 400, y: 30, label: "E₀" }, { x: 300, y: 35, label: "E₁" }, { x: 300, y: 25, label: "", style: "hollow" }],
    notes: [{ x: 150, y: 29, t: "quota rents" }, { x: 334, y: 29.3, t: "DWL" }],
    aria: "A production quota raises the price and opens a gap between price and marginal cost",
  });

  const notes = [
    {
      title: "Price ceilings and the housing market",
      lo: "Identify and show how a price ceiling creates a shortage and inefficiency in the housing market.",
      html: `<p>In a free market, rents do two jobs at once. They <b>ration</b> the apartments that exist, steering them to the renters who value them most, and they <b>signal</b> where to build and how much to spend on upkeep: high rents reward new construction and good maintenance. Governments sometimes override this with <b>price controls</b>, legal limits on prices. A <b>price ceiling</b> is a legal <em>maximum</em> price; applied to housing it is called a <b>rent ceiling</b> (or rent control). A <b>price floor</b> is a legal <em>minimum</em> price.</p>
<p><b>Binding or not?</b> A ceiling only matters if it is set <b>below</b> the equilibrium price. A ceiling at or above equilibrium is <b>non-binding</b>: the market rent is already legal, so nothing changes.</p>
<p>When a rent ceiling binds, the low legal rent raises the quantity demanded and cuts the quantity supplied, so there is a <b>shortage</b> (quantity demanded minus quantity supplied). Only the quantity <em>supplied</em> is actually rented, because nobody can force landlords to offer more. That sets off several further effects:</p>
<ul>
  <li><b>Search activity.</b> Renters spend time and money hunting for a vacancy. The true cost of housing becomes the regulated rent <em>plus</em> the opportunity cost of searching, and because fewer apartments are available, that full cost ends up <b>above</b> the rent an unregulated market would have charged.</li>
  <li><b>Black markets.</b> A black market is an illegal market operating alongside the controlled one. Some renters pay side payments ("key money", fees for old furniture) so the real rent rises above the ceiling, often above the free-market rent. The most renters would pay for the limited apartments is the height of the demand curve at the quantity supplied.</li>
  <li><b>Inefficiency.</b> Fewer apartments are rented than the efficient quantity, so a <b>deadweight loss</b> arises: apartments that renters value at more than their cost are never supplied. Resources used up in searching shrink consumer and producer surplus further.</li>
  <li><b>Non-price rationing.</b> With price no longer clearing the market, apartments go by <b>lotteries</b>, <b>queues</b> (waiting lists) or landlord <b>discrimination</b>.</li>
</ul>
${ceilFig}
<div class="example"><b>Example.</b> In the graph, the free-market rent in a city is $1,500 a month and 40 thousand apartments are rented (point E). A rent ceiling of $1,100 raises the quantity demanded to 50 thousand (B) and cuts the quantity supplied to 30 thousand (A): a <b>shortage of 20 thousand</b> apartments. Only 30 thousand are rented. For that 30-thousandth apartment, renters would be willing to pay $1,900 a month (point K), so black-market deals and search costs can push the real cost of housing well above both the $1,100 ceiling and the $1,500 free-market rent. The triangle between the curves from 30 to 40 thousand is the deadweight loss: ½ × 10 thousand × ($1,900 − $1,100) = $4 million of surplus lost each month.</div>
<p><b>Is it fair?</b> The <b>fair-rules view</b> objects that a ceiling blocks voluntary exchange between willing landlords and willing tenants. The <b>fair-results view</b> objects that it does not generally help the poor: the controlled apartments go to whoever is lucky, patient or favored, not to whoever is neediest. Cities that have tried rent ceilings find that they do create shortages, and that they lower rents for the lucky few (often long-time residents) while raising them for everyone else (often newcomers who move to the city).</p>
<div class="keyidea"><b>Key idea.</b> A binding ceiling (below equilibrium) causes a shortage; quantity traded equals the smaller quantity supplied, so there is a deadweight loss, plus search costs and black markets that eat into the "savings" from the low legal rent.</div>
<div class="trap"><b>Common trap.</b> "Lower rent means more people get housing." The opposite happens: a binding ceiling <em>reduces</em> the number of apartments rented, because quantity traded is limited by the quantity landlords are willing to supply. A ceiling set <em>above</em> equilibrium does nothing at all.</div>`,
      gens: ["b251-m6-binding", "b251-m6-gap", "b251-m6-rentceiling"],
    },
    {
      title: "Price floors and the labor market",
      lo: "Describe and demonstrate how a price floor creates a surplus and inefficiency in the labor market.",
      html: `<p>A <b>price floor</b> makes it illegal to trade below a set price. Applied to the labor market it is a <b>minimum wage</b>. In the labor market the roles are reversed from a goods market: <b>firms are the buyers</b> (they demand labor) and <b>workers are the sellers</b> (they supply it). Firms' surplus plays the part of consumer surplus and workers' surplus the part of producer surplus.</p>
<p>A floor binds only if it is set <b>above</b> the equilibrium wage. Then:</p>
<ul>
  <li>the quantity of labor <b>demanded falls</b>: firms hire fewer workers at the higher wage;</li>
  <li>the quantity of labor <b>supplied rises</b>: more people want jobs at that wage;</li>
  <li>the gap is a <b>surplus of labor, i.e. unemployment</b>; employment is set by the short side, the quantity demanded;</li>
  <li>employment is below the efficient quantity, so there is a <b>deadweight loss</b>, and resources spent on job search shrink both surpluses further.</li>
</ul>
${floorFig}
<div class="example"><b>Example.</b> In a city the demand for warehouse workers is Q<sub>D</sub> = 120 − 4W and the supply is Q<sub>S</sub> = 6W − 30 (thousands of workers, W in dollars per hour). Setting 120 − 4W = 6W − 30 gives W = $15 and 60 thousand jobs (point E). A minimum wage of $18 gives Q<sub>D</sub> = 120 − 72 = 48 thousand (A) and Q<sub>S</sub> = 108 − 30 = 78 thousand (C). Unemployment is 78 − 48 = <b>30 thousand</b> workers. Of these, 12 thousand lost jobs they would have had (60 → 48) and 18 thousand were drawn into the market by the higher wage. The 48-thousandth worker would have worked for $13, so the deadweight loss is ½ × 12 thousand × ($18 − $13) = $30,000 per hour.</div>
<p>A <b>living wage</b> is a related idea: an hourly wage high enough that someone working a 40-hour week can rent adequate housing for no more than 30% of what they earn. Several cities have living-wage laws, and their effects are like those of a minimum wage.</p>
<div class="keyidea"><b>Key idea.</b> Binding floor (above equilibrium) → surplus. In the labor market that surplus is unemployment, and employment falls to the quantity firms demand.</div>
<div class="trap"><b>Common trap.</b> Do not count the extra job-seekers as "new jobs". At a binding minimum wage the quantity of labor <em>supplied</em> rises, but <em>employment</em> falls, because firms decide how many people to hire. And a minimum wage set below the equilibrium wage has no effect at all.</div>`,
      gens: ["b251-m6-binding", "b251-m6-gap", "b251-m6-minwage"],
    },
    {
      title: "Taxes: incidence, revenue and deadweight loss",
      lo: "Explain, illustrate and analyze the effects of a tax in the market.",
      html: `<p>When a good is taxed, the law names someone to send the money to the government, but that says little about who really bears the cost. <b>Tax incidence</b> is the division of the burden of a tax between buyers and sellers. Compare the prices before and after:</p>
<ul>
  <li>if the price buyers pay rises by the <b>full</b> tax, buyers bear all of it;</li>
  <li>if it rises by <b>less</b> than the tax, buyers and sellers share it;</li>
  <li>if it does <b>not rise</b>, sellers bear all of it.</li>
</ul>
<p>A per-unit tax of $t drives a <b>wedge</b> between the price buyers pay (P<sub>B</sub>) and the price sellers keep (P<sub>S</sub>): P<sub>B</sub> − P<sub>S</sub> = t. A tax collected from sellers shifts the supply curve <b>up</b> by t (S + tax); a tax collected from buyers shifts the demand curve <b>down</b> by t (D − tax). Either way you end up at the same quantity, the same P<sub>B</sub> and the same P<sub>S</sub>, so <b>incidence does not depend on who legally pays</b>.</p>
<p><b>How to solve with equations</b> (Q<sub>D</sub> = A − bP, Q<sub>S</sub> = C + dP): set quantity demanded at P<sub>S</sub> + t equal to quantity supplied at P<sub>S</sub>, solve for P<sub>S</sub>, then add t to get P<sub>B</sub>.</p>
<ul>
  <li><b>Tax revenue</b> = tax per unit × quantity <em>after</em> the tax.</li>
  <li><b>Deadweight loss</b> = ½ × tax × (fall in quantity), the triangle between the curves from the new quantity to the old one.</li>
</ul>
${taxFig}
<div class="example"><b>Example.</b> Coffee beans: Q<sub>D</sub> = 1,300 − 50P and Q<sub>S</sub> = 100P − 800. Without a tax, 1,300 − 50P = 100P − 800 gives P = $14 and Q = 600 bags. Now a $6 tax per bag is collected from sellers: 1,300 − 50(P<sub>S</sub> + 6) = 100P<sub>S</sub> − 800, so 150P<sub>S</sub> = 1,800 and P<sub>S</sub> = $12, P<sub>B</sub> = $18, Q = 400. Buyers pay $4 more and sellers keep $2 less, so buyers bear 4/6 ≈ 67% of the tax. Revenue = $6 × 400 = <b>$2,400</b>; deadweight loss = ½ × $6 × (600 − 400) = <b>$600</b>. Had the law collected the tax from buyers instead, they would pay sellers $12 and the government $6: the same $18, the same 400 bags.</div>
<div class="keyidea"><b>Key idea.</b> Tax revenue is taken out of consumer and producer surplus, and the lost trades create a deadweight loss on top. The burden is shared according to the slopes (elasticities) of the curves, not according to who the law says pays.</div>
<div class="trap"><b>Common trap.</b> Computing revenue with the <em>old</em> equilibrium quantity, or forgetting the ½ in the deadweight-loss triangle. Also, the price buyers pay is not "old price + tax" unless demand is perfectly inelastic or supply perfectly elastic.</div>`,
      gens: ["b251-m6-tax"],
    },
    {
      title: "Who bears a tax? Incidence and elasticity",
      lo: "Explain how the elasticities of demand and supply determine the division of a tax between buyers and sellers, and when a tax is inefficient.",
      html: `<p>Whichever side is <b>less able to respond</b> to a price change ends up bearing more of the tax. The four extreme cases pin this down:</p>
<table class="data-tbl"><thead><tr><th>Case</th><th>Who pays the tax?</th></tr></thead><tbody>
<tr><td>Perfectly <b>inelastic demand</b> (vertical D)</td><td>Buyers pay all of it</td></tr>
<tr><td>Perfectly <b>elastic demand</b> (horizontal D)</td><td>Sellers pay all of it</td></tr>
<tr><td>Perfectly <b>inelastic supply</b> (vertical S)</td><td>Sellers pay all of it</td></tr>
<tr><td>Perfectly <b>elastic supply</b> (horizontal S)</td><td>Buyers pay all of it</td></tr>
</tbody></table>
<p>In between, the rules are: <b>the more inelastic the demand, the larger the buyers' share</b>, and <b>the more elastic the supply, the larger the buyers' share</b>. Equivalently, the more inelastic the supply, the larger the sellers' share.</p>
${inelFig}
<p><b>Taxes in practice.</b> Governments tend to tax goods with inelastic demand or inelastic supply. Demand for gasoline, alcohol and tobacco is inelastic, so buyers of those goods bear most of their taxes. The supply of labor is quite inelastic, so workers (the sellers of labor) bear most of the income tax and the Social Security tax.</p>
<p><b>Taxes and efficiency.</b> A tax reduces the quantity traded, and the trades that no longer happen are the deadweight loss. The exceptions are perfectly inelastic demand or perfectly inelastic supply: the quantity does not change, so there is <b>no deadweight loss</b>, only a transfer to the government.</p>
<div class="example"><b>Example.</b> Patients need exactly 50 doses a week of a medicine whatever the price (vertical demand in the graph). A $8 tax per dose is collected from the drug's sellers. Supply shifts up by $8, the price rises from $12 to $20, and 50 doses are still sold. Buyers bear the whole tax and, since the quantity is unchanged, there is no deadweight loss. Now picture a tax on the rental of a fixed number of riverside lots that cannot be increased: supply is vertical, the rent buyers pay cannot rise without leaving lots empty, so the owners bear the whole tax.</div>
<div class="keyidea"><b>Key idea.</b> The side that cannot easily walk away pays. Inelastic demand → buyers bear more; inelastic supply → sellers bear more.</div>
<div class="trap"><b>Common trap.</b> Mixing up the supply rule. It is the <em>elastic</em> supply that pushes the burden onto buyers: if sellers can easily shift into other markets, they will not accept a lower price, so buyers have to pay more.</div>`,
      gens: ["b251-m6-elastic", "b251-m6-tax"],
    },
    {
      title: "Subsidies",
      lo: "Explain, illustrate and analyze the effects of a subsidy in the market.",
      html: `<p>A <b>subsidy</b> is a payment the government makes to a producer, usually a fixed amount per unit produced. It works like a tax in reverse. Producers now receive the market price <em>plus</em> the subsidy, so the supply curve shifts <b>down</b> by the subsidy (S − subsidy). The results:</p>
<ul>
  <li>output <b>rises</b> above the efficient quantity;</li>
  <li>the price <b>buyers pay falls</b>;</li>
  <li>the amount <b>producers receive</b> per unit (price + subsidy) <b>rises</b>, and it equals their marginal cost at the larger output;</li>
  <li>the government pays <b>subsidy × new quantity</b>;</li>
  <li>for the extra units, marginal cost exceeds marginal benefit (the price buyers will pay), so overproduction creates a <b>deadweight loss</b> = ½ × subsidy × (rise in quantity).</li>
</ul>
${subFig}
<div class="example"><b>Example.</b> Home solar water heaters: Q<sub>D</sub> = 900 − 10P and Q<sub>S</sub> = 20P − 300. Without a subsidy, P = $40 and Q = 500 a month. A $15 subsidy per heater means producers get P<sub>B</sub> + 15: 900 − 10P<sub>B</sub> = 20(P<sub>B</sub> + 15) − 300, so 30P<sub>B</sub> = 900 and P<sub>B</sub> = $30. Output rises to 600; producers receive $30 + $15 = $45, which is the marginal cost of the 600th heater. The government pays $15 × 600 = <b>$9,000</b> a month, and the deadweight loss is ½ × $15 × 100 = <b>$750</b>.</div>
<div class="keyidea"><b>Key idea.</b> More output is not always better: a subsidy pushes production past the point where marginal benefit equals marginal cost, so it is inefficient even though buyers pay less and producers get more.</div>
<div class="trap"><b>Common trap.</b> Computing the government's cost with the <em>old</em> quantity. The subsidy is paid on every unit produced after it is introduced, including the extra ones it encourages.</div>`,
      gens: ["b251-m6-subsidy"],
    },
    {
      title: "Production quotas",
      lo: "Explain, illustrate and analyze the effects of a production quota in the market.",
      html: `<p>A <b>production quota</b> is an upper limit on the quantity of a good that may be produced in a given period. Like any quantity limit, it matters only if it is <b>below</b> the equilibrium quantity. A binding quota:</p>
<ul>
  <li>cuts output to the quota;</li>
  <li><b>raises the price</b> to what buyers will pay for that smaller quantity (read up to the demand curve);</li>
  <li><b>lowers marginal cost</b> to the supply curve's height at the quota;</li>
  <li>opens a gap between price and marginal cost. The gap times the quota is <b>quota rents</b>, surplus that goes to the producers who hold the right to produce;</li>
  <li>reduces total surplus: underproduction creates a <b>deadweight loss</b> = ½ × (price − marginal cost) × (fall in quantity).</li>
</ul>
${quotaFig}
<div class="example"><b>Example.</b> An oyster fishery: Q<sub>D</sub> = 1,000 − 20P and Q<sub>S</sub> = 20P − 200 (crates per week). The free-market outcome is P = $30 and 400 crates. A quota of 300 crates means buyers bid the price up to (1,000 − 300) ÷ 20 = <b>$35</b>, while the marginal cost of the 300th crate is (300 + 200) ÷ 20 = <b>$25</b>. Quota rents = ($35 − $25) × 300 = <b>$3,000</b> a week; deadweight loss = ½ × $10 × 100 = <b>$500</b>.</div>
<div class="keyidea"><b>Key idea.</b> A quota and a tax both shrink output and open a wedge between price and marginal cost. With a tax the wedge goes to the government as revenue; with a quota it goes to producers as quota rents.</div>
<div class="trap"><b>Common trap.</b> A quota does not cause a surplus of unsold goods. The price rises until buyers want exactly the quota quantity. And a quota set above the equilibrium quantity has no effect.</div>`,
      gens: ["b251-m6-quota"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m6-c-pricejobs", tag: "Principle", front: "What two jobs do rents (and wages) do in a free market?", back: "They <b>ration</b> the existing housing (labor) to those who value it most, and they <b>signal</b> how much to build and maintain, encouraging efficient construction and upkeep." },
    { id: "b251-m6-c-ceiling", tag: "Definition", front: "Price ceiling", back: "A legal <b>maximum</b> price: it is illegal to charge more. On housing it is a <b>rent ceiling</b>." },
    { id: "b251-m6-c-floor", tag: "Definition", front: "Price floor", back: "A legal <b>minimum</b> price: it is illegal to trade below it. In the labor market it is a <b>minimum wage</b>." },
    { id: "b251-m6-c-binding-ceil", tag: "Principle", front: "When does a price ceiling bind?", back: "Only when it is set <b>below</b> the equilibrium price. At or above equilibrium it has no effect." },
    { id: "b251-m6-c-binding-floor", tag: "Principle", front: "When does a price floor bind?", back: "Only when it is set <b>above</b> the equilibrium price. At or below equilibrium it has no effect." },
    { id: "b251-m6-c-shortage", tag: "Formula", front: "Size of the shortage under a binding ceiling?", back: "Quantity demanded − quantity supplied, both measured <b>at the ceiling price</b>." },
    { id: "b251-m6-c-shortside", tag: "Principle", front: "Under a binding rent ceiling, how many apartments are actually rented?", back: "The <b>quantity supplied</b> at the ceiling: the short side of the market. Landlords cannot be forced to offer more." },
    { id: "b251-m6-c-search", tag: "Definition", front: "Search activity — and how does it change the cost of housing under a rent ceiling?", back: "Time spent looking for someone to do business with. Under a ceiling, the full cost of housing = regulated rent <b>+</b> opportunity cost of searching, which ends up above the unregulated rent." },
    { id: "b251-m6-c-black", tag: "Definition", front: "Black market", back: "An <b>illegal</b> market that operates alongside a legal market in which a price ceiling (or other restriction) has been imposed. Prices there exceed the ceiling, often the free-market price too." },
    { id: "b251-m6-c-blackprice", tag: "Graph", front: "On a rent-ceiling graph, where do you read the most renters would pay (the black-market rent)?", back: "Go to the <b>quantity supplied</b> at the ceiling and read up to the <b>demand curve</b>. That height is the most someone would pay for the last available apartment." },
    { id: "b251-m6-c-ceil-dwl", tag: "Why", front: "Why does a binding rent ceiling create a deadweight loss?", back: "Fewer apartments are rented than the efficient quantity; units that renters value above their cost are never supplied. Search costs shrink surpluses further." },
    { id: "b251-m6-c-fairrules", tag: "Distinction", front: "Fair-rules vs fair-results objections to a rent ceiling?", back: "<b>Fair rules</b>: it blocks voluntary exchange between willing landlords and tenants. <b>Fair results</b>: it does not generally benefit the poor." },
    { id: "b251-m6-c-ration", tag: "Example", front: "With a binding rent ceiling, how is the scarce housing allocated?", back: "By non-price methods: <b>lotteries</b>, <b>queues</b> (waiting lists) and <b>discrimination</b> by landlords, plus illegal black-market payments." },
    { id: "b251-m6-c-winners", tag: "Example", front: "Who tends to win and lose from rent ceilings in practice?", back: "Winners: <b>long-standing residents</b> in controlled units. Losers: <b>mobile newcomers</b> who face the shortage, search costs and black-market rents." },
    { id: "b251-m6-c-minwage", tag: "Principle", front: "Effects of a binding minimum wage?", back: "Quantity of labor demanded <b>falls</b> (fewer jobs), quantity supplied <b>rises</b>, the gap is <b>unemployment</b>, and there is a deadweight loss." },
    { id: "b251-m6-c-unemp", tag: "Formula", front: "Unemployment created by a binding minimum wage?", back: "Quantity of labor supplied − quantity demanded, both at the minimum wage. Employment = quantity <b>demanded</b>." },
    { id: "b251-m6-c-laborroles", tag: "Distinction", front: "In the labor market, who are the buyers and sellers?", back: "<b>Firms</b> buy labor (demand), <b>workers</b> sell it (supply). Firms' surplus plays the role of consumer surplus; workers' surplus plays producer surplus." },
    { id: "b251-m6-c-living", tag: "Definition", front: "Living wage", back: "An hourly wage that lets someone working <b>40 hours a week</b> rent adequate housing for <b>no more than 30%</b> of earnings. Its effects are like a minimum wage's." },
    { id: "b251-m6-c-incidence", tag: "Definition", front: "Tax incidence", back: "The division of the burden of a tax between <b>buyers and sellers</b>." },
    { id: "b251-m6-c-wedge", tag: "Principle", front: "What does a per-unit tax do to prices?", back: "Drives a <b>wedge</b>: price buyers pay − price sellers receive = tax. Buyers pay more, sellers keep less, and the quantity falls." },
    { id: "b251-m6-c-who-legal", tag: "Principle", front: "Does it matter whether the law taxes buyers or sellers?", back: "<b>No.</b> A tax on sellers shifts S up by the tax; a tax on buyers shifts D down by it. Both give the same quantity, price paid and price received." },
    { id: "b251-m6-c-taxcalc", tag: "Formula", front: "Solving a tax with Q<sub>D</sub> = A − bP and Q<sub>S</sub> = C + dP", back: "Set A − b(P<sub>S</sub> + t) = C + dP<sub>S</sub>; solve for P<sub>S</sub>; then P<sub>B</sub> = P<sub>S</sub> + t, and plug in for the new quantity." },
    { id: "b251-m6-c-revenue", tag: "Formula", front: "Tax revenue and deadweight loss of a per-unit tax", back: "Revenue = tax × quantity <b>after</b> the tax. DWL = <b>½</b> × tax × (fall in quantity)." },
    { id: "b251-m6-c-dem-extreme", tag: "Principle", front: "Who pays a tax if demand is perfectly inelastic? Perfectly elastic?", back: "Perfectly inelastic demand → <b>buyers</b> pay it all. Perfectly elastic demand → <b>sellers</b> pay it all." },
    { id: "b251-m6-c-sup-extreme", tag: "Principle", front: "Who pays a tax if supply is perfectly inelastic? Perfectly elastic?", back: "Perfectly inelastic supply → <b>sellers</b> pay it all. Perfectly elastic supply → <b>buyers</b> pay it all." },
    { id: "b251-m6-c-elast-rule", tag: "Principle", front: "General rule linking elasticity and the buyers' share of a tax", back: "The more <b>inelastic the demand</b> and the more <b>elastic the supply</b>, the larger the buyers' share." },
    { id: "b251-m6-c-practice", tag: "Example", front: "Who bears most of the taxes on gasoline, alcohol and tobacco? On labor income?", back: "Gas, alcohol, tobacco: <b>buyers</b> (inelastic demand). Income and Social Security taxes: <b>workers</b> (inelastic labor supply)." },
    { id: "b251-m6-c-nodwl", tag: "Why", front: "When does a tax create no deadweight loss?", back: "When demand or supply is <b>perfectly inelastic</b>: the quantity does not change, so no trades are lost." },
    { id: "b251-m6-c-subsidy", tag: "Definition", front: "Subsidy — and its effects", back: "A payment by the government to a producer. Supply shifts down by the subsidy: output rises, buyers pay less, producers receive more (price + subsidy = MC), the government pays subsidy × new quantity, and overproduction causes a DWL." },
    { id: "b251-m6-c-subsidy-ineff", tag: "Why", front: "Why is a subsidy inefficient even though output rises?", back: "On the extra units, <b>marginal cost exceeds marginal benefit</b>: society spends more producing them than buyers value them." },
    { id: "b251-m6-c-quota", tag: "Definition", front: "Production quota — and its effects", back: "An upper limit on the quantity produced in a period. If below equilibrium: output falls to the quota, price rises, marginal cost falls, quota rents appear, and there is a DWL." },
    { id: "b251-m6-c-quotarent", tag: "Formula", front: "Quota rents", back: "(Price buyers pay at the quota − marginal cost at the quota) × quota. They go to the <b>producers</b> allowed to produce, not to the government." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“legal maximum”, “cap”, “rent control”, “no more than”", think: "Price ceiling — binds only below equilibrium", why: "A maximum that is above the market price changes nothing." },
    { when: "“legal minimum”, “minimum wage”, “price support”, “at least”", think: "Price floor — binds only above equilibrium", why: "A minimum that is below the market price changes nothing." },
    { when: "“waiting list”, “lottery”, “key money”, “apartment hunting”", think: "Shortage from a binding rent ceiling", why: "Price no longer rations housing, so time, luck and side payments do." },
    { when: "“most renters would pay for the available units”", think: "Read the demand curve at the quantity supplied", why: "That height is the black-market rent." },
    { when: "“unemployment” caused by a wage law", think: "Surplus of labor: Q<sub>S</sub> − Q<sub>D</sub> at the minimum wage", why: "Employment is set by firms' quantity demanded." },
    { when: "“who really pays the tax”, “burden”", think: "Tax incidence — compare P<sub>B</sub> and P<sub>S</sub> with the old price", why: "The law's choice of who pays does not decide the burden." },
    { when: "“tax collected from buyers” vs “from sellers”", think: "Same outcome either way", why: "Both create the same wedge between P<sub>B</sub> and P<sub>S</sub>." },
    { when: "“tax of $t” with demand and supply equations", think: "Solve Q<sub>D</sub>(P<sub>S</sub> + t) = Q<sub>S</sub>(P<sub>S</sub>)", why: "Buyers pay the seller's price plus the tax." },
    { when: "“tax revenue”", think: "Tax × quantity after the tax", why: "Not the old equilibrium quantity." },
    { when: "“deadweight loss” of a tax, subsidy or quota", think: "½ × wedge × change in quantity", why: "It is the triangle between the curves." },
    { when: "“addictive”, “no substitutes”, “necessity” + tax", think: "Inelastic demand → buyers bear most", why: "Buyers cannot easily cut back." },
    { when: "“fixed amount of land”, “workers keep working whatever the wage” + tax", think: "Inelastic supply → sellers bear most", why: "Sellers cannot easily cut back." },
    { when: "“payment to producers per unit”", think: "Subsidy: S shifts down, overproduction, DWL", why: "MC exceeds MB on the extra units." },
    { when: "“limit on how much may be produced”", think: "Quota: price up, MC down, quota rents, DWL", why: "Binds only below the equilibrium quantity." },
  ];

  /* ============================================================
   * PRACTICE 1 — Binding or not?
   * ============================================================ */
  const POLICY_BANK = [
    { t: "A city caps the monthly rent landlords may charge on existing apartments.", cat: "Price ceiling", why: "A cap on rent is a legal maximum: a rent ceiling." },
    { t: "A state law forbids lenders from charging more than 36% annual interest on small loans.", cat: "Price ceiling", why: "An interest rate is the price of a loan, and this sets its maximum." },
    { t: "After a storm, the state bans selling bottled water above its pre-storm price.", cat: "Price ceiling", why: "A ban on charging more than a set price is a ceiling." },
    { t: "The government sets the highest price pharmacies may charge for a common medicine.", cat: "Price ceiling", why: "A highest legal price is a ceiling." },
    { t: "A town limits taxi fares to no more than $3 per mile.", cat: "Price ceiling", why: "“No more than” marks a legal maximum." },
    { t: "A country fixes the maximum retail price of bread.", cat: "Price ceiling", why: "A maximum price is a ceiling." },
    { t: "A state requires employers to pay at least $15 an hour.", cat: "Price floor", why: "A minimum wage is a price floor in the labor market." },
    { t: "The government guarantees dairy farmers a minimum price for milk and buys whatever is left unsold.", cat: "Price floor", why: "A guaranteed minimum price is a floor." },
    { t: "A country bans selling alcohol below a minimum price per drink.", cat: "Price floor", why: "Forbidding sales below a price sets a floor." },
    { t: "A city requires its contractors to pay a living wage of at least $19 an hour.", cat: "Price floor", why: "A living wage is a minimum wage: a floor." },
    { t: "A law sets the lowest price at which wheat may be sold.", cat: "Price floor", why: "A lowest legal price is a floor." },
    { t: "A rule forbids airlines from selling tickets on a route below a set fare.", cat: "Price floor", why: "A minimum fare is a floor." },
  ];
  const PC_TF = [
    { t: "A price ceiling only has an effect if it is set below the equilibrium price.", ok: true, why: "Above equilibrium, the market price is already legal." },
    { t: "A price floor set below the equilibrium price has no effect.", ok: true, why: "The market price is already above the floor." },
    { t: "A binding price ceiling creates a shortage.", ok: true, why: "At the low legal price quantity demanded exceeds quantity supplied." },
    { t: "A binding price floor creates a surplus.", ok: true, why: "At the high legal price quantity supplied exceeds quantity demanded." },
    { t: "With a binding price ceiling, the quantity actually traded equals the quantity supplied.", ok: true, why: "Sellers cannot be forced to sell more than they want to." },
    { t: "With a binding price floor, the quantity actually traded equals the quantity demanded.", ok: true, why: "Buyers cannot be forced to buy more than they want to." },
    { t: "A price ceiling is a legal maximum price.", ok: true, why: "That is its definition." },
    { t: "A price ceiling set above the equilibrium price creates a shortage.", ok: false, why: "Above equilibrium the ceiling is not binding; nothing changes." },
    { t: "A price floor is a legal maximum price.", ok: false, why: "A floor is a legal minimum." },
    { t: "A binding price floor creates a shortage.", ok: false, why: "A binding floor creates a surplus." },
    { t: "A binding price ceiling increases the quantity traded because more buyers can afford the good.", ok: false, why: "Quantity traded falls to the quantity supplied." },
    { t: "Any price ceiling written into law changes the market price.", ok: false, why: "Only a ceiling below equilibrium changes the price." },
    { t: "With a binding price floor, the quantity traded equals the quantity supplied.", ok: false, why: "Sellers cannot sell more than buyers want, so the quantity traded is the quantity demanded." },
  ];

  const genBinding = STUDY.makeGenerator({
    id: "b251-m6-binding",
    name: "Binding or not? Ceilings and floors",
    blurb: "Decide whether a price ceiling or floor bites, and whether it creates a shortage, a surplus, or nothing at all.",
    variants: [
      {
        name: "Is the rent ceiling binding?",
        make() {
          const city = U.pick(CITIES);
          const P0 = U.randInt(9, 22) * 100;
          const r = Math.random();
          const binding = r < 0.55, equal = !binding && r < 0.65;
          const Pc = binding ? P0 - U.randInt(1, 4) * 100 : equal ? P0 : P0 + U.randInt(1, 4) * 100;
          const T = {
            bind: "It is binding: a shortage of apartments develops",
            none: `It is not binding: rent stays at ${$(P0)} and there is no shortage`,
            surplus: "It is binding: a surplus of vacant apartments develops",
            shortNB: "It is not binding, yet a shortage still develops because rents are now regulated",
          };
          const right = binding ? T.bind : T.none;
          const whys = binding ? {
            none: `A ceiling of ${$(Pc)} is below the equilibrium rent, so the equilibrium rent is now illegal. The ceiling bites.`,
            surplus: "Holding the rent down raises quantity demanded and lowers quantity supplied: that is a shortage, not a surplus.",
            shortNB: "This ceiling is binding, since it is below equilibrium.",
          } : {
            bind: `The ceiling (${$(Pc)}) is ${equal ? "equal to" : "above"} the equilibrium rent, so the market rent of ${$(P0)} is already legal. Nothing changes.`,
            surplus: "A ceiling never creates a surplus; when it does bind it causes a shortage. This one does not bind at all.",
            shortNB: "A ceiling that does not bind has no effect. Regulation alone does not create a shortage.",
          };
          const wrong = Object.keys(T).filter(k => T[k] !== right).map(k => ({ t: T[k], why: whys[k] }));
          return Q.mc({
            q: `In ${city}, the equilibrium rent for a one-bedroom apartment is ${$(P0)} a month. The city council passes a rent ceiling of ${$(Pc)} a month. Which statement is correct?`,
            right, wrong,
            rightWhy: binding ? "Below equilibrium, the ceiling holds rent down: quantity demanded rises, quantity supplied falls." : "A ceiling at or above equilibrium leaves the market rent legal, so the market is unchanged.",
            sol: S("A ceiling is a legal <em>maximum</em>. It bites only if the market price would otherwise be above it.",
              `Compare: ceiling ${$(Pc)} vs equilibrium ${$(P0)}. ${binding ? "The ceiling is lower, so it binds and creates a shortage." : `The ceiling is ${equal ? "equal" : "higher"}, so the equilibrium rent is allowed and the market stays put.`}`),
          });
        },
      },
      {
        name: "Is the price floor binding?",
        make() {
          const labor = Math.random() < 0.6;
          const binding = Math.random() < 0.55;
          let P0, F, q, unit;
          if (labor) {
            P0 = U.randInt(10, 17); F = binding ? P0 + U.randInt(1, 4) : P0 - U.randInt(1, 3);
            const who = U.pick(LABOR_WHO);
            q = `The equilibrium wage for ${who} in ${U.pick(CITIES)} is ${$(P0)} an hour. The state sets a minimum wage of ${$(F)} an hour. Which statement is correct?`;
            unit = "labor";
          } else {
            P0 = U.randInt(30, 50) / 10; F = U.round(binding ? P0 + U.randInt(2, 8) / 10 : P0 - U.randInt(2, 8) / 10, 2);
            q = `The equilibrium price of milk is ${$(P0, 2)} a gallon. The government sets a price floor of ${$(F, 2)} a gallon. Which statement is correct?`;
            unit = "milk";
          }
          const sur = labor ? "a surplus of labor (unemployment)" : "a surplus of unsold milk";
          const T = {
            bind: `It is binding: ${sur} develops`,
            none: labor ? `It is not binding: the wage stays at ${$(P0)} and employment is unchanged` : `It is not binding: the price stays at ${$(P0, 2)} and nothing changes`,
            short: labor ? "It is binding: a shortage of workers develops" : "It is binding: a shortage of milk develops",
            more: labor ? "It is binding: employment rises because more people want to work" : "It is binding: more milk is bought and sold because farmers produce more",
          };
          const right = binding ? T.bind : T.none;
          const whys = binding ? {
            none: "The floor is above equilibrium, so the equilibrium price is now illegal. The floor bites.",
            short: "A floor holds the price up: quantity supplied rises and quantity demanded falls. That is a surplus.",
            more: labor ? "Employment is set by how many workers firms hire, and at a higher wage firms hire fewer." : "Sales are limited by how much buyers want, and at a higher price they buy less.",
          } : {
            bind: "A floor below equilibrium is not binding: the market price is already above it.",
            short: "A non-binding floor has no effect, and a binding floor would cause a surplus, not a shortage.",
            more: "A floor below equilibrium changes nothing.",
          };
          const wrong = Object.keys(T).filter(k => T[k] !== right).map(k => ({ t: T[k], why: whys[k] }));
          return Q.mc({
            q, right, wrong,
            rightWhy: binding ? "Above equilibrium, a floor raises quantity supplied and cuts quantity demanded." : "A floor below the market price leaves the market unchanged.",
            sol: S("A floor is a legal <em>minimum</em>. It bites only if the market price would otherwise be below it.",
              `Here the floor is ${binding ? "above" : "below"} the equilibrium ${unit === "labor" ? "wage" : "price"}, so ${binding ? `it binds and creates ${sur}` : "the market is unaffected"}.`),
          });
        },
      },
      {
        name: "Classify controls by their effect",
        make() {
          const g = U.pick(GOODS), city = U.pick(CITIES);
          const P0 = U.randInt(g.lo + 4, g.hi);
          const vals = U.sample([1, 2, 3, 4], 4);
          const BS = "Binding: shortage", BP = "Binding: surplus", NB = "Not binding: no effect";
          const pool = [
            { t: `A price ceiling of ${$(P0 - vals[0])}`, cat: BS, why: "A ceiling below equilibrium binds and causes a shortage." },
            { t: `A price floor of ${$(P0 + vals[1])}`, cat: BP, why: "A floor above equilibrium binds and causes a surplus." },
            { t: `A price ceiling of ${$(P0 + vals[2])}`, cat: NB, why: "A ceiling above the equilibrium price leaves the market price legal." },
            { t: `A price floor of ${$(P0 - vals[3])}`, cat: NB, why: "A floor below the equilibrium price leaves the market price legal." },
            { t: `A price ceiling of ${$(P0)}`, cat: NB, why: "A ceiling exactly at equilibrium does not force the price away from it." },
            { t: `A price floor of ${$(P0)}`, cat: NB, why: "A floor exactly at equilibrium does not force the price away from it." },
          ];
          const items = pool.slice(0, 2).concat(U.sample(pool.slice(2), 3));
          return Q.classify({
            q: `In ${city}, the equilibrium price of a ${g.s} is ${$(P0)}. Classify the effect of each possible policy (each considered on its own).`,
            cats: [BS, BP, NB], items,
            sol: S("Ceiling = legal maximum, floor = legal minimum. A control matters only if it makes the equilibrium price illegal.",
              `A ceiling binds only below ${$(P0)} (→ shortage); a floor binds only above ${$(P0)} (→ surplus). Anything else, including a control set exactly at ${$(P0)}, has no effect.`),
          });
        },
      },
      {
        name: "Ceiling or floor?",
        make() {
          const items = U.sample(POLICY_BANK.filter(i => i.cat === "Price ceiling"), 2)
            .concat(U.sample(POLICY_BANK.filter(i => i.cat === "Price floor"), 2));
          for (const x of U.deal("m6-policy", POLICY_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Classify each government policy as a price ceiling or a price floor.",
            cats: ["Price ceiling", "Price floor"], items,
            sol: S("Ask whether the law sets the <em>highest</em> price allowed (ceiling) or the <em>lowest</em> (floor).",
              "Wages and interest rates are prices too: a minimum wage or living wage is a floor, and a cap on interest rates is a ceiling."),
          });
        },
      },
      {
        name: "Predict: the market moves under a fixed control",
        make() {
          const city = U.pick(CITIES);
          const c = U.pick(["ceilBecomes", "ceilStops", "floorBecomes", "floorStops"]);
          let q, right, wrong;
          const A = "The control becomes binding and a shortage appears";
          const B = "The control becomes binding and a surplus appears";
          const Nn = "Nothing changes: the effect of a control is fixed when the law is passed";
          if (c === "ceilBecomes") {
            const P0 = U.randInt(9, 16) * 100, Pc = P0 + U.randInt(1, 3) * 100, P1 = Pc + U.randInt(1, 3) * 100;
            q = `${city} has a rent ceiling of ${$(Pc)} a month, and the equilibrium rent is ${$(P0)}. Then a large employer opens a headquarters in town, and demand for apartments rises so much that the equilibrium rent would be ${$(P1)}. What happens?`;
            right = A;
            wrong = [{ t: B, why: "The ceiling holds rent below the new equilibrium, so quantity demanded exceeds quantity supplied: a shortage." },
              { t: `The ceiling stays non-binding and rent rises to ${$(P1)}`, why: `Charging ${$(P1)} would break the law; the ceiling now caps rent at ${$(Pc)}.` },
              { t: Nn, why: "Whether a ceiling binds depends on where the equilibrium is, and that can change." }];
          } else if (c === "ceilStops") {
            const Pc = U.randInt(9, 16) * 100, P0 = Pc + U.randInt(1, 3) * 100, P1 = Pc - U.randInt(1, 3) * 100;
            q = `${city} has a rent ceiling of ${$(Pc)} a month, below the equilibrium rent of ${$(P0)}, so there is a shortage. Then a new university campus nearby closes, and demand falls so the equilibrium rent would be ${$(P1)}. What happens?`;
            right = `The ceiling stops binding: rent falls to ${$(P1)} and the shortage disappears`;
            wrong = [{ t: A, why: "The ceiling was already binding; now the equilibrium is below it, so it no longer bites." },
              { t: `Rent stays at the ceiling of ${$(Pc)} and the shortage gets worse`, why: `Nothing forces rent to stay at ${$(Pc)}: landlords with vacancies will cut rent to ${$(P1)}.` },
              { t: Nn, why: "Whether a ceiling binds depends on where the equilibrium is, and that can change." }];
          } else if (c === "floorBecomes") {
            const Wm = U.randInt(11, 16), W0 = Wm + U.randInt(1, 3), W1 = Wm - U.randInt(1, 3);
            q = `The minimum wage in ${city} is ${$(Wm)} an hour, and the equilibrium wage for ${U.pick(LABOR_WHO)} is ${$(W0)}. Then a wave of new workers moves to the city, increasing labor supply so the equilibrium wage would fall to ${$(W1)}. What happens?`;
            right = B;
            wrong = [{ t: A, why: "The floor holds the wage above the new equilibrium, so more people want work than firms hire: a surplus (unemployment)." },
              { t: `The minimum wage stays non-binding and the wage falls to ${$(W1)}`, why: `Paying ${$(W1)} is illegal; the wage cannot fall below ${$(Wm)}.` },
              { t: Nn, why: "Whether a floor binds depends on where the equilibrium is, and that can change." }];
          } else {
            const Wm = U.randInt(12, 17), W0 = Wm - U.randInt(1, 3), W1 = Wm + U.randInt(1, 3);
            q = `The minimum wage in ${city} is ${$(Wm)} an hour, above the equilibrium wage of ${$(W0)} for ${U.pick(LABOR_WHO)}, so there is unemployment. Then a booming local economy raises the demand for labor so the equilibrium wage would be ${$(W1)}. What happens?`;
            right = `The minimum wage stops binding: the wage rises to ${$(W1)} and the surplus of labor disappears`;
            wrong = [{ t: B, why: "The floor was binding before; now the equilibrium wage is above it, so it no longer bites." },
              { t: `The wage stays at ${$(Wm)} and unemployment rises`, why: `Nothing stops firms from paying more than the minimum. They will bid the wage up to ${$(W1)}.` },
              { t: Nn, why: "Whether a floor binds depends on where the equilibrium is, and that can change." }];
          }
          return Q.mc({
            q, right, wrong,
            rightWhy: "A control binds only when the equilibrium price is on the illegal side of it: above a ceiling or below a floor.",
            sol: S("Compare the control with the <em>new</em> equilibrium price, not the old one.",
              "Ceiling below the new equilibrium → binding (shortage). Floor above the new equilibrium → binding (surplus). Otherwise the market simply goes to the new equilibrium."),
          });
        },
      },
      {
        name: "Effect of a control from a schedule",
        make() {
          const m = goodsMkt(8);
          const step = U.pick([1, 2]);
          if (m.Q0 - 3 * m.d * step <= 0) return this.make();
          const rows = [];
          for (let i = -3; i <= 3; i++) rows.push({ P: m.P0 + step * i, qd: m.Q0 - m.b * step * i, qs: m.Q0 + m.d * step * i });
          const i = U.pick([-2, -1, 1, 2]);
          const ceiling = Math.random() < 0.5;
          const r = rows[i + 3];
          const gap = Math.abs(r.qd - r.qs);
          const binding = ceiling ? i < 0 : i > 0;
          const kind = ceiling ? "shortage" : "surplus";
          const T = {
            sh: `A shortage of ${f(gap)} ${m.g.p}`,
            su: `A surplus of ${f(gap)} ${m.g.p}`,
            none: "No shortage or surplus: the market stays at equilibrium",
          };
          const half = ceiling ? r.qd - m.Q0 : m.Q0 - r.qd;
          let right, wrong;
          if (binding) {
            right = ceiling ? T.sh : T.su;
            wrong = [{ t: ceiling ? T.su : T.sh, why: ceiling ? "A binding ceiling holds the price down, so quantity demanded exceeds quantity supplied: a shortage." : "A binding floor holds the price up, so quantity supplied exceeds quantity demanded: a surplus." },
              { t: T.none, why: `The ${ceiling ? "ceiling is below" : "floor is above"} the equilibrium price of ${$(m.P0)}, so it binds.` },
              { t: `A ${kind} of ${f(Math.abs(half))} ${m.g.p}`, why: "That compares one quantity with the equilibrium quantity. The gap is between quantity demanded and quantity supplied at the controlled price." }];
          } else {
            right = T.none;
            wrong = [{ t: ceiling ? T.su : T.sh, why: `That reads the row at ${$(r.P)} as if the price were forced there. A ${ceiling ? "ceiling above" : "floor below"} equilibrium does not move the price, which stays at ${$(m.P0)}.` },
              { t: ceiling ? T.sh : T.su, why: `A ${ceiling ? "ceiling" : "floor"} on the non-binding side of equilibrium creates no ${kind}.` },
              { t: `A ${ceiling ? "shortage" : "surplus"} of ${f(Math.abs(half))} ${m.g.p}`, why: "The control does not bind, so there is no gap at all." }];
          }
          return Q.mc({
            q: `The market for ${m.g.p} in ${m.city} (quantities per ${m.g.per}):${tbl(["Price", "Quantity demanded", "Quantity supplied"], rows.map(x => [$(x.P), f(x.qd), f(x.qs)]))}The government imposes a price <b>${ceiling ? "ceiling" : "floor"}</b> of ${$(r.P)}. What is the result?`,
            right, wrong,
            rightWhy: binding ? `At ${$(r.P)}, quantity demanded is ${f(r.qd)} and quantity supplied is ${f(r.qs)}.` : `The equilibrium price ${$(m.P0)} is legal under this ${ceiling ? "ceiling" : "floor"}, so the market clears there.`,
            sol: S(`Find the equilibrium first: the row where quantity demanded equals quantity supplied is ${$(m.P0)} (${f(m.Q0)} ${m.g.p}).`,
              `A ${ceiling ? "ceiling" : "floor"} of ${$(r.P)} is ${r.P < m.P0 ? "below" : "above"} equilibrium, so it is ${binding ? "binding" : "not binding"}.`,
              binding ? `At ${$(r.P)}: ${ceiling ? `${f(r.qd)} − ${f(r.qs)}` : `${f(r.qs)} − ${f(r.qd)}`} = <b>${f(gap)}</b>, a ${kind}.` : "The price stays at equilibrium, so there is no shortage or surplus."),
          });
        },
      },
      {
        name: "Select all true statements about price controls",
        make() {
          return selectAll("m6-pctf", PC_TF, 5, "Select <b>all</b> statements that are true.",
            S("Ceiling = maximum, binds only below equilibrium, causes a shortage. Floor = minimum, binds only above equilibrium, causes a surplus.",
              "The quantity actually traded is always the <em>smaller</em> of quantity demanded and quantity supplied: Q<sub>S</sub> under a ceiling, Q<sub>D</sub> under a floor."));
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Size of shortages and surpluses
   * ============================================================ */
  function rentSolSteps(r) {
    return [eqStep(r, "P", "rent") + ` The ceiling of ${$(r.Pc)} is below it, so it binds.`,
      `At ${$(r.Pc)}: Q<sub>D</sub> = ${dExpr(r.A, r.b, arg(r.b, r.Pc))} = ${f(r.Qd)} and Q<sub>S</sub> = ${sExpr(r.C0, r.d, arg(r.d, r.Pc))} = ${f(r.Qs)}.`];
  }
  function laborSolSteps(l) {
    return [eqStep(l, "W", "wage") + ` The minimum wage of ${$(l.Wm)} is above it, so it binds.`,
      `At ${$(l.Wm)}: Q<sub>D</sub> = ${dExpr(l.A, l.b, arg(l.b, l.Wm))} = ${f(l.Qd)} thousand and Q<sub>S</sub> = ${sExpr(l.C0, l.d, arg(l.d, l.Wm))} = ${f(l.Qs)} thousand.`];
  }

  const genGap = STUDY.makeGenerator({
    id: "b251-m6-gap",
    name: "Shortages and surpluses: how big?",
    blurb: "Compute shortages, unemployment, the quantity actually traded and black-market prices from equations and schedules.",
    variants: [
      {
        name: "Rent ceiling: size of the shortage",
        make() {
          const r = rentMkt();
          return Q.num({
            q: `In ${r.city}, ${rentEqs(r)}. The city imposes a rent ceiling of ${$(r.Pc)} a month. How large is the shortage of apartments?`,
            answer: r.short, unit: "apartments", kind: "count",
            traps: traps(r.short, [
              { value: r.Qd, why: "That is the quantity demanded at the ceiling. The shortage is quantity demanded minus quantity supplied." },
              { value: r.Qs, why: "That is the quantity supplied (the apartments actually rented), not the shortage." },
              { value: r.Q0 - r.Qs, why: "That is only the fall in quantity supplied from the equilibrium. Add the rise in quantity demanded too." },
              { value: r.Qd - r.Q0, why: "That is only the rise in quantity demanded. The shortage also includes the fall in quantity supplied." },
            ]),
            sol: S(...rentSolSteps(r), `Shortage = Q<sub>D</sub> − Q<sub>S</sub> = ${f(r.Qd)} − ${f(r.Qs)} = <b>${f(r.short)} apartments</b>.`),
          });
        },
      },
      {
        name: "Minimum wage: size of unemployment",
        make() {
          const l = laborMkt();
          return Q.num({
            q: `In ${l.city}, the market for ${l.who} is described by ${laborEqs(l)}. A minimum wage of ${$(l.Wm)} an hour is introduced. How much unemployment does it create, in thousands of workers?`,
            answer: l.unemp, unit: "thousand workers",
            traps: traps(l.unemp, [
              { value: l.b * l.g, why: "That is only the number of jobs lost. Unemployment also counts the extra people who now want to work." },
              { value: l.d * l.g, why: "That is only the rise in the quantity of labor supplied. Add the jobs lost too." },
              { value: l.Qs, why: "That is the quantity of labor supplied, not the surplus." },
              { value: l.Qd, why: "That is the number employed, not the number unemployed." },
            ]),
            sol: S(...laborSolSteps(l), `Unemployment = Q<sub>S</sub> − Q<sub>D</sub> = ${f(l.Qs)} − ${f(l.Qd)} = <b>${f(l.unemp)} thousand workers</b>.`),
          });
        },
      },
      {
        name: "From a schedule (might be zero)",
        make() {
          const m = goodsMkt(8);
          const step = U.pick([1, 2]);
          if (m.Q0 - 3 * m.d * step <= 0) return this.make();
          const rows = [];
          for (let i = -3; i <= 3; i++) rows.push({ P: m.P0 + step * i, qd: m.Q0 - m.b * step * i, qs: m.Q0 + m.d * step * i });
          const binding = Math.random() < 0.6;
          const ceiling = Math.random() < 0.5;
          const i = (binding === ceiling ? -1 : 1) * U.randInt(1, 3);
          const r = rows[i + 3];
          const gap = Math.abs(r.qd - r.qs);
          const ans = binding ? gap : 0;
          const tr = binding ? [
            { value: Math.abs(r.qd - m.Q0), why: "That compares quantity demanded with the equilibrium quantity. Use the gap between quantity demanded and quantity supplied at the controlled price." },
            { value: Math.abs(r.qs - m.Q0), why: "That compares quantity supplied with the equilibrium quantity. Use the gap between quantity demanded and quantity supplied at the controlled price." },
            { value: ceiling ? r.qd : r.qs, why: "That is one quantity, not the gap between the two." },
          ] : [{ value: gap, why: `That treats the ${ceiling ? "ceiling" : "floor"} as if it forced the price to ${$(r.P)}. It is on the non-binding side of equilibrium, so the price stays at ${$(m.P0)}.` }];
          return Q.num({
            q: `The market for ${m.g.p} in ${m.city} (quantities per ${m.g.per}):${tbl(["Price", "Quantity demanded", "Quantity supplied"], rows.map(x => [$(x.P), f(x.qd), f(x.qs)]))}The government sets a price <b>${ceiling ? "ceiling" : "floor"}</b> of ${$(r.P)}. How large is the resulting shortage or surplus, in ${m.g.p}? (Enter 0 if there is none.)`,
            answer: ans, unit: m.g.p, kind: "count",
            traps: traps(ans, tr),
            sol: S(`Equilibrium is where the two quantities match: ${$(m.P0)} and ${f(m.Q0)} ${m.g.p}. Then ask whether the control makes that price illegal.`,
              `A ${ceiling ? "ceiling" : "floor"} of ${$(r.P)} is ${r.P < m.P0 ? "below" : "above"} equilibrium, so it is <b>${binding ? "binding" : "not binding"}</b>.`,
              binding ? `At ${$(r.P)}: |${f(r.qd)} − ${f(r.qs)}| = <b>${f(gap)}</b> ${m.g.p} (a ${ceiling ? "shortage" : "surplus"}).` : "The market stays at equilibrium, so the answer is <b>0</b>."),
          });
        },
      },
      {
        name: "Quantity actually rented under a ceiling",
        make() {
          const r = rentMkt();
          return Q.num({
            q: `In ${r.city}, ${rentEqs(r)}. A rent ceiling of ${$(r.Pc)} a month is imposed. How many apartments are actually rented?`,
            answer: r.Qs, unit: "apartments", kind: "count",
            traps: traps(r.Qs, [
              { value: r.Qd, why: "Renters want that many, but landlords will only offer the quantity supplied. You cannot rent an apartment nobody offers." },
              { value: r.Q0, why: "That is the free-market quantity. The ceiling changes how many are offered." },
              { value: r.short, why: "That is the shortage, not the number rented." },
            ]),
            sol: S("Under a binding ceiling, the quantity traded is the <em>short side</em> of the market: the quantity supplied.",
              ...rentSolSteps(r), `So <b>${f(r.Qs)} apartments</b> are rented, ${f(r.Q0 - r.Qs)} fewer than without the ceiling.`),
          });
        },
      },
      {
        name: "Black-market rent",
        make() {
          const r = rentMkt();
          return Q.num({
            q: `In ${r.city}, ${rentEqs(r)}. A rent ceiling of ${$(r.Pc)} a month is imposed. Suppose the apartments that are offered end up with the renters who value them most, through illegal side payments. What is the highest monthly rent at which renters would still want all of the apartments that are offered? (This is how high black-market rents can go.)`,
            answer: r.P2, unit: "$",
            traps: traps(r.P2, [
              { value: r.Pc, why: "That is the legal ceiling. Renters competing for the few apartments are willing to pay much more." },
              { value: r.P0, why: "That is the free-market rent. With fewer apartments available than in the free market, renters will pay more than this." },
            ]),
            sol: S("Find how many apartments are offered at the ceiling, then read up to the <em>demand</em> curve: what would renters pay for exactly that many?",
              `Q<sub>S</sub> at ${$(r.Pc)} = ${sExpr(r.C0, r.d, arg(r.d, r.Pc))} = ${f(r.Qs)} apartments.`,
              `Set Q<sub>D</sub> = ${f(r.Qs)}: ${f(r.A)} − ${coef(r.b)}P = ${f(r.Qs)}, so P = (${f(r.A)} − ${f(r.Qs)}) ÷ ${r.b} = <b>${$(r.P2)}</b>. That is above both the ceiling (${$(r.Pc)}) and the free-market rent (${$(r.P0)}).`),
          });
        },
      },
      {
        name: "Reverse: which ceiling causes this shortage?",
        make() {
          const r = rentMkt();
          return Q.num({
            q: `In ${r.city}, ${rentEqs(r)}. A housing official wants to know which rent ceiling would cause a shortage of exactly ${f(r.short)} apartments. What ceiling rent would do that?`,
            answer: r.Pc, unit: "$",
            traps: traps(r.Pc, [
              { value: r.P0 - r.short, why: `Each $1 cut in rent changes the gap by ${r.b + r.d} apartments (${r.b} more demanded plus ${r.d} fewer supplied), so divide the shortage by ${r.b + r.d}.` },
              { value: r.P0 + r.gap, why: "A price above equilibrium creates a surplus, not a shortage. The ceiling must be below equilibrium." },
              { value: r.P0, why: "At the equilibrium rent there is no shortage at all." },
            ]),
            sol: S(eqStep(r, "P", "rent"),
              `Below equilibrium, each $1 cut in rent raises quantity demanded by ${r.b} and lowers quantity supplied by ${r.d}, widening the gap by ${r.b + r.d} apartments.`,
              `Cut needed = ${f(r.short)} ÷ ${r.b + r.d} = ${$(r.gap)}, so the ceiling is ${$(r.P0)} − ${$(r.gap)} = <b>${$(r.Pc)}</b>. Check: Q<sub>D</sub> = ${f(r.Qd)}, Q<sub>S</sub> = ${f(r.Qs)}, gap ${f(r.short)}.`),
          });
        },
      },
      {
        name: "Minimum wage: jobs lost",
        make() {
          const l = laborMkt();
          const ans = l.b * l.g;
          return Q.num({
            q: `In ${l.city}, the market for ${l.who} is described by ${laborEqs(l)}. A minimum wage of ${$(l.Wm)} an hour is introduced. Compared with the equilibrium, how many fewer workers (in thousands) are employed?`,
            answer: ans, unit: "thousand workers",
            traps: traps(ans, [
              { value: l.unemp, why: "That is total unemployment, which also includes newcomers who were not working before. The question asks how much employment falls." },
              { value: l.d * l.g, why: "That is the rise in the quantity of labor supplied. Employment depends on how many workers firms hire." },
              { value: l.Qd, why: "That is employment at the minimum wage, not the fall in employment." },
            ]),
            sol: S("Employment under a binding minimum wage is the quantity of labor <em>demanded</em>, because firms choose how many to hire.",
              ...laborSolSteps(l), `Employment falls from ${f(l.Q0)} to ${f(l.Qd)} thousand: <b>${f(ans)} thousand</b> fewer workers.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Rent ceilings: consequences and fairness
   * ============================================================ */
  const CEIL_BANK = [
    { t: "The quantity of apartments demanded exceeds the quantity supplied.", ok: true, why: "The low legal rent raises quantity demanded and lowers quantity supplied." },
    { t: "Fewer apartments are rented than in the unregulated market.", ok: true, why: "Only the quantity supplied at the ceiling is rented, and that is less than the equilibrium quantity." },
    { t: "Renters spend more time and effort searching for a vacancy.", ok: true, why: "A shortage makes search activity more intense and more costly." },
    { t: "Some landlords and tenants strike illegal deals at rents above the ceiling.", ok: true, why: "A shortage breeds a black market." },
    { t: "A deadweight loss arises because fewer apartments are rented than the efficient quantity.", ok: true, why: "Apartments worth more to renters than they cost to supply are never offered." },
    { t: "Apartments end up allocated by waiting lists, lotteries or landlords' preferences.", ok: true, why: "When price cannot ration, queues, lotteries and discrimination do." },
    { t: "For someone who finds an apartment, the full cost of housing includes the value of the time spent searching.", ok: true, why: "The opportunity cost of housing is the rent plus the opportunity cost of search." },
    { t: "Landlords have less incentive to maintain and upgrade their buildings.", ok: true, why: "Rent can no longer rise to reward upkeep, and there is a line of tenants anyway." },
    { t: "Long-time tenants in controlled apartments tend to gain, while newcomers tend to lose.", ok: true, why: "That is what comparisons of cities with and without rent ceilings find." },
    { t: "Landlords offer more apartments because more renters can now afford them.", ok: false, why: "Quantity supplied depends on the rent landlords receive. A lower rent means fewer apartments offered." },
    { t: "The shortage disappears once renters search hard enough.", ok: false, why: "Search shifts who gets the apartments, not how many exist. The shortage persists as long as the ceiling binds." },
    { t: "Many apartments sit vacant because of a surplus.", ok: false, why: "A binding ceiling causes a shortage. Surpluses come from binding floors." },
    { t: "Every renter in the city ends up paying less for housing.", ok: false, why: "Newcomers face search costs and black-market rents, which can push their full cost above the free-market rent." },
    { t: "Total surplus rises because renters pay less.", ok: false, why: "Lower rent transfers surplus from landlords to some renters, and the lost apartments are a deadweight loss. Total surplus falls." },
    { t: "Landlords build new apartment buildings to meet the extra demand.", ok: false, why: "A lower allowed rent weakens the incentive to build." },
    { t: "The controlled apartments go mainly to the poorest households.", ok: false, why: "Allocation by luck, waiting and landlord preference does not target the poor. That is the fair-results objection." },
  ];
  const FAIR_BANK = [
    { t: "A tenant who would happily pay $200 more to get an apartment is legally forbidden to offer it.", cat: "Fair-rules objection", why: "The complaint is that a voluntary exchange is blocked." },
    { t: "The law stops a willing landlord and a willing tenant from agreeing on a rent they both prefer.", cat: "Fair-rules objection", why: "Blocking voluntary agreements is the fair-rules objection." },
    { t: "Owners should be free to set the terms on which they rent out their own property.", cat: "Fair-rules objection", why: "This is about the process (property rights and voluntary exchange), not who ends up better off." },
    { t: "It is wrong for the government to prohibit a trade that makes both parties better off.", cat: "Fair-rules objection", why: "Prohibiting mutually beneficial exchange is the fair-rules objection." },
    { t: "Many controlled apartments are occupied by well-off tenants who have lived there for years.", cat: "Fair-results objection", why: "The complaint is about who benefits: not the poor." },
    { t: "Low-income families who are new to the city often cannot find a controlled apartment at all.", cat: "Fair-results objection", why: "This is about the outcome: the policy fails to help the poor." },
    { t: "The ceiling does little to reduce poverty, because its benefits do not go mainly to poor households.", cat: "Fair-results objection", why: "Judging a policy by its outcome for the poor is the fair-results view." },
    { t: "Landlords can pick tenants they like, so some needy groups are shut out entirely.", cat: "Fair-results objection", why: "The concern is who ends up housed, an outcome." },
  ];
  const WIN_BANK = [
    { t: "A tenant who has lived in the same rent-controlled apartment for 15 years", cat: "Tends to gain", why: "Long-standing residents keep a cheap apartment." },
    { t: "A retiree who signed a controlled lease decades ago", cat: "Tends to gain", why: "Long-standing residents are the main winners." },
    { t: "A family that wins a housing lottery for a controlled unit", cat: "Tends to gain", why: "The lucky few who get a controlled unit pay less." },
    { t: "A nurse who has just moved to the city for a new job", cat: "Tends to lose", why: "Mobile newcomers face the shortage, search costs and black-market rents." },
    { t: "A graduate student arriving in the fall to look for a first apartment", cat: "Tends to lose", why: "Newcomers must search in a market with a shortage." },
    { t: "The owner of an apartment building whose rents are capped", cat: "Tends to lose", why: "Landlords lose producer surplus." },
    { t: "A young couple who must pay an illegal fee to a landlord to get a lease", cat: "Tends to lose", why: "Black-market payments raise the real rent above the ceiling." },
    { t: "A family that has spent a year on a waiting list", cat: "Tends to lose", why: "Queues are costly, and the family is still unhoused." },
  ];
  const ALLOC_REAL = [
    { t: "A lottery among applicants", why: "Lotteries are one way scarce housing is allocated." },
    { t: "A first-come, first-served waiting list", why: "Queues allocate housing when price cannot." },
    { t: "Landlords choosing tenants they personally favor", why: "Discrimination is one way scarce housing is allocated." },
    { t: "Illegal side payments to landlords", why: "Black-market payments allocate some apartments." },
  ];
  const FUNC_BANK = [
    { t: "Encouraging construction of new apartments when housing is scarce", ok: true, why: "High rents reward building, so supply expands where it is needed most." },
    { t: "Rewarding landlords for maintaining and improving their buildings", ok: true, why: "Rent that can rise for better units pays for upkeep." },
    { t: "Rationing existing apartments to the renters who value them most", ok: true, why: "Price allocates the apartments that exist." },
    { t: "Guaranteeing that every family can afford an apartment", ok: false, why: "Market rents ration housing; they do not guarantee affordability." },
    { t: "Setting the cost of building materials", ok: false, why: "Construction costs are determined in other markets." },
    { t: "Eliminating the need to choose between housing and other goods", ok: false, why: "Scarcity means choices remain; prices just organize them." },
  ];

  function rentGraph() {
    return draw(() => {
      const P0 = U.randInt(10, 18) * 100, Q0 = U.pick([30, 40, 50, 60]);
      const dQs = U.pick([10, 15, 20]), gap = U.pick([200, 300, 400]), h = U.pick([200, 300, 400, 500]);
      const up = gap * dQs / h;
      if (!Number.isInteger(up)) return null;
      const Qs = Q0 - dQs, Qd = Q0 + up, Pc = P0 - gap, P2 = P0 + h;
      if (Qs < 10) return null;
      const xMax = Math.ceil(Qd * 1.4 / 10) * 10, yMax = Math.ceil(P2 * 1.3 / 100) * 100;
      if (up < 0.09 * xMax || dQs < 0.09 * xMax) return null;
      return { P0, Q0, Qs, Qd, Pc, P2, xMax, yMax, dQs, up, gap, h, city: U.pick(CITIES) };
    });
  }

  const genRent = STUDY.makeGenerator({
    id: "b251-m6-rentceiling",
    name: "Rent ceilings: consequences and fairness",
    blurb: "Trace what a binding rent ceiling does: search activity, black markets, deadweight loss, non-price rationing, winners and losers, and the fairness debate.",
    variants: [
      {
        name: "Select all consequences of a binding rent ceiling",
        make() {
          return selectAll("m6-ceil", CEIL_BANK, 5, `${U.pick(CITIES)} sets a rent ceiling well below the equilibrium rent. Select <b>all</b> statements that describe likely consequences.`,
            S("Start from the shortage: low legal rent → more demanded, fewer supplied. Everything else follows from that.",
              "The shortage brings search activity, black markets, non-price rationing and a deadweight loss. It does <em>not</em> bring more apartments or lower costs for everyone."));
        },
      },
      {
        name: "Which is NOT a consequence?",
        make() {
          return whichNot(CEIL_BANK, "A city imposes a binding rent ceiling. Which of the following is <b>not</b> a likely consequence?",
            "This does not happen.",
            S("List what a shortage causes: fewer apartments rented, search, black markets, queues and lotteries, less upkeep, a deadweight loss.",
              "Then look for the option that contradicts the shortage or claims everyone gains."));
        },
      },
      {
        name: "Fair rules or fair results?",
        make() {
          const items = U.sample(FAIR_BANK.filter(i => i.cat === "Fair-rules objection"), 2)
            .concat(U.sample(FAIR_BANK.filter(i => i.cat === "Fair-results objection"), 2));
          for (const x of U.deal("m6-fair", FAIR_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Critics call rent ceilings unfair for two different reasons. Classify each complaint.",
            cats: ["Fair-rules objection", "Fair-results objection"], items,
            sol: S("The <b>fair-rules</b> view judges the <em>process</em>: is voluntary exchange allowed? The <b>fair-results</b> view judges the <em>outcome</em>: does the policy help the poor?",
              "Complaints about blocked deals or property rights → fair rules. Complaints about who ends up with the apartments → fair results."),
          });
        },
      },
      {
        name: "Full cost of housing with search",
        make() {
          const n = U.pick(NAMES);
          const rent = U.randInt(8, 16) * 100 - U.pick([0, 50]);
          const h = U.pick([48, 60, 72, 84, 96]), w = U.pick([15, 20, 25, 30]);
          const monthly = h * w / 12, ans = rent + monthly;
          const P0 = rent + Math.max(10, Math.floor(monthly * 0.6 / 10) * 10);
          return Q.num({
            q: `${n} rents an apartment in a rent-controlled city at the ceiling rent of ${$(rent)} a month, but only after ${h} hours spent searching (calling landlords, touring buildings, waiting in line). ${n} could have earned ${$(w)} an hour at work instead. Spreading the search cost evenly over a 12-month lease, what is ${n}'s full opportunity cost of housing per month? (Without the ceiling, the rent would be about ${$(P0)}.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: rent, why: "That counts only the rent. The time spent searching is part of the opportunity cost of housing." },
              { value: rent + h * w, why: "That charges the whole search cost to one month. Spread it over the 12-month lease." },
              { value: P0, why: "That is the unregulated rent, not the full cost under the ceiling." },
              { value: monthly, why: "That is only the search cost per month. Add the rent." },
            ]),
            sol: S("Under a rent ceiling, the opportunity cost of housing = the regulated rent + the opportunity cost of search activity.",
              `Search cost = ${h} hours × ${$(w)} = ${$(h * w)}; per month of a 12-month lease: ${$(h * w)} ÷ 12 = ${$(monthly)}.`,
              `Full cost = ${$(rent)} + ${$(monthly)} = <b>${$(ans)}</b> a month, which is more than the ${$(P0)} rent an unregulated market would charge.`),
          });
        },
      },
      {
        name: "Winners and losers",
        make() {
          const items = U.sample(WIN_BANK.filter(i => i.cat === "Tends to gain"), 2)
            .concat(U.sample(WIN_BANK.filter(i => i.cat === "Tends to lose"), 2));
          for (const x of U.deal("m6-win", WIN_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: `${U.pick(CITIES)} has had a binding rent ceiling for many years. Classify each person by whether they tend to gain or lose from it.`,
            cats: ["Tends to gain", "Tends to lose"], items,
            sol: S("A ceiling lowers rent for the lucky few who hold a controlled apartment and raises the real cost of housing for everyone else.",
              "Winners: long-standing residents and lottery winners. Losers: newcomers searching in a market with a shortage, people paying black-market fees, and landlords."),
          });
        },
      },
      {
        name: "Read a rent-ceiling graph",
        make() {
          const r = rentGraph();
          const fD = P => r.Q0 - (P - r.P0) * r.dQs / r.h, fS = P => r.Q0 + (P - r.P0) * r.dQs / r.gap;
          const svg = mktPlot({ xLabel: "Apartments (thousands)", yLabel: "Rent ($ per month)", xMax: r.xMax, yMax: r.yMax,
            xTicks: [r.Qs, r.Q0, r.Qd], yTicks: [r.Pc, r.P0, r.P2],
            lines: [{ fQ: fD, style: "main", label: "D" }, { fQ: fS, style: "alt", label: "S" }, { pts: [[0, r.Pc], [Math.min(r.xMax * 0.82, r.Qd * 1.08), r.Pc]], style: "dash", label: "Ceiling", labelAt: 0 }],
            guides: [[r.Q0, r.P0], [r.Qs, r.P2], [r.Qd, r.Pc]],
            points: [{ x: r.Q0, y: r.P0, label: "E" }], aria: "rent ceiling graph" });
          const which = U.pick(["short", "rented", "black"]);
          let qq, ans, unit, tr, last;
          if (which === "short") {
            qq = "How large is the shortage, in thousands of apartments?"; ans = r.Qd - r.Qs; unit = "thousand apartments";
            tr = [{ value: r.Qd, why: "That is the quantity demanded at the ceiling. Subtract the quantity supplied." }, { value: r.Q0 - r.Qs, why: "That is only the fall in quantity supplied. Measure from Q<sub>S</sub> to Q<sub>D</sub> at the ceiling." }, { value: r.Qd - r.Q0, why: "That is only the rise in quantity demanded." }];
            last = `At the ceiling of ${$(r.Pc)}, read across: quantity supplied ${r.Qs} thousand, quantity demanded ${r.Qd} thousand. Shortage = ${r.Qd} − ${r.Qs} = <b>${ans} thousand</b>.`;
          } else if (which === "rented") {
            qq = "How many apartments (in thousands) are actually rented?"; ans = r.Qs; unit = "thousand apartments";
            tr = [{ value: r.Qd, why: "That many are demanded, but landlords only offer the quantity supplied." }, { value: r.Q0, why: "That is the free-market quantity." }, { value: r.Qd - r.Qs, why: "That is the shortage." }];
            last = `At ${$(r.Pc)}, the supply curve gives <b>${r.Qs} thousand</b> apartments, the short side of the market, so that is how many are rented.`;
          } else {
            qq = "What is the most that renters would pay per month for the last apartment that is offered (the black-market rent)?"; ans = r.P2; unit = "$";
            tr = [{ value: r.Pc, why: "That is the legal ceiling." }, { value: r.P0, why: "That is the free-market rent. Fewer apartments are available now, so the last one is worth more to renters." }];
            last = `Quantity supplied at the ceiling is ${r.Qs} thousand. Going up from ${r.Qs} to the demand curve reaches <b>${$(r.P2)}</b>.`;
          }
          return Q.num({
            q: `The graph shows the apartment market in ${r.city} with a rent ceiling. Axis values mark the key points.${svg}${qq}`,
            answer: ans, unit, traps: traps(ans, tr),
            sol: S(`The ceiling (${$(r.Pc)}) is below the equilibrium rent (${$(r.P0)}), so it binds. Read the curves at the ceiling.`, last),
          });
        },
      },
      {
        name: "Which is NOT a way housing gets allocated?",
        make() {
          const right = U.pick([
            "Landlords openly raising the legal rent until the shortage disappears",
            "The market rent rising to clear the market",
            "Building new apartments until every renter is housed at the ceiling rent",
          ]);
          return Q.mc({
            q: "A binding rent ceiling stops price from rationing apartments. Which of these is <b>not</b> a way the scarce apartments end up being allocated?",
            right, wrong: U.sample(ALLOC_REAL, 3),
            rightWhy: "Price rationing is exactly what the ceiling forbids, and a lower legal rent discourages new building.",
            sol: S("When price is not allowed to clear the market, something else has to decide who gets the apartments.",
              "Under a binding rent ceiling that means lotteries, queues, discrimination, and illegal side payments, not legal rent increases or a building boom."),
          });
        },
      },
      {
        name: "What jobs do market rents do?",
        make() {
          return selectAll("m6-func", FUNC_BANK, 5, "Rent ceilings stop rents from doing their usual jobs. In an unregulated housing market, which of these do rents do? Select <b>all</b> that apply.",
            S("Prices in a free market ration what exists and signal what to produce.",
              "For housing that means steering apartments to those who value them most and rewarding construction and maintenance."));
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Minimum wage and price floors
   * ============================================================ */
  const MW_BANK = [
    { t: "Firms hire fewer workers: the quantity of labor demanded falls.", ok: true, why: "A higher wage makes labor more expensive for firms." },
    { t: "More people want jobs: the quantity of labor supplied rises.", ok: true, why: "A higher wage draws more people into the labor market." },
    { t: "Unemployment equals the quantity of labor supplied minus the quantity demanded at the minimum wage.", ok: true, why: "That gap is the surplus of labor." },
    { t: "A deadweight loss arises because employment is below the efficient quantity.", ok: true, why: "Some jobs that are worth more to firms than to workers no longer happen." },
    { t: "Workers who keep their jobs earn more per hour.", ok: true, why: "They are paid the higher minimum wage." },
    { t: "Unemployed workers spend time and effort on job search.", ok: true, why: "A surplus of labor increases search activity." },
    { t: "Firms' surplus (the buyers' surplus in this market) falls.", ok: true, why: "Firms pay more and hire fewer workers." },
    { t: "Employment rises because more people are willing to work.", ok: false, why: "Employment is set by how many workers firms hire, and that falls." },
    { t: "There is a shortage of workers.", ok: false, why: "A binding floor creates a surplus of labor, not a shortage." },
    { t: "Every low-wage worker is better off.", ok: false, why: "Workers who lose their jobs, or cannot find one, are worse off." },
    { t: "Firms hire more workers to make up for higher labor costs.", ok: false, why: "A higher price of labor reduces the quantity demanded." },
    { t: "The deadweight loss equals the extra wages firms pay to the workers they keep.", ok: false, why: "That is a transfer from firms to workers. The deadweight loss is the surplus lost on jobs that disappear." },
    { t: "The quantity of labor supplied falls because jobs are harder to find.", ok: false, why: "The higher wage raises the quantity supplied, even though fewer of those people get jobs." },
  ];
  const ROLE_BANK = [
    { t: "The demand curve for labor", cat: "Firms", why: "Firms buy labor, so they are the demand side." },
    { t: "The supply curve of labor", cat: "Workers", why: "Workers sell their labor, so they are the supply side." },
    { t: "The surplus that plays the role of consumer surplus", cat: "Firms", why: "Firms are the buyers here, so their surplus is the buyers' surplus." },
    { t: "The surplus that plays the role of producer surplus", cat: "Workers", why: "Workers are the sellers here, so theirs is the sellers' surplus." },
    { t: "The side whose quantity falls at a binding minimum wage", cat: "Firms", why: "Firms demand less labor at the higher wage." },
    { t: "The side whose quantity rises at a binding minimum wage", cat: "Workers", why: "More workers offer their labor at the higher wage." },
    { t: "The side that decides how many people are actually employed at a binding minimum wage", cat: "Firms", why: "Employment equals the quantity demanded by firms." },
    { t: "The people counted as unemployed when the minimum wage binds", cat: "Workers", why: "Unemployment is workers who want jobs at that wage but cannot find one." },
  ];
  const FLOOR_GOODS = [{ g: "milk", u: "gallon", lo: 3, hi: 5 }, { g: "wheat", u: "bushel", lo: 6, hi: 9 }, { g: "sugar", u: "pound", lo: 1, hi: 2 }, { g: "butter", u: "pound", lo: 4, hi: 6 }];

  function laborGraph() {
    return draw(() => {
      const W0 = U.randInt(10, 16), g = U.randInt(2, 5), Q0 = U.pick([40, 50, 60, 70, 80]);
      const dQd = U.pick([5, 10, 15, 20]), dQs = U.pick([5, 10, 15, 20]);
      if (dQd > Q0 / 2) return null;
      const xMax = Math.ceil((Q0 + dQs) * 1.35 / 10) * 10, yMax = Math.ceil((W0 + g) * 1.5);
      if (dQd < 0.09 * xMax || dQs < 0.09 * xMax || g < 0.06 * yMax) return null;
      return { W0, g, Wm: W0 + g, Q0, dQd, dQs, Qd: Q0 - dQd, Qs: Q0 + dQs, xMax, yMax, city: U.pick(CITIES), who: U.pick(LABOR_WHO) };
    });
  }

  const genMinWage = STUDY.makeGenerator({
    id: "b251-m6-minwage",
    name: "Minimum wage and price floors",
    blurb: "Work out what a minimum wage does to employment, unemployment and surplus, read a labor-market graph, and apply the living-wage rule.",
    variants: [
      {
        name: "Select all effects of a binding minimum wage",
        make() {
          return selectAll("m6-mw", MW_BANK, 5, `${U.pick(CITIES)} raises its minimum wage well above the equilibrium wage for ${U.pick(LABOR_WHO)}. Select <b>all</b> statements that are likely true.`,
            S("A minimum wage is a price floor on labor. Above equilibrium it raises the quantity supplied and lowers the quantity demanded.",
              "Employment = quantity demanded (falls). Unemployment = the gap. Lost jobs = deadweight loss; the higher pay of those still employed is a transfer."));
        },
      },
      {
        name: "Which is NOT an effect?",
        make() {
          return whichNot(MW_BANK, "A minimum wage is set above the equilibrium wage. Which of the following is <b>not</b> a likely effect?",
            "This does not happen.",
            S("A binding floor on wages creates a surplus of labor: fewer jobs, more job-seekers.",
              "Look for the option that has employment rising, a shortage, or everyone gaining."));
        },
      },
      {
        name: "Predict: the minimum wage is raised",
        make() {
          const city = U.pick(CITIES), who = U.pick(LABOR_WHO);
          const c = U.pick(["both", "cross", "below"]);
          const W0 = U.randInt(12, 17);
          let a, b2;
          if (c === "both") { a = W0 + U.randInt(1, 2); b2 = a + U.randInt(1, 3); }
          else if (c === "cross") { a = W0 - U.randInt(1, 2); b2 = W0 + U.randInt(1, 3); }
          else { b2 = W0 - U.randInt(1, 2); a = b2 - U.randInt(1, 2); }
          const right = c === "below" ? "Unemployment does not change" : "Unemployment increases";
          const why = {
            "Unemployment increases": c === "below" ? `Both minimum wages are below the equilibrium wage of ${$(W0)}, so neither binds.` : "",
            "Unemployment decreases": "A higher binding wage cuts the quantity demanded and raises the quantity supplied, widening the gap.",
            "Unemployment does not change": c === "below" ? "" : `The new minimum of ${$(b2)} is above the equilibrium wage of ${$(W0)}, so it binds${c === "cross" ? " (the old one did not)" : " even more than before"}.`,
          };
          const all = ["Unemployment increases", "Unemployment decreases", "Unemployment does not change"];
          return Q.mc({
            q: `The equilibrium wage for ${who} in ${city} is ${$(W0)} an hour. The minimum wage is raised from ${$(a)} to ${$(b2)}. What happens to unemployment among ${who}?`,
            right, wrong: all.filter(x => x !== right).map(t => ({ t, why: why[t] })), keepOrder: all,
            rightWhy: c === "below" ? "A minimum wage below the equilibrium wage has no effect." : c === "cross" ? "The old minimum did not bind; the new one does, creating unemployment where there was none." : "A higher binding minimum widens the gap between quantity supplied and quantity demanded.",
            sol: S("Compare each minimum wage with the equilibrium wage: only a minimum <em>above</em> equilibrium binds.",
              `Old: ${$(a)} is ${a > W0 ? "above" : "below"} ${$(W0)}. New: ${$(b2)} is ${b2 > W0 ? "above" : "below"} ${$(W0)}.`,
              c === "below" ? "Neither binds, so nothing changes." : "The higher binding wage means fewer jobs and more job-seekers, so unemployment rises."),
          });
        },
      },
      {
        name: "Firms or workers?",
        make() {
          const items = U.sample(ROLE_BANK.filter(i => i.cat === "Firms"), 2).concat(U.sample(ROLE_BANK.filter(i => i.cat === "Workers"), 2));
          for (const x of U.deal("m6-role", ROLE_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "In the labor market, match each item to firms or to workers.",
            cats: ["Firms", "Workers"], items,
            sol: S("In the labor market, <b>firms buy</b> labor and <b>workers sell</b> it, the reverse of a goods market.",
              "So firms are the demand side (their surplus is like consumer surplus) and workers the supply side (their surplus is like producer surplus). At a binding minimum wage, firms' quantity demanded sets employment."),
          });
        },
      },
      {
        name: "Living wage calculation",
        make() {
          const W = U.randInt(14, 26), R = 48 * W, city = U.pick(CITIES);
          const back = Math.random() < 0.5;
          const rule = "A living wage is an hourly wage that lets someone working 40 hours a week rent adequate housing for no more than 30% of their earnings. Treat a month as 4 weeks.";
          if (!back) {
            return Q.num({
              q: `${rule} In ${city}, an adequate one-bedroom apartment rents for ${$(R)} a month. What is the living wage per hour?`,
              answer: W, unit: "$",
              traps: traps(W, [
                { value: U.round(R / 160, 2), why: "That wage would spend 100% of earnings on rent. Rent may be only 30% of earnings, so divide by 0.30 as well." },
                { value: U.round(R * 0.3 / 160, 2), why: "That multiplies by 30% instead of dividing. Earnings must be big enough that rent is only 30% of them." },
                { value: U.round(R / (0.3 * 40), 2), why: "That treats the monthly rent as a weekly cost. A month has 4 × 40 = 160 hours of work." },
              ]),
              sol: S("Rent must be at most 30% of monthly earnings, so monthly earnings must be at least rent ÷ 0.30.",
                `Earnings needed = ${$(R)} ÷ 0.30 = ${$(R / 0.3)} a month. Hours per month = 40 × 4 = 160.`,
                `Living wage = ${$(R / 0.3)} ÷ 160 = <b>${$(W)}</b> an hour.`),
            });
          }
          return Q.num({
            q: `${rule} A worker in ${city} earns ${$(W)} an hour for a 40-hour week. Under this definition, what is the most rent per month that counts as affordable housing for this worker?`,
            answer: R, unit: "$",
            traps: traps(R, [
              { value: W * 160, why: "That is total monthly earnings. Only 30% of it may go to rent." },
              { value: U.round(W * 40 * 0.3, 2), why: "That is 30% of one week's pay. Use a 4-week month." },
              { value: U.round(W * 160 * 0.7, 2), why: "That is the 70% left after rent, not the rent itself." },
            ]),
            sol: S("Affordable rent = 30% of monthly earnings.",
              `Monthly earnings = ${$(W)} × 40 hours × 4 weeks = ${$(W * 160)}.`,
              `30% of ${$(W * 160)} = <b>${$(R)}</b> a month.`),
          });
        },
      },
      {
        name: "Read a minimum-wage graph",
        make() {
          const l = laborGraph();
          const fD = W => l.Q0 - (W - l.W0) * l.dQd / l.g, fS = W => l.Q0 + (W - l.W0) * l.dQs / l.g;
          const svg = mktPlot({ xLabel: "Workers (thousands)", yLabel: "Wage ($ per hour)", xMax: l.xMax, yMax: l.yMax,
            xTicks: [l.Qd, l.Q0, l.Qs], yTicks: [l.W0, l.Wm],
            lines: [{ fQ: fD, style: "main", label: "D" }, { fQ: fS, style: "alt", label: "S" }, { pts: [[0, l.Wm], [Math.min(l.xMax * 0.84, l.Qs * 1.06), l.Wm]], style: "dash", label: "Minimum wage", labelAt: 0 }],
            guides: [[l.Q0, l.W0], [l.Qd, l.Wm], [l.Qs, l.Wm]], points: [{ x: l.Q0, y: l.W0, label: "E" }], aria: "minimum wage graph" });
          const which = U.pick(["unemp", "employ", "lost"]);
          let qq, ans, tr, last;
          if (which === "unemp") {
            qq = "How much unemployment does the minimum wage create, in thousands of workers?"; ans = l.Qs - l.Qd;
            tr = [{ value: l.dQd, why: "That is only the jobs lost. Unemployment also includes the extra people now looking for work." }, { value: l.dQs, why: "That is only the rise in quantity supplied." }, { value: l.Qs, why: "That is the quantity supplied, not the gap." }];
            last = `At ${$(l.Wm)}: quantity supplied ${l.Qs} thousand, quantity demanded ${l.Qd} thousand. Unemployment = ${l.Qs} − ${l.Qd} = <b>${ans} thousand</b>.`;
          } else if (which === "employ") {
            qq = "How many workers (in thousands) are employed at the minimum wage?"; ans = l.Qd;
            tr = [{ value: l.Qs, why: "That many want to work, but firms hire only the quantity demanded." }, { value: l.Q0, why: "That is employment without the minimum wage." }, { value: l.Qs - l.Qd, why: "That is unemployment." }];
            last = `Firms decide how many to hire: at ${$(l.Wm)} the demand curve gives <b>${l.Qd} thousand</b>.`;
          } else {
            qq = "Compared with the free-market equilibrium, how many fewer workers (in thousands) have jobs?"; ans = l.dQd;
            tr = [{ value: l.Qs - l.Qd, why: "That is total unemployment, which includes people who were not working before." }, { value: l.dQs, why: "That is the rise in the quantity of labor supplied." }, { value: l.Qd, why: "That is the employment level, not the change." }];
            last = `Employment falls from ${l.Q0} thousand to ${l.Qd} thousand: <b>${ans} thousand</b> fewer jobs.`;
          }
          return Q.num({
            q: `The graph shows the market for ${l.who} in ${l.city} with a minimum wage. Axis values mark the key points.${svg}${qq}`,
            answer: ans, unit: "thousand workers", traps: traps(ans, tr),
            sol: S(`The minimum wage (${$(l.Wm)}) is above the equilibrium wage (${$(l.W0)}), so it binds. Read both curves at ${$(l.Wm)}.`, last),
          });
        },
      },
      {
        name: "Price floor in a product market (select all)",
        make() {
          const g = U.pick(FLOOR_GOODS);
          const P0 = U.randInt(g.lo * 10, g.hi * 10) / 10, F = U.round(P0 + U.randInt(3, 8) / 10, 2);
          const bank = [
            { t: `Farmers produce more ${g.g} than consumers want to buy: a surplus`, ok: true, why: "At a price above equilibrium, quantity supplied exceeds quantity demanded." },
            { t: `Consumers buy less ${g.g} than before`, ok: true, why: "A higher price reduces the quantity demanded." },
            { t: "A deadweight loss arises", ok: true, why: "Fewer units are bought than the efficient quantity." },
            { t: `Consumers pay more per ${g.u}`, ok: true, why: "The floor holds the price above equilibrium." },
            { t: `There is a shortage of ${g.g}`, ok: false, why: "Shortages come from binding ceilings. A binding floor causes a surplus." },
            { t: `Consumers buy more ${g.g} because more is produced`, ok: false, why: "Purchases are set by quantity demanded, which falls at the higher price." },
            { t: "The floor has no effect, because price floors only matter in labor markets", ok: false, why: "A floor above equilibrium binds in any market." },
            { t: "The quantity bought and sold rises to the quantity supplied", ok: false, why: "Under a binding floor the quantity traded is the quantity demanded, the short side." },
          ];
          const opts = U.sample(bank.filter(o => o.ok), U.randInt(1, 3)).concat(U.sample(bank.filter(o => !o.ok), 2));
          return Q.multi({
            q: `The equilibrium price of ${g.g} is ${$(P0, 2)} per ${g.u}. To support farmers, the government sets a price floor of ${$(F, 2)} per ${g.u}. Select <b>all</b> statements that are true.`,
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: S(`The floor (${$(F, 2)}) is above equilibrium (${$(P0, 2)}), so it binds: the price is held up.`,
              "Higher price → more supplied, less demanded → surplus. Quantity traded falls to the quantity demanded, creating a deadweight loss."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Taxes: incidence, revenue, deadweight loss
   * ============================================================ */
  function taxSteps(m, onBuyers) {
    const Ps = m.P0 - m.ts, Pb = m.P0 + m.tb, Qt = m.Q0 - m.dQ;
    return [
      `A tax opens a wedge: ${PB} = ${PS} + ${$(m.t)}. It does not matter that the law collects it from ${onBuyers ? "buyers" : "sellers"}; quantity demanded at ${PB} must equal quantity supplied at ${PS}.`,
      eqStep(m),
      `With the tax: ${f(m.A)} − ${coef(m.b)}(${PS} + ${m.t}) = ${sExpr(m.C0, m.d, PS)}, so ${f(m.b + m.d)}${PS} = ${f(m.A - m.C0 - m.b * m.t)} and ${PS} = ${$(Ps)}. Then ${PB} = ${$(Ps)} + ${$(m.t)} = ${$(Pb)}, and the quantity is ${f(Qt)}.`,
    ];
  }
  const taxQ = (m, onBuyers) => `In ${m.city}, ${goodsEqs(m)}. The government imposes a tax of ${$(m.t)} per ${m.g.s}, collected from ${onBuyers ? "buyers" : "sellers"}.`;

  const genTax = STUDY.makeGenerator({
    id: "b251-m6-tax",
    name: "Taxes: incidence, revenue and deadweight loss",
    blurb: "Find the price buyers pay, the price sellers receive, each side's share of the tax, tax revenue and the deadweight loss from equations, schedules and graphs.",
    variants: [
      {
        name: "Price buyers pay",
        make() {
          const m = goodsMkt(), onB = Math.random() < 0.5;
          const Pb = m.P0 + m.tb;
          return Q.num({
            q: `${taxQ(m, onB)} What price do buyers now pay per ${m.g.s}, including the tax?`,
            answer: Pb, unit: "$",
            traps: traps(Pb, [
              { value: m.P0 + m.t, why: "That assumes buyers bear the whole tax. Sellers take a lower price too, so the buyers' price rises by less than the tax." },
              { value: m.P0 - m.ts, why: "That is the price sellers keep after the tax." },
              { value: m.P0, why: "That is the price before the tax." },
              { value: m.P0 + m.ts, why: "That swaps the two shares. Recompute with the wedge on the right side." },
            ]),
            sol: S(...taxSteps(m, onB), `Buyers pay <b>${$(Pb)}</b>, ${$(m.tb)} more than before.`),
          });
        },
      },
      {
        name: "Price sellers receive",
        make() {
          const m = goodsMkt(), onB = Math.random() < 0.5;
          const Ps = m.P0 - m.ts;
          return Q.num({
            q: `${taxQ(m, onB)} What price do sellers keep per ${m.g.s} after the tax?`,
            answer: Ps, unit: "$",
            traps: traps(Ps, [
              { value: m.P0 - m.t, why: "That assumes sellers bear the whole tax. Buyers pay part of it through a higher price." },
              { value: m.P0 + m.tb, why: "That is the price buyers pay, including the tax." },
              { value: m.P0, why: "That is the price before the tax." },
              { value: m.P0 - m.tb, why: "That swaps the two shares." },
            ]),
            sol: S(...taxSteps(m, onB), `Sellers keep <b>${$(Ps)}</b>, ${$(m.ts)} less than before.`),
          });
        },
      },
      {
        name: "Buyers' share of the tax (%)",
        make() {
          const m = goodsMkt(), onB = Math.random() < 0.5;
          const ans = 100 * m.tb / m.t;
          return Q.num({
            q: `${taxQ(m, onB)} What percentage of the tax is borne by buyers?`,
            answer: ans, unit: "%",
            traps: traps(ans, [
              { value: 100 * m.ts / m.t, why: "That is the sellers' share. Buyers' share = rise in the buyers' price ÷ tax." },
              { value: onB ? 100 : 0, why: onB ? "The law collects it from buyers, but the market price sellers receive falls, so sellers bear part of it." : "The law collects it from sellers, but they pass part of it on as a higher price." },
              { value: 50, why: "The split is not automatically even; it depends on the slopes of demand and supply." },
            ]),
            sol: S(...taxSteps(m, onB), `Buyers' price rose by ${$(m.tb)} of the ${$(m.t)} tax: ${m.tb} ÷ ${m.t} = <b>${pctS(ans)}</b>. Sellers bear the other ${pctS(100 - ans)}.`),
          });
        },
      },
      {
        name: "Tax revenue",
        make() {
          const m = goodsMkt(), onB = Math.random() < 0.5;
          const Qt = m.Q0 - m.dQ, ans = m.t * Qt;
          return Q.num({
            q: `${taxQ(m, onB)} How much tax revenue does the government collect per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.Q0, why: "That uses the quantity before the tax. The tax reduces the quantity sold, and revenue is collected only on units still sold." },
              { value: (m.P0 + m.tb) * Qt, why: "That is total spending by buyers, not the tax collected." },
              { value: m.tb * Qt, why: "That is only the part of revenue that comes out of buyers' pockets." },
              { value: m.t * m.dQ / 2, why: "That is the deadweight loss, not revenue." },
            ]),
            sol: S(...taxSteps(m, onB), `Revenue = tax × quantity after the tax = ${$(m.t)} × ${f(Qt)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Deadweight loss of the tax",
        make() {
          const m = goodsMkt(), onB = Math.random() < 0.5;
          const Qt = m.Q0 - m.dQ, ans = m.t * m.dQ / 2;
          return Q.num({
            q: `${taxQ(m, onB)} What is the deadweight loss of the tax per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.dQ, why: "The deadweight loss is a triangle: multiply by ½." },
              { value: m.t * Qt, why: "That is the tax revenue, which is a transfer to the government, not a loss." },
              { value: m.t * Qt / 2, why: "Use the <em>fall</em> in quantity as the base of the triangle, not the new quantity." },
            ]),
            sol: S(...taxSteps(m, onB), `The quantity falls by ${f(m.Q0)} − ${f(Qt)} = ${f(m.dQ)}. DWL = ½ × ${$(m.t)} × ${f(m.dQ)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Quantity after a tax, from a schedule",
        make() {
          const m = draw(() => { const x = goodsMkt(6); return x.Q0 - x.d * (x.ts + 1) > 0 ? x : null; });
          const rows = [];
          for (let P = m.P0 - m.ts - 1; P <= m.P0 + m.tb + 1; P++) rows.push([$(P), f(m.Q0 - m.b * (P - m.P0)), f(m.Q0 + m.d * (P - m.P0))]);
          const Qt = m.Q0 - m.dQ, onB = Math.random() < 0.5;
          return Q.num({
            q: `The market for ${m.g.p} in ${m.city} (quantities per ${m.g.per}):${tbl(["Price", "Quantity demanded", "Quantity supplied"], rows)}The government imposes a tax of ${$(m.t)} per ${m.g.s}, collected from ${onB ? "buyers" : "sellers"}. How many ${m.g.p} are bought and sold after the tax?`,
            answer: Qt, unit: m.g.p, kind: "count",
            traps: traps(Qt, [
              { value: m.Q0, why: "That is the quantity before the tax." },
              { value: m.Q0 - m.b * m.t, why: "That assumes buyers' price rises by the whole tax. At that price sellers would get the old price, and they would supply more than buyers want." },
              { value: m.Q0 - m.d * m.t, why: "That assumes sellers' price falls by the whole tax. At that price buyers would pay the old price and want more than sellers supply." },
            ]),
            sol: S(`With a tax, buyers pay ${$(m.t)} more than sellers receive. Look for two prices ${$(m.t)} apart where quantity demanded at the higher price equals quantity supplied at the lower one.`,
              `At ${PB} = ${$(m.P0 + m.tb)}, quantity demanded is ${f(Qt)}; at ${PS} = ${$(m.P0 - m.ts)}, quantity supplied is also ${f(Qt)}. The gap is ${$(m.tb + m.ts)}, the tax.`,
              `So <b>${f(Qt)}</b> ${m.g.p} are traded (down from ${f(m.Q0)} at ${$(m.P0)}).`),
          });
        },
      },
      {
        name: "Read a tax graph",
        make() {
          const w = wedgeGeo("tax");
          const svg = wedgePlot(w, "tax");
          const which = U.pick(["tax", "share", "rev", "dwl"]);
          let qq, ans, tr, last, unit = "$";
          if (which === "tax") {
            qq = `How large is the tax per ${w.g.s}?`; ans = w.w;
            tr = [{ value: w.a, why: "That is only the rise in the price buyers pay. The tax is the full gap between the buyers' and sellers' prices." }, { value: w.c, why: "That is only the fall in the sellers' price." }, { value: w.hiP, why: "That is the price buyers pay, not the tax." }];
            last = `The tax is the vertical gap at the new quantity: ${$(w.hiP)} − ${$(w.loP)} = <b>${$(ans)}</b>.`;
          } else if (which === "share") {
            qq = `How much of the tax per ${w.g.s} do buyers bear?`; ans = w.a;
            tr = [{ value: w.c, why: "That is the sellers' share (the fall in the price they keep)." }, { value: w.w, why: "That is the whole tax. Buyers bear only the rise in their price." }, { value: w.hiP, why: "That is the price buyers pay, not their share of the tax." }];
            last = `Buyers' price rises from ${$(w.P0)} to ${$(w.hiP)}: buyers bear <b>${$(ans)}</b> of the ${$(w.w)} tax.`;
          } else if (which === "rev") {
            qq = `How much tax revenue is collected per ${w.g.per}?`; ans = w.w * w.Q1;
            tr = [{ value: w.w * w.Q0, why: "Use the quantity after the tax." }, { value: w.hiP * w.Q1, why: "That is buyers' total spending." }, { value: w.w * w.dq / 2, why: "That is the deadweight loss." }];
            last = `Revenue = tax × new quantity = ${$(w.w)} × ${f(w.Q1)} = <b>${$(ans)}</b>, the rectangle between ${$(w.loP)} and ${$(w.hiP)}.`;
          } else {
            qq = `What is the deadweight loss of the tax per ${w.g.per}?`; ans = w.w * w.dq / 2;
            tr = [{ value: w.w * w.dq, why: "The deadweight loss is a triangle: multiply by ½." }, { value: w.w * w.Q1, why: "That is the tax revenue." }];
            last = `The triangle has height ${$(w.w)} (the tax) and base ${f(w.Q0)} − ${f(w.Q1)} = ${f(w.dq)}: ½ × ${w.w} × ${f(w.dq)} = <b>${$(ans)}</b>.`;
          }
          return Q.num({
            q: `The graph shows the market for ${w.g.p} before and after a per-unit tax collected from sellers (S + tax). Axis values mark the key points.${svg}${qq}`,
            answer: ans, unit, traps: traps(ans, tr),
            sol: S(`Read the three prices: before the tax ${$(w.P0)}; after it, buyers pay ${$(w.hiP)} (where S + tax meets D) and sellers keep ${$(w.loP)} (on the original S at the new quantity ${f(w.Q1)}).`, last),
          });
        },
      },
      {
        name: "Collect it from the other side",
        make() {
          const m = goodsMkt();
          const Pb = m.P0 + m.tb, Ps = m.P0 - m.ts, Qt = m.Q0 - m.dQ;
          return Q.mc({
            q: `In the market for ${m.g.p}, the price is ${$(m.P0)} with no tax. ${cap(a$(m.t))} tax per ${m.g.s} is collected from <b>sellers</b>: buyers now pay ${$(Pb)}, sellers keep ${$(Ps)}, and ${f(Qt)} are sold per ${m.g.per}. Lawmakers propose collecting the same ${$(m.t)} tax from <b>buyers</b> instead. What would happen?`,
            right: `Buyers would pay ${$(Ps)} to sellers plus ${$(m.t)} in tax (${$(Pb)} in total), sellers would keep ${$(Ps)}, and ${f(Qt)} would be sold`,
            wrong: [
              { t: `Buyers would pay ${$(Pb)} to sellers plus ${$(m.t)} in tax (${$(Pb + m.t)} in total)`, why: "That counts the tax twice. When buyers owe the tax, demand shifts down and the price paid to sellers falls." },
              { t: `Buyers would pay ${$(m.P0 + m.t)} in total and sellers would keep ${$(m.P0)}`, why: "The legal payer does not bear the whole tax. The incidence depends on the curves, not the law." },
              { t: `Sellers would keep the full ${$(m.P0)}, since they no longer owe the tax`, why: "Demand shifts down by the tax, so the price sellers receive falls just as before." },
            ],
            rightWhy: "A tax on buyers shifts demand down by the tax; a tax on sellers shifts supply up by it. Both give the same wedge, quantity and prices.",
            sol: S("Ask whether the law changes the wedge between what buyers pay in total and what sellers keep. It doesn't: either way the gap is the tax.",
              `So the market ends up at the same place: buyers pay ${$(Pb)} in total, sellers keep ${$(Ps)}, quantity ${f(Qt)}. Incidence is the same whoever legally pays.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Incidence and elasticity
   * ============================================================ */
  const BA = "Buyers pay all of it", SA = "Sellers pay all of it", SH = "Shared";
  const EXT_BANK = [
    { t: "Demand is perfectly inelastic (vertical demand curve)", cat: BA, why: "Buyers buy the same amount at any price, so the price rises by the full tax." },
    { t: "Demand is perfectly elastic (horizontal demand curve)", cat: SA, why: "Buyers will not pay a cent more, so sellers absorb the tax." },
    { t: "Supply is perfectly inelastic (vertical supply curve)", cat: SA, why: "Sellers supply the same amount at any price, so the price they keep falls by the full tax." },
    { t: "Supply is perfectly elastic (horizontal supply curve)", cat: BA, why: "Sellers will not accept less, so buyers pay the whole tax." },
    { t: "Demand slopes down and supply slopes up, as usual", cat: SH, why: "With normal slopes, both sides bear part of the tax." },
    { t: "After the tax, the price buyers pay rises by the full amount of the tax", cat: BA, why: "A full price rise means buyers bear all of it." },
    { t: "After the tax, the price buyers pay does not change at all", cat: SA, why: "If buyers' price doesn't rise, sellers bear the whole tax." },
    { t: "After the tax, the price buyers pay rises by less than the tax", cat: SH, why: "A partial rise means the burden is shared." },
    { t: "A medicine patients need in a fixed dose, whatever its price", cat: BA, why: "That is perfectly inelastic demand." },
    { t: "A tax on a fixed number of riverside lots that cannot be increased", cat: SA, why: "That is perfectly inelastic supply." },
    { t: "Firms can produce any quantity at a constant cost per unit", cat: BA, why: "That is perfectly elastic supply." },
    { t: "Buyers switch entirely to an identical untaxed product if the price rises at all", cat: SA, why: "That is perfectly elastic demand." },
  ];
  const WHO_BANK = [
    { t: "Cigarettes: smokers barely cut back when the price rises, while tobacco firms can easily expand or shrink output.", ans: "Buyers bear most of the tax", why: "Inelastic demand and elastic supply push the burden onto buyers." },
    { t: "Gasoline in a rural area with no public transit, where refiners can ship more or less fuel at a nearly constant cost.", ans: "Buyers bear most of the tax", why: "Drivers cannot easily cut back and suppliers can easily go elsewhere." },
    { t: "Insulin: patients need the same amount whatever the price, and many manufacturers can expand output easily.", ans: "Buyers bear most of the tax", why: "Very inelastic demand means buyers bear the burden." },
    { t: "Hotel rooms in a small resort town: the number of rooms is fixed for years, and tourists have many other resorts to choose from.", ans: "Sellers bear most of the tax", why: "Inelastic supply and elastic demand push the burden onto sellers." },
    { t: "Adult labor: most adults work about the same hours whatever the after-tax wage, while employers' hiring responds more to cost.", ans: "Sellers bear most of the tax", why: "Labor supply is inelastic, so workers (the sellers) bear most of it." },
    { t: "One brand of bottled water sold next to many nearly identical brands, by a firm whose bottling plant runs at fixed capacity.", ans: "Sellers bear most of the tax", why: "Buyers switch easily (elastic demand), and the firm cannot easily cut output (inelastic supply)." },
    { t: "Restaurant meals in a big city with plenty of alternatives, where restaurants have fixed space and staff for the coming months.", ans: "Sellers bear most of the tax", why: "Diners cut back easily (elastic demand) while restaurants cannot quickly change capacity (inelastic supply)." },
  ];
  const PRACT_BANK = [
    { t: "A tax on cigarettes", cat: "Mostly buyers", why: "Demand for tobacco is inelastic." },
    { t: "A gasoline tax", cat: "Mostly buyers", why: "Demand for gasoline is inelastic." },
    { t: "A tax on beer and liquor", cat: "Mostly buyers", why: "Demand for alcohol is inelastic." },
    { t: "A tax on a life-saving drug with no substitutes", cat: "Mostly buyers", why: "Demand is very inelastic." },
    { t: "The Social Security payroll tax (the sellers are workers)", cat: "Mostly sellers", why: "Labor supply is inelastic, so workers bear most of it." },
    { t: "The income tax on wages (the sellers are workers)", cat: "Mostly sellers", why: "Labor supply is inelastic, so workers bear most of it." },
    { t: "A tax on land, whose quantity is fixed", cat: "Mostly sellers", why: "Supply of land is perfectly inelastic." },
    { t: "A tax on one brand of a product that has many identical substitutes", cat: "Mostly sellers", why: "Demand for one brand is very elastic." },
  ];
  const TAX_TF = [
    { t: "Tax incidence is the same whether the law places the tax on buyers or on sellers.", ok: true, why: "Either way, the same wedge forms between the two prices." },
    { t: "The more inelastic the demand, the larger the buyers' share of the tax.", ok: true, why: "Buyers who cannot cut back end up paying more." },
    { t: "The more elastic the supply, the larger the buyers' share of the tax.", ok: true, why: "Sellers who can easily leave will not accept a much lower price." },
    { t: "If the price buyers pay rises by the full amount of the tax, buyers bear the entire tax.", ok: true, why: "That is how incidence is read from prices." },
    { t: "A tax drives a wedge between the price buyers pay and the price sellers receive.", ok: true, why: "The wedge equals the tax." },
    { t: "Except when demand or supply is perfectly inelastic, a tax reduces the quantity traded and creates a deadweight loss.", ok: true, why: "Lost trades are the deadweight loss." },
    { t: "Because labor supply is fairly inelastic, workers bear most of the payroll tax.", ok: true, why: "Inelastic supply puts the burden on sellers, here workers." },
    { t: "Whoever the law says must send the tax to the government bears the whole burden.", ok: false, why: "Incidence depends on elasticities, not on the law." },
    { t: "A tax on sellers always raises the price buyers pay by exactly the amount of the tax.", ok: false, why: "That happens only if demand is perfectly inelastic or supply perfectly elastic." },
    { t: "The more elastic the demand, the larger the buyers' share of the tax.", ok: false, why: "Elastic demand lets buyers escape, so sellers bear more." },
    { t: "The tax revenue collected is the deadweight loss of the tax.", ok: false, why: "Revenue is a transfer to the government. The deadweight loss is the surplus from trades that no longer happen." },
    { t: "If supply is perfectly inelastic, buyers pay all of the tax.", ok: false, why: "Perfectly inelastic supply means sellers pay it all." },
    { t: "A tax collected from buyers shifts the supply curve up.", ok: false, why: "A tax on buyers shifts the demand curve down by the tax." },
  ];

  function elastGraph() {
    return draw(() => {
      const kind = U.pick(["vd", "vs", "hs", "hd"]);
      const P0 = U.randInt(10, 24), t = U.randInt(3, 8), Q0 = U.pick([40, 50, 60, 80]);
      const yMax = Math.ceil((P0 + t) * 1.45), xMax = Math.ceil(Q0 * 1.7 / 10) * 10;
      if (t < 0.09 * yMax || P0 - t < 3) return null;
      const dq = U.pick([10, 15, 20]);
      if (dq > Q0 / 2 || dq < 0.1 * xMax) return null;
      return { kind, P0, t, Q0, dq, Q1: Q0 - dq, xMax, yMax, g: U.pick(GOODS) };
    });
  }

  const genElast = STUDY.makeGenerator({
    id: "b251-m6-elastic",
    name: "Who pays a tax? Incidence and elasticity",
    blurb: "Use the elasticities of demand and supply to predict who bears a tax, read the extreme cases, and tell when a tax has no deadweight loss.",
    variants: [
      {
        name: "Classify the extreme cases",
        make() {
          const items = [];
          for (const c of [BA, SA, SH]) items.push(U.pick(EXT_BANK.filter(i => i.cat === c && !items.includes(i))));
          for (const x of U.deal("m6-ext", EXT_BANK, 8)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "A per-unit tax is imposed. In each situation, who bears the tax?",
            cats: [BA, SA, SH], items,
            sol: S("The side that cannot respond to price ends up paying. Vertical curve = cannot respond at all; horizontal curve = will not accept any price change.",
              "Inelastic demand or elastic supply → buyers. Elastic demand or inelastic supply → sellers. Normal slopes → shared."),
          });
        },
      },
      {
        name: "Who bears more?",
        make() {
          const sc = U.pick(WHO_BANK);
          const opts = ["Buyers bear most of the tax", "Sellers bear most of the tax"];
          const other = opts.find(o => o !== sc.ans);
          return Q.mc({
            q: `A per-unit tax is placed on this good. ${sc.t} Who bears most of the tax?`,
            right: sc.ans,
            wrong: [
              { t: other, why: sc.ans.startsWith("Buyers") ? "Sellers here can respond easily, so they do not accept much of a price cut." : "Buyers here can respond easily, so they will not pay much more." },
              { t: "Buyers and sellers split it exactly equally", why: "An even split is not the general rule; it depends on the relative elasticities." },
              { t: "Whoever the law says must pay it bears all of it", why: "The legal assignment does not determine incidence." },
            ],
            rightWhy: sc.why,
            sol: S("Ask which side would find it harder to change the quantity it buys or sells when the price changes.",
              "That less responsive (more inelastic) side bears more of the tax."),
          });
        },
      },
      {
        name: "Taxes in practice",
        make() {
          const items = U.sample(PRACT_BANK.filter(i => i.cat === "Mostly buyers"), 2).concat(U.sample(PRACT_BANK.filter(i => i.cat === "Mostly sellers"), 2));
          for (const x of U.deal("m6-pract", PRACT_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Who bears most of each tax: buyers or sellers?",
            cats: ["Mostly buyers", "Mostly sellers"], items,
            sol: S("Goods with inelastic demand (tobacco, alcohol, gasoline, essential medicines) put the burden on buyers.",
              "In the labor market workers are the sellers, and labor supply is inelastic, so workers bear most of income and payroll taxes. Fixed supply (land) or very elastic demand also puts the burden on sellers."),
          });
        },
      },
      {
        name: "Infer elasticity from the price change",
        make() {
          const t = U.pick([4, 6, 8, 10]), P0 = U.randInt(15, 40);
          const c = U.pick(["more", "less", "all", "none"]);
          const x = c === "all" ? t : c === "none" ? 0 : c === "more" ? U.randInt(t / 2 + 1, t - 1) : U.randInt(1, t / 2 - 1);
          const g = U.pick(GOODS);
          const O = [
            "Demand is less elastic than supply, so buyers bear more of the tax",
            "Demand is more elastic than supply, so sellers bear more of the tax",
            "Demand is perfectly inelastic or supply is perfectly elastic",
            "Demand is perfectly elastic or supply is perfectly inelastic",
          ];
          const ri = { more: 0, less: 1, all: 2, none: 3 }[c];
          const whys = [
            "That would put more than half, but not all, of the tax on buyers.",
            "That would put less than half, but some, of the tax on buyers.",
            "In those cases buyers' price rises by the whole tax.",
            "In those cases buyers' price does not rise at all.",
          ];
          return Q.mc({
            q: `Before ${a$(t)} tax per ${g.s}, the price was ${$(P0)}. After the tax, buyers pay ${$(P0 + x)}. What can you conclude?`,
            right: O[ri], wrong: O.filter((_, i) => i !== ri).map((o, j) => ({ t: o, why: whys[O.indexOf(o)] })), keepOrder: O,
            rightWhy: `Buyers bear ${$(x)} of the ${$(t)} tax.`,
            sol: S("Buyers' share = rise in the price buyers pay ÷ tax. The side with the less elastic curve bears more.",
              `Here buyers bear ${$(x)} of ${$(t)} (${pctS(100 * x / t)}). ${c === "all" ? "All of it: buyers cannot respond or sellers will not accept less." : c === "none" ? "None of it: sellers absorb it all." : c === "more" ? "More than half: demand is less elastic than supply." : "Less than half: demand is more elastic than supply."}`),
          });
        },
      },
      {
        name: "When is there no deadweight loss?",
        make() {
          const right = U.pick(["Demand for the good is perfectly inelastic", "Supply of the good is perfectly inelastic"]);
          return Q.mc({
            q: "A per-unit tax is imposed on a good. In which case does the tax create <b>no</b> deadweight loss?",
            right,
            wrong: [
              { t: "Demand for the good is perfectly elastic", why: "With horizontal demand the quantity falls (a lot), so trades are lost." },
              { t: "The tax is collected from buyers instead of sellers", why: "Who legally pays changes nothing about the outcome." },
              { t: "The tax is small", why: "A small tax creates a small deadweight loss, but not zero." },
              { t: "The government spends the revenue on useful projects", why: "Revenue is a transfer; the deadweight loss comes from trades that no longer happen." },
            ].slice(0, U.randInt(3, 4)),
            rightWhy: "With a perfectly inelastic curve the quantity traded does not change, so no trades are lost.",
            sol: S("Deadweight loss comes from trades that stop happening because of the tax.",
              "Only if the quantity cannot change, with perfectly inelastic demand or supply, is there no lost trade and so no deadweight loss."),
          });
        },
      },
      {
        name: "Select all true statements about incidence",
        make() {
          return selectAll("m6-taxtf", TAX_TF, 5, "Select <b>all</b> statements that are true.",
            S("Incidence depends on elasticities, never on who legally pays.",
              "Inelastic demand / elastic supply → buyers bear more. Elastic demand / inelastic supply → sellers bear more. Revenue is a transfer; lost trades are the deadweight loss."));
        },
      },
      {
        name: "Read an extreme-case graph",
        make() {
          const e = elastGraph();
          const lo = e.yMax * 0.04, hi = e.yMax * 0.92;
          const slope = e.dq / e.t;      // quantity per $ for the sloped curve
          let lines, onB, pb, ps, xT = [e.Q0], pts;
          if (e.kind === "vd") {
            lines = [{ pts: [[e.Q0, lo], [e.Q0, hi]], style: "main", label: "D", labelAt: 1 }, { fQ: P => e.Q0 + (P - e.P0) * slope, style: "alt", label: "S" }, { fQ: P => e.Q0 + (P - e.t - e.P0) * slope, style: "dash", label: "S + tax" }];
            onB = false; pb = e.P0 + e.t; ps = e.P0; pts = [{ x: e.Q0, y: e.P0, label: "E₀" }, { x: e.Q0, y: pb, label: "E₁" }];
          } else if (e.kind === "vs") {
            lines = [{ pts: [[e.Q0, lo], [e.Q0, hi]], style: "alt", label: "S", labelAt: 1 }, { fQ: P => e.Q0 - (P - e.P0) * slope, style: "main", label: "D" }, { fQ: P => e.Q0 - (P + e.t - e.P0) * slope, style: "dash", label: "D − tax" }];
            onB = true; pb = e.P0; ps = e.P0 - e.t; pts = [{ x: e.Q0, y: e.P0, label: "E₀" }, { x: e.Q0, y: ps, label: "E₁" }];
          } else if (e.kind === "hs") {
            lines = [{ pts: [[e.xMax * 0.03, e.P0], [e.xMax * 0.8, e.P0]], style: "alt", label: "S", labelAt: 1 }, { pts: [[e.xMax * 0.03, e.P0 + e.t], [e.xMax * 0.8, e.P0 + e.t]], style: "dash", label: "S + tax", labelAt: 1 }, { fQ: P => e.Q0 - (P - e.P0) * slope, style: "main", label: "D" }];
            onB = false; pb = e.P0 + e.t; ps = e.P0; xT = [e.Q1, e.Q0]; pts = [{ x: e.Q0, y: e.P0, label: "E₀" }, { x: e.Q1, y: pb, label: "E₁" }];
          } else {
            lines = [{ pts: [[e.xMax * 0.03, e.P0], [e.xMax * 0.8, e.P0]], style: "main", label: "D", labelAt: 1 }, { fQ: P => e.Q0 + (P - e.P0) * slope, style: "alt", label: "S" }, { fQ: P => e.Q0 + (P - e.t - e.P0) * slope, style: "dash", label: "S + tax" }];
            onB = false; pb = e.P0; ps = e.P0 - e.t; xT = [e.Q1, e.Q0]; pts = [{ x: e.Q0, y: e.P0, label: "E₀" }, { x: e.Q1, y: e.P0, label: "E₁" }];
          }
          const svg = mktPlot({ xLabel: `${cap(e.g.p)} per ${e.g.per}`, yLabel: "Price ($)", xMax: e.xMax, yMax: e.yMax, xTicks: xT, yTicks: [e.P0 - e.t, e.P0, e.P0 + e.t], lines, points: pts, aria: "tax with an extreme elasticity" });
          const askB = Math.random() < 0.5;
          const ans = askB ? pb : ps;
          const desc = { vd: "Demand is perfectly inelastic, so buyers pay the whole tax.", vs: "Supply is perfectly inelastic, so sellers pay the whole tax.", hs: "Supply is perfectly elastic, so buyers pay the whole tax.", hd: "Demand is perfectly elastic, so sellers pay the whole tax." }[e.kind];
          return Q.num({
            q: `The graph shows the market for ${e.g.p} before and after ${a$(e.t)} tax per ${e.g.s}, collected from ${onB ? "buyers (D − tax)" : "sellers (S + tax)"}. Axis values mark the prices.${svg}After the tax, what price do ${askB ? "buyers pay, including the tax" : "sellers keep"}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: askB ? ps : pb, why: askB ? "That is the price sellers keep." : "That is the price buyers pay." },
              { value: e.P0 + (askB ? 1 : -1) * e.t / 2, why: "That splits the tax evenly. With a vertical or horizontal curve, one side pays all of it." },
              { value: askB ? e.P0 + e.t : e.P0 - e.t, why: askB ? "That has buyers paying the whole tax. Check which curve is vertical or horizontal: here it is sellers who cannot escape it." : "That has sellers paying the whole tax. Check which curve is vertical or horizontal: here it is buyers who cannot escape it." },
            ]),
            sol: S(`${desc} Buyers pay ${PB} and sellers keep ${PS} = ${PB} − ${$(e.t)}.`,
              `New equilibrium: buyers pay ${$(pb)}, sellers keep ${$(ps)}. The answer is <b>${$(ans)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Subsidies
   * ============================================================ */
  function subSteps(m) {
    const Pb = m.P0 - m.tb, Pr = m.P0 + m.ts, Qn = m.Q0 + m.dQ;
    return [
      `A subsidy works like a tax in reverse: producers receive the price buyers pay <em>plus</em> the subsidy. Set quantity demanded at ${PB} equal to quantity supplied at ${PB} + ${m.t}.`,
      eqStep(m),
      `With the subsidy: ${dExpr(m.A, m.b, PB)} = ${sExpr(m.C0, m.d, `(${PB} + ${m.t})`)}, so ${f(m.b + m.d)}${PB} = ${f(m.A - m.C0 - m.d * m.t)} and ${PB} = ${$(Pb)}. Producers receive ${$(Pb)} + ${$(m.t)} = ${$(Pr)}, and output is ${f(Qn)}.`,
    ];
  }
  const subQ = m => `In ${m.city}, ${goodsEqs(m)}. The government pays producers a subsidy of ${$(m.t)} per ${m.g.s}.`;
  const SUB_BANK = [
    { t: "The quantity produced rises above the efficient quantity.", ok: true, why: "Supply shifts down (right), so output rises past where MB = MC." },
    { t: "Buyers pay a lower price.", ok: true, why: "More output can only be sold at a lower price." },
    { t: "Producers receive more per unit (price plus subsidy) than before.", ok: true, why: "The subsidy more than makes up for the lower market price." },
    { t: "At the new quantity, producers' marginal cost exceeds buyers' marginal benefit.", ok: true, why: "MC = price + subsidy, while MB = the price buyers pay." },
    { t: "The government's cost equals the subsidy per unit times the new quantity.", ok: true, why: "The subsidy is paid on every unit produced." },
    { t: "A deadweight loss arises from overproduction.", ok: true, why: "The extra units cost more than they are worth to buyers." },
    { t: "The subsidy shifts the demand curve to the right.", ok: false, why: "A subsidy paid to producers shifts the supply curve." },
    { t: "Because output rises, the subsidy makes the market more efficient.", ok: false, why: "The competitive market was already efficient; extra output beyond it is overproduction." },
    { t: "The government pays the subsidy only on the extra units the subsidy encourages.", ok: false, why: "It pays on every unit produced." },
    { t: "Buyers pay the old price plus the subsidy.", ok: false, why: "Buyers pay less, not more." },
    { t: "Producers keep the whole subsidy, so the price buyers pay does not change.", ok: false, why: "With normal slopes, part of the benefit goes to buyers as a lower price." },
  ];

  const genSubsidy = STUDY.makeGenerator({
    id: "b251-m6-subsidy",
    name: "Subsidies",
    blurb: "Find the price buyers pay, what producers receive, the cost to the government and the deadweight loss of a per-unit subsidy.",
    variants: [
      {
        name: "Price buyers pay with a subsidy",
        make() {
          const m = goodsMkt(), Pb = m.P0 - m.tb;
          return Q.num({
            q: `${subQ(m)} What price do buyers pay after the subsidy?`,
            answer: Pb, unit: "$",
            traps: traps(Pb, [
              { value: m.P0 - m.t, why: "That passes the whole subsidy on to buyers. Producers keep part of it." },
              { value: m.P0 + m.ts, why: "That is what producers receive per unit (price + subsidy)." },
              { value: m.P0, why: "That is the price before the subsidy." },
              { value: m.P0 - m.ts, why: "That swaps the two shares." },
            ]),
            sol: S(...subSteps(m), `Buyers pay <b>${$(Pb)}</b>, ${$(m.tb)} less than before.`),
          });
        },
      },
      {
        name: "What producers receive (marginal cost)",
        make() {
          const m = goodsMkt(), Pr = m.P0 + m.ts;
          return Q.num({
            q: `${subQ(m)} After the subsidy, how much do producers receive per ${m.g.s} in total (market price plus subsidy)? This also equals their marginal cost at the new output.`,
            answer: Pr, unit: "$",
            traps: traps(Pr, [
              { value: m.P0 + m.t, why: "That adds the whole subsidy to the old price. The market price falls, so producers gain less than the full subsidy." },
              { value: m.P0 - m.tb, why: "That is the price buyers pay, without the subsidy." },
              { value: m.P0, why: "That is the price before the subsidy." },
              { value: m.P0 + m.tb, why: "That swaps the two shares." },
            ]),
            sol: S(...subSteps(m), `Producers receive <b>${$(Pr)}</b>, ${$(m.ts)} more than before.`),
          });
        },
      },
      {
        name: "Cost of the subsidy to the government",
        make() {
          const m = goodsMkt(), Qn = m.Q0 + m.dQ, ans = m.t * Qn;
          return Q.num({
            q: `${subQ(m)} How much does the subsidy cost the government per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.Q0, why: "That uses the output before the subsidy. The subsidy is paid on every unit produced afterwards, including the extra ones." },
              { value: m.t * m.dQ, why: "That pays the subsidy only on the extra units. It is paid on all of them." },
              { value: (m.P0 + m.ts) * Qn, why: "That is producers' total receipts, not the government's cost." },
            ]),
            sol: S(...subSteps(m), `Cost = subsidy × new output = ${$(m.t)} × ${f(Qn)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Deadweight loss of a subsidy",
        make() {
          const m = goodsMkt(), Qn = m.Q0 + m.dQ, ans = m.t * m.dQ / 2;
          return Q.num({
            q: `${subQ(m)} What is the deadweight loss from the subsidy per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.dQ, why: "The deadweight loss is a triangle: multiply by ½." },
              { value: m.t * Qn, why: "That is the government's total cost, most of which is a transfer to buyers and sellers." },
              { value: m.t * Qn / 2, why: "Use the <em>rise</em> in output as the base of the triangle." },
            ]),
            sol: S(...subSteps(m), `Output rises by ${f(m.dQ)}; on those units MC exceeds MB by up to the subsidy. DWL = ½ × ${$(m.t)} × ${f(m.dQ)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Select all true statements about subsidies",
        make() {
          return selectAll("m6-sub", SUB_BANK, 5, `The government pays producers of ${U.pick(GOODS).p} a subsidy per unit. Select <b>all</b> statements that are true.`,
            S("A subsidy shifts supply down by the subsidy: output rises, buyers pay less, producers receive more.",
              "The government pays the subsidy on every unit, and the overproduction creates a deadweight loss because MC &gt; MB on the extra units."));
        },
      },
      {
        name: "Read a subsidy graph",
        make() {
          const w = wedgeGeo("subsidy");
          const svg = wedgePlot(w, "subsidy");
          const which = U.pick(["sub", "cost", "dwl", "pb"]);
          let qq, ans, tr, last;
          if (which === "sub") {
            qq = `How large is the subsidy per ${w.g.s}?`; ans = w.w;
            tr = [{ value: w.a, why: "That is only the fall in the buyers' price." }, { value: w.c, why: "That is only the rise in what producers receive." }, { value: w.hiP, why: "That is what producers receive, not the subsidy." }];
            last = `The subsidy is the vertical gap at the new output: ${$(w.hiP)} − ${$(w.loP)} = <b>${$(ans)}</b>.`;
          } else if (which === "cost") {
            qq = `How much does the subsidy cost the government per ${w.g.per}?`; ans = w.w * w.Q1;
            tr = [{ value: w.w * w.Q0, why: "Use the new, higher output." }, { value: w.w * w.dq, why: "The subsidy is paid on every unit, not just the extra ones." }, { value: w.w * w.dq / 2, why: "That is the deadweight loss." }];
            last = `Cost = subsidy × new output = ${$(w.w)} × ${f(w.Q1)} = <b>${$(ans)}</b>.`;
          } else if (which === "dwl") {
            qq = `What is the deadweight loss from the subsidy per ${w.g.per}?`; ans = w.w * w.dq / 2;
            tr = [{ value: w.w * w.dq, why: "Multiply by ½: it is a triangle." }, { value: w.w * w.Q1, why: "That is the government's cost." }];
            last = `Triangle: height ${$(w.w)}, base ${f(w.Q1)} − ${f(w.Q0)} = ${f(w.dq)}. ½ × ${w.w} × ${f(w.dq)} = <b>${$(ans)}</b>.`;
          } else {
            qq = `What price do buyers pay after the subsidy?`; ans = w.loP;
            tr = [{ value: w.hiP, why: "That is what producers receive including the subsidy." }, { value: w.P0, why: "That is the price before the subsidy." }];
            last = `The new equilibrium is where S − subsidy crosses D: buyers pay <b>${$(ans)}</b>.`;
          }
          return Q.num({
            q: `The graph shows the market for ${w.g.p} before and after a per-unit subsidy to producers (S − subsidy). Axis values mark the key points.${svg}${qq}`,
            answer: ans, unit: "$", traps: traps(ans, tr),
            sol: S(`Before: ${$(w.P0)} and ${f(w.Q0)}. After: output ${f(w.Q1)}, buyers pay ${$(w.loP)} (on D), producers receive ${$(w.hiP)} (on the original S, which is their marginal cost).`, last),
          });
        },
      },
      {
        name: "Why is a subsidy inefficient?",
        make() {
          const g = U.pick(GOODS);
          return Q.mc({
            q: `A per-unit subsidy raises production of ${g.p} above the free-market quantity and lowers the price buyers pay. Why does the subsidy create a deadweight loss?`,
            right: `For the extra ${g.p}, the marginal cost of producing them exceeds the marginal benefit to buyers`,
            wrong: [
              { t: "Because the government's spending on the subsidy is itself the deadweight loss", why: "Most of that spending is a transfer to buyers and sellers. The deadweight loss is only the overproduction triangle." },
              { t: `Because fewer ${g.p} are produced than the efficient quantity`, why: "That is the problem with a tax or a quota. A subsidy leads to too many, not too few." },
              { t: "Because buyers pay a price above the free-market price", why: "Buyers pay less with a subsidy." },
            ],
            rightWhy: "Producing a unit whose cost exceeds its value to buyers wastes resources.",
            sol: S("A competitive market without intervention produces where marginal benefit equals marginal cost, the efficient quantity.",
              "The subsidy pushes output past that point. Each extra unit costs more to make (MC, on the supply curve) than buyers value it (MB, on the demand curve), and that gap summed over the extra units is the deadweight loss."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Production quotas
   * ============================================================ */
  function quotaSteps(m) {
    const qq = m.Q0 - m.dQ, Pq = m.P0 + m.tb, MC = m.P0 - m.ts;
    return [
      eqStep(m) + ` The quota of ${f(qq)} is below ${f(m.Q0)}, so it binds.`,
      `Price buyers pay: set Q<sub>D</sub> = ${f(qq)}: ${dExpr(m.A, m.b, "P")} = ${f(qq)}, so P = (${f(m.A)} − ${f(qq)}) ÷ ${f(m.b)} = ${$(Pq)}.`,
      `Marginal cost at the quota: set Q<sub>S</sub> = ${f(qq)}: ${sExpr(m.C0, m.d, "P")} = ${f(qq)}, so P = (${f(qq)} ${m.C0 < 0 ? "+ " + f(-m.C0) : "− " + f(m.C0)}) ÷ ${f(m.d)} = ${$(MC)}.`,
    ];
  }
  const quotaQ = m => `In ${m.city}, ${goodsEqs(m)}. Producers are limited by a production quota of ${f(m.Q0 - m.dQ)} ${m.g.p} per ${m.g.per}.`;
  const QUOTA_BANK = [
    { t: "Output falls to the quota.", ok: true, why: "A binding quota limits production below equilibrium." },
    { t: "Buyers pay a higher price.", ok: true, why: "With less output, buyers bid the price up along the demand curve." },
    { t: "Producers' marginal cost falls below the price.", ok: true, why: "At the smaller output, the supply curve (MC) is lower than the price." },
    { t: "The gap between price and marginal cost creates quota rents for producers.", ok: true, why: "Producers allowed to produce earn the gap on every unit." },
    { t: "Underproduction creates a deadweight loss.", ok: true, why: "Units worth more to buyers than they cost are not produced." },
    { t: "A quota set above the equilibrium quantity has no effect.", ok: true, why: "Firms already produce less than the limit." },
    { t: "A quota raises output above the equilibrium quantity.", ok: false, why: "A quota is an upper limit; it can only reduce output." },
    { t: "A quota creates a surplus of unsold goods.", ok: false, why: "The price rises until buyers want exactly the quota quantity." },
    { t: "Quota rents are collected by the government as revenue.", ok: false, why: "Quota rents go to the producers who hold the right to produce. Revenue is what a tax raises." },
    { t: "Producers' marginal cost rises because of the quota.", ok: false, why: "Producing less moves down the supply curve, so marginal cost falls." },
    { t: "Total surplus (consumer plus producer) rises because producers earn quota rents.", ok: false, why: "Quota rents come out of consumer surplus, and the deadweight loss means total surplus falls." },
  ];

  const genQuota = STUDY.makeGenerator({
    id: "b251-m6-quota",
    name: "Production quotas",
    blurb: "Work out the price, marginal cost, quota rents and deadweight loss of a production quota, and compare a quota with a tax.",
    variants: [
      {
        name: "Price under a quota",
        make() {
          const m = goodsMkt(), Pq = m.P0 + m.tb;
          return Q.num({
            q: `${quotaQ(m)} What price do buyers pay?`,
            answer: Pq, unit: "$",
            traps: traps(Pq, [
              { value: m.P0, why: "That is the free-market price. With output limited, buyers bid the price up." },
              { value: m.P0 - m.ts, why: "That is producers' marginal cost at the quota (read from the supply curve), not the price." },
              { value: m.P0 + m.t, why: "That adds the whole price–MC gap to the old price. Read the demand curve at the quota instead." },
            ]),
            sol: S("A binding quota fixes the quantity. The price is whatever buyers will pay for that quantity: read it off the <em>demand</em> curve.",
              ...quotaSteps(m).slice(0, 2), `Buyers pay <b>${$(Pq)}</b>.`),
          });
        },
      },
      {
        name: "Marginal cost at the quota",
        make() {
          const m = goodsMkt(), MC = m.P0 - m.ts;
          return Q.num({
            q: `${quotaQ(m)} What is producers' marginal cost of the last ${m.g.s} produced under the quota?`,
            answer: MC, unit: "$",
            traps: traps(MC, [
              { value: m.P0 + m.tb, why: "That is the price buyers pay (from the demand curve). Marginal cost comes from the supply curve." },
              { value: m.P0, why: "That is the marginal cost at the free-market quantity. Less output means lower marginal cost." },
              { value: m.P0 - m.t, why: "Read the supply curve at the quota rather than subtracting the full gap from the old price." },
            ]),
            sol: S("Marginal cost is the height of the <em>supply</em> curve at the quantity produced.",
              quotaSteps(m)[0], quotaSteps(m)[2], `Marginal cost is <b>${$(MC)}</b>, below the ${$(m.P0 + m.tb)} price buyers pay.`),
          });
        },
      },
      {
        name: "Total quota rents",
        make() {
          const m = goodsMkt(), qq = m.Q0 - m.dQ, ans = m.t * qq;
          return Q.num({
            q: `${quotaQ(m)} What are total quota rents per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.Q0, why: "Quota rents are earned only on the units produced under the quota." },
              { value: (m.P0 + m.tb) * qq, why: "That is total revenue, not the gap between price and marginal cost." },
              { value: m.t * m.dQ / 2, why: "That is the deadweight loss." },
              { value: m.tb * qq, why: "That uses only the rise in price. Quota rents use the whole gap between price and marginal cost." },
            ]),
            sol: S("Quota rents = (price − marginal cost) × quota.", ...quotaSteps(m),
              `Quota rents = (${$(m.P0 + m.tb)} − ${$(m.P0 - m.ts)}) × ${f(qq)} = ${$(m.t)} × ${f(qq)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Deadweight loss of a quota",
        make() {
          const m = goodsMkt(), qq = m.Q0 - m.dQ, ans = m.t * m.dQ / 2;
          return Q.num({
            q: `${quotaQ(m)} What is the deadweight loss of the quota per ${m.g.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: m.t * m.dQ, why: "Multiply by ½: it is a triangle." },
              { value: m.t * qq, why: "That is total quota rents, a transfer to producers." },
            ]),
            sol: S("The deadweight loss is the triangle between demand and supply from the quota out to the free-market quantity: ½ × (price − MC) × (fall in quantity).",
              ...quotaSteps(m), `DWL = ½ × ${$(m.t)} × (${f(m.Q0)} − ${f(qq)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Does the quota bind?",
        make() {
          const g = U.pick(GOODS), city = U.pick(CITIES);
          const Q0 = U.randInt(8, 30) * 50, P0 = U.randInt(g.lo, g.hi);
          const c = U.pick(["below", "above"]);
          const qq = c === "below" ? Q0 - U.randInt(2, 6) * 25 : c === "above" ? Q0 + U.randInt(2, 6) * 25 : Q0;
          const T = {
            bind: `Output falls to ${f(qq)}, the price rises above ${$(P0)}, and quota rents and a deadweight loss appear`,
            none: `Nothing changes: firms keep producing ${f(Q0)} at ${$(P0)}`,
            up: `Output rises to ${f(qq)} and the price falls`,
            surplus: `Output stays at ${f(Q0)}, but a surplus of unsold ${g.p} builds up`,
          };
          const right = c === "below" ? T.bind : T.none;
          const whys = c === "below" ? {
            none: `The quota of ${f(qq)} is below the ${f(Q0)} firms want to produce, so it binds.`,
            up: "A quota is an upper limit; it cannot raise output.",
            surplus: "Firms must cut output to the quota, and the price rises until buyers want exactly that much.",
          } : {
            bind: `The quota (${f(qq)}) is ${c === "equal" ? "equal to" : "above"} the equilibrium quantity, so firms are not forced to cut output.`,
            up: "A quota never forces firms to produce more; it only sets a maximum.",
            surplus: "A non-binding quota does not change anything, so no surplus appears.",
          };
          return Q.mc({
            q: `Without intervention, producers in ${city} sell ${f(Q0)} ${g.p} per ${g.per} at ${$(P0)} each. The government introduces a production quota of ${f(qq)} ${g.p} per ${g.per}. What happens?`,
            right, wrong: Object.keys(T).filter(k => T[k] !== right).map(k => ({ t: T[k], why: whys[k] })),
            rightWhy: c === "below" ? "A quota below the equilibrium quantity binds: less output, a higher price, a lower MC." : "A quota at or above the equilibrium quantity is not binding.",
            sol: S("A quota is a legal <em>maximum quantity</em>. Like a ceiling, it only matters if the market would otherwise go past it.",
              `Compare: quota ${f(qq)} vs equilibrium quantity ${f(Q0)}. ${c === "below" ? "The quota is lower, so it binds." : "The quota is not lower, so it does not bind."}`),
          });
        },
      },
      {
        name: "Which is NOT true of a binding quota?",
        make() {
          const bank = QUOTA_BANK.filter(o => o.t !== "A quota set above the equilibrium quantity has no effect.");
          return whichNot(bank, `The government sets a binding production quota on ${U.pick(GOODS).p}. Which statement is <b>not</b> true?`,
            "This is false.",
            S("A binding quota cuts output, so buyers pay more (demand curve) and marginal cost falls (supply curve).",
              "The price–MC gap is quota rents for producers, and the lost output is a deadweight loss. There is no surplus and no government revenue."));
        },
      },
      {
        name: "Quota vs tax",
        make() {
          const g = U.pick(GOODS);
          return Q.mc({
            q: `A tax on ${g.p} and a production quota on ${g.p} can be set so that they cut output to the same level and give buyers the same price. What is the key difference between them?`,
            right: "With the tax, the gap between price and marginal cost goes to the government as revenue; with the quota, it goes to producers as quota rents",
            wrong: [
              { t: "Only the tax creates a deadweight loss", why: "Both cut output below the efficient quantity, so both create the same deadweight loss." },
              { t: "The quota raises output while the tax lowers it", why: "A quota limits output; both reduce it." },
              { t: "Only the quota raises the price buyers pay", why: "Both raise the price buyers pay." },
            ],
            rightWhy: "Same wedge, different owner: tax revenue vs quota rents.",
            sol: S("Both policies open a wedge between the price buyers pay and producers' marginal cost, and both shrink output by the same amount.",
              "The difference is who collects the wedge: the government (tax revenue) or the producers allowed to produce (quota rents)."),
          });
        },
      },
      {
        name: "Read a quota graph",
        make() {
          const w = wedgeGeo("quota");
          const svg = wedgePlot(w, "quota");
          const which = U.pick(["per", "rents", "dwl"]);
          let qq, ans, tr, last;
          if (which === "per") {
            qq = `By how much does the price buyers pay exceed producers' marginal cost under the quota?`; ans = w.w;
            tr = [{ value: w.a, why: "That is only how much the price rose. Compare the price with marginal cost." }, { value: w.c, why: "That is only how much marginal cost fell." }, { value: w.hiP, why: "That is the price, not the gap." }];
            last = `Price ${$(w.hiP)} − marginal cost ${$(w.loP)} = <b>${$(ans)}</b> per ${w.g.s}.`;
          } else if (which === "rents") {
            qq = `What are total quota rents per ${w.g.per}?`; ans = w.w * w.Q1;
            tr = [{ value: w.w * w.Q0, why: "Quota rents are earned only on the quota quantity." }, { value: w.hiP * w.Q1, why: "That is total revenue." }, { value: w.w * w.dq / 2, why: "That is the deadweight loss." }];
            last = `Quota rents = (${$(w.hiP)} − ${$(w.loP)}) × ${f(w.Q1)} = <b>${$(ans)}</b>.`;
          } else {
            qq = `What is the deadweight loss of the quota per ${w.g.per}?`; ans = w.w * w.dq / 2;
            tr = [{ value: w.w * w.dq, why: "Multiply by ½: it is a triangle." }, { value: w.w * w.Q1, why: "That is total quota rents." }];
            last = `Triangle: height ${$(w.w)}, base ${f(w.Q0)} − ${f(w.Q1)} = ${f(w.dq)}. ½ × ${w.w} × ${f(w.dq)} = <b>${$(ans)}</b>.`;
          }
          return Q.num({
            q: `The graph shows the market for ${w.g.p} with a production quota. Axis values mark the key points.${svg}${qq}`,
            answer: ans, unit: "$", traps: traps(ans, tr),
            sol: S(`At the quota of ${f(w.Q1)}, buyers pay ${$(w.hiP)} (up to the demand curve) and marginal cost is ${$(w.loP)} (down to the supply curve). Without the quota: ${$(w.P0)} and ${f(w.Q0)}.`, last),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m6", order: 6,
    title: "Module 6 · Price Ceilings, Floors, Taxes and Subsidies",
    short: "M6 · Price controls",
    description: "Rent ceilings and minimum wages (shortages, surpluses, search, black markets, deadweight loss, fairness), tax incidence and elasticity, tax revenue, subsidies and production quotas.",
    notes, flashcards, cues,
    generators: [genBinding, genGap, genRent, genMinWage, genTax, genElast, genSubsidy, genQuota],
  });
})();
