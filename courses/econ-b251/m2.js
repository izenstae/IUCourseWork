/* ============================================================
 * ECON B251 · Module 2 — The Basic Economic Model: PPC
 * Three scarcity questions & factors of production, the production
 * possibilities curve, increasing opportunity cost, marginal cost and
 * marginal benefit, production vs allocative efficiency, absolute and
 * comparative advantage, gains from trade, economic growth, the
 * per-worker production function and growth rates (Rule of 70).
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const GOODS = [
    { s: "bicycle", p: "bicycles" }, { s: "laptop", p: "laptops" }, { s: "kayak", p: "kayaks" },
    { s: "tent", p: "tents" }, { s: "guitar", p: "guitars" }, { s: "drone", p: "drones" },
    { s: "sweater", p: "sweaters" }, { s: "telescope", p: "telescopes" }, { s: "skateboard", p: "skateboards" },
    { s: "tractor", p: "tractors" }, { s: "umbrella", p: "umbrellas" }, { s: "backpack", p: "backpacks" },
    { s: "lamp", p: "lamps" }, { s: "chair", p: "chairs" }, { s: "ton of wheat", p: "tons of wheat" },
    { s: "crate of apples", p: "crates of apples" }, { s: "bolt of cloth", p: "bolts of cloth" },
    { s: "loaf of bread", p: "loaves of bread" }, { s: "jar of honey", p: "jars of honey" },
    { s: "solar panel", p: "solar panels" }, { s: "pair of boots", p: "pairs of boots" },
    { s: "birdhouse", p: "birdhouses" }, { s: "vase", p: "vases" }, { s: "scooter", p: "scooters" },
  ];
  const PEOPLE = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix"];
  const COUNTRIES = ["Arvenia", "Belmora", "Corvatia", "Dalmark", "Esterra", "Fennland", "Galdova", "Halvany", "Istria Nova", "Jorvik"];
  const FIRMS = ["Northwind Works", "Bluepine Goods", "Redfern Labs", "Copperleaf Makers", "Maple & Stone", "Brightwater Mills", "Ironbark Labs", "Silverline Shop"];

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pl = (n, g) => (n === 1 ? g.s : g.p);
  const qty = (n, g) => `${U.fmt(n)} ${pl(n, g)}`;
  const two = () => U.sample(GOODS, 2);
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.map(step).join("");
  const d2 = x => U.fmt(U.round(x, 2), 2);
  /* An opportunity cost n/d shown as a whole number, or a fraction with its decimal. */
  const an = g => (/^[aeiou]/i.test(g.s) ? "an " : "a ") + g.s;
  const ocQ = (n, d, g) => `${ocStr(n, d)} ${n === d ? g.s : g.p}`;
  const ocStr = (n, d) => (n % d === 0 ? String(n / d) : `${U.frac(n, d)} ≈ ${d2(n / d)}`);

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
    const m = [1, 2, 2.5, 5, 10].find(k => k * p >= raw) * p;
    const out = [];
    for (let t = m; t <= max + 1e-9; t += m) out.push(U.round(t, 6));
    return out;
  }
  /* Two producers: people, workshops or countries, with a time unit to match. */
  function producers(noCountries) {
    const kind = U.pick(noCountries ? ["people", "firms"] : ["people", "firms", "countries"]);
    if (kind === "people") { const [a, b] = U.sample(PEOPLE, 2); return { a, b, per: "per hour", hr: "hour", hrs: "hours", kind }; }
    if (kind === "firms") { const [a, b] = U.sample(FIRMS, 2); return { a, b, per: "per worker-hour", hr: "worker-hour", hrs: "worker-hours", kind }; }
    const [a, b] = U.sample(COUNTRIES, 2);
    return { a, b, per: "per worker-hour", hr: "worker-hour", hrs: "worker-hours", kind };
  }

  /* A five-row PPC table. X is on the horizontal axis and rises A→E; Y falls.
   * `straight` gives a constant per-unit opportunity cost; otherwise it rises strictly. */
  function ppcTable(straight) {
    const dx = U.pick([1, 2, 5, 10]);
    const m = U.pick([1, 2, 5]);
    let ks;
    if (straight) { const k = U.randInt(1, 6); ks = [k, k, k, k]; }
    else { ks = [U.randInt(1, 3)]; for (let i = 1; i < 4; i++) ks.push(ks[i - 1] + U.randInt(1, 3)); }
    const per = ks.map(k => k * m);            // Y given up per extra unit of X, step i → i+1
    const cost = per.map(c => c * dx);         // Y given up per step
    const yMax = cost.reduce((a, b) => a + b, 0);
    const rows = [];
    let y = yMax;
    for (let i = 0; i < 5; i++) { rows.push({ label: "ABCDE"[i], x: i * dx, y }); if (i < 4) y -= cost[i]; }
    const [X, Y] = two();
    return { dx, per, cost, yMax, xMax: 4 * dx, rows, X, Y };
  }
  function ppcHtml(t, hide) {
    return tbl(["Combination", cap(t.X.p), cap(t.Y.p)],
      t.rows.map((r, i) => [r.label, U.fmt(r.x), hide === i ? "?" : U.fmt(r.y)]));
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "The three scarcity questions and the factors of production",
      lo: "Distinguish among the three scarcity questions and identify the factors of production and the income each earns.",
      html: `<p>Wants are unlimited but resources are not, so every society — rich or poor, market or planned — must answer three questions:</p>
<ul>
  <li><b>What</b> goods and services to produce, and how much of each? With fixed resources, making more of one thing means making less of something else in the same period.</li>
  <li><b>How</b> to produce them — which combination of inputs (more machines and fewer workers, or the reverse?).</li>
  <li><b>For whom</b> to produce — who ends up with the output. In a market economy that depends on the <b>incomes</b> people earn.</li>
</ul>
<p>The inputs used to make goods and services are the <b>factors of production</b>. There are four, and each earns its own kind of income:</p>
<table class="data-tbl"><thead><tr><th>Factor</th><th>What it is</th><th>Income</th></tr></thead><tbody>
<tr><td><b>Land</b></td><td>All natural resources, the "gifts of nature": ground, water, minerals, forests, fish in the sea, sunlight.</td><td>Rent</td></tr>
<tr><td><b>Labor</b></td><td>Human time and effort — mental as well as physical.</td><td>Wages</td></tr>
<tr><td><b>Capital</b></td><td><em>Physical capital</em>: manufactured resources used to make other goods (machines, tools, buildings). <em>Human capital</em>: the education, training and skills workers have built up.</td><td>Interest</td></tr>
<tr><td><b>Entrepreneurship</b></td><td>The special kind of effort that organizes the other three, makes the basic business decisions and bears the risk.</td><td>Profit</td></tr>
</tbody></table>
<div class="keyidea"><b>Key idea.</b> "For whom" is answered by factor incomes: rent to landowners, wages to workers, interest to suppliers of capital, profit to entrepreneurs.</div>
<div class="example"><b>Example.</b> Noor opens a smoothie stand. The corner lot she leases is <b>land</b> (its owner gets rent). The two teenagers blending drinks supply <b>labor</b> (wages). The blenders, freezer and cart are <b>physical capital</b>, and Noor's food-safety certificate is <b>human capital</b>. Noor herself — choosing the menu, risking her savings — is the <b>entrepreneur</b>, and whatever is left after paying everyone else is her profit. The $8,000 bank loan she used to buy the cart is <em>not</em> a factor: it is money that bought capital, and the bank earns interest on it.</div>
<div class="trap"><b>Common trap.</b> Money, stocks and bonds are <em>financial</em> assets, not capital. They cannot produce anything themselves; they only buy the machines and buildings that do. In this course "capital" means physical capital (things made to make other things) or human capital (skills).</div>`,
      gens: ["b251-m2-factors"],
    },
    {
      title: "The production possibilities curve (PPC)",
      lo: "Use the PPC and its assumptions to illustrate scarcity, choice and opportunity cost, and classify points as efficient, inefficient or unattainable.",
      html: `<p>The <b>production possibilities curve</b> (PPC, also called the production possibilities frontier) shows every <em>maximum</em> combination of two goods an economy can produce when it uses its resources and technology fully and efficiently. It rests on four assumptions:</p>
<ul>
  <li>resources are <b>fully employed</b> (and used efficiently);</li>
  <li>production is measured over a <b>specific time period</b>;</li>
  <li>the quantity and quality of resources are <b>fixed</b> for that period;</li>
  <li><b>technology does not change</b> during that period.</li>
</ul>
<p>The curve sorts every possible point into three groups. Points <b>on</b> the curve are <b>efficient</b>. Points <b>inside</b> it are <b>inefficient</b>: some resources are unemployed or misallocated, so more of one good could be made without giving up any of the other. Points <b>outside</b> it are <b>unattainable</b> with current resources and technology.</p>
${G.plot({ xLabel: "Kayaks (per week)", yLabel: "Solar panels (per week)", xMax: 50, yMax: 140, xTicks: [10, 20, 30, 40, 50], yTicks: [30, 60, 90, 120],
    curves: [{ pts: [[0, 120], [10, 110], [20, 90], [30, 60], [40, 0]], style: "main" }],
    points: [{ x: 0, y: 120, label: "A" }, { x: 10, y: 110, label: "B" }, { x: 20, y: 90, label: "C" }, { x: 30, y: 60, label: "D" }, { x: 40, y: 0, label: "E" },
      { x: 20, y: 45, label: "W", style: "hollow" }, { x: 32, y: 100, label: "Z", style: "hollow" }], aria: "PPC for kayaks and solar panels" })}
<p>Moving <em>along</em> the curve shows the tradeoff. The <b>opportunity cost</b> of the move is the amount of the other good you must give up:</p>
<ol>
  <li>Find how much of the good you <em>gain</em> (change along its axis).</li>
  <li>Find how much of the other good you <em>give up</em> (the fall along the other axis). That fall is the total opportunity cost.</li>
  <li>For the cost <em>per unit</em>, divide: units given up ÷ units gained.</li>
</ol>
<div class="example"><b>Example.</b> A lake town can make these weekly combinations: A (0 kayaks, 120 panels), B (10, 110), C (20, 90), D (30, 60), E (40, 0). Moving from C to D gains 10 kayaks and gives up 90 − 60 = <b>30 solar panels</b>, so each extra kayak costs 30 ÷ 10 = <b>3 panels</b>. Going back from D to C, each extra panel costs 10 ÷ 30 = 1/3 of a kayak. Point W (20, 45) is inside the curve, so it is inefficient. Point Z (32, 100) is outside it, so it is unattainable.</div>
<div class="keyidea"><b>Key idea.</b> Opportunity cost is always measured in units of the good <em>given up</em>. Per unit, it is (amount given up) ÷ (amount gained).</div>
<div class="trap"><b>Common trap.</b> A recession or idle factories move the economy to a point <em>inside</em> the curve; they do not shift the curve, because the resources still exist. The curve itself shifts only when the quantity of resources or the technology changes.</div>`,
      gens: ["b251-m2-ppc"],
    },
    {
      title: "Increasing opportunity cost, marginal cost and marginal benefit",
      lo: "Explain the law of increasing relative cost and the shape of the PPC, and relate opportunity cost to marginal cost and preferences to marginal benefit.",
      html: `<p>Look again at the kayak table. The cost of each extra kayak rises as more kayaks are made: 1, then 2, then 3, then 6 panels per kayak. This is the <b>law of increasing relative cost</b>: the more of a good society makes, the higher the opportunity cost of each additional unit. The reason is that resources are <em>not equally suited</em> to every use. The first workers moved into kayak-building are the ones who are good at it and not much use for panels. Later you have to pull in panel specialists, who add few kayaks and cost a lot of panels.</p>
<p>That rising cost is what makes the PPC <b>bowed outward</b> (concave to the origin), getting steeper as you move along the horizontal axis. If resources were equally good at both goods, the cost would be constant and the PPC would be a <b>straight line</b>.</p>
<p>The <b>marginal cost (MC)</b> of a good is the opportunity cost of producing <em>one more</em> unit of it. Read it off the PPC as the per-unit cost of each step. Because opportunity cost increases, the <b>MC curve slopes upward</b>.</p>
<p>On the demand side, <b>preferences</b> describe what people like. Economists measure them with <b>marginal benefit (MB)</b>: the benefit from consuming one more unit, measured by the most a person is <b>willing to pay</b> for it (in dollars or in units of another good). The <b>principle of decreasing marginal benefit</b> says that the more of a good we already have, the less we value one more unit, so the <b>MB curve slopes downward</b>.</p>
<div class="example"><b>Example.</b> Dev would pay $60 for a first concert ticket this month, $45 for a second, $30 for a third and $20 for a fourth. Those are his marginal benefits: each ticket adds less than the one before. Meanwhile, from the table above, the MC of the 1st–10th kayak is 1 panel each, of the 11th–20th is 2 panels, of the 21st–30th is 3, and of the 31st–40th is 6. MC rises while MB falls.</div>
<div class="keyidea"><b>Key idea.</b> Bowed-out PPC ⇔ increasing opportunity cost ⇔ upward-sloping MC. Straight-line PPC ⇔ constant opportunity cost.</div>
<div class="trap"><b>Common trap.</b> "Marginal" means the <em>next</em> unit, not the total. The MC of the 30th kayak is what that one kayak costs (3 panels), not everything given up to get from 0 to 30 kayaks (60 panels).</div>`,
      gens: ["b251-m2-incrcost", "b251-m2-alloc"],
    },
    {
      title: "Production efficiency vs allocative efficiency",
      lo: "Distinguish production efficiency from allocative efficiency and use MB and MC to find the allocatively efficient quantity.",
      html: `<p><b>Production efficiency</b> means you cannot produce more of one good without producing less of another. Every point <em>on</em> the PPC has it; points inside do not.</p>
<p><b>Allocative efficiency</b> is stricter. It asks which point on the PPC society values most. We have it when we cannot produce more of a good without giving up something we value <em>more</em>. That happens at the quantity where <b>marginal benefit equals marginal cost</b>:</p>
<ul>
  <li>If <b>MB &gt; MC</b>, one more unit is worth more than it costs, so produce <b>more</b>.</li>
  <li>If <b>MC &gt; MB</b>, the last unit cost more than it was worth, so produce <b>less</b>.</li>
  <li>If <b>MB = MC</b>, there is no gain from changing, so this is the allocatively efficient point.</li>
</ul>
${G.plot({ xLabel: "Community gardens", yLabel: "MB and MC ($ thousands)", xMax: 8, yMax: 12, xTicks: [1, 2, 3, 4, 5, 6, 7, 8], yTicks: [2, 4, 6, 8, 10, 12],
    curves: [{ pts: [[0, 12], [8, 0]], style: "main", label: "MB", labelAt: 0 }, { pts: [[0, 2], [8, 10]], style: "alt", label: "MC", labelAt: 0 }],
    points: [{ x: 4, y: 6, label: "M" }], aria: "MB and MC crossing at four gardens" })}
<div class="example"><b>Example.</b> A city is deciding how many community gardens to build. The MB of the <em>q</em>-th garden is 12 − 1.5<em>q</em> thousand dollars, and its MC is 2 + <em>q</em> thousand dollars. At 3 gardens, MB = 7.5 and MC = 5: MB &gt; MC, so build more. At 5 gardens, MB = 4.5 and MC = 7: MC &gt; MB, so build fewer. At 4 gardens, MB = MC = 6 (point M). Four gardens is allocatively efficient.</div>
<div class="keyidea"><b>Key idea.</b> Every allocatively efficient point is production efficient, but most production-efficient points are not allocatively efficient. Only one point on the PPC is the best one.</div>
<div class="trap"><b>Common trap.</b> "We're on the PPC, so we're doing the best we can" is false. Being on the curve only means nothing is wasted. You could still be making far too much of one good and too little of the other.</div>`,
      gens: ["b251-m2-alloc", "b251-m2-ppc"],
    },
    {
      title: "Absolute advantage, comparative advantage and gains from trade",
      lo: "Determine absolute and comparative advantage and show how specialization and exchange increase consumption.",
      html: `<p><b>Absolute advantage</b> compares <em>productivity</em>. A producer has it if they can make more of a good with the same resources (or the same amount with fewer resources). <b>Comparative advantage</b> compares <em>opportunity costs</em>. A producer has it if they can make the good at a <b>lower opportunity cost</b> than someone else. Comparative advantage is what decides who should specialize in what.</p>
<p><b>How to compute it.</b> Use the right formula for how the data are given:</p>
<ul>
  <li><b>Output per hour</b> (e.g. "6 loaves or 2 hats per hour"): OC of 1 loaf = hats per hour ÷ loaves per hour. Put the good <em>given up</em> on top.</li>
  <li><b>Hours (or workers) per unit</b> (e.g. "2 hours per ton of wheat, 5 hours per bolt of cloth"): OC of 1 wheat = hours per wheat ÷ hours per cloth. Now the good <em>you want</em> is on top, because time spent on one wheat is time not spent making cloth.</li>
</ul>
<p>Whoever has the lower OC of a good has the comparative advantage in it. With two producers and two goods, if one has the comparative advantage in X, the other has it in Y (unless their OCs are equal).</p>
<div class="example"><b>Example (output per hour).</b> In one hour Ines can bake 6 loaves or knit 2 hats; Rafa can bake 4 loaves or knit 4 hats. Ines's OC of a hat is 6 ÷ 2 = 3 loaves; Rafa's is 4 ÷ 4 = 1 loaf. So <b>Rafa</b> has the comparative advantage in hats. Ines's OC of a loaf is 2 ÷ 6 = 1/3 hat versus Rafa's 1 hat, so <b>Ines</b> has it in bread.<br><br>
<b>Gains from trade.</b> Each works 8 hours. With no trade and 4 hours on each good, Ines makes 24 loaves and 8 hats, and Rafa makes 16 loaves and 16 hats (40 loaves and 24 hats in total). If each specializes, Ines bakes 48 loaves and Rafa knits 32 hats: more of <em>both</em> goods in total. If they then trade 20 loaves for 10 hats (2 loaves per hat), Ines ends with 28 loaves and 10 hats, and Rafa with 20 loaves and 22 hats. Both have more of both goods than before.</div>
<div class="example"><b>Example (hours per unit).</b> Country P needs 2 hours per ton of wheat and 5 hours per bolt of cloth; country Q needs 4 hours and 6 hours. P has the <em>absolute</em> advantage in both goods because it needs fewer hours. But P's OC of a ton of wheat is 2 ÷ 5 = 0.4 cloth, while Q's is 4 ÷ 6 ≈ 0.67 cloth, so P has the comparative advantage in <b>wheat</b>. Q's OC of a bolt of cloth is 6 ÷ 4 = 1.5 wheat, below P's 5 ÷ 2 = 2.5 wheat, so Q has it in <b>cloth</b>.</div>
${G.plot({ xLabel: "Loaves (Ines, per day)", yLabel: "Hats (Ines, per day)", xMax: 60, yMax: 20, xTicks: [8, 16, 24, 32, 40, 48], yTicks: [4, 8, 12, 16, 20],
    curves: [{ pts: [[0, 16], [48, 0]], style: "main", label: "Ines's PPC", labelAt: 0 }],
    points: [{ x: 24, y: 8, label: "no trade" }, { x: 48, y: 0, label: "produces" }, { x: 28, y: 10, label: "consumes" }], aria: "Ines consumes outside her PPC after trade" })}
<p><b>Terms of trade.</b> A trade helps both sides only if the price lies <em>strictly between</em> the two opportunity costs. Here a hat must cost between 1 loaf (Rafa's cost) and 3 loaves (Ines's cost). At 2 loaves per hat, both gain.</p>
<div class="keyidea"><b>Key idea.</b> Specialization by comparative advantage and trade let each party <b>consume at a point outside its own PPC</b>. That is why people trade, even when one side is better at everything.</div>
<div class="trap"><b>Common trap.</b> Having the absolute advantage does not mean you have the comparative advantage. A producer can be faster at <em>both</em> goods yet have the comparative advantage in only one. Also watch for <em>flipping</em> the formula: in the hours-per-unit format the ratio is the reverse of the output-per-hour format.</div>`,
      gens: ["b251-m2-compadv", "b251-m2-trade"],
    },
    {
      title: "Economic growth and the PPC",
      lo: "Show economic growth, the choice between capital and consumption goods, and technological change with the PPC.",
      html: `<p><b>Economic growth</b> is an increase in an economy's capacity to produce, and it raises living standards. On the graph it is an <b>outward shift</b> of the whole PPC. It comes from <b>more resources</b> (more workers, more capital, newly found natural resources, more human capital) or <b>better technology</b>. A loss of resources, such as a war or disaster that destroys factories, shifts the curve <b>inward</b>.</p>
<p>If a new technology helps only <em>one</em> good, the PPC <b>pivots</b> (the dashed curve below) (rotates) outward along that good's axis only. The intercept on the other axis stays where it is, because if you put everything into the other good the new technique does not help.</p>
${G.plot({ xLabel: "Medical scanners", yLabel: "Wind turbines", xMax: 75, yMax: 110, xTicks: [10, 20, 30, 40, 50, 60], yTicks: [20, 40, 60, 80, 100],
    curves: [{ pts: G.bowed(40, 80), style: "main", label: "PPC₁", labelAt: 22 },
      { pts: G.bowed(52, 100), style: "alt", label: "PPC₂ (growth)", labelAt: 8 },
      { pts: G.bowed(60, 80), style: "dash", label: "pivot", labelAt: 26 }], aria: "PPC shifts out, or pivots on one axis" })}
<p><b>Capital goods vs consumption goods.</b> Consumption goods (food, entertainment) satisfy wants today. Capital goods (machines, factories, research) are used to make other goods. An economy that puts more resources into capital goods <em>now</em> gets a larger PPC <em>later</em>. The <b>opportunity cost of economic growth is current consumption</b>: growth is not free.</p>
<div class="example"><b>Example.</b> Two islands start with identical PPCs. Kestria spends 30% of its output on new equipment and training; Lowmere spends 10% and enjoys more consumer goods today. Ten years on, Kestria's PPC has moved out much further, so its people can consume more of everything. They gave up some consumption at the start to get there.</div>
<div class="keyidea"><b>Key idea.</b> Shift out = more resources or better technology for both goods. Pivot = better technology for one good. Inside the curve = idle or misallocated resources. Along the curve = a different choice of mix.</div>
<div class="trap"><b>Common trap.</b> Unemployment does not shift the PPC inward. The workers still exist, so the economy simply operates <em>inside</em> its curve. Only a real loss of resources shifts the curve in.</div>`,
      gens: ["b251-m2-growth"],
    },
    {
      title: "The per-worker production function",
      lo: "Analyze how capital per hour worked and technological change affect real GDP per hour worked.",
      html: `<p>To explain long-run growth in living standards, economists look at <b>labor productivity</b>: real GDP per hour worked, <b>Q/L</b>. The <b>per-worker production function</b> graphs Q/L (vertical) against <b>capital per hour worked, K/L</b> (horizontal), holding technology constant. More generally, output depends on technology and inputs: <b>Q = A · F(K, L, H, N)</b>, where A is technology, K physical capital, L labor, H human capital and N natural resources.</p>
<ul>
  <li><b>More capital per hour (K/L rises)</b>, same technology: a <b>movement along</b> the curve to higher Q/L. Each extra dollar of capital per hour adds less than the one before. These are <b>diminishing returns</b>, so the curve flattens.</li>
  <li><b>Technological change</b> (better machines, new software, smarter management, new methods): the whole curve <b>shifts up</b>, giving more Q/L at <em>every</em> level of K/L.</li>
</ul>
${G.plot({ xLabel: "Capital per hour worked, K/L ($)", yLabel: "Real GDP per hour, Q/L ($)", xMax: 20000, yMax: 60, xTicks: [4000, 8000, 12000, 16000, 20000], yTicks: [10, 20, 30, 40, 50, 60],
    curves: [{ pts: Array.from({ length: 41 }, (_, i) => [i * 500, 0.3 * Math.sqrt(i * 500)]), style: "main", label: "PF₁", labelAt: 38 },
      { pts: Array.from({ length: 41 }, (_, i) => [i * 500, 0.4 * Math.sqrt(i * 500)]), style: "alt", label: "PF₂", labelAt: 35 }],
    points: [{ x: 4000, y: 19, label: "A" }, { x: 16000, y: 37.9, label: "B" }, { x: 16000, y: 50.6, label: "C" }],
    arrows: [{ from: [5000, 21.2], to: [15000, 36.7] }, { from: [16000, 39.8], to: [16000, 48.6] }], aria: "Movement along vs shift of the per-worker production function" })}
<div class="example"><b>Example.</b> In a country, capital per hour of $10,000, $20,000, $30,000 and $40,000 gives Q/L of $30, $42, $51 and $58. Each extra $10,000 of capital per hour adds $12, then $9, then $7 of output per hour. Those are diminishing returns, a movement along the curve (like A → B on the graph). If new software then lets workers with $40,000 of capital produce $66 an hour, the curve has shifted up (like B → C, from PF₁ to PF₂).</div>
<div class="keyidea"><b>Key idea.</b> Because of diminishing returns, piling up capital alone eventually adds almost nothing. <b>Sustained</b> growth in real GDP per person, and so in living standards, requires <b>continuing technological change</b>.</div>
<div class="trap"><b>Common trap.</b> More capital per worker does <em>not</em> shift the per-worker production function. It is a move along the curve, because K/L is the variable on the axis. Only a change in technology (or anything else held constant) shifts the curve.</div>`,
      gens: ["b251-m2-growth"],
    },
    {
      title: "Growth rates, compounding and the Rule of 70",
      lo: "Compute compound growth and doubling times, and explain why small differences in growth rates matter.",
      html: `<p>Growth compounds: each year's growth builds on the previous year's higher level, not on the starting value. After <em>N</em> years at a constant annual rate <em>g</em> (as a decimal):</p>
<p style="text-align:center"><b>New value = Old value × (1 + g)<sup>N</sup></b></p>
<p>A handy shortcut is the <b>Rule of 70</b>: the number of years for something to <b>double</b> is about <b>70 ÷ (growth rate in percent)</b>. Turned around, the growth rate needed to double in <em>N</em> years is about 70 ÷ <em>N</em> percent. Over <em>T</em> years there are about T ÷ (70/g) doublings, so the variable multiplies by 2 for each doubling.</p>
<div class="example"><b>Example.</b> Real GDP per person of $30,000 growing 3% a year for 20 years becomes 30,000 × 1.03<sup>20</sup> ≈ 30,000 × 1.806 ≈ <b>$54,183</b>, not the $48,000 that simple (non-compounded) growth of 3% × 20 = 60% would suggest. By the Rule of 70 it doubles in 70 ÷ 3 ≈ 23 years. Compare a country growing at 1%: after 50 years it is 1.01<sup>50</sup> ≈ 1.64 times as rich, while a 3% grower is 1.03<sup>50</sup> ≈ 4.38 times as rich. The 2-point gap leaves the faster economy about 2.7 times richer.</div>
<div class="keyidea"><b>Key idea.</b> Because growth compounds, small differences in growth rates turn into huge differences in living standards over a few decades.</div>
<div class="trap"><b>Common trap.</b> Do not use simple growth (Old × (1 + g × N)) or "100 ÷ g" for the doubling time. Both ignore compounding and overstate the time it takes to double. Also enter g in the Rule of 70 as a <em>percent</em> (3, not 0.03).</div>`,
      gens: ["b251-m2-rule70"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m2-c-three-q", tag: "Definition", front: "What are the three scarcity questions every society must answer?", back: "<b>What</b> to produce (and how much), <b>how</b> to produce it (which mix of factors), and <b>for whom</b> (who gets the output — decided by incomes)." },
    { id: "b251-m2-c-factors", tag: "Definition", front: "Name the four factors of production and the income each earns.", back: "Land → <b>rent</b>; labor → <b>wages</b>; capital → <b>interest</b>; entrepreneurship → <b>profit</b>." },
    { id: "b251-m2-c-land", tag: "Definition", front: "What counts as <em>land</em> in economics?", back: "All <b>natural resources</b>, the gifts of nature: ground, water, minerals, forests, wild fish, sunlight. It is more than just real estate." },
    { id: "b251-m2-c-capital", tag: "Distinction", front: "Physical capital vs human capital?", back: "<b>Physical capital</b>: manufactured resources used to produce other goods (machines, tools, buildings). <b>Human capital</b>: the accumulated education, training and skills of workers." },
    { id: "b251-m2-c-money-trap", tag: "Example", front: "Is $50,000 in a company's bank account “capital” as a factor of production?", back: "<b>No.</b> Money, stocks and bonds are financial assets. They can <em>buy</em> capital but produce nothing themselves. A forklift bought with the money is capital." },
    { id: "b251-m2-c-entre", tag: "Definition", front: "What does the entrepreneur do?", back: "Organizes and combines land, labor and capital, makes the basic business-policy decisions and <b>bears the risk</b>. The reward is <b>profit</b>." },
    { id: "b251-m2-c-ppc", tag: "Definition", front: "What is the production possibilities curve (PPC)?", back: "A graph of all the <b>maximum</b> combinations of two goods an economy can produce with fixed resources and technology, used fully and efficiently." },
    { id: "b251-m2-c-ppc-assume", tag: "Principle", front: "List the four assumptions behind a PPC.", back: "1) Resources fully employed; 2) a specific time period; 3) resources fixed for that period; 4) technology unchanged during that period." },
    { id: "b251-m2-c-points", tag: "Distinction", front: "Point on, inside and outside the PPC — what does each mean?", back: "<b>On</b>: efficient. <b>Inside</b>: inefficient (unemployed or misallocated resources). <b>Outside</b>: unattainable with current resources and technology." },
    { id: "b251-m2-c-oc-ppc", tag: "Formula", front: "How do you measure opportunity cost from a PPC table?", back: "Total OC = units of the other good given up when you move. Per-unit OC = (units given up) ÷ (units gained). E.g. (10 drones, 70 tents) → (15 drones, 50 tents): 20 tents ÷ 5 drones = <b>4 tents per drone</b>." },
    { id: "b251-m2-c-incr", tag: "Principle", front: "State the law of increasing relative cost.", back: "As society produces more of a good, the opportunity cost of each additional unit <b>rises</b>." },
    { id: "b251-m2-c-bowed-why", tag: "Why", front: "Why is a typical PPC bowed outward?", back: "Resources are <b>not equally suited</b> to both goods. Expanding one good pulls in resources that are less and less suited to it, so each extra unit costs more of the other good. (Equally suited resources would give a <b>straight line</b>: constant cost.)" },
    { id: "b251-m2-c-mc", tag: "Definition", front: "What is the marginal cost of a good, and how does it behave along a bowed-out PPC?", back: "The <b>opportunity cost of producing one more unit</b>. It <b>rises</b> as more of the good is produced, so the MC curve slopes upward." },
    { id: "b251-m2-c-mb", tag: "Definition", front: "What is marginal benefit, and how is it measured?", back: "The benefit from consuming <b>one more unit</b>, measured by the most a person is <b>willing to pay</b> for it (in dollars or units of another good)." },
    { id: "b251-m2-c-dmb", tag: "Principle", front: "What is the principle of decreasing marginal benefit?", back: "The more of a good we already have, the less we value one more unit, so willingness to pay falls and the <b>MB curve slopes downward</b>." },
    { id: "b251-m2-c-prodeff", tag: "Definition", front: "Production efficiency", back: "You <b>cannot produce more of one good without producing less of another</b>. Every point on the PPC has it." },
    { id: "b251-m2-c-alloceff", tag: "Definition", front: "Allocative efficiency", back: "Producing the point on the PPC society <b>values most</b>: you cannot get more of a good without giving up something valued more. It occurs where <b>MB = MC</b>." },
    { id: "b251-m2-c-mbmc-rule", tag: "Principle", front: "MB &gt; MC at the current quantity — produce more or less? And if MC &gt; MB?", back: "MB &gt; MC → produce <b>more</b> (the next unit is worth more than it costs). MC &gt; MB → produce <b>less</b>. Stop where MB = MC." },
    { id: "b251-m2-c-eff-trap", tag: "Why", front: "Is every point on the PPC allocatively efficient?", back: "<b>No.</b> Every point on the PPC is production efficient, but only one (where MB = MC) is allocatively efficient." },
    { id: "b251-m2-c-absadv", tag: "Definition", front: "Absolute advantage", back: "Being able to produce <b>more</b> of a good with the same resources, or the same amount with <b>fewer</b> resources. It compares <b>productivity</b>." },
    { id: "b251-m2-c-compadv", tag: "Definition", front: "Comparative advantage", back: "Being able to produce a good at a <b>lower opportunity cost</b> than someone else. It compares <b>opportunity costs</b> and decides who should specialize in what." },
    { id: "b251-m2-c-ca-calc", tag: "Calculation", front: "In one hour Ana makes 8 mugs or 2 bowls; Ben makes 3 mugs or 3 bowls. Who has the comparative advantage in bowls?", back: "Ana's OC of a bowl = 8 ÷ 2 = 4 mugs; Ben's = 3 ÷ 3 = 1 mug. <b>Ben</b> (lower OC), even though Ana makes more mugs." },
    { id: "b251-m2-c-hours-format", tag: "Formula", front: "If data are given as <em>hours needed per unit</em>, how do you find the OC of one X?", back: "OC of 1 X = (hours per X) ÷ (hours per Y), in units of Y. This is the reverse of the output-per-hour format, where OC of 1 X = (Y per hour) ÷ (X per hour)." },
    { id: "b251-m2-c-both-abs", tag: "Example", front: "Can a producer with the absolute advantage in <em>both</em> goods still gain from trade?", back: "<b>Yes.</b> They cannot have the lower OC in both goods, so they still have a comparative advantage in only one. Specializing in it and trading benefits both sides." },
    { id: "b251-m2-c-equal-oc", tag: "Distinction", front: "What if two producers have the <em>same</em> opportunity costs?", back: "Neither has a comparative advantage, so specialization and trade create <b>no gains</b>." },
    { id: "b251-m2-c-tot", tag: "Principle", front: "Which terms of trade benefit both parties?", back: "A price of X (in units of Y) that lies <b>strictly between</b> the two producers' opportunity costs of X." },
    { id: "b251-m2-c-gains", tag: "Why", front: "Why trade? What do specialization and trade let each party do?", back: "Specializing by comparative advantage raises total output, and trade lets each party <b>consume a bundle outside its own PPC</b>." },
    { id: "b251-m2-c-growth", tag: "Definition", front: "How is economic growth shown on a PPC, and what causes it?", back: "An <b>outward shift</b> of the PPC, caused by <b>more resources</b> (labor, capital, human capital, natural resources) or <b>better technology</b>." },
    { id: "b251-m2-c-pivot", tag: "Example", front: "A new technique raises output of only one good. How does the PPC change?", back: "It <b>pivots outward along that good's axis</b>. The other good's intercept stays put." },
    { id: "b251-m2-c-capcons", tag: "Distinction", front: "Capital goods vs consumption goods — and what is the opportunity cost of growth?", back: "Consumption goods satisfy wants now; capital goods make other goods. Producing more capital goods today grows the PPC later. The OC of growth is <b>less current consumption</b>." },
    { id: "b251-m2-c-pwpf", tag: "Definition", front: "What does the per-worker production function show?", back: "Real GDP per hour worked (<b>Q/L</b>) against capital per hour worked (<b>K/L</b>), holding technology constant. It shows <b>diminishing returns</b> to capital." },
    { id: "b251-m2-c-pwpf-shift", tag: "Distinction", front: "More capital per hour vs better technology — what happens on the per-worker production function?", back: "More K/L → <b>movement along</b> the curve (with diminishing returns). Technological change → the curve <b>shifts up</b> (more Q/L at every K/L)." },
    { id: "b251-m2-c-qaf", tag: "Formula", front: "What do the letters in Q = A·F(K, L, H, N) stand for?", back: "Q output; <b>A</b> technology; <b>K</b> physical capital; <b>L</b> labor; <b>H</b> human capital; <b>N</b> natural resources." },
    { id: "b251-m2-c-sustained", tag: "Why", front: "Why does sustained growth in living standards require technological change?", back: "Adding capital per worker runs into <b>diminishing returns</b>. Only continuing technological progress keeps shifting the function up." },
    { id: "b251-m2-c-compound", tag: "Formula", front: "Compound growth formula", back: "New = Old × (1 + g)<sup>N</sup>, with g as a decimal and N the number of years." },
    { id: "b251-m2-c-rule70", tag: "Formula", front: "Rule of 70", back: "Years to double ≈ <b>70 ÷ growth rate (in percent)</b>. E.g. 3.5% a year → about 20 years." },
    { id: "b251-m2-c-rule70-calc", tag: "Calculation", front: "Income of $25,000 grows 7% a year. Roughly what is it after 30 years?", back: "Doubling time ≈ 70 ÷ 7 = 10 years, so 3 doublings: 25,000 × 2³ = <b>$200,000</b>." },
    { id: "b251-m2-c-smalldiff", tag: "Why", front: "Why do small differences in growth rates matter so much?", back: "Growth <b>compounds</b>: each year builds on a higher base. Over decades a 1–2 point gap turns into a several-fold difference in living standards." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“natural resource”, “gift of nature”, “ore”, “soil”, “fishery”", think: "Land (earns rent)", why: "Land means all natural resources, not just real estate." },
    { when: "“machine”, “tool”, “building” used to make other goods", think: "Physical capital (earns interest)", why: "Capital is manufactured and used to produce other goods." },
    { when: "“money”, “stocks”, “bonds”, “savings account”", think: "NOT a factor of production", why: "Financial assets buy capital but produce nothing themselves." },
    { when: "“takes the risk”, “organizes”, “starts a business”", think: "Entrepreneurship (earns profit)", why: "The entrepreneur combines the other factors and bears the risk." },
    { when: "“point inside the curve”, “recession”, “idle factories”", think: "Inefficiency (not a shift)", why: "Resources exist but are unemployed or misallocated." },
    { when: "“give up … to get one more …”", think: "Opportunity cost = given up ÷ gained", why: "Always measured in units of the good sacrificed." },
    { when: "OC per unit rises down the table / curve bowed out", think: "Law of increasing relative cost", why: "Resources are not equally suited to both goods." },
    { when: "OC per unit constant / straight-line PPC", think: "Constant opportunity cost", why: "Resources are equally good at producing either good." },
    { when: "“willing to pay”, “the more they have, the less …”", think: "Marginal benefit / decreasing MB", why: "MB is measured by willingness to pay and falls as quantity rises." },
    { when: "“best point”, “MB = MC”, “mix society values most”", think: "Allocative efficiency", why: "Produce more if MB > MC, less if MC > MB." },
    { when: "“can produce more”, “fewer hours per unit”", think: "Absolute advantage", why: "Compares productivity, not opportunity cost." },
    { when: "“lower opportunity cost”, “who should specialize”", think: "Comparative advantage", why: "Specialization and trade follow opportunity costs." },
    { when: "“new technology in one industry”", think: "PPC pivots on that good's axis", why: "Only that good's maximum output rises." },
    { when: "“more capital per worker” vs “new technology” (Q/L graph)", think: "Move along vs shift up the per-worker function", why: "K/L is on the axis; technology is held constant along a curve." },
    { when: "“years to double”, “how long until twice”", think: "Rule of 70: 70 ÷ g%", why: "A shortcut for compound growth." },
    { when: "“after N years at g% a year”", think: "Old × (1 + g)<sup>N</sup>", why: "Growth compounds; do not just multiply g by N." },
  ];

  /* ============================================================
   * PRACTICE 1 — Factors of production & the three questions
   * ============================================================ */
  const CAP = "Capital (physical or human)";
  const FACTOR_BANK = [
    { t: "An underground deposit of copper", cat: "Land", why: "Minerals in the ground are a natural resource, which counts as land." },
    { t: "Rainfall that waters a vineyard", cat: "Land", why: "Rain is a gift of nature, so it is land." },
    { t: "A river used to cool a power plant", cat: "Land", why: "The river is a natural resource, so it is land." },
    { t: "Wild salmon in a coastal fishery", cat: "Land", why: "Wild fish are a natural resource; land includes the sea, not just ground." },
    { t: "Timber standing in an uncut forest", cat: "Land", why: "An uncut forest is a natural resource, so it is land." },
    { t: "Fertile soil in a river valley", cat: "Land", why: "Soil is provided by nature, so it is land." },
    { t: "The wind that turns a wind farm's blades", cat: "Land", why: "The wind itself is a natural resource. The turbines would be capital." },
    { t: "The hours a barista spends making drinks", cat: "Labor", why: "Human time and effort is labor." },
    { t: "A delivery driver's work on her route", cat: "Labor", why: "Human effort is labor." },
    { t: "A software tester's time spent hunting for bugs", cat: "Labor", why: "Labor includes mental effort, not just physical work." },
    { t: "A carpenter's effort framing a house", cat: "Labor", why: "Human effort is labor." },
    { t: "A nurse working a night shift", cat: "Labor", why: "Human time and effort is labor." },
    { t: "A cashier scanning groceries", cat: "Labor", why: "Human time and effort is labor." },
    { t: "A forklift in a warehouse", cat: CAP, why: "A manufactured tool used to produce other goods and services is physical capital." },
    { t: "The ovens in a bakery", cat: CAP, why: "The ovens are manufactured equipment used in production, so they are physical capital." },
    { t: "A factory building", cat: CAP, why: "Buildings used in production are physical capital." },
    { t: "A dentist's X-ray machine", cat: CAP, why: "Manufactured equipment used to provide a service is physical capital." },
    { t: "A farmer's irrigation pumps", cat: CAP, why: "The pumps are manufactured and used to grow crops, so they are physical capital. (The water itself would be land.)" },
    { t: "The skills an electrician gained in a four-year apprenticeship", cat: CAP, why: "Accumulated training is human capital." },
    { t: "A pilot's years of flight training", cat: CAP, why: "Training that raises a worker's productivity is human capital." },
    { t: "An engineer's university degree", cat: CAP, why: "Education is human capital." },
    { t: "A founder who risks her savings to launch a bike-repair start-up", cat: "Entrepreneurship", why: "Organizing a business and bearing its risk is entrepreneurship." },
    { t: "An owner who decides to open a second store and bears the loss if it fails", cat: "Entrepreneurship", why: "Making basic business decisions and taking the risk is entrepreneurship." },
    { t: "A person who brings together land, workers and equipment to start a new brewery", cat: "Entrepreneurship", why: "Combining the other factors is the entrepreneur's job." },
    { t: "An inventor who sets up a company to bring her gadget to market", cat: "Entrepreneurship", why: "Organizing production around a new idea and taking the risk is entrepreneurship." },
  ];
  const KIND_BANK = [
    { t: "A forklift in a warehouse", cat: "Physical capital", why: "It is manufactured and used to produce other things." },
    { t: "The ovens in a bakery", cat: "Physical capital", why: "Manufactured equipment used in production." },
    { t: "A delivery company's fleet of vans", cat: "Physical capital", why: "Manufactured vehicles used to provide a service." },
    { t: "A recording studio's mixing desk", cat: "Physical capital", why: "Manufactured equipment used to produce music." },
    { t: "A factory building", cat: "Physical capital", why: "A structure used in production." },
    { t: "A pilot's years of flight training", cat: "Human capital", why: "Accumulated training is human capital." },
    { t: "A nurse's bachelor's degree", cat: "Human capital", why: "Education is human capital." },
    { t: "The skills a welder learned in an apprenticeship", cat: "Human capital", why: "Training-based skill is human capital." },
    { t: "A programmer's years of coding experience", cat: "Human capital", why: "Experience-based skill is human capital." },
    { t: "$50,000 sitting in a firm's checking account", cat: "Not capital (financial asset)", why: "Money is a financial asset. It can buy capital but produces nothing itself." },
    { t: "Shares of stock a company owns in another company", cat: "Not capital (financial asset)", why: "A stock is a paper claim on a firm, not a productive resource." },
    { t: "A government bond held by a factory owner", cat: "Not capital (financial asset)", why: "A bond is a financial asset." },
    { t: "A bank loan a café takes out", cat: "Not capital (financial asset)", why: "A loan is money (a financial claim). What it buys may be capital." },
  ];
  const INCOME_BANK = [
    { t: "What a rancher receives for letting a neighbor graze cattle on her pasture", cat: "Rent", why: "Payment for the use of land is rent." },
    { t: "What a mining firm pays a landowner for the right to dig out gravel", cat: "Rent", why: "Payment for a natural resource is rent." },
    { t: "The yearly fee a grower pays to use someone else's orchard land", cat: "Rent", why: "Payment for land is rent." },
    { t: "A lifeguard's hourly pay", cat: "Wages", why: "Payment for labor is wages." },
    { t: "An accountant's monthly salary", cat: "Wages", why: "Salaries are payments for labor, which economists call wages." },
    { t: "What a crew member earns for a shift at a car wash", cat: "Wages", why: "Payment for labor is wages." },
    { t: "What a bank receives for lending a bakery the money to buy new ovens", cat: "Interest", why: "Supplying the funds for capital earns interest." },
    { t: "Payments a firm makes to bondholders who financed its new assembly line", cat: "Interest", why: "The return to those who finance capital is interest." },
    { t: "Income a retiree earns because her savings paid for a company's new machinery", cat: "Interest", why: "The return to supplying capital is interest." },
    { t: "What is left for a café owner after paying rent, wages and interest", cat: "Profit", why: "The residual reward to the entrepreneur is profit." },
    { t: "The reward a start-up founder gets for bearing the risk of a new product", cat: "Profit", why: "The reward for risk-taking and organizing is profit." },
    { t: "The surplus earned by the person who organized a new delivery business", cat: "Profit", why: "The entrepreneur's return is profit." },
  ];
  const QUESTION_BANK = [
    { t: "A country decides whether to build more hospitals or more highways.", cat: "What", why: "Choosing which goods to make is the “what” question." },
    { t: "A farm chooses to plant soybeans instead of wheat this season.", cat: "What", why: "Which output to produce is “what”." },
    { t: "A film studio decides to make three action films and no comedies.", cat: "What", why: "Choosing the mix of output is “what”." },
    { t: "A city chooses between a new library and a new skate park.", cat: "What", why: "Which good to produce is “what”." },
    { t: "A car maker decides whether to use more robots or more workers on its assembly line.", cat: "How", why: "Choosing the mix of inputs is “how”." },
    { t: "A grower chooses between hand-picking and machine-harvesting berries.", cat: "How", why: "The production method is “how”." },
    { t: "A print shop replaces three older presses with one faster digital press.", cat: "How", why: "Changing the combination of inputs is “how”." },
    { t: "A clothing firm decides to weave fabric on automated looms rather than by hand.", cat: "How", why: "The technique used is “how”." },
    { t: "A surgeon's high salary lets her buy far more goods than a part-time cashier can.", cat: "For whom", why: "Who gets the output depends on income, which is the “for whom” question." },
    { t: "Which families end up in the new apartments depends on who can pay the rent.", cat: "For whom", why: "Distribution of output by ability to pay is “for whom”." },
    { t: "A landowner's rental income lets her family afford a larger house.", cat: "For whom", why: "Factor income determines who gets goods: “for whom”." },
    { t: "Higher wages in tech let software workers claim a bigger share of the economy's output.", cat: "For whom", why: "Distribution of output through incomes is “for whom”." },
  ];
  const FACTOR_TF = [
    { t: "Human capital is the knowledge and skill workers build up through education, training and experience.", ok: true },
    { t: "Wild fish in the ocean count as land in economics.", ok: true, why: "Land covers all natural resources." },
    { t: "Entrepreneurs earn profit as the reward for organizing production and bearing risk.", ok: true },
    { t: "Who receives the goods produced depends largely on the incomes people earn from their factors.", ok: true },
    { t: "A machine used to make other goods is physical capital.", ok: true },
    { t: "The “what” question exists because producing more of one good means producing less of something else.", ok: true },
    { t: "Money in a bank account is physical capital, because it can buy machines.", ok: false, why: "Money is a financial asset. Only the machines it buys are capital." },
    { t: "Land earns interest and capital earns rent.", ok: false, why: "It is the other way round: land earns rent and capital earns interest." },
    { t: "Labor refers only to physical, manual work.", ok: false, why: "Labor is all human effort, mental as well as physical." },
    { t: "The “how” question asks who receives the goods and services produced.", ok: false, why: "That is “for whom”. “How” is about the mix of inputs." },
    { t: "A share of stock is a factor of production because it represents ownership of a firm.", ok: false, why: "Stock is a financial claim, not a productive resource." },
    { t: "Entrepreneurship earns wages, just like other labor.", ok: false, why: "Entrepreneurship earns profit." },
  ];

  const genFactors = STUDY.makeGenerator({
    id: "b251-m2-factors",
    name: "Factors of production & the three questions",
    blurb: "Sort resources into land, labor, capital and entrepreneurship, match them to rent, wages, interest and profit, and spot the what/how/for-whom question.",
    variants: [
      {
        name: "Classify resources by factor",
        make() {
          const cats = ["Land", "Labor", CAP, "Entrepreneurship"];
          const items = cats.map(c => U.pick(FACTOR_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m2-fac", FACTOR_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Classify each resource as a factor of production.",
            cats, items,
            sol: steps("Ask what the resource <em>is</em>: provided by nature (land), human effort (labor), something made or learned that is used to produce (capital), or organizing and risk-taking (entrepreneurship).",
              "Skills and training are <b>human capital</b>, grouped with capital here. Manufactured tools and buildings are <b>physical capital</b>.",
              "The natural resource itself (wind, rain, ore) is land; the equipment that harnesses it is capital."),
          });
        },
      },
      {
        name: "Physical capital, human capital, or neither?",
        make() {
          const cats = ["Physical capital", "Human capital", "Not capital (financial asset)"];
          const items = cats.map(c => U.pick(KIND_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m2-kind", KIND_BANK, 5)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Economists use “capital” in a narrow sense. Classify each item.",
            cats, items,
            sol: steps("Capital is something <em>produced</em> that is used to produce other goods. Physical capital is things; human capital is skills.",
              "Money, stocks, bonds and loans are <b>financial assets</b>. They can buy capital but cannot produce anything themselves."),
          });
        },
      },
      {
        name: "Match factor payments to incomes",
        make() {
          const cats = ["Rent", "Wages", "Interest", "Profit"];
          const items = U.shuffle(cats).slice(0, 3).map(c => U.pick(INCOME_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m2-inc", INCOME_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Each payment goes to the owner of one factor of production. Which kind of income is it?",
            cats, items,
            sol: steps("First name the factor being paid for: land, labor, capital or entrepreneurship.",
              "Then use the pairs: land → rent, labor → wages, capital → interest, entrepreneurship → profit.",
              "Profit is what is <em>left over</em> for the risk-taker after the other three are paid."),
          });
        },
      },
      {
        name: "What, how, or for whom?",
        make() {
          const cats = ["What", "How", "For whom"];
          const items = cats.map(c => U.pick(QUESTION_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m2-3q", QUESTION_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Which of the three scarcity questions does each situation mainly answer?",
            cats, items,
            sol: steps("<b>What</b> = which goods and how much. <b>How</b> = which mix of inputs or technique. <b>For whom</b> = who gets the output.",
              "In a market economy, “for whom” is settled by <b>incomes</b>, so any situation about who can afford the output is a “for whom” case."),
          });
        },
      },
      {
        name: "Which is NOT a factor of production?",
        make() {
          const right = U.pick(["The $2 million in a firm's bank account", "Shares of stock a company holds in a rival", "A government bond owned by a farm", "A bakery's line of credit at its bank"]);
          const wrongCats = U.sample(["Land", "Labor", CAP, "Entrepreneurship"], 3);
          const wrong = wrongCats.map(c => { const it = U.pick(FACTOR_BANK.filter(i => i.cat === c)); return { t: it.t, why: `This is a factor: ${c.toLowerCase()}. ${it.why}` }; });
          return Q.mc({
            q: "Which of the following is <b>not</b> a factor of production?",
            right, wrong,
            rightWhy: "Money and other financial assets are not factors of production. They only buy the resources that produce.",
            sol: steps("A factor of production is a resource that is <em>used up or used in</em> making goods: land, labor, capital or entrepreneurship.",
              `“${right}” is a financial asset. It can pay for machines or workers, but it produces nothing on its own.`),
          });
        },
      },
      {
        name: "Spot the real capital",
        make() {
          const firm = U.pick([
            { who: "A bakery", loan: "$40,000", thing: "two new deck ovens", alt: "the bakery's stock shares" },
            { who: "A trucking firm", loan: "$250,000", thing: "three refrigerated trucks", alt: "the firm's savings bonds" },
            { who: "A dental clinic", loan: "$90,000", thing: "a digital X-ray machine", alt: "the clinic's money-market account" },
            { who: "A print shop", loan: "$60,000", thing: "a large-format printer", alt: "the shop's certificate of deposit" },
          ]);
          return Q.mc({
            q: `${firm.who} borrows ${firm.loan} from a bank and uses it to buy ${firm.thing}. Which item is <b>capital</b> as a factor of production?`,
            right: `The ${firm.thing.replace(/^(a|an|two|three) /, "")}`,
            wrong: [
              { t: `The ${firm.loan} loan`, why: "A loan is money, a financial asset. It pays for capital but is not capital." },
              { t: "The interest paid to the bank", why: "Interest is the income paid for capital, not the capital itself." },
              { t: cap(firm.alt), why: "Stocks, bonds and deposits are financial assets, not productive resources." },
            ],
            rightWhy: "The equipment is manufactured and used to produce other goods and services, so it is physical capital.",
            sol: steps("Economists' capital is the <em>tool</em>, not the money used to buy it.",
              `The ${firm.thing.replace(/^(a|an|two|three) /, "")} will be used to produce output, so that is physical capital. The loan, the interest and any financial holdings are not.`),
          });
        },
      },
      {
        name: "Select all true statements about factors",
        make() {
          const opts = U.sample(FACTOR_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(FACTOR_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Check each statement against the four factor–income pairs: land/rent, labor/wages, capital/interest, entrepreneurship/profit.",
              "Remember that financial assets are not capital, labor includes mental effort, and “for whom” is about who gets the output."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Reading a PPC
   * ============================================================ */
  function moveRows(t) {
    const i = U.randInt(0, 3);
    const j = Math.min(4, i + U.randInt(1, 2));
    return [t.rows[i], t.rows[j]];
  }
  const genPPC = STUDY.makeGenerator({
    id: "b251-m2-ppc",
    name: "Reading a PPC",
    blurb: "Measure opportunity cost along a production possibilities curve and classify points as efficient, inefficient or unattainable.",
    variants: [
      {
        name: "Total opportunity cost of a move",
        make() {
          const t = ppcTable(Math.random() < 0.25);
          const [r1, r2] = moveRows(t);
          const ans = r1.y - r2.y, gained = r2.x - r1.x;
          return Q.num({
            q: `An economy can produce these combinations of ${t.X.p} and ${t.Y.p} per month:${ppcHtml(t)}It moves from combination <b>${r1.label}</b> to combination <b>${r2.label}</b>. What is the <b>total</b> opportunity cost of the move, in ${t.Y.p}?`,
            answer: ans, unit: t.Y.p,
            traps: traps(ans, [
              { value: gained, why: `That is how many ${t.X.p} were <em>gained</em>. The cost is what you give up, measured in ${t.Y.p}.` },
              { value: r2.y, why: `That is the level of ${t.Y.p} at ${r2.label}, not the amount given up.` },
              { value: ans / gained, why: "That is the cost <em>per unit</em>. The question asks for the total given up." },
            ]),
            sol: steps(`Opportunity cost is what you <em>give up</em>. Moving from ${r1.label} to ${r2.label} gains ${t.X.p}, so the cost is measured in ${t.Y.p}.`,
              `${cap(t.Y.p)} fall from ${U.fmt(r1.y)} to ${U.fmt(r2.y)}: ${U.fmt(r1.y)} − ${U.fmt(r2.y)} = <b>${U.fmt(ans)} ${pl(ans, t.Y)}</b>, in exchange for ${qty(gained, t.X)}.`),
          });
        },
      },
      {
        name: "Opportunity cost per unit",
        make() {
          const t = ppcTable(Math.random() < 0.25);
          const i = U.randInt(0, 3);
          const r1 = t.rows[i], r2 = t.rows[i + 1];
          const ans = t.per[i];
          const avg = (t.yMax - r2.y) / r2.x;
          return Q.num({
            q: `Production possibilities per week:${ppcHtml(t)}Between combinations <b>${r1.label}</b> and <b>${r2.label}</b>, what is the opportunity cost of producing <b>one more ${t.X.s}</b>, in ${t.Y.p}?`,
            answer: ans, unit: t.Y.p,
            traps: traps(ans, [
              { value: t.cost[i], why: `That is the total given up for all ${qty(t.dx, t.X)}. Divide by the number of ${t.X.p} gained.` },
              { value: avg, why: `That averages the cost all the way from combination A. The question is only about the step from ${r1.label} to ${r2.label}.` },
              { value: r2.y, why: `That is the level of ${t.Y.p} at ${r2.label}, not an amount given up.` },
            ]),
            sol: steps("Per-unit opportunity cost = (units given up) ÷ (units gained).",
              `From ${r1.label} to ${r2.label}: give up ${U.fmt(r1.y)} − ${U.fmt(r2.y)} = ${U.fmt(t.cost[i])} ${t.Y.p} to gain ${U.fmt(r2.x)} − ${U.fmt(r1.x)} = ${qty(t.dx, t.X)}.`,
              `${U.fmt(t.cost[i])} ÷ ${U.fmt(t.dx)} = <b>${U.fmt(ans)} ${pl(ans, t.Y)} per ${t.X.s}</b>.`),
          });
        },
      },
      {
        name: "Reverse direction: cost of the other good",
        make() {
          const t = ppcTable(Math.random() < 0.25);
          const i = U.randInt(0, 3);
          const r1 = t.rows[i + 1], r2 = t.rows[i];
          const ans = t.dx / t.cost[i];
          return Q.num({
            q: `Production possibilities per day:${ppcHtml(t)}The economy is at <b>${r1.label}</b> and moves to <b>${r2.label}</b>. What is the opportunity cost of <b>each extra ${t.Y.s}</b>, measured in ${t.X.p}? (A fraction or decimal is fine.)`,
            answer: ans, unit: t.X.p,
            traps: traps(ans, [
              { value: t.dx, why: `That is the total ${t.X.p} given up. Divide by the ${U.fmt(t.cost[i])} ${t.Y.p} gained.` },
              { value: t.per[i], why: `That is the cost of one ${t.X.s} in ${t.Y.p}, which is the other direction. Here you gain ${t.Y.p} and give up ${t.X.p}.` },
            ]),
            sol: steps(`Now you are gaining ${t.Y.p} and giving up ${t.X.p}, so the cost is in ${t.X.p}: (given up) ÷ (gained).`,
              `${r1.label} → ${r2.label}: give up ${qty(t.dx, t.X)} and gain ${U.fmt(t.cost[i])} ${t.Y.p}.`,
              `${U.fmt(t.dx)} ÷ ${U.fmt(t.cost[i])} = <b>${ocQ(t.dx, t.cost[i], t.X)} per ${t.Y.s}</b>. It is the reciprocal of the cost of ${an(t.X)} over the same step.`),
          });
        },
      },
      {
        name: "Classify combinations using the table",
        make() {
          const t = ppcTable(Math.random() < 0.3);
          const items = [];
          const used = new Set();
          const add = (x, y, cat, why) => { const k = x + ":" + y; if (used.has(k)) return; used.add(k); items.push({ t: `${qty(x, t.X)} and ${qty(y, t.Y)}`, cat, why }); };
          const effRows = U.sample(t.rows, 2);
          effRows.forEach(r => add(r.x, r.y, "Efficient", `This is combination ${r.label}, which lies on the PPC.`));
          const inRows = U.sample(t.rows.filter(r => r.y > 0), 2);
          inRows.forEach(r => { const y = Math.max(0, Math.round(r.y * (0.3 + Math.random() * 0.45))); add(r.x, y, "Inefficient", `With ${qty(r.x, t.X)} the economy could make ${U.fmt(r.y)} ${t.Y.p}, so ${U.fmt(y)} is inside the curve.`); });
          const outRows = U.sample(t.rows.slice(0, 4), 2);
          outRows.forEach(r => { const y = r.y + Math.max(1, Math.round(t.yMax * (0.12 + Math.random() * 0.2))); add(r.x, y, "Unattainable", `With ${qty(r.x, t.X)} the most ${t.Y.p} possible is ${U.fmt(r.y)}, so ${U.fmt(y)} is beyond the curve.`); });
          return Q.classify({
            q: `An economy's production possibilities are:${ppcHtml(t)}Classify each combination.`,
            cats: ["Efficient", "Inefficient", "Unattainable"],
            items: U.shuffle(items).slice(0, 5),
            sol: steps(`For each combination, find the row with the same number of ${t.X.p} and compare the ${t.Y.p}.`,
              "Equal to the table → on the PPC (efficient). Fewer → inside (inefficient: idle or misallocated resources). More → outside (unattainable)."),
          });
        },
      },
      {
        name: "Classify points on a graph",
        make() {
          const [X, Y] = two();
          const xm = U.pick([40, 50, 60, 80, 100]), ym = U.pick([40, 60, 80, 100, 120]);
          const letters = U.sample(["J", "K", "L", "M", "N", "P", "R", "T", "V", "W"], 4);
          const kinds = U.shuffle(["Efficient", "Inefficient", "Unattainable", U.pick(["Efficient", "Inefficient", "Unattainable"])]);
          const fs = U.shuffle([0.15, 0.32, 0.5, 0.66]);
          const points = [], items = [];
          kinds.forEach((k, i) => {
            const x = xm * fs[i];
            const yc = G.bowedY(x, xm, ym);
            const y = k === "Efficient" ? yc : k === "Inefficient" ? yc * (0.35 + Math.random() * 0.3) : Math.min(ym * 1.38, yc * 1.28 + ym * 0.08);
            points.push({ x, y, label: letters[i], style: k === "Efficient" ? "dot" : "hollow" });
            items.push({ t: `Point ${letters[i]}`, cat: k, why: k === "Efficient" ? "It lies on the curve." : k === "Inefficient" ? "It lies inside the curve." : "It lies beyond the curve." });
          });
          return Q.classify({
            q: `The graph shows an economy's PPC for ${X.p} and ${Y.p}.` + G.plot({ xLabel: cap(X.p), yLabel: cap(Y.p), xMax: xm * 1.2, yMax: ym * 1.45, xTicks: ticks(xm * 1.2), yTicks: ticks(ym * 1.45),
              curves: [{ pts: G.bowed(xm, ym), style: "main", label: "PPC", labelAt: 34 }], points: points.map(p => ({ ...p, style: "dot" })), aria: "PPC with labelled points" }) + "Classify each labelled point.",
            cats: ["Efficient", "Inefficient", "Unattainable"],
            items,
            sol: steps("Use the curve as the boundary: on it = efficient, inside (toward the origin) = inefficient, outside = unattainable.",
              "Inside means the economy could make more of both goods by putting idle or misallocated resources to work. Outside would need more resources or better technology."),
          });
        },
      },
      {
        name: "Inside the curve or a shift?",
        make() {
          const right = U.pick([
            "A recession leaves many factories idle and workers unemployed",
            "Workers are assigned to jobs they are poorly suited for, while equally able workers sit idle",
            "A long strike shuts down half of the country's mines, although the mines and miners still exist",
          ]);
          return Q.mc({
            q: "Which event moves an economy to a point <b>inside</b> its existing PPC, without shifting the curve?",
            right,
            wrong: [
              { t: "A new technology makes workers in both industries more productive", why: "Better technology shifts the whole PPC outward." },
              { t: "A wave of immigration enlarges the labor force", why: "More resources shift the PPC outward." },
              { t: "An earthquake destroys a third of the country's factories", why: "Destroying resources shifts the PPC inward; the curve itself changes." },
              { t: "Society decides to produce more of one good and less of the other, using all its resources", why: "That is a movement along the curve." },
            ].slice(0, 3 + (Math.random() < 0.5 ? 1 : 0)),
            rightWhy: "The resources still exist; they are just unemployed or misallocated, so output falls inside the frontier.",
            sol: steps("Ask whether the economy's <em>resources or technology</em> changed (the curve shifts) or whether existing resources simply are not being used fully (a point inside).",
              "Unemployment, idle capacity and misallocation all leave the curve where it is and put the economy inside it."),
          });
        },
      },
      {
        name: "Which is NOT a PPC assumption?",
        make() {
          const right = U.pick([
            "Technology improves steadily during the period",
            "The economy's resources grow over the period",
            "Some resources are deliberately kept unemployed",
            "The government sets the prices of both goods",
          ]);
          const all = [
            "All resources are fully employed",
            "Production is measured over a specific time period",
            "The quantity and quality of resources are fixed for the period",
            "Technology does not change during the period",
          ];
          return Q.mc({
            q: "Which of the following is <b>not</b> one of the assumptions behind a production possibilities curve?",
            right,
            wrong: U.sample(all, 3).map(t => ({ t, why: "This is one of the four PPC assumptions." })),
            rightWhy: "This is not an assumption: a PPC is a snapshot that holds resources and technology fixed and assumes they are fully employed.",
            sol: steps("A PPC is a snapshot: a fixed period, fixed resources, fixed technology, everything fully employed.",
              "Anything that lets resources or technology change, leaves resources idle, or brings in prices breaks the snapshot."),
          });
        },
      },
      {
        name: "Missing value in a PPC table",
        make() {
          const t = ppcTable(Math.random() < 0.25);
          const i = U.randInt(1, 3);
          const ans = t.rows[i].y;
          const per = t.per[i - 1];
          return Q.num({
            q: `In the table below, one value is missing.${ppcHtml(t, i)}Moving from <b>${t.rows[i - 1].label}</b> to <b>${t.rows[i].label}</b>, each extra ${t.X.s} costs <b>${qty(per, t.Y)}</b>. How many ${t.Y.p} are produced at combination <b>${t.rows[i].label}</b>?`,
            answer: ans, unit: t.Y.p,
            traps: traps(ans, [
              { value: t.rows[i - 1].y - per, why: `You subtracted the cost of only <em>one</em> ${t.X.s}. The step adds ${qty(t.dx, t.X)}.` },
              { value: t.cost[i - 1], why: `That is the amount given up, not the remaining ${t.Y.p}.` },
              { value: t.rows[i - 1].y + t.cost[i - 1], why: `Moving to more ${t.X.p} means <em>fewer</em> ${t.Y.p}, so subtract.` },
            ]),
            sol: steps(`Work backwards: total given up = per-unit cost × units gained.`,
              `The step adds ${U.fmt(t.rows[i].x)} − ${U.fmt(t.rows[i - 1].x)} = ${qty(t.dx, t.X)}, so ${t.Y.p} fall by ${U.fmt(per)} × ${U.fmt(t.dx)} = ${U.fmt(t.cost[i - 1])}.`,
              `${U.fmt(t.rows[i - 1].y)} − ${U.fmt(t.cost[i - 1])} = <b>${U.fmt(ans)} ${t.Y.p}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Increasing vs constant opportunity cost; marginal cost
   * ============================================================ */
  const INC_TF = [
    { t: "Marginal cost is the opportunity cost of producing one more unit of a good.", ok: true },
    { t: "Along a bowed-out PPC, the marginal cost of a good rises as more of it is produced.", ok: true },
    { t: "A straight-line PPC means the opportunity cost of each good is constant.", ok: true },
    { t: "A PPC is bowed outward because resources are not equally suited to producing both goods.", ok: true },
    { t: "Along a PPC, marginal cost can be measured in units of the other good given up.", ok: true },
    { t: "The law of increasing relative cost says that each additional unit of a good costs more of the other good than the one before.", ok: true },
    { t: "A bowed-out PPC means resources are equally good at producing either good.", ok: false, why: "That would give a straight line. Bowing comes from resources being specialized." },
    { t: "The marginal cost curve slopes downward.", ok: false, why: "Increasing opportunity cost makes MC slope upward." },
    { t: "Marginal cost is the total amount of the other good given up to reach the current output.", ok: false, why: "That is total cost. Marginal cost is the cost of the next unit only." },
    { t: "On a bowed-out PPC, the 1st unit of a good costs more than the 50th.", ok: false, why: "It is the reverse: later units cost more." },
    { t: "If the PPC is a straight line, the opportunity cost of a good rises as more of it is produced.", ok: false, why: "A straight line has a constant slope, so the cost is constant." },
  ];
  function singleUnitTable() {
    const [X, Y] = two();
    const m = U.pick([1, 2, 3, 5, 10]);
    const ks = [U.randInt(1, 2)];
    for (let i = 1; i < 5; i++) ks.push(ks[i - 1] + U.randInt(1, 3));
    const mc = ks.map(k => k * m);
    const yMax = mc.reduce((a, b) => a + b, 0);
    const rows = [];
    let y = yMax;
    for (let i = 0; i <= 5; i++) { rows.push({ x: i, y }); if (i < 5) y -= mc[i]; }
    return { X, Y, mc, yMax, rows };
  }
  const genIncr = STUDY.makeGenerator({
    id: "b251-m2-incrcost",
    name: "Increasing cost & marginal cost",
    blurb: "Read opportunity costs off a PPC, tell increasing from constant cost, link the shape of the curve to resources, and find marginal cost.",
    variants: [
      {
        name: "Find the pattern in opportunity cost",
        make() {
          const straight = Math.random() < 0.4;
          const t = ppcTable(straight);
          return Q.mc({
            q: `Production possibilities:${ppcHtml(t)}As the economy produces more ${t.X.p} (moving from A toward E), what happens to the opportunity cost of each additional ${t.X.s}?`,
            right: straight ? "It stays constant" : "It increases",
            wrong: straight
              ? [{ t: "It increases", why: `Compute each step: it is ${U.fmt(t.per[0])} ${t.Y.p} per ${t.X.s} every time.` }, { t: "It decreases", why: "Per-unit costs are the same at every step." }]
              : [{ t: "It stays constant", why: `The per-unit costs are ${t.per.map(U.fmt.bind(U)).join(", ")}, which are rising.` }, { t: "It decreases", why: "The amount of the other good given up per unit grows at each step." }],
            keepOrder: false,
            sol: steps("Compute the per-unit cost for each step: (fall in the other good) ÷ (rise in this good).",
              `The step-by-step costs per ${t.X.s} are ${t.per.map(p => U.fmt(p)).join(", ")} ${t.Y.p}.`,
              straight ? "They are all equal, so the cost is <b>constant</b> and the PPC is a straight line." : "They rise, which is the <b>law of increasing relative cost</b>, and the PPC is bowed outward."),
          });
        },
      },
      {
        name: "Read the shape of a PPC graph",
        make() {
          const [X, Y] = two();
          const straight = Math.random() < 0.5;
          const xm = U.pick([40, 50, 60, 80]), ym = U.pick([60, 80, 100, 120]);
          const g = G.plot({ xLabel: cap(X.p), yLabel: cap(Y.p), xMax: xm * 1.15, yMax: ym * 1.15, xTicks: ticks(xm * 1.15), yTicks: ticks(ym * 1.15),
            curves: [{ pts: straight ? [[0, ym], [xm, 0]] : G.bowed(xm, ym), style: "main", label: "PPC" }], aria: "a PPC" });
          const right = straight
            ? `The opportunity cost of ${an(X)} is the same at every point, because resources are equally suited to both goods`
            : `The opportunity cost of ${an(X)} rises as more ${X.p} are produced, because resources are not equally suited to both goods`;
          const wrong = straight
            ? [{ t: `The opportunity cost of ${an(X)} rises as more ${X.p} are produced, because resources are not equally suited to both goods`, why: "That describes a bowed-out curve. This one is a straight line." },
              { t: `The opportunity cost of ${an(X)} falls as more ${X.p} are produced`, why: "A straight line has a constant slope." },
              { t: "Every point on this curve is unattainable", why: "Points on a PPC are attainable and efficient." }]
            : [{ t: `The opportunity cost of ${an(X)} is the same at every point, because resources are equally suited to both goods`, why: "That describes a straight-line PPC. This one bows outward." },
              { t: `The opportunity cost of ${an(X)} falls as more ${X.p} are produced`, why: "The curve gets steeper moving right, so each extra unit costs more." },
              { t: "Every point on this curve is unattainable", why: "Points on a PPC are attainable and efficient." }];
          return Q.mc({
            q: `Which statement best describes this economy?${g}`,
            right, wrong,
            sol: steps("The slope of the PPC is the opportunity cost. A curve that gets steeper moving right means rising cost; a straight line means constant cost.",
              straight ? "This PPC is a straight line, so cost is constant: resources are equally good at both goods." : "This PPC bows outward (gets steeper), so the cost rises: the law of increasing relative cost."),
          });
        },
      },
      {
        name: "Explain the bowed-out shape",
        make() {
          const [X, Y] = two();
          return Q.mc({
            q: `An economy producing ${X.p} and ${Y.p} has a bowed-out PPC. What is the best explanation for the shape?`,
            right: `Resources are not equally suited to both goods, so shifting more of them into ${X.p} uses resources that are less and less suited to ${X.p}`,
            wrong: [
              { t: "The economy has unemployed resources", why: "Unemployment puts the economy inside the curve; it does not shape the curve." },
              { t: `Consumers like ${X.p} less as they get more of them`, why: "That is decreasing marginal benefit, a demand-side idea. The PPC shape comes from production." },
              { t: "Technology improves as production rises", why: "A PPC holds technology constant." },
              { t: "All resources are identical, so each unit costs the same", why: "Identical resources would give a straight line." },
            ],
            rightWhy: "Specialized resources make each extra unit more costly: the law of increasing relative cost.",
            sol: steps("The PPC is about production possibilities, so look for a production reason.",
              `The first resources moved into ${X.p} are the ones best at it (and least useful for ${Y.p}). Later ones are poorly suited, so each extra ${X.s} costs more ${Y.p}.`),
          });
        },
      },
      {
        name: "Marginal cost of the next unit",
        make() {
          const t = singleUnitTable();
          const n = U.randInt(2, 5);
          const ans = t.mc[n - 1];
          return Q.num({
            q: `Production possibilities per day:${tbl([cap(t.X.p), cap(t.Y.p)], t.rows.map(r => [U.fmt(r.x), U.fmt(r.y)]))}What is the <b>marginal cost</b> of the <b>${n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th"} ${t.X.s}</b>, in ${t.Y.p}?`,
            answer: ans, unit: t.Y.p,
            traps: traps(ans, [
              { value: t.yMax - t.rows[n].y, why: `That is the total given up for all ${n} ${t.X.p}. Marginal cost is just the cost of the ${n}th.` },
              { value: t.rows[n].y, why: `That is how many ${t.Y.p} are still produced, not how many were given up.` },
              { value: t.mc[n - 2], why: `That is the cost of the ${n - 1 === 1 ? "1st" : n - 1 === 2 ? "2nd" : n - 1 === 3 ? "3rd" : (n - 1) + "th"} ${t.X.s}, one row too early.` },
              { value: (t.yMax - t.rows[n].y) / n, why: "That is the average cost per unit so far, not the marginal cost." },
            ]),
            sol: steps("Marginal cost = the opportunity cost of <em>one more</em> unit, so look only at the step that adds that unit.",
              `Going from ${n - 1} to ${n} ${t.X.p}, ${t.Y.p} fall from ${U.fmt(t.rows[n - 1].y)} to ${U.fmt(t.rows[n].y)}.`,
              `MC = ${U.fmt(t.rows[n - 1].y)} − ${U.fmt(t.rows[n].y)} = <b>${U.fmt(ans)} ${pl(ans, t.Y)}</b>. (The MCs are ${t.mc.map(v => U.fmt(v)).join(", ")}: rising, as the law of increasing cost predicts.)`),
          });
        },
      },
      {
        name: "Predict the cost of expanding",
        make() {
          const [X, Y] = two();
          const where = U.pick(["high", "low"]);
          return Q.mc({
            q: `An economy that makes ${X.p} and ${Y.p} has a bowed-out PPC. It is currently producing ${where === "high" ? `almost nothing but ${X.p}` : `very few ${X.p} and lots of ${Y.p}`}. Compared with being in the middle of the curve, the opportunity cost of producing <b>one more ${X.s}</b> here is:`,
            right: where === "high" ? "Higher" : "Lower",
            wrong: where === "high"
              ? [{ t: "The same", why: "Only a straight-line PPC has the same cost everywhere." }, { t: "Lower", why: "Near the end of the curve the remaining resources are poorly suited to this good, so cost is highest." }]
              : [{ t: "The same", why: "Only a straight-line PPC has the same cost everywhere." }, { t: "Higher", why: `With few ${X.p}, the next unit can use resources well suited to it, so cost is low.` }],
            keepOrder: true,
            sol: steps("On a bowed-out PPC, the cost of a good rises the more of it you already produce.",
              where === "high" ? `Producing nearly all ${X.p}, the economy must pull its last, least-suited resources out of ${Y.p}, so the next ${X.s} is <b>more</b> costly.` : `Producing few ${X.p}, the economy can move resources that are good at ${X.p} and poor at ${Y.p}, so the next ${X.s} is <b>less</b> costly.`),
          });
        },
      },
      {
        name: "Constant cost from a straight-line PPC",
        make() {
          const [X, Y] = two();
          const xm = U.pick([20, 25, 40, 50, 60, 80, 100]);
          const k = U.pick([0.5, 2, 3, 4, 5, 1.5, 2.5]);
          const ym = xm * k;
          if (!Number.isInteger(ym)) return this.make();
          const askX = Math.random() < 0.5;
          const ans = askX ? ym / xm : xm / ym;
          return Q.num({
            q: `Using all its resources, an economy can make either ${qty(xm, X)} or ${qty(ym, Y)} per year, and its PPC is a <b>straight line</b> between those points. What is the opportunity cost of one ${askX ? X.s : Y.s}, in ${askX ? Y.p : X.p}?`,
            answer: ans, unit: askX ? Y.p : X.p,
            traps: traps(ans, [
              { value: askX ? ym : xm, why: "That is the whole intercept. Divide by the maximum of the good you are producing." },
            ]),
            sol: steps("On a straight-line PPC the cost is constant, so you can use the two endpoints.",
              askX ? `Giving up all ${U.fmt(ym)} ${Y.p} gains ${U.fmt(xm)} ${X.p}, so each ${X.s} costs ${U.fmt(ym)} ÷ ${U.fmt(xm)} = <b>${ocQ(ym, xm, Y)}</b>.`
                : `Giving up all ${U.fmt(xm)} ${X.p} gains ${U.fmt(ym)} ${Y.p}, so each ${Y.s} costs ${U.fmt(xm)} ÷ ${U.fmt(ym)} = <b>${ocQ(xm, ym, X)}</b>.`,
              "Put the good given up on top and the good gained underneath."),
          });
        },
      },
      {
        name: "Select all: opportunity cost & marginal cost",
        make() {
          const opts = U.sample(INC_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(INC_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Marginal = the next unit. Opportunity cost = what is given up.",
              "Bowed-out PPC ⇔ increasing cost ⇔ upward-sloping MC. Straight line ⇔ constant cost."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Marginal benefit, marginal cost & efficiency
   * ============================================================ */
  function mbmcSchedule() {
    const [X, Y] = two();
    const dollars = Math.random() < 0.6;
    const s = dollars ? U.pick([1, 2, 5, 10]) : 1;
    const qs = U.randInt(2, 5);
    const b = U.randInt(1, 4) * s, c = U.randInt(1, 4) * s;
    const v = c * (qs - 1) + b * (6 - qs) + U.randInt(1, 4) * s;
    const rows = [1, 2, 3, 4, 5, 6].map(q => ({ q, mb: v + b * (qs - q), mc: v + c * (q - qs) }));
    const unit = dollars ? "$" : Y.p;
    const show = n => (dollars ? U.money(n) : U.fmt(n));
    return { X, Y, qs, v, rows, unit, show, dollars };
  }
  const ALLOC_BANK = [
    { t: "The economy is on its PPC, and the marginal benefit of the last unit of each good equals its marginal cost.", cat: "Both", why: "On the curve and MB = MC: production and allocative efficiency." },
    { t: "Every resource is employed with the best technology, and the mix of goods is exactly the one society values most.", cat: "Both", why: "On the PPC at the preferred point." },
    { t: "Output is at the point on the PPC where MB = MC for both goods.", cat: "Both", why: "MB = MC on the curve is allocative efficiency, which includes production efficiency." },
    { t: "The economy is on its PPC, but people would pay more for one more unit of a good than it costs to make.", cat: "Production efficient only", why: "On the curve, but MB > MC, so more of that good is wanted." },
    { t: "All resources are fully employed, but the country makes huge amounts of a good almost nobody wants.", cat: "Production efficient only", why: "No waste in production, but the wrong mix." },
    { t: "The economy is on its PPC, and the marginal cost of the last unit of a good is above its marginal benefit.", cat: "Production efficient only", why: "On the curve, but MC > MB, so too much of that good." },
    { t: "During a recession, a quarter of the factories sit idle.", cat: "Neither", why: "Idle resources put the economy inside the PPC, so neither kind of efficiency holds." },
    { t: "Skilled surgeons are assigned to drive delivery trucks while untrained workers attempt surgery, so more of both services could be produced.", cat: "Neither", why: "Misallocated resources put the economy inside the PPC." },
    { t: "The economy is at a point inside its PPC.", cat: "Neither", why: "Inside means more of one good could be made at no cost, so it is not even production efficient." },
    { t: "Half the farmland lies fallow while food is scarce, even though farmers are available to work it.", cat: "Neither", why: "Unused resources mean a point inside the PPC." },
  ];
  const ALLOC_TF = [
    { q: "Every point on the PPC is allocatively efficient.", truth: false, why: "Every point on the PPC is production efficient, but only the one where MB = MC is allocatively efficient." },
    { q: "An allocatively efficient point must also be production efficient.", truth: true, why: "The best point is chosen from points on the PPC, so it wastes no resources." },
    { q: "If marginal benefit exceeds marginal cost, society should produce less of the good.", truth: false, why: "MB > MC means the next unit is worth more than it costs, so produce more." },
    { q: "A point inside the PPC can be allocatively efficient as long as people like the mix of goods.", truth: false, why: "Inside the PPC more of both goods is possible, so it is not even production efficient." },
    { q: "Marginal benefit is measured by the most a person is willing to pay for one more unit.", truth: true, why: "Willingness to pay is how economists measure marginal benefit." },
    { q: "Because of decreasing marginal benefit, the marginal benefit curve slopes upward.", truth: false, why: "Decreasing MB makes the MB curve slope downward." },
    { q: "When an economy is producing on its PPC, it cannot produce more of one good without producing less of another.", truth: true, why: "That is the definition of production efficiency, which every point on the PPC has." },
  ];
  const genAlloc = STUDY.makeGenerator({
    id: "b251-m2-alloc",
    name: "Marginal benefit, marginal cost & efficiency",
    blurb: "Find the allocatively efficient quantity where MB = MC, decide whether to produce more or less, and separate production from allocative efficiency.",
    variants: [
      {
        name: "Efficient quantity from MB and MC schedules",
        make() {
          const s = mbmcSchedule();
          const unitTxt = s.dollars ? "dollars" : `${s.Y.p} per ${s.X.s}`;
          return Q.num({
            q: `For a town deciding how many ${s.X.p} to produce, the marginal benefit and marginal cost of each unit (in ${unitTxt}) are:${tbl([cap(s.X.p), "Marginal benefit", "Marginal cost"], s.rows.map(r => [r.q, s.show(r.mb), s.show(r.mc)]))}What quantity is <b>allocatively efficient</b>?`,
            answer: s.qs, unit: s.X.p, kind: "count",
            traps: traps(s.qs, [
              { value: 1, why: "The first unit has the highest MB, but more units still add more benefit than cost." },
              { value: 6, why: "Producing as much as possible means units where MC > MB, which wastes resources." },
            ]),
            sol: steps("Allocative efficiency: keep producing while MB ≥ MC, and stop where MB = MC.",
              `Below ${s.qs}, MB &gt; MC (produce more). Above ${s.qs}, MC &gt; MB (produce less).`,
              `At ${s.qs} ${s.X.p}, MB = MC = ${s.show(s.v)}, so the efficient quantity is <b>${s.qs}</b>.`),
          });
        },
      },
      {
        name: "Produce more, less, or the same?",
        make() {
          const s = mbmcSchedule();
          const choices = s.rows.filter(r => r.q !== s.qs);
          const r = Math.random() < 0.2 ? s.rows[s.qs - 1] : U.pick(choices);
          const ans = r.mb > r.mc ? "More" : r.mb < r.mc ? "Less" : "The same — this is the efficient quantity";
          const all = ["More", "Less", "The same — this is the efficient quantity"];
          const whyFor = {
            More: "Choose more only when MB > MC.",
            Less: "Choose less only when MC > MB.",
            "The same — this is the efficient quantity": "Stay only where MB = MC.",
          };
          return Q.mc({
            q: `An economy currently produces <b>${r.q}</b> ${pl(r.q, s.X)}. At that quantity the marginal benefit of the last unit is <b>${s.show(r.mb)}</b> and its marginal cost is <b>${s.show(r.mc)}</b>${s.dollars ? "" : ` (both in ${s.Y.p})`}. To reach allocative efficiency, it should produce:`,
            right: ans,
            wrong: all.filter(a => a !== ans).map(a => ({ t: a, why: whyFor[a] })),
            keepOrder: true,
            sol: steps("Compare the value of the last unit (MB) with what it cost (MC).",
              r.mb > r.mc ? `MB (${s.show(r.mb)}) &gt; MC (${s.show(r.mc)}): the last unit was worth more than it cost, so produce <b>more</b>.`
                : r.mb < r.mc ? `MC (${s.show(r.mc)}) &gt; MB (${s.show(r.mb)}): the last unit cost more than it was worth, so produce <b>less</b>.`
                  : `MB = MC = ${s.show(r.mb)}: no change can help, so this is <b>allocatively efficient</b>.`),
          });
        },
      },
      {
        name: "Production vs allocative efficiency",
        make() {
          const cats = ["Both", "Production efficient only", "Neither"];
          const items = cats.map(c => U.pick(ALLOC_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m2-alloc", ALLOC_BANK, 5)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Classify each situation by the kind of efficiency it achieves.",
            cats, items,
            sol: steps("First ask: is the economy <em>on</em> its PPC? If not (idle or misallocated resources), it is neither.",
              "If it is on the PPC, ask whether MB = MC. Yes → both kinds of efficiency. No → production efficient only.",
              "There is no “allocative only”: the best point is always on the PPC."),
          });
        },
      },
      {
        name: "Marginal benefit from total willingness to pay",
        make() {
          const name = U.pick(PEOPLE);
          const [X] = two();
          const mbs = [U.randInt(10, 20) * 2];
          for (let i = 1; i < 4; i++) mbs.push(mbs[i - 1] - U.randInt(2, 6));
          const tot = mbs.reduce((acc, m, i) => { acc.push((acc[i - 1] || 0) + m); return acc; }, []);
          const n = U.randInt(2, 4);
          const ans = mbs[n - 1];
          return Q.num({
            q: `The <b>total</b> amount ${name} is willing to pay for ${X.p} is: 1 ${X.s}: ${U.money(tot[0])}; 2 ${X.p}: ${U.money(tot[1])}; 3 ${X.p}: ${U.money(tot[2])}; 4 ${X.p}: ${U.money(tot[3])}. What is ${name}'s <b>marginal benefit</b> from ${n === 2 ? "the 2nd" : n === 3 ? "the 3rd" : "the 4th"} ${X.s}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: tot[n - 1], why: "That is total willingness to pay. Marginal benefit is the extra from one more unit." },
              { value: tot[n - 1] / n, why: "That is the average, not the marginal benefit." },
              { value: mbs[n - 2], why: "That is the MB of the previous unit." },
            ]),
            sol: steps("Marginal benefit = the extra benefit from one more unit = the change in total willingness to pay.",
              `${U.money(tot[n - 1])} − ${U.money(tot[n - 2])} = <b>${U.money(ans)}</b>.`,
              `The MBs are ${mbs.map(m => U.money(m)).join(", ")}: they fall, which is decreasing marginal benefit.`),
          });
        },
      },
      {
        name: "True or false: efficiency claims",
        make() {
          const s = U.pick(ALLOC_TF);
          return Q.tf({
            q: s.q, truth: s.truth, why: s.why,
            sol: steps("Production efficiency = on the PPC. Allocative efficiency = the best point on the PPC, where MB = MC.", s.why),
          });
        },
      },
      {
        name: "Read the efficient point off a graph",
        make() {
          const [X, Y] = two();
          const qs = U.randInt(2, 6);
          const v = U.randInt(4, 8);
          const b = U.pick([1, 1.5, 2]), c = U.pick([0.5, 1, 1.5]);
          const top = v + b * qs;
          const mcAt0 = Math.max(0, v - c * qs);
          const xm = Math.max(qs + 3, 8);
          const mbEnd = v - b * (xm - qs);
          const mbPts = mbEnd >= 0 ? [[0, top], [xm, mbEnd]] : [[0, top], [qs + v / b, 0]];
          const yMax = Math.ceil(Math.max(top, v + c * (xm - qs)) / 2) * 2 + 2;
          const g = G.plot({ xLabel: `${cap(X.p)} (thousands per year)`, yLabel: `MB and MC (${Y.p} per ${X.s})`, xMax: xm, yMax, xTicks: Array.from({ length: xm }, (_, i) => i + 1), yTicks: ticks(yMax),
            curves: [{ pts: mbPts, style: "main", label: "MB", labelAt: 0 }, { pts: [v - c * qs >= 0 ? [0, mcAt0] : [qs - v / c, 0], [xm, v + c * (xm - qs)]], style: "alt", label: "MC", labelAt: 0 }], aria: "MB and MC lines" });
          const wrongQ = U.shuffle([1, 2, 3, 4, 5, 6, 7].filter(q => q !== qs && q < xm)).slice(0, 3);
          return Q.mc({
            q: `The graph shows the marginal benefit and marginal cost of ${X.p}.${g}What is the allocatively efficient quantity?`,
            right: `${qs} thousand ${X.p}`,
            wrong: wrongQ.map(q => ({ t: `${q} thousand ${X.p}`, why: q < qs ? "Here MB is still above MC, so more should be produced." : "Here MC is above MB, so too much is being produced." })),
            sol: steps("Allocative efficiency is where the MB and MC curves cross (MB = MC).",
              `The curves meet at ${qs} thousand ${X.p}, where both equal ${v} ${Y.p} per ${X.s}. To the left MB &gt; MC; to the right MC &gt; MB.`),
          });
        },
      },
      {
        name: "Why marginal benefit falls",
        make() {
          const name = U.pick(PEOPLE);
          const [X] = two();
          const a = U.randInt(30, 60), b = a - U.randInt(8, 15), c = b - U.randInt(6, 12);
          return Q.mc({
            q: `${name} would pay ${U.money(a)} for a first ${X.s}, ${U.money(b)} for a second and only ${U.money(c)} for a third. Which idea does this illustrate?`,
            right: "The principle of decreasing marginal benefit",
            wrong: [
              { t: "The law of increasing relative cost", why: "That is about the cost of producing more, not the value of consuming more." },
              { t: "Rising marginal cost", why: "These are amounts someone is willing to pay, which measure benefit, not cost." },
              { t: "Allocative efficiency", why: "Efficiency compares MB with MC. Here we only see MB." },
            ],
            rightWhy: "Each extra unit is valued less than the one before.",
            sol: steps("Willingness to pay for one more unit measures marginal benefit.",
              "It falls with each unit, so the MB curve slopes downward. This is the principle of decreasing marginal benefit."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Absolute & comparative advantage
   * ============================================================ */
  /* Two producers' output per time unit of goods X and Y, with no accidental ties. */
  function advScenario(opts) {
    const o = opts || {};
    for (let tries = 0; tries < 500; tries++) {
      const P = producers();
      const [X, Y] = two();
      const ax = U.randInt(1, 12), ay = U.randInt(1, 12), bx = U.randInt(1, 12), by = U.randInt(1, 12);
      if (ax === bx || ay === by || ay * bx === by * ax) continue;
      if (o.bothAbs && !((ax > bx && ay > by) || (ax < bx && ay < by))) continue;
      if (o.noBothAbs && ((ax > bx && ay > by) || (ax < bx && ay < by))) continue;
      const hi = Math.max(ay / ax, by / bx), lo = Math.min(ay / ax, by / bx);
      if (o.gap && hi / lo < o.gap) continue;
      return { P, X, Y, ax, ay, bx, by };
    }
    return { P: { a: "Ines", b: "Rafa", per: "per hour", hr: "hour", hrs: "hours", kind: "people" }, X: GOODS[17], Y: GOODS[6], ax: 6, ay: 2, bx: 4, by: 4 };
  }
  function advTable(s) {
    return tbl(["", `${cap(s.X.p)} ${s.P.per}`, `${cap(s.Y.p)} ${s.P.per}`], [[s.P.a, s.ax, s.ay], [s.P.b, s.bx, s.by]]);
  }
  /* The opportunity-cost working for both producers, in the output-per-hour format. */
  function advWork(s) {
    return `${s.P.a}: 1 ${s.X.s} costs ${s.ay} ÷ ${s.ax} = ${ocQ(s.ay, s.ax, s.Y)}; 1 ${s.Y.s} costs ${s.ax} ÷ ${s.ay} = ${ocQ(s.ax, s.ay, s.X)}.<br>` +
      `${s.P.b}: 1 ${s.X.s} costs ${s.by} ÷ ${s.bx} = ${ocQ(s.by, s.bx, s.Y)}; 1 ${s.Y.s} costs ${s.bx} ÷ ${s.by} = ${ocQ(s.bx, s.by, s.X)}.`;
  }
  function hoursScenario() {
    for (let tries = 0; tries < 500; tries++) {
      const P = producers();
      const [X, Y] = two();
      const hax = U.randInt(1, 10), hay = U.randInt(1, 10), hbx = U.randInt(1, 10), hby = U.randInt(1, 10);
      if (hax === hbx || hay === hby || hax * hby === hay * hbx) continue;
      return { P, X, Y, hax, hay, hbx, hby };
    }
    return { P: { a: "Esterra", b: "Fennland", per: "per worker-hour", hr: "worker-hour", hrs: "worker-hours" }, X: GOODS[14], Y: GOODS[16], hax: 2, hay: 5, hbx: 4, hby: 6 };
  }
  function hoursTable(s) {
    return tbl(["", `${cap(s.P.hrs)} per ${s.X.s}`, `${cap(s.P.hrs)} per ${s.Y.s}`], [[s.P.a, s.hax, s.hay], [s.P.b, s.hbx, s.hby]]);
  }

  const genCompAdv = STUDY.makeGenerator({
    id: "b251-m2-compadv",
    name: "Absolute & comparative advantage",
    blurb: "Compare productivity (absolute advantage) and opportunity cost (comparative advantage), in both output-per-hour and hours-per-unit formats.",
    variants: [
      {
        name: "Who has the absolute advantage?",
        make() {
          const s = advScenario();
          const askX = Math.random() < 0.5;
          const g = askX ? s.X : s.Y;
          const aOut = askX ? s.ax : s.ay, bOut = askX ? s.bx : s.by;
          const winner = aOut > bOut ? s.P.a : s.P.b, loser = aOut > bOut ? s.P.b : s.P.a;
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(s)}Who has the <b>absolute advantage</b> in ${g.p}?`,
            right: winner,
            wrong: [
              { t: loser, why: `${loser} produces fewer ${g.p} ${s.P.per}.` },
              { t: "Neither — absolute advantage depends on opportunity cost", why: "That mixes up the two ideas. Absolute advantage compares output per hour; comparative advantage compares opportunity cost." },
              { t: "Both of them", why: "Only one producer can make more of a good with the same time." },
            ],
            rightWhy: `${winner} makes more ${g.p} with the same amount of time.`,
            sol: steps("Absolute advantage compares <em>productivity</em>: who makes more of the good with the same resources?",
              `${cap(g.p)} ${s.P.per}: ${s.P.a} ${aOut}, ${s.P.b} ${bOut}. So <b>${winner}</b> has the absolute advantage in ${g.p}.`),
          });
        },
      },
      {
        name: "Compute an opportunity cost",
        make() {
          const s = advScenario();
          const useA = Math.random() < 0.5, askX = Math.random() < 0.5;
          const who = useA ? s.P.a : s.P.b;
          const x = useA ? s.ax : s.bx, y = useA ? s.ay : s.by;
          const ox = useA ? s.bx : s.ax, oy = useA ? s.by : s.ay;
          const g = askX ? s.X : s.Y, h = askX ? s.Y : s.X;
          const num = askX ? y : x, den = askX ? x : y;
          const ans = num / den;
          return Q.num({
            q: `Output ${s.P.per}:${advTable(s)}What is <b>${who}'s</b> opportunity cost of producing one ${g.s}, measured in ${h.p}?`,
            answer: ans, unit: h.p,
            traps: traps(ans, [
              { value: den / num, why: `That is the reciprocal: the cost of one ${h.s} in ${g.p}. Put the good <em>given up</em> (${h.p}) on top.` },
              { value: askX ? oy / ox : ox / oy, why: "That is the other producer's opportunity cost." },
              { value: num, why: `That is ${who}'s hourly output of ${h.p}, not the cost of one ${g.s}.` },
            ]),
            sol: steps(`In one ${s.P.hr}, ${who} can make ${qty(askX ? x : y, g)} <em>or</em> ${qty(askX ? y : x, h)}. Making ${g.p} means giving up ${h.p}.`,
              `${qty(den, g)} cost ${qty(num, h)}, so one ${g.s} costs ${num} ÷ ${den}.`,
              `= <b>${ocQ(num, den, h)}</b> per ${g.s}.`),
          });
        },
      },
      {
        name: "Who has the comparative advantage?",
        make() {
          const s = advScenario();
          const askX = Math.random() < 0.5;
          const g = askX ? s.X : s.Y;
          const oa = askX ? s.ay / s.ax : s.ax / s.ay, ob = askX ? s.by / s.bx : s.bx / s.by;
          const winner = oa < ob ? s.P.a : s.P.b, loser = oa < ob ? s.P.b : s.P.a;
          const loserMore = (askX ? (oa < ob ? s.bx > s.ax : s.ax > s.bx) : (oa < ob ? s.by > s.ay : s.ay > s.by));
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(s)}Who has the <b>comparative advantage</b> in ${g.p}?`,
            right: winner,
            wrong: [
              { t: loser, why: loserMore ? `${loser} makes more ${g.p} (absolute advantage), but at a higher opportunity cost.` : `${loser}'s opportunity cost of ${an(g)} is higher.` },
              { t: "Neither — their opportunity costs are equal", why: "Compute them: they are not equal." },
              { t: "Both of them", why: "With two producers and different opportunity costs, only one can have the lower cost of a given good." },
            ],
            rightWhy: `${winner} gives up less to make each ${g.s}.`,
            sol: steps("Comparative advantage = lower <em>opportunity cost</em>, not higher output. Compute what each gives up per unit.",
              advWork(s),
              `Lower cost of ${an(g)}: <b>${winner}</b> (${d2(Math.min(oa, ob))} vs ${d2(Math.max(oa, ob))} ${askX ? s.Y.p : s.X.p}).`),
          });
        },
      },
      {
        name: "Edge case: absolute advantage in both goods",
        make() {
          const s = advScenario({ bothAbs: true });
          const strong = s.ax > s.bx ? s.P.a : s.P.b, weak = s.ax > s.bx ? s.P.b : s.P.a;
          const oaX = s.ay / s.ax, obX = s.by / s.bx;
          const caX = oaX < obX ? s.P.a : s.P.b;
          const strongGood = caX === strong ? s.X : s.Y, weakGood = caX === strong ? s.Y : s.X;
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(s)}Which statement is correct?`,
            right: `${strong} has the absolute advantage in both goods but the comparative advantage only in ${strongGood.p}`,
            wrong: [
              { t: `${strong} has the comparative advantage in both goods, so trade cannot help`, why: "No one can have the lower opportunity cost of both goods: if your cost of X is lower, your cost of Y is higher." },
              { t: `${weak} has no comparative advantage, so ${weak} gains nothing from trade`, why: `${weak} has the lower opportunity cost of ${weakGood.p}, so it has a comparative advantage there.` },
              { t: `${strong} should produce both goods and ${weak} should produce nothing`, why: "Specializing by comparative advantage gives more total output than that." },
            ],
            sol: steps("Absolute advantage compares output; comparative advantage compares opportunity cost. One producer can win every absolute comparison but never every comparative one.",
              advWork(s),
              `${strong} makes more of both goods (absolute advantage in both), but has the lower opportunity cost only for <b>${strongGood.p}</b>. ${weak} has the comparative advantage in ${weakGood.p}.`),
          });
        },
      },
      {
        name: "Hours-per-unit format: comparative advantage",
        make() {
          const s = hoursScenario();
          const askX = Math.random() < 0.5;
          const g = askX ? s.X : s.Y, h = askX ? s.Y : s.X;
          const oa = askX ? s.hax / s.hay : s.hay / s.hax, ob = askX ? s.hbx / s.hby : s.hby / s.hbx;
          const winner = oa < ob ? s.P.a : s.P.b, loser = oa < ob ? s.P.b : s.P.a;
          const loserFaster = askX ? (oa < ob ? s.hbx < s.hax : s.hax < s.hbx) : (oa < ob ? s.hby < s.hay : s.hay < s.hby);
          return Q.mc({
            q: `The table shows how many ${s.P.hrs} each producer needs to make <b>one unit</b> of each good:${hoursTable(s)}Who has the <b>comparative advantage</b> in ${g.p}?`,
            right: winner,
            wrong: [
              { t: loser, why: loserFaster ? `${loser} needs fewer ${s.P.hrs} per ${g.s} (absolute advantage), but gives up more ${h.p} for each one.` : `${loser} gives up more ${h.p} for each ${g.s}.` },
              { t: "Neither — their opportunity costs are equal", why: "Compute them: they are not equal." },
            ],
            rightWhy: `${winner} gives up fewer ${h.p} per ${g.s}.`,
            sol: steps(`With hours per unit, the time spent on one ${g.s} could have made (hours per ${g.s}) ÷ (hours per ${h.s}) ${h.p}. The good you want goes on top.`,
              `${s.P.a}: ${askX ? s.hax : s.hay} ÷ ${askX ? s.hay : s.hax} = ${ocQ(askX ? s.hax : s.hay, askX ? s.hay : s.hax, h)}. ${s.P.b}: ${askX ? s.hbx : s.hby} ÷ ${askX ? s.hby : s.hbx} = ${ocQ(askX ? s.hbx : s.hby, askX ? s.hby : s.hbx, h)}.`,
              `Lower opportunity cost: <b>${winner}</b>. Needing fewer hours is absolute advantage, which does not decide specialization.`),
          });
        },
      },
      {
        name: "Hours-per-unit format: compute the cost",
        make() {
          const s = hoursScenario();
          const useA = Math.random() < 0.5, askX = Math.random() < 0.5;
          const who = useA ? s.P.a : s.P.b;
          const hx = useA ? s.hax : s.hbx, hy = useA ? s.hay : s.hby;
          const g = askX ? s.X : s.Y, h = askX ? s.Y : s.X;
          const num = askX ? hx : hy, den = askX ? hy : hx;
          const ans = num / den;
          return Q.num({
            q: `${s.P.hrs.charAt(0).toUpperCase() + s.P.hrs.slice(1)} needed to make <b>one unit</b>:${hoursTable(s)}What is <b>${who}'s</b> opportunity cost of one ${g.s}, in ${h.p}?`,
            answer: ans, unit: h.p,
            traps: traps(ans, [
              { value: den / num, why: `That is the reciprocal. With <em>hours per unit</em> data the formula flips: hours per ${g.s} ÷ hours per ${h.s}.` },
              { value: num, why: `That is the number of ${s.P.hrs} per ${g.s}, not what is given up.` },
            ]),
            sol: steps(`Making one ${g.s} takes ${who} ${num} ${s.P.hrs}. Ask how many ${h.p} those hours could have made instead.`,
              `Each ${h.s} takes ${den} ${den === 1 ? s.P.hr : s.P.hrs}, so ${num} ${s.P.hrs} could make ${num} ÷ ${den} ${h.p}.`,
              `Opportunity cost = <b>${ocQ(num, den, h)}</b> per ${g.s}. (Output-per-hour data use the reverse ratio.)`),
          });
        },
      },
      {
        name: "Edge case: equal opportunity costs",
        make() {
          const P = producers();
          const [X, Y] = two();
          let ax = U.randInt(1, 6), ay = U.randInt(1, 6);
          if (ax === ay) ay = ax + 1;
          const k = U.randInt(2, 3);
          const s = { P, X, Y, ax, ay, bx: ax * k, by: ay * k };
          return Q.mc({
            q: `Output ${P.per}:${advTable(s)}Which statement is correct?`,
            right: "Neither has a comparative advantage, so specializing and trading cannot make both better off",
            wrong: [
              { t: `${P.b} has the comparative advantage in both goods because it makes more of each`, why: `${P.b} has the <em>absolute</em> advantage in both. Its opportunity costs equal ${P.a}'s.` },
              { t: `${P.a} should specialize in ${X.p} and ${P.b} in ${Y.p} to gain from trade`, why: "With equal opportunity costs, any trade that helps one side hurts the other." },
              { t: `${P.a} has the comparative advantage in both goods because it is less productive`, why: "Comparative advantage is about opportunity cost, and here the costs are equal." },
            ],
            sol: steps("Compute each producer's opportunity cost of a unit of each good.",
              advWork(s),
              `The costs are identical (${ocQ(ay, ax, Y)} per ${X.s} for both), so there is no comparative advantage and no gain from specializing.`),
          });
        },
      },
      {
        name: "Terms of trade that benefit both",
        make() {
          const CAND = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
          let s, lo, hi, mid;
          for (let i = 0; i < 300; i++) {
            s = advScenario({ gap: 2 });
            lo = Math.min(s.ay / s.ax, s.by / s.bx); hi = Math.max(s.ay / s.ax, s.by / s.bx);
            const between = CAND.filter(c => c > lo + 0.05 && c < hi - 0.05);
            if (between.length) { mid = U.pick(between); break; }
          }
          if (mid == null) { s = { P: { a: "Ines", b: "Rafa", per: "per hour" }, X: GOODS[6], Y: GOODS[17], ax: 2, ay: 6, bx: 4, by: 4 }; lo = 1; hi = 3; mid = 2; }
          const below = U.round(lo / 2, 2), above = U.round(hi * 1.5, 2);
          const lowP = s.ay / s.ax < s.by / s.bx ? s.P.a : s.P.b, highP = lowP === s.P.a ? s.P.b : s.P.a;
          const opt = p => `1 ${s.X.s} for ${d2(p)} ${pl(p, s.Y)}`;
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(s)}${lowP} will specialize in ${s.X.p} and sell some to ${highP} in exchange for ${s.Y.p}. Which price benefits <b>both</b> of them?`,
            right: opt(mid),
            wrong: [
              { t: opt(below), why: `Below ${lowP}'s own cost of ${d2(lo)} ${s.Y.p}: ${lowP} would be better off making ${s.Y.p} itself.` },
              { t: opt(above), why: `Above ${highP}'s own cost of ${d2(hi)} ${s.Y.p}: ${highP} would rather make ${s.X.p} itself.` },
              { t: opt(Math.random() < 0.5 ? lo : hi), why: "Exactly equal to one producer's opportunity cost, so that producer gains nothing. The price must lie strictly between." },
            ],
            sol: steps(`A trade helps both only if the price of ${an(s.X)} lies <em>strictly between</em> the two opportunity costs of ${an(s.X)}.`,
              `${lowP}'s cost of ${an(s.X)}: ${d2(lo)} ${s.Y.p}. ${highP}'s cost: ${d2(hi)} ${s.Y.p}.`,
              `Only <b>${d2(mid)} ${mid === 1 ? s.Y.s : s.Y.p}</b> lies strictly between ${d2(lo)} and ${d2(hi)}: the seller gets more than its cost, and the buyer pays less than its own cost.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Specialization & gains from trade
   * ============================================================ */
  /* A makes X, B makes Y (by comparative advantage). Numbers are chosen so that
   * after the trade both parties have strictly more of BOTH goods than with no trade. */
  function tradeScenario() {
    for (let tries = 0; tries < 4000; tries++) {
      const P = producers(true);
      const [X, Y] = two();
      let ax = U.randInt(1, 10), ay = U.randInt(1, 10), bx = U.randInt(1, 10), by = U.randInt(1, 10);
      if (ax === bx || ay === by || ay * bx === by * ax) continue;
      if (ay * bx > by * ax) { [P.a, P.b] = [P.b, P.a]; [ax, bx] = [bx, ax]; [ay, by] = [by, ay]; }
      const H = U.pick([6, 8, 10]);
      const hA = U.randInt(1, H - 1), hB = U.randInt(1, H - 1);
      const oA = ay / ax, oB = by / bx;
      const ps = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5].filter(p => p > oA + 1e-9 && p < oB - 1e-9);
      if (!ps.length) continue;
      const p = U.pick(ps);
      const Ts = [];
      for (let T = 1; T <= H * ax; T++) {
        const got = T * p;
        if (!Number.isInteger(got)) continue;
        if (H * ax - T > hA * ax && got > (H - hA) * ay && T > hB * bx && H * by - got > (H - hB) * by) Ts.push(T);
      }
      if (!Ts.length) continue;
      const T = U.pick(Ts);
      return mkTrade(P, X, Y, ax, ay, bx, by, H, hA, hB, p, T);
    }
    return mkTrade({ a: "Ines", b: "Rafa", per: "per hour", hr: "hour", hrs: "hours" }, GOODS[17], GOODS[6], 6, 2, 4, 4, 8, 4, 4, 0.5, 20);
  }
  function mkTrade(P, X, Y, ax, ay, bx, by, H, hA, hB, p, T) {
    const s = { P, X, Y, ax, ay, bx, by, H, hA, hB, p, T, R: T * p };
    s.noA = { x: hA * ax, y: (H - hA) * ay };
    s.noB = { x: hB * bx, y: (H - hB) * by };
    s.prodA = { x: H * ax, y: 0 };
    s.prodB = { x: 0, y: H * by };
    s.conA = { x: H * ax - T, y: T * p };
    s.conB = { x: T, y: H * by - T * p };
    return s;
  }
  function tradeSetup(s, withTrade) {
    return `${advTable(s)}Each works ${s.H} ${s.P.hrs} a day. With no trade, ${s.P.a} spends ${s.hA} ${s.hA === 1 ? s.P.hr : s.P.hrs} on ${s.X.p} and ${s.H - s.hA} on ${s.Y.p}; ${s.P.b} spends ${s.hB} on ${s.X.p} and ${s.H - s.hB} on ${s.Y.p}.` +
      (withTrade ? ` Instead, ${s.P.a} specializes in ${s.X.p} and ${s.P.b} in ${s.Y.p}, and ${s.P.a} trades <b>${qty(s.T, s.X)}</b> to ${s.P.b} for <b>${qty(s.R, s.Y)}</b>.` : "");
  }
  function noTradeLine(s) {
    return `No trade: ${s.P.a} makes ${s.hA} × ${s.ax} = ${s.noA.x} ${s.X.p} and ${s.H - s.hA} × ${s.ay} = ${s.noA.y} ${s.Y.p}; ${s.P.b} makes ${s.hB} × ${s.bx} = ${s.noB.x} ${s.X.p} and ${s.H - s.hB} × ${s.by} = ${s.noB.y} ${s.Y.p}.`;
  }
  const TRADE_GENERAL = [
    { t: "Specialization and trade can let each party consume a bundle outside its own PPC.", ok: true },
    { t: "A producer with an absolute advantage in both goods can still gain from trade.", ok: true },
    { t: "Trade is driven by comparative advantage, not absolute advantage.", ok: true },
    { t: "Trade only benefits the party with the absolute advantage.", ok: false, why: "Both parties can gain when each specializes by comparative advantage." },
    { t: "Trade makes one side better off only by making the other side worse off.", ok: false, why: "Voluntary trade at a price between the opportunity costs helps both." },
    { t: "Trade shifts each party's own PPC outward by improving its technology.", ok: false, why: "Each PPC is unchanged; trade lets them consume beyond it." },
  ];

  const genTrade = STUDY.makeGenerator({
    id: "b251-m2-trade",
    name: "Specialization & gains from trade",
    blurb: "Compute output with and without specialization, consumption after a trade and each side's gain, and explain why both sides win.",
    variants: [
      {
        name: "Total output with specialization",
        make() {
          const s = tradeScenario();
          const askX = Math.random() < 0.5;
          const g = askX ? s.X : s.Y;
          const ans = askX ? s.prodA.x : s.prodB.y;
          const noT = askX ? s.noA.x + s.noB.x : s.noA.y + s.noB.y;
          const wrongWay = askX ? s.H * s.bx : s.H * s.ay;
          return Q.num({
            q: `Output ${s.P.per}:${tradeSetup(s, false)} If each specializes completely according to comparative advantage, how many <b>${g.p}</b> will the two produce in total per day?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: noT, why: "That is the total with no specialization." },
              { value: wrongWay, why: `That assumes the wrong person makes ${g.p}. Check who has the lower opportunity cost.` },
            ]),
            sol: steps("First find comparative advantage (lower opportunity cost), then give each person's whole day to that good.",
              `${s.P.a}'s cost of ${an(s.X)} is ${ocQ(s.ay, s.ax, s.Y)}, versus ${s.P.b}'s ${ocStr(s.by, s.bx)}. So ${s.P.a} specializes in ${s.X.p} and ${s.P.b} in ${s.Y.p}.`,
              askX ? `${s.P.a}: ${s.H} × ${s.ax} = <b>${ans} ${s.X.p}</b> (${s.P.b} makes none).` : `${s.P.b}: ${s.H} × ${s.by} = <b>${ans} ${s.Y.p}</b> (${s.P.a} makes none).`),
          });
        },
      },
      {
        name: "Gain in total output from specializing",
        make() {
          const s = tradeScenario();
          const askX = Math.random() < 0.5;
          const g = askX ? s.X : s.Y;
          const spec = askX ? s.prodA.x : s.prodB.y;
          const noT = askX ? s.noA.x + s.noB.x : s.noA.y + s.noB.y;
          const ans = spec - noT;
          return Q.num({
            q: `Output ${s.P.per}:${tradeSetup(s, false)} By how many <b>${g.p}</b> per day does total output rise if they specialize completely according to comparative advantage?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: spec, why: "That is the total with specialization. The question asks for the increase." },
              { value: noT, why: "That is the total with no specialization." },
            ]),
            sol: steps("Compute total output both ways and subtract.",
              noTradeLine(s) + ` Total ${g.p}: ${noT}.`,
              `Specialized: ${s.P.a} makes only ${s.X.p} (${s.prodA.x}), ${s.P.b} only ${s.Y.p} (${s.prodB.y}). Total ${g.p}: ${spec}. Increase: ${spec} − ${noT} = <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Consumption after trade",
        make() {
          const s = tradeScenario();
          const useA = Math.random() < 0.5, askX = Math.random() < 0.5;
          const who = useA ? s.P.a : s.P.b;
          const g = askX ? s.X : s.Y;
          const con = useA ? s.conA : s.conB, prod = useA ? s.prodA : s.prodB, no = useA ? s.noA : s.noB;
          const ans = askX ? con.x : con.y;
          return Q.num({
            q: `Output ${s.P.per}:${tradeSetup(s, true)} After the trade, how many <b>${g.p}</b> does <b>${who}</b> have?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: askX ? prod.x : prod.y, why: "That is what was produced before trading." },
              { value: askX ? no.x : no.y, why: "That is the no-trade amount." },
              { value: askX ? s.T : s.R, why: "That is the amount traded." },
            ].filter(t => t.value > 0)),
            sol: steps("Consumption = what you produce − what you send + what you receive.",
              useA ? `${s.P.a} produces ${s.prodA.x} ${s.X.p} and 0 ${s.Y.p}, sends ${s.T} ${s.X.p}, receives ${s.R} ${s.Y.p}.` : `${s.P.b} produces 0 ${s.X.p} and ${s.prodB.y} ${s.Y.p}, receives ${s.T} ${s.X.p}, sends ${s.R} ${s.Y.p}.`,
              `So ${who} has ${con.x} ${s.X.p} and ${con.y} ${s.Y.p}: the answer is <b>${ans} ${g.p}</b>.`),
          });
        },
      },
      {
        name: "Each side's gain from trade",
        make() {
          const s = tradeScenario();
          const useA = Math.random() < 0.5, askX = Math.random() < 0.5;
          const who = useA ? s.P.a : s.P.b;
          const g = askX ? s.X : s.Y;
          const con = useA ? s.conA : s.conB, no = useA ? s.noA : s.noB;
          const ans = askX ? con.x - no.x : con.y - no.y;
          return Q.num({
            q: `Output ${s.P.per}:${tradeSetup(s, true)} Compared with no trade, how many <b>more ${g.p}</b> does <b>${who}</b> end up with?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: askX ? con.x : con.y, why: "That is the amount after trade. Subtract the no-trade amount to get the gain." },
              { value: askX ? no.x : no.y, why: "That is the no-trade amount." },
            ]),
            sol: steps("Gain = consumption with specialization and trade − consumption with no trade.",
              noTradeLine(s),
              `After trade ${who} has ${con.x} ${s.X.p} and ${con.y} ${s.Y.p}. Gain in ${g.p}: ${askX ? con.x : con.y} − ${askX ? no.x : no.y} = <b>${ans}</b>. Both sides gain some of both goods.`),
          });
        },
      },
      {
        name: "Who should specialize in what?",
        make() {
          const s = tradeScenario();
          const flip = Math.random() < 0.5;
          const show = flip ? { ...s, P: { ...s.P, a: s.P.b, b: s.P.a }, ax: s.bx, ay: s.by, bx: s.ax, by: s.ay } : s;
          const absBoth = (s.ax > s.bx && s.ay > s.by) ? s.P.a : (s.ax < s.bx && s.ay < s.by) ? s.P.b : null;
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(show)}To get the largest gains from trade, who should specialize in what?`,
            right: `${s.P.a} in ${s.X.p}, ${s.P.b} in ${s.Y.p}`,
            wrong: [
              { t: `${s.P.a} in ${s.Y.p}, ${s.P.b} in ${s.X.p}`, why: "That is the reverse of comparative advantage, so total output would be lower." },
              { t: absBoth ? `${absBoth} in both goods` : `Each should split time equally between the goods`, why: absBoth ? "Absolute advantage in both goods does not mean producing both. Specialize by comparative advantage." : "Splitting time gives up the gains from specialization." },
              { t: "It doesn't matter, as long as they trade", why: "Specializing the wrong way lowers total output." },
            ],
            sol: steps("Specialize by <em>comparative</em> advantage: each makes the good with the lower opportunity cost.",
              advWork(s),
              `${s.P.a} has the lower cost of ${s.X.p}, ${s.P.b} of ${s.Y.p}.`),
          });
        },
      },
      {
        name: "Consuming outside the PPC (graph)",
        make() {
          const s = tradeScenario();
          const xm = s.prodA.x, ym = s.H * s.ay;
          const xM = Math.max(xm, s.conA.x) * 1.15, yM = Math.max(ym, s.conA.y) * 1.25;
          const [L1, L2, L3] = U.sample(["J", "K", "M", "N", "R", "T"], 3);
          const g = G.plot({ xLabel: `${cap(s.X.p)} (${s.P.a})`, yLabel: `${cap(s.Y.p)} (${s.P.a})`, xMax: xM, yMax: yM, xTicks: ticks(xM), yTicks: ticks(yM),
            curves: [{ pts: [[0, ym], [xm, 0]], style: "main", label: `${s.P.a}'s PPC`, labelAt: 0 }],
            points: [{ x: s.noA.x, y: s.noA.y, label: L1 }, { x: s.prodA.x, y: 0, label: L2 }, { x: s.conA.x, y: s.conA.y, label: L3 }], aria: "a PPC with three points" });
          return Q.mc({
            q: `Output ${s.P.per}:${tradeSetup(s, true)} The graph shows ${s.P.a}'s PPC. Point ${L1} is ${s.P.a}'s no-trade bundle, ${L2} is what ${s.P.a} produces after specializing, and ${L3} is what ${s.P.a} consumes after the trade.${g}What does the position of point ${L3} tell you?`,
            right: `${s.P.a} could not produce bundle ${L3} alone; trade lets ${s.P.a} consume outside its own PPC`,
            wrong: [
              { t: `${s.P.a} is producing inefficiently at ${L3}`, why: `${L3} is consumption, not production, and it lies outside the PPC, not inside.` },
              { t: `${s.P.a}'s PPC has shifted outward because of the trade`, why: "The PPC (what can be produced alone) is unchanged; only consumption moved beyond it." },
              { t: `Bundle ${L3} lies on ${s.P.a}'s PPC, so it is attainable without trade`, why: `${L3} has more of both goods than ${L1}, which is on the PPC, so ${L3} lies outside.` },
            ],
            sol: steps("A PPC shows what a producer can make <em>alone</em>. Trade changes what it can consume, not what it can produce.",
              `After trading, ${s.P.a} has ${s.conA.x} ${s.X.p} and ${s.conA.y} ${s.Y.p}, more of both than the no-trade bundle (${s.noA.x}, ${s.noA.y}). So ${L3} lies <b>outside</b> the PPC.`),
          });
        },
      },
      {
        name: "Why trade? (absolute advantage in both)",
        make() {
          const s = advScenario({ bothAbs: true });
          const strong = s.ax > s.bx ? s.P.a : s.P.b, weak = strong === s.P.a ? s.P.b : s.P.a;
          return Q.mc({
            q: `Output ${s.P.per}:${advTable(s)}${strong} is more productive at both goods. Why can trading with ${weak} still make ${strong} better off?`,
            right: `${strong} can specialize in the good with the lower opportunity cost and buy the other from ${weak} for less than it would cost ${strong} to make`,
            wrong: [
              { t: `It cannot. Only producers with an absolute advantage in different goods gain from trade`, why: "Gains depend on different opportunity costs, not on absolute advantage." },
              { t: `Because trading improves ${strong}'s technology and shifts its PPC out`, why: "Trade leaves each PPC unchanged; it lets consumption go beyond it." },
              { t: `Because ${weak} works for free`, why: "Both sides are paid in goods at agreed terms of trade." },
            ],
            sol: steps("Trade is driven by comparative advantage, meaning differences in <em>opportunity cost</em>.",
              advWork(s),
              `${strong} has the lower cost of only one good. Buying the other from ${weak}, at a price below ${strong}'s own opportunity cost, frees ${strong}'s time for its best use.`),
          });
        },
      },
      {
        name: "Select all true statements about this trade",
        make() {
          const s = tradeScenario();
          const own = [
            { t: `${s.P.a} has the comparative advantage in ${s.X.p}.`, ok: true },
            { t: `${s.P.b} has the comparative advantage in ${s.X.p}.`, ok: false, why: `${s.P.b}'s cost of ${an(s.X)} (${ocQ(s.by, s.bx, s.Y)}) is higher than ${s.P.a}'s (${ocStr(s.ay, s.ax)}).` },
            { t: `After the trade, ${s.P.b} has more of both goods than with no trade.`, ok: true },
            { t: `The price (${d2(s.p)} ${s.Y.p} per ${s.X.s}) lies between the two producers' opportunity costs of ${an(s.X)}.`, ok: true },
            { t: `At this price ${s.P.b} pays more for each ${s.X.s} than it would cost ${s.P.b} to make one.`, ok: false, why: `${s.P.b}'s own cost is ${ocQ(s.by, s.bx, s.Y)}, more than the price of ${d2(s.p)}.` },
            { t: `Specializing gives fewer ${s.Y.p} in total than the no-trade plan.`, ok: false, why: `Total ${s.Y.p} rise from ${s.noA.y + s.noB.y} to ${s.prodB.y}.` },
          ];
          const opts = U.sample(own, 3).concat(U.sample(TRADE_GENERAL, 2));
          if (!opts.some(o => o.ok)) opts[0] = U.pick(own.filter(o => o.ok));
          return Q.multi({
            q: `Output ${s.P.per}:${tradeSetup(s, true)} Select <b>all</b> true statements.`,
            options: opts,
            sol: steps("Work out the opportunity costs and the no-trade and after-trade bundles first.",
              advWork(s) + "<br>" + noTradeLine(s),
              `After trade: ${s.P.a} has (${s.conA.x} ${s.X.p}, ${s.conA.y} ${s.Y.p}); ${s.P.b} has (${s.conB.x} ${s.X.p}, ${s.conB.y} ${s.Y.p}). Both gain, which is why trade happens.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Growth, the PPC and the per-worker production function
   * ============================================================ */
  const SHIFT_OUT = "PPC shifts outward", SHIFT_IN = "PPC shifts inward", PIVOT = "PPC pivots out on one axis only",
    INSIDE = "Economy moves inside its PPC", ALONG = "Movement along the PPC";
  function growthBank(X, Y) {
    return [
      { t: "The labor force grows as many new workers immigrate.", cat: SHIFT_OUT, why: "More labor means more of both goods can be produced." },
      { t: "Years of investment add new factories that can be used in either industry.", cat: SHIFT_OUT, why: "More capital shifts the whole PPC out." },
      { t: "Better schooling raises workers' skills in every industry.", cat: SHIFT_OUT, why: "More human capital raises the capacity to make both goods." },
      { t: "A management breakthrough raises productivity in both industries.", cat: SHIFT_OUT, why: "Technology that helps both goods shifts the whole curve out." },
      { t: "A hurricane destroys roads, ports and factories used by both industries.", cat: SHIFT_IN, why: "Losing resources shrinks what can be produced." },
      { t: "An epidemic permanently shrinks the working-age population.", cat: SHIFT_IN, why: "Less labor shifts the PPC inward." },
      { t: "A war destroys a large share of the country's capital stock.", cat: SHIFT_IN, why: "Destroyed capital shifts the PPC inward." },
      { t: `A new robot sharply raises the output of ${X.p} but is no help in making ${Y.p}.`, cat: PIVOT, why: `Only the maximum number of ${X.p} rises, so the PPC rotates out along the ${X.p} axis.` },
      { t: `Engineers invent a faster way to make ${Y.p} that is useless for making ${X.p}.`, cat: PIVOT, why: `Only the ${Y.p} intercept moves out.` },
      { t: "A recession throws many workers out of work.", cat: INSIDE, why: "Unemployed resources mean a point inside the curve; the curve does not move." },
      { t: "Factories run at half capacity during a slump in spending.", cat: INSIDE, why: "Idle capacity puts the economy inside its PPC." },
      { t: `Skilled ${Y.s} makers are forced to make ${X.p}, which they are bad at, while ${X.s} makers sit idle.`, cat: INSIDE, why: "Misallocated and idle resources put the economy inside its PPC." },
      { t: `Consumers want more ${X.p}, so the fully employed economy moves workers out of ${Y.p} into ${X.p}.`, cat: ALONG, why: "A different mix with the same resources and technology is a move along the curve." },
      { t: `The country decides to make fewer ${X.p} and more ${Y.p}, keeping everyone employed.`, cat: ALONG, why: "Choosing a different point on the same curve is a movement along it." },
    ];
  }
  function pwCurve(a, kMax) { return Array.from({ length: 41 }, (_, i) => { const k = (i / 40) * kMax; return [k, a * Math.sqrt(k)]; }); }
  const PW_BANK = [
    { t: "A firm buys more machines of the same model for each worker.", cat: "Movement along the curve", why: "More K/L with the same technology is a move along the curve." },
    { t: "Investment raises the amount of capital per hour worked, with methods unchanged.", cat: "Movement along the curve", why: "K/L is on the horizontal axis, so this is a move along the curve." },
    { t: "A delivery company gives each driver a second van identical to the first.", cat: "Movement along the curve", why: "More of the same capital per worker is a move along the curve." },
    { t: "A farm buys more tractors of the same kind per farmhand.", cat: "Movement along the curve", why: "More capital per hour, same technology: a move along the curve." },
    { t: "New software lets workers with the same equipment produce more each hour.", cat: "Shift up of the curve", why: "Technological change raises Q/L at every K/L." },
    { t: "A smarter factory floor plan raises output per hour without any new machines.", cat: "Shift up of the curve", why: "Better organization is technological change, so the curve shifts up." },
    { t: "A new production process is invented and adopted across the industry.", cat: "Shift up of the curve", why: "Technological change shifts the curve up." },
    { t: "Better management methods raise output per hour at every level of capital.", cat: "Shift up of the curve", why: "More Q/L at every K/L is an upward shift." },
  ];

  const genGrowth = STUDY.makeGenerator({
    id: "b251-m2-growth",
    name: "Growth, the PPC & the per-worker production function",
    blurb: "Tell shifts from pivots, movements inside and along the PPC, link capital goods to future growth, and use the per-worker production function.",
    variants: [
      {
        name: "Classify events on the PPC",
        make() {
          const [X, Y] = two();
          const bank = growthBank(X, Y);
          const cats = [SHIFT_OUT, SHIFT_IN, PIVOT, INSIDE, ALONG];
          const chosen = U.sample(cats, 4).map(c => U.pick(bank.filter(i => i.cat === c)));
          const rest = U.pick(bank.filter(i => !chosen.includes(i)));
          return Q.classify({
            q: `An economy produces ${X.p} and ${Y.p}. What does each event do to its production possibilities?`,
            cats, items: chosen.concat([rest]),
            sol: steps("Ask: did the economy's <em>resources or technology</em> change? If yes, the curve moves. If not, the economy is just at a different point.",
              "More resources or technology for both goods → shift out. Lost resources → shift in. Technology for one good only → pivot on that axis.",
              "Idle or misallocated resources → inside. Choosing a different mix, everything employed → along."),
          });
        },
      },
      {
        name: "What caused the new PPC? (graph)",
        make() {
          const [X, Y] = two();
          const xm = U.pick([40, 50, 60]), ym = U.pick([40, 60, 80]);
          const type = U.pick(["out", "pivotX", "pivotY", "in"]);
          const f = 1.3;
          const n = { out: [xm * f, ym * f], pivotX: [xm * f, ym], pivotY: [xm, ym * f], in: [xm / f, ym / f] }[type];
          const g = G.plot({ xLabel: cap(X.p), yLabel: cap(Y.p), xMax: xm * 1.5, yMax: ym * 1.5, xTicks: ticks(xm * 1.5), yTicks: ticks(ym * 1.5),
            curves: [{ pts: G.bowed(xm, ym), style: "main", label: "PPC₁", labelAt: type === "in" ? 12 : 24 }, { pts: G.bowed(n[0], n[1]), style: "alt", label: "PPC₂", labelAt: type === "in" ? 24 : 10 }], aria: "two PPCs" });
          const opts = {
            out: "More resources, or a technology improvement that helps both goods",
            pivotX: `A technology improvement in producing ${X.p} only`,
            pivotY: `A technology improvement in producing ${Y.p} only`,
            in: "A loss of resources, such as a disaster destroying factories",
          };
          const whyWrong = {
            out: "That would move both intercepts outward.",
            pivotX: `That would move only the ${X.p} intercept outward.`,
            pivotY: `That would move only the ${Y.p} intercept outward.`,
            in: "That would move both intercepts inward.",
          };
          const wrong = Object.keys(opts).filter(k => k !== type).map(k => ({ t: opts[k], why: whyWrong[k] }));
          wrong.push({ t: "A recession that leaves many workers unemployed", why: "Unemployment moves the economy inside its PPC; the curve itself does not move." });
          return Q.mc({
            q: `The economy's production possibilities change from PPC₁ to PPC₂.${g}Which event best explains the change?`,
            right: opts[type], wrong: U.sample(wrong, 3),
            sol: steps("Look at each intercept: it shows the most of that good the economy could make if it made nothing else.",
              type === "out" ? "Both intercepts moved out, so the economy can make more of both goods: more resources or better general technology."
                : type === "in" ? "Both intercepts moved in, so resources were lost."
                  : `Only the ${type === "pivotX" ? X.p : Y.p} intercept moved; the other stayed put. Only that good's production improved, so the curve <b>pivots</b>.`),
          });
        },
      },
      {
        name: "Capital goods today, growth tomorrow",
        make() {
          const [c1, c2] = U.sample(COUNTRIES, 2);
          const xm = 100, ym = 50;
          const xA = U.randInt(30, 45), xB = U.randInt(75, 88);
          const yA = U.round(G.bowedY(xA, xm, ym), 1), yB = U.round(G.bowedY(xB, xm, ym), 1);
          const g = G.plot({ xLabel: "Consumption goods", yLabel: "Capital goods", xMax: 120, yMax: 60, xTicks: [20, 40, 60, 80, 100, 120], yTicks: [10, 20, 30, 40, 50, 60],
            curves: [{ pts: G.bowed(xm, ym), style: "main", label: "today's PPC", labelAt: 34 }], points: [{ x: xA, y: yA, label: c1 }, { x: xB, y: yB, label: c2 }], aria: "two countries on the same PPC" });
          return Q.mc({
            q: `${c1} and ${c2} have identical PPCs today, but choose different points.${g}If nothing else differs, whose PPC is likely to shift outward <b>more</b> over the next decade?`,
            right: c1,
            wrong: [
              { t: c2, why: `${c2} enjoys more consumption goods now, but builds fewer capital goods, so its capacity grows less.` },
              { t: "Both equally, since their PPCs are identical today", why: "Today's PPC is the same, but what they produce today shapes tomorrow's PPC." },
              { t: "Neither: a PPC cannot shift", why: "PPCs shift when resources or technology change, and capital goods add resources." },
            ],
            rightWhy: `${c1} produces more capital goods, which add to its future resources.`,
            sol: steps("Capital goods (machines, factories, research) are resources used to make future output.",
              `${c1} puts more of today's resources into capital goods, so its future PPC shifts out further. The price is fewer consumption goods <em>today</em>.`),
          });
        },
      },
      {
        name: "Opportunity cost of growth",
        make() {
          const c = U.pick(COUNTRIES);
          const what = U.pick(["builds more factories and research labs", "devotes a larger share of output to new equipment", "puts more workers into building highways and power plants", "spends more on training programs and new machinery"]);
          return Q.mc({
            q: `${c} ${what} this year in order to grow faster in the future. What is the <b>opportunity cost</b> of that faster growth?`,
            right: "Fewer consumption goods today",
            wrong: [
              { t: "Nothing, because the PPC will shift outward", why: "Growth is not free: resources used for capital goods today cannot make consumption goods today." },
              { t: "Fewer capital goods in the future", why: "More capital now means more capacity later, not less capital." },
              { t: "Higher unemployment today", why: "On the PPC, all resources are still employed; they are just making a different mix." },
            ],
            sol: steps("Opportunity cost is the best alternative given up. What else could the resources used for capital goods have made today?",
              "They could have made consumption goods. The opportunity cost of economic growth is <b>less current consumption</b>."),
          });
        },
      },
      {
        name: "Per-worker function: move along or shift?",
        make() {
          const items = U.sample(PW_BANK.filter(i => i.cat === "Movement along the curve"), 2)
            .concat(U.sample(PW_BANK.filter(i => i.cat === "Shift up of the curve"), 2));
          items.push(U.pick(PW_BANK.filter(i => !items.includes(i))));
          return Q.classify({
            q: "On a per-worker production function (real GDP per hour worked, Q/L, against capital per hour worked, K/L), how does each change show up?",
            cats: ["Movement along the curve", "Shift up of the curve"],
            items,
            sol: steps("K/L is on the horizontal axis, so more capital per hour is a movement <em>along</em> the curve.",
              "Technology is held constant along a curve, so technological change (new methods, software, layouts, management) <em>shifts</em> it up."),
          });
        },
      },
      {
        name: "Diminishing returns from a per-worker table",
        make() {
          const step0 = U.pick([5000, 10000, 20000]);
          const base = U.randInt(15, 30);
          const incs = [U.randInt(14, 20)];
          for (let i = 1; i < 4; i++) incs.push(incs[i - 1] - U.randInt(2, 4));
          const q = [base];
          incs.forEach((d, i) => q.push(q[i] + d));
          const ks = [1, 2, 3, 4, 5].map(i => i * step0);
          const i = U.randInt(1, 3);
          const ans = incs[i];
          return Q.num({
            q: `With technology unchanged, a country's per-worker production function is:${tbl(["Capital per hour worked (K/L)", "Real GDP per hour worked (Q/L)"], ks.map((k, j) => [U.money(k), U.money(q[j])]))}By how much does real GDP per hour rise when K/L increases from ${U.money(ks[i])} to ${U.money(ks[i + 1])}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: q[i + 1], why: "That is the level of Q/L, not the increase." },
              { value: incs[i - 1], why: "That is the increase from the previous step." },
              { value: q[i + 1] - q[0], why: "That is the total increase from the first row." },
            ]),
            sol: steps("Read the change in Q/L for this one step in K/L.",
              `${U.money(q[i + 1])} − ${U.money(q[i])} = <b>${U.money(ans)}</b>.`,
              `The increases are ${incs.map(d => U.money(d)).join(", ")}: each equal step in K/L adds less. This is <b>diminishing returns</b>, a movement along the curve.`),
          });
        },
      },
      {
        name: "Why sustained growth needs technology",
        make() {
          const c = U.pick(COUNTRIES);
          return Q.mc({
            q: `${c} keeps raising capital per hour worked but has no technological progress. According to the per-worker production function, what happens to growth in real GDP per hour over time?`,
            right: "It slows down, because each extra unit of capital per hour adds less output (diminishing returns)",
            wrong: [
              { t: "It speeds up, because more capital always adds more and more output", why: "Diminishing returns mean each addition adds less, not more." },
              { t: "It stays constant forever, because output rises in proportion to capital", why: "The per-worker curve flattens; output does not rise in proportion." },
              { t: "It shifts the per-worker production function up each year", why: "More K/L is a movement along the curve, not a shift." },
            ],
            sol: steps("Holding technology constant, the per-worker production function flattens as K/L grows: diminishing returns.",
              "So piling up capital alone gives smaller and smaller gains. <b>Sustained</b> growth in living standards requires continuing technological change, which shifts the curve up."),
          });
        },
      },
      {
        name: "Read the per-worker graph",
        make() {
          const kMax = 20000;
          const a1 = 0.3, a2 = U.pick([0.38, 0.4, 0.42]);
          const k1 = U.pick([3000, 4000, 5000]), k2 = U.pick([14000, 15000, 16000]);
          const pts = { A: [k1, a1 * Math.sqrt(k1)], B: [k2, a1 * Math.sqrt(k2)], C: [k2, a2 * Math.sqrt(k2)] };
          const [la, lb, lc] = U.sample(["D", "E", "F", "G", "H", "J"], 3);
          const lab = { A: la, B: lb, C: lc };
          const move = U.pick([["A", "B"], ["B", "C"], ["A", "C"]]);
          const yMax = 70;
          const g = G.plot({ xLabel: "Capital per hour worked, K/L ($)", yLabel: "Real GDP per hour, Q/L ($)", xMax: kMax, yMax, xTicks: [4000, 8000, 12000, 16000, 20000], yTicks: [10, 20, 30, 40, 50, 60, 70],
            curves: [{ pts: pwCurve(a1, kMax), style: "main", label: "PF₁", labelAt: 38 }, { pts: pwCurve(a2, kMax), style: "alt", label: "PF₂", labelAt: 35 }],
            points: ["A", "B", "C"].map(k => ({ x: pts[k][0], y: pts[k][1], label: lab[k] })), aria: "per-worker production functions" });
          const key = move.join("");
          const opts = {
            AB: "More capital per hour worked, with technology unchanged",
            BC: "Technological change, with capital per hour worked unchanged",
            AC: "Both more capital per hour worked and technological change",
          };
          const why = { AB: "That would be a move along one curve.", BC: "That would be a vertical jump at the same K/L.", AC: "That would need both a move to the right and a jump to the higher curve." };
          const wrong = Object.keys(opts).filter(k => k !== key).map(k => ({ t: opts[k], why: why[k] }));
          wrong.push({ t: "A fall in labor productivity", why: "Q/L rises in this move, so productivity went up." });
          return Q.mc({
            q: `The graph shows two per-worker production functions, PF₁ and PF₂.${g}What best explains a move from point ${lab[move[0]]} to point ${lab[move[1]]}?`,
            right: opts[key], wrong,
            sol: steps("Moving right along one curve = more K/L. Jumping from PF₁ to PF₂ = technological change.",
              key === "AB" ? `${lab.A} and ${lab.B} are both on PF₁; K/L rises. A movement along the curve.` : key === "BC" ? `${lab.B} and ${lab.C} have the same K/L, but ${lab.C} is on the higher curve. Technology improved.` : `${lab.C} is to the right of ${lab.A} <em>and</em> on the higher curve, so both happened.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Growth rates & the Rule of 70
   * ============================================================ */
  const genRule70 = STUDY.makeGenerator({
    id: "b251-m2-rule70",
    name: "Growth rates & the Rule of 70",
    blurb: "Use compounding and the Rule of 70 to find doubling times, future values and the effect of small growth-rate differences.",
    variants: [
      {
        name: "Years to double",
        make() {
          const g = U.pick([1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]);
          const what = U.pick(["real GDP per person", "a country's real GDP", "average income", "a city's output"]);
          const ans = 70 / g;
          return Q.num({
            q: `If ${what} grows at <b>${g}%</b> a year, about how many years will it take to double? (Use the Rule of 70.)`,
            answer: ans, unit: "years", tol: Math.max(0.35, ans * 0.012),
            traps: traps(ans, [
              { value: 100 / g, why: "That is 100 ÷ g, which ignores compounding (simple growth). The Rule of 70 accounts for it." },
              { value: 70 / (g / 100), why: "Enter the growth rate as a percent (e.g. 3), not a decimal (0.03)." },
              { value: 70 * g, why: "Divide 70 by the growth rate; do not multiply." },
            ]),
            sol: steps("Rule of 70: years to double ≈ 70 ÷ (growth rate in percent).",
              `70 ÷ ${g} ≈ <b>${U.fmt(U.round(ans, 1))} years</b>.`),
          });
        },
      },
      {
        name: "Growth rate needed to double",
        make() {
          const N = U.pick([7, 10, 14, 20, 25, 28, 35, 40, 50]);
          const ans = 70 / N;
          return Q.num({
            q: `A government wants real GDP per person to double in <b>${N} years</b>. Roughly what annual growth rate does it need? (Use the Rule of 70; answer in percent.)`,
            answer: ans, unit: "%", tol: Math.max(0.05, ans * 0.012),
            traps: traps(ans, [
              { value: 100 / N, why: "That is 100 ÷ N, which ignores compounding." },
              { value: N / 70, why: "Flip it: growth rate ≈ 70 ÷ years." },
            ]),
            sol: steps("Rearrange the Rule of 70: growth rate (%) ≈ 70 ÷ years to double.",
              `70 ÷ ${N} ≈ <b>${U.fmt(U.round(ans, 2))}%</b> a year.`),
          });
        },
      },
      {
        name: "Compound growth over N years",
        make() {
          const ctx = U.pick([
            { what: "Real GDP per person", old: U.randInt(10, 60) * 1000 },
            { what: "A savings deposit", old: U.randInt(2, 20) * 500 },
            { what: "Average household income", old: U.randInt(30, 80) * 1000 },
          ]);
          const g = U.pick([1, 2, 2.5, 3, 4, 5, 6, 7]);
          const N = U.pick([5, 10, 15, 20, 25, 30]);
          const ans = U.round(ctx.old * Math.pow(1 + g / 100, N), 2);
          const simple = ctx.old * (1 + (g / 100) * N);
          return Q.num({
            q: `${ctx.what} is ${U.money(ctx.old)} today and grows at <b>${g}%</b> a year. What will it be after <b>${N} years</b>? (Compound the growth; round to the nearest dollar.)`,
            answer: ans, unit: "$", tol: ans * 0.005,
            traps: traps(ans, [
              { value: simple, why: `That is simple growth (${g}% × ${N} added once). Growth compounds: use (1 + g)<sup>N</sup>.` },
              { value: ans - ctx.old, why: "That is only the increase. Add the starting value." },
              { value: ctx.old * (1 + g / 100), why: "That is just one year of growth." },
            ]),
            sol: steps("New = Old × (1 + g)<sup>N</sup>, with g as a decimal.",
              `${U.money(ctx.old)} × (1 + ${U.fmt(g / 100)})<sup>${N}</sup> = ${U.money(ctx.old)} × ${U.fmt(U.round(Math.pow(1 + g / 100, N), 4))}`,
              `≈ <b>${U.money(Math.round(ans))}</b>. (Simple growth would give only ${U.money(Math.round(simple))}; the difference is compounding.)`),
          });
        },
      },
      {
        name: "Two economies, two growth rates",
        make() {
          const [c1, c2] = U.sample(COUNTRIES, 2);
          const gB = U.pick([0.5, 1, 1.5, 2]);
          const gA = gB + U.pick([1, 1.5, 2, 3]);
          const N = U.pick([20, 25, 30, 40, 50]);
          const ans = U.round(Math.pow((1 + gA / 100) / (1 + gB / 100), N), 4);
          return Q.num({
            q: `${c1} and ${c2} start with the same real GDP per person. ${c1} grows <b>${gA}%</b> a year and ${c2} grows <b>${gB}%</b> a year. After <b>${N} years</b>, how many times larger is ${c1}'s GDP per person than ${c2}'s? (Two decimals.)`,
            answer: ans, tol: Math.max(0.02, ans * 0.01),
            traps: traps(ans, [
              { value: 1 + ((gA - gB) / 100) * N, why: "That adds the gap once a year without compounding." },
              { value: gA / gB, why: "That is the ratio of the growth rates, not of the GDP levels." },
            ]),
            sol: steps("Each economy grows by (1 + g)<sup>N</sup>. The ratio of the two levels is the ratio of those factors.",
              `${c1}: (1 + ${U.fmt(gA / 100)})<sup>${N}</sup> ≈ ${U.fmt(U.round(Math.pow(1 + gA / 100, N), 3))}. ${c2}: (1 + ${U.fmt(gB / 100)})<sup>${N}</sup> ≈ ${U.fmt(U.round(Math.pow(1 + gB / 100, N), 3))}.`,
              `Ratio ≈ <b>${U.fmt(U.round(ans, 2))}</b>. A gap of ${gA - gB} percentage ${gA - gB === 1 ? "point" : "points"} compounds into a big difference.`),
          });
        },
      },
      {
        name: "Count the doublings",
        make() {
          const g = U.pick([2, 2.5, 3.5, 5, 7]);
          const D = 70 / g;
          const ns = [2, 3, 4].filter(n => n * D <= 105);
          const n = U.pick(ns);
          const T = n * D;
          const ans = Math.pow(2, n);
          return Q.num({
            q: `Output per person grows at <b>${g}%</b> a year. Using the Rule of 70, by roughly what <b>factor</b> will it have multiplied after <b>${T} years</b>? (E.g. answer 2 for “doubled”.)`,
            answer: ans, unit: "times",
            traps: traps(ans, [
              { value: n, why: "That is the number of doublings. Each doubling multiplies by 2, so the factor is 2 raised to that number." },
              { value: 2 * n, why: `Doubling ${n} times multiplies by 2<sup>${n}</sup>, not 2 × ${n}.` },
              { value: 1 + (g * T) / 100, why: "That is simple growth, which ignores compounding." },
            ]),
            sol: steps("Find the doubling time, then count how many doublings fit in the period.",
              `Doubling time ≈ 70 ÷ ${g} = ${D} years, so ${T} years is ${T} ÷ ${D} = ${n} doublings.`,
              `Factor = 2<sup>${n}</sup> = <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Project an income with the Rule of 70",
        make() {
          const g = U.pick([2, 2.5, 3.5, 5, 7]);
          const D = 70 / g;
          const n = U.pick([1, 2, 3].filter(k => k * D <= 90));
          const T = n * D;
          const I = U.randInt(8, 40) * 1000;
          const ans = I * Math.pow(2, n);
          return Q.num({
            q: `Average income in a region is ${U.money(I)} and grows <b>${g}%</b> a year. Using the Rule of 70, roughly what will it be in <b>${T} years</b>?`,
            answer: ans, unit: "$", tol: ans * 0.005,
            traps: traps(ans, [
              { value: I * (1 + (g * T) / 100), why: "That is simple growth. Compounding makes income double every 70 ÷ g years." },
              { value: I * 2 * n, why: `Doubling ${n} times multiplies by 2<sup>${n}</sup>, not 2 × ${n}.` },
              { value: I * 2, why: "That is just one doubling. Count how many doublings fit in the period." },
            ]),
            sol: steps("Use the Rule of 70 to find the doubling time, then double once per doubling time.",
              `70 ÷ ${g} = ${D} years per doubling; ${T} ÷ ${D} = ${n} doubling${n === 1 ? "" : "s"}.`,
              `${U.money(I)} × 2<sup>${n}</sup> = <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Gap in doubling times",
        make() {
          const rates = [1, 2, 2.5, 3.5, 5, 7];
          const [g1, g2] = U.sample(rates, 2).sort((a, b) => a - b);
          const ans = 70 / g1 - 70 / g2;
          return Q.num({
            q: `Country S grows at <b>${g1}%</b> a year and country F at <b>${g2}%</b>. Using the Rule of 70, how many <b>more years</b> does S need to double its real GDP per person than F does?`,
            answer: ans, unit: "years", tol: 0.3,
            traps: traps(ans, [
              { value: 70 / (g2 - g1), why: "Find each doubling time first, then subtract. Do not subtract the growth rates first." },
              { value: 70 / g1, why: "That is S's doubling time alone. Subtract F's." },
            ]),
            sol: steps("Compute each doubling time with the Rule of 70, then compare.",
              `S: 70 ÷ ${g1} = ${U.fmt(U.round(70 / g1, 1))} years. F: 70 ÷ ${g2} = ${U.fmt(U.round(70 / g2, 1))} years.`,
              `Difference ≈ <b>${U.fmt(U.round(ans, 1))} years</b>.`),
          });
        },
      },
      {
        name: "Why small differences matter",
        make() {
          const a = U.pick([1, 1.5, 2]), b = a + 1;
          return Q.mc({
            q: `Economists argue that the difference between ${a}% and ${b}% annual growth is a big deal. Why?`,
            right: "Because growth compounds, a small yearly gap grows into a large gap in living standards over decades",
            wrong: [
              { t: "It is not a big deal: one percentage point is too small to matter", why: `Over 50 years, ${b}% growth leaves an economy roughly ${U.fmt(U.round(Math.pow((1 + b / 100) / (1 + a / 100), 50), 1))} times as rich as ${a}% growth.` },
              { t: "Because the gap adds exactly one extra percent to income over the whole period", why: "The gap applies every year, to a growing base, so its effect compounds." },
              { t: "Because higher growth rates make the Rule of 70 stop working", why: "The Rule of 70 works fine for typical growth rates." },
            ],
            sol: steps("Think about what happens to each year's growth: does it apply to the original value or to the new, higher value?",
              `Growth builds on a higher base every year. At ${a}%, income doubles in about ${U.fmt(U.round(70 / a, 1))} years; at ${b}%, in about ${U.fmt(U.round(70 / b, 1))} years. Over a lifetime that adds up to a big difference.`),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m2", order: 2,
    title: "Module 2 · The Basic Economic Model: PPC",
    short: "M2 · PPC",
    description: "Factors of production, the PPC and opportunity cost, marginal cost and benefit, efficiency, comparative advantage and trade, and economic growth.",
    notes, flashcards, cues,
    generators: [genFactors, genPPC, genIncr, genAlloc, genCompAdv, genTrade, genGrowth, genRule70],
  });
})();
