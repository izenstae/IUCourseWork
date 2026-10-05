/* ============================================================
 * ECON B251 · Module 10 — Firms and Industries: Perfect Competition
 * Characteristics of perfect competition and the price taker,
 * profit maximization (MR = MC, largest TR − TC), total revenue,
 * total cost and economic profit, the three short-run outcomes
 * (profit, loss, shut down), the short-run supply curve, entry and
 * exit and long-run equilibrium, and competition and efficiency.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const an = w => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
  const ordinal = k => k + (k % 100 >= 11 && k % 100 <= 13 ? "th" : k % 10 === 1 ? "st" : k % 10 === 2 ? "nd" : k % 10 === 3 ? "rd" : "th");
  /* Money: whole dollars stay whole, anything else shows cents. */
  const $ = x => U.money(U.round(x, 2), Number.isInteger(U.round(x, 2)) ? 0 : 2);
  const $2 = x => U.money(U.round(x, 2), 2);
  const r2 = x => U.round(x, 2);

  /* Products sold in (close to) perfectly competitive markets. `k` scales the
   * dollar figures so each product gets believable prices; `t` scales the
   * quantity axis on graphs. */
  const PRODUCTS = [
    { s: "crate of tomatoes", p: "crates of tomatoes", firm: "farm", k: [1, 2], t: [1, 10] },
    { s: "bushel of apples", p: "bushels of apples", firm: "orchard", k: [1, 2], t: [1, 10] },
    { s: "bale of hay", p: "bales of hay", firm: "hay farm", k: [1], t: [10] },
    { s: "flat of strawberries", p: "flats of strawberries", firm: "berry farm", k: [1, 2], t: [1, 10] },
    { s: "sack of potatoes", p: "sacks of potatoes", firm: "potato farm", k: [1, 2], t: [1, 10] },
    { s: "cord of firewood", p: "cords of firewood", firm: "woodlot", k: [5], t: [1] },
    { s: "ton of gravel", p: "tons of gravel", firm: "gravel pit", k: [2], t: [10] },
    { s: "gallon of maple syrup", p: "gallons of maple syrup", firm: "sugarhouse", k: [2, 5], t: [1, 10] },
    { s: "pound of shrimp", p: "pounds of shrimp", firm: "shrimp boat", k: [1], t: [10] },
    { s: "case of lettuce", p: "cases of lettuce", firm: "farm", k: [1, 2], t: [1, 10] },
    { s: "bushel of peaches", p: "bushels of peaches", firm: "orchard", k: [1, 2], t: [1, 10] },
    { s: "bale of cotton", p: "bales of cotton", firm: "cotton farm", k: [10], t: [1] },
    { s: "bushel of soybeans", p: "bushels of soybeans", firm: "soybean farm", k: [1], t: [10] },
    { s: "box of blueberries", p: "boxes of blueberries", firm: "berry farm", k: [1, 2], t: [1, 10] },
  ];
  const OWNERS = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix", "Noor", "Elena"];
  const pl = (n, g) => (n === 1 ? g.s : g.p);
  const qty = (n, g) => `${U.fmt(n)} ${pl(n, g)}`;
  /* A product, a matching seller ("Rosa's orchard") and a dollar scale. */
  function seller() {
    const g = U.pick(PRODUCTS);
    const who = U.pick(OWNERS);
    return { g, who, name: `${who}'s ${g.firm}`, k: U.pick(g.k), t: U.pick(g.t) };
  }

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
  /* Drop MC options whose plain text duplicates the right answer or an earlier option. */
  function uniqWrong(right, list) {
    const seen = new Set([U.plain(right).toLowerCase()]);
    return list.filter(o => { const k = U.plain(o.t).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  /* ============================================================
   * Discrete cost tables
   * MC falls for one or two units, then rises at an increasing rate,
   * so AVC and ATC are U-shaped. Prices are whole dollars that never
   * equal an MC value, so the profit-maximizing output is unique.
   * ============================================================ */
  function buildTable(mc, tfc) {
    const N = mc.length - 1;
    const tvc = [0], tc = [tfc], avc = [null], atc = [null];
    for (let q = 1; q <= N; q++) {
      tvc.push(tvc[q - 1] + mc[q]);
      tc.push(tfc + tvc[q]);
      avc.push(tvc[q] / q);
      atc.push(tc[q] / q);
    }
    const argmin = arr => { let b = 1; for (let q = 2; q <= N; q++) if (arr[q] < arr[b]) b = q; return b; };
    const qAVC = argmin(avc), qATC = argmin(atc);
    return { N, mc, tfc, tvc, tc, avc, atc, qAVC, qATC, minAVC: avc[qAVC], minATC: atc[qATC] };
  }
  function uShaped(arr, N, qMin) {
    for (let q = 2; q <= N; q++) {
      const d = arr[q] - arr[q - 1];
      if (Math.abs(d) < 0.02) return false;               // no flat spots or ties
      if (q <= qMin && d > 0) return false;
      if (q > qMin && d < 0) return false;
    }
    return true;
  }
  /* Best whole-number output (0 = shut down) by brute force; null if tied. */
  function bestQ(T, P) {
    const prof = T.tc.map((c, q) => P * q - c);
    let b = 0;
    for (let q = 1; q <= T.N; q++) if (prof[q] > prof[b]) b = q;
    for (let q = 0; q <= T.N; q++) if (q !== b && Math.abs(prof[q] - prof[b]) < 1e-9) return null;
    return { q: b, profit: prof[b], prof };
  }
  /* Largest q whose MC is below P (what the MR = MC rule picks if the firm produces). */
  function mcRuleQ(T, P) { let q = 0; for (let i = 1; i <= T.N; i++) if (T.mc[i] < P) q = i; return q; }

  function baseTable() {
    for (let tries = 0; tries < 400; tries++) {
      const N = U.pick([8, 8, 9, 10]);
      const mc = [null];
      let v = U.randInt(9, 15);
      mc.push(v);
      const falls = U.randInt(1, 2);
      for (let i = 0; i < falls; i++) { v -= U.randInt(1, 3); mc.push(v); }
      let inc = U.randInt(1, 2);
      while (mc.length <= N) { v += inc; mc.push(v); inc += U.randInt(0, 2); }
      if (Math.min(...mc.slice(1)) < 3) continue;
      const tfc = U.randInt(4, 12) * 5;
      const T = buildTable(mc, tfc);
      if (!uShaped(T.avc, N, T.qAVC) || !uShaped(T.atc, N, T.qATC)) continue;
      if (T.qAVC < 2 || T.qATC > N - 2 || T.minATC - T.minAVC < 3) continue;
      return T;
    }
    throw new Error("baseTable: no table");
  }
  /* Whole-dollar prices that put the firm in each case. */
  function priceOptions(T, kase) {
    let lo, hi;
    if (kase === "profit") { lo = Math.ceil(T.minATC + 1); hi = T.mc[T.N] - 1; }
    else if (kase === "loss") { lo = Math.ceil(T.minAVC + 0.5); hi = Math.floor(T.minATC - 0.5); }
    else { lo = Math.max(2, Math.ceil(T.minAVC * 0.6)); hi = Math.floor(T.minAVC - 0.5); }
    const out = [];
    for (let P = lo; P <= hi; P++) {
      if (T.mc.includes(P)) continue;
      const b = bestQ(T, P);
      if (!b) continue;
      if (kase === "shut" ? b.q !== 0 : (b.q === 0 || b.q >= T.N || b.q !== mcRuleQ(T, P))) continue;
      out.push(P);
    }
    return out;
  }
  /* A complete firm: scaled cost table, a price for the requested case and the best output. */
  function firm(kase, opts) {
    const o = opts || {};
    for (let tries = 0; tries < 200; tries++) {
      const B = baseTable();
      const ps = priceOptions(B, kase);
      if (!ps.length) continue;
      const S = o.seller || seller();
      const k = o.k || S.k;
      const T = buildTable(B.mc.map(x => (x == null ? null : x * k)), B.tfc * k);
      const P = U.pick(ps) * k;
      const b = bestQ(T, P);
      return { T, P, q: b.q, profit: b.profit, kase, S, k, B };
    }
    throw new Error("firm: none");
  }
  const caseOf = (P, minATC, minAVC) => (P > minATC ? "profit" : P > minAVC ? "loss" : "shut");

  /* Cost table HTML. cols: any of "tc", "tvc", "mc", "avc", "atc". */
  function costHtml(T, cols, hideZero) {
    const head = ["Output"].concat(cols.map(c => ({ tc: "Total cost", tvc: "Total variable cost", mc: "Marginal cost", avc: "AVC", atc: "ATC" }[c])));
    const rows = [];
    for (let q = hideZero ? 1 : 0; q <= T.N; q++) {
      rows.push([q].concat(cols.map(c => {
        if (q === 0) return c === "tc" ? $(T.tc[0]) : c === "tvc" ? "$0" : "—";
        if (c === "avc" || c === "atc") return $2(T[c][q]);
        return $(T[c][q]);
      })));
    }
    return tbl(head, rows);
  }

  /* ============================================================
   * Smooth cost curves for graphs
   *   MC(q)  = a + (q − 4)²/4      (minimum at q = 4)
   *   AVC(q) = a + (q² − 12q + 48)/12  (minimum a + 1 at q = 6, where MC = AVC)
   *   ATC(q) = AVC(q) + F/q
   * Dollar values are multiplied by k, quantities by t, which keeps
   * every curve relationship intact.
   * ============================================================ */
  const mcF = (a, q) => a + (q - 4) * (q - 4) / 4;
  const avcF = (a, q) => a + (q * q - 12 * q + 48) / 12;
  const atcF = (a, F, q) => avcF(a, q) + F / q;
  function minATCof(a, F) {
    let best = { q: 1, v: Infinity };
    for (let q = 1; q <= 16; q += 0.001) { const v = atcF(a, F, q); if (v < best.v) best = { q, v }; }
    return best;
  }
  /* Ticks: every `stepV` up to max, plus the key values; plain ticks too close to a key are dropped. */
  function keyTicks(max, stepV, keys) {
    const ks = [...new Set(keys.map(v => U.round(v, 4)))];
    const gap = max * 0.08;
    const out = ks.slice();
    for (let v = stepV; v <= max + 1e-9; v += stepV) {
      const vv = U.round(v, 4);
      if (!ks.some(kk => Math.abs(kk - vv) < gap)) out.push(vv);
    }
    return out.sort((x, y) => x - y);
  }
  /* A graph scenario in base units: case, a, F, price, q*. */
  function graphCase(kase) {
    const a = U.randInt(2, 6);
    if (kase === "profit") {
      const q = U.pick([10, 12]);
      const P = mcF(a, q);
      const atc = q === 10 ? a + U.randInt(4, 6) : a + U.randInt(7, 12);   // ATC(q*) below P by at least 3
      const F = (atc - avcF(a, q)) * q;
      return { kase, a, F, P, q, atc };
    }
    if (kase === "loss") {
      const q = U.pick([8, 10]);
      const P = mcF(a, q);
      const atc = P + U.randInt(2, 4);
      const F = (atc - avcF(a, q)) * q;
      return { kase, a, F, P, q, atc };
    }
    if (kase === "even") {
      const q = U.pick([8, 10]);
      const P = mcF(a, q);
      const F = (P - avcF(a, q)) * q;                // min ATC exactly at q, equal to P
      return { kase, a, F, P, q, atc: P };
    }
    // shut: price below min AVC (= a + 1)
    const P = a - U.randInt(0, 1);
    const qb = U.pick([8, 10]);
    const F = (mcF(a, qb) - avcF(a, qb)) * qb;
    return { kase, a, F, P, q: 0, atc: null, qb };
  }
  /* Draw a firm graph. o: { a, F, k, t, P?, q?, atc?, rect?, guides?, keys?, avc?, points?, xLabel? } */
  function firmGraph(o) {
    const k = o.k || 1, t = o.t || 1;
    const xMaxB = 14;
    const peak = Math.max(o.P || 0, o.atc || 0, avcF(o.a, 0), minATCof(o.a, o.F).v);
    const yMaxB = Math.ceil((peak + 5) / 2) * 2;
    const X = q => q * t, Y = v => v * k;
    const curve = f => {
      const pts = [];
      for (let q = 0.25; q <= 13.5 + 1e-9; q += 0.25) { const v = f(q); if (v <= yMaxB) pts.push([X(q), Y(v)]); }
      return pts;
    };
    const mcPts = curve(q => mcF(o.a, q));
    const atcPts = curve(q => atcF(o.a, o.F, q));
    const avcPts = curve(q => avcF(o.a, q));
    const at = pts => Math.max(0, pts.length - 4);
    const curves = [
      { pts: mcPts, style: "main", label: "MC", labelAt: at(mcPts) },
      { pts: atcPts, style: "alt", label: "ATC", labelAt: at(atcPts) },
    ];
    if (o.avc !== false) curves.push({ pts: avcPts, style: "alt", label: "AVC", labelAt: Math.max(0, avcPts.findIndex(p => p[0] >= X(11))) });
    const keys = (o.keys || []).slice();
    if (o.P != null) {
      curves.push({ pts: [[0, Y(o.P)], [X(xMaxB), Y(o.P)]], style: "dash", label: o.pLabel || "P = MR = AR", labelAt: 0 });
      keys.push(Y(o.P));
    }
    const points = [];
    if (o.rect && o.q && o.atc != null) {
      curves.push({ pts: [[0, Y(o.P)], [X(o.q), Y(o.P)], [X(o.q), Y(o.atc)], [0, Y(o.atc)], [0, Y(o.P)]], style: "faint" });
      keys.push(Y(o.atc));
    }
    if (o.guides && o.q) {
      curves.push({ pts: [[X(o.q), 0], [X(o.q), Y(Math.max(o.P, o.atc || 0))]], style: "faint" });
      if (o.atc != null) { curves.push({ pts: [[0, Y(o.atc)], [X(o.q), Y(o.atc)]], style: "faint" }); keys.push(Y(o.atc)); }
      points.push({ x: X(o.q), y: Y(o.P), label: o.ptLabel || "" });
    }
    for (const pt of (o.points || [])) points.push(pt);
    const xTicks = [2, 4, 6, 8, 10, 12].map(X);
    return G.plot({
      xLabel: o.xLabel || "Output per day", yLabel: o.yLabel || "Price and cost per unit ($)",
      xMax: X(xMaxB), yMax: Y(yMaxB), xTicks, yTicks: keyTicks(Y(yMaxB), Y(yMaxB > 20 ? 4 : 2), keys),
      curves, points, aria: o.aria || "competitive firm's cost curves",
    });
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  /* The berry farm used through the lessons: TFC $40, MC of units 1–8. */
  const LT = buildTable([null, 14, 10, 8, 9, 12, 16, 21, 27], 40);
  const lessonRows = P => {
    const rows = [];
    for (let q = 0; q <= LT.N; q++) rows.push([q, $(P * q), $(LT.tc[q]), q ? $(LT.mc[q]) : "—", $(P * q - LT.tc[q])]);
    return tbl(["Flats", "TR (P = " + $(P) + ")", "TC", "MC", "Profit"], rows);
  };
  const notes = [
    {
      title: "What makes a market perfectly competitive",
      lo: "Define and explain the characteristics of perfect competition and why the competitive firm is a price taker.",
      html: `<p><b>Perfect competition</b> is a market structure in which no single buyer or seller can move the market price. Four conditions produce it:</p>
<ul>
  <li><b>Many buyers and many sellers</b>, each one tiny relative to the whole market.</li>
  <li><b>A homogeneous (identical) product.</b> Buyers cannot tell one seller's output from another's, so they care only about price. Nobody asks which farm a sack of potatoes came from.</li>
  <li><b>No barriers to entry or exit.</b> Anyone can start producing, and anyone can leave, without legal or technical obstacles.</li>
  <li><b>Equal access to information.</b> Buyers and sellers all know the going price and the technology.</li>
</ul>
<p>Put these together and each firm is a <b>price taker</b>: it accepts the market price as given. Market supply and demand set the price; the single firm only picks how much to sell at it.</p>
${G.plot({ xLabel: "Market quantity (thousands of sacks)", yLabel: "Price per sack ($)", xMax: 100, yMax: 30, xTicks: [20, 40, 60, 80, 100], yTicks: [6, 12, 18, 24, 30],
    curves: [{ pts: [[10, 28], [90, 8]], style: "main", label: "D", labelAt: 1 }, { pts: [[10, 6], [90, 26]], style: "alt", label: "S", labelAt: 1 },
      { pts: [[0, 17], [50, 17]], style: "faint" }], points: [{ x: 50, y: 17, label: "Market sets P = $17" }], aria: "market supply and demand set the price" })}
${G.plot({ xLabel: "One farm's quantity (sacks per day)", yLabel: "Price per sack ($)", xMax: 100, yMax: 30, xTicks: [20, 40, 60, 80, 100], yTicks: [6, 12, 17, 24, 30],
    curves: [{ pts: [[0, 17], [100, 17]], style: "main", label: "d = MR = AR = P", labelAt: 0 }], aria: "the farm's demand curve is horizontal at the market price" })}
<p>Why is the firm's demand curve <b>horizontal</b> (perfectly elastic) at the market price? Because every other seller offers a perfect substitute:</p>
<ul>
  <li>Charge even a few cents <b>more</b> than the market price and buyers go elsewhere: sales drop to zero.</li>
  <li>There is no reason to charge <b>less</b>: the firm can already sell all it can produce at the market price.</li>
  <li>The firm is so small that doubling or halving its own output does not move the market price.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Many sellers + identical product + free entry and exit + full information ⇒ each firm is a price taker facing a perfectly elastic (horizontal) demand curve at the market price.</div>
<div class="example"><b>Example.</b> Potato growers across a region sell into a market where supply and demand settle at $17 a sack. Noor's farm grows 60 sacks a day out of about 50,000 sold. If she asks $18, wholesalers simply buy identical potatoes from someone else at $17. If she asks $16, she throws away $1 a sack, since she could have sold every sack at $17 anyway. Whether she grows 40 or 80 sacks, the market price stays at $17.</div>
<div class="trap"><b>Common trap.</b> The <em>market</em> demand curve still slopes downward; only the demand facing <em>one firm</em> is horizontal. Also, "price taker" does not mean the price never changes. It changes whenever market supply or demand shifts; the single firm just cannot change it on its own.</div>`,
      gens: ["b251-m10-chars"],
    },
    {
      title: "The profit-maximizing rate of output",
      lo: "Determine the profit-maximizing output with MR = MC (or the largest TR − TC) and calculate total revenue for the competitive firm.",
      html: `<p>The firm's goal is the output that makes <b>economic profit = total revenue − total cost</b> as large as possible. The market sets P; the firm chooses Q.</p>
<ul>
  <li><b>Total revenue</b> TR = P × Q.</li>
  <li><b>Marginal revenue</b> MR = ΔTR ÷ ΔQ, the extra revenue from one more unit. For a price taker every unit sells for the same P, so <b>MR = P</b>.</li>
  <li><b>Average revenue</b> AR = TR ÷ Q, which is also P. So for the competitive firm <b>P = MR = AR</b>, and that horizontal line is its demand curve.</li>
  <li><b>Total cost</b> TC includes explicit <em>and</em> implicit costs (such as a normal return on the owner's time and money). <b>Marginal cost</b> MC = ΔTC ÷ ΔQ.</li>
</ul>
<p>There are two equivalent ways to find the best output:</p>
<ol>
  <li><b>Totals:</b> compute TR − TC at every output and pick the largest.</li>
  <li><b>Margins:</b> keep producing as long as the next unit adds more to revenue than to cost (MR &gt; MC), and stop where <b>MR = MC</b>. For a price taker that is where <b>P = MC</b>. In a table with whole units, produce every unit whose MC is below the price, and stop before the first unit whose MC is above it.</li>
</ol>
<p>A berry farm has fixed costs of $40 a day and faces a market price of $22 a flat:</p>
${lessonRows(22)}
<div class="example"><b>Example.</b> The 7th flat costs $21 to grow and sells for $22, so it adds $1 to profit. The 8th would cost $27 and bring in only $22, cutting profit by $5. So the farm grows <b>7 flats</b>. Check with totals: TR = $22 × 7 = $154, TC = $130, profit = <b>$24</b>, the largest number in the profit column. Note that ATC is lowest at 6 flats (about $18.17), yet 7 flats earns more total profit.</div>
<div class="keyidea"><b>Key idea.</b> Profit is maximized where MR = MC. Because the competitive firm's MR equals the price, its rule is simply <b>produce where P = MC</b> (on the rising part of MC).</div>
<div class="trap"><b>Common trap.</b> The best output is <em>not</em> where ATC is lowest, and not where profit per unit (P − ATC) is largest. As long as the next unit's MC is below P, producing it adds to <em>total</em> profit, even if it nudges average cost up.</div>`,
      gens: ["b251-m10-profitmax", "b251-m10-profit"],
    },
    {
      title: "Measuring economic profit: (P − ATC) × Q",
      lo: "Calculate total revenue, total cost and economic profit at the profit-maximizing output.",
      html: `<p>Once you know the best output Q*, profit follows from per-unit figures:</p>
<ul>
  <li>TR = P × Q*</li>
  <li>TC = ATC × Q* (ATC read at Q*)</li>
  <li><b>Economic profit = TR − TC = (P − ATC) × Q*</b></li>
</ul>
<p>On a graph, profit is a <b>rectangle</b>: its width is Q*, and its height is the gap between the price line and ATC at Q*. If ATC is above the price, the same rectangle measures a <b>loss</b>.</p>
${firmGraph({ a: 4, F: 36.667, P: 13, q: 10, atc: 10, rect: true, guides: true, xLabel: "Crates per day", aria: "profit rectangle between price 13 and ATC 10 at 10 crates" })}
<div class="example"><b>Example.</b> In the graph a tomato farm faces P = $13. MC crosses the price line at 10 crates, so Q* = 10. ATC at 10 crates is $10. Profit = ($13 − $10) × 10 = <b>$30</b> a day: TR = $130 and TC = $100. If the owner's accountant ignores the $25 a day she could earn working elsewhere (an implicit cost), the books would show $55 of "accounting profit", but the economic profit counts that cost and is $30.</div>
<div class="keyidea"><b>Key idea.</b> Profit per unit is P − ATC, measured at the profit-maximizing output; total profit is that times Q*. Economic profit uses <em>all</em> opportunity costs, explicit and implicit.</div>
<div class="trap"><b>Common trap.</b> Use <b>ATC</b>, not AVC, to measure profit: (P − AVC) × Q leaves out fixed cost. And read ATC at Q*, not at the bottom of the ATC curve.</div>`,
      gens: ["b251-m10-profit", "b251-m10-graphs"],
    },
    {
      title: "Three short-run outcomes: profit, loss, or shut down",
      lo: "Identify the three short-run outcomes and explain the shutdown point and the break-even point.",
      html: `<p>In the short run the firm has fixed costs it must pay whether or not it produces. At its MR = MC output, compare the price with average costs:</p>
<table class="data-tbl"><thead><tr><th>Case</th><th>Price compared with costs</th><th>What the firm does</th></tr></thead><tbody>
<tr><td>1 · Economic profit</td><td>P &gt; ATC</td><td>Produce where P = MC; profit = (P − ATC) × Q</td></tr>
<tr><td>2 · Loss, keep producing</td><td>AVC &lt; P &lt; ATC</td><td>Produce where P = MC; the loss is smaller than fixed cost</td></tr>
<tr><td>3 · Shut down</td><td>P &lt; AVC (below min AVC)</td><td>Produce nothing; the loss equals total fixed cost</td></tr>
</tbody></table>
<p>Why produce at a loss? If the firm shuts down it still pays its fixed costs, so its loss is <b>TFC</b>. If it produces and the price is above AVC, each unit covers its own variable cost <em>and</em> something extra that chips away at the fixed cost, so the loss is <em>less</em> than TFC. Once the price falls below AVC, every unit adds more to cost than to revenue, and closing is better.</p>
${firmGraph({ a: 4, F: 37.333, P: 8, q: 8, atc: 10, rect: true, guides: true, xLabel: "Crates per day", aria: "loss rectangle: price 8 below ATC 10 at 8 crates, but above AVC" })}
<p>Two prices mark the boundaries:</p>
<ul>
  <li><b>Break-even price = minimum ATC.</b> At this price TR = TC and economic profit is zero: the firm earns just a normal return on its investment.</li>
  <li><b>Shutdown price = minimum AVC.</b> The lowest price that still covers variable cost. The shutdown point is where MC crosses AVC; below it, the firm produces zero.</li>
</ul>
<div class="example"><b>Example.</b> The tomato farm in the graph faces P = $8. MC = $8 at 8 crates, where ATC = $10 and AVC ≈ $5.33. It loses ($10 − $8) × 8 = <b>$16</b> a day. Its fixed cost is about $37 a day, so shutting down would lose $37. Producing is the smaller loss. If the price fell to $4, below the $5 minimum of AVC, the farm should close and lose just its fixed cost.<br><br>
For the berry farm in the table (TFC $40), at P = $15 it grows 5 flats and loses $18 (better than $40); at P = $9, below its minimum AVC of $10.25, every output loses more than $40, so it shuts down.</div>
<div class="keyidea"><b>Key idea.</b> P &gt; min ATC → profit. Min AVC &lt; P &lt; min ATC → loss, but keep producing. P &lt; min AVC → shut down (Q = 0, loss = TFC).</div>
<div class="trap"><b>Common trap.</b> A loss is not a reason to shut down. Compare P with <b>AVC</b>, not ATC. Fixed costs are sunk in the short run, so they do not affect the produce-or-shut decision.</div>`,
      gens: ["b251-m10-shortrun", "b251-m10-graphs"],
    },
    {
      title: "The firm's short-run supply curve and market supply",
      lo: "Construct the firm's short-run supply curve from its MC curve and add firms' supply to get market supply.",
      html: `<p>A supply curve shows how much a seller offers at each price. For a competitive firm the answer comes straight from P = MC: at each price, it produces the quantity where that price meets MC, as long as the price is at least minimum AVC. Below that, it supplies zero.</p>
<p>So the <b>firm's short-run supply curve is its marginal cost curve at and above minimum AVC</b> (the shutdown point). Below the shutdown point the supply curve is the vertical axis: quantity zero.</p>
${firmGraph({ a: 4, F: 66.667, avc: true, keys: [5], xLabel: "Crates per day", points: [{ x: 6, y: 5, label: "shutdown point" }], aria: "the MC curve above minimum AVC is the firm's supply curve" })}
<div class="example"><b>Example.</b> For the berry farm in the earlier table (MC of flats 1–8: $14, $10, $8, $9, $12, $16, $21, $27; minimum AVC ≈ $10.25), the supply schedule is: at $9, 0 flats (shut down); at $11, 4; at $13, 5; at $17, 6; at $22, 7; at $30, 8. Now suppose 400 identical berry farms sell in the market. At $17 the market quantity supplied is 400 × 6 = <b>2,400 flats</b>.</div>
<p>The <b>market (industry) supply curve</b> is the horizontal sum of the firms' supply curves: at each price, add up what every firm offers. It shifts with the usual supply factors: input (factor) prices, productivity and technology, taxes and subsidies, and the <b>number of firms</b>. A change in the good's own price is a movement along it.</p>
<div class="keyidea"><b>Key idea.</b> Firm supply = MC above min AVC. Market supply = the sum of all firms' quantities at each price. Market supply and market demand then set the price each firm takes.</div>
<div class="trap"><b>Common trap.</b> The supply curve does not start at minimum <em>ATC</em>. Between min AVC and min ATC the firm is losing money but still produces, so those points are on its supply curve too.</div>`,
      gens: ["b251-m10-supply"],
    },
    {
      title: "Entry, exit and long-run equilibrium",
      lo: "Explain why firms enter and exit in the long run and describe long-run equilibrium for the competitive firm.",
      html: `<p>In the long run every cost is variable: firms can change plant size, new firms can enter, and existing firms can leave. Profits and losses are the signals that move resources:</p>
<ul>
  <li><b>Economic profit (P &gt; ATC)</b> attracts entry. Market supply shifts right, the market price falls, and profits shrink until P = minimum ATC.</li>
  <li><b>Economic loss (P &lt; ATC)</b> drives exit. Market supply shifts left, the price rises, and losses shrink until P = minimum ATC.</li>
  <li>At <b>P = minimum ATC</b> economic profit is zero, firms earn a normal return, and no one wants to enter or leave. That is <b>long-run equilibrium</b>.</li>
</ul>
${firmGraph({ a: 4, F: 21.333, P: 8, q: 8, atc: 8, guides: true, avc: false, pLabel: "P = MR = min ATC", ptLabel: "LR equilibrium", xLabel: "Crates per day", aria: "long-run equilibrium: the price line just touches the bottom of ATC" })}
<p>In long-run equilibrium, P = MR = MC = minimum ATC: the price line just touches the bottom of the ATC curve.</p>
<div class="example"><b>Example.</b> Shrimp boats start in long-run equilibrium at $9 a pound, the minimum of each boat's ATC. A health report boosts demand and the market price jumps to $12. Each boat raises its catch along its MC curve and earns an economic profit. New boats join the fleet; market supply shifts right and the price slides back. If input prices are unaffected (a constant-cost industry), entry continues until the price is $9 again. The market ends up with more boats and more shrimp, but each boat earns zero economic profit.</div>
<p>The <b>long-run industry supply curve</b> shows the quantity supplied at each price after entry and exit are complete. In a <b>constant-cost</b> industry it is horizontal (input prices do not change as the industry grows). In an <b>increasing-cost</b> industry it slopes upward (expansion bids up input prices: external diseconomies). In a <b>decreasing-cost</b> industry it slopes downward (expansion lowers input costs: external economies).</p>
<div class="keyidea"><b>Key idea.</b> Free entry and exit push the price to minimum ATC, so in the long run a competitive firm earns <b>zero economic profit</b>, a normal rate of return.</div>
<div class="trap"><b>Common trap.</b> Zero economic profit does not mean the owners earn nothing. Economic cost already includes a normal return on their time and capital, so they earn exactly what they could get in their next-best use. That is why they stay.</div>`,
      gens: ["b251-m10-longrun", "b251-m10-graphs"],
    },
    {
      title: "Perfect competition and efficiency",
      lo: "Relate perfect competition to allocative and productive efficiency.",
      html: `<p>Resources are used <b>efficiently</b> when no one can be made better off without making someone else worse off. In a market that means producing the quantity where <b>marginal social benefit (MSB) = marginal social cost (MSC)</b>.</p>
<ul>
  <li>With no external benefits, the <b>market demand curve is the MSB curve</b>: buyers are on their demand curves, getting the most value from their budgets.</li>
  <li>With no external costs, the <b>market supply curve is the MSC curve</b>: each competitive firm supplies along its MC curve.</li>
  <li>So the competitive equilibrium quantity, where demand meets supply, is the efficient quantity, and <b>total surplus (consumer surplus + producer surplus) is as large as possible</b>.</li>
</ul>
${G.plot({ xLabel: "Bushels (thousands per week)", yLabel: "Price per bushel ($)", xMax: 60, yMax: 24, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [4, 8, 12, 16, 20, 24],
    curves: [{ pts: [[0, 20], [50, 0]], style: "main", label: "D = MSB", labelAt: 0 }, { pts: [[0, 4], [50, 24]], style: "alt", label: "S = MSC", labelAt: 0 },
      { pts: [[0, 12], [20, 12], [20, 0]], style: "faint" }], points: [{ x: 20, y: 12, label: "efficient" }], aria: "competitive equilibrium where MSB = MSC" })}
<p>Two kinds of efficiency describe the competitive firm:</p>
<ul>
  <li><b>Allocative efficiency: P = MC.</b> The price measures what buyers value the last unit at; MC measures what it costs society to make. Competitive firms produce where P = MC, so the right quantity is made.</li>
  <li><b>Productive efficiency: P = minimum ATC</b> (in the long run). Output is produced at the lowest possible cost per unit. Entry and exit drive the competitive price to the bottom of ATC.</li>
</ul>
<div class="example"><b>Example.</b> In the graph, demand (MSB) is P = 20 − 0.4Q and supply (MSC) is P = 4 + 0.4Q (Q in thousands). They meet at Q = 20 thousand bushels and P = $12. Consumer surplus = ½ × 20 × ($20 − $12) = $80 thousand; producer surplus = ½ × 20 × ($12 − $4) = $80 thousand; total surplus = <b>$160 thousand</b>. At 15 thousand bushels the MSB of the last bushel ($14) exceeds its MSC ($10), so more should be produced; at 25 thousand, MSC ($14) exceeds MSB ($10), so less.</div>
<div class="keyidea"><b>Key idea.</b> In long-run equilibrium a competitive firm has P = MC (allocative efficiency) and P = min ATC (productive efficiency) at the same time.</div>
<div class="trap"><b>Common trap.</b> Don't swap the two. "Lowest cost per unit" is <em>productive</em> efficiency (min ATC); "the right amount, valued by buyers at its marginal cost" is <em>allocative</em> efficiency (P = MC). In the short run a firm earning a profit is allocatively efficient (P = MC) but usually not producing at minimum ATC.</div>`,
      gens: ["b251-m10-efficiency"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m10-c-pc", tag: "Definition", front: "What is <em>perfect competition</em>?", back: "A market structure in which the decisions of individual buyers and sellers have <b>no effect on the market price</b>." },
    { id: "b251-m10-c-chars", tag: "Definition", front: "List the four characteristics of perfect competition.", back: "1) <b>Many buyers and sellers</b>; 2) a <b>homogeneous</b> (identical) product; 3) <b>no barriers to entry or exit</b>; 4) <b>equal access to information</b>." },
    { id: "b251-m10-c-taker", tag: "Definition", front: "What is a <em>price taker</em>?", back: "A firm that must accept the market price as given because it cannot influence it. It can sell all it wants at that price, but nothing at a higher one." },
    { id: "b251-m10-c-raise", tag: "Why", front: "What happens if one wheat farm charges a little more than the market price?", back: "It sells <b>nothing</b>: buyers switch to identical wheat from other farms at the market price." },
    { id: "b251-m10-c-cut", tag: "Why", front: "Why won't a competitive firm charge less than the market price?", back: "It can already sell all it wants at the market price, so a lower price would just throw away revenue." },
    { id: "b251-m10-c-demand", tag: "Principle", front: "What does the demand curve facing a single competitive firm look like?", back: "<b>Horizontal (perfectly elastic)</b> at the market price, because each firm's output is a perfect substitute for every other firm's. (Market demand still slopes down.)" },
    { id: "b251-m10-c-pmrar", tag: "Formula", front: "Why is P = MR = AR for a competitive firm?", back: "Every unit sells at the same market price, so each extra unit adds P to revenue (MR = P), and revenue per unit is P (AR = TR ÷ Q = P)." },
    { id: "b251-m10-c-tr", tag: "Formula", front: "Total revenue, marginal revenue and economic profit", back: "TR = P × Q. MR = ΔTR ÷ ΔQ. Economic profit = TR − TC, where TC includes explicit and implicit costs." },
    { id: "b251-m10-c-mrmc", tag: "Principle", front: "What is the profit-maximizing rule for output?", back: "Produce where <b>MR = MC</b>. For a price taker, MR = P, so produce where <b>P = MC</b> (the output where TR − TC is largest)." },
    { id: "b251-m10-c-table-rule", tag: "Principle", front: "With a table of whole units, how do you apply MR = MC?", back: "Produce every unit whose MC is <b>below</b> the price, and stop before the first unit whose MC is <b>above</b> it." },
    { id: "b251-m10-c-mc-next", tag: "Why", front: "At the current output, the next unit's MC is less than the price. What should the firm do?", back: "Produce more: the next unit adds P to revenue but less than P to cost, so profit rises." },
    { id: "b251-m10-c-not-minatc", tag: "Why", front: "Does a competitive firm maximize profit where ATC is lowest?", back: "<b>No</b> (except in long-run equilibrium). It maximizes <em>total</em> profit where P = MC. If P is above min ATC, extra units with MC &lt; P still add profit even though ATC rises." },
    { id: "b251-m10-c-profit-formula", tag: "Formula", front: "Economic profit using per-unit figures", back: "Profit = (P − ATC) × Q, with ATC measured at the profit-maximizing output. On a graph it is the rectangle between the price line and ATC, Q wide." },
    { id: "b251-m10-c-avc-trap", tag: "Distinction", front: "Why is (P − AVC) × Q not the firm's profit?", back: "It ignores fixed cost. (P − AVC) × Q is what output contributes toward fixed cost; profit subtracts all costs: (P − ATC) × Q." },
    { id: "b251-m10-c-econprofit", tag: "Distinction", front: "Economic profit vs accounting profit", back: "Accounting profit = TR − explicit costs. Economic profit = TR − explicit − <b>implicit</b> costs (the owner's forgone wages and normal return on capital)." },
    { id: "b251-m10-c-three", tag: "Principle", front: "The three short-run outcomes for a competitive firm", back: "1) <b>P &gt; ATC</b>: economic profit. 2) <b>AVC &lt; P &lt; ATC</b>: loss, but keep producing. 3) <b>P &lt; AVC</b>: shut down (Q = 0)." },
    { id: "b251-m10-c-produce-loss", tag: "Why", front: "Why keep producing at a loss when AVC &lt; P &lt; ATC?", back: "Revenue covers all variable cost plus part of the fixed cost, so the loss is <b>smaller than TFC</b>, which is what the firm would lose by shutting down." },
    { id: "b251-m10-c-shutloss", tag: "Formula", front: "If a firm shuts down in the short run, how big is its loss?", back: "Its <b>total fixed cost</b>. With no output, TR = 0 and TVC = 0, but fixed costs still must be paid." },
    { id: "b251-m10-c-shutprice", tag: "Definition", front: "Short-run shutdown price", back: "The price that just covers average variable cost: <b>minimum AVC</b>, where MC crosses AVC. Below it, the firm produces nothing." },
    { id: "b251-m10-c-breakeven", tag: "Definition", front: "Short-run break-even price", back: "The price at which TR = TC: <b>minimum ATC</b>, where MC crosses ATC. The firm earns zero economic profit (a normal return)." },
    { id: "b251-m10-c-fixed-irrelevant", tag: "Why", front: "Rent on a firm's building rises. Does that change its short-run output or shutdown decision?", back: "<b>No.</b> Fixed cost does not change MC or AVC, so Q* and the shutdown price stay the same; profit just falls by the increase." },
    { id: "b251-m10-c-supply", tag: "Principle", front: "What is the competitive firm's short-run supply curve?", back: "Its <b>marginal cost curve at and above minimum AVC</b> (the shutdown point). Below min AVC, quantity supplied is zero." },
    { id: "b251-m10-c-mktsupply", tag: "Definition", front: "How is the industry (market) supply curve built?", back: "By adding up the quantities all firms supply at each price (the sum of their MC curves above min AVC)." },
    { id: "b251-m10-c-shifters", tag: "Principle", front: "What shifts the industry supply curve?", back: "Factor (input) costs, productivity/technology, taxes and subsidies, and the <b>number of firms</b>. A change in the good's own price is a movement along it." },
    { id: "b251-m10-c-entry", tag: "Principle", front: "What happens in the long run when competitive firms earn economic profits?", back: "Firms <b>enter</b>, market supply shifts right, price falls, and profits shrink until P = minimum ATC (zero economic profit)." },
    { id: "b251-m10-c-exit", tag: "Principle", front: "What happens in the long run when competitive firms suffer economic losses?", back: "Firms <b>exit</b>, market supply shifts left, price rises, and losses shrink until P = minimum ATC." },
    { id: "b251-m10-c-lreq", tag: "Definition", front: "Long-run equilibrium for a competitive firm", back: "<b>P = MR = MC = minimum ATC</b>. Economic profit is zero, so no firm wants to enter or exit." },
    { id: "b251-m10-c-zero", tag: "Why", front: "Why do firms stay in an industry earning zero economic profit?", back: "Zero economic profit means a <b>normal rate of return</b>: TR covers all opportunity costs, so the owners earn as much as in their next-best use." },
    { id: "b251-m10-c-lrsupply", tag: "Distinction", front: "Constant-, increasing- and decreasing-cost industries: shape of long-run industry supply?", back: "Constant cost → <b>horizontal</b>. Increasing cost (external diseconomies: input prices rise as the industry grows) → <b>upward-sloping</b>. Decreasing cost (external economies) → <b>downward-sloping</b>." },
    { id: "b251-m10-c-efficient", tag: "Definition", front: "When are resources used efficiently?", back: "When no one can be made better off without making someone else worse off, which happens where <b>marginal social benefit = marginal social cost</b>." },
    { id: "b251-m10-c-allocative", tag: "Definition", front: "Allocative efficiency for a competitive firm", back: "<b>P = MC</b>: the value buyers place on the last unit equals the cost of producing it, so the right quantity is produced." },
    { id: "b251-m10-c-productive", tag: "Definition", front: "Productive efficiency for a competitive firm", back: "<b>P = minimum ATC</b>: output is produced at the lowest possible cost per unit. Competitive firms reach it in long-run equilibrium." },
    { id: "b251-m10-c-surplus", tag: "Principle", front: "Why does a competitive market maximize total surplus (no externalities)?", back: "Demand = MSB and supply = MSC, so the equilibrium quantity is where MSB = MSC. Consumer surplus + producer surplus is as large as possible there." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“identical product”, “thousands of growers”, “commodity”, “anyone can start”", think: "Perfect competition", why: "Many sellers of a homogeneous product with free entry: each firm is a price taker." },
    { when: "“brand”, “advertising”, “patent”, “licence limits”, “only a few firms”", think: "NOT perfect competition", why: "Differentiated products or barriers to entry give firms some control over price." },
    { when: "“raises its price above the market price”", think: "Sells nothing", why: "The firm's demand is perfectly elastic: buyers switch to identical output." },
    { when: "“how many units should it produce?” with a price and an MC column", think: "Produce while MC &lt; P; stop at MR = MC", why: "Each unit with MC below P adds to profit." },
    { when: "“profit per unit”, “profit rectangle”", think: "(P − ATC) × Q*", why: "Use ATC at the profit-maximizing output, not AVC." },
    { when: "“implicit cost”, “could have earned elsewhere”", think: "Economic profit = TR − explicit − implicit", why: "Economic cost includes opportunity costs." },
    { when: "P above min ATC", think: "Economic profit (case 1)", why: "Revenue per unit exceeds cost per unit at Q*." },
    { when: "P between min AVC and min ATC", think: "Loss, but keep producing (case 2)", why: "Revenue covers variable cost and part of fixed cost." },
    { when: "P below min AVC", think: "Shut down (case 3): Q = 0, loss = TFC", why: "Each unit adds more to cost than to revenue." },
    { when: "“shutdown price”, “lowest price at which it will produce”", think: "Minimum AVC", why: "The shutdown point is where MC crosses AVC." },
    { when: "“break-even price”, “normal return”", think: "Minimum ATC", why: "At that price TR = TC and economic profit is zero." },
    { when: "“rent / insurance / fixed cost rises” in the short run", think: "Q* unchanged; profit falls", why: "Fixed cost does not affect MC or AVC." },
    { when: "“firm's short-run supply curve”", think: "MC curve above min AVC", why: "The firm supplies where P = MC whenever P ≥ min AVC." },
    { when: "“firms are earning economic profit… in the long run”", think: "Entry → supply right → P falls to min ATC", why: "Profit is a signal for resources to move in." },
    { when: "“firms are losing money… in the long run”", think: "Exit → supply left → P rises to min ATC", why: "Losses signal resources to move out." },
    { when: "“P = MC” vs “P = min ATC”", think: "Allocative vs productive efficiency", why: "Right quantity vs lowest cost per unit; both hold in long-run equilibrium." },
  ];

  /* ============================================================
   * PRACTICE 1 — Characteristics of perfect competition
   * ============================================================ */
  const PC_MARKETS = [
    { t: "Thousands of farms growing the same grade of winter wheat, sold on an exchange where every buyer sees the price" },
    { t: "Hundreds of small boats landing the same species of shrimp at a dockside auction open to any fisher" },
    { t: "Many growers selling standard Grade A eggs to wholesalers, with anyone free to start a flock" },
    { t: "Countless soybean farmers whose beans all meet the same official grade" },
    { t: "Many dairy farms selling raw milk of an identical standard grade to processors" },
    { t: "Thousands of orchards selling the same variety of apples by the bushel, with prices posted daily" },
    { t: "Many small sawmills selling standard-grade construction lumber that buyers treat as interchangeable" },
    { t: "Hundreds of potato growers selling identical russet potatoes to a regional produce market" },
  ];
  const NOT_PC_MARKETS = [
    { t: "The only company licensed to supply electricity to a city", why: "One seller protected by a legal barrier is a monopoly, not perfect competition." },
    { t: "Three airlines that operate almost all flights out of a regional airport", why: "Only a few sellers: each one's choices affect the price." },
    { t: "Sneaker companies that each advertise a distinctive look and logo", why: "The products are differentiated by brand, so they are not identical." },
    { t: "Coffee shops near campus, each with its own menu and atmosphere", why: "Differentiated products give each shop some control over its price." },
    { t: "A drug sold by the one company that holds its patent", why: "A patent is a barrier to entry, so the seller is not a price taker." },
    { t: "Taxi service in a city that caps the number of medallions at 300", why: "The cap is a barrier to entry." },
    { t: "The handful of companies that build nearly all commercial jet engines", why: "Few sellers and huge barriers to entry." },
    { t: "Restaurants in a downtown district, each with a different cuisine", why: "The products are differentiated, not identical." },
    { t: "Two cable providers that serve an entire county", why: "Two sellers can influence price; this is far from many small firms." },
  ];
  const CHAR_TRUE = [
    { t: "There are many buyers and many sellers, each small relative to the market", why: "Many small participants is a defining feature." },
    { t: "Every firm sells an identical (homogeneous) product", why: "Identical products are a defining feature." },
    { t: "Firms can enter or leave the industry freely", why: "No barriers to entry or exit is a defining feature." },
    { t: "Buyers and sellers have equal access to information about prices and products", why: "Equal access to information is a defining feature." },
    { t: "Each firm takes the market price as given", why: "Being a price taker follows from the other characteristics." },
    { t: "Each firm's output is a perfect substitute for every other firm's output", why: "Identical products make each firm's output a perfect substitute." },
  ];
  const CHAR_FALSE = [
    { t: "Firms sell brand-name products that buyers see as different", why: "Differentiated products belong to other market structures; competitive products are identical." },
    { t: "A few large firms produce most of the industry's output", why: "That describes an oligopoly. Perfect competition has many small firms." },
    { t: "Government licences limit how many firms may operate", why: "A licence limit is a barrier to entry." },
    { t: "Each firm chooses the price it wants to charge", why: "Competitive firms are price takers; the market sets the price." },
    { t: "Firms spend heavily on advertising to win customers from rivals", why: "With identical products and a market price, advertising your own brand achieves nothing." },
    { t: "Buyers do not know what other sellers are charging", why: "Perfect competition assumes equal access to information." },
    { t: "Each firm faces a downward-sloping demand curve for its own output", why: "The competitive firm's demand curve is horizontal at the market price." },
    { t: "New firms must buy a costly permit that existing firms received for free", why: "That is a barrier to entry." },
  ];

  const genChars = STUDY.makeGenerator({
    id: "b251-m10-chars",
    name: "Characteristics of perfect competition",
    blurb: "Recognise competitive markets, the four defining characteristics, and why each firm is a price taker facing a horizontal demand curve.",
    variants: [
      {
        name: "Spot the perfectly competitive market",
        make() {
          const right = U.pick(PC_MARKETS).t;
          const wrong = U.sample(NOT_PC_MARKETS, 3);
          return Q.mc({
            q: "Which market comes closest to <b>perfect competition</b>?",
            right, wrong,
            rightWhy: "Many sellers of an identical product, open entry and a price everyone can see.",
            sol: steps("Run through the checklist: many buyers and sellers, identical product, free entry and exit, equal information.",
              "A single failure (a brand, a patent, a licence cap, only a few sellers) means firms have some control over price.",
              `Only this one passes every test: <b>${right}</b>.`),
          });
        },
      },
      {
        name: "Spot the market that is NOT competitive",
        make() {
          const r = U.pick(NOT_PC_MARKETS);
          const wrong = U.sample(PC_MARKETS, 3).map(m => ({ t: m.t, why: "This one fits: many sellers of an identical product with open entry." }));
          return Q.mc({
            q: "Three of these markets are close to perfectly competitive. Which one is <b>not</b>?",
            right: r.t, wrong, rightWhy: r.why,
            sol: steps("Look for the market that breaks at least one characteristic: many sellers, identical product, free entry and exit, full information.",
              `${r.t}: ${r.why}`),
          });
        },
      },
      {
        name: "Which is NOT a characteristic?",
        make() {
          const r = U.pick(CHAR_FALSE);
          const wrong = U.sample(CHAR_TRUE, 3);
          return Q.mc({
            q: "Which of the following is <b>not</b> a characteristic of perfect competition?",
            right: r.t, wrong, rightWhy: r.why,
            sol: steps("List the four characteristics: many buyers and sellers, a homogeneous product, no barriers to entry or exit, equal access to information. Price taking follows from them.",
              `The odd one out: ${r.why}`),
          });
        },
      },
      {
        name: "Price-taker reasoning",
        make() {
          const S = seller();
          const P = U.randInt(8, 30) * S.k;
          const d = U.pick([1, 2]) * S.k;
          const raise = Math.random() < 0.6;
          if (raise) {
            return Q.mc({
              q: `The market price of ${an(S.g.s)} is ${$(P)}. ${S.name} is one of thousands of sellers of identical ${S.g.p}. If ${S.who} decides to charge ${$(P + d)} instead, what happens?`,
              right: `${S.who} sells almost nothing, because buyers can get identical ${S.g.p} elsewhere for ${$(P)}`,
              wrong: [
                { t: `${S.who} sells slightly fewer ${S.g.p} but earns more revenue on each`, why: "That would be true for a firm with a downward-sloping demand curve. A price taker's demand is perfectly elastic, so any price above the market loses every buyer." },
                { t: `The market price rises to ${$(P + d)}`, why: "One small seller cannot move the market price; it is set by market supply and demand." },
                { t: `Other sellers follow and raise their prices to ${$(P + d)}`, why: "Other sellers can already sell all they want at the market price, so they have no reason to follow." },
              ],
              sol: steps("A price taker faces a horizontal demand curve at the market price.",
                `Above ${$(P)}, buyers switch to identical output from other sellers, so quantity demanded from ${S.who} falls to (nearly) zero.`),
            });
          }
          return Q.mc({
            q: `The market price of ${an(S.g.s)} is ${$(P)}. ${S.name} is one of thousands of sellers of identical ${S.g.p}. Why would ${S.who} <b>not</b> cut the price to ${$(P - d)} to sell more?`,
            right: `Because ${S.who} can already sell as many ${S.g.p} as the ${S.g.firm} produces at ${$(P)}, so a lower price only loses revenue`,
            wrong: [
              { t: "Because cutting the price is illegal in a competitive market", why: "Nothing forbids it; it simply makes no sense for a price taker." },
              { t: `Because buyers would think the cheaper ${S.g.p} were lower quality`, why: "The product is identical and buyers have full information, so there is no quality signal." },
              { t: `Because the market price would then fall to ${$(P - d)} for every seller`, why: "One tiny seller's price has no effect on the market price." },
            ],
            sol: steps("A price taker can sell all it wants at the market price.",
              `Dropping to ${$(P - d)} would not bring extra sales it couldn't already make at ${$(P)}; it would just give away ${$(d)} on every unit.`),
          });
        },
      },
      {
        name: "Sort features: competitive or not",
        make() {
          const items = U.deal("m10-chars-true", CHAR_TRUE, 2).map(c => ({ t: c.t, cat: "Feature of perfect competition", why: c.why }))
            .concat(U.deal("m10-chars-false", CHAR_FALSE, 3).map(c => ({ t: c.t, cat: "Not a feature of perfect competition", why: c.why })));
          return Q.classify({
            q: "Classify each statement.",
            cats: ["Feature of perfect competition", "Not a feature of perfect competition"], items,
            sol: steps("Perfect competition: many buyers and sellers, identical products, no barriers to entry or exit, equal information, so every firm is a price taker.",
              "Brands, advertising, few sellers, licences or permits, price setting and downward-sloping firm demand all point to some other market structure."),
          });
        },
      },
      {
        name: "The single firm's demand curve",
        make() {
          const S = seller();
          const P = U.randInt(10, 24) * S.k;
          const Qm = U.randInt(30, 90);
          const g = G.plot({ xLabel: `Market quantity (thousands of ${S.g.p.split(" ")[0]})`, yLabel: "Price ($)", xMax: 120, yMax: P * 2, xTicks: [20, 40, 60, 80, 100, 120], yTicks: [r2(P / 2), P, r2(P * 1.5), P * 2],
            curves: [{ pts: [[Qm - 30, P * 1.75], [Qm + 30, P * 0.25]], style: "main", label: "D", labelAt: 0 }, { pts: [[Qm - 30, P * 0.25], [Qm + 30, P * 1.75]], style: "alt", label: "S", labelAt: 0 },
              { pts: [[0, P], [Qm, P]], style: "faint" }], points: [{ x: Qm, y: P, label: "E" }], aria: "market supply and demand" });
          return Q.mc({
            q: `The graph shows the whole market for ${S.g.p}, which is perfectly competitive.${g}Which best describes the demand curve facing <b>${S.name}</b>, one of the many sellers?`,
            right: `A horizontal line at ${$(P)}: perfectly elastic`,
            wrong: [
              { t: "The same downward-sloping curve as market demand", why: "Market demand slopes down, but one small seller's output cannot move the price, so its own demand is flat." },
              { t: `A vertical line at the ${S.g.firm}'s current output: perfectly inelastic`, why: "Vertical would mean buyers take the same amount at any price. In fact a price taker loses all sales above the market price." },
              { t: `A horizontal line at a price ${S.who} chooses`, why: "The level of the line is the market price set by supply and demand, not a price the seller picks." },
            ],
            sol: steps("Market supply and demand set the price (point E). Each seller takes that price as given.",
              `Each seller's output is a perfect substitute for every other seller's, so it can sell any amount at ${$(P)} and nothing above it. Its demand curve is horizontal at ${$(P)}: d = MR = AR = P.`),
          });
        },
      },
      {
        name: "Select all: characteristics",
        make() {
          const nT = U.randInt(1, 4);
          const opts = U.sample(CHAR_TRUE, nT).map(c => ({ t: c.t, ok: true, why: c.why })).concat(U.sample(CHAR_FALSE, 5 - nT).map(c => ({ t: c.t, ok: false, why: c.why })));
          return Q.multi({
            q: "Select <b>all</b> statements that describe a perfectly competitive market.",
            options: opts,
            sol: steps("Check each statement against the four characteristics: many buyers and sellers, identical product, free entry and exit, equal information.",
              "Anything that gives one firm power over price (brands, few firms, barriers, poor information) does not belong."),
          });
        },
      },
      {
        name: "Why can't one firm move the price?",
        make() {
          const S = seller();
          const share = U.pick(["one-hundredth of 1%", "less than 0.1%", "a few thousandths of 1%"]);
          return Q.mc({
            q: `${S.name} supplies ${share} of all the ${S.g.p} sold in a perfectly competitive market. ${S.who} doubles output this season. Why does the market price barely change?`,
            right: "Because its output is a tiny share of a market with many sellers of an identical product, so doubling it hardly shifts market supply",
            wrong: [
              { t: "Because the government fixes the price in competitive markets", why: "No one fixes the price; market supply and demand set it." },
              { t: `Because buyers prefer ${S.who}'s ${S.g.p} and will pay the same price for more of them`, why: "The product is identical, so buyers have no preference for one seller." },
              { t: "Because demand for the product is perfectly inelastic", why: "Market demand slopes downward; the point is that one seller's change is too small to matter." },
            ],
            sol: steps("Price is set where <em>market</em> supply meets market demand.",
              `A change of ${share} of market output barely moves market supply, so the price stays put. That is what makes each firm a price taker.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Profit-maximizing output
   * ============================================================ */
  const genProfitMax = STUDY.makeGenerator({
    id: "b251-m10-profitmax",
    name: "Profit-maximizing output",
    blurb: "Find the output where MR = MC or where TR − TC is largest, and reason about producing one more or one fewer unit.",
    variants: [
      {
        name: "Best output from the MC column (MR = MC)",
        make() {
          const F = firm(U.pick(["profit", "profit", "loss"]));
          const { T, P, q, S } = F;
          const minMCq = T.mc.indexOf(Math.min(...T.mc.slice(1)));
          return Q.num({
            q: `${S.name} sells ${S.g.p} in a perfectly competitive market at ${$(P)} each. Its marginal cost is:${costHtml(T, ["mc"], true)}How many ${S.g.p} per day maximize profit? (Assume it does not shut down.)`,
            answer: q, unit: pl(q, S.g), kind: "count",
            traps: traps(q, [
              { value: q + 1, why: `The ${ordinal(q + 1)} unit costs ${$(T.mc[q + 1])} but sells for only ${$(P)}, so it lowers profit.` },
              { value: T.qATC, why: "That is where ATC is lowest. Profit is maximized where MR = MC, not at minimum average cost." },
              { value: T.N, why: "Producing as much as possible includes units whose MC is above the price." },
              { value: minMCq, why: "That is where MC is lowest. Keep producing while MC is still below the price." },
            ]),
            sol: steps("For a price taker MR = P. Produce each unit whose marginal cost is below the price, and stop before the first one that costs more than P.",
              `MR = ${$(P)}. The ${ordinal(q)} unit has MC = ${$(T.mc[q])} &lt; ${$(P)}, so it adds to profit; the ${ordinal(q + 1)} has MC = ${$(T.mc[q + 1])} &gt; ${$(P)}, so it would reduce profit.`,
              `Best output: <b>${qty(q, S.g)}</b> per day.`),
          });
        },
      },
      {
        name: "Best output from total cost (largest TR − TC)",
        make() {
          const F = firm(U.pick(["profit", "profit", "loss"]));
          const { T, P, q, S } = F;
          return Q.num({
            q: `${S.name} can sell all the ${S.g.p} it wants at the market price of ${$(P)}. Its daily total cost is:${costHtml(T, ["tc"])}What output maximizes economic profit (or minimizes the loss)?`,
            answer: q, unit: pl(q, S.g), kind: "count",
            traps: traps(q, [
              { value: T.N, why: "Total revenue is largest at the biggest output, but total cost climbs faster there. Maximize TR − TC, not TR." },
              { value: T.qATC, why: "That output has the lowest average total cost, but total profit is larger elsewhere." },
              { value: q + 1, why: `At ${q + 1} units, profit is ${$(bestQ(T, P).prof[q + 1])}, lower than at ${q}.` },
              { value: q - 1, why: `At ${q - 1} units, profit is ${$(bestQ(T, P).prof[q - 1])}, lower than at ${q}.` },
              { value: 0, why: `Shutting down loses the whole fixed cost of ${$(T.tfc)}; producing ${q} does better.` },
            ]),
            sol: steps("Economic profit = TR − TC, with TR = P × Q. Compute it for each output and pick the largest (or the smallest loss).",
              `Around the top: ${[q - 1, q, q + 1].map(x => `Q = ${x}: ${$(P * x)} − ${$(T.tc[x])} = ${$(P * x - T.tc[x])}`).join("; ")}.`,
              `The best output is <b>${q}</b>, with profit ${$(F.profit)}. (Check: MC of unit ${q} is ${$(T.mc[q])} &lt; P, and MC of unit ${q + 1} is ${$(T.mc[q + 1])} &gt; P.)`),
          });
        },
      },
      {
        name: "TR, MR and AR for a price taker",
        make() {
          const S = seller();
          const P = U.randInt(6, 30) * S.k;
          const q = U.randInt(12, 90);
          const ask = U.pick(["tr", "mr", "ar"]);
          if (ask === "tr") {
            return Q.num({
              q: `${S.name} sells ${qty(q, S.g)} a day at the market price of ${$(P)}. What is its total revenue per day?`,
              answer: P * q, unit: "$",
              traps: traps(P * q, [{ value: P, why: "That is the price, which is also MR and AR. TR = P × Q." }, { value: P * (q + 1), why: `That is TR for ${q + 1} units.` }]),
              sol: steps("Total revenue = price × quantity.", `TR = ${$(P)} × ${q} = <b>${$(P * q)}</b>.`),
            });
          }
          if (ask === "mr") {
            return Q.num({
              q: `${S.name} sells ${S.g.p} in a perfectly competitive market. At ${qty(q, S.g)} a day its total revenue is ${$(P * q)}; at ${q + 1} it is ${$(P * (q + 1))}. What is the marginal revenue of the ${ordinal(q + 1)} ${S.g.s}?`,
              answer: P, unit: "$",
              traps: traps(P, [{ value: P * (q + 1), why: "That is total revenue. MR is the change in TR from one more unit." }, { value: r2(P * (q + 1) / q), why: "Divide the change in TR by the change in Q (1 unit), not TR by Q." }]),
              sol: steps("MR = ΔTR ÷ ΔQ.", `MR = (${$(P * (q + 1))} − ${$(P * q)}) ÷ 1 = <b>${$(P)}</b>, the market price. For a price taker MR = P for every unit.`),
            });
          }
          return Q.num({
            q: `${S.name} earns total revenue of ${$(P * q)} from selling ${qty(q, S.g)} in a perfectly competitive market. What is its average revenue (revenue per ${S.g.s})?`,
            answer: P, unit: "$",
            traps: traps(P, [{ value: P * q, why: "That is total revenue. AR = TR ÷ Q." }]),
            sol: steps("AR = TR ÷ Q.", `AR = ${$(P * q)} ÷ ${q} = <b>${$(P)}</b>, which is the market price. For a price taker P = MR = AR.`),
          });
        },
      },
      {
        name: "Produce more, less, or stay put?",
        make() {
          const S = seller();
          const k = S.k;
          const P = U.randInt(12, 30) * k;
          const q = U.randInt(20, 80);
          const kind = U.pick(["more", "less", "same"]);
          let last, next;
          if (kind === "more") { last = P - U.randInt(4, 8) * k; next = P - U.randInt(1, 3) * k; }
          else if (kind === "less") { last = P + U.randInt(1, 4) * k; next = last + U.randInt(2, 5) * k; }
          else { last = P - U.randInt(1, 3) * k; next = P + U.randInt(1, 3) * k; }
          const right = kind === "more" ? "Produce more" : kind === "less" ? "Produce less" : `Keep producing ${q}`;
          const all = ["Produce more", "Produce less", `Keep producing ${q}`];
          const whyFor = {
            "Produce more": "Only expand when the next unit's MC is below the price.",
            "Produce less": "Only cut back when the last unit's MC is above the price.",
          };
          whyFor[`Keep producing ${q}`] = "Stay put only when the last unit's MC is below P and the next unit's MC is above it.";
          return Q.mc({
            q: `${S.name} sells ${S.g.p} at the market price of ${$(P)} and currently produces ${q} a day. The marginal cost of the ${ordinal(q)} ${S.g.s} was ${$(last)}, and the ${ordinal(q + 1)} would cost ${$(next)}. To maximize profit, the ${S.g.firm} should:`,
            right, keepOrder: true,
            wrong: all.filter(a => a !== right).map(a => ({ t: a, why: whyFor[a] })),
            sol: steps("Compare MR (= P) with MC, one unit at a time.",
              kind === "more" ? `The next unit adds ${$(P)} to revenue and only ${$(next)} to cost, so producing it raises profit by ${$(P - next)}: <b>produce more</b>.`
                : kind === "less" ? `The ${ordinal(q)} unit cost ${$(last)} but sold for only ${$(P)}, losing ${$(last - P)}: <b>produce less</b>.`
                  : `The ${ordinal(q)} unit adds ${$(P - last)} to profit, but the ${ordinal(q + 1)} would lose ${$(next - P)}. <b>${q}</b> is the profit-maximizing output.`),
          });
        },
      },
      {
        name: "Reverse: which price gives this output?",
        make() {
          for (let tries = 0; tries < 100; tries++) {
            const F = firm(U.pick(["profit", "loss"]));
            const { T, q, S, k } = F;
            if (q < 2 || q + 1 > T.N) continue;
            const inBand = (lo, hi) => { const c = []; for (let p = Math.floor(lo / k) + 1; p * k < hi; p++) c.push(p * k); return c; };
            const right = inBand(T.mc[q], T.mc[q + 1]).filter(p => (bestQ(T, p) || {}).q === q);
            const low = inBand(T.mc[q - 1], T.mc[q]).filter(p => { const b = bestQ(T, p); return b && b.q !== q; });
            const high = q + 2 <= T.N ? inBand(T.mc[q + 1], T.mc[q + 2]).filter(p => { const b = bestQ(T, p); return b && b.q !== q; }) : [];
            if (!right.length || !low.length || !high.length) continue;
            const P = U.pick(right), pL = U.pick(low), pH = U.pick(high);
            const qL = bestQ(T, pL).q, qH = bestQ(T, pH).q;
            const pX = Math.max(k, T.mc[q] - k * U.randInt(3, 5));
            const wrong = [
              { t: $(pL), why: `At ${$(pL)} the ${ordinal(q)} unit (MC ${$(T.mc[q])}) costs more than it sells for, so the firm would produce ${qL === 0 ? "nothing" : qL}.` },
              { t: $(pH), why: `At ${$(pH)} the ${ordinal(q + 1)} unit (MC ${$(T.mc[q + 1])}) is also worth producing, so the firm would produce ${qH}.` },
            ];
            const bX = bestQ(T, pX);
            if (bX && bX.q !== q && ![P, pL, pH].includes(pX)) wrong.push({ t: $(pX), why: `At ${$(pX)} the firm would produce ${bX.q === 0 ? "nothing (it is below minimum AVC)" : bX.q}.` });
            return Q.mc({
              q: `${S.name} is a price taker with this marginal cost schedule:${costHtml(T, ["mc"], true)}It is maximizing profit by producing <b>${qty(q, S.g)}</b> a day. Which could be the market price?`,
              right: $(P), wrong,
              sol: steps(`At the best output, the last unit produced has MC below P, and the next unit has MC above P.`,
                `So P must lie between the MC of the ${ordinal(q)} unit (${$(T.mc[q])}) and the MC of the ${ordinal(q + 1)} (${$(T.mc[q + 1])}).`,
                `Of the choices, only <b>${$(P)}</b> is in that range.`),
            });
          }
          throw new Error("reverse price");
        },
      },
      {
        name: "Price rises: how much more output?",
        make() {
          for (let tries = 0; tries < 100; tries++) {
            const F = firm("loss");
            const { T, S, k } = F;
            const ps = priceOptions(F.B, "profit").map(p => p * k).filter(p => bestQ(T, p).q > F.q);
            if (!ps.length) continue;
            const P2 = U.pick(ps);
            const q2 = bestQ(T, P2).q, q1 = F.q;
            return Q.num({
              q: `${S.name} sells in a perfectly competitive market. Its marginal costs are:${costHtml(T, ["mc"], true)}The market price rises from ${$(F.P)} to ${$(P2)}. By how many ${S.g.p} per day should the ${S.g.firm} increase output?`,
              answer: q2 - q1, unit: pl(q2 - q1, S.g), kind: "count",
              traps: traps(q2 - q1, [
                { value: q2, why: `That is the new output. The question asks for the increase from ${q1}.` },
                { value: q1, why: `That is the old output at ${$(F.P)}.` },
                { value: 0, why: "A higher price makes units with MC between the old and new price worth producing." },
              ]),
              sol: steps("Apply P = MC at each price: produce every unit whose MC is below the price.",
                `At ${$(F.P)}: MC of unit ${q1} is ${$(T.mc[q1])} &lt; ${$(F.P)} and unit ${q1 + 1} costs ${$(T.mc[q1 + 1])}, so Q = ${q1}.`,
                `At ${$(P2)}: MC of unit ${q2} is ${$(T.mc[q2])} &lt; ${$(P2)} and unit ${q2 + 1} costs ${$(T.mc[q2 + 1])}, so Q = ${q2}. Increase = ${q2} − ${q1} = <b>${q2 - q1}</b>. The firm moves up its MC curve.`),
            });
          }
          throw new Error("price rises");
        },
      },
      {
        name: "Is lowest average cost the best output?",
        make() {
          let F;
          do { F = firm("profit"); } while (F.T.qATC >= F.q);
          const { T, P, q, S } = F;
          const m = T.qATC;
          const pM = P * m - T.tc[m];
          return Q.mc({
            q: `${S.name} sells ${S.g.p} at the market price of ${$(P)}. Its costs are:${costHtml(T, ["tc", "mc", "atc"], true)}The manager wants to produce ${m} a day "because that is where average total cost is lowest." Is that the profit-maximizing choice?`,
            right: `No: the ${ordinal(m + 1)} ${S.g.s} costs only ${$(T.mc[m + 1])} to make but sells for ${$(P)}, so producing more raises profit. The best output is ${q}.`,
            wrong: [
              { t: "Yes: the lowest cost per unit always gives the highest total profit", why: `At ${m} units profit is ${$(pM)}; at ${q} units it is ${$(F.profit)}. Total profit depends on every unit's MR versus MC.` },
              { t: `No: the ${S.g.firm} should produce fewer than ${m}, because the price is above ATC`, why: "P above ATC means units are profitable; that argues for more output, not less." },
              { t: `No: the ${S.g.firm} should produce ${T.N}, because more output always means more revenue`, why: `Units beyond ${q} have MC above ${$(P)}, so they lower profit even though they raise revenue.` },
            ],
            sol: steps("Profit is maximized where MR = MC, not where ATC is lowest.",
              `From ${m} to ${q} units, each extra unit's MC (${T.mc.slice(m + 1, q + 1).map(v => $(v)).join(", ")}) is below the price ${$(P)}, so each one adds to profit.`,
              `Profit at ${m}: ${$(pM)}. Profit at ${q}: <b>${$(F.profit)}</b>.`),
          });
        },
      },
    ],
  });

  /* Retry a scenario builder until it returns something. */
  function retry(fn) {
    for (let i = 0; i < 300; i++) { const r = fn(); if (r) return r; }
    throw new Error("retry: no scenario");
  }
  /* Per-unit scenario at the best output: P, Q, ATC, AVC, all whole or half dollars. */
  function perUnit(kase) {
    const S = seller();
    const k = S.k;
    const q = U.randInt(4, 40) * 5;
    let P, atc, avc;
    if (kase === "profit") { atc = U.randInt(8, 30); P = atc + U.randInt(2, 8); avc = atc - U.randInt(2, 6); }
    else if (kase === "loss") { avc = U.randInt(8, 24); P = avc + U.randInt(1, 5); atc = P + U.randInt(1, 6); }
    else { avc = U.randInt(10, 26); P = avc - U.randInt(1, 4); atc = avc + U.randInt(2, 6); }
    return { S, q, P: P * k, atc: atc * k, avc: avc * k, tfc: (atc - avc) * k * q };
  }

  /* ============================================================
   * PRACTICE 3 — Total revenue, total cost & economic profit
   * ============================================================ */
  const genProfit = STUDY.makeGenerator({
    id: "b251-m10-profit",
    name: "Revenue, cost & economic profit",
    blurb: "Compute TR, TC and economic profit as (P − ATC) × Q, size a loss, and separate economic from accounting profit.",
    variants: [
      {
        name: "Profit = (P − ATC) × Q",
        make() {
          const s = perUnit("profit");
          const ans = (s.P - s.atc) * s.q;
          return Q.num({
            q: `${s.S.name} sells ${s.S.g.p} at the market price of ${$(s.P)}. At its profit-maximizing output of ${qty(s.q, s.S.g)} a day, average total cost is ${$(s.atc)} and average variable cost is ${$(s.avc)}. What is its economic profit per day?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (s.P - s.avc) * s.q, why: "You used AVC, which leaves out fixed cost. Profit uses ATC." },
              { value: s.P - s.atc, why: "That is profit per unit. Multiply by the quantity." },
              { value: s.P * s.q, why: "That is total revenue. Subtract total cost (ATC × Q)." },
              { value: s.atc * s.q, why: "That is total cost, not profit." },
            ]),
            sol: steps("Economic profit = TR − TC = (P − ATC) × Q.",
              `TR = ${$(s.P)} × ${s.q} = ${$(s.P * s.q)}; TC = ${$(s.atc)} × ${s.q} = ${$(s.atc * s.q)}.`,
              `Profit = (${$(s.P)} − ${$(s.atc)}) × ${s.q} = <b>${$(ans)}</b> a day. (AVC is not needed: it leaves out fixed cost.)`),
          });
        },
      },
      {
        name: "Size of a loss from AVC and fixed cost",
        make() {
          const s = perUnit("loss");
          const loss = s.tfc + s.avc * s.q - s.P * s.q;
          return Q.num({
            q: `${s.S.name} faces a market price of ${$(s.P)}. At its best output of ${qty(s.q, s.S.g)} a day, its average variable cost is ${$(s.avc)}, and its total fixed cost is ${$(s.tfc)} a day. How large is its economic <b>loss</b> per day? (Enter the loss as a positive number.)`,
            answer: loss, unit: "$",
            traps: traps(loss, [
              { value: s.tfc, why: "That is the loss if it shuts down. Producing covers part of the fixed cost, so the loss is smaller." },
              { value: (s.P - s.avc) * s.q, why: "That is how much revenue is left over after variable cost (the contribution to fixed cost), not the loss." },
              { value: s.tfc + (s.P - s.avc) * s.q, why: "Revenue above variable cost <em>reduces</em> the loss; subtract it from the fixed cost instead of adding it." },
            ]),
            sol: steps("Loss = TC − TR, where TC = TFC + AVC × Q.",
              `TC = ${$(s.tfc)} + ${$(s.avc)} × ${s.q} = ${$(s.tfc + s.avc * s.q)}; TR = ${$(s.P)} × ${s.q} = ${$(s.P * s.q)}.`,
              `Loss = ${$(s.tfc + s.avc * s.q)} − ${$(s.P * s.q)} = <b>${$(loss)}</b>. That is less than the ${$(s.tfc)} it would lose by shutting down, because P &gt; AVC.`),
          });
        },
      },
      {
        name: "Fixed cost from the ATC–AVC gap",
        make() {
          const s = perUnit(U.pick(["profit", "loss"]));
          return Q.num({
            q: `At ${qty(s.q, s.S.g)} a day, ${s.S.name} has an average total cost of ${$(s.atc)} and an average variable cost of ${$(s.avc)}. What is its total fixed cost per day?`,
            answer: s.tfc, unit: "$",
            traps: traps(s.tfc, [
              { value: s.atc - s.avc, why: "That is average fixed cost (AFC). Multiply by the quantity to get total fixed cost." },
              { value: s.atc * s.q, why: "That is total cost. Subtract total variable cost." },
              { value: s.avc * s.q, why: "That is total variable cost." },
            ]),
            sol: steps("ATC = AVC + AFC, so the gap between them is average fixed cost.",
              `AFC = ${$(s.atc)} − ${$(s.avc)} = ${$(s.atc - s.avc)}.`,
              `TFC = AFC × Q = ${$(s.atc - s.avc)} × ${s.q} = <b>${$(s.tfc)}</b>.`),
          });
        },
      },
      {
        name: "Maximum profit from a cost table",
        make() {
          const F = firm(U.pick(["profit", "profit", "loss"]));
          const { T, P, q, S } = F;
          const pr = bestQ(T, P).prof;
          return Q.num({
            q: `${S.name} sells ${S.g.p} at the market price of ${$(P)}. Its daily total cost is:${costHtml(T, ["tc"])}What is the <b>largest economic profit</b> it can earn per day? (If the best it can do is a loss, type it as a negative number, e.g. -12.)`,
            answer: F.profit, unit: "$",
            traps: traps(F.profit, [
              { value: pr[T.qATC], why: `That is the profit at ${T.qATC} units, where ATC is lowest. A different output earns more.` },
              { value: P * q, why: "That is total revenue at the best output; subtract total cost." },
              { value: pr[T.N], why: `That is the profit at the largest output (${T.N}).` },
              { value: -F.profit, why: "Check the sign: profit is TR − TC." },
              { value: -T.tfc, why: "That is the result of shutting down; producing does better." },
            ]),
            sol: steps("First find the best output: profit = P × Q − TC at each output (or produce every unit whose MC = ΔTC is below P).",
              `Near the top: ${[q - 1, q, q + 1].map(x => `Q = ${x}: ${$(P * x)} − ${$(T.tc[x])} = ${$(pr[x])}`).join("; ")}.`,
              `Best output ${q}, profit <b>${$(F.profit)}</b>${F.profit < 0 ? ` (a loss, but smaller than the ${$(T.tfc)} fixed cost lost by shutting down)` : ""}.`),
          });
        },
      },
      {
        name: "Reverse: average total cost from profit",
        make() {
          const s = perUnit("profit");
          const prof = (s.P - s.atc) * s.q;
          return Q.num({
            q: `${s.S.name} sells ${qty(s.q, s.S.g)} a day at the market price of ${$(s.P)} and earns an economic profit of ${$(prof)} a day. What is its average total cost at that output?`,
            answer: s.atc, unit: "$",
            traps: traps(s.atc, [
              { value: s.P - prof, why: "Subtract profit <em>per unit</em> (profit ÷ Q) from the price, not total profit." },
              { value: s.P + prof / s.q, why: "Profit means ATC is <em>below</em> the price; subtract profit per unit." },
              { value: s.P * s.q - prof, why: "That is total cost. Divide by Q for the average." },
            ]),
            sol: steps("Profit = (P − ATC) × Q, so profit per unit = profit ÷ Q = P − ATC.",
              `Profit per unit = ${$(prof)} ÷ ${s.q} = ${$(prof / s.q)}.`,
              `ATC = ${$(s.P)} − ${$(prof / s.q)} = <b>${$(s.atc)}</b>.`),
          });
        },
      },
      {
        name: "Economic vs accounting profit",
        make() {
          const S = seller();
          const tr = U.randInt(60, 200) * 1000;
          const exp = Math.round(tr * U.randInt(50, 80) / 100 / 1000) * 1000;
          const wage = U.randInt(30, 70) * 1000;
          const capital = U.randInt(5, 30) * 10000;
          const rate = U.pick([4, 5, 6, 8]);
          const interest = capital * rate / 100;
          const econ = tr - exp - wage - interest;
          const acct = tr - exp;
          return Q.num({
            q: `${S.who} runs a ${S.g.firm} selling ${S.g.p}. Last year revenue was ${$(tr)} and explicit costs (supplies, fuel, hired help, rent) were ${$(exp)}. ${S.who} gave up a ${$(wage)} salary elsewhere to run it and has ${$(capital)} of savings tied up in equipment that could earn ${rate}% a year in the bank. What was the economic profit? (Type a loss as a negative number.)`,
            answer: econ, unit: "$",
            traps: traps(econ, [
              { value: acct, why: "That is accounting profit. Economic profit also subtracts implicit costs: the forgone salary and the forgone interest." },
              { value: acct - wage, why: `You left out the forgone interest of ${$(interest)}.` },
              { value: acct - interest, why: `You left out the forgone salary of ${$(wage)}.` },
              { value: acct - wage - capital, why: `The implicit cost of the savings is the interest they could earn (${rate}% of ${$(capital)} = ${$(interest)}), not the whole ${$(capital)}.` },
            ]),
            sol: steps("Economic profit = total revenue − explicit costs − implicit costs (opportunity costs of the owner's own resources).",
              `Implicit costs: forgone salary ${$(wage)} + forgone interest ${rate}% × ${$(capital)} = ${$(interest)}, total ${$(wage + interest)}.`,
              `Economic profit = ${$(tr)} − ${$(exp)} − ${$(wage + interest)} = <b>${$(econ)}</b>. (Accounting profit would be ${$(acct)}.)`),
          });
        },
      },
      {
        name: "Read profit off TR and TC curves",
        make() {
          const S = seller();
          const gc = graphCase("profit");
          const k = S.k, t = 1;
          const tc = qq => (gc.F + gc.a * qq + (Math.pow(qq - 4, 3) + 64) / 12);
          const TRq = gc.P * gc.q * k, TCq = tc(gc.q) * k;
          const ans = TRq - TCq;
          const yMax = Math.ceil(gc.P * 14 * k / 50) * 50;
          const trPts = [[0, 0], [5, gc.P * 5 * k], [14, gc.P * 14 * k]].filter(p => p[1] <= yMax);
          const tcPts = [];
          for (let x = 0; x <= 14; x += 0.25) { const v = tc(x) * k; if (v <= yMax) tcPts.push([x * t, v]); }
          const g = G.plot({ xLabel: `${cap(S.g.p)} per day`, yLabel: "Total revenue and total cost ($)", xMax: 14, yMax,
            xTicks: [2, 4, 6, 8, 10, 12], yTicks: keyTicks(yMax, yMax / 5, [r2(TRq), r2(TCq)]),
            curves: [{ pts: trPts, style: "main", label: "TR", labelAt: 1 }, { pts: tcPts, style: "alt", label: "TC", labelAt: tcPts.length - 3 },
              { pts: [[gc.q, 0], [gc.q, TRq]], style: "faint" }, { pts: [[0, TRq], [gc.q, TRq]], style: "faint" }, { pts: [[0, TCq], [gc.q, TCq]], style: "faint" }],
            points: [{ x: gc.q, y: TRq, label: "" }, { x: gc.q, y: TCq, label: "" }], aria: "total revenue line and total cost curve" });
          return Q.num({
            q: `${S.name} sells ${S.g.p} at ${$(gc.P * k)} each. The graph shows its total revenue and total cost; the dotted line marks the output where the gap between TR and TC is largest.${g}What is its maximum economic profit per day?`,
            answer: r2(ans), unit: "$",
            traps: traps(r2(ans), [
              { value: r2(TRq), why: "That is total revenue at that output. Subtract total cost." },
              { value: r2(TCq), why: "That is total cost at that output." },
              { value: r2(gc.P * k - TCq / gc.q), why: "That is profit per unit. Total profit is the vertical gap TR − TC." },
            ]),
            sol: steps("Economic profit is the vertical distance between TR and TC. It is largest where the TC curve's slope (MC) equals the TR line's slope (P).",
              `At ${gc.q} units, TR = ${$(TRq)} and TC = ${$(TCq)}.`,
              `Profit = ${$(TRq)} − ${$(TCq)} = <b>${$(ans)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Short-run outcomes: profit, loss or shut down
   * ============================================================ */
  const CASE_LBL = { profit: "Economic profit", loss: "Loss, but keep producing", shut: "Shut down" };
  const SR_TF = [
    { q: "A firm earning an economic loss should always shut down right away.", truth: false, why: "If price is above AVC, producing loses less than the fixed cost it would lose by shutting down." },
    { q: "If a firm shuts down in the short run, its loss equals its total fixed cost.", truth: true, why: "With no output there is no revenue and no variable cost, but fixed costs must still be paid." },
    { q: "When price is between minimum AVC and minimum ATC, the firm minimizes its loss by producing where P = MC.", truth: true, why: "Revenue covers variable cost and part of fixed cost, so the loss is smaller than TFC." },
    { q: "The short-run shutdown price equals minimum average total cost.", truth: false, why: "Shutdown price = minimum AVC. Minimum ATC is the break-even price." },
    { q: "The break-even price is where price equals minimum average total cost.", truth: true, why: "At minimum ATC, TR = TC and economic profit is zero." },
    { q: "An increase in a firm's fixed costs raises its short-run shutdown price.", truth: false, why: "The shutdown price is min AVC, which does not depend on fixed cost." },
    { q: "At the break-even price, the firm's owners earn a normal rate of return.", truth: true, why: "Zero economic profit means all opportunity costs, including a normal return, are covered." },
    { q: "A firm whose price is below average variable cost covers part of its fixed cost by producing.", truth: false, why: "Below AVC, revenue does not even cover variable cost, so producing adds to the loss." },
    { q: "Whether to shut down in the short run depends on comparing price with average variable cost.", truth: true, why: "Fixed costs are paid either way, so only revenue versus variable cost matters." },
  ];
  /* A firm's key numbers for a case: price, min ATC and min AVC (whole dollars). */
  function caseNums(kase) {
    const minAVC = U.randInt(6, 20), minATC = minAVC + U.randInt(3, 8);
    const P = kase === "profit" ? minATC + U.randInt(1, 6) : kase === "loss" ? U.randInt(minAVC + 1, minATC - 1) : minAVC - U.randInt(1, Math.min(4, minAVC - 2));
    return { P, minATC, minAVC };
  }
  const genShortRun = STUDY.makeGenerator({
    id: "b251-m10-shortrun",
    name: "Short-run outcomes: profit, loss or shut down",
    blurb: "Compare price with minimum ATC and minimum AVC, decide whether to produce, and size the loss from shutting down.",
    variants: [
      {
        name: "Classify firms by short-run outcome",
        make() {
          const kases = U.shuffle(["profit", "loss", "shut", U.pick(["profit", "loss", "shut"]), U.pick(["profit", "loss", "shut"])]);
          const used = U.sample(PRODUCTS, 5);
          const items = kases.map((kk, i) => {
            const n = caseNums(kk);
            return { t: `${cap(used[i].firm)} selling ${used[i].p}: price ${$(n.P)}, minimum ATC ${$(n.minATC)}, minimum AVC ${$(n.minAVC)}`, cat: CASE_LBL[kk],
              why: kk === "profit" ? `P (${$(n.P)}) &gt; min ATC (${$(n.minATC)}): profit.` : kk === "loss" ? `min AVC (${$(n.minAVC)}) &lt; P (${$(n.P)}) &lt; min ATC (${$(n.minATC)}): loss, but producing covers part of fixed cost.` : `P (${$(n.P)}) &lt; min AVC (${$(n.minAVC)}): shut down.` };
          });
          return Q.classify({
            q: "Each competitive firm is choosing its output for the short run. Classify each one.",
            cats: [CASE_LBL.profit, CASE_LBL.loss, CASE_LBL.shut], items,
            sol: steps("Compare the price with two numbers: minimum ATC (the break-even price) and minimum AVC (the shutdown price).",
              "P &gt; min ATC → profit. Min AVC &lt; P &lt; min ATC → loss, but keep producing. P &lt; min AVC → shut down."),
          });
        },
      },
      {
        name: "Loss from shutting down",
        make() {
          const s = perUnit(U.pick(["loss", "shut"]));
          const tvc = s.avc * s.q;
          const lossProd = s.tfc + tvc - s.P * s.q;
          return Q.num({
            q: `${s.S.name} has total fixed costs of ${$(s.tfc)} a day (land lease, equipment payments, insurance). The market price is ${$(s.P)}; if it produces its best output of ${qty(s.q, s.S.g)}, its total variable cost is ${$(tvc)}. If it <b>shuts down</b> for the short run, what is its economic loss per day? (Enter the loss as a positive number.)`,
            answer: s.tfc, unit: "$",
            traps: traps(s.tfc, [
              { value: 0, why: "Shutting down stops variable costs, but fixed costs must still be paid." },
              { value: tvc, why: "Variable cost disappears when output is zero; fixed cost does not." },
              { value: s.tfc + tvc, why: "That is total cost if it produces. With zero output, only fixed cost remains." },
            ]),
            sol: steps("In the short run fixed costs must be paid even at zero output.",
              `Shut down: TR = 0, TVC = 0, so loss = TFC = <b>${$(s.tfc)}</b>. (Producing at ${$(s.P)} would give a loss of ${$(lossProd)}, so it should ${lossProd < s.tfc ? "keep producing" : "indeed shut down"}.)`),
          });
        },
      },
      {
        name: "Stay open or shut down? (totals)",
        make() {
          const kase = U.pick(["profit", "loss", "shut"]);
          const s = perUnit(kase);
          const tr = s.P * s.q, tvc = s.avc * s.q, tfc = s.tfc;
          const opts = {
            profit: "Keep producing: it earns an economic profit",
            loss: "Keep producing: its loss is smaller than its fixed cost",
            shut: "Shut down: losing only its fixed cost beats producing",
          };
          const whys = {
            profit: "Profit requires TR &gt; TVC + TFC. Check the totals.",
            loss: "Keep producing at a loss only when TR covers TVC but not TC.",
            shut: "Shut down only when TR is less than TVC.",
          };
          return Q.mc({
            q: `At its best output, ${s.S.name} would earn total revenue of ${$(tr)} a day, with total variable cost of ${$(tvc)} and total fixed cost of ${$(tfc)}. What should it do in the short run?`,
            right: opts[kase],
            wrong: Object.keys(opts).filter(x => x !== kase).map(x => ({ t: opts[x], why: whys[x] })),
            sol: steps("Shutting down saves variable cost but not fixed cost. So the test is: does TR cover TVC?",
              `TR = ${$(tr)}, TVC = ${$(tvc)}, TC = ${$(tvc + tfc)}.`,
              kase === "profit" ? `TR &gt; TC: <b>produce</b> and earn ${$(tr - tvc - tfc)}.`
                : kase === "loss" ? `TVC &lt; TR &lt; TC: <b>keep producing</b>. The extra ${$(tr - tvc)} above variable cost pays part of the fixed cost, so the loss (${$(tvc + tfc - tr)}) is smaller than ${$(tfc)}.`
                  : `TR &lt; TVC: <b>shut down</b>. Producing would lose ${$(tvc + tfc - tr)}, more than the ${$(tfc)} fixed cost.`),
          });
        },
      },
      {
        name: "Smallest possible loss",
        make() {
          const kase = U.pick(["loss", "shut"]);
          const s = perUnit(kase);
          const lossProd = s.tfc + s.avc * s.q - s.P * s.q;
          const ans = Math.min(lossProd, s.tfc);
          return Q.num({
            q: `The market price of ${an(s.S.g.s)} is ${$(s.P)}. If ${s.S.name} produces, its best output is ${qty(s.q, s.S.g)} a day, where ATC = ${$(s.atc)} and AVC = ${$(s.avc)}. What is the <b>smallest</b> loss it can achieve in the short run? (Enter a positive number.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: kase === "loss" ? s.tfc : lossProd, why: kase === "loss" ? "That is the loss from shutting down. Since P &gt; AVC, producing loses less." : "That is the loss from producing. Since P &lt; AVC, shutting down (losing only fixed cost) is better." },
              { value: (s.atc - s.P), why: "That is the loss per unit; multiply by Q, and compare with shutting down." },
              { value: Math.abs(s.P - s.avc) * s.q, why: "That compares price with AVC only; the loss must include fixed cost." },
            ]),
            sol: steps("Compare two options: produce (loss = (ATC − P) × Q) or shut down (loss = TFC = (ATC − AVC) × Q).",
              `Produce: (${$(s.atc)} − ${$(s.P)}) × ${s.q} = ${$(lossProd)}. Shut down: (${$(s.atc)} − ${$(s.avc)}) × ${s.q} = ${$(s.tfc)}.`,
              kase === "loss" ? `P &gt; AVC, so producing is better: smallest loss <b>${$(ans)}</b>.` : `P &lt; AVC, so shutting down is better: smallest loss <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Decision from a cost table",
        make() {
          const kase = U.pick(["profit", "loss", "shut"]);
          const F = firm(kase);
          const { T, P, q, S } = F;
          const qp = mcRuleQ(T, P) || T.qAVC;
          const opts = {
            profit: n => `Produce ${n} and earn an economic profit`,
            loss: n => `Produce ${n} and accept a loss smaller than its fixed cost`,
            shut: () => `Shut down: produce 0 and lose its fixed cost of ${$(T.tfc)}`,
          };
          const right = opts[kase](q);
          const wrong = [];
          if (kase !== "profit") wrong.push({ t: opts.profit(qp), why: `At ${$(P)} the price is below minimum ATC (${$2(T.minATC)}), so no output earns a profit.` });
          if (kase !== "loss") wrong.push({ t: opts.loss(kase === "shut" ? qp : q), why: kase === "shut" ? `The price is below minimum AVC (${$2(T.minAVC)}): every unit adds more to cost than to revenue, so any output loses more than the fixed cost.` : `At ${q} units P &gt; ATC, so this is a profit, not a loss.` });
          if (kase !== "shut") wrong.push({ t: opts.shut(), why: `The price is above minimum AVC (${$2(T.minAVC)}), so producing does better than shutting down.` });
          if (kase === "profit") wrong.push({ t: `Produce ${T.qATC}, where ATC is lowest, and earn an economic profit`, why: `Profit is maximized where P = MC, at ${q}, not at minimum ATC.` });
          return Q.mc({
            q: `${S.name} faces a market price of ${$(P)} per ${S.g.s}. Its costs are:${costHtml(T, ["mc", "avc", "atc"], true)}What should it do in the short run?`,
            right, wrong: uniqWrong(right, wrong),
            sol: steps("Find the minimum AVC (shutdown price) and minimum ATC (break-even price) in the table, then compare the price with them.",
              `Min AVC = ${$2(T.minAVC)} (at ${T.qAVC}); min ATC = ${$2(T.minATC)} (at ${T.qATC}); P = ${$(P)}.`,
              kase === "profit" ? `P &gt; min ATC: produce where P = MC, at <b>${q}</b> (MC of unit ${q} is ${$(T.mc[q])}, unit ${q + 1} costs ${$(T.mc[q + 1])}), earning ${$(F.profit)}.`
                : kase === "loss" ? `Min AVC &lt; P &lt; min ATC: produce where P = MC, at <b>${q}</b>. The loss is ${$(-F.profit)}, less than the ${$(T.tfc)} fixed cost.`
                  : `P &lt; min AVC: <b>shut down</b>. Loss = TFC = ${$(T.tfc)}.`),
          });
        },
      },
      {
        name: "Break-even price from a cost table",
        make() {
          const F = firm("profit");
          const { T, S } = F;
          const ans = r2(T.minATC);
          return Q.num({
            q: `The table shows the costs of ${S.name}.${costHtml(T, ["tc", "mc", "avc", "atc"], true)}What is its short-run <b>break-even price</b>, the price at which it earns exactly zero economic profit at its best output? (Use the table's values.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: r2(T.minAVC), why: "That is minimum AVC, the shutdown price. Break-even needs revenue to cover <em>all</em> costs: minimum ATC." },
              { value: Math.min(...T.mc.slice(1)), why: "That is the lowest marginal cost, not the lowest average total cost." },
              { value: r2(T.atc[1]), why: "That is ATC of the first unit. Break-even is at the bottom of ATC." },
            ]),
            sol: steps("Break-even means TR = TC, which happens when the price just equals the lowest point of ATC.",
              `Scan the ATC column: it falls to ${$2(T.minATC)} at ${T.qATC} units, then rises.`,
              `Break-even price = minimum ATC = <b>${$2(T.minATC)}</b>. (The shutdown price, min AVC, is ${$2(T.minAVC)}.)`),
          });
        },
      },
      {
        name: "True or false: short-run losses",
        make() {
          const s = U.deal("m10-srtf", SR_TF, 1)[0];
          return Q.tf({
            q: s.q, truth: s.truth, why: s.why,
            sol: steps("Fixed costs are paid whether or not the firm produces. So in the short run, compare price with AVC to decide whether to produce, and with ATC to tell profit from loss.",
              `${s.truth ? "True" : "False"}. ${s.why}`),
          });
        },
      },
      {
        name: "Predict: fixed cost rises",
        make() {
          const S = seller();
          const q = U.randInt(4, 30) * 5;
          const P = U.randInt(12, 30) * S.k;
          const inc = U.randInt(2, 12) * 50;
          const what = U.pick(["the rent on its land", "its insurance premium", "the yearly payment on its equipment loan", "its property tax"]);
          return Q.mc({
            q: `${S.name} is producing ${qty(q, S.g)} a day at a price of ${$(P)}, where P = MC and P is above AVC. Then ${what} rises by ${$(inc)} a day. In the short run, what should it do?`,
            right: `Keep producing ${q}; its profit falls by ${$(inc)} a day`,
            wrong: [
              { t: `Produce less than ${q}, because costs have gone up`, why: "Fixed cost does not change MC, so P = MC still holds at the same output." },
              { t: `Raise its price to cover the extra ${$(inc)}`, why: "A price taker cannot raise its price; buyers would switch to other sellers." },
              { t: "Shut down, because its shutdown price has risen", why: "The shutdown price is minimum AVC, which fixed cost does not affect." },
            ],
            sol: steps("Ask which cost curves a fixed-cost change moves. It raises ATC and AFC but leaves MC and AVC untouched.",
              `So P = MC still occurs at ${q}, and P is still above AVC. Output stays at ${q}; profit falls (or the loss grows) by exactly ${$(inc)}.`,
              "In the long run, a higher fixed cost could push the firm toward exit if it now earns an economic loss."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — The short-run supply curve
   * ============================================================ */
  const SHIFT_BANK = [
    { t: "The price of fertilizer used by every farm in the industry falls", cat: "Supply shifts right", why: "Lower input prices lower every firm's MC curve, so each supplies more at any price." },
    { t: "A new seed variety lets each farm grow more with the same inputs", cat: "Supply shifts right", why: "Higher productivity lowers MC." },
    { t: "The government starts paying growers a subsidy on each unit sold", cat: "Supply shifts right", why: "A per-unit subsidy lowers the effective cost of each unit." },
    { t: "Dozens of new firms enter the industry", cat: "Supply shifts right", why: "Market supply sums all firms' supply; more firms means more supplied at every price." },
    { t: "Wages for farm workers rise across the region", cat: "Supply shifts left", why: "Higher factor costs raise MC." },
    { t: "A new tax is charged on every unit produced", cat: "Supply shifts left", why: "A per-unit tax raises each firm's marginal cost." },
    { t: "Many firms leave the industry after a string of losses", cat: "Supply shifts left", why: "Fewer firms means less supplied at every price." },
    { t: "A plant disease cuts the yield per acre on every farm", cat: "Supply shifts left", why: "Lower productivity raises MC." },
    { t: "The market price of the product rises because demand increased", cat: "Movement along supply", why: "A change in the good's own price moves firms along their MC curves; it does not shift supply." },
    { t: "Firms produce less because the market price of their product fell", cat: "Movement along supply", why: "A response to the good's own price is a movement along the supply curve." },
    { t: "Each farm expands output up its MC curve after the price rises", cat: "Movement along supply", why: "Moving up the MC curve is a movement along supply." },
  ];
  const genSupply = STUDY.makeGenerator({
    id: "b251-m10-supply",
    name: "The short-run supply curve",
    blurb: "Build the firm's supply curve from MC above minimum AVC, read quantities supplied, find the shutdown price, and add firms into market supply.",
    variants: [
      {
        name: "Which part of MC is the supply curve?",
        make() {
          const gc = { a: U.randInt(3, 6), F: 0 };
          gc.F = (mcF(gc.a, 10) - avcF(gc.a, 10)) * 10;
          const g = firmGraph({ a: gc.a, F: gc.F, keys: [gc.a + 1, mcF(gc.a, 10)], xLabel: "Output per day",
            points: [{ x: 3, y: mcF(gc.a, 3), label: "A" }, { x: 6, y: gc.a + 1, label: "B" }, { x: 10, y: mcF(gc.a, 10), label: "C" }], aria: "MC, ATC and AVC with points A, B and C" });
          return Q.mc({
            q: `The graph shows a competitive firm's cost curves. Point B is the minimum of AVC and point C is the minimum of ATC.${g}Which part of the graph is the firm's short-run supply curve?`,
            right: "The MC curve from point B upward",
            wrong: [
              { t: "The whole MC curve, including point A", why: "Below minimum AVC (point B) the firm shuts down, so it supplies zero, not the quantities on MC." },
              { t: "The MC curve from point C upward", why: "Between B and C the firm loses money but still produces, because P covers AVC. Those points are on its supply curve too." },
              { t: "The ATC curve to the right of point C", why: "The firm chooses output where P = MC, so supply follows MC, not ATC." },
              { t: "The AVC curve to the right of point B", why: "At each price the firm produces where P = MC, which is on MC, not AVC." },
            ],
            sol: steps("At any price the firm produces where P = MC, so its supply points lie on MC.",
              "But below minimum AVC (B, the shutdown point) it produces nothing.",
              "Supply curve = <b>MC at and above point B</b>."),
          });
        },
      },
      {
        name: "Quantity supplied at a given price",
        make() {
          const kase = U.pick(["profit", "loss", "shut", "loss"]);
          const F = firm(kase);
          const { T, P, q, S } = F;
          const qm = mcRuleQ(T, P);
          return Q.num({
            q: `${S.name} is a price taker with these costs:${costHtml(T, ["mc", "avc"], true)}How many ${S.g.p} per day will it supply if the market price is ${$(P)}?`,
            answer: q, unit: pl(q, S.g), kind: "count",
            traps: traps(q, [
              kase === "shut" ? { value: qm || T.qAVC, why: `Following MC would give ${qm || T.qAVC}, but ${$(P)} is below minimum AVC (${$2(T.minAVC)}), so the firm shuts down and supplies 0.` } : { value: 0, why: `${$(P)} is above minimum AVC (${$2(T.minAVC)}), so the firm produces rather than shutting down.` },
              { value: q + 1, why: `The ${ordinal(q + 1)} unit costs ${$(T.mc[q + 1])}, more than ${$(P)}.` },
              { value: T.qAVC, why: "That is where AVC is lowest; supply follows P = MC." },
            ]),
            sol: steps("Supply = MC above minimum AVC. First check the shutdown condition, then apply P = MC.",
              `Minimum AVC = ${$2(T.minAVC)} (at ${T.qAVC} units). P = ${$(P)} is ${kase === "shut" ? "below" : "above"} it.`,
              kase === "shut" ? "So the firm shuts down: quantity supplied = <b>0</b>." : `Produce every unit with MC &lt; ${$(P)}: through unit ${q} (MC ${$(T.mc[q])}); unit ${q + 1} costs ${$(T.mc[q + 1])}. Quantity supplied = <b>${q}</b>.`),
          });
        },
      },
      {
        name: "Shutdown price from total variable cost",
        make() {
          const F = firm("loss");
          const { T, S } = F;
          const ans = r2(T.minAVC);
          return Q.num({
            q: `The total variable cost of ${S.name} is:${costHtml(T, ["tvc"])}Its fixed cost is ${$(T.tfc)} a day. Below what price will it shut down in the short run? (Round to the cent.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: r2(T.minATC), why: "That is minimum ATC, the break-even price. The firm keeps producing at a loss down to minimum AVC." },
              { value: Math.min(...T.mc.slice(1)), why: "That is the lowest marginal cost. The shutdown point is where MC meets AVC, at minimum AVC." },
              { value: T.tvc[T.qAVC], why: "That is total variable cost. Divide by output to get AVC." },
            ]),
            sol: steps("The shutdown price is minimum average variable cost. Compute AVC = TVC ÷ Q for each output.",
              `AVC: ${Array.from({ length: T.N }, (_, i) => `${i + 1}: ${$2(T.avc[i + 1])}`).join(", ")}.`,
              `The lowest is <b>${$2(T.minAVC)}</b> at ${T.qAVC} units. (Fixed cost is irrelevant to this decision.)`),
          });
        },
      },
      {
        name: "Market supply from identical firms",
        make() {
          const F = firm(U.pick(["profit", "loss"]));
          const { T, P, q, S } = F;
          const n = U.pick([50, 80, 120, 200, 250, 400, 500, 1000]);
          return Q.num({
            q: `There are ${U.fmt(n)} identical firms in the market for ${S.g.p}. Each has these costs:${costHtml(T, ["mc", "avc"], true)}At a market price of ${$(P)}, what is the <b>market</b> quantity supplied per day?`,
            answer: n * q, unit: pl(n * q, S.g),
            traps: traps(n * q, [
              { value: q, why: "That is one firm's quantity. Market supply adds up all the firms." },
              { value: n * (q + 1), why: `Each firm stops at ${q}: the ${ordinal(q + 1)} unit's MC (${$(T.mc[q + 1])}) is above the price.` },
              { value: n * T.qATC, why: "Each firm produces where P = MC, not where ATC is lowest." },
            ]),
            sol: steps("Market supply at a price = the sum of every firm's quantity supplied at that price.",
              `One firm: P = ${$(P)} is above min AVC (${$2(T.minAVC)}); MC of unit ${q} is ${$(T.mc[q])} &lt; P and unit ${q + 1} costs ${$(T.mc[q + 1])}, so each supplies ${q}.`,
              `Market: ${U.fmt(n)} × ${q} = <b>${U.fmt(n * q)}</b>.`),
          });
        },
      },
      {
        name: "Market supply with two kinds of firm",
        make() {
          const S = seller();
          const k = S.k;
          const shutB = U.randInt(10, 16) * k;
          const P = Math.random() < 0.5 ? shutB - U.randInt(1, 3) * k : shutB + U.randInt(1, 4) * k;
          const qA = U.randInt(6, 14) * 10, qB = U.randInt(3, 9) * 10;
          const nA = U.pick([20, 30, 40, 60]), nB = U.pick([50, 100, 150, 200]);
          const bOn = P >= shutB;
          const ans = nA * qA + (bOn ? nB * qB : 0);
          return Q.num({
            q: `The market for ${S.g.p} has ${nA} large firms and ${nB} small firms. At a price of ${$(P)}, a large firm's MC equals the price at ${qA} a day, and a small firm's MC equals the price at ${qB} a day. Small firms have a minimum AVC of ${$(shutB)}; large firms' minimum AVC is well below ${$(P)}. What is the market quantity supplied at ${$(P)}?`,
            answer: ans, unit: pl(ans, S.g),
            traps: traps(ans, [
              bOn ? { value: nA * qA, why: `${$(P)} is at or above the small firms' minimum AVC, so they produce too.` } : { value: nA * qA + nB * qB, why: `${$(P)} is below the small firms' minimum AVC, so they shut down and supply nothing.` },
              { value: qA + (bOn ? qB : 0), why: "Multiply each firm's quantity by the number of firms of that kind." },
            ]),
            sol: steps("Add up what each firm supplies at the price, remembering that a firm supplies zero when P is below its minimum AVC.",
              `Large firms: ${nA} × ${qA} = ${U.fmt(nA * qA)}. Small firms: ${bOn ? `P ≥ ${$(shutB)}, so ${nB} × ${qB} = ${U.fmt(nB * qB)}` : `P &lt; ${$(shutB)}, so they shut down: 0`}.`,
              `Market quantity supplied = <b>${U.fmt(ans)}</b>.`),
          });
        },
      },
      {
        name: "Select all: points on the supply curve",
        make() {
          for (let tries = 0; tries < 100; tries++) {
            const F = firm("loss");
            const { T, S, k } = F;
            const prices = [];
            for (let p = Math.ceil(T.minAVC * 0.6 / k) * k; p < T.mc[T.N]; p += k) { const b = bestQ(T, p); if (b && !T.mc.includes(p)) prices.push({ p, q: b.q }); }
            const shut = prices.filter(x => x.q === 0), on = prices.filter(x => x.q > 0);
            if (shut.length < 1 || on.length < 4) continue;
            const picks = U.shuffle(U.sample(on, 4).concat(U.sample(shut, 1)));
            const nT = U.randInt(1, 4);
            const opts = picks.map((x, i) => {
              const right = { t: `At ${$(x.p)}, it supplies ${qty(x.q, S.g)}`, ok: true, why: x.q === 0 ? `${$(x.p)} is below minimum AVC (${$2(T.minAVC)}), so it supplies zero.` : `MC of unit ${x.q} (${$(T.mc[x.q])}) is below ${$(x.p)} and the next unit's MC is above it.` };
              if (i < nT) return right;
              const wrongQ = x.q === 0 ? (mcRuleQ(T, x.p) || T.qAVC) : (x.q + 1 <= T.N && i % 2 ? x.q + 1 : x.q - 1);
              if (wrongQ === x.q) return right;
              return { t: `At ${$(x.p)}, it supplies ${qty(wrongQ, S.g)}`, ok: false, why: x.q === 0 ? `${$(x.p)} is below minimum AVC (${$2(T.minAVC)}), so it supplies zero.` : `At ${$(x.p)} the firm supplies ${x.q}: produce each unit whose MC is below the price.` };
            });
            return Q.multi({
              q: `${S.name} is a price taker with these costs:${costHtml(T, ["mc", "avc"], true)}Select <b>all</b> statements that correctly describe its short-run supply.`,
              options: opts,
              sol: steps("Supply = MC above minimum AVC. Below minimum AVC, quantity supplied is 0.",
                `Minimum AVC = ${$2(T.minAVC)}. Above that, quantity supplied is the last unit whose MC is below the price.`,
                `So: ${picks.map(x => `${$(x.p)} → ${x.q}`).join("; ")}.`),
            });
          }
          throw new Error("supply multi");
        },
      },
      {
        name: "Shift of industry supply or movement along it?",
        make() {
          const cats = ["Supply shifts right", "Supply shifts left", "Movement along supply"];
          const items = cats.map(c => U.pick(SHIFT_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m10-shift", SHIFT_BANK, 5)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "For a competitive industry, classify each event's effect on the industry (market) supply curve.",
            cats, items,
            sol: steps("Industry supply is the sum of firms' MC curves (above min AVC). Anything that moves firms' MC, or changes the number of firms, shifts it.",
              "Input prices, productivity, taxes and subsidies, and the number of firms shift supply. A change in the good's own price is a movement along it."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Entry, exit and long-run equilibrium
   * ============================================================ */
  const LRS_BANK = [
    { t: "The industry buys a tiny share of every input it uses, so new firms do not change input prices", cat: "Constant cost (horizontal)", why: "Input prices stay the same as the industry grows, so the long-run price returns to the same minimum ATC." },
    { t: "Entering firms hire from a huge national labor market and buy standard equipment, with no effect on what those cost", cat: "Constant cost (horizontal)", why: "No change in input prices means a horizontal long-run supply curve." },
    { t: "As more vineyards are planted, suitable hillside land becomes scarce and its rent climbs", cat: "Increasing cost (upward-sloping)", why: "Expansion bids up an input price (an external diseconomy), raising every firm's costs." },
    { t: "Expansion of shrimp farming drives up the price of the special feed all farms use", cat: "Increasing cost (upward-sloping)", why: "Higher input prices as the industry grows mean an upward-sloping long-run supply." },
    { t: "Growth of the industry pushes up wages for the scarce skilled workers it needs", cat: "Increasing cost (upward-sloping)", why: "External diseconomies raise costs as output expands." },
    { t: "As the industry grows, specialized suppliers open nearby and sell parts more cheaply", cat: "Decreasing cost (downward-sloping)", why: "Expansion lowers input costs (an external economy), so long-run price falls." },
    { t: "A larger industry supports a training school that cuts every firm's cost of finding skilled workers", cat: "Decreasing cost (downward-sloping)", why: "External economies lower costs as the industry expands." },
    { t: "More growers in the region justify a shared processing plant that lowers each grower's costs", cat: "Decreasing cost (downward-sloping)", why: "Costs fall for every firm as the industry grows." },
  ];
  const genLongRun = STUDY.makeGenerator({
    id: "b251-m10-longrun",
    name: "Entry, exit & long-run equilibrium",
    blurb: "Predict entry and exit from profits and losses, trace their effects on price, profit and the number of firms, and find long-run equilibrium at minimum ATC.",
    variants: [
      {
        name: "Profit or loss signal: entry or exit?",
        make() {
          const S = seller();
          const k = S.k;
          const minATC = U.randInt(10, 30) * k;
          const kase = U.pick(["profit", "loss", "even"]);
          const P = kase === "profit" ? minATC + U.randInt(2, 8) * k : kase === "loss" ? minATC - U.randInt(2, 6) * k : minATC;
          const opts = {
            profit: `Firms enter, market supply increases, and the price falls toward ${$(minATC)}`,
            loss: `Firms exit, market supply decreases, and the price rises toward ${$(minATC)}`,
            even: "Nothing: firms earn a normal return, so none enter or exit",
          };
          const whys = {
            profit: "Entry happens only when firms earn economic profit (P above min ATC).",
            loss: "Exit happens only when firms suffer economic losses (P below min ATC).",
            even: "Firms stay put only when P equals minimum ATC.",
          };
          const right = opts[kase];
          return Q.mc({
            q: `In the perfectly competitive market for ${S.g.p}, the price is ${$(P)} and every firm's minimum ATC is ${$(minATC)}. What happens in the long run?`,
            right,
            wrong: Object.keys(opts).filter(x => x !== kase).map(x => ({ t: opts[x], why: whys[x] }))
              .concat([{ t: `Firms ${kase === "loss" ? "exit" : "enter"}, and the price ${kase === "loss" ? "falls further" : "rises"}`, why: kase === "loss" ? "Exit reduces supply, which raises the price." : "Entry increases supply, which lowers the price." }]),
            sol: steps("Compare price with minimum ATC: economic profit attracts entry, losses cause exit.",
              kase === "profit" ? `P (${$(P)}) &gt; min ATC: economic profit. New firms enter, supply shifts right, price falls until it reaches ${$(minATC)} and profit is zero.`
                : kase === "loss" ? `P (${$(P)}) &lt; min ATC: economic loss. Firms exit, supply shifts left, price rises until it reaches ${$(minATC)}.`
                  : `P = min ATC = ${$(minATC)}: zero economic profit, a normal return. This is long-run equilibrium.`),
          });
        },
      },
      {
        name: "Trace a demand shock to the long run",
        make() {
          const S = seller();
          const up = Math.random() < 0.5;
          const bank = up ? [
            { t: "Market price, in the short run", cat: "Higher" },
            { t: "Each existing firm's output, in the short run", cat: "Higher" },
            { t: "Each firm's economic profit, in the short run", cat: "Higher" },
            { t: "Number of firms, in the long run", cat: "Higher" },
            { t: "Market quantity, in the long run", cat: "Higher" },
            { t: "Market price, in the long run", cat: "Same" },
            { t: "Each firm's economic profit, in the long run", cat: "Same" },
          ] : [
            { t: "Market price, in the short run", cat: "Lower" },
            { t: "Each existing firm's output, in the short run", cat: "Lower" },
            { t: "Each firm's economic profit, in the short run", cat: "Lower" },
            { t: "Number of firms, in the long run", cat: "Lower" },
            { t: "Market quantity, in the long run", cat: "Lower" },
            { t: "Market price, in the long run", cat: "Same" },
            { t: "Each firm's economic profit, in the long run", cat: "Same" },
          ];
          const why = {
            "Market price, in the short run": up ? "Demand shifts right along the existing supply curve, so price rises." : "Demand shifts left along the existing supply curve, so price falls.",
            "Each existing firm's output, in the short run": up ? "Each firm moves up its MC curve to the new, higher price." : "Each firm moves down its MC curve to the lower price.",
            "Each firm's economic profit, in the short run": up ? "P is now above min ATC: positive economic profit." : "P is now below min ATC: an economic loss.",
            "Number of firms, in the long run": up ? "Profit attracts entry." : "Losses cause exit.",
            "Market quantity, in the long run": up ? "More firms each producing at min ATC serve the larger demand." : "Fewer firms serve the smaller demand.",
            "Market price, in the long run": up ? "Entry continues until price is back at min ATC (constant-cost industry)." : "Exit continues until price is back at min ATC (constant-cost industry).",
            "Each firm's economic profit, in the long run": "Back to zero: P = min ATC again.",
          };
          const items = [bank[5], bank[6]].filter(() => Math.random() < 0.6).concat(U.sample(bank.slice(0, 5), 3));
          while (items.length < 4) { const x = U.pick(bank); if (!items.includes(x)) items.push(x); }
          return Q.classify({
            q: `The market for ${S.g.p} is perfectly competitive, a constant-cost industry, and starts in long-run equilibrium. Then demand ${up ? "rises" : "falls"} permanently. Compared with the original equilibrium, classify each item.`,
            cats: ["Higher", "Lower", "Same"],
            items: items.map(i => ({ t: i.t, cat: i.cat, why: why[i.t] })),
            sol: steps(`Short run: the number of firms is fixed. Demand ${up ? "rises" : "falls"}, so price ${up ? "rises" : "falls"}; firms move along their MC curves and earn ${up ? "profits" : "losses"}.`,
              `Long run: ${up ? "profits attract entry" : "losses drive exit"}, shifting market supply ${up ? "right" : "left"} until price is back at minimum ATC.`,
              `End point: price and each firm's profit (zero) are the same as before; the number of firms and market quantity are ${up ? "higher" : "lower"}.`),
          });
        },
      },
      {
        name: "Each firm's long-run output",
        make() {
          const F = firm("profit");
          const { T, S } = F;
          return Q.num({
            q: `Every firm selling ${S.g.p} has these costs:${costHtml(T, ["tc", "atc"], true)}Today firms earn economic profits at a price of ${$(F.P)}. Once entry has pushed the market to long-run equilibrium, how many ${S.g.p} per day will each firm produce? (Assume costs do not change.)`,
            answer: T.qATC, unit: pl(T.qATC, S.g), kind: "count",
            traps: traps(T.qATC, [
              { value: F.q, why: `That is the output at today's price of ${$(F.P)}. Entry will push the price down.` },
              { value: T.qAVC, why: "ATC is still falling there. Long-run equilibrium is at the very bottom of ATC." },
            ]),
            sol: steps("In long-run equilibrium P = minimum ATC, and each firm produces where P = MC, which is at the bottom of ATC.",
              `ATC is lowest (${$2(T.minATC)}) at ${T.qATC} units.`,
              `Each firm produces <b>${T.qATC}</b> and earns zero economic profit.`),
          });
        },
      },
      {
        name: "Number of firms in long-run equilibrium",
        make() {
          const S = seller();
          const k = S.k;
          const minATC = U.randInt(5, 20) * k;
          const qf = U.randInt(4, 20) * 10;
          const n = U.randInt(20, 120);
          const Qd = n * qf;
          const b = U.pick([10, 20, 25, 50, 100]) / k;
          const a = Qd + b * minATC;
          if (!Number.isInteger(a) || !Number.isInteger(b)) return this.make();
          return Q.num({
            q: `In a constant-cost, perfectly competitive market for ${S.g.p}, market demand is Q<sub>d</sub> = ${U.fmt(a)} − ${U.fmt(b)}P (per day). Each firm's ATC reaches its minimum of ${$(minATC)} at ${qty(qf, S.g)} a day. How many firms will there be in long-run equilibrium?`,
            answer: n, unit: "firms", kind: "count",
            traps: traps(n, [
              { value: Qd, why: "That is the market quantity. Divide it by each firm's output." },
              { value: Math.round(a / qf), why: "Use the quantity demanded at the long-run price, not the demand intercept." },
            ]),
            sol: steps("Long-run equilibrium: P = minimum ATC, and each firm produces at the bottom of its ATC.",
              `P = ${$(minATC)}, so Q<sub>d</sub> = ${U.fmt(a)} − ${U.fmt(b)} × ${U.fmt(minATC)} = ${U.fmt(Qd)}.`,
              `Number of firms = ${U.fmt(Qd)} ÷ ${qf} = <b>${n}</b>.`),
          });
        },
      },
      {
        name: "Why stay at zero economic profit?",
        make() {
          const S = seller();
          return Q.mc({
            q: `In long-run equilibrium, ${S.name} earns zero economic profit. Why doesn't ${S.who} close the ${S.g.firm} and do something else?`,
            right: `Zero economic profit means revenue covers every opportunity cost, including a normal return on ${S.who}'s time and money, so no alternative pays more`,
            wrong: [
              { t: `Because ${S.who} has no other options once the ${S.g.firm} is set up`, why: "In the long run every cost is variable and resources can move; the point is that alternatives pay no more." },
              { t: `${S.who} should leave: zero profit means the ${S.g.firm} is losing money`, why: "Zero economic profit is not a loss. Economic cost already includes a normal return." },
              { t: `Because ${S.who} expects to raise the price once rivals leave`, why: "A competitive firm is a price taker and cannot set its price." },
            ],
            sol: steps("Economic cost includes implicit costs, such as what the owner's time and capital could earn elsewhere.",
              "So zero economic profit = a normal rate of return: the owner earns exactly what the next-best use would pay. There is no gain from leaving and none from entering."),
          });
        },
      },
      {
        name: "Long-run industry supply: constant, increasing or decreasing cost",
        make() {
          const cats = ["Constant cost (horizontal)", "Increasing cost (upward-sloping)", "Decreasing cost (downward-sloping)"];
          const items = cats.map(c => U.pick(LRS_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m10-lrs", LRS_BANK, 5)) if (items.length < 4 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Each describes what happens to input costs as a competitive industry expands through entry. Classify the industry and the shape of its long-run supply curve.",
            cats, items,
            sol: steps("Ask what entry does to the input prices every firm pays.",
              "No change → constant cost (horizontal LR supply). Input prices rise (external diseconomies) → increasing cost (upward-sloping). Input prices fall (external economies) → decreasing cost (downward-sloping)."),
          });
        },
      },
      {
        name: "Predict the adjustment chain",
        make() {
          const S = seller();
          const k = S.k;
          const minATC = U.randInt(10, 25) * k;
          const up = Math.random() < 0.5;
          const P1 = up ? minATC + U.randInt(2, 6) * k : minATC - U.randInt(2, 5) * k;
          const right = up
            ? `Economic profit → firms enter → market supply increases → price falls back to ${$(minATC)} → zero economic profit`
            : `Economic losses → firms exit → market supply decreases → price rises back to ${$(minATC)} → zero economic profit`;
          return Q.mc({
            q: `A constant-cost competitive industry for ${S.g.p} was in long-run equilibrium at ${$(minATC)}. A ${up ? "rise" : "fall"} in demand has moved the market price to ${$(P1)}. Which sequence describes what happens next?`,
            right,
            wrong: up ? [
              { t: `Economic profit → firms exit → market supply decreases → price rises above ${$(P1)}`, why: "Profit attracts firms; it does not drive them out." },
              { t: `Economic profit → firms enter → demand decreases → price falls below ${$(minATC)}`, why: "Entry shifts supply, not demand, and stops once price reaches min ATC." },
              { t: `Economic profit → firms stay at ${$(P1)} permanently`, why: "With free entry, profit cannot last in the long run." },
            ] : [
              { t: `Economic losses → firms enter → market supply increases → price falls further`, why: "Losses drive firms out, not in." },
              { t: `Economic losses → firms exit → demand increases → price rises above ${$(minATC)}`, why: "Exit shifts supply, not demand, and stops once price returns to min ATC." },
              { t: `Economic losses → every firm keeps operating at ${$(P1)} forever`, why: "Firms that can't cover all costs in the long run leave the industry." },
            ],
            sol: steps("Profits and losses are signals that move resources into or out of the industry.",
              up ? `At ${$(P1)} &gt; ${$(minATC)}, firms earn profit, so new firms enter. Supply shifts right and the price falls until it is back at minimum ATC.`
                : `At ${$(P1)} &lt; ${$(minATC)}, firms lose money, so some exit. Supply shifts left and the price rises until it is back at minimum ATC.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Competition and efficiency
   * ============================================================ */
  const EFF_BANK = [
    { t: "Price equals marginal cost", cat: "Allocative efficiency", why: "P measures the value of the last unit to buyers; MC measures its cost to society." },
    { t: "The value buyers place on the last unit equals the cost of producing it", cat: "Allocative efficiency", why: "That is MSB = MSC: the right quantity is produced." },
    { t: "Marginal social benefit equals marginal social cost", cat: "Allocative efficiency", why: "MSB = MSC is the efficient quantity." },
    { t: "No reallocation could make someone better off without making someone else worse off", cat: "Allocative efficiency", why: "That is the definition of an efficient allocation." },
    { t: "Total surplus (consumer + producer surplus) is as large as possible", cat: "Allocative efficiency", why: "Maximum total surplus occurs at the efficient quantity." },
    { t: "Price equals minimum average total cost", cat: "Productive efficiency", why: "Output is produced at the lowest possible cost per unit." },
    { t: "Each firm produces at the bottom of its ATC curve", cat: "Productive efficiency", why: "The bottom of ATC is the lowest cost per unit." },
    { t: "Goods are produced at the lowest possible cost per unit", cat: "Productive efficiency", why: "That is productive efficiency." },
    { t: "Entry and exit have pushed each firm's output to where ATC is lowest", cat: "Productive efficiency", why: "Long-run competition drives firms to minimum ATC." },
  ];
  const EFF_TF = [
    { q: "A perfectly competitive firm in long-run equilibrium is both allocatively and productively efficient.", truth: true, why: "In long-run equilibrium P = MC (allocative) and P = min ATC (productive)." },
    { q: "Allocative efficiency means producing at the lowest possible average total cost.", truth: false, why: "That is productive efficiency. Allocative efficiency is P = MC (MSB = MSC)." },
    { q: "With no external costs or benefits, a competitive market produces the quantity where marginal social benefit equals marginal social cost.", truth: true, why: "Demand is MSB and supply is MSC, so equilibrium is where they are equal." },
    { q: "A competitive firm earning an economic profit in the short run is producing at minimum ATC.", truth: false, why: "With P above min ATC, P = MC occurs to the right of the bottom of ATC." },
    { q: "Competitive firms are allocatively efficient in the short run as well as the long run, because they always produce where P = MC.", truth: true, why: "P = MC holds at every price at which they produce." },
    { q: "At the competitive equilibrium quantity, total surplus could be increased by producing more.", truth: false, why: "Beyond equilibrium MSC exceeds MSB, so extra units would reduce total surplus." },
    { q: "Productive efficiency for a competitive firm means P = minimum ATC.", truth: true, why: "Producing at the bottom of ATC gives the lowest cost per unit." },
    { q: "If the marginal social benefit of the last unit exceeds its marginal social cost, too much is being produced.", truth: false, why: "MSB &gt; MSC means another unit is worth more than it costs: too little is produced." },
  ];
  const genEff = STUDY.makeGenerator({
    id: "b251-m10-efficiency",
    name: "Competition & efficiency",
    blurb: "Tell allocative efficiency (P = MC, MSB = MSC) from productive efficiency (P = min ATC), find the efficient quantity and measure total surplus.",
    variants: [
      {
        name: "Sort conditions by type of efficiency",
        make() {
          const items = U.deal("m10-eff-a", EFF_BANK.filter(i => i.cat === "Allocative efficiency"), 2)
            .concat(U.deal("m10-eff-p", EFF_BANK.filter(i => i.cat === "Productive efficiency"), 2));
          const extra = U.pick(EFF_BANK.filter(i => !items.includes(i)));
          items.push(extra);
          return Q.classify({
            q: "Classify each condition as describing allocative or productive efficiency.",
            cats: ["Allocative efficiency", "Productive efficiency"], items,
            sol: steps("Allocative = the <em>right amount</em> (P = MC, MSB = MSC, maximum total surplus).",
              "Productive = the <em>lowest cost per unit</em> (P = minimum ATC)."),
          });
        },
      },
      {
        name: "Which efficiency holds? (firm numbers)",
        make() {
          const S = seller();
          const k = S.k;
          const kind = U.pick(["both", "alloc", "prod", "neither"]);
          const P = U.randInt(12, 30) * k;
          let mc, atc, minATC;
          if (kind === "both") { mc = P; minATC = P; atc = P; }
          else if (kind === "alloc") { mc = P; minATC = P - U.randInt(2, 5) * k; atc = minATC + U.randInt(1, 2) * k; }
          else if (kind === "prod") { mc = P - U.randInt(3, 6) * k; minATC = mc; atc = mc; }
          else { mc = P - U.randInt(3, 6) * k; minATC = mc - U.randInt(2, 4) * k; atc = minATC + U.randInt(1, 3) * k; }
          const lbl = { both: "Both allocatively and productively efficient", alloc: "Allocatively efficient only", prod: "Productively efficient only", neither: "Neither" };
          const why = {
            both: "Both needs P = MC and ATC at its minimum.",
            alloc: "Allocatively efficient only needs P = MC with ATC above its minimum.",
            prod: "Productively efficient only needs ATC at its minimum with P ≠ MC.",
            neither: "Neither means P ≠ MC and ATC above its minimum.",
          };
          return Q.mc({
            q: `A firm sells at ${$(P)} per ${S.g.s}. At its current output, marginal cost is ${$(mc)} and average total cost is ${$(atc)}; the lowest point of its ATC curve is ${$(minATC)}. Which describes its output?`,
            right: lbl[kind],
            wrong: Object.keys(lbl).filter(x => x !== kind).map(x => ({ t: lbl[x], why: why[x] })),
            sol: steps("Allocative efficiency: is P = MC? Productive efficiency: is the firm at the bottom of ATC (ATC = min ATC)?",
              `P = ${$(P)} vs MC = ${$(mc)}: ${P === mc ? "equal, so allocatively efficient" : "not equal, so not allocatively efficient"}.`,
              `ATC = ${$(atc)} vs min ATC = ${$(minATC)}: ${atc === minATC ? "at the minimum, so productively efficient" : "above the minimum, so not productively efficient"}.`),
          });
        },
      },
      {
        name: "True or false: efficiency",
        make() {
          const s = U.deal("m10-efftf", EFF_TF, 1)[0];
          return Q.tf({
            q: s.q, truth: s.truth, why: s.why,
            sol: steps("Allocative efficiency: P = MC (MSB = MSC). Productive efficiency: P = min ATC. Long-run competitive equilibrium has both.",
              `${s.truth ? "True" : "False"}. ${s.why}`),
          });
        },
      },
      {
        name: "Efficient quantity from MSB and MSC",
        make() {
          const S = seller();
          const k = S.k;
          const step0 = U.pick([10, 20, 50, 100]);
          const qs = U.randInt(3, 6);
          const v = U.randInt(10, 25) * k, b = U.randInt(1, 3) * k, c = U.randInt(1, 3) * k;
          if (v - b * (8 - qs) <= 0 || v - c * (qs - 1) <= 0) return this.make();
          const rows = [];
          for (let i = 1; i <= 8; i++) rows.push([U.fmt(i * step0), $(v + b * (qs - i)), $(v + c * (i - qs))]);
          return Q.num({
            q: `A competitive market for ${S.g.p} has no externalities. Its demand curve gives the marginal social benefit, and its supply curve gives the marginal social cost:${tbl([cap(S.g.p) + " per day", "MSB (demand price)", "MSC (supply price)"], rows)}What is the efficient quantity?`,
            answer: qs * step0, unit: pl(qs * step0, S.g),
            traps: traps(qs * step0, [
              { value: step0, why: "The first units have the biggest gap between MSB and MSC, but more units are still worth more than they cost." },
              { value: 8 * step0, why: "At the largest quantity MSC is above MSB, so those units waste resources." },
            ]),
            sol: steps("Efficiency: produce while MSB ≥ MSC, and stop where MSB = MSC.",
              `Below ${U.fmt(qs * step0)}, MSB &gt; MSC; above it, MSC &gt; MSB.`,
              `At ${U.fmt(qs * step0)}, MSB = MSC = ${$(v)}: the efficient quantity, and also the competitive equilibrium.`),
          });
        },
      },
      {
        name: "Total surplus at the competitive equilibrium",
        make() {
          const S = seller();
          const qe = U.randInt(2, 8) * 10;
          const pe = U.randInt(8, 30);
          const dTop = pe + U.randInt(4, 16), sBot = Math.max(0, pe - U.randInt(4, 14));
          const cs = (dTop - pe) * qe / 2, ps = (pe - sBot) * qe / 2;
          const ask = U.pick(["total", "cs", "ps"]);
          const ans = ask === "total" ? cs + ps : ask === "cs" ? cs : ps;
          const dEnd = Math.min(qe * 1.8, dTop / (dTop - pe) * qe);
          const sEnd = Math.min(qe * 1.8, (dTop + 4 - sBot) / (pe - sBot) * qe);
          const g = G.plot({ xLabel: `${cap(S.g.p)} (thousands per week)`, yLabel: "Price ($)", xMax: qe * 2, yMax: dTop + 4,
            xTicks: keyTicks(qe * 2, qe / 2, [qe]), yTicks: keyTicks(dTop + 4, 10, [dTop, pe, sBot].filter(x => x > 0)),
            curves: [{ pts: [[0, dTop], [dEnd, dTop - (dTop - pe) / qe * dEnd]], style: "main", label: "D = MSB", labelAt: 0 },
              { pts: [[0, sBot], [sEnd, sBot + (pe - sBot) / qe * sEnd]], style: "alt", label: "S = MSC", labelAt: 1 },
              { pts: [[0, pe], [qe, pe], [qe, 0]], style: "faint" }], points: [{ x: qe, y: pe, label: "E" }], aria: "competitive market with linear demand and supply" });
          const word = { total: "total surplus (consumer + producer surplus)", cs: "consumer surplus", ps: "producer surplus" }[ask];
          return Q.num({
            q: `The graph shows a competitive market for ${S.g.p} with no externalities. Demand starts at ${$(dTop)} and supply at ${$(sBot)} on the price axis; they meet at E (${qe} thousand, ${$(pe)}).${g}What is the ${word} at equilibrium, in thousands of dollars per week?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: cs + ps, why: "That is total surplus; the question asks for one part of it." },
              { value: ask === "cs" ? ps : cs, why: ask === "ps" ? "That is consumer surplus (the triangle above the price)." : "That is producer surplus (the triangle below the price)." },
              { value: pe * qe, why: "That is total spending (P × Q), not surplus." },
              { value: ask === "total" ? (dTop - sBot) * qe : ask === "cs" ? (dTop - pe) * qe : (pe - sBot) * qe, why: "A triangle's area is ½ × base × height; you forgot the ½." },
            ]),
            sol: steps("Consumer surplus is the triangle between demand and the price; producer surplus is the triangle between the price and supply. Each is ½ × base × height.",
              `CS = ½ × ${qe} × (${dTop} − ${pe}) = ${U.fmt(cs)}; PS = ½ × ${qe} × (${pe} − ${sBot}) = ${U.fmt(ps)}.`,
              `${cap(word)} = <b>${$(ans)} thousand</b>. At this quantity MSB = MSC, so total surplus is as large as it can be.`),
          });
        },
      },
      {
        name: "More or less? MSB vs MSC",
        make() {
          const S = seller();
          const k = S.k;
          const q = U.randInt(20, 90) * 10;
          const kind = U.pick(["more", "less", "same"]);
          const msc = U.randInt(10, 30) * k;
          const msb = kind === "more" ? msc + U.randInt(2, 8) * k : kind === "less" ? msc - U.randInt(2, Math.min(8, msc / k - 2)) * k : msc;
          const all = ["Produce more", "Produce less", "Keep the same output: it is efficient"];
          const right = kind === "more" ? all[0] : kind === "less" ? all[1] : all[2];
          return Q.mc({
            q: `At an output of ${U.fmt(q)} ${S.g.p} a week, the marginal social benefit of the last ${S.g.s} is ${$(msb)} and its marginal social cost is ${$(msc)}. To reach the efficient quantity, the economy should:`,
            right, keepOrder: true,
            wrong: all.filter(a => a !== right).map(a => ({ t: a, why: a === all[0] ? "Produce more only when MSB &gt; MSC." : a === all[1] ? "Produce less only when MSC &gt; MSB." : "The output is efficient only when MSB = MSC." })),
            sol: steps("Compare what the last unit is worth (MSB) with what it costs society (MSC).",
              kind === "more" ? `MSB &gt; MSC: one more unit adds ${$(msb - msc)} of net value. <b>Produce more.</b>` : kind === "less" ? `MSC &gt; MSB: the last unit destroyed ${$(msc - msb)} of value. <b>Produce less.</b>` : "MSB = MSC: total surplus is maximized. <b>Keep the same output.</b>"),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Reading the competitive firm's graph
   * ============================================================ */
  function gScenario(kase) {
    const S = seller();
    const gc = graphCase(kase);
    return { S, gc, k: S.k, t: S.t };
  }
  const genGraphs = STUDY.makeGenerator({
    id: "b251-m10-graphs",
    name: "Reading the firm's cost-curve graph",
    blurb: "Read the profit-maximizing output, the profit or loss rectangle, and the break-even and shutdown prices off MC, ATC and AVC curves.",
    variants: [
      {
        name: "Which short-run case does the graph show?",
        make() {
          const kase = U.pick(["profit", "loss", "shut", "even"]);
          const { S, gc, k, t } = gScenario(kase);
          const g = firmGraph({ a: gc.a, F: gc.F, k, t, P: gc.P, xLabel: `${cap(S.g.p)} per day`, aria: "competitive firm with a price line" });
          const lbl = {
            profit: "It earns an economic profit: at P = MC, price is above ATC",
            loss: "It produces at a loss: at P = MC, price is below ATC but above AVC",
            shut: "It shuts down: price is below minimum AVC",
            even: "It breaks even: price equals minimum ATC, so economic profit is zero",
          };
          const why = {
            profit: "Profit needs the price line above ATC at the output where P = MC.",
            loss: "Loss-but-produce needs the price line between AVC and ATC at P = MC.",
            shut: "Shutting down needs the price line below the lowest point of AVC.",
            even: "Break-even needs the price line to just touch the bottom of ATC.",
          };
          return Q.mc({
            q: `The graph shows the cost curves of ${S.name} and the market price of ${S.g.p}.${g}Which describes the ${S.g.firm}'s short-run situation?`,
            right: lbl[kase],
            wrong: Object.keys(lbl).filter(x => x !== kase).map(x => ({ t: lbl[x], why: why[x] })),
            sol: steps("Find where the price line crosses MC (the best output), then compare the price with ATC and AVC at that output.",
              kase === "shut" ? `The price (${$(gc.P * k)}) is below the bottom of AVC (${$((gc.a + 1) * k)}), so producing anything loses more than fixed cost: <b>shut down</b>.`
                : `P = MC at ${U.fmt(gc.q * t)} units, where ATC = ${$(gc.atc * k)}${kase === "loss" ? ` and AVC ≈ ${$(avcF(gc.a, gc.q) * k)}` : ""}.`,
              kase === "profit" ? "Price is above ATC: <b>economic profit</b>." : kase === "loss" ? "Price is below ATC but above AVC: <b>keep producing at a loss</b>." : kase === "even" ? "Price equals minimum ATC: <b>zero economic profit</b> (break-even)." : null),
          });
        },
      },
      {
        name: "Read the profit-maximizing quantity",
        make() {
          const kase = U.pick(["profit", "loss"]);
          const { S, gc, k, t } = gScenario(kase);
          const g = firmGraph({ a: gc.a, F: gc.F, k, t, P: gc.P, xLabel: `${cap(S.g.p)} per day`, aria: "competitive firm with a price line" });
          const ans = gc.q * t;
          const mATC = minATCof(gc.a, gc.F);
          return Q.num({
            q: `${S.name} faces the market price shown.${g}How many ${S.g.p} per day maximize its profit (or minimize its loss)?`,
            answer: ans, unit: pl(ans, S.g),
            traps: traps(ans, [
              { value: 6 * t, why: "That is where AVC is lowest. The best output is where the price line meets MC." },
              { value: Math.round(mATC.q) * t, why: "That is near the bottom of ATC. Profit is maximized where P = MC, not where ATC is lowest." },
              { value: 4 * t, why: "That is the bottom of MC. Use the rising part of MC, where it meets the price line." },
            ]),
            sol: steps("For a price taker MR = P, so the best output is where the price line crosses the <em>rising</em> part of MC.",
              `The price line at ${$(gc.P * k)} meets MC at <b>${U.fmt(ans)}</b> ${S.g.p}.`),
          });
        },
      },
      {
        name: "Profit or loss per unit (rectangle height)",
        make() {
          const kase = U.pick(["profit", "loss"]);
          const { S, gc, k, t } = gScenario(kase);
          const g = firmGraph({ a: gc.a, F: gc.F, k, t, P: gc.P, q: gc.q, atc: gc.atc, guides: true, xLabel: `${cap(S.g.p)} per day`, aria: "firm graph with guide lines at the best output" });
          const ans = Math.abs(gc.P - gc.atc) * k;
          const avcq = avcF(gc.a, gc.q) * k;
          return Q.num({
            q: `The graph shows the costs of ${S.name} and the market price. The dotted lines mark its best output and the ATC at that output.${g}What is its economic ${kase === "profit" ? "profit" : "loss"} <b>per ${S.g.s}</b>?${kase === "loss" ? " (Enter a positive number.)" : ""}`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: r2(Math.abs(gc.P * k - avcq)), why: "You measured to AVC. Profit per unit is the gap between the price and ATC." },
              { value: ans * gc.q * t, why: "That is the total, the whole rectangle. The question asks per unit." },
              { value: gc.P * k, why: "That is the price. Subtract ATC." },
            ]),
            sol: steps("Profit per unit = P − ATC, both read at the profit-maximizing output.",
              `At ${U.fmt(gc.q * t)} units: P = ${$(gc.P * k)}, ATC = ${$(gc.atc * k)}.`,
              `${kase === "profit" ? "Profit" : "Loss"} per unit = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Total profit or loss (rectangle area)",
        make() {
          const kase = U.pick(["profit", "loss"]);
          const { S, gc, k, t } = gScenario(kase);
          const g = firmGraph({ a: gc.a, F: gc.F, k, t, P: gc.P, q: gc.q, atc: gc.atc, rect: true, guides: true, xLabel: `${cap(S.g.p)} per day`, aria: "firm graph with the profit or loss rectangle" });
          const per = (gc.P - gc.atc) * k, qq = gc.q * t;
          const ans = per * qq;
          return Q.num({
            q: `The graph shows the cost curves of ${S.name}, the market price, and the rectangle between the price and ATC at the best output.${g}What is the ${S.g.firm}'s economic profit per day? (Type a loss as a negative number.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: -ans, why: "Check the sign: is the price line above ATC (profit) or below it (loss)?" },
              { value: per, why: "That is profit per unit, the rectangle's height. Multiply by the quantity." },
              { value: gc.P * k * qq, why: "That is total revenue, not profit." },
              { value: r2((gc.P - avcF(gc.a, gc.q)) * k * qq), why: "You used AVC. Profit uses ATC." },
            ]),
            sol: steps("Profit = (P − ATC) × Q: the rectangle's height times its width.",
              `Height: ${$(gc.P * k)} − ${$(gc.atc * k)} = ${$(per)}. Width: ${U.fmt(qq)} ${S.g.p}.`,
              `Profit = ${$(per)} × ${U.fmt(qq)} = <b>${$(ans)}</b>${ans < 0 ? " (a loss)" : ""}.`),
          });
        },
      },
      {
        name: "Read the shutdown or break-even price",
        make() {
          const S = seller();
          const k = S.k, t = S.t;
          const a = U.randInt(2, 6), qb = U.pick([8, 10]);
          const F = (mcF(a, qb) - avcF(a, qb)) * qb;
          const shut = (a + 1) * k, even = mcF(a, qb) * k;
          const askShut = Math.random() < 0.5;
          const g = firmGraph({ a, F, k, t, keys: [shut, even], xLabel: `${cap(S.g.p)} per day`, aria: "MC, ATC and AVC curves" });
          const ans = askShut ? shut : even;
          return Q.num({
            q: `The graph shows the short-run cost curves of ${S.name}.${g}What is its <b>${askShut ? "shutdown" : "break-even"} price</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: askShut ? even : shut, why: askShut ? "That is minimum ATC, the break-even price. The firm keeps producing at a loss until P falls below minimum AVC." : "That is minimum AVC, the shutdown price. Breaking even requires covering all costs: minimum ATC." },
              { value: a * k, why: "That is the bottom of MC. Look for where MC crosses the average cost curve." },
            ]),
            sol: steps(askShut ? "The shutdown price is the minimum of AVC, where MC crosses AVC." : "The break-even price is the minimum of ATC, where MC crosses ATC.",
              askShut ? `AVC bottoms out at ${$(shut)} (at ${U.fmt(6 * t)} units). Shutdown price = <b>${$(shut)}</b>.` : `ATC bottoms out at ${$(even)} (at ${U.fmt(qb * t)} units). Break-even price = <b>${$(even)}</b>.`),
          });
        },
      },
      {
        name: "Quantity supplied after a price change",
        make() {
          const S = seller();
          const k = S.k, t = S.t;
          const a = U.randInt(2, 6), qb = 10;
          const F = (mcF(a, qb) - avcF(a, qb)) * qb;
          const opts = [[8, mcF(a, 8)], [10, mcF(a, 10)], [12, mcF(a, 12)], [0, a - U.randInt(0, 1)]];
          const [q0, p0] = U.pick(opts);
          const g = firmGraph({ a, F, k, t, keys: [p0 * k, (a + 1) * k], xLabel: `${cap(S.g.p)} per day`, aria: "MC, ATC and AVC curves" });
          const ans = q0 * t;
          return Q.num({
            q: `The graph shows the cost curves of ${S.name}. If the market price is ${$(p0 * k)}, how many ${S.g.p} per day will it supply in the short run?`.replace(`${S.name}. If`, `${S.name}.${g}If`),
            answer: ans, unit: pl(ans, S.g), kind: "count",
            traps: traps(ans, q0 === 0 ? [
              { value: 4 * t, why: `That is where MC is lowest, but the price is below minimum AVC (${$((a + 1) * k)}), so the firm shuts down and supplies nothing.` },
              { value: 6 * t, why: "Minimum AVC is the shutdown point. Below it, quantity supplied is zero." },
            ] : [
              { value: 0, why: `${$(p0 * k)} is above minimum AVC (${$((a + 1) * k)}), so the firm produces, even if it makes a loss.` },
              { value: 6 * t, why: "That is the shutdown point; at this price the firm moves further up its MC curve." },
            ]),
            sol: steps("The supply curve is MC above minimum AVC. Check the price against min AVC first.",
              q0 === 0 ? `Min AVC is ${$((a + 1) * k)}; the price ${$(p0 * k)} is below it, so the firm supplies <b>0</b>.`
                : `Min AVC is ${$((a + 1) * k)}; the price is above it. P = MC at <b>${U.fmt(ans)}</b> ${S.g.p}${p0 < mcF(a, qb) ? " (a loss, since P is below min ATC, but less than shutting down)" : ""}.`),
          });
        },
      },
      {
        name: "Long run from the firm's graph",
        make() {
          const kase = U.pick(["profit", "loss", "even"]);
          const { S, gc, k, t } = gScenario(kase);
          const g = firmGraph({ a: gc.a, F: gc.F, k, t, P: gc.P, avc: false, xLabel: `${cap(S.g.p)} per day`, aria: "a typical firm's MC and ATC with the market price" });
          const lbl = {
            profit: "Firms enter, the market price falls, and each firm's profit shrinks to zero",
            loss: "Firms exit, the market price rises, and each firm's losses shrink to zero",
            even: "The industry is in long-run equilibrium: no entry or exit",
          };
          const why = { profit: "Entry follows economic profit (P above ATC).", loss: "Exit follows economic losses (P below ATC).", even: "Long-run equilibrium needs P = minimum ATC." };
          return Q.mc({
            q: `The graph shows a typical firm in the competitive market for ${S.g.p} and the current market price.${g}What happens in the long run?`,
            right: lbl[kase],
            wrong: Object.keys(lbl).filter(x => x !== kase).map(x => ({ t: lbl[x], why: why[x] }))
              .concat([{ t: "Each firm raises its price until it covers ATC", why: "Competitive firms are price takers; only entry or exit changes the market price." }]),
            sol: steps("Compare the price with ATC at the output where P = MC.",
              kase === "profit" ? `P = ${$(gc.P * k)} is above ATC (${$(gc.atc * k)}): profit, so firms enter until P = min ATC.`
                : kase === "loss" ? `P = ${$(gc.P * k)} is below ATC (${$(gc.atc * k)}): losses, so firms exit until P = min ATC.`
                  : `P = ${$(gc.P * k)} equals minimum ATC: zero economic profit, so this is long-run equilibrium.`),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m10", order: 10,
    title: "Module 10 · Perfect Competition",
    short: "M10 · Competition",
    description: "Price takers, profit maximization at MR = MC, profit, loss and shutdown, the short-run supply curve, entry and exit to long-run equilibrium, and efficiency.",
    notes, flashcards, cues,
    generators: [genChars, genProfitMax, genProfit, genShortRun, genSupply, genLongRun, genEff, genGraphs],
  });
})();
