/* ============================================================
 * ECON B251 · Module 9 — Firms and Industries: Basic Structures,
 * Production and Costs
 * The firm's goal, accounting vs economic profit, command and
 * incentive systems, information problems, business organizations,
 * the four market types and concentration measures, short run vs
 * long run, total/average/marginal product and diminishing returns,
 * short-run cost curves, the MC–MP link, and long-run average cost
 * with economies and diseconomies of scale.
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
  const an = s => (/^[aeiou]/i.test(s) ? "an " : "a ") + s;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const cum = arr => arr.reduce((a, x) => (a.push((a[a.length - 1] || 0) + x), a), []);
  const ord = k => k + ((k % 100 >= 11 && k % 100 <= 13) ? "th" : k % 10 === 1 ? "st" : k % 10 === 2 ? "nd" : k % 10 === 3 ? "rd" : "th");
  /* Dollars: whole numbers plain, anything else to the cent. */
  const m = x => { const r = U.round(x, 2); return U.money(r, Number.isInteger(r) ? 0 : 2); };
  /* A plain number to at most two decimals. */
  const n2 = x => U.fmt(U.round(x, 2));
  const isInt = x => Math.abs(x - Math.round(x)) < 1e-9;
  const near = (a, b) => Math.abs(a - b) < 1e-6;

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
  /* Evenly spaced "nice" ticks up to max. */
  function ticks(max, n) {
    const raw = max / (n || 4);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const k = [1, 2, 2.5, 5, 10].find(v => v * p >= raw) * p;
    const out = [];
    for (let t = k; t <= max + 1e-9; t += k) out.push(U.round(t, 6));
    return out;
  }
  const niceMax = (v, n) => { const t = ticks(v * 1.08, n || 5); return t[t.length - 1] >= v * 1.04 ? t[t.length - 1] : t[t.length - 1] + (t[1] - t[0]); };
  const range = (a, b, dx) => { const out = []; for (let x = a; x <= b + 1e-9; x += dx) out.push(U.round(x, 6)); return out; };

  /* Small businesses with a product and a type of worker. */
  const FIRMS = [
    { n: "Juniper Lane Bakery", s: "tray of pastries", p: "trays of pastries", w: "baker" },
    { n: "Ridgeback Bike Repair", s: "bike tune-up", p: "bike tune-ups", w: "mechanic" },
    { n: "Tidewater Canoe Works", s: "canoe", p: "canoes", w: "boat builder" },
    { n: "Copper Kettle Roasters", s: "bag of coffee beans", p: "bags of coffee beans", w: "roaster" },
    { n: "Lumen Print Shop", s: "poster", p: "posters", w: "press operator" },
    { n: "Greenhollow Farm", s: "crate of tomatoes", p: "crates of tomatoes", w: "picker" },
    { n: "Northgate Tees", s: "printed shirt", p: "printed shirts", w: "screen printer" },
    { n: "Alder Creek Furniture", s: "dining chair", p: "dining chairs", w: "woodworker" },
    { n: "Brightside Candle Co.", s: "box of candles", p: "boxes of candles", w: "candle maker" },
    { n: "Harbor Light Brewing", s: "keg", p: "kegs", w: "brewer" },
    { n: "Summit Ski Service", s: "ski tune", p: "ski tunes", w: "technician" },
    { n: "Maple Row Soapworks", s: "case of soap", p: "cases of soap", w: "soap maker" },
    { n: "Blue Heron Pottery", s: "mug", p: "mugs", w: "potter" },
    { n: "Riverbend Pizza", s: "pizza", p: "pizzas", w: "cook" },
  ];
  const OWNERS = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix"];
  const firm = () => U.pick(FIRMS);
  const ws = f => f.w + "s";
  const units = (k, f) => `${U.fmt(k)} ${k === 1 ? f.s : f.p}`;

  /* ---------------- short-run production data ----------------
   * Workers 0..n with marginal product rising to a peak (worker 2 or 3)
   * and then strictly falling; optionally the last worker's MP is negative. */
  function prodData(opts) {
    const o = opts || {};
    const n = o.n || 6;
    for (let g = 0; g < 400; g++) {
      const scale = U.pick([1, 1, 2, 5]);
      const peak = o.peak || U.pick([2, 3]);
      const mp = [U.randInt(3, 9)];
      for (let i = 2; i <= peak; i++) mp.push(mp[mp.length - 1] + U.randInt(2, 6));
      for (let i = peak + 1; i <= n; i++) mp.push(mp[mp.length - 1] - U.randInt(2, 5));
      if (o.neg) mp[n - 1] = -U.randInt(1, 3);
      if (mp.slice(0, o.neg ? n - 1 : n).some(x => x < 1)) continue;
      if (o.neg && mp[n - 2] <= 0) continue;
      const MP = mp.map(x => x * scale);
      const TP = [0].concat(cum(MP));
      const AP = TP.map((t, L) => (L ? t / L : null));
      let apMax = 1;
      for (let L = 2; L <= n; L++) if (AP[L] > AP[apMax] + 1e-9) apMax = L;
      return { n, MP, TP, AP, peak, dimStart: peak + 1, apMax, f: firm() };
    }
    throw new Error("prodData failed");
  }

  /* ---------------- short-run cost data ----------------
   * Output 0..6. MC falls to a minimum (unit 2 or 3) and then rises at an
   * increasing pace, which gives U-shaped AVC and ATC. `ok` filters draws. */
  function costData(ok) {
    for (let g = 0; g < 600; g++) {
      const s = U.pick([1, 1, 2, 5]);
      const minAt = U.pick([2, 3]);
      const mc = [U.randInt(10, 18)];
      for (let q = 2; q <= 6; q++) {
        const prev = mc[mc.length - 1];
        mc.push(q <= minAt ? prev - U.randInt(2, 4) : prev + U.randInt(2, 4) + (q - minAt) * U.randInt(1, 3));
      }
      if (mc.some(x => x < 3)) continue;
      const MC = [null].concat(mc.map(x => x * s));
      const TFC = U.pick([24, 30, 36, 40, 48, 60, 72, 90]) * s;
      const TVC = [0].concat(cum(MC.slice(1)));
      const TC = TVC.map(v => v + TFC);
      const AFC = TC.map((_, q) => (q ? TFC / q : null));
      const AVC = TVC.map((v, q) => (q ? v / q : null));
      const ATC = TC.map((v, q) => (q ? v / q : null));
      const d = { s, minAt, MC, TFC, TVC, TC, AFC, AVC, ATC, f: firm() };
      if (!ok || ok(d)) return d;
    }
    throw new Error("costData failed");
  }
  /* Output level (1..6) where a column is lowest, or null if the minimum is tied. */
  function argmin(col) {
    let best = 1;
    for (let q = 2; q < col.length; q++) if (col[q] < col[best] - 1e-9) best = q;
    const ties = col.filter((v, q) => q && Math.abs(v - col[best]) < 1e-9).length;
    return ties > 1 ? null : best;
  }
  /* A cost table with chosen columns; `hide` is a list of [column, q] cells shown as "?". */
  const COLS = {
    Q: { h: "Output (Q)", v: (d, q) => U.fmt(q) },
    TFC: { h: "TFC", v: (d, q) => m(d.TFC) },
    TVC: { h: "TVC", v: (d, q) => m(d.TVC[q]) },
    TC: { h: "TC", v: (d, q) => m(d.TC[q]) },
    AFC: { h: "AFC", v: (d, q) => (q ? m(d.AFC[q]) : "—") },
    AVC: { h: "AVC", v: (d, q) => (q ? m(d.AVC[q]) : "—") },
    ATC: { h: "ATC", v: (d, q) => (q ? m(d.ATC[q]) : "—") },
    MC: { h: "MC", v: (d, q) => (q ? m(d.MC[q]) : "—") },
  };
  function costTbl(d, cols, hide, maxQ) {
    const top = maxQ == null ? 6 : maxQ;
    const hidden = (c, q) => (hide || []).some(h => h[0] === c && h[1] === q);
    const rows = [];
    for (let q = 0; q <= top; q++) rows.push(cols.map(c => (hidden(c, q) ? "<b>?</b>" : COLS[c].v(d, q))));
    return tbl(cols.map(c => COLS[c].h), rows);
  }
  function prodTbl(p, cols, hide, maxL) {
    const top = maxL == null ? p.n : maxL;
    const H = { L: "Workers (L)", TP: "Total product (TP)", MP: "Marginal product (MP)", AP: "Average product (AP)" };
    const V = { L: L => U.fmt(L), TP: L => U.fmt(p.TP[L]), MP: L => (L ? U.fmt(p.MP[L - 1]) : "—"), AP: L => (L ? n2(p.AP[L]) : "—") };
    const hidden = (c, L) => (hide || []).some(h => h[0] === c && h[1] === L);
    const rows = [];
    for (let L = 0; L <= top; L++) rows.push(cols.map(c => (hidden(c, L) ? "<b>?</b>" : V[c](L))));
    return tbl(cols.map(c => H[c]), rows);
  }

  /* ---------------- smooth curves for graphs ---------------- */
  /* Production: TP = c(3hL² − L³). MP peaks at L = h, AP peaks at 1.5h, TP peaks at 2h. */
  function prodCurves(h, k) {
    const c = 16 * k / (h * h);
    const TP = L => c * (3 * h * L * L - L * L * L);
    const MP = L => c * (6 * h * L - 3 * L * L);
    const AP = L => c * (3 * h * L - L * L);
    const xs = range(0, 2 * h, h / 20);
    return { h, k, TP, MP, AP, xs, tpMax: 64 * k * h, mpMax: 48 * k, apMax: 36 * k };
  }
  function prodGraphs(pc, opts) {
    const o = opts || {};
    const xMax = 2.2 * pc.h;
    const xT = range(pc.h / 2, 2 * pc.h, pc.h / 2);
    const tpG = G.plot({
      xLabel: "Workers (L)", yLabel: "Output per day", xMax, yMax: niceMax(pc.tpMax), xTicks: xT, yTicks: ticks(niceMax(pc.tpMax), 4),
      curves: [{ pts: pc.xs.map(L => [L, pc.TP(L)]), style: "main", label: "TP", labelAt: 30 }],
      points: o.tpPoints || [], aria: "Total product curve",
    });
    const top = niceMax(pc.mpMax);
    const mpG = G.plot({
      xLabel: "Workers (L)", yLabel: "Output per worker", xMax, yMax: top, xTicks: xT, yTicks: ticks(top, 4),
      curves: [{ pts: pc.xs.map(L => [L, Math.max(0, pc.MP(L))]), style: "alt", label: "MP", labelAt: 14 },
        { pts: pc.xs.slice(1).map(L => [L, pc.AP(L)]), style: "dash", label: "AP", labelAt: 34 }],
      points: o.mpPoints || [], aria: "Marginal and average product curves",
    });
    return tpG + mpG;
  }
  /* Short-run cost curves: AVC = v0 + k(q − qm)², TFC = F. */
  function costCurves(v0, k, qm, F) {
    const AVC = q => v0 + k * (q - qm) * (q - qm);
    const MC = q => v0 + k * (q - qm) * (q - qm) + 2 * k * q * (q - qm);
    const AFC = q => F / q;
    const ATC = q => AVC(q) + AFC(q);
    return { AVC, MC, AFC, ATC, v0, k, qm, F };
  }
  function clipPts(fn, a, b, dx, yMax) {
    return range(a, b, dx).map(x => [x, fn(x)]).filter(p => p[1] <= yMax && p[1] >= 0);
  }

  /* ---------------- long-run average cost graph ---------------- */
  /* LRAC falls to qa, is flat to qb, rises after. */
  function lracFn(qa, qb, low, hi, xMax) {
    return q => (q < qa ? low + (hi - low) * Math.pow((qa - q) / qa, 2)
      : q <= qb ? low : low + (hi - low) * Math.pow((q - qb) / (xMax - qb), 2));
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const lessonProd = prodCurves(4, 1);
  const lessonCost = costCurves(10, 0.25, 6, 48);
  const LR = q => 4 + 0.0016 * (q - 55) * (q - 55);
  const LRd = q => 0.0032 * (q - 55);
  const srac = qi => range(Math.max(2, qi - 24), Math.min(100, qi + 24), 1).map(q => [q, LR(qi) + LRd(qi) * (q - qi) + 0.006 * (q - qi) * (q - qi)]).filter(p => p[1] <= 10);

  const notes = [
    {
      title: "The firm's goal: accounting profit vs economic profit",
      lo: "Identify the firm's goal and determine and differentiate between accounting and economic profit.",
      html: `<p>A <b>firm</b> is an organization that hires factors of production (land, labor, capital, entrepreneurship) and arranges them to produce and sell goods and services. Economists assume its goal is to <b>maximize profit</b>. A firm that keeps leaving profit on the table tends to disappear: rivals undercut it, or someone buys it and runs it to make more money.</p>
<p>Accountants and economists both measure profit as revenue minus cost, but they count cost differently.</p>
<ul>
  <li><b>Explicit costs</b> are paid out in money: wages, rent, materials, utilities, interest on loans.</li>
  <li><b>Implicit costs</b> are opportunity costs that involve no payment. They arise when the firm uses resources it already owns:
    <ul>
      <li>its <b>own capital</b>. That brings <b>economic depreciation</b> (the fall in the capital's market value over the period) and <b>interest forgone</b> (what the money tied up in the capital could have earned elsewhere);</li>
      <li>the <b>owner's time and money</b>. That means the salary the owner gives up by not working in their best other job, and <b>normal profit</b>: the return an entrepreneur can expect on average, which is the price of keeping their entrepreneurial ability in this business.</li>
    </ul></li>
</ul>
<p>In this course, <b>accounting profit = total revenue − explicit costs</b>. An economist subtracts every opportunity cost: <b>economic profit = TR − TC</b>, where TC = explicit + implicit costs. Normal profit is part of TC, so economic profit is the profit <em>over and above</em> normal profit.</p>
<div class="example"><b>Example.</b> Wren runs a glass-blowing studio. This year it took in <b>$180,000</b>. She paid $30,000 rent, $22,000 for glass and gas, and $41,000 to an assistant: $93,000 of explicit costs, so accounting profit is <b>$87,000</b>. Now the implicit costs. She gave up a $58,000 job as a lab technician. Her own $50,000 of savings, sunk into the furnace, could have earned 4% ($2,000). The furnace lost $6,000 of market value. Normal profit for someone running a shop like hers is about $9,000. Implicit costs total $75,000, so economic profit = 180,000 − 93,000 − 75,000 = <b>$12,000</b>. She is doing better than her best alternative, but by far less than her accountant's number suggests.</div>
<p>To chase profit, a firm decides <b>what</b> to produce and how much, <b>how</b> to produce it, how to <b>organize and pay</b> its managers and workers, how to <b>market and price</b> its products, and what to <b>make itself versus buy</b> from other firms. Three things limit what it can earn: <b>technology</b> constraints (what output the available methods can get from given inputs), <b>information</b> constraints (it never knows everything about its workers, customers or rivals) and <b>market</b> constraints (what buyers will pay, what rivals do, and what inputs cost).</p>
<div class="keyidea"><b>Key idea.</b> Economic profit = TR − (explicit + implicit costs). Zero economic profit is not failure: it means the owner is earning exactly normal profit, as much as her resources could earn anywhere else.</div>
<div class="trap"><b>Common trap.</b> Forgetting implicit costs because no check was written. The owner's lost salary and the interest her own money could have earned are real costs of staying in business, so a healthy-looking accounting profit can hide a negative economic profit.</div>`,
      gens: ["b251-m9-profit"],
    },
    {
      title: "Organizing production: systems, information and business types",
      lo: "Distinguish between the two systems of organizing production, explain the types of information, and differentiate between proprietorships, partnerships and corporations.",
      html: `<p>Firms coordinate people with a mix of two systems:</p>
<ul>
  <li>A <b>command system</b> is a managerial hierarchy. Orders flow down the chain; reports and feedback flow up. It works best when effort is <b>easy to monitor</b>: a manager can see whether the job got done.</li>
  <li>An <b>incentive system</b> uses market-like rewards (commissions, bonuses, piece rates, profit shares) to get people to act in the firm's interest. It works best when effort is <b>hard to monitor</b>.</li>
</ul>
<p><b>The economics of information</b> studies how decisions depend on what people know. Information is valuable. It can be <b>perfect</b> (everything relevant is known) or <b>imperfect</b>, and <b>symmetric</b> (everyone knows the same things) or <b>asymmetric</b> (one side knows more). Asymmetric information causes two classic problems:</p>
<ul>
  <li><b>Adverse selection</b>: one side of a deal has <em>hidden information</em> about quality or risk before the deal is made. Example: people who expect large medical bills are the most eager to buy health insurance.</li>
  <li><b>Moral hazard</b>: after a deal, someone whose <em>actions</em> are hidden takes more risk or less care because they do not bear the full cost. Example: a renter drives a rental car harder than her own.</li>
</ul>
<p>The <b>principal–agent problem</b> is a moral-hazard problem inside firms: how to design pay rules so that an <b>agent</b> acts in the interest of the <b>principal</b>. Stockholders (principals) want managers (agents) to maximize the firm's value; managers may prefer a big office and an easy life. Firms cope with it through <b>ownership</b> (give agents shares), <b>incentive pay</b> (tie pay to performance) and <b>long-term contracts</b> (reward results over many years).</p>
<table class="data-tbl"><thead><tr><th>Type</th><th>Owners</th><th>Main advantages</th><th>Main disadvantages</th></tr></thead><tbody>
<tr><td><b>Proprietorship</b><br><small>most numerous</small></td><td>One</td><td>Owner answers to no one and keeps all the profit; profit taxed once, as the owner's income</td><td><b>Unlimited liability</b>: the owner's whole personal wealth can be taken to pay business debts</td></tr>
<tr><td><b>Partnership</b></td><td>Two or more</td><td>Shared, specialized management; partners pool their money for a bigger business</td><td>Unlimited liability (each partner can be made to cover another's share); partners must agree on management and profit split; the firm usually ends when a partner leaves or dies</td></tr>
<tr><td><b>Corporation</b><br><small>largest share of revenue</small></td><td>Stockholders</td><td><b>Limited liability</b>: owners can lose only what they invested</td><td><b>Double taxation</b>: profit is taxed as corporate income and again when paid out to stockholders</td></tr>
</tbody></table>
<p>Two hybrids mix the features. An <b>S corporation</b> passes all its profit straight through to its owners, who pay tax on it as personal income (no double tax). A <b>limited liability company (LLC)</b> also avoids double taxation and gives its owners the limited liability of a corporation.</p>
<div class="example"><b>Example.</b> Dana's food truck is a proprietorship. When a lawsuit leaves the business owing $70,000 more than it owns, the court can take Dana's savings and car. If the truck had been a corporation and Dana had put $15,000 into its stock, the most she could lose would be that $15,000.</div>
<div class="keyidea"><b>Key idea.</b> Easy to watch → command; hard to watch → incentives. Hidden information before a deal → adverse selection; hidden action after it → moral hazard.</div>
<div class="trap"><b>Common trap.</b> Mixing up the two information problems. Ask <em>when</em> the hidden thing matters: a buyer's hidden risk <em>before</em> signing is adverse selection; careless behavior <em>after</em> signing is moral hazard.</div>`,
      gens: ["b251-m9-org"],
    },
    {
      title: "The four market types",
      lo: "Identify and differentiate between the four types of markets.",
      html: `<p>Economists sort industries into four market types by the <b>number of firms</b>, how similar their <b>products</b> are, and how easy it is for new firms to <b>enter</b>.</p>
<table class="data-tbl"><thead><tr><th></th><th>Perfect competition</th><th>Monopolistic competition</th><th>Oligopoly</th><th>Monopoly</th></tr></thead><tbody>
<tr><td><b>Firms</b></td><td>Many</td><td>Many</td><td>A few</td><td>One</td></tr>
<tr><td><b>Product</b></td><td>Identical</td><td>Differentiated (similar but not the same)</td><td>Identical or differentiated</td><td>No close substitutes</td></tr>
<tr><td><b>Entry</b></td><td>Free</td><td>Free</td><td>Barriers</td><td>Barriers</td></tr>
<tr><td><b>Pricing power</b></td><td>None: every firm takes the market price</td><td>Some, thanks to differentiation</td><td>Considerable; each firm watches its rivals</td><td>Greatest</td></tr>
</tbody></table>
<p>Perfect competition also assumes that buyers and sellers are well informed about all firms' prices and products.</p>
<p><b>Measuring concentration.</b> Two numbers summarize how much of a market the biggest firms control:</p>
<ul>
  <li>The <b>four-firm concentration ratio</b>: the percentage of industry sales made by the four largest firms.</li>
  <li>The <b>Herfindahl–Hirschman Index (HHI)</b>: square each firm's market share (in percent) and add them up, over the largest 50 firms. A pure monopoly scores 100² = 10,000.</li>
</ul>
<p>The higher either measure, the less competition. Rough HHI guide: below 100, highly competitive; 100 to 1,500, moderately competitive; 1,500 to 2,500, moderately concentrated; above 2,500, highly concentrated.</p>
<div class="example"><b>Example.</b> A regional cement market has five firms with shares 35%, 25%, 20%, 12% and 8%. The four-firm ratio is 35 + 25 + 20 + 12 = <b>92%</b>. The HHI is 35² + 25² + 20² + 12² + 8² = 1,225 + 625 + 400 + 144 + 64 = <b>2,458</b>: moderately concentrated, close to the high band. A few firms, a nearly identical product and costly plants that deter entry point to an <b>oligopoly</b>.</div>
<div class="keyidea"><b>Key idea.</b> Many firms + identical product = perfect competition; many firms + differentiated product = monopolistic competition; few firms + entry barriers = oligopoly; one firm + no close substitutes = monopoly.</div>
<div class="trap"><b>Common trap.</b> "Lots of firms" does not settle it. Hundreds of hair salons still form <em>monopolistic</em> competition, because each offers a slightly different service (location, stylist, style). Perfect competition needs products buyers see as identical, such as one farm's wheat versus another's.</div>`,
      gens: ["b251-m9-markets"],
    },
    {
      title: "Short run versus long run",
      lo: "Differentiate between short run and long run.",
      html: `<p>The firm's decisions fall into two planning horizons. They are defined by <b>what can be changed</b>, not by a number of months.</p>
<ul>
  <li><b>Short run</b>: at least one input is fixed. Usually that is the <b>plant size</b> (the factories, buildings and big machines, i.e. capital). The firm changes output by changing variable inputs such as labor, materials and energy. These decisions are easy to reverse.</li>
  <li><b>Long run</b>: <b>all</b> inputs can be varied, plant size included. Long-run decisions (build a second factory, close a plant, buy a new production line) are hard or costly to undo.</li>
</ul>
<p>Because a fixed input exists only in the short run, so do <b>fixed costs</b> (costs that do not change with output, such as rent on the plant or insurance). Costs that change with output, such as wages and materials, are <b>variable costs</b>. In the long run every cost is variable.</p>
<p>A <b>sunk cost</b> has already been incurred and cannot be recovered. If a firm's plant has no resale value, what it paid for the plant is sunk. Sunk costs are <b>irrelevant</b> to decisions now: only costs and benefits that still depend on the choice matter.</p>
<div class="example"><b>Example.</b> A brewery that gets a surge of orders can add a night shift and buy more grain next week: a short-run response with its current tanks. Doubling the size of its brewhouse takes a year of planning and construction: a long-run decision. Separately, it spent $25,000 on a custom labeling machine that turned out to be the wrong size and cannot be resold. That $25,000 is sunk. Whether to buy a better machine should depend only on what the new machine costs and saves from now on.</div>
<div class="keyidea"><b>Key idea.</b> Short run = some input fixed (usually capital); long run = everything variable. The firm always <em>operates</em> in the short run; the long run is its planning horizon.</div>
<div class="trap"><b>Common trap.</b> Treating the short run as "under a year". A food cart can change everything in a weekend, while a chip maker may need five years for a new fab. What matters is whether the plant can be changed.</div>`,
      gens: ["b251-m9-runs"],
    },
    {
      title: "Short-run production: TP, MP, AP and diminishing returns",
      lo: "Explain, measure and illustrate the relationship between a firm's output and its labor input in the short run based on the law of diminishing returns.",
      html: `<p><b>Production</b> turns resources into goods and services. The <b>production function</b> links inputs to output: Q = f(K, L), output per period as a function of capital K and labor L. In the short run K is fixed, so output changes only with labor.</p>
<ul>
  <li><b>Total product (TP)</b>: the total output produced in the period.</li>
  <li><b>Marginal product (MP)</b>, also marginal physical product or marginal return: the extra output from one more worker, holding the other inputs fixed. <b>MP = ΔTP ÷ ΔL</b>.</li>
  <li><b>Average product (AP)</b>, or average physical product: output per worker. <b>AP = TP ÷ L</b>.</li>
</ul>
<p>The <b>law of diminishing (marginal) returns</b>: beyond some point, adding equal amounts of a variable input to fixed inputs adds less and less output. Early workers can specialize, so MP may rise at first. But the kitchen, the machines and the floor space do not grow, so eventually workers crowd each other, queue for equipment and add less. MP can even turn negative if they get in each other's way.</p>
<div class="example"><b>Example.</b> A taco truck (one grill, one window) hires cooks:
${tbl(["Cooks (L)", "TP (tacos/hour)", "MP", "AP"], [[0, 0, "—", "—"], [1, 12, 12, 12], [2, 30, 18, 15], [3, 45, 15, 15], [4, 56, 11, 14], [5, 62, 6, 12.4], [6, 60, -2, 10]])}
MP rises from 12 to 18 with the second cook (they split the grill and the window), then falls from the third cook on. <b>Diminishing returns begin with the 3rd cook.</b> AP peaks at 15 where MP = AP, and the 6th cook's MP is negative, so TP falls.</div>
${prodGraphs(lessonProd, { tpPoints: [{ x: 4, y: lessonProd.TP(4), label: "MP peaks" }, { x: 8, y: lessonProd.TP(8), label: "TP max" }], mpPoints: [{ x: 6, y: lessonProd.AP(6), label: "MP = AP" }] })}
<p>Read the graphs together. While MP is rising, TP gets steeper. Once MP starts falling (diminishing returns), TP keeps rising but flattens. TP peaks where MP = 0. When MP is above AP, AP rises; when MP is below AP, AP falls, so <b>MP crosses AP at AP's maximum</b>.</p>
<div class="keyidea"><b>Key idea.</b> MP is the <em>slope</em> of TP. Diminishing returns mean MP falls; they do not mean TP falls.</div>
<div class="trap"><b>Common trap.</b> Saying diminishing returns start when total product starts falling. They start much earlier, as soon as each extra worker adds <em>less than the one before</em>. TP falling means MP has gone negative.</div>`,
      gens: ["b251-m9-product"],
    },
    {
      title: "Short-run costs: total, average and marginal",
      lo: "Explain, measure and illustrate the relationship between a firm's output and its cost curves in the short run.",
      html: `<p>To make more in the short run the firm must hire more variable inputs, so its costs rise. Three families of cost:</p>
<ul>
  <li><b>Totals.</b> Total fixed cost <b>TFC</b> (does not vary with output) + total variable cost <b>TVC</b> (varies with output) = total cost <b>TC</b>.</li>
  <li><b>Averages</b> (per unit). AFC = TFC ÷ Q, AVC = TVC ÷ Q, ATC = TC ÷ Q, and <b>ATC = AFC + AVC</b>.</li>
  <li><b>Marginal cost</b>. The extra cost of one more unit: <b>MC = ΔTC ÷ ΔQ</b>. Fixed costs do not change, so ΔTC = ΔTVC.</li>
</ul>
<div class="example"><b>Example.</b> A custom bike-frame shop pays $48 a day for its workshop (TFC) and builds frames:
${tbl(["Q", "TFC", "TVC", "TC", "AFC", "AVC", "ATC", "MC"], [
  [0, "$48", "$0", "$48", "—", "—", "—", "—"],
  [1, "$48", "$30", "$78", "$48", "$30", "$78", "$30"],
  [2, "$48", "$50", "$98", "$24", "$25", "$49", "$20"],
  [3, "$48", "$66", "$114", "$16", "$22", "$38", "$16"],
  [4, "$48", "$88", "$136", "$12", "$22", "$34", "$22"],
  [5, "$48", "$120", "$168", "$9.60", "$24", "$33.60", "$32"],
  [6, "$48", "$168", "$216", "$8", "$28", "$36", "$48"]])}
At Q = 5: AVC = 120 ÷ 5 = $24, ATC = 168 ÷ 5 = $33.60, and the 5th frame's MC = 168 − 136 = $32. Notice that MC is lowest at the 3rd unit, AVC bottoms out at $22 (Q = 3–4) where the 4th unit's MC of $22 meets it, and ATC is lowest at Q = 5.</div>
${G.plot({ xLabel: "Output (Q)", yLabel: "Cost per unit ($)", xMax: 13, yMax: 40, xTicks: [2, 4, 6, 8, 10, 12], yTicks: [10, 20, 30, 40],
    curves: [{ pts: clipPts(lessonCost.MC, 0.5, 12.5, 0.25, 40), style: "main", label: "MC", labelAt: 38 },
      { pts: clipPts(lessonCost.ATC, 1.6, 12.5, 0.25, 40), style: "alt", label: "ATC", labelAt: 2 },
      { pts: clipPts(lessonCost.AVC, 0.5, 12.5, 0.25, 40), style: "dash", label: "AVC", labelAt: 1 },
      { pts: clipPts(lessonCost.AFC, 1.3, 12.5, 0.25, 40), style: "faint", label: "AFC", labelAt: 6 }],
    points: [{ x: 6, y: lessonCost.AVC(6) }, { x: 7.64, y: lessonCost.ATC(7.64) }], aria: "MC, ATC, AVC and AFC curves" })}
<p><b>Shapes and links.</b></p>
<ul>
  <li><b>AFC always falls</b>: the same fixed cost is spread over more units.</li>
  <li><b>MC</b> falls at first and then rises (the next lesson explains why).</li>
  <li><b>AVC and ATC are U-shaped.</b> When MC is below an average, it pulls the average down; when MC is above it, it pulls the average up. So <b>MC crosses AVC and ATC at their minimum points</b> (the dots).</li>
  <li>The vertical gap between ATC and AVC is AFC, so it <b>shrinks</b> as output rises. ATC's minimum lies to the right of AVC's.</li>
  <li>The curves <b>shift</b> when <b>technology</b> or <b>input prices</b> change. A higher wage raises AVC, ATC and MC; a higher rent raises only AFC and ATC.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Marginal drives average: below the average it pulls it down, above it pulls it up. That is why MC passes through the bottom of both U's.</div>
<div class="trap"><b>Common trap.</b> Computing MC as TC ÷ Q (that is ATC) or AVC as TC ÷ Q (it must use TVC). MC uses the <em>change</em> in total cost between two rows; AVC uses <em>variable</em> cost only.</div>`,
      gens: ["b251-m9-costtable", "b251-m9-curves"],
    },
    {
      title: "Marginal cost and marginal product",
      lo: "Explain and illustrate the relationship between marginal cost and marginal productivity curves.",
      html: `<p>Short-run cost curves are the production function seen through a price tag. Suppose labor is the only variable input and each worker costs a wage <b>W</b>. One more worker adds W to cost and MP units to output, so each of those units costs</p>
<p style="text-align:center"><b>MC = W ÷ MP</b> &nbsp;&nbsp;and likewise&nbsp;&nbsp; <b>AVC = W ÷ AP</b></p>
<ul>
  <li>While <b>MP rises</b>, each unit takes less labor, so <b>MC falls</b>.</li>
  <li>Once diminishing returns set in and <b>MP falls</b>, <b>MC rises</b>.</li>
  <li>Highest MP ⇔ lowest MC; highest AP ⇔ lowest AVC. The cost curves are mirror images of the product curves.</li>
</ul>
<div class="example"><b>Example.</b> A sign shop pays each worker $96 a day. The MPs of workers 1–6 are 8, 12, 16, 12, 8 and 6 signs. The MC of the signs each worker makes is 96 ÷ 8 = $12, 96 ÷ 12 = $8, 96 ÷ 16 = <b>$6</b>, then $8, $12 and $16. MC is lowest exactly where MP peaks (the 3rd worker), and rises from there on as MP falls. If the wage rose to $120, every MC would rise by 25%, but the low point would stay at the 3rd worker.</div>
${G.plot({ xLabel: "Workers (L)", yLabel: "MP (signs)", xMax: 6.6, yMax: 20, xTicks: [1, 2, 3, 4, 5, 6], yTicks: [5, 10, 15, 20], width: 380, height: 230,
    curves: [{ pts: [[1, 8], [2, 12], [3, 16], [4, 12], [5, 8], [6, 6]], style: "alt", label: "MP", labelAt: 1 }],
    points: [{ x: 3, y: 16, label: "MP max" }], aria: "Marginal product rises then falls" })}
${G.plot({ xLabel: "Worker whose output is being costed", yLabel: "MC ($ per sign)", xMax: 6.6, yMax: 20, xTicks: [1, 2, 3, 4, 5, 6], yTicks: [5, 10, 15, 20], width: 380, height: 230,
    curves: [{ pts: [[1, 12], [2, 8], [3, 6], [4, 8], [5, 12], [6, 16]], style: "main", label: "MC", labelAt: 0 }],
    points: [{ x: 3, y: 6, label: "MC min" }], aria: "Marginal cost falls then rises" })}
<div class="keyidea"><b>Key idea.</b> The rising part of the MC curve is the law of diminishing returns, expressed in dollars.</div>
<div class="trap"><b>Common trap.</b> Thinking a higher wage changes <em>where</em> MC bottoms out. A wage change rescales MC up or down, but MC is still lowest where MP is highest.</div>`,
      gens: ["b251-m9-mcmp"],
    },
    {
      title: "Long-run costs and economies of scale",
      lo: "Explain and illustrate the relationship between the firm's output and its costs in the long run.",
      html: `<p>In the long run (the <b>planning horizon</b>) every input is variable, so the firm can choose its plant size. Each possible plant has its own short-run average cost curve (SAC). For any output it plans to make, the firm picks the plant with the lowest average cost there. The <b>long-run average cost curve (LRAC)</b> traces those lowest costs: the minimum cost per unit of producing each output, given current technology and input prices. It is the lower <em>envelope</em> of the SAC curves.</p>
${G.plot({ xLabel: "Output per period", yLabel: "Average cost ($ per unit)", xMax: 100, yMax: 10, xTicks: [20, 40, 60, 80, 100], yTicks: [2, 4, 6, 8, 10],
    curves: [20, 38, 55, 72, 90].map((qi, i) => ({ pts: srac(qi), style: "faint", label: "SAC" + "₁₂₃₄₅"[i], labelAt: 0 }))
      .concat([{ pts: range(4, 100, 1).map(q => [q, LR(q)]).filter(p => p[1] <= 10), style: "main", label: "LRAC", labelAt: 88 }]),
    points: [{ x: 55, y: LR(55), label: "min LRAC" }], aria: "LRAC as the envelope of short-run average cost curves" })}
<p>Each SAC touches the LRAC at one point. Only at the bottom of the LRAC does an SAC touch it at the SAC's own minimum; to the left the touching point is on the falling part of the SAC, to the right on the rising part.</p>
<p><b>Why is the LRAC U-shaped?</b></p>
<ul>
  <li><b>Economies of scale</b>: LRAC <b>falls</b> as output rises. Causes: <b>specialization</b> of workers and machines, the <b>dimensional factor</b> (doubling a tank's or warehouse's dimensions more than doubles its capacity, while material cost rises less), and <b>improved productive equipment</b> that pays only at large volumes.</li>
  <li><b>Constant returns to scale</b>: LRAC stays <b>flat</b> as output rises.</li>
  <li><b>Diseconomies of scale</b>: LRAC <b>rises</b>. In very large firms management stops working efficiently: layers of managers multiply, and <b>coordination and communication</b> get harder.</li>
</ul>
<div class="example"><b>Example.</b> A cereal maker can build a small, medium or large plant. At 10,000 boxes a week their average costs are $2.40, $2.10 and $2.60. The medium plant is cheapest, so the LRAC at 10,000 boxes is <b>$2.10</b>. If doubling output with the right plant brings average cost down to $1.80, the firm has economies of scale over that range. If a further doubling pushes it back up to $2.00, diseconomies of scale have set in.</div>
<div class="keyidea"><b>Key idea.</b> The U of the short-run curves comes from diminishing returns (one input fixed). The U of the LRAC comes from economies and diseconomies of scale (all inputs variable).</div>
<div class="trap"><b>Common trap.</b> Explaining the LRAC's shape with diminishing returns. Diminishing returns need a fixed input, and in the long run nothing is fixed. A rising LRAC means diseconomies of scale.</div>`,
      gens: ["b251-m9-longrun"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m9-c-firm", tag: "Definition", front: "What is a <em>firm</em>, and what goal do economists assume it has?", back: "An organization that hires factors of production and organizes them to produce and sell goods and services. Its goal is to <b>maximize profit</b>." },
    { id: "b251-m9-c-explicit", tag: "Definition", front: "Explicit cost vs implicit cost?", back: "<b>Explicit</b>: paid in money (wages, rent, materials, loan interest). <b>Implicit</b>: an opportunity cost with no payment, from using resources the firm or owner already has (forgone salary, forgone interest, economic depreciation, normal profit)." },
    { id: "b251-m9-c-acct-profit", tag: "Formula", front: "Accounting profit", back: "Total revenue − <b>explicit</b> costs." },
    { id: "b251-m9-c-econ-profit", tag: "Formula", front: "Economic profit", back: "TR − TC, where TC = explicit + <b>implicit</b> costs. It equals accounting profit − implicit costs." },
    { id: "b251-m9-c-normal", tag: "Definition", front: "What is <em>normal profit</em>, and where does it go in the calculation?", back: "The return an entrepreneur can expect on average for running a business. It is an <b>implicit cost</b>, so it is inside TC. Economic profit is profit <em>above</em> normal profit." },
    { id: "b251-m9-c-zero", tag: "Why", front: "A firm earns zero economic profit. Is it failing?", back: "<b>No.</b> Its revenue covers every opportunity cost, including normal profit. The owner earns exactly what her resources could earn in their best alternative use." },
    { id: "b251-m9-c-depr", tag: "Definition", front: "Economic depreciation and interest forgone", back: "The two implicit costs of using the firm's <b>own capital</b>: the fall in the capital's <b>market value</b> over the period, and the return the funds tied up in it could have earned elsewhere." },
    { id: "b251-m9-c-calc", tag: "Calculation", front: "TR $200,000; explicit costs $120,000; owner gives up a $60,000 salary and $5,000 of interest. Accounting and economic profit?", back: "Accounting: 200,000 − 120,000 = <b>$80,000</b>. Economic: 80,000 − 65,000 = <b>$15,000</b>." },
    { id: "b251-m9-c-decisions", tag: "Principle", front: "Five decisions a profit-maximizing firm makes", back: "1) What to produce and how much; 2) how to produce (technology); 3) how to organize and pay managers and workers; 4) how to market and price; 5) what to make itself and what to buy from other firms." },
    { id: "b251-m9-c-constraints", tag: "Principle", front: "Three constraints on a firm's profit", back: "<b>Technology</b> (what output available methods allow), <b>information</b> (incomplete knowledge of workers, buyers, rivals) and <b>market</b> (what buyers will pay, what rivals do, input prices)." },
    { id: "b251-m9-c-command", tag: "Distinction", front: "Command system vs incentive system — when is each used?", back: "<b>Command</b>: a managerial hierarchy, orders down, feedback up; best when effort is <b>easy to monitor</b>. <b>Incentive</b>: market-like rewards (commissions, bonuses, piece rates); best when effort is <b>hard to monitor</b>." },
    { id: "b251-m9-c-info", tag: "Distinction", front: "Perfect vs imperfect information; symmetric vs asymmetric information", back: "<b>Perfect</b>: all relevant facts known; <b>imperfect</b>: not. <b>Symmetric</b>: everyone knows the same; <b>asymmetric</b>: one side knows more." },
    { id: "b251-m9-c-adverse", tag: "Definition", front: "Adverse selection", back: "An asymmetric-information problem where one side has <b>hidden information</b> (about quality or risk) <em>before</em> the deal. E.g. the people keenest to buy health insurance are those who expect big medical bills." },
    { id: "b251-m9-c-moral", tag: "Definition", front: "Moral hazard", back: "After a deal, someone whose <b>actions are hidden</b> takes more risk or less care because they do not bear the full cost. E.g. a fully insured driver parks carelessly." },
    { id: "b251-m9-c-pa", tag: "Definition", front: "The principal–agent problem", back: "Designing pay rules that get an <b>agent</b> to act in the <b>principal's</b> interest. E.g. stockholders (principals) and managers (agents)." },
    { id: "b251-m9-c-pa-fix", tag: "Principle", front: "Three ways to cope with the principal–agent problem", back: "<b>Ownership</b> (agents hold shares), <b>incentive pay</b> (pay tied to performance), <b>long-term contracts</b> (rewards depend on results over years)." },
    { id: "b251-m9-c-prop", tag: "Definition", front: "Proprietorship — pros and cons", back: "One owner (the most numerous type). <b>Pros</b>: answers to no one, keeps all profit, taxed once as personal income. <b>Con</b>: <b>unlimited liability</b>." },
    { id: "b251-m9-c-partner", tag: "Definition", front: "Partnership — pros and cons", back: "Two or more owners. <b>Pros</b>: specialized management, pooled money. <b>Cons</b>: unlimited liability (including for partners' shares of debt), must agree on management and profit split, usually ends when a partner leaves or dies." },
    { id: "b251-m9-c-corp", tag: "Definition", front: "Corporation — pros and cons", back: "Owned by stockholders; earns the largest share of revenue. <b>Pro</b>: <b>limited liability</b> (owners lose at most their investment). <b>Con</b>: <b>double taxation</b> of profit." },
    { id: "b251-m9-c-hybrid", tag: "Distinction", front: "S corporation vs LLC", back: "<b>S corporation</b>: profits pass straight to owners and are taxed as personal income (no double tax). <b>LLC</b>: avoids double taxation <em>and</em> gives owners limited liability." },
    { id: "b251-m9-c-markets", tag: "Distinction", front: "The four market types, in one line each", back: "<b>Perfect competition</b>: many firms, identical product, free entry. <b>Monopolistic competition</b>: many firms, differentiated product, free entry. <b>Oligopoly</b>: few firms, entry barriers. <b>Monopoly</b>: one firm, no close substitutes, entry barriers." },
    { id: "b251-m9-c-differ", tag: "Definition", front: "Product differentiation", back: "Making a product similar to but slightly different from rivals' (style, location, quality, brand). It gives a monopolistically competitive firm some market power." },
    { id: "b251-m9-c-cr4", tag: "Formula", front: "Four-firm concentration ratio", back: "The percentage of industry sales made by the <b>four largest</b> firms." },
    { id: "b251-m9-c-hhi", tag: "Formula", front: "Herfindahl–Hirschman Index (HHI)", back: "The sum of the <b>squared</b> market shares (in percent) of the largest 50 firms. Below 100: highly competitive; 100–1,500: moderately competitive; 1,500–2,500: moderately concentrated; above 2,500: highly concentrated. A monopoly scores 10,000." },
    { id: "b251-m9-c-srlr", tag: "Distinction", front: "Short run vs long run", back: "<b>Short run</b>: at least one input (usually plant size) is fixed. <b>Long run</b>: all inputs can be varied. Defined by flexibility, not by calendar time." },
    { id: "b251-m9-c-sunk", tag: "Definition", front: "Sunk cost — and how should it affect decisions?", back: "A cost already incurred that cannot be recovered (e.g. a plant with no resale value). It is <b>irrelevant</b> to current decisions." },
    { id: "b251-m9-c-tp", tag: "Definition", front: "Total product, marginal product, average product", back: "<b>TP</b>: total output in a period. <b>MP</b> = ΔTP ÷ ΔL, the extra output from one more unit of the variable input. <b>AP</b> = TP ÷ L, output per worker." },
    { id: "b251-m9-c-dmr", tag: "Principle", front: "Law of diminishing (marginal) returns", back: "Beyond some point, adding equal amounts of a variable input to <b>fixed</b> inputs adds smaller and smaller amounts of output: MP falls." },
    { id: "b251-m9-c-mpap", tag: "Principle", front: "How do MP and AP interact? Where is TP at its maximum?", back: "MP above AP → AP rises; MP below AP → AP falls, so MP crosses AP at AP's <b>maximum</b>. TP is at its maximum where <b>MP = 0</b>." },
    { id: "b251-m9-c-totals", tag: "Formula", front: "TC, TFC and TVC", back: "<b>TC = TFC + TVC</b>. TFC does not vary with output; TVC does. At Q = 0, TC = TFC." },
    { id: "b251-m9-c-averages", tag: "Formula", front: "AFC, AVC, ATC", back: "AFC = TFC ÷ Q; AVC = TVC ÷ Q; ATC = TC ÷ Q; and <b>ATC = AFC + AVC</b>." },
    { id: "b251-m9-c-mc", tag: "Formula", front: "Marginal cost", back: "MC = ΔTC ÷ ΔQ (= ΔTVC ÷ ΔQ, since fixed cost does not change). E.g. TC goes from $140 to $165 for the 5th unit → MC = <b>$25</b>." },
    { id: "b251-m9-c-cross", tag: "Principle", front: "Where does MC cross AVC and ATC, and why?", back: "At their <b>minimum points</b>. MC below an average pulls it down; MC above pulls it up. So the average bottoms out where MC equals it." },
    { id: "b251-m9-c-afc", tag: "Why", front: "Why does AFC always fall, and what happens to the gap between ATC and AVC?", back: "The same fixed cost is spread over more units. The gap ATC − AVC equals AFC, so it <b>shrinks</b> as output rises." },
    { id: "b251-m9-c-shift", tag: "Example", front: "Rent on the plant rises. Wages rise. Which cost curves shift?", back: "<b>Rent</b> (fixed): AFC and ATC shift up; AVC and MC do not. <b>Wages</b> (variable): AVC, ATC and MC shift up; AFC does not." },
    { id: "b251-m9-c-mcmp", tag: "Formula", front: "Link between MC and MP (and AVC and AP)", back: "<b>MC = W ÷ MP</b> and <b>AVC = W ÷ AP</b>, where W is the wage. MP rising ↔ MC falling; MP falling (diminishing returns) ↔ MC rising." },
    { id: "b251-m9-c-mcmp-calc", tag: "Calculation", front: "Wage $150 a day. The 4th worker adds 25 units. MC of those units?", back: "150 ÷ 25 = <b>$6</b> per unit." },
    { id: "b251-m9-c-lrac", tag: "Definition", front: "Long-run average cost curve (LRAC)", back: "The lowest cost per unit of producing each output when all inputs (including plant size) can vary, given technology and input prices. It is the envelope of the short-run average cost curves." },
    { id: "b251-m9-c-scale", tag: "Distinction", front: "Economies of scale, constant returns to scale, diseconomies of scale", back: "As output rises, LRAC <b>falls</b> (economies), stays <b>flat</b> (constant returns) or <b>rises</b> (diseconomies)." },
    { id: "b251-m9-c-scale-why", tag: "Why", front: "Causes of economies and of diseconomies of scale", back: "<b>Economies</b>: specialization, the dimensional factor, improved productive equipment. <b>Diseconomies</b>: limits to efficient management; coordination and communication get harder as the firm grows." },
    { id: "b251-m9-c-tangent", tag: "Principle", front: "Where is a short-run average cost curve tangent to the LRAC at the SAC's own minimum?", back: "Only at the <b>minimum point of the LRAC</b>. Elsewhere each SAC touches the LRAC on its falling side (left of the bottom) or rising side (right of it)." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“could have earned”, “gave up a job”, “own savings”, “own building”", think: "Implicit cost", why: "An opportunity cost with no money paid; economists subtract it, accountants do not." },
    { when: "“zero economic profit”, “just covers all costs”", think: "Normal profit", why: "Normal profit is inside TC, so the owner earns exactly her best alternative." },
    { when: "“hard to monitor”, “commission”, “bonus”, “piece rate”", think: "Incentive system", why: "Rewards replace supervision when effort cannot be watched." },
    { when: "“chain of command”, “supervisor checks”, “orders from the top”", think: "Command system", why: "A hierarchy works when effort is easy to monitor." },
    { when: "hidden quality or risk <em>before</em> the deal", think: "Adverse selection", why: "Asymmetric information leads the wrong people to sign up." },
    { when: "careless or riskier behavior <em>after</em> the deal", think: "Moral hazard / principal–agent", why: "Hidden action and someone else bears part of the cost." },
    { when: "“personal assets at risk”, “single owner”", think: "Proprietorship (unlimited liability)", why: "The owner is liable for all business debts." },
    { when: "“lose only what they invested”, “taxed twice”", think: "Corporation", why: "Limited liability, but double taxation." },
    { when: "“many sellers”, “identical product”, “price taker”", think: "Perfect competition", why: "No single firm can affect the price." },
    { when: "“many sellers”, “brand”, “style”, “slightly different”", think: "Monopolistic competition", why: "Product differentiation gives some market power." },
    { when: "“a handful of big firms”, “rivals react”, “costly to enter”", think: "Oligopoly", why: "Few firms behind entry barriers." },
    { when: "“only supplier”, “no close substitutes”", think: "Monopoly", why: "One firm protected by entry barriers." },
    { when: "“can't change the plant”, “for now”, “add a shift”", think: "Short run", why: "At least one input is fixed." },
    { when: "“already spent”, “non-refundable”, “no resale value”", think: "Sunk cost — ignore it", why: "It cannot be recovered whatever the firm decides." },
    { when: "“each extra worker adds less”", think: "Diminishing marginal returns", why: "Variable input added to fixed inputs; MP falls." },
    { when: "“extra cost of one more unit”, “change in TC”", think: "MC = ΔTC ÷ ΔQ", why: "Use the change between rows, not TC ÷ Q." },
    { when: "“wage ÷ output of the next worker”", think: "MC = W ÷ MP", why: "MP rising → MC falling; MP falling → MC rising." },
    { when: "“all inputs variable”, “bigger plant”, “cost per unit falls with size”", think: "LRAC / economies of scale", why: "Long-run average cost depends on scale, not diminishing returns." },
  ];

  /*__GENERATORS__*/
})();
