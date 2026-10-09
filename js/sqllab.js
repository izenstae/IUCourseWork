/* ============================================================
 * SQL Lab — write and run real SQL in the browser.
 *
 * A course opts in by attaching `sqlLab = { intro, setup, tables,
 * exercises }` to its course object (see courses/bus-k201/sqllab.js).
 * The SQLite engine (lib/sqljs/sql-asm.js, plain JS, so it also works
 * from file://) is loaded only when the lab is first opened.
 *
 * The course teaches Microsoft SQL Server, so queries are translated
 * (TOP (n) → LIMIT n, dbo./[db].[dbo]. prefixes dropped) and two
 * places where SQLite is more permissive than SQL Server are checked
 * by hand so the lab fails where SQL Server would:
 *   · a SELECT alias used in WHERE  → "Invalid column name"
 *   · a non-aggregated column missing from GROUP BY.
 * The pure functions live in SqlLab.engine so tools/check-sqllab.js
 * can test them in Node.
 * ============================================================ */
const SqlLab = (() => {
  /* ---------------- engine (no DOM) ---------------- */

  /* Replace string literals and comments with spaces of equal length so
   * keyword searches never match inside them. */
  function mask(sql) {
    let out = "", i = 0;
    while (i < sql.length) {
      const ch = sql[i];
      if (ch === "'") {
        let j = i + 1;
        while (j < sql.length && !(sql[j] === "'" && sql[j + 1] !== "'")) j += sql[j] === "'" ? 2 : 1;
        out += "'" + " ".repeat(Math.max(0, Math.min(j, sql.length) - i - 1)) + (j < sql.length ? "'" : "");
        i = j + 1;
      } else if (ch === "-" && sql[i + 1] === "-") {
        let j = sql.indexOf("\n", i);
        if (j < 0) j = sql.length;
        out += " ".repeat(j - i);
        i = j;
      } else if (ch === "/" && sql[i + 1] === "*") {
        let j = sql.indexOf("*/", i + 2);
        j = j < 0 ? sql.length : j + 2;
        out += " ".repeat(j - i);
        i = j;
      } else { out += ch; i++; }
    }
    return out;
  }

  /* Split on semicolons outside strings/comments; drop empty statements. */
  function statements(sql) {
    const m = mask(sql);
    const parts = [];
    let start = 0;
    for (let i = 0; i < m.length; i++) if (m[i] === ";") { parts.push(sql.slice(start, i)); start = i + 1; }
    parts.push(sql.slice(start));
    return parts.filter(p => mask(p).trim());
  }

  /* SQL Server → SQLite for one statement. */
  function translate(stmt) {
    let s = stmt;
    s = s.replace(/(\[[^\]]+\]|\b\w+)\s*\.\s*(\[dbo\]|\bdbo)\s*\./gi, "");
    s = s.replace(/(\[dbo\]|\bdbo)\s*\./gi, "");
    const m = mask(s);
    const top = /\bSELECT\s+(DISTINCT\s+)?TOP\s*(?:\(\s*(\d+)\s*\)|(\d+))/i.exec(m);
    let limit = null;
    if (top) {
      limit = top[2] || top[3];
      s = s.slice(0, top.index) + "SELECT " + (top[1] || "") + " ".repeat(Math.max(0, top[0].length - 7 - (top[1] || "").length)) + s.slice(top.index + top[0].length);
    }
    s = s.replace(/\bLEN\s*\(/gi, "LENGTH(").replace(/\bGETDATE\s*\(\s*\)/gi, "DATE('now')").replace(/\bISNULL\s*\(/gi, "IFNULL(");
    if (limit) s = s.replace(/\s*$/, "") + `\nLIMIT ${limit}`;
    return s;
  }

  /* Top-level clause boundaries of a single SELECT (depth-0 keywords). */
  function clauses(sqlMasked) {
    const up = sqlMasked.toUpperCase();
    const depth = [];
    let d = 0;
    for (let i = 0; i < up.length; i++) { if (up[i] === "(") d++; depth.push(d); if (up[i] === ")") d--; }
    const find = re => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(up))) if (depth[m.index] === 0) return m.index;
      return -1;
    };
    const pos = {
      select: find(/\bSELECT\b/g), from: find(/\bFROM\b/g), where: find(/\bWHERE\b/g),
      group: find(/\bGROUP\s+BY\b/g), having: find(/\bHAVING\b/g), order: find(/\bORDER\s+BY\b/g),
    };
    const ends = Object.values(pos).filter(p => p >= 0).sort((a, b) => a - b);
    const seg = (k, skip) => {
      if (pos[k] < 0) return null;
      const next = ends.find(p => p > pos[k]);
      return sqlMasked.slice(pos[k] + skip, next == null ? sqlMasked.length : next);
    };
    return { pos, select: seg("select", 6), where: seg("where", 5), group: seg("group", 0)?.replace(/^\s*GROUP\s+BY/i, "") ?? null };
  }

  function splitTop(list) {
    const out = [];
    let d = 0, cur = "";
    for (const ch of list) {
      if (ch === "(") d++;
      if (ch === ")") d--;
      if (ch === "," && d === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.map(x => x.trim()).filter(Boolean);
  }

  const AGG = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i;
  const norm = e => e.replace(/[\[\]\s]/g, "").replace(/^\w+\./, "").toLowerCase();

  /* Errors SQL Server would raise but SQLite would not. `columns` is a
   * list of real column names (aliases that shadow them are allowed). */
  function sqlServerErrors(stmt, columns) {
    const m = mask(stmt);
    if (!/^\s*SELECT\b/i.test(m)) return null;
    if (/\(\s*SELECT\b/i.test(m)) return null;   // subqueries: don't second-guess
    const c = clauses(m);
    if (c.pos.from < 0 || c.select == null) return null;
    const items = splitTop(c.select.replace(/^\s*(DISTINCT\s+)?(TOP\s*(\(\s*\d+\s*\)|\d+))?/i, ""));
    const real = new Set(columns.map(x => x.toLowerCase()));
    const aliases = [];
    for (const it of items) {
      const a = /\bAS\s+\[?(\w+)\]?\s*$/i.exec(it);
      if (a && !real.has(a[1].toLowerCase())) aliases.push(a[1]);
    }
    if (c.where) {
      for (const a of aliases) if (new RegExp(`(^|[^\\w.])${a}\\b`, "i").test(c.where))
        return `Invalid column name '${a}'. (SQL Server runs WHERE before SELECT, so the alias ${a} does not exist yet. Repeat the calculation in WHERE instead.)`;
    }
    const hasAgg = items.some(it => AGG.test(it));
    if (hasAgg || c.group != null) {
      const groups = c.group != null ? splitTop(c.group).map(norm) : [];
      for (const it of items) {
        if (AGG.test(it)) continue;
        const expr = it.replace(/\s+AS\s+\[?\w+\]?\s*$/i, "");
        if (/^\s*\*\s*$/.test(expr) || /^\w+\.\*$/.test(expr.trim())) return "Column list '*' is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause.";
        if (/^\s*('.*'|\d+(\.\d+)?)\s*$/.test(expr)) continue;   // constants are fine
        if (!groups.includes(norm(expr))) return `Column '${expr.trim()}' is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause.`;
      }
    }
    return null;
  }

  /* Run all statements; return the last result set. */
  function run(db, sql, columns) {
    const stmts = statements(sql);
    if (!stmts.length) return { error: "There is no query to run yet." };
    let last = null;
    for (const st of stmts) {
      const pre = sqlServerErrors(st, columns || []);
      if (pre) return { error: pre };
      let res;
      try { res = db.exec(translate(st)); }
      catch (e) { return { error: friendly(e.message) }; }
      if (res.length) last = res[res.length - 1];
      else if (/^\s*SELECT\b/i.test(mask(st))) last = { columns: [], values: [] };
    }
    const tip = /\bLIMIT\s+\d+/i.test(mask(sql)) ? "SQL Server uses TOP (n) right after SELECT, not LIMIT." : null;
    return { result: last || { columns: [], values: [] }, tip };
  }

  function friendly(msg) {
    let m = /no such column: (.+)/.exec(msg);
    if (m) return `Invalid column name '${m[1]}'. Check the spelling against the schema, and the table alias in front of it.`;
    m = /no such table: (.+)/.exec(msg);
    if (m) return `Invalid object name '${m[1]}'. The tables are STORES, CUSTOMERS, PRODUCTS, ORDERS, ORDER_ITEMS and REVIEWS.`;
    m = /ambiguous column name: (.+)/.exec(msg);
    if (m) return `Ambiguous column name '${m[1]}'. It exists in more than one joined table. Put the table alias in front, e.g. o.${m[1].replace(/^\w+\./, "")}.`;
    if (/near "(\w+)": syntax error/.test(msg)) return `Incorrect syntax near '${/near "(\w+)"/.exec(msg)[1]}'. Check the clause order: SELECT … FROM … JOIN … ON … WHERE … GROUP BY … ORDER BY.`;
    if (/incomplete input/.test(msg)) return "The query ends too early. Is a clause, a closing parenthesis or a closing quote missing?";
    return msg;
  }

  const cell = v => v === null || v === undefined ? null : typeof v === "number" ? Math.round(v * 100) / 100 : String(v).trim();
  const rowKey = r => JSON.stringify(r.map(cell));
  const looseKey = r => JSON.stringify(r.map(cell).map(String).sort());

  /* Compare a student's result with the reference result. */
  function compare(got, want, ordered) {
    if (!got) return { ok: false, msg: "Run a query that returns rows first." };
    const nc = want.columns.length, gc = got.columns.length;
    if (gc !== nc) return { ok: false, msg: `Your result has ${gc} column${gc === 1 ? "" : "s"}; the answer has ${nc} (${want.columns.join(", ")}). Return only the columns the question asks for.` };
    const g = got.values, w = want.values;
    const sameMulti = (a, b, key) => {
      const ka = a.map(key).sort(), kb = b.map(key).sort();
      return ka.length === kb.length && ka.every((x, i) => x === kb[i]);
    };
    if (g.length !== w.length) {
      const wset = new Set(w.map(rowKey));
      const extra = g.filter(r => !wset.has(rowKey(r))).length;
      return { ok: false, msg: `You returned ${g.length} row${g.length === 1 ? "" : "s"}; the answer has ${w.length}. ` +
        (g.length > w.length ? `${extra ? extra + " of your rows should not be there. " : ""}Is the WHERE condition too loose, or did a join repeat rows?` :
          "Rows are missing. Is the condition too strict, or did an INNER JOIN drop rows that had no match?") };
    }
    const exact = ordered ? g.every((r, i) => rowKey(r) === rowKey(w[i])) : sameMulti(g, w, rowKey);
    if (exact) return { ok: true };
    if (sameMulti(g, w, rowKey)) return { ok: false, msg: "Right rows, wrong order. Check ORDER BY: the column, and ASC or DESC." };
    const loose = ordered ? g.every((r, i) => looseKey(r) === looseKey(w[i])) : sameMulti(g, w, looseKey);
    if (loose) return { ok: true, tip: "Your columns are in a different order from the question's. That's fine here, but match the requested order in work you hand in." };
    return { ok: false, msg: "Same number of rows, but some values differ. Check the calculation, the filter values and which table each column comes from." };
  }

  /* ---------------- UI ---------------- */
  let SQL = null, loading = null;
  const dbs = {};
  function loadEngine() {
    if (SQL) return Promise.resolve(SQL);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const go = () => window.initSqlJs().then(s => { SQL = s; resolve(s); }, reject);
      if (window.initSqlJs) return go();
      const sc = document.createElement("script");
      sc.src = "lib/sqljs/sql-asm.js";
      sc.onload = go;
      sc.onerror = () => reject(new Error("Could not load lib/sqljs/sql-asm.js"));
      document.head.appendChild(sc);
    });
    return loading;
  }
  function freshDb(lab) { const db = new SQL.Database(); db.run(lab.setup); return db; }
  function dbFor(c) { return dbs[c.id] || (dbs[c.id] = freshDb(c.sqlLab)); }
  const allColumns = lab => lab.tables.flatMap(t => t.cols.map(x => x[0]));

  const KEY = id => "iush-sqllab-" + id;
  function loadState(id) { try { return JSON.parse(localStorage.getItem(KEY(id))) || { solved: {}, drafts: {} }; } catch (e) { return { solved: {}, drafts: {} }; } }
  function saveState(id, st) { try { localStorage.setItem(KEY(id), JSON.stringify(st)); } catch (e) { /* private mode */ } }
  function solvedCount(c) { const st = loadState(c.id); return c.sqlLab ? c.sqlLab.exercises.filter(x => st.solved[x.id]).length : 0; }

  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const LEVELS = { 1: "Reading tables", 2: "Filtering with WHERE", 3: "Calculations and joins", 4: "Summaries with GROUP BY" };
  const STARTER = "-- Business question: \n-- Business requirement: \n";

  function table(res, max = 200) {
    if (!res.columns.length) return `<p class="muted">The query ran and returned no rows.</p>`;
    const rows = res.values.slice(0, max);
    return `<p class="muted small">${res.values.length} row${res.values.length === 1 ? "" : "s"}${res.values.length > max ? ` (showing the first ${max})` : ""}</p>
      <div class="tbl-wrap sql-result"><table class="tbl"><tr>${res.columns.map(h => `<th>${esc(h)}</th>`).join("")}</tr>
      ${rows.map(r => `<tr>${r.map(v => v === null ? `<td class="null">NULL</td>` : `<td>${esc(typeof v === "number" && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v)}</td>`).join("")}</tr>`).join("")}
      </table></div>`;
  }

  function mount(el, arg) {
    const c = App.course();
    const lab = c.sqlLab;
    el.innerHTML = `<div class="card"><p class="muted">Loading the SQL engine…</p></div>`;
    loadEngine().then(() => render(el, c, lab, arg), e => {
      el.innerHTML = `<div class="card"><h3 class="mt0">The SQL engine did not load</h3><p class="muted">${esc(e.message)}</p></div>`;
    });
  }

  function render(el, c, lab, arg) {
    const st = loadState(c.id);
    const ex = lab.exercises.find(x => x.id === arg) || null;
    const nSolved = lab.exercises.filter(x => st.solved[x.id]).length;
    const groups = {};
    for (const x of lab.exercises) (groups[x.level] = groups[x.level] || []).push(x);
    const list = Object.keys(groups).map(lv => `
      <div class="sql-group"><div class="nav-label">${LEVELS[lv] || "Level " + lv}</div>
        ${groups[lv].map(x => `<a class="sql-ex ${ex && ex.id === x.id ? "active" : ""}" href="${App.link("sqllab", x.id)}">
          <span class="sql-tick">${st.solved[x.id] ? "✓" : "○"}</span> ${esc(x.title)} <span class="muted small">Ch ${x.ch}</span></a>`).join("")}
      </div>`).join("");
    const schema = lab.tables.map(t => `
      <details class="sql-table"><summary><code>dbo.${t.name}</code> <button class="btn btn-ghost btn-sm" data-preview="${t.name}">Top 1000</button></summary>
        <table class="tbl small">${t.cols.map(col => `<tr><td><code>${col[0]}</code></td><td class="muted">${col[1]}</td><td class="muted">${col[2] || ""}</td></tr>`).join("")}</table>
      </details>`).join("");
    const draft = ex ? (st.drafts[ex.id] ?? STARTER) : (st.drafts.__free ?? "-- Free practice: anything you like\nSELECT TOP (10) *\nFROM dbo.ORDERS\n");

    el.innerHTML = `
      <div class="card hero">
        <h2>SQL Lab</h2>
        <p class="muted">${lab.intro}</p>
        <div class="progress-bar"><div style="width:${Math.round(100 * nSolved / lab.exercises.length)}%"></div></div>
        <p class="muted small">${nSolved}/${lab.exercises.length} exercises solved</p>
      </div>
      <div class="sql-layout">
        <div class="card sql-side">
          <a class="sql-ex ${ex ? "" : "active"}" href="${App.link("sqllab")}"><span class="sql-tick">✎</span> Free practice</a>
          ${list}
          <div class="nav-label">Schema</div>
          ${schema}
        </div>
        <div class="sql-main">
          ${ex ? `<div class="card">
            <div class="unit-head"><h3 class="mt0">${esc(ex.title)}</h3><span class="pill">Chapter ${ex.ch}</span></div>
            <p><b>Business question.</b> ${ex.question}</p>
            <p class="muted"><b>Business requirement.</b> ${ex.requirement}</p>
            ${ex.ordered ? `<p class="muted small">Row order is checked for this one.</p>` : ""}
            <div class="hint-box" id="sqlHints" hidden></div>
          </div>` : `<div class="card"><h3 class="mt0">Free practice</h3><p class="muted">Explore the data, try the Chapter 9 observations (non-IU emails, products from stores that do not exist, unmatched orders, a rating of 10) or rehearse a query from memory. Nothing is graded here.</p></div>`}
          <div class="card">
            <textarea class="sql-editor" id="sqlEd" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="SQL editor">${esc(draft)}</textarea>
            <div class="btn-row">
              <button class="btn" id="sqlRun">▶ Run <span class="muted small">Ctrl+Enter</span></button>
              ${ex ? `<button class="btn" id="sqlCheck">✓ Check</button>
                <button class="btn btn-ghost btn-sm" id="sqlHint">Hint</button>
                <button class="btn btn-ghost btn-sm" id="sqlSol">Show solution</button>` : ""}
              <button class="btn btn-ghost btn-sm" id="sqlReset">Reset database</button>
            </div>
            <div id="sqlMsg"></div>
            <div id="sqlOut"></div>
          </div>
        </div>
      </div>`;

    const ed = el.querySelector("#sqlEd"), out = el.querySelector("#sqlOut"), msg = el.querySelector("#sqlMsg");
    const say = (cls, html) => { msg.innerHTML = html ? `<div class="sql-msg ${cls}">${html}</div>` : ""; };
    const save = () => { st.drafts[ex ? ex.id : "__free"] = ed.value; saveState(c.id, st); };
    ed.addEventListener("input", save);
    ed.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); doRun(); }
      else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const s = ed.selectionStart;
        ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(ed.selectionEnd);
        ed.selectionStart = ed.selectionEnd = s + 2;
        save();
      }
    });
    let lastResult = null;
    function doRun(sqlText) {
      const r = run(dbFor(c), sqlText || ed.value, allColumns(lab));
      if (r.error) { lastResult = null; say("bad", `<b>Error.</b> ${esc(r.error)}`); out.innerHTML = ""; return null; }
      lastResult = r.result;
      say(r.tip ? "info" : "", r.tip ? esc(r.tip) : "");
      out.innerHTML = table(r.result);
      return r.result;
    }
    el.querySelector("#sqlRun").addEventListener("click", () => doRun());
    el.querySelector("#sqlReset").addEventListener("click", () => { dbs[c.id] = freshDb(lab); say("info", "Database restored to its original data."); });
    el.querySelectorAll("[data-preview]").forEach(b => b.addEventListener("click", e => {
      e.preventDefault();
      doRun(`SELECT TOP (1000) * FROM dbo.${b.dataset.preview}`);
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }));
    if (!ex) return;

    let hintN = 0, tries = 0;
    const hintsEl = el.querySelector("#sqlHints");
    const showHint = () => {
      hintN = Math.min(hintN + 1, ex.hints.length);
      hintsEl.hidden = false;
      hintsEl.innerHTML = ex.hints.slice(0, hintN).map(h => `<div class="sol-step">${h}</div>`).join("");
    };
    el.querySelector("#sqlHint").addEventListener("click", showHint);
    el.querySelector("#sqlSol").addEventListener("click", () => {
      say("info", `<b>One correct solution</b> (others work too):<div class="code">${esc(ex.solution)}</div>${ex.note ? `<p class="muted">${ex.note}</p>` : ""}`);
    });
    el.querySelector("#sqlCheck").addEventListener("click", () => {
      const got = doRun();
      if (!got) return;
      tries++;
      const want = run(freshDb(lab), ex.solution, allColumns(lab)).result;
      const v = compare(got, want, ex.ordered);
      const comments = (ed.value.match(/^\s*--/gm) || []).length >= 2;
      if (v.ok) {
        st.solved[ex.id] = Date.now();
        saveState(c.id, st);
        el.querySelectorAll(".sql-ex.active .sql-tick").forEach(t => { t.textContent = "✓"; });
        const next = lab.exercises[lab.exercises.indexOf(ex) + 1];
        say("good", `<b>Correct.</b> Your result matches the expected ${want.values.length} row${want.values.length === 1 ? "" : "s"}.` +
          (v.tip ? ` ${esc(v.tip)}` : "") +
          (ex.ch >= 10 && !comments ? ` <span class="muted">Habit check: start the file with the two comment lines, the business question and the business requirement.</span>` : "") +
          (ex.note ? `<p class="muted">${ex.note}</p>` : "") +
          (next ? `<p><a class="btn btn-sm" href="${App.link("sqllab", next.id)}">Next: ${esc(next.title)} →</a></p>` : ""));
      } else {
        say("bad", `<b>Not yet.</b> ${esc(v.msg)}${tries >= 2 && hintN < ex.hints.length ? " Try a hint." : ""}`);
        if (tries >= 2 && hintN === 0) showHint();
      }
    });
  }

  return { mount, solvedCount, engine: { mask, statements, translate, sqlServerErrors, run, compare, friendly } };
})();
