/* ============================================================
 * ECON B251 · Module 11 — Firms and Industries: Monopoly
 * Characteristics of monopoly and barriers to entry, the demand and
 * marginal revenue facing a monopolist vs a competitive firm, profit
 * maximization (MR = MC, price from demand), TR / TC / economic profit,
 * price discrimination vs price differentiation, and the price, output
 * and efficiency comparison with perfect competition (deadweight loss,
 * rent seeking).
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  /* Fictional single sellers. `u` is the unit sold; quantities are small
   * (a handful per period) in schedule problems and larger in equation
   * problems, so each context works at either scale. */
  const MONOS = [
    { firm: "Echo Hollow Caverns", desc: "owns the only cave system in the region that is open to visitors", u: { s: "guided cave tour", p: "guided cave tours" }, per: "per day" },
    { firm: "Rimrock Air Tours", desc: "holds the national park's exclusive permit for helicopter rides over the canyon", u: { s: "helicopter ride", p: "helicopter rides" }, per: "per day" },
    { firm: "Gull Island Ferry", desc: "runs the only ferry to an island with no bridge or airport", u: { s: "car crossing", p: "car crossings" }, per: "per hour" },
    { firm: "Novaxa Pharma", desc: "holds the patent on the only drug that treats a rare skin condition", u: { s: "prescription", p: "prescriptions" }, per: "per day" },
    { firm: "Silver Spring Spa", desc: "owns the only natural hot spring for a hundred miles", u: { s: "soak session", p: "soak sessions" }, per: "per hour" },
    { firm: "Whitewater Outfitters", desc: "holds the only rafting permit on a protected river", u: { s: "rafting trip", p: "rafting trips" }, per: "per day" },
    { firm: "Lumen Optics", desc: "holds the patent on a telescope lens that has no close substitute", u: { s: "lens", p: "lenses" }, per: "per week" },
    { firm: "Valley Link Broadband", desc: "is the only internet provider in a rural county", u: { s: "new subscription", p: "new subscriptions" }, per: "per week" },
    { firm: "Summit Tram Co.", desc: "runs the only aerial tram up to a mountaintop lookout", u: { s: "tram ticket", p: "tram tickets" }, per: "per hour" },
  ];
  const mono = () => U.pick(MONOS);
  const intro = m => `${m.firm}, which ${m.desc},`;
  const poss = n => (/s$/.test(n) ? n + "'" : n + "'s");

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pl = (n, u) => (n === 1 ? u.s : u.p);
  const qty = (n, u) => `${U.fmt(n)} ${pl(n, u)}`;
  const $ = x => U.money(x);
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  function ord(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  const coef = b => (b === 1 ? "" : U.fmt(b));
  const demEq = (a, b) => `P = ${U.fmt(a)} − ${coef(b)}Q`;
  const mrEq = (a, b) => `MR = ${U.fmt(a)} − ${coef(2 * b)}Q`;

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
  /* Build a classify item list: one from each listed category, then top up from the bank. */
  function dealItems(key, bank, cats, k) {
    const items = cats.map(c => U.pick(bank.filter(i => i.cat === c)));
    for (const extra of U.deal(key, bank, k + 3)) if (items.length < k && !items.includes(extra)) items.push(extra);
    return items;
  }
  /* A select-all question from a true/false bank, with 1 to all-but-one correct. */
  function selectAll(bank, n) {
    const T = bank.filter(o => o.ok), F = bank.filter(o => !o.ok);
    const nT = U.randInt(1, Math.min(T.length, n - 1));
    return U.shuffle(U.sample(T, nT).concat(U.sample(F, n - nT)));
  }

  /* ---------- A monopolist's demand / cost schedule ----------
   * P(q) = P0 − d·q for q = 1..7. MC(q) = m0 + s·(q − 1) (constant if s = 0).
   * MR crosses MC strictly between Qs and Qs + 1, so the best output is
   * unique: MR > MC for every unit up to Qs, MR < MC after. */
  function schedule(minProfit) {
    for (let g = 0; g < 500; g++) {
      const d = U.pick([2, 3, 4, 5, 6]);
      const n = 7;
      const P0 = d * U.pick([10, 12]);   // even multiple of d → MR never exactly 0, TR has a single peak
      const Qs = U.randInt(2, 5);
      const s = U.pick([0, 1, 2, 3, 4]);
      const P = q => P0 - d * q;
      const TR = q => q * P(q);
      const MR = q => TR(q) - TR(q - 1);
      const lo = Math.max(2, MR(Qs + 1) - s * Qs + 1), hi = MR(Qs) - s * (Qs - 1) - 1;
      if (lo > hi) continue;
      const m0 = U.randInt(lo, hi);
      const MC = q => m0 + s * (q - 1);
      const qs = Array.from({ length: n }, (_, i) => i + 1);
      if (qs.some(q => P(q) === MC(q))) continue;
      let Qc = 0;
      qs.forEach(q => { if (P(q) > MC(q)) Qc = q; });
      let Qtr = 1;
      qs.forEach(q => { if (TR(q) > TR(Qtr)) Qtr = q; });
      const VC = q => { let t = 0; for (let i = 1; i <= q; i++) t += MC(i); return t; };
      const room = TR(Qs) - VC(Qs);
      const fcMax = Math.floor((room - (minProfit || 1)) / 5);
      if (fcMax < 1) continue;
      const FC = 5 * U.randInt(1, Math.min(fcMax, 12));
      const TC = q => FC + VC(q);
      const prof = q => TR(q) - TC(q);
      if (qs.some(q => q !== Qs && prof(q) >= prof(Qs))) continue;
      return { d, P0, n, qs, Qs, s, P, TR, MR, MC, VC, FC, TC, prof, Qc, Qtr };
    }
    throw new Error("schedule: no draw");
  }

  /* ---------- Linear demand P = a − bQ with constant MC = c ----------
   * Monopoly: MR = a − 2bQ = c → Qm = k, Pm = c + bk.
   * Competition: P = c → Qc = 2k. */
  function linModel() {
    const b = U.pick([0.5, 1, 1, 2, 2, 3, 4, 5]);
    const kMax = b <= 1 ? 40 : b <= 2 ? 20 : 12;
    let k = U.randInt(4, kMax);
    if (b === 0.5 && k % 2) k++;
    const c = U.randInt(3, 30);
    const Pm = c + b * k, a = c + 2 * b * k;
    return { a, b, c, Qm: k, Pm, Qc: 2 * k, Pc: c, DWL: b * k * k / 2, rect: b * k * k, CSm: b * k * k / 2, CSc: 2 * b * k * k };
  }

  /* ---------- Graph models (integer values that sit on tick marks) ----------
   * rising = false: constant MC = c.  rising = true: MC = m0 + bQ (slope equal
   * to demand's), which keeps the competitive quantity a whole number. */
  function gModel(rising) {
    const b = U.pick([1, 2, 3, 4, 5]);
    if (!rising) {
      const k = U.randInt(2, 6), r = U.randInt(2, 6);
      const c = b * r, a = b * (r + 2 * k);
      return { a, b, m0: c, m1: 0, Qm: k, Pm: c + b * k, MCm: c, Qc: 2 * k, Pc: c, Qd: r + 2 * k, DWL: b * k * k / 2, rising };
    }
    const j = U.randInt(1, 3), Qm = 2 * j, m0 = b * U.randInt(1, 4);
    const a = m0 + 3 * b * Qm;
    return { a, b, m0, m1: b, Qm, Pm: m0 + 2 * b * Qm, MCm: m0 + b * Qm, Qc: 3 * j, Pc: m0 + 3 * b * j, Qd: a / b, DWL: b * j * j, rising };
  }
  /* Profit graph: MC = m0 + m1·Q, TC = FC + m0·Q + m1·Q²/2, so ATC = FC/Q + m0 + m1·Q/2
   * and MC passes through the minimum of ATC. */
  function profitModel(allowLoss) {
    for (let g = 0; g < 400; g++) {
      const Qm = U.pick([4, 6, 8, 10]);
      const b = U.pick([1, 2, 3]);
      const m1 = U.pick([1, 2]);
      const m0 = U.randInt(2, 10);
      const a = m0 + (2 * b + m1) * Qm;
      const Pm = a - b * Qm, MCm = m0 + m1 * Qm;
      const loss = allowLoss && Math.random() < 0.3;
      const f = loss ? U.randInt(Pm - m0 - m1 * Qm / 2 + 2, Pm - m0 - m1 * Qm / 2 + Math.max(3, Math.round(a * 0.25)))
        : U.randInt(2, Pm - m0 - m1 * Qm / 2 - 2);
      if (f < 2) continue;
      const ATCm = f + m0 + m1 * Qm / 2;
      if (!Number.isInteger(ATCm)) continue;
      const yMax = Math.ceil(a * 1.12);
      if (Math.abs(ATCm - Pm) < yMax * 0.09 || Math.abs(ATCm - MCm) < yMax * 0.08 || Math.abs(Pm - MCm) < yMax * 0.1) continue;
      if (ATCm > yMax * 0.92) continue;
      const FC = f * Qm;
      return { a, b, m0, m1, Qm, Pm, MCm, ATCm, FC, profit: (Pm - ATCm) * Qm, loss: Pm < ATCm, yMax };
    }
    throw new Error("profitModel: no draw");
  }

  function lin(x0, y0, x1, y1, n) {
    const N = n || 24, out = [];
    for (let i = 0; i <= N; i++) { const t = i / N; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
    return out;
  }
  const uniqSorted = arr => [...new Set(arr.map(v => U.round(v, 4)))].sort((x, y) => x - y);
  /* Draw demand, MR, MC (and optionally ATC). `names` overrides curve labels;
   * `styles` overrides curve styles. */
  function monoSvg(o) {
    const qd = o.a / o.b;
    const xMax = o.xMax || Math.ceil(qd * 1.1);
    const yMax = o.yMax || Math.ceil(o.a * 1.12);
    const nm = Object.assign({ D: "D", MR: "MR", MC: "MC", ATC: "ATC" }, o.names || {});
    const st = Object.assign({ D: "main", MR: "alt", MC: "dash", ATC: "dash" }, o.styles || {});
    const curves = [
      { pts: lin(0, o.a, qd, 0), style: st.D, label: nm.D, labelAt: 22 },
      { pts: lin(0, o.a, qd / 2, 0), style: st.MR, label: nm.MR, labelAt: 21 },
    ];
    if (o.m0 != null) {
      const xEnd = o.m1 > 0 ? Math.min(xMax, (yMax * 0.96 - o.m0) / o.m1) : xMax * 0.97;
      curves.push({ pts: lin(0, o.m0, xEnd, o.m0 + o.m1 * xEnd), style: st.MC, label: nm.MC, labelAt: o.m1 > 0 ? 2 : 23 });
    }
    if (o.FC) {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const q = 0.2 + (xMax - 0.2) * i / 80;
        const y = o.FC / q + o.m0 + o.m1 * q / 2;
        if (y <= yMax * 0.97) pts.push([q, y]);
      }
      curves.push({ pts, style: st.ATC, label: nm.ATC, labelAt: Math.max(0, pts.findIndex(p => p[0] >= xMax * 0.84)) });
    }
    for (const gd of (o.guides || [])) curves.push({ pts: gd, style: "faint" });
    return G.plot({ xLabel: o.xLabel || "Quantity", yLabel: o.yLabel || "Price and cost ($)", xMax, yMax,
      xTicks: o.xTicks, yTicks: o.yTicks, curves, points: o.points || [], aria: o.aria || "Monopoly graph" });
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "What makes a monopoly",
      lo: "Define and explain the characteristics of a monopoly, including the barriers to entry that create and protect it.",
      html: `<p>A <b>monopolist</b> is the <b>single supplier</b> of a good or service that has <b>no close substitute</b>. Both parts matter. The only coffee shop on a block is not a monopoly if there is a bakery café and a tea house next door, because buyers can switch easily. The only firm that can legally sell a patented medicine with no rival treatment is.</p>
<p>Because it is the whole industry, a monopolist has <b>market power</b>: it can influence the market price by changing how much it offers for sale. It is a <b>price maker</b> (price setter), not a price taker.</p>
<p>A monopoly lasts only if something stops rivals from entering when they see its profits. That something is a <b>barrier to entry</b>. The main sources are:</p>
<table class="data-tbl"><thead><tr><th>Barrier</th><th>How it keeps rivals out</th><th>Illustration</th></tr></thead><tbody>
<tr><td><b>Legal or government restrictions</b></td><td>The law itself limits who may sell. A <em>legal monopoly</em> comes from a <b>public franchise</b> (an exclusive right granted by government), a <b>government license</b>, or a <b>patent or copyright</b>.</td><td>A county gives one company the sole franchise to run airport shuttles; a firm patents a new battery chemistry.</td></tr>
<tr><td><b>Economies of scale (natural monopoly)</b></td><td>Average cost keeps falling over the whole range of output the market wants, so one firm can supply everyone more cheaply than two or more could.</td><td>One network of water pipes serves a town; a second network under every street would roughly double the fixed cost.</td></tr>
<tr><td><b>Ownership of a key resource</b></td><td>The firm controls an input that has no close substitute.</td><td>A resort owns the only hot spring in the region.</td></tr>
<tr><td><b>Problems raising enough capital</b></td><td>Entry needs enormous up-front funds that lenders will not risk on a newcomer.</td><td>A rival would need billions to build a chip plant before selling anything.</td></tr>
</tbody></table>
<p>A <b>cartel</b> is a related idea: a group of producers who agree to set a common price and output quotas so that they act together like a single seller instead of competing.</p>
<div class="keyidea"><b>Key idea.</b> Single seller + no close substitutes + barriers to entry. Remove the barriers and the long-run profits attract entrants, so the monopoly erodes.</div>
<div class="example"><b>Example (natural monopoly).</b> A fiber network for a town of 5,000 homes has a fixed cost that works out to $200,000 a month, plus $30 a month in operating cost for each home served. With one provider serving all 5,000 homes, average cost is $200,000 ÷ 5,000 + $30 = $40 + $30 = <b>$70</b> per home. If two providers each build a full network and split the town 2,500–2,500, each pays the full $200,000 but spreads it over half as many homes: $80 + $30 = <b>$110</b> per home. Duplicating the network wastes resources, which is why a single provider has the cost advantage.</div>
<div class="trap"><b>Common trap.</b> "Price maker" does not mean the monopolist can charge any price and still sell as much as it likes. It chooses a price, but buyers then decide how much to buy at that price. The demand curve is still a constraint.</div>`,
      gens: ["b251-m11-traits"],
    },
    {
      title: "Monopoly vs perfect competition: demand and marginal revenue",
      lo: "Compare the demand and marginal revenue facing a monopolist with those facing a perfectly competitive firm, and explain why MR is less than price for a single-price monopolist.",
      html: `<p>A perfectly competitive firm is one of many sellers of an identical product. It can sell as much as it wants at the market price, so it faces a <b>horizontal (perfectly elastic)</b> demand curve. Every extra unit brings in exactly the price: <b>P = MR</b>.</p>
<p>A monopolist <em>is</em> the industry, so the demand curve it faces is the <b>downward-sloping market demand curve</b>. To sell one more unit it must <b>lower its price</b>, and a single-price monopolist must lower it on <em>every</em> unit, not only the extra one. Marginal revenue therefore has two parts:</p>
<ul>
  <li>a <b>gain</b>: the new, lower price collected on the extra unit, and</li>
  <li>a <b>loss</b>: the price cut multiplied by all the units it was already selling.</li>
</ul>
<p>MR = gain − loss, so <b>MR &lt; P</b> for every unit after the first. With a straight-line demand curve P = a − bQ, the MR curve starts at the same intercept and is <b>twice as steep</b>: MR = a − 2bQ. It hits zero at half the quantity where demand hits zero.</p>
${G.plot({ xLabel: "Quantity (one competitive firm)", yLabel: "Price ($)", xMax: 10, yMax: 24, xTicks: [2, 4, 6, 8, 10], yTicks: [6, 12, 18, 24],
    curves: [{ pts: [[0, 12], [10, 12]], style: "main", label: "d = MR = P", labelAt: 0 }], aria: "Horizontal demand facing a competitive firm" })}
${G.plot({ xLabel: "Quantity (whole market = the monopolist)", yLabel: "Price and MR ($)", xMax: 22, yMax: 24, xTicks: [5, 10, 15, 20], yTicks: [5, 10, 15, 20],
    curves: [{ pts: lin(0, 20, 20, 0), style: "main", label: "D = AR", labelAt: 20 }, { pts: lin(0, 20, 10, 0), style: "alt", label: "MR", labelAt: 21 }],
    points: [{ x: 6, y: 14, label: "P" }, { x: 6, y: 8, label: "MR" }], aria: "Downward-sloping demand and MR facing a monopolist" })}
<p><b>Elasticity.</b> Where MR is positive, a price cut raises total revenue, so demand is <b>elastic</b>. Where MR = 0, demand is <b>unit elastic</b> and total revenue is at its maximum. Where MR is negative, demand is <b>inelastic</b>. A profit-maximizing monopolist never produces where MR is negative, because MC is positive, so it always ends up on the elastic part of its demand curve. The more imperfect substitutes exist, the more elastic its demand.</p>
<div class="example"><b>Example.</b> The only snack kiosk inside a train station sells 10 sandwiches an hour at $8. To sell an 11th it must cut the price to $7.80 for everyone. Gain: $7.80 from the 11th sandwich. Loss: 10 × $0.20 = $2.00 on the ten it was already selling. MR = $7.80 − $2.00 = <b>$5.80</b>, well below the $7.80 price. (Check with totals: TR goes from 10 × $8 = $80 to 11 × $7.80 = $85.80, a rise of $5.80.)</div>
<div class="keyidea"><b>Key idea.</b> Perfect competition: demand facing the firm is horizontal and P = MR. Monopoly: demand is the market demand, it slopes down, and MR &lt; P.</div>
<div class="trap"><b>Common trap.</b> MR is not "the price of the next unit." That is only true for a price taker. For a monopolist the price of the extra unit is the gain; you must subtract the revenue lost on the units it was already selling.</div>`,
      gens: ["b251-m11-mr", "b251-m11-graphs"],
    },
    {
      title: "Profit maximization: MR = MC, then price from demand",
      lo: "Determine the profit-maximizing output and price of a monopoly using the rule MR = MC.",
      html: `<p>Because it faces a downward-sloping demand curve, a monopolist is a <b>price searcher</b>: it must find the price–output combination that earns the most profit. It uses the same marginal rule as any firm, in two steps:</p>
<ol>
  <li><b>Quantity:</b> produce every unit whose marginal revenue exceeds its marginal cost, and stop where <b>MR = MC</b>. Below that output, an extra unit adds more to revenue than to cost; beyond it, an extra unit adds more to cost than to revenue.</li>
  <li><b>Price:</b> go <b>up to the demand curve</b> at that quantity. The price is the highest price buyers will pay for that many units.</li>
</ol>
<div class="example"><b>Example (schedule).</b> A riverboat company is the only operator on a scenic gorge. Fixed cost is $20 a day.
${tbl(["Trips", "Price", "TR", "MR", "MC"], [[1, "$30", "$30", "$30", "$6"], [2, "$27", "$54", "$24", "$8"], [3, "$24", "$72", "$18", "$10"], [4, "$21", "$84", "$12", "$13"], [5, "$18", "$90", "$6", "$16"], [6, "$15", "$90", "$0", "$20"]])}
MR &gt; MC for the 1st, 2nd and 3rd trips (the 3rd adds $18 of revenue and $10 of cost). The 4th trip adds only $12 of revenue but $13 of cost, so stop at <b>3 trips</b>. The price is read from the demand (price) column at 3 trips: <b>$24</b>. TR = 3 × $24 = $72; TC = $20 + $6 + $8 + $10 = $44; profit = <b>$28</b>, more than at any other output (2 trips: $20; 4 trips: $27).</div>
${monoSvg({ a: 34, b: 2, m0: 4, m1: 1, FC: 30, xMax: 18, yMax: 37, xTicks: [6, 17], yTicks: [10, 12, 22, 34], xLabel: "Quantity per day", yLabel: "Price, MR and cost ($)",
    points: [{ x: 6, y: 22, label: "M" }, { x: 6, y: 10, label: "E" }], guides: [[[6, 0], [6, 22]]], aria: "Monopoly chooses Q where MR = MC and charges the price on demand" })}
<p>On the graph, MR and MC cross at point E, where Q = 6. Going straight up to the demand curve gives the monopoly point M: price $22. Note that MR = MC = $10 at that output, but the price is $22.</p>
<div class="keyidea"><b>Key idea.</b> Quantity from MR = MC; price from the demand curve at that quantity. For a single-price monopolist, P &gt; MR = MC at the profit-maximizing output.</div>
<div class="trap"><b>Common trap.</b> Two classic mistakes: (1) charging the price where MR and MC cross ($10 above). That is a cost, not what buyers will pay. (2) Choosing the output where the MC curve crosses the demand curve (P = MC). That is the competitive outcome, not the monopoly's. A third: maximizing total revenue (where MR = 0) ignores costs.</div>`,
      gens: ["b251-m11-profitmax", "b251-m11-graphs"],
    },
    {
      title: "Total revenue, total cost and monopoly profit",
      lo: "Calculate total revenue, total cost and economic profit (or loss) for a monopoly.",
      html: `<p>Once the monopolist has chosen its output Q and price P:</p>
<ul>
  <li><b>Total revenue</b> TR = P × Q.</li>
  <li><b>Total cost</b> TC = ATC × Q, where ATC is average total cost <em>at the chosen output</em> (or TC = fixed cost + the sum of the marginal costs).</li>
  <li><b>Economic profit</b> = TR − TC = <b>(P − ATC) × Q</b>. On a graph it is the rectangle between the price and the ATC at Q, with width Q.</li>
</ul>
<p>Being a monopoly does <b>not</b> guarantee a profit. If demand is weak relative to costs, ATC at the best output can be above the price. The monopolist then makes an <b>economic loss</b> of (ATC − P) × Q. MR = MC still gives the best output: the smallest possible loss. What barriers to entry do guarantee is that <em>if</em> there is a profit, rivals cannot enter and compete it away, so it can last in the long run.</p>
<div class="example"><b>Example.</b> A company that holds the only license to run boat tours of a protected bay chooses 400 tours a month (where MR = MC) and charges $55 a tour. ATC at 400 tours is $40. TR = $55 × 400 = $22,000; TC = $40 × 400 = $16,000; profit = ($55 − $40) × 400 = <b>$6,000</b> a month. If a fuel-price jump raised ATC at that output to $60 (and the best output and price stayed the same), the firm would lose ($60 − $55) × 400 = <b>$2,000</b> a month.</div>
<div class="keyidea"><b>Key idea.</b> Profit per unit is P − ATC, not P − MC. Multiply by Q for total profit.</div>
<div class="trap"><b>Common trap.</b> Using MC instead of ATC: (P − MC) × Q ignores fixed costs and the higher cost of earlier units, so it overstates profit. Also, do not read ATC at the quantity where ATC is lowest; read it at the quantity the firm actually produces.</div>`,
      gens: ["b251-m11-profit", "b251-m11-graphs"],
    },
    {
      title: "Price discrimination vs price differentiation",
      lo: "Differentiate between price discrimination and price differentiation and state the conditions needed for price discrimination.",
      html: `<p><b>Price discrimination</b> is selling a given product at more than one price when the price differences are <b>not</b> due to differences in cost. It can happen:</p>
<ul>
  <li><b>among groups of buyers</b> — e.g. lower prices for students, seniors or residents for the very same service; and</li>
  <li><b>among units of a good</b> — e.g. quantity discounts, when the discount does <em>not</em> reflect a lower cost of supplying larger amounts.</li>
</ul>
<p><b>Price differentiation</b> is setting different prices for similar products because the <b>marginal cost of serving</b> different buyers really is different. A higher price for delivering to a remote address, or a lower per-unit price on a bulk order that genuinely saves handling costs, is differentiation, not discrimination.</p>
<p><b>Conditions for price discrimination.</b> All four must hold:</p>
<ol>
  <li>The firm faces a <b>downward-sloping demand curve</b> (it has some market power).</li>
  <li>It can <b>separate buyers into groups</b> (or units into blocks) at a reasonable cost.</li>
  <li>The groups have <b>different price elasticities of demand</b>.</li>
  <li>It can <b>prevent resale</b> from low-price buyers to high-price buyers.</li>
</ol>
<p>The group with the <b>more elastic</b> demand gets the <b>lower</b> price. Price discrimination converts consumer surplus into economic profit. With <b>perfect price discrimination</b> (each unit sold at the buyer's maximum willingness to pay), the firm's MR equals the price, so it produces until <b>P = MC</b>: output rises to the competitive level, there is no deadweight loss, and the firm captures all the surplus as profit.</p>
<div class="example"><b>Example.</b> A climbing gym is the only one in town. Students' demand is quite elastic (they have little income and many other ways to exercise); working adults' is less elastic. The gym checks student IDs at the desk and day passes carry the holder's name, so passes cannot be resold. It charges students $12 and adults $20 for the same pass, which costs it the same to provide: that is <b>price discrimination</b>. Its $5 surcharge for a pass that includes rental shoes, which it must buy and clean, is <b>price differentiation</b>.</div>
<div class="keyidea"><b>Key idea.</b> Ask <em>why</em> the prices differ. Different willingness to pay (elasticity) with the same cost → discrimination. Different cost of serving → differentiation.</div>
<div class="trap"><b>Common trap.</b> Not every quantity discount is price discrimination. If a bigger order genuinely costs less per unit to supply (one setup, one delivery), the lower price reflects cost: price differentiation.</div>`,
      gens: ["b251-m11-pricedisc"],
    },
    {
      title: "Monopoly vs competition: price, output and efficiency",
      lo: "Compare price, output and efficiency under monopoly and perfect competition, and explain deadweight loss and rent seeking.",
      html: `<p>Imagine a perfectly competitive industry in long-run equilibrium. The industry supply curve is the sum of the firms' MC curves, so the market settles where <b>P = MC</b>: marginal social benefit (read from demand) equals marginal social cost. Output is allocatively efficient and firms earn zero economic profit.</p>
<p>Now suppose one firm buys every competitor and costs do not change. The new monopolist faces the same demand but produces where <b>MR = MC</b> and charges the price on the demand curve. Compared with competition:</p>
<ul>
  <li><b>Price is higher</b> and <b>output is lower</b>.</li>
  <li>Some <b>consumer surplus is transferred</b> to the monopolist as profit (the rectangle between the monopoly price and MC on the units still sold).</li>
  <li>Some surplus simply disappears: the <b>deadweight loss</b>, the triangle between demand and MC from the monopoly output to the competitive output. These are units buyers value above their cost that are no longer produced, because at the monopoly output <b>P &gt; MC</b> (MSB &gt; MSC).</li>
</ul>
${G.plot({ xLabel: "Quantity", yLabel: "Price and cost ($)", xMax: 54, yMax: 55, xTicks: [20, 25, 40, 50], yTicks: [10, 30, 50],
    curves: [{ pts: lin(0, 50, 50, 0), style: "main", label: "D = MSB", labelAt: 3 }, { pts: lin(0, 50, 25, 0), style: "alt", label: "MR", labelAt: 21 },
      { pts: lin(0, 10, 52, 10), style: "dash", label: "MC = S = MSC", labelAt: 1 }, { pts: [[20, 30], [20, 0]], style: "faint" }],
    points: [{ x: 20, y: 30, label: "A" }, { x: 20, y: 10, label: "B" }, { x: 40, y: 10, label: "C" }], aria: "Monopoly vs competitive outcome and deadweight loss" })}
<div class="example"><b>Example.</b> Market demand is P = 50 − Q and MC is a constant $10. <b>Competition:</b> P = MC = $10, so Q = 40 (point C). <b>Monopoly:</b> MR = 50 − 2Q = 10 gives Q = 20, and the price on demand is 50 − 20 = $30 (point A). Price rises by $20 and output falls by 20 units. Transfer from consumers to the monopolist = ($30 − $10) × 20 = <b>$400</b>. Deadweight loss = triangle ABC = ½ × (40 − 20) × ($30 − $10) = <b>$200</b>. Consumer surplus falls from ½ × 40 × $40 = $800 to ½ × 20 × $20 = $200: $600 lost, of which $400 went to the monopolist and $200 went to no one.</div>
<p><b>Rent seeking.</b> Because a monopoly can be so profitable, firms spend real resources trying to get or keep one: lobbying for an exclusive license, legal fights over franchises, campaign contributions. Those resources produce nothing of value, so rent seeking makes the social cost of monopoly <b>even bigger</b> than the deadweight loss triangle.</p>
<div class="keyidea"><b>Key idea.</b> Monopoly: higher P, lower Q, P &gt; MC, a deadweight loss, and a transfer of surplus from buyers to the seller. Competition: P = MC and no deadweight loss.</div>
<div class="trap"><b>Common trap.</b> The transfer rectangle is <em>not</em> the deadweight loss. It is surplus that changes hands (consumers lose it, the monopolist gains it). The deadweight loss is only the triangle that nobody gets.</div>`,
      gens: ["b251-m11-compare", "b251-m11-graphs"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m11-c-monopolist", tag: "Definition", front: "What is a <em>monopolist</em>?", back: "The <b>single supplier</b> of a good or service that has <b>no close substitute</b>." },
    { id: "b251-m11-c-marketpower", tag: "Definition", front: "What is <em>market power</em>?", back: "The ability to influence the market — in particular the market price — by changing the total quantity offered for sale." },
    { id: "b251-m11-c-barrier", tag: "Definition", front: "What is a <em>barrier to entry</em>, and why does it matter for monopoly?", back: "Anything that keeps new firms from entering the industry. It is what lets a monopolist keep earning <b>economic profit in the long run</b>." },
    { id: "b251-m11-c-sources", tag: "Principle", front: "List the main sources of monopoly (barriers to entry).", back: "1) <b>Legal / government restrictions</b> (franchise, license, patent or copyright); 2) <b>economies of scale</b> (natural monopoly); 3) <b>ownership of a key resource</b> with no close substitute; 4) <b>problems raising adequate capital</b>." },
    { id: "b251-m11-c-legal", tag: "Definition", front: "What creates a <em>legal monopoly</em>? Give the three main forms.", back: "Government restricts entry by law: a <b>public franchise</b> (an exclusive right to supply), a <b>government license</b>, or a <b>patent / copyright</b>." },
    { id: "b251-m11-c-natural", tag: "Definition", front: "What is a <em>natural monopoly</em>?", back: "A monopoly that arises from the industry's cost conditions: <b>large economies of scale</b>, so one firm can supply the whole market at a lower average cost than two or more firms could." },
    { id: "b251-m11-c-natural-ex", tag: "Example", front: "Why does a town usually have only one set of water mains?", back: "A second network would duplicate a huge fixed cost. Spreading that cost over all customers, one firm has a lower average cost than two firms splitting the market: a <b>natural monopoly</b>." },
    { id: "b251-m11-c-cartel", tag: "Definition", front: "What is a <em>cartel</em>?", back: "An association of producers that agree to set common prices and output quotas so that they do not compete with each other." },
    { id: "b251-m11-c-pricemaker", tag: "Distinction", front: "Price maker vs price taker?", back: "A <b>price taker</b> (perfectly competitive firm) must accept the market price. A <b>price maker</b> (monopolist) chooses its price, but buyers' demand then determines how much it sells." },
    { id: "b251-m11-c-demand", tag: "Principle", front: "What demand curve does a monopolist face?", back: "The <b>market demand curve</b> — it is the whole industry — so its demand slopes <b>downward</b>: to sell more it must lower its price." },
    { id: "b251-m11-c-pc-vs-m", tag: "Distinction", front: "Demand facing the firm: perfect competition vs monopoly?", back: "Perfect competition: <b>horizontal</b> (perfectly elastic) at the market price, so P = MR. Monopoly: the <b>downward-sloping</b> market demand, so MR &lt; P." },
    { id: "b251-m11-c-mr-lt-p", tag: "Why", front: "Why is MR less than price for a single-price monopolist?", back: "To sell one more unit it must cut the price on <b>all</b> units. MR = price of the extra unit (gain) − price cut × units already sold (loss)." },
    { id: "b251-m11-c-mr-calc", tag: "Calculation", front: "A monopolist sells 12 units at $15. To sell 13 it must charge $14. What is the MR of the 13th unit?", back: "TR rises from 12 × $15 = $180 to 13 × $14 = $182, so <b>MR = $2</b>. (Gain $14 − loss 12 × $1 = $2.)" },
    { id: "b251-m11-c-mr-linear", tag: "Formula", front: "If demand is P = a − bQ, what is MR?", back: "<b>MR = a − 2bQ</b>: same vertical intercept, twice the slope. MR = 0 at Q = a/(2b), half the demand curve's horizontal intercept." },
    { id: "b251-m11-c-elastic", tag: "Principle", front: "How does MR relate to the elasticity of demand?", back: "MR &gt; 0 → <b>elastic</b> (price cut raises TR). MR = 0 → <b>unit elastic</b> (TR at its maximum). MR &lt; 0 → <b>inelastic</b>. A monopolist produces only on the <b>elastic</b> part." },
    { id: "b251-m11-c-searcher", tag: "Definition", front: "What is a <em>price searcher</em>?", back: "A firm with a downward-sloping demand curve that must find the price–output combination that maximizes profit." },
    { id: "b251-m11-c-rule", tag: "Principle", front: "How does a monopolist choose output and price?", back: "Output where <b>MR = MC</b>; price from the <b>demand curve</b> at that output (the highest price buyers will pay for that quantity)." },
    { id: "b251-m11-c-why-mrmc", tag: "Why", front: "Why not produce beyond the output where MR = MC?", back: "Each extra unit beyond it adds more to cost than to revenue (MC &gt; MR), so profit falls. Below it, an extra unit adds more to revenue than to cost, so expanding raises profit." },
    { id: "b251-m11-c-price-trap", tag: "Why", front: "At the monopoly output, MR = MC = $10 and the demand curve is at $22. What price is charged?", back: "<b>$22</b> — the price comes from demand. $10 is the marginal cost (and MR) of the last unit, not what buyers pay." },
    { id: "b251-m11-c-profit", tag: "Formula", front: "Monopoly economic profit", back: "Profit = TR − TC = <b>(P − ATC) × Q</b>, with ATC measured at the chosen output." },
    { id: "b251-m11-c-loss", tag: "Why", front: "Is a monopolist guaranteed an economic profit?", back: "<b>No.</b> If ATC at the best output exceeds the price, it makes a loss of (ATC − P) × Q. Barriers only protect a profit if there is one." },
    { id: "b251-m11-c-tr-max", tag: "Distinction", front: "Does a monopolist maximize total revenue?", back: "<b>No.</b> TR is largest where MR = 0, but producing there ignores cost. Profit is maximized where MR = MC, at a smaller output (since MC &gt; 0)." },
    { id: "b251-m11-c-pdisc", tag: "Definition", front: "What is <em>price discrimination</em>?", back: "Selling a given product at more than one price, with the price difference <b>not</b> due to differences in cost — among groups of buyers or among units (some quantity discounts)." },
    { id: "b251-m11-c-pdiff", tag: "Definition", front: "What is <em>price differentiation</em>?", back: "Setting different prices for similar products because the <b>marginal cost</b> of serving different buyers really differs (e.g. a delivery surcharge for remote addresses)." },
    { id: "b251-m11-c-pd-conditions", tag: "Principle", front: "What four conditions are needed for price discrimination?", back: "1) Downward-sloping demand (market power); 2) able to separate buyers at a reasonable cost; 3) groups with <b>different price elasticities</b>; 4) able to <b>prevent resale</b>." },
    { id: "b251-m11-c-pd-who", tag: "Principle", front: "Under price discrimination, which group pays the lower price?", back: "The group with the <b>more elastic</b> demand (more price-sensitive buyers)." },
    { id: "b251-m11-c-qdisc", tag: "Example", front: "A printer charges less per page on big orders because the press setup is a one-time cost. Discrimination or differentiation?", back: "<b>Price differentiation</b>: the lower price reflects a genuinely lower cost per page on big orders." },
    { id: "b251-m11-c-perfect-pd", tag: "Principle", front: "What happens to output, profit and deadweight loss under perfect price discrimination?", back: "Each unit sells at the buyer's maximum price, so MR = P and output rises to where <b>P = MC</b> (the competitive quantity). <b>No deadweight loss</b>; all surplus becomes profit." },
    { id: "b251-m11-c-compare", tag: "Distinction", front: "Same costs: monopoly vs perfect competition — price and output?", back: "Monopoly: <b>higher price, lower output</b>, P &gt; MC. Competition: P = MC, larger output." },
    { id: "b251-m11-c-dwl", tag: "Definition", front: "What is the deadweight loss from monopoly?", back: "The surplus lost because units that buyers value above their marginal cost are not produced: the triangle between demand (MSB) and MC (MSC) from the monopoly output to the competitive output." },
    { id: "b251-m11-c-transfer", tag: "Distinction", front: "Transfer of surplus vs deadweight loss under monopoly?", back: "<b>Transfer</b>: consumer surplus that becomes monopoly profit (P<sub>m</sub> − MC on the units still sold). <b>Deadweight loss</b>: surplus that nobody gets (the lost units)." },
    { id: "b251-m11-c-dwl-calc", tag: "Calculation", front: "Demand P = 40 − Q, MC = $8. Find the monopoly and competitive outcomes and the DWL.", back: "Monopoly: 40 − 2Q = 8 → Q = 16, P = $24. Competition: P = 8 → Q = 32. DWL = ½ × 16 × ($24 − $8) = <b>$128</b>." },
    { id: "b251-m11-c-rent", tag: "Definition", front: "What is <em>rent seeking</em>, and how does it affect the social cost of monopoly?", back: "Spending resources to obtain or protect a monopoly (lobbying, legal battles for exclusive rights). It produces nothing, so it makes the social cost of monopoly <b>larger</b> than the deadweight loss alone." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“only seller”, “no close substitutes”, “exclusive right”", think: "Monopoly", why: "A single supplier of a good with no close substitute." },
    { when: "“patent”, “copyright”, “franchise”, “license required”", think: "Legal barrier to entry", why: "The law restricts who may sell." },
    { when: "“one firm can serve the whole market more cheaply”, “duplicate network”", think: "Natural monopoly (economies of scale)", why: "Average cost falls over the whole range of market demand." },
    { when: "“owns the only …”, “controls all known deposits”", think: "Ownership of a key resource", why: "An essential input with no close substitute keeps rivals out." },
    { when: "“to sell more it must lower its price”", think: "Downward-sloping demand → MR &lt; P", why: "The price cut applies to every unit already sold." },
    { when: "“horizontal demand”, “takes the market price”", think: "Perfect competition: P = MR", why: "Each extra unit sells at the same price." },
    { when: "Demand P = a − bQ", think: "MR = a − 2bQ", why: "Same intercept, twice as steep." },
    { when: "“profit-maximizing output” for a monopolist", think: "MR = MC, then go up to demand for price", why: "Quantity from MR = MC; price from what buyers will pay." },
    { when: "“price where MC crosses demand”", think: "Competitive outcome, not monopoly", why: "P = MC is what a competitive industry would produce." },
    { when: "“economic profit” with P, Q and ATC", think: "(P − ATC) × Q", why: "Profit per unit is P − ATC at the chosen output." },
    { when: "“student / senior / resident discount” on an identical product", think: "Price discrimination", why: "The price gap is not due to a cost difference." },
    { when: "“surcharge that covers the extra cost”, “bulk price reflects lower setup cost”", think: "Price differentiation", why: "Price differences that reflect marginal-cost differences." },
    { when: "“triangle between demand and MC”, “units not produced”", think: "Deadweight loss", why: "Surplus lost because P &gt; MC at the monopoly output." },
    { when: "“lobbying for an exclusive license”", think: "Rent seeking", why: "Resources spent to capture monopoly profit add to monopoly's social cost." },
  ];

  /* ============================================================
   * PRACTICE 1 — Characteristics and barriers to entry
   * ============================================================ */
  const LEGAL = "Legal or government restriction";
  const SCALE = "Economies of scale (natural monopoly)";
  const RES = "Ownership of a key resource";
  const CAPN = "Problems raising enough capital";
  const BARRIER_BANK = [
    { t: "A city grants one company the sole franchise to collect household trash.", cat: LEGAL, why: "An exclusive public franchise is a legal barrier: the law forbids other collectors." },
    { t: "A drug maker holds a 20-year patent on a new asthma inhaler.", cat: LEGAL, why: "A patent legally bars others from making the product." },
    { t: "A publisher holds the copyright on a bestselling fantasy series.", cat: LEGAL, why: "Copyright is a legal restriction on who may sell the work." },
    { t: "The state lets only one firm run its lottery games.", cat: LEGAL, why: "The exclusive right comes from the government, so it is a legal barrier." },
    { t: "Only holders of a federal broadcast license may use a particular radio frequency.", cat: LEGAL, why: "A government license restricts entry." },
    { t: "An airport authority lets only one company operate shuttle buses at the terminal.", cat: LEGAL, why: "An exclusive concession granted by a public body is a public franchise." },
    { t: "A single gas pipeline network can serve a whole city at a lower cost per customer than two competing networks could.", cat: SCALE, why: "Average cost falls over the whole market's output, so one firm is cheapest: a natural monopoly." },
    { t: "Laying a second set of water mains under every street would roughly double the cost of serving the same homes.", cat: SCALE, why: "Huge fixed costs make one supplier cheaper than two: economies of scale." },
    { t: "One railroad track between two small towns has far more capacity than the traffic needs; a second track would sit mostly idle.", cat: SCALE, why: "One firm can serve all demand at lower average cost than two, so it is a natural monopoly." },
    { t: "A rural county's demand supports one hospital; a second would leave both half empty with a much higher cost per patient.", cat: SCALE, why: "Average cost keeps falling as one firm serves more of the market: economies of scale." },
    { t: "A subway system's average cost per rider keeps falling over the whole range of ridership the city generates.", cat: SCALE, why: "Falling average cost over the market's range of output is the mark of a natural monopoly." },
    { t: "One company owns every known deposit of a rare mineral used in jet engines.", cat: RES, why: "Control of an essential input with no substitute keeps rivals out." },
    { t: "A resort owns the only natural hot spring in the region.", cat: RES, why: "The hot spring is a unique resource that rivals cannot get." },
    { t: "A shipping firm controls the only deep-water harbor site along 200 miles of coast.", cat: RES, why: "Owning the one suitable site is ownership of a key resource." },
    { t: "A quarry owner holds the only source of a stone required for restoring a city's historic buildings.", cat: RES, why: "Rivals cannot enter without the unique stone." },
    { t: "A water-bottling company owns the only spring with a naturally high mineral content that its brand depends on.", cat: RES, why: "The unique spring is a key resource without close substitutes." },
    { t: "A rival would need $8 billion to build a chip factory before selling a single chip, and banks will not lend that to an untested firm.", cat: CAPN, why: "The obstacle described is financing the huge up-front investment." },
    { t: "Entering the market for large passenger jets takes over a decade of investment that few investors are willing to fund.", cat: CAPN, why: "The barrier is raising enough capital to enter at all." },
    { t: "A start-up wanting to launch its own satellite network cannot find lenders willing to risk the billions required.", cat: CAPN, why: "The problem is raising adequate capital." },
    { t: "Would-be competitors to a steel mill cannot borrow the enormous sums needed to build a plant of their own.", cat: CAPN, why: "The barrier is access to the capital needed to enter." },
  ];
  const FR = "Public franchise", LIC = "Government license", PAT = "Patent or copyright";
  const LEGAL_BANK = [
    { t: "A county gives one company the exclusive right to provide cable TV service.", cat: FR, why: "An exclusive right to supply, granted by government, is a public franchise." },
    { t: "A city awards a single firm the only right to run its parking meters.", cat: FR, why: "The government grants one supplier the exclusive right: a public franchise." },
    { t: "A state allows only one company to sell food at its highway rest stops.", cat: FR, why: "An exclusive concession from government is a public franchise." },
    { t: "A national park lets only one outfitter run boat tours on its lake.", cat: FR, why: "The park grants one firm the sole right to supply: a public franchise." },
    { t: "To work as a dentist, a person must pass board exams and hold a state license.", cat: LIC, why: "Entry requires a government license." },
    { t: "Only electricians certified by the state may wire new houses.", cat: LIC, why: "A government license restricts who may supply the service." },
    { t: "A city issues a fixed number of permits to operate food carts downtown.", cat: LIC, why: "Selling requires a government-issued license or permit." },
    { t: "A pharmacy may not open without a license from the state board.", cat: LIC, why: "A government license is required to enter." },
    { t: "An inventor's patent stops others from making her new bicycle gear system for 20 years.", cat: PAT, why: "A patent gives the inventor sole rights to the invention." },
    { t: "A game studio's copyright prevents others from selling copies of its game.", cat: PAT, why: "Copyright protects creative works such as software and games." },
    { t: "A seed company holds a patent on a drought-resistant corn variety.", cat: PAT, why: "A patent protects the new variety from copying." },
    { t: "A songwriter's copyright means no one else may sell recordings of her song without permission.", cat: PAT, why: "Copyright protects the song." },
  ];
  const TRAIT_TF = [
    { t: "There is a single seller of the product.", ok: true, why: "That is the defining feature of monopoly." },
    { t: "The product has no close substitutes.", ok: true, why: "Without that, buyers could switch and the seller would have little market power." },
    { t: "Barriers to entry keep other firms from entering.", ok: true, why: "Barriers are what let the monopoly last." },
    { t: "The firm is a price maker: it chooses its price.", ok: true, why: "The monopolist sets the price; buyers choose how much to buy at it." },
    { t: "The demand curve facing the firm is the market demand curve.", ok: true, why: "The monopolist is the whole industry." },
    { t: "To sell more, the firm must lower its price.", ok: true, why: "Market demand slopes downward." },
    { t: "Barriers to entry can let the firm earn economic profit even in the long run.", ok: true, why: "Entry cannot compete the profit away." },
    { t: "The firm can charge any price it likes and still sell as much as it wants.", ok: false, why: "Demand still limits it: a higher price means fewer units sold." },
    { t: "The firm faces a perfectly elastic (horizontal) demand curve.", ok: false, why: "That describes a perfectly competitive firm. A monopolist faces downward-sloping market demand." },
    { t: "A monopolist always earns an economic profit.", ok: false, why: "If ATC is above price at the best output, it makes a loss." },
    { t: "Many firms sell the same product.", ok: false, why: "That is perfect competition. A monopoly has one seller." },
    { t: "In the long run, new firms enter freely whenever there is profit.", ok: false, why: "Barriers to entry block that." },
    { t: "Marginal revenue equals price.", ok: false, why: "For a single-price monopolist, MR is less than price." },
  ];

  const genTraits = STUDY.makeGenerator({
    id: "b251-m11-traits",
    name: "Monopoly traits and barriers to entry",
    blurb: "Recognize a monopoly, classify barriers to entry (legal, natural, resource, capital) and reason about natural monopoly costs.",
    variants: [
      {
        name: "Classify barriers to entry (drop-down)",
        make() {
          const cats = [LEGAL, SCALE, RES, CAPN];
          const items = dealItems("m11-bar", BARRIER_BANK, U.sample(cats, 3), 5);
          return Q.classify({
            q: "Each situation describes what keeps rivals out of a market. Classify the barrier to entry.",
            cats, items,
            sol: steps("Ask <em>what</em> stops a new firm: the law, the cost structure, a unique input, or the money needed to get started.",
              "<b>Legal</b>: franchises, licenses, patents, copyrights. <b>Economies of scale</b>: one firm can serve the whole market at the lowest average cost. <b>Key resource</b>: the firm controls an input with no close substitute. <b>Capital</b>: entry needs funds lenders will not provide."),
          });
        },
      },
      {
        name: "Franchise, license or patent? (drop-down)",
        make() {
          const cats = [FR, LIC, PAT];
          const items = dealItems("m11-legal", LEGAL_BANK, cats, 5);
          return Q.classify({
            q: "All of these are <b>legal</b> barriers to entry. Which kind is each?",
            cats, items,
            sol: steps("A <b>public franchise</b> gives one supplier the exclusive right to serve a market. A <b>license</b> is permission anyone may seek if they meet the requirements (but it limits entry).",
              "A <b>patent</b> protects an invention; a <b>copyright</b> protects a creative work such as a book, song or software."),
          });
        },
      },
      {
        name: "Which seller is a monopoly?",
        make() {
          const right = U.pick([
            "The only ferry line to an island that has no bridge or airport",
            "The patent holder for the only approved treatment for a rare disease",
            "The only water utility in a small town",
            "The owner of the only cave system open to tourists for 300 miles",
          ]);
          const wrong = U.sample([
            { t: "One of 4,000 wheat farms selling identical grain", why: "Many sellers of an identical product: that is perfect competition." },
            { t: "The only pizza shop in a town that also has six burger places and four taco shops", why: "Burgers and tacos are close substitutes for pizza, so the shop has little market power." },
            { t: "One of three national cell-phone carriers", why: "A few large sellers is an oligopoly, not a monopoly." },
            { t: "A coffee shop with a distinctive logo on a street with a dozen other cafés", why: "Many sellers of similar products: close substitutes exist (monopolistic competition)." },
            { t: "The largest of 40 car dealers in a metro area", why: "Being the biggest is not being the only seller; buyers can go to 39 rivals." },
            { t: "The only bookstore in a city where most people buy books online", why: "Online sellers are close substitutes, so the store is not a monopolist." },
          ], 3);
          return Q.mc({
            q: "Which of these sellers is the best example of a <b>monopoly</b>?",
            right, wrong,
            rightWhy: "It is the single seller, buyers have no close substitute, and something (geography, law or ownership) keeps rivals out.",
            sol: steps("Check three things: a <b>single</b> seller, <b>no close substitutes</b>, and <b>barriers</b> that keep rivals out.",
              "Being large, or the only seller of one brand, is not enough if buyers can easily switch to substitutes."),
          });
        },
      },
      {
        name: "Natural monopoly: cost of splitting the market ($)",
        make() {
          const svc = U.pick([
            { what: "piped natural gas", who: "household", whos: "households", firm: "gas company" },
            { what: "water and sewer service", who: "home", whos: "homes", firm: "water utility" },
            { what: "fiber internet", who: "home", whos: "homes", firm: "fiber provider" },
            { what: "district heating", who: "building", whos: "buildings", firm: "heating utility" },
          ]);
          const N = U.pick([2000, 4000, 5000, 6000, 8000, 10000]);
          const r = U.randInt(15, 90);
          const v = U.randInt(10, 45);
          const F = r * N;
          const ans = 2 * r + v;
          return Q.num({
            q: `Supplying ${svc.what} to a town requires a network whose fixed cost works out to <b>${$(F)}</b> per month, plus an operating cost of <b>${$(v)}</b> per ${svc.who} served. The town has ${U.fmt(N)} ${svc.whos}. With one ${svc.firm}, average total cost is ${$(r + v)} per ${svc.who}.<br>If instead <b>two</b> firms each built a full network and split the town equally, what would each firm's <b>average total cost per ${svc.who}</b> be?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: r + v, why: "That is the cost with one firm. Each of two firms has the same fixed cost but only half the customers." },
              { value: v, why: "That leaves out the fixed cost of the network, which each firm must pay in full." },
              { value: 2 * (r + v), why: "Only the fixed cost per customer doubles. The operating cost per customer stays the same." },
              { value: r / 2 + v, why: "Splitting the market spreads each network over <em>fewer</em> customers, so fixed cost per customer rises, not falls." },
            ]),
            sol: steps("Average total cost = fixed cost ÷ customers + operating cost per customer. With two networks, each firm still pays the whole fixed cost.",
              `Each firm serves ${U.fmt(N)} ÷ 2 = ${U.fmt(N / 2)} ${svc.whos}: fixed cost per ${svc.who} = ${$(F)} ÷ ${U.fmt(N / 2)} = ${$(2 * r)}.`,
              `ATC = ${$(2 * r)} + ${$(v)} = <b>${$(ans)}</b>, versus ${$(r + v)} with one firm. Because one firm can serve the market more cheaply, this is a <b>natural monopoly</b>.`),
          });
        },
      },
      {
        name: "Select all monopoly characteristics",
        make() {
          const opts = selectAll(TRAIT_TF, 5);
          return Q.multi({
            q: "Select <b>all</b> statements that are true of a monopoly.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("A monopoly is a single seller of a product with no close substitutes, protected by barriers to entry.",
              "It is a price maker facing the downward-sloping market demand, so it must cut price to sell more, and MR &lt; P. Profit is possible but not guaranteed."),
          });
        },
      },
      {
        name: "What “price maker” means",
        make() {
          const m = mono();
          return Q.mc({
            q: `${intro(m)} is a monopolist. Which statement best describes its pricing power?`,
            right: "It can choose its price, but then buyers' demand determines how many units it sells",
            wrong: [
              { t: "It can choose both its price and the quantity it sells, independently of each other", why: "Demand ties the two together: once it picks a price, buyers decide the quantity (and vice versa)." },
              { t: "It must accept the market price, like any other firm", why: "That describes a price taker in perfect competition. The monopolist is the market." },
              { t: "It sets the highest price any buyer would pay, because buyers have nowhere else to go", why: "At the very highest price it would sell almost nothing. It searches for the price that maximizes profit." },
              { t: "It sets price equal to marginal cost, because it faces no competition", why: "A monopolist charges more than marginal cost; P = MC is the competitive outcome." },
            ],
            rightWhy: "A price maker picks a point on the demand curve: a higher price means fewer units sold.",
            sol: steps("A monopolist faces the downward-sloping market demand curve.",
              "It can pick any point on that curve — a price <em>or</em> a quantity — but not a combination off the curve. That is what “price maker” means."),
          });
        },
      },
      {
        name: "Which is NOT a barrier to entry?",
        make() {
          const right = U.pick([
            "The firm is currently earning large economic profits",
            "Many consumers want to buy the product",
            "The product can be made cheaply in small batches with standard equipment",
            "Any firm may legally copy the product's design",
          ]);
          const why = {
            "The firm is currently earning large economic profits": "Profit is what <em>attracts</em> entry. It is not something that blocks it.",
            "Many consumers want to buy the product": "Strong demand invites entry rather than preventing it.",
            "The product can be made cheaply in small batches with standard equipment": "Low costs at small scale make entry <em>easier</em>; there are no economies of scale to protect an incumbent.",
            "Any firm may legally copy the product's design": "No patent or copyright means no legal barrier at all.",
          };
          const cats = U.sample([LEGAL, SCALE, RES, CAPN], 3);
          const wrong = cats.map(c => { const it = U.pick(BARRIER_BANK.filter(i => i.cat === c)); return { t: it.t.replace(/\.$/, ""), why: `This is a barrier: ${c.toLowerCase()}. ${it.why}` }; });
          return Q.mc({
            q: "Which of the following is <b>not</b> a barrier to entry?",
            right, wrong, rightWhy: why[right],
            sol: steps("A barrier to entry is something that stops a new firm from entering even when the incumbent is profitable.",
              "Legal restrictions, economies of scale, control of a key resource and huge capital requirements are barriers. Profits, strong demand and easy copying are not."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Demand and marginal revenue
   * ============================================================ */
  const MONO = "Monopoly", PCF = "Perfectly competitive firm", BOTH = "Both";
  const COMPARE_BANK = [
    { t: "Faces the downward-sloping market demand curve", cat: MONO, why: "The monopolist is the whole industry, so its demand is market demand." },
    { t: "Must lower its price to sell an extra unit", cat: MONO, why: "Downward-sloping demand means a price cut is needed to sell more." },
    { t: "Marginal revenue is less than price", cat: MONO, why: "The price cut on units already sold pulls MR below P." },
    { t: "Is a price maker", cat: MONO, why: "With market power, the monopolist chooses its price." },
    { t: "Is the only seller in the industry", cat: MONO, why: "That is the definition of monopoly." },
    { t: "Is protected by barriers to entry", cat: MONO, why: "Barriers keep rivals out of a monopoly; a competitive market has free entry." },
    { t: "Faces a horizontal (perfectly elastic) demand curve", cat: PCF, why: "One small firm can sell all it wants at the market price." },
    { t: "Marginal revenue equals price", cat: PCF, why: "Every unit sells at the same market price, so MR = P." },
    { t: "Is a price taker", cat: PCF, why: "It must accept the market price." },
    { t: "Is one of many sellers of an identical product", cat: PCF, why: "That describes perfect competition." },
    { t: "Can sell more output without lowering its price", cat: PCF, why: "Its demand is horizontal at the market price." },
    { t: "Maximizes profit at the output where MR = MC", cat: BOTH, why: "MR = MC is the profit-maximizing rule for every firm." },
    { t: "Its total revenue equals price times quantity", cat: BOTH, why: "TR = P × Q for any single-price seller." },
    { t: "Its demand curve is also its average revenue curve", cat: BOTH, why: "Average revenue = TR ÷ Q = P for any single-price seller." },
  ];

  const genMR = STUDY.makeGenerator({
    id: "b251-m11-mr",
    name: "Monopoly demand and marginal revenue",
    blurb: "Compute marginal revenue from schedules and equations, explain why MR < P, and compare the monopolist with a perfectly competitive firm.",
    variants: [
      {
        name: "MR of a unit from a demand schedule ($)",
        make() {
          const m = mono();
          const d = U.pick([1, 2, 3, 4, 5]);
          const P0 = d * U.randInt(10, 16) + U.pick([0, 5, 10]);
          const P = q => P0 - d * q;
          const k = U.randInt(2, 6);
          const TR = q => q * P(q);
          const ans = TR(k) - TR(k - 1);
          const rows = [1, 2, 3, 4, 5, 6].map(q => [q, $(P(q))]);
          return Q.num({
            q: `${intro(m)} faces this demand schedule (${m.u.p} ${m.per}):${tbl([cap(m.u.p), "Price"], rows)}It charges the same price on every unit. What is the <b>marginal revenue</b> of the <b>${ord(k)}</b> ${m.u.s}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: P(k), why: `That is the price of the ${ord(k)} unit. A single-price monopolist must also cut the price on the ${k - 1} ${pl(k - 1, m.u)} it was already selling, so MR is lower.` },
              { value: TR(k), why: `That is total revenue at ${k} units. MR is the <em>change</em> in total revenue.` },
              { value: TR(k + 1) - TR(k), why: `That is the MR of the ${ord(k + 1)} unit. You moved one row too far.` },
              { value: P(k - 1) - P(k), why: "That is just the price cut per unit. MR is the change in total revenue." },
            ]),
            sol: steps("Marginal revenue = the change in total revenue from selling one more unit. Compute TR = P × Q in the two rows first.",
              `TR(${k}) = ${k} × ${$(P(k))} = ${$(TR(k))}; TR(${k - 1}) = ${k - 1} × ${$(P(k - 1))} = ${$(TR(k - 1))}.`,
              `MR = ${$(TR(k))} − ${$(TR(k - 1))} = <b>${$(ans)}</b>, less than the ${$(P(k))} price.`),
          });
        },
      },
      {
        name: "Gain minus loss: why MR < P ($)",
        make() {
          const m = mono();
          const Q1 = U.randInt(5, 30);
          const P1 = U.randInt(12, 90);
          const cut = U.pick([0.25, 0.5, 1, 1, 2, 2, 3]);
          if (cut >= P1 * 0.2) return this.make();
          const P2 = P1 - cut;
          const loss = Q1 * cut;
          const ans = P2 - loss;
          return Q.num({
            q: `${intro(m)} sells ${qty(Q1, m.u)} ${m.per} at ${$(P1)} each. To sell one more, it must lower its price to ${$(P2)} for <b>all</b> buyers. What is the <b>marginal revenue</b> of that extra ${m.u.s}? (Enter a negative number if revenue falls.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: P2, why: "That is only the gain from the extra unit. Subtract the revenue lost by cutting the price on the units already being sold." },
              { value: -loss, why: "That is only the loss on the old units. Add the price collected on the extra unit." },
              { value: P1, why: "That is the old price. The extra unit sells at the new, lower price — and the cut applies to all units." },
              { value: (Q1 + 1) * P2, why: "That is the new total revenue. MR is the change in total revenue." },
            ]),
            sol: steps("For a single-price monopolist, MR = (price of the extra unit) − (price cut × units already sold).",
              `Gain: ${$(P2)}. Loss: ${U.fmt(Q1)} × ${$(cut)} = ${$(loss)}.`,
              `MR = ${$(P2)} − ${$(loss)} = <b>${$(ans)}</b>. Check: TR goes from ${U.fmt(Q1)} × ${$(P1)} = ${$(Q1 * P1)} to ${U.fmt(Q1 + 1)} × ${$(P2)} = ${$((Q1 + 1) * P2)}.`),
          });
        },
      },
      {
        name: "MR from a linear demand equation ($)",
        make() {
          const m = mono();
          const b = U.pick([0.5, 1, 2, 3, 4]);
          const Qd = U.randInt(10, 40) * (b === 0.5 ? 2 : 1);
          const a = b * Qd;
          let q = U.randInt(Math.ceil(Qd * 0.1), Math.floor(Qd * 0.45));
          if (b === 0.5 && q % 2) q++;
          const ans = a - 2 * b * q;
          return Q.num({
            q: `The demand for ${poss(m.firm)} ${m.u.p} is <b>${demEq(a, b)}</b>, where Q is ${m.u.p} ${m.per}. The firm charges a single price. What is its <b>marginal revenue</b> when it sells Q = ${U.fmt(q)}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: a - b * q, why: "That is the price at that quantity (read from demand). MR is below price for a monopolist." },
              { value: q * (a - b * q), why: "That is total revenue. MR is the slope of TR." },
              { value: a - b * q / 2, why: "The MR line is <em>twice</em> as steep as demand, not half as steep." },
            ]),
            sol: steps("For straight-line demand P = a − bQ, the MR line has the same intercept and twice the slope: MR = a − 2bQ.",
              `Here ${mrEq(a, b)}.`,
              `At Q = ${U.fmt(q)}: MR = ${U.fmt(a)} − ${U.fmt(2 * b)} × ${U.fmt(q)} = <b>${$(ans)}</b> (price is ${$(a - b * q)}).`),
          });
        },
      },
      {
        name: "Monopoly, competitive firm, or both? (drop-down)",
        make() {
          const cats = [MONO, PCF, BOTH];
          const items = dealItems("m11-cmp", COMPARE_BANK, cats, 5);
          return Q.classify({
            q: "Does each statement describe a monopoly, a perfectly competitive firm, or both?",
            cats, items,
            sol: steps("Start from the demand curve each faces: a competitive firm's is horizontal at the market price; a monopolist's is the downward-sloping market demand.",
              "Horizontal demand → price taker, P = MR. Downward demand → price maker, MR &lt; P. Every firm maximizes profit where MR = MC, and for any single-price seller TR = P × Q and AR = P."),
          });
        },
      },
      {
        name: "Elastic, unit elastic or inelastic?",
        make() {
          const m = mono();
          const b = U.pick([1, 2, 4, 5]);
          const Qd = 2 * U.randInt(10, 30);
          const a = b * Qd;
          const mid = Qd / 2;
          const kind = U.pick(["el", "el", "in", "in", "unit"]);
          let q = mid;
          if (kind === "el") q = U.randInt(Math.ceil(Qd * 0.1), Math.floor(mid * 0.8));
          if (kind === "in") q = U.randInt(Math.ceil(mid * 1.2), Math.floor(Qd * 0.9));
          const mr = a - 2 * b * q, p = a - b * q;
          const opts = [
            { t: "Elastic: a small price cut would raise total revenue", k: "el", why: "Elastic demand means MR &gt; 0." },
            { t: "Unit elastic: a small price cut would leave total revenue unchanged", k: "unit", why: "Unit elasticity is where MR = 0." },
            { t: "Inelastic: a small price cut would lower total revenue", k: "in", why: "Inelastic demand means MR &lt; 0." },
          ];
          const right = opts.find(o => o.k === kind);
          return Q.mc({
            q: `Demand for ${poss(m.firm)} ${m.u.p} is <b>${demEq(a, b)}</b>. At Q = ${U.fmt(q)} (price ${$(p)}), demand is:`,
            right: right.t,
            wrong: opts.filter(o => o !== right).map(o => ({ t: o.t, why: `${o.why} Here MR = ${U.fmt(a)} − ${U.fmt(2 * b)} × ${U.fmt(q)} = ${$(mr)}.` })),
            keepOrder: opts.map(o => o.t),
            sol: steps("Use MR: where MR &gt; 0 a price cut raises TR (elastic); MR = 0 is unit elastic; MR &lt; 0 is inelastic.",
              `${mrEq(a, b)}. At Q = ${U.fmt(q)}: MR = ${$(mr)}.`,
              `MR = 0 at Q = ${U.fmt(mid)}, the midpoint of the demand line. ${kind === "el" ? `Q = ${U.fmt(q)} is below the midpoint, so demand is <b>elastic</b>.` : kind === "in" ? `Q = ${U.fmt(q)} is beyond the midpoint, so demand is <b>inelastic</b>. A profit-maximizing monopolist would never produce here.` : "This is exactly the midpoint, so demand is <b>unit elastic</b> and TR is at its maximum."}`),
          });
        },
      },
      {
        name: "Revenue-maximizing quantity from a graph",
        make() {
          const m = mono();
          const Qd = U.pick([8, 12, 16, 20, 24, 40]);
          const b = U.pick([1, 2, 3, 5]);
          const a = b * Qd;
          const stepX = Qd / 4;
          const xt = [1, 2, 3, 4].map(i => i * stepX);
          const yt = [1, 2, 3, 4].map(i => U.round(i * a / 4, 2));
          const svg = monoSvg({ a, b, xTicks: xt, yTicks: yt, xMax: Qd * 1.1, yMax: a * 1.1, xLabel: `${cap(m.u.p)} ${m.per}`, yLabel: "Price and MR ($)", aria: "Demand and MR" });
          const ans = Qd / 2;
          return Q.num({
            q: `The graph shows the demand and marginal revenue curves for ${m.firm}.${svg}At what quantity is the firm's <b>total revenue</b> as large as possible?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: Qd, why: "There the price is zero, so total revenue is zero." },
              { value: Qd / 4, why: "MR is still positive there, so selling more would raise total revenue." },
              { value: 3 * Qd / 4, why: "MR is negative there: selling that much lowers total revenue." },
            ]),
            sol: steps("Total revenue rises while MR is positive and falls once MR turns negative, so TR peaks where <b>MR = 0</b>.",
              `MR hits the horizontal axis at <b>${U.fmt(ans)}</b>, half of demand's horizontal intercept (${U.fmt(Qd)}), because the MR line is twice as steep.`,
              "That is also the unit-elastic point. Note it maximizes revenue, not profit: a monopolist with positive MC produces less than this."),
          });
        },
      },
      {
        name: "Explain why MR is below price",
        make() {
          return Q.mc({
            q: "Why is marginal revenue <b>less than price</b> for a single-price monopolist (after the first unit)?",
            right: "To sell another unit it must cut the price on every unit, so the revenue lost on the units it was already selling offsets part of the extra unit's price",
            wrong: U.sample([
              { t: "Because its marginal cost rises as it produces more", why: "Marginal cost is about cost, not revenue. MR &lt; P comes from the demand side." },
              { t: "Because it faces a perfectly elastic demand curve", why: "With perfectly elastic demand, MR would equal price, as for a competitive firm." },
              { t: "Because the government taxes each extra unit it sells", why: "No tax is needed. MR &lt; P follows from downward-sloping demand alone." },
              { t: "Because it charges each buyer a different price", why: "A firm that charges each buyer their own price (perfect price discrimination) has MR = P, because it does not cut price on earlier units." },
              { t: "Because buyers' incomes fall as they buy more", why: "Incomes are not the reason. A lower price is needed to sell more, and it applies to all units." },
            ], 3),
            rightWhy: "MR = gain (new price on the extra unit) − loss (price cut × earlier units), so MR is below the new price.",
            sol: steps("Think about what happens to revenue when a single-price seller with downward-sloping demand sells one more unit.",
              "It must lower the price — for <em>all</em> buyers. The extra unit adds its price (gain), but the price cut on earlier units subtracts revenue (loss). MR = gain − loss &lt; P."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Profit-maximizing output and price
   * ============================================================ */
  function schedRows(s, cols) {
    return s.qs.map(q => cols.map(c => c === "Q" ? q : c === "P" ? $(s.P(q)) : c === "TR" ? $(s.TR(q)) : c === "MR" ? $(s.MR(q)) : c === "MC" ? $(s.MC(q)) : c === "TC" ? $(s.TC(q)) : ""));
  }
  const PRICE_TF = [
    { t: "The monopolist picks the output where MR = MC, then charges the highest price buyers will pay for that output.", ok: true, why: "Quantity from MR = MC, price from demand." },
    { t: "At the profit-maximizing output, price is greater than marginal cost.", ok: true, why: "P &gt; MR, and MR = MC there, so P &gt; MC." },
    { t: "A profit-maximizing monopolist never produces where marginal revenue is negative.", ok: true, why: "MC is positive, so MR = MC can only happen where MR &gt; 0 (the elastic part of demand)." },
    { t: "If MR is greater than MC at the current output, producing more raises profit.", ok: true, why: "The next unit adds more to revenue than to cost." },
    { t: "Profit per unit at the chosen output is price minus average total cost.", ok: true, why: "Profit = (P − ATC) × Q." },
    { t: "The monopolist charges the price at which its MC curve crosses the demand curve.", ok: false, why: "That is the competitive outcome (P = MC). The monopolist produces less and charges more." },
    { t: "A monopolist maximizes profit by maximizing total revenue.", ok: false, why: "Maximizing TR (MR = 0) ignores cost. Profit is maximized where MR = MC." },
    { t: "At the profit-maximizing output, price equals marginal revenue.", ok: false, why: "That holds for a competitive firm. For a single-price monopolist, P &gt; MR." },
    { t: "The monopolist charges a price equal to the value of MR and MC where they cross.", ok: false, why: "That value is the marginal cost of the last unit. The price comes from the demand curve, which is higher." },
    { t: "Because it is a price maker, a monopolist's output does not depend on its costs.", ok: false, why: "MC determines where MR = MC, so higher costs change the best output and price." },
  ];

  const genProfitMax = STUDY.makeGenerator({
    id: "b251-m11-profitmax",
    name: "Profit-maximizing output and price",
    blurb: "Find the monopolist's best output where MR = MC, read the price from demand, and avoid the P = MC and revenue-maximizing traps.",
    variants: [
      {
        name: "Best quantity from a price and MC schedule",
        make() {
          const m = mono();
          const s = schedule(1);
          const ans = s.Qs;
          return Q.num({
            q: `${intro(m)} faces the demand and marginal cost below (${m.u.p} ${m.per}). It charges a single price.${tbl([cap(m.u.p), "Price", "Marginal cost"], schedRows(s, ["Q", "P", "MC"]))}How many ${m.u.p} should it sell to <b>maximize profit</b>?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: s.Qc, why: "That is the last unit whose <em>price</em> exceeds MC: the competitive rule (P = MC). A monopolist compares MR, not P, with MC." },
              { value: s.Qtr, why: "That output maximizes total revenue (MR ≈ 0) and ignores costs." },
              { value: s.n, why: "Selling every unit in the table includes units whose MC exceeds their MR." },
            ]),
            sol: steps("A monopolist compares <b>marginal revenue</b>, not price, with marginal cost. First build TR = P × Q, then MR = change in TR.",
              `MR by unit: ${s.qs.map(q => `${q}: ${$(s.MR(q))}`).join(", ")}.`,
              `MR &gt; MC through unit ${ans} (${$(s.MR(ans))} vs ${$(s.MC(ans))}); unit ${ans + 1} adds ${$(s.MR(ans + 1))} of revenue but costs ${$(s.MC(ans + 1))}. So sell <b>${qty(ans, m.u)}</b>.`),
          });
        },
      },
      {
        name: "Price comes from demand, not MC ($)",
        make() {
          const m = mono();
          const s = schedule(1);
          const ans = s.P(s.Qs);
          return Q.num({
            q: `${intro(m)} has the following revenue and cost data (${m.u.p} ${m.per}):${tbl([cap(m.u.p), "Price", "Marginal revenue", "Marginal cost"], schedRows(s, ["Q", "P", "MR", "MC"]))}What <b>price</b> should it charge to maximize profit?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: s.MC(s.Qs), why: `That is the marginal cost of the ${ord(s.Qs)} unit. The monopolist charges what buyers will pay for ${s.Qs} units, read from the price (demand) column.` },
              { value: s.MR(s.Qs), why: "That is marginal revenue at the best output. Price is higher than MR for a monopolist." },
              { value: s.P(s.Qc), why: "That is roughly the price where P = MC — the competitive outcome, with more output and a lower price." },
              { value: s.P(s.Qtr), why: "That price maximizes total revenue, not profit." },
            ]),
            sol: steps("Two steps: find the quantity where MR = MC (the last unit with MR &gt; MC), then go to the <b>price column</b> at that quantity.",
              `MR &gt; MC through unit ${s.Qs} (${$(s.MR(s.Qs))} &gt; ${$(s.MC(s.Qs))}); at unit ${s.Qs + 1}, MR ${$(s.MR(s.Qs + 1))} &lt; MC ${$(s.MC(s.Qs + 1))}. Best output: ${s.Qs}.`,
              `Buyers will pay <b>${$(ans)}</b> for ${qty(s.Qs, m.u)}. That is the price, well above MC = ${$(s.MC(s.Qs))}.`),
          });
        },
      },
      {
        name: "Monopoly quantity from equations",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.Qm;
          return Q.num({
            q: `Demand for ${poss(m.firm)} ${m.u.p} is <b>${demEq(L.a, L.b)}</b> (Q = ${m.u.p} ${m.per}), and marginal cost is a constant <b>${$(L.c)}</b>. How many ${m.u.p} does the profit-maximizing monopolist sell?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: L.Qc, why: "That is where P = MC — the competitive quantity. The monopolist sets MR, not P, equal to MC." },
              { value: L.a / (2 * L.b), why: "That is where MR = 0 (maximum total revenue). It ignores marginal cost." },
              { value: L.a / L.b, why: "That is where the price falls to zero." },
            ]),
            sol: steps("Set marginal revenue equal to marginal cost. With P = a − bQ, MR = a − 2bQ.",
              `${mrEq(L.a, L.b)} = ${U.fmt(L.c)} → ${coef(2 * L.b)}Q = ${U.fmt(L.a - L.c)}.`,
              2 * L.b === 1 ? `Q = <b>${U.fmt(ans)}</b>.` : `Q = ${U.fmt(L.a - L.c)} ÷ ${U.fmt(2 * L.b)} = <b>${U.fmt(ans)}</b>.`),
          });
        },
      },
      {
        name: "Monopoly price from equations ($)",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.Pm;
          return Q.num({
            q: `${intro(m)} faces demand <b>${demEq(L.a, L.b)}</b> (Q = ${m.u.p} ${m.per}) and has a constant marginal cost of <b>${$(L.c)}</b>. What <b>price</b> maximizes its profit?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: L.c, why: "That is marginal cost. Setting P = MC is the competitive outcome." },
              { value: L.a - 2 * L.b * L.Qm, why: "That is MR at the best output (equal to MC). The price comes from demand." },
              { value: L.a / 2, why: "That is the revenue-maximizing price (MR = 0), which ignores costs." },
              { value: L.Qm, why: "That is the quantity, not the price. Plug it into the demand equation." },
            ]),
            sol: steps("First find the quantity where MR = MC, then plug it into the <b>demand</b> equation for the price.",
              `${mrEq(L.a, L.b)} = ${U.fmt(L.c)} → Q = ${2 * L.b === 1 ? "" : U.fmt(L.a - L.c) + " ÷ " + U.fmt(2 * L.b) + " = "}${U.fmt(L.Qm)}.`,
              `P = ${U.fmt(L.a)} − ${coef(L.b)}${L.b === 1 ? "" : " × "}${U.fmt(L.Qm)} = <b>${$(ans)}</b>, which is above MC = ${$(L.c)}.`),
          });
        },
      },
      {
        name: "MR vs MC: expand or cut back?",
        make() {
          const m = mono();
          const kind = U.pick(["more", "more", "less", "less", "same"]);
          const mc = U.randInt(8, 40);
          const mr = kind === "more" ? mc + U.randInt(3, 15) : kind === "less" ? mc - U.randInt(3, Math.min(15, mc - 1)) : mc;
          const p = Math.max(mr, mc) + U.randInt(5, 25);
          const q0 = U.randInt(20, 90);
          const opts = [
            { k: "more", t: "Produce more and lower its price" },
            { k: "less", t: "Produce less and raise its price" },
            { k: "same", t: "Keep output and price where they are" },
            { k: "x", t: "Produce more and raise its price" },
          ];
          const why = {
            more: "That is right only if MR &gt; MC, so extra units add more to revenue than to cost.",
            less: "That is right only if MC &gt; MR, so the last units cost more than they bring in.",
            same: "That is right only if MR = MC.",
            x: "Along a downward-sloping demand curve, selling more requires a lower price, not a higher one.",
          };
          const right = opts.find(o => o.k === kind);
          return Q.mc({
            q: `${intro(m)} currently sells ${qty(q0, m.u)} ${m.per} at a price of ${$(p)}. At this output, marginal revenue is <b>${$(mr)}</b> and marginal cost is <b>${$(mc)}</b>. To maximize profit, it should:`,
            right: right.t,
            wrong: opts.filter(o => o !== right).map(o => ({ t: o.t, why: why[o.k] + (o.k !== "x" && kind !== "same" ? ` Here MR is ${$(mr)} and MC is ${$(mc)}.` : "") })),
            keepOrder: opts.map(o => o.t),
            rightWhy: kind === "more" ? "MR &gt; MC, so each extra unit raises profit; to sell more it must move down the demand curve to a lower price." : kind === "less" ? "MC &gt; MR, so cutting output saves more cost than revenue; with fewer units for sale, it can charge more." : "MR = MC: no change in output can raise profit.",
            sol: steps("Compare <b>MR with MC</b>, not price with MC. The price (" + $(p) + ") being above MC is true for every monopolist and is not the test.",
              `MR = ${$(mr)}, MC = ${$(mc)}: ${kind === "more" ? "MR &gt; MC, so expand output" : kind === "less" ? "MR &lt; MC, so cut output" : "MR = MC, so output is already right"}.`,
              kind === "same" ? "Price stays on the demand curve at the current output." : "Output and price move in opposite directions along the demand curve."),
          });
        },
      },
      {
        name: "Cost of maximizing revenue instead of profit ($)",
        make() {
          for (let g = 0; g < 200; g++) {
            const s = schedule(1);
            if (s.Qtr === s.Qs) continue;
            const m = mono();
            const ans = s.prof(s.Qs) - s.prof(s.Qtr);
            return Q.num({
              q: `${intro(m)} has a fixed cost of ${$(s.FC)} ${m.per} and the data below.${tbl([cap(m.u.p), "Price", "Marginal cost"], schedRows(s, ["Q", "P", "MC"]))}A manager proposes selling the quantity that makes <b>total revenue</b> as large as possible. How much <b>less profit</b> would the firm earn than at its profit-maximizing output?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: s.TR(s.Qtr) - s.TR(s.Qs), why: "That compares revenues only. The extra units also add cost." },
                { value: s.prof(s.Qs), why: "That is the maximum profit itself, not the shortfall." },
                { value: s.prof(s.Qtr), why: "That is the profit at the revenue-maximizing output, not the difference." },
                { value: s.VC(s.Qtr) - s.VC(s.Qs), why: "That is only the extra cost. Subtract the extra revenue it brings in." },
              ]),
              sol: steps("Find both outputs: profit is maximized where MR = MC; revenue is maximized where MR = 0 (TR at its peak). Then compare profits.",
                `TR by unit: ${s.qs.map(q => `${q}: ${$(s.TR(q))}`).join(", ")}. TR peaks at ${s.Qtr}. MR &gt; MC through unit ${s.Qs}, so profit peaks at ${s.Qs}.`,
                `Profit at ${s.Qs} = ${$(s.TR(s.Qs))} − (${$(s.FC)} + ${$(s.VC(s.Qs))}) = ${$(s.prof(s.Qs))}. Profit at ${s.Qtr} = ${$(s.TR(s.Qtr))} − (${$(s.FC)} + ${$(s.VC(s.Qtr))}) = ${$(s.prof(s.Qtr))}.`,
                `Shortfall = ${$(s.prof(s.Qs))} − ${s.prof(s.Qtr) < 0 ? "(" + $(s.prof(s.Qtr)) + ")" : $(s.prof(s.Qtr))} = <b>${$(ans)}</b>. The extra units add revenue but cost more than they add (MC &gt; MR).`),
            });
          }
          throw new Error("no draw");
        },
      },
      {
        name: "Select all true statements about the monopoly's choice",
        make() {
          const opts = selectAll(PRICE_TF, 5);
          return Q.multi({
            q: "Select <b>all</b> true statements about how a single-price monopolist chooses its output and price.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Quantity: MR = MC. Price: up to the demand curve at that quantity.",
              "Because MR &lt; P, the price ends up above MC, and the chosen output always has MR &gt; 0 (elastic demand). Revenue maximization and P = MC are both wrong rules for a monopolist."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — TR, TC and economic profit
   * ============================================================ */
  function profitWord() {
    for (let g = 0; g < 200; g++) {
      const q = U.pick([U.randInt(20, 99), 10 * U.randInt(10, 80)]);
      const atc = U.randInt(8, 80);
      const p = atc + U.randInt(3, 40);
      const mc = U.randInt(Math.max(2, atc - 20), p - 2);
      if (mc === atc) continue;
      return { q, atc, p, mc };
    }
  }
  const PL_CATS = ["Economic profit", "Economic loss", "Zero economic profit"];

  const genProfit = STUDY.makeGenerator({
    id: "b251-m11-profit",
    name: "Monopoly revenue, cost and profit",
    blurb: "Compute TR, TC and economic profit (or loss) for a monopolist, and decide when a monopoly makes a profit.",
    variants: [
      {
        name: "Profit = (P − ATC) × Q ($)",
        make() {
          const m = mono();
          const { q, atc, p, mc } = profitWord();
          const ans = (p - atc) * q;
          return Q.num({
            q: `${intro(m)} maximizes profit by selling ${qty(q, m.u)} ${m.per} at ${$(p)} each. At that output, marginal cost is ${$(mc)} and average total cost is ${$(atc)}. What is its <b>economic profit</b> ${m.per}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (p - mc) * q, why: "That uses marginal cost. Profit uses <em>average total</em> cost: (P − ATC) × Q." },
              { value: p * q, why: "That is total revenue. Subtract total cost (ATC × Q)." },
              { value: p - atc, why: "That is profit per unit. Multiply by the number of units sold." },
              { value: atc * q, why: "That is total cost, not profit." },
            ]),
            sol: steps("Economic profit = TR − TC = (P − ATC) × Q, with ATC at the output actually produced. MC is not needed here.",
              `TR = ${$(p)} × ${U.fmt(q)} = ${$(p * q)}; TC = ${$(atc)} × ${U.fmt(q)} = ${$(atc * q)}.`,
              `Profit = ${$(p * q)} − ${$(atc * q)} = (${$(p)} − ${$(atc)}) × ${U.fmt(q)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Profit from a schedule with fixed cost ($)",
        make() {
          const m = mono();
          const s = schedule(1);
          const ans = s.prof(s.Qs);
          return Q.num({
            q: `${intro(m)} has a fixed cost of <b>${$(s.FC)}</b> ${m.per}. Its demand and marginal cost are:${tbl([cap(m.u.p), "Price", "Marginal cost"], schedRows(s, ["Q", "P", "MC"]))}If it chooses its profit-maximizing output and price, what is its <b>economic profit</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: s.TR(s.Qs) - s.VC(s.Qs), why: "That leaves out the fixed cost. TC = fixed cost + the sum of the marginal costs." },
              { value: s.prof(s.Qc), why: "That is the profit where P = MC (the competitive quantity), which is not the monopolist's best output." },
              { value: s.TR(s.Qs), why: "That is total revenue. Subtract total cost." },
              { value: (s.P(s.Qs) - s.MC(s.Qs)) * s.Qs, why: "That uses the MC of the last unit as if every unit cost that much, and it leaves out fixed cost." },
            ]),
            sol: steps("First find the best output (last unit with MR &gt; MC) and its price; then compute TR and TC there.",
              `MR by unit: ${s.qs.map(q => `${q}: ${$(s.MR(q))}`).join(", ")}. MR &gt; MC through unit ${s.Qs}, so Q = ${s.Qs} and P = ${$(s.P(s.Qs))}.`,
              `TR = ${s.Qs} × ${$(s.P(s.Qs))} = ${$(s.TR(s.Qs))}. TC = ${$(s.FC)} + (${s.qs.slice(0, s.Qs).map(q => $(s.MC(q))).join(" + ")}) = ${$(s.TC(s.Qs))}.`,
              `Profit = ${$(s.TR(s.Qs))} − ${$(s.TC(s.Qs))} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "A monopoly making a loss ($)",
        make() {
          const m = mono();
          const q = U.pick([U.randInt(12, 90), 10 * U.randInt(5, 40)]);
          const p = U.randInt(10, 70);
          const atc = p + U.randInt(2, 15);
          const mc = U.randInt(Math.max(2, p - 15), p - 1);
          const ans = (p - atc) * q;
          return Q.num({
            q: `After a new regulation raises its costs, ${intro(m)} finds that its best output is ${qty(q, m.u)} ${m.per}, sold at ${$(p)} each. At that output, average total cost is ${$(atc)} and marginal cost is ${$(mc)}. What is its <b>economic profit</b>? (Enter a negative number for a loss.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: -ans, why: "The magnitude is right, but price is below ATC, so this is a loss: enter it as a negative number." },
              { value: (p - mc) * q, why: "That uses marginal cost instead of average total cost." },
              { value: p - atc, why: "That is the loss per unit. Multiply by the quantity." },
            ]),
            sol: steps("Being a monopoly does not guarantee a profit. Compare price with ATC at the chosen output.",
              `P = ${$(p)} &lt; ATC = ${$(atc)}, so each unit loses ${$(atc - p)}.`,
              `Profit = (${$(p)} − ${$(atc)}) × ${U.fmt(q)} = <b>${$(ans)}</b>: an economic loss. MR = MC still gives the smallest possible loss at this output.`),
          });
        },
      },
      {
        name: "Reverse: find ATC from profit ($)",
        make() {
          const m = mono();
          const { q, atc, p } = profitWord();
          const prof = (p - atc) * q;
          return Q.num({
            q: `${intro(m)} sells ${qty(q, m.u)} ${m.per} at ${$(p)} each and earns an economic profit of ${$(prof)} ${m.per}. What is its <b>average total cost</b> at this output?`,
            answer: atc, unit: "$",
            traps: traps(atc, [
              { value: prof / q, why: "That is profit per unit. ATC = P − profit per unit." },
              { value: p + prof / q, why: "Profit is <em>subtracted</em> from price to get ATC, because profit per unit = P − ATC." },
              { value: p * q - prof, why: "That is total cost. Divide by the quantity to get the average." },
            ]),
            sol: steps("Start from profit = (P − ATC) × Q and solve for ATC.",
              `Profit per unit = ${$(prof)} ÷ ${U.fmt(q)} = ${$(prof / q)}.`,
              `ATC = P − profit per unit = ${$(p)} − ${$(prof / q)} = <b>${$(atc)}</b>. (Check: TC = ${$(p * q)} − ${$(prof)} = ${$(atc * q)}.)`),
          });
        },
      },
      {
        name: "Profit, loss or break-even? (drop-down)",
        make() {
          const firms = U.sample(["Firm A", "Firm B", "Firm C", "Firm D", "Firm E", "Firm F"], 4).sort();
          const kinds = U.shuffle(["Economic profit", "Economic loss", "Zero economic profit", U.pick(["Economic profit", "Economic loss"])]);
          const items = firms.map((f, i) => {
            const k = kinds[i];
            const p = U.randInt(15, 80);
            const atc = k === "Economic profit" ? p - U.randInt(2, 10) : k === "Economic loss" ? p + U.randInt(2, 10) : p;
            const mc = k === "Economic loss" ? p - U.randInt(2, 10) : U.randInt(Math.max(2, Math.min(p, atc) - 12), p - 1);
            const why = k === "Economic profit" ? `P (${$(p)}) &gt; ATC (${$(atc)}).` : k === "Economic loss" ? `P (${$(p)}) &lt; ATC (${$(atc)}), even though P is above MC.` : `P = ATC = ${$(p)}, so TR just covers all costs, including the normal return to the owner.`;
            return { t: `${f}: price ${$(p)}, marginal cost ${$(mc)}, average total cost ${$(atc)} at its best output`, cat: k, why };
          });
          return Q.classify({
            q: "Four monopolists are each producing their profit-maximizing output. Classify each one's economic profit.",
            cats: PL_CATS, items,
            sol: steps("Profit per unit = P − ATC. Marginal cost does not tell you whether the firm is profitable; every monopolist has P &gt; MC.",
              "P &gt; ATC → economic profit. P &lt; ATC → economic loss. P = ATC → zero economic profit (a normal profit)."),
          });
        },
      },
      {
        name: "Best output from total revenue and total cost",
        make() {
          const m = mono();
          const s = schedule(1);
          const ans = s.Qs;
          let minTC = 1; // TC is lowest at the smallest output
          return Q.num({
            q: `${intro(m)} reports these totals (${m.u.p} ${m.per}):${tbl([cap(m.u.p), "Total revenue", "Total cost"], schedRows(s, ["Q", "TR", "TC"]))}Which output <b>maximizes profit</b>?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: s.Qtr, why: "That output gives the largest total revenue, but total cost is higher there too." },
              { value: minTC, why: "Total cost is lowest at the smallest output, but profit = TR − TC is not largest there." },
              { value: s.Qc, why: "That is not where TR − TC is largest; check the gap in each row." },
            ]),
            sol: steps("Profit = TR − TC. Compute the gap in each row and pick the largest. (Equivalently, find where the change in TR, MR, stops exceeding the change in TC, MC.)",
              `Profit by output: ${s.qs.map(q => `${q}: ${$(s.prof(q))}`).join(", ")}.`,
              `The largest is <b>${ans}</b> (${$(s.prof(ans))}). Graphically, that is where the vertical gap between the TR and TC curves is widest.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Monopoly vs perfect competition: price, output, efficiency
   * ============================================================ */
  const HIGH = "Higher under monopoly", LOW = "Lower under monopoly";
  const DIR_BANK = [
    { t: "The market price", cat: HIGH, why: "The monopolist restricts output and charges a price above MC." },
    { t: "The quantity sold", cat: LOW, why: "The monopolist produces where MR = MC, short of where P = MC." },
    { t: "Consumer surplus", cat: LOW, why: "Buyers pay more and buy less; part of their surplus goes to the monopolist and part is lost." },
    { t: "Producer surplus (the seller's economic profit)", cat: HIGH, why: "The monopolist captures part of consumer surplus as profit." },
    { t: "Total surplus (consumer plus producer)", cat: LOW, why: "The deadweight loss is surplus nobody gets, so total surplus falls." },
    { t: "Deadweight loss", cat: HIGH, why: "Competition has none; monopoly creates one by producing too little." },
    { t: "The gap between price and marginal cost", cat: HIGH, why: "Competition has P = MC; monopoly has P &gt; MC." },
  ];
  const EFF_TF = [
    { t: "At the monopoly output, the value buyers place on one more unit (the price) exceeds its marginal cost.", ok: true, why: "P &gt; MC means MSB &gt; MSC, so more output would add surplus." },
    { t: "Some consumer surplus is transferred to the monopolist as profit.", ok: true, why: "The higher price on the units still sold moves surplus from buyers to the seller." },
    { t: "Part of the surplus that existed under competition is lost to everyone.", ok: true, why: "That lost surplus is the deadweight loss." },
    { t: "Resources spent lobbying to obtain or protect a monopoly add to its social cost.", ok: true, why: "Rent seeking uses up resources without producing anything." },
    { t: "With the same costs, a competitive industry would produce where price equals marginal cost.", ok: true, why: "Supply is the sum of MC curves, so the market settles at P = MC." },
    { t: "The monopoly produces less than the allocatively efficient quantity.", ok: true, why: "Efficiency needs P = MC; the monopoly stops short of that." },
    { t: "A monopoly is inefficient because it produces more than the competitive quantity.", ok: false, why: "It produces <em>less</em>, not more." },
    { t: "The surplus transferred from consumers to the monopolist is the deadweight loss.", ok: false, why: "The transfer changes hands; the deadweight loss is surplus nobody receives." },
    { t: "At the monopoly output, marginal social benefit equals marginal social cost.", ok: false, why: "MSB (the price) exceeds MSC (MC) at the monopoly output." },
    { t: "Rent seeking shrinks the social cost of monopoly because the lobbying money is spent in the economy.", ok: false, why: "The resources used in lobbying could have produced valuable goods; rent seeking adds to the social cost." },
    { t: "A monopoly sets price equal to marginal cost, just as a competitive industry does.", ok: false, why: "The monopolist sets MR = MC and charges a price above MC." },
    { t: "Monopoly raises both consumer surplus and producer surplus.", ok: false, why: "Consumer surplus falls." },
  ];
  /* Linear demand with rising MC = m0 + m1·Q, both outcomes integer. */
  function risingModel() {
    const opts = [{ b: 1, m1: 1, l: 6 }, { b: 2, m1: 1, l: 15 }, { b: 1, m1: 2, l: 12 }, { b: 2, m1: 2, l: 12 }, { b: 0.5, m1: 0.5, l: 3 }];
    const o = U.pick(opts);
    const t = U.randInt(2, o.l <= 6 ? 12 : 5);
    const D = o.l * t;
    const m0 = U.randInt(4, 30);
    const a = m0 + D;
    const Qm = D / (2 * o.b + o.m1), Qc = D / (o.b + o.m1);
    if (!Number.isInteger(Qm) || !Number.isInteger(Qc)) return risingModel();
    const Pm = a - o.b * Qm, Pc = a - o.b * Qc, MCm = m0 + o.m1 * Qm;
    return { a, b: o.b, m0, m1: o.m1, Qm, Qc, Pm, Pc, MCm, DWL: (Qc - Qm) * (Pm - MCm) / 2 };
  }
  const mcEq = (m0, m1) => `MC = ${U.fmt(m0)} + ${coef(m1)}Q`;

  const genCompare = STUDY.makeGenerator({
    id: "b251-m11-compare",
    name: "Monopoly vs competition: price, output, efficiency",
    blurb: "Compare monopoly and competitive outcomes, and measure the deadweight loss and the surplus transferred to the monopolist.",
    variants: [
      {
        name: "How much output is lost?",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.Qc - L.Qm;
          return Q.num({
            q: `The market for ${m.u.p} has demand <b>${demEq(L.a, L.b)}</b> and a constant marginal cost of <b>${$(L.c)}</b> per unit. Compare a perfectly competitive industry with a single-price monopoly that has the same costs. <b>By how many units</b> is output lower under monopoly?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: L.Qm, why: "That is the monopoly output itself. Subtract it from the competitive output." },
              { value: L.Qc, why: "That is the competitive output. The question asks for the difference." },
              { value: L.Pm - L.c, why: "That is the price difference, not the quantity difference." },
            ]),
            sol: steps("Competitive industry: P = MC. Monopoly: MR = MC. Solve each for Q.",
              `Competition: ${U.fmt(L.a)} − ${coef(L.b)}Q = ${U.fmt(L.c)} → Q = ${U.fmt(L.Qc)}. Monopoly: ${U.fmt(L.a)} − ${coef(2 * L.b)}Q = ${U.fmt(L.c)} → Q = ${U.fmt(L.Qm)}.`,
              `Output falls by ${U.fmt(L.Qc)} − ${U.fmt(L.Qm)} = <b>${U.fmt(ans)}</b>. With straight-line demand and constant MC, the monopolist produces exactly half the competitive output.`),
          });
        },
      },
      {
        name: "Price gap with rising marginal cost ($)",
        make() {
          const m = mono();
          const R = risingModel();
          const ans = R.Pm - R.Pc;
          return Q.num({
            q: `In the market for ${m.u.p}, demand is <b>${demEq(R.a, R.b)}</b>. The industry's marginal cost (which would be the supply curve under perfect competition) is <b>${mcEq(R.m0, R.m1)}</b>. If a single firm took over the industry with no change in costs, <b>how much higher</b> would the price be than under perfect competition?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: R.Pm - R.MCm, why: "That is the gap between the monopoly price and MC at the monopoly output, not the change in the market price." },
              { value: R.Qc - R.Qm, why: "That is the change in quantity, not price." },
              { value: R.Pm, why: "That is the monopoly price itself. Subtract the competitive price." },
            ]),
            sol: steps("Competition: set P (demand) = MC (supply). Monopoly: set MR = MC, then read the price from demand.",
              `Competition: ${U.fmt(R.a)} − ${coef(R.b)}Q = ${U.fmt(R.m0)} + ${coef(R.m1)}Q → Q = ${U.fmt(R.Qc)}, P = ${$(R.Pc)}.`,
              `Monopoly: ${mrEq(R.a, R.b)} = ${U.fmt(R.m0)} + ${coef(R.m1)}Q → Q = ${U.fmt(R.Qm)}, P = ${U.fmt(R.a)} − ${coef(R.b)}${R.b === 1 ? "" : " × "}${U.fmt(R.Qm)} = ${$(R.Pm)}.`,
              `Price is higher by ${$(R.Pm)} − ${$(R.Pc)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Deadweight loss of monopoly ($)",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.DWL;
          return Q.num({
            q: `Demand for ${m.u.p} is <b>${demEq(L.a, L.b)}</b> and marginal cost is constant at <b>${$(L.c)}</b>. Compared with perfect competition, what is the <b>deadweight loss</b> when a single-price monopoly serves this market?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (L.Qc - L.Qm) * (L.Pm - L.c), why: "You forgot the ½. The deadweight loss is a triangle, not a rectangle." },
              { value: L.rect, why: "That is the rectangle of consumer surplus transferred to the monopolist ((P<sub>m</sub> − MC) × Q<sub>m</sub>), not the surplus lost." },
              { value: L.CSc - L.CSm, why: "That is the whole fall in consumer surplus: the transfer plus the deadweight loss." },
            ]),
            sol: steps("Deadweight loss = the triangle between demand and MC, from the monopoly quantity to the competitive quantity: ½ × (Q<sub>c</sub> − Q<sub>m</sub>) × (P<sub>m</sub> − MC).",
              `Monopoly: MR = MC → Q<sub>m</sub> = ${U.fmt(L.Qm)}, P<sub>m</sub> = ${$(L.Pm)}. Competition: P = MC → Q<sub>c</sub> = ${U.fmt(L.Qc)}.`,
              `DWL = ½ × (${U.fmt(L.Qc)} − ${U.fmt(L.Qm)}) × (${$(L.Pm)} − ${$(L.c)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Surplus transferred to the monopolist ($)",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.rect;
          return Q.num({
            q: `A competitive market for ${m.u.p} with demand <b>${demEq(L.a, L.b)}</b> and constant marginal cost <b>${$(L.c)}</b> is taken over by a single firm. How much of the original <b>consumer surplus becomes the monopolist's profit</b> (the transfer from buyers to the seller)?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: L.DWL, why: "That is the deadweight loss — surplus nobody gets — not the part transferred to the monopolist." },
              { value: L.CSc - L.CSm, why: "That is the total fall in consumer surplus, which includes the deadweight loss as well as the transfer." },
              { value: L.Pm * L.Qm, why: "That is the monopolist's total revenue, not the surplus taken from consumers." },
            ]),
            sol: steps("The transfer is the rectangle between the monopoly price and MC (the competitive price), over the units the monopoly still sells.",
              `Monopoly: Q<sub>m</sub> = ${U.fmt(L.Qm)}, P<sub>m</sub> = ${$(L.Pm)}. Competitive price = MC = ${$(L.c)}.`,
              `Transfer = (${$(L.Pm)} − ${$(L.c)}) × ${U.fmt(L.Qm)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Fall in consumer surplus ($)",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.CSc - L.CSm;
          return Q.num({
            q: `Demand for ${m.u.p} is <b>${demEq(L.a, L.b)}</b>, and marginal cost is constant at <b>${$(L.c)}</b>. By how much does <b>consumer surplus fall</b> if the market switches from perfect competition to a single-price monopoly?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: L.rect, why: "That is only the part transferred to the monopolist. Consumers also lose the deadweight-loss triangle." },
              { value: L.DWL, why: "That is only the deadweight loss. Consumers also lose the rectangle transferred to the monopolist." },
              { value: L.CSm, why: "That is consumer surplus remaining under monopoly, not the fall." },
            ]),
            sol: steps("Consumer surplus = the triangle under demand and above the price. Compute it under each market structure.",
              `Competition: P = ${$(L.c)}, Q = ${U.fmt(L.Qc)}: CS = ½ × ${U.fmt(L.Qc)} × (${$(L.a)} − ${$(L.c)}) = ${$(L.CSc)}. Monopoly: P = ${$(L.Pm)}, Q = ${U.fmt(L.Qm)}: CS = ½ × ${U.fmt(L.Qm)} × (${$(L.a)} − ${$(L.Pm)}) = ${$(L.CSm)}.`,
              `Fall = ${$(L.CSc)} − ${$(L.CSm)} = <b>${$(ans)}</b> = transfer ${$(L.rect)} + deadweight loss ${$(L.DWL)}.`),
          });
        },
      },
      {
        name: "Higher or lower under monopoly? (drop-down)",
        make() {
          const items = dealItems("m11-dir", DIR_BANK, [HIGH, LOW], 5);
          return Q.classify({
            q: "A perfectly competitive industry is taken over by a single firm, and costs do not change. Compared with competition, is each of these higher or lower under monopoly?",
            cats: [HIGH, LOW], items,
            sol: steps("Start with the two decisions: the monopolist produces where MR = MC (less than where P = MC) and charges the price on demand (more than MC).",
              "Higher price, lower quantity. Consumers lose surplus; part goes to the monopolist (producer surplus rises) and part is lost (deadweight loss), so total surplus falls."),
          });
        },
      },
      {
        name: "Select all statements about monopoly inefficiency",
        make() {
          const opts = selectAll(EFF_TF, 5);
          return Q.multi({
            q: "Select <b>all</b> true statements about the social cost of monopoly.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Efficiency needs MSB = MSC, i.e. P = MC. A monopolist stops where MR = MC, with P &gt; MC, so it produces too little.",
              "Keep the two effects apart: a <b>transfer</b> (consumer surplus → monopoly profit) and a <b>deadweight loss</b> (surplus lost to everyone). Rent seeking adds a further cost."),
          });
        },
      },
      {
        name: "Rent seeking and social cost",
        make() {
          const city = U.pick(["Port Calder", "Brennan Falls", "Ashby", "Mill Harbor", "Westvale"]);
          const what = U.pick(["the exclusive franchise to run bike-share service", "the only license to operate airport taxis", "the sole contract to run the public parking garages", "the exclusive right to sell food in the public parks"]);
          const k = U.pick(["Two", "Three", "Four"]);
          const spend = U.pick([200000, 300000, 500000, 750000]);
          return Q.mc({
            q: `${k} companies each spend ${$(spend)} on lobbyists and lawyers competing for ${what} in ${city}. Only one wins, and it then earns monopoly profits. From society's point of view, what does the lobbying spending represent?`,
            right: "An additional social cost: real resources used to capture monopoly profit instead of producing goods and services",
            wrong: [
              { t: "No cost at all, because the money is simply paid to lobbyists and lawyers, who spend it in the economy", why: "The lobbyists' and lawyers' time could have produced something valuable. Using it to fight over who gets the profit is a real cost." },
              { t: "A transfer from consumers to the winning firm, just like the monopoly price markup", why: "The price markup is a transfer, but lobbying uses up resources; it is a cost, not a transfer." },
              { t: "A reduction in the deadweight loss, because competition for the franchise makes the market more competitive", why: "Competing for the right to be a monopoly does not lower the monopoly's price or raise its output." },
            ],
            rightWhy: "Rent seeking makes the total social cost of monopoly larger than the deadweight loss triangle.",
            sol: steps("Ask whether the spending produces anything of value, or just decides who receives the monopoly profit.",
              "It only decides who gets the profit, so the resources are wasted from society's view. Rent seeking adds to the deadweight loss of monopoly."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Price discrimination vs price differentiation
   * ============================================================ */
  const PD = "Price discrimination", PDF = "Price differentiation";
  const PD_BANK = [
    { t: "A movie theater charges seniors $7 and other adults $13 for the same seat at the same showing.", cat: PD, why: "The seat costs the same to provide; the price gap reflects different willingness to pay." },
    { t: "An airline charges business travelers who book two days ahead far more than vacationers who book two months ahead, for seats in the same cabin on the same flight.", cat: PD, why: "The seats cost the same; late bookers have less elastic demand." },
    { t: "A software company sells the identical program to verified students at 60% off.", cat: PD, why: "Selling to a student costs no less; students' demand is more elastic." },
    { t: "A museum charges city residents less than tourists for the same admission.", cat: PD, why: "Same cost per visitor; the groups differ in willingness to pay." },
    { t: "A drug company sells the same pill for far less in a low-income country than in a high-income one, with identical production and shipping costs.", cat: PD, why: "The cost is the same, so the price gap is discrimination." },
    { t: "A golf course offers players under 25 a lower price for the same tee times.", cat: PD, why: "A young golfer costs the course no less to serve." },
    { t: "A streaming service charges college students half price for the same plan.", cat: PD, why: "The service costs the same to provide; students are more price-sensitive." },
    { t: "A car dealer haggles a different price with each buyer for identical cars, depending on how eager each one seems.", cat: PD, why: "The price varies with willingness to pay, not with cost." },
    { t: "A water park sells the second day of a two-day pass at half price, although a second-day visitor costs it just as much to serve.", cat: PD, why: "A quantity discount that does not reflect lower cost is price discrimination among units." },
    { t: "A ski resort sells season passes to local-county residents for less than to out-of-town skiers.", cat: PD, why: "The lift ride costs the same; locals are more price-sensitive and easy to identify." },
    { t: "A publisher sells the same textbook for less in one country than another, with identical printing and shipping costs.", cat: PD, why: "No cost difference, so the price gap is discrimination." },
    { t: "A zoo charges children less than adults for admission, though each visitor costs it about the same.", cat: PD, why: "Same cost per visitor; families with children have more elastic demand." },
    { t: "A furniture store adds a $150 delivery charge for island addresses, exactly matching the ferry fee it must pay.", cat: PDF, why: "The higher price reflects a real difference in the cost of serving those buyers." },
    { t: "A print shop charges less per page on a 10,000-copy order because the press setup is a one-time cost spread over more pages.", cat: PDF, why: "The bulk discount reflects a genuinely lower cost per page." },
    { t: "An online store charges more for overnight delivery than for ground shipping because overnight costs it more.", cat: PDF, why: "The price difference matches the difference in marginal cost." },
    { t: "A pizza shop charges more for deliveries beyond five miles to cover the extra driver time and fuel.", cat: PDF, why: "Far deliveries cost more to serve, so the surcharge is cost-based." },
    { t: "A wholesaler charges less per can on full pallets because handling one pallet costs less per can than many small orders.", cat: PDF, why: "The lower price reflects lower handling cost per unit." },
    { t: "A catering company charges more per guest for events in a distant city because it must pay staff travel and lodging.", cat: PDF, why: "The extra charge covers a real extra cost." },
    { t: "A moving company charges more to move a third-floor walk-up than a ground-floor apartment because the job takes more crew hours.", cat: PDF, why: "The price difference reflects the extra labor cost." },
    { t: "An insurer charges new teen drivers more because, on average, they file far more costly claims.", cat: PDF, why: "The higher premium reflects a higher expected cost of covering those drivers." },
    { t: "A concert promoter adds a mailing fee only to paper tickets, equal to its printing and postage cost.", cat: PDF, why: "The fee matches the extra cost of mailing paper tickets." },
  ];
  const COND_TF = [
    { t: "The firm faces a downward-sloping demand curve (it has some market power)", ok: true, why: "A price taker cannot charge anyone more than the market price." },
    { t: "The firm can separate buyers into groups at a reasonable cost", ok: true, why: "It must know who belongs to which group to charge them differently." },
    { t: "The groups have different price elasticities of demand", ok: true, why: "If every group responded to price the same way, charging different prices would not raise profit." },
    { t: "The firm can prevent resale from low-price buyers to high-price buyers", ok: true, why: "Otherwise low-price buyers would resell and undercut the high price." },
    { t: "The firm is a price taker in a perfectly competitive market", ok: false, why: "A price taker has no power to set different prices." },
    { t: "All buyers have the same price elasticity of demand", ok: false, why: "Discrimination requires <em>different</em> elasticities." },
    { t: "The product is easy for buyers to resell", ok: false, why: "Easy resale would destroy the price difference." },
    { t: "It costs the firm less to serve the low-price group", ok: false, why: "If the price gap reflected cost, it would be price differentiation, not discrimination." },
    { t: "The government must approve each price", ok: false, why: "Approval is not one of the economic conditions." },
    { t: "The product must be a necessity", ok: false, why: "Discrimination is common for luxuries too (theme parks, golf, software)." },
  ];
  const FAIL_BANK = [
    { cond: "resale", t: "A shop sells phone chargers to students at half price with no purchase limit. Students soon buy them by the dozen and resell them on campus to everyone else." },
    { cond: "resale", t: "A brand sells its sneakers cheaply in one country and at a high price in another, but online resellers ship the cheap pairs across the border within days." },
    { cond: "resale", t: "A cinema offers cheap children's tickets that do not say who they are for, and adults simply ask kids to buy tickets for them." },
    { cond: "separate", t: "A restaurant would like to charge wealthy diners more, but it has no cheap or reliable way to tell at the door who is wealthy." },
    { cond: "separate", t: "A taxi company wants to charge tourists more than locals, but drivers cannot tell them apart and asking for ID would drive customers away." },
    { cond: "separate", t: "A gym wants to charge less to people who would otherwise skip exercise, but it cannot identify those people at any reasonable cost." },
    { cond: "elastic", t: "A firm's surveys show that students and working adults cut their purchases by exactly the same percentage when its price rises." },
    { cond: "elastic", t: "A ferry operator finds that commuters and tourists are equally sensitive to fare changes." },
    { cond: "demand", t: "A soybean farmer sells into a market with thousands of identical farms and must accept the market price." },
    { cond: "demand", t: "A single gas station on a strip of a dozen identical stations finds that if it charges a cent above the others, it loses nearly all its customers." },
  ];
  const FAIL_OPTS = {
    resale: "The firm cannot prevent resale",
    separate: "The firm cannot separate buyers into groups at a reasonable cost",
    elastic: "The groups do not have different price elasticities of demand",
    demand: "The firm does not face a downward-sloping demand curve (it is a price taker)",
  };
  const PD_EFFECTS = [
    { t: "It converts some consumer surplus into economic profit.", ok: true, why: "Charging higher prices to buyers who value the good more captures their surplus." },
    { t: "It can raise output toward the competitive level.", ok: true, why: "Selling extra units at lower prices to price-sensitive buyers expands output." },
    { t: "Perfect price discrimination eliminates the deadweight loss.", ok: true, why: "The firm produces until P = MC, the efficient quantity." },
    { t: "Under perfect price discrimination, the firm's MR equals the price of each extra unit.", ok: true, why: "It does not cut the price on earlier units, so MR = P." },
    { t: "It raises the firm's profit compared with charging a single price.", ok: true, why: "If it could not, the firm would not bother to discriminate." },
    { t: "Perfect price discrimination leaves consumers with more surplus than a single-price monopoly.", ok: false, why: "Every buyer pays their maximum price, so consumer surplus falls to zero." },
    { t: "Price discrimination lowers the firm's profit but helps consumers.", ok: false, why: "Firms discriminate because it raises profit." },
    { t: "Perfect price discrimination reduces output below the single-price monopoly level.", ok: false, why: "It raises output, all the way to where P = MC." },
    { t: "Price discrimination is possible for any firm, even a price taker.", ok: false, why: "A price taker has no market power." },
  ];

  const genPriceDisc = STUDY.makeGenerator({
    id: "b251-m11-pricedisc",
    name: "Price discrimination vs price differentiation",
    blurb: "Tell cost-based price differences from discrimination, check the conditions for discrimination, and work out who pays more and why.",
    variants: [
      {
        name: "Discrimination or differentiation? (drop-down)",
        make() {
          const items = dealItems("m11-pd", PD_BANK, [PD, PDF], 5);
          return Q.classify({
            q: "Is each pricing practice price discrimination or price differentiation?",
            cats: [PD, PDF], items,
            sol: steps("Ask <em>why</em> the prices differ. Is it because serving one group (or one unit) really costs more?",
              "Same cost, different willingness to pay → <b>price discrimination</b>. A price difference that matches a difference in marginal cost → <b>price differentiation</b>. A quantity discount can be either, depending on whether it reflects a real cost saving."),
          });
        },
      },
      {
        name: "Select the conditions for price discrimination",
        make() {
          const opts = selectAll(COND_TF, 5);
          return Q.multi({
            q: "Which of the following are <b>necessary conditions</b> for a firm to price discriminate? Select all that apply.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("There are four conditions: market power (downward-sloping demand), the ability to separate buyers cheaply, different elasticities across groups, and a way to stop resale.",
              "Lower cost of serving a group is <em>not</em> a condition; a cost-based price gap is price differentiation."),
          });
        },
      },
      {
        name: "Which condition fails?",
        make() {
          const sc = U.deal("m11-fail", FAIL_BANK, 1)[0];
          const right = FAIL_OPTS[sc.cond];
          const why = {
            resale: "Nothing in the story suggests resale is the problem.",
            separate: "The story does not say the firm has trouble telling the groups apart.",
            elastic: "Nothing suggests the groups respond to price in the same way.",
            demand: "The firm in the story does have some control over its price.",
          };
          return Q.mc({
            q: `${sc.t}<br>Which condition for price discrimination is <b>missing</b>?`,
            right,
            wrong: Object.keys(FAIL_OPTS).filter(k => k !== sc.cond).map(k => ({ t: FAIL_OPTS[k], why: why[k] })),
            rightWhy: sc.cond === "resale" ? "Low-price buyers can resell to high-price buyers, which wipes out the price difference." : sc.cond === "separate" ? "Without a cheap way to sort buyers, the firm cannot charge them different prices." : sc.cond === "elastic" ? "With identical elasticities, the profit-maximizing price is the same for both groups." : "A price taker faces horizontal demand and cannot charge anyone above the market price.",
            sol: steps("Check the four conditions in turn: market power, separating buyers, different elasticities, preventing resale.",
              "Find the one the story says is not met: that alone is enough to make price discrimination fail."),
          });
        },
      },
      {
        name: "Who gets the lower price?",
        make() {
          const sc = U.pick([
            { firm: "A regional theater", g: ["students", "full-time professionals"] },
            { firm: "A ski resort", g: ["local residents", "out-of-state vacationers"] },
            { firm: "An airline", g: ["leisure travelers", "business travelers"] },
            { firm: "A software maker", g: ["home users", "large corporations"] },
            { firm: "A science museum", g: ["families with young children", "adult tourists"] },
          ]);
          const eHi = U.pick([1.8, 2, 2.4, 2.5, 3, 3.2]);
          const eLo = U.pick([0.4, 0.5, 0.6, 0.8, 1.2]);
          const flip = Math.random() < 0.5;
          const [gA, gB] = flip ? [sc.g[1], sc.g[0]] : sc.g;
          const [eA, eB] = flip ? [eLo, eHi] : [eHi, eLo];
          const elasticG = eA > eB ? gA : gB, inelG = eA > eB ? gB : gA;
          return Q.mc({
            q: `${sc.firm} can tell its two groups of buyers apart and can prevent resale. The price elasticity of demand is <b>${U.fmt(eA)}</b> for ${gA} and <b>${U.fmt(eB)}</b> for ${gB} (in absolute value). Serving either group costs the same. To maximize profit, it should:`,
            right: `Charge ${elasticG} the lower price`,
            wrong: [
              { t: `Charge ${inelG} the lower price`, why: `${cap(inelG)} have the <em>less</em> elastic demand: they cut back little when price rises, so they get the higher price.` },
              { t: "Charge both groups the same price, since costs are the same", why: "With different elasticities and the ability to separate buyers, a single price leaves profit on the table." },
              { t: "Charge both groups a price equal to marginal cost", why: "P = MC earns no markup at all; a firm with market power sets price above MC." },
            ],
            rightWhy: `${cap(elasticG)} are more price-sensitive (elasticity ${U.fmt(Math.max(eA, eB))}), so a lower price wins many more sales from them.`,
            sol: steps("Price discrimination charges more to the group that is <em>less</em> sensitive to price.",
              `The larger elasticity (${U.fmt(Math.max(eA, eB))}) belongs to ${elasticG}, so they get the <b>lower</b> price; ${inelG} (${U.fmt(Math.min(eA, eB))}) pay more.`),
          });
        },
      },
      {
        name: "Price in each market segment ($)",
        make() {
          const m = mono();
          for (let g = 0; g < 200; g++) {
            const c = U.randInt(4, 30);
            const seg = () => { const b = U.pick([1, 2, 3, 4]); const k = U.randInt(4, 30); return { b, a: c + 2 * b * k, Q: k, P: c + b * k }; };
            let A = seg(), B = seg();
            if (A.P === B.P || A.a === B.a) continue;
            if (A.P > B.P) [A, B] = [B, A];   // the first-named (discount) group gets the lower price
            const ask = U.pick([0, 1]);
            const S = [A, B][ask], O = [A, B][1 - ask];
            const names = U.pick([["students", "other adults"], ["residents", "visitors"], ["weekday customers", "weekend customers"], ["seniors", "everyone else"]]);
            const ans = S.P;
            return Q.num({
              q: `${intro(m)} sells to two groups it can keep apart, with no resale. Demand from ${names[0]} is <b>${demEq(A.a, A.b)}</b>; demand from ${names[1]} is <b>${demEq(B.a, B.b)}</b>. Marginal cost is a constant <b>${$(c)}</b> for both. What price should it charge <b>${names[ask]}</b>?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: c, why: "That is marginal cost. In each market the firm sets MR = MC and charges the price on that market's demand." },
                { value: O.P, why: `That is the best price for ${names[1 - ask]}, not ${names[ask]}.` },
                { value: S.a - 2 * S.b * S.Q, why: "That is MR at the chosen quantity (equal to MC). The price comes from demand." },
                { value: S.Q, why: "That is the quantity. Plug it into this group's demand equation." },
              ]),
              sol: steps("Treat each group as a separate market: set that group's MR equal to MC, then read the price from that group's demand.",
                `${cap(names[ask])}: ${mrEq(S.a, S.b)} = ${U.fmt(c)} → Q = ${U.fmt(S.a - c)} ÷ ${U.fmt(2 * S.b)} = ${U.fmt(S.Q)}.`,
                `P = ${U.fmt(S.a)} − ${coef(S.b)}${S.b === 1 ? "" : " × "}${U.fmt(S.Q)} = <b>${$(ans)}</b>. (The other group pays ${$(O.P)}.)`),
            });
          }
          throw new Error("no draw");
        },
      },
      {
        name: "Perfect price discrimination: profit ($)",
        make() {
          const m = mono();
          const L = linModel();
          const ans = L.CSc; // ½·Qc·(a − c) with no fixed cost
          return Q.num({
            q: `Demand for ${poss(m.firm)} ${m.u.p} is <b>${demEq(L.a, L.b)}</b>, marginal cost is a constant <b>${$(L.c)}</b>, and there is no fixed cost. Suppose the firm could <b>perfectly price discriminate</b>, charging every buyer the most they are willing to pay. What would its <b>economic profit</b> be?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: L.rect, why: "That is the single-price monopoly profit ((P<sub>m</sub> − MC) × Q<sub>m</sub>). Perfect discrimination earns more." },
              { value: L.rect + L.DWL, why: "Close, but a perfect discriminator also captures the consumer surplus that remains under a single price. It takes the whole triangle." },
              { value: L.Qc * (L.a - L.c), why: "You forgot the ½: the surplus captured is a triangle." },
              { value: L.DWL, why: "That is the deadweight loss of single-price monopoly, not the discriminator's profit." },
            ]),
            sol: steps("With perfect price discrimination, MR = P, so the firm produces until <b>P = MC</b> and captures all of the surplus under demand and above MC.",
              `P = MC: ${U.fmt(L.a)} − ${coef(L.b)}Q = ${U.fmt(L.c)} → Q = ${U.fmt(L.Qc)}.`,
              `Profit = ½ × ${U.fmt(L.Qc)} × (${$(L.a)} − ${$(L.c)}) = <b>${$(ans)}</b>, compared with ${$(L.rect)} as a single-price monopolist. There is no deadweight loss and no consumer surplus.`),
          });
        },
      },
      {
        name: "Select all effects of price discrimination",
        make() {
          const opts = selectAll(PD_EFFECTS, 5);
          return Q.multi({
            q: "Select <b>all</b> true statements about the effects of price discrimination.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Price discrimination turns consumer surplus into profit by charging each group (or unit) closer to its willingness to pay.",
              "Because the firm no longer has to cut the price on every unit to sell one more, it sells more. Taken to the limit (perfect discrimination), MR = P, output reaches P = MC, the deadweight loss disappears and consumers keep no surplus."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Reading monopoly graphs
   * ============================================================ */
  function gTicks(Mo, extraY) {
    const xt = uniqSorted([Mo.Qm, Mo.Qc, Mo.Qd]);
    const yt = uniqSorted([Mo.MCm, Mo.Pm, Mo.Pc, Mo.a].concat(extraY || []));
    return { xt, yt };
  }
  function gSvg(Mo, m, extra) {
    const { xt, yt } = gTicks(Mo);
    return monoSvg(Object.assign({ a: Mo.a, b: Mo.b, m0: Mo.m0, m1: Mo.m1, xTicks: xt, yTicks: yt, xLabel: `${cap(m.u.p)} ${m.per}`, yLabel: "Price, MR and MC ($)" }, extra || {}));
  }
  const LETTERS = ["A", "B", "E", "F", "G", "H", "J", "K", "L", "N", "R", "T"];

  const genGraphs = STUDY.makeGenerator({
    id: "b251-m11-graphs",
    name: "Reading monopoly graphs",
    blurb: "Read the monopoly output, price, profit and deadweight loss off a graph of demand, MR, MC and ATC.",
    variants: [
      {
        name: "Read the monopoly quantity",
        make() {
          const m = mono();
          const Mo = gModel(Math.random() < 0.5);
          const ans = Mo.Qm;
          return Q.num({
            q: `The graph shows demand (D), marginal revenue (MR) and marginal cost (MC) for ${m.firm}, a monopolist.${gSvg(Mo, m)}How many ${m.u.p} does it sell to maximize profit?`,
            answer: ans, unit: m.u.p, kind: "count",
            traps: traps(ans, [
              { value: Mo.Qc, why: "That is where MC crosses demand (P = MC): the competitive quantity." },
              { value: Mo.Qd, why: "That is where demand meets the axis (price zero)." },
              { value: Mo.Qd / 2, why: "That is where MR = 0, which maximizes revenue, not profit." },
            ]),
            sol: steps("Find where the <b>MR</b> curve crosses the <b>MC</b> curve — not where MC crosses demand.",
              `MR and MC cross at <b>${U.fmt(ans)}</b> ${pl(ans, m.u)}. (MC crosses demand at ${U.fmt(Mo.Qc)}: the competitive quantity.)`),
          });
        },
      },
      {
        name: "Read the monopoly price",
        make() {
          const m = mono();
          const Mo = gModel(Math.random() < 0.5);
          const ans = Mo.Pm;
          return Q.num({
            q: `${m.firm} is a single-price monopolist. Use the graph of demand (D), marginal revenue (MR) and marginal cost (MC).${gSvg(Mo, m)}What <b>price</b> maximizes its profit?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Mo.MCm, why: "That is the height where MR = MC: the marginal cost of the last unit. Go up to the demand curve for the price." },
              { value: Mo.Pc, why: "That is the price where MC crosses demand: the competitive price." },
              { value: Mo.a, why: "That is the demand curve's vertical intercept; at that price nothing is sold." },
            ]),
            sol: steps("Two steps: find the quantity where MR = MC, then go <b>straight up to the demand curve</b>.",
              `MR = MC at Q = ${U.fmt(Mo.Qm)} (height ${$(Mo.MCm)}).`,
              `Demand at Q = ${U.fmt(Mo.Qm)} is <b>${$(ans)}</b>: the price buyers will pay for that quantity.`),
          });
        },
      },
      {
        name: "Identify the outcome point",
        make() {
          const m = mono();
          let Mo = gModel(Math.random() < 0.5);
          // keep the four points visibly apart (the revenue-maximizing point can sit on top of the competitive one)
          while (Math.abs(Mo.Qd / 2 - Mo.Qc) / Mo.Qd < 0.12 && Math.abs(Mo.a / 2 - Mo.Pc) / Mo.a < 0.12) Mo = gModel(Math.random() < 0.5);
          const L = U.sample(LETTERS, 4);
          const pts = [
            { k: "mono", x: Mo.Qm, y: Mo.Pm },
            { k: "mrmc", x: Mo.Qm, y: Mo.MCm },
            { k: "comp", x: Mo.Qc, y: Mo.Pc },
            { k: "trmax", x: Mo.Qd / 2, y: Mo.a / 2 },
          ].map((p, i) => ({ ...p, label: L[i] }));
          const askMono = Math.random() < 0.6;
          const target = pts.find(p => p.k === (askMono ? "mono" : "comp"));
          const desc = {
            mono: "the monopolist's chosen price and quantity (MR = MC, price on demand)",
            mrmc: "where MR = MC; its height is marginal cost, not the price",
            comp: "where MC crosses demand: the competitive price and quantity (P = MC)",
            trmax: "the point on demand above where MR = 0, which maximizes total revenue",
          };
          const { xt, yt } = gTicks(Mo);
          const svg = monoSvg({ a: Mo.a, b: Mo.b, m0: Mo.m0, m1: Mo.m1, xTicks: xt, yTicks: yt, xLabel: `${cap(m.u.p)} ${m.per}`, yLabel: "Price, MR and MC ($)", points: pts.map(p => ({ x: p.x, y: p.y, label: p.label })) });
          return Q.mc({
            q: `The graph shows demand, MR and MC for the ${m.u.p} market.${svg}Which point shows the ${askMono ? "price and quantity chosen by a <b>single-price monopolist</b>" : "price and quantity under <b>perfect competition</b> (same costs)"}?`,
            right: `Point ${target.label}`,
            wrong: pts.filter(p => p !== target).map(p => ({ t: `Point ${p.label}`, why: `Point ${p.label} is ${desc[p.k]}.` })),
            rightWhy: `Point ${target.label} is ${desc[target.k]}.`,
            sol: steps(askMono ? "A monopolist finds Q where MR = MC, then charges the price on the <b>demand</b> curve above it." : "A competitive industry produces where supply (the MC curve) crosses demand: P = MC.",
              askMono ? `MR = MC at Q = ${U.fmt(Mo.Qm)}; the demand curve there is at ${$(Mo.Pm)}: point <b>${target.label}</b>.` : `MC crosses demand at Q = ${U.fmt(Mo.Qc)}, P = ${$(Mo.Pc)}: point <b>${target.label}</b>.`),
          });
        },
      },
      {
        name: "Profit or loss rectangle from a graph ($)",
        make() {
          const m = mono();
          const Pr = profitModel(true);
          const qd = Pr.a / Pr.b;
          const svg = monoSvg({ a: Pr.a, b: Pr.b, m0: Pr.m0, m1: Pr.m1, FC: Pr.FC, xMax: Math.ceil(qd * 1.08), yMax: Pr.yMax,
            xTicks: [Pr.Qm], yTicks: uniqSorted([Pr.MCm, Pr.ATCm, Pr.Pm]), xLabel: `${cap(m.u.p)} ${m.per}`, yLabel: "Price and cost ($)",
            guides: [[[Pr.Qm, 0], [Pr.Qm, Math.max(Pr.Pm, Pr.ATCm)]]] });
          const ans = Pr.profit;
          return Q.num({
            q: `The graph shows demand (D), marginal revenue (MR), marginal cost (MC) and average total cost (ATC) for ${m.firm}, a monopolist.${svg}What is its <b>economic profit</b> at its profit-maximizing output? (Enter a negative number for a loss.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (Pr.Pm - Pr.MCm) * Pr.Qm, why: "That uses MC instead of ATC. Profit per unit is P − ATC." },
              { value: Pr.Pm * Pr.Qm, why: "That is total revenue. Subtract total cost (ATC × Q)." },
              { value: Pr.Pm - Pr.ATCm, why: "That is profit per unit. Multiply by the quantity." },
              { value: -ans, why: "Check the sign: is the price above or below ATC at the chosen output?" },
              { value: (Pr.ATCm - Pr.MCm) * Pr.Qm, why: "That rectangle lies between ATC and MC; profit is between the price and ATC." },
            ]),
            sol: steps("Find Q where MR = MC, then read two heights at that Q: the price (on demand) and ATC.",
              `MR = MC at Q = ${U.fmt(Pr.Qm)}. Price = ${$(Pr.Pm)}; ATC = ${$(Pr.ATCm)}.`,
              `Profit = (${$(Pr.Pm)} − ${$(Pr.ATCm)}) × ${U.fmt(Pr.Qm)} = <b>${$(ans)}</b>${Pr.loss ? ": a loss, because ATC is above the price." : "."}`),
          });
        },
      },
      {
        name: "Deadweight loss from a graph ($)",
        make() {
          const m = mono();
          const Mo = gModel(Math.random() < 0.5);
          const ans = Mo.DWL;
          return Q.num({
            q: `The graph shows the market for ${m.u.p}: demand (D), marginal revenue (MR) and marginal cost (MC). The same MC applies whether the market is served by a monopolist or by a competitive industry.${gSvg(Mo, m)}What is the <b>deadweight loss</b> caused by monopoly?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (Mo.Qc - Mo.Qm) * (Mo.Pm - Mo.MCm), why: "You forgot the ½: the deadweight loss is a triangle." },
              { value: (Mo.Pm - Mo.MCm) * Mo.Qm, why: "That is the rectangle between the monopoly price and MC over the monopoly output — surplus transferred to the monopolist, not lost." },
              { value: (Mo.Qc - Mo.Qm) * Mo.Pm / 2, why: "The triangle's height is the gap between the monopoly price and MC, not the whole price measured from the axis." },
              { value: (Mo.Qc - Mo.Qm) * (Mo.Pm - Mo.Pc) / 2, why: "The triangle's height runs from the monopoly price down to MC <em>at the monopoly output</em>, not to the competitive price." },
            ]),
            sol: steps("The deadweight loss is the triangle bounded by demand (above), MC (below) and the monopoly quantity (left), ending at the competitive quantity.",
              `Monopoly: Q = ${U.fmt(Mo.Qm)}, P = ${$(Mo.Pm)}, MC there = ${$(Mo.MCm)}. Competition: Q = ${U.fmt(Mo.Qc)}.`,
              `DWL = ½ × (${U.fmt(Mo.Qc)} − ${U.fmt(Mo.Qm)}) × (${$(Mo.Pm)} − ${$(Mo.MCm)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Name the area: profit, deadweight loss or consumer surplus",
        make() {
          const m = mono();
          const Mo = gModel(false);
          const L = U.sample(LETTERS, 6);
          const P = {
            top: { x: 0, y: Mo.a }, pm0: { x: 0, y: Mo.Pm }, A: { x: Mo.Qm, y: Mo.Pm },
            B: { x: Mo.Qm, y: Mo.MCm }, Cc: { x: Mo.Qc, y: Mo.Pc }, c0: { x: 0, y: Mo.MCm },
          };
          const keys = Object.keys(P);
          keys.forEach((k, i) => { P[k].label = L[i]; });
          const lab = (...ks) => ks.map(k => P[k].label).join("");
          const regions = {
            dwl: { t: `Triangle ${lab("A", "B", "Cc")}`, d: "the deadweight loss (between demand and MC from the monopoly to the competitive quantity)" },
            rect: { t: `Rectangle ${lab("pm0", "A", "B", "c0")}`, d: "the monopolist's profit — consumer surplus transferred to the seller (here, with constant MC and no fixed cost)" },
            cs: { t: `Triangle ${lab("top", "pm0", "A")}`, d: "consumer surplus under monopoly (below demand, above the monopoly price)" },
            csc: { t: `Triangle ${lab("top", "c0", "Cc")}`, d: "consumer surplus under perfect competition" },
          };
          const ask = U.pick(["dwl", "rect", "cs"]);
          const askTxt = { dwl: "the <b>deadweight loss</b> from monopoly", rect: "the <b>surplus transferred</b> from consumers to the monopolist", cs: "<b>consumer surplus</b> under monopoly" }[ask];
          const { xt, yt } = gTicks(Mo);
          const svg = monoSvg({ a: Mo.a, b: Mo.b, m0: Mo.m0, m1: 0, xTicks: xt, yTicks: yt, xLabel: `${cap(m.u.p)} ${m.per}`, yLabel: "Price, MR and MC ($)",
            points: keys.map(k => ({ x: P[k].x, y: P[k].y, label: P[k].label })), guides: [[[0, Mo.Pm], [Mo.Qm, Mo.Pm]], [[Mo.Qm, Mo.Pm], [Mo.Qm, 0]]] });
          return Q.mc({
            q: `The graph shows demand, MR and a constant MC for ${m.u.p}. The monopolist chooses point ${P.A.label}; a competitive industry would produce at point ${P.Cc.label}.${svg}Which area shows ${askTxt}?`,
            right: regions[ask].t,
            wrong: Object.keys(regions).filter(k => k !== ask).map(k => ({ t: regions[k].t, why: `That area is ${regions[k].d}.` })),
            rightWhy: `It is ${regions[ask].d}.`,
            sol: steps("Mark the monopoly point (MR = MC, price on demand) and the competitive point (MC meets demand), then think about who gains and loses.",
              "Consumer surplus is below demand and above the price paid. The rectangle between the monopoly price and MC on the units sold is the transfer to the monopolist. The triangle between demand and MC over the units no longer produced is the deadweight loss."),
          });
        },
      },
      {
        name: "Which curve is which? (drop-down)",
        make() {
          const m = mono();
          const withATC = Math.random() < 0.5;
          const nums = U.shuffle(withATC ? ["1", "2", "3", "4"] : ["1", "2", "3"]);
          const names = { D: `Curve ${nums[0]}`, MR: `Curve ${nums[1]}`, MC: `Curve ${nums[2]}`, ATC: withATC ? `Curve ${nums[3]}` : "" };
          const sty = U.shuffle(["main", "alt", "dash", withATC ? "dash" : "main"]);
          const styles = { D: sty[0], MR: sty[1], MC: sty[2], ATC: sty[3] };
          let svg;
          if (withATC) {
            const Pr = profitModel(false);
            svg = monoSvg({ a: Pr.a, b: Pr.b, m0: Pr.m0, m1: Pr.m1, FC: Pr.FC, xMax: Math.ceil(Pr.a / Pr.b * 1.08), yMax: Pr.yMax, xTicks: [], yTicks: [], names, styles, xLabel: "Quantity", yLabel: "Price and cost ($)" });
          } else {
            const Mo = gModel(true);
            svg = monoSvg({ a: Mo.a, b: Mo.b, m0: Mo.m0, m1: Mo.m1, xTicks: [], yTicks: [], names, styles, xLabel: "Quantity", yLabel: "Price and cost ($)" });
          }
          const cats = ["Demand", "Marginal revenue", "Marginal cost"].concat(withATC ? ["Average total cost"] : []);
          const items = [
            { t: names.D, cat: "Demand", why: "Downward-sloping, and it reaches the quantity axis twice as far out as MR." },
            { t: names.MR, cat: "Marginal revenue", why: "Starts at the same price intercept as demand but falls twice as fast." },
            { t: names.MC, cat: "Marginal cost", why: "The upward-sloping straight line that starts low on the price axis." },
          ].concat(withATC ? [{ t: names.ATC, cat: "Average total cost", why: "U-shaped: high at low output (fixed cost spread thinly), with MC crossing it at its minimum." }] : []);
          return Q.classify({
            q: `The graph shows the curves a monopolist uses to choose its output, with the labels removed.${svg}Identify each curve.`,
            cats, items,
            sol: steps("Demand and MR start at the same point on the price axis; MR is the steeper one (twice the slope of straight-line demand).",
              withATC ? "MC slopes upward. ATC is U-shaped, and MC passes through its lowest point." : "MC is the upward-sloping line."),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m11", order: 11,
    title: "Module 11 · Monopoly",
    short: "M11 · Monopoly",
    description: "Monopoly characteristics and barriers to entry, demand and marginal revenue, profit maximization (MR = MC), monopoly profit, price discrimination vs differentiation, and deadweight loss compared with perfect competition.",
    notes, flashcards, cues,
    generators: [genTraits, genMR, genProfitMax, genProfit, genCompare, genPriceDisc, genGraphs],
  });
})();
