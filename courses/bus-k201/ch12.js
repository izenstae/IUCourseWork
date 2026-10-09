/* ============================================================
 * BUS K201 · Chapter 12 · Modern Data Architectures and GenAI Collaboration
 * Routing vs architecture, derived tables, source meaning and limits,
 * grain, identifier mappings and cardinality, provenance and
 * traceability, architecture components, CORE prompts, auditing an
 * AI-drafted architecture, and defending a human approval decision.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const C = "bus-k201";

  /* ---------- small local helpers ---------- */
  const S = K.S;
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const tbl = (head, rows) => `<table class="data-tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const $ = x => U.money(x);
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  /* numeric question whose traps never coincide with the answer */
  const numQ = o => Q.num({ ...o, traps: (o.traps || []).filter((t, i, arr) => Math.abs(t.value - o.answer) > Math.max(0.011, Math.abs(o.answer) * 0.01) && arr.findIndex(x => x.value === t.value) === i) });

  /* A small entity box drawn as theme-aware inline SVG. */
  function entityBox(title, fields) {
    const w = 260, rowH = 22, h = 34 + fields.length * rowH + 8;
    let s = `<svg viewBox="0 0 ${w + 20} ${h + 20}" style="max-width:100%;height:auto" role="img" aria-label="${title} table">`;
    s += `<rect x="10" y="10" width="${w}" height="${h}" rx="6" fill="none" stroke="currentColor"/>`;
    s += `<text x="${10 + w / 2}" y="32" text-anchor="middle" fill="currentColor" font-weight="bold" font-size="15">${title}</text>`;
    s += `<line x1="10" y1="42" x2="${10 + w}" y2="42" stroke="currentColor"/>`;
    fields.forEach((f, i) => {
      s += `<text x="24" y="${62 + i * rowH}" fill="currentColor" font-size="13" font-family="monospace">${f}</text>`;
    });
    return s + `</svg>`;
  }

  /* Random orders with order items. At least one order has 2+ lines. */
  const PRODUCTS = [["P-110", "Crimson Campus Hoodie", 48], ["P-205", "Phone grip", 12], ["P-318", "Game-day tee", 24],
    ["P-402", "Water bottle", 18], ["P-517", "Knit beanie", 20], ["P-623", "Lanyard", 8]];
  function orderData() {
    const nCust = U.randInt(2, 3);
    const custs = U.sample(["C-101", "C-102", "C-103", "C-104", "C-105"], nCust).sort();
    const nOrders = U.randInt(3, 4);
    const orders = [];
    let itemNo = U.randInt(1, 40);
    for (let i = 0; i < nOrders; i++) {
      const oid = "O-" + (5001 + i);
      const cust = i < nCust ? custs[i] : U.pick(custs);
      const nItems = i === 0 ? U.randInt(2, 3) : U.randInt(1, 3);
      const items = U.sample(PRODUCTS, nItems).map(p => {
        const qty = U.randInt(1, 3);
        return { iid: "OI-" + (700 + itemNo++), oid, pid: p[0], qty, amt: qty * p[2] };
      });
      orders.push({ oid, cust, items, total: sum(items.map(x => x.amt)) });
    }
    return { custs, orders, lines: orders.flatMap(o => o.items.map(it => ({ ...it, cust: o.cust, total: o.total }))) };
  }
  function flatTable(d, withItemId) {
    const head = ["OrderID", "CustomerID", "OrderTotal"].concat(withItemId ? ["OrderItemID"] : []).concat(["ProductID", "Qty", "LineAmount"]);
    return tbl(head, d.lines.map(l => [l.oid, l.cust, $(l.total)].concat(withItemId ? [l.iid] : []).concat([l.pid, l.qty, $(l.amt)])));
  }

  /* Random app activity for customers who also have completed-order revenue. */
  const EVENT_TYPES = ["product_viewed", "coupon_saved", "cart_started", "location_check", "product_viewed", "coupon_saved"];
  function activityData() {
    for (let guard = 0; guard < 500; guard++) {
      const custs = U.sample(["C-101", "C-102", "C-103", "C-104", "C-105"], 3).sort();
      const counts = U.shuffle([0, U.randInt(2, 4), U.randInt(1, 3)]);
      const rev = custs.map(() => U.randInt(8, 60) * 5);
      const events = [];
      let ev = U.randInt(100, 300), sess = U.randInt(20, 60);
      custs.forEach((c, i) => {
        let s = "S-" + (sess++);
        for (let k = 0; k < counts[i]; k++) {
          if (k === 2) s = "S-" + (sess++);
          events.push({ cust: c, sess: s, eid: "E-" + (ev++), type: U.pick(EVENT_TYPES) });
        }
      });
      const trueRev = sum(rev);
      const withEv = custs.map((c, i) => counts[i] > 0 ? 1 : 0);
      const repeated = sum(custs.map((c, i) => rev[i] * counts[i]));
      const revWithEv = sum(custs.map((c, i) => rev[i] * withEv[i]));
      const near = (a, b) => Math.abs(a - b) <= Math.max(1, b * 0.01);
      if (near(repeated, trueRev) || near(repeated, revWithEv) || near(revWithEv, trueRev)) continue;
      return { custs, counts, rev, events, trueRev, repeated, revWithEv, kept: sum(withEv) };
    }
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "From routing to architecture, and when a derived table holds up",
      lo: "Explain how a data architecture differs from routing sources, and when a derived table is defensible.",
      html: `<p>In Chapter 11 you <b>routed</b> each source: you decided what kind of data it was and which storage home suited it. Chapter 12 asks the next question. Once every source has a home, how do they stay <b>available, connected and trustworthy</b> when people use them <em>together</em>? The answer to that is a <b>data architecture</b>: a business's plan for how it stores, connects and serves data for a specific purpose.</p>
<p>A helpful picture: a schema is the blueprint of one building, and the DBMS is the building itself. The architecture is the <b>site plan for the whole campus</b>. It shows which buildings exist, what each one holds, and how people move between them without getting lost.</p>
<p>Architectures usually include <b>derived tables</b>. A derived table is new data built from existing sources for one analytical purpose, by selecting, combining, calculating or summarizing. A derived table <b>holds up</b> only when all three of these are true:</p>
${ul(["the <b>original records still exist</b>, so the summary can be rechecked;", "the <b>transformation is traceable</b>, so someone can show exactly how it was built;", "the result <b>still means what the source meant</b>, so a count of cart starts is not relabeled as purchases."])}
<div class="keyidea"><b>Key idea.</b> Routing answers "where does this source live?" Architecture answers "how do the sources work together without losing what each one means?" A derived table is welcome as long as it sits on top of the originals, can be traced, and keeps the source's meaning.</div>
<div class="example"><b>Example.</b> Lakeside Bikes (a made-up two-shop repair business) builds a <code>MonthlyRepairRevenue</code> table by summing paid invoice lines by month. The invoice tables remain, the query and run date are saved, and "revenue" still means paid invoice lines. It holds up. If the shop then deleted the invoice lines to save space, the same table would no longer hold up, because nobody could recheck it.</div>
<div class="trap"><b>Common trap.</b> Thinking that once every source has the "right" storage home, the job is done. Correct routing can still produce a broken architecture if a summary replaces the originals or a join destroys the level of detail.</div>`,
      gens: ["k201-ch12-arch"],
    },
    {
      title: "Source meaning, business rules and source limits",
      lo: "State what each VVMG source represents, the business rules that govern it, and what it can and cannot establish.",
      html: `<p>Before you connect sources, pin down what each record <b>means</b>. At VVMG (Valid Varsity Mobile Goods, the campus apparel and merch retailer that sells from a mobile truck, pop-up shops and an app) the sources look related, but they are different kinds of evidence:</p>
<table class="data-tbl"><thead><tr><th>Record</th><th>What it means</th></tr></thead><tbody>
<tr><td>Order</td><td>a completed transaction</td></tr>
<tr><td>Order item</td><td>one product line inside an order</td></tr>
<tr><td>Product view</td><td>someone opened a product page</td></tr>
<tr><td>Coupon save</td><td>interest in an offer</td></tr>
<tr><td>Cart start / estimated cart total</td><td>an early shopping step; the total is provisional until an order completes</td></tr>
<tr><td>Location check</td><td>app behavior (it can be done from a dorm room), not proof of a visit</td></tr>
<tr><td>Coupon redemption</td><td>a promotion used in connection with an order</td></tr>
<tr><td>Customer comment</td><td>what one customer said</td></tr>
<tr><td>Pop-up note</td><td>an employee's observation at one event and location</td></tr>
</tbody></table>
<p>These can all live in one governed platform, but they <b>cannot be relabeled as the same measure</b>. VVMG's business rules make that concrete: revenue comes only from completed orders and order items; an estimated cart total is not revenue; a saved coupon is not a redemption, and a redemption should connect to an order; a view is not a purchase; comments and notes are not transaction records; a pending, inactive or retired product is never treated as sellable.</p>
<p>Each source also has <b>limits</b>. Sales records establish completed purchases, units, prices and revenue, but not unmet demand, availability or intent. The product catalog establishes details, price and approval status, but not whether anyone wanted or bought the item. App activity shows views, saves, searches and carts, but not a purchase unless it links to an order. A comment shows one customer's wording and reason, not how widespread the view is. A pop-up note shows what happened at one location, not demand everywhere.</p>
<div class="keyidea"><b>Key idea.</b> For every source ask two questions: "What does one of these records mean?" and "What can it prove on its own, and what can it not?" Revenue is summed only from completed sales.</div>
<div class="example"><b>Example.</b> This month the app logged $3,900 in estimated cart totals and completed orders came to $2,450. Revenue is $2,450. The $3,900 is useful to show next to it (it tells you how much shopping started), but adding the two would report money nobody paid.</div>
<div class="trap"><b>Common trap.</b> Treating coupon saves or product views as "basically sales". They signal interest. Only a completed order (and a redemption linked to one) shows that something was bought.</div>`,
      gens: ["k201-ch12-meaning"],
    },
    {
      title: "Grain: what one record represents",
      lo: "Identify the grain of a source and predict what goes wrong when grains are mixed in one row.",
      html: `<p>The <b>grain</b> of a table is what one row stands for: one customer, one product, one order, one product line within an order, one app session, one app event, one comment, one note. Every table has exactly one grain, and the grain decides which identifier makes a row unique.</p>
<p>Trouble starts when two grains are squeezed into one row. Look at an order with two lines that has been flattened so each row carries the order total too:</p>
${tbl(["OrderID", "OrderTotal", "ProductID", "LineAmount"], [["O-7", "$60", "P-1", "$40"], ["O-7", "$60", "P-2", "$20"], ["O-8", "$25", "P-3", "$25"]])}
<p>Real revenue is $40 + $20 + $25 = <b>$85</b>. But summing <code>OrderTotal</code> gives $60 + $60 + $25 = <b>$145</b>, because the order-level value repeats on every line. Counting rows says there were 3 orders when there were 2. The same thing happens the other way round: if a customer-level row has only one slot for <code>session_id</code> and one for <code>event_id</code>, a customer with nine events keeps one and the other eight silently disappear.</p>
<div class="keyidea"><b>Key idea.</b> Mixing grains in one row causes three symptoms: values duplicate, repeated activity drops out, and totals stop matching the source records. Keep each source at its own grain and summarize on purpose, with the grain stated.</div>
<div class="example"><b>Example.</b> A Planning table repeats each customer's lifetime revenue once per app event so the events "fit". A customer with $200 of revenue and four events now contributes $800 when the column is summed, and a customer who bought at the truck but never used the app vanishes from the table entirely.</div>
<div class="trap"><b>Common trap.</b> Assuming a wide, one-row-per-customer table is "simpler" and therefore safer. It is simpler to read, but it can only hold one value per column, so anything the customer did more than once has to be duplicated or thrown away.</div>`,
      gens: ["k201-ch12-grain"],
    },
    {
      title: "Identifiers, mappings and relationships",
      lo: "Map identifiers across sources and state the one-to-many relationships an architecture must preserve.",
      html: `<p>VVMG's structured tables use <code>CustomerID</code>, <code>ProductID</code>, <code>PromotionID</code>, <code>LocationID</code>, <code>OrderID</code> and <code>OrderItemID</code>. The app's records use <code>customer_id</code>, <code>product_id</code>, <code>promotion_id</code>, <code>location_id</code>, <code>order_id</code>, <code>session_id</code> and <code>event_id</code>. The mappings are:</p>
${ul(["CustomerID ↔ customer_id, ProductID ↔ product_id, PromotionID ↔ promotion_id, LocationID ↔ location_id;", "OrderID ↔ order_id, <b>but</b> order_id appears only on coupon-redemption events. It links redemptions to their orders. It is not a general bridge from app activity to sales;", "OrderItemID, session_id and event_id have <b>no partner</b>. They carry each source's own grain."])}
<p>Similar names <em>suggest</em> a match. They do not prove one, so each mapping is verified on sample records and documented before anyone relies on it.</p>
<p>Then state the <b>relationships and cardinality</b> the design must keep: one customer → many orders; one order → many order items; one product → many order items; one known customer → many sessions (and a guest session may have no customer at all, so that link is optional); one session → many events; one promotion → many coupon saves, many redemptions and many completed orders.</p>
<div class="keyidea"><b>Key idea.</b> A line drawn between two tables shows that they connect. It does not show that the connection is right. Write the cardinality down and check that the structure can actually hold "many".</div>
<div class="example"><b>Example.</b> A draft puts one <code>session_id</code> column and one <code>event_id</code> column in the Customers table. That design has room for one session and one event per customer. To keep "one customer → many sessions → many events", sessions and events need their own records, each pointing back to its parent.</div>
<div class="trap"><b>Common trap.</b> Using <code>order_id</code> to link every app event to a sale. Views, saves and cart starts carry no order_id, so they either drop out or get tied to purchases they never caused.</div>`,
      gens: ["k201-ch12-ids", "k201-ch12-grain"],
    },
    {
      title: "Provenance and traceability",
      lo: "Explain provenance and traceability and list what must be documented for a derived field or score.",
      html: `<p><b>Provenance</b> is where data came from: which system, which export, when. <b>Traceability</b> is the ability to follow a derived field, category or summary back to the source records and the logic that produced it. Provenance tells you the starting point; traceability lets you walk the path from the finished number back to that starting point.</p>
<p>For any derived field, summary or score, document:</p>
${ul(["which <b>sources</b> were used;", "which <b>fields</b> were used;", "how <b>identifiers were matched</b> across sources;", "the <b>calculation</b> or logic;", "<b>when</b> it was created;", "which <b>original records</b> support it."])}
<div class="keyidea"><b>Key idea.</b> A polished field name proves nothing. <code>HighDemand</code> or <code>MonthlyDemandScore</code> is only as trustworthy as the documented logic and source records behind it.</div>
<div class="example"><b>Example.</b> A report says hoodie revenue was $1,240 last month. A traceable design lets you list the 31 order lines behind that figure, show the query that summed them, and confirm that the run date covered the whole month. If the figure had come from a spreadsheet nobody saved, the number might still be right, but no one could show it.</div>
<div class="trap"><b>Common trap.</b> Confusing "everyone uses it" or "the AI said it is reliable" with traceability. Popularity and confidence are not a path back to source records.</div>`,
      gens: ["k201-ch12-trace"],
    },
    {
      title: "Architecture components and the four foundational tests",
      lo: "Match business needs to architecture components and test a design against the four foundational tests.",
      html: `<p>A typical VVMG-style architecture combines several components, each chosen for what it is good at:</p>
${ul(["<b>Relational database</b>: the authoritative structured records (Customers, Products, Locations, Promotions, Orders, OrderItems) with keys and enforced relationships.",
  "<b>Document / JSON storage</b>: app sessions and their nested, variable events.",
  "<b>Optional shared data environment (data lake)</b>: varied raw files kept close to the form they arrived in. Storing them side by side does not make them the same kind of record.",
  "<b>Restricted repository or archive</b>: customer comments and pop-up notes, where access, retention and approved use are core design decisions.",
  "<b>Reporting layer</b>: prepared, validated data for a recurring question (validated sales totals, separate counts of views and saves, approval status, location summaries, links back to comments and notes). It sits on top of the sources and never replaces them, and every field in it is traceable."])}
<p>Then run the <b>four foundational tests</b>:</p>
<ol><li>Do the <b>original sources stay available</b>?</li><li>Are <b>grain and relationships intact</b>?</li><li>Are <b>derived fields traceable</b>?</li><li>Does the design respect <b>what each source can and cannot prove</b>?</li></ol>
<div class="keyidea"><b>Key idea.</b> Match each need to the component built for it, then test the whole design. The warning sign to watch for is one flat "Planning" table that stores customers, orders, items, events, comments and notes as if they were the same kind of record.</div>
<div class="example"><b>Example.</b> A manager wants a monthly view of which promotions led to completed sales. Orders and redemptions live in the relational database and JSON store; the reporting layer prepares "redemptions linked to completed orders, by promotion", traceable through order_id. The comments that mention the promotion stay in the restricted archive, linked rather than copied.</div>
<div class="trap"><b>Common trap.</b> Treating the reporting layer as the new source of truth. It is a convenience built on top; if a reporting figure and the source records disagree, the source records win and the report gets fixed.</div>`,
      gens: ["k201-ch12-arch"],
    },
    {
      title: "GenAI as a thinking partner and the CORE prompt",
      lo: "Write a CORE prompt that communicates architecture requirements and explain why the AI's proposal is still a draft.",
      html: `<p>A prompt to a tool such as Gemini is really a <b>requirements brief</b>. The AI cannot recover a rule, limit or relationship you left out; it fills the gap with an assumption, often a plausible-sounding one. The <b>CORE</b> framework keeps the brief complete:</p>
${ul(["<b>Context</b>: the business situation and the verified sources (\"VVMG sells from a mobile truck, at pop-ups and through an app; our sources are…\").",
  "<b>Objective</b>: what the architecture must support (\"a monthly inventory and promotion planning report\").",
  "<b>Role</b>: the perspective to take (\"act as a cautious business systems analyst\").",
  "<b>Expectations</b>: requirements, limits, assumptions to list and validation checks to include (\"state the grain of each table; do not treat estimated cart totals as revenue\")."])}
<p>The AI is genuinely useful: it can organize requirements, suggest components, propose identifiers and relationships, name derived fields, point out assumptions and revise. But left alone it tends to merge Orders and OrderItems, flatten many events into one customer row, combine views, saves and sales into one "demand" measure, invent scores that add unlike measures, turn comments into fixed categories and drop the text, omit approval status, and assume similarly named fields match. Its answers also vary from run to run.</p>
<div class="keyidea"><b>Key idea.</b> A good prompt improves the draft; it does not approve it. You still check that every requirement appears, structures fit meaning and grain, identifiers and cardinality are right, calculations are supported and traceable, assumptions are visible, and revisions did not create new problems.</div>
<div class="example"><b>Example.</b> A prompt that says "act as a cautious analyst and design a planning architecture for VVMG" has Role and Objective but no Context (which sources?) and no Expectations (which rules?). The draft will guess both.</div>
<div class="trap"><b>Common trap.</b> Thinking a detailed Role ("you are a world-class architect") substitutes for Expectations. The role sets the tone; only the expectations tell the AI which rules it must not break.</div>`,
      gens: ["k201-ch12-core"],
    },
    {
      title: "Auditing an AI-generated architecture",
      lo: "Audit an AI proposal with the ten-question checklist and recommend specific revisions.",
      html: `<p>Audit a proposal with the <b>Architecture Requirements Checklist</b>:</p>
<ol><li>What does each source represent?</li><li>What does one record represent (grain)?</li><li>Which identifiers preserve that grain?</li><li>How do differently named identifiers map across sources?</li><li>Which one-to-many relationships must remain intact?</li><li>Which business rules control interpretation?</li><li>Where will original sources remain available?</li><li>How will derived fields and summaries remain traceable?</li><li>Which access and retention controls apply?</li><li>What can each source establish, and what can it not prove alone?</li></ol>
<p>For each flaw you find, write three things: the <b>requirement it violates</b>, the <b>business consequence</b>, and a <b>specific correction</b>. Typical flaws: a reporting structure replaces original records; different records collapse into one customer- or product-level row; repeated records vanish or totals duplicate; similar names are assumed to match; unlike evidence is combined into one demand measure; pending products look sellable or estimated values look like revenue; a score has no defensible logic; comments, notes or app activity are presented as proof of demand or revenue; sensitive text is broadly available; assumptions are embedded silently.</p>
<div class="keyidea"><b>Key idea.</b> "This is wrong" is not an audit finding. "This violates grain; order revenue will be overstated; keep OrderID and OrderItemID with Order → OrderItems one-to-many" is.</div>
<div class="example"><b>Example.</b> A draft combines <code>product_viewed</code>, <code>coupon_saved</code>, <code>coupon_redeemed</code> and purchases into one <code>Demand</code> number. Violated requirement: what each source represents and can prove. Consequence: interest, promotion use and completed sales are treated as the same evidence, so a heavily browsed product can outrank a steady seller. Fix: report them as separate fields in the same report, and document any derived measure.</div>
<div class="trap"><b>Common trap.</b> Throwing out a whole proposal because one part is wrong. A real audit also names what is defensible (for example, a governed raw-data area that keeps copies of the originals, or visible approval status) so it survives the revision.</div>`,
      gens: ["k201-ch12-audit"],
    },
    {
      title: "Defending a human approval decision",
      lo: "Choose accept, accept in part, revise or reject, and defend it with evidence, accountability and a validation step.",
      html: `<p>After the audit, a person decides:</p>
${ul(["<b>Accept</b>: the proposal meets the requirements; approve it, with a validation step.",
  "<b>Accept in part</b>: approve the sound components now and withhold approval of a separable, unsupported part.",
  "<b>Revise</b>: send it back with specific corrections; a flaw in something the design depends on must be fixed before approval.",
  "<b>Reject</b>: the core design cannot meet the requirements; start again from the requirements."])}
<p>A defensible decision names one defensible feature, one violated requirement, its business consequence, a specific revision, the <b>accountable person</b> (the approving manager owns the result, not the AI) and a <b>validation step</b>, such as reconciling derived totals to source Orders and OrderItems, back-testing a score against past results, or verifying identifier mappings on sample records.</p>
<div class="keyidea"><b>Key idea.</b> Approving the structure is not approving the logic. A manager can approve how sources are stored and connected while withholding approval of a reporting score that has not been justified.</div>
<div class="example"><b>Example.</b> A revised VVMG design keeps Orders and OrderItems separate, keeps sessions (guest sessions included) with their events, stores comments and notes with text and metadata, maps ProductID ↔ product_id, shows approval status and keeps originals behind the reporting layer. It also adds a <code>PlanningPriorityScore</code> that weights units sold, views, coupon saves, positive comments and favorable notes with unexplained weights, untested comparability and no back-testing. Decision: accept in part. Approve the structure; withhold the score until its weights are explained and back-tested.</div>
<div class="trap"><b>Common trap.</b> "Gemini designed it, so Gemini is responsible." The tool has no accountability. Whoever approves the design owns its consequences, which is exactly why the approval needs evidence and a validation step.</div>`,
      gens: ["k201-ch12-approve"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const fc = (id, tag, front, back) => ({ id: "k201-ch12-c-" + id, tag, front, back });
  const flashcards = [
    fc("arch", "Definition", "What is a <em>data architecture</em>?", "A business's plan for how it stores, connects and makes data available for a specific purpose: the site plan for the whole campus, where a schema is the blueprint of one building."),
    fc("route-vs-arch", "Difference", "What is the difference between <em>routing</em> (Ch 11) and <em>architecture</em> (Ch 12)?", "Routing decides where each source belongs. Architecture decides how the sources stay available, connected and trustworthy when they are used together."),
    fc("derived", "Definition", "What is a <em>derived table</em>?", "A new table built from existing source data for a specific analytical purpose, by selecting, combining, calculating or summarizing."),
    fc("derived-holds", "List", "When does a derived table hold up? (3 conditions)", "1) The original records are still there. 2) The transformation is traceable. 3) The derived result still means what the source meant."),
    fc("grain", "Definition", "What is <em>grain</em>?", "What one row or record represents: one customer, product, order, order line, app session, app event, comment or note."),
    fc("grain-mix", "Why", "Why is mixing grains in one row a problem? Name the three symptoms.", "Values duplicate (order totals repeat on every line), repeated activity drops out (one slot for many events), and totals stop matching the source records."),
    fc("grain-example", "Example", "Give an example of grain collapse inflating revenue.", "An order with three lines is flattened so every line carries the $90 OrderTotal. Summing OrderTotal reports $270 for a $90 order."),
    fc("map", "List", "List VVMG's identifier mappings between structured data and app data.", "CustomerID ↔ customer_id, ProductID ↔ product_id, PromotionID ↔ promotion_id, LocationID ↔ location_id, OrderID ↔ order_id (only on coupon-redemption events)."),
    fc("orderid", "Why", "Why is <code>order_id</code> not a general bridge between app activity and sales?", "It appears only on coupon-redemption events. It links a redemption to its order; views, saves and cart starts have no order_id."),
    fc("nopartner", "List", "Which VVMG identifiers have no partner in the other source, and why does that matter?", "OrderItemID, session_id and event_id. They carry their source's own grain (order line, session, event) and must be kept, not mapped away."),
    fc("similar", "Principle", "Do similar identifier names prove that two fields match?", "No. Similar names suggest a match. Verify on sample records and document the mapping before trusting it."),
    fc("card", "List", "Which one-to-many relationships must VVMG's architecture preserve?", "Customer → Orders; Order → OrderItems; Product → OrderItems; known Customer → Sessions (optional for guests); Session → Events; Promotion → coupon saves, redemptions and completed orders."),
    fc("line", "Principle", "What does a line between two tables in a diagram prove?", "Only that they connect. It does not show the connection is correct; state and check the cardinality."),
    fc("guest", "Example", "Why must the Customer → Session relationship be optional?", "Guest sessions have no customer link. Requiring a customer would drop them or force a fake customer."),
    fc("meaning-cart", "Difference", "Estimated cart total vs revenue?", "An estimated cart total is provisional, an early shopping step. Revenue comes only from completed orders and order items."),
    fc("meaning-coupon", "Difference", "Coupon save vs coupon redemption?", "A save shows interest in an offer. A redemption is a promotion actually used in connection with an order."),
    fc("meaning-loc", "Example", "What can a location check prove?", "Only app behavior. It can be done from anywhere (a dorm room), so it is not proof of a visit."),
    fc("rules", "List", "List VVMG's key business rules for interpretation.", "Pending/inactive/retired products are not sellable; revenue comes from completed orders and order items; estimated cart totals are not revenue; a saved coupon is not a redemption; a redemption should connect to an order; views are separate from purchases; comments and notes are not transaction records."),
    fc("limits", "List", "What can sales records establish, and what can they not?", "They establish completed purchases, units, prices and revenue. They cannot establish unmet demand, availability or customer intent."),
    fc("limits-text", "Difference", "What are the limits of a customer comment vs a pop-up note?", "A comment shows one customer's wording, sentiment and reason, not how representative it is. A pop-up note shows an employee's observation at one location and event, not broad demand."),
    fc("prov", "Definition", "What is <em>provenance</em>?", "Where data came from: its source system, export and timing."),
    fc("trace", "Definition", "What is <em>traceability</em>?", "The ability to follow a derived field, category or summary back to the source records and logic that produced it."),
    fc("doc", "List", "What must be documented for a derived field or score?", "Which sources, which fields, how identifiers were matched, the calculation, when it was created, and which original records support it."),
    fc("label", "Principle", "Does a field named <code>HighDemand</code> or <code>MonthlyDemandScore</code> prove anything?", "No. A polished name proves nothing; only documented, traceable logic does."),
    fc("components", "List", "Name the five architecture components and what each holds.", "Relational database (authoritative structured records); document/JSON storage (app sessions and events); optional data lake (varied raw files close to arrival form); restricted repository/archive (comments, notes); reporting layer (prepared, validated, traceable data for a recurring question)."),
    fc("reporting", "Principle", "What is the reporting layer's relationship to the sources?", "It sits on top of them and does not replace them. Every field in it must trace back to source records."),
    fc("lake", "Why", "Why doesn't storing files together in a data lake make them the same kind of record?", "Co-location is not sameness. Each file keeps its own grain, meaning and limits even when it sits next to others."),
    fc("tests", "List", "What are the four foundational tests for an architecture?", "Original sources stay available; grain and relationships stay intact; derived fields are traceable; the design respects what each source can and cannot prove."),
    fc("core", "List", "What does CORE stand for in a prompt?", "Context (business situation and verified sources), Objective (what the architecture must support), Role (the perspective to take), Expectations (requirements, limits, assumptions, validation checks)."),
    fc("prompt-brief", "Why", "Why is a prompt a requirements brief?", "The AI cannot recover a rule, limit or relationship you left out. It fills the gap with an assumption."),
    fc("ai-draft", "Why", "Why is an AI-generated architecture still a draft?", "The prompt does not approve the design, the AI may make silent assumptions, and responses vary between runs. A person must check it and own the decision."),
    fc("ai-mistakes", "List", "Name four mistakes an AI architecture draft commonly makes.", "Merging Orders and OrderItems; flattening many events into one customer row; combining views, saves and sales into one demand measure; inventing a score; dropping comment text; omitting approval status; assuming similar names match."),
    fc("checklist", "List", "List the ten Architecture Requirements Checklist questions.", "Source meaning; grain; identifiers preserving grain; identifier mappings; one-to-many relationships; business rules; where originals remain; traceability of derived fields; access and retention; what each source can and cannot prove."),
    fc("finding", "Principle", "What three parts make a good audit finding?", "The violated requirement, the business consequence, and a specific revision."),
    fc("decisions", "List", "What are the four approval decisions?", "Accept, accept in part, revise, reject."),
    fc("inpart", "Difference", "Accept in part vs revise?", "Accept in part approves the sound components now and withholds a separable unsupported part. Revise sends the proposal back because a flaw in something it depends on must be fixed first."),
    fc("account", "Principle", "Who is accountable for an approved AI-drafted architecture?", "The approving manager, not the AI."),
    fc("validate", "Example", "Give three examples of a validation step.", "Reconcile derived totals to source Orders/OrderItems; back-test a score against past results; verify identifier mappings on sample records."),
    fc("structure-logic", "Principle", "What does \"approving the structure is not approving the logic\" mean?", "A manager can approve how sources are stored and connected while withholding approval of a derived score (such as PlanningPriorityScore) whose weights and comparability are unsupported."),
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“where should this source go?”", think: "Routing (Ch 11)", why: "Choosing a storage home is routing; architecture is about how sources work together afterward." },
    { when: "“summary table”, “built from”, “rolled up”", think: "Derived table: originals kept? traceable? same meaning?", why: "A derived table holds up only when all three conditions are met." },
    { when: "“one row per customer” holding orders, events, comments", think: "Grain collapse", why: "Many-valued activity cannot fit in one row without duplicating values or dropping records." },
    { when: "OrderTotal repeated on every order line", think: "Duplicated order-level values", why: "Summing a repeated order-level value overstates revenue; count orders with distinct OrderID." },
    { when: "“the names are almost the same, so they match”", think: "Unverified identifier mapping", why: "Similar names only suggest a match; verify on sample records and document." },
    { when: "order_id used to link views or carts to sales", think: "order_id is only on redemption events", why: "It links redemptions to orders; it is not a general bridge." },
    { when: "one session_id / event_id column in a parent table", think: "Lost one-to-many relationship", why: "The parent can hold only one child; the rest is lost." },
    { when: "estimated cart total, coupon saves, views counted in revenue", think: "Business rule violation", why: "Revenue comes only from completed orders and order items." },
    { when: "“location checks show where students shop”", think: "Source limit", why: "A location check is app behavior, not proof of a visit." },
    { when: "“customers love it” from a few comments", think: "Source limit: comments aren't representative", why: "A comment shows one customer's view, not how widespread it is." },
    { when: "HighDemand, MonthlyDemandScore, PlanningPriorityScore", think: "Traceability and documented logic", why: "A polished name proves nothing; document sources, fields, matching, calculation, date and records." },
    { when: "“nested sessions with many event types”", think: "Document / JSON storage", why: "Variable, nested structure fits documents better than fixed relational columns." },
    { when: "comments and notes available to all staff", think: "Restricted repository: access and retention", why: "Sensitive text needs controlled access, retention and approved use." },
    { when: "“the report replaces the source tables”", think: "Originals must stay available", why: "The reporting layer sits on top of sources; it never replaces them." },
    { when: "“act as…”, “our sources are…”, “the design should…”, “do not…”", think: "CORE: Role, Context, Objective, Expectations", why: "Each sentence in a structured prompt does one CORE job." },
    { when: "structure is sound but a score is unsupported", think: "Accept in part", why: "Approving the structure is not approving the logic." },
    { when: "“Gemini is responsible for the design”", think: "Accountability sits with the approving manager", why: "The AI drafts; a person approves and owns the result." },
  ];

  /* ============================================================
   * TOPIC 1 · Architecture, derived tables, components, four tests
   * ============================================================ */
  const COMP_CATS = ["Relational database", "Document / JSON storage", "Data lake (shared raw-data area)", "Restricted repository / archive", "Reporting layer"];
  const COMP_DEFS = {
    "Relational database": "authoritative structured records with keys and enforced relationships",
    "Document / JSON storage": "nested, variable records such as app sessions and their events",
    "Data lake (shared raw-data area)": "varied raw files kept close to the form they arrived in",
    "Restricted repository / archive": "sensitive text where access, retention and approved use are core decisions",
    "Reporting layer": "prepared, validated, traceable data for a recurring question, built on top of the sources",
  };
  const COMP_BANK = [
    { t: "Customers, Products, Locations and Promotions tables with stable IDs and enforced relationships.", cat: COMP_CATS[0], why: "Fixed columns, keys and enforced relationships are what a relational database is built for." },
    { t: "Orders and OrderItems linked by OrderID, the authoritative record of completed purchases.", cat: COMP_CATS[0], why: "Completed transactions with a one-to-many link belong in the authoritative relational store." },
    { t: "A Products table whose ApprovalStatus must be consistent everywhere it is used.", cat: COMP_CATS[0], why: "A single, keyed, authoritative product record lives in the relational database." },
    { t: "Lakeside Bikes' paid repair invoices and invoice lines, which must total correctly to the cent.", cat: COMP_CATS[0], why: "Structured transactions with a parent-child relationship and exact totals fit a relational database." },
    { t: "Structured records where every row has the same columns and keys connect the tables.", cat: COMP_CATS[0], why: "Uniform columns plus keys is the definition of relational data." },
    { t: "App sessions, each holding a variable-length list of nested events.", cat: COMP_CATS[1], why: "Nested, variable-length records fit document storage." },
    { t: "Event records whose fields differ by type (a view has product_id, a redemption has order_id).", cat: COMP_CATS[1], why: "Records whose shape varies by type are semi-structured, a natural fit for JSON documents." },
    { t: "Clickstream from the mobile app arriving as nested JSON.", cat: COMP_CATS[1], why: "Data that already arrives as nested JSON is stored as documents." },
    { t: "A guest session with no customer link and a dozen events of different kinds.", cat: COMP_CATS[1], why: "A session document holds its own varied events, with or without a customer link." },
    { t: "App logs whose structure changes whenever the app adds a feature.", cat: COMP_CATS[1], why: "Document storage tolerates a changing shape without redesigning tables." },
    { t: "Copies of varied raw files kept close to the form in which they arrived.", cat: COMP_CATS[2], why: "Keeping raw files in arrival form is the job of a data lake or shared raw-data area." },
    { t: "A shared landing area for spreadsheets, exports and logs before anyone cleans them.", cat: COMP_CATS[2], why: "A landing area for varied, uncleaned files is a data lake." },
    { t: "Raw vendor CSVs and app exports kept so later analyses can go back to them.", cat: COMP_CATS[2], why: "Retaining raw extracts for future analysis is the lake's role." },
    { t: "Original source extracts stored side by side, each still labeled as its own kind of record.", cat: COMP_CATS[2], why: "A lake co-locates files; co-location does not make them the same kind of record." },
    { t: "Customer comments with their original wording, author and date.", cat: COMP_CATS[3], why: "Comments can be sensitive, so access and retention are controlled in a restricted repository." },
    { t: "Pop-up notes written by employees, kept with location and date.", cat: COMP_CATS[3], why: "Employee notes are kept with metadata under restricted access." },
    { t: "Free text that may contain personal details and needs retention rules.", cat: COMP_CATS[3], why: "Sensitive text with retention needs belongs in a restricted repository or archive." },
    { t: "Archived records that only approved roles may read, for approved uses.", cat: COMP_CATS[3], why: "Limiting who can read records, and for what, defines a restricted archive." },
    { t: "Validated monthly sales totals by product, ready for the planning meeting.", cat: COMP_CATS[4], why: "Prepared, validated figures for a recurring question are what the reporting layer serves." },
    { t: "Separate counts of product views and coupon saves shown next to units sold.", cat: COMP_CATS[4], why: "Presenting prepared measures side by side, without merging them, is a reporting-layer job." },
    { t: "Location summaries for a recurring question, with links back to the comments and notes.", cat: COMP_CATS[4], why: "Summaries that link back to sources sit in the reporting layer." },
    { t: "A dashboard managers open every month, built on top of the sources without replacing them.", cat: COMP_CATS[4], why: "The reporting layer sits on top of the sources and never replaces them." },
  ];
  const TESTS = ["Original sources stay available", "Grain and relationships stay intact", "Derived fields stay traceable", "The design respects what each source can and cannot prove"];
  const TEST_BANK = [
    { s: "After the reporting layer is loaded, the team deletes the raw app exports.", k: 0 },
    { s: "The original Orders table is overwritten each month by a monthly summary table.", k: 0 },
    { s: "Pop-up notes are retyped into a slide deck and the original note files are discarded.", k: 0 },
    { s: "The Planning table keeps one row per customer with a single session_id column.", k: 1 },
    { s: "Orders and OrderItems are merged into one Sales table with no OrderItemID.", k: 1 },
    { s: "Events are rolled up so that each session keeps only its most recent event.", k: 1 },
    { s: "A HighDemand flag appears in the report, but nobody recorded how it is calculated.", k: 2 },
    { s: "A MonthlyDemandScore column comes from a spreadsheet macro that no one can find.", k: 2 },
    { s: "A location summary shows totals but keeps no record of which orders it included.", k: 2 },
    { s: "Location checks in the app are reported as visits to the truck.", k: 3 },
    { s: "A product with many page views is labeled a best-seller in the report.", k: 3 },
    { s: "Three enthusiastic comments are presented as proof that all customers want a product.", k: 3 },
  ];
  const TEST_WHY = [
    "Once the originals are gone, no figure can be rechecked or rebuilt.",
    "Collapsing or dropping repeated records changes what a row means and breaks totals.",
    "Without documented logic, nobody can follow the number back to its source records.",
    "The source is being asked to prove something it cannot establish on its own.",
  ];
  const DERIVED_OPTS = ["It holds up", "It fails: the original records are not kept", "It fails: the transformation is not traceable", "It fails: the result no longer means what the source meant"];
  const DERIVED_BANK = [
    { s: "A <code>MonthlyProductSales</code> table sums completed OrderItems line amounts by product and month. Orders and OrderItems remain, and the query and run date are saved.", k: 0, why: "Originals kept, logic documented, and it still measures completed sales." },
    { s: "A <code>SessionSummary</code> table counts events per session. The raw events stay in JSON storage and the counting logic is documented.", k: 0, why: "It is a documented count on top of retained events, and an event count still means an event count." },
    { s: "A <code>LocationRevenue</code> table lists completed-order revenue per location with the order IDs it includes. The source tables are unchanged.", k: 0, why: "It is traceable to specific orders, keeps originals, and revenue still means completed orders." },
    { s: "A <code>CustomerTotals</code> table is built from Orders, and then Orders is dropped to save space.", k: 1, why: "Without Orders the totals can never be rechecked." },
    { s: "Event-level JSON is purged once daily counts of product views have been computed.", k: 1, why: "The daily counts now have nothing underneath them." },
    { s: "A <code>ProductHeat</code> table was produced in a one-off spreadsheet; nobody saved the steps.", k: 2, why: "The sources may exist, but no one can show how the numbers were made." },
    { s: "A summary reports redemptions per promotion but does not record which events or which matching rule were used.", k: 2, why: "The logic and supporting records are not documented, so it cannot be traced." },
    { s: "A <code>Purchases</code> table counts every <code>cart_started</code> event as a purchase.", k: 3, why: "A cart start is an early shopping step, not a completed purchase." },
    { s: "A <code>Revenue</code> column adds estimated cart totals to completed-order amounts.", k: 3, why: "Estimated cart totals are provisional, so the result no longer means revenue." },
    { s: "A <code>StoreVisits</code> table counts <code>location_check</code> events as visits.", k: 3, why: "A location check is app behavior, not proof of a visit." },
  ];
  const DERIVED_WRONG = [
    "Holding up needs all three: originals kept, transformation traceable, and the same meaning as the source. One of those is missing here.",
    "The originals are still available in this scenario, so this is not the failure.",
    "The steps are documented in this scenario, so traceability is not what fails.",
    "The derived result keeps the source's meaning here, so meaning is not the problem.",
  ];
  const ROUTE_CATS = ["Routing (where a source belongs)", "Architecture (how sources work together)"];
  const ROUTE_BANK = [
    { t: "Which storage home should the app's JSON events go to?", cat: ROUTE_CATS[0], why: "Choosing a home for one source is routing." },
    { t: "Is the comments file structured, semi-structured or unstructured?", cat: ROUTE_CATS[0], why: "Classifying a source's shape is the first step of routing." },
    { t: "Should pop-up notes go to a document store or a file archive?", cat: ROUTE_CATS[0], why: "Picking a storage home for a single source is routing." },
    { t: "Where does the product catalog belong?", cat: ROUTE_CATS[0], why: "This places one source; it says nothing about how sources connect." },
    { t: "How will app events stay connected to the customers and products they refer to?", cat: ROUTE_CATS[1], why: "Connecting sources is an architecture question." },
    { t: "How will the monthly sales summary stay traceable to its order lines?", cat: ROUTE_CATS[1], why: "Traceability across sources and derived tables is architecture." },
    { t: "How will the originals remain available behind the reporting layer?", cat: ROUTE_CATS[1], why: "How components relate and what stays available is architecture." },
    { t: "How will grain be preserved when orders and app activity are used together?", cat: ROUTE_CATS[1], why: "Keeping sources trustworthy when combined is architecture." },
    { t: "Which access controls apply when comments are used alongside sales data?", cat: ROUTE_CATS[1], why: "Access rules for sources used together are part of the architecture." },
  ];

  const genArch = STUDY.makeGenerator({
    id: "k201-ch12-arch",
    name: "Architecture components & derived tables",
    blurb: "Tell routing from architecture, match needs to components, judge derived tables and apply the four foundational tests.",
    variants: [
      ...K.sortVariants({
        key: "ch12-comp", bank: COMP_BANK, cats: COMP_CATS, defs: COMP_DEFS, ask: "need",
        hint: "Ask what shape the data has and what job it must do: authoritative structured records, nested activity, raw files, sensitive text, or prepared recurring reports.",
      }),
      {
        name: "Which foundational test fails?",
        make() {
          const e = U.rotate("ch12-tests", TEST_BANK);
          return Q.mc({
            q: `<p>An architecture review finds this in a proposal:</p><blockquote>${e.s}</blockquote><p>Which of the four foundational tests does it fail?</p>`,
            right: TESTS[e.k], rightWhy: TEST_WHY[e.k],
            wrong: TESTS.filter((_, i) => i !== e.k).map((t, j) => {
              const i = TESTS.indexOf(t);
              return { t, why: `That test is about something else (${["whether originals still exist", "whether rows keep their grain and links", "whether derived values can be traced", "whether a source is asked to prove more than it can"][i]}). ${TEST_WHY[e.k]}` };
            }),
            keepOrder: TESTS,
            sol: S("Recall the four tests: originals available, grain and relationships intact, derived fields traceable, sources used only for what they can prove.",
              `Ask what has actually been lost or overstated. Here: ${TEST_WHY[e.k]}`,
              `So it fails <b>${TESTS[e.k]}</b>.`),
          });
        },
      },
      {
        name: "Does the derived table hold up?",
        make() {
          const e = U.rotate("ch12-derived", DERIVED_BANK);
          return Q.mc({
            q: `<p>${e.s}</p><p>Does this derived table hold up?</p>`,
            right: DERIVED_OPTS[e.k], rightWhy: e.why,
            wrong: DERIVED_OPTS.map((o, i) => ({ t: o, i })).filter(o => o.i !== e.k).map(o => ({ t: o.t, why: DERIVED_WRONG[o.i] + " " + e.why })),
            keepOrder: DERIVED_OPTS,
            sol: S("A derived table holds up only if (1) the originals still exist, (2) the transformation is traceable, and (3) the result still means what the source meant.",
              "Check the three conditions in order and stop at the first one that is missing.",
              `<b>${DERIVED_OPTS[e.k]}</b>. ${e.why}`),
          });
        },
      },
      {
        name: "Routing or architecture?",
        make() {
          const items = U.shuffle([...U.deal("ch12-route0", ROUTE_BANK.filter(b => b.cat === ROUTE_CATS[0]), 2), ...U.deal("ch12-route1", ROUTE_BANK.filter(b => b.cat === ROUTE_CATS[1]), U.randInt(2, 3))]);
          return Q.classify({
            q: "<p>A team is planning VVMG's data. Is each question a <b>routing</b> question (Chapter 11) or an <b>architecture</b> question (Chapter 12)?</p>",
            cats: ROUTE_CATS, items,
            sol: S("Routing places one source in a storage home. Architecture decides how sources stay available, connected and trustworthy when used together.",
              "Look for words about connection, traceability, availability or access across sources: those signal architecture."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 2 · Source meaning, business rules, source limits
   * ============================================================ */
  const MEAN_CATS = ["Completed sale", "Interest / app activity", "Promotion used", "Qualitative observation"];
  const MEAN_DEFS = {
    "Completed sale": "a finished transaction; the only basis for units sold and revenue",
    "Interest / app activity": "browsing, saving, carting or checking in; shows interest, not a purchase",
    "Promotion used": "a promotion redeemed in connection with an order",
    "Qualitative observation": "what one customer said or what an employee saw; context, not a transaction",
  };
  const MEAN_BANK = [
    { t: "An OrderItems line: 2 × P-318 game-day tee at $24 in completed order O-5003.", cat: MEAN_CATS[0], why: "An order line in a completed order is direct evidence of a sale." },
    { t: "An order record for a completed $86 purchase at the campus pop-up.", cat: MEAN_CATS[0], why: "A completed order is a finished transaction." },
    { t: "A finished checkout at the mobile truck for three beanies.", cat: MEAN_CATS[0], why: "A completed checkout is a sale." },
    { t: "Units of the water bottle summed from completed order lines.", cat: MEAN_CATS[0], why: "Units from completed order lines measure completed purchases." },
    { t: "At Lakeside Bikes, a repair invoice the customer has paid.", cat: MEAN_CATS[0], why: "A paid invoice is a completed transaction." },
    { t: "A completed in-app order for a lanyard that was paid and picked up.", cat: MEAN_CATS[0], why: "Paid and shipped means the transaction is complete." },
    { t: "A <code>product_viewed</code> event for the hoodie page.", cat: MEAN_CATS[1], why: "Opening a page shows interest, not a purchase." },
    { t: "A <code>coupon_saved</code> event for a 20%-off offer.", cat: MEAN_CATS[1], why: "Saving a coupon shows interest in an offer; it is not a redemption." },
    { t: "A <code>cart_started</code> event with an estimated cart total of $64.", cat: MEAN_CATS[1], why: "A cart start is an early step; the total stays provisional until an order completes." },
    { t: "A <code>location_check</code> event at the truck's game-day stop, made in the app.", cat: MEAN_CATS[1], why: "A location check is app behavior; it can be done without visiting." },
    { t: "An in-app search for \"crimson hoodie\".", cat: MEAN_CATS[1], why: "Searching shows interest only." },
    { t: "A shopper adds a beanie to an in-app wishlist.", cat: MEAN_CATS[1], why: "A wishlist entry is interest, not a purchase." },
    { t: "A <code>coupon_redeemed</code> event that carries an order_id.", cat: MEAN_CATS[2], why: "A redemption is a promotion used in connection with an order." },
    { t: "A 15%-off code applied at checkout on a completed order.", cat: MEAN_CATS[2], why: "The code was used on an order, so the promotion was used." },
    { t: "A redemption record linking PromotionID PR-12 to OrderID O-5002.", cat: MEAN_CATS[2], why: "A redemption tied to an order records promotion use." },
    { t: "A student discount used on a purchase at the pop-up.", cat: MEAN_CATS[2], why: "The discount was redeemed in connection with an order." },
    { t: "Lakeside Bikes' spring tune-up coupon used on a paid invoice.", cat: MEAN_CATS[2], why: "A coupon applied to a completed transaction is a redemption." },
    { t: "A customer comment: \"The tee shrank after one wash.\"", cat: MEAN_CATS[3], why: "It records what one customer said." },
    { t: "A pop-up note: \"Long line at 2 pm; ran out of bags.\"", cat: MEAN_CATS[3], why: "It is an employee's observation at one event." },
    { t: "A comment where one shopper explains she bought the hoodie as a gift.", cat: MEAN_CATS[3], why: "It is one customer's stated reason, not a transaction record." },
    { t: "An employee's note that students kept asking about the sold-out hoodie sizes.", cat: MEAN_CATS[3], why: "It is a location-specific observation, not a count of demand." },
    { t: "A comment saying the app's coupon was hard to find.", cat: MEAN_CATS[3], why: "It is one customer's experience in their own words." },
  ];
  const LIMITS = [
    { src: "sales / order records", can: ["how many units of a product were sold in completed orders", "the revenue from completed orders at a location", "the price paid on each order line"],
      cannot: [["how many shoppers wanted a product that was out of stock", "Sales only record purchases that happened; unmet demand leaves no order."], ["whether the product was on the shelf all month", "Availability is not recorded by a sale."], ["why customers decided not to buy", "Intent is not in a transaction record."]] },
    { src: "the product catalog", can: ["a product's listed price", "whether a product is approved, pending, inactive or retired", "a product's description and category"],
      cannot: [["whether customers wanted the product", "A catalog lists products; it records no customer behavior."], ["how many units were purchased last month", "Purchases are in order records, not the catalog."], ["which promotion drove sales", "The catalog has no link to orders or redemptions."]] },
    { src: "app activity (views, saves, carts, checks)", can: ["how many times a product page was opened", "how many coupons were saved for a promotion", "how many carts were started in the app"],
      cannot: [["that a viewed product was purchased", "App activity is not a purchase unless it is connected to an order."], ["revenue, using estimated cart totals", "Cart totals are provisional until an order completes."], ["that a customer visited the truck because a location check was logged", "A location check can be made from anywhere."]] },
    { src: "customer comments", can: ["what one customer said, in their own words", "the sentiment and stated reason in a particular comment"],
      cannot: [["how many customers share the commenter's view", "One comment is not a measure of how representative it is."], ["total demand for a product", "Comments are not counts of demand."], ["revenue from the product mentioned", "Comments are not transaction records."]] },
    { src: "pop-up notes", can: ["what an employee observed at one pop-up event", "an operational problem at one location on one day"],
      cannot: [["demand across all customers", "A note covers one event and location."], ["demand at other locations", "A note is location-specific."], ["the revenue earned at the event", "Revenue comes from completed orders, not notes."]] },
  ];
  const RULE_BANK = [
    { t: "A pending product appears in the report's \"available to sell\" list.", ok: true, why: "Pending, inactive or retired products must not be treated as sellable." },
    { t: "Estimated cart totals are added to monthly revenue.", ok: true, why: "An estimated cart total is not revenue." },
    { t: "Coupon saves are reported as promotion redemptions.", ok: true, why: "A saved coupon is not a redemption." },
    { t: "Product views are counted as units purchased.", ok: true, why: "A product view is separate from a purchase." },
    { t: "A customer comment is logged in the Orders table as a transaction.", ok: true, why: "Comments are not transaction records." },
    { t: "Redemptions with no linked order are counted as promotional sales.", ok: true, why: "A redemption should connect to an order before it counts toward sales." },
    { t: "A retired product is included in next month's restock recommendations.", ok: true, why: "A retired product is not sellable." },
    { t: "Revenue is calculated from completed order line amounts.", ok: false, why: "That is exactly the rule: revenue comes from completed orders and order items." },
    { t: "Coupon saves and redemptions appear as separate columns.", ok: false, why: "Keeping them separate respects the rule that a save is not a redemption." },
    { t: "Retired products are excluded from the sellable-product view.", ok: false, why: "That follows the rule about product status." },
    { t: "Each redemption carries the order_id of the order it was used on.", ok: false, why: "That connects redemptions to orders, as the rule requires." },
    { t: "Product views are shown next to units sold but are not added to them.", ok: false, why: "Showing them side by side keeps the measures distinct." },
    { t: "Comments are stored with their original text, author and date.", ok: false, why: "That keeps comments as what they are: context, not transactions." },
  ];

  const genMeaning = STUDY.makeGenerator({
    id: "k201-ch12-meaning",
    name: "Source meaning, rules & limits",
    blurb: "Classify what each record means, apply VVMG's business rules, and say what each source can and cannot establish.",
    variants: [
      ...K.sortVariants({
        key: "ch12-mean", bank: MEAN_BANK, cats: MEAN_CATS, defs: MEAN_DEFS, ask: "record",
        hint: "Ask what actually happened: was something bought, browsed, used as a promotion on an order, or just said or seen?",
      }),
      {
        name: "What can this source establish?",
        make() {
          const src = U.pick(LIMITS);
          const right = U.pick(src.can);
          const wrong = U.sample(src.cannot, 3);
          return Q.mc({
            q: `<p>Using <b>${src.src}</b> alone, which conclusion can an analyst support?</p>`,
            right, rightWhy: `A single record of ${src.src} captures this directly.`,
            wrong: wrong.map(w => ({ t: w[0], why: w[1] })),
            sol: S("Every source has limits. Ask what a single record of this source literally captures.",
              `${src.src[0].toUpperCase() + src.src.slice(1)} can establish: ${src.can.join("; ")}.`,
              `They cannot establish, on their own: ${src.cannot.map(c => c[0]).join("; ")}.`),
          });
        },
      },
      {
        name: "Spot the overreach",
        make() {
          const src = U.pick(LIMITS);
          const w = U.pick(src.cannot);
          const rights = U.sample(src.can, Math.min(3, src.can.length));
          const others = U.sample(LIMITS.filter(l => l !== src).flatMap(l => l.can.map(c => ({ c, s: l.src }))), 3 - rights.length);
          return Q.mc({
            q: `<p>Three of these claims could be supported by the source named in brackets. Which claim asks the source to prove something it <b>cannot</b>?</p>`,
            right: `${w[0]} [${src.src}]`, rightWhy: w[1],
            wrong: rights.map(r => ({ t: `${r} [${src.src}]`, why: `This is within what ${src.src} capture directly.` }))
              .concat(others.map(o => ({ t: `${o.c} [${o.s}]`, why: `This is within what ${o.s} capture directly.` }))),
            sol: S("For each claim, ask: does one record of the named source actually capture this, or would you need another source?",
              `The overreach: ${w[0]}. ${w[1]}`),
          });
        },
      },
      {
        name: "What counts as revenue?",
        make() {
          const a = U.randInt(30, 90) * 20, b = U.randInt(10, 40) * 20;
          const c = U.randInt(20, 80) * 20, d = U.randInt(5, 30) * 10, e = U.randInt(10, 40) * 10;
          const loc = U.pick([["mobile truck", "campus pop-up"], ["in-app orders", "mobile truck"], ["campus pop-up", "in-app orders"]]);
          const rows = U.shuffle([
            [`Completed order line amounts, ${loc[0]}`, $(a)],
            [`Completed order line amounts, ${loc[1]}`, $(b)],
            ["Estimated totals of carts that never reached checkout", $(c)],
            ["Face value of coupons saved but not redeemed", $(d)],
            ["List price × requested quantity for a product still pending approval", $(e)],
          ]);
          return numQ({
            q: `<p>VVMG's monthly planning sheet lists these figures:</p>${tbl(["Figure", "Amount"], rows)}<p>Applying VVMG's business rules, what is this month's <b>revenue</b>?</p>`,
            answer: a + b, unit: "$",
            traps: [
              { value: a + b + c + d + e, why: "You added every figure. Cart totals, saved coupons and pending-product requests are not completed sales." },
              { value: a + b + c, why: "Estimated cart totals are provisional; they become revenue only if an order completes." },
              { value: a, why: "Both lines of completed orders count, whichever channel they came from." },
              { value: a + b + e, why: "A pending product is not sellable, so requests for it are not revenue." },
            ],
            sol: S("Revenue comes only from completed orders and order items. Find the rows that describe completed sales.",
              `Completed: ${$(a)} + ${$(b)}. Not revenue: estimated cart totals (provisional), saved coupons (interest), pending-product requests (not sellable).`,
              `Revenue = <b>${$(a + b)}</b>.`),
          });
        },
      },
      {
        name: "Business-rule violations (select all)",
        make() {
          const k = U.randInt(1, 4);
          const opts = [...U.deal("ch12-rule-v", RULE_BANK.filter(r => r.ok), k), ...U.deal("ch12-rule-ok", RULE_BANK.filter(r => !r.ok), 5 - k)];
          return Q.multi({
            q: "<p>A draft planning report does the following. Select <b>every</b> item that violates one of VVMG's business rules.</p>",
            options: opts,
            sol: S("Recall the rules: only approved products are sellable; revenue comes from completed orders; cart totals, saves and views are not sales; redemptions connect to orders; comments are not transactions.",
              "Tick only the items that break a rule. Keeping measures separate, or linking a redemption to its order, follows the rules."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 3 · Grain and grain collapse
   * ============================================================ */
  const GRAIN_TYPES = [
    { g: "One product line within one order", head: ["OrderItemID", "OrderID", "ProductID", "Quantity", "LineAmount"], rows: [["OI-731", "O-5001", "P-318", "1", "$24"], ["OI-732", "O-5001", "P-205", "2", "$24"], ["OI-733", "O-5002", "P-110", "1", "$48"]], key: "OrderItemID" },
    { g: "One completed order", head: ["OrderID", "CustomerID", "OrderDate", "LocationID"], rows: [["O-5001", "C-102", "Mar 3", "L-1"], ["O-5002", "C-104", "Mar 3", "L-2"], ["O-5003", "C-102", "Mar 5", "L-1"]], key: "OrderID" },
    { g: "One action within an app session", head: ["event_id", "session_id", "event_type", "product_id"], rows: [["E-220", "S-41", "product_viewed", "P-318"], ["E-221", "S-41", "coupon_saved", ""], ["E-222", "S-42", "cart_started", "P-110"]], key: "event_id" },
    { g: "One app session", head: ["session_id", "customer_id", "start_time", "device"], rows: [["S-41", "C-102", "09:14", "iOS"], ["S-42", "", "11:02", "Android"], ["S-43", "C-105", "13:40", "iOS"]], key: "session_id" },
    { g: "One customer comment", head: ["comment_id", "customer_id", "submitted", "comment_text"], rows: [["CM-9", "C-101", "Mar 2", "Love the hoodie"], ["CM-10", "C-104", "Mar 4", "Tee ran small"], ["CM-11", "C-101", "Mar 9", "Fast checkout"]], key: "comment_id" },
    { g: "One customer", head: ["CustomerID", "Name", "Email", "JoinDate"], rows: [["C-101", "R. Diaz", "rd@example.com", "Jan 2025"], ["C-102", "K. Patel", "kp@example.com", "Aug 2025"], ["C-104", "M. Osei", "mo@example.com", "Feb 2026"]], key: "CustomerID" },
    { g: "One product", head: ["ProductID", "Name", "Price", "ApprovalStatus"], rows: [["P-110", "Crimson Campus Hoodie", "$48", "Approved"], ["P-318", "Game-day tee", "$24", "Approved"], ["P-730", "Rain jacket", "$65", "Pending"]], key: "ProductID" },
    { g: "One employee note from a pop-up event", head: ["note_id", "LocationID", "event_date", "note_text"], rows: [["N-3", "L-4", "Mar 6", "Line by 2 pm"], ["N-4", "L-4", "Mar 6", "Out of bags"], ["N-5", "L-5", "Mar 13", "Asked for controllers"]], key: "note_id" },
  ];
  const FIELD_CATS = ["Customer", "Order", "Order item", "App session", "App event"];
  const FIELD_BANK = [
    { t: "Email address", cat: "Customer", why: "It describes the customer, whatever they buy or do." },
    { t: "Date the customer joined the loyalty program", cat: "Customer", why: "One value per customer." },
    { t: "Customer's preferred pop-up location", cat: "Customer", why: "A property of the customer, not of any one purchase." },
    { t: "Customer's name", cat: "Customer", why: "Identifies the person, so it sits at customer grain." },
    { t: "OrderDate", cat: "Order", why: "The whole order happens on one date." },
    { t: "LocationID where the order was completed", cat: "Order", why: "An order is completed at one location." },
    { t: "Payment method used at checkout", cat: "Order", why: "One payment per completed order." },
    { t: "CustomerID who placed the order", cat: "Order", why: "Each order belongs to one customer." },
    { t: "Quantity of one product purchased", cat: "Order item", why: "Quantity differs per product line." },
    { t: "LineAmount for one product", cat: "Order item", why: "Each product line has its own amount." },
    { t: "ProductID on a purchase line", cat: "Order item", why: "An order can include many products, one per line." },
    { t: "Unit price charged on that line", cat: "Order item", why: "The price is recorded per product line." },
    { t: "Device type used to open the app", cat: "App session", why: "A session happens on one device." },
    { t: "Session start time", cat: "App session", why: "Each session has one start time." },
    { t: "Whether the session was a guest (no customer link)", cat: "App session", why: "Guest status is a property of the session." },
    { t: "Session end time", cat: "App session", why: "One per session." },
    { t: "event_type such as product_viewed", cat: "App event", why: "Each action in a session has its own type." },
    { t: "product_id of the page that was opened", cat: "App event", why: "Each view event names one product." },
    { t: "promotion_id on a coupon_saved event", cat: "App event", why: "It belongs to the individual save action." },
    { t: "Timestamp of a single tap in the app", cat: "App event", why: "Every event has its own time." },
  ];
  const GRAIN_CONCEPTS = [
    { q: "A Planning table has one row per customer and a single column for <code>event_id</code>. A customer generated nine app events last month. What happens?",
      right: "One event fits; the other eight have nowhere to go and drop out (or the customer row must be repeated).",
      rightWhy: "One column holds one value, so repeated activity is lost or forces duplication.",
      wrong: [{ t: "All nine events are stored, comma-separated, with no loss of meaning.", why: "Cramming many values into one cell breaks the grain and makes the events unqueryable as records." },
        { t: "Nothing; the event_id column automatically links to all nine events.", why: "A single value cannot point to nine records; that needs a separate events table with a foreign key back." },
        { t: "The customer's revenue doubles.", why: "Revenue duplication happens when customer rows are repeated per event, not when events are dropped." }],
      sol: ["Ask how many values one cell can hold.", "One slot per customer means one event per customer; a customer → events relationship is one-to-many and needs its own table."] },
    { q: "Orders and OrderItems are merged into one Sales table with no OrderItemID. What is the most likely reporting error?",
      right: "Order-level values repeat on each line, so order counts and revenue are overstated, and line detail is hard to identify.",
      rightWhy: "Without the line-level identifier and stated grain, order-level facts duplicate across lines.",
      wrong: [{ t: "Revenue is understated because order items are discarded.", why: "The lines are kept; the problem is that order-level values repeat across them." },
        { t: "There is no error; one table is always easier to report from.", why: "Easier to read is not the same as correct; mixed grains duplicate values." },
        { t: "Customers are double-counted because CustomerID is lost.", why: "CustomerID is still on each row; the issue is the order/line grain." }],
      sol: ["Name the grain of each source table: one order vs one product line.", "When order-level facts sit on line-level rows they repeat; summing or counting them overstates totals."] },
    { q: "Which question tells you the grain of a table?",
      right: "What does one row represent?",
      rightWhy: "Grain is defined as what one row or record stands for.",
      wrong: [{ t: "How many columns does the table have?", why: "Column count says nothing about what a row represents." },
        { t: "Which storage component holds it?", why: "That is a routing question, not a grain question." },
        { t: "Who is allowed to read it?", why: "That is an access-control question." }],
      sol: ["Grain is about rows, not columns or storage.", "Ask: one row = one what?"] },
    { q: "A customer bought at the truck but never used the app. The Planning table is built as \"one row per customer per app event\". What happens to that customer's revenue?",
      right: "It disappears from the table, because the customer has no event to create a row.",
      rightWhy: "When rows are generated by events, customers without events produce no rows.",
      wrong: [{ t: "It is counted once, as normal.", why: "Rows exist only where there is an event; this customer has none." },
        { t: "It is duplicated many times.", why: "Duplication hits customers with many events, not customers with none." },
        { t: "It is stored as a guest session.", why: "Truck purchases are not app sessions; nothing creates a session here." }],
      sol: ["Ask what creates a row in this table.", "No event means no row, so the customer's revenue silently drops out: totals no longer match Orders."] },
    { q: "Why can a summary at customer grain be fine while a Planning table at customer grain is a problem?",
      right: "A documented summary sits on top of the source tables, which keep their own grain; the Planning table replaces them and mixes grains.",
      rightWhy: "Summaries are welcome when the originals stay and the grain is stated.",
      wrong: [{ t: "Customer grain is never acceptable in any table.", why: "A Customers table and documented customer-level summaries are legitimate." },
        { t: "Because summaries are stored in JSON and Planning tables are relational.", why: "Storage type is not the issue; replacing sources and mixing grains is." },
        { t: "There is no difference; both are equally risky.", why: "The difference is whether the originals and the stated grain survive." }],
      sol: ["Recall when a derived table holds up.", "Grain is fine to change on purpose in a documented derived table, as long as the source tables keep theirs."] },
  ];

  const genGrain = STUDY.makeGenerator({
    id: "k201-ch12-grain",
    name: "Grain & grain collapse",
    blurb: "Name the grain of a table and compute how flattening orders, order items and events duplicates or loses revenue and counts.",
    variants: [
      {
        name: "Sum a repeated order-level value",
        make() {
          const d = orderData();
          const inflated = sum(d.lines.map(l => l.total));
          const rev = sum(d.lines.map(l => l.amt));
          return numQ({
            q: `<p>A draft architecture flattens VVMG's Orders and OrderItems into one Sales table. Each row is a product line, but it also carries the order's <code>OrderTotal</code>:</p>${flatTable(d, false)}<p>A dashboard reports revenue as the <b>sum of the OrderTotal column</b>. What figure does it report?</p>`,
            answer: inflated, unit: "$",
            traps: [{ value: rev, why: "That is the true revenue (sum of LineAmount). The dashboard sums OrderTotal, which repeats once per line." }],
            sol: S("OrderTotal belongs to the order grain but sits on every line, so it repeats once per product line.",
              `Add OrderTotal row by row: ${d.lines.map(l => $(l.total)).join(" + ")} = ${$(inflated)}.`,
              `The dashboard reports <b>${$(inflated)}</b>, though actual revenue is only ${$(rev)}. That gap is grain collapse.`),
          });
        },
      },
      {
        name: "Recover the true revenue",
        make() {
          const d = orderData();
          const inflated = sum(d.lines.map(l => l.total));
          const rev = sum(d.lines.map(l => l.amt));
          return numQ({
            q: `<p>This flattened Sales table mixes order-level and line-level values:</p>${flatTable(d, true)}<p>What is VVMG's actual <b>revenue</b> from these orders?</p>`,
            answer: rev, unit: "$",
            traps: [{ value: inflated, why: "You summed OrderTotal, which repeats on every line of the same order." }],
            sol: S("Revenue comes from order items. Use a column that appears exactly once per product line.",
              `Sum LineAmount: ${d.lines.map(l => $(l.amt)).join(" + ")} = ${$(rev)}. (Or take each order's total once: ${d.orders.map(o => $(o.total)).join(" + ")}.)`,
              `Revenue = <b>${$(rev)}</b>.`),
          });
        },
      },
      {
        name: "Count the real orders",
        make() {
          const d = orderData();
          return numQ({
            q: `<p>A report labels each row of this table as \"an order\":</p>${flatTable(d, false)}<p>How many orders were actually placed?</p>`,
            answer: d.orders.length, kind: "count", unit: "orders",
            traps: [{ value: d.lines.length, why: "That is the number of rows, i.e. product lines. Several lines can belong to one order." },
              { value: d.custs.length, why: "That is the number of distinct customers; a customer can place more than one order." }],
            sol: S("What does one row represent here? Check whether an OrderID appears more than once.",
              `Distinct OrderIDs: ${d.orders.map(o => o.oid).join(", ")}.`,
              `<b>${d.orders.length}</b> orders across ${d.lines.length} product lines.`),
          });
        },
      },
      {
        name: "Average order value on the wrong grain",
        make() {
          let d, aovRows, aov;
          for (let g = 0; g < 40; g++) {
            d = orderData();
            aovRows = sum(d.lines.map(l => l.total)) / d.lines.length;
            aov = sum(d.orders.map(o => o.total)) / d.orders.length;
            if (Math.abs(aovRows - aov) > Math.max(0.5, aov * 0.02)) break;
          }
          return numQ({
            q: `<p>Using this flattened table:</p>${flatTable(d, false)}<p>What is the true <b>average order value</b> (revenue ÷ number of orders)? Round to the cent.</p>`,
            answer: U.round(aov, 2), unit: "$",
            traps: [{ value: U.round(aovRows, 2), why: "You averaged OrderTotal over rows. Orders with many lines get counted several times, which skews the average." }],
            sol: S("Average order value needs one value per order. First identify the distinct orders.",
              `Order totals once each: ${d.orders.map(o => `${o.oid} ${$(o.total)}`).join(", ")}; sum ${$(sum(d.orders.map(o => o.total)))} over ${d.orders.length} orders.`,
              `Average = <b>${$(U.round(aov, 2), 2)}</b>. Averaging over rows would give ${$(U.round(aovRows, 2), 2)}.`),
          });
        },
      },
      {
        name: "Events lost in a one-slot customer row",
        make() {
          const a = activityData();
          const lost = a.events.length - a.kept;
          return numQ({
            q: `<p>VVMG's app events for last week:</p>${tbl(["customer_id", "session_id", "event_id", "event_type"], a.events.map(e => [e.cust, e.sess, e.eid, e.type]))}<p>A proposed Planning table has <b>one row per customer</b> with a single <code>session_id</code> column and a single <code>event_id</code> column. How many of these event records cannot be represented?</p>`,
            answer: lost, kind: "count", unit: "events",
            traps: [{ value: a.events.length, why: "Each customer with activity can still keep one event; only the extra ones are lost." },
              { value: a.kept, why: "That is how many events survive (one per customer with activity), not how many are lost." }],
            sol: S("One slot per customer means each customer keeps at most one event.",
              `Events per customer: ${a.custs.map((c, i) => `${c}: ${a.counts[i]}`).join(", ")}. Customers with at least one event: ${a.kept}.`,
              `Lost = ${a.events.length} − ${a.kept} = <b>${lost}</b>. The fix is Customer → Sessions → Events as one-to-many records.`),
          });
        },
      },
      {
        name: "Revenue repeated per event",
        make() {
          const a = activityData();
          return numQ({
            q: `<p>Completed-order revenue by customer:</p>${tbl(["CustomerID", "Revenue"], a.custs.map((c, i) => [c, $(a.rev[i])]))}<p>App events per customer last month: ${a.custs.map((c, i) => `${c}: ${a.counts[i]}`).join(", ")}.</p><p>A draft joins the two so that each row is <b>one customer + one app event</b>, with the customer's revenue copied onto every row (customers with no events get no row). What does summing the revenue column report?</p>`,
            answer: a.repeated, unit: "$",
            traps: [{ value: a.trueRev, why: "That is the true revenue. The joined table repeats revenue once per event and drops customers without events." },
              { value: a.revWithEv, why: "You dropped the customer with no events but forgot that revenue repeats on every event row." }],
            sol: S("A row exists only for each customer-event pair, and the customer-level revenue is copied onto each one.",
              `Revenue × events: ${a.custs.map((c, i) => `${$(a.rev[i])} × ${a.counts[i]}`).join(" + ")}.`,
              `Reported = <b>${$(a.repeated)}</b> versus true revenue ${$(a.trueRev)}. Values duplicated and one customer dropped out: both symptoms of grain collapse.`),
          });
        },
      },
      {
        name: "Name the grain",
        make() {
          const t = U.rotate("ch12-grain-types", GRAIN_TYPES);
          const wrong = U.sample(GRAIN_TYPES.filter(x => x !== t), 3);
          return Q.mc({
            q: `<p>What is the grain of this table?</p>${tbl(t.head, t.rows)}`,
            right: t.g, rightWhy: `${t.key} is unique on every row, and it identifies ${t.g.toLowerCase()}.`,
            wrong: wrong.map(w => ({ t: w.g, why: `That grain would be identified by ${w.key}. Here the unique identifier is ${t.key}.` })),
            sol: S("Find the column whose value is different on every row; that identifier tells you what one row stands for.",
              `${t.key} is unique per row, so one row = <b>${t.g.toLowerCase()}</b>.`),
          });
        },
      },
      {
        name: "Which grain owns this field?",
        make() {
          const items = U.sample(FIELD_BANK, 5);
          return Q.classify({
            q: "<p>Each field belongs at exactly one grain. Where does each one belong?</p>",
            cats: FIELD_CATS, items,
            sol: S("Ask: does this value change per customer, per order, per product line, per session, or per individual app action?",
              "If a value can differ between two lines of the same order it belongs to the order item; if it is the same for the whole order it belongs to the order."),
          });
        },
      },
      K.conceptVariant("Predict the consequence", "ch12-grain-c", GRAIN_CONCEPTS),
    ],
  });

  /* ============================================================
   * TOPIC 4 · Identifier mappings and relationships
   * ============================================================ */
  const MAP_CATS = ["CustomerID", "ProductID", "PromotionID", "LocationID", "OrderID", "No partner"];
  const MAP_BANK = [
    { t: "app field <code>customer_id</code>", cat: "CustomerID", why: "customer_id maps to CustomerID once verified on sample records." },
    { t: "app field <code>product_id</code>", cat: "ProductID", why: "product_id maps to ProductID once verified." },
    { t: "app field <code>promotion_id</code> on a coupon_saved event", cat: "PromotionID", why: "promotion_id maps to PromotionID." },
    { t: "app field <code>location_id</code> on a location_check event", cat: "LocationID", why: "location_id maps to LocationID." },
    { t: "app field <code>order_id</code> on a coupon_redeemed event", cat: "OrderID", why: "order_id maps to OrderID, but it appears only on redemption events." },
    { t: "app field <code>session_id</code>", cat: "No partner", why: "Sessions exist only in the app; session_id carries the session grain." },
    { t: "app field <code>event_id</code>", cat: "No partner", why: "Events exist only in the app; event_id carries the event grain." },
    { t: "structured field <code>OrderItemID</code>", cat: "No partner", why: "The app has no order-line records; OrderItemID carries the order-line grain." },
  ];
  const RELS = [
    { one: "customer", many: "orders", child: "order", opt: false },
    { one: "order", many: "order items", child: "order item", opt: false },
    { one: "product", many: "order items", child: "order item", opt: false },
    { one: "app session", many: "app events", child: "app event", opt: false },
    { one: "promotion", many: "coupon-redemption events", child: "redemption event", opt: false },
    { one: "promotion", many: "coupon-save events", child: "coupon-save event", opt: false },
    { one: "known customer", many: "app sessions", child: "session", opt: true },
  ];
  const COLLAPSE = [
    { title: "Customers", fields: ["CustomerID (PK)", "Name", "Email", "session_id", "event_id"],
      right: "Each customer can hold only one session and one event; any further activity is lost or forces duplicate customer rows.",
      fix: "Customer → Sessions → Events need their own records." },
    { title: "Orders", fields: ["OrderID (PK)", "CustomerID (FK)", "OrderDate", "ProductID", "Quantity"],
      right: "Each order can record only one product line; multi-product orders lose lines or need duplicate order rows.",
      fix: "Order → OrderItems must be one-to-many with OrderItemID." },
    { title: "AppSessions", fields: ["session_id (PK)", "customer_id", "start_time", "event_id", "event_type"],
      right: "Each session can record only one event; the rest of the session's activity disappears.",
      fix: "Session → Events must be one-to-many." },
    { title: "Promotions", fields: ["PromotionID (PK)", "Name", "Discount", "OrderID"],
      right: "Each promotion can link to only one order, though a promotion is redeemed on many orders.",
      fix: "Promotion → redemptions/orders must be one-to-many." },
    { title: "Products", fields: ["ProductID (PK)", "Name", "Price", "ApprovalStatus", "OrderItemID"],
      right: "Each product can point to only one order line, though a product appears on many order lines.",
      fix: "Product → OrderItems must be one-to-many, with ProductID stored on each order item." },
  ];
  const ID_CONCEPTS = [
    { q: "Why can't VVMG use <code>order_id</code> to connect every app event to sales?",
      right: "order_id appears only on coupon-redemption events; views, saves and carts have none.",
      rightWhy: "It links redemptions to orders, not app activity in general.",
      wrong: [{ t: "Because order_id and OrderID use different capitalization.", why: "Naming style is not the issue; most events simply lack an order_id." },
        { t: "Because order_id is a guest-session identifier.", why: "Guest sessions are identified by session_id, not order_id." },
        { t: "It can; every event records the order that followed it.", why: "Only redemption events carry an order_id." }],
      sol: ["Ask which events actually carry an order_id.", "Only coupon_redeemed events do, so order_id is a redemption-to-order link, not a general bridge."] },
    { q: "The app's <code>customer_id</code> and the database's <code>CustomerID</code> look alike. What should the architect do before joining on them?",
      right: "Verify on sample records that they refer to the same customers, then document the mapping.",
      rightWhy: "Similar names suggest a match; verification and documentation make it trustworthy.",
      wrong: [{ t: "Join immediately; the names make the match obvious.", why: "Similar names are a hint, not proof." },
        { t: "Rename one field so the names are identical.", why: "Renaming changes the label, not whether the values refer to the same people." },
        { t: "Ask the AI whether they match and accept its answer.", why: "The AI can only guess from the names; checking real records is the human's job." }],
      sol: ["Similar names only suggest a mapping.", "Check sample records from both sources, confirm they line up, and record how they were matched."] },
    { q: "Why do OrderItemID, session_id and event_id have no partner, and why keep them anyway?",
      right: "They exist in only one source and carry that source's grain (order line, session, event), which other identifiers cannot preserve.",
      rightWhy: "Dropping them would erase the finest level of detail.",
      wrong: [{ t: "They are duplicates of OrderID and customer_id and can be dropped.", why: "They identify a finer grain than OrderID or customer_id." },
        { t: "They have no partner, so they cannot be stored in the architecture.", why: "Having no cross-source partner is fine; they still identify their own records." },
        { t: "They should be mapped to ProductID to give them a partner.", why: "Forcing a mapping to an unrelated identifier invents a relationship." }],
      sol: ["Ask which records each identifier names.", "Each names a record that exists in only one source; keeping it preserves that source's grain."] },
    { q: "A draft ERD shows a line between Promotions and Orders. What does the line establish by itself?",
      right: "Only that the tables connect; the cardinality still has to be stated and checked.",
      rightWhy: "A line shows a connection, not that the connection is right.",
      wrong: [{ t: "That the relationship is correct and complete.", why: "A line proves nothing about whether the design can hold many related records." },
        { t: "That each promotion has exactly one order.", why: "A plain line does not specify cardinality." },
        { t: "That PromotionID and order_id are the same field.", why: "Connection is not identity; mappings need verification." }],
      sol: ["Separate drawing a connection from checking it.", "State the cardinality (one promotion → many orders) and confirm the structure can hold it."] },
  ];

  const genIds = STUDY.makeGenerator({
    id: "k201-ch12-ids",
    name: "Identifier mappings & relationships",
    blurb: "Map identifiers across sources, count what each link can reach, and preserve the one-to-many relationships.",
    variants: [
      {
        name: "Map each identifier",
        make() {
          const items = U.shuffle([...U.sample(MAP_BANK.filter(m => m.cat !== "No partner"), U.randInt(2, 4)), ...U.sample(MAP_BANK.filter(m => m.cat === "No partner"), U.randInt(1, 2))]).slice(0, 5);
          return Q.classify({
            q: "<p>Match each identifier to its partner in the other source, or mark it as having <b>no partner</b>.</p>",
            cats: MAP_CATS, items,
            sol: S("Pairs: CustomerID ↔ customer_id, ProductID ↔ product_id, PromotionID ↔ promotion_id, LocationID ↔ location_id, OrderID ↔ order_id (redemptions only).",
              "OrderItemID, session_id and event_id exist in only one source; they carry that source's grain."),
          });
        },
      },
      {
        name: "Count events that reach an order",
        make() {
          const types = ["product_viewed", "coupon_saved", "cart_started", "location_check", "coupon_redeemed"];
          let evs;
          for (let g = 0; g < 30; g++) {
            const n = U.randInt(6, 8);
            evs = Array.from({ length: n }, (_, i) => {
              const ty = U.pick(types);
              return { eid: "E-" + (400 + i), cust: U.pick(["C-101", "C-103", "C-104", ""]), type: ty, oid: ty === "coupon_redeemed" ? "O-" + U.randInt(5001, 5040) : "" };
            });
            const r = evs.filter(e => e.type === "coupon_redeemed").length;
            const c = evs.filter(e => e.cust).length;
            if (r >= 1 && r < n && c !== r) break;
          }
          const r = evs.filter(e => e.type === "coupon_redeemed").length;
          const withCust = evs.filter(e => e.cust).length;
          return numQ({
            q: `<p>A sample of app events:</p>${tbl(["event_id", "customer_id", "event_type", "order_id"], evs.map(e => [e.eid, e.cust || "(guest)", e.type, e.oid || "—"]))}<p>How many of these events can be linked <b>directly to a specific order</b> through the order_id ↔ OrderID mapping?</p>`,
            answer: r, kind: "count", unit: "events",
            traps: [{ value: evs.length, why: "Most events carry no order_id; only redemptions link to orders." },
              { value: withCust, why: "A customer_id links an event to a customer, not to a specific order." }],
            sol: S("Which event type carries order_id?",
              `Only coupon_redeemed events do. Count them: ${evs.filter(e => e.type === "coupon_redeemed").map(e => e.eid).join(", ")}.`,
              `<b>${r}</b>. The rest are activity, linked to customers or products, never proof of a sale.`),
          });
        },
      },
      {
        name: "Optional link: guest sessions",
        make() {
          const n = U.randInt(5, 8);
          let ss;
          for (let g = 0; g < 30; g++) {
            ss = Array.from({ length: n }, (_, i) => ({ sid: "S-" + (60 + i), cust: Math.random() < 0.4 ? "" : U.pick(["C-101", "C-102", "C-104", "C-105"]), dev: U.pick(["iOS", "Android", "Web"]) }));
            const gN = ss.filter(s => !s.cust).length;
            if (gN >= 1 && gN < n) break;
          }
          const guests = ss.filter(s => !s.cust).length;
          return numQ({
            q: `<p>App sessions from Saturday:</p>${tbl(["session_id", "customer_id", "device"], ss.map(s => [s.sid, s.cust || "(blank)", s.dev]))}<p>A draft makes <code>customer_id</code> <b>required</b> on every session, so sessions without a customer are rejected on load. How many sessions would be lost?</p>`,
            answer: guests, kind: "count", unit: "sessions",
            traps: [{ value: n - guests, why: "Those are the sessions that would survive (they have a customer)." },
              { value: 0, why: "Guest sessions have no customer link, so a required customer_id rejects them." }].filter(t => t.value !== guests),
            sol: S("Known customer → sessions is one-to-many, but the customer side is optional: guests have no customer.",
              `Blank customer_id: ${ss.filter(s => !s.cust).map(s => s.sid).join(", ")}.`,
              `<b>${guests}</b> sessions would be dropped, so make the link optional.`),
          });
        },
      },
      {
        name: "State the cardinality",
        make() {
          const r = U.rotate("ch12-rels", RELS);
          const right = r.opt
            ? `One ${r.one} can have many ${r.many}; a ${r.child} may have no customer at all (guest).`
            : `One ${r.one} can have many ${r.many}; each ${r.child} belongs to one ${r.one}.`;
          const wrong = [
            { t: `One ${r.child} can have many ${r.one}s; each ${r.one} belongs to one ${r.child}.`, why: "That reverses the direction of the relationship." },
            { t: `One-to-one: each ${r.one} has exactly one ${r.child}.`, why: `A ${r.one} routinely has several ${r.many}; one-to-one would force the rest to be dropped.` },
            r.opt
              ? { t: `One ${r.one} can have many ${r.many}; every ${r.child} must have a customer.`, why: "Guest sessions have no customer, so the link must be optional." }
              : { t: `There is no relationship; the two are separate sources.`, why: `${r.many[0].toUpperCase() + r.many.slice(1)} refer back to a ${r.one}; that link must be preserved.` },
          ];
          return Q.mc({
            q: `<p>Which statement correctly describes the relationship between a <b>${r.one}</b> and <b>${r.many}</b> that VVMG's architecture must preserve?</p>`,
            right, rightWhy: "This is the one-to-many relationship in VVMG's requirements.",
            wrong,
            sol: S(`Ask: can one ${r.one} have more than one ${r.child}? Can one ${r.child} belong to more than one ${r.one}?`,
              `Answer: ${right}`),
          });
        },
      },
      {
        name: "Read the collapsed table",
        make() {
          const c = U.rotate("ch12-collapse", COLLAPSE);
          const others = COLLAPSE.filter(x => x !== c);
          return Q.mc({
            q: `<p>An AI-drafted design includes this table:</p>${entityBox(c.title, c.fields)}<p>What does this structure do to VVMG's data?</p>`,
            right: c.right, rightWhy: c.fix,
            wrong: [
              { t: "Nothing harmful; adding the column links the tables correctly.", why: "A single column holds one value, so a one-to-many relationship is squeezed into one-to-one." },
              { t: "It exposes sensitive text to too many users.", why: "This is a structure problem, not an access problem; no free text is involved." },
              { t: U.pick(others).right, why: "That describes a different table; read the title and columns of this one." },
            ],
            sol: S("Look for a column that refers to a child record which can occur many times.",
              `${c.right}`, `Fix: ${c.fix}`),
          });
        },
      },
      K.conceptVariant("Explain the mapping rule", "ch12-ids-c", ID_CONCEPTS),
      K.tfVariant("True or false: identifiers", "ch12-ids-tf", [
        { s: "OrderItemID has a matching field in the app data.", truth: false, why: "The app has no order-line records; OrderItemID has no partner." },
        { s: "order_id appears only on coupon-redemption events.", truth: true, why: "That is why it links redemptions to orders but not other activity to sales." },
        { s: "If two fields have nearly identical names, they can be joined without checking.", truth: false, why: "Similar names suggest a match; verify on sample records and document." },
        { s: "A guest app session may have no customer link.", truth: true, why: "The customer → session relationship is optional on the session side." },
        { s: "One app session can contain many events.", truth: true, why: "Session → Events is one-to-many." },
        { s: "Putting one event_id column in the Customers table preserves the customer → event relationship.", truth: false, why: "It leaves room for only one event per customer." },
        { s: "One product can appear on many order items.", truth: true, why: "Product → OrderItems is one-to-many." },
        { s: "A line between two tables in a diagram proves the relationship is correct.", truth: false, why: "It shows a connection; cardinality must be stated and checked." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 5 · Provenance and traceability
   * ============================================================ */
  const PT_CATS = ["Provenance", "Traceability", "Neither (looks convincing, proves nothing)"];
  const PT_DEFS = {
    "Provenance": "where the data came from",
    "Traceability": "following a derived value back to its source records and logic",
    "Neither (looks convincing, proves nothing)": "labels, styling, popularity or confidence that say nothing about origin or path",
  };
  const PT_BANK = [
    { t: "The OrderItems extract came from the point-of-sale system on March 2.", cat: PT_CATS[0], why: "It records where and when the data originated." },
    { t: "The comments file was exported from the app's feedback form.", cat: PT_CATS[0], why: "It names the source system." },
    { t: "Pop-up notes were written by the employee staffing the north-side event.", cat: PT_CATS[0], why: "It records who produced the data and where." },
    { t: "The event JSON came from the mobile app's log, version 3.2.", cat: PT_CATS[0], why: "It identifies the originating system and version." },
    { t: "The price list was supplied by VVMG's purchasing team.", cat: PT_CATS[0], why: "It says where the data came from." },
    { t: "Listing exactly which 14 order lines add up to a product's $412 monthly total.", cat: PT_CATS[1], why: "It follows a derived number back to its records." },
    { t: "Following the HighDemand flag back to its formula and the records it used.", cat: PT_CATS[1], why: "It walks from a derived field back to logic and sources." },
    { t: "Re-running the documented query and getting the same summary.", cat: PT_CATS[1], why: "Documented, repeatable logic is what makes a summary traceable." },
    { t: "Linking a location summary row back to the comments and notes it cites.", cat: PT_CATS[1], why: "It connects a summary to its supporting source records." },
    { t: "Tracing a promotion's redemption count to the coupon_redeemed events and their order_ids.", cat: PT_CATS[1], why: "It follows the count back to the exact events." },
    { t: "The field has a confident name: VerifiedDemandScore.", cat: PT_CATS[2], why: "A polished name proves nothing." },
    { t: "The dashboard shows good values in green and bad values in red.", cat: PT_CATS[2], why: "Styling says nothing about origin or logic." },
    { t: "Gemini said the score is reliable.", cat: PT_CATS[2], why: "An AI's assurance is not a documented path to source records." },
    { t: "The number has four decimal places, so it looks precise.", cat: PT_CATS[2], why: "Precision of display is not evidence of correct logic." },
    { t: "Everyone on the team has used the metric for weeks.", cat: PT_CATS[2], why: "Popularity is not provenance or traceability." },
  ];
  const DOC = ["Which sources were used", "Which fields were used", "How identifiers were matched", "The calculation or logic", "When it was created", "Which original records support it"];
  const DOC_FIELDS = [
    { name: "HighDemand", content: ["Orders, OrderItems, app events (JSON)", "OrderItems.Quantity, event_type = product_viewed", "ProductID ↔ product_id, checked on 50 sample records", "Flag = 1 when units sold ≥ 40 in the month", "Built March 31 by the planning analyst", "Order lines and view events for March, listed by ID"] },
    { name: "LocationRevenueSummary", content: ["Orders, OrderItems, Locations", "LineAmount, LocationID, OrderDate", "OrderID joins OrderItems to Orders; LocationID from Orders", "Sum of completed LineAmount by location and month", "Refreshed nightly; last run April 2", "Order IDs included in each location's total"] },
    { name: "PromotionRedemptions", content: ["App events (JSON), Orders", "event_type = coupon_redeemed, promotion_id, order_id", "order_id ↔ OrderID verified on 30 redemptions", "Count of redemptions linked to a completed order, by promotion", "Created April 5", "The redemption event IDs and order IDs counted"] },
    { name: "MonthlyDemandScore", content: ["Orders, OrderItems, app events, comments", "Quantity, product_viewed, coupon_saved, sentiment tag", "ProductID ↔ product_id, sample-checked", "Weighted sum with weights stated and justified in a memo", "Created May 1", "The records feeding each product's score"] },
  ];
  const DOC_WHY = [
    "Without it nobody knows which systems the value depends on.",
    "Without it no one can tell which columns were read, or check that they mean what the field claims.",
    "Without it a mismatched mapping could attach records to the wrong customers or products unnoticed.",
    "Without it the number cannot be reproduced or challenged.",
    "Without it no one knows which period or version of the data the value reflects.",
    "Without it the value cannot be reconciled to the records it claims to summarize.",
  ];
  const TRACE_CONCEPTS = [
    { q: "What is the difference between provenance and traceability?",
      right: "Provenance is where data came from; traceability is being able to follow a derived value back to its source records and logic.",
      rightWhy: "One is the origin; the other is the path from result back to origin.",
      wrong: [{ t: "They are two words for the same idea.", why: "A source can have clear provenance while a summary built on it is untraceable." },
        { t: "Provenance applies to summaries; traceability applies to raw files.", why: "It is the other way round: traceability is about derived values." },
        { t: "Traceability is who may access data; provenance is how long it is kept.", why: "Those are access and retention controls." }],
      sol: ["Think of a finished number and a starting file.", "Provenance names the starting file; traceability is the documented path between them."] },
    { q: "A report adds a field called <code>MonthlyDemandScore</code>. What makes it trustworthy?",
      right: "Documented sources, fields, identifier matching, calculation, creation date and supporting records.",
      rightWhy: "Only documented, traceable logic supports a derived score.",
      wrong: [{ t: "Its clear, professional-sounding name.", why: "A polished name proves nothing." },
        { t: "The fact that an AI tool proposed it.", why: "AI output is a draft; it still needs documented logic." },
        { t: "That it updates automatically every month.", why: "Automation repeats the logic; it does not justify it." }],
      sol: ["Ask what would let a skeptic check the number.", "List the documentation: sources, fields, matching, calculation, date, supporting records."] },
    { q: "A summary says hoodie revenue was $1,240, but the order lines behind it were never recorded and the source was overwritten. What is the main problem?",
      right: "The figure cannot be traced or rechecked, even if it happens to be right.",
      rightWhy: "Traceability and available originals are what make a figure defensible.",
      wrong: [{ t: "The figure must be wrong.", why: "It may be right; the problem is that nobody can show it." },
        { t: "Revenue should come from app events instead.", why: "Revenue correctly comes from order lines; they just were not kept." },
        { t: "The hoodie should be marked as pending.", why: "Approval status is unrelated to traceability." }],
      sol: ["Separate \"is it correct?\" from \"can anyone show it is correct?\".", "Without originals or recorded lines, the number cannot be reconciled."] },
  ];

  const ptSort = K.sortVariants({
    key: "ch12-pt", bank: PT_BANK, cats: PT_CATS, defs: PT_DEFS, ask: "statement",
    hint: "Provenance is about the starting point; traceability is about the path from a finished value back to it. Labels and confidence are neither.",
  });

  const genTrace = STUDY.makeGenerator({
    id: "k201-ch12-trace",
    name: "Provenance & traceability",
    blurb: "Tell provenance from traceability, spot missing documentation, and reconcile a derived figure to its source records.",
    variants: [
      ptSort[0], ptSort[2], ptSort[4],
      {
        name: "What documentation is missing?",
        make() {
          const f = U.pick(DOC_FIELDS);
          const miss = U.randInt(0, DOC.length - 1);
          const shown = DOC.map((d, i) => ({ d, i })).filter(x => x.i !== miss);
          const wrong = U.sample(shown, 3);
          return Q.mc({
            q: `<p>The documentation card for the derived field <code>${f.name}</code> reads:</p><table class="data-tbl"><tbody>${shown.map(x => `<tr><td>${x.d}</td><td>${f.content[x.i]}</td></tr>`).join("")}</tbody></table><p>Which required item is missing?</p>`,
            right: DOC[miss], rightWhy: DOC_WHY[miss],
            wrong: wrong.map(w => ({ t: w.d, why: `The card already records this: "${f.content[w.i]}".` })),
            sol: S("Recall the six things every derived field needs: sources, fields, identifier matching, calculation, creation date, supporting records.",
              "Tick off each row of the card against that list.",
              `Missing: <b>${DOC[miss]}</b>. ${DOC_WHY[miss]}`),
          });
        },
      },
      {
        name: "What must be documented? (select all)",
        make() {
          const bad = [
            { t: "A confident, professional field name", ok: false, why: "A polished name proves nothing." },
            { t: "The color the field will have on the dashboard", ok: false, why: "Presentation is not traceability." },
            { t: "That Gemini suggested the field", ok: false, why: "Who proposed it does not explain the logic." },
            { t: "The analyst's sense that the score feels right", ok: false, why: "Opinion is not documented logic." },
            { t: "How many managers like the report", ok: false, why: "Popularity is not evidence." },
          ];
          const k = U.randInt(1, 4);
          const good = U.sample(DOC, k).map(d => ({ t: d, ok: true, why: "One of the six required documentation items." }));
          return Q.multi({
            q: "<p>VVMG is adding a derived field to its planning report. Select <b>every</b> item that must be documented for it to be traceable.</p>",
            options: good.concat(U.sample(bad, 5 - k)),
            sol: S("Traceability needs a documented path from the value back to source records.",
              `The six items: ${DOC.join("; ")}. Names, colors, popularity and AI assurance are not on the list.`),
          });
        },
      },
      {
        name: "Reconcile a derived figure",
        make() {
          let d, p, lines, ok, bad;
          for (let g = 0; g < 60; g++) {
            d = orderData();
            const counts = {};
            d.lines.forEach(l => counts[l.pid] = (counts[l.pid] || 0) + 1);
            const cands = Object.keys(counts).filter(pid => d.orders.some(o => o.items.some(i => i.pid === pid) && o.items.length > 1));
            if (!cands.length) continue;
            p = U.pick(cands);
            lines = d.lines.filter(l => l.pid === p);
            ok = sum(lines.map(l => l.amt));
            bad = sum(d.orders.filter(o => o.items.some(i => i.pid === p)).map(o => o.total));
            if (Math.abs(bad - ok) > 1) break;
          }
          const name = PRODUCTS.find(x => x[0] === p)[1].toLowerCase();
          return numQ({
            q: `<p>A derived <code>ProductRevenue</code> table reports <b>${$(bad)}</b> for ${p} (${name}). As a validation step you reconcile it to the source lines:</p>${tbl(["OrderID", "OrderItemID", "ProductID", "Qty", "LineAmount"], d.lines.map(l => [l.oid, l.iid, l.pid, l.qty, $(l.amt)]))}<p>What revenue for ${p} do the source order lines actually support?</p>`,
            answer: ok, unit: "$",
            traps: [{ value: bad, why: "That is the derived table's figure. It summed whole order totals for any order containing the product, mixing grains." },
              { value: sum(d.lines.map(l => l.amt)), why: "That is revenue for every product, not just this one." }],
            sol: S("Reconciling means recomputing the figure from the original records at the right grain.",
              `Lines for ${p}: ${lines.map(l => `${l.iid} ${$(l.amt)}`).join(", ")}.`,
              `Supported revenue = <b>${$(ok)}</b>, so the derived ${$(bad)} does not reconcile. It counted whole orders that merely included the product.`),
          });
        },
      },
      K.conceptVariant("Explain traceability", "ch12-trace-c", TRACE_CONCEPTS),
    ],
  });

  /* ============================================================
   * TOPIC 6 · CORE prompts and GenAI as a thinking partner
   * ============================================================ */
  const CORE = ["Context", "Objective", "Role", "Expectations"];
  const CORE_DEFS = {
    Context: "the business situation and the verified sources",
    Objective: "what the architecture must support",
    Role: "the perspective the AI should take",
    Expectations: "requirements, limits, assumptions to list, validation checks",
  };
  const CORE_BANK = [
    { t: "VVMG sells student apparel and event merch from a mobile truck, at pop-up shops and through an app.", cat: "Context", why: "It describes the business situation." },
    { t: "Our verified sources are Customers, Products, Locations, Promotions, Orders, OrderItems, app sessions and events, comments and pop-up notes.", cat: "Context", why: "It lists the verified sources." },
    { t: "Orders record completed transactions; OrderItems record one product line per order.", cat: "Context", why: "It explains what the sources contain." },
    { t: "App events include product views, coupon saves, cart starts, location checks and redemptions.", cat: "Context", why: "It describes a source the AI must work with." },
    { t: "Lakeside Bikes runs two repair shops and keeps invoices, invoice lines and feedback forms.", cat: "Context", why: "It sets out the business and its sources." },
    { t: "Several products are still pending approval.", cat: "Context", why: "It is a fact about the current business situation." },
    { t: "Propose an architecture that supports next month's inventory and promotion planning.", cat: "Objective", why: "It states what the architecture is for." },
    { t: "The design should support a monthly planning report.", cat: "Objective", why: "It names the outcome the design must support." },
    { t: "We need to compare promotion use and completed sales by location.", cat: "Objective", why: "It states the analytical goal." },
    { t: "Design a structure that shows which repair types drive Lakeside Bikes' revenue each month.", cat: "Objective", why: "It states what the design must deliver." },
    { t: "The goal is a recurring review of which products to restock.", cat: "Objective", why: "It names the purpose." },
    { t: "Act as a cautious business systems analyst.", cat: "Role", why: "It sets the perspective." },
    { t: "Respond as a data architect who flags every assumption.", cat: "Role", why: "It tells the AI whose viewpoint to adopt." },
    { t: "Take the perspective of a reviewer who must defend each choice to a manager.", cat: "Role", why: "It defines the stance to answer from." },
    { t: "Answer as a skeptical auditor who checks grain first.", cat: "Role", why: "It sets the persona." },
    { t: "Think like a careful analyst who would rather ask than assume.", cat: "Role", why: "It sets the perspective and tone." },
    { t: "State the grain of every table you propose.", cat: "Expectations", why: "It is a requirement the output must meet." },
    { t: "Do not treat estimated cart totals as revenue.", cat: "Expectations", why: "It is a business rule the design must respect." },
    { t: "List every assumption you make in a separate section.", cat: "Expectations", why: "It makes assumptions visible." },
    { t: "Include a validation check for each derived field.", cat: "Expectations", why: "It requires validation." },
    { t: "Keep comments and notes in restricted storage with their original text.", cat: "Expectations", why: "It is an access and preservation requirement." },
    { t: "Show product approval status wherever products are evaluated.", cat: "Expectations", why: "It is a requirement on the output." },
    { t: "Flag any identifier mapping you could not verify.", cat: "Expectations", why: "It sets a limit and a check." },
  ];
  const AIH_CATS = ["Gemini can help draft it", "The human must verify or decide it"];
  const AIH_BANK = [
    { t: "Organize the requirements into a list", cat: AIH_CATS[0], why: "Organizing is a drafting task the AI does well." },
    { t: "Suggest a storage component for each source", cat: AIH_CATS[0], why: "Suggesting components is a draft for review." },
    { t: "Propose identifiers and relationships", cat: AIH_CATS[0], why: "The AI can propose them; a person checks them." },
    { t: "Suggest names for derived fields", cat: AIH_CATS[0], why: "Naming is drafting; the name itself proves nothing." },
    { t: "Point out assumptions it made", cat: AIH_CATS[0], why: "Surfacing assumptions is useful drafting help." },
    { t: "Produce a revised draft after feedback", cat: AIH_CATS[0], why: "Revising is drafting; the revision still needs review." },
    { t: "Confirm every requirement made it into the design", cat: AIH_CATS[1], why: "Checking completeness is the reviewer's job." },
    { t: "Check that each structure fits the source's meaning and grain", cat: AIH_CATS[1], why: "Judging fit needs business knowledge and accountability." },
    { t: "Verify identifiers exist and cardinality is correct", cat: AIH_CATS[1], why: "Verification against real records is the human's job." },
    { t: "Confirm calculations are supported and traceable", cat: AIH_CATS[1], why: "A person must check the logic." },
    { t: "Decide whether to accept, revise or reject", cat: AIH_CATS[1], why: "The approval decision belongs to an accountable person." },
    { t: "Check that a revision did not create a new problem", cat: AIH_CATS[1], why: "Revisions can introduce new flaws; a person checks." },
  ];
  const OMIT = [
    { o: "that estimated cart totals are provisional", r: "The draft may count estimated cart totals as revenue." },
    { o: "product approval status", r: "The draft may list pending or retired products as if they were sellable." },
    { o: "that order_id appears only on redemption events", r: "The draft may use order_id to tie all app activity to sales." },
    { o: "that comments must keep their original text", r: "The draft may turn comments into fixed categories and drop the wording." },
    { o: "the separate grains of Orders and OrderItems", r: "The draft may merge Orders and OrderItems into one table." },
    { o: "that views, saves and purchases are different evidence", r: "The draft may combine them into one demand measure." },
  ];

  const genCore = STUDY.makeGenerator({
    id: "k201-ch12-core",
    name: "CORE prompts & GenAI collaboration",
    blurb: "Classify prompt sentences as Context, Objective, Role or Expectations, spot what a prompt leaves out, and split AI work from human review.",
    variants: [
      ...K.sortVariants({
        key: "ch12-core", bank: CORE_BANK, cats: CORE, defs: CORE_DEFS, ask: "prompt sentence",
        hint: "Ask what job the sentence does: describe the situation, state the goal, set a perspective, or lay down rules and checks.",
      }),
      {
        name: "Which CORE element is missing?",
        make() {
          const miss = U.pick(CORE);
          const parts = CORE.filter(c => c !== miss).map(c => ({ c, s: U.pick(CORE_BANK.filter(b => b.cat === c && !/Lakeside/.test(b.t))).t }));
          return Q.mc({
            q: `<p>A student sends Gemini this prompt:</p><blockquote>${U.shuffle(parts).map(p => p.s).join(" ")}</blockquote><p>Which CORE element is missing?</p>`,
            right: miss, rightWhy: `Nothing in the prompt gives ${CORE_DEFS[miss]}.`,
            wrong: parts.map(p => ({ t: p.c, why: `The prompt has a ${p.c} sentence: "${p.s}"` })),
            keepOrder: CORE,
            sol: S("Label each sentence: situation and sources (C), goal (O), perspective (R), rules and checks (E).",
              `Present: ${parts.map(p => p.c).join(", ")}. Missing: <b>${miss}</b> (${CORE_DEFS[miss]}).`),
          });
        },
      },
      {
        name: "Predict what an omission causes",
        make() {
          const e = U.pick(OMIT);
          const other = U.pick(OMIT.filter(x => x !== e));
          return Q.mc({
            q: `<p>A CORE prompt for VVMG's architecture never mentions <b>${e.o}</b>. What is the most likely effect on Gemini's draft?</p>`,
            right: e.r, rightWhy: "The AI cannot recover a rule you left out; it fills the gap with a plausible assumption.",
            wrong: [
              { t: "Gemini will stop and ask a clarifying question before drafting.", why: "It usually fills gaps with assumptions rather than asking." },
              { t: "No effect, because Gemini already knows VVMG's business rules.", why: "VVMG's rules come from its own sources; the AI only knows what the prompt tells it." },
              { t: other.r, why: `That would follow from omitting ${other.o}, not from this omission.` },
            ],
            sol: S("A prompt is a requirements brief. Whatever it leaves out, the AI guesses.",
              `Leaving out ${e.o} invites exactly the mistake it was meant to prevent: ${e.r.toLowerCase()}`),
          });
        },
      },
      {
        name: "AI drafts, human decides",
        make() {
          const k = U.randInt(2, 3);
          const items = U.shuffle([...U.deal("ch12-aih0", AIH_BANK.filter(b => b.cat === AIH_CATS[0]), k), ...U.deal("ch12-aih1", AIH_BANK.filter(b => b.cat === AIH_CATS[1]), 5 - k)]);
          return Q.classify({
            q: "<p>Working with Gemini on VVMG's architecture: is each task something the AI can help <b>draft</b>, or something a <b>person must verify or decide</b>?</p>",
            cats: AIH_CATS, items,
            sol: S("The AI is a thinking partner: it organizes, suggests, proposes and revises.",
              "Checking completeness, fit, identifiers, logic and revisions, and making the decision, belong to an accountable person."),
          });
        },
      },
      K.tfVariant("True or false: GenAI drafts", "ch12-core-tf", [
        { s: "A well-written CORE prompt means the AI's proposal can be approved without review.", truth: false, why: "A prompt improves the draft; it does not approve it." },
        { s: "Gemini can give different architecture proposals for the same prompt on different runs.", truth: true, why: "Responses vary between runs, one more reason to review each one." },
        { s: "If a prompt leaves out a business rule, the AI tends to fill the gap with an assumption.", truth: true, why: "It cannot recover what you left out." },
        { s: "The Role element of CORE is where business rules such as \"cart totals are not revenue\" belong.", truth: false, why: "Rules and limits belong in Expectations; Role sets perspective." },
        { s: "Context should include the verified sources the design must use.", truth: true, why: "Context is the business situation and verified sources." },
        { s: "An AI-proposed field name like HighDemand is evidence that the logic is sound.", truth: false, why: "A polished name proves nothing." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 7 · Auditing an AI proposal with the checklist
   * ============================================================ */
  const CHECK = [
    "What does each source represent?",
    "What does one record represent (grain)?",
    "Which identifiers preserve that grain?",
    "How do differently named identifiers map across sources?",
    "Which one-to-many relationships must remain intact?",
    "Which business rules control interpretation?",
    "Where will original sources remain available?",
    "How will derived fields and summaries remain traceable?",
    "Which access and retention controls apply?",
    "What can each source establish, and what can it not prove alone?",
  ];
  const FLAWS = [
    { g: "grain", x: "Build one Planning table with one row per customer holding that customer's orders, product views, saved coupons, comments and pop-up notes.", k: 1, alt: [4, 0],
      c: "Repeated orders and events either vanish or force duplicated rows, so counts and revenue stop matching the source records.",
      f: "Keep each source at its own grain and build any customer-level summary as a documented derived table that links back." },
    { g: "grain", x: "Replace Orders and OrderItems with a single Sales table; OrderItemID is not needed.", k: 2, alt: [1, 4, 6],
      c: "Order-level values repeat on every product line, so order counts and revenue are overstated and line detail is lost.",
      f: "Keep OrderID and OrderItemID and the one-to-many Order → OrderItems link; a derived sales view is fine with its grain stated." },
    { g: "map", x: "Join app activity to sales by matching customer_id to CustomerID and product_id to ProductID automatically, since the names are nearly identical.", k: 3, alt: [2],
      c: "If a pair does not really refer to the same thing, events attach to the wrong customers or products and every count downstream is wrong.",
      f: "Verify each mapping on sample records and document it before joining." },
    { g: "map", x: "Use order_id to connect every app event to the sale it led to.", k: 3, alt: [9, 0, 2],
      c: "Views, saves and cart starts carry no order_id, so they would be dropped or falsely tied to purchases.",
      f: "Use order_id only to link coupon redemptions to their orders; keep other activity linked to customers and products as activity." },
    { g: "grain", x: "Store one session_id and one event_id in each customer record.", k: 4, alt: [1, 2],
      c: "Each customer can hold only one session and one event; the rest of their activity disappears.",
      f: "Keep Customer → Sessions (optional for guests) → Events as one-to-many records." },
    { g: "measure", x: "Create a DemandIndex = units sold + product views + coupon saves.", k: 0, alt: [9, 7, 5],
      c: "Interest and completed purchases are added as if they were the same evidence, so a much-viewed product can look like a best-seller.",
      f: "Report units sold, views and saves as separate fields; any combined measure needs documented, tested logic." },
    { g: "rule", x: "Add estimated cart totals to monthly revenue so the report captures demand.", k: 5, alt: [0, 9],
      c: "Revenue is overstated with money that was never collected.",
      f: "Calculate revenue only from completed orders and order items; show cart totals separately as provisional." },
    { g: "status", x: "List every product in the planning report; approval status is not needed there.", k: 5, alt: [],
      c: "Pending, inactive or retired products can look sellable and get restocked or promoted.",
      f: "Show product approval status wherever products are evaluated for sale." },
    { g: "orig", x: "Load the sources into the reporting layer, then delete the original files to save space.", k: 6, alt: [7],
      c: "No one can recheck a figure or rebuild a summary when a question comes up.",
      f: "Keep the originals available in governed storage behind the reporting layer." },
    { g: "trace", x: "Include a MonthlyDemandScore field; its formula will be worked out later.", k: 7, alt: [0, 9],
      c: "Managers act on a number nobody can explain or trace to source records.",
      f: "Document sources, fields, matching, calculation, date and supporting records, or leave the score out until that exists." },
    { g: "access", x: "Give all truck and pop-up staff read access to the comments and pop-up notes repository.", k: 8, alt: [],
      c: "Sensitive customer text is exposed to people with no need to see it.",
      f: "Restrict comments and notes to approved roles, with defined retention and approved uses." },
    { g: "limit", x: "Rank locations for next month's pop-ups by the number of in-app location checks.", k: 9, alt: [0],
      c: "Location checks can be made from anywhere, so the ranking may not reflect real visits or sales.",
      f: "Treat location checks as app activity; support location decisions with completed orders and notes, each labeled for what it proves." },
    { g: "measure", x: "Report \"customers love the new hoodie\" as demand evidence, based on a handful of comments.", k: 9, alt: [0],
      c: "A few comments are treated as if they represented all customers.",
      f: "Keep comments as qualitative context linked to their source; measure demand with completed sales." },
    { g: "rule", x: "Count coupon saves as redemptions in the promotion results.", k: 5, alt: [0, 9],
      c: "Promotion success is overstated, because interest is reported as use.",
      f: "Report saves and redemptions separately, and count a redemption only when it connects to an order." },
  ];
  const GOOD = [
    "Keep copies of all original source files in a governed raw-data area.",
    "Show product approval status next to every product in the planning report.",
    "Keep Orders and OrderItems as separate tables linked by OrderID.",
    "Store app sessions and their events in document storage, keeping every event.",
    "Store comments and pop-up notes with original text and metadata in a restricted repository.",
    "Report product views, coupon saves and units sold as separate columns.",
    "Link each coupon redemption to its order through order_id.",
    "Document how customer_id was verified against CustomerID on sample records.",
  ];
  const BAD_FIX = [
    { t: "Rename the field or table so its purpose sounds clearer.", why: "A better name changes nothing about the structure or logic." },
    { t: "Regenerate the proposal with Gemini and accept whatever the next version says.", why: "AI output varies between runs, and every version still needs review." },
    { t: "Drop the affected source from the architecture entirely.", why: "Throwing away evidence loses information the business needs; fix how it is stored or used." },
  ];

  const genAudit = STUDY.makeGenerator({
    id: "k201-ch12-audit",
    name: "Auditing an AI proposal",
    blurb: "Use the ten-question checklist to name the violated requirement, the business consequence and the best revision in AI-drafted architectures.",
    variants: [
      {
        name: "Which requirement is violated?",
        make() {
          const fl = U.rotate("ch12-flaw-a", FLAWS);
          const pool = CHECK.map((t, i) => ({ t, i })).filter(o => o.i !== fl.k && !fl.alt.includes(o.i));
          return Q.mc({
            q: `<p>An AI-drafted architecture for VVMG says:</p><blockquote>${fl.x}</blockquote><p>Which checklist question does this excerpt most directly fail?</p>`,
            right: CHECK[fl.k], rightWhy: fl.c,
            wrong: U.sample(pool, 3).map(o => ({ t: o.t, why: "That question is about a different concern; nothing in this excerpt touches it." })),
            sol: S("Ask what the excerpt changes: meaning, grain, identifiers, mappings, relationships, rules, originals, traceability, access, or what a source can prove.",
              `Consequence: ${fl.c}`,
              `So it fails <b>${CHECK[fl.k]}</b>`),
          });
        },
      },
      {
        name: "Name the business consequence",
        make() {
          const fl = U.rotate("ch12-flaw-b", FLAWS);
          const others = U.sample(FLAWS.filter(f => f.g !== fl.g), 3);
          return Q.mc({
            q: `<p>Excerpt from Gemini's proposal:</p><blockquote>${fl.x}</blockquote><p>What is the most direct <b>business consequence</b> if VVMG adopts it as written?</p>`,
            right: fl.c, rightWhy: "This follows directly from the change the excerpt makes.",
            wrong: others.map(o => ({ t: o.c, why: `That would follow from a different flaw ("${o.x}"), not this one.` })),
            sol: S("Trace the change forward: what number, record or decision would come out wrong?",
              `Here: ${fl.c}`),
          });
        },
      },
      {
        name: "Choose the best revision",
        make() {
          const fl = U.rotate("ch12-flaw-c", FLAWS);
          const other = U.pick(FLAWS.filter(f => f.g !== fl.g));
          return Q.mc({
            q: `<p>The audit flagged this excerpt:</p><blockquote>${fl.x}</blockquote><p>Which revision best fixes it?</p>`,
            right: fl.f, rightWhy: `It removes the cause: ${fl.c.charAt(0).toLowerCase() + fl.c.slice(1)}`,
            wrong: U.sample(BAD_FIX, 2).concat([{ t: other.f, why: "A sound fix, but for a different problem; it leaves this excerpt's flaw in place." }]),
            sol: S("A good revision is specific and removes the cause of the consequence, without deleting useful evidence.",
              `Best: ${fl.f}`),
          });
        },
      },
      {
        name: "Flag every flaw (select all)",
        make() {
          const k = U.randInt(1, 4);
          const flaws = U.sample(FLAWS, k).map(f => ({ t: f.x, ok: true, why: `Fails "${CHECK[f.k]}" ${f.c}` }));
          const good = U.sample(GOOD, 5 - k).map(g => ({ t: g, ok: false, why: "This is a defensible feature; it preserves sources, grain, meaning or traceability." }));
          return Q.multi({
            q: "<p>A proposal for VVMG's planning architecture contains these lines. Select <b>every</b> line that violates an architecture requirement.</p>",
            options: flaws.concat(good),
            sol: S("Run each line through the checklist: does it keep meaning, grain, identifiers, relationships, rules, originals, traceability, access and source limits?",
              "Defensible lines keep sources separate and traceable; flawed lines collapse, merge, relabel, delete or over-expose."),
          });
        },
      },
      {
        name: "Count the flaws",
        make() {
          const k = U.randInt(1, 4), n = U.randInt(5, 6);
          const lines = U.shuffle([...U.sample(FLAWS, k).map(f => ({ t: f.x, bad: true })), ...U.sample(GOOD, n - k).map(g => ({ t: g, bad: false }))]);
          return numQ({
            q: `<p>Gemini's draft lists these design decisions:</p><ol>${lines.map(l => `<li>${l.t}</li>`).join("")}</ol><p>How many of them violate a requirement on the checklist?</p>`,
            answer: k, kind: "count", unit: "decisions",
            traps: [{ value: n, why: "Some decisions are defensible: they preserve sources, grain, meaning or traceability." },
              { value: n - k, why: "That is the number of defensible decisions, not flawed ones." }].filter(t => t.value !== k),
            sol: S("Judge each decision separately; a proposal usually mixes defensible parts with flaws.",
              `Flawed: ${lines.map((l, i) => l.bad ? i + 1 : null).filter(x => x).join(", ")}.`,
              `<b>${k}</b> flawed decisions.`),
          });
        },
      },
      {
        name: "Defensible or flawed?",
        make() {
          const k = U.randInt(2, 3);
          const items = U.shuffle([...U.sample(FLAWS, k).map(f => ({ t: f.x, cat: "Flaw to revise", why: `Fails "${CHECK[f.k]}"` })), ...U.sample(GOOD, 5 - k).map(g => ({ t: g, cat: "Defensible feature", why: "It preserves sources, grain, meaning or traceability." }))]);
          return Q.classify({
            q: "<p>An honest audit names what to keep as well as what to fix. Classify each line of the proposal.</p>",
            cats: ["Defensible feature", "Flaw to revise"], items,
            sol: S("For each line ask: does it keep originals, grain, relationships, rules, traceability and access controls, or does it break one?",
              "Keeping the defensible parts is what lets a revision build on the draft instead of starting over."),
          });
        },
      },
      {
        name: "Which is NOT a checklist question?",
        make() {
          const fakes = [
            { t: "Which AI model produced the proposal?", why: "The tool used does not decide whether the design meets requirements." },
            { t: "Can every source be merged into one table?", why: "Merging everything is a warning sign, not a requirement." },
            { t: "Which field names sound most professional?", why: "A polished name proves nothing." },
            { t: "How quickly can the originals be deleted once the report is built?", why: "The checklist asks where originals remain available." },
            { t: "Which single score can replace all the separate measures?", why: "Combining unlike measures is an audit risk, not a requirement." },
          ];
          const fake = U.pick(fakes);
          return Q.mc({
            q: "<p>Three of these are questions from the Architecture Requirements Checklist. Which one is <b>NOT</b>?</p>",
            right: fake.t, rightWhy: fake.why,
            wrong: U.sample(CHECK, 3).map(c => ({ t: c, why: "This is one of the ten checklist questions." })),
            sol: S("The checklist covers meaning, grain, identifiers, mappings, relationships, business rules, originals, traceability, access/retention, and what each source can prove.",
              `The odd one out: "${fake.t}" ${fake.why}`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 8 · Human approval decisions
   * ============================================================ */
  const DEC = ["Accept", "Accept in part", "Revise", "Reject"];
  const DEC_DEF = {
    "Accept": "the proposal meets the requirements; approve with a validation step",
    "Accept in part": "approve the sound components now and withhold a separable unsupported part",
    "Revise": "send back with specific corrections; something the design depends on must be fixed first",
    "Reject": "the core design cannot meet the requirements; start again from the requirements",
  };
  const DEC_BANK = [
    { s: "The revised design keeps originals, separates Orders and OrderItems, keeps sessions (guests included) with events, reports views, saves and units separately, shows approval status, documents every derived field, and plans to reconcile totals to source orders.", d: "Accept", why: "Every requirement is met and a validation step is in place." },
    { s: "Lakeside Bikes' design keeps invoices and invoice lines separate, stores feedback text in a restricted archive, and its only derived table (monthly repair revenue) is documented and will be reconciled to invoice lines.", d: "Accept", why: "Nothing violates a requirement, and the derived table will be validated." },
    { s: "The proposal has no derived scores. Each source sits in a fitting component, mappings were verified on sample records, and every reporting field traces to source records.", d: "Accept", why: "The design passes the four tests; approve it with a validation step." },
    { s: "The source-integration structure is sound, but the report adds a PlanningPriorityScore with unexplained weights. The rest of the report runs fine without the score.", d: "Accept in part", why: "Approve the structure; withhold the separable, unsupported score." },
    { s: "Everything checks out except a new HighDemand flag whose logic is undocumented. The flag can be left out without affecting anything else.", d: "Accept in part", why: "The flag is separable, so approve the rest and hold it back." },
    { s: "Storage and relationships are correct. A proposed promotion-lift metric has never been tested against past promotions and is not needed for anything else in the report.", d: "Accept in part", why: "Approve the structure; the untested metric waits for back-testing." },
    { s: "The design is mostly sound, but the monthly revenue figure, which the whole report depends on, includes estimated cart totals.", d: "Revise", why: "A core figure breaks a business rule; it must be corrected before approval." },
    { s: "The structure is good except that the AppSessions table holds a single event_id column, and the reporting layer is built on it.", d: "Revise", why: "The relationship everything depends on must be restored to Session → Events first." },
    { s: "All components fit, but every join assumes customer_id equals CustomerID without any verification.", d: "Revise", why: "The mapping must be verified and documented before the integration can be approved." },
    { s: "The proposal replaces all sources with one customer-level Planning table, deletes the originals, and ranks inventory by an undocumented MonthlyDemandScore.", d: "Reject", why: "The core design fails grain, originals and traceability; start again from the requirements." },
    { s: "Orders, app events, comments and notes are flattened into one table of unlabeled \"activity\" rows, and the original files are not kept.", d: "Reject", why: "Source meaning, grain and originals are all lost; nothing can be built on it." },
    { s: "The design discards OrderItems, treats coupon saves as sales, and gives every employee access to comment text.", d: "Reject", why: "Multiple core requirements fail at once; revising piecemeal would mean rebuilding it anyway." },
  ];
  const VAL = [
    { risk: "a derived table of monthly sales by product", step: "Reconcile the derived totals to the source Orders and OrderItems for the same period." },
    { risk: "a new score that will guide inventory decisions", step: "Back-test the score against past months' actual results before using it." },
    { risk: "a join that assumes customer_id equals CustomerID", step: "Verify the mapping on a sample of records from both sources." },
    { risk: "a restricted repository for comments and pop-up notes", step: "Review who has access and confirm the retention and approved-use rules." },
    { risk: "a product list feeding restock recommendations", step: "Spot-check that pending, inactive and retired products show their approval status." },
  ];
  const PPS_CATS = ["Structure: can be approved", "Logic: withhold until justified"];
  const PPS_BANK = [
    { t: "Orders and OrderItems stay separate, linked by OrderID.", cat: PPS_CATS[0], why: "Preserves grain and the one-to-many relationship." },
    { t: "Sessions are kept, including guest sessions.", cat: PPS_CATS[0], why: "Keeps activity with an optional customer link." },
    { t: "Each session links to its many events.", cat: PPS_CATS[0], why: "Preserves Session → Events." },
    { t: "Comments and notes are stored with original text and metadata.", cat: PPS_CATS[0], why: "Keeps source meaning and traceability." },
    { t: "ProductID ↔ product_id mapping is documented.", cat: PPS_CATS[0], why: "A verified, documented mapping supports integration." },
    { t: "Product approval status is visible in the report.", cat: PPS_CATS[0], why: "Respects the sellability rule." },
    { t: "Originals remain available behind the reporting layer.", cat: PPS_CATS[0], why: "Passes the first foundational test." },
    { t: "Weights in PlanningPriorityScore are not explained.", cat: PPS_CATS[1], why: "Unexplained weights make the score indefensible." },
    { t: "Units sold, views, coupon saves, positive comments and favorable notes are added into one number.", cat: PPS_CATS[1], why: "Unlike measures are combined as if they were the same evidence." },
    { t: "Nobody has tested whether the measures are comparable.", cat: PPS_CATS[1], why: "Comparability is untested, so the sum may be meaningless." },
    { t: "The score has never been back-tested against past results.", cat: PPS_CATS[1], why: "Without back-testing, no one knows if the score predicts anything." },
    { t: "The score is proposed to rank next month's inventory orders.", cat: PPS_CATS[1], why: "Using an unsupported score for decisions is the risk to withhold." },
  ];
  const APPROVE_ELEMENTS = [
    { t: "One defensible feature of the proposal", ok: true, why: "Naming what works lets it survive revision." },
    { t: "One violated requirement", ok: true, why: "The decision must point to a specific requirement." },
    { t: "The business consequence of that violation", ok: true, why: "Consequences explain why the flaw matters." },
    { t: "A specific revision", ok: true, why: "A finding without a fix is not actionable." },
    { t: "The accountable person (the approving manager)", ok: true, why: "Someone must own the result; it is not the AI." },
    { t: "A validation step", ok: true, why: "Reconciling, back-testing or verifying mappings checks the decision." },
    { t: "A statement that the AI is responsible for the design", ok: false, why: "The AI has no accountability; the approving manager owns the result." },
    { t: "The number of times the prompt was regenerated", ok: false, why: "Regeneration history says nothing about whether the design meets requirements." },
    { t: "A promise to rename unclear fields later", ok: false, why: "Names prove nothing; logic and structure do." },
    { t: "Proof that the AI used the CORE framework", ok: false, why: "A good prompt does not approve the design." },
  ];

  const genApprove = STUDY.makeGenerator({
    id: "k201-ch12-approve",
    name: "Human approval decisions",
    blurb: "Choose accept, accept in part, revise or reject; name the validation step and accountable person; separate approving structure from approving logic.",
    variants: [
      {
        name: "Choose the decision",
        make() {
          const e = U.rotate("ch12-dec", DEC_BANK);
          return Q.mc({
            q: `<p>${e.s}</p><p>What should the approving manager decide?</p>`,
            right: e.d, rightWhy: e.why,
            wrong: DEC.filter(d => d !== e.d).map(d => ({ t: d, why: `${d} means: ${DEC_DEF[d]}. ${e.why}` })),
            keepOrder: DEC,
            sol: S("Ask two things: does anything violate a requirement, and if so, is the problem separable, fixable, or fatal to the core design?",
              `${DEC.map(d => `<b>${d}</b>: ${DEC_DEF[d]}`).join("<br>")}`,
              `Here: <b>${e.d}</b>. ${e.why}`),
          });
        },
      },
      {
        name: "Pick the validation step",
        make() {
          const v = U.pick(VAL);
          return Q.mc({
            q: `<p>A manager is approving ${v.risk}. Which validation step fits best?</p>`,
            right: v.step, rightWhy: "It checks the specific risk this component introduces.",
            wrong: U.sample(VAL.filter(x => x !== v), 3).map(x => ({ t: x.step, why: `A good check, but for ${x.risk}, not this component.` })),
            sol: S("A validation step tests the specific thing that could go wrong.",
              `Derived totals → reconcile; scores → back-test; mappings → verify on samples; restricted text → review access and retention; product lists → check approval status.`,
              `Here: ${v.step}`),
          });
        },
      },
      {
        name: "Structure vs logic",
        make() {
          const k = U.randInt(2, 3);
          const items = U.shuffle([...U.deal("ch12-pps0", PPS_BANK.filter(b => b.cat === PPS_CATS[0]), k), ...U.deal("ch12-pps1", PPS_BANK.filter(b => b.cat === PPS_CATS[1]), 5 - k)]);
          return Q.classify({
            q: "<p>VVMG's revised architecture fixes the structure but adds a <code>PlanningPriorityScore</code>. Sort each feature: can it be approved now, or should approval be withheld?</p>",
            cats: PPS_CATS, items,
            sol: S("Approving the structure is not approving the logic.",
              "Storage, grain, relationships, mappings, approval status and originals are structure. The score's weights, comparability, back-testing and use in decisions are logic."),
          });
        },
      },
      {
        name: "Compute the priority score",
        make() {
          const w = { u: U.pick([1, 2, 3]), v: U.pick([0.5, 1]), s: U.pick([1, 2]), c: U.pick([3, 4, 5]), n: U.pick([4, 5, 6]) };
          const x = { u: U.randInt(10, 60), v: U.randInt(4, 30) * 10, s: U.randInt(5, 40), c: U.randInt(1, 6), n: U.randInt(1, 4) };
          const score = w.u * x.u + w.v * x.v + w.s * x.s + w.c * x.c + w.n * x.n;
          const prod = U.pick(["the Crimson Campus Hoodie", "the game-day tee", "the knit beanie", "the water bottle"]);
          return numQ({
            q: `<p>A draft defines</p><p><code>PlanningPriorityScore = ${w.u}×units sold + ${w.v}×product views + ${w.s}×coupon saves + ${w.c}×positive comments + ${w.n}×favorable notes</code></p><p>Last month ${prod} had ${x.u} units sold, ${x.v} views, ${x.s} coupon saves, ${x.c} positive ${U.plural(x.c, "comment")} and ${x.n} favorable pop-up ${U.plural(x.n, "note")}. What score does the formula give?</p>`,
            answer: score,
            traps: [{ value: x.u + x.v + x.s + x.c + x.n, why: "You added the raw counts without applying the weights." },
              { value: w.u * x.u, why: "That is only the units-sold term; the formula adds four more." }].filter(t => Math.abs(t.value - score) > Math.max(0.011, score * 0.01)),
            sol: S("Multiply each count by its weight, then add the five terms.",
              `${w.u}×${x.u} + ${w.v}×${x.v} + ${w.s}×${x.s} + ${w.c}×${x.c} + ${w.n}×${x.n} = ${w.u * x.u} + ${w.v * x.v} + ${w.s * x.s} + ${w.c * x.c} + ${w.n * x.n}`,
              `Score = <b>${U.fmt(score)}</b>. Notice that views contribute ${w.v * x.v} while sales contribute ${w.u * x.u}: the formula adds interest and purchases as if they were the same evidence, with weights nobody has explained.`),
          });
        },
      },
      {
        name: "What the ranking reveals",
        make() {
          const w = { u: 2, v: 0.5, s: 1, c: 3 };
          let A, B, sa, sb;
          for (let g = 0; g < 60; g++) {
            A = { u: U.randInt(5, 25), v: U.randInt(40, 90) * 10, s: U.randInt(20, 60), c: U.randInt(2, 6) };
            B = { u: U.randInt(60, 120), v: U.randInt(5, 20) * 10, s: U.randInt(2, 15), c: U.randInt(0, 2) };
            sa = w.u * A.u + w.v * A.v + w.s * A.s + w.c * A.c;
            sb = w.u * B.u + w.v * B.v + w.s * B.s + w.c * B.c;
            if (sa > sb + 10) break;
          }
          if (!(sa > sb + 10)) { A = { u: 12, v: 600, s: 40, c: 4 }; B = { u: 90, v: 100, s: 8, c: 1 }; sa = 2 * 12 + 300 + 40 + 12; sb = 180 + 50 + 8 + 3; }
          const [na, nb] = U.sample(["Varsity scarf", "Stadium blanket", "Crew socks", "Logo cap", "Tote bag"], 2);
          return Q.mc({
            q: `<p>Score = 2×units + 0.5×views + 1×coupon saves + 3×positive comments.</p>${tbl(["Product", "Units sold", "Views", "Coupon saves", "Positive comments"], [[na, A.u, A.v, A.s, A.c], [nb, B.u, B.v, B.s, B.c]])}<p>Which statement is correct?</p>`,
            right: `${na} scores higher (${sa} vs ${sb}) even though ${nb} sold far more units, so the weights let interest outweigh completed sales.`,
            rightWhy: "The score ranks browsing above buying; untested weights can reverse what the sales records show.",
            wrong: [
              { t: `${nb} scores higher because it sold more units.`, why: `Compute it: ${na} = ${sa}, ${nb} = ${sb}. The view and save terms push ${na} ahead.` },
              { t: `${na} scores higher, which proves ${na} has more demand.`, why: "A score built from unlike measures with untested weights cannot prove demand." },
              { t: "The two products tie, so the score is neutral.", why: `They do not tie: ${sa} vs ${sb}.` },
            ],
            sol: S("Compute both scores, then compare the ranking with what the sales records alone say.",
              `${na}: 2×${A.u} + 0.5×${A.v} + ${A.s} + 3×${A.c} = ${sa}. ${nb}: 2×${B.u} + 0.5×${B.v} + ${B.s} + 3×${B.c} = ${sb}.`,
              "The higher score goes to the product people looked at, not the one they bought. That is why the logic needs explained weights and back-testing before anyone approves it."),
          });
        },
      },
      {
        name: "What a defensible approval includes",
        make() {
          const k = U.randInt(2, 4);
          return Q.multi({
            q: "<p>Select <b>every</b> element a defensible approval decision should include.</p>",
            options: U.sample(APPROVE_ELEMENTS.filter(e => e.ok), k).concat(U.sample(APPROVE_ELEMENTS.filter(e => !e.ok), 5 - k)),
            sol: S("A defensible decision is evidence plus ownership plus a check.",
              "Include: a defensible feature, a violated requirement, its consequence, a specific revision, the accountable person and a validation step."),
          });
        },
      },
      K.conceptVariant("Accountability and approval", "ch12-appr-c", [
        { q: "Gemini drafted VVMG's architecture and a manager approved it. Inventory decisions based on it go badly. Who is accountable?",
          right: "The approving manager.", rightWhy: "The person who approves the design owns its consequences.",
          wrong: [{ t: "Gemini, because it produced the design.", why: "An AI tool has no accountability; it only drafts." },
            { t: "Nobody, because the design came from an AI.", why: "Using AI does not remove responsibility; it shifts the review burden to the approver." },
            { t: "Whoever wrote the prompt, regardless of who approved.", why: "The prompt shapes the draft; approval is where responsibility is taken." }],
          sol: ["Ask who made the decision to use the design.", "Approval is a human act, so the approving manager owns the result."] },
        { q: "A manager approves VVMG's revised source integration but not its PlanningPriorityScore. What principle is this?",
          right: "Approving the structure is not approving the logic.", rightWhy: "Structure and derived logic can be judged separately.",
          wrong: [{ t: "The proposal must be accepted or rejected as a whole.", why: "Accept in part exists exactly for this case." },
            { t: "Scores are never allowed in a reporting layer.", why: "Scores are fine once their logic is documented and back-tested." },
            { t: "The AI should decide which parts to keep.", why: "The decision belongs to an accountable person." }],
          sol: ["Separate how data is stored and connected from how a score is calculated.", "The structure can pass while the score's logic is withheld: accept in part."] },
        { q: "What is the difference between \"accept in part\" and \"revise\"?",
          right: "Accept in part approves the sound parts now and withholds a separable piece; revise sends the proposal back because something it depends on must be fixed first.",
          rightWhy: "The question is whether the flawed part can be set aside or the rest depends on it.",
          wrong: [{ t: "They mean the same thing.", why: "One approves part of the proposal now; the other approves nothing until fixed." },
            { t: "Revise is for minor typos; accept in part is for major flaws.", why: "The split is about separability, not size." },
            { t: "Accept in part means the AI fixes the rest automatically.", why: "A person still decides what is approved and validates it." }],
          sol: ["Ask: can the flawed part be removed without breaking the rest?", "Yes → accept in part. No, the rest depends on it → revise."] },
      ]),
    ],
  });

  const generators = [genArch, genMeaning, genGrain, genIds, genTrace, genCore, genAudit, genApprove];

  STUDY.registerUnit(C, {
    id: "ch12", order: 12,
    title: "Chapter 12 · Modern Data Architectures and GenAI Collaboration",
    short: "Ch 12 · Architecture & GenAI",
    description: "Turn verified sources into architecture requirements (meaning, grain, identifiers, rules, traceability), prompt GenAI with CORE, audit its proposal and defend a human approval decision.",
    notes, flashcards, cues, generators,
  });
})();
