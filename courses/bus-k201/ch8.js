/* ============================================================
 * BUS K201 · Chapter 8 · From Process to Data Blueprint:
 * Designing a Trustworthy ERD
 * Business process vs procedure, data events, values / attributes /
 * records / entities / relationships, why flat files break, primary
 * and foreign keys, associative entities, crow's foot notation and
 * reading (and fixing) the Bean & Byte kiosk ERD.
 * Explanations, examples and practice items are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const S = K.S;
  const C = "bus-k201";

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const tbl = (head, rows) => `<table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const r1 = v => Math.round(v * 10) / 10;
  const money = x => "$" + x.toFixed(2);
  const NAMES = ["Chris", "Jordan", "Sam", "Alex", "Taylor", "Morgan", "Riley", "Casey", "Jamie", "Avery", "Drew", "Priya", "Malik", "Elena"];
  const PRODUCTS = ["Vanilla Latte", "Cold Brew", "Blueberry Muffin", "Croissant", "Chai Latte", "Cookie", "Mocha", "Bagel"];

  /* ---------- crow's foot drawing ----------
   * A relationship end is one of four kinds. The mark nearest the entity
   * is the maximum (bar = one, crow's foot = many); the mark further out
   * is the minimum (bar = one, open circle = zero). */
  const KIND = {
    one: { min: "one", max: "one", label: "exactly one", marks: "two single bars (bar + bar)" },
    zeroOne: { min: "zero", max: "one", label: "zero or one", marks: "an open circle and a single bar" },
    oneMany: { min: "one", max: "many", label: "one or many", marks: "a single bar and a crow's foot" },
    zeroMany: { min: "zero", max: "many", label: "zero or many", marks: "an open circle and a crow's foot" },
  };
  const KINDS = ["one", "zeroOne", "oneMany", "zeroMany"];
  const LABELS = KINDS.map(k => KIND[k].label);
  const MARKS = KINDS.map(k => KIND[k].marks);
  const kindOf = (min, max) => KINDS.find(k => KIND[k].min === min && KIND[k].max === max);

  const ln = (a, b) => `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="currentColor" stroke-width="1.6"/>`;
  const at = (P, u, o) => [P[0] + u[0] * o, P[1] + u[1] * o];
  /* marks at entity-border point P; u = unit vector pointing away from the entity */
  function endMarks(P, u, kind) {
    const n = [-u[1], u[0]];
    const k = KIND[kind];
    let s = "";
    const bar = o => { const c = at(P, u, o); return ln([c[0] + n[0] * 9, c[1] + n[1] * 9], [c[0] - n[0] * 9, c[1] - n[1] * 9]); };
    if (k.max === "one") s += bar(8);
    else { const t = at(P, u, 15); s += ln(t, [P[0] + n[0] * 9, P[1] + n[1] * 9]) + ln(t, [P[0] - n[0] * 9, P[1] - n[1] * 9]); }
    if (k.min === "one") s += bar(22);
    else { const c = at(P, u, 24.5); s += `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>`; }
    return s;
  }
  function unit(a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  /* a connector along points pts; sk = kind at pts[0], ek = kind at the last point (null = plain end) */
  function linkSVG(pts, sk, ek) {
    const p = pts.map(x => x.slice());
    const n = p.length;
    let s = "";
    const u0 = unit(p[0], p[1]), u1 = unit(p[n - 1], p[n - 2]);
    if (sk) {
      s += endMarks(p[0], u0, sk);
      if (KIND[sk].min === "zero") { s += ln(p[0], at(p[0], u0, 19.5)); p[0] = at(p[0], u0, 29.5); }
    }
    if (ek) {
      s += endMarks(p[n - 1], u1, ek);
      if (KIND[ek].min === "zero") { s += ln(p[n - 1], at(p[n - 1], u1, 19.5)); p[n - 1] = at(p[n - 1], u1, 29.5); }
    }
    s += `<polyline points="${p.map(q => r1(q[0]) + "," + r1(q[1])).join(" ")}" fill="none" stroke="currentColor" stroke-width="1.6"/>`;
    return s;
  }
  const BW = 130, BH = 44;
  function box(x, y, name, w) {
    const W = w || BW;
    return `<rect x="${x}" y="${y}" width="${W}" height="${BH}" rx="6" fill="none" stroke="currentColor" stroke-width="1.6"/>` +
      `<text x="${x + W / 2}" y="${y + BH / 2 + 5}" text-anchor="middle" font-size="14" fill="currentColor">${name}</text>`;
  }
  const svgWrap = (w, h, inner, label) => `<svg width="${w}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || "ERD diagram"}" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  /* two entities joined by one relationship; ka = kind next to A, kb = kind next to B */
  function relSVG(A, B, ka, kb, verb) {
    const y = 14;
    let s = box(10, y, A) + box(330, y, B);
    s += linkSVG([[140, y + 22], [330, y + 22]], ka, kb);
    if (verb) s += `<text x="235" y="${y + 10}" text-anchor="middle" font-size="12" fill="currentColor">${verb}</text>`;
    return svgWrap(470, 72, s, `${A} to ${B} relationship`);
  }
  /* several relationships stacked, each row labelled with a letter */
  function relRows(rows) {
    let s = "";
    rows.forEach((r, i) => {
      const y = 10 + i * 64;
      s += `<text x="8" y="${y + 27}" font-size="14" font-weight="bold" fill="currentColor">${String.fromCharCode(65 + i)}</text>`;
      s += box(30, y, r.A) + box(350, y, r.B);
      s += linkSVG([[160, y + 22], [350, y + 22]], r.a, r.b);
    });
    return svgWrap(490, 20 + rows.length * 64, s, "relationships");
  }
  /* a single end (only one side marked) */
  function loneEnd(entity, kind) {
    const s = box(330, 14, entity) + linkSVG([[60, 36], [330, 36]], null, kind) +
      `<text x="30" y="40" font-size="13" text-anchor="middle" fill="currentColor">…</text>`;
    return svgWrap(470, 72, s, `line end at ${entity}`);
  }

  /* ---------- the Bean & Byte ERD (simplified first version) ---------- */
  const BB_BOX = {
    Store: [20, 20], Employee: [250, 20],
    Order: [250, 150], Payment: [480, 150],
    Customer: [20, 280], OrderItem: [250, 280], Product: [480, 280],
  };
  /* each link: [entity at start, kind there, entity at end, kind there, points] */
  const BB_LINKS = [
    { A: "Store", ka: "one", B: "Employee", kb: "oneMany", pts: [[150, 42], [250, 42]], fk: "Employee", key: "StoreID" },
    { A: "Store", ka: "one", B: "Order", kb: "zeroMany", pts: [[85, 64], [85, 162], [250, 162]], fk: "Order", key: "StoreID" },
    { A: "Customer", ka: "zeroOne", B: "Order", kb: "zeroMany", pts: [[85, 280], [85, 182], [250, 182]], fk: "Order", key: "CustomerID" },
    { A: "Employee", ka: "one", B: "Order", kb: "zeroMany", pts: [[315, 64], [315, 150]], fk: "Order", key: "EmployeeID" },
    { A: "Order", ka: "one", B: "Payment", kb: "one", pts: [[380, 172], [480, 172]], fk: "Payment", key: "OrderID" },
    { A: "Order", ka: "one", B: "OrderItem", kb: "oneMany", pts: [[315, 194], [315, 280]], fk: "OrderItem", key: "OrderID" },
    { A: "Product", ka: "one", B: "OrderItem", kb: "zeroMany", pts: [[480, 302], [380, 302]], fk: "OrderItem", key: "ProductID" },
  ];
  function bbERD() {
    let s = "";
    for (const [n, [x, y]] of Object.entries(BB_BOX)) s += box(x, y, n);
    for (const l of BB_LINKS) s += linkSVG(l.pts, l.ka, l.kb);
    return svgWrap(630, 344, s, "Bean and Byte ERD");
  }
  const BB_TABLES = [
    ["Orders", "<b>OrderID</b> (PK), OrderDate, OrderTime, PickupName, OrderChannel, OrderStatus, <i>StoreID</i> (FK), <i>EmployeeID</i> (FK), <i>CustomerID</i> (FK, optional)"],
    ["OrderItems", "<b>OrderItemID</b> (PK), <i>OrderID</i> (FK), <i>ProductID</i> (FK), Quantity, PriceAtSale, LineTotal (calculated)"],
    ["Products", "<b>ProductID</b> (PK), ProductName, ProductCategory, StandardPrice"],
    ["Payments", "<b>PaymentID</b> (PK), <i>OrderID</i> (FK), PaymentMethod, PaymentAmount"],
    ["Stores", "<b>StoreID</b> (PK), StoreName, StoreLocation"],
    ["Employees", "<b>EmployeeID</b> (PK), EmployeeName, Role, <i>StoreID</i> (FK)"],
    ["Customers", "<b>CustomerID</b> (PK), CustomerName, Email, Phone"],
  ];
  const ENTS = ["Order", "OrderItem", "Product", "Payment", "Store", "Employee", "Customer"];
  const plural = (name, kind) => KIND[kind].max === "many" ? name + "s" : name;
  /* reading: the mark next to X says how many X go with ONE of the other entity */
  const readEnd = (other, me, kind) => `Each <b>${other}</b> is linked to <b>${KIND[kind].label}</b> ${plural(me, kind)}`;

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Process vs. procedure: what level an ERD works at",
      lo: "Distinguish a business process from a business procedure and decide which level an ERD captures.",
      html: `<p>Every business runs on two levels of activity. A <b>business process</b> is a chain of work that delivers a <em>meaningful business result</em>: a completed order, a paid invoice, a returned library book. A <b>business procedure</b> is the step-by-step "how-to" detail for doing one task inside that process: how to steam milk, which button to tap, how to fold a towel.</p>
<p>Data design lives at the <b>process</b> level. An entity relationship diagram (ERD) records what the business must <em>remember</em> once the result has happened (who ordered, what, at what price, paid how, made by whom, at which store). It does not record how hard the barista tamped the espresso. Climbing from procedure to process to structure looks like this at Bean &amp; Byte's kiosks:</p>
${tbl(["Procedure detail", "Process step it belongs to", "What the data design keeps"], [
        ["Tap the kiosk screen", "Customer starts an order", "Order"],
        ["Choose a vanilla latte", "Customer selects products", "Product, OrderItem"],
        ["Tap a credit card", "Payment is processed", "Payment"],
        ["Barista makes the drink", "Employee fulfills the order", "Employee, Order (OrderStatus)"],
        ["Call out the name", "Customer picks up the order", "Order (PickupName)"],
      ])}
<p>An ERD is a <b>design tool</b>: you sketch and test the structure <em>before</em> a database, a query, a dashboard or an AI analysis starts depending on it. That matters because a system can look perfectly functional at the counter (orders get made, cards get charged) while its data is <b>structurally</b> unreliable underneath. Bean &amp; Byte's kiosks worked every day, yet a report built from the end-of-shift Excel export named the wrong top seller.</p>
<div class="keyidea"><b>Key idea.</b> Ask "what result did this step produce, and what must we remember about it?" The answer is process-level and belongs in the data design. "How exactly was it done?" is procedure-level and usually does not.</div>
<div class="example"><b>Example.</b> At a bike repair shop, "loosen the brake cable with a 5 mm hex key" is procedure. "Mechanic completes a repair job" is process, and it tells the designer to remember the RepairJob, which Mechanic did it, the parts used and the status.</div>
<div class="trap"><b>Common trap.</b> Thinking that a more detailed ERD is a better one. Packing physical steps (milk temperature, number of screen taps) into the data model adds clutter but answers no management question. Also: "the spreadsheet said so" is not a defense. The manager who signs off on a number owns it, so they are accountable for whether the structure behind it can be trusted.</div>`,
      gens: ["k201-ch8-procedure"],
    },
    {
      title: "Data events: what the system must remember after each step",
      lo: "Identify the data events in a process and translate them into entities, attributes and relationships.",
      html: `<p>A <b>data event</b> is any moment in a process that makes the system <em>create or update</em> saved data. The test for each step is one question: <b>"After this step, what must the system remember?"</b> If the answer is "nothing", the step is procedure detail. If it is "the payment method and amount", you have found a data event.</p>
${tbl(["Kiosk step", "What must be remembered", "Entity", "Attributes"], [
        ["Customer enters a pickup name", "The pickup name and when the order started", "Order", "PickupName, OrderTime"],
        ["Customer selects products", "Which products, how many, at what price", "Product, OrderItem", "ProductName, Quantity, PriceAtSale"],
        ["Customer pays at the kiosk", "How the order was paid", "Payment", "PaymentMethod, PaymentAmount"],
        ["System sends the order to the queue", "The order is now waiting", "Order", "OrderStatus"],
        ["Employee prepares the order", "Who fulfilled it; status changes", "Employee, Order", "EmployeeID, OrderStatus"],
        ["Customer picks up", "The order is complete", "Order", "OrderStatus"],
      ])}
<p>The chapter's <b>translation pattern</b> turns a process into a structure, one link at a time:</p>
<ol>
<li><b>Process step</b>: what happens.</li>
<li><b>Data event</b>: the occurrence that makes the system create or update saved data.</li>
<li><b>Business noun</b>: a person, place, thing or event that may become an <b>entity</b>.</li>
<li><b>Attribute</b>: a detail that describes an entity.</li>
<li><b>Relationship</b>: the business rule that says how entities connect.</li>
<li><b>Relationship label</b>: 1:1, 1:M or M:N.</li>
<li><b>Structure check</b>: a question that tests whether the design supports a real need (a report, an audit, a decision).</li>
</ol>
<div class="keyidea"><b>Key idea.</b> Processes create data events; data events tell you which entities and attributes the design needs. Nouns become entities, describing details become attributes, and business rules become relationships.</div>
<div class="example"><b>Example.</b> A library: "member borrows a book" (process step) → a Loan record is created (data event) → Member, Book, Loan (nouns) → DueDate (attribute) → "a member can have many loans; each loan is for one member" (relationship, 1:M) → "Can we list every overdue book and who has it?" (structure check).</div>
<div class="trap"><b>Common trap.</b> Skipping the structure check. A design can contain every noun in the story and still fail the manager's question. Always finish by asking "can this answer the report we actually need?"</div>`,
      gens: ["k201-ch8-events"],
    },
    {
      title: "Values, attributes, records, entities, relationships and metadata",
      lo: "Translate business nouns into entities and descriptive details into attributes; tell a value from the structure that holds it.",
      html: `<p>When you look at a kiosk export you see <em>values</em>. Good design asks what structure each value belongs to.</p>
${ul([
        "<b>Value</b>: one piece of data in one cell, such as \"Vanilla Latte\", \"Credit Card\", \"2\" or \"Chris\".",
        "<b>Attribute (field)</b>: the named detail that holds a kind of value, such as ProductName, PaymentMethod, Quantity or PickupName.",
        "<b>Record</b>: one saved instance, such as one order, one product or one payment (a row).",
        "<b>Entity</b>: the person, place, thing or event the business keeps records about, such as Order, Product, Payment, Store, Employee or Customer.",
        "<b>Relationship</b>: the business rule that connects entities, such as \"an order is placed at one store\".",
        "<b>Metadata</b>: data <em>about</em> data, describing its meaning and organization: field names, entity names, definitions and relationships.",
      ])}
<p>The chain to practise is <b>value → field → entity → linking row</b>: "Vanilla Latte" is a value of ProductName, which describes the Product entity, which reaches an order through an OrderItem row. "Kiosk" is a value of OrderChannel on an Order. "Credit Card" is a value of PaymentMethod in Payment. "2" is a Quantity on an OrderItem.</p>
<div class="keyidea"><b>Key idea.</b> Values change from row to row; the structure (attributes, entities, relationships) stays put. Design the structure, then let the values flow into it.</div>
<div class="example"><b>Example.</b> At a gym, "Spin – 6 pm" is a value of ClassName on a Class entity; "Morgan" might be a value of MemberName on Member; "3" might be a value of VisitsThisWeek, which is really a count you could calculate from Visit records rather than store.</div>
<div class="trap"><b>Common trap.</b> Treating every name as an entity. "Chris" typed at the kiosk is a <b>PickupName attribute on an Order</b>, not automatically a Customer. It only becomes customer identity when the business creates a Customer entity with its own CustomerID.</div>`,
      gens: ["k201-ch8-structure"],
    },
    {
      title: "Why flat files fail as activity grows",
      lo: "Explain why flat-file lists become unreliable as activity grows: repeated names, lost detail and unstable identity.",
      html: `<p>A <b>flat file</b> puts everything in one list: orders, products, payments, pickup names, employees and stores side by side in each row. Bean &amp; Byte's kiosk export to Excel at the end of each shift is a flat file. For a tiny operation with simple questions that can be enough. As orders, products, stores and customers start to interconnect, three structural failures appear:</p>
${tbl(["OrderID", "PickupName", "Channel", "StoreName", "Product1", "Product2", "Product3"], [
        ["O2001", "Chris", "Kiosk", "Bloomington", "Vanilla Latte", "Blueberry Muffin", ""],
        ["O2002", "Jordan", "Kiosk", "Bloomington Store", "Cold Brew", "", ""],
        ["O2003", "Chris", "Kiosk", "B-Town", "Vanilla Latte", "Croissant", "Cookie"],
        ["O2004", "Team Lunch", "Kiosk", "Bloomington", "Vanilla Latte", "Cold Brew", "Blueberry Muffin"],
      ])}
${ul([
        "<b>Repeated names</b>: the same store or employee is retyped on every row, so it drifts (Bloomington / Bloomington Store / B-Town; Sam A. / Sam Alvarez). A sales-by-store report now shows three \"stores\" where there is one.",
        "<b>Lost detail</b>: fixed columns cap what fits. O2004 was a catering order with 10 line items; Product1–Product3 hold three and the other seven disappear. The payment total still reconciles, so the money looks right, but units and product mix are understated. A single Price column also cannot keep both today's price and the price charged last spring.",
        "<b>Unstable identity</b>: nothing reliably identifies a thing. Is the Chris on O2001 the Chris on O2003? Two Jordans in one rush cannot be told apart.",
      ])}
<div class="keyidea"><b>Key idea.</b> These problems are <b>structural, not cosmetic</b>. Renaming columns, adding Product4–Product10 or asking staff to type carefully leaves the structure the same. The fix is separate entities (Store, Product, Customer) joined by keys, plus a linking entity (OrderItem) for the many products on one order.</div>
<div class="example"><b>Example.</b> A campus print shop logs jobs in one sheet with columns Student, Dept, Printer1, Printer2. When a job uses three printers, one disappears; "Kelley", "KSB" and "Business School" split the department totals three ways.</div>
<div class="trap"><b>Common trap.</b> "The totals reconcile, so the data is fine." Revenue can balance to the penny while units sold, top sellers and customer counts are badly wrong. Matching money only proves the money column is complete.</div>`,
      gens: ["k201-ch8-flatfile"],
    },
    {
      title: "Keys and the associative entity: PK, FK, OrderItem and PriceAtSale",
      lo: "Use primary keys, foreign keys and an associative entity to connect entities so the design supports managerial questions.",
      html: `<p>A <b>primary key (PK)</b> uniquely identifies one record in an entity: OrderID, ProductID, StoreID. A <b>foreign key (FK)</b> is a copy of another entity's primary key, stored so the two can be connected: Orders stores StoreID to say which store took the order.</p>
<p><b>Where does the FK go?</b> On the <b>"many" side</b>. One store has many orders, but each order has one store, so each order row has room for exactly one StoreID. The store row could never hold "all its OrderIDs" in one cell. In a 1:1 relationship the model picks a side; in Bean &amp; Byte's simplified model, Payment stores OrderID.</p>
<p><b>Many-to-many needs a bridge.</b> An order contains many products and a product appears on many orders (M:N). Relational tables cannot hold that directly, so an <b>associative entity</b> sits between them: <b>OrderItem</b>, one row per product on an order. It reads as "this order included this product, in this quantity, at this price", and it carries OrderID and ProductID as foreign keys. That is also why the ERD has no direct line between Order and Product.</p>
<p><b>Which price?</b> <b>StandardPrice</b> lives in Products: the price today. <b>PriceAtSale</b> lives in OrderItems: what was actually charged at that moment. If a vanilla latte sold for $5.50 last spring and lists at $5.75 now, storing only one of them loses either the history or the current price. <b>LineTotal</b> = Quantity × PriceAtSale is a <b>calculated</b> value: you may store it for convenience, but then it must be kept consistent or it will conflict with its inputs.</p>
${tbl(["Table", "Columns (PK in bold, FK in italics)"], BB_TABLES)}
<div class="keyidea"><b>Key idea.</b> PK = "which one exactly?"; FK = "which one over there?", stored on the many side. M:N becomes two 1:M relationships through an associative entity, and that entity is the natural home for details of the pairing (Quantity, PriceAtSale).</div>
<div class="example"><b>Example.</b> Students and courses are M:N. Enrollment is the associative entity: each row holds StudentID and CourseID (both FKs) plus details that belong to the pairing, like Grade and Term, which describe neither the student alone nor the course alone.</div>
<div class="trap"><b>Common trap.</b> Putting PriceAtSale in Products (or StandardPrice in OrderItems). Price history belongs to the moment of sale, so it lives on the line item; the current list price belongs to the product.</div>`,
      gens: ["k201-ch8-keys", "k201-ch8-beanbyte"],
    },
    {
      title: "Crow's foot notation: minimum and maximum cardinality",
      lo: "Read crow's foot symbols and turn business rules into relationship labels (1:1, 1:M, M:N).",
      html: `<p>Each end of a relationship line carries two marks:</p>
${ul([
        "<b>Crow's foot</b> (the three-pronged branch) = <b>many</b>; <b>single bar</b> = <b>one</b>. These answer the <b>maximum cardinality</b>: <em>at most, one or many?</em> This mark sits right against the entity.",
        "<b>Open circle</b> = <b>zero allowed</b> (optional); a bar in the outer position = at least one (mandatory). These answer the <b>minimum cardinality</b>: <em>is zero allowed?</em>",
      ])}
<p>The four combinations:</p>
${tbl(["Line end", "Marks", "Reads as"], KINDS.map(k => [svgWrap(150, 40, linkSVG([[10, 20], [140, 20]], null, k) + `<line x1="140" y1="4" x2="140" y2="36" stroke="currentColor" stroke-width="2.4"/>`, KIND[k].label), KIND[k].marks, `<b>${KIND[k].label}</b>`]))}
<p><b>How to read it:</b> the marks next to an entity tell how many of <em>that</em> entity relate to one instance on the other side. In the diagram below, the marks beside Payment say each order has exactly one payment; the marks beside Order say each payment belongs to exactly one order.</p>
${relSVG("Order", "Payment", "one", "one", "is paid by")}
<p>Turning rules into labels: "each order has one payment" → <b>1:1</b>; "a store takes many orders, each order is at one store" → <b>1:M</b>; "an order has many products and a product is on many orders" → <b>M:N</b>.</p>
<div class="keyidea"><b>Key idea.</b> Inner mark = maximum (bar or crow's foot). Outer mark = minimum (circle or bar). Read each end from the <em>other</em> entity's point of view.</div>
<div class="example"><b>Example.</b> Bean &amp; Byte lets guests order without an account, so the Customer end of Customer–Order has an <b>open circle + bar</b>: an order carries zero or one customer. A guest order stores only a PickupName and leaves CustomerID empty.</div>
<div class="trap"><b>Common trap.</b> Reading the marks at the wrong end. The crow's foot beside Order on the Store–Order line means a store has many <em>orders</em>, not that an order has many stores. And the circle is about the minimum only: a circle with a crow's foot still allows many.</div>`,
      gens: ["k201-ch8-crowsfoot"],
    },
    {
      title: "Reading the Bean & Byte ERD and fixing the micro-disruptions",
      lo: "Read, evaluate and revise an introductory ERD so it supports managerial questions.",
      html: `<p>Bean &amp; Byte's first ERD keeps seven entities: Order, OrderItem, Product, Payment, Employee, Store and Customer. It deliberately leaves out Supplier, Inventory, Customization, LoyaltyAccount, LoyaltyTransaction, Reward, DeliveryPartner and a separate Channel entity; a later loyalty program (ByteRewards) adds customer identity, rewards and channels.</p>
${bbERD()}
${tbl(["Relationship", "Label", "FK stored in"], [
        ["Store – Order", "1:M", "Order (StoreID)"],
        ["Store – Employee", "1:M", "Employee (StoreID)"],
        ["Employee – Order", "1:M", "Order (EmployeeID)"],
        ["Order – Payment", "1:1 (simplified)", "Payment (OrderID)"],
        ["Order – OrderItem", "1:M", "OrderItem (OrderID)"],
        ["Product – OrderItem", "1:M", "OrderItem (ProductID)"],
        ["Customer – Order", "1:M, optional on the Customer side", "Order (CustomerID, optional)"],
        ["Order – Product", "M:N, resolved by OrderItem", "no direct line"],
      ])}
<p><b>Three micro-disruptions</b> test whether the structure holds:</p>
${ul([
        "<b>PickupName vs. customer identity.</b> Two customers named Jordan order during the same rush; one later calls with a complaint and the manager cannot tell which order was theirs. Fix: keep PickupName on Order (it is for calling out the drink) and add a Customer entity with CustomerID so repeat customers can be recognised. An attribute is not an identity.",
        "<b>Multiple products.</b> A 10-item catering order loses seven items in a three-column export. Fix: the OrderItem associative entity, one row per product on an order. Adding more ProductN columns only moves the ceiling.",
        "<b>Store location.</b> Free-text store names split one store's sales into several groups. Fix: a Store entity with one controlled record per store, and StoreID as an FK on Order.",
      ])}
<div class="keyidea"><b>Key idea.</b> Evaluate an ERD by asking managerial questions of it: units by product and store, orders per employee, repeat customers. If a question cannot be answered or would give a wrong number, revise the structure. Patching the report will not fix it.</div>
<div class="example"><b>Example.</b> "How many cold brews did the Bloomington store sell last week?" walks Store → Order (StoreID, OrderDate) → OrderItem (Quantity) → Product (ProductName). Every hop is a PK–FK pair, so the count is trustworthy. In the flat file the same question trips over store spellings and truncated product columns.</div>
<div class="trap"><b>Common trap.</b> Making Customer mandatory on every order. That would force guests to register before buying coffee, or tempt staff to invent fake customers. The open circle is the right model for a guest-friendly kiosk. In Chapter 9 these entities become tables, attributes become columns, and the PK/FK links become rules the database may or may not enforce.</div>`,
      gens: ["k201-ch8-beanbyte", "k201-ch8-keys"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "k201-ch8-c-process", tag: "Definition", front: "What is a <em>business process</em>?", back: "A chain of activity that delivers a <b>meaningful business result</b>, such as a completed kiosk order or a filled prescription." },
    { id: "k201-ch8-c-procedure", tag: "Definition", front: "What is a <em>business procedure</em>?", back: "The step-by-step detail of how one task is done, such as steaming milk or snapping a lid on a cup." },
    { id: "k201-ch8-c-erdlevel", tag: "Distinction", front: "Which level does an ERD capture: process or procedure? Why?", back: "<b>Process.</b> The ERD records what the business must remember about the result (order, products, payment, employee, store), not the physical steps, which answer no reporting question." },
    { id: "k201-ch8-c-erdtool", tag: "Principle", front: "Why draw an ERD before building a database or dashboard?", back: "It is a design tool for <b>testing the structure</b> before queries, reports, dashboards and AI analysis come to depend on it. Fixing a diagram is cheap; fixing a live system is not." },
    { id: "k201-ch8-c-structural", tag: "Principle", front: "How can a system be \"operationally functional but structurally unreliable\"?", back: "Day to day it works (orders made, cards charged), but the way the data is organised cannot support accurate reporting. Bean &amp; Byte's kiosks ran fine while the flat-file export named the wrong top seller." },
    { id: "k201-ch8-c-accountable", tag: "Principle", front: "Is \"the spreadsheet said so\" a defense for a wrong report?", back: "<b>No.</b> Whoever signs off on a number owns it. Managers are accountable for whether the data structure supports accurate reporting, auditing and decisions." },
    { id: "k201-ch8-c-dataevent", tag: "Definition", front: "What is a <em>data event</em>, and what question finds one?", back: "An occurrence that makes the system <b>create or update saved data</b>. Ask of each step: \"After this, what must the system remember?\"" },
    { id: "k201-ch8-c-pattern", tag: "List", front: "List the seven links of the translation pattern from process to structure.", back: "Process step → data event → business noun (entity) → attribute → relationship → relationship label (1:1, 1:M, M:N) → structure check." },
    { id: "k201-ch8-c-structurecheck", tag: "Definition", front: "What is a <em>structure check</em>? Give one.", back: "A question that tests whether the design supports a business need. E.g. \"Can we report units sold by product and store for last month?\"" },
    { id: "k201-ch8-c-record", tag: "Definition", front: "What is a <em>record</em>?", back: "One saved instance of an entity: one order, one product, one payment (a row)." },
    { id: "k201-ch8-c-metadata", tag: "Definition", front: "What is <em>metadata</em>? Example?", back: "Data that describes the meaning and organization of data: field names, entity names, definitions, relationships. E.g. a data dictionary saying PriceAtSale is the price charged at the moment of sale." },
    { id: "k201-ch8-c-valuechain", tag: "Application", front: "Trace the value \"Vanilla Latte\" to the structure that holds it.", back: "Value \"Vanilla Latte\" → field <b>ProductName</b> → entity <b>Product</b> → linked to an order through an <b>OrderItem</b> row." },
    { id: "k201-ch8-c-chris", tag: "Misconception", front: "\"Chris\" appears as a pickup name on two orders. Is Chris a Customer entity?", back: "<b>No.</b> \"Chris\" is a value of the <b>PickupName attribute on Order</b>. It does not prove the two orders came from the same person. Identity needs a Customer entity with a CustomerID." },
    { id: "k201-ch8-c-entityattr", tag: "Distinction", front: "Entity vs. attribute: what's the difference?", back: "An <b>entity</b> is a person, place, thing or event the business keeps records about (Store). An <b>attribute</b> is a detail describing it (StoreName, StoreLocation)." },
    { id: "k201-ch8-c-flatfile", tag: "Definition", front: "What is a flat file, and when is it enough?", back: "One list holding everything in each row. It can be enough when the operation is small and the questions are simple; it fails once orders, products, stores and customers interconnect." },
    { id: "k201-ch8-c-threefail", tag: "List", front: "Name the three ways flat files fail as activity grows.", back: "1) <b>Repeated names</b> (the same store or employee retyped and drifting); 2) <b>lost detail</b> (fixed columns cap items, history overwritten); 3) <b>unstable identity</b> (no reliable way to tell who or what a row refers to)." },
    { id: "k201-ch8-c-reconcile", tag: "Misconception", front: "The catering order's payment total matches the bank. Is the product report right?", back: "<b>Not necessarily.</b> The money reconciles, but if only 3 of 10 line items fit in the export, units sold and product mix are understated." },
    { id: "k201-ch8-c-cosmetic", tag: "Principle", front: "Why don't renaming columns or adding Product4–Product10 fix a flat file?", back: "Because the problems are <b>structural</b>. More columns just move the cap; renaming changes labels, not identity or repetition. The fix is separate entities linked by keys." },
    { id: "k201-ch8-c-pk", tag: "Definition", front: "What is a <em>primary key</em>?", back: "An attribute that <b>uniquely identifies one record</b> in an entity, e.g. OrderID in Orders." },
    { id: "k201-ch8-c-fk", tag: "Definition", front: "What is a <em>foreign key</em>?", back: "An attribute in one entity that holds <b>another entity's primary key</b> so the two connect, e.g. StoreID in Orders." },
    { id: "k201-ch8-c-fkside", tag: "Principle", front: "In a 1:M relationship, which side stores the foreign key? Why?", back: "The <b>many</b> side. Each order has one store, so an order row can hold one StoreID; a store row could not hold all of its orders' IDs in one cell." },
    { id: "k201-ch8-c-assoc", tag: "Definition", front: "What is an <em>associative entity</em>? Bean &amp; Byte example?", back: "An entity that resolves a <b>many-to-many</b> relationship. <b>OrderItem</b> sits between Order and Product: \"this order included this product, in this quantity, at this price.\"" },
    { id: "k201-ch8-c-price", tag: "Distinction", front: "PriceAtSale vs. StandardPrice: where does each live, and why keep both?", back: "<b>StandardPrice</b> in Products = the current list price. <b>PriceAtSale</b> in OrderItems = what was charged at that moment. Keeping one loses either the history or today's price." },
    { id: "k201-ch8-c-linetotal", tag: "Application", front: "Is LineTotal stored data or calculated? Any risk?", back: "<b>Calculated</b>: Quantity × PriceAtSale. It may be stored for convenience, but then it must be kept consistent or it can conflict with its inputs." },
    { id: "k201-ch8-c-crow", tag: "Definition", front: "What do the bar, crow's foot and open circle mean?", back: "<b>Bar</b> = one; <b>crow's foot</b> = many; <b>open circle</b> = zero allowed (optional)." },
    { id: "k201-ch8-c-minmax", tag: "Distinction", front: "Minimum vs. maximum cardinality: which marks answer which?", back: "<b>Maximum</b> (at most one or many?) is the inner mark: bar or crow's foot. <b>Minimum</b> (is zero allowed?) is the outer mark: circle or bar." },
    { id: "k201-ch8-c-four", tag: "List", front: "Read the four line-end combinations.", back: "Bar + bar = <b>exactly one</b>; circle + bar = <b>zero or one</b>; bar + crow's foot = <b>one or many</b>; circle + crow's foot = <b>zero or many</b>." },
    { id: "k201-ch8-c-guest", tag: "Application", front: "Why is there an open circle at the Customer end of Customer–Order?", back: "Guest kiosk orders have no registered customer. An order carries <b>zero or one</b> customer, so CustomerID on Order is an optional FK; guests have only a PickupName." },
    { id: "k201-ch8-c-noline", tag: "Application", front: "Why is there no line directly between Order and Product?", back: "Their relationship is <b>M:N</b>, resolved through <b>OrderItem</b>: Order 1:M OrderItem and Product 1:M OrderItem." },
    { id: "k201-ch8-c-scope", tag: "List", front: "Which entities are in Bean &amp; Byte's first ERD, and what's left out?", back: "In: Order, OrderItem, Product, Payment, Employee, Store, Customer. Out for now: Supplier, Inventory, Customization, LoyaltyAccount, LoyaltyTransaction, Reward, DeliveryPartner, a separate Channel." },
    { id: "k201-ch8-c-jordans", tag: "Application", front: "Two Jordans order in one rush; one calls to complain. What design change lets the manager find the right order?", back: "Keep PickupName on Order for calling out drinks, and add a <b>Customer</b> entity whose <b>CustomerID</b> is stored (optionally) on Order. Attribute ≠ identity." },
    { id: "k201-ch8-c-storefix", tag: "Application", front: "\"Bloomington\", \"Bloomington Store\" and \"B-Town\" split sales. Fix?", back: "A <b>Store</b> entity with one controlled record per store; Order stores <b>StoreID</b> as a foreign key instead of free-text names." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "Physical how-to detail: tap, steam, pour, fold, scan, wipe", think: "Business procedure", why: "Step-level detail; the ERD records the result, not the motions." },
    { when: "A completed result: order placed, job finished, book lent", think: "Business process → data event", why: "Something the business must remember afterwards." },
    { when: "\"After this step, what does the system need to know?\"", think: "Data event", why: "If something must be created or updated, it is a data event." },
    { when: "A person, place, thing or event the business tracks many of", think: "Entity", why: "Business nouns become entities." },
    { when: "A describing detail (name, price, method, time, status)", think: "Attribute", why: "It describes an entity rather than standing alone." },
    { when: "A single typed name like \"Chris\" or \"Team Lunch\"", think: "PickupName value, not identity", why: "Without a CustomerID nothing proves who it is." },
    { when: "Same place spelled several ways; totals split into groups", think: "Repeated names → Store entity + StoreID FK", why: "One controlled record per store." },
    { when: "Product1, Product2, Product3 columns; \"items cut off\"", think: "Lost detail → associative entity (OrderItem)", why: "One row per product on an order, no ceiling." },
    { when: "\"Many X per Y and many Y per X\"", think: "M:N → associative entity", why: "Tables need a bridge holding both FKs." },
    { when: "\"Each Y belongs to one X; an X has many Y\"", think: "1:M → FK on the Y (many) side", why: "The many side has room for one parent ID." },
    { when: "Price changed but old sales must stay accurate", think: "PriceAtSale (OrderItem) vs StandardPrice (Product)", why: "History belongs to the moment of sale." },
    { when: "Quantity × price, totals, counts", think: "Calculated value (LineTotal)", why: "Compute it, or store it under consistent control." },
    { when: "Open circle at a line end", think: "Minimum = zero (optional)", why: "The circle answers \"is zero allowed?\"" },
    { when: "Three-pronged branch at a line end", think: "Maximum = many", why: "The crow's foot answers \"at most, one or many?\"" },
    { when: "\"Payment totals match, so the report is right\"", think: "Reconciling money ≠ correct units or customers", why: "Lost detail can hide in a balanced total." },
  ];

  /* ============================================================
   * TOPIC 1 · PROCESS VS PROCEDURE
   * ============================================================ */
  const PROC_BANK = [
    { t: "A customer places and completes a self-order at a Bean &amp; Byte kiosk.", cat: "Business process", why: "It ends in a meaningful result, a completed order, that the business must remember." },
    { t: "A customer pays for the order at the kiosk.", cat: "Business process", why: "Payment is a business result (money received for an order) that is recorded." },
    { t: "An employee fulfills a customer's order.", cat: "Business process", why: "It moves the order to a new status and ties it to an employee: a result worth recording." },
    { t: "A bike shop completes a repair job for a customer.", cat: "Business process", why: "A finished, billable job is a business result." },
    { t: "A pharmacy fills a patient's prescription.", cat: "Business process", why: "The filled prescription is a result the pharmacy must track." },
    { t: "A library lends a book to a member.", cat: "Business process", why: "The loan is a result (who has which book, due when)." },
    { t: "A gym signs up a new member.", cat: "Business process", why: "A new membership is a meaningful result with data to keep." },
    { t: "A hotel checks a guest into a room.", cat: "Business process", why: "The stay begins, a result the hotel bills and tracks." },
    { t: "An online store ships a customer's order.", cat: "Business process", why: "A shipped order is a result that changes status and triggers billing." },
    { t: "Steam the milk until the pitcher is too hot to hold, then pour.", cat: "Business procedure", why: "Physical how-to detail inside fulfilling an order." },
    { t: "Snap a lid onto the cup and slide on a sleeve.", cat: "Business procedure", why: "A step-level motion; the business does not need to remember it." },
    { t: "Insert the card chip-first and wait for the beep.", cat: "Business procedure", why: "How to perform the payment step, not the payment result itself." },
    { t: "Loosen the brake cable with a 5 mm hex key.", cat: "Business procedure", why: "Detailed technique inside the repair process." },
    { t: "Count pills in groups of five on the tray before bottling.", cat: "Business procedure", why: "Work instruction for one task inside filling a prescription." },
    { t: "Scan the book's barcode first, then the member's card.", cat: "Business procedure", why: "Order of motions at the desk; the loan is the result." },
    { t: "Wipe the steam wand with a damp cloth after every drink.", cat: "Business procedure", why: "A hygiene step with no business result to store." },
    { t: "Fold the towels in thirds and stack them on the bed.", cat: "Business procedure", why: "Housekeeping how-to inside the guest-stay process." },
    { t: "Tape the shipping label flat across the top of the box.", cat: "Business procedure", why: "Packing technique inside the shipping process." },
  ];
  const PROC_MAP = [
    { proc: "The customer taps the kiosk's welcome screen.", step: "Customer starts an order", ents: "Order" },
    { proc: "The customer scrolls to drinks and taps “Vanilla Latte”.", step: "Customer selects products", ents: "Product, OrderItem" },
    { proc: "The customer holds a credit card against the reader.", step: "Payment is processed", ents: "Payment" },
    { proc: "The barista pulls two espresso shots and adds vanilla syrup.", step: "Employee fulfills the order", ents: "Employee, Order (OrderStatus)" },
    { proc: "The barista calls “Chris!” across the counter.", step: "Customer picks up the order", ents: "Order (PickupName, OrderStatus)" },
  ];
  const BELONGS = [
    { biz: "Bean &amp; Byte kiosk", keep: "The price charged for each product on the order", skip: ["The milk temperature for each latte", "How many times the customer tapped the screen", "Which hand the barista used to pour"] },
    { biz: "Bean &amp; Byte kiosk", keep: "Which employee fulfilled the order", skip: ["Whether the lid was snapped on before the sleeve", "The order in which syrup and espresso were added", "How long the customer looked at the menu board"] },
    { biz: "bike repair shop", keep: "Which mechanic completed each repair job and when", skip: ["The size of hex key used on the brakes", "How many times the chain was wiped", "Which workstand the bike was clamped in"] },
    { biz: "pharmacy", keep: "Which prescription was filled for which patient, and the quantity dispensed", skip: ["Whether pills were counted in groups of five or ten", "The color of the counting tray", "Which shelf the bottle was set on while labelling"] },
    { biz: "library", keep: "Which member borrowed which copy, and its due date", skip: ["Whether the barcode or the card was scanned first", "How the book was stamped", "Which side of the desk the member stood on"] },
    { biz: "hotel", keep: "Which guest stayed in which room, for which nights, at what rate", skip: ["How the towels were folded", "The number of pillows fluffed", "Which elevator the bellhop used"] },
  ];
  const procGen = STUDY.makeGenerator({
    id: "k201-ch8-procedure",
    name: "Process vs. procedure",
    blurb: "Separate meaningful business results from step-by-step detail, and decide what the ERD should capture.",
    variants: [
      ...K.sortVariants({
        key: "ch8-proc", bank: PROC_BANK, cats: ["Business process", "Business procedure"],
        defs: { "Business process": "delivers a meaningful business result the organization must remember", "Business procedure": "step-by-step detail of how one task is physically done" },
        ask: "activity", hint: "Ask: does this end in a business result worth remembering, or is it a how-to motion inside a larger task?",
      }),
      {
        name: "Climb from procedure to process",
        make() {
          const m = U.rotate("ch8-pmap", PROC_MAP);
          return Q.mc({
            q: `<p>Procedure detail at a Bean &amp; Byte kiosk store:</p><p><i>${m.proc}</i></p><p>Which <b>process step</b> does this detail belong to?</p>`,
            right: m.step, rightWhy: `It is how the step “${m.step}” is physically carried out; the data design records ${m.ents}.`,
            wrong: PROC_MAP.filter(x => x !== m).slice(0, 4).map(x => ({ t: x.step, why: `That step's procedures look different (e.g. “${x.proc.replace(/\.$/, "")}”).` })).slice(0, 3),
            sol: S("Zoom out: what business result is this motion helping to produce?", `The motion serves “${m.step}”, which the ERD stores as ${m.ents}.`),
          });
        },
      },
      {
        name: "Procedure → what the ERD keeps",
        make() {
          const m = U.rotate("ch8-pmap2", PROC_MAP);
          const others = U.sample(PROC_MAP.filter(x => x.ents !== m.ents), 2);
          return Q.mc({
            q: `<p>At the kiosk store: <i>${m.proc}</i></p><p>Once the process step this belongs to is done, which entities does the data design use to remember it?</p>`,
            right: m.ents, rightWhy: `The step is “${m.step}”, recorded as ${m.ents}.`,
            wrong: [
              ...others.map(x => ({ t: x.ents, why: `That is what the step “${x.step}” records.` })),
              { t: "None; the ERD records each physical motion as its own entity", why: "The ERD works at the process level. Physical motions are procedure detail and are not modelled." },
            ],
            sol: S("First name the process step the motion belongs to, then ask what must be remembered after it.", `Step: “${m.step}” → ${m.ents}.`),
          });
        },
      },
      {
        name: "Which detail belongs in the data design?",
        make() {
          const b = U.rotate("ch8-belong", BELONGS);
          return Q.mc({
            q: `<p>You are drafting a first ERD for a <b>${b.biz}</b>. A colleague lists four details to store. Which one belongs in the data design?</p>`,
            right: b.keep, rightWhy: "It is process-level: managers need it for reporting, auditing or decisions after the result has happened.",
            wrong: b.skip.map(t => ({ t, why: "Procedure detail: it describes how a task is physically done and answers no business question later." })),
            sol: S("An ERD records what the business must remember about results, not how each task is physically performed.", `Keep: “${b.keep}”. The rest are procedure detail.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 2 · DATA EVENTS & TRANSLATION PATTERN
   * ============================================================ */
  const TASK2 = [
    ["Customer enters pickup name", "Pickup name and order start are captured", "Order", "PickupName, OrderTime"],
    ["Customer selects products", "Products and quantities chosen", "Product, OrderItem", "ProductName, Quantity, PriceAtSale"],
    ["Customer pays at the kiosk", "Payment details are captured", "Payment", "PaymentMethod, PaymentAmount"],
    ["System sends order to fulfillment queue", "Order status and queue position update", "Order", "OrderStatus"],
    ["Employee prepares the order", "Which employee fulfilled it; status changes", "Employee, Order", "EmployeeID, OrderStatus"],
    ["Customer picks up the order", "Completion is recorded", "Order", "OrderStatus (Completed)"],
  ];
  const T2COLS = ["Process step", "What must be remembered (data event)", "Entity", "Key attributes"];
  const STAGES = ["Process step", "Data event", "Business noun (entity)", "Attribute", "Relationship", "Relationship label", "Structure check"];
  const STAGE_DEF = {
    "Process step": "what happens",
    "Data event": "the occurrence that makes the system create or update saved data",
    "Business noun (entity)": "a person, place, thing or event that may become an entity",
    "Attribute": "a detail describing an entity",
    "Relationship": "the business rule explaining how entities connect",
    "Relationship label": "1:1, 1:M or M:N",
    "Structure check": "a question testing whether the design supports a business need",
  };
  const PATTERN_SCEN = [
    { name: "Bean &amp; Byte kiosk", items: ["Customer pays at the kiosk", "A payment record is created for the order", "Payment", "PaymentMethod", "Each order is settled by a payment", "1:1 (Order–Payment, simplified)", "Can we total yesterday's revenue by payment method?"] },
    { name: "bike repair shop", items: ["Mechanic finishes a repair", "The job's status is updated to Complete", "Mechanic", "HoursLogged", "A mechanic works many jobs; each job has one assigned mechanic", "1:M (Mechanic–RepairJob)", "Can we see which mechanic finished the most jobs last month?"] },
    { name: "public library", items: ["Member borrows a book", "A loan record is created", "Member", "DueDate", "A member can have many loans; each loan is for one member", "1:M (Member–Loan)", "Can we list every overdue book and who has it?"] },
    { name: "university registrar", items: ["Student registers for a class", "An enrollment record is created", "Course", "CreditHours", "A student takes many courses and a course has many students", "M:N (Student–Course, bridged by Enrollment)", "Can we count students in each course this term?"] },
    { name: "food-truck catering", items: ["Client books a catering event", "A booking record is created with the event date", "Client", "EventDate", "A client can book many events; each event is for one client", "1:M (Client–Event)", "Can we see which clients rebook within a year?"] },
  ];
  const EVENT_BANK = [
    { biz: "bike repair shop", step: "The mechanic marks a repair job finished.", right: "The job's new status (Complete), when it finished and which mechanic did it", wrong: [["How tightly each bolt was turned", "That is procedure detail; no report needs it."], ["Nothing; the status change can stay on a sticky note", "A status change is exactly the kind of data event the system must store."], ["The customer's favourite bike color", "Irrelevant to the event and not a detail of the repair job."]] },
    { biz: "library", step: "A member returns a borrowed book.", right: "The loan's return date (closing the loan) and whether it was late", wrong: [["Which book-drop slot it went into", "A procedure detail with no reporting use."], ["A brand-new Member record", "The member already exists; the event updates the Loan."], ["Nothing, because returns cancel the loan record", "Deleting history would make it impossible to audit late returns."]] },
    { biz: "Bean &amp; Byte kiosk", step: "The customer confirms quantities and taps Pay.", right: "Each product on the order with its quantity and price at sale, then the payment method and amount", wrong: [["Only the order total, not the items", "Without line items you cannot report units by product."], ["How long the customer hovered over the menu", "Not a business result; that is browsing behaviour, not order data."], ["The current StandardPrice only", "Prices change; the price charged at that moment (PriceAtSale) must be kept."]] },
    { biz: "Bean &amp; Byte kiosk", step: "The employee calls the pickup name and the customer collects the order.", right: "The order's status changes to Completed", wrong: [["A new Customer record named after the pickup name", "A pickup name is just an attribute on Order; it does not create a customer identity."], ["The volume of the employee's voice", "Procedure detail with no business use."], ["A second Payment for the same order", "Pickup does not involve payment; the order was already paid."]] },
    { biz: "gym", step: "A member scans in at the front desk.", right: "A Visit record: which member, which location, what time", wrong: [["Which hand they used to hold the card", "Procedure detail."], ["An update to the member's name", "Checking in does not change who the member is."], ["Nothing, since the door opened", "Visits drive reports on attendance and peak hours, so the event must be stored."]] },
    { biz: "hotel", step: "A guest checks out and settles the bill.", right: "The stay's checkout date and a payment linked to that stay", wrong: [["How the room key was handed back", "Procedure detail."], ["A new Room record", "The room already exists; the event updates the Stay and creates a Payment."], ["Only the guest's name", "A name alone records neither the stay nor the payment."]] },
  ];
  const KIOSK_DATA = ["The pickup name", "Order date and time", "The order channel (Kiosk)", "The products selected", "The quantity of each product", "The price at time of sale", "The payment method and amount", "Which employee fulfilled the order", "Which store took the order", "The order status"];
  const KIOSK_NOT = ["The milk temperature for each drink", "How many times the screen was tapped", "The color of the cup sleeve", "Which hand the barista used to pour", "How long the espresso shot took to pull", "The music playing in the store"];
  const eventsGen = STUDY.makeGenerator({
    id: "k201-ch8-events",
    name: "Data events & the translation pattern",
    blurb: "For each process step, decide what the system must remember, then carry it through to entities, attributes and relationships.",
    variants: [
      {
        name: "Fill the data-event table",
        make() {
          const r = U.randInt(0, TASK2.length - 1);
          const c = U.randInt(1, 3);
          const right = TASK2[r][c];
          const seen = new Set([right]);
          const wrong = [];
          for (const i of U.shuffle(TASK2.map((_, k) => k))) {
            const t = TASK2[i][c];
            if (!seen.has(t) && wrong.length < 3) { seen.add(t); wrong.push({ t, why: `That cell belongs to the step “${TASK2[i][0]}”, not “${TASK2[r][0]}”.` }); }
          }
          const rows = TASK2.map((row, i) => row.map((cell, j) => (i === r && j === c) ? "<b>?</b>" : cell));
          return Q.mc({
            q: `<p>The Bean &amp; Byte data-event table has one blank. What belongs in the <b>?</b> cell (column “${T2COLS[c]}”)?</p>${tbl(T2COLS, rows)}`,
            right, rightWhy: `After “${TASK2[r][0]}”, the system must remember: ${TASK2[r][1].toLowerCase()} → ${TASK2[r][2]} (${TASK2[r][3]}).`,
            wrong,
            sol: S(`Read the row's process step and ask: after “${TASK2[r][0]}”, what must the system remember?`, `The row reads: ${TASK2[r].join(" → ")}.`),
          });
        },
      },
      {
        name: "What must the system remember?",
        make() {
          const e = U.rotate("ch8-ev", EVENT_BANK);
          return Q.mc({
            q: `<p>At a <b>${e.biz}</b>: <i>${e.step}</i></p><p>Which describes the data event, meaning what the system must remember after this step?</p>`,
            right: e.right, rightWhy: "That is the saved data that later reports, audits and decisions depend on.",
            wrong: e.wrong.map(([t, why]) => ({ t, why })),
            sol: S("Ignore the physical motion. Ask which records are created or updated because this step happened.", `Data event: ${e.right}.`),
          });
        },
      },
      {
        name: "Next link in the pattern",
        make() {
          const dir = U.pick(["after", "before"]);
          const i = dir === "after" ? U.randInt(0, STAGES.length - 2) : U.randInt(1, STAGES.length - 1);
          const right = STAGES[dir === "after" ? i + 1 : i - 1];
          const wrong = U.sample(STAGES.filter(s => s !== right && s !== STAGES[i]), 3).map(s => ({ t: s, why: `${s} is ${STAGE_DEF[s]}; it sits in position ${STAGES.indexOf(s) + 1} of 7, not right ${dir} ${STAGES[i]} (position ${i + 1}).` }));
          return Q.mc({
            q: `<p>In the translation pattern from process to structure, which link comes <b>immediately ${dir}</b> “${STAGES[i]}”?</p>`,
            right, rightWhy: `The order is: ${STAGES.join(" → ")}.`,
            wrong,
            sol: S("Each link feeds the next: something happens, which creates data, about some thing, described by details, connected by rules, labelled, then tested.", `Full chain: ${STAGES.join(" → ")}.`),
          });
        },
      },
      {
        name: "Classify a new scenario",
        make() {
          const sc = U.rotate("ch8-pat", PATTERN_SCEN);
          const idx = U.sample(STAGES.map((_, k) => k), 5);
          return Q.classify({
            q: `<p>A <b>${sc.name}</b> is being modelled. Match each item to its link in the translation pattern.</p>`,
            cats: STAGES,
            items: idx.map(k => ({ t: sc.items[k], cat: STAGES[k], why: `${STAGES[k]}: ${STAGE_DEF[STAGES[k]]}.` })),
            sol: S("Ask of each item: is it something happening, something saved, a thing, a detail, a rule, a label, or a question to test the design?", `Definitions:${ul(STAGES.map(s => `<b>${s}</b>: ${STAGE_DEF[s]}`))}`),
          });
        },
      },
      {
        name: "Select the data a kiosk order creates",
        make() {
          const k = U.randInt(1, 4);
          const opts = [
            ...U.sample(KIOSK_DATA, k).map(t => ({ t, ok: true, why: "Part of what the business must remember about a completed kiosk order." })),
            ...U.sample(KIOSK_NOT, 5 - k).map(t => ({ t, ok: false, why: "Procedure or ambient detail; no report or audit needs it." })),
          ];
          return Q.multi({
            q: "<p>A Bean &amp; Byte kiosk order is placed, paid, made and picked up. Select <b>every</b> item that is data the process should create and keep.</p>",
            options: opts,
            sol: S("Keep what managers need later: who, what, how many, at what price, paid how, by whom, where, and status.", `The kiosk order creates: ${KIOSK_DATA.join("; ")}.`),
          });
        },
      },
      K.tfVariant("True or false: data events", "ch8-ev-tf", [
        { s: "Every physical step a barista takes is a data event.", truth: false, why: "Only steps that make the system create or update saved data are data events. Steaming milk changes nothing in the records.", hint: "A data event is defined by what gets saved." },
        { s: "When the kiosk sends an order to the fulfillment queue, the Order's status is updated, so this is a data event.", truth: true, why: "The OrderStatus attribute changes, which is an update to saved data." },
        { s: "The structure check is the last link in the translation pattern.", truth: true, why: "After the relationship label, you test the design with a business question (a report, an audit, a decision)." },
        { s: "A business noun automatically becomes an attribute.", truth: false, why: "Business nouns (persons, places, things, events) are candidate entities; describing details become attributes." },
        { s: "Selecting products creates data in both Product and OrderItem.", truth: true, why: "The Product rows already exist and are referenced; the OrderItem rows record which products, how many and at what price for this order." },
        { s: "A relationship label such as 1:M is chosen before identifying the business nouns.", truth: false, why: "You need the entities (nouns) and the rule connecting them first; the label summarises that rule." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 3 · VALUE → STRUCTURE
   * ============================================================ */
  const STRUCT_CATS = ["Value", "Attribute (field)", "Record", "Entity", "Relationship", "Metadata"];
  const STRUCT_DEFS = {
    "Value": "one piece of data in one cell",
    "Attribute (field)": "a named detail that describes an entity",
    "Record": "one saved instance (a row)",
    "Entity": "a person, place, thing or event the business keeps records about",
    "Relationship": "a business rule connecting entities",
    "Metadata": "data describing the meaning and organization of data",
  };
  const STRUCT_BANK = [
    { t: "“Vanilla Latte” typed in one cell of an order line", cat: "Value", why: "A single piece of data; it is stored in the ProductName attribute." },
    { t: "“Credit Card” in one row's payment cell", cat: "Value", why: "One cell's content; PaymentMethod is the attribute that holds it." },
    { t: "The number 2 in one line item's quantity cell", cat: "Value", why: "A single datum held by the Quantity attribute." },
    { t: "“Kiosk” recorded for one order's channel", cat: "Value", why: "One cell's content for the OrderChannel attribute." },
    { t: "“Chris” entered at the kiosk for one order", cat: "Value", why: "A value of PickupName; not automatically a Customer." },
    { t: "PaymentMethod, the detail recording how an order was paid", cat: "Attribute (field)", why: "A named detail describing the Payment entity." },
    { t: "ProductName, the detail holding each product's name", cat: "Attribute (field)", why: "A descriptive detail of Product." },
    { t: "PickupName, the name called out when a drink is ready", cat: "Attribute (field)", why: "A detail stored on each Order." },
    { t: "StoreLocation, the address detail of each store", cat: "Attribute (field)", why: "Describes the Store entity." },
    { t: "Quantity, how many units of a product were on a line", cat: "Attribute (field)", why: "Describes an OrderItem." },
    { t: "The single saved row for order O1004: its ID, time, pickup name and status", cat: "Record", why: "One saved instance of the Order entity." },
    { t: "One Products row: P07, Cold Brew, Beverage, $4.50", cat: "Record", why: "One instance of Product." },
    { t: "The one payment saved for order O1002", cat: "Record", why: "A single saved instance of Payment." },
    { t: "One OrderItems row saying order O1003 included 2 croissants at $3.50", cat: "Record", why: "One instance of the OrderItem entity." },
    { t: "Product, the things Bean &amp; Byte sells", cat: "Entity", why: "A thing the business keeps many records about." },
    { t: "Store, the places where orders are taken", cat: "Entity", why: "A place the business tracks, with its own attributes." },
    { t: "Payment, each settlement of an order", cat: "Entity", why: "An event the business records with its own details." },
    { t: "Employee, the people who fulfil orders", cat: "Entity", why: "A person-type the business keeps records about." },
    { t: "OrderItem, the line linking an order to a product", cat: "Entity", why: "An (associative) entity whose rows each record one product on one order." },
    { t: "Each order is placed at exactly one store, and a store takes many orders", cat: "Relationship", why: "A business rule connecting Store and Order (1:M)." },
    { t: "An employee fulfils many orders; each order is fulfilled by one employee", cat: "Relationship", why: "A rule connecting Employee and Order." },
    { t: "An order includes many products and a product appears on many orders", cat: "Relationship", why: "An M:N rule between Order and Product." },
    { t: "Each employee works at one store", cat: "Relationship", why: "A rule connecting Employee and Store." },
    { t: "A data-dictionary entry: “PriceAtSale = the price charged at the moment of sale”", cat: "Metadata", why: "It describes the meaning of a field, not a sale itself." },
    { t: "A note documenting that StoreID in Orders refers to the Stores table", cat: "Metadata", why: "It describes how the data is organised." },
    { t: "A field description: “Quantity is a whole number of at least 1”", cat: "Metadata", why: "Data about a field's meaning and allowed values." },
    { t: "The documented list of entity names used in the ERD", cat: "Metadata", why: "Entity names describe the organization of the data." },
  ];
  const HOMES = [
    { home: "ProductName in Product", vals: () => U.pick(PRODUCTS), ctx: "on an order line" },
    { home: "PickupName on Order", vals: () => U.pick(NAMES), ctx: "typed at the kiosk before ordering" },
    { home: "PaymentMethod in Payment", vals: () => U.pick(["Credit Card", "Debit Card", "Mobile Wallet", "Gift Card"]), ctx: "for how an order was settled" },
    { home: "OrderChannel on Order", vals: () => U.pick(["Kiosk", "Mobile App", "Counter"]), ctx: "for where the order was placed" },
    { home: "Quantity in OrderItem", vals: () => String(U.randInt(2, 12)), ctx: "beside one product on one order" },
    { home: "PriceAtSale in OrderItem", vals: () => money(U.pick([4.25, 4.5, 5.25, 5.5, 3.25])), ctx: "charged for a latte on one order last March" },
    { home: "StoreLocation in Store", vals: () => U.pick(["412 Kirkwood Ave", "18 College Mall Rd", "900 Third St"]), ctx: "for where a store sits" },
    { home: "Role in Employee", vals: () => U.pick(["Barista", "Shift Lead", "Store Manager"]), ctx: "for an employee's job" },
    { home: "PaymentAmount in Payment", vals: () => money(U.pick([7.25, 12.5, 18.75, 64.0])), ctx: "for the total charged on one order" },
    { home: "OrderStatus on Order", vals: () => U.pick(["Queued", "In Progress", "Completed", "Held"]), ctx: "for where an order stands" },
  ];
  const structGen = STUDY.makeGenerator({
    id: "k201-ch8-structure",
    name: "Value → attribute → entity",
    blurb: "Tell values from the attributes, records, entities, relationships and metadata that give them structure.",
    variants: [
      ...K.sortVariants({
        key: "ch8-struct", bank: STRUCT_BANK, cats: STRUCT_CATS, defs: STRUCT_DEFS, ask: "item",
        hint: "Is it one cell's content, a named detail, one whole row, a kind of thing, a rule linking things, or a description of the data itself?",
      }),
      {
        name: "Find the home of a value",
        make() {
          const h = U.pick(HOMES);
          const v = h.vals();
          const wrong = U.sample(HOMES.filter(x => x !== h), 3).map(x => ({ t: x.home, why: `${x.home} holds values like “${x.vals()}”, ${x.ctx}.` }));
          return Q.mc({
            q: `<p>In a kiosk export you see the value <b>“${v}”</b> ${h.ctx}. In the structured design, which attribute (and entity) should hold it?</p>`,
            right: h.home, rightWhy: `“${v}” is a value; ${h.home} is its home.`,
            wrong,
            sol: S("Values change from row to row; ask what kind of detail this value describes, and about which thing.", `“${v}” → ${h.home}.`),
          });
        },
      },
      {
        name: "Sort values into their attributes",
        make() {
          const hs = U.sample(HOMES, 5);
          return Q.classify({
            q: "<p>Each value below came from Bean &amp; Byte's flat-file export. Choose the attribute (and entity) that should hold it.</p>",
            cats: hs.map(h => h.home),
            items: hs.map(h => ({ t: `“${h.vals()}” (${h.ctx})`, cat: h.home, why: `This value is ${h.ctx}, so it belongs in ${h.home}.` })),
            sol: S("Use the context: product names, pickup names, payment details, channels, quantities and prices each have one home.", `Homes:${ul(hs.map(h => `${h.home}: ${h.ctx}`))}`),
          });
        },
      },
      K.conceptVariant("Value or identity?", "ch8-vi", [
        { q: "Two kiosk orders this week both have PickupName = “Chris”. What can you conclude?", right: "Nothing certain about identity: “Chris” is an attribute value on each order, not a customer key", rightWhy: "Many people share a first name, and one person may type different names. Only a CustomerID establishes identity.", wrong: [{ t: "The same customer placed both orders", why: "Matching values do not prove matching people." }, { t: "Chris should be added as a Customer entity", why: "Customer is the entity; Chris would be one record in it, and only if Chris registers." }, { t: "PickupName should be the primary key of Orders", why: "Names repeat, so they cannot uniquely identify an order." }], sol: ["Is PickupName designed to identify a person, or just to call out a drink?", "It is an attribute for fulfilment; identity needs a Customer entity with a CustomerID."] },
        { q: "Which is <b>metadata</b> rather than data?", right: "A note saying OrderChannel records where the order was placed (Kiosk, App, Counter)", rightWhy: "It describes the meaning of a field.", wrong: [{ t: "The value “Kiosk” on order O1007", why: "That is a data value." }, { t: "The row for order O1007", why: "That is a record, made of data values." }, { t: "The $6.25 charged on order O1007", why: "That is a data value of PaymentAmount." }], sol: ["Metadata is data <em>about</em> data.", "Only the note explains a field's meaning; the rest are data."] },
        { q: "What is the difference between a <b>record</b> and an <b>entity</b>?", right: "An entity is the kind of thing (Order); a record is one saved instance of it (order O1004)", rightWhy: "Entities are categories; records are their rows.", wrong: [{ t: "They are the same thing", why: "The category and its instances are different levels." }, { t: "A record is a column; an entity is a cell", why: "Columns are attributes and cells hold values." }, { t: "Records hold metadata; entities hold data", why: "Records hold data values; metadata describes structure." }], sol: ["Think category vs. instance.", "Order is the entity; each saved order is a record."] },
        { q: "“Vanilla Latte” reaches an order through which chain?", right: "Value → ProductName field → Product entity → OrderItem linking row", rightWhy: "The product's name lives in Product; the OrderItem row connects that product to the order.", wrong: [{ t: "Value → Order entity directly, in a Product1 column", why: "That is the flat-file pattern that loses detail." }, { t: "Value → PickupName → Customer", why: "PickupName holds the name to call out, not product names." }, { t: "Value → PaymentMethod → Payment", why: "Payment details describe settlement, not products." }], sol: ["Start from the value and ask what field it fills.", "ProductName in Product, connected to the order through OrderItem."] },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 4 · FLAT-FILE FAILURES
   * ============================================================ */
  const STORE_VARIANTS = [
    ["Bloomington", "Bloomington Store", "B-Town", "Bloomington - Kirkwood"],
    ["Indianapolis", "Indy", "Indianapolis Store", "Indy Downtown"],
    ["Columbus", "Columbus Store", "Columbus IN"],
  ];
  const FAIL_BANK = [
    { t: "The same store appears as “Bloomington”, “Bloomington Store” and “B-Town”.", cat: "Repeated names", why: "The store's name is retyped on every row and drifts, splitting one store into several." },
    { t: "One employee is logged as “Sam A.” on some rows and “Sam Alvarez” on others.", cat: "Repeated names", why: "Retyped names diverge, so per-employee counts split." },
    { t: "A product is entered as “Vanilla Latte” by one shift and “Van. Latte” by another.", cat: "Repeated names", why: "Free-text repetition creates variants of one product." },
    { t: "When a store moves, its address must be edited on thousands of order rows and some are missed.", cat: "Repeated names", why: "Details copied into every row must be updated everywhere, so copies disagree." },
    { t: "A catering order with 10 items shows only Product1–Product3.", cat: "Lost detail", why: "Fixed columns cap what fits; seven items vanish." },
    { t: "The file has one Price column, so last spring's sale price was overwritten when the menu price rose.", cat: "Lost detail", why: "History disappears when the current value replaces it." },
    { t: "The export lists product names but no quantities, so four cold brews look like one.", cat: "Lost detail", why: "A detail the business needs is not captured at all." },
    { t: "An order's fourth and fifth items never make it into the spreadsheet.", cat: "Lost detail", why: "The layout has nowhere to put them." },
    { t: "Two different customers both type “Jordan” during the same morning rush.", cat: "Unstable identity", why: "A typed name cannot tell two people apart." },
    { t: "“Chris”, “Christopher” and “Chris P.” might be one regular or three different people.", cat: "Unstable identity", why: "Nothing reliably identifies the customer." },
    { t: "A refund request mentions “Sam's 8:02 order at Bloomington”, which matches two rows.", cat: "Unstable identity", why: "Without a dependable key, the right record cannot be pinned down." },
    { t: "A regular who types a different nickname each visit looks like a new customer every time.", cat: "Unstable identity", why: "Identity depends on what is typed, so repeat behaviour is invisible." },
  ];
  const FAIL_DEFS = { "Repeated names": "the same thing retyped on many rows drifts into variants", "Lost detail": "the layout cannot hold everything, or overwrites history", "Unstable identity": "nothing reliably identifies which person or thing a row refers to" };
  const failSort = K.sortVariants({ key: "ch8-fail", bank: FAIL_BANK, cats: ["Repeated names", "Lost detail", "Unstable identity"], defs: FAIL_DEFS, ask: "symptom", hint: "Is the problem that something is retyped and drifts, that something does not fit or gets overwritten, or that you cannot tell who or what a row is?" });
  const flatGen = STUDY.makeGenerator({
    id: "k201-ch8-flatfile",
    name: "Flat-file failures",
    blurb: "See exactly how a one-list export misleads reports: split store groups, missing units, a wrong top seller.",
    variants: [
      {
        name: "Count the store groups",
        make() {
          const nReal = U.randInt(2, 3);
          const stores = U.sample(STORE_VARIANTS, nReal);
          const used = stores.map((v, i) => U.sample(v, i === 0 ? U.randInt(2, 3) : U.randInt(1, 3)));
          let names = used.flat();
          const rows = [];
          const pool = U.shuffle([...names, ...U.sample(names, Math.max(0, 7 - names.length))]);
          pool.forEach((s, i) => rows.push([`O${3101 + i}`, U.pick(NAMES), s, U.pick(PRODUCTS), money(U.pick([4.5, 5.75, 3.25, 9.0, 11.25]))]));
          const groups = new Set(pool).size;
          return Q.num({
            q: `<p>A shift export (flat file) is shown below. These rows actually came from <b>${nReal}</b> physical stores. A manager builds a sales-by-store report that groups rows by the <b>StoreName</b> text.</p>${tbl(["OrderID", "PickupName", "StoreName", "Product1", "Amount"], rows)}<p>How many store groups will the report show?</p>`,
            answer: groups, kind: "count", unit: "groups",
            traps: [{ value: nReal, why: `There are ${nReal} real stores, but grouping on free text treats every spelling as a different store.` }],
            sol: S("Grouping on text treats each distinct spelling as its own group, whatever it means to a human.", `Distinct StoreName values: ${[...new Set(pool)].join(", ")} → <b>${groups}</b> groups for ${nReal} real stores. The fix: a Store entity and a StoreID foreign key on each order.`),
          });
        },
      },
      {
        name: "Count the missing units",
        make() {
          const nLines = U.randInt(5, 9);
          const prods = U.sample(PRODUCTS, Math.min(nLines, PRODUCTS.length));
          const lines = prods.map(p => ({ p, q: U.randInt(1, 6) }));
          if (lines.every(l => l.q === 1)) lines[0].q = 3;
          const total = lines.reduce((a, l) => a + l.q, 0);
          const shown = 3;
          const ans = total - shown;
          const traps = [];
          if (nLines - 3 !== ans) traps.push({ value: nLines - 3, why: "That counts missing line items, not units. Each line can carry a quantity above 1." });
          if (total !== ans) traps.push({ value: total, why: "That is every unit on the order. The report did count the three visible cells." });
          const visQ = lines.slice(0, 3).reduce((a, l) => a + l.q, 0);
          if (total - visQ !== ans && total - visQ !== nLines - 3 && total - visQ !== total) traps.push({ value: total - visQ, why: "The export has no quantity column, so the report counts each visible product cell as just 1 unit, not its full quantity." });
          return Q.num({
            q: `<p>A catering order's kiosk receipt lists these line items:</p>${tbl(["Line", "Product", "Quantity"], lines.map((l, i) => [i + 1, l.p, l.q]))}<p>The end-of-shift export has only <b>Product1, Product2, Product3</b> columns and no quantity column, so it keeps the first three product names. The units-sold report counts each product cell as one unit. How many units does the report <b>miss</b> for this order?</p>`,
            answer: ans, kind: "count", unit: "units", traps,
            sol: S("Compare what really sold (all quantities) with what the report can see (one unit per visible cell).", `Actual units = ${lines.map(l => l.q).join(" + ")} = ${total}. The report sees 3. Missed = ${total} − 3 = <b>${ans}</b>. The payment still reconciles, which is why this goes unnoticed. OrderItem (one row per product, with Quantity) fixes it.`),
          });
        },
      },
      {
        name: "Who is the real top seller?",
        make() {
          let data = null;
          for (let g = 0; g < 400 && !data; g++) {
            const P = U.sample(PRODUCTS, 5);
            const orders = [];
            for (let i = 0; i < 5; i++) orders.push(U.sample(P, U.randInt(1, 3)));
            const cater = U.sample(P, 3);
            const hidden = [];
            const hb = U.pick(P);
            for (let i = 0; i < 7; i++) hidden.push(i < U.randInt(4, 6) ? hb : U.pick(P));
            const vis = {}, act = {};
            P.forEach(p => { vis[p] = 0; act[p] = 0; });
            [...orders, cater].forEach(o => o.forEach(p => { vis[p]++; act[p]++; }));
            hidden.forEach(p => act[p]++);
            const top = m => { const s = P.slice().sort((a, b) => m[b] - m[a]); return m[s[0]] > m[s[1]] ? s[0] : null; };
            const tv = top(vis), ta = top(act);
            if (tv && ta && tv !== ta) data = { P, orders, cater, hidden, vis, act, tv, ta };
          }
          if (!data) {
            const P = ["Vanilla Latte", "Cold Brew", "Croissant", "Cookie", "Mocha"];
            data = { P, orders: [["Vanilla Latte", "Croissant"], ["Vanilla Latte"], ["Vanilla Latte", "Cookie"], ["Mocha"], ["Vanilla Latte", "Cold Brew"]], cater: ["Croissant", "Cookie", "Mocha"], hidden: ["Cold Brew", "Cold Brew", "Cold Brew", "Cold Brew", "Cold Brew", "Mocha", "Cookie"] };
            data.vis = { "Vanilla Latte": 4, "Cold Brew": 1, "Croissant": 2, "Cookie": 2, "Mocha": 2 };
            data.act = { "Vanilla Latte": 4, "Cold Brew": 6, "Croissant": 2, "Cookie": 3, "Mocha": 3 };
            data.tv = "Vanilla Latte"; data.ta = "Cold Brew";
          }
          const d = data;
          const askActual = U.pick([true, false]);
          const rows = d.orders.map((o, i) => [`O${4201 + i}`, o[0] || "", o[1] || "", o[2] || ""]);
          rows.push(["O4206 (catering)", d.cater[0], d.cater[1], d.cater[2]]);
          const hiddenCount = {};
          d.hidden.forEach(p => { hiddenCount[p] = (hiddenCount[p] || 0) + 1; });
          const hiddenTxt = Object.entries(hiddenCount).map(([p, n]) => `${n} × ${p}`).join(", ");
          const right = askActual ? d.ta : d.tv;
          const counts = p => `flat-file count ${d.vis[p]}, true count ${d.act[p]}`;
          return Q.mc({
            q: `<p>Each product cell below is one unit sold. The flat file only has three product columns.</p>${tbl(["OrderID", "Product1", "Product2", "Product3"], rows)}<p>The kiosk's own receipt for catering order O4206 shows <b>10</b> line items (one unit each). The seven that did not fit were: ${hiddenTxt}.</p><p>${askActual ? "Which product <b>actually</b> sold the most units?" : "Which product will a units report built on the <b>flat file</b> name as top seller?"}</p>`,
            right, rightWhy: `${right}: ${counts(right)}.`,
            wrong: d.P.filter(p => p !== right).slice(0, 4).map(p => ({ t: p, why: `${p}: ${counts(p)}. ${p === d.tv ? "It only looks like the leader because the catering order's hidden lines were cut off." : p === d.ta ? "It is the true leader, but the flat file cannot see its hidden units." : "It does not lead either count."}` })),
            sol: S(askActual ? "Add the seven hidden line items back before counting." : "Count only what the flat file shows: one per visible product cell.", `Flat-file counts: ${d.P.map(p => `${p} ${d.vis[p]}`).join(", ")}. True counts: ${d.P.map(p => `${p} ${d.act[p]}`).join(", ")}. The flat file names <b>${d.tv}</b>; the truth is <b>${d.ta}</b>. That is how the Bean &amp; Byte report named the wrong top seller.`),
          });
        },
      },
      ...failSort.filter(v => v.name === "Sort (drop-down)" || v.name === "Name the category").map(v => ({ name: v.name === "Sort (drop-down)" ? "Diagnose symptoms (sort)" : "Name the failure", make: v.make })),
      {
        name: "Which reports go wrong?",
        make() {
          const trunc = U.pick([true, false]);
          const storeVar = trunc ? U.pick([true, false]) : true;
          const facts = [];
          if (trunc) facts.push("one catering order had 9 items but only 3 product columns were exported");
          if (storeVar) facts.push("the same store was typed as “Bloomington” and “B-Town”");
          const opts = [
            { t: "Units sold per product", ok: trunc, why: trunc ? "Truncated product columns undercount units." : "No items were cut off in this export, so unit counts are complete." },
            { t: "Sales by store, grouped on the StoreName text", ok: storeVar, why: storeVar ? "Each spelling becomes its own store group." : "Store names were consistent in this export." },
            { t: "Total revenue for the shift (sum of payment amounts)", ok: false, why: "Payments are recorded in full, so the total still reconciles even when items are lost." },
            { t: "Number of orders taken (count of OrderIDs)", ok: false, why: "Each order still has one row and one OrderID, so the count is right." },
            { t: "Number of distinct repeat customers, based on PickupName", ok: true, why: "PickupName is not an identity; repeat customers cannot be reliably counted." },
          ];
          return Q.multi({
            q: `<p>From one shift's flat-file export we know that ${facts.join(", and ")}. Pickup names are free text. Select <b>every</b> report that would give a <b>wrong or unreliable</b> answer.</p>`,
            options: opts,
            sol: S("For each report, ask which column it depends on, and whether that column suffers from lost detail, repeated names or unstable identity.", "Money totals and order counts survive; units, store groups and customer counts depend on the structure that is broken. Reconciling money does not prove the rest is right."),
          });
        },
      },
      K.conceptVariant("Choose the structural fix", "ch8-fix", [
        { q: "Store names vary (Bloomington / Bloomington Store / B-Town), splitting sales reports. Which change fixes it structurally?", right: "Create a Store entity with one record per store and store StoreID as a foreign key on each order", rightWhy: "One controlled record per store; orders point to it by key, so spelling can no longer split groups.", wrong: [{ t: "Rename the StoreName column to StoreLocation", why: "Renaming is cosmetic; the free text still varies." }, { t: "Ask staff to type store names more carefully", why: "Still free text, so drift returns; nothing enforces one spelling." }, { t: "Add a StoreName2 column for alternate spellings", why: "Adds more repetition; groups still split." }], sol: ["Is the problem the label or the fact that the store is retyped on every row?", "Move the store into its own entity and reference it by StoreID."] },
        { q: "Catering orders lose items beyond Product3. Which fix is structural?", right: "Add an OrderItem associative entity: one row per product on an order, with Quantity and PriceAtSale", rightWhy: "Rows have no ceiling, so any number of products fits.", wrong: [{ t: "Widen the sheet to Product1 through Product10", why: "That only moves the cap; an 11-item order fails again, and most cells sit empty." }, { t: "Split large orders into several orders of three items", why: "Distorts order counts and the payment link." }, { t: "Keep three columns but add a free-text Notes column listing the rest", why: "Notes can't be counted reliably in unit reports." }], sol: ["What happens to the design when an order has one more item than the number of columns?", "Use rows, not columns: an OrderItem row per product."] },
        { q: "Two customers named Jordan order in the same rush, and one later complains. What design change lets a manager tell them apart in future?", right: "Keep PickupName on Order for fulfilment, and add a Customer entity with CustomerID stored (optionally) on Order", rightWhy: "PickupName serves the counter; CustomerID gives stable identity across orders.", wrong: [{ t: "Make PickupName required and unique", why: "Customers can't be forced to have unique names, and the same person may use different names." }, { t: "Delete PickupName and use only CustomerID", why: "Guests still need a name called out; PickupName has a fulfilment job." }, { t: "Add a PickupName2 column", why: "Another name field adds no identity." }], sol: ["Is a typed name an identity, or just an attribute used at pickup?", "Identity needs its own entity and key; keep PickupName for calling out orders."] },
        { q: "The menu price of a vanilla latte rose from $5.50 to $5.75 and the single Price column was overwritten. What does the structured design do instead?", right: "Keep StandardPrice in Products (current) and PriceAtSale in OrderItems (what was charged)", rightWhy: "Both facts survive: today's price and the history of each sale.", wrong: [{ t: "Store only StandardPrice and recalculate old sales from it", why: "Old revenue would be misstated at the new price." }, { t: "Store only PriceAtSale and drop the product's current price", why: "Then nothing tells the kiosk what to charge today." }, { t: "Keep one Price column but add a cell comment when it changes", why: "Comments are not structured data; reports can't use them." }], sol: ["There are two different facts here: the current price and the price at a moment.", "Each fact needs its own home: Products for current, OrderItems for history."] },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 5 · KEYS & ASSOCIATIVE ENTITY
   * ============================================================ */
  const ONE_MANY = [
    { one: "Store", many: "Order", key: "StoreID", rule: "Each order is taken at one store; a store takes many orders." },
    { one: "Employee", many: "Order", key: "EmployeeID", rule: "Each order is fulfilled by one employee; an employee fulfils many orders." },
    { one: "Store", many: "Employee", key: "StoreID", rule: "Each employee works at one store; a store has many employees." },
    { one: "Product", many: "OrderItem", key: "ProductID", rule: "Each order line is for one product; a product appears on many order lines." },
    { one: "Order", many: "OrderItem", key: "OrderID", rule: "Each order line belongs to one order; an order has many lines." },
    { one: "Member", many: "Loan", key: "MemberID", rule: "Each loan is to one library member; a member can have many loans." },
    { one: "Doctor", many: "Appointment", key: "DoctorID", rule: "Each appointment is with one doctor; a doctor has many appointments." },
    { one: "Department", many: "Employee", key: "DepartmentID", rule: "Each employee belongs to one department; a department has many employees." },
    { one: "Mechanic", many: "RepairJob", key: "MechanicID", rule: "Each repair job is assigned to one mechanic; a mechanic handles many jobs." },
    { one: "Customer", many: "Order", key: "CustomerID", rule: "A registered customer can place many orders; an order has at most one customer." },
  ];
  const MN = [
    { a: "Order", b: "Product", right: "OrderItem", extra: "Quantity, PriceAtSale" },
    { a: "Student", b: "Course", right: "Enrollment", extra: "Term, Grade" },
    { a: "Recipe", b: "Ingredient", right: "RecipeIngredient", extra: "Amount, Unit" },
    { a: "Movie", b: "Actor", right: "Casting", extra: "CharacterName" },
    { a: "Member", b: "FitnessClass", right: "ClassBooking", extra: "BookingDate, Attended" },
    { a: "Patient", b: "Medication", right: "Prescription", extra: "Dose, StartDate" },
  ];
  const ATTR_HOME = [
    ["StandardPrice", "Products", "the current list price belongs to the product"],
    ["PriceAtSale", "OrderItems", "what was charged at that moment belongs to the line"],
    ["Quantity", "OrderItems", "how many of a product on one order"],
    ["LineTotal", "OrderItems", "calculated from Quantity × PriceAtSale on the line"],
    ["ProductCategory", "Products", "describes the product"],
    ["ProductName", "Products", "describes the product"],
    ["PickupName", "Orders", "called out for one order"],
    ["OrderChannel", "Orders", "how this order was placed"],
    ["OrderStatus", "Orders", "where this order stands"],
    ["OrderTime", "Orders", "when this order started"],
    ["PaymentMethod", "Payments", "how the order was paid"],
    ["PaymentAmount", "Payments", "how much was paid"],
    ["StoreLocation", "Stores", "where the store is"],
    ["StoreName", "Stores", "the store's controlled name"],
    ["Role", "Employees", "describes the employee"],
    ["EmployeeName", "Employees", "describes the employee"],
  ];
  const PK_TABLES = [
    () => {
      const oid = ["O5001", "O5001", "O5002", "O5003", "O5003"];
      const pid = U.shuffle(["P01", "P02", "P01", "P03", "P02"]);
      return { name: "OrderItems", pk: "OrderItemID", fk: { col: "ProductID", to: "Products" }, head: ["OrderItemID", "OrderID", "ProductID", "Quantity"], rows: oid.map((o, i) => [`OI${71 + i}`, o, pid[i], [1, 2, 1, 2, 1][i]]) };
    },
    () => {
      const nm = U.sample(NAMES, 3);
      const pn = U.shuffle([nm[0], nm[0], nm[1], nm[2], nm[1]]);
      const st = U.shuffle(["S1", "S1", "S2", "S2", "S1"]);
      return { name: "Orders", pk: "OrderID", fk: { col: "StoreID", to: "Stores" }, head: ["OrderID", "PickupName", "StoreID", "OrderStatus"], rows: pn.map((p, i) => [`O${6101 + i}`, p, st[i], ["Completed", "Completed", "Queued", "Held", "Queued"][i]]) };
    },
    () => {
      const st = U.shuffle(["S1", "S2", "S1", "S2"]);
      return { name: "Employees", pk: "EmployeeID", fk: { col: "StoreID", to: "Stores" }, head: ["EmployeeID", "EmployeeName", "Role", "StoreID"], rows: [["E11", "Sam Alvarez", "Barista", st[0]], ["E12", "Sam Alvarez", "Shift Lead", st[1]], ["E13", "Dana Cole", "Barista", st[2]], ["E14", "Lee Park", "Shift Lead", st[3]]] };
    },
    () => ({ name: "Payments", pk: "PaymentID", fk: { col: "OrderID", to: "Orders" }, head: ["PaymentID", "OrderID", "PaymentMethod", "PaymentAmount"], rows: [["PY1", "O7001", "Credit Card", "$8.25"], ["PY2", "O7002", "Gift Card", "$5.75"], ["PY3", "O7003", "Credit Card", "$8.25"], ["PY4", "O7004", "Mobile Wallet", "$5.75"]] }),
  ];
  function priceOrder() {
    for (let g = 0; g < 200; g++) {
      const it = priceOrder1();
      const a = it.reduce((x, i) => x + i.q * i.sale, 0), sd = it.reduce((x, i) => x + i.q * i.std, 0);
      if (sd - a >= Math.max(0.75, a * 0.03)) return it;
    }
    return [{ p: "Vanilla Latte", std: 5.75, sale: 5.25, q: 3 }, { p: "Cold Brew", std: 4.5, sale: 4.5, q: 2 }, { p: "Croissant", std: 3.5, sale: 3.25, q: 1 }];
  }
  function priceOrder1() {
    const items = U.sample(PRODUCTS, 3).map(p => {
      const std = U.pick([3.25, 3.5, 4.5, 4.75, 5.25, 5.75]);
      const changed = U.pick([true, false]);
      return { p, std, sale: changed ? std - U.pick([0.25, 0.5]) : std, q: U.randInt(1, 4) };
    });
    if (items.every(i => i.sale === i.std)) items[0].sale = items[0].std - 0.25;
    if (items.every(i => i.q === 1)) items[1].q = 2;
    return items;
  }
  const keysGen = STUDY.makeGenerator({
    id: "k201-ch8-keys",
    name: "Keys, associative entities & price history",
    blurb: "Place primary and foreign keys, resolve many-to-many with an associative entity, and keep PriceAtSale apart from StandardPrice.",
    variants: [
      {
        name: "Where does the foreign key go?",
        make() {
          const r = U.rotate("ch8-fk", ONE_MANY);
          return Q.mc({
            q: `<p>Business rule: <i>${r.rule}</i></p><p>How should the two entities be connected?</p>`,
            right: `${r.many} stores ${r.key} as a foreign key`,
            rightWhy: `${r.many} is the many side: each ${r.many} row has exactly one ${r.one}, so it has room for one ${r.key}.`,
            wrong: [
              { t: `${r.one} stores ${r.many}ID as a foreign key`, why: `One ${r.one} relates to many ${r.many} rows, so it would need a list of IDs in one cell. FKs go on the many side.` },
              { t: `Each stores the other's ID`, why: "Redundant and liable to disagree; one FK on the many side is enough." },
              { t: `${r.many} stores the ${r.one}'s name as free text`, why: "Names repeat and drift (the flat-file problem); keys give stable links." },
            ],
            sol: S("Find the many side: which entity has several rows pointing at one row of the other?", `${r.many} is the many side, so it stores ${r.key} (the PK of ${r.one}) as an FK.`),
          });
        },
      },
      {
        name: "Spot the primary key in a table",
        make() {
          const t = U.pick(PK_TABLES)();
          const askFk = U.pick([true, false]);
          const right = askFk ? t.fk.col : t.pk;
          const wrong = t.head.filter(h => h !== right).map(h => ({
            t: h,
            why: h === t.pk ? `${h} is this table's own primary key, not a pointer to ${t.fk.to}.` : (askFk ? `${h} does not hold the primary key of ${t.fk.to}.` : `${h} repeats (or could repeat) across rows, so it cannot uniquely identify one record.`),
          }));
          return Q.mc({
            q: `<p>Sample rows from <b>${t.name}</b>:</p>${tbl(t.head, t.rows)}<p>${askFk ? `Which column is the <b>foreign key</b> linking ${t.name} to <b>${t.fk.to}</b>?` : "Which column is the <b>primary key</b>?"}</p>`,
            right, rightWhy: askFk ? `${right} holds values of ${t.fk.to}' primary key, connecting each row to one ${t.fk.to} record.` : `${right} is unique on every row and exists to identify one record.`,
            wrong,
            sol: S(askFk ? "A foreign key holds another table's primary key." : "A primary key must be unique for every row, now and in future rows. Check which columns repeat.", askFk ? `${right} points to ${t.fk.to}.` : `Only ${right} is guaranteed unique; ${t.head.filter(h => h !== right).join(", ")} can repeat.`),
          });
        },
      },
      {
        name: "Resolve the many-to-many",
        make() {
          const m = U.rotate("ch8-mn", MN);
          const others = U.sample(MN.filter(x => x !== m), 2);
          return Q.mc({
            q: `<p>A ${m.a} can involve many ${m.b}s, and a ${m.b} can involve many ${m.a}s. Details like <b>${m.extra}</b> describe the pairing, not either one alone. How should the ERD handle this?</p>`,
            right: `Add an associative entity, ${m.right}, holding ${m.a}ID and ${m.b}ID as foreign keys plus ${m.extra}`,
            rightWhy: "The associative entity turns M:N into two 1:M relationships and gives the pairing details a home.",
            wrong: [
              { t: `Put ${m.b}1, ${m.b}2, ${m.b}3 columns in ${m.a}`, why: "The flat-file trap: a fixed cap and nowhere to store per-pairing details." },
              { t: `Store ${m.b}ID as a foreign key in ${m.a} only`, why: `That allows only one ${m.b} per ${m.a}, which turns M:N into 1:M.` },
              { t: `Draw a direct M:N line and store ${m.extra} in ${m.b}`, why: `${m.extra} varies by pairing, so it cannot live in ${m.b}; relational tables need the bridge.` },
            ],
            sol: S("M:N cannot be stored directly; something must record each pairing as its own row.", `${m.right} sits between ${m.a} and ${m.b} (like OrderItem between Order and Product). Other examples: ${others.map(o => `${o.right} for ${o.a}–${o.b}`).join(", ")}.`),
          });
        },
      },
      {
        name: "Which table holds the attribute?",
        make() {
          const pick = [U.pick(ATTR_HOME.filter(a => a[0] === "StandardPrice" || a[0] === "PriceAtSale")), ...U.sample(ATTR_HOME.filter(a => a[0] !== "StandardPrice" && a[0] !== "PriceAtSale"), 4)];
          return Q.classify({
            q: "<p>In Bean &amp; Byte's structured design, which table should hold each attribute?</p>",
            cats: ["Products", "OrderItems", "Orders", "Payments", "Stores", "Employees"],
            items: pick.map(([a, home, why]) => ({ t: a, cat: home, why: `${home}: ${why}.` })),
            sol: S("Ask what each attribute describes: the product in general, one line of one order, the order, the payment, the store, or the employee.", `Homes:${ul(pick.map(([a, h, w]) => `${a} → ${h} (${w})`))}`),
          });
        },
      },
      {
        name: "Total the order from PriceAtSale",
        make() {
          const it = priceOrder();
          const actual = it.reduce((a, i) => a + i.q * i.sale, 0);
          const std = it.reduce((a, i) => a + i.q * i.std, 0);
          const noQ = it.reduce((a, i) => a + i.sale, 0);
          const traps = [{ value: std, why: "That uses today's StandardPrice. The customer paid PriceAtSale, which was lower for some items at the time." }];
          if (Math.abs(noQ - actual) > Math.max(0.02, actual * 0.02) && Math.abs(noQ - std) > 0.01) traps.push({ value: noQ, why: "That adds one unit of each line, ignoring Quantity." });
          return Q.num({
            q: `<p><b>Products</b> (current):</p>${tbl(["ProductID", "ProductName", "StandardPrice"], it.map((i, k) => [`P${k + 1}`, i.p, money(i.std)]))}<p><b>OrderItems</b> for order O8120, placed a few months ago:</p>${tbl(["OrderItemID", "OrderID", "ProductID", "Quantity", "PriceAtSale"], it.map((i, k) => [`OI${k + 1}`, "O8120", `P${k + 1}`, i.q, money(i.sale)]))}<p>What did the customer actually pay for this order (the sum of the LineTotals)?</p>`,
            answer: Math.round(actual * 100) / 100, unit: "$", traps,
            sol: S("LineTotal = Quantity × PriceAtSale: the price charged then, not the price listed now.", `${it.map(i => `${i.q} × ${money(i.sale)} = ${money(i.q * i.sale)}`).join("; ")} → total <b>${money(actual)}</b>. Using StandardPrice would give ${money(std)}.`),
          });
        },
      },
      {
        name: "How far off is the overwritten price?",
        make() {
          const it = priceOrder();
          const actual = it.reduce((a, i) => a + i.q * i.sale, 0);
          const std = it.reduce((a, i) => a + i.q * i.std, 0);
          const diff = Math.round((std - actual) * 100) / 100;
          const perUnit = Math.round(it.reduce((a, i) => a + (i.std - i.sale), 0) * 100) / 100;
          const traps = [{ value: Math.round(std * 100) / 100, why: "That is the restated total, not the size of the error." }];
          if (Math.abs(perUnit - diff) > Math.max(0.02, diff * 0.02)) traps.push({ value: perUnit, why: "That adds one price difference per line and ignores Quantity." });
          return Q.num({
            q: `<p>Old order O8121 had these lines (prices were raised since):</p>${tbl(["Product", "Quantity", "PriceAtSale (then)", "StandardPrice (now)"], it.map(i => [i.p, i.q, money(i.sale), money(i.std)]))}<p>A flat-file design kept only one Price column and overwrote it with today's prices. By how much would a revenue report now <b>overstate</b> this order?</p>`,
            answer: diff, unit: "$", traps,
            sol: S("The error is the gap between what the restated report says and what was really charged.", `Restated: ${money(std)}; actual: ${money(actual)}; overstatement = <b>${money(diff)}</b>. Keeping PriceAtSale on OrderItems prevents it.`),
          });
        },
      },
      {
        name: "Select what OrderItem holds",
        make() {
          const yes = [["OrderID (FK)", "links the line to its order"], ["ProductID (FK)", "links the line to its product"], ["Quantity", "how many of that product on that order"], ["PriceAtSale", "price charged at the moment of sale"], ["OrderItemID (PK)", "identifies each line"]];
          const no = [["StandardPrice", "That is the current list price; it lives in Products."], ["PickupName", "That describes the whole order; it lives in Orders."], ["PaymentMethod", "That describes the payment; it lives in Payments."], ["StoreLocation", "That describes the store; it lives in Stores."], ["ProductCategory", "That describes the product; it lives in Products."]];
          const k = U.randInt(1, 4);
          return Q.multi({
            q: "<p>Select <b>every</b> attribute that belongs in the <b>OrderItems</b> associative entity.</p>",
            options: [...U.sample(yes, k).map(([t, w]) => ({ t, ok: true, why: `Yes: ${w}.` })), ...U.sample(no, 5 - k).map(([t, w]) => ({ t, ok: false, why: w }))],
            sol: S("OrderItem records “this order included this product, in this quantity, at this price.” Anything else describes some other entity.", "OrderItems: OrderItemID (PK), OrderID (FK), ProductID (FK), Quantity, PriceAtSale, and LineTotal if stored."),
          });
        },
      },
      K.tfVariant("True or false: keys", "ch8-keys-tf", [
        { s: "A foreign key in Orders called StoreID holds values of the Stores table's primary key.", truth: true, why: "That is what a foreign key is: another entity's PK stored to connect the two." },
        { s: "In a one-to-many relationship, the foreign key goes on the one side.", truth: false, why: "It goes on the many side, where each row has exactly one parent to point to." },
        { s: "LineTotal must always be stored, because it cannot be calculated.", truth: false, why: "It is calculated (Quantity × PriceAtSale). Storing it is optional, and then it must be kept consistent." },
        { s: "PriceAtSale lets reports show what a customer was really charged even after the menu price changes.", truth: true, why: "It freezes the price at the moment of sale on the order line." },
        { s: "A pickup name is a good primary key for Orders because every order has one.", truth: false, why: "Pickup names repeat; a PK must be unique for every record." },
        { s: "OrderItem resolves the many-to-many relationship between Order and Product.", truth: true, why: "It turns M:N into Order 1:M OrderItem and Product 1:M OrderItem." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 6 · CROW'S FOOT NOTATION
   * ============================================================ */
  const PAIRS = [
    { A: "Store", B: "Order", a: "one", b: "zeroMany" },
    { A: "Order", B: "Payment", a: "one", b: "one" },
    { A: "Order", B: "OrderItem", a: "one", b: "oneMany" },
    { A: "Customer", B: "Order", a: "zeroOne", b: "zeroMany" },
    { A: "Department", B: "Employee", a: "one", b: "oneMany" },
    { A: "Person", B: "Passport", a: "one", b: "zeroOne" },
    { A: "Team", B: "Player", a: "zeroOne", b: "oneMany" },
    { A: "Member", B: "Loan", a: "one", b: "zeroMany" },
    { A: "Student", B: "Course", a: "zeroMany", b: "zeroMany" },
    { A: "Author", B: "Book", a: "oneMany", b: "oneMany" },
    { A: "Doctor", B: "Appointment", a: "one", b: "zeroMany" },
  ];
  const labelOf = p => {
    const ma = KIND[p.a].max, mb = KIND[p.b].max;
    return ma === "one" && mb === "one" ? "1:1" : ma === "many" && mb === "many" ? "M:N" : "1:M";
  };
  const sentence = p => `${readEnd(p.A, p.B, p.b)}; ${readEnd(p.B, p.A, p.a).charAt(0).toLowerCase() + readEnd(p.B, p.A, p.a).slice(1)}.`;
  function diffWhy(right, wrongP) {
    if (wrongP.a === right.b && wrongP.b === right.a) return "This reads each end's marks as if they described the entity at the far end. The marks next to an entity count <em>that</em> entity.";
    const parts = [];
    for (const [side, ent] of [["a", right.A], ["b", right.B]]) {
      const r = KIND[right[side]], w = KIND[wrongP[side]];
      if (r.min !== w.min) parts.push(`next to ${ent} the minimum is ${r.min === "zero" ? "zero (open circle)" : "one (bar)"}, not ${w.min}`);
      if (r.max !== w.max) parts.push(`next to ${ent} the maximum is ${r.max === "many" ? "many (crow's foot)" : "one (bar)"}, not ${w.max}`);
    }
    return "Check the marks: " + parts.join("; ") + ".";
  }
  const RULES = [
    { t: "Each order has exactly one payment, and each payment settles exactly one order.", cat: "1:1", why: "One on both sides." },
    { t: "Each person has at most one passport, and each passport belongs to one person.", cat: "1:1", why: "Maximum one on both sides (minimum aside)." },
    { t: "Each store manager runs one store, and each store has one manager.", cat: "1:1", why: "One on both sides." },
    { t: "A store takes many orders; each order is taken at one store.", cat: "1:M", why: "Many on one side only." },
    { t: "An employee fulfils many orders; each order has one fulfilling employee.", cat: "1:M", why: "Many orders per employee, one employee per order." },
    { t: "A product appears on many order lines; each order line is for one product.", cat: "1:M", why: "Many lines per product, one product per line." },
    { t: "A library member can have many loans; each loan is to one member.", cat: "1:M", why: "Many on the Loan side only." },
    { t: "An order contains many products, and a product appears on many orders.", cat: "M:N", why: "Many on both sides; needs OrderItem." },
    { t: "A student takes many courses, and a course enrols many students.", cat: "M:N", why: "Many on both sides; needs Enrollment." },
    { t: "A recipe uses many ingredients, and an ingredient goes into many recipes.", cat: "M:N", why: "Many on both sides; needs a bridge entity." },
    { t: "An actor appears in many movies, and a movie has many actors.", cat: "M:N", why: "Many on both sides." },
  ];
  const crowGen = STUDY.makeGenerator({
    id: "k201-ch8-crowsfoot",
    name: "Crow's foot notation",
    blurb: "Read bars, crow's feet and circles; separate minimum from maximum cardinality; turn rules into 1:1, 1:M and M:N.",
    variants: [
      {
        name: "Read one line end",
        make() {
          const k = U.pick(KINDS);
          const ent = U.pick(["Order", "Product", "Customer", "Payment", "Employee", "Loan"]);
          return Q.mc({
            q: `<p>What do the marks touching <b>${ent}</b> mean?</p>${loneEnd(ent, k)}`,
            right: KIND[k].label, rightWhy: `${KIND[k].marks}: minimum ${KIND[k].min}, maximum ${KIND[k].max}.`,
            wrong: KINDS.filter(x => x !== k).map(x => ({ t: KIND[x].label, why: `“${KIND[x].label}” would be drawn as ${KIND[x].marks}. Here the inner mark is ${KIND[k].max === "many" ? "a crow's foot (many)" : "a bar (one)"} and the outer mark is ${KIND[k].min === "zero" ? "an open circle (zero allowed)" : "a bar (at least one)"}.` })),
            keepOrder: LABELS,
            sol: S("Read the mark against the box first (maximum: bar = one, crow's foot = many), then the outer mark (minimum: circle = zero, bar = one).", `Inner: ${KIND[k].max}; outer: ${KIND[k].min} → <b>${KIND[k].label}</b>.`),
          });
        },
      },
      {
        name: "Draw the cardinality",
        make() {
          const k = U.pick(KINDS);
          const ctx = {
            one: "Each order must have exactly one payment (and never more than one).",
            zeroOne: "An order may carry a registered customer, but guest orders have none; never more than one.",
            oneMany: "Every order must contain at least one order line, and can contain many.",
            zeroMany: "A new store may have taken no orders yet, but over time takes many.",
          }[k];
          return Q.mc({
            q: `<p>Rule: <i>${ctx}</i></p><p>The marks at the end of the line should read <b>${KIND[k].label}</b>. Which marks do you draw?</p>`,
            right: KIND[k].marks, rightWhy: `Minimum ${KIND[k].min} and maximum ${KIND[k].max}.`,
            wrong: KINDS.filter(x => x !== k).map(x => ({ t: KIND[x].marks, why: `Those marks mean “${KIND[x].label}”.` })),
            keepOrder: MARKS,
            sol: S("Split the phrase: the first word is the minimum (zero → circle, one → bar), the second the maximum (one → bar, many → crow's foot).", `${KIND[k].label} → ${KIND[k].marks}.`),
          });
        },
      },
      {
        name: "Read a whole relationship",
        make() {
          const p = U.rotate("ch8-pair", PAIRS);
          const right = sentence(p);
          const cands = [];
          const seen = new Set([right]);
          const tryAdd = q => { const s = sentence(q); if (!seen.has(s) && cands.length < 3) { seen.add(s); cands.push({ t: s, why: diffWhy(p, q) }); } };
          tryAdd({ ...p, a: p.b, b: p.a });
          tryAdd({ ...p, b: kindOf(KIND[p.b].min === "zero" ? "one" : "zero", KIND[p.b].max) });
          tryAdd({ ...p, a: kindOf(KIND[p.a].min, KIND[p.a].max === "many" ? "one" : "many") });
          for (const x of U.shuffle(KINDS)) for (const y of U.shuffle(KINDS)) tryAdd({ ...p, a: x, b: y });
          return Q.mc({
            q: `<p>Which sentence correctly reads this relationship?</p>${relSVG(p.A, p.B, p.a, p.b)}`,
            right, rightWhy: `Next to ${p.B}: ${KIND[p.b].marks}; next to ${p.A}: ${KIND[p.a].marks}.`,
            wrong: cands,
            sol: S(`To say how many ${p.B}s one ${p.A} has, read the marks next to <b>${p.B}</b> (and vice versa).`, `Next to ${p.B}: ${KIND[p.b].label}. Next to ${p.A}: ${KIND[p.a].label}. Label: ${labelOf(p)}.`),
          });
        },
      },
      {
        name: "Rule → 1:1, 1:M or M:N",
        make() {
          const items = [...U.deal("ch8-r1", RULES.filter(r => r.cat === "1:1"), 1), ...U.deal("ch8-rm", RULES.filter(r => r.cat === "M:N"), 1), ...U.deal("ch8-r1m", RULES.filter(r => r.cat === "1:M"), 1), ...U.sample(RULES, 6)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
          return Q.classify({
            q: "<p>Give each business rule its relationship label.</p>",
            cats: ["1:1", "1:M", "M:N"],
            items: items.map(r => ({ t: r.t, cat: r.cat, why: r.why })),
            sol: S("Ask the maximum on each side: at most one, or many? Only maxima decide the label.", "One/one → 1:1; one/many → 1:M; many/many → M:N (resolve with an associative entity)."),
          });
        },
      },
      {
        name: "Count the one-to-many lines",
        make() {
          const rows = U.sample(PAIRS, 4);
          const target = U.pick(["1:M", "1:1", "M:N"]);
          const ans = rows.filter(r => labelOf(r) === target).length;
          const feet = rows.reduce((a, r) => a + (KIND[r.a].max === "many") + (KIND[r.b].max === "many"), 0);
          const traps = [];
          if (feet !== ans) traps.push({ value: feet, why: "That counts crow's feet, not relationships with this label." });
          const circles = rows.filter(r => KIND[r.a].min === "zero" || KIND[r.b].min === "zero").length;
          if (circles !== ans && circles !== feet) traps.push({ value: circles, why: "Circles describe the minimum (optional), which does not affect 1:1 / 1:M / M:N." });
          return Q.num({
            q: `<p>How many of these four relationships are <b>${target}</b>?</p>${relRows(rows)}`,
            answer: ans, kind: "count", unit: "relationships", traps,
            sol: S("Look only at the inner marks (maxima): bar = one, crow's foot = many. Circles do not change the label.", `${rows.map((r, i) => `${String.fromCharCode(65 + i)}: ${r.A}–${r.B} is ${labelOf(r)}`).join("; ")} → <b>${ans}</b> ${target}.`),
          });
        },
      },
      {
        name: "Select the statements the diagram supports",
        make() {
          const rows = U.sample(PAIRS.filter(p => labelOf(p) !== "M:N"), 3);
          const opts = [];
          rows.forEach(r => {
            const end = U.pick(["a", "b"]);
            const me = end === "a" ? r.A : r.B, other = end === "a" ? r.B : r.A;
            const truth = U.pick([true, false]);
            const k = truth ? r[end] : U.pick(KINDS.filter(x => x !== r[end]));
            opts.push({ t: readEnd(other, me, k) + ".", ok: truth, why: truth ? `The marks next to ${me} are ${KIND[k].marks}.` : `The marks next to ${me} are ${KIND[r[end]].marks}, meaning ${KIND[r[end]].label}, not ${KIND[k].label}.` });
          });
          if (!opts.some(o => o.ok)) {
            const r = rows[0];
            opts.push({ t: readEnd(r.A, r.B, r.b) + " (row A)", ok: true, why: `The marks next to ${r.B} are ${KIND[r.b].marks}.` });
          }
          const r = rows[1];
          const gen = U.pick([true, false]);
          opts.push(gen
            ? { t: `Row B is a ${labelOf(r)} relationship.`, ok: true, why: `Its maxima are ${KIND[r.a].max} and ${KIND[r.b].max}.` }
            : { t: `Row B is a ${labelOf(r) === "1:1" ? "1:M" : "1:1"} relationship.`, ok: false, why: `Its maxima are ${KIND[r.a].max} and ${KIND[r.b].max}, so it is ${labelOf(r)}.` });
          return Q.multi({
            q: `<p>Select <b>every</b> statement this diagram supports.</p>${relRows(rows)}`,
            options: opts,
            sol: S("For each statement, find the entity being counted and read the marks right next to it.", rows.map((x, i) => `${String.fromCharCode(65 + i)}: ${sentence(x)}`).join("<br>")),
          });
        },
      },
      K.tfVariant("True or false: min vs. max", "ch8-crow-tf", [
        { s: "The open circle answers the question “at most, one or many?”", truth: false, why: "The circle answers the minimum (“is zero allowed?”). The maximum comes from the bar or crow's foot.", hint: "Which question does each mark answer?" },
        { s: "A circle paired with a crow's foot means zero or many.", truth: true, why: "Circle = minimum zero; crow's foot = maximum many." },
        { s: "Two single bars at one end mean exactly one.", truth: true, why: "Minimum one and maximum one." },
        { s: "Adding an open circle to an end turns a one-to-many relationship into one-to-one.", truth: false, why: "The circle changes only the minimum; the relationship label depends on maxima." },
        { s: "The crow's foot next to Order on the Store–Order line means a store can have many orders.", truth: true, why: "Marks next to Order count orders per store." },
        { s: "The marks next to Customer on the Customer–Order line describe how many orders a customer has.", truth: false, why: "Marks next to Customer describe how many customers one order has (zero or one)." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 7 · BEAN & BYTE ERD + MICRO-DISRUPTIONS
   * ============================================================ */
  const BB_FK = [
    { key: "StoreID", in: ["Order", "Employee"], pk: "Store" },
    { key: "OrderID", in: ["OrderItem", "Payment"], pk: "Order" },
    { key: "EmployeeID", in: ["Order"], pk: "Employee" },
    { key: "ProductID", in: ["OrderItem"], pk: "Product" },
    { key: "CustomerID", in: ["Order"], pk: "Customer" },
  ];
  const MGR_Q = [
    { q: "How many units of each product did each store sell last month?", need: ["Order", "OrderItem", "Product", "Store"], why: "Store → Order (StoreID, OrderDate) → OrderItem (Quantity) → Product (ProductName)." },
    { q: "Which employee fulfilled the most orders this week?", need: ["Order", "Employee"], why: "Order holds EmployeeID and OrderDate; Employee gives the name." },
    { q: "What was yesterday's revenue by payment method?", need: ["Order", "Payment"], why: "Payment has PaymentMethod and PaymentAmount; the date lives on Order (OrderDate)." },
    { q: "List each registered customer's name and email with how many orders they have placed.", need: ["Customer", "Order"], why: "Customer has the name and email; Order holds CustomerID, so orders can be counted per customer." },
    { q: "What is total sales revenue by product category?", need: ["OrderItem", "Product"], why: "OrderItem has Quantity × PriceAtSale; Product has ProductCategory." },
    { q: "Which stores' employees hold the Shift Lead role?", need: ["Employee", "Store"], why: "Employee has Role and StoreID; Store gives the store name." },
  ];
  const DRAFTS = [
    { A: "Customer", B: "Order", a: "one", b: "zeroMany", right: "The Customer end should be zero or one: guest kiosk orders have no registered customer", wrong: [["Order should store CustomerName instead of CustomerID", "Names drift and repeat; the FK should stay CustomerID."], ["The Order end should be exactly one", "A registered customer can place many orders over time."], ["Nothing is wrong; every order must have a customer", "Bean &amp; Byte allows guest orders with only a PickupName, so a mandatory customer is wrong."]] },
    { A: "Order", B: "Product", a: "oneMany", b: "oneMany", right: "This M:N needs an associative entity (OrderItem) to hold Quantity and PriceAtSale", wrong: [["Add Product1–Product3 to Order", "That brings back the flat-file cap."], ["Change both ends to exactly one", "Orders really have many products and products are on many orders."], ["Store OrderID in Product", "A product is on many orders, so one OrderID per product row cannot work."]] },
    { A: "Order", B: "OrderItem", a: "one", b: "zeroOne", right: "The OrderItem end should allow many (one or many); as drawn an order could hold only one product", wrong: [["The Order end should be zero or many", "Each line belongs to exactly one order."], ["OrderItem should be removed", "It is the bridge that lets orders hold many products."], ["Nothing is wrong", "The catering order with 10 items could not be stored."]] },
    { A: "Store", B: "Order", a: "zeroOne", b: "zeroMany", right: "The Store end should be exactly one: every order is taken at one store", wrong: [["The Order end should be exactly one", "A store takes many orders."], ["Store should store OrderID", "The FK goes on the many side, Order (StoreID)."], ["Replace Store with a StoreName column on Order", "That reintroduces free-text store names that split reports."]] },
    { A: "Order", B: "Payment", a: "oneMany", b: "one", right: "The Order end should be exactly one: in the simplified model a payment settles exactly one order", wrong: [["The Payment end should be zero or many", "The simplified model has one payment per order."], ["Order should store PaymentMethod and Payment should be removed", "Payment is its own entity with its own attributes."], ["Nothing is wrong", "As drawn, one payment could cover many orders, contradicting the 1:1 rule."]] },
  ];
  const DISRUPT = [
    () => {
      const n = U.pick(NAMES);
      return { q: `During the 8 a.m. rush two different people enter the pickup name <b>${n}</b> at the kiosk. Later one calls about a wrong drink, and the manager cannot tell which order was theirs.`, right: `Keep PickupName on Order for calling out drinks, and add a Customer entity whose CustomerID is stored (optionally) on Order`, wrong: [[`Make PickupName unique, so only one “${n}” can order at a time`, "Customers can't be forced to have unique names, and it doesn't create identity across visits."], ["Delete PickupName and require every customer to register", "PickupName still serves fulfilment, and guests must be able to order."], ["Add a second PickupName column for nicknames", "More name fields add no stable identity."]], fail: "unstable identity" };
    },
    () => {
      const k = U.randInt(8, 14);
      return { q: `A department orders <b>${k}</b> different items for a meeting. The export has Product1–Product3, so ${k - 3} items vanish from the units report, though the payment total reconciles.`, right: "Add an OrderItem associative entity: one row per product on an order, with Quantity and PriceAtSale", wrong: [[`Expand the export to Product1–Product${k}`, "The next larger order breaks it again; the cap just moves."], ["Record the missing items in a Notes column", "Free-text notes can't be counted reliably."], ["Trust the payment total and ignore units", "Units and product mix drive purchasing; the money matching doesn't make them right."]], fail: "lost detail" };
    },
    () => {
      const v = U.sample(STORE_VARIANTS[0], 3);
      return { q: `Sales-by-store shows <b>${v.join("</b>, <b>")}</b> as three separate stores. There is only one store.`, right: "Create a Store entity with one controlled record per store, and store StoreID as a foreign key on Order", wrong: [["Run a find-and-replace on the spreadsheet each month", "It treats the symptom; new spellings appear next shift."], ["Rename the column from StoreName to Location", "Cosmetic; the free text still varies."], ["Add a drop-down note asking staff to spell it the same way", "Still relies on typing; no single record or key exists."]], fail: "repeated names" };
    },
  ];
  const SCOPE = [
    ["Order", "In the first ERD"], ["OrderItem", "In the first ERD"], ["Product", "In the first ERD"], ["Payment", "In the first ERD"], ["Employee", "In the first ERD"], ["Store", "In the first ERD"], ["Customer", "In the first ERD"],
    ["Supplier", "Left out for now"], ["Inventory", "Left out for now"], ["Customization", "Left out for now"], ["LoyaltyAccount", "Left out for now"], ["LoyaltyTransaction", "Left out for now"], ["Reward", "Left out for now"], ["DeliveryPartner", "Left out for now"], ["Channel (as its own entity)", "Left out for now"],
  ];
  const bbGen = STUDY.makeGenerator({
    id: "k201-ch8-beanbyte",
    name: "Reading & revising the Bean & Byte ERD",
    blurb: "Read the kiosk ERD, find where keys live, test it with managers' questions, and fix the three micro-disruptions.",
    variants: [
      {
        name: "Read the full ERD",
        make() {
          const l = U.pick(BB_LINKS);
          const end = U.pick(["a", "b"]);
          const me = end === "a" ? l.A : l.B, other = end === "a" ? l.B : l.A;
          const k = end === "a" ? l.ka : l.kb;
          return Q.mc({
            q: `<p>Bean &amp; Byte's first ERD:</p>${bbERD()}<p>On the line between <b>${l.A}</b> and <b>${l.B}</b>, how many <b>${me}</b> records can one <b>${other}</b> be linked to?</p>`,
            right: KIND[k].label, rightWhy: `The marks next to ${me} are ${KIND[k].marks}.`,
            wrong: KINDS.filter(x => x !== k).map(x => ({ t: KIND[x].label, why: `That would be drawn as ${KIND[x].marks}. ${x === (end === "a" ? l.kb : l.ka) ? `(That is the reading at the ${other} end.)` : ""}` })),
            keepOrder: LABELS,
            sol: S(`To count ${me} per ${other}, read the marks touching the <b>${me}</b> box.`, `Next to ${me}: ${KIND[k].marks} → <b>${KIND[k].label}</b>.`),
          });
        },
      },
      {
        name: "Where does this key live?",
        make() {
          const f = U.rotate("ch8-bbfk", BB_FK);
          return Q.multi({
            q: `<p>Using Bean &amp; Byte's ERD, select <b>every</b> entity that stores <b>${f.key}</b> as a <b>foreign key</b>.</p>${bbERD()}`,
            options: ENTS.map(e => ({ t: e, ok: f.in.includes(e), why: f.in.includes(e) ? `${e} is on the many (or dependent) side of a relationship with ${f.pk}.` : e === f.pk ? `${f.key} is ${e}'s primary key, not a foreign key.` : `${e} has no relationship to ${f.pk} that needs ${f.key}.` })),
            sol: S(`Find every line touching ${f.pk}. The entity at the far end of each line (the many side; for Order–Payment, Payment) stores ${f.key}.`, `${f.key} is the PK of ${f.pk} and an FK in ${f.in.join(" and ")}.`),
          });
        },
      },
      {
        name: "Fix the micro-disruption",
        make() {
          const d = U.rotate("ch8-dis", DISRUPT)();
          return Q.mc({
            q: `<p>${d.q}</p><p>Which design change fixes the cause?</p>`,
            right: d.right, rightWhy: `The cause is structural (${d.fail}); only a structural change removes it.`,
            wrong: d.wrong.map(([t, why]) => ({ t, why })),
            sol: S(`Name the failure first: repeated names, lost detail, or unstable identity? (This one is ${d.fail}.)`, `Structural fix: ${d.right}.`),
          });
        },
      },
      {
        name: "Evaluate a draft ERD",
        make() {
          const d = U.rotate("ch8-draft", DRAFTS);
          return Q.mc({
            q: `<p>A teammate drew this piece of the Bean &amp; Byte ERD:</p>${relSVG(d.A, d.B, d.a, d.b)}<p>What should be revised?</p>`,
            right: d.right, rightWhy: "It conflicts with a Bean &amp; Byte business rule.",
            wrong: d.wrong.map(([t, why]) => ({ t, why })),
            sol: S("Read each end, then compare it with the business rule. Do guests exist? Can an order hold many products? Is there one store per order?", `Revision: ${d.right}.`),
          });
        },
      },
      {
        name: "First ERD: in or out?",
        make() {
          const ins = U.sample(SCOPE.filter(s => s[1] === "In the first ERD"), 2);
          const outs = U.sample(SCOPE.filter(s => s[1] !== "In the first ERD"), 3);
          return Q.classify({
            q: "<p>Bean &amp; Byte's first ERD keeps the scope tight. Is each entity in the first ERD, or left out for now?</p>",
            cats: ["In the first ERD", "Left out for now"],
            items: U.shuffle([...ins, ...outs]).map(([t, c]) => ({ t, cat: c, why: c === "In the first ERD" ? "One of the seven core entities needed to record a kiosk order." : "Not needed to answer the first set of order questions; loyalty, supply and delivery come later." })),
            sol: S("The first ERD covers what a kiosk order needs: the order, its lines, products, payment, who made it, where, and (optionally) who bought it.", "In: Order, OrderItem, Product, Payment, Employee, Store, Customer. Out: Supplier, Inventory, Customization, LoyaltyAccount, LoyaltyTransaction, Reward, DeliveryPartner, Channel."),
          });
        },
      },
      {
        name: "Which entities answer the manager?",
        make() {
          const m = U.rotate("ch8-mgr", MGR_Q);
          return Q.multi({
            q: `<p>Manager's question: <i>${m.q}</i></p><p>Select <b>every</b> entity the query must use (and no extras).</p>`,
            options: ENTS.map(e => ({ t: e, ok: m.need.includes(e), why: m.need.includes(e) ? `Needed: ${m.why}` : `Not needed for this question. ${m.why}` })),
            sol: S("List the attributes the answer needs (names, dates, quantities, amounts), then find the entity that holds each, plus any bridge between them.", `${m.need.join(", ")}. ${m.why}`),
          });
        },
      },
      K.conceptVariant("Explain the design", "ch8-bbx", [
        { q: "Why is there no line drawn directly between Order and Product?", right: "Their M:N relationship is resolved through OrderItem, so each connects to OrderItem instead", rightWhy: "Order 1:M OrderItem and Product 1:M OrderItem together express the M:N.", wrong: [{ t: "Orders and products are unrelated", why: "They are related, through order lines." }, { t: "Product stores OrderID instead", why: "A product is on many orders; one OrderID per product row cannot work." }, { t: "The line was left off to save space", why: "Omitting it is deliberate design, not layout." }], sol: ["What label would an Order–Product line have?", "M:N, so an associative entity (OrderItem) replaces the direct line."] },
        { q: "Why is CustomerID on Order an optional foreign key?", right: "Guest kiosk orders have only a PickupName, so an order has zero or one registered customer", rightWhy: "The open circle at the Customer end allows zero.", wrong: [{ t: "Because every customer must register before ordering", why: "Then it would be mandatory, not optional." }, { t: "Because CustomerID is the primary key of Order", why: "OrderID is Order's PK; CustomerID is an FK." }, { t: "Because PickupName already identifies customers", why: "PickupName is not an identity." }], sol: ["Look at the marks next to Customer.", "Circle + bar: zero or one. Guests leave CustomerID empty."] },
        { q: "Which entity stores the foreign key in the 1:1 Order–Payment relationship (simplified model)?", right: "Payment stores OrderID", rightWhy: "In this model each payment points to the order it settles.", wrong: [{ t: "Order stores PaymentMethod", why: "PaymentMethod is an attribute of Payment, not a key." }, { t: "Neither; 1:1 relationships need no key", why: "Any relationship needs a key to connect the records." }, { t: "Both store each other's ID", why: "Redundant; one FK is enough and avoids conflicts." }], sol: ["In a 1:1 the design chooses a side for the FK.", "Bean &amp; Byte's model places OrderID in Payment."] },
        { q: "The kiosks worked fine all month, yet the sales report named the wrong top seller. Who is accountable for the number?", right: "The manager who relied on and signed off on the report; “the spreadsheet said so” is not a defense", rightWhy: "Managers own whether the data structure supports accurate reporting.", wrong: [{ t: "Nobody, because the kiosks were functioning", why: "Operating smoothly does not make the data structure reliable." }, { t: "Only the kiosk vendor", why: "The vendor's export may be flawed, but whoever uses the number owns the decision." }, { t: "The customers, for typing inconsistent names", why: "The design, not the customers, must handle identity." }], sol: ["Separate “the system runs” from “the structure supports accurate reports”.", "Whoever signs off on the number owns it."] },
      ]),
    ],
  });

  const generators = [procGen, eventsGen, structGen, flatGen, keysGen, crowGen, bbGen];

  STUDY.registerUnit(C, {
    id: "ch8", order: 8,
    title: "Chapter 8 · From Process to Data Blueprint: Designing a Trustworthy ERD",
    short: "Ch 8 · Designing an ERD",
    description: "Turn a business process into a trustworthy ERD: data events, entities and attributes, why flat files fail, PK/FK placement, associative entities and crow's foot cardinality, applied to Bean & Byte's kiosks.",
    notes, flashcards, cues, generators,
  });
})();
