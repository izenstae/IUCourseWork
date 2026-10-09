/* ============================================================
 * BUS K201 · Chapter 10 · Querying for Answers You Can Defend
 * Purpose-driven SELECT / FROM / WHERE / ORDER BY, written vs.
 * execution order, WHERE operators, calculated columns and aliases,
 * INNER vs LEFT JOIN, COUNT / SUM / AVG with GROUP BY, filtering
 * before aggregating, and documenting + reporting a defensible answer.
 * Most practice builds a fresh small table every time and asks the
 * student to run the query in their head. SQL Server dialect.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const S = K.S;
  const C = "bus-k201";

  /* ---------- rendering helpers ---------- */
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const CODE = 'style="display:block;padding:8px 12px;margin:6px 0;line-height:1.6;font-size:.9em;overflow-x:auto;white-space:nowrap"';
  /* a multi-line SQL block; leading spaces become indentation */
  const sql = (...lines) => `<code ${CODE}>${lines.flat().filter(l => l !== null && l !== false).map(l => esc(l).replace(/^ +/, m => "&nbsp;".repeat(m.length))).join("<br>")}</code>`;
  const ic = s => `<code>${esc(s)}</code>`;
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const TH = 'style="text-transform:none;letter-spacing:0"';
  const cents = x => Math.round(x * 100) / 100;
  const m2 = v => v.toFixed(2);
  function cell(v, c) {
    if (v === null || v === void 0) return "<i>NULL</i>";
    if (c && c.money && typeof v === "number") return m2(v);
    return esc(String(v));
  }
  /* table(caption, [{k, h?, money?, get?}], rows) */
  function table(cap, cols, rows) {
    return `<div class="tbl-wrap"><table class="tbl">${cap ? `<caption style="text-align:left;font-weight:600;padding:4px 0">${cap}</caption>` : ""}` +
      `<thead><tr>${cols.map(c => `<th ${TH}>${c.h || c.k}</th>`).join("")}</tr></thead>` +
      `<tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${cell(c.get ? c.get(r) : r[c.k], c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  const ord = k => ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][k - 1];
  const dedupeTraps = (answer, traps) => {
    const out = [];
    for (const t of traps) {
      if (!Number.isFinite(t.value)) continue;
      if (Math.abs(t.value - answer) <= Math.max(0.011, Math.abs(answer) * 0.01)) continue;
      if (out.some(o => Math.abs(o.value - t.value) < 0.005)) continue;
      out.push(t);
    }
    return out;
  };

  /* ---------- tiny WHERE engine (three-valued logic, like SQL) ---------- */
  const col = (name, get) => ({ name, get: get || (r => r[name]) });
  const lit = v => typeof v === "string" ? `'${v}'` : String(v);
  const W = {
    cmp: (c, op, v) => ({ t: "cmp", c, op, v }),
    btw: (c, lo, hi) => ({ t: "btw", c, lo, hi }),
    like: (c, pat, neg) => ({ t: "like", c, pat, neg: !!neg }),
    isnull: (c, neg) => ({ t: "null", c, neg: !!neg }),
    and: (a, b) => ({ t: "and", a, b }),
    or: (a, b) => ({ t: "or", a, b }),
    not: a => ({ t: "not", a }),
  };
  function txt(n) {
    switch (n.t) {
      case "cmp": return `${n.c.name} ${n.op} ${lit(n.v)}`;
      case "btw": return `${n.c.name} BETWEEN ${n.lo} AND ${n.hi}`;
      case "like": return `${n.c.name} ${n.neg ? "NOT LIKE" : "LIKE"} ${lit(n.pat)}`;
      case "null": return `${n.c.name} IS ${n.neg ? "NOT " : ""}NULL`;
      case "and": return `${txt(n.a)} AND ${txt(n.b)}`;
      case "or": return `${txt(n.a)} OR ${txt(n.b)}`;
      case "not": return `NOT (${txt(n.a)})`;
    }
    return "";
  }
  function likeRe(p) {
    const body = p.split("").map(ch => ch === "%" ? ".*" : ch === "_" ? "." : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
    return new RegExp("^" + body + "$", "i");
  }
  /* returns true / false / null (unknown) */
  function ev(n, r) {
    switch (n.t) {
      case "cmp": {
        const x = n.c.get(r);
        if (x === null) return null;
        switch (n.op) {
          case "=": return x === n.v;
          case "<>": return x !== n.v;
          case ">": return x > n.v;
          case "<": return x < n.v;
          case ">=": return x >= n.v;
          case "<=": return x <= n.v;
        }
        return null;
      }
      case "btw": { const x = n.c.get(r); return x === null ? null : (x >= n.lo && x <= n.hi); }
      case "like": { const x = n.c.get(r); if (x === null) return null; const m = likeRe(n.pat).test(x); return n.neg ? !m : m; }
      case "null": { const x = n.c.get(r); return n.neg ? x !== null : x === null; }
      case "and": { const a = ev(n.a, r), b = ev(n.b, r); if (a === false || b === false) return false; if (a === null || b === null) return null; return true; }
      case "or": { const a = ev(n.a, r), b = ev(n.b, r); if (a === true || b === true) return true; if (a === null || b === null) return null; return false; }
      case "not": { const a = ev(n.a, r); return a === null ? null : !a; }
    }
    return null;
  }
  const passes = (n, r) => ev(n, r) === true;
  function colsOf(n, acc = []) {
    if (n.c && !acc.some(c => c.name === n.c.name)) acc.push(n.c);
    if (n.a) colsOf(n.a, acc);
    if (n.b) colsOf(n.b, acc);
    return acc;
  }
  function usesNullish(n) { return ["cmp", "btw", "like"].includes(n.t) || (n.a && usesNullish(n.a)) || (n.b && usesNullish(n.b)); }
  /* the same clause with boundaries flipped (>= ↔ >, BETWEEN → exclusive) */
  function flipBounds(n) {
    switch (n.t) {
      case "cmp": return { ...n, op: { ">=": ">", ">": ">=", "<=": "<", "<": "<=" }[n.op] || n.op };
      case "btw": return W.and(W.cmp(n.c, ">", n.lo), W.cmp(n.c, "<", n.hi));
      case "and": case "or": return { ...n, a: flipBounds(n.a), b: flipBounds(n.b) };
      case "not": return { ...n, a: flipBounds(n.a) };
    }
    return n;
  }
  function opHints(n) {
    const seen = new Set();
    (function walk(x) {
      if (x.t === "cmp") seen.add(x.op === "=" ? "eq" : x.op === "<>" ? "ne" : "rel");
      else seen.add(x.t);
      if (x.a) walk(x.a);
      if (x.b) walk(x.b);
    })(n);
    const H = {
      eq: "<b>=</b> keeps only exact matches.",
      ne: "<b>&lt;&gt;</b> keeps rows whose value is different. A NULL is not “different”; it is unknown, so NULL rows drop out.",
      rel: "<b>&gt;</b> and <b>&lt;</b> are strict; <b>&gt;=</b> and <b>&lt;=</b> include the boundary value itself.",
      btw: "<b>BETWEEN a AND b</b> is inclusive: both endpoints count.",
      like: "<b>LIKE</b> matches a pattern; <b>%</b> stands for any run of characters, so <code>'%@iu.edu'</code> means “ends with @iu.edu”. <b>NOT LIKE</b> keeps non-matches, but a NULL still drops out.",
      null: "<b>IS NULL</b> / <b>IS NOT NULL</b> are the only tests that find (or exclude) blanks.",
      and: "<b>AND</b> keeps a row only when both conditions are true.",
      or: "<b>OR</b> keeps a row when at least one condition is true.",
      not: "<b>NOT</b> flips true and false, but NOT of an unknown (NULL) comparison is still unknown, so that row stays out.",
    };
    return [...seen].map(k => H[k]).filter(Boolean);
  }

  /* ---------- randomised tables ---------- */
  const FIRST = ["Avery", "Blake", "Casey", "Devon", "Emery", "Finley", "Harper", "Jordan", "Kendall", "Logan", "Morgan", "Parker", "Quinn", "Riley", "Rowan", "Sawyer", "Taylor", "Reese"];
  const LAST = ["Adams", "Brooks", "Chen", "Diaz", "Evans", "Foster", "Garcia", "Hughes", "Ito", "Jensen", "Khan", "Lopez", "Miller", "Nguyen", "Owens", "Patel", "Reed", "Shah", "Turner", "Walsh"];
  const MAJORS = ["Finance", "Marketing", "Accounting", "Informatics", "Management"];
  const OTHER_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"];
  const PRICES = [12.5, 18, 22, 35, 48, 60, 75, 95, 120, 150];

  function mkCustomers() {
    for (let tries = 0; tries < 50; tries++) {
      const n = U.randInt(6, 8);
      const base = U.randInt(1, 8) * 100;
      const fs = U.sample(FIRST, n), ls = U.sample(LAST, n);
      const idx = U.shuffle([...Array(n).keys()]);
      const nonIU = new Set(idx.slice(0, U.randInt(2, 3)));
      const nullEmail = Math.random() < 0.35 ? idx[n - 1] : -1;
      const rows = fs.map((f, i) => ({
        CustomerID: base + i + 1,
        LastName: ls[i],
        SchoolEmail: i === nullEmail ? null : `${f.toLowerCase()}${ls[i][0].toLowerCase()}@${nonIU.has(i) ? U.pick(OTHER_DOMAINS) : "iu.edu"}`,
        GradYear: U.randInt(2024, 2028),
        Major: Math.random() < 0.22 ? null : U.pick(MAJORS),
      }));
      const majors = new Set(rows.map(r => r.Major).filter(x => x));
      if (majors.size >= 2 && rows.some(r => r.Major === null)) return rows;
    }
    return null;
  }
  function custConds(rows) {
    const E = col("SchoolEmail"), G = col("GradYear"), M = col("Major"), L = col("LastName");
    const majors = [...new Set(rows.map(r => r.Major).filter(x => x))];
    const y = U.randInt(2025, 2027);
    const [ma, mb] = U.sample(majors, 2);
    const letter = U.pick(rows).LastName[0];
    return [
      W.like(E, "%@iu.edu"), W.like(E, "%@iu.edu", true), W.cmp(G, ">=", y), W.cmp(G, "<", y),
      W.btw(G, y - 1, y), W.not(W.btw(G, y - 1, y)), W.cmp(M, "=", ma), W.cmp(M, "<>", ma),
      W.isnull(M), W.isnull(M, true), W.and(W.cmp(G, ">=", y), W.like(E, "%@iu.edu")),
      W.or(W.cmp(M, "=", ma), W.cmp(M, "=", mb)), W.like(L, letter + "%"),
      W.and(W.like(E, "%@iu.edu", true), W.isnull(M, true)), W.isnull(E),
    ];
  }
  function mkItems(opts = {}) {
    const n = opts.n || U.randInt(7, 8);
    const base = U.randInt(41, 79) * 100;
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ OrderID: base + i * 3 + U.randInt(0, 2), ProductID: U.randInt(11, 19), Quantity: U.randInt(1, 4), SalePrice: U.pick(PRICES) });
    const bad = U.sample([...Array(n).keys()], opts.bad != null ? opts.bad : U.randInt(1, 2));
    bad.forEach((i, k) => { rows[i].Quantity = k === 0 ? U.pick([-1, -2, -1]) : U.pick([0, -1]); });
    return rows;
  }
  function itemConds(rows) {
    const Qy = col("Quantity"), P = col("SalePrice");
    const LT = col("(Quantity * SalePrice)", r => (r.Quantity === null || r.SalePrice === null) ? null : cents(r.Quantity * r.SalePrice));
    const ps = [...new Set(rows.map(r => r.SalePrice))].sort((a, b) => a - b);
    const pMid = ps[Math.floor(ps.length / 2)] || 50;
    const pAt = U.pick(ps);
    const thr = U.pick([100, 150, 200]);
    return [
      W.cmp(Qy, "<", 1), W.cmp(Qy, ">", 0), W.btw(Qy, 1, 3), W.cmp(Qy, "<>", 1), W.cmp(P, ">", pMid),
      W.cmp(P, ">=", pAt), W.btw(P, 20, 75), W.and(W.cmp(Qy, ">=", 2), W.cmp(P, "<", pMid)),
      W.or(W.cmp(Qy, "<", 1), W.cmp(P, ">", pMid)), W.not(W.btw(Qy, 1, 3)), W.cmp(LT, ">", thr),
    ];
  }
  function mkReviews() {
    const n = U.randInt(7, 8);
    const base = U.randInt(2, 9) * 10;
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ ReviewID: base + i + 1, StoreID: U.randInt(1, 3), Rating: U.pick([1, 2, 3, 4, 5, 5, 4, 3]) });
    const idx = U.shuffle([...Array(n).keys()]);
    rows[idx[0]].Rating = U.pick([0, 6, 7, 9]);
    if (Math.random() < 0.5) rows[idx[1]].Rating = U.pick([0, 6, 8, -1]);
    if (Math.random() < 0.4) rows[idx[2]].Rating = null;
    return rows;
  }
  function revConds(rows) {
    const R = col("Rating"), St = col("StoreID");
    const s = U.pick(rows).StoreID;
    const s2 = U.pick([1, 2, 3].filter(x => x !== s));
    return [
      W.btw(R, 1, 5), W.not(W.btw(R, 1, 5)), W.or(W.cmp(R, "<", 1), W.cmp(R, ">", 5)), W.cmp(R, ">", 5),
      W.cmp(R, ">=", 4), W.cmp(St, "=", s), W.cmp(St, "<>", s), W.and(W.cmp(St, "=", s), W.cmp(R, ">=", 4)),
      W.isnull(R), W.isnull(R, true), W.or(W.cmp(St, "=", s), W.cmp(St, "=", s2)), W.cmp(R, "<=", 2),
    ];
  }
  const DATASETS = [
    () => { const rows = mkCustomers(); return { name: "dbo.CUSTOMERS", rows, key: "CustomerID", sel: "CustomerID, LastName, SchoolEmail",
      cols: [{ k: "CustomerID" }, { k: "LastName" }, { k: "SchoolEmail" }, { k: "GradYear" }, { k: "Major" }],
      label: r => `CustomerID ${r.CustomerID} (${r.LastName})`, conds: () => custConds(rows) }; },
    () => { const rows = mkItems(); return { name: "dbo.ORDER_ITEMS", rows, key: "OrderID", sel: "*",
      cols: [{ k: "OrderID" }, { k: "ProductID" }, { k: "Quantity" }, { k: "SalePrice", money: true }],
      label: r => `OrderID ${r.OrderID}`, conds: () => itemConds(rows) }; },
    () => { const rows = mkReviews(); return { name: "dbo.REVIEWS", rows, key: "ReviewID", sel: "ReviewID, StoreID, Rating",
      cols: [{ k: "ReviewID" }, { k: "StoreID" }, { k: "Rating" }],
      label: r => `ReviewID ${r.ReviewID}`, conds: () => revConds(rows) }; },
  ];
  const dsTable = ds => table(ds.name, ds.cols, ds.rows);
  function rowTrace(ds, n) {
    const cs = colsOf(n);
    return ul(ds.rows.map(r => {
      const v = ev(n, r);
      const vals = cs.map(c => `${esc(c.name)} = ${cell(c.get(r), { money: /Price/.test(c.name) })}`).join(", ");
      return `${ds.label(r)}: ${vals} → ${v === true ? "<b>kept</b>" : v === null ? "dropped (NULL makes the test unknown, not true)" : "dropped"}`;
    }));
  }
  /* pick a dataset + condition whose result is neither empty nor the whole table */
  function pickWhere(filter) {
    for (let t = 0; t < 80; t++) {
      const ds = U.pick(DATASETS)();
      if (!ds.rows) continue;
      const pool = ds.conds().filter(c => !filter || filter(c, ds));
      if (!pool.length) continue;
      const cond = U.pick(pool);
      const k = ds.rows.filter(r => passes(cond, r)).length;
      if (k >= 1 && k <= ds.rows.length - 1) return { ds, cond, k };
    }
    const ds = DATASETS[2]();
    const cond = W.btw(col("Rating"), 1, 5);
    return { ds, cond, k: ds.rows.filter(r => passes(cond, r)).length };
  }
  const whereQuery = (ds, cond, sel) => sql(`SELECT ${sel || ds.sel}`, `FROM ${ds.name}`, `WHERE ${txt(cond)};`);

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "From business question to purpose-driven query",
      lo: "Write purpose-driven SQL with SELECT, FROM, WHERE and ORDER BY that returns only the rows and columns the question needs.",
      html: `<p>Every number an analyst reports starts life as a <b>question</b>, and the query is that question translated into SQL. The four core clauses each answer one part of it:</p>
<ul>
<li><b>SELECT</b>: which columns (fields) appear in the answer. Calculated columns go here too.</li>
<li><b>FROM</b>: which table the rows come from, written with its schema prefix, e.g. ${ic("dbo.CUSTOMERS")}.</li>
<li><b>WHERE</b>: which rows qualify. This is the filter, and it runs over the <em>entire</em> table, not a sample you eyeballed.</li>
<li><b>ORDER BY</b>: how the result is sorted. Ascending (ASC) is the default; add DESC for largest-first. List two columns to sort by the first and break ties with the second.</li>
</ul>
<p>${ic("SELECT *")} (every column) is fine while you explore a table. A query you share should return only the fields the question needs: a list of non-compliant email addresses needs ID, name and email, not each student's major and graduation year. SQL Server does <b>not</b> promise any particular row order unless you write ORDER BY, and ${ic("SELECT TOP (5)")} keeps only the first five rows of whatever order you asked for.</p>
${sql("-- Business question: which customer records use a non-IU email address?", "-- Business requirement: every customer record must use an @iu.edu address (student data policy).", "SELECT CustomerID, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '%@iu.edu'", "ORDER BY LastName;")}
<div class="keyidea"><b>Key idea.</b> “The query ran” is not the standard. The standard is whether the answer is true and complete for the question asked, and the person who reports it is accountable for that.</div>
<div class="example"><b>Example.</b> A manager asks, “Which line items have quantities that couldn't come from a normal purchase?” The query is ${ic("SELECT * FROM dbo.ORDER_ITEMS WHERE Quantity < 1 ORDER BY SalePrice DESC;")}. ${ic("< 1")} catches both zero and negatives, and sorting by price puts the costliest problems on top. The row count tells you how many line items break that one rule across the whole table. It says nothing about other kinds of problems.</div>
<div class="trap"><b>Common trap.</b> Treating the row count as a verdict on the whole data set. Seven rows with ${ic("Quantity < 1")} means seven quantity violations, not “the rest of the data is clean.” Prices, emails and links between tables need their own queries.</div>`,
      gens: ["k201-ch10-write", "k201-ch10-where"],
    },
    {
      title: "Written order vs. execution order",
      lo: "Explain why SQL runs clauses in a different order than you write them, and use that to diagnose errors.",
      html: `<p>You <b>write</b> a query in this order: <b>SELECT → FROM → (JOIN … ON) → WHERE → GROUP BY → ORDER BY</b>. The database <b>runs</b> it in a different order:</p>
<p style="text-align:center"><b>FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY</b></p>
<p>Read the second line as a story: first find the table(s), join them, throw out the rows that fail the filter, group what is left, <em>then</em> compute the output columns, and finally sort them. Three practical rules follow:</p>
<ol>
<li><b>Filter first, then total.</b> Any SUM or COUNT only sees rows that survived WHERE.</li>
<li><b>WHERE cannot use a SELECT alias.</b> When WHERE runs, the alias does not exist yet. Repeat the full calculation in WHERE instead.</li>
<li><b>ORDER BY can use the alias.</b> It runs after SELECT, so the label is already defined.</li>
</ol>
${sql("SELECT OrderID, Quantity, SalePrice,", "       (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE (Quantity * SalePrice) > 200   -- not WHERE LineTotal > 200", "ORDER BY LineTotal DESC;           -- alias is fine here")}
<div class="keyidea"><b>Key idea.</b> When SQL Server reports <i>Invalid column name 'LineTotal'</i> for a column you clearly defined, ask which clause used it. If WHERE (or GROUP BY) did, it ran before SELECT created the name.</div>
<div class="example"><b>Example.</b> Building “from the source outward” follows execution order. Type ${ic("FROM dbo.ORDER_ITEMS")} first, then go back above it and write the SELECT list. You have thought about where the data lives before choosing columns, and IntelliSense now knows which table's columns to suggest.</div>
<div class="trap"><b>Common trap.</b> Trying to fix the alias error by moving WHERE below ORDER BY. Written order is fixed (WHERE always comes before ORDER BY). The fix is to repeat the calculation, not to rearrange clauses.</div>`,
      gens: ["k201-ch10-order", "k201-ch10-calc"],
    },
    {
      title: "Filtering with WHERE operators",
      lo: "Use comparison, range, pattern and null-check operators, combined with AND / OR / NOT, to find every row that breaks a rule.",
      html: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th ${TH}>Operator</th><th ${TH}>Meaning</th><th ${TH}>Example</th></tr></thead><tbody>
<tr><td>=</td><td>exact match</td><td>${ic("WHERE StoreID = 1")}</td></tr>
<tr><td>&lt;&gt;</td><td>not equal (exclude)</td><td>${ic("WHERE StoreID <> 3")}</td></tr>
<tr><td>&gt; &lt; &gt;= &lt;=</td><td>greater / less; the = versions include the boundary</td><td>${ic("WHERE GradYear >= 2026")}</td></tr>
<tr><td>BETWEEN</td><td>inclusive range (both ends count)</td><td>${ic("WHERE Rating BETWEEN 1 AND 5")}</td></tr>
<tr><td>LIKE / NOT LIKE</td><td>pattern; % = any characters</td><td>${ic("WHERE SchoolEmail NOT LIKE '%@iu.edu'")}</td></tr>
<tr><td>IS NULL / IS NOT NULL</td><td>blank / not blank</td><td>${ic("WHERE Major IS NULL")}</td></tr>
<tr><td>AND / OR / NOT</td><td>both true / either true / reverse</td><td>${ic("WHERE Rating < 1 OR Rating > 5")}</td></tr>
</tbody></table></div>
<p>Text values go in single quotes (${ic("'Finance'")}); numbers do not. Without a %, LIKE compares against the whole value, so ${ic("LIKE '@iu.edu'")} matches only a value that is literally “@iu.edu”.</p>
<p><b>NULL means “unknown”.</b> Any comparison with a NULL (=, &lt;&gt;, &gt;, BETWEEN, LIKE…) comes out <em>unknown</em>, and WHERE only keeps rows where the test is <em>true</em>. So ${ic("WHERE Major <> 'Finance'")} silently skips students with no major, and ${ic("WHERE Major = NULL")} returns nothing at all. Use IS NULL.</p>
<div class="keyidea"><b>Key idea.</b> Turn the business rule into a test, then flip it to find violators: rule “ratings are 1–5” → violators ${ic("WHERE NOT (Rating BETWEEN 1 AND 5)")} or ${ic("WHERE Rating < 1 OR Rating > 5")}.</div>
<div class="example"><b>Example.</b> Reviews rated 0, 3, 5, 7 and NULL. ${ic("BETWEEN 1 AND 5")} keeps 3 and 5 (5 counts, inclusive). ${ic("Rating < 1 OR Rating > 5")} keeps 0 and 7. The NULL row appears in <em>neither</em> list, so a third query (${ic("IS NULL")}) is needed to account for every row.</div>
<div class="trap"><b>Common trap.</b> Writing ${ic("Rating < 1 AND Rating > 5")}. No number is below 1 and above 5 at the same time, so the query runs and returns zero rows. That looks like “no problems” when it is really a logic error.</div>`,
      gens: ["k201-ch10-where"],
    },
    {
      title: "Calculated columns and aliases",
      lo: "Create calculated columns with arithmetic and AS, and use them to measure the size of a problem.",
      html: `<p>A <b>calculated column</b> is an expression in the SELECT list, computed for each row as the query runs: ${ic("(Quantity * SalePrice) AS LineTotal")} or ${ic("(p.BasePrice - oi.SalePrice) AS PriceDifference")}. <b>AS</b> gives it a readable label (an <b>alias</b>). Nothing in the database changes. The column exists only in this result.</p>
<p>Aliases also shorten table names: ${ic("FROM dbo.ORDER_ITEMS oi")} lets you write ${ic("oi.SalePrice")}, which matters once two tables share column names.</p>
<p>Calculations turn “there are bad rows” into “here is what they cost.” A line with Quantity −1 and SalePrice $60 contributes −$60 to revenue. Adding up Quantity × SalePrice over the problem rows gives the dollar effect.</p>
${sql("-- Business question: which products sold well below their catalog price?", "-- Business requirement: no sale may be more than $25 below BasePrice without authorization.", "SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", "WHERE (p.BasePrice - oi.SalePrice) > 25", "ORDER BY PriceDifference DESC;")}
<div class="keyidea"><b>Key idea.</b> Subtraction order carries meaning. BasePrice − SalePrice is positive when the item sold <em>below</em> catalog. Reverse it and every discount looks negative, so a “&gt; 25” filter finds nothing.</div>
<div class="example"><b>Example.</b> BasePrice $80, SalePrice $50 → PriceDifference 30 → flagged (30 &gt; 25). BasePrice $80, SalePrice $55 → 25 → <em>not</em> flagged, because 25 is not greater than 25. Whether the rule says “more than” or “at least” decides which operator you use.</div>
<div class="trap"><b>Common trap.</b> Believing AS creates or saves a column in the table. It only labels output. And because WHERE runs before SELECT, the label cannot be used in WHERE.</div>`,
      gens: ["k201-ch10-calc", "k201-ch10-order"],
    },
    {
      title: "Joining tables: INNER JOIN vs. LEFT JOIN",
      lo: "Combine tables with INNER JOIN and LEFT JOIN, and choose the one that matches the question (matched records vs. gaps).",
      html: `<p>A join lines up rows from two tables using an <b>ON</b> condition, usually the primary key of one table equal to the foreign key in the other: ${ic("ON o.CustomerID = c.CustomerID")}.</p>
<ul>
<li><b>INNER JOIN</b> keeps only rows that match in <em>both</em> tables: complete, matched records. A row with no partner simply disappears.</li>
<li><b>LEFT JOIN</b> keeps <em>every</em> row of the left (first-named) table. Where there is no match, the right table's columns come back NULL: everything, including the gaps.</li>
</ul>
<p>That NULL is a signal you can filter on. <b>LEFT JOIN + WHERE right.key IS NULL</b> returns exactly the unmatched rows: products that never sold, customers who never ordered, orders that point to a customer who doesn't exist (<b>orphaned records</b>).</p>
${sql("-- Business question: which catalog products have no sales records?", "-- Business requirement: every active catalog product should have at least one sale.", "SELECT p.ProductID, p.ProductName, p.BasePrice, p.StoreID, oi.OrderID", "FROM dbo.PRODUCTS p", "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", "WHERE oi.OrderID IS NULL", "ORDER BY p.StoreID, p.BasePrice DESC;")}
<div class="keyidea"><b>Key idea.</b> Orphans are invisible to INNER JOIN. If a question is about what is <em>missing</em>, you need a LEFT JOIN with the table you want to keep on the left.</div>
<div class="example"><b>Example.</b> Counting products per store with an INNER JOIN to STORES gives store totals that add up to 18, yet ${ic("SELECT COUNT(*) FROM dbo.PRODUCTS")} says 20. Two products carry a StoreID that matches no store, and the INNER JOIN dropped them without any warning. A LEFT JOIN from PRODUCTS shows them with a NULL store name. A correct-looking total is not the same as a complete one.</div>
<div class="trap"><b>Common trap.</b> Hunting for orphaned orders with an INNER JOIN plus ${ic("WHERE c.CustomerID IS NULL")}. The INNER JOIN already threw the orphans away, so the query returns zero rows, the opposite of what was asked. Also watch direction: ORDERS LEFT JOIN CUSTOMERS finds orphan orders; CUSTOMERS LEFT JOIN ORDERS finds customers with no orders.</div>`,
      gens: ["k201-ch10-joins"],
    },
    {
      title: "Summarizing with COUNT, SUM, AVG and GROUP BY",
      lo: "Summarize records with COUNT, SUM and AVG, grouped with GROUP BY, and predict how NULLs and bad rows change the results.",
      html: `<ul>
<li><b>COUNT(*)</b> counts every row in the group, NULLs included. <b>COUNT(column)</b> counts only rows where that column is not NULL.</li>
<li><b>SUM(expression)</b> adds values, e.g. ${ic("SUM(oi.Quantity * oi.SalePrice)")} for revenue. <b>AVG(column)</b> averages, e.g. ${ic("AVG(oi.SalePrice)")}. Both skip NULLs: AVG divides by the number of non-NULL values, not by the row count.</li>
<li><b>GROUP BY</b> collapses rows into one row per group, such as one total per store.</li>
</ul>
<p><b>The GROUP BY rule:</b> every item in the SELECT list must be either inside an aggregate or listed in GROUP BY. If you show ${ic("s.StoreName")} next to ${ic("COUNT(o.OrderID)")}, StoreName must be in GROUP BY. Otherwise SQL Server cannot tell which of a group's many values to print and raises an error.</p>
${sql("-- Business question: how many orders has each storefront taken?", "-- Business requirement: every order is counted under the storefront that placed it.", "SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "GROUP BY s.StoreName", "ORDER BY TotalOrders DESC;")}
<div class="keyidea"><b>Key idea.</b> Aggregates tally whatever rows reach them, valid or not. COUNT counts records without judging their quality, and a single Quantity of −1 quietly pulls a SUM down.</div>
<div class="example"><b>Example.</b> Store A has lines worth $120, $90 and one return-looking line of −1 × $60. ${ic("SUM(Quantity * SalePrice)")} reports $150. With ${ic("WHERE Quantity > 0")} it reports $210. Neither number is “the” answer until you know whether −1 is a real return or a data error.</div>
<div class="trap"><b>Common trap.</b> Assuming AVG divides by every row. With prices 40, 60 and NULL, AVG is 50 (100 ÷ 2), not 33.33 (100 ÷ 3). Likewise COUNT(SalePrice) is 2 but COUNT(*) is 3.</div>`,
      gens: ["k201-ch10-agg"],
    },
    {
      title: "Answers you can defend: filter, compare, disclose",
      lo: "Decide when to filter for data quality before aggregating, and report a clean figure with what was removed and what it changed.",
      html: `<p>A query can run without error and still mislead, because it quietly included records nobody verified. The defensible routine has three steps:</p>
<ol>
<li><b>Run the all-records version</b>: the total exactly as the data stands.</li>
<li><b>Run the clean version</b>: the same query with a WHERE that removes the questionable rows (for example ${ic("WHERE Quantity > 0")}). Filtering <em>before</em> aggregating is a data-integrity decision, so make it on purpose and know the business process first.</li>
<li><b>Report the difference</b>: the clean figure, plus what you removed, why, and how much it changed the result.</li>
</ol>
<p>Context decides what counts as “questionable.” Some businesses record returns as negative quantities. The case company in this chapter does not, so its negative quantities are errors. Understand the process before you judge a value. Investigate results too: an “unsold products” list can mix a real product nobody bought (a <em>business performance</em> issue for the sales team) with a product whose StoreID points to no store (a <em>data integrity</em> issue for whoever maintains the catalog). They need different responses.</p>
<div class="keyidea"><b>Key idea.</b> Reporting a clean number without saying what you removed is just as misleading as reporting a dirty one. Give both numbers, the rule you applied and the size of the gap.</div>
<div class="example"><b>Example.</b> “Revenue for the period is $48,310 from verified line items. I excluded 7 line items with zero or negative quantities (company policy does not record returns that way). Including them would lower the total by $415.”</div>
<div class="trap"><b>Common trap.</b> Deleting the bad rows from the table so the report “comes out right.” The analyst's job is to filter in the query and disclose. Fixing source records is a separate, authorized process.</div>`,
      gens: ["k201-ch10-agg", "k201-ch10-defend"],
    },
    {
      title: "Documenting queries: comments, file names, IntelliSense",
      lo: "Document each query with comments that state the business question and the requirement it verifies, and save it under a purpose-driven name.",
      html: `<p>Any line that starts with <b>--</b> is a comment, and the database ignores it. Every query file opens with two:</p>
<ol>
<li><b>Business question</b>: what you want to know. <i>-- Which orders point to a customer who isn't on file?</i></li>
<li><b>Business requirement verified</b>: the rule the data should obey. <i>-- Every order must belong to a registered customer.</i></li>
</ol>
<p>A requirement states the <em>rule</em>, not a description of the SQL. “Return customers with no orders” only repeats what the code does. “Every registered customer should have placed at least one order” is a rule someone can agree or disagree with. If you can't state the requirement, you aren't ready to write the query.</p>
<p><b>File names say the purpose:</b> ${ic("Email_Compliance.sql")}, ${ic("Quantity_Audit.sql")}, ${ic("Orphaned_Orders.sql")}, not ${ic("CUSTOMERS_Query.sql")} or ${ic("Query1.sql")}. Workflow: create the .sql file → write the two comments → write the query (FROM first) → run it (play button, or Ctrl+Shift+E / Cmd+Shift+E) → interpret → save.</p>
<p><b>IntelliSense</b> in VS Code suggests keywords, table names and columns as you type (Tab accepts). It helps with syntax and spelling, but it can offer a field that doesn't exist in this table, and it knows nothing about business rules. Treat it as a starting point.</p>
<div class="keyidea"><b>Key idea.</b> The comments make a query auditable. Six weeks later, anyone can check whether the SQL actually tests the rule it claims to test.</div>
<div class="example"><b>Example.</b> ${ic("Unsold_Inventory.sql")}: “-- Which catalog products have no sales records?” / “-- Every active catalog product should have at least one sale.” A reviewer can see at once that a LEFT JOIN from PRODUCTS with ${ic("IS NULL")} is the right shape.</div>
<div class="trap"><b>Common trap.</b> Accepting the first IntelliSense suggestion because it “must exist.” Suggestions come from what the editor has seen, not from your business rules. A plausible-looking column can still be the wrong field, or not exist in this table at all.</div>`,
      gens: ["k201-ch10-defend", "k201-ch10-write"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const fc = (id, tag, front, back) => ({ id: "k201-ch10-c-" + id, tag, front, back });
  const flashcards = [
    fc("clauses", "Definition", "What job does each of SELECT, FROM, WHERE and ORDER BY do?", "SELECT = which columns appear (including calculated ones); FROM = which table the rows come from; WHERE = which rows qualify; ORDER BY = how the result is sorted (ASC by default, DESC for largest first)."),
    fc("written", "List", "In what order do you <em>write</em> the clauses of a query?", "SELECT → FROM → (JOIN … ON) → WHERE → GROUP BY → ORDER BY."),
    fc("exec", "List", "In what order does SQL Server <em>execute</em> the clauses?", "FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY. “Filter first, then total.”"),
    fc("alias-where", "Why", "Why does <code>WHERE LineTotal &gt; 200</code> fail with “Invalid column name 'LineTotal'” when SELECT defines LineTotal?", "WHERE runs before SELECT, so the alias doesn't exist yet. Repeat the calculation: <code>WHERE (Quantity * SalePrice) &gt; 200</code>."),
    fc("alias-order", "Why", "Why can ORDER BY use a SELECT alias when WHERE can't?", "ORDER BY is the last step, after SELECT has created the alias."),
    fc("between", "Definition", "Is BETWEEN inclusive or exclusive?", "Inclusive: <code>Rating BETWEEN 1 AND 5</code> keeps 1 and 5 as well as everything in between."),
    fc("like", "Example", "What does <code>LIKE '%@iu.edu'</code> match, and what does % mean?", "% stands for any run of characters (including none), so the pattern matches any value that <em>ends</em> with @iu.edu. NOT LIKE returns the ones that don't."),
    fc("null", "What's the difference", "Why use <code>IS NULL</code> instead of <code>= NULL</code>?", "NULL means unknown, so any comparison with it (including =) is unknown, never true, and <code>= NULL</code> returns no rows. IS NULL / IS NOT NULL are the tests that actually find blanks."),
    fc("andor", "What's the difference", "AND vs. OR in a WHERE clause?", "AND keeps a row only if both conditions are true; OR keeps it if either is. <code>Rating &lt; 1 AND Rating &gt; 5</code> can never be true. The violation finder is <code>Rating &lt; 1 OR Rating &gt; 5</code>."),
    fc("not", "Example", "Write a WHERE clause that finds ratings outside 1–5 using NOT.", "<code>WHERE NOT (Rating BETWEEN 1 AND 5)</code>. Note: rows with a NULL rating still won't appear."),
    fc("calc", "Definition", "What is a calculated column, and does it change the table?", "An expression in SELECT computed per row, labelled with AS, e.g. <code>(p.BasePrice - oi.SalePrice) AS PriceDifference</code>. It exists only in the result; the database is unchanged."),
    fc("tablealias", "Example", "What does <code>FROM dbo.ORDERS o</code> let you do?", "Gives ORDERS the short alias <b>o</b>, so columns can be written <code>o.CustomerID</code>. That is shorter, and it says which table a shared column name comes from."),
    fc("inner", "Definition", "What does an INNER JOIN return?", "Only rows that have a match in both tables (complete, matched records). Unmatched rows, including orphans, vanish silently."),
    fc("left", "Definition", "What does a LEFT JOIN return?", "Every row of the left (first) table, matched or not. Unmatched right-side columns come back NULL (everything, including the gaps)."),
    fc("gap", "Example", "How do you find catalog products that have never sold?", "<code>FROM dbo.PRODUCTS p LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID WHERE oi.OrderID IS NULL</code>"),
    fc("orphan", "Why", "Why does an INNER JOIN return zero rows when you look for orphaned orders?", "An orphan has no matching customer, and INNER JOIN keeps only matches, so the orphans are discarded before WHERE ever sees them. Use ORDERS LEFT JOIN CUSTOMERS … WHERE c.CustomerID IS NULL."),
    fc("on", "Definition", "What goes in the ON clause?", "The matching condition, usually the primary key of one table equal to the foreign key in the other: <code>ON o.CustomerID = c.CustomerID</code>."),
    fc("count", "What's the difference", "COUNT(*) vs. COUNT(column)?", "COUNT(*) counts every row in the group, NULLs included. COUNT(column) counts only rows where that column is not NULL."),
    fc("sumavg", "Definition", "How do SUM and AVG treat NULLs?", "They ignore them. AVG divides by the number of non-NULL values, so prices 40, 60, NULL average 50."),
    fc("groupby", "Definition", "What is the SELECT / GROUP BY rule?", "Every SELECT item must be either inside an aggregate or listed in GROUP BY. E.g. StoreName next to COUNT(OrderID) must be in GROUP BY."),
    fc("neg", "Why", "Why can one Quantity of −1 matter so much?", "SUM(Quantity * SalePrice) adds it in as negative revenue, silently lowering the total. The query runs fine, and the answer is wrong unless the business really records returns that way."),
    fc("filterfirst", "Why", "Why is “filter before aggregating” a data-integrity decision?", "The WHERE clause decides which records the total includes. Choosing to exclude unverified rows changes the reported number, so it must be deliberate, based on the business process, and disclosed."),
    fc("report", "Example", "What should a defensible report of a cleaned figure include?", "The clean figure, what records were removed and why (the rule), and how much including them would change the result. Ideally show the all-records figure too."),
    fc("comments", "List", "What two comment lines start every query file?", "1) -- Business question (what you want to know). 2) -- Business requirement verified (the rule the data should obey)."),
    fc("req", "What's the difference", "Requirement vs. restating the SQL: give an example of each.", "Requirement: “Every registered customer should have placed at least one order.” Restating: “Return customers with no orders.” The first states a rule someone can check; the second only describes the code."),
    fc("filename", "Example", "Purpose-driven vs. table-driven file names?", "Purpose-driven: <code>Email_Compliance.sql</code>, <code>Orphaned_Orders.sql</code>. Table-driven: <code>CUSTOMERS_Query.sql</code>, which says what was touched, not why."),
    fc("intellisense", "Why", "What are IntelliSense's limits?", "It suggests keywords, tables and columns (Tab accepts) and catches spelling slips, but it can suggest fields that don't exist and knows nothing about business rules. It's a starting point, not an authority."),
    fc("outward", "Why", "Why write FROM before SELECT (“from the source outward”)?", "It matches execution order, makes you decide which tables hold the data, and gives IntelliSense the context to suggest the right columns."),
    fc("selectstar", "What's the difference", "When is <code>SELECT *</code> fine and when isn't it?", "Fine for exploring a table. A shared query should return only the fields the question needs. Extra columns (major, grad year) add noise and expose data nobody asked for."),
    fc("orderby", "Definition", "What does <code>ORDER BY p.StoreID, p.BasePrice DESC</code> do?", "Sorts by StoreID ascending, then within each store by BasePrice largest-first. Without ORDER BY, SQL Server guarantees no particular order."),
    fc("top", "Definition", "What does <code>SELECT TOP (3)</code> do in SQL Server?", "Returns only the first 3 rows of the result, in the ORDER BY order (without ORDER BY, which 3 is not guaranteed)."),
    fc("mixed", "Example", "An unsold-products list shows a real product nobody bought and a product with a StoreID that matches no store. How do the responses differ?", "The first is a business performance issue (sales or merchandising should look at it). The second is a data integrity issue (fix the catalog record). Same query, different problems."),
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“Invalid column name” for a name you defined with AS", think: "Alias used in WHERE / GROUP BY", why: "Those clauses run before SELECT creates the alias. Repeat the full calculation (ORDER BY may keep the alias)." },
    { when: "“ends with”, “uses a non-IU email”, “starts with S”", think: "LIKE / NOT LIKE with %", why: "% stands for any characters. '%@iu.edu' = ends with @iu.edu." },
    { when: "“outside the allowed range”, “impossible rating”", think: "NOT (x BETWEEN a AND b) or x &lt; a OR x &gt; b", why: "Flip the rule to find violators. OR, never AND, for the two tails." },
    { when: "“missing”, “blank”, “no value on file”", think: "IS NULL", why: "= NULL is never true, so only IS NULL finds blanks." },
    { when: "“…including those with none”, “every product, even unsold”", think: "LEFT JOIN (keep-all table on the left)", why: "INNER JOIN drops unmatched rows. LEFT JOIN keeps them with NULLs." },
    { when: "“never sold”, “no matching customer”, “orphaned”", think: "LEFT JOIN + WHERE right.key IS NULL", why: "The NULL produced by the unmatched side marks exactly the gaps." },
    { when: "“only orders with a valid customer”, “matched records”", think: "INNER JOIN", why: "Keeps rows that match in both tables." },
    { when: "“per store”, “for each”, “by category”", think: "GROUP BY + aggregate", why: "One output row per group. Non-aggregated SELECT columns must be in GROUP BY." },
    { when: "Group totals add up to less than COUNT(*) of the table", think: "INNER JOIN silently dropped rows", why: "Rows with a foreign key that matches nothing vanish. Check with a LEFT JOIN." },
    { when: "A column has NULLs and you COUNT or AVG it", think: "COUNT(col) and AVG skip NULLs", why: "COUNT(*) still counts the row; AVG divides by non-NULL values only." },
    { when: "Negative quantity or $0 price inside a SUM", think: "Filter before aggregating, then compare", why: "Run all-records and clean versions and report the difference with a disclosure." },
    { when: "“The query ran fine, so the number is right”", think: "Ran ≠ true", why: "Logic errors (AND for OR, = NULL, wrong join) run cleanly and still mislead." },
    { when: "Writing the comment lines at the top of a .sql file", think: "Business question + business requirement", why: "The requirement states the rule, not a restatement of the SQL." },
    { when: "Naming a new query file", think: "Purpose-driven name", why: "Email_Compliance.sql, not CUSTOMERS_Query.sql. Say why the query exists." },
  ];

  /* ============================================================
   * TOPIC 1 · Execution order and clause logic
   * ============================================================ */
  const CALC_SCEN = [
    { alias: "LineTotal", expr: "Quantity * SalePrice", cols: "OrderID, Quantity, SalePrice", from: ["FROM dbo.ORDER_ITEMS"], thr: () => U.pick([150, 200, 250]) },
    { alias: "PriceDifference", expr: "p.BasePrice - oi.SalePrice", cols: "oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice", from: ["FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID"], thr: () => U.pick([20, 25, 30]) },
    { alias: "Markup", expr: "SalePrice - UnitCost", cols: "ProductID, ProductName, UnitCost, SalePrice", from: ["FROM dbo.PRODUCTS"], thr: () => U.pick([10, 15, 40]) },
    { alias: "ExtendedCost", expr: "UnitCost * QtyReceived", cols: "ShipmentID, ProductID, UnitCost, QtyReceived", from: ["FROM dbo.SHIPMENTS"], thr: () => U.pick([500, 1000, 2500]) },
    { alias: "HoursOver", expr: "HoursWorked - HoursScheduled", cols: "EmployeeID, ShiftDate, HoursScheduled, HoursWorked", from: ["FROM dbo.SHIFTS"], thr: () => U.pick([1, 2, 3]) },
  ];
  const EXEC = ["FROM", "JOIN … ON", "WHERE", "GROUP BY", "SELECT", "ORDER BY"];
  const WRITTEN = ["SELECT", "FROM", "JOIN … ON", "WHERE", "GROUP BY", "ORDER BY"];
  const WHY_POS = {
    "FROM": "FROM runs first: the database has to know which table it is reading before anything else can happen.",
    "JOIN … ON": "JOIN runs right after FROM, combining the second table into the working rows.",
    "WHERE": "WHERE filters the joined rows before any grouping or totals. Filter first, then total.",
    "GROUP BY": "GROUP BY collapses the surviving rows into groups, after filtering but before SELECT computes the output.",
    "SELECT": "SELECT runs late, after the rows are filtered and grouped, which is why its aliases don't exist yet in WHERE.",
    "ORDER BY": "ORDER BY is last; it sorts the finished result, so it can use SELECT aliases.",
  };
  const orderBank = [
    { q: "A query computes <code>SUM(oi.Quantity * oi.SalePrice)</code> and also has <code>WHERE oi.Quantity &gt; 0</code>. Which rows does the SUM add up?", right: "Only the rows that passed the WHERE filter", rightWhy: "WHERE runs before grouping and SELECT, so the total only ever sees surviving rows.",
      wrong: [{ t: "All rows; WHERE only hides rows from the display afterwards", why: "WHERE is not a display filter. It runs before the aggregate, so excluded rows never reach SUM." }, { t: "All rows, then the WHERE condition is applied to the total", why: "The condition tests individual rows (Quantity), not the finished total, and it runs first." }, { t: "It depends on whether ORDER BY is present", why: "ORDER BY only sorts the final result; it never changes which rows are summed." }],
      sol: ["Recall the execution order: FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY.", "WHERE sits before SELECT (where SUM is computed), so the sum only includes rows that survived the filter: “filter first, then total.”"] },
    { q: "Why does building a query “from the source outward” (typing FROM before the SELECT list) help?", right: "It follows execution order, makes you decide where the data lives first, and gives IntelliSense the table to suggest columns from", rightWhy: "All three benefits come from starting with the step SQL itself starts with.",
      wrong: [{ t: "SQL Server requires FROM to be typed first or it will not run", why: "The written order is still SELECT first. FROM-first is a drafting habit, not a syntax rule." }, { t: "It makes the query run faster", why: "Typing order has no effect on performance; the saved text is the same." }, { t: "It lets WHERE use the SELECT aliases", why: "Aliases are still unavailable to WHERE. That depends on execution order, not typing order." }],
      sol: ["Think about what the database itself does first.", "FROM runs first. Writing it first mirrors that, forces you to pick the right tables, and lets IntelliSense suggest real column names when you then write SELECT."] },
    { q: "In the Chapter 9 practice, an order dated 2035 had to be removed from a sorted list. Where must the WHERE line go?", right: "After FROM and before ORDER BY", rightWhy: "Written order is SELECT, FROM, WHERE, ORDER BY. WHERE always sits between the source and the sort.",
      wrong: [{ t: "After ORDER BY, because you sort first and then filter", why: "That is a syntax error; ORDER BY is always the last clause written (and run)." }, { t: "Before SELECT, because WHERE runs early", why: "Execution order ≠ written order. You still write SELECT first." }, { t: "Anywhere, as long as it ends with a semicolon", why: "Clause positions are fixed. Out-of-order clauses cause a syntax error." }],
      sol: ["Separate written order from execution order. The question is about where you <em>write</em> it.", "Written order: SELECT → FROM → (JOIN) → WHERE → GROUP BY → ORDER BY. So WHERE goes between FROM and ORDER BY."] },
    { q: "A query has <code>(Quantity * SalePrice) AS LineTotal</code> in SELECT and <code>ORDER BY LineTotal DESC</code>. Will the ORDER BY work?", right: "Yes, because ORDER BY runs after SELECT has created the alias", rightWhy: "ORDER BY is the final step, so the label exists by then.",
      wrong: [{ t: "No, aliases can never be referenced outside SELECT", why: "Only clauses that run <em>before</em> SELECT (WHERE, GROUP BY) can't see aliases. ORDER BY runs after." }, { t: "No, you must sort by the column position number", why: "Sorting by alias is allowed here; no position number is needed." }, { t: "Only if the alias is in single quotes", why: "Quotes would turn it into a text literal, not a reference to the column." }],
      sol: ["Ask: does ORDER BY run before or after SELECT?", "After. SELECT has already defined LineTotal, so ORDER BY can use it, unlike WHERE."] },
    { q: "Can you write <code>GROUP BY StoreLabel</code> when <code>StoreLabel</code> is an alias defined in the SELECT list?", right: "No. GROUP BY runs before SELECT, so the alias doesn't exist yet; group by the underlying column or expression", rightWhy: "Same reason WHERE can't use an alias.",
      wrong: [{ t: "Yes, GROUP BY can use any alias because it is written after SELECT", why: "Written position doesn't matter. In execution order, GROUP BY comes before SELECT." }, { t: "Yes, but only with COUNT(*)", why: "The aggregate used has nothing to do with whether an alias exists yet." }, { t: "No, because GROUP BY can only use numeric columns", why: "GROUP BY works on text columns like StoreName too. The issue is timing, not data type." }],
      sol: ["Place GROUP BY in execution order relative to SELECT.", "FROM → JOIN → WHERE → <b>GROUP BY</b> → SELECT → ORDER BY. GROUP BY runs before the alias is created, so it must use the real column."] },
    { q: "Why is “Filter first, then total” a useful way to remember execution order?", right: "WHERE removes rows before GROUP BY and the aggregates in SELECT ever see them", rightWhy: "So whatever WHERE excludes is excluded from every count, sum and average.",
      wrong: [{ t: "Totals are calculated first and the filter trims them", why: "Backwards: totals are computed in SELECT, which runs after WHERE." }, { t: "It means you should always sort before you filter", why: "Sorting (ORDER BY) is the very last step, after both filtering and totalling." }, { t: "It only applies to queries without joins", why: "Joins happen even earlier (right after FROM). The filter-then-total sequence still holds." }],
      sol: ["Where are WHERE and SUM/COUNT in execution order?", "WHERE comes before GROUP BY and SELECT, so filters shape the totals, never the other way round."] },
  ];
  const orderTF = [
    { s: "SQL Server executes a query's clauses in the same order they are written.", truth: false, why: "Written: SELECT first. Executed: FROM first, and SELECT runs near the end (before ORDER BY).", hint: "Compare the two orders: which clause is first in each?" },
    { s: "ORDER BY can refer to a column alias created in the SELECT list.", truth: true, why: "ORDER BY runs after SELECT, so the alias exists by then.", hint: "Where is ORDER BY in execution order?" },
    { s: "WHERE can refer to a column alias as long as the alias is spelled exactly right.", truth: false, why: "Spelling isn't the issue. WHERE runs before SELECT, so the alias doesn't exist yet. Repeat the calculation.", hint: "Does the alias exist when WHERE runs?" },
    { s: "Because WHERE runs before GROUP BY, rows it removes never reach a COUNT or SUM.", truth: true, why: "Filter first, then total: aggregates only see surviving rows.", hint: "Put WHERE and GROUP BY in execution order." },
    { s: "JOIN runs after WHERE, so a WHERE condition can't refer to columns from the joined table.", truth: false, why: "JOIN runs right after FROM, before WHERE. That is why WHERE can filter on joined columns like <code>oi.OrderID IS NULL</code>.", hint: "Where does JOIN sit relative to WHERE?" },
    { s: "Moving the WHERE clause below ORDER BY fixes an “Invalid column name” error caused by an alias.", truth: false, why: "WHERE must be written before ORDER BY (syntax error otherwise), and it still runs before SELECT. Repeat the calculation instead.", hint: "Is written order flexible?" },
    { s: "Typing FROM before the SELECT list mirrors the order the database itself works in.", truth: true, why: "FROM is the first clause executed, so “from the source outward” follows execution order.", hint: "Which clause executes first?" },
    { s: "GROUP BY runs after SELECT, so it can use SELECT aliases.", truth: false, why: "GROUP BY runs before SELECT, so like WHERE it can't see aliases.", hint: "Recite the execution order." },
  ];
  /* runs / errors / misleads bank */
  const RUN_CATS = ["Error", "Runs and answers the goal", "Runs but misleads"];
  const goalQ = (goal, ...lines) => `<i>Goal:</i> ${goal}${sql(...lines)}`;
  const runBank = [
    { t: goalQ("lines worth more than $200", "SELECT OrderID, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE LineTotal > 200;"), cat: "Error", why: "WHERE runs before SELECT, so LineTotal doesn't exist yet: “Invalid column name 'LineTotal'”." },
    { t: goalQ("count products per store", "SELECT StoreID, ProductName, COUNT(ProductID)", "FROM dbo.PRODUCTS", "GROUP BY StoreID;"), cat: "Error", why: "ProductName is neither aggregated nor in GROUP BY, which breaks the SELECT/GROUP BY rule." },
    { t: goalQ("recent orders, newest first", "SELECT *", "FROM dbo.ORDERS", "ORDER BY OrderDate DESC", "WHERE OrderDate >= '2025-01-01';"), cat: "Error", why: "WHERE is written after ORDER BY. Written order is fixed, so this is a syntax error." },
    { t: goalQ("customers without an IU address", "SELECT CustomerID, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE %@iu.edu;"), cat: "Error", why: "The pattern isn't in single quotes, so SQL Server can't parse it as text." },
    { t: goalQ("biggest discounts", "SELECT p.ProductName, (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", "WHERE PriceDifference > 25;"), cat: "Error", why: "Alias in WHERE again: repeat <code>(p.BasePrice - oi.SalePrice)</code> in the WHERE clause." },
    { t: goalQ("lines worth more than $200", "SELECT OrderID, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE (Quantity * SalePrice) > 200", "ORDER BY LineTotal DESC;"), cat: "Runs and answers the goal", why: "Full calculation in WHERE, alias in ORDER BY: the textbook fix." },
    { t: goalQ("orders taken per storefront", "SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "GROUP BY s.StoreName;"), cat: "Runs and answers the goal", why: "StoreName is grouped, OrderID is aggregated, and the ON clause matches the keys." },
    { t: goalQ("customers without an IU address", "SELECT CustomerID, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '%@iu.edu';"), cat: "Runs and answers the goal", why: "Quoted pattern with %, NOT LIKE for the violators, and only the needed columns." },
    { t: goalQ("line items with zero or negative quantity", "SELECT *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 1;"), cat: "Runs and answers the goal", why: "&lt; 1 catches both zero and all negatives." },
    { t: goalQ("customers with no major on file", "SELECT CustomerID, LastName", "FROM dbo.CUSTOMERS", "WHERE Major = NULL;"), cat: "Runs but misleads", why: "= NULL is never true, so it runs and returns zero rows, falsely suggesting nobody is missing a major. Use IS NULL." },
    { t: goalQ("orders whose customer doesn't exist", "SELECT o.OrderID", "FROM dbo.ORDERS o", "INNER JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID", "WHERE c.CustomerID IS NULL;"), cat: "Runs but misleads", why: "INNER JOIN already removed the orphans, so the result is always empty. Use LEFT JOIN." },
    { t: goalQ("revenue from completed sales", "SELECT SUM(Quantity * SalePrice) AS Revenue", "FROM dbo.ORDER_ITEMS;"), cat: "Runs but misleads", why: "Runs fine, but negative and zero quantities are summed in. Filter (e.g. WHERE Quantity > 0) and disclose." },
    { t: goalQ("customers without an IU address", "SELECT CustomerID, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '@iu.edu';"), cat: "Runs but misleads", why: "Without %, the pattern must match the whole value, so every real address “doesn't match” and every row is returned." },
    { t: goalQ("reviews with a valid rating (1 to 5)", "SELECT ReviewID, Rating", "FROM dbo.REVIEWS", "WHERE Rating > 1 AND Rating < 5;"), cat: "Runs but misleads", why: "Strict &gt; and &lt; drop valid 1s and 5s. Use BETWEEN 1 AND 5 (inclusive)." },
    { t: goalQ("every product with its store name", "SELECT p.ProductName, s.StoreName", "FROM dbo.PRODUCTS p", "INNER JOIN dbo.STORES s ON p.StoreID = s.StoreID;"), cat: "Runs but misleads", why: "Products with an invalid StoreID silently disappear. “Every product” needs PRODUCTS LEFT JOIN STORES." },
  ];

  const orderGen = STUDY.makeGenerator({
    id: "k201-ch10-order",
    name: "Execution order & clause logic",
    blurb: "Written vs. execution order, why WHERE can't use a SELECT alias, and which queries run, fail or quietly mislead.",
    variants: [
      {
        name: "Place clauses in execution / written order",
        make() {
          const written = Math.random() < 0.35;
          let seq = (written ? WRITTEN : EXEC).slice();
          if (Math.random() < 0.4) seq = seq.filter(c => c !== "JOIN … ON");
          if (Math.random() < 0.4) seq = seq.filter(c => c !== "GROUP BY");
          const cats = seq.map((_, i) => `Runs ${ord(i + 1)}`.replace("Runs", written ? "Written" : "Runs"));
          return Q.classify({
            q: `<p>A query uses the clauses below. For each one, choose its position in the order SQL Server <b>${written ? "expects you to write" : "actually executes"}</b> them.</p>`,
            cats,
            items: seq.map((c, i) => ({ t: c, cat: cats[i], why: written ? `Written order: ${seq.join(" → ")}.` : WHY_POS[c] })),
            sol: S(written ? "Written order reads like a sentence: what you want (SELECT), from where (FROM, JOIN), which rows (WHERE), grouped how (GROUP BY), sorted how (ORDER BY)." : "Execution order follows the data: find the rows, filter them, group them, compute the output, sort it. “Filter first, then total.”",
              `${written ? "Written" : "Execution"} order for this query: <b>${seq.join(" → ")}</b>.`,
              written ? "Compare execution order: FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY." : "Compare written order: SELECT → FROM → JOIN → WHERE → GROUP BY → ORDER BY. SELECT moves from first written to second-to-last run."),
          });
        },
      },
      {
        name: "Diagnose “Invalid column name”",
        make() {
          const sc = U.pick(CALC_SCEN), thr = sc.thr();
          const q = sql(`SELECT ${sc.cols},`, `       (${sc.expr}) AS ${sc.alias}`, sc.from, `WHERE ${sc.alias} > ${thr}`, `ORDER BY ${sc.alias} DESC;`);
          const wrongs = [
            { t: `Move the WHERE line below ORDER BY so the alias is defined first`, why: "Written order is fixed: WHERE must come before ORDER BY, so this causes a syntax error. And WHERE would still run before SELECT." },
            { t: `Put the alias in quotes: <code>WHERE '${sc.alias}' &gt; ${thr}</code>`, why: "Quotes make it a text literal, so you'd be comparing the word itself to a number, not the computed value." },
            { t: `Also replace <code>ORDER BY ${sc.alias}</code>, because the error comes from ORDER BY too`, why: "ORDER BY runs after SELECT, so it can see the alias. Only WHERE is at fault." },
            { t: `Add a ${sc.alias} column to the table so the name exists`, why: "A calculated column only belongs in the result. Changing the database to make a report run is never the fix." },
          ];
          return Q.mc({
            q: `<p>Running this query returns <i>Msg 207: Invalid column name '${sc.alias}'</i>.</p>${q}<p>What is the correct fix?</p>`,
            right: `Repeat the calculation in WHERE: <code>WHERE (${esc(sc.expr)}) &gt; ${thr}</code>, and leave ORDER BY as it is`,
            rightWhy: "WHERE runs before SELECT creates the alias, so it needs the full expression. ORDER BY runs after SELECT, so the alias is fine there.",
            wrong: U.sample(wrongs, 3),
            sol: S("Ask which clause referenced the alias, and whether that clause runs before or after SELECT.",
              `Execution order: FROM → JOIN → <b>WHERE</b> → GROUP BY → <b>SELECT</b> → ORDER BY. ${sc.alias} is born in SELECT, so WHERE can't see it.`,
              `Fix: <code>WHERE (${esc(sc.expr)}) &gt; ${thr}</code>; keep <code>ORDER BY ${sc.alias} DESC</code>.`),
          });
        },
      },
      {
        name: "Before or after SELECT? (select all)",
        make() {
          const sc = U.pick(CALC_SCEN);
          const all = ["FROM", "JOIN … ON", "WHERE", "GROUP BY", "SELECT", "ORDER BY"];
          const pos = c => EXEC.indexOf(c);
          const asks = [
            { q: "Which clauses run <b>before</b> SELECT?", ok: c => pos(c) < pos("SELECT"), opts: all.filter(c => c !== "SELECT") },
            { q: `In which clauses can you refer to the alias <code>${sc.alias}</code> defined in the SELECT list?`, ok: c => c === "ORDER BY", opts: all.filter(c => c !== "SELECT" && c !== "JOIN … ON") },
            { q: "Which clauses have already run by the time GROUP BY forms its groups?", ok: c => pos(c) < pos("GROUP BY"), opts: all.filter(c => c !== "GROUP BY") },
            { q: "Which clauses run <b>after</b> WHERE?", ok: c => pos(c) > pos("WHERE"), opts: all.filter(c => c !== "WHERE") },
            { q: "Which clauses run <b>after</b> SELECT?", ok: c => pos(c) > pos("SELECT"), opts: all.filter(c => c !== "SELECT" && c !== "FROM") },
          ];
          const a = U.pick(asks);
          return Q.multi({
            q: `<p>${a.q}</p>`,
            options: a.opts.map(c => ({ t: c, ok: a.ok(c), why: `${c} is step ${pos(c) + 1} of 6 in execution order. ${WHY_POS[c]}` })),
            sol: S("Write out the execution order and read positions off it, not the order you type.", "FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY. Only ORDER BY follows SELECT, which is why it is the one clause that can use aliases."),
          });
        },
      },
      {
        name: "Runs, errors, or misleads?",
        make() {
          const items = [];
          for (const c of U.shuffle(RUN_CATS).slice(0, 2)) items.push(U.deal("run:" + c, runBank.filter(b => b.cat === c), 1)[0]);
          const rest = U.shuffle(runBank.filter(b => !items.includes(b)));
          while (items.length < 4) items.push(rest.shift());
          return Q.classify({
            q: "<p>Each query has a stated goal. Decide whether it <b>errors</b>, <b>runs and answers the goal</b>, or <b>runs but misleads</b> (no error, wrong or incomplete answer).</p>",
            cats: RUN_CATS, items: items.map(i => ({ t: i.t, cat: i.cat, why: i.why })),
            sol: S("Check syntax and timing first (clause order, quotes, aliases in WHERE, the GROUP BY rule). Then check logic against the goal: NULL tests, AND vs OR, inclusive bounds, join type, unfiltered bad rows.",
              "“It ran” is not the standard. The misleading queries are the dangerous ones, because nothing warns you."),
          });
        },
      },
      {
        name: "Which query will run?",
        make() {
          const sc = U.pick(CALC_SCEN), thr = sc.thr();
          const sel = `SELECT ${sc.cols}, (${sc.expr}) AS ${sc.alias}`;
          const wh = `WHERE (${sc.expr}) > ${thr}`, ob = `ORDER BY ${sc.alias} DESC;`;
          const good = sql(sel, sc.from, wh, ob);
          const bad = [
            { t: sql(sel, sc.from, ob.replace(";", ""), wh + ";"), why: "WHERE is written after ORDER BY. Written order is fixed, so this is a syntax error." },
            { t: sql(sc.from, sel, wh, ob), why: "FROM is first here. It <em>executes</em> first, but you must <em>write</em> SELECT first." },
            { t: sql(sel, sc.from, `WHERE ${sc.alias} > ${thr}`, ob), why: "Clause order is right, but WHERE uses the alias, which doesn't exist yet when WHERE runs: Invalid column name." },
            { t: sql(sel, wh, sc.from, ob), why: "WHERE comes before FROM. The filter has to follow the source in written order." },
          ];
          return Q.mc({
            q: `<p>Goal: list rows where ${sc.alias} exceeds ${thr}, largest first. Which version runs without an error?</p>`,
            right: good, rightWhy: "Correct written order, full expression in WHERE, alias only in ORDER BY.",
            wrong: U.sample(bad, 3),
            sol: S("Check two things in each version: is the written order SELECT → FROM (→ JOIN) → WHERE → ORDER BY, and does WHERE avoid the alias?", "Only one version passes both checks: the full calculation in WHERE and the alias in ORDER BY."),
          });
        },
      },
      K.conceptVariant("Explain the consequence", "ch10-order", orderBank),
      K.tfVariant("True or false: order rules", "ch10-order", orderTF),
    ],
  });

  /* ============================================================
   * TOPIC 2 · WHERE operators on a live table
   * ============================================================ */
  function bqBank() {
    const y = U.randInt(2025, 2026), s = U.randInt(1, 3), thr = U.pick([150, 200, 300]);
    const maj = U.pick(MAJORS);
    return [
      { q: "Which customer records use an email address that is <b>not</b> an @iu.edu address?", right: "SchoolEmail NOT LIKE '%@iu.edu'", wrong: [
        { t: "SchoolEmail LIKE '%@iu.edu'", why: "That returns the compliant addresses, the opposite of the question." },
        { t: "SchoolEmail NOT LIKE '@iu.edu'", why: "Without %, the pattern must equal the whole value, so every real address “doesn't match” and every row comes back." },
        { t: "SchoolEmail <> '@iu.edu'", why: "&lt;&gt; compares the entire value to the text “@iu.edu”, which no full address equals, so every non-NULL row is returned." }] },
      { q: "Which customers have <b>no major</b> recorded?", right: "Major IS NULL", wrong: [
        { t: "Major = NULL", why: "Comparing to NULL is unknown, never true, so this runs and returns zero rows." },
        { t: "Major = ''", why: "An empty string is a value; a NULL is the absence of one. Blank-looking cells in the table are NULLs." },
        { t: "Major IS NOT NULL", why: "That returns everyone who <em>has</em> a major." }] },
      { q: `Which customers graduate in <b>${y} through ${y + 2}</b> (inclusive)?`, right: `GradYear BETWEEN ${y} AND ${y + 2}`, wrong: [
        { t: `GradYear > ${y} AND GradYear < ${y + 2}`, why: `Strict inequalities drop ${y} and ${y + 2}; the range should include both.` },
        { t: `GradYear >= ${y} OR GradYear <= ${y + 2}`, why: "With OR, every year satisfies at least one side, so all rows come back." },
        { t: `GradYear = ${y} AND GradYear = ${y + 2}`, why: "A single value can't equal two different years, so this returns nothing." }] },
      { q: "Which reviews carry an <b>impossible rating</b> (outside the 1–5 scale)?", right: "Rating < 1 OR Rating > 5", wrong: [
        { t: "Rating < 1 AND Rating > 5", why: "No number is both below 1 and above 5. It runs and returns zero rows." },
        { t: "Rating BETWEEN 1 AND 5", why: "That returns the valid ratings, the opposite of the question." },
        { t: "Rating > 5", why: "Misses the impossible low ratings such as 0 or negatives." }] },
      { q: `Which store ${s} reviews are <b>positive</b> (rating 4 or higher)?`, right: `StoreID = ${s} AND Rating >= 4`, wrong: [
        { t: `StoreID = ${s} OR Rating >= 4`, why: "OR returns every store " + s + " review plus positive reviews from every store." },
        { t: `StoreID = ${s} AND Rating > 4`, why: "> 4 drops ratings of exactly 4, which the question counts as positive." },
        { t: `StoreID <> ${s} AND Rating >= 4`, why: "&lt;&gt; excludes store " + s + ", the one store you need." }] },
      { q: "Which reviews come from <b>every store except store 3</b>?", right: "StoreID <> 3", wrong: [
        { t: "StoreID = 3", why: "That keeps only store 3, the one to exclude." },
        { t: "StoreID > 3", why: "Stores 1 and 2 have lower IDs, so they'd be dropped." },
        { t: "StoreID NOT LIKE '%3'", why: "LIKE is for text patterns. It's the wrong tool for an exact numeric exclusion, and it would also drop store 13, 23…" }] },
      { q: "Which line items have a <b>zero or negative</b> quantity?", right: "Quantity < 1", wrong: [
        { t: "Quantity < 0", why: "Misses quantities of exactly 0, which are just as impossible for a completed sale." },
        { t: "Quantity = -1", why: "Only catches −1, not 0, −2 or any other negative." },
        { t: "Quantity <= 1", why: "Also returns valid single-unit purchases (Quantity = 1)." }] },
      { q: `Which line items are worth <b>more than $${thr}</b> (quantity × price)?`, right: `(Quantity * SalePrice) > ${thr}`, wrong: [
        { t: `LineTotal > ${thr}`, why: "If LineTotal is a SELECT alias, WHERE can't see it yet (Invalid column name)." },
        { t: `SalePrice > ${thr}`, why: "Ignores quantity: a $60 item bought 4 times is a $240 line." },
        { t: `(Quantity + SalePrice) > ${thr}`, why: "Adds units to dollars; line value is quantity <em>times</em> price." }] },
      { q: `Which customers are <b>not</b> ${maj} majors, counting students with no major on file?`, right: `Major <> '${maj}' OR Major IS NULL`, wrong: [
        { t: `Major <> '${maj}'`, why: "&lt;&gt; skips NULLs (unknown is not “different”), so students with no major silently drop out." },
        { t: `NOT (Major = '${maj}')`, why: "NOT of an unknown comparison is still unknown, so the NULL rows still drop out." },
        { t: `Major <> '${maj}' AND Major IS NULL`, why: "A row can't both have a non-" + maj + " major and no major, so AND only keeps NULL rows and the result is wrong." }] },
    ];
  }
  const OPCATS = ["Exact match / exclusion", "Comparison or range", "Pattern match", "Null check", "Combines or reverses tests"];
  const opBank = [
    ["WHERE StoreID = 1", 0], ["WHERE StoreID <> 3", 0], ["WHERE Major = 'Finance'", 0], ["WHERE ProductID <> 17", 0],
    ["WHERE Rating > 5", 1], ["WHERE GradYear >= 2026", 1], ["WHERE Rating BETWEEN 1 AND 5", 1], ["WHERE Quantity < 1", 1], ["WHERE SalePrice <= 20", 1],
    ["WHERE SchoolEmail LIKE '%@iu.edu'", 2], ["WHERE SchoolEmail NOT LIKE '%@iu.edu'", 2], ["WHERE LastName LIKE 'Mc%'", 2], ["WHERE ProductName LIKE '%Cable%'", 2],
    ["WHERE OrderID IS NULL", 3], ["WHERE CustomerID IS NOT NULL", 3], ["WHERE Major IS NULL", 3], ["WHERE ShipDate IS NULL", 3],
    ["WHERE StoreID = 2 AND Quantity > 0", 4], ["WHERE Rating < 1 OR Rating > 5", 4], ["WHERE NOT (Rating BETWEEN 1 AND 5)", 4], ["WHERE GradYear = 2026 OR GradYear = 2027", 4],
  ].map(([t, c]) => ({ t: ic(t), cat: OPCATS[c], why: [
    "= or &lt;&gt; tests for one exact value (or excludes it).",
    "&gt;, &lt;, &gt;=, &lt;= and BETWEEN compare against a boundary or range.",
    "LIKE / NOT LIKE match a text pattern; % = any characters.",
    "IS NULL / IS NOT NULL test whether a value is missing.",
    "AND / OR / NOT join or flip other tests.",
  ][c] }));

  const whereGen = STUDY.makeGenerator({
    id: "k201-ch10-where",
    name: "WHERE operators on a live table",
    blurb: "Run =, <>, >, BETWEEN, LIKE, IS NULL, AND/OR/NOT in your head over a fresh table every time.",
    variants: [
      {
        name: "Count the rows returned",
        make() {
          const { ds, cond, k } = pickWhere();
          const n = ds.rows.length;
          const fails = ds.rows.filter(r => ev(cond, r) === false).length;
          const loose = ds.rows.filter(r => ev(cond, r) !== false).length;
          const flip = ds.rows.filter(r => passes(flipBounds(cond), r)).length;
          const traps = dedupeTraps(k, [
            { value: fails, why: "That counts the rows the condition rejects. WHERE returns the rows where it is <em>true</em>." },
            { value: loose, why: "You treated a NULL as passing. A comparison with NULL is unknown, and WHERE drops unknown rows." },
            { value: flip, why: "Check the boundaries: BETWEEN and &gt;= / &lt;= include the endpoint; &gt; and &lt; do not." },
            { value: n, why: "That is every row in the table; WHERE keeps only the qualifying ones." },
          ]);
          return Q.num({
            kind: "count",
            q: `${dsTable(ds)}<p>How many rows does this query return?</p>${whereQuery(ds, cond)}`,
            answer: k, traps,
            sol: S(ul(opHints(cond)), `Test every row:${rowTrace(ds, cond)}`, `<b>${k}</b> ${U.plural(k, "row")} returned.`),
          });
        },
      },
      {
        name: "Which rows come back? (select all)",
        make() {
          const { ds, cond } = pickWhere();
          return Q.multi({
            q: `${dsTable(ds)}<p>Select <b>every</b> row this query returns.</p>${whereQuery(ds, cond)}`,
            options: ds.rows.map(r => {
              const v = ev(cond, r);
              return { t: ds.label(r), ok: v === true, why: v === true ? "The WHERE condition is true for this row." : v === null ? "A NULL makes the test unknown, and WHERE only keeps rows where it is true." : "The condition is false for this row." };
            }),
            sol: S(ul(opHints(cond)), `Row by row:${rowTrace(ds, cond)}`),
          });
        },
      },
      {
        name: "Which WHERE produced this result?",
        make() {
          for (let t = 0; t < 60; t++) {
            const { ds, cond } = pickWhere();
            const sig = c => ds.rows.map(r => passes(c, r) ? 1 : 0).join("");
            const target = sig(cond);
            const seen = new Set([target]);
            const wrongs = [];
            for (const c of U.shuffle(ds.conds())) {
              const s = sig(c);
              if (seen.has(s) || txt(c) === txt(cond)) continue;
              seen.add(s); wrongs.push(c);
              if (wrongs.length === 3) break;
            }
            if (wrongs.length < 3) continue;
            const kept = ds.rows.filter(r => passes(cond, r));
            const describe = c => { const ks = ds.rows.filter(r => passes(c, r)).map(r => r[ds.key]); return ks.length ? `${ds.key} ${ks.join(", ")}` : "no rows"; };
            return Q.mc({
              q: `${dsTable(ds)}<p>A query against this table returned exactly these rows:</p>${table("", ds.cols, kept)}<p>Which WHERE clause produced that result?</p>`,
              right: ic("WHERE " + txt(cond)), rightWhy: `It keeps exactly ${describe(cond)}.`,
              wrong: wrongs.map(c => ({ t: ic("WHERE " + txt(c)), why: `This clause would return ${describe(c)}. Compare with the result shown.` })),
              sol: S("Work backwards: what do the returned rows share that every excluded row lacks? Then test each candidate clause against the whole table, NULLs included.",
                `The right clause, row by row:${rowTrace(ds, cond)}`),
            });
          }
          return null;
        },
      },
      {
        name: "Pick the WHERE for the business question",
        make() {
          const bank = bqBank();
          const e = U.rotate("ch10-bq", bank);
          return Q.mc({
            q: `<p>${e.q}</p><p>Which WHERE clause answers it?</p>`,
            right: ic("WHERE " + e.right), rightWhy: "It turns the question into a test that is true for exactly the rows asked about.",
            wrong: e.wrong.map(w => ({ t: ic("WHERE " + w.t), why: w.why })),
            sol: S("Restate the question as a rule each row either passes or fails. Then check for operator traps: inclusive vs. strict bounds, AND vs. OR, % in LIKE, and = NULL vs. IS NULL.",
              `Answer: <code>WHERE ${esc(e.right)}</code>.`),
          });
        },
      },
      {
        name: "Classify the operator",
        make() {
          const firstCats = U.sample(OPCATS, 3);
          let items = firstCats.map(c => U.deal("op:" + c, opBank.filter(b => b.cat === c), 1)[0]);
          const rest = U.shuffle(opBank.filter(b => !items.includes(b)));
          items = items.concat(rest.slice(0, 2));
          return Q.classify({
            q: "<p>What kind of test does each WHERE clause perform?</p>", cats: OPCATS, items,
            sol: S("Look at the operator, not the column: =/&lt;&gt; exact; &gt; &lt; BETWEEN range; LIKE pattern; IS [NOT] NULL missing values; AND/OR/NOT combine.",
              "Clauses with AND, OR or NOT go under “combines” even though each half is a simpler test."),
          });
        },
      },
      {
        name: "Predict with NULLs in the table",
        make() {
          for (let t = 0; t < 80; t++) {
            const { ds, cond, k } = pickWhere((c, d) => usesNullish(c) && d.rows.some(r => ev(c, r) === null));
            if (!ds.rows.some(r => ev(cond, r) === null)) continue;
            const loose = ds.rows.filter(r => ev(cond, r) !== false).length;
            const nulls = ds.rows.filter(r => ev(cond, r) === null).length;
            return Q.num({
              kind: "count",
              q: `${dsTable(ds)}<p>Watch the NULLs. How many rows does this query return?</p>${whereQuery(ds, cond)}`,
              answer: k,
              traps: dedupeTraps(k, [
                { value: loose, why: `You let the ${nulls} NULL ${U.plural(nulls, "row")} through. Any comparison with NULL is unknown, and WHERE keeps only true results, even under &lt;&gt;, NOT LIKE or NOT.` },
                { value: ds.rows.length, why: "That's the whole table." },
                { value: ds.rows.length - k - nulls, why: "That's the rows where the condition is false." },
              ]),
              sol: S("NULL means “unknown”. A comparison involving it is neither true nor false, and WHERE only returns rows where the test is <b>true</b>. That holds for &lt;&gt;, NOT LIKE and NOT (…) too.",
                `Row by row:${rowTrace(ds, cond)}`, `<b>${k}</b> ${U.plural(k, "row")}. To include the blanks you would add <code>OR … IS NULL</code>.`),
            });
          }
          return null;
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 3 · Writing purpose-driven queries
   * ============================================================ */
  function fullQueryBank() {
    const thr = U.pick([150, 200, 250]), d = U.pick([20, 25, 30]);
    return [
      { q: "Which customer records use a non-IU email address? (Share only the fields needed to follow up, sorted by last name.)",
        right: sql("SELECT CustomerID, FirstName, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '%@iu.edu'", "ORDER BY LastName;"),
        wrong: [
          { t: sql("SELECT *", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '%@iu.edu'", "ORDER BY LastName;"), why: "Right rows, but SELECT * shares every column (major, grad year…) that the follow-up doesn't need." },
          { t: sql("SELECT CustomerID, FirstName, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail LIKE '%@iu.edu'", "ORDER BY LastName;"), why: "LIKE returns the compliant addresses; the question asks for the violators (NOT LIKE)." },
          { t: sql("SELECT CustomerID, FirstName, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '@iu.edu'", "ORDER BY LastName;"), why: "Missing %: the pattern must match the whole value, so every row is returned." }] },
      { q: "Which line items show a quantity that couldn't come from a completed purchase? Put the most expensive items first.",
        right: sql("SELECT *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 1", "ORDER BY SalePrice DESC;"),
        wrong: [
          { t: sql("SELECT *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 0", "ORDER BY SalePrice DESC;"), why: "&lt; 0 misses zero quantities, which are just as impossible." },
          { t: sql("SELECT *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 1", "ORDER BY SalePrice;"), why: "Without DESC the sort is ascending, so the cheapest items come first." },
          { t: sql("SELECT TOP (10) *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 1", "ORDER BY SalePrice DESC;"), why: "TOP (10) caps the list. The question needs every violating row across the whole table." }] },
      { q: `Which line items are worth more than $${thr} (quantity × sale price), largest first?`,
        right: sql("SELECT OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", `WHERE (Quantity * SalePrice) > ${thr}`, "ORDER BY LineTotal DESC;"),
        wrong: [
          { t: sql("SELECT OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", `WHERE LineTotal > ${thr}`, "ORDER BY LineTotal DESC;"), why: "Alias in WHERE: Invalid column name 'LineTotal'." },
          { t: sql("SELECT OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", `WHERE SalePrice > ${thr}`, "ORDER BY LineTotal DESC;"), why: "Filters on unit price, not line value, so multi-unit lines are missed." },
          { t: sql("SELECT OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", `WHERE (Quantity * SalePrice) > ${thr}`, "ORDER BY LineTotal;"), why: "Ascending sort puts the smallest qualifying lines first, but the question says largest first." }] },
      { q: `Which sales were more than $${d} below the product's catalog price?`,
        right: sql("SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", `WHERE (p.BasePrice - oi.SalePrice) > ${d}`, "ORDER BY PriceDifference DESC;"),
        wrong: [
          { t: sql("SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (oi.SalePrice - p.BasePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", `WHERE (oi.SalePrice - p.BasePrice) > ${d}`, "ORDER BY PriceDifference DESC;"), why: "Subtraction reversed: this finds items sold far <em>above</em> catalog." },
          { t: sql("SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.OrderID = p.ProductID", `WHERE (p.BasePrice - oi.SalePrice) > ${d}`, "ORDER BY PriceDifference DESC;"), why: "The ON clause matches OrderID to ProductID, unrelated keys, so rows pair up wrongly." },
          { t: sql("SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", `WHERE PriceDifference > ${d}`, "ORDER BY PriceDifference DESC;"), why: "Alias in WHERE. It errors because WHERE runs before SELECT." }] },
      { q: "How many orders has each storefront taken, busiest first?",
        right: sql("SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "GROUP BY s.StoreName", "ORDER BY TotalOrders DESC;"),
        wrong: [
          { t: sql("SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "ORDER BY TotalOrders DESC;"), why: "No GROUP BY: StoreName is not aggregated, so the query errors." },
          { t: sql("SELECT s.StoreName, SUM(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "GROUP BY s.StoreName", "ORDER BY TotalOrders DESC;"), why: "SUM adds up the ID numbers, which is meaningless. Counting orders needs COUNT." },
          { t: sql("SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "GROUP BY s.StoreName", "ORDER BY TotalOrders;"), why: "Ascending order lists the quietest store first." }] },
      { q: "Which catalog products have no sales records at all?",
        right: sql("SELECT p.ProductID, p.ProductName, p.StoreID", "FROM dbo.PRODUCTS p", "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", "WHERE oi.OrderID IS NULL;"),
        wrong: [
          { t: sql("SELECT p.ProductID, p.ProductName, p.StoreID", "FROM dbo.PRODUCTS p", "INNER JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", "WHERE oi.OrderID IS NULL;"), why: "INNER JOIN drops unsold products before WHERE runs, so the result is always empty." },
          { t: sql("SELECT p.ProductID, p.ProductName, p.StoreID", "FROM dbo.PRODUCTS p", "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID;"), why: "Without the IS NULL filter you get every product, sold or not." },
          { t: sql("SELECT p.ProductID, p.ProductName, p.StoreID", "FROM dbo.PRODUCTS p", "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", "WHERE oi.OrderID = NULL;"), why: "= NULL is never true, so this returns zero rows. Use IS NULL." }] },
    ];
  }
  const bugBank = [
    { goal: "list reviews with a rating outside 1–5", code: ["SELECT ReviewID, StoreID, Rating", "FROM dbo.REVIEWS", "WHERE Rating < 1 AND Rating > 5;"], right: "AND should be OR: no rating is below 1 and above 5 at once, so the query always returns zero rows", wrong: [
      { t: "BETWEEN should be used instead of &lt; and &gt;", why: "BETWEEN 1 AND 5 would return the <em>valid</em> ratings. The two-tail test is right; the connector is wrong." },
      { t: "The query errors because Rating is compared twice", why: "Comparing one column twice is legal; it runs (that's what makes it dangerous)." },
      { t: "Nothing; zero rows means every rating is valid", why: "Zero rows here proves nothing; the condition can never be true." }] },
    { goal: "find customers whose major is missing", code: ["SELECT CustomerID, LastName", "FROM dbo.CUSTOMERS", "WHERE Major = NULL;"], right: "= NULL is never true; it must be IS NULL", wrong: [
      { t: "NULL must be in quotes: <code>Major = 'NULL'</code>", why: "That searches for the four-letter text NULL, not a missing value." },
      { t: "The query errors and must use <code>Major == NULL</code>", why: "SQL uses a single =, and no equality test finds NULLs anyway." },
      { t: "Major should be in the SELECT list", why: "Including Major would show blanks, but the WHERE would still return nothing." }] },
    { goal: "list orders that point to a customer who isn't on file", code: ["SELECT o.OrderID, o.CustomerID", "FROM dbo.ORDERS o", "INNER JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID", "WHERE c.CustomerID IS NULL;"], right: "INNER JOIN discards the orphans before WHERE runs; it must be a LEFT JOIN from ORDERS", wrong: [
      { t: "The tables are in the wrong order; CUSTOMERS must be first", why: "CUSTOMERS LEFT JOIN ORDERS would find customers without orders, the opposite question. Here the problem is the join type." },
      { t: "It should test <code>o.CustomerID IS NULL</code>", why: "Orphans usually have a CustomerID; it just matches nobody. The fix is the join type." },
      { t: "The ON clause should use OrderID", why: "CustomerID is the right matching key between these tables." }] },
    { goal: "flag line items with zero or negative quantity", code: ["SELECT *", "FROM dbo.ORDER_ITEMS", "WHERE Quantity < 0;"], right: "&lt; 0 misses zero quantities; use &lt; 1 (or &lt;= 0)", wrong: [
      { t: "SELECT * is not allowed in an audit query", why: "SELECT * is legal and fine here; the bug is the boundary." },
      { t: "It should be <code>Quantity = -1</code>", why: "That catches only −1 and misses 0 and other negatives." },
      { t: "Nothing; zero is a valid quantity", why: "A completed sale can't have zero units. The requirement is a positive quantity." }] },
    { goal: "count products in each store", code: ["SELECT s.StoreName, p.ProductName, COUNT(p.ProductID) AS Products", "FROM dbo.PRODUCTS p", "INNER JOIN dbo.STORES s ON p.StoreID = s.StoreID", "GROUP BY s.StoreName;"], right: "p.ProductName is neither aggregated nor grouped, so the query breaks the GROUP BY rule and errors", wrong: [
      { t: "COUNT should be SUM", why: "Counting products is exactly COUNT's job." },
      { t: "GROUP BY must come before the JOIN", why: "Written order is JOIN then WHERE then GROUP BY; the GROUP BY is in the right place." },
      { t: "The alias Products can't be used here", why: "Defining an alias in SELECT is fine; nothing references it in WHERE." }] },
    { goal: "list customers without an IU email", code: ["SELECT CustomerID, SchoolEmail", "FROM dbo.CUSTOMERS", "WHERE SchoolEmail NOT LIKE '@iu.edu';"], right: "The pattern lacks %, so it only matches a value that is exactly “@iu.edu” and every row is returned", wrong: [
      { t: "NOT LIKE doesn't exist; it should be <code>&lt;&gt; LIKE</code>", why: "NOT LIKE is valid SQL; &lt;&gt; LIKE isn't." },
      { t: "Single quotes should be double quotes", why: "SQL Server string literals use single quotes." },
      { t: "Email patterns need = instead of LIKE", why: "= needs the whole value to match exactly, which can't express “ends with”." }] },
    { goal: "list lines over $200, largest first", code: ["SELECT OrderID, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE LineTotal > 200", "ORDER BY LineTotal DESC;"], right: "WHERE can't see the alias; repeat <code>(Quantity * SalePrice)</code> in WHERE", wrong: [
      { t: "ORDER BY can't use the alias either", why: "ORDER BY runs after SELECT, so it can." },
      { t: "Quantity * SalePrice needs to be a stored column", why: "Calculated columns are computed at query time; nothing needs storing." },
      { t: "DESC should be ASC to find large values", why: "DESC is correct for largest first; the error comes from WHERE." }] },
    { goal: "list every product with its store name, including products whose store is missing", code: ["SELECT p.ProductID, p.ProductName, s.StoreName", "FROM dbo.PRODUCTS p", "INNER JOIN dbo.STORES s ON p.StoreID = s.StoreID;"], right: "INNER JOIN drops products whose StoreID matches no store; it should be PRODUCTS LEFT JOIN STORES", wrong: [
      { t: "STORES should be listed first with an INNER JOIN", why: "Swapping tables doesn't change what an INNER JOIN keeps. Unmatched products still vanish." },
      { t: "StoreName must be in a GROUP BY", why: "There are no aggregates here, so no GROUP BY is needed." },
      { t: "The ON clause should compare ProductID to StoreID", why: "StoreID to StoreID is the right key match." }] },
  ];
  const fillBank = [
    { goal: "customers with a non-IU email, by last name", lines: ["SELECT CustomerID, LastName, SchoolEmail", "FROM dbo.CUSTOMERS", "____", "ORDER BY LastName;"], right: "WHERE SchoolEmail NOT LIKE '%@iu.edu'", wrong: [
      { t: "WHERE SchoolEmail LIKE '%@iu.edu'", why: "Returns the compliant customers." }, { t: "GROUP BY SchoolEmail", why: "Grouping doesn't filter, and there's no aggregate to group for." }, { t: "WHERE SchoolEmail <> '%@iu.edu'", why: "&lt;&gt; doesn't understand %, so it compares to the literal text and returns nearly everything." }] },
    { goal: "orders per storefront", lines: ["SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders", "FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID", "____", "ORDER BY TotalOrders DESC;"], right: "GROUP BY s.StoreName", wrong: [
      { t: "GROUP BY TotalOrders", why: "You group by the category (store), not the aggregate, and the alias doesn't exist yet in GROUP BY." }, { t: "WHERE COUNT(o.OrderID) > 0", why: "Aggregates can't go in WHERE; WHERE runs before grouping." }, { t: "GROUP BY o.OrderID", why: "One group per order makes every count 1." }] },
    { goal: "products with no sales", lines: ["SELECT p.ProductID, p.ProductName", "FROM dbo.PRODUCTS p", "____", "WHERE oi.OrderID IS NULL;"], right: "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", wrong: [
      { t: "INNER JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID", why: "INNER JOIN removes the unsold products, so IS NULL finds nothing." }, { t: "LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.OrderID", why: "Matches a product ID to an order ID, unrelated keys." }, { t: "LEFT JOIN dbo.ORDER_ITEMS oi", why: "A join needs an ON condition saying how rows match." }] },
    { goal: "big discounts, largest first", lines: ["SELECT oi.OrderID, (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", "WHERE (p.BasePrice - oi.SalePrice) > 25", "____"], right: "ORDER BY PriceDifference DESC;", wrong: [
      { t: "ORDER BY PriceDifference;", why: "Ascending puts the smallest qualifying discounts first." }, { t: "ORDER BY 'PriceDifference' DESC;", why: "Quoted, it's a constant text value, not the column. SQL Server rejects a constant in ORDER BY." }, { t: "WHERE PriceDifference DESC;", why: "WHERE filters, it doesn't sort, and it can't use the alias." }] },
    { goal: "orphaned orders", lines: ["SELECT o.OrderID, o.CustomerID", "FROM dbo.ORDERS o", "LEFT JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID", "____"], right: "WHERE c.CustomerID IS NULL;", wrong: [
      { t: "WHERE o.CustomerID IS NULL;", why: "Orphans usually have a CustomerID; it's the <em>customer</em> side that comes back NULL." }, { t: "WHERE c.CustomerID IS NOT NULL;", why: "That keeps the matched orders, the opposite." }, { t: "WHERE c.CustomerID = NULL;", why: "= NULL is never true." }] },
    { goal: "the five most expensive valid lines", lines: ["____ OrderID, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE Quantity > 0", "ORDER BY LineTotal DESC;"], right: "SELECT TOP (5)", wrong: [
      { t: "SELECT", why: "Without TOP every valid line comes back." }, { t: "SELECT DISTINCT", why: "DISTINCT removes duplicate rows; it doesn't limit the count to five." }, { t: "WHERE TOP (5)", why: "TOP belongs in SELECT, not WHERE." }] },
  ];
  const COL_SCEN = [
    { q: "Email compliance: give the outreach team the customers to contact about non-IU addresses.", ok: ["CustomerID", "FirstName", "LastName", "SchoolEmail"], no: ["Major", "GradYear", "Phone"], why: "The team needs to know who to contact and which address is wrong." },
    { q: "Price audit: show which sales fell more than $25 below catalog, and by how much.", ok: ["oi.OrderID", "p.ProductName", "p.BasePrice", "oi.SalePrice", "PriceDifference"], no: ["p.StoreID", "oi.Quantity", "c.SchoolEmail"], why: "The reviewer needs the sale, the product, both prices and the gap to judge each exception." },
    { q: "Orders per store: report how many orders each storefront has taken.", ok: ["s.StoreName", "COUNT(o.OrderID)"], no: ["o.OrderDate", "o.CustomerID", "s.StoreID, s.StoreName, o.OrderID"], why: "One row per store with its count. Order-level details would break the grouping." },
    { q: "Unsold inventory: list catalog products with no sales so merchandising can decide what to do.", ok: ["p.ProductID", "p.ProductName", "p.BasePrice", "p.StoreID"], no: ["oi.SalePrice", "oi.Quantity", "c.LastName"], why: "Product identity, price and owning store drive the decision. Sales columns are NULL for these rows anyway." },
  ];

  const writeGen = STUDY.makeGenerator({
    id: "k201-ch10-write",
    name: "Writing purpose-driven queries",
    blurb: "Pick the right full query, spot the bug, fill the missing clause, and predict sort order and TOP results.",
    variants: [
      {
        name: "Pick the query that answers the question",
        make() {
          const e = U.rotate("ch10-fq", fullQueryBank());
          return Q.mc({
            q: `<p><b>Business question:</b> ${e.q}</p><p>Which query answers it?</p>`,
            right: e.right, rightWhy: "Right rows (filter), right columns, right join and the requested order.",
            wrong: e.wrong,
            sol: S("Check each candidate against the question part by part: which rows (WHERE / join), which columns (SELECT), and in what order (ORDER BY, ASC vs DESC).", "Eliminate any option that errors (alias in WHERE, missing GROUP BY) or runs but answers a different question."),
          });
        },
      },
      {
        name: "Spot the bug",
        make() {
          const e = U.rotate("ch10-bug", bugBank);
          return Q.mc({
            q: `<p>An analyst wants to ${e.goal}.</p>${sql(...e.code)}<p>What is wrong with this query?</p>`,
            right: e.right, rightWhy: "That is the line that stops the query from answering the goal.",
            wrong: e.wrong,
            sol: S("Ask two questions: will it run (clause order, aliases, GROUP BY rule)? If so, does each row it returns, and each row it skips, match the goal?", `The bug: ${e.right}.`),
          });
        },
      },
      {
        name: "Complete the missing clause",
        make() {
          const e = U.rotate("ch10-fill", fillBank);
          return Q.mc({
            q: `<p>Goal: ${e.goal}. Which line belongs in the blank?</p>${sql(...e.lines)}`,
            right: ic(e.right), rightWhy: "It is the only line that makes the query run and match the goal.",
            wrong: e.wrong.map(w => ({ t: ic(w.t), why: w.why })),
            sol: S("Use the written order to work out which clause is missing (SELECT, FROM, JOIN, WHERE, GROUP BY or ORDER BY), then choose the version that fits the goal.", `Missing line: <code>${esc(e.right)}</code>.`),
          });
        },
      },
      {
        name: "Predict the sort order",
        make() {
          for (let t = 0; t < 60; t++) {
            const rows = mkCustomers();
            if (!rows) continue;
            const desc1 = Math.random() < 0.5;
            const k1 = "GradYear", k2 = "LastName";
            const cmp = (a, b) => (desc1 ? b[k1] - a[k1] : a[k1] - b[k1]) || a[k2].localeCompare(b[k2]);
            const sorted = rows.slice().sort(cmp);
            const hasTie = sorted.some((r, i) => i > 0 && r[k1] === sorted[i - 1][k1]);
            if (!hasTie) continue;
            const pos = U.randInt(1, Math.min(4, rows.length));
            const right = sorted[pos - 1];
            const alt1 = rows.slice().sort((a, b) => a[k2].localeCompare(b[k2]) || (desc1 ? b[k1] - a[k1] : a[k1] - b[k1]));
            const alt2 = rows.slice().sort((a, b) => (desc1 ? a[k1] - b[k1] : b[k1] - a[k1]) || a[k2].localeCompare(b[k2]));
            const why = r => {
              const p = sorted.indexOf(r) + 1;
              if (alt1[pos - 1] === r) return `That is position ${pos} if you sort by LastName first. The first ORDER BY column wins; LastName only breaks ties. (Correct position: ${p}.)`;
              if (alt2[pos - 1] === r) return `That is position ${pos} if GradYear runs the other direction. Check ASC (default) vs DESC. (Correct position: ${p}.)`;
              return `In the correct order this row lands in position ${p}.`;
            };
            const wrong = U.sample(rows.filter(r => r !== right), 3);
            const lab = r => `${r.LastName} (${r.GradYear})`;
            return Q.mc({
              q: `${table("dbo.CUSTOMERS", [{ k: "CustomerID" }, { k: "LastName" }, { k: "GradYear" }], rows)}${sql("SELECT CustomerID, LastName, GradYear", "FROM dbo.CUSTOMERS", `ORDER BY GradYear${desc1 ? " DESC" : ""}, LastName;`)}<p>Which customer appears in position <b>${pos}</b> of the result?</p>`,
              right: lab(right), rightWhy: `Sorted: ${sorted.map(lab).join(" → ")}.`,
              wrong: wrong.map(r => ({ t: lab(r), why: why(r) })),
              sol: S(`Sort by the first column (GradYear, ${desc1 ? "DESC: newest first" : "ascending by default: earliest first"}). Use LastName (A→Z) only to break ties within a year.`,
                `Full order: ${sorted.map(lab).join(" → ")}.`, `Position ${pos}: <b>${lab(right)}</b>.`),
            });
          }
          return null;
        },
      },
      {
        name: "Which rows does TOP (n) keep?",
        make() {
          for (let t = 0; t < 80; t++) {
            const rows = mkItems({ n: 8 });
            const lt = r => cents(r.Quantity * r.SalePrice);
            const valid = rows.filter(r => r.Quantity > 0).sort((a, b) => lt(b) - lt(a));
            const n = U.randInt(2, 4);
            if (valid.length <= n || lt(valid[n - 1]) === lt(valid[n])) continue;
            const top = valid.slice(0, n);
            const byPrice = rows.slice().sort((a, b) => b.SalePrice - a.SalePrice);
            return Q.multi({
              q: `${table("dbo.ORDER_ITEMS", [{ k: "OrderID" }, { k: "Quantity" }, { k: "SalePrice", money: true }], rows)}${sql(`SELECT TOP (${n}) OrderID, Quantity, SalePrice,`, "       (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", "WHERE Quantity > 0", "ORDER BY LineTotal DESC;")}<p>Select <b>every</b> OrderID this query returns.</p>`,
              options: rows.map(r => ({ t: `OrderID ${r.OrderID}`, ok: top.includes(r),
                why: r.Quantity <= 0 ? `Quantity ${r.Quantity} fails WHERE Quantity &gt; 0, so it never reaches the sort.` : top.includes(r) ? `LineTotal ${m2(lt(r))} is among the ${n} largest valid lines.` : `LineTotal ${m2(lt(r))} isn't in the top ${n}${byPrice.indexOf(r) < n ? " (its unit price is high, but the sort is on quantity × price)" : ""}.` })),
              sol: S("Run it in execution order: WHERE removes bad quantities first, SELECT computes LineTotal, ORDER BY sorts largest first, and TOP keeps the first n.",
                `Valid lines by LineTotal: ${valid.map(r => `${r.OrderID} (${m2(lt(r))})`).join(", ")}.`, `TOP (${n}) keeps: <b>${top.map(r => r.OrderID).join(", ")}</b>.`),
            });
          }
          return null;
        },
      },
      {
        name: "Choose the columns to share",
        make() {
          const sc = U.rotate("ch10-cols", COL_SCEN);
          const ok = U.sample(sc.ok, Math.min(sc.ok.length, U.randInt(2, 4)));
          const no = U.sample(sc.no, U.randInt(1, 2));
          return Q.multi({
            q: `<p>${sc.q}</p><p>Which of these belong in the SELECT list of the query you share? Select all that apply.</p>`,
            options: [...ok.map(c => ({ t: ic(c), ok: true, why: sc.why })), ...no.map(c => ({ t: ic(c), ok: false, why: "Not needed for this question. Extra fields add noise and expose data nobody asked for (SELECT * is for exploring, not sharing)." }))],
            sol: S("A shared query returns only what the question needs: enough to identify each row and act on it.", `${sc.why}`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 4 · Calculated columns & aliases
   * ============================================================ */
  const CATALOG = [["Desk Lamp", 80], ["Hoodie", 65], ["Backpack", 95], ["Headphones", 150], ["Water Bottle", 30], ["Planner", 40], ["Keyboard", 110], ["Mug Set", 45], ["Blanket", 70], ["Jacket", 180]];
  function mkPriceRows() {
    const n = U.randInt(6, 7);
    const prods = U.sample(CATALOG, n);
    const base = U.randInt(51, 89) * 100;
    return prods.map(([name, bp], i) => {
      const disc = U.pick([0, 5, 10, 15, 20, 25, 25, 30, 35, 40, 60, -5]);
      return { OrderID: base + i * 3, ProductName: name, BasePrice: bp, SalePrice: Math.max(5, bp - disc) };
    });
  }
  const PRICE_COLS = [{ k: "OrderID", h: "oi.OrderID" }, { k: "ProductName", h: "p.ProductName" }, { k: "BasePrice", h: "p.BasePrice", money: true }, { k: "SalePrice", h: "oi.SalePrice", money: true }];
  const priceQuery = d => sql("SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice,", "       (p.BasePrice - oi.SalePrice) AS PriceDifference", "FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID", d != null ? `WHERE (p.BasePrice - oi.SalePrice) > ${d}` : null, "ORDER BY PriceDifference DESC;");
  const ITEM_COLS = [{ k: "OrderID" }, { k: "ProductID" }, { k: "Quantity" }, { k: "SalePrice", money: true }];
  const aliasBank = [
    { q: "After running a query with <code>(Quantity * SalePrice) AS LineTotal</code>, what has changed in the ORDER_ITEMS table?", right: "Nothing; LineTotal exists only in the query's result", rightWhy: "A calculated column is computed for the output; the stored data is untouched.",
      wrong: [{ t: "A new LineTotal column was added to the table", why: "AS only labels the output. Adding columns requires an ALTER TABLE, which this isn't." }, { t: "SalePrice was overwritten with the line total", why: "SELECT never modifies stored values." }, { t: "LineTotal is saved until the file is closed", why: "It lives only in that result set; the next query knows nothing about it." }],
      sol: ["What kind of statement is SELECT: read or write?", "SELECT only reads. AS names a column in the output; the database is unchanged."] },
    { q: "Why write <code>FROM dbo.ORDER_ITEMS oi</code> and then <code>oi.SalePrice</code>?", right: "The table alias is a short name that also says which table a column comes from when two tables share column names", rightWhy: "Joined tables often both have ProductID or StoreID; the prefix removes the ambiguity.",
      wrong: [{ t: "oi is required by SQL Server before any column name", why: "Aliases are optional in single-table queries; they matter most with joins." }, { t: "It creates a copy of the table called oi", why: "Nothing is copied; oi is just a nickname for this query." }, { t: "It makes SalePrice a calculated column", why: "A prefix doesn't calculate anything; it only says where the column lives." }],
      sol: ["Think about a join between ORDER_ITEMS and PRODUCTS: both have ProductID.", "Writing oi.ProductID or p.ProductID tells SQL Server (and readers) exactly which one you mean."] },
    { q: "PriceDifference is defined as <code>(p.BasePrice - oi.SalePrice)</code>. A row shows PriceDifference = −5. What happened?", right: "The item sold for $5 more than its catalog price", rightWhy: "BasePrice − SalePrice is negative only when SalePrice is higher.",
      wrong: [{ t: "The item sold for $5 below catalog", why: "Below-catalog sales give a positive difference with this subtraction order." }, { t: "The sale has a data error because differences can't be negative", why: "Negative is perfectly possible; it means a markup, not an error." }, { t: "The quantity was −5", why: "Quantity isn't in this calculation." }],
      sol: ["Plug in numbers: if BasePrice is 50, what SalePrice gives −5?", "50 − SalePrice = −5 → SalePrice = 55, which is above catalog."] },
    { q: "A Quantity_Audit result has a row with Quantity −2 and SalePrice $40. What is that row's dollar effect on total revenue?", right: "It lowers revenue by $80 (−2 × $40)", rightWhy: "Quantity × SalePrice = −80, so a SUM of line values drops by 80.",
      wrong: [{ t: "It lowers revenue by $40", why: "That ignores the quantity; the line value is quantity times price." }, { t: "None, because SUM ignores negative values", why: "SUM ignores NULLs, not negatives. Negatives are added in." }, { t: "It raises revenue by $80", why: "A negative quantity times a positive price is negative." }],
      sol: ["Measure impact with the same calculation revenue uses: Quantity × SalePrice.", "−2 × $40 = −$80, which pulls any revenue total down by $80."] },
    { q: "Which statement about <code>AS</code> is correct?", right: "It assigns a label to an output column or a short name to a table", rightWhy: "Both uses rename for the duration of the query only.",
      wrong: [{ t: "It converts a column to a different data type", why: "That's CAST/CONVERT, not AS on its own." }, { t: "It filters rows like WHERE", why: "AS names things; it never removes rows." }, { t: "It must be followed by a quoted string", why: "Aliases are usually bare names like LineTotal; quotes aren't required." }],
      sol: ["Recall the two places you have seen AS / aliases in this chapter.", "Column alias: (Quantity * SalePrice) AS LineTotal. Table alias: dbo.ORDERS o. Both are labels only."] },
  ];

  const calcGen = STUDY.makeGenerator({
    id: "k201-ch10-calc",
    name: "Calculated columns & aliases",
    blurb: "Compute LineTotal and PriceDifference from a table, count rows over a threshold, and size the dollar impact of bad records.",
    variants: [
      {
        name: "Compute a LineTotal",
        make() {
          const rows = mkItems({ bad: 0 });
          const r = U.pick(rows);
          const ans = cents(r.Quantity * r.SalePrice);
          return Q.num({
            unit: "$",
            q: `${table("dbo.ORDER_ITEMS", ITEM_COLS, rows)}${sql("SELECT OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS;")}<p>What value appears in the <b>LineTotal</b> column for OrderID <b>${r.OrderID}</b>?</p>`,
            answer: ans,
            traps: dedupeTraps(ans, [{ value: r.Quantity + r.SalePrice, why: "You added quantity and price; the expression multiplies them." }, { value: r.SalePrice, why: "That's the unit price, before multiplying by quantity." }]),
            sol: S("A calculated column is evaluated row by row using that row's own values.", `OrderID ${r.OrderID}: ${r.Quantity} × ${m2(r.SalePrice)} = <b>${U.money(ans, 2)}</b>.`),
          });
        },
      },
      {
        name: "Compute a PriceDifference",
        make() {
          let rows, r;
          do { rows = mkPriceRows(); r = U.pick(rows); } while (r.BasePrice === r.SalePrice);
          const ans = r.BasePrice - r.SalePrice;
          return Q.num({
            unit: "$",
            q: `${table("Joined rows (ORDER_ITEMS oi + PRODUCTS p)", PRICE_COLS, rows)}${priceQuery(null)}<p>What is <b>PriceDifference</b> for OrderID <b>${r.OrderID}</b> (${r.ProductName})? Use a minus sign if it is negative.</p>`,
            answer: ans,
            traps: dedupeTraps(ans, [{ value: -ans, why: "Sign flipped: the expression is BasePrice − SalePrice, not SalePrice − BasePrice." }, { value: r.SalePrice, why: "That's the sale price itself, not the difference." }]),
            sol: S("Follow the expression exactly as written: BasePrice minus SalePrice. Positive means sold below catalog.", `${m2(r.BasePrice)} − ${m2(r.SalePrice)} = <b>${U.money(ans, 2)}</b>${ans < 0 ? " (negative: sold above catalog)" : ""}.`),
          });
        },
      },
      {
        name: "Count lines over a threshold",
        make() {
          for (let t = 0; t < 80; t++) {
            const rows = mkItems({ bad: U.randInt(0, 1) });
            const thr = U.pick([100, 120, 150, 180, 200, 240]);
            const lt = r => cents(r.Quantity * r.SalePrice);
            const k = rows.filter(r => lt(r) > thr).length;
            if (k < 1 || k > rows.length - 1) continue;
            return Q.num({
              kind: "count",
              q: `${table("dbo.ORDER_ITEMS", ITEM_COLS, rows)}${sql("SELECT OrderID, Quantity, SalePrice,", "       (Quantity * SalePrice) AS LineTotal", "FROM dbo.ORDER_ITEMS", `WHERE (Quantity * SalePrice) > ${thr}`, "ORDER BY LineTotal DESC;")}<p>How many rows does this High_Value_Lines query return?</p>`,
              answer: k,
              traps: dedupeTraps(k, [
                { value: rows.filter(r => r.SalePrice > thr).length, why: "You compared the unit price to the threshold; the WHERE uses quantity × price." },
                { value: rows.filter(r => lt(r) >= thr).length, why: "&gt; is strict: a line exactly at the threshold is not included." },
                { value: rows.length - k, why: "That's the rows that fail the filter." },
              ]),
              sol: S("Compute LineTotal for every row, then keep those strictly above the threshold.", ul(rows.map(r => `${r.OrderID}: ${r.Quantity} × ${m2(r.SalePrice)} = ${m2(lt(r))} ${lt(r) > thr ? "→ <b>kept</b>" : "→ dropped"}`)), `<b>${k}</b> ${U.plural(k, "row")}.`),
            });
          }
          return null;
        },
      },
      {
        name: "Count the price exceptions",
        make() {
          for (let t = 0; t < 80; t++) {
            const rows = mkPriceRows();
            const d = U.pick([20, 25, 25, 30]);
            const diff = r => r.BasePrice - r.SalePrice;
            const k = rows.filter(r => diff(r) > d).length;
            if (k < 1 || k > rows.length - 1) continue;
            return Q.num({
              kind: "count",
              q: `<p>Requirement: no sale may be more than $${d} below the catalog BasePrice without authorization.</p>${table("Joined rows (ORDER_ITEMS oi + PRODUCTS p)", PRICE_COLS, rows)}${priceQuery(d)}<p>How many rows does the Price_Audit query return?</p>`,
              answer: k,
              traps: dedupeTraps(k, [
                { value: rows.filter(r => diff(r) >= d).length, why: `&gt; ${d} is strict: a difference of exactly ${d} is within policy and not returned.` },
                { value: rows.filter(r => -diff(r) > d).length, why: "You subtracted the other way (SalePrice − BasePrice)." },
                { value: rows.filter(r => diff(r) > 0).length, why: "That counts every discount; only differences above the limit are exceptions." },
              ]),
              sol: S("PriceDifference = BasePrice − SalePrice; positive means sold below catalog. Keep only differences strictly greater than the limit.",
                ul(rows.map(r => `${r.ProductName}: ${m2(r.BasePrice)} − ${m2(r.SalePrice)} = ${diff(r)} ${diff(r) > d ? "→ <b>exception</b>" : "→ within policy"}`)), `<b>${k}</b> ${U.plural(k, "exception")}.`),
            });
          }
          return null;
        },
      },
      {
        name: "Dollar impact of bad quantities",
        make() {
          const rows = mkItems({ bad: U.randInt(1, 2) });
          if (!rows.some(r => r.Quantity < 0)) rows[0].Quantity = -1;
          const bad = rows.filter(r => r.Quantity < 1);
          const ans = cents(bad.reduce((a, r) => a + r.Quantity * r.SalePrice, 0));
          return Q.num({
            unit: "$",
            q: `${table("dbo.ORDER_ITEMS", ITEM_COLS, rows)}<p>The Quantity_Audit query (${ic("WHERE Quantity < 1")}) flags the problem rows. Add up <b>Quantity × SalePrice</b> over just those rows. That is how much they change a revenue total. Enter the amount with its sign.</p>`,
            answer: ans,
            traps: dedupeTraps(ans, [
              { value: -ans, why: "Right size, wrong sign: negative quantities <em>reduce</em> a revenue sum." },
              { value: -cents(bad.reduce((a, r) => a + r.SalePrice, 0)), why: "You used the sale prices without multiplying by the quantities." },
              { value: cents(rows.reduce((a, r) => a + r.Quantity * r.SalePrice, 0)), why: "That's the all-records total, not the effect of the flagged rows." },
            ]),
            sol: S("Use the same calculation revenue uses (Quantity × SalePrice), applied only to the flagged rows. Zero-quantity rows contribute nothing; negatives subtract.",
              ul(bad.map(r => `${r.OrderID}: ${r.Quantity} × ${m2(r.SalePrice)} = ${m2(cents(r.Quantity * r.SalePrice))}`)), `Total effect: <b>${U.money(ans, 2)}</b>.`),
          });
        },
      },
      {
        name: "Work backward from a calculated value",
        make() {
          const q = U.randInt(2, 5), p = U.pick(PRICES);
          const lt = cents(q * p);
          return Q.num({
            unit: "$",
            q: `<p>A High_Value_Lines result row shows Quantity = <b>${q}</b> and LineTotal = <b>${m2(lt)}</b>, where ${ic("(Quantity * SalePrice) AS LineTotal")}.</p><p>What SalePrice must be stored for that row?</p>`,
            answer: p,
            traps: dedupeTraps(p, [{ value: cents(lt - q), why: "You subtracted the quantity; the expression multiplies, so divide to reverse it." }, { value: cents(lt * q), why: "Multiplying again goes the wrong way; divide LineTotal by Quantity." }]),
            sol: S("Reverse the calculation: if LineTotal = Quantity × SalePrice, then SalePrice = LineTotal ÷ Quantity.", `${m2(lt)} ÷ ${q} = <b>${U.money(p, 2)}</b>.`),
          });
        },
      },
      {
        name: "Write the calculated column",
        make() {
          const opts = [
            { ask: "how far each sale fell <b>below</b> the catalog price", right: "(p.BasePrice - oi.SalePrice) AS PriceDifference", wrong: [
              { t: "(oi.SalePrice - p.BasePrice) AS PriceDifference", why: "Reversed: below-catalog sales come out negative, so a “&gt; 25” check finds nothing." },
              { t: "'p.BasePrice - oi.SalePrice' AS PriceDifference", why: "Quotes make it a text literal: every row shows the same words." },
              { t: "(p.BasePrice + oi.SalePrice) AS PriceDifference", why: "A difference needs subtraction." }] },
            { ask: "the dollar value of each line (units × price)", right: "(oi.Quantity * oi.SalePrice) AS LineTotal", wrong: [
              { t: "(oi.Quantity + oi.SalePrice) AS LineTotal", why: "Adding units to dollars has no meaning; multiply." },
              { t: "SUM(oi.Quantity * oi.SalePrice) AS LineTotal", why: "SUM collapses rows into one total, not a per-line value (and would need GROUP BY with the other columns)." },
              { t: "AS LineTotal (oi.Quantity * oi.SalePrice)", why: "The alias goes after the expression: expression AS name." }] },
            { ask: "each product's markup over its unit cost", right: "(p.BasePrice - p.UnitCost) AS Markup", wrong: [
              { t: "(p.UnitCost - p.BasePrice) AS Markup", why: "Reversed: profitable products would show negative markups." },
              { t: "(p.BasePrice / p.UnitCost) AS Markup", why: "That's a ratio, not a dollar markup." },
              { t: "Markup AS (p.BasePrice - p.UnitCost)", why: "Backwards syntax: the expression comes first, then AS and the label." }] },
          ];
          const e = U.pick(opts);
          return Q.mc({
            q: `<p>You need a column showing ${e.ask}. Which SELECT item is correct?</p>`,
            right: ic(e.right), rightWhy: "Right arithmetic, right order of operands, and the alias after AS.",
            wrong: e.wrong.map(w => ({ t: ic(w.t), why: w.why })),
            sol: S("Write the arithmetic the business definition describes, check which value comes first in a subtraction, then append AS and a clear label.", `Answer: <code>${esc(e.right)}</code>.`),
          });
        },
      },
      K.conceptVariant("Aliases and impact: explain", "ch10-alias", aliasBank),
    ],
  });

  /* ============================================================
   * TOPIC 5 · Joins: matched records vs. gaps
   * ============================================================ */
  function mkJoin() {
    for (let t = 0; t < 60; t++) {
      const nc = U.randInt(4, 6), cb = U.randInt(2, 9) * 100, ob = U.randInt(30, 89) * 100;
      const ls = U.sample(LAST, nc);
      const cust = ls.map((l, i) => ({ CustomerID: cb + i + 1, LastName: l }));
      const ids = cust.map(c => c.CustomerID);
      const zero = new Set(U.sample(ids, U.randInt(1, 2)));
      const active = ids.filter(i => !zero.has(i));
      const no = U.randInt(5, 7);
      const orphanCount = U.randInt(1, 2);
      const orders = [];
      for (let i = 0; i < no; i++) {
        const orphan = i < orphanCount;
        orders.push({ OrderID: ob + i + 1, CustomerID: orphan ? cb + nc + U.randInt(3, 9) * (i + 1) : U.pick(active) });
      }
      const sh = U.shuffle(orders).map((o, i) => ({ ...o, OrderID: ob + i + 1 }));
      const per = id => sh.filter(o => o.CustomerID === id).length;
      if (!ids.some(id => per(id) >= 2)) continue;
      if (new Set(sh.filter(o => !ids.includes(o.CustomerID)).map(o => o.CustomerID)).size !== sh.filter(o => !ids.includes(o.CustomerID)).length) continue;
      return { cust, orders: sh, ids, per };
    }
    return null;
  }
  const custTbl = j => table("dbo.CUSTOMERS", [{ k: "CustomerID" }, { k: "LastName" }], j.cust);
  const ordTbl = j => table("dbo.ORDERS", [{ k: "OrderID" }, { k: "CustomerID" }], j.orders);
  const twoTables = j => `<div style="display:flex;flex-wrap:wrap;gap:16px"><div style="flex:1;min-width:150px">${custTbl(j)}</div><div style="flex:1;min-width:150px">${ordTbl(j)}</div></div>`;
  const JPAIRS = [
    { L: "dbo.CUSTOMERS c", R: "dbo.ORDERS o", on: "c.CustomerID = o.CustomerID", rk: "o.OrderID", lk: "c.CustomerID", Ln: "customers", Rn: "orders",
      qs: { inner: "Pair each order with the customer who placed it, keeping only complete matches.", all: "List every customer with their orders, keeping customers who have never ordered.", gap: "Find registered customers who have never placed an order.", rgap: "Find orders whose CustomerID matches no registered customer (orphaned orders)." } },
    { L: "dbo.PRODUCTS p", R: "dbo.ORDER_ITEMS oi", on: "p.ProductID = oi.ProductID", rk: "oi.OrderID", lk: "p.ProductID", Ln: "products", Rn: "line items",
      qs: { inner: "Show each line item with its product's catalog details, for sales of products that exist.", all: "List every catalog product with any sales it has, keeping products that never sold.", gap: "Find catalog products that have no sales records.", rgap: "Find line items for products that aren't in the catalog." } },
    { L: "dbo.STORES s", R: "dbo.PRODUCTS p", on: "s.StoreID = p.StoreID", rk: "p.ProductID", lk: "s.StoreID", Ln: "stores", Rn: "products",
      qs: { inner: "Show each product alongside the name of the store that carries it, only where the store exists.", all: "List every store with its products, keeping stores that carry nothing yet.", gap: "Find stores that have no products in the catalog.", rgap: "Find products whose StoreID points to no existing store." } },
  ];
  function joinSnippet(pr, kind) {
    const [Ltab, Rtab] = kind === "rgap" ? [pr.R, pr.L] : [pr.L, pr.R];
    const lines = [`FROM ${Ltab}`, `${kind === "inner" ? "INNER" : "LEFT"} JOIN ${Rtab} ON ${pr.on}`];
    if (kind === "gap") lines.push(`WHERE ${pr.rk} IS NULL`);
    if (kind === "rgap") lines.push(`WHERE ${pr.lk} IS NULL`);
    return sql(...lines);
  }
  const joinWhy = (pr, kind) => ({
    inner: `INNER JOIN keeps only matched pairs, so ${pr.Ln} with no ${pr.Rn} (and ${pr.Rn} with no ${pr.Ln}) silently vanish.`,
    all: `This keeps every one of the ${pr.Ln}, but without an IS NULL filter it also returns all the matched rows.`,
    gap: `This returns only ${pr.Ln} with no matching ${pr.Rn}: the gaps on the ${pr.Ln} side.`,
    rgap: `The tables are flipped: this keeps all ${pr.Rn} and returns the ones with no matching ${pr.Ln}.`,
  })[kind];
  const joinBank = [
    { q: "Exercise: find orphaned orders. A classmate's INNER JOIN of ORDERS to CUSTOMERS with <code>WHERE c.CustomerID IS NULL</code> returns zero rows. What should they conclude?", right: "Nothing yet; INNER JOIN can't show orphans, so rerun it as ORDERS LEFT JOIN CUSTOMERS", rightWhy: "Zero rows here is a property of the join, not of the data.",
      wrong: [{ t: "There are no orphaned orders", why: "INNER JOIN discards unmatched orders before WHERE runs. The query couldn't have found any." }, { t: "The CUSTOMERS table must be empty", why: "Then the join would return nothing at all, with or without WHERE. It says nothing about orphans." }, { t: "IS NULL should be = NULL", why: "= NULL never matches; IS NULL is correct. The join type is the problem." }],
      sol: ["What happens to an unmatched order in an INNER JOIN?", "It is dropped. To keep it and see the NULL customer columns, LEFT JOIN from ORDERS."] },
    { q: "In <code>FROM dbo.CUSTOMERS c LEFT JOIN dbo.ORDERS o ON c.CustomerID = o.CustomerID</code>, a row shows o.OrderID = NULL. What does it mean?", right: "That customer has no matching order", rightWhy: "LEFT JOIN fills the right side with NULLs when nothing matches.",
      wrong: [{ t: "That order is missing its OrderID", why: "There is no order on this row; the NULLs were created by the join." }, { t: "The query has an error", why: "NULLs are exactly how LEFT JOIN shows a gap." }, { t: "The customer is orphaned", why: "Orphans are child rows (orders) pointing to missing parents. A customer without orders is the other kind of gap." }],
      sol: ["LEFT JOIN keeps every left-table row. What fills the right-table columns when there is no partner?", "NULL. So o.OrderID NULL = this customer placed no orders."] },
    { q: "Products_Per_Store: the store counts from an INNER JOIN add up to 46, but <code>SELECT COUNT(*) FROM dbo.PRODUCTS</code> returns 49. What is the most likely explanation?", right: "3 products have a StoreID that matches no store, so the INNER JOIN dropped them", rightWhy: "A correct-looking total isn't the same as a complete one.",
      wrong: [{ t: "COUNT(*) double-counts products", why: "COUNT(*) counts each row once." }, { t: "Three stores have no products", why: "Empty stores add zero to both totals; they can't explain extra products." }, { t: "GROUP BY loses rows when store names are long", why: "GROUP BY never drops rows by name length." }],
      sol: ["Which rows can an INNER JOIN lose?", "Rows with no match. Products whose StoreID isn't in STORES are excluded silently. Check with PRODUCTS LEFT JOIN STORES … WHERE s.StoreID IS NULL."] },
    { q: "Which table goes on the left to list every catalog product, including ones never sold?", right: "PRODUCTS: LEFT JOIN keeps every row of the first-named table", rightWhy: "The table you must not lose rows from goes first.",
      wrong: [{ t: "ORDER_ITEMS: sales data always comes first", why: "Then you'd keep every sale and lose unsold products." }, { t: "It doesn't matter with a LEFT JOIN", why: "Direction is the whole point: only the left table is fully kept." }, { t: "Whichever table is larger", why: "Size is irrelevant; the question decides." }],
      sol: ["LEFT JOIN protects which table's rows?", "The left (first) one. You need every product, so PRODUCTS goes first."] },
    { q: "Why are orphaned records described as “invisible” to an INNER JOIN?", right: "INNER JOIN only returns rows with a match in both tables, and an orphan has none", rightWhy: "So they are excluded without any error or warning.",
      wrong: [{ t: "SQL Server hides records with NULL keys from all queries", why: "A plain SELECT on the table shows them fine; only the join excludes them." }, { t: "Orphans are deleted automatically", why: "Nothing is deleted; they are simply not matched." }, { t: "They appear but with all columns NULL", why: "That's LEFT JOIN behaviour, which keeps them visible." }],
      sol: ["Recall INNER JOIN's rule for keeping a row.", "Both sides must match. An orphan's key points nowhere, so the row never appears."] },
  ];

  const joinGen = STUDY.makeGenerator({
    id: "k201-ch10-joins",
    name: "Joins: matched records vs. gaps",
    blurb: "Predict INNER and LEFT JOIN results on fresh tables, find the gaps with IS NULL, and pick the join that fits the question.",
    variants: [
      {
        name: "INNER JOIN row count",
        make() {
          const j = mkJoin();
          const inner = j.orders.filter(o => j.ids.includes(o.CustomerID)).length;
          const left = j.cust.reduce((a, c) => a + Math.max(1, j.per(c.CustomerID)), 0);
          return Q.num({
            kind: "count",
            q: `${twoTables(j)}${sql("SELECT o.OrderID, c.LastName", "FROM dbo.ORDERS o", "INNER JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID;")}<p>How many rows does this query return?</p>`,
            answer: inner,
            traps: dedupeTraps(inner, [
              { value: j.orders.length, why: "That counts every order, including the orphans INNER JOIN drops." },
              { value: j.cust.length, why: "That's the number of customers. The result has one row per matched order." },
              { value: left, why: "That's the CUSTOMERS LEFT JOIN ORDERS count (customers with no orders kept)." },
            ]),
            sol: S("INNER JOIN keeps one row per matching pair. Go through ORDERS and ask: does this CustomerID exist in CUSTOMERS?",
              ul(j.orders.map(o => `Order ${o.OrderID} → CustomerID ${o.CustomerID}: ${j.ids.includes(o.CustomerID) ? "match" : "<b>no match (orphan, dropped)</b>"}`)), `<b>${inner}</b> rows.`),
          });
        },
      },
      {
        name: "LEFT JOIN row count",
        make() {
          const j = mkJoin();
          const fromCust = Math.random() < 0.6;
          const inner = j.orders.filter(o => j.ids.includes(o.CustomerID)).length;
          const left = fromCust ? j.cust.reduce((a, c) => a + Math.max(1, j.per(c.CustomerID)), 0) : j.orders.length;
          const q = fromCust ? sql("SELECT c.CustomerID, c.LastName, o.OrderID", "FROM dbo.CUSTOMERS c", "LEFT JOIN dbo.ORDERS o ON c.CustomerID = o.CustomerID;") : sql("SELECT o.OrderID, o.CustomerID, c.LastName", "FROM dbo.ORDERS o", "LEFT JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID;");
          return Q.num({
            kind: "count",
            q: `${twoTables(j)}${q}<p>How many rows does this query return?</p>`,
            answer: left,
            traps: dedupeTraps(left, [
              { value: inner, why: "That's the INNER JOIN count; LEFT JOIN also keeps the unmatched left-table rows." },
              { value: fromCust ? j.cust.length : j.cust.length, why: fromCust ? "A customer with several orders appears once per order, not once overall." : "That's the number of customers; the left table here is ORDERS." },
              { value: fromCust ? j.orders.length : j.cust.reduce((a, c) => a + Math.max(1, j.per(c.CustomerID)), 0), why: fromCust ? "Orphan orders aren't kept when CUSTOMERS is on the left, and customers with no orders add a row each." : "That would be CUSTOMERS on the left. Direction matters." },
            ]),
            sol: S(`LEFT JOIN keeps every row of the left table (${fromCust ? "CUSTOMERS" : "ORDERS"}): one row per match, or one row with NULLs if there is no match.`,
              fromCust ? ul(j.cust.map(c => `${c.CustomerID} ${c.LastName}: ${j.per(c.CustomerID)} ${U.plural(j.per(c.CustomerID), "order")} → ${Math.max(1, j.per(c.CustomerID))} ${U.plural(Math.max(1, j.per(c.CustomerID)), "row")}`))
                : `Each order's CustomerID matches at most one customer, so every order gives exactly one row (orphans get NULL LastName).`,
              `<b>${left}</b> rows.`),
          });
        },
      },
      {
        name: "Find the gaps (LEFT JOIN + IS NULL)",
        make() {
          const j = mkJoin();
          const custSide = Math.random() < 0.5;
          if (custSide) {
            return Q.multi({
              q: `${twoTables(j)}${sql("SELECT c.CustomerID, c.LastName", "FROM dbo.CUSTOMERS c", "LEFT JOIN dbo.ORDERS o ON c.CustomerID = o.CustomerID", "WHERE o.OrderID IS NULL;")}<p>Select <b>every</b> customer this query returns.</p>`,
              options: j.cust.map(c => ({ t: `${c.CustomerID} ${c.LastName}`, ok: j.per(c.CustomerID) === 0,
                why: j.per(c.CustomerID) === 0 ? "No order has this CustomerID, so o.OrderID is NULL and the row survives." : `Has ${j.per(c.CustomerID)} ${U.plural(j.per(c.CustomerID), "order")}, so o.OrderID is filled in and IS NULL removes the row.` })),
              sol: S("LEFT JOIN keeps all customers; IS NULL on the orders side then keeps only those with no partner.", `Customers never appearing in ORDERS: <b>${j.cust.filter(c => !j.per(c.CustomerID)).map(c => c.CustomerID).join(", ")}</b>.`),
            });
          }
          return Q.multi({
            q: `${twoTables(j)}${sql("SELECT o.OrderID, o.CustomerID", "FROM dbo.ORDERS o", "LEFT JOIN dbo.CUSTOMERS c ON o.CustomerID = c.CustomerID", "WHERE c.CustomerID IS NULL;")}<p>Select <b>every</b> order this Orphaned_Orders query returns.</p>`,
            options: j.orders.map(o => ({ t: `Order ${o.OrderID}`, ok: !j.ids.includes(o.CustomerID),
              why: j.ids.includes(o.CustomerID) ? `CustomerID ${o.CustomerID} exists, so c.CustomerID is filled in and the row is filtered out.` : `CustomerID ${o.CustomerID} is not in CUSTOMERS, so c.CustomerID comes back NULL: an orphan.` })),
            sol: S("ORDERS is on the left, so every order is kept; c.CustomerID is NULL exactly when the order's customer doesn't exist.", `Orphans: <b>${j.orders.filter(o => !j.ids.includes(o.CustomerID)).map(o => o.OrderID).join(", ")}</b>.`),
          });
        },
      },
      {
        name: "Which join answers the question?",
        make() {
          const pr = U.pick(JPAIRS);
          const kinds = ["inner", "all", "gap", "rgap"];
          const k = U.rotate("ch10-jq", kinds);
          return Q.mc({
            q: `<p><b>Question:</b> ${pr.qs[k]}</p><p>Which FROM / JOIN / WHERE answers it?</p>`,
            right: joinSnippet(pr, k), rightWhy: joinWhy(pr, k),
            wrong: kinds.filter(x => x !== k).map(x => ({ t: joinSnippet(pr, x), why: joinWhy(pr, x) })),
            sol: S("Matched records only → INNER JOIN. Everything, gaps included → LEFT JOIN with the keep-all table first. Only the gaps → LEFT JOIN + WHERE (right-side key) IS NULL.",
              `This question wants ${{ inner: "matched records", all: "everything including the gaps", gap: `${pr.Ln} with no ${pr.Rn}`, rgap: `${pr.Rn} with no ${pr.Ln}` }[k]}.`),
          });
        },
      },
      {
        name: "Totals that don't add up (dropped rows)",
        make() {
          const ns = 3;
          const stores = U.sample(["Downtown", "Northside", "Online", "Campus", "Eastgate"], ns).map((s, i) => ({ StoreID: i + 1, StoreName: s }));
          const np = U.randInt(7, 9), pb = U.randInt(2, 6) * 10;
          const bad = U.randInt(1, 2);
          const prods = U.sample(CATALOG, np).map(([name, bp], i) => ({ ProductID: pb + i + 1, ProductName: name, StoreID: i < bad ? U.pick([4, 7, 9]) : U.randInt(1, ns) }));
          const sh = U.shuffle(prods);
          const matched = sh.filter(p => p.StoreID <= ns).length;
          const groups = new Set(sh.filter(p => p.StoreID <= ns).map(p => p.StoreID)).size;
          return Q.num({
            kind: "count",
            q: `<div style="display:flex;flex-wrap:wrap;gap:16px"><div style="flex:1;min-width:150px">${table("dbo.STORES", [{ k: "StoreID" }, { k: "StoreName" }], stores)}</div><div style="flex:2;min-width:220px">${table("dbo.PRODUCTS", [{ k: "ProductID" }, { k: "ProductName" }, { k: "StoreID" }], sh)}</div></div>${sql("SELECT s.StoreName, COUNT(p.ProductID) AS TotalProducts", "FROM dbo.PRODUCTS p", "INNER JOIN dbo.STORES s ON p.StoreID = s.StoreID", "GROUP BY s.StoreName;")}<p>If you add up the TotalProducts column, what total do you get?</p>`,
            answer: matched,
            traps: dedupeTraps(matched, [
              { value: sh.length, why: "That's SELECT COUNT(*) FROM dbo.PRODUCTS. The INNER JOIN silently drops products whose StoreID matches no store." },
              { value: groups, why: "That's the number of result rows (stores), not the sum of their counts." },
            ]),
            sol: S("Which products can an INNER JOIN to STORES lose? Any whose StoreID isn't in STORES.",
              `Products with a missing store: ${sh.filter(p => p.StoreID > ns).map(p => `${p.ProductID} (StoreID ${p.StoreID})`).join(", ")}. Dropped without warning.`,
              `Sum of TotalProducts = <b>${matched}</b>, versus ${sh.length} products in the table. A LEFT JOIN from PRODUCTS would show the missing ones with a NULL StoreName.`),
          });
        },
      },
      {
        name: "Write the ON clause",
        make() {
          const pr = U.pick([
            { from: "dbo.ORDERS o", join: "dbo.CUSTOMERS c", right: "o.CustomerID = c.CustomerID", unrelated: "o.OrderID = c.CustomerID", self: "c.CustomerID = c.CustomerID", full: "ORDERS.CustomerID = c.CustomerID", what: "orders with their customers" },
            { from: "dbo.ORDER_ITEMS oi", join: "dbo.PRODUCTS p", right: "oi.ProductID = p.ProductID", unrelated: "oi.OrderID = p.ProductID", self: "p.ProductID = p.ProductID", full: "ORDER_ITEMS.ProductID = p.ProductID", what: "line items with their products" },
            { from: "dbo.ORDERS o", join: "dbo.STORES s", right: "o.StoreID = s.StoreID", unrelated: "o.OrderID = s.StoreID", self: "s.StoreID = s.StoreID", full: "ORDERS.StoreID = s.StoreID", what: "orders with their storefronts" },
          ]);
          return Q.mc({
            q: `<p>You are joining ${pr.what}:</p>${sql("SELECT *", `FROM ${pr.from}`, `INNER JOIN ${pr.join} ON ____;`)}<p>Which ON condition is correct?</p>`,
            right: ic(pr.right), rightWhy: "Foreign key in one table = primary key in the other, both written with the table aliases.",
            wrong: [
              { t: ic(pr.unrelated), why: "Compares two unrelated IDs, so rows pair up by coincidence of numbers." },
              { t: ic(pr.self), why: "Both sides come from the same table, so the condition is always true and every row pairs with every other." },
              { t: ic(pr.full), why: "Once a table has an alias, you must use the alias. The full name can't be bound and SQL Server raises an error." },
            ],
            sol: S("ON states how a row in one table finds its partner: the shared key, foreign key = primary key.", `Here: <code>${pr.right}</code>.`),
          });
        },
      },
      K.conceptVariant("Interpret join results", "ch10-join", joinBank),
    ],
  });

  /* ============================================================
   * TOPIC 6 · Aggregates & GROUP BY (and filtering first)
   * ============================================================ */
  const STORE_NAMES = ["Downtown", "Northside", "Online", "Campus", "Eastgate"];
  function mkSales(opts = {}) {
    for (let t = 0; t < 60; t++) {
      const stores = U.sample(STORE_NAMES, 3);
      const n = U.randInt(8, 10);
      const base = U.randInt(61, 95) * 100;
      const rows = [];
      for (let i = 0; i < n; i++) rows.push({ OrderID: base + i * 2 + 1, StoreName: stores[i % 3], Quantity: U.randInt(1, 3), SalePrice: U.pick(PRICES) });
      const sh = U.shuffle(rows);
      if (opts.bad) {
        const k = U.randInt(1, 2);
        U.sample(sh, k).forEach((r, i) => { r.Quantity = i === 0 ? U.pick([-1, -2]) : U.pick([0, -1]); });
      }
      if (opts.nullPrice) {
        const grp = sh.filter(r => r.StoreName === opts.nullStore || r.StoreName === stores[0]);
        U.pick(grp).SalePrice = null;
      }
      return { stores, rows: sh };
    }
    return null;
  }
  const SALES_FROM = ["FROM dbo.ORDER_ITEMS oi", "INNER JOIN dbo.ORDERS o ON oi.OrderID = o.OrderID", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID"];
  const SALES_COLS = [{ k: "StoreName", h: "s.StoreName" }, { k: "OrderID", h: "oi.OrderID" }, { k: "Quantity", h: "oi.Quantity" }, { k: "SalePrice", h: "oi.SalePrice", money: true }];
  const salesTbl = d => table("Joined input rows (ORDER_ITEMS oi + ORDERS o + STORES s)", SALES_COLS, d.rows);
  const lineVal = r => r.SalePrice === null ? null : cents(r.Quantity * r.SalePrice);
  const sumVals = rs => cents(rs.reduce((a, r) => a + (lineVal(r) || 0), 0));
  const aggBank = [
    { q: "Hoosier Holdings does not record returns as negative quantities. A revenue SUM includes three lines with Quantity = −1. What is the right move?", right: "Report the total with those lines filtered out, and disclose how many were removed and how much they changed the total", rightWhy: "Filter for data quality before aggregating, then be transparent about it.",
      wrong: [{ t: "Report the all-records SUM; the query ran without error", why: "Running is not the standard. The −1 lines are known errors that silently lower revenue." }, { t: "Treat the −1 lines as returns and leave them in", why: "That depends on the business process, and this company doesn't record returns that way." }, { t: "Delete the three rows from ORDER_ITEMS, then rerun", why: "Analysts filter in queries; changing source data is a separate, authorized fix." }],
      sol: ["Start from the business process: what does a −1 mean at this company?", "Here it's an error, so exclude it with WHERE before aggregating, and report the clean figure with a disclosure."] },
    { q: "Why does COUNT(o.OrderID) in Store_Order_Count not tell you whether the orders are valid?", right: "COUNT tallies records that exist, whatever their quality", rightWhy: "A $0 order, a −1 quantity and a perfect order each count as 1.",
      wrong: [{ t: "COUNT skips invalid rows automatically", why: "COUNT only skips NULLs in the counted column; it has no idea what “invalid” means." }, { t: "Because COUNT ignores the GROUP BY", why: "COUNT respects groups; that's how you get one count per store." }, { t: "COUNT only works on numeric columns", why: "COUNT works on any column type; validity simply isn't its job." }],
      sol: ["What does COUNT check about each row?", "Only that the column isn't NULL. Data quality checks need their own WHERE conditions."] },
    { q: "A query shows <code>s.StoreName</code> and <code>COUNT(o.OrderID)</code> but has no GROUP BY. What happens?", right: "It errors, because StoreName isn't aggregated and isn't in GROUP BY", rightWhy: "SQL Server can't show one StoreName for an ungrouped total.",
      wrong: [{ t: "It returns one row per store automatically", why: "Grouping only happens when you write GROUP BY." }, { t: "It returns the first store name and the overall count", why: "SQL Server refuses rather than guessing which name to show." }, { t: "It counts store names instead of orders", why: "The COUNT argument decides what is counted; the error comes from StoreName." }],
      sol: ["Apply the rule: every SELECT item is aggregated or grouped.", "StoreName is neither, so add <code>GROUP BY s.StoreName</code>."] },
    { q: "Prices in a group are 40, 60 and NULL. What does <code>AVG(SalePrice)</code> return?", right: "50", rightWhy: "AVG ignores the NULL: (40 + 60) ÷ 2.",
      wrong: [{ t: "33.33", why: "That divides by 3 rows; AVG divides by non-NULL values only." }, { t: "NULL", why: "One NULL doesn't make the whole average NULL; it is just skipped." }, { t: "100", why: "That's the SUM, not the average." }],
      sol: ["How do SUM and AVG treat NULLs?", "They skip them, so the average is over 2 values: 100 ÷ 2 = 50."] },
  ];

  const aggGen = STUDY.makeGenerator({
    id: "k201-ch10-agg",
    name: "Aggregates, GROUP BY & clean totals",
    blurb: "Compute COUNT, SUM and AVG per group from a fresh table, handle NULLs, and compare all-records vs. clean totals.",
    variants: [
      {
        name: "COUNT per group",
        make() {
          const d = mkSales();
          const st = U.pick(d.stores);
          const k = d.rows.filter(r => r.StoreName === st).length;
          return Q.num({
            kind: "count",
            q: `${salesTbl(d)}${sql("SELECT s.StoreName, COUNT(oi.OrderID) AS TotalLines", SALES_FROM, "GROUP BY s.StoreName;")}<p>What value appears in TotalLines for <b>${st}</b>?</p>`,
            answer: k,
            traps: dedupeTraps(k, [{ value: d.rows.length, why: "That's every row. GROUP BY gives each store its own count." }, { value: d.rows.filter(r => r.StoreName === st).reduce((a, r) => a + r.Quantity, 0), why: "You added quantities; COUNT counts rows (lines), not units." }]),
            sol: S("GROUP BY makes one bucket per StoreName; COUNT(oi.OrderID) counts the non-NULL OrderIDs in each bucket.", `${st} rows: ${d.rows.filter(r => r.StoreName === st).map(r => r.OrderID).join(", ")} → <b>${k}</b>.`),
          });
        },
      },
      {
        name: "SUM of a calculation per group",
        make() {
          const d = mkSales();
          const st = U.pick(d.stores);
          const g = d.rows.filter(r => r.StoreName === st);
          const ans = sumVals(g);
          return Q.num({
            unit: "$",
            q: `${salesTbl(d)}${sql("SELECT s.StoreName, SUM(oi.Quantity * oi.SalePrice) AS Revenue", SALES_FROM, "GROUP BY s.StoreName;")}<p>What Revenue does the query report for <b>${st}</b>?</p>`,
            answer: ans,
            traps: dedupeTraps(ans, [{ value: cents(g.reduce((a, r) => a + r.SalePrice, 0)), why: "You summed prices without multiplying by quantity." }, { value: sumVals(d.rows), why: "That's revenue for every store; GROUP BY splits it per store." }]),
            sol: S("Compute Quantity × SalePrice for each row in the group, then add them.", ul(g.map(r => `${r.OrderID}: ${r.Quantity} × ${m2(r.SalePrice)} = ${m2(lineVal(r))}`)), `Revenue for ${st}: <b>${U.money(ans, 2)}</b>.`),
          });
        },
      },
      {
        name: "AVG with a NULL in the group",
        make() {
          for (let t = 0; t < 60; t++) {
            const d = mkSales({ nullPrice: true });
            const st = d.rows.find(r => r.SalePrice === null).StoreName;
            const g = d.rows.filter(r => r.StoreName === st);
            const vals = g.filter(r => r.SalePrice !== null).map(r => r.SalePrice);
            if (vals.length < 2) continue;
            const sum = vals.reduce((a, b) => a + b, 0);
            const ans = U.round(sum / vals.length, 2);
            return Q.num({
              unit: "$",
              q: `${salesTbl(d)}${sql("SELECT s.StoreName, AVG(oi.SalePrice) AS AvgPrice", SALES_FROM, "GROUP BY s.StoreName;")}<p>What AvgPrice is reported for <b>${st}</b>? (Round to the cent.)</p>`,
              answer: ans,
              traps: dedupeTraps(ans, [{ value: U.round(sum / g.length, 2), why: "You divided by every row. AVG skips the NULL price and divides by the non-NULL count." }, { value: sum, why: "That's the SUM of prices, not the average." }]),
              sol: S("AVG ignores NULLs: add the non-NULL values and divide by how many there are.", `${st}: ${vals.map(m2).join(" + ")} = ${m2(sum)}; ${vals.length} non-NULL values (the NULL row is skipped).`, `${m2(sum)} ÷ ${vals.length} = <b>${U.money(ans, 2)}</b>.`),
            });
          }
          return null;
        },
      },
      {
        name: "COUNT(*) vs. COUNT(column)",
        make() {
          const d = mkSales({ nullPrice: true });
          const st = d.rows.find(r => r.SalePrice === null).StoreName;
          const g = d.rows.filter(r => r.StoreName === st);
          const star = g.length, colc = g.filter(r => r.SalePrice !== null).length;
          const askStar = Math.random() < 0.5;
          const ans = askStar ? star : colc;
          return Q.num({
            kind: "count",
            q: `${salesTbl(d)}${sql("SELECT s.StoreName,", "       COUNT(*) AS AllLines,", "       COUNT(oi.SalePrice) AS PricedLines", SALES_FROM, "GROUP BY s.StoreName;")}<p>What is <b>${askStar ? "AllLines" : "PricedLines"}</b> for <b>${st}</b>?</p>`,
            answer: ans,
            traps: dedupeTraps(ans, [{ value: askStar ? colc : star, why: askStar ? "COUNT(*) counts every row, including the one with a NULL price." : "COUNT(column) skips rows where that column is NULL." }, { value: askStar ? d.rows.length : d.rows.filter(r => r.SalePrice !== null).length, why: "That's across all stores; GROUP BY gives a count per store." }]),
            sol: S("COUNT(*) counts rows; COUNT(column) counts non-NULL values in that column.", `${st} has ${star} rows, one with a NULL SalePrice → COUNT(*) = ${star}, COUNT(oi.SalePrice) = ${colc}.`, `Answer: <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Fix the GROUP BY error",
        make() {
          const sc = U.pick([
            { sel: "s.StoreName, s.City, COUNT(o.OrderID) AS TotalOrders", grp: "s.StoreName", miss: "s.City", from: ["FROM dbo.ORDERS o", "INNER JOIN dbo.STORES s ON o.StoreID = s.StoreID"] },
            { sel: "p.StoreID, p.ProductName, COUNT(p.ProductID) AS Products", grp: "p.StoreID", miss: "p.ProductName", from: ["FROM dbo.PRODUCTS p"] },
            { sel: "c.Major, c.GradYear, COUNT(c.CustomerID) AS Students", grp: "c.Major", miss: "c.GradYear", from: ["FROM dbo.CUSTOMERS c"] },
            { sel: "r.StoreID, r.ReviewDate, AVG(r.Rating) AS AvgRating", grp: "r.StoreID", miss: "r.ReviewDate", from: ["FROM dbo.REVIEWS r"] },
          ]);
          return Q.mc({
            q: `${sql(`SELECT ${sc.sel}`, sc.from, `GROUP BY ${sc.grp};`)}<p>SQL Server reports that <code>${sc.miss}</code> “is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause.” Which fix follows the rule?</p>`,
            right: `Either add ${ic(sc.miss)} to GROUP BY, or remove it from SELECT`, rightWhy: "Every SELECT item must be aggregated or grouped. Adding it makes finer groups; removing it keeps the original grouping.",
            wrong: [
              { t: `Move ${ic(sc.miss)} to the end of the SELECT list`, why: "Position in SELECT doesn't matter; it's still neither aggregated nor grouped." },
              { t: "Replace GROUP BY with ORDER BY", why: "Without GROUP BY the aggregate collapses everything to one row, and the non-aggregated columns still break the rule." },
              { t: "Add WHERE " + esc(sc.miss) + " IS NOT NULL", why: "Filtering rows doesn't change which columns are grouped." },
            ],
            sol: S("State the rule: in a grouped query, every SELECT item is either inside an aggregate or listed in GROUP BY.", `${sc.miss} is neither. Add it to GROUP BY (one row per combination) or drop it from SELECT.`),
          });
        },
      },
      {
        name: "All-records vs. clean total",
        make() {
          for (let t = 0; t < 40; t++) {
            const d = mkSales({ bad: true });
            const st = U.pick(d.stores.filter(s => d.rows.some(r => r.StoreName === s && r.Quantity < 0)));
            if (!st) continue;
            const g = d.rows.filter(r => r.StoreName === st);
            const all = sumVals(g), clean = sumVals(g.filter(r => r.Quantity > 0));
            const diff = cents(clean - all);
            if (diff <= 0) continue;
            const ask = U.pick(["clean", "diff", "all"]);
            const ans = { clean, diff, all }[ask];
            const prompt = { clean: `the <b>clean</b> revenue for ${st} (with <code>WHERE oi.Quantity &gt; 0</code> added)`, diff: `how many dollars <b>lower</b> the all-records revenue for ${st} is than the clean revenue`, all: `the <b>all-records</b> revenue for ${st} (no filter)` }[ask];
            return Q.num({
              unit: "$",
              q: `${salesTbl(d)}${sql("SELECT s.StoreName, SUM(oi.Quantity * oi.SalePrice) AS Revenue", SALES_FROM, "-- clean version adds:  WHERE oi.Quantity > 0", "GROUP BY s.StoreName;")}<p>The company does not record returns as negative quantities. Find ${prompt}.</p>`,
              answer: ans,
              traps: dedupeTraps(ans, [
                { value: all, why: "That's the all-records figure, which includes the unverified lines." },
                { value: clean, why: "That's the clean figure itself." },
                { value: diff, why: "That's the gap between the two versions." },
                { value: -diff, why: "Right size, but the question asks for a positive “how much lower”." },
              ]),
              sol: S("Run both versions: all-records (every row in the group) and clean (WHERE oi.Quantity &gt; 0 drops zero and negative lines before SUM).",
                ul(g.map(r => `${r.OrderID}: ${r.Quantity} × ${m2(r.SalePrice)} = ${m2(lineVal(r))}${r.Quantity > 0 ? "" : " ← removed by the filter"}`)),
                `All-records ${U.money(all, 2)}; clean ${U.money(clean, 2)}; difference ${U.money(diff, 2)}. Answer: <b>${U.money(ans, 2)}</b>. Report the clean figure and disclose the difference.`),
            });
          }
          return null;
        },
      },
      {
        name: "How many groups survive the filter?",
        make() {
          for (let t = 0; t < 60; t++) {
            const d = mkSales({ bad: true });
            if (Math.random() < 0.6) {
              const victim = U.pick(d.stores);
              d.rows.filter(r => r.StoreName === victim).forEach(r => { r.Quantity = U.pick([0, -1]); });
            }
            const survivors = new Set(d.rows.filter(r => r.Quantity > 0).map(r => r.StoreName)).size;
            const total = new Set(d.rows.map(r => r.StoreName)).size;
            return Q.num({
              kind: "count",
              q: `${salesTbl(d)}${sql("SELECT s.StoreName, SUM(oi.Quantity * oi.SalePrice) AS Revenue", SALES_FROM, "WHERE oi.Quantity > 0", "GROUP BY s.StoreName;")}<p>How many rows does this query return?</p>`,
              answer: survivors,
              traps: dedupeTraps(survivors, [
                { value: d.rows.filter(r => r.Quantity > 0).length, why: "That's the number of input rows that pass WHERE. GROUP BY collapses them to one row per store." },
                { value: total, why: "WHERE runs before GROUP BY: a store whose rows are all filtered out has no group left." },
                { value: d.rows.length, why: "That's every input row before filtering and grouping." },
              ]),
              sol: S("Execution order: WHERE removes rows first, then GROUP BY makes one row per remaining StoreName.",
                ul(d.stores.map(s => `${s}: ${d.rows.filter(r => r.StoreName === s && r.Quantity > 0).length} valid ${U.plural(d.rows.filter(r => r.StoreName === s && r.Quantity > 0).length, "line")}`)),
                `<b>${survivors}</b> ${U.plural(survivors, "row")}${survivors < total ? ". A store with no valid lines disappears from the result entirely, which is worth disclosing" : ""}.`),
            });
          }
          return null;
        },
      },
      K.conceptVariant("Judge the aggregate", "ch10-agg", aggBank),
    ],
  });

  /* ============================================================
   * TOPIC 7 · Documentation & defensibility
   * ============================================================ */
  const CMT_CATS = ["Business question", "Business requirement", "Restates the SQL"];
  const cmt = (t, cat, why) => ({ t: ic("-- " + t), cat, why });
  const cmtBank = [
    cmt("Which customer records use an email address outside @iu.edu?", "Business question", "Asks what we want to know, in plain business terms."),
    cmt("Which line items show a quantity that couldn't come from a normal purchase?", "Business question", "A question about the data, phrased for a business reader."),
    cmt("How many orders has each storefront taken this term?", "Business question", "Something a manager wants to know, before any SQL is chosen."),
    cmt("Which catalog products have never appeared on an order?", "Business question", "Asks about the business situation, not the code."),
    cmt("Which reviews carry a rating outside the 1-to-5 scale?", "Business question", "A plain-language question the query will answer."),
    cmt("Which orders point to a customer who isn't on file?", "Business question", "States what we want to find out."),
    cmt("Which products sold for far less than their catalog price?", "Business question", "Frames the investigation as a question."),
    cmt("Every customer record must carry an @iu.edu address under the student data policy.", "Business requirement", "States the rule the data must obey, and its source (policy)."),
    cmt("Every line item must show a positive quantity that represents a completed sale.", "Business requirement", "A rule that each row passes or fails."),
    cmt("Each order must be credited to the storefront that took it.", "Business requirement", "The standard the count is checked against."),
    cmt("Every active product in the catalog should have at least one sale on record.", "Business requirement", "A rule about the business, testable against the data."),
    cmt("Ratings must fall on the 1-to-5 scale the review form offers.", "Business requirement", "Defines what a valid rating is."),
    cmt("Every order must belong to a registered customer.", "Business requirement", "A referential rule someone could agree or disagree with."),
    cmt("A sale may not be more than $25 below catalog price unless a manager approved it.", "Business requirement", "A pricing policy the audit verifies."),
    cmt("Return rows where SchoolEmail NOT LIKE '%@iu.edu'.", "Restates the SQL", "Just narrates the WHERE clause; no rule, no reason."),
    cmt("Select everything from ORDER_ITEMS where Quantity is less than 1.", "Restates the SQL", "Describes the code, not the business standard behind it."),
    cmt("Join ORDERS to STORES and count OrderID grouped by StoreName.", "Restates the SQL", "A play-by-play of the query, not the requirement it checks."),
    cmt("LEFT JOIN PRODUCTS to ORDER_ITEMS and keep rows where OrderID IS NULL.", "Restates the SQL", "Repeats the code in English; a reader still doesn't know the rule."),
    cmt("Return customers with no orders.", "Restates the SQL", "Restates what the query does. The requirement would be “every registered customer should have placed at least one order.”"),
    cmt("Subtract SalePrice from BasePrice and keep differences over 25.", "Restates the SQL", "Describes the arithmetic, not the pricing policy."),
  ];
  const commentVariants = K.sortVariants({
    key: "ch10-cmt", bank: cmtBank, cats: CMT_CATS, ask: "comment line",
    defs: { "Business question": "what you want to know, phrased as a question", "Business requirement": "the rule the data should obey, the standard the query checks against", "Restates the SQL": "describes what the code does; adds nothing the SQL doesn't already say" },
    hint: "Ask of each comment: is it a question, a rule the data must satisfy, or just the code read aloud?",
  });
  const FILE_SCEN = [
    { task: "find customer records with non-IU email addresses", right: "Email_Compliance.sql", wrong: [["CUSTOMERS_Query.sql", "Names the table touched, not why the query exists."], ["Query1.sql", "Generic: in a folder of twenty files, nobody can tell what this one checks."], ["NOT_LIKE_Test.sql", "Names the technique, not the business purpose."]] },
    { task: "flag line items whose quantity is zero or negative", right: "Quantity_Audit.sql", wrong: [["ORDER_ITEMS.sql", "A table name says nothing about what is being verified."], ["Monday_Work.sql", "A date or day isn't a purpose and won't mean anything next week."], ["Less_Than_One.sql", "Describes the operator, not the business check."]] },
    { task: "list sales more than $25 below catalog price", right: "Price_Audit.sql", wrong: [["PRODUCTS_JOIN_ORDER_ITEMS.sql", "Names the tables joined, not the purpose."], ["Final_v2.sql", "Version labels aren't purposes."], ["Calc_Column.sql", "Names a technique used, not the question answered."]] },
    { task: "count orders taken by each storefront", right: "Store_Order_Count.sql", wrong: [["GroupBy.sql", "Names a clause, not the question."], ["STORES_Query.sql", "Table-driven, not purpose-driven."], ["Untitled-3.sql", "The editor's default name tells a reviewer nothing."]] },
    { task: "find orders that point to customers who don't exist", right: "Orphaned_Orders.sql", wrong: [["LEFT_JOIN_Practice.sql", "Names the technique, not the finding."], ["ORDERS_Query.sql", "Table-driven: it could be any query on ORDERS."], ["Homework3.sql", "Course labels don't say what the query verifies."]] },
    { task: "list catalog products with no sales records", right: "Unsold_Inventory.sql", wrong: [["PRODUCTS.sql", "A table name, not a purpose."], ["IS_NULL_Check.sql", "Names a technique; many queries use IS NULL."], ["Query_Oct.sql", "A date isn't a purpose."]] },
  ];
  const defendBank = [
    { q: "IntelliSense suggests a column named <code>CustomerEmail</code> as you type in a query on dbo.CUSTOMERS. What's the sensible response?", right: "Check the table's actual columns before relying on it; IntelliSense can suggest names that don't fit the table or the rule", rightWhy: "It's a starting point for syntax and spelling, not an authority on your schema or business rules.",
      wrong: [{ t: "Accept it with Tab; IntelliSense only suggests columns that exist", why: "Suggestions can include fields that don't exist in this table." }, { t: "Turn IntelliSense off; it is unreliable", why: "It's very useful for keywords, table names and spelling. Just verify." }, { t: "Accept it because IntelliSense knows the email policy", why: "It knows nothing about business rules like the @iu.edu requirement." }],
      sol: ["What does IntelliSense actually know about?", "Syntax, keywords and names it has seen, not your business rules. Verify the column before trusting it."] },
    { q: "A negative quantity shows up in a retailer's line items. Before calling it an error, what should an analyst do?", right: "Find out how the business records returns; some companies use negative quantities for them", rightWhy: "Understand the process before judging. The same value can be valid in one company and an error in another.",
      wrong: [{ t: "Delete it; negative quantities are always errors", why: "Some businesses legitimately record returns as negatives." }, { t: "Ignore it; one row can't matter", why: "One row can noticeably distort a SUM." }, { t: "Change it to a positive number", why: "Analysts don't edit source data to make reports look right." }],
      sol: ["Is a negative quantity wrong in every business?", "No, so check the process. At the chapter's case company returns aren't recorded that way, so there they're errors."] },
    { q: "Email_Compliance returns 9 rows. What does that number tell you?", right: "9 customer records break the @iu.edu rule across the whole table, and nothing about other kinds of problems", rightWhy: "A row count measures one rule's violations, not overall data quality.",
      wrong: [{ t: "The other records are all clean", why: "They passed this one test only. Quantities, prices and links need their own queries." }, { t: "About 9 of every 100 customers break the rule", why: "Nothing here gives a percentage; you'd need the table's total row count." }, { t: "9 customers need to be deleted", why: "The finding prompts follow-up (contact, correct), not deletion." }],
      sol: ["What exactly did the WHERE clause test?", "Only the email pattern, over every row. So 9 = the number of violations of that one requirement."] },
    { q: "Why is scanning the first 20 rows of a table not enough to answer “do any customers break the email rule?”", right: "Problems can sit anywhere; a WHERE clause checks every row, not a sample", rightWhy: "Chapter 10's shift: from spotting issues to quantifying them across entire tables.",
      wrong: [{ t: "It is enough if the first 20 rows look clean", why: "Clean early rows say nothing about the rest." }, { t: "Because SELECT * only shows 20 rows", why: "SELECT * returns every row; the limit was the human scan." }, { t: "Because rows are sorted by problem severity", why: "Without ORDER BY there's no guaranteed order, let alone a severity order." }],
      sol: ["How many rows does a WHERE clause examine?", "All of them. That's what makes a query a measurement rather than an impression."] },
    { q: "The Unsold_Inventory query returns a valid product nobody bought and a product whose StoreID matches no store. How should they be handled?", right: "Separately: the first is a business performance issue, the second a data integrity issue", rightWhy: "Same query, different problems, different owners and fixes.",
      wrong: [{ t: "Both should be discontinued", why: "The second may be a perfectly good product with a bad store reference." }, { t: "Both are data errors to delete", why: "The unsold product is real data; it's a sales question." }, { t: "Ignore them; they have no sales so they don't affect revenue", why: "Both deserve follow-up, and the invalid StoreID also breaks other reports (e.g. per-store counts)." }],
      sol: ["Ask of each row: is the record itself trustworthy?", "Valid product, no sales → business performance. Invalid StoreID → data integrity fix."] },
    { q: "Why build a query “from the source outward” and run it with Ctrl+Shift+E only after writing the two comment lines?", right: "Stating the question and requirement first makes sure you know what you're testing before you write SQL", rightWhy: "If you can't state the requirement, you're not ready to write the query.",
      wrong: [{ t: "Comments are required for the query to run", why: "The database ignores comments completely." }, { t: "Ctrl+Shift+E only runs files that contain comments", why: "The shortcut runs any query; comments are for humans." }, { t: "Comments make the query faster", why: "Comments have no effect on execution." }],
      sol: ["Who are the comment lines for?", "People: you now, and reviewers later. They set the standard the SQL is judged against."] },
  ];
  const defendTF = [
    { s: "A query that runs without an error message has produced a trustworthy answer.", truth: false, why: "Logic errors (= NULL, AND for OR, wrong join, unfiltered bad rows) run cleanly and still mislead.", hint: "What's the standard: “it ran” or “it's true”?" },
    { s: "A line starting with -- is ignored by the database.", truth: true, why: "It's a comment for human readers.", hint: "What does -- mark?" },
    { s: "“Return customers with no orders” is a good business-requirement comment.", truth: false, why: "It restates the SQL. A requirement states the rule, e.g. “every registered customer should have placed at least one order.”", hint: "Does it state a rule or describe code?" },
    { s: "When you report a cleaned figure, you should say what you removed and how much it changed the result.", truth: true, why: "Disclosure makes the number defensible; an unexplained clean figure misleads too.", hint: "Could a reader reproduce and judge your number?" },
    { s: "CUSTOMERS_Query.sql is a purpose-driven file name.", truth: false, why: "It names the table, not the purpose. Email_Compliance.sql says why the query exists.", hint: "Does the name say why?" },
    { s: "IntelliSense can suggest a column that doesn't exist in the table you're querying.", truth: true, why: "It's a helper for syntax and spelling, not a guarantee. Verify suggestions.", hint: "Is IntelliSense an authority on your schema and rules?" },
    { s: "Filtering out questionable rows before aggregating is a purely technical choice with no effect on what you can claim.", truth: false, why: "It's a data-integrity decision that changes the reported figure, so it must be justified and disclosed.", hint: "Does the WHERE change the number?" },
    { s: "The person who reports a figure is accountable for whether it is true, not just for whether the query ran.", truth: true, why: "That accountability is why you document, verify and disclose.", hint: "Who answers for the number?" },
  ];

  const defendGen = STUDY.makeGenerator({
    id: "k201-ch10-defend",
    name: "Documenting & defending answers",
    blurb: "Write the two comment lines, name files by purpose, triage findings, use IntelliSense wisely and report a clean figure with disclosure.",
    variants: [
      commentVariants[0], commentVariants[1], commentVariants[2],
      {
        name: "Name the query file",
        make() {
          const sc = U.rotate("ch10-file", FILE_SCEN);
          return Q.mc({
            q: `<p>You are about to save a query that will ${sc.task}. Which file name follows the chapter's convention?</p>`,
            right: ic(sc.right), rightWhy: "It says what the query is for, so anyone browsing the folder knows what it checks.",
            wrong: sc.wrong.map(([t, why]) => ({ t: ic(t), why })),
            sol: S("Purpose-driven names describe <em>why</em> the query exists, not which table or technique it uses.", `Best: <code>${sc.right}</code>.`),
          });
        },
      },
      {
        name: "Report the clean figure",
        make() {
          const all = U.randInt(380, 920) * 100 + U.pick([0, 25, 50, 75]);
          const k = U.randInt(3, 9);
          const gap = U.randInt(12, 95) * 10;
          const what = U.pick([
            { rule: "zero or negative quantities", why: "the company does not record returns as negative quantities", sign: 1, effect: `including them would lower the total by ${U.money(gap)}` },
            { rule: "an exact duplicate entry", why: "each sale was keyed in twice by a register glitch", sign: -1, effect: `including them would overstate the total by ${U.money(gap)}` },
          ]);
          const clean = all + what.sign * gap;
          const sentence = what.effect;
          return Q.mc({
            q: `<p>Your all-records revenue query returns <b>${U.money(all)}</b>. After filtering out ${k} line items with ${what.rule} (${what.why}), the clean query returns <b>${U.money(clean)}</b>. Which report is defensible?</p>`,
            right: `“Revenue is ${U.money(clean)} from verified line items. I excluded ${k} lines with ${what.rule} because ${what.why}; ${sentence}.”`,
            rightWhy: "Clean figure, what was removed, why, and the size of the effect: everything a reader needs to trust or challenge it.",
            wrong: [
              { t: `“Revenue is ${U.money(all)}.”`, why: "Reports the figure that includes known-bad records, with no warning." },
              { t: `“Revenue is ${U.money(clean)}.”`, why: "The right number, but silent about the removed records. A clean figure without disclosure misleads too." },
              { t: `“I deleted the ${k} bad rows from ORDER_ITEMS, so revenue is now ${U.money(clean)}.”`, why: "Analysts filter in queries; altering source data is not their call and destroys the evidence." },
            ],
            sol: S("A defensible report lets a reader see both versions: what you removed, why, and how much it mattered.", `Clean ${U.money(clean)} vs. all-records ${U.money(all)}: a gap of ${U.money(gap)}, which is the difference to disclose.`),
          });
        },
      },
      {
        name: "Triage the Unsold_Inventory result",
        make() {
          const stores = [1, 2, 3];
          const prods = U.sample(CATALOG, 5);
          const base = U.randInt(30, 80);
          const nBad = U.randInt(1, 3);
          const rows = prods.map(([name, bp], i) => ({ ProductID: base + i, ProductName: name, BasePrice: bp, StoreID: i < nBad ? U.pick([4, 6, 9]) : U.pick(stores) }));
          return Q.classify({
            q: `<p>dbo.STORES contains StoreIDs <b>1, 2 and 3</b> only. The Unsold_Inventory query (PRODUCTS LEFT JOIN ORDER_ITEMS … WHERE oi.OrderID IS NULL) returned these products. Classify each one.</p>`,
            cats: ["Business performance issue", "Data integrity issue"],
            items: U.shuffle(rows).map(r => ({ t: `ProductID ${r.ProductID} · ${r.ProductName} · $${r.BasePrice} · StoreID ${r.StoreID}`, cat: r.StoreID <= 3 ? "Business performance issue" : "Data integrity issue",
              why: r.StoreID <= 3 ? `StoreID ${r.StoreID} exists, so this is a real product nobody has bought. That's a question for sales or merchandising.` : `StoreID ${r.StoreID} matches no store, so the record itself is broken. Fix the catalog data.` })),
            sol: S("Ask whether the record is trustworthy before asking why it didn't sell: does its StoreID exist?", "Valid store → genuinely unsold (performance). Missing store → bad reference (integrity). Same query, different responses."),
          });
        },
      },
      K.conceptVariant("Judge the finding", "ch10-defend", defendBank),
      K.tfVariant("True or false: defensible queries", "ch10-defend", defendTF),
    ],
  });

  const generators = [orderGen, whereGen, writeGen, calcGen, joinGen, aggGen, defendGen];

  STUDY.registerUnit(C, {
    id: "ch10", order: 10,
    title: "Chapter 10 · Querying for Answers You Can Defend",
    short: "Ch 10 · SQL queries",
    description: "Write purpose-driven SQL: filter with WHERE, calculate, join, aggregate, then verify, document and disclose so the answer holds up.",
    notes, flashcards, cues, generators,
  });
})();
