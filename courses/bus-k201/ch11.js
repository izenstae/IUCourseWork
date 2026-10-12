/* ============================================================
 * BUS K201 · Chapter 11 · Choosing the Right Home for Business Data
 * Data shape (structured / semi-structured / unstructured), raw data
 * vs organized database records, reading nested app-activity JSON,
 * routing a source to its primary storage home, what each source can
 * and cannot prove on its own, data lakes vs warehouses, and the
 * human judgment call on the Crimson Campus Hoodie (VVMG case).
 * Explanations, examples and question wording are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "bus-k201";
  const { S, sortVariants, conceptVariant, tfVariant } = STUDY.k201;

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pad2 = n => String(n).padStart(2, "0");
  const pad4 = n => String(n).padStart(4, "0");
  /* Pretty-print an object as JSON inside a code block (one line per event), safe for the HTML checker. */
  function codeJSON(obj) {
    const txt = JSON.stringify(obj, null, 2).replace(/\{\n\s+"event_id"[^{}]*?\n\s+\}/g, m => m.replace(/\n\s+/g, " "));
    const lines = txt.split("\n").map(line => {
      const m = line.match(/^( *)(.*)$/);
      return "&nbsp;".repeat(m[1].length) + esc(m[2]);
    });
    return `<div class="code"><code>${lines.join("<br>")}</code></div>`;
  }
  /* Build a two-dimensional HTML table. */
  function table(head, rows) {
    return `<table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  /* ============================================================
   * App-activity JSON generator (customer → session → event)
   * ============================================================ */
  const PRODUCT_IDS = ["P101", "P102", "P107", "P115", "P120", "P133"];
  const LOCATION_IDS = ["L01", "L02", "L03", "L04", "L05"];
  const PROMO_IDS = ["HOODIE15", "GAMEDAY10", "FRESH20", "BUNDLE5"];
  const SEARCHES = ["where is VVMG", "crimson hoodie", "truck today", "hoodie medium", "game day hours", "popup kirkwood"];
  const EVENT_TYPES = ["product_viewed", "coupon_saved", "location_checked", "search_submitted", "cart_started", "cart_abandoned", "coupon_redeemed"];
  const EVENT_MEANING = {
    product_viewed: "opened a product page",
    coupon_saved: "saved a coupon to use later",
    location_checked: "looked up a truck or pop-up location",
    search_submitted: "ran a search in the app",
    cart_started: "began building a cart",
    cart_abandoned: "left a cart without checking out",
    coupon_redeemed: "used a coupon on an order",
  };
  /* Which VVMG table an identifier inside an event points to. */
  const ID_TABLE = {
    product_id: "Products", promotion_id: "Promotions", location_id: "Locations",
    order_id: "Orders", customer_id: "Customers",
  };

  let orderSeq = 5000;
  function makeEvent(type) {
    const e = { event_id: "", event_type: type };
    if (type === "product_viewed") e.product_id = U.pick(PRODUCT_IDS);
    if (type === "coupon_saved") e.promotion_id = U.pick(PROMO_IDS);
    if (type === "location_checked") e.location_id = U.pick(LOCATION_IDS);
    if (type === "search_submitted") e.search_text = U.pick(SEARCHES);
    if (type === "cart_started") { e.product_id = U.pick(PRODUCT_IDS); e.cart_total_estimated = U.pick([38, 42.5, 49, 54, 64, 71.5, 88, 96]); }
    if (type === "coupon_redeemed") { e.promotion_id = U.pick(PROMO_IDS); e.order_id = "O" + (orderSeq = orderSeq + U.randInt(3, 40)); }
    return e;
  }
  /* A session's events in a plausible order. */
  function sessionEvents(opts) {
    const n = U.randInt(2, 4);
    const pool = ["product_viewed", "product_viewed", "coupon_saved", "location_checked", "search_submitted", "cart_started", "coupon_redeemed"];
    let types = [];
    for (let i = 0; i < n; i++) types.push(U.pick(pool));
    if (opts && opts.abandon) types = types.filter(t => t !== "cart_started" && t !== "coupon_redeemed").slice(0, 2).concat(["cart_started", "cart_abandoned"]);
    const out = [];
    types.forEach(t => {
      out.push(makeEvent(t));
      if (t === "cart_started" && !(opts && opts.abandon) && Math.random() < 0.5) out.push(makeEvent("cart_abandoned"));
    });
    return out;
  }
  /* makeLog({ guest, abandon }) → { obj, sessions:[{ session_id, customer_id, events }] } */
  function makeLog(opts = {}) {
    orderSeq = U.randInt(4100, 4800);
    const nKnown = U.randInt(1, 2);
    const guest = opts.guest != null ? opts.guest : Math.random() < 0.7;
    const custIds = U.sample(["C004", "C011", "C017", "C021", "C026", "C033", "C038", "C045"], nKnown);
    const blocks = custIds.map(id => ({ customer_id: id, n: U.randInt(1, 2) }));
    if (guest) blocks.splice(U.randInt(0, blocks.length), 0, { customer_id: null, n: 1 });
    let sid = U.randInt(1, 60), eid = U.randInt(1, 300), day = U.randInt(5, 26), hour = U.randInt(9, 13);
    const sessions = [];
    const abandonAt = opts.abandon ? U.randInt(0, blocks.reduce((a, b) => a + b.n, 0) - 1) : -1;
    const obj = { app_activity: blocks.map(b => {
      const ss = [];
      for (let i = 0; i < b.n; i++) {
        const evs = sessionEvents({ abandon: sessions.length === abandonAt });
        evs.forEach(e => { e.event_id = "E" + pad4(eid); eid += U.randInt(1, 3); });
        const s = { session_id: "S" + pad4(sid), started_at: `2026-09-${pad2(day)}T${pad2(hour)}:${pad2(U.randInt(0, 59))}`, events: evs };
        sid += U.randInt(1, 9); hour += U.randInt(0, 2);
        ss.push(s);
        sessions.push({ session_id: s.session_id, customer_id: b.customer_id, events: evs });
      }
      return { customer_id: b.customer_id, sessions: ss };
    }) };
    return { obj, sessions };
  }
  const allEvents = log => log.sessions.flatMap(s => s.events);

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Why choosing a home for data is a business decision",
      lo: "Explain why where data is stored shapes what a team can conclude, using the VVMG Crimson Campus Hoodie case.",
      html: `<p><b>Valid Varsity Mobile Goods (VVMG)</b> sells student apparel, accessories and event merchandise in Bloomington through a mobile truck, pop-up shops and an app. Each month the team plans what the truck carries, which products to feature and which pop-up spots to revisit.</p>
<p>The <b>Crimson Campus Hoodie</b> barely sold at a game-day event. Read alone, the sales records say "cut it." The real question is sharper: did it sell poorly because students <em>did not want it</em>, or because they <em>had no chance to buy it</em> (sold out, wrong location, not on the truck)?</p>
<p>The sales records are not wrong. They are <b>accurate within their scope</b>: they capture completed purchases. They are silent about everything that did not end in a purchase: product views, saved coupons, location look-ups, questions to staff, items students wanted that were not available. Other sources fill those gaps:</p>
${ul(["<b>App activity</b> shows interest and behaviour (what people looked at, saved, searched for, put in a cart).",
  "<b>Customer comments</b> show sentiment and the reasons people give in their own words.",
  "<b>Staff pop-up notes</b> explain operating conditions, for example that a size ran out by noon.",
  "<b>Sales/order records</b> remain the only proof of a completed sale."])}
<p>Each source has a different <em>shape</em>, so each needs a suitable home. Put a source in the wrong environment and you can flatten nested activity, strip away context, or invite misleading comparisons. Leave a source out and a weak recommendation can look well supported.</p>
<div class="keyidea"><b>Key idea.</b> A record can be accurate and still incomplete for the decision. Choosing where each source lives (and keeping it connected through shared identifiers) is a managerial judgment about what the team will be able to see.</div>
<div class="example"><b>Example.</b> A food-truck owner sees only 4 veggie wraps sold on Tuesday. The register is correct. But a note from the cook says the wrap tortillas ran out at 11:30. "Nobody wants wraps" and "we could not sell wraps" are both consistent with the register; only the note tells them apart.</div>
<div class="trap"><b>Common trap.</b> Treating "the most complete-looking table" as the whole story, or reaching for the newest, most complicated storage technology. The right home is the one that fits the source and the decision; newest and most complicated rarely wins.</div>`,
      gens: ["k201-ch11-prove", "k201-ch11-judge"],
    },
    {
      title: "Structured, semi-structured and unstructured data",
      lo: "Distinguish structured, semi-structured and unstructured data, classifying both a source and its individual fields.",
      html: `<p>Data <b>shape</b> describes how organized the data is when you receive it.</p>
${ul([
  "<b>Structured</b>: consistent fields, defined data types and established rules; each row is one clearly identified record. VVMG's Customers, Products, Orders, OrderItems, Locations and Promotions tables are structured.",
  "<b>Semi-structured</b>: organized with labels or keys, but fields may repeat, nest or vary from record to record. The app-activity export in <b>JSON</b> (JavaScript Object Notation, a common text format for app and web data) is semi-structured: one customer holds sessions, each session holds a list of events, and different event types carry different fields.",
  "<b>Unstructured</b>: no consistent fields to organize the content: free text, images, audio, video. The text a customer types into a comment box, a staff member's narrative note, photos of a pop-up display, voice memos.",
])}
<p>A single source can mix shapes. VVMG's comments file and pop-up-notes file are CSVs: every row has an ID, a date and identifiers such as CustomerID or LocationID (structured), plus one text field holding whatever sentence someone wrote (unstructured). So classify <b>both</b> the organization of the source <b>and</b> the content of each field.</p>
<p>Shape changes the work. Structured data is easy to filter, total, join and validate, but rigid when records differ. Semi-structured data keeps nesting and varying detail, but must be unpacked before you can count or compare. Unstructured data carries rich context and reasons, but must be read, coded or summarized by people (or tools) before it can be compared.</p>
<div class="keyidea"><b>Key idea.</b> Ask two questions: how is the <em>source</em> organized, and what is inside each <em>field</em>? Shape says nothing about value: a messy comment can matter more than a tidy table.</div>
<div class="example"><b>Example.</b> A gym's class-feedback file has columns MemberID, ClassID, Rating (1–5) and Comment. MemberID, ClassID and Rating are structured fields; Comment ("The 6 a.m. spin class was overbooked again") is unstructured. The file as a whole is structured rows wrapping an unstructured field.</div>
<div class="trap"><b>Common trap.</b> Calling JSON "unstructured" because it is not a table, or calling a CSV "structured" without looking inside its text column. JSON has labels and keys (semi-structured); a CSV can still carry free text.</div>`,
      gens: ["k201-ch11-shape", "k201-ch11-json"],
    },
    {
      title: "Raw data vs organized database records",
      lo: "Distinguish raw data from organized database records and explain why tables do not make data trustworthy.",
      html: `<p><b>Raw data</b> is kept close to the form in which it was first collected, before anyone cleans, reorganizes or summarizes it: last night's app export as delivered, a staff note as typed, a photo as taken.</p>
<p><b>Organized database records</b> are arranged into <b>defined fields</b> with <b>data types</b> and <b>relationships</b>: an Orders row with a date-typed OrderDate whose CustomerID must match a row in Customers.</p>
<p>These are <b>two different dimensions</b>, not two ends of one line. Raw data can be stored in a database (comment text loaded into a column exactly as typed). Data can also be processed without being database records (an analyst's cleaned weekly summary in a spreadsheet).</p>
<p>And organization is not the same as quality. Any source, raw or organized, can be:</p>
${ul(["<b>incomplete</b>: records or values are missing (cash sales during an outage were never entered);",
  "<b>inaccurate</b>: values are wrong ($4.99 typed for a $49.99 hoodie);",
  "<b>insufficient for the decision</b>: accurate, but it does not cover what the question needs (sales do not show students who wanted the hoodie and could not get it)."])}
<p>Shared <b>identifiers</b> (CustomerID, ProductID, PromotionID, LocationID, OrderID) let sources connect without forcing them into one table. VVMG's workbook documents this with a <b>Data_Dictionary</b> (field meanings, data types, key identifiers), a <b>Relationship_Map</b> (how IDs connect the tables) and a <b>Source_Guide</b> (how the structured workbook compares with app activity, comments and notes).</p>
<div class="keyidea"><b>Key idea.</b> Tables do not make data trustworthy. Fields, types and relationships make data <em>organized</em>; whether it is complete, accurate and sufficient is a separate question.</div>
<div class="example"><b>Example.</b> A campus bookstore's Orders table passes every database rule, yet the card reader was offline for two hours, so those sales were rung up on paper and never entered. The table is organized and internally consistent, and it is still incomplete.</div>
<div class="trap"><b>Common trap.</b> Thinking "raw" means "bad" and "in a database" means "verified." Raw data is often exactly what you want to keep for future questions, and a neat table can still hold wrong or missing values.</div>`,
      gens: ["k201-ch11-rawdb"],
    },
    {
      title: "Reading nested app-activity JSON",
      lo: "Read a nested JSON record of customers, sessions and events and say what connects to which table.",
      html: `<p>VVMG's app activity nests three levels:</p>
${ul(["<b>Customer</b>: <code>customer_id</code> (for example C021). A <b>guest</b> session has <code>customer_id: null</code> but still has its own session_id and events.",
  "<b>Session</b>: one visit to the app, with a <code>session_id</code> and a start time.",
  "<b>Event</b>: one action inside a session, with an <code>event_id</code> and an <code>event_type</code>."])}
<p>Event types and the extra field each tends to carry:</p>
${table(["event_type", "What the person did", "Event-specific field"], [
  ["product_viewed", "opened a product page", "product_id → Products"],
  ["coupon_saved", "saved a coupon for later", "promotion_id → Promotions"],
  ["location_checked", "looked up a location", "location_id → Locations"],
  ["search_submitted", "ran a search", "search_text (free text, e.g. \"where is VVMG\")"],
  ["cart_started", "began a cart", "cart_total_estimated (a projection)"],
  ["cart_abandoned", "left without checking out", "(none needed)"],
  ["coupon_redeemed", "used a coupon on an order", "promotion_id, order_id → Orders"],
])}
<p>To read it: count sessions by counting <code>session_id</code> values (not customers: one customer can have several sessions, and guests are sessions too). Count events by counting <code>event_id</code> values across every session. Then follow the identifiers to the tables they connect to.</p>
<div class="keyidea"><b>Key idea.</b> Nesting is the reason this is semi-structured: one customer → many sessions → many events, and each event type carries different fields. Flattening it into one fixed-column table would either lose detail or create columns that are empty most of the time.</div>
<div class="example"><b>Example.</b> A guest session with events product_viewed (P101) → cart_started (estimated $49) → cart_abandoned tells you an anonymous visitor wanted the hoodie enough to start a cart. It records <em>no revenue</em> and cannot be tied to a CustomerID.</div>
<div class="trap"><b>Common trap.</b> Treating <code>cart_total_estimated</code> as money received, or dropping guest sessions because they have no customer_id. The estimate is a projection; guest sessions are still real visits with real events.</div>`,
      gens: ["k201-ch11-json"],
    },
    {
      title: "Routing a source to its primary storage home",
      lo: "Recommend a primary storage home (relational table, document/JSON-style store, restricted repository or archive) using the routing questions.",
      html: `<p>Not every useful data source belongs in a relational table. Four primary homes cover VVMG's sources:</p>
${ul(["<b>Relational table</b>: fixed fields, relationships that must be enforced, one authoritative record per entity or event. An order item must point to an existing order and an existing product.",
  "<b>Document / JSON-style store</b>: nested or repeating information and records whose fields differ. App activity lives here.",
  "<b>Restricted repository</b>: current information that needs controlled access or limited approved use, such as customer comments and staff notes.",
  "<b>Archive</b>: older records kept mainly for retention or recordkeeping, not for active review."])}
<p>Work through the <b>routing questions</b>, and weigh the answers together:</p>
<ol>
<li>Does every record have the <b>same fixed fields</b>? (Orders: yes. App events: no.)</li>
<li>Is there <b>one clearly defined record per row</b>, or is information nested and repeating?</li>
<li>Is the content mostly <b>defined values</b> or <b>free text</b>? (CommentText holds a sentence, not a value from a list.)</li>
<li>Must <b>relationships or business rules be enforced</b>? (Every order item must point to a real order and product.)</li>
<li><b>Who may access it, and how will it be used?</b> (Comments and notes need control; old, rarely reviewed records go to an archive.)</li>
</ol>
<p>A storage decision is more than a location: it also names who gets access, how long the data is kept and what uses are approved.</p>
<div class="keyidea"><b>Key idea.</b> Fixed fields + enforced relationships → relational. Nested or varying records → document/JSON store. Sensitive, current, controlled use → restricted repository. Old, kept for retention → archive.</div>
<div class="example"><b>Example.</b> A Promotions row defines HOODIE15 once (code, discount, dates): relational. Every time a student saves or redeems HOODIE15, that is a repeated customer action inside app activity: document store. PromotionID connects them, but they belong in different homes.</div>
<div class="trap"><b>Common trap.</b> Answering one routing question and stopping. Comments have fixed ID columns (question 1 says "some"), but their main content is free text with controlled access (questions 3 and 5), so the primary home is a restricted repository, not a plain relational table.</div>`,
      gens: ["k201-ch11-route"],
    },
    {
      title: "What each source can and cannot prove alone",
      lo: "State what each VVMG source can and cannot prove on its own, and keep interest separate from completed sales.",
      html: `<p>VVMG's source inventory lists each source's shape, whether its fields are fixed, whether there is one record per row, its key identifiers, its recommended home, the business reason and, most importantly, <b>what it cannot prove alone</b>.</p>
${table(["Source", "Can show", "Cannot prove alone"], [
  ["Sales/order records (Orders + OrderItems)", "completed purchases, quantities, revenue", "interest from people who did not buy, or why they did not"],
  ["Product catalog (Products)", "what exists, list price, category", "demand for any product"],
  ["App activity (JSON)", "views, saves, searches, carts: interest and behaviour", "a completed sale or revenue"],
  ["Customer comments", "sentiment and stated reasons", "how widespread a view is (vocal few)"],
  ["Pop-up notes", "operating conditions at one event (sold out, wrong table spot)", "what happened at other locations, or sales totals"],
])}
<p>Customers, Locations and Promotions are supporting reference tables that give the IDs meaning.</p>
<p>App activity is a funnel of different <em>stages</em>: view → coupon save → cart start → (abandon or check out). An abandoned cart shows interest, not revenue. <code>cart_total_estimated</code> is a projection, not money received. Only a completed order record records revenue. That is why app activity stays separate from sales: you need to compare interest with purchases, not add them together.</p>
<div class="keyidea"><b>Key idea.</b> None of the interest sources proves a completed sale, and none of them substitutes for sales records. Sales records, in turn, cannot see the demand that never became a sale.</div>
<div class="example"><b>Example.</b> In one week 140 students viewed the hoodie, 35 saved HOODIE15, 22 started carts and 6 completed orders. Hoodie sales are 6, not 203. The gap between 22 carts and 6 orders is the interesting part: was it price, sizes, or no truck nearby?</div>
<div class="trap"><b>Common trap.</b> Adding views, saves and cart starts into a "sales" count, or summing estimated cart totals as revenue. Those are earlier stages of interest, not purchases.</div>`,
      gens: ["k201-ch11-prove"],
    },
    {
      title: "Data lakes, data warehouses and when a lake is justified",
      lo: "Distinguish a data lake from a data warehouse and evaluate when a lake is worth reaching for.",
      html: `<p>A <b>data lake</b> stores varied raw sources together, close to the form in which they arrived (structured exports, JSON, text, images), without reshaping them first. Think of a <em>receiving area</em>: it accepts sources before every question is known.</p>
<p>A <b>data warehouse</b> holds prepared data: structured, cleaned, standardized and organized for recurring reports. Think of <em>organized shelving</em>. The difference is <b>readiness</b>.</p>
<p>For VVMG, the relational database stays the authoritative home for sales. A lake would be an <em>optional additional</em> environment holding selected copies; a warehouse becomes relevant later if standardized recurring reports develop. Neither replaces the primary homes.</p>
<p>A lake is justified when these conditions point toward it rather than toward a simpler approach:</p>
${table(["Criterion", "Points to a lake", "Points to something simpler"], [
  ["Variety of sources", "decisions repeatedly need several differently shaped sources together", "one or a few stable sources"],
  ["Original versions", "originals must be kept for future, unknown questions", "selected fields or extracts are enough"],
  ["Changing questions", "questions keep changing and analysts need the original data", "stable recurring reports can be prepared in advance"],
  ["Volume / frequency / variety", "repeated extraction and manual combining become impractical", "existing tools manage fine"],
  ["Governance readiness", "ownership, access, retention and approved use are defined", "these are not defined: simpler is safer"],
])}
<div class="keyidea"><b>Key idea.</b> Size, free text or JSON alone do not settle it. Weigh the criteria together, and remember that a lake supports access; people still decide what the data means.</div>
<div class="example"><b>Example.</b> A regional bike-share firm keeps changing what it studies (weather vs rides, app complaints, dock photos), needs years of untouched trip logs, receives millions of records a day, and has named data owners and retention rules. A lake fits. A single coffee cart with one sales export and a monthly report does not need one.</div>
<div class="trap"><b>Common trap.</b> "We have different data shapes, so we need a lake." Different shapes are handled by choosing the right primary home for each; a lake is justified only when the criteria, including governance, line up.</div>`,
      gens: ["k201-ch11-lake"],
    },
    {
      title: "Human judgment: disruptions and act, pause or investigate",
      lo: "Spot common reasoning errors about VVMG's sources and choose to act, pause, or investigate while planning.",
      html: `<p>Four tempting moves sound reasonable but are wrong:</p>
${ul(["<b>\"Promotions and coupon events are the same thing.\"</b> The Promotions table stores one definition per offer (HOODIE15). Saves and redemptions are repeated customer actions in app activity. PromotionID links them; they live in different homes.",
  "<b>\"Add the app events to the sales count.\"</b> product_viewed, coupon_saved and cart_started are different stages, not sales.",
  "<b>\"Look how excited the comments are, so demand is proven.\"</b> Comments come from a vocal few, and a pop-up note describes one location.",
  "<b>\"Our sources have different shapes, so we need a data lake.\"</b> Shape alone does not justify a lake."])}
<p>Two opposite risks frame the hoodie decision:</p>
${ul(["<b>Risk 1, treating low sales as low interest</b>: cutting the hoodie without checking availability, app activity, or students who tried and failed to find it.",
  "<b>Risk 2, treating interest as completed demand</b>: restocking heavily because of views, saves and enthusiastic comments."])}
<p>The human in the loop then makes one of three calls:</p>
${ul(["<b>Act</b>: the evidence is sufficient and consistent; go ahead.",
  "<b>Pause</b>: hold the decision because the evidence is too conflicting, unreliable or missing to act on, and waiting is acceptable.",
  "<b>Investigate while planning</b>: make a cautious decision now (the plan is due) while collecting specific evidence that would confirm or change it."])}
<div class="keyidea"><b>Key idea.</b> Data environments support access; people decide. Name what each source can prove, avoid both risks, and match the call to the strength of the evidence.</div>
<div class="example"><b>Example.</b> Notes say the hoodie sold out of mediums by noon at one pop-up, and app views spiked, but sales are low and the monthly plan is due Friday. Investigate while planning: keep a modest quantity in the plan and track whether students who check its location go on to buy.</div>
<div class="trap"><b>Common trap.</b> Thinking "investigate while planning" means doing nothing until the research is finished. That is pausing. Investigating while planning commits to a cautious decision <em>and</em> names the evidence to collect.</div>`,
      gens: ["k201-ch11-judge"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const fc = (id, tag, front, back) => ({ id: "k201-ch11-c-" + id, tag, front, back });
  const flashcards = [
    fc("structured", "Definition", "What is <em>structured</em> data?", "Data with consistent fields, defined data types and established rules, where each row is one clearly identified record (e.g., VVMG's Orders or Products tables)."),
    fc("semistructured", "Definition", "What is <em>semi-structured</em> data?", "Data organized by labels or keys, but whose fields may repeat, nest or vary between records, e.g., app-activity JSON with customers → sessions → events."),
    fc("unstructured", "Definition", "What is <em>unstructured</em> data? Give three examples.", "Content without consistent fields: free text (comment or note text), images (pop-up display photos), audio (staff voice memos), video."),
    fc("mixed", "Distinction", "Why must you classify both a source <em>and</em> its fields?", "One source can mix shapes. VVMG's comments CSV has structured rows and identifiers (CommentID, CustomerID, date) plus an unstructured CommentText field."),
    fc("json", "Definition", "What is JSON, and why is app-activity JSON semi-structured?", "JavaScript Object Notation, a common text format for app and web data. It has labeled fields, but records can nest, repeat (lists of events) and vary (different fields per event type)."),
    fc("raw", "Definition", "What is <em>raw data</em>?", "Data kept close to the form in which it was first collected, before cleaning, reorganizing or summarizing."),
    fc("organized", "Definition", "What are <em>organized database records</em>?", "Data arranged into defined fields with data types and relationships (e.g., an OrderItems row whose ProductID must match a Products row)."),
    fc("twodim", "Distinction", "Why are \"raw\" and \"organized in a database\" two separate dimensions?", "Raw data can sit inside a database (comment text loaded unchanged), and processed data can sit outside one (a cleaned summary spreadsheet). Neither dimension says whether data is trustworthy."),
    fc("trust", "Principle", "\"Tables do not make data trustworthy.\" Explain.", "Defined fields and relationships organize data, but any table can still be incomplete (missing records), inaccurate (wrong values) or insufficient for the decision."),
    fc("scope", "Principle", "What does \"accurate within its scope, incomplete for the decision\" mean for the hoodie?", "Sales records correctly capture completed purchases, but they cannot see views, saved coupons, searches or students who wanted the hoodie when it was unavailable."),
    fc("ids", "List", "Which identifiers connect VVMG's sources?", "CustomerID, ProductID, PromotionID, LocationID and OrderID. They let sources connect without forcing everything into one table."),
    fc("workbook", "List", "What do the Data_Dictionary, Relationship_Map and Source_Guide sheets do?", "Data_Dictionary: field meanings, data types and key identifiers. Relationship_Map: how IDs connect tables. Source_Guide: compares the structured workbook with app activity, comments and notes."),
    fc("nesting", "Example", "Describe the nesting in VVMG app activity.", "Customer (customer_id) → Session (session_id, start time; one visit) → Event (event_id, event_type, plus event-specific fields such as product_id or location_id)."),
    fc("guest", "Example", "What is a guest session, and should you drop it?", "A session whose customer_id is null. It still has a session_id and events, so it is real activity. Keep it; it simply cannot be tied to a Customers row."),
    fc("events", "List", "Name the seven VVMG app event types.", "product_viewed, coupon_saved, location_checked, search_submitted, cart_started, cart_abandoned, coupon_redeemed."),
    fc("cartest", "Distinction", "Why is cart_total_estimated not revenue?", "It is a projection of what a cart would cost. Abandoned carts show interest; only a completed order record records money actually received."),
    fc("homes", "List", "What are the four primary storage homes in this chapter?", "Relational table, document/JSON-style store, restricted repository, archive."),
    fc("relational", "Principle", "When does a relational table fit?", "When records have fixed fields, relationships must be enforced, and there should be one authoritative record per entity or event (e.g., each order item points to a real order and product)."),
    fc("docstore", "Principle", "When does a document/JSON-style store fit?", "When information is nested or repeating, or records carry different fields, such as sessions holding varying lists of events."),
    fc("restricted", "Distinction", "Restricted repository vs archive: what is the difference?", "A restricted repository holds current information that needs controlled access or limited approved use (comments, staff notes). An archive holds older records kept mainly for retention, not active review."),
    fc("routing", "List", "List the five routing questions.", "1) Same fixed fields for every record? 2) One defined record per row, or nested/repeating? 3) Defined values or free text? 4) Must relationships/business rules be enforced? 5) Who may access it and how will it be used?"),
    fc("decision", "Principle", "Besides a location, what else does a storage decision name?", "Who gets access, how long the data is kept (retention) and which uses are approved."),
    fc("promo", "Distinction", "Promotions table vs coupon events: why different homes?", "Promotions stores one definition per offer (HOODIE15) in a relational table; coupon saves and redemptions are repeated customer actions in app activity. PromotionID connects them."),
    fc("cannot", "Example", "What can each source NOT prove alone?", "Sales: interest that did not convert. App activity: completed sales. Comments: how widespread a view is. Pop-up notes: conditions at other locations or totals. Catalog: demand."),
    fc("lake", "Definition", "What is a data lake?", "A store that keeps varied raw sources together close to arrival form (exports, JSON, text, images) without reshaping first: a receiving area for questions not yet known."),
    fc("warehouse", "Definition", "What is a data warehouse, and how does it differ from a lake?", "Prepared, structured, cleaned and standardized data organized for recurring reports (organized shelving). The difference is readiness."),
    fc("lakecrit", "List", "Name the five conditions that justify a data lake.", "1) Decisions repeatedly need several differently shaped sources together. 2) Originals must be kept for unknown future questions. 3) Questions change and analysts need original data. 4) Volume/frequency/variety make repeated extraction impractical. 5) Governance (ownership, access, retention, approved use) is defined."),
    fc("lakewhy", "Principle", "Does having JSON, free text and tables mean VVMG needs a lake?", "No. Shape, size or free text alone do not settle it. Each shape gets a primary home; a lake is an optional extra holding copies, justified only when the criteria line up."),
    fc("risks", "Distinction", "Risk 1 vs Risk 2 in the hoodie decision?", "Risk 1: treating low sales as low interest (cutting without checking availability or app activity). Risk 2: treating interest as completed demand (restocking heavily on views, saves and comments)."),
    fc("calls", "List", "What are the three human-in-the-loop calls?", "Act (evidence sufficient and consistent), Pause (hold: evidence too conflicting, unreliable or missing, and waiting is acceptable), Investigate while planning (cautious decision now while collecting specific evidence)."),
    fc("comments", "Principle", "Why don't enthusiastic comments prove demand?", "Comments come from a vocal few who chose to write, and a pop-up note describes one location; neither measures how many people would buy."),
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "Same columns on every row, data types, \"one record per row\"", think: "Structured → relational table", why: "Fixed fields and enforceable relationships are what relational tables do best." },
    { when: "Keys and labels, but nested lists, repeating events, fields that vary", think: "Semi-structured → document/JSON store", why: "Flattening nesting into fixed columns loses detail or creates mostly empty columns." },
    { when: "A sentence someone typed, a photo, a voice memo", think: "Unstructured", why: "No consistent fields organize the content itself." },
    { when: "A CSV with IDs and dates plus a text column", think: "Mixed: structured rows + unstructured field", why: "Classify the source's organization and each field's content separately." },
    { when: "\"It's in a table, so it's reliable\"", think: "Tables do not make data trustworthy", why: "Organized data can still be incomplete, inaccurate or insufficient for the decision." },
    { when: "\"As exported\", \"untouched\", \"before cleaning\"", think: "Raw data", why: "Rawness is about how close to its original form the data is, not where it is stored." },
    { when: "customer_id: null", think: "Guest session", why: "Still a real session with a session_id and events; it just cannot link to a Customers row." },
    { when: "cart_total_estimated, abandoned cart", think: "Interest, not revenue", why: "Only a completed order record records money received." },
    { when: "Views + saves + carts added into a \"sales\" count", think: "Different funnel stages", why: "Keep app activity separate from sales so interest can be compared with purchases." },
    { when: "Current staff notes or customer comments; who may see them?", think: "Restricted repository", why: "Controlled access and limited approved use matter more than the shape." },
    { when: "Old records rarely opened, kept for retention", think: "Archive", why: "The main purpose is recordkeeping, not active review." },
    { when: "HOODIE15 defined once vs saved/redeemed many times", think: "Promotions table vs app events", why: "A definition and a repeated customer action belong in different homes, linked by PromotionID." },
    { when: "\"We have many data shapes, let's build a lake\"", think: "Check the five lake criteria", why: "Shape alone is not enough; variety, originals, changing questions, volume and governance must line up." },
    { when: "Raw, varied, before questions are known vs cleaned for recurring reports", think: "Data lake vs data warehouse", why: "Receiving area vs organized shelving: the difference is readiness." },
    { when: "Low sales → \"nobody wants it\"", think: "Risk 1: low sales ≠ low interest", why: "Check availability, app activity and students who tried to buy before cutting." },
    { when: "Plan is due now, but key evidence is still coming", think: "Investigate while planning", why: "Make a cautious decision and name the specific evidence to collect." },
  ];

  /* ============================================================
   * TOPIC 1 · Data shape
   * ============================================================ */
  const SHAPE_DEFS = {
    "Structured": "consistent fields, defined data types and rules; one clearly identified record per row",
    "Semi-structured": "labels or keys, but fields may nest, repeat or vary between records",
    "Unstructured": "free text, images, audio or video with no consistent fields organizing the content",
  };
  const SHAPE_BANK = [
    { t: "VVMG's Orders table: OrderID, CustomerID, OrderDate and LocationID filled in on every row", cat: "Structured", why: "Every row has the same typed fields and represents one identified order." },
    { t: "OrderItems rows, each tying one OrderID to one ProductID with a quantity and unit price", cat: "Structured", why: "Fixed fields, defined types, and each row is one clearly identified line item." },
    { t: "The Products catalog listing ProductID, name, category and list price", cat: "Structured", why: "Consistent columns with defined types; one product per row." },
    { t: "The Locations table with LocationID, spot name and address for each pop-up site", cat: "Structured", why: "Every location is one row with the same fixed fields." },
    { t: "The Promotions table: one row per offer such as HOODIE15, with discount and start/end dates", cat: "Structured", why: "Each offer is one record with the same typed fields." },
    { t: "The CustomerID column inside the customer-comments CSV", cat: "Structured", why: "An identifier field with a defined format on every row; it is the comment text, not this column, that is unstructured." },
    { t: "A Rating column in a feedback file that only accepts whole numbers 1 to 5", cat: "Structured", why: "A defined data type limited to predefined values." },
    { t: "The SubmittedDate column in the pop-up notes file", cat: "Structured", why: "A date-typed field present on every row." },
    { t: "The app-activity export: customers containing sessions containing lists of events", cat: "Semi-structured", why: "Labeled keys organize it, but records nest and repeat to varying depth." },
    { t: "App events where product_viewed carries product_id but location_checked carries location_id instead", cat: "Semi-structured", why: "Labeled fields that vary by record type: the hallmark of semi-structured data." },
    { t: "A JSON receipt from a payment app with a nested list of line items whose length varies", cat: "Semi-structured", why: "Keys and labels, but a repeating nested list of varying length." },
    { t: "Website log records with labeled keys where optional fields appear on some lines and not others", cat: "Semi-structured", why: "Labeled, but the set of fields varies from record to record." },
    { t: "An XML events feed from a ticketing partner, tagged but with optional elements that differ by event", cat: "Semi-structured", why: "Tags label the content, but the structure is not fixed for every record." },
    { t: "A JSON survey export where some respondents include an extra follow_up block and others do not", cat: "Semi-structured", why: "Keyed and labeled, but records differ in which nested blocks they hold." },
    { t: "The CommentText field: \"Loved the hoodie but mediums were gone by noon!\"", cat: "Unstructured", why: "A free-text sentence; no predefined values organize what it says." },
    { t: "A staff member's narrative note about how the Kirkwood pop-up went", cat: "Unstructured", why: "Free text written however the staff member chose." },
    { t: "Photos of the pop-up display table", cat: "Unstructured", why: "Images have no consistent fields describing their content." },
    { t: "Voice memos staff record after an event", cat: "Unstructured", why: "Audio content with no fixed fields." },
    { t: "A video clip of the game-day line at the truck", cat: "Unstructured", why: "Video content without consistent fields." },
    { t: "Scanned handwritten feedback cards from a pop-up", cat: "Unstructured", why: "Images of handwriting; the content is not organized into fields." },
    { t: "The body text of emails customers send to VVMG's inbox", cat: "Unstructured", why: "Free text with no defined fields for its content." },
  ];
  const shapeSort = sortVariants({
    key: "k201-ch11-shape", bank: SHAPE_BANK, cats: ["Structured", "Semi-structured", "Unstructured"], defs: SHAPE_DEFS,
    ask: "source or field", hint: "Look at how the content is organized: fixed typed columns, labeled-but-varying keys, or no fields at all?",
  });

  /* Mixed-source CSV: classify each column */
  const COMMENT_TEXTS = ["Wish the truck came to the quad more often.", "Hoodie looked great but no mediums left.", "Couldn't find where the pop-up moved to.",
    "Coupon wouldn't apply at checkout??", "Love the new hats, bought two.", "Line was too long, gave up.", "Is the crimson hoodie coming back?"];
  const NOTE_TEXTS = ["Sold out of M hoodies by 12:10; many asked.", "Table placed behind the stage, low foot traffic.", "Card reader down 2-3 pm, cash only.",
    "Hoodies never unloaded from the truck.", "Rain moved us indoors at 1 pm.", "Several students asked about HOODIE15."];
  function mixedFile() {
    const isNotes = Math.random() < 0.5;
    const n = 3;
    if (isNotes) {
      const texts = U.sample(NOTE_TEXTS, n);
      const rows = texts.map((tx, i) => [`N${pad2(U.randInt(10, 99))}${i}`, U.pick(LOCATION_IDS), `2026-09-${pad2(U.randInt(1, 28))}`, U.pick(["Avery", "Jordan", "Sam", "Riley"]), esc(tx)]);
      return {
        name: "pop-up notes", head: ["NoteID", "LocationID", "EventDate", "StaffName", "NoteText"], rows,
        fields: [["NoteID", "Structured"], ["LocationID", "Structured"], ["EventDate", "Structured"], ["NoteText", "Unstructured"]],
        text: "NoteText",
      };
    }
    const texts = U.sample(COMMENT_TEXTS, n);
    const rows = texts.map((tx, i) => [`CM${U.randInt(100, 899) + i}`, U.pick(["C004", "C011", "C021", "C033"]), U.pick(PRODUCT_IDS), `2026-09-${pad2(U.randInt(1, 28))}`, esc(tx)]);
    return {
      name: "customer comments", head: ["CommentID", "CustomerID", "ProductID", "SubmittedDate", "CommentText"], rows,
      fields: [["CommentID", "Structured"], ["CustomerID", "Structured"], ["ProductID", "Structured"], ["SubmittedDate", "Structured"], ["CommentText", "Unstructured"]],
      text: "CommentText",
    };
  }

  const SHAPE_CONCEPTS = [
    { q: "VVMG wants to total last month's revenue by location. Which shape makes this easiest, and why?",
      right: "Structured order records, because typed fields and shared IDs can be filtered, joined and summed directly",
      rightWhy: "Totals and joins depend on consistent fields and data types.",
      wrong: [
        { t: "Semi-structured app activity, because it has the most detail per visit", why: "Detail is not revenue; app events show interest, and they must be unpacked before counting." },
        { t: "Unstructured comments, because they explain why sales happened", why: "Comments give reasons, but there are no amount fields to total." },
        { t: "Any shape works equally well once it is stored in the cloud", why: "Where data is hosted does not change its shape or how easily it can be totalled." },
      ],
      sol: ["Ask which shape has consistent, typed fields that can be added up.", "Structured order records: amounts, dates and LocationIDs on every row make filtering and summing direct."] },
    { q: "What is the main <b>cost</b> of semi-structured app activity compared with a structured table?",
      right: "It must be unpacked (sessions and events flattened or navigated) before you can count or compare it",
      rightWhy: "Nesting preserves detail but adds a step before analysis.",
      wrong: [
        { t: "It cannot hold identifiers such as product_id or order_id", why: "Events carry product_id, promotion_id, location_id and order_id; that is how they connect to tables." },
        { t: "It is always less accurate than a table", why: "Shape says nothing about accuracy; both can be right or wrong." },
        { t: "It is free text, so nothing in it can be counted", why: "JSON has labeled keys; it is semi-structured, not unstructured." },
      ],
      sol: ["Think about what nesting and varying fields do to a simple count.", "The data is labeled and countable, but you must navigate customer → session → event first."] },
    { q: "What is the main <b>benefit</b> of keeping customer comments as free text instead of forcing them into pick-list values?",
      right: "They keep reasons and context in the customer's own words that a fixed list would never capture",
      rightWhy: "Unstructured text is rich in context, which is exactly what sales records lack.",
      wrong: [
        { t: "Free text is easier to total and chart than numbers", why: "The opposite: free text must be read or coded before it can be counted." },
        { t: "Free text proves how many customers want a product", why: "Comments come from a vocal few; they show sentiment, not how widespread it is." },
        { t: "Free text needs no access controls", why: "Comments often contain personal details; they are a classic case for a restricted repository." },
      ],
      sol: ["Ask what free text can hold that a drop-down cannot.", "Reasons and context: \"mediums were gone by noon\" is information no fixed value list anticipated."] },
    { q: "A teammate says: \"The comments file is a CSV with columns, so it's structured. Done.\" What is missing?",
      right: "The CommentText field inside it is unstructured, so the file mixes structured rows with an unstructured field",
      rightWhy: "Classify the source's organization and each field's content.",
      wrong: [
        { t: "Nothing; any file with columns is structured", why: "Columns organize the rows, not the sentences inside a text column." },
        { t: "CSV files are always semi-structured", why: "A CSV's rows are fixed; what matters here is the free-text field." },
        { t: "The whole file is unstructured because it has some text", why: "The IDs and dates are still structured; the file mixes both." },
      ],
      sol: ["Look inside each column, not just at the file format.", "IDs and dates are structured fields; the comment sentence is unstructured. Name both."] },
    { q: "Which statement about data shape and business value is correct?",
      right: "Shape describes organization only; an unstructured note can matter more to a decision than a tidy table",
      rightWhy: "The hoodie decision may hinge on a staff note that it sold out by noon.",
      wrong: [
        { t: "Structured data is always the most valuable because it is the most organized", why: "Organization makes data easier to process, not more relevant to every question." },
        { t: "Unstructured data should be deleted because it cannot be analysed", why: "It can be read, coded and summarized, and it carries the reasons behind behaviour." },
        { t: "Semi-structured data is worth exactly halfway between the other two", why: "Shape does not rank value at all." },
      ],
      sol: ["Separate \"how organized is it?\" from \"how useful is it for this decision?\"", "Shape answers the first only. Value depends on the question."] },
  ];

  const shapeGen = STUDY.makeGenerator({
    id: "k201-ch11-shape",
    name: "Structured, semi-structured, unstructured",
    blurb: "Classify sources and individual fields by shape, including files that mix shapes.",
    variants: [
      ...shapeSort,
      {
        name: "Classify the columns of a mixed file",
        make() {
          const f = mixedFile();
          return Q.classify({
            q: `<p>Here are three rows from VVMG's ${f.name} file:</p>${table(f.head, f.rows)}<p>Classify the content of each column.</p>`,
            cats: ["Structured", "Semi-structured", "Unstructured"],
            items: f.fields.map(([c, cat]) => ({ t: `The <b>${c}</b> column`, cat,
              why: cat === "Structured" ? `${c} holds a defined value in a consistent format on every row.` : `${c} holds whatever sentence someone wrote; nothing fixes its content.` })),
            sol: S("Judge each column by its content, not by the fact that the file has columns.",
              `IDs and dates follow a fixed format: structured. <b>${f.text}</b> holds free text: unstructured. Nothing here nests or varies by key, so nothing is semi-structured.`,
              "So the file as a whole is structured rows wrapping an unstructured field."),
          });
        },
      },
      {
        name: "Describe the whole mixed source",
        make() {
          const f = mixedFile();
          return Q.mc({
            q: `<p>VVMG's ${f.name} file looks like this:</p>${table(f.head, f.rows)}<p>Which description of this source is most accurate?</p>`,
            right: `Structured rows and identifiers, plus an unstructured ${f.text} field`,
            rightWhy: "One source can contain more than one kind of data; classify the source and the field.",
            wrong: [
              { t: "Fully structured, because it is a table with named columns", why: `Columns organize the rows, but ${f.text} holds free sentences.` },
              { t: "Fully unstructured, because it contains written text", why: "The ID and date columns are fixed and typed; only one field is free text." },
              { t: "Semi-structured, because it is stored as a CSV", why: "Semi-structured means labeled data that nests or varies; these rows have the same columns throughout." },
            ],
            sol: S("Classify the organization of the file and then the content of each field.",
              `Every row has the same ID and date columns (structured), and ${f.text} carries free text (unstructured). The honest label names both.`),
          });
        },
      },
      conceptVariant("What a shape makes easier or harder", "k201-ch11-shape-c", SHAPE_CONCEPTS),
    ],
  });

  /* ============================================================
   * TOPIC 2 · Raw vs organized; trustworthiness
   * ============================================================ */
  const RAW_BANK = [
    { t: "Last night's app-activity JSON file, exactly as the app exported it", cat: "Raw data", why: "Kept in the form first collected; nobody has cleaned or reorganized it." },
    { t: "Staff pop-up notes saved exactly as typed on the tablet", cat: "Raw data", why: "Untouched since collection." },
    { t: "A phone photo of the truck's handwritten cash tally sheet", cat: "Raw data", why: "An original capture, not arranged into fields." },
    { t: "The point-of-sale vendor's CSV export before anyone removed duplicate rows", cat: "Raw data", why: "Not yet cleaned, so it is still raw." },
    { t: "Audio recording of the post-event staff huddle", cat: "Raw data", why: "Original form, no fields or relationships." },
    { t: "A folder of comment-form submissions as received from the website", cat: "Raw data", why: "Retained close to how it arrived." },
    { t: "Orders rows with a date-typed OrderDate whose CustomerID must match a Customers row", cat: "Organized database record", why: "Defined fields, data types and an enforced relationship." },
    { t: "OrderItems rows whose ProductID must point to an existing product", cat: "Organized database record", why: "Fields and a relationship rule organize each row." },
    { t: "A Products table storing list price in a currency-typed field", cat: "Organized database record", why: "Defined fields with defined data types." },
    { t: "Locations records, one row per LocationID, referenced by Orders", cat: "Organized database record", why: "Arranged into fields and linked through a key." },
    { t: "Promotions rows with required discount and start/end date fields", cat: "Organized database record", why: "Defined, typed fields with rules." },
    { t: "Customer rows where ClassYear is limited to a defined list of values", cat: "Organized database record", why: "A field with a data type and rule, inside a table of records." },
  ];
  const rawSort = sortVariants({
    key: "k201-ch11-raw", bank: RAW_BANK, cats: ["Raw data", "Organized database record"],
    defs: { "Raw data": "kept close to the form first collected, before cleaning, reorganizing or summarizing", "Organized database record": "arranged into defined fields, data types and relationships" },
    ask: "item", hint: "Ask: has this been arranged into defined fields, types and relationships, or is it still as collected?",
  }).filter(v => v.name !== "Name the category" && v.name !== "Pick the example");

  const TWO_DIM = [
    { t: "Customer comment text loaded into a CommentText column exactly as typed, typos and all", c: "Raw content · stored in database fields", why: "The text is untouched (raw), but it now sits in a database field. Raw data can live in a database." },
    { t: "The vendor's sales export loaded into a staging table with no cleaning or de-duplication", c: "Raw content · stored in database fields", why: "Loaded into a database, but not cleaned or reorganized: still raw." },
    { t: "Staff voice memos sitting in a shared drive folder", c: "Raw · not in a database", why: "Original form, and not arranged into database fields." },
    { t: "The app's JSON export file saved to a laptop as delivered", c: "Raw · not in a database", why: "As collected, and not organized into database records." },
    { t: "An analyst's cleaned weekly-totals spreadsheet emailed to the team", c: "Processed · outside a database", why: "Cleaned and summarized (not raw), but a spreadsheet summary is not organized database records with enforced relationships." },
    { t: "A typed-up summary of this month's pop-up notes in a slide deck", c: "Processed · outside a database", why: "Someone reorganized and summarized the notes, but they are not database records." },
    { t: "Validated Orders rows linked to Customers and Locations by enforced keys", c: "Processed · organized database records", why: "Cleaned, typed and related: organized database records." },
    { t: "OrderItems rows after duplicates were removed and every ProductID checked against Products", c: "Processed · organized database records", why: "Cleaned and held in defined fields with enforced relationships." },
  ];
  const TWO_DIM_CATS = ["Raw content · stored in database fields", "Raw · not in a database", "Processed · organized database records", "Processed · outside a database"];

  const TRUST_BANK = [
    { t: "An Orders row lists the hoodie's price as $4.99 instead of $49.99", cat: "Inaccurate", why: "The value is wrong." },
    { t: "A game-day order's LocationID points to the Kirkwood pop-up, but the sale happened at the stadium truck", cat: "Inaccurate", why: "The field is filled in, but with the wrong location." },
    { t: "A customer's ClassYear is stored as 2062", cat: "Inaccurate", why: "An impossible value: the data is wrong, not missing." },
    { t: "Quantity was recorded as 10 for a sale of one hoodie", cat: "Inaccurate", why: "A wrong value in an otherwise organized record." },
    { t: "The card reader went offline 2–4 pm, and those cash sales were never entered", cat: "Incomplete", why: "Real sales are missing from the records." },
    { t: "Half of the game-day orders have no LocationID", cat: "Incomplete", why: "Values are missing, so location comparisons are unreliable." },
    { t: "An order header exists, but its OrderItems rows never loaded", cat: "Incomplete", why: "Part of the record is missing." },
    { t: "Only one of three pop-up teams submitted notes for the weekend", cat: "Incomplete", why: "Records that should exist are missing." },
    { t: "Sales records correctly show 3 hoodies sold, but say nothing about whether the hoodie was in stock", cat: "Insufficient for the decision", why: "Accurate and complete for sales, but the decision needs availability data too." },
    { t: "Orders accurately capture completed purchases, but not the students who searched for the hoodie and left", cat: "Insufficient for the decision", why: "Correct within its scope; it cannot see interest that did not convert." },
    { t: "The Promotions table correctly defines HOODIE15, but the team wants to know how many students saved it", cat: "Insufficient for the decision", why: "The definition is right, but saves are customer actions recorded in app activity." },
    { t: "A complete, correct list of every comment received, when the question is how many students want the hoodie", cat: "Insufficient for the decision", why: "Accurate, but comments come from those who chose to write, not the whole market." },
  ];

  const RAW_TF = [
    { s: "Raw data can be stored inside a database.", truth: true, why: "Rawness and database organization are separate dimensions; untouched comment text can sit in a database column." },
    { s: "Once data is in a relational table with enforced keys, it can be treated as accurate.", truth: false, why: "Tables organize data; they do not guarantee it is complete, accurate or sufficient." },
    { s: "Organized database records can still be incomplete for the decision at hand.", truth: true, why: "Sales records can be perfect for sales and still miss the interest that never became a sale." },
    { s: "\"Raw\" means the data is low quality and should be cleaned before it is kept.", truth: false, why: "Raw only means close to original form. Keeping originals is often valuable for future questions." },
    { s: "Shared identifiers such as ProductID let VVMG connect sources without forcing them into one table.", truth: true, why: "That is exactly the job of CustomerID, ProductID, PromotionID, LocationID and OrderID." },
    { s: "The Relationship_Map sheet explains what each field means and its data type.", truth: false, why: "That is the Data_Dictionary. The Relationship_Map shows how identifiers connect tables." },
    { s: "The Source_Guide compares the structured workbook with app activity, comments and notes.", truth: true, why: "It explains how the non-table sources relate to the workbook." },
    { s: "Processed data is always stored as organized database records.", truth: false, why: "A cleaned summary spreadsheet is processed but is not database records." },
  ];

  const rawGen = STUDY.makeGenerator({
    id: "k201-ch11-rawdb",
    name: "Raw data vs organized records",
    blurb: "Separate rawness from database organization, and see why tables do not make data trustworthy.",
    variants: [
      ...rawSort,
      {
        name: "Place it on both dimensions",
        make() {
          const e = U.rotate("k201-ch11-twodim", TWO_DIM);
          return Q.mc({
            q: `<p>${e.t}.</p><p>Where does this sit on the two dimensions (raw vs processed, in database records vs not)?</p>`,
            right: e.c, rightWhy: e.why,
            wrong: TWO_DIM_CATS.filter(c => c !== e.c).map(c => ({ t: c, why: (c.startsWith("Raw") !== e.c.startsWith("Raw") ? "Check rawness: has anyone cleaned, reorganized or summarized it? " : "Check storage: is it in defined database fields or not? ") + e.why })),
            keepOrder: TWO_DIM_CATS,
            sol: S("Ask two separate questions: has it been cleaned or reorganized? Is it held in database fields?", e.why),
          });
        },
      },
      {
        name: "Diagnose the trust problem",
        make() {
          const items = [];
          ["Inaccurate", "Incomplete", "Insufficient for the decision"].forEach(c => items.push(...U.deal("k201-ch11-trust:" + c, TRUST_BANK.filter(b => b.cat === c), 1)));
          items.push(...U.sample(TRUST_BANK.filter(b => !items.includes(b)), 2));
          return Q.classify({
            q: "<p>Each of these VVMG records sits in an organized table. Classify the problem with each.</p>",
            cats: ["Inaccurate", "Incomplete", "Insufficient for the decision"], items,
            sol: S("Organized does not mean trustworthy. Ask: is a value wrong, is something missing, or is it right but not enough for the question?",
              ul(["<b>Inaccurate</b>: a value is wrong.", "<b>Incomplete</b>: records or values that should exist are missing.", "<b>Insufficient</b>: accurate within its scope, but the decision needs more."])),
          });
        },
      },
      {
        name: "Which source is accurate but insufficient?",
        make() {
          const right = U.pick(TRUST_BANK.filter(b => b.cat === "Insufficient for the decision"));
          const wrong = [...U.sample(TRUST_BANK.filter(b => b.cat === "Inaccurate"), 2), ...U.sample(TRUST_BANK.filter(b => b.cat === "Incomplete"), 1)];
          return Q.mc({
            q: "<p>Which situation describes data that is <b>accurate within its scope but incomplete for the decision</b>?</p>",
            right: right.t, rightWhy: right.why,
            wrong: wrong.map(w => ({ t: w.t, why: `That is ${w.cat.toLowerCase()}: ${w.why}` })),
            sol: S("Look for a record with nothing wrong and nothing missing inside its own scope.", `“${right.t}”: ${right.why}`),
          });
        },
      },
      tfVariant("True or false: rawness and trust", "k201-ch11-raw-tf", RAW_TF),
    ],
  });

  /* ============================================================
   * TOPIC 3 · Reading nested JSON
   * ============================================================ */
  const intro = log => `<p>Here is a slice of VVMG's app-activity export:</p>${codeJSON(log.obj)}`;
  const jsonGen = STUDY.makeGenerator({
    id: "k201-ch11-json",
    name: "Reading nested app-activity JSON",
    blurb: "Count sessions and events, spot guest sessions, and follow identifiers to the tables they connect to.",
    variants: [
      {
        name: "Count the sessions",
        make() {
          const log = makeLog();
          const nS = log.sessions.length, nC = log.obj.app_activity.length, nE = allEvents(log).length;
          const known = log.obj.app_activity.filter(b => b.customer_id).length;
          const traps = [];
          if (known !== nS) traps.push({ value: known, why: "That counts identified customers only. Count every session_id, including guest sessions and repeat visits." });
          if (nC !== nS && nC !== known) traps.push({ value: nC, why: "That counts customer blocks. One customer can have several sessions." });
          if (nE !== nS) traps.push({ value: nE, why: "That counts events. Each session holds several events." });
          return Q.num({
            q: intro(log) + "<p>How many <b>sessions</b> does this slice contain?</p>", answer: nS, kind: "count", unit: "sessions", traps,
            sol: S("A session is one visit, marked by a <code>session_id</code>. Customers can have more than one, and guest visits count too.",
              `Session IDs: ${log.sessions.map(s => s.session_id).join(", ")}. That is <b>${nS}</b>.`),
          });
        },
      },
      {
        name: "Count the events",
        make() {
          const log = makeLog();
          const nE = allEvents(log).length, nS = log.sessions.length;
          const first = log.sessions[0].events.length;
          const traps = [{ value: nS, why: "That counts sessions. Count every event_id inside every session." }];
          if (first !== nE && first !== nS) traps.push({ value: first, why: "That counts only the first session's events." });
          return Q.num({
            q: intro(log) + "<p>How many <b>events</b> are recorded in total?</p>", answer: nE, kind: "count", unit: "events", traps,
            sol: S("Events are the innermost level: each has its own <code>event_id</code>. Count them across every session, guest sessions included.",
              log.sessions.map(s => `${s.session_id}: ${s.events.length}`).join(" + ") + ` = <b>${nE}</b>.`),
          });
        },
      },
      {
        name: "Count one event type",
        make() {
          const log = makeLog();
          const evs = allEvents(log);
          const types = [...new Set(evs.map(e => e.event_type))];
          const ty = U.pick(types);
          const n = evs.filter(e => e.event_type === ty).length;
          const traps = [];
          if (evs.length !== n) traps.push({ value: evs.length, why: "That counts every event. Only count those whose event_type matches." });
          const sess = log.sessions.filter(s => s.events.some(e => e.event_type === ty)).length;
          if (sess !== n && sess !== evs.length) traps.push({ value: sess, why: "That counts sessions containing the event, but one session can contain it more than once." });
          return Q.num({
            q: intro(log) + `<p>How many <code>${ty}</code> events (a person ${EVENT_MEANING[ty]}) appear?</p>`, answer: n, kind: "count", unit: "events", traps,
            sol: S("Scan the <code>event_type</code> of every event in every session.",
              `Matching events: ${evs.filter(e => e.event_type === ty).map(e => e.event_id).join(", ")}, so <b>${n}</b>.`),
          });
        },
      },
      {
        name: "Spot the guest session",
        make() {
          const log = makeLog({ guest: true });
          const g = log.sessions.find(s => !s.customer_id);
          const others = log.sessions.filter(s => s.customer_id).map(s => s.session_id);
          return Q.mc({
            q: intro(log) + "<p>Which statement about this slice is correct?</p>",
            right: `${g.session_id} is a guest session: no customer_id, but it is a real visit with ${g.events.length} recorded ${U.plural(g.events.length, "event")}`,
            rightWhy: "A null customer_id marks a guest; the session_id and event records still exist.",
            wrong: [
              { t: `${g.session_id} is a broken record and should be deleted before analysis`, why: "A null customer_id is expected for guests; dropping the session would hide real interest." },
              { t: `${g.session_id} belongs to the same customer as ${U.pick(others)}`, why: "Nothing links them; a guest session has no customer_id to match." },
              { t: `${g.session_id} has no events because it has no customer`, why: `It lists ${g.events.length} ${U.plural(g.events.length, "event")}; events belong to sessions, not customers.` },
            ],
            sol: S("Look for <code>\"customer_id\": null</code> and what is still present beneath it.",
              `${g.session_id} has no customer_id, so it cannot join to Customers, but its session_id and event_ids are intact. Keep it.`),
          });
        },
      },
      {
        name: "Follow an identifier to its table",
        make() {
          let log, evs;
          do {   // a small random slice can lack any identifier-carrying event; redraw
            log = makeLog();
            evs = allEvents(log).filter(e => ["product_id", "promotion_id", "location_id", "order_id"].some(k => e[k]));
          } while (!evs.length);
          const e = U.pick(evs);
          const keys = ["order_id", "location_id", "promotion_id", "product_id"].filter(k => e[k]);
          const k = keys[0];
          const tables = ["Products", "Promotions", "Locations", "Orders", "Customers"];
          const right = ID_TABLE[k];
          const reasons = {
            Products: "product_id values point to the Products catalog.",
            Promotions: "promotion_id values point to offer definitions in Promotions.",
            Locations: "location_id values point to pop-up and truck spots in Locations.",
            Orders: "order_id values point to completed orders in Orders.",
            Customers: "customer_id (on the customer block, not the event) points to Customers.",
          };
          return Q.mc({
            q: intro(log) + `<p>Event <b>${e.event_id}</b> (<code>${e.event_type}</code>) carries <code>${k}: "${e[k]}"</code>. Which VVMG table does that identifier connect to?</p>`,
            right, rightWhy: reasons[right],
            wrong: tables.filter(t => t !== right).map(t => ({ t, why: `No: ${reasons[t]} The field here is ${k}.` })),
            keepOrder: tables,
            sol: S("Event-specific fields are identifiers that connect the event to a reference or transaction table.", `${k} → <b>${right}</b>. ${reasons[right]}`),
          });
        },
      },
      {
        name: "Which event types appear?",
        make() {
          const log = makeLog();
          const present = new Set(allEvents(log).map(e => e.event_type));
          return Q.multi({
            q: intro(log) + "<p>Select <b>every</b> event type that appears in this slice.</p>",
            options: EVENT_TYPES.map(t => ({ t: `<code>${t}</code>`, ok: present.has(t), why: present.has(t) ? `Present: someone ${EVENT_MEANING[t]}.` : "Not in this slice; check each event_type value." })),
            sol: S("Read the <code>event_type</code> of every event, in every session, including guests.", `Present: ${[...present].map(t => `<code>${t}</code>`).join(", ")}.`),
          });
        },
      },
      {
        name: "Revenue from an abandoned cart",
        make() {
          const log = makeLog({ abandon: true });
          const s = log.sessions.find(x => x.events.some(e => e.event_type === "cart_abandoned") && x.events.some(e => e.event_type === "cart_started") && !x.events.some(e => e.event_type === "coupon_redeemed"));
          const est = s.events.find(e => e.event_type === "cart_started").cart_total_estimated;
          return Q.num({
            q: intro(log) + `<p>Look at session <b>${s.session_id}</b>. How much completed revenue does that session record? (Answer in dollars.)</p>`,
            answer: 0, unit: "$", kind: "count",
            traps: [{ value: est, why: "cart_total_estimated is a projection of what the cart would cost. The cart was abandoned, so no money was received." }],
            sol: S("Only a completed order record records revenue. Is there a completed order for this session?",
              `${s.session_id} starts a cart (estimated $${est}) and then abandons it. That is interest, not revenue: <b>$0</b>.`),
          });
        },
      },
      {
        name: "Why not one flat table?",
        make() {
          const log = makeLog();
          return Q.mc({
            q: intro(log) + "<p>A teammate wants to load this into one relational table with a fixed column for every possible field. What is the main problem?</p>",
            right: "Events nest inside sessions and carry different fields by type, so a flat table would be mostly empty columns or would lose the nesting",
            rightWhy: "Nested, repeating, varying records are what a document/JSON-style store is for.",
            wrong: [
              { t: "JSON cannot contain identifiers, so it could never be joined to other tables", why: "It carries product_id, location_id, order_id and more." },
              { t: "The data is unstructured free text, so no table could hold it", why: "It has labeled keys; it is semi-structured." },
              { t: "There is no problem; any source becomes trustworthy once it is in a table", why: "Tables do not make data trustworthy, and flattening loses structure." },
            ],
            sol: S("Look at how many levels there are and whether every event has the same fields.",
              "Customer → session → event nesting plus type-specific fields (product_id here, location_id there) is why this belongs in a document/JSON-style store."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 4 · Routing to a primary home
   * ============================================================ */
  const HOMES = ["Relational table", "Document/JSON-style store", "Restricted repository", "Archive"];
  const HOME_DEFS = {
    "Relational table": "fixed fields, enforced relationships, one authoritative record per entity or event",
    "Document/JSON-style store": "nested or repeating information; records whose fields differ",
    "Restricted repository": "current information needing controlled access or limited approved use",
    "Archive": "older records kept mainly for retention or recordkeeping, not active review",
  };
  const ROUTE_BANK = [
    { t: "Orders and OrderItems for this semester", cat: "Relational table", why: "Fixed fields; every order item must point to a real order and product." },
    { t: "The Products catalog", cat: "Relational table", why: "One authoritative row per product with fixed fields." },
    { t: "The Promotions table defining HOODIE15 once, with discount and dates", cat: "Relational table", why: "One definition per offer, with fixed fields that app events refer to." },
    { t: "The Locations reference table", cat: "Relational table", why: "Fixed fields and one row per location that orders must reference." },
    { t: "Refund records that must each tie to an existing order", cat: "Relational table", why: "An enforced relationship to Orders is the deciding need." },
    { t: "Customer master records with CustomerID, email and class year", cat: "Relational table", why: "One authoritative record per customer with fixed fields." },
    { t: "App sessions holding variable-length lists of events", cat: "Document/JSON-style store", why: "Nested, repeating records." },
    { t: "Coupon saves and redemptions recorded each time a student acts in the app", cat: "Document/JSON-style store", why: "Repeated customer actions inside app activity, with fields that vary by event type." },
    { t: "Product-page and location look-up events whose fields differ by event type", cat: "Document/JSON-style store", why: "Records with different fields fit a flexible document store." },
    { t: "Wish lists where each customer keeps a different number of items with optional notes", cat: "Document/JSON-style store", why: "Variable-length, nested content." },
    { t: "A partner app's nested JSON feed of event check-ins", cat: "Document/JSON-style store", why: "Semi-structured nesting that a document store keeps intact." },
    { t: "This semester's customer comments, which include names and contact details", cat: "Restricted repository", why: "Current, sensitive free text needing controlled access and approved uses." },
    { t: "Current staff pop-up notes about operations and customer interactions", cat: "Restricted repository", why: "Current notes that only approved staff should use." },
    { t: "Staff voice memos describing a customer complaint", cat: "Restricted repository", why: "Sensitive, current content with limited approved use." },
    { t: "Recent pop-up photos in which students' faces are visible", cat: "Restricted repository", why: "Identifiable images require controlled access." },
    { t: "Pop-up notes from three years ago, kept only for recordkeeping", cat: "Archive", why: "Old and rarely reviewed; kept for retention." },
    { t: "Sales exports from closed fiscal years retained to meet record-retention rules", cat: "Archive", why: "Retention, not active review, is the purpose." },
    { t: "Logs from a retired version of the app, kept only because policy requires it", cat: "Archive", why: "No active use; kept for recordkeeping." },
    { t: "Event photos from 2019 kept for the historical record and rarely opened", cat: "Archive", why: "Old, rarely reviewed material." },
  ];
  const routeSort = sortVariants({
    key: "k201-ch11-route", bank: ROUTE_BANK, cats: HOMES, defs: HOME_DEFS, ask: "source",
    hint: "Run the routing questions: fixed fields? one record per row? values or free text? enforced relationships? who may access it, and is it current or old?",
  }).filter(v => v.name !== "Pick the example");

  const PROFILES = [
    { home: "Relational table", ans: ["Yes", "Yes, one defined record per row", "Defined values (IDs, dates, amounts)", "Yes: each row must reference existing records", "Shared with planners for routine use"] },
    { home: "Relational table", ans: ["Yes", "Yes, one defined record per row", "Defined values (codes, percents, dates)", "Yes: other records must point to these rows", "Broad internal use"] },
    { home: "Document/JSON-style store", ans: ["No: fields differ by record type", "No: records nest and repeat", "Mostly labeled values", "Linked by IDs, but nesting varies record to record", "Analysts in active use"] },
    { home: "Document/JSON-style store", ans: ["No: optional blocks appear on some records", "No: each record holds a variable-length list", "Mostly labeled values with a few short text fields", "Connected through IDs, not enforced inside the source", "Product team in active use"] },
    { home: "Restricted repository", ans: ["Some: ID and date columns plus one long text field", "Yes, one entry per row", "Mostly free text", "Linked by CustomerID or LocationID", "Only approved staff, for limited approved purposes; current"] },
    { home: "Restricted repository", ans: ["No: audio and image files", "One file per item", "Unstructured media showing identifiable people", "Tagged with LocationID", "Restricted to named managers; current"] },
    { home: "Archive", ans: ["Some", "Yes, one entry per row", "Mix of values and text", "Not needed for current work", "Rarely reviewed; kept to satisfy retention rules"] },
    { home: "Archive", ans: ["Yes", "Yes", "Defined values", "Relationships no longer actively maintained", "Old records from closed years; kept for recordkeeping only"] },
  ];
  const RQ = ["Same fixed fields for every record?", "One defined record per row?", "Defined values or free text?", "Relationships/rules enforced?", "Access and use?"];

  const ROUTE_CONCEPTS = [
    { q: "The Promotions table holds HOODIE15 once; the app records hundreds of HOODIE15 saves and redemptions. Where should each live?",
      right: "The offer definition in a relational Promotions table; the saves and redemptions in the document/JSON-style app activity store, linked by PromotionID",
      rightWhy: "A definition and a repeated customer action are different kinds of record.",
      wrong: [
        { t: "Both in the Promotions table, one row per save or redemption", why: "That turns one definition into hundreds of duplicate offer rows and mixes actions with definitions." },
        { t: "Both in the app store, since they share PromotionID", why: "A shared ID connects sources; it does not mean they belong in one home." },
        { t: "Both in an archive, since promotions expire", why: "Current offers and activity are in active use; archives are for old records kept for retention." },
      ],
      sol: ["Ask: is this one definition, or a repeated action?", "Definition → relational (one authoritative row). Repeated, varying actions → app activity in a document store. PromotionID ties them together."] },
    { q: "Which routing question most directly separates Orders from app events?",
      right: "Does every record have the same fixed fields?",
      rightWhy: "Every order has the same fields; app events vary by type.",
      wrong: [
        { t: "Is the data stored in the cloud?", why: "Hosting is not one of the routing questions and does not describe shape." },
        { t: "Is the data larger than a gigabyte?", why: "Size alone does not decide the home." },
        { t: "Was the data created by VVMG staff?", why: "Who created it is not the issue; structure, relationships and access are." },
      ],
      sol: ["Picture an order row and an app event side by side. What differs?", "Orders: fixed fields. Events: product_id on some, location_id on others. The fixed-fields question splits them."] },
    { q: "Which routing question pushes customer comments toward a restricted repository rather than an ordinary shared table?",
      right: "Who may access it and how will it be used?",
      rightWhy: "Comments can contain personal details and need controlled access and approved uses.",
      wrong: [
        { t: "Must relationships be enforced?", why: "Comments do link by CustomerID, but that does not create the need for restriction." },
        { t: "Does every record have the same fixed fields?", why: "The comment file's columns are mostly fixed; that alone would point toward a table." },
        { t: "Is there one record per row?", why: "Each comment is one row; this does not distinguish it from Orders." },
      ],
      sol: ["Find the question that is about people and permissions, not structure.", "Access and use: current, sensitive text with limited approved purposes → restricted repository."] },
    { q: "Why is \"Must relationships or business rules be enforced?\" decisive for OrderItems?",
      right: "Every order item must point to a real order and a real product, and a relational table can enforce that",
      rightWhy: "Enforced relationships keep one authoritative record per line item.",
      wrong: [
        { t: "Because OrderItems are nested inside sessions", why: "Order items are flat rows linked by keys, not nested app events." },
        { t: "Because order items contain mostly free text", why: "They contain IDs, quantities and prices: defined values." },
        { t: "Because order items are rarely reviewed", why: "They are core active records; rarely reviewed data goes to an archive." },
      ],
      sol: ["What would go wrong if an order item pointed to a product that does not exist?", "Revenue and inventory would be wrong. Relational tables enforce those links."] },
    { q: "VVMG keeps pop-up notes from four seasons ago that nobody consults but policy says to retain. Where should they live?",
      right: "Archive",
      rightWhy: "Older records kept mainly for retention, not active review.",
      wrong: [
        { t: "Restricted repository", why: "That home is for current information needing controlled use; these are old and kept only for recordkeeping." },
        { t: "Relational table", why: "Free-text notes with no active use do not need enforced relationships." },
        { t: "Document/JSON-style store", why: "They are not nested app events; their purpose now is retention." },
      ],
      sol: ["Is the data current and in use, or kept mainly because it must be?", "Kept for retention and rarely reviewed → archive (still with access and retention rules)."] },
    { q: "A storage decision for staff notes says only \"put them in the restricted repository.\" What is still missing?",
      right: "Who gets access, how long the notes are kept, and which uses are approved",
      rightWhy: "A storage decision names access, retention and approved use, not just a location.",
      wrong: [
        { t: "Nothing; naming the home is the whole decision", why: "Without access, retention and approved use, the restriction has no meaning." },
        { t: "A plan to convert the notes into a relational table", why: "Free-text notes do not need to become a table to be governed." },
        { t: "A data lake to hold a second copy", why: "A lake is optional and unrelated to defining access and retention." },
      ],
      sol: ["A home is a place; a decision also needs rules.", "Name who may access the notes, how long they are kept, and what they may be used for."] },
  ];

  const INVENTORY = [
    { s: "Sales/order records (Orders + OrderItems)", shape: "Structured", fixed: "Yes", ids: "OrderID, CustomerID, ProductID, LocationID", home: "Relational table" },
    { s: "Product catalog (Products)", shape: "Structured", fixed: "Yes", ids: "ProductID", home: "Relational table" },
    { s: "App activity (JSON export)", shape: "Semi-structured", fixed: "No", ids: "customer_id, session_id, event_id, product_id, promotion_id, location_id, order_id", home: "Document/JSON-style store" },
    { s: "Customer comments (CSV)", shape: "Structured rows + unstructured text", fixed: "Some", ids: "CommentID, CustomerID, ProductID", home: "Restricted repository" },
    { s: "Pop-up notes (CSV)", shape: "Structured rows + unstructured text", fixed: "Some", ids: "NoteID, LocationID", home: "Restricted repository" },
  ];
  const invRow = r => `${r.shape} · fixed fields: ${r.fixed} · home: ${r.home}`;

  const routeGen = STUDY.makeGenerator({
    id: "k201-ch11-route",
    name: "Routing a source to its home",
    blurb: "Use the routing questions to choose a relational table, document store, restricted repository or archive.",
    variants: [
      ...routeSort,
      {
        name: "Route from routing answers",
        make() {
          const p = U.pick(PROFILES);
          const name = U.pick(["Source A", "Source K", "Source M", "Source R", "Source T"]);
          const fit = {
            "Relational table": "fixed fields, one record per row, defined values and enforced relationships",
            "Document/JSON-style store": "varying fields and nested, repeating records",
            "Restricted repository": "current content whose access and use must be controlled",
            "Archive": "old material kept mainly for retention",
          };
          return Q.mc({
            q: `<p>A VVMG analyst answered the routing questions for <b>${name}</b>:</p>${table(["Routing question", "Answer"], RQ.map((r, i) => [r, p.ans[i]]))}<p>Which primary home fits best?</p>`,
            right: p.home, rightWhy: `The answers describe ${fit[p.home]}.`,
            wrong: HOMES.filter(h => h !== p.home).map(h => ({ t: h, why: `${h} suits ${fit[h]}; these answers describe ${fit[p.home]}.` })),
            keepOrder: HOMES,
            sol: S("Weigh the answers together; the access-and-use answer can override a mostly-fixed structure.",
              `Here the pattern is ${fit[p.home]}, so the home is <b>${p.home}</b>.`),
          });
        },
      },
      {
        name: "Complete the inventory row",
        make() {
          const r = U.pick(INVENTORY);
          const altHome = U.pick(HOMES.filter(h => h !== r.home && h !== "Archive"));
          const altShape = r.shape === "Structured" ? "Semi-structured" : r.shape === "Semi-structured" ? "Unstructured" : "Structured";
          const altFixed = r.fixed === "Yes" ? "No" : "Yes";
          return Q.mc({
            q: `<p>In VVMG's source inventory, which row is correct for <b>${r.s}</b> (key identifiers: ${r.ids})?</p>`,
            right: invRow(r), rightWhy: `${r.s}: ${r.shape.toLowerCase()}, fixed fields ${r.fixed.toLowerCase()}, primary home ${r.home.toLowerCase()}.`,
            wrong: [
              { t: invRow({ ...r, home: altHome }), why: `Shape and fields are right, but the home is wrong: ${HOME_DEFS[r.home]} is what this source needs.` },
              { t: invRow({ ...r, shape: altShape }), why: `The shape is wrong: this source is ${r.shape.toLowerCase()}.` },
              { t: invRow({ ...r, fixed: altFixed }), why: `The fixed-fields answer is wrong: it should be ${r.fixed}.` },
            ],
            sol: S("Fill the row column by column: shape, fixed fields, then the home those answers point to.",
              `${r.s} → ${invRow(r)}.`),
          });
        },
      },
      conceptVariant("Apply a routing question", "k201-ch11-route-c", ROUTE_CONCEPTS),
    ],
  });

  /* ============================================================
   * TOPIC 5 · What each source can and cannot prove
   * ============================================================ */
  const STAGE_BANK = [
    { t: "A product_viewed event for the hoodie", cat: "Interest or intent only", why: "Opening a product page shows interest, not a purchase." },
    { t: "A coupon_saved event for HOODIE15", cat: "Interest or intent only", why: "Saving a coupon for later is intent; nothing was bought." },
    { t: "A cart_started event with cart_total_estimated of $49", cat: "Interest or intent only", why: "A cart estimate is a projection, not money received." },
    { t: "A cart_abandoned event", cat: "Interest or intent only", why: "The person left without checking out." },
    { t: "A location_checked event for the stadium truck", cat: "Interest or intent only", why: "Looking up where to buy is not buying." },
    { t: "A search_submitted event with search_text \"crimson hoodie\"", cat: "Interest or intent only", why: "A search shows someone looking, not a sale." },
    { t: "A five-star comment: \"Need this hoodie in my life!\"", cat: "Interest or intent only", why: "Enthusiasm is sentiment, not a completed order." },
    { t: "An Orders row with an OrderItems line for the hoodie", cat: "Records a completed sale", why: "Completed order records are the proof of a sale." },
    { t: "A coupon_redeemed event whose order_id matches an existing Orders row", cat: "Records a completed sale", why: "It points to a completed order; the order record is what proves the sale." },
    { t: "OrderItems rows showing quantity 2 of ProductID P101", cat: "Records a completed sale", why: "Order line items record what was actually purchased." },
    { t: "A completed Orders row paid at the Kirkwood pop-up", cat: "Records a completed sale", why: "A completed order records revenue." },
  ];
  const stageSort = sortVariants({
    key: "k201-ch11-stage", bank: STAGE_BANK, cats: ["Interest or intent only", "Records a completed sale"],
    defs: { "Interest or intent only": "views, saves, searches, carts, comments: earlier stages", "Records a completed sale": "completed order records (or an event pointing to one)" },
    ask: "piece of evidence", hint: "Only a completed order record records revenue. Everything earlier in the funnel is interest.",
  }).filter(v => v.name === "Sort (drop-down)" || v.name === "Select all that apply");

  const SOURCES = ["Sales/order records", "App activity", "Customer comments", "Pop-up notes", "Product catalog"];
  const SOURCE_Q = [
    { q: "How many Crimson Campus Hoodies were actually sold at game day?", a: "Sales/order records", why: "Completed purchases live in Orders and OrderItems." },
    { q: "Did students look for the hoodie in the app around game day?", a: "App activity", why: "Views and searches are app events." },
    { q: "How many students saved the HOODIE15 coupon?", a: "App activity", why: "coupon_saved events record each save." },
    { q: "Was the hoodie actually in stock at the game-day truck?", a: "Pop-up notes", why: "Staff notes describe operating conditions such as sell-outs." },
    { q: "What reasons did customers give, in their own words, for not buying?", a: "Customer comments", why: "Comments carry sentiment and stated reasons." },
    { q: "What is the hoodie's list price and product category?", a: "Product catalog", why: "The Products table holds product attributes." },
    { q: "Did the pop-up table get moved somewhere with little foot traffic?", a: "Pop-up notes", why: "That is an operating condition only staff notes would capture." },
    { q: "How many carts containing the hoodie were started and then abandoned?", a: "App activity", why: "cart_started and cart_abandoned are app events." },
  ];
  const SOURCE_WHY = {
    "Sales/order records": "they record completed purchases only",
    "App activity": "it shows interest and behaviour, not completed sales or stated reasons",
    "Customer comments": "they show sentiment from those who chose to write",
    "Pop-up notes": "they describe conditions at one event or location",
    "Product catalog": "it describes products, not demand or events",
  };
  const CANNOT = [
    { s: "Sales/order records", right: "Whether students who did not buy wanted the hoodie", wrong: ["How many hoodies were sold", "Which location each order came from", "The revenue from completed hoodie orders"] },
    { s: "App activity", right: "That a completed sale happened, or how much revenue it brought", wrong: ["Which products students viewed", "How many coupons were saved", "Which locations students looked up"] },
    { s: "Customer comments", right: "How widespread the opinions are across all students", wrong: ["The reasons some customers gave in their own words", "Which product a comment refers to (via ProductID)", "The sentiment of the people who wrote in"] },
    { s: "Pop-up notes", right: "What happened at other locations, or total hoodie sales", wrong: ["Whether this pop-up ran out of a size", "Where the table was placed at this event", "Whether the card reader went down at this event"] },
  ];

  const PROVE_TF = [
    { s: "An abandoned cart with an estimated total of $64 adds $64 to VVMG's revenue.", truth: false, why: "The estimate is a projection; only a completed order records revenue." },
    { s: "App activity should be kept separate from sales so interest can be compared with purchases.", truth: true, why: "Adding them together would hide the gap between interest and completed demand." },
    { s: "Sales records alone can show whether low hoodie sales were caused by low interest.", truth: false, why: "They cannot see interest that never converted, or whether the hoodie was available." },
    { s: "Customers, Locations and Promotions act as supporting reference tables in the inventory.", truth: true, why: "They give meaning to the IDs carried by orders and app events." },
    { s: "A pop-up note that the hoodie sold out at one location shows it was sold out everywhere.", truth: false, why: "A note describes conditions at one event or location." },
    { s: "None of the interest sources can substitute for sales records when counting completed sales.", truth: true, why: "Views, saves, carts and comments are earlier stages; only orders prove a sale." },
  ];

  function funnel() {
    const orders = U.randInt(3, 12);
    const carts = orders + U.randInt(6, 25);
    const saves = U.randInt(15, 50);
    const views = carts + saves + U.randInt(40, 150);
    return { views, saves, carts, orders };
  }

  const proveGen = STUDY.makeGenerator({
    id: "k201-ch11-prove",
    name: "What each source can and cannot prove",
    blurb: "Keep interest separate from completed sales and name what each source cannot prove alone.",
    variants: [
      ...stageSort,
      {
        name: "Count the completed sales",
        make() {
          const f = funnel();
          const pName = U.pick(["Crimson Campus Hoodie", "Cream & Crimson Beanie", "Game-Day Tote"]);
          return Q.num({
            q: `<p>In one week the ${pName} drew this activity:</p>${table(["Source", "Count"], [["product_viewed events", f.views], ["coupon_saved events", f.saves], ["cart_started events", f.carts], ["Completed orders containing it", f.orders]])}<p>How many <b>sales</b> of the ${pName} does the evidence support?</p>`,
            answer: f.orders, kind: "count", unit: "sales",
            traps: [
              { value: f.views + f.saves + f.carts + f.orders, why: "Views, saves and carts are earlier stages of interest; adding them inflates sales." },
              { value: f.carts, why: "Starting a cart is not checking out." },
              { value: f.carts + f.orders, why: "Cart starts are interest; only completed orders are sales." },
            ],
            sol: S("Which row is the only one that records a completed purchase?",
              `Completed orders: <b>${f.orders}</b>. The ${f.carts - f.orders}-cart gap between carts and orders is a question to investigate, not extra sales.`),
          });
        },
      },
      {
        name: "Confirmed revenue vs cart estimates",
        make() {
          const nO = U.randInt(2, 3), nA = U.randInt(2, 3);
          const prices = [38, 42, 49, 54, 64, 72];
          const rows = [];
          let rev = 0, est = 0, k = U.randInt(10, 60);
          for (let i = 0; i < nO; i++) { const v = U.pick(prices); rev += v; rows.push([`S00${k++}`, "Completed order (Orders row)", `$${v}`]); }
          for (let i = 0; i < nA; i++) { const v = U.pick(prices); est += v; rows.push([`S00${k++}`, "cart_abandoned (cart_total_estimated)", `$${v}`]); }
          return Q.num({
            q: `<p>Sessions from game-day weekend:</p>${table(["Session", "Outcome", "Amount"], U.shuffle(rows))}<p>How much <b>revenue</b> can VVMG confirm from these sessions?</p>`,
            answer: rev, unit: "$",
            traps: [
              { value: rev + est, why: "That adds abandoned-cart estimates. They are projections, not money received." },
              ...(Math.abs(est - rev) > 5 ? [{ value: est, why: "That counts only the abandoned carts, which recorded no revenue at all." }] : []),
            ],
            sol: S("Revenue comes only from completed order records; estimates on abandoned carts are projections.",
              `Completed orders total <b>$${rev}</b>. The $${est} of abandoned-cart estimates shows interest, not revenue.`),
          });
        },
      },
      {
        name: "Which source answers the question?",
        make() {
          const e = U.rotate("k201-ch11-srcq", SOURCE_Q);
          return Q.mc({
            q: `<p>The VVMG team asks: <b>“${e.q}”</b></p><p>Which source is the right place to look first?</p>`,
            right: e.a, rightWhy: e.why,
            wrong: SOURCES.filter(s => s !== e.a).map(s => ({ t: s, why: `Not the best fit: ${SOURCE_WHY[s]}.` })),
            keepOrder: SOURCES,
            sol: S("Match the question to what each source actually records: purchases, behaviour, stated reasons, operating conditions or product attributes.", `${e.a}: ${e.why}`),
          });
        },
      },
      {
        name: "What can't this source prove alone?",
        make() {
          const e = U.pick(CANNOT);
          return Q.mc({
            q: `<p>Which of these can VVMG's <b>${e.s.toLowerCase()}</b> <b>NOT</b> prove on their own?</p>`,
            right: e.right, rightWhy: `${e.s}: ${SOURCE_WHY[e.s]}.`,
            wrong: e.wrong.map(w => ({ t: w, why: `This source can show that: ${SOURCE_WHY[e.s]}.` })),
            sol: S(`Recall what ${e.s.toLowerCase()} actually capture, and what lies outside their scope.`, `They cannot prove: ${e.right.toLowerCase()}.`),
          });
        },
      },
      tfVariant("True or false: interest vs sales", "k201-ch11-prove-tf", PROVE_TF),
    ],
  });

  /* ============================================================
   * TOPIC 6 · Data lake vs warehouse
   * ============================================================ */
  const LW_BANK = [
    { t: "Holds structured exports, JSON, text and images together, close to how they arrived", cat: "Data lake", why: "Varied raw sources stored without reshaping first." },
    { t: "Accepts sources before every question about them is known", cat: "Data lake", why: "A receiving area for future, unknown questions." },
    { t: "Keeps original versions of app logs so analysts can revisit them later", cat: "Data lake", why: "Retaining originals for new questions is a lake's purpose." },
    { t: "Acts like a receiving area rather than organized shelving", cat: "Data lake", why: "That is the chapter's picture of a lake." },
    { t: "Stores pop-up photos and voice memos next to JSON exports without converting them", cat: "Data lake", why: "Varied formats, kept raw, side by side." },
    { t: "Holds cleaned, standardized data organized for recurring reports", cat: "Data warehouse", why: "Prepared, report-ready data." },
    { t: "Acts like organized shelving: everything prepared and labeled for routine use", cat: "Data warehouse", why: "Readiness is what defines a warehouse." },
    { t: "Supports the same monthly sales-by-location report every month with standardized fields", cat: "Data warehouse", why: "Stable recurring reporting from prepared data." },
    { t: "Contains data that was cleaned and reshaped before it was loaded", cat: "Data warehouse", why: "Data is prepared first, then stored." },
    { t: "Becomes relevant for VVMG later, once standardized recurring reports develop", cat: "Data warehouse", why: "Not a primary home in this chapter; a later step." },
  ];
  const lwSort = sortVariants({
    key: "k201-ch11-lw", bank: LW_BANK, cats: ["Data lake", "Data warehouse"],
    defs: { "Data lake": "varied raw sources kept together close to arrival form; a receiving area", "Data warehouse": "prepared, cleaned, standardized data for recurring reports; organized shelving" },
    ask: "description", hint: "The difference is readiness: raw and varied on arrival, or prepared for recurring reports?",
  }).filter(v => v.name === "Sort (drop-down)" || v.name === "Which is NOT…");

  const CRIT = [
    { name: "Variety", lake: ["Planning decisions repeatedly combine sales, app activity, comments and photos", "Every monthly decision pulls in four or more differently shaped sources at once"],
      simple: ["Almost every decision uses only the sales tables", "The team works from one or two stable sources"] },
    { name: "Originals", lake: ["Legal and analytics teams need untouched originals for questions nobody has asked yet", "Analysts must be able to go back to the exact raw app logs later"],
      simple: ["A few selected fields extracted each month are all anyone uses", "Summaries and extracts fully meet the need; originals are never revisited"] },
    { name: "Changing questions", lake: ["The questions change every few weeks, and analysts keep needing the original data", "New one-off questions arrive constantly that no prepared report covers"],
      simple: ["The same recurring reports are run every month", "Reports are stable and can be prepared in advance"] },
    { name: "Volume / frequency", lake: ["Millions of events arrive daily, and manual extraction can no longer keep up", "Combining sources by hand now takes days every cycle"],
      simple: ["A few thousand rows a month are handled easily by existing tools", "Current spreadsheets and the database manage the volume fine"] },
    { name: "Governance", lake: ["Owners, access rules, retention periods and approved uses are already defined", "A named data owner and written retention and access policies are in place"],
      simple: ["Nobody owns the data, and access and retention have not been defined", "There is no policy yet on who may use comment text or for how long"] },
  ];
  function lakeScenario(mode) {
    // mode: "yes" (≥4 lake incl. governance), "gov" (≥3 lake but governance not ready), "no" (≤1 lake), "any"
    let flags;
    if (mode === "yes") { flags = [1, 1, 1, 1, 1]; flags[U.randInt(0, 3)] = U.pick([0, 1]); }
    else if (mode === "gov") { flags = [1, 1, 1, 1, 0]; if (Math.random() < 0.5) flags[U.randInt(0, 3)] = 0; }
    else if (mode === "no") { flags = [0, 0, 0, 0, 0]; if (Math.random() < 0.5) flags[U.randInt(0, 3)] = 1; }
    else flags = CRIT.map(() => U.randInt(0, 1));
    const lines = CRIT.map((c, i) => ({ c: c.name, lake: !!flags[i], text: U.pick(flags[i] ? c.lake : c.simple) }));
    return { flags, lines, n: flags.reduce((a, b) => a + b, 0) };
  }
  const ORGS = ["VVMG, two years from now", "A regional campus-bookstore chain", "A city bike-share operator", "A single-location coffee cart", "A university athletics ticket office", "A three-truck food business"];

  const LAKE_CONCEPTS = [
    { q: "VVMG has relational tables, JSON app activity, free-text comments and photos. A manager says: \"Different shapes, so we need a data lake.\" Best response?",
      right: "Shape alone doesn't justify a lake; each source gets a fitting primary home, and a lake is considered only if the five criteria line up",
      rightWhy: "Different shapes are handled by routing, not automatically by a lake.",
      wrong: [
        { t: "Agree: any mix of shapes requires a lake", why: "That is exactly the micro-disruption; size, JSON or free text alone do not settle it." },
        { t: "Agree, and move the sales tables into the lake as their new home", why: "The relational database stays the authoritative home for sales; a lake only holds selected copies." },
        { t: "Disagree: convert everything to relational tables instead", why: "Forcing nested and free-text data into fixed columns loses detail; route each source to its own home." },
      ],
      sol: ["Separate \"what shape is it?\" from \"what environment does the business need?\"", "Route each shape to its primary home; consider a lake only when variety, originals, changing questions, volume and governance all point that way."] },
    { q: "If VVMG did build a lake, what would happen to the relational sales database?",
      right: "It would stay the authoritative home; the lake would hold selected copies as an additional environment",
      rightWhy: "A lake never replaces the primary homes.",
      wrong: [
        { t: "It would be retired, since the lake holds everything", why: "Enforced relationships and one authoritative record per order still need the relational home." },
        { t: "It would become the data warehouse automatically", why: "A warehouse is a separately prepared environment for recurring reports." },
        { t: "It would move into the archive", why: "Current sales are in active use; archives hold old records kept for retention." },
      ],
      sol: ["Ask what a lake is for: access to varied raw copies.", "Authoritative sales records stay in the relational database; the lake is optional and additional."] },
    { q: "Once the data is in a lake, who decides what the hoodie numbers mean?",
      right: "People: the lake supports access to data, but humans still weigh the evidence and draw conclusions",
      rightWhy: "Data environments support access; judgment stays human.",
      wrong: [
        { t: "The lake, because it holds all the raw data together", why: "Storing data does not interpret it." },
        { t: "Whichever source has the most rows", why: "Volume is not validity; app views outnumber sales but are not sales." },
        { t: "Nobody needs to; raw data speaks for itself", why: "Raw data still has scope limits and must be interpreted." },
      ],
      sol: ["Does storing data together answer a business question?", "No. It makes sources reachable; people still decide what they prove."] },
    { q: "What is the core difference between a data lake and a data warehouse?",
      right: "Readiness: a lake keeps varied data close to arrival form; a warehouse holds data prepared for recurring reports",
      rightWhy: "Receiving area vs organized shelving.",
      wrong: [
        { t: "Size: a lake is just a bigger warehouse", why: "The difference is preparation, not size." },
        { t: "A lake holds only unstructured data; a warehouse holds only structured data", why: "A lake can hold structured exports too; what matters is that they are not reshaped first." },
        { t: "A warehouse is for raw data and a lake is for cleaned data", why: "That is reversed." },
      ],
      sol: ["Think receiving area vs organized shelving.", "Lake: raw, varied, before questions are known. Warehouse: cleaned and standardized for recurring reports."] },
  ];

  const lakeGen = STUDY.makeGenerator({
    id: "k201-ch11-lake",
    name: "Data lake vs data warehouse",
    blurb: "Tell a lake from a warehouse and weigh the five criteria for when a lake is justified.",
    variants: [
      ...lwSort,
      {
        name: "Sort the lake signals",
        make() {
          const sc = lakeScenario("any");
          const items = U.sample(sc.lines, 4).map(l => ({ t: l.text, cat: l.lake ? "Points toward a lake" : "Points toward a simpler approach",
            why: `${l.c} criterion: ${l.lake ? "this condition favours a lake." : "this condition favours keeping things simpler."}` }));
          return Q.classify({
            q: "<p>Classify each condition by which way it points.</p>", cats: ["Points toward a lake", "Points toward a simpler approach"], items,
            sol: S("Match each condition to one of the five criteria: variety, originals, changing questions, volume/frequency, governance.",
              "Lake: many differently shaped sources together, originals needed, changing questions, volume beyond manual work, defined governance. Simpler: the opposite of each."),
          });
        },
      },
      {
        name: "Count the criteria that point to a lake",
        make() {
          const sc = lakeScenario("any");
          const org = U.pick(ORGS);
          const traps = [];
          if (5 - sc.n !== sc.n) traps.push({ value: 5 - sc.n, why: "That counts the conditions favouring a simpler approach." });
          if (sc.n !== 5 && sc.n !== 0) traps.push({ value: 5, why: "Not every condition favours a lake; read each one." });
          return Q.num({
            q: `<p>${org} is considering a data lake:</p>${ul(sc.lines.map(l => l.text))}<p>How many of the five lake criteria point <b>toward</b> a lake?</p>`,
            answer: sc.n, kind: "count", unit: "criteria", traps,
            sol: S("Map each statement to a criterion and ask which side it falls on.",
              ul(sc.lines.map(l => `${l.c}: ${l.lake ? "<b>lake</b>" : "simpler"}`)) + `Total pointing to a lake: <b>${sc.n}</b>.`),
          });
        },
      },
      {
        name: "Decide: is a lake justified?",
        make() {
          const mode = U.pick(["yes", "gov", "no"]);
          const sc = lakeScenario(mode);
          const org = U.pick(ORGS);
          const A = {
            yes: "Yes: a lake is justified as an additional environment, while primary homes stay in place",
            gov: "Not yet: define ownership, access, retention and approved use first; simpler is safer until then",
            no: "No: the current primary homes and simple extracts are enough",
          };
          const W = {
            yes: "The conditions line up, governance included, so a lake is reasonable (as an extra, not a replacement).",
            gov: "Several conditions favour a lake, but governance is not yet defined, and the chapter says simpler is safer until it is.",
            no: "Few or no conditions favour a lake, so the added complexity is not justified.",
          };
          return Q.mc({
            q: `<p>${org} reports:</p>${ul(sc.lines.map(l => l.text))}<p>Is a data lake justified?</p>`,
            right: A[mode], rightWhy: W[mode],
            wrong: [
              ...Object.keys(A).filter(k => k !== mode).map(k => ({ t: A[k], why: W[mode] })),
              { t: "Yes: replace the relational database with the lake", why: "Even when a lake is justified, it does not replace the primary homes." },
            ],
            sol: S("Weigh all five criteria together, and check governance separately: without it, simpler is safer.",
              ul(sc.lines.map(l => `${l.c}: ${l.lake ? "lake" : "simpler"}`)) + W[mode]),
          });
        },
      },
      conceptVariant("Lake misconceptions", "k201-ch11-lake-c", LAKE_CONCEPTS),
    ],
  });

  /* ============================================================
   * TOPIC 7 · Micro-disruptions and act / pause / investigate
   * ============================================================ */
  const CALLS = ["Act", "Pause", "Investigate while planning"];
  const CALL_BANK = [
    { t: "Notes confirm the hoodie was fully stocked and front-and-centre all day, app views were low, and sales were low across three events. The plan is due.", cat: "Act", why: "Availability, interest and sales all agree: the evidence is sufficient and consistent, so reduce or cut the hoodie." },
    { t: "Sales, app activity and comments all show the beanie selling out within an hour at every pop-up, with notes confirming no stock problems.", cat: "Act", why: "Consistent evidence from several sources supports increasing stock." },
    { t: "Every source agrees the tote bag sells steadily at the truck and nobody reports stock issues. The team decides whether to keep it in next month's plan.", cat: "Act", why: "Nothing conflicts; keeping it is a well-supported decision." },
    { t: "Three seasons of consistent sales, steady app interest, and notes showing normal stock all support keeping the scarf at its current quantity.", cat: "Act", why: "The evidence is ample and consistent." },
    { t: "The game-day orders failed to load, so nobody knows how many hoodies sold, and the restock order can wait two weeks.", cat: "Pause", why: "The key evidence is missing and waiting costs little, so hold the decision." },
    { t: "Sales say the hoodie flopped, notes say it sold out, and app logs for that week were corrupted. Nothing has to be decided until next month.", cat: "Pause", why: "Conflicting and unreliable evidence with no deadline: pause rather than guess." },
    { t: "A big restock would lock in a large non-refundable order, and the data team just found duplicate order rows. The supplier deadline is a month away.", cat: "Pause", why: "High cost of acting on unreliable data, and time to wait." },
    { t: "Comments rave about a new hat, but there are no sales or app data yet, and the decision is not due for six weeks.", cat: "Pause", why: "Only sentiment exists; with no deadline, hold until real evidence arrives." },
    { t: "Sales were low, but a note says mediums sold out by noon and app views spiked. The monthly plan is due Friday.", cat: "Investigate while planning", why: "Interest signals conflict with low sales and the plan cannot wait: keep a modest quantity and track specific evidence." },
    { t: "Many students saved HOODIE15 but few redeemed it, and the truck plan is due tomorrow.", cat: "Investigate while planning", why: "Plan cautiously now and investigate why saves did not convert (price? sizes? location?)." },
    { t: "location_checked events for the stadium truck jumped, but the truck was parked elsewhere that day. The plan for the next game is due this week.", cat: "Investigate while planning", why: "Make a cautious placement decision now and collect evidence on whether location drove low sales." },
    { t: "Comments are enthusiastic but come from a handful of customers, and sales are mixed. The featured-product slot must be filled for next week.", cat: "Investigate while planning", why: "Fill the slot cautiously, and gather broader evidence than a vocal few." },
  ];
  const callSort = sortVariants({
    key: "k201-ch11-call", bank: CALL_BANK, cats: CALLS,
    defs: { "Act": "evidence is sufficient and consistent; go ahead", "Pause": "evidence is too conflicting, unreliable or missing, and waiting is acceptable", "Investigate while planning": "a decision is due, so make a cautious one while collecting specific evidence" },
    ask: "situation", hint: "Ask two things: is the evidence sufficient and consistent, and must a decision be made now?",
  }).filter(v => v.name === "Name the category" || v.name === "Pick the example");

  const RISK_BANK = [
    { t: "Dropping the hoodie because only 4 sold, without checking whether it was on the truck", cat: "Risk 1: low sales read as low interest", why: "Low sales may reflect no chance to buy, not lack of interest." },
    { t: "Concluding students dislike the hoodie without looking at app views or searches", cat: "Risk 1: low sales read as low interest", why: "Ignores evidence of interest that did not convert." },
    { t: "Ignoring a note that mediums sold out by noon because \"sales are what count\"", cat: "Risk 1: low sales read as low interest", why: "Operating conditions can explain low sales." },
    { t: "Cutting a product after one event held in the rain behind a stage", cat: "Risk 1: low sales read as low interest", why: "Treats a poor opportunity to buy as proof of no demand." },
    { t: "Ordering 500 hoodies because 800 students viewed the product page", cat: "Risk 2: interest read as completed demand", why: "Views are interest, not purchases." },
    { t: "Restocking heavily because comments are enthusiastic", cat: "Risk 2: interest read as completed demand", why: "A vocal few is not market-wide demand." },
    { t: "Forecasting revenue by summing cart_total_estimated across all carts", cat: "Risk 2: interest read as completed demand", why: "Estimates on carts, many abandoned, are not money received." },
    { t: "Treating every HOODIE15 save as a future sale", cat: "Risk 2: interest read as completed demand", why: "Saving a coupon is intent; many saves are never redeemed." },
  ];
  const RISK_CATS = ["Risk 1: low sales read as low interest", "Risk 2: interest read as completed demand"];

  const DISRUPT = [
    { q: "A teammate says: \"Let's store each coupon save as a new row in the Promotions table.\" What is the error?",
      right: "Promotions holds one definition per offer; saves and redemptions are repeated customer actions that belong in app activity, linked by PromotionID",
      rightWhy: "Definitions and actions are different records in different homes.",
      wrong: [
        { t: "No error; PromotionID appears in both, so they belong together", why: "A shared identifier connects sources; it does not merge them." },
        { t: "Coupon saves should go in the archive instead", why: "They are current activity, not old retained records." },
        { t: "Coupon saves are unstructured, so they belong in a restricted repository", why: "They are semi-structured app events with labeled fields." },
      ],
      sol: ["Is a coupon save a definition of an offer, or something a customer did?", "It is an action: it lives in app activity. The Promotions row defines HOODIE15 once."] },
    { q: "A teammate reports \"hoodie sales: 214\" after adding product_viewed, coupon_saved and cart_started events to 9 completed orders. What went wrong?",
      right: "Those events are earlier stages of interest; only the 9 completed orders are sales",
      rightWhy: "Adding funnel stages to sales blurs interest and purchases.",
      wrong: [
        { t: "Nothing; every app event is a sign of demand, so it counts", why: "Interest is not a completed sale." },
        { t: "They should also have added cart_abandoned events", why: "That would make the overcount worse." },
        { t: "The total is right but should be multiplied by the hoodie price for revenue", why: "The count itself is wrong; revenue comes only from completed orders." },
      ],
      sol: ["Which of those records is a completed purchase?", "Only the completed orders: 9. Keep app activity separate so interest can be compared with sales."] },
    { q: "Twelve comments say \"OBSESSED with the crimson hoodie!!\" A manager wants to triple the order. What is the flaw?",
      right: "Comments come from a vocal few who chose to write; they show sentiment, not how many students would buy",
      rightWhy: "Enthusiasm is not measured demand.",
      wrong: [
        { t: "Comments are unstructured, so they must be ignored", why: "They are valuable for reasons and sentiment; they just cannot prove broad demand." },
        { t: "There is no flaw; twelve strong comments prove demand", why: "This is Risk 2: treating interest as completed demand." },
        { t: "The comments should first be converted into a relational table", why: "Storage format does not change what comments can prove." },
      ],
      sol: ["Who writes comments, and how many students do they represent?", "A vocal few. Check sales and app activity before scaling up."] },
    { q: "One pop-up note says the hoodie sold out by noon. A teammate concludes \"it sells out everywhere.\" What is wrong?",
      right: "A note describes conditions at one location and event; it cannot speak for other locations",
      rightWhy: "Notes are local operating evidence.",
      wrong: [
        { t: "Notes are always inaccurate, so ignore it", why: "The note may be perfectly accurate; its scope is just one event." },
        { t: "Nothing; one sell-out proves high demand everywhere", why: "That over-generalizes from one location." },
        { t: "The note should be archived immediately", why: "It is current and relevant; archives are for old retained records." },
      ],
      sol: ["What is the scope of a single staff note?", "One location, one event. Look for notes and sales from other locations."] },
  ];

  const CHECKS = [
    { t: "Check pop-up notes for whether the hoodie was actually available", ok: true, why: "Availability is the first explanation to rule out (Risk 1)." },
    { t: "Look at app activity for views, saves, searches and location checks", ok: true, why: "Shows whether interest existed that did not convert." },
    { t: "Read comments for stated reasons, remembering they are a vocal few", ok: true, why: "Gives reasons, with the right caveat." },
    { t: "Compare interest against completed orders rather than adding them together", ok: true, why: "Keeps stages separate so the gap is visible." },
    { t: "Add cart_total_estimated values into the revenue figure", ok: false, why: "Estimates are projections, not revenue." },
    { t: "Build a data lake before looking at anything", ok: false, why: "A lake is not required to answer this, and shape alone does not justify one." },
    { t: "Treat the sales table as the full answer since it is accurate", ok: false, why: "Accurate within its scope, but incomplete for this decision." },
    { t: "Drop guest sessions because they have no customer_id", ok: false, why: "Guest sessions are real activity." },
  ];

  const judgeGen = STUDY.makeGenerator({
    id: "k201-ch11-judge",
    name: "Judgment: disruptions and act / pause / investigate",
    blurb: "Catch tempting reasoning errors and match the call to the strength of the evidence.",
    variants: [
      ...callSort,
      {
        name: "Sort the calls",
        make() {
          const items = CALLS.flatMap(c => U.deal("k201-ch11-calls:" + c, CALL_BANK.filter(b => b.cat === c), 1));
          items.push(U.pick(CALL_BANK.filter(b => !items.includes(b))));
          return Q.classify({
            q: "<p>Choose the best call for each situation.</p>", cats: CALLS, items,
            sol: S("Two questions: is the evidence sufficient and consistent, and must a decision be made now?",
              ul(["Consistent and sufficient → <b>Act</b>.", "Conflicting/unreliable/missing and waiting is fine → <b>Pause</b>.", "A decision is due but evidence is incomplete → <b>Investigate while planning</b>."])),
          });
        },
      },
      {
        name: "Which risk is this?",
        make() {
          const items = U.deal("k201-ch11-risk", RISK_BANK, 4);
          if (new Set(items.map(i => i.cat)).size === 1) items[3] = U.pick(RISK_BANK.filter(b => b.cat !== items[0].cat));
          return Q.classify({
            q: "<p>Each move is a mistake about the Crimson Campus Hoodie. Which risk does each one fall into?</p>", cats: RISK_CATS, items,
            sol: S("Ask whether the move under-reads interest (because sales are low) or over-reads it (because interest is high).",
              "Risk 1 cuts too early on low sales; Risk 2 restocks too eagerly on views, saves, carts or comments."),
          });
        },
      },
      conceptVariant("Spot the micro-disruption", "k201-ch11-disrupt", DISRUPT),
      {
        name: "Checks before cutting the hoodie",
        make() {
          const good = U.sample(CHECKS.filter(c => c.ok), U.randInt(1, 4));
          const bad = U.sample(CHECKS.filter(c => !c.ok), 5 - good.length);
          return Q.multi({
            q: "<p>Sales say \"cut the Crimson Campus Hoodie.\" Select <b>every</b> step that a careful analyst should take before deciding.</p>",
            options: [...good, ...bad],
            sol: S("Guard against both risks: low sales as low interest, and interest as demand.",
              "Check availability, look at interest in app activity, read comments with caution, and compare interest with completed orders. Never add estimates or drop guest sessions."),
          });
        },
      },
    ],
  });

  const generators = [shapeGen, rawGen, jsonGen, routeGen, proveGen, lakeGen, judgeGen];

  STUDY.registerUnit(C, {
    id: "ch11", order: 11,
    title: "Chapter 11 · Choosing the Right Home for Business Data",
    short: "Ch 11 · Data homes",
    description: "Classify data by shape, read nested app JSON, route each source to the right storage home, judge when a data lake is justified, and keep interest separate from completed sales.",
    notes, flashcards, cues, generators,
  });
})();
