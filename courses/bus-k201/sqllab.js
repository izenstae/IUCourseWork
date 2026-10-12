/* ============================================================
 * BUS K201 · SQL Lab — a practice copy of a three-store retail
 * database in the spirit of the course's Hoosier Holdings case, with
 * the same kinds of planted problems (non-IU emails, products from a
 * store that does not exist, orphaned orders, negative quantities,
 * deep discounts, an out-of-range rating, a far-future order date).
 * The data is original to this site and generated from a fixed seed,
 * so every visit (and every reference answer) is identical.
 *
 * Exercises are graded by running the student's query and the
 * reference query and comparing the result rows (column names are not
 * compared, so any alias works). `ordered: true` also checks row order.
 * Rendered by js/sqllab.js; checked by tools/check-sqllab.js.
 * ============================================================ */
(function () {
  /* ---------- deterministic data ---------- */
  let seed = 201;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const q = s => "'" + String(s).replace(/'/g, "''") + "'";
  const val = v => v === null ? "NULL" : typeof v === "number" ? String(v) : q(v);
  const ins = (t, rows) => rows.map(r => `INSERT INTO ${t} VALUES (${r.map(val).join(", ")});`).join("\n");

  const STORES = [
    [1, "The Tech Den", "Electronics", "2021-08-16"],
    [2, "Kirkwood Couture", "Apparel", "2022-01-10"],
    [3, "Dorm Depot", "Dorm & Home", "2023-08-14"],
  ];

  // [ProductID, ProductName, Category, BasePrice, StoreID]
  const PRODUCTS = [
    [101, "Wireless Earbuds", "Audio", 79.99, 1], [102, "USB-C Hub", "Accessories", 39.99, 1],
    [103, "Graphing Calculator", "Study", 119.99, 1], [104, "Laptop Stand", "Accessories", 34.5, 1],
    [105, "Portable Charger", "Power", 29.99, 1], [106, "Noise-Cancelling Headphones", "Audio", 199.99, 1],
    [107, "Mechanical Keyboard", "Accessories", 89.0, 1], [108, "Webcam HD", "Accessories", 54.99, 1],
    [109, "Smart Desk Lamp", "Lighting", 44.99, 1], [110, "Tablet Stylus", "Accessories", 64.99, 1],
    [201, "Crimson Hoodie", "Tops", 54.0, 2], [202, "Cream Crewneck", "Tops", 48.0, 2],
    [203, "Game Day Tee", "Tops", 22.0, 2], [204, "Denim Jacket", "Outerwear", 89.0, 2],
    [205, "Rain Shell", "Outerwear", 119.0, 2], [206, "Knit Beanie", "Accessories", 18.0, 2],
    [207, "Canvas Tote", "Accessories", 25.0, 2], [208, "Joggers", "Bottoms", 42.0, 2],
    [209, "Wool Scarf", "Accessories", 32.0, 2], [210, "Quarter-Zip Pullover", "Tops", 64.0, 2],
    [301, "Twin XL Sheet Set", "Bedding", 39.99, 3], [302, "Mattress Topper", "Bedding", 79.99, 3],
    [303, "Mini Fridge", "Appliances", 159.99, 3], [304, "Storage Bins (3-pack)", "Organization", 24.99, 3],
    [305, "Desk Organizer", "Organization", 19.99, 3], [306, "Shower Caddy", "Bath", 14.99, 3],
    [307, "LED Strip Lights", "Lighting", 21.99, 3], [308, "Electric Kettle", "Appliances", 34.99, 3],
    [309, "Over-Door Mirror", "Decor", 44.99, 3], [310, "Floor Rug", "Decor", 69.99, 3],
    // planted: products assigned to stores that do not exist (logical FK, not enforced)
    [311, "Vintage Record Player", "Audio", 149.99, 4], [312, "Hand-Painted Mug", "Decor", 16.0, 7],
  ];

  const FIRST = ["Ava", "Liam", "Maya", "Noah", "Priya", "Ethan", "Sofia", "Jamal", "Chloe", "Diego", "Hana", "Isaac", "Keisha",
    "Mateo", "Nora", "Omar", "Quinn", "Rosa", "Tariq", "Uma", "Wes", "Yara", "Zoe", "Elena", "Malik", "Grace", "Leo", "Aisha",
    "Ben", "Ivy", "Jonah", "Kira", "Luca", "Mina", "Owen", "Paige"];
  const LAST = ["Adams", "Baker", "Chen", "Diaz", "Evans", "Foster", "Garcia", "Hughes", "Ito", "Johnson", "Khan", "Lopez",
    "Miller", "Nguyen", "Okafor", "Patel", "Reed", "Singh", "Turner", "Vasquez", "Walker", "Young"];
  const MAJORS = ["Finance", "Marketing", "Accounting", "Informatics", "Economics", "Supply Chain", "Management", "Data Science"];

  // [CustomerID, FirstName, LastName, SchoolEmail, Major, GradYear]
  const CUSTOMERS = [];
  const used = new Set();
  for (let id = 1001; id <= 1040; id++) {
    let f, l;
    do { f = pick(FIRST); l = pick(LAST); } while (used.has(f + l));
    used.add(f + l);
    const user = (f[0] + l).toLowerCase().replace(/[^a-z]/g, "") + ri(1, 9);
    CUSTOMERS.push([id, f, l, user + "@iu.edu", pick(MAJORS), ri(2026, 2029)]);
  }
  // planted: non-IU email addresses (not only gmail), a missing email and a placeholder record
  const planted = { 1004: "@gmail.com", 1011: "@yahoo.com", 1017: "@gmail.com", 1023: "@outlook.com", 1032: "@icloud.com", 1038: "@gmail.com" };
  for (const c of CUSTOMERS) if (planted[c[0]]) c[3] = c[3].replace("@iu.edu", planted[c[0]]);
  CUSTOMERS.find(c => c[0] === 1027)[3] = null;
  CUSTOMERS.push([1041, "Test", "User", "test@iu.edu", null, null]);

  // [OrderID, CustomerID, StoreID, OrderDate]
  const ORDERS = [];
  const ITEMS = [];   // [OrderItemID, OrderID, ProductID, Quantity, SalePrice]
  const byStore = s => PRODUCTS.filter(p => p[4] === s && ![104, 209, 305, 310].includes(p[0]));   // a few never sell
  let itemId = 1;
  for (let oid = 5001; oid <= 5090; oid++) {
    const store = ri(1, 3);
    const cust = 1001 + ri(0, 39);
    const month = ri(8, 11), day = ri(1, 28);
    ORDERS.push([oid, cust, store, `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`]);
    const n = ri(1, 3);
    const prods = byStore(store).slice().sort(() => rnd() - 0.5).slice(0, n);
    for (const p of prods) {
      const disc = rnd() < 0.25 ? 0.9 : 1;   // ordinary small promotions
      ITEMS.push([itemId++, oid, p[0], ri(1, 3), Math.round(p[3] * disc * 100) / 100]);
    }
  }
  // planted: orders whose CustomerID does not exist, and an impossible date
  ORDERS.find(o => o[0] === 5014)[1] = 1099;
  ORDERS.find(o => o[0] === 5047)[1] = 1150;
  ORDERS.find(o => o[0] === 5071)[1] = 1099;
  ORDERS.find(o => o[0] === 5063)[3] = "2035-10-14";
  // planted: negative / zero quantities and deep, unauthorised discounts
  for (const k of [6, 19, 33, 48, 77, 102, 140]) if (ITEMS[k]) ITEMS[k][3] = -1;
  if (ITEMS[58]) ITEMS[58][3] = 0;
  const deep = [[12, 0.45], [41, 0.5], [88, 0.4], [121, 0.55]];
  for (const [k, f] of deep) if (ITEMS[k]) {
    const p = PRODUCTS.find(x => x[0] === ITEMS[k][2]);
    if (p[3] >= 60) ITEMS[k][4] = Math.round(p[3] * f * 100) / 100;
  }

  // [ReviewID, ProductID, CustomerID, Rating, ReviewText]
  const TEXTS = { 5: ["Exactly what I needed.", "Great quality for the price.", "Would buy again."],
    4: ["Pretty good overall.", "Solid, a little pricey.", "Works well."], 3: ["It's fine.", "Average.", "Okay for now."],
    2: ["Not great.", "Broke after a month.", "Smaller than expected."], 1: ["Disappointed.", "Would not recommend.", "Returned it."] };
  const REVIEWS = [];
  for (let rid = 1; rid <= 32; rid++) {
    const it = pick(ITEMS);
    const o = ORDERS.find(x => x[0] === it[1]);
    const r = ri(1, 5);
    REVIEWS.push([rid, it[2], o[1], r, pick(TEXTS[r])]);
  }
  REVIEWS[20][3] = 10; REVIEWS[20][4] = "Best purchase ever!!!";   // planted: violates the 1–5 rule

  const setup = `
CREATE TABLE STORES (StoreID INT PRIMARY KEY, StoreName VARCHAR(50), StoreType VARCHAR(30), LaunchDate DATE);
CREATE TABLE CUSTOMERS (CustomerID INT PRIMARY KEY, FirstName VARCHAR(50), LastName VARCHAR(50), SchoolEmail VARCHAR(100), Major VARCHAR(100), GradYear INT);
CREATE TABLE PRODUCTS (ProductID INT PRIMARY KEY, ProductName VARCHAR(100), Category VARCHAR(50), BasePrice DECIMAL(10,2), StoreID INT);
CREATE TABLE ORDERS (OrderID INT PRIMARY KEY, CustomerID INT, StoreID INT, OrderDate DATE);
CREATE TABLE ORDER_ITEMS (OrderItemID INT PRIMARY KEY, OrderID INT, ProductID INT, Quantity INT, SalePrice DECIMAL(10,2));
CREATE TABLE REVIEWS (ReviewID INT PRIMARY KEY, ProductID INT, CustomerID INT, Rating INT, ReviewText VARCHAR(500));
${ins("STORES", STORES)}
${ins("CUSTOMERS", CUSTOMERS)}
${ins("PRODUCTS", PRODUCTS)}
${ins("ORDERS", ORDERS)}
${ins("ORDER_ITEMS", ITEMS)}
${ins("REVIEWS", REVIEWS)}`;

  const tables = [
    { name: "STORES", cols: [["StoreID", "int", "PK"], ["StoreName", "varchar(50)"], ["StoreType", "varchar(30)"], ["LaunchDate", "date"]] },
    { name: "CUSTOMERS", cols: [["CustomerID", "int", "PK"], ["FirstName", "varchar(50)"], ["LastName", "varchar(50)"], ["SchoolEmail", "varchar(100)"], ["Major", "varchar(100)"], ["GradYear", "int"]] },
    { name: "PRODUCTS", cols: [["ProductID", "int", "PK"], ["ProductName", "varchar(100)"], ["Category", "varchar(50)"], ["BasePrice", "decimal(10,2)"], ["StoreID", "int", "FK → STORES (logical)"]] },
    { name: "ORDERS", cols: [["OrderID", "int", "PK"], ["CustomerID", "int", "FK → CUSTOMERS (logical)"], ["StoreID", "int", "FK → STORES (logical)"], ["OrderDate", "date"]] },
    { name: "ORDER_ITEMS", cols: [["OrderItemID", "int", "PK"], ["OrderID", "int", "FK → ORDERS (logical)"], ["ProductID", "int", "FK → PRODUCTS (logical)"], ["Quantity", "int"], ["SalePrice", "decimal(10,2)"]] },
    { name: "REVIEWS", cols: [["ReviewID", "int", "PK"], ["ProductID", "int", "FK → PRODUCTS (logical)"], ["CustomerID", "int", "FK → CUSTOMERS (logical)"], ["Rating", "int"], ["ReviewText", "varchar(500)"]] },
  ];

  /* ---------- exercises ----------
   * { id, ch, level, title, question, requirement, hints: [..], solution, ordered?, note? }
   * `solution` is written in the course's SQL Server style; the lab
   * translates it the same way it translates the student's query. */
  const exercises = [
    /* --- Chapter 9: reading a table --- */
    { id: "sl-stores-all", ch: 9, level: 1, title: "Meet the stores",
      question: "Show every column and every row of the STORES table.",
      requirement: "Confirm how many storefronts exist and which StoreID values are valid.",
      hints: ["Every query needs SELECT (which columns) and FROM (which table).", "<code>*</code> means all columns."],
      solution: "SELECT *\nFROM dbo.STORES" },
    { id: "sl-top5", ch: 9, level: 1, title: "A row limit",
      question: "Return only the first 5 customers by CustomerID: CustomerID, FirstName, LastName and SchoolEmail.",
      requirement: "Preview a sample before looking at the whole table, knowing a sample is not the whole table.",
      hints: ["SQL Server limits rows with <code>TOP (n)</code> right after SELECT.", "Say the order explicitly with ORDER BY CustomerID, or the 'first 5' is not guaranteed."],
      solution: "SELECT TOP (5) CustomerID, FirstName, LastName, SchoolEmail\nFROM dbo.CUSTOMERS\nORDER BY CustomerID", ordered: true },
    { id: "sl-launch-desc", ch: 9, level: 1, title: "Newest store first",
      question: "List StoreName and LaunchDate with the most recently launched store first.",
      requirement: "Sorting must be part of the query, not just a click in the results pane, so it is saved and repeatable.",
      hints: ["Sorting is ORDER BY, and it comes last.", "DESC sorts largest (latest) first."],
      solution: "SELECT StoreName, LaunchDate\nFROM dbo.STORES\nORDER BY LaunchDate DESC", ordered: true },
    { id: "sl-count-orders", ch: 9, level: 1, title: "How big is the table really?",
      question: "How many rows are in ORDERS? Return a single number.",
      requirement: "Know the true size of a table instead of trusting a row-capped preview.",
      hints: ["An aggregate function collapses many rows into one value.", "<code>COUNT(*)</code> counts every row."],
      solution: "SELECT COUNT(*) AS TotalOrders\nFROM dbo.ORDERS" },

    /* --- Chapter 10: filtering with WHERE --- */
    { id: "sl-email", ch: 10, level: 2, title: "Email_Compliance.sql",
      question: "Which customer records use a non-IU email address? Return CustomerID, FirstName, LastName, SchoolEmail, sorted by LastName.",
      requirement: "All customer records must use an @iu.edu email address per student data policy.",
      hints: ["Searching for 'gmail' only finds Gmail. Describe what a VALID address looks like instead and exclude it.", "<code>LIKE '%@iu.edu'</code> matches valid addresses; put NOT in front to get the violators.", "A NULL email is neither LIKE nor NOT LIKE anything, so it will not appear here. That is a separate check."],
      solution: "-- Business question: which customer records use a non-IU email address?\n-- Business requirement: all customer records must use an @iu.edu email address\nSELECT CustomerID, FirstName, LastName, SchoolEmail\nFROM dbo.CUSTOMERS\nWHERE SchoolEmail NOT LIKE '%@iu.edu'\nORDER BY LastName", ordered: true },
    { id: "sl-gmail-only", ch: 10, level: 2, title: "The limit of a narrow search",
      question: "Return the CustomerID and SchoolEmail of customers whose email contains 'gmail'. Then compare the count with the previous exercise.",
      requirement: "Show why a search for one kind of problem does not prove there are no other kinds.",
      hints: ["LIKE with % on both sides finds text anywhere in the value.", "<code>'%gmail%'</code>"],
      solution: "SELECT CustomerID, SchoolEmail\nFROM dbo.CUSTOMERS\nWHERE SchoolEmail LIKE '%gmail%'",
      note: "Fewer rows than Email_Compliance: the Yahoo, Outlook and iCloud addresses do not contain 'gmail'. WHERE returns only what matches the exact condition you wrote." },
    { id: "sl-missing-email", ch: 10, level: 2, title: "Missing values",
      question: "Find customers with no SchoolEmail at all. Return CustomerID, FirstName, LastName.",
      requirement: "Every customer record must have a school email so the store can contact them.",
      hints: ["An empty value is NULL, and NULL is never equal to anything, not even NULL.", "Use <code>IS NULL</code>, not <code>= NULL</code>."],
      solution: "SELECT CustomerID, FirstName, LastName\nFROM dbo.CUSTOMERS\nWHERE SchoolEmail IS NULL" },
    { id: "sl-qty", ch: 10, level: 2, title: "Quantity_Audit.sql",
      question: "Are there order line items with a quantity inconsistent with a standard purchase? Return all columns from ORDER_ITEMS, highest SalePrice first.",
      requirement: "All order line items must reflect a positive quantity representing a completed transaction.",
      hints: ["A valid purchase quantity is at least 1.", "One condition, <code>Quantity &lt; 1</code>, catches both zero and negative values."],
      solution: "SELECT *\nFROM dbo.ORDER_ITEMS\nWHERE Quantity < 1\nORDER BY SalePrice DESC", ordered: true },
    { id: "sl-rating", ch: 10, level: 2, title: "Ratings that break the rule",
      question: "Find reviews whose Rating is outside the 1–5 scale. Return ReviewID, ProductID, Rating.",
      requirement: "Ratings are recorded on a 1 to 5 scale.",
      hints: ["Outside the range means below 1 OR above 5.", "Either <code>Rating &lt; 1 OR Rating &gt; 5</code> or <code>NOT (Rating BETWEEN 1 AND 5)</code>."],
      solution: "SELECT ReviewID, ProductID, Rating\nFROM dbo.REVIEWS\nWHERE NOT (Rating BETWEEN 1 AND 5)" },
    { id: "sl-badstore", ch: 10, level: 2, title: "Products from stores that do not exist",
      question: "The only valid StoreIDs are 1, 2 and 3. Which products point to any other StoreID? Return ProductID, ProductName, StoreID.",
      requirement: "Every product must belong to an existing storefront.",
      hints: ["Exclude the valid values, or test the range.", "<code>WHERE StoreID NOT IN (1, 2, 3)</code> or <code>WHERE StoreID &gt; 3</code> (here IDs are positive)."],
      solution: "SELECT ProductID, ProductName, StoreID\nFROM dbo.PRODUCTS\nWHERE StoreID NOT IN (1, 2, 3)" },
    { id: "sl-future", ch: 10, level: 2, title: "An impossible date",
      question: "Find orders dated after December 31, 2026. Return OrderID, CustomerID, OrderDate.",
      requirement: "An order cannot be dated in the future.",
      hints: ["Dates compare like values: later dates are greater.", "<code>WHERE OrderDate &gt; '2026-12-31'</code>"],
      solution: "SELECT OrderID, CustomerID, OrderDate\nFROM dbo.ORDERS\nWHERE OrderDate > '2026-12-31'" },
    { id: "sl-and", ch: 10, level: 2, title: "Two conditions at once",
      question: "List Dorm Depot (StoreID 3) products with a BasePrice of at least $40. Return ProductName and BasePrice, most expensive first.",
      requirement: "Merchandising wants the higher-priced dorm items for a feature display.",
      hints: ["Both conditions must be true, so join them with AND.", "At least means >=."],
      solution: "SELECT ProductName, BasePrice\nFROM dbo.PRODUCTS\nWHERE StoreID = 3 AND BasePrice >= 40\nORDER BY BasePrice DESC", ordered: true },

    /* --- calculated columns --- */
    { id: "sl-highvalue", ch: 10, level: 3, title: "High_Value_Lines.sql",
      question: "Which order lines are worth more than $200 (Quantity × SalePrice)? Return OrderItemID, OrderID, Quantity, SalePrice and the line total as LineTotal, largest first.",
      requirement: "Larger transactions get a second look before close.",
      hints: ["A calculated column: <code>(Quantity * SalePrice) AS LineTotal</code>.", "WHERE runs before SELECT, so the alias LineTotal does not exist yet there. Repeat the calculation in WHERE.", "ORDER BY runs after SELECT, so there you may use LineTotal."],
      solution: "SELECT OrderItemID, OrderID, Quantity, SalePrice, (Quantity * SalePrice) AS LineTotal\nFROM dbo.ORDER_ITEMS\nWHERE (Quantity * SalePrice) > 200\nORDER BY LineTotal DESC", ordered: true },

    /* --- joins --- */
    { id: "sl-price", ch: 10, level: 3, title: "Price_Audit.sql",
      question: "Which line items sold more than $25 below the catalog BasePrice? Return OrderID, ProductName, BasePrice, SalePrice and (BasePrice − SalePrice) AS PriceDifference, largest difference first.",
      requirement: "Sale prices should not fall more than $25 below catalog BasePrice without authorization.",
      hints: ["SalePrice lives in ORDER_ITEMS and BasePrice in PRODUCTS, so join them on ProductID.", "<code>FROM dbo.ORDER_ITEMS oi INNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID</code>", "Repeat the full calculation in WHERE; use the alias in ORDER BY."],
      solution: "SELECT oi.OrderID, p.ProductName, p.BasePrice, oi.SalePrice, (p.BasePrice - oi.SalePrice) AS PriceDifference\nFROM dbo.ORDER_ITEMS oi\nINNER JOIN dbo.PRODUCTS p\n  ON oi.ProductID = p.ProductID\nWHERE (p.BasePrice - oi.SalePrice) > 25\nORDER BY PriceDifference DESC", ordered: true },
    { id: "sl-orders-stores", ch: 10, level: 3, title: "Orders with their store names",
      question: "List each order's OrderID, OrderDate and StoreName, oldest order first.",
      requirement: "Reports must show the storefront by name, not by a bare ID.",
      hints: ["StoreName is in STORES; ORDERS carries StoreID.", "INNER JOIN STORES s ON o.StoreID = s.StoreID", "Sort by OrderDate, then OrderID so ties have a fixed order."],
      solution: "SELECT o.OrderID, o.OrderDate, s.StoreName\nFROM dbo.ORDERS o\nINNER JOIN dbo.STORES s\n  ON o.StoreID = s.StoreID\nORDER BY o.OrderDate, o.OrderID", ordered: true },
    { id: "sl-unsold", ch: 10, level: 3, title: "Unsold_Inventory.sql",
      question: "Which catalog products have no sales records? Return ProductID, ProductName, BasePrice, StoreID, sorted by StoreID then BasePrice (highest first).",
      requirement: "Every active catalog product should have at least one sales record.",
      hints: ["You need the products that do NOT match, so an INNER JOIN would throw them away.", "PRODUCTS on the left: <code>LEFT JOIN dbo.ORDER_ITEMS oi ON p.ProductID = oi.ProductID</code>", "Keep only the gaps: <code>WHERE oi.OrderID IS NULL</code>."],
      solution: "SELECT p.ProductID, p.ProductName, p.BasePrice, p.StoreID\nFROM dbo.PRODUCTS p\nLEFT JOIN dbo.ORDER_ITEMS oi\n  ON p.ProductID = oi.ProductID\nWHERE oi.OrderID IS NULL\nORDER BY p.StoreID, p.BasePrice DESC", ordered: true,
      note: "Two different problems hide in this list: real products that simply have not sold (a business issue) and products whose StoreID points to no store (a data-integrity issue)." },
    { id: "sl-orphans", ch: 10, level: 3, title: "Orphaned_Orders.sql",
      question: "Which orders have a CustomerID that matches no record in CUSTOMERS? Return OrderID and CustomerID.",
      requirement: "Every order must be traceable to a real customer.",
      hints: ["An INNER JOIN returns only matched orders — the opposite of what you need.", "ORDERS on the left, LEFT JOIN CUSTOMERS, then keep rows where a CUSTOMERS column came back NULL."],
      solution: "SELECT o.OrderID, o.CustomerID\nFROM dbo.ORDERS o\nLEFT JOIN dbo.CUSTOMERS c\n  ON o.CustomerID = c.CustomerID\nWHERE c.CustomerID IS NULL" },
    { id: "sl-reviews-products", ch: 10, level: 3, title: "Reviews with product names",
      question: "Show ReviewID, ProductName and Rating for every review of a Kirkwood Couture product (StoreID 2), highest rating first, then ReviewID.",
      requirement: "The apparel buyer wants to read feedback on their own products only.",
      hints: ["Join REVIEWS to PRODUCTS on ProductID.", "Filter on the product's StoreID with WHERE."],
      solution: "SELECT r.ReviewID, p.ProductName, r.Rating\nFROM dbo.REVIEWS r\nINNER JOIN dbo.PRODUCTS p\n  ON r.ProductID = p.ProductID\nWHERE p.StoreID = 2\nORDER BY r.Rating DESC, r.ReviewID", ordered: true },

    /* --- aggregates and GROUP BY --- */
    { id: "sl-store-count", ch: 10, level: 4, title: "Store_Order_Count.sql",
      question: "How many orders has each storefront taken? Return StoreName and the count as TotalOrders, most orders first.",
      requirement: "Every order must be counted under the storefront that placed it.",
      hints: ["Join ORDERS to STORES, then summarise with COUNT.", "StoreName is not inside an aggregate, so it must appear in GROUP BY.", "ORDER BY TotalOrders DESC"],
      solution: "SELECT s.StoreName, COUNT(o.OrderID) AS TotalOrders\nFROM dbo.ORDERS o\nINNER JOIN dbo.STORES s\n  ON o.StoreID = s.StoreID\nGROUP BY s.StoreName\nORDER BY TotalOrders DESC", ordered: true },
    { id: "sl-products-per-store", ch: 10, level: 4, title: "Products_Per_Store.sql",
      question: "How many products does each store carry? Return StoreName and ProductCount, A→Z by StoreName. Then check: does the total match SELECT COUNT(*) FROM dbo.PRODUCTS?",
      requirement: "The inventory summary must account for every product in the catalog.",
      hints: ["Join PRODUCTS to STORES and COUNT per StoreName.", "Compare your three counts with the table total. The INNER JOIN silently drops products whose store does not exist."],
      solution: "SELECT s.StoreName, COUNT(p.ProductID) AS ProductCount\nFROM dbo.PRODUCTS p\nINNER JOIN dbo.STORES s\n  ON p.StoreID = s.StoreID\nGROUP BY s.StoreName\nORDER BY s.StoreName", ordered: true,
      note: "The three counts add up to fewer than the table total. The missing products have invalid StoreIDs, so the INNER JOIN dropped them without warning. A correct-looking total is not the same as a complete one." },
    { id: "sl-products-left", ch: 10, level: 4, title: "Make the gap visible",
      question: "Redo the product count so products with no matching store still appear, grouped under a NULL StoreName. Return StoreName and ProductCount.",
      requirement: "A summary should show what was excluded, not hide it.",
      hints: ["Keep every product: PRODUCTS on the left of a LEFT JOIN to STORES.", "Products with no matching store come back with StoreName NULL and form their own group."],
      solution: "SELECT s.StoreName, COUNT(p.ProductID) AS ProductCount\nFROM dbo.PRODUCTS p\nLEFT JOIN dbo.STORES s\n  ON p.StoreID = s.StoreID\nGROUP BY s.StoreName" },
    { id: "sl-revenue-all", ch: 10, level: 4, title: "Revenue by store (all records)",
      question: "Total revenue per store as SUM(Quantity × SalePrice). Return StoreName and Revenue, highest first. Use every line item.",
      requirement: "Leadership wants revenue by storefront.",
      hints: ["Revenue needs ORDER_ITEMS (quantity, price) and STORES (name), linked through ORDERS.", "Two joins: ORDER_ITEMS → ORDERS on OrderID, ORDERS → STORES on StoreID.", "SUM(oi.Quantity * oi.SalePrice) AS Revenue, GROUP BY s.StoreName"],
      solution: "SELECT s.StoreName, SUM(oi.Quantity * oi.SalePrice) AS Revenue\nFROM dbo.ORDER_ITEMS oi\nINNER JOIN dbo.ORDERS o ON oi.OrderID = o.OrderID\nINNER JOIN dbo.STORES s ON o.StoreID = s.StoreID\nGROUP BY s.StoreName\nORDER BY Revenue DESC", ordered: true },
    { id: "sl-revenue-clean", ch: 10, level: 4, title: "Revenue you can defend",
      question: "Same report, but leave out line items with a quantity below 1 before totalling. Return StoreName and Revenue, highest first. How much did each store's figure change?",
      requirement: "Revenue must include only completed purchases with a positive quantity, and the report must disclose what was removed.",
      hints: ["Filter first, then total: WHERE runs before GROUP BY.", "Add <code>WHERE oi.Quantity &gt;= 1</code> to the previous query."],
      solution: "SELECT s.StoreName, SUM(oi.Quantity * oi.SalePrice) AS Revenue\nFROM dbo.ORDER_ITEMS oi\nINNER JOIN dbo.ORDERS o ON oi.OrderID = o.OrderID\nINNER JOIN dbo.STORES s ON o.StoreID = s.StoreID\nWHERE oi.Quantity >= 1\nGROUP BY s.StoreName\nORDER BY Revenue DESC", ordered: true,
      note: "Report both numbers: the all-records total and the clean total, and say what was removed (the zero and negative quantities) and how much it changed each store." },
    { id: "sl-avg-category", ch: 10, level: 4, title: "Average sale price by category",
      question: "For Tech Den products (StoreID 1), what is the average SalePrice per Category? Return Category and AvgPrice, A→Z by Category.",
      requirement: "Pricing wants to compare categories using what customers actually paid.",
      hints: ["AVG(oi.SalePrice) per p.Category needs ORDER_ITEMS joined to PRODUCTS.", "Filter StoreID 1 in WHERE, group by Category."],
      solution: "SELECT p.Category, AVG(oi.SalePrice) AS AvgPrice\nFROM dbo.ORDER_ITEMS oi\nINNER JOIN dbo.PRODUCTS p ON oi.ProductID = p.ProductID\nWHERE p.StoreID = 1\nGROUP BY p.Category\nORDER BY p.Category", ordered: true },
    { id: "sl-count-null", ch: 10, level: 4, title: "COUNT(*) vs COUNT(column)",
      question: "In one row, return COUNT(*) AS AllCustomers and COUNT(SchoolEmail) AS WithEmail from CUSTOMERS.",
      requirement: "Know how many customer records lack an email before planning an outreach campaign.",
      hints: ["COUNT(*) counts rows; COUNT(column) skips NULLs in that column.", "Both aggregates can sit in the same SELECT with no GROUP BY."],
      solution: "SELECT COUNT(*) AS AllCustomers, COUNT(SchoolEmail) AS WithEmail\nFROM dbo.CUSTOMERS" },
    { id: "sl-majors", ch: 10, level: 4, title: "Customers per major",
      question: "How many customers are in each Major? Return Major and Customers, largest group first, then Major A→Z.",
      requirement: "Marketing wants to know which majors to target.",
      hints: ["GROUP BY Major, COUNT(*) per group.", "Sort by the count DESC, then by Major to break ties."],
      solution: "SELECT Major, COUNT(*) AS Customers\nFROM dbo.CUSTOMERS\nGROUP BY Major\nORDER BY Customers DESC, Major", ordered: true },
  ];

  const course = STUDY.getCourse("bus-k201");
  if (course) course.sqlLab = {
    title: "SQL Lab",
    intro: "Write real SQL against a practice copy of a three-store retail database like the course's Hoosier Holdings case. It uses the same six tables and has the same kinds of problems planted in it. Your query runs in the browser. <b>Check</b> compares your result with the expected one, so any column alias works. Start every file the way Chapter 10 asks: two comment lines, the business question and the business requirement.",
    setup, tables, exercises,
  };
})();
