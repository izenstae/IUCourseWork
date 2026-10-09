/* ============================================================
 * BUS K201 · Chapter 4 · Process Analysis and Mapping with ITO and BPMN
 * Business processes and the BPM lifecycle, Input–Transform–Output
 * analysis, process maps, BPMN notation, reading BPMN diagrams
 * (paths, lanes, handoffs), bottlenecks / metrics / control points,
 * As-Is vs To-Be, gap analysis and change management.
 * Explanations, scenarios and diagrams are written for this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "bus-k201";
  const K = STUDY.k201;
  const S = K.S;

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const coin = () => Math.random() < 0.5;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const f1 = v => Math.round(v * 10) / 10;
  /* pick named variants out of a sortVariants() family, renamed */
  const pickV = (vs, picks) => picks.map(([i, nm]) => ({ name: nm, make: vs[i].make }));
  /* hand-written MC from a bank entry { q, right, rightWhy, wrong:[{t,why}], sol:[..] } */
  const mcFrom = (e, pre) => Q.mc({ q: (pre || "") + `<p>${e.q}</p>`, right: e.right, rightWhy: e.rightWhy, wrong: e.wrong, sol: S(...e.sol) });
  const tbl = (head, rows) => `<table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  /* ============================================================
   * SVG: single BPMN shapes (for the notation topic and lessons)
   * ============================================================ */
  const SVG = (w, h, inner, px) => `<svg viewBox="0 0 ${w} ${h}" style="max-width:100%;height:auto;width:${px || w}px" role="img" aria-label="BPMN notation sample" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none">${inner}</svg>`;
  const T = (x, y, s, size, anchor) => `<text x="${x}" y="${y}" font-size="${size || 9}" text-anchor="${anchor || "middle"}" fill="currentColor" stroke="none">${esc(s)}</text>`;
  function arrowHead(p, q, open) {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const s = 7, w = 3.6, bx = q[0] - ux * s, by = q[1] - uy * s;
    const pts = [q, [bx - uy * w, by + ux * w], [bx + uy * w, by - ux * w]].map(a => `${f1(a[0])},${f1(a[1])}`).join(" ");
    return `<polygon points="${pts}" fill="${open ? "none" : "currentColor"}" stroke="currentColor" stroke-width="1"/>`;
  }
  const shapeG = {
    start: (x, y) => `<circle cx="${x}" cy="${y}" r="13" stroke-width="1.3"/>`,
    end: (x, y) => `<circle cx="${x}" cy="${y}" r="13" stroke-width="3.6"/>`,
    inter: (x, y) => `<circle cx="${x}" cy="${y}" r="13" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="9.5" stroke-width="1.2"/>`,
    task: (x, y, w, h) => `<rect x="${x - (w || 72) / 2}" y="${y - (h || 36) / 2}" width="${w || 72}" height="${h || 36}" rx="8" stroke-width="1.4"/>`,
    gw: (x, y) => `<polygon points="${x},${y - 16} ${x + 16},${y} ${x},${y + 16} ${x - 16},${y}" stroke-width="1.4"/>`,
    xor: (x, y) => shapeG.gw(x, y) + `<line x1="${x - 6}" y1="${y - 6}" x2="${x + 6}" y2="${y + 6}" stroke-width="2.2"/><line x1="${x - 6}" y1="${y + 6}" x2="${x + 6}" y2="${y - 6}" stroke-width="2.2"/>`,
    and: (x, y) => shapeG.gw(x, y) + `<line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y}" stroke-width="2.4"/><line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke-width="2.4"/>`,
  };
  /* stand-alone shape pictures */
  const PIC = {
    start: () => SVG(60, 40, shapeG.start(30, 20), 60),
    end: () => SVG(60, 40, shapeG.end(30, 20), 60),
    inter: () => SVG(60, 40, shapeG.inter(30, 20), 60),
    task: () => SVG(90, 44, shapeG.task(45, 22, 80, 36), 90),
    gw: () => SVG(60, 40, shapeG.gw(30, 20), 60),
    xor: () => SVG(60, 40, shapeG.xor(30, 20), 60),
    and: () => SVG(60, 40, shapeG.and(30, 20), 60),
    seq: () => SVG(100, 30, `<line x1="8" y1="15" x2="86" y2="15" stroke-width="1.5"/>` + arrowHead([8, 15], [92, 15]), 100),
    msg: () => SVG(100, 30, `<circle cx="10" cy="15" r="3.5" stroke-width="1.2"/><line x1="14" y1="15" x2="86" y2="15" stroke-width="1.4" stroke-dasharray="5 4"/>` + arrowHead([14, 15], [92, 15], true), 100),
    pool: () => SVG(150, 70, `<rect x="3" y="3" width="144" height="64" stroke-width="1.4"/><line x1="20" y1="3" x2="20" y2="67" stroke-width="1.2"/>`, 150),
    lane: () => SVG(150, 70, `<rect x="3" y="3" width="144" height="64" stroke-width="1"/><line x1="20" y1="3" x2="20" y2="67" stroke-width="1"/><line x1="38" y1="3" x2="38" y2="67" stroke-width="1"/><rect x="38" y="35" width="109" height="32" stroke-width="2.6"/><line x1="20" y1="35" x2="38" y2="35" stroke-width="2.6"/>`, 150),
  };

  /* ============================================================
   * BPMN process diagrams: build a small pool from a scenario,
   * lay it out on a grid and draw it as inline SVG.
   *   scenario { pool, lanes:[..], start, end, segs:[..] }
   *   segs: {k:"task", l, t}
   *         {k:"exit", q, cont, alt, task:{l,t}|null, end}   alt branch leaves the process
   *         {k:"opt",  q, cont, alt, task:{l,t}}              alt branch adds one task, then rejoins
   *         {k:"and",  a:{l,t}, b:{l,t}}                      parallel split + join
   * ============================================================ */
  function buildBpmn(sc) {
    const nodes = [], edges = [], occ = new Set();
    const key = (c, l, r) => c + "," + l + "," + r;
    const idx = (l, r) => l * 2 + r;
    const add = o => { o.id = nodes.length; nodes.push(o); occ.add(key(o.col, o.lane, o.row)); return o; };
    const E = (a, b, label, mode) => edges.push({ a, b, label: label || "", mode: mode || "h" });
    const range = (c, i1, i2) => { const out = []; for (let i = Math.min(i1, i2); i <= Math.max(i1, i2); i++) out.push([c, Math.floor(i / 2), i % 2]); return out; };
    const free = cells => cells.every(([c, l, r]) => !occ.has(key(c, l, r)));
    let col = 0;
    let lastLane = sc.segs[0].l;
    const start = add({ type: "start", lane: lastLane, col: col++, row: 0, label: sc.start });
    let tails = [[start, "", "h"]];
    const connect = n => { tails.forEach(([a, lab, m]) => E(a, n, lab, m)); tails = []; };
    sc.segs.forEach((s, si) => {
      const nx = sc.segs[si + 1];
      if (s.k === "task") {
        const n = add({ type: "task", lane: s.l, col: col++, row: 0, label: s.t });
        connect(n); tails = [[n, "", "h"]]; lastLane = s.l;
      } else if (s.k === "exit" || s.k === "opt") {
        const gl = lastLane, L = s.task ? s.task.l : gl;
        /* an exit whose process continues in another lane sends the continuing flow out of the
         * diamond's top/bottom corner and the leaving branch out of its right corner, so they never cross */
        const nextLane = nx && nx.k === "task" ? nx.l : gl;
        const swap = s.k === "exit" && nextLane !== gl;
        const cells = c => (swap ? range(c, idx(gl, 0), idx(nextLane, 0)) : range(c, idx(gl, 0), idx(L, 1)))
          .concat([[c + 1, L, 1]], s.k === "exit" && s.task ? [[c + 2, L, 1]] : []);
        while (!free(cells(col))) col++;
        const g = add({ type: "xor", lane: gl, col, row: 0, label: s.q, seg: s });
        connect(g);
        if (s.k === "exit") {
          if (s.task) {
            const bt = add({ type: "task", lane: L, col: col + 1, row: 1, label: s.task.t });
            E(g, bt, s.alt, swap ? "h" : "vout");
            const be = add({ type: "end", lane: L, col: col + 2, row: 1, label: s.end });
            E(bt, be, "", "h");
          } else {
            const be = add({ type: "end", lane: L, col: col + 1, row: 1, label: s.end });
            E(g, be, s.alt, swap ? "h" : "vout");
          }
          tails = [[g, s.cont, swap ? "vout" : "h"]];
          col++;
        } else {
          const bt = add({ type: "task", lane: L, col: col + 1, row: 1, label: s.task.t });
          E(g, bt, s.alt, "vout");
          tails = [[g, s.cont, "h"], [bt, "", "h"]];
          col += 2;
        }
      } else if (s.k === "and") {
        const gl = lastLane, la = s.a.l, lb = s.b.l, rb = la === lb ? 1 : 0;
        const cells = c => range(c, idx(gl, 0), idx(la, 0)).concat(range(c, idx(gl, 0), idx(lb, rb)),
          [[c + 1, la, 0], [c + 1, lb, rb]], range(c + 2, idx(la, 0), idx(gl, 0)), range(c + 2, idx(lb, rb), idx(gl, 0)));
        while (!free(cells(col))) col++;
        const sp = add({ type: "and", lane: gl, col, row: 0, label: "" });
        connect(sp);
        const ta = add({ type: "task", lane: la, col: col + 1, row: 0, label: s.a.t });
        const tb = add({ type: "task", lane: lb, col: col + 1, row: rb, label: s.b.t });
        const jn = add({ type: "and", lane: gl, col: col + 2, row: 0, label: "", isJoin: true });
        sp.join = jn;
        for (const t of [ta, tb]) {
          const same = t.lane === gl && t.row === 0;
          E(sp, t, "", same ? "h" : "vout");
          E(t, jn, "", same ? "h" : "vin");
        }
        tails = [[jn, "", "h"]];
        col += 3;
      }
    });
    const end = add({ type: "end", lane: lastLane, col: col, row: 0, label: sc.end });
    connect(end);
    const g = { pool: sc.pool, lanes: sc.lanes, nodes, edges, start };
    g.paths = enumPaths(g);
    g.decisions = nodes.filter(n => n.type === "xor");
    g.tasks = nodes.filter(n => n.type === "task");
    g.ends = nodes.filter(n => n.type === "end");
    g.hasAnd = nodes.some(n => n.type === "and");
    return g;
  }
  /* every start-to-end route; a parallel block is walked as one unit (both branches run) */
  function enumPaths(g) {
    const out = [];
    const outs = n => g.edges.filter(e => e.a === n);
    const go = (n, vis, eds, ch) => {
      vis = vis.concat([n]);
      if (n.type === "end") { out.push({ nodes: vis, edges: eds, choices: ch, end: n }); return; }
      if (n.type === "and" && n.join) {
        let v = vis, es = eds;
        for (const e of outs(n)) { const e2 = outs(e.b)[0]; v = v.concat([e.b]); es = es.concat([e, e2]); }
        go(n.join, v, es, ch);
        return;
      }
      if (n.type === "xor") { for (const e of outs(n)) go(e.b, vis, eds.concat([e]), ch.concat([{ g: n, ans: e.label }])); return; }
      const e = outs(n)[0];
      go(e.b, vis, eds.concat([e]), ch);
    };
    go(g.start, [], [], []);
    return out;
  }
  const handoffs = p => p.edges.filter(e => e.a.lane !== e.b.lane).length;
  const pathWords = p => p.choices.map(c => `“${esc(c.g.label)}” → <b>${c.ans}</b>`).join(", ");

  function wrapWords(s, n) {
    const out = []; let cur = "";
    for (const w of String(s).split(" ")) {
      if (cur && (cur + " " + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
    }
    if (cur) out.push(cur);
    return out;
  }
  function textBlock(x, y, s, size, n, valign) {
    const L = wrapWords(s, n), lh = size + 1.6;
    const y0 = valign === "top" ? y + size : valign === "bottom" ? y - (L.length - 1) * lh : y - (L.length - 1) * lh / 2 + size * 0.35;
    return `<text x="${f1(x)}" y="${f1(y0)}" font-size="${size}" text-anchor="middle" fill="currentColor" stroke="none">${L.map((l, i) => `<tspan x="${f1(x)}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join("")}</text>`;
  }
  function drawBpmn(g) {
    const colW = 90, rowH = 62, padL = 52, top = 6;
    const nr = g.lanes.map((_, i) => g.nodes.some(n => n.lane === i && n.row === 1) ? 2 : 1);
    const ly = []; let y = top;
    nr.forEach((r, i) => { ly[i] = y; y += r * rowH; });
    const bottom = y;
    const ncol = Math.max(...g.nodes.map(n => n.col)) + 1;
    const W = padL + ncol * colW + 8, H = bottom + 6;
    const P = n => [padL + n.col * colW + colW / 2, ly[n.lane] + n.row * rowH + rowH / 2];
    const hw = n => n.type === "task" ? 36 : n.type === "start" || n.type === "end" ? 13 : 16;
    const hh = n => n.type === "task" ? 18 : n.type === "start" || n.type === "end" ? 13 : 16;
    let s = `<svg viewBox="0 0 ${W} ${H}" style="max-width:100%;height:auto" role="img" aria-label="BPMN process diagram" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none">`;
    // pool, pool label strip, lanes
    s += `<rect x="4" y="${top}" width="${W - 8}" height="${bottom - top}" stroke-width="1.5"/>`;
    s += `<line x1="26" y1="${top}" x2="26" y2="${bottom}" stroke-width="1.2"/><line x1="48" y1="${top}" x2="48" y2="${bottom}" stroke-width="0.8"/>`;
    const pmy = (top + bottom) / 2;
    s += `<text x="15" y="${f1(pmy)}" font-size="10" font-weight="bold" text-anchor="middle" fill="currentColor" stroke="none" transform="rotate(-90 15 ${f1(pmy)})">${esc(g.pool)}</text>`;
    g.lanes.forEach((ln, i) => {
      if (i) s += `<line x1="26" y1="${ly[i]}" x2="${W - 4}" y2="${ly[i]}" stroke-width="1"/>`;
      const my = ly[i] + nr[i] * rowH / 2;
      s += `<text x="38" y="${f1(my)}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none" transform="rotate(-90 38 ${f1(my)})">${esc(ln)}</text>`;
    });
    // edges
    for (const e of g.edges) {
      const [ax, ay] = P(e.a), [bx, by] = P(e.b);
      let pts;
      if (e.mode === "vout") {
        const down = by > ay, sy = ay + (down ? hh(e.a) : -hh(e.a));
        pts = [[ax, sy], [ax, by], [bx - hw(e.b), by]];
      } else if (e.mode === "vin") {
        const down = by > ay, ty = by + (down ? -hh(e.b) : hh(e.b));
        pts = [[ax + hw(e.a), ay], [bx, ay], [bx, ty]];
      } else {
        const sx = ax + hw(e.a), tx = bx - hw(e.b);
        pts = Math.abs(ay - by) < 1 ? [[sx, ay], [tx, by]] : [[sx, ay], [tx - 9, ay], [tx - 9, by], [tx, by]];
      }
      s += `<polyline points="${pts.map(p => `${f1(p[0])},${f1(p[1])}`).join(" ")}" stroke-width="1.3"/>`;
      s += arrowHead(pts[pts.length - 2], pts[pts.length - 1]);
      if (e.label) {
        const [px, py] = pts[0];
        if (e.mode === "vout") s += T(f1(px + 4), f1(by > ay ? py + 12 : by + 13), e.label, 8, "start");
        else s += T(f1(px + 3), f1(py - 4), e.label, 8, "start");
      }
    }
    // nodes
    for (const n of g.nodes) {
      const [x, y2] = P(n);
      if (n.type === "task") s += shapeG.task(x, y2) + textBlock(x, y2, n.label, 8, 13);
      else if (n.type === "start") s += shapeG.start(x, y2) + (n.label ? textBlock(x, y2 + 15, n.label, 7.5, 20, "top") : "");
      else if (n.type === "end") s += shapeG.end(x, y2) + (n.label ? textBlock(x, y2 + 15, n.label, 7.5, 20, "top") : "");
      else if (n.type === "xor") {
        /* the question sits above the diamond, or below it when a branch leaves upward */
        const up = g.edges.some(e => e.a === n && P(e.b)[1] < y2 - 1);
        s += shapeG.xor(x, y2) + (up ? textBlock(x, y2 + 19, n.label, 8, 24, "top") : textBlock(x, y2 - 20, n.label, 8, 24, "bottom"));
      }
      else if (n.type === "and") s += shapeG.and(x, y2);
    }
    return s + `</svg>`;
  }

  /* ---------- scenario bank for diagrams ---------- */
  const gwq = opts => { const [q, cont, alt] = U.pick(opts); return { q, cont, alt }; };
  const SCEN = {
    retailer(o = {}) {
      const Cu = 0, Sy = 1, Wh = 2;
      const segs = [{ k: "task", l: Cu, t: "Place order" }, { k: "task", l: Cu, t: "Enter payment details" }, { k: "task", l: Sy, t: "Request payment validation" },
        { k: "exit", ...gwq([["Payment valid?", "Yes", "No"], ["Card declined?", "No", "Yes"]]), task: { l: Sy, t: "Notify payment failure" }, end: "Order cancelled" }];
      if (o.and || (!o.noAnd && coin())) segs.push({ k: "and", a: { l: Sy, t: "Email confirmation" }, b: { l: Wh, t: "Pick items" } });
      else segs.push({ k: "task", l: Wh, t: "Pick items" });
      if (coin()) segs.push({ k: "opt", ...gwq([["Gift wrap wanted?", "No", "Yes"]]), task: { l: Wh, t: "Gift-wrap items" } });
      segs.push({ k: "task", l: Wh, t: "Ship package" });
      return { pool: "Online Retailer", lanes: ["Customer", "System", "Warehouse"], start: "Shopper checks out", end: "Order shipped", segs };
    },
    library() {
      const St = 0, Li = 1;
      const hold = coin();
      const segs = [{ k: "task", l: St, t: "Search catalog" },
        { k: "exit", ...gwq([["Book available?", "Yes", "No"], ["Checked out already?", "No", "Yes"]]), task: hold ? { l: St, t: "Place a hold" } : null, end: hold ? "Hold placed" : "Student leaves" },
        { k: "task", l: St, t: "Find book on shelf" }, { k: "task", l: St, t: "Take book to desk" }, { k: "task", l: Li, t: "Scan ID and barcode" },
        { k: "opt", ...gwq([["Fines owed?", "No", "Yes"], ["Account clear?", "Yes", "No"]]), task: { l: St, t: "Pay fine" } },
        { k: "task", l: Li, t: "Check out book" }];
      return { pool: "Campus Library", lanes: ["Student", "Librarian"], start: "Student needs a book", end: "Book checked out", segs };
    },
    scholarship(o = {}) {
      const St = 0, Ao = 1, Co = 2;
      const segs = [{ k: "task", l: St, t: "Submit application" }, { k: "task", l: Ao, t: "Check for missing items" },
        { k: "exit", ...gwq([["Application complete?", "Yes", "No"], ["Items missing?", "No", "Yes"]]), task: { l: Ao, t: "Request missing documents" }, end: "Application paused" },
        { k: "task", l: Co, t: "Score application" },
        { k: "exit", ...gwq([["Meets criteria?", "Yes", "No"]]), task: coin() ? { l: Ao, t: "Send decline letter" } : null, end: "Not awarded" }];
      if (o.and || (!o.noAnd && coin())) segs.push({ k: "and", a: { l: Ao, t: "Send award letter" }, b: { l: Ao, t: "Update aid record" } });
      else segs.push({ k: "task", l: Ao, t: "Send award letter" });
      return { pool: "Scholarship Office", lanes: ["Student", "Aid Office", "Committee"], start: "Deadline opens", end: "Award made", segs };
    },
    cafe() {
      const Cu = 0, Ca = 1, Ba = 2;
      const segs = [{ k: "task", l: Cu, t: "Order a drink" }, { k: "task", l: Ca, t: "Record name and drink" }, { k: "task", l: Ca, t: "Take payment" },
        { k: "exit", ...gwq([["Card approved?", "Yes", "No"], ["Payment failed?", "No", "Yes"]]), task: coin() ? { l: Ca, t: "Void the order" } : null, end: "No sale" }];
      if (coin()) segs.push({ k: "opt", ...gwq([["Oat milk requested?", "No", "Yes"]]), task: { l: Ba, t: "Steam oat milk" } });
      segs.push({ k: "task", l: Ba, t: "Prepare drink" }, { k: "task", l: Ba, t: "Call out name" });
      return { pool: "Bean & Byte Café", lanes: ["Customer", "Cashier", "Barista"], start: "Customer arrives", end: "Drink picked up", segs };
    },
    auto() {
      const Cu = 0, Sa = 1, Te = 2;
      const segs = [{ k: "task", l: Cu, t: "Drop off car" }, { k: "task", l: Te, t: "Inspect vehicle" }, { k: "task", l: Sa, t: "Prepare estimate" },
        { k: "exit", ...gwq([["Estimate approved?", "Yes", "No"]]), task: coin() ? { l: Sa, t: "Return car unrepaired" } : null, end: "Repair declined" },
        { k: "opt", ...gwq([["Parts in stock?", "Yes", "No"], ["Parts needed?", "No", "Yes"]]), task: { l: Sa, t: "Order parts" } },
        { k: "task", l: Te, t: "Repair vehicle" }, { k: "task", l: Sa, t: "Collect payment" }];
      return { pool: "Sparky's Auto Care", lanes: ["Customer", "Service Advisor", "Technician"], start: "Warning light on", end: "Car picked up", segs };
    },
    helpdesk(o = {}) {
      const Em = 0, Hd = 1, Sp = 2;
      const segs = [{ k: "task", l: Em, t: "Submit ticket" }, { k: "task", l: Hd, t: "Triage ticket" },
        { k: "exit", ...gwq([["Known quick fix?", "No", "Yes"]]), task: { l: Hd, t: "Apply fix and close" }, end: "Solved at desk" },
        { k: "task", l: Sp, t: "Diagnose problem" }];
      if (o.and || (!o.noAnd && coin())) segs.push({ k: "and", a: { l: Sp, t: "Install the fix" }, b: { l: Hd, t: "Update the employee" } });
      else segs.push({ k: "task", l: Sp, t: "Install the fix" });
      segs.push({ k: "task", l: Em, t: "Confirm it works" });
      return { pool: "IT Services", lanes: ["Employee", "Help Desk", "Specialist"], start: "Laptop fails", end: "Ticket closed", segs };
    },
    expense() {
      const Em = 0, Mg = 1, Ac = 2;
      const segs = [{ k: "task", l: Em, t: "Submit expense report" }, { k: "task", l: Mg, t: "Review report" },
        { k: "exit", ...gwq([["Approved?", "Yes", "No"]]), task: coin() ? { l: Mg, t: "Return with comments" } : null, end: "Report rejected" },
        { k: "opt", ...gwq([["Over $500?", "No", "Yes"]]), task: { l: Ac, t: "Audit receipts" } },
        { k: "task", l: Ac, t: "Issue reimbursement" }];
      return { pool: "Midtown Marketing", lanes: ["Employee", "Manager", "Accounting"], start: "Trip completed", end: "Employee repaid", segs };
    },
  };
  const ALL_SCEN = Object.keys(SCEN);
  const AND_SCEN = ["retailer", "scholarship", "helpdesk"];
  function randomDiagram(opts) {
    const name = U.rotate("ch4-scen" + (opts && opts.and ? "-and" : ""), opts && opts.and ? AND_SCEN : ALL_SCEN);
    const g = buildBpmn(SCEN[name](opts || {}));
    g.svg = drawBpmn(g);
    return g;
  }
  const diagramIntro = g => `<p>Read this BPMN diagram for <b>${esc(g.pool)}</b>.</p><div class="example" style="overflow-x:auto">${g.svg}</div>`;

  /* fixed diagrams for the lessons */
  const LESSON_ORDER = drawBpmn(buildBpmn({ pool: "Online Retailer", lanes: ["Customer", "System"], start: "Checkout", end: "Order confirmed",
    segs: [{ k: "task", l: 0, t: "Place order" }, { k: "task", l: 0, t: "Enter payment details" }, { k: "task", l: 1, t: "Request payment validation" },
      { k: "exit", q: "Payment valid?", cont: "Yes", alt: "No", task: { l: 1, t: "Notify payment failure" }, end: "Order cancelled" },
      { k: "task", l: 1, t: "Confirm order" }] }));
  const LESSON_LIB = drawBpmn(buildBpmn({ pool: "Campus Library", lanes: ["Student", "Librarian"], start: "Needs a book", end: "Book checked out",
    segs: [{ k: "task", l: 0, t: "Search catalog" },
      { k: "exit", q: "Book available?", cont: "Yes", alt: "No", task: { l: 0, t: "Place a hold" }, end: "Hold placed" },
      { k: "task", l: 0, t: "Find book on shelf" }, { k: "task", l: 0, t: "Take book to desk" }, { k: "task", l: 1, t: "Scan ID and barcode" },
      { k: "opt", q: "Fines owed?", cont: "No", alt: "Yes", task: { l: 0, t: "Pay fine" } },
      { k: "task", l: 1, t: "Check out book" }] }));

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Business processes and the BPM lifecycle",
      lo: "Explain what a business process is, the five BPM lifecycle stages, and what BPM achieves for an organization.",
      html: `<p>A <b>business process</b> is a set of related tasks, carried out by people, by systems, or by both, that together reach some organizational goal. Ordering a sandwich at a deli is a process: you ask for it, someone writes the ticket, someone takes payment, the cook makes it, your number is called. Each task receives something (a request, a ticket, a payment), <em>changes its status</em>, and hands a result to the next task.</p>
<p><b>Business Process Management (BPM)</b> is the ongoing job of looking after those processes. Processes need attention when their results are poor or no longer meet requirements. BPM is described as a continuous <b>lifecycle</b> of five stages:</p>
<ol>
<li><b>Process design</b> (discovery and analysis): find out how the work happens and where it falls short.</li>
<li><b>Process modeling</b>: draw it, usually as a process map or BPMN diagram.</li>
<li><b>Process execution</b> (implementation): put the designed process to work, often with new software or new procedures.</li>
<li><b>Process monitoring</b>: measure how it performs (time, cost, errors, satisfaction).</li>
<li><b>Process optimization</b> (improvement): use what monitoring shows to make it better, which leads back into design.</li>
</ol>
<div class="keyidea"><b>Key idea.</b> BPM is a loop, not a project with an end date: design → model → execute → monitor → optimize → design again.</div>
<p>Information systems are usually born inside this lifecycle. A youth soccer league that replaces paper sign-up sheets with an online form feeding a database has redesigned a process <em>and</em> created an information system. Not every process uses an IS, but <b>every information system supports one or more processes</b>; a system that serves no process has no reason to exist.</p>
<p>Processes are rarely straight lines: <b>decision points</b> send work down alternative paths, and processes are <b>linked</b> because one process's output becomes another's input (a finished sale triggers shipping).</p>
<p>Done well, BPM delivers four benefits:</p>
<ul>
<li><b>Efficiency</b>: less waste, so less time and money per unit of work.</li>
<li><b>Consistency</b>: a documented process gives every customer the same quality.</li>
<li><b>Accountability</b>: it is clear who owns each step.</li>
<li><b>Adaptability</b>: a well-understood process can be changed quickly when conditions shift.</li>
</ul>
<div class="example"><b>Example.</b> A campus food pantry notices long Friday lines (<em>monitoring</em>). Staff interview volunteers and watch a shift (<em>design/discovery</em>), sketch the flow (<em>modeling</em>), launch a pre-packed-bag pickup option (<em>execution</em>), then track wait times again (<em>monitoring</em>) and tweak the bag sizes (<em>optimization</em>).</div>
<div class="trap"><b>Common trap.</b> Mixing up the benefits. "Every customer gets the same quality" is <b>consistency</b>, not efficiency. "We know exactly who approves refunds" is <b>accountability</b>. Efficiency is specifically about using less time or money.</div>`,
      gens: ["k201-ch4-bpm"],
    },
    {
      title: "The ITO model: input, transform, output, feedback",
      lo: "Break a process into its inputs, transformation activities, outputs and feedback.",
      html: `<p>The <b>Input–Transform–Output (ITO)</b> model is the simplest lens for analyzing any process:</p>
<ul>
<li><b>Input</b>: whatever enters the process: resources, materials, information, requests. For a smoothie bar: the customer's order, fruit, yogurt, payment.</li>
<li><b>Transform</b>: the activities that turn inputs into outputs: blending, pouring, labeling. This is the "black box" where <b>value is added</b>.</li>
<li><b>Output</b>: the product, service or result that leaves: a smoothie in the customer's hand.</li>
<li><b>Feedback</b>: information <em>about the output</em> that flows back to improve the transformation: "too thick" comments lead to a new recipe.</li>
</ul>
<p>Inputs come in five common <b>forms</b>: <b>physical materials</b> (raw materials, parts, a phone to repair), <b>information</b> (customer data, a work order, a submitted form), <b>people</b> (customers or patients who enter the process themselves), <b>financial resources</b> (budget, payment) and <b>energy/utilities</b> (power, water, bandwidth).</p>
<p>Outputs come in four forms: <b>physical goods</b>, <b>services</b> (a finished haircut, a resolved complaint), <b>information</b> (a grade, a tax return, a report) and <b>transformed materials</b> (recycled plastic pellets, refined fuel). One process's output is often the next process's input.</p>
<div class="example"><b>Example: university admissions.</b> Inputs: applications, fees, recommendation letters, test scores. Transform: check completeness, verify transcripts, committee review, vote. Outputs: admit / waitlist / deny letters, and admitted students' data passed to the enrollment system. Feedback: how admitted students actually perform shapes next year's criteria; last year's yield rate (share of admits who enroll) sets how many offers to make.</div>
<div class="keyidea"><b>Key idea.</b> Ask four questions in order: What comes in? What is done to it? What goes out? What information comes back to improve the doing?</div>
<div class="trap"><b>Common trap.</b> Calling every later step "feedback." Feedback is information <em>about the output's quality or results</em> that returns to change the process. A customer paying, or a package being shipped, is not feedback; a complaint that the package arrived late is.</div>`,
      gens: ["k201-ch4-ito"],
    },
    {
      title: "Where value is added (and where it is not)",
      lo: "Distinguish value-adding from non-value-adding steps and name the kind of value a step adds.",
      html: `<p>The transformation is where value is created. A step adds value when it changes something the customer cares about:</p>
<ul>
<li><b>Form</b>: lumber becomes a bookshelf; flour becomes bread.</li>
<li><b>Location</b>: a package moves from a warehouse to your doorstep.</li>
<li><b>State of information</b>: raw sales transactions become a weekly sales dashboard.</li>
<li><b>Ownership</b>: a car passes from the dealer to the buyer.</li>
<li><b>Access or experience</b>: a concert, a museum visit, a streaming session.</li>
</ul>
<p>A <b>non-value-adding</b> step uses time or resources but the customer would not miss it if it vanished: <b>waiting</b> in a queue, <b>rework</b> to fix an error, <b>excessive approvals</b>, re-entering the same data twice, moving paper between desks.</p>
<div class="keyidea"><b>Key idea.</b> The test is the customer: "Would they pay for this step, or notice if it disappeared?" If not, it is a target for removal or automation.</div>
<div class="example"><b>Example.</b> At a phone repair kiosk: replacing the cracked screen (form) adds value; the phone sitting 2 days on a shelf before anyone looks at it, and re-testing because the first screen was installed wrong, add none.</div>
<div class="trap"><b>Common trap.</b> "Necessary means value-adding." Some steps (like a legal compliance check) may be required, but required is not the same as value-adding from the customer's view. And a step being slow does not make it non-value-adding: a long surgery still adds value.</div>`,
      gens: ["k201-ch4-ito"],
    },
    {
      title: "Process maps and choosing a map type",
      lo: "Explain why organizations map processes and choose a fitting map type; outline how a BPMN map is built in Lucidchart.",
      html: `<p>A <b>process map</b> (also called a workflow diagram or flowchart) is a picture of a process: its steps, their order, the people or systems involved and the decisions along the way. Maps serve four purposes:</p>
<ul>
<li><b>Communication</b>: everyone sees the same picture of how work flows.</li>
<li><b>Training</b>: new staff learn their part and how it connects to others.</li>
<li><b>Analysis</b>: the picture exposes bottlenecks, duplicated work and gaps.</li>
<li><b>Improvement</b>: you cannot improve what you cannot see; the map is the baseline for redesign.</li>
</ul>
<p>Four common map types, from simple to formal:</p>
${tbl(["Map type", "Best for", "Complexity"], [
        ["Basic flowchart", "Simple, mostly linear processes", "Low"],
        ["Swimlane diagram", "Processes involving several roles or departments", "Medium"],
        ["Value stream map", "Finding waste in manufacturing or service flows", "Medium–high"],
        ["BPMN diagram", "Formal documentation and automation", "Medium–high"]])}
<div class="example"><b>Example.</b> A financial aid office had scholarship decisions running three weeks late. Mapping the flow showed applications sitting about five days in a shared inbox that nobody was assigned to watch. Assigning one person to monitor the inbox removed most of the delay. No new software was needed; the map made the problem visible.</div>
<p><b>Building a BPMN map in Lucidchart</b> (the course tool): sign in with your IU Microsoft account; choose New → Lucidchart → Blank Document; close the template and Lucid AI pop-ups; in the Shapes panel search for <b>“BPMN 2.0”</b> and pin that library; drag shapes onto the canvas; double-click a shape to type its label; connect shapes by dragging from one shape's connection point to another (the lines follow when you move shapes). Ctrl + scroll zooms; right-click-drag pans.</p>
<div class="keyidea"><b>Key idea.</b> Match the map to the job: a single-person checklist needs only a flowchart; handoffs between roles need swimlanes; hunting waste calls for a value stream map; formal documentation or automation calls for BPMN.</div>
<div class="trap"><b>Common trap.</b> Thinking a fancier map is always better. A BPMN diagram for a three-step, one-person task adds effort without insight; a basic flowchart for a five-department process hides who does what.</div>`,
      gens: ["k201-ch4-maps"],
    },
    {
      title: "BPMN notation: the core symbols",
      lo: "Identify BPMN events, tasks, gateways, sequence and message flows, pools and lanes.",
      html: `<p><b>BPMN (Business Process Model and Notation)</b> is a standard graphical notation maintained by the <b>Object Management Group (OMG)</b>. Because it is standardized, business people and technical people can read the same diagram. It says more than a plain flowchart: who is responsible (lanes), where the process starts and ends (events), which work is done (tasks), where decisions happen (gateways) and how information moves.</p>
${tbl(["Symbol", "Element", "Meaning"], [
        [PIC.start(), "Start event (thin circle)", "Where the process begins; the trigger"],
        [PIC.end(), "End event (thick circle)", "Where a path finishes; the result"],
        [PIC.inter(), "Intermediate event (double circle)", "Something that happens mid-process, e.g. a timer or a message arriving"],
        [PIC.task(), "Task / activity (rounded rectangle)", "A unit of work, e.g. “Review application”"],
        [PIC.xor(), "Exclusive gateway (diamond with X)", "A decision: exactly one outgoing path is taken"],
        [PIC.and(), "Parallel gateway (diamond with +)", "All outgoing paths run at the same time (and a + join waits for all of them)"],
        [PIC.seq(), "Sequence flow (solid arrow)", "The order of steps inside a pool"],
        [PIC.msg(), "Message flow (dashed arrow)", "Communication between different pools (organizations)"],
        [PIC.pool(), "Pool (outer rectangle)", "A whole participant or organization"],
        [PIC.lane(), "Lane (band inside a pool)", "A role or department within that participant"]])}
<div class="keyidea"><b>Key idea.</b> Circles are events, rounded boxes are work, diamonds are decisions. A task sits in the lane of whoever does it, so an arrow that crosses a lane boundary is a <b>handoff</b>.</div>
<div class="example"><b>Example.</b> A food delivery app's pool might have lanes for Customer, App and Courier. The restaurant is a <em>different organization</em>, so it gets its own pool, and the order sent to it is drawn as a dashed message flow, not a solid sequence flow.</div>
<div class="trap"><b>Common trap.</b> Mixing up X and +. An X diamond means <em>either/or</em> (one path per case). A + diamond means <em>all at once</em>; it does not create alternative paths. Also: thin circle = start, thick circle = end.</div>`,
      gens: ["k201-ch4-symbols"],
    },
    {
      title: "Reading a BPMN diagram: paths, lanes and handoffs",
      lo: "Trace the paths through a BPMN diagram and identify roles, decisions, handoffs and outcomes.",
      html: `<p>To read a BPMN diagram, put your finger on the start event and follow the arrows, like a token moving through the process.</p>
${LESSON_ORDER}
<ul>
<li><b>Lanes</b> tell you <em>who</em>: “Place order” sits in the Customer lane, so the customer does it; “Request payment validation” sits in the System lane.</li>
<li><b>Handoffs</b> are arrows that cross a lane line. Here, the flow crosses from Customer to System once.</li>
<li><b>Exclusive gateways</b> split the flow. At “Payment valid?” each order takes exactly one branch: Yes → Confirm order; No → Notify payment failure → Order cancelled.</li>
<li><b>Counting paths</b>: count the distinct start-to-end routes. This diagram has <b>2 paths</b>, though any single order follows only one of them.</li>
</ul>
<p>A useful counting shortcut: a decision whose “leave” branch goes to an end event adds one path. A decision whose extra branch rejoins the main flow (for example “Fines owed? Yes → Pay fine → continue”) <b>doubles</b> the routes that pass through it. A parallel (+) block adds <b>no</b> paths, because every case does all of its branches.</p>
<div class="example"><b>Example.</b> The library diagram below has two decisions. “Book available? No” leaves (1 path). The available branch then meets “Fines owed?”, where both answers end at “Book checked out” (2 paths). Total: 1 + 2 = <b>3 paths</b>. Most students follow the shortest successful one (available, no fines).</div>
${LESSON_LIB}
<div class="keyidea"><b>Key idea.</b> Paths = distinct routes the process <em>could</em> take; handoffs = lane crossings along a route; the lane a task sits in = who is responsible for it.</div>
<div class="trap"><b>Common trap.</b> Counting end events, or gateways, instead of paths. Two paths can end at the same end event (the library's “Book checked out” is reached two ways), and a parallel gateway's branches are not alternatives.</div>`,
      gens: ["k201-ch4-read"],
    },
    {
      title: "From ITO to BPMN: bottlenecks, metrics and control points",
      lo: "Map ITO elements onto BPMN and use the map to find bottlenecks, choose metrics and place control points.",
      html: `<p>ITO and BPMN describe the same process at different levels of detail. They line up like this:</p>
${tbl(["ITO element", "BPMN element"], [
        ["Input (the request or data that arrives)", "Start event trigger; data objects or messages coming in"],
        ["Transformation steps", "Tasks / activities"],
        ["Decisions during the transformation", "Gateways"],
        ["Output (the result)", "End event; data objects or results leaving"],
        ["Feedback", "Intermediate events or loops back to earlier tasks"]])}
<p>Once the map exists, analyze it:</p>
<ul>
<li><b>Bottleneck</b>: the step where work piles up and waits, limiting how fast the whole process can go (the unwatched inbox in the financial aid case).</li>
<li><b>Failure point</b>: a step where things often go wrong (a payment that fails, a form submitted incomplete).</li>
<li><b>Metric</b>: a number that tells you whether the process is performing, e.g. average payment-validation time, % of payments that fail, cycle time from request to result.</li>
<li><b>Control point</b>: a check that catches errors or prevents misuse before they spread, e.g. the librarian scanning the student ID before checkout, a validation rule on a form, a manager approval above a dollar limit.</li>
</ul>
<p><b>Cycle time</b> is the total elapsed time from start to finish, work time plus waiting time. Waiting is usually the biggest non-value-adding share.</p>
<div class="example"><b>Example: library borrowing debrief.</b> Bottleneck: the single circulation desk line at the start of term. Metric: average minutes from reaching the desk to leaving with the book. Control point: scanning the ID and barcode so only eligible students borrow and the system knows who has which book. Automation idea: a self-checkout kiosk can take over the librarian's scanning task, the rules-based, repetitive step.</div>
<div class="keyidea"><b>Key idea.</b> Look for where work <em>waits</em> (bottlenecks), where it <em>fails</em> (failure points), how you will <em>measure</em> it (metrics), and where you <em>check</em> it (controls).</div>
<div class="trap"><b>Common trap.</b> Assuming the step with the longest work time is the bottleneck. A 40-minute surgery that never has a queue is not the bottleneck; a 2-minute sign-off that leaves files waiting 3 days is.</div>`,
      gens: ["k201-ch4-improve"],
    },
    {
      title: "As-Is vs. To-Be and gap analysis",
      lo: "Compare As-Is and To-Be processes, choose documentation techniques, set To-Be goals and identify implementation gaps.",
      html: `<p>The <b>As-Is</b> process is the one that actually happens today, including workarounds, informal steps and inefficiencies. The <b>To-Be</b> process is the redesigned, improved version.</p>
<p>Why document the As-Is first?</p>
<ul>
<li>People quietly work around official procedures, so the <em>documented</em> process often differs from the <em>real</em> one.</li>
<li>Problems have root causes you only find by looking at what really happens.</li>
<li>You need a <b>baseline</b> to prove the To-Be is an improvement.</li>
</ul>
<p>Four ways to document the As-Is: <b>process interviews</b> (“Walk me through exactly what you do”), <b>observation</b> (watching the work, which reveals workarounds people forget to mention), <b>document review</b> (forms, reports, templates, system logs) and <b>workshop mapping</b> (all the roles map it together). The rule during this phase: be <b>descriptive, not prescriptive</b>. Record what is; save the fixes for later.</p>
<p>Typical <b>To-Be goals</b>: reduce cycle time (remove waiting, run independent steps in parallel); reduce errors (validation, simpler steps, error-proofing); clarify ownership of fuzzy handoffs; improve the customer experience; and enable automation of rules-based, repetitive steps. Improvements need not be radical: dropping one approval, merging two forms or moving a decision earlier can matter a lot.</p>
<p>A <b>gap analysis</b> lines the two up, element by element:</p>
${tbl(["Element", "As-Is", "To-Be", "Gap / action"], [
        ["Time in review queue", "4 days", "Same day", "Workflow software that routes files automatically"],
        ["Approvals", "3 in sequence", "2 in parallel", "Change the approval policy; update the system"],
        ["Customer notice", "Printed letter", "Automatic text/email", "Configure notifications"],
        ["Data-entry error rate", "6%", "Under 1%", "Validation rules on the input form"]])}
<div class="example"><b>Example.</b> A clinic's official procedure says front-desk staff scan insurance cards into the system. Observation shows they photocopy them and type numbers in later because the scanner jams. Interviewing alone would have missed that; it is exactly the kind of workaround the As-Is must capture.</div>
<div class="keyidea"><b>Key idea.</b> As-Is = honest baseline (describe it). To-Be = target (design it). Gap = what must change to get from one to the other (people, policy, technology).</div>
<div class="trap"><b>Common trap.</b> Documenting the process “as it should be” and calling it As-Is, or fixing problems in the middle of documenting. Both destroy the baseline you need to measure improvement.</div>`,
      gens: ["k201-ch4-tobe"],
    },
    {
      title: "Change management: making the To-Be stick",
      lo: "Identify barriers to process change and the practices that help people adopt a new process; judge the right role for automation.",
      html: `<p>A brilliant To-Be diagram is worthless if nobody works that way. <b>Change management</b> is helping people and organizations move to the new way of working.</p>
<p>Three common <b>barriers</b>:</p>
<ul>
<li><b>Resistance to change</b>: people defend the familiar, especially when they had no say in the redesign.</li>
<li><b>Training gaps</b>: people want to follow the new process but do not know how.</li>
<li><b>Organizational inertia</b>: policies, systems and incentives still reward the old process (e.g. staff are still evaluated on a metric the new process no longer uses).</li>
</ul>
<p>Practices that help: <b>involve frontline employees</b> in the redesign, <b>communicate clearly why</b> the change is happening, provide <b>adequate training</b>, and <b>celebrate early wins</b> so momentum builds.</p>
<p>On <b>automation</b>: hand systems the rules-based, repetitive steps (routing, notifications, checking a field is filled in) and keep people on judgment, exceptions and relationships. Automating a broken process just produces bad results faster.</p>
<div class="example"><b>Example.</b> A warehouse adds handheld scanners, but pickers keep using paper lists. Asking why reveals two causes: nobody showed the night shift how to use the scanners (training gap), and bonuses are still based on paper tallies (inertia). The fix is training plus changing the bonus rule, not a memo telling people to try harder.</div>
<div class="keyidea"><b>Key idea.</b> Diagnose the barrier before choosing the remedy: resistance → involve people and explain why; training gap → train; inertia → change the policies, systems and incentives that still reward the old way.</div>
<div class="trap"><b>Common trap.</b> Treating every adoption problem as “resistance.” If people simply were not trained, persuasion will not help; if incentives reward the old process, training will not help either.</div>`,
      gens: ["k201-ch4-change"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "k201-ch4-c-process", tag: "Definition", front: "What is a <em>business process</em>?", back: "A set of related tasks, done by people, systems or both, that together achieve an organizational goal. Each task takes inputs, transforms them (changes their status) and produces an output for the next task." },
    { id: "k201-ch4-c-bpm", tag: "Definition", front: "What is <em>Business Process Management (BPM)</em>?", back: "The <b>ongoing</b> management of processes: discovering, modeling, running, measuring and improving them, especially when results are poor or no longer meet requirements." },
    { id: "k201-ch4-c-lifecycle", tag: "List", front: "Name the five BPM lifecycle stages in order.", back: "1) Process <b>design</b> (discovery & analysis) → 2) process <b>modeling</b> → 3) process <b>execution</b> (implementation) → 4) process <b>monitoring</b> → 5) process <b>optimization</b> (improvement) → back to design." },
    { id: "k201-ch4-c-benefits", tag: "List", front: "What four benefits does BPM aim for?", back: "<b>Efficiency</b> (less waste, time, money), <b>consistency</b> (same quality every time), <b>accountability</b> (clear owner for each step), <b>adaptability</b> (change quickly when conditions shift)." },
    { id: "k201-ch4-c-isprocess", tag: "Principle", front: "How are information systems and business processes related?", back: "Not every process uses an IS, but <b>every IS must support one or more processes</b>. New systems are typically conceived and built during a BPM lifecycle redesign." },
    { id: "k201-ch4-c-ito", tag: "Definition", front: "What does each part of ITO mean?", back: "<b>Input</b>: what enters (materials, information, requests, payment). <b>Transform</b>: the activities that convert inputs and add value (the “black box”). <b>Output</b>: the product, service or result that leaves." },
    { id: "k201-ch4-c-feedback", tag: "Distinction", front: "What makes something <em>feedback</em> rather than just a later step?", back: "Feedback is <b>information about the output</b> (quality, results, complaints) that flows back to <b>change the transformation</b>. E.g. late-delivery complaints → new routes. Shipping the box is an output step, not feedback." },
    { id: "k201-ch4-c-inputforms", tag: "List", front: "Name five forms an input can take, with an example of each.", back: "Physical materials (parts, a laptop to repair); information (a work order, customer data); people (patients arriving); financial resources (payment, budget); energy/utilities (power, water, bandwidth)." },
    { id: "k201-ch4-c-outputforms", tag: "List", front: "Name four forms an output can take.", back: "Physical goods; services (a finished appointment, a resolved complaint); information (a grade, a report, a tax return); transformed materials (recycled aluminum, refined fuel)." },
    { id: "k201-ch4-c-valuetypes", tag: "List", front: "Five ways a transformation can add value?", back: "Changing <b>form</b> (wood → table), <b>location</b> (warehouse → doorstep), <b>state of information</b> (raw data → report), <b>ownership</b> (seller → buyer), or providing <b>access/experience</b> (a concert)." },
    { id: "k201-ch4-c-nva", tag: "Application", front: "Give three examples of non-value-adding steps.", back: "Waiting in a queue, rework to fix errors, excessive approvals (also: re-keying the same data, moving paper around). Test: would the customer miss the step if it disappeared?" },
    { id: "k201-ch4-c-chain", tag: "Principle", front: "Why are processes described as <em>linked</em>?", back: "One process's <b>output</b> often becomes another process's <b>input</b>: a manufactured product becomes the input to shipping; admitted-student data becomes the input to enrollment." },
    { id: "k201-ch4-c-map", tag: "Definition", front: "What is a process map, and what four purposes does it serve?", back: "A visual of a process's steps, order, people/systems and decisions. Purposes: <b>communication</b>, <b>training</b>, <b>analysis</b> (find bottlenecks, redundancy, gaps) and <b>improvement</b> (you can't improve what you can't see)." },
    { id: "k201-ch4-c-maptypes", tag: "Distinction", front: "When would you use a basic flowchart vs. swimlane vs. value stream map vs. BPMN?", back: "Flowchart: simple linear process (low complexity). Swimlane: several roles (medium). Value stream map: hunting waste in a production/service flow (medium–high). BPMN: formal documentation and automation (medium–high)." },
    { id: "k201-ch4-c-aidcase", tag: "Application", front: "What did mapping reveal in the financial aid scholarship-delay case?", back: "Applications sat ~5 days in an inbox nobody monitored. Assigning someone to watch it fixed most of the 3-week delay: the map made an invisible wait visible." },
    { id: "k201-ch4-c-bpmn", tag: "Definition", front: "What is BPMN and who maintains it?", back: "<b>Business Process Model and Notation</b>: a standardized graphical notation for processes, maintained by the <b>Object Management Group (OMG)</b>, readable by both business and technical people." },
    { id: "k201-ch4-c-events", tag: "Distinction", front: "Thin circle vs. thick circle vs. double circle in BPMN?", back: "Thin = <b>start event</b>; thick = <b>end event</b>; double = <b>intermediate event</b> (something mid-process, like a timer or a message received)." },
    { id: "k201-ch4-c-gateways", tag: "Distinction", front: "Diamond with X vs. diamond with + ?", back: "<b>X = exclusive gateway</b>: exactly one outgoing path is taken. <b>+ = parallel gateway</b>: all outgoing paths run at the same time (a + join waits for all)." },
    { id: "k201-ch4-c-flows", tag: "Distinction", front: "Solid arrow vs. dashed arrow in BPMN?", back: "Solid = <b>sequence flow</b>: order of steps within a pool. Dashed = <b>message flow</b>: communication between different pools (organizations)." },
    { id: "k201-ch4-c-poollane", tag: "Distinction", front: "Pool vs. lane?", back: "A <b>pool</b> is a whole participant or organization (e.g. Online Retailer). A <b>lane</b> is a band inside it for one role or department (Customer, Warehouse, Billing)." },
    { id: "k201-ch4-c-handoff", tag: "Principle", front: "How do you spot a handoff on a BPMN diagram, and why do handoffs matter?", back: "A sequence-flow arrow that <b>crosses a lane boundary</b>. Handoffs are where work changes hands, so they are common spots for waiting, lost information and unclear ownership." },
    { id: "k201-ch4-c-paths", tag: "Application", front: "How do you count the paths in a BPMN diagram?", back: "Count distinct start-to-end routes. An exclusive gateway whose branch ends adds one; a branch that rejoins doubles the routes through it; a parallel block adds none. Don't just count end events or gateways." },
    { id: "k201-ch4-c-itobpmn", tag: "Distinction", front: "How do ITO elements map onto BPMN?", back: "Input → start event trigger / incoming data or messages. Transformation → tasks. Decisions → gateways. Output → end event / outgoing results. Feedback → intermediate events or loops back to earlier tasks." },
    { id: "k201-ch4-c-bottleneck", tag: "Definition", front: "What is a bottleneck?", back: "The step where work <b>piles up and waits</b>, limiting the speed of the whole process. Not necessarily the step with the longest work time." },
    { id: "k201-ch4-c-control", tag: "Definition", front: "What is a control point? Give an example.", back: "A check that catches errors or prevents misuse before they spread, e.g. scanning a student ID before a checkout, a required-field rule on a form, a second approval above $5,000." },
    { id: "k201-ch4-c-metric", tag: "Application", front: "Give two process metrics for an online checkout process.", back: "Average payment-validation time; % of payments that fail. (Others: order-to-ship cycle time, abandoned-cart rate.)" },
    { id: "k201-ch4-c-library", tag: "Application", front: "Library borrowing exercise: what are the minimum BPMN requirements?", back: "One pool; at least two lanes (Student, Librarian); a start event; at least two end events; at least two exclusive gateways (e.g. Available? Fines?); every task in the lane of whoever does it." },
    { id: "k201-ch4-c-asis", tag: "Distinction", front: "As-Is vs. To-Be?", back: "<b>As-Is</b>: how the process actually runs today, workarounds and all. <b>To-Be</b>: the redesigned, improved process you are aiming for." },
    { id: "k201-ch4-c-whyasis", tag: "Principle", front: "Why document the As-Is before designing the To-Be? (3 reasons)", back: "1) People work around official procedures, so the real process differs from the documented one; 2) problems have root causes you must find; 3) you need a baseline to measure improvement." },
    { id: "k201-ch4-c-docmethods", tag: "List", front: "Four techniques for documenting an As-Is process?", back: "<b>Interviews</b> (“walk me through exactly what you do”), <b>observation</b> (reveals informal workarounds), <b>document review</b> (forms, reports, logs), <b>workshop mapping</b> (all roles map it together)." },
    { id: "k201-ch4-c-descriptive", tag: "Principle", front: "What does “descriptive, not prescriptive” mean for As-Is work?", back: "Record what <em>is</em>, including the ugly parts. Don't redesign or fix things while documenting; that comes in the To-Be phase." },
    { id: "k201-ch4-c-tobegoals", tag: "List", front: "Five typical To-Be goals?", back: "Reduce cycle time; reduce errors; clarify ownership; improve customer experience; enable automation of rules-based, repetitive steps." },
    { id: "k201-ch4-c-gap", tag: "Definition", front: "What is a gap analysis?", back: "A side-by-side comparison of As-Is and To-Be for each element (time, approvals, notices, error rate…) that names the <b>action</b> needed to close each gap (software, policy change, validation rules…)." },
    { id: "k201-ch4-c-barriers", tag: "List", front: "Three barriers to process change?", back: "<b>Resistance to change</b> (worse if people weren't involved), <b>training gaps</b>, <b>organizational inertia</b> (policies, systems, incentives still built for the old process)." },
    { id: "k201-ch4-c-practices", tag: "List", front: "Four change-management practices that help adoption?", back: "Involve frontline employees in the redesign; communicate clearly why; provide adequate training; celebrate early successes." },
    { id: "k201-ch4-c-automation", tag: "Principle", front: "Which steps are good candidates for automation?", back: "Rules-based, repetitive steps (routing, notifications, field checks, scanning). Keep people on judgment and exceptions, and fix a broken process before automating it." },
    { id: "k201-ch4-c-lucid", tag: "List", front: "How do you start a BPMN diagram in Lucidchart?", back: "Sign in with IU Microsoft account → New → Lucidchart → Blank Document → close templates / Lucid AI pop-ups → search Shapes for “BPMN 2.0” and pin it → drag shapes, double-click to label, drag between shapes to connect." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "“Find out how it really works”, “measure”, “redesign”, “launch”, “improve” in a cycle", think: "BPM lifecycle stage", why: "Design → model → execute → monitor → optimize, then repeat." },
    { when: "“Same quality every time” / “who is responsible” / “less waste” / “change quickly”", think: "Consistency / accountability / efficiency / adaptability", why: "The four things BPM aims to deliver." },
    { when: "Resources, requests or data entering", think: "ITO input", why: "Comes in from outside the transformation." },
    { when: "Complaints, ratings, defect counts that lead to a change", think: "ITO feedback", why: "Information about the output flowing back to improve the transformation." },
    { when: "Waiting, rework, re-keying, extra sign-offs", think: "Non-value-adding step", why: "The customer would not miss it." },
    { when: "Several roles or departments in one process", think: "Swimlane or BPMN map", why: "Lanes show who does what and where handoffs happen." },
    { when: "Thin / thick / double circle", think: "Start / end / intermediate event", why: "Line weight distinguishes event types." },
    { when: "Diamond with X vs. diamond with +", think: "Exclusive (one path) vs. parallel (all paths)", why: "X is either/or; + is all at once." },
    { when: "Dashed arrow between two organizations", think: "Message flow between pools", why: "Solid sequence flows stay inside one pool." },
    { when: "An arrow crossing a lane line", think: "Handoff", why: "Responsibility moves to another role; watch for delays." },
    { when: "“How many paths…?”", think: "Count distinct start-to-end routes", why: "Not end events or gateways; parallel branches are not alternatives." },
    { when: "“Work piles up”, “sits in an inbox”, long queue", think: "Bottleneck", why: "Where waiting limits the whole process." },
    { when: "A check, scan, approval or validation rule", think: "Control point", why: "Catches errors or misuse before they spread." },
    { when: "“What actually happens today”, workarounds", think: "As-Is (descriptive)", why: "Baseline first; don't fix while documenting." },
    { when: "A table of As-Is vs. To-Be values", think: "Gap analysis → name the action", why: "Each gap needs a concrete change: software, policy, rule, training." },
    { when: "“They didn't know how” / “they didn't want to” / “the bonus still rewards the old way”", think: "Training gap / resistance / inertia", why: "Diagnose the barrier before choosing the fix." },
  ];

  /* ============================================================
   * TOPIC 1 · BPM: lifecycle and benefits
   * ============================================================ */
  const STAGES = ["Process design", "Process modeling", "Process execution", "Process monitoring", "Process optimization"];
  const STAGE_DEF = {
    "Process design": "discovering and analyzing how the work is done and what is wrong with it",
    "Process modeling": "drawing the process as a map or BPMN diagram",
    "Process execution": "putting the (re)designed process into action, often with a new system",
    "Process monitoring": "measuring how the running process performs",
    "Process optimization": "using the measurements to improve the process, feeding the next design round",
  };
  const LIFE = [
    { t: "An analyst interviews the clinic's front-desk staff to learn how patient check-in really works.", cat: "Process design", why: "Interviewing people to discover the current process is discovery and analysis, the design stage." },
    { t: "A team lists the complaints about the dorm-repair request process and traces each to its cause.", cat: "Process design", why: "Analyzing what is going wrong and why is part of design (discovery & analysis)." },
    { t: "Consultants shadow warehouse pickers for a week to see which steps cause delays.", cat: "Process design", why: "Observing to understand the process and its problems is discovery." },
    { t: "The registrar's office studies why transcript requests take two weeks before deciding what to change.", cat: "Process design", why: "Investigating the cause of poor results comes before any drawing or change: design stage." },
    { t: "A student analyst draws the returns process in Lucidchart using BPMN 2.0 shapes.", cat: "Process modeling", why: "Creating the diagram is the modeling stage." },
    { t: "The team turns its whiteboard sketch of the hiring process into a swimlane diagram with one lane per role.", cat: "Process modeling", why: "Representing the process visually is modeling." },
    { t: "An analyst adds gateways and end events to the diagram so every possible outcome of a loan request is shown.", cat: "Process modeling", why: "Refining the picture of the process is still modeling." },
    { t: "Two versions of the new check-in flow are drawn side by side so managers can compare them.", cat: "Process modeling", why: "Producing diagrams of the process (here, alternatives) is modeling." },
    { t: "The food bank goes live with its new online volunteer sign-up form on Monday.", cat: "Process execution", why: "Putting the new process into operation is execution (implementation)." },
    { t: "Staff begin using the new ticketing software for every IT request from today on.", cat: "Process execution", why: "The redesigned process is now being run: execution." },
    { t: "The bakery rolls out its new order-ahead app and retrains counter staff to fill app orders first.", cat: "Process execution", why: "Implementing the designed process, with training, is execution." },
    { t: "The library switches on self-checkout kiosks at the circulation desk.", cat: "Process execution", why: "Launching the new way of working is execution." },
    { t: "A dashboard now shows the average time from order to shipment, updated daily.", cat: "Process monitoring", why: "Measuring process performance is monitoring." },
    { t: "The help desk tracks what percentage of tickets are solved on the first call.", cat: "Process monitoring", why: "Tracking a performance metric of the running process is monitoring." },
    { t: "Each month the clinic reports how many claims were rejected for missing information.", cat: "Process monitoring", why: "Regularly measuring errors in a live process is monitoring." },
    { t: "Managers compare this semester's average advising wait time to last semester's.", cat: "Process monitoring", why: "Measuring how the process performs over time is monitoring." },
    { t: "After seeing that weekend orders ship slowly, the store adds a Saturday packing shift.", cat: "Process optimization", why: "Using monitoring results to improve the process is optimization." },
    { t: "Because 30% of forms come back incomplete, the office makes three fields mandatory in the online form.", cat: "Process optimization", why: "Changing the process in response to measured problems is optimization." },
    { t: "Survey results show long pickup lines, so the café moves mobile orders to a separate shelf.", cat: "Process optimization", why: "Improving the process based on feedback is optimization." },
    { t: "Data shows approvals stall at one manager, so a backup approver is added for absences.", cat: "Process optimization", why: "A targeted improvement driven by monitoring data is optimization." },
  ];
  const BENEFITS = ["Efficiency", "Consistency", "Accountability", "Adaptability"];
  const BEN_DEF = {
    Efficiency: "less waste, so less time or money per unit of work",
    Consistency: "every customer gets the same quality because the process is documented",
    Accountability: "it is clear who is responsible for each step",
    Adaptability: "the process can be changed quickly when circumstances shift",
  };
  const BEN = [
    { t: "Orders now take 2 days instead of 5 to process, with the same staff.", cat: "Efficiency", why: "Less time for the same work is an efficiency gain." },
    { t: "Removing a duplicate data-entry step saves the office 20 staff hours a week.", cat: "Efficiency", why: "Eliminating waste to save time is efficiency." },
    { t: "The print shop cuts paper waste in half by checking files before printing.", cat: "Efficiency", why: "Reducing wasted materials is efficiency." },
    { t: "Combining two forms into one means each application costs less to process.", cat: "Efficiency", why: "A lower cost per unit of work is efficiency." },
    { t: "The café's new layout lets two baristas serve as many customers as three used to.", cat: "Efficiency", why: "Same output with fewer resources is efficiency." },
    { t: "Every new hire at any branch now gets the same orientation checklist and the same first-week experience.", cat: "Consistency", why: "A documented process delivering the same result every time is consistency." },
    { t: "Customers get the same quality of oil change whichever technician is on shift.", cat: "Consistency", why: "Uniform quality regardless of who does the work is consistency." },
    { t: "All refund requests are now handled with one documented set of rules instead of each clerk's own judgment.", cat: "Consistency", why: "Standardizing the process so each case is treated the same is consistency." },
    { t: "Each franchise location follows the same recipe card, so the burger tastes the same in every city.", cat: "Consistency", why: "Same quality for every customer is consistency." },
    { t: "Customers' complaint emails now receive the same three-part reply, regardless of who answers.", cat: "Consistency", why: "A standard process giving uniform service is consistency." },
    { t: "The new map shows exactly which role approves purchases over $1,000.", cat: "Accountability", why: "Clear ownership of a step is accountability." },
    { t: "When a shipment is late, managers can see which step and which team held it up.", cat: "Accountability", why: "Knowing who is responsible for each step is accountability." },
    { t: "Each lane in the diagram names the department that owns the tasks inside it.", cat: "Accountability", why: "Assigning responsibility per step is accountability." },
    { t: "Every ticket now has a named owner from the moment it is opened until it is closed.", cat: "Accountability", why: "A named responsible person per step is accountability." },
    { t: "No more “I thought you were handling that”: the handoff between sales and billing has a named owner.", cat: "Accountability", why: "Clarifying who owns an ambiguous handoff is accountability." },
    { t: "When a new privacy law passed, the clinic updated its intake process within a week.", cat: "Adaptability", why: "Quickly changing the process when conditions shift is adaptability." },
    { t: "Because the process was already mapped, the store switched to curbside pickup in two days when the pandemic hit.", cat: "Adaptability", why: "A well-understood process can be changed fast: adaptability." },
    { t: "When a supplier went out of business, the team rerouted the ordering steps to a new supplier in a day.", cat: "Adaptability", why: "Responding quickly to a changed circumstance is adaptability." },
    { t: "The university moved advising appointments online over one weekend when a storm closed campus.", cat: "Adaptability", why: "Rapid change in response to new conditions is adaptability." },
    { t: "When demand doubled in December, the shop added a parallel packing step within days.", cat: "Adaptability", why: "Adjusting the process quickly to new circumstances is adaptability." },
  ];
  const lifeSV = K.sortVariants({ key: "ch4-life", bank: LIFE, cats: STAGES, defs: STAGE_DEF, ask: "activity",
    hint: "BPM is a loop: find out how it works (design) → draw it (model) → run it (execute) → measure it (monitor) → improve it (optimize)." });
  const benSV = K.sortVariants({ key: "ch4-ben", bank: BEN, cats: BENEFITS, defs: BEN_DEF, ask: "result",
    hint: "Ask what changed: less time/money (efficiency), sameness of quality (consistency), clarity of who owns a step (accountability), or speed of change (adaptability)." });

  const BPM_CONCEPT = [
    { q: "Which statement about information systems and business processes is correct?", right: "Every information system should support at least one business process, but some processes run without any information system.",
      rightWhy: "An IS exists to support work; a process (like a garage sale) can run on paper and people alone.",
      wrong: [{ t: "Every business process requires an information system.", why: "Many processes are manual; a lemonade stand has a process but no IS." },
        { t: "Information systems can be built independently of any process and later find a use.", why: "A system that supports no process has no purpose; systems are conceived inside process redesign." },
        { t: "Processes and information systems are unrelated topics.", why: "Systems are typically designed and implemented within the BPM lifecycle." }],
      sol: ["Think about which one exists to serve the other.", "Systems support processes; processes may or may not use a system."] },
    { q: "A youth league replaces paper sign-up sheets with an online form that feeds a database. What has happened, in BPM terms?", right: "The sign-up process was redesigned, and an information system was created as part of that redesign.",
      rightWhy: "Information systems are often born inside a process redesign; the form plus database is now a volunteer/registration system.",
      wrong: [{ t: "Only the technology changed; the process is the same.", why: "How people sign up, and what happens to their data, changed. That is a new process." },
        { t: "Nothing in BPM terms, because BPM only concerns factories.", why: "BPM applies to any organization's processes, including clubs and schools." },
        { t: "The league has finished BPM and never needs to revisit the process.", why: "BPM is a continuous lifecycle; the new process will be monitored and optimized." }],
      sol: ["Ask what changed: the work, the tool, or both?", "The process was redesigned and an IS was introduced to support it."] },
    { q: "Why is BPM called a <em>lifecycle</em> rather than a one-time project?", right: "Because optimization leads back into design: processes are continuously monitored and improved.",
      rightWhy: "The stages loop: monitoring reveals problems, optimization fixes them, and the cycle repeats.",
      wrong: [{ t: "Because every process eventually dies and must be replaced.", why: "Lifecycle here means a repeating loop of improvement, not a process's death." },
        { t: "Because the five stages must be done once, in order, and then stop.", why: "The stages repeat; stopping after optimization misses the point." },
        { t: "Because it describes the lifecycle of the software used.", why: "BPM is about the business process, not a software release cycle." }],
      sol: ["Look at what happens after the last stage.", "Optimization feeds the next round of design, so the cycle continues."] },
    { q: "In the coffee-order process, the barista records the customer's name and drink. What does that task do, in process terms?", right: "It takes an input (the spoken order), transforms it (changes its status to recorded) and produces an output used by the next task.",
      rightWhy: "Each task in a process has inputs, a transformation and an output that often feeds the next task.",
      wrong: [{ t: "It is the final output of the whole process.", why: "The final output is the drink handed to the customer; recording the order is an intermediate step." },
        { t: "It is feedback.", why: "Feedback is information about the output coming back to improve the process; this is a normal step." },
        { t: "It is not part of the process because no money changes hands.", why: "Processes include every related task toward the goal, paid or not." }],
      sol: ["Every task in a process has the same small anatomy.", "Input → transformation (status change) → output to the next task."] },
    { q: "A gym's membership signup has a step where staff ask “Student or regular?” and handle each differently. What does this tell you about processes?", right: "Processes are not always linear; decision points send work down alternative paths.",
      rightWhy: "Decisions (gateways in BPMN) create branches.",
      wrong: [{ t: "The process is badly designed, because good processes are strictly linear.", why: "Decisions are normal; the goal is to show them clearly, not to remove them." },
        { t: "It is two unrelated processes.", why: "It is one process with a branch that serves the same goal." },
        { t: "The question is feedback.", why: "Feedback returns information about the output; this is a decision during the transformation." }],
      sol: ["What do you call a point where the flow can go two ways?", "A decision point / gateway: processes branch."] },
  ];
  const BPM_TF = [
    { s: "Process monitoring comes before process execution in the BPM lifecycle.", truth: false, why: "You cannot measure a process you have not put into action yet: design → model → execute → monitor → optimize.", hint: "Recall the order of the five stages." },
    { s: "Process optimization feeds back into a new round of process design.", truth: true, why: "That loop is why BPM is a lifecycle.", hint: "Is BPM a one-time project or a loop?" },
    { s: "“Every customer gets the same quality” describes the BPM benefit of efficiency.", truth: false, why: "That is consistency. Efficiency is about less time, money or waste.", hint: "Match the outcome to one of the four benefits." },
    { s: "Accountability means it is clear who is responsible for each step of a process.", truth: true, why: "Clear ownership per step is exactly the accountability benefit.", hint: "Recall the four benefits." },
    { s: "Every information system must relate to one or more business processes.", truth: true, why: "Systems exist to support work; a system that supports no process has no purpose.", hint: "Which serves which?" },
    { s: "A business process must be carried out entirely by computers.", truth: false, why: "Processes can be done by people, systems or both.", hint: "Recall the definition of a business process." },
    { s: "Process modeling means drawing the process, for example as a BPMN diagram.", truth: true, why: "Modeling = visual representation of the process.", hint: "What is a model?" },
    { s: "Interviewing staff to learn how a process really works belongs to the process execution stage.", truth: false, why: "Discovery and analysis belong to process design, the first stage.", hint: "Which stage is about finding out how things work today?" },
  ];

  /* ============================================================
   * TOPIC 2 · ITO analysis and value
   * ============================================================ */
  const ITO_CATS = ["Input", "Transformation", "Output", "Feedback"];
  const ITO_DEF = { Input: "what enters the process", Transformation: "an activity that converts inputs (adds value)", Output: "the product, service or result that leaves", Feedback: "information about the output that returns to improve the process" };
  const PROCS = [
    { name: "university admissions", in: ["Completed application forms", "Application fees", "Letters of recommendation", "Test scores"], tr: ["Checking each file for completeness", "Verifying transcripts", "Committee evaluation of each applicant", "Voting on admission decisions"], out: ["Admit, waitlist or deny letters", "Admitted students' records sent to the enrollment system"], fb: ["Tracking how admitted students perform, to adjust admission criteria", "Last year's yield rate, used to decide how many offers to make"] },
    { name: "a coffee shop latte order", in: ["The customer's drink request", "Coffee beans and milk", "The customer's payment"], tr: ["Grinding the beans", "Steaming the milk", "Pulling the espresso shot"], out: ["The finished latte handed to the customer", "The printed receipt"], fb: ["Customers saying drinks are too sweet, so the syrup amount is reduced", "Ratings about slow service, so a second barista is scheduled at rush hour"] },
    { name: "a brake repair at Sparky's Auto Care", in: ["The car with a squealing brake", "The customer's description of the noise", "Replacement brake pads"], tr: ["Running a diagnostic inspection", "Replacing the brake pads", "Road-testing the car"], out: ["The repaired car returned to the customer", "The invoice and service record"], fb: ["Repeat visits for the same problem, prompting technician retraining", "Survey comments about long waits, prompting more appointment slots"] },
    { name: "a hospital emergency visit", in: ["The arriving patient", "The patient's insurance information", "Medical supplies and medications"], tr: ["Triage by a nurse", "Examination by a physician", "Treatment of the injury"], out: ["The discharged patient with care instructions", "The updated medical record"], fb: ["Readmission rates reviewed to improve discharge instructions", "Complaints about waiting times used to adjust staffing"] },
    { name: "online order fulfillment", in: ["The customer's web order", "Items in warehouse inventory", "Shipping boxes and labels"], tr: ["Picking the items from shelves", "Packing the items", "Printing and attaching the shipping label"], out: ["The package delivered to the customer", "The tracking notification email"], fb: ["Late-delivery complaints leading to new carrier routes", "Returns of damaged items leading to better packaging"] },
    { name: "biweekly payroll", in: ["Employee timesheets", "Pay rates for each employee", "Current tax tables"], tr: ["Calculating gross pay", "Withholding taxes", "Transferring funds to bank accounts"], out: ["Direct deposits in employees' accounts", "Pay stubs"], fb: ["Employees reporting pay errors, leading to fixed calculation rules", "Auditor findings leading to an extra approval check"] },
    { name: "an aluminum recycling plant", in: ["Collected cans and scrap", "Electricity for the furnaces", "Sorting-line workers' labor"], tr: ["Sorting cans from other materials", "Shredding and melting the aluminum", "Casting the metal into ingots"], out: ["Recycled aluminum ingots", "Bales of separated plastic"], fb: ["A buyer rejecting a contaminated batch, so the sorting line is adjusted", "Contamination statistics used to redesign public recycling signs"] },
    { name: "a tax-preparation service", in: ["The client's W-2s and receipts", "The client's prior-year return", "The preparer's tax software"], tr: ["Entering the client's figures", "Calculating deductions and credits", "Reviewing the return for errors"], out: ["The filed tax return", "A copy of the return for the client"], fb: ["Error notices from the tax agency, leading to an updated review checklist", "Client survey answers leading to a simpler intake form"] },
    { name: "a campus print shop job", in: ["The student's uploaded PDF", "Paper and toner", "The student's payment"], tr: ["Checking the file's format and margins", "Printing the pages", "Binding the booklet"], out: ["The bound booklet ready for pickup", "The pickup notification text"], fb: ["Reprints caused by blurry images, prompting an on-screen preview step", "Pickup-time complaints prompting longer evening hours"] },
    { name: "course registration", in: ["The student's course selections", "The student's prerequisite record", "The list of open seats"], tr: ["Checking prerequisites", "Placing the student in open seats", "Building the weekly schedule"], out: ["The student's confirmed schedule", "Updated class rosters for instructors"], fb: ["Long waitlists prompting extra sections next term", "Advisor reports of prerequisite errors prompting a rule fix"] },
    { name: "hotel check-in", in: ["The arriving guest", "The guest's reservation and ID", "The list of clean rooms"], tr: ["Verifying the reservation", "Assigning a room", "Encoding the key card"], out: ["The guest settled in a room with a working key", "The guest's folio (bill record)"], fb: ["Online reviews about slow lines leading to mobile check-in", "Housekeeping delays tracked to adjust cleaning schedules"] },
    { name: "a food truck lunch order", in: ["The customer's order", "Tortillas, meat and vegetables", "Propane for the grill"], tr: ["Grilling the meat", "Assembling the tacos", "Wrapping the order"], out: ["Tacos handed to the customer"], fb: ["Items selling out by noon, so more is prepped the next day", "Comments that the salsa is too hot, so the recipe is adjusted"] },
  ];
  const itoItems = p => [].concat(p.in.map(t => ({ t, cat: "Input" })), p.tr.map(t => ({ t, cat: "Transformation" })), p.out.map(t => ({ t, cat: "Output" })), p.fb.map(t => ({ t, cat: "Feedback" })));
  const ITO_WHY = {
    Input: "it enters the process from outside and gets used or transformed",
    Transformation: "it is an activity that changes the inputs, the “black box” where value is added",
    Output: "it is the result that leaves the process for the customer or the next process",
    Feedback: "it is information about the output's results that flows back to change how the process is done",
  };
  const itoSol = p => S("Ask four questions: what comes in, what is done to it, what goes out, and what information comes back to improve the doing?",
    `For ${p.name}:${ul([`<b>Inputs</b>: ${p.in.join("; ")}`, `<b>Transformation</b>: ${p.tr.join("; ")}`, `<b>Outputs</b>: ${p.out.join("; ")}`, `<b>Feedback</b>: ${p.fb.join("; ")}`])}`);

  const CHAIN = [
    { q: "A furniture factory's finished bookshelves go to the company's shipping process. In the <b>shipping</b> process, the bookshelves are…", right: "An input", rightWhy: "The factory's output becomes the shipping process's input.",
      wrong: [{ t: "An output", why: "They are an output of manufacturing, but for shipping they arrive from outside: input." }, { t: "Feedback", why: "Feedback is information about results, not a product passed along." }, { t: "A transformation activity", why: "The bookshelves are a thing, not an activity." }] },
    { q: "The admissions process sends admitted students' data to the enrollment system. For the <b>enrollment</b> process, that data is…", right: "An input", rightWhy: "Admissions' output is enrollment's input: processes are linked.",
      wrong: [{ t: "An output", why: "It is admissions' output, but enrollment receives it, so for enrollment it is an input." }, { t: "Feedback to admissions", why: "Feedback would be information returning to improve admissions, such as how students perform." }, { t: "A non-value-adding step", why: "Data is not a step; and passing it on is useful." }] },
    { q: "A bakery's “bake bread” process produces loaves. The café next door buys the loaves to make sandwiches. For the <b>café's sandwich</b> process, the loaves are…", right: "An input (physical material)", rightWhy: "One organization's output is another's raw material.",
      wrong: [{ t: "An output (physical good)", why: "They are the bakery's output; the café uses them as an input." }, { t: "Feedback (information)", why: "Loaves are not information about results." }, { t: "An input (financial resource)", why: "Loaves are physical materials, not money." }] },
    { q: "A payroll process produces pay stubs and direct deposits. Which <b>other</b> process most likely uses payroll's records as an input?", right: "Year-end tax reporting (W-2 preparation)", rightWhy: "Payroll records are exactly what year-end tax forms are built from.",
      wrong: [{ t: "Ordering office supplies", why: "Supply ordering doesn't need individual pay records." }, { t: "Recruiting new employees", why: "Recruiting starts from job openings, not past paychecks." }, { t: "Hotel check-in", why: "Unrelated to payroll records." }] },
    { q: "A clinic's lab process produces test results. The physician then uses them to decide on treatment. The test results are…", right: "The lab's output and the treatment process's input", rightWhy: "Linked processes: an output of one is an input of the next.",
      wrong: [{ t: "Only an input to the lab", why: "The lab produced the results; they leave the lab." }, { t: "Feedback for the lab", why: "Feedback would be, e.g., physicians reporting mislabeled samples." }, { t: "Neither input nor output, because they are information", why: "Information can be both an input and an output." }] },
    { q: "A recycling plant produces aluminum ingots; a can manufacturer melts the ingots to make new cans. The ingots are a <em>transformed material</em> output of the plant and, for the can maker, …", right: "An input (physical material)", rightWhy: "The can maker's process starts with those ingots as raw material.",
      wrong: [{ t: "An output (service)", why: "Ingots are a physical good for the can maker to use, not a service it produces." }, { t: "Feedback", why: "Ingots are a material, not information about results." }, { t: "Energy/utility input", why: "The furnace's electricity is energy; the ingots are material." }] },
  ];
  const VA = [
    { t: "Replacing the cracked screen on a customer's phone", va: true, why: "Changes the product's form into what the customer wants." },
    { t: "Delivering the furniture from the warehouse to the buyer's home", va: true, why: "Changes location, which the customer pays for." },
    { t: "Turning a month of raw sales transactions into a regional sales report", va: true, why: "Changes the state of information into something usable." },
    { t: "Transferring the car title from the dealer to the buyer", va: true, why: "Changes ownership, part of what the buyer pays for." },
    { t: "Performing the band's two-hour concert", va: true, why: "Provides the experience the audience bought." },
    { t: "Steaming and pouring milk into the latte", va: true, why: "Changes form; the customer wants it." },
    { t: "Grading and returning an exam with comments", va: true, why: "Transforms information (answers into a grade and feedback) the student values." },
    { t: "Stitching the wound in the emergency room", va: true, why: "Directly changes the patient's condition (the service bought)." },
    { t: "The application waiting four days in an unwatched inbox", va: false, why: "Waiting adds nothing the customer would miss." },
    { t: "Re-typing the same customer data into a second system", va: false, why: "Duplicate data entry is waste; the customer gains nothing." },
    { t: "Redoing an oil change because the wrong filter was installed", va: false, why: "Rework to fix an error is non-value-adding." },
    { t: "A third manager signing off on a $40 purchase", va: false, why: "Excessive approvals consume time without adding value." },
    { t: "Parts sitting in a queue between two machines", va: false, why: "Waiting inventory is non-value-adding." },
    { t: "Walking paper forms between two offices", va: false, why: "Moving documents around internally adds no customer value." },
    { t: "Reprinting a booklet because the first copy had the wrong margins", va: false, why: "Rework caused by an error." },
    { t: "The patient waiting 50 minutes in the lobby before triage", va: false, why: "Waiting is the classic non-value-adding step." },
  ];
  const VALUE_CATS = ["Form", "Location", "State of information", "Ownership", "Access / experience"];
  const VALUE_DEF = { Form: "changes what the thing physically is", Location: "moves it to where the customer wants it", "State of information": "turns raw data into something more useful", Ownership: "transfers who owns it", "Access / experience": "gives the customer access to an experience or service" };
  const VALUE = [
    { t: "A carpenter turns oak boards into a dining table.", cat: "Form", why: "The material is physically reshaped into a new product." },
    { t: "A bakery turns flour, eggs and sugar into cupcakes.", cat: "Form", why: "Ingredients become a different product." },
    { t: "A tailor shortens a pair of pants.", cat: "Form", why: "The product's physical shape changes." },
    { t: "A print shop turns a PDF into a bound booklet.", cat: "Form", why: "A file becomes a physical product." },
    { t: "A courier carries a package from the depot to your apartment.", cat: "Location", why: "Same item, now where you need it." },
    { t: "A grocery chain trucks produce from farms to city stores.", cat: "Location", why: "Value comes from moving goods closer to buyers." },
    { t: "A food delivery driver brings the restaurant meal to a dorm.", cat: "Location", why: "The food is unchanged; it is now where the customer is." },
    { t: "A moving company relocates a family's furniture to their new house.", cat: "Location", why: "The service changes where the goods are." },
    { t: "An analyst turns thousands of raw web-click records into a weekly traffic dashboard.", cat: "State of information", why: "Raw data becomes useful information." },
    { t: "An accountant turns a year of receipts into a completed tax return.", cat: "State of information", why: "Scattered data is processed into a finished report." },
    { t: "A credit bureau turns payment histories into a credit score.", cat: "State of information", why: "Information is transformed into a decision-ready form." },
    { t: "A professor turns exam answers into grades and written comments.", cat: "State of information", why: "Answers become evaluated information." },
    { t: "A car dealership transfers the title of a new SUV to the buyer.", cat: "Ownership", why: "The car itself is unchanged; who owns it changes." },
    { t: "A real-estate closing makes the buyer the legal owner of the house.", cat: "Ownership", why: "Value lies in the transfer of ownership." },
    { t: "A bookstore sells a novel off the shelf to a shopper.", cat: "Ownership", why: "The retailer's good becomes the buyer's." },
    { t: "An online marketplace completes the sale of a used bike from one student to another.", cat: "Ownership", why: "Ownership of the bike changes hands." },
    { t: "A theme park lets ticket holders ride its roller coasters all day.", cat: "Access / experience", why: "The customer buys access to an experience." },
    { t: "A streaming service lets subscribers watch its film library.", cat: "Access / experience", why: "Value is access, not ownership of the films." },
    { t: "A symphony performs a concert for the audience.", cat: "Access / experience", why: "The product is the experience itself." },
    { t: "A gym lets members use its equipment and classes.", cat: "Access / experience", why: "Members pay for access, not to own the machines." },
  ];
  const INFORM_CATS = ["Physical materials", "Information", "People", "Financial resources", "Energy / utilities"];
  const INFORM_DEF = { "Physical materials": "raw materials, components or items to be worked on", Information: "data, forms, orders or records", People: "customers or patients who enter the process themselves", "Financial resources": "money: payments, budgets", "Energy / utilities": "power, water, bandwidth" };
  const INFORM = [
    { t: "A laptop dropped off for screen repair", cat: "Physical materials", why: "It is the physical item the process works on." },
    { t: "Steel sheets arriving at a car-body plant", cat: "Physical materials", why: "Raw material to be transformed." },
    { t: "Fresh vegetables delivered to a restaurant kitchen", cat: "Physical materials", why: "Physical ingredients." },
    { t: "Circuit boards delivered to a phone assembler", cat: "Physical materials", why: "Components to be assembled." },
    { t: "A submitted scholarship application form", cat: "Information", why: "A form is data entering the process." },
    { t: "A work order describing what the customer wants fixed", cat: "Information", why: "Instructions/data, not a physical material to transform." },
    { t: "A customer's shipping address and order details", cat: "Information", why: "Customer data is an information input." },
    { t: "A doctor's referral sent to a specialist's office", cat: "Information", why: "A record carrying information." },
    { t: "A patient arriving at urgent care", cat: "People", why: "In service processes, people themselves enter and are “transformed” (treated)." },
    { t: "Students arriving for a campus tour", cat: "People", why: "The people are what the process serves directly." },
    { t: "A guest walking up to the hotel front desk", cat: "People", why: "The customer personally enters the process." },
    { t: "Runners checking in at a 5K race", cat: "People", why: "Participants enter the process in person." },
    { t: "A customer's credit-card payment", cat: "Financial resources", why: "Money entering the process." },
    { t: "The department's annual training budget", cat: "Financial resources", why: "Funding is a financial input." },
    { t: "A grant awarded to fund a research project", cat: "Financial resources", why: "Money that enables the process." },
    { t: "A deposit paid to reserve a venue", cat: "Financial resources", why: "A payment input." },
    { t: "Electricity powering a data center's servers", cat: "Energy / utilities", why: "Power is an energy input." },
    { t: "Water used by a car wash", cat: "Energy / utilities", why: "A utility consumed by the process." },
    { t: "Internet bandwidth for a video-streaming service", cat: "Energy / utilities", why: "Bandwidth is a utility input." },
    { t: "Natural gas heating a bakery's ovens", cat: "Energy / utilities", why: "Fuel/energy input." },
  ];
  const valueSV = K.sortVariants({ key: "ch4-value", bank: VALUE, cats: VALUE_CATS, defs: VALUE_DEF, ask: "activity",
    hint: "Ask what is different for the customer after the step: the thing's shape, where it is, how useful the information is, who owns it, or what they get to experience." });
  const informSV = K.sortVariants({ key: "ch4-inform", bank: INFORM, cats: INFORM_CATS, defs: INFORM_DEF, ask: "input",
    hint: "Ask what kind of thing is entering: an object, data, a person, money, or power/water/bandwidth." });

  /* ============================================================
   * TOPIC 3 · Process maps and map types (+ Lucidchart)
   * ============================================================ */
  const MAPTYPES = ["Basic flowchart", "Swimlane diagram", "Value stream map", "BPMN diagram"];
  const MAPTYPE_DEF = { "Basic flowchart": "simple, mostly linear process; low complexity", "Swimlane diagram": "several roles or departments; shows who does what", "Value stream map": "finding waste in a manufacturing or service flow", "BPMN diagram": "formal, standardized documentation, ready for automation" };
  const MAPTYPE = [
    { t: "A one-page guide showing a new student worker the five steps for opening the campus coffee cart each morning.", cat: "Basic flowchart", why: "Simple, linear, one person: a basic flowchart is enough." },
    { t: "A poster showing how to reset your own password: go to page, enter email, click link, set new password.", cat: "Basic flowchart", why: "A short linear sequence for one person." },
    { t: "A quick sketch of the steps a volunteer follows to restock the food pantry shelves.", cat: "Basic flowchart", why: "Low complexity and a single role." },
    { t: "Steps for a lab assistant to start up and shut down the 3D printer.", cat: "Basic flowchart", why: "A simple linear procedure for one person." },
    { t: "Showing how a purchase request moves between the requester, their manager, purchasing and accounts payable.", cat: "Swimlane diagram", why: "Several roles: lanes make the handoffs visible." },
    { t: "Clarifying who does what when a new employee is onboarded by HR, IT and the hiring manager.", cat: "Swimlane diagram", why: "Multiple departments with handoffs: swimlanes." },
    { t: "Showing how a customer complaint passes from the call center to the store manager to the regional office.", cat: "Swimlane diagram", why: "Responsibility shifts between roles." },
    { t: "Showing the student, advisor and registrar's roles in a major-change request.", cat: "Swimlane diagram", why: "Three roles, medium complexity." },
    { t: "Measuring how much of a bicycle's 10-day production time is waiting between stations.", cat: "Value stream map", why: "Hunting waste (waiting) across a production flow." },
    { t: "Finding which steps in a hospital's lab-test flow add value and which are just delay.", cat: "Value stream map", why: "Value stream maps separate value-adding time from waste." },
    { t: "Identifying inventory piling up between the cutting and sewing stages of a clothing factory.", cat: "Value stream map", why: "Spotting waste in a manufacturing flow." },
    { t: "Quantifying wait time versus work time across a loan-approval pipeline to cut waste.", cat: "Value stream map", why: "Waste identification in a service flow." },
    { t: "Creating a standardized diagram that developers will use to automate the insurance-claim workflow in software.", cat: "BPMN diagram", why: "Formal notation suited to automation." },
    { t: "Documenting the official procurement process for an audit, using the industry-standard notation.", cat: "BPMN diagram", why: "Formal, standardized documentation." },
    { t: "Giving business analysts and programmers one shared, standard picture of the order-to-cash process, including messages to suppliers.", cat: "BPMN diagram", why: "A standard notation both business and technical people read, with message flows." },
    { t: "Specifying events, gateways and message flows precisely so a workflow engine can run the process.", cat: "BPMN diagram", why: "That precision is what BPMN is for." },
  ];
  const PURPOSES = ["Communication", "Training", "Analysis", "Improvement"];
  const PURPOSE_DEF = { Communication: "everyone shares one picture of how the work flows", Training: "teaching people their part of the process", Analysis: "finding bottlenecks, redundancies and gaps", Improvement: "designing a better version from a visible baseline" };
  const PURPOSE = [
    { t: "Two departments that kept blaming each other finally agree on how orders actually move between them.", cat: "Communication", why: "The map created a shared understanding." },
    { t: "The map is posted in the team channel so everyone describes the process the same way.", cat: "Communication", why: "A common picture for everyone." },
    { t: "A manager uses the diagram to explain the process to a new business partner.", cat: "Communication", why: "Sharing understanding with someone else." },
    { t: "The diagram helps the IT team and the business team talk about the same steps.", cat: "Communication", why: "A shared language across groups." },
    { t: "New hires study the map in their first week to learn where their tasks fit.", cat: "Training", why: "Teaching people their role." },
    { t: "Seasonal workers get a laminated copy of the checkout flow during orientation.", cat: "Training", why: "Used to train new workers." },
    { t: "A substitute teacher follows the attendance-process map to do the job correctly.", cat: "Training", why: "The map teaches how to perform the steps." },
    { t: "Interns use the swimlane diagram to learn which requests go to which office.", cat: "Training", why: "Learning the process from the map." },
    { t: "Looking at the map, the team notices the same data is entered in two places.", cat: "Analysis", why: "The map exposed a redundancy." },
    { t: "The map reveals that files wait five days in an unmonitored inbox.", cat: "Analysis", why: "Finding a bottleneck." },
    { t: "Nobody is shown as responsible for the step between sales and billing.", cat: "Analysis", why: "The map exposed a gap." },
    { t: "The diagram shows four sign-offs on every small purchase.", cat: "Analysis", why: "Spotting excessive steps." },
    { t: "Using the current map as a baseline, the team designs a version with two parallel approvals.", cat: "Improvement", why: "Redesigning from what the map made visible." },
    { t: "The team sketches a To-Be map that removes the duplicate data-entry step.", cat: "Improvement", why: "Designing a better process." },
    { t: "After mapping, the office moves the eligibility check to the start so ineligible requests stop early.", cat: "Improvement", why: "A redesign enabled by the map." },
    { t: "The group compares the old and new maps to plan the rollout of a faster process.", cat: "Improvement", why: "Using maps to improve." },
  ];
  const maptypeSV = K.sortVariants({ key: "ch4-maptype", bank: MAPTYPE, cats: MAPTYPES, defs: MAPTYPE_DEF, ask: "situation",
    hint: "Ask two things: how many roles are involved, and what the map is for (a quick guide, showing handoffs, hunting waste, or formal documentation/automation)." });
  const purposeSV = K.sortVariants({ key: "ch4-purpose", bank: PURPOSE, cats: PURPOSES, defs: PURPOSE_DEF, ask: "use of a map",
    hint: "Ask what the map is being used to do: share a picture, teach someone, diagnose problems, or design something better." });
  const LUCID = ["Sign in to Lucid with your IU Microsoft account", "Choose New → Lucidchart → Blank Document", "Close the templates window and the Lucid AI window",
    "Search the Shapes panel for “BPMN 2.0” and pin that library", "Drag the shapes you need onto the canvas", "Double-click each shape to type its label",
    "Connect shapes by dragging from one shape's connection point to the next"];
  const LUCID_Q = [
    { q: "In Lucidchart, how do you get the BPMN shapes into your Shapes panel?", right: "Search the Shapes panel for “BPMN 2.0” and pin that library", rightWhy: "Searching with the magnifying glass and pinning keeps the BPMN 2.0 shapes available.",
      wrong: [{ t: "Pick the “BPMN” template from the templates pop-up", why: "The steps say to close the templates window and start from a blank document." }, { t: "Ask Lucid AI to draw the diagram", why: "The steps close the Lucid AI window; you build the diagram yourself." }, { t: "Draw circles and diamonds with the freehand pen", why: "Use the standard BPMN 2.0 shapes so the notation is correct." }],
      sol: ["The shape library has to be found and kept handy.", "Use the magnifying-glass search for “BPMN 2.0” and pin it."] },
    { q: "In Lucidchart, how do you change the text on a task shape from “Task” to “Scan ID and barcode”?", right: "Double-click the shape and type the new label", rightWhy: "Double-clicking a shape opens its text for editing.",
      wrong: [{ t: "Delete the shape and add a text box on top", why: "Unnecessary: shapes have their own editable label, and a loose text box won't move with the shape." }, { t: "Right-click and drag the shape", why: "Right-click-drag pans the canvas." }, { t: "Ctrl + scroll over the shape", why: "Ctrl + scroll zooms." }],
      sol: ["How do you edit text inside most drawing-tool shapes?", "Double-click it."] },
    { q: "Why connect shapes in Lucidchart by dragging from one shape's connection point to the other, rather than drawing a loose line?", right: "Connected lines stay attached and follow the shapes when you move them", rightWhy: "Attached connectors keep the flow intact as the layout changes.",
      wrong: [{ t: "Loose lines are not allowed in BPMN", why: "The issue is practical: loose lines don't follow the shapes when you rearrange." }, { t: "Connected lines turn into message flows automatically", why: "A connector is a sequence flow unless you choose a dashed message-flow style." }, { t: "It makes the line dashed", why: "Line style is separate from attachment." }],
      sol: ["Think about what happens when you rearrange the diagram later.", "Attached connectors move with the shapes."] },
    { q: "Your Lucidchart canvas is too small to read. How do you zoom and move around?", right: "Ctrl + scroll to zoom; right-click and drag to pan", rightWhy: "Those are the navigation shortcuts in the course steps.",
      wrong: [{ t: "Double-click to zoom; left-click and drag to pan", why: "Double-click edits a label, and left-click-drag moves or selects shapes." }, { t: "Use the Lucid AI window", why: "Lucid AI is closed in the setup steps and is not a navigation tool." }, { t: "Re-open the template window", why: "Templates have nothing to do with zooming." }],
      sol: ["Navigation uses the mouse wheel and a mouse button.", "Ctrl + scroll zooms; right-click-drag pans."] },
  ];
  const MAP_CONCEPT = [
    { q: "A financial aid office's scholarship decisions are three weeks late. Mapping the process shows applications sitting about five days in a shared inbox nobody is assigned to monitor. What is the best first fix?", right: "Assign a specific person to monitor the inbox", rightWhy: "The map showed an ownership gap causing waiting; giving someone ownership removes most of the delay cheaply.",
      wrong: [{ t: "Buy a new financial aid software system", why: "Expensive and doesn't address the real cause: nobody owns the inbox." }, { t: "Hire more scholarship committee members", why: "The delay was in the inbox, not the committee's review." }, { t: "Ask students to apply earlier", why: "That shifts the burden to students without fixing the waiting step." }],
      sol: ["What did the map actually reveal: a slow worker, or work sitting untouched?", "Unowned waiting is fixed by giving the step an owner."] },
    { q: "Why do analysts say “you cannot improve what you cannot see”?", right: "A process map makes the steps, handoffs and waits visible, so problems can be spotted and changes designed", rightWhy: "Visibility is the precondition for analysis and improvement.",
      wrong: [{ t: "Because processes must be filmed before they are changed", why: "The “seeing” is a map or model, not video." }, { t: "Because only visible employees can be held accountable", why: "It's about seeing the process, not watching staff." }, { t: "Because a map automatically improves the process", why: "The map reveals problems; people still have to redesign." }],
      sol: ["What does a map make possible that a verbal description does not?", "It exposes bottlenecks, redundancy and gaps."] },
    { q: "What makes a BPMN diagram more expressive than a basic flowchart?", right: "It shows who is responsible (lanes), start and end events, decisions (gateways) and communication between organizations, in a standard notation", rightWhy: "Those standardized elements go beyond boxes and arrows.",
      wrong: [{ t: "It uses colors", why: "Color is decoration; it's not what makes BPMN expressive." }, { t: "It can only show linear processes", why: "BPMN handles branches, parallel work and multiple participants." }, { t: "It is drawn by software, not by hand", why: "Either can be drawn in software; the notation is the difference." }],
      sol: ["Compare what each kind of diagram can show.", "BPMN adds roles, event types, gateways and message flows in a standard everyone reads."] },
    { q: "A team's process involves only one person and four steps in a fixed order. Which map is the sensible choice?", right: "A basic flowchart", rightWhy: "Low complexity, one role: anything more formal adds effort without insight.",
      wrong: [{ t: "A BPMN diagram with three pools", why: "Pools represent separate organizations; there is only one person here." }, { t: "A value stream map", why: "Overkill unless the goal is to measure waste across a flow." }, { t: "A swimlane diagram", why: "Lanes are for multiple roles; there is only one." }],
      sol: ["Match the map's complexity to the process's.", "One role, linear steps → basic flowchart."] },
  ];
  const MAP_TF = [
    { s: "A swimlane diagram is especially useful when a process involves several roles or departments.", truth: true, why: "Lanes show who does what and where work changes hands.", hint: "What do lanes represent?" },
    { s: "Value stream maps are mainly used to train new employees.", truth: false, why: "Value stream maps are for identifying waste in a production or service flow.", hint: "Recall the four map types and their uses." },
    { s: "Process maps can reveal bottlenecks, redundancies and gaps.", truth: true, why: "That is the analysis purpose of mapping.", hint: "Recall the four purposes of a map." },
    { s: "A basic flowchart is the best choice for formal documentation intended for automation.", truth: false, why: "That is the job of a BPMN diagram; basic flowcharts suit simple linear processes.", hint: "Which map type is formal and standardized?" },
    { s: "In the Lucidchart steps, you start from a blank document rather than a template.", truth: true, why: "New → Lucidchart → Blank Document, then close the templates window.", hint: "Recall the setup steps." },
    { s: "A process map is only useful once the process has already been improved.", truth: false, why: "Maps of the current process are what make improvement possible in the first place.", hint: "Can you improve what you can't see?" },
  ];

  /* ============================================================
   * TOPIC 4 · BPMN symbols
   * ============================================================ */
  const SYM = [
    { k: "start", name: "Start event", pic: "start", desc: "where the process begins (thin circle)" },
    { k: "end", name: "End event", pic: "end", desc: "where a path finishes (thick circle)" },
    { k: "inter", name: "Intermediate event", pic: "inter", desc: "something that happens mid-process, like a timer or message (double circle)" },
    { k: "task", name: "Task / activity", pic: "task", desc: "a unit of work (rounded rectangle)" },
    { k: "xor", name: "Exclusive gateway", pic: "xor", desc: "a decision where exactly one path is taken (diamond with X)" },
    { k: "and", name: "Parallel gateway", pic: "and", desc: "all paths run at the same time (diamond with +)" },
    { k: "seq", name: "Sequence flow", pic: "seq", desc: "the order of steps within a pool (solid arrow)" },
    { k: "msg", name: "Message flow", pic: "msg", desc: "communication between pools (dashed arrow)" },
    { k: "pool", name: "Pool", pic: "pool", desc: "a whole participant or organization (outer rectangle)" },
    { k: "lane", name: "Lane", pic: "lane", desc: "a role or department inside a pool (band inside the pool)" },
  ];
  /* shapes that are easy to confuse with each one (for distractors) */
  const LOOKALIKE = { start: ["end", "inter"], end: ["start", "inter"], inter: ["start", "end"], task: ["pool", "lane"], xor: ["and", "inter"], and: ["xor", "task"], seq: ["msg", "lane"], msg: ["seq", "inter"], pool: ["lane", "task"], lane: ["pool", "task"] };
  const symBy = k => SYM.find(s => s.k === k);
  const GW_SCEN = [
    { t: "After a loan application is scored, it is either approved or rejected.", right: "Exclusive gateway (X)", why: "Each application takes exactly one of the two outcomes." },
    { t: "Once an order is confirmed, the warehouse packs it while billing sends the invoice at the same time.", right: "Parallel gateway (+)", why: "Both branches happen for every order, simultaneously." },
    { t: "A help-desk ticket is routed to the hardware team <em>or</em> the software team, depending on its category.", right: "Exclusive gateway (X)", why: "One route per ticket." },
    { t: "When a new employee is hired, IT sets up the laptop, HR enrolls benefits and facilities makes a badge, all at once.", right: "Parallel gateway (+)", why: "All three branches run for every new hire." },
    { t: "If the book is available, the student goes to the shelf; if not, the student places a hold.", right: "Exclusive gateway (X)", why: "Available/not available: exactly one path." },
    { t: "For each wedding booking, the caterer orders food and the florist orders flowers in parallel.", right: "Parallel gateway (+)", why: "Both always happen together." },
    { t: "An expense report under $500 goes straight to payment; above $500 it goes to an audit first.", right: "Exclusive gateway (X)", why: "The amount decides one path." },
    { t: "Before a flight departs, fueling and baggage loading both start as soon as the plane parks.", right: "Parallel gateway (+)", why: "Independent activities run simultaneously." },
  ];
  const FLOW_SCEN = [
    { t: "The online store (one pool) sends a payment request to the bank (another pool).", right: "Message flow (dashed arrow)", why: "Communication between two different organizations/pools." },
    { t: "Inside the café pool, the cashier's “Take payment” task is followed by the barista's “Prepare drink” task.", right: "Sequence flow (solid arrow)", why: "Order of steps within one pool, even across lanes." },
    { t: "A hospital sends lab results to a patient's insurance company.", right: "Message flow (dashed arrow)", why: "Two separate organizations exchange information." },
    { t: "In the library pool, “Scan ID” leads to the “Fines owed?” gateway.", right: "Sequence flow (solid arrow)", why: "Ordering steps within one pool." },
    { t: "A supplier (its own pool) sends a shipping notice to the retailer (its own pool).", right: "Message flow (dashed arrow)", why: "Communication across pools." },
    { t: "Within the IT Services pool, the help desk hands a ticket to the specialist lane.", right: "Sequence flow (solid arrow)", why: "A handoff between lanes of one pool is still sequence flow." },
  ];
  const POOLLANE = [
    { t: "Online Retailer (the company whose process is being mapped)", cat: "Pool", why: "A whole organization/participant is a pool." },
    { t: "Customer, inside the Online Retailer diagram", cat: "Lane", why: "A role within the pool's process." },
    { t: "Warehouse department", cat: "Lane", why: "A department within the organization is a lane." },
    { t: "Billing department", cat: "Lane", why: "A department inside the pool." },
    { t: "A separate shipping carrier company that exchanges messages with the retailer", cat: "Pool", why: "A different organization gets its own pool." },
    { t: "Campus Library (the organization running the borrowing process)", cat: "Pool", why: "The participant as a whole." },
    { t: "Librarian role at the circulation desk", cat: "Lane", why: "A role inside the library's pool." },
    { t: "Student role in the borrowing process", cat: "Lane", why: "A role band within the pool." },
    { t: "The patient's insurance company, which receives claims from the hospital", cat: "Pool", why: "An external organization: its own pool." },
    { t: "Nurse role within the hospital's process", cat: "Lane", why: "A role in the hospital pool." },
    { t: "Sparky's Auto Care, the shop whose repair process is drawn", cat: "Pool", why: "The organization is the pool." },
    { t: "Technician role at the auto shop", cat: "Lane", why: "A role band inside the shop's pool." },
  ];
  const SYM_ERR = [
    { q: "A student's diagram begins with a <b>thick</b>-bordered circle labeled “Order received.” What is wrong?", right: "A thick circle is an end event; the process should begin with a thin-bordered start event", rightWhy: "Line weight matters: thin = start, thick = end.",
      wrong: [{ t: "Nothing; any circle can start a process", why: "BPMN distinguishes event types by border: thin start, thick end, double intermediate." }, { t: "Processes must start with a task, not an event", why: "BPMN processes begin with a start event." }, { t: "The label should be a question", why: "Questions label gateways, not events." }],
      sol: ["Compare the border weights of the three event circles.", "Thin = start, thick = end, double = intermediate."] },
    { q: "A diagram uses a <b>dashed</b> arrow between the Cashier lane and the Barista lane of the same café pool. What is wrong?", right: "Flow between lanes of one pool should be a solid sequence flow; dashed message flows connect different pools", rightWhy: "Dashed = between organizations; within a pool, even across lanes, use solid arrows.",
      wrong: [{ t: "Nothing; crossing a lane always needs a dashed arrow", why: "Crossing lanes is a handoff, still drawn with a solid sequence flow." }, { t: "Arrows may not cross lanes at all", why: "Arrows crossing lanes are normal: they show handoffs." }, { t: "It should be a parallel gateway", why: "A gateway is a decision/split point, not a connector." }],
      sol: ["Which arrow type is for communication between organizations?", "Dashed = between pools; solid = within a pool."] },
    { q: "At “Payment approved?”, a diagram uses a diamond with a <b>+</b> and two outgoing arrows labeled Yes and No. What is wrong?", right: "Yes/No is an either/or decision, so it needs an exclusive (X) gateway; + would mean both branches run", rightWhy: "Parallel gateways run all branches; a payment can't be approved and declined at once.",
      wrong: [{ t: "Nothing; + and X mean the same thing", why: "X = exactly one path; + = all paths at once." }, { t: "Decisions should be drawn as rounded rectangles", why: "Rounded rectangles are tasks; decisions are diamonds." }, { t: "A gateway may have only one outgoing arrow", why: "A splitting gateway has two or more outgoing flows." }],
      sol: ["Can both branches happen for the same payment?", "Either/or → exclusive gateway (X)."] },
    { q: "In a hiring diagram, the task “Approve offer” (done by the HR director) is drawn in the <b>Candidate</b> lane. What is wrong?", right: "Tasks belong in the lane of the role that performs them, so it should be in the HR director's lane", rightWhy: "Lane placement is how BPMN shows responsibility.",
      wrong: [{ t: "Nothing; lanes are just for decoration", why: "Lanes show who is responsible; misplacing a task misstates ownership." }, { t: "Approvals must always be gateways, never tasks", why: "Reviewing/approving is work (a task); the decision on its outcome can follow as a gateway." }, { t: "Candidates should be drawn as a separate pool, so the task is fine", why: "Whatever the candidate's representation, the task still belongs to the HR director." }],
      sol: ["What does a lane tell the reader?", "Put each task in the lane of whoever does it."] },
    { q: "A diagram shows the main path ending, but the “Rejected” branch just stops at a task with no symbol after it. What is missing?", right: "An end event (thick circle) after the last task on the Rejected branch", rightWhy: "Every path should finish at an end event so readers know the outcome.",
      wrong: [{ t: "A start event at the end of the branch", why: "Start events begin a process; outcomes are end events." }, { t: "A parallel gateway", why: "Nothing runs in parallel here; the branch needs an ending." }, { t: "Nothing; branches may stop anywhere", why: "Unterminated paths leave the outcome unclear." }],
      sol: ["How does a reader know where each path finishes?", "Each path ends at an end event."] },
  ];
  const SYM_TF = [
    { s: "BPMN is maintained by the Object Management Group (OMG).", truth: true, why: "OMG develops and maintains the BPMN standard.", hint: "Who maintains the standard?" },
    { s: "A double-bordered circle is the BPMN symbol for an end event.", truth: false, why: "Double circle = intermediate event; the end event has one thick border.", hint: "Thin, thick, double: which is which?" },
    { s: "A rounded rectangle in BPMN represents a task or activity.", truth: true, why: "Tasks (units of work) are rounded rectangles.", hint: "Which shape is work?" },
    { s: "A diamond with a + means exactly one of the outgoing paths will be taken.", truth: false, why: "That is the exclusive (X) gateway; + runs all paths in parallel.", hint: "X vs +." },
    { s: "A dashed arrow shows communication between two different pools.", truth: true, why: "Message flows (dashed) connect pools; sequence flows (solid) stay inside a pool.", hint: "Solid vs dashed." },
    { s: "A lane represents an entire organization, while a pool represents a role within it.", truth: false, why: "Reversed: pool = organization/participant, lane = role or department inside it.", hint: "Which one is the outer rectangle?" },
    { s: "An arrow that crosses from one lane into another shows a handoff of work.", truth: true, why: "Responsibility passes to a different role.", hint: "What does crossing a lane line mean?" },
    { s: "BPMN is meant to be read only by programmers.", truth: false, why: "It was designed as a common language for business and technical stakeholders.", hint: "Who is the notation for?" },
  ];

  /* ============================================================
   * TOPIC 6 · ITO ↔ BPMN, bottlenecks, metrics, controls
   * ============================================================ */
  const IB_CATS = ["Start event", "Task", "Gateway", "End event", "Intermediate event / loop"];
  const IB_DEF = { "Start event": "the input or trigger that starts the process", Task: "a transformation step (work)", Gateway: "a decision made during the transformation", "End event": "the output or result the process produces", "Intermediate event / loop": "feedback: something mid-process or a return to an earlier step" };
  const IB = [
    { t: "A customer's online order arrives and kicks off fulfillment.", cat: "Start event", why: "The incoming input/trigger is drawn as the start event." },
    { t: "A patient walks into urgent care.", cat: "Start event", why: "The arriving input triggers the process." },
    { t: "A scholarship application is submitted through the portal.", cat: "Start event", why: "The input that starts the process." },
    { t: "A help-desk ticket is received.", cat: "Start event", why: "The trigger input." },
    { t: "Grinding the coffee beans", cat: "Task", why: "A transformation activity becomes a task." },
    { t: "Verifying the applicant's transcript", cat: "Task", why: "Work done during the transformation: a task." },
    { t: "Packing items into the shipping box", cat: "Task", why: "A transformation step: task." },
    { t: "Scanning the student's ID and the book's barcode", cat: "Task", why: "A unit of work: task." },
    { t: "Is the payment valid?", cat: "Gateway", why: "A decision during the transformation becomes a gateway." },
    { t: "Does the student owe fines?", cat: "Gateway", why: "A yes/no decision: exclusive gateway." },
    { t: "Is the estimate approved by the customer?", cat: "Gateway", why: "A branching decision: gateway." },
    { t: "Is the application complete?", cat: "Gateway", why: "Decision point: gateway." },
    { t: "The package is delivered and the order is closed.", cat: "End event", why: "The output/result is the end event." },
    { t: "The student leaves with the book checked out.", cat: "End event", why: "The result of the process." },
    { t: "The repaired car is picked up by its owner.", cat: "End event", why: "Final output: end event." },
    { t: "The admit letter is sent.", cat: "End event", why: "The output that ends that path." },
    { t: "A quality check fails, so the item returns to the packing step.", cat: "Intermediate event / loop", why: "Feedback shown as a loop back to an earlier task." },
    { t: "A 48-hour timer expires, so a reminder is sent to the approver.", cat: "Intermediate event / loop", why: "Something that happens mid-process: intermediate event." },
    { t: "A customer complaint message arrives mid-process and the order is re-checked.", cat: "Intermediate event / loop", why: "An incoming message mid-process, used as feedback." },
    { t: "Reviewer comments send the report back to the author for revision.", cat: "Intermediate event / loop", why: "Feedback as a loop to an earlier task." },
  ];
  const ibSV = K.sortVariants({ key: "ch4-ib", bank: IB, cats: IB_CATS, defs: IB_DEF, ask: "process element",
    hint: "Translate ITO into BPMN: input/trigger → start event, transformation → task, decision → gateway, output → end event, feedback → intermediate event or loop." });

  const TIMES = [
    { name: "a credit-union loan application", unit: "hours", steps: ["Receive application", "Verify income", "Run credit check", "Underwriter review", "Send decision"] },
    { name: "a Sparky's Auto Care brake job", unit: "minutes", steps: ["Check in the car", "Inspect brakes", "Customer approves estimate", "Replace pads", "Collect payment"] },
    { name: "a scholarship application", unit: "days", steps: ["Submit online form", "Completeness check", "Committee scoring", "Award approval", "Notify student"] },
    { name: "an IT help-desk ticket", unit: "hours", steps: ["Log the ticket", "Triage", "Specialist diagnosis", "Install fix", "Confirm with employee"] },
    { name: "an urgent-care visit", unit: "minutes", steps: ["Check in at desk", "Triage by nurse", "Exam by physician", "Treatment", "Discharge paperwork"] },
    { name: "a print-shop booklet order", unit: "hours", steps: ["Upload file", "File check", "Printing", "Binding", "Pickup notice"] },
  ];
  /* a random step table with one clear queue (bottleneck) and a different longest-work step */
  function timeTable() {
    const p = U.rotate("ch4-times", TIMES);
    const n = p.steps.length;
    const b = U.randInt(1, n - 1);
    let w;
    do { w = U.randInt(0, n - 1); } while (w === b);
    const waits = p.steps.map(() => U.randInt(0, 4));
    waits[0] = 0;
    waits[b] = Math.max(...waits) + U.randInt(5, 12);
    const work = p.steps.map(() => U.randInt(1, 5));
    work[b] = U.randInt(1, 3);
    work[w] = Math.max(...work) + U.randInt(3, 8);
    if (waits[w] >= waits[b]) waits[w] = 0;
    const rows = p.steps.map((s, i) => [s, String(waits[i]), String(work[i])]);
    const html = `<p>Here are average times for ${p.name} (in ${p.unit}).</p>` + tbl(["Step", `Wait before step (${p.unit})`, `Work time (${p.unit})`], rows);
    return { p, b, w, waits, work, html, sumWait: waits.reduce((a, x) => a + x, 0), sumWork: work.reduce((a, x) => a + x, 0) };
  }
  const METRIC = [
    { q: "The online store wants to know whether its new payment provider is faster. Which metric fits best?", right: "Average payment-validation time", rightWhy: "It directly measures the speed of the step that changed.",
      wrong: [{ t: "Number of products in the catalog", why: "Catalog size says nothing about payment speed." }, { t: "Number of warehouse employees", why: "A resource count, not a measure of the payment step." }, { t: "Total revenue for the year", why: "Driven by many factors; it doesn't isolate validation speed." }] },
    { q: "Too many checkout attempts are failing. Which metric tracks that problem?", right: "Percentage of payments that fail validation", rightWhy: "A failure-rate metric on the failure point.",
      wrong: [{ t: "Average order value", why: "Measures size of orders, not failures." }, { t: "Website visitor count", why: "Traffic, not the payment step's reliability." }, { t: "Number of gateways in the diagram", why: "A property of the map, not of performance." }] },
    { q: "The library wants to know if self-checkout kiosks shortened lines. Which metric fits best?", right: "Average minutes from joining the checkout line to leaving with the book", rightWhy: "Measures exactly the waiting the kiosks were meant to reduce.",
      wrong: [{ t: "Number of books in the collection", why: "Collection size isn't affected by kiosks." }, { t: "Number of library staff", why: "Staffing level isn't a measure of line length." }, { t: "Number of catalog searches", why: "Searching happens before the checkout line." }] },
    { q: "The scholarship office wants to show its redesign reduced delays. Which metric fits best?", right: "Average days from application submission to decision", rightWhy: "Cycle time is the direct measure of delay.",
      wrong: [{ t: "Number of scholarships offered", why: "Count of awards, not speed." }, { t: "Size of the committee", why: "A resource, not a performance result." }, { t: "Number of fields on the form", why: "A design feature, not an outcome." }] },
    { q: "An auto shop suspects many repairs are done wrong the first time. Which metric fits best?", right: "Percentage of cars returning within 30 days for the same problem", rightWhy: "A rework/quality metric for the repair step.",
      wrong: [{ t: "Number of service bays", why: "Capacity, not quality." }, { t: "Average price of an oil change", why: "Price says nothing about first-time quality." }, { t: "Number of customers who booked online", why: "Booking channel, not repair quality." }] },
    { q: "A help desk wants to know how often problems are fixed without escalation. Which metric fits best?", right: "First-contact resolution rate (percentage of tickets solved by the help desk)", rightWhy: "Measures how often the exit at the first decision is taken.",
      wrong: [{ t: "Number of laptops owned by the company", why: "Not a measure of the help-desk process." }, { t: "Number of specialists employed", why: "A resource level, not an outcome." }, { t: "Length of the ticket form", why: "A form property, not performance." }] },
  ];
  const CONTROL = [
    { t: "The librarian scans the student ID before the book can be checked out", ok: true, why: "Confirms eligibility and records who has the book." },
    { t: "The online form refuses to submit until every required field is filled", ok: true, why: "Validation rule: catches incomplete input at the source." },
    { t: "Purchases over $5,000 need a second manager's approval", ok: true, why: "An approval control that prevents misuse." },
    { t: "The system checks that the card number passes validation before confirming the order", ok: true, why: "A check that stops bad payments early." },
    { t: "A pharmacist double-checks the dose before medication is handed over", ok: true, why: "A verification that catches errors before harm." },
    { t: "The cashier counts the drawer against the register total at shift end", ok: true, why: "Reconciliation detects errors or theft." },
    { t: "The barista steams the milk", ok: false, why: "A transformation task; it doesn't check anything." },
    { t: "The warehouse packs the items into a box", ok: false, why: "Work, not a check." },
    { t: "The student walks to the shelf to find the book", ok: false, why: "A movement task with no verification." },
    { t: "The customer chooses a shipping speed", ok: false, why: "A customer choice, not a control." },
    { t: "The technician replaces the brake pads", ok: false, why: "A transformation task." },
    { t: "The system emails a shipping confirmation", ok: false, why: "A notification, not a check that prevents errors." },
  ];
  const LIB_AUTO = [
    { q: "In the library borrowing process, which task is the best candidate for a self-checkout kiosk?", right: "The librarian scanning the student ID and the book's barcode", rightWhy: "It is rules-based and repetitive, exactly what a kiosk can do.",
      wrong: [{ t: "The student finding the book on the shelf", why: "A physical search a kiosk can't do." }, { t: "The student deciding whether to place a hold", why: "A personal choice, not a repetitive staff task." }, { t: "Searching the catalog", why: "Already self-service through the online catalog; it isn't a librarian task to replace." }],
      sol: ["Look for a human task that follows fixed rules every time.", "Scanning ID and barcode is rule-based and repetitive."] },
    { q: "In the library diagram, which path do most students probably follow?", right: "Book available, no fines → checked out", rightWhy: "Most students don't owe fines and usually find the book available; it is also the shortest successful path.",
      wrong: [{ t: "Book unavailable → place a hold", why: "Possible, but it's the exception, not the usual case." }, { t: "Book available, fines owed → pay fine → checked out", why: "Only students with fines take this path." }, { t: "All paths are equally common", why: "Paths differ in how often they occur; the diagram shows possibilities, not frequencies." }],
      sol: ["Think about which answers at each gateway are typical.", "Usually: available and no fines."] },
    { q: "In the library process, which path is likely the most time-consuming?", right: "Book available, fines owed → pay fine → checked out", rightWhy: "It contains every main step plus the extra fine-payment task.",
      wrong: [{ t: "Book unavailable → leave", why: "This path ends early, after only a search." }, { t: "Book available, no fines → checked out", why: "Same steps as the fines path minus paying, so shorter." }, { t: "Book unavailable → place a hold", why: "Ends after placing the hold; fewer steps than a checkout with fines." }],
      sol: ["Which route contains the most tasks?", "The one with the extra “pay fine” task."] },
    { q: "In the library process, which step is a <b>control point</b>?", right: "Scanning the student ID and the book's barcode", rightWhy: "It verifies that the borrower is eligible and records who has which book.",
      wrong: [{ t: "Walking to the shelf", why: "Movement, not a check." }, { t: "Searching the catalog", why: "Finding information, not verifying anything." }, { t: "Leaving the library", why: "An end, not a check." }],
      sol: ["A control point checks something before the process continues.", "The ID/barcode scan verifies eligibility."] },
    { q: "Where is the most likely <b>bottleneck</b> in the library borrowing process during the first week of term?", right: "The line at the circulation desk, where one librarian scans every book", rightWhy: "Work piles up at the single desk; that is where students wait.",
      wrong: [{ t: "Searching the online catalog", why: "Many students can search at once; no queue forms." }, { t: "Walking to the shelf", why: "Students do this in parallel; nothing piles up." }, { t: "The end event", why: "End events take no time." }],
      sol: ["A bottleneck is where work waits in a queue.", "One desk serving everyone → line at the desk."] },
  ];
  /* narrative library variants for counting paths without a picture */
  function libNarrative() {
    const reserve = coin(), expired = coin(), fines = coin() || (!reserve && !expired), parallel = coin();
    const lines = ["The student searches the catalog.", "<b>If the book is not available</b>, the student leaves and the process ends."];
    if (reserve) lines.push("<b>If the book is a reference-only item</b>, the student reads it in the library and the process ends.");
    lines.push("Otherwise the student finds the book, takes it to the desk, and the librarian scans the ID and barcode.");
    if (expired) lines.push("<b>If the student's ID has expired</b>, the librarian renews it, and checkout continues.");
    if (fines) lines.push("<b>If the student owes fines</b>, the student pays them, and checkout continues.");
    if (parallel) lines.push("Then, <b>at the same time</b>, the librarian stamps the due date and the system emails a receipt.");
    lines.push("The librarian checks out the book and the process ends.");
    const exits = 1 + (reserve ? 1 : 0), rejoin = (expired ? 1 : 0) + (fines ? 1 : 0);
    const answer = exits + Math.pow(2, rejoin);
    const decisions = exits + rejoin;
    return { lines, answer, decisions, exits, rejoin, parallel };
  }

  /* ============================================================
   * TOPIC 7 · As-Is vs To-Be, documentation, To-Be goals, gaps
   * ============================================================ */
  const ASTO = [
    { t: "Staff currently re-type every web order into the inventory spreadsheet.", cat: "As-Is", why: "Describes what happens today, workaround included." },
    { t: "Right now, receipts are photocopied and stapled to a paper form before anyone reviews them.", cat: "As-Is", why: "Current, observed practice." },
    { t: "Today the advisor emails the registrar, who manually updates the student's major.", cat: "As-Is", why: "The current process." },
    { t: "Currently three managers sign each request one after another.", cat: "As-Is", why: "Documents the present state." },
    { t: "At the moment, nobody is assigned to the shared inbox, so applications wait there for days.", cat: "As-Is", why: "Describes a current inefficiency." },
    { t: "In the redesigned process, web orders will update inventory automatically.", cat: "To-Be", why: "Describes the improved future process." },
    { t: "Under the new design, receipts will be photographed in the app and routed automatically.", cat: "To-Be", why: "A planned improvement." },
    { t: "Going forward, the major change will be submitted online and approved in one step.", cat: "To-Be", why: "The target process." },
    { t: "The new process will have two managers approve in parallel.", cat: "To-Be", why: "A redesigned state." },
    { t: "A named coordinator will monitor the inbox daily in the improved process.", cat: "To-Be", why: "A future-state change." },
  ];
  const astoSV = K.sortVariants({ key: "ch4-asto", bank: ASTO, cats: ["As-Is", "To-Be"], defs: { "As-Is": "how the process actually runs today", "To-Be": "the redesigned, improved process" }, ask: "statement",
    hint: "Is the sentence describing what happens now (warts and all), or what will happen after the redesign?" });
  const DOC = [
    { t: "Staff say they follow the official procedure, but the analyst suspects they use shortcuts they don't mention.", right: "Process observation", why: "Watching the work reveals informal workarounds people forget or don't admit to." },
    { t: "The analyst needs to understand one clerk's detailed steps for processing a refund, in the clerk's own words.", right: "Process interviews", why: "“Walk me through exactly what you do” captures one person's detailed steps." },
    { t: "The analyst wants to know which fields on the old paper form are actually used and what the system logs show.", right: "Document review", why: "Forms, templates, reports and logs are reviewed directly." },
    { t: "Five departments each know only their own part of the process, and nobody sees the whole.", right: "Workshop mapping", why: "Bringing all roles together lets them map the whole flow collaboratively." },
    { t: "The analyst wants to see how long patients really wait in the lobby on a busy Monday.", right: "Process observation", why: "Direct observation captures real timing and behavior." },
    { t: "The analyst needs the exact approval thresholds written in the purchasing policy manual and recent purchase reports.", right: "Document review", why: "Policies, reports and records are reviewed as documents." },
    { t: "Sales, billing and shipping disagree about where an order goes after it is confirmed.", right: "Workshop mapping", why: "Mapping together surfaces and resolves disagreements between roles." },
    { t: "A night-shift supervisor is the only person who knows how emergency orders are handled.", right: "Process interviews", why: "Interview the person who holds the knowledge." },
  ];
  const DOC_OPTS = ["Process interviews", "Process observation", "Document review", "Workshop mapping"];
  const DOC_WHY = { "Process interviews": "interviews capture one person's own account, which may skip workarounds or other roles",
    "Process observation": "observation shows behavior but is not the best way to gather documents or align several departments",
    "Document review": "documents show the official or recorded process, not necessarily what people do or how roles connect",
    "Workshop mapping": "a workshop aligns many roles but is heavy for a single person's steps or a stack of documents" };
  const GOALS = ["Reduce cycle time", "Reduce errors", "Clarify ownership", "Improve customer experience", "Enable automation"];
  const GOAL_DEF = { "Reduce cycle time": "remove waiting, run independent steps in parallel", "Reduce errors": "validation, simpler steps, error-proofing", "Clarify ownership": "give fuzzy handoffs a responsible owner", "Improve customer experience": "make the process easier or more pleasant for the customer", "Enable automation": "move rules-based, repetitive steps to systems" };
  const GOAL = [
    { t: "Run the background check and reference calls at the same time instead of one after the other.", cat: "Reduce cycle time", why: "Parallelizing independent steps shortens total time." },
    { t: "Remove the two-day wait while files sit in a queue between offices.", cat: "Reduce cycle time", why: "Eliminating waiting cuts cycle time." },
    { t: "Drop one of three sequential sign-offs so requests finish sooner.", cat: "Reduce cycle time", why: "Fewer sequential steps → shorter cycle." },
    { t: "Move the eligibility check to the start so ineligible requests stop immediately instead of after a week.", cat: "Reduce cycle time", why: "Moving a decision earlier stops wasted time." },
    { t: "Add a drop-down for state names so nobody types “Indianna” again.", cat: "Reduce errors", why: "Error-proofing input." },
    { t: "Make the form reject dates in the past for a future appointment.", cat: "Reduce errors", why: "A validation rule prevents bad data." },
    { t: "Replace an error-prone 12-step manual fee calculation with a simple 3-step lookup table.", cat: "Reduce errors", why: "Simplifying steps reduces mistakes." },
    { t: "Use barcode scanning instead of typing item numbers.", cat: "Reduce errors", why: "Removes typing mistakes." },
    { t: "Name one person responsible for moving each order from sales to billing.", cat: "Clarify ownership", why: "Assigns an owner to an ambiguous handoff." },
    { t: "Make the shared inbox the explicit job of the office coordinator.", cat: "Clarify ownership", why: "Ownership of an unowned step." },
    { t: "State in the map which lane approves refunds over $100.", cat: "Clarify ownership", why: "Clarifies responsibility." },
    { t: "Assign each escalated ticket to a named specialist instead of “the team.”", cat: "Clarify ownership", why: "A named owner per item." },
    { t: "Let customers track their repair status online instead of calling the shop.", cat: "Improve customer experience", why: "Makes the process easier for the customer." },
    { t: "Let students upload documents from their phones instead of visiting the office.", cat: "Improve customer experience", why: "Convenience for the customer." },
    { t: "Add seating and a clear pickup screen so customers can relax instead of crowding the counter.", cat: "Improve customer experience", why: "A more pleasant experience for the customer." },
    { t: "Offer a single sign-up page instead of three separate forms for parents.", cat: "Improve customer experience", why: "Less effort for the customer." },
    { t: "Have the system route each new application to the right reviewer based on its program code.", cat: "Enable automation", why: "Rules-based routing moved to a system." },
    { t: "Let software send the confirmation email the moment payment clears.", cat: "Enable automation", why: "A repetitive notification automated." },
    { t: "Let the inventory system reorder paper automatically when stock drops below 20 reams.", cat: "Enable automation", why: "A rule-driven, repetitive task automated." },
    { t: "Have the system flag expense reports over $500 for audit automatically.", cat: "Enable automation", why: "A rules-based check moved to software." },
  ];
  const goalSV = K.sortVariants({ key: "ch4-goal", bank: GOAL, cats: GOALS, defs: GOAL_DEF, ask: "redesign idea",
    hint: "Ask what the change mainly fixes: time, mistakes, unclear responsibility, the customer's effort, or a repetitive step a system could do." });
  const GAP = [
    { el: "Time a file waits for review", as: "4 days in a queue", to: "Same day", right: "Workflow software that routes each file automatically to an available reviewer",
      wrong: [{ t: "Add a validation rule to the input form", why: "Validation reduces errors, not queue time." }, { t: "Send letters by certified mail", why: "Changes the notice, not the review wait." }, { t: "Hire a consultant to redraw the As-Is map", why: "Mapping again doesn't close the gap; an action does." }] },
    { el: "Approvals", as: "3 managers, one after another", to: "2 managers, in parallel", right: "Change the approval policy and update the system to send both approvals at once",
      wrong: [{ t: "Train managers to sign faster", why: "Doesn't change the number or order of approvals." }, { t: "Add a third parallel approver", why: "The goal is fewer approvals, not more." }, { t: "Automate the confirmation email", why: "Unrelated to the approval structure." }] },
    { el: "Customer notification", as: "Printed letter mailed by staff", to: "Automatic email or text", right: "Configure automatic notifications in the system",
      wrong: [{ t: "Buy a faster printer", why: "Still a mailed letter." }, { t: "Add a manager approval before each letter", why: "Slows things down and doesn't automate." }, { t: "Add form validation rules", why: "Validation targets input errors, not notifications." }] },
    { el: "Data-entry error rate", as: "8% of records", to: "Under 2%", right: "Add validation rules (required fields, formats, drop-downs) to the input form",
      wrong: [{ t: "Route forms automatically to reviewers", why: "Routing speeds things up but doesn't stop bad data being entered." }, { t: "Mail a copy of each record to the customer", why: "Doesn't prevent the errors." }, { t: "Remove one approval step", why: "Approvals aren't the source of entry errors." }] },
    { el: "Order handoff from sales to billing", as: "Nobody owns it; orders sometimes sit for a week", to: "Every order reaches billing within 1 day", right: "Assign a named owner for the handoff and track it with a daily report",
      wrong: [{ t: "Add a fourth approval", why: "More approvals add delay." }, { t: "Print each order twice", why: "Doesn't create ownership." }, { t: "Redesign the company logo", why: "Irrelevant to the handoff." }] },
    { el: "Appointment booking", as: "Customers must phone during office hours", to: "24/7 self-service booking", right: "Launch an online booking page connected to the scheduling system",
      wrong: [{ t: "Extend phone hours by one hour", why: "Still not 24/7 self-service." }, { t: "Add a validation rule to the paper form", why: "Doesn't provide self-service." }, { t: "Require manager approval of each booking", why: "Adds a step instead of enabling self-service." }] },
  ];
  const PCT = [
    { el: "average cycle time", unit: "days", as: [10, 12, 15, 20, 24], to: [2, 3, 4, 5, 6] },
    { el: "data-entry error rate", unit: "%", as: [8, 10, 12, 16], to: [1, 2, 3, 4] },
    { el: "time a request waits in the queue", unit: "hours", as: [40, 48, 60, 72], to: [4, 6, 8, 12] },
    { el: "number of approval steps", unit: "steps", as: [4, 5, 6], to: [1, 2, 3] },
  ];
  const DESC = [
    { q: "While documenting the As-Is, an analyst notices a duplicate form and starts drawing the process <em>without</em> it. What should she do?", right: "Pause: document the process as it really is, including the duplicate form, and note the issue for the To-Be phase",
      rightWhy: "As-Is documentation is descriptive, not prescriptive; fixing during documentation destroys the baseline.",
      wrong: [{ t: "Act: leave the form out, since it will be removed anyway", why: "Then the As-Is no longer matches reality and you can't measure the improvement." }, { t: "Act: delete the form from the office immediately", why: "Changing the process mid-documentation is prescriptive and premature." }, { t: "Stop documenting until management approves removing the form", why: "Keep documenting; the redesign decision comes later." }],
      sol: ["What is the rule for the As-Is phase?", "Descriptive, not prescriptive: record what is, fix later."] },
    { q: "The official procedure manual says receipts are scanned, but an analyst sees staff photocopying them. Which belongs in the As-Is?", right: "The photocopying, because the As-Is records what actually happens",
      rightWhy: "The documented (intended) process often differs from the actual one; the As-Is captures reality.",
      wrong: [{ t: "The scanning, because that is the official procedure", why: "That's the intended process, not the actual one." }, { t: "Neither, until the staff are corrected", why: "Record the workaround; it's evidence of a problem." }, { t: "Both, drawn as a parallel gateway", why: "Staff aren't doing both; they're doing the workaround." }],
      sol: ["Official vs. actual: which does the As-Is describe?", "Actual, workarounds included."] },
    { q: "A manager says, “Skip the As-Is. We already know the new design is better.” What is the strongest reply?", right: "Without an As-Is baseline you can't show the To-Be is better, and you may miss the real root causes",
      rightWhy: "The As-Is gives a baseline for measuring improvement and reveals root causes.",
      wrong: [{ t: "The As-Is is required by BPMN notation rules", why: "It's a management reason (baseline, root causes), not a notation rule." }, { t: "The As-Is is needed so the old process can be kept", why: "The point is to improve it, not to keep it." }, { t: "The As-Is is the same as the To-Be", why: "They are different: current vs. redesigned." }],
      sol: ["Why does documenting today's process matter before redesigning?", "Baseline + root causes + workarounds."] },
    { q: "Which To-Be change is <b>not</b> “radical” but could still be a valuable improvement?", right: "Moving the eligibility check from the end of the process to the start",
      rightWhy: "Small changes (one approval removed, two forms combined, a decision moved earlier) can matter a lot.",
      wrong: [{ t: "Replacing the entire department with new software", why: "That is a radical change." }, { t: "Outsourcing the whole process to another company", why: "Also radical." }, { t: "Rebuilding the process from scratch with all-new roles", why: "Radical redesign, not a small tweak." }],
      sol: ["To-Be improvements come in different sizes.", "Moving one decision earlier is small but effective."] },
  ];
  const TOBE_TF = [
    { s: "The As-Is process should include the informal workarounds people really use.", truth: true, why: "It records the actual process, which often differs from the official one.", hint: "Actual or intended?" },
    { s: "During As-Is documentation, analysts should fix problems as soon as they see them.", truth: false, why: "The As-Is is descriptive, not prescriptive; fixes belong in the To-Be.", hint: "Descriptive or prescriptive?" },
    { s: "A To-Be design must always be a radical, from-scratch redesign.", truth: false, why: "Removing one approval or combining two forms can be enough.", hint: "Do improvements have to be big?" },
    { s: "Gap analysis compares As-Is and To-Be element by element and names the action to close each gap.", truth: true, why: "That is what a gap analysis table does.", hint: "What does each row of a gap table hold?" },
    { s: "Process observation is useful because it can reveal workarounds people don't mention in interviews.", truth: true, why: "Watching the work exposes informal steps.", hint: "What does watching reveal that asking may not?" },
    { s: "Enabling automation means moving judgment-heavy exceptions to software first.", truth: false, why: "Automation targets rules-based, repetitive steps; judgment stays with people.", hint: "Which steps suit automation?" },
  ];

  /* ============================================================
   * TOPIC 8 · Change management
   * ============================================================ */
  const BARRIERS = ["Resistance to change", "Training gap", "Organizational inertia"];
  const BAR_DEF = { "Resistance to change": "people don't want to change, often because they weren't involved", "Training gap": "people are willing but don't know how to work the new way", "Organizational inertia": "policies, systems or incentives still support the old process" };
  const BAR = [
    { t: "Clerks who were never consulted about the redesign say the new system “will never work here.”", cat: "Resistance to change", why: "Unwillingness, worsened by not being involved." },
    { t: "Veteran nurses keep using paper charts because “the old way has always been fine.”", cat: "Resistance to change", why: "Attachment to the familiar process." },
    { t: "Staff grumble that the new process was “forced on them by people who don't do the job.”", cat: "Resistance to change", why: "Resistance from exclusion from the design." },
    { t: "A team quietly keeps its old spreadsheet and ignores the new workflow tool.", cat: "Resistance to change", why: "Choosing not to adopt the change." },
    { t: "Night-shift workers want to use the new scanners but were never shown how.", cat: "Training gap", why: "Willing but lacking the skills: training gap." },
    { t: "Advisors enter data in the wrong fields of the new system because the training was a 10-minute video.", cat: "Training gap", why: "Inadequate training." },
    { t: "Cashiers call the manager every time the new app shows an error message they don't understand.", cat: "Training gap", why: "Not knowing how to handle the new process." },
    { t: "New hires are taught the old process by coworkers because no new training exists.", cat: "Training gap", why: "Missing training on the new way." },
    { t: "Bonuses are still based on the number of paper forms processed, which the new process eliminates.", cat: "Organizational inertia", why: "Incentives still reward the old process." },
    { t: "The policy manual still requires a wet-ink signature, so staff print the electronic forms anyway.", cat: "Organizational inertia", why: "Policy aligned to the old process." },
    { t: "The old billing system can't accept orders from the new web form, so staff re-key them.", cat: "Organizational inertia", why: "Systems built for the old process." },
    { t: "Managers are still evaluated on the old metric of calls handled per hour, not issues solved.", cat: "Organizational inertia", why: "Performance measures tied to the old process." },
  ];
  const barSV = K.sortVariants({ key: "ch4-bar", bank: BAR, cats: BARRIERS, defs: BAR_DEF, ask: "situation",
    hint: "Ask why people aren't working the new way: they don't want to (resistance), they don't know how (training), or the organization's rules, systems or rewards still favor the old way (inertia)." });
  const FIX = [
    { q: "A clinic's new check-in process is rejected by front-desk staff who were not consulted about it. What is the best response?", right: "Involve frontline staff in refining the process and explain clearly why it is changing",
      rightWhy: "Resistance is lowest when the people doing the work help shape the change and understand the reason.",
      wrong: [{ t: "Send a memo requiring compliance", why: "Orders without involvement usually deepen resistance." }, { t: "Buy more software", why: "The problem is people's buy-in, not technology." }, { t: "Wait for the staff to retire", why: "Not a change-management practice." }],
      sol: ["Diagnose the barrier first: is it skill, will, or the system around them?", "Will (resistance) → involve and communicate why."] },
    { q: "Warehouse pickers want to use the new handheld scanners but keep making mistakes with them. What should management do first?", right: "Provide hands-on training on the scanners for every shift",
      rightWhy: "Willing but unable = training gap; the fix is adequate training.",
      wrong: [{ t: "Discipline the pickers for errors", why: "Punishing a skills gap doesn't close it." }, { t: "Hold a meeting to explain why the change matters", why: "They already want to use them; they need skills, not persuasion." }, { t: "Go back to paper lists", why: "Abandons the improvement instead of supporting it." }],
      sol: ["Do the pickers lack willingness or ability?", "Ability → training."] },
    { q: "Sales reps are still paid commission per paper order form, so they avoid the new online ordering process. What is the root fix?", right: "Change the commission rule so the new process is rewarded",
      rightWhy: "Organizational inertia: incentives still favor the old process, so they must be realigned.",
      wrong: [{ t: "Offer a training course on the online system", why: "They can use it; the incentive works against it." }, { t: "Celebrate the first online order", why: "Nice, but the pay rule still pushes them back to paper." }, { t: "Remove the online process", why: "Gives up on the improvement." }],
      sol: ["What in the organization still rewards the old way?", "Realign the incentive (inertia)."] },
    { q: "Two months into a new process, the team cut approval time in half. What change-management practice should the manager use now?", right: "Celebrate the early success publicly to build momentum",
      rightWhy: "Celebrating early wins reinforces the change and wins over doubters.",
      wrong: [{ t: "Say nothing so people don't get complacent", why: "Recognizing wins builds momentum for the change." }, { t: "Immediately start a different redesign", why: "Constant change without consolidation feeds resistance." }, { t: "Remove the training program since it worked", why: "New staff will still need training." }],
      sol: ["What sustains a change after early results?", "Celebrate early successes."] },
    { q: "Employees ask, “Why are we changing a process that works fine?” What is the most important missing practice?", right: "Communicating clearly the reasons for the change and what problems it solves",
      rightWhy: "People resist changes they don't understand; clear reasons reduce that.",
      wrong: [{ t: "More software features", why: "The question is about why, not about tools." }, { t: "Stricter monitoring of employees", why: "Monitoring doesn't explain the purpose." }, { t: "Adding more approval steps", why: "Unrelated, and makes the process slower." }],
      sol: ["What are the employees actually asking for?", "An explanation: communicate why."] },
  ];
  const PRACTICES = [
    { t: "Involve frontline employees in designing the To-Be", ok: true, why: "Involvement reduces resistance and improves the design." },
    { t: "Explain clearly why the process is changing", ok: true, why: "Understanding the reasons builds support." },
    { t: "Provide adequate, hands-on training", ok: true, why: "Closes training gaps." },
    { t: "Celebrate early successes", ok: true, why: "Builds momentum and credibility." },
    { t: "Update incentives and policies that still reward the old process", ok: true, why: "Removes organizational inertia." },
    { t: "Announce the change by email the day it goes live, with no explanation", ok: false, why: "No involvement or communication of why: invites resistance." },
    { t: "Skip training because the new system is “intuitive”", ok: false, why: "Creates a training gap." },
    { t: "Keep the old bonus rules in place to avoid upsetting anyone", ok: false, why: "Inertia: incentives keep rewarding the old process." },
    { t: "Design the new process without talking to the people who do the work", ok: false, why: "Breeds resistance and misses workarounds." },
    { t: "Punish anyone who questions the change", ok: false, why: "Silences useful feedback and deepens resistance." },
  ];
  const AUTO = [
    { q: "Which step in a scholarship process is the best candidate for automation?", right: "Routing each new application to the reviewer for its program code", rightWhy: "A rules-based, repetitive step: perfect for a system.",
      wrong: [{ t: "Judging the quality of each applicant's essay", why: "Requires human judgment." }, { t: "Deciding scholarship policy for next year", why: "A strategic judgment, not a repetitive rule." }, { t: "Calling a student whose situation is unusual", why: "An exception that needs a person." }] },
    { q: "Which help-desk step is the best candidate for automation?", right: "Sending the employee an automatic status email when the ticket changes state", rightWhy: "Notifications are rule-driven and repetitive.",
      wrong: [{ t: "Diagnosing a new, never-seen hardware fault", why: "Requires expert judgment." }, { t: "Calming down a frustrated executive", why: "A relationship task for people." }, { t: "Deciding which new laptop model to buy company-wide", why: "A judgment decision." }] },
    { q: "Which expense-report step is the best candidate for automation?", right: "Flagging every report over $500 for audit", rightWhy: "A fixed rule the system can apply every time.",
      wrong: [{ t: "Deciding whether an unusual expense was reasonable", why: "Judgment on an exception." }, { t: "Negotiating a new travel policy with managers", why: "A human negotiation." }, { t: "Talking with an employee about repeated policy violations", why: "Sensitive, judgment-heavy." }] },
    { q: "A process is slow and full of errors. Someone proposes automating it exactly as it is. What is the best judgment?", right: "Fix the process first; automating a broken process just produces bad results faster",
      rightWhy: "Redesign (To-Be) comes before automation.",
      wrong: [{ t: "Automate it now; software removes all errors", why: "Software faithfully repeats bad steps." }, { t: "Never automate anything", why: "Automation is valuable for rules-based, repetitive steps once the process is sound." }, { t: "Automate only the steps with human judgment", why: "Those are the worst candidates." }] },
    { q: "A library is adding self-checkout kiosks. Which task should <b>stay</b> with a librarian?", right: "Helping a student whose account is blocked for an unusual reason", rightWhy: "Exceptions and judgment stay with people; routine scans go to the kiosk.",
      wrong: [{ t: "Scanning the barcode of each book", why: "Routine and rules-based: ideal for the kiosk." }, { t: "Printing the due-date receipt", why: "Repetitive: the kiosk can do it." }, { t: "Checking that the ID number is valid", why: "A rule check the system can do." }] },
  ];
  const ACT = [
    { q: "One week after a new ordering process launches, error rates jump in one store only, and that store's staff missed the training session. Act, pause or investigate?", right: "Act: run the training for that store's staff",
      rightWhy: "The cause is clear (a training gap in one place), so act on it directly.",
      wrong: [{ t: "Pause: roll the whole company back to the old process", why: "The problem is local and explained; a full rollback throws away the gains elsewhere." }, { t: "Investigate: commission a six-month study", why: "The cause is already evident; delay just prolongs the errors." }, { t: "Ignore it; errors always fall on their own", why: "Untrained staff will keep making the same mistakes." }],
      sol: ["Is the cause already known?", "Known, local cause → act with the matching fix (training)."] },
    { q: "Cycle time rose after a redesign, but nobody knows which step is slower. Act, pause or investigate?", right: "Investigate: measure each step's wait and work time to find the new bottleneck",
      rightWhy: "Without knowing where the delay is, any fix is a guess; gather data first.",
      wrong: [{ t: "Act: hire more staff everywhere", why: "Expensive and may not touch the real bottleneck." }, { t: "Act: automate every step", why: "A guess, and automating a broken step doesn't help." }, { t: "Pause: cancel the redesign immediately", why: "Premature without knowing the cause." }],
      sol: ["Do we know where the delay is?", "No → investigate (measure the steps)."] },
    { q: "A To-Be design would cut a required legal compliance check, and the legal team hasn't reviewed it. Act, pause or investigate?", right: "Pause: hold that change until legal confirms the check can be removed or replaced",
      rightWhy: "Removing a control has compliance risk; pause until the right people sign off.",
      wrong: [{ t: "Act: remove the check now, since it's non-value-adding", why: "Required controls can't simply be dropped; that's a legal risk." }, { t: "Act: remove it and see whether anyone notices", why: "Risky and irresponsible for a compliance control." }, { t: "Investigate: time how long the check takes", why: "Timing doesn't answer whether the check may legally be removed." }],
      sol: ["Who has to agree before a control is removed?", "Pause for legal review."] },
  ];
  const CHANGE_TF = [
    { s: "People are more likely to resist a new process if they were not involved in designing it.", truth: true, why: "Involvement builds ownership; exclusion breeds resistance.", hint: "Recall what makes resistance worse." },
    { s: "Organizational inertia means employees lack the skills to use a new process.", truth: false, why: "That's a training gap. Inertia is policies, systems and incentives still built for the old process.", hint: "Skills vs. structures." },
    { s: "Celebrating early successes is a recommended change-management practice.", truth: true, why: "Early wins build momentum.", hint: "Recall the four practices." },
    { s: "If people resist a change, the best fix is always more training.", truth: false, why: "Training fixes training gaps; resistance calls for involvement and clear communication of why.", hint: "Match the fix to the barrier." },
    { s: "Rules-based, repetitive steps are good candidates for automation.", truth: true, why: "Systems handle routine rules well; people handle judgment and exceptions.", hint: "Which steps suit software?" },
    { s: "Change management is finished once the new process diagram is approved.", truth: false, why: "The hard part is getting people to work the new way after launch.", hint: "Is a diagram the same as adoption?" },
  ];

  /* ============================================================
   * GENERATORS
   * ============================================================ */
  const nodeText = n => n.type === "task" ? `Task “${esc(n.label)}”`
    : n.type === "end" ? `End event “${esc(n.label)}” (that path finishes)`
      : n.type === "xor" ? `Another decision: “${esc(n.label)}”`
        : n.type === "and" ? `A parallel split (+), so several tasks start at once`
          : `Start event`;
  const pathList = g => ul(g.paths.map((p, i) => `Path ${i + 1}: ${p.choices.length ? pathWords(p) : "no decisions"} → ends at “${esc(p.end.label)}”`));
  const uniqBy = (arr, f) => { const seen = new Set(); return arr.filter(x => { const k = f(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const trapsFor = (answer, list) => uniqBy(list.filter(t => Number.isFinite(t.value) && t.value >= 0 && Math.abs(t.value - answer) > Math.max(0.02, Math.abs(answer) * 0.011)), t => t.value);

  const generators = [
    /* ---------------- 1 · BPM ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-bpm",
      name: "BPM lifecycle and benefits",
      blurb: "Place activities in the five-stage BPM lifecycle and match results to efficiency, consistency, accountability and adaptability.",
      variants: [
        ...pickV(lifeSV, [[0, "Lifecycle: sort activities"], [4, "Lifecycle: name the stage"]]),
        {
          name: "Lifecycle: what comes next?",
          make() {
            const i = U.randInt(0, 4), cur = STAGES[i], next = STAGES[(i + 1) % 5];
            return Q.mc({
              q: `<p>A team has just finished <b>${cur.toLowerCase()}</b> (${STAGE_DEF[cur]}). In the BPM lifecycle, which stage comes next?</p>`,
              right: next, rightWhy: `${next}: ${STAGE_DEF[next]}.${i === 4 ? " The loop starts again: that is why BPM is a lifecycle." : ""}`,
              wrong: STAGES.filter(s => s !== next && s !== cur).map(s => ({ t: s, why: `${s} means ${STAGE_DEF[s]}. It sits ${STAGES.indexOf(s) < i ? "earlier" : "later"} in the loop, not immediately after ${cur.toLowerCase()}.` })),
              keepOrder: STAGES,
              sol: S("The cycle is: design → model → execute → monitor → optimize → (design again).", `After ${cur.toLowerCase()} comes <b>${next.toLowerCase()}</b>.`),
            });
          },
        },
        ...pickV(benSV, [[1, "Benefit: pick the example"], [2, "Benefit: which is NOT"], [3, "Benefit: select all"]]),
        K.conceptVariant("Processes and systems: explain", "ch4-bpmc", BPM_CONCEPT),
        K.tfVariant("BPM: true or false", "ch4-bpmtf", BPM_TF),
      ],
    }),

    /* ---------------- 2 · ITO ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-ito",
      name: "ITO analysis and value",
      blurb: "Break randomized processes into inputs, transformations, outputs and feedback; spot value-adding steps and input forms.",
      variants: [
        {
          name: "ITO breakdown (drop-down)",
          make() {
            const p = U.rotate("ch4-proc", PROCS);
            const items = [U.pick(p.in), U.pick(p.tr), U.pick(p.out), U.pick(p.fb)].map((t, i) => ({ t, cat: ITO_CATS[i] }));
            const extra = U.pick(itoItems(p).filter(x => !items.some(y => y.t === x.t)));
            const all = items.concat([extra]).map(x => ({ t: x.t, cat: x.cat, why: `${x.cat}: ${ITO_WHY[x.cat]}.` }));
            return Q.classify({ q: `<p>Classify each element of <b>${p.name}</b>.</p>`, cats: ITO_CATS, items: all, sol: itoSol(p) });
          },
        },
        {
          name: "Spot the feedback",
          make() {
            const p = U.rotate("ch4-proc", PROCS);
            const right = U.pick(p.fb);
            return Q.mc({
              q: `<p>In <b>${p.name}</b>, which item is <b>feedback</b>?</p>`, right, rightWhy: `Feedback: ${ITO_WHY.Feedback}.`,
              wrong: [{ t: U.pick(p.in), why: `That is an input: ${ITO_WHY.Input}.` }, { t: U.pick(p.tr), why: `That is a transformation: ${ITO_WHY.Transformation}.` }, { t: U.pick(p.out), why: `That is an output: ${ITO_WHY.Output}. Being later in the process doesn't make it feedback.` }],
              sol: S("Feedback is information <em>about the output's results</em> that comes back to change the process.", itoSol(p)),
            });
          },
        },
        {
          name: "Which is NOT an input?",
          make() {
            const p = U.rotate("ch4-proc", PROCS);
            const odd = coin() ? { t: U.pick(p.tr), c: "Transformation" } : { t: U.pick(p.out), c: "Output" };
            return Q.mc({
              q: `<p>Three of these are <b>inputs</b> to ${p.name}. Which one is <b>not</b>?</p>`, right: odd.t, rightWhy: `It is ${odd.c === "Output" ? "an output" : "a transformation activity"}: ${ITO_WHY[odd.c]}.`,
              wrong: U.sample(p.in, 3).map(t => ({ t, why: `This is an input: ${ITO_WHY.Input}.` })),
              sol: S("Inputs are things (materials, information, people, money, energy) that enter; activities and results are not inputs.", itoSol(p)),
            });
          },
        },
        {
          name: "Select every transformation",
          make() {
            const p = U.rotate("ch4-proc", PROCS);
            const k = U.randInt(1, 3);
            const opts = U.sample(p.tr, k).map(t => ({ t, ok: true, why: `Transformation: ${ITO_WHY.Transformation}.` }))
              .concat(U.sample([].concat(p.in.map(t => ({ t, c: "Input" })), p.out.map(t => ({ t, c: "Output" })), p.fb.map(t => ({ t, c: "Feedback" }))), 5 - k)
                .map(o => ({ t: o.t, ok: false, why: `${o.c}: ${ITO_WHY[o.c]}.` })));
            return Q.multi({ q: `<p>For <b>${p.name}</b>, select <b>every</b> transformation activity.</p>`, options: opts,
              sol: S("Transformations are <em>activities</em> (verbs: checking, steaming, packing) that change inputs into outputs.", itoSol(p)) });
          },
        },
        {
          name: "Linked processes",
          make() {
            const e = U.rotate("ch4-chain", CHAIN);
            return Q.mc({ q: `<p>${e.q}</p>`, right: e.right, rightWhy: e.rightWhy, wrong: e.wrong,
              sol: S("Processes are linked: one process's output often becomes the next process's input.", `Answer: <b>${e.right}</b>. ${e.rightWhy}`) });
          },
        },
        {
          name: "Value-adding or not?",
          make() {
            const items = U.deal("ch4-va-y", VA.filter(v => v.va), U.randInt(2, 3)).concat(U.deal("ch4-va-n", VA.filter(v => !v.va), U.randInt(2, 3)));
            return Q.classify({
              q: "<p>Classify each step from the customer's point of view.</p>", cats: ["Value-adding", "Non-value-adding"],
              items: items.map(v => ({ t: v.t, cat: v.va ? "Value-adding" : "Non-value-adding", why: v.why })),
              sol: S("Ask: would the customer pay for this step, or miss it if it disappeared?", "Value comes from changing form, location, information, ownership or giving access/experience. Waiting, rework, re-keying and excess approvals add none."),
            });
          },
        },
        ...pickV(valueSV, [[4, "Name the value added"]]),
        ...pickV(informSV, [[0, "Input forms: sort"]]),
      ],
    }),

    /* ---------------- 3 · Maps ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-maps",
      name: "Process maps, map types and Lucidchart",
      blurb: "Choose the right map for a job, name what a map is being used for, and recall the Lucidchart BPMN steps.",
      variants: [
        ...pickV(maptypeSV, [[1, "Map type: which situation fits?"], [4, "Map type: name it"]]),
        ...pickV(purposeSV, [[0, "Map purposes: sort"], [2, "Map purposes: which is NOT"]]),
        {
          name: "Lucidchart: put the steps in order",
          make() {
            const s = U.randInt(0, LUCID.length - 4);
            const seq = LUCID.slice(s, s + 4);
            const fmt = arr => arr.map((x, i) => `${i + 1}) ${x}`).join("<br>");
            const swaps = [[0, 1], [1, 2], [2, 3], [0, 3]];
            const wrongs = U.sample(swaps, 3).map(([a, b]) => { const c = seq.slice(); [c[a], c[b]] = [c[b], c[a]]; return { t: fmt(c), why: `“${seq[b]}” has to come after “${seq[a]}” in the setup.` }; });
            return Q.mc({
              q: "<p>You are building a BPMN diagram in Lucidchart. Which sequence of steps is in the correct order?</p>", right: fmt(seq), rightWhy: "This follows the setup: sign in → blank document → close pop-ups → pin BPMN 2.0 shapes → drag → label → connect.",
              wrong: wrongs,
              sol: S("Think about what must exist before each step: you need a document before shapes, and shapes before labels or connectors.", `Full order: ${ul(LUCID)}`),
            });
          },
        },
        K.conceptVariant("Lucidchart: how do I…?", "ch4-lucid", LUCID_Q),
        K.conceptVariant("Why map? Apply it", "ch4-mapc", MAP_CONCEPT),
        K.tfVariant("Maps: true or false", "ch4-maptf", MAP_TF),
      ],
    }),

    /* ---------------- 4 · BPMN symbols ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-symbols",
      name: "BPMN symbols",
      blurb: "Recognise BPMN events, tasks, gateways, flows, pools and lanes, and catch notation mistakes.",
      variants: [
        {
          name: "Name the shape",
          make() {
            const s = U.rotate("ch4-sym", SYM);
            const near = LOOKALIKE[s.k].map(symBy);
            const far = U.pick(SYM.filter(x => x.k !== s.k && !LOOKALIKE[s.k].includes(x.k)));
            return Q.mc({
              q: `<p>What does this BPMN symbol represent?</p><div class="example">${PIC[s.pic]()}</div>`,
              right: s.name, rightWhy: `${s.name}: ${s.desc}.`,
              wrong: near.concat([far]).map(x => ({ t: x.name, why: `A ${x.name.toLowerCase()} is ${x.desc}.` })),
              sol: S("Circles are events (thin start, thick end, double intermediate), rounded boxes are work, diamonds are gateways, arrows are flows (solid in a pool, dashed between pools).", `This is a <b>${s.name.toLowerCase()}</b>: ${s.desc}.`),
            });
          },
        },
        {
          name: "Find the shape",
          make() {
            const target = U.rotate("ch4-sym2", SYM.filter(x => !["pool", "lane"].includes(x.k)));
            const others = U.sample(LOOKALIKE[target.k].map(symBy).filter(x => !["pool", "lane"].includes(x.k)).concat(U.sample(SYM.filter(x => x.k !== target.k && !["pool", "lane"].includes(x.k) && !LOOKALIKE[target.k].includes(x.k)), 3)), 3);
            const shown = U.shuffle([target].concat(others));
            const L = ["A", "B", "C", "D"];
            const cells = shown.map((s, i) => `<td><b>${L[i]}</b><br>${PIC[s.pic]()}</td>`).join("");
            const ri = shown.indexOf(target);
            return Q.mc({
              q: `<p>Which shape is the <b>${target.name.toLowerCase()}</b>?</p><table class="tbl"><tbody><tr>${cells}</tr></tbody></table>`,
              right: `Shape ${L[ri]}`, rightWhy: `Shape ${L[ri]} is the ${target.name.toLowerCase()}: ${target.desc}.`,
              wrong: shown.map((s, i) => ({ s, i })).filter(o => o.i !== ri).map(o => ({ t: `Shape ${L[o.i]}`, why: `Shape ${L[o.i]} is a ${o.s.name.toLowerCase()}: ${o.s.desc}.` })),
              keepOrder: L.map(x => `Shape ${x}`),
              sol: S(`Recall what a ${target.name.toLowerCase()} looks like: ${target.desc}.`, `It is shape <b>${L[ri]}</b>.`),
            });
          },
        },
        {
          name: "Exclusive or parallel?",
          make() {
            const e = U.rotate("ch4-gws", GW_SCEN);
            const other = e.right.startsWith("Exclusive") ? "Parallel gateway (+)" : "Exclusive gateway (X)";
            return Q.mc({
              q: `<p>${e.t}</p><p>Which gateway should split the flow here?</p>`, right: e.right, rightWhy: e.why,
              wrong: [{ t: other, why: other.startsWith("Parallel") ? "A + gateway runs every branch for every case; here only one branch should run." : "An X gateway picks exactly one branch; here every branch should run." },
                { t: "Intermediate event (double circle)", why: "Intermediate events mark something happening mid-process (a timer, a message), not a split." },
                { t: "Message flow (dashed arrow)", why: "Message flows carry communication between pools; they do not split a flow." }],
              sol: S("Ask: does each case take <em>one</em> branch, or <em>all</em> branches?", `One branch → exclusive (X); all branches → parallel (+). Here: <b>${e.right}</b>. ${e.why}`),
            });
          },
        },
        {
          name: "Sequence or message flow?",
          make() {
            const e = U.rotate("ch4-flows", FLOW_SCEN);
            const other = e.right.startsWith("Message") ? "Sequence flow (solid arrow)" : "Message flow (dashed arrow)";
            return Q.mc({
              q: `<p>${e.t}</p><p>Which connector should be drawn?</p>`, right: e.right, rightWhy: e.why,
              wrong: [{ t: other, why: other.startsWith("Message") ? "Dashed message flows are only for communication between different pools." : "Solid sequence flows stay inside one pool; separate organizations need a dashed message flow." },
                { t: "No connector: crossing a lane is not allowed", why: "Crossing lanes is allowed and common: it shows a handoff." },
                { t: "A parallel gateway (+)", why: "A gateway splits or joins flow; it isn't a connector between two steps." }],
              sol: S("Check whether the two ends are in the <em>same pool</em> or in <em>different pools</em>.", `Same pool (even different lanes) → solid sequence flow. Different pools → dashed message flow. Here: <b>${e.right}</b>.`),
            });
          },
        },
        {
          name: "Pool or lane?",
          make() {
            const items = U.deal("ch4-pl-p", POOLLANE.filter(x => x.cat === "Pool"), 2).concat(U.deal("ch4-pl-l", POOLLANE.filter(x => x.cat === "Lane"), U.randInt(2, 3)));
            return Q.classify({ q: "<p>In a BPMN diagram of the process being mapped, would each of these be drawn as a pool or a lane?</p>", cats: ["Pool", "Lane"], items,
              sol: S("A pool is a whole participant/organization; a lane is a role or department inside it.", "Separate organizations that exchange messages get their own pools; roles inside the organization become lanes.") });
          },
        },
        K.conceptVariant("Spot the notation error", "ch4-symerr", SYM_ERR),
        {
          name: "Select a symbol family",
          make() {
            const fam = U.pick([
              { name: "event", keys: ["start", "end", "inter"], why: "Events are circles: things that happen (start, end, mid-process)." },
              { name: "flow object that does or decides something (task or gateway)", keys: ["task", "xor", "and"], why: "Tasks do work; gateways decide or split." },
              { name: "connector", keys: ["seq", "msg"], why: "Connectors are arrows: sequence flows and message flows." },
            ]);
            const inK = U.sample(fam.keys, U.randInt(1, fam.keys.length));
            const outK = U.sample(SYM.filter(s => !fam.keys.includes(s.k)).map(s => s.k), 5 - inK.length);
            const opts = inK.map(k => ({ t: symBy(k).name, ok: true, why: `${symBy(k).name}: ${symBy(k).desc}.` }))
              .concat(outK.map(k => ({ t: symBy(k).name, ok: false, why: `${symBy(k).name} is not a ${fam.name}: it is ${symBy(k).desc}.` })));
            return Q.multi({ q: `<p>Select <b>every</b> BPMN element that is a <b>${fam.name}</b>.</p>`, options: opts,
              sol: S("Group the notation into families: events (circles), activities (rounded boxes), gateways (diamonds), connectors (arrows), swimlanes (pools and lanes).", fam.why) });
          },
        },
        K.tfVariant("Notation: true or false", "ch4-symtf", SYM_TF),
      ],
    }),

    /* ---------------- 5 · Reading BPMN diagrams ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-read",
      name: "Reading BPMN diagrams",
      blurb: "Trace fresh BPMN diagrams: count paths, find who does a task, follow a gateway branch, predict the outcome and count handoffs.",
      variants: [
        {
          name: "Count the paths",
          make() {
            const g = randomDiagram();
            const ans = g.paths.length;
            const traps = trapsFor(ans, [
              { value: g.ends.length, why: "That is the number of end events. Two different routes can finish at the same end event." },
              { value: g.decisions.length, why: "That counts decision gateways, not routes. An exit branch adds one route; a branch that rejoins doubles the routes through it." },
              { value: Math.pow(2, g.decisions.length), why: "Doubling at every gateway assumes every branch continues; branches that end the process don't multiply later choices." },
              { value: g.hasAnd ? ans * 2 : -1, why: "A parallel (+) block is not a choice: every case runs both branches, so it adds no paths." },
            ]);
            return Q.num({
              q: diagramIntro(g) + "<p>How many distinct paths lead from the start event to an end event?</p>", answer: ans, kind: "count", traps,
              sol: S("Put your finger on the start event. At every X gateway the route splits; at a + gateway it does not (both branches always run). Count the complete routes.", `The routes are:${pathList(g)}`, `So there are <b>${ans}</b> paths.`),
            });
          },
        },
        {
          name: "Who does this task?",
          make() {
            const g = randomDiagram();
            const t = U.pick(g.tasks);
            const lane = g.lanes[t.lane];
            return Q.mc({
              q: diagramIntro(g) + `<p>Who is responsible for the task “${esc(t.label)}”?</p>`,
              right: lane, rightWhy: `The task's box sits inside the ${lane} lane, and lanes show who performs each task.`,
              wrong: g.lanes.filter((_, i) => i !== t.lane).map(l => ({ t: l, why: `The ${l} lane is a different band; the task isn't drawn inside it. Arrows passing nearby don't change ownership.` }))
                .concat([{ t: `${g.pool} as a whole (it is in the pool)`, why: "Every task is in the pool; the lane inside it is what names the responsible role." }]),
              sol: S("Find the box, then slide left to the lane label of the band it sits in.", `“${esc(t.label)}” is in the <b>${lane}</b> lane.`),
            });
          },
        },
        {
          name: "Follow a gateway branch",
          make() {
            const g = randomDiagram();
            const d = U.pick(g.decisions);
            const outs = g.edges.filter(e => e.a === d);
            const e = U.pick(outs), other = outs.find(x => x !== e);
            const right = nodeText(e.b);
            const pool = [{ t: nodeText(other.b), why: `That is where the “${other.label}” branch goes, not the “${e.label}” branch.` },
              { t: "The flow goes back to the start event to try again", why: "No arrow loops back to the start; follow only the arrows that are drawn." },
              ...U.shuffle(g.tasks.filter(t => t !== e.b && t !== other.b)).map(t => ({ t: nodeText(t), why: "That task isn't directly connected to this branch; follow the arrow labeled with the answer." }))];
            const wrong = uniqBy(pool.filter(w => U.plain(w.t) !== U.plain(right)), w => U.plain(w.t)).slice(0, 3);
            return Q.mc({
              q: diagramIntro(g) + `<p>At the gateway “${esc(d.label)}”, the answer is <b>${e.label}</b>. What does the flow reach next?</p>`,
              right, rightWhy: `The arrow labeled “${e.label}” leads to it.`, wrong,
              sol: S("Find the diamond, then find the arrow leaving it whose label matches the answer. Only that one branch is taken (exclusive gateway).", `The “${e.label}” arrow leads to: <b>${right}</b>.`),
            });
          },
        },
        {
          name: "Predict the outcome",
          make() {
            const g = randomDiagram();
            const p = U.pick(g.paths);
            const answers = g.decisions.map(d => {
              const c = p.choices.find(x => x.g === d);
              const lab = c ? c.ans : U.pick(g.edges.filter(e => e.a === d).map(e => e.label));
              return `“${esc(d.label)}” → <b>${lab}</b>`;
            });
            const right = `End event “${esc(p.end.label)}”`;
            const wrong = uniqBy(g.ends.filter(e => e.label !== p.end.label), e => e.label).map(e => ({ t: `End event “${esc(e.label)}”`, why: "Trace the answers in order: once a branch reaches an end event, later decisions are never reached." }))
              .concat([{ t: "No end event: the case waits at a gateway", why: "Every decision here has an answer, so the case keeps moving until an end event." },
                { t: "Every end event, because the process splits", why: "An exclusive (X) gateway sends each case down exactly one branch, so a case reaches one end event." }]).slice(0, 3);
            return Q.mc({
              q: diagramIntro(g) + `<p>For one case, the answers at the gateways would be: ${answers.join("; ")}. Where does this case finish?</p>`,
              right, rightWhy: `Following those answers: ${pathWords(p) || "no decisions"} → “${esc(p.end.label)}”.`, wrong,
              sol: S("Start at the start event and take only the branch matching each answer. Ignore answers for gateways the case never reaches.", `Route: ${p.nodes.filter(n => n.type === "task").map(n => esc(n.label)).join(" → ")} → <b>${esc(p.end.label)}</b>.`),
            });
          },
        },
        {
          name: "Count the handoffs",
          make() {
            const g = randomDiagram();
            const p = U.pick(g.paths.filter(x => handoffs(x) > 0)) || g.paths[0];
            const ans = handoffs(p);
            const lanesOn = new Set(p.nodes.map(n => n.lane)).size;
            const traps = trapsFor(ans, [
              { value: g.lanes.length - 1, why: "That assumes the work passes through each lane once in order; count actual arrows that cross a lane line on this path." },
              { value: lanesOn, why: "That counts lanes visited, not crossings. Work can cross back and forth." },
              { value: p.nodes.filter(n => n.type === "task").length, why: "That counts tasks; a handoff is only an arrow that crosses into another lane." },
            ]);
            const crossings = p.edges.filter(e => e.a.lane !== e.b.lane).map(e => `${g.lanes[e.a.lane]} → ${g.lanes[e.b.lane]} (into “${esc(e.b.label || e.b.type)}”)`);
            return Q.num({
              q: diagramIntro(g) + `<p>Follow the path where ${pathWords(p) || "every step runs in order"}. How many <b>handoffs</b> (arrows that cross from one lane into another) does it contain${p.nodes.some(n => n.type === "and") ? ", counting both parallel branches" : ""}?</p>`,
              answer: ans, kind: "count", traps,
              sol: S("A handoff is a sequence-flow arrow whose two ends are in different lanes. Trace the path and tick each crossing.", crossings.length ? `Crossings:${ul(crossings)}` : "No arrow on this path crosses a lane line.", `Total: <b>${ans}</b>.`),
            });
          },
        },
        {
          name: "Which tasks run on this path?",
          make() {
            const g = randomDiagram();
            const p = U.pick(g.paths.filter(x => g.tasks.some(t => !x.nodes.includes(t))));
            const on = g.tasks.filter(t => p.nodes.includes(t)), off = g.tasks.filter(t => !p.nodes.includes(t));
            const nOn = Math.min(on.length, U.randInt(2, 4)), nOff = Math.min(off.length, 5 - nOn);
            const opts = U.sample(on, nOn).map(t => ({ t: esc(t.label), ok: true, why: "This task lies on the route the answers send the case down." }))
              .concat(U.sample(off, nOff).map(t => ({ t: esc(t.label), ok: false, why: "This task is on a different branch, which this case does not take." })));
            return Q.multi({
              q: diagramIntro(g) + `<p>A case takes the path where ${pathWords(p) || "no decisions occur"}. Select <b>every</b> task it performs.</p>`, options: opts,
              sol: S("Trace from the start event, taking only the branch that matches each answer; a + split means both branches run.", `Tasks on this path: ${on.map(t => esc(t.label)).join(" → ")}.`),
            });
          },
        },
        {
          name: "Read the parallel gateway",
          make() {
            const g = randomDiagram({ and: true });
            const sp = g.nodes.find(n => n.type === "and" && n.join);
            const [a, b] = g.edges.filter(e => e.a === sp).map(e => esc(e.b.label));
            return Q.mc({
              q: diagramIntro(g) + `<p>What does the + diamond before “${a}” and “${b}” mean?</p>`,
              right: `Every case does both “${a}” and “${b}”, at the same time; the second + waits until both are finished`,
              rightWhy: "A parallel gateway splits the flow into branches that all run, and the parallel join synchronizes them.",
              wrong: [{ t: `Each case does either “${a}” or “${b}”, depending on a decision`, why: "That is an exclusive (X) gateway. A + gateway is not a decision." },
                { t: `“${a}” must be completely finished before “${b}” can start`, why: "Strict order would be drawn as two tasks in sequence, with no gateway." },
                { t: "It adds one more possible path to the path count", why: "Parallel branches are not alternatives; they don't add paths." }],
              sol: S("Look at the symbol inside the diamond: X means one branch, + means all branches.", "+ = parallel: both tasks run for every case, and the + join waits for both."),
            });
          },
        },
      ],
    }),

    /* ---------------- 6 · Analysis ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-improve",
      name: "ITO to BPMN, bottlenecks, metrics and controls",
      blurb: "Translate ITO into BPMN, find the bottleneck in a step-time table, compute cycle time, pick metrics and control points, and debrief the library case.",
      variants: [
        ...pickV(ibSV, [[0, "ITO → BPMN: sort elements"]]),
        {
          name: "Find the bottleneck",
          make() {
            const T2 = timeTable();
            const st = T2.p.steps;
            const others = U.sample(st.map((s, i) => i).filter(i => i !== T2.b && i !== T2.w), 2);
            return Q.mc({
              q: T2.html + "<p>Where is work most likely piling up (the bottleneck)?</p>",
              right: st[T2.b], rightWhy: `Work waits ${T2.waits[T2.b]} ${T2.p.unit} in front of it, by far the longest queue.`,
              wrong: [{ t: st[T2.w], why: `It has the longest work time (${T2.work[T2.w]} ${T2.p.unit}) but little waiting in front of it, so work isn't piling up there.` }]
                .concat(others.map(i => ({ t: st[i], why: `Only ${T2.waits[i]} ${T2.p.unit} of waiting before it; no big queue forms.` }))),
              sol: S("A bottleneck is where work <em>waits</em> in a queue, not necessarily where the work itself takes longest.", `Largest wait: <b>${st[T2.b]}</b> (${T2.waits[T2.b]} ${T2.p.unit}).`),
            });
          },
        },
        {
          name: "Compute cycle time",
          make() {
            const T2 = timeTable();
            const ans = T2.sumWait + T2.sumWork;
            return Q.num({
              q: T2.html + `<p>What is the total cycle time for one case, from the start of the first step to the end of the last (in ${T2.p.unit})?</p>`,
              answer: ans, unit: T2.p.unit, kind: "count",
              traps: trapsFor(ans, [{ value: T2.sumWork, why: "That is only work time. Cycle time also includes all the waiting." }, { value: T2.sumWait, why: "That is only waiting time; add the work time too." },
                { value: T2.waits[T2.b] + T2.work[T2.b], why: "That is just the bottleneck step; cycle time covers every step." }]),
              sol: S("Cycle time = total elapsed time = every wait + every piece of work.", `Waits: ${T2.waits.join(" + ")} = ${T2.sumWait}. Work: ${T2.work.join(" + ")} = ${T2.sumWork}.`, `Cycle time = ${T2.sumWait} + ${T2.sumWork} = <b>${ans} ${T2.p.unit}</b>.`),
            });
          },
        },
        {
          name: "Share of time spent waiting",
          make() {
            const T2 = timeTable();
            const tot = T2.sumWait + T2.sumWork, ans = U.round(T2.sumWait / tot * 100, 1);
            return Q.num({
              q: T2.html + "<p>What percentage of the total cycle time is <b>waiting</b> (non-value-adding time)? Round to one decimal place.</p>",
              answer: ans, unit: "%", tol: 0.1,
              traps: trapsFor(ans, [{ value: U.round(T2.sumWork / tot * 100, 1), why: "That is the share of work time, not waiting time." },
                { value: U.round(T2.sumWait / T2.sumWork * 100, 1), why: "Divide by the total cycle time (wait + work), not by work time alone." }]),
              sol: S("Waiting share = total waiting ÷ total cycle time × 100.", `${T2.sumWait} ÷ (${T2.sumWait} + ${T2.sumWork}) × 100 = <b>${ans}%</b>. Big waiting shares point to where a To-Be design can cut time.`),
            });
          },
        },
        {
          name: "Choose a metric",
          make() {
            const e = U.rotate("ch4-metric", METRIC);
            return Q.mc({ q: `<p>${e.q}</p>`, right: e.right, rightWhy: e.rightWhy, wrong: e.wrong,
              sol: S("A good metric measures the specific step or outcome you care about, as directly as possible.", `Best: <b>${e.right}</b>. ${e.rightWhy}`) });
          },
        },
        {
          name: "Select the control points",
          make() {
            const k = U.randInt(1, 4);
            const opts = U.deal("ch4-ctl-y", CONTROL.filter(c => c.ok), k).concat(U.deal("ch4-ctl-n", CONTROL.filter(c => !c.ok), 5 - k));
            return Q.multi({ q: "<p>Select <b>every</b> step that is a <b>control point</b>.</p>", options: opts,
              sol: S("A control point <em>checks</em> something (identity, completeness, accuracy, authorization) before the process continues.", "Ordinary work steps and notifications transform or inform; they don't verify.") });
          },
        },
        {
          name: "Count paths from a description",
          make() {
            const L = libNarrative();
            const traps = trapsFor(L.answer, [
              { value: L.decisions, why: "That counts decisions. Each “process ends” branch adds one path; each branch that rejoins doubles the paths through it." },
              { value: L.exits + 1, why: "That counts end events; several paths can finish at the same end event (checked out)." },
              { value: L.decisions + 1, why: "Adding one per decision undercounts: two rejoining decisions in a row give 2 × 2 combinations, not 2 + 1." },
              { value: L.parallel ? L.answer + 1 : -1, why: "The “at the same time” steps are a parallel block: both always happen, so they add no paths." },
            ]);
            return Q.num({
              q: `<p>A student drew the library borrowing process from this description:</p><div class="example">${ul(L.lines)}</div><p>How many distinct paths run from the start event to an end event?</p>`,
              answer: L.answer, kind: "count", traps,
              sol: S("Process the decisions in order. A branch that ends the process adds one path; a branch that rejoins doubles the number of ways through.",
                `Early exits: ${L.exits} path${L.exits > 1 ? "s" : ""}. Reaching checkout: 2<sup>${L.rejoin}</sup> = ${Math.pow(2, L.rejoin)} combination${L.rejoin ? "s" : ""} of the rejoining decisions${L.parallel ? " (the parallel steps add none)" : ""}.`,
                `Total: ${L.exits} + ${Math.pow(2, L.rejoin)} = <b>${L.answer}</b>.`),
            });
          },
        },
        K.conceptVariant("Library case debrief", "ch4-lib", LIB_AUTO),
        {
          name: "ITO → BPMN: which element?",
          make() {
            const e = U.pick(IB);
            return Q.mc({
              q: `<p>You are converting an ITO analysis into a BPMN diagram. How should this be drawn?</p><p>“${e.t}”</p>`,
              right: e.cat, rightWhy: e.why,
              wrong: IB_CATS.filter(c => c !== e.cat).slice(0, 4).map(c => ({ t: c, why: `${c} is for ${IB_DEF[c]}. ${e.why}` })),
              keepOrder: IB_CATS,
              sol: S("Input/trigger → start event; transformation → task; decision → gateway; output → end event; feedback → intermediate event or loop.", `<b>${e.cat}</b>: ${e.why}`),
            });
          },
        },
      ],
    }),

    /* ---------------- 7 · As-Is / To-Be ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-tobe",
      name: "As-Is, To-Be and gap analysis",
      blurb: "Tell current from future processes, pick a documentation technique, name To-Be goals and close gaps with the right action.",
      variants: [
        ...pickV(astoSV, [[0, "As-Is or To-Be?"]]),
        {
          name: "Choose a documentation technique",
          make() {
            const e = U.rotate("ch4-doc", DOC);
            return Q.mc({
              q: `<p>An analyst is documenting an As-Is process. ${e.t}</p><p>Which technique fits best?</p>`, right: e.right, rightWhy: e.why,
              wrong: DOC_OPTS.filter(o => o !== e.right).map(o => ({ t: o, why: `Not the best fit: ${DOC_WHY[o]}.` })),
              keepOrder: DOC_OPTS,
              sol: S("Interviews = one person's account; observation = what really happens; document review = forms, reports, logs; workshop = all roles together.", `<b>${e.right}</b>: ${e.why}`),
            });
          },
        },
        ...pickV(goalSV, [[1, "To-Be goal: pick the example"], [4, "To-Be goal: name it"]]),
        {
          name: "Close the gap",
          make() {
            const e = U.rotate("ch4-gap", GAP);
            return Q.mc({
              q: `<p>One row of a gap analysis:</p>${tbl(["Element", "As-Is", "To-Be"], [[e.el, e.as, e.to]])}<p>Which action best closes this gap?</p>`,
              right: e.right, rightWhy: "It directly changes what is needed to move from the As-Is value to the To-Be value.", wrong: e.wrong,
              sol: S("Look at exactly what differs between the As-Is and To-Be columns, then pick the action that changes that thing.", `<b>${e.right}</b>.`),
            });
          },
        },
        {
          name: "Size the improvement",
          make() {
            const e = U.rotate("ch4-pct", PCT);
            const a = U.pick(e.as), b = U.pick(e.to.filter(x => x < a));
            const ans = U.round((a - b) / a * 100, 1);
            const u = e.unit === "%" ? "%" : " " + e.unit;
            return Q.num({
              q: `<p>A gap analysis shows the ${e.el} falling from <b>${a}${u}</b> (As-Is) to <b>${b}${u}</b> (To-Be). By what percentage does the To-Be reduce it? (Round to one decimal place.)</p>`,
              answer: ans, unit: "%", tol: 0.1,
              traps: trapsFor(ans, [{ value: a - b, why: "That is the absolute drop. A percentage reduction divides the drop by the As-Is value." },
                { value: U.round(b / a * 100, 1), why: "That is what remains as a share of the As-Is, not the reduction." },
                { value: U.round((a - b) / b * 100, 1), why: "Divide by the starting (As-Is) value, not the To-Be value." }]),
              sol: S("Percentage reduction = (As-Is − To-Be) ÷ As-Is × 100. The As-Is is the baseline, which is one reason it must be documented first.", `(${a} − ${b}) ÷ ${a} × 100 = <b>${ans}%</b>.`),
            });
          },
        },
        K.conceptVariant("Descriptive, not prescriptive", "ch4-desc", DESC),
        K.tfVariant("As-Is / To-Be: true or false", "ch4-tobetf", TOBE_TF),
      ],
    }),

    /* ---------------- 8 · Change management ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch4-change",
      name: "Change management and automation",
      blurb: "Diagnose resistance, training gaps and inertia, choose the practice that fixes each, and judge what to automate.",
      variants: [
        ...pickV(barSV, [[0, "Barriers: sort"], [4, "Barrier: name it"]]),
        K.conceptVariant("Diagnose and fix", "ch4-fix", FIX),
        {
          name: "Select the good practices",
          make() {
            const k = U.randInt(1, 4);
            const opts = U.deal("ch4-pr-y", PRACTICES.filter(p => p.ok), k).concat(U.deal("ch4-pr-n", PRACTICES.filter(p => !p.ok), 5 - k));
            return Q.multi({ q: "<p>A company is rolling out a redesigned process. Select <b>every</b> action that is good change-management practice.</p>", options: opts,
              sol: S("Good practice: involve the frontline, explain why, train well, celebrate early wins, and fix policies/incentives that still reward the old way.", "Anything that excludes people, skips training or leaves old incentives in place feeds a barrier.") });
          },
        },
        {
          name: "What should be automated?",
          make() {
            const e = U.rotate("ch4-auto", AUTO);
            return Q.mc({ q: `<p>${e.q}</p>`, right: e.right, rightWhy: e.rightWhy, wrong: e.wrong,
              sol: S("Automation suits rules-based, repetitive steps; judgment, exceptions and relationships stay with people.", `<b>${e.right}</b>. ${e.rightWhy}`) });
          },
        },
        K.conceptVariant("Act, pause or investigate?", "ch4-act", ACT),
        K.tfVariant("Change: true or false", "ch4-chtf", CHANGE_TF),
      ],
    }),
  ];

  STUDY.registerUnit(C, {
    id: "ch4", order: 4,
    title: "Chapter 4 · Process Analysis and Mapping with ITO and BPMN",
    short: "Ch 4 · ITO & BPMN",
    description: "Break processes into inputs, transformations, outputs and feedback, read and build BPMN diagrams, find bottlenecks and controls, and plan an As-Is to To-Be change.",
    notes, flashcards, cues, generators,
  });
})();
