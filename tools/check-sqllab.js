#!/usr/bin/env node
/* ============================================================
 * SQL Lab checks — no browser.
 *
 *   node tools/check-sqllab.js
 *
 * Loads the vendored SQLite engine (lib/sqljs/sql-asm.js), js/sqllab.js
 * and every course that declares a sqlLab, then checks:
 *   · the setup script builds the database and the planted problems exist
 *   · every exercise's reference solution runs, returns rows, and is
 *     graded correct against itself (and wrong against a different query)
 *   · SQL Server translation: TOP (n), dbo./[db].[dbo]. prefixes
 *   · the SQL Server-only errors: SELECT alias in WHERE, non-aggregated
 *     column missing from GROUP BY
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failures = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { failures++; console.error("  ✗ " + m); } };

const initSqlJs = require(path.join(root, "lib/sqljs/sql-asm.js"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="((?:js\/core\.js)|(?:courses\/[^"]+))"><\/script>/g)].map(m => m[1]);
const ctx = vm.createContext({ console });
ctx.window = ctx;
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
vm.runInContext(fs.readFileSync(path.join(root, "js/sqllab.js"), "utf8") + "\n;window.SqlLab = SqlLab;", ctx, { filename: "js/sqllab.js" });
const E = ctx.SqlLab.engine;

initSqlJs().then(SQL => {
  console.log("Translation and SQL Server rules");
  ok(/LIMIT 5\s*$/.test(E.translate("SELECT TOP (5) * FROM dbo.CUSTOMERS")), "TOP (5) becomes LIMIT 5");
  ok(!/dbo|HoosierHoldings/.test(E.translate("SELECT [CustomerID] FROM [HoosierHoldings_ClassDB].[dbo].[CUSTOMERS]")), "db/dbo prefixes removed");
  ok(!/TOP/.test(E.translate("SELECT TOP 3 Name FROM dbo.X")), "TOP n without parentheses");
  ok(/Invalid column name 'LineTotal'/.test(E.sqlServerErrors("SELECT (Quantity * SalePrice) AS LineTotal FROM dbo.ORDER_ITEMS WHERE LineTotal > 200", ["Quantity", "SalePrice"]) || ""), "alias in WHERE is rejected");
  ok(E.sqlServerErrors("SELECT (Quantity * SalePrice) AS LineTotal FROM dbo.ORDER_ITEMS WHERE (Quantity * SalePrice) > 200 ORDER BY LineTotal DESC", ["Quantity", "SalePrice"]) === null, "alias in ORDER BY is allowed");
  ok(/not contained in either an aggregate/.test(E.sqlServerErrors("SELECT s.StoreName, s.StoreType, COUNT(*) FROM dbo.STORES s GROUP BY s.StoreName", []) || ""), "missing GROUP BY column is rejected");
  ok(E.sqlServerErrors("SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders FROM dbo.ORDERS o JOIN dbo.STORES s ON o.StoreID = s.StoreID GROUP BY s.StoreName", []) === null, "valid GROUP BY passes");
  ok(/not contained/.test(E.sqlServerErrors("SELECT StoreName, COUNT(*) FROM dbo.STORES", []) || ""), "aggregate without GROUP BY next to a bare column is rejected");
  ok(E.sqlServerErrors("SELECT * FROM dbo.X WHERE Note = 'AS LineTotal'", []) === null, "text inside quotes is ignored");

  for (const course of ctx.STUDY.courses) {
    const lab = course.sqlLab;
    if (!lab) continue;
    console.log(`\n${course.code} SQL Lab: ${lab.exercises.length} exercises`);
    const cols = lab.tables.flatMap(t => t.cols.map(c => c[0]));
    let db;
    try { db = new SQL.Database(); db.run(lab.setup); ok(true, ""); }
    catch (e) { ok(false, `setup failed: ${e.message}`); continue; }
    const one = q => db.exec(q)[0].values[0][0];
    for (const t of lab.tables) ok(one(`SELECT COUNT(*) FROM ${t.name}`) > 0, `${t.name} has rows`);
    ok(one("SELECT COUNT(*) FROM CUSTOMERS WHERE SchoolEmail NOT LIKE '%@iu.edu'") > one("SELECT COUNT(*) FROM CUSTOMERS WHERE SchoolEmail LIKE '%gmail%'"), "non-IU emails go beyond gmail");
    ok(one("SELECT COUNT(*) FROM PRODUCTS p LEFT JOIN STORES s ON p.StoreID = s.StoreID WHERE s.StoreID IS NULL") >= 1, "a product points to a missing store");
    ok(one("SELECT COUNT(*) FROM ORDERS o LEFT JOIN CUSTOMERS c ON o.CustomerID = c.CustomerID WHERE c.CustomerID IS NULL") >= 1, "orphaned orders exist");
    ok(one("SELECT COUNT(*) FROM ORDER_ITEMS WHERE Quantity < 1") >= 3, "non-positive quantities exist");
    ok(one("SELECT COUNT(*) FROM REVIEWS WHERE Rating NOT BETWEEN 1 AND 5") === 1, "exactly one out-of-range rating");
    ok(one("SELECT COUNT(*) FROM ORDER_ITEMS oi JOIN PRODUCTS p ON oi.ProductID = p.ProductID WHERE p.BasePrice - oi.SalePrice > 25") >= 1, "deep discounts exist");
    ok(one("SELECT COUNT(*) FROM ORDERS WHERE OrderDate > '2026-12-31'") === 1, "one far-future order date");

    const ids = new Set();
    for (const ex of lab.exercises) {
      ok(!ids.has(ex.id), `duplicate exercise id ${ex.id}`); ids.add(ex.id);
      ok(ex.title && ex.question && ex.requirement && (ex.hints || []).length >= 2, `${ex.id}: needs title, question, requirement and 2+ hints`);
      const r = E.run(db, ex.solution, cols);
      if (r.error) { ok(false, `${ex.id}: reference solution fails: ${r.error}`); continue; }
      ok(r.result.values.length > 0, `${ex.id}: reference returns rows`);
      ok(E.compare(r.result, r.result, ex.ordered).ok, `${ex.id}: reference grades itself correct`);
      const other = E.run(db, "SELECT 1 AS x", cols).result;
      ok(!E.compare(other, r.result, ex.ordered).ok, `${ex.id}: an unrelated query is graded wrong`);
      if (ex.ordered && r.result.values.length > 1) {
        const rev = { columns: r.result.columns, values: r.result.values.slice().reverse() };
        const same = JSON.stringify(rev.values) === JSON.stringify(r.result.values);
        if (!same) ok(!E.compare(rev, r.result, true).ok, `${ex.id}: wrong order is caught`);
      }
    }
  }
  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures) { console.error(`✗ ${failures} failure(s)`); process.exit(1); }
  console.log("✓ all SQL Lab checks passed");
});
