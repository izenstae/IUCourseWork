/* ============================================================
 * BUS K201 · Chapter 9 · The Verification Gap: Why Production Data
 * Still Needs Checking
 * Schema / RDBMS / client layers, schema vocabulary and data types,
 * constraints and enforced vs logical foreign keys, reading the
 * auto-generated SELECT TOP (1000) query, classifying data problems,
 * auditing records the way the homework does, and deciding whether
 * results are trustworthy enough to act on.
 * Explanations, examples and generated tables are original to this site.
 * (Writing real queries is covered in the separate SQL lab.)
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "bus-k201";
  const K = STUDY.k201;
  const S = K.S;

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const tbl = (head, rows, caption) => `<div class="tbl-wrap"><table class="tbl">${caption ? `<caption>${caption}</caption>` : ""}<thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const code = lines => `<p><code>${lines.join("<br>")}</code></p>`;
  const nonEq = (traps, ans) => {
    const seen = new Set();
    return traps.filter(t => Math.abs(t.value - ans) > Math.max(0.5, Math.abs(ans) * 0.02) && !seen.has(t.value) && seen.add(t.value));
  };
  /* distinct integers in [lo, hi] */
  const distinctInts = (k, lo, hi) => { const p = []; for (let v = lo; v <= hi; v++) p.push(v); return U.sample(p, k); };
  const money2 = x => "$" + x.toFixed(2);

  const FIRST = ["Maya", "Jordan", "Priya", "Luis", "Aisha", "Ben", "Chloe", "Diego", "Hana", "Isaac", "Keisha", "Mateo",
    "Nora", "Omar", "Quinn", "Rosa", "Sam", "Tariq", "Uma", "Wes", "Yara", "Zoe", "Elena", "Malik", "Grace", "Devin"];
  const LAST = ["Nguyen", "Patel", "Garcia", "Smith", "Okafor", "Kim", "Reyes", "Brooks", "Chen", "Haddad", "Larsen",
    "Moore", "Singh", "Turner", "Walsh", "Young", "Diaz", "Fischer", "Ito", "Jensen"];
  const MAJORS = ["Finance", "Marketing", "Accounting", "Informatics", "Biology", "Economics", "Supply Chain", "Psychology", "Journalism", "Music"];
  const OTHER_DOMAINS = ["yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];
  const STORES = [
    { id: 1, name: "The Tech Den" },
    { id: 2, name: "Kirkwood Couture" },
    { id: 3, name: "Dorm Depot" },
  ];
  const PRODUCTS_BY_STORE = {
    1: ["USB-C hub", "Wireless mouse", "Laptop stand", "Noise-cancelling earbuds", "65W charger", "Webcam"],
    2: ["Crimson hoodie", "Denim jacket", "Wool scarf", "Canvas tote", "Rain boots", "Knit beanie"],
    3: ["Twin XL sheet set", "Desk lamp", "Mini fridge", "Shower caddy", "Storage bins", "Mattress topper"],
  };
  const PRICES = [12.99, 19.5, 24.99, 34.0, 49.99, 59.95, 79.0, 89.99, 14.25, 29.99];

  function people(k) {
    const f = U.sample(FIRST, k), l = U.sample(LAST, k);
    return f.map((x, i) => ({ first: x, last: l[i] }));
  }
  const handle = p => (p.first[0] + p.last).toLowerCase().replace(/[^a-z]/g, "");

  /* ---------- the Hoosier Holdings tables as the course shows them ---------- */
  const TABLE_COLS = {
    CUSTOMERS: ["CustomerID", "FirstName", "LastName", "SchoolEmail", "Major", "GradYear"],
    STORES: ["StoreID", "StoreName", "LaunchDate"],
    PRODUCTS: ["ProductID", "ProductName", "BasePrice", "StoreID"],
    ORDERS: ["OrderID", "CustomerID", "StoreID", "OrderDate"],
    ORDER_ITEMS: ["OrderID", "ProductID", "Quantity", "SalePrice"],
    REVIEWS: ["ReviewID", "ProductID", "CustomerID", "Rating", "ReviewText"],
  };
  const TABLES = Object.keys(TABLE_COLS);
  const genQuery = (t, n) => [
    `SELECT TOP (${n}) ${TABLE_COLS[t].map(c => `[${c}]`).join(", ")}`,
    `FROM [HoosierHoldings_ClassDB].[dbo].[${t}]`,
  ];

  /* ---------- an inline diagram of the three layers ---------- */
  const LAYERS_SVG = `<svg viewBox="0 0 520 170" style="max-width:100%;height:auto" role="img" aria-label="Three layers: schema, RDBMS, client">
<rect x="10" y="40" width="150" height="80" rx="8" fill="none" stroke="currentColor"/>
<rect x="185" y="40" width="150" height="80" rx="8" fill="none" stroke="currentColor"/>
<rect x="360" y="40" width="150" height="80" rx="8" fill="none" stroke="currentColor"/>
<text x="85" y="68" text-anchor="middle" fill="currentColor" font-size="15" font-weight="bold">Schema</text>
<text x="85" y="88" text-anchor="middle" fill="currentColor" font-size="12">the ERD / blueprint</text>
<text x="85" y="106" text-anchor="middle" fill="currentColor" font-size="12">what should exist</text>
<text x="260" y="68" text-anchor="middle" fill="currentColor" font-size="15" font-weight="bold">RDBMS</text>
<text x="260" y="88" text-anchor="middle" fill="currentColor" font-size="12">SQL Server / building</text>
<text x="260" y="106" text-anchor="middle" fill="currentColor" font-size="12">stores, enforces, runs</text>
<text x="435" y="68" text-anchor="middle" fill="currentColor" font-size="15" font-weight="bold">Client</text>
<text x="435" y="88" text-anchor="middle" fill="currentColor" font-size="12">VS Code + mssql</text>
<text x="435" y="106" text-anchor="middle" fill="currentColor" font-size="12">your window in</text>
<line x1="160" y1="80" x2="185" y2="80" stroke="currentColor"/>
<line x1="335" y1="80" x2="360" y2="80" stroke="currentColor"/>
<text x="260" y="150" text-anchor="middle" fill="currentColor" font-size="12">The client sends queries to the RDBMS, which manages data organised by the schema.</text>
</svg>`;

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "The verification gap and the three layers you work through",
      lo: "Explain why a live production database still needs checking, and distinguish the schema, the RDBMS and the client.",
      html: `<p>When a business decision goes wrong and someone traces it back to the numbers, the first awkward question is usually <em>"Did anyone actually check the data?"</em> A database being <b>in production</b> (live, running, used every day) tells you it <em>works</em>. It does not tell you the data inside it is <em>right</em>.</p>
<p>The chapter's case is <b>Hoosier Holdings</b>, which runs three student-focused storefronts on one shared database: <b>The Tech Den</b>, <b>Kirkwood Couture</b> and <b>Dorm Depot</b>. Leadership sets prices, schedules staff and orders stock from that database. Your job as the analyst is to verify the data before those decisions are made.</p>
<p>To do that you work through three layers:</p>
${ul([
        "<b>Schema</b>: the formal structure of the database. It lists the tables, each table's columns, the data type of each column, and how the tables relate. An ERD is a picture of a schema. In Chapter 8 the ERD was a design proposal. Here it describes a database that has already been built and is in use.",
        "<b>RDBMS</b> (relational database management system): the software that actually stores the database and runs it. It holds the data in the shape the schema defines, enforces whatever constraints it was configured with, processes queries, controls who gets in, and keeps the data safe when the machine shuts down or restarts. Hoosier Holdings uses <b>Microsoft SQL Server</b>. Oracle Database, PostgreSQL and MySQL are other RDBMSs, and the same relational logic carries over to them with small syntax changes.",
        "<b>Client</b>: a separate program on <em>your</em> computer that connects to the database server and sends it instructions. The RDBMS has no screen of its own. For SQL Server, clients include SQL Server Management Studio (SSMS, the traditional choice), Azure Data Studio, third-party tools and command-line tools. K201 uses <b>Visual Studio Code</b> (a free code editor from Microsoft) with Microsoft's <b>SQL Server (mssql)</b> extension.",
      ])}
${LAYERS_SVG}
<div class="keyidea"><b>Key idea.</b> Schema = the blueprint of a building, the data = what is in the rooms, the RDBMS = the building itself (walls, locks, climate control and the staff who let visitors in). The client is the door you walk through. "It's live" is a fact about the building, not about what is in the rooms.</div>
<div class="example"><b>Example.</b> A campus bookstore's inventory system has run for five years without crashing. A manager reorders 400 copies of a textbook because the system shows zero stock. In fact a clerk logged returns with the wrong ISBN, so the copies were sitting on the shelf. The system was <em>running</em> the whole time; nobody had <em>verified</em> the records behind the decision.</div>
<div class="trap"><b>Common trap.</b> Mixing up the RDBMS and the client. VS Code does not store the Hoosier Holdings data, and uninstalling it would not delete a single row. It is only a window. SQL Server holds the data and enforces (or fails to enforce) the rules. A second trap: thinking that you are here to learn VS Code. The editor is just the tool; the skill is navigating and evaluating a database. Saving your queries as files in VS Code also leaves a record of what you checked, which supports accountability.</div>`,
      gens: ["k201-ch9-layers"],
    },
    {
      title: "From ERD to schema: tables, columns and data types",
      lo: "Interpret a database schema: map ERD terms to tables and columns, and pick or read data types.",
      html: `<p>The ERD vocabulary from Chapter 8 turns into concrete database vocabulary once the design is built:</p>
${tbl(["ERD term", "In the built database", "Hoosier Holdings example"], [
        ["Entity", "Table", "CUSTOMERS, ORDERS"],
        ["Attribute", "Column (field)", "SchoolEmail, BasePrice"],
        ["Primary key (PK)", "Unique identifier the database enforces", "CustomerID in CUSTOMERS, OrderID in ORDERS"],
        ["Foreign key (FK)", "Column that points to a row in another table; may be enforced or only logical", "StoreID in PRODUCTS, CustomerID in ORDERS"],
        ["Business rule", "A constraint, or a gap where a constraint ought to be", "Rating must be 1–5; customers must have an iu.edu email"],
      ])}
<p>The database has six tables: <b>STORES</b> (the three storefronts), <b>CUSTOMERS</b> (expected to be IU students), <b>PRODUCTS</b> (each tied to a store by StoreID), <b>ORDERS</b> (with a CustomerID FK and a StoreID FK), <b>ORDER_ITEMS</b> (the line items; its two FKs, OrderID and ProductID, resolve the many-to-many link between orders and products) and <b>REVIEWS</b> (customer feedback tied to products).</p>
<p>Every column has a <b>data type</b>. A data type is a <em>rule</em>, not a label: the database refuses a value of the wrong type before it is ever stored. Four types cover most of this course:</p>
${ul([
        "<b>INT</b>: whole numbers. CustomerID, Quantity, GradYear.",
        "<b>VARCHAR(n)</b>: text of varying length, up to <i>n</i> characters. Names, emails, majors, categories. VARCHAR(50) holds at most 50 characters.",
        "<b>DECIMAL(10,2)</b>: exact numbers with two digits after the decimal point (up to 10 digits in total). Prices such as BasePrice and SalePrice.",
        "<b>DATE</b>: calendar dates. OrderDate, LaunchDate.",
      ])}
<p>In VS Code, each table's <b>Columns</b> folder lists every column with its type and either <b>null</b> (the field may be left empty) or <b>not null</b> (a value is required, which is what you want for a primary key). For CUSTOMERS it shows CustomerID (PK, int, not null), FirstName and LastName (varchar(50)), SchoolEmail and Major (varchar(100)) and GradYear (int).</p>
<div class="keyidea"><b>Key idea.</b> Choose the type by what the value <em>is</em> and how it will be used: counts and IDs → INT, money → DECIMAL(10,2), calendar days → DATE, words and codes → VARCHAR(n). An INT column refuses "yesterday", and a DATE column refuses an email address.</div>
<div class="example"><b>Example.</b> A gym's member table: MemberID INT, FullName VARCHAR(80), MonthlyFee DECIMAL(10,2), JoinDate DATE, VisitsThisMonth INT. Phone number? VARCHAR, even though it is made of digits. You never add phone numbers together, and formats like "(812) 555-0147" contain symbols.</div>
<div class="trap"><b>Common trap.</b> "It's made of digits, so it's an INT." ZIP codes, phone numbers and student ID numbers with leading zeros are identifiers, not quantities. Store them as text. A second trap: thinking the type also checks whether a value makes <em>sense</em>. An INT Rating column happily accepts 10, because 10 is a perfectly good whole number. Keeping ratings between 1 and 5 needs a separate business-rule constraint.</div>`,
      gens: ["k201-ch9-types"],
    },
    {
      title: "Constraints, and enforced vs. logical foreign keys",
      lo: "Explain the categories of constraints and the difference between an enforced and a logical foreign key.",
      html: `<p>A <b>constraint</b> is a rule the database can be set up to enforce automatically whenever data is entered. Three families matter here:</p>
${ul([
        "<b>Data type constraints</b>: each column only accepts its declared type (INT, DATE…).",
        "<b>Key constraints</b>: a <b>primary key</b> must be unique within its table; a <b>foreign key</b>, <em>when enforced</em>, must match an existing primary-key value in the table it points to.",
        "<b>Business rule constraints</b>: the organisation's own rules, such as Rating must be between 1 and 5, or SchoolEmail cannot be empty.",
      ])}
<p>The FK is where the trouble hides. An <b>enforced FK</b> makes the database reject any row whose FK value does not match a real PK. With an enforced FK on ORDERS.CustomerID, an order for customer 9999 simply cannot be saved if there is no customer 9999. A <b>logical FK</b> is a relationship documented in the schema (drawn on the ERD) that the database does <em>not</em> check. Rows that break it go in without any warning.</p>
<p>Hoosier Holdings uses logical FKs. That is a common real-world choice, made for speed, to stay compatible with older systems, or because enforcement was "postponed" and nobody came back to it. The result is that the database accepts data the ERD says should not exist.</p>
<div class="keyidea"><b>Key idea.</b> You cannot tell from the ERD whether a constraint is enforced. The lines look the same either way. You find out by looking at the data: if violating rows exist, the rule was not enforced.</div>
<div class="example"><b>Example.</b> A food-delivery app's DELIVERIES table has a DriverID column pointing to DRIVERS. Its designers left the FK logical to speed up order intake. Months later, 3% of deliveries list driver IDs that were deleted when contractors left, and the payroll report silently drops those trips. Nothing ever errored; the rows just didn't match anything.</div>
<div class="trap"><b>Common trap.</b> "I checked and found no orphan rows, so the FK must be enforced." Absence of violations only shows that none have happened <em>yet</em>; a logical FK could still let one in tomorrow. The reverse does hold: if you find even one orphan row, the FK is not being enforced. And the manager who approved go-live owns the data-quality problems that follow. "It's in production" does not shift that responsibility.</div>`,
      gens: ["k201-ch9-constraints"],
    },
    {
      title: "Reading the auto-generated query and the results pane",
      lo: "Read a basic SQL query (SELECT, TOP, column list, FROM) and explain how row limits, sorts and filters change what you see.",
      html: `<p>In VS Code you open the connection, expand <b>Tables</b> (you'll see <code>dbo.CUSTOMERS</code>, <code>dbo.ORDERS</code>, <code>dbo.ORDER_ITEMS</code>, <code>dbo.PRODUCTS</code>, <code>dbo.REVIEWS</code>, <code>dbo.STORES</code>; <b>dbo</b> stands for "database owner", the default schema grouping), right-click a table and choose <b>Select Top 1000</b>. The client writes a query, runs it, and shows the rows in a results panel. For CUSTOMERS the query looks like this:</p>
${code(genQuery("CUSTOMERS", 1000))}
${ul([
        "<b>SELECT</b> starts the query and introduces the list of columns to return. <b>SQL</b> stands for Structured Query Language.",
        "<b>TOP (1000)</b> caps the result at <em>at most</em> 1,000 rows. If the table has 240 rows you get 240; if it has 5,000 you get only 1,000.",
        "<b>[CustomerID], [FirstName], …</b> is the column list: exactly which fields come back, in that order. The square brackets just mark names.",
        "<b>FROM</b> names where the rows come from: database <code>[HoosierHoldings_ClassDB]</code>, schema <code>[dbo]</code>, table <code>[CUSTOMERS]</code>.",
        "Lines starting with <b>--</b> are <b>comments</b>. The database ignores them, so they are where you write your observations in the homework files (saved as <code>TABLENAME_Observation.sql</code>).",
      ])}
<p>The results grid looks like Excel, and you can click column headers to sort (once for ascending, again for descending) or filter. Those clicks change only the <b>display</b>. They are not written into the SQL, and they do not change the table.</p>
<div class="keyidea"><b>Key idea.</b> The SQL decides <em>which rows and columns come back</em>; the grid decides <em>how you look at them</em>. A result of exactly 1,000 rows is a warning sign: it is probably the TOP cap, not the size of the table. Remove <code>TOP (1000)</code> and re-run to see everything and the true count.</div>
<div class="example"><b>Example.</b> You run Select Top 1000 on ORDERS and get 1,000 rows. You delete <code>TOP (1000)</code>, run it again, and the status shows 2,316 rows. More than half the orders were invisible to your first look. Anything you counted the first time was counted on a partial table.</div>
<div class="trap"><b>Common trap.</b> Forgetting a grid filter. After filtering PRODUCTS to StoreID 2 you might later glance at the grid and believe the table only holds those rows. The filter changed the view, not the table. Before you draw a conclusion, read the column headers first (do they match the ERD?), then scan the data with a specific question in mind.</div>`,
      gens: ["k201-ch9-sqlread"],
    },
    {
      title: "Three kinds of data problems, and which ones a constraint could stop",
      lo: "Classify a data problem as a referential-integrity violation, a business-rule violation or a data-quality failure, and judge whether an enforced constraint could have prevented it.",
      html: `<p><b>Referential integrity</b> means every FK value actually exists in the table it points to. An order whose CustomerID is not in CUSTOMERS is an <b>unmatched</b> (or <b>orphaned</b>) record. The <b>verification gap</b> is the distance between what the database <em>seems</em> to do and what it actually enforces. A query can run perfectly and still return unmatched, incomplete or unreliable rows. Many managers assume that "it's in the database" means "it's accurate".</p>
<p>Sort problems into three categories:</p>
${tbl(["Category", "What it looks like", "Could a constraint have stopped it?"], [
        ["<b>Referential integrity violation</b>", "A row points to something that doesn't exist: an order for a missing customer, a product in StoreID 7", "Yes: an <b>enforced FK</b>"],
        ["<b>Business rule violation</b>", "Structurally valid, operationally wrong: Rating 10 on a 1–5 scale, a gmail address where iu.edu is required", "Yes: a <b>business-rule constraint</b> (e.g. a range check)"],
        ["<b>Data quality failure</b>", "Incomplete, inconsistent or impossible: \"Test User\", \"Mktg\" vs \"Marketing\", an order dated 2035, the same student entered twice", "Sometimes, with stricter constraints; often it takes <b>human judgment</b>"],
      ])}
<div class="keyidea"><b>Key idea.</b> Ask two questions. (1) <em>Does it point to something missing?</em> Then it's referential integrity. (2) <em>Is it a valid value that breaks a stated rule?</em> Then it's a business rule. Everything else that makes the data incomplete, inconsistent or implausible is data quality. Then ask whether a rule the database checks automatically could have caught it, or whether only a person who knows the business could spot it.</div>
<div class="example"><b>Example.</b> In a gym's database: a check-in for MemberID 5521, who doesn't exist (referential integrity; an enforced FK would have rejected it). A membership with a monthly fee of $0 when the policy minimum is $15 (business rule; a range constraint would have caught it). A member named "Asdf Asdf" (data quality; no type or key rule objects to that string, so a person has to notice).</div>
<div class="trap"><b>Common trap.</b> Calling every bad value a "data quality" problem. If the value points at a missing parent row, the more precise label is referential integrity. If it breaks a stated business rule, the label is business rule. Another trap: assuming every problem is preventable. A duplicate customer with a slightly different spelling, or a plausible but wrong price, passes every constraint. It takes a person to catch it.</div>`,
      gens: ["k201-ch9-problems"],
    },
    {
      title: "Auditing records systematically: the five homework tables",
      lo: "Identify missing, inconsistent, placeholder, out-of-range and unmatched records in query results.",
      html: `<p>The homework walks through one table at a time. Each exercise also contains a <b>micro-disruption</b>: a realistic slip that makes a careful analyst reach the wrong conclusion.</p>
${tbl(["Table", "What you check", "The slip to avoid"], [
        ["STORES", "Count the stores (3) and the StoreID values (1, 2, 3); sort by LaunchDate descending (two clicks)", "Expecting the sort to be saved in the SQL. It isn't."],
        ["CUSTOMERS", "Every SchoolEmail should be iu.edu", "Filtering for \"gmail\" only. Yahoo, Outlook and iCloud addresses are still hiding."],
        ["PRODUCTS", "Every StoreID should be 1, 2 or 3", "Forgetting to clear a filter, then thinking the table has only those rows"],
        ["ORDERS", "Every CustomerID should exist in CUSTOMERS", "Treating 1,000 rows as the table size; it's the TOP cap"],
        ["REVIEWS", "Every Rating should be 1–5", "Eye-scanning thousands of rows instead of sorting or filtering"],
      ])}
<p>The lesson behind the slips: <b>finding one kind of problem does not prove there are no others.</b> A search for "gmail" is like a query condition that only matches exactly what you asked for. It finds what you thought to look for, nothing more. Check against the <em>rule</em> ("ends in @iu.edu?"), not against one example of breaking it.</p>
<div class="keyidea"><b>Key idea.</b> Audit with the rule, the whole table and a method. State the rule, make sure you are looking at every row (no TOP cap, no leftover filter), then sort or filter to bring the violators to the top instead of trusting your eyes.</div>
<div class="example"><b>Example.</b> Checking a REVIEWS table: sort Rating ascending and look at the first rows (anything below 1?), then sort descending and look again (anything above 5?). Two clicks inspect every row's rating. Scrolling would take an hour and could still miss the single 10.</div>
<div class="trap"><b>Common trap.</b> "It's mostly correct, so the report is fine." A revenue report built on data that is 95% right can still rank stores in the wrong order or send stock to the wrong place. Count the problem rows and judge their effect on the decision (next lesson).</div>`,
      gens: ["k201-ch9-audit"],
    },
    {
      title: "Trustworthy enough to decide? The checklist, and act / pause / investigate",
      lo: "Evaluate whether query results are trustworthy enough for a decision and recommend act, pause or investigate based on the evidence.",
      html: `<p>A query can run without a single error and still mislead. Before results go to a decision maker, walk the evaluation checklist:</p>
<ol>
<li><b>Does the schema reflect the business?</b> Are the real entities and relationships there?</li>
<li><b>Are relationships enforced?</b> Are the FKs enforced or only logical? Are there orphan rows?</li>
<li><b>Are business rules implemented as constraints?</b> For example, does Rating actually block values outside 1–5?</li>
<li><b>Is the data complete and consistent?</b> Missing values, impossible dates, out-of-range numbers, placeholders, duplicates?</li>
<li><b>Does the data support the decision?</b> Would you trust a revenue report built on it?</li>
</ol>
<p>Then make a recommendation the evidence can back:</p>
${ul([
        "<b>Act</b>: you checked, and anything you found is too small or too far from the decision to change it. Note what you saw and go ahead.",
        "<b>Investigate</b>: something looks off but you don't yet know how big it is or whether it touches the decision. Dig further and quantify before anyone decides.",
        "<b>Pause</b>: a confirmed problem (unmatched or invalid records) materially affects the decision. Hold the decision until the data is fixed or the analysis is corrected.",
      ])}
<div class="keyidea"><b>Key idea.</b> The question is not "is the data perfect?" (it never is). The question is "could what I found change this decision?" Quantify the impact, for example the share of revenue sitting on unmatched orders, and let that number drive act, investigate or pause.</div>
<div class="example"><b>Example.</b> Leadership wants to cut Dorm Depot's weekend staff because its order count is lowest. Your audit shows 18% of all orders carry StoreID 4 or 5, which don't exist. Some of those orders may well be Dorm Depot's. The ranking that drives the staffing cut might flip once they're fixed, so the right call is <b>pause</b>.</div>
<div class="trap"><b>Common trap.</b> Treating "the query ran" as "the answer is right". Success messages mean the SQL was valid, not that the rows are complete, matched or sensible. The opposite trap is refusing to act on anything imperfect: one bad rating among 3,000 that doesn't move any average you care about is a note in the margin, not a reason to stop.</div>`,
      gens: ["k201-ch9-decide"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "k201-ch9-c-gap", tag: "Definition", front: "What is the <em>verification gap</em>?", back: "The difference between what a database <b>appears</b> to be doing and what it actually <b>enforces</b>. A query can run successfully and still return unmatched, incomplete or unreliable records." },
    { id: "k201-ch9-c-live", tag: "Why", front: "Why doesn't \"the database is in production\" mean the data is reliable?", back: "Being live only shows the system <b>runs</b>. If rules such as foreign keys or rating ranges were never enforced, bad rows still go in. Someone has to verify the data before decisions are made, and the manager who approved go-live owns the resulting quality problems." },
    { id: "k201-ch9-c-hh", tag: "Case", front: "What is Hoosier Holdings, and what are its three storefronts?", back: "A retail business with three storefronts sharing one database: <b>The Tech Den</b>, <b>Kirkwood Couture</b> and <b>Dorm Depot</b>. Leadership makes pricing, staffing and purchasing decisions from that database; the analyst verifies the data first." },
    { id: "k201-ch9-c-rdbms", tag: "Definition", front: "What is an <em>RDBMS</em>, and what does it do?", back: "A relational database management system: the software that stores relational databases and runs them. It holds the data in the shape the schema defines, enforces constraints, processes queries, controls access and keeps data across shutdowns and restarts. Examples: Microsoft SQL Server (used by Hoosier Holdings), Oracle Database, PostgreSQL, MySQL." },
    { id: "k201-ch9-c-analogy", tag: "Analogy", front: "In the building analogy, what are the schema, the data and the RDBMS?", back: "Schema = the <b>blueprint</b>; data = the <b>contents of the rooms</b>; RDBMS = the <b>building itself</b>: its structure, locks, climate control and the people who let visitors in." },
    { id: "k201-ch9-c-client", tag: "Definition", front: "What is a database <em>client</em>, and why do you need one?", back: "A separate program on your computer that connects to the database server and sends it instructions. You need one because the RDBMS has no built-in screen. SQL Server clients: SSMS (traditional), Azure Data Studio, third-party and command-line tools. K201 uses VS Code with the SQL Server (mssql) extension." },
    { id: "k201-ch9-c-layers", tag: "List", front: "Name the three layers you work through, with Hoosier Holdings' version of each.", back: "<b>Schema</b> (the ERD), <b>RDBMS</b> (Microsoft SQL Server), <b>client</b> (VS Code + mssql extension)." },
    { id: "k201-ch9-c-schema", tag: "Definition", front: "What is a <em>schema</em>?", back: "The formal structural definition of a database: which tables exist, their columns, each column's data type, and how the tables relate. The Chapter 8 ERD was a proposal; the Hoosier Holdings ERD describes a database that is built and live." },
    { id: "k201-ch9-c-vocab", tag: "Mapping", front: "Translate ERD terms to database terms: entity, attribute, PK, FK, business rule.", back: "Entity → <b>table</b>; attribute → <b>column/field</b>; PK → unique identifier the database enforces; FK → column linking to another table (enforced or logical); business rule → a <b>constraint</b>, or a gap where one should exist." },
    { id: "k201-ch9-c-types", tag: "List", front: "Name the four core data types and a Hoosier Holdings column for each.", back: "<b>INT</b> (CustomerID, Quantity); <b>VARCHAR(n)</b> (names, SchoolEmail, Major); <b>DECIMAL(10,2)</b> (BasePrice, SalePrice); <b>DATE</b> (OrderDate, LaunchDate)." },
    { id: "k201-ch9-c-typerule", tag: "Why", front: "Why is a data type \"a rule, not a label\"? Give an example.", back: "The database refuses a value of the wrong type before storing it. An INT column rejects \"yesterday\"; a DATE column rejects an email address." },
    { id: "k201-ch9-c-phone", tag: "Example", front: "Why store a phone number or ZIP code as VARCHAR, not INT?", back: "They are identifiers, not quantities: you never do arithmetic on them, they can contain symbols, and leading zeros (ZIP 02134) would be lost as a number." },
    { id: "k201-ch9-c-null", tag: "Reading", front: "In the Columns folder, what do <code>null</code> and <code>not null</code> mean?", back: "<b>null</b>: the field may be left empty. <b>not null</b>: a value is required, which is what you want for a primary key such as CustomerID." },
    { id: "k201-ch9-c-constraint", tag: "Definition", front: "What is a <em>constraint</em>, and what are its three categories?", back: "A rule the database can be configured to enforce automatically when data is entered. Categories: <b>data type</b> constraints; <b>key</b> constraints (PK unique; enforced FK must match an existing PK); <b>business rule</b> constraints (Rating 1–5; SchoolEmail not empty)." },
    { id: "k201-ch9-c-fk", tag: "Difference", front: "What's the difference between an <em>enforced</em> and a <em>logical</em> foreign key?", back: "<b>Enforced</b>: the database rejects any row whose FK value doesn't match an existing PK. <b>Logical</b>: the relationship is documented in the schema but not checked, so violating rows go in without warning. Hoosier Holdings uses logical FKs." },
    { id: "k201-ch9-c-whylogical", tag: "Why", front: "Why do real companies leave foreign keys logical?", back: "For performance, for compatibility with older (legacy) systems, or because enforcement was postponed and never revisited." },
    { id: "k201-ch9-c-detect", tag: "Why", front: "Can you tell from the ERD whether a constraint is enforced? How do you find out?", back: "No. Enforced and logical relationships look the same on the diagram. Look at the data: if violating rows exist (e.g. orders for missing customers), the rule isn't enforced." },
    { id: "k201-ch9-c-refint", tag: "Definition", front: "What is <em>referential integrity</em>, and what is an orphaned record?", back: "The guarantee that every FK value exists in the referenced table. A row whose FK points to nothing (an order whose CustomerID isn't in CUSTOMERS) is an <b>unmatched/orphaned</b> record." },
    { id: "k201-ch9-c-three", tag: "List", front: "Name the three categories of data problems, with an example of each.", back: "<b>Referential integrity violation</b>: a product in StoreID 7. <b>Business rule violation</b>: a Rating of 10 on a 1–5 scale. <b>Data quality failure</b>: \"Test User\", inconsistent spellings, an order dated 2035, duplicate customers." },
    { id: "k201-ch9-c-prevent", tag: "Difference", front: "Which problem types could a constraint have prevented, and which need human judgment?", back: "Referential integrity: an <b>enforced FK</b> would catch it. Business rule: a <b>business-rule constraint</b> would. Data quality: <em>some</em> could be caught by stricter constraints, but placeholders, inconsistent spellings and duplicate people usually need <b>human judgment</b>." },
    { id: "k201-ch9-c-top", tag: "Reading", front: "What does <code>TOP (1000)</code> do, and what does a 1,000-row result tell you?", back: "It returns <b>at most</b> 1,000 rows. Exactly 1,000 rows probably means you hit the cap, not that the table has 1,000 rows. Remove TOP and re-run to see every row and the true count." },
    { id: "k201-ch9-c-select", tag: "Reading", front: "Read <code>SELECT TOP (1000) [CustomerID], [FirstName] FROM [HoosierHoldings_ClassDB].[dbo].[CUSTOMERS]</code>.", back: "Return at most 1,000 rows, showing only the CustomerID and FirstName columns, from the CUSTOMERS table in the dbo schema of the HoosierHoldings_ClassDB database." },
    { id: "k201-ch9-c-dbo", tag: "Definition", front: "What does <code>dbo</code> mean in <code>dbo.CUSTOMERS</code>?", back: "\"Database owner\": the default schema that groups the tables." },
    { id: "k201-ch9-c-grid", tag: "Why", front: "You sort and filter in the results pane. What changes in the SQL or the table?", back: "Nothing. Sorting and filtering in the grid change only the <b>display</b>. They aren't saved in the SQL and don't alter the table. That's why a forgotten filter can make you think a table holds fewer rows than it does." },
    { id: "k201-ch9-c-comment", tag: "Reading", front: "What does a line starting with <code>--</code> do in a .sql file?", back: "It's a <b>comment</b>: the database ignores it. In the homework you record observations as comments in files named TABLENAME_Observation.sql." },
    { id: "k201-ch9-c-gmail", tag: "Example", front: "Why is filtering CUSTOMERS for \"gmail\" not enough to check the iu.edu rule?", back: "It only finds gmail addresses. Yahoo, Outlook and iCloud addresses also break the rule. Finding one kind of problem doesn't confirm there are no others; check every row against the rule itself." },
    { id: "k201-ch9-c-habits", tag: "List", front: "What two reading habits should you use when you open a table's results?", back: "(1) Read the column headers first: do they match the ERD? (2) Scan the data with a question in mind: does this match what the business says should be here?" },
    { id: "k201-ch9-c-checklist", tag: "List", front: "List the five evaluation-checklist questions.", back: "1) Does the schema reflect the business entities? 2) Are relationships enforced? 3) Are business rules implemented as constraints? 4) Is the data complete and consistent? 5) Does the data support the decision?" },
    { id: "k201-ch9-c-api", tag: "Difference", front: "Act vs. investigate vs. pause: when is each the right call?", back: "<b>Act</b>: checked, and what you found can't change the decision. <b>Investigate</b>: something looks off but its size or reach is unknown, so dig and quantify. <b>Pause</b>: a confirmed problem materially affects the decision, so hold until it's fixed." },
    { id: "k201-ch9-c-mostly", tag: "Why", front: "Why can a report built on \"mostly correct\" data still be dangerous?", back: "A small share of bad rows can still flip a ranking, misstate revenue or send stock to the wrong store. What matters is whether the problems could change the decision, so quantify their impact." },
    { id: "k201-ch9-c-systematic", tag: "Example", front: "How do you find an out-of-range rating among thousands of reviews without eye-scanning?", back: "Sort Rating ascending and check the top rows (anything below 1?), then descending (anything above 5?), or filter for values outside 1–5. Systematic beats scrolling." },
    { id: "k201-ch9-c-m2m", tag: "Schema", front: "How does ORDER_ITEMS fit into the Hoosier Holdings schema?", back: "It holds the line items of each order. Its two FKs (OrderID → ORDERS, ProductID → PRODUCTS) resolve the many-to-many relationship between orders and products." },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“stores the data, enforces rules, runs queries”, SQL Server, Oracle, PostgreSQL", think: "RDBMS", why: "The software that is the \"building\"; it holds and manages the data." },
    { when: "“tables, columns, types, relationships”, the ERD of a built database", think: "Schema", why: "The blueprint: what should exist, not the data itself." },
    { when: "VS Code, SSMS, Azure Data Studio, “connects and sends instructions”", think: "Client", why: "The RDBMS has no screen; the client is your window in." },
    { when: "a whole number you count or an ID: Quantity, CustomerID", think: "INT", why: "Whole numbers only; rejects text like \"yesterday\"." },
    { when: "money, prices with cents", think: "DECIMAL(10,2)", why: "Exact numbers with two decimal places." },
    { when: "a value points to a row that doesn't exist (StoreID 7, missing customer)", think: "Referential integrity violation", why: "An enforced FK would have rejected it." },
    { when: "a valid value that breaks a stated rule (Rating 10, a gmail address)", think: "Business rule violation", why: "Structurally fine, operationally wrong; a business-rule constraint would catch it." },
    { when: "“Test User”, “Mktg” vs “Marketing”, a 2035 order date, the same person twice", think: "Data quality failure", why: "Incomplete, inconsistent or impossible; often needs human judgment." },
    { when: "the ERD shows a relationship but bad rows exist anyway", think: "Logical (unenforced) foreign key", why: "Documented but not checked by the database." },
    { when: "exactly 1,000 rows came back", think: "TOP (1000) cap", why: "At most 1,000 rows; remove TOP to see the real count." },
    { when: "“I sorted/filtered the grid”", think: "Display only", why: "Not saved in the SQL; the table is unchanged." },
    { when: "“I searched for gmail and found…”", think: "One symptom ≠ all problems", why: "Check every row against the rule, not one way of breaking it." },
    { when: "“the query ran fine, so we can use it”", think: "Verification gap", why: "Valid SQL can still return unmatched or unreliable rows." },
    { when: "a known problem that could change the decision", think: "Pause", why: "Hold the decision until the data is fixed or the analysis corrected." },
    { when: "something looks off but you don't know how big it is", think: "Investigate", why: "Quantify the impact before deciding." },
  ];

  /* ============================================================
   * TOPIC 1 · Layers: schema, RDBMS, client
   * ============================================================ */
  const LAYER_BANK = [
    { t: "Lists the tables CUSTOMERS, ORDERS and REVIEWS and the columns each contains", cat: "Schema", why: "Describing which tables and columns exist is the structural definition, the blueprint." },
    { t: "Specifies that BasePrice is DECIMAL(10,2) and OrderDate is DATE", cat: "Schema", why: "Column data types are part of the database's formal structure." },
    { t: "Shows that ORDERS links to CUSTOMERS through CustomerID", cat: "Schema", why: "How tables relate is part of the structural definition, usually drawn as an ERD." },
    { t: "The ERD describing Hoosier Holdings' six tables", cat: "Schema", why: "An ERD is a picture of the schema." },
    { t: "The blueprint in the building analogy", cat: "Schema", why: "The schema is the plan of what should exist, not the building or its contents." },
    { t: "Declares CustomerID as the primary key of CUSTOMERS", cat: "Schema", why: "Which column identifies each row is a design decision recorded in the schema." },
    { t: "Microsoft SQL Server running on a server", cat: "RDBMS", why: "SQL Server is the database software that stores and manages the data." },
    { t: "Keeps every order safe when the server restarts overnight", cat: "RDBMS", why: "Persisting data across shutdowns and restarts is a job of the database management system." },
    { t: "Rejects a row because a value has the wrong data type", cat: "RDBMS", why: "Enforcing constraints at data entry is done by the RDBMS." },
    { t: "Processes a query and works out which rows to return", cat: "RDBMS", why: "Query processing happens inside the database software, not on your laptop's editor." },
    { t: "Checks a login before letting a user read the tables", cat: "RDBMS", why: "Access control (the \"people who let visitors in\") is an RDBMS job." },
    { t: "PostgreSQL, Oracle Database or MySQL", cat: "RDBMS", why: "These are alternative relational database management systems." },
    { t: "The building itself in the building analogy: walls, locks, climate control", cat: "RDBMS", why: "The RDBMS is the structure that houses and protects the data." },
    { t: "Visual Studio Code with the SQL Server (mssql) extension", cat: "Client", why: "VS Code is a program on your computer that connects to the server and sends instructions." },
    { t: "SQL Server Management Studio (SSMS) on an analyst's laptop", cat: "Client", why: "SSMS is the traditional client for SQL Server; it doesn't store the data itself." },
    { t: "Azure Data Studio", cat: "Client", why: "Another client program used to connect to SQL Server." },
    { t: "Where you type a query and see the results grid", cat: "Client", why: "The RDBMS has no screen; the client gives you one." },
    { t: "A command-line tool that sends SQL to the server", cat: "Client", why: "Command-line tools are clients too; they connect and send instructions." },
    { t: "The program that saves your queries as .sql files for accountability", cat: "Client", why: "Saving query files is something your editor does on your machine." },
  ];
  const LAYER_CONCEPTS = [
    {
      q: "Why does an analyst need a separate client program at all?",
      right: "The RDBMS has no built-in screen, so a client is needed to connect and send it instructions",
      rightWhy: "The database server runs without a user interface; clients provide one.",
      wrong: [
        { t: "Because the client stores a copy of all the data for safety", why: "The data lives in the RDBMS. The client is just a window; deleting it deletes no data." },
        { t: "Because the client enforces the foreign keys the RDBMS cannot", why: "Constraint enforcement is the RDBMS's job, and the client doesn't add any." },
        { t: "Because SQL only works inside VS Code", why: "SQL is sent to the RDBMS; many different clients (SSMS, Azure Data Studio, command line) can send it." },
      ],
      sol: ["Think about which layer actually holds the data and which one you look through.", "The RDBMS stores and manages data but has no screen. A client connects to it and sends instructions."],
    },
    {
      q: "In the building analogy, the <b>data</b> itself corresponds to…",
      right: "The contents of the rooms",
      rightWhy: "The data is what is stored inside the structure.",
      wrong: [
        { t: "The blueprint", why: "The blueprint is the schema: the plan of what should exist." },
        { t: "The building with its locks and climate control", why: "That is the RDBMS, which houses and protects the data." },
        { t: "The visitor walking through the front door", why: "The analogy maps the RDBMS's gatekeeping to the staff who let visitors in; the data is what's inside the rooms." },
      ],
      sol: ["The analogy has three parts: blueprint, building, contents.", "Schema = blueprint, RDBMS = building, data = contents of the rooms."],
    },
    {
      q: "Hoosier Holdings moves its database from SQL Server to PostgreSQL. What happens to your skills for reading the schema?",
      right: "The relational logic carries over; only some syntax needs adjusting",
      rightWhy: "Tables, keys and relationships work the same way across relational systems.",
      wrong: [
        { t: "They become useless; each RDBMS uses a completely different model", why: "All of these are relational database systems; the model is shared." },
        { t: "Nothing changes at all, including the exact syntax", why: "Dialects differ in details (e.g. how to limit rows), so some syntax changes." },
        { t: "You must redraw the ERD because ERDs only describe SQL Server", why: "An ERD describes the logical structure and is independent of the vendor." },
      ],
      sol: ["Ask what SQL Server, Oracle, PostgreSQL and MySQL have in common.", "They are all relational DBMSs, so relational logic transfers with syntax adjustments."],
    },
    {
      q: "An intern uninstalls VS Code from the analyst's laptop. What happens to the Hoosier Holdings data?",
      right: "Nothing; the data lives in SQL Server, not in the client",
      rightWhy: "The client is only a way to connect; the data is stored and managed by the RDBMS on the server.",
      wrong: [
        { t: "The tables the analyst opened are deleted", why: "Opening a table in a client doesn't move it onto your laptop." },
        { t: "The foreign keys stop being enforced", why: "Enforcement (or not) happens in the RDBMS, independent of any client." },
        { t: "The schema is lost, but the rows remain", why: "The schema is defined in the database itself, not in the editor." },
      ],
      sol: ["Which of the three layers actually stores the data?", "The RDBMS stores the data. The client is replaceable: reinstall it, or use SSMS instead, and the data is untouched."],
    },
    {
      q: "The Hoosier Holdings ERD in Chapter 9 differs from the Chapter 8 ERD mainly because…",
      right: "It describes a database that has already been built and is live, not a design proposal",
      rightWhy: "Same notation, different status: proposal vs. production.",
      wrong: [
        { t: "It uses a different notation that only SQL Server understands", why: "The notation isn't what changed; what changed is that the database now exists." },
        { t: "It guarantees every relationship is enforced", why: "A built schema can still have logical, unenforced FKs, which is exactly the verification gap." },
        { t: "It shows the data values instead of the structure", why: "An ERD still shows structure; you look at data with queries." },
      ],
      sol: ["Recall what the Chapter 8 ERD was for.", "Chapter 8: a design proposal. Chapter 9: a schema of a live production database, which can still contain bad data."],
    },
    {
      q: "Which statement best explains why VS Code supports <b>accountability</b> in a data audit?",
      right: "Queries can be saved as files, leaving a record of exactly what was checked",
      rightWhy: "Saved .sql files with comments document the checks behind a recommendation.",
      wrong: [
        { t: "It prevents analysts from running incorrect queries", why: "An editor doesn't stop you running a misleading query." },
        { t: "It enforces the business rules the database lacks", why: "Clients don't add constraints; that is done in the RDBMS." },
        { t: "It automatically fixes orphaned records it finds", why: "Nothing is fixed automatically; you have to find and report problems." },
      ],
      sol: ["Accountability means being able to show what you did.", "Saving queries (with -- comments) as files records the checks you ran."],
    },
  ];
  const LAYER_TF = [
    { s: "SQL Server Management Studio and VS Code are both RDBMSs.", truth: false, why: "They are clients. SQL Server is the RDBMS they connect to.", hint: "Which layer stores data, and which one do you look through?" },
    { s: "An RDBMS keeps data available after the server shuts down and restarts.", truth: true, why: "Persisting data across shutdowns and restarts is one of its core jobs." },
    { s: "A schema contains the actual customer names and emails.", truth: false, why: "A schema is the structure (tables, columns, types, relationships). The names are data." },
    { s: "Because a database is in production, its data can be assumed accurate.", truth: false, why: "Live means it runs. The data can still contain unmatched, invalid or placeholder records." },
    { s: "The same relational logic you use on SQL Server works on PostgreSQL with some syntax changes.", truth: true, why: "They are both relational DBMSs." },
    { s: "The RDBMS, not the client, decides whether a row that breaks a constraint is rejected.", truth: true, why: "Constraint enforcement happens in the database software." },
    { s: "The main goal of the VS Code exercises is to master VS Code's features.", truth: false, why: "VS Code is just the tool; the skill is navigating and evaluating a database." },
    { s: "Hoosier Holdings' three storefronts each keep their own separate database.", truth: false, why: "The Tech Den, Kirkwood Couture and Dorm Depot share one database." },
  ];
  const layerSorts = K.sortVariants({
    key: "k201-ch9-layers", bank: LAYER_BANK, cats: ["Schema", "RDBMS", "Client"],
    defs: {
      Schema: "the structural definition: tables, columns, types, relationships (the blueprint)",
      RDBMS: "the software that stores, protects and runs the database (the building)",
      Client: "the program on your computer that connects and sends instructions (your window)",
    },
    ask: "description", hint: "Ask: is this describing the plan, the software that holds the data, or the tool you look through?",
  });

  /* ============================================================
   * TOPIC 2 · Schema vocabulary and data types
   * ============================================================ */
  const TYPE_BANK = [
    { t: "<code>CustomerID</code>: a number that identifies each customer", cat: "INT", why: "IDs that are whole numbers are stored as INT." },
    { t: "<code>Quantity</code>: how many units of a product are on an order line", cat: "INT", why: "Counts are whole numbers." },
    { t: "<code>GradYear</code>: the year a customer expects to graduate, e.g. 2028", cat: "INT", why: "A year stored by itself is a whole number, not a full calendar date." },
    { t: "<code>SeatsAvailable</code>: open seats in a lecture hall", cat: "INT", why: "You count seats in whole numbers." },
    { t: "<code>VisitsThisMonth</code>: number of times a member checked in", cat: "INT", why: "A count of events is a whole number." },
    { t: "<code>ReviewID</code>: the identifier of each review", cat: "INT", why: "Numeric identifiers are whole numbers." },
    { t: "<code>Rating</code>: stars on a 1-to-5 scale", cat: "INT", why: "Whole-number star ratings are INT. Note the type alone doesn't stop a 10." },
    { t: "<code>SchoolEmail</code>: a customer's university email address", cat: "VARCHAR(n)", why: "Emails are text of varying length." },
    { t: "<code>Major</code>: a customer's field of study", cat: "VARCHAR(n)", why: "A category written as words is text." },
    { t: "<code>ProductName</code>: e.g. \"Wireless mouse\"", cat: "VARCHAR(n)", why: "Names are variable-length text." },
    { t: "<code>PhoneNumber</code>: e.g. (812) 555-0147", cat: "VARCHAR(n)", why: "Phone numbers are identifiers with symbols; you never do math on them." },
    { t: "<code>ZipCode</code>: e.g. 02134", cat: "VARCHAR(n)", why: "Stored as a number, the leading zero would be lost, and ZIPs aren't quantities." },
    { t: "<code>StoreName</code>: e.g. \"Kirkwood Couture\"", cat: "VARCHAR(n)", why: "Names are text." },
    { t: "<code>ReviewText</code>: the comment a customer wrote", cat: "VARCHAR(n)", why: "Free text of varying length." },
    { t: "<code>BasePrice</code>: a product's list price, e.g. 49.99", cat: "DECIMAL(10,2)", why: "Prices need exact values with two decimal places." },
    { t: "<code>SalePrice</code>: the price charged on an order line", cat: "DECIMAL(10,2)", why: "Money is stored with two decimal places." },
    { t: "<code>MonthlyFee</code>: a gym membership fee, e.g. 29.50", cat: "DECIMAL(10,2)", why: "Money values have cents." },
    { t: "<code>HourlyWage</code>: what a store employee earns per hour", cat: "DECIMAL(10,2)", why: "Wages are money amounts with cents." },
    { t: "<code>ShippingCost</code>: charged per order", cat: "DECIMAL(10,2)", why: "A money amount needs two decimal places." },
    { t: "<code>OrderDate</code>: the day an order was placed", cat: "DATE", why: "A calendar day is a DATE." },
    { t: "<code>LaunchDate</code>: the day a storefront opened", cat: "DATE", why: "Calendar dates are DATE values." },
    { t: "<code>HireDate</code>: when an employee started", cat: "DATE", why: "A specific calendar day." },
    { t: "<code>ReturnDeadline</code>: last day a purchase can be returned", cat: "DATE", why: "A calendar day." },
    { t: "<code>BirthDate</code>: a customer's date of birth", cat: "DATE", why: "A full calendar date." },
  ];
  const TYPE_DEFS = {
    INT: "whole numbers: IDs and counts",
    "VARCHAR(n)": "text up to n characters: names, emails, codes",
    "DECIMAL(10,2)": "exact numbers with two decimal places: money",
    DATE: "calendar dates",
  };
  /* sample values by type, and values that a column of that type would reject */
  const TYPE_VALUES = {
    INT: { col: ["Quantity", "GradYear", "CustomerID"], ok: ["3", "2027", "1048", "0", "15", "250"], bad: ["\"yesterday\"", "\"three\"", "\"N/A\"", "\"2027-05-01\"", "\"mfox@iu.edu\""] },
    "DECIMAL(10,2)": { col: ["BasePrice", "SalePrice"], ok: ["49.99", "12.50", "100.00", "7.25", "0.99", "315.40"], bad: ["\"free\"", "\"TBD\"", "\"nineteen dollars\"", "\"2026-01-15\"", "\"call for price\""] },
    DATE: { col: ["OrderDate", "LaunchDate"], ok: ["2025-09-14", "2024-01-03", "2026-03-30", "2023-11-21", "2025-12-01"], bad: ["\"next Friday\"", "\"jdoe@iu.edu\"", "\"2025-02-30\"", "\"soon\"", "\"Q3\""] },
  };
  const VOCAB = [
    { erd: "Entity", db: "Table", ex: "CUSTOMERS" },
    { erd: "Attribute", db: "Column (field)", ex: "SchoolEmail" },
    { erd: "Primary key", db: "Unique identifier enforced by the database", ex: "OrderID in ORDERS" },
    { erd: "Foreign key", db: "Column linking to another table, enforced or logical", ex: "StoreID in PRODUCTS" },
    { erd: "Business rule", db: "A constraint, or a gap where one should be", ex: "Rating must be 1–5" },
  ];
  const typeSorts = K.sortVariants({
    key: "k201-ch9-types", bank: TYPE_BANK, cats: ["INT", "VARCHAR(n)", "DECIMAL(10,2)", "DATE"], defs: TYPE_DEFS,
    ask: "column", hint: "Ask what the value <em>is</em>: a whole-number count or ID, words or a code, money, or a calendar day?",
  });

  /* ============================================================
   * TOPIC 3 · Constraints and enforced vs logical FKs
   * ============================================================ */
  const CONSTRAINT_BANK = [
    { t: "OrderDate only accepts calendar dates", cat: "Data type constraint", why: "The column's type (DATE) decides what kind of value fits." },
    { t: "Quantity refuses the text \"several\"", cat: "Data type constraint", why: "An INT column only takes whole numbers." },
    { t: "BasePrice must be a number with two decimal places", cat: "Data type constraint", why: "DECIMAL(10,2) is a type rule." },
    { t: "SchoolEmail holds at most 100 characters", cat: "Data type constraint", why: "VARCHAR(100) sets the maximum length; it's part of the type." },
    { t: "GradYear refuses \"senior\"", cat: "Data type constraint", why: "GradYear is INT, so text is rejected by its type." },
    { t: "No two customers can share the same CustomerID", cat: "Key constraint", why: "A primary key must be unique within its table." },
    { t: "An order's CustomerID must match an existing customer (when enforced)", cat: "Key constraint", why: "That is a foreign-key constraint." },
    { t: "Every product's StoreID must exist in STORES (when enforced)", cat: "Key constraint", why: "An enforced FK must point to an existing PK value." },
    { t: "OrderID cannot repeat in ORDERS", cat: "Key constraint", why: "Uniqueness of the identifier is a primary-key rule." },
    { t: "An ORDER_ITEMS line's ProductID must exist in PRODUCTS (when enforced)", cat: "Key constraint", why: "A foreign key linking line items to products." },
    { t: "Rating must be between 1 and 5", cat: "Business rule constraint", why: "The scale is a business decision, not a type or key rule; 9 is a valid INT." },
    { t: "SchoolEmail cannot be left empty", cat: "Business rule constraint", why: "Requiring an email is the business's rule for its customers." },
    { t: "SchoolEmail must end in @iu.edu", cat: "Business rule constraint", why: "The rule that customers are IU students is set by the business." },
    { t: "SalePrice cannot be negative", cat: "Business rule constraint", why: "−5.00 is a valid DECIMAL; refusing it is a business rule." },
    { t: "Quantity on an order line must be at least 1", cat: "Business rule constraint", why: "Zero is a valid INT, so this is a rule about the business, not the type." },
  ];
  const CONSTRAINT_TF = [
    { s: "On an ERD you can see at a glance whether a foreign key is enforced.", truth: false, why: "Enforced and logical relationships look identical on the diagram; you find out by examining the data.", hint: "What would the line on the diagram look like in each case?" },
    { s: "If even one order references a CustomerID that isn't in CUSTOMERS, the FK on ORDERS.CustomerID is not being enforced.", truth: true, why: "An enforced FK would have rejected that row when it was entered." },
    { s: "Finding no orphan rows today proves the foreign key is enforced.", truth: false, why: "A logical FK may simply not have been violated yet; absence of violations isn't proof of enforcement." },
    { s: "A column marked <code>not null</code> must always contain a value.", truth: true, why: "Not null means the field can't be left empty, which is sensible for a primary key." },
    { s: "An INT Rating column automatically blocks a rating of 10.", truth: false, why: "10 is a valid whole number; a separate business-rule constraint is needed for the 1–5 range." },
    { s: "Companies sometimes leave FKs logical for performance or legacy compatibility.", truth: true, why: "Those, plus enforcement that was postponed and never revisited, are common reasons." },
    { s: "With a logical FK, the database warns you when you enter a row that breaks the relationship.", truth: false, why: "It doesn't check, so violating rows go in silently." },
    { s: "The manager who approved going live owns the data-quality problems that result.", truth: true, why: "Production isn't proof the data is right; the approver is accountable." },
  ];
  const constraintSorts = K.sortVariants({
    key: "k201-ch9-constraints", bank: CONSTRAINT_BANK, cats: ["Data type constraint", "Key constraint", "Business rule constraint"],
    defs: {
      "Data type constraint": "the column only accepts values of its declared type (and length)",
      "Key constraint": "PK values unique; an enforced FK must match an existing PK",
      "Business rule constraint": "the organisation's own rules about valid values (ranges, required fields, formats)",
    },
    ask: "rule", hint: "Ask: is this about the <em>kind</em> of value, about identifying or linking rows, or about what the business allows?",
  });

  /* ============================================================
   * TOPIC 4 · Reading the generated query
   * ============================================================ */
  const QUERY_PARTS = [
    { p: "SELECT", m: "Starts the query and introduces the list of columns to return" },
    { p: "TOP (1000)", m: "Limits the result to at most 1,000 rows" },
    { p: "the bracketed list after TOP, e.g. [CustomerID], [FirstName], …", m: "Names exactly which columns appear in the results, in that order" },
    { p: "FROM", m: "Introduces where the rows come from" },
    { p: "[HoosierHoldings_ClassDB]", m: "Names the database that holds the table" },
    { p: "[dbo]", m: "Names the schema grouping (\"database owner\") the table sits in" },
    { p: "the last bracketed name, e.g. [CUSTOMERS]", m: "Names the table being read" },
    { p: "a line beginning with <code>--</code>", m: "A comment the database ignores, kept for human readers" },
  ];
  const ACTIONS = [
    { t: "Clicking the OrderDate column header to sort", ok: false, why: "Grid sorting changes the display only; it isn't saved in the SQL." },
    { t: "Typing a filter in the results grid to show only StoreID 2", ok: false, why: "Grid filters hide rows on screen; the table and the SQL are unchanged." },
    { t: "Widening a column in the results grid", ok: false, why: "Purely visual." },
    { t: "Clicking a header twice to sort descending", ok: false, why: "Still a display sort; not written into the query." },
    { t: "Hiding the results panel and reopening it", ok: false, why: "Nothing about the query changes." },
    { t: "Editing <code>TOP (1000)</code> to <code>TOP (50)</code> and re-running", ok: true, why: "That changes the SQL: at most 50 rows come back." },
    { t: "Deleting <code>TOP (1000)</code> and re-running", ok: true, why: "The query now returns every row in the table." },
    { t: "Changing <code>[ORDERS]</code> to <code>[REVIEWS]</code> after FROM", ok: true, why: "A different table is read." },
    { t: "Removing <code>[Major]</code> from the SELECT list and re-running", ok: true, why: "The column list decides which fields come back." },
    { t: "Adding <code>-- check gmail</code> above the query", ok: false, why: "A comment changes the file but not what the database runs or returns." },
  ];
  const SQL_TF = [
    { s: "Sorting by clicking a column header in the results grid is saved in the SQL file.", truth: false, why: "Grid sorts and filters are display only.", hint: "Look at the SQL text after you sort. Did it change?" },
    { s: "<code>TOP (1000)</code> on a table of 340 rows returns 340 rows.", truth: true, why: "TOP is a ceiling (at most 1,000), not a target." },
    { s: "If Select Top 1000 returns 1,000 rows, the table has 1,000 rows.", truth: false, why: "1,000 is the cap; the table may be much larger. Remove TOP to see the true count." },
    { s: "Lines starting with <code>--</code> are ignored by the database.", truth: true, why: "They are comments, which is why the homework puts observations there." },
    { s: "In <code>FROM [HoosierHoldings_ClassDB].[dbo].[ORDERS]</code>, <code>dbo</code> is the name of the table.", truth: false, why: "dbo is the schema (database owner); ORDERS is the table." },
    { s: "A query that runs without errors can still return misleading results.", truth: true, why: "Valid SQL says nothing about orphaned, invalid or capped rows." },
    { s: "Filtering the grid to StoreID 2 deletes the other rows from PRODUCTS.", truth: false, why: "The filter only hides rows on screen." },
    { s: "The column list after SELECT decides which fields appear in the results.", truth: true, why: "Only the listed columns come back, in that order." },
  ];

  /* ============================================================
   * TOPIC 5 · Classifying problems
   * ============================================================ */
  const PROBLEM_BANK = [
    { t: "An order lists CustomerID 9917, but no customer with that ID exists.", cat: "Referential integrity violation", why: "The FK points to a customer that isn't there." },
    { t: "A product is assigned to StoreID 5; Hoosier Holdings has only stores 1–3.", cat: "Referential integrity violation", why: "StoreID references a store that doesn't exist." },
    { t: "A review points to ProductID 3308, which is not in PRODUCTS.", cat: "Referential integrity violation", why: "An orphaned review: its FK matches no product." },
    { t: "An ORDER_ITEMS line references OrderID 70012, which has no row in ORDERS.", cat: "Referential integrity violation", why: "The line item's parent order is missing." },
    { t: "An order's StoreID is 0.", cat: "Referential integrity violation", why: "No store has ID 0, so the reference is broken." },
    { t: "A review is tied to a CustomerID that was never entered in CUSTOMERS.", cat: "Referential integrity violation", why: "The FK value has no matching PK." },
    { t: "A line item references a ProductID that isn't in the product table.", cat: "Referential integrity violation", why: "Unmatched FK, so it is an orphaned line." },
    { t: "A review has a Rating of 10 on the 1-to-5 scale.", cat: "Business rule violation", why: "A valid INT that breaks the stated range rule." },
    { t: "A customer's SchoolEmail ends in @yahoo.com, though customers must use an iu.edu address.", cat: "Business rule violation", why: "Valid text, but it breaks the iu.edu rule." },
    { t: "A review's Rating is 0.", cat: "Business rule violation", why: "Out of the 1–5 range the business set." },
    { t: "A customer's SchoolEmail ends in @outlook.com.", cat: "Business rule violation", why: "Customers are supposed to be IU students with iu.edu addresses." },
    { t: "A review's Rating is 6.", cat: "Business rule violation", why: "Structurally fine, operationally wrong: above the maximum of 5." },
    { t: "A customer record was saved with an empty SchoolEmail although the business requires one.", cat: "Business rule violation", why: "\"SchoolEmail cannot be empty\" is a stated business rule." },
    { t: "A customer is named \"Test User\".", cat: "Data quality failure", why: "A placeholder left in production data." },
    { t: "An order is dated in the year 2035.", cat: "Data quality failure", why: "An impossible future date." },
    { t: "The same student appears twice under two different CustomerIDs.", cat: "Data quality failure", why: "A duplicate person: inconsistent data that no key rule catches." },
    { t: "Majors are recorded as \"Marketing\", \"Mktg\" and \"marketing\".", cat: "Data quality failure", why: "Inconsistent spellings of the same value." },
    { t: "A product is named \"asdf\".", cat: "Data quality failure", why: "Placeholder or junk text." },
    { t: "Some customers have FirstName \"XXX\".", cat: "Data quality failure", why: "Placeholder names make records incomplete." },
    { t: "Store names appear as \"Dorm Depot\" in one table and \"DormDepot\" in another export.", cat: "Data quality failure", why: "Inconsistent values for the same thing." },
  ];
  const PREVENT_BANK = [
    { t: "An order saved with a CustomerID that doesn't exist", cat: "A constraint could prevent it", why: "An enforced FK would reject it at entry." },
    { t: "A product saved with StoreID 6", cat: "A constraint could prevent it", why: "An enforced FK to STORES would reject it." },
    { t: "A review saved with Rating 9", cat: "A constraint could prevent it", why: "A business-rule range constraint (1–5) would reject it." },
    { t: "A customer saved with no SchoolEmail", cat: "A constraint could prevent it", why: "A not-null (required field) rule would reject it." },
    { t: "Two customers given the same CustomerID", cat: "A constraint could prevent it", why: "A primary-key constraint enforces uniqueness." },
    { t: "\"yesterday\" typed into the Quantity column", cat: "A constraint could prevent it", why: "The INT data type rejects it." },
    { t: "A SchoolEmail ending in @gmail.com", cat: "A constraint could prevent it", why: "A business-rule constraint on the email format could reject it." },
    { t: "A customer named \"Test User\"", cat: "Needs human judgment", why: "It's valid text; only someone who knows it's a placeholder can flag it." },
    { t: "\"Finance\", \"FIN\" and \"Fiance\" in the Major column", cat: "Needs human judgment", why: "Each is valid text; recognising they mean the same thing takes judgment." },
    { t: "One student entered as \"Kat Moore\" (ID 112) and \"Katherine Moore\" (ID 380)", cat: "Needs human judgment", why: "Different IDs and names pass every key rule; a person must spot the duplicate." },
    { t: "A desk lamp's BasePrice stored as 4.99 instead of 49.99", cat: "Needs human judgment", why: "4.99 is a valid price; only business knowledge reveals the typo." },
    { t: "An iu.edu email with the letters swapped (jmsith@iu.edu for jsmith@iu.edu)", cat: "Needs human judgment", why: "It satisfies the iu.edu rule; only a person checking can catch it." },
    { t: "A review whose text is clearly spam advertising another site", cat: "Needs human judgment", why: "No type or key rule can tell spam from a genuine review." },
  ];
  const problemSorts = K.sortVariants({
    key: "k201-ch9-problems", bank: PROBLEM_BANK,
    cats: ["Referential integrity violation", "Business rule violation", "Data quality failure"],
    defs: {
      "Referential integrity violation": "a record references an entity that doesn't exist (an enforced FK would catch it)",
      "Business rule violation": "structurally valid but breaks a stated rule (a business-rule constraint would catch it)",
      "Data quality failure": "incomplete, inconsistent or impossible records (placeholders, spellings, impossible dates, duplicates)",
    },
    ask: "finding", hint: "First ask: does it point to something that doesn't exist? If not, is it a valid value that breaks a stated rule?",
  });

  /* ============================================================
   * TOPIC 6 · Auditing records
   * ============================================================ */
  const DISRUPTIONS = [
    {
      q: "Auditing CUSTOMERS against the iu.edu rule, Dev filters SchoolEmail for \"gmail\", finds 4 rows and writes \"4 customers break the rule.\" What is wrong?",
      right: "The search only finds gmail addresses; other non-IU domains such as yahoo, outlook or icloud may still be there",
      rightWhy: "Finding one kind of violation doesn't show there are no others. Check every email against the rule itself.",
      wrong: [
        { t: "Nothing; gmail is the only common non-IU domain", why: "Other domains exist in the data; a single-domain search misses them." },
        { t: "The filter permanently removed the gmail rows from the table", why: "Grid filters change the display only." },
        { t: "Gmail addresses are allowed, so the count should be 0", why: "The rule requires iu.edu; gmail breaks it, but it isn't the only way to break it." },
      ],
      sol: ["What exactly is the rule: \"no gmail\", or \"must be iu.edu\"?", "Test each row for <em>not</em> ending in @iu.edu. A gmail-only search is like a query condition that only matches what you thought to type."],
    },
    {
      q: "Earlier, Rosa filtered the PRODUCTS grid to StoreID 2 and forgot to clear it. Now she reports \"PRODUCTS has 14 rows and every product belongs to Kirkwood Couture.\" What happened?",
      right: "The leftover grid filter is hiding every other row; the table itself is unchanged",
      rightWhy: "Filters change the display, not the table, so a forgotten filter makes the table look smaller and cleaner than it is.",
      wrong: [
        { t: "The filter deleted the other stores' products", why: "Grid filters never delete data." },
        { t: "TOP (1000) cut off the other stores", why: "TOP caps at 1,000 rows; 14 rows is far below the cap." },
        { t: "The query's FROM clause only reads Kirkwood Couture's table", why: "FROM names the single PRODUCTS table, which holds every store's products." },
      ],
      sol: ["Ask what changed between her earlier view and now. Did the SQL change, or only the grid?", "A display filter stays on until cleared. Clear it (or re-check the row count) before describing a table."],
    },
    {
      q: "Marcus runs Select Top 1000 on ORDERS, sees exactly 1,000 rows and writes \"Hoosier Holdings has 1,000 orders; 12 have unmatched CustomerIDs.\" What should he do?",
      right: "Remove TOP (1000), re-run, and recount; 1,000 is the row cap, not the table size",
      rightWhy: "Exactly 1,000 rows is the signature of the cap. The full table could hold many more orders, and more orphans.",
      wrong: [
        { t: "Nothing; Select Top 1000 always returns the whole table", why: "TOP returns at most 1,000 rows, so larger tables are cut off." },
        { t: "Sort the grid descending to reveal the hidden rows", why: "Sorting rearranges the 1,000 rows already returned; it doesn't fetch more." },
        { t: "Add a -- comment so the database returns all rows", why: "Comments are ignored by the database." },
      ],
      sol: ["Is 1,000 a suspicious number here?", "TOP (1000) is a ceiling. Delete it and re-run to see every row and the true count, then recount the orphans."],
    },
    {
      q: "Checking REVIEWS (4,800 rows) for ratings outside 1–5, Jae scrolls through the grid for twenty minutes and reports none. What's the better method?",
      right: "Sort Rating ascending and descending (or filter for values outside 1–5) so any violators jump to the top",
      rightWhy: "Systematic sorting or filtering inspects every row; eye-scanning thousands of rows easily misses one.",
      wrong: [
        { t: "Scroll more slowly", why: "Still eye-scanning; it's slow and unreliable for a single bad row." },
        { t: "Trust the INT data type to have blocked bad ratings", why: "INT allows any whole number, including 10." },
        { t: "Look only at the first 100 rows as a sample", why: "A sample can easily miss the one violating row." },
      ],
      sol: ["How can you make the extreme values come to you instead of hunting for them?", "Sort Rating both ways (or filter outside 1–5): two clicks check every row."],
    },
    {
      q: "Lena sorts STORES by LaunchDate descending, writes her observations, and closes the file. Next morning she reopens the .sql file and the rows are back in their original order. Why?",
      right: "Grid sorts aren't saved in the SQL, so re-running the query shows the default order",
      rightWhy: "Sorting by clicking headers changes the display only; the SQL text never recorded it.",
      wrong: [
        { t: "Someone changed the LaunchDate values overnight", why: "Nothing suggests the data changed; the sort simply wasn't stored." },
        { t: "The comments she wrote cancelled the sort", why: "Comments are ignored by the database; they can't undo anything." },
        { t: "TOP (1000) always re-sorts the rows", why: "TOP limits the row count; it doesn't sort." },
      ],
      sol: ["Where is a grid sort stored?", "Nowhere in the SQL: it's display only. Re-running gives the default order again."],
    },
    {
      q: "After auditing all five tables, Sam concludes: \"Only 2% of rows have problems, so the quarterly revenue report is reliable.\" What's the flaw?",
      right: "\"Mostly correct\" isn't enough; he needs to check whether the problem rows could change the report's conclusions",
      rightWhy: "A small share of bad rows (e.g. big orders with no valid store) can still shift revenue or flip a ranking.",
      wrong: [
        { t: "There's no flaw; anything under 5% can be ignored", why: "No fixed threshold makes data safe; it depends on the decision." },
        { t: "He should have used Select Top 1000 to get a cleaner sample", why: "A capped sample hides rows; it doesn't make the data cleaner." },
        { t: "The percentage is meaningless because the database ran the query", why: "Running successfully says nothing about data quality, but the 2% figure is still useful evidence." },
      ],
      sol: ["Is the question \"how much is wrong?\" or \"could what's wrong change the decision?\"", "Quantify the impact on the report (e.g. revenue on the bad rows) before calling it reliable."],
    },
  ];

  /* ============================================================
   * TOPIC 7 · Decide: checklist and act/pause/investigate
   * ============================================================ */
  const ACT = "Act: use the results for the decision";
  const INV = "Investigate: dig further and quantify before deciding";
  const PAUSE = "Pause: hold the decision until the problem is fixed";
  const API_ORDER = [ACT, INV, PAUSE];
  const API_WHY = {
    [ACT]: "Acting fits only when you've checked and nothing you found could change the decision.",
    [INV]: "Investigating fits when something looks off but its size or reach is still unknown.",
    [PAUSE]: "Pausing fits when a confirmed problem materially affects the decision.",
  };
  const SCENARIOS = [
    { s: "Leadership wants to reprice The Tech Den's top sellers. You removed TOP, checked the full ORDERS and ORDER_ITEMS tables, found every CustomerID, OrderID and ProductID matched, and all dates fall in the last two years.", a: ACT, why: "The relevant checks are done and came back clean." },
    { s: "Purchasing will stock Dorm Depot's highest-rated products. Among 2,900 reviews you found one Rating of 10; recomputing the averages without it changes nothing in the top-ten list.", a: ACT, why: "A confirmed problem exists but you showed it can't change this decision. Note it and proceed." },
    { s: "A shelf-space plan uses product counts per store. You checked every StoreID in the full PRODUCTS table (no TOP, no filters): all are 1, 2 or 3, and the count matches the store managers' lists.", a: ACT, why: "Verified against the rule and an outside source; nothing undermines the decision." },
    { s: "Revenue by store looks low for Kirkwood Couture. You notice your ORDERS result shows exactly 1,000 rows and you haven't yet checked whether the table is larger.", a: INV, why: "Exactly 1,000 rows suggests the TOP cap; you don't yet know how much is missing. Remove TOP and quantify." },
    { s: "A teammate says the CUSTOMERS emails are clean because a \"gmail\" filter found nothing. Leadership wants to launch an email campaign tomorrow.", a: INV, why: "One search doesn't rule out yahoo, outlook or icloud addresses. Check every email against the iu.edu rule first." },
    { s: "A dashboard shows a March sales spike at The Tech Den. Scanning orders you spot a few dated 2035, but you haven't counted them or checked which store or month they're counted under.", a: INV, why: "The anomaly is real but its size and link to the spike are unknown, so investigate and quantify." },
    { s: "Leadership plans to cut weekend staff at the store with the fewest orders. Your audit of the full ORDERS table finds 21% of orders carry StoreIDs 4 or 5, which don't exist.", a: PAUSE, why: "A confirmed, large referential-integrity problem could reassign enough orders to change which store looks smallest." },
    { s: "Marketing wants to email every customer a student-only discount. You confirmed 17% of SchoolEmail values are not iu.edu and 40 records are named \"Test User\".", a: PAUSE, why: "The decision depends directly on those emails; the confirmed problems would send student offers to non-students and fake records." },
    { s: "A loyalty analysis groups revenue by customer GradYear. Checking the full table, 310 of 1,250 orders reference CustomerIDs that don't exist in CUSTOMERS.", a: PAUSE, why: "A quarter of the orders can't be linked to any customer, so the analysis would be badly incomplete." },
  ];
  const CHECK_BANK = [
    { t: "The business sells gift cards, but no table records them", cat: "Schema reflects the business?", why: "A real business entity is missing from the structure." },
    { t: "The ERD shows a DELIVERIES entity, yet the database has no such table", cat: "Schema reflects the business?", why: "The built structure doesn't match the business's entities." },
    { t: "REVIEWS has no column linking a review to the product it describes", cat: "Schema reflects the business?", why: "A needed relationship isn't represented in the structure." },
    { t: "Customers belong to loyalty tiers, but no column records a tier", cat: "Schema reflects the business?", why: "A business attribute has no home in the schema." },
    { t: "ORDERS accepts CustomerID values that don't exist in CUSTOMERS", cat: "Relationships enforced?", why: "Evidence the FK is only logical." },
    { t: "Several PRODUCTS rows point to StoreID 6", cat: "Relationships enforced?", why: "A broken reference shows the FK to STORES isn't enforced." },
    { t: "ORDER_ITEMS lines reference OrderIDs missing from ORDERS", cat: "Relationships enforced?", why: "Orphaned line items: the relationship isn't enforced." },
    { t: "Reviews exist for ProductIDs that aren't in PRODUCTS", cat: "Relationships enforced?", why: "The FK from REVIEWS isn't enforced." },
    { t: "The Rating column accepted values of 0 and 9", cat: "Business rules as constraints?", why: "The 1–5 rule exists on paper but not as a constraint." },
    { t: "SchoolEmail accepted @gmail.com addresses", cat: "Business rules as constraints?", why: "The iu.edu rule isn't implemented in the database." },
    { t: "BasePrice accepted a negative value", cat: "Business rules as constraints?", why: "No constraint enforces the rule that prices are positive." },
    { t: "SchoolEmail can be saved empty although the business requires it", cat: "Business rules as constraints?", why: "A required-field rule isn't implemented." },
    { t: "Majors appear as \"Finance\", \"FIN\" and \"Fiance\"", cat: "Data complete & consistent?", why: "Inconsistent values for the same thing." },
    { t: "Some orders are dated 2035", cat: "Data complete & consistent?", why: "Impossible dates." },
    { t: "Dozens of customers are named \"Test User\"", cat: "Data complete & consistent?", why: "Placeholder records make the data incomplete." },
    { t: "LastName is blank on a fifth of CUSTOMERS rows", cat: "Data complete & consistent?", why: "Missing values." },
    { t: "The revenue report was built from a result capped at 1,000 rows", cat: "Data supports the decision?", why: "The report can't support a decision about all orders." },
    { t: "The staffing plan ranks stores by order counts, and a fifth of orders have no valid store", cat: "Data supports the decision?", why: "The problem directly undermines the specific decision." },
    { t: "The best-seller list changes once orphaned line items are excluded", cat: "Data supports the decision?", why: "The data, as is, would drive a different decision." },
    { t: "The pricing analysis used a grid that still had a store filter applied", cat: "Data supports the decision?", why: "The analysis saw only part of the data the decision needs." },
  ];
  const CHECK_CATS = ["Schema reflects the business?", "Relationships enforced?", "Business rules as constraints?", "Data complete & consistent?", "Data supports the decision?"];
  const checkSorts = K.sortVariants({
    key: "k201-ch9-checklist", bank: CHECK_BANK, cats: CHECK_CATS,
    defs: {
      "Schema reflects the business?": "are the real entities and relationships represented?",
      "Relationships enforced?": "are FKs enforced, or are there orphan rows?",
      "Business rules as constraints?": "does the database actually block values the business forbids?",
      "Data complete & consistent?": "missing values, placeholders, impossible dates, inconsistent spellings, duplicates?",
      "Data supports the decision?": "would you trust a decision built on these results as they stand?",
    },
    ask: "finding", hint: "Ask which checklist question the finding answers \"no\" to: structure, relationships, rules, completeness, or fitness for the decision.",
  });
  const DECIDE_TF = [
    { s: "If a query runs without errors, its results are trustworthy enough to act on.", truth: false, why: "Valid SQL can still return orphaned, invalid, capped or filtered results.", hint: "What does a success message actually check?" },
    { s: "A confirmed problem that cannot change the decision need not stop you from acting.", truth: true, why: "Note it and act; the test is whether it could change the decision." },
    { s: "Data must be 100% clean before any decision can be made.", truth: false, why: "Real data is never perfect; quantify problems and judge their effect on the decision." },
    { s: "When you see a warning sign but don't know its size, the right move is to investigate and quantify.", truth: true, why: "Investigate before acting or pausing." },
    { s: "Finding that 18% of orders point to non-existent stores is a reason to pause a store-staffing decision.", truth: true, why: "A large, confirmed integrity problem directly affects store-level counts." },
    { s: "\"Does the data support the decision?\" is answered by checking that the query uses SELECT.", truth: false, why: "It's about whether the results are complete and reliable enough for this decision, not about syntax." },
  ];

  /* ============================================================
   * GENERATORS
   * ============================================================ */
  const generators = [
    /* ---------------- 1. Layers ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-layers",
      name: "Schema, RDBMS and client",
      blurb: "Tell the blueprint, the building and the window apart, and say why a live system still needs checking.",
      variants: [
        ...layerSorts,
        K.conceptVariant("Explain the layers", "k201-ch9-layers-c", LAYER_CONCEPTS),
        K.tfVariant("True or false: layers", "k201-ch9-layers-tf", LAYER_TF),
        {
          name: "Diagnose the misplaced claim",
          make() {
            const claims = [
              { who: "SQL Server", wrongRole: "Client", right: "RDBMS" },
              { who: "VS Code with the mssql extension", wrongRole: "RDBMS", right: "Client" },
              { who: "SSMS", wrongRole: "RDBMS", right: "Client" },
              { who: "the Hoosier Holdings ERD", wrongRole: "RDBMS", right: "Schema" },
              { who: "PostgreSQL", wrongRole: "Schema", right: "RDBMS" },
              { who: "Azure Data Studio", wrongRole: "Schema", right: "Client" },
            ];
            const c = U.pick(claims);
            const name = U.pick(FIRST);
            const roleWhy = {
              Schema: "the schema is the structural definition (blueprint)",
              RDBMS: "the RDBMS is the software that stores and enforces (the building)",
              Client: "a client is the program you use to connect and send instructions (the window)",
            };
            return Q.mc({
              q: `<p>${name}'s project notes describe ${c.who} as the <b>${c.wrongRole}</b> layer of the Hoosier Holdings setup. Which layer does it actually belong to?</p>`,
              right: c.right, rightWhy: `Correct: ${roleWhy[c.right]}.`,
              wrong: ["Schema", "RDBMS", "Client"].filter(x => x !== c.right).map(x => ({ t: x, why: x === c.wrongRole ? `That's the note's mistake: ${roleWhy[x]}, which doesn't describe ${c.who}.` : `No: ${roleWhy[x]}.` })),
              keepOrder: ["Schema", "RDBMS", "Client"],
              sol: S("Recall the analogy: blueprint, building, window.", `${c.who} is the <b>${c.right}</b>: ${roleWhy[c.right]}.`),
            });
          },
        },
      ],
    }),

    /* ---------------- 2. Data types ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-types",
      name: "Schema vocabulary & data types",
      blurb: "Map ERD terms onto tables and columns, choose a data type, and predict which values a column rejects.",
      variants: [
        ...typeSorts,
        {
          name: "Which value is rejected?",
          make() {
            const type = U.pick(Object.keys(TYPE_VALUES));
            const tv = TYPE_VALUES[type];
            const col = U.pick(tv.col);
            const bad = U.pick(tv.bad);
            const oks = U.sample(tv.ok, 3);
            return Q.mc({
              q: `<p>The column <code>${col}</code> has data type <b>${type}</b>. A clerk tries to save each value below. Which one does the database <b>reject</b>?</p>`,
              right: bad, rightWhy: `${bad} is not a valid ${type} value, so the type rule blocks it before it's stored.`,
              wrong: oks.map(o => ({ t: o, why: `${o} is a perfectly valid ${type} value. The type only checks the <em>kind</em> of value, not whether it makes business sense.` })),
              sol: S(`A data type is a rule: ${type} accepts only ${TYPE_DEFS[type]}.`, `Only ${bad} fails that rule.${type === "DATE" && bad.includes("02-30") ? " February has no 30th, so it isn't a real date." : ""}`),
            });
          },
        },
        {
          name: "Count the rejected entries",
          make() {
            const type = U.pick(Object.keys(TYPE_VALUES));
            const tv = TYPE_VALUES[type];
            const col = U.pick(tv.col);
            const nb = U.randInt(1, 3), ng = U.randInt(3, 5);
            const bad = U.sample(tv.bad, nb), good = U.sample(tv.ok, ng);
            const vals = U.shuffle([...bad, ...good]);
            return Q.num({
              kind: "count",
              q: `<p>A batch import tries to load these values into <code>${col}</code>, whose data type is <b>${type}</b>:</p>${tbl(["Row", col], vals.map((v, i) => [i + 1, v]))}<p>How many of the rows will the database <b>reject</b>?</p>`,
              answer: nb,
              traps: nonEq([
                { value: ng, why: "That's the number of values the column <em>accepts</em>." },
                { value: vals.length, why: "Not every value is the wrong type; most are valid." },
                { value: 0, why: "Data types are enforced: a value of the wrong kind is refused." },
              ], nb),
              sol: S(`Check each value against the rule for ${type}: ${TYPE_DEFS[type]}.`, `Rejected: ${bad.join(", ")}. Accepted: ${good.join(", ")}.`, `So ${nb} ${U.plural(nb, "row is", "rows are")} rejected.`),
            });
          },
        },
        {
          name: "ERD term → database term",
          make() {
            const v = U.pick(VOCAB);
            const reverse = Math.random() < 0.5;
            if (!reverse) {
              return Q.mc({
                q: `<p>When the Hoosier Holdings ERD was built into a database, what did each <b>${v.erd.toLowerCase()}</b> become? (Example: ${v.ex}.)</p>`,
                right: v.db, rightWhy: `${v.erd} → ${v.db}.`,
                wrong: U.sample(VOCAB.filter(x => x !== v), 3).map(x => ({ t: x.db, why: `That's what a${/^[AEIOU]/.test(x.erd) ? "n" : ""} ${x.erd.toLowerCase()} becomes (e.g. ${x.ex}).` })),
                sol: S("Line the ERD vocabulary up with the built database: entity, attribute, PK, FK, business rule.", `${v.erd} → <b>${v.db}</b>, e.g. ${v.ex}.`),
              });
            }
            return Q.mc({
              q: `<p>In the live database, <b>${v.ex}</b> is an example of a ${v.db.toLowerCase()}. Which ERD concept did it come from?</p>`,
              right: v.erd, rightWhy: `${v.ex} started life on the ERD as a${/^[AEIOU]/.test(v.erd) ? "n" : ""} ${v.erd.toLowerCase()}.`,
              wrong: U.sample(VOCAB.filter(x => x !== v), 3).map(x => ({ t: x.erd, why: `A${/^[AEIOU]/.test(x.erd) ? "n" : ""} ${x.erd.toLowerCase()} becomes a ${x.db.toLowerCase()} (e.g. ${x.ex}).` })),
              sol: S("Work backwards from the database term to the design term.", `${v.db} ← <b>${v.erd}</b>.`),
            });
          },
        },
      ],
    }),

    /* ---------------- 3. Constraints ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-constraints",
      name: "Constraints & enforced vs. logical FKs",
      blurb: "Sort rules into constraint types, predict what an enforced or logical FK does, and infer enforcement from evidence.",
      variants: [
        ...constraintSorts,
        {
          name: "Predict: enforced or logical FK",
          make() {
            const cases = [
              { child: "ORDERS", fk: "CustomerID", parent: "CUSTOMERS", what: "an order" },
              { child: "PRODUCTS", fk: "StoreID", parent: "STORES", what: "a product" },
              { child: "REVIEWS", fk: "ProductID", parent: "PRODUCTS", what: "a review" },
              { child: "ORDER_ITEMS", fk: "OrderID", parent: "ORDERS", what: "an order line" },
            ];
            const c = U.pick(cases);
            const enforced = Math.random() < 0.5;
            const exists = Math.random() < 0.35;
            const val = c.fk === "StoreID" ? U.pick([4, 5, 7, 9]) : U.randInt(1000, 9999);
            const SAVED = "The row is saved normally and links to the existing record";
            const REJ = "The database rejects the row";
            const ORPH = "The row is saved without warning and becomes an orphaned record";
            const AUTO = `The database automatically creates a matching row in ${c.parent}`;
            const right = exists ? SAVED : enforced ? REJ : ORPH;
            const why = {
              [SAVED]: exists ? "The value matches an existing PK, so either kind of FK is satisfied." : `The value doesn't match any row in ${c.parent}, so there is nothing to link to.`,
              [REJ]: enforced ? (exists ? "An enforced FK only rejects values that don't match; this one matches." : "") : "A logical FK isn't checked by the database, so nothing rejects the row.",
              [ORPH]: exists ? "The value matches a real record, so it isn't orphaned." : "An enforced FK would never let an unmatched row in.",
              [AUTO]: "Databases don't invent parent rows; an FK either rejects (enforced) or ignores (logical) the mismatch.",
            };
            return Q.mc({
              q: `<p>The FK <code>${c.child}.${c.fk}</code> → <code>${c.parent}</code> is <b>${enforced ? "enforced" : "logical (not enforced)"}</b>. A clerk saves ${c.what} with ${c.fk} = ${val}, and ${c.parent} <b>${exists ? "does" : "does not"}</b> contain ${c.fk === "StoreID" ? "a store" : "a row"} with that ID. What happens?</p>`,
              right, rightWhy: right === SAVED ? why[SAVED] : right === REJ ? "An enforced FK refuses any value that doesn't match an existing PK." : "A logical FK is documented but not checked, so the unmatched row slips in.",
              wrong: [SAVED, REJ, ORPH, AUTO].filter(x => x !== right).map(x => ({ t: x, why: why[x] })),
              sol: S("Two questions: does the value match an existing PK? And does the database check the FK?", exists ? "The value matches, so the row is fine either way." : enforced ? "No match + enforced FK → rejected at entry." : "No match + logical FK → saved silently as an orphan. That is the verification gap."),
            });
          },
        },
        {
          name: "Infer enforcement from evidence",
          make() {
            const found = Math.random() < 0.55;
            const n = U.randInt(3, 40);
            const col = U.pick(["ORDERS.CustomerID", "PRODUCTS.StoreID", "REVIEWS.ProductID"]);
            const A = "The FK is not enforced (it is logical)";
            const B = "The FK is definitely enforced";
            const Cc = "The data alone can't prove the FK is enforced; it may just not have been violated yet";
            const D = "The ERD must be wrong about the relationship";
            const right = found ? A : Cc;
            return Q.mc({
              q: found
                ? `<p>Auditing the full table, you find ${n} rows whose <code>${col}</code> value has no match in the referenced table. What can you conclude about that foreign key?</p>`
                : `<p>Auditing the full table, you find <b>no</b> rows whose <code>${col}</code> value lacks a match. What can you conclude about that foreign key?</p>`,
              right,
              rightWhy: found ? "An enforced FK would have rejected every one of those rows, so it can't be enforced." : "No violations is consistent with both enforced and logical FKs.",
              wrong: [A, B, Cc, D].filter(x => x !== right).map(x => ({
                t: x,
                why: x === A ? "No violations were found, so you have no evidence either way." :
                  x === B ? (found ? "Unmatched rows prove the opposite." : "Clean data today doesn't prove the database would reject a bad row tomorrow.") :
                    x === Cc ? "With unmatched rows in hand you <em>can</em> conclude: an enforced FK would never have allowed them." :
                      "The ERD documents the intended relationship; the problem is that the database doesn't enforce it.",
              })),
              sol: S("Enforcement can't be read off the diagram; it shows up in the data.", found ? "Violating rows exist → the rule wasn't enforced (a logical FK)." : "No violations proves nothing: a logical FK may simply not have been broken yet."),
            });
          },
        },
        {
          name: "Read the Columns folder",
          make() {
            const cols = [
              ["CustomerID", "PK, int, not null", false],
              ["FirstName", "varchar(50), null", true],
              ["LastName", "varchar(50), null", true],
              ["SchoolEmail", "varchar(100), null", true],
              ["Major", "varchar(100), null", true],
              ["GradYear", "int, null", true],
            ];
            const ask = U.pick(["empty", "required"]);
            const opts = U.sample(cols, 5);
            if (!opts.some(c => !c[2])) opts[0] = cols[0];
            return Q.multi({
              q: `<p>VS Code's Columns folder for <code>dbo.CUSTOMERS</code> shows:</p>${tbl(["Column", "Listing"], cols.map(c => [c[0], c[1]]))}<p>Select every column that the database ${ask === "empty" ? "<b>allows to be left empty</b>" : "<b>requires a value for</b>"}.</p>`,
              options: opts.map(c => ({
                t: c[0], ok: ask === "empty" ? c[2] : !c[2],
                why: c[2] ? `${c[0]} is marked <b>null</b>, so it may be left empty, even SchoolEmail, despite the business rule that it shouldn't be.` : `${c[0]} is marked <b>not null</b>: a value is required, as it should be for a primary key.`,
              })),
              sol: S("<code>null</code> = may be empty; <code>not null</code> = a value is required.", "Only CustomerID is not null. Notice the gap: the business rule \"SchoolEmail cannot be empty\" is not implemented, because SchoolEmail is listed as null."),
            });
          },
        },
        K.tfVariant("True or false: constraints", "k201-ch9-constraints-tf", CONSTRAINT_TF),
      ],
    }),

    /* ---------------- 4. Reading the query ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-sqlread",
      name: "Reading SELECT TOP (1000)",
      blurb: "Read the auto-generated query part by part, predict row counts, and separate SQL changes from display-only grid actions.",
      variants: [
        {
          name: "What does this part do?",
          make() {
            const t = U.pick(TABLES);
            const part = U.pick(QUERY_PARTS);
            const others = U.sample(QUERY_PARTS.filter(x => x !== part), 3);
            return Q.mc({
              q: `<p>VS Code generated this query when you chose Select Top 1000 on <code>dbo.${t}</code>:</p>${code(["-- " + t + " first look", ...genQuery(t, 1000)])}<p>What does <b>${part.p}</b> do?</p>`,
              right: part.m, rightWhy: `${part.p}: ${part.m.toLowerCase()}.`,
              wrong: others.map(o => ({ t: o.m, why: `That describes ${o.p}, not ${part.p}.` })),
              sol: S("Read the query left to right: SELECT [how many] [which columns] FROM [database].[schema].[table].", `${part.p} → ${part.m}.`),
            });
          },
        },
        {
          name: "Predict the row count",
          make() {
            const t = U.pick(["ORDERS", "ORDER_ITEMS", "REVIEWS", "CUSTOMERS", "PRODUCTS"]);
            const cap = U.pick([1000, 1000, 500, 200, 100]);
            const small = Math.random() < 0.45;
            const N = small ? U.randInt(Math.round(cap * 0.2), Math.round(cap * 0.9)) : U.randInt(cap + 50, cap * 4);
            const ans = Math.min(N, cap);
            return Q.num({
              kind: "count",
              q: `<p>The table <code>dbo.${t}</code> contains <b>${N.toLocaleString("en-US")}</b> rows. How many rows does this query return?</p>${code(genQuery(t, cap))}`,
              answer: ans, unit: "rows",
              traps: nonEq([
                { value: cap, why: `TOP (${cap}) is a <em>maximum</em>, not a target; a ${N}-row table can only return ${N}.` },
                { value: N, why: `TOP (${cap}) cuts the result off at ${cap} rows.` },
                { value: N - cap, why: "TOP limits how many rows come back; it doesn't skip any." },
              ], ans),
              sol: S("TOP (n) means \"at most n rows\".", `min(${N}, ${cap}) = <b>${ans}</b>.${small ? "" : ` Seeing exactly ${cap} rows should make you suspect the cap. Remove TOP to see all ${N}.`}`),
            });
          },
        },
        {
          name: "SQL change or display only?",
          make() {
            const k = U.randInt(1, 4);
            const yes = U.sample(ACTIONS.filter(a => a.ok), k);
            const no = U.sample(ACTIONS.filter(a => !a.ok), 5 - k);
            return Q.multi({
              q: "<p>Select <b>every</b> action that changes which rows or columns the database returns (as opposed to only changing how the results grid looks).</p>",
              options: [...yes, ...no],
              sol: S("Ask: did the SQL text that is sent to the database change?", "Editing TOP, the column list or the table changes the query. Sorting, filtering or resizing in the grid, and adding comments, don't."),
            });
          },
        },
        {
          name: "Which columns come back?",
          make() {
            const t = U.pick(TABLES.filter(x => TABLE_COLS[x].length >= 4));
            const all = TABLE_COLS[t];
            const k = U.randInt(1, all.length - 1);
            const pickSet = new Set(U.sample(all, k));
            const sel = all.filter(c => pickSet.has(c));
            const n = U.pick([50, 100, 1000]);
            return Q.multi({
              q: `<p><code>dbo.${t}</code> has the columns ${all.map(c => `<code>${c}</code>`).join(", ")}. An analyst edits the generated query to:</p>${code([`SELECT TOP (${n}) ${sel.map(c => `[${c}]`).join(", ")}`, `FROM [HoosierHoldings_ClassDB].[dbo].[${t}]`])}<p>Select every column that appears in the results.</p>`,
              options: all.map(c => ({ t: c, ok: pickSet.has(c), why: pickSet.has(c) ? `${c} is in the SELECT list.` : `${c} exists in the table but isn't listed after SELECT, so it doesn't come back.` })),
              sol: S("The column list after SELECT (and TOP) decides which fields are returned.", `Returned: ${sel.join(", ")}. Every other column stays in the table but isn't shown.`),
            });
          },
        },
        {
          name: "Which query shows every row?",
          make() {
            const t = U.pick(TABLES);
            const other = U.pick(TABLES.filter(x => x !== t));
            const cols = TABLE_COLS[t].slice(0, 3).map(c => `[${c}]`).join(", ");
            const right = `SELECT ${cols}<br>FROM [HoosierHoldings_ClassDB].[dbo].[${t}]`;
            return Q.mc({
              q: `<p>You need to see <b>every</b> row of <code>dbo.${t}</code> (it has several thousand) to count unmatched records. Which query should you run?</p>`,
              right: `<code>${right}</code>`, rightWhy: "No TOP, so nothing is capped, and it reads the right table.",
              wrong: [
                { t: `<code>SELECT TOP (1000) ${cols}<br>FROM [HoosierHoldings_ClassDB].[dbo].[${t}]</code>`, why: "TOP (1000) caps the result; with thousands of rows you'd see only part of the table." },
                { t: `<code>SELECT ${TABLE_COLS[other].slice(0, 3).map(c => `[${c}]`).join(", ")}<br>FROM [HoosierHoldings_ClassDB].[dbo].[${other}]</code>`, why: `That reads ${other}, not ${t}.` },
                { t: `<code>-- SELECT ${cols}<br>-- FROM [HoosierHoldings_ClassDB].[dbo].[${t}]</code>`, why: "Every line is a comment, so the database runs nothing." },
              ],
              sol: S("Check three things: is there a row cap, is it the right table, and will it actually run?", "Remove TOP, keep FROM pointed at the right table, and make sure the lines aren't commented out."),
            });
          },
        },
        {
          name: "Rows on screen vs. rows in the table",
          make() {
            const N = U.randInt(1200, 3600);
            const store = U.pick(STORES);
            const shown = U.randInt(180, 420);
            const ans = N;
            return Q.num({
              kind: "count",
              q: `<p>You run <code>SELECT [ProductID], [ProductName], [StoreID] FROM [HoosierHoldings_ClassDB].[dbo].[PRODUCTS]</code> (no TOP); the status reports <b>${N.toLocaleString("en-US")}</b> rows. You then filter the results grid to StoreID ${store.id} (${store.name}) and the grid shows <b>${shown}</b> rows. You forget to clear the filter. How many rows does the PRODUCTS table now hold?</p>`,
              answer: ans, unit: "rows",
              traps: nonEq([
                { value: shown, why: "That's what the filtered grid displays; the filter doesn't change the table." },
                { value: N - shown, why: "Filtering hides rows on screen; it doesn't delete them." },
                { value: 1000, why: "There's no TOP in this query, and grid filters don't impose one." },
              ], ans),
              sol: S("Does a results-grid filter change the table, or only the view?", `Only the view. The table still holds all <b>${N.toLocaleString("en-US")}</b> rows.`),
            });
          },
        },
        K.tfVariant("True or false: reading queries", "k201-ch9-sqlread-tf", SQL_TF),
      ],
    }),

    /* ---------------- 5. Classifying problems ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-problems",
      name: "Classify data problems",
      blurb: "Label findings as referential integrity, business rule or data quality, and decide whether a constraint could have prevented them.",
      variants: [
        ...problemSorts,
        {
          name: "Constraint or human judgment?",
          make() {
            const items = [...U.deal("ch9-prev-c", PREVENT_BANK.filter(b => b.cat === "A constraint could prevent it"), 2),
              ...U.deal("ch9-prev-h", PREVENT_BANK.filter(b => b.cat === "Needs human judgment"), 2)];
            const extra = U.pick(PREVENT_BANK.filter(b => !items.includes(b)));
            return Q.classify({
              q: "<p>For each problem, could an enforced constraint (type, key, not-null or business-rule) have stopped it at entry, or does catching it need human judgment?</p>",
              cats: ["A constraint could prevent it", "Needs human judgment"],
              items: [...items, extra],
              sol: S("Ask: is there a mechanical rule (a type, a key, a range, a required field) that this value breaks?", "If yes, a constraint could block it. If the value is perfectly valid and only someone who knows the business sees it's wrong, it needs human judgment."),
            });
          },
        },
        {
          name: "Which safeguard would have caught it?",
          make() {
            const cases = [
              { f: `An order for CustomerID ${U.randInt(5000, 9999)}, who isn't in CUSTOMERS`, r: "An enforced foreign key" },
              { f: `A product assigned to StoreID ${U.pick([4, 6, 8])}`, r: "An enforced foreign key" },
              { f: `A review with Rating ${U.pick([0, 6, 9, 10])}`, r: "A business-rule constraint (range check)" },
              { f: "A customer email ending in @icloud.com", r: "A business-rule constraint (range check)" },
              { f: "A customer named \"Test User\"", r: "Only human review" },
              { f: "\"Supply Chain\" and \"Supply Chian\" both in Major", r: "Only human review" },
              { f: "The text \"tomorrow\" in an INT Quantity column", r: "The column's data type" },
              { f: "The word \"pending\" in the OrderDate column", r: "The column's data type" },
            ];
            const c = U.pick(cases);
            const all = ["An enforced foreign key", "A business-rule constraint (range check)", "The column's data type", "Only human review"];
            const why = {
              "An enforced foreign key": "rejects any FK value that doesn't match an existing PK",
              "A business-rule constraint (range check)": "rejects valid-type values outside the business's allowed set or range",
              "The column's data type": "rejects values of the wrong kind (text in an INT or DATE column)",
              "Only human review": "is needed when the value is structurally valid but wrong in a way only someone who knows the business can see",
            };
            return Q.mc({
              q: `<p>Finding: <b>${c.f}</b>. Which safeguard would have stopped (or caught) it?</p>`,
              right: c.r, rightWhy: `${c.r} ${why[c.r]}.`,
              wrong: all.filter(x => x !== c.r).map(x => ({ t: x, why: `${x} ${why[x]}, which doesn't fit this finding.` })),
              keepOrder: all,
              sol: S("Name the problem category first: missing parent, broken stated rule, wrong kind of value, or valid-but-wrong?", `Here: ${c.r}, because it ${why[c.r]}.`),
            });
          },
        },
        K.tfVariant("True or false: problem types", "k201-ch9-problems-tf", [
          { s: "A Rating of 10 on a 1–5 scale is a referential-integrity violation.", truth: false, why: "It doesn't reference anything missing; it's a valid INT breaking a stated rule, so it's a business-rule violation.", hint: "Does the value point to another table?" },
          { s: "A product assigned to a store that doesn't exist is a referential-integrity violation.", truth: true, why: "Its FK points to a missing parent row." },
          { s: "Every data-quality failure could be prevented by a stricter constraint.", truth: false, why: "Some could, but placeholders, inconsistent spellings and duplicate people often need human judgment." },
          { s: "A business-rule violation is structurally valid but operationally wrong.", truth: true, why: "The value has the right type and links, but breaks a rule the business set." },
          { s: "An order dated 2035 is a data-quality failure (an impossible date).", truth: true, why: "Impossible dates fall under data quality." },
          { s: "An orphaned record is one whose primary key is missing.", truth: false, why: "It's a record whose foreign key points to a parent that doesn't exist." },
        ]),
      ],
    }),

    /* ---------------- 6. Auditing records ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-audit",
      name: "Audit the records",
      blurb: "Read small Hoosier Holdings tables and find the non-IU emails, phantom stores, orphaned orders and out-of-range ratings.",
      variants: [
        {
          name: "CUSTOMERS: count non-IU emails",
          make() {
            const n = U.randInt(8, 10);
            const bad = U.randInt(2, 4);
            const g = U.randInt(1, bad - 1);
            const ps = people(n);
            const doms = U.shuffle([...Array(g).fill("gmail.com"), ...U.shuffle(OTHER_DOMAINS).concat(OTHER_DOMAINS).slice(0, bad - g), ...Array(n - bad).fill("iu.edu")]);
            const ids = distinctInts(n, 1001, 1060).sort((a, b) => a - b);
            const rows = ps.map((p, i) => [ids[i], p.first, p.last, `${handle(p)}@${doms[i]}`, U.pick(MAJORS)]);
            const badRows = rows.filter((r, i) => doms[i] !== "iu.edu");
            return Q.num({
              kind: "count",
              q: `<p>Business rule: every customer must have an <b>iu.edu</b> SchoolEmail. Here is a result from <code>dbo.CUSTOMERS</code>:</p>${tbl(["CustomerID", "FirstName", "LastName", "SchoolEmail", "Major"], rows)}<p>How many rows break the rule?</p>`,
              answer: bad, unit: "customers",
              traps: nonEq([
                { value: g, why: "You counted only the gmail addresses. Yahoo, Outlook, iCloud and Hotmail addresses break the rule too." },
                { value: n - bad, why: "That's the number of customers who <em>follow</em> the rule." },
                { value: n, why: "Not every row is a violation; check each email's domain." },
              ], bad),
              sol: S("Test every email against the rule itself (does it end in @iu.edu?), not against one way of breaking it.", `Violations: ${badRows.map(r => `${r[0]} (${r[3]})`).join("; ")}.`, `So <b>${bad}</b>. A \"gmail\" search would have found only ${g}. These are business-rule violations: the iu.edu rule exists on paper but isn't enforced.`),
            });
          },
        },
        {
          name: "PRODUCTS: phantom stores",
          make() {
            const n = U.randInt(6, 7);
            const nb = U.randInt(1, 3);
            const ids = distinctInts(n, 2001, 2090).sort((a, b) => a - b);
            const badIdx = new Set(U.sample([...Array(n).keys()], nb));
            const rows = ids.map((id, i) => {
              const sid = badIdx.has(i) ? U.pick([0, 4, 5, 6, 9, 12]) : U.randInt(1, 3);
              const home = sid >= 1 && sid <= 3 ? sid : U.randInt(1, 3);
              return { id, name: U.pick(PRODUCTS_BY_STORE[home]), price: U.pick(PRICES), sid };
            });
            const used = new Set();
            rows.forEach(r => { while (used.has(r.name)) r.name = r.name + " (v2)"; used.add(r.name); });
            return Q.multi({
              q: `<p><code>dbo.STORES</code>:</p>${tbl(["StoreID", "StoreName"], STORES.map(s => [s.id, s.name]))}<p><code>dbo.PRODUCTS</code>:</p>${tbl(["ProductID", "ProductName", "BasePrice", "StoreID"], rows.map(r => [r.id, r.name, money2(r.price), r.sid]))}<p>Select every product assigned to a store that <b>doesn't exist</b>.</p>`,
              options: rows.map(r => ({
                t: `ProductID ${r.id}`, ok: badIdx.has(rows.indexOf(r)),
                why: r.sid >= 1 && r.sid <= 3 ? `StoreID ${r.sid} matches ${STORES[r.sid - 1].name}.` : `StoreID ${r.sid} matches no row in STORES: an orphaned product (referential-integrity violation).`,
              })),
              sol: S("Compare each product's StoreID with the StoreIDs that actually exist in STORES (1, 2, 3).", `Unmatched: ${rows.filter(r => r.sid < 1 || r.sid > 3).map(r => `${r.id} (StoreID ${r.sid})`).join(", ")}. The StoreID FK is logical, so these rows were accepted without warning.`),
            });
          },
        },
        {
          name: "ORDERS: count orphaned orders",
          make() {
            const nc = U.randInt(5, 6);
            const cust = distinctInts(nc, 101, 140).sort((a, b) => a - b);
            const ps = people(nc);
            const ghostPool = distinctInts(3, 141, 199);
            const no = U.randInt(8, 10);
            const nOrph = U.randInt(2, 4);
            const ghosts = [];
            for (let i = 0; i < nOrph; i++) ghosts.push(i === 0 ? ghostPool[0] : (Math.random() < 0.4 ? ghostPool[0] : ghostPool[i % 3]));
            if (nOrph >= 2 && new Set(ghosts).size === nOrph) ghosts[1] = ghosts[0];
            const cids = U.shuffle([...ghosts, ...Array.from({ length: no - nOrph }, () => U.pick(cust))]);
            const oids = distinctInts(no, 5001, 5099).sort((a, b) => a - b);
            const days = distinctInts(no, 1, 28).sort((a, b) => a - b);
            const mon = U.randInt(1, 9);
            const rows = oids.map((o, i) => [o, cids[i], U.randInt(1, 3), `2025-${String(mon).padStart(2, "0")}-${String(days[i]).padStart(2, "0")}`]);
            const distinctGhost = new Set(ghosts).size;
            const orphRows = rows.filter(r => !cust.includes(r[1]));
            return Q.num({
              kind: "count",
              q: `<p><code>dbo.CUSTOMERS</code>:</p>${tbl(["CustomerID", "FirstName", "LastName"], cust.map((c, i) => [c, ps[i].first, ps[i].last]))}<p><code>dbo.ORDERS</code>:</p>${tbl(["OrderID", "CustomerID", "StoreID", "OrderDate"], rows)}<p>How many <b>orders</b> reference a customer who doesn't exist?</p>`,
              answer: nOrph, unit: "orders",
              traps: nonEq([
                { value: distinctGhost, why: "You counted distinct missing CustomerIDs; the question asks for orders, and one missing customer can appear on several orders." },
                { value: no - nOrph, why: "That's the number of matched orders." },
                { value: no, why: "Most orders do match a customer; check each CustomerID." },
              ], nOrph),
              sol: S("For each order, look its CustomerID up in CUSTOMERS. No match means an orphaned order.", `Unmatched: ${orphRows.map(r => `order ${r[0]} (CustomerID ${r[1]})`).join(", ")}.`, `<b>${nOrph}</b> orders, a referential-integrity violation an enforced FK would have blocked.`),
            });
          },
        },
        {
          name: "REVIEWS: out-of-range ratings",
          make() {
            const n = U.randInt(6, 7);
            const nb = U.randInt(1, 2);
            const ids = distinctInts(n, 301, 399).sort((a, b) => a - b);
            const badIdx = new Set(U.sample([...Array(n).keys()], nb));
            const goodVals = U.shuffle([1, 5, ...Array.from({ length: n }, () => U.randInt(1, 5))]);
            const badVals = U.sample([0, 6, 7, 10, -1, 11], nb);
            let gi = 0, bi = 0;
            const texts = ["Works great", "Fell apart in a week", "Exactly as described", "Pricey but worth it", "Would buy again", "Runs small", "Okay for the price", "Arrived late"];
            const rows = ids.map((id, i) => ({ id, pid: U.randInt(2001, 2090), cid: U.randInt(101, 140), r: badIdx.has(i) ? badVals[bi++] : goodVals[gi++], txt: texts[i % texts.length] }));
            return Q.multi({
              q: `<p>Business rule: Rating must be between <b>1 and 5</b>. Result from <code>dbo.REVIEWS</code>:</p>${tbl(["ReviewID", "ProductID", "CustomerID", "Rating", "ReviewText"], rows.map(r => [r.id, r.pid, r.cid, r.r, r.txt]))}<p>Select every review that breaks the rule.</p>`,
              options: rows.map(r => ({
                t: `ReviewID ${r.id}`, ok: r.r < 1 || r.r > 5,
                why: r.r < 1 || r.r > 5 ? `Rating ${r.r} is outside 1–5: a business-rule violation. It's a valid INT, so the type didn't stop it.` : `Rating ${r.r} is within 1–5${r.r === 1 || r.r === 5 ? " (the boundaries count as valid)" : ""}.`,
              })),
              sol: S("Sort Rating ascending, then descending, and look at the extremes. Remember 1 and 5 themselves are allowed.", `Violations: ${rows.filter(r => r.r < 1 || r.r > 5).map(r => `${r.id} (Rating ${r.r})`).join(", ")}.`),
            });
          },
        },
        {
          name: "STORES: predict the sorted grid",
          make() {
            const years = distinctInts(3, 2018, 2025);
            const st = STORES.map((s, i) => ({ ...s, date: `${years[i]}-${String(U.randInt(1, 12)).padStart(2, "0")}-${String(U.randInt(1, 28)).padStart(2, "0")}` }));
            const clicks = U.pick([1, 2]);
            const sorted = st.slice().sort((a, b) => a.date.localeCompare(b.date));
            const first = clicks === 1 ? sorted[0] : sorted[2];
            const ask = U.pick(["first", "count"]);
            if (ask === "count") {
              return Q.mc({
                q: `<p>Select Top 1000 on <code>dbo.STORES</code> returns:</p>${tbl(["StoreID", "StoreName", "LaunchDate"], st.map(s => [s.id, s.name, s.date]))}<p>Which observation belongs in your <code>STORES_Observation.sql</code> comments?</p>`,
                right: "-- 3 stores; StoreIDs are 1, 2 and 3",
                rightWhy: "Three rows, IDs 1–3. These are the valid StoreID values every FK should match.",
                wrong: [
                  { t: "-- 1000 stores (the query said TOP 1000)", why: "TOP (1000) is a cap; only 3 rows came back." },
                  { t: "-- 3 stores; StoreIDs are 0, 1 and 2", why: "Read the StoreID column: the values are 1, 2 and 3." },
                  { t: `-- 3 stores; sorted by LaunchDate (saved in the query)`, why: "Grid sorts aren't saved in the SQL." },
                ],
                sol: S("Count the rows and read the StoreID column directly.", "3 stores with IDs 1, 2, 3. Any other StoreID elsewhere in the database is an orphan."),
              });
            }
            return Q.mc({
              q: `<p>Select Top 1000 on <code>dbo.STORES</code> returns:</p>${tbl(["StoreID", "StoreName", "LaunchDate"], st.map(s => [s.id, s.name, s.date]))}<p>You click the LaunchDate column header <b>${clicks === 1 ? "once" : "twice"}</b>. Which store is now in the first row?</p>`,
              right: first.name, rightWhy: clicks === 1 ? "One click sorts ascending, so the earliest launch comes first." : "Two clicks sort descending, so the most recent launch comes first.",
              wrong: st.filter(s => s !== first).map(s => ({
                t: s.name,
                why: s === (clicks === 1 ? sorted[2] : sorted[0]) ? `That would be ${clicks === 1 ? "two clicks (descending)" : "one click (ascending)"}.` : "Its launch date is in the middle, so it can't be first either way.",
              })).concat([{ t: "The order can't change: sorting must be written into the SQL", why: "The grid can sort by clicking headers; it just isn't saved in the SQL." }]),
              sol: S("First click = ascending (oldest first); second click = descending (newest first).", `${first.name} (${first.date}) comes first. The sort is display only and won't be saved in the query.`),
            });
          },
        },
        {
          name: "Label each flagged row",
          make() {
            const RI = [
              () => `Order ${U.randInt(5001, 5999)}: CustomerID ${U.randInt(800, 999)}, and no such customer exists`,
              () => `Product ${U.randInt(2001, 2999)}: StoreID ${U.pick([0, 4, 5, 7])}`,
              () => `Review ${U.randInt(301, 999)}: ProductID ${U.randInt(9000, 9999)}, not in PRODUCTS`,
              () => `Order line: OrderID ${U.randInt(7000, 7999)}, missing from ORDERS`,
            ];
            const BR = [
              () => `Review ${U.randInt(301, 999)}: Rating ${U.pick([0, 6, 8, 10])}`,
              () => `Customer ${U.randInt(1001, 1999)}: SchoolEmail ends in @${U.pick(["gmail.com", ...OTHER_DOMAINS])}`,
            ];
            const DQ = [
              () => `Customer ${U.randInt(1001, 1999)}: FirstName \"Test\", LastName \"User\"`,
              () => `Order ${U.randInt(5001, 5999)}: OrderDate 2035-${String(U.randInt(1, 12)).padStart(2, "0")}-14`,
              () => `Customers ${U.randInt(1001, 1400)} and ${U.randInt(1401, 1999)}: same name, same email`,
              () => `Major values \"Accounting\", \"Acctg\" and \"acounting\"`,
            ];
            const OK = [
              () => `Review ${U.randInt(301, 999)}: Rating ${U.pick([1, 5])}`,
              () => `Product ${U.randInt(2001, 2999)}: StoreID ${U.randInt(1, 3)}`,
              () => `Customer ${U.randInt(1001, 1999)}: SchoolEmail ends in @iu.edu`,
            ];
            const cats = ["Referential integrity violation", "Business rule violation", "Data quality failure", "No problem"];
            const picks = [
              { f: U.pick(RI), c: cats[0], why: "Its FK points at a record that doesn't exist." },
              { f: U.pick(BR), c: cats[1], why: "A valid value that breaks a stated business rule." },
              { f: U.pick(DQ), c: cats[2], why: "Placeholder, impossible, duplicate or inconsistent: a data-quality failure." },
              { f: U.pick(OK), c: cats[3], why: "This value is valid: in range, matched, or the right domain." },
            ];
            const extra = U.pick([{ f: U.pick(RI), c: cats[0], why: "Unmatched FK value." }, { f: U.pick(DQ), c: cats[2], why: "Data-quality failure." }, { f: U.pick(BR), c: cats[1], why: "Breaks a business rule." }]);
            const items = [...picks, extra].map(p => ({ t: p.f(), cat: p.c, why: p.why }));
            const seen = new Set();
            const uniq = items.filter(i => !seen.has(i.t) && seen.add(i.t));
            return Q.classify({
              q: "<p>Your audit flagged these rows. Label each one.</p>",
              cats, items: uniq,
              sol: S("Ask in order: does it point to something missing? Does a valid value break a stated rule? Is it a placeholder, impossible, duplicate or inconsistent? Or is it actually fine?", "Missing parent → referential integrity; Rating outside 1–5 or a non-iu.edu email → business rule; Test User, 2035 dates, duplicates, inconsistent spellings → data quality. Ratings of 1 or 5, StoreIDs 1–3 and iu.edu emails are fine."),
            });
          },
        },
        K.conceptVariant("Diagnose the micro-disruption", "k201-ch9-disrupt", DISRUPTIONS),
      ],
    }),

    /* ---------------- 7. Decide ---------------- */
    STUDY.makeGenerator({
      id: "k201-ch9-decide",
      name: "Trustworthy enough? Act, pause, investigate",
      blurb: "Walk the evaluation checklist, quantify the impact of bad records, and recommend act, pause or investigate.",
      variants: [
        {
          name: "Recommend act / investigate / pause",
          make() {
            const sc = U.rotate("ch9-scen", SCENARIOS);
            return Q.mc({
              q: `<p>${sc.s}</p><p>What should you recommend?</p>`,
              right: sc.a, rightWhy: sc.why,
              wrong: API_ORDER.filter(x => x !== sc.a).map(x => ({ t: x, why: `${API_WHY[x]} Here: ${sc.why}` })),
              keepOrder: API_ORDER,
              sol: S("First: is there a problem, and is it confirmed? Second: could it change <em>this</em> decision?", `${sc.a.split(":")[0]}: ${sc.why}`),
            });
          },
        },
        {
          name: "Quantify the impact",
          make() {
            const cust = distinctInts(5, 101, 140);
            const n = U.randInt(7, 9);
            const nOrph = U.randInt(2, 3);
            const ghosts = distinctInts(nOrph, 141, 199);
            const cids = U.shuffle([...ghosts, ...Array.from({ length: n - nOrph }, () => U.pick(cust))]);
            const totals = Array.from({ length: n }, () => U.randInt(12, 260));
            const oids = distinctInts(n, 5001, 5099).sort((a, b) => a - b);
            const sum = totals.reduce((a, b) => a + b, 0);
            const bad = totals.filter((_, i) => !cust.includes(cids[i])).reduce((a, b) => a + b, 0);
            const ans = U.round(bad / sum * 100, 1);
            const share = U.round(nOrph / n * 100, 1);
            return Q.num({
              q: `<p>Before a revenue-by-customer report goes to leadership, you check whether each order's customer exists. CustomerIDs in <code>dbo.CUSTOMERS</code>: <b>${cust.sort((a, b) => a - b).join(", ")}</b>.</p>${tbl(["OrderID", "CustomerID", "OrderTotal"], oids.map((o, i) => [o, cids[i], "$" + totals[i]]))}<p>What percentage of total revenue sits on orders whose CustomerID is unmatched? (one decimal)</p>`,
              answer: ans, unit: "%", tol: 0.15,
              traps: Math.abs(share - ans) > 1 ? [{ value: share, why: "That's the share of <em>orders</em> that are unmatched; the question asks for the share of <em>revenue</em>." }] : [],
              sol: S("Find the unmatched orders first, then compare their revenue with the total.", `Unmatched revenue = ${totals.filter((_, i) => !cust.includes(cids[i])).map(t => "$" + t).join(" + ")} = $${bad}; total = $${sum}.`, `${bad} ÷ ${sum} × 100 = <b>${ans}%</b>. That is the number to weigh when deciding whether the report can be trusted.`),
            });
          },
        },
        { ...checkSorts[0], name: "Checklist: sort the findings" },
        { ...checkSorts[4], name: "Checklist: which question does it fail?" },
        {
          name: "Which is NOT on the checklist?",
          make() {
            const real = [
              "Does the schema reflect the business entities?",
              "Are the relationships enforced?",
              "Are business rules implemented as constraints?",
              "Is the data complete and consistent?",
              "Does the data support the decision?",
            ];
            const fakes = [
              { t: "Did the query run without an error message?", why: "A successful run says nothing about whether the data is trustworthy, which is the whole point of the verification gap." },
              { t: "Was the query generated by Select Top 1000?", why: "How the query was created isn't a trust test; if anything, a TOP cap is a warning sign." },
              { t: "Is the database running in production?", why: "Being live shows the system runs, not that its data is right." },
              { t: "Is the results grid sorted by the primary key?", why: "Display order doesn't affect whether data is reliable." },
            ];
            const f = U.pick(fakes);
            return Q.mc({
              q: "<p>Three of these are questions from the evaluation checklist for deciding whether data can be trusted. Which one is <b>NOT</b>?</p>",
              right: f.t, rightWhy: f.why,
              wrong: U.sample(real, 3).map(r => ({ t: r, why: "This one is on the checklist." })),
              sol: S("The checklist moves from structure (schema, relationships, rules) to content (complete, consistent) to purpose (supports the decision).", `"${f.t}" isn't on it: ${f.why}`),
            });
          },
        },
        {
          name: "Select the evidence that blocks acting",
          make() {
            const block = [
              "The result has exactly 1,000 rows and nobody has checked the full table",
              "12% of orders reference CustomerIDs missing from CUSTOMERS",
              "The analysis was done on a grid that still had a StoreID filter on",
              "Only a \"gmail\" search was used to check the iu.edu rule",
              "A third of the revenue sits on orders dated 2035",
            ];
            const fine = [
              "The query ran without any error message",
              "The database has been live in production for three years",
              "The ERD shows a line between ORDERS and CUSTOMERS",
              "The grid was sorted by OrderDate before exporting",
              "The column headers match the ERD",
            ];
            const whyB = "This undermines the results (partial, unmatched or unchecked data), so you shouldn't act until it is resolved or quantified.";
            const whyF = {
              "The query ran without any error message": "Running successfully doesn't show the data is trustworthy, but it isn't evidence of a problem either.",
              "The database has been live in production for three years": "Being live is neither proof of quality nor evidence of a problem.",
              "The ERD shows a line between ORDERS and CUSTOMERS": "The ERD documents the relationship; it's not by itself a sign of bad data (or of enforcement).",
              "The grid was sorted by OrderDate before exporting": "Sorting changes display order only; every row is still there.",
              "The column headers match the ERD": "That's a good sign from the reading habit, not a reason to stop.",
            };
            const k = U.randInt(1, 4);
            return Q.multi({
              q: "<p>Leadership wants to act on a store revenue report today. Select <b>every</b> finding that means you should <b>not</b> act yet (investigate or pause instead).</p>",
              options: [...U.sample(block, k).map(t => ({ t, ok: true, why: whyB })), ...U.sample(fine, 5 - k).map(t => ({ t, ok: false, why: whyF[t] }))],
              sol: S("Separate reassurances that don't actually test the data from findings that show the data is partial or wrong.", "Caps, leftover filters, one-symptom searches and large unmatched or impossible shares all block acting. Successful runs, live status, ERD lines and display sorts don't tell you anything about trust."),
            });
          },
        },
        K.tfVariant("True or false: trusting results", "k201-ch9-decide-tf", DECIDE_TF),
      ],
    }),
  ];

  STUDY.registerUnit(C, {
    id: "ch9", order: 9,
    title: "Chapter 9 · The Verification Gap: Why Production Data Still Needs Checking",
    short: "Ch 9 · Verification gap",
    description: "Read a live database's schema and its auto-generated queries, audit records for integrity, rule and quality problems, and decide whether the results are trustworthy enough to act on.",
    notes, flashcards, cues, generators,
  });
})();
