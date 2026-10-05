/* ============================================================
 * ECON B251 · Module 4 — Markets: Elasticity
 * Price elasticity of demand (midpoint formula, absolute value),
 * elastic / unit elastic / inelastic and the two extremes, elasticity
 * along a linear demand curve, the total-revenue test, determinants of
 * demand elasticity, cross-price elasticity, income elasticity and the
 * price elasticity of supply (with its determinants and time frames).
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.map(step).join("");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const d2 = x => U.fmt(U.round(x, 2), 2);
  /* signed number with a typographic minus */
  const sg = (x, f) => (x < 0 ? "−" + (f || d2)(-x) : (f || d2)(x));
  const pct = x => sg(x) + "%";
  const pctAbs = x => d2(Math.abs(x)) + "%";
  const sgMoney = x => (x < 0 ? "−" + U.money(-x) : U.money(x));
  /* midpoint (arc) percentage change from a to b, in percent */
  const mid = (a, b) => ((b - a) / ((a + b) / 2)) * 100;
  const simple = (a, b) => ((b - a) / a) * 100;
  const EP = "E<sub>p</sub>", EXY = "E<sub>xy</sub>", EI = "E<sub>i</sub>", ES = "E<sub>s</sub>";
  const near = (x, y, t) => Math.abs(x - y) < (t || 1e-9);

  function tbl(head, rows) {
    return `<table class="data-tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  }
  /* Keep only traps that differ from the answer and from each other. */
  function traps(answer, list) {
    const out = [];
    for (const t of list) {
      if (!t || !Number.isFinite(t.value)) continue;
      if (Math.abs(t.value - answer) <= Math.max(0.03, Math.abs(answer) * 0.02)) continue;
      if (out.some(o => Math.abs(o.value - t.value) <= Math.max(0.011, Math.abs(t.value) * 0.01))) continue;
      out.push(t);
    }
    return out;
  }
  /* Deal k statements for a select-all question, with at least one true one. */
  function dealMulti(key, bank, k) {
    const opts = U.deal(key, bank, k);
    if (!opts.some(o => o.ok)) opts[0] = U.pick(bank.filter(o => o.ok && !opts.includes(o)));
    return opts;
  }
  /* Put the choices of an mc problem into a fixed logical order
   * (e.g. rises / falls / unchanged) without always putting the answer first. */
  function inOrder(p, order) {
    const right = p.choices[p.answer];
    const idx = p.choices.map((_, i) => i).sort((a, b) => order.indexOf(U.plain(p.choices[a])) - order.indexOf(U.plain(p.choices[b])));
    p.choices = idx.map(i => p.choices[i]);
    p.whys = idx.map(i => p.whys[i]);
    p.answer = p.choices.indexOf(right);
    return p;
  }
  /* One line of midpoint arithmetic: %Δ = (new − old) ÷ average. */
  function midLine(label, a, b, money) {
    const f = money ? (x => U.money(x)) : (x => U.fmt(x));
    const ch = U.round(b - a, 2), avg = (a + b) / 2;
    const chS = money ? sgMoney(ch) : sg(ch, U.fmt);
    return `%Δ${label} = (${f(b)} − ${f(a)}) ÷ [(${f(a)} + ${f(b)}) ÷ 2] = ${chS} ÷ ${f(U.round(avg, 2))} = <b>${pct(mid(a, b))}</b>`;
  }
  /* Demand classification from |Ep|. */
  function pedClass(e) {
    const a = Math.abs(e);
    if (!Number.isFinite(a)) return "perfectly elastic";
    if (a === 0) return "perfectly inelastic";
    if (near(a, 1)) return "unit elastic";
    return a > 1 ? "elastic" : "inelastic";
  }

  /* Goods for demand problems: price grid (ps) and quantity grid (qs). */
  const DGOODS = [
    { s: "smoothie", p: "smoothies", who: "a juice bar", per: "per day", ps: 0.5, lo: 3, hi: 9, qs: 10, qlo: 80, qhi: 500 },
    { s: "movie ticket", p: "movie tickets", who: "a neighborhood cinema", per: "per week", ps: 1, lo: 7, hi: 16, qs: 50, qlo: 400, qhi: 2500 },
    { s: "yoga class", p: "yoga classes", who: "a studio", per: "per month", ps: 1, lo: 10, hi: 28, qs: 10, qlo: 60, qhi: 400 },
    { s: "bag of coffee beans", p: "bags of coffee beans", who: "a roastery", per: "per week", ps: 1, lo: 9, hi: 20, qs: 10, qlo: 60, qhi: 400 },
    { s: "phone case", p: "phone cases", who: "an online shop", per: "per week", ps: 1, lo: 12, hi: 35, qs: 20, qlo: 100, qhi: 900 },
    { s: "concert ticket", p: "concert tickets", who: "a music venue", per: "per show", ps: 5, lo: 30, hi: 90, qs: 50, qlo: 300, qhi: 2000 },
    { s: "car wash", p: "car washes", who: "a car-wash stand", per: "per day", ps: 1, lo: 6, hi: 18, qs: 5, qlo: 40, qhi: 250 },
    { s: "slice of pizza", p: "slices of pizza", who: "a campus pizzeria", per: "per day", ps: 0.5, lo: 2, hi: 6, qs: 20, qlo: 200, qhi: 1000 },
    { s: "bus pass", p: "bus passes", who: "a city transit system", per: "per month", ps: 5, lo: 30, hi: 90, qs: 100, qlo: 2000, qhi: 9000 },
    { s: "haircut", p: "haircuts", who: "a barbershop", per: "per week", ps: 1, lo: 15, hi: 40, qs: 5, qlo: 40, qhi: 200 },
    { s: "museum admission", p: "museum admissions", who: "a science museum", per: "per weekend", ps: 1, lo: 8, hi: 25, qs: 50, qlo: 300, qhi: 2000 },
    { s: "scented candle", p: "scented candles", who: "a gift shop", per: "per week", ps: 1, lo: 8, hi: 30, qs: 10, qlo: 50, qhi: 400 },
  ];
  const qn = (n, g) => `${U.fmt(n)} ${n === 1 ? g.s : g.p}`;

  /* Two price–quantity points on a demand curve, scored with the midpoint formula.
   * Keeps |Ep| between 0.15 and 6 and at least 0.1 away from 1. */
  function dPts(want, g0) {
    for (let k = 0; k < 4000; k++) {
      const g = g0 || U.pick(DGOODS);
      const P1 = U.round(U.randInt(Math.round(g.lo / g.ps), Math.round(g.hi / g.ps)) * g.ps, 2);
      const up = Math.random() < 0.5;
      const P2 = U.round(P1 + (up ? 1 : -1) * g.ps * U.randInt(1, 3), 2);
      if (P2 <= 0) continue;
      const Q1 = U.randInt(Math.round(g.qlo / g.qs), Math.round(g.qhi / g.qs)) * g.qs;
      const dq = g.qs * U.randInt(1, Math.max(1, Math.round((Q1 / g.qs) * 0.5)));
      const Q2 = up ? Q1 - dq : Q1 + dq;
      if (Q2 <= 0) continue;
      const e = Math.abs(mid(Q1, Q2) / mid(P1, P2));
      if (e < 0.15 || e > 6 || Math.abs(e - 1) < 0.1) continue;
      if (want === "elastic" && e <= 1) continue;
      if (want === "inelastic" && e >= 1) continue;
      if (Math.abs(simple(Q1, Q2) / simple(P1, P2) - e) < 0.05) continue; // make the midpoint matter
      return { g, P1, P2, Q1, Q2, e, up };
    }
    const g = g0 || DGOODS[0];
    return { g, P1: g.lo, P2: g.lo + g.ps, Q1: g.qhi, Q2: g.qhi - g.qs * 10, e: Math.abs(mid(g.qhi, g.qhi - g.qs * 10) / mid(g.lo, g.lo + g.ps)), up: true };
  }
  function dStory(d) {
    const g = d.g;
    return d.up
      ? `${cap(g.who)} raises the price of a ${g.s} from <b>${U.money(d.P1)}</b> to <b>${U.money(d.P2)}</b>, and the quantity demanded falls from <b>${qn(d.Q1, g)}</b> to <b>${qn(d.Q2, g)}</b> ${g.per}.`
      : `${cap(g.who)} cuts the price of a ${g.s} from <b>${U.money(d.P1)}</b> to <b>${U.money(d.P2)}</b>, and the quantity demanded rises from <b>${qn(d.Q1, g)}</b> to <b>${qn(d.Q2, g)}</b> ${g.per}.`;
  }
  function dSteps(d) {
    const pq = mid(d.Q1, d.Q2), pp = mid(d.P1, d.P2), e = pq / pp;
    return [
      "Midpoint formula: divide each change by the <em>average</em> of the old and new values, then divide %ΔQ by %ΔP.",
      `${midLine("Q", d.Q1, d.Q2)}<br>${midLine("P", d.P1, d.P2, true)}`,
      `${EP} = ${pct(pq)} ÷ ${pct(pp)} = ${sg(e)}, so |${EP}| = <b>${d2(Math.abs(e))}</b>: demand is <b>${pedClass(e)}</b> over this range.`,
    ];
  }
  function dTraps(d) {
    const e = d.e;
    return traps(e, [
      { value: Math.abs(simple(d.Q1, d.Q2) / simple(d.P1, d.P2)), why: "That divides each change by the <em>starting</em> value. The course uses the midpoint formula: divide by the average of the two values." },
      { value: 1 / e, why: "That is %ΔP ÷ %ΔQ — upside down. Price elasticity of demand puts the % change in quantity on top." },
      { value: -e, why: "Report the absolute value. The sign is always negative for demand, so the course quotes only the magnitude." },
      { value: Math.abs((d.Q2 - d.Q1) / (d.P2 - d.P1)), why: "That is the change in units per dollar (related to the slope). Elasticity uses percentage changes, which makes it units-free." },
      { value: Math.abs(simple(d.Q2, d.Q1) / simple(d.P2, d.P1)), why: "That uses the <em>new</em> values as the base. The midpoint formula uses the average of old and new." },
    ]);
  }

  /* A linear demand curve Q = a − bP with integer prices. */
  function linDemand() {
    const b = U.pick([2, 3, 4, 5, 10]);
    const Pmax = U.randInt(10, 30);
    return { a: b * Pmax, b, Pmax };
  }
  const qOf = (L, P) => L.a - L.b * P;

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "What price elasticity of demand measures",
      lo: "Define and interpret the price elasticity of demand.",
      html: `<p>The law of demand tells us the <em>direction</em> of the response: when the price of a good rises, people buy less of it. It says nothing about <em>how much</em> less. Two demand curves can both slope downward and still behave very differently. Raise the price 10% on one and buyers barely notice; do the same on the other and half of them leave.</p>
${G.plot({ xLabel: "Quantity per week", yLabel: "Price ($)", xMax: 60, yMax: 20, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [4, 8, 12, 16, 20],
    curves: [{ pts: [[25, 19], [35, 5]], style: "main", label: "D₁ (steep)", labelAt: 0 }, { pts: [[6, 15], [54, 9]], style: "alt", label: "D₂ (flat)", labelAt: 0 }],
    points: [{ x: 30, y: 12, label: "A" }], aria: "A steep and a flat demand curve through the same point" })}
<p>At point A, a $2 price rise cuts the quantity on D₁ only a little, but on the flatter D₂ it cuts quantity a lot. The <b>price elasticity of demand</b> (E<sub>p</sub>) puts a number on that responsiveness:</p>
<p style="text-align:center"><b>E<sub>p</sub> = (percentage change in quantity demanded) ÷ (percentage change in price)</b></p>
<ul>
  <li>It uses <b>percentage</b> changes, so it is <b>units-free</b>. It does not matter whether you measure in dollars or cents, pounds or kilograms. That is why we can compare the elasticity of gasoline with the elasticity of concert tickets.</li>
  <li>Because price and quantity demanded move in opposite directions, the raw number is always <b>negative (or zero)</b>.</li>
  <li>We care about the size of the response, so the course usually reports the <b>absolute value</b>, |E<sub>p</sub>|. "An elasticity of 2" means E<sub>p</sub> = −2.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> |E<sub>p</sub>| tells you the percentage change in quantity demanded for each 1% change in price. |E<sub>p</sub>| = 0.4: a 1% price rise cuts quantity demanded by about 0.4%.</div>
<div class="example"><b>Example.</b> A bike-share company raises its day-pass price by 5% and daily rentals fall by 9%. E<sub>p</sub> = −9% ÷ 5% = −1.8, so |E<sub>p</sub>| = 1.8. Each 1% price rise costs it about 1.8% of its rentals.</div>
<div class="trap"><b>Common trap.</b> Elasticity is not the slope. Slope compares <em>units</em> (riders per dollar); elasticity compares <em>percentages</em>. As the next lesson shows, a straight-line demand curve has the same slope everywhere but a different elasticity at every point.</div>`,
      gens: ["b251-m4-pedcalc"],
    },
    {
      title: "Computing elasticity with the midpoint formula",
      lo: "Calculate the price elasticity of demand between two points using the midpoint (average) formula.",
      html: `<p>Between two points (P<sub>1</sub>, Q<sub>1</sub>) and (P<sub>2</sub>, Q<sub>2</sub>), the course measures each percentage change against the <b>average</b> of the starting and ending values. This is the <b>midpoint</b> (or arc) formula:</p>
<p style="text-align:center"><b>E<sub>p</sub> = [ (Q<sub>2</sub> − Q<sub>1</sub>) ÷ ((Q<sub>1</sub> + Q<sub>2</sub>)/2) ] ÷ [ (P<sub>2</sub> − P<sub>1</sub>) ÷ ((P<sub>1</sub> + P<sub>2</sub>)/2) ]</b></p>
<p>Why the average? If you divided by the starting value, a rise from $6 to $8 would be a 33% change but a fall from $8 to $6 only a 25% change, and you would get two different elasticities for the same stretch of the curve. Using the average gives the <b>same answer whichever direction the price moves</b>.</p>
<div class="example"><b>Example.</b> A cinema raises the price of a large popcorn from $6 to $8, and nightly sales fall from 500 to 400 tubs.<br>
%ΔQ = (400 − 500) ÷ 450 = −22.2%. %ΔP = (8 − 6) ÷ 7 = +28.6%.<br>
E<sub>p</sub> = −22.2 ÷ 28.6 ≈ −0.78, so |E<sub>p</sub>| ≈ <b>0.78</b>. Run it backward ($8 → $6, 400 → 500) and you get +22.2 ÷ −28.6, the same 0.78. Interpretation: a 1% price rise cuts popcorn sales by about 0.78%.</div>
<p><b>Elasticity changes along a straight-line demand curve.</b> Take Q = 60 − 3P. The slope is the same everywhere, but the elasticity is not:</p>
<ul>
  <li>From $16 to $18, Q falls from 12 to 6: %ΔQ = −6 ÷ 9 = −66.7%, %ΔP = 2 ÷ 17 = 11.8%, so |E<sub>p</sub>| ≈ <b>5.67</b> (elastic).</li>
  <li>From $4 to $6, Q falls from 48 to 42: %ΔQ = −6 ÷ 45 = −13.3%, %ΔP = 2 ÷ 5 = 40%, so |E<sub>p</sub>| ≈ <b>0.33</b> (inelastic).</li>
</ul>
${G.plot({ xLabel: "Quantity", yLabel: "Price ($)", xMax: 60, yMax: 20, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [5, 10, 15, 20],
    curves: [{ pts: [[0, 20], [60, 0]], style: "main", label: "D", labelAt: 1 }],
    points: [{ x: 9, y: 17, label: "A (elastic)" }, { x: 30, y: 10, label: "M (unit elastic)" }, { x: 51, y: 3, label: "B" }], aria: "Elasticity falls as you move down a linear demand curve" })}
<p>On the graph of Q = 60 − 3P, A sits on the upper part (elastic), M at the midpoint (unit elastic) and B on the lower part (inelastic). Near the top of the line, quantity is small (so a given change in it is a big percentage) and price is high (so a given change in it is a small percentage). Near the bottom it is the reverse. Demand is elastic on the upper part, unit elastic at the midpoint and inelastic on the lower part.</p>
<div class="keyidea"><b>Key idea.</b> Use averages in both percentage changes, divide %ΔQ by %ΔP, and report the magnitude.</div>
<div class="trap"><b>Common trap.</b> Plugging in the price and quantity <em>changes</em> (ΔQ ÷ ΔP) instead of percentage changes, or flipping the ratio to %ΔP ÷ %ΔQ. Quantity always goes on top.</div>`,
      gens: ["b251-m4-pedcalc", "b251-m4-pedclass"],
    },
    {
      title: "Elastic, unit elastic and inelastic demand",
      lo: "Differentiate among elastic, unit elastic and inelastic demand, including the perfectly elastic and perfectly inelastic extremes.",
      html: `<p>Compare the size of the quantity response with the size of the price change:</p>
<table class="data-tbl"><thead><tr><th>Case</th><th>Comparison</th><th>|E<sub>p</sub>|</th><th>Curve</th></tr></thead><tbody>
<tr><td><b>Perfectly elastic</b></td><td>Any price rise at all drops quantity to zero</td><td>∞</td><td>Horizontal</td></tr>
<tr><td><b>Elastic</b></td><td>%ΔQ larger than %ΔP</td><td>greater than 1</td><td>Relatively flat</td></tr>
<tr><td><b>Unit elastic</b></td><td>%ΔQ equal to %ΔP</td><td>exactly 1</td><td>—</td></tr>
<tr><td><b>Inelastic</b></td><td>%ΔQ smaller than %ΔP</td><td>between 0 and 1</td><td>Relatively steep</td></tr>
<tr><td><b>Perfectly inelastic</b></td><td>Quantity does not change at all</td><td>0</td><td>Vertical</td></tr>
</tbody></table>
<p>So elastic demand covers ∞ ≥ |E<sub>p</sub>| &gt; 1 and inelastic demand covers 0 ≤ |E<sub>p</sub>| &lt; 1, with perfectly elastic and perfectly inelastic as the end points.</p>
${G.plot({ xLabel: "Quantity demanded per month", yLabel: "Price ($)", xMax: 50, yMax: 40, xTicks: [10, 20, 30, 40, 50], yTicks: [10, 25, 40],
    curves: [{ pts: [[0, 25], [50, 25]], style: "main", label: "D (perfectly elastic)", labelAt: 0 }], aria: "A horizontal, perfectly elastic demand curve at $25" })}
${G.plot({ xLabel: "Quantity demanded per month", yLabel: "Price ($)", xMax: 30, yMax: 40, xTicks: [6, 12, 18, 24, 30], yTicks: [10, 20, 30, 40],
    curves: [{ pts: [[12, 0], [12, 38]], style: "alt", label: "D (perfectly inelastic)", labelAt: 1 }], aria: "A vertical, perfectly inelastic demand curve at 12 units" })}
<p>The horizontal curve says buyers will take any amount at $25 but none at all above it: the response to a price rise is infinite. The vertical curve says buyers take exactly 12 units whatever the price: no response at all.</p>
<div class="example"><b>Example.</b> A 4% rise in the price of ferry tickets cuts trips by 10%: |E<sub>p</sub>| = 2.5, elastic. A 15% rise in the price of tap water cuts household use by 3%: |E<sub>p</sub>| = 0.2, inelastic. A 6% price cut on bowling that raises games bowled by exactly 6%: |E<sub>p</sub>| = 1, unit elastic.</div>
<div class="keyidea"><b>Key idea.</b> "Elastic" means quantity is more responsive than price (in percentage terms); "inelastic" means it is less responsive. Flatter means more elastic only when you compare curves at the same point.</div>
<div class="trap"><b>Common trap.</b> Letting the minus sign drive the classification, for example calling −2.1 "less than 1, so inelastic". The sign only reflects the law of demand. Classify by the absolute value: |−0.6| = 0.6 is inelastic, |−2.1| = 2.1 is elastic.</div>`,
      gens: ["b251-m4-pedclass"],
    },
    {
      title: "Elasticity and total revenue",
      lo: "Apply price elasticity to total revenue (total expenditure) and use the total-revenue test.",
      html: `<p><b>Total revenue</b> (what sellers receive, which is the same as what buyers spend) is <b>TR = P × Q</b>. A price increase pushes TR up through P but down through Q, so the net effect depends on which percentage change is bigger — that is, on the elasticity:</p>
<ul>
  <li><b>Elastic</b> demand: %ΔQ is bigger, so price and TR move in <b>opposite</b> directions. A price cut raises TR; a price rise lowers it.</li>
  <li><b>Inelastic</b> demand: %ΔP is bigger, so price and TR move in the <b>same</b> direction. A price rise raises TR; a price cut lowers it.</li>
  <li><b>Unit elastic</b> demand: the two effects cancel and TR does <b>not change</b>.</li>
</ul>
${G.plot({ xLabel: "Quantity per week", yLabel: "Price ($)", xMax: 80, yMax: 20, xTicks: [20, 40, 60, 80], yTicks: [5, 10, 15, 20],
    curves: [{ pts: [[0, 20], [80, 0]], style: "main", label: "D", labelAt: 1 },
      { pts: [[0, 15], [20, 15], [20, 0]], style: "dash" }, { pts: [[0, 10], [40, 10], [40, 0]], style: "faint" }, { pts: [[0, 5], [60, 5], [60, 0]], style: "dash" }],
    points: [{ x: 20, y: 15, label: "A" }, { x: 40, y: 10, label: "B" }, { x: 60, y: 5, label: "C" }], aria: "Total revenue rectangles under a linear demand curve" })}
<div class="example"><b>Example.</b> On the demand curve above (Q = 80 − 4P), TR is the rectangle under each point: at A, $15 × 20 = $300; at B, $10 × 40 = $400; at C, $5 × 60 = $300. Cutting the price from $15 to $10 <em>raises</em> TR by $100, so demand is elastic there (the midpoint formula gives |E<sub>p</sub>| = 1.67). Cutting from $10 to $5 <em>lowers</em> TR by $100, so demand is inelastic there (|E<sub>p</sub>| = 0.6). TR is largest at the unit-elastic midpoint, B.</div>
<p>Running the logic backward gives the <b>total-revenue test</b>: watch what a price change does to TR to learn the elasticity.</p>
<ul>
  <li>Price cut <b>raises</b> TR (or price rise lowers it) → demand is <b>elastic</b>.</li>
  <li>Price cut <b>lowers</b> TR (or price rise raises it) → demand is <b>inelastic</b>.</li>
  <li>TR <b>unchanged</b> → demand is <b>unit elastic</b>.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Elastic: P and TR move in opposite directions. Inelastic: same direction. Unit elastic: TR stays put. (The midpoint formula and the TR test always agree.)</div>
<div class="trap"><b>Common trap.</b> "Raising the price always raises revenue." Only if demand is inelastic. With elastic demand the lost sales outweigh the higher price, and revenue falls.</div>`,
      gens: ["b251-m4-tr"],
    },
    {
      title: "What makes demand more or less elastic",
      lo: "Explain the determinants of the price elasticity of demand.",
      html: `<p>Why do buyers shrug off price rises for some goods and flee from others? The slides group the reasons as follows:</p>
<ul>
  <li><b>Availability of substitutes.</b> The more substitutes, and the closer they are, the more elastic demand. If one brand of oat milk gets pricier, shoppers switch to the brand next to it. This is also why a <em>narrowly</em> defined good (one brand, one store, one flavor) is more elastic than a <em>broad</em> category (milk in general): a narrow good has many close substitutes.</li>
  <li><b>Necessities vs luxuries.</b> Goods people feel they cannot do without (prescription medicine, basic heating) have inelastic demand. Luxuries that are easy to postpone or skip (a cruise, designer jewelry) have elastic demand.</li>
  <li><b>Share of the budget.</b> The bigger the slice of income a good takes, the more elastic its demand. A 10% rise in the price of a sofa is worth shopping around over; a 10% rise in the price of a box of toothpicks is not even noticed.</li>
  <li><b>Time to adjust.</b> The longer a price change lasts, the more elastic demand becomes. Right after a jump in electricity prices, households can only turn off a few lights. Over several years they buy efficient appliances, add insulation or install solar panels. Demand is more elastic in the <b>long run</b> than in the <b>short run</b>.</li>
</ul>
<div class="example"><b>Example.</b> Compare a single airline's 7 a.m. flight from Indianapolis to Denver with "air travel" as a whole. The single flight has close substitutes (the 9 a.m. flight, other airlines), so its demand is far more elastic. Now compare spring-break travel with a commuter's daily bus pass: the trip is a postponable luxury and a large budget item, so it is more elastic than the bus pass.</div>
<div class="keyidea"><b>Key idea.</b> More substitutes, a luxury, a larger budget share, and more time to adjust all make demand <b>more</b> elastic.</div>
<div class="trap"><b>Common trap.</b> Expecting a low-priced good to be elastic because "it's cheap, so people can easily stop buying it." It is the reverse: a good that takes a tiny share of the budget usually has <em>inelastic</em> demand, because the price change hardly matters to the buyer.</div>`,
      gens: ["b251-m4-det"],
    },
    {
      title: "Cross-price elasticity of demand",
      lo: "Define, measure and interpret the cross-price elasticity of demand.",
      html: `<p>The <b>cross-price elasticity of demand</b> measures how the demand for one good responds when the price of a <em>different</em> (related) good changes, holding the first good's own price constant:</p>
<p style="text-align:center"><b>E<sub>xy</sub> = (% change in quantity demanded of good X) ÷ (% change in price of good Y)</b></p>
<p>Here the <b>sign matters</b> — do not take the absolute value:</p>
<ul>
  <li><b>E<sub>xy</sub> &gt; 0 → substitutes.</b> A higher price of Y sends buyers to X. If e-scooter rental prices rise, more people rent bikes.</li>
  <li><b>E<sub>xy</sub> &lt; 0 → complements.</b> A higher price of Y means less Y is bought, and less of the X used with it. If ski-lift passes get pricier, fewer people rent skis.</li>
  <li><b>E<sub>xy</sub> = 0 (or very close) → unrelated.</b> The price of paper clips has no effect on the demand for sunscreen.</li>
</ul>
<p>The size tells you how strong the link is: a cross elasticity of +2.5 means much closer substitutes than +0.3.</p>
<div class="example"><b>Example.</b> When the price of a gym's monthly membership rises 8%, sales of home exercise bands rise 12%: E<sub>xy</sub> = 12 ÷ 8 = <b>+1.5</b>, substitutes. When the price of printers rises 10%, ink-cartridge purchases fall 6%: E<sub>xy</sub> = −6 ÷ 10 = <b>−0.6</b>, complements.</div>
<div class="keyidea"><b>Key idea.</b> Positive = substitutes, negative = complements, zero = unrelated. Keep the sign.</div>
<div class="trap"><b>Common trap.</b> Putting the wrong variables in the ratio. The numerator is the change in quantity of <em>one</em> good; the denominator is the change in the price of the <em>other</em> good.</div>`,
      gens: ["b251-m4-cross", "b251-m4-mixed"],
    },
    {
      title: "Income elasticity of demand",
      lo: "Define, measure and interpret the income elasticity of demand.",
      html: `<p>The <b>income elasticity of demand</b> measures how demand for a good responds to a change in buyers' income, holding the good's price constant:</p>
<p style="text-align:center"><b>E<sub>i</sub> = (% change in quantity demanded) ÷ (% change in income)</b></p>
<p>Again the sign matters, and so does whether the number is above or below 1:</p>
<table class="data-tbl"><thead><tr><th>E<sub>i</sub></th><th>Type of good</th><th>Meaning</th></tr></thead><tbody>
<tr><td>greater than 1</td><td><b>Normal, luxury</b> (income elastic)</td><td>Spending on it grows faster than income</td></tr>
<tr><td>between 0 and 1</td><td><b>Normal, necessity</b> (income inelastic)</td><td>Bought more as income rises, but less than proportionally</td></tr>
<tr><td>less than 0</td><td><b>Inferior</b></td><td>Bought <em>less</em> as income rises</td></tr>
</tbody></table>
<div class="example"><b>Example.</b> Household incomes in a county rise 5%. Purchases of fresh-cut flowers rise 9% (E<sub>i</sub> = 1.8, a luxury). Purchases of toothpaste rise 1% (E<sub>i</sub> = 0.2, a necessity). Rides on the intercity bus fall 3% (E<sub>i</sub> = −0.6, an inferior good: people switch to driving or flying).</div>
<div class="keyidea"><b>Key idea.</b> Positive = normal (above 1 luxury, between 0 and 1 necessity); negative = inferior.</div>
<div class="trap"><b>Common trap.</b> Calling a necessity "inferior". A necessity is still a <em>normal</em> good — people buy a bit more of it when income rises. Only a <em>negative</em> income elasticity makes a good inferior.</div>`,
      gens: ["b251-m4-income", "b251-m4-mixed"],
    },
    {
      title: "Price elasticity of supply",
      lo: "Define, measure and interpret the price elasticity of supply and explain its determinants.",
      html: `<p>The <b>price elasticity of supply</b> measures how responsive the quantity supplied is to a change in the good's price:</p>
<p style="text-align:center"><b>E<sub>s</sub> = (% change in quantity supplied) ÷ (% change in price)</b></p>
<p>Price and quantity supplied move in the same direction, so E<sub>s</sub> is positive. Between two points, use the same midpoint method as for demand. The classification uses the same cut-off of 1, and three shapes are worth memorizing:</p>
${G.plot({ xLabel: "Quantity supplied", yLabel: "Price ($)", xMax: 60, yMax: 30, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [10, 20, 30],
    curves: [{ pts: [[22, 0], [22, 29]], style: "main", label: "S₁", labelAt: 1 }, { pts: [[0, 24], [60, 24]], style: "alt", label: "S₂", labelAt: 0 },
      { pts: [[0, 0], [54, 18]], style: "dash", label: "S₃", labelAt: 1 }], aria: "Vertical, horizontal and through-the-origin supply curves" })}
<ul>
  <li><b>Perfectly inelastic</b> supply: a <b>vertical</b> curve (S₁), E<sub>s</sub> = 0. The quantity is fixed whatever the price.</li>
  <li><b>Perfectly elastic</b> supply: a <b>horizontal</b> curve (S₂), E<sub>s</sub> = ∞.</li>
  <li><b>Unit elastic</b> supply: <b>any straight line through the origin</b> (S₃), E<sub>s</sub> = 1 at every point. Its slope is irrelevant: a steep line through the origin is just as unit elastic as a flat one, because quantity always changes by the same percentage as price.</li>
</ul>
<p>Two things determine how elastic supply is:</p>
<ul>
  <li><b>Resource substitution possibilities.</b> If the inputs used to make a good are common and easy to move in from other uses, supply is elastic (more soybeans can be grown on land that was growing corn). If the inputs are rare or unique, supply is inelastic (no one can produce more paintings by a long-dead artist).</li>
  <li><b>Time frame for the supply decision.</b> The longer producers have to adjust, the more elastic supply is. <b>Momentary</b> supply (right now) is perfectly inelastic: the fish already landed at the dock this morning is all there is. In the <b>short run</b>, firms can add shifts and overtime with their existing plants, so supply is somewhat inelastic. In the <b>long run</b>, firms build new plants and new firms enter, so supply is most elastic.</li>
</ul>
<div class="example"><b>Example.</b> The price of cut lumber rises from $400 to $500 per thousand board feet and mills raise output from 900 to 1,100 units. %ΔQ = 200 ÷ 1,000 = 20%; %ΔP = 100 ÷ 450 ≈ 22.2%; E<sub>s</sub> ≈ <b>0.9</b>, inelastic in this short-run window.</div>
<div class="keyidea"><b>Key idea.</b> Supply is more elastic when inputs are easy to substitute and when producers have more time. Momentary → short run → long run runs from perfectly inelastic to most elastic.</div>
<div class="trap"><b>Common trap.</b> Judging supply elasticity by steepness alone. Every straight-line supply curve through the origin has E<sub>s</sub> = 1, whatever its slope.</div>`,
      gens: ["b251-m4-supply"],
    },
    {
      title: "The four elasticities side by side",
      lo: "Choose the right elasticity for a situation and interpret its sign and size.",
      html: `<p>All four measures have the same shape — a percentage change in a quantity divided by a percentage change in something that causes it. What differs is the cause, and whether the sign carries information:</p>
<table class="data-tbl"><thead><tr><th>Elasticity</th><th>Formula</th><th>Read it by</th></tr></thead><tbody>
<tr><td>Price elasticity of demand, E<sub>p</sub></td><td>%ΔQ<sub>d</sub> ÷ %Δ own price</td><td>Absolute value vs 1: elastic, unit, inelastic</td></tr>
<tr><td>Cross-price elasticity, E<sub>xy</sub></td><td>%ΔQ<sub>d</sub> of X ÷ %Δ price of Y</td><td>Sign: + substitutes, − complements, 0 unrelated</td></tr>
<tr><td>Income elasticity, E<sub>i</sub></td><td>%ΔQ<sub>d</sub> ÷ %Δ income</td><td>Sign and size: &gt; 1 luxury, 0–1 necessity, &lt; 0 inferior</td></tr>
<tr><td>Price elasticity of supply, E<sub>s</sub></td><td>%ΔQ<sub>s</sub> ÷ %Δ own price</td><td>Size vs 1 (always ≥ 0)</td></tr>
</tbody></table>
<div class="example"><b>Example.</b> A report says "−1.2". If it links the price of tennis rackets to purchases of tennis balls, it is a cross elasticity: rackets and balls are complements. If it links the fare of a ferry to ferry trips, it is the price elasticity of demand: trips are elastic (|E<sub>p</sub>| = 1.2). If it links income to purchases of used cars, it is an income elasticity: used cars are inferior there.</div>
<div class="keyidea"><b>Key idea.</b> First ask <em>what caused</em> the quantity change (own price, another good's price, income) and <em>whose</em> quantity it is (buyers or sellers). That names the elasticity.</div>
<div class="trap"><b>Common trap.</b> Taking the absolute value of a cross or income elasticity. Only the price elasticity of demand is routinely quoted as a magnitude; for E<sub>xy</sub> and E<sub>i</sub> the sign is the whole point.</div>`,
      gens: ["b251-m4-mixed"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m4-c-ped", tag: "Definition", front: "What is the <em>price elasticity of demand</em>?", back: "A units-free measure of how responsive the <b>quantity demanded</b> of a good is to a change in its <b>own price</b>: E<sub>p</sub> = %ΔQ<sub>d</sub> ÷ %ΔP." },
    { id: "b251-m4-c-unitsfree", tag: "Why", front: "Why is elasticity “units-free”, and why does that matter?", back: "It divides one <b>percentage</b> change by another, so the units cancel. That lets you compare responsiveness across goods measured in different units (gallons, tickets, pounds)." },
    { id: "b251-m4-c-sign", tag: "Principle", front: "What sign does the price elasticity of demand have, and how is it usually reported?", back: "Always <b>negative (or zero)</b>, by the law of demand. The course usually reports the <b>absolute value</b>, since only the magnitude matters." },
    { id: "b251-m4-c-midpoint", tag: "Formula", front: "Midpoint formula for the price elasticity of demand", back: "E<sub>p</sub> = [(Q<sub>2</sub> − Q<sub>1</sub>) ÷ ((Q<sub>1</sub> + Q<sub>2</sub>)/2)] ÷ [(P<sub>2</sub> − P<sub>1</sub>) ÷ ((P<sub>1</sub> + P<sub>2</sub>)/2)]. Each change is divided by the <b>average</b> of the two values." },
    { id: "b251-m4-c-why-mid", tag: "Why", front: "Why use the average (midpoint) in the percentage changes?", back: "So you get the <b>same elasticity whether the price rises or falls</b> between the two points. Dividing by the starting value gives different answers in the two directions." },
    { id: "b251-m4-c-calc", tag: "Calculation", front: "Price rises from $9 to $11; quantity demanded falls from 130 to 70. |E<sub>p</sub>| (midpoint)?", back: "%ΔQ = −60 ÷ 100 = −60%; %ΔP = 2 ÷ 10 = 20%. |E<sub>p</sub>| = 60 ÷ 20 = <b>3</b> (elastic)." },
    { id: "b251-m4-c-interp", tag: "Example", front: "What does |E<sub>p</sub>| = 0.3 mean in words?", back: "A 1% rise in price lowers quantity demanded by about <b>0.3%</b> (and a 10% rise by about 3%). Demand is inelastic." },
    { id: "b251-m4-c-elastic", tag: "Definition", front: "Elastic demand", back: "%ΔQ<sub>d</sub> is <b>larger</b> than %ΔP: |E<sub>p</sub>| &gt; 1 (up to ∞)." },
    { id: "b251-m4-c-inelastic", tag: "Definition", front: "Inelastic demand", back: "%ΔQ<sub>d</sub> is <b>smaller</b> than %ΔP: 0 ≤ |E<sub>p</sub>| &lt; 1." },
    { id: "b251-m4-c-unit", tag: "Definition", front: "Unit elastic demand", back: "%ΔQ<sub>d</sub> <b>equals</b> %ΔP: |E<sub>p</sub>| = 1." },
    { id: "b251-m4-c-perfect-e", tag: "Distinction", front: "Perfectly elastic demand: value and curve?", back: "|E<sub>p</sub>| = <b>∞</b>; the demand curve is <b>horizontal</b>. Any price rise at all cuts quantity demanded to zero." },
    { id: "b251-m4-c-perfect-i", tag: "Distinction", front: "Perfectly inelastic demand: value and curve?", back: "|E<sub>p</sub>| = <b>0</b>; the demand curve is <b>vertical</b>. Quantity demanded does not change whatever the price." },
    { id: "b251-m4-c-linear", tag: "Principle", front: "Along a straight-line demand curve, how does elasticity change?", back: "It <b>falls</b> as you move down the curve: elastic at high prices (upper part), unit elastic at the midpoint, inelastic at low prices (lower part) — even though the slope is constant." },
    { id: "b251-m4-c-slope", tag: "Distinction", front: "Is elasticity the same thing as slope?", back: "<b>No.</b> Slope compares changes in units; elasticity compares <b>percentage</b> changes. A linear demand curve has one slope but many elasticities." },
    { id: "b251-m4-c-tr", tag: "Formula", front: "Total revenue", back: "TR = <b>P × Q</b>. It equals what sellers receive and what buyers spend (total expenditure)." },
    { id: "b251-m4-c-tr-elastic", tag: "Principle", front: "Demand is elastic. What happens to total revenue if price rises? Falls?", back: "Price and TR move in <b>opposite</b> directions: a price rise <b>lowers</b> TR, a price cut <b>raises</b> TR." },
    { id: "b251-m4-c-tr-inelastic", tag: "Principle", front: "Demand is inelastic. What happens to total revenue if price rises? Falls?", back: "Price and TR move in the <b>same</b> direction: a price rise <b>raises</b> TR, a price cut <b>lowers</b> TR." },
    { id: "b251-m4-c-tr-unit", tag: "Principle", front: "Demand is unit elastic. What happens to total revenue when price changes?", back: "<b>Nothing</b> — the percentage fall in quantity exactly offsets the percentage rise in price." },
    { id: "b251-m4-c-trtest", tag: "Principle", front: "State the total-revenue test.", back: "Price cut raises TR → <b>elastic</b>. Price cut lowers TR → <b>inelastic</b>. TR unchanged → <b>unit elastic</b>." },
    { id: "b251-m4-c-trmax", tag: "Example", front: "A band wants more ticket revenue and estimates |E<sub>p</sub>| = 1.8. Raise or cut the price?", back: "<b>Cut</b> it. Demand is elastic, so price and revenue move in opposite directions." },
    { id: "b251-m4-c-det-subs", tag: "Principle", front: "How do substitutes affect the price elasticity of demand?", back: "More and closer substitutes → <b>more elastic</b>. Narrowly defined goods (one brand) are more elastic than broad categories." },
    { id: "b251-m4-c-det-nec", tag: "Principle", front: "Necessities vs luxuries — which has more elastic demand?", back: "<b>Luxuries</b>. Necessities have inelastic demand because buyers feel they cannot go without them." },
    { id: "b251-m4-c-det-budget", tag: "Principle", front: "How does a good's share of the budget affect its price elasticity?", back: "A <b>larger</b> share of the budget → <b>more elastic</b>. A good that costs pennies a year hardly registers when its price changes." },
    { id: "b251-m4-c-det-time", tag: "Principle", front: "Short run vs long run: when is demand more elastic?", back: "In the <b>long run</b>. Given time, buyers find substitutes and change habits and equipment." },
    { id: "b251-m4-c-cross", tag: "Formula", front: "Cross-price elasticity of demand", back: "E<sub>xy</sub> = (% change in quantity demanded of X) ÷ (% change in price of Y)." },
    { id: "b251-m4-c-cross-sign", tag: "Distinction", front: "What does the sign of a cross-price elasticity tell you?", back: "<b>Positive</b> → substitutes. <b>Negative</b> → complements. <b>Zero</b> (or about zero) → unrelated." },
    { id: "b251-m4-c-cross-calc", tag: "Calculation", front: "Price of video-game consoles rises 20%; purchases of games fall 9%. Cross elasticity and relationship?", back: "E<sub>xy</sub> = −9 ÷ 20 = <b>−0.45</b>: <b>complements</b>." },
    { id: "b251-m4-c-income", tag: "Formula", front: "Income elasticity of demand", back: "E<sub>i</sub> = (% change in quantity demanded) ÷ (% change in income), holding the good's price constant." },
    { id: "b251-m4-c-income-class", tag: "Distinction", front: "Classify a good by its income elasticity.", back: "E<sub>i</sub> &gt; 1: normal <b>luxury</b> (income elastic). 0 &lt; E<sub>i</sub> &lt; 1: normal <b>necessity</b> (income inelastic). E<sub>i</sub> &lt; 0: <b>inferior</b>." },
    { id: "b251-m4-c-necessity-trap", tag: "Example", front: "E<sub>i</sub> = 0.4. Inferior good?", back: "<b>No.</b> It is positive, so the good is <b>normal</b> — a necessity (income inelastic). Inferior requires E<sub>i</sub> &lt; 0." },
    { id: "b251-m4-c-pes", tag: "Formula", front: "Price elasticity of supply", back: "E<sub>s</sub> = (% change in quantity supplied) ÷ (% change in price). It is positive." },
    { id: "b251-m4-c-pes-shapes", tag: "Distinction", front: "Which supply curves are perfectly inelastic, unit elastic and perfectly elastic?", back: "Vertical → E<sub>s</sub> = 0. Any straight line <b>through the origin</b> → E<sub>s</sub> = 1 (slope irrelevant). Horizontal → E<sub>s</sub> = ∞." },
    { id: "b251-m4-c-pes-res", tag: "Principle", front: "How do resource substitution possibilities affect supply elasticity?", back: "The easier it is to move inputs into producing the good, the <b>more elastic</b> supply is. Unique or rare inputs make supply inelastic." },
    { id: "b251-m4-c-pes-time", tag: "Principle", front: "Momentary, short-run and long-run supply: how elastic is each?", back: "<b>Momentary</b>: perfectly inelastic (vertical). <b>Short run</b>: somewhat inelastic (existing plants, more shifts). <b>Long run</b>: most elastic (new plants, entry and exit)." },
    { id: "b251-m4-c-which", tag: "Why", front: "How do you tell which elasticity a situation describes?", back: "Ask what <b>caused</b> the change (own price, another good's price, or income) and <b>whose</b> quantity changed (buyers' quantity demanded or sellers' quantity supplied)." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "% change in quantity bigger than % change in price", think: "Elastic (|E<sub>p</sub>| &gt; 1)", why: "Quantity is more responsive than price." },
    { when: "% change in quantity smaller than % change in price", think: "Inelastic (|E<sub>p</sub>| &lt; 1)", why: "Quantity is less responsive than price." },
    { when: "“between two points”, “from $… to $…”", think: "Midpoint formula", why: "Divide each change by the average of the two values." },
    { when: "Horizontal demand curve; “sells nothing at a higher price”", think: "Perfectly elastic (∞)", why: "The tiniest price rise drops quantity to zero." },
    { when: "Vertical demand curve; “buys the same amount at any price”", think: "Perfectly inelastic (0)", why: "Quantity does not respond at all." },
    { when: "“price rises and total revenue falls” / “price cut raises revenue”", think: "Elastic demand", why: "Price and TR move in opposite directions." },
    { when: "“price rises and total revenue rises too”", think: "Inelastic demand", why: "Price and TR move in the same direction." },
    { when: "“revenue unchanged after the price change”", think: "Unit elastic", why: "The two percentage changes cancel." },
    { when: "“many close substitutes”, “one brand of…”, “luxury”, “big-ticket”, “in the long run”", think: "More elastic demand", why: "The four determinants all point toward a bigger response." },
    { when: "“price of Y” changes and quantity of X responds", think: "Cross-price elasticity", why: "Keep the sign: + substitutes, − complements." },
    { when: "Negative cross elasticity", think: "Complements", why: "A higher price of one cuts demand for the other." },
    { when: "“income rises/falls” and quantity responds", think: "Income elasticity", why: "Sign and size classify the good." },
    { when: "Income elasticity &lt; 0", think: "Inferior good", why: "People buy less as they get richer." },
    { when: "Income elasticity between 0 and 1 / greater than 1", think: "Necessity / luxury (both normal)", why: "Positive means normal; above 1 means income elastic." },
    { when: "“producers”, “quantity supplied”, “offer for sale”", think: "Price elasticity of supply", why: "Sellers' response to the good's own price." },
    { when: "Supply line through the origin", think: "Unit elastic supply (E<sub>s</sub> = 1)", why: "Quantity changes by the same percentage as price, whatever the slope." },
  ];

  /* ============================================================
   * PRACTICE 1 — Computing price elasticity of demand
   * ============================================================ */
  const NICE_E = [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1.25, 1.5, 1.6, 2, 2.4, 2.5, 3, 4];
  function pctPair() {
    for (let k = 0; k < 200; k++) {
      const p = U.pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
      const e = U.pick(NICE_E);
      const q = U.round(e * p, 2);
      if (Math.abs(q * 2 - Math.round(q * 2)) < 1e-9 && q > 0 && q <= 60) return { p, q, e };
    }
    return { p: 10, q: 25, e: 2.5 };
  }

  const genPedCalc = STUDY.makeGenerator({
    id: "b251-m4-pedcalc",
    name: "Computing price elasticity of demand",
    blurb: "Use the midpoint formula, work from percentage changes, and run the formula backward to predict quantities and prices.",
    variants: [
      {
        name: "Midpoint formula from two price–quantity points",
        make() {
          const d = dPts();
          return Q.num({
            q: `${dStory(d)} Using the <b>midpoint formula</b>, what is the price elasticity of demand? Report the absolute value, rounded to two decimals.`,
            answer: d.e, tol: Math.max(0.02, d.e * 0.02),
            traps: dTraps(d),
            sol: steps(...dSteps(d)),
          });
        },
      },
      {
        name: "Elasticity from given percentage changes",
        make() {
          const { p, q, e } = pctPair();
          const up = Math.random() < 0.5;
          const g = U.pick(DGOODS);
          return Q.num({
            q: `After ${g.who} ${up ? "raises" : "cuts"} the price of a ${g.s} by <b>${p}%</b>, the quantity demanded ${up ? "falls" : "rises"} by <b>${U.fmt(q)}%</b>. What is the price elasticity of demand (absolute value)?`,
            answer: e, tol: 0.02,
            traps: traps(e, [
              { value: 1 / e, why: "That is %ΔP ÷ %ΔQ. Put the percentage change in quantity on top." },
              { value: -e, why: "The course reports the price elasticity of demand as an absolute value." },
              { value: q - p, why: "Elasticity is a ratio of the two percentage changes, not their difference." },
            ]),
            sol: steps("E<sub>p</sub> = (% change in quantity demanded) ÷ (% change in price). The percentages are already given, so no midpoint step is needed.",
              `E<sub>p</sub> = ${up ? "−" : "+"}${U.fmt(q)}% ÷ ${up ? "+" : "−"}${p}% = −${U.fmt(e)}, so |E<sub>p</sub>| = <b>${U.fmt(e)}</b>.`,
              `Since ${U.fmt(e)} ${e > 1 ? "&gt;" : "&lt;"} 1, demand is <b>${pedClass(e)}</b>: quantity changed by ${e > 1 ? "more" : "less"} (in percent) than price.`),
          });
        },
      },
      {
        name: "Reverse: predict the change in quantity",
        make() {
          const e = U.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.2, 1.4, 1.5, 1.8, 2, 2.5, 3]);
          const p = U.pick([2, 4, 5, 6, 8, 10, 12, 15, 20]);
          const up = Math.random() < 0.5;
          const g = U.pick(DGOODS);
          const ans = U.round(e * p, 4);
          return Q.num({
            q: `Demand for ${g.p} at ${g.who} has a price elasticity of <b>${U.fmt(e)}</b> (absolute value). If the price ${up ? "rises" : "falls"} by <b>${p}%</b>, by about what percentage will the quantity demanded ${up ? "fall" : "rise"}?`,
            answer: ans, unit: "%", tol: 0.05,
            traps: traps(ans, [
              { value: p / e, why: "Rearrange carefully: %ΔQ = E<sub>p</sub> × %ΔP. Dividing the price change by the elasticity runs the formula backward." },
              { value: p, why: "That would be true only for unit elastic demand (|E<sub>p</sub>| = 1)." },
              { value: e, why: "That is the elasticity itself — the change for a <em>1%</em> price change. Multiply by the actual price change." },
            ]),
            sol: steps("Rearrange the definition: % change in quantity = elasticity × % change in price.",
              `%ΔQ ≈ ${U.fmt(e)} × ${p}% = <b>${U.fmt(U.round(ans, 2))}%</b>, a ${up ? "fall" : "rise"} (price and quantity demanded move in opposite directions).`),
          });
        },
      },
      {
        name: "Reverse: price change needed for a target quantity",
        make() {
          const ctx = U.pick([
            { who: "A city transit agency", what: "ridership", how: "fares" },
            { who: "A state park", what: "visits", how: "entry fees" },
            { who: "A campus dining hall", what: "meal-plan sign-ups", how: "meal-plan prices" },
            { who: "A minor-league baseball team", what: "attendance", how: "ticket prices" },
            { who: "A public pool", what: "admissions", how: "admission prices" },
          ]);
          const e = U.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1.25, 1.5, 2, 2.5]);
          let t;
          for (let k = 0; k < 50; k++) { t = U.pick([3, 4, 5, 6, 8, 10, 12, 15]); if (Math.abs((t / e) * 4 - Math.round((t / e) * 4)) < 1e-9 && t / e <= 40) break; }
          const ans = t / e;
          return Q.num({
            q: `${ctx.who} wants to raise ${ctx.what} by <b>${t}%</b> by lowering ${ctx.how}. If the price elasticity of demand is <b>${U.fmt(e)}</b> (absolute value), by about what percentage must it cut ${ctx.how}?`,
            answer: ans, unit: "%", tol: 0.05,
            traps: traps(ans, [
              { value: t * e, why: "Here you know %ΔQ and need %ΔP, so divide: %ΔP = %ΔQ ÷ E<sub>p</sub>." },
              { value: t, why: "A price cut equal to the target would only work if demand were unit elastic." },
            ]),
            sol: steps("Start from E<sub>p</sub> = %ΔQ ÷ %ΔP and solve for the price change: %ΔP = %ΔQ ÷ E<sub>p</sub>.",
              `%ΔP = ${t}% ÷ ${U.fmt(e)} = <b>${U.fmt(U.round(ans, 2))}%</b> cut.`,
              e < 1 ? "Demand is inelastic, so it takes a <em>bigger</em> percentage price cut to get the target increase in quantity." : "Demand is elastic, so a <em>smaller</em> percentage price cut does the job."),
          });
        },
      },
      {
        name: "Midpoint percentage change (one step)",
        make() {
          const d = dPts();
          const which = U.pick(["price", "quantity"]);
          const a = which === "price" ? d.P1 : d.Q1, b = which === "price" ? d.P2 : d.Q2;
          const ans = mid(a, b);
          const absAns = Math.abs(ans);
          return Q.num({
            q: `${dStory(d)} Using the <b>midpoint method</b>, by what percentage did the <b>${which === "price" ? "price" : "quantity demanded"}</b> change? Give the size of the change in percent (no sign), rounded to two decimals.`,
            answer: absAns, unit: "%", tol: Math.max(0.05, absAns * 0.005),
            traps: traps(absAns, [
              { value: Math.abs(simple(a, b)), why: "That divides by the starting value. The midpoint method divides by the average of the two values." },
              { value: Math.abs(simple(b, a)), why: "That divides by the ending value. The midpoint method divides by the average." },
              { value: Math.abs(b - a), why: "That is the change in units, not a percentage." },
            ]),
            sol: steps("Midpoint method: (new − old) ÷ average of old and new, times 100.",
              which === "price" ? midLine("P", a, b, true) : midLine("Q", a, b),
              `So the ${which === "price" ? "price" : "quantity demanded"} changed by <b>${pctAbs(ans)}</b>. (Dividing by the starting value would give ${pctAbs(simple(a, b))} instead.)`),
          });
        },
      },
      {
        name: "Elasticity on a linear demand equation",
        make() {
          let L, P1, P2, e;
          for (let k = 0; k < 500; k++) {
            L = linDemand();
            P1 = U.randInt(1, L.Pmax - 3);
            P2 = P1 + U.randInt(1, 2);
            const Q1 = qOf(L, P1), Q2 = qOf(L, P2);
            e = Math.abs(mid(Q1, Q2) / mid(P1, P2));
            if (Math.abs(e - 1) >= 0.1 && e >= 0.1 && e <= 8) break;
          }
          const Q1 = qOf(L, P1), Q2 = qOf(L, P2);
          return Q.num({
            q: `The demand for a product is <b>Q = ${L.a} − ${L.b}P</b>, where P is in dollars. Using the midpoint formula, what is the price elasticity of demand (absolute value) when the price rises from <b>${U.money(P1)}</b> to <b>${U.money(P2)}</b>? Round to two decimals.`,
            answer: e, tol: Math.max(0.02, e * 0.02),
            traps: traps(e, [
              { value: L.b, why: "That is the slope term (units of Q per dollar), not an elasticity. Convert both changes to percentages." },
              { value: 1 / e, why: "Upside down: %ΔQ goes on top." },
              { value: Math.abs(simple(Q1, Q2) / simple(P1, P2)), why: "That uses the starting values as the base. The midpoint formula uses averages." },
              { value: -e, why: "Report the absolute value." },
            ]),
            sol: steps("First find the quantity at each price from the equation, then apply the midpoint formula.",
              `At ${U.money(P1)}: Q = ${L.a} − ${L.b}(${P1}) = ${Q1}. At ${U.money(P2)}: Q = ${L.a} − ${L.b}(${P2}) = ${Q2}.`,
              `${midLine("Q", Q1, Q2)}<br>${midLine("P", P1, P2, true)}`,
              `|E<sub>p</sub>| = ${pctAbs(mid(Q1, Q2))} ÷ ${pctAbs(mid(P1, P2))} = <b>${d2(e)}</b> (${pedClass(e)}). This line's midpoint is at P = ${U.money(L.Pmax / 2)}; prices ${P1 + P2 > L.Pmax ? "above" : "below"} it are on the ${P1 + P2 > L.Pmax ? "elastic upper" : "inelastic lower"} part.`),
          });
        },
      },
      {
        name: "Interpret an elasticity value",
        make() {
          const e = U.pick([0.15, 0.3, 0.45, 0.6, 0.7, 1.3, 1.6, 2.2, 2.8, 3.5]);
          const g = U.pick(DGOODS);
          const p = U.pick([5, 10, 20]);
          const right = `A ${p}% rise in the price of a ${g.s} lowers the quantity demanded by about ${U.fmt(U.round(e * p, 2))}%`;
          return Q.mc({
            q: `An economist estimates that the price elasticity of demand for ${g.p} is <b>${U.fmt(e)}</b> (absolute value). Which interpretation is correct?`,
            right,
            wrong: [
              { t: `A ${p}% rise in the price of a ${g.s} lowers the quantity demanded by about ${U.fmt(U.round(p / e, 2))}%`, why: "That divides by the elasticity. %ΔQ = elasticity × %ΔP." },
              { t: `A $1 rise in the price lowers the quantity demanded by ${U.fmt(e)} ${g.p}`, why: "Elasticity is units-free: it links percentage changes, not dollars and units." },
              { t: `A ${p}% rise in the price raises the quantity demanded by about ${U.fmt(U.round(e * p, 2))}%`, why: "By the law of demand, a higher price lowers quantity demanded." },
              { t: `Demand is ${e > 1 ? "inelastic" : "elastic"}, so the quantity demanded changes by ${e > 1 ? "less" : "more"} than the price in percentage terms`, why: `${U.fmt(e)} is ${e > 1 ? "greater" : "less"} than 1, so demand is ${pedClass(e)}.` },
            ],
            sol: steps("|E<sub>p</sub>| is the % change in quantity demanded for each 1% change in price, in the opposite direction.",
              `${U.fmt(e)} × ${p}% = ${U.fmt(U.round(e * p, 2))}%. So a ${p}% price rise cuts quantity demanded by about ${U.fmt(U.round(e * p, 2))}%; demand is ${pedClass(e)}.`),
          });
        },
      },
      {
        name: "Why the midpoint method?",
        make() {
          const d = dPts();
          // simple elasticity in each direction, base = the starting point of that direction
          const fwd = Math.abs(simple(d.Q1, d.Q2) / simple(d.P1, d.P2));
          const back = Math.abs(simple(d.Q2, d.Q1) / simple(d.P2, d.P1));
          return Q.mc({
            q: `${dStory(d)}<br>Dividing by the <em>starting</em> values, Ana gets an elasticity of ${d2(fwd)}. Ben does the same for the reverse move (from ${U.money(d.P2)} back to ${U.money(d.P1)}) and gets ${d2(back)}. The midpoint formula gives ${d2(d.e)} both ways. Why does the course use the midpoint formula?`,
            right: "Dividing by the average of the two values gives the same elasticity whichever direction the price moves",
            wrong: [
              { t: "It always produces a larger elasticity, which makes demand look more responsive", why: `Here the midpoint answer (${d2(d.e)}) lies between the other two; it is not designed to be larger.` },
              { t: "It turns the elasticity into a positive number", why: "Taking the absolute value does that. The midpoint formula is about which base to divide by." },
              { t: "It measures the slope of the demand curve between the two points", why: "Slope uses unit changes. The midpoint formula still uses percentage changes." },
            ],
            sol: steps("A percentage change depends on what you divide by. Starting from the low value or the high value gives different percentages.",
              `Using the average of the two prices and the two quantities makes the arc between the points give one answer, ${d2(d.e)}, in both directions.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Classifying price elasticity of demand
   * ============================================================ */
  const PED_CATS = ["Perfectly inelastic", "Inelastic", "Unit elastic", "Elastic", "Perfectly elastic"];
  const PED_WHY = {
    "Perfectly inelastic": "|E<sub>p</sub>| = 0: quantity does not respond at all.",
    "Inelastic": "0 &lt; |E<sub>p</sub>| &lt; 1: quantity responds less than price in percentage terms.",
    "Unit elastic": "|E<sub>p</sub>| = 1: quantity responds by exactly the same percentage as price.",
    "Elastic": "|E<sub>p</sub>| &gt; 1: quantity responds more than price in percentage terms.",
    "Perfectly elastic": "|E<sub>p</sub>| = ∞: any price rise drops quantity to zero.",
  };
  function elasticNum() { return U.pick([1.2, 1.3, 1.5, 1.8, 2, 2.4, 2.7, 3.1, 3.6, 4.2, 5]); }
  function inelasticNum() { return U.pick([0.05, 0.1, 0.15, 0.25, 0.3, 0.4, 0.55, 0.6, 0.7, 0.8, 0.85]); }
  function valueItem(cat) {
    const neg = Math.random() < 0.5;
    const show = v => neg ? `${EP} = −${U.fmt(v)}` : `|${EP}| = ${U.fmt(v)}`;
    if (cat === "Elastic") return show(elasticNum());
    if (cat === "Inelastic") return show(inelasticNum());
    if (cat === "Unit elastic") return U.pick([`${EP} = −1`, `|${EP}| = 1`, `|${EP}| = 1.0`]);
    if (cat === "Perfectly inelastic") return U.pick([`${EP} = 0`, `|${EP}| = 0`]);
    return U.pick([`|${EP}| = ∞ (infinite)`, `${EP} is infinitely large in absolute value`]);
  }
  function pctItem(cat) {
    const p = U.pick([2, 4, 5, 8, 10, 12, 15, 20]);
    const up = Math.random() < 0.5;
    const pv = up ? "rises" : "falls", qv = up ? "falls" : "rises";
    let q;
    if (cat === "Elastic") q = U.round(p * U.pick([1.5, 2, 2.5, 3]), 1);
    else if (cat === "Inelastic") q = U.round(p * U.pick([0.1, 0.25, 0.4, 0.5, 0.6]), 1);
    else if (cat === "Unit elastic") q = p;
    if (cat === "Perfectly inelastic") return `Price ${pv} ${p}%; quantity demanded does not change`;
    if (cat === "Perfectly elastic") return `At a price even slightly above the going price, quantity demanded drops to zero`;
    return `Price ${pv} ${p}%; quantity demanded ${qv} ${U.fmt(q)}%`;
  }
  const WORD_BANK = [
    { t: "A small farm can sell all the corn it wants at the market price, but no buyer will pay even a cent more for its identical corn.", cat: "Perfectly elastic" },
    { t: "One stall at a crowded market sells exactly the same bottled water as ten neighbors. If it charges a dime more than they do, it sells none.", cat: "Perfectly elastic" },
    { t: "A patient needs exactly one dose of an antidote that has no substitute, and buys that one dose whether it costs $40 or $400.", cat: "Perfectly inelastic" },
    { t: "A driver must renew a license once every few years and pays the fee whatever it is; the number of renewals does not change when the fee rises.", cat: "Perfectly inelastic" },
    { t: "After a streaming service raised its monthly price by 10%, its number of subscribers fell by 26%.", cat: "Elastic" },
    { t: "When a ski resort raised lift-ticket prices by 5%, the number of skier-days fell by 12%.", cat: "Elastic" },
    { t: "A 20% rise in the price of table salt reduced the amount sold by only 2%.", cat: "Inelastic" },
    { t: "Doubling the price of a heart medication barely changed the number of prescriptions filled; they fell by about 4%.", cat: "Inelastic" },
    { t: "A bowling alley cut prices by 8% and the number of games bowled rose by exactly 8%, leaving revenue unchanged.", cat: "Unit elastic" },
    { t: "A 12% price increase for a bakery's bread cut the number of loaves sold by exactly 12%.", cat: "Unit elastic" },
  ];

  const genPedClass = STUDY.makeGenerator({
    id: "b251-m4-pedclass",
    name: "Classifying price elasticity of demand",
    blurb: "Sort elasticities into elastic, unit elastic and inelastic (and the perfect extremes) from numbers, percentages, words and graphs.",
    variants: [
      {
        name: "Classify elasticity values",
        make() {
          const cats = U.sample(PED_CATS, 5);
          const extra = U.pick(["Elastic", "Inelastic"]);
          const used = new Set();
          const items = [];
          for (const c of cats.concat([extra])) {
            let t, k = 0;
            do { t = valueItem(c); } while (used.has(t) && k++ < 20);
            if (used.has(t)) continue;
            used.add(t);
            items.push({ t, cat: c, why: PED_WHY[c] });
          }
          return Q.classify({
            q: "Classify the price elasticity of demand described by each value.",
            cats: PED_CATS, items: items.slice(0, 6),
            sol: steps("Ignore the sign: it is always negative for demand. Compare the absolute value with 1.",
              "Above 1 → elastic; exactly 1 → unit elastic; between 0 and 1 → inelastic. The end points are 0 (perfectly inelastic) and ∞ (perfectly elastic)."),
          });
        },
      },
      {
        name: "Classify from percentage changes",
        make() {
          const base = U.shuffle(["Elastic", "Inelastic", "Unit elastic", U.pick(["Perfectly inelastic", "Perfectly elastic"]), U.pick(["Elastic", "Inelastic"])]);
          const used = new Set(), items = [];
          for (const c of base) {
            let t, k = 0;
            do { t = pctItem(c); } while (used.has(t) && k++ < 20);
            if (used.has(t)) continue;
            used.add(t);
            items.push({ t, cat: c, why: PED_WHY[c] });
          }
          return Q.classify({
            q: "Each line describes how buyers respond to a price change. Classify the demand.",
            cats: PED_CATS, items,
            sol: steps("Compare the size of the % change in quantity with the size of the % change in price.",
              "Bigger → elastic. Equal → unit elastic. Smaller → inelastic. No change in quantity at all → perfectly inelastic; quantity collapsing to zero at any higher price → perfectly elastic."),
          });
        },
      },
      {
        name: "Compute, then classify",
        make() {
          const d = dPts(U.pick(["elastic", "inelastic"]));
          const right = cap(pedClass(d.e));
          const all = ["Elastic", "Unit elastic", "Inelastic", "Perfectly inelastic"];
          const why = {
            "Elastic": "The quantity change is smaller than the price change in percentage terms, so |E<sub>p</sub>| &lt; 1.",
            "Inelastic": "The quantity change is larger than the price change in percentage terms, so |E<sub>p</sub>| &gt; 1.",
            "Unit elastic": `The two percentage changes are not equal: |E<sub>p</sub>| = ${d2(d.e)}, not 1.`,
            "Perfectly inelastic": "Quantity did change, so demand is not perfectly inelastic.",
          };
          return inOrder(Q.mc({
            q: `${dStory(d)} Using the midpoint formula, demand over this price range is:`,
            right, wrong: all.filter(x => x !== right).map(t => ({ t, why: why[t] })),
            sol: steps(...dSteps(d)),
          }), all);
        },
      },
      {
        name: "Perfectly elastic or perfectly inelastic graph",
        make() {
          const horiz = Math.random() < 0.5;
          const P0 = U.pick([12, 15, 18, 24, 30]), Q0 = U.pick([20, 25, 35, 40, 45]);
          const graph = G.plot({ xLabel: "Quantity demanded per week", yLabel: "Price ($)", xMax: 60, yMax: 40, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [10, 20, 30, 40],
            curves: [horiz ? { pts: [[0, P0], [60, P0]], style: "main", label: "D", labelAt: 1 } : { pts: [[Q0, 0], [Q0, 38]], style: "main", label: "D", labelAt: 1 }], aria: "a demand curve" });
          const right = horiz ? "Perfectly elastic: |E<sub>p</sub>| = ∞" : "Perfectly inelastic: |E<sub>p</sub>| = 0";
          const wrong = horiz
            ? [{ t: "Perfectly inelastic: |E<sub>p</sub>| = 0", why: "Perfectly inelastic demand is <em>vertical</em>: quantity fixed at every price." },
              { t: "Unit elastic: |E<sub>p</sub>| = 1", why: "A unit-elastic demand curve is not a straight horizontal line." },
              { t: "Zero slope means zero elasticity", why: "Flat means infinitely responsive: the slightest price rise wipes out all sales." }]
            : [{ t: "Perfectly elastic: |E<sub>p</sub>| = ∞", why: "Perfectly elastic demand is <em>horizontal</em>." },
              { t: "Unit elastic: |E<sub>p</sub>| = 1", why: "Quantity does not change at all here, so the elasticity is 0." },
              { t: "Elastic, because the curve is very steep", why: "Steep means unresponsive. A vertical curve is the extreme: no response at all." }];
          return Q.mc({
            q: `What is the price elasticity of demand shown by this curve?${graph}`,
            right, wrong,
            sol: steps("Ask what happens to quantity demanded when price changes along the curve.",
              horiz ? `Buyers take any quantity at ${U.money(P0)} and none at any higher price: an infinite response. Horizontal = <b>perfectly elastic</b>.`
                : `Buyers take ${Q0} units whatever the price: no response. Vertical = <b>perfectly inelastic</b>.`),
          });
        },
      },
      {
        name: "Compare two demand curves through one point",
        make() {
          const P0 = U.pick([10, 12, 14, 16]), Q0 = U.pick([25, 30, 35]);
          const steepS = U.pick([0.8, 1, 1.2]), flatS = U.pick([0.12, 0.15, 0.2]);
          const [ls, lf] = U.shuffle(["D₁", "D₂"]);
          const line = (s, label) => ({ pts: [[Math.max(0, Q0 - (25 - P0) / s), Math.min(25, P0 + Q0 * s)], [Math.min(60, Q0 + P0 / s), Math.max(0, P0 - (60 - Q0) * s)]], label });
          const steep = line(steepS, ls), flat = line(flatS, lf);
          const graph = G.plot({ xLabel: "Quantity per week", yLabel: "Price ($)", xMax: 60, yMax: 25, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [5, 10, 15, 20, 25],
            curves: [{ pts: steep.pts, style: "main", label: ls, labelAt: 0 }, { pts: flat.pts, style: "alt", label: lf, labelAt: 0 }],
            points: [{ x: Q0, y: P0, label: "A" }], aria: "two demand curves crossing at point A" });
          return Q.mc({
            q: `Both demand curves pass through point A. For a small price rise starting at A, which demand is more elastic?${graph}`,
            right: `${lf}, the flatter curve`,
            wrong: [
              { t: `${ls}, the steeper curve`, why: "On the steep curve the same price rise cuts quantity only a little, so the percentage response is smaller." },
              { t: "Both are equally elastic, because they start from the same price and quantity", why: "Same starting point, but the quantity responses differ, so the percentage changes in quantity differ." },
              { t: "It cannot be compared without knowing the slope of each curve in numbers", why: "At a common point the percentage change in price is identical, so the curve with the bigger quantity response is more elastic." },
            ],
            sol: steps("At a shared point, both curves start from the same P and Q. A given price rise is the same percentage change on both.",
              `The flatter curve (${lf}) loses more quantity for that rise, so its %ΔQ — and its elasticity — is larger.`,
              "This comparison only works at a common point; slope alone does not determine elasticity."),
          });
        },
      },
      {
        name: "Elasticity at points on a linear demand curve",
        make() {
          const Pmax = U.pick([20, 24, 30, 40]), Qmax = U.pick([60, 80, 100, 120]);
          const at = f => ({ x: Qmax * (1 - f), y: Pmax * f });
          const fr = { hi: U.pick([0.75, 0.8, 0.85]), mid: 0.5, lo: U.pick([0.15, 0.2, 0.25]) };
          const extra = U.pick([0.65, 0.35]);
          const labs = U.sample(["A", "B", "C", "E", "F", "G", "H", "J"], 4);
          const spots = U.shuffle([["hi", fr.hi], ["mid", 0.5], ["lo", fr.lo], [extra > 0.5 ? "hi" : "lo", extra]]);
          const points = [], items = [];
          spots.forEach(([k, f], i) => {
            const p = at(f);
            points.push({ x: p.x, y: p.y, label: labs[i] });
            const cat = k === "hi" ? "Elastic" : k === "lo" ? "Inelastic" : "Unit elastic";
            items.push({ t: `Point ${labs[i]}`, cat, why: k === "mid" ? "It is the midpoint of the line, where |E<sub>p</sub>| = 1." : k === "hi" ? "Above the midpoint: high price, low quantity, so |E<sub>p</sub>| &gt; 1." : "Below the midpoint: low price, high quantity, so |E<sub>p</sub>| &lt; 1." });
          });
          const graph = G.plot({ xLabel: "Quantity", yLabel: "Price ($)", xMax: Qmax, yMax: Pmax, xTicks: [0.25, 0.5, 0.75, 1].map(f => Qmax * f), yTicks: [0.25, 0.5, 0.75, 1].map(f => Pmax * f),
            curves: [{ pts: [[0, Pmax], [Qmax, 0]], style: "main", label: "D", labelAt: 1 }], points, aria: "points on a straight-line demand curve" });
          return Q.classify({
            q: `The graph shows a straight-line demand curve. Classify the price elasticity of demand at each point.${graph}`,
            cats: ["Elastic", "Unit elastic", "Inelastic"], items,
            sol: steps("A straight-line demand curve has a constant slope but its elasticity changes along it.",
              `The midpoint is at price ${U.money(Pmax / 2)} and quantity ${Qmax / 2}: unit elastic there.`,
              "Above the midpoint (high price, small quantity) demand is elastic; below it (low price, large quantity) it is inelastic."),
          });
        },
      },
      {
        name: "Describe the case in words",
        make() {
          const it = U.pick(WORD_BANK);
          const all = ["Perfectly inelastic", "Inelastic", "Unit elastic", "Elastic", "Perfectly elastic"];
          const opts = all.filter(c => c !== it.cat);
          return inOrder(Q.mc({
            q: `${it.t}<br>Which best describes the price elasticity of demand?`,
            right: it.cat,
            wrong: opts.map(t => ({ t, why: `${t}: ${PED_WHY[t]} That does not match this description.` })),
            sol: steps("Compare the response of quantity with the size of the price change (or note if there is no response, or a total collapse).",
              `${it.cat}: ${PED_WHY[it.cat]}`),
          }), all);
        },
      },
      {
        name: "Select all true statements about elasticity ranges",
        make() {
          const BANK = [
            { t: "If |E<sub>p</sub>| = 2.5, a 1% price rise cuts quantity demanded by about 2.5%.", ok: true },
            { t: "Elastic demand means the % change in quantity demanded exceeds the % change in price.", ok: true },
            { t: "A vertical demand curve is perfectly inelastic.", ok: true },
            { t: "A horizontal demand curve has an infinite price elasticity.", ok: true },
            { t: "An elasticity of −0.4 describes inelastic demand.", ok: true, why: "Classify by the absolute value, 0.4." },
            { t: "Along a straight-line demand curve, demand is more elastic at higher prices.", ok: true },
            { t: "An elasticity of −3 is “less elastic” than −0.5 because it is a smaller number.", ok: false, why: "Compare absolute values: 3 &gt; 0.5, so −3 is <em>more</em> elastic." },
            { t: "A straight-line demand curve has the same elasticity at every point.", ok: false, why: "Constant slope, not constant elasticity: it is elastic at the top and inelastic at the bottom." },
            { t: "Unit elastic demand means quantity demanded falls by one unit when price rises by $1.", ok: false, why: "Unit elastic is about <em>percentages</em>: %ΔQ = %ΔP." },
            { t: "Inelastic demand means quantity demanded does not change at all when price changes.", ok: false, why: "That is <em>perfectly</em> inelastic. Ordinary inelastic demand responds, just less than proportionally." },
            { t: "A perfectly elastic demand curve is vertical.", ok: false, why: "Perfectly elastic is horizontal; vertical is perfectly inelastic." },
            { t: "If price rises 10% and quantity demanded falls 4%, demand is elastic.", ok: false, why: "4 ÷ 10 = 0.4 &lt; 1: inelastic." },
          ];
          const opts = dealMulti("m4-range", BANK, 5);
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Classify by |E<sub>p</sub>| against 1, using percentage changes — never units or slope.",
              "Remember the extremes: vertical = 0 (perfectly inelastic), horizontal = ∞ (perfectly elastic). A straight line runs from elastic (top) to inelastic (bottom)."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Elasticity and total revenue
   * ============================================================ */
  const TR_DIR = ["Total revenue rises", "Total revenue falls", "Total revenue does not change"];
  function trDir(cls, up) {
    if (cls === "unit elastic") return TR_DIR[2];
    if (cls === "elastic") return up ? TR_DIR[1] : TR_DIR[0];
    return up ? TR_DIR[0] : TR_DIR[1];
  }
  /* Two integer prices on a linear demand curve, TR change non-zero, |Ep| clear of 1. */
  function trPair(want) {
    for (let k = 0; k < 2000; k++) {
      const L = linDemand();
      const P1 = U.randInt(1, L.Pmax - 1);
      const P2 = U.randInt(1, L.Pmax - 1);
      if (P1 === P2 || Math.abs(P1 - P2) > Math.max(3, L.Pmax / 4)) continue;
      const Q1 = qOf(L, P1), Q2 = qOf(L, P2);
      const e = Math.abs(mid(Q1, Q2) / mid(P1, P2));
      if (Math.abs(e - 1) < 0.1) continue;
      if (want === "elastic" && e < 1) continue;
      if (want === "inelastic" && e > 1) continue;
      const TR1 = P1 * Q1, TR2 = P2 * Q2;
      if (TR1 === TR2) continue;
      return { L, P1, P2, Q1, Q2, e, TR1, TR2 };
    }
    return null;
  }
  const TR_GOODS = [
    { who: "A food truck", s: "taco plate", p: "taco plates", per: "per day" },
    { who: "A climbing gym", s: "day pass", p: "day passes", per: "per week" },
    { who: "A campus bookstore", s: "hoodie", p: "hoodies", per: "per month" },
    { who: "A theater company", s: "ticket", p: "tickets", per: "per performance" },
    { who: "A bakery", s: "loaf", p: "loaves", per: "per day" },
    { who: "An app developer", s: "subscription", p: "subscriptions", per: "per month" },
  ];

  const genTR = STUDY.makeGenerator({
    id: "b251-m4-tr",
    name: "Elasticity and total revenue",
    blurb: "Predict how a price change moves total revenue, compute revenue before and after, and run the total-revenue test backward.",
    variants: [
      {
        name: "Predict the change in total revenue",
        make() {
          const kind = U.pick(["elastic", "inelastic", "elastic", "inelastic", "unit elastic"]);
          const e = kind === "elastic" ? elasticNum() : kind === "inelastic" ? U.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) : 1;
          const up = Math.random() < 0.5;
          const g = U.pick(TR_GOODS);
          const p = U.pick([3, 5, 8, 10, 15]);
          const right = trDir(kind, up);
          const rule = kind === "unit elastic" ? "" : `With ${kind} demand, price and total revenue move in ${kind === "elastic" ? "opposite directions" : "the same direction"}, so a price ${up ? "rise" : "cut"} makes total revenue ${right === TR_DIR[0] ? "rise" : "fall"}.`;
          const why = {
            [TR_DIR[0]]: kind === "unit elastic" ? "With unit elastic demand the price and quantity effects cancel exactly." : rule,
            [TR_DIR[1]]: kind === "unit elastic" ? "With unit elastic demand the price and quantity effects cancel exactly." : rule,
            [TR_DIR[2]]: "Total revenue stays the same only when demand is unit elastic.",
          };
          return inOrder(Q.mc({
            q: `${g.who} faces a price elasticity of demand of <b>${U.fmt(e)}</b> (absolute value) for its ${g.p}. It ${up ? "raises" : "cuts"} the price by ${p}%. What happens to its total revenue?`,
            right, wrong: TR_DIR.filter(x => x !== right).map(t => ({ t, why: why[t] })),
            sol: steps("First classify demand by comparing |E<sub>p</sub>| with 1. Then: elastic → P and TR move in opposite directions; inelastic → same direction; unit elastic → TR unchanged.",
              `|E<sub>p</sub>| = ${U.fmt(e)}, so demand is ${kind}. Quantity ${up ? "falls" : "rises"} by about ${U.fmt(U.round(e * p, 2))}% against a ${p}% price ${up ? "rise" : "cut"}.`,
              `So <b>${right.toLowerCase()}</b>.`),
          }), TR_DIR);
        },
      },
      {
        name: "Compute the change in total revenue",
        make() {
          const t = trPair();
          const g = U.pick(TR_GOODS);
          const ans = t.TR2 - t.TR1;
          return Q.num({
            q: `${g.who} sells <b>${U.fmt(t.Q1)} ${g.p}</b> ${g.per} at <b>${U.money(t.P1)}</b> each. When it changes the price to <b>${U.money(t.P2)}</b>, it sells <b>${U.fmt(t.Q2)}</b>. By how much does total revenue change? (Enter a decrease as a negative number.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: -ans, why: "Check the direction: compare the new revenue with the old one (new − old)." },
              { value: t.TR2, why: "That is the new total revenue. The question asks for the change." },
              { value: (t.P2 - t.P1) * (t.Q2 - t.Q1), why: "Multiplying the two changes is not how revenue changes. Compute P × Q before and after." },
              { value: (t.P2 - t.P1) * t.Q1, why: "That only counts the price effect on the old quantity. The quantity changed too." },
            ]),
            sol: steps("Total revenue = price × quantity. Compute it before and after, then subtract.",
              `Before: ${U.money(t.P1)} × ${U.fmt(t.Q1)} = ${U.money(t.TR1)}. After: ${U.money(t.P2)} × ${U.fmt(t.Q2)} = ${U.money(t.TR2)}.`,
              `Change = ${U.money(t.TR2)} − ${U.money(t.TR1)} = <b>${sgMoney(ans)}</b>. Price ${t.P2 > t.P1 ? "rose" : "fell"} and TR ${ans > 0 ? "rose" : "fell"}: they moved in ${(t.P2 > t.P1) === (ans > 0) ? "the same direction, so demand is <b>inelastic</b>" : "opposite directions, so demand is <b>elastic</b>"} here (midpoint |E<sub>p</sub>| = ${d2(t.e)}).`),
          });
        },
      },
      {
        name: "Infer elasticity from total revenue",
        make() {
          const t = trPair(U.pick(["elastic", "inelastic"]));
          const g = U.pick(TR_GOODS);
          const right = t.e > 1 ? "Elastic" : "Inelastic";
          const all = ["Elastic", "Unit elastic", "Inelastic", "Perfectly inelastic"];
          const why = {
            Elastic: "Price and revenue moved in the same direction, which signals inelastic demand.",
            Inelastic: "Price and revenue moved in opposite directions, which signals elastic demand.",
            "Unit elastic": "Revenue changed, so demand is not unit elastic.",
            "Perfectly inelastic": "Quantity changed, so demand is not perfectly inelastic.",
          };
          return inOrder(Q.mc({
            q: `${g.who} tries two prices:${tbl(["Price", `Quantity sold ${g.per}`], [[U.money(t.P1), U.fmt(t.Q1)], [U.money(t.P2), U.fmt(t.Q2)]])}Use the total-revenue test. Over this range, demand is:`,
            right, wrong: all.filter(x => x !== right).map(x => ({ t: x, why: why[x] })),
            sol: steps("Compute TR = P × Q at each price and see whether TR moved with or against the price.",
              `TR: ${U.money(t.P1)} × ${U.fmt(t.Q1)} = ${U.money(t.TR1)}; ${U.money(t.P2)} × ${U.fmt(t.Q2)} = ${U.money(t.TR2)}.`,
              `Price ${t.P2 > t.P1 ? "rises" : "falls"} from the first row to the second and TR ${t.TR2 > t.TR1 ? "rises" : "falls"}: ${right === "Elastic" ? "opposite directions → <b>elastic</b>" : "same direction → <b>inelastic</b>"}. (The midpoint formula agrees: |E<sub>p</sub>| = ${d2(t.e)}.)`),
          }), all);
        },
      },
      {
        name: "Total-revenue test, many cases",
        make() {
          const mk = () => {
            const up = Math.random() < 0.5;
            const tr = U.pick(["rises", "falls", "same"]);
            const P1 = U.randInt(4, 20), dP = U.randInt(1, 3);
            const P2 = up ? P1 + dP : P1 - dP;
            const T1 = U.randInt(10, 60) * 100;
            const T2 = tr === "same" ? T1 : tr === "rises" ? T1 + U.randInt(2, 12) * 100 : T1 - U.randInt(2, 8) * 100;
            // The implied quantities (TR ÷ P) must obey the law of demand: quantity
            // moves opposite to price. Otherwise the line describes an impossible market.
            const Q1 = T1 / P1, Q2 = T2 / P2;
            if (P2 <= 0 || (up ? Q2 >= Q1 : Q2 <= Q1)) return mk();
            const cat = tr === "same" ? "Unit elastic" : ((tr === "rises") !== up ? "Elastic" : "Inelastic");
            const t = `Price ${up ? "rises" : "falls"} from ${U.money(P1)} to ${U.money(P2)}; total revenue ${tr === "same" ? `stays at ${U.money(T1)}` : `${tr === "rises" ? "rises" : "falls"} from ${U.money(T1)} to ${U.money(T2)}`}`;
            const why = cat === "Unit elastic" ? "Revenue unchanged → unit elastic." : cat === "Elastic" ? "Price and revenue moved in opposite directions → elastic." : "Price and revenue moved in the same direction → inelastic.";
            return { t, cat, why };
          };
          const items = [];
          const need = U.shuffle(["Elastic", "Inelastic", "Unit elastic"]);
          let guard = 0;
          while (items.length < 5 && guard++ < 200) {
            const it = mk();
            if (items.some(o => o.t === it.t)) continue;
            if (need.length && it.cat !== need[0] && items.length < 3) continue;
            if (need.length && it.cat === need[0]) need.shift();
            if (it.cat === "Unit elastic" && items.filter(o => o.cat === "Unit elastic").length >= 1) continue;
            items.push(it);
          }
          return Q.classify({
            q: "For each price change, use the total-revenue test to classify demand over that range.",
            cats: ["Elastic", "Unit elastic", "Inelastic"], items,
            sol: steps("Total-revenue test: compare the direction of the price change with the direction of the revenue change.",
              "Opposite directions → elastic. Same direction → inelastic. Revenue unchanged → unit elastic."),
          });
        },
      },
      {
        name: "Pricing advice to raise revenue",
        make() {
          const kind = U.pick(["elastic", "inelastic"]);
          const e = kind === "elastic" ? elasticNum() : U.pick([0.15, 0.3, 0.4, 0.5, 0.6, 0.75]);
          const ctx = U.pick([
            { who: "A city council", what: "parking meters downtown", goal: "raise more money from its meters" },
            { who: "A museum board", what: "weekend admission", goal: "increase admission revenue" },
            { who: "A rock band's manager", what: "arena tickets", goal: "bring in more ticket revenue" },
            { who: "A regional airline", what: "seats on a commuter route", goal: "increase revenue on the route" },
            { who: "A university's athletics office", what: "basketball season passes", goal: "raise season-pass revenue" },
          ]);
          const right = kind === "elastic" ? "Lower the price" : "Raise the price";
          return Q.mc({
            q: `${ctx.who} wants to ${ctx.goal}. Its consultants estimate the price elasticity of demand for ${ctx.what} at <b>${U.fmt(e)}</b> (absolute value). What should it do?`,
            right,
            wrong: [
              kind === "elastic" ? { t: "Raise the price", why: "Demand is elastic, so a higher price loses proportionally more customers and revenue falls." }
                : { t: "Lower the price", why: "Demand is inelastic, so a price cut gains proportionally few customers and revenue falls." },
              { t: "Leave the price alone: price changes cannot change revenue", why: "Revenue is unchanged only with unit elastic demand." },
              { t: "It cannot tell without knowing the cost of production", why: "Revenue (P × Q) depends only on demand here; cost matters for profit, not revenue." },
            ],
            sol: steps("Classify demand, then use the rule: elastic → P and TR move in opposite directions; inelastic → same direction.",
              `|E<sub>p</sub>| = ${U.fmt(e)} is ${kind === "elastic" ? "greater" : "less"} than 1, so demand is ${kind}. To raise revenue, <b>${right.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Total revenue from a graph",
        make() {
          let Pmax, Qmax, b, cand = [];
          while (cand.length < 3) {
            Pmax = U.pick([16, 20, 24, 40]);
            Qmax = U.pick([40, 60, 80, 100, 120]);
            b = Qmax / Pmax;
            cand = [1, 3, 5, 7].map(i => (i * Pmax) / 8).concat([1, 2, 3].map(i => (i * Pmax) / 4))
              .filter(p => Number.isInteger(p) && Number.isInteger(U.round(Qmax - b * p, 6)));
          }
          let PA, PB;
          for (let k = 0; k < 100; k++) {
            [PA, PB] = U.sample(cand, 2);
            if (PA < PB) [PA, PB] = [PB, PA];
            if (PA + PB !== Pmax) break;
          }
          const QA = U.round(Qmax - b * PA, 6), QB = U.round(Qmax - b * PB, 6);
          const TRA = PA * QA, TRB = PB * QB;
          const ans = TRB - TRA;
          const graph = G.plot({ xLabel: "Quantity per week", yLabel: "Price ($)", xMax: Qmax, yMax: Pmax, xTicks: [0.25, 0.5, 0.75, 1].map(f => Qmax * f).concat([QA, QB]).filter((v, i, a) => a.indexOf(v) === i).sort((x, y) => x - y),
            yTicks: [PA, PB, Pmax].filter((v, i, a) => a.indexOf(v) === i).sort((x, y) => x - y),
            curves: [{ pts: [[0, Pmax], [Qmax, 0]], style: "main", label: "D", labelAt: 1 },
              { pts: [[0, PA], [QA, PA], [QA, 0]], style: "dash" }, { pts: [[0, PB], [QB, PB], [QB, 0]], style: "faint" }],
            points: [{ x: QA, y: PA, label: "A" }, { x: QB, y: PB, label: "B" }], aria: "demand curve with points A and B" });
          return Q.num({
            q: `The graph shows a demand curve. The price is cut from point A to point B.${graph}By how much does total revenue change? (Enter a decrease as a negative number.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: -ans, why: "Subtract in the right order: revenue at B minus revenue at A." },
              { value: TRB, why: "That is total revenue at B, not the change." },
              { value: (PB - PA) * (QB - QA), why: "Multiplying the two changes is not the revenue change. Compute the two rectangles P × Q." },
            ]),
            sol: steps("Total revenue is the rectangle under each point: price × quantity.",
              `A: ${U.money(PA)} × ${QA} = ${U.money(TRA)}. B: ${U.money(PB)} × ${QB} = ${U.money(TRB)}.`,
              `Change = ${U.money(TRB)} − ${U.money(TRA)} = <b>${sgMoney(ans)}</b>. The price cut ${ans > 0 ? "raised" : "lowered"} revenue, so demand is <b>${ans > 0 ? "elastic" : "inelastic"}</b> over this stretch (the midpoint of the line is at ${U.money(Pmax / 2)}).`),
          });
        },
      },
      {
        name: "Select all true statements about total revenue",
        make() {
          const BANK = [
            { t: "If demand is elastic, a price cut raises total revenue.", ok: true },
            { t: "If demand is inelastic, a price increase raises total revenue.", ok: true },
            { t: "If a price cut leaves total revenue unchanged, demand is unit elastic over that range.", ok: true },
            { t: "On a straight-line demand curve, total revenue is largest at the midpoint.", ok: true },
            { t: "If a price rise lowers total revenue, demand is elastic.", ok: true },
            { t: "Total revenue equals the total amount buyers spend on the good.", ok: true },
            { t: "Raising the price always raises total revenue, because each unit brings in more.", ok: false, why: "Not with elastic demand: the lost sales outweigh the higher price." },
            { t: "If demand is inelastic, cutting the price raises total revenue.", ok: false, why: "Inelastic: price and revenue move in the same direction, so a cut lowers revenue." },
            { t: "If a price cut lowers total revenue, demand is elastic.", ok: false, why: "That is the sign of inelastic demand." },
            { t: "With unit elastic demand, a 10% price rise raises total revenue by 10%.", ok: false, why: "Quantity falls 10%, so revenue stays the same." },
            { t: "The total-revenue test needs the slope of the demand curve.", ok: false, why: "It only needs the direction of the price change and the direction of the revenue change." },
          ];
          const opts = dealMulti("m4-tr", BANK, 5);
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("TR = P × Q. Elastic: P and TR move in opposite directions. Inelastic: same direction. Unit elastic: TR unchanged.",
              "Run the rule backward for the total-revenue test."),
          });
        },
      },
      {
        name: "Which is NOT consistent with elastic demand?",
        make() {
          const right = U.pick([
            "A 5% price rise increases total revenue",
            "A price cut lowers total revenue",
            "Quantity demanded falls 3% when price rises 9%",
            "|E<sub>p</sub>| = 0.65",
          ]);
          const pool = [
            { t: "A price cut increases total revenue", why: "Opposite movement of P and TR is exactly what elastic demand gives." },
            { t: "A price rise lowers total revenue", why: "Opposite movement of P and TR is what elastic demand gives." },
            { t: "Quantity demanded falls 15% when price rises 6%", why: "15 ÷ 6 = 2.5 &gt; 1: elastic." },
            { t: "|E<sub>p</sub>| = 1.9", why: "1.9 &gt; 1: elastic." },
            { t: "The good has many close substitutes", why: "Close substitutes make demand more elastic." },
          ];
          return Q.mc({
            q: "Which observation is <b>not</b> consistent with elastic demand?",
            right, wrong: U.sample(pool, 3),
            rightWhy: "This points to inelastic demand.",
            sol: steps("Elastic means %ΔQ &gt; %ΔP, so |E<sub>p</sub>| &gt; 1, and price and total revenue move in opposite directions.",
              `“${right}” shows ${right.includes("|") ? "an absolute value below 1" : right.includes("3%") ? "a quantity response smaller than the price change" : "price and revenue moving in the same direction"}, which is inelastic.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Determinants of price elasticity of demand
   * ============================================================ */
  const DET = {
    subs: { name: "Availability of substitutes", reason: "it has more and closer substitutes" },
    lux: { name: "Necessity vs luxury", reason: "it is a luxury rather than a necessity" },
    budget: { name: "Share of the budget", reason: "it takes a larger share of the buyer's budget" },
    time: { name: "Time to adjust", reason: "buyers have more time to adjust" },
  };
  const PAIRS = [
    { more: "One brand of canned soup", less: "Soup in general", det: "subs" },
    { more: "Tickets for one particular airline's 7 a.m. flight", less: "Air travel as a whole", det: "subs" },
    { more: "Blueberry yogurt", less: "Dairy products", det: "subs" },
    { more: "Gasoline at one station on a corner with three other stations", less: "Gasoline in the whole state", det: "subs" },
    { more: "A particular brand of running shoes", less: "Footwear", det: "subs" },
    { more: "Lunch at one food truck in a row of ten", less: "Food", det: "subs" },
    { more: "A luxury cruise", less: "Insulin for a diabetic", det: "lux" },
    { more: "Designer sunglasses", less: "Prescription eyeglasses", det: "lux" },
    { more: "Restaurant desserts", less: "Home heating in a cold climate", det: "lux" },
    { more: "Front-row concert seats", less: "Basic tap water", det: "lux" },
    { more: "A new sofa", less: "Toothpicks", det: "budget" },
    { more: "A new laptop", less: "Shoelaces", det: "budget" },
    { more: "A kitchen remodel", less: "Table salt", det: "budget" },
    { more: "A family car", less: "Paper clips", det: "budget" },
    { more: "Electricity over the next ten years", less: "Electricity in the month after a rate hike", det: "time" },
    { more: "Gasoline over five years", less: "Gasoline in the week after a price jump", det: "time" },
    { more: "Natural gas for heating over a decade", less: "Natural gas for heating this winter", det: "time" },
    { more: "Bus rides two years after a fare increase", less: "Bus rides the day after a fare increase", det: "time" },
  ];
  const DET_SITUATIONS = [
    { t: "When one brand of hummus raises its price, shoppers switch to the store brand on the next shelf.", cat: "subs" },
    { t: "Demand for “Main Street Coffee” is more elastic than demand for coffee in general.", cat: "subs" },
    { t: "Rideshare prices rise and many riders switch to the new bike lanes and scooters.", cat: "subs" },
    { t: "Demand for one cinema's tickets is elastic because three other cinemas show the same films.", cat: "subs" },
    { t: "People keep buying their blood-pressure medicine after its price rises, because they feel they cannot go without it.", cat: "lux" },
    { t: "When hotel prices rise, many families simply skip this year's beach vacation.", cat: "lux" },
    { t: "Demand for spa treatments falls sharply after a price rise, while demand for basic soap barely moves.", cat: "lux" },
    { t: "A 10% rise in the price of a new car sends buyers shopping around, but a 10% rise in the price of matches goes unnoticed.", cat: "budget" },
    { t: "Students react strongly to a rise in rent for apartments, which eats up much of their income.", cat: "budget" },
    { t: "Few people change how much pepper they buy when its price rises, because they spend only a few dollars a year on it.", cat: "budget" },
    { t: "A year after a toll increase, more commuters have moved closer to work or joined carpools than in the first week.", cat: "time" },
    { t: "Right after a jump in heating-oil prices, homeowners cut back a little; over the next decade many switch to heat pumps.", cat: "time" },
    { t: "Water use falls only slightly in the month after a rate hike but much more after households install low-flow fixtures.", cat: "time" },
  ];

  const genDet = STUDY.makeGenerator({
    id: "b251-m4-det",
    name: "Determinants of demand elasticity",
    blurb: "Use substitutes, necessity vs luxury, budget share and time to adjust to judge which demand is more elastic, and why.",
    variants: [
      {
        name: "Which is more elastic, and why?",
        make() {
          const pr = U.pick(PAIRS);
          const det = DET[pr.det];
          const otherDet = U.pick(Object.keys(DET).filter(k => k !== pr.det));
          const right = `${pr.more}, because ${det.reason}`;
          const wrongReason = {
            subs: "it has fewer substitutes, so buyers notice price changes more",
            lux: "it is more of a necessity, so buyers react more to price",
            budget: "it costs so little that buyers can easily stop buying it",
            time: "buyers react most in the first days after a price change",
          }[pr.det];
          return Q.mc({
            q: `Which has the more <b>elastic</b> demand, and what is the main reason?<br>• ${pr.more}<br>• ${pr.less}`,
            right,
            wrong: [
              { t: `${pr.less}, because ${wrongReason}`, why: "The determinant works the other way: this pushes demand toward <em>inelastic</em>." },
              { t: `${pr.more}, because it is cheaper for firms to produce`, why: "Production cost is a supply-side matter; it does not determine how responsive buyers are." },
              { t: "Both are equally elastic, because the law of demand applies to every good", why: "The law of demand gives the direction of the response, not its size." },
            ],
            sol: steps("Run through the determinants: substitutes, necessity vs luxury, share of the budget, and time to adjust.",
              `The key difference here is <b>${det.name.toLowerCase()}</b>: ${pr.more.charAt(0).toLowerCase() + pr.more.slice(1)} is more elastic because ${det.reason}.`),
          });
        },
      },
      {
        name: "Name the determinant",
        make() {
          const items = [];
          const keys = U.shuffle(Object.keys(DET));
          for (const k of keys) items.push(U.pick(DET_SITUATIONS.filter(s => s.cat === k)));
          for (const extra of U.deal("m4-det", DET_SITUATIONS, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Which determinant of the price elasticity of demand does each situation mainly illustrate?",
            cats: Object.values(DET).map(d => d.name),
            items: items.map(s => ({ t: s.t, cat: DET[s.cat].name, why: `This is about ${DET[s.cat].name.toLowerCase()}.` })),
            sol: steps("Look for the clue: switching to something similar (substitutes), “can't go without” vs “can skip” (necessity vs luxury), how much of income it takes (budget share), or a short vs long window (time).",
              "Each of the four makes demand more elastic when it points toward more substitutes, a luxury, a bigger budget share or more time."),
          });
        },
      },
      {
        name: "Short run vs long run",
        make() {
          const ctx = U.pick([
            { good: "gasoline", sr: "the first month", lr: "five years later" },
            { good: "electricity", sr: "the first few weeks", lr: "a decade later" },
            { good: "cigarettes", sr: "the first month", lr: "several years later" },
            { good: "beef", sr: "the first week", lr: "three years later" },
            { good: "home heating oil", sr: "the first winter", lr: "ten years later" },
          ]);
          const sr = U.pick([0.1, 0.15, 0.2, 0.25, 0.3]);
          const lr = U.pick([0.6, 0.7, 0.8, 1.2, 1.5]);
          return Q.mc({
            q: `After a lasting rise in the price of ${ctx.good}, economists estimate the price elasticity of demand twice: once for ${ctx.sr}, and once for ${ctx.lr}. Which pair of estimates (absolute values) is most plausible?`,
            right: `${U.fmt(sr)} in ${ctx.sr}; ${U.fmt(lr)} ${ctx.lr}`,
            wrong: [
              { t: `${U.fmt(lr)} in ${ctx.sr}; ${U.fmt(sr)} ${ctx.lr}`, why: "Reversed: buyers adjust more as time passes, so the long-run elasticity is larger." },
              { t: `${U.fmt(sr)} in both periods`, why: "Elasticity does not stay fixed: with more time buyers find substitutes and change habits." },
              { t: `−${U.fmt(lr)} in ${ctx.sr}; +${U.fmt(sr)} ${ctx.lr}`, why: "Price elasticity of demand never turns positive; and the long-run response is the larger one." },
            ],
            sol: steps("The longer a price change lasts, the more ways buyers find to adjust.",
              `In ${ctx.sr} people can only cut back a little; by ${ctx.lr} they have changed equipment, habits or suppliers. So demand is <b>more elastic in the long run</b>.`),
          });
        },
      },
      {
        name: "Select all that make demand more elastic",
        make() {
          const BANK = [
            { t: "Several close substitutes appear on the market", ok: true },
            { t: "Buyers have several years to adjust to the price change", ok: true },
            { t: "The good takes a large share of buyers' income", ok: true },
            { t: "Buyers regard the good as a luxury they can easily skip", ok: true },
            { t: "The market is defined narrowly (one brand rather than the whole category)", ok: true },
            { t: "The good becomes a medical necessity for its buyers", ok: false, why: "Necessities have <em>less</em> elastic demand." },
            { t: "The good costs only a few cents a year to buy", ok: false, why: "A tiny budget share makes demand <em>less</em> elastic." },
            { t: "Buyers must respond within a day of the price change", ok: false, why: "Little time to adjust makes demand <em>less</em> elastic." },
            { t: "The only substitute for the good disappears", ok: false, why: "Fewer substitutes make demand <em>less</em> elastic." },
            { t: "It becomes cheaper for firms to produce the good", ok: false, why: "Production cost affects supply, not buyers' responsiveness." },
          ];
          const opts = dealMulti("m4-detsel", BANK, 5);
          return Q.multi({
            q: "Which changes would make the demand for a good <b>more elastic</b>? Select <b>all</b> that apply.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Demand is more elastic with more (and closer) substitutes, for luxuries, for big budget items, and over longer periods.",
              "Cost of production is not on the list: it affects supply, not how buyers respond."),
          });
        },
      },
      {
        name: "Which is NOT a determinant?",
        make() {
          const right = U.pick([
            "How much it costs firms to produce the good",
            "The price elasticity of supply of the good",
            "How many workers the industry employs",
            "Whether the good is made at home or imported",
          ]);
          return Q.mc({
            q: "Which of the following is <b>not</b> a determinant of the price elasticity of <b>demand</b>?",
            right,
            wrong: [
              { t: "How many close substitutes the good has", why: "Substitutes are a key determinant." },
              { t: "Whether buyers see the good as a necessity or a luxury", why: "This is a determinant." },
              { t: "The share of buyers' budgets spent on the good", why: "This is a determinant." },
              { t: "How much time buyers have to adjust", why: "Time is a determinant." },
            ].slice(0, 3),
            rightWhy: "This is about producers, not about how buyers respond to price.",
            sol: steps("Demand elasticity is about <em>buyers'</em> options and priorities.",
              "The determinants are substitutes, necessity vs luxury, budget share and time. Anything about producers belongs to supply."),
          });
        },
      },
      {
        name: "Likely elastic or likely inelastic?",
        make() {
          const BANK = [
            { t: "One brand of frozen pizza in a supermarket full of brands", cat: "Likely elastic", why: "Many close substitutes." },
            { t: "A week-long ski vacation", cat: "Likely elastic", why: "A postponable luxury and a large budget item." },
            { t: "A new big-screen TV", cat: "Likely elastic", why: "A large budget item that can be delayed." },
            { t: "Tickets for one of four cinemas showing the same film", cat: "Likely elastic", why: "Close substitutes nearby." },
            { t: "A particular gas station's gasoline when another station is across the street", cat: "Likely elastic", why: "A near-perfect substitute across the street." },
            { t: "Insulin for people with diabetes", cat: "Likely inelastic", why: "A necessity with no close substitute." },
            { t: "Table salt", cat: "Likely inelastic", why: "Tiny budget share and few substitutes." },
            { t: "Electricity in the week after a rate increase", cat: "Likely inelastic", why: "Little time to adjust, and a necessity." },
            { t: "Tap water for drinking and cooking", cat: "Likely inelastic", why: "A necessity with few substitutes." },
            { t: "Gasoline for the whole country in the short run", cat: "Likely inelastic", why: "Broad category, few substitutes, little time to adjust." },
          ];
          const items = U.sample(BANK.filter(b => b.cat === "Likely elastic"), 2).concat(U.sample(BANK.filter(b => b.cat === "Likely inelastic"), 2));
          const ex = U.pick(BANK.filter(b => !items.includes(b)));
          items.push(ex);
          return Q.classify({
            q: "Use the determinants to sort each good by its likely price elasticity of demand.",
            cats: ["Likely elastic", "Likely inelastic"], items,
            sol: steps("Ask: close substitutes? necessity or luxury? big or small share of the budget? short or long time to adjust?",
              "Narrow goods with substitutes, luxuries and big-ticket items lean elastic; necessities, tiny budget items and broad categories in the short run lean inelastic."),
          });
        },
      },
      {
        name: "Broad vs narrow market",
        make() {
          const ctx = U.pick([
            { broad: "breakfast cereal", narrow: "one brand of honey-oat cereal" },
            { broad: "transportation", narrow: "rides from one taxi company" },
            { broad: "clothing", narrow: "one store's plain white T-shirts" },
            { broad: "beverages", narrow: "one brand of lemon sparkling water" },
            { broad: "entertainment", narrow: "tickets to one particular cinema" },
          ]);
          return Q.mc({
            q: `How does the price elasticity of demand for <b>${ctx.narrow}</b> compare with that for <b>${ctx.broad}</b> as a whole?`,
            right: `Demand for ${ctx.narrow} is more elastic, because it has many close substitutes within the broader category`,
            wrong: [
              { t: `Demand for ${ctx.broad} is more elastic, because the category is bigger`, why: "A broad category has few substitutes outside itself, so its demand is less elastic." },
              { t: "They are equally elastic, since one is part of the other", why: "Being part of a category is exactly why the narrow good has close substitutes." },
              { t: `Demand for ${ctx.narrow} is perfectly inelastic, because loyal customers always buy it`, why: "Some buyers are loyal, but many switch when the price rises: demand is far from perfectly inelastic." },
            ],
            sol: steps("This is the substitutes determinant in disguise: how many close substitutes does each have?",
              `If ${ctx.narrow} gets pricier, buyers switch to other options within ${ctx.broad}. If all of ${ctx.broad} gets pricier, there are far fewer places to go. Narrow = <b>more elastic</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Cross-price elasticity of demand
   * ============================================================ */
  const REL_PAIRS = [
    { x: "tea", y: "coffee", rel: "Substitutes" },
    { x: "bus tickets", y: "train tickets", rel: "Substitutes" },
    { x: "butter", y: "margarine", rel: "Substitutes" },
    { x: "e-books", y: "paperback books", rel: "Substitutes" },
    { x: "rideshare trips", y: "taxi rides", rel: "Substitutes" },
    { x: "streaming subscriptions", y: "movie tickets", rel: "Substitutes" },
    { x: "chicken", y: "beef", rel: "Substitutes" },
    { x: "printer ink", y: "printers", rel: "Complements", k: 10 },
    { x: "hot dog buns", y: "hot dogs", rel: "Complements" },
    { x: "phone cases", y: "smartphones", rel: "Complements", k: 40 },
    { x: "tennis balls", y: "tennis rackets", rel: "Complements", k: 8 },
    { x: "video games", y: "game consoles", rel: "Complements", k: 20 },
    { x: "ski rentals", y: "ski-lift passes", rel: "Complements", k: 5 },
    { x: "gasoline", y: "SUVs", rel: "Complements", k: 2000 },
    { x: "bike helmets", y: "table salt", rel: "Unrelated" },
    { x: "shoelaces", y: "orange juice", rel: "Unrelated" },
    { x: "umbrellas", y: "dental floss", rel: "Unrelated" },
    { x: "guitar strings", y: "paper towels", rel: "Unrelated" },
  ];
  const REL_CATS = ["Substitutes", "Complements", "Unrelated"];
  const relOf = e => (e > 0 ? "Substitutes" : e < 0 ? "Complements" : "Unrelated");

  const genCross = STUDY.makeGenerator({
    id: "b251-m4-cross",
    name: "Cross-price elasticity",
    blurb: "Compute cross-price elasticities, read their sign as substitutes or complements, and predict how demand for one good reacts to another's price.",
    variants: [
      {
        name: "Cross elasticity from percentage changes",
        make() {
          const pr = U.pick(REL_PAIRS.filter(p => p.rel !== "Unrelated"));
          const up = Math.random() < 0.5;
          const py = U.pick([4, 5, 8, 10, 12, 15, 20, 25]);
          const mag = U.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 2]);
          const qx = U.round(mag * py, 2);
          const sign = pr.rel === "Substitutes" ? 1 : -1;
          const qxSigned = sign * (up ? 1 : -1) * qx;
          const ans = qxSigned / (up ? py : -py);
          return Q.num({
            q: `When the price of ${pr.y} ${up ? "rises" : "falls"} by <b>${py}%</b>, the quantity of ${pr.x} demanded ${qxSigned > 0 ? "rises" : "falls"} by <b>${U.fmt(qx)}%</b> (the price of ${pr.x} is unchanged). What is the cross-price elasticity of demand for ${pr.x} with respect to the price of ${pr.y}? Keep the sign.`,
            answer: ans, tol: 0.02,
            traps: traps(ans, [
              { value: -ans, why: "Sign error. Keep the signs of both percentage changes: the sign is what tells substitutes from complements." },
              { value: 1 / ans, why: "Upside down: the % change in the quantity of X goes on top, the % change in the price of Y on the bottom." },
              { value: Math.abs(ans), why: "Do not take the absolute value of a cross elasticity — the sign carries the meaning." },
            ].filter(t => t.value !== Math.abs(ans) || ans < 0)),
            sol: steps(`${EXY} = (% change in quantity demanded of ${pr.x}) ÷ (% change in price of ${pr.y}). Keep both signs.`,
              `${EXY} = ${sg(qxSigned)}% ÷ ${sg(up ? py : -py)}% = <b>${sg(ans)}</b>.`,
              `${ans > 0 ? "Positive" : "Negative"}, so ${pr.x} and ${pr.y} are <b>${pr.rel.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Cross elasticity with the midpoint method",
        make() {
          const pr = U.pick(REL_PAIRS.filter(p => p.rel !== "Unrelated"));
          let P1, P2, Q1, Q2, e;
          for (let k = 0; k < 500; k++) {
            const sc = pr.k || 1;
            P1 = U.randInt(4, 30); P2 = P1 + U.pick([-3, -2, -1, 1, 2, 3, 4]);
            if (P2 <= 0) continue;
            P1 *= sc; P2 *= sc;
            Q1 = U.randInt(10, 80) * 10;
            const dq = U.randInt(2, 30) * 10;
            const sameDir = pr.rel === "Substitutes";
            Q2 = ((P2 > P1) === sameDir) ? Q1 + dq : Q1 - dq;
            if (Q2 <= 0) continue;
            e = mid(Q1, Q2) / mid(P1, P2);
            if (Math.abs(e) >= 0.15 && Math.abs(e) <= 5) break;
          }
          return Q.num({
            q: `In a town, the price of ${pr.y} changes from <b>${U.money(P1)}</b> to <b>${U.money(P2)}</b>. Over the same period, with the price of ${pr.x} unchanged, the weekly quantity of ${pr.x} demanded goes from <b>${U.fmt(Q1)}</b> to <b>${U.fmt(Q2)}</b>. Using the <b>midpoint method</b> for both percentage changes, what is the cross-price elasticity of demand? Keep the sign; two decimals.`,
            answer: e, tol: Math.max(0.02, Math.abs(e) * 0.02),
            traps: traps(e, [
              { value: -e, why: "Sign error: keep the direction of each change." },
              { value: 1 / e, why: "Upside down: quantity of X over price of Y." },
              { value: simple(Q1, Q2) / simple(P1, P2), why: "That divides by the starting values. Use the averages, as the question asks." },
            ]),
            sol: steps(`${EXY} = %ΔQ of ${pr.x} ÷ %ΔP of ${pr.y}, each computed with the midpoint method.`,
              `${midLine("Q<sub>x</sub>", Q1, Q2)}<br>${midLine("P<sub>y</sub>", P1, P2, true)}`,
              `${EXY} = ${pct(mid(Q1, Q2))} ÷ ${pct(mid(P1, P2))} = <b>${sg(e)}</b>: ${e > 0 ? "positive, so <b>substitutes</b>" : "negative, so <b>complements</b>"}.`),
          });
        },
      },
      {
        name: "Classify by the sign of the cross elasticity",
        make() {
          const vals = U.shuffle([U.pick([0.3, 0.6, 1.1, 1.8, 2.4]), -U.pick([0.25, 0.5, 0.9, 1.4, 2.2]), 0, U.pick([0.4, 0.8, 1.5]) * (Math.random() < 0.5 ? 1 : -1)]);
          const used = new Set(), items = [];
          for (const v of vals) {
            const pr = U.pick(REL_PAIRS.filter(p => !used.has(p)));
            used.add(pr);
            const t = `Cross-price elasticity of good ${String.fromCharCode(65 + items.length)} with respect to the price of good ${String.fromCharCode(80 + items.length)}: ${EXY} = ${v === 0 ? "0" : sg(v)}`;
            items.push({ t, cat: relOf(v), why: v > 0 ? "Positive → substitutes." : v < 0 ? "Negative → complements." : "Zero → the goods are unrelated." });
          }
          return Q.classify({
            q: "Classify each pair of goods by its cross-price elasticity of demand.",
            cats: REL_CATS, items,
            sol: steps("Only the sign matters for the relationship.",
              "Positive: a higher price of one raises demand for the other → substitutes. Negative: it lowers demand for the other → complements. Zero: unrelated."),
          });
        },
      },
      {
        name: "Predict the sign from the goods",
        make() {
          const picks = U.sample(REL_PAIRS.filter(p => p.rel === "Substitutes"), 2)
            .concat(U.sample(REL_PAIRS.filter(p => p.rel === "Complements"), 2))
            .concat(U.sample(REL_PAIRS.filter(p => p.rel === "Unrelated"), 1));
          const cats = ["Positive", "Negative", "About zero"];
          const map = { Substitutes: "Positive", Complements: "Negative", Unrelated: "About zero" };
          return Q.classify({
            q: "For each pair, what sign would you expect for the cross-price elasticity of demand for the first good with respect to the price of the second?",
            cats,
            items: picks.map(p => ({ t: `${cap(p.x)} / price of ${p.y}`, cat: map[p.rel], why: `${cap(p.x)} and ${p.y} are ${p.rel.toLowerCase()}${p.rel === "Unrelated" ? "" : ""}.` })),
            sol: steps("Ask: if the second good gets more expensive, do people buy more of the first (substitutes), less of it (complements), or the same (unrelated)?",
              "Substitutes → positive. Complements (used together) → negative. Unrelated → about zero."),
          });
        },
      },
      {
        name: "Reverse: predict the change in demand",
        make() {
          const pr = U.pick(REL_PAIRS.filter(p => p.rel !== "Unrelated"));
          const mag = U.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2]);
          const e = pr.rel === "Substitutes" ? mag : -mag;
          const up = Math.random() < 0.5;
          const py = U.pick([4, 5, 6, 8, 10, 15, 20]);
          const ans = U.round(e * (up ? py : -py), 4);
          return Q.num({
            q: `The cross-price elasticity of demand for ${pr.x} with respect to the price of ${pr.y} is <b>${sg(e)}</b>. If the price of ${pr.y} ${up ? "rises" : "falls"} by <b>${py}%</b>, by what percentage does the quantity of ${pr.x} demanded change? (Enter a decrease as a negative number.)`,
            answer: ans, unit: "%", tol: 0.05,
            traps: traps(ans, [
              { value: -ans, why: "Check the sign: multiply the elasticity (with its sign) by the signed price change." },
              { value: (up ? py : -py) / e, why: "Rearrange correctly: %ΔQ<sub>x</sub> = E<sub>xy</sub> × %ΔP<sub>y</sub>." },
            ]),
            sol: steps(`Rearrange: %ΔQ of ${pr.x} = ${EXY} × %ΔP of ${pr.y}.`,
              `${sg(e)} × ${sg(up ? py : -py)}% = <b>${pct(ans)}</b>.`,
              pr.rel === "Substitutes" ? `They are substitutes: when the price of ${pr.y} rises, buyers switch toward ${pr.x}, and when it falls they switch away.` : `They are complements: when the price of ${pr.y} rises, buyers use less of it and so buy less ${pr.x}; when it falls they buy more.`),
          });
        },
      },
      {
        name: "Which pair are the closest substitutes?",
        make() {
          const xs = U.sample(["A", "B", "C", "D"], 4);
          const vals = U.shuffle([U.pick([1.8, 2.2, 2.6, 3.1]), U.pick([0.3, 0.5, 0.7]), -U.pick([1.5, 2.5, 3.5]), U.pick([0, 0.05])]);
          const best = Math.max(...vals);
          const lab = v => (v === 0 ? "0" : sg(v));
          const rows = vals.map((v, i) => [`Good X and good ${xs[i]}`, lab(v)]);
          const right = `Good X and good ${xs[vals.indexOf(best)]}`;
          return Q.mc({
            q: `The table shows the cross-price elasticity of demand for good X with respect to the price of each other good.${tbl(["Pair", EXY], rows)}Which pair are the <b>closest substitutes</b>?`,
            right,
            wrong: vals.map((v, i) => ({ v, t: `Good X and good ${xs[i]}` })).filter(o => o.t !== right).map(o => ({
              t: o.t, why: o.v < 0 ? `${lab(o.v)} is negative: these are complements, however big the number.` : o.v <= 0.05 ? "About zero: unrelated goods." : `Positive, so substitutes — but ${lab(o.v)} is a weaker link than ${lab(best)}.`,
            })),
            sol: steps("Substitutes have a <em>positive</em> cross elasticity; the bigger the positive number, the closer the substitutes.",
              `The largest positive value is ${lab(best)}, so <b>${right}</b>. A large negative value means strong complements, not substitutes.`),
          });
        },
      },
      {
        name: "Interpret a cross elasticity",
        make() {
          const pr = U.pick(REL_PAIRS.filter(p => p.rel !== "Unrelated"));
          const mag = U.pick([0.4, 0.6, 0.8, 1.3, 1.7, 2.5]);
          const e = pr.rel === "Substitutes" ? mag : -mag;
          const right = pr.rel === "Substitutes"
            ? `A 10% rise in the price of ${pr.y} raises the quantity of ${pr.x} demanded by about ${U.fmt(U.round(mag * 10, 1))}%; they are substitutes`
            : `A 10% rise in the price of ${pr.y} lowers the quantity of ${pr.x} demanded by about ${U.fmt(U.round(mag * 10, 1))}%; they are complements`;
          return Q.mc({
            q: `The cross-price elasticity of demand for ${pr.x} with respect to the price of ${pr.y} is <b>${sg(e)}</b>. Which statement is correct?`,
            right,
            wrong: [
              pr.rel === "Substitutes"
                ? { t: `A 10% rise in the price of ${pr.y} lowers the quantity of ${pr.x} demanded by about ${U.fmt(U.round(mag * 10, 1))}%; they are complements`, why: "A positive cross elasticity means the two move together: substitutes." }
                : { t: `A 10% rise in the price of ${pr.y} raises the quantity of ${pr.x} demanded by about ${U.fmt(U.round(mag * 10, 1))}%; they are substitutes`, why: "A negative cross elasticity means complements." },
              { t: `Demand for ${pr.x} is ${mag > 1 ? "price elastic" : "price inelastic"} with respect to its own price`, why: `This number links the quantity of ${pr.x} to the price of <em>${pr.y}</em>; it says nothing about the own-price elasticity of ${pr.x}.` },
              { t: `A 10% rise in the price of ${pr.x} changes the quantity of ${pr.y} demanded by about ${U.fmt(U.round(mag * 10, 1))}%`, why: `That swaps the goods. The given elasticity links the quantity of ${pr.x} to the price of ${pr.y}.` },
            ],
            sol: steps(`${EXY} = %ΔQ of ${pr.x} ÷ %ΔP of ${pr.y}, so %ΔQ of ${pr.x} = ${EXY} × %ΔP of ${pr.y}.`,
              `${sg(e)} × 10% = ${pct(e * 10)}. The sign is ${e > 0 ? "positive → substitutes" : "negative → complements"}.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Income elasticity of demand
   * ============================================================ */
  const INC_CATS = ["Luxury (normal, income elastic)", "Necessity (normal, income inelastic)", "Inferior"];
  const incCat = e => (e > 1 ? INC_CATS[0] : e > 0 ? INC_CATS[1] : INC_CATS[2]);
  const incShort = e => (e > 1 ? "a normal good and a luxury (income elastic)" : e > 0 ? "a normal good and a necessity (income inelastic)" : "an inferior good");
  const INC_GOODS = [
    { g: "ocean cruises", k: "lux", pl: 1 }, { g: "fine jewelry", k: "lux" }, { g: "restaurant dinners", k: "lux", pl: 1 }, { g: "private music lessons", k: "lux", pl: 1 }, { g: "new sports cars", k: "lux", pl: 1 },
    { g: "toothpaste", k: "nec" }, { g: "milk", k: "nec" }, { g: "electricity", k: "nec" }, { g: "laundry detergent", k: "nec" }, { g: "bread", k: "nec" },
    { g: "instant noodles", k: "inf", pl: 1 }, { g: "intercity bus tickets", k: "inf", pl: 1 }, { g: "store-brand canned meat", k: "inf" }, { g: "secondhand clothing", k: "inf" }, { g: "high-mileage used cars", k: "inf", pl: 1 },
  ];
  function incVal(k) {
    if (k === "lux") return U.pick([1.3, 1.5, 1.8, 2, 2.4, 3]);
    if (k === "nec") return U.pick([0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    return -U.pick([0.2, 0.3, 0.5, 0.6, 0.8, 1.2]);
  }

  const genIncome = STUDY.makeGenerator({
    id: "b251-m4-income",
    name: "Income elasticity",
    blurb: "Compute income elasticities and use their sign and size to classify goods as luxuries, necessities or inferior goods.",
    variants: [
      {
        name: "Income elasticity from percentage changes",
        make() {
          const it = U.pick(INC_GOODS);
          const e = incVal(it.k);
          const di = U.pick([2, 4, 5, 8, 10]) * (Math.random() < 0.75 ? 1 : -1);
          const dq = U.round(e * di, 2);
          return Q.num({
            q: `Average household income in a city ${di > 0 ? "rises" : "falls"} by <b>${Math.abs(di)}%</b>. With prices unchanged, the quantity of ${it.g} demanded ${dq > 0 ? "rises" : "falls"} by <b>${U.fmt(Math.abs(dq))}%</b>. What is the income elasticity of demand? Keep the sign.`,
            answer: e, tol: 0.02,
            traps: traps(e, [
              { value: -e, why: "Sign error: keep the direction of both changes. The sign tells normal from inferior." },
              { value: 1 / e, why: "Upside down: % change in quantity over % change in income." },
            ]),
            sol: steps(`${EI} = (% change in quantity demanded) ÷ (% change in income). Keep the signs.`,
              `${EI} = ${pct(dq)} ÷ ${pct(di)} = <b>${sg(e)}</b>.`,
              `So ${it.g} ${it.pl ? "are" : "is"} ${incShort(e)} here.`),
          });
        },
      },
      {
        name: "Income elasticity with the midpoint method",
        make() {
          const it = U.pick(INC_GOODS);
          let I1, I2, Q1, Q2, e;
          for (let k = 0; k < 500; k++) {
            I1 = U.randInt(30, 90) * 1000; I2 = I1 + U.pick([-1, 1, 1, 1]) * U.randInt(2, 15) * 1000;
            Q1 = U.randInt(10, 60) * 10;
            const dq = U.randInt(1, 25) * 10;
            const dir = it.k === "inf" ? -1 : 1;
            Q2 = Q1 + dir * Math.sign(I2 - I1) * dq;
            if (Q2 <= 0) continue;
            e = mid(Q1, Q2) / mid(I1, I2);
            const okRange = it.k === "lux" ? e > 1.1 : it.k === "nec" ? (e > 0.1 && e < 0.9) : (e < -0.1);
            if (okRange && Math.abs(e) < 6) break;
          }
          return Q.num({
            q: `Average household income in a town goes from <b>${U.money(I1)}</b> to <b>${U.money(I2)}</b> a year. With prices unchanged, the town's monthly purchases of ${it.g} go from <b>${U.fmt(Q1)}</b> to <b>${U.fmt(Q2)}</b> units. Using the <b>midpoint method</b>, what is the income elasticity of demand? Keep the sign; two decimals.`,
            answer: e, tol: Math.max(0.02, Math.abs(e) * 0.02),
            traps: traps(e, [
              { value: -e, why: "Sign error: keep the direction of each change." },
              { value: 1 / e, why: "Upside down: quantity change over income change." },
              { value: simple(Q1, Q2) / simple(I1, I2), why: "That uses the starting values as the base. Use the averages (midpoint method)." },
            ]),
            sol: steps(`${EI} = %ΔQ ÷ %Δ income, each with the midpoint method.`,
              `${midLine("Q", Q1, Q2)}<br>${midLine("I", I1, I2, true)}`,
              `${EI} = ${pct(mid(Q1, Q2))} ÷ ${pct(mid(I1, I2))} = <b>${sg(e)}</b>, so in this town ${it.g} ${it.pl ? "are" : "is"} ${incShort(e)}.`),
          });
        },
      },
      {
        name: "Classify by income elasticity value",
        make() {
          const ks = U.shuffle(["lux", "nec", "inf", U.pick(["lux", "nec", "inf"]), U.pick(["lux", "nec", "inf"])]);
          const used = new Set(), items = [];
          for (const k of ks) {
            let v, t, j = 0;
            do { v = incVal(k); t = `${EI} = ${sg(v)}`; } while (used.has(t) && j++ < 20);
            if (used.has(t)) continue;
            used.add(t);
            items.push({ t: `Good ${String.fromCharCode(74 + items.length)}: ${t}`, cat: incCat(v), why: v > 1 ? "Greater than 1: normal and income elastic (luxury)." : v > 0 ? "Between 0 and 1: normal but income inelastic (necessity)." : "Negative: inferior." });
          }
          return Q.classify({
            q: "Classify each good by its income elasticity of demand.",
            cats: INC_CATS, items,
            sol: steps("First the sign: positive → normal, negative → inferior.",
              "Then, for normal goods, compare with 1: above 1 → luxury (income elastic); between 0 and 1 → necessity (income inelastic)."),
          });
        },
      },
      {
        name: "Classify from a description",
        make() {
          const ks = U.shuffle(["lux", "nec", "inf", U.pick(["lux", "nec", "inf"])]);
          const used = new Set(), items = [];
          for (const k of ks) {
            const v = incVal(k);
            const di = U.pick([2, 4, 5, 10]) * (Math.random() < 0.7 ? 1 : -1);
            const dq = U.round(v * di, 1);
            const t = `Income ${di > 0 ? "rises" : "falls"} ${Math.abs(di)}%; purchases ${dq > 0 ? "rise" : "fall"} ${U.fmt(Math.abs(dq))}%`;
            if (used.has(t) || dq === 0) continue;
            used.add(t);
            items.push({ t, cat: incCat(v), why: `${EI} = ${pct(dq)} ÷ ${pct(di)} = ${sg(dq / di)}.` });
          }
          return Q.classify({
            q: "Each line shows how buyers' purchases of a good respond to a change in their income (prices unchanged). Classify the good.",
            cats: INC_CATS, items,
            sol: steps("Compute E<sub>i</sub> = %ΔQ ÷ %Δ income for each line, keeping the signs. Watch out for income <em>falls</em>: a fall in purchases when income falls is a positive elasticity.",
              "Above 1 → luxury; between 0 and 1 → necessity; negative → inferior."),
          });
        },
      },
      {
        name: "Reverse: predict the change in quantity",
        make() {
          const it = U.pick(INC_GOODS);
          const e = incVal(it.k);
          const di = U.pick([2, 3, 4, 5, 6, 8, 10]) * (Math.random() < 0.6 ? 1 : -1);
          const ans = U.round(e * di, 4);
          return Q.num({
            q: `The income elasticity of demand for ${it.g} is <b>${sg(e)}</b>. If incomes ${di > 0 ? "rise" : "fall"} by <b>${Math.abs(di)}%</b> and prices stay the same, by what percentage does the quantity demanded change? (Enter a decrease as a negative number.)`,
            answer: ans, unit: "%", tol: 0.05,
            traps: traps(ans, [
              { value: -ans, why: "Sign error: multiply the signed elasticity by the signed income change." },
              { value: di / e, why: "Rearrange correctly: %ΔQ = E<sub>i</sub> × %Δ income." },
            ]),
            sol: steps("Rearrange: %ΔQ = E<sub>i</sub> × %Δ income.",
              `${sg(e)} × ${pct(di)} = <b>${pct(ans)}</b>.`,
              `${cap(it.g)} ${it.pl ? "are" : "is"} ${incShort(e)} by this estimate.`),
          });
        },
      },
      {
        name: "Recession winners and losers",
        make() {
          const picks = [U.pick(INC_GOODS.filter(g => g.k === "lux")), U.pick(INC_GOODS.filter(g => g.k === "nec")), U.pick(INC_GOODS.filter(g => g.k === "inf"))];
          const vals = picks.map(p => incVal(p.k));
          const ask = U.pick(["rise", "fallMost"]);
          const rows = picks.map((p, i) => [cap(p.g), sg(vals[i])]);
          const right = ask === "rise" ? cap(picks[2].g) : cap(picks[0].g);
          const wrong = picks.filter((p, i) => cap(p.g) !== right).map(p => {
            const v = vals[picks.indexOf(p)];
            return { t: cap(p.g), why: ask === "rise" ? (v > 0 ? "A positive income elasticity means purchases fall when income falls." : "") : (v < 0 ? "A negative income elasticity means purchases <em>rise</em> when income falls." : `Purchases fall, but by less: ${sg(v)} is smaller than the luxury's elasticity.`) };
          });
          wrong.push({ t: "All three fall by the same percentage", why: "Different income elasticities mean different responses to the same income change." });
          return Q.mc({
            q: `A recession cuts household incomes by 6%. Estimated income elasticities:${tbl(["Good", EI], rows)}${ask === "rise" ? "Purchases of which good are likely to <b>rise</b>?" : "Purchases of which good are likely to <b>fall the most</b> (in percent)?"}`,
            right, wrong,
            sol: steps("%ΔQ = E<sub>i</sub> × %Δ income, with income change −6%.",
              picks.map((p, i) => `${cap(p.g)}: ${sg(vals[i])} × (−6%) = ${pct(vals[i] * -6)}`).join("<br>"),
              ask === "rise" ? `Only the inferior good (negative ${EI}) gains: <b>${right}</b>.` : `The luxury (largest positive ${EI}) falls most: <b>${right}</b>.`),
          });
        },
      },
      {
        name: "Which statement about income elasticity is true?",
        make() {
          const BANK_T = [
            "A good with an income elasticity of 0.4 is a normal good",
            "A good with an income elasticity of −0.7 is an inferior good",
            "A luxury has an income elasticity greater than 1",
            "Spending on a necessity rises more slowly than income",
            "If income rises 5% and purchases fall 2%, the good is inferior",
          ];
          const BANK_F = [
            { t: "A good with an income elasticity of 0.4 is an inferior good", why: "0.4 is positive, so the good is normal (a necessity)." },
            { t: "A necessity has a negative income elasticity", why: "Necessities are normal goods with an elasticity between 0 and 1." },
            { t: "A luxury has an income elasticity between 0 and 1", why: "Between 0 and 1 is a necessity; a luxury is above 1." },
            { t: "Income elasticity is reported as an absolute value, like price elasticity", why: "The sign is essential: it separates normal from inferior goods." },
            { t: "If income falls 4% and purchases fall 8%, the good is inferior", why: "Both fall, so the elasticity is +2: a luxury." },
            { t: "An inferior good is one of poor quality that nobody buys", why: "“Inferior” only means purchases fall when income rises." },
          ];
          const right = U.pick(BANK_T);
          return Q.mc({
            q: "Which statement is <b>true</b>?",
            right, wrong: U.sample(BANK_F, 3),
            sol: steps("Sign first (positive normal, negative inferior), then size for normal goods (above 1 luxury, 0–1 necessity).",
              `“${right}” fits those rules.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Price elasticity of supply
   * ============================================================ */
  const SGOODS = [
    { s: "bushel of apples", p: "bushels of apples", who: "Orchards in a valley", per: "per week", n: "apples" },
    { s: "gallon of maple syrup", p: "gallons of maple syrup", who: "Local sugar shacks", per: "per season", n: "maple syrup" },
    { s: "bicycle", p: "bicycles", who: "A bike maker", per: "per month", n: "bicycles", k: 10 },
    { s: "dozen eggs", p: "dozen eggs", who: "Area farms", per: "per week", n: "eggs", k: 0.25 },
    { s: "ton of steel", p: "tons of steel", who: "A steel mill", per: "per day", n: "steel", k: 20 },
    { s: "T-shirt", p: "T-shirts", who: "A print shop", per: "per week", n: "T-shirts" },
    { s: "pound of coffee", p: "pounds of coffee", who: "Coffee roasters", per: "per week", n: "roasted coffee" },
    { s: "jar of honey", p: "jars of honey", who: "Beekeepers in the county", per: "per month", n: "honey" },
  ];
  function sPts(want) {
    for (let k = 0; k < 2000; k++) {
      const g = U.pick(SGOODS);
      const sc = g.k || 1;
      let P1 = U.randInt(4, 40), P2 = P1 + U.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
      if (P2 <= 0) continue;
      P1 *= sc; P2 *= sc;
      const Q1 = U.randInt(10, 90) * 10;
      const dq = U.randInt(1, 40) * 10;
      const Q2 = P2 > P1 ? Q1 + dq : Q1 - dq;
      if (Q2 <= 0) continue;
      const e = mid(Q1, Q2) / mid(P1, P2);
      if (e < 0.15 || e > 5 || Math.abs(e - 1) < 0.1) continue;
      if (want === "elastic" && e < 1) continue;
      if (want === "inelastic" && e > 1) continue;
      if (Math.abs(simple(Q1, Q2) / simple(P1, P2) - e) < 0.05) continue;
      return { g, P1, P2, Q1, Q2, e };
    }
    return { g: SGOODS[0], P1: 10, P2: 12, Q1: 400, Q2: 500, e: mid(400, 500) / mid(10, 12) };
  }
  const TIME_BANK = [
    { t: "The number of parking spaces at a stadium on the night of a big game", cat: "Momentary" },
    { t: "Fish already landed at the dock this morning, before the boats can go out again", cat: "Momentary" },
    { t: "Hotel rooms in a small town during this weekend's festival", cat: "Momentary" },
    { t: "Fresh-cut roses already in florists' coolers on the morning of Valentine's Day", cat: "Momentary" },
    { t: "A bakery adds an extra shift with its existing ovens over the next few weeks", cat: "Short run" },
    { t: "A factory runs its current machines overtime for the next quarter", cat: "Short run" },
    { t: "Farmers hire extra pickers to harvest more of this season's crop", cat: "Short run" },
    { t: "A restaurant keeps its kitchen but hires two more cooks for the summer", cat: "Short run" },
    { t: "Over several years, new firms build plants and enter the industry", cat: "Long run" },
    { t: "Existing producers build entirely new factories over the next decade", cat: "Long run" },
    { t: "Over many years, growers plant new orchards that take time to bear fruit", cat: "Long run" },
    { t: "Over several years, firms exit an industry and its resources move elsewhere", cat: "Long run" },
  ];
  const TIME_WHY = {
    Momentary: "The quantity is fixed right now: perfectly inelastic (vertical) supply.",
    "Short run": "Existing plants, more labor and shifts: supply is somewhat inelastic.",
    "Long run": "New plants and entry or exit: supply is most elastic.",
  };
  const SUB_PAIRS = [
    { more: "Plain cotton T-shirts", less: "Original paintings by an artist who has died", why: "The T-shirt inputs (cloth, labor, printers) are common and can be shifted in; no one can add to a dead artist's output." },
    { more: "Soybeans", less: "Wine from one small, famous hillside vineyard", why: "Farmland can switch from corn to soybeans; that hillside cannot be expanded." },
    { more: "Basic wooden chairs", less: "Beachfront lots on a small island", why: "Wood and carpentry labor can be drawn from other uses; beachfront land is fixed." },
    { more: "Plastic water bottles", less: "Seats in a historic downtown theater", why: "Plastic and molding machines are widely available; the theater's seats are fixed." },
    { more: "Frozen pizzas", less: "Rare first-edition comic books", why: "Ingredients and kitchen labor are easy to move in; first editions cannot be produced again." },
  ];

  const genSupply = STUDY.makeGenerator({
    id: "b251-m4-supply",
    name: "Price elasticity of supply",
    blurb: "Compute and classify the elasticity of supply, read supply-curve shapes, and apply resource substitution and time frames.",
    variants: [
      {
        name: "Supply elasticity with the midpoint method",
        make() {
          const d = sPts();
          return Q.num({
            q: `${d.g.who} ${d.g.who.startsWith("A ") ? "offers" : "offer"} <b>${U.fmt(d.Q1)} ${d.g.p}</b> ${d.g.per} when the price is <b>${U.money(d.P1)}</b>, and <b>${U.fmt(d.Q2)}</b> when the price is <b>${U.money(d.P2)}</b>. Using the <b>midpoint method</b>, what is the price elasticity of supply? Round to two decimals.`,
            answer: d.e, tol: Math.max(0.02, d.e * 0.02),
            traps: traps(d.e, [
              { value: 1 / d.e, why: "Upside down: % change in quantity supplied goes on top." },
              { value: simple(d.Q1, d.Q2) / simple(d.P1, d.P2), why: "That uses the starting values as the base. The midpoint method uses averages." },
              { value: Math.abs((d.Q2 - d.Q1) / (d.P2 - d.P1)), why: "That is units per dollar, not a ratio of percentages." },
            ]),
            sol: steps("E<sub>s</sub> = %ΔQ<sub>s</sub> ÷ %ΔP, with each percentage change measured against the average.",
              `${midLine("Q", d.Q1, d.Q2)}<br>${midLine("P", d.P1, d.P2, true)}`,
              `E<sub>s</sub> = ${pct(mid(d.Q1, d.Q2))} ÷ ${pct(mid(d.P1, d.P2))} = <b>${d2(d.e)}</b>: supply is ${d.e > 1 ? "elastic" : "inelastic"} over this range.`),
          });
        },
      },
      {
        name: "Supply elasticity from percentage changes",
        make() {
          const { p, q, e } = pctPair();
          const g = U.pick(SGOODS);
          const up = Math.random() < 0.7;
          return Q.num({
            q: `The price of a ${g.s} ${up ? "rises" : "falls"} by <b>${p}%</b>, and producers ${up ? "increase" : "cut"} the quantity supplied by <b>${U.fmt(q)}%</b>. What is the price elasticity of supply?`,
            answer: e, tol: 0.02,
            traps: traps(e, [
              { value: 1 / e, why: "Upside down: quantity change over price change." },
              { value: -e, why: "Supply elasticity is positive: price and quantity supplied move in the same direction." },
            ]),
            sol: steps("E<sub>s</sub> = % change in quantity supplied ÷ % change in price.",
              `E<sub>s</sub> = ${up ? "" : "−"}${U.fmt(q)}% ÷ ${up ? "" : "−"}${p}% = <b>${U.fmt(e)}</b>: ${e > 1 ? "elastic" : "inelastic"} supply.`),
          });
        },
      },
      {
        name: "Reverse: predict the change in quantity supplied",
        make() {
          const e = U.pick([0.2, 0.3, 0.5, 0.6, 0.8, 1.2, 1.5, 2, 2.5, 3]);
          const p = U.pick([4, 5, 6, 8, 10, 12, 15]);
          const g = U.pick(SGOODS);
          const ans = U.round(e * p, 4);
          return Q.num({
            q: `The price elasticity of supply of ${g.n} is <b>${U.fmt(e)}</b>. If the price rises by <b>${p}%</b>, by about what percentage will the quantity supplied rise?`,
            answer: ans, unit: "%", tol: 0.05,
            traps: traps(ans, [
              { value: p / e, why: "Multiply, don't divide: %ΔQ<sub>s</sub> = E<sub>s</sub> × %ΔP." },
              { value: p, why: "That would only be true for unit elastic supply." },
            ]),
            sol: steps("Rearrange: %ΔQ<sub>s</sub> = E<sub>s</sub> × %ΔP.",
              `${U.fmt(e)} × ${p}% = <b>${U.fmt(U.round(ans, 2))}%</b>.`),
          });
        },
      },
      {
        name: "Read the supply-curve shapes",
        make() {
          const labs = U.shuffle(["S₁", "S₂", "S₃"]);
          const Q0 = U.pick([20, 25, 30, 35]), P0 = U.pick([15, 18, 21, 24]);
          const k = U.pick([0.25, 0.4, 0.6, 1]);
          const shapes = {
            vert: { pts: [[Q0, 0], [Q0, 29]], name: "perfectly inelastic (E<sub>s</sub> = 0)" },
            horiz: { pts: [[0, P0], [60, P0]], name: "perfectly elastic (E<sub>s</sub> = ∞)" },
            origin: { pts: [[0, 0], [Math.min(60, 29 / k), Math.min(29, 60 * k)]], name: "unit elastic (E<sub>s</sub> = 1)" },
          };
          const keys = ["vert", "horiz", "origin"];
          const styles = ["main", "alt", "dash"];
          const graph = G.plot({ xLabel: "Quantity supplied", yLabel: "Price ($)", xMax: 60, yMax: 30, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [10, 20, 30],
            curves: keys.map((key, i) => ({ pts: shapes[key].pts, style: styles[i], label: labs[i], labelAt: key === "horiz" ? 0 : 1 })), aria: "three supply curves" });
          const ask = U.pick(keys);
          const askName = { vert: "perfectly inelastic", horiz: "perfectly elastic", origin: "unit elastic" }[ask];
          const right = labs[keys.indexOf(ask)];
          return Q.mc({
            q: `Which supply curve is <b>${askName}</b>?${graph}`,
            right,
            wrong: keys.filter(x => x !== ask).map(x => ({ t: labs[keys.indexOf(x)], why: `${labs[keys.indexOf(x)]} is ${shapes[x].name}.` }))
              .concat([{ t: "None of them: only a curved supply line can be " + askName, why: "Each of these straight lines has a fixed elasticity class." }]),
            sol: steps("Vertical = quantity fixed (E<sub>s</sub> = 0). Horizontal = any quantity at one price (E<sub>s</sub> = ∞). Straight line through the origin = E<sub>s</sub> = 1, whatever its slope.",
              `So the ${askName} curve is <b>${right}</b>.`),
          });
        },
      },
      {
        name: "A supply line through the origin",
        make() {
          const k = U.pick([2, 3, 4, 5, 8, 10, 20, 25]);
          const g = U.pick(SGOODS);
          const P1 = U.randInt(3, 20), P2 = P1 + U.randInt(1, 6);
          const Q1 = k * P1, Q2 = k * P2;
          return Q.num({
            q: `The supply of ${g.n} is <b>Q<sub>s</sub> = ${k}P</b>, a straight line through the origin. Using the midpoint method, what is the price elasticity of supply when the price rises from <b>${U.money(P1)}</b> to <b>${U.money(P2)}</b>?`,
            answer: 1, tol: 0.02,
            traps: traps(1, [
              { value: k, why: `${k} is the slope term (units per dollar). Elasticity compares <em>percentage</em> changes.` },
              { value: 1 / k, why: "That is the inverse of the slope term, not an elasticity." },
              { value: Q2 - Q1, why: "That is the change in quantity in units." },
            ]),
            sol: steps("Find the quantities, then apply the midpoint method.",
              `Q<sub>1</sub> = ${k} × ${P1} = ${Q1}; Q<sub>2</sub> = ${k} × ${P2} = ${Q2}.<br>${midLine("Q", Q1, Q2)}<br>${midLine("P", P1, P2, true)}`,
              `The two percentages are identical, so E<sub>s</sub> = <b>1</b>. Every straight-line supply curve through the origin is unit elastic, whatever its slope.`),
          });
        },
      },
      {
        name: "Momentary, short run or long run?",
        make() {
          const cats = ["Momentary", "Short run", "Long run"];
          const items = cats.map(c => U.pick(TIME_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m4-time", TIME_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Which supply time frame does each situation describe?",
            cats,
            items: items.map(i => ({ t: i.t, cat: i.cat, why: TIME_WHY[i.cat] })),
            sol: steps("Ask what producers can change: nothing (momentary), labor and hours with existing plants (short run), or plants and the number of firms (long run).",
              "Momentary supply is perfectly inelastic; short-run supply is somewhat inelastic; long-run supply is the most elastic."),
          });
        },
      },
      {
        name: "Which supply is more elastic?",
        make() {
          const pr = U.pick(SUB_PAIRS);
          return Q.mc({
            q: `Which good is likely to have the more <b>elastic supply</b>, and why?<br>• ${pr.more}<br>• ${pr.less}`,
            right: `${pr.more}: the resources used to make it are easy to shift into its production`,
            wrong: [
              { t: `${pr.less}: buyers want it badly, so producers respond more`, why: "How much buyers want something is a demand matter. Supply elasticity depends on how easily output can be expanded." },
              { t: `${pr.more}: it has many substitutes for buyers`, why: "Substitutes for buyers affect demand elasticity, not supply elasticity." },
              { t: "Both are equally elastic: supply always responds fully to price", why: "Supply responds only as far as producers can get the resources to expand output." },
            ],
            sol: steps("Supply elasticity depends on resource substitution possibilities (and time).",
              pr.why),
          });
        },
      },
      {
        name: "Which is NOT true about supply elasticity?",
        make() {
          const right = U.pick([
            "A steeper straight-line supply curve through the origin is less elastic than a flatter one",
            "Momentary supply is the most elastic, because producers can react instantly",
            "Price elasticity of supply is negative, because higher prices reduce quantity supplied",
            "Supply is more elastic in the short run than in the long run",
          ]);
          const pool = [
            { t: "Supply is more elastic the longer producers have to adjust", why: "True: time lets firms expand plants and new firms enter." },
            { t: "A vertical supply curve has an elasticity of 0", why: "True: quantity is fixed." },
            { t: "Goods made from easily substituted resources have more elastic supply", why: "True: resource substitution is a determinant." },
            { t: "Any straight-line supply curve through the origin has an elasticity of 1", why: "True: the slope is irrelevant." },
            { t: "A horizontal supply curve is perfectly elastic", why: "True: E<sub>s</sub> = ∞." },
          ];
          return Q.mc({
            q: "Which statement about the price elasticity of supply is <b>not</b> true?",
            right, wrong: U.sample(pool, 3),
            rightWhy: "This statement is false.",
            sol: steps("Check each statement against the rules: E<sub>s</sub> ≥ 0; vertical 0, horizontal ∞, through the origin 1; more elastic with easier resource substitution and more time.",
              `“${right}” breaks one of these rules.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Which elasticity is it?
   * ============================================================ */
  const KINDS = ["Price elasticity of demand", "Cross-price elasticity", "Income elasticity", "Price elasticity of supply"];
  const KIND_BANK = [
    { t: "A gym raises its monthly fee 8% and memberships fall 5%.", cat: 0 },
    { t: "A ferry line cuts fares 10% and trips rise 14%.", cat: 0 },
    { t: "A coffee shop finds that raising the price of a latte barely changes how many lattes it sells.", cat: 0 },
    { t: "When toll prices rise, the number of drivers using the toll road falls.", cat: 0 },
    { t: "Movie-ticket prices rise 10% and streaming sign-ups rise 3%.", cat: 1 },
    { t: "Printer prices fall and sales of ink cartridges climb.", cat: 1 },
    { t: "After the price of hot dogs rises, sales of hot dog buns drop.", cat: 1 },
    { t: "When butter gets pricier, shoppers buy more margarine.", cat: 1 },
    { t: "After a 6% raise for local workers, restaurant meals rise 9%.", cat: 2 },
    { t: "During a recession, sales of store-brand groceries rise.", cat: 2 },
    { t: "As incomes in a country grow, spending on air travel grows even faster.", cat: 2 },
    { t: "A family earning more buys slightly more milk than before.", cat: 2 },
    { t: "Honey prices rise 20% and beekeepers offer 12% more honey for sale.", cat: 3 },
    { t: "When lumber prices jump, sawmills add shifts and produce more boards.", cat: 3 },
    { t: "Higher apartment rents lead developers to build more apartments over several years.", cat: 3 },
    { t: "When the price of a rare antique rises, the number available for sale cannot change.", cat: 3 },
  ];
  const READ_BANK = [
    {
      q: "A study reports an elasticity of <b>−1.4</b> between the price of tennis rackets and purchases of tennis balls.",
      right: "Rackets and balls are complements: a 1% rise in racket prices cuts ball purchases by about 1.4%",
      wrong: [
        { t: "Demand for tennis balls is price elastic", why: "The number links ball purchases to <em>racket</em> prices, so it is a cross elasticity, not balls' own-price elasticity." },
        { t: "Rackets and balls are substitutes", why: "A negative cross elasticity means complements." },
        { t: "Tennis balls are an inferior good", why: "Inferior goods are identified by income elasticity, not by the price of another good." },
      ],
    },
    {
      q: "A study reports an elasticity of <b>−0.5</b> between household income and purchases of instant noodles.",
      right: "Instant noodles are an inferior good: a 1% rise in income lowers purchases by about 0.5%",
      wrong: [
        { t: "Demand for instant noodles is price inelastic", why: "The number relates purchases to income, not to the noodles' price." },
        { t: "Instant noodles are a necessity, because 0.5 is between 0 and 1", why: "The sign is negative, so the good is inferior, not a necessity." },
        { t: "Instant noodles and income are complements", why: "Complements and substitutes describe pairs of goods, via cross elasticity." },
      ],
    },
    {
      q: "A study reports an elasticity of <b>−1.6</b> between bus fares and the number of bus rides taken.",
      right: "Demand for bus rides is price elastic: a 1% fare rise cuts rides by about 1.6%",
      wrong: [
        { t: "Bus rides are an inferior good", why: "Income is not involved here: fares are the rides' own price." },
        { t: "Demand for bus rides is price inelastic, because the number is negative", why: "Classify by the absolute value: 1.6 &gt; 1, so elastic." },
        { t: "Bus fares and bus rides are complements", why: "This is the good's own price, not another good's." },
      ],
    },
    {
      q: "A study reports an elasticity of <b>+2.2</b> between household income and spending on vacation rentals.",
      right: "Vacation rentals are a normal good and a luxury: a 1% rise in income raises purchases by about 2.2%",
      wrong: [
        { t: "Vacation rentals have price-elastic demand", why: "The number relates purchases to income, not to price." },
        { t: "Vacation rentals are a necessity", why: "Above 1 means income elastic: a luxury." },
        { t: "Vacation rentals are an inferior good", why: "Inferior goods have a negative income elasticity." },
      ],
    },
    {
      q: "A study reports an elasticity of <b>+0.8</b> between the price of chicken and purchases of turkey.",
      right: "Chicken and turkey are substitutes: a 1% rise in chicken prices raises turkey purchases by about 0.8%",
      wrong: [
        { t: "Turkey is a normal necessity", why: "That would need an <em>income</em> elasticity; this links turkey to chicken's price." },
        { t: "Chicken and turkey are complements", why: "A positive cross elasticity means substitutes." },
        { t: "Demand for turkey is price inelastic", why: "This is not turkey's own-price elasticity." },
      ],
    },
    {
      q: "A study reports an elasticity of <b>+0.3</b> between the price of cut flowers and the quantity growers bring to market this week.",
      right: "Supply of cut flowers is inelastic this week: a 1% price rise raises quantity supplied by about 0.3%",
      wrong: [
        { t: "Cut flowers are a necessity", why: "Necessity refers to income elasticity of demand; this is about growers (supply)." },
        { t: "Demand for cut flowers is inelastic", why: "The quantity here is what growers bring to market — quantity supplied." },
        { t: "Supply of cut flowers is elastic", why: "0.3 &lt; 1: inelastic (unsurprising over one week)." },
      ],
    },
  ];
  const TF_MIX = [
    { t: "Price elasticity of demand is usually reported as an absolute value.", ok: true },
    { t: "A positive cross-price elasticity indicates substitutes.", ok: true },
    { t: "A negative income elasticity indicates an inferior good.", ok: true },
    { t: "Price elasticity of supply is positive.", ok: true },
    { t: "All four elasticities divide a percentage change in quantity by a percentage change in something else.", ok: true },
    { t: "A cross-price elasticity of −2 means the goods are strong substitutes.", ok: false, why: "Negative means complements; −2 means strong complements." },
    { t: "An income elasticity of 0.6 means the good is inferior.", ok: false, why: "Positive means normal; between 0 and 1 is a necessity." },
    { t: "Price elasticity of supply is negative because of the law of supply.", ok: false, why: "The law of supply makes price and quantity supplied move together: positive." },
    { t: "Income elasticity is measured holding income constant while the price changes.", ok: false, why: "It is the other way round: price is held constant while income changes." },
    { t: "A vertical supply curve has an infinite price elasticity.", ok: false, why: "Vertical means quantity cannot change: E<sub>s</sub> = 0." },
  ];

  const genMixed = STUDY.makeGenerator({
    id: "b251-m4-mixed",
    name: "Which elasticity is it?",
    blurb: "Pick the right elasticity for a situation, choose the right numbers, and read a signed elasticity in context.",
    variants: [
      {
        name: "Name the elasticity",
        make() {
          const items = [0, 1, 2, 3].map(c => U.pick(KIND_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m4-kind", KIND_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Which elasticity does each situation illustrate?",
            cats: KINDS,
            items: items.map(i => ({ t: i.t, cat: i.cat, why: ["The good's own price changed and buyers responded.", "Another good's price changed and buyers of this good responded.", "Income changed and buyers responded.", "The good's price changed and <em>sellers</em> responded."][i.cat] })),
            sol: steps("Ask two questions: what caused the change (own price, another good's price, income)? And whose quantity changed (buyers or sellers)?",
              "Own price + buyers → price elasticity of demand. Other good's price → cross-price. Income → income elasticity. Own price + sellers → price elasticity of supply."),
          });
        },
      },
      {
        name: "Pick the right numbers",
        make() {
          const sets = [
            { x: "coffee", y: "tea", rel: 1 }, { x: "printers", y: "ink cartridges", rel: -1 }, { x: "hot dogs", y: "hot dog buns", rel: -1 },
            { x: "bus rides", y: "rideshare trips", rel: 1 }, { x: "game consoles", y: "video games", rel: -1 },
          ];
          const s = U.pick(sets);
          let p, qx, qy;
          for (let k = 0; k < 100; k++) {
            p = U.pick([5, 8, 10, 20]);
            qx = U.pick([2, 3, 4, 6, 12, 15, 16, 25]);
            qy = U.pick([1, 2, 3, 4, 5, 6, 8, 12]);
            if (qx !== qy && Math.abs(qx / p - 1) > 0.1) break;
          }
          const ask = U.pick(["own", "cross"]);
          const ans = ask === "own" ? qx / p : (s.rel * qy) / p;
          return Q.num({
            q: `The price of ${s.x} rises by <b>${p}%</b>. As a result, the quantity of ${s.x} demanded falls by <b>${qx}%</b>, and the quantity of ${s.y} demanded ${s.rel > 0 ? "rises" : "falls"} by <b>${qy}%</b>. ${ask === "own" ? `What is the price elasticity of demand for ${s.x} (absolute value)?` : `What is the cross-price elasticity of demand for ${s.y} with respect to the price of ${s.x}? Keep the sign.`}`,
            answer: ans, tol: 0.02,
            traps: traps(ans, ask === "own"
              ? [{ value: qy / p, why: `That uses the change in ${s.y}, which belongs in the cross-price elasticity.` }, { value: p / qx, why: "Upside down: quantity change over price change." }, { value: -qx / p, why: "Report the price elasticity of demand as an absolute value." }]
              : [{ value: -qx / p, why: `That uses the change in ${s.x} itself — its own-price elasticity.` }, { value: -ans, why: "Sign error: the direction of the change in quantity matters." }, { value: p / (s.rel * qy), why: "Upside down." }]),
            sol: steps(ask === "own" ? `Own-price elasticity uses ${s.x}'s own quantity and own price.` : `Cross-price elasticity uses the quantity of ${s.y} and the price of ${s.x}.`,
              ask === "own" ? `|${EP}| = ${qx}% ÷ ${p}% = <b>${d2(ans)}</b> (${pedClass(ans)}).` : `${EXY} = ${s.rel > 0 ? "+" : "−"}${qy}% ÷ +${p}% = <b>${sg(ans)}</b>: ${s.rel > 0 ? "substitutes" : "complements"}.`),
          });
        },
      },
      {
        name: "Match the formula",
        make() {
          const k = U.randInt(0, 3);
          const F = [
            "% change in quantity demanded of a good ÷ % change in that good's price",
            "% change in quantity demanded of good X ÷ % change in the price of good Y",
            "% change in quantity demanded ÷ % change in income",
            "% change in quantity supplied ÷ % change in price",
          ];
          const bad = { t: "% change in price ÷ % change in quantity demanded", why: "That is upside down: every elasticity puts the quantity change on top." };
          return Q.mc({
            q: `Which formula defines the <b>${KINDS[k].toLowerCase()}</b>?`,
            right: F[k],
            wrong: F.filter((_, i) => i !== k).slice(0, 2).map((t, i) => ({ t, why: `That is the ${KINDS[F.indexOf(t)].toLowerCase()}.` })).concat([bad]),
            sol: steps("All four elasticities are (% change in a quantity) ÷ (% change in its cause).",
              `For the ${KINDS[k].toLowerCase()} the cause is ${["the good's own price (buyers' response)", "the price of another good", "income", "the good's own price (sellers' response)"][k]}.`),
          });
        },
      },
      {
        name: "Read a signed number in context",
        make() {
          const it = U.pick(READ_BANK);
          return Q.mc({
            q: `${it.q} What does it tell you?`,
            right: it.right, wrong: it.wrong,
            sol: steps("First identify which elasticity it is: what is the cause, and whose quantity responded?",
              "Then read it with that elasticity's rules: own-price demand by absolute value; cross-price by sign; income by sign and size; supply by size."),
          });
        },
      },
      {
        name: "Select all true statements across elasticities",
        make() {
          const opts = dealMulti("m4-mixtf", TF_MIX, 5);
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Recall the reading rule for each elasticity: |E<sub>p</sub>| vs 1; E<sub>xy</sub> by sign; E<sub>i</sub> by sign and size; E<sub>s</sub> ≥ 0.",
              "Vertical curves have elasticity 0, horizontal curves ∞."),
          });
        },
      },
      {
        name: "Which is NOT correctly matched?",
        make() {
          const PAIRS_OK = [
            "Cross-price elasticity of +1.2 → substitutes",
            "Cross-price elasticity of −0.7 → complements",
            "Income elasticity of 1.8 → luxury",
            "Income elasticity of 0.3 → necessity",
            "Income elasticity of −0.4 → inferior good",
            "|E<sub>p</sub>| = 2.1 → elastic demand",
            "|E<sub>p</sub>| = 0.35 → inelastic demand",
            "E<sub>s</sub> = 0 → vertical supply curve",
          ];
          const PAIRS_BAD = [
            { t: "Cross-price elasticity of −1.5 → substitutes", why: "Negative means complements." },
            { t: "Income elasticity of 0.6 → inferior good", why: "Positive means normal (a necessity)." },
            { t: "Income elasticity of 0.5 → luxury", why: "Between 0 and 1 is a necessity." },
            { t: "|E<sub>p</sub>| = 0.8 → elastic demand", why: "0.8 &lt; 1: inelastic." },
            { t: "E<sub>s</sub> = ∞ → vertical supply curve", why: "Infinite elasticity is a horizontal curve." },
            { t: "E<sub>p</sub> = −2.4 → inelastic demand, because it is negative", why: "Use the absolute value: 2.4 &gt; 1, elastic." },
          ];
          const bad = U.pick(PAIRS_BAD);
          return Q.mc({
            q: "Which pairing is <b>not</b> correct?",
            right: bad.t, rightWhy: bad.why,
            wrong: U.sample(PAIRS_OK, 3).map(t => ({ t, why: "This pairing is correct." })),
            sol: steps("Check each number with the right rule for its elasticity.",
              `${bad.t.replace(" →", ":")} — wrong. ${bad.why}`),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m4", order: 4,
    title: "Module 4 · Markets: Elasticity",
    short: "M4 · Elasticity",
    description: "Price elasticity of demand with the midpoint formula, elastic vs inelastic demand and total revenue, its determinants, and cross-price, income and supply elasticities.",
    notes, flashcards, cues,
    generators: [genPedCalc, genPedClass, genTR, genDet, genCross, genIncome, genSupply, genMixed],
  });
})();
