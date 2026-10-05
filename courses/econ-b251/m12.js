/* ============================================================
 * ECON B251 · Module 12 — Firms and Industries: Oligopolies and Game Theory
 * Characteristics of oligopoly (few firms, price searchers, barriers to
 * entry, mergers, strategic dependence), game-theory vocabulary and types
 * of games, dominant strategies, best responses and Nash equilibrium,
 * the prisoners' dilemma and collusion, repeated games (opportunistic
 * behavior, tit-for-tat, price leadership, price wars, price-match
 * guarantees) and sequential games solved by backward induction.
 * All explanations, examples and numbers are original to this site.
 * Every payoff matrix and game tree is generated at random and solved
 * from its payoffs, so the answers are always computed, never typed in.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "econ-b251";

  /* ---------------- shared helpers ---------------- */
  const step = s => `<div class="sol-step">${s}</div>`;
  const steps = (...a) => a.filter(Boolean).map(step).join("");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  /* "$8 million" in prose; "$8" inside a matrix whose caption gives the unit. */
  const mil = v => (v === 0 ? "$0" : `${U.money(v)} million`);
  const range = (lo, hi) => { const out = []; for (let v = lo; v <= hi; v++) out.push(v); return out; };
  const PAY = range(0, 20);
  const PAY1 = range(1, 20);
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
  /* Drop wrong options whose text repeats the right answer or another wrong option. */
  function uniqWrong(right, wrong) {
    const seen = new Set([U.plain(right).toLowerCase()]);
    const out = [];
    for (const w of wrong) {
      const k = U.plain(typeof w === "string" ? w : w.t).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(w);
    }
    return out;
  }

  const FIRMS = ["Apex", "Birchwood", "Corvo", "Dunmore", "Elmstead", "Fairhaven", "Granite", "Halcyon", "Ironvale",
    "Juniper", "Kestrel", "Lumen", "Marlow", "Northgate", "Oakridge", "Pinecrest", "Quarry Hill", "Redwing"];
  const PEOPLE = ["Ana", "Ben", "Carla", "Dev", "Elif", "Femi", "Gus", "Hana", "Ivo", "Jade", "Kofi", "Lena", "Milo", "Noor"];

  /* Strategy pairs. Index 0 is the "cooperative" (collusive) move, index 1 the "cheating" move. */
  const CTX = [
    { inds: ["airlines", "cement makers", "cell-phone carriers", "grocery chains", "pizza chains", "gas stations", "streaming services"],
      s: ["High price", "Low price"], coop: "keep its price high", cheat: "cut its price", letters: ["H", "L"], what: "price" },
    { inds: ["soft-drink makers", "sneaker brands", "fast-food chains", "car-insurance companies"],
      s: ["Modest ads", "Heavy ads"], coop: "keep its advertising modest", cheat: "launch a heavy ad campaign", letters: ["M", "B"], what: "advertising" },
    { inds: ["oil producers", "memory-chip makers", "potash miners", "steel mills"],
      s: ["Restrict output", "Expand output"], coop: "restrict its output", cheat: "expand its output", letters: ["R", "E"], what: "output" },
    { inds: ["drug makers", "phone makers", "chip designers"],
      s: ["Steady R&D", "R&D blitz"], coop: "keep its R&D budget steady", cheat: "launch an R&D blitz", letters: ["S", "X"], what: "research spending" },
  ];

  /* ---------------- 2×2 game engine ----------------
   * g.p[i][j] = [row payoff, column payoff] when row (g.A) plays strategy i
   * and column (g.B) plays strategy j. Both players share the labels g.s.
   * Payoffs are distinct for each player, so best responses never tie. */
  function shell(ctx) {
    const c = ctx || U.pick(CTX);
    const [A, B] = U.sample(FIRMS, 2);
    return { A, B, c, ind: U.pick(c.inds), s: c.s.slice(), coop: 0, p: null };
  }
  const name = (g, k) => (k === 0 ? g.A : g.B);
  const pay = (g, k, mine, oth) => (k === 0 ? g.p[mine][oth][0] : g.p[oth][mine][1]);
  const br = (g, k, oth) => (pay(g, k, 0, oth) > pay(g, k, 1, oth) ? 0 : 1);
  function dom(g, k) { const a = br(g, k, 0), b = br(g, k, 1); return a === b ? a : null; }
  function nash(g) {
    const out = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (br(g, 0, j) === i && br(g, 1, i) === j) out.push([i, j]);
    return out;
  }
  function isPD(g) {
    const rd = dom(g, 0), cd = dom(g, 1);
    if (rd == null || cd == null) return false;
    const ne = g.p[rd][cd], o = g.p[1 - rd][1 - cd];
    return o[0] > ne[0] && o[1] > ne[1];
  }
  function kindOf(g) {
    const rd = dom(g, 0), cd = dom(g, 1);
    if (rd != null && cd != null) return isPD(g) ? "pd" : "dom2";
    if (rd != null || cd != null) return "dom1";
    return nash(g).length === 2 ? "two" : "none";
  }
  function joint(g) {
    const cells = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cells.push({ i, j, sum: g.p[i][j][0] + g.p[i][j][1] });
    cells.sort((a, b) => b.sum - a.sum);
    return { best: cells[0], unique: cells[0].sum > cells[1].sum, cells };
  }
  /* Swap the order of the two strategies (rows and columns together). */
  function reorder(g) {
    if (Math.random() < 0.5) return g;
    const p = g.p;
    g.p = [[p[1][1], p[1][0]], [p[0][1], p[0][0]]];
    g.s = [g.s[1], g.s[0]];
    g.coop = 1 - g.coop;
    return g;
  }
  function rawGame(ctx) {
    const g = shell(ctx);
    const a = U.sample(PAY, 4), b = U.sample(PAY, 4);
    g.p = [[[a[0], b[0]], [a[1], b[1]]], [[a[2], b[2]], [a[3], b[3]]]];
    return g;
  }
  function pdVals() {
    for (let t = 0; t < 500; t++) {
      const [T, R, P, S] = U.sample(PAY1, 4).sort((x, y) => y - x);
      if (2 * R > T + S && R - P >= 2 && P - S >= 2) return { T, R, P, S };
    }
    return { T: 14, R: 10, P: 5, S: 2 };
  }
  /* A prisoners' dilemma: T > R > P > S for each firm, cooperation maximizes joint profit. */
  function pdGame(ctx) {
    for (let t = 0; t < 500; t++) {
      const a = pdVals(), b = Math.random() < 0.4 ? Object.assign({}, a) : pdVals();
      if (a.R + b.R <= a.T + b.S || a.R + b.R <= a.S + b.T) continue;
      const g = shell(ctx);
      g.p = [[[a.R, b.R], [a.S, b.T]], [[a.T, b.S], [a.P, b.P]]];
      g.vals = [a, b];
      return reorder(g);
    }
    const g = shell(ctx);
    g.p = [[[9, 9], [2, 13]], [[13, 2], [5, 5]]];
    g.vals = [{ T: 13, R: 9, P: 5, S: 2 }, { T: 13, R: 9, P: 5, S: 2 }];
    return reorder(g);
  }
  /* A random game of one of the requested kinds: pd, dom2, dom1, two, none. */
  function randGame(kinds, opt) {
    const o = opt || {};
    const want = U.pick(kinds);
    for (let t = 0; t < 20000; t++) {
      const g = want === "pd" ? pdGame(o.ctx) : rawGame(o.ctx);
      if (kindOf(g) !== want) continue;
      if (o.joint && !joint(g).unique) continue;
      if (o.test && !o.test(g)) continue;
      return g;
    }
    throw new Error("randGame: no game of kind " + want);
  }

  /* ---- rendering ---- */
  function matrix(g, opt) {
    const o = opt || {};
    const f = o.fmt || (v => U.money(v));
    const v = (i, j, k) => (o.hide && o.hide.i === i && o.hide.j === j && o.hide.k === k ? "<b>x</b>" : f(g.p[i][j][k]));
    const cell = (i, j) => `${g.A}: ${v(i, j, 0)}<br>${g.B}: ${v(i, j, 1)}`;
    const capt = o.caption || `${cap(o.unit || "profit")} in millions of dollars. ${g.A} chooses a row; ${g.B} chooses a column.`;
    return `<table class="data-tbl"><caption>${capt}</caption><thead><tr><th></th><th>${g.B}: ${g.s[0]}</th><th>${g.B}: ${g.s[1]}</th></tr></thead><tbody>` +
      [0, 1].map(i => `<tr><th>${g.A}: ${g.s[i]}</th><td>${cell(i, 0)}</td><td>${cell(i, 1)}</td></tr>`).join("") + `</tbody></table>`;
  }
  const cellName = (g, i, j) => `${g.A}: ${g.s[i]}, ${g.B}: ${g.s[j]}`;
  const cellPay = (g, i, j) => `${g.A} earns ${mil(g.p[i][j][0])} and ${g.B} earns ${mil(g.p[i][j][1])}`;
  function intro(g) {
    return `Two ${g.ind}, <b>${g.A}</b> and <b>${g.B}</b>, each choose their ${g.c.what} at the same time, without talking to each other.`;
  }
  /* "If B chooses X, A earns $a with S0 and $b with S1, so A's best response is …" */
  function brLine(g, k, oth) {
    const b = br(g, k, oth);
    return `If ${name(g, 1 - k)} chooses <em>${g.s[oth]}</em>, ${name(g, k)} earns ${mil(pay(g, k, 0, oth))} with ${g.s[0]} and ${mil(pay(g, k, 1, oth))} with ${g.s[1]}, so its best response is <b>${g.s[b]}</b>.`;
  }
  function brWork(g, k) { return brLine(g, k, 0) + "<br>" + brLine(g, k, 1); }
  function domText(g, k) {
    const d = dom(g, k);
    return d == null
      ? `${name(g, k)}'s best choice depends on what ${name(g, 1 - k)} does, so ${name(g, k)} has <b>no dominant strategy</b>.`
      : `${name(g, k)} does better with <b>${g.s[d]}</b> whatever ${name(g, 1 - k)} does, so ${g.s[d]} is ${name(g, k)}'s <b>dominant strategy</b>.`;
  }
  /* Why a cell is or is not a Nash equilibrium. */
  function cellWhy(g, i, j) {
    const aSw = br(g, 0, j) !== i, bSw = br(g, 1, i) !== j;
    const aTxt = `${g.A} would switch to ${g.s[1 - i]} (${mil(g.p[1 - i][j][0])} beats ${mil(g.p[i][j][0])})`;
    const bTxt = `${g.B} would switch to ${g.s[1 - j]} (${mil(g.p[i][1 - j][1])} beats ${mil(g.p[i][j][1])})`;
    if (aSw && bSw) return `Not an equilibrium: ${aTxt}, and ${bTxt}.`;
    if (aSw) return `Not an equilibrium: ${aTxt}.`;
    if (bSw) return `Not an equilibrium: ${bTxt}.`;
    return `This is a Nash equilibrium: neither firm can do better by switching on its own.`;
  }
  const NE_NUDGE = "A Nash equilibrium is a cell where <em>each</em> firm is already playing its best response to the other's choice. Find every best response first, then look for a cell where both best responses meet.";
  function neSol(g) {
    const ne = nash(g);
    const end = ne.length === 0
      ? "No cell has both firms best-responding at once, so there is <b>no Nash equilibrium in pure strategies</b>: from every cell, someone wants to switch."
      : ne.length === 1
        ? `Both best responses meet only at <b>(${cellName(g, ne[0][0], ne[0][1])})</b>, where ${cellPay(g, ne[0][0], ne[0][1])}.`
        : `Best responses meet in <b>two</b> cells: (${cellName(g, ne[0][0], ne[0][1])}) and (${cellName(g, ne[1][0], ne[1][1])}). The game has two Nash equilibria.`;
    return steps(NE_NUDGE, `${g.A} (rows):<br>${brWork(g, 0)}`, `${g.B} (columns):<br>${brWork(g, 1)}`, end);
  }
  /* MC options for "which cell(s) are Nash equilibria?" */
  function neChoice(g) {
    const ne = nash(g);
    const isNE = (i, j) => ne.some(c => c[0] === i && c[1] === j);
    const cells = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const NONE = "There is no Nash equilibrium in pure strategies";
    let right, wrong = [];
    if (ne.length === 1) {
      right = cellName(g, ne[0][0], ne[0][1]);
      wrong = cells.filter(c => !isNE(c[0], c[1])).map(c => ({ t: cellName(g, c[0], c[1]), why: cellWhy(g, c[0], c[1]) }));
      wrong.push({ t: NONE, why: `(${cellName(g, ne[0][0], ne[0][1])}) is an equilibrium: neither firm gains by switching alone from it.` });
    } else if (ne.length === 2) {
      right = `Two equilibria: (${cellName(g, ne[0][0], ne[0][1])}) and (${cellName(g, ne[1][0], ne[1][1])})`;
      wrong = ne.map(c => ({ t: cellName(g, c[0], c[1]), why: `This cell is an equilibrium, but it is not the only one: the game has two.` }));
      const off = U.pick(cells.filter(c => !isNE(c[0], c[1])));
      wrong.push({ t: cellName(g, off[0], off[1]), why: cellWhy(g, off[0], off[1]) });
      wrong.push({ t: NONE, why: `Check (${cellName(g, ne[0][0], ne[0][1])}): neither firm gains by switching alone, so it is an equilibrium.` });
    } else {
      right = NONE;
      wrong = cells.map(c => ({ t: cellName(g, c[0], c[1]), why: cellWhy(g, c[0], c[1]) }));
    }
    return { right, wrong };
  }

  /* ---- sequential games (game trees) ----
   * Leader picks a ∈ {0,1}; follower sees it and picks b ∈ {0,1}.
   * t.leaf[a][b] = [leader payoff, follower payoff]. */
  const SEQ_CTX = [
    { lm: ["Big plant", "Small plant"], fm: ["Enter", "Stay out"], story: (L, F) => `${L} decides first whether to build a big or a small plant. ${F}, a possible entrant, sees the plant and then decides whether to enter the market.` },
    { lm: ["Heavy ads", "Light ads"], fm: ["Heavy ads", "Light ads"], story: (L, F) => `${L} launches its ad campaign first. ${F} sees how heavy it is and then picks its own campaign.` },
    { lm: ["Expand", "Hold"], fm: ["Expand", "Hold"], story: (L, F) => `${L} decides first whether to expand capacity. ${F} sees the decision and then makes its own.` },
    { lm: ["Premium model", "Budget model"], fm: ["Premium model", "Budget model"], story: (L, F) => `${L} announces first which new model it will launch. ${F} sees the announcement and then chooses its own model.` },
    { lm: ["High price", "Low price"], fm: ["High price", "Low price"], story: (L, F) => `${L} posts its price for the new season first. ${F} sees it and then sets its own price.` },
    { lm: ["Downtown", "Suburbs"], fm: ["Downtown", "Suburbs"], story: (L, F) => `${L} picks the location of its new store first. ${F} sees the choice and then picks where to open.` },
  ];
  function seqGame(test) {
    for (let t = 0; t < 20000; t++) {
      const c = U.pick(SEQ_CTX);
      const [L, F] = U.sample(FIRMS, 2);
      const lv = U.sample(PAY1, 4), fv = U.sample(PAY1, 4);
      const leaf = [[[lv[0], fv[0]], [lv[1], fv[1]]], [[lv[2], fv[2]], [lv[3], fv[3]]]];
      const fr = [0, 1].map(a => (leaf[a][0][1] > leaf[a][1][1] ? 0 : 1));
      const val = [0, 1].map(a => leaf[a][fr[a]][0]);
      const a = val[0] > val[1] ? 0 : 1;
      const s = { c, L, F, leaf, fr, val, a, b: fr[a] };
      if (test && !test(s)) continue;
      return s;
    }
    throw new Error("seqGame: no tree found");
  }
  const pathName = (s, a, b) => `${s.L}: ${s.c.lm[a]}, then ${s.F}: ${s.c.fm[b]}`;
  function tree(s, hide) {
    const W = 560, H = 236;
    const root = [280, 34], nodes = [[150, 112], [410, 112]], leaves = [[80, 186], [220, 186], [340, 186], [480, 186]];
    const v = (a, b, k) => (hide && hide.a === a && hide.b === b && hide.k === k ? "x" : U.money(s.leaf[a][b][k]));
    let o = `<svg class="graph" viewBox="0 0 ${W} ${H}" style="max-width:560px" role="img" aria-label="game tree: ${s.L} moves first, then ${s.F}" xmlns="http://www.w3.org/2000/svg">`;
    for (let a = 0; a < 2; a++) {
      const n = nodes[a];
      o += `<line class="g-axis" x1="${root[0]}" y1="${root[1]}" x2="${n[0]}" y2="${n[1]}"/>`;
      const mx = (root[0] + n[0]) / 2, my = (root[1] + n[1]) / 2;
      o += `<text class="g-label" x="${a ? mx + 8 : mx - 8}" y="${my - 4}" text-anchor="${a ? "start" : "end"}">${s.c.lm[a]}</text>`;
      for (let b = 0; b < 2; b++) {
        const lf = leaves[2 * a + b];
        o += `<line class="g-axis" x1="${n[0]}" y1="${n[1]}" x2="${lf[0]}" y2="${lf[1]}"/>`;
        const lx = (n[0] + lf[0]) / 2, ly = (n[1] + lf[1]) / 2;
        o += `<text class="g-label" x="${b ? lx + 7 : lx - 7}" y="${ly}" text-anchor="${b ? "start" : "end"}">${s.c.fm[b]}</text>`;
        o += `<circle class="g-pt g-pt-hollow" cx="${lf[0]}" cy="${lf[1]}" r="4"/>`;
        o += `<text class="g-ptlabel" x="${lf[0]}" y="${lf[1] + 24}" text-anchor="middle" style="font-size:12.5px">${s.L}: ${v(a, b, 0)}</text>`;
        o += `<text class="g-ptlabel" x="${lf[0]}" y="${lf[1] + 42}" text-anchor="middle" style="font-size:12.5px">${s.F}: ${v(a, b, 1)}</text>`;
      }
      o += `<circle class="g-pt" cx="${n[0]}" cy="${n[1]}" r="5"/>`;
      o += `<text class="g-ptlabel" x="${a ? n[0] + 9 : n[0] - 9}" y="${n[1] - 9}" text-anchor="${a ? "start" : "end"}">${s.F}</text>`;
    }
    o += `<circle class="g-pt" cx="${root[0]}" cy="${root[1]}" r="5"/>`;
    o += `<text class="g-ptlabel" x="${root[0]}" y="${root[1] - 12}" text-anchor="middle">${s.L}</text>`;
    return o + `</svg>`;
  }
  const treeNote = s => `<small>Payoffs are profits in millions of dollars. ${s.L} moves first; ${s.F} sees that move before choosing.</small><br>`;
  function folLine(s, a) {
    const l = s.leaf[a];
    return `After <em>${s.c.lm[a]}</em>, ${s.F} gets ${mil(l[0][1])} from ${s.c.fm[0]} and ${mil(l[1][1])} from ${s.c.fm[1]}, so it picks <b>${s.c.fm[s.fr[a]]}</b> (leaving ${s.L} ${mil(s.val[a])}).`;
  }
  function seqSol(s) {
    return steps("Backward induction: start at the <em>last</em> move. For each of the leader's choices, find what the follower will do.",
      folLine(s, 0) + "<br>" + folLine(s, 1),
      `${s.L} compares what it actually ends up with: ${mil(s.val[0])} from ${s.c.lm[0]} versus ${mil(s.val[1])} from ${s.c.lm[1]}. It chooses <b>${s.c.lm[s.a]}</b>.`,
      `Equilibrium path: <b>${pathName(s, s.a, s.b)}</b>, with ${s.L} earning ${mil(s.leaf[s.a][s.b][0])} and ${s.F} earning ${mil(s.leaf[s.a][s.b][1])}.`);
  }

  /* ---- static examples used in the lessons ---- */
  const exTree = {
    c: { lm: ["Big launch", "Small launch"], fm: ["Fight", "Accommodate"] }, L: "Halcyon", F: "Juniper",
    leaf: [[[3, 2], [10, 4]], [[4, 6], [6, 5]]], fr: [1, 0], val: [10, 4], a: 0, b: 1,
  };
  const yrs = v => (v === 0 ? "goes free" : `${v} ${U.plural(v, "year")}`);
  const yrsN = v => (v === 0 ? "no prison time" : `${v} ${U.plural(v, "year")}`);

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "What makes a market an oligopoly",
      lo: "Define and explain the characteristics of oligopolies.",
      html: `<p>An <b>oligopoly</b> is a market dominated by a <b>handful of large sellers</b>. Because there are so few of them, each firm knows that whatever it does with its price, output, quality or advertising will be noticed by its rivals, and that they are likely to respond. That awareness is what sets oligopoly apart from every other market structure.</p>
<p>The typical features:</p>
<ul>
  <li><b>A small number of firms</b>, each holding a big share of sales.</li>
  <li><b>Price searchers.</b> Each firm has some market power: it chooses a price rather than taking one from the market.</li>
  <li><b>High barriers to entry</b>, which keep the number of firms small. Two common sources are <b>economies of scale</b> (average cost keeps falling until output is huge, so only a few big producers fit in the market) and <b>government barriers</b> (licenses, permits, patents, spectrum rights).</li>
  <li><b>Similar or differentiated products.</b> Steel and cement are nearly identical across sellers; cars and smartphones are differentiated. Both can be oligopolies.</li>
  <li><b>Mergers.</b> Many oligopolies grew through mergers. A <b>horizontal merger</b> joins two competitors at the same stage of production (two airlines). A <b>vertical merger</b> joins firms at different stages of the same supply chain (a car maker buying its steel supplier).</li>
  <li><b>Interdependence</b>, also called <b>strategic dependence</b>: one firm's move on price, quality or advertising may be countered by its rivals' reactions, so no firm can choose its best action without predicting theirs.</li>
</ul>
<table class="data-tbl"><thead><tr><th></th><th>Perfect competition</th><th>Monopolistic competition</th><th>Oligopoly</th><th>Monopoly</th></tr></thead><tbody>
<tr><td>Number of sellers</td><td>Very many</td><td>Many</td><td>Few</td><td>One</td></tr>
<tr><td>Product</td><td>Identical</td><td>Differentiated</td><td>Identical or differentiated</td><td>No close substitutes</td></tr>
<tr><td>Entry</td><td>Easy</td><td>Easy</td><td>Hard</td><td>Blocked</td></tr>
<tr><td>Must watch rivals' reactions?</td><td>No</td><td>Barely</td><td><b>Yes</b></td><td>No rivals</td></tr>
</tbody></table>
<p><b>Efficiency.</b> Because each oligopolist has some market power and can push its price above what a competitive market would charge, oligopoly creates some <b>inefficiency in resource allocation</b>. That power is limited, though, when domestic firms must compete with <b>foreign producers</b> selling in the same market.</p>
<div class="keyidea"><b>Key idea.</b> The defining feature of oligopoly is <b>strategic dependence</b>: with only a few rivals, each firm's best choice depends on how the others will react.</div>
<div class="example"><b>Example.</b> Three companies make nearly all the country's railway signaling equipment. A new plant costs over a billion dollars and must be certified by safety regulators, so entry is rare (economies of scale plus a government barrier). When one of them, Granite, considers a 5% price cut on a major contract, its managers spend most of the meeting predicting whether the other two will match. If they do, Granite gains few extra orders and simply earns less on each one.</div>
<div class="trap"><b>Common trap.</b> "Few firms" does not mean "identical products". Oligopolies can sell differentiated goods (cars, phones, breakfast cereals). What matters is that there are few sellers who must react to each other, not what the product looks like.</div>`,
      gens: ["b251-m12-traits"],
    },
    {
      title: "Strategic behavior and the language of game theory",
      lo: "Explain how strategic behavior and game theory affect the oligopoly's profit-maximizing decision.",
      html: `<p>A monopolist or a perfectly competitive firm can find its best output by looking only at its own costs and the demand it faces. An oligopolist cannot: its demand depends on what its rivals do. The way one oligopolist responds when a rival changes its price, output or quality is called its <b>reaction function</b>.</p>
<p><b>Game theory</b> is the tool for analysing situations like this, where two or more decision makers know their choices affect each other and plan with that in mind. Every game has four components:</p>
<ul>
  <li><b>Players</b>: the decision makers (here, the firms).</li>
  <li><b>Strategies</b>: the choices or actions each player can take (high or low price, heavy or light advertising).</li>
  <li><b>Information</b>: what each player knows when it decides, including whether it has seen the others' moves.</li>
  <li><b>Payoffs</b>: the outcome each player gets from every combination of choices (profit, market share, years in jail).</li>
</ul>
<p>Games are classified in three ways:</p>
<table class="data-tbl"><thead><tr><th>Question</th><th>Types</th></tr></thead><tbody>
<tr><td>Do the players work together?</td><td><b>Cooperative</b>: they explicitly agree and coordinate to make themselves better off. <b>Noncooperative</b>: they neither negotiate nor cooperate.</td></tr>
<tr><td>When do they move?</td><td><b>Simultaneous</b>: at the same time, or without knowing the other's choice. <b>Sequential</b>: in turn, with later players seeing earlier moves.</td></tr>
<tr><td>What happens to the group's total?</td><td><b>Zero-sum</b>: one player's gains exactly equal the others' losses. <b>Negative-sum</b>: the players as a group end up worse off. <b>Positive-sum</b>: the group ends up better off.</td></tr>
</tbody></table>
<p>A <b>strategy</b> is a rule for making a choice. A <b>dominant strategy</b> is one that gives a player the highest payoff <em>no matter what</em> the other players do. When a firm has one, its decision is easy: it does not need to guess its rival's move.</p>
<div class="keyidea"><b>Key idea.</b> In oligopoly, profit maximization becomes a game: each firm's best price or output depends on its prediction of the others' choices, so firms think strategically instead of just setting MR = MC on a demand curve they take as given.</div>
<div class="example"><b>Example.</b> Two ferry companies serve the same island. <em>Players</em>: the two companies. <em>Strategies</em>: run an extra evening sailing or not. <em>Information</em>: each must publish its summer timetable before seeing the other's (a simultaneous game). <em>Payoffs</em>: each company's summer profit. If both add sailings, they split the same passengers and each burns extra fuel, so the pair ends up with less total profit than before: a negative-sum outcome.</div>
<div class="trap"><b>Common trap.</b> "Zero-sum" is not a synonym for "competitive". Most business rivalries are not zero-sum: a price war can shrink both firms' profits (negative-sum), and trade or shared research can raise both (positive-sum). Zero-sum means the gains and losses cancel <em>exactly</em>.</div>`,
      gens: ["b251-m12-basics"],
    },
    {
      title: "How to solve a 2×2 game, step by step",
      lo: "Solve oligopoly games using best responses, dominant strategies and Nash equilibrium.",
      html: `<p>A <b>payoff matrix</b> shows every combination of the players' choices. In this course each cell lists <em>both</em> payoffs with the player's name, e.g. "Kestrel: $9, Marlow: $4". One player chooses a <b>row</b>, the other a <b>column</b>. Read carefully: a player can only choose its own strategy, so it compares <em>its own</em> payoffs while holding the rival's choice fixed.</p>
<p><b>The method.</b></p>
<ol>
  <li><b>Row player's best responses.</b> Fix the column (the rival's choice). Compare the row player's payoff in the two rows and mark the larger one. Repeat for the other column.</li>
  <li><b>Column player's best responses.</b> Fix the row. Compare the column player's payoff in the two columns and mark the larger. Repeat for the other row.</li>
  <li><b>Dominant strategies.</b> If a player's best response is the same strategy in both cases, that strategy is <b>dominant</b>.</li>
  <li><b>Nash equilibrium.</b> Any cell where <em>both</em> payoffs are marked is a <b>Nash equilibrium</b>: each player is doing the best it can given what the other does, so neither wants to switch on its own. A game can have one equilibrium, two, or none in pure strategies.</li>
</ol>
<div class="example"><b>Example.</b> Two coffee chains decide whether to launch a loyalty app (monthly profit, $ thousands; Kestrel picks a row, Marlow a column):
<table class="data-tbl"><thead><tr><th></th><th>Marlow: Launch app</th><th>Marlow: Skip app</th></tr></thead><tbody>
<tr><th>Kestrel: Launch app</th><td>Kestrel: $9<br>Marlow: $4</td><td>Kestrel: $12<br>Marlow: $6</td></tr>
<tr><th>Kestrel: Skip app</th><td>Kestrel: $7<br>Marlow: $8</td><td>Kestrel: $10<br>Marlow: $5</td></tr>
</tbody></table>
<b>Step 1 (Kestrel).</b> If Marlow launches: 9 vs 7, so launch. If Marlow skips: 12 vs 10, so launch. <b>Step 2 (Marlow).</b> If Kestrel launches: 4 vs 6, so skip. If Kestrel skips: 8 vs 5, so launch. <b>Step 3.</b> Kestrel has a dominant strategy (Launch); Marlow does not. <b>Step 4.</b> Marlow can predict that Kestrel will launch, and its best response to that is to skip. The only cell where both are best-responding is <b>Kestrel launches, Marlow skips</b> ($12 thousand and $6 thousand). Check: from there, Kestrel switching would drop it to $10 and Marlow switching would drop it to $4.</div>
<div class="keyidea"><b>Key idea.</b> A Nash equilibrium is a cell from which <em>no player can gain by changing its own choice alone</em>. If both players have dominant strategies, the equilibrium is simply where those strategies meet.</div>
<div class="trap"><b>Common trap.</b> A dominant strategy is <em>not</em> "the row with my biggest number". Kestrel's largest payoff ($12) only happens if Marlow skips. Dominance means winning the comparison in <em>every</em> column, one column at a time. And when you find a player's best response, compare that player's own payoffs; reading the rival's number is the most common slip.</div>`,
      gens: ["b251-m12-dominant", "b251-m12-nash"],
    },
    {
      title: "The prisoners' dilemma and collusion",
      lo: "Solve the prisoners' dilemma and explain why collusive agreements tend to break down.",
      html: `<p>In the classic <b>prisoners' dilemma</b>, two suspects are questioned in separate rooms and cannot cooperate. Suppose: if both stay silent, each serves 2 years; if both confess, each serves 5; if only one confesses, that one serves 1 year and the silent partner serves 10. Whatever the partner does, confessing means less time (1 &lt; 2 and 5 &lt; 10), so <b>confess is a dominant strategy</b> for each. The Nash equilibrium is <em>both confess</em>, 5 years each, even though <em>both silent</em> (2 years each) would be better for both. (Here lower numbers are better: watch the units.)</p>
<p>The same structure appears whenever oligopolists try to <b>collude</b>, that is, to act together like a monopoly by fixing a high price or restricting output. A group of firms that formally agrees to do this is a <b>cartel</b>.</p>
<div class="example"><b>Example.</b> Two regional cement makers each pick a high or low price (yearly profit, $ millions):
<table class="data-tbl"><thead><tr><th></th><th>Oakridge: High price</th><th>Oakridge: Low price</th></tr></thead><tbody>
<tr><th>Northgate: High price</th><td>Northgate: $9<br>Oakridge: $9</td><td>Northgate: $2<br>Oakridge: $13</td></tr>
<tr><th>Northgate: Low price</th><td>Northgate: $13<br>Oakridge: $2</td><td>Northgate: $5<br>Oakridge: $5</td></tr>
</tbody></table>
For Northgate, Low beats High whether Oakridge is high (13 &gt; 9) or low (5 &gt; 2), and the same holds for Oakridge. Both cut prices and earn $5 million each. Had they both kept prices high they would earn $9 million each: that outcome maximizes their joint profit and is <b>Pareto optimal</b> (no one can be made better off without making someone worse off). But it is not an equilibrium: each firm could earn $13 million by undercutting a rival that keeps its price high.</div>
<p>That is why cartels are <b>unstable</b>. Even after agreeing to keep prices high, each member gains by secretly cheating, and in a one-time game nothing stops it. In the United States, explicit price-fixing agreements are also illegal under antitrust law, so firms cannot sign enforceable contracts to stick together.</p>
<p><b>Changing the payoffs.</b> Firms can make cheating less attractive. With a <b>price-match guarantee</b>, a firm that keeps its price high promises its customers it will match any lower price. A rival that cuts its price then wins few extra customers. In the cement example, the off-diagonal payoffs might become Northgate $4, Oakridge $6 (and the mirror image). Now each firm's best response to High is High (9 &gt; 6), and to Low is Low (5 &gt; 4). <em>Both High</em> becomes a Nash equilibrium (alongside <em>both Low</em>), so the high-price outcome can sustain itself.</p>
<div class="keyidea"><b>Key idea.</b> In a prisoners' dilemma, each player has a dominant strategy, and the resulting Nash equilibrium is worse for <em>both</em> than another outcome. Individually rational choices produce a collectively bad result.</div>
<div class="trap"><b>Common trap.</b> The dilemma does not happen because the players are foolish or because they can't talk. Even if the firms meet and promise to keep prices high, each still has a dominant incentive to break the promise. Communication without enforcement changes nothing.</div>`,
      gens: ["b251-m12-pd"],
    },
    {
      title: "Repeated games: tit-for-tat, price leadership and price wars",
      lo: "Explain how repeated interaction, tit-for-tat, price leadership and price wars shape oligopoly behavior.",
      html: `<p>The one-shot prisoners' dilemma assumes <b>opportunistic behavior</b>: grabbing the short-run gain while ignoring the long-run benefits of cooperation. That is not very realistic for oligopolies, because the same few firms face each other <b>again and again</b>: every week's prices are another round of the game.</p>
<p>Repetition changes the math. A firm that cheats today earns a one-time bonus, but if its rival responds by cheating in every later round, it gives up the cooperative profit for the rest of the game. A popular strategy is <b>tit-for-tat</b>: cooperate in the first round, then do whatever the rival did in the previous round. Cooperation continues as long as the rival keeps cooperating; cheating is punished right away; and a rival that returns to cooperation is forgiven one round later.</p>
<div class="example"><b>Example.</b> Two firms play the cement game above for 6 years. Oakridge uses tit-for-tat; H means a high price and L a low price.
<table class="data-tbl"><thead><tr><th>Year</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr></thead><tbody>
<tr><th>Northgate</th><td>H</td><td>L</td><td>H</td><td>H</td><td>L</td><td>H</td></tr>
<tr><th>Oakridge (tit-for-tat)</th><td>H</td><td>H</td><td>L</td><td>H</td><td>H</td><td>L</td></tr>
</tbody></table>
If Northgate cheats every year against tit-for-tat, it earns 13 + 5 × 5 = $38 million over the six years. If it cooperates every year it earns 6 × 9 = $54 million. Over a long horizon, cheating does not pay.</div>
<p>Two other patterns are common in oligopolies:</p>
<ul>
  <li><b>Price leadership</b>: the largest firm publishes its price list first and the others match it. Rivals coordinate on a price without a formal agreement.</li>
  <li><b>Price war</b>: firms cut prices again and again, each trying to drive competitors out of the market. Profits fall for everyone while it lasts.</li>
</ul>
<p>Cooperation is easier to sustain when firms interact repeatedly with no known end date, when cheating is quickly spotted, when punishment is credible, and when there are only a few firms. It breaks down when the game is played once (or is about to end), when secret discounts are hard to detect, or when there are many firms.</p>
<div class="keyidea"><b>Key idea.</b> Repetition lets firms reward cooperation and punish cheating, so the high-profit outcome that is impossible in a one-shot dilemma can be sustained in a repeated one.</div>
<div class="trap"><b>Common trap.</b> Tit-for-tat copies the rival's <em>previous</em> move, not its current one. It never cheats first, and it does not punish forever: once the rival cooperates again, tit-for-tat cooperates in the next round.</div>`,
      gens: ["b251-m12-repeat"],
    },
    {
      title: "Sequential games and backward induction",
      lo: "Solve sequential (extensive-form) games by backward induction.",
      html: `<p>When firms move in turn and the later firm sees what the earlier one did, the game is drawn as a <b>game tree</b> (the extensive form). The first mover (the <b>leader</b>) picks a branch, then the second mover (the <b>follower</b>) picks a branch from where it is; the payoffs sit at the ends of the branches.</p>
<p>Solve it by <b>backward induction</b>: start at the end and work to the beginning. It works best with full information, when every player knows all the payoffs.</p>
<ol>
  <li>At each of the follower's decision points, find the branch that gives the <b>follower</b> the higher payoff.</li>
  <li>Replace each decision point by the outcome the follower will choose.</li>
  <li>The leader now compares those predicted outcomes and picks the branch that gives <b>it</b> the higher payoff.</li>
</ol>
${tree(exTree)}
<div class="example"><b>Example.</b> Halcyon is entering a new city with a big or a small launch; Juniper, the incumbent, then fights (deep discounts) or accommodates. After a <em>big launch</em>, Juniper gets $2 million by fighting and $4 million by accommodating, so it accommodates (Halcyon gets $10 million). After a <em>small launch</em>, Juniper gets $6 million by fighting and $5 million by accommodating, so it fights (Halcyon gets $4 million). Halcyon compares $10 million with $4 million and chooses the big launch. The equilibrium is <b>big launch, then accommodate</b>: $10 million for Halcyon, $4 million for Juniper.</div>
<div class="keyidea"><b>Key idea.</b> The leader does not get to pick any ending it likes. It chooses among the outcomes the follower will <em>actually</em> choose, so it must solve the follower's problem first.</div>
<div class="trap"><b>Common trap.</b> Don't start at the top by picking the leader's biggest number. In the example, the small launch would only be attractive to Halcyon if Juniper accommodated, and Juniper won't. Always begin at the last move.</div>`,
      gens: ["b251-m12-seq"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m12-c-oligopoly", tag: "Definition", front: "What is an <em>oligopoly</em>?", back: "A market with <b>very few dominant sellers</b>, each of which knows its rivals will react to its changes in price, output, quality or advertising." },
    { id: "b251-m12-c-traits", tag: "Definition", front: "List the main characteristics of oligopoly.", back: "Small number of firms; price searchers; high barriers to entry (economies of scale, government barriers); similar <em>or</em> differentiated products; growth through mergers; interdependence (strategic dependence)." },
    { id: "b251-m12-c-strategic", tag: "Definition", front: "What is <em>strategic dependence</em>?", back: "A situation in which one firm's moves on price, quality, advertising and so on may be <b>countered by the reactions of its rivals</b>, so each firm's best choice depends on what the others will do." },
    { id: "b251-m12-c-barriers", tag: "Example", front: "Give two sources of the high barriers to entry in oligopoly.", back: "<b>Economies of scale</b> (average cost keeps falling to very high output, so only a few big firms fit) and <b>government barriers</b> (licenses, permits, patents, spectrum rights)." },
    { id: "b251-m12-c-mergers", tag: "Distinction", front: "Horizontal merger vs vertical merger?", back: "<b>Horizontal</b>: two competitors at the same stage join (two airlines). <b>Vertical</b>: firms at different stages of one supply chain join (a car maker buys its steel supplier)." },
    { id: "b251-m12-c-ineff", tag: "Principle", front: "Why does oligopoly cause some inefficiency, and what limits it?", back: "Each firm has <b>market power</b> and can affect the price, which misallocates resources somewhat. Competition from <b>foreign firms</b> limits that power." },
    { id: "b251-m12-c-reaction", tag: "Definition", front: "What is a <em>reaction function</em>?", back: "The way one oligopolist <b>responds</b> to a change in price, output or quality made by another oligopolist in the industry." },
    { id: "b251-m12-c-gametheory", tag: "Definition", front: "What is <em>game theory</em>, and what are its four components?", back: "A way of describing the possible outcomes when interacting decision makers know their choices affect each other and plan accordingly. Components: <b>players, strategies, information, payoffs</b>." },
    { id: "b251-m12-c-coop", tag: "Distinction", front: "Cooperative vs noncooperative game?", back: "<b>Cooperative</b>: players explicitly cooperate (agree and coordinate) to make themselves better off. <b>Noncooperative</b>: players neither negotiate nor cooperate in any way." },
    { id: "b251-m12-c-simseq", tag: "Distinction", front: "Simultaneous vs sequential game?", back: "<b>Simultaneous</b>: players move at the same time or without knowing the other's choice. <b>Sequential</b>: players move in order, and later players see earlier moves." },
    { id: "b251-m12-c-sums", tag: "Distinction", front: "Zero-sum vs negative-sum vs positive-sum game?", back: "<b>Zero-sum</b>: gains exactly offset losses. <b>Negative-sum</b>: the players as a group lose. <b>Positive-sum</b>: the players as a group gain." },
    { id: "b251-m12-c-dominant", tag: "Definition", front: "What is a <em>dominant strategy</em>?", back: "A strategy that gives a player the <b>highest payoff no matter what</b> the other players do." },
    { id: "b251-m12-c-dom-trap", tag: "Example", front: "Is the row containing your single largest payoff always your dominant strategy?", back: "<b>No.</b> That payoff may need the rival to cooperate. A strategy is dominant only if it beats the alternative in <em>every</em> column, compared one column at a time." },
    { id: "b251-m12-c-bestresp", tag: "Method", front: "How do you find a player's best response in a payoff matrix?", back: "Fix the rival's choice, then compare <b>the player's own</b> payoffs across its strategies and take the larger. Repeat for each of the rival's choices." },
    { id: "b251-m12-c-nash", tag: "Definition", front: "What is a <em>Nash equilibrium</em>?", back: "An outcome where each player makes its best choice given the others' choices, so <b>no one can gain by switching alone</b>. It need not give the best total payoff." },
    { id: "b251-m12-c-ne-count", tag: "Principle", front: "How many Nash equilibria can a 2×2 game have (in pure strategies)?", back: "<b>One, two or none.</b> If both players have dominant strategies there is exactly one; a coordination game can have two; some games have none." },
    { id: "b251-m12-c-pareto", tag: "Definition", front: "What is a <em>Pareto-optimal</em> outcome?", back: "One where nobody can be made better off without making someone else worse off. In a prisoners' dilemma, mutual cooperation is Pareto optimal but the Nash equilibrium is not." },
    { id: "b251-m12-c-pd", tag: "Definition", front: "What makes a game a <em>prisoners' dilemma</em>?", back: "Each player has a <b>dominant strategy</b> (cheat/confess), but when both play it the result is <b>worse for both</b> than if both had cooperated." },
    { id: "b251-m12-c-cartel", tag: "Principle", front: "Why are cartels and collusive agreements unstable?", back: "Each member can raise its own profit by <b>secretly cheating</b> (cutting price or expanding output) while the others stick to the deal. Cheating is a dominant strategy in the one-shot game, and price-fixing agreements are illegal in the US, so they can't be enforced in court." },
    { id: "b251-m12-c-opportunistic", tag: "Definition", front: "What is <em>opportunistic behavior</em>?", back: "Actions that focus only on <b>short-run gains</b> and ignore the long-run benefits of cooperation. It fits a one-shot noncooperative game, but firms usually deal with each other repeatedly." },
    { id: "b251-m12-c-tft", tag: "Definition", front: "What is a <em>tit-for-tat</em> strategy?", back: "Cooperate in the first round, then copy what the rival did in the <b>previous</b> round. Cooperation continues as long as the other player keeps cooperating." },
    { id: "b251-m12-c-repeat", tag: "Principle", front: "Why can cooperation survive in a repeated game but not a one-shot one?", back: "A cheater gains once but is punished in later rounds (e.g. by tit-for-tat). If the game lasts long enough, the stream of lost cooperative profit outweighs the one-time gain." },
    { id: "b251-m12-c-leader", tag: "Definition", front: "What is <em>price leadership</em>?", back: "The largest firm publishes its prices first and its rivals then <b>match</b> them: coordination without a formal agreement." },
    { id: "b251-m12-c-pricewar", tag: "Definition", front: "What is a <em>price war</em>?", back: "A campaign of <b>repeated price cuts</b> designed to drive competing firms out of the market." },
    { id: "b251-m12-c-pricematch", tag: "Example", front: "How can a price-match guarantee help firms keep prices high?", back: "It cuts the reward for undercutting: a rival that lowers its price wins few customers because the high-price firm matches it. Both-high can then become a Nash equilibrium." },
    { id: "b251-m12-c-backward", tag: "Method", front: "What is <em>backward induction</em>?", back: "Solving a sequential game by starting at the <b>last</b> move: find the follower's best reply at each decision point, then let the leader choose among those predicted outcomes." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "“a few firms dominate”, “each watches its rivals”, “huge plants”", think: "Oligopoly", why: "Few sellers, high barriers and strategic dependence are its hallmarks." },
    { when: "“will rivals match the cut?”, “how will they react?”", think: "Strategic dependence / reaction function", why: "An oligopolist's best move depends on its rivals' responses." },
    { when: "“best no matter what the other does”", think: "Dominant strategy", why: "It wins the comparison for every choice the rival could make." },
    { when: "“no one wants to change on their own”", think: "Nash equilibrium", why: "Each player is best-responding to the others." },
    { when: "“both would be better off if they cooperated, but each cheats”", think: "Prisoners' dilemma", why: "Dominant strategies lead to an outcome worse for both." },
    { when: "“agree to fix prices”, “cartel”, “restrict output together”", think: "Collusion (unstable)", why: "Each member gains by secretly cheating; explicit price fixing is illegal in the US." },
    { when: "“starts by cooperating, then copies the rival's last move”", think: "Tit-for-tat", why: "Rewards cooperation and punishes cheating one round later." },
    { when: "“largest firm announces, others follow”", think: "Price leadership", why: "Rivals match the leader's posted price without a formal agreement." },
    { when: "“slash prices again and again to drive rivals out”", think: "Price war", why: "Repeated cuts aimed at pushing competitors out of the market." },
    { when: "“one firm moves first, the other sees it”", think: "Sequential game → backward induction", why: "Solve the last move first, then the first mover's choice." },
    { when: "“one player's gain is exactly the other's loss”", think: "Zero-sum game", why: "Group total is unchanged; compare negative- and positive-sum." },
    { when: "“grab the gain now, ignore the future”", think: "Opportunistic behavior", why: "Short-run focus that ignores the payoff from long-run cooperation." },
  ];

  /* ============================================================
   * PRACTICE 1 — Oligopoly characteristics
   * ============================================================ */
  const PC = "Perfect competition", MCOMP = "Monopolistic competition", OLI = "Oligopoly", MONO = "Monopoly";
  const MARKET_BANK = [
    { t: "Thousands of wheat farms sell an identical crop, and each must accept the market price.", cat: PC },
    { t: "Hundreds of egg farms sell identical grade-A eggs; anyone can start a farm, and no farm can move the price.", cat: PC },
    { t: "Countless fishing boats sell the same kind of cod at the dockside auction price.", cat: PC },
    { t: "Many currency traders sell an identical currency, and no single trader can move the exchange rate.", cat: PC },
    { t: "Huge numbers of small growers sell standard-grade corn, entering and leaving the market freely.", cat: PC },
    { t: "Dozens of restaurants in a college town, each with its own menu and atmosphere; opening a new one is fairly easy.", cat: MCOMP },
    { t: "Many hair salons in a city compete on style and location, and new salons open every year.", cat: MCOMP },
    { t: "Hundreds of clothing boutiques sell slightly different styles, and entry is easy.", cat: MCOMP },
    { t: "Many coffee shops in a city, each with its own blends and atmosphere, and few obstacles to opening another.", cat: MCOMP },
    { t: "Numerous dental practices in a metro area, each differentiated by location and hours.", cat: MCOMP },
    { t: "Three companies supply nearly all of a country's jet engines, and a new plant costs billions.", cat: OLI },
    { t: "Four national cell-phone carriers serve almost every customer, and each studies the others' plans before changing its own prices.", cat: OLI },
    { t: "A handful of cement producers serve a region; their huge kilns give big economies of scale.", cat: OLI },
    { t: "Two firms build most of the world's large passenger aircraft.", cat: OLI },
    { t: "Five breweries make most of the beer sold nationally, and each answers the others' advertising campaigns.", cat: OLI },
    { t: "Three companies make nearly all video-game consoles and time their launches around each other's.", cat: OLI },
    { t: "Three railroads own almost all the freight track in a region, and new track needs government approval.", cat: OLI },
    { t: "The only water utility in a city, protected by an exclusive government franchise.", cat: MONO },
    { t: "A drug company holds the patent on the only treatment for a rare disease.", cat: MONO },
    { t: "A single firm owns the only known source of a mineral used in medical scanners.", cat: MONO },
    { t: "The only electricity distributor in a rural county, with no close substitutes.", cat: MONO },
    { t: "A toll bridge that is the only river crossing for 60 miles.", cat: MONO },
  ];
  const MARKET_WHY = {
    [PC]: "Very many sellers of an identical product, easy entry, and every firm takes the price as given: perfect competition.",
    [MCOMP]: "Many sellers of differentiated products with easy entry: monopolistic competition. No firm needs to worry about one particular rival's reaction.",
    [OLI]: "A few dominant sellers, high barriers to entry, and each firm must consider its rivals' reactions: oligopoly.",
    [MONO]: "A single seller with no close substitutes and blocked entry: monopoly.",
  };
  const TRAIT_BANK = [
    { t: "There are only a few firms, each with a large share of the market.", ok: true },
    { t: "Each firm's best decision depends on how its rivals will react.", ok: true },
    { t: "Each firm is a price searcher with some control over its price.", ok: true },
    { t: "Entry is difficult because of barriers such as economies of scale or government restrictions.", ok: true },
    { t: "The firms may sell identical products or differentiated ones.", ok: true },
    { t: "Firms often grow through horizontal or vertical mergers.", ok: true },
    { t: "Each firm is a price taker that cannot affect the market price.", ok: false, why: "That describes perfect competition. Oligopolists have market power and are price searchers." },
    { t: "Firms can enter and leave the industry freely in the long run.", ok: false, why: "Oligopolies are protected by high barriers to entry." },
    { t: "Each firm can ignore its rivals because its decisions do not affect them.", ok: false, why: "The opposite: strategic dependence is the defining feature of oligopoly." },
    { t: "There is a single seller with no close substitutes.", ok: false, why: "That is monopoly. Oligopoly has a few sellers." },
    { t: "The firms' products must be identical.", ok: false, why: "Oligopolies can sell differentiated products too (cars, phones)." },
    { t: "There are so many sellers that each has a tiny share of the market.", ok: false, why: "That describes perfect or monopolistic competition, not a market dominated by a few firms." },
    { t: "The firms' products must be differentiated.", ok: false, why: "Oligopolies can also sell nearly identical products (steel, cement)." },
  ];
  const ES = "Economies of scale", GOV = "Government barrier", HM = "Horizontal merger", VM = "Vertical merger";
  const BARRIER_BANK = [
    { t: "Average cost keeps falling until a steel mill makes several million tons a year, so only a few mills fit in the market.", cat: ES, why: "Low costs only at huge output are economies of scale." },
    { t: "A chip plant costs $15 billion to build, so only firms with enormous sales can cover the cost.", cat: ES, why: "A huge fixed cost spread over large output is an economy of scale." },
    { t: "Spreading the cost of a national delivery network over billions of parcels gives the big carriers a cost edge.", cat: ES, why: "Lower average cost from very high volume is an economy of scale." },
    { t: "A cement kiln is efficient only at very high volume, so a small newcomer would have much higher unit costs.", cat: ES, why: "Unit costs that fall with scale are economies of scale." },
    { t: "A city issues only two licenses to run taxi fleets at its airport.", cat: GOV, why: "A government license limit is a government barrier." },
    { t: "Federal regulators must approve any new airline before it may carry passengers.", cat: GOV, why: "Required government approval is a government barrier." },
    { t: "A firm holds the patent on a key battery technology that rivals cannot copy for 20 years.", cat: GOV, why: "A patent is a government-granted barrier." },
    { t: "A state requires a costly certificate before a new hospital may open.", cat: GOV, why: "Government certification rules are a government barrier." },
    { t: "Only firms that win a government spectrum auction may offer mobile service.", cat: GOV, why: "Government-controlled licenses are a government barrier." },
    { t: "Two rival regional supermarket chains combine into one company.", cat: HM, why: "Competitors at the same stage joining is a horizontal merger." },
    { t: "One airline buys a competing airline that flies many of the same routes.", cat: HM, why: "Buying a direct competitor is a horizontal merger." },
    { t: "Two brewers merge, cutting the number of major brewers from five to four.", cat: HM, why: "Rivals in the same market joining is a horizontal merger." },
    { t: "A cell-phone carrier acquires one of its direct competitors.", cat: HM, why: "Buying a direct competitor is a horizontal merger." },
    { t: "A car maker buys the company that supplies its steel.", cat: VM, why: "Joining a supplier at an earlier stage of production is a vertical merger." },
    { t: "A streaming service buys the film studio that makes many of its shows.", cat: VM, why: "Buying a supplier in the same supply chain is a vertical merger." },
    { t: "A coffee chain buys the roasting plants that supply its beans.", cat: VM, why: "Joining a different stage of the same supply chain is a vertical merger." },
    { t: "A smartphone maker buys the factory that produces its screens.", cat: VM, why: "Buying a parts supplier is a vertical merger." },
  ];
  const MOVES = [
    { act: n => `cutting its price by 10%`, right: "How its rivals will respond: if they match the cut, the extra sales it hopes for will mostly disappear" },
    { act: n => `launching a big new ad campaign`, right: "How its rivals will respond: if they answer with campaigns of their own, the extra customers may never come" },
    { act: n => `adding a costly new feature to its product`, right: "How its rivals will respond: if they add the same feature, it may gain few customers and just raise its costs" },
    { act: n => `increasing its output by 20%`, right: "How its rivals will respond: if they also raise output, the market price could fall sharply" },
  ];
  const EFF_Q = [
    { q: "Compared with perfect competition, how does oligopoly allocate resources?",
      right: "Somewhat inefficiently, because each firm has market power and can affect the market price",
      wrong: [
        { t: "Perfectly efficiently, because the firms compete fiercely", why: "Oligopolists have market power, which creates some inefficiency." },
        { t: "Exactly like perfect competition, because each firm is a price taker", why: "Oligopolists are price searchers, not price takers." },
        { t: "It does not matter, because oligopolies produce no goods consumers want", why: "Not relevant: the issue is market power over price." },
      ] },
    { q: "Why might a U.S. oligopoly have less market power than its small number of domestic firms suggests?",
      right: "Because it may have to compete with foreign producers selling in the same market",
      wrong: [
        { t: "Because oligopolists are price takers", why: "They are price searchers. Foreign competition is what limits their power." },
        { t: "Because barriers to entry into oligopoly are low", why: "Barriers are high. The limit comes from foreign rivals." },
        { t: "Because the government sets every oligopolist's price", why: "Prices are generally set by the firms. Foreign competition limits their power." },
      ] },
    { q: "What gives an oligopolist the ability to influence the market price?",
      right: "Market power: it is one of only a few large sellers",
      wrong: [
        { t: "Being one of thousands of tiny sellers", why: "Tiny sellers in a crowded market have no power over price." },
        { t: "Selling a product that is identical to every rival's", why: "Identical products alone don't give power; having few sellers does." },
        { t: "Free entry into the industry", why: "Free entry erodes market power; oligopolies have high barriers." },
      ] },
  ];

  const genTraits = STUDY.makeGenerator({
    id: "b251-m12-traits",
    name: "Characteristics of oligopoly",
    blurb: "Recognize oligopolies, their barriers to entry and mergers, and the strategic dependence that sets them apart.",
    variants: [
      {
        name: "Classify market structures",
        make() {
          const cats = [PC, MCOMP, OLI, MONO];
          const items = cats.map(c => U.pick(MARKET_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m12-mkt", MARKET_BANK.filter(i => i.cat === OLI), 3)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Classify each market by its structure.",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: MARKET_WHY[i.cat] })),
            sol: steps("Ask three questions: how many sellers, how similar are the products, and how hard is entry?",
              "Very many sellers + identical product = perfect competition. Many sellers + differentiated product = monopolistic competition. One seller = monopoly.",
              "A <b>few</b> dominant sellers behind high barriers, each watching its rivals, is an oligopoly, whether the product is identical or differentiated."),
          });
        },
      },
      {
        name: "Which market is an oligopoly?",
        make() {
          const right = U.pick(MARKET_BANK.filter(i => i.cat === OLI));
          const wrong = [PC, MCOMP, MONO].map(c => { const w = U.pick(MARKET_BANK.filter(i => i.cat === c)); return { t: w.t, why: MARKET_WHY[c] }; });
          return Q.mc({
            q: "Which of these markets is best described as an <b>oligopoly</b>?",
            right: right.t, wrong,
            sol: steps("Look for a market with a <b>few</b> large sellers, high barriers to entry, and firms that must anticipate one another.",
              `“${right.t}” fits: a handful of firms and high barriers to entry.`),
          });
        },
      },
      {
        name: "Select all oligopoly characteristics",
        make() {
          const t = U.randInt(1, 4);
          const opts = U.sample(TRAIT_BANK.filter(o => o.ok), t).concat(U.sample(TRAIT_BANK.filter(o => !o.ok), 5 - t));
          return Q.multi({
            q: "Select <b>all</b> statements that describe a typical oligopoly.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why || "This is a standard feature of oligopoly." })),
            sol: steps("Oligopoly: few firms, price searchers, high barriers to entry, identical <em>or</em> differentiated products, mergers, and strategic dependence.",
              "Reject anything that describes perfect competition (price takers, many tiny sellers, free entry) or monopoly (a single seller)."),
          });
        },
      },
      {
        name: "Which is NOT a characteristic of oligopoly?",
        make() {
          const r = U.pick(TRAIT_BANK.filter(o => !o.ok));
          const wrong = U.sample(TRAIT_BANK.filter(o => o.ok), 3).map(o => ({ t: o.t, why: "This <em>is</em> a characteristic of oligopoly." }));
          return Q.mc({
            q: "Which statement is <b>NOT</b> a characteristic of oligopoly?",
            right: r.t, wrong, rightWhy: r.why,
            sol: steps("Run through the list: few firms, price searchers, high entry barriers, similar or differentiated products, mergers, strategic dependence.",
              `“${r.t}” does not belong. ${r.why}`),
          });
        },
      },
      {
        name: "Strategic dependence: what must the firm consider?",
        make() {
          const m = U.pick(MOVES);
          const g = shell();
          g.ind = U.pick(["airlines", "cement makers", "cell-phone carriers", "soft-drink makers", "steel mills", "memory-chip makers", "drug makers", "phone makers"]);
          const n = U.pick(["three", "four", "five"]);
          return Q.mc({
            q: `${g.A} is one of ${n} large ${g.ind} that together make almost all sales in the market. It is thinking about ${m.act(n)}. According to the idea of strategic dependence, what is the key question ${g.A} must answer first?`,
            right: m.right,
            wrong: [
              { t: "Nothing beyond its own costs, because rivals' choices don't affect its demand", why: "With only a few firms, rivals' reactions directly change the demand each firm faces." },
              { t: "Only the market price, because as a price taker it cannot change its own price", why: "Oligopolists are price searchers, not price takers." },
              { t: "Whether many new firms will rush in, because entry is easy", why: "Entry into oligopoly is hard; the threat that matters is the reaction of existing rivals." },
            ],
            sol: steps("Strategic dependence means a firm's move can be countered by its rivals' reactions.",
              `So ${g.A} must predict how the other ${g.ind} will respond. Its payoff depends on their reaction, not only on its own decision.`),
          });
        },
      },
      {
        name: "Barriers to entry and mergers",
        make() {
          const cats = [ES, GOV, HM, VM];
          const items = cats.map(c => U.pick(BARRIER_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m12-bar", BARRIER_BANK, 4)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Each item helps explain why an industry has only a few firms. Classify it.",
            cats, items,
            sol: steps("Economies of scale are about <em>costs</em> falling at high output; government barriers are <em>rules</em> (licenses, patents, approvals).",
              "A merger of two <b>competitors</b> is horizontal; a merger of a firm with its <b>supplier or customer</b> (a different stage of the supply chain) is vertical."),
          });
        },
      },
      {
        name: "Market power and efficiency",
        make() {
          const e = U.pick(EFF_Q);
          return Q.mc({
            q: e.q, right: e.right, wrong: e.wrong,
            sol: steps("Oligopolists are price searchers with some market power: each can affect the market price.",
              "That power creates some inefficiency in resource allocation, but it is limited when the firms face foreign competition."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 2 — Game-theory vocabulary & types of games
   * ============================================================ */
  const COMP_SCEN = [
    { Players: ["The two ferry companies serving the island"], Strategies: ["Adding an evening sailing or keeping the old schedule"], Information: ["Each must publish its timetable before seeing the other's"], Payoffs: ["The summer profit each company earns"] },
    { Players: ["Two rival bakeries on the same street"], Strategies: ["Opening on Sundays or staying closed"], Information: ["Neither knows the other's plan when it decides"], Payoffs: ["Each bakery's weekly profit"] },
    { Players: ["Two suspects questioned by detectives"], Strategies: ["Confessing or staying silent"], Information: ["They are held in separate rooms and cannot talk"], Payoffs: ["The number of years each serves in prison"] },
    { Players: ["The two cinemas in a small town"], Strategies: ["Charging $9 or $13 a ticket"], Information: ["Both set prices on Monday without seeing the other's"], Payoffs: ["The ticket revenue minus costs for each cinema"] },
    { Players: ["Two phone makers planning a launch"], Strategies: ["Launching in spring or in autumn"], Information: ["Each can see the other's announced date before choosing"], Payoffs: ["The market share each phone maker wins"] },
    { Players: ["The three largest cement producers in a region"], Strategies: ["Raising, holding or cutting the price per ton"], Information: ["Each learns the others' prices only after quarterly contracts are signed"], Payoffs: ["The quarterly profit each producer reports"] },
    { Players: ["A dominant airline and a would-be entrant on one route"], Strategies: ["For the airline: add flights or not; for the entrant: enter or stay out"], Information: ["The entrant can watch the airline's schedule before deciding"], Payoffs: ["Each airline's annual operating profit on the route"] },
    { Players: ["Two chip designers racing on a new processor"], Strategies: ["Spending heavily on research or keeping spending steady"], Information: ["Research budgets are kept secret until the products launch"], Payoffs: ["The profit each designer earns from the new processor"] },
  ];
  const COMP_WHY = {
    Players: "The decision makers are the players.",
    Strategies: "The possible choices or actions are the strategies.",
    Information: "What each player knows when it decides is the information.",
    Payoffs: "The outcome each player receives is the payoff.",
  };
  const COOP_BANK = [
    { t: "Two neighboring farms sign a binding contract to share one harvester and split the savings.", cat: "Cooperative" },
    { t: "Rival tech firms form a joint venture and agree on how to split the profits from a shared standard.", cat: "Cooperative" },
    { t: "Several hospitals negotiate an enforceable agreement to buy supplies together.", cat: "Cooperative" },
    { t: "Two countries sign a treaty, with inspectors, to cut their fishing catches together.", cat: "Cooperative" },
    { t: "Two airlines sign an agreement to share planes on a route and divide the revenue.", cat: "Cooperative" },
    { t: "Two gas stations across the street from each other each set prices without talking.", cat: "Noncooperative" },
    { t: "Suspects held in separate rooms each decide whether to confess.", cat: "Noncooperative" },
    { t: "Rival airlines each choose fares on their own, with no communication.", cat: "Noncooperative" },
    { t: "Two firms each submit a sealed bid for a contract without consulting each other.", cat: "Noncooperative" },
    { t: "Two coffee shops independently decide whether to run a holiday promotion.", cat: "Noncooperative" },
  ];
  const SEQ_BANK = [
    { t: "Two firms submit sealed bids for a city contract on the same day.", cat: "Simultaneous" },
    { t: "Two children play rock-paper-scissors.", cat: "Simultaneous" },
    { t: "Two stores print their weekend sale prices without seeing each other's ads.", cat: "Simultaneous" },
    { t: "Two suspects are questioned in separate rooms at the same time.", cat: "Simultaneous" },
    { t: "Two studios pick release dates without knowing the other's choice.", cat: "Simultaneous" },
    { t: "Two players play chess, each seeing the opponent's last move before moving.", cat: "Sequential" },
    { t: "A firm builds a large factory, and a possible entrant then decides whether to enter.", cat: "Sequential" },
    { t: "The largest firm posts its price list, and rivals then set their prices after seeing it.", cat: "Sequential" },
    { t: "A union makes a wage demand, and management then responds to it.", cat: "Sequential" },
    { t: "A landlord names a rent, and the tenant then accepts or rejects it.", cat: "Sequential" },
  ];
  const SUM_BANK = [
    { t: "Two players split a fixed $100 prize: whatever one gains, the other loses.", cat: "Zero-sum" },
    { t: "Friends play poker: every chip one player wins, another player loses.", cat: "Zero-sum" },
    { t: "A betting pool where the winners collect exactly what the losers paid in.", cat: "Zero-sum" },
    { t: "Two teams play a game in which the winner takes exactly the points the loser gives up.", cat: "Zero-sum" },
    { t: "A price war leaves both firms with lower profits than before it started.", cat: "Negative-sum" },
    { t: "Both firms spend heavily on ads, neither gains customers, and both earn less.", cat: "Negative-sum" },
    { t: "Two neighbors sue each other over a fence; legal fees exceed anything either could win.", cat: "Negative-sum" },
    { t: "A long strike costs workers their wages and the firm its profits.", cat: "Negative-sum" },
    { t: "A buyer pays $30 for a used bike she values at $45; the seller valued it at $20.", cat: "Positive-sum" },
    { t: "Two firms share research that cuts both firms' costs.", cat: "Positive-sum" },
    { t: "Two countries specialize, trade, and both consume more than before.", cat: "Positive-sum" },
    { t: "Four coworkers start a carpool and each saves on gas and parking.", cat: "Positive-sum" },
  ];
  const SUM_WHY = {
    "Zero-sum": "The gains exactly offset the losses: zero-sum.",
    "Negative-sum": "The players as a group end up worse off: negative-sum.",
    "Positive-sum": "The players as a group end up better off: positive-sum.",
  };
  const TERMS = [
    { term: "Strategic dependence", def: "A situation where one firm's moves on price, quality or advertising may be countered by its rivals' reactions." },
    { term: "Reaction function", def: "The way one oligopolist responds when another oligopolist changes its price, output or quality." },
    { term: "Game theory", def: "A way of describing the possible outcomes when interacting decision makers know their choices affect each other and plan accordingly." },
    { term: "Dominant strategy", def: "A choice that gives a player the best payoff no matter what the other players do." },
    { term: "Nash equilibrium", def: "An outcome in which each player's choice is its best response to the others' choices, so no one wants to change alone." },
    { term: "Opportunistic behavior", def: "Taking a short-run gain while ignoring the long-run benefits of cooperation." },
    { term: "Tit-for-tat", def: "Cooperating in the first round and then copying whatever the other player did in the previous round." },
    { term: "Price leadership", def: "The largest firm announces its prices first, and its rivals then match them." },
    { term: "Price war", def: "Repeated rounds of price cuts aimed at driving competitors out of the market." },
    { term: "Backward induction", def: "Solving a sequential game by starting with the last move and working back to the first." },
    { term: "Cooperative game", def: "A game in which the players explicitly coordinate to make themselves better off." },
    { term: "Sequential game", def: "A game in which players move in order and later players see earlier moves." },
  ];
  const NOT_COMP = ["A referee who enforces agreements", "The firms' demand curves", "Government regulation", "A binding contract", "Market share targets", "The number of customers"];

  const genBasics = STUDY.makeGenerator({
    id: "b251-m12-basics",
    name: "Game-theory vocabulary & types of games",
    blurb: "Name the parts of a game and classify games as cooperative or not, simultaneous or sequential, and zero-, positive- or negative-sum.",
    variants: [
      {
        name: "Name the component of the game",
        make() {
          const sc = U.pick(COMP_SCEN);
          const cats = ["Players", "Strategies", "Information", "Payoffs"];
          const items = cats.map(c => ({ t: sc[c][0], cat: c, why: COMP_WHY[c] }));
          return Q.classify({
            q: "Each item describes part of a strategic situation. Which of the four components of a game is it?",
            cats, items,
            sol: steps("Every game has four components: who decides (players), what they can do (strategies), what they know (information), and what they get (payoffs).",
              "Payoffs are outcomes measured in profit, market share, years in jail and so on; strategies are the actions that lead to them."),
          });
        },
      },
      {
        name: "Cooperative or noncooperative?",
        make() {
          const items = U.sample(COOP_BANK.filter(i => i.cat === "Cooperative"), 2).concat(U.sample(COOP_BANK.filter(i => i.cat === "Noncooperative"), 2));
          items.push(U.pick(COOP_BANK.filter(i => !items.includes(i))));
          return Q.classify({
            q: "Classify each situation as a cooperative or a noncooperative game.",
            cats: ["Cooperative", "Noncooperative"],
            items: items.map(i => ({ t: i.t, cat: i.cat, why: i.cat === "Cooperative" ? "The players explicitly agree and coordinate." : "Each player decides on its own, with no negotiation or agreement." })),
            sol: steps("Ask: do the players explicitly negotiate and coordinate (cooperative), or does each decide on its own (noncooperative)?",
              "Signed contracts, joint ventures and treaties are cooperative. Deciding separately, without talking, is noncooperative."),
          });
        },
      },
      {
        name: "Simultaneous or sequential?",
        make() {
          const items = U.sample(SEQ_BANK.filter(i => i.cat === "Simultaneous"), 2).concat(U.sample(SEQ_BANK.filter(i => i.cat === "Sequential"), 2));
          items.push(U.pick(SEQ_BANK.filter(i => !items.includes(i))));
          return Q.classify({
            q: "Classify each game as simultaneous or sequential.",
            cats: ["Simultaneous", "Sequential"],
            items: items.map(i => ({ t: i.t, cat: i.cat, why: i.cat === "Simultaneous" ? "The players choose at the same time, or without knowing the other's choice." : "Players move in order, and the later player sees the earlier move." })),
            sol: steps("The test is information about timing: does a player know the other's move before choosing?",
              "If not (same time, or sealed), it is simultaneous. If the later player sees the earlier move, it is sequential."),
          });
        },
      },
      {
        name: "Zero-, positive- or negative-sum from the numbers",
        make() {
          const type = U.pick(["Zero-sum", "Positive-sum", "Negative-sum"]);
          const n = U.pick([2, 3]);
          const names = U.sample(FIRMS, n);
          let ch;
          for (let t = 0; t < 500; t++) {
            ch = names.map(() => U.randInt(-9, 9));
            if (ch.some(v => v === 0)) continue;
            if (!ch.some(v => v > 0) || !ch.some(v => v < 0)) continue;
            const s = ch.reduce((a, b) => a + b, 0);
            if ((type === "Zero-sum" && s === 0) || (type === "Positive-sum" && s > 0) || (type === "Negative-sum" && s < 0)) break;
          }
          const sum = ch.reduce((a, b) => a + b, 0);
          if ((type === "Zero-sum" && sum !== 0) || (type === "Positive-sum" && sum <= 0) || (type === "Negative-sum" && sum >= 0)) ch = n === 2 ? [5, -5] : [4, -1, -3];
          const total = ch.reduce((a, b) => a + b, 0);
          const sgn = v => (v > 0 ? `+${mil(v)}` : `−${mil(-v)}`);
          const actual = total === 0 ? "Zero-sum" : total > 0 ? "Positive-sum" : "Negative-sum";
          const opts = ["Zero-sum", "Positive-sum", "Negative-sum"];
          return Q.mc({
            q: `${n === 2 ? "Two" : "Three"} rival firms compete in a market for a year. Their profits change as follows: ${names.map((f, i) => `${f} ${sgn(ch[i])}`).join(", ")}. What kind of game was this for the group?`,
            right: actual,
            wrong: opts.filter(o => o !== actual).map(o => ({ t: o, why: `${SUM_WHY[o]} But the changes add up to ${total === 0 ? "exactly zero" : total > 0 ? `+${mil(total)}` : `−${mil(-total)}`}.` })),
            keepOrder: true,
            sol: steps("Add up everyone's gains and losses. The sign of the total decides the type.",
              `${ch.map((v, i) => (i === 0 ? sgn(v) : v > 0 ? `+ ${mil(v)}` : `− ${mil(-v)}`)).join(" ")} = ${total === 0 ? "0" : total > 0 ? `+${mil(total)}` : `−${mil(-total)}`}.`,
              `${SUM_WHY[actual]}`),
          });
        },
      },
      {
        name: "Classify games by their sum",
        make() {
          const cats = ["Zero-sum", "Negative-sum", "Positive-sum"];
          const items = cats.map(c => U.pick(SUM_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m12-sum", SUM_BANK, 4)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Classify each situation by what happens to the group's total payoff.",
            cats, items: items.map(i => ({ t: i.t, cat: i.cat, why: SUM_WHY[i.cat] })),
            sol: steps("Ignore who wins. Ask whether the <em>group as a whole</em> ends up with the same total, less, or more.",
              "Pure transfers (prizes, bets) are zero-sum. Fights that burn resources (price wars, lawsuits, ad wars) are negative-sum. Voluntary trade and shared savings are positive-sum."),
          });
        },
      },
      {
        name: "Match the term to its definition",
        make() {
          const [r, ...others] = U.sample(TERMS, 4);
          return Q.mc({
            q: `Which term matches this description?<br><em>“${r.def}”</em>`,
            right: r.term,
            wrong: others.map(o => ({ t: o.term, why: `${o.term} means: ${lc(o.def)}` })),
            sol: steps("Focus on the key words of the description: who acts, when, and what is being compared.",
              `That is the definition of <b>${lc(r.term)}</b>.`),
          });
        },
      },
      {
        name: "Which is NOT a component of a game?",
        make() {
          const r = U.pick(NOT_COMP);
          return Q.mc({
            q: "Game theory describes every game with four components. Which of these is <b>NOT</b> one of them?",
            right: r, rightWhy: "It may matter in a particular game, but it is not one of the four components.",
            wrong: [
              { t: "Players", why: "Players (the decision makers) are a component." },
              { t: "Strategies", why: "Strategies (the possible choices) are a component." },
              { t: "Information", why: "Information (what each player knows) is a component." },
              { t: "Payoffs", why: "Payoffs (the outcomes) are a component." },
            ],
            sol: steps("The four components are players, strategies, information and payoffs.",
              `“${r}” is not on that list.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 3 — Dominant strategies & best responses
   * ============================================================ */
  const ANY = ["pd", "dom2", "dom1", "dom1", "two", "none"];
  function domQuestion(k) {
    const g = randGame(ANY);
    const d = dom(g, k);
    const P = name(g, k), O = name(g, 1 - k);
    const NONE = `${P} has no dominant strategy: its best choice depends on what ${O} does`;
    const domWhy = d == null ? null : `${g.s[d]} pays ${P} more in both cases: ${mil(pay(g, k, d, 0))} vs ${mil(pay(g, k, 1 - d, 0))} if ${O} picks ${g.s[0]}, and ${mil(pay(g, k, d, 1))} vs ${mil(pay(g, k, 1 - d, 1))} if ${O} picks ${g.s[1]}.`;
    const stratWhy = i => {
      if (d === 1 - i) return domWhy;
      const o = [0, 1].find(x => br(g, k, x) !== i);
      return `${g.s[i]} is ${P}'s best response only when ${O} picks ${g.s[1 - o]}. If ${O} picks ${g.s[o]}, ${g.s[1 - i]} pays more (${mil(pay(g, k, 1 - i, o))} vs ${mil(pay(g, k, i, o))}).`;
    };
    const right = d == null ? NONE : g.s[d];
    const wrong = d == null
      ? [0, 1].map(i => ({ t: g.s[i], why: stratWhy(i) }))
      : [{ t: g.s[1 - d], why: domWhy }, { t: NONE, why: domWhy }];
    wrong.push({ t: `Both strategies are dominant for ${P}`, why: "Without ties, at most one strategy can be best against every choice of the rival." });
    return Q.mc({
      q: `${intro(g)}${matrix(g)}Does <b>${P}</b> have a dominant strategy? If so, which?`,
      right, wrong,
      sol: steps(`A dominant strategy wins for ${P} against <em>each</em> of ${O}'s choices. Compare ${P}'s own payoffs${k === 1 ? " (the second number in each cell)" : ""}, one ${k === 0 ? "column" : "row"} at a time.`,
        brWork(g, k), domText(g, k)),
    });
  }
  function gameStatements(g) {
    const out = [];
    for (const k of [0, 1]) {
      const d = dom(g, k), P = name(g, k);
      if (d != null) {
        if (Math.random() < 0.5) out.push({ t: `${P} has a dominant strategy: ${g.s[d]}.`, ok: true, why: domText(g, k) });
        else out.push({ t: `${P} has a dominant strategy: ${g.s[1 - d]}.`, ok: false, why: domText(g, k) });
      } else if (Math.random() < 0.5) out.push({ t: `${P} has no dominant strategy.`, ok: true, why: domText(g, k) });
      else { const i = U.randInt(0, 1); out.push({ t: `${P} has a dominant strategy: ${g.s[i]}.`, ok: false, why: domText(g, k) }); }
    }
    { const k = U.randInt(0, 1), o = U.randInt(0, 1), b = br(g, k, o), tr = Math.random() < 0.5;
      out.push({ t: `If ${name(g, 1 - k)} chooses ${g.s[o]}, ${name(g, k)}'s best response is ${g.s[tr ? b : 1 - b]}.`, ok: tr, why: brLine(g, k, o) }); }
    { const i = U.randInt(0, 1), j = U.randInt(0, 1), k = U.randInt(0, 1);
      const v = g.p[i][j][k], w = g.p[i][j][1 - k];
      const tr = Math.random() < 0.5 || v === w;
      out.push({ t: `If ${g.A} chooses ${g.s[i]} and ${g.B} chooses ${g.s[j]}, ${name(g, k)} earns ${mil(tr ? v : w)}.`, ok: tr, why: `In that cell, ${cellPay(g, i, j)}.` }); }
    { const i = U.randInt(0, 1), j = U.randInt(0, 1);
      const isNE = nash(g).some(c => c[0] === i && c[1] === j);
      out.push({ t: `The outcome (${cellName(g, i, j)}) is a Nash equilibrium.`, ok: isNE, why: cellWhy(g, i, j) }); }
    return out;
  }

  const genDominant = STUDY.makeGenerator({
    id: "b251-m12-dominant",
    name: "Dominant strategies & best responses",
    blurb: "Read a payoff matrix: find best responses, spot dominant strategies, and work backward to the payoff that makes a strategy dominant.",
    variants: [
      { name: "Row player's dominant strategy", make() { return domQuestion(0); } },
      { name: "Column player's dominant strategy (read the right numbers)", make() { return domQuestion(1); } },
      {
        name: "Best response to a given move",
        make() {
          const g = randGame(ANY);
          const k = U.randInt(0, 1), o = U.randInt(0, 1), b = br(g, k, o);
          const P = name(g, k), O = name(g, 1 - k);
          return Q.mc({
            q: `${intro(g)}${matrix(g)}Suppose ${P} learns that ${O} will choose <b>${g.s[o]}</b>. What is ${P}'s best response?`,
            right: g.s[b],
            wrong: [
              { t: g.s[1 - b], why: `Against ${g.s[o]}, ${g.s[1 - b]} pays ${P} only ${mil(pay(g, k, 1 - b, o))}, less than ${mil(pay(g, k, b, o))}. (Make sure you read ${P}'s payoff, not ${O}'s.)` },
              { t: `Either one: ${P} is indifferent`, why: `The two payoffs differ (${mil(pay(g, k, 0, o))} vs ${mil(pay(g, k, 1, o))}), so ${P} is not indifferent.` },
              { t: `It can't be decided unless ${P} has a dominant strategy`, why: "A best response to a known move always exists: just compare the two payoffs against that move." },
            ],
            sol: steps(`Hold ${O}'s choice fixed at ${g.s[o]} and compare <em>${P}'s</em> payoffs.`, brLine(g, k, o)),
          });
        },
      },
      {
        name: "Payoff gain from the best response",
        make() {
          const g = randGame(ANY);
          const k = U.randInt(0, 1), o = U.randInt(0, 1), b = br(g, k, o);
          const P = name(g, k), O = name(g, 1 - k);
          const ans = pay(g, k, b, o) - pay(g, k, 1 - b, o);
          const otherDiff = Math.abs(pay(g, 1 - k, o, 0) - pay(g, 1 - k, o, 1));
          const acrossDiff = Math.abs(pay(g, k, b, 0) - pay(g, k, b, 1));
          return Q.num({
            q: `${intro(g)}${matrix(g)}If ${O} chooses <b>${g.s[o]}</b>, how much more profit does ${P} earn by playing its best response instead of its other strategy? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: pay(g, k, b, o), why: "That is the best-response payoff itself. The question asks how much <em>more</em> it is than the alternative." },
              { value: Math.abs(pay(g, 1 - k, b, o) - pay(g, 1 - k, 1 - b, o)), why: `That compares ${O}'s payoffs. Use ${P}'s own numbers.` },
              { value: otherDiff, why: `That is the gap in ${O}'s payoffs between its own two strategies.` },
              { value: acrossDiff, why: `That compares ${P}'s payoff across ${O}'s choices. ${P} can only change its own strategy, with ${O}'s choice held at ${g.s[o]}.` },
            ]),
            sol: steps(`Hold ${O} at ${g.s[o]} and compare ${P}'s two payoffs.`, brLine(g, k, o),
              `Gain: ${mil(pay(g, k, b, o))} − ${mil(pay(g, k, 1 - b, o))} = <b>${mil(ans)}</b>.`),
          });
        },
      },
      {
        name: "Reverse: the payoff that makes a strategy dominant",
        make() {
          const k = U.randInt(0, 1);
          const g = randGame(["pd", "dom2", "dom1"], { test: gg => dom(gg, k) != null && pay(gg, k, dom(gg, k), 0) >= 1 && pay(gg, k, dom(gg, k), 1) >= 1 });
          const d = dom(g, k), o = U.randInt(0, 1);
          const P = name(g, k), O = name(g, 1 - k);
          const inDom = Math.random() < 0.5;
          const mine = inDom ? d : 1 - d;
          const cellI = k === 0 ? mine : o, cellJ = k === 0 ? o : mine;
          const rival = pay(g, k, inDom ? 1 - d : d, o);
          const ans = inDom ? rival + 1 : rival - 1;
          const otherCol = 1 - o;
          return Q.num({
            q: `${intro(g)}${matrix(g, { hide: { i: cellI, j: cellJ, k } })}One of ${P}'s payoffs is unknown and marked <b>x</b> (whole millions of dollars). What is the <b>${inDom ? "smallest" : "largest"}</b> whole-number value of x for which <b>${g.s[d]}</b> is a dominant strategy for ${P}?`,
            answer: ans, unit: "$", kind: "count",
            traps: traps(ans, [
              { value: rival, why: `At x = ${rival} the two strategies tie against ${g.s[o]}, so ${g.s[d]} is not <em>strictly</em> better. Go one ${inDom ? "higher" : "lower"}.` },
              { value: g.p[cellI][cellJ][1 - k], why: `That is ${O}'s payoff in the same cell. Only ${P}'s own payoffs decide ${P}'s dominant strategy.` },
              { value: inDom ? pay(g, k, 1 - d, otherCol) + 1 : pay(g, k, d, otherCol) - 1, why: `That compares the payoffs when ${O} picks ${g.s[otherCol]}. x sits in the ${g.s[o]} ${k === 0 ? "column" : "row"}, so compare with the other payoff against ${g.s[o]}.` },
            ]),
            sol: steps(`For ${g.s[d]} to be dominant, it must pay ${P} strictly more than ${g.s[1 - d]} against <em>both</em> of ${O}'s choices.`,
              `Against ${g.s[otherCol]}: ${mil(pay(g, k, d, otherCol))} vs ${mil(pay(g, k, 1 - d, otherCol))}. ${g.s[d]} already wins there.`,
              `Against ${g.s[o]}: x is ${P}'s payoff from ${g.s[mine]}, and the other payoff is ${mil(rival)}. We need ${inDom ? `x &gt; ${rival}` : `x &lt; ${rival}`}.`,
              `The ${inDom ? "smallest" : "largest"} whole number that works is <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Select all true statements about a matrix",
        make() {
          let g, opts;
          for (let t = 0; t < 50; t++) {
            g = randGame(ANY);
            opts = gameStatements(g);
            if (opts.some(o => o.ok) && new Set(opts.map(o => o.t)).size === opts.length) break;
          }
          return Q.multi({
            q: `${intro(g)}${matrix(g)}Select <b>all</b> statements that are true.`,
            options: opts,
            sol: steps("Check each statement against the matrix separately. For best responses and dominant strategies, compare only the deciding firm's own payoffs.",
              `${g.A}: ${brWork(g, 0)}`, `${g.B}: ${brWork(g, 1)}`),
          });
        },
      },
      {
        name: "Edge case: the biggest payoff is not the dominant strategy",
        make() {
          const k = U.randInt(0, 1);
          /* A player's largest payoff always lies in its dominant strategy if it has one,
           * so the trap only bites when the player has no dominant strategy. */
          const g = randGame(["dom1", "two", "none"], { test: gg => dom(gg, k) == null });
          const vals = [0, 1].flatMap(m => [0, 1].map(o => ({ m, o, v: pay(g, k, m, o) })));
          const top = vals.reduce((a, b) => (b.v > a.v ? b : a));
          const P = name(g, k), O = name(g, 1 - k);
          const right = `No: ${P} has no dominant strategy. If ${O} chooses ${g.s[1 - top.o]}, ${g.s[1 - top.m]} pays ${P} more (${mil(pay(g, k, 1 - top.m, 1 - top.o))} vs ${mil(pay(g, k, top.m, 1 - top.o))})`;
          return Q.mc({
            q: `${intro(g)}${matrix(g)}An analyst at ${P} says: “We should choose <b>${g.s[top.m]}</b>, because that is where our biggest possible profit, ${mil(top.v)}, is.” Is this sound reasoning?`,
            right,
            wrong: [
              { t: `Yes: a dominant strategy is the one that contains a player's largest payoff`, why: "Dominance is about winning the comparison against every rival choice, not about where the single biggest number sits." },
              { t: `Yes: ${O} will surely choose ${g.s[top.o]} to let ${P} earn ${mil(top.v)}`, why: `${O} chooses to maximize its own payoff, not ${P}'s.` },
              { t: `No: ${P} should pick whichever strategy maximizes the two firms' combined profit`, why: `In a noncooperative game each firm maximizes its own payoff, not the total.` },
            ],
            sol: steps(`Don't hunt for the biggest number. Compare ${P}'s payoffs one ${O} choice at a time.`, brWork(g, k), domText(g, k)),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 4 — Nash equilibrium
   * ============================================================ */
  const NE_BANK = [
    { t: "At a Nash equilibrium, no player can gain by changing its strategy on its own.", ok: true },
    { t: "A game can have more than one Nash equilibrium.", ok: true },
    { t: "Some games have no Nash equilibrium in pure strategies.", ok: true },
    { t: "If both players have dominant strategies, the cell where they meet is a Nash equilibrium.", ok: true },
    { t: "A Nash equilibrium need not maximize the players' combined payoff.", ok: true },
    { t: "Each player at a Nash equilibrium is making its best choice given the other players' choices.", ok: true },
    { t: "A Nash equilibrium always gives every player its highest possible payoff.", ok: false, why: "Each player does the best it can <em>given the others' choices</em>, which can be far below its best possible payoff." },
    { t: "Every game has exactly one Nash equilibrium.", ok: false, why: "Games can have one, several, or none in pure strategies." },
    { t: "A Nash equilibrium requires the players to sign a binding agreement.", ok: false, why: "It is a noncooperative idea: it holds because no one wants to deviate, without any agreement." },
    { t: "At a Nash equilibrium, at least one player would gain by switching alone.", ok: false, why: "That is exactly what a Nash equilibrium rules out." },
    { t: "A Nash equilibrium exists only if at least one player has a dominant strategy.", ok: false, why: "Coordination games have equilibria even though neither player has a dominant strategy." },
    { t: "The Nash equilibrium is always the Pareto-optimal outcome.", ok: false, why: "In a prisoners' dilemma, the equilibrium is worse for both than mutual cooperation." },
  ];

  const genNash = STUDY.makeGenerator({
    id: "b251-m12-nash",
    name: "Nash equilibrium",
    blurb: "Find the Nash equilibria of randomly generated games, including games with two equilibria or none, and read off equilibrium payoffs.",
    variants: [
      {
        name: "Find the Nash equilibrium",
        make() {
          const g = randGame(["pd", "dom2", "dom1", "two", "two", "none"]);
          const { right, wrong } = neChoice(g);
          return Q.mc({ q: `${intro(g)}${matrix(g)}Which outcome(s) are Nash equilibria?`, right, wrong, sol: neSol(g) });
        },
      },
      {
        name: "Payoff at the equilibrium",
        make() {
          const g = randGame(["pd", "dom2", "dom1"]);
          const [i, j] = nash(g)[0];
          const k = U.randInt(0, 1), P = name(g, k), O = name(g, 1 - k);
          const ans = g.p[i][j][k];
          const jt = joint(g).best;
          const maxP = Math.max(...[0, 1].flatMap(a => [0, 1].map(b => g.p[a][b][k])));
          return Q.num({
            q: `${intro(g)}${matrix(g)}How much profit does <b>${P}</b> earn at the Nash equilibrium? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: g.p[i][j][1 - k], why: `That is ${O}'s payoff at the equilibrium. Read ${P}'s number.` },
              { value: maxP, why: `That is ${P}'s largest possible payoff, which requires ${O} to make a choice that is not its best response.` },
              { value: g.p[jt.i][jt.j][k], why: "That is the payoff in the outcome that maximizes combined profit, which is not necessarily the equilibrium." },
            ]),
            sol: neSol(g) + step(`${P}'s payoff there is <b>${mil(ans)}</b>.`),
          });
        },
      },
      {
        name: "Count the equilibria",
        make() {
          const g = randGame(["pd", "dom1", "two", "two", "none", "none"]);
          const n = nash(g).length;
          return Q.num({
            q: `${intro(g)}${matrix(g)}How many Nash equilibria (in pure strategies) does this game have? Enter 0, 1 or 2.`,
            answer: n, kind: "count",
            traps: traps(n, [
              n === 2 ? { value: 1, why: "You found one equilibrium, but there is a second: check every cell, not just the first that works." } : null,
              n === 0 ? { value: 1, why: "Whichever cell you counted, check it again: from every cell at least one firm would switch away." } : null,
              n === 1 ? { value: 2, why: "Only one cell has both firms best-responding; in the other cell you picked, someone wants to switch." } : null,
              n !== 0 ? { value: 0, why: "There is a cell where neither firm wants to switch alone." } : null,
            ]),
            sol: neSol(g),
          });
        },
      },
      {
        name: "Test a proposed outcome",
        make() {
          const g = randGame(["pd", "dom2", "dom1", "two", "none"]);
          const i = U.randInt(0, 1), j = U.randInt(0, 1);
          const aSw = br(g, 0, j) !== i, bSw = br(g, 1, i) !== j;
          const opts = [
            { t: "Yes: neither firm can gain by switching on its own", ok: !aSw && !bSw },
            { t: `No: only ${g.A} would want to switch`, ok: aSw && !bSw },
            { t: `No: only ${g.B} would want to switch`, ok: !aSw && bSw },
            { t: "No: both firms would want to switch", ok: aSw && bSw },
          ];
          const why = cellWhy(g, i, j);
          return Q.mc({
            q: `${intro(g)}${matrix(g)}Is the outcome <b>(${cellName(g, i, j)})</b> a Nash equilibrium?`,
            right: opts.find(o => o.ok).t,
            wrong: opts.filter(o => !o.ok).map(o => ({ t: o.t, why })),
            keepOrder: true,
            sol: steps("Test the cell directly: hold the rival fixed and ask whether each firm could do better by switching its own strategy.",
              `${g.A}: with ${g.B} at ${g.s[j]}, ${g.A} earns ${mil(g.p[i][j][0])} now and would earn ${mil(g.p[1 - i][j][0])} by switching to ${g.s[1 - i]}.`,
              `${g.B}: with ${g.A} at ${g.s[i]}, ${g.B} earns ${mil(g.p[i][j][1])} now and would earn ${mil(g.p[i][1 - j][1])} by switching to ${g.s[1 - j]}.`,
              why),
          });
        },
      },
      {
        name: "Only one player has a dominant strategy",
        make() {
          const g = randGame(["dom1"]);
          const kd = dom(g, 0) != null ? 0 : 1, kn = 1 - kd;
          const d = dom(g, kd), b = br(g, kn, d);
          const D = name(g, kd), N = name(g, kn);
          return Q.mc({
            q: `${intro(g)}${matrix(g)}${D} has a dominant strategy but ${N} does not. Assuming each firm knows the payoffs, what will <b>${N}</b> choose?`,
            right: g.s[b],
            wrong: [
              { t: g.s[1 - b], why: `${N} can predict that ${D} will play its dominant strategy, ${g.s[d]}. Against ${g.s[d]}, ${g.s[1 - b]} pays ${N} only ${mil(pay(g, kn, 1 - b, d))}, versus ${mil(pay(g, kn, b, d))}.` },
              { t: `There is no way to predict ${N}'s choice without a dominant strategy`, why: `${N} doesn't need one: it can predict ${D}'s move and best-respond to it.` },
            ],
            sol: steps(`Start with the firm that has a dominant strategy: ${domText(g, kd)}`,
              `${N} knows this, so it only needs its best response to ${g.s[d]}. ${brLine(g, kn, d)}`,
              `Predicted outcome (the Nash equilibrium): (${cellName(g, kd === 0 ? d : b, kd === 0 ? b : d)}).`),
          });
        },
      },
      {
        name: "Select all true statements about Nash equilibrium",
        make() {
          const t = U.randInt(1, 4);
          const opts = U.sample(NE_BANK.filter(o => o.ok), t).concat(U.sample(NE_BANK.filter(o => !o.ok), 5 - t));
          return Q.multi({
            q: "Select <b>all</b> statements about Nash equilibrium that are true.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why || "True: this follows from the definition." })),
            sol: steps("Definition: each player's choice is its best response to the others' choices, so no one gains by switching alone.",
              "Nothing in the definition says the outcome is the best for anyone, that it is unique, or that anyone agreed to it."),
          });
        },
      },
      {
        name: "Reverse: the payoff that creates an equilibrium",
        make() {
          let g, i, j, k;
          for (let t = 0; t < 200; t++) {
            g = randGame(["pd", "dom2", "dom1", "two", "none"]);
            const cands = [];
            for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
              const aSw = br(g, 0, b) !== a, bSw = br(g, 1, a) !== b;
              if (aSw && !bSw) cands.push([a, b, 0]);
              if (!aSw && bSw) cands.push([a, b, 1]);
            }
            if (cands.length) { [i, j, k] = U.pick(cands); break; }
          }
          const P = name(g, k), O = name(g, 1 - k);
          const mine = k === 0 ? i : j, oth = k === 0 ? j : i;
          const now = pay(g, k, mine, oth), alt = pay(g, k, 1 - mine, oth);
          const ans = alt + 1;
          return Q.num({
            q: `${intro(g)}${matrix(g)}Right now, <b>(${cellName(g, i, j)})</b> is not a Nash equilibrium. Suppose only ${P}'s payoff in that cell changes (currently ${mil(now)}). What is the <b>smallest</b> whole-number payoff, in millions of dollars, that would make this cell a Nash equilibrium?`,
            answer: ans, kind: "count", unit: "$",
            traps: traps(ans, [
              { value: alt, why: `At ${mil(alt)} ${P} would be exactly indifferent; the cell must pay strictly more than switching.` },
              { value: g.p[i][j][1 - k], why: `That is ${O}'s payoff in the cell. ${O} already has no reason to switch.` },
              { value: alt - now, why: "That is how much the payoff must rise by (almost). The question asks for the new payoff itself." },
            ]),
            sol: steps(`A cell is an equilibrium if neither firm wants to switch alone. ${cellWhy(g, i, j)}`,
              `${O} is already best-responding there, so only ${P}'s incentive must change: ${P} would get ${mil(alt)} by switching to ${g.s[1 - mine]}.`,
              `${P}'s payoff in the cell must exceed ${mil(alt)}, so the smallest whole number is <b>${ans}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 5 — The prisoners' dilemma & collusion payoffs
   * ============================================================ */
  const PD_BANK = [
    { t: "Each player's dominant strategy leads to an outcome that is worse for both than mutual cooperation.", ok: true },
    { t: "The Nash equilibrium is not Pareto optimal.", ok: true },
    { t: "Even if the players promise to cooperate, each still has an incentive to break the promise in a one-time game.", ok: true },
    { t: "Playing the game repeatedly can make cooperation easier to sustain.", ok: true },
    { t: "Changing the payoffs, for example with a price-match guarantee, can change the outcome.", ok: true },
    { t: "Both players have a dominant strategy.", ok: true },
    { t: "The Nash equilibrium is the best outcome for both players.", ok: false, why: "Both would be better off if both cooperated; that is the dilemma." },
    { t: "Rational players always end up at the cooperative outcome.", ok: false, why: "Each player's rational choice is to defect, which is exactly why they end up at the bad outcome." },
    { t: "Cooperation fails only because the players are irrational.", ok: false, why: "Each player is acting rationally given its own incentives." },
    { t: "Letting the players talk beforehand solves the dilemma.", ok: false, why: "Talk is cheap: without enforcement, each still gains by breaking its promise." },
    { t: "Neither player has a dominant strategy.", ok: false, why: "In a prisoners' dilemma both players have a dominant strategy (defect)." },
    { t: "The dilemma only applies to criminals deciding whether to confess.", ok: false, why: "The same structure fits pricing, advertising, output and R&D decisions by oligopolists." },
  ];
  function jailGame() {
    for (let t = 0; t < 500; t++) {
      const P = U.randInt(4, 9), R = U.randInt(1, P - 2), T = U.randInt(0, Math.min(1, R - 1)), S = U.randInt(P + 3, 20);
      if (P === 7 && R === 3 && T === 0 && S === 12) continue;
      return { P, R, T, S };
    }
    return { P: 5, R: 2, T: 1, S: 10 };
  }

  const genPD = STUDY.makeGenerator({
    id: "b251-m12-pd",
    name: "The prisoners' dilemma",
    blurb: "Recognize a prisoners' dilemma, find the joint-profit outcome, measure the temptation to cheat, and see how a price-match guarantee changes the game.",
    variants: [
      {
        name: "Is this a prisoners' dilemma?",
        make() {
          const g = randGame(["pd", "pd", "pd", "dom2", "dom2", "dom1", "two"]);
          const kind = kindOf(g);
          const Y = "Yes: each firm has a dominant strategy, and the resulting equilibrium is worse for both than another outcome";
          const N1 = "No: at least one firm has no dominant strategy";
          const N2 = "No: both firms have dominant strategies, but no other outcome makes both better off than the equilibrium";
          const N3 = "No: the firms could simply agree to cooperate, so there is no dilemma";
          const rd = dom(g, 0), cd = dom(g, 1);
          const right = kind === "pd" ? Y : kind === "dom2" ? N2 : N1;
          const whyFor = {
            [Y]: kind === "dom2"
              ? `Both have dominant strategies, but at the equilibrium (${cellName(g, rd, cd)}) no other cell gives <em>both</em> firms more, so there is no dilemma.`
              : "A prisoners' dilemma needs a dominant strategy for both firms, and here at least one firm lacks one.",
            [N1]: `Both firms do have dominant strategies: ${g.A} plays ${g.s[rd]} and ${g.B} plays ${g.s[cd]}.`,
            [N2]: kind === "pd"
              ? `Look at (${cellName(g, 1 - rd, 1 - cd)}): ${cellPay(g, 1 - rd, 1 - cd)}, which beats the equilibrium for both.`
              : "At least one firm has no dominant strategy, so this description doesn't fit.",
            [N3]: "In a one-shot noncooperative game, a promise to cooperate isn't enforceable: each firm would still gain by cheating if it has a dominant strategy to do so.",
          };
          return Q.mc({
            q: `${intro(g)}${matrix(g)}Is this game a prisoners' dilemma?`,
            right, wrong: [Y, N1, N2, N3].filter(o => o !== right).map(o => ({ t: o, why: whyFor[o] })),
            sol: steps("A prisoners' dilemma has two features: (1) both players have a dominant strategy, and (2) when both play it, there is another outcome that would make <em>both</em> better off.",
              `${domText(g, 0)}<br>${domText(g, 1)}`,
              kind === "pd" ? `The equilibrium (${cellName(g, rd, cd)}) gives ${mil(g.p[rd][cd][0])} and ${mil(g.p[rd][cd][1])}, but (${cellName(g, 1 - rd, 1 - cd)}) gives ${mil(g.p[1 - rd][1 - cd][0])} and ${mil(g.p[1 - rd][1 - cd][1])}: better for both. <b>It is a prisoners' dilemma.</b>`
                : kind === "dom2" ? `The equilibrium is (${cellName(g, rd, cd)}). The only cell that could beat it for both is (${cellName(g, 1 - rd, 1 - cd)}) (${cellPay(g, 1 - rd, 1 - cd)}), and it does not. <b>Not a prisoners' dilemma.</b>`
                  : "Feature (1) fails, so <b>it is not a prisoners' dilemma</b>."),
          });
        },
      },
      {
        name: "Joint-profit-maximizing outcome",
        make() {
          const g = randGame(["pd", "pd", "dom2", "dom1", "two"], { joint: true });
          const J = joint(g);
          const cells = J.cells;
          const ne = nash(g);
          const isNE = (i, j) => ne.some(c => c[0] === i && c[1] === j);
          return Q.mc({
            q: `${intro(g)}${matrix(g)}If the two firms could make a binding agreement (collude), which outcome would maximize their <b>combined</b> profit?`,
            right: cellName(g, J.best.i, J.best.j),
            wrong: cells.slice(1).map(c => ({ t: cellName(g, c.i, c.j), why: `Combined profit there is ${mil(c.sum)}, less than ${mil(J.best.sum)}.${isNE(c.i, c.j) ? " (It is a Nash equilibrium, but equilibrium is not the same as joint-profit maximum.)" : ""}` })),
            sol: steps("Joint profit ignores who gets what: add the two payoffs in each cell and pick the largest total.",
              cells.map(c => `(${cellName(g, c.i, c.j)}): ${mil(g.p[c.i][c.j][0])} + ${mil(g.p[c.i][c.j][1])} = ${mil(c.sum)}`).join("<br>"),
              `The largest total is <b>${mil(J.best.sum)}</b> at (${cellName(g, J.best.i, J.best.j)}). ${isNE(J.best.i, J.best.j) ? "Here it is also a Nash equilibrium, so no agreement is even needed." : "It is not a Nash equilibrium, so without an enforceable agreement at least one firm would deviate."}`),
          });
        },
      },
      {
        name: "Cost of failing to cooperate",
        make() {
          const g = pdGame();
          const c = g.coop, d = 1 - c;
          const coopSum = g.p[c][c][0] + g.p[c][c][1], neSum = g.p[d][d][0] + g.p[d][d][1];
          const ans = coopSum - neSum;
          return Q.num({
            q: `${intro(g)}${matrix(g)}This is a prisoners' dilemma. By how much would the two firms' <b>combined</b> profit rise if both played ${g.s[c]} instead of ending up at the Nash equilibrium? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: g.p[c][c][0] - g.p[d][d][0], why: `That is only ${g.A}'s gain. The question asks about the combined profit of both firms.` },
              { value: g.p[c][c][1] - g.p[d][d][1], why: `That is only ${g.B}'s gain. Add both firms' gains.` },
              { value: coopSum, why: "That is total profit under cooperation. Subtract the total at the equilibrium." },
              { value: neSum, why: "That is total profit at the equilibrium, not the difference." },
            ]),
            sol: steps(`First find the equilibrium: both firms' dominant strategy is ${g.s[d]}.`,
              `Equilibrium total: ${mil(g.p[d][d][0])} + ${mil(g.p[d][d][1])} = ${mil(neSum)}. Cooperation (both ${g.s[c]}): ${mil(g.p[c][c][0])} + ${mil(g.p[c][c][1])} = ${mil(coopSum)}.`,
              `Difference: ${mil(coopSum)} − ${mil(neSum)} = <b>${mil(ans)}</b>.`),
          });
        },
      },
      {
        name: "Temptation to cheat on the agreement",
        make() {
          const g = pdGame();
          const c = g.coop, d = 1 - c;
          const k = U.randInt(0, 1), P = name(g, k), O = name(g, 1 - k);
          const T = pay(g, k, d, c), R = pay(g, k, c, c), Pp = pay(g, k, d, d), S = pay(g, k, c, d);
          const ans = T - R;
          return Q.num({
            q: `${intro(g)}${matrix(g)}The two firms secretly agree that both will ${g.c.coop.replace("its", "their")}. If ${O} keeps its word, how much more profit does ${P} earn by cheating (playing ${g.s[d]})? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: T, why: "That is the cheater's total payoff. The question asks how much more it is than keeping the agreement." },
              { value: T - Pp, why: `That compares cheating with the outcome where both cheat. Here ${O} keeps its word.` },
              { value: R - S, why: `That is what ${P} protects itself from by cheating when ${O} cheats too, not the gain against a loyal ${O}.` },
              { value: pay(g, 1 - k, d, c) - pay(g, 1 - k, c, c), why: `That is ${O}'s temptation, read from ${O}'s payoffs.` },
            ]),
            sol: steps(`Hold ${O} at the agreed strategy, ${g.s[c]}, and compare ${P}'s two choices.`,
              `Keep the agreement: ${mil(R)}. Cheat with ${g.s[d]}: ${mil(T)}.`,
              `Temptation: ${mil(T)} − ${mil(R)} = <b>${mil(ans)}</b>. This is why collusive agreements are unstable.`),
          });
        },
      },
      {
        name: "Jail-time dilemma (lower is better)",
        make() {
          const v = jailGame();
          const [a, b] = U.sample(PEOPLE, 2);
          const s = U.pick([["Confess", "Stay silent"], ["Stay silent", "Confess"]]);
          const cf = s.indexOf("Confess"), sl = 1 - cf;
          const p = [[0, 0], [0, 0]].map(r => r.map(() => [0, 0]));
          p[cf][cf] = [v.P, v.P]; p[sl][sl] = [v.R, v.R]; p[cf][sl] = [v.T, v.S]; p[sl][cf] = [v.S, v.T];
          const g = { A: a, B: b, s, p };
          const tbl = matrix(g, { fmt: yrs, caption: `Prison sentences. ${a} chooses a row; ${b} chooses a column. Fewer years is better.` });
          const nm = (i, j) => `${a}: ${s[i]}, ${b}: ${s[j]}`;
          return Q.mc({
            q: `Police hold ${a} and ${b}, suspects in a burglary, in separate rooms. Each must decide whether to confess, without knowing what the other will do.${tbl}What is the Nash equilibrium?`,
            right: nm(cf, cf),
            wrong: [
              { t: nm(sl, sl), why: `Both would be better off here (${yrs(v.R)} each), but it is not stable: either suspect could cut their sentence to ${yrsN(v.T)} by confessing.` },
              { t: nm(cf, sl), why: `${b} would switch to confessing: ${yrsN(v.P)} is better than ${yrsN(v.S)}.` },
              { t: nm(sl, cf), why: `${a} would switch to confessing: ${yrsN(v.P)} is better than ${yrsN(v.S)}.` },
            ],
            sol: steps("Payoffs here are years in prison, so each suspect wants the <em>smaller</em> number.",
              `For ${a}: if ${b} stays silent, confessing means ${yrsN(v.T)} vs ${yrsN(v.R)} for silence; if ${b} confesses, confessing means ${yrsN(v.P)} vs ${yrsN(v.S)}. Confessing is dominant. The same holds for ${b}.`,
              `Both confess and each serves <b>${yrs(v.P)}</b>, although staying silent together would have meant only ${yrs(v.R)} each.`),
          });
        },
      },
      {
        name: "A price-match guarantee changes the game",
        make() {
          const g = pdGame(CTX[0]);
          const c = g.coop, d = 1 - c;
          const [va, vb] = g.vals;
          const g2 = { A: g.A, B: g.B, s: g.s, c: g.c, ind: g.ind, p: JSON.parse(JSON.stringify(g.p)) };
          const Ta = U.randInt(va.P + 1, va.R - 1), Sa = U.randInt(va.S + 1, va.P - 1);
          const Tb = U.randInt(vb.P + 1, vb.R - 1), Sb = U.randInt(vb.S + 1, vb.P - 1);
          g2.p[d][c] = [Ta, Sb]; g2.p[c][d] = [Sa, Tb];
          const { right, wrong } = neChoice(g2);
          return Q.mc({
            q: `${intro(g)} Originally the payoffs were:${matrix(g)}Both firms then advertise a <b>price-match guarantee</b>: a firm with the high price automatically matches any lower price its customers find. Undercutting now steals few customers, and the payoffs become:${matrix(g2)}Which outcome(s) are Nash equilibria of the <b>new</b> game?`,
            right, wrong,
            sol: steps("Solve the new matrix from scratch with best responses. The guarantee lowered the payoff from undercutting a high-price rival.",
              `${g.A}: ${brWork(g2, 0)}`, `${g.B}: ${brWork(g2, 1)}`,
              `Now each firm's best response to ${g.s[c]} is ${g.s[c]}, so <b>both firms choosing ${g.s[c]}</b> is an equilibrium (and so is both choosing ${g.s[d]}). In the original game ${g.s[d]} was dominant, so both choosing ${g.s[c]} could not last.`),
          });
        },
      },
      {
        name: "Select all: prisoners' dilemma facts",
        make() {
          const t = U.randInt(1, 4);
          const opts = U.sample(PD_BANK.filter(o => o.ok), t).concat(U.sample(PD_BANK.filter(o => !o.ok), 5 - t));
          return Q.multi({
            q: "Select <b>all</b> statements that are true of a one-time prisoners' dilemma.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why || "True: this is a defining feature or a standard result." })),
            sol: steps("In a prisoners' dilemma each player has a dominant strategy, and playing it lands both at an outcome worse than mutual cooperation.",
              "Players are rational; promises are not enforceable; repetition or changed payoffs (like price-match guarantees) are what can rescue cooperation."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 6 — Collusion, repeated games & tit-for-tat
   * ============================================================ */
  const BEH = ["Opportunistic behavior", "Tit-for-tat", "Price leadership", "Price war"];
  const BEH_BANK = [
    { t: "A parts supplier that will never deal with a customer again quietly ships lower-quality parts to save money.", cat: BEH[0] },
    { t: "A firm breaks a pricing understanding to grab one burst of extra sales, ignoring what happens next year.", cat: BEH[0] },
    { t: "A restaurant near a tourist attraction overcharges one-time visitors it will never see again.", cat: BEH[0] },
    { t: "A seller at a one-day fair exaggerates the quality of its goods, since it won't be back.", cat: BEH[0] },
    { t: "A firm keeps its price high as long as its rival did last month, and cuts its price only in the month after the rival cuts.", cat: BEH[1] },
    { t: "A week after its rival ends a discount, a store also returns to its normal price.", cat: BEH[1] },
    { t: "An airline starts by cooperating and then repeats whatever fare policy its rival used in the previous season.", cat: BEH[1] },
    { t: "A mill answers a rival's output surge with a surge of its own the next quarter, then cooperates again once the rival does.", cat: BEH[1] },
    { t: "The biggest steel maker announces next quarter's prices, and the smaller mills post the same prices within days.", cat: BEH[2] },
    { t: "The largest bank changes its lending rate, and the other banks match it the same week.", cat: BEH[2] },
    { t: "The dominant brewer publishes a price increase, and the other brewers follow.", cat: BEH[2] },
    { t: "The market leader in cement posts its annual price list first; rivals copy it.", cat: BEH[2] },
    { t: "Two ride-share firms keep slashing fares, each trying to drive the other out of the city.", cat: BEH[3] },
    { t: "Phone carriers cut prices again and again, hoping to push the smallest carrier out of the market.", cat: BEH[3] },
    { t: "A big-box store repeatedly undercuts a local rival until the rival closes.", cat: BEH[3] },
    { t: "Two airlines on one route cut fares round after round, each trying to force the other off it.", cat: BEH[3] },
  ];
  const BEH_WHY = {
    [BEH[0]]: "Taking a short-run gain while ignoring the long-run benefit of cooperation is opportunistic behavior.",
    [BEH[1]]: "Cooperating as long as the rival cooperated last round, and copying its previous move, is tit-for-tat.",
    [BEH[2]]: "The largest firm sets prices first and the others match: price leadership.",
    [BEH[3]]: "Repeated price cuts aimed at driving rivals out are a price war.",
  };
  const SUSTAIN = [
    { t: "The firms expect to compete against each other for many years with no fixed end date.", ok: true, why: "A long future makes the punishment for cheating costly." },
    { t: "Any price cut is visible to rivals within a day.", ok: true, why: "Quick detection means cheating is punished quickly." },
    { t: "Each firm has made a credible threat to retaliate against cheating.", ok: true, why: "Credible punishment lowers the payoff from cheating." },
    { t: "Only two or three firms are in the market.", ok: true, why: "With few firms, monitoring and coordinating are easier." },
    { t: "Both firms offer price-match guarantees.", ok: true, why: "Matching removes most of the gain from undercutting." },
    { t: "The firms will meet only once, in a single sealed-bid auction.", ok: false, why: "In a one-shot game there is no future in which to punish cheating." },
    { t: "Secret discounts to big customers are almost impossible for rivals to detect.", ok: false, why: "If cheating can't be seen, it can't be punished." },
    { t: "Dozens of firms share the market.", ok: false, why: "With many firms, coordinating and monitoring are much harder." },
    { t: "Everyone knows the market will close for good next month.", ok: false, why: "When the game is about to end, the threat of future punishment disappears." },
  ];
  const WHY_BREAK = [
    { q: "Why are cartels and other collusive agreements hard to keep together?",
      right: "Because each member can raise its own profit by secretly cutting its price or expanding output while the others stick to the deal",
      wrong: [
        { t: "Because the agreement lowers every member's profit", why: "Collusion raises the members' joint profit; that is why they try it." },
        { t: "Because cheating is always detected and punished immediately", why: "If it were, cheating wouldn't pay and cartels would be stable." },
        { t: "Because members are price takers with no control over price", why: "Oligopolists are price searchers; the problem is the incentive to cheat." },
      ] },
    { q: "In a pricing cartel, why is it tempting for one member to cheat?",
      right: "Because by undercutting the agreed price while rivals keep theirs high, a member can win many customers and earn more than its share of the cartel profit",
      wrong: [
        { t: "Because cheating raises the profits of every cartel member", why: "Cheating raises the cheater's profit at the expense of the others." },
        { t: "Because the law requires cartel members to compete", why: "The temptation comes from the payoffs, not from the law." },
        { t: "Because the agreed price is below marginal cost", why: "The agreed price is high; that's what makes undercutting it attractive." },
      ] },
    { q: "Why does an explicit price-fixing agreement among U.S. firms tend to fall apart even when it is profitable for the group?",
      right: "Because it is illegal, so it can't be enforced in court, and each firm gains by secretly cheating",
      wrong: [
        { t: "Because the government requires the firms to sign it", why: "Explicit price fixing is illegal under U.S. antitrust law, not required." },
        { t: "Because the agreed price earns less than the competitive price", why: "The agreed price earns the group more; each member's temptation to cheat is the problem." },
        { t: "Because every firm has a dominant strategy to keep the agreement", why: "The dominant strategy is to cheat, as in a prisoners' dilemma." },
      ] },
  ];
  const LEGAL_Q = [
    { q: ind => `Executives of the three largest ${ind} meet privately and agree on the prices each will charge next year. This is best described as:`,
      right: "Illegal price fixing: an explicit collusive agreement",
      wrong: [
        { t: "Price leadership", why: "Price leadership involves the largest firm posting prices first and others following, without a secret agreement." },
        { t: "A price war", why: "A price war is repeated price <em>cuts</em> to drive rivals out." },
        { t: "Opportunistic behavior", why: "Opportunistic behavior means grabbing short-run gains instead of cooperating." },
      ] },
    { q: ind => `Among the ${ind}, the largest firm announces its new price list, and the others match it within days without any meeting or agreement. This is best described as:`,
      right: "Price leadership: rivals coordinate by following the leader's posted prices",
      wrong: [
        { t: "A formal cartel with a signed agreement", why: "No meeting or agreement took place; the others simply followed." },
        { t: "A price war", why: "A price war is repeated price cuts to drive rivals out." },
        { t: "Tit-for-tat", why: "Tit-for-tat copies a rival's previous move in a repeated game; here the others follow a leader's announcement." },
      ] },
    { q: ind => `Two ${ind} keep cutting their prices, round after round, each hoping to force the other out of the market. This is best described as:`,
      right: "A price war",
      wrong: [
        { t: "Price leadership", why: "Price leadership is following the largest firm's posted price, not repeated cuts." },
        { t: "A collusive agreement", why: "Collusion keeps prices high; these firms are cutting them." },
        { t: "Tit-for-tat cooperation", why: "Tit-for-tat returns to cooperation when the rival does; these firms keep cutting." },
      ] },
  ];
  /* A tit-for-tat sequence problem: rival moves over n rounds, with a defection followed by cooperation early enough. */
  function tftScenario() {
    const c = U.pick(CTX);
    const [C0, D0] = c.letters;
    for (let t = 0; t < 500; t++) {
      const n = U.randInt(5, 7);
      const r = Array.from({ length: n }, () => (Math.random() < 0.55 ? C0 : D0));
      const first = r.indexOf(D0);
      if (first < 0 || first > n - 3) continue;
      if (!r.slice(first + 1, n - 1).includes(C0)) continue;
      const tft = [C0].concat(r.slice(0, n - 1));
      const mirror = r.slice();
      const grim = r.map((_, k) => (k > first ? D0 : C0));
      const nice = r.map(() => C0);
      const opp = r.map(x => (x === C0 ? D0 : C0));
      const all = [tft, mirror, grim, nice, opp].map(x => x.join(" "));
      if (new Set(all).size !== all.length) continue;
      return { c, C0, D0, n, r, tft, mirror, grim, nice, opp };
    }
    return null;
  }

  const genRepeat = STUDY.makeGenerator({
    id: "b251-m12-repeat",
    name: "Collusion, repeated games & tit-for-tat",
    blurb: "Explain why cartels break down, apply tit-for-tat, and compute whether cheating pays when the game is repeated.",
    variants: [
      {
        name: "Tit-for-tat: predict the moves",
        make() {
          let s = null;
          while (!s) s = tftScenario();
          const [A, B] = U.sample(FIRMS, 2);
          const round = r => `<table class="data-tbl"><thead><tr><th>Round</th>${r.map((_, i) => `<th>${i + 1}</th>`).join("")}</tr></thead><tbody><tr><th>${A}</th>${r.map(x => `<td>${x}</td>`).join("")}</tr></tbody></table>`;
          return Q.mc({
            q: `Two ${U.pick(s.c.inds)} play the same game every round. ${s.C0} means “${lc(s.c.s[0])}” (cooperate) and ${s.D0} means “${lc(s.c.s[1])}” (cheat). ${A}'s moves were:${round(s.r)}${B} plays <b>tit-for-tat</b>. Which sequence shows ${B}'s moves in rounds 1–${s.n}?`,
            right: s.tft.join(" "),
            wrong: [
              { t: s.mirror.join(" "), why: `This copies ${A}'s move in the <em>same</em> round, which ${B} cannot see yet. Tit-for-tat copies the <em>previous</em> round.` },
              { t: s.grim.join(" "), why: `This punishes forever after ${A}'s first cheat. Tit-for-tat forgives: once ${A} cooperates, ${B} cooperates the next round.` },
              { t: s.nice.join(" "), why: "This never punishes cheating. Tit-for-tat answers a cheat by cheating in the next round." },
              { t: s.opp.join(" "), why: "This does the opposite of the rival. Tit-for-tat starts by cooperating and copies the rival's previous move." },
            ],
            sol: steps("Tit-for-tat: cooperate in round 1, then in each later round play whatever the rival played in the round before.",
              `Round 1: ${s.C0}. Then ${B}'s move in round k is ${A}'s move in round k − 1: ${s.r.slice(0, s.n - 1).join(" ")}.`,
              `So ${B} plays <b>${s.tft.join(" ")}</b>.`),
          });
        },
      },
      {
        name: "Total profit from cheating against tit-for-tat",
        make() {
          const g = pdGame();
          const c = g.coop, d = 1 - c;
          const v = { T: g.p[d][c][0], R: g.p[c][c][0], P: g.p[d][d][0], S: g.p[c][d][0] };
          const N = U.randInt(3, 8);
          const ans = v.T + (N - 1) * v.P;
          return Q.num({
            q: `${intro(g)} They play this game once a year for <b>${N} years</b>:${matrix(g)}${g.B} plays tit-for-tat (it starts with ${g.s[c]}). If ${g.A} plays ${g.s[d]} every year, what is ${g.A}'s <b>total</b> profit over the ${N} years? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: N * v.T, why: `That assumes ${g.B} keeps playing ${g.s[c]} every year. Tit-for-tat retaliates from year 2 on.` },
              { value: N * v.R, why: `That is what ${g.A} would earn by cooperating every year.` },
              { value: N * v.P, why: `In year 1 ${g.B} still plays ${g.s[c]}, so ${g.A} earns ${mil(v.T)} that year, not ${mil(v.P)}.` },
              { value: v.T + (N - 1) * v.S, why: `${mil(v.S)} is what ${g.A} gets when it cooperates and is cheated on. Here ${g.A} cheats every year.` },
            ]),
            sol: steps(`Year 1: ${g.B} cooperates (tit-for-tat starts nice) while ${g.A} cheats, so ${g.A} earns ${mil(v.T)}.`,
              `Years 2–${N}: ${g.B} copies ${g.A}'s previous move (${g.s[d]}), so both play ${g.s[d]} and ${g.A} earns ${mil(v.P)} each year.`,
              `Total: ${mil(v.T)} + ${N - 1} × ${mil(v.P)} = <b>${mil(ans)}</b>.`),
          });
        },
      },
      {
        name: "Does cheating pay in the repeated game?",
        make() {
          let g, v, N, coopTot, cheatTot;
          for (let t = 0; t < 200; t++) {
            g = pdGame();
            const c = g.coop, d = 1 - c;
            v = { T: g.p[d][c][0], R: g.p[c][c][0], P: g.p[d][d][0] };
            N = U.randInt(2, 8);
            coopTot = N * v.R; cheatTot = v.T + (N - 1) * v.P;
            if (coopTot !== cheatTot && Math.abs(coopTot - cheatTot) !== v.T - v.R) break;
          }
          const c = g.coop, d = 1 - c;
          const diff = Math.abs(coopTot - cheatTot);
          const coopWins = coopTot > cheatTot;
          const optC = `Cooperate (${g.s[c]}) every year: it earns ${mil(diff)} more in total`;
          const optD = `Cheat (${g.s[d]}) every year: it earns ${mil(diff)} more in total`;
          const optOne = `Cheat (${g.s[d]}) every year: it earns ${mil(v.T - v.R)} more in total`;
          const optEq = "Both plans earn exactly the same total";
          return Q.mc({
            q: `${intro(g)} They will play this game once a year for <b>${N} years</b>:${matrix(g)}${g.B} plays tit-for-tat. Which plan gives ${g.A} the higher total profit over the ${N} years?`,
            right: coopWins ? optC : optD,
            wrong: uniqWrong(coopWins ? optC : optD, [
              { t: coopWins ? optD : optC, why: `Cooperating every year earns ${N} × ${mil(v.R)} = ${mil(coopTot)}; cheating every year earns ${mil(v.T)} + ${N - 1} × ${mil(v.P)} = ${mil(cheatTot)}.` },
              { t: optOne, why: `${mil(v.T - v.R)} is only the first-year gain from cheating. After that, tit-for-tat retaliates every year.` },
              { t: optEq, why: `The totals differ: ${mil(coopTot)} vs ${mil(cheatTot)}.` },
            ]),
            sol: steps("Compare the whole stream of profits, not just the first year. Tit-for-tat rewards cooperation and punishes cheating one year later.",
              `Cooperate every year: ${N} × ${mil(v.R)} = ${mil(coopTot)}.`,
              `Cheat every year: ${mil(v.T)} in year 1, then ${mil(v.P)} for ${N - 1} ${U.plural(N - 1, "year")}: ${mil(cheatTot)}.`,
              coopWins ? `Cooperation wins by <b>${mil(diff)}</b>. The longer the game, the less a one-time gain is worth.` : `With only ${N} ${U.plural(N, "year")}, cheating wins by <b>${mil(diff)}</b>: the game is too short for punishment to outweigh the first-year gain.`),
          });
        },
      },
      {
        name: "Why collusion breaks down",
        make() {
          const w = U.pick(WHY_BREAK);
          return Q.mc({
            q: w.q, right: w.right, wrong: w.wrong,
            sol: steps("Think of collusion as a prisoners' dilemma: keeping the agreement is cooperating, cheating is defecting.",
              "Whatever the others do, each member earns more by cheating, so the agreement unravels unless cheating can be detected and punished. Explicit price fixing is also illegal in the U.S., so it can't be enforced in court."),
          });
        },
      },
      {
        name: "Classify the strategic behavior",
        make() {
          const items = BEH.map(c => U.pick(BEH_BANK.filter(i => i.cat === c)));
          for (const x of U.deal("m12-beh", BEH_BANK, 4)) if (items.length < 5 && !items.includes(x)) items.push(x);
          return Q.classify({
            q: "Classify each example of oligopoly behavior.",
            cats: BEH, items: items.map(i => ({ t: i.t, cat: i.cat, why: BEH_WHY[i.cat] })),
            sol: steps("Opportunistic behavior ignores the future. Tit-for-tat looks back one round and copies the rival.",
              "Price leadership: the biggest firm moves first and the rest follow. Price war: repeated cuts meant to drive rivals out."),
          });
        },
      },
      {
        name: "Select all: what helps sustain cooperation?",
        make() {
          const t = U.randInt(1, 4);
          const opts = U.sample(SUSTAIN.filter(o => o.ok), t).concat(U.sample(SUSTAIN.filter(o => !o.ok), 5 - t));
          return Q.multi({
            q: "Two oligopolists would like to keep prices high without a formal agreement. Select <b>all</b> conditions that make that cooperation <b>easier</b> to sustain.",
            options: opts,
            sol: steps("Cooperation survives when cheating is quickly seen and punished, and when the future matters.",
              "Long or open-ended interaction, few firms, visible prices, credible retaliation and price-match guarantees all help. One-shot games, hidden discounts, many firms and a known end date all hurt."),
          });
        },
      },
      {
        name: "Explicit collusion, price leadership or price war?",
        make() {
          const l = U.pick(LEGAL_Q);
          const ind = U.pick(U.pick(CTX).inds);
          return Q.mc({
            q: l.q(ind), right: l.right, wrong: l.wrong,
            sol: steps("Ask: did the firms explicitly agree, is one firm leading and the rest following, or are they cutting prices to drive each other out?",
              "Explicit agreements to fix prices are illegal under U.S. antitrust law. Price leadership coordinates prices without a formal agreement. A price war is repeated price cuts."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * PRACTICE 7 — Sequential games & backward induction
   * ============================================================ */
  const SEQ_FACTS = [
    { t: "In a sequential game, a later player sees the earlier player's move before choosing.", ok: true },
    { t: "Backward induction starts at the last decision and works back to the first.", ok: true },
    { t: "The first mover should anticipate how the second mover will respond to each of its choices.", ok: true },
    { t: "Backward induction works best when every player knows all the payoffs (full information).", ok: true },
    { t: "The follower picks whichever branch gives the follower the higher payoff.", ok: true },
    { t: "Backward induction starts by finding the first mover's largest payoff.", ok: false, why: "It starts at the end: the last mover's choices come first." },
    { t: "In a sequential game the players move at the same time.", ok: false, why: "That is a simultaneous game." },
    { t: "The leader can make the follower choose any branch the leader likes.", ok: false, why: "The follower chooses what is best for itself." },
    { t: "The leader should choose the branch containing its largest payoff, whatever the follower would do.", ok: false, why: "The leader must compare the outcomes the follower will actually choose." },
    { t: "A game tree cannot be used to show a sequential game.", ok: false, why: "Game trees (extensive form) are exactly how sequential games are drawn." },
  ];

  const genSeq = STUDY.makeGenerator({
    id: "b251-m12-seq",
    name: "Sequential games & backward induction",
    blurb: "Solve game trees from the last move back: the follower's replies, the leader's choice and the equilibrium payoffs.",
    variants: [
      {
        name: "Follower's best reply",
        make() {
          const s = seqGame();
          const a = U.randInt(0, 1), b = s.fr[a];
          return Q.mc({
            q: `${s.c.story(s.L, s.F)}${tree(s)}${treeNote(s)}If ${s.L} chooses <b>${s.c.lm[a]}</b>, what will ${s.F} do?`,
            right: s.c.fm[b],
            wrong: [
              { t: s.c.fm[1 - b], why: `After ${s.c.lm[a]}, that branch gives ${s.F} only ${mil(s.leaf[a][1 - b][1])}, versus ${mil(s.leaf[a][b][1])}. (Read ${s.F}'s payoff, the second line.)` },
              { t: `Whatever gives ${s.L} the higher payoff`, why: `${s.F} maximizes its own payoff, not ${s.L}'s.` },
              { t: `It can't be predicted, because ${s.F} has no dominant strategy`, why: `${s.F} sees ${s.L}'s move, so it just picks its better branch from there.` },
            ],
            sol: steps(`${s.F} moves last and already knows ${s.L} chose ${s.c.lm[a]}. Compare ${s.F}'s payoffs on the two branches below that node.`, folLine(s, a)),
          });
        },
      },
      {
        name: "Predict the outcome by backward induction",
        make() {
          const s = seqGame();
          const all = [[0, 0], [0, 1], [1, 0], [1, 1]];
          const why = (a, b) => (a === s.a
            ? `After ${s.c.lm[a]}, ${s.F} would pick ${s.c.fm[s.fr[a]]}, not ${s.c.fm[b]}.`
            : s.fr[a] === b
              ? `${s.F} would indeed answer ${s.c.lm[a]} with ${s.c.fm[b]}, but that leaves ${s.L} ${mil(s.val[a])}, less than the ${mil(s.val[s.a])} it gets from ${s.c.lm[s.a]}.`
              : `${s.F} would answer ${s.c.lm[a]} with ${s.c.fm[s.fr[a]]}, and ${s.L} prefers ${s.c.lm[s.a]} anyway.`);
          return Q.mc({
            q: `${s.c.story(s.L, s.F)}${tree(s)}${treeNote(s)}What is the predicted outcome?`,
            right: pathName(s, s.a, s.b),
            wrong: all.filter(x => !(x[0] === s.a && x[1] === s.b)).map(x => ({ t: pathName(s, x[0], x[1]), why: why(x[0], x[1]) })),
            sol: seqSol(s),
          });
        },
      },
      {
        name: "Equilibrium payoff",
        make() {
          const s = seqGame();
          const k = U.randInt(0, 1), who = k === 0 ? s.L : s.F, oth = k === 0 ? s.F : s.L;
          const ans = s.leaf[s.a][s.b][k];
          const maxL = Math.max(...[0, 1].flatMap(a => [0, 1].map(b => s.leaf[a][b][k])));
          return Q.num({
            q: `${s.c.story(s.L, s.F)}${tree(s)}${treeNote(s)}Using backward induction, how much profit does <b>${who}</b> earn in equilibrium? (Answer in millions of dollars.)`,
            answer: ans, unit: "$",
            traps: traps(ans, [
              { value: s.leaf[s.a][s.b][1 - k], why: `That is ${oth}'s payoff on the equilibrium path.` },
              { value: maxL, why: `That is ${who}'s largest payoff anywhere in the tree, but the players' choices don't lead there.` },
              { value: s.leaf[1 - s.a][s.fr[1 - s.a]][k], why: `That is ${who}'s payoff if ${s.L} chose ${s.c.lm[1 - s.a]}, which it won't.` },
            ]),
            sol: seqSol(s),
          });
        },
      },
      {
        name: "Edge case: the tempting branch",
        make() {
          const s = seqGame(t => {
            let best = null;
            for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (!best || t.leaf[a][b][0] > best.v) best = { a, b, v: t.leaf[a][b][0] };
            t.top = best;
            return best.a !== t.a;
          });
          const top = s.top;
          return Q.mc({
            q: `${s.c.story(s.L, s.F)}${tree(s)}${treeNote(s)}A manager at ${s.L} argues: “Choose <b>${s.c.lm[top.a]}</b>. That branch is where our best possible payoff, ${mil(top.v)}, is.” What is wrong with this argument?`,
            right: `After ${s.c.lm[top.a]}, ${s.F} would choose ${s.c.fm[s.fr[top.a]]}, leaving ${s.L} only ${mil(s.val[top.a])}; ${s.c.lm[s.a]} gets it ${mil(s.val[s.a])}`,
            wrong: [
              { t: "Nothing: the leader should always aim for its largest payoff", why: `The ${mil(top.v)} requires ${s.F} to pick ${s.c.fm[top.b]}, which is not ${s.F}'s best reply.` },
              { t: `${s.F} has to follow ${s.L}'s lead, so the argument is correct`, why: `${s.F} chooses its own best branch after seeing ${s.L}'s move.` },
              { t: `${s.L} should instead choose the branch that maximizes ${s.F}'s payoff`, why: `${s.L} maximizes its own payoff, given how ${s.F} will respond.` },
            ],
            sol: seqSol(s),
          });
        },
      },
      {
        name: "Reverse: the payoff that flips the leader's choice",
        make() {
          const s = seqGame();
          const alt = 1 - s.a, fb = s.fr[alt];
          const ans = s.val[s.a] + 1;
          return Q.num({
            q: `${s.c.story(s.L, s.F)}${tree(s, { a: alt, b: fb, k: 0 })}${treeNote(s)}${s.L}'s payoff at one ending is unknown and marked <b>x</b>. ${s.F}'s payoffs are all known. What is the <b>smallest</b> whole-number value of x (in millions of dollars) that would make ${s.L} choose <b>${s.c.lm[alt]}</b>?`,
            answer: ans, kind: "count", unit: "$",
            traps: traps(ans, [
              { value: s.val[s.a], why: `At x = ${s.val[s.a]} ${s.L} would be indifferent; it needs strictly more to switch.` },
              { value: s.leaf[alt][1 - fb][0] + 1, why: `That compares with the other ending after ${s.c.lm[alt]}, which ${s.F} won't choose.` },
              { value: s.leaf[alt][fb][1], why: `That is ${s.F}'s payoff at that ending, not a threshold for ${s.L}.` },
            ]),
            sol: steps(`First check what ${s.F} does after ${s.c.lm[alt]}: ${s.F}'s payoffs (${mil(s.leaf[alt][0][1])} for ${s.c.fm[0]}, ${mil(s.leaf[alt][1][1])} for ${s.c.fm[1]}) don't depend on x, so it picks ${s.c.fm[fb]}, the ending marked x.`,
              `${folLine(s, s.a)} So ${s.c.lm[s.a]} gives ${s.L} ${mil(s.val[s.a])}.`,
              `${s.L} switches to ${s.c.lm[alt]} only if x &gt; ${s.val[s.a]}, so the smallest whole number is <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Select all: sequential-game facts",
        make() {
          const t = U.randInt(1, 4);
          const opts = U.sample(SEQ_FACTS.filter(o => o.ok), t).concat(U.sample(SEQ_FACTS.filter(o => !o.ok), 5 - t));
          return Q.multi({
            q: "Select <b>all</b> true statements about sequential games and backward induction.",
            options: opts.map(o => ({ t: o.t, ok: o.ok, why: o.why || "True." })),
            sol: steps("In a sequential game the later player sees the earlier move, so the earlier player must predict the reply.",
              "Backward induction formalizes that: solve the last move first, then the leader chooses among the outcomes the follower will actually pick."),
          });
        },
      },
      {
        name: "What does the leader expect after each move?",
        make() {
          const s = seqGame(t => t.fr[0] !== t.fr[1] || Math.random() < 0.3);
          const opt = (b0, b1) => `After ${s.c.lm[0]}: ${s.F} plays ${s.c.fm[b0]}; after ${s.c.lm[1]}: ${s.F} plays ${s.c.fm[b1]}`;
          const right = opt(s.fr[0], s.fr[1]);
          const combos = [[0, 0], [0, 1], [1, 0], [1, 1]].filter(x => !(x[0] === s.fr[0] && x[1] === s.fr[1]));
          return Q.mc({
            q: `${s.c.story(s.L, s.F)}${tree(s)}${treeNote(s)}Before choosing, ${s.L} works out how ${s.F} would reply to each of its possible moves. Which prediction is correct?`,
            right,
            wrong: combos.map(x => ({ t: opt(x[0], x[1]), why: `Check each node with ${s.F}'s payoffs. ${folLine(s, 0)} ${folLine(s, 1)}` })),
            sol: steps(`At each of ${s.F}'s two decision points, compare ${s.F}'s own payoffs (the second line at each ending).`, folLine(s, 0), folLine(s, 1)),
          });
        },
      },
    ],
  });

  STUDY.registerUnit(C, {
    id: "m12", order: 12,
    title: "Module 12 · Oligopolies and Game Theory",
    short: "M12 · Game theory",
    description: "Oligopoly and strategic dependence, game-theory vocabulary, dominant strategies and Nash equilibrium, the prisoners' dilemma and collusion, tit-for-tat and repeated games, and sequential games solved by backward induction.",
    notes, flashcards, cues,
    generators: [genTraits, genBasics, genDominant, genNash, genPD, genRepeat, genSeq],
  });
})();
