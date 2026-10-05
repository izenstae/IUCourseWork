/* ============================================================
 * ECON B251 · Module 7 — Markets: Other Market Failures
 * The four types of market failure, negative externalities (private,
 * external and social cost; Pigovian taxes, emission charges and
 * marketable permits), property rights and the Coase theorem, positive
 * externalities (private, external and social benefit; public provision,
 * subsidies, vouchers, patents), the four types of goods, public goods
 * and free riders, and common resources and the tragedy of the commons.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.map(step).join("");
  const $ = x => U.money(x);
  const an = w => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
  const qty = (n, sc) => `${U.fmt(n)} ${n === 1 ? sc.u : sc.us}`;
  /* "120 − 2Q", "35 + Q" */
  const down = (a, b) => `${a} − ${b === 1 ? "" : b}<em>Q</em>`;
  const up = (c, d) => `${c} + ${d === 1 ? "" : d}<em>Q</em>`;
  const PEOPLE = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix"];

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
  /* Build a classify item list: one from each category, then fill to n from the bank. */
  function dealItems(key, bank, cats, n) {
    const items = cats.map(c => U.pick(bank.filter(i => i.cat === c)));
    for (const extra of U.deal(key, bank, n + 4)) if (items.length < n && !items.includes(extra)) items.push(extra);
    return items;
  }
  /* A select-all from a true/false bank, with at least one true and one false option. */
  function selectAll(bank, k) {
    let opts = U.sample(bank, k);
    if (!opts.some(o => o.ok)) opts[0] = U.pick(bank.filter(o => o.ok && !opts.includes(o)));
    if (opts.every(o => o.ok) && Math.random() < 0.7) {
      const f = U.pick(bank.filter(o => !o.ok && !opts.includes(o)));
      opts[opts.length - 1] = f;
    }
    return opts.map(o => ({ t: o.t, ok: o.ok, why: o.why || (o.ok ? "True." : "False.") }));
  }

  /* ---------- linear market models ----------
   * Demand / private marginal benefit:  MB = a − bQ
   * Supply / private marginal cost:     MC = c + dQ
   * A constant marginal external cost (or benefit) of e per unit.
   * Numbers are drawn so that both quantities are whole and e = (b + d)·k,
   * which makes the gap between the two quantities exactly k units. */
  function negModel(opt) {
    const o = opt || {};
    const b = U.randInt(1, 3), d = U.randInt(1, 3), s = b + d;
    const k = U.randInt(o.kMin || 2, o.kMax || 8), e = s * k;
    const Qe = U.randInt(10, 36), Qm = Qe + k;
    const c = U.randInt(4, 30);
    const a = c + s * Qm;
    return { b, d, s, k, e, Qe, Qm, c, a, Pm: c + d * Qm, Pe: a - b * Qe, Ps: c + d * Qe, mscM: c + d * Qm + e, dwl: e * k / 2 };
  }
  function posModel(opt) {
    const o = opt || {};
    for (let g = 0; g < 200; g++) {
      const b = U.randInt(1, 3), d = U.randInt(1, 3), s = b + d;
      const k = U.randInt(o.kMin || 2, o.kMax || 8), e = s * k;
      const Qm = U.randInt(10, 36), Qe = Qm + k;
      const c = U.randInt(4, 30);
      const a = c + s * Qm;
      const MBe = a - b * Qe, MCe = c + d * Qe, Pm = c + d * Qm;
      if (MBe < 5) continue;
      return { b, d, s, k, e, Qe, Qm, c, a, Pm, MBe, MCe, msbM: Pm + e, dwl: e * k / 2 };
    }
    return posModel(opt);
  }
  /* A straight line y = y0 + slope·x, clipped to the plot, as three points
   * (start, a point at `frac` of the way along for the label, end). */
  function seg(y0, slope, xMax, yMax, frac) {
    let x1 = xMax, y1 = y0 + slope * x1;
    if (y1 < 0) { x1 = -y0 / slope; y1 = 0; }
    if (y1 > yMax) { x1 = (yMax - y0) / slope; y1 = yMax; }
    const xf = x1 * (frac == null ? 0.85 : frac);
    return [[0, y0], [xf, y0 + slope * xf], [x1, y1]];
  }
  function negGraph(m, o) {
    o = o || {};
    const xMax = Math.ceil(m.Qm * 1.45 / 10) * 10;
    const yMax = Math.ceil(m.a * 1.05 / 10) * 10;
    const tri = [[m.Qe, m.Pe], [m.Qm, m.mscM], [m.Qm, m.Pm], [m.Qe, m.Pe]];
    const curves = [
      { pts: seg(m.a, -m.b, xMax, yMax, 0.08), style: "main", label: "D = MSB", labelAt: 1 },
      { pts: seg(m.c, m.d, xMax, yMax), style: "alt", label: "S = MC", labelAt: 1 },
      { pts: seg(m.c + m.e, m.d, xMax, yMax, 0.72), style: "dash", label: "MSC", labelAt: 1 },
    ];
    if (o.dwl) curves.push({ pts: tri, style: "faint" }, { pts: [[m.Qm + xMax * 0.01, (m.mscM + m.Pm) / 2 + yMax * 0.02]], style: "faint", label: o.dwlLabel || "← DWL", labelAt: 0 });
    return G.plot({
      xLabel: o.xLabel || "Quantity", yLabel: o.yLabel || "Price and cost ($)",
      xMax, yMax, xTicks: o.xTicks || ticks(xMax), yTicks: o.yTicks || ticks(yMax),
      curves, points: o.points || [], aria: o.aria || "negative externality graph",
    });
  }
  function posGraph(m, o) {
    o = o || {};
    const xMax = Math.ceil(m.Qe * 1.45 / 10) * 10;
    const yMax = Math.ceil((m.a + m.e) * 1.05 / 10) * 10;
    const tri = [[m.Qm, m.Pm], [m.Qm, m.msbM], [m.Qe, m.MCe], [m.Qm, m.Pm]];
    const curves = [
      { pts: seg(m.a, -m.b, xMax, yMax, 0.06), style: "main", label: "D = MB", labelAt: 1 },
      { pts: seg(m.a + m.e, -m.b, xMax, yMax, 0.3), style: "dash", label: "MSB", labelAt: 1 },
      { pts: seg(m.c, m.d, xMax, yMax), style: "alt", label: "S = MSC", labelAt: 1 },
    ];
    if (o.dwl) curves.push({ pts: tri, style: "faint" }, { pts: [[m.Qm - xMax * 0.02, (m.Pm + m.msbM) / 2 + yMax * 0.04]], style: "faint", label: "DWL", labelAt: 0 });
    return G.plot({
      xLabel: o.xLabel || "Quantity", yLabel: o.yLabel || "Price, benefit and cost ($)",
      xMax, yMax, xTicks: o.xTicks || ticks(xMax), yTicks: o.yTicks || ticks(yMax),
      curves, points: o.points || [], aria: o.aria || "positive externality graph",
    });
  }

  /* ---------- scenario banks ---------- */
  const NEG = [
    { firm: "a cement plant", of: "ton of cement", good: "cement", u: "ton", us: "tons", per: "day", harm: "dust that raises cleaning and medical bills", third: "families living downwind" },
    { firm: "a paper mill", of: "ton of paper", good: "paper", u: "ton", us: "tons", per: "week", harm: "chemical runoff that kills fish downstream", third: "downstream fishing businesses" },
    { firm: "a coal-fired power plant", of: "megawatt-hour of electricity", good: "electricity", u: "megawatt-hour", us: "megawatt-hours", per: "hour", harm: "soot that worsens asthma", third: "residents of the surrounding county" },
    { firm: "a textile dye works", of: "bolt of dyed fabric", good: "dyed fabric", u: "bolt", us: "bolts", per: "day", harm: "dye in the river that ruins irrigation water", third: "farmers downstream" },
    { firm: "a crop-dusting service", of: "acre sprayed", good: "crop spraying", u: "acre sprayed", us: "acres sprayed", per: "week", harm: "pesticide drift that kills honeybees", third: "local beekeepers" },
    { firm: "a gravel quarry", of: "truckload of gravel", good: "gravel", u: "truckload", us: "truckloads", per: "week", harm: "blasting noise and dust", third: "homeowners next to the quarry" },
    { firm: "an industrial hog farm", of: "hog", good: "hogs", u: "hog", us: "hogs", per: "month", harm: "odor and manure runoff", third: "neighbors and a nearby campground" },
    { firm: "a battery recycler", of: "ton of recycled lead", good: "recycled lead", u: "ton", us: "tons", per: "week", harm: "lead dust in nearby yards", third: "families in the surrounding neighborhood" },
  ];
  const POS = [
    { what: "flu shots", u: "shot", us: "shots", per: "week", spill: "each shot also lowers the chance that classmates, coworkers and family members catch the flu" },
    { what: "after-school coding classes", u: "class seat", us: "class seats", per: "term", spill: "a more skilled local workforce helps employers and raises the town's tax base" },
    { what: "backyard beehives", u: "hive", us: "hives", per: "season", spill: "the bees pollinate neighbors' gardens and orchards for free" },
    { what: "restored historic storefronts", u: "storefront", us: "storefronts", per: "year", spill: "a nicer street brings foot traffic to every nearby shop" },
    { what: "street trees planted on private lots", u: "tree", us: "trees", per: "year", spill: "the shade and cleaner air benefit everyone on the street" },
    { what: "adult literacy tutoring sessions", u: "session", us: "sessions", per: "month", spill: "more literate adults help their children in school and need less public assistance" },
    { what: "measles vaccinations", u: "vaccination", us: "vaccinations", per: "month", spill: "each vaccinated child protects infants and others who cannot be vaccinated" },
    { what: "community-college courses", u: "course enrollment", us: "course enrollments", per: "semester", spill: "better-trained graduates raise productivity for employers and coworkers" },
  ];
  const COMMONS = [
    { res: "a lake's perch fishery", act: "fishing", u: "ton of perch", us: "tons of perch", per: "season", users: "boats", dep: "smaller catches for everyone in future seasons" },
    { res: "an offshore cod fishery", act: "fishing", u: "ton of cod", us: "tons of cod", per: "year", users: "trawlers", dep: "a shrinking breeding stock" },
    { res: "a shared groundwater aquifer", act: "pumping", u: "acre-foot of water", us: "acre-feet of water", per: "year", users: "farms", dep: "a falling water table that raises every farm's pumping cost" },
    { res: "an open public grazing range", act: "grazing", u: "animal-month of grazing", us: "animal-months of grazing", per: "year", users: "ranchers", dep: "thinner grass for every herd next year" },
    { res: "a coastal lobster ground", act: "trapping", u: "hundred pounds of lobster", us: "hundred pounds of lobster", per: "season", users: "lobster boats", dep: "fewer breeding lobsters next season" },
  ];

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const NOTE_NEG = { b: 2, d: 2, s: 4, k: 10, e: 40, Qe: 15, Qm: 25, c: 20, a: 120, Pm: 70, Pe: 90, Ps: 50, mscM: 110, dwl: 200 };
  const NOTE_POS = { b: 1, d: 1, s: 2, k: 10, e: 20, Qm: 20, Qe: 30, c: 10, a: 50, Pm: 30, MBe: 20, MCe: 40, msbM: 50, dwl: 100 };
  const pubLines = { A: [40, 8], B: [35, 7], C: [25, 5] };
  const notes = [
    {
      title: "Market failure and its four types",
      lo: "Define and identify the four types of market failures.",
      html: `<p>When buyers and sellers in a competitive market face all of the costs and benefits of what they do, the price system steers resources to their most valued uses: output settles where marginal benefit equals marginal cost. A <b>market failure</b> is a situation in which an unrestrained market instead puts <b>too many or too few resources</b> into some activity, so the outcome is not efficient (or, in the case of equity, not acceptable to society). Market failures are the main reason people call on government to step in.</p>
<p>This course groups market failures into four types:</p>
<table class="data-tbl"><thead><tr><th>Type</th><th>What goes wrong</th><th>Typical policy response</th></tr></thead><tbody>
<tr><td><b>Equity</b></td><td>The market outcome may be efficient, yet society judges the resulting distribution of income unfair, e.g. full-time workers who cannot afford basic housing.</td><td>Minimum wages, transfer programs, progressive taxes</td></tr>
<tr><td><b>Externalities</b></td><td>Some costs or benefits spill over onto <b>third parties</b> who are not part of the transaction, so buyers and sellers ignore them.</td><td>Taxes, emission charges, permits, subsidies, property rights</td></tr>
<tr><td><b>Public goods</b></td><td>Goods that nobody can be kept from enjoying and that one person's use does not use up, so few will pay voluntarily.</td><td>Government provision paid for with taxes</td></tr>
<tr><td><b>Market power</b></td><td>A single firm or a small group can restrict output and raise price above what competition would bring.</td><td>Antitrust laws, regulation</td></tr>
</tbody></table>
<div class="keyidea"><b>Key idea.</b> A market failure is not "prices went up." It is a situation where the market's own quantity differs from the quantity that is best for society as a whole (or where the outcome is judged unfair).</div>
<div class="example"><b>Example.</b> In one town, (1) a glass factory's smoke dirties the laundry of nearby homes (externality), (2) nobody pays voluntarily for the tornado siren that warns everyone (public good), (3) the only internet provider charges far above its cost because no rival can enter (market power), and (4) the lowest-paid grocery workers cannot afford a room in town even working full time (equity). Four different failures, four different remedies.</div>
<div class="trap"><b>Common trap.</b> A higher price caused by ordinary supply and demand, such as a frost that destroys part of the orange crop, is <em>not</em> a market failure. The market is doing its job: signalling scarcity and rationing the smaller crop.</div>`,
      gens: ["b251-m7-failure"],
    },
    {
      title: "Negative externalities: private, external and social cost",
      lo: "Explain and illustrate how negative externalities result in inefficiency, differentiate between social and private costs, and examine possible government solutions.",
      html: `<p>An <b>externality</b> is a consequence of an economic activity that spills over onto <b>third parties</b>, people not directly involved in the transaction. A <b>negative externality</b> imposes a cost on them; pollution is the classic case.</p>
<ul>
  <li>A <b>private cost</b> is borne by the producer itself. Its <b>marginal (private) cost, MC</b>, is the cost to the producer of one more unit. The supply curve is the MC curve.</li>
  <li>An <b>external cost</b> falls on others. The <b>marginal external cost</b> is the cost one more unit imposes on people other than the producer.</li>
  <li>The <b>marginal social cost</b> is the whole cost to society of one more unit: <b>MSC = MC + marginal external cost</b>.</li>
</ul>
<p>The producer decides how much to make by looking only at MC, so the market settles where demand (marginal social benefit, MSB) crosses MC. Society's efficient quantity is where <b>MSB = MSC</b>, which is smaller. For every unit between the two quantities, MSC is greater than MSB: the unit costs society more than it is worth. The market <b>overproduces</b>, and the lost value is a <b>deadweight loss</b>.</p>
${negGraph(NOTE_NEG, { xLabel: "Cement (tons per day)", yLabel: "$ per ton", xTicks: [10, 15, 25, 30, 40], yTicks: [20, 50, 70, 90, 110], dwl: true,
    points: [{ x: 25, y: 70, label: "market" }, { x: 15, y: 90, label: "efficient" }], aria: "Cement market with MC, MSC and demand; deadweight loss triangle" })}
<div class="example"><b>Example.</b> A cement plant faces demand MB = 120 − 2<em>Q</em> and has MC = 20 + 2<em>Q</em> (dollars per ton, <em>Q</em> in tons per day). Each ton also causes $40 of dust damage to nearby homes, so MSC = 60 + 2<em>Q</em>.<br>
• <b>Market:</b> 120 − 2<em>Q</em> = 20 + 2<em>Q</em> gives <em>Q</em> = 25 tons at $70.<br>
• <b>Efficient:</b> 120 − 2<em>Q</em> = 60 + 2<em>Q</em> gives <em>Q</em> = 15 tons; buyers would pay $90.<br>
• At the market quantity, MSC = 70 + 40 = $110 but MSB is only $70.<br>
• <b>Deadweight loss</b> = ½ × (25 − 15) × 40 = <b>$200 per day</b>: the triangle between MSC and MSB from 15 to 25 tons.</div>
<div class="keyidea"><b>Key idea.</b> With an external cost, the market ignores part of the cost, so it produces <b>too much</b> at <b>too low</b> a price. Efficiency needs MSB = MSC, not MB = MC.</div>
<div class="trap"><b>Common trap.</b> Do not set demand equal to MSC to find the <em>market</em> quantity. The market uses private cost only (supply = MC). And remember the ½ in the deadweight-loss triangle.</div>`,
      gens: ["b251-m7-negext", "b251-m7-extpolicy"],
    },
    {
      title: "Government responses to external costs",
      lo: "Examine Pigovian taxes, emission charges and marketable permits as remedies for negative externalities.",
      html: `<p>The aim of every remedy is the same: make the decision-maker <b>feel the external cost</b>, so that the market lands on the efficient quantity where MSB = MSC.</p>
<ul>
  <li><b>Pigovian tax</b> (after the economist A. C. Pigou): a tax on each unit of output equal to the marginal external cost. Then <b>MC + tax = MSC</b>, the supply curve shifts up to MSC, and the market produces the efficient quantity. The tax equals the vertical gap between the price buyers pay and the price sellers keep.</li>
  <li><b>Emission charge</b>: a price on each unit of <em>pollution</em> released (per ton of sulfur dioxide, per gallon of wastewater). The more a firm pollutes, the more it pays, so it cuts emissions whenever cutting a unit is cheaper than the charge.</li>
  <li><b>Marketable permits (cap and trade)</b>: the government caps total pollution and hands out (or auctions) permits that firms may buy and sell. Firms that can clean up cheaply cut back and sell spare permits; firms with costly cleanup buy them. The permit's market price confronts every polluter with the social cost of one more unit of pollution, and the cleanup is done by whoever can do it most cheaply.</li>
  <li><b>Property rights</b>: assign someone clear ownership of the polluted resource, which sets up the private bargaining described by the Coase theorem (next lesson).</li>
</ul>
<div class="example"><b>Example.</b> In the cement market above, a tax of <b>$40 per ton</b> (the marginal external cost) shifts supply to MC + 40 = MSC. Output falls from 25 to 15 tons. Buyers now pay $90 (up only $20 from $70) and the plant keeps 90 − 40 = $50, so the tax = 90 − 50 = $40. The deadweight loss is gone.<br><br>
<b>Permits.</b> Two smelters must together cut 100 tons of emissions. Cutting a ton costs Smelter North $30 and Smelter South $70. If each is told to cut 50 tons, the total bill is 50 × 30 + 50 × 70 = $5,000. With tradable permits, South buys 50 permits from North at, say, $50 each; North then cuts all 100 tons for $3,000. The same 100 tons are cut for $2,000 less, and both firms come out ahead.</div>
<div class="keyidea"><b>Key idea.</b> Set the tax (or charge) equal to the marginal external cost. A tax that is too small leaves some overproduction; one that is too large causes underproduction.</div>
<div class="trap"><b>Common trap.</b> The Pigovian tax is <em>not</em> the rise in the price buyers pay. Part of the tax shows up as a higher buyer price and part as a lower price kept by sellers; the tax is the whole gap between the two.</div>`,
      gens: ["b251-m7-extpolicy"],
    },
    {
      title: "Property rights and the Coase theorem",
      lo: "Explain how the Coase theorem can solve the problem of externalities.",
      html: `<p><b>Property rights</b> are legally established, court-enforceable titles to own, use and dispose of resources, goods and services. Many externalities exist because nobody owns the thing being harmed: no one holds title to a river or the air over a town, so no one can demand payment for fouling it.</p>
<p>The <b>Coase theorem</b> (Ronald Coase) says that if property rights exist, <b>only a small number of parties</b> are involved, and <b>transaction costs are low</b>, then private bargaining reaches the <b>efficient outcome</b>, and that outcome is the <b>same no matter who holds the right</b>. Each side takes the other's costs into account because the other side can pay, or demand payment.</p>
<p><b>Transaction costs</b> are the costs of making a deal: finding the other parties, negotiating, writing and enforcing the agreement (think of the agent, lender and lawyer fees on a house purchase). When an externality affects thousands of people, these costs are high and free riding sets in, so the Coase solution breaks down and government action (taxes, charges, permits) is needed instead.</p>
<div class="example"><b>Example.</b> A bakery's 4 a.m. exhaust fans keep guests awake at the bed-and-breakfast next door, costing the B&amp;B <b>$4,000</b> a year in refunds. Quieter fans would cost the bakery <b>$2,500</b> a year.<br>
• <b>B&amp;B has the right to quiet:</b> the bakery must either buy quiet fans ($2,500) or pay the B&amp;B at least $4,000 to put up with the noise. It buys the fans.<br>
• <b>Bakery has the right to make noise:</b> the B&amp;B would pay up to $4,000 to end the noise, and the bakery accepts anything above $2,500. They strike a deal in between, and the fans are installed.<br>
Either way the quiet fans go in, because they cost less than the harm. Only <em>who pays</em> changes. If the fans instead cost $6,000, the efficient outcome is to keep the noise: with the right to quiet, the bakery pays the B&amp;B between $4,000 and $6,000 to accept it.</div>
<div class="keyidea"><b>Key idea.</b> The assignment of rights decides <b>who pays whom</b> (the distribution), not <b>what happens</b> (the efficient outcome), as long as bargaining is cheap and involves few parties.</div>
<div class="trap"><b>Common trap.</b> Coase does not say the polluter always stops, or that the victim always wins. If cleanup costs more than the harm, the efficient outcome is to keep polluting, with the victim compensated if the victim holds the right.</div>`,
      gens: ["b251-m7-coase"],
    },
    {
      title: "Positive externalities: private, external and social benefit",
      lo: "Explain and illustrate how positive externalities result in inefficiency, differentiate between social and private benefits, and examine possible government solutions.",
      html: `<p>A <b>positive externality</b> creates a benefit for third parties. Knowledge is the big example: education and research help not only the student or the inventor but also coworkers, employers and future innovators. Vaccinations protect people who did not get the shot.</p>
<ul>
  <li>A <b>private benefit</b> goes to the consumer. The <b>marginal (private) benefit, MB</b>, is the benefit to the consumer of one more unit, and the demand curve is the MB curve.</li>
  <li>An <b>external benefit</b> goes to someone other than the consumer; the <b>marginal external benefit</b> is that spillover from one more unit.</li>
  <li><b>Marginal social benefit: MSB = MB + marginal external benefit.</b></li>
</ul>
<p>Buyers compare only their own MB with the price, so the market settles where MB = MC (= MSC when there are no external costs). The efficient quantity, where <b>MSB = MSC</b>, is larger. On every unit in between, MSB exceeds MSC, so the market <b>underproduces</b> and there is a deadweight loss.</p>
${posGraph(NOTE_POS, { xLabel: "Flu shots (per day)", yLabel: "$ per shot", xTicks: [10, 20, 30, 40], yTicks: [10, 20, 30, 40, 50, 60, 70], dwl: true,
    points: [{ x: 20, y: 30, label: "market" }, { x: 30, y: 40, label: "efficient" }], aria: "Flu shots with MB, MSB and MSC; underproduction and deadweight loss" })}
<p><b>Government tools for external benefits:</b></p>
<ul>
  <li><b>Public provision</b>: a public authority, paid by the government, produces the good (public schools, a county health clinic).</li>
  <li><b>Private subsidies</b>: payments from the government to <em>private producers</em> for each unit they supply.</li>
  <li><b>Vouchers</b>: tokens given to <em>households</em> that can be spent only on a specified good, such as preschool or job training.</li>
  <li><b>Patents and copyrights</b>: temporary exclusive rights that let inventors and authors capture more of the benefit of new knowledge, so they create more of it.</li>
</ul>
<div class="example"><b>Example.</b> At a town's pharmacies (<em>Q</em> = flu shots per day), MB = 50 − <em>Q</em> and MC = 10 + <em>Q</em>. Each shot gives others $20 of protection, so MSB = 70 − <em>Q</em>.<br>
• <b>Market:</b> 50 − <em>Q</em> = 10 + <em>Q</em> gives <em>Q</em> = 20 at $30.<br>
• <b>Efficient:</b> 70 − <em>Q</em> = 10 + <em>Q</em> gives <em>Q</em> = 30; the 30th unit costs $40 to provide.<br>
• A <b>$20 subsidy</b> (or voucher) per shot does it: clinics receive $40 while patients pay only $20, and 40 − 20 = $20.<br>
• Deadweight loss without it: ½ × (30 − 20) × 20 = <b>$100</b> per day.</div>
<div class="keyidea"><b>Key idea.</b> External benefit → market quantity too <b>small</b>. The efficient subsidy equals the marginal external benefit.</div>
<div class="trap"><b>Common trap.</b> Subsidies go to <em>producers</em>; vouchers go to <em>households</em>. Both raise the quantity toward the efficient level, but they are different tools.</div>`,
      gens: ["b251-m7-posext"],
    },
    {
      title: "The four types of goods",
      lo: "Distinguish among private goods, public goods, common resources and natural monopoly goods.",
      html: `<p>Two questions sort every good:</p>
<ul>
  <li><b>Rival?</b> A good is <b>rival</b> if one person's use reduces the amount available to others (a sandwich, a parking space). It is <b>nonrival</b> if one more user takes nothing away from anyone else (a radio broadcast, an online lecture video).</li>
  <li><b>Excludable?</b> A good is <b>excludable</b> if non-payers can be kept from using it (a ticketed concert). It is <b>nonexcludable</b> if everyone benefits whether or not they pay (a flood levee that protects the whole town).</li>
</ul>
<table class="data-tbl"><thead><tr><th></th><th>Excludable</th><th>Nonexcludable</th></tr></thead><tbody>
<tr><th>Rival</th><td><b>Private goods</b><br>a burrito, running shoes, a hotel room</td><td><b>Common resources</b><br>ocean fish, groundwater, a free but crowded road</td></tr>
<tr><th>Nonrival</th><td><b>Natural monopoly goods</b> (club goods)<br>a streaming subscription, cable TV, an uncrowded toll bridge</td><td><b>Public goods</b><br>a tornado siren, mosquito spraying, a fireworks show over a city</td></tr>
</tbody></table>
<div class="example"><b>Example.</b> The same road can be any of the four. A free highway with little traffic is nonrival and nonexcludable: a <b>public good</b>. Make it crowded and every extra car slows the others, so it becomes rival: a <b>common resource</b>. Put a toll gate on the empty version and it is excludable but still nonrival: a <b>natural monopoly good</b>. A tolled road jammed at rush hour is rival and excludable: a <b>private good</b>.</div>
<div class="keyidea"><b>Key idea.</b> Classify by the two properties, not by who provides the good. Only private goods are both rival and excludable, which is why ordinary markets handle them well.</div>
<div class="trap"><b>Common trap.</b> "Public good" does not mean "provided by the government." A city-run swimming pool with an entry fee is excludable (and rival once it is crowded); a lighthouse beam is a public good even if a private company runs it.</div>`,
      gens: ["b251-m7-goods"],
    },
    {
      title: "Public goods and the free-rider problem",
      lo: "Explain why the free rider problem occurs in public goods and how output is determined.",
      html: `<p>A <b>public good</b> is nonrival and nonexcludable. Such goods tend to be <b>indivisible</b>, extra people can use them at <b>no extra cost</b>, an extra user does not deprive anyone else, and it is hard to charge people according to how much they use (the <b>exclusion principle</b> fails).</p>
<p>That last feature causes the <b>free-rider problem</b>: people can enjoy the good while letting others pay for it. If a private firm tried to sell mosquito spraying for a whole county, most residents would wait for their neighbors to pay, since they would be protected anyway. Too little is produced, often none.</p>
<p><b>How much should be provided?</b> The value of one more unit of a private good is what <em>one</em> buyer will pay for it, because only that buyer gets it. The value of one more unit of a public good is what <em>everyone together</em> will pay, because everyone gets it at once. So:</p>
<ul>
  <li><b>MSB of a public good = the vertical sum of individual MBs</b>: add everyone's marginal benefit <em>at the same quantity</em>.</li>
  <li>(For private goods we add demand curves <em>horizontally</em>, adding quantities at the same price.)</li>
  <li>The efficient quantity is where <b>MSB = MSC</b>; it maximizes net benefit.</li>
</ul>
${G.plot({ xLabel: "Streetlights on the block", yLabel: "Marginal benefit and cost ($ per year)", xMax: 5.5, yMax: 110, xTicks: [1, 2, 3, 4, 5], yTicks: [20, 40, 60, 80, 100],
    curves: [
      { pts: [[0, 40], [1, 32], [5, 0]], style: "faint", label: "Ana", labelAt: 1 },
      { pts: [[0, 35], [2, 21], [5, 0]], style: "faint", label: "Ben", labelAt: 1 },
      { pts: [[0, 25], [3.2, 9], [5, 0]], style: "faint", label: "Cruz", labelAt: 1 },
      { pts: [[0, 100], [0.5, 90], [5, 0]], style: "main", label: "MSB = sum of MBs", labelAt: 1 },
      { pts: [[0, 40], [4.4, 40], [5.5, 40]], style: "alt", label: "MSC", labelAt: 1 },
    ],
    points: [{ x: 3, y: 40, label: "efficient" }], aria: "Vertical sum of three marginal benefit lines for a public good" })}
<div class="example"><b>Example.</b> Three households on a block value streetlights. Ana's MB of the <em>q</em>-th light is 40 − 8<em>q</em>, Ben's is 35 − 7<em>q</em>, Cruz's is 25 − 5<em>q</em> dollars per year, and each light costs $40 a year (MSC). At 3 lights, MSB = 16 + 14 + 10 = $40 = MSC, so <b>3 lights</b> is efficient. (At 2 lights MSB = 24 + 21 + 15 = $60 &gt; $40: add more; at 4 lights MSB = $20 &lt; $40: too many.) Yet nobody would buy even one light alone: the most anyone values the first light at is Ana's $32, below its $40 cost. That gap is the free-rider problem in numbers.</div>
<p><b>Public provision</b> fixes it: the government can tax everyone who benefits, so nobody can ride free, and can provide the efficient quantity.</p>
<div class="keyidea"><b>Key idea.</b> Public good: <b>vertical</b> sum (add MBs at each quantity). Private good: <b>horizontal</b> sum (add quantities at each price).</div>
<div class="trap"><b>Common trap.</b> Do not judge a public good by the largest single MB, or by the average MB. Each unit serves everyone, so its social value is the <em>total</em> of everyone's MB for that unit.</div>`,
      gens: ["b251-m7-public"],
    },
    {
      title: "Common resources and the tragedy of the commons",
      lo: "Explain why the tragedy of the commons arises and how it may be solved.",
      html: `<p>A <b>common resource</b> is rival but nonexcludable: a unit can be used only once, but no one can be stopped from using what is there. Ocean fish are the standard case: a fish one boat lands is gone for everyone else, yet it is hard to keep boats off the open sea.</p>
<p>Many common resources are <b>renewable</b>: they replenish themselves through birth and growth. The <b>sustainable catch</b> is the amount that can be taken year after year without shrinking the stock. A small stock produces few new fish, so its sustainable catch is small; overfishing today shrinks the catch that can be sustained tomorrow.</p>
<p>The <b>tragedy of the commons</b> is the overuse and depletion of a commonly owned resource because nobody has an incentive to conserve it. Each user gets the full benefit of what they take but bears only a sliver of the cost of a smaller stock; the rest falls on everyone else. It is a negative externality between users: the market uses the resource up to where MB = private MC, beyond the efficient level where MSB = MSC.</p>
<p><b>Ways to reach an efficient outcome:</b></p>
<ul>
  <li><b>Property rights</b>: turn the commons into private property. The owner then bears the full consequences of overuse, so social benefits become private benefits. Not always feasible (who could own a migrating fish stock?).</li>
  <li><b>Quotas</b>: a legal limit on total use, set at the efficient quantity, so the resource can stay in common use but be used efficiently. Users may cheat, and each has an incentive to overstate their share.</li>
  <li><b>Individual transferable quotas (ITQs)</b>: personal quotas that can be bought and sold. If the total equals the efficient quantity, the ITQ's market price makes each user's marginal cost (own cost + the quota price) equal MSB at the efficient quantity, and the quotas end up with the lowest-cost users.</li>
</ul>
<p>Economists broadly agree that ITQs work, but getting them through the political process is hard: users who would lose out lobby against them, and self-interest can capture the process. The political scientist <b>Elinor Ostrom</b> (Nobel Prize, 2009) showed that communities often manage commons well themselves when certain <b>design principles</b> hold, including clearly defined boundaries, rules fitted to local conditions, users taking part in making the rules, monitors accountable to the users, graduated sanctions for rule-breakers, cheap and easy conflict resolution, recognition of the community's right to organize by higher authorities, and nested layers of organization for large systems.</p>
<div class="example"><b>Example.</b> On a lake, the MSB of perch is 100 − <em>Q</em> dollars per ton (<em>Q</em> = tons per season), and the private MC of catching is 10 + <em>Q</em>. Each ton caught also lowers future catches, a depletion cost of $20 per ton, so MSC = 30 + <em>Q</em>. Open access: 100 − <em>Q</em> = 10 + <em>Q</em> gives <b>45 tons</b>. Efficient: 100 − <em>Q</em> = 30 + <em>Q</em> gives <b>35 tons</b>. Issuing ITQs for 35 tons in total would lead them to trade at about <b>$20 per ton</b>, the gap between MSB (65) and private MC (45) at 35 tons.</div>
<div class="keyidea"><b>Key idea.</b> Rival + nonexcludable → each user ignores the cost their use imposes on others → overuse. Fix it by making users face that cost: ownership, quotas or tradable quotas.</div>
<div class="trap"><b>Common trap.</b> The tragedy is not caused by users being greedy or ignorant. Even users who understand the danger overuse a commons, because holding back alone just leaves more for others to take.</div>`,
      gens: ["b251-m7-commons"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m7-c-mktfail", tag: "Definition", front: "What is a <em>market failure</em>?", back: "A situation in which an unrestrained market puts <b>too many or too few resources</b> into an activity, so the outcome is not efficient (or, for equity, not acceptable to society)." },
    { id: "b251-m7-c-four-fail", tag: "Definition", front: "Name the four types of market failure.", back: "<b>Equity</b> (e.g. low-wage workers), <b>externalities</b> (e.g. pollution), <b>public goods</b> (e.g. flood protection) and <b>market power</b> (e.g. a monopoly; answered with antitrust laws)." },
    { id: "b251-m7-c-extern", tag: "Definition", front: "What is an externality, and who are third parties?", back: "A consequence of an economic activity that <b>spills over</b> onto <b>third parties</b>: people not directly involved in the transaction. Negative → a cost; positive → a benefit." },
    { id: "b251-m7-c-costs", tag: "Distinction", front: "Private cost vs external cost", back: "<b>Private cost</b> is borne by the producer (MC is the private cost of one more unit). <b>External cost</b> is borne by others, not the producer." },
    { id: "b251-m7-c-msc", tag: "Formula", front: "Marginal social cost", back: "<b>MSC = MC + marginal external cost</b>: the cost of one more unit to the whole society, the producer and everyone else." },
    { id: "b251-m7-c-neg-over", tag: "Principle", front: "Negative externality: does the market produce too much or too little?", back: "<b>Too much.</b> The market stops where MB = MC; the efficient quantity is where MSB = MSC, which is smaller. Units in between cost society more than they are worth (deadweight loss)." },
    { id: "b251-m7-c-dwl", tag: "Calculation", front: "MEC is a constant $10 per unit; market Q = 50, efficient Q = 44. Deadweight loss?", back: "½ × (50 − 44) × 10 = <b>$30</b>. The triangle between MSC and MSB over the overproduced units." },
    { id: "b251-m7-c-pigou", tag: "Definition", front: "What is a Pigovian tax, and how big should it be?", back: "A per-unit tax equal to the <b>marginal external cost</b>, so that <b>MC + tax = MSC</b> and the market produces the efficient quantity. Named for A. C. Pigou." },
    { id: "b251-m7-c-emission", tag: "Definition", front: "Emission charge", back: "A price per <b>unit of pollution</b> released. The more a firm pollutes, the more it pays, so it cuts emissions whenever cutting a unit costs less than the charge." },
    { id: "b251-m7-c-permits", tag: "Definition", front: "Marketable permits (cap and trade)", back: "The government caps total pollution and issues permits that firms can trade. The permit price confronts each polluter with the social cost of polluting, and cleanup is done by the firms that can do it most cheaply." },
    { id: "b251-m7-c-permit-who", tag: "Example", front: "Firm A can cut a ton of emissions for $20, Firm B for $65. Who sells permits, and at what prices could they trade?", back: "<b>A sells</b> (it cuts more and sells its spare permits) and B buys, at any price <b>between $20 and $65</b>." },
    { id: "b251-m7-c-propright", tag: "Definition", front: "What are property rights, and why do they matter for externalities?", back: "Legally established, court-enforceable titles to own, use and dispose of resources and goods. Externalities often arise because <b>nobody owns</b> the thing being harmed (air, rivers)." },
    { id: "b251-m7-c-coase", tag: "Principle", front: "State the Coase theorem.", back: "If property rights exist, only a <b>few parties</b> are involved and <b>transaction costs are low</b>, private bargaining reaches the efficient outcome, and the outcome does <b>not depend on who holds the rights</b>." },
    { id: "b251-m7-c-coase-dist", tag: "Distinction", front: "Under Coase, what does the assignment of property rights change?", back: "<b>Who pays whom</b> (the distribution of gains). It does not change <b>what happens</b>: the efficient outcome is reached either way." },
    { id: "b251-m7-c-coase-calc", tag: "Calculation", front: "A fence costs a rancher $3,000; his stray cattle cause $5,000 of crop damage. The rancher has the right to let cattle roam. What happens?", back: "The farmer pays the rancher something <b>between $3,000 and $5,000</b> to build the fence. The fence gets built, just as it would if the farmer held the right." },
    { id: "b251-m7-c-transcost", tag: "Definition", front: "Transaction costs", back: "The costs of conducting a transaction: finding the other parties, negotiating, and writing and enforcing the deal (e.g. agent, lender and legal fees on a house)." },
    { id: "b251-m7-c-coase-fail", tag: "Why", front: "When does the Coase solution break down?", back: "When <b>many people</b> are affected and <b>transaction costs are high</b> (or rights are unclear). Then bargaining is impractical and government tools (taxes, charges, permits) are used." },
    { id: "b251-m7-c-benefits", tag: "Distinction", front: "Private benefit vs external benefit", back: "<b>Private benefit</b> goes to the consumer (MB is the private benefit of one more unit). <b>External benefit</b> goes to someone other than the consumer." },
    { id: "b251-m7-c-msb", tag: "Formula", front: "Marginal social benefit (with an external benefit)", back: "<b>MSB = MB + marginal external benefit</b>." },
    { id: "b251-m7-c-pos-under", tag: "Principle", front: "Positive externality: does the market produce too much or too little?", back: "<b>Too little.</b> Buyers count only their own MB, so the market stops where MB = MC, short of the efficient quantity where MSB = MSC." },
    { id: "b251-m7-c-pos-tools", tag: "Definition", front: "Four government tools for external benefits", back: "<b>Public provision</b>, <b>private subsidies</b>, <b>vouchers</b>, and <b>patents and copyrights</b>." },
    { id: "b251-m7-c-sub-vouch", tag: "Distinction", front: "Private subsidy vs voucher", back: "A <b>subsidy</b> is a payment to <b>private producers</b>. A <b>voucher</b> is a token given to <b>households</b> to spend on a specified good. The efficient subsidy or voucher equals the marginal external benefit." },
    { id: "b251-m7-c-rival", tag: "Definition", front: "Rival vs nonrival", back: "<b>Rival</b>: one person's use reduces what is available to others. <b>Nonrival</b>: one more user takes nothing away from anyone else." },
    { id: "b251-m7-c-excl", tag: "Definition", front: "Excludable vs nonexcludable", back: "<b>Excludable</b>: non-payers can be kept from using it. <b>Nonexcludable</b>: everyone benefits whether or not they pay." },
    { id: "b251-m7-c-four-goods", tag: "Distinction", front: "The four types of goods", back: "<b>Private</b>: rival, excludable. <b>Public</b>: nonrival, nonexcludable. <b>Common resource</b>: rival, nonexcludable. <b>Natural monopoly (club) good</b>: nonrival, excludable." },
    { id: "b251-m7-c-road", tag: "Example", front: "A free road: empty at noon, jammed at 5 pm. What type of good is it at each time?", back: "Empty: nonrival and nonexcludable, a <b>public good</b>. Jammed: each car slows the others, so rival, a <b>common resource</b>." },
    { id: "b251-m7-c-pub-traits", tag: "Definition", front: "Characteristics of a public good", back: "Indivisible; extra users cost nothing extra; extra users do not deprive others; hard to charge people by how much they use (the exclusion principle fails)." },
    { id: "b251-m7-c-freerider", tag: "Definition", front: "The free-rider problem", back: "People enjoy a public good while leaving others to pay for it. So private firms cannot sell it profitably, and <b>too little</b> is produced." },
    { id: "b251-m7-c-vertical", tag: "Formula", front: "How do you find the MSB of a public good?", back: "<b>Vertically sum</b> individual marginal benefits: add everyone's MB at the same quantity. Efficient quantity: <b>MSB = MSC</b>." },
    { id: "b251-m7-c-pubprov", tag: "Why", front: "How does public provision overcome the free-rider problem?", back: "The government can <b>tax everyone</b> who benefits, so no one can ride free, and it can provide the efficient quantity." },
    { id: "b251-m7-c-common", tag: "Definition", front: "Common resource", back: "Rival but nonexcludable: a unit can be used only once, but no one can be kept from using what is there (e.g. ocean fish, groundwater)." },
    { id: "b251-m7-c-tragedy", tag: "Definition", front: "Tragedy of the commons", back: "Overuse and depletion of a commonly owned resource because no user has an incentive to conserve: each gets the full gain from using it but bears only part of the cost." },
    { id: "b251-m7-c-sustain", tag: "Definition", front: "Renewable resource and sustainable catch", back: "A <b>renewable resource</b> replenishes itself through birth and growth. The <b>sustainable catch</b> can be taken year after year without depleting the stock; a smaller stock has a smaller sustainable catch." },
    { id: "b251-m7-c-commons-tools", tag: "Definition", front: "Three ways to use a common resource efficiently", back: "<b>Property rights</b>, <b>quotas</b> (a limit set at the efficient quantity) and <b>individual transferable quotas (ITQs)</b>." },
    { id: "b251-m7-c-itq", tag: "Why", front: "Why do ITQs lead to efficient use?", back: "With the efficient total issued, the ITQ's market price makes each user's marginal cost (own cost + quota price) equal MSB at the efficient quantity, and quotas flow to the lowest-cost users." },
    { id: "b251-m7-c-ostrom", tag: "Principle", front: "Name four of Elinor Ostrom's design principles for managing a commons.", back: "Any four of: clear boundaries; rules suited to local conditions; users help make the rules; monitors accountable to users; graduated sanctions; cheap, easy conflict resolution; higher authorities recognize the right to self-organize; nested layers for large systems." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“too much / too little of an activity”, “resources misallocated”", think: "Market failure", why: "The market's quantity differs from the efficient one (or the outcome is judged unfair)." },
    { when: "“minimum wage”, “unfair distribution”, “can't afford basics”", think: "Equity", why: "The issue is fairness of outcomes, not overproduction or underproduction." },
    { when: "“antitrust”, “only seller”, “cartel”, “merger”", think: "Market power", why: "A firm restricts output and raises price above the competitive level." },
    { when: "“smoke”, “runoff”, “noise”, “harms neighbors”", think: "Negative externality → overproduction", why: "MSC = MC + external cost lies above supply." },
    { when: "“vaccine”, “education”, “research”, “benefits others too”", think: "Positive externality → underproduction", why: "MSB = MB + external benefit lies above demand." },
    { when: "“tax equal to the damage per unit”", think: "Pigovian tax: MC + tax = MSC", why: "Makes producers face the full social cost." },
    { when: "“fee per ton of pollutant released”", think: "Emission charge", why: "A price on each unit of pollution, not on each unit of output." },
    { when: "“cap”, “permits can be bought and sold”", think: "Marketable permits (cap and trade)", why: "Low-cost cleaners sell permits; the permit price is the social cost of polluting." },
    { when: "“two neighbors negotiate”, “regardless of who has the right”", think: "Coase theorem", why: "Few parties + low transaction costs → efficient bargain." },
    { when: "“thousands of people affected”, “costly to negotiate”", think: "Coase fails → government action", why: "High transaction costs and free riding block bargaining." },
    { when: "“payment to schools / clinics per unit” vs “coupon given to families”", think: "Subsidy vs voucher", why: "Subsidies go to producers, vouchers to households." },
    { when: "“can't keep non-payers out” + “one person's use doesn't reduce another's”", think: "Public good → free riders", why: "Nonexcludable and nonrival, so few pay voluntarily." },
    { when: "“add everyone's MB at each quantity”", think: "Vertical sum → MSB of a public good", why: "Every unit serves everyone at once." },
    { when: "“open to all” + “used up” (fish, groundwater, grazing)", think: "Common resource → tragedy of the commons", why: "Rival and nonexcludable, so it is overused." },
    { when: "“quota that can be sold to another fisher”", think: "Individual transferable quota (ITQ)", why: "Its price makes users face MSB at the efficient quantity." },
    { when: "“subscription”, “paywall”, “toll on an uncrowded bridge”", think: "Natural monopoly (club) good", why: "Excludable but nonrival." },
  ];

  /* ============================================================
   * PRACTICE 1 — Market failure and its four types
   * ============================================================ */
  const FAIL_CATS = ["Equity", "Externalities", "Public goods", "Market power"];
  const FAIL_BANK = [
    { t: "Many full-time restaurant workers earn too little to rent an apartment in the city, so the state raises its minimum wage.", cat: "Equity", why: "The concern is the fairness of incomes the market produces." },
    { t: "Lawmakers expand food assistance because some families' market incomes cannot cover a basic diet.", cat: "Equity", why: "Redistributing toward low-income families addresses equity." },
    { t: "A state funds rent support for low-income seniors whose pensions no longer cover local rents.", cat: "Equity", why: "This is about who gets output, a fairness question." },
    { t: "Congress expands a tax credit for low-wage working parents to narrow the gap between rich and poor.", cat: "Equity", why: "Narrowing income gaps is an equity goal." },
    { t: "Voters support higher tax rates on very high incomes to fund programs for poor households.", cat: "Equity", why: "A progressive tax aims at a fairer distribution of income." },
    { t: "A chemical plant's runoff kills fish that a downstream town depends on.", cat: "Externalities", why: "A cost spills over onto third parties: a negative externality." },
    { t: "A nightclub's bass keeps an entire apartment block awake until 2 a.m.", cat: "Externalities", why: "Noise imposes a cost on people outside the transaction." },
    { t: "Each driver who enters a congested freeway slows down every other driver.", cat: "Externalities", why: "The delay each driver causes falls on others: an external cost." },
    { t: "A homeowner's flower garden raises the value of the houses around it.", cat: "Externalities", why: "A benefit spills over to neighbors: a positive externality." },
    { t: "Parents who vaccinate their child also protect infants too young for the shot.", cat: "Externalities", why: "The vaccination benefits third parties: a positive externality." },
    { t: "A company's basic research is published and used freely by rival firms.", cat: "Externalities", why: "Knowledge spills over to others who did not pay for it." },
    { t: "No private company offers a county-wide tornado siren, because everyone hears it whether they pay or not.", cat: "Public goods", why: "Nonrival and nonexcludable, so few would pay voluntarily." },
    { t: "Residents of a river town each hope others will pay for the levee that would protect them all.", cat: "Public goods", why: "A levee protects everyone at once; free riders leave it underfunded." },
    { t: "A city pays for mosquito spraying from taxes because selling it house by house is impossible.", cat: "Public goods", why: "Spraying protects everyone in the area, paying or not." },
    { t: "A country funds its armed forces from taxes, since protection cannot be sold to one household at a time.", cat: "Public goods", why: "Defense is nonrival and nonexcludable." },
    { t: "A program that scans the sky for dangerous asteroids is funded by government, not by subscriptions.", cat: "Public goods", why: "Everyone on Earth benefits whether or not they pay." },
    { t: "Regulators block a merger that would leave one company with 90% of the nation's baby-formula sales.", cat: "Market power", why: "Antitrust policy targets firms that could restrict output and raise price." },
    { t: "Three cement makers secretly agree to keep prices high, and prosecutors bring an antitrust case.", cat: "Market power", why: "A price-fixing cartel exercises market power." },
    { t: "The only internet provider in a rural county charges far above its cost because no rival can enter.", cat: "Market power", why: "A firm with no competition can set price above the competitive level." },
    { t: "A dominant app store charges developers a 30% fee that rivals cannot undercut because they are shut out.", cat: "Market power", why: "Blocking rivals to keep prices high is market power." },
    { t: "A drug maker with the only approved treatment raises its price tenfold overnight.", cat: "Market power", why: "With no competitors, the seller can restrict quantity and raise price." },
  ];
  const DIR_BANK = [
    { t: "A smelter whose fumes damage nearby crops", cat: "Too many resources", why: "External cost ignored → overproduction." },
    { t: "Gasoline-powered leaf blowers that annoy whole neighborhoods", cat: "Too many resources", why: "Noise is an external cost, so the activity is overdone." },
    { t: "Cruise ships dumping waste water near coral reefs", cat: "Too many resources", why: "The damage falls on others → too much of the activity." },
    { t: "Late-night fireworks sold for backyard use that keep neighbors and pets awake", cat: "Too many resources", why: "External costs → more than the efficient quantity." },
    { t: "Flu vaccinations, which also protect people who do not get one", cat: "Too few resources", why: "External benefit ignored by buyers → underproduction." },
    { t: "Basic scientific research whose results others can freely use", cat: "Too few resources", why: "Knowledge spillovers mean the market underproduces it." },
    { t: "A flood-warning system that protects everyone in a valley", cat: "Too few resources", why: "A public good: free riders leave it underprovided." },
    { t: "A single firm controlling a city's only cement supply", cat: "Too few resources", why: "Market power: a monopolist restricts output to raise price." },
    { t: "Ocean fish that any boat may catch", cat: "Too many resources", why: "A common resource is overused (tragedy of the commons)." },
    { t: "Water pumped from an aquifer shared by many farms", cat: "Too many resources", why: "Common resource → overuse." },
    { t: "Early-childhood education, which raises children's later productivity and civic life", cat: "Too few resources", why: "External benefits → underproduction." },
  ];
  const FAIL_TF = [
    { t: "A market failure means the market allocates too many or too few resources to an activity.", ok: true },
    { t: "Pollution is an example of an externality.", ok: true },
    { t: "Antitrust laws are a response to market power.", ok: true },
    { t: "A market can be efficient and still be judged unfair, which is why equity is listed as a market failure.", ok: true },
    { t: "Public goods are underprovided by private markets because people can enjoy them without paying.", ok: true },
    { t: "Government is often called on to address market failures.", ok: true },
    { t: "Any time a price rises sharply, a market failure has occurred.", ok: false, why: "Prices rise for ordinary supply-and-demand reasons too; that is the market working." },
    { t: "Externalities affect only the buyer and seller in a transaction.", ok: false, why: "By definition they spill over onto third parties." },
    { t: "Market power leads firms to produce more than the competitive quantity.", ok: false, why: "Firms with market power restrict output to raise price." },
    { t: "A minimum wage is a response to a public-goods problem.", ok: false, why: "It is a response to an equity concern." },
    { t: "A perfectly competitive market with no externalities usually misallocates resources.", ok: false, why: "Without externalities or other failures, competitive markets allocate efficiently." },
  ];
  const NOT_FAIL = [
    "A late frost destroys part of the coffee harvest, and coffee prices rise",
    "A new app becomes popular, so its developer hires more programmers",
    "Concert tickets for a famous band sell out within minutes at a high price",
    "A drop in the price of steel leads car makers to produce more cars",
    "A fall fashion trend raises demand for wool coats, and wool prices rise",
  ];
  const genFailure = STUDY.makeGenerator({
    id: "b251-m7-failure",
    name: "Types of market failure",
    blurb: "Sort situations into equity, externalities, public goods and market power, and tell real market failures from markets doing their job.",
    variants: [
      {
        name: "Classify the market failure",
        make() {
          return Q.classify({
            q: "Which type of market failure does each situation illustrate?",
            cats: FAIL_CATS,
            items: dealItems("m7-fail", FAIL_BANK, FAIL_CATS, 5),
            sol: steps("Ask what is going wrong: an unfair distribution (equity), costs or benefits spilling onto third parties (externalities), a good nobody can be kept from using (public goods), or a seller able to restrict output (market power).",
              "Positive spillovers, like a neighbor's garden or a vaccination, are externalities too, not public goods: the activity is a private one whose side effects reach others."),
          });
        },
      },
      {
        name: "What does market failure mean?",
        make() {
          return Q.mc({
            q: "Which statement best defines a <b>market failure</b>?",
            right: "An unrestrained market puts too many or too few resources into a particular activity",
            wrong: [
              { t: "A market in which prices change frequently", why: "Price changes are how markets signal scarcity; they are not a failure." },
              { t: "A business that goes bankrupt because customers prefer a rival's product", why: "Firms failing in competition is the market reallocating resources, not a market failure." },
              { t: "Any market the government regulates", why: "Regulation is a possible <em>response</em> to market failure, not its definition." },
              { t: "A market in which some people cannot afford everything they want", why: "Scarcity means no one can have everything; that alone is not a market failure." },
            ],
            rightWhy: "A market failure is an inefficient allocation: too much or too little of an activity compared with what is best for society.",
            sol: steps("Market failure is about the <em>allocation</em> of resources, not about whether prices move or firms close.",
              "If the market's quantity differs from the quantity that is best for society, resources are misallocated: that is a market failure."),
          });
        },
      },
      {
        name: "Which is NOT a market failure?",
        make() {
          const right = U.pick(NOT_FAIL);
          const wrong = U.sample(FAIL_CATS, 3).map(c => {
            const it = U.pick(FAIL_BANK.filter(i => i.cat === c));
            return { t: it.t.replace(/\.$/, ""), why: `This is a market failure (${c.toLowerCase()}). ${it.why}` };
          });
          return Q.mc({
            q: "Which situation is <b>not</b> an example of market failure?",
            right, wrong,
            rightWhy: "Prices and quantities are responding to ordinary changes in supply or demand: the market is working, not failing.",
            sol: steps("A market failure needs a reason the market's quantity is wrong for society: spillovers, free riders, market power, or an outcome judged unfair.",
              `In “${right.toLowerCase()}”, buyers and sellers bear the costs and benefits themselves, so the price change simply reflects scarcity.`),
          });
        },
      },
      {
        name: "Match the policy to the failure",
        make() {
          const pol = U.pick([
            { p: "Antitrust laws that block mergers between dominant rivals", a: "Market power" },
            { p: "A higher minimum wage", a: "Equity" },
            { p: "A tax on each ton of a pollutant released", a: "Externalities" },
            { p: "Tax-funded provision of a county-wide flood-warning system", a: "Public goods" },
            { p: "A subsidy for flu vaccinations", a: "Externalities" },
            { p: "Breaking up a firm that controls nearly all of a market", a: "Market power" },
            { p: "Cash transfers to low-income households", a: "Equity" },
            { p: "Government funding of street lighting", a: "Public goods" },
          ]);
          const whys = {
            Equity: "Equity policies change who gets income; this policy does not do that.",
            Externalities: "Externality policies make people face spillover costs or benefits; that is not this policy's target.",
            "Public goods": "Public-goods policies have government provide what free riders will not pay for; that is not this policy.",
            "Market power": "Market-power policies target firms that restrict output; this policy does not.",
          };
          return Q.mc({
            q: `Which type of market failure is this policy mainly designed to address?<br><b>${pol.p}</b>`,
            right: pol.a,
            wrong: FAIL_CATS.filter(c => c !== pol.a).map(c => ({ t: c, why: whys[c] })),
            keepOrder: true,
            sol: steps("Ask what problem the policy fixes: unfair incomes, spillovers, free riding, or a seller that can restrict output.",
              `${pol.p} targets <b>${pol.a.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Too many or too few resources?",
        make() {
          const cats = ["Too many resources", "Too few resources"];
          return Q.classify({
            q: "Left to an unregulated market, does each activity get too many or too few resources compared with the efficient amount?",
            cats,
            items: dealItems("m7-dir", DIR_BANK, cats, 5),
            sol: steps("External costs and common resources lead to <b>overuse</b>: decision-makers ignore costs that fall on others.",
              "External benefits, public goods and market power lead to <b>too little</b>: buyers ignore others' benefits, free riders will not pay, and a monopolist restricts output."),
          });
        },
      },
      {
        name: "Select all true statements about market failure",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(FAIL_TF, 5),
            sol: steps("Market failure = too many or too few resources in an activity (or an outcome judged unfair).",
              "The four types are equity, externalities, public goods and market power; each has its own policy response."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Negative externalities
   * ============================================================ */
  const COST_BANK = [
    { t: "The coal a power plant buys to fire its boilers", cat: "Private cost", why: "The plant pays for its own fuel." },
    { t: "Wages a paper mill pays its workers", cat: "Private cost", why: "Borne by the producer." },
    { t: "Electricity a cement plant pays for to run its kilns", cat: "Private cost", why: "Borne by the producer." },
    { t: "Rent a dye works pays for its factory building", cat: "Private cost", why: "Borne by the producer." },
    { t: "The truck fuel a quarry buys to haul gravel", cat: "Private cost", why: "Borne by the producer." },
    { t: "Asthma treatment for children living downwind of a smokestack", cat: "External cost", why: "Borne by third parties, not the producer." },
    { t: "Income lost by fishers when a mill's runoff kills fish", cat: "External cost", why: "Borne by people outside the transaction." },
    { t: "Lost sleep for neighbors of a quarry that blasts at dawn", cat: "External cost", why: "Falls on third parties." },
    { t: "Honey lost by beekeepers when pesticide drift kills their bees", cat: "External cost", why: "Falls on people who are not party to the spraying contract." },
    { t: "Extra car washes nearby residents pay for because of cement dust", cat: "External cost", why: "Borne by third parties." },
    { t: "The producer's own costs plus the damage its pollution does to everyone else", cat: "Social cost", why: "Social cost = private cost + external cost." },
    { t: "The full cost to society of one more ton of output: the mill's cost and downstream damage combined", cat: "Social cost", why: "MSC = MC + marginal external cost." },
    { t: "The plant's fuel and labor costs together with residents' medical bills from its smoke", cat: "Social cost", why: "Private and external costs together make the social cost." },
  ];
  const NEG_CONCEPT_TF = [
    { t: "With a negative externality, the market quantity is greater than the efficient quantity.", ok: true },
    { t: "Marginal social cost equals marginal private cost plus marginal external cost.", ok: true },
    { t: "At the market quantity, the marginal social cost of the last unit exceeds its marginal social benefit.", ok: true },
    { t: "The efficient quantity is where marginal social benefit equals marginal social cost.", ok: true },
    { t: "With a negative externality, the market price is too low compared with the efficient outcome.", ok: true },
    { t: "With a negative externality, the supply curve lies above the MSC curve.", ok: false, why: "Supply is private MC; MSC adds the external cost, so MSC lies above supply." },
    { t: "Because of the external cost, the market produces too little of the good.", ok: false, why: "An ignored cost makes the good look cheaper than it is, so the market produces too much." },
    { t: "External costs are borne by the producer.", ok: false, why: "External costs fall on third parties; private costs fall on the producer." },
    { t: "The deadweight loss from a negative externality comes from units that are never produced.", ok: false, why: "It comes from units that <em>are</em> produced even though MSC &gt; MSB." },
  ];
  function negIntro(sc, m, extra) {
    return `${cap(sc.firm)} sells ${sc.good} in a competitive market. With <em>Q</em> measured in ${sc.us} per ${sc.per}, buyers' marginal benefit (demand) is <b>MB = ${down(m.a, m.b)}</b> and the firms' marginal private cost (supply) is <b>MC = ${up(m.c, m.d)}</b>, both in dollars per ${sc.u}. Each ${sc.u} also causes <b>${$(m.e)}</b> of damage to ${sc.third} (${sc.harm})${extra || ""}.`;
  }
  const genNeg = STUDY.makeGenerator({
    id: "b251-m7-negext",
    name: "Negative externalities",
    blurb: "Separate private, external and social cost, find the market and efficient quantities, and measure the overproduction and deadweight loss.",
    variants: [
      {
        name: "Efficient quantity with an external cost",
        make() {
          const sc = U.pick(NEG), m = negModel();
          return Q.num({
            q: `${negIntro(sc, m)}<br>What is the <b>efficient</b> quantity, in ${sc.us} per ${sc.per}?`,
            answer: m.Qe, unit: sc.us,
            traps: traps(m.Qe, [
              { value: m.Qm, why: "That is the market quantity, where MB = MC. It ignores the external cost." },
              { value: m.Qm + m.k, why: "Adding the external cost should raise the cost curve and so <em>reduce</em> the quantity, not increase it." },
              { value: (m.a - m.c - m.e) / m.b, why: "Set MSB equal to MSC and collect both <em>Q</em> terms: the slopes add." },
            ]),
            sol: steps("Efficiency needs <b>MSB = MSC</b>. Here MSB is the demand curve, and MSC = MC + marginal external cost.",
              `MSC = ${up(m.c, m.d)} + ${m.e} = ${up(m.c + m.e, m.d)}.`,
              `${down(m.a, m.b)} = ${up(m.c + m.e, m.d)} → ${m.s}<em>Q</em> = ${m.a - m.c - m.e} → <em>Q</em> = <b>${m.Qe} ${sc.us}</b>. (The market, using MC alone, would produce ${m.Qm}.)`),
          });
        },
      },
      {
        name: "Marginal social cost at the market quantity",
        make() {
          const sc = U.pick(NEG), m = negModel();
          return Q.num({
            q: `${negIntro(sc, m)}<br>The unregulated market produces ${qty(m.Qm, sc)}. What is the <b>marginal social cost</b> at that quantity, in dollars per ${sc.u}?`,
            answer: m.mscM, unit: "$",
            traps: traps(m.mscM, [
              { value: m.Pm, why: "That is the marginal <em>private</em> cost (and the market price). Add the external cost." },
              { value: m.e, why: "That is only the external part. MSC = MC + marginal external cost." },
              { value: m.Pe, why: "That is the price at the efficient quantity, not the social cost at the market quantity." },
            ]),
            sol: steps("MSC = MC + marginal external cost, evaluated at the quantity asked about.",
              `MC at ${m.Qm}: ${m.c} + ${m.d} × ${m.Qm} = ${$(m.Pm)} (this is also the market price, since MB = MC there).`,
              `MSC = ${$(m.Pm)} + ${$(m.e)} = <b>${$(m.mscM)}</b>, more than the ${$(m.Pm)} buyers value the unit at, so the last unit produced is not worth its cost to society.`),
          });
        },
      },
      {
        name: "Deadweight loss from overproduction",
        make() {
          const sc = U.pick(NEG), m = negModel();
          const given = Math.random() < 0.5;
          const extra = given ? `. The market produces ${m.Qm} ${sc.us} and the efficient quantity is ${m.Qe}` : "";
          return Q.num({
            q: `${negIntro(sc, m, extra)}<br>What is the <b>deadweight loss</b> per ${sc.per} caused by the externality, in dollars?`,
            answer: m.dwl, unit: "$",
            traps: traps(m.dwl, [
              { value: m.e * m.k, why: "That is the rectangle. The deadweight loss is a triangle, so multiply by ½." },
              { value: m.e * m.Qm, why: "That is the total external damage on all units, not the deadweight loss." },
              { value: m.e * m.Qm / 2, why: "The triangle's base is only the overproduced units (market − efficient), not the whole market quantity." },
              { value: m.k / 2, why: "Multiply the base by the height (the external cost per unit) as well." },
            ]),
            sol: steps("The deadweight loss is the triangle between MSC and MSB over the units the market overproduces.",
              given ? `Base = ${m.Qm} − ${m.Qe} = ${m.k} ${sc.us}.`
                : `Market: MB = MC gives <em>Q</em> = ${m.Qm}. Efficient: MB = MC + ${m.e} gives <em>Q</em> = ${m.Qe}. Base = ${m.k} ${sc.us}.`,
              `Height at the market quantity = MSC − MSB = the external cost per unit, ${$(m.e)}.`,
              `DWL = ½ × ${m.k} × ${m.e} = <b>${$(m.dwl)}</b>.`),
          });
        },
      },
      {
        name: "Efficient quantity from a schedule",
        make() {
          const sc = U.pick(NEG), m = negModel();
          const start = m.Qe - 2 * m.k >= 0 && Math.random() < 0.5 ? -2 : -1;
          const rows = [];
          for (let j = start; j < start + 5; j++) { const q = m.Qe + j * m.k; rows.push([U.fmt(q), $(m.a - m.b * q), $(m.c + m.d * q)]); }
          return Q.num({
            q: `${cap(sc.firm)} sells ${sc.good}. The table shows buyers' marginal benefit and the firms' marginal private cost at several output levels (${sc.us} per ${sc.per}):${tbl(["Quantity", "Marginal benefit", "Marginal private cost"], rows)}Each ${sc.u} also causes <b>${$(m.e)}</b> of damage to ${sc.third} (${sc.harm}). Which quantity in the table is <b>efficient</b>?`,
            answer: m.Qe, unit: sc.us, kind: "count",
            traps: traps(m.Qe, [
              { value: m.Qm, why: "That is where MB = MC: the market outcome, which ignores the external cost." },
              { value: m.Qe - m.k, why: "At that quantity MSB is still above MSC, so another step is worth producing." },
            ]),
            sol: steps("Build the marginal social cost column: MSC = MC + external cost. Then look for MSB (= MB here) = MSC.",
              `At ${m.Qe}: MC = ${$(m.Ps)}, so MSC = ${$(m.Ps)} + ${$(m.e)} = ${$(m.Pe)}, which equals MB = ${$(m.Pe)}.`,
              `So <b>${m.Qe} ${sc.us}</b> is efficient. The market goes on to ${m.Qm}, where MB = MC = ${$(m.Pm)} but MSC = ${$(m.mscM)}.`),
          });
        },
      },
      {
        name: "Read the externality graph",
        make() {
          const sc = U.pick(NEG), m = negModel({ kMin: 5, kMax: 8 });
          const L = U.sample(["A", "B", "F", "H", "J", "K", "R", "T"], 4);
          const pts = [
            { x: m.Qm, y: m.Pm, key: "market", label: L[0] },
            { x: m.Qe, y: m.Pe, key: "eff", label: L[1] },
            { x: m.Qe, y: m.Ps, key: "mcEff", label: L[2] },
            { x: m.Qm, y: m.mscM, key: "mscM", label: L[3] },
          ];
          const ask = U.pick(["market", "eff", "mscM"]);
          const prompt = {
            market: "the outcome of the <b>unregulated market</b>",
            eff: "the <b>efficient</b> outcome",
            mscM: "the <b>marginal social cost</b> of the last unit the unregulated market produces",
          }[ask];
          const desc = {
            market: "where demand crosses supply (MB = MC): the unregulated market",
            eff: "where demand crosses MSC (MSB = MSC): the efficient outcome",
            mcEff: "on the MC curve at the efficient quantity: the price sellers would keep under a Pigovian tax",
            mscM: "on the MSC curve above the market quantity: the social cost of the last unit the market produces",
          };
          const right = pts.find(p => p.key === ask);
          const g = negGraph(m, { xLabel: `Quantity (${sc.us} per ${sc.per})`, yLabel: `$ per ${sc.u}`, points: pts.map(p => ({ x: p.x, y: p.y, label: p.label })), aria: "externality graph with labelled points" });
          return Q.mc({
            q: `The graph shows the market for ${sc.good}. Production causes ${sc.harm} for ${sc.third}.${g}Which point shows ${prompt}?`,
            right: `Point ${right.label}`,
            wrong: pts.filter(p => p !== right).map(p => ({ t: `Point ${p.label}`, why: `Point ${p.label} is ${desc[p.key]}.` })),
            rightWhy: `Point ${right.label} is ${desc[ask]}.`,
            sol: steps("Supply is the private MC curve; MSC lies above it by the external cost per unit. Demand measures MSB here.",
              "The market settles where demand meets supply; efficiency needs demand to meet MSC, at a smaller quantity.",
              `So ${prompt.replace(/<\/?b>/g, "")} is point <b>${right.label}</b>.`),
          });
        },
      },
      {
        name: "Why the market overproduces",
        make() {
          const sc = U.pick(NEG);
          return Q.mc({
            q: `${cap(sc.firm)} causes ${sc.harm} for ${sc.third}, who are not compensated. Compared with the efficient outcome, the unregulated market for ${sc.good} produces:`,
            right: "Too much, at too low a price, because producers ignore the external cost",
            wrong: [
              { t: "Too little, at too high a price, because the external cost raises prices", why: "The external cost is not in the firm's costs, so it does not raise the market price; the good looks cheaper than it is." },
              { t: "The efficient amount, because the market price already includes all costs", why: "The price reflects only private cost. The cost borne by third parties is left out." },
              { t: "Too much, at too high a price, because buyers overvalue the good", why: "Buyers' valuation is not the problem; the price is too <em>low</em> because part of the cost is ignored." },
            ],
            rightWhy: "Supply reflects only private MC, which lies below MSC, so the market quantity is above the efficient one and the price below it.",
            sol: steps("Ask whose costs the producer counts. Supply = private MC only.",
              "MSC = MC + external cost lies above supply, so the efficient quantity (MSB = MSC) is smaller and its price higher.",
              "The market therefore produces <b>too much at too low a price</b>, creating a deadweight loss."),
          });
        },
      },
      {
        name: "Private, external or social cost?",
        make() {
          const cats = ["Private cost", "External cost", "Social cost"];
          return Q.classify({
            q: "Classify each cost.",
            cats,
            items: dealItems("m7-cost", COST_BANK, cats, 5),
            sol: steps("Ask who bears the cost: the producer (private), someone outside the transaction (external), or both together (social).",
              "Social cost = private cost + external cost; at the margin, MSC = MC + marginal external cost."),
          });
        },
      },
      {
        name: "Select all: negative externalities",
        make() {
          return Q.multi({
            q: "A good's production creates a negative externality. Select <b>all</b> statements that are true.",
            options: selectAll(NEG_CONCEPT_TF, 5),
            sol: steps("Supply = private MC; MSC = MC + external cost lies above it.",
              "Market: MB = MC (too much, price too low). Efficient: MSB = MSC. The deadweight loss comes from the overproduced units."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Remedies for external costs
   * ============================================================ */
  const POL_CATS = ["Pigovian tax", "Emission charge", "Marketable permits", "Property rights"];
  const POL_BANK = [
    { t: "A tax of $12 on every ton of cement sold, equal to the dust damage each ton causes", cat: "Pigovian tax", why: "A per-unit tax on output equal to the marginal external cost." },
    { t: "A per-gallon gasoline tax set equal to the pollution and congestion damage from burning a gallon", cat: "Pigovian tax", why: "A per-unit tax on the good equal to the external cost per unit." },
    { t: "A tax on each flight departing a city airport, equal to the noise damage per flight", cat: "Pigovian tax", why: "A tax per unit of the activity, set at the external cost." },
    { t: "A tax on each hog raised, equal to the odor and runoff damage per hog", cat: "Pigovian tax", why: "A per-unit tax on output equal to the marginal external cost." },
    { t: "A smelter pays $40 for every kilogram of sulfur dioxide its monitored smokestack releases", cat: "Emission charge", why: "A price on each unit of pollution released." },
    { t: "A dye works pays a fee for every thousand gallons of wastewater it discharges into the river", cat: "Emission charge", why: "The charge is per unit of pollution, not per unit of output." },
    { t: "Farms are billed for each pound of nitrogen runoff measured leaving their fields", cat: "Emission charge", why: "A price per unit of pollution: more pollution, bigger bill." },
    { t: "A power plant pays a fixed amount per ton of carbon dioxide it emits", cat: "Emission charge", why: "A price per unit of emissions." },
    { t: "The state caps regional emissions at 50,000 tons and issues permits that plants may buy and sell", cat: "Marketable permits", why: "A cap plus tradable permits: cap and trade." },
    { t: "A firm that cleans up cheaply sells its unused pollution allowances to a firm whose cleanup is costly", cat: "Marketable permits", why: "Trading allowances under a cap is the permit system at work." },
    { t: "The government auctions a fixed number of rights to emit, which can later be resold", cat: "Marketable permits", why: "A fixed total of tradable rights to pollute." },
    { t: "A court rules that residents own the right to clean air over their land, and the factory negotiates payments with them", cat: "Property rights", why: "Clear ownership lets the parties bargain, as in the Coase theorem." },
    { t: "A lake is assigned to a single owner, who can sue anyone who pollutes it or charge them for doing so", cat: "Property rights", why: "Assigning ownership makes the polluter face the cost through bargaining or the courts." },
    { t: "A farmer is given clear legal title to a stream, so an upstream plant must pay her to discharge into it", cat: "Property rights", why: "A defined property right lets the parties strike a deal." },
  ];
  const POL_TF = [
    { t: "A Pigovian tax set equal to the marginal external cost makes MC + tax = MSC.", ok: true },
    { t: "With marketable permits, firms that can cut pollution cheaply tend to sell permits.", ok: true },
    { t: "An emission charge makes a firm's pollution bill grow with the amount it pollutes.", ok: true },
    { t: "A correctly set Pigovian tax moves the market to the efficient quantity.", ok: true },
    { t: "Under cap and trade, the permit price confronts polluters with the social cost of polluting.", ok: true },
    { t: "A Pigovian tax is set equal to the market price of the good.", ok: false, why: "It is set equal to the marginal external cost." },
    { t: "Under cap and trade, the firms with the highest cleanup costs do most of the cleanup.", ok: false, why: "The lowest-cost cleaners cut the most and sell permits to high-cost firms." },
    { t: "The size of a Pigovian tax equals the increase in the price buyers pay.", ok: false, why: "The tax is the whole gap between the buyers' price and the sellers' price; buyers usually bear only part." },
    { t: "A Pigovian tax larger than the marginal external cost improves efficiency even more.", ok: false, why: "Too large a tax pushes output below the efficient quantity, creating a new deadweight loss." },
  ];
  function abatementCosts() {
    const out = [U.randInt(2, 8) * 2];
    for (let i = 1; i < 6; i++) out.push(out[i - 1] + U.randInt(2, 6) * 2);
    return out;
  }
  const genPolicy = STUDY.makeGenerator({
    id: "b251-m7-extpolicy",
    name: "Remedies for external costs",
    blurb: "Tell Pigovian taxes, emission charges, marketable permits and property rights apart, size the tax, and see why trading permits cuts the cost of cleanup.",
    variants: [
      {
        name: "Classify the policy tool",
        make() {
          return Q.classify({
            q: "Which tool for dealing with external costs does each policy use?",
            cats: POL_CATS,
            items: dealItems("m7-pol", POL_BANK, POL_CATS, 5),
            sol: steps("Tax on each unit of the <em>good</em> → Pigovian tax. Price on each unit of <em>pollution</em> → emission charge.",
              "A fixed total of tradable rights to pollute → marketable permits. Giving someone legal ownership so the parties can bargain → property rights."),
          });
        },
      },
      {
        name: "Size of the Pigovian tax from a graph",
        make() {
          for (let g = 0; g < 100; g++) {
            const sc = U.pick(NEG), m = negModel({ kMin: 3, kMax: 8 });
            const yMax = Math.ceil(m.a * 1.05 / 10) * 10;
            if (m.e < yMax * 0.1 || m.c < yMax * 0.06) continue;
            const graph = negGraph(m, { xLabel: `Quantity (${sc.us} per ${sc.per})`, yLabel: `$ per ${sc.u}`, xTicks: [m.Qe, m.Qm], yTicks: [m.Ps, m.Pe], points: [{ x: m.Qe, y: m.Pe, label: "E" }, { x: m.Qe, y: m.Ps, label: "S" }], aria: "externality graph for reading a tax" });
            return Q.num({
              q: `In the market for ${sc.good}, each ${sc.u} causes ${sc.harm}. The graph shows demand (= MSB), supply (= MC) and MSC. Point E is the efficient outcome, and point S is on the supply curve at the same quantity.${graph}What tax per ${sc.u} would move this market to the efficient outcome, in dollars?`,
              answer: m.e, unit: "$",
              traps: traps(m.e, [
                { value: m.Pe, why: "That is the price buyers pay after the tax, not the tax itself." },
                { value: m.Pe - m.Pm, why: `That is only the rise in the price buyers pay (from ${$(m.Pm)} to ${$(m.Pe)}). Sellers bear the rest of the tax.` },
                { value: m.Ps, why: "That is the price sellers keep after the tax." },
              ]),
              sol: steps("A Pigovian tax must make MC + tax = MSC, so it equals the vertical gap between the MSC and MC curves (the marginal external cost).",
                `At the efficient quantity of ${m.Qe}, buyers pay ${$(m.Pe)} (point E) and sellers, on their MC curve, keep ${$(m.Ps)} (point S).`,
                `Tax = ${$(m.Pe)} − ${$(m.Ps)} = <b>${$(m.e)}</b> per ${sc.u}.`),
            });
          }
          return this.make();
        },
      },
      {
        name: "Predict the effects of a Pigovian tax",
        make() {
          const sc = U.pick(NEG);
          return Q.mc({
            q: `The government imposes a tax on each ${sc.of} equal to the marginal external cost it imposes on ${sc.third} (${sc.harm}). Compared with the unregulated market, what happens?`,
            right: "Output falls to the efficient quantity, buyers pay more, and the deadweight loss disappears",
            wrong: [
              { t: "Output falls below the efficient quantity, creating a new deadweight loss", why: "That happens if the tax is set <em>above</em> the marginal external cost." },
              { t: "Output is unchanged; the tax just raises revenue", why: "The tax raises the cost of each unit, so sellers supply less." },
              { t: "Output rises because sellers must cover the tax", why: "A per-unit tax shifts supply up, which lowers the quantity." },
              { t: "Buyers pay less because the external cost is now covered", why: "The tax shifts supply up, so the price buyers pay rises." },
            ],
            rightWhy: "Supply shifts up from MC to MC + tax = MSC, so the market lands where MSB = MSC.",
            sol: steps("A per-unit tax adds to each unit's cost, shifting the supply curve up by the tax.",
              "If the tax equals the marginal external cost, the new supply curve <em>is</em> MSC, so the market reaches MSB = MSC.",
              "Quantity falls to the efficient level, the buyers' price rises, the sellers' price falls, and the overproduction (and its deadweight loss) is gone."),
          });
        },
      },
      {
        name: "A tax set too high or too low",
        make() {
          const sc = U.pick(NEG);
          const mec = U.randInt(4, 15) * 2;
          const high = Math.random() < 0.5;
          const tax = high ? mec + U.randInt(2, 6) * 2 : mec - U.randInt(1, 3) * 2;
          return Q.mc({
            q: `Each ${sc.of} causes a constant ${$(mec)} of damage to ${sc.third} (${sc.harm}). The government imposes a tax of <b>${$(tax)}</b> per ${sc.u}. Compared with the efficient quantity, the market now produces:`,
            right: high ? "Too little" : "Too much, though less than with no tax",
            wrong: high
              ? [{ t: "Too much, though less than with no tax", why: `That would be true of a tax below ${$(mec)}. This tax is above the external cost.` }, { t: "Exactly the efficient quantity", why: "Only a tax equal to the marginal external cost does that." }]
              : [{ t: "Too little", why: `That would be true of a tax above ${$(mec)}. This one is smaller than the external cost.` }, { t: "Exactly the efficient quantity", why: "Only a tax equal to the marginal external cost does that." }],
            keepOrder: true,
            sol: steps("The efficient tax equals the marginal external cost, which makes MC + tax = MSC.",
              high ? `A ${$(tax)} tax is ${$(tax - mec)} too large: MC + tax lies <em>above</em> MSC, so output falls below the efficient level, and units worth more than they cost are not produced.`
                : `A ${$(tax)} tax is ${$(mec - tax)} too small: MC + tax still lies below MSC, so the market still overproduces, just by less than before.`),
          });
        },
      },
      {
        name: "Responding to an emission charge",
        make() {
          const costs = abatementCosts();
          const n = U.randInt(1, 5);
          const charge = costs[n - 1] + (costs[n] - costs[n - 1]) / 2;
          const firm = U.pick(["A smelter", "A paper mill", "A chemical plant", "A power plant", "A cement kiln"]);
          const pol = U.pick([["sulfur dioxide", "ton"], ["carbon dioxide", "ton"], ["nitrogen oxides", "ton"], ["particulate matter", "ton"]]);
          const rows = costs.map((v, i) => [String(i + 1), $(v)]);
          return Q.num({
            q: `${firm} releases ${pol[0]}. The table shows what it would cost to cut each successive ${pol[1]} of emissions per day:${tbl([`${cap(pol[1])} cut`, `Cost of cutting that ${pol[1]}`], rows)}The government sets an <b>emission charge of ${$(charge)}</b> per ${pol[1]} released. How many tons per day will the firm choose to cut?`,
            answer: n, kind: "count", unit: "tons",
            traps: traps(n, [
              { value: n + 1, why: `Cutting unit ${n + 1} would cost ${$(costs[n])}, more than the ${$(charge)} charge, so it is cheaper to pay the charge.` },
              { value: costs.filter(v => v < charge).length === n && n > 1 ? n - 1 : NaN, why: `Unit ${n} costs ${$(costs[n - 1])} to cut, less than the ${$(charge)} charge, so cutting it saves money.` },
              { value: 6, why: "The firm will not cut units that cost more to clean up than the charge it avoids." },
            ]),
            sol: steps("For each unit of pollution, the firm compares the cost of cutting it with the charge it pays if it does not.",
              `Cut while the cost is below ${$(charge)}: ${n === 1 ? `the first ton (${$(costs[0])}) is cheaper` : `${costs.slice(0, n).map($).join(", ")} are all cheaper`} than the charge; the next ton costs ${$(costs[n])}.`,
              `So it cuts <b>${n}</b> and pays the charge on the rest. That is how a charge leads firms to cut pollution wherever it is cheap to do so.`),
          });
        },
      },
      {
        name: "Gains from trading permits",
        make() {
          const [A, B] = U.sample(["Riverside Steel", "Eastgate Power", "Millbrook Paper", "Harbor Chemical", "Summit Cement", "Lakeview Foundry"], 2);
          const ca = U.randInt(2, 8) * 5, cb = ca + U.randInt(3, 10) * 5;
          const N = U.randInt(2, 8) * 10;
          const ask = U.pick(["savings", "min", "max"]);
          const intro = `${A} and ${B} must each cut emissions under a cap-and-trade system. Cutting one ton costs ${A} <b>${$(ca)}</b> and ${B} <b>${$(cb)}</b>, no matter how many tons they cut.`;
          if (ask === "savings") {
            const ans = N * (cb - ca);
            return Q.num({
              q: `${intro} ${B} buys ${N} permits from ${A}, so ${A} cuts ${N} more tons and ${B} cuts ${N} fewer. By how much does this trade lower the <b>total</b> cost of the cleanup, in dollars?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: N * cb, why: `That is what ${B} saves before paying for the permits or counting ${A}'s extra cleanup cost.` },
                { value: N * ca, why: `That is ${A}'s extra cleanup cost. The total saving is what ${B} avoids minus what ${A} spends.` },
                { value: cb - ca, why: `That is the saving on one ton; ${N} tons are shifted.` },
                { value: N * (ca + cb), why: "Subtract the costs: one firm's cleanup replaces the other's." },
              ]),
              sol: steps("The same tons are cut either way, so the saving to society is the difference in cleanup costs on the tons that move. The permit price is just a transfer between the firms.",
                `Each ton moved from ${B} (${$(cb)}) to ${A} (${$(ca)}) saves ${$(cb)} − ${$(ca)} = ${$(cb - ca)}.`,
                `${N} × ${$(cb - ca)} = <b>${$(ans)}</b>.`),
            });
          }
          const ans = ask === "min" ? ca : cb;
          return Q.num({
            q: `${intro} ${ask === "min" ? `What is the <b>lowest</b> price per permit at which ${A} would be willing to sell a permit (and cut one more ton itself)?` : `What is the <b>highest</b> price per permit ${B} would be willing to pay rather than cut one more ton itself?`}`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: ask === "min" ? cb : ca, why: ask === "min" ? `That is ${B}'s cost: the most ${B} would pay, not the least ${A} would accept.` : `That is ${A}'s cost: the least ${A} would accept, not the most ${B} would pay.` },
              { value: (ca + cb) / 2, why: "The midpoint is one possible trading price, but the question asks for a limit of the range." },
              { value: cb - ca, why: "That is the gain from trading one permit, not a price limit." },
            ]),
            sol: steps(`Selling a permit means ${A} must cut one more ton itself; buying one lets ${B} avoid cutting a ton.`,
              `${A} gains if the price is above its cost of ${$(ca)}; ${B} gains if the price is below its cost of ${$(cb)}. Any price between ${$(ca)} and ${$(cb)} benefits both.`,
              `So the answer is <b>${$(ans)}</b>. The low-cost firm (${A}) does the extra cleanup, which is why permits lower the total cost of meeting the cap.`),
          });
        },
      },
      {
        name: "Why marketable permits are efficient",
        make() {
          return Q.mc({
            q: "Economists often favor marketable pollution permits over ordering every firm to cut emissions by the same amount. Why?",
            right: "Trading lets the firms that can cut pollution most cheaply do most of the cutting, so the cap is met at the lowest total cost",
            wrong: [
              { t: "Permits let total pollution rise above the cap whenever firms want", why: "The cap fixes total emissions; trading only changes <em>who</em> pollutes." },
              { t: "Permits make pollution free for the firms that receive them", why: "Using a permit has an opportunity cost: the firm could sell it at the market price." },
              { t: "Under permits, high-cost firms do the most cleanup", why: "High-cost firms buy permits; low-cost firms clean up and sell." },
              { t: "Permits remove the need for any limit on total pollution", why: "The system starts from a cap on the total." },
            ],
            rightWhy: "Every firm faces the permit price as the cost of one more unit of pollution, so cleanup flows to whoever can do it most cheaply.",
            sol: steps("Under a cap, the total amount of pollution is fixed. The question is who does the cleanup.",
              "A firm cuts pollution as long as that is cheaper than buying a permit. Low-cost firms cut more and sell permits; high-cost firms buy them.",
              "The same total is achieved at a lower cost, and the permit price signals the social cost of polluting."),
          });
        },
      },
      {
        name: "Select all: remedies for external costs",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(POL_TF, 5),
            sol: steps("The efficient tax equals the marginal external cost: MC + tax = MSC.",
              "Emission charges price each unit of pollution; permits cap the total and let low-cost cleaners sell to high-cost ones."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Property rights and the Coase theorem
   * ============================================================ */
  const COASE = [
    { P0: "a brewery", P: "the brewery", V0: "the café next door", V: "the café", act: "vent malt-smelling steam toward its neighbor's patio", nuis: "the steam", fix: "install a condenser", harm: "lost patio sales" },
    { P0: "a cattle ranch", P: "the ranch", V0: "the neighboring corn farm", V: "the farm", act: "let its cattle wander into the cornfield", nuis: "the stray cattle", fix: "build a fence", harm: "trampled corn" },
    { P0: "a factory", P: "the factory", V0: "a trout farm downstream", V: "the trout farm", act: "discharge warm water into the stream", nuis: "the warm water", fix: "build a cooling pond", harm: "lost trout" },
    { P0: "a rooftop bar", P: "the bar", V0: "the hotel next door", V: "the hotel", act: "play live music late into the night", nuis: "the music", fix: "install sound baffles", harm: "refunds to sleepless guests" },
    { P0: "a data center", P: "the data center", V0: "a recording studio across the alley", V: "the studio", act: "run loud cooling fans day and night", nuis: "the fan noise", fix: "enclose its fans", harm: "ruined recording sessions" },
    { P0: "an auto-body shop", P: "the body shop", V0: "the bakery next door", V: "the bakery", act: "spray paint with its bay doors open", nuis: "the paint fumes", fix: "install a ventilated spray booth", harm: "spoiled baked goods and lost customers" },
  ];
  function coaseCase() {
    const sc = U.pick(COASE);
    let F, D;
    do { F = U.randInt(2, 24) * 500; D = U.randInt(2, 24) * 500; } while (Math.abs(F - D) < 1000);
    const pRight = Math.random() < 0.5;
    return { ...sc, F, D, fixEff: F < D, pRight };
  }
  function coaseText(cs) {
    return `${cap(cs.P0)} would like to ${cs.act}. Doing so costs ${cs.V0} <b>${$(cs.D)}</b> a year in ${cs.harm}. ${cap(cs.P)} could ${cs.fix} for <b>${$(cs.F)}</b> a year, which would end the problem. The two can bargain at negligible cost.`;
  }
  function rightText(cs, pRight) {
    return pRight ? `the law gives ${cs.P} the right to ${cs.act}` : `the law gives ${cs.V} the right to be free of ${cs.nuis}`;
  }
  /* What happens, in words, for one assignment of rights. */
  function coaseOutcome(cs, pRight) {
    if (cs.fixEff && !pRight) return { key: "fix", t: `${cap(cs.P)} pays to ${cs.fix}, with no payment between the parties` };
    if (cs.fixEff && pRight) return { key: "vpays", t: `${cap(cs.V)} pays ${cs.P} to ${cs.fix}` };
    if (!cs.fixEff && !pRight) return { key: "ppays", t: `${cap(cs.P)} pays ${cs.V} to put up with ${cs.nuis}` };
    return { key: "none", t: `${cap(cs.P)} carries on and no payment is made` };
  }
  const COASE_CLASS = [
    { t: "Two neighbors disagree about a tree that shades one's vegetable garden.", cat: "Private bargaining can work", why: "Two parties, clear property lines, cheap to negotiate." },
    { t: "A quarry's blasting disturbs the one farmhouse next to it.", cat: "Private bargaining can work", why: "Only two parties are involved, so a deal is easy to reach." },
    { t: "A bar's music bothers the single hotel that shares its wall.", cat: "Private bargaining can work", why: "Few parties and low transaction costs." },
    { t: "A beekeeper's bees pollinate the orchard of the one grower next door.", cat: "Private bargaining can work", why: "Two parties can easily contract over the benefit." },
    { t: "A railroad's sparks threaten one farmer's haystacks along the track.", cat: "Private bargaining can work", why: "Two identifiable parties can negotiate." },
    { t: "Exhaust from millions of cars worsens air quality across a metropolitan area.", cat: "Government action needed", why: "Millions of polluters and victims: transaction costs are enormous." },
    { t: "Carbon dioxide from power plants worldwide contributes to climate change.", cat: "Government action needed", why: "Billions of affected people; bargaining is impossible." },
    { t: "Fertilizer runoff from thousands of farms feeds algae blooms in a large lake used by a whole region.", cat: "Government action needed", why: "Too many parties to negotiate with, and each would free ride." },
    { t: "Noise from a city airport affects 40,000 households under the flight path.", cat: "Government action needed", why: "Organizing tens of thousands of households is far too costly." },
    { t: "Smoke from a coal plant drifts over three states.", cat: "Government action needed", why: "Huge numbers of affected people make transaction costs high." },
  ];
  const COASE_TF = [
    { t: "The Coase theorem requires that property rights be clearly defined.", ok: true },
    { t: "The Coase theorem works best when only a few parties are involved.", ok: true },
    { t: "If transaction costs are low, the efficient outcome does not depend on who holds the property right.", ok: true },
    { t: "Who holds the property right affects who pays whom.", ok: true },
    { t: "Transaction costs include the costs of negotiating and enforcing an agreement.", ok: true },
    { t: "According to the Coase theorem, the polluter should always be made to stop polluting.", ok: false, why: "If cleanup costs more than the harm, the efficient outcome is for pollution to continue." },
    { t: "The Coase theorem works well for pollution that affects millions of people.", ok: false, why: "With many parties, transaction costs are high and free riding sets in." },
    { t: "Under the Coase theorem, giving the right to the polluter leads to more pollution than giving it to the victim.", ok: false, why: "The outcome is the same either way; only the payments differ." },
    { t: "Externalities often arise because property rights are well defined.", ok: false, why: "They arise because property rights are <em>absent</em>: nobody owns the air or the river." },
  ];
  const genCoase = STUDY.makeGenerator({
    id: "b251-m7-coase",
    name: "Property rights & the Coase theorem",
    blurb: "Predict the outcome of private bargaining under either assignment of rights, work out who pays whom and how much, and spot when bargaining breaks down.",
    variants: [
      {
        name: "Same outcome under either rule",
        make() {
          const cs = coaseCase();
          const right = cs.fixEff ? `Under both rules, ${cs.P} ends up choosing to ${cs.fix}` : `Under neither rule does ${cs.P} ${cs.fix}`;
          const wrong = [
            { t: `${cap(cs.P)} chooses to ${cs.fix} only if ${cs.V} holds the right`, why: `If ${cs.P} held the right, ${cs.fixEff ? `${cs.V} would pay it to ${cs.fix}, because ${$(cs.F)} &lt; ${$(cs.D)}` : `${cs.V} would not pay the ${$(cs.F)} needed, since the harm is only ${$(cs.D)}`}. The outcome does not depend on the rule.` },
            { t: `${cap(cs.P)} chooses to ${cs.fix} only if it holds the right itself`, why: "Holding the right never makes a party more willing to pay for a fix; and Coase says the outcome is the same either way." },
            cs.fixEff ? { t: `Under neither rule does ${cs.P} ${cs.fix}`, why: `The fix costs ${$(cs.F)}, less than the ${$(cs.D)} harm, so a deal to ${cs.fix} always pays.` }
              : { t: `Under both rules, ${cs.P} ends up choosing to ${cs.fix}`, why: `The fix costs ${$(cs.F)}, more than the ${$(cs.D)} harm, so it is not worth doing under either rule.` },
          ];
          return Q.mc({
            q: `${coaseText(cs)}<br>Compare two legal rules: (1) ${rightText(cs, true)}; (2) ${rightText(cs, false)}. What happens?`,
            right, wrong,
            rightWhy: `${cs.fixEff ? `The fix (${$(cs.F)}) costs less than the harm (${$(cs.D)}), so it happens` : `The fix (${$(cs.F)}) costs more than the harm (${$(cs.D)}), so it does not happen`} whoever holds the right.`,
            sol: steps("With low transaction costs, the parties strike whatever deal maximizes their combined gain. Compare the cost of the fix with the harm.",
              cs.fixEff ? `${$(cs.F)} &lt; ${$(cs.D)}: fixing is cheaper than the harm, so the efficient outcome is for ${cs.P} to ${cs.fix}.` : `${$(cs.F)} &gt; ${$(cs.D)}: the fix costs more than the harm it prevents, so the efficient outcome is to leave things as they are.`,
              "The Coase theorem says bargaining reaches that outcome under either rule; the rule only decides who pays whom."),
          });
        },
      },
      {
        name: "Who pays whom?",
        make() {
          const cs = coaseCase();
          const ans = coaseOutcome(cs, cs.pRight);
          const all = [
            { key: "fix", t: `${cap(cs.P)} pays to ${cs.fix}, with no payment between the parties` },
            { key: "vpays", t: `${cap(cs.V)} pays ${cs.P} to ${cs.fix}` },
            { key: "ppays", t: `${cap(cs.P)} pays ${cs.V} to put up with ${cs.nuis}` },
            { key: "none", t: `${cap(cs.P)} carries on and no payment is made` },
          ];
          const why = {
            fix: cs.pRight ? `${cap(cs.P)} holds the right, so it has no reason to pay for the fix itself.` : `${cap(cs.P)} would rather pay ${cs.V} at least ${$(cs.D)} than spend ${$(cs.F)} on the fix.`,
            vpays: cs.pRight ? `${cap(cs.V)} would have to pay at least ${$(cs.F)}, more than the ${$(cs.D)} harm it would avoid.` : `${cap(cs.V)} holds the right, so it does not need to pay anything.`,
            ppays: cs.pRight ? `${cap(cs.P)} holds the right, so it owes ${cs.V} nothing.` : `Paying ${cs.V} at least ${$(cs.D)} costs more than the ${$(cs.F)} fix, so ${cs.P} just fixes the problem.`,
            none: cs.pRight ? `${cap(cs.V)} would gladly pay between ${$(cs.F)} and ${$(cs.D)} for the fix, so a deal is struck.` : `${cap(cs.V)} holds the right and can stop ${cs.P} unless it is fixed or paid.`,
          };
          return Q.mc({
            q: `${coaseText(cs)}<br>Suppose ${rightText(cs, cs.pRight)}. What is the outcome of bargaining?`,
            right: ans.t,
            wrong: all.filter(o => o.key !== ans.key).map(o => ({ t: o.t, why: why[o.key] })),
            rightWhy: "This is the cheapest way for the parties to deal with the problem given who holds the right.",
            sol: steps("First find the efficient outcome by comparing the cost of the fix with the harm. Then ask who must pay to get there, given who holds the right.",
              cs.fixEff ? `The fix (${$(cs.F)}) is cheaper than the harm (${$(cs.D)}), so it should happen.` : `The fix (${$(cs.F)}) costs more than the harm (${$(cs.D)}), so the efficient outcome is to leave things as they are.`,
              ({
                fix: `${cap(cs.V)} holds the right, so ${cs.P} must deal with it. Fixing (${$(cs.F)}) is cheaper than compensating ${cs.V} (at least ${$(cs.D)}), so <b>${cs.P} pays for the fix</b>.`,
                vpays: `${cap(cs.P)} holds the right, so ${cs.V} must buy the fix: it pays ${cs.P} something between ${$(cs.F)} and ${$(cs.D)}, and <b>${cs.V} pays ${cs.P}</b>.`,
                ppays: `${cap(cs.V)} holds the right, so ${cs.P} must buy permission: it pays ${cs.V} between ${$(cs.D)} and ${$(cs.F)}, which is cheaper than the fix. <b>${cap(cs.P)} pays ${cs.V}</b>.`,
                none: `${cap(cs.P)} holds the right and ${cs.V} will not pay ${$(cs.F)} to avoid a ${$(cs.D)} harm, so <b>nothing changes and no money changes hands</b>.`,
              })[ans.key]),
          });
        },
      },
      {
        name: "Range of bargaining payments",
        make() {
          const cs = coaseCase();
          // force a case where money changes hands
          cs.pRight = cs.fixEff;
          const lo = Math.min(cs.F, cs.D), hi = Math.max(cs.F, cs.D);
          const askMin = Math.random() < 0.5;
          const ans = askMin ? lo : hi;
          const payer = cs.pRight ? cs.V : cs.P, payee = cs.pRight ? cs.P : cs.V;
          const deal = cs.pRight ? `to ${cs.fix}` : `to put up with ${cs.nuis}`;
          return Q.num({
            q: `${coaseText(cs)}<br>Suppose ${rightText(cs, cs.pRight)}, so ${payer} ends up paying ${payee} ${deal}. What is the <b>${askMin ? "smallest" : "largest"}</b> yearly payment that could be part of this deal?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: askMin ? hi : lo, why: askMin ? "That is the upper limit of the range, not the lower." : "That is the lower limit of the range, not the upper." },
              { value: (lo + hi) / 2, why: "The midpoint is one possible deal, but the question asks for a limit of the range." },
              { value: hi - lo, why: "That is the total gain the deal creates, not a payment limit." },
            ]),
            sol: steps(`${cap(payee)} will accept only a payment that covers what the deal costs it; ${payer} will pay at most what the deal saves it.`,
              cs.pRight ? `${cap(cs.P)} must spend ${$(cs.F)} on the fix, so it needs at least ${$(cs.F)}. ${cap(cs.V)} avoids ${$(cs.D)} of harm, so it pays at most ${$(cs.D)}.`
                : `${cap(cs.V)} bears ${$(cs.D)} of harm, so it needs at least ${$(cs.D)}. ${cap(cs.P)} saves the ${$(cs.F)} fix, so it pays at most ${$(cs.F)}.`,
              `Any payment from ${$(lo)} to ${$(hi)} works, so the ${askMin ? "smallest" : "largest"} is <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Gains from bargaining",
        make() {
          const cs = coaseCase();
          cs.pRight = cs.fixEff;
          const ans = Math.abs(cs.D - cs.F);
          const without = cs.pRight ? `${cs.P} carries on and ${cs.V} bears the ${$(cs.D)} harm` : `${cs.P} must spend ${$(cs.F)} to ${cs.fix}`;
          return Q.num({
            q: `${coaseText(cs)}<br>Suppose ${rightText(cs, cs.pRight)}. If the parties could not bargain, ${without}. By how much does a bargain lower the <b>total</b> yearly cost to the two parties combined?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: cs.D, why: "That is the harm alone. Compare the total cost with and without the deal." },
              { value: cs.F, why: "That is the cost of the fix alone. Compare the total cost with and without the deal." },
              { value: cs.D + cs.F, why: "Only one of the two costs is incurred in each outcome, so subtract rather than add." },
            ]),
            sol: steps("Payments between the parties cancel out in the total. What matters is which real cost is incurred: the harm or the fix.",
              cs.pRight ? `Without a deal, the cost is the ${$(cs.D)} harm. With a deal, ${cs.P} will ${cs.fix}, costing ${$(cs.F)}.`
                : `Without a deal, the cost is the ${$(cs.F)} fix. With a deal, ${cs.V} accepts ${cs.nuis}, which costs it ${$(cs.D)}.`,
              `Saving = ${$(Math.max(cs.D, cs.F))} − ${$(Math.min(cs.D, cs.F))} = <b>${$(ans)}</b>, shared between the two through the payment.`),
          });
        },
      },
      {
        name: "What the assignment of rights changes",
        make() {
          const cs = coaseCase();
          return Q.mc({
            q: `${coaseText(cs)}<br>A judge must decide whether ${cs.P} or ${cs.V} holds the right. According to the Coase theorem, what does the judge's decision change?`,
            right: "Who pays whom, but not whether the problem gets fixed",
            wrong: [
              { t: "Whether the problem gets fixed, but not who pays", why: "Bargaining reaches the efficient outcome under either rule; only the payments differ." },
              { t: "Both whether the problem gets fixed and who pays", why: "With low transaction costs, the outcome is independent of who holds the right." },
              { t: "Nothing at all", why: "The rule does change who pays whom, so it matters for the parties' wealth." },
            ],
            keepOrder: false,
            rightWhy: "The rights decide the distribution of costs and payments; the efficient outcome is reached either way.",
            sol: steps("Coase: with clear rights, few parties and low transaction costs, the parties bargain to the efficient outcome.",
              `Here that outcome is ${cs.fixEff ? `for ${cs.P} to ${cs.fix}` : "to leave things as they are"}, because ${cs.fixEff ? `${$(cs.F)} &lt; ${$(cs.D)}` : `${$(cs.F)} &gt; ${$(cs.D)}`}. The judge's decision only determines which side pays.`),
          });
        },
      },
      {
        name: "When does the Coase solution break down?",
        make() {
          const right = U.pick([
            "Smoke from a power plant affects 200,000 people spread over several counties",
            "Runoff from thousands of farms pollutes a river used by dozens of towns",
            "Traffic exhaust in a big city harms the health of millions of residents",
            "Aircraft noise affects tens of thousands of homes under a flight path",
          ]);
          return Q.mc({
            q: "In which situation is private bargaining <b>least</b> likely to solve the externality, so that government action is needed?",
            right,
            wrong: U.sample([
              { t: "A drummer's practice disturbs the one neighbor across the hall", why: "Two parties can negotiate cheaply." },
              { t: "A rancher's cattle stray onto a single neighboring farm", why: "Two parties and clear property lines: classic Coase bargaining." },
              { t: "A bakery's exhaust fans bother the one guesthouse next door", why: "Few parties and low transaction costs, so a deal is easy." },
              { t: "A factory's warm-water discharge harms the one fish farm downstream", why: "Two identifiable parties can strike a deal." },
            ], 3),
            rightWhy: "With so many parties, the costs of organizing and negotiating are huge, and each person hopes others will do the bargaining.",
            sol: steps("The Coase theorem needs clear property rights, few parties and low transaction costs.",
              "When a huge number of people are involved, transaction costs are high and free riding sets in, so government tools (taxes, charges, permits) are used instead."),
          });
        },
      },
      {
        name: "Bargaining or government?",
        make() {
          const cats = ["Private bargaining can work", "Government action needed"];
          return Q.classify({
            q: "For each externality, is private Coase-style bargaining likely to reach the efficient outcome, or is government action likely to be needed?",
            cats,
            items: dealItems("m7-coasecls", COASE_CLASS, cats, 5),
            sol: steps("Count the parties and think about how costly it would be to bring them all to the table.",
              "Few, identifiable parties → bargaining can work. Thousands or millions of parties → high transaction costs, so government steps in."),
          });
        },
      },
      {
        name: "Select all: Coase theorem",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(COASE_TF, 5),
            sol: steps("Conditions: clear property rights, few parties, low transaction costs.",
              "Result: the efficient outcome, whoever holds the right. The right only decides who pays."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Positive externalities
   * ============================================================ */
  const POSTOOL_CATS = ["Public provision", "Private subsidy", "Voucher", "Patent or copyright"];
  const POSTOOL_BANK = [
    { t: "A state university funded mainly by taxpayers enrolls students at low tuition", cat: "Public provision", why: "A public authority, paid by government, produces the service." },
    { t: "The county health department gives free flu shots at its own clinics", cat: "Public provision", why: "Government itself provides the good." },
    { t: "A city runs public libraries open to all residents", cat: "Public provision", why: "A public authority produces the service." },
    { t: "Tax-funded public K–12 schools teach every child in the district", cat: "Public provision", why: "Government-run production of education." },
    { t: "A government-run laboratory carries out basic medical research", cat: "Public provision", why: "The research is produced by a public authority." },
    { t: "The government pays private pharmacies $15 for each vaccine they give", cat: "Private subsidy", why: "A payment to private producers per unit supplied." },
    { t: "Private companies receive a tax credit for each dollar they spend on research and development", cat: "Private subsidy", why: "Government support paid to private producers of knowledge." },
    { t: "A state pays private colleges a grant for each in-state student they enroll", cat: "Private subsidy", why: "The payment goes to the producer (the college)." },
    { t: "Private nursery owners receive a government payment for every tree they sell for street planting", cat: "Private subsidy", why: "The government pays the private seller per unit." },
    { t: "Families receive a certificate they can spend at any approved preschool", cat: "Voucher", why: "A token given to households, usable only for a specified service." },
    { t: "Laid-off workers get a coupon redeemable for courses at any accredited trade school", cat: "Voucher", why: "The household chooses the provider; the token can only buy training." },
    { t: "Low-income households receive a card that pays for one free vaccination at any pharmacy", cat: "Voucher", why: "A token held by households, valid for a specified good." },
    { t: "Parents are handed tutoring credits they can use with any certified tutor", cat: "Voucher", why: "A household-held token for a specified service." },
    { t: "An inventor receives 20 years of exclusive rights to make and sell her new water filter", cat: "Patent or copyright", why: "A patent: a temporary exclusive right that rewards invention." },
    { t: "A novelist's book cannot legally be copied and sold by others for decades", cat: "Patent or copyright", why: "A copyright protects the author's work." },
    { t: "A drug company is the only firm allowed to sell a new medicine for a set number of years", cat: "Patent or copyright", why: "A patent lets the innovator capture more of the benefit of the discovery." },
    { t: "A software firm's code is legally protected against copying", cat: "Patent or copyright", why: "Copyright protection for creative work." },
  ];
  const POS_SPOT = [
    { t: "A homeowner's newly painted house raises the value of the houses around it", ok: true, why: "A benefit spills over to neighbors." },
    { t: "A worker's training makes her coworkers more productive too", ok: true, why: "Knowledge spills over to others." },
    { t: "A vaccinated child lowers the chance that classmates get sick", ok: true, why: "Others benefit without paying." },
    { t: "A beekeeper's bees pollinate a neighbor's apple trees", ok: true, why: "The orchard owner gains without paying." },
    { t: "A firm's published research helps other firms invent new products", ok: true, why: "Knowledge spills over to third parties." },
    { t: "A student enjoys a higher salary because of her degree", ok: false, why: "That benefit goes to the student herself: a private benefit." },
    { t: "A diner enjoys the meal he paid for", ok: false, why: "A private benefit to the buyer." },
    { t: "A factory's smoke dirties the laundry of nearby homes", ok: false, why: "A spillover, but a cost: a negative externality." },
    { t: "A shopper saves money because a store holds a sale", ok: false, why: "That is a price change within a market transaction, not a spillover to a third party." },
    { t: "A neighbor's all-night parties keep the street awake", ok: false, why: "A spillover cost: a negative externality." },
  ];
  function posIntro(sc, m, extra) {
    return `Consider the market for ${sc.what}. With <em>Q</em> measured in ${sc.us} per ${sc.per}, consumers' marginal private benefit (demand) is <b>MB = ${down(m.a, m.b)}</b> and the marginal cost of providing them (supply) is <b>MC = ${up(m.c, m.d)}</b>, both in dollars per ${sc.u}. There are no external costs, but ${sc.spill}: a marginal external benefit of <b>${$(m.e)}</b> per ${sc.u}${extra || ""}.`;
  }
  const genPos = STUDY.makeGenerator({
    id: "b251-m7-posext",
    name: "Positive externalities",
    blurb: "Separate private, external and social benefit, find how far the market underproduces, size the efficient subsidy, and match the government tools.",
    variants: [
      {
        name: "Efficient quantity with an external benefit",
        make() {
          const sc = U.pick(POS), m = posModel();
          return Q.num({
            q: `${posIntro(sc, m)}<br>What is the <b>efficient</b> quantity, in ${sc.us} per ${sc.per}?`,
            answer: m.Qe, unit: sc.us,
            traps: traps(m.Qe, [
              { value: m.Qm, why: "That is the market quantity, where MB = MC. It leaves out the benefit to others." },
              { value: m.Qm - m.k, why: "An external benefit raises MSB above MB, so the efficient quantity is <em>larger</em> than the market's, not smaller." },
              { value: (m.a + m.e - m.c) / m.b, why: "Set MSB equal to MC and collect both <em>Q</em> terms: the slopes add." },
            ]),
            sol: steps("Efficiency needs <b>MSB = MSC</b>. MSB = MB + marginal external benefit; with no external cost, MSC = MC.",
              `MSB = ${down(m.a, m.b)} + ${m.e} = ${down(m.a + m.e, m.b)}.`,
              `${down(m.a + m.e, m.b)} = ${up(m.c, m.d)} → ${m.s}<em>Q</em> = ${m.a + m.e - m.c} → <em>Q</em> = <b>${m.Qe} ${sc.us}</b>. (The market stops at ${m.Qm}.)`),
          });
        },
      },
      {
        name: "How much does the market underproduce?",
        make() {
          const sc = U.pick(POS), m = posModel();
          return Q.num({
            q: `${posIntro(sc, m)}<br>By how many ${sc.us} per ${sc.per} does the unregulated market <b>fall short</b> of the efficient quantity?`,
            answer: m.k, unit: sc.us,
            traps: traps(m.k, [
              { value: m.Qm, why: "That is the market quantity itself; subtract it from the efficient quantity." },
              { value: m.Qe, why: "That is the efficient quantity, not the shortfall." },
              { value: m.e, why: "That is the external benefit in dollars, not a number of units." },
              { value: m.e / m.d, why: "Shifting demand up by the external benefit moves the crossing by e ÷ (b + d), using both slopes." },
            ]),
            sol: steps("Find the market quantity (MB = MC) and the efficient quantity (MSB = MC), then subtract.",
              `Market: ${down(m.a, m.b)} = ${up(m.c, m.d)} → <em>Q</em> = ${m.a - m.c} ÷ ${m.s} = ${m.Qm}.`,
              `Efficient: ${down(m.a + m.e, m.b)} = ${up(m.c, m.d)} → <em>Q</em> = ${m.a + m.e - m.c} ÷ ${m.s} = ${m.Qe}.`,
              `Shortfall = ${m.Qe} − ${m.Qm} = <b>${m.k} ${sc.us}</b>.`),
          });
        },
      },
      {
        name: "Marginal social benefit at the market quantity",
        make() {
          const sc = U.pick(POS), m = posModel();
          return Q.num({
            q: `${posIntro(sc, m)}<br>The unregulated market settles at ${qty(m.Qm, sc)}. What is the <b>marginal social benefit</b> of the last ${sc.u}, in dollars?`,
            answer: m.msbM, unit: "$",
            traps: traps(m.msbM, [
              { value: m.Pm, why: "That is the marginal <em>private</em> benefit (the market price). Add the external benefit." },
              { value: m.e, why: "That is only the external part. MSB = MB + marginal external benefit." },
              { value: m.MCe, why: "That is the marginal cost at the efficient quantity." },
            ]),
            sol: steps("MSB = MB + marginal external benefit, at the quantity in question.",
              `MB at ${m.Qm}: ${m.a} − ${m.b} × ${m.Qm} = ${$(m.Pm)} (equal to MC and the market price there).`,
              `MSB = ${$(m.Pm)} + ${$(m.e)} = <b>${$(m.msbM)}</b>, more than the ${$(m.Pm)} it costs to provide, so more ${sc.us} would be worthwhile.`),
          });
        },
      },
      {
        name: "Size of the efficient subsidy",
        make() {
          const sc = U.pick(POS), m = posModel();
          const tool = U.pick(["subsidy paid to providers", "voucher given to consumers"]);
          return Q.num({
            q: `${posIntro(sc, m)}<br>The government wants the market to reach the efficient quantity of ${qty(m.Qe, sc)} using a per-unit <b>${tool}</b>. At that quantity, providers need ${$(m.MCe)} per ${sc.u} and consumers are willing to pay only ${$(m.MBe)}. How large must the ${tool.split(" ")[0]} be, in dollars per ${sc.u}?`,
            answer: m.e, unit: "$",
            traps: traps(m.e, [
              { value: m.MCe - m.Pm, why: `That is only how much the providers' price rises (from ${$(m.Pm)} to ${$(m.MCe)}). Consumers' price also falls.` },
              { value: m.Pm - m.MBe, why: `That is only how much the consumers' price falls. The ${tool.split(" ")[0]} must cover the whole gap.` },
              { value: m.MCe, why: "That is the providers' price, not the gap." },
            ]),
            sol: steps(`The ${tool.split(" ")[0]} must close the gap between what providers need (MC) and what consumers will pay (MB) at the efficient quantity.`,
              `${$(m.MCe)} − ${$(m.MBe)} = <b>${$(m.e)}</b> per ${sc.u}.`,
              "That equals the marginal external benefit, just as an efficient Pigovian tax equals the marginal external cost."),
          });
        },
      },
      {
        name: "Deadweight loss from underproduction",
        make() {
          const sc = U.pick(POS), m = posModel();
          return Q.num({
            q: `${posIntro(sc, m, `. The market provides ${m.Qm} ${sc.us}, while the efficient quantity is ${m.Qe}`)}<br>What is the <b>deadweight loss</b> per ${sc.per} from the underproduction, in dollars?`,
            answer: m.dwl, unit: "$",
            traps: traps(m.dwl, [
              { value: m.e * m.k, why: "That is a rectangle. The deadweight loss is a triangle, so multiply by ½." },
              { value: m.e * m.Qe / 2, why: "The base is only the missing units (efficient − market), not the whole quantity." },
              { value: m.e * m.Qm, why: "That is the external benefit on all units produced, which society already enjoys." },
            ]),
            sol: steps("The deadweight loss is the triangle between MSB and MSC over the units the market fails to produce.",
              `Base = ${m.Qe} − ${m.Qm} = ${m.k}. Height at the market quantity = MSB − MC = ${$(m.e)} (the external benefit).`,
              `DWL = ½ × ${m.k} × ${m.e} = <b>${$(m.dwl)}</b>.`),
          });
        },
      },
      {
        name: "Classify the government tool",
        make() {
          return Q.classify({
            q: "Which government tool for encouraging goods with external benefits does each policy use?",
            cats: POSTOOL_CATS,
            items: dealItems("m7-postool", POSTOOL_BANK, POSTOOL_CATS, 5),
            sol: steps("Who produces, and who receives the money? Government produces → public provision. Money to private <em>producers</em> → subsidy. Token to <em>households</em> → voucher.",
              "A temporary exclusive right to an invention or creative work → patent or copyright."),
          });
        },
      },
      {
        name: "Why the market underproduces",
        make() {
          const sc = U.pick(POS);
          return Q.mc({
            q: `For ${sc.what}, ${sc.spill}. Without government action, the market provides:`,
            right: "Too few, because buyers weigh only their own benefit against the price",
            wrong: [
              { t: "Too many, because the external benefit raises demand", why: "Buyers do not count benefits to others, so demand reflects only MB." },
              { t: "The efficient amount, because the price reflects everyone's benefit", why: "The price reflects only private benefit; the spillover is left out." },
              { t: "Too few, because sellers' costs include the external benefit", why: "The external benefit is on the benefit side, not in sellers' costs." },
            ],
            rightWhy: "Demand reflects MB only; MSB = MB + external benefit lies above it, so the efficient quantity is larger.",
            sol: steps("Ask whose benefit the buyer counts. Demand = private MB only.",
              "MSB = MB + external benefit lies above demand, so the efficient quantity (MSB = MSC) is larger than the market's.",
              "The market <b>underproduces</b> and there is a deadweight loss."),
          });
        },
      },
      {
        name: "Spot the positive externalities",
        make() {
          return Q.multi({
            q: "Which of these involve a <b>positive externality</b>? Select all that apply.",
            options: selectAll(POS_SPOT, 5),
            sol: steps("A positive externality is a <em>benefit</em> that goes to a <em>third party</em>, someone outside the transaction.",
              "Benefits to the buyer are private benefits; spillover <em>costs</em> are negative externalities."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — The four types of goods
   * ============================================================ */
  const GT = ["Private good", "Public good", "Common resource", "Natural monopoly good"];
  const GOODS_BANK = [
    { t: "A burrito from a food truck", cat: "Private good", why: "Once eaten it is gone (rival), and you must pay to get one (excludable)." },
    { t: "A pair of running shoes", cat: "Private good", why: "Rival and excludable." },
    { t: "A haircut at a salon", cat: "Private good", why: "The stylist's time spent on you is not available to others (rival); you must pay (excludable)." },
    { t: "A gallon of gasoline", cat: "Private good", why: "Rival and excludable." },
    { t: "A seat on a sold-out flight", cat: "Private good", why: "Your seat cannot be someone else's (rival), and only ticket holders board (excludable)." },
    { t: "A hotel room for the night", cat: "Private good", why: "Rival and excludable." },
    { t: "A toll road jammed with traffic at rush hour", cat: "Private good", why: "Crowding makes it rival, and the toll makes it excludable." },
    { t: "A county tornado-warning siren", cat: "Public good", why: "Everyone in range hears it (nonexcludable), and one more listener takes nothing away (nonrival)." },
    { t: "A city fireworks show visible from across town", cat: "Public good", why: "Nonrival and nonexcludable." },
    { t: "Mosquito spraying across an entire county", cat: "Public good", why: "Everyone in the area is protected, paying or not, and protection for one does not reduce it for others." },
    { t: "A flood levee protecting a river town", cat: "Public good", why: "Nonrival and nonexcludable." },
    { t: "A free country highway with little traffic", cat: "Public good", why: "With no congestion it is nonrival, and with no toll it is nonexcludable." },
    { t: "A program that tracks asteroids that could hit Earth", cat: "Public good", why: "Everyone is protected at once, and no one can be left out." },
    { t: "An over-the-air public radio broadcast", cat: "Public good", why: "Anyone with a radio can listen, and listeners do not use it up." },
    { t: "Cod in international waters", cat: "Common resource", why: "A fish caught is gone (rival), but boats are hard to keep out (nonexcludable)." },
    { t: "Groundwater in an aquifer shared by many farms", cat: "Common resource", why: "Water pumped by one farm is unavailable to others; anyone with a well can pump." },
    { t: "A free downtown street jammed at rush hour", cat: "Common resource", why: "Crowding makes it rival, but no one is charged to use it." },
    { t: "Firewood in a public forest open to all", cat: "Common resource", why: "Rival and nonexcludable." },
    { t: "Free street parking on a busy block", cat: "Common resource", why: "A space one driver takes is unavailable to others, and anyone may park." },
    { t: "Grass on an open public grazing range", cat: "Common resource", why: "Grass one herd eats is gone, and ranchers cannot easily be kept out." },
    { t: "A music-streaming subscription", cat: "Natural monopoly good", why: "One more listener does not reduce others' access (nonrival), but non-subscribers are shut out (excludable)." },
    { t: "Cable television", cat: "Natural monopoly good", why: "Nonrival, but only paying households get the signal." },
    { t: "A toll bridge that is rarely crowded", cat: "Natural monopoly good", why: "Without congestion it is nonrival, and the toll makes it excludable." },
    { t: "A news website behind a paywall", cat: "Natural monopoly good", why: "Readers do not use up the articles, but non-payers are blocked." },
    { t: "Satellite radio", cat: "Natural monopoly good", why: "Nonrival, and the signal is scrambled for non-subscribers." },
    { t: "A paid online course with unlimited enrollment", cat: "Natural monopoly good", why: "More students do not reduce the videos available to others, but only payers get in." },
  ];
  const PROPS = {
    "Private good": "Rival and excludable",
    "Public good": "Nonrival and nonexcludable",
    "Common resource": "Rival and nonexcludable",
    "Natural monopoly good": "Nonrival and excludable",
  };
  const GOODS_TF = [
    { t: "A good is nonrival if one person's use does not reduce the amount available to others.", ok: true },
    { t: "A good is nonexcludable if people can benefit from it whether or not they pay.", ok: true },
    { t: "A common resource is rival but nonexcludable.", ok: true },
    { t: "A streaming subscription is an example of a natural monopoly (club) good.", ok: true },
    { t: "Private goods are both rival and excludable.", ok: true },
    { t: "Any good the government provides is a public good.", ok: false, why: "Type depends on rivalry and excludability, not on who provides it." },
    { t: "A public good is rival and nonexcludable.", ok: false, why: "That describes a common resource. Public goods are nonrival and nonexcludable." },
    { t: "Natural monopoly goods are rival and nonexcludable.", ok: false, why: "They are nonrival and excludable." },
    { t: "A good that is free to use must be nonrival.", ok: false, why: "Price says nothing about rivalry: free street parking is rival." },
    { t: "Excludable means only that a good is expensive.", ok: false, why: "Excludable means non-payers can be kept from using it." },
  ];
  const genGoods = STUDY.makeGenerator({
    id: "b251-m7-goods",
    name: "The four types of goods",
    blurb: "Classify goods as private, public, common resources or natural monopoly goods by asking whether they are rival and excludable.",
    variants: [
      {
        name: "Classify the goods",
        make() {
          return Q.classify({
            q: "Classify each good.",
            cats: GT,
            items: dealItems("m7-goods", GOODS_BANK, GT, 5),
            sol: steps("Ask two questions: does one person's use reduce what is left for others (rival)? Can non-payers be kept out (excludable)?",
              "Rival + excludable = private. Nonrival + nonexcludable = public. Rival + nonexcludable = common resource. Nonrival + excludable = natural monopoly good."),
          });
        },
      },
      {
        name: "From properties to type",
        make() {
          const cat = U.pick(GT);
          const p = PROPS[cat];
          const ex = U.pick(GOODS_BANK.filter(i => i.cat === cat));
          return Q.mc({
            q: `A good is <b>${p.toLowerCase()}</b>. Which type of good is it?`,
            right: cat,
            wrong: GT.filter(c => c !== cat).map(c => ({ t: c, why: `A ${c.toLowerCase()} is ${PROPS[c].toLowerCase()}.` })),
            keepOrder: true,
            rightWhy: `${p} defines a ${cat.toLowerCase()}, e.g. ${ex.t.charAt(0).toLowerCase() + ex.t.slice(1)}.`,
            sol: steps("Place the good in the 2 × 2 table: rival or not (rows), excludable or not (columns).",
              `${p} → <b>${cat}</b>. Example: ${ex.t.charAt(0).toLowerCase() + ex.t.slice(1)}.`),
          });
        },
      },
      {
        name: "From good to properties",
        make() {
          const it = U.pick(GOODS_BANK);
          return Q.mc({
            q: `Which pair of properties describes <b>${it.t.charAt(0).toLowerCase() + it.t.slice(1)}</b>?`,
            right: PROPS[it.cat],
            wrong: GT.filter(c => c !== it.cat).map(c => ({ t: PROPS[c], why: `That pair describes a ${c.toLowerCase()}. ${it.why}` })),
            keepOrder: true,
            rightWhy: it.why,
            sol: steps("Rival: does one person's use leave less for others? Excludable: can someone who does not pay be kept from using it?",
              `${it.why} So it is a <b>${it.cat.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Which is NOT this type?",
        make() {
          const cat = U.pick(GT);
          const ins = U.sample(GOODS_BANK.filter(i => i.cat === cat), 3);
          const out = U.pick(GOODS_BANK.filter(i => i.cat !== cat));
          return Q.mc({
            q: `Which of the following is <b>not</b> a ${cat.toLowerCase()}?`,
            right: out.t,
            wrong: ins.map(i => ({ t: i.t, why: `This is a ${cat.toLowerCase()}: ${i.why.charAt(0).toLowerCase() + i.why.slice(1)}` })),
            rightWhy: `It is a ${out.cat.toLowerCase()}. ${out.why}`,
            sol: steps(`A ${cat.toLowerCase()} is ${PROPS[cat].toLowerCase()}. Check each option against both properties.`,
              `“${out.t}” is ${PROPS[out.cat].toLowerCase()}, so it is a ${out.cat.toLowerCase()}, not a ${cat.toLowerCase()}.`),
          });
        },
      },
      {
        name: "Same road, four types",
        make() {
          const road = U.pick(["highway", "bridge", "mountain pass road", "city boulevard"]);
          const items = [
            { t: `A free ${road} with almost no traffic`, cat: "Public good", why: "No crowding → nonrival; no toll → nonexcludable." },
            { t: `A free ${road} jammed with traffic`, cat: "Common resource", why: "Crowding → rival; no toll → nonexcludable." },
            { t: `A tolled ${road} with almost no traffic`, cat: "Natural monopoly good", why: "No crowding → nonrival; toll → excludable." },
            { t: `A tolled ${road} jammed with traffic`, cat: "Private good", why: "Crowding → rival; toll → excludable." },
          ];
          return Q.classify({
            q: `The same ${road} can be a different type of good depending on traffic and tolls. Classify each version.`,
            cats: GT, items,
            sol: steps("Congestion decides rivalry: on an empty road, one more car takes nothing from anyone; on a jammed road, it slows everyone.",
              "A toll decides excludability: non-payers can be kept off a tolled road but not a free one."),
          });
        },
      },
      {
        name: "What does nonrival / nonexcludable mean?",
        make() {
          const askRival = Math.random() < 0.5;
          return askRival ? Q.mc({
            q: "A good is <b>nonrival</b> when:",
            right: "One person's use of it does not reduce the amount available to others",
            wrong: [
              { t: "Nobody can be kept from using it", why: "That is nonexcludable." },
              { t: "It is provided free of charge", why: "Price does not determine rivalry; free street parking is rival." },
              { t: "It is produced by the government", why: "Who provides a good does not decide its type." },
            ],
            sol: steps("Rivalry is about <em>using up</em>: does my use leave less for you?",
              "If not, the good is nonrival, like a broadcast or an online video."),
          }) : Q.mc({
            q: "A good is <b>nonexcludable</b> when:",
            right: "People can benefit from it whether or not they pay",
            wrong: [
              { t: "One person's use does not reduce what is available to others", why: "That is nonrival." },
              { t: "Its price is very low", why: "A cheap good can still be withheld from non-payers." },
              { t: "It is available only to members", why: "That describes an excludable good." },
            ],
            sol: steps("Excludability is about <em>shutting out</em> non-payers.",
              "If a non-payer cannot be stopped from benefiting (a flood levee, a tornado siren), the good is nonexcludable."),
          });
        },
      },
      {
        name: "Select all: rival or nonexcludable goods",
        make() {
          const askRival = Math.random() < 0.5;
          const pool = U.sample(GOODS_BANK, 5);
          const isOk = i => askRival ? (i.cat === "Private good" || i.cat === "Common resource") : (i.cat === "Public good" || i.cat === "Common resource");
          if (!pool.some(isOk)) pool[0] = U.pick(GOODS_BANK.filter(i => isOk(i) && !pool.includes(i)));
          if (pool.every(isOk)) pool[4] = U.pick(GOODS_BANK.filter(i => !isOk(i) && !pool.includes(i)));
          return Q.multi({
            q: `Which of these goods are <b>${askRival ? "rival" : "nonexcludable"}</b>? Select all that apply.`,
            options: pool.map(i => ({ t: i.t, ok: isOk(i), why: `${i.cat}: ${i.why.charAt(0).toLowerCase() + i.why.slice(1)}` })),
            sol: steps(askRival ? "Rival goods are private goods and common resources: one person's use leaves less for others." : "Nonexcludable goods are public goods and common resources: non-payers cannot be kept out.",
              "Check each good on that one property only; ignore the other one."),
          });
        },
      },
      {
        name: "Select all: types of goods",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(GOODS_TF, 5),
            sol: steps("Two properties, four types: private (rival, excludable), public (nonrival, nonexcludable), common resource (rival, nonexcludable), natural monopoly (nonrival, excludable).",
              "Who provides a good and what it costs do not decide its type."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Public goods and free riders
   * ============================================================ */
  const PUB = [
    { good: "streetlights on a block", u: "streetlight", us: "streetlights", who: "households" },
    { good: "hours of nightly neighborhood security patrol", u: "hour", us: "hours", who: "households" },
    { good: "minutes of a lakeside fireworks show", u: "minute", us: "minutes", who: "cabin owners" },
    { good: "mosquito-spraying passes over a valley", u: "pass", us: "passes", who: "farms" },
    { good: "acres of a protected wetland that filters the town's water", u: "acre", us: "acres", who: "towns" },
    { good: "storm-warning sirens in a county", u: "siren", us: "sirens", who: "townships" },
  ];
  const NAMES3 = () => U.sample(PEOPLE, 3);
  /* Three decreasing MB schedules for quantities 1–5 and a constant MC that
   * falls strictly between MSB(q*) and MSB(q* + 1). */
  function pubSchedule() {
    for (let g = 0; g < 500; g++) {
      const sc = U.pick(PUB);
      const names = sc.who === "households" ? NAMES3().map(n => `the ${n} household`) : sc.who === "cabin owners" ? NAMES3() : sc.who === "farms" ? U.sample(["Oak Hill Farm", "Cedar Creek Farm", "Two Rivers Farm", "Hollow Pine Farm", "Red Barn Farm"], 3) : sc.who === "towns" ? U.sample(["Ashford", "Brookline", "Clearwater", "Dunmore", "Elkton"], 3) : U.sample(["Ashford Township", "Brook Township", "Cole Township", "Dale Township"], 3);
      const mbs = [0, 1, 2].map(() => {
        const step = U.randInt(1, 4) * U.pick([1, 2, 5]);
        const start = step * U.randInt(5, 8) + U.randInt(0, 3);
        return [1, 2, 3, 4, 5].map(q => Math.max(0, start - step * (q - 1)));
      });
      const msb = [0, 1, 2, 3, 4].map(i => mbs[0][i] + mbs[1][i] + mbs[2][i]);
      if (!msb.every((v, i) => i === 0 || v < msb[i - 1])) continue;
      const qs = U.randInt(2, 4);
      const hi = msb[qs - 1], lo = msb[qs];
      if (hi - lo < 3) continue;
      const mc = U.randInt(lo + 1, hi - 1);
      const maxSingle = Math.max(...mbs.map(r => r[0]));
      return { sc, names, mbs, msb, qs, mc, maxSingle };
    }
    return pubSchedule();
  }
  function pubTable(p, showMsb) {
    const head = [cap(p.sc.us)].concat(p.names.map(n => `${cap(n)}'s MB`)).concat(showMsb ? ["MSB"] : []);
    return tbl(head, [0, 1, 2, 3, 4].map(i => [String(i + 1)].concat(p.mbs.map(r => $(r[i]))).concat(showMsb ? [$(p.msb[i])] : [])));
  }
  const PUB_TF = [
    { t: "The marginal social benefit of a public good is the vertical sum of individual marginal benefits.", ok: true },
    { t: "Additional people can enjoy a public good at no additional cost.", ok: true },
    { t: "A private firm trying to sell a public good would find that few people buy it.", ok: true },
    { t: "Because the government can tax everyone who benefits, public provision overcomes the free-rider problem.", ok: true },
    { t: "The efficient quantity of a public good is where marginal social benefit equals marginal social cost.", ok: true },
    { t: "It is hard to charge people for a public good according to how much they use it.", ok: true },
    { t: "The marginal social benefit of a public good is found by adding quantities horizontally at each price.", ok: false, why: "That is how market demand for a <em>private</em> good is built. For a public good, add MBs vertically at each quantity." },
    { t: "Free riders cause public goods to be overproduced.", ok: false, why: "Free riders refuse to pay, so too little is produced." },
    { t: "The efficient quantity of a public good is where the largest single person's MB equals MC.", ok: false, why: "Every unit benefits everyone, so use the sum of all MBs." },
    { t: "A public good is rival: each extra user reduces what others get.", ok: false, why: "Public goods are nonrival." },
  ];
  const genPublic = STUDY.makeGenerator({
    id: "b251-m7-public",
    name: "Public goods & free riders",
    blurb: "Add marginal benefits vertically, find the efficient quantity of a public good, and explain why free riders leave private markets short.",
    variants: [
      {
        name: "Marginal social benefit by vertical summation",
        make() {
          const p = pubSchedule();
          const i = U.randInt(1, 5) - 1;
          const ans = p.msb[i];
          const rowSum = p.mbs[0].reduce((a, b) => a + b, 0);
          return Q.num({
            q: `Three ${p.sc.who} share the benefit of ${p.sc.good}, a public good. Their marginal benefits (dollars per year) are:${pubTable(p, false)}What is the <b>marginal social benefit</b> of the <b>${["1st", "2nd", "3rd", "4th", "5th"][i]} ${p.sc.u}</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: Math.max(p.mbs[0][i], p.mbs[1][i], p.mbs[2][i]), why: "That is only the largest single MB. Every unit serves all three, so add all three." },
              { value: ans / 3, why: "That is the average MB. The social value is the total, not the average." },
              { value: rowSum, why: `That adds ${p.names[0]}'s MBs across different quantities. Add the three MBs at the <em>same</em> quantity.` },
              { value: i > 0 ? p.msb.slice(0, i + 1).reduce((a, b) => a + b, 0) : NaN, why: "That is the total benefit of all units so far, not the marginal benefit of this one." },
            ]),
            sol: steps("A public good is nonrival: each unit is enjoyed by everyone at once. So its value is the <b>vertical sum</b> of MBs at that quantity.",
              `At ${i + 1} ${i === 0 ? p.sc.u : p.sc.us}: ${p.mbs.map(r => $(r[i])).join(" + ")}.`,
              `MSB = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Efficient quantity of a public good",
        make() {
          const p = pubSchedule();
          const singles = p.mbs.map(r => r.filter(v => v > p.mc).length);
          const horiz = singles.reduce((a, b) => a + b, 0);
          return Q.num({
            q: `Three ${p.sc.who} share the benefit of ${p.sc.good}, a public good. Their marginal benefits (dollars per year) are below, and each ${p.sc.u} costs <b>${$(p.mc)}</b> a year to provide (MSC).${pubTable(p, false)}What is the <b>efficient</b> number of ${p.sc.us}?`,
            answer: p.qs, unit: p.sc.us, kind: "count",
            traps: traps(p.qs, [
              { value: Math.max(...singles), why: "That is what the keenest single user would choose. Each unit serves all three, so compare the <em>sum</em> of MBs with MC." },
              { value: horiz, why: "That adds the quantities each would buy alone (a horizontal sum), which is how private-good demand is built, not public-good MSB." },
              { value: p.qs + 1, why: `At ${p.qs + 1}, MSB = ${$(p.msb[p.qs])}, below the ${$(p.mc)} cost.` },
            ]),
            sol: steps("Build MSB by adding the three MBs at each quantity (vertical sum). Then provide units while MSB ≥ MSC.",
              `MSB: ${p.msb.map((v, j) => `${j + 1} → ${$(v)}`).join(", ")}.`,
              `MSB exceeds ${$(p.mc)} up to ${p.qs} ${p.sc.us} (${$(p.msb[p.qs - 1])}) but not at ${p.qs + 1} (${$(p.msb[p.qs])}), so the efficient quantity is <b>${p.qs}</b>.`),
          });
        },
      },
      {
        name: "Add one more unit?",
        make() {
          const p = pubSchedule();
          const i = U.pick([p.qs - 1, p.qs]); // a unit just worth it, or just not worth it
          const worth = p.msb[i] > p.mc;
          const top = Math.max(p.mbs[0][i], p.mbs[1][i], p.mbs[2][i]);
          return Q.mc({
            q: `Three ${p.sc.who} share the benefit of ${p.sc.good}. For the <b>${["1st", "2nd", "3rd", "4th", "5th"][i]} ${p.sc.u}</b>, their marginal benefits are ${p.mbs.map((r, j) => `${$(r[i])} (${p.names[j]})`).join(", ")}. That ${p.sc.u} costs ${$(p.mc)} a year. Should it be provided?`,
            right: worth ? `Yes: the combined benefit of ${$(p.msb[i])} exceeds the ${$(p.mc)} cost` : `No: the combined benefit of ${$(p.msb[i])} is less than the ${$(p.mc)} cost`,
            wrong: worth ? [
              top < p.mc ? { t: `No: no single ${p.sc.who.replace(/s$/, "")} values it at ${$(p.mc)} or more`, why: "Each unit serves all three, so compare the sum of MBs with the cost, not any one MB." }
                : { t: `No: only one of the three values it at more than ${$(p.mc)}`, why: "The test is the sum of all three MBs against the cost, not how many individuals clear it." },
              { t: `No: the average benefit of ${$(U.round(p.msb[i] / 3, 2))} is below the cost`, why: "The social value is the total of everyone's MB, not the average." },
              { t: `Yes, but only if ${top === p.mbs[0][i] ? p.names[0] : top === p.mbs[1][i] ? p.names[1] : p.names[2]} pays the whole cost`, why: "Efficiency depends on total MB versus cost, not on who pays." },
            ] : [
              { t: `Yes: the largest single benefit, ${$(top)}, is what matters`, why: "No: the sum of MBs is what matters, and it is below the cost." },
              { t: `Yes: public goods should always be provided when anyone benefits`, why: "A unit is worth providing only if total MB is at least its cost." },
              { t: `Yes: the combined benefit of ${$(p.msb[i] + p.mc)} exceeds the cost`, why: `Add the three MBs: the total is ${$(p.msb[i])}.` },
            ],
            sol: steps("For a public good, the marginal social benefit of a unit is the sum of everyone's MB for that unit.",
              `${p.mbs.map(r => $(r[i])).join(" + ")} = ${$(p.msb[i])} ${worth ? "&gt;" : "&lt;"} ${$(p.mc)}.`,
              worth ? `Provide it, even though no single user would pay ${$(p.mc)} alone; that is why private markets underprovide public goods.` : "Do not provide it: it would cost more than it is worth to the three together."),
          });
        },
      },
      {
        name: "Spot the free rider",
        make() {
          const s = U.pick([
            { q: "A neighborhood raises money for a private security patrol that drives past every house. Which resident is a free rider?", r: "Dana, who declines to contribute but still enjoys the safer streets", w: ["Eli, who contributes and enjoys the safer streets", "-Fay, who moves out of the neighborhood before the patrol starts", "Gus, who contributes even though he is rarely home"] },
            { q: "A public radio station asks listeners for donations. Which person is a free rider?", r: "Hal, who listens every day but never donates", w: ["Ivy, who donates and listens every day", "Jon, who donates although he rarely listens", "-Kim, who never listens and never donates"] },
            { q: "Farmers in a valley are asked to chip in for aerial spraying against locusts that would protect every farm. Which farmer is a free rider?", r: "A farmer who refuses to pay, knowing her fields will be protected anyway", w: ["A farmer who pays his share and is protected", "A farmer who pays extra because his crop is most at risk", "-A farmer outside the valley who neither pays nor benefits"] },
            { q: "Cabin owners around a lake fund a fireworks show visible from every dock. Who is a free rider?", r: "An owner who watches from her dock but refuses to chip in", w: ["An owner who chips in and watches", "An owner who chips in but is away that weekend", "-A visitor to a different lake who never sees the show"] },
          ]);
          return Q.mc({
            q: s.q,
            right: s.r,
            wrong: s.w.map(t => t.startsWith("-") ? { t: t.slice(1), why: "This person does not benefit from the good, so there is nothing to ride free on." } : { t, why: "This person pays a share, so they are not riding free." }),
            rightWhy: "A free rider enjoys the benefit of a public good while leaving others to pay for it.",
            sol: steps("A free rider must both (1) benefit from the good and (2) not pay for it.",
              "Because the good is nonexcludable, the non-payer cannot be shut out, so the incentive to pay is weak."),
          });
        },
      },
      {
        name: "Why private markets underprovide public goods",
        make() {
          const sc = U.pick(PUB);
          return Q.mc({
            q: `A private company offers to supply ${sc.good} if enough ${sc.who} pay. Why is it likely to fail, even if the total benefit exceeds the cost?`,
            right: "Each one can enjoy the good without paying once it is provided, so many wait for others to pay",
            wrong: [
              { t: "Public goods are always too expensive to produce", why: "The problem is not cost; the total benefit can exceed the cost." },
              { t: "Each extra user raises the cost of providing the good", why: "Public goods are nonrival: extra users cost nothing extra." },
              { t: "People do not value public goods", why: "They do, often a lot. They just would rather someone else pay." },
              { t: "The company would produce too much and drive the price to zero", why: "The problem is too little production, not too much." },
            ],
            rightWhy: "Nonexcludability creates free riders, so voluntary payments fall short and the good is underprovided.",
            sol: steps("Because a public good is nonexcludable, non-payers cannot be shut out.",
              "Each person's best move is to let others pay: the free-rider problem. Too little (often none) is produced privately.",
              "Public provision, paid for with taxes, solves this by making everyone contribute."),
          });
        },
      },
      {
        name: "Vertical vs horizontal summation",
        make() {
          const pub = Math.random() < 0.5;
          return Q.mc({
            q: pub ? "How is the marginal social benefit curve of a <b>public</b> good built from individual marginal benefit curves?"
              : "How is the market demand curve for a <b>private</b> good built from individual demand curves?",
            right: pub ? "Add the marginal benefits of all individuals at each quantity (vertical summation)" : "Add the quantities each person demands at each price (horizontal summation)",
            wrong: pub ? [
              { t: "Add the quantities each person wants at each price (horizontal summation)", why: "That builds demand for a <em>private</em> good, where each unit goes to one person." },
              { t: "Use the marginal benefit of the person who values it most", why: "Every unit benefits everyone, so all MBs count." },
              { t: "Average the individual marginal benefits at each quantity", why: "The social value is the sum, not the average." },
            ] : [
              { t: "Add the marginal benefits of all individuals at each quantity (vertical summation)", why: "That is for public goods, where each unit is enjoyed by everyone at once." },
              { t: "Use the demand curve of the largest buyer", why: "Market demand includes every buyer." },
              { t: "Average the quantities demanded at each price", why: "Market quantity is the total, not the average." },
            ],
            rightWhy: pub ? "Each unit of a public good is enjoyed by everyone at once, so its value is the sum of everyone's MB." : "Each unit of a private good goes to one buyer, so we add up how many units all buyers want at a given price.",
            sol: steps("Ask whether one unit can serve many people at once (nonrival) or only one person (rival).",
              pub ? "Public good: one unit serves everyone → add MBs <b>vertically</b> at each quantity." : "Private good: one unit serves one buyer → add quantities <b>horizontally</b> at each price."),
          });
        },
      },
      {
        name: "Select all: public goods",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(PUB_TF, 5),
            sol: steps("Public goods: nonrival, nonexcludable, extra users cost nothing, hard to charge by use → free riders → underprovision.",
              "MSB = vertical sum of MBs; efficient where MSB = MSC; public provision with taxes overcomes free riding."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Common resources and the tragedy of the commons
   * ============================================================ */
  const CR_CATS = ["Property rights", "Quota", "Individual transferable quota (ITQ)"];
  const CR_BANK = [
    { t: "A government sells a coastal oyster bed to a single company, which now controls who harvests it", cat: "Property rights", why: "Turning the commons into private property makes the owner bear the cost of overuse." },
    { t: "A village divides its common woodland into family-owned plots", cat: "Property rights", why: "Each family now owns its plot and bears the cost of over-cutting it." },
    { t: "A shared pasture is fenced and deeded to one rancher", cat: "Property rights", why: "Ownership gives the rancher reason to avoid overgrazing." },
    { t: "Each lake fisher is given exclusive, permanent ownership of a marked section of the lake", cat: "Property rights", why: "Private ownership of the resource." },
    { t: "Regulators cap the total cod catch this year at 20,000 tons, after which the season closes", cat: "Quota", why: "A legal limit on total use, without tradable shares." },
    { t: "A water board limits total pumping from an aquifer to 5,000 acre-feet a year", cat: "Quota", why: "A cap on total use of the common resource." },
    { t: "Hunters may take no more than 300 deer in a state forest this season, in total", cat: "Quota", why: "A total limit on use." },
    { t: "Each fishing boat may land 40 tons this season and may sell that right to another boat", cat: "Individual transferable quota (ITQ)", why: "A personal quota that can be transferred: an ITQ." },
    { t: "Farms receive yearly pumping allowances from the aquifer that they can lease to other farms", cat: "Individual transferable quota (ITQ)", why: "Individual, tradable limits on use." },
    { t: "Lobster crews get individual catch shares that can be bought and sold on an exchange", cat: "Individual transferable quota (ITQ)", why: "Tradable individual quotas." },
    { t: "Ranchers hold grazing allotments on public land and may transfer them to other ranchers", cat: "Individual transferable quota (ITQ)", why: "An individual, transferable right to a share of use." },
  ];
  const OSTROM_YES = [
    "Clearly defined boundaries that keep out people who have no right to use the resource",
    "Rules about using and maintaining the resource that are adapted to local conditions",
    "Most users can take part in making and changing the rules",
    "Monitors who are users themselves or are accountable to the users",
    "Graduated sanctions: penalties that start small and rise for repeat violations",
    "Cheap and easy-to-reach ways of resolving conflicts",
    "Higher-level authorities recognize the community's right to set its own rules",
    "For large resources, several nested layers of organization with small local groups at the base",
  ];
  const OSTROM_NO = [
    { t: "Open access for anyone who wants to use the resource", why: "Ostrom stresses clearly defined boundaries that keep outsiders out." },
    { t: "A single harsh penalty, such as a lifetime ban, for any first offense", why: "Ostrom found that graduated sanctions work better." },
    { t: "Rules written by a distant agency with no input from users", why: "Ostrom stresses that users help make the rules and that rules fit local conditions." },
    { t: "Monitors who are outsiders and answer to no one in the community", why: "Monitors should be users or accountable to them." },
    { t: "Disputes settled only through slow, expensive national courts", why: "Conflict resolution should be cheap and easy to reach." },
  ];
  const COMMONS_TF = [
    { t: "A common resource is rival and nonexcludable.", ok: true },
    { t: "The tragedy of the commons arises because no user has an incentive to conserve the resource.", ok: true },
    { t: "A small fish stock has a small sustainable catch.", ok: true },
    { t: "If the efficient total of ITQs is issued, their price makes users face a marginal cost equal to MSB at the efficient quantity.", ok: true },
    { t: "Assigning property rights turns a common resource into private property.", ok: true },
    { t: "Lobbying by resource users can make efficient policies such as ITQs hard to adopt.", ok: true },
    { t: "A common resource tends to be underused because nobody owns it.", ok: false, why: "It is overused: each user ignores the cost their use imposes on others." },
    { t: "The tragedy of the commons happens only when users are ignorant of the danger.", ok: false, why: "Even well-informed users overuse a commons, because restraint by one just leaves more for others." },
    { t: "A quota works best when it is set well above the efficient quantity.", ok: false, why: "A quota should be set at the efficient quantity." },
    { t: "Assigning property rights is always feasible for any common resource.", ok: false, why: "It is often impractical, e.g. for migrating fish or the atmosphere." },
  ];
  const genCommons = STUDY.makeGenerator({
    id: "b251-m7-commons",
    name: "Common resources & the tragedy of the commons",
    blurb: "Explain why open-access resources are overused, compute sustainable and efficient use, and choose among property rights, quotas and ITQs.",
    variants: [
      {
        name: "Why the commons is overused",
        make() {
          const r = U.pick(COMMONS);
          return Q.mc({
            q: `Any of the ${r.users} using ${r.res} may take as much as it likes. Why does ${r.act} tend to exceed the efficient level?`,
            right: `Each user gets the full gain from what it takes but bears only a small share of the cost (${r.dep}), most of which falls on the others`,
            wrong: [
              { t: "The users do not understand that the resource can run out", why: "Even users who understand the danger overuse it: holding back alone just leaves more for others." },
              { t: "The resource is nonrival, so using it costs nobody anything", why: "A common resource is rival: what one takes is gone for the others." },
              { t: "Prices for the resource are set too high", why: "There is no price on access to an open commons; that is part of the problem." },
              { t: "Users can be excluded, so they rush to use it before they are kicked out", why: "A common resource is nonexcludable." },
            ],
            rightWhy: "Each user ignores the cost its use imposes on the other users, so total use runs past the point where MSB = MSC.",
            sol: steps("A common resource is rival (one user's take is gone for others) but nonexcludable (no one can be kept out).",
              `Each user weighs its own gain against its own cost. The cost of ${r.dep} is spread over everyone, so each user ignores most of it.`,
              "Result: use goes past the efficient level. That is the <b>tragedy of the commons</b>, an externality among users."),
          });
        },
      },
      {
        name: "Identify the tragedy of the commons",
        make() {
          const right = U.pick([
            "Herders keep adding goats to an open hillside until the grass is stripped bare",
            "Anyone may pump from a shared aquifer, and the water table falls a little more every year",
            "Unlicensed boats fish an open bay until the catch per boat collapses",
            "Visitors pick wild ginseng in a public forest until almost none is left",
          ]);
          return Q.mc({
            q: "Which situation is an example of the <b>tragedy of the commons</b>?",
            right,
            wrong: U.sample([
              { t: "People listen to a public radio broadcast without donating", why: "That is free riding on a public good, which is nonrival: listening does not use the broadcast up." },
              { t: "A farmer overgrazes her own private pasture and loses money", why: "A privately owned pasture is excludable; the owner bears the cost of overuse herself." },
              { t: "A popular bakery sells out of bread by noon", why: "Bread is a private good sold in a market; selling out is not overuse of a commons." },
              { t: "A factory's smoke harms nearby homes", why: "That is a negative externality, but not overuse of a shared, open-access resource." },
              { t: "Subscribers stream a show at the same time without slowing each other down", why: "Streaming is nonrival and excludable, not a common resource." },
            ], 3),
            rightWhy: "A rival, nonexcludable resource is being overused and depleted because no one can be kept out.",
            sol: steps("Look for a resource that is rival (gets used up) and nonexcludable (open to all).",
              "Overuse and depletion of such a resource is the tragedy of the commons. A public good is nonrival, and a private resource is excludable, so neither fits."),
          });
        },
      },
      {
        name: "Classify the solution",
        make() {
          return Q.classify({
            q: "Which method for achieving efficient use of a common resource does each policy use?",
            cats: CR_CATS,
            items: dealItems("m7-cr", CR_BANK, CR_CATS, 5),
            sol: steps("Does someone come to <em>own</em> the resource? → property rights.",
              "Is there a limit on total use? If the individual shares can be bought and sold → ITQ; if it is just a total limit → quota."),
          });
        },
      },
      {
        name: "Sustainable catch",
        make() {
          const stock = U.randInt(8, 40) * 250;
          const g = U.pick([5, 8, 10, 12, 15, 20, 25]);
          const sust = stock * g / 100;
          const askNext = Math.random() < 0.5;
          const fish = U.pick(["walleye in a lake", "trout in a reservoir", "salmon in a bay", "haddock on an offshore bank"]);
          if (askNext) {
            const over = sust + U.randInt(1, 8) * 25;
            const ans = stock + sust - over;
            return Q.num({
              q: `A stock of ${fish} weighs ${U.fmt(stock)} tons. Each year births and growth add new fish equal to ${g}% of the stock's weight. This year, boats catch <b>${U.fmt(over)} tons</b>. What will the stock weigh next year, in tons?`,
              answer: ans, unit: "tons",
              traps: traps(ans, [
                { value: stock - over, why: `You left out this year's growth of ${U.fmt(sust)} tons.` },
                { value: stock + sust, why: "That is the stock with growth but before the catch is taken out." },
                { value: stock, why: "The stock stays the same only if the catch equals the sustainable catch." },
              ]),
              sol: steps("Next year's stock = this year's stock + growth − catch.",
                `Growth = ${g}% × ${U.fmt(stock)} = ${U.fmt(sust)} tons (the sustainable catch).`,
                `${U.fmt(stock)} + ${U.fmt(sust)} − ${U.fmt(over)} = <b>${U.fmt(ans)} tons</b>. Catching more than the sustainable amount shrinks the stock, which shrinks next year's sustainable catch too.`),
            });
          }
          return Q.num({
            q: `A stock of ${fish} weighs ${U.fmt(stock)} tons. Each year births and growth add new fish equal to ${g}% of the stock's weight. What is the <b>sustainable catch</b>, the largest catch that leaves the stock the same size year after year, in tons?`,
            answer: sust, unit: "tons",
            traps: traps(sust, [
              { value: stock, why: "Catching the whole stock would wipe it out. Only the yearly growth can be taken sustainably." },
              { value: stock + sust, why: "That is the stock plus a year's growth, not the catch." },
              { value: g, why: "That is the growth rate, not the tonnage." },
            ]),
            sol: steps("The stock stays the same size if the catch just equals the new fish added each year.",
              `Growth = ${g}% × ${U.fmt(stock)} = <b>${U.fmt(sust)} tons</b>. That is the sustainable catch; a smaller stock would give a smaller one.`),
          });
        },
      },
      {
        name: "Open-access use vs efficient use",
        make() {
          const r = U.pick(COMMONS), m = negModel();
          const askGap = Math.random() < 0.5;
          const ans = askGap ? m.k : m.Qe;
          return Q.num({
            q: `For ${r.res}, with <em>Q</em> in ${r.us} per ${r.per}, the marginal social benefit is <b>MSB = ${down(m.a, m.b)}</b> and each user's marginal private cost is <b>MC = ${up(m.c, m.d)}</b> (dollars per unit). Each unit taken also imposes a cost of <b>${$(m.e)}</b> on other users through ${r.dep}. ${askGap ? `Under open access, by how many ${r.us} does use exceed the efficient level?` : `What is the <b>efficient</b> level of use, in ${r.us}?`}`,
            answer: ans, unit: r.us,
            traps: traps(ans, askGap ? [
              { value: m.Qm, why: "That is the open-access level itself; subtract the efficient level." },
              { value: m.Qe, why: "That is the efficient level, not the overuse." },
              { value: m.e, why: "That is the cost per unit in dollars, not a quantity." },
            ] : [
              { value: m.Qm, why: "That is the open-access level, where MSB = private MC. It ignores the cost imposed on other users." },
              { value: m.Qm + m.k, why: "Counting the extra cost should <em>lower</em> the efficient level, not raise it." },
            ]),
            sol: steps("Open access: users stop where MSB = their own MC. Efficient: MSB = MSC, where MSC = MC + the cost imposed on others.",
              `Open access: ${down(m.a, m.b)} = ${up(m.c, m.d)} → <em>Q</em> = ${m.Qm}. Efficient: ${down(m.a, m.b)} = ${up(m.c + m.e, m.d)} → <em>Q</em> = ${m.Qe}.`,
              askGap ? `Overuse = ${m.Qm} − ${m.Qe} = <b>${m.k} ${r.us}</b>.` : `Efficient use = <b>${m.Qe} ${r.us}</b>; a quota or ITQs totaling ${m.Qe} would achieve it.`),
          });
        },
      },
      {
        name: "Price of an individual transferable quota",
        make() {
          const r = U.pick(COMMONS), m = negModel();
          return Q.num({
            q: `For ${r.res}, with <em>Q</em> in ${r.us} per ${r.per}, the marginal social benefit is <b>MSB = ${down(m.a, m.b)}</b> and users' marginal private cost is <b>MC = ${up(m.c, m.d)}</b>. Each unit taken imposes <b>${$(m.e)}</b> of cost on other users (${r.dep}), so the efficient level is ${U.fmt(m.Qe)} ${r.us}. The authority issues individual transferable quotas (ITQs) for exactly that total. At what price per ${r.u} will an ITQ trade?`,
            answer: m.e, unit: "$",
            traps: traps(m.e, [
              { value: m.Pe, why: "That is MSB at the efficient quantity. The quota price is the gap between MSB and users' own MC there." },
              { value: m.Ps, why: "That is users' own MC at the efficient quantity, not the quota price." },
              { value: m.Pm, why: "That is the price under open access." },
            ]),
            sol: steps("A user will pay for one more unit of quota up to the difference between what the unit is worth (MSB) and what it costs the user to take it (MC).",
              `At ${m.Qe}: MSB = ${m.a} − ${m.b} × ${m.Qe} = ${$(m.Pe)}; MC = ${m.c} + ${m.d} × ${m.Qe} = ${$(m.Ps)}.`,
              `ITQ price = ${$(m.Pe)} − ${$(m.Ps)} = <b>${$(m.e)}</b>, the cost each unit imposes on others. Own cost + quota price = MSB, so users face the full social cost.`),
          });
        },
      },
      {
        name: "Ostrom's design principles",
        make() {
          const not = Math.random() < 0.5;
          if (not) {
            const bad = U.pick(OSTROM_NO);
            return Q.mc({
              q: "Elinor Ostrom studied communities that manage common resources well on their own. Which of these is <b>not</b> one of her design principles?",
              right: bad.t,
              wrong: U.sample(OSTROM_YES, 3).map(t => ({ t, why: "This is one of Ostrom's eight design principles." })),
              rightWhy: bad.why,
              sol: steps("Ostrom's principles share a theme: users who know the resource set, monitor and enforce the rules, with clear boundaries and fair, graduated responses.",
                `“${bad.t}” runs against that. ${bad.why}`),
            });
          }
          const good = U.pick(OSTROM_YES);
          return Q.mc({
            q: "Elinor Ostrom studied communities that manage common resources well on their own. Which of these <b>is</b> one of her design principles?",
            right: good,
            wrong: U.sample(OSTROM_NO, 3).map(b => ({ t: b.t, why: b.why })),
            rightWhy: "This is one of Ostrom's eight design principles for stable local management of a commons.",
            sol: steps("Ostrom found that local users often manage a commons well when they set and enforce their own rules within clear boundaries.",
              `“${good}” is one of her principles.`),
          });
        },
      },
      {
        name: "Select all: common resources",
        make() {
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: selectAll(COMMONS_TF, 5),
            sol: steps("Common resource: rival, nonexcludable → each user ignores the cost to others → overuse.",
              "Remedies: property rights, quotas at the efficient level, ITQs. Politics can stand in the way."),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m7", order: 7,
    title: "Module 7 · Markets: Other Market Failures",
    short: "M7 · Market failure",
    description: "The four types of market failure, negative and positive externalities and their remedies, the Coase theorem, the four types of goods, public goods and free riders, and the tragedy of the commons.",
    notes, flashcards, cues,
    generators: [genFailure, genNeg, genPolicy, genCoase, genPos, genGoods, genPublic, genCommons],
  });
})();
