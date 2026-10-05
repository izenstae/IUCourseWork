/* ============================================================
 * ECON B251 · Module 5 — Markets: Efficiency and Equity
 * Methods of allocating scarce resources (price vs non-price
 * rationing), value, willingness to pay, marginal benefit, demand
 * and consumer surplus; cost, minimum supply-price, marginal cost,
 * supply and producer surplus; efficient vs inefficient markets
 * (total surplus, MB = MC, under/overproduction, deadweight loss,
 * obstacles to efficiency); fairness based on results vs rules.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const PEOPLE = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix", "Noor", "Elias", "Ines", "Jonah"];
  const FIRMS = ["Northwind Works", "Bluepine Goods", "Redfern Co.", "Copperleaf Makers", "Maple & Stone", "Brightwater Mills",
    "Ironbark Supply", "Silverline Shop", "Oakridge Farm", "Harbor Lane Co."];
  /* Goods sold in bulk markets (linear demand and supply curves). */
  const MKT = [
    { s: "bag of coffee", p: "bags of coffee", per: "per week" }, { s: "bouquet", p: "bouquets", per: "per day" },
    { s: "smoothie", p: "smoothies", per: "per day" }, { s: "bike tune-up", p: "bike tune-ups", per: "per month" },
    { s: "pumpkin", p: "pumpkins", per: "per week" }, { s: "phone case", p: "phone cases", per: "per week" },
    { s: "car wash", p: "car washes", per: "per day" }, { s: "loaf of sourdough", p: "loaves of sourdough", per: "per day" },
    { s: "yoga class pass", p: "yoga class passes", per: "per month" }, { s: "pound of honey", p: "pounds of honey", per: "per week" },
    { s: "haircut", p: "haircuts", per: "per week" }, { s: "kayak rental", p: "kayak rentals", per: "per day" },
  ];
  /* One-of-a-kind items: each buyer wants at most one, each seller has one. */
  const ONE = [
    { s: "used road bike", where: "on an online marketplace" }, { s: "ticket to a sold-out show", where: "on a resale app" },
    { s: "vintage denim jacket", where: "at a weekend flea market" }, { s: "secondhand textbook", where: "on a campus swap board" },
    { s: "used game console", where: "through a neighborhood resale group" }, { s: "refurbished laptop", where: "at a campus tech sale" },
    { s: "hand-thrown mug", where: "at a craft fair" }, { s: "season parking permit", where: "on a student exchange board" },
  ];
  /* Goods one person buys several of (a marginal-benefit schedule). */
  const MULTI = [
    { s: "slice of pizza", p: "slices of pizza", per: "this week" }, { s: "round of mini-golf", p: "rounds of mini-golf", per: "this month" },
    { s: "bag of coffee beans", p: "bags of coffee beans", per: "this month" }, { s: "movie ticket", p: "movie tickets", per: "this month" },
    { s: "climbing-gym visit", p: "climbing-gym visits", per: "this month" }, { s: "iced tea", p: "iced teas", per: "this week" },
    { s: "paperback novel", p: "paperback novels", per: "this summer" }, { s: "car wash", p: "car washes", per: "this season" },
  ];
  /* Goods one producer makes several of (a marginal-cost schedule). */
  const MAKE = [
    { s: "birdhouse", p: "birdhouses", per: "a week" }, { s: "custom T-shirt", p: "custom T-shirts", per: "a day" },
    { s: "hour of tutoring", p: "hours of tutoring", per: "a week" }, { s: "tray of cupcakes", p: "trays of cupcakes", per: "a day" },
    { s: "garden bench", p: "garden benches", per: "a week" }, { s: "wooden cutting board", p: "wooden cutting boards", per: "a week" },
    { s: "dog walk", p: "dog walks", per: "a day" }, { s: "batch of candles", p: "batches of candles", per: "a week" },
  ];

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  const $ = x => U.money(x);
  // "an apple" but "a used bike", "a unit", "a one-time fee".
  const an = w => (/^(?:[aei]|o(?!ne)|u(?!s[aeiu]|ni|ti))/i.test(w) ? "an " : "a ") + w;
  const pl = (n, g) => (n === 1 ? g.s : g.p);
  const qty = (n, g) => `${U.fmt(n)} ${pl(n, g)}`;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));
  const list = a => (a.length <= 1 ? a.join("") : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  function tbl(head, rows) {
    return `<table class="data-tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  }
  /* Keep only traps that differ from the answer and from each other. */
  function traps(answer, arr) {
    const out = [];
    for (const t of arr) {
      if (!t || !Number.isFinite(t.value)) continue;
      if (Math.abs(t.value - answer) <= Math.max(0.02, Math.abs(answer) * 0.015)) continue;
      if (out.some(o => Math.abs(o.value - t.value) <= Math.max(0.011, Math.abs(t.value) * 0.01))) continue;
      out.push(t);
    }
    return out;
  }
  /* Distinct wrong MC options (by plain text), never equal to the right one. */
  function uniqWrong(right, arr) {
    const seen = new Set([U.plain(right)]);
    const out = [];
    for (const w of arr) { const k = U.plain(w.t); if (seen.has(k)) continue; seen.add(k); out.push(w); }
    return out;
  }
  /* k distinct integers in [a, b]. */
  function distinctInts(k, a, b) {
    const pool = [];
    for (let i = a; i <= b; i++) pool.push(i);
    return U.sample(pool, k);
  }
  const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-9; v += (s || 1)) o.push(U.round(v, 6)); return o; };

  /* G.plot plus shaded regions and free text labels, drawn in this file
   * (core.js has no fill helper). Regions sit under the curves; labels on top.
   *   regions: [{ pts: [[x, y], ...], tone: "cs"|"ps"|"dwl"|"spend"|"cost"|"n1"|"n2" }]
   *   labels:  [{ x, y, t }]  (data coordinates) */
  const TONE = {
    cs: ["var(--green)", 0.22], ps: ["var(--blue)", 0.22], dwl: ["var(--text-dim)", 0.35], spend: ["var(--amber)", 0.18],
    cost: ["var(--red)", 0.14], n1: ["var(--text-dim)", 0.10], n2: ["var(--text-dim)", 0.24],
  };
  function areaPlot(o, regions, labels) {
    let s = G.plot(o);
    const W = o.width || 420, H = o.height || 300, L = 58, R = 18, T = 16, B = 46;
    const pw = W - L - R, ph = H - T - B;
    const X = x => L + (x / o.xMax) * pw;
    const Y = y => T + ph - (y / o.yMax) * ph;
    const f = v => Math.round(v * 10) / 10;
    const polys = (regions || []).map(r => {
      const [col, op] = TONE[r.tone] || TONE.n1;
      return `<polygon points="${r.pts.map(p => `${f(X(p[0]))},${f(Y(p[1]))}`).join(" ")}" style="fill:${col};fill-opacity:${op};stroke:none"/>`;
    }).join("");
    const texts = (labels || []).map(t => `<text class="g-ptlabel" x="${f(X(t.x))}" y="${f(Y(t.y)) + 5}" text-anchor="middle">${t.t}</text>`).join("");
    s = s.replace('<line class="g-axis"', polys + '<line class="g-axis"');
    return s.replace("</svg>", texts + "</svg>");
  }
  const centroid = pts => [sum(pts.map(p => p[0])) / pts.length, sum(pts.map(p => p[1])) / pts.length];

  /* A linear market on a tick grid. Quantity = k·sq; demand P = a − d·k, supply P = c + s·k.
   * The equilibrium sits on whole ticks, so every corner of every triangle can be read off the axes. */
  function linMarket() {
    for (let g = 0; g < 200; g++) {
      const unit = U.pick([1, 1, 2, 5]);
      const sq = U.pick([5, 10, 10, 20, 50, 100]);
      const k = U.randInt(3, 6);
      const d = U.randInt(1, 2) * unit, s = U.randInt(1, 2) * unit;
      const c = U.randInt(0, 3) * unit;
      const p = c + s * k, a = p + d * k;
      if (a / unit > 14 || a / unit < 6) continue;
      const g0 = U.pick(MKT);
      return { unit, sq, k, d, s, c, p, a, Q: k * sq, g: g0,
        mb: kk => a - d * kk, mc: kk => c + s * kk,
        kMax: Math.min(10, Math.max(k + 2, Math.min(Math.ceil(a / d), 2 * k + 1))) };
    }
    return { unit: 1, sq: 10, k: 4, d: 1, s: 1, c: 2, p: 6, a: 10, Q: 40, g: MKT[0], mb: kk => 10 - kk, mc: kk => 2 + kk, kMax: 8 };
  }
  /* Plot options for a linear market. `show` picks which curves to draw ("D", "S" or "DS"). */
  function mktPlot(m, show, extra) {
    const xMax = m.kMax * m.sq, yMax = show === "S" ? m.c + m.s * m.kMax + m.unit : m.a + m.unit;
    const yStep = yMax / m.unit > 11 ? 2 * m.unit : m.unit;
    const base = range(yStep, yMax, yStep), req = [m.a].concat(show.includes("S") ? [m.c] : []).concat(show === "DS" ? [m.p] : []);
    const yTicks = mergeTicks(base, req, yStep);
    const curves = [];
    if (show.includes("D")) {
      const kEnd = Math.min(m.kMax, m.a / m.d);
      curves.push(seg([0, m.a], [kEnd * m.sq, m.a - m.d * kEnd], "main", show.includes("S") ? "D = MB" : "D"));
    }
    if (show.includes("S")) {
      const kEnd = Math.min(m.kMax, (yMax - m.c) / m.s);
      curves.push(...segS([0, m.c], [kEnd * m.sq, m.c + m.s * kEnd], show.includes("D") ? "S = MC" : "S", 0.75, xMax, yMax));
    }
    return Object.assign({
      xLabel: `${cap(m.g.p)} ${m.g.per}`, yLabel: "Price ($)",
      xMax, yMax, xTicks: range(m.sq, xMax, m.sq), yTicks, _yStep: yStep, _base: base, _req: req, curves, aria: "market graph",
    }, extra || {});
  }
  /* A straight curve with its label 80% of the way along, so it never runs off the plot edge. */
  const seg = (p0, p1, style, label, at) => {
    const t = at == null ? 0.8 : at;
    return { pts: [p0, [p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1])], p1], style, label, labelAt: 1 };
  };
  /* An upward-sloping line labelled just below and to the right of the point t of the way along it,
   * so the text never sits on top of the line. Returns two curves: spread it into a curves list. */
  const segS = (p0, p1, label, t, xMax, yMax) => {
    const x = p0[0] + t * (p1[0] - p0[0]), y = p0[1] + t * (p1[1] - p0[1]);
    return [{ pts: [p0, p1], style: "alt" }, { pts: [[x + 0.015 * xMax, y - 0.1 * yMax]], style: "alt", label, labelAt: 0 }];
  };
  /* Merge required ticks into the regular ones, dropping regular ticks that would crowd a required one. */
  function mergeTicks(base, req, stepv) {
    const need = req.filter(v => v > 0);
    const keep = base.filter(t => need.every(v => t === v || Math.abs(t - v) >= stepv * 0.6));
    return Array.from(new Set(keep.concat(need))).sort((a, b) => a - b);
  }
  const dashH = (x, y) => ({ pts: [[0, y], [x, y]], style: "dash" });
  const dashV = (x, y) => ({ pts: [[x, 0], [x, y]], style: "dash" });

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Who gets it? Methods of allocating scarce resources",
      lo: "Distinguish among the alternative methods of resource allocation, and compare price rationing with non-price rationing.",
      html: `<p>Scarcity means some people who want a good will not get it. Every society has to settle the <b>“for whom”</b> question: who ends up with the limited apartments, organ transplants, parking spaces, concert seats or hours of a surgeon's time? Whatever rule decides this is a <b>rationing mechanism</b>. There are nine common ones, often used in combination:</p>
<table class="data-tbl"><thead><tr><th>Method</th><th>Who gets the resource</th><th>Example</th></tr></thead><tbody>
<tr><td><b>Market price</b></td><td>Whoever is willing <em>and able</em> to pay the going price</td><td>Gasoline, groceries, most of what you buy</td></tr>
<tr><td><b>Command</b></td><td>Whoever an authority assigns it to</td><td>A manager assigns shifts; the army posts a soldier to a base</td></tr>
<tr><td><b>Majority rule</b></td><td>Whatever most voters choose</td><td>A town votes to turn a vacant lot into a park</td></tr>
<tr><td><b>Contest</b></td><td>The winner (or best performer)</td><td>A design competition picks one architect; a race prize</td></tr>
<tr><td><b>First-come, first-served</b></td><td>Whoever gets in line (or online) earliest</td><td>Free walk-in clinic slots, campsite reservations at 8 a.m.</td></tr>
<tr><td><b>Sharing equally</b></td><td>Everyone gets the same amount</td><td>Roommates split a pizza into equal slices</td></tr>
<tr><td><b>Lottery</b></td><td>Whoever is drawn at random</td><td>Hunting tags, charter-school seats, visa lotteries</td></tr>
<tr><td><b>Personal characteristics</b></td><td>People with the “right” traits</td><td>Senior discounts, a scholarship for students from one county</td></tr>
<tr><td><b>Force</b></td><td>Whoever can take it (or whoever the state's enforcement protects)</td><td>Theft and war, but also courts and police enforcing property rights</td></tr>
</tbody></table>
<p>Economists sort these into two families. <b>Price rationing</b> (the market) gives the good to the people who value it most, as shown by their willingness to pay, and that is why it is usually the most <b>efficient</b> method. <b>Non-price rationing</b> (everything else) lets everyone who <em>qualifies</em> have a chance, whether or not they can pay, so it is often defended as more <b>equitable</b>. The catch is that willingness to pay depends on ability to pay, and non-price methods waste resources of their own (hours in line, goods that end up with people who barely value them).</p>
<div class="keyidea"><b>Key idea.</b> Price rationing → goes to those willing and able to pay the most (efficiency). Non-price rationing → goes to those who qualify, by luck, speed, traits, votes or authority (equity).</div>
<div class="example"><b>Example.</b> A university has 500 parking permits and 2,000 students who want one. Selling them at whatever price clears the market (say $380 a semester) is <b>market price</b>. Drawing names is a <b>lottery</b>. Giving them to the first 500 online at 9 a.m. is <b>first-come, first-served</b>. Reserving them for students with disabilities or long commutes is <b>personal characteristics</b>. Having the parking office simply assign them is <b>command</b>.</div>
<div class="trap"><b>Common trap.</b> “Force” is not only crime and war. A legal system that uses the power of the state to protect property and enforce contracts is also allocation by force, and markets could not work without it. And “sharing equally” is not a lottery: in a lottery some people get everything and others nothing.</div>`,
      gens: ["b251-m5-alloc"],
    },
    {
      title: "Value, willingness to pay, marginal benefit and demand",
      lo: "Interrelate value, price, willingness to pay, marginal benefit and demand, and build market demand from individual demands.",
      html: `<p>Keep two words apart. <b>Value</b> is what you <em>get</em> from a good: the benefit to you. <b>Price</b> is what you <em>pay</em>. We measure the value of one more unit by the <b>most you would be willing to pay</b> for it, so:</p>
<p style="text-align:center"><b>value of the next unit = maximum willingness to pay (WTP) = marginal benefit (MB)</b></p>
<p>Because marginal benefit falls as you consume more, your willingness to pay for each extra unit falls too. List those amounts and you have your <b>demand</b>: at any price you keep buying as long as the next unit is worth more than the price. That is why a demand curve is also a <b>marginal benefit curve</b>: its height at any quantity is the WTP for that unit.</p>
<p><b>Individual demand</b> is the relationship between price and the quantity one person demands. <b>Market demand</b> is the relationship between price and the quantity demanded by <em>all</em> buyers. To build it, pick a price and <b>add up the quantities</b> each buyer demands at that price. On a graph, that is adding the individual curves <b>horizontally</b> (sideways, along the quantity axis).</p>
<div class="example"><b>Example.</b> Rhea and Tomas are the only buyers of cold brew in a small office. At $5 a bottle, Rhea wants 4 a week and Tomas wants 2; at $3, Rhea wants 7 and Tomas 5. Market quantity demanded is 4 + 2 = <b>6</b> at $5 and 7 + 5 = <b>12</b> at $3. Rhea's 4th bottle is worth at least $5 to her (she buys it at $5), but her 5th is worth less than $5 (she stops).</div>
<div class="keyidea"><b>Key idea.</b> WTP = MB = demand. Market demand adds quantities at each price (horizontal summation), never prices at each quantity.</div>
<div class="trap"><b>Common trap.</b> Adding prices “vertically” (Rhea's $5 + Tomas's $5 = $10 for 6 bottles) is wrong. At a given price every buyer faces the <em>same</em> price, so you hold the price fixed and add the quantities.</div>`,
      gens: ["b251-m5-demand", "b251-m5-concepts"],
    },
    {
      title: "Consumer surplus",
      lo: "Determine and illustrate consumer surplus for one buyer and for a market.",
      html: `<p>When you buy something for less than it is worth to you, you come out ahead. <b>Consumer surplus</b> is the value of a good minus the price paid for it, <b>summed over every unit bought</b>:</p>
<p style="text-align:center"><b>Consumer surplus on a unit = WTP (marginal benefit) − price paid</b></p>
<p>Only buyers whose WTP is above the price buy, so every unit actually bought adds a positive amount. On a graph, consumer surplus is the area <b>below the demand curve and above the price</b>, out to the quantity bought. With a straight-line demand curve it is a triangle, so <b>CS = ½ × quantity bought × (price where demand meets the price axis − price)</b>.</p>
${areaPlot({ xLabel: "Bottles of cold brew per day", yLabel: "Price ($)", xMax: 80, yMax: 16, xTicks: [10, 20, 30, 40, 50, 60, 70, 80], yTicks: [2, 4, 6, 8, 10, 12, 14, 16],
    curves: [seg([0, 14], [70, 0], "main", "D = MB"), dashH(30, 8), dashV(30, 8)],
    aria: "Consumer surplus triangle above the price and below demand" },
  [{ pts: [[0, 14], [0, 8], [30, 8]], tone: "cs" }, { pts: [[0, 8], [30, 8], [30, 0], [0, 0]], tone: "spend" }],
  [{ x: 9, y: 9.6, t: "CS" }, { x: 15, y: 4, t: "Spending" }])}
<div class="example"><b>Example.</b> Daily demand for cold brew at a campus kiosk is the straight line above: buyers would pay up to $14 for the first bottle, and each extra bottle is worth $0.20 less. At a price of $8, buyers take 30 bottles. Consumer surplus is ½ × 30 × ($14 − $8) = <b>$90</b>. Buyers spend $8 × 30 = <b>$240</b> (the rectangle). The total value they get from the 30 bottles is $90 + $240 = $330, the whole area under demand up to 30.<br><br>
For one person: Kofi would pay $6, $5 and $3 for a 1st, 2nd and 3rd bottle. At $4 he buys two (the 3rd is worth only $3) and his consumer surplus is ($6 − $4) + ($5 − $4) = <b>$3</b>.</div>
<div class="keyidea"><b>Key idea.</b> Consumer surplus is the net benefit buyers get beyond what they spend. A lower price raises it: existing buyers save on every unit, and new buyers enter.</div>
<div class="trap"><b>Common trap.</b> Three classic slips: forgetting the ½ in the triangle; reporting total value (WTP) instead of WTP − price; and counting buyers whose WTP is below the price. They do not buy, so they contribute zero, never a negative amount.</div>`,
      gens: ["b251-m5-cs", "b251-m5-graph"],
    },
    {
      title: "Cost, minimum supply-price, marginal cost and supply",
      lo: "Interrelate cost, price, minimum supply-price, marginal cost and supply, and build market supply from individual supplies.",
      html: `<p>On the selling side, <b>cost</b> is what a producer <em>gives up</em> to make a good, and <b>price</b> is what the producer <em>receives</em>. A firm will make one more unit only if the price covers the cost of that unit, so the <b>lowest price it will accept</b> for a unit, its <b>minimum supply-price</b>, equals its <b>marginal cost (MC)</b> of that unit:</p>
<p style="text-align:center"><b>minimum supply-price = marginal cost = supply</b></p>
<p>Marginal cost rises as output expands, so the minimum supply-price rises too, and the supply curve slopes upward. The height of a supply curve at any quantity is the MC of that unit.</p>
<p><b>Individual supply</b> is the price–quantity relationship for one producer; <b>market supply</b> is the relationship for <em>all</em> producers. As with demand, build market supply by fixing a price and <b>adding the quantities</b> each producer supplies (horizontal summation).</p>
<div class="example"><b>Example.</b> Two bakeries supply a farmers' market with loaves of sourdough. At $6 a loaf, Linden Bakery offers 40 and Crustworks offers 25, so market quantity supplied is <b>65</b>. If Linden's MC of its 41st loaf is $6.40, it will not bake it for $6. It would need at least $6.40.</div>
<div class="keyidea"><b>Key idea.</b> MC = minimum supply-price = supply. Market supply adds the quantities of all producers at each price.</div>
<div class="trap"><b>Common trap.</b> The minimum supply-price is <em>not</em> the price the seller actually gets. It is the floor the seller would accept. The gap between the two is the seller's gain (producer surplus, next lesson).</div>`,
      gens: ["b251-m5-ps", "b251-m5-concepts"],
    },
    {
      title: "Producer surplus",
      lo: "Determine and illustrate producer surplus for one seller and for a market.",
      html: `<p><b>Producer surplus</b> is the price received for a good minus its minimum supply-price (its marginal cost), <b>summed over every unit sold</b>:</p>
<p style="text-align:center"><b>Producer surplus on a unit = price received − marginal cost</b></p>
<p>On a graph it is the area <b>above the supply curve and below the price</b>, out to the quantity sold. The area <em>under</em> the supply curve is the cost of producing those units; revenue (price × quantity) is the cost plus the producer surplus. With a straight-line supply curve, <b>PS = ½ × quantity sold × (price − price where supply starts)</b>.</p>
${areaPlot({ xLabel: "Loaves of sourdough per day", yLabel: "Price ($)", xMax: 50, yMax: 12, xTicks: [10, 20, 30, 40, 50], yTicks: [2, 4, 6, 8, 10, 12],
    curves: [...segS([0, 2], [50, 12], "S = MC", 0.75, 50, 12), dashH(30, 8), dashV(30, 8)],
    aria: "Producer surplus triangle below the price and above supply" },
  [{ pts: [[0, 2], [0, 8], [30, 8]], tone: "ps" }, { pts: [[0, 0], [0, 2], [30, 8], [30, 0]], tone: "cost" }],
  [{ x: 8, y: 6.2, t: "PS" }, { x: 17, y: 2.3, t: "Cost" }])}
<div class="example"><b>Example.</b> Supply of sourdough at a market starts at $2 and rises $0.20 for each extra loaf. At $8 a loaf, bakers sell 30. Producer surplus is ½ × 30 × ($8 − $2) = <b>$90</b>. Revenue is $8 × 30 = $240, so the cost of baking those 30 loaves (the area under supply) is $240 − $90 = <b>$150</b>.<br><br>
For one seller: Mira can knit scarves at marginal costs of $9, $12 and $17. At a price of $15 she sells two (the 3rd would cost $17) and earns PS of ($15 − $9) + ($15 − $12) = <b>$9</b>.</div>
<div class="keyidea"><b>Key idea.</b> Producer surplus is what sellers receive beyond the cost of the units they sell. A higher price raises it.</div>
<div class="trap"><b>Common trap.</b> Producer surplus is not revenue (price × quantity) and it is not the area under the supply curve. It is the area <em>between</em> the price and the supply curve.</div>`,
      gens: ["b251-m5-ps", "b251-m5-graph"],
    },
    {
      title: "Efficient markets: total surplus and MB = MC",
      lo: "Explain why a competitive market at equilibrium is efficient and illustrate total surplus.",
      html: `<p>A resource allocation is <b>efficient</b> when it puts resources where they are valued most, so no change could make the gains from trade any larger. In a competitive market, equilibrium does exactly that:</p>
<ul>
  <li>At the equilibrium price, quantity demanded equals quantity supplied.</li>
  <li>The demand curve is the marginal benefit curve and the supply curve is the marginal cost curve, so at the equilibrium quantity <b>MB = MC</b>. That is the efficient quantity.</li>
  <li><b>Total surplus</b> = consumer surplus + producer surplus = the total value of the units traded minus their total cost. At the efficient quantity it is as large as it can be.</li>
</ul>
${areaPlot({ xLabel: "Bike tune-ups per month", yLabel: "Price ($)", xMax: 80, yMax: 20, xTicks: [10, 20, 30, 40, 50, 60, 70, 80], yTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    curves: [seg([0, 18], [80, 2], "main", "D = MB", 0.85), ...segS([0, 2], [80, 18], "S = MC", 0.85, 80, 20), dashH(40, 10), dashV(40, 10)],
    aria: "Consumer and producer surplus at equilibrium" },
  [{ pts: [[0, 18], [0, 10], [40, 10]], tone: "cs" }, { pts: [[0, 2], [0, 10], [40, 10]], tone: "ps" }],
  [{ x: 13, y: 12.7, t: "CS" }, { x: 13, y: 7.3, t: "PS" }])}
<div class="example"><b>Example.</b> In the market for bike tune-ups above, demand is P = 18 − 0.2Q and supply is P = 2 + 0.2Q. They cross at <b>40 tune-ups and $10</b>. CS = ½ × 40 × (18 − 10) = $160, PS = ½ × 40 × (10 − 2) = $160, so total surplus = <b>$320</b>. Notice the price only decides how the $320 is <em>split</em>: total surplus is also ½ × 40 × (18 − 2), the whole triangle between demand and supply.</div>
<p>Adam Smith's <b>invisible hand</b> is the idea behind this: buyers and sellers each pursue their own interest, nobody plans the outcome, and yet competitive markets send resources to their highest-valued uses.</p>
<div class="keyidea"><b>Key idea.</b> Competitive equilibrium ⇒ MB = MC ⇒ total surplus (CS + PS) is maximized ⇒ efficient.</div>
<div class="trap"><b>Common trap.</b> Efficiency is about the <em>size</em> of total surplus, not how it is divided. A higher price shifts surplus from buyers to sellers, but at the same quantity the total is unchanged.</div>`,
      gens: ["b251-m5-dwl", "b251-m5-graph"],
    },
    {
      title: "Underproduction, overproduction and deadweight loss",
      lo: "Differentiate and illustrate inefficient markets: underproduction, overproduction and deadweight loss.",
      html: `<p>A market is <b>inefficient</b> when it produces any quantity other than the one where MB = MC.</p>
<ul>
  <li><b>Underproduction</b> (too little): at quantities below the efficient one, MB &gt; MC. The units not produced were worth more to buyers than they would have cost, so value is lost.</li>
  <li><b>Overproduction</b> (too much): at quantities beyond the efficient one, MC &gt; MB. The extra units cost more to make than they are worth to anyone.</li>
</ul>
<p>Either way, total surplus shrinks. The fall in total surplus compared with the efficient outcome is the <b>deadweight loss</b>. It is a <b>social loss</b>: nobody gets it, not buyers, not sellers, not the government. On a graph it is the triangle between the demand (MB) and supply (MC) curves, from the actual quantity to the efficient quantity.</p>
${areaPlot({ xLabel: "Bike tune-ups per month", yLabel: "Price ($)", xMax: 80, yMax: 20, xTicks: [10, 20, 30, 40, 50, 60, 70, 80], yTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    curves: [seg([0, 18], [80, 2], "main", "D = MB", 0.85), ...segS([0, 2], [80, 18], "S = MC", 0.85, 80, 20), dashV(20, 14), dashV(60, 14)],
    aria: "Deadweight loss triangles from underproduction and overproduction" },
  [{ pts: [[20, 14], [20, 6], [40, 10]], tone: "dwl" }, { pts: [[60, 14], [60, 6], [40, 10]], tone: "dwl" }],
  [{ x: 27, y: 9.6, t: "DWL" }, { x: 53, y: 9.6, t: "DWL" }, { x: 20, y: 15.3, t: "under" }, { x: 60, y: 15.3, t: "over" }])}
<div class="example"><b>Example.</b> Same tune-up market (efficient quantity 40). If a rule caps the market at <b>20</b> tune-ups, the 20th tune-up has MB = 18 − 4 = $14 but MC = 2 + 4 = $6. The lost units between 20 and 40 form a triangle: DWL = ½ × (40 − 20) × ($14 − $6) = <b>$80</b>. If instead a program pushes output to <b>60</b>, the 60th tune-up has MC = $14 but MB = $6: DWL = ½ × (60 − 40) × ($14 − $6) = <b>$80</b> again. Total surplus falls from $320 to $240 in both cases.</div>
<div class="keyidea"><b>Key idea.</b> Deadweight loss = efficient total surplus − actual total surplus = ½ × (distance from the efficient quantity) × (gap between MB and MC at the actual quantity).</div>
<div class="trap"><b>Common trap.</b> Producing <em>more</em> is not always better. Beyond the efficient quantity each extra unit destroys value (MC &gt; MB), so overproduction creates a deadweight loss just as underproduction does.</div>`,
      gens: ["b251-m5-dwl", "b251-m5-graph"],
    },
    {
      title: "Obstacles to efficiency and alternatives to the market",
      lo: "Identify the obstacles that cause underproduction or overproduction and weigh non-market alternatives.",
      html: `<p>Competitive markets are efficient only under good conditions. Six obstacles push them to produce too little or too much:</p>
<table class="data-tbl"><thead><tr><th>Obstacle</th><th>What happens</th><th>Usual result</th></tr></thead><tbody>
<tr><td><b>Price and quantity regulations</b></td><td>Price ceilings or floors and production quotas stop the price or quantity from adjusting.</td><td>Usually underproduction (fewer trades happen)</td></tr>
<tr><td><b>Taxes and subsidies</b></td><td>A tax drives a wedge between what buyers pay and sellers get; a subsidy pays sellers or buyers extra.</td><td>Tax → underproduction; subsidy → overproduction</td></tr>
<tr><td><b>High transactions costs</b></td><td>The cost of finding a trading partner, negotiating and completing a deal (time, fees, paperwork).</td><td>Underproduction (worthwhile trades never happen)</td></tr>
<tr><td><b>Externalities</b></td><td>A cost or benefit falls on people outside the trade.</td><td>External cost (pollution) → overproduction; external benefit (vaccinations) → underproduction</td></tr>
<tr><td><b>Public goods and common resources</b></td><td>A public good benefits everyone whether or not they pay; a common resource is used by all and owned by none.</td><td>Public goods → underproduction; common resources → overuse</td></tr>
<tr><td><b>Monopoly</b></td><td>A single seller restricts output to raise its price.</td><td>Underproduction</td></tr>
</tbody></table>
<p>When a market fails, could a non-market method do better? Often the alternative is <b>majority rule</b> (voting for a policy). But majority rule has its own problems: a well-organized group pursuing its own interests can become the majority, and the decisions voters make must be carried out by officials who have agendas of their own. No single mechanism is perfect. The price mechanism is usually the most efficient, and it works best when supplemented by non-price methods where markets fall short.</p>
<div class="example"><b>Example.</b> A chemical plant dumps waste into a river, so the people downstream bear part of the cost of its output (an <b>externality</b>, overproduction). A city's fireworks show benefits everyone who can see the sky, so few would pay voluntarily (a <b>public good</b>, underproduction). A fishing ground that anyone can use gets overfished (a <b>common resource</b>). A cap of 300 taxi licenses in a growing city is a <b>quantity regulation</b> (underproduction).</div>
<div class="keyidea"><b>Key idea.</b> Regulations, taxes and subsidies, transactions costs, externalities, public goods and common resources, and monopoly are the obstacles to efficiency. Each causes underproduction or overproduction, and so a deadweight loss.</div>
<div class="trap"><b>Common trap.</b> Subsidies feel generous, but they push output <em>past</em> the efficient quantity: overproduction, with MC &gt; MB on the extra units. And a market failure does not automatically mean voting will fix it. Majority rule can be inefficient too.</div>`,
      gens: ["b251-m5-obstacles"],
    },
    {
      title: "Is the market fair? Results vs rules",
      lo: "Distinguish between fairness based on results and fairness based on rules.",
      html: `<p>Efficiency asks whether the pie is as big as possible. <b>Fairness</b> asks whether it is divided properly, and people disagree about what that means. The ideas fall into two groups.</p>
<p><b>1. “It's not fair if the <em>result</em> isn't fair.”</b> This view judges the outcome, usually the distribution of income. It grew out of <b>utilitarianism</b>, the principle that we should seek “the greatest happiness for the greatest number.” If everyone gets the same benefit from income, and the marginal benefit of a dollar falls as income rises, then moving a dollar from a richer person to a poorer one raises total benefit: the poor person gains more than the rich person loses. Followed all the way, the greatest total happiness comes only when income is <b>equal</b>.</p>
<p>The flaw: utilitarianism ignores the <b>cost of transfers</b>. Taxing income weakens the incentive to work, save and invest, and running transfer programs uses up resources, so redistributing shrinks the pie. That conflict is the <b>big tradeoff</b> between efficiency and fairness. Because of it, philosopher <b>John Rawls</b> proposed redistributing only to the point where the <b>poorest person is as well off as possible</b>: make the smallest slice as big as it can be, even if the slices are unequal.</p>
<p><b>2. “It's not fair if the <em>rules</em> aren't fair.”</b> This view judges the process. It rests on the <b>symmetry principle</b>: people in similar situations should be treated similarly. In economics this means <b>equality of opportunity</b>, not equality of income. <b>Robert Nozick</b> argued that fairness rests on two rules: (1) the state must create and enforce laws that establish and protect <b>private property</b>, and (2) property may change hands only through <b>voluntary exchange</b>. If the rules are fair, whatever result they produce is fair, so an efficient market allocation can also be a fair one.</p>
<div class="example"><b>Example.</b> Suppose an extra $1,000 is worth 50 units of benefit to Odette (income $18,000) but only 5 units to Hugo (income $240,000). A utilitarian moves $1,000 from Hugo to Odette: total benefit rises by 50 − 5 = 45. But if taxes and administration mean only $600 of Hugo's $1,000 reaches Odette, she gains about 30 while he loses 5, so the gain shrinks to 25. If the leak grows large enough, the transfer stops being worth making. Rawls would keep transferring as long as Odette, the poorest, ends up better off. Nozick would ask only whether Hugo earned his income through voluntary exchange; if so, taking it is unfair, whatever the incomes.</div>
<div class="keyidea"><b>Key idea.</b> Fair results: utilitarianism (equalize income), tempered by the big tradeoff and Rawls (make the poorest as well off as possible). Fair rules: the symmetry principle and Nozick (property rights + voluntary exchange; equal opportunity, not equal income).</div>
<div class="trap"><b>Common trap.</b> Rawls does not call for equal incomes. Because transfers shrink the pie, the poorest person can end up with more under some inequality than under complete equality. And the “fair rules” view does not care how unequal the outcome is, only how it came about.</div>`,
      gens: ["b251-m5-fairness"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m5-c-forwhom", tag: "Definition", front: "What is a rationing mechanism, and which scarcity question does it answer?", back: "The rule that decides <b>who gets</b> a scarce good. It answers the <b>“for whom”</b> question." },
    { id: "b251-m5-c-nine", tag: "Definition", front: "Name the nine methods of allocating scarce resources.", back: "Market price, command, majority rule, contest, first-come first-served, sharing equally, lottery, personal characteristics and force." },
    { id: "b251-m5-c-price-rat", tag: "Distinction", front: "Price rationing vs non-price rationing: who gets the good, and what is each method's strength?", back: "<b>Price</b>: those willing and able to pay the most, which makes it <b>efficient</b>. <b>Non-price</b>: those who qualify get a chance (by luck, speed, traits, votes or authority), which is often called more <b>equitable</b>." },
    { id: "b251-m5-c-command", tag: "Definition", front: "Allocation by <em>command</em>", back: "An authority (a manager, officer or planner) decides who gets what. It works when lines of authority are clear, but planners rarely know everyone's values and costs." },
    { id: "b251-m5-c-fcfs", tag: "Example", front: "Main cost of first-come, first-served?", back: "People spend time waiting or racing to be first. That time is used up and benefits no one, and the good goes to whoever is fastest, not whoever values it most." },
    { id: "b251-m5-c-force", tag: "Why", front: "Why is the legal system an example of allocation by <em>force</em>?", back: "The state uses its power (courts, police) to protect property and enforce contracts. Markets depend on it, even though force also includes theft and war." },
    { id: "b251-m5-c-value-price", tag: "Distinction", front: "Value vs price", back: "<b>Value</b> is what you get (the benefit), measured by your maximum willingness to pay. <b>Price</b> is what you pay." },
    { id: "b251-m5-c-wtp", tag: "Principle", front: "How are willingness to pay, marginal benefit and demand related?", back: "They are the same thing seen three ways: WTP for the next unit = its marginal benefit, and the demand curve plots it. The height of demand at a quantity = MB of that unit." },
    { id: "b251-m5-c-mktdemand", tag: "Definition", front: "Individual demand vs market demand, and how do you get one from the other?", back: "Individual: price vs quantity for <b>one</b> buyer. Market: price vs quantity for <b>all</b> buyers. Add the quantities each buyer demands at each price (<b>horizontal summation</b>)." },
    { id: "b251-m5-c-hsum", tag: "Calculation", front: "At $4, Ana demands 6 smoothies, Ben 3 and Cy 0. What is market quantity demanded at $4?", back: "6 + 3 + 0 = <b>9 smoothies</b>. Hold the price fixed and add the quantities. Cy's WTP is below $4, so he adds nothing." },
    { id: "b251-m5-c-cs", tag: "Definition", front: "Consumer surplus", back: "The value of a good (WTP) <b>minus the price paid</b>, summed over the units bought. On a graph: the area <b>below demand and above the price</b>, up to the quantity bought." },
    { id: "b251-m5-c-cs-calc", tag: "Calculation", front: "Linear demand meets the price axis at $20. At a price of $12, buyers take 40 units. Consumer surplus?", back: "½ × 40 × ($20 − $12) = <b>$160</b>. Don't forget the ½." },
    { id: "b251-m5-c-cs-one", tag: "Calculation", front: "Jo would pay $9, $7 and $4 for her 1st, 2nd and 3rd burrito. The price is $5. How many does she buy, and what is her consumer surplus?", back: "She buys <b>2</b> (the 3rd is worth $4, less than $5). CS = ($9 − $5) + ($7 − $5) = <b>$6</b>." },
    { id: "b251-m5-c-cs-price", tag: "Principle", front: "What happens to consumer surplus when the price falls?", back: "It <b>rises</b>: existing buyers pay less on every unit they already bought, and new buyers whose WTP is now above the price join in." },
    { id: "b251-m5-c-spend", tag: "Distinction", front: "Total value vs spending vs consumer surplus (demand graph)", back: "Total value = whole area under demand up to Q. Spending = price × Q (rectangle). Consumer surplus = total value − spending (triangle on top)." },
    { id: "b251-m5-c-cost-price", tag: "Distinction", front: "Cost vs price (for a producer)", back: "<b>Cost</b> is what the producer gives up to make the good. <b>Price</b> is what the producer receives." },
    { id: "b251-m5-c-msp", tag: "Principle", front: "How are minimum supply-price, marginal cost and supply related?", back: "The lowest price a firm will accept for one more unit = the <b>marginal cost</b> of that unit, and the supply curve plots it. Height of supply at a quantity = MC of that unit." },
    { id: "b251-m5-c-mktsupply", tag: "Definition", front: "How is market supply built from individual supplies?", back: "At each price, <b>add the quantities</b> every producer supplies (horizontal summation)." },
    { id: "b251-m5-c-ps", tag: "Definition", front: "Producer surplus", back: "The price received <b>minus the marginal cost</b> (minimum supply-price), summed over the units sold. On a graph: the area <b>above supply and below the price</b>, up to the quantity sold." },
    { id: "b251-m5-c-ps-calc", tag: "Calculation", front: "Linear supply starts at $3. At a price of $11, firms sell 50 units. Producer surplus? Cost of producing those units?", back: "PS = ½ × 50 × ($11 − $3) = <b>$200</b>. Revenue = $550, so cost (area under supply) = $550 − $200 = <b>$350</b>." },
    { id: "b251-m5-c-ps-trap", tag: "Why", front: "Is producer surplus the same as revenue?", back: "<b>No.</b> Revenue = price × quantity = cost of production (area under supply) + producer surplus." },
    { id: "b251-m5-c-tie", tag: "Example", front: "A buyer's WTP for a ticket is $50 and the price is $50. What is her consumer surplus if she buys?", back: "<b>$0.</b> She is indifferent between buying and not buying; the unit adds no surplus either way." },
    { id: "b251-m5-c-efficient", tag: "Principle", front: "Why is a competitive equilibrium efficient?", back: "Demand = MB and supply = MC, so at the equilibrium quantity <b>MB = MC</b>, and total surplus (CS + PS) is as large as possible." },
    { id: "b251-m5-c-ts", tag: "Definition", front: "Total surplus", back: "Consumer surplus + producer surplus = total value of the units traded − their total cost. Graphically, the area between demand and supply up to the quantity traded." },
    { id: "b251-m5-c-price-split", tag: "Why", front: "If the price rises but the quantity traded stays the same, what happens to total surplus?", back: "<b>Nothing.</b> Surplus moves from buyers to sellers, but the total (value − cost of the units traded) is unchanged. Price splits the pie; quantity sets its size." },
    { id: "b251-m5-c-hand", tag: "Principle", front: "What is Adam Smith's “invisible hand”?", back: "The idea that people pursuing their own interest in competitive markets end up sending resources to their <b>highest-valued uses</b>, without anyone planning it." },
    { id: "b251-m5-c-under-over", tag: "Distinction", front: "Underproduction vs overproduction: how do MB and MC compare?", back: "<b>Under</b>: Q below efficient, <b>MB &gt; MC</b> on the missing units. <b>Over</b>: Q above efficient, <b>MC &gt; MB</b> on the extra units." },
    { id: "b251-m5-c-dwl", tag: "Definition", front: "Deadweight loss", back: "The <b>decrease in total surplus</b> when output is not at the efficient quantity. It is a social loss that no one receives." },
    { id: "b251-m5-c-dwl-calc", tag: "Calculation", front: "Efficient Q = 50. Output is held at 30, where MB = $16 and MC = $6. Deadweight loss (straight-line curves)?", back: "½ × (50 − 30) × ($16 − $6) = <b>$100</b>." },
    { id: "b251-m5-c-obstacles", tag: "Definition", front: "List the six obstacles to efficiency in competitive markets.", back: "Price and quantity regulations; taxes and subsidies; high transactions costs; externalities; public goods and common resources; monopoly." },
    { id: "b251-m5-c-subsidy", tag: "Example", front: "Does a subsidy cause underproduction or overproduction?", back: "<b>Overproduction</b>: it pushes output past the quantity where MB = MC, so the extra units cost more than they are worth." },
    { id: "b251-m5-c-txcost", tag: "Definition", front: "Transactions costs", back: "The costs of making a trade happen: finding a partner, negotiating, paperwork, fees, time. When they are high, worthwhile trades don't happen → underproduction." },
    { id: "b251-m5-c-majority", tag: "Why", front: "Why might majority rule fail to fix an inefficient market?", back: "A self-interested group can become the majority, and voters' choices are carried out by officials with their own agendas." },
    { id: "b251-m5-c-two-views", tag: "Distinction", front: "The two broad views of fairness", back: "“It's not fair if the <b>result</b> isn't fair” (judge the outcome, e.g. income distribution) vs “it's not fair if the <b>rules</b> aren't fair” (judge the process)." },
    { id: "b251-m5-c-util", tag: "Principle", front: "Why does utilitarianism point toward equal incomes?", back: "If everyone benefits alike from income and the <b>marginal benefit of a dollar falls as income rises</b>, moving a dollar from rich to poor raises total benefit, until incomes are equal." },
    { id: "b251-m5-c-tradeoff", tag: "Definition", front: "The big tradeoff", back: "The tradeoff between <b>efficiency and fairness</b>: redistributing income uses resources and weakens incentives (taxes), so it shrinks the pie." },
    { id: "b251-m5-c-rawls", tag: "Principle", front: "What did John Rawls propose?", back: "Redistribute income only to the point where the <b>poorest person is as well off as possible</b> (make the smallest slice as big as it can be), not to full equality." },
    { id: "b251-m5-c-symmetry", tag: "Definition", front: "The symmetry principle", back: "People in similar situations should be treated similarly. In economics: <b>equality of opportunity</b>, not equality of income." },
    { id: "b251-m5-c-nozick", tag: "Principle", front: "Robert Nozick's two rules of fairness", back: "1) The state establishes and protects <b>private property</b>. 2) Property is transferred only by <b>voluntary exchange</b>. If the rules are fair, the result is fair." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“goes to whoever pays”, “highest bidder”", think: "Market price (price rationing)", why: "Goes to those willing and able to pay the most, which is efficient." },
    { when: "“in line”, “first 100”, “opens at 9 a.m.”", think: "First-come, first-served", why: "Order of arrival decides; waiting time is the cost." },
    { when: "“drawn at random”, “names in a hat”", think: "Lottery", why: "Chance decides, regardless of value." },
    { when: "“seniors only”, “residents of…”, “must be a veteran”", think: "Personal characteristics", why: "Traits decide who qualifies." },
    { when: "“the manager assigns”, “the agency decides”", think: "Command", why: "An authority allocates." },
    { when: "“most would pay”, “up to”, “worth to her”", think: "Value = WTP = marginal benefit", why: "Value is measured by maximum willingness to pay." },
    { when: "“lowest price she'd accept”, “cost of one more”", think: "Minimum supply-price = MC", why: "A seller won't sell a unit for less than its marginal cost." },
    { when: "“all buyers”, “the whole market” at a price", think: "Add quantities (horizontal summation)", why: "Everyone faces the same price, so sum the quantities." },
    { when: "“WTP minus price”, “area under demand above price”", think: "Consumer surplus", why: "Net benefit to buyers beyond what they pay." },
    { when: "“price minus cost”, “area above supply below price”", think: "Producer surplus", why: "What sellers get beyond their marginal cost." },
    { when: "straight-line curve, triangle area", think: "½ × base × height", why: "Base = quantity, height = price gap. Don't drop the ½." },
    { when: "“equilibrium”, “MB = MC”, “CS + PS largest”", think: "Efficient quantity", why: "Competitive equilibrium maximizes total surplus." },
    { when: "“capped at”, “restricted to”, MB &gt; MC", think: "Underproduction → deadweight loss", why: "Units worth more than they cost aren't produced." },
    { when: "“pushed to”, “subsidized”, MC &gt; MB", think: "Overproduction → deadweight loss", why: "Extra units cost more than they're worth." },
    { when: "pollution, free riders, overfishing, single seller", think: "Obstacle to efficiency", why: "Externality, public good, common resource, monopoly." },
    { when: "“greatest happiness”, “equal incomes”, “poorest”", think: "Fair results (utilitarianism, Rawls)", why: "Judges the outcome." },
    { when: "“property rights”, “voluntary exchange”, “equal opportunity”", think: "Fair rules (symmetry, Nozick)", why: "Judges the process, not the outcome." },
  ];

  /* ============================================================
   * PRACTICE 1 — Methods of resource allocation
   * ============================================================ */
  const MP = "Market price", CMD = "Command", MAJ = "Majority rule", CON = "Contest", FCFS = "First-come, first-served",
    SHARE = "Sharing equally", LOT = "Lottery", PERS = "Personal characteristics", FORCE = "Force";
  const METHODS = [MP, CMD, MAJ, CON, FCFS, SHARE, LOT, PERS, FORCE];
  const DESC = {
    [MP]: "Market price means the good goes to whoever is willing and able to pay the price.",
    [CMD]: "Command means an authority assigns the resource.",
    [MAJ]: "Majority rule means the choice follows a vote.",
    [CON]: "A contest means the winner or best performer gets the resource.",
    [FCFS]: "First-come, first-served means the earliest arrivals get the resource.",
    [SHARE]: "Sharing equally means everyone gets the same amount.",
    [LOT]: "A lottery means a random draw decides.",
    [PERS]: "Personal characteristics means only people with certain traits qualify.",
    [FORCE]: "Force means the resource goes to whoever can take it, or to whoever the state's enforcement power protects.",
  };
  const NP = { [MP]: "market price", [CMD]: "command", [MAJ]: "majority rule", [CON]: "a contest", [FCFS]: "first-come, first-served",
    [SHARE]: "sharing equally", [LOT]: "a lottery", [PERS]: "personal characteristics", [FORCE]: "force" };
  const DRAWBACK = {
    [MP]: "People who would benefit a lot but cannot afford the price go without",
    [CMD]: "The authority rarely knows who values the resource most or who can use it at the lowest cost",
    [MAJ]: "A majority that cares only a little can outvote a minority that cares a great deal",
    [CON]: "Only the winner is rewarded, and the losers' effort produces nothing for them",
    [FCFS]: "People burn time waiting or racing to be first, and that time benefits no one",
    [SHARE]: "Someone who barely wants the good gets as much as someone who wants it badly",
    [LOT]: "The good lands with whoever is drawn, who may value it far less than others",
    [PERS]: "It can shut out the people who would value or use the resource most, and can amount to discrimination",
    [FORCE]: "Taking resources by theft or war destroys value instead of creating it",
  };
  const ALLOC_BANK = [
    { t: "A gallery auctions a painting to the highest bidder.", cat: MP },
    { t: "Ride-share fares rise during a downpour, and only riders willing to pay the higher fare get cars.", cat: MP },
    { t: "A farm stand sells its last strawberries at $5 a basket to anyone who will pay it.", cat: MP },
    { t: "An airline sells its last few seats at whatever fare the buyers will pay.", cat: MP },
    { t: "A hospital administrator assigns the new MRI machine to the cardiology wing.", cat: CMD },
    { t: "A shift supervisor decides which employees work the holiday weekend.", cat: CMD },
    { t: "A national planning board decides how much steel each factory receives.", cat: CMD },
    { t: "A coach decides which players get the team's limited practice time.", cat: CMD },
    { t: "Residents vote on whether a vacant lot becomes a dog park or a parking lot.", cat: MAJ },
    { t: "A student senate votes to spend its budget on a spring concert instead of a speaker series.", cat: MAJ },
    { t: "Members of a housing co-op vote on which repair project gets the reserve fund.", cat: MAJ },
    { t: "A school district holds a referendum to decide whether to build a new pool.", cat: MAJ },
    { t: "A city awards a public-art commission to the winner of a design competition.", cat: CON },
    { t: "The top seller of the quarter wins a company-paid trip.", cat: CON },
    { t: "The fastest finisher in a marathon takes the prize money.", cat: CON },
    { t: "A research grant goes to the team whose proposal the judges score highest.", cat: CON },
    { t: "Free flu shots are given to the first 200 people in line on Saturday.", cat: FCFS },
    { t: "Campsites at a state park are booked by whoever logs on first when reservations open.", cat: FCFS },
    { t: "A food truck hands out free tacos until they run out, in order of arrival.", cat: FCFS },
    { t: "Rush tickets for a play go to whoever reaches the box office earliest.", cat: FCFS },
    { t: "Four roommates split a case of sparkling water so each gets the same number of cans.", cat: SHARE },
    { t: "During a drought, every household gets the same weekly water allotment.", cat: SHARE },
    { t: "A teacher divides a box of art supplies so every student gets an identical kit.", cat: SHARE },
    { t: "Hikers on a trip divide the remaining trail mix into equal portions.", cat: SHARE },
    { t: "A popular charter school picks its incoming class by drawing names.", cat: LOT },
    { t: "A state allocates elk-hunting permits by random draw among applicants.", cat: LOT },
    { t: "Seats in an oversubscribed course go to students picked by a random number generator.", cat: LOT },
    { t: "A housing authority assigns new affordable units by random selection.", cat: LOT },
    { t: "A museum offers free admission only to visitors over 65.", cat: PERS },
    { t: "A scholarship is open only to first-generation college students from one county.", cat: PERS },
    { t: "An apartment complex rents only to tenants aged 55 and over.", cat: PERS },
    { t: "A landlord rents only to applicants with a credit score above 700.", cat: PERS },
    { t: "A gang seizes control of a fishing pier and keeps others away.", cat: FORCE },
    { t: "Police remove a squatter so the owner can use her property.", cat: FORCE },
    { t: "One country invades another to take control of its oil fields.", cat: FORCE },
    { t: "A court orders a debtor's car repossessed and returned to the lender.", cat: FORCE },
  ];
  const ALLOC_TF = [
    { t: "Price rationing gives a good to the people who are willing and able to pay the most for it.", ok: true },
    { t: "Non-price rationing lets people who qualify have a chance at the good, whether or not they can pay a high price.", ok: true },
    { t: "Under first-come, first-served, the time people spend waiting is a real cost.", ok: true },
    { t: "A legal system that protects property rights is a form of allocation by force.", ok: true },
    { t: "Most economies use a combination of allocation methods, not just one.", ok: true },
    { t: "Price rationing is usually the most efficient method because goods go to those who value them most.", ok: true },
    { t: "A lottery gives the good to the people who value it most.", ok: false, why: "A lottery is random; winners may value the good little." },
    { t: "Sharing equally and a lottery are the same method.", ok: false, why: "Sharing gives everyone the same amount; a lottery gives some people all of it and others none." },
    { t: "Allocation by force always means theft or war.", ok: false, why: "The state's enforcement of property rights and contracts is also force." },
    { t: "Under price rationing, willingness to pay does not depend on ability to pay.", ok: false, why: "You can only show willingness to pay with money you have, so ability to pay matters." },
    { t: "Command allocation works well because planners always know who values each good most.", ok: false, why: "Planners rarely have that information, which is command's main weakness." },
    { t: "Majority rule takes into account how strongly each voter feels.", ok: false, why: "Each vote counts the same, however intense the preference." },
  ];
  const genAlloc = STUDY.makeGenerator({
    id: "b251-m5-alloc",
    name: "Methods of allocating resources",
    blurb: "Recognize the nine allocation methods, tell price from non-price rationing, and weigh efficiency against equity.",
    variants: [
      {
        name: "Classify allocation scenarios",
        make() {
          const ms = U.sample(METHODS, 5);
          const items = ms.map(m => { const it = U.pick(ALLOC_BANK.filter(b => b.cat === m)); return { t: it.t, cat: m, why: DESC[m] }; });
          return Q.classify({
            q: "Which method of allocation does each scenario use?",
            cats: METHODS, items,
            sol: steps("For each scenario ask one question: <em>what decides who gets it?</em> Money, an authority, a vote, winning, arriving first, equal shares, chance, traits, or power.",
              "Watch the edge cases: a court or police enforcing ownership is <b>force</b>; equal portions for everyone is <b>sharing equally</b>, not a lottery."),
          });
        },
      },
      {
        name: "Name the method",
        make() {
          const it = U.pick(ALLOC_BANK);
          const wrong = U.sample(METHODS.filter(m => m !== it.cat), 3).map(m => ({ t: m, why: DESC[m] + " That is not what decides it here." }));
          return Q.mc({
            q: `${it.t}<br>Which method of allocation is this?`,
            right: it.cat, wrong, rightWhy: DESC[it.cat],
            sol: steps("Find the deciding factor: who ends up with the resource, and why them?", `${DESC[it.cat]} So this is <b>${NP[it.cat]}</b>.`),
          });
        },
      },
      {
        name: "Price or non-price rationing?",
        make() {
          const price = U.sample(ALLOC_BANK.filter(b => b.cat === MP), U.randInt(1, 2));
          const non = U.sample(ALLOC_BANK.filter(b => b.cat !== MP), 5 - price.length);
          const items = price.map(b => ({ t: b.t, cat: "Price rationing", why: "Whoever pays the price gets it." }))
            .concat(non.map(b => ({ t: b.t, cat: "Non-price rationing", why: `This is ${NP[b.cat]}, not a price.` })));
          return Q.classify({
            q: "Classify each allocation as price rationing or non-price rationing.",
            cats: ["Price rationing", "Non-price rationing"], items,
            sol: steps("Price rationing: the good goes to whoever is willing and able to pay the market price.",
              "Every other method (command, votes, contests, lines, equal shares, lotteries, traits, force) is non-price rationing: you qualify some other way."),
          });
        },
      },
      {
        name: "Efficiency vs equity",
        make() {
          const v = U.pick([
            { q: "Under price rationing, who ends up with a scarce good?", right: "The people willing and able to pay the most for it",
              wrong: [{ t: "The people who need it most", why: "Need does not enter unless it shows up as willingness and ability to pay." },
                { t: "Whoever arrives first", why: "That is first-come, first-served, a non-price method." },
                { t: "A random selection of people who want it", why: "That is a lottery." }],
              sol: "Price rationing sorts buyers by willingness (and ability) to pay. That is why it is called efficient: the good goes to those who value it most in dollar terms." },
            { q: "Why do economists usually call price rationing the most <b>efficient</b> method?", right: "It sends the good to the people who value it most, as measured by their willingness to pay",
              wrong: [{ t: "It gives everyone an equal chance at the good", why: "That describes a lottery or other non-price methods, defended on equity grounds." },
                { t: "It guarantees that everyone gets some of the good", why: "Buyers whose WTP is below the price get none." },
                { t: "It makes the good free for those who need it", why: "Under price rationing everyone pays the price." }],
              sol: "Efficiency is about putting resources where they are valued most. Willingness to pay measures value, and the price screens out those who value the good less than the price." },
            { q: "Why is non-price rationing often defended as more <b>equitable</b>?", right: "Everyone who qualifies gets a chance at the good, whatever their ability to pay",
              wrong: [{ t: "It always sends the good to those who value it most", why: "Non-price methods ignore willingness to pay, so they often do not." },
                { t: "It wastes no resources at all", why: "Lines waste time, lotteries can misplace goods, and planners lack information." },
                { t: "It produces more of the good", why: "Rationing decides who gets the good, not how much is produced." }],
              sol: "Non-price methods decide by luck, order, traits, votes or authority. A poor buyer has the same shot as a rich one, which is the equity argument." },
            { q: "A city must decide who gets 200 subsidized garden plots. Which method would best serve the goal of giving every resident an <b>equal chance</b>, regardless of income?", right: LOT,
              wrong: [{ t: MP, why: "Selling to the highest bidders favors those able to pay." },
                { t: CON, why: "A contest favors the most skilled gardeners." },
                { t: FCFS, why: "Lines favor people with free time and flexible schedules." }],
              sol: "Only a random draw gives every applicant the same probability of getting a plot, independent of money, skill or free time." },
          ]);
          return Q.mc({ q: v.q, right: v.right, wrong: v.wrong, sol: steps("Price rationing ↔ efficiency (goes to the highest willingness to pay). Non-price rationing ↔ equity (everyone who qualifies has a chance).", v.sol) });
        },
      },
      {
        name: "Main drawback of a method",
        make() {
          const m = U.pick(METHODS);
          const wrong = U.sample(METHODS.filter(x => x !== m), 3).map(x => ({ t: DRAWBACK[x], why: `That is the main drawback of ${NP[x]}, not ${NP[m]}.` }));
          return Q.mc({
            q: `What is the main drawback of allocating a scarce resource by <b>${NP[m].replace(/^a /, "")}</b>?`,
            right: DRAWBACK[m], wrong,
            sol: steps(`Start from the rule itself. ${DESC[m]}`,
              `Ask who gets left out or what gets wasted. Here: ${DRAWBACK[m].charAt(0).toLowerCase() + DRAWBACK[m].slice(1)}.`),
          });
        },
      },
      {
        name: "Spot the price-rationed allocation",
        make() {
          const right = U.pick(ALLOC_BANK.filter(b => b.cat === MP));
          const wrong = U.sample(METHODS.filter(m => m !== MP), 3).map(m => { const b = U.pick(ALLOC_BANK.filter(x => x.cat === m)); return { t: b.t, why: `This is ${NP[m]}, a non-price method.` }; });
          const asNot = Math.random() < 0.5;
          return Q.mc({
            q: asNot ? "Which of these is <b>not</b> an example of non-price rationing?" : "Which of these allocations uses <b>price rationing</b>?",
            right: right.t, wrong, rightWhy: "The good goes to whoever is willing and able to pay the price, which is price rationing.",
            sol: steps("Look for the one case where paying the going price is what gets you the good.",
              "Everything else qualifies people by votes, authority, order, chance, traits, equal shares, winning or power."),
          });
        },
      },
      {
        name: "Select all true statements about allocation",
        make() {
          const opts = U.sample(ALLOC_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(ALLOC_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Price rationing: efficient, but tied to ability to pay. Non-price rationing: everyone who qualifies has a chance, but it has its own waste.",
              "Remember that force includes the legal system, and that a lottery and sharing equally are different methods."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Value, WTP & market demand
   * ============================================================ */
  /* A demand schedule: five prices (high → low), 2–3 buyers whose quantities rise as price falls. */
  function demandSched(nb, rising) {
    const ps = U.pick([1, 2, 5]);
    const p0 = U.randInt(1, 3) * ps;
    const prices = [4, 3, 2, 1, 0].map(i => p0 + i * ps);
    const scale = U.pick([1, 1, 5, 10]);
    const names = U.sample(PEOPLE, nb);
    const g = U.pick(MKT);
    const qs = names.map(() => {
      const out = [U.randInt(0, 2)];
      for (let i = 1; i < 5; i++) out.push(out[i - 1] + U.randInt(1, 4));
      return out.map(v => v * scale);
    });
    if (rising) qs.forEach(a => a.reverse());
    const mkt = prices.map((_, i) => sum(qs.map(a => a[i])));
    return { prices, names, qs, mkt, g, ps };
  }
  const DEM_TF = [
    { t: "The value of one more unit of a good is measured by the most a person is willing to pay for it.", ok: true },
    { t: "A demand curve is also a marginal benefit curve.", ok: true },
    { t: "Market demand is found by adding the quantities all buyers demand at each price.", ok: true },
    { t: "A buyer whose willingness to pay is below the price adds nothing to market quantity demanded at that price.", ok: true },
    { t: "Willingness to pay for each additional unit falls as a person consumes more, so demand slopes downward.", ok: true },
    { t: "Value is what you pay for a good; price is what you get from it.", ok: false, why: "Reversed: value is what you get, price is what you pay." },
    { t: "Market demand is found by adding the prices buyers would pay for each quantity.", ok: false, why: "That is vertical summation. Add quantities at each price instead." },
    { t: "The height of a demand curve at a quantity is the price the buyer actually pays for that unit.", ok: false, why: "It is the buyer's willingness to pay (marginal benefit) for that unit." },
    { t: "Market quantity demanded at a price is the average of the buyers' quantities at that price.", ok: false, why: "Quantities are added, not averaged." },
    { t: "If two buyers each demand 5 units at $8, the market demands 5 units at $16.", ok: false, why: "At $8 the market demands 5 + 5 = 10 units. Prices are not added." },
  ];
  const genDemand = STUDY.makeGenerator({
    id: "b251-m5-demand",
    name: "Value, WTP & market demand",
    blurb: "Connect willingness to pay, marginal benefit and demand, and build market demand by adding quantities across buyers.",
    variants: [
      {
        name: "Market quantity demanded from schedules",
        make() {
          const t = demandSched(U.pick([2, 3]));
          const i = U.randInt(0, 4);
          const ans = t.mkt[i];
          const j = i === 4 ? 3 : i + 1;
          return Q.num({
            q: `${list(t.names)} are the only buyers of ${t.g.p}. Their quantities demanded ${t.g.per}:${tbl(["Price", ...t.names], t.prices.map((p, r) => [$(p), ...t.qs.map(a => U.fmt(a[r]))]))}What is the <b>market</b> quantity demanded at <b>${$(t.prices[i])}</b>?`,
            answer: ans, unit: t.g.p, kind: "count",
            traps: traps(ans, [
              { value: Math.max(...t.qs.map(a => a[i])), why: "That is only the largest buyer. Market demand includes every buyer." },
              { value: t.mkt[j], why: `That is the market quantity at ${$(t.prices[j])}, a different row.` },
              { value: t.qs[0][i], why: `That is only ${t.names[0]}'s quantity.` },
              Number.isInteger(ans / t.names.length) ? { value: ans / t.names.length, why: "Market demand adds the quantities; it does not average them." } : null,
            ]),
            sol: steps("Market demand: hold the price fixed and add every buyer's quantity (horizontal summation).",
              `At ${$(t.prices[i])}: ${t.qs.map(a => U.fmt(a[i])).join(" + ")} = <b>${U.fmt(ans)} ${pl(ans, t.g)}</b>.`),
          });
        },
      },
      {
        name: "Missing buyer: work backward from the market",
        make() {
          const t = demandSched(3);
          const i = U.randInt(0, 4);
          const h = U.randInt(0, 2);
          const ans = t.qs[h][i];
          if (ans === 0) return this.make();
          const others = t.qs.filter((_, k) => k !== h).map(a => a[i]);
          return Q.num({
            q: `${list(t.names)} are the only buyers of ${t.g.p}. One entry is missing:${tbl(["Price", ...t.names, "Market"], t.prices.map((p, r) => [$(p), ...t.qs.map((a, k) => (k === h && r === i ? "?" : U.fmt(a[r]))), U.fmt(t.mkt[r])]))}How many ${t.g.p} does <b>${t.names[h]}</b> demand at <b>${$(t.prices[i])}</b>?`,
            answer: ans, unit: t.g.p, kind: "count",
            traps: traps(ans, [
              { value: t.mkt[i], why: "That is the whole market, not one buyer." },
              { value: t.mkt[i] - others[0], why: "You subtracted only one of the other two buyers." },
              { value: t.mkt[i] - others[1], why: "You subtracted only one of the other two buyers." },
              { value: t.mkt[i] + sum(others), why: "Market = sum of buyers, so subtract the others from the market total." },
            ]),
            sol: steps("Market quantity at a price = the sum of every buyer's quantity at that price, so work backward.",
              `${U.fmt(t.mkt[i])} − ${others.map(U.fmt.bind(U)).join(" − ")} = <b>${U.fmt(ans)}</b>.`),
          });
        },
      },
      {
        name: "Find the price for a market quantity",
        make() {
          const t = demandSched(2);
          // Never ask for a market quantity of 0: that is the trivially empty top row.
          const live = [0, 1, 2, 3, 4].filter(k => t.mkt[k] > 0);
          const i = U.pick(live);
          const right = $(t.prices[i]);
          const wrong = t.prices.map((p, k) => ({ p, k })).filter(o => o.k !== i).map(o => ({ t: $(o.p), why: `At ${$(o.p)} the market demands ${t.qs.map(a => U.fmt(a[o.k])).join(" + ")} = ${U.fmt(t.mkt[o.k])}.` }));
          return Q.mc({
            q: `${t.names[0]} and ${t.names[1]} are the only buyers of ${t.g.p}:${tbl(["Price", ...t.names], t.prices.map((p, r) => [$(p), ...t.qs.map(a => U.fmt(a[r]))]))}At what price is the <b>market</b> quantity demanded equal to <b>${qty(t.mkt[i], t.g)}</b>?`,
            right, wrong: U.sample(wrong, 3),
            sol: steps("First build the market column by adding the two buyers' quantities row by row.",
              `Market: ${t.prices.map((p, r) => `${$(p)} → ${U.fmt(t.mkt[r])}`).join(", ")}.`,
              `${qty(t.mkt[i], t.g)} are demanded at <b>${right}</b>.`),
          });
        },
      },
      {
        name: "Horizontal, not vertical, summation",
        make() {
          const [A, B] = U.sample(PEOPLE, 2);
          const g = U.pick(MKT);
          const p = U.randInt(3, 12);
          const a = U.randInt(2, 9), b = U.randInt(2, 9);
          if (a === b) return this.make();
          return Q.mc({
            q: `${A} and ${B} are the only buyers of ${g.p}. At a price of ${$(p)}, ${A} demands ${a} and ${B} demands ${b}. Which point must lie on the <b>market</b> demand curve?`,
            right: `${qty(a + b, g)} at ${$(p)}`,
            wrong: uniqWrong(`${qty(a + b, g)} at ${$(p)}`, [
              { t: `${qty(Math.max(a, b), g)} at ${$(2 * p)}`, why: "That adds the prices (vertical summation). Both buyers face the same price; add their quantities." },
              { t: `${qty(a + b, g)} at ${$(2 * p)}`, why: "Only quantities are added. The price stays the price each buyer faces." },
              { t: `${qty(Math.max(a, b), g)} at ${$(p)}`, why: "That counts only one buyer. The market includes both." },
              { t: `${U.fmt((a + b) / 2)} ${g.p} at ${$(p)}`, why: "Market demand adds quantities, it does not average them." },
            ]).slice(0, 3),
            sol: steps("Market demand at a price = sum of the quantities every buyer demands at that price.",
              `At ${$(p)}: ${a} + ${b} = <b>${a + b}</b>, so (${a + b}, ${$(p)}) is on the market demand curve. On a graph, the market curve is the individual curves added sideways.`),
          });
        },
      },
      {
        name: "Market demand when a buyer drops out",
        make() {
          const [A, B] = U.sample(PEOPLE, 2);
          const g = U.pick(MKT);
          const cA = U.randInt(10, 16), cB = U.randInt(4, cA - 3);
          const rA = U.randInt(1, 4), rB = U.randInt(2, 6);
          const both = Math.random() < 0.5;
          const P = both ? U.randInt(1, cB - 1) : U.randInt(cB + 1, cA - 1);
          const qA = rA * (cA - P), qB = Math.max(0, rB * (cB - P));
          const ans = qA + qB;
          return Q.num({
            q: `Two buyers make up the market for ${g.p}. ${A} buys nothing at ${$(cA)} or more, and each $1 the price falls below ${$(cA)} adds ${rA} to the quantity ${A} buys. ${B} buys nothing at ${$(cB)} or more, and each $1 below ${$(cB)} adds ${rB} to the quantity ${B} buys. What is the <b>market</b> quantity demanded at <b>${$(P)}</b>?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              both ? { value: qA, why: `${B} also buys at ${$(P)}, since it is below ${$(cB)}.` } : qA + rB * (cB - P) <= 0 ? null : { value: qA + rB * (cB - P), why: `${B} would demand a <em>negative</em> quantity by that formula. A buyer whose highest WTP is below the price simply buys zero.` },
              { value: qB || rB * (cA - P), why: `That leaves out ${A}.` },
              { value: (rA + rB) * (cA - P), why: `${B}'s demand starts at ${$(cB)}, not ${$(cA)}.` },
            ]),
            sol: steps("Find each buyer's quantity at the price, then add. A buyer whose top WTP is below the price buys zero, never a negative amount.",
              `${A}: ${rA} × (${cA} − ${P}) = ${qA}. ${B}: ${P < cB ? `${rB} × (${cB} − ${P}) = ${qB}` : `the price is at or above ${$(cB)}, so 0`}.`,
              `Market: ${qA} + ${qB} = <b>${ans} ${pl(ans, g)}</b>.${both ? "" : ` Above ${$(cB)} only ${A} is in the market, which is why market demand has a kink at ${$(cB)}.`}`),
          });
        },
      },
      {
        name: "Marginal benefit schedule → quantity demanded",
        make() {
          const who = U.pick(PEOPLE), g = U.pick(MULTI);
          const n = 6;
          const mb = distinctInts(n, 2, 30).sort((x, y) => y - x);
          const k = U.randInt(1, 5);
          if (mb[k - 1] - mb[k] < 2) return this.make();
          const price = U.randInt(mb[k] + 1, mb[k - 1] - 1);
          const ans = k;
          return Q.num({
            q: `The table shows the most ${who} would pay for each ${g.s} ${g.per}:${tbl(["Unit", ...mb.map((_, i) => ord(i + 1))], [["Willingness to pay", ...mb.map(v => $(v))]])}If the price is <b>${$(price)}</b>, how many ${g.p} does ${who} buy?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              { value: n - k, why: `Those are the units worth <em>less</em> than ${$(price)}. ${who} buys only units worth more than the price.` },
              { value: k + 1, why: `The ${ord(k + 1)} unit is worth only ${$(mb[k])}, less than the price.` },
              { value: n, why: "Not every unit is worth the price." },
            ]),
            sol: steps("Willingness to pay for each unit is its marginal benefit. Keep buying while the next unit's MB is above the price.",
              `MB is above ${$(price)} for the first ${k} ${U.plural(k, "unit")} (down to ${$(mb[k - 1])}); the ${ord(k + 1)} is worth ${$(mb[k])}.`,
              `So ${who} buys <b>${k}</b>. This is how a marginal benefit schedule becomes a demand curve.`),
          });
        },
      },
      {
        name: "Select all: value, WTP and demand",
        make() {
          const opts = U.sample(DEM_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(DEM_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Value = what you get = maximum WTP = marginal benefit = height of demand. Price = what you pay.",
              "Market demand adds quantities at each price (horizontal summation)."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Consumer surplus
   * ============================================================ */
  /* n buyers, each wanting one unit, with distinct WTPs; a price strictly between two of them (no ties). */
  function buyerList() {
    const n = U.randInt(5, 7);
    const names = U.sample(PEOPLE, n);
    const step0 = U.pick([1, 5, 10, 20]);
    const w = distinctInts(n, 2, 30).map(v => v * step0);
    const sorted = w.slice().sort((a, b) => b - a);
    const k = U.randInt(2, n - 1);                     // buyers who buy
    const hi = sorted[k - 1], lo = sorted[k];
    if (hi - lo < 2) return buyerList();
    const P = step0 >= 5 && hi - lo >= 2 * step0 ? lo + step0 * U.randInt(1, (hi - lo) / step0 - 1) : U.randInt(lo + 1, hi - 1);
    const item = U.pick(ONE);
    return { names, w, P, k, item };
  }
  const genCS = STUDY.makeGenerator({
    id: "b251-m5-cs",
    name: "Consumer surplus",
    blurb: "Compute consumer surplus for one buyer and for a market, from lists of willingness to pay and from straight-line demand curves.",
    variants: [
      {
        name: "How many buyers buy?",
        make() {
          const t = buyerList();
          const below = t.w.length - t.k;
          return Q.num({
            q: `Each of these people wants to buy one ${t.item.s} ${t.item.where} and has a maximum willingness to pay:${tbl(["Buyer", ...t.names], [["WTP", ...t.w.map($)]])}The price is <b>${$(t.P)}</b>. How many of them buy?`,
            answer: t.k, unit: "buyers", kind: "count",
            traps: traps(t.k, [
              { value: below, why: "Those are the people whose WTP is <em>below</em> the price. They don't buy." },
              { value: t.w.length, why: "Not everyone values the item above the price." },
            ]),
            sol: steps("A buyer buys only if the item is worth more to them than the price: WTP &gt; price.",
              `WTPs above ${$(t.P)}: ${t.w.filter(v => v > t.P).sort((a, b) => b - a).map($).join(", ")}.`,
              `That is <b>${t.k}</b> ${U.plural(t.k, "buyer")}.`),
          });
        },
      },
      {
        name: "Total consumer surplus from a list of buyers",
        make() {
          const t = buyerList();
          const buy = t.w.filter(v => v > t.P);
          const ans = sum(buy.map(v => v - t.P));
          return Q.num({
            q: `${cap(WORDS[t.names.length])} people each want to buy one ${t.item.s} ${t.item.where}. Their maximum willingness to pay:${tbl(["Buyer", ...t.names], [["WTP", ...t.w.map($)]])}Every ${t.item.s} sells for <b>${$(t.P)}</b>. What is the total <b>consumer surplus</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: sum(buy), why: "That is the total value (WTP) of the buyers. Subtract the price each one pays." },
              { value: sum(t.w.map(v => v - t.P)), why: "You included people whose WTP is below the price. They don't buy, so they add zero, not a negative amount." },
              { value: buy.length * t.P, why: "That is what the buyers spend, not their surplus." },
              { value: sum(t.w.filter(v => v > t.P).map(v => v - t.P)) + sum(t.w.filter(v => v < t.P).map(v => t.P - v)), why: "Non-buyers get no surplus at all." },
            ]),
            sol: steps("Only buyers with WTP above the price buy. Each buyer's consumer surplus = WTP − price.",
              `Buyers: ${buy.sort((a, b) => b - a).map($).join(", ")}.`,
              `CS = ${buy.map(v => `(${U.fmt(v)} − ${U.fmt(t.P)})`).join(" + ")} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "One buyer, several units",
        make() {
          const who = U.pick(PEOPLE), g = U.pick(MULTI);
          const mb = distinctInts(5, 1, 20).sort((x, y) => y - x);
          const k = U.randInt(2, 4);
          if (mb[k - 1] - mb[k] < 2) return this.make();
          const P = U.randInt(mb[k] + 1, mb[k - 1] - 1);
          const bought = mb.slice(0, k);
          const ans = sum(bought.map(v => v - P));
          return Q.num({
            q: `${who}'s marginal benefit from each ${g.s} ${g.per}:${tbl(["Unit", ...mb.map((_, i) => ord(i + 1))], [["Marginal benefit", ...mb.map($)]])}The price is <b>${$(P)}</b> each. What is ${who}'s total <b>consumer surplus</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: sum(mb.map(v => v - P)), why: "You subtracted the price from every unit, including ones worth less than the price. Those units aren't bought." },
              { value: sum(bought), why: "That is the total value of the units bought, before subtracting what was paid." },
              { value: mb[k - 1] - P, why: "That is the surplus on the last unit bought only. Add the surplus on every unit." },
              { value: mb[0] - P, why: "That is the surplus on the first unit only." },
            ]),
            sol: steps(`First find how many ${g.p} ${who} buys: every unit whose MB is above ${$(P)}.`,
              `MB &gt; ${$(P)} for the first ${k} units (${bought.map($).join(", ")}); the ${ord(k + 1)} is worth ${$(mb[k])}.`,
              `CS = ${bought.map(v => `(${U.fmt(v)} − ${U.fmt(P)})`).join(" + ")} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Consumer surplus triangle from linear demand",
        make() {
          const m = linMarket();
          const kq = U.randInt(2, Math.min(6, Math.floor(m.a / m.d) - 1));
          const P = m.a - m.d * kq, Qb = kq * m.sq;
          if (P <= 0) return this.make();
          const ans = 0.5 * Qb * (m.a - P);
          return Q.num({
            q: `The market demand curve for ${m.g.p} is a straight line. The most any buyer would pay for the first ${m.g.s} is ${$(m.a)}. At a price of <b>${$(P)}</b>, buyers purchase <b>${qty(Qb, m.g)}</b> ${m.g.per}. What is consumer surplus?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Qb * (m.a - P), why: "You forgot the ½. Consumer surplus under a straight-line demand curve is a triangle." },
              { value: P * Qb, why: "That is what buyers spend (price × quantity), not their surplus." },
              { value: 0.5 * Qb * m.a, why: "The height of the triangle is the price-axis intercept <em>minus</em> the price." },
              { value: 0.5 * Qb * P, why: "The triangle sits above the price, so its height is intercept − price, not the price." },
            ]),
            sol: steps("Consumer surplus is the triangle below demand and above the price, out to the quantity bought: ½ × base × height.",
              `Base = ${U.fmt(Qb)} ${m.g.p}. Height = ${$(m.a)} − ${$(P)} = ${$(m.a - P)}.`,
              `CS = ½ × ${U.fmt(Qb)} × ${U.fmt(m.a - P)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Change in consumer surplus when price falls",
        make() {
          const m = linMarket();
          const top = Math.min(6, Math.floor(m.a / m.d) - 1);
          if (top < 4) return this.make();
          const k1 = U.randInt(2, top - 1), k2 = U.randInt(k1 + 1, top);
          const P1 = m.a - m.d * k1, P2 = m.a - m.d * k2, Q1 = k1 * m.sq, Q2 = k2 * m.sq;
          if (P2 <= 0) return this.make();
          const cs1 = 0.5 * Q1 * (m.a - P1), cs2 = 0.5 * Q2 * (m.a - P2);
          const ans = cs2 - cs1;
          return Q.num({
            q: `Market demand for ${m.g.p} is a straight line starting at ${$(m.a)} on the price axis. At ${$(P1)}, buyers purchase ${U.fmt(Q1)} ${m.g.per}; at ${$(P2)}, they purchase ${U.fmt(Q2)}. If the price falls from <b>${$(P1)}</b> to <b>${$(P2)}</b>, by how much does consumer surplus <b>increase</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: cs2, why: "That is the new consumer surplus. The question asks for the change." },
              { value: Q1 * (P1 - P2), why: "That is only the saving to existing buyers (the rectangle). New buyers also gain the small triangle." },
              { value: 2 * ans, why: "You dropped the ½ in the triangle areas." },
              { value: Q2 * (P1 - P2), why: "The extra buyers only gain the triangle part, not the full price cut on every new unit." },
            ]),
            sol: steps("Compute consumer surplus at each price (½ × quantity × (intercept − price)), then subtract.",
              `Before: ½ × ${U.fmt(Q1)} × ${U.fmt(m.a - P1)} = ${$(cs1)}. After: ½ × ${U.fmt(Q2)} × ${U.fmt(m.a - P2)} = ${$(cs2)}.`,
              `Increase = ${$(cs2)} − ${$(cs1)} = <b>${$(ans)}</b>: ${$(Q1 * (P1 - P2))} saved by existing buyers plus ${$(ans - Q1 * (P1 - P2))} for the new buyers.`),
          });
        },
      },
      {
        name: "Work back to willingness to pay",
        make() {
          const who = U.pick(PEOPLE), it = U.pick(ONE);
          const P = U.randInt(4, 60) * 5, cs = U.randInt(1, 30) * 5;
          if (cs === P) return this.make();
          const ans = P + cs;
          return Q.num({
            q: `${who} bought ${an(it.s)} ${it.where} for ${$(P)}, and the purchase gave ${who} ${$(cs)} of consumer surplus. What is the <b>most</b> ${who} would have been willing to pay?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: P - cs, why: "Consumer surplus is WTP − price, so WTP = price <em>plus</em> surplus." },
              { value: cs, why: "That is the surplus, not the willingness to pay." },
              { value: P, why: "That is the price paid. Paying the maximum would leave zero surplus." },
            ]),
            sol: steps("Consumer surplus = WTP − price, so WTP = price + consumer surplus.",
              `WTP = ${$(P)} + ${$(cs)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Total value vs spending vs surplus",
        make() {
          const m = linMarket();
          const kq = U.randInt(2, Math.min(6, Math.floor(m.a / m.d) - 1));
          const P = m.a - m.d * kq, Qb = kq * m.sq;
          if (P <= 0) return this.make();
          const cs = 0.5 * Qb * (m.a - P), spend = P * Qb, ans = cs + spend;
          return Q.num({
            q: `Demand for ${m.g.p} is a straight line from ${$(m.a)} on the price axis. At a price of ${$(P)}, buyers purchase ${qty(Qb, m.g)} ${m.g.per}. What is the <b>total value</b> buyers get from those ${U.fmt(Qb)} ${m.g.p} (the whole area under the demand curve up to that quantity)?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: cs, why: "That is only consumer surplus, the part of value above what was paid." },
              { value: spend, why: "That is only spending. Total value = spending + consumer surplus." },
              { value: m.a * Qb, why: "Not every unit is worth the intercept price; WTP falls along the demand curve." },
            ]),
            sol: steps("The area under demand up to the quantity bought splits into two pieces: the spending rectangle (price × quantity) and the consumer-surplus triangle on top.",
              `Spending = ${$(P)} × ${U.fmt(Qb)} = ${$(spend)}. CS = ½ × ${U.fmt(Qb)} × ${U.fmt(m.a - P)} = ${$(cs)}.`,
              `Total value = ${$(spend)} + ${$(cs)} = <b>${$(ans)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Supply, marginal cost & producer surplus
   * ============================================================ */
  function sellerList() {
    const n = U.randInt(5, 7);
    const names = U.sample(PEOPLE, n);
    const step0 = U.pick([1, 5, 10, 20]);
    const c = distinctInts(n, 2, 30).map(v => v * step0);
    const sorted = c.slice().sort((a, b) => a - b);
    const k = U.randInt(2, n - 1);
    const lo = sorted[k - 1], hi = sorted[k];
    if (hi - lo < 2) return sellerList();
    const P = step0 >= 5 && hi - lo >= 2 * step0 ? lo + step0 * U.randInt(1, (hi - lo) / step0 - 1) : U.randInt(lo + 1, hi - 1);
    return { names, c, P, k, item: U.pick(ONE) };
  }
  const genPS = STUDY.makeGenerator({
    id: "b251-m5-ps",
    name: "Supply, marginal cost & producer surplus",
    blurb: "Link minimum supply-price to marginal cost and supply, add up market supply, and compute producer surplus from lists and straight-line supply curves.",
    variants: [
      {
        name: "How many sellers sell?",
        make() {
          const t = sellerList();
          return Q.num({
            q: `Each of these people owns one ${t.item.s} and would sell it ${t.item.where} for no less than:${tbl(["Seller", ...t.names], [["Minimum price", ...t.c.map($)]])}The market price is <b>${$(t.P)}</b>. How many of them sell?`,
            answer: t.k, unit: "sellers", kind: "count",
            traps: traps(t.k, [
              { value: t.c.length - t.k, why: "Those are the sellers whose minimum price is <em>above</em> the market price. They keep their item." },
              { value: t.c.length, why: "Not every seller can accept that price." },
            ]),
            sol: steps("A seller sells only if the price is above the lowest price they will accept (their marginal cost).",
              `Minimum prices below ${$(t.P)}: ${t.c.filter(v => v < t.P).sort((a, b) => a - b).map($).join(", ")}.`,
              `That is <b>${t.k}</b> ${U.plural(t.k, "seller")}.`),
          });
        },
      },
      {
        name: "Total producer surplus from a list of sellers",
        make() {
          const t = sellerList();
          const sell = t.c.filter(v => v < t.P);
          const ans = sum(sell.map(v => t.P - v));
          return Q.num({
            q: `${cap(WORDS[t.names.length])} people each have one ${t.item.s} to sell ${t.item.where}. The lowest price each will accept:${tbl(["Seller", ...t.names], [["Minimum price", ...t.c.map($)]])}Every ${t.item.s} sells for <b>${$(t.P)}</b>. What is the total <b>producer surplus</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: sell.length * t.P, why: "That is the sellers' total revenue, not their surplus." },
              { value: sum(t.c.map(v => t.P - v)), why: "You included sellers whose minimum is above the price. They don't sell, so they add zero, not a negative amount." },
              { value: sum(sell), why: "That is the sellers' total cost (sum of minimum prices), not their surplus." },
            ]),
            sol: steps("Only sellers whose minimum price is below the market price sell. Each earns producer surplus = price − minimum supply-price.",
              `Sellers: ${sell.sort((a, b) => a - b).map($).join(", ")}.`,
              `PS = ${sell.map(v => `(${U.fmt(t.P)} − ${U.fmt(v)})`).join(" + ")} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "One producer's marginal costs",
        make() {
          const who = U.pick(PEOPLE), g = U.pick(MAKE);
          const mc = distinctInts(5, 2, 30).sort((x, y) => x - y);
          const k = U.randInt(2, 4);
          if (mc[k] - mc[k - 1] < 2) return this.make();
          const P = U.randInt(mc[k - 1] + 1, mc[k] - 1);
          const sold = mc.slice(0, k);
          const ans = sum(sold.map(v => P - v));
          return Q.num({
            q: `${who} can produce up to five ${g.p} ${g.per}. The marginal cost of each:${tbl(["Unit", ...mc.map((_, i) => ord(i + 1))], [["Marginal cost", ...mc.map($)]])}The price is <b>${$(P)}</b> each. What is ${who}'s total <b>producer surplus</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: sum(mc.map(v => P - v)), why: "You counted units whose marginal cost is above the price. Those aren't produced." },
              { value: P * k, why: "That is revenue, not producer surplus." },
              { value: P - mc[k - 1], why: "That is the surplus on the last unit only." },
              { value: P - mc[0], why: "That is the surplus on the first unit only." },
            ]),
            sol: steps(`Marginal cost is the minimum supply-price of each unit. ${who} produces every unit whose MC is below ${$(P)}.`,
              `MC &lt; ${$(P)} for the first ${k} units (${sold.map($).join(", ")}); the ${ord(k + 1)} would cost ${$(mc[k])}.`,
              `PS = ${sold.map(v => `(${U.fmt(P)} − ${U.fmt(v)})`).join(" + ")} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Producer surplus triangle from linear supply",
        make() {
          const m = linMarket();
          const ks = U.randInt(2, 6);
          const P = m.c + m.s * ks, Qs = ks * m.sq;
          const ans = 0.5 * Qs * (P - m.c);
          return Q.num({
            q: `The market supply curve for ${m.g.p} is a straight line that meets the price axis at ${$(m.c)}${m.c === 0 ? " (it starts at the origin)" : ""}. At a price of <b>${$(P)}</b>, producers sell <b>${qty(Qs, m.g)}</b> ${m.g.per}. What is producer surplus?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Qs * (P - m.c), why: "You forgot the ½. Producer surplus above a straight-line supply curve is a triangle." },
              { value: P * Qs, why: "That is revenue (price × quantity), not producer surplus." },
              { value: 0.5 * Qs * P, why: m.c === 0 ? "—" : "The triangle's height is price − the supply curve's intercept, not the whole price." },
              { value: 0.5 * Qs * (P + m.c), why: "That is the cost of production (the area under supply), not producer surplus." },
            ].filter(x => x.why !== "—")),
            sol: steps("Producer surplus is the triangle above supply and below the price, out to the quantity sold: ½ × base × height.",
              `Base = ${U.fmt(Qs)}. Height = ${$(P)} − ${$(m.c)} = ${$(P - m.c)}.`,
              `PS = ½ × ${U.fmt(Qs)} × ${U.fmt(P - m.c)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Change in producer surplus when price rises",
        make() {
          const m = linMarket();
          const k1 = U.randInt(1, 4), k2 = U.randInt(k1 + 1, 6);
          const P1 = m.c + m.s * k1, P2 = m.c + m.s * k2, Q1 = k1 * m.sq, Q2 = k2 * m.sq;
          const ps1 = 0.5 * Q1 * (P1 - m.c), ps2 = 0.5 * Q2 * (P2 - m.c);
          const ans = ps2 - ps1;
          return Q.num({
            q: `Supply of ${m.g.p} is a straight line starting at ${$(m.c)} on the price axis. At ${$(P1)}, producers sell ${U.fmt(Q1)} ${m.g.per}; at ${$(P2)}, they sell ${U.fmt(Q2)}. If the price rises from <b>${$(P1)}</b> to <b>${$(P2)}</b>, by how much does producer surplus <b>increase</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: ps2, why: "That is the new producer surplus. The question asks for the change." },
              { value: Q1 * (P2 - P1), why: "That is only the gain on units already being sold. The extra units add a small triangle too." },
              { value: 2 * ans, why: "You dropped the ½ in the triangle areas." },
              { value: P2 * Q2 - P1 * Q1, why: "That is the change in revenue. Part of it covers the cost of the extra units." },
            ]),
            sol: steps("Compute producer surplus at each price (½ × quantity × (price − intercept)), then subtract.",
              `Before: ½ × ${U.fmt(Q1)} × ${U.fmt(P1 - m.c)} = ${$(ps1)}. After: ½ × ${U.fmt(Q2)} × ${U.fmt(P2 - m.c)} = ${$(ps2)}.`,
              `Increase = <b>${$(ans)}</b>: ${$(Q1 * (P2 - P1))} on the original units plus ${$(ans - Q1 * (P2 - P1))} on the new ones.`),
          });
        },
      },
      {
        name: "Work back to the minimum supply-price",
        make() {
          const firm = U.pick(FIRMS), g = U.pick(MAKE);
          const P = U.randInt(6, 60), ps = U.randInt(1, P - 2);
          const ans = P - ps;
          if (ans === ps) return this.make();
          return Q.num({
            q: `${firm} sells one more ${g.s} at the market price of ${$(P)} and earns producer surplus of ${$(ps)} on it. What is the <b>marginal cost</b> of that ${g.s}, the lowest price ${firm} would have accepted?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: P + ps, why: "Producer surplus = price − MC, so MC = price <em>minus</em> surplus." },
              { value: ps, why: "That is the surplus, not the cost." },
              { value: P, why: "That is the price received. The minimum supply-price is lower whenever there is surplus." },
            ]),
            sol: steps("Producer surplus = price − marginal cost, so marginal cost = price − producer surplus.",
              `MC = ${$(P)} − ${$(ps)} = <b>${$(ans)}</b>. That is also the firm's minimum supply-price for this unit.`),
          });
        },
      },
      {
        name: "Revenue = cost + producer surplus",
        make() {
          const m = linMarket();
          const ks = U.randInt(2, 6);
          const P = m.c + m.s * ks, Qs = ks * m.sq;
          const ps = 0.5 * Qs * (P - m.c), rev = P * Qs, ans = rev - ps;
          return Q.num({
            q: `Supply of ${m.g.p} is a straight line starting at ${$(m.c)} on the price axis. At a price of ${$(P)}, firms sell ${qty(Qs, m.g)} ${m.g.per}. What is the total <b>cost</b> of producing those ${m.g.p} (the area under the supply curve)?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: ps, why: "That is producer surplus, the part of revenue above cost." },
              { value: rev, why: "That is revenue. Revenue = cost + producer surplus." },
              { value: 0.5 * Qs * P, why: m.c === 0 ? "Close, but check: with supply starting at $0, cost is ½ × Q × P, so recheck your arithmetic." : "That ignores the rectangle under the supply curve's intercept." },
            ]),
            sol: steps("Revenue (price × quantity) splits into the cost of production (area under supply) and producer surplus (triangle above supply, below price).",
              `Revenue = ${$(P)} × ${U.fmt(Qs)} = ${$(rev)}. PS = ½ × ${U.fmt(Qs)} × ${U.fmt(P - m.c)} = ${$(ps)}.`,
              `Cost = ${$(rev)} − ${$(ps)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Market supply from individual supplies",
        make() {
          const t = demandSched(U.pick([2, 3]), true);
          const firms = U.sample(FIRMS, t.names.length);
          const i = U.randInt(0, 4);
          const ans = t.mkt[i];
          const j = i === 0 ? 1 : i - 1;
          return Q.num({
            q: `${list(firms)} are the only producers of ${t.g.p}. Their quantities supplied ${t.g.per}:${tbl(["Price", ...firms], t.prices.map((p, r) => [$(p), ...t.qs.map(a => U.fmt(a[r]))]))}What is the <b>market</b> quantity supplied at <b>${$(t.prices[i])}</b>?`,
            answer: ans, unit: t.g.p, kind: "count",
            traps: traps(ans, [
              { value: Math.max(...t.qs.map(a => a[i])), why: "That is only the largest producer. Market supply includes them all." },
              { value: t.mkt[j], why: `That is the market quantity at ${$(t.prices[j])}, a different row.` },
              Number.isInteger(ans / firms.length) ? { value: ans / firms.length, why: "Market supply adds quantities; it doesn't average them." } : null,
            ]),
            sol: steps("Market supply: hold the price fixed and add every producer's quantity supplied (horizontal summation).",
              `At ${$(t.prices[i])}: ${t.qs.map(a => U.fmt(a[i])).join(" + ")} = <b>${U.fmt(ans)} ${pl(ans, t.g)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Value, price & cost (concepts)
   * ============================================================ */
  const VPC_BANK = [
    { t: "The most a student would pay for a second coffee today", cat: "Marginal benefit (WTP)" },
    { t: "The height of the demand curve at the 40th unit", cat: "Marginal benefit (WTP)" },
    { t: "What one more streaming subscription is worth to a household", cat: "Marginal benefit (WTP)" },
    { t: "The top bid a collector is willing to make for a rare comic", cat: "Marginal benefit (WTP)" },
    { t: "The amount a diner would pay for dessert before deciding to skip it", cat: "Marginal benefit (WTP)" },
    { t: "The lowest price a plumber would accept to take one more job this week", cat: "Marginal cost (minimum supply-price)" },
    { t: "The height of the supply curve at the 40th unit", cat: "Marginal cost (minimum supply-price)" },
    { t: "What a farmer gives up to grow one more bushel of beans", cat: "Marginal cost (minimum supply-price)" },
    { t: "The least a seller would take for her used couch", cat: "Marginal cost (minimum supply-price)" },
    { t: "The extra cost a bakery incurs to bake one more cake", cat: "Marginal cost (minimum supply-price)" },
    { t: "The $4.50 printed on the café menu for a latte", cat: "Price" },
    { t: "The amount a buyer actually hands over at checkout", cat: "Price" },
    { t: "What the seller receives when the sale goes through", cat: "Price" },
    { t: "The going rate for a car wash in town this week", cat: "Price" },
  ];
  const CONC_TF = [
    { t: "Value is what a buyer gets from a good; price is what the buyer pays.", ok: true },
    { t: "A seller's minimum supply-price for a unit equals the marginal cost of producing it.", ok: true },
    { t: "A buyer who pays exactly her willingness to pay gets zero consumer surplus.", ok: true },
    { t: "When the market price rises, producer surplus increases and consumer surplus decreases.", ok: true },
    { t: "The price of a trade divides the gain between buyer and seller; it does not change the total gain from that trade.", ok: true },
    { t: "The height of the supply curve at a quantity is the marginal cost of that unit.", ok: true },
    { t: "Price and value are the same thing.", ok: false, why: "Value is the benefit you get (max WTP); price is what you pay. The gap is consumer surplus." },
    { t: "Producer surplus equals the firm's total revenue.", ok: false, why: "Revenue = cost of production + producer surplus." },
    { t: "A seller is willing to sell a unit for any price below its marginal cost.", ok: false, why: "Below MC the seller loses on that unit. MC is the lowest price she will accept." },
    { t: "Consumer surplus is the total amount buyers spend on a good.", ok: false, why: "Spending is price × quantity. Consumer surplus is value minus spending." },
    { t: "When the price falls, consumer surplus falls because each unit is cheaper.", ok: false, why: "A lower price raises consumer surplus: buyers keep more of the value." },
    { t: "Buyers whose willingness to pay is below the price have negative consumer surplus.", ok: false, why: "They don't buy, so their surplus is zero." },
  ];
  const CORRECT = [
    "Consumer surplus on a unit is its marginal benefit minus the price paid",
    "Producer surplus on a unit is the price received minus its marginal cost",
    "The demand curve shows buyers' marginal benefit at each quantity",
    "The supply curve shows sellers' marginal cost at each quantity",
    "The most a buyer is willing to pay for a unit measures its value to her",
  ];
  const INCORRECT = [
    { t: "Consumer surplus on a unit is the price paid minus its marginal benefit", why: "Reversed. CS = value (MB) − price." },
    { t: "Producer surplus on a unit is its marginal cost minus the price received", why: "Reversed. PS = price − MC." },
    { t: "The demand curve shows sellers' marginal cost at each quantity", why: "That is the supply curve." },
    { t: "The supply curve shows buyers' marginal benefit at each quantity", why: "That is the demand curve." },
    { t: "Value is what a buyer pays, and price is what she gets", why: "Reversed: value is what you get, price is what you pay." },
    { t: "A firm's minimum supply-price is the price it actually receives", why: "It is the lowest price the firm would accept (its MC); the actual price is usually higher." },
    { t: "Consumer surplus is the whole area under the demand curve", why: "That is total value. CS is only the part above the price." },
    { t: "Producer surplus is the whole area under the supply curve", why: "That is the cost of production. PS is the area above supply and below the price." },
  ];
  const genConcepts = STUDY.makeGenerator({
    id: "b251-m5-concepts",
    name: "Value, price & cost",
    blurb: "Keep value, price, willingness to pay, marginal benefit, marginal cost and minimum supply-price straight, and see how price splits the gains from trade.",
    variants: [
      {
        name: "Name each number in a trade",
        make() {
          const buyer = U.pick(PEOPLE), seller = U.pick(PEOPLE.filter(p => p !== buyer)), it = U.pick(ONE);
          let w, p, m;
          for (let g = 0; g < 100; g++) {
            const s0 = U.pick([1, 5, 10]);
            m = U.randInt(2, 30) * s0; p = m + U.randInt(1, 15) * s0; w = p + U.randInt(1, 15) * s0;
            const nums = [w, p, m, w - p, p - m];
            if (new Set(nums).size === 5) break;
          }
          const items = [
            { t: $(w), cat: "Value (WTP)", why: `${buyer}'s maximum willingness to pay is her value of the item.` },
            { t: $(p), cat: "Price", why: "The amount that changes hands is the price." },
            { t: $(m), cat: "Marginal cost (minimum supply-price)", why: `The least ${seller} would accept is her marginal cost.` },
            { t: $(w - p), cat: "Consumer surplus", why: `${$(w)} − ${$(p)}: value minus price.` },
            { t: $(p - m), cat: "Producer surplus", why: `${$(p)} − ${$(m)}: price minus marginal cost.` },
          ];
          return Q.classify({
            q: `${buyer} would pay up to ${$(w)} for ${seller}'s ${it.s}. ${seller} would accept no less than ${$(m)}. They agree on ${$(p)}. Match each amount to what it measures.`,
            cats: ["Value (WTP)", "Price", "Marginal cost (minimum supply-price)", "Consumer surplus", "Producer surplus"], items,
            sol: steps("Value = what the buyer gets (max WTP). Price = what changes hands. Marginal cost = the seller's floor.",
              `Consumer surplus = value − price = ${$(w)} − ${$(p)} = ${$(w - p)}. Producer surplus = price − MC = ${$(p)} − ${$(m)} = ${$(p - m)}.`),
          });
        },
      },
      {
        name: "What does the height of the curve measure?",
        make() {
          const dem = Math.random() < 0.5;
          const g = U.pick(MKT), n = U.randInt(2, 9) * 10, h = U.randInt(3, 40);
          return Q.mc({
            q: `On a graph of the market for ${g.p}, the ${dem ? "demand" : "supply"} curve is ${$(h)} high at a quantity of ${n}. What does that ${$(h)} tell you?`,
            right: dem ? `Some buyer is willing to pay at most ${$(h)} for the ${ord(n)} ${g.s}: its marginal benefit` : `Some seller would accept no less than ${$(h)} for the ${ord(n)} ${g.s}: its marginal cost`,
            wrong: dem ? [
              { t: `The ${ord(n)} ${g.s} costs ${$(h)} to produce`, why: "Cost is read off the supply curve, not demand." },
              { t: `Buyers spend ${$(h)} in total on ${n} ${g.p}`, why: "Total spending is price × quantity, an area, not a height." },
              { t: `Consumer surplus on the ${ord(n)} ${g.s} is ${$(h)}`, why: "CS on that unit is its MB minus the price, not MB alone." },
            ] : [
              { t: `Some buyer values the ${ord(n)} ${g.s} at ${$(h)}`, why: "Value is read off the demand curve, not supply." },
              { t: `Sellers earn ${$(h)} of producer surplus on the ${ord(n)} ${g.s}`, why: "PS on that unit is price minus MC, not MC alone." },
              { t: `Revenue from ${n} ${g.p} is ${$(h)}`, why: "Revenue is price × quantity, an area, not a height." },
            ],
            sol: steps(dem ? "Demand = marginal benefit = willingness to pay. The height at a quantity is the WTP for that unit." : "Supply = marginal cost = minimum supply-price. The height at a quantity is the MC of that unit.",
              dem ? `So ${$(h)} is the most anyone would pay for the ${ord(n)} unit.` : `So ${$(h)} is the least a seller would accept to supply the ${ord(n)} unit.`),
          });
        },
      },
      {
        name: "Which statement is correct?",
        make() {
          const right = U.pick(CORRECT);
          return Q.mc({
            q: "Which statement is correct?",
            right, wrong: U.sample(INCORRECT, 3),
            sol: steps("Pair the words: value / WTP / MB / demand on the buyer's side; cost / minimum supply-price / MC / supply on the seller's side.",
              "Surplus is always the gap between the price and the curve: MB − price for buyers, price − MC for sellers."),
          });
        },
      },
      {
        name: "Predict how a price change splits surplus",
        make() {
          const g = U.pick(MKT);
          const up = Math.random() < 0.5;
          const p1 = U.randInt(3, 20), p2 = up ? p1 + U.randInt(1, 5) : p1 - U.randInt(1, 2);
          const right = up ? "Consumer surplus falls; producer surplus rises" : "Consumer surplus rises; producer surplus falls";
          const opts = ["Consumer surplus rises; producer surplus falls", "Consumer surplus falls; producer surplus rises", "Both rise", "Both fall"];
          return Q.mc({
            q: `The market price of ${g.p} ${up ? "rises" : "falls"} from ${$(p1)} to ${$(p2)}, with the demand and supply curves themselves unchanged. What happens to consumer and producer surplus?`,
            right,
            wrong: opts.filter(o => o !== right).map(o => ({ t: o, why: o.startsWith("Both") ? "A price change moves the price line between the curves: one triangle grows and the other shrinks." : "That is the effect of a price change in the other direction." })),
            keepOrder: true,
            sol: steps("Consumer surplus is the area between demand and the price; producer surplus is the area between the price and supply.",
              up ? "A higher price line leaves less room under demand (CS falls) and more room above supply (PS rises)." : "A lower price line leaves more room under demand (CS rises) and less above supply (PS falls)."),
          });
        },
      },
      {
        name: "Gains from a single trade",
        make() {
          const buyer = U.pick(PEOPLE), seller = U.pick(PEOPLE.filter(p => p !== buyer)), it = U.pick(ONE);
          const s0 = U.pick([1, 5, 10]);
          const m = U.randInt(2, 30) * s0, p = m + U.randInt(1, 12) * s0, w = p + U.randInt(1, 12) * s0;
          const ask = U.pick(["cs", "ps", "total"]);
          const ans = ask === "cs" ? w - p : ask === "ps" ? p - m : w - m;
          const label = ask === "cs" ? `${buyer}'s consumer surplus` : ask === "ps" ? `${seller}'s producer surplus` : "the <b>total</b> surplus (consumer + producer) from the trade";
          return Q.num({
            q: `${buyer} values ${seller}'s ${it.s} at ${$(w)}. ${seller}'s marginal cost (the least ${seller} would accept) is ${$(m)}. They trade at ${$(p)}. What is ${label}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: w - p, why: "That is the buyer's surplus: value − price." },
              { value: p - m, why: "That is the seller's surplus: price − marginal cost." },
              { value: w - m, why: "That is the total gain: value − cost (the price cancels out)." },
              { value: w, why: "That is the buyer's value, before subtracting anything." },
              { value: p, why: "That is the price, not a surplus." },
            ]),
            sol: steps("Consumer surplus = value − price. Producer surplus = price − marginal cost.",
              `CS = ${$(w)} − ${$(p)} = ${$(w - p)}. PS = ${$(p)} − ${$(m)} = ${$(p - m)}. Total = ${$(w)} − ${$(m)} = ${$(w - m)}.`,
              `So the answer is <b>${$(ans)}</b>.${ask === "total" ? " Any price between the two would give the same total; price only decides the split." : ""}`),
          });
        },
      },
      {
        name: "Marginal benefit, marginal cost or price?",
        make() {
          const cats = ["Marginal benefit (WTP)", "Marginal cost (minimum supply-price)", "Price"];
          const items = cats.map(c => U.pick(VPC_BANK.filter(b => b.cat === c)));
          for (const e of U.deal("m5-vpc", VPC_BANK, 6)) if (items.length < 5 && !items.includes(e)) items.push(e);
          return Q.classify({
            q: "Classify each amount.",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: i.cat === "Price" ? "It is the amount that actually changes hands." : i.cat.startsWith("Marginal benefit") ? "It measures what a buyer would give for one more unit." : "It measures what a seller gives up for one more unit, the least she would accept." })),
            sol: steps("Buyer's side: the <em>most</em> someone would pay = value = marginal benefit (height of demand).",
              "Seller's side: the <em>least</em> someone would accept = marginal cost (height of supply). The price is what actually changes hands."),
          });
        },
      },
      {
        name: "Select all: value, price and cost",
        make() {
          const opts = U.sample(CONC_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(CONC_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Value (WTP, MB) vs price vs cost (MC, minimum supply-price). Surplus is the gap between the price and the relevant curve.",
              "Non-buyers and non-sellers have zero surplus, never negative."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Surplus on a graph
   * ============================================================ */
  function eqRegions(m) {
    const Qe = m.Q;
    const cs = [[0, m.a], [0, m.p], [Qe, m.p]];
    const ps = [[0, m.c], [0, m.p], [Qe, m.p]];
    const cost = m.c > 0 ? [[0, 0], [0, m.c], [Qe, m.p], [Qe, 0]] : [[0, 0], [Qe, m.p], [Qe, 0]];
    return { cs, ps, cost,
      at: { cs: centroid(cs), ps: centroid(ps), cost: [Qe * 0.62, (m.c + m.s * m.k * 0.62) * 0.42] } };
  }
  const CS_L = "Consumer surplus", PS_L = "Producer surplus", COST_L = "Cost of producing the units sold", REV_L = "Sellers' revenue (buyers' spending)", TS_L = "Total surplus";
  const genGraph = STUDY.makeGenerator({
    id: "b251-m5-graph",
    name: "Surplus on a graph",
    blurb: "Read demand and supply graphs: identify consumer surplus, producer surplus and costs, and compute triangle areas from the axes.",
    variants: [
      {
        name: "Identify a region",
        make() {
          const m = linMarket(), r = eqRegions(m);
          const L = U.shuffle(["A", "B", "C"]);
          const plot = areaPlot(mktPlot(m, "DS", { curves: mktPlot(m, "DS").curves.concat([dashH(m.Q, m.p), dashV(m.Q, m.p)]) }),
            [{ pts: r.cs, tone: "n1" }, { pts: r.ps, tone: "n2" }, { pts: r.cost, tone: "n1" }],
            [{ x: r.at.cs[0], y: r.at.cs[1], t: L[0] }, { x: r.at.ps[0], y: r.at.ps[1], t: L[1] }, { x: r.at.cost[0], y: r.at.cost[1], t: L[2] }]);
          const ask = U.pick([0, 1, 2]);
          const names = [CS_L.toLowerCase(), PS_L.toLowerCase(), "the cost of producing the units sold"];
          const why = [`${L[0]} lies below demand and above the price: consumer surplus.`, `${L[1]} lies above supply and below the price: producer surplus.`, `${L[2]} lies under the supply curve: the cost of producing the units sold.`];
          return Q.mc({
            q: `The market for ${m.g.p} is in equilibrium at ${$(m.p)} and ${U.fmt(m.Q)} ${m.g.p}.${plot}Which region shows <b>${names[ask]}</b>?`,
            right: `Region ${L[ask]}`,
            wrong: [0, 1, 2].filter(i => i !== ask).map(i => ({ t: `Region ${L[i]}`, why: why[i] })).concat([{ t: `Regions ${[L[1], L[2]].sort().join(" + ")}`, why: "Those two together are the sellers' revenue (price × quantity)." }].filter(() => ask !== 1 && ask !== 2)),
            sol: steps("Consumer surplus: between demand and the price. Producer surplus: between the price and supply. Under supply: the cost of production.",
              why[ask]),
          });
        },
      },
      {
        name: "Classify single and combined regions",
        make() {
          const m = linMarket(), r = eqRegions(m);
          const L = U.shuffle(["A", "B", "C"]);
          const plot = areaPlot(mktPlot(m, "DS", { curves: mktPlot(m, "DS").curves.concat([dashH(m.Q, m.p), dashV(m.Q, m.p)]) }),
            [{ pts: r.cs, tone: "n1" }, { pts: r.ps, tone: "n2" }, { pts: r.cost, tone: "n1" }],
            [{ x: r.at.cs[0], y: r.at.cs[1], t: L[0] }, { x: r.at.ps[0], y: r.at.ps[1], t: L[1] }, { x: r.at.cost[0], y: r.at.cost[1], t: L[2] }]);
          const two = (x, y) => `Areas ${[x, y].sort().join(" + ")}`;
          const pool = [
            { t: `Area ${L[0]}`, cat: CS_L, why: "Below demand, above the price." },
            { t: `Area ${L[1]}`, cat: PS_L, why: "Above supply, below the price." },
            { t: `Area ${L[2]}`, cat: COST_L, why: "Under the supply (MC) curve up to the quantity sold." },
            { t: two(L[1], L[2]), cat: REV_L, why: "Price × quantity: the whole rectangle under the price = cost + producer surplus." },
            { t: two(L[0], L[1]), cat: TS_L, why: "Consumer surplus + producer surplus." },
          ];
          return Q.classify({
            q: `The market for ${m.g.p} at its equilibrium:${plot}What does each area (or sum of areas) measure?`,
            cats: [CS_L, PS_L, COST_L, REV_L, TS_L], items: pool,
            sol: steps("Start with the single regions: between demand and price (CS), between price and supply (PS), under supply (cost).",
              "Then combine: the rectangle under the price is revenue = cost + PS; CS + PS is total surplus."),
          });
        },
      },
      {
        name: "Read a demand graph and compute consumer surplus",
        make() {
          const m = linMarket();
          const top = Math.min(m.kMax - 1, Math.floor((m.a - 1) / m.d));
          if (top < 2) return this.make();
          const kq = U.randInt(2, top), P = m.a - m.d * kq, Qb = kq * m.sq;
          const o = mktPlot(m, "D");
          o.curves.push(dashH(Qb, P), dashV(Qb, P));
          o.yTicks = mergeTicks(o._base, o._req.concat([P]), o._yStep);
          const ans = 0.5 * Qb * (m.a - P);
          return Q.num({
            q: `The graph shows market demand for ${m.g.p}. The price is ${$(P)} (dashed line).${G.plot(o)}What is consumer surplus?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Qb * (m.a - P), why: "You forgot the ½: the area is a triangle." },
              { value: P * Qb, why: "That is spending (the rectangle under the price)." },
              { value: 0.5 * Qb * m.a, why: "Height is intercept − price, not the intercept." },
              { value: 0.5 * Qb * P, why: "The triangle sits above the price line; its height is intercept − price." },
            ]),
            sol: steps("Read three numbers off the graph: where demand meets the price axis, the price, and the quantity bought at that price.",
              `Intercept = ${$(m.a)}, price = ${$(P)}, quantity = ${U.fmt(Qb)}.`,
              `CS = ½ × ${U.fmt(Qb)} × (${U.fmt(m.a)} − ${U.fmt(P)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Read a supply graph and compute producer surplus",
        make() {
          const m = linMarket();
          const top = m.kMax - 1;
          if (top < 2) return this.make();
          const ks = U.randInt(2, top), P = m.c + m.s * ks, Qs = ks * m.sq;
          const o = mktPlot(m, "S");
          o.curves.push(dashH(Qs, P), dashV(Qs, P));
          o.yTicks = mergeTicks(o._base, o._req.concat([P]), o._yStep);
          const ans = 0.5 * Qs * (P - m.c);
          return Q.num({
            q: `The graph shows market supply of ${m.g.p}. The price is ${$(P)} (dashed line).${G.plot(o)}What is producer surplus?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Qs * (P - m.c), why: "You forgot the ½: the area is a triangle." },
              { value: P * Qs, why: "That is revenue, not producer surplus." },
              { value: 0.5 * Qs * P, why: "Height is price − where supply starts, not the whole price." },
              { value: 0.5 * Qs * (P + m.c), why: "That is the cost of production (area under supply)." },
            ]),
            sol: steps("Read where supply meets the price axis, the price, and the quantity sold at that price.",
              `Supply starts at ${$(m.c)}, price = ${$(P)}, quantity = ${U.fmt(Qs)}.`,
              `PS = ½ × ${U.fmt(Qs)} × (${U.fmt(P)} − ${U.fmt(m.c)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Find the equilibrium, then the surplus",
        make() {
          const m = linMarket();
          const ask = U.pick(["cs", "ps", "ts"]);
          const cs = 0.5 * m.Q * (m.a - m.p), ps = 0.5 * m.Q * (m.p - m.c), ts = cs + ps;
          const ans = ask === "cs" ? cs : ask === "ps" ? ps : ts;
          const label = ask === "cs" ? "consumer surplus" : ask === "ps" ? "producer surplus" : "total surplus (consumer + producer)";
          return Q.num({
            q: `The graph shows demand and supply for ${m.g.p}. The market is competitive and settles at equilibrium.${G.plot(mktPlot(m, "DS"))}What is <b>${label}</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: 2 * ans, why: "You forgot the ½." },
              { value: cs, why: "That is consumer surplus." },
              { value: ps, why: "That is producer surplus." },
              { value: ts, why: "That is total surplus." },
              { value: m.p * m.Q, why: "That is spending (price × quantity)." },
            ]),
            sol: steps("Find the equilibrium where the curves cross, then read the intercepts.",
              `Equilibrium: ${$(m.p)} and ${U.fmt(m.Q)}. Demand starts at ${$(m.a)}; supply at ${$(m.c)}.`,
              `CS = ½ × ${U.fmt(m.Q)} × ${U.fmt(m.a - m.p)} = ${$(cs)}; PS = ½ × ${U.fmt(m.Q)} × ${U.fmt(m.p - m.c)} = ${$(ps)}; total = ${$(ts)}. Answer: <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Which areas change when the price falls?",
        make() {
          const m = linMarket();
          const top = Math.min(m.kMax - 1, Math.floor((m.a - m.unit) / m.d));
          if (top < 4) return this.make();
          const k1 = U.randInt(2, top - 1), k2 = U.randInt(k1 + 1, top);
          if (m.d === m.unit && k2 - k1 < 2) return this.make();
          const P1 = m.a - m.d * k1, P2 = m.a - m.d * k2, Q1 = k1 * m.sq, Q2 = k2 * m.sq;
          const Lm = U.shuffle(["A", "B", "C", "D"]);
          const R = { A: [[0, m.a], [0, P1], [Q1, P1]], B: [[0, P1], [Q1, P1], [Q1, P2], [0, P2]], C: [[Q1, P1], [Q1, P2], [Q2, P2]], D: [[0, P2], [Q2, P2], [Q2, 0], [0, 0]] };
          const keys = ["A", "B", "C", "D"], lab = k => Lm[keys.indexOf(k)];
          const combo = ks => { const s = ks.map(lab).sort(); return (s.length > 1 ? "Areas " : "Area ") + s.join(" + "); };
          const o = mktPlot(m, "D");
          o.curves.push(dashH(Q1, P1), dashH(Q2, P2), dashV(Q1, P1), dashV(Q2, P2));
          o.yTicks = mergeTicks(o._base, o._req.concat([P1, P2]), o._yStep);
          const plot = areaPlot(o, keys.map((k, i) => ({ pts: R[k], tone: i % 2 ? "n2" : "n1" })),
            keys.map(k => { const c = k === "B" ? [Q1 / 2, (P1 + P2) / 2] : k === "D" ? [Q2 / 2, P2 / 2] : centroid(R[k]); return { x: c[0], y: c[1], t: lab(k) }; }));
          const ask = U.pick(["gain", "after", "before", "old"]);
          const spec = {
            gain: { q: "By how much does consumer surplus <b>increase</b>?", right: ["B", "C"] },
            after: { q: "What is consumer surplus <b>after</b> the price falls?", right: ["A", "B", "C"] },
            before: { q: "What was consumer surplus <b>before</b> the price fell?", right: ["A"] },
            old: { q: "How much do buyers who were <b>already buying</b> at the old price gain?", right: ["B"] },
          }[ask];
          const cands = [["A"], ["B"], ["C"], ["B", "C"], ["A", "B", "C"], ["B", "C", "D"], ["A", "B"]];
          const whyOf = ks => {
            const k = ks.join("");
            return { A: "That is consumer surplus at the old price.", B: "That is only the saving to buyers who were already buying.", C: "That is only the surplus of the new buyers.", BC: "That is the increase in consumer surplus.", ABC: "That is the new consumer surplus.", BCD: "That mixes in spending at the new price.", AB: "That leaves out the new buyers' surplus." }[k];
          };
          const right = combo(spec.right);
          const wrong = U.sample(cands.filter(c => c.join("") !== spec.right.join("")), 3).map(c => ({ t: combo(c), why: whyOf(c) }));
          return Q.mc({
            q: `The price of ${m.g.p} falls from ${$(P1)} to ${$(P2)}.${plot}${spec.q}`,
            right, wrong,
            sol: steps(`At ${$(P1)} consumer surplus is the triangle under demand above ${$(P1)} (${combo(["A"])}). At ${$(P2)} it is everything under demand above ${$(P2)} (${combo(["A", "B", "C"])}).`,
              `The gain splits into the saving on the ${U.fmt(Q1)} units already bought (${combo(["B"])}) and the surplus of new purchases (${combo(["C"])}). ${combo(["D"])} is spending at the new price, not surplus.`),
          });
        },
      },
      {
        name: "Which areas change when the price rises?",
        make() {
          const m = linMarket();
          const top = m.kMax - 1;
          if (top < 4) return this.make();
          const k1 = U.randInt(2, top - 1), k2 = U.randInt(k1 + 1, top);
          if (m.s === m.unit && k2 - k1 < 2) return this.make();
          const P1 = m.c + m.s * k1, P2 = m.c + m.s * k2, Q1 = k1 * m.sq, Q2 = k2 * m.sq;
          const Lm = U.shuffle(["A", "B", "C", "D"]);
          const R = { A: [[0, m.c], [0, P1], [Q1, P1]], B: [[0, P1], [Q1, P1], [Q1, P2], [0, P2]], C: [[Q1, P1], [Q1, P2], [Q2, P2]], D: m.c > 0 ? [[0, 0], [0, m.c], [Q1, P1], [Q1, 0]] : [[0, 0], [Q1, P1], [Q1, 0]] };
          const keys = ["A", "B", "C", "D"], lab = k => Lm[keys.indexOf(k)];
          const combo = ks => { const s = ks.map(lab).sort(); return (s.length > 1 ? "Areas " : "Area ") + s.join(" + "); };
          const o = mktPlot(m, "S");
          o.curves.push(dashH(Q1, P1), dashH(Q2, P2), dashV(Q1, P1), dashV(Q2, P2));
          o.yTicks = mergeTicks(o._base, o._req.concat([P1, P2]), o._yStep);
          const plot = areaPlot(o, keys.map((k, i) => ({ pts: R[k], tone: i % 2 ? "n2" : "n1" })),
            keys.map(k => { const c = k === "B" ? [Q1 / 2, (P1 + P2) / 2] : k === "D" ? [Q1 * 0.6, (m.c + m.s * k1 * 0.6) * 0.42] : centroid(R[k]); return { x: c[0], y: c[1], t: lab(k) }; }));
          const ask = U.pick(["gain", "after", "before"]);
          const spec = {
            gain: { q: "By how much does producer surplus <b>increase</b>?", right: ["B", "C"] },
            after: { q: "What is producer surplus <b>after</b> the price rises?", right: ["A", "B", "C"] },
            before: { q: "What was producer surplus <b>before</b> the price rose?", right: ["A"] },
          }[ask];
          const cands = [["A"], ["B"], ["C"], ["D"], ["B", "C"], ["A", "B", "C"], ["A", "D"]];
          const whyOf = ks => ({ A: "That is producer surplus at the old price.", B: "That is only the extra received on units already being sold.", C: "That is only the surplus on the extra units.", D: "That is the cost of producing the original units.", BC: "That is the increase in producer surplus.", ABC: "That is the new producer surplus.", AD: "That is revenue at the old price (cost + producer surplus)." })[ks.join("")];
          const right = combo(spec.right);
          const wrong = U.sample(cands.filter(c => c.join("") !== spec.right.join("")), 3).map(c => ({ t: combo(c), why: whyOf(c) }));
          return Q.mc({
            q: `The price of ${m.g.p} rises from ${$(P1)} to ${$(P2)}.${plot}${spec.q}`,
            right, wrong,
            sol: steps(`Producer surplus is the area above supply and below the price. At ${$(P1)} that is ${combo(["A"])}; at ${$(P2)} it is ${combo(["A", "B", "C"])}.`,
              `The gain = extra money on the original ${U.fmt(Q1)} units (${combo(["B"])}) + surplus on the new units (${combo(["C"])}). ${combo(["D"])} is the cost of production, not surplus.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Efficiency, total surplus & deadweight loss
   * ============================================================ */
  function mbmcTable() {
    const g = U.pick(MKT);
    const s = U.pick([1, 2, 5]), scale = U.pick([1, 10, 100]);
    const qs = U.randInt(2, 5);
    const b = U.randInt(1, 4) * s, c = U.randInt(1, 4) * s;
    const v = c * (qs - 1) + b * (6 - qs) + U.randInt(1, 4) * s;
    const rows = [1, 2, 3, 4, 5, 6].map(q => ({ q: q * scale, mb: v + b * (qs - q), mc: v + c * (q - qs) }));
    return { g, qs: qs * scale, rows, scale, v };
  }
  const tblMBMC = t => tbl([`Quantity (${t.g.p} ${t.g.per})`, "Marginal benefit", "Marginal cost"], t.rows.map(r => [U.fmt(r.q), $(r.mb), $(r.mc)]));
  const DWL_TF = [
    { t: "Deadweight loss is a decrease in total surplus that no one receives.", ok: true },
    { t: "Overproduction creates a deadweight loss because the extra units cost more than they are worth.", ok: true },
    { t: "At the efficient quantity, marginal benefit equals marginal cost.", ok: true },
    { t: "A competitive market in equilibrium maximizes the sum of consumer and producer surplus.", ok: true },
    { t: "When output is below the efficient quantity, marginal benefit exceeds marginal cost.", ok: true },
    { t: "A change in price with the quantity unchanged moves surplus between buyers and sellers but leaves total surplus the same.", ok: true },
    { t: "Deadweight loss is collected by the government.", ok: false, why: "It is a pure loss; nobody collects it." },
    { t: "Producing more than the equilibrium quantity always increases total surplus.", ok: false, why: "Beyond the efficient quantity MC &gt; MB, so each extra unit reduces total surplus." },
    { t: "Underproduction transfers surplus to buyers without any overall loss.", ok: false, why: "Units worth more than they cost are never made, so total surplus falls." },
    { t: "Efficiency means consumer surplus and producer surplus are equal.", ok: false, why: "Efficiency is about the size of total surplus, not how it is split." },
    { t: "At the efficient quantity, marginal benefit exceeds marginal cost by as much as possible.", ok: false, why: "At the efficient quantity MB = MC." },
  ];
  function eqStr(m) {
    const dm = U.round(m.d / m.sq, 4), sm = U.round(m.s / m.sq, 4);
    const co = v => (v === 1 ? "" : U.fmt(v));
    return { dem: `P = ${U.fmt(m.a)} − ${co(dm)}Q`, sup: m.c ? `P = ${U.fmt(m.c)} + ${co(sm)}Q` : `P = ${co(sm)}Q` };
  }
  const genDWL = STUDY.makeGenerator({
    id: "b251-m5-dwl",
    name: "Efficiency & deadweight loss",
    blurb: "Find the efficient quantity where MB = MC, compute total surplus, and measure the deadweight loss from underproduction and overproduction.",
    variants: [
      {
        name: "Efficient quantity from MB and MC",
        make() {
          const t = mbmcTable();
          return Q.num({
            q: `Marginal benefit and marginal cost in the market for ${t.g.p}:${tblMBMC(t)}What is the <b>efficient</b> quantity?`,
            answer: t.qs, unit: t.g.p, kind: "count",
            traps: traps(t.qs, [
              { value: t.rows[0].q, why: "MB is highest at the first unit, but MB &gt; MC there, so producing more adds surplus." },
              { value: t.qs + t.scale, why: "Past the efficient quantity MC &gt; MB: those units cost more than they are worth." },
              { value: t.qs - t.scale, why: "MB still exceeds MC at the next unit, so output should keep growing." },
              { value: t.rows[5].q, why: "Producing the most is not efficient once MC exceeds MB." },
            ]),
            sol: steps("Efficiency: produce every unit whose marginal benefit is at least its marginal cost, and stop where MB = MC.",
              `MB = MC = ${$(t.v)} at ${U.fmt(t.qs)} ${t.g.p}. Before that MB &gt; MC; after it MC &gt; MB.`,
              `Efficient quantity: <b>${U.fmt(t.qs)}</b>.`),
          });
        },
      },
      {
        name: "Underproduction, efficient or overproduction?",
        make() {
          const t = mbmcTable();
          const pickRows = U.sample(t.rows, 4);
          if (!pickRows.some(r => r.q === t.qs)) pickRows[0] = t.rows.find(r => r.q === t.qs);
          const items = pickRows.map(r => r.q < t.qs
            ? { t: `${U.fmt(r.q)} ${t.g.p}`, cat: "Underproduction", why: `MB (${$(r.mb)}) &gt; MC (${$(r.mc)}): more should be produced.` }
            : r.q > t.qs ? { t: `${U.fmt(r.q)} ${t.g.p}`, cat: "Overproduction", why: `MC (${$(r.mc)}) &gt; MB (${$(r.mb)}): too much is produced.` }
              : { t: `${U.fmt(r.q)} ${t.g.p}`, cat: "Efficient", why: "MB = MC." });
          return Q.classify({
            q: `Marginal benefit and marginal cost in the market for ${t.g.p}:${tblMBMC(t)}If the market produced each quantity below, would that be underproduction, efficient, or overproduction?`,
            cats: ["Underproduction", "Efficient", "Overproduction"], items,
            sol: steps("Compare MB and MC at each quantity.", "MB &gt; MC → underproduction (too little). MB = MC → efficient. MC &gt; MB → overproduction (too much)."),
          });
        },
      },
      {
        name: "Deadweight loss from a cap (graph)",
        make() {
          const m = linMarket();
          const kr = U.randInt(1, m.k - 1);
          const Qr = kr * m.sq, mb = m.mb(kr), mc = m.mc(kr);
          const o = mktPlot(m, "DS");
          o.curves.push(dashV(Qr, mb), dashH(Qr, mb), dashH(Qr, mc));
          o.yTicks = mergeTicks(o._base, o._req.concat([mb, mc]), o._yStep);
          const ans = 0.5 * (m.Q - Qr) * (mb - mc);
          return Q.num({
            q: `A regulation limits sales of ${m.g.p} to <b>${U.fmt(Qr)}</b> ${m.g.per} (dashed line). Demand is marginal benefit and supply is marginal cost.${G.plot(o)}What is the <b>deadweight loss</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (m.Q - Qr) * (mb - mc), why: "You forgot the ½: the deadweight loss is a triangle." },
              { value: 0.5 * m.Q * (m.a - m.c), why: "That is total surplus at the efficient quantity, not the loss." },
              { value: 0.5 * Qr * (mb - mc), why: "The base of the triangle is the units <em>not</em> produced: efficient quantity − cap." },
              { value: 0.5 * (m.Q - Qr) * (mb - m.p), why: "The triangle runs from demand all the way down to supply, not just to the equilibrium price." },
            ]),
            sol: steps("Deadweight loss from underproduction is the triangle between demand (MB) and supply (MC) from the cap to the efficient quantity.",
              `Efficient quantity: curves cross at ${U.fmt(m.Q)}. At the cap of ${U.fmt(Qr)}, MB = ${$(mb)} and MC = ${$(mc)}.`,
              `DWL = ½ × (${U.fmt(m.Q)} − ${U.fmt(Qr)}) × (${U.fmt(mb)} − ${U.fmt(mc)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Deadweight loss from overproduction (equations)",
        make() {
          const m = linMarket();
          const ko = m.k + U.randInt(1, 2);
          const Qo = ko * m.sq, mb = m.mb(ko), mc = m.mc(ko);
          const e = eqStr(m);
          const ans = 0.5 * (Qo - m.Q) * (mc - mb);
          return Q.num({
            q: `In the market for ${m.g.p} (Q = ${m.g.p} ${m.g.per}), marginal benefit is <b>${e.dem}</b> and marginal cost is <b>${e.sup}</b>. A program pushes output to <b>${U.fmt(Qo)}</b>. What is the deadweight loss?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: (Qo - m.Q) * (mc - mb), why: "You forgot the ½." },
              { value: 0.5 * Qo * (mc - mb), why: "The base is only the extra units beyond the efficient quantity." },
              { value: 0, why: "Producing more is not free: beyond the efficient quantity each unit costs more than it is worth." },
            ]),
            sol: steps("First find the efficient quantity where MB = MC, then the triangle between MC (above) and MB (below) out to the actual output.",
              `${e.dem.slice(4)} = ${e.sup.slice(4)} gives Q = ${U.fmt(m.Q)} (price ${$(m.p)}). At ${U.fmt(Qo)}: MB = ${$(mb)}, MC = ${$(mc)}.`,
              `DWL = ½ × (${U.fmt(Qo)} − ${U.fmt(m.Q)}) × (${U.fmt(mc)} − ${U.fmt(mb)}) = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Total surplus left after a restriction",
        make() {
          const m = linMarket();
          const kr = U.randInt(1, m.k - 1), Qr = kr * m.sq, mb = m.mb(kr), mc = m.mc(kr);
          const e = eqStr(m);
          const ts = 0.5 * m.Q * (m.a - m.c), dwl = 0.5 * (m.Q - Qr) * (mb - mc), ans = ts - dwl;
          return Q.num({
            q: `Marginal benefit of ${m.g.p} is ${e.dem} and marginal cost is ${e.sup} (Q per ${m.g.per.replace("per ", "")}). A quota holds output at <b>${U.fmt(Qr)}</b>. What <b>total surplus</b> (consumer + producer) is still created?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: ts, why: "That is total surplus at the efficient quantity, before the quota." },
              { value: dwl, why: "That is the deadweight loss, the part that is lost." },
              { value: 0.5 * Qr * (mb - mc), why: "Total surplus on the units produced is the trapezoid between MB and MC from 0 to the quota, not just a triangle." },
            ]),
            sol: steps("Total surplus with the quota = efficient total surplus − deadweight loss.",
              `Efficient: Q = ${U.fmt(m.Q)}, TS = ½ × ${U.fmt(m.Q)} × (${U.fmt(m.a)} − ${U.fmt(m.c)}) = ${$(ts)}.`,
              `At ${U.fmt(Qr)}: MB = ${$(mb)}, MC = ${$(mc)}; DWL = ½ × ${U.fmt(m.Q - Qr)} × ${U.fmt(mb - mc)} = ${$(dwl)}. Remaining: ${$(ts)} − ${$(dwl)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Maximum total surplus with a few traders",
        make() {
          const it = U.pick(ONE);
          const n = 5;
          let W, M, k;
          for (let g = 0; g < 200; g++) {
            W = distinctInts(n, 4, 40).map(v => v * 5).sort((a, b) => b - a);
            M = distinctInts(n, 2, 36).map(v => v * 5).sort((a, b) => a - b);
            k = 0; while (k < n && W[k] > M[k]) k++;
            if (k >= 2 && k <= 4 && W.every((w, i) => w !== M[i])) break;
          }
          const ans = sum(W.slice(0, k).map((w, i) => w - M[i]));
          const all = sum(W) - sum(M);
          return Q.num({
            q: `${cap(it.where)}, five buyers each want one ${it.s} and five sellers each have one. Buyers' willingness to pay: ${W.map($).join(", ")}. Sellers' minimum prices (marginal costs): ${M.map($).join(", ")}. If the trades that happen are between the buyers who value the item most and the sellers with the lowest costs, what is the <b>maximum total surplus</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: all, why: "You included trades where the buyer values the item less than the seller's cost. Those trades destroy surplus." },
              { value: sum(W.slice(0, k)), why: "That is total value; subtract the sellers' costs." },
              { value: W[0] - M[0], why: "That is only the best single trade." },
              { value: sum(W.slice(0, k + 1).map((w, i) => w - M[i])), why: `The next trade (${$(W[k])} buyer with ${$(M[k])} seller) would have MB &lt; MC.` },
            ]),
            sol: steps("Total surplus = value − cost of every unit traded. Match the highest WTP with the lowest cost, the next highest with the next lowest, and stop when WTP falls below cost (MB &lt; MC).",
              `Trades that add surplus: ${W.slice(0, k).map((w, i) => `${$(w)} − ${$(M[i])}`).join(", ")}. The next pair (${$(W[k])} vs ${$(M[k])}) would lose money.`,
              `Maximum total surplus = <b>${$(ans)}</b> from ${k} trades. This is what a competitive market price between ${$(Math.max(W[k], M[k - 1]))} and ${$(Math.min(W[k - 1], M[k]))} delivers.`),
          });
        },
      },
      {
        name: "Efficiency concepts",
        make() {
          const v = U.pick([
            { q: "Who receives the deadweight loss created by underproduction?", right: "No one: it is surplus that simply disappears",
              wrong: [{ t: "The government", why: "Deadweight loss is not revenue; nobody collects it." }, { t: "Sellers, as extra profit", why: "Sellers lose surplus on the trades that don't happen too." }, { t: "Buyers, as lower prices", why: "Buyers lose the surplus on the units never made." }],
              sol: "Deadweight loss is the surplus from trades that should happen but don't (or the value destroyed by units that shouldn't be made). It is a loss to society as a whole." },
            { q: "Why is the competitive equilibrium quantity efficient?", right: "Demand measures marginal benefit and supply measures marginal cost, so at equilibrium MB = MC",
              wrong: [{ t: "Because consumer surplus equals producer surplus there", why: "CS and PS need not be equal; efficiency is about their sum." }, { t: "Because the price is as low as possible there", why: "A lower price with less output would be inefficient." }, { t: "Because firms make no surplus there", why: "Producers normally earn surplus at equilibrium." }],
              sol: "Demand = MB and supply = MC. Where they cross, the last unit is worth exactly what it costs, so total surplus is maximized." },
            { q: "If the government forces the price above equilibrium but somehow the quantity traded stays at the efficient level, what happens to total surplus?", right: "It stays the same; surplus just shifts from buyers to sellers",
              wrong: [{ t: "It rises, because sellers gain", why: "Sellers' gain equals buyers' loss when quantity is unchanged." }, { t: "It falls by the amount of the price increase", why: "The higher price is a transfer, not a loss, if quantity doesn't change." }, { t: "It becomes zero", why: "The units traded still create value above their cost." }],
              sol: "Total surplus depends on which units are traded (value − cost), not on the price. A price change with the same quantity only changes the split." },
            { q: "At the current output of a market, marginal cost is greater than marginal benefit. What should happen to output to raise total surplus?", right: "Output should fall",
              wrong: [{ t: "Output should rise", why: "Extra units would cost even more than they're worth." }, { t: "Output is already efficient", why: "Efficient means MB = MC." }, { t: "Only the price should change", why: "The price changes the split; surplus depends on the quantity." }],
              sol: "MC &gt; MB means the last units cost more than they are worth: overproduction. Cutting output removes those units and raises total surplus." },
          ]);
          return Q.mc({ q: v.q, right: v.right, wrong: v.wrong, sol: steps("Efficiency is about the size of total surplus: produce every unit with MB ≥ MC and no unit with MC &gt; MB.", v.sol) });
        },
      },
      {
        name: "Select all: efficiency and deadweight loss",
        make() {
          const opts = U.sample(DWL_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(DWL_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Efficient: MB = MC, total surplus largest. Under: MB &gt; MC. Over: MC &gt; MB.", "Deadweight loss is lost by everyone and collected by no one; price alone only moves surplus around."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Obstacles to efficiency
   * ============================================================ */
  const REG = "Price or quantity regulation", TAX = "Tax or subsidy", TXC = "High transactions costs", EXT = "Externality", PUB = "Public good or common resource", MON = "Monopoly";
  const OBST = [REG, TAX, TXC, EXT, PUB, MON];
  const UND = "Underproduction", OVR = "Overproduction";
  const OB_NP = { [REG]: "a legal limit on price or quantity", [TAX]: "a tax or subsidy", [TXC]: "costly deal-making", [EXT]: "an effect on people outside the trade",
    [PUB]: "a good that anyone can use without paying", [MON]: "a single seller" };
  const OB_BANK = [
    { t: "A city caps the number of food-truck permits at 40, even though many more vendors would operate at current prices.", cat: REG, dir: UND, why: "A quantity limit keeps output below the efficient level." },
    { t: "A rent ceiling set below the market rent leads landlords to offer fewer apartments.", cat: REG, dir: UND, why: "Fewer units are supplied and traded at the controlled price." },
    { t: "A law sets a minimum price for eggs above equilibrium, so shoppers buy fewer eggs.", cat: REG, dir: UND, why: "Buyers purchase less at the higher legal price, so fewer trades happen." },
    { t: "A county limits liquor licenses to one per 5,000 residents.", cat: REG, dir: UND, why: "A cap on sellers restricts the quantity sold." },
    { t: "A state adds a $3 tax to every concert ticket sold.", cat: TAX, dir: UND, why: "A tax raises the price buyers pay and lowers what sellers get, so fewer tickets trade." },
    { t: "A city charges hotels a 12% tax on every room-night.", cat: TAX, dir: UND, why: "The tax wedge shrinks the number of room-nights sold." },
    { t: "The government pays boat builders $4,000 for each sailboat they produce.", cat: TAX, dir: OVR, why: "A subsidy pushes output past the point where MB = MC." },
    { t: "Farmers receive a payment for every bushel of sorghum they grow, whether or not anyone wants it.", cat: TAX, dir: OVR, why: "The subsidy encourages production of units worth less than they cost." },
    { t: "A homeowner would gladly rent out her driveway on game days, but finding renters and drawing up agreements takes more effort than it's worth.", cat: TXC, dir: UND, why: "The cost of arranging the deal blocks trades that would create surplus." },
    { t: "Two small firms could profit from sharing a delivery van, but negotiating a contract would require expensive lawyers.", cat: TXC, dir: UND, why: "High costs of making the deal prevent a worthwhile trade." },
    { t: "Selling a used lawn mower requires a notarized title, an inspection and a trip to a government office.", cat: TXC, dir: UND, why: "Paperwork and time costs stop some mutually beneficial sales." },
    { t: "A paper mill's runoff harms fishing downstream, but the mill does not pay for the damage.", cat: EXT, dir: OVR, why: "An external cost means the market produces more than the efficient amount." },
    { t: "A late-night club's noise keeps neighbors awake; the club ignores that cost when deciding its hours.", cat: EXT, dir: OVR, why: "The cost borne by others is ignored, so too much is produced." },
    { t: "A beekeeper's bees pollinate nearby orchards for free, but she keeps hives only for her own honey.", cat: EXT, dir: UND, why: "An external benefit is ignored, so less than the efficient amount is produced." },
    { t: "People who get vaccinated also protect those around them, but each person weighs only their own benefit.", cat: EXT, dir: UND, why: "The external benefit leads to too few vaccinations." },
    { t: "A flood levee would protect a whole town, but each resident hopes the others will pay for it.", cat: PUB, dir: UND, why: "A public good benefits everyone, so free riders leave it underproduced." },
    { t: "Streetlights benefit every pedestrian on a block, and no one can be excluded from the light.", cat: PUB, dir: UND, why: "Free riding means private markets provide too few streetlights." },
    { t: "Anyone can fish in an open lake, and each boat takes as many fish as it can before others do.", cat: PUB, dir: OVR, why: "A common resource is overused." },
    { t: "Farms in a valley all pump groundwater from the same aquifer with no limits.", cat: PUB, dir: OVR, why: "Unowned, shared water is used faster than is efficient." },
    { t: "The only internet provider in a rural county keeps service limited to charge higher prices.", cat: MON, dir: UND, why: "A monopoly restricts output to raise price." },
    { t: "A drug maker with a patent sells fewer doses at a higher price than competitive firms would.", cat: MON, dir: UND, why: "The single seller holds output below the efficient level." },
    { t: "One company owns the only toll bridge across a river and sets a high toll, so fewer cars cross.", cat: MON, dir: UND, why: "Monopoly pricing cuts the quantity below the efficient one." },
  ];
  const OB_TF = [
    { t: "A subsidy tends to cause overproduction.", ok: true },
    { t: "A common resource tends to be overused.", ok: true },
    { t: "Monopoly tends to cause underproduction.", ok: true },
    { t: "High transactions costs can prevent trades that would benefit both sides.", ok: true },
    { t: "An external cost, such as pollution, leads a market to produce more than the efficient quantity.", ok: true },
    { t: "Majority rule can also be inefficient, because a self-interested group can become the majority.", ok: true },
    { t: "A tax on a good tends to cause overproduction.", ok: false, why: "A tax reduces the quantity traded: underproduction." },
    { t: "Public goods tend to be overproduced by private markets.", ok: false, why: "Free riding leads to underproduction of public goods." },
    { t: "Whenever a market is inefficient, majority rule will allocate the resource efficiently.", ok: false, why: "Voting has its own shortcomings: special interests and officials' own agendas." },
    { t: "An external benefit, like the pollination from a neighbor's bees, leads to overproduction.", ok: false, why: "Benefits to others are ignored, so too little is produced." },
    { t: "A competitive market with no obstacles produces less than the efficient quantity.", ok: false, why: "Without obstacles, competitive equilibrium is efficient." },
  ];
  const genObst = STUDY.makeGenerator({
    id: "b251-m5-obstacles",
    name: "Obstacles to efficiency",
    blurb: "Recognize the six obstacles that make markets underproduce or overproduce, the invisible hand, and the limits of majority rule as an alternative.",
    variants: [
      {
        name: "Classify the obstacle",
        make() {
          const cs = U.sample(OBST, 5);
          const items = cs.map(c => { const b = U.pick(OB_BANK.filter(x => x.cat === c)); return { t: b.t, cat: c, why: b.why }; });
          return Q.classify({
            q: "Which obstacle to efficiency does each situation show?",
            cats: OBST, items,
            sol: steps("Ask what is getting in the way: a legal limit on price or quantity, a tax or subsidy, the cost of making deals, effects on outsiders, goods anyone can use, or a single seller.",
              "A subsidy belongs with taxes; shared, unowned resources belong with public goods."),
          });
        },
      },
      {
        name: "Underproduction or overproduction?",
        make() {
          const over = U.sample(OB_BANK.filter(b => b.dir === OVR), U.randInt(1, 3));
          const under = U.sample(OB_BANK.filter(b => b.dir === UND), 5 - over.length);
          return Q.classify({
            q: "Does each situation lead to underproduction or overproduction compared with the efficient quantity?",
            cats: [UND, OVR], items: over.concat(under).map(b => ({ t: b.t, cat: b.dir, why: b.why })),
            sol: steps("Underproduction: units worth more than they cost aren't made (regulations, taxes, transactions costs, external benefits, public goods, monopoly).",
              "Overproduction: units worth less than they cost are made (subsidies, external costs, overused common resources)."),
          });
        },
      },
      {
        name: "Name the obstacle",
        make() {
          const b = U.pick(OB_BANK);
          const wrong = U.sample(OBST.filter(o => o !== b.cat), 3).map(o => ({ t: o, why: `Nothing here involves ${OB_NP[o]}.` }));
          return Q.mc({
            q: `${b.t}<br>Which obstacle to efficiency is this?`,
            right: b.cat, wrong, rightWhy: b.why,
            sol: steps("Identify what stops the market from reaching MB = MC.", `${b.why} The obstacle is <b>${b.cat.toLowerCase()}</b>, and the result is ${b.dir.toLowerCase()}.`),
          });
        },
      },
      {
        name: "The invisible hand",
        make() {
          const v = U.pick([
            { q: "Adam Smith's “invisible hand” refers to the idea that:", right: "people pursuing their own interest in competitive markets end up sending resources to their highest-valued uses",
              wrong: [{ t: "governments must direct resources to their best uses", why: "The point is that no one directs it: markets coordinate on their own." },
                { t: "markets work only when people act unselfishly", why: "Smith's argument relies on self-interest, not selflessness." },
                { t: "prices are set by a hidden central authority", why: "Prices emerge from buyers and sellers interacting, not from an authority." }] },
            { q: "According to the invisible-hand idea, what guides a competitive market to an efficient outcome?", right: "Buyers and sellers responding to prices in their own interest",
              wrong: [{ t: "A planner's command", why: "That is command allocation, not the invisible hand." },
                { t: "Majority votes on how much to produce", why: "That is majority rule." },
                { t: "Equal sharing of all output", why: "That is a fairness rule, not market coordination." }] },
            { q: "Which situation would <b>weaken</b> the invisible hand's result in a market?", right: "Producers' pollution imposes costs on people who are not part of the trade",
              wrong: [{ t: "Many buyers and sellers compete", why: "Competition is what makes the invisible hand work." },
                { t: "Buyers act in their own interest", why: "Self-interest is part of the mechanism." },
                { t: "Prices adjust freely", why: "Free prices help markets reach efficiency." }] },
          ]);
          return Q.mc({ q: v.q, right: v.right, wrong: v.wrong,
            sol: steps("Smith's claim: self-interest + competition + prices → resources flow to their highest-valued use, with no one planning it.",
              "It holds when there are no obstacles such as externalities, public goods, monopoly, taxes, regulations or high transactions costs.") });
        },
      },
      {
        name: "Majority rule as an alternative",
        make() {
          const opts = [
            { t: "An organized group pursuing its own interest can become the majority", ok: true, why: "Majority rule can serve a self-interested group rather than society." },
            { t: "Voters' decisions are carried out by officials who have their own agendas", ok: true, why: "Bureaucrats may not implement choices as voters intended." },
            { t: "Each vote counts equally, so intensity of preference is ignored", ok: true, why: "A mild majority can override a minority that cares a lot." },
            { t: "Majority rule always produces the efficient quantity", ok: false, why: "Voting has its own sources of inefficiency." },
            { t: "Majority rule cannot be used to allocate any resources", ok: false, why: "It is one of the nine allocation methods and is widely used." },
            { t: "Majority rule guarantees that everyone gets an equal share", ok: false, why: "Equal shares is a different method; a vote can favor one group." },
          ];
          const pick = U.sample(opts.filter(o => o.ok), U.randInt(1, 3)).concat(U.sample(opts.filter(o => !o.ok), 2));
          return Q.multi({
            q: "When a market is inefficient, a community might turn to majority rule instead. Select <b>all</b> genuine shortcomings of majority rule.",
            options: pick,
            sol: steps("A non-market method can fail too. Ask who controls the vote and who carries it out.",
              "Special interests can form majorities, officials have their own goals, and votes ignore how strongly people feel. The price mechanism, supplemented by non-price methods, is usually the best available combination."),
          });
        },
      },
      {
        name: "Which is NOT an obstacle to efficiency?",
        make() {
          const right = U.pick(["Many buyers and many sellers competing freely", "Prices that adjust freely to balance quantity demanded and supplied", "Buyers and sellers who each pursue their own interest", "Firms that compete to win customers"]);
          const wrong = U.sample(OBST, 3).map(o => ({ t: o, why: `${o} is one of the six obstacles to efficiency.` }));
          return Q.mc({
            q: "Which of the following is <b>not</b> an obstacle to efficiency in competitive markets?",
            right, wrong, rightWhy: "This is a feature of a working competitive market, which is what delivers efficiency.",
            sol: steps("Recall the six obstacles: regulations, taxes and subsidies, high transactions costs, externalities, public goods and common resources, monopoly.",
              "Competition, self-interest and flexible prices are the ingredients of the invisible hand, not obstacles to it."),
          });
        },
      },
      {
        name: "Select all: obstacles to efficiency",
        make() {
          const opts = U.sample(OB_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(OB_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Overproduction: subsidies, external costs, common resources. Underproduction: regulations, taxes, transactions costs, external benefits, public goods, monopoly.",
              "Non-market alternatives such as majority rule have their own problems."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 9 — Fairness: results vs rules
   * ============================================================ */
  const RES = "Fair results", RUL = "Fair rules";
  const FAIR_BANK = [
    { t: "“Income should be shared so that total happiness is as large as possible.”", cat: RES, why: "Judges the outcome: utilitarianism." },
    { t: "“It's unfair that a CEO earns 300 times what a cashier earns.”", cat: RES, why: "The complaint is about the size of the gap, an outcome." },
    { t: "“We should redistribute until the worst-off person is as well off as possible.”", cat: RES, why: "Rawls's view judges the result for the poorest." },
    { t: "“A dollar means more to a poor family than to a rich one, so transfers raise total well-being.”", cat: RES, why: "Utilitarian reasoning about outcomes." },
    { t: "“No one should have to live on less than half the median income.”", cat: RES, why: "Sets a standard for the outcome." },
    { t: "“If everyone got the same income, society would be happiest.”", cat: RES, why: "Equal outcomes: the utilitarian conclusion." },
    { t: "“What matters is that everyone plays by the same rules, not who ends up with more.”", cat: RUL, why: "Judges the process." },
    { t: "“People in similar situations should be treated the same way.”", cat: RUL, why: "The symmetry principle." },
    { t: "“If she earned her fortune through voluntary trades, it is hers fairly.”", cat: RUL, why: "Nozick: voluntary exchange makes the result fair." },
    { t: "“Everyone deserves an equal opportunity to compete for jobs, regardless of background.”", cat: RUL, why: "Equality of opportunity is about rules, not results." },
    { t: "“The state's job is to protect property and enforce contracts, not to equalize incomes.”", cat: RUL, why: "Nozick's first rule: protect private property." },
    { t: "“Taking someone's honestly earned income to give to others is unfair.”", cat: RUL, why: "Fair-rules view: legitimate acquisition should be respected." },
  ];
  const THINK = { U: "Utilitarianism", T: "The big tradeoff", R: "John Rawls", N: "Robert Nozick" };
  const THINK_BANK = [
    { t: "Seek the greatest happiness for the greatest number", cat: THINK.U },
    { t: "Because a dollar is worth more to the poor, equal incomes maximize total benefit", cat: THINK.U },
    { t: "Redistribution weakens incentives and uses resources, so it shrinks the pie", cat: THINK.T },
    { t: "Taxes that fund transfers reduce work and saving, so fairness costs efficiency", cat: THINK.T },
    { t: "Redistribute only until the poorest person is as well off as possible", cat: THINK.R },
    { t: "Make the smallest slice of the pie as big as it can be", cat: THINK.R },
    { t: "The state should protect private property, and property should change hands only by voluntary exchange", cat: THINK.N },
    { t: "If the rules are fair, whatever result they produce is fair", cat: THINK.N },
  ];
  const FAIR_TF = [
    { t: "Utilitarianism concludes that income should be equal if everyone gets the same benefit from income.", ok: true },
    { t: "The big tradeoff is between efficiency and fairness.", ok: true },
    { t: "Rawls would accept some inequality if it made the poorest person better off.", ok: true },
    { t: "The symmetry principle calls for equality of opportunity rather than equality of income.", ok: true },
    { t: "Under Nozick's rules, an efficient market outcome can also be a fair one.", ok: true },
    { t: "Utilitarianism takes full account of the costs of making income transfers.", ok: false, why: "Its main weakness is ignoring those costs." },
    { t: "Rawls argued for complete equality of income.", ok: false, why: "He wanted the poorest as well off as possible, which may involve some inequality." },
    { t: "Nozick judged fairness by how equal incomes are.", ok: false, why: "He judged the rules: property rights and voluntary exchange." },
    { t: "The “fair rules” view says an outcome is unfair whenever incomes are unequal.", ok: false, why: "That is a fair-results view." },
    { t: "Redistributing income has no effect on the size of the economic pie.", ok: false, why: "Taxes and administration shrink it: the big tradeoff." },
  ];
  const genFair = STUDY.makeGenerator({
    id: "b251-m5-fairness",
    name: "Fairness: results vs rules",
    blurb: "Tell fair-results views (utilitarianism, Rawls) from fair-rules views (symmetry, Nozick), and work through the big tradeoff.",
    variants: [
      {
        name: "Fair results or fair rules?",
        make() {
          const r = U.sample(FAIR_BANK.filter(b => b.cat === RES), U.randInt(2, 3));
          const ru = U.sample(FAIR_BANK.filter(b => b.cat === RUL), 5 - r.length);
          return Q.classify({
            q: "Does each statement judge fairness by the <b>result</b> or by the <b>rules</b>?",
            cats: [RES, RUL], items: r.concat(ru),
            sol: steps("Results views look at the outcome: who ends up with how much.",
              "Rules views look at the process: equal treatment, property rights, voluntary exchange, equal opportunity."),
          });
        },
      },
      {
        name: "Match the idea to its source",
        make() {
          const cats = [THINK.U, THINK.T, THINK.R, THINK.N];
          const items = cats.map(c => U.pick(THINK_BANK.filter(b => b.cat === c)));
          const extra = U.pick(THINK_BANK.filter(b => !items.includes(b)));
          items.push(extra);
          return Q.classify({
            q: "Match each idea to the view it belongs to.",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: { [THINK.U]: "Utilitarianism: maximize total happiness, which points to equal incomes.", [THINK.T]: "The big tradeoff: fairness through transfers costs efficiency.", [THINK.R]: "Rawls: make the poorest as well off as possible.", [THINK.N]: "Nozick: fair rules (property + voluntary exchange) make results fair." }[i.cat] })),
            sol: steps("Utilitarianism → equal incomes. The big tradeoff → transfers shrink the pie. Rawls → help the poorest as much as possible, given that.",
              "Nozick → fairness is about rules: property rights and voluntary exchange."),
          });
        },
      },
      {
        name: "Utilitarian transfer arithmetic",
        make() {
          const [rich, poor] = U.sample(PEOPLE, 2);
          let br, bp, T, keep, ans;
          for (let g = 0; g < 100; g++) {
            br = U.randInt(1, 4); bp = U.randInt(br + 2, 12);
            T = U.pick([100, 200, 500, 1000]);
            keep = U.pick([100, 90, 80, 75, 60, 50]);
            ans = (T * keep / 100) * bp / 100 - T * br / 100;
            if (ans > 0 && Number.isInteger(ans * 10)) break;
          }
          const arrive = T * keep / 100;
          return Q.num({
            q: `Each extra $100 of income adds ${bp} units of benefit for ${poor} (low income) but only ${br} ${U.plural(br, "unit")} for ${rich} (high income), and these rates stay the same over the amounts involved. The government taxes $${U.fmt(T)} from ${rich} for ${poor}${keep < 100 ? `, but administration and lost work effort mean only ${keep}% of it (${$(arrive)}) reaches ${poor}` : `, and all of it reaches ${poor}`}. By how many units does <b>total benefit</b> change?`,
            answer: ans, unit: "units",
            traps: traps(ans, [
              keep < 100 ? { value: T * (bp - br) / 100, why: "That ignores the leak: only part of the transfer reaches the recipient." } : null,
              { value: arrive * bp / 100, why: `That is only ${poor}'s gain. ${rich} loses benefit too.` },
              { value: T * br / 100, why: `That is only ${rich}'s loss.` },
            ]),
            sol: steps("Total benefit change = recipient's gain − payer's loss. Use each person's benefit per $100.",
              `${poor} gains ${U.fmt(arrive)} × ${bp}/100 = ${U.fmt(arrive * bp / 100)}. ${rich} loses ${U.fmt(T)} × ${br}/100 = ${U.fmt(T * br / 100)}.`,
              `Change = <b>${U.fmt(ans)}</b> units. Utilitarians favor transfers whenever this is positive; the leak is why the big tradeoff limits how far they go.`),
          });
        },
      },
      {
        name: "How big a leak before transfers stop helping?",
        make() {
          const [rich, poor] = U.sample(PEOPLE, 2);
          let br, bp;
          for (let g = 0; g < 100; g++) { br = U.randInt(1, 6); bp = U.pick([2, 4, 5, 8, 10, 20, 25]) * br; if (bp > br) break; }
          const ans = (1 - br / bp) * 100;
          return Q.num({
            q: `A dollar adds ${bp} units of benefit to ${poor} but only ${br} to ${rich}. When a dollar is taxed from ${rich}, part of it is lost (administration, weaker incentives) before it reaches ${poor}. What is the largest percentage of each dollar that can be lost while the transfer still does not reduce total benefit?`,
            answer: ans, unit: "%",
            traps: traps(ans, [
              { value: br / bp * 100, why: "That is the share that must <em>arrive</em>. The question asks for the share that can be lost." },
              { value: (bp - br), why: "Compare benefits per dollar as a ratio, not a difference." },
            ]),
            sol: steps(`Break-even: the part that arrives, times ${bp}, must at least equal the ${br} ${U.plural(br, "unit")} ${rich} loses per dollar.`,
              `Share arriving ≥ ${br}/${bp} = ${U.fmt(U.round(br / bp * 100, 2))}%.`,
              `So up to <b>${U.fmt(U.round(ans, 2))}%</b> can be lost. Beyond that, redistribution shrinks total benefit: the big tradeoff in numbers.`),
          });
        },
      },
      {
        name: "Which plan would Rawls choose?",
        make() {
          let plans;
          for (let g = 0; g < 300; g++) {
            const eq = U.randInt(20, 30);
            const pA = [eq, eq, eq];
            const lo = U.randInt(eq + 3, eq + 12);
            const pB = [lo, lo + U.randInt(8, 25), lo + U.randInt(30, 70)].sort((a, b) => a - b);
            const lo2 = U.randInt(eq - 10, lo - 2);
            const pC = [lo2, lo2 + U.randInt(30, 60), lo2 + U.randInt(80, 160)].sort((a, b) => a - b);
            const lo3 = U.randInt(eq + 1, lo - 1);
            const pD = [lo3, lo3 + U.randInt(2, 8), lo3 + U.randInt(9, 20)].sort((a, b) => a - b);
            plans = [{ n: "equal", v: pA }, { n: "rawls", v: pB }, { n: "big", v: pC }, { n: "mid", v: pD }];
            const mins = plans.map(p => p.v[0]);
            const totals = plans.map(p => sum(p.v));
            if (new Set(mins).size === 4 && Math.max(...mins) === pB[0] && sum(pA) < sum(pD) && sum(pD) < sum(pB) && sum(pB) < sum(pC)) break;
          }
          const letters = U.shuffle(["W", "X", "Y", "Z"]);
          plans.forEach((p, i) => { p.L = letters[i]; });
          const sorted = plans.slice().sort((a, b) => a.L.localeCompare(b.L));
          const right = `Plan ${plans[1].L}`;
          const whyOf = p => p.n === "equal" ? "Perfect equality, but the pie is so small that the poorest gets less than under another plan." : p.n === "big" ? `Largest total income, but its poorest person gets only ${p.v[0]}, less than ${plans[1].v[0]}.` : `Its poorest person gets ${p.v[0]}, less than ${plans[1].v[0]}.`;
          return Q.mc({
            q: `Three people's incomes (thousands of dollars) under four policy plans. Transfers are costly, so plans with more redistribution have smaller totals.${tbl(["Plan", "Person 1", "Person 2", "Person 3", "Total"], sorted.map(p => [p.L, ...p.v.map(String), String(sum(p.v))]))}Which plan would <b>John Rawls</b> favor?`,
            right, wrong: plans.filter(p => p.n !== "rawls").map(p => ({ t: `Plan ${p.L}`, why: whyOf(p) })),
            sol: steps("Rawls: choose the arrangement that makes the <em>poorest</em> person as well off as possible. Look only at each plan's lowest income.",
              `Lowest incomes: ${sorted.map(p => `${p.L} → ${p.v[0]}`).join(", ")}.`,
              `The highest minimum is ${plans[1].v[0]}, in <b>${right}</b>. Not the equal plan, not the biggest pie.`),
          });
        },
      },
      {
        name: "What would Nozick say?",
        make() {
          const fair = Math.random() < 0.6;
          const who = U.pick(PEOPLE);
          const sc = fair ? U.pick([
            `${who} writes a hit app that millions of people choose to buy, and becomes far richer than her neighbors.`,
            `${who} builds a bakery that customers flock to, and ends up with ten times the income of a nearby baker.`,
            `${who} inherits a farm her parents bought and paid for, and sells it to a willing buyer for a large sum.`,
          ]) : U.pick([
            `${who} becomes rich by selling counterfeit medicine that buyers believe is genuine.`,
            `${who} gets a valuable lot after officials seize it from its owner without compensation and hand it to her.`,
            `${who} takes over a neighbor's land by threatening him until he leaves.`,
          ]);
          const right = fair ? "Fair, because the wealth came through voluntary exchange and respected property rights" : "Unfair, because the rules of property and voluntary exchange were broken";
          return Q.mc({
            q: `${sc} Under Robert Nozick's “fair rules” view, is the outcome fair?`,
            right,
            wrong: uniqWrong(right, [
              { t: "Fair, because the wealth came through voluntary exchange and respected property rights", why: "Fraud, coercion or seizure without consent is not voluntary exchange." },
              { t: "Unfair, because the rules of property and voluntary exchange were broken", why: "Nothing here broke those rules: everyone traded voluntarily." },
              { t: "Unfair, because it makes incomes more unequal", why: "Inequality alone is a fair-results objection. Nozick judges the process." },
              { t: "Fair only if the government then redistributes the gains equally", why: "Nozick opposes redistribution of legitimately acquired property." },
            ]).slice(0, 3),
            sol: steps("Nozick asks only two questions: was private property respected, and did everything change hands by voluntary exchange?",
              fair ? "Yes to both, so the result is fair, however unequal it is." : "No: the transfer involved fraud, coercion or seizure, so the result is unfair."),
          });
        },
      },
      {
        name: "Why not complete equality?",
        make() {
          const v = U.pick([
            { q: "Why did many economists reject the utilitarian conclusion that incomes should be made completely equal?", right: "Transfers are costly: taxes weaken incentives to work and save, and administration uses resources, so the pie shrinks",
              wrong: [{ t: "Because the marginal benefit of income rises as income rises", why: "Utilitarianism assumes it falls, and economists generally agree." }, { t: "Because equal incomes are illegal", why: "This is not a legal argument." }, { t: "Because rich people get more happiness from each dollar than poor people", why: "The usual assumption is the opposite: diminishing marginal benefit of income." }] },
            { q: "What is the “big tradeoff”?", right: "The tradeoff between efficiency and fairness: redistributing income shrinks the total pie",
              wrong: [{ t: "The tradeoff between consumer surplus and producer surplus", why: "That is how price splits surplus, not the big tradeoff." }, { t: "The tradeoff between majority rule and command", why: "Those are allocation methods." }, { t: "The tradeoff between taxes and subsidies", why: "The big tradeoff is efficiency versus fairness." }] },
            { q: "Given the big tradeoff, how far did John Rawls say income should be redistributed?", right: "Only to the point where the poorest person is as well off as possible",
              wrong: [{ t: "Until everyone's income is exactly equal", why: "That is the utilitarian conclusion, which ignores the shrinking pie." }, { t: "Not at all; any redistribution is unfair", why: "That is closer to a fair-rules view." }, { t: "Until total income is as large as possible", why: "That ignores how the poorest fare." }] },
          ]);
          return Q.mc({ q: v.q, right: v.right, wrong: v.wrong,
            sol: steps("Utilitarianism says equalize, because a dollar means more to the poor. But taking and giving dollars is not free.",
              "That cost is the big tradeoff, and Rawls's answer is to redistribute only as far as it helps the poorest person.") });
        },
      },
      {
        name: "Select all: fairness",
        make() {
          const opts = U.sample(FAIR_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(FAIR_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Results: utilitarianism (equality), the big tradeoff, Rawls (poorest as well off as possible).", "Rules: symmetry principle (equal opportunity), Nozick (property rights + voluntary exchange)."),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m5", order: 5,
    title: "Module 5 · Markets: Efficiency and Equity",
    short: "M5 · Efficiency",
    description: "Methods of allocating scarce resources, value and willingness to pay, consumer and producer surplus, efficient vs inefficient markets and deadweight loss, and fairness based on results vs rules.",
    notes, flashcards, cues,
    generators: [genAlloc, genDemand, genCS, genPS, genConcepts, genGraph, genDWL, genObst, genFair],
  });
})();
