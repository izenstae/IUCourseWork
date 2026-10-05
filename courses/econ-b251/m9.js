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
  const HE = new Set(["Mateo", "Tobias", "Darnell", "Kenji", "Nils", "Idris", "Callum", "Omar", "Andre", "Felix"]);
  /* Pronouns for an owner's name. */
  const pr = n => (HE.has(n) ? { she: "he", She: "He", her: "his", obj: "him" } : { she: "she", She: "She", her: "her", obj: "her" });
  const poss = name => (/s$/.test(name) ? name + "'" : name + "'s");
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
    const xMax = 2.45 * pc.h;
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
        { pts: pc.xs.slice(1).map(L => [L, pc.AP(L)]), style: "dash", label: "AP", labelAt: 38 }],
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
      { pts: clipPts(lessonCost.AVC, 0.5, 12.5, 0.25, 40), style: "dash", label: "AVC", labelAt: 44 },
      { pts: clipPts(lessonCost.AFC, 1.3, 12.5, 0.25, 40), style: "faint", label: "AFC", labelAt: 40 }],
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

  /* ============================================================
   * PRACTICE 1 — Accounting vs economic profit
   * ============================================================ */
  const BIZ = [
    { what: "a dog-grooming salon", job: "veterinary technician" },
    { what: "a bike shop", job: "high-school teacher" },
    { what: "a food truck", job: "restaurant manager" },
    { what: "a landscaping business", job: "parks supervisor" },
    { what: "a tutoring center", job: "school counselor" },
    { what: "a tattoo studio", job: "graphic designer" },
    { what: "a yoga studio", job: "physical therapy aide" },
    { what: "a used-book store", job: "librarian" },
    { what: "a small brewery", job: "chemical engineer" },
    { what: "a photography studio", job: "marketing coordinator" },
    { what: "a bakery", job: "hotel pastry chef" },
    { what: "a phone-repair kiosk", job: "IT technician" },
  ];
  /* A small business with explicit and implicit costs. econSign: 1, -1 or 0 (either). */
  function profitCase(econSign) {
    const who = U.pick(OWNERS), b = U.pick(BIZ);
    const k = 1000;
    const ex = [
      { t: "Rent on the shop", v: U.randInt(12, 36) * k },
      { t: "Supplies and materials", v: U.randInt(10, 40) * k },
      { t: "Wages paid to employees", v: U.randInt(20, 60) * k },
      { t: "Utilities and insurance", v: U.randInt(3, 9) * k },
    ];
    const salary = U.randInt(35, 70) * k;
    const savings = U.pick([20, 30, 40, 50, 60, 80, 100]) * k, r = U.pick([3, 4, 5, 6]);
    const interest = savings * r / 100;
    const depr = U.randInt(2, 8) * k;
    const normal = U.randInt(4, 12) * k;
    const im = [
      { t: `Salary ${who} gave up by leaving a job as ${an(b.job)}`, v: salary, key: "salary" },
      { t: `Interest ${poss(who)} ${m(savings)} of savings, now tied up in the business, could have earned (${r}% a year)`, v: interest, key: "interest" },
      { t: "Fall in the market value of the business's equipment (economic depreciation)", v: depr, key: "depr" },
      { t: "Normal profit for running a business like this", v: normal, key: "normal" },
    ];
    const explicit = sum(ex.map(e => e.v)), implicit = sum(im.map(e => e.v));
    let econ;
    do { econ = U.randInt(-25, 30) * k; } while (econ === 0 || (econSign > 0 && econ < 0) || (econSign < 0 && econ > 0));
    const TR = explicit + implicit + econ;
    return { who, P: pr(who), b, ex, im, explicit, implicit, econ, TR, acct: TR - explicit, salary, savings, r, interest, depr, normal };
  }
  function caseTable(c, withTR) {
    const rows = U.shuffle(c.ex.concat(c.im)).map(e => [e.t, m(e.v)]);
    if (withTR) rows.unshift(["<b>Total revenue</b>", `<b>${m(c.TR)}</b>`]);
    return tbl(["Item (this year)", "Amount"], rows);
  }
  const EXIM_BANK = [
    { t: "Wages paid to a part-time cashier", cat: "Explicit", why: "Money is paid out, so it is explicit." },
    { t: "Monthly rent paid to the landlord", cat: "Explicit", why: "A money payment, so explicit." },
    { t: "Interest paid to the bank on a business loan", cat: "Explicit", why: "Interest actually paid to a lender is explicit." },
    { t: "The electricity bill", cat: "Explicit", why: "Paid in money, so explicit." },
    { t: "Flour and sugar bought for the bakery", cat: "Explicit", why: "Purchased inputs are paid for in money." },
    { t: "Premiums paid for liability insurance", cat: "Explicit", why: "A money payment, so explicit." },
    { t: "A fee paid to an outside accountant", cat: "Explicit", why: "Paid in money, so explicit." },
    { t: "Advertising bought on a local radio station", cat: "Explicit", why: "Paid in money, so explicit." },
    { t: "Gas for the delivery van", cat: "Explicit", why: "Bought with money, so explicit." },
    { t: "Salary paid to a hired manager", cat: "Explicit", why: "Wages paid to someone else are explicit." },
    { t: "The salary the owner gave up by quitting her engineering job", cat: "Implicit", why: "No money changes hands; it is the value of the owner's time in its best other use." },
    { t: "Interest the owner's savings would have earned if not put into the firm", cat: "Implicit", why: "Interest forgone on the owner's own funds is an opportunity cost, not a payment." },
    { t: "Rent the owner could get by leasing out the building she owns and uses", cat: "Implicit", why: "Using her own building means giving up rent she could have collected: an implicit cost." },
    { t: "The fall in the market value of the firm's own delivery truck this year", cat: "Implicit", why: "That is economic depreciation of capital the firm owns: no payment, but a real cost." },
    { t: "Normal profit: what the owner's entrepreneurial ability would earn on average elsewhere", cat: "Implicit", why: "Normal profit is the opportunity cost of the owner's entrepreneurship." },
    { t: "Wages the owner could earn driving for a delivery service on weekends instead", cat: "Implicit", why: "The value of the owner's time in another use is an implicit cost." },
    { t: "Income lost by keeping the firm's own warehouse rather than selling it and investing the proceeds", cat: "Implicit", why: "Forgone return on the firm's own capital is implicit." },
    { t: "The owner's unpaid hours doing the bookkeeping", cat: "Implicit", why: "Unpaid owner time has an opportunity cost but no payment." },
  ];
  const CONSTRAINT_BANK = [
    { t: "With its single oven, a bakery can bake at most 300 loaves a day, however many bakers it hires.", cat: "Technology", why: "The production methods and equipment available limit output: a technology constraint." },
    { t: "The fastest known way to weld a bike frame takes two hours.", cat: "Technology", why: "The best available method sets a limit: technology." },
    { t: "A farm's yield per acre is capped by the seed varieties that exist today.", cat: "Technology", why: "Available know-how limits output from given inputs." },
    { t: "A print shop's presses can print only four colors at once.", cat: "Technology", why: "The equipment's capability is a technology constraint." },
    { t: "A manager cannot tell which of her traveling sales reps actually work hard.", cat: "Information", why: "The firm lacks information about effort." },
    { t: "A firm does not know how its rivals will react if it cuts its price.", cat: "Information", why: "Missing knowledge about rivals is an information constraint." },
    { t: "A hotel cannot be sure how many guests will book rooms next summer.", cat: "Information", why: "Uncertainty about future buyers is an information constraint." },
    { t: "Before hiring, a firm cannot see whether an applicant is careful or sloppy.", cat: "Information", why: "Hidden traits of workers limit the firm: information." },
    { t: "If a café raises its price, many customers walk to the café next door.", cat: "Market", why: "What buyers will pay and what rivals offer are market constraints." },
    { t: "A sawmill has to pay the going market price for logs.", cat: "Market", why: "Input prices set by the market are a market constraint." },
    { t: "Customers will not pay more than $25 for the firm's T-shirts.", cat: "Market", why: "Buyers' willingness to pay is a market constraint." },
    { t: "A rival opens a store across the street and takes some of the firm's sales.", cat: "Market", why: "Competitors' actions are a market constraint." },
  ];

  const genProfit = STUDY.makeGenerator({
    id: "b251-m9-profit",
    name: "Accounting vs economic profit",
    blurb: "Separate explicit from implicit costs, compute accounting and economic profit, and interpret normal profit.",
    variants: [
      {
        name: "Economic profit from a cost list",
        make() {
          const c = profitCase(0);
          const forgotNormal = c.econ + c.normal;
          return Q.num({
            q: `${c.who} runs ${c.b.what}. Here is the year's information:${caseTable(c, true)}What is ${poss(c.who)} <b>economic profit</b>? (Enter a loss as a negative number.)`,
            answer: c.econ, unit: "$",
            traps: traps(c.econ, [
              { value: c.acct, why: "That is accounting profit: it subtracts only the explicit costs. Economic profit also subtracts every implicit cost." },
              { value: forgotNormal, why: "Normal profit is an implicit cost too. Subtract it as well." },
              { value: c.TR - c.implicit, why: "You subtracted only the implicit costs. Economic profit subtracts both explicit and implicit costs." },
              { value: c.acct - c.salary, why: "You subtracted the owner's forgone salary but not the other implicit costs (forgone interest, depreciation, normal profit)." },
            ]),
            sol: steps("Economic profit = total revenue − (explicit costs + implicit costs). Sort the items first: which involve a money payment, and which are opportunity costs with no payment?",
              `Explicit: ${c.ex.map(e => m(e.v)).join(" + ")} = ${m(c.explicit)}. Implicit (forgone salary, forgone interest, economic depreciation, normal profit): ${c.im.map(e => m(e.v)).join(" + ")} = ${m(c.implicit)}.`,
              `Economic profit = ${m(c.TR)} − ${m(c.explicit)} − ${m(c.implicit)} = <b>${m(c.econ)}</b>.`),
          });
        },
      },
      {
        name: "Accounting profit from a mixed list",
        make() {
          const c = profitCase(0);
          return Q.num({
            q: `${poss(c.who)} ${c.b.what.replace(/^an? /, "")} had this year:${caseTable(c, true)}What is the business's <b>accounting profit</b>?`,
            answer: c.acct, unit: "$",
            traps: traps(c.acct, [
              { value: c.econ, why: "That is economic profit. Accountants subtract only explicit (paid) costs." },
              { value: c.acct - c.depr, why: "In our rule, accounting profit = TR − explicit costs. Economic depreciation (the fall in market value) is an implicit cost." },
              { value: c.acct - c.salary, why: "The owner's forgone salary is never paid, so it is implicit. Accountants leave it out." },
              { value: c.TR - c.implicit, why: "You subtracted the implicit costs. Accounting profit subtracts the explicit ones." },
            ]),
            sol: steps("Accounting profit = total revenue − <b>explicit</b> costs (those paid in money).",
              `Explicit costs: ${c.ex.map(e => `${e.t.toLowerCase()} ${m(e.v)}`).join(", ")}. Total ${m(c.explicit)}. The other items are implicit and are ignored here.`,
              `Accounting profit = ${m(c.TR)} − ${m(c.explicit)} = <b>${m(c.acct)}</b>.`),
          });
        },
      },
      {
        name: "Explicit or implicit cost?",
        make() {
          const items = [U.pick(EXIM_BANK.filter(i => i.cat === "Explicit")), U.pick(EXIM_BANK.filter(i => i.cat === "Implicit"))];
          for (const x of U.deal("m9-exim", EXIM_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Classify each cost of running a business.",
            cats: ["Explicit", "Implicit"], items,
            sol: steps("Ask: does money actually leave the business to pay someone? If yes, the cost is <b>explicit</b>.",
              "If the cost is something given up by using resources the owner or firm already has (her time, her savings, her building, the firm's own equipment, normal profit), it is <b>implicit</b>."),
          });
        },
      },
      {
        name: "Implicit costs from the profit gap",
        make() {
          const c = profitCase(0);
          const ans = c.implicit;
          return Q.num({
            q: `${poss(c.who)} ${c.b.what.replace(/^an? /, "")} took in ${m(c.TR)} this year and paid out ${m(c.explicit)} in explicit costs. An economist calculates its economic profit as <b>${m(c.econ)}</b>. What were the business's total <b>implicit</b> costs?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: c.TR - c.econ, why: "That is total cost (explicit + implicit). Take out the explicit costs." },
              { value: c.acct + c.econ, why: "Implicit costs = accounting profit − economic profit, not their sum." },
              { value: c.acct, why: "That is accounting profit. Subtract economic profit from it." },
            ]),
            sol: steps("Accounting profit and economic profit differ by exactly the implicit costs: economic profit = accounting profit − implicit costs.",
              `Accounting profit = ${m(c.TR)} − ${m(c.explicit)} = ${m(c.acct)}.`,
              `Implicit costs = ${m(c.acct)} − (${m(c.econ)}) = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "What zero (or negative) economic profit means",
        make() {
          const who = U.pick(OWNERS), b = U.pick(BIZ);
          if (Math.random() < 0.5) {
            const acct = U.randInt(40, 90) * 1000;
            return Q.mc({
              q: `${poss(who)} ${b.what.replace(/^an? /, "")} earns an accounting profit of ${m(acct)} and an economic profit of exactly <b>$0</b>. Which statement is correct?`,
              right: `${who} is earning normal profit: revenue covers every explicit and implicit cost`,
              wrong: [
                { t: `${who} is losing money and should close the business`, why: "Zero economic profit means every opportunity cost is covered, normal profit included. Nothing better is available." },
                { t: "The business's accounting profit must also be zero", why: `Accounting profit is ${m(acct)}. It exceeds economic profit by the implicit costs.` },
                { t: `${who} could earn more by working as ${an(b.job)} instead`, why: `If that were true, economic profit would be negative. At zero, the business exactly matches ${pr(who).her} best alternative.` },
              ],
              rightWhy: `Normal profit is part of total cost, so zero economic profit means ${who} earns exactly what ${pr(who).her} resources could earn elsewhere.`,
              sol: steps("Remember that economists count normal profit as a cost.",
                `Economic profit of $0 means total revenue = explicit + implicit costs. The implicit costs here add up to ${m(acct)}, and ${who} is earning exactly ${pr(who).her} normal return.`),
            });
          }
          const acct = U.randInt(30, 70) * 1000, econ = -U.randInt(5, 25) * 1000;
          return Q.mc({
            q: `${poss(who)} ${b.what.replace(/^an? /, "")} shows an accounting profit of ${m(acct)}, but its economic profit is <b>${m(econ)}</b>. What does this tell ${who}?`,
            right: `${cap(pr(who).her)} time, money and capital would earn more in their best alternative uses`,
            wrong: [
              { t: "The accountant made a mistake: profit cannot be positive and negative at once", why: "The two measures count different costs. Economic profit also subtracts implicit costs." },
              { t: "The business is earning more than normal profit", why: "Negative economic profit means it earns <em>less</em> than normal profit." },
              { t: "The business cannot pay its bills", why: `Accounting profit is ${m(acct)}, so revenue covers all the money costs. The shortfall is against opportunity costs.` },
            ],
            rightWhy: `Implicit costs are ${m(acct - econ)}, more than the accounting profit, so staying costs ${pr(who).obj} more than it earns compared with ${pr(who).her} alternatives.`,
            sol: steps("Economic profit = accounting profit − implicit costs.",
              `So implicit costs = ${m(acct)} − (${m(econ)}) = ${m(acct - econ)}. The business pays its bills but does not cover the value of what ${who} gives up to run it.`),
          });
        },
      },
      {
        name: "Stay or switch?",
        make() {
          const c = profitCase(0);
          const stay = c.econ > 0;
          const right = stay
            ? `Stay: economic profit is ${m(c.econ)}, so the business beats ${c.P.her} best alternative`
            : `Switch: economic profit is ${m(c.econ)}, so ${c.P.her} resources would earn more elsewhere`;
          const wrong = stay ? [
            { t: `Switch: giving up a ${m(c.salary)} salary is too big a sacrifice`, why: "The forgone salary is only one of the implicit costs, and revenue covers all of them here: economic profit is positive." },
            { t: `Stay, because accounting profit is ${m(c.acct)}; implicit costs do not matter`, why: "The conclusion is right but the reason is wrong: implicit costs do matter. Here economic profit is still positive." },
            { t: "Switch: any business with implicit costs makes an economic loss", why: "Economic profit is positive whenever revenue exceeds explicit plus implicit costs, as it does here." },
          ] : [
            { t: `Stay: accounting profit is ${m(c.acct)}, so the business is profitable`, why: `Accounting profit ignores implicit costs. After subtracting them, the business earns less than ${c.P.her} alternatives.` },
            { t: "Stay: implicit costs are not real costs because no money is paid", why: `Implicit costs are real opportunity costs: income ${c.P.she} gives up by staying.` },
            { t: `Switch, because the business pays ${m(c.explicit)} in explicit costs`, why: "Large explicit costs alone say nothing; what matters is revenue against all costs. The conclusion happens to be right, but for the wrong reason." },
          ];
          return Q.mc({
            q: `${c.who} runs ${c.b.what}:${caseTable(c, true)}Judged by economic profit, should ${c.who} keep the business or close it and take ${c.P.her} next-best options?`,
            right, wrong,
            sol: steps(`Decide with economic profit, which counts what ${c.P.she} gives up by staying.`,
              `Explicit costs ${m(c.explicit)}; implicit costs ${m(c.implicit)}. Economic profit = ${m(c.TR)} − ${m(c.explicit)} − ${m(c.implicit)} = ${m(c.econ)}.`,
              stay ? "Positive economic profit: the business earns more than normal profit, so staying is the better choice." : `Negative economic profit: the business earns less than normal profit, so ${c.P.her} resources do better elsewhere.`),
          });
        },
      },
      {
        name: "Revenue needed for normal profit",
        make() {
          const c = profitCase(0);
          const ans = c.explicit + c.implicit;
          return Q.num({
            q: `${c.who} is planning to open ${c.b.what}. ${c.P.She} expects explicit costs of ${m(c.explicit)} a year. ${c.P.She} would give up a ${m(c.salary)} salary as ${an(c.b.job)}, and put in ${m(c.savings)} of savings that currently earn ${c.r}% a year. The equipment would lose ${m(c.depr)} of market value each year, and normal profit for this kind of business is ${m(c.normal)}. What yearly total revenue would give ${c.P.obj} <b>exactly normal profit</b> (zero economic profit)?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: c.explicit, why: "That covers only the explicit costs: zero accounting profit, not zero economic profit." },
              { value: ans - c.normal, why: "Normal profit is part of total cost. Revenue must cover it too." },
              { value: ans - c.interest + c.savings, why: `The cost of using ${c.P.her} savings is the ${c.r}% interest they would earn (${m(c.interest)}), not the whole ${m(c.savings)}.` },
              { value: c.explicit + c.salary, why: "Include all implicit costs: forgone interest, depreciation and normal profit too." },
            ]),
            sol: steps("Zero economic profit means total revenue = total cost, where total cost includes every implicit cost (normal profit among them).",
              `Forgone interest = ${c.r}% × ${m(c.savings)} = ${m(c.interest)}. Implicit costs = ${m(c.salary)} + ${m(c.interest)} + ${m(c.depr)} + ${m(c.normal)} = ${m(c.implicit)}.`,
              `Required revenue = ${m(c.explicit)} + ${m(c.implicit)} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "Technology, information or market constraint?",
        make() {
          const cats = ["Technology", "Information", "Market"];
          const items = cats.map(c => U.pick(CONSTRAINT_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m9-cons", CONSTRAINT_BANK, 5)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "A firm's profit is limited by three kinds of constraint. Classify each situation.",
            cats, items,
            sol: steps("<b>Technology</b>: what the available methods and equipment can produce. <b>Information</b>: what the firm does not know (about workers, buyers, rivals, the future). <b>Market</b>: what buyers will pay, what rivals do and what inputs cost.",
              "Ask what is doing the limiting: a machine or method, missing knowledge, or other people's choices in the market."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Organizing production
   * ============================================================ */
  const SYSTEM_BANK = [
    { t: "A car-parts plant where a supervisor watches the assembly line and tells each worker which task to do next", cat: "Command system", why: "Orders come down a hierarchy, and work on the line is easy to watch." },
    { t: "A fast-food kitchen where a shift manager assigns stations and checks every order", cat: "Command system", why: "Effort is easy to monitor, so a hierarchy of instructions works." },
    { t: "An army-style chain of command in a warehouse: managers assign routes, team leads report back", cat: "Command system", why: "Commands flow down and feedback flows up." },
    { t: "A call center where software logs every call and supervisors direct staff in real time", cat: "Command system", why: "Monitoring is easy, so the firm can rely on direct commands." },
    { t: "Traveling sales reps paid mostly by commission on what they sell", cat: "Incentive system", why: "Effort on the road is hard to watch, so pay is tied to results." },
    { t: "Fruit pickers paid a piece rate for each bucket they fill", cat: "Incentive system", why: "Paying per unit rewards effort directly." },
    { t: "A CEO whose bonus depends on the firm's share price", cat: "Incentive system", why: "A manager's effort is hard to monitor, so pay is linked to outcomes." },
    { t: "Software engineers working from home who get profit-sharing bonuses", cat: "Incentive system", why: "Remote work is hard to watch, so rewards align their interests with the firm's." },
    { t: "Real-estate agents who earn a percentage of each sale price", cat: "Incentive system", why: "Pay is a market-like reward for results." },
  ];
  const INFO_BANK = [
    { t: "People who expect large medical bills are the most eager to buy health insurance.", cat: "Adverse selection", why: "Buyers have hidden information about their risk before the deal." },
    { t: "Sellers of used cars know which ones are lemons; buyers cannot tell.", cat: "Adverse selection", why: "Hidden information about quality before the sale." },
    { t: "A lender offering high-interest loans attracts mostly borrowers who know they are risky.", cat: "Adverse selection", why: "The riskiest types self-select into the deal; their risk is hidden beforehand." },
    { t: "Applicants who know they are poor workers are most attracted to a job with guaranteed pay and no reviews.", cat: "Adverse selection", why: "Workers know their own quality before being hired; the employer does not." },
    { t: "After buying full theft insurance, a shop owner stops locking the back door.", cat: "Moral hazard", why: "Hidden action after the deal: the insurer bears much of the cost." },
    { t: "A renter drives a rental car much harder than she drives her own.", cat: "Moral hazard", why: "She does not bear the full cost of the extra wear, and her driving is hidden." },
    { t: "A manager paid a flat salary takes long lunches because the owners rarely visit.", cat: "Moral hazard", why: "Hidden action by an agent after the contract is signed (a principal–agent problem)." },
    { t: "A bank that expects a government bailout makes riskier loans.", cat: "Moral hazard", why: "Someone else bears part of the cost of its risky actions." },
    { t: "An employee with unlimited sick days calls in sick on sunny Fridays.", cat: "Moral hazard", why: "Behavior changes after the deal because the cost falls on the employer." },
  ];
  const COPE_BANK = [
    { t: "Managers receive shares of the company's stock", cat: "Ownership", why: "Making agents part-owners gives them a stake in the firm's profit." },
    { t: "A restaurant's head chef is made a part-owner of the restaurant", cat: "Ownership", why: "Ownership aligns the chef's interests with the owners'." },
    { t: "Employees can buy company stock at a discount", cat: "Ownership", why: "Employee ownership gives workers a share in profits." },
    { t: "Sales staff earn a commission on each sale", cat: "Incentive pay", why: "Pay tied to performance is incentive pay." },
    { t: "Factory workers get a bonus when their team beats its output target", cat: "Incentive pay", why: "A performance bonus is incentive pay." },
    { t: "A plant manager's pay rises with the plant's profit this year", cat: "Incentive pay", why: "Linking pay to results is incentive pay." },
    { t: "A CEO signs a seven-year contract whose payout depends on the firm's long-run performance", cat: "Long-term contract", why: "Tying rewards to results over many years discourages short-term gaming." },
    { t: "A star engineer gets a deferred bonus paid only if she stays and the product succeeds over five years", cat: "Long-term contract", why: "Rewards spread over years make the agent care about the long run." },
    { t: "A supplier agrees to a ten-year deal with prices that depend on its long-term quality record", cat: "Long-term contract", why: "A long horizon gives the agent a reason to protect its reputation." },
  ];
  const PA_CASES = [
    { set: "A homeowner hires a real-estate agent to sell her house.", p: "The homeowner", a: "The real-estate agent", o: ["The buyers", "The bank lending to the buyers"] },
    { set: "The stockholders of a large company appoint a CEO to run it.", p: "The stockholders", a: "The CEO", o: ["The company's customers", "The government regulator"] },
    { set: "A restaurant owner hires a manager to run the restaurant on nights she is away.", p: "The restaurant owner", a: "The night manager", o: ["The diners", "The food supplier"] },
    { set: "A landlord hires a property manager to collect rent and arrange repairs.", p: "The landlord", a: "The property manager", o: ["The tenants", "The plumber who fixes the pipes"] },
    { set: "A small business hires a lawyer to defend it in a lawsuit.", p: "The business", a: "The lawyer", o: ["The judge", "The party suing the business"] },
    { set: "A farm owner hires a crew boss to supervise harvesting while she is at market.", p: "The farm owner", a: "The crew boss", o: ["The grocery stores buying the crop", "The pickers' union"] },
  ];
  const ORG_BANK = [
    { t: "Owned by one person, who keeps all the profit", cat: "Proprietorship", why: "A single owner defines a proprietorship." },
    { t: "The most common type of business by number of firms", cat: "Proprietorship", why: "Proprietorships are the most numerous." },
    { t: "The single owner can lose her house to pay the business's debts", cat: "Proprietorship", why: "One owner with unlimited liability." },
    { t: "The owner answers to no one when making decisions", cat: "Proprietorship", why: "With a single owner there is no one else to consult." },
    { t: "Two or more owners share management and pool their money", cat: "Partnership", why: "Multiple owners sharing management describes a partnership." },
    { t: "If one co-owner cannot pay her share of a debt, the others must cover it", cat: "Partnership", why: "Partners have unlimited (joint) liability." },
    { t: "The business normally ends when one of its co-owners leaves or dies", cat: "Partnership", why: "A partnership usually dissolves when a partner leaves." },
    { t: "Co-owners must agree on how to split the profit, which is taxed as their personal income", cat: "Partnership", why: "Partners agree on shares and pay personal income tax on them." },
    { t: "Owned by stockholders who can lose no more than they invested", cat: "Corporation", why: "Limited liability is the corporation's key advantage." },
    { t: "Its profit is taxed once as company income and again as owners' dividends", cat: "Corporation", why: "Double taxation is the corporation's main drawback." },
    { t: "The type that earns the largest share of total business revenue", cat: "Corporation", why: "Corporations earn most of the revenue, though there are fewer of them." },
    { t: "Ownership can change hands as shares are sold, without ending the firm", cat: "Corporation", why: "Stockholders come and go; the corporation continues." },
  ];
  const ORG_TF = [
    { t: "Command systems work best when workers' effort is easy to monitor.", ok: true },
    { t: "Incentive systems tie rewards to results when effort is hard to watch.", ok: true },
    { t: "Adverse selection arises from hidden information before a deal is made.", ok: true },
    { t: "In the principal–agent problem, stockholders are typically the principals and managers the agents.", ok: true },
    { t: "Corporate stockholders have limited liability.", ok: true },
    { t: "A proprietor's profit is taxed as her personal income.", ok: true },
    { t: "An LLC avoids double taxation and gives its owners limited liability.", ok: true },
    { t: "Information has economic value.", ok: true },
    { t: "Moral hazard refers to hidden information about quality before a sale.", ok: false, why: "That is adverse selection. Moral hazard is hidden <em>action</em> after the deal." },
    { t: "Partners in a partnership have limited liability.", ok: false, why: "Partners have unlimited liability." },
    { t: "Corporations are the most numerous type of business.", ok: false, why: "Proprietorships are the most numerous; corporations earn the most revenue." },
    { t: "Symmetric information means one side of a deal knows more than the other.", ok: false, why: "That is asymmetric information. Symmetric means both sides know the same." },
    { t: "An S corporation's profit is taxed twice.", ok: false, why: "An S corporation passes profit straight to its owners, who pay personal income tax once." },
    { t: "Command systems are best when monitoring is very difficult.", ok: false, why: "When monitoring is hard, firms lean on incentive systems." },
  ];

  const genOrg = STUDY.makeGenerator({
    id: "b251-m9-org",
    name: "Organizing production & business types",
    blurb: "Command vs incentive systems, adverse selection and moral hazard, the principal–agent problem, and proprietorships, partnerships and corporations.",
    variants: [
      {
        name: "Command or incentive system?",
        make() {
          const items = [U.pick(SYSTEM_BANK.filter(i => i.cat === "Command system")), U.pick(SYSTEM_BANK.filter(i => i.cat === "Incentive system"))];
          for (const x of U.deal("m9-sys", SYSTEM_BANK, 5)) if (items.length < 4 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Which system of organizing production does each workplace mainly use?",
            cats: ["Command system", "Incentive system"], items,
            sol: steps("A <b>command system</b> is a hierarchy: orders go down, feedback comes up. An <b>incentive system</b> uses market-like rewards.",
              "Clue: can a boss easily see whether the work is done? Easy to monitor → command. Hard to monitor → pay for results (commissions, piece rates, bonuses)."),
          });
        },
      },
      {
        name: "Adverse selection or moral hazard?",
        make() {
          const items = [U.pick(INFO_BANK.filter(i => i.cat === "Adverse selection")), U.pick(INFO_BANK.filter(i => i.cat === "Moral hazard"))];
          for (const x of U.deal("m9-info", INFO_BANK, 5)) if (items.length < 4 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Each situation involves asymmetric information. Name the problem.",
            cats: ["Adverse selection", "Moral hazard"], items,
            sol: steps("Ask <em>when</em> the hidden thing matters.",
              "Hidden <b>information</b> about type, quality or risk <em>before</em> the deal → adverse selection. Hidden <b>action</b> <em>after</em> the deal, by someone who does not bear the full cost → moral hazard."),
          });
        },
      },
      {
        name: "Coping with the principal–agent problem",
        make() {
          const cats = ["Ownership", "Incentive pay", "Long-term contract"];
          const items = cats.map(c => U.pick(COPE_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m9-cope", COPE_BANK, 4)) if (items.length < 4 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Firms use three tools to get agents to act in the principals' interest. Which tool does each arrangement use?",
            cats, items,
            sol: steps("<b>Ownership</b>: the agent becomes a part-owner. <b>Incentive pay</b>: pay depends on performance now. <b>Long-term contract</b>: rewards depend on results over many years.",
              "Shares or stock → ownership; commission or bonus for this period → incentive pay; multi-year or deferred terms → long-term contract."),
          });
        },
      },
      {
        name: "Who is the principal, who is the agent?",
        make() {
          const c = U.pick(PA_CASES);
          const askP = Math.random() < 0.5;
          const right = askP ? c.p : c.a;
          const wrong = [{ t: askP ? c.a : c.p, why: askP ? "This party is hired to act on someone else's behalf, so it is the agent." : "This party hires someone and wants them to act in its interest, so it is the principal." }]
            .concat(c.o.map(t => ({ t, why: "This party is outside the hiring relationship, so it is neither principal nor agent." })));
          return Q.mc({
            q: `${c.set} In this principal–agent relationship, who is the <b>${askP ? "principal" : "agent"}</b>?`,
            right, wrong,
            rightWhy: askP ? "The principal wants a job done in her interest and hires someone to do it." : "The agent acts on behalf of the principal and may have different goals.",
            sol: steps("The <b>principal</b> hires someone to act for them; the <b>agent</b> is the one hired. The problem is that the agent's goals may differ from the principal's, and the principal cannot see everything the agent does.",
              `Here ${c.p.toLowerCase()} is the principal and ${c.a.toLowerCase()} is the agent.`),
          });
        },
      },
      {
        name: "Proprietorship, partnership or corporation?",
        make() {
          const cats = ["Proprietorship", "Partnership", "Corporation"];
          const items = cats.map(c => U.pick(ORG_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m9-org", ORG_BANK, 5)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Match each feature to the type of business organization.",
            cats, items,
            sol: steps("Count the owners first: one (proprietorship), two or more sharing management (partnership), stockholders (corporation).",
              "Then use liability and tax: proprietors and partners have <b>unlimited liability</b> and pay personal income tax; stockholders have <b>limited liability</b> but face <b>double taxation</b>."),
          });
        },
      },
      {
        name: "How much can the owner lose?",
        make() {
          const who = U.pick(OWNERS);
          const kind = U.pick(["corp", "prop", "partner", "llc"]);
          if (kind === "corp" || kind === "llc") {
            const inv = U.randInt(5, 40) * 1000, debt = U.randInt(200, 900) * 1000, wealth = U.randInt(150, 600) * 1000;
            const label = kind === "corp" ? "corporation" : "limited liability company (LLC)";
            return Q.num({
              q: `${who} paid ${m(inv)} for an ownership stake in a ${label}. ${poss(who)} other personal wealth is ${m(wealth)}. The business goes bankrupt owing creditors ${m(debt)} more than it owns. What is the <b>most</b> ${who} can lose in total?`,
              answer: inv, unit: "$",
              traps: traps(inv, [
                { value: inv + wealth, why: `Owners of ${kind === "corp" ? "a corporation" : "an LLC"} have <b>limited liability</b>: personal wealth is not at risk.` },
                { value: debt, why: "Creditors cannot come after the owners for the firm's unpaid debts. Limited liability caps the loss at the investment." },
                { value: 0, why: "The stake itself can be lost: it becomes worthless when the firm fails." },
              ]),
              sol: steps(`${kind === "corp" ? "Corporate stockholders" : "LLC owners"} have <b>limited liability</b>: they are responsible only up to what they invested.`,
                `So ${poss(who)} loss is capped at the stake: <b>${m(inv)}</b>. The ${m(wealth)} of other wealth is safe.`),
            });
          }
          if (kind === "prop") {
            const debts = U.randInt(80, 300) * 1000, assets = U.randInt(20, Math.floor(debts / 1000) - 20) * 1000;
            const wealth = (debts - assets) + U.randInt(20, 200) * 1000;
            const ans = debts - assets;
            return Q.num({
              q: `${who} runs a sole proprietorship. It closes owing ${m(debts)}. Selling the business's assets raises ${m(assets)}. ${who} has ${m(wealth)} of personal savings and property. How much of ${poss(who)} <b>personal</b> wealth can creditors claim?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: 0, why: "A proprietor has <b>unlimited liability</b>: personal assets can be taken to pay business debts." },
                { value: debts, why: `The ${m(assets)} raised from the business's own assets pays part of the debt first.` },
                { value: wealth, why: "Creditors can claim only what is still owed, not everything she has." },
              ]),
              sol: steps(`A proprietor has <b>unlimited liability</b>: ${who} is personally responsible for every business debt the business itself cannot pay.`,
                `Unpaid debt = ${m(debts)} − ${m(assets)} = <b>${m(ans)}</b>, which creditors can collect from ${pr(who).her} ${m(wealth)} of personal wealth.`),
            });
          }
          const other = U.pick(OWNERS.filter(x => x !== who));
          const gap = U.randInt(30, 160) * 2000;
          return Q.num({
            q: `${who} and ${other} are equal partners in a business that closes with ${m(gap)} of debts left after all business assets are sold. ${other} has no money at all. ${who} is wealthy. How much of the remaining debt can creditors require <b>${who}</b> to pay?`,
            answer: gap, unit: "$",
            traps: traps(gap, [
              { value: gap / 2, why: "Each partner has unlimited liability. If one partner cannot pay, the others are responsible for the whole remaining debt." },
              { value: 0, why: "Partners do not have limited liability; personal wealth is at risk." },
            ]),
            sol: steps("Partners have <b>unlimited liability</b>, and if one partner cannot pay her share, the others must.",
              `${other} cannot pay, so creditors can require ${who} to pay all <b>${m(gap)}</b>.`),
          });
        },
      },
      {
        name: "Choose the form of organization",
        make() {
          const S = [
            { q: "Three friends are starting a bike-rental company. They want to be sure that if the company is sued they can lose only what they put in, and they do not want the company's profit taxed twice. Which form fits best?",
              right: "A limited liability company (LLC)", rightWhy: "An LLC gives owners limited liability and avoids double taxation.",
              wrong: [{ t: "A partnership", why: "Partners have unlimited liability." }, { t: "A standard corporation", why: "It gives limited liability, but its profit is taxed twice." }, { t: "A sole proprietorship", why: "One owner only, with unlimited liability." }] },
            { q: "A fast-growing firm wants to raise money from thousands of outside investors, who will only buy in if they cannot lose more than they invest. It is willing to accept double taxation. Which form fits best?",
              right: "A corporation", rightWhy: "Selling stock to many investors with limited liability is what corporations do; double taxation is the price.",
              wrong: [{ t: "A sole proprietorship", why: "A single owner cannot bring in thousands of investors, and liability is unlimited." }, { t: "A partnership", why: "Thousands of partners with unlimited liability would never sign up." }] },
            { q: "Jo wants complete control of her pet-sitting business, wants to keep every dollar of profit, and wants it taxed simply as her own income. She accepts that her personal assets are at risk. Which form fits best?",
              right: "A sole proprietorship", rightWhy: "One owner, all the profit, taxed as personal income, unlimited liability.",
              wrong: [{ t: "A corporation", why: "She would have to deal with stockholders and double taxation." }, { t: "A partnership", why: "A partnership needs two or more owners who share control." }] },
            { q: "Two dentists with different specialties want to pool their savings and split the work of running one clinic. Profit will be taxed as their personal income. Which form is described?",
              right: "A partnership", rightWhy: "Two or more owners, pooled money, shared management, personal income tax.",
              wrong: [{ t: "A sole proprietorship", why: "A proprietorship has just one owner." }, { t: "A corporation", why: "Corporate profit is taxed at the company level too." }] },
            { q: "Which type of business organization is the <b>most numerous</b>?",
              right: "Proprietorships", rightWhy: "Single-owner firms are by far the most common.",
              wrong: [{ t: "Corporations", why: "Corporations earn the most revenue, but there are fewer of them." }, { t: "Partnerships", why: "Partnerships are less common than proprietorships." }] },
            { q: "Which type of business organization accounts for the <b>largest share of revenue</b>?",
              right: "Corporations", rightWhy: "There are fewer corporations, but they are large and earn most of the revenue.",
              wrong: [{ t: "Proprietorships", why: "Proprietorships are the most numerous, but most are small." }, { t: "Partnerships", why: "Partnerships earn a smaller share." }] },
            { q: "A corporation's owners want to keep the corporate form but have all its profit passed straight to them and taxed only as their personal income. Which hybrid is that?",
              right: "An S corporation", rightWhy: "An S corporation passes net profit directly to owners, avoiding double taxation.",
              wrong: [{ t: "A partnership", why: "That is not a corporate form, and partners have unlimited liability." }, { t: "A sole proprietorship", why: "One owner, not a corporation." }] },
          ];
          const s = U.pick(S);
          return Q.mc({
            q: s.q, right: s.right, wrong: s.wrong, rightWhy: s.rightWhy,
            sol: steps("Weigh the three tradeoffs: number of owners, liability (limited or unlimited) and taxation (once or twice).",
              `<b>${s.right}</b>. ${s.rightWhy}`),
          });
        },
      },
      {
        name: "Select all true statements about organizing production",
        make() {
          const opts = U.sample(ORG_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(ORG_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Check each against the key pairs: command ↔ easy to monitor, incentive ↔ hard to monitor; adverse selection ↔ hidden information before, moral hazard ↔ hidden action after.",
              "For business types: proprietors and partners have unlimited liability; stockholders have limited liability but double taxation; S corporations and LLCs avoid double taxation."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — The four market types
   * ============================================================ */
  const PC = "Perfect competition", MCOMP = "Monopolistic competition", OLI = "Oligopoly", MONO = "Monopoly";
  const MKTS = [PC, MCOMP, OLI, MONO];
  const INDUSTRY_BANK = [
    { t: "Thousands of wheat farms selling to a national grain exchange", cat: PC, why: "Many sellers of an identical crop, easy entry, and nobody can affect the price." },
    { t: "Hundreds of farms selling Grade A large eggs to wholesalers", cat: PC, why: "Eggs of the same grade are identical to buyers, and there are many sellers." },
    { t: "Small boats selling cod at a dockside fish auction", cat: PC, why: "Many sellers of the same fish, each a price taker." },
    { t: "Soybean growers across the Midwest", cat: PC, why: "An identical commodity sold by thousands of growers." },
    { t: "Hair salons in a large city", cat: MCOMP, why: "Many salons, each with a slightly different service, and free entry." },
    { t: "Restaurants in a busy downtown", cat: MCOMP, why: "Many sellers with differentiated menus, styles and locations." },
    { t: "Coffee shops in a college town", cat: MCOMP, why: "Many shops offering similar but not identical drinks and atmospheres." },
    { t: "Clothing boutiques in a shopping district", cat: MCOMP, why: "Many sellers differentiated by style and brand, easy to enter." },
    { t: "Dentists' offices in a metro area", cat: MCOMP, why: "Many providers, each differentiated by location and service." },
    { t: "Makers of large commercial passenger jets", cat: OLI, why: "A few huge firms; the cost of entry is enormous." },
    { t: "National wireless phone carriers", cat: OLI, why: "A handful of big firms, with networks that are very costly to build." },
    { t: "Big breakfast-cereal makers", cat: OLI, why: "A few firms sell most of the output and watch each other closely." },
    { t: "Major soft-drink producers", cat: OLI, why: "A few dominant firms with strong brands that deter entry." },
    { t: "The only water utility serving a small town", cat: MONO, why: "One supplier, no close substitute, and entry is blocked." },
    { t: "A drug company holding the patent on the only treatment for a rare disease", cat: MONO, why: "The patent bars entry, and there is no close substitute." },
    { t: "The single electricity distributor licensed for a region", cat: MONO, why: "One firm protected by a legal barrier." },
    { t: "The owner of the only toll bridge across a wide river, with no other crossing for 80 miles", cat: MONO, why: "One seller with no close substitute nearby." },
  ];
  const FEATURE_BANK = [
    { t: "Many sellers of an identical product, and anyone can enter", cat: PC, why: "Identical product + many firms + free entry." },
    { t: "Every firm must accept the market price", cat: PC, why: "Price taking is the mark of perfect competition." },
    { t: "Buyers and sellers are well informed about every firm's price and product", cat: PC, why: "Full information is one of perfect competition's assumptions." },
    { t: "Many firms, each selling a slightly different version of the product", cat: MCOMP, why: "Product differentiation among many firms." },
    { t: "Firms compete on style, location and brand, and new firms enter freely", cat: MCOMP, why: "Differentiation with free entry." },
    { t: "Each of many firms has a little market power thanks to its product's distinct features", cat: MCOMP, why: "Differentiation gives some market power." },
    { t: "A few firms, each closely watching how its rivals respond", cat: OLI, why: "Few firms that depend on each other's choices." },
    { t: "A small number of firms behind barriers to entry; products may be identical or differentiated", cat: OLI, why: "Few firms + barriers, either kind of product." },
    { t: "A single seller of a product with no close substitutes", cat: MONO, why: "One firm, no substitutes." },
    { t: "One firm, protected from entrants by a patent or license", cat: MONO, why: "A legal barrier shields the only seller." },
  ];
  const NOT_FEATURE = {
    [PC]: { yes: ["Many firms", "An identical product", "No restrictions on entry", "Well-informed buyers and sellers"], no: [{ t: "Product differentiation", why: "Differentiation belongs to monopolistic competition; in perfect competition products are identical." }, { t: "High barriers to entry", why: "Entry is free in perfect competition." }, { t: "A few firms that watch each other", why: "That describes oligopoly." }] },
    [MCOMP]: { yes: ["Many firms", "Product differentiation", "No restrictions on entry", "Some market power for each firm"], no: [{ t: "An identical product", why: "Monopolistic competition has differentiated products." }, { t: "High barriers to entry", why: "Entry is free in monopolistic competition." }, { t: "A single seller", why: "That is monopoly." }] },
    [OLI]: { yes: ["A small number of firms", "Barriers to entry", "Products that may be identical or differentiated", "Firms that react to each other's choices"], no: [{ t: "Free and easy entry", why: "Oligopoly is protected by entry barriers." }, { t: "Thousands of price-taking firms", why: "That describes perfect competition." }, { t: "A single seller with no rivals", why: "That is monopoly." }] },
    [MONO]: { yes: ["One firm", "No close substitutes", "Barriers to entry"], no: [{ t: "Many rival firms", why: "A monopoly is the only firm in its market." }, { t: "Free entry", why: "Barriers to entry protect the monopoly." }, { t: "Close substitutes from other sellers", why: "A monopoly's product has no close substitutes." }] },
  };
  const MKT_TF = [
    { t: "Monopolistic competition has many firms selling differentiated products.", ok: true },
    { t: "In oligopoly, barriers to entry keep the number of firms small.", ok: true },
    { t: "A monopoly's product has no close substitutes.", ok: true },
    { t: "In perfect competition, firms sell identical products and entry is free.", ok: true },
    { t: "A higher HHI indicates less competition.", ok: true },
    { t: "A pure monopoly has an HHI of 10,000.", ok: true },
    { t: "The four-firm concentration ratio is the share of industry sales made by the four largest firms.", ok: true },
    { t: "Oligopoly firms always sell identical products.", ok: false, why: "Oligopoly products may be identical or differentiated." },
    { t: "Monopolistically competitive firms face high barriers to entry.", ok: false, why: "Entry is free in monopolistic competition." },
    { t: "Any market with hundreds of firms is perfectly competitive.", ok: false, why: "If the products are differentiated, it is monopolistic competition." },
    { t: "The HHI adds up the market shares of the four largest firms.", ok: false, why: "That is the four-firm concentration ratio. The HHI adds the <em>squared</em> shares of up to 50 firms." },
    { t: "An HHI below 100 indicates a highly concentrated market.", ok: false, why: "Below 100 is highly <em>competitive</em>; above 2,500 is highly concentrated." },
  ];
  const MKT_NAMES = ["Alpha", "Bolt", "Crest", "Delta", "Ember", "Fjord", "Garnet", "Helix", "Ion", "Jasper"];
  const MKT_GOODS = ["cement", "industrial paint", "frozen pizza", "pet food", "bottled water", "running shoes", "solar inverters", "printer ink", "ski wax", "garden hoses"];
  /* k distinct integer shares (each ≥ lo) summing to total, sorted descending. */
  function shares(k, total, lo) {
    for (let g = 0; g < 500; g++) {
      const cuts = [];
      while (cuts.length < k - 1) { const c = U.randInt(1, total - 1); if (!cuts.includes(c)) cuts.push(c); }
      cuts.sort((a, b) => a - b);
      const s = [];
      let prev = 0;
      for (const c of cuts.concat([total])) { s.push(c - prev); prev = c; }
      if (s.every(x => x >= lo) && new Set(s).size === k) return s.sort((a, b) => b - a);
    }
    throw new Error("shares failed");
  }
  const hhiBand = h => (h < 100 ? 0 : h <= 1500 ? 1 : h <= 2500 ? 2 : 3);
  const HHI_BANDS = ["Highly competitive (below 100)", "Moderately competitive (100 to 1,500)", "Moderately concentrated (1,500 to 2,500)", "Highly concentrated (above 2,500)"];

  const genMarkets = STUDY.makeGenerator({
    id: "b251-m9-markets",
    name: "The four market types",
    blurb: "Classify industries by number of firms, type of product and barriers to entry, and measure concentration with the four-firm ratio and the HHI.",
    variants: [
      {
        name: "Classify industries",
        make() {
          const items = U.sample(MKTS, 3).map(c => U.pick(INDUSTRY_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m9-ind", INDUSTRY_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Which market type best describes each industry?",
            cats: MKTS, items,
            sol: steps("Ask three questions: How many firms? Are their products identical or differentiated? Can new firms enter easily?",
              "Many + identical + free entry → perfect competition. Many + differentiated + free entry → monopolistic competition. A few + barriers → oligopoly. One + no close substitutes + barriers → monopoly."),
          });
        },
      },
      {
        name: "Match characteristics to market types",
        make() {
          const items = MKTS.map(c => U.pick(FEATURE_BANK.filter(i => i.cat === c)));
          return Q.classify({
            q: "Match each description to its market type.",
            cats: MKTS, items,
            sol: steps("Look for the decisive feature: identical product and price taking (perfect competition), differentiation with many firms (monopolistic competition), a few interdependent firms behind barriers (oligopoly), a single seller (monopoly).",
              "Free entry is shared by perfect and monopolistic competition; barriers are shared by oligopoly and monopoly. The <em>product</em> and the <em>number of firms</em> separate each pair."),
          });
        },
      },
      {
        name: "Identify the structure from a market profile",
        make() {
          const good = U.pick(MKT_GOODS);
          const type = U.pick(MKTS);
          const P = {
            [PC]: { n: `about ${U.pick([800, 1200, 2500, 4000]).toLocaleString("en-US")} small producers`, prod: "buyers regard every producer's output as identical", entry: "a newcomer can start producing with little money and no permits" },
            [MCOMP]: { n: `about ${U.pick([150, 300, 600]).toLocaleString("en-US")} sellers`, prod: "each seller's version differs a little in style, quality or location", entry: "new sellers open every month with few obstacles" },
            [OLI]: { n: `${U.pick(["three", "four", "five"])} large firms that together make almost all sales`, prod: U.pick(["the products are nearly identical", "each firm's product carries its own brand"]), entry: "building a plant big enough to compete costs hundreds of millions of dollars" },
            [MONO]: { n: "a single firm", prod: "buyers have no close substitute to turn to", entry: "a government license bars any other firm from entering" },
          }[type];
          return Q.mc({
            q: `In a regional market for ${good}, there ${type === MONO ? "is" : "are"} ${P.n}; ${P.prod}; and ${P.entry}. Which market type is this?`,
            right: type,
            wrong: MKTS.filter(t => t !== type).map(t => ({ t, why: {
              [PC]: "Perfect competition needs many firms selling an identical product with free entry.",
              [MCOMP]: "Monopolistic competition needs many firms with differentiated products and free entry.",
              [OLI]: "Oligopoly needs a small number of firms protected by barriers to entry.",
              [MONO]: "Monopoly needs a single seller with no close substitutes.",
            }[t] })),
            sol: steps("Check the three features in turn: number of firms, product, entry.",
              `Here: ${P.n}; ${P.prod}; ${P.entry}. That combination is <b>${type.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Four-firm concentration ratio",
        make() {
          const good = U.pick(MKT_GOODS);
          const k = U.randInt(6, 7);
          const sh = shares(k, U.randInt(70, 90), 2);
          const rest = 100 - sum(sh);
          const names = U.sample(MKT_NAMES, k);
          const listed = U.shuffle(sh.map((s, i) => ({ name: names[i], s })));
          const ans = sh[0] + sh[1] + sh[2] + sh[3];
          return Q.num({
            q: `Market shares of sales in the national ${good} industry:${tbl(["Firm", "Share of sales"], listed.map(x => [x.name, x.s + "%"]).concat([["About 40 other firms, none above 1%", rest + "%"]]))}What is the <b>four-firm concentration ratio</b>?`,
            answer: ans, unit: "%",
            traps: traps(ans, [
              { value: sum(listed.slice(0, 4).map(x => x.s)), why: "Those are the first four rows, not the four <em>largest</em> firms. Sort by share first." },
              { value: sh[0] * sh[0] + sh[1] * sh[1] + sh[2] * sh[2] + sh[3] * sh[3], why: "Squaring the shares is how the HHI works. The concentration ratio just adds the four largest shares." },
              { value: sum(sh), why: "That adds every named firm. Use only the four largest." },
              { value: 4 * sh[0], why: "Add the four largest shares; do not multiply the largest by four." },
            ]),
            sol: steps("The four-firm concentration ratio is the percentage of industry sales made by the <b>four largest</b> firms.",
              `Largest four: ${sh.slice(0, 4).map(s => s + "%").join(", ")}.`,
              `Ratio = ${sh.slice(0, 4).join(" + ")} = <b>${ans}%</b>.`),
          });
        },
      },
      {
        name: "Compute the HHI",
        make() {
          const good = U.pick(MKT_GOODS);
          const k = U.randInt(3, 5);
          const sh = shares(k, 100, 4);
          const names = U.sample(MKT_NAMES, k);
          const listed = U.shuffle(sh.map((s, i) => ({ name: names[i], s })));
          const ans = sum(sh.map(s => s * s));
          return Q.num({
            q: `The ${good} market has only ${k} firms:${tbl(["Firm", "Market share"], listed.map(x => [x.name, x.s + "%"]))}Calculate the <b>Herfindahl–Hirschman Index</b>.`,
            answer: ans, kind: "count",
            traps: traps(ans, [
              { value: 10000, why: "You squared the total (100²). Square <em>each</em> share, then add." },
              { value: 100, why: "That just adds the shares, which always sum to 100. Square each one first." },
              { value: sum(sh.slice(0, 4)), why: "That is (close to) a concentration ratio. The HHI squares each share." },
              { value: Math.pow(sum(sh.slice(0, 2)), 2), why: "Square each firm's share separately, not a sum of shares." },
            ]),
            sol: steps("HHI = the sum of each firm's market share (in percent) squared.",
              `${sh.map(s => s + "²").join(" + ")} = ${sh.map(s => U.fmt(s * s)).join(" + ")}.`,
              `HHI = <b>${U.fmt(ans)}</b>, which is ${HHI_BANDS[hhiBand(ans)].replace(/ \(.*\)/, "").toLowerCase()}.`),
          });
        },
      },
      {
        name: "Interpret an HHI",
        make() {
          const band = U.randInt(0, 3);
          const h = [U.randInt(20, 90), U.randInt(25, 135) * 10, U.randInt(160, 240) * 10, U.randInt(27, 90) * 100][band];
          const good = U.pick(MKT_GOODS);
          /* Bands are shown in their natural order, so build the choice list directly. */
          return {
            kind: "mc",
            q: `Analysts estimate that the HHI for the ${good} industry is <b>${U.fmt(h)}</b>. How would the industry be described?`,
            choices: HHI_BANDS.slice(), answer: band,
            whys: HHI_BANDS.map((_, i) => (i === band ? null : `${U.fmt(h)} lies outside that range; the HHI is ${i < band ? "higher" : "lower"} than this band allows.`)),
            sol: steps("A larger HHI means sales are concentrated in fewer, bigger firms, so there is less competition.",
              `Bands: below 100 highly competitive; 100–1,500 moderately competitive; 1,500–2,500 moderately concentrated; above 2,500 highly concentrated. ${U.fmt(h)} falls in “${HHI_BANDS[band]}”.`),
          };
        },
      },
      {
        name: "Which is NOT a feature?",
        make() {
          const type = U.pick(MKTS);
          const F = NOT_FEATURE[type];
          const bad = U.pick(F.no);
          return Q.mc({
            q: `Which of the following is <b>not</b> a characteristic of <b>${type.toLowerCase()}</b>?`,
            right: bad.t, rightWhy: bad.why,
            wrong: U.sample(F.yes, 3).map(t => ({ t, why: `This <em>is</em> a feature of ${type.toLowerCase()}.` })),
            sol: steps(`List the features of ${type.toLowerCase()}: ${F.yes.join("; ").toLowerCase()}.`,
              `“${bad.t}” is not on the list: ${bad.why.charAt(0).toLowerCase() + bad.why.slice(1)}`),
          });
        },
      },
      {
        name: "Select all true statements about market types",
        make() {
          const opts = U.sample(MKT_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(MKT_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Check each statement against the table: number of firms, type of product, entry conditions.",
              "For concentration: the four-firm ratio adds the top four shares; the HHI adds squared shares; higher means less competition."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Short run vs long run
   * ============================================================ */
  const RUN_BANK = [
    { t: "A bakery hires two extra bakers for the holiday rush", cat: "Short run", why: "Labor is a variable input; the kitchen stays the same." },
    { t: "A factory adds an overtime shift on its existing machines", cat: "Short run", why: "More labor with the same plant." },
    { t: "A café orders more milk and coffee beans this week", cat: "Short run", why: "Materials are variable inputs." },
    { t: "A print shop cuts its part-timers' hours during a slow month", cat: "Short run", why: "Varying labor within a fixed plant." },
    { t: "A farm hires extra pickers for harvest season", cat: "Short run", why: "Labor changes; the land and equipment do not." },
    { t: "A brewery runs its existing tanks around the clock", cat: "Short run", why: "Using the same plant more intensively." },
    { t: "A car maker builds a second assembly plant", cat: "Long run", why: "Changing plant size is a long-run decision." },
    { t: "A chain closes one of its two warehouses permanently", cat: "Long run", why: "Shrinking the plant changes a fixed input." },
    { t: "A hospital constructs a new surgical wing", cat: "Long run", why: "Expanding capital (the building) is long run." },
    { t: "A bakery replaces its small oven with an industrial production line", cat: "Long run", why: "Changing the scale of capital is long run." },
    { t: "A firm decides whether to enter a new industry by building a plant", cat: "Long run", why: "All inputs, including plant, are being chosen." },
    { t: "A brewery doubles the size of its brewhouse", cat: "Long run", why: "Plant size changes, so this is long run." },
  ];
  const FV_BANK = [
    { t: "Monthly lease payment on the factory building", cat: "Fixed cost", why: "Paid whether output is high, low or zero." },
    { t: "Annual property insurance premium", cat: "Fixed cost", why: "Does not change with output." },
    { t: "Interest on the loan used to buy the plant", cat: "Fixed cost", why: "Owed regardless of how much is produced." },
    { t: "A yearly business license fee", cat: "Fixed cost", why: "The same at any output level." },
    { t: "Salary of the night security guard", cat: "Fixed cost", why: "Paid whatever the output." },
    { t: "Raw materials used in each unit", cat: "Variable cost", why: "More output needs more materials." },
    { t: "Hourly wages of production workers", cat: "Variable cost", why: "More output means more labor hours." },
    { t: "Electricity to run the machines", cat: "Variable cost", why: "Rises with machine hours, hence with output." },
    { t: "Packaging for each item shipped", cat: "Variable cost", why: "One package per unit, so it varies with output." },
    { t: "Shipping charges per order", cat: "Variable cost", why: "Grows with the number of units sold." },
    { t: "Sales commissions", cat: "Variable cost", why: "Paid per sale, so it varies with output." },
  ];
  const RUN_TF = [
    { t: "In the long run, every cost is variable.", ok: true },
    { t: "Fixed costs exist only in the short run.", ok: true },
    { t: "Plant size is usually the input held fixed in the short run.", ok: true },
    { t: "In the short run, a firm can change output by changing the amount of labor it uses.", ok: true },
    { t: "A firm always operates in the short run; the long run is a planning horizon.", ok: true },
    { t: "Sunk costs should be ignored when making current decisions.", ok: true },
    { t: "The short run is any period shorter than one year.", ok: false, why: "The short run is defined by having a fixed input, not by calendar time." },
    { t: "Long-run decisions, such as building a plant, are easy to reverse.", ok: false, why: "Long-run decisions are hard or costly to reverse." },
    { t: "A firm should keep a failing project going because of the money already spent on it.", ok: false, why: "Money already spent is sunk; only future costs and benefits matter." },
    { t: "Rent on a factory lease is a variable cost.", ok: false, why: "It is the same at every output level, so it is fixed." },
    { t: "In the long run, at least one input is fixed.", ok: false, why: "That describes the short run. In the long run all inputs can vary." },
  ];

  const genRuns = STUDY.makeGenerator({
    id: "b251-m9-runs",
    name: "Short run vs long run",
    blurb: "Tell short-run from long-run decisions, fixed from variable costs, and recognise sunk costs.",
    variants: [
      {
        name: "Short-run or long-run decision?",
        make() {
          const items = [U.pick(RUN_BANK.filter(i => i.cat === "Short run")), U.pick(RUN_BANK.filter(i => i.cat === "Long run"))];
          for (const x of U.deal("m9-run", RUN_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Is each a short-run adjustment or a long-run decision?",
            cats: ["Short run", "Long run"], items,
            sol: steps("Ask whether the decision changes the <b>plant</b> (buildings, big machines, capital).",
              "Changing labor, materials or hours with the same plant → short run. Changing the plant itself → long run."),
          });
        },
      },
      {
        name: "Fixed or variable cost?",
        make() {
          const items = [U.pick(FV_BANK.filter(i => i.cat === "Fixed cost")), U.pick(FV_BANK.filter(i => i.cat === "Variable cost"))];
          for (const x of U.deal("m9-fv", FV_BANK, 6)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "In the short run, classify each cost of a manufacturing firm.",
            cats: ["Fixed cost", "Variable cost"], items,
            sol: steps("Imagine output dropping to zero for a month. Which costs would still have to be paid?",
              "Those are <b>fixed</b> (lease, insurance, loan interest, license fees). Costs that grow and shrink with output (materials, hourly labor, power, packaging) are <b>variable</b>."),
          });
        },
      },
      {
        name: "Which time frame applies?",
        make() {
          const S = [
            { q: "Which best describes the <b>short run</b>?", right: "A period in which at least one input, such as plant size, cannot be changed",
              wrong: [{ t: "Any period of less than one year", why: "The time frames are defined by which inputs can change, not by the calendar." }, { t: "A period in which every input can be changed", why: "That is the long run." }, { t: "A period in which the firm earns no profit", why: "Profit has nothing to do with the definition." }] },
            { q: "Which best describes the <b>long run</b>?", right: "A period long enough for the firm to vary all of its inputs, including plant size",
              wrong: [{ t: "Any period of more than five years", why: "It depends on how long it takes to change the plant, not a fixed number of years." }, { t: "A period in which only labor can be varied", why: "That is the short run." }, { t: "A period in which costs no longer matter", why: "Costs matter in every time frame; in the long run they are all variable." }] },
            (() => { const w = U.randInt(1, 3), mo = U.randInt(12, 30), plan = U.randInt(3, 9);
              return { q: `A bakery can hire extra bakers within ${w} ${U.plural(w, "week")} but needs ${mo} months to build a bigger kitchen. For planning over the next ${plan} months, the bakery is in the…`, right: "Short run: the kitchen is fixed over that period",
                wrong: [{ t: "Long run: more than three months is always the long run", why: "No calendar length defines the long run. The kitchen cannot change within the planning period." }, { t: "Long run: it can change the number of bakers", why: "Varying labor alone is a short-run adjustment." }, { t: "Neither: time frames only apply to large firms", why: "Every firm faces a short run and a long run." }] }; })(),
            (() => { const d = U.randInt(5, 14);
              return { q: `A food-cart owner can buy a second cart, rent a new spot and hire staff within ${d} days. Planning for the next two months, which time frame is she in?`, right: "The long run: every input, including her “plant”, can change within that period",
                wrong: [{ t: "The short run: two months is too short to be the long run", why: "For this business all inputs can change within two weeks, so a two-month plan is long run." }, { t: "The short run: carts are capital, and capital is always fixed", why: "Capital is fixed only in the short run; here it can be changed quickly." }, { t: "Neither: a cart is not a plant", why: "The cart is this firm's capital, its plant." }] }; })(),
          ];
          const s = U.pick(S);
          return Q.mc({
            q: s.q, right: s.right, wrong: s.wrong,
            sol: steps("Short run vs long run is about <b>flexibility</b>: is there an input (usually the plant) that cannot be changed during the period?",
              `If some input is fixed, it is the short run; if everything can change, it is the long run. Here: ${s.right.charAt(0).toLowerCase() + s.right.slice(1)}.`),
          });
        },
      },
      {
        name: "Total cost when output stops",
        make() {
          const f = firm();
          const fixed = [{ t: "Lease on the building", v: U.randInt(20, 60) * 100 }, { t: "Equipment loan payment", v: U.randInt(8, 30) * 100 }, { t: "Insurance", v: U.randInt(3, 9) * 100 }];
          const varc = [{ t: `Wages of hourly ${ws(f)}`, v: U.randInt(60, 140) * 100 }, { t: "Materials", v: U.randInt(30, 90) * 100 }, { t: "Electricity for the machines", v: U.randInt(5, 15) * 100 }];
          const F = sum(fixed.map(x => x.v)), V = sum(varc.map(x => x.v));
          return Q.num({
            q: `${f.n} has these monthly costs at its normal output:${tbl(["Cost", "Per month"], U.shuffle(fixed.concat(varc)).map(x => [x.t, m(x.v)]))}Next month a supply problem forces it to produce <b>nothing</b>, but it cannot break its lease, loan or insurance contracts. What will its total cost be next month?`,
            answer: F, unit: "$",
            traps: traps(F, [
              { value: 0, why: "Fixed costs must be paid even at zero output in the short run." },
              { value: F + V, why: "Variable costs (hourly wages, materials, power) fall to zero when nothing is produced." },
              { value: V, why: "That is the variable cost, which disappears. The fixed costs remain." },
            ]),
            sol: steps("In the short run, at zero output, total cost = total fixed cost.",
              `Fixed: ${fixed.map(x => `${x.t.toLowerCase()} ${m(x.v)}`).join(", ")}.`,
              `TC at Q = 0 = <b>${m(F)}</b>. The variable costs (${m(V)}) drop to zero.`),
          });
        },
      },
      {
        name: "Sunk cost: finish or abandon?",
        make() {
          const f = firm();
          const proj = U.pick(["a custom packaging machine", "a new product line", "a mobile ordering app", "a showroom renovation"]);
          const S = U.randInt(20, 80) * 1000, F = U.randInt(10, 50) * 1000, R = U.randInt(15, 90) * 1000, V = U.pick([0, 0, U.randInt(2, 8) * 1000]);
          const ans = (R - F) - V;
          if (ans === 0) return this.make();
          return Q.num({
            q: `${f.n} has already spent ${m(S)} on ${proj}; none of it can be recovered. Finishing will cost another ${m(F)} and is expected to bring in ${m(R)}.${V ? ` If it abandons the project now, it can sell the half-finished work for ${m(V)}.` : " If it abandons the project now, it gets nothing."} By how much is the firm <b>better off</b> finishing rather than abandoning? (Enter a negative number if abandoning is better.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: R - F - S - V, why: `The ${m(S)} already spent is sunk: it is gone whichever option is chosen, so it cannot affect the comparison.` },
              { value: R - S, why: "Compare future revenue with <em>future</em> costs. The money already spent is sunk." },
              { value: R - F, why: V ? `Abandoning is worth ${m(V)}, which is given up by finishing.` : "Check the sign and the numbers again." },
            ]),
            sol: steps("A sunk cost has already been paid and cannot be recovered, so it is the same under both choices. Ignore it.",
              `Finish: ${m(R)} − ${m(F)} = ${m(R - F)} from here on. Abandon: ${m(V)}.`,
              `Difference = ${m(R - F)} − ${m(V)} = <b>${m(ans)}</b>, so the firm should ${ans > 0 ? "finish" : "abandon"} the project.`),
          });
        },
      },
      {
        name: "Spot the sunk cost",
        make() {
          const f = firm();
          const sunk = U.pick([
            "The $40,000 it paid last year for a machine that has no resale value",
            "The non-refundable $12,000 deposit it already paid on a trade-show booth",
            "The $25,000 it spent on market research last spring",
            "The $8,000 it paid to design a logo it is now considering replacing",
          ]);
          return Q.mc({
            q: `${f.n} is deciding whether to expand production next quarter. Which of these should <b>not</b> affect the decision?`,
            right: sunk, rightWhy: "It has already been spent and cannot be recovered whatever the firm decides, so it is a sunk cost.",
            wrong: [
              { t: `The wages it would pay additional ${ws(f)}`, why: "These are future costs that depend on the decision, so they matter." },
              { t: "The extra revenue it expects from the added output", why: "Future benefits that depend on the choice matter." },
              { t: "The price of the extra materials it would need", why: "A future cost that depends on the decision." },
            ],
            sol: steps("Only costs and benefits that <em>change</em> with the decision should count.",
              "Money already spent and impossible to recover is a <b>sunk cost</b>: it is the same whichever choice the firm makes, so it is irrelevant."),
          });
        },
      },
      {
        name: "Select all true statements about time frames",
        make() {
          const opts = U.sample(RUN_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(RUN_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Short run: some input fixed, so some costs are fixed. Long run: all inputs and all costs variable.",
              "Sunk costs are irrelevant to decisions, and the time frames are not defined by calendar length."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Short-run production: TP, MP, AP
   * ============================================================ */
  const PROD_TF = [
    { t: "Marginal product is the change in total product from adding one more worker.", ok: true },
    { t: "Average product is total product divided by the number of workers.", ok: true },
    { t: "When marginal product is above average product, average product is rising.", ok: true },
    { t: "Total product is at its maximum where marginal product equals zero.", ok: true },
    { t: "Diminishing returns can begin while total product is still rising.", ok: true },
    { t: "The law of diminishing returns applies when at least one input is held fixed.", ok: true },
    { t: "Diminishing returns begin only when total product starts to fall.", ok: false, why: "They begin when MP starts to fall; TP keeps rising as long as MP is positive." },
    { t: "Marginal product crosses average product at the maximum of marginal product.", ok: false, why: "MP crosses AP at the maximum of <em>AP</em>." },
    { t: "Diminishing returns happen because later workers are less skilled.", ok: false, why: "Even identical workers add less once they must share fixed equipment and space." },
    { t: "If marginal product is negative, total product is rising slowly.", ok: false, why: "Negative MP means TP is falling." },
    { t: "Average product is the slope of the total product curve.", ok: false, why: "MP is the slope of TP; AP is TP ÷ L." },
  ];
  const genProduct = STUDY.makeGenerator({
    id: "b251-m9-product",
    name: "Total, marginal & average product",
    blurb: "Compute MP and AP from a production table, find where diminishing returns begin, and read TP, MP and AP curves.",
    variants: [
      {
        name: "Marginal product from total product",
        make() {
          const p = prodData();
          const j = U.randInt(2, p.n);
          const ans = p.MP[j - 1];
          return Q.num({
            q: `${p.f.n} has a fixed workshop and varies the number of ${ws(p.f)}. Daily output:${prodTbl(p, ["L", "TP"])}What is the <b>marginal product of the ${ord(j)} ${p.f.w}</b>?`,
            answer: ans, unit: p.f.p,
            traps: traps(ans, [
              { value: p.TP[j], why: "That is total product with that many workers. MP is the <em>change</em> in TP." },
              { value: p.AP[j], why: "That is average product (TP ÷ L). MP is the extra output from that one worker." },
              { value: p.TP[j] - p.TP[j - 2], why: "That is the change over two workers. Compare with the row just above only." },
              { value: p.TP[j + 1] != null ? p.TP[j + 1] - p.TP[j] : NaN, why: `That is the MP of the ${ord(j + 1)} ${p.f.w}.` },
            ]),
            sol: steps("Marginal product = ΔTP ÷ ΔL: the output added by one more worker.",
              `MP of the ${ord(j)} ${p.f.w} = TP(${j}) − TP(${j - 1}) = ${U.fmt(p.TP[j])} − ${U.fmt(p.TP[j - 1])} = <b>${U.fmt(ans)}</b> ${ans === 1 ? p.f.s : p.f.p}.`),
          });
        },
      },
      {
        name: "Average product",
        make() {
          const p = prodData();
          const j = U.randInt(2, p.n);
          const ans = p.AP[j];
          return Q.num({
            q: `Output at ${p.f.n} with different numbers of ${ws(p.f)}:${prodTbl(p, ["L", "TP"])}What is the <b>average product</b> when ${j} ${ws(p.f)} are working? (Round to two decimals if needed.)`,
            answer: ans,
            traps: traps(ans, [
              { value: p.MP[j - 1], why: "That is the marginal product of the last worker. AP divides <em>total</em> product by the number of workers." },
              { value: p.TP[j], why: "Divide total product by the number of workers." },
              { value: p.TP[j] / (j - 1), why: `Divide by ${j} workers, not ${j - 1}.` },
            ]),
            sol: steps("Average product = TP ÷ L: output per worker.",
              `AP = ${U.fmt(p.TP[j])} ÷ ${j} = <b>${n2(ans)}</b> ${p.f.p} per ${p.f.w}.`),
          });
        },
      },
      {
        name: "Total product from marginal products",
        make() {
          const p = prodData();
          const j = U.randInt(3, p.n);
          const ans = p.TP[j];
          return Q.num({
            q: `${p.f.n} produces nothing with zero ${ws(p.f)}. The marginal products of successive ${ws(p.f)} are:${prodTbl(p, ["L", "MP"])}What is <b>total product</b> with ${j} ${ws(p.f)}?`,
            answer: ans, unit: p.f.p,
            traps: traps(ans, [
              { value: p.MP[j - 1], why: "That is only the last worker's contribution. TP adds up every worker's MP." },
              { value: p.MP[j - 1] * j, why: "Workers do not all add the same amount. Add up each worker's MP." },
              { value: p.TP[j - 1], why: `That stops one worker short: include the ${ord(j)} ${p.f.w}.` },
            ]),
            sol: steps("Total product is the sum of the marginal products of all workers hired so far (starting from TP = 0 at L = 0).",
              `TP(${j}) = ${p.MP.slice(0, j).map(U.fmt).join(" + ")} = <b>${U.fmt(ans)}</b>.`),
          });
        },
      },
      {
        name: "Where diminishing returns begin",
        make() {
          const p = prodData();
          const ans = p.dimStart;
          return Q.num({
            q: `Daily output at ${p.f.n}, which has a fixed amount of equipment:${prodTbl(p, ["L", "TP"])}With which ${p.f.w} (1st, 2nd, …) do <b>diminishing marginal returns begin</b>? Enter the worker's number.`,
            answer: ans, kind: "count",
            traps: traps(ans, [
              { value: p.peak, why: `The ${ord(p.peak)} ${p.f.w} has the <em>highest</em> MP. Diminishing returns begin with the next worker, the first whose MP is lower.` },
              { value: p.apMax, why: "That is where average product peaks. Diminishing <em>marginal</em> returns start when MP first falls." },
              { value: p.n + 1, why: "TP never has to fall for diminishing returns to start. Look at the MPs." },
            ]),
            sol: steps("Diminishing marginal returns begin when an extra worker adds <em>less</em> than the worker before, so compute the MPs first.",
              `MPs: ${p.MP.map((x, i) => `${ord(i + 1)} ${U.fmt(x)}`).join(", ")}.`,
              `MP rises up to the ${ord(p.peak)} ${p.f.w} and first falls with the <b>${ord(ans)}</b>, even though TP keeps rising.`),
          });
        },
      },
      {
        name: "Read the TP, MP and AP curves",
        make() {
          const h = U.pick([2, 4, 6]), k = U.pick([1, 2]);
          const pc = prodCurves(h, k);
          const ask = U.pick(["dim", "tp", "ap"]);
          const vals = { dim: h, ap: 1.5 * h, tp: 2 * h, half: 0.5 * h };
          const lab = v => `About ${U.fmt(v)} workers`;
          const question = { dim: "Diminishing marginal returns set in after about how many workers?", tp: "Total product reaches its maximum at about how many workers?", ap: "Average product is at its maximum at about how many workers?" }[ask];
          const WHY = {
            dim: "That is where MP peaks, so diminishing marginal returns set in from there.",
            ap: "That is where MP crosses AP, at AP's maximum.",
            tp: "That is where MP reaches zero, so TP is at its peak.",
            half: "MP is still rising here, so returns are increasing, not diminishing.",
          };
          return Q.mc({
            q: `The graphs show a firm's short-run total product (top) and its marginal and average product (bottom).${prodGraphs(pc)}${question}`,
            right: lab(vals[ask]), rightWhy: WHY[ask],
            wrong: ["dim", "ap", "tp", "half"].filter(x => x !== ask).map(x => ({ t: lab(vals[x]), why: WHY[x] })),
            sol: steps("Three landmarks: MP peaks where diminishing returns set in; MP crosses AP at AP's maximum; TP peaks where MP = 0.",
              `On these graphs MP peaks at ${U.fmt(h)} workers, MP = AP at ${U.fmt(1.5 * h)} workers, and MP hits zero (TP max) at ${U.fmt(2 * h)} workers. So the answer is <b>${lab(vals[ask]).toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Marginal product from two averages",
        make() {
          const f = firm();
          const L = U.randInt(2, 6), a = U.randInt(12, 30);
          const up = Math.random() < 0.35;
          const d = U.randInt(1, up ? 3 : Math.max(1, Math.min(3, Math.floor((a - 1) / (L + 1)))));
          const b = up ? a + d : a - d;
          const ans = (L + 1) * b - L * a;
          if (ans <= 0) return this.make();
          return Q.num({
            q: `At ${f.n}, ${L} ${ws(f)} produce an average of <b>${a}</b> ${f.p} each per day. When a ${ord(L + 1)} ${f.w} is hired, average product ${up ? "rises" : "falls"} to <b>${b}</b>. What is the marginal product of the ${ord(L + 1)} ${f.w}?`,
            answer: ans, unit: f.p,
            traps: traps(ans, [
              { value: b - a, why: "The change in the <em>average</em> is not the marginal product. Convert averages back to totals first." },
              { value: b, why: "That is the new average. MP is the change in total product." },
              { value: (L + 1) * b, why: "That is the new total. Subtract the old total." },
            ]),
            sol: steps("Turn each average back into a total (TP = AP × L), then take the difference.",
              `Old TP = ${L} × ${a} = ${L * a}. New TP = ${L + 1} × ${b} = ${(L + 1) * b}.`,
              `MP of the ${ord(L + 1)} ${f.w} = ${(L + 1) * b} − ${L * a} = <b>${ans}</b>. ${up ? "It is above the old average, which is why the average rose." : "It is below the old average, which is why the average fell."}`),
          });
        },
      },
      {
        name: "Predict TP and AP from MP",
        make() {
          const f = firm();
          const ap = U.randInt(10, 25);
          const S = [
            (() => { const mp = ap + U.randInt(2, 8); return { q: `${poss(f.n)} ${ws(f)} currently average ${ap} ${f.p} each. The next ${f.w} hired would add ${mp}. If she is hired, average product will…`, right: "Rise", wrong: [{ t: "Fall", why: `Her MP (${mp}) is above the average (${ap}), so she pulls the average up.` }, { t: "Stay the same", why: "The average stays put only if MP equals the current average." }], why: "A marginal value above the average pulls the average up." }; })(),
            (() => { const mp = ap - U.randInt(2, Math.min(8, ap - 1)); return { q: `${poss(f.n)} ${ws(f)} currently average ${ap} ${f.p} each. The next ${f.w} hired would add ${mp}. If she is hired, average product will…`, right: "Fall", wrong: [{ t: "Rise", why: `Her MP (${mp}) is below the average (${ap}), so the average falls.` }, { t: "Stay the same", why: "The average stays put only if MP equals the current average." }, { t: "Become negative", why: `Total product still rises by ${mp}; only the average falls.` }], why: "A marginal value below the average pulls the average down, even though total product rises." }; })(),
            { q: `At ${f.n}, each additional ${f.w} adds output, but less than the previous one did. Total product is…`, right: "Rising, but at a decreasing rate", wrong: [{ t: "Falling", why: "TP falls only when MP is negative. Here MP is positive." }, { t: "Rising at an increasing rate", why: "That needs MP to be rising." }, { t: "At its maximum", why: "TP peaks where MP = 0." }], why: "Positive but falling MP is diminishing returns: TP still rises, more slowly." },
            { q: `At ${f.n}, hiring one more ${f.w} would actually <em>reduce</em> total output: ${ws(f)} would get in each other's way. What does that say about marginal product?`, right: "Marginal product is negative", wrong: [{ t: "Marginal product is positive but falling", why: "Then TP would still rise." }, { t: "Average product is negative", why: "AP = TP ÷ L stays positive as long as TP is positive." }, { t: "Marginal product equals average product", why: "That happens at AP's maximum, not where TP falls." }], why: "TP falls only when MP is below zero." },
            { q: `Why does ${f.n} eventually hit diminishing marginal returns as it hires more ${ws(f)}?`, right: "Its equipment and space are fixed, so each added worker has less capital to work with", wrong: [{ t: "Later workers are always less skilled than earlier ones", why: "Diminishing returns occur even with identical workers; the fixed inputs are the cause." }, { t: "Wages rise as more workers are hired", why: "Wages are a cost; the law is about physical output." }, { t: "Customers buy less as output rises", why: "Demand is not part of the production function." }], why: "Fixed inputs shared among more workers make each extra worker less productive." },
          ];
          const s = U.pick(S);
          return Q.mc({
            q: s.q, right: s.right, wrong: s.wrong, rightWhy: s.why,
            sol: steps("Use the marginal–average and marginal–total links: MP above AP raises AP; MP below AP lowers it; positive MP raises TP; negative MP lowers it.",
              s.why),
          });
        },
      },
      {
        name: "Select all true statements about production",
        make() {
          const opts = U.sample(PROD_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(PROD_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("MP = ΔTP ÷ ΔL is the slope of TP; AP = TP ÷ L.",
              "Diminishing returns start when MP starts to fall (TP still rising); MP crosses AP at AP's maximum; TP peaks where MP = 0."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Completing a cost table
   * ============================================================ */
  const costIntro = d => `${d.f.n} makes ${d.f.p}. Its short-run daily costs:`;
  const genCostTable = STUDY.makeGenerator({
    id: "b251-m9-costtable",
    name: "Completing a cost table",
    blurb: "Find TFC, TVC, TC, AFC, AVC, ATC and MC from partial short-run cost tables, working forwards and backwards.",
    variants: [
      {
        name: "TVC from total cost",
        make() {
          const d = costData();
          const q = U.randInt(2, 6);
          const ans = d.TVC[q];
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TC"])}What is <b>total variable cost</b> at an output of ${q}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.TC[q], why: "That is total cost, which still includes the fixed cost." },
              { value: d.MC[q], why: "That is the change in TC from the previous row (marginal cost)." },
              { value: d.TFC, why: "That is total fixed cost (TC at zero output)." },
            ]),
            sol: steps("At zero output there is no variable cost, so TC at Q = 0 is the total fixed cost.",
              `TFC = ${m(d.TC[0])}.`,
              `TVC(${q}) = TC − TFC = ${m(d.TC[q])} − ${m(d.TFC)} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "AVC from total cost",
        make() {
          const d = costData();
          const q = U.randInt(2, 6);
          const ans = d.AVC[q];
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TC"])}What is <b>average variable cost</b> at an output of ${q}? (Round to the nearest cent.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.ATC[q], why: "That is TC ÷ Q (average total cost). AVC uses only the variable part of cost." },
              { value: d.MC[q], why: "That is marginal cost. AVC is TVC ÷ Q." },
              { value: d.TVC[q], why: "Divide TVC by the output." },
            ]),
            sol: steps("AVC = TVC ÷ Q, and TVC = TC − TFC. TFC is TC at zero output.",
              `TFC = ${m(d.TFC)}; TVC(${q}) = ${m(d.TC[q])} − ${m(d.TFC)} = ${m(d.TVC[q])}.`,
              `AVC = ${m(d.TVC[q])} ÷ ${q} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "ATC from fixed and variable cost",
        make() {
          const d = costData();
          const q = U.randInt(2, 6);
          const ans = d.ATC[q];
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TFC", "TVC"])}What is <b>average total cost</b> at an output of ${q}? (Round to the nearest cent.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.AVC[q], why: "That is AVC. ATC includes fixed cost too." },
              { value: d.TC[q], why: "That is total cost. Divide by output." },
              { value: d.AFC[q], why: "That is AFC alone. ATC = AFC + AVC." },
              { value: d.TFC + d.AVC[q], why: "Spread the fixed cost over the output too: ATC = (TFC + TVC) ÷ Q." },
            ]),
            sol: steps("ATC = TC ÷ Q, where TC = TFC + TVC. (Equivalently, ATC = AFC + AVC.)",
              `TC(${q}) = ${m(d.TFC)} + ${m(d.TVC[q])} = ${m(d.TC[q])}.`,
              `ATC = ${m(d.TC[q])} ÷ ${q} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "AFC when fixed cost is hidden",
        make() {
          const d = costData();
          const q = U.randInt(2, 6);
          const ans = d.AFC[q];
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TVC", "TC"], [["TC", 0]])}What is <b>average fixed cost</b> at an output of ${q}? (Round to the nearest cent.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.TFC, why: "That is total fixed cost. Divide it by the output." },
              { value: d.ATC[q], why: "That is TC ÷ Q (ATC). AFC uses fixed cost only." },
              { value: d.AVC[q], why: "That is AVC. AFC = TFC ÷ Q." },
            ]),
            sol: steps("Fixed cost is the same in every row, and TFC = TC − TVC in any row.",
              `E.g. at Q = ${q}: TFC = ${m(d.TC[q])} − ${m(d.TVC[q])} = ${m(d.TFC)}.`,
              `AFC = ${m(d.TFC)} ÷ ${q} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "Marginal cost from total cost",
        make() {
          const d = costData();
          const q = U.randInt(2, 6);
          const ans = d.MC[q];
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TFC", "TC"])}What is the <b>marginal cost of the ${ord(q)} unit</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.ATC[q], why: "That is TC ÷ Q (ATC). MC is the <em>change</em> in TC." },
              { value: d.TC[q], why: "That is the total cost of all the units. MC is the extra cost of the last one." },
              { value: d.AVC[q], why: "That is AVC. MC = ΔTC ÷ ΔQ." },
              { value: q < 6 ? d.MC[q + 1] : NaN, why: `That is the MC of the ${ord(q + 1)} unit.` },
            ]),
            sol: steps("Marginal cost = ΔTC ÷ ΔQ: the extra cost of producing one more unit.",
              `MC of unit ${q} = TC(${q}) − TC(${q - 1}) = ${m(d.TC[q])} − ${m(d.TC[q - 1])} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "TFC from the average columns",
        make() {
          const d = costData(x => x.TFC % 60 === 0);
          const ans = d.TFC;
          const q = U.randInt(2, 6);
          return Q.num({
            q: `${d.f.n} lost the totals from its cost report. Only the averages survive:${tbl(["Output (Q)", "AVC", "ATC"], [1, 2, 3, 4, 5, 6].map(k => [k, m(d.AVC[k]), m(d.ATC[k])]))}What is the firm's <b>total fixed cost</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.AFC[q], why: `ATC − AVC gives AFC (fixed cost <em>per unit</em>). Multiply by the output to get TFC.` },
              { value: d.TC[q], why: "ATC × Q is total cost. Use ATC − AVC to isolate fixed cost first." },
              { value: d.AFC[6], why: "At Q = 6, ATC − AVC is AFC. Multiply by 6." },
            ]),
            sol: steps("ATC − AVC = AFC, and AFC × Q = TFC. Any row works, because TFC is the same at every output.",
              `At Q = ${q}: AFC = ${m(d.ATC[q])} − ${m(d.AVC[q])} = ${m(d.AFC[q])}.`,
              `TFC = ${m(d.AFC[q])} × ${q} = <b>${m(ans)}</b>. (Check: at Q = 1, ATC − AVC = ${m(d.AFC[1])}.)`),
          });
        },
      },
      {
        name: "Total cost from the MC column",
        make() {
          const d = costData();
          const q = U.randInt(3, 6);
          const ans = d.TC[q];
          return Q.num({
            q: `${poss(d.f.n)} total fixed cost is <b>${m(d.TFC)}</b> a day. Its marginal costs are:${costTbl(d, ["Q", "MC"])}What is <b>total cost</b> at an output of ${q}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.TVC[q], why: "That is total variable cost. Add the fixed cost." },
              { value: d.TFC + d.MC[q], why: "Add the MC of <em>every</em> unit up to this one, not just the last." },
              { value: d.TFC + d.MC[q] * q, why: "Each unit has its own MC. Add them up rather than multiplying the last one." },
            ]),
            sol: steps("Each MC is the cost added by one more unit, so adding up MCs gives TVC. Then TC = TFC + TVC.",
              `TVC(${q}) = ${d.MC.slice(1, q + 1).map(m).join(" + ")} = ${m(d.TVC[q])}.`,
              `TC(${q}) = ${m(d.TFC)} + ${m(d.TVC[q])} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "Marginal cost from the AVC column",
        make() {
          const good = x => { for (let q = 2; q <= 6; q++) if (x.TVC[q] % q === 0 && x.TVC[q - 1] % (q - 1) === 0) return true; return false; };
          const d = costData(good);
          const qs = [2, 3, 4, 5, 6].filter(q => d.TVC[q] % q === 0 && d.TVC[q - 1] % (q - 1) === 0);
          const q = U.pick(qs);
          const ans = d.MC[q];
          return Q.num({
            q: `${d.f.n} reports only its average variable cost:${tbl(["Output (Q)", "AVC"], [1, 2, 3, 4, 5, 6].map(k => [k, m(d.AVC[k])]))}What is the <b>marginal cost of the ${ord(q)} unit</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: d.AVC[q] - d.AVC[q - 1], why: "The change in the <em>average</em> is not the marginal cost. Rebuild the totals first (TVC = AVC × Q)." },
              { value: d.AVC[q], why: "That is the average variable cost at this output. MC is the change in total cost." },
              { value: d.TVC[q], why: "That is TVC at this output. Subtract TVC at the previous output." },
            ]),
            sol: steps("Fixed cost does not change, so MC = ΔTVC. Rebuild TVC from AVC: TVC = AVC × Q.",
              `TVC(${q}) = ${m(d.AVC[q])} × ${q} = ${m(d.TVC[q])}; TVC(${q - 1}) = ${m(d.AVC[q - 1])} × ${q - 1} = ${m(d.TVC[q - 1])}.`,
              `MC = ${m(d.TVC[q])} − ${m(d.TVC[q - 1])} = <b>${m(ans)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Cost-curve relationships
   * ============================================================ */
  const CURVE_TF = [
    { t: "Marginal cost crosses average variable cost at AVC's minimum.", ok: true },
    { t: "Marginal cost crosses average total cost at ATC's minimum.", ok: true },
    { t: "Average fixed cost falls continuously as output rises.", ok: true },
    { t: "The vertical gap between ATC and AVC equals AFC.", ok: true },
    { t: "The minimum of ATC occurs at a larger output than the minimum of AVC.", ok: true },
    { t: "When MC is below ATC, ATC is falling.", ok: true },
    { t: "A rise in the wage shifts up the AVC, ATC and MC curves.", ok: true },
    { t: "Marginal cost crosses ATC at the minimum point of MC.", ok: false, why: "MC crosses ATC at <em>ATC's</em> minimum. MC bottoms out earlier." },
    { t: "AFC is U-shaped, like AVC.", ok: false, why: "AFC = TFC ÷ Q falls at every output." },
    { t: "The gap between ATC and AVC widens as output rises.", ok: false, why: "The gap is AFC, which shrinks as output rises." },
    { t: "When MC is rising, ATC must be rising too.", ok: false, why: "ATC rises only when MC is <em>above</em> it. MC can rise while still below ATC, pulling ATC down." },
    { t: "A higher rent on the factory shifts up the MC curve.", ok: false, why: "Rent is a fixed cost; it does not change the cost of an extra unit." },
    { t: "Cost curves shift only when output changes.", ok: false, why: "A change in output is a movement along the curves; they shift with technology or input prices." },
  ];
  const genCurves = STUDY.makeGenerator({
    id: "b251-m9-curves",
    name: "Cost-curve relationships",
    blurb: "Read and reason with the MC, ATC, AVC and AFC curves: where MC crosses the averages, why AFC falls, and what shifts the curves.",
    variants: [
      {
        name: "Identify the cost curves on a graph",
        make() {
          const cc = costCurves(U.pick([8, 10, 12]), 0.25, U.pick([5, 6]), U.pick([40, 48, 60]));
          const yMax = niceMax(cc.v0 * 3.4);
          const names = ["MC", "ATC", "AVC", "AFC"];
          const letters = U.shuffle(["A", "B", "C", "D"]);
          const styles = U.shuffle(["main", "alt", "dash", U.pick(["main", "alt"])]);
          const fns = { MC: cc.MC, ATC: cc.ATC, AVC: cc.AVC, AFC: cc.AFC };
          const lab = {};
          names.forEach((n, i) => { lab[n] = letters[i]; });
          const curves = names.map((n, i) => {
            const pts = clipPts(fns[n], 0.5, 12.5, 0.25, yMax);
            return { pts, style: styles[i], label: lab[n], labelAt: n === "MC" ? pts.length - 3 : n === "AFC" ? Math.floor(pts.length * 0.75) : n === "ATC" ? 3 : Math.floor(pts.length * 0.9) };
          });
          const target = U.pick(names);
          const DESC = {
            MC: "the curve that dips first and then rises steeply, passing through the lowest points of two U-shaped curves",
            ATC: "the higher U-shaped curve, whose minimum is crossed by MC",
            AVC: "the lower U-shaped curve, whose minimum (further left) is crossed by MC",
            AFC: "the curve that falls at every output and never turns up",
          };
          return Q.mc({
            q: `The graph shows a firm's short-run MC, ATC, AVC and AFC curves, labelled A–D in random order.${G.plot({ xLabel: "Output (Q)", yLabel: "Cost per unit ($)", xMax: 13, yMax, xTicks: [2, 4, 6, 8, 10, 12], yTicks: ticks(yMax, 4), curves, aria: "Four unlabelled cost curves" })}Which curve is the <b>${target}</b>?`,
            right: `Curve ${lab[target]}`, rightWhy: `The ${target} is ${DESC[target]}.`,
            wrong: names.filter(n => n !== target).map(n => ({ t: `Curve ${lab[n]}`, why: `Curve ${lab[n]} is the ${n}: ${DESC[n]}.` })),
            sol: steps("Start with the easy ones: AFC is the only curve that falls everywhere; MC is the one that cuts through the bottoms of the two U's.",
              "Of the two U-shaped curves, the higher one is ATC (it includes fixed cost) and the lower one is AVC. The gap between them is AFC, and it narrows as output rises.",
              `So the ${target} is <b>Curve ${lab[target]}</b>.`),
          });
        },
      },
      {
        name: "Output with the lowest ATC",
        make() {
          const d = costData(x => { const a = argmin(x.ATC), v = argmin(x.AVC); return a && v && a < 6 && a !== v; });
          const ans = argmin(d.ATC);
          const mcMin = argmin(d.MC.map((v, q) => (q ? v : 1e9)));
          return Q.num({
            q: `${costIntro(d)}${costTbl(d, ["Q", "TC"])}At what output is <b>average total cost</b> lowest?`,
            answer: ans, kind: "count",
            traps: traps(ans, [
              { value: mcMin != null ? mcMin : NaN, why: "That is where <em>marginal</em> cost is lowest. ATC keeps falling as long as MC is below it, so its minimum comes later." },
              { value: argmin(d.AVC), why: "That is where AVC is lowest. ATC's minimum is further right because AFC keeps falling." },
              { value: 6, why: "Compute ATC = TC ÷ Q at each output; it starts rising before Q = 6." },
            ]),
            sol: steps("Compute ATC = TC ÷ Q for each output and find the smallest.",
              `ATC: ${[1, 2, 3, 4, 5, 6].map(q => `Q=${q}: ${m(d.ATC[q])}`).join("; ")}.`,
              `Lowest at <b>Q = ${ans}</b>. Check with MC: the ${ord(ans)} unit's MC (${m(d.MC[ans])}) is below the previous ATC, while the ${ord(ans + 1)} unit's MC (${m(d.MC[ans + 1])}) is above ATC, so ATC turns up.`),
          });
        },
      },
      {
        name: "Predict the average from the marginal",
        make() {
          const f = firm();
          const avg = U.pick(["ATC", "AVC"]);
          const A = U.randInt(15, 60);
          const rel = U.pick(["below", "above", "equal"]);
          const M = rel === "below" ? A - U.randInt(2, 10) : rel === "above" ? A + U.randInt(2, 10) : A;
          const right = rel === "below" ? `${avg} falls` : rel === "above" ? `${avg} rises` : `${avg} stays the same (it is at its minimum)`;
          const all = [`${avg} falls`, `${avg} rises`, `${avg} stays the same (it is at its minimum)`];
          const WHY = {
            [`${avg} falls`]: "An average falls only when the marginal value is below it.",
            [`${avg} rises`]: "An average rises only when the marginal value is above it.",
            [`${avg} stays the same (it is at its minimum)`]: "The average stays put only when the marginal value equals it.",
          };
          const choices = all;
          return {
            kind: "mc",
            q: `At ${poss(f.n)} current output, ${avg} is ${m(A)} and the marginal cost of the next ${f.s} is ${m(M)}. If the firm makes that one more ${f.s}, what happens to ${avg}?`,
            choices, answer: choices.indexOf(right),
            whys: choices.map(c => (c === right ? null : WHY[c])),
            sol: steps("Marginal drives average: a marginal value below the average pulls it down, above pulls it up.",
              `MC (${m(M)}) is ${rel === "equal" ? "equal to" : rel} ${avg} (${m(A)}), so <b>${right}</b>.`),
          };
        },
      },
      {
        name: "New ATC after one more unit",
        make() {
          const f = firm();
          const q = U.randInt(4, 19), A = U.randInt(20, 60);
          const down = Math.random() < 0.5;
          const dmax = down ? Math.max(1, Math.floor((A - 2) / (q + 1))) : 3;
          const dd = U.randInt(1, Math.min(3, dmax));
          const B = down ? A - dd : A + dd;
          const M = (q + 1) * B - q * A;
          if (M <= 0) return this.make();
          return Q.num({
            q: `${f.n} makes ${q} ${f.p} a week at an average total cost of ${m(A)}. Making one more costs an extra ${m(M)} (its marginal cost). What is the new <b>average total cost</b> of all ${q + 1}?`,
            answer: B, unit: "$",
            traps: traps(B, [
              { value: (A + M) / 2, why: "Do not average the two numbers: the old ATC applies to many units, the MC to just one. Rebuild total cost." },
              { value: M, why: "That is the cost of the extra unit only." },
              { value: A + M / (q + 1), why: "TC rises by MC, so the new ATC is (old TC + MC) ÷ new Q." },
            ]),
            sol: steps("Average → total → new average. TC = ATC × Q.",
              `Old TC = ${m(A)} × ${q} = ${m(A * q)}. New TC = ${m(A * q)} + ${m(M)} = ${m(A * q + M)}.`,
              `New ATC = ${m(A * q + M)} ÷ ${q + 1} = <b>${m(B)}</b>. ${down ? "MC was below the old ATC, so ATC fell." : "MC was above the old ATC, so ATC rose."}`),
          });
        },
      },
      {
        name: "Which curves shift?",
        make() {
          const f = firm();
          const S = [
            { t: `The landlord raises the monthly rent on ${poss(f.n)} workshop.`, dir: "up", hit: ["AFC", "ATC"], why: "Rent is a fixed cost: it raises AFC and so ATC, but not the cost of an extra unit." },
            { t: `${poss(f.n)} property-insurance premium doubles.`, dir: "up", hit: ["AFC", "ATC"], why: "Insurance is a fixed cost, so only AFC and ATC move." },
            { t: `${f.n} must pay its ${ws(f)} a higher hourly wage.`, dir: "up", hit: ["AVC", "ATC", "MC"], why: "Labor is the variable input, so the wage raises AVC, MC and therefore ATC; AFC is unchanged." },
            { t: `The price of the raw materials ${f.n} uses in every unit rises.`, dir: "up", hit: ["AVC", "ATC", "MC"], why: "Materials are a variable cost: AVC, MC and ATC rise; AFC does not." },
            { t: `${f.n} adopts a new technique that lets each ${f.w} produce more per hour.`, dir: "down", hit: ["AVC", "ATC", "MC"], why: "Higher productivity of the variable input lowers AVC and MC (and so ATC); fixed cost is unaffected." },
            { t: `${f.n} negotiates a lower rent on its building.`, dir: "down", hit: ["AFC", "ATC"], why: "A lower fixed cost lowers AFC and ATC only." },
          ];
          const s = U.pick(S);
          const all = ["AFC", "AVC", "ATC", "MC"];
          return Q.multi({
            q: `${s.t} Which of the firm's short-run cost curves shift <b>${s.dir}</b>? Select all that apply.`,
            options: all.map(c => ({ t: c, ok: s.hit.includes(c), why: s.hit.includes(c) ? null : `${c} does not depend on this cost.` })),
            sol: steps("Ask whether the cost is <b>fixed</b> (the same at every output) or <b>variable</b> (changes with output).",
              "A fixed-cost change moves AFC and ATC only. A variable-cost change (input price or productivity) moves AVC, MC and ATC.",
              s.why),
          });
        },
      },
      {
        name: "Read fixed cost off the graph",
        make() {
          for (let g = 0; g < 200; g++) {
            const v0 = U.pick([8, 10, 12, 14]), qm = U.pick([5, 6]), F = U.pick([24, 30, 36, 40, 48, 60, 72]);
            const cc = costCurves(v0, 0.25, qm, F);
            const yMax = niceMax(v0 * 3.2);
            const qs = [2, 3, 4, 5, 6, 8, 10].filter(q => F % q === 0 && F / q >= yMax * 0.12 && cc.ATC(q) <= yMax * 0.92);
            if (!qs.length) continue;
            const q = U.pick(qs);
            const avc = cc.AVC(q), atc = avc + F / q;
            const ans = F;
            return Q.num({
              q: `The graph shows a firm's short-run cost curves. The two marked points are on the ATC and AVC curves at an output of ${q}.${G.plot({ xLabel: "Output (Q)", yLabel: "Cost per unit ($)", xMax: 13, yMax, xTicks: [2, 4, 6, 8, 10, 12], yTicks: ticks(yMax, 4),
                curves: [(() => { const pts = clipPts(cc.MC, 0.5, 12.5, 0.25, yMax); return { pts, style: "main", label: "MC", labelAt: pts.length - 4 }; })(),
                  { pts: clipPts(cc.ATC, 0.5, 12.5, 0.25, yMax), style: "alt", label: "ATC", labelAt: 0 },
                  (() => { const pts = clipPts(cc.AVC, 0.5, 12.5, 0.25, yMax); return { pts, style: "dash", label: "AVC", labelAt: pts.length - 3 }; })()],
                points: [{ x: q, y: atc, label: m(atc) }, { x: q, y: avc, label: m(avc) }], aria: "Cost curves with marked ATC and AVC values" })}What is the firm's <b>total fixed cost</b>?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: F / q, why: "ATC − AVC is fixed cost <em>per unit</em> (AFC). Multiply by the output." },
                { value: atc * q, why: "ATC × Q is total cost. Subtract total variable cost (AVC × Q)." },
                { value: avc * q, why: "AVC × Q is total variable cost, not fixed cost." },
              ]),
              sol: steps("The vertical gap between ATC and AVC is AFC, and TFC = AFC × Q.",
                `AFC = ${m(atc)} − ${m(avc)} = ${m(F / q)}.`,
                `TFC = ${m(F / q)} × ${q} = <b>${m(ans)}</b>.`),
            });
          }
          throw new Error("graph TFC failed");
        },
      },
      {
        name: "Explain the shapes",
        make() {
          const S = [
            { q: "As output rises, the vertical distance between the ATC and AVC curves gets smaller. Why?", right: "The distance is AFC, and a fixed cost spread over more units gets smaller",
              wrong: [{ t: "Marginal cost is falling", why: "The gap is AFC, which depends only on TFC and Q, not on MC." }, { t: "Diminishing returns reduce variable cost", why: "Diminishing returns <em>raise</em> variable cost per unit eventually; the gap is about fixed cost." }, { t: "Fixed costs fall as the firm produces more", why: "Total fixed cost does not change; only fixed cost per unit falls." }] },
            { q: "Why does the AFC curve slope downward at every level of output?", right: "AFC = TFC ÷ Q, and TFC is constant, so dividing by a larger Q always gives a smaller number",
              wrong: [{ t: "Because of diminishing marginal returns", why: "Diminishing returns affect variable costs, not fixed cost." }, { t: "Because MC is below AFC", why: "AFC's shape does not depend on MC at all." }, { t: "Because fixed costs fall as output rises", why: "Total fixed cost stays the same; only the per-unit amount falls." }] },
            { q: "Why does the MC curve pass through the lowest point of the ATC curve?", right: "While MC is below ATC it pulls ATC down, and once MC is above ATC it pulls ATC up, so ATC bottoms out where they meet",
              wrong: [{ t: "It is a coincidence of the numbers in the table", why: "It always happens: it follows from how marginal and average values relate." }, { t: "Because MC is at its own minimum there", why: "MC reaches its minimum earlier, at a lower output." }, { t: "Because fixed costs are zero at that point", why: "Fixed costs are never zero in the short run." }] },
            { q: "Why is the minimum of ATC at a larger output than the minimum of AVC?", right: "ATC = AVC + AFC, and AFC keeps falling, so ATC keeps falling for a while after AVC has started to rise",
              wrong: [{ t: "Because MC crosses ATC before it crosses AVC", why: "MC crosses AVC first (at a lower output), then ATC." }, { t: "Because ATC excludes fixed cost", why: "ATC includes fixed cost; AVC excludes it." }, { t: "It is not: the two minimums are at the same output", why: "They coincide only if there is no fixed cost." }] },
          ];
          const s = U.pick(S);
          return Q.mc({
            q: s.q, right: s.right, wrong: s.wrong,
            sol: steps("Use two facts: ATC = AVC + AFC with AFC = TFC ÷ Q falling, and marginal values pull averages toward themselves.",
              `${s.right}.`),
          });
        },
      },
      {
        name: "Select all true statements about cost curves",
        make() {
          const opts = U.sample(CURVE_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(CURVE_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("MC crosses AVC and ATC at their minimums; AFC always falls; ATC − AVC = AFC.",
              "Fixed-cost changes move AFC and ATC; variable-cost changes move AVC, ATC and MC."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Marginal cost and marginal product
   * ============================================================ */
  const WAGES = [80, 96, 100, 120, 144, 150, 160, 180, 200, 240];
  const divisors = (w, lo, hi) => { const out = []; for (let d = lo; d <= hi; d++) if (w % d === 0) out.push(d); return out; };
  /* Six workers whose MPs divide the wage evenly: MP rises to a peak, then falls. */
  function mpSeq() {
    for (let g = 0; g < 200; g++) {
      const W = U.pick(WAGES);
      const ds = divisors(W, 3, 60);
      if (ds.length < 6) continue;
      const d = U.sample(ds, 6).sort((a, b) => a - b);
      const pat = U.pick([[1, 3, 5, 4, 2, 0], [2, 4, 5, 3, 1, 0], [0, 3, 5, 4, 2, 1], [1, 5, 4, 3, 2, 0]]);
      const MP = pat.map(i => d[i]);
      const TP = [0].concat(cum(MP));
      const peak = MP.indexOf(Math.max(...MP)) + 1;
      return { W, MP, TP, peak, MC: MP.map(x => W / x), f: firm() };
    }
    throw new Error("mpSeq failed");
  }
  const MCMP_TF = [
    { t: "If the wage is fixed, MC = wage ÷ MP.", ok: true },
    { t: "While marginal product is rising, marginal cost is falling.", ok: true },
    { t: "Once diminishing returns set in, marginal cost starts to rise.", ok: true },
    { t: "Marginal cost is lowest at the output where marginal product is highest.", ok: true },
    { t: "AVC = wage ÷ AP, so AVC is lowest where AP is highest.", ok: true },
    { t: "The rising part of the MC curve reflects diminishing marginal returns.", ok: true },
    { t: "When marginal product rises, marginal cost rises too.", ok: false, why: "They move in opposite directions: more output per worker means each unit costs less." },
    { t: "A higher wage moves the output at which MC is lowest.", ok: false, why: "A wage change rescales MC, but its low point stays where MP peaks." },
    { t: "Marginal cost depends only on the wage, not on productivity.", ok: false, why: "MC = W ÷ MP depends on both." },
    { t: "Diminishing returns make marginal cost fall.", ok: false, why: "Diminishing returns mean MP falls, so MC rises." },
  ];
  const genMcMp = STUDY.makeGenerator({
    id: "b251-m9-mcmp",
    name: "Marginal cost & marginal product",
    blurb: "Link costs to production: MC = wage ÷ MP, AVC = wage ÷ AP, and why diminishing returns make MC rise.",
    variants: [
      {
        name: "MC from the wage and MP",
        make() {
          const W = U.pick(WAGES), f = firm();
          const MPv = U.pick(divisors(W, 4, 40));
          const j = U.randInt(2, 6);
          const ans = W / MPv;
          return Q.num({
            q: `${f.n} pays each ${f.w} ${m(W)} a day, and labor is its only variable input. Hiring a ${ord(j)} ${f.w} raises output by <b>${MPv}</b> ${f.p} a day. What is the marginal cost of each of those ${f.p}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: W * MPv, why: "Divide the wage by the extra output; do not multiply." },
              { value: MPv / W, why: "That is output per dollar. MC is dollars per unit: wage ÷ MP." },
              { value: W, why: `${m(W)} buys ${MPv} extra units, so each unit costs a fraction of that.` },
            ]),
            sol: steps("The extra worker adds the wage to cost and her MP to output, so MC = ΔTC ÷ ΔQ = W ÷ MP.",
              `MC = ${m(W)} ÷ ${MPv} = <b>${m(ans)}</b> per ${f.s}.`),
          });
        },
      },
      {
        name: "MC from a production table",
        make() {
          const s = mpSeq();
          const j = U.randInt(2, 6);
          const ans = s.MC[j - 1];
          return Q.num({
            q: `${s.f.n} pays each ${s.f.w} ${m(s.W)} a day; labor is its only variable input.${tbl(["Workers", "Total product (per day)"], s.TP.map((t, L) => [L, U.fmt(t)]))}What is the marginal cost of the ${s.f.p} produced by the <b>${ord(j)} ${s.f.w}</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: s.W / s.TP[j], why: "Use the <em>extra</em> output of that worker (ΔTP), not total product." },
              { value: s.W * j / s.TP[j], why: "That is AVC (total wages ÷ total output). MC uses the change in output." },
              { value: s.W / (s.TP[j] - s.TP[j - 2]), why: "Compare with the previous row only: one worker's extra output." },
            ]),
            sol: steps("MC = W ÷ MP. Find the worker's MP first: MP = ΔTP.",
              `MP of the ${ord(j)} ${s.f.w} = ${U.fmt(s.TP[j])} − ${U.fmt(s.TP[j - 1])} = ${s.MP[j - 1]}.`,
              `MC = ${m(s.W)} ÷ ${s.MP[j - 1]} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "Direction: MP and MC move oppositely",
        make() {
          const f = firm();
          const S = [
            { q: `At ${f.n}, each new ${f.w} adds more output than the one before (the wage is constant). Over this range, marginal cost…`, ans: 0, why: "MP rising → each unit takes less labor → MC falls." },
            { q: `At ${f.n}, diminishing marginal returns have set in: each new ${f.w} adds less than the one before (the wage is constant). Over this range, marginal cost…`, ans: 1, why: "MP falling → each unit needs more labor → MC rises." },
            { q: `At ${f.n}, every additional ${f.w} adds exactly the same output as the one before (the wage is constant). Over this range, marginal cost…`, ans: 2, why: "Constant MP with a constant wage gives constant MC = W ÷ MP." },
            { q: `${poss(f.n)} marginal cost is rising as output expands, and the wage has not changed. What must be happening to the marginal product of ${ws(f)}?`, ans: 1, opts: ["MP is rising", "MP is falling", "MP is constant"], why: "MC = W ÷ MP rises with a fixed W only if MP falls: diminishing returns." },
          ];
          const s = U.pick(S);
          const choices = s.opts || ["Falls", "Rises", "Stays the same"];
          return {
            kind: "mc", q: s.q, choices, answer: s.ans,
            whys: choices.map((c, i) => (i === s.ans ? null : s.why)),
            sol: steps("With a constant wage, MC = W ÷ MP, so MC moves in the <b>opposite</b> direction to MP.", s.why),
          };
        },
      },
      {
        name: "MP from MC and the wage",
        make() {
          const W = U.pick(WAGES), f = firm();
          const MPv = U.pick(divisors(W, 4, 40));
          const MCv = W / MPv;
          return Q.num({
            q: `${f.n} pays ${m(W)} a day per ${f.w}. Over the range of output added by its newest ${f.w}, marginal cost is <b>${m(MCv)}</b> per ${f.s}. What is that ${poss(f.w)} marginal product?`,
            answer: MPv, unit: f.p,
            traps: traps(MPv, [
              { value: W * MCv, why: "Rearrange MC = W ÷ MP to MP = W ÷ MC; do not multiply." },
              { value: MCv / W, why: "Turn it the other way up: MP = W ÷ MC." },
              { value: MCv, why: "That is the marginal cost itself." },
            ]),
            sol: steps("MC = W ÷ MP, so MP = W ÷ MC.",
              `MP = ${m(W)} ÷ ${m(MCv)} = <b>${MPv}</b> ${f.p}.`),
          });
        },
      },
      {
        name: "Where is MC lowest?",
        make() {
          const s = mpSeq();
          const others = U.sample([1, 2, 3, 4, 5, 6].filter(j => j !== s.peak), 3);
          return Q.mc({
            q: `${s.f.n} pays each ${s.f.w} ${m(s.W)} a day. Marginal products of successive ${ws(s.f)}:${tbl(["Worker", "MP (per day)"], s.MP.map((x, i) => [ord(i + 1), x]))}Marginal cost is <b>lowest</b> for the output produced by which ${s.f.w}?`,
            right: `The ${ord(s.peak)} ${s.f.w}`, rightWhy: `MC = ${m(s.W)} ÷ ${s.MP[s.peak - 1]} = ${m(s.MC[s.peak - 1])}, the lowest because this MP is the highest.`,
            wrong: others.map(j => ({ t: `The ${ord(j)} ${s.f.w}`, why: `MC = ${m(s.W)} ÷ ${s.MP[j - 1]} = ${m(s.MC[j - 1])}, higher than for the ${ord(s.peak)} ${s.f.w}.` })),
            sol: steps("With a fixed wage, MC = W ÷ MP, so the lowest MC goes with the highest MP.",
              `MCs: ${s.MC.map((c, i) => `${ord(i + 1)} ${m(c)}`).join(", ")}. Lowest: the <b>${ord(s.peak)}</b> ${s.f.w}.`),
          });
        },
      },
      {
        name: "Effect of a wage change on MC",
        make() {
          const f = firm();
          for (let g = 0; g < 100; g++) {
            const [W1, W2] = U.sample(WAGES, 2);
            const common = divisors(W1, 4, 40).filter(d => W2 % d === 0);
            if (!common.length) continue;
            const MPv = U.pick(common);
            const ans = W2 / MPv;
            return Q.num({
              q: `${poss(f.n)} newest ${f.w} adds ${MPv} ${f.p} a day. The daily wage changes from ${m(W1)} to ${m(W2)}, with no change in productivity. What is the new marginal cost of those ${f.p}?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: W1 / MPv, why: "That is the MC at the old wage." },
                { value: W1 / MPv + (W2 - W1) > 0 ? W1 / MPv + (W2 - W1) : NaN, why: `The wage change is spread over the ${MPv} units the worker makes: MC changes by (ΔW) ÷ MP.` },
                { value: W2 * MPv, why: "Divide the wage by MP." },
              ]),
              sol: steps("MC = W ÷ MP. Productivity is unchanged, so only W changes.",
                `Old MC = ${m(W1)} ÷ ${MPv} = ${m(W1 / MPv)}. New MC = ${m(W2)} ÷ ${MPv} = <b>${m(ans)}</b>.`,
                `The whole MC curve shifts ${W2 > W1 ? "up" : "down"}, but its lowest point stays where MP is highest.`),
            });
          }
          throw new Error("wage change failed");
        },
      },
      {
        name: "AVC from average product",
        make() {
          const s = mpSeq();
          const L = U.randInt(2, 6);
          const ans = s.W * L / s.TP[L];
          return Q.num({
            q: `${s.f.n} pays each ${s.f.w} ${m(s.W)} a day; labor is its only variable input. With ${L} ${ws(s.f)}, it produces ${U.fmt(s.TP[L])} ${s.f.p} a day. What is its <b>average variable cost</b>? (Round to the nearest cent.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: s.W / s.TP[L], why: `Total variable cost is the wage bill for all ${L} workers, not one wage.` },
              { value: s.W * L, why: "That is total variable cost. Divide by output." },
              { value: s.W / s.MP[L - 1], why: "That is MC for the last worker's output (W ÷ MP). AVC uses AP." },
            ]),
            sol: steps("AVC = TVC ÷ Q = (W × L) ÷ TP = W ÷ AP.",
              `AP = ${U.fmt(s.TP[L])} ÷ ${L} = ${n2(s.TP[L] / L)}.`,
              `AVC = ${m(s.W)} ÷ ${n2(s.TP[L] / L)} = (${m(s.W)} × ${L}) ÷ ${U.fmt(s.TP[L])} = <b>${m(ans)}</b>.`),
          });
        },
      },
      {
        name: "Select all true statements about MC and MP",
        make() {
          const opts = U.sample(MCMP_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(MCMP_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("With a constant wage W: MC = W ÷ MP and AVC = W ÷ AP.",
              "So MC and MP move in opposite directions: MP up ↔ MC down; diminishing returns (MP down) ↔ MC up."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 9 — Long-run costs and economies of scale
   * ============================================================ */
  const ECO = "Economies of scale", CRS = "Constant returns to scale", DIS = "Diseconomies of scale";
  const SCALE_CAUSE_BANK = [
    { t: "In a bigger plant, each worker can specialize in one task", cat: ECO, why: "Specialization lowers cost per unit as scale grows." },
    { t: "Doubling the dimensions of a storage tank more than doubles its capacity", cat: ECO, why: "The dimensional factor: capacity grows faster than material cost." },
    { t: "Only a large operation can justify buying a fast, automated production line", cat: ECO, why: "Improved productive equipment pays off at large volumes." },
    { t: "A large bakery can run a continuous oven that a corner bakery could never keep busy", cat: ECO, why: "Better equipment becomes worthwhile at large scale." },
    { t: "A larger warehouse needs proportionally less wall and roof per cubic foot of storage", cat: ECO, why: "The dimensional factor lowers cost per unit." },
    { t: "A big hospital can employ full-time specialists for each kind of surgery", cat: ECO, why: "Specialization becomes possible at scale." },
    { t: "Layers of managers multiply, and decisions take weeks to approve", cat: DIS, why: "Management stops functioning efficiently as the firm grows." },
    { t: "Messages between plants on different continents get lost or distorted", cat: DIS, why: "Coordination and communication get harder with size." },
    { t: "Top executives can no longer keep track of what each division is doing", cat: DIS, why: "Limits to efficient management raise long-run average cost." },
    { t: "Departments duplicate each other's work because no one coordinates them", cat: DIS, why: "Coordination problems in very large firms raise costs." },
  ];
  const LR_TF = [
    { t: "The LRAC shows the lowest average cost of producing each output when all inputs can vary.", ok: true },
    { t: "The LRAC is the envelope of the short-run average cost curves.", ok: true },
    { t: "A short-run average cost curve touches the LRAC at its own minimum only at the LRAC's minimum point.", ok: true },
    { t: "Economies of scale make the LRAC slope downward.", ok: true },
    { t: "Diseconomies of scale can come from coordination problems in very large firms.", ok: true },
    { t: "The LRAC is U-shaped because of the law of diminishing returns.", ok: false, why: "Diminishing returns need a fixed input. The LRAC's shape comes from economies and diseconomies of scale." },
    { t: "Every short-run average cost curve touches the LRAC at the SAC's minimum point.", ok: false, why: "Only at the LRAC's minimum. Elsewhere the tangency is on the falling or rising part of the SAC." },
    { t: "In the long run, plant size is fixed.", ok: false, why: "In the long run all inputs, plant size included, can vary." },
    { t: "Constant returns to scale mean the LRAC is rising.", ok: false, why: "Constant returns mean a flat LRAC." },
    { t: "Specialization is a cause of diseconomies of scale.", ok: false, why: "Specialization is a source of economies of scale." },
  ];
  const genLongRun = STUDY.makeGenerator({
    id: "b251-m9-longrun",
    name: "Long-run costs & economies of scale",
    blurb: "Build the LRAC from plant sizes, identify economies, constant returns and diseconomies of scale, and explain the LRAC's shape.",
    variants: [
      {
        name: "Classify changes in long-run average cost",
        make() {
          const used = new Set();
          const items = [];
          const types = U.shuffle([ECO, CRS, DIS]).concat([U.pick([ECO, CRS, DIS])]);
          for (const type of types) {
            let it;
            for (let g = 0; g < 50; g++) {
              const q1 = U.pick([2, 4, 5, 10, 20]), k = U.pick([2, 3]);
              const q2 = q1 * k;
              const ac1 = U.pick([4, 5, 6, 8, 10, 12, 15]);
              const fac = type === ECO ? U.pick([0.75, 0.8, 0.9]) : type === CRS ? 1 : U.pick([1.1, 1.2, 1.25]);
              const ac2 = U.round(ac1 * fac, 2);
              const showTC = Math.random() < 0.6;
              const t = showTC
                ? `Raising output from ${U.fmt(q1 * 1000)} to ${U.fmt(q2 * 1000)} units (with the best plant for each) takes total cost from ${m(q1 * 1000 * ac1)} to ${m(q2 * 1000 * ac2)}`
                : `Growing from ${U.fmt(q1 * 1000)} to ${U.fmt(q2 * 1000)} units a month, with all inputs adjusted, ${ac1 === ac2 ? `leaves average cost unchanged at ${m(ac1)}` : `moves average cost from ${m(ac1)} to ${m(ac2)}`}`;
              if (used.has(t)) continue;
              used.add(t);
              it = { t, cat: type, why: `Average cost goes from ${m(ac1)} to ${m(ac2)} per unit: ${type === ECO ? "falling LRAC, so economies of scale" : type === CRS ? "unchanged, so constant returns to scale" : "rising LRAC, so diseconomies of scale"}.` };
              break;
            }
            if (it) items.push(it);
          }
          return Q.classify({
            q: "Each case describes a firm expanding in the long run. Classify it.",
            cats: [ECO, CRS, DIS], items,
            sol: steps("Compare <b>average</b> cost (total cost ÷ output) before and after, not total cost: total cost almost always rises with output.",
              "Average cost falls → economies of scale; unchanged → constant returns to scale; rises → diseconomies of scale."),
          });
        },
      },
      {
        name: "Causes of economies and diseconomies",
        make() {
          const items = [U.pick(SCALE_CAUSE_BANK.filter(i => i.cat === ECO)), U.pick(SCALE_CAUSE_BANK.filter(i => i.cat === DIS))];
          for (const x of U.deal("m9-scale", SCALE_CAUSE_BANK, 5)) if (items.length < 4 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Does each feature of a growing firm tend to cause economies or diseconomies of scale?",
            cats: [ECO, DIS], items,
            sol: steps("Economies of scale come from <b>specialization</b>, the <b>dimensional factor</b> and <b>improved productive equipment</b>.",
              "Diseconomies come from the <b>limits of management</b>: more layers of managers and harder coordination and communication."),
          });
        },
      },
      {
        name: "Pick the plant and read the LRAC",
        make() {
          for (let g = 0; g < 200; g++) {
            const step = U.pick([500, 1000, 2000]);
            const c = U.pick([0.4, 0.5, 0.6]);
            const plants = [{ n: "Small", base: U.randInt(48, 56) / 10, ctr: 1 }, { n: "Medium", base: U.randInt(38, 44) / 10, ctr: 3 }, { n: "Large", base: U.randInt(43, 50) / 10, ctr: 5 }];
            const val = (p, i) => U.round(p.base + c * (i - p.ctr) * (i - p.ctr), 2);
            const i = U.randInt(1, 5);
            const vs = plants.map(p => val(p, i));
            const lo = Math.min(...vs);
            if (vs.filter(v => Math.abs(v - lo) < 0.005).length > 1) continue;
            const best = plants[vs.indexOf(lo)];
            const otherVals = vs.filter(v => v !== lo);
            return Q.num({
              q: `A firm can build one of three plant sizes. Average total cost (per unit) at each output:${tbl(["Output per week"].concat(plants.map(p => p.n + " plant")), [1, 2, 3, 4, 5].map(k => [U.fmt(k * step)].concat(plants.map(p => m(val(p, k))))))}In the long run, what is the firm's <b>long-run average cost</b> of producing ${U.fmt(i * step)} units a week?`,
              answer: lo, unit: "$",
              traps: traps(lo, otherVals.map(v => ({ value: v, why: "In the long run the firm picks the plant with the <em>lowest</em> average cost at this output." }))
                .concat([{ value: Math.min(...plants.map(p => p.base)), why: "That is the lowest cost anywhere in the table, at a different output. The LRAC is the lowest cost at <em>this</em> output." },
                  { value: sum(vs) / 3, why: "Do not average the plants; choose the cheapest one." }])),
              sol: steps("The LRAC at each output is the lowest short-run average cost among all plant sizes, because in the long run the firm can build whichever plant it likes.",
                `At ${U.fmt(i * step)} units: ${plants.map((p, j) => `${p.n} ${m(vs[j])}`).join(", ")}.`,
                `Cheapest: the ${best.n.toLowerCase()} plant, so LRAC = <b>${m(lo)}</b>.`),
            });
          }
          throw new Error("plant failed");
        },
      },
      {
        name: "Read the LRAC graph",
        make() {
          const xMax = 100, qa = U.randInt(28, 38), qb = U.randInt(58, 70);
          const low = U.pick([3, 4, 5]), hi = low + U.pick([4, 5]);
          const fn = lracFn(qa, qb, low, hi, xMax);
          const zone = U.randInt(0, 2);
          const x = zone === 0 ? U.randInt(8, qa - 8) : zone === 1 ? U.randInt(qa + 5, qb - 5) : U.randInt(qb + 8, 94);
          const L = U.pick(["P", "R", "S", "T"]);
          const yMax = niceMax(hi * 1.05);
          const right = [ECO, CRS, DIS][zone];
          const WHY = { [ECO]: "LRAC is falling there.", [CRS]: "LRAC is flat there.", [DIS]: "LRAC is rising there." };
          return Q.mc({
            q: `The graph shows a firm's long-run average cost curve.${G.plot({ xLabel: "Output (thousands per year)", yLabel: "Average cost ($ per unit)", xMax, yMax, xTicks: [20, 40, 60, 80, 100], yTicks: ticks(yMax, 4),
              curves: [{ pts: range(2, 100, 1).map(q => [q, fn(q)]).filter(p => p[1] <= yMax), style: "main", label: "LRAC", labelAt: 2 }],
              points: [{ x, y: fn(x), label: L }], aria: "Long-run average cost curve with a marked point" })}At point ${L}, the firm is experiencing…`,
            right, rightWhy: WHY[right],
            wrong: [ECO, CRS, DIS].filter(t => t !== right).map(t => ({ t, why: `${t} would need ${t === ECO ? "a falling" : t === CRS ? "a flat" : "a rising"} LRAC. ${WHY[right]}` }))
              .concat([{ t: "Diminishing marginal returns", why: "Diminishing returns are a short-run idea (a fixed input). Along the LRAC every input is variable." }]),
            sol: steps("Along the LRAC, read the slope: falling → economies of scale; flat → constant returns; rising → diseconomies.",
              `At ${L} the LRAC is ${["falling", "flat", "rising"][zone]}, so the answer is <b>${right.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Why is the LRAC U-shaped?",
        make() {
          const S = [
            { q: "What explains the <b>downward-sloping</b> part of the LRAC curve?", right: "Economies of scale, such as specialization and better equipment at larger volumes",
              wrong: [{ t: "Increasing marginal returns to labor with a fixed plant", why: "That is a short-run idea. In the long run the plant is not fixed." }, { t: "Falling average fixed cost", why: "There are no fixed costs in the long run." }, { t: "Diseconomies of scale", why: "Diseconomies make the LRAC rise, not fall." }] },
            { q: "What explains the <b>upward-sloping</b> part of the LRAC curve?", right: "Diseconomies of scale: management and coordination become harder as the firm grows",
              wrong: [{ t: "The law of diminishing returns", why: "Diminishing returns need a fixed input; in the long run everything is variable." }, { t: "Rising fixed costs", why: "In the long run there are no fixed costs." }, { t: "Economies of scale", why: "Economies of scale make the LRAC fall." }] },
            { q: "Short-run ATC curves are U-shaped because of diminishing returns. Why is that explanation wrong for the LRAC?", right: "Diminishing returns require a fixed input, but in the long run all inputs can vary",
              wrong: [{ t: "Diminishing returns do not exist", why: "They are real, in the short run, when an input is fixed." }, { t: "The LRAC is not U-shaped", why: "The LRAC is typically U-shaped, just for a different reason." }, { t: "Because the LRAC includes fixed costs", why: "There are no fixed costs in the long run." }] },
          ];
          const s = U.pick(S);
          return Q.mc({
            q: s.q, right: s.right, wrong: s.wrong,
            sol: steps("Short-run U-shapes come from diminishing returns (one input fixed). The long-run U-shape comes from scale: economies first, then diseconomies.",
              `${s.right}.`),
          });
        },
      },
      {
        name: "Scale up all inputs",
        make() {
          const f = firm();
          const k = U.pick([2, 3]);
          const kind = U.randInt(0, 2);
          const j = kind === 0 ? k + U.pick([0.5, 1]) : kind === 1 ? k : k - U.pick([0.25, 0.5]);
          const txt = x => (x === 2 ? "doubles" : x === 3 ? "triples" : `rises ${U.fmt(x)}-fold`);
          const choices = ["LRAC falls: economies of scale", "LRAC is unchanged: constant returns to scale", "LRAC rises: diseconomies of scale"];
          const WHY = [
            "That needs output to grow by a larger proportion than the inputs.",
            "That needs output to grow in exactly the same proportion as the inputs.",
            "That needs output to grow by a smaller proportion than the inputs.",
          ];
          return {
            kind: "mc",
            q: `${f.n} ${txt(k)} <b>every</b> input: workers, machines and building space (input prices do not change). Its output ${txt(j)}. What happens to its long-run average cost?`,
            choices, answer: kind,
            whys: choices.map((_, i) => (i === kind ? null : WHY[i])),
            sol: steps("If all inputs rise by the same proportion at fixed prices, total cost rises by that proportion. Compare it with the rise in output.",
              `Cost × ${k}, output × ${U.fmt(j)}, so average cost × ${U.fmt(k)}/${U.fmt(j)} ${kind === 0 ? "&lt; 1 (falls)" : kind === 1 ? "= 1 (unchanged)" : "&gt; 1 (rises)"}: <b>${choices[kind]}</b>.`),
          };
        },
      },
      {
        name: "Read an LRAC table",
        make() {
          const step = U.pick([100, 500, 1000]);
          const nFall = U.randInt(2, 3), nFlat = U.randInt(2, 3), nRise = U.randInt(2, 3);
          const low = U.randInt(30, 60) / 10;
          const ac = [];
          let v = low;
          const falls = []; for (let i = 0; i < nFall; i++) falls.push(U.randInt(4, 12) / 10);
          let start = low + sum(falls);
          ac.push(start);
          for (const d of falls) { start = U.round(start - d, 2); ac.push(start); }
          for (let i = 0; i < nFlat; i++) ac.push(low);
          v = low; for (let i = 0; i < nRise; i++) { v = U.round(v + U.randInt(3, 10) / 10, 2); ac.push(v); }
          const Qs = ac.map((_, i) => (i + 1) * step);
          const iA = nFall, iB = nFall + nFlat;  /* LRAC equals the minimum from index iA to iB */
          const R = (a, b) => `From ${U.fmt(Qs[a])} to ${U.fmt(Qs[b])} units`;
          const ranges = { [ECO]: R(0, iA), [CRS]: R(iA, iB), [DIS]: R(iB, ac.length - 1) };
          const ask = U.pick([ECO, CRS, DIS]);
          const decoy = R(0, iB);
          return Q.mc({
            q: `A firm's long-run average cost at different outputs:${tbl(["Output per month", "LRAC"], Qs.map((q, i) => [U.fmt(q), m(ac[i])]))}Over which range of output does the firm experience <b>${ask.toLowerCase()}</b>?`,
            right: ranges[ask],
            wrong: [ECO, CRS, DIS].filter(t => t !== ask).map(t => ({ t: ranges[t], why: `Over that range the firm has ${t.toLowerCase()}.` }))
              .concat(ask === ECO || ask === CRS ? [{ t: decoy, why: "That range mixes falling and flat LRAC." }] : []),
            sol: steps("Read the direction of LRAC as output rises: falling → economies, flat → constant returns, rising → diseconomies.",
              `LRAC falls until ${U.fmt(Qs[iA])} units, stays at ${m(low)} until ${U.fmt(Qs[iB])} units, then rises. So ${ask.toLowerCase()}: <b>${ranges[ask].toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Select all true statements about long-run costs",
        make() {
          const opts = U.sample(LR_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(LR_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("The LRAC is the lowest cost per unit for each output with all inputs variable: the envelope of the short-run curves.",
              "Its shape comes from economies of scale (falling), constant returns (flat) and diseconomies of scale (rising), not from diminishing returns."),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m9", order: 9,
    title: "Module 9 · Firms: Structures, Production and Costs",
    short: "M9 · Costs",
    description: "Economic vs accounting profit, how firms are organized, the four market types, short-run production and costs, the MC–MP link, and long-run average cost with economies of scale.",
    notes, flashcards, cues,
    generators: [genProfit, genOrg, genMarkets, genRuns, genProduct, genCostTable, genCurves, genMcMp, genLongRun],
  });
})();
