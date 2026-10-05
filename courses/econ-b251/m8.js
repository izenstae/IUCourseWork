/* ============================================================
 * ECON B251 · Module 8 — Consumer Optimum
 * The budget line (intercepts, relative price, real income) and how
 * it shifts or rotates; preferences, total and marginal utility,
 * diminishing marginal utility; marginal utility per dollar and the
 * utility-maximizing (equimarginal) rule; solving the consumer
 * optimum from a table; and how price and income changes move the
 * optimum (substitution and real-income effects, the law of demand,
 * normal goods).
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const G = STUDY.svg;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const GOODS = [
    { s: "smoothie", p: "smoothies" }, { s: "sandwich", p: "sandwiches" }, { s: "e-book", p: "e-books" },
    { s: "taco", p: "tacos" }, { s: "comic book", p: "comic books" }, { s: "bowling game", p: "bowling games" },
    { s: "museum ticket", p: "museum tickets" }, { s: "bubble tea", p: "bubble teas" }, { s: "bagel", p: "bagels" },
    { s: "cup of coffee", p: "cups of coffee" }, { s: "houseplant", p: "houseplants" }, { s: "bus ride", p: "bus rides" },
    { s: "poke bowl", p: "poke bowls" }, { s: "paperback", p: "paperbacks" }, { s: "karaoke session", p: "karaoke sessions" },
    { s: "yoga class", p: "yoga classes" }, { s: "arcade game", p: "arcade games" }, { s: "song download", p: "song downloads" },
  ];
  const F_NAMES = ["Priya", "Hana", "Leila", "Sofia", "Amara", "Rosa", "Yuki", "Zara", "Greta", "Mei", "Nadia", "Elena", "Ines", "Tamsin"];
  const M_NAMES = ["Mateo", "Tobias", "Darnell", "Kenji", "Nils", "Idris", "Callum", "Omar", "Andre", "Felix", "Ravi", "Jonah", "Luca", "Theo"];
  function person() {
    if (Math.random() < 0.5) return { n: U.pick(F_NAMES), he: "she", He: "She", his: "her", him: "her" };
    return { n: U.pick(M_NAMES), he: "he", He: "He", his: "his", him: "him" };
  }

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const pl = (n, g) => (n === 1 ? g.s : g.p);
  const qty = (n, g) => `${U.fmt(n)} ${pl(n, g)}`;
  const an = g => (/^[aeiou]/i.test(g.s) ? "an " : "a ") + g.s;
  const two = () => U.sample(GOODS, 2);
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  const $ = x => U.money(x);
  const d2 = x => U.fmt(U.round(x, 2), 2);
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));
  const lcm = (a, b) => a * b / U.gcd(a, b);
  const sum = (arr, k) => arr.slice(0, k).reduce((a, b) => a + b, 0);
  /* MU per dollar shown as a whole number or to two decimals */
  const mupS = (mu, p) => d2(mu / p);
  const MUP = "MU/P";

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
  /* Remove wrong MC options whose text matches the right answer or each other. */
  function uniqWrong(right, wrong) {
    const seen = new Set([U.plain(right).toLowerCase()]);
    return wrong.filter(w => { const k = U.plain(w.t).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function ticks(max, n) {
    const raw = max / (n || 4);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = [1, 2, 2.5, 5, 10].find(k => k * p >= raw) * p;
    const out = [];
    for (let t = m; t <= max + 1e-9; t += m) out.push(U.round(t, 6));
    return out;
  }

  /* A budget: two goods, two prices and an income that both prices divide. */
  const PRICES = [2, 3, 4, 5, 6, 8, 10, 12];
  function budget() {
    for (;;) {
      const [X, Y] = two();
      const [px, py] = U.sample(PRICES, 2);
      const L = lcm(px, py);
      const ks = [];
      for (let k = 1; k * L <= 180; k++) if (k * L >= 24 && k * L / px >= 4 && k * L / py >= 4) ks.push(k);
      if (!ks.length) continue;
      const I = U.pick(ks) * L;
      return { X, Y, px, py, I, xi: I / px, yi: I / py, who: person() };
    }
  }
  /* Budget-line graph. lines: [{ xi, yi, style, label }] */
  function blPlot(X, Y, lines, extra) {
    const xm = Math.max(...lines.map(l => l.xi)) * 1.18, ym = Math.max(...lines.map(l => l.yi)) * 1.18;
    const sharedY = lines.length > 1 && lines.every(l => l.yi === lines[0].yi);
    return G.plot(Object.assign({
      xLabel: `${cap(X.p)} per month`, yLabel: `${cap(Y.p)} per month`, xMax: xm, yMax: ym,
      xTicks: ticks(xm), yTicks: ticks(ym),
      curves: lines.map((l, i) => { const f = sharedY ? (l.xi === Math.min(...lines.map(m => m.xi)) ? 0.85 : 0.45) : 0.5; return { pts: [[0, l.yi], [l.xi * f, l.yi * (1 - f)], [l.xi, 0]], style: l.style || "main", label: l.label, labelAt: 1 }; }),
      aria: "budget line graph",
    }, extra || {}));
  }

  /* ---------- consumer-optimum machinery ---------- */
  /* Brute force: the affordable bundle with the most total utility. */
  function solve(muX, muY, px, py, I) {
    let best = -Infinity, arg = null, ties = 0;
    for (let x = 0; x <= muX.length; x++) for (let y = 0; y <= muY.length; y++) {
      if (px * x + py * y > I) continue;
      const tu = sum(muX, x) + sum(muY, y);
      if (tu > best) { best = tu; arg = [x, y]; ties = 1; } else if (tu === best) ties++;
    }
    return { x: arg[0], y: arg[1], tu: best, unique: ties === 1 };
  }
  /* (i, j) pairs (1-based) whose MU per dollar are exactly equal. */
  function equalPairs(muX, muY, px, py) {
    const out = [];
    muX.forEach((a, i) => muY.forEach((b, j) => { if (a * py === b * px) out.push([i + 1, j + 1]); }));
    return out;
  }
  function minGap(muX, muY, px, py) {
    let g = Infinity;
    muX.forEach(a => muY.forEach(b => { const d = Math.abs(a / px - b / py); if (d > 1e-9) g = Math.min(g, d); }));
    return g;
  }
  /* Well posed: the TU-maximising affordable bundle is unique, is (x, y), spends all of I,
   * and is where the (single, or `nPairs`) equal MU-per-dollar pair sits. */
  function wellPosed(muX, muY, px, py, I, x, y, nPairs) {
    if (x < 1 || y < 1 || px * x + py * y !== I) return false;
    const s = solve(muX, muY, px, py, I);
    if (!s.unique || s.x !== x || s.y !== y) return false;
    const eq = equalPairs(muX, muY, px, py);
    if (eq.length !== (nPairs || 1) || !eq.some(p => p[0] === x && p[1] === y)) return false;
    if (minGap(muX, muY, px, py) < 0.1) return false;
    return muX.every((v, i) => i === 0 || v < muX[i - 1]) && muY.every((v, i) => i === 0 || v < muY[i - 1]);
  }
  /* Strictly decreasing positive integers of length n with fixed anchors {index: value}. */
  function descSeq(n, anchors, smax) {
    const idx = Object.keys(anchors).map(Number).sort((a, b) => a - b);
    const out = new Array(n);
    idx.forEach(i => { out[i] = anchors[i]; });
    for (let k = 1; k < idx.length; k++) if (out[idx[k - 1]] - out[idx[k]] < idx[k] - idx[k - 1]) return null;
    for (let i = idx[0] - 1; i >= 0; i--) out[i] = out[i + 1] + U.randInt(1, smax);
    for (let k = 1; k < idx.length; k++) {
      const a = idx[k - 1], b = idx[k], m = b - a - 1;
      const pool = [];
      for (let v = out[b] + 1; v < out[a]; v++) pool.push(v);
      if (pool.length < m) return null;
      U.sample(pool, m).sort((p, q) => q - p).forEach((v, j) => { out[a + 1 + j] = v; });
    }
    for (let i = idx[idx.length - 1] + 1; i < n; i++) { out[i] = out[i - 1] - U.randInt(1, smax); if (out[i] < 1) return null; }
    return out;
  }
  /* Buying the next unit with the higher MU (ignoring price) while it is affordable: the classic mistake. */
  function greedyMU(muX, muY, px, py, I) {
    let x = 0, y = 0, m = I;
    for (;;) {
      const cx = x < muX.length && px <= m, cy = y < muY.length && py <= m;
      if (!cx && !cy) break;
      if (cx && (!cy || muX[x] >= muY[y])) { m -= px; x++; } else { m -= py; y++; }
    }
    return [x, y];
  }
  const PRICE_FALLBACK = { a: 4, b: 2, py: 2, I: 12, muX: [48, 40, 32, 28, 20, 12], muY: [42, 36, 32, 24, 22, 18], x1: 1, y1: 4, x2: 3, y2: 3, v: 12, w: 16 };
  const FALLBACK = { px: 4, py: 6, muX: [48, 40, 32, 24, 20, 12], muY: [66, 54, 42, 36, 30, 12] };
  /* One equal pair, n units, a unique optimum that spends the whole income. */
  function optInstance(n) {
    n = n || 5;
    for (let t = 0; t < 3000; t++) {
      const [X, Y] = two();
      const [px, py] = U.sample([1, 2, 3, 4, 5, 6, 8, 10], 2);
      const x = U.randInt(2, n - 1), y = U.randInt(1, n - 1);
      const v = U.randInt(4, 12);
      const mx = descSeq(n, { [x - 1]: v }, 4), my = descSeq(n, { [y - 1]: v }, 4);
      if (!mx || !my) continue;
      const muX = mx.map(m => m * px), muY = my.map(m => m * py);
      const I = px * x + py * y;
      if (!wellPosed(muX, muY, px, py, I, x, y, 1)) continue;
      return { X, Y, px, py, I, muX, muY, x, y, v, who: person() };
    }
    const [X, Y] = two();
    return { X, Y, ...FALLBACK, muX: FALLBACK.muX.slice(0, 5), muY: FALLBACK.muY.slice(0, 5), I: 40, x: 4, y: 4, v: 6, who: person() };
  }
  /* Two equal pairs: optimum at income I1 and at a higher income I2. */
  function incomeInstance() {
    for (let t = 0; t < 3000; t++) {
      const [X, Y] = two();
      const [px, py] = U.sample([1, 2, 3, 4, 5, 6, 8], 2);
      const x1 = U.randInt(1, 3), y1 = U.randInt(1, 3);
      const x2 = x1 + U.randInt(1, 2), y2 = y1 + U.randInt(1, 2);
      const v = U.randInt(7, 14), w = v - U.randInt(2, 4);
      const mx = descSeq(6, { [x1 - 1]: v, [x2 - 1]: w }, 4), my = descSeq(6, { [y1 - 1]: v, [y2 - 1]: w }, 4);
      if (!mx || !my) continue;
      const muX = mx.map(m => m * px), muY = my.map(m => m * py);
      const I1 = px * x1 + py * y1, I2 = px * x2 + py * y2;
      if (!wellPosed(muX, muY, px, py, I1, x1, y1, 2) || !wellPosed(muX, muY, px, py, I2, x2, y2, 2)) continue;
      return { X, Y, px, py, muX, muY, I1, I2, x1, y1, x2, y2, v, w, who: person() };
    }
    const [X, Y] = two();
    return { X, Y, ...FALLBACK, I1: 40, I2: 50, x1: 4, y1: 4, x2: 5, y2: 5, v: 6, w: 5, who: person() };
  }
  /* Price of X falls from a to b (income fixed): optimum (x1, y1) → (x2, y2) with x2 > x1, y2 < y1. */
  function priceInstance() {
    const PAIRS = [[4, 2], [6, 3], [6, 2], [8, 4], [10, 5], [9, 3], [6, 4], [8, 6], [4, 3], [12, 8], [10, 4], [12, 6], [9, 6], [5, 4]];
    for (let t = 0; t < 20000; t++) {
      const [X, Y] = two();
      const [a, b] = U.pick(PAIRS);
      const L = lcm(a, b);
      const x1 = U.randInt(1, 3), x2 = x1 + U.randInt(1, 2);
      const y1 = U.randInt(2, 4), dy = U.randInt(1, y1 - 1), y2 = y1 - dy;
      const pn = b * x2 - a * x1;
      if (pn <= 0 || pn % dy) continue;
      const p = pn / dy;
      if (p < 2 || p > 8) continue;
      const vs = [], ws = [];
      for (let v = L / a; v <= 14; v += L / a) if (v >= 3) vs.push(v);
      if (!vs.length) continue;
      const v = U.pick(vs);
      for (let w = L / b; w <= 20; w += L / b) if (w > v && b * w < a * v) ws.push(w);
      if (!ws.length) continue;
      const w = U.pick(ws);
      const my = descSeq(6, { [y2 - 1]: w, [y1 - 1]: v }, 3);
      const sx = descSeq(6, { [x1 - 1]: a * v / L, [x2 - 1]: b * w / L }, Math.max(1, Math.round(a * v / L / 4)));
      if (!my || !sx) continue;
      const muX = sx.map(m => m * L), muY = my.map(m => m * p);
      const I = a * x1 + p * y1;
      if (!wellPosed(muX, muY, a, p, I, x1, y1, 1) || !wellPosed(muX, muY, b, p, I, x2, y2, 1)) continue;
      return { X, Y, a, b, py: p, muX, muY, I, x1, y1, x2, y2, v, w, who: person() };
    }
    const [X, Y] = two();
    return { X, Y, ...PRICE_FALLBACK, who: person() };
  }

  /* Table helpers for the optimum questions */
  function muTable(o, n, px, py) {
    return tbl(["Units", `MU of ${o.X.p} (utils)`, `MU of ${o.Y.p} (utils)`],
      Array.from({ length: n }, (_, i) => [i + 1, U.fmt(o.muX[i]), U.fmt(o.muY[i])]));
  }
  function tuTable(o, n) {
    return tbl(["Units", `Total utility from ${o.X.p}`, `Total utility from ${o.Y.p}`],
      Array.from({ length: n + 1 }, (_, i) => [i, U.fmt(sum(o.muX, i)), U.fmt(sum(o.muY, i))]));
  }
  function mupTable(o, n, px, py) {
    return tbl(["Units", `${MUP} for ${o.X.p} (price ${$(px)})`, `${MUP} for ${o.Y.p} (price ${$(py)})`],
      Array.from({ length: n }, (_, i) => [i + 1, mupS(o.muX[i], px), mupS(o.muY[i], py)]));
  }
  const mupList = (mu, p) => mu.map(m => mupS(m, p)).join(", ");
  /* The standard worked solution for "find the optimum". */
  function optSol(o, px, py, I, x, y, first) {
    return steps(first || "Use the utility-maximizing rule: (1) spend all the income and (2) make the marginal utility per dollar (MU ÷ P) equal for both goods.",
      `${MUP} for ${o.X.p} (÷ ${$(px)}): ${mupList(o.muX, px)}.<br>${MUP} for ${o.Y.p} (÷ ${$(py)}): ${mupList(o.muY, py)}.`,
      `The two match at the <b>${ord(x)} ${o.X.s}</b> and the <b>${ord(y)} ${o.Y.s}</b> (both ${mupS(o.muX[x - 1], px)} utils per dollar). Check the budget: ${$(px)} × ${x} + ${$(py)} × ${y} = ${$(px * x + py * y)} = income ${$(I)} ✓.`,
      `So the optimum is <b>${qty(x, o.X)} and ${qty(y, o.Y)}</b>. Buying one unit at a time in order of the highest MU per dollar reaches the same bundle just as the money runs out.`);
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const L1 = blPlot({ p: "smoothies" }, { p: "e-books" }, [{ xi: 15, yi: 10, label: "Budget line" }], {
    points: [{ x: 0, y: 10, label: "A" }, { x: 6, y: 6, label: "B" }, { x: 15, y: 0, label: "C" }, { x: 4, y: 3, label: "D", style: "hollow" }, { x: 12, y: 6, label: "E", style: "hollow" }],
    aria: "budget line for smoothies and e-books",
  });
  const L2a = blPlot({ p: "smoothies" }, { p: "e-books" }, [{ xi: 15, yi: 10, label: "BL₁" }, { xi: 21, yi: 14, style: "alt", label: "BL₂" }, { xi: 9, yi: 6, style: "dash", label: "BL₃" }],
    { arrows: [{ from: [12, 2], to: [15.4, 3.7] }], aria: "income change shifts the budget line in parallel" });
  const L2b = blPlot({ p: "smoothies" }, { p: "e-books" }, [{ xi: 15, yi: 10, label: "BL₁" }, { xi: 20, yi: 10, style: "alt", label: "BL₂" }],
    { arrows: [{ from: [15.4, 0.8], to: [19.2, 0.8] }], aria: "a fall in the price of smoothies rotates the budget line outward" });
  const TU_L = [0, 30, 52, 66, 72, 70];
  const L3 = G.plot({ xLabel: "Bubble teas per week", yLabel: "Total utility (utils)", xMax: 5.8, yMax: 84, xTicks: [1, 2, 3, 4, 5], yTicks: [20, 40, 60, 80],
    curves: [{ pts: TU_L.map((u, i) => [i, u]), style: "main", label: "TU", labelAt: 2 }],
    points: [{ x: 4, y: 72, label: "max" }], aria: "total utility rises, peaks, then falls" });

  const notes = [
    {
      title: "The budget line: what a household can afford",
      lo: "Recognize and show how a budget line is built from income and prices (intercepts, relative price, real income).",
      html: `<p>A household has a fixed amount of income to spend and takes prices as given: no single shopper can talk the price of coffee down. Those two facts limit its <b>consumption possibilities</b>. The <b>budget line</b> shows every combination of two goods that costs <em>exactly</em> the household's income.</p>
<ul>
  <li><b>Intercepts.</b> Spend everything on one good: the most X you can buy is <b>income ÷ P<sub>X</sub></b>; the most Y is <b>income ÷ P<sub>Y</sub></b>.</li>
  <li><b>Affordable vs unaffordable.</b> Bundles <em>on</em> the line use all the income; bundles <em>inside</em> it are affordable with money left over; bundles <em>beyond</em> it are unaffordable.</li>
  <li><b>Relative price and slope.</b> A <b>relative price</b> is one price divided by another. With X on the horizontal axis, the slope of the budget line is <b>−P<sub>X</sub>/P<sub>Y</sub></b>: the number of Y you must give up to buy one more X. It is the opportunity cost of X.</li>
  <li><b>Real income</b> is income measured in goods rather than dollars: income ÷ the price of a good. The two intercepts are the household's real income in X and in Y.</li>
</ul>
${L1}
<div class="example"><b>Example.</b> Noor has $60 a month for smoothies ($4) and e-books ($6). The most smoothies she can buy is 60 ÷ 4 = <b>15</b> (point C); the most e-books is 60 ÷ 6 = <b>10</b> (point A). Bundle B, 6 smoothies and 6 e-books, costs 24 + 36 = $60, so it is on the line. D (4 smoothies, 3 e-books) costs $34: affordable, with $26 left. E (12 smoothies, 6 e-books) costs $84: unaffordable. The relative price of a smoothie is $4 ÷ $6 = <b>2/3 of an e-book</b>, so the slope is −2/3. Her real income is 15 smoothies, or 10 e-books.</div>
<div class="keyidea"><b>Key idea.</b> Intercept = income ÷ that good's price. Slope = −(price of the horizontal good) ÷ (price of the vertical good).</div>
<div class="trap"><b>Common trap.</b> Flipping the slope. With smoothies on the horizontal axis the slope is −P<sub>smoothie</sub>/P<sub>e-book</sub> = −4/6, not −6/4. A quick check: rise over run is (Y intercept) ÷ (X intercept) = 10 ÷ 15 = 2/3.</div>`,
      gens: ["b251-m8-budget"],
    },
    {
      title: "How the budget line changes: shifts and rotations",
      lo: "Show how a budget line changes when income changes (parallel shift) and when a price changes (rotation).",
      html: `<p>Two kinds of change move the budget line, and they look different on a graph.</p>
<p><b>A change in income</b> moves both intercepts in the same proportion and leaves the prices, and so the slope, alone. The line makes a <b>parallel shift</b>: outward when income rises, inward when it falls.</p>
${L2a}
<p><b>A change in one price</b> moves only that good's intercept, because the most you can buy of the <em>other</em> good has not changed. The line <b>rotates</b> around the other intercept and its slope (the relative price) changes. A lower price of the horizontal good swings the line out along the horizontal axis and makes it flatter. A higher price swings it in and makes it steeper.</p>
${L2b}
<div class="example"><b>Example.</b> Start from Noor's line: $60, smoothies $4, e-books $6 (BL₁, intercepts 15 and 10). If her income rises to $84, the intercepts become 21 and 14 (BL₂): a parallel shift out with the same slope, −2/3. If her income instead falls to $36, the intercepts are 9 and 6 (BL₃). If, back at $60, the price of a smoothie falls to $3, the smoothie intercept moves out to 20 while the e-book intercept stays at 10 (second graph): the line rotates outward and flattens to −3/6 = −1/2.</div>
<div class="keyidea"><b>Key idea.</b> Income change → parallel shift (slope unchanged). Price change → rotation around the other good's intercept (slope changes). If income and every price change by the same percentage, the line does not move at all.</div>
<div class="trap"><b>Common trap.</b> "The price of e-books rose, so the whole line shifts in." Only the e-book intercept moves; the most smoothies Noor can buy is still 60 ÷ 4 = 15. Also, a cut in <em>both</em> prices by the same percentage is a parallel shift outward, just like a rise in income, because the relative price is unchanged.</div>`,
      gens: ["b251-m8-bshift"],
    },
    {
      title: "Preferences and utility: total vs marginal utility",
      lo: "Relate preferences to utility and differentiate between total and marginal utility; explain diminishing marginal utility.",
      html: `<p>A household's <b>preferences</b> describe what it likes and how much. Economists call the benefit or satisfaction a person gets from consuming a good <b>utility</b>, measured in made-up units called <em>utils</em>. Utils are only a yardstick for one person's choices; they are not meant for comparing two different people.</p>
<ul>
  <li><b>Total utility (TU)</b> is the total benefit from all the units consumed. Usually more consumption means more total utility, at least up to a point.</li>
  <li><b>Marginal utility (MU)</b> is the change in total utility from consuming one more unit: <b>MU = ΔTU ÷ ΔQ</b>.</li>
  <li><b>Diminishing marginal utility:</b> as a person consumes more of a good in a given period, each extra unit adds less utility than the one before.</li>
</ul>
${tbl(["Bubble teas per week", "Total utility", "Marginal utility"], [[0, 0, "—"], [1, 30, 30], [2, 52, 22], [3, 66, 14], [4, 72, 6], [5, 70, "−2"]])}
${L3}
<div class="example"><b>Example.</b> Kai's utility from bubble tea is in the table. The 2nd tea adds 52 − 30 = 22 utils; the 3rd adds 14; the 4th adds 6. Marginal utility falls with every tea, yet total utility keeps rising while MU is positive. The 5th tea has MU = 70 − 72 = −2: it actually makes Kai worse off, so TU falls. Total utility is highest at 4 teas, the point where marginal utility drops to zero and then turns negative.</div>
<div class="keyidea"><b>Key idea.</b> TU is the running total of the MUs. TU rises when MU &gt; 0, peaks where MU reaches 0, and falls when MU &lt; 0.</div>
<div class="trap"><b>Common trap.</b> Diminishing <em>marginal</em> utility does not mean total utility is falling. Kai's 3rd tea adds less than his 2nd, but it still adds something, so his total utility goes up. Also, MU is the <em>change</em> in TU, not TU divided by the quantity (that would be an average).</div>`,
      gens: ["b251-m8-utility"],
    },
    {
      title: "The consumer optimum: equalizing marginal utility per dollar",
      lo: "Relate the consumer optimum to utility maximization and state the utility-maximizing rule.",
      html: `<p>The <b>consumer optimum</b> (also called <b>consumer equilibrium</b>) is the affordable combination of goods that gives the household the greatest total utility. You could find it by computing total utility for every affordable bundle, but marginal analysis gives a faster rule.</p>
<p>Because prices differ, comparing marginal utilities alone is misleading. A $12 concert stream that gives 60 utils is a worse deal than a $3 snack that gives 24 utils: 60 ÷ 12 = 5 utils per dollar against 24 ÷ 3 = 8. The right comparison is the <b>marginal utility per dollar</b>, MU ÷ P.</p>
<p><b>The utility-maximizing rule</b> (the rule of equal marginal utility per dollar): total utility is as large as possible when the consumer</p>
<ol>
  <li><b>spends all available income</b>, and</li>
  <li>makes the <b>marginal utility per dollar equal for every good</b>: MU<sub>A</sub>/P<sub>A</sub> = MU<sub>B</sub>/P<sub>B</sub> = … = MU<sub>Z</sub>/P<sub>Z</sub>.</li>
</ol>
<p><b>Why it works.</b> Suppose MU<sub>X</sub>/P<sub>X</sub> = 9 but MU<sub>Y</sub>/P<sub>Y</sub> = 5. Moving one dollar from Y to X loses about 5 utils and gains about 9, a net gain of about 4, with the same spending. So the consumer buys more X and less Y. Diminishing marginal utility does the rest: as she buys more X its MU falls, and as she buys less Y its MU rises, until the two ratios meet. Unspent money is wasted utility too: as long as another unit would add utility, spending the leftover raises total utility.</p>
<p><b>Consumer efficiency.</b> At the optimum the household cannot make itself better off by rearranging its spending, so it is using its resources efficiently. The price it pays for the last unit of each good then measures that unit's <b>marginal benefit</b>: the most the consumer would be willing to pay for one more unit.</p>
<div class="example"><b>Example.</b> Dmitri's last cup of coffee ($3) gave 15 utils and his last paperback ($10) gave 70 utils. Coffee: 15 ÷ 3 = 5 utils per dollar. Paperback: 70 ÷ 10 = 7 utils per dollar. He is not at his optimum: he should buy more paperbacks and fewer coffees. The paperback wins on MU per dollar, not because 70 is bigger than 15.</div>
<div class="keyidea"><b>Key idea.</b> If MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>, buy more X and less Y. Stop when the ratios are equal and the budget is spent.</div>
<div class="trap"><b>Common trap.</b> "At the optimum the marginal utilities are equal." No: the marginal utilities <em>per dollar</em> are equal. A good that costs twice as much must deliver twice the marginal utility.</div>`,
      gens: ["b251-m8-mup", "b251-m8-rule"],
    },
    {
      title: "Worked method: solving the optimum from a utility table",
      lo: "Solve the consumer optimization problem from total- or marginal-utility tables, prices and income.",
      html: `<p>A typical problem gives a table of total or marginal utility for two goods, their prices and an income. The method:</p>
<ol>
  <li>If you are given total utility, find each <b>marginal utility</b>: MU of the n-th unit = TU(n) − TU(n − 1).</li>
  <li>Divide each MU by that good's price to get <b>MU per dollar</b>.</li>
  <li>Find the bundle where the MU per dollar of the <b>last</b> unit of each good is <b>equal</b>.</li>
  <li><b>Check the budget:</b> P<sub>X</sub> × Q<sub>X</sub> + P<sub>Y</sub> × Q<sub>Y</sub> must equal income.</li>
</ol>
<p>An equivalent way to see it: buy one unit at a time, always choosing the unit with the highest MU per dollar, until the money runs out.</p>
${tbl(["Units", "MU smoothies", "MU/P ($4)", "MU e-books", "MU/P ($6)"], [[1, 48, 12, 66, 11], [2, 40, 10, 54, 9], [3, 32, 8, 42, 7], [4, 24, 6, 36, 6], [5, 20, 5, 30, 5], [6, 12, 3, 12, 2]])}
<div class="example"><b>Example.</b> Noor has $40 for smoothies ($4) and e-books ($6), with the marginal utilities above. Dividing by the prices gives the MU/P columns. The ratios match at the 4th smoothie and the 4th e-book (6 utils per dollar each), and 4 × $4 + 4 × $6 = $16 + $24 = $40, exactly her income. Her optimum is <b>4 smoothies and 4 e-books</b>, with total utility 48 + 40 + 32 + 24 + 66 + 54 + 42 + 36 = <b>342 utils</b>. Buying in order of MU per dollar gives the same answer: 12 (smoothie), 11 (e-book), 10, 9, 8, 7, then 6 and 6; the running cost is $4, $10, $14, $20, $24, $30 and finally $40.<br><br>
The 5th units also tie (5 utils per dollar each), but that bundle costs $50, more than she has. A match only counts if it also uses exactly the income.</div>
<div class="keyidea"><b>Key idea.</b> Two conditions, both required: equal MU per dollar <em>and</em> all income spent.</div>
<div class="trap"><b>Common trap.</b> Comparing raw MU instead of MU per dollar. Going by MU alone, Noor would buy e-books first (66 &gt; 48) and stop at a bundle that gives her less total utility. Another slip is using TU instead of MU: decisions are made at the margin, so only the extra utility of the next unit matters.</div>`,
      gens: ["b251-m8-optimum"],
    },
    {
      title: "How a price change affects the consumer optimum",
      lo: "Evaluate the effect of a change in price on the consumer optimum and link it to the law of demand.",
      html: `<p>Start at an optimum, where MU<sub>X</sub>/P<sub>X</sub> = MU<sub>Y</sub>/P<sub>Y</sub>. Now let the price of X fall. Nothing has happened yet to the quantities, so MU<sub>X</sub> is unchanged, but dividing it by a smaller price makes <b>MU<sub>X</sub>/P<sub>X</sub> larger</b>: now MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>. To restore equality the consumer <b>buys more X</b>, which drives MU<sub>X</sub> down (diminishing MU). With the same income, the usual result is that she buys <b>less Y</b>, which pushes MU<sub>Y</sub> up, until the ratios are equal again.</p>
<ul>
  <li><b>Law of demand.</b> A lower price of X leads to a larger quantity of X demanded: the demand curve slopes downward. A higher price works in reverse.</li>
  <li><b>Substitution effect:</b> people switch toward the good that has become relatively cheaper, the one now giving more utility per dollar, and away from the relatively dearer one.</li>
  <li><b>Real-income effect:</b> with money income unchanged, a lower price raises purchasing power (real income), and a higher price lowers it.</li>
  <li><b>Other goods.</b> A change in the price of one good can change how much of <em>another</em> good is bought, as with Y above.</li>
</ul>
<div class="example"><b>Example.</b> Elif has $18 a week for tacos ($6) and bus rides ($3).
${tbl(["Units", "MU tacos", "MU/P at $6", "MU/P at $3", "MU bus rides", "MU/P ($3)"], [[1, 60, 10, 20, 57, 19], [2, 54, 9, 18, 51, 17], [3, 42, 7, 14, 42, 14], [4, 36, 6, 12, 30, 10], [5, 18, 3, 6, 24, 8]])}
At $6 a taco the ratios match at the 1st taco and the 4th bus ride (10 utils per dollar each), and 6 + 4 × 3 = $18: her optimum is <b>1 taco and 4 bus rides</b>. Now the taco price falls to $3. At her old bundle the taco's MU per dollar jumps from 10 to 60 ÷ 3 = 20, well above the bus ride's 10, so she buys more tacos. The new match is the 3rd taco and the 3rd bus ride (14 each), and 3 × 3 + 3 × 3 = $18. Her new optimum is <b>3 tacos and 3 bus rides</b>: more tacos at the lower price (the law of demand) and one fewer bus ride.</div>
<div class="keyidea"><b>Key idea.</b> Price of X falls → MU<sub>X</sub>/P<sub>X</sub> rises → buy more X until MU<sub>X</sub> falls enough to restore equality. That is the law of demand, seen from inside the consumer's head.</div>
<div class="trap"><b>Common trap.</b> "When the price falls, the marginal utility of the good rises." The MU of a given unit does not depend on its price; what rises is MU <em>per dollar</em>. Once the consumer buys more, MU actually <em>falls</em>.</div>`,
      gens: ["b251-m8-change"],
    },
    {
      title: "How an income change affects the consumer optimum",
      lo: "Evaluate the effect of a change in income on the consumer optimum (normal goods).",
      html: `<p>A rise in income shifts the budget line out in parallel; prices, and so the MU per dollar of each unit, are unchanged. At the old bundle the consumer now has money left over, and the old bundle no longer satisfies "spend all your income". She keeps buying the units with the next-highest MU per dollar until the money is gone, ending at a new bundle where the ratios are equal again.</p>
<p>For a <b>normal good</b>, demand increases when income increases, so she buys more of it. In the table problems in this course both goods are normal, and a higher income means more of both. (A good whose demand <em>falls</em> when income rises, such as the cheapest store-brand noodles for some shoppers, is an <b>inferior good</b>.)</p>
<div class="example"><b>Example.</b> Go back to Noor's table in the worked-method lesson: smoothies $4, e-books $6. With $40 her optimum is 4 smoothies and 4 e-books. If her income rises to $50, the next matching pair is the 5th smoothie and the 5th e-book (5 utils per dollar each), and 5 × $4 + 5 × $6 = $50. Her new optimum is <b>5 smoothies and 5 e-books</b>: more of both, so both are normal goods for her.</div>
<div class="keyidea"><b>Key idea.</b> Income up → budget line shifts out → buy more of every normal good, moving down each MU schedule until MU per dollar is equal again and the new income is spent.</div>
<div class="trap"><b>Common trap.</b> An income change does not change any good's MU per dollar for a given unit; prices are the same. What changes is how far down the MU-per-dollar lists the consumer can afford to go.</div>`,
      gens: ["b251-m8-change"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m8-c-budgetline", tag: "Definition", front: "What is a household's <em>budget line</em>?", back: "The set of all combinations of two goods that cost <b>exactly</b> the household's income at current prices. It marks the limit of its consumption possibilities." },
    { id: "b251-m8-c-afford", tag: "Distinction", front: "Bundles on, inside and beyond the budget line?", back: "<b>On</b>: affordable, uses all income. <b>Inside</b>: affordable with money left over. <b>Beyond</b>: unaffordable." },
    { id: "b251-m8-c-intercepts", tag: "Formula", front: "How do you find the intercepts of a budget line?", back: "Most X = <b>income ÷ P<sub>X</sub></b>; most Y = <b>income ÷ P<sub>Y</sub></b>. E.g. $90, X at $5, Y at $9 → 18 X or 10 Y." },
    { id: "b251-m8-c-relprice", tag: "Definition", front: "What is a <em>relative price</em>?", back: "One good's price divided by another's. P<sub>X</sub>/P<sub>Y</sub> is the number of Y you give up for one X. E.g. X at $8 and Y at $2: 4 Y per X." },
    { id: "b251-m8-c-slope", tag: "Formula", front: "Slope of the budget line (X on the horizontal axis)?", back: "<b>−P<sub>X</sub>/P<sub>Y</sub></b>, the relative price of X (its opportunity cost in Y). Check: Y intercept ÷ X intercept gives the same size." },
    { id: "b251-m8-c-realinc", tag: "Definition", front: "What is <em>real income</em>?", back: "Income measured in goods: money income ÷ the price of a good. $120 with a good priced at $6 is a real income of 20 units of that good." },
    { id: "b251-m8-c-incshift", tag: "Principle", front: "How does a change in income move the budget line?", back: "A <b>parallel shift</b> (out if income rises, in if it falls). The slope is unchanged because relative prices are unchanged." },
    { id: "b251-m8-c-pricerot", tag: "Principle", front: "How does a change in the price of X move the budget line?", back: "It <b>rotates</b> around the Y intercept: only the X intercept moves. A lower P<sub>X</sub> swings the line out and flattens it; a higher P<sub>X</sub> swings it in and steepens it." },
    { id: "b251-m8-c-allchange", tag: "Example", front: "Income and both prices all double. What happens to the budget line?", back: "<b>Nothing.</b> Both intercepts (income ÷ price) and the slope (price ratio) are unchanged." },
    { id: "b251-m8-c-bothfall", tag: "Example", front: "Both prices fall by half while income stays the same. Shift or rotation?", back: "A <b>parallel shift outward</b>: both intercepts double and the relative price is unchanged, exactly as if income had doubled." },
    { id: "b251-m8-c-prefs", tag: "Definition", front: "What are <em>preferences</em>, and what is <em>utility</em>?", back: "Preferences describe a person's likes and dislikes; they determine the benefit a good gives. <b>Utility</b> is that benefit or satisfaction from consumption." },
    { id: "b251-m8-c-tu", tag: "Definition", front: "Total utility", back: "The total benefit a person gets from all the units of a good (or goods) consumed. Generally, more consumption gives more total utility, up to a point." },
    { id: "b251-m8-c-mu", tag: "Formula", front: "Marginal utility", back: "The change in total utility from consuming one more unit: <b>MU = ΔTU ÷ ΔQ</b>. E.g. TU goes 40 → 55 for the 3rd unit, so MU of the 3rd = 15." },
    { id: "b251-m8-c-dmu", tag: "Principle", front: "State the principle of diminishing marginal utility.", back: "As a person consumes more of a good in a period, the extra benefit from each additional unit <b>declines</b>." },
    { id: "b251-m8-c-tumax", tag: "Principle", front: "Where is total utility at its maximum?", back: "Where <b>marginal utility reaches zero</b>. Past that point MU is negative and TU falls." },
    { id: "b251-m8-c-tu-mu-trap", tag: "Why", front: "MU is falling. Must TU be falling?", back: "<b>No.</b> As long as MU is positive, each unit still adds to TU, just less than the one before. TU falls only when MU is negative." },
    { id: "b251-m8-c-mup", tag: "Formula", front: "Marginal utility per dollar", back: "<b>MU ÷ P</b>: the utility gained from the last dollar spent on a good. A $5 unit that adds 40 utils gives 8 utils per dollar." },
    { id: "b251-m8-c-optimum", tag: "Definition", front: "What is the consumer optimum (consumer equilibrium)?", back: "The affordable combination of goods that gives the <b>greatest total utility</b> given the household's income and the prices it faces." },
    { id: "b251-m8-c-rule", tag: "Principle", front: "State the utility-maximizing rule.", back: "(1) <b>Spend all available income</b>, and (2) <b>equalize marginal utility per dollar</b> across goods: MU<sub>A</sub>/P<sub>A</sub> = MU<sub>B</sub>/P<sub>B</sub> = … ." },
    { id: "b251-m8-c-gt", tag: "Principle", front: "MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>. What should the consumer do?", back: "Buy <b>more X and less Y</b>. MU<sub>X</sub> falls and MU<sub>Y</sub> rises until the ratios are equal." },
    { id: "b251-m8-c-whymup", tag: "Calculation", front: "The next X gives 45 utils at $9; the next Y gives 24 utils at $4. Which is the better buy?", back: "X: 45 ÷ 9 = 5 utils per dollar. Y: 24 ÷ 4 = 6. <b>Y</b>, even though X has the bigger MU." },
    { id: "b251-m8-c-spendall", tag: "Why", front: "Why must the consumer spend all income at the optimum?", back: "Money left over could buy more units that add utility, so total utility could still rise. Equal MU per dollar with unspent income is not the optimum." },
    { id: "b251-m8-c-dollar", tag: "Calculation", front: "MU<sub>X</sub>/P<sub>X</sub> = 9 and MU<sub>Y</sub>/P<sub>Y</sub> = 5. Roughly what does moving $1 from Y to X do?", back: "Lose about 5 utils, gain about 9: total utility rises by about <b>4 utils</b> with no extra spending." },
    { id: "b251-m8-c-efficiency", tag: "Definition", front: "Consumer efficiency and marginal benefit", back: "At the optimum the consumer cannot gain by reallocating, so resources are used efficiently. The marginal benefit of a good is then the <b>most the consumer is willing to pay</b> for one more unit." },
    { id: "b251-m8-c-pricefall", tag: "Principle", front: "The price of X falls. Walk through the adjustment.", back: "MU<sub>X</sub>/P<sub>X</sub> rises above MU<sub>Y</sub>/P<sub>Y</sub> → buy <b>more X</b> (MU<sub>X</sub> falls), usually less Y (MU<sub>Y</sub> rises) → ratios equal again. More X demanded at a lower price: the <b>law of demand</b>." },
    { id: "b251-m8-c-subst", tag: "Definition", front: "Substitution effect", back: "The tendency to switch toward the good that has become relatively cheaper (more MU per dollar) and away from the one that has become relatively more expensive." },
    { id: "b251-m8-c-realeff", tag: "Definition", front: "Real-income effect", back: "The change in purchasing power when one price changes while money income stays the same. A price cut raises real income; a price rise lowers it." },
    { id: "b251-m8-c-cross", tag: "Principle", front: "Can a change in the price of X change how much Y is bought?", back: "<b>Yes.</b> After a cut in P<sub>X</sub>, restoring equal MU per dollar typically means buying less Y (raising MU<sub>Y</sub>) while buying more X." },
    { id: "b251-m8-c-income", tag: "Principle", front: "Income rises. What happens at the consumer optimum?", back: "The budget line shifts out; the consumer buys more of each <b>normal good</b>, moving further down each MU-per-dollar schedule until the new income is spent." },
    { id: "b251-m8-c-inferior", tag: "Distinction", front: "Normal good vs inferior good?", back: "<b>Normal</b>: demand rises when income rises. <b>Inferior</b>: demand falls when income rises (e.g. the cheapest instant noodles for some shoppers)." },
    { id: "b251-m8-c-solve", tag: "Calculation", front: "X costs $2, Y costs $5, income $16. MU/P of X: 10, 8, 6, 4; of Y: 9, 6, 3. Find the optimum.", back: "MU/P match at the 3rd X and the 2nd Y (6 utils per dollar each), and 3 × $2 + 2 × $5 = $16 = income. Optimum: <b>3 X and 2 Y</b>." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“the most … she could buy”, “if she spent everything on …”", think: "Budget-line intercept = income ÷ price", why: "Spending all income on one good gives that good's intercept, and it is real income measured in that good." },
    { when: "“slope of the budget line”, “how many Y to get one more X”", think: "Relative price P<sub>X</sub>/P<sub>Y</sub>", why: "With X on the horizontal axis the slope is −P<sub>X</sub>/P<sub>Y</sub>; put the horizontal good's price on top." },
    { when: "“raise”, “pay cut”, “bonus”, “allowance” (prices unchanged)", think: "Parallel shift of the budget line", why: "Income moves both intercepts in proportion and leaves the slope alone." },
    { when: "“sale on …”, “price of one good rises”", think: "Rotation around the other intercept", why: "Only the intercept of the good whose price changed moves; the slope changes." },
    { when: "“income and all prices double / rise by the same %”", think: "Budget line does not move", why: "Income ÷ price and the price ratio are both unchanged." },
    { when: "“extra satisfaction from one more”, “the 3rd unit adds …”", think: "Marginal utility = ΔTU ÷ ΔQ", why: "Marginal means the change from one more unit, not the total or the average." },
    { when: "“each one is less enjoyable than the last”", think: "Diminishing marginal utility", why: "MU falls as consumption rises, though TU still rises while MU &gt; 0." },
    { when: "“MU is negative”, “too much of a good thing”", think: "Total utility is falling", why: "TU peaks where MU reaches zero." },
    { when: "different prices, “which is the better buy?”", think: "Compare MU ÷ P, not MU", why: "The consumer gets the most utility from each dollar by comparing utility per dollar." },
    { when: "“best she can do with her income”, “maximizes satisfaction”", think: "Consumer optimum: spend all income, equal MU/P", why: "Both conditions are needed: equal ratios and an exhausted budget." },
    { when: "MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>", think: "Buy more X, less Y", why: "Moving a dollar toward X gains more utility than it loses; diminishing MU closes the gap." },
    { when: "“money left over” but ratios equal", think: "Not yet the optimum", why: "Spending the leftover on more units still adds utility." },
    { when: "“price falls”, “goes on sale” at an optimum", think: "MU/P of that good rises → buy more (law of demand)", why: "Substitution and real-income effects both push toward more of a good whose price fell." },
    { when: "“income rises” at an optimum", think: "Buy more of normal goods", why: "The budget line shifts out; prices and MU-per-dollar schedules are unchanged." },
  ];

  /* ============================================================
   * PRACTICE 1 — Budget line arithmetic
   * ============================================================ */
  const genBudget = STUDY.makeGenerator({
    id: "b251-m8-budget",
    name: "The budget line",
    blurb: "Intercepts, relative price and slope, real income, the cost of a bundle, and which bundles are affordable.",
    variants: [
      {
        name: "Intercept: the most of one good",
        make() {
          const b = budget();
          const askX = Math.random() < 0.5;
          const G1 = askX ? b.X : b.Y, G2 = askX ? b.Y : b.X, p1 = askX ? b.px : b.py, p2 = askX ? b.py : b.px;
          const ans = b.I / p1;
          return Q.num({
            q: `${b.who.n} has ${$(b.I)} a month to spend on ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). What is the greatest number of <b>${G1.p}</b> ${b.who.he} can buy in a month? (This is where the budget line meets the ${G1.p} axis.)`,
            answer: ans, unit: G1.p, kind: "count",
            traps: traps(ans, [
              { value: b.I / p2, why: `That divides by the price of ${G2.p}. The ${G1.p} intercept uses the price of ${G1.p}.` },
              { value: b.I / (b.px + b.py), why: "That is how many <em>pairs</em> (one of each) the income buys. The intercept spends everything on one good." },
              { value: p1, why: "That is just the price." },
            ]),
            sol: steps(`The intercept is the bundle where all income goes to ${G1.p} and none to ${G2.p}.`,
              `Most ${G1.p} = income ÷ price of ${an(G1)} = ${$(b.I)} ÷ ${$(p1)} = <b>${qty(ans, G1)}</b>. That is also ${b.who.n}'s real income measured in ${G1.p}.`),
          });
        },
      },
      {
        name: "Relative price and slope",
        make() {
          const b = budget();
          const ans = b.px / b.py;
          const form = U.pick(["rel", "slope", "oc"]);
          const qtxt = form === "rel" ? `What is the <b>relative price of ${an(b.X)}</b>, measured in ${b.Y.p}?`
            : form === "slope" ? `With ${b.X.p} on the horizontal axis and ${b.Y.p} on the vertical axis, what is the <b>size</b> (absolute value) of the slope of ${b.who.his} budget line?`
              : `Along ${b.who.his} budget line, how many ${b.Y.p} must ${b.who.he} give up to buy <b>one more ${b.X.s}</b>?`;
          return Q.num({
            q: `${b.who.n} spends ${$(b.I)} a month on ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). ${qtxt} (A fraction or decimal is fine.)`,
            answer: ans, unit: b.Y.p,
            traps: traps(ans, [
              { value: b.py / b.px, why: `That is P<sub>Y</sub>/P<sub>X</sub>, upside down. The relative price of ${an(b.X)} puts the ${b.X.s} price on top: it is how many ${b.Y.p} one ${b.X.s} is worth.` },
              { value: b.xi, why: "That is the horizontal intercept, not the slope." },
              { value: Math.abs(b.px - b.py), why: "A relative price is a ratio of prices, not a difference." },
            ]),
            sol: steps(`A relative price is one price divided by another. The slope of the budget line, with ${b.X.p} on the horizontal axis, is −P<sub>X</sub>/P<sub>Y</sub>.`,
              `${$(b.px)} ÷ ${$(b.py)} = <b>${U.frac(b.px, b.py)}${b.px % b.py ? ` ≈ ${d2(ans)}` : ""} ${ans === 1 ? b.Y.s : b.Y.p} per ${b.X.s}</b>.`,
              `Check with the intercepts: ${U.fmt(b.yi)} ${b.Y.p} ÷ ${U.fmt(b.xi)} ${b.X.p} = ${d2(b.yi / b.xi)}, the same.`),
          });
        },
      },
      {
        name: "Cost of a bundle and money left over",
        make() {
          const b = budget();
          let x, y;
          do { x = U.randInt(1, b.xi - 1); y = U.randInt(1, b.yi - 1); } while (b.px * x + b.py * y >= b.I || b.px === b.py);
          const cost = b.px * x + b.py * y, left = b.I - cost;
          const askLeft = Math.random() < 0.5;
          const ans = askLeft ? left : cost;
          return Q.num({
            q: `${b.who.n} has ${$(b.I)} for ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). ${b.who.He} buys ${qty(x, b.X)} and ${qty(y, b.Y)}. ${askLeft ? "How much money does " + b.who.he + " have <b>left over</b>?" : "How much does this bundle <b>cost</b>?"}`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: askLeft ? b.I - (b.px * y + b.py * x) : b.px * y + b.py * x, why: "The prices got swapped: multiply each quantity by its own good's price." },
              askLeft ? { value: cost, why: "That is the cost of the bundle. Subtract it from the income to get what is left." } : { value: b.I - cost, why: "That is the money left over, not the cost." },
              { value: x + y, why: "That counts units, not dollars." },
              { value: (b.px + b.py) * Math.max(x, y), why: "Each good's quantity must be multiplied by its own price." },
            ]),
            sol: steps("Cost of a bundle = P<sub>X</sub> × Q<sub>X</sub> + P<sub>Y</sub> × Q<sub>Y</sub>.",
              `${$(b.px)} × ${x} + ${$(b.py)} × ${y} = ${$(b.px * x)} + ${$(b.py * y)} = ${$(cost)}.`,
              askLeft ? `Left over: ${$(b.I)} − ${$(cost)} = <b>${$(left)}</b>. The bundle lies inside the budget line.` : `So the bundle costs <b>${$(cost)}</b>, leaving ${$(left)}: it lies inside the budget line.`),
          });
        },
      },
      {
        name: "On, inside or beyond the budget line",
        make() {
          const b = budget();
          const cats = ["On the line (spends all income)", "Inside (affordable, money left)", "Beyond (unaffordable)"];
          const seen = new Set(), items = [];
          const add = (x, y) => {
            const k = x + ":" + y; if (seen.has(k) || x < 0 || y < 0) return false;
            const c = b.px * x + b.py * y;
            const cat = c === b.I ? cats[0] : c < b.I ? cats[1] : cats[2];
            seen.add(k);
            items.push({ t: `${qty(x, b.X)} and ${qty(y, b.Y)}`, cat, why: `Cost: ${$(b.px)} × ${x} + ${$(b.py)} × ${y} = ${$(c)} ${c === b.I ? "=" : c < b.I ? "&lt;" : "&gt;"} ${$(b.I)}.` });
            return true;
          };
          const stepX = lcm(b.px, b.py) / b.px, stepY = lcm(b.px, b.py) / b.py;
          const onPts = [];
          for (let x = 0; x <= b.xi; x += stepX) onPts.push([x, (b.I - b.px * x) / b.py]);
          U.sample(onPts, Math.min(onPts.length, U.randInt(1, 2))).forEach(p => add(p[0], p[1]));
          let g = 0;
          while (items.filter(i => i.cat === cats[1]).length < 2 && g++ < 200) { const x = U.randInt(0, b.xi), y = U.randInt(0, b.yi); if (b.px * x + b.py * y < b.I) add(x, y); }
          g = 0;
          while (items.filter(i => i.cat === cats[2]).length < 2 && g++ < 200) {
            // beyond, but each quantity within its own intercept, so no shortcut
            const x = U.randInt(1, b.xi), y = U.randInt(1, b.yi);
            if (b.px * x + b.py * y > b.I) add(x, y);
          }
          void stepY;
          return Q.classify({
            q: `${b.who.n} has ${$(b.I)} for ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). Where does each bundle lie relative to ${b.who.his} budget line?`,
            cats, items: U.shuffle(items).slice(0, 5),
            sol: steps("Price out each bundle: P<sub>X</sub> × Q<sub>X</sub> + P<sub>Y</sub> × Q<sub>Y</sub>, then compare with the income.",
              `Equal to ${$(b.I)} → on the line. Less → inside (affordable, money left over). More → beyond (unaffordable). A bundle can be unaffordable even when each quantity is below its own intercept (${U.fmt(b.xi)} ${b.X.p}, ${U.fmt(b.yi)} ${b.Y.p}).`),
          });
        },
      },
      {
        name: "Missing quantity on the budget line",
        make() {
          const b = budget();
          const stepX = lcm(b.px, b.py) / b.px;
          const xs = [];
          for (let x = stepX; x < b.xi; x += stepX) xs.push(x);
          if (!xs.length) return this.make();
          const x = U.pick(xs), ans = (b.I - b.px * x) / b.py;
          return Q.num({
            q: `${b.who.n} spends all ${$(b.I)} of ${b.who.his} monthly budget on ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). If ${b.who.he} buys ${qty(x, b.X)}, how many ${b.Y.p} does ${b.who.he} buy?`,
            answer: ans, unit: b.Y.p, kind: "count",
            traps: traps(ans, [
              { value: b.I - b.px * x, why: `That is the money left for ${b.Y.p}. Divide it by the price of ${an(b.Y)}.` },
              b.yi - x > 0 && { value: b.yi - x, why: `Giving up one ${b.X.s} does not free exactly one ${b.Y.s}; the trade-off is the price ratio.` },
              { value: (b.I - b.px * x) / b.px, why: `Divide the leftover by the price of ${b.Y.p}, not of ${b.X.p}.` },
            ]),
            sol: steps("On the budget line, P<sub>X</sub> × Q<sub>X</sub> + P<sub>Y</sub> × Q<sub>Y</sub> = income. Solve for Q<sub>Y</sub>.",
              `Spending on ${b.X.p}: ${$(b.px)} × ${x} = ${$(b.px * x)}, leaving ${$(b.I)} − ${$(b.px * x)} = ${$(b.I - b.px * x)}.`,
              `${$(b.I - b.px * x)} ÷ ${$(b.py)} = <b>${qty(ans, b.Y)}</b>.`),
          });
        },
      },
      {
        name: "Read the budget-line graph: income or a price",
        make() {
          const b = budget();
          const g = blPlot(b.X, b.Y, [{ xi: b.xi, yi: b.yi, label: "Budget line" }],
            { points: [{ x: 0, y: b.yi, label: String(b.yi) }, { x: b.xi, y: 0, label: String(b.xi) }] });
          const askI = Math.random() < 0.5;
          if (askI) {
            const useX = Math.random() < 0.5;
            const ans = b.I;
            return Q.num({
              q: `The graph shows ${b.who.n}'s budget line (intercepts labelled).${g}The price of ${useX ? an(b.X) : an(b.Y)} is ${$(useX ? b.px : b.py)}. What is ${b.who.his} income?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: useX ? b.px * b.yi : b.py * b.xi, why: "That multiplies the price by the <em>other</em> good's intercept. Use the intercept of the good whose price you know." },
                { value: useX ? b.xi : b.yi, why: "That is a quantity (the intercept), not dollars." },
                { value: useX ? b.xi / b.px : b.yi / b.py, why: "Income = intercept × price, not intercept ÷ price." },
              ]),
              sol: steps("At an intercept all income is spent on one good, so intercept = income ÷ price, which means income = intercept × price.",
                useX ? `${U.fmt(b.xi)} ${b.X.p} × ${$(b.px)} = <b>${$(ans)}</b>.` : `${U.fmt(b.yi)} ${b.Y.p} × ${$(b.py)} = <b>${$(ans)}</b>.`),
            });
          }
          const ans = b.py;
          return Q.num({
            q: `The graph shows ${b.who.n}'s budget line (intercepts labelled). ${cap(b.who.his)} income is ${$(b.I)}.${g}What is the price of ${an(b.Y)}?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: b.px, why: `${$(b.I)} ÷ ${U.fmt(b.xi)} is the price of ${an(b.X)}, from the horizontal intercept.` },
              { value: b.yi / b.I, why: "Price = income ÷ intercept, not intercept ÷ income." },
              { value: b.yi, why: "That is the quantity at the intercept, not a price." },
            ]),
            sol: steps(`The ${b.Y.p} intercept shows the most ${b.Y.p} the income buys: intercept = income ÷ P<sub>Y</sub>.`,
              `P<sub>Y</sub> = income ÷ intercept = ${$(b.I)} ÷ ${U.fmt(b.yi)} = <b>${$(ans)}</b>.`),
          });
        },
      },
      {
        name: "Select all true statements about this budget",
        make() {
          const b = budget();
          let x, y;
          do { x = U.randInt(1, b.xi); y = U.randInt(1, b.yi); } while (b.px * x + b.py * y === b.I);
          const c = b.px * x + b.py * y;
          const opts = [
            Math.random() < 0.5 ? { t: `The most ${b.X.p} ${b.who.he} can buy is ${U.fmt(b.xi)}.`, ok: true }
              : { t: `The most ${b.X.p} ${b.who.he} can buy is ${U.fmt(b.I / b.py)}.`, ok: false, why: `That divides by the price of ${b.Y.p}. The most ${b.X.p} is ${$(b.I)} ÷ ${$(b.px)} = ${U.fmt(b.xi)}.` },
            Math.random() < 0.5 ? { t: `The relative price of ${an(b.X)} is ${U.frac(b.px, b.py)} ${b.px === b.py ? b.Y.s : b.Y.p}.`, ok: true }
              : { t: `The relative price of ${an(b.X)} is ${U.frac(b.py, b.px)} ${b.Y.p}.`, ok: false, why: `Upside down: it is P<sub>X</sub>/P<sub>Y</sub> = ${U.frac(b.px, b.py)}.` },
            c < b.I ? { t: `${cap(qty(x, b.X))} and ${qty(y, b.Y)} is affordable.`, ok: true, why: `It costs ${$(c)}, less than ${$(b.I)}.` }
              : { t: `${cap(qty(x, b.X))} and ${qty(y, b.Y)} is affordable.`, ok: false, why: `It costs ${$(c)}, more than ${$(b.I)}.` },
            Math.random() < 0.5 ? { t: `${cap(b.who.his)} real income measured in ${b.Y.p} is ${U.fmt(b.yi)}.`, ok: true }
              : { t: `${cap(b.who.his)} real income measured in ${b.Y.p} is ${U.fmt(b.I)}.`, ok: false, why: `${$(b.I)} is money income. Real income in ${b.Y.p} is ${$(b.I)} ÷ ${$(b.py)} = ${U.fmt(b.yi)}.` },
            Math.random() < 0.5 ? { t: `If ${b.who.his} income doubled, the budget line would shift out parallel to the old one.`, ok: true }
              : { t: `If the price of ${b.Y.p} rose, the most ${b.X.p} ${b.who.he} could buy would fall.`, ok: false, why: `The ${b.X.p} intercept is income ÷ P<sub>X</sub>; it does not depend on the price of ${b.Y.p}.` },
          ];
          if (b.px === b.py) opts.splice(1, 1);
          if (!opts.some(o => o.ok)) opts[0] = { t: `The most ${b.X.p} ${b.who.he} can buy is ${U.fmt(b.xi)}.`, ok: true };
          return Q.multi({
            q: `${b.who.n} has ${$(b.I)} for ${b.X.p} (${$(b.px)} each) and ${b.Y.p} (${$(b.py)} each). Select <b>all</b> true statements.`,
            options: opts,
            sol: steps(`Intercepts: ${$(b.I)} ÷ ${$(b.px)} = ${U.fmt(b.xi)} ${b.X.p}; ${$(b.I)} ÷ ${$(b.py)} = ${U.fmt(b.yi)} ${b.Y.p}. These are also real income in each good.`,
              `Relative price of ${an(b.X)} = P<sub>X</sub>/P<sub>Y</sub> = ${U.frac(b.px, b.py)}. Bundle ${x}, ${y} costs ${$(c)}${c < b.I ? ", which is affordable" : ", which is not affordable"}.`,
              "Income changes shift the line in parallel; a price change moves only that good's intercept."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Budget line shifts and rotations
   * ============================================================ */
  const SHIFT_CATS = ["Parallel shift outward", "Parallel shift inward", "Rotation (slope changes)"];
  const SHIFT_BANK = [
    (X, Y) => ({ t: "The shopper gets a raise at work; prices are unchanged.", cat: SHIFT_CATS[0], why: "More income moves both intercepts out; the price ratio is unchanged." }),
    (X, Y) => ({ t: "The shopper\u2019s monthly allowance goes up by $50.", cat: SHIFT_CATS[0], why: "Higher income, same prices: parallel shift outward." }),
    (X, Y) => ({ t: `The prices of both ${X.p} and ${Y.p} fall by 20%; income is unchanged.`, cat: SHIFT_CATS[0], why: "Both intercepts rise by the same proportion and the relative price is unchanged, so it is a parallel shift out, just like a rise in income." }),
    (X, Y) => ({ t: "The shopper starts receiving a monthly scholarship stipend that adds to spending money.", cat: SHIFT_CATS[0], why: "More income at the same prices." }),
    (X, Y) => ({ t: "The shopper\u2019s hours at work are cut, so monthly pay falls; prices are unchanged.", cat: SHIFT_CATS[1], why: "Less income moves both intercepts in proportionally." }),
    (X, Y) => ({ t: `The prices of both ${X.p} and ${Y.p} rise by 10%; income is unchanged.`, cat: SHIFT_CATS[1], why: "Both intercepts shrink by the same proportion, and the relative price is unchanged." }),
    (X, Y) => ({ t: "A new monthly phone bill leaves the shopper less money for these two goods.", cat: SHIFT_CATS[1], why: "Less income available for X and Y, same prices: parallel shift inward." }),
    (X, Y) => ({ t: `A sale cuts the price of ${X.p}; the price of ${Y.p} and income are unchanged.`, cat: SHIFT_CATS[2], why: `Only the ${X.p} intercept moves out; the line rotates and becomes flatter.` }),
    (X, Y) => ({ t: `The price of ${Y.p} rises; everything else is unchanged.`, cat: SHIFT_CATS[2], why: `Only the ${Y.p} intercept moves in; the slope changes.` }),
    (X, Y) => ({ t: `A new tax raises the price of ${X.p} only.`, cat: SHIFT_CATS[2], why: `Only the ${X.p} intercept moves in, so the line rotates.` }),
    (X, Y) => ({ t: `A coupon lowers the price of ${Y.p}; income is unchanged.`, cat: SHIFT_CATS[2], why: `Only the ${Y.p} intercept moves out: a rotation.` }),
    (X, Y) => ({ t: `The shopper\u2019s income doubles and so does the price of ${X.p}.`, cat: SHIFT_CATS[2], why: `The ${X.p} intercept (income ÷ P<sub>X</sub>) is unchanged, but the ${Y.p} intercept doubles: the line rotates outward around the ${X.p} intercept.` }),
  ];
  const BL_DESC = {
    out: "Parallel shift outward (both intercepts move out, slope unchanged)",
    in: "Parallel shift inward (both intercepts move in, slope unchanged)",
    xOut: "The horizontal intercept moves out, the vertical one stays put: the line becomes flatter",
    xIn: "The horizontal intercept moves in, the vertical one stays put: the line becomes steeper",
    yOut: "The vertical intercept moves out, the horizontal one stays put: the line becomes steeper",
    yIn: "The vertical intercept moves in, the horizontal one stays put: the line becomes flatter",
    none: "The budget line does not move",
  };
  const BL_WHY = {
    out: "That happens when income rises (or all prices fall by the same %).",
    in: "That happens when income falls (or all prices rise by the same %).",
    xOut: "That is what a fall in the price of the horizontal-axis good does.",
    xIn: "That is what a rise in the price of the horizontal-axis good does.",
    yOut: "That is what a fall in the price of the vertical-axis good does.",
    yIn: "That is what a rise in the price of the vertical-axis good does.",
    none: "The line stays put only if income and all prices change in the same proportion.",
  };
  const genShift = STUDY.makeGenerator({
    id: "b251-m8-bshift",
    name: "Budget line shifts & rotations",
    blurb: "Tell a parallel shift (income) from a rotation (one price), read changes off a graph, and compute the new intercepts and slope.",
    variants: [
      {
        name: "Classify events: shift or rotation?",
        make() {
          const [X, Y] = two();
          const bank = SHIFT_BANK.map(f => f(X, Y));
          const items = SHIFT_CATS.map(c => U.pick(bank.filter(i => i.cat === c)));
          for (const e of U.shuffle(bank)) if (items.length < 5 && !items.includes(e)) items.push(e);
          return Q.classify({
            q: `A shopper buys only ${X.p} (horizontal axis) and ${Y.p} (vertical axis). How does each event move the budget line?`,
            cats: SHIFT_CATS, items,
            sol: steps("Ask whether the <em>relative price</em> P<sub>X</sub>/P<sub>Y</sub> changes. If not, the slope is unchanged and the line shifts in parallel; if so, it rotates.",
              "Income changes, and equal-percentage changes in both prices, are parallel shifts. A change in just one price (or one price changing in step with income) rotates the line."),
          });
        },
      },
      {
        name: "What caused this change? (graph)",
        make() {
          const b = budget();
          const type = U.pick(["incUp", "incDown", "pxDown", "pxUp", "pyDown", "pyUp"]);
          const f = U.pick([1.5, 2]);
          const n = { incUp: [b.xi * f, b.yi * f], incDown: [b.xi / f, b.yi / f], pxDown: [b.xi * f, b.yi], pxUp: [b.xi / f, b.yi], pyDown: [b.xi, b.yi * f], pyUp: [b.xi, b.yi / f] }[type];
          const g = blPlot(b.X, b.Y, [{ xi: b.xi, yi: b.yi, label: "BL₁" }, { xi: n[0], yi: n[1], style: "alt", label: "BL₂" }], { aria: "two budget lines" });
          const opts = {
            incUp: "Income rose, with prices unchanged",
            incDown: "Income fell, with prices unchanged",
            pxDown: `The price of ${b.X.p} fell`,
            pxUp: `The price of ${b.X.p} rose`,
            pyDown: `The price of ${b.Y.p} fell`,
            pyUp: `The price of ${b.Y.p} rose`,
          };
          const whyW = {
            incUp: "That would move both intercepts out in parallel.",
            incDown: "That would move both intercepts in.",
            pxDown: `That would move only the ${b.X.p} intercept, outward.`,
            pxUp: `That would move only the ${b.X.p} intercept, inward.`,
            pyDown: `That would move only the ${b.Y.p} intercept, upward.`,
            pyUp: `That would move only the ${b.Y.p} intercept, downward.`,
          };
          const near = { incUp: ["pxDown", "pyDown"], incDown: ["pxUp", "pyUp"], pxDown: ["pyDown", "pxUp"], pxUp: ["pyUp", "pxDown"], pyDown: ["pxDown", "pyUp"], pyUp: ["pxUp", "pyDown"] }[type];
          const rest = U.shuffle(Object.keys(opts).filter(k => k !== type && !near.includes(k)));
          const wrong = near.concat(rest.slice(0, 1)).map(k => ({ t: opts[k], why: whyW[k] }));
          const which = type.startsWith("inc") ? "Both intercepts moved by the same proportion and the lines are parallel, so the relative price is unchanged: an income change."
            : `Only the ${type.startsWith("px") ? b.X.p : b.Y.p} intercept moved (intercept = income ÷ price), so that good's price changed: it ${type.endsWith("Down") ? "fell" : "rose"}.`;
          return Q.mc({
            q: `${b.who.n}'s budget line moves from BL₁ to BL₂.${g}What caused the change?`,
            right: opts[type], wrong,
            sol: steps("Look at each intercept: it is income ÷ that good's price. Which intercepts moved, and in which direction?", which),
          });
        },
      },
      {
        name: "New intercept after a change",
        make() {
          const b = budget();
          const kind = U.pick(["pxNew", "pxOther", "inc"]);
          if (kind === "inc") {
            const I2 = b.I + U.pick([1, 2, 3]) * lcm(b.px, b.py) * U.pick([1, -1]);
            if (I2 < 2 * lcm(b.px, b.py) || I2 === b.I) return this.make();
            const askX = Math.random() < 0.5, p = askX ? b.px : b.py, Gd = askX ? b.X : b.Y;
            const ans = I2 / p;
            return Q.num({
              q: `${b.who.n} buys ${b.X.p} (${$(b.px)}) and ${b.Y.p} (${$(b.py)}). ${cap(b.who.his)} monthly income changes from ${$(b.I)} to ${$(I2)}, with prices unchanged. What is the new maximum number of <b>${Gd.p}</b> ${b.who.he} can buy?`,
              answer: ans, unit: Gd.p, kind: "count",
              traps: traps(ans, [
                { value: b.I / p, why: "That is the old intercept, at the old income." },
                { value: Math.abs(I2 - b.I) / p, why: "That is the <em>change</em> in the intercept, not its new value." },
                { value: I2 / (askX ? b.py : b.px), why: "That divides by the other good's price." },
              ]),
              sol: steps("An income change moves both intercepts: each is income ÷ that good's price.",
                `New intercept = ${$(I2)} ÷ ${$(p)} = <b>${qty(ans, Gd)}</b> (it was ${U.fmt(b.I / p)}). The slope, −${U.frac(b.px, b.py)}, is unchanged: a parallel shift.`),
            });
          }
          let p2;
          do { p2 = U.pick(PRICES); } while (p2 === b.px || b.I % p2 || b.I / p2 < 2);
          const ans = kind === "pxNew" ? b.I / p2 : b.yi;
          return Q.num({
            q: `${b.who.n} has ${$(b.I)} for ${b.X.p} and ${b.Y.p}. The price of ${b.Y.p} is ${$(b.py)}. The price of ${an(b.X)} ${p2 < b.px ? "falls" : "rises"} from ${$(b.px)} to ${$(p2)}. After the change, what is the maximum number of <b>${kind === "pxNew" ? b.X.p : b.Y.p}</b> ${b.who.he} can buy?`,
            answer: ans, unit: kind === "pxNew" ? b.X.p : b.Y.p, kind: "count",
            traps: traps(ans, kind === "pxNew" ? [
              { value: b.xi, why: "That is the old intercept, at the old price." },
              { value: b.yi, why: `That is the ${b.Y.p} intercept.` },
              { value: Math.abs(b.I / p2 - b.xi), why: "That is the change in the intercept, not the new value." },
            ] : [
              { value: b.I / p2, why: `That is the new ${b.X.p} intercept. The ${b.Y.p} intercept does not depend on the price of ${b.X.p}.` },
              { value: b.xi, why: `That is the old ${b.X.p} intercept.` },
              { value: Math.round(b.yi * b.px / p2), why: `The ${b.Y.p} intercept does not change when only the price of ${b.X.p} changes.` },
            ]),
            sol: steps(`Each intercept is income ÷ that good's own price. Only the price of ${b.X.p} changed.`,
              kind === "pxNew" ? `New ${b.X.p} intercept = ${$(b.I)} ÷ ${$(p2)} = <b>${qty(ans, b.X)}</b> (was ${U.fmt(b.xi)}). The ${b.Y.p} intercept stays at ${U.fmt(b.yi)}, so the line rotates.`
                : `The ${b.Y.p} intercept is ${$(b.I)} ÷ ${$(b.py)} = <b>${qty(ans, b.Y)}</b>, unchanged: if ${b.who.he} buys only ${b.Y.p}, the price of ${b.X.p} does not matter. The line rotates around this point.`),
          });
        },
      },
      {
        name: "Predict the rotation: flatter or steeper?",
        make() {
          const [X, Y] = two();
          const ev = U.pick(["pxDown", "pxUp", "pyDown", "pyUp", "incUp", "incDown"]);
          const key = { pxDown: "xOut", pxUp: "xIn", pyDown: "yOut", pyUp: "yIn", incUp: "out", incDown: "in" }[ev];
          const text = {
            pxDown: `the price of ${X.p} falls`, pxUp: `the price of ${X.p} rises`, pyDown: `the price of ${Y.p} falls`,
            pyUp: `the price of ${Y.p} rises`, incUp: "income rises", incDown: "income falls",
          }[ev];
          const pool = ["out", "in", "xOut", "xIn", "yOut", "yIn"].filter(k => k !== key);
          const near = { xOut: ["yOut", "xIn", "out"], xIn: ["yIn", "xOut", "in"], yOut: ["xOut", "yIn", "out"], yIn: ["xIn", "yOut", "in"], out: ["xOut", "yOut", "in"], in: ["xIn", "yIn", "out"] }[key];
          void pool;
          return Q.mc({
            q: `${X.p.charAt(0).toUpperCase() + X.p.slice(1)} are on the horizontal axis and ${Y.p} on the vertical axis. If ${text}, with everything else unchanged, how does the budget line change?`,
            right: BL_DESC[key],
            wrong: near.map(k => ({ t: BL_DESC[k], why: BL_WHY[k] })),
            sol: steps("Intercept = income ÷ that good's price; |slope| = P<sub>X</sub>/P<sub>Y</sub> (horizontal good's price on top).",
              ev.startsWith("inc") ? "Income moves both intercepts in proportion and leaves P<sub>X</sub>/P<sub>Y</sub> alone: a parallel shift."
                : ev.startsWith("px") ? `Only the ${X.p} intercept moves (${ev === "pxDown" ? "out" : "in"}). P<sub>X</sub>/P<sub>Y</sub> ${ev === "pxDown" ? "falls, so the line gets flatter" : "rises, so the line gets steeper"}.`
                  : `Only the ${Y.p} intercept moves (${ev === "pyDown" ? "up" : "down"}). P<sub>X</sub>/P<sub>Y</sub> ${ev === "pyDown" ? "rises (smaller denominator), so the line gets steeper" : "falls, so the line gets flatter"}.`),
          });
        },
      },
      {
        name: "Edge case: income and prices change together",
        make() {
          const b = budget();
          const sc = U.pick([
            { t: "income doubles and both prices double", key: "none", n: [b.xi, b.yi] },
            { t: "income rises by 25% and both prices rise by 25%", key: "none", n: [b.xi, b.yi] },
            { t: "both prices fall by half while income stays the same", key: "out", n: [b.xi * 2, b.yi * 2] },
            { t: "both prices rise by 50% while income stays the same", key: "in", n: [b.xi / 1.5, b.yi / 1.5] },
            { t: `income doubles and the price of ${b.X.p} doubles`, key: "yOut", n: [b.xi, b.yi * 2] },
            { t: `income doubles and the price of ${b.Y.p} doubles`, key: "xOut", n: [b.xi * 2, b.yi] },
            { t: `income halves and the price of ${b.X.p} halves`, key: "yIn", n: [b.xi, b.yi / 2] },
          ]);
          const all = ["none", "out", "in", "xOut", "yOut", "xIn", "yIn"].filter(k => k !== sc.key);
          const wrong = U.sample(all, 3).map(k => ({ t: BL_DESC[k], why: BL_WHY[k] }));
          return Q.mc({
            q: `${b.who.n} has ${$(b.I)} for ${b.X.p} (${$(b.px)}, horizontal axis) and ${b.Y.p} (${$(b.py)}, vertical axis). Suppose ${sc.t}. What happens to ${b.who.his} budget line?`,
            right: BL_DESC[sc.key], wrong,
            sol: steps("Recompute both intercepts (income ÷ price) with the new numbers, and compare.",
              `Before: ${U.fmt(b.xi)} ${b.X.p} and ${U.fmt(b.yi)} ${b.Y.p}. After: ${U.fmt(U.round(sc.n[0], 2))} ${b.X.p} and ${U.fmt(U.round(sc.n[1], 2))} ${b.Y.p}.`,
              sc.key === "none" ? "Nothing changes: when income and all prices move in the same proportion, real income and relative prices are the same."
                : sc.key === "out" || sc.key === "in" ? "Both intercepts change by the same factor and the price ratio is unchanged: a parallel shift."
                  : "One intercept is unchanged and the other moves, so the line rotates around the fixed intercept."),
          });
        },
      },
      {
        name: "Relative price after a price change",
        make() {
          const b = budget();
          const changeX = Math.random() < 0.5;
          let p2;
          do { p2 = U.pick(PRICES); } while (p2 === (changeX ? b.px : b.py) || p2 === (changeX ? b.py : b.px));
          const px2 = changeX ? p2 : b.px, py2 = changeX ? b.py : p2;
          const ans = px2 / py2;
          return Q.num({
            q: `${b.who.n} buys ${b.X.p} (${$(b.px)}) and ${b.Y.p} (${$(b.py)}), with ${b.X.p} on the horizontal axis. The price of ${changeX ? b.X.p : b.Y.p} changes to ${$(p2)}. What is the size (absolute value) of the <b>new slope</b> of the budget line, in ${b.Y.p} per ${b.X.s}?`,
            answer: ans, unit: `${b.Y.p} per ${b.X.s}`,
            traps: traps(ans, [
              { value: b.px / b.py, why: "That is the old slope, before the price change." },
              { value: py2 / px2, why: "Upside down: the slope is P<sub>X</sub>/P<sub>Y</sub>, horizontal good's price on top." },
              { value: Math.abs(px2 - py2), why: "The slope is a ratio of prices, not a difference." },
            ]),
            sol: steps("The slope of the budget line is −P<sub>X</sub>/P<sub>Y</sub>, so only the new prices matter (income does not affect the slope).",
              `New slope size = ${$(px2)} ÷ ${$(py2)} = <b>${U.frac(px2, py2)}${px2 % py2 ? ` ≈ ${d2(ans)}` : ""}</b> (it was ${U.frac(b.px, b.py)}). The line ${ans > b.px / b.py ? "got steeper" : "got flatter"}.`),
          });
        },
      },
      {
        name: "Change in real income",
        make() {
          const b = budget();
          const changeY = Math.random() < 0.5;
          const G1 = changeY ? b.Y : b.X, p1 = changeY ? b.py : b.px;
          let p2;
          do { p2 = U.pick(PRICES); } while (p2 === p1 || b.I % p2 || b.I / p2 < 2);
          const ans = Math.abs(b.I / p1 - b.I / p2);
          const up = p2 < p1;
          return Q.num({
            q: `${b.who.n}'s money income is ${$(b.I)} a month. The price of ${an(G1)} ${up ? "falls" : "rises"} from ${$(p1)} to ${$(p2)}. By how many ${G1.p} does ${b.who.his} <b>real income measured in ${G1.p}</b> ${up ? "rise" : "fall"}?`,
            answer: ans, unit: G1.p, kind: "count",
            traps: traps(ans, [
              { value: b.I / p2, why: "That is the new real income, not the change." },
              { value: Math.abs(p1 - p2), why: "That is the change in price, in dollars." },
              { value: b.I / p1, why: "That is the old real income." },
            ]),
            sol: steps(`Real income in ${G1.p} = money income ÷ price of ${an(G1)}: the ${G1.p} intercept.`,
              `Before: ${$(b.I)} ÷ ${$(p1)} = ${U.fmt(b.I / p1)}. After: ${$(b.I)} ÷ ${$(p2)} = ${U.fmt(b.I / p2)}.`,
              `Change: <b>${U.fmt(ans)} ${pl(ans, G1)}</b>. Money income did not change, but its purchasing power did; this is the real-income effect of a price change.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Total and marginal utility
   * ============================================================ */
  /* MU schedule: strictly decreasing; if neg, the last unit(s) have negative MU (never exactly 0). */
  function muSchedule(n, neg) {
    for (;;) {
      const mu = [U.randInt(14, 40)];
      for (let i = 1; i < n; i++) mu.push(mu[i - 1] - U.randInt(2, 9));
      if (mu.includes(0)) continue;
      const negs = mu.filter(m => m < 0).length;
      if (neg ? (negs >= 1 && negs <= 2) : negs === 0) return mu;
    }
  }
  const tuRows = mu => Array.from({ length: mu.length + 1 }, (_, i) => sum(mu, i));
  const UTIL_TF = [
    { t: "Marginal utility is the change in total utility from consuming one more unit.", ok: true },
    { t: "Total utility can keep rising while marginal utility falls.", ok: true, why: "As long as MU is positive, each unit still adds to TU." },
    { t: "When marginal utility is negative, total utility falls.", ok: true },
    { t: "Total utility is at its maximum where marginal utility reaches zero.", ok: true },
    { t: "Diminishing marginal utility means each extra unit adds less satisfaction than the one before.", ok: true },
    { t: "The total utility of n units equals the sum of the marginal utilities of units 1 through n.", ok: true },
    { t: "Utility is the benefit or satisfaction from consuming a good, and it depends on a person's preferences.", ok: true },
    { t: "Diminishing marginal utility means total utility falls as you consume more.", ok: false, why: "MU falls, but TU still rises while MU is positive." },
    { t: "Marginal utility is total utility divided by the number of units consumed.", ok: false, why: "That is average utility. MU is the change in TU from one more unit." },
    { t: "If marginal utility falls, total utility must also fall.", ok: false, why: "TU falls only when MU is negative." },
    { t: "Marginal utility can never be negative.", ok: false, why: "Too much of a good thing can make you worse off: MU below zero, so TU falls." },
    { t: "Total utility is largest at the first unit, because the first unit has the highest marginal utility.", ok: false, why: "TU keeps growing as long as MU is positive; it peaks where MU reaches zero." },
    { t: "Two people with the same income must get the same utility from a good.", ok: false, why: "Utility depends on preferences, which differ from person to person." },
  ];
  const genUtil = STUDY.makeGenerator({
    id: "b251-m8-utility",
    name: "Total & marginal utility",
    blurb: "Compute marginal utility from total utility and back, spot diminishing marginal utility, and find where total utility peaks.",
    variants: [
      {
        name: "Marginal utility from a TU table",
        make() {
          const [X] = two(); const w = person();
          const mu = muSchedule(5, false), tu = tuRows(mu);
          const k = U.randInt(2, 5);
          const ans = mu[k - 1];
          return Q.num({
            q: `${w.n}'s total utility from ${X.p} in a week:${tbl([`${cap(X.p)}`, "Total utility (utils)"], tu.map((t, i) => [i, t]))}What is the <b>marginal utility</b> of the ${ord(k)} ${X.s}?`,
            answer: ans, unit: "utils",
            traps: traps(ans, [
              { value: tu[k], why: `That is the total utility of ${k} ${X.p}. Marginal utility is the <em>change</em> caused by the ${ord(k)} one.` },
              { value: tu[k] / k, why: "That is average utility (TU ÷ Q), not marginal utility." },
              { value: k < 5 ? mu[k] : mu[k - 2], why: "That is the marginal utility of a neighbouring unit. Use the rows just before and at this unit." },
            ]),
            sol: steps("MU of the n-th unit = TU(n) − TU(n − 1).",
              `TU(${k}) − TU(${k - 1}) = ${tu[k]} − ${tu[k - 1]} = <b>${ans} utils</b>.`),
          });
        },
      },
      {
        name: "Total utility from marginal utilities",
        make() {
          const [X] = two(); const w = person();
          const mu = muSchedule(5, false);
          const k = U.randInt(3, 5);
          const ans = sum(mu, k);
          return Q.num({
            q: `The marginal utility ${w.n} gets from each ${X.s} in a week is:${tbl([`${cap(X.s)} number`, "Marginal utility (utils)"], mu.map((m, i) => [ord(i + 1), m]))}What is ${w.his} <b>total utility</b> from ${k} ${X.p}?`,
            answer: ans, unit: "utils",
            traps: traps(ans, [
              { value: mu[k - 1], why: `That is only the marginal utility of the ${ord(k)} ${X.s}.` },
              { value: k * mu[k - 1], why: `That assumes every ${X.s} gives as much as the ${ord(k)}. Earlier ones gave more.` },
              { value: sum(mu, k - 1), why: `That stops one ${X.s} short.` },
            ]),
            sol: steps("Total utility is the running sum of the marginal utilities.",
              `${mu.slice(0, k).join(" + ")} = <b>${ans} utils</b>.`),
          });
        },
      },
      {
        name: "Missing entry in a utility table",
        make() {
          const [X] = two(); const w = person();
          const mu = muSchedule(5, false), tu = tuRows(mu);
          const k = U.randInt(1, 4);
          const fromAbove = Math.random() < 0.5;
          // fromAbove: hide TU(k) and MU(k), so work back from TU(k+1) − MU(k+1). Otherwise use TU(k−1) + MU(k).
          const rows = tu.map((t, i) => [i, i === k ? "?" : t, i === 0 ? "—" : mu[i - 1]]);
          if (fromAbove) rows[k][2] = "?";
          const ans = tu[k];
          return Q.num({
            q: `${w.n}'s utility from ${X.p} (some entries are missing):${tbl([cap(X.p), "Total utility", "Marginal utility"], rows)}What is the total utility of <b>${qty(k, X)}</b>?`,
            answer: ans, unit: "utils",
            traps: traps(ans, fromAbove ? [
              { value: tu[k + 1] + mu[k], why: "Moving back down the table you subtract the next unit's MU, not add it." },
              { value: tu[k + 1], why: `That is the total utility of ${k + 1}.` },
              { value: mu[k], why: "That is a marginal utility, not a total." },
            ] : [
              { value: mu[k - 1], why: "That is the marginal utility of this unit, not the total." },
              { value: tu[k - 1] - mu[k - 1], why: "Positive MU adds to TU, so add it." },
              { value: tu[k - 1], why: "That is the total one unit earlier." },
            ]),
            sol: steps("TU(n) = TU(n − 1) + MU(n). The relationship works in both directions.",
              fromAbove ? `Work back from the next row: TU(${k}) = TU(${k + 1}) − MU(${k + 1}) = ${tu[k + 1]} − ${mu[k]} = <b>${ans}</b>.`
                : `TU(${k}) = TU(${k - 1}) + MU(${k}) = ${tu[k - 1]} + ${mu[k - 1]} = <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Where is total utility largest?",
        make() {
          const [X] = two(); const w = person();
          const mu = muSchedule(U.randInt(5, 6), true);
          const ans = mu.filter(m => m > 0).length;
          return Q.num({
            q: `The marginal utility ${w.n} gets from each ${X.s} in one day:${tbl([`${cap(X.s)} number`, "Marginal utility (utils)"], mu.map((m, i) => [ord(i + 1), m < 0 ? "−" + Math.abs(m) : m]))}If ${X.p} were free, how many would ${w.he} consume to make ${w.his} <b>total utility</b> as large as possible?`,
            answer: ans, unit: X.p, kind: "count",
            traps: traps(ans, [
              { value: 1, why: "The 1st unit has the highest MU, but every unit with positive MU still adds to TU." },
              { value: ans + 1, why: `The ${ord(ans + 1)} ${X.s} has negative MU, so it lowers total utility.` },
              { value: mu.length, why: "Units with negative MU reduce total utility." },
            ]),
            sol: steps("TU rises with every unit whose MU is positive and falls with every unit whose MU is negative.",
              `MU is positive through the ${ord(ans)} ${X.s} and negative from the ${ord(ans + 1)}. So TU peaks at <b>${qty(ans, X)}</b> (TU = ${sum(mu, ans)} utils), where MU passes through zero.`),
          });
        },
      },
      {
        name: "Spot diminishing marginal utility",
        make() {
          const [X] = two();
          const a = U.randInt(12, 20);
          const dim = [a]; for (let i = 1; i < 4; i++) dim.push(dim[i - 1] - U.randInt(2, 3));
          const c = U.randInt(6, 12);
          const inc = [U.randInt(4, 8)]; for (let i = 1; i < 4; i++) inc.push(inc[i - 1] + U.randInt(2, 4));
          const hump = [U.randInt(6, 10)]; hump.push(hump[0] + U.randInt(3, 6)); hump.push(hump[1] - U.randInt(3, 6)); hump.push(hump[2] - U.randInt(1, 2));
          const show = mu => tuRows(mu).slice(1).join(", ");
          return Q.mc({
            q: `Each row lists a person's <b>total</b> utility from 1, 2, 3 and 4 ${X.p}. Which one shows diminishing marginal utility from the very first unit?`,
            right: `TU: ${show(dim)}`,
            wrong: [
              { t: `TU: ${show([c, c, c, c])}`, why: `MU is ${c} every time: constant, not diminishing.` },
              { t: `TU: ${show(inc)}`, why: `MU is ${inc.join(", ")}: increasing.` },
              { t: `TU: ${show(hump)}`, why: `MU is ${hump.join(", ")}: it rises before it falls.` },
            ],
            rightWhy: `MU is ${dim.join(", ")}: each unit adds less than the one before.`,
            sol: steps("Total utility rises in all four rows, so look at how much it rises each time: that is the MU.",
              `Differences for the right answer: ${dim.join(", ")}, getting smaller each time. Diminishing MU is about the <em>increments</em> shrinking, not about TU falling.`),
          });
        },
      },
      {
        name: "Negative marginal utility: predict total utility",
        make() {
          const [X] = two(); const w = person();
          const t0 = U.randInt(40, 90), m = U.randInt(2, 9);
          const n = U.randInt(4, 7);
          return Q.mc({
            q: `${w.n} has already had ${n - 1} ${X.p} today and has ${t0} utils of total utility. The ${ord(n)} ${X.s} has a marginal utility of <b>−${m} utils</b>. What happens if ${w.he} has it?`,
            right: `Total utility falls to ${t0 - m} utils`,
            wrong: [
              { t: `Total utility rises to ${t0 + m} utils, because ${w.he} consumed more`, why: "Consuming more raises TU only when MU is positive." },
              { t: `Total utility becomes −${m} utils`, why: "MU is the change in TU, not its new level." },
              { t: `Total utility stays at ${t0} utils, because utility cannot fall`, why: "TU falls when MU is negative: too much of a good thing." },
            ],
            sol: steps("MU is the <em>change</em> in total utility from one more unit.",
              `${t0} + (−${m}) = <b>${t0 - m} utils</b>. ${cap(w.his)} TU peaked at ${n - 1} ${X.p}, where MU crossed zero.`),
          });
        },
      },
      {
        name: "Select all true statements about utility",
        make() {
          const opts = U.sample(UTIL_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(UTIL_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("Total utility is the running sum of marginal utilities; MU = ΔTU ÷ ΔQ.",
              "MU falling does not mean TU falling. TU rises while MU &gt; 0, peaks where MU = 0, and falls when MU &lt; 0."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Marginal utility per dollar
   * ============================================================ */
  const MUP_TF = [
    { t: "Marginal utility per dollar is a good's marginal utility divided by its price.", ok: true },
    { t: "When prices differ, the better buy is the unit with the higher MU per dollar, not necessarily the higher MU.", ok: true },
    { t: "A good with a high marginal utility can still be a poor buy if its price is high.", ok: true },
    { t: "Because of diminishing marginal utility, a good's MU per dollar falls as you buy more of it (at a given price).", ok: true },
    { t: "Spending each dollar where it brings the most marginal utility leads toward the consumer optimum.", ok: true },
    { t: "The cheaper good always gives more utility per dollar.", ok: false, why: "A cheap good with tiny MU can give less per dollar than a pricey one." },
    { t: "The good with the higher marginal utility is always the better buy.", ok: false, why: "Divide by the price first: MU per dollar decides." },
    { t: "MU per dollar is the price divided by marginal utility.", ok: false, why: "Upside down: it is MU ÷ P." },
    { t: "MU per dollar uses total utility divided by price.", ok: false, why: "Decisions are made at the margin: use marginal utility." },
    { t: "A good's MU per dollar rises as you buy more of it.", ok: false, why: "MU diminishes, so MU per dollar falls as quantity rises." },
  ];
  /* Two goods' next-unit MUs and prices with distinct whole-number MU/P values. */
  function nextUnits(forceTrap) {
    for (;;) {
      const [X, Y] = two();
      const [px, py] = U.sample([2, 3, 4, 5, 6, 8, 10, 12], 2);
      const [vx, vy] = U.sample([3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2);
      const mx = vx * px, my = vy * py;
      if (mx === my) continue;
      const trap = (mx > my) !== (vx > vy);
      if (forceTrap && !trap) continue;
      return { X, Y, px, py, vx, vy, mx, my };
    }
  }
  const genMup = STUDY.makeGenerator({
    id: "b251-m8-mup",
    name: "Marginal utility per dollar",
    blurb: "Compute MU ÷ P, decide which good gives more utility per dollar, and work backward from MU per dollar to prices and utilities.",
    variants: [
      {
        name: "Compute MU per dollar from a TU table",
        make() {
          const [X] = two(); const w = person();
          const p = U.pick([2, 3, 4, 5, 6, 8]);
          const v = [U.randInt(9, 15)]; for (let i = 1; i < 5; i++) v.push(v[i - 1] - U.randInt(1, 3));
          if (v[4] < 1) return this.make();
          const mu = v.map(x => x * p), tu = tuRows(mu);
          const k = U.randInt(2, 5), ans = v[k - 1];
          return Q.num({
            q: `${cap(X.p)} cost ${$(p)} each. ${w.n}'s total utility:${tbl([cap(X.p), "Total utility"], tu.map((t, i) => [i, t]))}What is the <b>marginal utility per dollar</b> of the ${ord(k)} ${X.s}?`,
            answer: ans, unit: "utils per dollar",
            traps: traps(ans, [
              { value: mu[k - 1], why: "That is the marginal utility. Divide it by the price." },
              { value: tu[k] / p, why: "That divides total utility by the price. Use the marginal utility of this unit." },
              { value: mu[k - 1] * p, why: "Divide by the price, don't multiply." },
            ]),
            sol: steps("First find the MU of that unit (TU(n) − TU(n − 1)), then divide by the price.",
              `MU = ${tu[k]} − ${tu[k - 1]} = ${mu[k - 1]}. ${MUP} = ${mu[k - 1]} ÷ ${$(p)} = <b>${ans} utils per dollar</b>.`),
          });
        },
      },
      {
        name: "Which good next: MU or MU per dollar?",
        make() {
          const o = nextUnits(Math.random() < 0.75); const w = person();
          const better = o.vx > o.vy ? o.X : o.Y, worse = o.vx > o.vy ? o.Y : o.X;
          const bigMU = o.mx > o.my ? o.X : o.Y;
          return Q.mc({
            q: `${w.n} has a few dollars left and is choosing one more item. The next ${o.X.s} (price ${$(o.px)}) would add ${o.mx} utils; the next ${o.Y.s} (price ${$(o.py)}) would add ${o.my} utils. To get the most utility from ${w.his} money, which should ${w.he} buy next?`,
            right: `The ${better.s}`,
            wrong: [
              { t: `The ${worse.s}`, why: bigMU === worse ? `It has the bigger MU, but per dollar it gives only ${worse === o.X ? o.vx : o.vy} utils against ${worse === o.X ? o.vy : o.vx}.` : `It gives less utility per dollar (${worse === o.X ? o.vx : o.vy} vs ${worse === o.X ? o.vy : o.vx}).` },
              { t: "It makes no difference", why: `The MU per dollar differ: ${o.vx} for ${o.X.p} and ${o.vy} for ${o.Y.p}.` },
              { t: "Neither: spending more cannot raise total utility", why: "Both units have positive marginal utility, so buying one raises total utility." },
            ],
            rightWhy: `It gives more utility per dollar: ${better === o.X ? `${o.mx} ÷ ${$(o.px)} = ${o.vx}` : `${o.my} ÷ ${$(o.py)} = ${o.vy}`}.`,
            sol: steps("When prices differ, compare marginal utility <em>per dollar</em> (MU ÷ P), not MU.",
              `${cap(o.X.s)}: ${o.mx} ÷ ${$(o.px)} = ${o.vx}. ${cap(o.Y.s)}: ${o.my} ÷ ${$(o.py)} = ${o.vy}. Buy the <b>${better.s}</b>.`),
          });
        },
      },
      {
        name: "Best buy among three goods",
        make() {
          const w = person();
          for (;;) {
            const gs = U.sample(GOODS, 3);
            const ps = U.sample([2, 3, 4, 5, 6, 8, 10, 12], 3);
            const vs = U.sample([3, 4, 5, 6, 7, 8, 9, 10, 12], 3);
            const mus = vs.map((v, i) => v * ps[i]);
            if (new Set(mus).size < 3) continue;
            const best = vs.indexOf(Math.max(...vs));
            const topMU = mus.indexOf(Math.max(...mus)), cheap = ps.indexOf(Math.min(...ps));
            if (topMU === best && cheap === best) continue;
            const rows = gs.map((g, i) => [cap(g.s), $(ps[i]), mus[i]]);
            return Q.mc({
              q: `For ${w.n}'s next purchase:${tbl(["Good", "Price", "MU of the next unit (utils)"], rows)}Which next unit gives the most utility per dollar?`,
              right: `The ${gs[best].s}`,
              wrong: gs.map((g, i) => i === best ? null : { t: `The ${g.s}`, why: `${mus[i]} ÷ ${$(ps[i])} = ${vs[i]} utils per dollar, less than ${vs[best]}.${i === topMU ? " It has the highest MU, but it is pricey." : i === cheap ? " It is the cheapest, but cheap is not the same as good value." : ""}` }).filter(Boolean),
              sol: steps("Divide each MU by its price.",
                gs.map((g, i) => `${cap(g.s)}: ${mus[i]} ÷ ${$(ps[i])} = ${vs[i]}`).join("; ") + `. The <b>${gs[best].s}</b> wins.`),
            });
          }
        },
      },
      {
        name: "Price that equalizes MU per dollar",
        make() {
          const w = person();
          for (;;) {
            const [X, Y] = two();
            const v = U.randInt(3, 12);
            const [px, py] = U.sample([2, 3, 4, 5, 6, 8, 10, 12], 2);
            const mx = v * px, my = v * py;
            const ans = py;
            return Q.num({
              q: `For ${w.n}, the last ${X.s} (price ${$(px)}) added ${mx} utils and the last ${Y.s} added ${my} utils. At what price of ${an(Y)} would the marginal utility per dollar of the two goods be <b>equal</b>?`,
              answer: ans, unit: "$",
              traps: traps(ans, [
                { value: px, why: "Equal prices would make MU per dollar equal only if the MUs were equal too." },
                { value: px * mx / my, why: "Upside down: P<sub>Y</sub> = MU<sub>Y</sub> × P<sub>X</sub> ÷ MU<sub>X</sub>." },
                { value: my / px, why: `Find the MU per dollar of ${X.p} first (${mx} ÷ ${$(px)}), then ask which price gives ${Y.p} the same.` },
              ]),
              sol: steps(`Set MU ÷ P for ${X.p} equal to MU ÷ P for ${Y.p}, and solve for the unknown price.`,
                `${cap(X.p)}: ${mx} ÷ ${$(px)} = ${v} utils per dollar.`,
                `${cap(Y.p)} must also give ${v} per dollar: P = ${my} ÷ ${v} = <b>${$(ans)}</b>.`),
            });
          }
        },
      },
      {
        name: "Recover total utility from MU per dollar",
        make() {
          const [X] = two(); const w = person();
          const p = U.pick([2, 3, 4, 5, 6]);
          const v = [U.randInt(9, 15)]; for (let i = 1; i < 5; i++) v.push(v[i - 1] - U.randInt(1, 3));
          if (v[4] < 1) return this.make();
          const mu = v.map(x => x * p), tu = tuRows(mu);
          const k = U.randInt(2, 5);
          const rows = tu.map((t, i) => [i, i === k ? "?" : t, i === 0 ? "—" : v[i - 1]]);
          const ans = tu[k];
          return Q.num({
            q: `${cap(X.p)} cost ${$(p)} each. Part of ${w.n}'s table:${tbl([cap(X.p), "Total utility", `${MUP} (utils per dollar)`], rows)}What is the missing total utility of ${qty(k, X)}?`,
            answer: ans, unit: "utils",
            traps: traps(ans, [
              { value: tu[k - 1] + v[k - 1], why: "You added MU per dollar. Convert it back to MU first: MU = (MU/P) × P." },
              { value: mu[k - 1], why: "That is the MU of this unit, not the total." },
              { value: tu[k - 1], why: "That is the total one unit earlier." },
            ]),
            sol: steps("MU per dollar × price = marginal utility; then TU(n) = TU(n − 1) + MU(n).",
              `MU of the ${ord(k)} ${X.s} = ${v[k - 1]} × ${$(p)} = ${mu[k - 1]}.`,
              `TU(${k}) = ${tu[k - 1]} + ${mu[k - 1]} = <b>${ans} utils</b>.`),
          });
        },
      },
      {
        name: "Order of purchases by MU per dollar",
        make() {
          const w = person();
          for (;;) {
            const [X, Y] = two();
            const [px, py] = U.sample([2, 3, 4, 5, 6], 2);
            const vx = [U.randInt(10, 16)]; for (let i = 1; i < 4; i++) vx.push(vx[i - 1] - U.randInt(1, 4));
            const vy = [U.randInt(10, 16)]; for (let i = 1; i < 4; i++) vy.push(vy[i - 1] - U.randInt(1, 4));
            const all = vx.concat(vy);
            if (new Set(all).size < 8 || Math.min(...all) < 1) continue;
            const seq = [];
            let i = 0, j = 0;
            while (seq.length < 5) { if (j >= 4 || (i < 4 && vx[i] > vy[j])) { seq.push(["X", ++i]); } else seq.push(["Y", ++j]); }
            const n = U.randInt(3, 5);
            const label = ([g, k]) => `The ${ord(k)} ${g === "X" ? X.s : Y.s}`;
            const right = label(seq[n - 1]);
            const cands = [];
            for (let k = 1; k <= 4; k++) { cands.push(["X", k]); cands.push(["Y", k]); }
            const wrong = U.shuffle(cands.filter(c => label(c) !== right)).filter(c => Math.abs(c[1] - seq[n - 1][1]) <= 2).slice(0, 3)
              .map(c => ({ t: label(c), why: seq.findIndex(s => s[0] === c[0] && s[1] === c[1]) >= 0 ? `That is purchase number ${seq.findIndex(s => s[0] === c[0] && s[1] === c[1]) + 1}.` : "That unit comes later in the order." }));
            return Q.mc({
              q: `${w.n} buys ${X.p} (${$(px)}) and ${Y.p} (${$(py)}) one unit at a time, always choosing the unit with the highest marginal utility per dollar. The MU of successive units is:${tbl(["Unit", `MU of ${X.p}`, `MU of ${Y.p}`], [0, 1, 2, 3].map(k => [ord(k + 1), vx[k] * px, vy[k] * py]))}Which unit is ${w.his} <b>${ord(n)}</b> purchase?`,
              right, wrong,
              sol: steps("Convert every MU to MU per dollar, then list the units from highest to lowest.",
                `${MUP} for ${X.p}: ${vx.join(", ")}. For ${Y.p}: ${vy.join(", ")}.`,
                `Order: ${seq.map((s, k) => `${k + 1}. ${label(s).replace("The ", "")} (${s[0] === "X" ? vx[s[1] - 1] : vy[s[1] - 1]})`).join("; ")}. Purchase ${n} is <b>${right.replace("The ", "the ")}</b>.`),
            });
          }
        },
      },
      {
        name: "Select all true statements about MU per dollar",
        make() {
          const opts = U.sample(MUP_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(MUP_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("MU per dollar = marginal utility ÷ price: the extra utility from the last dollar spent on a good.",
              "It, not raw MU or price alone, tells you where the next dollar does the most good, and it falls as you buy more because MU diminishes."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — Solving for the consumer optimum
   * ============================================================ */
  function optIntro(o) {
    return `${o.who.n} has ${$(o.I)} to spend on ${o.X.p} (${$(o.px)} each) and ${o.Y.p} (${$(o.py)} each).`;
  }
  function optTraps(o, askX) {
    const ans = askX ? o.x : o.y;
    const g = greedyMU(o.muX, o.muY, o.px, o.py, o.I);
    const n = o.muX.length;
    return traps(ans, [
      { value: askX ? g[0] : g[1], why: "That comes from comparing raw marginal utilities. Divide each MU by its price before comparing." },
      { value: askX ? o.y : o.x, why: `That is the quantity of ${askX ? o.Y.p : o.X.p} at the optimum.` },
      { value: Math.min(n, Math.floor(o.I / (askX ? o.px : o.py))), why: "That spends (nearly) everything on one good. The optimum balances MU per dollar across both goods." },
    ]);
  }
  const genOpt = STUDY.makeGenerator({
    id: "b251-m8-optimum",
    name: "Solving for the consumer optimum",
    blurb: "Use utility tables, prices and income to find the utility-maximizing bundle: spend all income and equalize MU per dollar.",
    variants: [
      {
        name: "Optimum from a marginal-utility table",
        make() {
          const o = optInstance(5), askX = Math.random() < 0.5;
          return Q.num({
            q: `${optIntro(o)}${muTable(o, 5)}How many <b>${askX ? o.X.p : o.Y.p}</b> does ${o.who.he} buy at ${o.who.his} consumer optimum?`,
            answer: askX ? o.x : o.y, unit: askX ? o.X.p : o.Y.p, kind: "count",
            traps: optTraps(o, askX),
            sol: optSol(o, o.px, o.py, o.I, o.x, o.y),
          });
        },
      },
      {
        name: "Optimum from a total-utility table",
        make() {
          const o = optInstance(5), askX = Math.random() < 0.5;
          return Q.num({
            q: `${optIntro(o)}${tuTable(o, 5)}How many <b>${askX ? o.X.p : o.Y.p}</b> maximize ${o.who.his} total utility?`,
            answer: askX ? o.x : o.y, unit: askX ? o.X.p : o.Y.p, kind: "count",
            traps: traps(askX ? o.x : o.y, optTraps(o, askX).concat([{ value: askX ? 5 : 5, why: "Total utility is highest at 5 units of each, but that bundle is not affordable." }])),
            sol: optSol(o, o.px, o.py, o.I, o.x, o.y, `First turn total utility into marginal utility: MU of the n-th unit = TU(n) − TU(n − 1). For ${o.X.p}: ${o.muX.join(", ")}. For ${o.Y.p}: ${o.muY.join(", ")}. Then apply the rule: spend all income and equalize MU per dollar.`),
          });
        },
      },
      {
        name: "Optimum from MU-per-dollar columns",
        make() {
          const o = optInstance(5), askX = Math.random() < 0.5;
          return Q.num({
            q: `${optIntro(o)} The table already shows the marginal utility per dollar of each unit.${mupTable(o, 5, o.px, o.py)}How many <b>${askX ? o.X.p : o.Y.p}</b> does ${o.who.he} buy at the optimum?`,
            answer: askX ? o.x : o.y, unit: askX ? o.X.p : o.Y.p, kind: "count",
            traps: optTraps(o, askX).filter((t, i) => i > 0),
            sol: steps("The ratios are done for you. Find where the MU per dollar of the two goods match, then check that bundle costs exactly the income.",
              `They match at the ${ord(o.x)} ${o.X.s} and the ${ord(o.y)} ${o.Y.s} (${mupS(o.muX[o.x - 1], o.px)} each).`,
              `${$(o.px)} × ${o.x} + ${$(o.py)} × ${o.y} = ${$(o.I)} ✓. Optimum: <b>${qty(o.x, o.X)} and ${qty(o.y, o.Y)}</b>.`),
          });
        },
      },
      {
        name: "Total utility at the optimum",
        make() {
          const o = optInstance(5);
          const ans = sum(o.muX, o.x) + sum(o.muY, o.y);
          const g = greedyMU(o.muX, o.muY, o.px, o.py, o.I);
          return Q.num({
            q: `${optIntro(o)}${muTable(o, 5)}What is ${o.who.his} <b>total utility</b> at the consumer optimum?`,
            answer: ans, unit: "utils",
            traps: traps(ans, [
              { value: o.muX[o.x - 1] + o.muY[o.y - 1], why: "That adds only the marginal utilities of the last units. Total utility sums every unit bought." },
              { value: sum(o.muX, g[0]) + sum(o.muY, g[1]), why: "That is the total for the bundle you get by comparing raw MU. Compare MU per dollar instead." },
              { value: sum(o.muX, o.x), why: `That is the utility from ${o.X.p} only.` },
              { value: sum(o.muY, o.y), why: `That is the utility from ${o.Y.p} only.` },
            ]),
            sol: optSol(o, o.px, o.py, o.I, o.x, o.y) + step(`Total utility = (${o.muX.slice(0, o.x).join(" + ")}) + (${o.muY.slice(0, o.y).join(" + ")}) = <b>${ans} utils</b>.`),
          });
        },
      },
      {
        name: "Diagnose a bundle on the budget line",
        make() {
          for (;;) {
            const o = optInstance(5);
            const cands = [];
            for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) if (o.px * a + o.py * b === o.I && a !== o.x) cands.push([a, b]);
            if (!cands.length) continue;
            const [a, b] = U.pick(cands);
            const rx = o.muX[a - 1] / o.px, ry = o.muY[b - 1] / o.py;
            const moreX = rx > ry;
            const R = { mx: `Buy more ${o.X.p} and fewer ${o.Y.p}`, my: `Buy more ${o.Y.p} and fewer ${o.X.p}`, ok: "Keep this bundle: it is the optimum", both: "Buy more of both goods" };
            return Q.mc({
              q: `${optIntro(o)}${muTable(o, 5)}${o.who.He} is considering <b>${qty(a, o.X)} and ${qty(b, o.Y)}</b>, which costs exactly ${$(o.I)}. What should ${o.who.he} do to raise total utility?`,
              right: moreX ? R.mx : R.my,
              wrong: [
                { t: moreX ? R.my : R.mx, why: `That moves the wrong way: the ${moreX ? o.X.s : o.Y.s} currently gives more utility per dollar.` },
                { t: R.ok, why: `MU per dollar is not equal here: ${mupS(o.muX[a - 1], o.px)} for ${o.X.p} vs ${mupS(o.muY[b - 1], o.py)} for ${o.Y.p}.` },
                { t: R.both, why: "The bundle already uses all the income, so more of both is unaffordable." },
              ],
              keepOrder: true,
              sol: steps("At the bundle, compare the MU per dollar of the <em>last</em> unit of each good.",
                `Last ${o.X.s} (the ${ord(a)}): ${o.muX[a - 1]} ÷ ${$(o.px)} = ${mupS(o.muX[a - 1], o.px)}. Last ${o.Y.s} (the ${ord(b)}): ${o.muY[b - 1]} ÷ ${$(o.py)} = ${mupS(o.muY[b - 1], o.py)}.`,
                `${cap(moreX ? o.X.p : o.Y.p)} give more per dollar, so shift spending toward them. Doing so leads to the optimum, ${qty(o.x, o.X)} and ${qty(o.y, o.Y)}.`),
            });
          }
        },
      },
      {
        name: "Pick the optimum from candidate bundles",
        make() {
          for (;;) {
            const o = optInstance(5);
            const opts = [];
            const used = new Set([o.x + ":" + o.y]);
            const add = (a, b, why) => { const k = a + ":" + b; if (used.has(k) || a < 0 || b < 0 || a > 5 || b > 5) return; used.add(k); opts.push({ t: `${qty(a, o.X)} and ${qty(b, o.Y)}`, why }); };
            const g = greedyMU(o.muX, o.muY, o.px, o.py, o.I);
            add(g[0], g[1], "That is where comparing raw MU (not MU per dollar) leads; it gives less total utility.");
            const ins = []; const out = []; const on = [];
            for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) {
              const c = o.px * a + o.py * b;
              if (c === o.I) on.push([a, b]); else if (c < o.I && a >= o.x - 1 && b >= o.y - 1) ins.push([a, b]); else if (c > o.I && a <= o.x + 1 && b <= o.y + 1) out.push([a, b]);
            }
            if (ins.length) { const p = U.pick(ins); add(p[0], p[1], `It costs ${$(o.px * p[0] + o.py * p[1])}, leaving money unspent that could buy more utility.`); }
            if (out.length) { const p = U.pick(out); add(p[0], p[1], `It costs ${$(o.px * p[0] + o.py * p[1])}, more than the ${$(o.I)} income.`); }
            for (const p of U.shuffle(on)) add(p[0], p[1], `It spends ${$(o.I)}, but MU per dollar is not equal (${mupS(o.muX[p[0] - 1], o.px)} vs ${mupS(o.muY[p[1] - 1], o.py)}).`);
            if (opts.length < 3) continue;
            return Q.mc({
              q: `${optIntro(o)}${muTable(o, 5)}Which bundle is ${o.who.his} consumer optimum?`,
              right: `${qty(o.x, o.X)} and ${qty(o.y, o.Y)}`,
              wrong: opts.slice(0, 3),
              sol: optSol(o, o.px, o.py, o.I, o.x, o.y, "Check both conditions for each candidate: does it cost exactly the income, and is MU per dollar equal for the last unit of each good?"),
            });
          }
        },
      },
      {
        name: "Spending on one good at the optimum",
        make() {
          const o = optInstance(5), askX = Math.random() < 0.5;
          const ans = askX ? o.px * o.x : o.py * o.y;
          return Q.num({
            q: `${optIntro(o)}${muTable(o, 5)}At ${o.who.his} consumer optimum, how many dollars does ${o.who.he} spend on <b>${askX ? o.X.p : o.Y.p}</b>?`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: askX ? o.x : o.y, why: "That is the number of units. Multiply by the price." },
              { value: o.I, why: "That is the whole income, spent across both goods." },
              { value: askX ? o.py * o.y : o.px * o.x, why: "That is the spending on the other good." },
            ]),
            sol: optSol(o, o.px, o.py, o.I, o.x, o.y) + step(`Spending on ${askX ? o.X.p : o.Y.p}: ${$(askX ? o.px : o.py)} × ${askX ? o.x : o.y} = <b>${$(ans)}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — The utility-maximizing rule: reasoning
   * ============================================================ */
  const RULE_TF = [
    { t: "At the consumer optimum, marginal utility per dollar is the same for every good bought.", ok: true },
    { t: "A consumer with equal MU per dollar but money left over is not yet at the optimum, as long as more units would add utility.", ok: true },
    { t: "If MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>, moving a dollar from Y to X raises total utility.", ok: true },
    { t: "The utility-maximizing rule extends to any number of goods: MU<sub>A</sub>/P<sub>A</sub> = MU<sub>B</sub>/P<sub>B</sub> = MU<sub>C</sub>/P<sub>C</sub> = … .", ok: true },
    { t: "When utility is maximized, the marginal benefit of a good is the most the consumer would pay for one more unit of it.", ok: true },
    { t: "A consumer at the optimum is using her resources efficiently: no reallocation of spending can raise her total utility.", ok: true },
    { t: "At the optimum, the marginal utility of every good is the same.", ok: false, why: "MU <em>per dollar</em> is equal. A good costing twice as much must give twice the MU." },
    { t: "The consumer should keep buying whichever good has the highest marginal utility.", ok: false, why: "Compare MU per dollar, not raw MU." },
    { t: "Total utility is maximized by buying each good until its marginal utility is zero.", ok: false, why: "That would be true only with unlimited income. With a budget, the consumer stops where MU per dollar is equal and income is spent." },
    { t: "If MU<sub>X</sub>/P<sub>X</sub> &gt; MU<sub>Y</sub>/P<sub>Y</sub>, the consumer should buy more Y.", ok: false, why: "X gives more per dollar, so buy more X and less Y." },
    { t: "Equal MU per dollar guarantees the optimum even if part of the income is unspent.", ok: false, why: "Both conditions are needed: equal ratios and all income spent." },
    { t: "The consumer optimum is the bundle with the highest total utility, whether or not it is affordable.", ok: false, why: "The optimum is the best <em>affordable</em> bundle." },
  ];
  const genRule = STUDY.makeGenerator({
    id: "b251-m8-rule",
    name: "The utility-maximizing rule",
    blurb: "Reason with MU per dollar: which way to reallocate, what reallocating does to MU, why all income must be spent, and the gain from moving a dollar.",
    variants: [
      {
        name: "Reallocate: more X or more Y?",
        make() {
          const w = person();
          const equal = Math.random() < 0.2;
          for (;;) {
            const [X, Y] = two();
            const [px, py] = U.sample([2, 3, 4, 5, 6, 8, 10], 2);
            const vx = U.randInt(3, 12), vy = equal ? vx : U.randInt(3, 12);
            if (!equal && vx === vy) continue;
            const mx = vx * px, my = vy * py;
            if (!equal && mx === my) continue;
            const R = { mx: `Buy more ${X.p} and fewer ${Y.p}`, my: `Buy more ${Y.p} and fewer ${X.p}`, ok: "Change nothing: this is the optimum", both: "Buy more of both" };
            const right = equal ? R.ok : vx > vy ? R.mx : R.my;
            const whys = {
              [R.mx]: equal ? `Both give ${vx} utils per dollar, so shifting toward ${X.p} gains nothing; diminishing MU would actually make it a small loss.` : `${cap(X.p)} give only ${vx} utils per dollar against ${vy} for ${Y.p}, so moving toward ${X.p} loses utility.`,
              [R.my]: equal ? `Both give ${vx} utils per dollar, so shifting toward ${Y.p} gains nothing; diminishing MU would actually make it a small loss.` : `${cap(Y.p)} give only ${vy} utils per dollar against ${vx} for ${X.p}, so moving toward ${Y.p} loses utility.`,
              [R.ok]: `MU per dollar differs (${vx} vs ${vy}), so a reallocation can raise total utility.`,
              [R.both]: "All income is already spent, so more of both is not affordable.",
            };
            return Q.mc({
              q: `${w.n} spends all ${w.his} income on ${X.p} (${$(px)}) and ${Y.p} (${$(py)}). The last ${X.s} added ${mx} utils; the last ${Y.s} added ${my} utils. What should ${w.he} do?`,
              right, wrong: [R.mx, R.my, R.ok, R.both].filter(t => t !== right).map(t => ({ t, why: whys[t] })),
              keepOrder: true,
              sol: steps("Compare marginal utility per dollar of the last unit of each good.",
                `${cap(X.s)}: ${mx} ÷ ${$(px)} = ${vx}. ${cap(Y.s)}: ${my} ÷ ${$(py)} = ${vy}.`,
                equal ? "They are equal and all income is spent: both conditions hold, so this is the optimum."
                  : `${vx > vy ? cap(X.p) : cap(Y.p)} give more per dollar, so shift spending toward them. Diminishing MU then lowers their MU and raises the other good's, closing the gap.${(mx > my) !== (vx > vy) ? " Note that the raw MU points the other way, which is why you must divide by price." : ""}`),
            });
          }
        },
      },
      {
        name: "Classify situations by the rule",
        make() {
          const [X, Y] = two();
          const cats = [`More ${X.p}, fewer ${Y.p}`, `More ${Y.p}, fewer ${X.p}`, "Already at the optimum"];
          const items = [], seen = new Set();
          const want = U.shuffle([0, 1, 2, U.randInt(0, 1), U.randInt(0, 2)]);
          let g = 0;
          while (items.length < want.length && g++ < 500) {
            const c = want[items.length];
            const [px, py] = U.sample([2, 3, 4, 5, 6, 8, 10], 2);
            const vx = U.randInt(3, 12);
            const vy = c === 2 ? vx : c === 0 ? vx - U.randInt(1, Math.min(4, vx - 1)) : vx + U.randInt(1, 4);
            if (vy < 1 || (c === 0 && vy >= vx)) continue;
            const t = `Last ${X.s}: MU ${vx * px}, price ${$(px)}. Last ${Y.s}: MU ${vy * py}, price ${$(py)}.`;
            if (seen.has(t)) continue;
            seen.add(t);
            items.push({ t, cat: cats[c], why: `${MUP}: ${vx * px} ÷ ${px} = ${vx} for ${X.p}; ${vy * py} ÷ ${py} = ${vy} for ${Y.p}.` });
          }
          return Q.classify({
            q: `In each case the shopper has spent all of their income on ${X.p} and ${Y.p}. What should they do to raise total utility?`,
            cats, items,
            sol: steps("For each line, divide MU by price for both goods.",
              "Higher MU per dollar for a good → buy more of it and less of the other. Equal ratios with all income spent → the optimum."),
          });
        },
      },
      {
        name: "Utility gained by moving a dollar",
        make() {
          const w = person();
          for (;;) {
            const [X, Y] = two();
            const [px, py] = U.sample([2, 3, 4, 5, 6, 8, 10], 2);
            const [vx, vy] = U.sample([3, 4, 5, 6, 7, 8, 9, 10, 12], 2);
            const mx = vx * px, my = vy * py;
            const hi = vx > vy ? X : Y, lo = vx > vy ? Y : X;
            const ans = Math.abs(vx - vy);
            return Q.num({
              q: `For ${w.n}, the last ${X.s} (${$(px)}) added ${mx} utils and the last ${Y.s} (${$(py)}) added ${my} utils. Approximately how many utils does ${w.he} <b>gain</b> by moving one dollar of spending from ${lo.p} to ${hi.p}?`,
              answer: ans, unit: "utils",
              traps: traps(ans, [
                { value: Math.abs(mx - my), why: "That compares raw MU. A dollar buys only part of a unit: use MU per dollar." },
                { value: Math.max(vx, vy), why: `That is the gain from the extra dollar on ${hi.p}, but you also lose the utility of the dollar taken away from ${lo.p}.` },
                { value: vx + vy, why: "The dollar is moved, not added: subtract what is lost." },
              ]),
              sol: steps("A dollar taken from a good loses about its MU per dollar; a dollar added to a good gains about its MU per dollar.",
                `${cap(X.p)}: ${mx} ÷ ${$(px)} = ${vx}. ${cap(Y.p)}: ${my} ÷ ${$(py)} = ${vy}.`,
                `Gain ≈ ${Math.max(vx, vy)} − ${Math.min(vx, vy)} = <b>${ans} ${U.plural(ans, "util")}</b>, with no change in total spending. That is why the optimum requires equal ratios.`),
            });
          }
        },
      },
      {
        name: "Why all income must be spent",
        make() {
          const w = person();
          const [X, Y] = two();
          const v = U.randInt(4, 9), left = U.pick([6, 8, 10, 12, 15, 20]);
          return Q.mc({
            q: `${w.n} buys ${X.p} and ${Y.p}. At ${w.his} current bundle, MU per dollar is ${v} for both goods, but ${w.he} still has ${$(left)} of ${w.his} budget unspent (and more of either good would add utility). Is ${w.he} at the consumer optimum?`,
            right: `No: spending the ${$(left)} on more units would raise total utility`,
            wrong: [
              { t: "Yes: equal marginal utility per dollar is all the rule requires", why: "The rule has two parts: equal MU per dollar <em>and</em> all income spent." },
              { t: `Yes: holding on to the ${$(left)} gives the most utility`, why: "In this model unspent money buys nothing, so it adds no utility." },
              { t: "No: " + w.he + " should buy fewer units of both goods", why: "Buying less would lower total utility; the problem is unspent money." },
            ],
            sol: steps("The utility-maximizing rule has two conditions. Check both.",
              `Equal MU per dollar holds, but income is not exhausted. Each extra unit still adds utility, so spending the ${$(left)} raises total utility. The optimum is further out, where the ratios are equal <em>and</em> the money is gone.`),
          });
        },
      },
      {
        name: "What reallocation does to marginal utility",
        make() {
          const w = person();
          const [X, Y] = two();
          const a = U.randInt(8, 14), b = a - U.randInt(2, 5);
          return Q.mc({
            q: `${w.n}'s last ${X.s} gives ${a} utils per dollar and ${w.his} last ${Y.s} gives ${b}. ${w.He} shifts spending: buys more ${X.p} and fewer ${Y.p}. What happens to the marginal utilities as ${w.he} does this?`,
            right: `MU of ${X.p} falls and MU of ${Y.p} rises, so the two MU-per-dollar ratios move toward each other`,
            wrong: [
              { t: `MU of ${X.p} rises and MU of ${Y.p} falls, widening the gap`, why: "Diminishing MU works the other way: more of a good lowers its MU." },
              { t: "Both marginal utilities stay the same, because prices did not change", why: "MU depends on the quantity consumed, which is changing." },
              { t: "Both marginal utilities fall, because total spending is the same", why: `Buying fewer ${Y.p} moves back up the ${Y.s} MU schedule, so its MU rises.` },
            ],
            sol: steps("Diminishing marginal utility: the more of a good you have, the lower its MU.",
              `More ${X.p} → lower MU of ${X.p} → their MU per dollar falls from ${a}. Fewer ${Y.p} → higher MU of ${Y.p} → their MU per dollar rises from ${b}. ${w.He} stops when they are equal.`),
          });
        },
      },
      {
        name: "Three goods: which to cut back?",
        make() {
          const w = person();
          for (;;) {
            const gs = U.sample(GOODS, 3);
            const ps = U.sample([2, 3, 4, 5, 6, 8, 10, 12], 3);
            const vs = U.sample([3, 4, 5, 6, 7, 8, 9, 10], 3);
            const mus = vs.map((v, i) => v * ps[i]);
            if (new Set(mus).size < 3) continue;
            const lo = vs.indexOf(Math.min(...vs));
            const loMU = mus.indexOf(Math.min(...mus)), dear = ps.indexOf(Math.max(...ps));
            if (loMU === lo && dear === lo) continue;
            return Q.mc({
              q: `${w.n} spends all ${w.his} income on three goods. For the last unit of each:${tbl(["Good", "Price", "Marginal utility (utils)"], gs.map((g, i) => [cap(g.p), $(ps[i]), mus[i]]))}To raise total utility without spending more, ${w.he} should buy fewer of which good?`,
              right: cap(gs[lo].p),
              wrong: gs.map((g, i) => i === lo ? null : { t: cap(g.p), why: `${mus[i]} ÷ ${$(ps[i])} = ${vs[i]} utils per dollar, more than ${vs[lo]}.${i === loMU ? " It has the lowest MU, but it is also cheap." : i === dear ? " It is the most expensive, but it delivers a lot of utility for the price." : ""}` }).filter(Boolean),
              sol: steps("The rule extends to any number of goods: MU<sub>A</sub>/P<sub>A</sub> = MU<sub>B</sub>/P<sub>B</sub> = MU<sub>C</sub>/P<sub>C</sub>.",
                gs.map((g, i) => `${cap(g.p)}: ${vs[i]}`).join("; ") + ` utils per dollar. Cut back on the lowest, <b>${gs[lo].p}</b>, and spend the money on the highest.`),
            });
          }
        },
      },
      {
        name: "Select all true statements about the rule",
        make() {
          const opts = U.sample(RULE_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(RULE_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("The utility-maximizing rule: spend all income and equalize MU per dollar across goods.",
              "Equal MU per dollar, not equal MU. Income must be exhausted. If one ratio is higher, buy more of that good."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — How price and income changes move the optimum
   * ============================================================ */
  const EFFECT_BANK = [
    { t: "Bagels go on sale, so a commuter grabs a bagel instead of a muffin: bagels now give more satisfaction per dollar.", cat: "Substitution effect" },
    { t: "Bus fares are cut, making the bus relatively cheaper than rideshares, so a student switches some trips to the bus.", cat: "Substitution effect" },
    { t: "Coffee prices jump, and a shopper drinks more tea, which is now the better buy per dollar.", cat: "Substitution effect" },
    { t: "Chicken becomes cheaper relative to beef, so a family cooks chicken more often and beef less often.", cat: "Substitution effect" },
    { t: "After name-brand cereal gets pricier, a shopper switches to the store brand.", cat: "Substitution effect" },
    { t: "A streaming service raises its price, and a viewer replaces some of it with free library films.", cat: "Substitution effect" },
    { t: "Gas prices fall, and a driver uses the money saved to buy a little more of many different goods.", cat: "Real-income effect" },
    { t: "Rent jumps, and a tenant, whose paycheck has not changed, feels poorer and cuts back on several unrelated purchases.", cat: "Real-income effect" },
    { t: "A cheaper monthly transit pass leaves a worker $20 more for everything else, so the same paycheck stretches further.", cat: "Real-income effect" },
    { t: "Daycare costs fall, raising a family's purchasing power even though their wages are unchanged.", cat: "Real-income effect" },
    { t: "Grocery prices drop, so a student's unchanged stipend now buys a bigger overall bundle.", cat: "Real-income effect" },
    { t: "Electricity, a big part of a retiree's budget, gets more expensive, and the same pension now buys less overall.", cat: "Real-income effect" },
  ];
  const NORMAL_BANK = [
    { t: "After a raise, a nurse eats at restaurants more often.", cat: "Normal good" },
    { t: "When her income rises, a designer buys more concert tickets.", cat: "Normal good" },
    { t: "A family whose income falls takes fewer weekend trips.", cat: "Normal good" },
    { t: "A graduate with a new, better-paid job buys more new clothes.", cat: "Normal good" },
    { t: "After losing overtime pay, a worker buys fewer movie-theater tickets.", cat: "Normal good" },
    { t: "After a raise, a student buys fewer packs of instant noodles.", cat: "Inferior good" },
    { t: "When his income falls, a shopper buys more store-brand pasta.", cat: "Inferior good" },
    { t: "With higher income, a commuter takes the bus less and drives more; bus rides fall.", cat: "Inferior good" },
    { t: "A family whose income rises buys fewer second-hand appliances.", cat: "Inferior good" },
    { t: "After a pay cut, a worker buys more canned soup.", cat: "Inferior good" },
  ];
  const CHANGE_TF = [
    { t: "A fall in a good's price raises its marginal utility per dollar at the current bundle.", ok: true },
    { t: "To restore equal MU per dollar after a good's price falls, the consumer buys more of it, which lowers its marginal utility.", ok: true },
    { t: "The utility-maximizing rule helps explain why demand curves slope downward.", ok: true },
    { t: "A fall in the price of one good raises the consumer's real income, even though money income is unchanged.", ok: true },
    { t: "When income rises, the consumer buys more of every normal good.", ok: true },
    { t: "A change in the price of one good can change how much of another good is bought.", ok: true },
    { t: "When a good's price falls, the marginal utility of each unit of it rises.", ok: false, why: "MU depends on the quantity consumed, not on price. It is MU <em>per dollar</em> that rises." },
    { t: "A change in one good's price shifts the budget line parallel.", ok: false, why: "One price changing rotates the line; income changes shift it in parallel." },
    { t: "An increase in income lowers the quantity bought of a normal good.", ok: false, why: "Demand for a normal good rises with income." },
    { t: "The real-income effect can happen only when money income changes.", ok: false, why: "It comes from a price change with money income held constant." },
    { t: "A change in the price of one good never affects the quantity bought of another good.", ok: false, why: "To restore equal MU per dollar the consumer usually adjusts both goods." },
    { t: "An increase in income changes the MU per dollar of each unit of a good.", ok: false, why: "Prices and MU schedules are unchanged; the consumer just goes further down each list." },
  ];
  const genChange = STUDY.makeGenerator({
    id: "b251-m8-change",
    name: "Price & income changes and the optimum",
    blurb: "Predict and recompute how the consumer optimum responds to a price or income change; substitution and real-income effects; normal goods.",
    variants: [
      {
        name: "A price changes: restore the optimum",
        make() {
          const w = person();
          for (;;) {
            const [X, Y] = two();
            const [a, py] = U.sample([3, 4, 5, 6, 8, 10, 12], 2);
            const v = U.randInt(4, 10);
            const mx = a * v, my = py * v;
            const fall = Math.random() < 0.6;
            const b = U.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20].filter(p => (fall ? p < a : p > a) && mx % p === 0));
            if (!b) continue;
            const nv = mx / b;
            const right = fall ? `${cap(X.p)} now give ${nv} utils per dollar, more than ${Y.p} (${v}), so ${w.he} buys more ${X.p} until their MU falls enough to restore equality`
              : `${cap(X.p)} now give ${nv} utils per dollar, less than ${Y.p} (${v}), so ${w.he} buys fewer ${X.p} until their MU rises enough to restore equality`;
            return Q.mc({
              q: `${w.n} is at ${w.his} consumer optimum: the last ${X.s} (${$(a)}) adds ${mx} utils and the last ${Y.s} (${$(py)}) adds ${my} utils, so both give ${v} utils per dollar. The price of ${an(X)} then ${fall ? "falls" : "rises"} to ${$(b)}. What happens?`,
              right,
              wrong: [
                { t: `The marginal utility of ${X.p} ${fall ? "rises" : "falls"}, so the optimum is unchanged`, why: "MU depends on quantity, not price; what changes is MU per dollar." },
                { t: fall ? `${cap(X.p)} now give ${nv} utils per dollar, so ${w.he} buys fewer ${X.p}` : `${cap(X.p)} now give ${nv} utils per dollar, so ${w.he} buys more ${X.p}`, why: fall ? "Higher MU per dollar means the good is now a better buy: buy more, not fewer." : "Lower MU per dollar makes the good a worse buy: buy fewer." },
                { t: "Nothing changes, because income is the same", why: "The ratios are no longer equal, so the old bundle is no longer the best." },
              ],
              sol: steps("Recompute MU per dollar at the old bundle with the new price; MU itself has not changed yet.",
                `${cap(X.p)}: ${mx} ÷ ${$(b)} = ${nv}, vs ${v} for ${Y.p}.`,
                fall ? `MU per dollar is now higher for ${X.p} than for ${Y.p}, so ${w.he} buys more ${X.p} (MU falls) and typically fewer ${Y.p}. A lower price → more bought: the law of demand.`
                  : `MU per dollar is now lower for ${X.p} than for ${Y.p}, so ${w.he} buys fewer ${X.p} (MU rises). A higher price → less bought: the law of demand.`),
            });
          }
        },
      },
      {
        name: "Substitution or real-income effect?",
        make() {
          const cats = ["Substitution effect", "Real-income effect"];
          const items = cats.map(c => U.pick(EFFECT_BANK.filter(i => i.cat === c)));
          for (const e of U.deal("m8-eff", EFFECT_BANK, 6)) if (items.length < 5 && !items.includes(e)) items.push(e);
          return Q.classify({
            q: "A price changes in each story. Which effect does the story mainly describe?",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: i.cat === cats[0] ? "The buyer switches toward the relatively cheaper option (more utility per dollar)." : "The buyer's purchasing power changes even though money income does not." })),
            sol: steps("<b>Substitution effect</b>: switching between goods because their relative prices (MU per dollar) changed.",
              "<b>Real-income effect</b>: the same money income buys more (or less) overall, so purchases of many goods change."),
          });
        },
      },
      {
        name: "Recompute the optimum after a price change",
        make() {
          const o = priceInstance();
          const fall = Math.random() < 0.65;
          const askX = Math.random() < 0.6;
          const [pOld, pNew] = fall ? [o.a, o.b] : [o.b, o.a];
          const [xO, yO, xN, yN] = fall ? [o.x1, o.y1, o.x2, o.y2] : [o.x2, o.y2, o.x1, o.y1];
          const ans = askX ? xN : yN;
          const g = greedyMU(o.muX, o.muY, pNew, o.py, o.I);
          const T = { X: o.X, Y: o.Y, muX: o.muX, muY: o.muY };
          return Q.num({
            q: `${o.who.n} has ${$(o.I)} for ${o.X.p} and ${o.Y.p} (${$(o.py)} each).${muTable(o, 6)}At ${$(pOld)} per ${o.X.s}, ${o.who.his} optimum is ${qty(xO, o.X)} and ${qty(yO, o.Y)}. The price of ${an(o.X)} ${fall ? "falls" : "rises"} to <b>${$(pNew)}</b>; income stays ${$(o.I)}. How many <b>${askX ? o.X.p : o.Y.p}</b> does ${o.who.he} buy at the new optimum?`,
            answer: ans, unit: askX ? o.X.p : o.Y.p, kind: "count",
            traps: traps(ans, [
              { value: askX ? xO : yO, why: "That is the old optimum. The price change alters MU per dollar for every unit of the good." },
              { value: askX ? g[0] : g[1], why: "That comes from comparing raw MU, not MU per dollar." },
              { value: askX ? yN : xN, why: `That is the new quantity of ${askX ? o.Y.p : o.X.p}.` },
            ]),
            sol: optSol(T, pNew, o.py, o.I, xN, yN, `Redo the MU-per-dollar column for ${o.X.p} with the new price (${$(pNew)}); the ${o.Y.s} column is unchanged. Then find the bundle with equal ratios that spends ${$(o.I)}.`) +
              step(`Compared with before: ${fall ? "more" : "fewer"} ${o.X.p} (${xO} → ${xN}), the law of demand, and ${yN > yO ? "more" : "fewer"} ${o.Y.p} (${yO} → ${yN}).`),
          });
        },
      },
      {
        name: "Recompute the optimum after an income change",
        make() {
          const o = incomeInstance();
          const up = Math.random() < 0.7, askX = Math.random() < 0.5;
          const [IO, IN] = up ? [o.I1, o.I2] : [o.I2, o.I1];
          const [xO, yO, xN, yN] = up ? [o.x1, o.y1, o.x2, o.y2] : [o.x2, o.y2, o.x1, o.y1];
          const ans = askX ? xN : yN;
          return Q.num({
            q: `${o.who.n} buys ${o.X.p} (${$(o.px)}) and ${o.Y.p} (${$(o.py)}).${muTable(o, 6)}With an income of ${$(IO)}, ${o.who.his} optimum is ${qty(xO, o.X)} and ${qty(yO, o.Y)}. ${cap(o.who.his)} income ${up ? "rises" : "falls"} to <b>${$(IN)}</b>; prices are unchanged. How many <b>${askX ? o.X.p : o.Y.p}</b> does ${o.who.he} buy now?`,
            answer: ans, unit: askX ? o.X.p : o.Y.p, kind: "count",
            traps: traps(ans, [
              { value: askX ? xO : yO, why: "That is the old optimum; with a different income the old bundle no longer spends exactly the budget." },
              { value: askX ? yN : xN, why: `That is the new quantity of ${askX ? o.Y.p : o.X.p}.` },
              { value: (askX ? xO : yO) + (up ? 1 : -1) * Math.round(Math.abs(IN - IO) / (askX ? o.px : o.py)), why: "That puts the whole change in income into one good. The rule spreads it so MU per dollar stays equal." },
            ]),
            sol: optSol(o, o.px, o.py, IN, xN, yN, `Prices are the same, so the MU-per-dollar columns are unchanged. Look for the matching pair that costs exactly the new income, ${$(IN)}.`) +
              step(`${up ? "Higher" : "Lower"} income → ${up ? "more" : "less"} of both goods (${xO} → ${xN} ${o.X.p}, ${yO} → ${yN} ${o.Y.p}): both are normal goods for ${o.who.him}.`),
          });
        },
      },
      {
        name: "MU per dollar right after a price change",
        make() {
          const w = person();
          for (;;) {
            const [X, Y] = two();
            const [a, py] = U.sample([3, 4, 5, 6, 8, 10, 12], 2);
            const v = U.randInt(4, 10), mx = a * v;
            const b = U.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20].filter(p => p !== a && mx % p === 0));
            if (!b) continue;
            const ans = mx / b;
            return Q.num({
              q: `At ${w.n}'s optimum, the last ${X.s} adds ${mx} utils at a price of ${$(a)}, and the last ${Y.s} (${$(py)}) adds ${py * v} utils. The price of ${an(X)} changes to ${$(b)}. Before ${w.he} changes ${w.his} purchases, what is the marginal utility per dollar of the last ${X.s}?`,
              answer: ans, unit: "utils per dollar",
              traps: traps(ans, [
                { value: v, why: "That is the old MU per dollar, at the old price." },
                { value: mx, why: "That is the MU; divide by the new price." },
              ]),
              sol: steps("Right after a price change the quantities, and so the MUs, are unchanged; only the price in the denominator is new.",
                `${mx} ÷ ${$(b)} = <b>${U.fmt(ans)} utils per dollar</b>, compared with ${v} for ${Y.p}.`,
                b < a ? `It is now above ${v}, so ${w.he} will buy more ${X.p}.` : `It is now below ${v}, so ${w.he} will buy fewer ${X.p}.`),
            });
          }
        },
      },
      {
        name: "Normal or inferior?",
        make() {
          const cats = ["Normal good", "Inferior good"];
          const items = cats.map(c => U.pick(NORMAL_BANK.filter(i => i.cat === c)));
          for (const e of U.deal("m8-norm", NORMAL_BANK, 6)) if (items.length < 4 && !items.includes(e)) items.push(e);
          return Q.classify({
            q: "Classify the good in each story.",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: i.cat === cats[0] ? "Purchases move in the same direction as income." : "Purchases move in the opposite direction to income." })),
            sol: steps("Ask: when income went up (or down), did purchases of the good go the same way?",
              "Same direction → normal good (demand rises with income). Opposite direction → inferior good. Watch for stories about income <em>falling</em>."),
          });
        },
      },
      {
        name: "Select all true statements about price and income changes",
        make() {
          const opts = U.sample(CHANGE_TF, 5);
          if (!opts.some(o => o.ok)) opts[0] = U.pick(CHANGE_TF.filter(o => o.ok));
          return Q.multi({
            q: "Select <b>all</b> statements that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why })),
            sol: steps("A price change alters MU per dollar (MU ÷ new P) and rotates the budget line; an income change shifts it in parallel and leaves the ratios alone.",
              "Lower price → buy more of that good (law of demand), via substitution and real-income effects. Higher income → more of every normal good."),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m8", order: 8,
    title: "Module 8 · Consumer Optimum",
    short: "M8 · Consumer",
    description: "Budget lines and how they shift or rotate, total and marginal utility, MU per dollar and the utility-maximizing rule, and how price and income changes move the consumer optimum.",
    notes, flashcards, cues,
    generators: [genBudget, genShift, genUtil, genMup, genOpt, genRule, genChange],
  });
})();
