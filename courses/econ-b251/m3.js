/* ============================================================
 * ECON B251 · Module 3 — Markets: Basic Demand and Supply
 * Markets, prices and auction formats; demand, the law of demand and
 * willingness to pay; the determinants of demand; change in demand vs
 * change in quantity demanded; supply, the law of supply and minimum
 * supply price; the determinants of supply; equilibrium, shortage and
 * surplus; and the eight cases of shifts in demand and/or supply.
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
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  const money = x => U.money(x);
  const PEOPLE = ["Priya", "Mateo", "Hana", "Tobias", "Leila", "Darnell", "Sofia", "Kenji", "Amara", "Nils",
    "Rosa", "Idris", "Yuki", "Callum", "Zara", "Omar", "Greta", "Andre", "Mei", "Felix"];
  const FIRMS = ["Northwind", "Bluepine", "Redfern", "Copperleaf", "Brightwater", "Ironbark", "Silverline", "Oakmont"];
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

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
  /* Drop wrong MC options whose text matches the right answer or each other. */
  function uniqWrong(right, wrong) {
    const seen = new Set([U.plain(right)]);
    return wrong.filter(w => { const k = U.plain(w.t); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-9; v += (s || 1)) o.push(U.round(v, 6)); return o; };

  /* Linear curves are written Q = a + b·P (b < 0 for demand, b > 0 for supply).
   * Graph points are (Q, P): quantity across, price up. The polyline is clipped
   * to the plot and gets an interior point near its large-Q end for the label. */
  function seg(a, b, xMax, yMax) {
    const qCap = xMax * 0.95, pCap = yMax * 0.93;
    let lo = 0, hi = pCap;
    if (b > 0) { lo = Math.max(lo, -a / b); hi = Math.min(hi, (qCap - a) / b); }
    else { lo = Math.max(lo, (a - qCap) / -b); hi = Math.min(hi, a / -b); }
    const pt = p => [a + b * p, p];
    if (b > 0) return [pt(lo), pt(lo + (hi - lo) * 0.84), pt(hi)];
    return [pt(hi), pt(hi + (lo - hi) * 0.84), pt(lo)];
  }
  const dCurve = (a, b, X, Y, label, style) => ({ pts: seg(a, -b, X, Y), style: style || "main", label, labelAt: 1 });
  const sCurve = (c, d, X, Y, label, style) => ({ pts: seg(c, d, X, Y), style: style || "alt", label, labelAt: 1 });

  /* Equation text: Qd = a − bP and Qs = c + dP (c may be negative). */
  const co = k => (k === 1 ? "" : String(k));
  const qdTxt = (a, b) => `Q<sub>d</sub> = ${a} − ${co(b)}P`;
  const qsTxt = (c, d) => (c === 0 ? `Q<sub>s</sub> = ${co(d)}P` : c > 0 ? `Q<sub>s</sub> = ${c} + ${co(d)}P` : `Q<sub>s</sub> = ${co(d)}P − ${-c}`);

  /* Equilibrium effects of shifts: dD, dS ∈ {−1, 0, 1}. "?" = indeterminate. */
  function eff(dD, dS) {
    const P = dD !== 0 && dD === dS ? "?" : Math.sign(dD - dS);
    const Qn = dD !== 0 && dD === -dS ? "?" : Math.sign(dD + dS);
    return { P, Q: Qn };
  }
  const W = { "1": "rises", "-1": "falls", "0": "does not change", "?": "is indeterminate (could rise, fall or stay the same)" };
  const WS = { "1": "rises", "-1": "falls", "0": "unchanged", "?": "indeterminate" };
  const resTxt = r => `Price ${WS[r.P]}, quantity ${WS[r.Q]}`;
  const shiftTxt = (curve, dir) => `${curve === "D" ? "Demand" : "Supply"} ${dir > 0 ? "increases (shifts right)" : "decreases (shifts left)"}`;
  const PQ4 = ["Price rises, quantity rises", "Price rises, quantity falls", "Price falls, quantity rises", "Price falls, quantity falls"];
  const pq4Why = (r, t) => {
    const [p, q] = t.replace("Price ", "").split(", quantity ");
    const bits = [];
    if ((p === "rises") !== (r.P === 1)) bits.push(`price actually ${WS[r.P]}`);
    if ((q === "rises") !== (r.Q === 1)) bits.push(`quantity actually ${WS[r.Q]}`);
    return bits.length ? cap(bits.join(" and ")) + "." : null;
  };
  const BASE = { "1": "rise", "-1": "fall", "0": "stay the same" };
  function effPhrase(r) {
    if (r.P === "?") return `the quantity ${BASE[r.Q]}, with the price indeterminate`;
    if (r.Q === "?") return `the price ${BASE[r.P]}, with the quantity indeterminate`;
    return `the price ${BASE[r.P]} and the quantity ${BASE[r.Q]}`;
  }
  function caseLine(dD, dS) {
    const r = eff(dD, dS);
    return `Price ${W[r.P]}; quantity ${W[r.Q]}.`;
  }
  /* What happens on the OTHER side of the market after one curve shifts. */
  function alongTxt(curve, dir) {
    if (curve === "D") return dir > 0 ? "the higher price moves sellers up along the supply curve (quantity supplied rises)" : "the lower price moves sellers down along the supply curve (quantity supplied falls)";
    return dir > 0 ? "the lower price moves buyers down along the demand curve (quantity demanded rises)" : "the higher price moves buyers up along the demand curve (quantity demanded falls)";
  }

  /* Numeric-market contexts. */
  const NG = [
    { p: "pumpkins", u: "hundreds of pumpkins per week" }, { p: "bike rentals", u: "rentals per day" },
    { p: "concert T-shirts", u: "T-shirts per show" }, { p: "bags of kettle corn", u: "bags per day" },
    { p: "yoga class passes", u: "passes per month" }, { p: "jars of honey", u: "jars per week" },
    { p: "phone cases", u: "cases per day" }, { p: "car washes", u: "washes per day" },
    { p: "cupcakes", u: "cupcakes per day" }, { p: "basil plants", u: "plants per week" },
    { p: "kayak tours", u: "tours per week" }, { p: "smoothies", u: "smoothies per day" },
  ];

  /* ============================================================
   * MARKET EVENT BANK — each market has demand and supply shifters.
   * det = the determinant the event works through (null when the
   * category is debatable, so it is never used to grade categories).
   * ============================================================ */
  const DI = "Income", DT = "Tastes and preferences", DR = "Prices of related goods", DE = "Expectations", DN = "Number of buyers";
  const SC = "Input costs", ST = "Technology and productivity", SR = "Prices of related goods (in production)", SX = "Taxes and subsidies", SE = "Price expectations", SN = "Number of firms";
  const MKT = [
    { m: "coffee", price: "the price of coffee", D: [
      { t: "A widely reported study finds that moderate coffee drinking sharpens memory.", dir: 1, det: DT, why: "Buyers like coffee more, so they want more at every price." },
      { t: "The price of tea climbs sharply.", dir: 1, det: DR, why: "Tea is a substitute; when it costs more, some tea drinkers switch to coffee." },
      { t: "Bakeries raise the price of the muffins many people eat with their morning coffee.", dir: -1, det: DR, why: "Muffins are a complement; a pricier complement lowers demand for coffee." },
      { t: "A popular fitness influencer persuades many fans to give up caffeine.", dir: -1, det: DT, why: "Tastes turn against coffee, so buyers want less at every price." },
    ], S: [
      { t: "Bumper harvests in coffee-growing countries cut the price of coffee beans.", dir: 1, det: SC, why: "Cheaper beans lower the cost of every cup, so cafés offer more at each price." },
      { t: "Cafés install espresso machines that serve twice as many customers an hour.", dir: 1, det: ST, why: "Better technology lowers the cost of each cup." },
      { t: "Baristas' wages rise across the city.", dir: -1, det: SC, why: "Higher labor costs raise the marginal cost of each cup." },
      { t: "The city imposes a new tax on sellers for each cup of coffee sold.", dir: -1, det: SX, why: "A per-unit tax on sellers acts like a higher cost of every unit." },
    ] },
    { m: "gasoline", price: "the price of gasoline", D: [
      { t: "Thousands of new commuters move into the region.", dir: 1, det: DN, why: "More buyers means more gasoline wanted at every price." },
      { t: "Drivers hear that gas prices will jump next week, so they fill their tanks today.", dir: 1, det: DE, why: "Expecting a higher future price raises demand today." },
      { t: "New gasoline-powered cars become much more expensive to buy.", dir: -1, det: DR, why: "Cars and gasoline are complements; fewer gas cars on the road means less gasoline wanted." },
      { t: "Drivers expect gas prices to fall sharply next month, so they put off filling up.", dir: -1, det: DE, why: "Expecting a lower future price cuts demand today." },
    ], S: [
      { t: "The price of crude oil falls.", dir: 1, det: SC, why: "Crude oil is the main input, so refining each gallon gets cheaper." },
      { t: "Refineries adopt a process that gets more gasoline out of every barrel of crude.", dir: 1, det: ST, why: "Better technology lowers the cost per gallon." },
      { t: "A hurricane shuts down several Gulf Coast refineries for a month.", dir: -1, det: null, why: "Less refining capacity means less gasoline offered at every price." },
      { t: "The state raises the per-gallon excise tax that gasoline sellers must pay.", dir: -1, det: SX, why: "A per-unit tax on sellers raises the cost of each gallon." },
    ] },
    { m: "electric cars", price: "the price of electric cars", D: [
      { t: "The price of gasoline rises sharply.", dir: 1, det: DR, why: "Driving a gas car gets costlier, so electric cars (a substitute) look better." },
      { t: "Household incomes rise, and electric cars are a normal good.", dir: 1, det: DI, why: "For a normal good, higher income raises demand." },
      { t: "Electricity rates for home charging double.", dir: -1, det: DR, why: "Electricity is a complement to an electric car; a pricier complement lowers demand." },
      { t: "Buyers learn that cheaper, longer-range models arrive next year, so many postpone buying.", dir: -1, det: DE, why: "Expecting better deals later lowers demand today." },
    ], S: [
      { t: "Battery prices fall by a third.", dir: 1, det: SC, why: "Batteries are a major input, so each car costs less to build." },
      { t: "Three new automakers begin selling electric cars in the country.", dir: 1, det: SN, why: "More sellers means more cars offered at every price." },
      { t: "The government pays automakers a subsidy for every electric car they produce.", dir: 1, det: SX, why: "A per-unit subsidy lowers producers' effective cost." },
      { t: "A lithium shortage drives up the cost of battery cells.", dir: -1, det: SC, why: "A pricier input raises the cost of every car." },
    ] },
    { m: "instant noodles", price: "the price of instant noodles", D: [
      { t: "A recession lowers household incomes, and instant noodles are an inferior good.", dir: 1, det: DI, why: "For an inferior good, lower income raises demand." },
      { t: "A college town's enrollment jumps by 5,000 students.", dir: 1, det: DN, why: "More buyers means more noodles wanted at every price." },
      { t: "Incomes rise strongly, and shoppers treat instant noodles as an inferior good.", dir: -1, det: DI, why: "For an inferior good, higher income lowers demand." },
      { t: "A health report links instant noodles to excess sodium, and many shoppers turn away from them.", dir: -1, det: DT, why: "Tastes turn against the good, so demand falls." },
    ], S: [
      { t: "Wheat flour becomes cheaper.", dir: 1, det: SC, why: "Cheaper flour lowers the cost of each pack." },
      { t: "Factories install faster noodle-frying lines.", dir: 1, det: ST, why: "Better technology lowers the cost per pack." },
      { t: "The price of the palm oil used to fry the noodles soars.", dir: -1, det: SC, why: "A pricier input raises the cost per pack." },
      { t: "Two of the largest noodle makers close for good.", dir: -1, det: SN, why: "Fewer sellers means less offered at every price." },
    ] },
    { m: "movie tickets", price: "the price of movie tickets", D: [
      { t: "Streaming services raise their monthly prices sharply.", dir: 1, det: DR, why: "Streaming is a substitute; when it costs more, more people go out to the movies." },
      { t: "A string of blockbuster releases makes going to the movies fashionable again.", dir: 1, det: DT, why: "Tastes shift toward theaters, so demand rises." },
      { t: "Downtown parking near the theaters becomes much more expensive.", dir: -1, det: DR, why: "Parking is a complement to a night at the movies; a pricier complement lowers demand." },
      { t: "The town's population shrinks after its largest employer leaves.", dir: -1, det: DN, why: "Fewer buyers means fewer tickets wanted at every price." },
    ], S: [
      { t: "Digital projectors cut the cost of showing each film.", dir: 1, det: ST, why: "Better technology lowers the cost of each screening." },
      { t: "Two new multiplex theaters open in town.", dir: 1, det: SN, why: "More sellers means more seats offered at every price." },
      { t: "Film studios raise the fees theaters pay to screen new releases.", dir: -1, det: SC, why: "Film rentals are an input; a higher fee raises theaters' costs." },
      { t: "The city adds a tax that theaters must pay on every ticket sold.", dir: -1, det: SX, why: "A per-unit tax on sellers raises their cost per ticket." },
    ] },
    { m: "strawberries", price: "the price of strawberries", D: [
      { t: "A popular cooking show sets off a strawberry-dessert craze.", dir: 1, det: DT, why: "Tastes shift toward strawberries." },
      { t: "The price of blueberries jumps after a poor harvest.", dir: 1, det: DR, why: "Blueberries are a substitute; when they cost more, shoppers buy strawberries instead." },
      { t: "The price of whipped cream rises sharply.", dir: -1, det: DR, why: "Whipped cream is a complement for many strawberry buyers, so demand falls." },
      { t: "Shoppers expect strawberry prices to drop next week when the local harvest arrives, so they wait.", dir: -1, det: DE, why: "Expecting a lower future price cuts demand today." },
    ], S: [
      { t: "Ideal weather produces a bumper strawberry crop.", dir: 1, det: null, why: "Growers have more berries to sell at every price." },
      { t: "Growers adopt a disease-resistant plant variety that yields more per acre.", dir: 1, det: ST, why: "Higher productivity lowers the cost per pound." },
      { t: "Farmworkers' wages rise sharply.", dir: -1, det: SC, why: "Picking labor is an input; higher wages raise the cost per pound." },
      { t: "Raspberry prices soar, so many growers replant their fields with raspberries.", dir: -1, det: SR, why: "Raspberries compete for the same land (a substitute in production), so growers offer fewer strawberries." },
    ] },
    { m: "smartphones", price: "the price of smartphones", D: [
      { t: "Average incomes rise, and smartphones are a normal good.", dir: 1, det: DI, why: "For a normal good, higher income raises demand." },
      { t: "Mobile data plans get much cheaper.", dir: 1, det: DR, why: "Data plans are a complement; a cheaper complement raises demand." },
      { t: "A recession cuts incomes, and smartphones are a normal good.", dir: -1, det: DI, why: "For a normal good, lower income lowers demand." },
      { t: "Mobile data plans become much more expensive.", dir: -1, det: DR, why: "A pricier complement lowers demand." },
    ], S: [
      { t: "The price of memory chips falls.", dir: 1, det: SC, why: "Cheaper components lower the cost of each phone." },
      { t: "Automated assembly lets factories build each phone with far fewer worker-hours.", dir: 1, det: ST, why: "Higher productivity lowers the cost per phone." },
      { t: "The government imposes a new tax on manufacturers for each phone sold.", dir: -1, det: SX, why: "A per-unit tax on sellers raises their cost per phone." },
      { t: "Phone makers expect prices to be much higher after the holidays, so they hold back units now.", dir: -1, det: SE, why: "Expecting a higher future price, sellers offer less today." },
    ] },
    { m: "apartments near campus", price: "rent on apartments near campus", D: [
      { t: "The university admits a much larger first-year class.", dir: 1, det: DN, why: "More renters means more apartments wanted at every rent." },
      { t: "The university raises dorm room rates sharply.", dir: 1, det: DR, why: "Dorms are a substitute; pricier dorms push students toward apartments." },
      { t: "The university cuts dorm room rates in half.", dir: -1, det: DR, why: "A cheaper substitute pulls students away from apartments." },
      { t: "Enrollment drops after the university closes a large program.", dir: -1, det: DN, why: "Fewer renters means fewer apartments wanted at every rent." },
    ], S: [
      { t: "Several new landlords enter the market with newly built buildings.", dir: 1, det: SN, why: "More sellers means more units offered at every rent." },
      { t: "The city pays landlords a subsidy for each unit they rent to students.", dir: 1, det: SX, why: "A per-unit subsidy lowers landlords' effective cost." },
      { t: "Short-term vacation rentals become far more profitable, so many landlords convert their units.", dir: -1, det: SR, why: "Vacation rentals use the same buildings (a substitute in production), so fewer units are offered to students." },
      { t: "Maintenance and repair costs for rental buildings jump.", dir: -1, det: SC, why: "Higher input costs raise the cost of offering each unit." },
    ] },
    { m: "beef", price: "the price of beef", D: [
      { t: "The price of chicken rises sharply.", dir: 1, det: DR, why: "Chicken is a substitute; when it costs more, some shoppers buy beef instead." },
      { t: "A diet built around red meat becomes wildly popular.", dir: 1, det: DT, why: "Tastes shift toward beef." },
      { t: "Several major studies link heavy red-meat eating to heart disease.", dir: -1, det: DT, why: "Tastes turn against beef." },
      { t: "The price of pork falls sharply.", dir: -1, det: DR, why: "Pork is a substitute; a cheaper substitute pulls buyers away from beef." },
    ], S: [
      { t: "Cattle feed becomes much cheaper.", dir: 1, det: SC, why: "Cheaper feed lowers the cost of raising each animal." },
      { t: "The price of leather rises, making each animal more valuable to ranchers.", dir: 1, det: SR, why: "Leather and beef come from the same animal (complements in production), so ranchers raise more cattle and offer more beef." },
      { t: "A drought destroys pastureland and drives up the cost of hay.", dir: -1, det: SC, why: "Pricier feed raises the cost of raising cattle." },
      { t: "Ranchers expect beef prices to be much higher next year, so they hold cattle back from market now.", dir: -1, det: SE, why: "Expecting a higher future price, sellers offer less today." },
    ] },
    { m: "corn", price: "the price of corn", D: [
      { t: "Wheat used for animal feed becomes much more expensive, so livestock farmers switch to corn.", dir: 1, det: DR, why: "Feed wheat is a substitute for corn; when it costs more, demand for corn rises." },
      { t: "Ethanol plants double their capacity and buy far more corn.", dir: 1, det: DN, why: "More (and bigger) buyers means more corn wanted at every price." },
      { t: "The price of barley, an alternative animal feed, falls sharply.", dir: -1, det: DR, why: "A cheaper substitute pulls buyers away from corn." },
      { t: "Several ethanol plants close, so fewer firms are buying corn.", dir: -1, det: DN, why: "Fewer buyers means less corn wanted at every price." },
    ], S: [
      { t: "Seed companies release a corn variety with much higher yields.", dir: 1, det: ST, why: "Higher productivity lowers the cost per bushel." },
      { t: "Fertilizer prices drop.", dir: 1, det: SC, why: "Cheaper inputs lower the cost per bushel." },
      { t: "Soybean prices soar, so many farmers plant soybeans instead of corn.", dir: -1, det: SR, why: "Soybeans compete for the same farmland (a substitute in production), so less corn is offered." },
      { t: "The government ends a subsidy it paid farmers on each bushel of corn grown.", dir: -1, det: SX, why: "Losing a per-unit subsidy raises farmers' effective cost." },
    ] },
    { m: "bicycles", price: "the price of bicycles", D: [
      { t: "Gas prices rise, and many commuters look for cheaper ways to get to work.", dir: 1, det: DR, why: "Driving gets costlier, so more people turn to bikes." },
      { t: "Household incomes rise, and bicycles are a normal good.", dir: 1, det: DI, why: "For a normal good, higher income raises demand." },
      { t: "Rental e-scooters become much cheaper to ride.", dir: -1, det: DR, why: "A cheaper substitute pulls riders away from bikes." },
      { t: "Buyers expect bike prices to fall in a big sale next month, so they wait.", dir: -1, det: DE, why: "Expecting a lower future price cuts demand today." },
    ], S: [
      { t: "Aluminum frames become cheaper to make.", dir: 1, det: SC, why: "Cheaper inputs lower the cost of each bike." },
      { t: "Several new bike brands start selling in the market.", dir: 1, det: SN, why: "More sellers means more bikes offered at every price." },
      { t: "A new tax is charged to manufacturers on each bicycle sold.", dir: -1, det: SX, why: "A per-unit tax on sellers raises the cost of each bike." },
      { t: "Wages at bicycle factories rise.", dir: -1, det: SC, why: "Higher labor costs raise the cost of each bike." },
    ] },
  ];
  /* Flattened view with the market attached. */
  const EVENTS = [];
  for (const mk of MKT) {
    for (const e of mk.D) EVENTS.push(Object.assign({ mk, curve: "D" }, e));
    for (const e of mk.S) EVENTS.push(Object.assign({ mk, curve: "S" }, e));
  }
  const tag = e => `<b>${cap(e.mk.m)}:</b> ${e.t}`;
  const evOf = (curve, dir) => EVENTS.filter(e => e.curve === curve && (dir == null || e.dir === dir));

  /* Movements along the curves (own-price changes). */
  const DMOVE = [
    { t: "<b>Coffee:</b> A café raises the price of a latte, and its regulars buy fewer lattes.", why: "The good's own price changed, so buyers move along the demand curve." },
    { t: "<b>Strawberries:</b> A bumper harvest pushes strawberry prices down, and shoppers buy more.", why: "The harvest shifts supply. On the demand side, buyers just respond to the lower price: a movement along demand." },
    { t: "<b>Movie tickets:</b> A theater cuts Tuesday ticket prices, and Tuesday attendance rises.", why: "Only the ticket's own price changed: a movement along demand." },
    { t: "<b>Gasoline:</b> A refinery outage pushes gas prices up, and drivers buy less gas.", why: "The outage shifts supply. Buyers respond to the higher price by moving up along their demand curve." },
    { t: "<b>Bicycles:</b> A bike shop marks every bike down 20%, and it sells more bikes.", why: "Lower own price → more quantity demanded, a movement along demand." },
    { t: "<b>Smartphones:</b> Falling chip costs push phone prices down, and more phones are bought.", why: "The chip costs shift supply. Buyers move down along the demand curve." },
  ];
  const SMOVE = [
    { t: "<b>Corn:</b> The market price of corn rises, so farmers sell more of the corn they grew.", why: "The good's own price changed, so sellers move along the supply curve." },
    { t: "<b>Beef:</b> Rising beef prices lead ranchers to send more cattle to market.", why: "A higher own price raises quantity supplied: a movement along supply." },
    { t: "<b>Apartments near campus:</b> A jump in student enrollment pushes rents up, and homeowners rent out more spare rooms.", why: "Enrollment shifts demand. Sellers respond to the higher rent by moving up along the supply curve." },
    { t: "<b>Coffee:</b> The price of a cup falls, and cafés cut back on the hours they stay open.", why: "A lower own price lowers quantity supplied: a movement along supply." },
    { t: "<b>Electric cars:</b> A surge of buyers pushes prices up, and automakers add a night shift to build more.", why: "Demand shifted. Producers respond to the higher price: a movement up along supply." },
    { t: "<b>Strawberries:</b> A dessert craze raises strawberry prices, so growers pick fields they would otherwise have left.", why: "Demand shifted. The higher price moves growers up along their supply curve." },
  ];

  /* ============================================================
   * LESSONS
   * ============================================================ */
  // Lesson graphs: smoothies at a campus kiosk. Demand Q = 18 − 2P, supply Q = 2P − 2.
  const gDemand = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 20, yMax: 10, xTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], yTicks: [2, 4, 6, 8, 10],
    curves: [dCurve(18, 2, 20, 10, "D")],
    points: [{ x: 14, y: 2, label: "" }, { x: 12, y: 3 }, { x: 10, y: 4 }, { x: 8, y: 5 }, { x: 6, y: 6 }, { x: 4, y: 7, label: "" }],
    aria: "Downward-sloping demand curve for smoothies" });
  const gDShift = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 26, yMax: 10, xTicks: [4, 8, 12, 16, 20, 24], yTicks: [2, 4, 6, 8, 10],
    curves: [dCurve(12, 2, 26, 10, "D₃", "faint"), dCurve(18, 2, 26, 10, "D₁"), dCurve(24, 2, 26, 10, "D₂", "alt")],
    arrows: [{ from: [8.6, 5], to: [13.6, 5] }, { from: [7.4, 5], to: [2.6, 5] }],
    aria: "Demand shifts right to D2 and left to D3" });
  const gMove = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 26, yMax: 10, xTicks: [4, 8, 12, 16, 20, 24], yTicks: [2, 4, 6, 8, 10],
    curves: [dCurve(18, 2, 26, 10, "D₁"), dCurve(24, 2, 26, 10, "D₂", "alt")],
    points: [{ x: 6, y: 6, label: "A" }, { x: 10, y: 4, label: "B" }, { x: 12, y: 6, label: "C" }],
    arrows: [{ from: [6.6, 5.6], to: [9.4, 4.3] }, { from: [6.8, 6], to: [11.2, 6] }],
    aria: "Movement along demand from A to B versus a shift from A to C" });
  const gSupply = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 20, yMax: 10, xTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], yTicks: [2, 4, 6, 8, 10],
    curves: [sCurve(-2, 2, 20, 10, "S")],
    points: [{ x: 2, y: 2 }, { x: 4, y: 3 }, { x: 6, y: 4 }, { x: 8, y: 5 }, { x: 10, y: 6 }, { x: 12, y: 7 }],
    aria: "Upward-sloping supply curve for smoothies" });
  const gSShift = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 20, yMax: 10, xTicks: [4, 8, 12, 16, 20], yTicks: [2, 4, 6, 8, 10],
    curves: [sCurve(-6, 2, 20, 10, "S₃", "faint"), sCurve(-2, 2, 20, 10, "S₁"), sCurve(4, 2, 20, 10, "S₂", "main")],
    arrows: [{ from: [8.6, 5], to: [13.4, 5] }, { from: [7.4, 5], to: [4.6, 5] }],
    aria: "Supply shifts right to S2 and left to S3" });
  const gEq = G.plot({ xLabel: "Smoothies (hundreds per week)", yLabel: "Price ($ per smoothie)", xMax: 20, yMax: 10, xTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], yTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    curves: [dCurve(18, 2, 20, 10, "D"), sCurve(-2, 2, 20, 10, "S"),
      { pts: [[0, 7], [5.4, 7], [19, 7]], style: "dash", label: "surplus", labelAt: 1 }, { pts: [[0, 3], [5.4, 3], [19, 3]], style: "dash", label: "shortage", labelAt: 1 }],
    points: [{ x: 8, y: 5, label: "E" }, { x: 4, y: 7, style: "hollow" }, { x: 12, y: 7, style: "hollow" }, { x: 12, y: 3, style: "hollow" }, { x: 4, y: 3, style: "hollow" }],
    aria: "Equilibrium at $5 and 800 smoothies, with a surplus at $7 and a shortage at $3" });
  const gCase2 = G.plot({ xLabel: "Quantity", yLabel: "Price", xMax: 20, yMax: 10, xTicks: [], yTicks: [],
    curves: [sCurve(-2, 2, 20, 10, "S"), dCurve(18, 2, 20, 10, "D₁"), dCurve(22, 2, 20, 10, "D₂", "dash")],
    points: [{ x: 8, y: 5, label: "E₁" }, { x: 10, y: 6, label: "E₂" }],
    arrows: [{ from: [8.8, 4.6], to: [11.6, 4.6] }],
    aria: "Demand increases: price and quantity rise" });
  const gCase5 = G.plot({ xLabel: "Quantity", yLabel: "Price", xMax: 20, yMax: 10, xTicks: [], yTicks: [],
    curves: [sCurve(-2, 2, 20, 10, "S₁"), sCurve(2, 2, 20, 10, "S₂", "dash"), dCurve(18, 2, 20, 10, "D₁", "main"), dCurve(26, 2, 20, 10, "D₂", "dash")],
    points: [{ x: 8, y: 5, label: "E₁" }, { x: 14, y: 6, label: "E₂" }],
    aria: "Demand rises more than supply: price and quantity both rise" });

  const notes = [
    {
      title: "Markets, prices and auctions",
      lo: "Define and give an example of a market, and tell the main types of auctions apart.",
      html: `<p>A <b>market</b> is any arrangement that lets buyers and sellers trade with one another. It does not need a building. A farmers' market is one, but so is an app that matches dog walkers with owners, the job market for nurses, the bond market, or two classmates swapping a used calculator for cash. What makes it a market is <b>voluntary exchange</b>: nobody trades unless they expect to gain. Out of all those buyers and sellers interacting come the <b>terms of exchange</b>, meaning the price paid and the quantity traded.</p>
<p>In a market economy, <b>relative prices</b> guide which resources go where. Prices act as <b>signals</b>: a rising price tells everyone a good has become relatively scarcer (buy less of it, produce more of it), and a falling price says it has become relatively plentiful.</p>
<p><b>Auctions</b> are markets with explicit bidding rules. Four formats matter:</p>
<table class="data-tbl"><thead><tr><th>Format</th><th>How it works</th><th>Price the winner pays</th><th>Bidding behavior</th></tr></thead><tbody>
<tr><td><b>English</b> (open, ascending)</td><td>Bids rise in the open until only one bidder is left. There may be a reserve (minimum) price and fixed bid increments.</td><td>Their own last bid, which only has to beat the runner-up</td><td>The winner rarely pays their full value. Online, last-second <em>sniping</em> is a problem; <b>proxy bidding</b> (software raises your bid automatically up to your maximum) is the fix.</td></tr>
<tr><td><b>First-price sealed bid</b></td><td>Each bidder submits one secret bid; the highest bid wins.</td><td>Their own bid</td><td>Bidders <b>shade</b> (bid below their true value), since bidding your full value leaves you no gain. One bid each, so no bidding wars.</td></tr>
<tr><td><b>Second-price sealed bid</b> (Vickrey)</td><td>Secret bids; the highest bid wins.</td><td>The <b>second-highest</b> bid (in practice, often that bid plus a small increment)</td><td>Your bid decides <em>whether</em> you win, not <em>what</em> you pay, so bidding your <b>true value</b> is the best strategy. Online ad auctions use versions of this.</td></tr>
<tr><td><b>Dutch</b> (descending)</td><td>The price starts high and falls until someone accepts it.</td><td>The price at which they stopped the clock</td><td>Fast, and handy for selling many lots (flowers, fish). Like first-price, bidders accept below their true value.</td></tr>
</tbody></table>
<div class="example"><b>Example.</b> A vintage guitar goes to sealed bidding. Ines bids $900, Dev $760 and Jo $640. In a <b>first-price</b> sealed-bid auction Ines wins and pays <b>$900</b>. Under <b>second-price</b> rules she still wins but pays Dev's <b>$760</b>. If all three had bid their true values in an open <b>English</b> auction, bidding would stop just above $760, when Dev drops out.</div>
<div class="keyidea"><b>Key idea.</b> Only in a second-price (Vickrey) auction does your own bid not set your price, which is why it pays to bid exactly what the item is worth to you.</div>
<div class="trap"><b>Common trap.</b> A "market" is not a place. Online platforms, phone calls and handshake deals are all markets, as long as buyers and sellers are voluntarily exchanging.</div>`,
      gens: ["b251-m3-markets"],
    },
    {
      title: "Demand, the law of demand and willingness to pay",
      lo: "Compare and illustrate demand, the law of demand and willingness to pay.",
      html: `<p><b>Demand</b> is the whole relationship between a good's price and the quantity people are <b>willing and able</b> to buy over some period, <b>other things being constant</b> (<em>ceteris paribus</em>). Wanting a sports car is not demand if you cannot pay for it. Demand reflects a choice about which of your many wants to satisfy with a limited budget.</p>
<p>The <b>quantity demanded</b> is one number: how much buyers would buy at one particular price. The <b>law of demand</b> says that, other things equal, price and quantity demanded are <b>inversely (negatively) related</b>: a higher price means a smaller quantity demanded. Two forces are behind it:</p>
<ul>
  <li><b>Substitution effect.</b> When a good's price rises, its <em>relative</em> price (its opportunity cost in terms of other goods) rises, so people switch to substitutes.</li>
  <li><b>Income effect.</b> When a good's price rises relative to income, the same paycheck buys less, so people cannot afford all they used to buy and cut back.</li>
</ul>
<p>A <b>demand schedule</b> lists quantity demanded at several prices; plotting it gives the <b>demand curve</b>, with price on the vertical axis and quantity on the horizontal. It slopes downward.</p>
<div class="example"><b>Example.</b> A campus smoothie kiosk faces this weekly demand: at $2, 1,400 smoothies; $3, 1,200; $4, 1,000; $5, 800; $6, 600; $7, 400. Each $1 increase cuts the quantity demanded by 200 (in hundreds, Q = 18 − 2P). That is the law of demand.</div>
${gDemand}
<p>Read the curve the other way and it becomes a <b>willingness-and-ability-to-pay curve</b>. The height of the curve at a quantity shows the most someone will pay for that last unit, which measures its <b>marginal benefit</b>. When few units are available, the buyers who value them most are willing to pay a lot; as more units become available, the extra unit goes to someone who values it less. Decreasing marginal benefit (from Module 2) is why the curve slopes down.</p>
<p>The <b>market demand</b> at a price is the <em>sum of the quantities</em> every buyer demands at that price (add the curves horizontally).</p>
<div class="keyidea"><b>Key idea.</b> "Demand" means the whole schedule or curve. "Quantity demanded" means one point on it, at one price.</div>
<div class="trap"><b>Common trap.</b> The income effect is <em>not</em> about people's salaries changing. Income stays the same; the price rise makes that income buy less. A change in actual income is a different thing: it shifts the whole demand curve (next lesson).</div>`,
      gens: ["b251-m3-demand"],
    },
    {
      title: "The determinants of demand: what shifts the demand curve",
      lo: "List, apply and illustrate the determinants of demand.",
      html: `<p>A demand curve is drawn holding everything except the good's own price constant. When one of those other things changes, buyers want a different quantity at <em>every</em> price, and the whole curve shifts. An <b>increase in demand</b> shifts it <b>right</b> (D₁ → D₂ below); a <b>decrease in demand</b> shifts it <b>left</b> (D₁ → D₃).</p>
${gDShift}
<table class="data-tbl"><thead><tr><th>Determinant</th><th>Demand increases (right) when…</th></tr></thead><tbody>
<tr><td><b>Income</b></td><td>income rises and the good is <b>normal</b> (restaurant meals, travel), or income <em>falls</em> and the good is <b>inferior</b> (instant noodles, bus rides, store brands)</td></tr>
<tr><td><b>Tastes and preferences</b></td><td>the good becomes more popular, better reviewed or seen as healthier</td></tr>
<tr><td><b>Prices of related goods</b></td><td>the price of a <b>substitute</b> rises (pricier tea → more coffee), or the price of a <b>complement</b> falls (cheaper printers → more ink)</td></tr>
<tr><td><b>Expectations</b></td><td>buyers expect the price to <em>rise</em> in the future (buy now), or expect higher future income</td></tr>
<tr><td><b>Number of buyers</b> (market size)</td><td>the population or customer base grows</td></tr>
</tbody></table>
<p><b>Substitutes</b> are used in place of each other; <b>complements</b> are used together. A <b>normal good</b> is one people buy more of as income rises; an <b>inferior good</b> is one they buy less of as income rises (they trade up to something better).</p>
<div class="example"><b>Example.</b> At $5 a smoothie the kiosk sells 800 a week. A study showing smoothies boost exam scores (tastes) raises the quantity wanted at $5 to 1,400, and at $4 from 1,000 to 1,600: 600 more at every price, a rightward shift to D₂ (Q = 24 − 2P). If instead a juice bar next door cuts its prices (a cheaper substitute), demand might shift left to D₃ (Q = 12 − 2P): only 200 a week at $5.</div>
<div class="keyidea"><b>Key idea.</b> Anything that changes buyers' plans <em>other than the good's own price</em> shifts the demand curve.</div>
<div class="trap"><b>Common trap.</b> "Income went up, so demand goes up" is only right for a normal good. For an inferior good, higher income <em>decreases</em> demand. And watch the direction for related goods: a <em>higher</em> price of a complement <em>lowers</em> demand.</div>`,
      gens: ["b251-m3-dshift"],
    },
    {
      title: "Change in demand vs change in quantity demanded",
      lo: "Distinguish between a change in demand and a change in quantity demanded.",
      html: `<p>Economists are strict with these two phrases:</p>
<ul>
  <li>A change in the good's <b>own price</b> causes a <b>change in quantity demanded</b>: a <b>movement along</b> the same demand curve (A → B below).</li>
  <li>A change in any <b>non-price determinant</b> (income, tastes, related prices, expectations, number of buyers) causes a <b>change in demand</b>: a <b>shift of</b> the whole curve (A → C).</li>
</ul>
${gMove}
<div class="example"><b>Example.</b> The smoothie kiosk cuts its price from $6 to $4, and weekly sales rise from 600 to 1,000. That is an increase in <b>quantity demanded</b> (A → B on D₁): the curve did not move. If instead the price stays at $6 but a new dorm opens next door (more buyers), sales rise from 600 to 1,200: an increase in <b>demand</b> (A → C, onto D₂).</div>
<p>One event can do both, in different curves. A frost that cuts the orange harvest <b>shifts supply</b> left. The price of oranges rises, and buyers respond by moving up along their unchanged demand curve: a decrease in <b>quantity demanded</b>, not in demand.</p>
<div class="keyidea"><b>Key idea.</b> Own price → move along. Anything else → shift.</div>
<div class="trap"><b>Common trap.</b> "The price went up, so demand fell, so the price went back down" is circular and wrong. The higher price reduces <em>quantity demanded</em>; the demand curve itself never moved, so there is nothing to push the price back.</div>`,
      gens: ["b251-m3-dvsq", "b251-m3-dshift"],
    },
    {
      title: "Supply, the law of supply and minimum supply price",
      lo: "Compare and illustrate supply, the law of supply and minimum supply price.",
      html: `<p><b>Supply</b> is the relationship between a good's price and the quantity sellers are <b>willing and able</b> to sell over some period, other things constant. Resources and technology limit what <em>can</em> be produced; supply reflects the decision about which of those feasible things to actually make and sell.</p>
<p>The <b>law of supply</b>: other things equal, price and quantity supplied are <b>directly (positively) related</b>. The reason is <b>increasing marginal cost</b> (the same idea as the bowed-out PPC in Module 2). As a firm produces more, it has to use resources less suited to the job, overtime labor or crowded equipment, so each extra unit costs more. A seller will offer a unit only if the price at least covers its marginal cost, so it takes a higher price to bring out more units.</p>
<div class="example"><b>Example.</b> Suppose the smoothie kiosk would offer these weekly quantities: at $2, 200; $3, 400; $4, 600; $5, 800; $6, 1,000; $7, 1,200 (in hundreds, Q = 2P − 2). At $1 it would sell none, because no smoothie can be made that cheaply.</div>
${gSupply}
<p>Read the supply curve from the quantity axis up and it is a <b>minimum-supply-price curve</b>. Its height at a quantity is the lowest price at which a seller is willing to supply that last unit, and that lowest price is the unit's <b>marginal cost</b>. In the kiosk example the 600th smoothie has a marginal cost of about $4, so $4 is the minimum price that will bring it to market. The 1,000th costs about $6.</p>
<div class="keyidea"><b>Key idea.</b> Demand curve height = willingness to pay = marginal benefit. Supply curve height = minimum supply price = marginal cost.</div>
<div class="trap"><b>Common trap.</b> A higher price does not "increase supply". It increases the <b>quantity supplied</b>, a movement up along the same supply curve. Supply (the whole curve) changes only when a non-price determinant changes.</div>`,
      gens: ["b251-m3-supply"],
    },
    {
      title: "The determinants of supply: change in supply vs quantity supplied",
      lo: "List, apply and illustrate the determinants of supply and distinguish a change in supply from a change in quantity supplied.",
      html: `<p>When something other than the good's own price makes selling more or less attractive, the whole supply curve shifts. An <b>increase in supply</b> shifts it <b>right</b> (sellers offer more at every price, S₁ → S₂); a <b>decrease</b> shifts it <b>left</b> (S₁ → S₃). The rule of thumb: <b>if costs fall, supply increases; if costs rise, supply decreases.</b></p>
${gSShift}
<table class="data-tbl"><thead><tr><th>Determinant</th><th>Supply increases (right) when…</th></tr></thead><tbody>
<tr><td><b>Cost of inputs</b></td><td>wages, raw materials, energy or rent get cheaper</td></tr>
<tr><td><b>Technology and productivity</b></td><td>a better method or machine makes each unit cheaper to produce</td></tr>
<tr><td><b>Prices of related goods in production</b></td><td>the price of a <b>substitute in production</b> (another good the same resources could make, e.g. soybeans vs corn on the same land) <em>falls</em>, or the price of a <b>complement in production</b> (a joint product, e.g. leather and beef from the same animal) <em>rises</em></td></tr>
<tr><td><b>Taxes and subsidies</b></td><td>a per-unit tax on sellers is cut, or a per-unit subsidy is introduced (a tax acts like a higher cost; a subsidy like a lower one)</td></tr>
<tr><td><b>Price expectations</b></td><td>sellers expect the price to <em>fall</em> later, so they sell more now (expecting a higher future price, they hold goods back and supply decreases today)</td></tr>
<tr><td><b>Number of firms</b></td><td>more sellers enter the industry</td></tr>
</tbody></table>
<p>As with demand: a change in the good's <b>own price</b> causes a <b>change in quantity supplied</b> (a movement along the curve); a change in a <b>non-price determinant</b> causes a <b>change in supply</b> (a shift of the curve).</p>
<div class="example"><b>Example.</b> The kiosk's fruit supplier cuts prices, so at $5 the kiosk will now make 1,400 smoothies instead of 800, and at $4, 1,200 instead of 600. That is 600 more at every price: supply has increased (S₁ → S₂). If the kiosk's price simply rises from $4 to $6 with no change in costs, it moves along S₁ from 600 to 1,000: an increase in quantity supplied.</div>
<div class="keyidea"><b>Key idea.</b> A supply shift is about sellers' costs and alternatives; it never comes from a change in buyers' tastes or incomes.</div>
<div class="trap"><b>Common trap.</b> Expectations work in opposite directions on the two sides. If people expect the price to <em>rise</em> next month, buyers want more <em>now</em> (demand increases), while sellers hold back to sell later (supply decreases).</div>`,
      gens: ["b251-m3-supply", "b251-m3-dvsq"],
    },
    {
      title: "Equilibrium, shortage and surplus",
      lo: "Define, illustrate and determine equilibrium price and quantity, shortage and surplus.",
      html: `<p>Put demand and supply on one graph. <b>Equilibrium</b> is the price at which <b>quantity demanded equals quantity supplied</b>: where the curves cross. At that price every buyer who wants to buy can, every seller who wants to sell can, and nobody has a reason to change the price. Price coordinates buyers' and sellers' plans, and it adjusts when those plans do not match.</p>
${gEq}
<ul>
  <li><b>Surplus</b> (excess supply): at any price <b>above</b> equilibrium, quantity supplied exceeds quantity demanded. Unsold stock piles up and sellers cut prices, so a surplus pushes the price <b>down</b>.</li>
  <li><b>Shortage</b> (excess demand): at any price <b>below</b> equilibrium, quantity demanded exceeds quantity supplied. Lines form, shelves empty and sellers find they can charge more, so a shortage pushes the price <b>up</b>.</li>
</ul>
<div class="example"><b>Example.</b> With demand Q<sub>d</sub> = 18 − 2P and supply Q<sub>s</sub> = 2P − 2 (hundreds of smoothies), set them equal: 18 − 2P = 2P − 2, so 4P = 20 and <b>P* = $5</b>; then Q* = 18 − 10 = <b>8</b> (800 smoothies). At $7, Q<sub>d</sub> = 4 and Q<sub>s</sub> = 12: a <b>surplus</b> of 8 (800 smoothies), so the price falls. At $3, Q<sub>d</sub> = 12 and Q<sub>s</sub> = 4: a <b>shortage</b> of 800, so the price rises.</div>
<p>How fast the price gets there depends on the market. Prices on a stock exchange adjust in seconds; apartment rents and wages may take months, so shortages or surpluses can last a while. Markets can also <b>overshoot</b>, rising past the new equilibrium before settling back.</p>
<div class="keyidea"><b>Key idea.</b> Shortage → price rises. Surplus → price falls. The size of either is the horizontal gap |Q<sub>d</sub> − Q<sub>s</sub>| at that price.</div>
<div class="trap"><b>Common trap.</b> A shortage is not the same as scarcity. Scarcity (limited resources, unlimited wants) is always present, even in equilibrium. A shortage is a specific market situation where the price is below equilibrium, and it disappears once the price rises.</div>`,
      gens: ["b251-m3-equil"],
    },
    {
      title: "The 8 cases: shifts in demand and/or supply",
      lo: "Analyze the effects of changes in demand and/or supply on equilibrium price and quantity, and use the model to explain real-world events.",
      html: `<p>Every shift story follows the same three steps: <b>(1)</b> start in equilibrium; <b>(2)</b> a shift creates a shortage or surplus at the old price; <b>(3)</b> price and quantity adjust to a new equilibrium. To decide which curve moves, ask: does the event change <em>buyers'</em> plans (demand) or <em>sellers'</em> plans (supply)?</p>
<p><b>One curve shifts (cases 1–4).</b> Both results are determined:</p>
<table class="data-tbl"><thead><tr><th>Case</th><th>Shift</th><th>Price</th><th>Quantity</th></tr></thead><tbody>
<tr><td>1</td><td>Demand decreases</td><td>↓</td><td>↓</td></tr>
<tr><td>2</td><td>Demand increases</td><td>↑</td><td>↑</td></tr>
<tr><td>3</td><td>Supply increases</td><td>↓</td><td>↑</td></tr>
<tr><td>4</td><td>Supply decreases</td><td>↑</td><td>↓</td></tr>
</tbody></table>
${gCase2}
<p>Above (case 2): demand rises from D₁ to D₂. At the old price there is a shortage, the price is bid up, and the market settles at E₂ with a higher price <em>and</em> a higher quantity.</p>
<p><b>Both curves shift (cases 5–8).</b> Now the two shifts push one variable in <em>opposite</em> directions, so unless you know which shift is larger, that variable is <b>indeterminate</b>. The other variable is pushed the same way by both shifts, so it is determined:</p>
<table class="data-tbl"><thead><tr><th>Case</th><th>Shifts</th><th>Price</th><th>Quantity</th></tr></thead><tbody>
<tr><td>5</td><td>Demand ↑ and supply ↑</td><td>?</td><td>↑</td></tr>
<tr><td>6</td><td>Demand ↓ and supply ↓</td><td>?</td><td>↓</td></tr>
<tr><td>7</td><td>Demand ↑ and supply ↓</td><td>↑</td><td>?</td></tr>
<tr><td>8</td><td>Demand ↓ and supply ↑</td><td>↓</td><td>?</td></tr>
</tbody></table>
${gCase5}
<p>Above (case 5 with sizes given): demand shifts right by more than supply does, so price rises as well as quantity. Had supply shifted right by more, price would have fallen; by the same amount, price would not change.</p>
<div class="example"><b>Example.</b> Each summer, a beach town's hotel rooms rent at higher rates <em>and</em> more of them are rented: tourist demand increases (case 2). Now suppose that in the same summer a new hotel opens (supply ↑). Quantity rented surely rises, but the room rate could go either way: case 5. With numbers: demand Q<sub>d</sub> = 300 − 2P and supply Q<sub>s</sub> = 3P − 200 give P* = $100, Q* = 100 rooms. If demand rises by 50 rooms at every price and supply by 50, the new equilibrium is P* = $100, Q* = 150: price unchanged. If demand rises by 100 instead, P* = $110 and Q* = 180.</div>
<div class="keyidea"><b>Key idea.</b> One shift → both price and quantity determined. Two shifts → the variable they push in opposite directions is indeterminate unless the sizes are known. Same direction (both ↑ or both ↓) → price is indeterminate; opposite directions → quantity is indeterminate.</div>
<div class="trap"><b>Common trap.</b> Do not shift a second curve that was not hit. A rise in demand raises the price, and sellers respond by moving <em>along</em> the supply curve; supply itself has not changed. Only shift a curve when one of <em>its own</em> determinants changes.</div>`,
      gens: ["b251-m3-shift1", "b251-m3-shift2"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m3-c-market", tag: "Definition", front: "What is a <em>market</em>?", back: "Any arrangement that lets buyers and sellers <b>voluntarily exchange</b>. It need not be a physical place: apps, phone deals and stock exchanges are all markets. Markets set the terms of exchange (price and quantity)." },
    { id: "b251-m3-c-signal", tag: "Principle", front: "What do prices signal in a market economy?", back: "Relative scarcity. A rising price says a good has become relatively scarcer; a falling price says it has become relatively more plentiful." },
    { id: "b251-m3-c-english", tag: "Definition", front: "English auction", back: "Open, <b>ascending</b> bidding until one bidder is left. The winner pays their own last bid, which only needs to beat the runner-up. Online versions suffer from <b>sniping</b>; <b>proxy bidding</b> is the fix." },
    { id: "b251-m3-c-firstprice", tag: "Definition", front: "First-price sealed-bid auction", back: "Each bidder submits one secret bid; the highest wins and <b>pays their own bid</b>. Bidders shade their bids below their true value." },
    { id: "b251-m3-c-vickrey", tag: "Definition", front: "Second-price sealed-bid (Vickrey) auction", back: "Secret bids; the highest bidder wins but <b>pays the second-highest bid</b>. Because your bid doesn't set your price, bidding your <b>true value</b> is the best strategy." },
    { id: "b251-m3-c-dutch", tag: "Definition", front: "Dutch auction", back: "A <b>descending</b>-price auction: the price starts high and falls until someone accepts. Fast, and useful for selling many lots. Bidders accept below their true value." },
    { id: "b251-m3-c-proxy", tag: "Example", front: "What problem does proxy bidding solve in online English auctions?", back: "<b>Sniping</b> (bidding in the final seconds). You enter a maximum and software raises your bid automatically, one increment at a time, up to that limit." },
    { id: "b251-m3-c-demand", tag: "Definition", front: "What is <em>demand</em>?", back: "The quantities of a good buyers are <b>willing and able</b> to buy at each possible price over a period, <b>other things constant</b>. It is the whole schedule or curve." },
    { id: "b251-m3-c-lawd", tag: "Principle", front: "State the law of demand.", back: "Other things equal, price and quantity demanded are <b>inversely</b> related: a higher price means a smaller quantity demanded." },
    { id: "b251-m3-c-subeff", tag: "Why", front: "Substitution effect vs income effect of a price rise", back: "<b>Substitution</b>: the good's relative price (opportunity cost) rises, so buyers switch to substitutes. <b>Income</b>: the same income now buys less, so buyers can't afford as much. Both cut quantity demanded." },
    { id: "b251-m3-c-wtp", tag: "Principle", front: "Why is a demand curve also a willingness-to-pay curve?", back: "Its height at each quantity is the most someone will pay for that last unit, which measures its <b>marginal benefit</b>. Fewer units available → higher willingness to pay for one more." },
    { id: "b251-m3-c-mktd", tag: "Calculation", front: "Ana demands 3 tacos at $2, Ben 5 and Cy 1. What is market quantity demanded at $2?", back: "Add quantities at the same price: 3 + 5 + 1 = <b>9 tacos</b>. Market demand is the horizontal sum of individual demands." },
    { id: "b251-m3-c-ddets", tag: "Principle", front: "List the determinants of demand (things that shift the curve).", back: "<b>Income</b> (normal vs inferior), <b>tastes and preferences</b>, <b>prices of related goods</b> (substitutes, complements), <b>expectations</b> (future prices, future income), <b>number of buyers</b>." },
    { id: "b251-m3-c-normal", tag: "Distinction", front: "Normal good vs inferior good", back: "<b>Normal</b>: demand rises when income rises. <b>Inferior</b>: demand <em>falls</em> when income rises (buyers trade up), e.g. instant noodles, bus rides." },
    { id: "b251-m3-c-subcomp", tag: "Distinction", front: "Substitutes vs complements in consumption", back: "<b>Substitutes</b> replace each other (coffee, tea): a higher price of one <em>raises</em> demand for the other. <b>Complements</b> go together (printers, ink): a higher price of one <em>lowers</em> demand for the other." },
    { id: "b251-m3-c-dexpect", tag: "Example", front: "Buyers expect the price of TVs to rise next month. What happens to the demand for TVs today?", back: "It <b>increases</b> (shifts right): people buy now to beat the price rise." },
    { id: "b251-m3-c-dvsqd", tag: "Distinction", front: "Change in demand vs change in quantity demanded", back: "<b>Quantity demanded</b> changes when the good's <b>own price</b> changes: a movement <em>along</em> the curve. <b>Demand</b> changes when a non-price determinant changes: a <em>shift</em> of the curve." },
    { id: "b251-m3-c-supply", tag: "Definition", front: "What is <em>supply</em>?", back: "The quantities sellers are <b>willing and able</b> to sell at each possible price over a period, other things constant." },
    { id: "b251-m3-c-laws", tag: "Principle", front: "State the law of supply and the reason behind it.", back: "Price and quantity supplied are <b>directly</b> related. Reason: <b>marginal cost rises</b> as output increases, and sellers supply a unit only if the price covers its marginal cost." },
    { id: "b251-m3-c-minsupply", tag: "Principle", front: "Why is a supply curve also a minimum-supply-price curve?", back: "Its height at each quantity is the <b>lowest price</b> at which someone will sell that last unit, which is its <b>marginal cost</b>." },
    { id: "b251-m3-c-sdets", tag: "Principle", front: "List the determinants of supply.", back: "<b>Input costs</b>, <b>technology and productivity</b>, <b>prices of related goods in production</b>, <b>taxes and subsidies</b>, <b>price expectations</b>, <b>number of firms</b>." },
    { id: "b251-m3-c-costs", tag: "Principle", front: "Costs rise → supply ___. Costs fall → supply ___.", back: "Costs rise → supply <b>decreases</b> (shifts left). Costs fall → supply <b>increases</b> (shifts right). A per-unit tax works like a cost increase; a subsidy like a cost cut." },
    { id: "b251-m3-c-relprod", tag: "Distinction", front: "Substitutes vs complements <em>in production</em>", back: "<b>Substitutes in production</b> use the same resources (corn vs soybeans): if soybeans' price rises, corn supply <em>falls</em>. <b>Complements in production</b> are joint products (beef and leather): if leather's price rises, beef supply <em>rises</em>." },
    { id: "b251-m3-c-sexpect", tag: "Example", front: "Sellers expect the price of their good to rise next month. What happens to supply today?", back: "It <b>decreases</b> (shifts left): sellers hold goods back to sell later at the higher price." },
    { id: "b251-m3-c-svsqs", tag: "Distinction", front: "Change in supply vs change in quantity supplied", back: "Own price changes → <b>quantity supplied</b> changes (move along the curve). Non-price determinant changes → <b>supply</b> changes (the curve shifts)." },
    { id: "b251-m3-c-eq", tag: "Definition", front: "Market equilibrium", back: "The price at which <b>quantity demanded = quantity supplied</b>, where the curves cross. No shortage or surplus, so no pressure on the price to change." },
    { id: "b251-m3-c-eqcalc", tag: "Calculation", front: "Q<sub>d</sub> = 100 − 3P and Q<sub>s</sub> = 2P − 10. Find P* and Q*.", back: "100 − 3P = 2P − 10 → 110 = 5P → <b>P* = $22</b>; Q* = 100 − 66 = <b>34</b>." },
    { id: "b251-m3-c-surplus", tag: "Definition", front: "Surplus", back: "Quantity supplied exceeds quantity demanded. Happens at any price <b>above</b> equilibrium and pushes the price <b>down</b>." },
    { id: "b251-m3-c-shortage", tag: "Definition", front: "Shortage", back: "Quantity demanded exceeds quantity supplied. Happens at any price <b>below</b> equilibrium and pushes the price <b>up</b>." },
    { id: "b251-m3-c-scarcity", tag: "Distinction", front: "Is a shortage the same as scarcity?", back: "<b>No.</b> Scarcity is permanent: resources can't satisfy all wants, even in equilibrium. A shortage is a temporary market state at a below-equilibrium price that disappears as the price rises." },
    { id: "b251-m3-c-adjust", tag: "Principle", front: "What affects how long a shortage or surplus lasts?", back: "How flexible prices are in that market. Prices on exchanges adjust in seconds; rents and wages may take months. Markets can also <b>overshoot</b> on the way to a new equilibrium." },
    { id: "b251-m3-c-3steps", tag: "Principle", front: "The three steps of a shift analysis", back: "1) Start in equilibrium. 2) A shift creates a shortage or surplus at the old price. 3) Price and quantity adjust to a new equilibrium." },
    { id: "b251-m3-c-single", tag: "Principle", front: "Effects of a single shift (cases 1–4)", back: "D↑: P↑ Q↑. D↓: P↓ Q↓. S↑: P↓ Q↑. S↓: P↑ Q↓." },
    { id: "b251-m3-c-double", tag: "Principle", front: "Effects when both curves shift (cases 5–8)", back: "D↑S↑: Q↑, P ?. D↓S↓: Q↓, P ?. D↑S↓: P↑, Q ?. D↓S↑: P↓, Q ?. The \"?\" depends on which shift is larger." },
    { id: "b251-m3-c-indet", tag: "Why", front: "Why is one variable indeterminate when both curves shift?", back: "The two shifts push that variable in <b>opposite directions</b>. Without knowing which shift is larger, it could rise, fall or stay the same." },
    { id: "b251-m3-c-chain", tag: "Example", front: "A frost wrecks the coffee crop. What happens in the market for <em>tea</em>?", back: "Coffee supply falls → coffee price rises → tea (a substitute) sees demand <b>increase</b> → tea's price and quantity both <b>rise</b>." },
    { id: "b251-m3-c-noshift", tag: "Why", front: "Demand rises and the price goes up. Does supply increase?", back: "<b>No.</b> Sellers move <em>along</em> the unchanged supply curve (quantity supplied rises). Supply shifts only when one of its own determinants changes." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“the price of the good itself changes”", think: "Movement along the curve (quantity demanded / supplied)", why: "Own price is on the axis; it never shifts its own curve." },
    { when: "“income rises” + normal good", think: "Demand shifts right", why: "Buyers want more of a normal good at every price when they earn more." },
    { when: "“income rises” + inferior good", think: "Demand shifts left", why: "Buyers trade up and want less of an inferior good." },
    { when: "“price of a substitute rises”", think: "Demand for this good shifts right", why: "Buyers switch toward the now relatively cheaper good." },
    { when: "“price of a complement rises”", think: "Demand for this good shifts left", why: "They are used together, so less of both is wanted." },
    { when: "“buyers expect the price to rise”", think: "Demand increases now", why: "People buy before the price goes up." },
    { when: "“sellers expect the price to rise”", think: "Supply decreases now", why: "Sellers hold back to sell later at the higher price." },
    { when: "“wages / materials / energy cost more”", think: "Supply shifts left", why: "Higher costs mean less offered at every price." },
    { when: "“new technology”, “more productive”", think: "Supply shifts right", why: "Lower cost per unit." },
    { when: "“per-unit tax on sellers” / “subsidy to producers”", think: "Supply left / supply right", why: "A tax acts like a cost increase; a subsidy like a cost cut." },
    { when: "“the same land/factory could make another good whose price rose”", think: "Supply of this good shifts left", why: "Substitute in production: resources move to the more profitable good." },
    { when: "“price below equilibrium”, “lines”, “sold out”", think: "Shortage → price rises", why: "Quantity demanded exceeds quantity supplied." },
    { when: "“price above equilibrium”, “unsold stock piles up”", think: "Surplus → price falls", why: "Quantity supplied exceeds quantity demanded." },
    { when: "“set Q<sub>d</sub> = Q<sub>s</sub>”", think: "Solve for P*, then plug back for Q*", why: "Equilibrium is where the two quantities are equal." },
    { when: "“both curves shift the same direction”", think: "Quantity determined, price indeterminate", why: "The shifts push price in opposite directions." },
    { when: "“demand and supply shift in opposite directions”", think: "Price determined, quantity indeterminate", why: "The shifts push quantity in opposite directions." },
  ];

  /* ============================================================
   * PRACTICE 1 — Markets, prices & auctions
   * ============================================================ */
  const AUC = ["English", "Dutch", "First-price sealed bid", "Second-price sealed bid"];
  const AUC_BANK = [
    { t: "Bidders call out ever-higher offers in an open room until nobody will go higher.", cat: "English", why: "Open and ascending: an English auction." },
    { t: "An online listing shows the current high bid, and bidders keep topping it until the timer runs out.", cat: "English", why: "Bids rise in the open: English." },
    { t: "A charity auctioneer starts at $100 and raises the price $10 at a time while paddles stay up.", cat: "English", why: "An open, ascending price: English." },
    { t: "A flower market's price clock starts high and ticks down until the first buyer presses a button.", cat: "Dutch", why: "A falling price that stops at the first acceptance: Dutch." },
    { t: "At a dockside fish sale, the auctioneer keeps lowering the asking price until someone shouts “mine.”", cat: "Dutch", why: "Descending price: Dutch." },
    { t: "A seller of 500 crates of tulips lowers the price step by step, selling crates to whoever accepts at each price.", cat: "Dutch", why: "Descending price, used to sell many lots quickly: Dutch." },
    { t: "Each bidder mails one secret offer; the highest offer wins and pays exactly what it offered.", cat: "First-price sealed bid", why: "Secret bids, winner pays own bid: first-price sealed bid." },
    { t: "Collectors slip one bid each into an envelope for a rare coin; the top bidder pays its own bid.", cat: "First-price sealed bid", why: "Sealed, and the price is the winner's own bid." },
    { t: "A city sells a surplus fire truck: bidders submit sealed offers, and the highest offer is the price paid.", cat: "First-price sealed bid", why: "Sealed, pays own bid: first-price." },
    { t: "Advertisers submit secret bids for a slot; the top bidder wins but pays the runner-up's bid.", cat: "Second-price sealed bid", why: "Sealed, winner pays the second-highest bid: Vickrey." },
    { t: "Sealed bids are opened, and the highest bidder pays the amount of the second-highest bid.", cat: "Second-price sealed bid", why: "That is the definition of a second-price (Vickrey) auction." },
    { t: "Bidders are told it is in their interest to bid exactly what the item is worth to them, since the price is set by the next-best bid.", cat: "Second-price sealed bid", why: "Truthful bidding is optimal in a Vickrey auction." },
  ];
  const MKT_TF = [
    { q: "A market requires a physical place where buyers and sellers meet.", truth: false, why: "Any arrangement for voluntary exchange is a market, including online and phone trades." },
    { q: "Market exchange is voluntary: each side trades only if it expects to gain.", truth: true, why: "Markets are the voluntary interaction of buyers and sellers." },
    { q: "A rising price signals that a good has become relatively scarcer.", truth: true, why: "Prices signal relative scarcity and abundance." },
    { q: "In a market economy, prices are set by sellers alone, whatever buyers do.", truth: false, why: "Prices come from the interaction of buyers and sellers (supply and demand)." },
    { q: "In a second-price sealed-bid auction, the winner pays the second-highest bid.", truth: true, why: "That is the Vickrey rule." },
    { q: "In a Dutch auction, the price starts low and rises until one bidder is left.", truth: false, why: "That describes an English auction. A Dutch auction starts high and falls." },
    { q: "In a first-price sealed-bid auction, bidders tend to bid less than their true value.", truth: true, why: "Bidding your full value would leave you no gain if you win, so bidders shade." },
    { q: "An English auction is a descending-price auction.", truth: false, why: "English auctions are ascending; Dutch auctions are descending." },
    { q: "Proxy bidding lets software raise your bid automatically up to a maximum you choose.", truth: true, why: "That is how proxy bidding counters sniping." },
    { q: "The labor market and the stock market are both examples of markets.", truth: true, why: "Both are arrangements where buyers and sellers exchange." },
  ];
  const genMarkets = STUDY.makeGenerator({
    id: "b251-m3-markets",
    name: "Markets, prices & auctions",
    blurb: "What a market is, what prices signal, and how English, Dutch, first-price and second-price auctions set the price.",
    variants: [
      {
        name: "Name the auction format",
        make() {
          const items = AUC.map(c => U.pick(AUC_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m3-auc", AUC_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Which auction format does each description show?",
            cats: AUC, items,
            sol: steps("Ask two questions: are bids open or sealed, and does the price go up or down?",
              "Open and rising → English. Falling → Dutch. Sealed → first-price if the winner pays its own bid, second-price (Vickrey) if it pays the runner-up's bid."),
          });
        },
      },
      {
        name: "Price paid in a sealed-bid auction",
        make() {
          const ppl = U.sample(PEOPLE, 4);
          const bids = U.sample(range(30, 120, 5), 4).map(x => x * 10).sort((a, b) => b - a);
          const order = U.shuffle([0, 1, 2, 3]);
          const second = Math.random() < 0.5;
          const item = U.pick(["a vintage bicycle", "a signed jersey", "an antique clock", "a used kayak", "a rare comic book", "a painting"]);
          const ans = second ? bids[1] : bids[0];
          const list = order.map(i => `${ppl[i]}: ${money(bids[i])}`).join("; ");
          return Q.num({
            q: `${cap(item)} is sold in a <b>${second ? "second-price (Vickrey)" : "first-price"} sealed-bid</b> auction. The sealed bids are ${list}. How much does the winner pay? ${second ? "(Ignore any bid increment.)" : ""}`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: second ? bids[0] : bids[1], why: second ? "That is the winner's own bid. In a second-price auction the winner pays the second-highest bid." : "That is the second-highest bid, which is the price under second-price rules. Here the winner pays its own bid." },
              { value: bids[3], why: "The lowest bid doesn't win anything." },
              { value: (bids[0] + bids[1]) / 2, why: "No auction format splits the difference between the top two bids." },
            ]),
            sol: steps("The highest bid always wins a sealed-bid auction. The format only decides the price.",
              `${ppl[0]} bid the most (${money(bids[0])}), so ${ppl[0]} wins.`,
              second ? `Second-price rules: pay the second-highest bid, ${ppl[1]}'s <b>${money(bids[1])}</b>.` : `First-price rules: pay your own bid, <b>${money(bids[0])}</b>.`),
          });
        },
      },
      {
        name: "Who wins an English auction, and at what price?",
        make() {
          const ppl = U.sample(PEOPLE, 3);
          const vals = U.sample(range(20, 90, 5), 3).map(x => x * 10).sort((a, b) => b - a);
          const order = U.shuffle([0, 1, 2]);
          const inc = U.pick([5, 10]);
          return Q.mc({
            q: `Three collectors want an old film poster. It is worth ${order.map(i => `${money(vals[i])} to ${ppl[i]}`).join(", ")}. In an open <b>English</b> auction with ${money(inc)} increments, each stays in as long as the price is below what the poster is worth to them. What happens?`,
            right: `${ppl[0]} wins, paying about ${money(vals[1])} (just enough to beat ${ppl[1]})`,
            wrong: [
              { t: `${ppl[0]} wins, paying ${money(vals[0])}`, why: `Bidding stops once ${ppl[1]} drops out near ${money(vals[1])}; ${ppl[0]} never has to bid all the way up to that full value.` },
              { t: `${ppl[1]} wins, paying ${money(vals[1])}`, why: `${ppl[0]} values the poster more and will outbid ${ppl[1]}.` },
              { t: `${ppl[0]} wins, paying about ${money(vals[2])}`, why: `${ppl[1]} is still bidding at that price, so the bidding keeps going.` },
            ],
            sol: steps("In an ascending auction, bidders drop out as the price passes their value. The last one standing wins.",
              `${ppl[2]} drops out near ${money(vals[2])}, then ${ppl[1]} near ${money(vals[1])}. ${ppl[0]} wins at roughly ${money(vals[1])} (the runner-up's value, give or take one increment), well below the ${money(vals[0])} the poster is worth to ${ppl[0]}.`),
          });
        },
      },
      {
        name: "Which format rewards bidding your true value?",
        make() {
          const askTruth = Math.random() < 0.5;
          if (askTruth) {
            return Q.mc({
              q: "In which auction format is bidding exactly what the item is worth to you the best strategy?",
              right: "Second-price sealed bid (Vickrey)",
              wrong: [
                { t: "First-price sealed bid", why: "You pay your own bid, so bidding your full value leaves you no gain; bidders shade below value." },
                { t: "Dutch (descending)", why: "Waiting for the price to fall to your full value means you gain nothing if you win; bidders accept below value." },
                { t: "None: shading below value is always best", why: "In a Vickrey auction your bid only decides whether you win, not what you pay, so shading only risks losing an item you'd have gained from." },
              ],
              sol: steps("Ask: does my own bid set the price I pay?",
                "In a second-price auction the price is the runner-up's bid. Bidding your true value means you win exactly when the item is worth more to you than what you'd pay, so truthful bidding is best."),
            });
          }
          return Q.mc({
            q: "Why do bidders in a <b>first-price sealed-bid</b> auction usually bid less than the item is worth to them?",
            right: "The winner pays its own bid, so bidding full value would leave no gain from winning",
            wrong: [
              { t: "The winner pays the second-highest bid", why: "That is the second-price (Vickrey) rule, where bidding true value is best." },
              { t: "They can raise their bids later if they are outbid", why: "Sealed-bid auctions allow one bid each; there is no chance to rebid." },
              { t: "The law of demand forbids bidding one's full value", why: "The law of demand is about price and quantity demanded, not auction strategy." },
            ],
            sol: steps("In a first-price auction your bid <em>is</em> your price.",
              "If you bid exactly your value, winning gains you nothing. So bidders shade down, trading a lower chance of winning for a gain when they do win. Dutch auctions work the same way."),
          });
        },
      },
      {
        name: "Sniping, proxy bidding and Dutch auctions",
        make() {
          const v = U.randInt(0, 2);
          if (v === 0) return Q.mc({
            q: "On an online auction site, several bidders wait until the last few seconds to place a bid so rivals cannot respond. What is this called, and what feature counters it?",
            right: "Sniping; proxy bidding (software raises your bid automatically up to your maximum)",
            wrong: [
              { t: "Shading; switching to a Dutch auction", why: "Shading means bidding below value in sealed or Dutch auctions; it isn't about timing." },
              { t: "Sniping; a reserve price", why: "A reserve price sets the seller's minimum; it doesn't stop last-second bids." },
              { t: "Proxy bidding; sealed bids", why: "Proxy bidding is the cure, not the problem." },
            ],
            sol: steps("Last-second bidding in an open, timed English auction is called sniping.", "With proxy bidding you enter your maximum early, and the site bids for you one increment at a time, so a sniper can't sneak in below your maximum."),
          });
          if (v === 1) return Q.mc({
            q: "A wholesaler must sell 2,000 boxes of fresh-cut flowers before they wilt this morning. Which auction format is best suited to this?",
            right: "Dutch (descending price)",
            wrong: [
              { t: "Second-price sealed bid", why: "Sealed bids take time to collect and suit a single item better." },
              { t: "English (ascending) with proxy bidding", why: "Timed ascending online auctions are slow; proxy bidding fixes sniping, not speed." },
              { t: "First-price sealed bid", why: "Collecting and opening sealed bids is slower than a falling price clock." },
            ],
            sol: steps("Which format ends the moment someone accepts?", "A Dutch auction's price falls until a buyer accepts, so sales happen quickly, and it can sell many lots in a row. That is why perishable flowers and fish are often sold this way."),
          });
          const reserve = U.randInt(4, 9) * 50;
          const top = reserve - U.randInt(1, 3) * 25;
          return Q.mc({
            q: `A seller lists a used drum kit in an English auction with a <b>reserve price</b> of ${money(reserve)}. The highest bid when the auction closes is ${money(top)}. What happens?`,
            right: "The kit is not sold, because the reserve price was not met",
            wrong: [
              { t: `The kit sells for ${money(top)}`, why: "A reserve price is the seller's minimum; bids below it don't buy the item." },
              { t: `The kit sells for ${money(reserve)} to the top bidder`, why: "The top bidder never agreed to pay the reserve price." },
              { t: `The kit sells for the second-highest bid`, why: "That rule belongs to second-price sealed-bid auctions, and the reserve still wasn't met." },
            ],
            sol: steps("A reserve price is the lowest price the seller will accept.", `The best bid (${money(top)}) is below the reserve (${money(reserve)}), so no sale takes place.`),
          });
        },
      },
      {
        name: "Auction features: select all",
        make() {
          const fmt = U.pick(AUC);
          const NM = { "English": "an English", "Dutch": "a Dutch", "First-price sealed bid": "a first-price sealed-bid", "Second-price sealed bid": "a second-price sealed-bid" };
          const nm = c => NM[c].replace(/^an? /, "");
          const FEATS = [
            { t: "Bids are made in the open, so bidders see rivals' offers", on: ["English", "Dutch"] },
            { t: "Bids are secret", on: ["First-price sealed bid", "Second-price sealed bid"] },
            { t: "The price rises during the auction", on: ["English"] },
            { t: "The price falls during the auction", on: ["Dutch"] },
            { t: "The winner pays exactly the amount of its own bid", on: ["First-price sealed bid", "Dutch", "English"] },
            { t: "The winner pays the second-highest bid", on: ["Second-price sealed bid"] },
            { t: "Bidding your true value is the best strategy", on: ["Second-price sealed bid"] },
            { t: "Each bidder gets only one bid", on: ["First-price sealed bid", "Second-price sealed bid"] },
          ];
          const opts = U.sample(FEATS.filter(f => !(fmt === "Dutch" && /only one bid/.test(f.t))), 5);
          if (!opts.some(f => f.on.includes(fmt))) opts[0] = U.pick(FEATS.filter(f => f.on.includes(fmt)));
          return Q.multi({
            q: `Select <b>every</b> feature of ${NM[fmt].split(" ")[0]} <b>${nm(fmt)}</b> auction.`,
            options: opts.map(f => ({ t: f.t, ok: f.on.includes(fmt), why: f.on.includes(fmt) ? `Yes: ${nm(fmt)} auctions work this way.` : `No: this describes ${f.on.map(nm).join(" and ")} auctions.` })),
            sol: steps("English: open, rising, pay your own final bid. Dutch: open, falling, pay the price at which you stop it.",
              "First-price sealed: one secret bid, pay your own bid. Second-price sealed (Vickrey): one secret bid, pay the runner-up's bid, so bid your true value."),
          });
        },
      },
      {
        name: "Markets and prices: true or false",
        make() {
          const s = U.pick(MKT_TF);
          return Q.tf({ q: s.q, truth: s.truth, why: s.why,
            sol: steps("A market is any arrangement for voluntary exchange; prices signal relative scarcity. For auctions, ask: open or sealed, rising or falling, whose bid sets the price?", s.why) });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Demand, the law of demand & willingness to pay
   * ============================================================ */
  const EFFECT_BANK = [
    { t: "When steak prices jump, Rafael grills chicken instead.", cat: "Substitution effect", why: "He switches to a relatively cheaper alternative." },
    { t: "As movie tickets get pricier, Ella streams films at home more often.", cat: "Substitution effect", why: "Streaming replaces the now relatively costlier tickets." },
    { t: "A rise in the price of name-brand cereal leads shoppers to buy the store brand.", cat: "Substitution effect", why: "Buyers switch to a substitute." },
    { t: "When almond milk's price rises, a café starts offering oat milk by default.", cat: "Substitution effect", why: "The café replaces the good whose relative price rose." },
    { t: "After ride-share fares rise, Kofi takes the bus to work more often.", cat: "Substitution effect", why: "He substitutes toward the relatively cheaper option." },
    { t: "Pricier beef leads a restaurant to put more pork dishes on its menu.", cat: "Substitution effect", why: "Pork substitutes for the now relatively costlier beef." },
    { t: "Uma's lunch spot raises its prices; with the same paycheck, she can afford to eat there only three days a week instead of five.", cat: "Income effect", why: "Her income buys less, so she can't afford as much." },
    { t: "Rent takes a bigger bite out of Theo's fixed stipend after it rises, so he can afford only a smaller apartment.", cat: "Income effect", why: "The higher price leaves his fixed income stretched thinner." },
    { t: "When groceries cost more, a family on a fixed budget simply buys fewer groceries overall.", cat: "Income effect", why: "The same budget now buys less." },
    { t: "Gym memberships rise in price, and Leila finds her part-time pay no longer covers both the gym and her phone bill, so she quits the gym.", cat: "Income effect", why: "The price rise cuts what her income can buy." },
    { t: "Higher concert ticket prices mean a student's monthly allowance covers one show instead of two.", cat: "Income effect", why: "The allowance's purchasing power fell." },
    { t: "With coffee pricier, Marco's weekly budget stretches to only four café visits instead of six.", cat: "Income effect", why: "His budget buys fewer cups at the higher price." },
  ];
  const DEMAND_TF = [
    { q: "The law of demand says that, other things equal, price and quantity demanded move in opposite directions.", truth: true, why: "Price and quantity demanded are inversely related." },
    { q: "A demand curve is also a willingness-and-ability-to-pay curve.", truth: true, why: "Its height at each quantity is the most someone will pay for that unit." },
    { q: "“Demand” means the quantity people buy at the current price.", truth: false, why: "That is quantity demanded. Demand is the whole schedule of quantities at every price." },
    { q: "Wanting a good is enough to count as demand, even if you could never afford it.", truth: false, why: "Demand requires willingness <em>and ability</em> to pay." },
    { q: "The income effect of a price rise refers to people's salaries going up.", truth: false, why: "Income stays the same; the higher price makes it buy less." },
    { q: "Willingness to pay for one more unit measures that unit's marginal benefit.", truth: true, why: "Economists measure marginal benefit by willingness to pay." },
    { q: "Demand curves slope upward because people want more of things that cost more.", truth: false, why: "Demand curves slope downward: higher prices mean smaller quantities demanded." },
    { q: "Market quantity demanded at a price is the sum of every buyer's quantity demanded at that price.", truth: true, why: "Market demand is the horizontal sum of individual demands." },
    { q: "The substitution effect works through a change in the good's relative price (its opportunity cost).", truth: true, why: "A higher relative price makes substitutes more attractive." },
  ];
  const genDemand = STUDY.makeGenerator({
    id: "b251-m3-demand",
    name: "Demand, the law of demand & willingness to pay",
    blurb: "Build demand from willingness to pay, add individual demands, read marginal benefit off the curve, and explain the downward slope.",
    variants: [
      {
        name: "Quantity demanded from willingness to pay",
        make() {
          const n = U.randInt(6, 8);
          const ppl = U.sample(PEOPLE, n);
          const g = U.pick([{ s: "concert ticket", p: "concert tickets" }, { s: "used textbook", p: "used textbooks" }, { s: "pair of headphones", p: "pairs of headphones" }, { s: "bike tune-up", p: "bike tune-ups" }, { s: "phone repair", p: "phone repairs" }]);
          const wtp = U.sample(range(10, 80, 5), n);
          const sorted = wtp.slice().sort((a, b) => a - b);
          const cand = range(sorted[1] + 1, sorted[n - 2] - 1, 1).filter(p => !wtp.includes(p));
          const nice = cand.filter(p => p % 5 === 0);
          const P = U.pick(nice.length ? nice : cand);
          const ans = wtp.filter(w => w >= P).length;
          return Q.num({
            q: `Each of these buyers wants at most one ${g.s}. The most each is willing to pay: ${ppl.map((p, i) => `${p} ${money(wtp[i])}`).join(", ")}. If the price is <b>${money(P)}</b>, what is the quantity demanded?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              { value: n - ans, why: "That counts buyers whose willingness to pay is <em>below</em> the price; they won't buy." },
              { value: n, why: "Not everyone buys: only those who value the good at least as much as the price." },
            ]),
            sol: steps("A buyer purchases only if the good is worth at least the price to them (willingness to pay ≥ price).",
              `Willingness to pay of ${money(P)} or more: ${wtp.filter(w => w >= P).sort((a, b) => b - a).map(money).join(", ") || "nobody"}.`,
              `So quantity demanded is <b>${ans}</b>. Raise the price and fewer buyers clear the bar: that is the law of demand.`),
          });
        },
      },
      {
        name: "Market demand: add the individual demands",
        make() {
          const ppl = U.sample(PEOPLE, 3);
          const g = U.pick(NG);
          const prices = U.pick([[2, 3, 4, 5], [4, 6, 8, 10], [1, 2, 3, 4], [5, 10, 15, 20]]);
          const rows = ppl.map(() => { let q = U.randInt(6, 14); return prices.map((_, i) => (i === 0 ? q : (q = Math.max(0, q - U.randInt(1, 4))))); });
          const k = U.randInt(0, 3);
          const ans = rows.reduce((s, r) => s + r[k], 0);
          return Q.num({
            q: `Three buyers' weekly demand for ${g.p}:${tbl(["Price", ...ppl], prices.map((p, i) => [money(p), rows[0][i], rows[1][i], rows[2][i]]))}What is the <b>market</b> quantity demanded at ${money(prices[k])}?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              { value: Math.round(ans / 3), why: "Market demand adds the quantities; it doesn't average them." },
              { value: rows.reduce((s, r) => s + r[(k + 1) % 4], 0), why: `That is the total at ${money(prices[(k + 1) % 4])}, a different price.` },
              { value: Math.max(...rows.map(r => r[k])), why: "That is just the largest single buyer. Add all three." },
            ]),
            sol: steps("Market demand is the <b>horizontal</b> sum: at each price, add the quantities every buyer wants.",
              `At ${money(prices[k])}: ${rows.map(r => r[k]).join(" + ")} = <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Substitution effect or income effect?",
        make() {
          const cats = ["Substitution effect", "Income effect"];
          const items = cats.map(c => U.pick(EFFECT_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m3-eff", EFFECT_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Each situation shows a price rise reducing quantity demanded. Which effect does it illustrate?",
            cats, items,
            sol: steps("Look for the reason given. <b>Switching to an alternative</b> because this good is now relatively pricier → substitution effect.",
              "<b>Can't afford as much</b> because the same income or budget now buys less → income effect."),
          });
        },
      },
      {
        name: "Why demand slopes down: which is NOT a reason?",
        make() {
          const notR = U.pick([
            { t: "A higher price raises sellers' marginal cost of production", why: "Marginal cost explains the supply curve, not demand." },
            { t: "At a higher price, sellers are willing to offer more units", why: "That is the law of supply." },
            { t: "A higher price makes buyers' incomes rise", why: "Buyers' incomes don't rise when a price rises; their income just buys less." },
            { t: "Buyers expect the good to become even pricier, so they buy more now", why: "That is an expectations shift of demand, not a reason for the slope." },
          ]);
          const reasons = U.sample([
            { t: "When the price rises, buyers switch to relatively cheaper substitutes", why: "This is the substitution effect, a reason demand slopes down." },
            { t: "When the price rises, buyers' fixed incomes buy less, so they buy less", why: "This is the income effect, a reason demand slopes down." },
            { t: "Each extra unit is worth less to buyers than the one before", why: "Decreasing marginal benefit means only a lower price sells more units." },
            { t: "At lower prices, buyers with lower willingness to pay enter the market", why: "This is why the demand (willingness-to-pay) curve slopes down." },
          ], 3);
          return Q.mc({
            q: "Each statement below but one helps explain why a demand curve slopes <b>downward</b>. Which is <b>NOT</b> a reason?",
            right: notR.t, rightWhy: notR.why,
            wrong: reasons,
            sol: steps("The slope of demand comes from the buyers' side: the substitution effect, the income effect, and decreasing marginal benefit (willingness to pay).",
              `"${notR.t}" — ${notR.why}`),
          });
        },
      },
      {
        name: "Read marginal benefit off the demand curve",
        make() {
          const g = U.pick(NG);
          const slope = U.pick([1, 0.5]);
          const pmax = slope === 1 ? U.randInt(9, 12) : U.pick([10, 12]);
          const qEnd = pmax / slope;
          const Qq = slope === 1 ? U.randInt(2, qEnd - 2) : 2 * U.randInt(1, qEnd / 2 - 1);
          const ans = pmax - slope * Qq;
          const X = qEnd + 2;
          const gph = G.plot({ xLabel: `${cap(g.p)} (per day)`, yLabel: "Price ($)", xMax: X, yMax: pmax + 2, xTicks: range(slope === 1 ? 1 : 2, X, slope === 1 ? 1 : 2), yTicks: range(1, pmax + 2, 1),
            curves: [{ pts: [[0, pmax], [qEnd * 0.84, pmax - slope * qEnd * 0.84], [qEnd, 0]], style: "main", label: "D", labelAt: 1 }], aria: "Demand curve" });
          return Q.num({
            q: `The graph shows the daily demand for ${g.p} at a stall.${gph}What is the <b>most</b> any buyer is willing to pay for the ${ord(Qq)} unit (its marginal benefit)?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: pmax, why: "That is the willingness to pay for the very first unit, not this one." },
              { value: Qq, why: "That is the quantity, not the price. Read up from the quantity to the curve, then across to the price axis." },
              { value: ans * Qq, why: "That multiplies price by quantity. Marginal benefit is just the height of the curve at that unit." },
            ]),
            sol: steps("Read a demand curve as a willingness-to-pay curve: go up from the quantity to the curve, then across to the price axis.",
              `At ${Qq} units the curve is at <b>${money(ans)}</b>. That is the marginal benefit of the ${ord(Qq)} unit: the most someone will pay for it.`),
          });
        },
      },
      {
        name: "Linear demand: change in quantity demanded",
        make() {
          const g = U.pick(NG);
          const b = U.randInt(2, 8);
          const choke = U.randInt(15, 40);
          const a = b * choke;
          const p1 = U.randInt(3, choke - 8), p2 = p1 + U.randInt(2, Math.min(6, choke - p1 - 2));
          const up = Math.random() < 0.5;
          const from = up ? p1 : p2, to = up ? p2 : p1;
          const ans = b * Math.abs(p2 - p1);
          return Q.num({
            q: `Demand for ${g.p} is ${qdTxt(a, b)}, where Q is in ${g.u} and P is in dollars. If the price ${up ? "rises" : "falls"} from ${money(from)} to ${money(to)}, by how much does the quantity demanded ${up ? "fall" : "rise"}?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: a - b * to, why: "That is the new quantity demanded, not the change." },
              { value: Math.abs(p2 - p1), why: `That is the change in price. Each $1 changes quantity demanded by ${b}.` },
              { value: a - b * from, why: "That is the original quantity demanded." },
            ]),
            sol: steps(`In ${qdTxt(a, b)}, each $1 increase in price reduces quantity demanded by ${b}.`,
              `At ${money(from)}: Q<sub>d</sub> = ${a - b * from}. At ${money(to)}: Q<sub>d</sub> = ${a - b * to}.`,
              `Change = ${b} × ${Math.abs(p2 - p1)} = <b>${ans}</b>. This is a movement along the demand curve.`),
          });
        },
      },
      {
        name: "Highest willingness to pay: the choke price",
        make() {
          const g = U.pick(NG);
          const b = U.randInt(2, 9);
          const choke = U.randInt(12, 45);
          const a = b * choke;
          return Q.num({
            q: `Market demand for ${g.p} is ${qdTxt(a, b)} (Q in ${g.u}, P in dollars). At what price does quantity demanded fall to zero? (This is the most any buyer would pay for the very first unit.)`,
            answer: choke, unit: "$",
            traps: traps(choke, [
              { value: a, why: "That is the quantity demanded when the price is zero, not the price where quantity is zero." },
              { value: a - b, why: "That is the quantity demanded at $1." },
              { value: choke / 2, why: "Set Q<sub>d</sub> = 0 and solve: the full intercept, not half of it." },
            ]),
            sol: steps("Set quantity demanded to zero and solve for P.",
              `0 = ${a} − ${b}P → P = ${a} ÷ ${b} = <b>${money(choke)}</b>. Above this price nobody buys; it is where the demand curve meets the price axis.`),
          });
        },
      },
      {
        name: "Demand facts: true or false",
        make() {
          const s = U.pick(DEMAND_TF);
          return Q.tf({ q: s.q, truth: s.truth, why: s.why,
            sol: steps("Demand = willingness and ability to buy at each price, other things constant. Quantity demanded = one point on it.", s.why) });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Determinants of demand
   * ============================================================ */
  const DCATS = ["Demand increases (shifts right)", "Demand decreases (shifts left)", "No shift: movement along demand"];
  const DDETS = [DI, DT, DR, DE, DN];
  const NORMAL = ["restaurant meals", "overseas vacations", "new cars", "concert tickets", "organic produce", "designer jeans", "fitness-club memberships"];
  const INFERIOR = ["instant noodles", "bus rides", "store-brand cereal", "used clothing", "canned meat", "second-hand furniture"];
  const MASS = new Set(["organic produce", "store-brand cereal", "used clothing", "canned meat", "second-hand furniture"]);
  const isAre = g => (MASS.has(g) ? "is" : "are");
  const SUBS = [["coffee", "tea"], ["butter", "margarine"], ["chicken", "pork"], ["e-books", "printed books"], ["train tickets", "bus tickets"], ["blueberries", "strawberries"], ["streaming subscriptions", "movie tickets"]];
  const COMPS = [["printers", "ink cartridges"], ["hot dogs", "hot dog buns"], ["video game consoles", "video games"], ["tennis rackets", "tennis balls"], ["cars", "gasoline"], ["smartphones", "phone cases"], ["peanut butter", "jelly"], ["ski passes", "ski rentals"]];
  const genDShift = STUDY.makeGenerator({
    id: "b251-m3-dshift",
    name: "Determinants of demand",
    blurb: "Decide whether an event shifts demand right, left or not at all: income (normal vs inferior), tastes, related goods, expectations and number of buyers.",
    variants: [
      {
        name: "Shift right, shift left, or move along?",
        make() {
          const items = [];
          const plus = U.pick(evOf("D", 1)), minus = U.pick(evOf("D", -1));
          items.push({ t: tag(plus), cat: DCATS[0], why: plus.why });
          items.push({ t: tag(minus), cat: DCATS[1], why: minus.why });
          const mv = Math.random() < 0.5 ? U.pick(DMOVE) : (e => ({ t: tag(e), why: `This changes sellers' costs or plans, so <em>supply</em> shifts. On the demand side buyers only react to the new price: a movement along demand.` }))(U.pick(evOf("S")));
          items.push({ t: mv.t, cat: DCATS[2], why: mv.why });
          for (const e of U.deal("m3-dev", evOf("D"), 6)) {
            if (items.length >= 5) break;
            if (items.some(i => i.t === tag(e))) continue;
            items.push({ t: tag(e), cat: e.dir > 0 ? DCATS[0] : DCATS[1], why: e.why });
          }
          return Q.classify({
            q: "What happens to the <b>demand</b> curve in the market named in bold?",
            cats: DCATS, items,
            sol: steps("First ask: did the good's <em>own</em> price change, or did something else change? Own price (or a cost change on the sellers' side) → movement along demand.",
              "For anything else, ask whether buyers now want more (right) or less (left) at every price. Watch normal vs inferior goods and substitutes vs complements."),
          });
        },
      },
      {
        name: "Name the determinant of demand",
        make() {
          const cats = U.sample(DDETS, 4);
          const pool = evOf("D").filter(e => cats.includes(e.det));
          const items = cats.map(c => { const e = U.pick(pool.filter(x => x.det === c)); return { t: tag(e), cat: c, why: `${e.det}: ${e.why}` }; });
          const extra = U.pick(pool.filter(e => !items.some(i => i.t === tag(e))));
          items.push({ t: tag(extra), cat: extra.det, why: `${extra.det}: ${extra.why}` });
          return Q.classify({
            q: "Each event shifts the demand curve in the market named in bold. Through which <b>determinant of demand</b> does it work?",
            cats, items,
            sol: steps("The determinants of demand: income, tastes and preferences, prices of related goods, expectations, number of buyers.",
              "Ask what actually changed for buyers: their income, how much they like the good, the price of a substitute or complement, what they expect about the future, or how many of them there are."),
          });
        },
      },
      {
        name: "Normal or inferior? Read it from the data",
        make() {
          const inf = Math.random() < 0.5;
          const g = U.pick(inf ? INFERIOR : NORMAL);
          const up = Math.random() < 0.5;
          const pct = U.randInt(4, 12);
          const more = inf ? !up : up;
          const city = U.pick(["Bloomington", "a mid-sized city", "a college town", "the region"]);
          return Q.mc({
            q: `When average incomes in ${city} ${up ? "rose" : "fell"} by ${pct}%, shoppers wanted <b>${more ? "more" : MASS.has(g) ? "less" : "fewer"}</b> ${g} at every price. Based on this, ${g} ${isAre(g)}:`,
            right: inf ? "An inferior good" : "A normal good",
            wrong: [
              { t: inf ? "A normal good" : "An inferior good", why: inf ? "For a normal good, demand moves in the same direction as income. Here it moved the opposite way." : "For an inferior good, demand moves opposite to income. Here it moved the same way." },
              { t: "A substitute", why: "Substitutes are defined by how demand responds to <em>another good's price</em>, not to income." },
              { t: "Impossible to tell without the price of the good", why: "The response to income at every price is exactly what defines normal vs inferior." },
            ],
            sol: steps("Normal good: income and demand move in the <b>same</b> direction. Inferior good: they move in <b>opposite</b> directions.",
              `Income ${up ? "rose" : "fell"} and demand ${more ? "rose" : "fell"}: ${inf ? "opposite directions, so it is <b>inferior</b>" : "same direction, so it is <b>normal</b>"}.`),
          });
        },
      },
      {
        name: "Substitutes or complements? Read it from the data",
        make() {
          const sub = Math.random() < 0.5;
          const pair = U.shuffle(U.pick(sub ? SUBS : COMPS));
          const [x, y] = pair;
          const up = Math.random() < 0.5;
          const more = sub ? up : !up;
          return Q.mc({
            q: `The price of ${y} ${up ? "rose" : "fell"} sharply, and buyers then wanted <b>${more ? "more" : "fewer"}</b> ${x} at every price of ${x}. In consumption, ${x} and ${y} are:`,
            right: sub ? "Substitutes" : "Complements",
            wrong: [
              { t: sub ? "Complements" : "Substitutes", why: sub ? "For complements, a higher price of one lowers demand for the other. Here demand moved the same way as the other good's price." : "For substitutes, a higher price of one raises demand for the other. Here demand moved opposite to the other good's price." },
              { t: "Unrelated goods", why: "Demand for one responded to the price of the other, so they are related." },
              { t: "Normal goods", why: "Normal vs inferior is about the response to income, not to another good's price." },
            ],
            sol: steps("Substitutes: other good's price and this good's demand move in the <b>same</b> direction. Complements: <b>opposite</b> directions.",
              `Price of ${y} ${up ? "rose" : "fell"}, demand for ${x} ${more ? "rose" : "fell"} → <b>${sub ? "substitutes" : "complements"}</b>.`),
          });
        },
      },
      {
        name: "Predict the shift",
        make() {
          const kind = U.randInt(0, 3);
          let q, ans, why;
          if (kind === 0) {
            const inf = Math.random() < 0.5, up = Math.random() < 0.5;
            const g = U.pick(inf ? INFERIOR : NORMAL);
            q = `Incomes ${up ? "rise" : "fall"}, and ${g} ${isAre(g)} ${inf ? "an inferior" : "a normal"} good. What happens to the demand for ${g}?`;
            ans = (inf ? !up : up) ? 0 : 1;
            why = `${inf ? "Inferior" : "Normal"} good: demand moves ${inf ? "opposite to" : "with"} income. Income ${up ? "rose" : "fell"}, so demand ${ans === 0 ? "increases" : "decreases"}.`;
          } else if (kind === 1) {
            const sub = Math.random() < 0.5, up = Math.random() < 0.5;
            const [x, y] = U.shuffle(U.pick(sub ? SUBS : COMPS));
            q = `${cap(y)} and ${x} are ${sub ? "substitutes" : "complements"}. The price of ${y} ${up ? "rises" : "falls"}. What happens to the demand for ${x}?`;
            ans = (sub ? up : !up) ? 0 : 1;
            why = `${sub ? "Substitutes" : "Complements"}: a ${up ? "higher" : "lower"} price of ${y} ${ans === 0 ? "raises" : "lowers"} demand for ${x}.`;
          } else if (kind === 2) {
            const up = Math.random() < 0.5;
            const g = U.pick(["laptops", "airline tickets", "winter coats", "televisions", "sneakers"]);
            if (Math.random() < 0.6) {
              q = `Buyers come to expect that the price of ${g} will ${up ? "rise" : "fall"} next month. What happens to the demand for ${g} <b>today</b>?`;
              ans = up ? 0 : 1;
              why = up ? "Expecting a higher future price, buyers buy now: demand today increases." : "Expecting a lower future price, buyers wait: demand today decreases.";
            } else {
              q = `The price of ${g} ${up ? "rises" : "falls"} today, and nothing else changes. What happens to the demand for ${g}?`;
              ans = 2;
              why = `Only the good's own price changed, so quantity demanded ${up ? "falls" : "rises"} along an unchanged demand curve.`;
            }
          } else {
            const up = Math.random() < 0.5;
            const g = U.pick(["daycare services", "pizza delivery", "haircuts", "rental apartments", "groceries"]);
            q = `A town's population ${up ? "grows by a fifth as new families move in" : "shrinks by a fifth as families move away"}. What happens to the demand for ${g} in the town?`;
            ans = up ? 0 : 1;
            why = `Number of buyers ${up ? "rises" : "falls"}, so demand ${up ? "increases" : "decreases"}.`;
          }
          const opts = ["Demand shifts right (increases)", "Demand shifts left (decreases)", "No shift: a movement along the demand curve"];
          return Q.mc({
            q, right: opts[ans], keepOrder: opts,
            wrong: opts.filter((_, i) => i !== ans).map(t => ({ t, why: t.startsWith("No shift") ? "A non-price determinant changed, so the whole curve shifts." : ans === 2 ? "A change in the good's own price never shifts its own demand curve." : "That is the opposite direction. " + why })),
            sol: steps("Is it the good's own price (move along) or a non-price determinant (shift)?", why),
          });
        },
      },
      {
        name: "Select every event that raises demand",
        make() {
          for (let tries = 0; tries < 50; tries++) {
            const mk = U.pick(MKT);
            const own = { t: `${cap(mk.price)} falls.`, ok: false, why: "A lower own price raises quantity demanded (a movement along the curve), not demand." };
            const pool = mk.D.map(e => ({ t: e.t, ok: e.dir > 0, why: e.why + (e.dir > 0 ? "" : " That decreases demand.") }))
              .concat(mk.S.map(e => ({ t: e.t, ok: false, why: "This is a supply-side change (sellers' costs or plans); it does not shift demand." })));
            const opts = U.sample(pool, 4).concat(Math.random() < 0.5 ? [own] : U.sample(pool.filter(p => !p.ok), 1));
            const uniq = opts.filter((o, i) => opts.findIndex(p => p.t === o.t) === i);
            if (uniq.length < 5 || !uniq.some(o => o.ok)) continue;
            return Q.multi({
              q: `Select <b>every</b> event that would <b>increase the demand</b> for ${mk.m} (shift the demand curve right).`,
              options: uniq,
              sol: steps("Only non-price determinants on the buyers' side shift demand: income, tastes, related goods' prices, expectations, number of buyers.",
                "Changes in sellers' costs, technology, taxes or number of firms shift <em>supply</em>. A change in the good's own price moves buyers along the curve."),
            });
          }
          return null;
        },
      },
      {
        name: "Which is NOT a determinant of demand?",
        make() {
          const notD = U.pick([
            { t: "The price of the good itself", why: "Own price changes quantity demanded (a movement along the curve); it is not a shifter." },
            { t: "The cost of the inputs used to make the good", why: "Input costs affect sellers, so they shift supply." },
            { t: "The technology used to produce the good", why: "Technology affects sellers' costs, so it shifts supply." },
            { t: "The number of firms selling the good", why: "The number of sellers shifts supply." },
          ]);
          const yes = U.sample([
            { t: "Buyers' incomes", why: "Income is a determinant of demand." },
            { t: "The price of a substitute", why: "Prices of related goods shift demand." },
            { t: "The price of a complement", why: "Prices of related goods shift demand." },
            { t: "Buyers' expectations of future prices", why: "Expectations shift demand." },
            { t: "The number of buyers in the market", why: "Market size shifts demand." },
            { t: "Tastes and preferences", why: "Tastes shift demand." },
          ], 3);
          return Q.mc({
            q: "Which of the following is <b>NOT</b> a determinant (shifter) of the demand for a good?",
            right: notD.t, rightWhy: notD.why, wrong: yes,
            sol: steps("Demand shifters are the things that change <em>buyers'</em> plans other than the good's own price.", notD.why),
          });
        },
      },
      {
        name: "Which event explains this demand shift?",
        make() {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const mk = U.pick(MKT);
          const right = U.pick(mk.D.filter(e => e.dir === dir));
          const a = 24, b = 2, k = 8 * dir;
          const gph = G.plot({ xLabel: `Quantity of ${mk.m}`, yLabel: "Price", xMax: 36, yMax: 14, xTicks: [], yTicks: [],
            curves: [dCurve(a, b, 36, 14, "D₁"), dCurve(a + k, b, 36, 14, "D₂", "dash")],
            arrows: [{ from: [a - 10 + (dir > 0 ? 1 : -1), 5], to: [a - 10 + k - (dir > 0 ? 1 : -1), 5] }], aria: "Demand shifts from D1 to D2" });
          const wrong = [
            ...U.sample(mk.D.filter(e => e.dir === -dir), 1).map(e => ({ t: e.t, why: `This would shift demand the other way (${dir > 0 ? "left" : "right"}).` })),
            ...U.sample(mk.S, 1).map(e => ({ t: e.t, why: "This shifts supply, not demand." })),
            { t: `${cap(mk.price)} ${dir > 0 ? "falls" : "rises"}.`, why: "A change in the good's own price moves buyers along D₁; it does not shift the curve." },
          ];
          return Q.mc({
            q: `In the market for ${mk.m}, demand moves from D₁ to D₂.${gph}Which event could cause this?`,
            right: right.t, rightWhy: right.why, wrong,
            sol: steps(`D₂ lies to the ${dir > 0 ? "right" : "left"} of D₁: buyers want ${dir > 0 ? "more" : "less"} at every price, so demand has ${dir > 0 ? "increased" : "decreased"}.`,
              `Look for a buyer-side, non-price change in that direction: ${right.why}`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Supply, minimum supply price & determinants of supply
   * ============================================================ */
  const SCATS = ["Supply increases (shifts right)", "Supply decreases (shifts left)", "No shift: movement along supply"];
  const SDETS = [SC, ST, SR, SX, SE, SN];
  const PROD_SUB = [
    { x: "corn", y: "soybeans", how: "grow on the same farmland" },
    { x: "pickup trucks", y: "sedans", how: "are built on the same assembly lines" },
    { x: "long-term apartment leases", y: "short-term vacation rentals", how: "use the same apartments" },
    { x: "croissants", y: "baguettes", how: "are baked in the same ovens by the same bakers" },
    { x: "wool sweaters", y: "wool blankets", how: "use the same knitting machines and wool" },
  ];
  const PROD_COMP = [
    { x: "beef", y: "leather", how: "come from the same cattle" },
    { x: "wool", y: "lamb meat", how: "come from the same flocks of sheep" },
    { x: "lumber", y: "wood chips", how: "come out of the same sawmill logs" },
    { x: "chicken breasts", y: "chicken wings", how: "come from the same birds" },
    { x: "natural gas", y: "crude oil", how: "often come out of the same wells" },
  ];
  const genSupply = STUDY.makeGenerator({
    id: "b251-m3-supply",
    name: "Supply, marginal cost & determinants of supply",
    blurb: "Build supply from marginal cost, read the minimum supply price, and decide what shifts supply: input costs, technology, related goods, taxes and subsidies, expectations, number of firms.",
    variants: [
      {
        name: "Shift right, shift left, or move along?",
        make() {
          const items = [];
          const plus = U.pick(evOf("S", 1)), minus = U.pick(evOf("S", -1));
          items.push({ t: tag(plus), cat: SCATS[0], why: plus.why });
          items.push({ t: tag(minus), cat: SCATS[1], why: minus.why });
          const mv = Math.random() < 0.5 ? U.pick(SMOVE) : (e => ({ t: tag(e), why: "This changes buyers' plans, so <em>demand</em> shifts. Sellers only respond to the new price: a movement along supply." }))(U.pick(evOf("D")));
          items.push({ t: mv.t, cat: SCATS[2], why: mv.why });
          for (const e of U.deal("m3-sev", evOf("S"), 6)) {
            if (items.length >= 5) break;
            if (items.some(i => i.t === tag(e))) continue;
            items.push({ t: tag(e), cat: e.dir > 0 ? SCATS[0] : SCATS[1], why: e.why });
          }
          return Q.classify({
            q: "What happens to the <b>supply</b> curve in the market named in bold?",
            cats: SCATS, items,
            sol: steps("Did the good's own price change (or did something change only for buyers)? Then sellers just move along their supply curve.",
              "Otherwise ask whether producing and selling got cheaper or more attractive (supply right) or costlier or less attractive (supply left)."),
          });
        },
      },
      {
        name: "Name the determinant of supply",
        make() {
          const cats = U.sample(SDETS, 4);
          const pool = evOf("S").filter(e => cats.includes(e.det));
          const items = cats.map(c => { const e = U.pick(pool.filter(x => x.det === c)); return { t: tag(e), cat: c, why: `${e.det}: ${e.why}` }; });
          const extra = U.pick(pool.filter(e => !items.some(i => i.t === tag(e))));
          if (extra) items.push({ t: tag(extra), cat: extra.det, why: `${extra.det}: ${extra.why}` });
          return Q.classify({
            q: "Each event shifts the supply curve in the market named in bold. Through which <b>determinant of supply</b> does it work?",
            cats, items,
            sol: steps("The determinants of supply: input costs, technology and productivity, prices of related goods in production, taxes and subsidies, price expectations, number of firms.",
              "A per-unit tax or subsidy belongs to “taxes and subsidies” even though it acts like a cost change. Another good the same resources could make points to “related goods in production”."),
          });
        },
      },
      {
        name: "Quantity supplied from marginal cost",
        make() {
          const f = U.pick(FIRMS);
          const g = U.pick(NG);
          const mc = [U.randInt(2, 6)];
          for (let i = 1; i < 7; i++) mc.push(mc[i - 1] + U.randInt(1, 4));
          const k = U.randInt(2, 5);
          const P = U.pick(range(mc[k - 1], mc[k] - 1, 1).map(p => p + 0.5).filter(p => p < mc[k]));
          const ans = mc.filter(m => m <= P).length;
          return Q.num({
            q: `${f} sells ${g.p}. The marginal cost of each unit it produces in a day is:${tbl(["Unit", ...mc.map((_, i) => ord(i + 1))], [["Marginal cost", ...mc.map(money)]])}If the market price is <b>${U.money(P, 2)}</b>, how many units will ${f} supply?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              { value: 7 - ans, why: "That counts the units whose marginal cost is <em>above</em> the price; those would lose money." },
              { value: 7, why: "Units whose marginal cost exceeds the price aren't worth producing." },
              { value: ans - 1, why: `The ${ord(ans)} unit still costs less than the price, so it is worth supplying.` },
            ]),
            sol: steps("A seller supplies a unit only if the price at least covers its marginal cost.",
              `Units with MC ≤ ${U.money(P, 2)}: ${mc.filter(m => m <= P).map(money).join(", ")}. The next unit costs ${money(mc[ans])}, more than the price.`,
              `So quantity supplied is <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Minimum supply price of a unit",
        make() {
          const f = U.pick(FIRMS);
          const g = U.pick(NG);
          const mc = [U.randInt(3, 8)];
          for (let i = 1; i < 6; i++) mc.push(mc[i - 1] + U.randInt(1, 5));
          const tc = mc.reduce((acc, m, i) => { acc.push((acc[i - 1] || 0) + m); return acc; }, []);
          const n = U.randInt(3, 6);
          const ans = mc[n - 1];
          const showTotal = Math.random() < 0.5;
          const table = showTotal
            ? tbl(["Units per day", ...tc.map((_, i) => i + 1)], [["Total cost", ...tc.map(money)]])
            : tbl(["Unit", ...mc.map((_, i) => ord(i + 1))], [["Marginal cost", ...mc.map(money)]]);
          return Q.num({
            q: `${f} makes ${g.p}. ${showTotal ? "Its total cost of production is:" : "The marginal cost of each unit is:"}${table}What is the <b>lowest price</b> at which ${f} would be willing to supply the ${ord(n)} unit?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: tc[n - 1], why: "That is the total cost of all units so far. Only the extra cost of this one unit matters." },
              { value: U.round(tc[n - 1] / n, 2), why: "That is average cost. The minimum supply price is the marginal cost of the last unit." },
              { value: mc[n - 2], why: "That is the marginal cost of the previous unit." },
            ]),
            sol: steps("The supply curve is a minimum-supply-price curve: the lowest price that brings out a unit equals that unit's marginal cost.",
              showTotal ? `Marginal cost of unit ${n} = total cost at ${n} − total cost at ${n - 1} = ${money(tc[n - 1])} − ${money(tc[n - 2])} = ${money(ans)}.` : `The table gives it directly: the ${ord(n)} unit's marginal cost is ${money(ans)}.`,
              `So the minimum supply price is <b>${money(ans)}</b>. Marginal cost rises with each unit, which is why the supply curve slopes up.`),
          });
        },
      },
      {
        name: "Related goods in production",
        make() {
          const sub = Math.random() < 0.5;
          const pr = U.pick(sub ? PROD_SUB : PROD_COMP);
          const up = Math.random() < 0.5;
          const ans = (sub ? !up : up) ? 0 : 1;
          const opts = ["Supply shifts right (increases)", "Supply shifts left (decreases)", "No shift: a movement along the supply curve"];
          const why = sub
            ? `${cap(pr.x)} and ${pr.y} ${pr.how}: substitutes in production. When ${pr.y} become ${up ? "more" : "less"} profitable, producers move resources ${up ? "toward" : "away from"} ${pr.y} ${up ? "and away from" : "and back toward"} ${pr.x}.`
            : `${cap(pr.x)} and ${pr.y} ${pr.how}: complements (joint products) in production. A ${up ? "higher" : "lower"} price of ${pr.y} makes producing the joint output ${up ? "more" : "less"} rewarding, so producers offer ${up ? "more" : "less"} ${pr.x} too.`;
          return Q.mc({
            q: `${cap(pr.x)} and ${pr.y} ${pr.how}. The price of ${pr.y} ${up ? "rises" : "falls"} sharply. What happens to the <b>supply of ${pr.x}</b>?`,
            right: opts[ans], keepOrder: opts,
            wrong: opts.filter((_, i) => i !== ans).map(t => ({ t, why: t.startsWith("No shift") ? `The price of a <em>different</em> good changed, which is a non-price determinant of ${pr.x}, so the curve shifts.` : `Wrong direction. ${why}` })),
            sol: steps("Is the other good a substitute in production (competes for the same resources) or a complement in production (made together)?", why,
              `So the supply of ${pr.x} ${ans === 0 ? "increases" : "decreases"}.`),
          });
        },
      },
      {
        name: "Why supply slopes up: which is NOT a reason?",
        make() {
          const notR = U.pick([
            { t: "Buyers value each extra unit less than the one before", why: "Decreasing marginal benefit explains the demand curve, not supply." },
            { t: "At a higher price, buyers switch to substitutes", why: "That is the substitution effect on the demand side." },
            { t: "Higher prices raise the cost of the inputs sellers use", why: "A good's own price doesn't change input costs; input costs are a separate supply shifter." },
          ]);
          const yes = U.sample([
            { t: "Marginal cost rises as a firm produces more", why: "Increasing marginal cost is the basic reason for the law of supply." },
            { t: "Sellers supply a unit only if the price at least covers its marginal cost", why: "So higher prices bring out the costlier extra units." },
            { t: "Producing more pulls in resources that are less suited to making the good", why: "That makes extra units costlier, so a higher price is needed to cover them." },
            { t: "A higher price makes it worthwhile to run overtime shifts that cost more per unit", why: "Higher prices cover higher marginal costs." },
          ], 3);
          return Q.mc({
            q: "All but one of these help explain why a supply curve slopes <b>upward</b>. Which is <b>NOT</b> a reason?",
            right: notR.t, rightWhy: notR.why, wrong: yes,
            sol: steps("The upward slope of supply comes from <b>increasing marginal cost</b>: the price must cover the cost of each extra unit.", notR.why),
          });
        },
      },
      {
        name: "Select every event that increases supply",
        make() {
          for (let tries = 0; tries < 50; tries++) {
            const mk = U.pick(MKT);
            const own = { t: `${cap(mk.price)} rises.`, ok: false, why: "A higher own price raises quantity supplied (a movement along the curve), not supply." };
            const pool = mk.S.map(e => ({ t: e.t, ok: e.dir > 0, why: e.why + (e.dir > 0 ? "" : " That decreases supply.") }))
              .concat(mk.D.map(e => ({ t: e.t, ok: false, why: "This changes buyers' plans, so it shifts demand, not supply." })));
            const opts = U.sample(pool, 4).concat(Math.random() < 0.5 ? [own] : U.sample(pool.filter(p => !p.ok), 1));
            const uniq = opts.filter((o, i) => opts.findIndex(p => p.t === o.t) === i);
            if (uniq.length < 5 || !uniq.some(o => o.ok)) continue;
            return Q.multi({
              q: `Select <b>every</b> event that would <b>increase the supply</b> of ${mk.m} (shift the supply curve right).`,
              options: uniq,
              sol: steps("Supply shifts right when producing or selling becomes cheaper or more attractive: lower input costs, better technology, a subsidy, more firms, or a relevant change in related goods or expectations.",
                "Buyer-side changes shift demand; a change in the good's own price moves sellers along the curve."),
            });
          }
          return null;
        },
      },
      {
        name: "Market supply: add the firms' supplies",
        make() {
          const fs = U.sample(FIRMS, 3);
          const g = U.pick(NG);
          const prices = U.pick([[2, 3, 4, 5], [4, 6, 8, 10], [10, 15, 20, 25], [1, 2, 3, 4]]);
          const rows = fs.map(() => { let q = U.randInt(0, 5); return prices.map((_, i) => (i === 0 ? q : (q = q + U.randInt(1, 5)))); });
          const k = U.randInt(0, 3);
          const ans = rows.reduce((s, r) => s + r[k], 0);
          return Q.num({
            q: `Three firms supply ${g.p} (${g.u}):${tbl(["Price", ...fs], prices.map((p, i) => [money(p), rows[0][i], rows[1][i], rows[2][i]]))}What is the <b>market</b> quantity supplied at ${money(prices[k])}?`,
            answer: ans, unit: g.p, kind: "count",
            traps: traps(ans, [
              { value: Math.round(ans / 3), why: "Market supply adds the firms' quantities; it doesn't average them." },
              { value: rows.reduce((s, r) => s + r[(k + 1) % 4], 0), why: `That is the total at ${money(prices[(k + 1) % 4])}.` },
              { value: Math.max(...rows.map(r => r[k])), why: "That is only the biggest firm. Add all three." },
            ]),
            sol: steps("Market supply is the horizontal sum of the firms' supplies: at each price, add their quantities.",
              `At ${money(prices[k])}: ${rows.map(r => r[k]).join(" + ")} = <b>${ans}</b>. More firms in the industry would shift this market supply right.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Change in demand vs change in quantity demanded
   * ============================================================ */
  const DQ_BANK = [
    { t: "Concert tickets fall in price, and fans buy more of them.", cat: "Change in quantity demanded", why: "Own price changed: a movement along demand." },
    { t: "A rise in the price of tea leads coffee drinkers to buy more coffee at the same price.", cat: "Change in demand", why: "For coffee, a substitute's price changed: demand for coffee shifts." },
    { t: "A bakery raises the price of its bagels, and it sells fewer bagels.", cat: "Change in quantity demanded", why: "Own price changed: a movement along demand." },
    { t: "After a raise at work, Dana buys more restaurant meals at the same prices.", cat: "Change in demand", why: "Income changed: demand shifts." },
    { t: "A frost raises the price of oranges, and shoppers buy fewer oranges.", cat: "Change in quantity demanded", why: "The frost shifted supply. Buyers respond to the higher price by moving along demand." },
    { t: "A celebrity endorsement makes a brand of sneakers far more popular.", cat: "Change in demand", why: "Tastes changed: demand shifts." },
    { t: "A new factory lowers the price of solar panels, and households install more.", cat: "Change in quantity demanded", why: "Supply shifted. Buyers move down along their demand curve." },
    { t: "Shoppers expect TV prices to drop during next month's sale and stop buying TVs now.", cat: "Change in demand", why: "Expectations changed: demand today shifts left." },
    { t: "Fewer students enroll, so local landlords find fewer renters at every rent.", cat: "Change in demand", why: "The number of buyers changed: demand shifts." },
    { t: "A gym cuts its monthly fee, and memberships rise.", cat: "Change in quantity demanded", why: "Own price changed: a movement along demand." },
    { t: "Cheaper printers lead offices to buy more ink cartridges at the same price.", cat: "Change in demand", why: "For ink, a complement got cheaper: demand for ink shifts right." },
    { t: "A higher toll on a bridge leads drivers to cross it less often.", cat: "Change in quantity demanded", why: "The bridge crossing's own price rose: a movement along demand." },
  ];
  const SQ_BANK = [
    { t: "Wheat prices rise, so farmers sell more of the wheat they have harvested.", cat: "Change in quantity supplied", why: "Own price changed: a movement along supply." },
    { t: "A new robot cuts the cost of assembling each drone.", cat: "Change in supply", why: "Technology changed: supply shifts." },
    { t: "A surge in demand pushes up the price of lumber, and sawmills run extra shifts.", cat: "Change in quantity supplied", why: "Demand shifted. Sellers respond to the higher price by moving up along supply." },
    { t: "Steel becomes more expensive, raising carmakers' costs.", cat: "Change in supply", why: "Input costs changed: the supply of cars shifts left." },
    { t: "The government pays dairy farmers a subsidy on every gallon of milk.", cat: "Change in supply", why: "A subsidy is a supply shifter." },
    { t: "Falling egg prices lead some farmers to sell fewer eggs.", cat: "Change in quantity supplied", why: "Own price changed: a movement along supply." },
    { t: "Ten new food trucks start serving tacos downtown.", cat: "Change in supply", why: "More sellers: supply shifts right." },
    { t: "Higher demand pushes up hotel rates, so homeowners list more rooms on rental apps.", cat: "Change in quantity supplied", why: "Sellers respond to a higher price along their supply curve." },
    { t: "A tax is placed on sellers for every pack of gum sold.", cat: "Change in supply", why: "A per-unit tax shifts supply left." },
    { t: "Lower prices for used textbooks lead fewer students to sell theirs back.", cat: "Change in quantity supplied", why: "Own price changed: a movement along supply." },
    { t: "Growers expect apple prices to soar next month, so they keep apples in cold storage.", cat: "Change in supply", why: "Price expectations changed: supply today shifts left." },
  ];
  const DQ_TF = [
    { q: "A fall in the price of a good increases the demand for it.", truth: false, why: "A lower own price increases <em>quantity demanded</em> (a movement along the curve); demand itself doesn't change." },
    { q: "A change in buyers' incomes shifts the demand curve.", truth: true, why: "Income is a non-price determinant of demand." },
    { q: "When the price of a good changes, its demand curve shifts.", truth: false, why: "Own-price changes move buyers along the curve." },
    { q: "A rise in input costs decreases supply.", truth: true, why: "Higher costs shift supply left." },
    { q: "A higher price for a good increases its supply.", truth: false, why: "A higher price increases quantity supplied, a movement along the supply curve." },
    { q: "If supply increases, quantity demanded rises even though demand itself does not change.", truth: true, why: "The lower price moves buyers down along their unchanged demand curve." },
    { q: "An increase in demand means buyers want more at every price.", truth: true, why: "That is what a rightward shift of the demand curve means." },
    { q: "A decrease in quantity supplied is shown by a leftward shift of the supply curve.", truth: false, why: "A leftward shift is a decrease in supply. A decrease in quantity supplied is a movement down along the curve." },
    { q: "If demand increases, supply also increases because sellers respond to the higher price.", truth: false, why: "Sellers respond by moving along the supply curve (quantity supplied rises). Supply doesn't shift." },
  ];
  const FALLACY = [
    { claim: "“When demand for a good rises, its price rises. The higher price then reduces demand, so the price falls back to where it started.”",
      right: "The higher price reduces quantity demanded (a move along the new curve), not demand, so the price does not return to where it started",
      wrongs: [
        { t: "Nothing: this is how markets reach equilibrium", why: "The argument confuses demand with quantity demanded, which makes the story circular." },
        { t: "The higher price increases supply, so price must fall even further", why: "A higher price raises quantity supplied (a movement along supply), not supply." },
        { t: "A rise in demand lowers the price, not raises it", why: "With supply unchanged, higher demand raises the price." },
      ] },
    { claim: "“A bumper harvest increases supply and lowers the price. The lower price increases demand, which pushes the price right back up.”",
      right: "The lower price increases quantity demanded (a move along demand); demand itself has not shifted, so the price stays lower",
      wrongs: [
        { t: "Nothing: demand and supply always shift together", why: "Only events that affect buyers shift demand. A harvest affects sellers." },
        { t: "A bumper harvest decreases supply", why: "More crop means more offered at every price: supply increases." },
        { t: "The lower price decreases supply, so the price falls further", why: "The lower price lowers quantity supplied along the new supply curve; it doesn't shift supply again." },
      ] },
    { claim: "“Gas prices rose last year, so the demand for gas must have increased.”",
      right: "A higher price could just as well come from a decrease in supply; a price rise alone doesn't show which curve moved",
      wrongs: [
        { t: "Nothing: a higher price always means demand increased", why: "A supply decrease also raises the price (with quantity falling). Check what happened to quantity." },
        { t: "Higher prices mean demand decreased", why: "By the law of demand, higher prices lower quantity demanded; that says nothing about demand shifting." },
        { t: "Prices can only rise if both curves shift", why: "Either a demand increase or a supply decrease alone raises the price." },
      ] },
    { claim: "“The university raised tuition, and the demand for its classes fell.”",
      right: "Tuition is the good's own price, so quantity demanded fell (a movement along demand), not demand",
      wrongs: [
        { t: "Nothing: any drop in enrollment is a fall in demand", why: "Only a non-price change shifts demand. Here the own price changed." },
        { t: "The supply of classes fell, not demand", why: "The university raised its price; it didn't cut what it offers at each price." },
        { t: "Demand rose, because higher tuition signals higher quality", why: "With tastes unchanged, a higher own price lowers quantity demanded." },
      ] },
  ];
  const genDvsQ = STUDY.makeGenerator({
    id: "b251-m3-dvsq",
    name: "Shift vs movement along the curve",
    blurb: "Separate a change in demand (or supply) from a change in quantity demanded (or supplied), on a graph, in a table and in a news story.",
    variants: [
      {
        name: "Demand or quantity demanded?",
        make() {
          const cats = ["Change in demand", "Change in quantity demanded"];
          const items = cats.map(c => U.pick(DQ_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m3-dq", DQ_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "For the good being bought, is each a change in <b>demand</b> or a change in <b>quantity demanded</b>?",
            cats, items,
            sol: steps("Find what changed for the good in question. Its own price (for whatever reason) → change in quantity demanded, a movement along the curve.",
              "Income, tastes, related goods' prices, expectations or number of buyers → change in demand, a shift of the curve."),
          });
        },
      },
      {
        name: "Supply or quantity supplied?",
        make() {
          const cats = ["Change in supply", "Change in quantity supplied"];
          const items = cats.map(c => U.pick(SQ_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m3-sq", SQ_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "For the good being sold, is each a change in <b>supply</b> or a change in <b>quantity supplied</b>?",
            cats, items,
            sol: steps("Own price changed (including because demand moved) → change in quantity supplied, a movement along supply.",
              "Input costs, technology, related goods in production, taxes/subsidies, price expectations or number of firms → change in supply, a shift."),
          });
        },
      },
      {
        name: "One event, both sides of the market",
        make() {
          const e = U.pick(EVENTS);
          const curve = e.curve, dir = e.dir;
          const other = curve === "D" ? "Supply" : "Demand";
          const own = curve === "D" ? "Demand" : "Supply";
          const dirW = dir > 0 ? "right" : "left";
          const right = `${own} shifts ${dirW}; ${alongTxt(curve, dir)}`;
          const wrong = [
            { t: `${own} shifts ${dirW}, and ${other.toLowerCase()} shifts ${dirW} too as sellers and buyers react`, why: `${other} shifts only if one of its own determinants changes. Reacting to the new price is a movement along it.` },
            { t: `${other} shifts ${dirW}; ${alongTxt(curve === "D" ? "S" : "D", dir)}`, why: `This event works through ${curve === "D" ? "buyers" : "sellers"}, so it is ${own.toLowerCase()} that shifts.` },
            { t: `${own} shifts ${dir > 0 ? "left" : "right"}; ${alongTxt(curve, -dir)}`, why: `Wrong direction: ${e.why}` },
          ];
          return Q.mc({
            q: `<b>${cap(e.mk.m)}:</b> ${e.t} Which describes what happens in this market?`,
            right, rightWhy: e.why, wrong,
            sol: steps(`Who is directly affected: buyers or sellers? ${e.why}`,
              `So ${own.toLowerCase()} shifts ${dirW}. The price then ${eff(curve === "D" ? dir : 0, curve === "S" ? dir : 0).P > 0 ? "rises" : "falls"}, and ${alongTxt(curve, dir)}. The ${other.toLowerCase()} curve itself does not move.`),
          });
        },
      },
      {
        name: "Movement or shift on the graph",
        make() {
          const isD = Math.random() < 0.5;
          const a = isD ? 24 : 2, b = 2, k = 8;
          const X = 34, Y = 12;
          // A on curve 1 at P=7; B on curve 1 at P=4 (D) / P=9 (S); C on curve 2 at P=7
          const qOf = (aa, P) => (isD ? aa - b * P : aa + b * P);
          const PA = 7, PB = 4;
          const A = [qOf(a, PA), PA], B = [qOf(a, PB), PB], Cc = [qOf(a + k, PA), PA];
          const lab = isD ? ["D₁", "D₂"] : ["S₁", "S₂"];
          const curves = isD ? [dCurve(a, b, X, Y, lab[0]), dCurve(a + k, b, X, Y, lab[1], "dash")] : [sCurve(a, b, X, Y, lab[0], "main"), sCurve(a + k, b, X, Y, lab[1], "dash")];
          const gph = G.plot({ xLabel: "Quantity", yLabel: "Price ($)", xMax: X, yMax: Y, xTicks: [], yTicks: range(2, 12, 2), curves,
            points: [{ x: A[0], y: A[1], label: "A" }, { x: B[0], y: B[1], label: "B" }, { x: Cc[0], y: Cc[1], label: "C" }], aria: "Two curves with points A, B and C" });
          const moves = [["A", "B"], ["B", "A"], ["A", "C"], ["C", "A"]];
          const [f, t] = U.pick(moves);
          const word = isD ? "demand" : "supply";
          const qw = isD ? "quantity demanded" : "quantity supplied";
          const P = { A, B, C: Cc };
          const shift = (f === "C" || t === "C");
          const up = P[t][0] > P[f][0];
          const right = shift ? `An ${up ? "increase" : "decrease"} in ${word}`.replace("An decrease", "A decrease") : `An ${up ? "increase" : "decrease"} in ${qw}`.replace("An decrease", "A decrease");
          const all = [`An increase in ${word}`, `A decrease in ${word}`, `An increase in ${qw}`, `A decrease in ${qw}`];
          return Q.mc({
            q: `On the graph, what does a move from point <b>${f}</b> to point <b>${t}</b> show?${gph}`,
            right, keepOrder: all,
            wrong: all.filter(x => x !== right).map(x => ({ t: x, why: x.includes("quantity") === shift ? (shift ? `${f} and ${t} are on different curves at the same price, so the curve shifted.` : `${f} and ${t} are on the same curve, so this is a movement along it, caused by a price change.`) : `Right idea, wrong direction: quantity ${up ? "rises" : "falls"} from ${f} to ${t}.` })),
            sol: steps("Are the two points on the <b>same</b> curve (movement along: quantity " + (isD ? "demanded" : "supplied") + " changes) or on <b>different</b> curves (a shift: " + word + " changes)?",
              shift ? `${f} and ${t} are at the same price on different curves: the whole curve moved ${up ? "right" : "left"}, an <b>${up ? "increase" : "decrease"} in ${word}</b>.` : `${f} and ${t} are on ${lab[0]}: the price changed from ${money(P[f][1])} to ${money(P[t][1])}, so ${qw} ${up ? "rose" : "fell"}. That is a movement along the curve.`),
          });
        },
      },
      {
        name: "Spot the faulty reasoning",
        make() {
          const f = U.pick(FALLACY);
          return Q.mc({
            q: `What is wrong with this argument? ${f.claim}`,
            right: f.right, wrong: f.wrongs,
            sol: steps("Check every use of “demand” and “supply”: is the writer describing a shift of a curve, or a movement along it caused by a price change?", f.right + "."),
          });
        },
      },
      {
        name: "Move along and shift, with numbers",
        make() {
          const g = U.pick(NG);
          const b = U.randInt(2, 6);
          const prices = U.pick([[4, 5, 6, 7, 8], [6, 8, 10, 12, 14], [10, 12, 14, 16, 18]]);
          const a = b * prices[4] + U.randInt(3, 12) * 5;
          const rows = prices.map(p => [money(p), a - b * p]);
          let i1 = U.randInt(0, 4), i2;
          do { i2 = U.randInt(0, 4); } while (i2 === i1);
          const k = U.randInt(2, 8) * 5;
          const inc = Math.random() < 0.5;
          const cause = inc ? U.pick(["a popular review makes the product more fashionable", "the town's population grows", "the price of a substitute rises"]) : U.pick(["the price of a complement jumps", "tastes turn against the product", "many buyers move away"]);
          const q1 = a - b * prices[i1], q2 = a - b * prices[i2];
          const ans = q2 + (inc ? k : -k);
          return Q.num({
            q: `Demand for ${g.p} (${g.u}):${tbl(["Price", "Quantity demanded"], rows)}The price is ${money(prices[i1])}. Then two things happen: the price changes to ${money(prices[i2])}, and ${cause}, so that buyers want <b>${k} ${inc ? "more" : "fewer"}</b> at every price. What is the new quantity demanded?`,
            answer: ans, unit: g.p,
            traps: traps(ans, [
              { value: q2, why: "That accounts for the movement along the curve but forgets the shift." },
              { value: q1 + (inc ? k : -k), why: "That accounts for the shift but forgets the price change (the movement along the curve)." },
              { value: q1, why: "That is where you started." },
            ]),
            sol: steps("Handle the two changes separately: the price change is a movement along the curve; the other change shifts the whole curve.",
              `Movement along: at ${money(prices[i2])} the original schedule gives ${q2}.`,
              `Shift: ${q2} ${inc ? "+" : "−"} ${k} = <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Shift or movement: true or false",
        make() {
          const s = U.pick(DQ_TF);
          return Q.tf({ q: s.q, truth: s.truth, why: s.why,
            sol: steps("Own price → movement along the curve (quantity demanded/supplied changes). Anything else → shift (demand/supply changes).", s.why) });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Equilibrium, shortage & surplus
   * ============================================================ */
  /* Linear market with integer equilibrium: Qd = a − bP, Qs = c + dP. */
  function lin() {
    for (let t = 0; t < 200; t++) {
      const b = U.randInt(1, 6), d = U.randInt(1, 6), P = U.randInt(4, 20);
      const Qs0 = U.randInt(2, 16) * 5;            // Q*
      const c = Qs0 - d * P;
      if (c < -60 || c > 60) continue;
      const a = Qs0 + b * P;
      return { a, b, c, d, P, Q: Qs0, g: U.pick(NG) };
    }
    return { a: 100, b: 3, c: -10, d: 2, P: 22, Q: 34, g: NG[0] };
  }
  const neg = x => (x < 0 ? "−" + (-x) : String(x));
  const qsAt = (c, d, P) => (c === 0 ? `${d}×${P}` : c > 0 ? `${c} + ${d}×${P}` : `${d}×${P} − ${-c}`);
  const eqWork = m => `${m.a} − ${co(m.b)}P = ${m.c < 0 ? `${co(m.d)}P − ${-m.c}` : m.c === 0 ? `${co(m.d)}P` : `${m.c} + ${co(m.d)}P`} → ${m.a - m.c} = ${m.b + m.d}P → P* = ${money(m.P)}`;
  const EQ_BANK = [
    { t: "At the current price, fans want 5,000 tickets but only 3,200 are available.", cat: "Shortage", why: "Quantity demanded exceeds quantity supplied." },
    { t: "Unsold sweaters pile up in stores at the current price.", cat: "Surplus", why: "Quantity supplied exceeds quantity demanded." },
    { t: "Every buyer who wants a bike rental at the going rate gets one, and no rental bike sits idle that someone was willing to rent out at that rate.", cat: "Equilibrium", why: "Quantity demanded equals quantity supplied." },
    { t: "The price is set above the equilibrium price.", cat: "Surplus", why: "Above equilibrium, quantity supplied exceeds quantity demanded." },
    { t: "The price is held below the equilibrium price.", cat: "Shortage", why: "Below equilibrium, quantity demanded exceeds quantity supplied." },
    { t: "Long lines form and shelves are empty within an hour of opening.", cat: "Shortage", why: "Buyers want more than sellers offer at that price." },
    { t: "Sellers keep cutting prices to clear their extra stock.", cat: "Surplus", why: "Price cuts are the response to excess supply." },
    { t: "Quantity demanded and quantity supplied are both 800 units at the going price.", cat: "Equilibrium", why: "They are equal, so there is no pressure on the price." },
    { t: "Rare diamonds are expensive and limited in number, but anyone willing to pay the market price can buy one.", cat: "Scarcity, but no shortage", why: "Scarcity is always present; there is no shortage when the price lets the market clear." },
    { t: "Beachfront land is limited and costly, yet at the going price every buyer finds a seller.", cat: "Scarcity, but no shortage", why: "Limited does not mean shortage: the market clears at its price." },
    { t: "Wants for fresh water outstrip what the planet can provide for free, yet bottled water is on every shelf at its market price.", cat: "Scarcity, but no shortage", why: "Scarcity exists, but at the market price buyers can get what they want." },
    { t: "Farmers harvest far more milk than buyers want at the price, and it has to be poured away.", cat: "Surplus", why: "Excess supply at that price." },
  ];
  const genEquil = STUDY.makeGenerator({
    id: "b251-m3-equil",
    name: "Equilibrium, shortage & surplus",
    blurb: "Solve for equilibrium from equations, schedules and graphs; size a shortage or surplus and predict which way the price moves.",
    variants: [
      {
        name: "Equilibrium price from equations",
        make() {
          const m = lin();
          return Q.num({
            q: `In the market for ${m.g.p}, demand is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)}, with Q in ${m.g.u} and P in dollars. What is the equilibrium price?`,
            answer: m.P, unit: "$",
            traps: traps(m.P, [
              { value: m.Q, why: "That is the equilibrium quantity. The question asks for the price." },
              { value: (m.a + m.c) / (m.b + m.d), why: "Sign slip: move the supply intercept across with its sign changed (a − c, not a + c)." },
              m.b !== m.d ? { value: (m.a - m.c) / Math.abs(m.b - m.d), why: "Sign slip: when you move −bP to the other side it becomes +bP, so divide by b + d." } : null,
            ]),
            sol: steps("At equilibrium quantity demanded equals quantity supplied: set Q<sub>d</sub> = Q<sub>s</sub> and solve for P.",
              `${eqWork(m)}.`,
              `Check: Q<sub>d</sub> = ${m.a} − ${m.b}×${m.P} = ${m.Q} and Q<sub>s</sub> = ${qsAt(m.c, m.d, m.P)} = ${m.Q}. ✓`),
          });
        },
      },
      {
        name: "Equilibrium quantity from equations",
        make() {
          const m = lin();
          return Q.num({
            q: `Demand for ${m.g.p} is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)} (Q in ${m.g.u}, P in dollars). What is the equilibrium <b>quantity</b>?`,
            answer: m.Q, unit: m.g.p,
            traps: traps(m.Q, [
              { value: m.P, why: "That is the equilibrium price. Plug it back into either equation to get the quantity." },
              { value: m.a, why: "That is quantity demanded at a price of zero." },
              { value: m.a - m.b * (m.P + 1), why: "Close, but recheck the equilibrium price: you seem to have plugged in the wrong P." },
            ]),
            sol: steps("First find the price where Q<sub>d</sub> = Q<sub>s</sub>, then plug it into either equation.",
              `${eqWork(m)}.`,
              `Q* = ${m.a} − ${m.b}×${m.P} = <b>${m.Q}</b> (the supply equation gives the same).`),
          });
        },
      },
      {
        name: "Shortage or surplus at a given price?",
        make() {
          for (let t = 0; t < 100; t++) {
            const m = lin();
            const off = U.pick([-3, -2, -1, 1, 2, 3]) * U.pick([1, 2]);
            const P0 = m.P + off;
            const qd = m.a - m.b * P0, qs = m.c + m.d * P0;
            if (P0 <= 0 || qd <= 0 || qs <= 0) continue;
            const gap = Math.abs(qd - qs);
            const short = qd > qs;
            const right = `A ${short ? "shortage" : "surplus"} of ${gap}`;
            const wrong = uniqWrong(right, [
              { t: `A ${short ? "surplus" : "shortage"} of ${gap}`, why: `At ${money(P0)}, quantity ${short ? "demanded" : "supplied"} (${short ? qd : qs}) is the larger one, so it is a ${short ? "shortage" : "surplus"}.` },
              { t: `A ${short ? "shortage" : "surplus"} of ${short ? qd : qs}`, why: "The size is the <em>gap</em> between quantity demanded and quantity supplied, not one of them." },
              { t: "Neither: the market is in equilibrium", why: `At ${money(P0)} the two quantities differ (${qd} vs ${qs}); equilibrium is at ${money(m.P)}.` },
              { t: `A ${short ? "shortage" : "surplus"} of ${Math.abs(off)}`, why: "That is the gap in price. The shortage or surplus is measured in units of the good." },
            ]);
            return Q.mc({
              q: `Demand for ${m.g.p} is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)} (Q in ${m.g.u}). If the price is <b>${money(P0)}</b>, what is the situation in the market?`,
              right, wrong,
              sol: steps("Plug the price into both equations and compare.",
                `Q<sub>d</sub> = ${m.a} − ${m.b}×${P0} = ${qd}; Q<sub>s</sub> = ${qsAt(m.c, m.d, P0)} = ${qs}.`,
                `${short ? "Q<sub>d</sub> &gt; Q<sub>s</sub>" : "Q<sub>s</sub> &gt; Q<sub>d</sub>"}: a <b>${short ? "shortage" : "surplus"} of ${gap}</b>. The price is ${short ? "below" : "above"} equilibrium (${money(m.P)}), so it will ${short ? "rise" : "fall"}.`),
            });
          }
          return null;
        },
      },
      {
        name: "Equilibrium from schedules",
        make() {
          for (let t = 0; t < 100; t++) {
            const g = U.pick(NG);
            const stepP = U.pick([1, 2, 5]);
            const b = U.randInt(1, 4) * U.pick([2, 5]), d = U.randInt(1, 4) * U.pick([2, 5]);
            const k = U.randInt(1, 3);                  // equilibrium row index
            const P0 = U.randInt(1, 4) * stepP;
            const prices = range(P0, P0 + 4 * stepP, stepP);
            const Pst = prices[k];
            const Qst = U.randInt(6, 20) * 5;
            const qd = prices.map(p => Qst - b * (p - Pst) / stepP * 1);
            const qs = prices.map(p => Qst + d * (p - Pst) / stepP * 1);
            if (qd.some(x => x <= 0) || qs.some(x => x < 0)) continue;
            const wrong = prices.filter(p => p !== Pst).map(p => {
              const i = prices.indexOf(p);
              return { t: money(p), why: qd[i] > qs[i] ? `At ${money(p)} quantity demanded (${qd[i]}) exceeds quantity supplied (${qs[i]}): a shortage.` : `At ${money(p)} quantity supplied (${qs[i]}) exceeds quantity demanded (${qd[i]}): a surplus.` };
            });
            return Q.mc({
              q: `The market for ${g.p} (${g.u}):${tbl(["Price", "Quantity demanded", "Quantity supplied"], prices.map((p, i) => [money(p), qd[i], qs[i]]))}What is the equilibrium price?`,
              right: money(Pst), wrong: U.sample(wrong, 3), keepOrder: false,
              sol: steps("Equilibrium is the price where quantity demanded equals quantity supplied.",
                `At ${money(Pst)} both equal ${Qst}. Below it there is a shortage; above it, a surplus.`),
            });
          }
          return null;
        },
      },
      {
        name: "Which way will the price move?",
        make() {
          for (let t = 0; t < 100; t++) {
            const m = lin();
            const off = U.pick([-3, -2, -1, 1, 2, 3]);
            const P0 = Math.random() < 0.15 ? m.P : m.P + off;
            const qd = m.a - m.b * P0, qs = m.c + m.d * P0;
            if (P0 <= 0 || qd <= 0 || qs <= 0) continue;
            const opts = ["The price will rise", "The price will fall", "The price will stay where it is"];
            const ans = qd > qs ? 0 : qd < qs ? 1 : 2;
            const whys = [
              "A rising price is the response to a shortage (Q<sub>d</sub> &gt; Q<sub>s</sub>).",
              "A falling price is the response to a surplus (Q<sub>s</sub> &gt; Q<sub>d</sub>).",
              "The price stays put only when Q<sub>d</sub> = Q<sub>s</sub>.",
            ];
            const show = Math.random() < 0.5;
            return Q.mc({
              q: show
                ? `At today's price of ${money(P0)}, buyers want ${qd} ${m.g.p} and sellers offer ${qs}. What happens next, if nothing else changes?`
                : `Demand is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)} for ${m.g.p}. The price is currently ${money(P0)}. What happens next, if nothing else changes?`,
              right: opts[ans], keepOrder: opts,
              wrong: opts.filter((_, i) => i !== ans).map(o => ({ t: o, why: whys[opts.indexOf(o)] })),
              sol: steps("Compare quantity demanded and quantity supplied at the current price.",
                `${show ? "" : `Q<sub>d</sub> = ${qd}, Q<sub>s</sub> = ${qs}. `}${ans === 0 ? `Shortage of ${qd - qs}: buyers compete for too few units, so the price is bid <b>up</b>.` : ans === 1 ? `Surplus of ${qs - qd}: sellers cut prices to move unsold units, so the price falls.` : "They are equal: the market is in equilibrium and the price stays put."}`),
            });
          }
          return null;
        },
      },
      {
        name: "Read a shortage or surplus off the graph",
        make() {
          for (let t = 0; t < 200; t++) {
            const b = U.pick([10, 20]), d = U.pick([10, 20]);
            const Pst = U.randInt(4, 7), Qst = U.pick([30, 40, 50, 60]);
            const a = Qst + b * Pst, c = Qst - d * Pst;
            const off = U.pick([-2, -1, 1, 2]);
            const P0 = Pst + off;
            const qd = a - b * P0, qs = c + d * P0;
            if (qd <= 0 || qs <= 0 || qd > 95 || qs > 95 || P0 < 1 || P0 > 10) continue;
            const g = U.pick(NG);
            const gph = G.plot({ xLabel: `${cap(g.p)} (per day)`, yLabel: "Price ($)", xMax: 100, yMax: 11, xTicks: range(10, 100, 10), yTicks: range(1, 11, 1),
              curves: [dCurve(a, b, 100, 11, "D"), sCurve(c, d, 100, 11, "S"), { pts: [[0, P0], [96, P0]], style: "faint" }], aria: "Supply and demand with a price line" });
            const short = qd > qs, gap = Math.abs(qd - qs);
            return Q.num({
              q: `The graph shows the market for ${g.p}. Suppose the price is <b>${money(P0)}</b> (the light horizontal line).${gph}How large is the ${short ? "shortage" : "surplus"} at that price?`,
              answer: gap, unit: g.p,
              traps: traps(gap, [
                { value: short ? qd : qs, why: "That is one of the quantities. The shortage or surplus is the gap between them." },
                { value: Math.abs(Qst - (short ? qs : qd)), why: "Measure from the demand curve to the supply curve at the given price, not from the equilibrium quantity." },
                { value: Qst, why: "That is the equilibrium quantity." },
              ]),
              sol: steps(`At ${money(P0)}, read across to each curve and down to the quantity axis.`,
                `Demand: ${qd}. Supply: ${qs}.`,
                `${short ? "Quantity demanded is larger, so there is a shortage" : "Quantity supplied is larger, so there is a surplus"} of ${Math.max(qd, qs)} − ${Math.min(qd, qs)} = <b>${gap}</b>. The price will ${short ? "rise" : "fall"} toward ${money(Pst)}.`),
            });
          }
          return null;
        },
      },
      {
        name: "Shortage, surplus, equilibrium or scarcity?",
        make() {
          const cats = ["Shortage", "Surplus", "Equilibrium", "Scarcity, but no shortage"];
          const items = cats.map(c => U.pick(EQ_BANK.filter(i => i.cat === c)));
          for (const extra of U.deal("m3-eq", EQ_BANK, 6)) if (items.length < 5 && !items.includes(extra)) items.push(extra);
          return Q.classify({
            q: "Classify each market situation.",
            cats, items,
            sol: steps("Compare quantity demanded with quantity supplied at the going price: more demanded → shortage; more supplied → surplus; equal → equilibrium.",
              "Scarcity is different: a good can be limited and expensive, yet with no shortage, because at its market price everyone who is willing to pay can buy."),
          });
        },
      },
      {
        name: "Work backward from the equilibrium",
        make() {
          const m = lin();
          const ask = U.pick(["a", "c"]);
          if (ask === "a") {
            return Q.num({
              q: `Supply of ${m.g.p} is ${qsTxt(m.c, m.d)}. Demand has the form Q<sub>d</sub> = A − ${co(m.b)}P. The market clears at a price of ${money(m.P)}. What is A?`,
              answer: m.a,
              traps: traps(m.a, [
                { value: m.Q, why: "That is the equilibrium quantity. A is the demand intercept: Q* plus bP*." },
                { value: m.Q - m.b * m.P, why: "Sign slip: A − bP* = Q*, so A = Q* + bP*." },
                { value: m.c + m.b * m.P, why: "First find Q* from the supply equation, then add bP*." },
              ]),
              sol: steps("At equilibrium Q<sub>d</sub> = Q<sub>s</sub>. Get the quantity from the equation you know.",
                `Q* = ${qsAt(m.c, m.d, m.P)} = ${m.Q}.`,
                `${m.Q} = A − ${m.b}×${m.P}, so A = ${m.Q} + ${m.b * m.P} = <b>${m.a}</b>.`),
            });
          }
          return Q.num({
            q: `Demand for ${m.g.p} is ${qdTxt(m.a, m.b)}. Supply has the form Q<sub>s</sub> = c + ${co(m.d)}P. The market clears at a price of ${money(m.P)}. What is c? (It may be negative.)`,
            answer: m.c,
            traps: traps(m.c, [
              { value: m.Q, why: "That is the equilibrium quantity. c = Q* − dP*." },
              { value: m.Q + m.d * m.P, why: "Sign slip: c + dP* = Q*, so c = Q* − dP*." },
              { value: -m.c, why: "Check the sign: c = Q* − dP*." },
            ]),
            sol: steps("Find the equilibrium quantity from the demand equation, then solve the supply equation for c.",
              `Q* = ${m.a} − ${m.b}×${m.P} = ${m.Q}.`,
              `${m.Q} = c + ${m.d}×${m.P}, so c = ${m.Q} − ${m.d * m.P} = <b>${neg(m.c)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — One curve shifts (cases 1–4)
   * ============================================================ */
  const CHAIN = [
    { s: "A frost in coffee-growing regions sharply raises the price of coffee.", m: "tea", c: "D", d: 1, why: "Coffee gets pricier → tea is a substitute → demand for tea increases." },
    { s: "A new factory makes peanut butter much cheaper.", m: "jelly", c: "D", d: 1, why: "Cheaper peanut butter → more PB&J sandwiches → jelly is a complement → demand for jelly increases." },
    { s: "Ride-share companies raise their fares sharply.", m: "monthly bus passes", c: "D", d: 1, why: "Ride-shares cost more → bus passes are a substitute → demand for bus passes increases." },
    { s: "The price of home printers falls by half.", m: "printer ink", c: "D", d: 1, why: "Cheaper printers → more printers in use → ink is a complement → demand for ink increases." },
    { s: "A blight wipes out much of the potato crop, and potato prices soar.", m: "rice", c: "D", d: 1, why: "Potatoes cost more → rice is a substitute → demand for rice increases." },
    { s: "Butter prices jump after a dairy-feed shortage.", m: "margarine", c: "D", d: 1, why: "Butter costs more → margarine is a substitute → demand for margarine increases." },
    { s: "A big theme park doubles its ticket prices, and attendance drops.", m: "hotel rooms near the park", c: "D", d: -1, why: "Fewer park visitors → hotel stays are a complement → demand for nearby hotel rooms decreases." },
    { s: "Gasoline prices jump.", m: "large SUVs", c: "D", d: -1, why: "Gas costs more → gas is a complement to driving an SUV → demand for SUVs decreases." },
    { s: "A popular streaming service cuts its subscription price in half.", m: "movie tickets", c: "D", d: -1, why: "Streaming is cheaper → it substitutes for going out → demand for movie tickets decreases." },
    { s: "The price of hot dog buns doubles.", m: "hot dogs", c: "D", d: -1, why: "Buns cost more → buns are a complement → demand for hot dogs decreases." },
    { s: "Jet fuel prices soar.", m: "airline flights", c: "S", d: -1, why: "Jet fuel is an input → airlines' costs rise → supply of flights decreases." },
    { s: "Cocoa bean prices hit a record high after poor harvests.", m: "chocolate bars", c: "S", d: -1, why: "Cocoa is an input → chocolate makers' costs rise → supply of chocolate bars decreases." },
    { s: "The price of lithium battery cells falls sharply.", m: "electric scooters", c: "S", d: 1, why: "Batteries are an input → scooter makers' costs fall → supply of scooters increases." },
    { s: "Sugar becomes much cheaper on world markets.", m: "candy", c: "S", d: 1, why: "Sugar is an input → candy makers' costs fall → supply of candy increases." },
    { s: "Leather prices rise steeply as luxury handbags boom.", m: "beef", c: "S", d: 1, why: "Leather and beef come from the same cattle (complements in production) → ranchers raise more cattle → supply of beef increases." },
    { s: "Wages for truck drivers rise sharply across the country.", m: "home furniture delivery", c: "S", d: -1, why: "Drivers' labor is an input → delivery costs rise → supply of furniture delivery decreases." },
  ];
  const OBS = [
    { s: "In a beach town, both hotel room rates and the number of rooms rented are much higher in July than in January.", c: "D", d: 1 },
    { s: "After a late frost, apple prices jumped while fewer apples were sold.", c: "S", d: -1 },
    { s: "As flat-screen manufacturing improved, TV prices fell and more TVs were sold than ever.", c: "S", d: 1 },
    { s: "After a big employer left town, both home prices and the number of homes sold fell.", c: "D", d: -1 },
    { s: "Over the holiday season, airfares rise and airlines carry more passengers.", c: "D", d: 1 },
    { s: "When a key refinery closed, the price of jet fuel rose and less of it was sold.", c: "S", d: -1 },
    { s: "As more food trucks opened downtown, taco prices fell and more tacos were sold.", c: "S", d: 1 },
    { s: "After a study linked a sweetener to headaches, its price and sales both dropped.", c: "D", d: -1 },
  ];
  /* A gridded single-shift market: b,d ∈ {10, 20}; shifts give integer new prices. */
  function gridShift() {
    for (let t = 0; t < 300; t++) {
      const b = U.pick([10, 20]), d = U.pick([10, 20]);
      const Pst = U.randInt(3, 7), Qst = U.pick([30, 40, 50, 60]);
      const a = Qst + b * Pst, c = Qst - d * Pst;
      const curve = U.pick(["D", "S"]), dir = U.pick([1, -1]);
      const m = U.pick([1, 2]);
      const k = dir * (b + d) * m / (b + d === 40 ? 2 : 1);  // horizontal shift
      if (Math.abs(k) > 40) continue;
      const a2 = curve === "D" ? a + k : a, c2 = curve === "S" ? c + k : c;
      const P2 = (a2 - c2) / (b + d);
      if (!Number.isInteger(P2)) continue;
      const Q2 = a2 - b * P2;
      if (P2 < 2 || P2 > 9 || Q2 < 10 || Q2 > 90) continue;
      return { b, d, a, c, a2, c2, Pst, Qst, P2, Q2, curve, dir, k };
    }
    return { b: 10, d: 10, a: 100, c: 0, a2: 120, c2: 0, Pst: 5, Qst: 50, P2: 6, Q2: 60, curve: "D", dir: 1, k: 20 };
  }
  const genShift1 = STUDY.makeGenerator({
    id: "b251-m3-shift1",
    name: "One curve shifts: predicting price & quantity",
    blurb: "Cases 1–4: decide which curve an event shifts, then predict the new equilibrium price and quantity, in words, on a graph and with equations.",
    variants: [
      {
        name: "Predict price and quantity from an event",
        make() {
          const e = U.pick(EVENTS);
          const r = eff(e.curve === "D" ? e.dir : 0, e.curve === "S" ? e.dir : 0);
          const right = resTxt(r);
          return Q.mc({
            q: `<b>Market for ${e.mk.m}:</b> ${e.t} What happens to the equilibrium price and quantity of ${e.mk.m}?`,
            right, keepOrder: PQ4,
            wrong: PQ4.filter(o => o !== right).map(o => ({ t: o, why: pq4Why(r, o) + ` Here ${shiftTxt(e.curve, e.dir).toLowerCase()}.` })),
            sol: steps(`Which side is hit: buyers or sellers? ${e.why}`,
              `${shiftTxt(e.curve, e.dir)}.`,
              `${caseLine(e.curve === "D" ? e.dir : 0, e.curve === "S" ? e.dir : 0)}`),
          });
        },
      },
      {
        name: "Read the new equilibrium off a graph",
        make() {
          const s = gridShift();
          const g = U.pick(NG);
          const lab = s.curve === "D" ? ["D₁", "D₂"] : ["S₁", "S₂"];
          const curves = s.curve === "D"
            ? [sCurve(s.c, s.d, 100, 11, "S"), dCurve(s.a, s.b, 100, 11, "D₁"), dCurve(s.a2, s.b, 100, 11, "D₂", "dash")]
            : [dCurve(s.a, s.b, 100, 11, "D"), sCurve(s.c, s.d, 100, 11, "S₁"), sCurve(s.c2, s.d, 100, 11, "S₂", "dash")];
          const gph = G.plot({ xLabel: `${cap(g.p)} (per day)`, yLabel: "Price ($)", xMax: 100, yMax: 11, xTicks: range(10, 100, 10), yTicks: range(1, 11, 1),
            curves, points: [{ x: s.Qst, y: s.Pst, label: "E₁" }], aria: "Supply and demand with one shifted curve" });
          const askP = Math.random() < 0.5;
          const ans = askP ? s.P2 : s.Q2;
          return Q.num({
            q: `The market for ${g.p} starts at E₁. Then ${s.curve === "D" ? "demand" : "supply"} shifts from ${lab[0]} to ${lab[1]}.${gph}What is the new equilibrium <b>${askP ? "price" : "quantity"}</b>?`,
            answer: ans, unit: askP ? "$" : g.p,
            traps: traps(ans, [
              { value: askP ? s.Pst : s.Qst, why: "That is the original equilibrium at E₁. Find where the new curve crosses the other one." },
              { value: askP ? s.Q2 : s.P2, why: askP ? "That is the new quantity, not the price." : "That is the new price, not the quantity." },
              askP || (s.curve === "D" ? s.a2 - s.b * s.Pst : s.c2 + s.d * s.Pst) <= 0 ? null : { value: s.curve === "D" ? s.a2 - s.b * s.Pst : s.c2 + s.d * s.Pst, why: "That is the quantity on the new curve at the <em>old</em> price. The price adjusts until the new curve meets the other curve." },
            ]),
            sol: steps(`The new equilibrium is where ${lab[1]} crosses the ${s.curve === "D" ? "supply" : "demand"} curve, which did not move.`,
              `They cross at a price of ${money(s.P2)} and a quantity of ${s.Q2}.`,
              `So the new equilibrium ${askP ? "price" : "quantity"} is <b>${askP ? money(s.P2) : s.Q2}</b>. ${caseLine(s.curve === "D" ? s.dir : 0, s.curve === "S" ? s.dir : 0)}`),
          });
        },
      },
      {
        name: "New equilibrium after a shift, with equations",
        make() {
          for (let t = 0; t < 200; t++) {
            const m = lin();
            const curve = U.pick(["D", "S"]), dir = U.pick([1, -1]);
            const k = dir * (m.b + m.d) * U.randInt(1, 3);
            const a2 = curve === "D" ? m.a + k : m.a, c2 = curve === "S" ? m.c + k : m.c;
            const P2 = (a2 - c2) / (m.b + m.d);
            const Q2 = a2 - m.b * P2;
            if (P2 < 1 || Q2 < 5) continue;
            const cause = curve === "D" ? (dir > 0 ? "a fashion trend makes the product more popular" : "the price of a complement rises") : (dir > 0 ? "a new production method cuts costs" : "a key input becomes more expensive");
            const askP = Math.random() < 0.5;
            const ans = askP ? P2 : Q2;
            return Q.num({
              q: `Demand for ${m.g.p} is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)} (Q in ${m.g.u}). Then ${cause}, and ${curve === "D" ? "demand" : "supply"} becomes <b>${curve === "D" ? qdTxt(a2, m.b) : qsTxt(c2, m.d)}</b>. What is the new equilibrium <b>${askP ? "price" : "quantity"}</b>?`,
              answer: ans, unit: askP ? "$" : m.g.p,
              traps: traps(ans, [
                { value: askP ? m.P : m.Q, why: "That is the original equilibrium. Re-solve with the new equation." },
                { value: askP ? Q2 : P2, why: askP ? "That is the new quantity." : "That is the new price; plug it back in for the quantity." },
                askP ? null : { value: curve === "D" ? a2 - m.b * m.P : c2 + m.d * m.P, why: "That is the shifted curve's quantity at the old price, before the price adjusts." },
              ]),
              sol: steps("Set the new demand equal to supply (or demand equal to the new supply) and solve again.",
                `${curve === "D" ? `${a2} − ${co(m.b)}P = ${qsTxt(m.c, m.d).split("= ")[1]}` : `${m.a} − ${co(m.b)}P = ${qsTxt(c2, m.d).split("= ")[1]}`} → ${a2 - c2} = ${m.b + m.d}P → P = ${money(P2)}.`,
                `Q = ${a2} − ${m.b}×${P2} = ${Q2}. Price ${P2 > m.P ? "rose" : "fell"} from ${money(m.P)} and quantity ${Q2 > m.Q ? "rose" : "fell"} from ${m.Q}, as case ${curve === "D" ? (dir > 0 ? 2 : 1) : (dir > 0 ? 3 : 4)} predicts.`),
            });
          }
          return null;
        },
      },
      {
        name: "Right after the shift: shortage or surplus?",
        make() {
          const m = lin();
          const curve = U.pick(["D", "S"]), dir = U.pick([1, -1]);
          const k = U.randInt(2, 8) * 5;
          const short = (curve === "D" && dir > 0) || (curve === "S" && dir < 0);
          const right = `A ${short ? "shortage" : "surplus"} of ${k}; the price will ${short ? "rise" : "fall"}`;
          const wrong = [
            { t: `A ${short ? "surplus" : "shortage"} of ${k}; the price will ${short ? "fall" : "rise"}`, why: `At the old price, quantity ${short ? "demanded" : "supplied"} is now the larger one.` },
            { t: `A ${short ? "shortage" : "surplus"} of ${k}; the price will ${short ? "fall" : "rise"}`, why: `A ${short ? "shortage pushes the price up" : "surplus pushes the price down"}.` },
            { t: `No shortage or surplus; the price stays at ${money(m.P)}`, why: "The shift changes one quantity at the old price, so the market is out of equilibrium until the price adjusts." },
          ];
          return Q.mc({
            q: `The market for ${m.g.p} is in equilibrium at ${money(m.P)} and ${m.Q} units. Then ${curve === "D" ? "buyers" : "sellers"} ${dir > 0 ? "want to " + (curve === "D" ? "buy" : "sell") + " " + k + " more" : "want to " + (curve === "D" ? "buy" : "sell") + " " + k + " fewer"} units at every price. Immediately after the shift, before the price changes, the market has:`,
            right, wrong,
            sol: steps("Step 2 of a shift analysis: hold the price at its old level and compare the new quantities.",
              `At ${money(m.P)}, quantity ${curve === "D" ? "demanded" : "supplied"} is now ${m.Q + (dir > 0 ? k : -k)} while quantity ${curve === "D" ? "supplied" : "demanded"} is still ${m.Q}.`,
              `That is a <b>${short ? "shortage" : "surplus"} of ${k}</b>, so the price ${short ? "rises" : "falls"} until a new equilibrium is reached.`),
          });
        },
      },
      {
        name: "Reason backward from what happened",
        make() {
          const useStory = Math.random() < 0.6;
          let s, curve, dir;
          if (useStory) { const o = U.pick(OBS); s = o.s; curve = o.c; dir = o.d; }
          else {
            curve = U.pick(["D", "S"]); dir = U.pick([1, -1]);
            const r = eff(curve === "D" ? dir : 0, curve === "S" ? dir : 0);
            const g = U.pick(NG);
            s = `In the market for ${g.p}, the equilibrium price ${r.P > 0 ? "rose" : "fell"} while the equilibrium quantity ${r.Q > 0 ? "rose" : "fell"}.`;
          }
          const all = [["D", 1], ["D", -1], ["S", 1], ["S", -1]];
          const right = shiftTxt(curve, dir);
          return Q.mc({
            q: `${s} Assuming only one curve shifted, which shift explains this?`,
            right, keepOrder: all.map(([c, d]) => shiftTxt(c, d)),
            wrong: all.filter(([c, d]) => !(c === curve && d === dir)).map(([c, d]) => ({ t: shiftTxt(c, d), why: `That shift would make ${effPhrase(eff(c === "D" ? d : 0, c === "S" ? d : 0))}.` })),
            sol: steps("Price and quantity moving in the <b>same</b> direction points to a demand shift; moving in <b>opposite</b> directions points to a supply shift.",
              `Here: ${right.toLowerCase()} — ${caseLine(curve === "D" ? dir : 0, curve === "S" ? dir : 0).toLowerCase()}`),
          });
        },
      },
      {
        name: "Chain reasoning: news from a related market",
        make() {
          const c = U.pick(CHAIN);
          const r = eff(c.c === "D" ? c.d : 0, c.c === "S" ? c.d : 0);
          const right = resTxt(r);
          return Q.mc({
            q: `News: ${c.s} What happens to the equilibrium price and quantity in the market for <b>${c.m}</b>?`,
            right, keepOrder: PQ4,
            wrong: PQ4.filter(o => o !== right).map(o => ({ t: o, why: pq4Why(r, o) + ` The chain: ${c.why}` })),
            sol: steps(`The news is about a different market. First ask how it changes buyers' or sellers' plans for ${c.m}.`,
              c.why,
              `${shiftTxt(c.c, c.d)} for ${c.m}: ${caseLine(c.c === "D" ? c.d : 0, c.c === "S" ? c.d : 0).toLowerCase()}`),
          });
        },
      },
      {
        name: "Select every event that lowers the price",
        make() {
          for (let tries = 0; tries < 50; tries++) {
            const mk = U.pick(MKT);
            const pool = mk.D.map(e => ({ t: e.t, ok: e.dir < 0, why: `${e.why} Demand ${e.dir > 0 ? "increases, so the price rises" : "decreases, so the price falls"}.` }))
              .concat(mk.S.map(e => ({ t: e.t, ok: e.dir > 0, why: `${e.why} Supply ${e.dir > 0 ? "increases, so the price falls" : "decreases, so the price rises"}.` })));
            const opts = U.sample(pool, 5);
            const nOk = opts.filter(o => o.ok).length;
            if (nOk === 0) continue;
            return Q.multi({
              q: `Select <b>every</b> event that, on its own, would <b>lower the equilibrium price</b> of ${mk.m}.`,
              options: opts,
              sol: steps("The price falls in two cases: a decrease in demand (case 1) or an increase in supply (case 3).",
                "For each event, decide which curve shifts and which way, then apply the case."),
            });
          }
          return null;
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 8 — Both curves shift (cases 5–8)
   * ============================================================ */
  const dirW = (c, d) => `${c === "D" ? "demand" : "supply"} ${d > 0 ? "increases" : "decreases"}`;
  const PAIR_OPTS = [
    "Price rises; quantity is indeterminate", "Price falls; quantity is indeterminate",
    "Quantity rises; price is indeterminate", "Quantity falls; price is indeterminate",
    "Price rises and quantity rises", "Price falls and quantity rises",
  ];
  function pairTxt(dD, dS) {
    const r = eff(dD, dS);
    if (r.P === "?") return `Quantity ${r.Q > 0 ? "rises" : "falls"}; price is indeterminate`;
    if (r.Q === "?") return `Price ${r.P > 0 ? "rises" : "falls"}; quantity is indeterminate`;
    return `Price ${WS[r.P]} and quantity ${WS[r.Q]}`;
  }
  function pairWhy(dD, dS, t) {
    const r = eff(dD, dS);
    if (/indeterminate/.test(t)) {
      if (r.P === "?") return t.startsWith("Price") ? "With both curves moving the same way, it is price that gets opposite pushes; quantity is pushed the same way by both." : "Quantity moves with the demand and supply shifts, which agree here; but check the direction.";
      return t.startsWith("Quantity") ? "With the curves moving in opposite directions, it is quantity that gets opposite pushes; price is pushed the same way by both." : "Price is determined here, but check the direction.";
    }
    return "Without knowing the sizes of the two shifts, one of these cannot be pinned down.";
  }
  const PAIR_TF = [
    { q: "If demand and supply both increase, the equilibrium quantity must rise.", truth: true, why: "Both shifts push quantity up." },
    { q: "If demand and supply both increase, the equilibrium price must rise.", truth: false, why: "Demand pushes price up, supply pushes it down; the net effect depends on which shift is larger." },
    { q: "If demand increases and supply decreases, the equilibrium price must rise.", truth: true, why: "Both shifts push price up." },
    { q: "If demand decreases and supply increases, the equilibrium quantity must fall.", truth: false, why: "Demand pushes quantity down, supply pushes it up; quantity is indeterminate." },
    { q: "If demand and supply both decrease, the equilibrium quantity must fall.", truth: true, why: "Both shifts push quantity down." },
    { q: "If demand decreases and supply increases, the equilibrium price must fall.", truth: true, why: "Both shifts push price down." },
    { q: "When both curves shift, both the price and the quantity are always indeterminate.", truth: false, why: "One variable is always determined: the one both shifts push in the same direction." },
    { q: "If demand increases by more than supply increases, the equilibrium price rises.", truth: true, why: "At the old price the extra demand exceeds the extra supply, leaving a shortage that pushes price up." },
    { q: "If supply decreases and demand increases, equilibrium quantity could rise, fall or stay the same.", truth: true, why: "The two shifts push quantity in opposite directions." },
  ];
  const genShift2 = STUDY.makeGenerator({
    id: "b251-m3-shift2",
    name: "Both curves shift: what is determined?",
    blurb: "Cases 5–8: when demand and supply both shift, find which of price and quantity is determined, and use sizes or numbers to settle the other.",
    variants: [
      {
        name: "Which variable is indeterminate?",
        make() {
          const dD = U.pick([1, -1]), dS = U.pick([1, -1]);
          const r = eff(dD, dS);
          const opts = ["The equilibrium price", "The equilibrium quantity", "Neither: both are determined", "Both are indeterminate"];
          const ans = r.P === "?" ? 0 : 1;
          return Q.mc({
            q: `At the same time, <b>${dirW("D", dD)}</b> and <b>${dirW("S", dS)}</b>. Without knowing the sizes of the shifts, which can you <b>not</b> predict?`,
            right: opts[ans], keepOrder: opts,
            wrong: opts.filter((_, i) => i !== ans).map((t, j) => ({ t, why: t.startsWith("Neither") ? "When two curves shift, one variable gets pushed in opposite directions." : t.startsWith("Both") ? "One variable is pushed the same way by both shifts, so it is determined." : `That one is determined: ${caseLine(dD, dS)}` })),
            sol: steps("Work out each shift's effect on its own, then see where they agree.",
              `${cap(dirW("D", dD))}: price ${dD > 0 ? "↑" : "↓"}, quantity ${dD > 0 ? "↑" : "↓"}. ${cap(dirW("S", dS))}: price ${dS > 0 ? "↓" : "↑"}, quantity ${dS > 0 ? "↑" : "↓"}.`,
              `They ${r.P === "?" ? "disagree on price" : "disagree on quantity"}: ${caseLine(dD, dS)}`),
          });
        },
      },
      {
        name: "Two news events, one prediction",
        make() {
          const mk = U.pick(MKT);
          const de = U.pick(mk.D), se = U.pick(mk.S);
          const right = pairTxt(de.dir, se.dir);
          const pool = PAIR_OPTS.concat(["Price falls and quantity falls", "Price rises and quantity falls"]).filter(o => o !== right);
          const r = eff(de.dir, se.dir);
          const wrongPick = U.shuffle(pool).sort((x, y) => (/indeterminate/.test(y) ? 1 : 0) - (/indeterminate/.test(x) ? 1 : 0)).slice(0, 3);
          return Q.mc({
            q: `<b>Market for ${mk.m}.</b> Two things happen at once: (1) ${de.t} (2) ${se.t} What can you conclude about the equilibrium price and quantity of ${mk.m}?`,
            right,
            wrong: wrongPick.map(t => ({ t, why: pairWhy(de.dir, se.dir, t) + ` Here ${dirW("D", de.dir)} and ${dirW("S", se.dir)}: ${caseLine(de.dir, se.dir).toLowerCase()}` })),
            sol: steps("Sort each event: does it hit buyers (demand) or sellers (supply), and in which direction?",
              `(1) ${de.why} → ${dirW("D", de.dir)}. (2) ${se.why} → ${dirW("S", se.dir)}.`,
              `${caseLine(de.dir, se.dir)} ${r.P === "?" ? "Both curves move the same way, so price is the uncertain one." : "The curves move in opposite directions, so quantity is the uncertain one."}`),
          });
        },
      },
      {
        name: "Shifts of known relative size",
        make() {
          const dir = U.pick([1, -1]);
          const big = U.pick(["D", "S", "equal"]);
          const g = U.pick(NG);
          const sizeTxt = big === "equal" ? `by the same horizontal amount` : `, and the ${big === "D" ? "demand" : "supply"} shift is the larger one (measured horizontally)`;
          // price change sign = dir * (kD − kS)
          const pSign = big === "equal" ? 0 : (big === "D" ? dir : -dir);
          const askP = Math.random() < 0.65;
          const opts = askP ? ["Price rises", "Price falls", "Price does not change", "Price is indeterminate"] : ["Quantity rises", "Quantity falls", "Quantity does not change", "Quantity is indeterminate"];
          const ans = askP ? (pSign > 0 ? 0 : pSign < 0 ? 1 : 2) : (dir > 0 ? 0 : 1);
          return Q.mc({
            q: `In the market for ${g.p}, demand and supply both <b>${dir > 0 ? "increase" : "decrease"}</b>${big === "equal" ? " " : ""}${sizeTxt}. What happens to the equilibrium <b>${askP ? "price" : "quantity"}</b>?`,
            right: opts[ans], keepOrder: opts,
            wrong: opts.filter((_, i) => i !== ans).map(t => ({ t, why: /indeterminate/.test(t) ? "The relative sizes are given, which settles the outcome." : askP ? `At the old price, compare the extra (or lost) quantity demanded with the extra (or lost) quantity supplied.` : `Both shifts push quantity ${dir > 0 ? "up" : "down"}.` })),
            sol: steps("Hold the price at its old level and compare how far each curve moved.",
              askP ? (big === "equal" ? `Both curves move ${dir > 0 ? "right" : "left"} by the same amount, so at the old price Q<sub>d</sub> and Q<sub>s</sub> are still equal: the price <b>does not change</b>.` : `The ${big === "D" ? "demand" : "supply"} shift is larger, so at the old price there is a ${pSign > 0 ? "shortage" : "surplus"}, and the price <b>${pSign > 0 ? "rises" : "falls"}</b>.`) : `Both shifts push quantity ${dir > 0 ? "up" : "down"}, whatever their sizes: quantity <b>${dir > 0 ? "rises" : "falls"}</b>.`,
              "Without the sizes, price would be indeterminate in this case; quantity never is."),
          });
        },
      },
      {
        name: "New equilibrium after both shifts, with equations",
        make() {
          for (let t = 0; t < 300; t++) {
            const m = lin();
            const sD = U.pick([1, -1]), sS = U.pick([1, -1]);
            const u = U.randInt(1, 3), v = U.randInt(1, 3);
            const kD = sD * (m.b + m.d) * u, kS = sS * (m.b + m.d) * v;
            const a2 = m.a + kD, c2 = m.c + kS;
            const P2 = (a2 - c2) / (m.b + m.d), Q2 = a2 - m.b * P2;
            if (P2 < 1 || Q2 < 5 || a2 <= 0) continue;
            const askP = Math.random() < 0.5;
            const ans = askP ? P2 : Q2;
            const Ponly = (a2 - m.c) / (m.b + m.d);
            return Q.num({
              q: `Demand for ${m.g.p} is ${qdTxt(m.a, m.b)} and supply is ${qsTxt(m.c, m.d)} (Q in ${m.g.u}). Then both curves shift: demand becomes <b>${qdTxt(a2, m.b)}</b> and supply becomes <b>${qsTxt(c2, m.d)}</b>. What is the new equilibrium <b>${askP ? "price" : "quantity"}</b>?`,
              answer: ans, unit: askP ? "$" : m.g.p,
              traps: traps(ans, [
                { value: askP ? m.P : m.Q, why: "That is the original equilibrium." },
                { value: askP ? Ponly : a2 - m.b * Ponly, why: "That uses the new demand with the <em>old</em> supply. Both curves moved." },
                { value: askP ? Q2 : P2, why: askP ? "That is the new quantity." : "That is the new price." },
              ]),
              sol: steps("Set the new demand equal to the new supply.",
                `${a2} − ${co(m.b)}P = ${qsTxt(c2, m.d).split("= ")[1]} → ${a2 - c2} = ${m.b + m.d}P → P = ${money(P2)}; Q = ${a2} − ${m.b}×${P2} = ${Q2}.`,
                `Demand ${sD > 0 ? "rose" : "fell"} and supply ${sS > 0 ? "rose" : "fell"}. The case says: ${caseLine(sD, sS).toLowerCase()} With these sizes, ${P2 === m.P ? `price stayed at ${money(P2)}` : `price went from ${money(m.P)} to ${money(P2)}`} and ${Q2 === m.Q ? `quantity stayed at ${Q2}` : `quantity went from ${m.Q} to ${Q2}`}.`),
            });
          }
          return null;
        },
      },
      {
        name: "Sort the shift combinations",
        make() {
          const cases = [[-1, 0], [1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
          const txt = ([dD, dS]) => dD && dS ? `Demand ${dD > 0 ? "increases" : "decreases"} and supply ${dS > 0 ? "increases" : "decreases"}` : dD ? `Only demand ${dD > 0 ? "increases" : "decreases"}` : `Only supply ${dS > 0 ? "increases" : "decreases"}`;
          const cats = ["Both price and quantity determined", "Price determined, quantity indeterminate", "Quantity determined, price indeterminate"];
          const catOf = ([dD, dS]) => { const r = eff(dD, dS); return r.Q === "?" ? cats[1] : r.P === "?" ? cats[2] : cats[0]; };
          const picks = [U.pick(cases.slice(0, 4)), U.pick([[1, -1], [-1, 1]]), U.pick([[1, 1], [-1, -1]])];
          for (const c of U.shuffle(cases)) if (picks.length < 5 && !picks.some(x => x[0] === c[0] && x[1] === c[1])) picks.push(c);
          return Q.classify({
            q: "Classify each combination of shifts (sizes unknown) by what you can predict.",
            cats,
            items: picks.map(c => ({ t: txt(c), cat: catOf(c), why: caseLine(c[0], c[1]) })),
            sol: steps("One curve shifting → both price and quantity are determined (cases 1–4).",
              "Two curves shifting → the variable they push in opposite directions is indeterminate. Same direction (both up or both down) → price indeterminate. Opposite directions → quantity indeterminate."),
          });
        },
      },
      {
        name: "Both shifts on a graph",
        make() {
          for (let t = 0; t < 300; t++) {
            const b = 10, d = 10;
            const Pst = U.randInt(4, 6), Qst = U.pick([40, 50, 60]);
            const a = Qst + b * Pst, c = Qst - d * Pst;
            const kD = U.pick([20, 40, -20, -40]), kS = U.pick([20, 40, -20, -40]);
            const a2 = a + kD, c2 = c + kS;
            const P2 = (a2 - c2) / 20, Q2 = a2 - b * P2;
            if (!Number.isInteger(P2) || P2 < 2 || P2 > 9 || Q2 < 10 || Q2 > 90) continue;
            const g = U.pick(NG);
            const gph = G.plot({ xLabel: `${cap(g.p)} (per day)`, yLabel: "Price ($)", xMax: 100, yMax: 11, xTicks: range(10, 100, 10), yTicks: range(1, 11, 1),
              curves: [dCurve(a, b, 100, 11, "D₁"), dCurve(a2, b, 100, 11, "D₂", "dash"), sCurve(c, d, 100, 11, "S₁"), sCurve(c2, d, 100, 11, "S₂", "faint")],
              points: [{ x: Qst, y: Pst, label: "E₁" }], aria: "Demand and supply both shift" });
            const r = { P: Math.sign(P2 - Pst), Q: Math.sign(Q2 - Qst) };
            const right = `Price ${WS[r.P]}, quantity ${WS[r.Q]}`;
            const opts = ["rises", "falls", "unchanged"];
            const wrong = [];
            for (const p of opts) for (const q of opts) { const t2 = `Price ${p}, quantity ${q}`; if (t2 !== right) wrong.push(t2); }
            const pickW = U.sample(wrong, 3).map(t2 => ({ t: t2, why: `Find where D₂ crosses S₂: price ${money(P2)}, quantity ${Q2}, compared with ${money(Pst)} and ${Qst} at E₁.` }));
            return Q.mc({
              q: `The market for ${g.p} starts at E₁ (D₁ and S₁). Then demand shifts to D₂ and supply shifts to S₂.${gph}Compared with E₁, what happens to the equilibrium price and quantity?`,
              right, wrong: pickW,
              sol: steps(`Without sizes, the case rule says: ${caseLine(Math.sign(kD), Math.sign(kS)).toLowerCase()} The graph gives the sizes, so read the new crossing point.`,
                `D₂ and S₂ cross at ${money(P2)} and ${Q2} units.`,
                `So price ${WS[r.P] === "unchanged" ? "is unchanged" : WS[r.P]} (from ${money(Pst)}) and quantity ${WS[r.Q] === "unchanged" ? "is unchanged" : WS[r.Q]} (from ${Qst}).`),
            });
          }
          return null;
        },
      },
      {
        name: "Explain the observation: which two shifts?",
        make() {
          const combos = [[1, 1], [-1, -1], [1, -1], [-1, 1]];
          const [dD, dS] = U.pick(combos);
          const g = U.pick(NG);
          // observation: the indeterminate variable stayed the same; the determinate one moved.
          const r = eff(dD, dS);
          const obs = r.P === "?" ? `the equilibrium quantity ${r.Q > 0 ? "rose" : "fell"} while the price stayed exactly the same` : `the equilibrium price ${r.P > 0 ? "rose" : "fell"} while the quantity sold stayed exactly the same`;
          const lab = ([x, y]) => `Demand ${x > 0 ? "increased" : "decreased"} and supply ${y > 0 ? "increased" : "decreased"}`;
          return Q.mc({
            q: `Over one year in the market for ${g.p}, ${obs}. Which combination of shifts fits this?`,
            right: lab([dD, dS]),
            wrong: combos.filter(c => !(c[0] === dD && c[1] === dS)).map(c => ({ t: lab(c), why: `That combination would make ${effPhrase(eff(c[0], c[1]))}.` })),
            sol: steps("A single shift always moves both price and quantity, so one variable staying put means both curves shifted, by sizes that cancel on that variable.",
              r.P === "?" ? `Quantity moved ${r.Q > 0 ? "up" : "down"} with price unchanged: both curves shifted ${r.Q > 0 ? "right" : "left"} by the same amount.` : `Price moved ${r.P > 0 ? "up" : "down"} with quantity unchanged: the curves moved in opposite directions, ${r.P > 0 ? "demand up and supply down" : "demand down and supply up"}.`),
          });
        },
      },
      {
        name: "Double shifts: true or false",
        make() {
          const s = U.pick(PAIR_TF);
          return Q.tf({ q: s.q, truth: s.truth, why: s.why,
            sol: steps("Work out each shift's effect separately; the variable they push in opposite directions is the indeterminate one (unless sizes are given).", s.why) });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m3", order: 3,
    title: "Module 3 · Markets: Basic Demand and Supply",
    short: "M3 · D&S",
    description: "Markets and auctions, demand and supply and what shifts them, shifts vs movements, equilibrium with shortages and surpluses, and the eight cases of changing demand and supply.",
    notes, flashcards, cues,
    generators: [genMarkets, genDemand, genDShift, genSupply, genDvsQ, genEquil, genShift1, genShift2],
  });
})();
