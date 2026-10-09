/* ============================================================
 * BUS K201 · Chapter 7 · Enterprise Systems: Integrating
 * Processes, Data, and Decisions
 * Enterprise-system traits, CRM vs. SCM vs. ERP, ERP modules and
 * integration, decision support from operational data, systems
 * mapping, information silos, best-of-breed vs. integrated suite vs.
 * hybrid, and the human side of integration.
 * Explanations, examples and scenarios are written for this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "bus-k201";
  const K = STUDY.k201;
  const S = K.S;

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const COMPANIES = ["Ridgeway Outfitters", "Limestone Furniture Co.", "Hoosier Holdings", "Kirkwood Kitchen Supply", "Monroe Medical Supply",
    "Cardinal Cycle Works", "Prairie Pet Goods", "Sample Gates Apparel", "Wabash Hardware", "Fountain Square Foods", "Crimson Office Products",
    "Brown County Candles"];
  const BANKS = ["Hoosier First National", "Crossroads Bank & Trust", "Great Lakes Federal", "Heartland Savings Bank"];

  /* ---------- SVG systems map ----------
   * ev = { nodes: [{ id, sub }], edges: [{ from, to, sends }] }
   * Nodes are placed in columns by how far downstream they are; arrows are numbered. */
  function mapSvg(ev) {
    const lvl = {};
    ev.nodes.forEach(n => { lvl[n.id] = 0; });
    for (let i = 0; i < ev.nodes.length; i++) ev.edges.forEach(e => { lvl[e.to] = Math.max(lvl[e.to], lvl[e.from] + 1); });
    const cols = [];
    ev.nodes.forEach(n => { (cols[lvl[n.id]] = cols[lvl[n.id]] || []).push(n); });
    const BW = 112, BH = 46, GAP = 62, RH = 72;
    const maxRows = Math.max(...cols.map(c => c.length));
    const pos = {};
    cols.forEach((c, l) => c.forEach((n, r) => {
      pos[n.id] = { x: 10 + l * (BW + GAP), y: 10 + (maxRows - c.length) * RH / 2 + r * RH };
    }));
    const W = 20 + cols.length * BW + (cols.length - 1) * GAP;
    const H = 20 + maxRows * RH - (RH - BH);
    const mid = "arr" + U.randInt(1000, 999999);
    let s = `<svg viewBox="0 0 ${W} ${H}" style="max-width:100%;height:auto" role="img"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"></path></marker></defs>`;
    ev.nodes.forEach(n => {
      const p = pos[n.id];
      s += `<rect x="${p.x}" y="${p.y}" width="${BW}" height="${BH}" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"></rect>`;
      s += `<text x="${p.x + BW / 2}" y="${p.y + 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">${n.id}</text>`;
      s += `<text x="${p.x + BW / 2}" y="${p.y + 36}" text-anchor="middle" font-size="10" fill="currentColor">${n.sub}</text>`;
    });
    ev.edges.forEach((e, i) => {
      const a = pos[e.from], b = pos[e.to];
      const x1 = a.x + BW, y1 = a.y + BH / 2, x2 = b.x - 2, y2 = b.y + BH / 2;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="1.5" marker-end="url(#${mid})"></line>`;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
      s += `<circle cx="${mx}" cy="${my}" r="8" fill="none" stroke="currentColor"></circle><text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" fill="currentColor">${i + 1}</text>`;
    });
    return s + `</svg>`;
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "What makes a system an enterprise system",
      lo: "Explain how enterprise systems integrate processes and data across functions.",
      html: `<p>When you order something online and get a confirmation email, a live tracking link and an on-time delivery, it feels like one smooth service. Behind it sit many connected systems: one holds your customer profile, one routes the order to a warehouse, one coordinates drivers, one updates inventory. Making those pieces work as one is what enterprise systems are for.</p>
<p>An <b>enterprise information system</b> is large-scale software that supports and ties together the core business processes of a <em>whole</em> organization: across departments, across locations, and sometimes across company boundaries (suppliers, partners). Four characteristics define it:</p>
<ul>
<li><b>Organization-wide</b>: it reaches every relevant department and site, not one team.</li>
<li><b>Integrated</b>: authorized functions share data through connected processes instead of each keeping its own isolated copy.</li>
<li><b>Scalable</b>: it can grow with more users, transactions and locations without being replaced.</li>
<li><b>Process-oriented</b>: work follows standard, repeatable steps (like order-to-cash) that cross departmental lines.</li>
</ul>
<p>The "enterprise environment" does not have to be one product from one vendor. It can be a single integrated suite, or several systems connected well enough that everyone sees one consistent picture.</p>
<div class="keyidea"><b>Key idea.</b> What makes a system "enterprise" is <em>scope plus integration</em>: the whole organization working from shared data through connected, standard processes.</div>
<div class="example"><b>Example.</b> A regional hospital network once ran separate billing, pharmacy and scheduling software at each of its five hospitals. After moving to one connected platform, a patient's appointment, prescriptions and bill all live in shared records that any authorized staff member at any site can see, and the same admission steps are followed everywhere.</div>
<div class="trap"><b>Common trap.</b> "EIS" means two different things in K201. Earlier (Chapter 3) it abbreviated <em>executive</em> information system, a summary tool for top managers. In this chapter it means <em>enterprise</em> information system. Read the context before answering.</div>`,
      gens: ["k201-ch7-traits"],
    },
    {
      title: "CRM and SCM: the customer side and the supply side",
      lo: "Distinguish CRM and SCM and match each to its processes, data and managerial questions.",
      html: `<p><b>Customer relationship management (CRM)</b> manages a company's interactions with current and potential customers. Its philosophy: customers are among the organization's most valuable assets, so everything known about them belongs in one place. A CRM pulls contact details, purchase history, support tickets, emails and preferences into one central database. Core functions:</p>
<ul>
<li><b>Contact management</b>: one complete record per customer.</li>
<li><b>Sales pipeline tracking</b>: deals in progress, which selling step each is at, forecast revenue.</li>
<li><b>Customer service &amp; support</b>: inquiries, complaints and tickets tracked to resolution.</li>
<li><b>Marketing automation</b>: plan, run and measure campaigns.</li>
<li><b>Analytics &amp; reporting</b>: dashboards on retention, service quality and sales results.</li>
</ul>
<p>Benefits: better <b>retention</b> (spot customers likely to leave), more <b>efficient selling</b>, <b>personalized marketing</b>, <b>better service</b> (any agent sees the whole history, so no endless transfers), <b>data-driven decisions</b> (why deals are won or lost) and <b>alignment</b> across sales, marketing and service.</p>
<p><b>Supply chain management (SCM)</b> coordinates the flow of products, information and money from raw-material sourcing all the way to the final customer: roughly everything that happens <em>before</em> the product reaches the buyer. The supply chain is the network of suppliers, manufacturers, warehouses, distributors and retailers. Core functions: <b>demand forecasting</b>, <b>procurement</b> (supplier relationships and purchasing), <b>production planning</b>, <b>inventory management</b> across warehouses and distribution centers, <b>logistics &amp; distribution</b> (shipping, warehousing, last-mile delivery) and <b>returns management</b>.</p>
<p>Benefits: <b>lower inventory costs</b> (less cash tied up in stock), <b>faster delivery</b>, <b>reduced supply-chain risk</b>, <b>greater flexibility</b>, <b>efficiency</b> and <b>traceability</b>. During the COVID-19 disruptions, firms with strong SCM saw problems coming earlier, found alternate suppliers and rerouted shipments.</p>
<div class="keyidea"><b>Key idea.</b> CRM faces <em>outward to customers</em> (relationships, sales, service, marketing). SCM faces <em>along the chain of goods</em> (forecast, buy, make, store, move). A question about who the customer is or how they feel → CRM. A question about where the stuff is or will come from → SCM.</div>
<div class="example"><b>Example.</b> At a large bank, "Which of our mortgage customers have no savings account with us?" is a CRM question (relationship data, cross-selling). "Which vendor supplies the cash-handling parts for our ATMs, and are deliveries to branches on time?" is an SCM question: even a bank has a supply chain for physical goods.</div>
<div class="trap"><b>Common trap.</b> Product recommendations ("customers like you also bought…") are not CRM alone. Retailers combine CRM data with purchase history, browsing behavior and product data, using analytics and personalization tools on top.</div>`,
      gens: ["k201-ch7-crmscmerp"],
    },
    {
      title: "ERP: one system, shared data, many modules",
      lo: "Trace a transaction through ERP modules and explain the benefits and costs of ERP.",
      html: `<p><b>Enterprise resource planning (ERP)</b> is an integrated platform that runs the core processes of the whole organization in one unified system. Without it, finance, HR, manufacturing, sales and purchasing each run their own software with their own database. ERP's defining feature is <b>integration</b>: data entered once is available to every function that needs it, often in real or near-real time, with no retyping.</p>
<p>Typical ERP <b>modules</b>:</p>
<ul>
<li><b>Financial management</b>: general ledger, accounts payable and receivable, financial reporting, budgeting.</li>
<li><b>Human resources</b>: payroll, employee records, performance, recruiting.</li>
<li><b>Manufacturing</b>: production planning, quality control, shop-floor scheduling.</li>
<li><b>Supply chain</b>: procurement, inventory, warehouse management, logistics.</li>
<li><b>Sales &amp; distribution</b>: order management, pricing, shipping, invoicing.</li>
<li><b>Project management</b>: planning, resource allocation, cost tracking.</li>
<li><b>Customer service</b>: service contracts, field service, returns.</li>
</ul>
<p>Follow one <b>sales order</b>: once it is entered, inventory is updated, a purchase order for raw materials can be triggered, production is scheduled, and the financial forecast changes. Nobody re-keys anything.</p>
<p><b>Benefits</b>: a <b>single source of truth</b> (no conflicting versions), <b>operational efficiency</b>, <b>visibility</b> across departments, <b>better customer service</b>, easier <b>regulatory compliance</b> (one auditable system) and <b>scalability</b>. <b>Costs</b>: ERP takes a lot of time and money. It means data conversion, training, process redesign, testing and change management, and the payoff depends on implementation quality, user adoption, data governance and fit with the business.</p>
<div class="keyidea"><b>Key idea.</b> ERP = enter once, use everywhere. One sales order ripples through inventory, purchasing, production and finance automatically because every module reads the same database.</div>
<div class="example"><b>Example.</b> A furniture maker ran production on spreadsheets, accounting on a separate package and HR on a third program. Month-end meant three people reconciling numbers that never matched. After an ERP rollout, a 300-chair order instantly shows up as reduced finished-goods stock, a fabric purchase order and a production slot, and finance sees the expected revenue the same afternoon.</div>
<div class="trap"><b>Common trap.</b> "Buy an ERP and the benefits follow." Two firms can install the same product and get very different results. Poor data conversion, skipped training or unchanged processes can erase the gains.</div>`,
      gens: ["k201-ch7-erp", "k201-ch7-crmscmerp"],
    },
    {
      title: "From operational data to decisions",
      lo: "Explain how integrated data supports decisions through reports, dashboards, scenario analysis and decision-support tools.",
      html: `<p>CRM, SCM and ERP mostly <em>capture and coordinate</em> operational data: orders, shipments, tickets, payments. <b>Decision-support tools</b> then <em>use</em> that data: reports, dashboards, scenario ("what-if") analysis and full <b>decision support systems (DSS)</b>. A DSS is an interactive system that helps managers analyze data, compare alternatives and estimate outcomes. It does <b>not replace managerial judgment</b>.</p>
<p>A DSS recommendation is only as good as three things: the <b>quality of its data</b>, the <b>assumptions in its model</b>, and whether the situation contains <b>conditions the model can't see</b>. Managers therefore validate inputs, interpret results and weigh risks and exceptions before acting.</p>
<p>Integration matters here too. When systems are connected, every report starts from the same data, so managers see one consistent view. When systems are disconnected, two departments can produce conflicting reports because their analyses started from different versions of the data.</p>
<div class="keyidea"><b>Key idea.</b> Operational systems record what happened. Decision support helps decide what to do next. The manager still makes the call.</div>
<div class="example"><b>Example.</b> A grocery chain's DSS recommends cutting bottled-water orders because sales have been flat. The regional manager knows a hurricane is forecast for next week, something the historical data never contained, so she overrides the recommendation and raises the order instead.</div>
<div class="trap"><b>Common trap.</b> Treating a dashboard as the truth. If the sales figure came from a stale export of an old system, or a glitch double-loaded yesterday's data, the polished chart is still wrong. Check suspicious inputs before acting.</div>`,
      gens: ["k201-ch7-dss"],
    },
    {
      title: "Systems mapping: following a business event through systems",
      lo: "Trace a transaction and the data shared among sales, operations, supply chain, customer service and finance.",
      html: `<p>A <b>systems map</b> is a simple picture of which systems take part in a business event, in what <b>order</b>, and what <b>information moves</b> between them. Boxes are systems (or departments), arrows show the direction the information flows, and the layout shows the sequence. It is not a technical blueprint. <b>Systems mapping</b> is the wider practice of visualizing how applications, databases and workflows connect to reach a business goal.</p>
<p>Why bother? A map helps you:</p>
<ul>
<li><b>find bottlenecks</b>: where data gets stuck or is retyped by hand;</li>
<li><b>protect data integrity</b>: see where master data lives, e.g. an address changed in the CRM should flow to the billing profile in the ERP;</li>
<li><b>plan upgrades</b>: know what breaks if one piece of software is replaced.</li>
</ul>
<p><b>Systems map vs. flowchart.</b> A flowchart shows the <em>steps a person follows</em> to finish a task. A systems map shows <em>where the data goes</em>: which system receives it, updates it and acts next.</p>
<p>Three traced events:</p>
<ul>
<li><b>Bookstore stockout.</b> The TPS (register) records an attempted sale and sees zero copies → the SCM automatically reorders from the publisher → the ERP updates budget and financial records for the incoming order → weeks later, the manager's DSS pulls the stockout into a sales-trend report to size next semester's order.</li>
<li><b>University enrollment.</b> The student information system (SIS) checks prerequisites, reserves a seat and records the enrollment, then tells the LMS (e.g. Canvas) to grant course access and sends the enrollment to the financial system (ERP) to calculate fees.</li>
<li><b>E-commerce "Buy Now."</b> The TPS logs the order → the CRM adds it to purchase history and sends a thank-you email → the ERP processes the payment, books revenue and updates the general ledger → the SCM deducts inventory, prints a label and alerts the warehouse → the DSS shows the item as trending in the executive sales report.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Business processes flow <em>through</em> systems, not around them. The TPS can't reorder on its own, and the SCM can't know a title sold out unless the TPS tells it. Each system depends on the handoff before it.</div>
<div class="example"><b>Example.</b> When a sales rep closes a 2,000-chair deal: CRM marks it won and passes the order on → ERP creates the sales order and schedules production → SCM buys the fabric that is short and books a carrier → a DSS runs a scenario on whether the plant can take more orders like it.</div>
<div class="trap"><b>Common trap.</b> Putting the DSS first because "managers decide." Decision support analyzes what the operational systems have already recorded, so it sits at the <em>end</em> of the flow.</div>`,
      gens: ["k201-ch7-sysmap"],
    },
    {
      title: "Information silos and what they cost",
      lo: "Analyze how duplicated, inconsistent, missing or delayed data from silos creates risks for customers, employees and managers.",
      html: `<p>An <b>information silo</b> is data trapped in one system that can't easily flow to another. Each department sees its own data and nobody sees the whole. Silos usually grow by accident: an old CRM, a separate accounting package, a warehouse system logistics picked, HR on spreadsheets. Seven typical consequences:</p>
<ol>
<li><b>Data inconsistency &amp; errors</b>: the same address or price is stored in several places and the copies drift apart.</li>
<li><b>Wasted time on manual re-entry</b>: an order is retyped into inventory, shipping and invoicing. It is slow, costly and a constant source of typos.</li>
<li><b>No big picture</b>: sales sees strong orders but not the near-empty warehouse; finance learns a big customer is 60 days overdue only after the next order has shipped.</li>
<li><b>Poor customer experience</b>: customers repeat themselves while agents hop between applications.</li>
<li><b>High IT maintenance costs</b>: separate licenses, servers, patches and support for each system.</li>
<li><b>Compliance &amp; audit risk</b>: hard to produce a full audit trail, follow financial-reporting rules or honor privacy laws when data is scattered.</li>
<li><b>Resistance to change</b>: often the biggest barrier is human. People are attached to familiar tools, so breaking silos needs leadership, communication and training.</li>
</ol>
<div class="keyidea"><b>Key idea.</b> Silos cause duplicated, inconsistent, missing or delayed data, and the harm lands on customers (bad experience), employees (re-entry, workarounds) and managers (no reliable whole picture).</div>
<div class="example"><b>Example.</b> At a pet-supply wholesaler, the web store lists a dog bed at $49 while the register system still charges $55 (inconsistency). Orders are printed and retyped into the warehouse system (re-entry). When a customer calls about the price difference, the agent has to open three programs to find the order (customer experience).</div>
<div class="trap"><b>Common trap.</b> Assuming silos are purely a technology problem. Even after integration is technically possible, staff who keep private spreadsheets or departments that guard "their" data will rebuild the silo.</div>`,
      gens: ["k201-ch7-silo"],
    },
    {
      title: "Best-of-breed, integrated suite or hybrid",
      lo: "Compare integration approaches on functionality, integration, cost, flexibility, implementation risk and vendor dependence, and defend a recommendation.",
      html: `<p>Every firm fighting silos faces the <b>integration dilemma</b>:</p>
<ul>
<li><b>Best-of-breed</b>: buy the top-rated product for each function (best CRM + best SCM + best accounting). <em>Pro:</em> each tool may be the strongest in its area. <em>Con:</em> connecting them is complex, expensive and often imperfect, and you manage many vendors.</li>
<li><b>Integrated suite</b>: one vendor's ERP for all functions. <em>Pro:</em> seamless data flow, one vendor to call, lower integration cost. <em>Con:</em> no vendor is best-in-class at everything, and you depend heavily on that one vendor.</li>
<li><b>Hybrid</b>: a core ERP plus specialized tools where the core falls short, connected through <b>APIs</b> (application programming interfaces, standard ways for one program to request or send data to another) or other integration methods.</li>
</ul>
<table class="tbl"><thead><tr><th>Dimension</th><th>Best-of-breed</th><th>Integrated suite</th><th>Hybrid</th></tr></thead><tbody>
<tr><td>Functionality per area</td><td>Highest</td><td>Good, uneven</td><td>High where it matters</td></tr>
<tr><td>Ease of integration</td><td>Hardest</td><td>Easiest</td><td>Moderate (APIs)</td></tr>
<tr><td>Integration cost</td><td>Highest</td><td>Lowest</td><td>Moderate</td></tr>
<tr><td>Vendor dependence</td><td>Spread out</td><td>Highest</td><td>Mostly on core vendor</td></tr>
<tr><td>Implementation risk</td><td>Data may move imperfectly</td><td>Large single rollout</td><td>Depends on managing connections</td></tr>
</tbody></table>
<p>To <b>develop and defend a recommendation</b>: map the current systems and the data they share, identify the requirements that matter most (and the constraints: IT staff, budget, timeline), pick the approach whose tradeoffs fit, and justify the future state. When requirements change, revisit the recommendation rather than defending the old one.</p>
<div class="keyidea"><b>Key idea.</b> There is no universally best approach. Recommend based on the firm's priorities and constraints, and name the tradeoff you are accepting.</div>
<div class="example"><b>Example.</b> A national retailer's ERP handles finance and inventory well, but its built-in CRM can't run the loyalty program marketing wants. Rather than replace everything, it keeps the ERP as the core and connects a specialized loyalty platform through APIs: a hybrid.</div>
<div class="trap"><b>Common trap.</b> Thinking best-of-breed means "best overall." Each piece is the best in its own area, but the whole can be worse if data moves between the pieces late or with errors.</div>`,
      gens: ["k201-ch7-strategy"],
    },
    {
      title: "People and organization: what makes integration succeed",
      lo: "Evaluate how process redesign, data ownership, training, change management and human validation affect integration.",
      html: `<p>Integration projects rarely fail because the software can't do the job. They fail because of people and processes. Five factors to evaluate:</p>
<ul>
<li><b>Process redesign</b>: rethink how work should flow in the new system instead of automating the old, slow steps.</li>
<li><b>Data ownership</b>: name who is responsible for each kind of shared data (customer, product, supplier, employee) and who has the final word when records conflict.</li>
<li><b>Training</b>: role-based practice on the tasks each person will actually do, before and after go-live.</li>
<li><b>Change management</b>: explain why the change is happening, communicate often, involve respected employees, address concerns and phase the rollout.</li>
<li><b>Human validation</b>: people check migrated data, automated outputs and unusual recommendations before they are trusted.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Technology makes integration possible. Redesigned processes, clear data owners, trained users, managed change and human checks make it work.</div>
<div class="example"><b>Example.</b> A distributor's new ERP launches on time, but six months later warehouse leads still keep their own spreadsheets. The fix isn't more software: leaders explain what the old spreadsheets cost (change management), give leads hands-on practice with the new receiving screens (training), and make the inventory manager the owner of stock data (data ownership).</div>
<div class="trap"><b>Common trap.</b> Copying the old process into the new system ("paving the cow path"). A 14-step paper approval configured step-for-step in an ERP is just as slow, only now it's digital.</div>`,
      gens: ["k201-ch7-human", "k201-ch7-strategy"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "k201-ch7-c-eis", tag: "Definition", front: "What is an <em>enterprise information system</em>?", back: "Large-scale software that supports and integrates the core business processes of a <b>whole organization</b>, across departments, locations and sometimes other companies (suppliers, partners)." },
    { id: "k201-ch7-c-traits", tag: "List", front: "Name the four characteristics of an enterprise system.", back: "<b>Organization-wide</b>, <b>integrated</b> (shared data through connected processes, not isolated copies), <b>scalable</b> and <b>process-oriented</b> (standard, repeatable work)." },
    { id: "k201-ch7-c-eis2", tag: "Misconception", front: "Does “EIS” always mean the same thing in K201?", back: "<b>No.</b> In Chapter 3 it meant <em>executive</em> information system (summaries for top managers). In Chapter 7 it means <em>enterprise</em> information system. Use the context." },
    { id: "k201-ch7-c-envt", tag: "Principle", front: "Must an enterprise environment be one product from one vendor?", back: "<b>No.</b> It can be one integrated suite or several connected systems, as long as they give a consistent, shared view of the data." },
    { id: "k201-ch7-c-crm", tag: "Definition", front: "What is <em>CRM</em>, and what philosophy is behind it?", back: "Customer relationship management: managing interactions with current and potential customers in one central database (contacts, purchases, tickets, emails, preferences). Philosophy: customers are among the most valuable assets." },
    { id: "k201-ch7-c-crmfn", tag: "List", front: "List the five core CRM functions.", back: "Contact management · sales pipeline tracking · customer service &amp; support · marketing automation · analytics &amp; reporting." },
    { id: "k201-ch7-c-crmben", tag: "List", front: "Give the six CRM benefits.", back: "Improved retention · sales efficiency · personalized marketing · better customer service · data-driven decisions (why deals are won/lost) · cross-department alignment." },
    { id: "k201-ch7-c-scm", tag: "Definition", front: "What does <em>SCM</em> coordinate?", back: "The flow of <b>products, information and money</b> from raw-material sourcing to the final customer, across a network of suppliers, manufacturers, warehouses, distributors and retailers." },
    { id: "k201-ch7-c-scmfn", tag: "List", front: "List the six core SCM functions.", back: "Demand forecasting · procurement · production planning · inventory management · logistics &amp; distribution · returns management." },
    { id: "k201-ch7-c-scmben", tag: "List", front: "Give the six SCM benefits.", back: "Lower inventory costs (frees cash) · faster delivery · reduced supply-chain risk · greater flexibility · improved efficiency · better traceability." },
    { id: "k201-ch7-c-crmvscm", tag: "Distinction", front: "CRM vs. SCM: what's the quick test?", back: "Is the question about the <b>customer relationship</b> (who they are, what they bought, how they feel, deals, campaigns)? → CRM. Is it about the <b>flow of goods</b> (forecast, buy, make, stock, ship)? → SCM." },
    { id: "k201-ch7-c-erp", tag: "Definition", front: "What is <em>ERP</em>, and what is its defining characteristic?", back: "An integrated platform running the whole organization's core processes in one unified system. Defining trait: <b>integration</b>. Data entered once is available to every function that needs it, often in near-real time." },
    { id: "k201-ch7-c-modules", tag: "List", front: "Name the seven typical ERP modules.", back: "Financial management · human resources · manufacturing · supply chain · sales &amp; distribution · project management · customer service." },
    { id: "k201-ch7-c-order", tag: "Application", front: "In an ERP, what can a single sales order update without re-entry?", back: "Inventory, a purchase order for raw materials, the production schedule and the financial forecast. The invoice can come from the same record." },
    { id: "k201-ch7-c-erpben", tag: "List", front: "Give the six ERP benefits.", back: "Single source of truth · operational efficiency · improved visibility · better customer service · regulatory compliance (one auditable system) · scalability." },
    { id: "k201-ch7-c-erpcost", tag: "Why", front: "Why might two companies get very different results from the same ERP?", back: "Benefits depend on <b>implementation quality, user adoption, data governance and alignment</b> with the business. Data conversion, training, process redesign, testing and change management all take real time and money." },
    { id: "k201-ch7-c-dss", tag: "Definition", front: "What is a <em>decision support system</em>, and does it replace judgment?", back: "An interactive system that helps managers analyze data, compare alternatives and estimate outcomes. It does <b>not</b> replace judgment: managers validate inputs, interpret results and weigh risks and exceptions." },
    { id: "k201-ch7-c-dsslimits", tag: "List", front: "A DSS recommendation depends on which three things?", back: "The <b>quality of the data</b>, the <b>model's assumptions</b>, and <b>conditions the model may not capture</b> (a storm, an unrecorded deal, a closed road)." },
    { id: "k201-ch7-c-conflict", tag: "Why", front: "Why do disconnected systems produce conflicting reports?", back: "Each analysis starts from a <b>different version of the data</b>. Integrated systems give one consistent view, so reports start from the same numbers." },
    { id: "k201-ch7-c-map", tag: "Definition", front: "What is a <em>systems map</em>?", back: "A simple visual of which systems take part in a business event, in what order, and what information moves between them. Boxes = systems/departments, arrows = direction of information flow. Not a technical blueprint." },
    { id: "k201-ch7-c-mapvflow", tag: "Distinction", front: "Systems map vs. flowchart?", back: "A <b>flowchart</b> shows the steps a <em>person</em> follows to finish a task. A <b>systems map</b> shows where the <em>data</em> goes: which system receives it, updates it and acts next." },
    { id: "k201-ch7-c-whymap", tag: "List", front: "Give three reasons to map systems.", back: "Find <b>bottlenecks</b> (stuck data, manual entry) · protect <b>data integrity</b> (where master data lives and how updates spread) · <b>plan upgrades</b> (what breaks if a system is replaced)." },
    { id: "k201-ch7-c-book", tag: "Application", front: "Trace a bookstore textbook stockout through the systems.", back: "<b>TPS</b> logs the attempted sale and sees zero stock → <b>SCM</b> reorders from the publisher → <b>ERP</b> updates budget/financial records → later the <b>DSS</b> puts the stockout in a sales-trend report for next semester's order." },
    { id: "k201-ch7-c-uni", tag: "Application", front: "Which systems does a university enrollment touch?", back: "The <b>SIS</b> checks prerequisites, reserves the seat and records it; it then tells the <b>LMS</b> to grant course access and sends the enrollment to the <b>ERP</b>/financial system to calculate fees." },
    { id: "k201-ch7-c-through", tag: "Principle", front: "What does “processes flow through systems, not around them” mean?", back: "Each system depends on the handoff from the one before it. The TPS can't reorder on its own, and the SCM doesn't know about a sellout unless the TPS tells it." },
    { id: "k201-ch7-c-silo", tag: "Definition", front: "What is an <em>information silo</em>?", back: "Data trapped in one system that can't easily flow to others. Each department sees its own data and nobody sees the whole picture." },
    { id: "k201-ch7-c-silo7", tag: "List", front: "List the seven challenges information silos create.", back: "Data inconsistency &amp; errors · manual re-entry · no big picture · poor customer experience · high IT maintenance costs · compliance &amp; audit risk · resistance to change." },
    { id: "k201-ch7-c-bigpic", tag: "Example", front: "Give an example of the “no big picture” silo problem.", back: "Sales celebrates record orders without seeing that the warehouse is almost out of the best seller. Or finance learns a major customer is 60 days overdue only after the next order has shipped." },
    { id: "k201-ch7-c-bob", tag: "Definition", front: "What is the <em>best-of-breed</em> approach, and its main tradeoff?", back: "Buy the top-rated product for each function. Each tool may be strongest in its area, but integration is complex, expensive and often imperfect." },
    { id: "k201-ch7-c-suite", tag: "Definition", front: "What is the <em>integrated suite</em> approach, and its main tradeoff?", back: "One vendor's ERP for every function: seamless data flow, single-vendor support and lower integration cost, but no module is best-in-class everywhere and you depend on one vendor." },
    { id: "k201-ch7-c-hybrid", tag: "Definition", front: "What is a <em>hybrid</em> approach, and what is an API?", back: "A core ERP plus specialized tools where needed, connected through <b>APIs</b> (application programming interfaces: standard ways for programs to request and send data to each other) or other integration methods." },
    { id: "k201-ch7-c-dims", tag: "List", front: "On which dimensions should integration approaches be compared?", back: "Functionality · integration · cost · flexibility · implementation risk · vendor dependence." },
    { id: "k201-ch7-c-recommend", tag: "Principle", front: "How do you develop and defend an integration recommendation?", back: "Map the current systems and the data they share, identify key requirements and constraints, pick the approach whose tradeoffs fit, justify the future state, and <b>revise it when requirements change</b>." },
    { id: "k201-ch7-c-human", tag: "List", front: "Name five human and organizational factors in integration.", back: "Process redesign · data ownership · training · change management · human validation." },
    { id: "k201-ch7-c-owner", tag: "Why", front: "Why does data ownership matter in an integrated system?", back: "Shared data needs someone accountable for its accuracy and definitions, and a rule for whose record wins when copies conflict. Otherwise everybody's data turns out to be nobody's responsibility." },
    { id: "k201-ch7-c-validate", tag: "Example", front: "Give an example of human validation in an integrated system.", back: "A planner reviews auto-generated purchase orders before they go out, or finance reconciles migrated balances against the old ledger before switching over." },
    { id: "k201-ch7-c-recs", tag: "Application", front: "How does a retailer's “you might also like” engine work?", back: "It combines <b>CRM</b> customer data with purchase history, browsing behavior and product data, using analytics and personalization tools. It is not CRM alone." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "Customer history, complaints, campaigns, deals in the pipeline, “who might leave?”", think: "CRM", why: "Relationship data about current and potential customers." },
    { when: "Forecast, supplier, stock in warehouses, shipping routes, “where will the parts come from?”", think: "SCM", why: "The flow of goods, information and money up to the buyer." },
    { when: "General ledger, payroll, one set of books, “one order updates everything”", think: "ERP", why: "Integrated core processes on one shared database." },
    { when: "“Enter once, available everywhere”, “no re-keying”", think: "ERP integration", why: "ERP's defining characteristic." },
    { when: "What-if, compare alternatives, dashboard, trend report", think: "Decision support (DSS)", why: "Uses operational data to analyze. It doesn't capture transactions." },
    { when: "“The system recommends…” plus a storm, glitch or unrecorded deal", think: "Human judgment: pause or adjust", why: "A DSS doesn't replace judgment; data and assumptions can fail." },
    { when: "Two departments' reports disagree", think: "Silos / different data versions", why: "Disconnected systems start from different copies of the data." },
    { when: "“In what order do the systems act?” “What flows between them?”", think: "Systems map", why: "Boxes, arrows and sequence show the data's path." },
    { when: "Steps a clerk follows, decision diamonds for a person", think: "Flowchart, not a systems map", why: "A flowchart shows a person's task steps; a map shows where data goes." },
    { when: "Retyping, copying between screens, re-keying orders", think: "Silo: manual re-entry", why: "Slow, costly and a source of errors." },
    { when: "Staff keep private spreadsheets, “it works for us”", think: "Silo: resistance to change", why: "The barrier is human, so it needs leadership, communication and training." },
    { when: "“Top-rated tool for each function”", think: "Best-of-breed", why: "Strong per function, but integration is complex and costly." },
    { when: "“One vendor for everything”, “one number to call”", think: "Integrated suite", why: "Seamless data flow, but vendor dependence and uneven modules." },
    { when: "“Keep the ERP, plug in a specialized tool via APIs”", think: "Hybrid", why: "Core suite plus targeted best-of-breed through integration methods." },
    { when: "Old paper steps copied into new software", think: "Process redesign needed", why: "Automating a bad process keeps it bad." },
  ];

  /* ============================================================
   * TOPIC 1 · ENTERPRISE SYSTEM CHARACTERISTICS
   * ============================================================ */
  const TRAIT_BANK = [
    { cat: "Organization-wide", t: "The same platform is used by the plants in Ohio and Mexico, the head office and every sales branch.", why: "It reaches every location and department rather than one team." },
    { cat: "Organization-wide", t: "Purchasing, HR, finance and sales all log in to the same system for their daily work.", why: "Its scope covers all of the organization's functions." },
    { cat: "Organization-wide", t: "Suppliers log in to a portal connected to the company's system to confirm delivery dates.", why: "Enterprise systems can reach beyond company walls to partners. That's scope, not just data sharing." },
    { cat: "Organization-wide", t: "A hospital network runs one system across its five hospitals and twenty clinics instead of one per site.", why: "One system spanning every site shows organization-wide scope." },
    { cat: "Organization-wide", t: "Employees from the loading dock to the executive suite use the system in their everyday jobs.", why: "Use across every level and area of the firm is what organization-wide means." },
    { cat: "Integrated", t: "When a sales rep enters an order, the warehouse sees it immediately without anyone retyping it.", why: "Functions share one record through connected processes instead of passing copies." },
    { cat: "Integrated", t: "Finance's revenue figures come straight from the same order records sales uses.", why: "Shared data, not separate copies, is the heart of integration." },
    { cat: "Integrated", t: "A customer's address is changed once, and every authorized department sees the new address.", why: "One shared record updated once means the data is integrated." },
    { cat: "Integrated", t: "Shipping and billing look at one shared record of each order rather than their own copies.", why: "No isolated copies: the two functions work from the same data." },
    { cat: "Integrated", t: "Approving a vendor invoice automatically updates the payables balance the CFO watches.", why: "An action in one function flows straight into another's data." },
    { cat: "Scalable", t: "After the company doubled its number of stores, the system handled twice the transactions without being replaced.", why: "Growing with volume without replacement is scalability." },
    { cat: "Scalable", t: "A new distribution center was added in weeks by configuring the system, not by buying new software.", why: "Adding locations without a new platform shows it scales." },
    { cat: "Scalable", t: "The system kept up when holiday orders jumped to five times the normal daily volume.", why: "Handling much larger loads is scalability." },
    { cat: "Scalable", t: "After an acquisition, 2,000 new employees needed only user accounts, not a new platform.", why: "Absorbing many more users without replacement is scalability." },
    { cat: "Scalable", t: "The firm switches on extra capacity for its cloud-hosted system ahead of the busy season.", why: "Capacity that grows with demand is scalability." },
    { cat: "Process-oriented", t: "Every purchase follows the same steps (request, approval, purchase order, receipt, payment) whichever office starts it.", why: "Standard, repeatable steps define process orientation." },
    { cat: "Process-oriented", t: "The system is organized around order-to-cash and procure-to-pay workflows rather than around departments.", why: "It is built around end-to-end processes that cross departments." },
    { cat: "Process-oriented", t: "A returns request moves through the same sequence of checks no matter which store receives it.", why: "A standardized, repeatable sequence of steps is process orientation." },
    { cat: "Process-oriented", t: "New hires in every region are onboarded with the same repeatable sequence of tasks.", why: "Repeatable standardized work is what process-oriented means." },
    { cat: "Process-oriented", t: "Each step of the hiring workflow hands the record to the next role automatically, in a set order.", why: "Work moves through defined steps in sequence, which makes it process-oriented." },
  ];
  const TRAIT_DEFS = {
    "Organization-wide": "reaches across departments, locations and even partner companies",
    "Integrated": "functions share data through connected processes, not isolated copies",
    "Scalable": "grows with users, volume and locations without being replaced",
    "Process-oriented": "work follows standard, repeatable steps across functions",
  };
  const TRAIT_CONCEPT = [
    {
      q: "In Chapter 3, “EIS” stood for executive information system. A Chapter 7 question asks how an EIS “supports and integrates core business processes across the entire organization.” Which meaning applies?",
      right: "Enterprise information system: organization-wide software that integrates processes and data",
      rightWhy: "Integrating core processes across the whole organization is the enterprise meaning used in this chapter.",
      wrong: [
        { t: "Executive information system: summary dashboards for top managers", why: "An executive IS summarizes information for senior leaders. It doesn't run and integrate the organization's core processes." },
        { t: "Both, because the two abbreviations name the same system", why: "They are different systems that happen to share initials. Context decides which one is meant." },
        { t: "Electronic invoice system: software for billing customers", why: "That isn't a course term, and billing is only one process, not the whole organization." },
      ],
      sol: ["Same initials, different systems. Look at what the question says the EIS does.", "Supporting and integrating core processes across the entire organization describes an <b>enterprise</b> information system."],
    },
    {
      q: "A company runs a CRM from one vendor and an ERP from another. The two are linked so both always show the same customer and order data. Is this an enterprise environment?",
      right: "Yes: an enterprise environment can be several connected systems if together they give one consistent view",
      rightWhy: "The chapter allows a single suite or several connected systems, as long as the data view is shared and consistent.",
      wrong: [
        { t: "No: only a single suite from one vendor counts", why: "Integration is about shared, consistent data, not about buying everything from one vendor." },
        { t: "No: a CRM can never be part of an enterprise system", why: "CRM is one of the main enterprise applications in this chapter." },
        { t: "Yes, but only if every department uses identical screens", why: "Departments can have different screens. What matters is that they share consistent data." },
      ],
      sol: ["Ask what makes an environment “enterprise”: scope and integration, not the number of vendors.", "Connected systems that give a consistent view qualify, so the answer is yes."],
    },
    {
      q: "Which situation is the clearest sign that a company does <b>not</b> yet have an integrated enterprise system?",
      right: "Sales and accounting each keep their own customer list and reconcile them by hand every month",
      rightWhy: "Separate copies that must be reconciled by hand are the opposite of integration.",
      wrong: [
        { t: "The same platform is used at every location", why: "That is a sign of organization-wide scope, which enterprise systems have." },
        { t: "Purchases follow the same approval steps in every office", why: "Standard repeatable steps show process orientation, an enterprise trait." },
        { t: "The system absorbed a doubling in order volume without replacement", why: "That shows scalability, an enterprise trait." },
      ],
      sol: ["Look for isolated copies of the same data.", "Two departments each holding their own customer list and reconciling by hand means the data is not shared: no integration."],
    },
    {
      q: "Why are enterprise systems designed to be <b>process-oriented</b>?",
      right: "Business work such as order-to-cash crosses departments, and standard repeatable steps let each function hand off reliably",
      rightWhy: "Processes cut across departments; standardizing them is what lets work and data flow end to end.",
      wrong: [
        { t: "So each department can design its own unique steps", why: "That is the opposite: process orientation standardizes steps across the organization." },
        { t: "Because processes matter more than data, so data need not be shared", why: "Process orientation and integration go together; shared data is still essential." },
        { t: "Because it means the system runs on faster hardware", why: "Process orientation is about how work is organized, not about hardware speed." },
      ],
      sol: ["Think about how real work moves: an order touches sales, the warehouse and finance.", "Standard, repeatable cross-functional steps make those handoffs dependable, which is why enterprise systems are built around processes."],
    },
    {
      q: "A 12-person bakery keeps all orders on one shared spreadsheet, and the owner calls it “our enterprise system.” What is the best critique?",
      right: "Shared access isn't integration: it lacks connected processes across functions and the ability to scale",
      rightWhy: "Being open to everyone doesn't give you connected processes, standard workflows or room to grow.",
      wrong: [
        { t: "Small businesses can never use enterprise systems", why: "Company size isn't the test. Small firms can and do run cloud ERPs. The test is scope, integration, scalability and process orientation." },
        { t: "It is an enterprise system because everyone can open the file", why: "Access alone isn't integration. Nothing connects the spreadsheet to purchasing, payroll or accounting." },
        { t: "It is an ERP because it contains order data", why: "Holding orders doesn't make something an ERP. ERP integrates many core processes on shared data." },
      ],
      sol: ["Run the four traits as a checklist: organization-wide, integrated, scalable, process-oriented.", "One shared spreadsheet fails integration (no connected processes) and scalability, so it's a tool, not an enterprise system."],
    },
  ];
  const TRAIT_TF = [
    { s: "An enterprise system can span more than one company, for example by connecting a manufacturer with its suppliers.", truth: true, why: "Enterprise systems can reach across departments, locations and even company boundaries." },
    { s: "An enterprise environment must be a single software product from a single vendor.", truth: false, why: "It can be one integrated suite or several connected systems that give a consistent shared view." },
    { s: "Integration means authorized functions work from shared data rather than their own isolated copies.", truth: true, why: "That is exactly the chapter's meaning of integrated." },
    { s: "“Scalable” means the system is only suitable for very large companies.", truth: false, why: "Scalable means it can grow with users, volume and locations without replacement. It says nothing about a minimum size." },
    { s: "In K201, “EIS” can mean either executive or enterprise information system, so the context decides.", truth: true, why: "Chapter 3 used it for executive information systems; Chapter 7 uses it for enterprise information systems." },
    { s: "A system used only by the marketing department is organization-wide as long as it is large.", truth: false, why: "Organization-wide is about scope across the organization, not the size of one department's system." },
  ];

  const traitsGen = STUDY.makeGenerator({
    id: "k201-ch7-traits",
    name: "Enterprise system characteristics",
    blurb: "Recognize the four traits of an enterprise system and what does (and doesn't) make a system “enterprise.”",
    variants: [
      ...K.sortVariants({ key: "ch7-traits", bank: TRAIT_BANK, cats: Object.keys(TRAIT_DEFS), defs: TRAIT_DEFS, ask: "description",
        hint: "Ask what the description mainly shows: how far the system reaches, whether data is shared instead of copied, whether it grows without replacement, or whether work follows standard steps." }),
      K.conceptVariant("Explain the idea", "ch7-traits", TRAIT_CONCEPT),
      K.tfVariant("True or false", "ch7-traits", TRAIT_TF),
    ],
  });

  /* ============================================================
   * TOPIC 2 · CRM VS SCM VS ERP
   * ============================================================ */
  const SYS_BANK = [
    { cat: "CRM", t: "“Which customers haven't bought anything in six months and may be about to leave?”", why: "Spotting at-risk customers uses relationship and purchase history, a CRM retention question." },
    { cat: "CRM", t: "“How many deals are in the pipeline, and what revenue do they forecast this quarter?”", why: "Sales pipeline tracking is a core CRM function." },
    { cat: "CRM", t: "Logging every call, email and complaint so any agent can see a customer's full history", why: "Contact management and service history in one place is CRM." },
    { cat: "CRM", t: "Running an email campaign to customers who bought hiking boots and measuring who clicks", why: "Marketing automation (plan, run, measure campaigns) is a CRM function." },
    { cat: "CRM", t: "A large bank asks: “Which mortgage customers also hold our credit card but no savings account?”", why: "Cross-selling from the full customer relationship is CRM territory." },
    { cat: "CRM", t: "A large bank asks: “How fast are complaints about the mobile app being resolved?”", why: "Tracking service tickets to resolution is CRM customer service & support." },
    { cat: "CRM", t: "“Why did we lose the last five large deals to a competitor?”", why: "Analyzing where sales are won or lost is a CRM data-driven-decision benefit." },
    { cat: "CRM", t: "Tracking which selling stage each sales opportunity has reached", why: "Pipeline stages are CRM sales tracking." },
    { cat: "SCM", t: "“How many units of each product should we expect to sell next month in each region?”", why: "Demand forecasting is the first core SCM function." },
    { cat: "SCM", t: "“Which supplier could replace our main chip vendor if its factory shuts down?”", why: "Procurement and supply-risk planning are SCM." },
    { cat: "SCM", t: "“How much of each item is sitting in each warehouse and distribution center?”", why: "Inventory management across warehouses is SCM." },
    { cat: "SCM", t: "Choosing truck routes and carriers for last-mile delivery", why: "Logistics & distribution is a core SCM function." },
    { cat: "SCM", t: "A large bank asks: “Which vendor supplies our ATM cash-handling parts, and are branch deliveries on schedule?”", why: "Even a bank has a supply chain for physical goods; sourcing and delivery are SCM." },
    { cat: "SCM", t: "Tracing which farm a contaminated lettuce shipment came from", why: "Traceability back through the chain is an SCM benefit." },
    { cat: "SCM", t: "“Should we hold less safety stock to free up cash tied up in inventory?”", why: "Lowering inventory costs is a classic SCM question." },
    { cat: "ERP", t: "“What is our consolidated profit across all divisions this quarter, from one set of books?”", why: "Company-wide financials from one ledger come from ERP financial management." },
    { cat: "ERP", t: "Entering a sales order once and having inventory, production schedule and financial forecast all update", why: "Enter-once, update-everywhere integration is ERP's defining characteristic." },
    { cat: "ERP", t: "Running payroll and keeping employee records in the same system finance uses", why: "HR and finance modules on one shared database is ERP." },
    { cat: "ERP", t: "A large bank produces one auditable general ledger across 400 branches for regulators", why: "A single auditable system of record supports ERP's compliance benefit." },
    { cat: "ERP", t: "A large bank asks: “What are total personnel costs by branch, combining HR and finance data?”", why: "Combining HR and financial data across the organization is an ERP question." },
    { cat: "ERP", t: "Replacing separate accounting, HR and purchasing programs that each have their own database", why: "Consolidating core functions into one unified system is what ERP does." },
    { cat: "ERP", t: "Tracking a construction project's budget, assigned staff and costs to date in one place", why: "Project management is an ERP module tied to finance and HR data." },
  ];
  const SYS_DEFS = {
    CRM: "manages relationships and interactions with current and potential customers",
    SCM: "coordinates products, information and money from raw materials to the final customer",
    ERP: "runs the organization's core processes in one unified system with shared data",
  };
  const BENEFITS = [
    { sys: "CRM", t: "Agents spot customers likely to leave and offer them a reason to stay.", why: "That is improved customer retention, a CRM benefit." },
    { sys: "CRM", t: "Reps spend less time hunting for information and more time selling.", why: "That is increased sales efficiency, a CRM benefit." },
    { sys: "CRM", t: "Each customer receives offers tailored to their interests.", why: "That is personalized marketing, a CRM benefit." },
    { sys: "CRM", t: "Marketing, sales and service finally work from the same view of each customer.", why: "That is cross-department alignment around the customer, a CRM benefit." },
    { sys: "SCM", t: "Cash that was tied up in excess stock is freed for other uses.", why: "That is lower inventory costs, an SCM benefit." },
    { sys: "SCM", t: "When a port closes, the company finds an alternate supplier and reroutes within days.", why: "That is reduced supply-chain risk and greater flexibility, SCM benefits." },
    { sys: "SCM", t: "Every unit on the shelf can be traced back to its source batch.", why: "That is better traceability, an SCM benefit." },
    { sys: "SCM", t: "Goods move from supplier to customer with fewer delays and less wasted effort.", why: "That is faster delivery and improved supply-chain efficiency, SCM benefits." },
    { sys: "ERP", t: "Finance and operations stop arguing over whose numbers are right.", why: "That is a single source of truth, an ERP benefit." },
    { sys: "ERP", t: "Auditors can follow every transaction within one system.", why: "That is easier regulatory compliance from one auditable system, an ERP benefit." },
    { sys: "ERP", t: "Managers see the up-to-date status of every department on shared data.", why: "That is improved visibility across functions, an ERP benefit." },
    { sys: "ERP", t: "Data typed once no longer has to be re-keyed in finance, HR and purchasing.", why: "That is operational efficiency from integration, an ERP benefit." },
  ];
  const SYS_CONCEPT = [
    {
      q: "The retail chief at a large bank asks: “Which branch customers are most likely to close their accounts next quarter?” Where should the analysis start?",
      right: "CRM data: relationship history, interactions and complaints",
      rightWhy: "Predicting who will leave relies on relationship data, which is CRM's retention focus.",
      wrong: [
        { t: "SCM data: supplier and inventory records", why: "SCM tracks the flow of goods. Customer attrition is a relationship question." },
        { t: "ERP general ledger: account balances only", why: "Balances help, but interactions, complaints and relationship history live in CRM." },
        { t: "A DSS alone, with no operational data", why: "A DSS analyzes data but needs operational data to work with, and customer relationship data comes from CRM." },
      ],
      sol: ["Ask whether the question is about customers, goods or internal core processes.", "Customers likely to leave → relationship and interaction data → CRM."],
    },
    {
      q: "The same bank's CFO asks: “What was net income across all regions, reported from one set of auditable books?” Which system answers it?",
      right: "ERP (financial management on one shared ledger)",
      rightWhy: "Consolidated, auditable financials across the organization are ERP's single source of truth.",
      wrong: [
        { t: "CRM", why: "CRM manages customer relationships, not the general ledger." },
        { t: "SCM", why: "SCM covers sourcing and delivery of goods, not consolidated income reporting." },
        { t: "Each region's own ledger, consolidated by spreadsheet", why: "That is the silo approach: error-prone, slow and hard to audit." },
      ],
      sol: ["Key words: net income, all regions, one set of books, auditable.", "That is ERP financial management, the one auditable system of record."],
    },
    {
      q: "A retailer's site shows “customers like you also bought…” recommendations. Which description is most accurate?",
      right: "CRM customer data combined with purchase history, browsing behavior and product data through analytics/personalization tools",
      rightWhy: "Recommendation engines blend CRM data with other data sources and analytics tools.",
      wrong: [
        { t: "A pure SCM function that predicts inventory needs", why: "Forecasting stock is SCM, but recommendations are about the individual customer's interests." },
        { t: "A feature of the ERP general ledger", why: "The ledger records financial transactions, not shopper preferences." },
        { t: "CRM contact records alone, with no other data", why: "Contact records aren't enough; browsing and product data plus analytics are needed too." },
      ],
      sol: ["Recommendations need to know the customer <em>and</em> the products <em>and</em> what similar customers did.", "So it's CRM data + purchase history + browsing + product data, run through analytics/personalization tools."],
    },
    {
      q: "An electronics maker's key chip supplier has a factory flood. Which system is built to flag this early and help find alternate sources?",
      right: "SCM",
      rightWhy: "Spotting disruptions, finding alternate suppliers and rerouting are SCM risk and flexibility benefits.",
      wrong: [
        { t: "CRM", why: "CRM looks at customers, not suppliers." },
        { t: "The HR module of the ERP", why: "HR handles employees, not supply disruptions." },
        { t: "A flowchart of the purchasing clerk's steps", why: "A flowchart documents a person's task. It doesn't monitor suppliers." },
      ],
      sol: ["Who is affected first: customers, employees or the supply of parts?", "Supply disruption → SCM (procurement, risk, flexibility)."],
    },
    {
      q: "A customer calls to complain that the blender delivered yesterday is the wrong color. Where does the complaint ticket belong?",
      right: "CRM customer service & support, as part of the customer's history",
      rightWhy: "Complaints and tickets tracked to resolution are CRM service functions.",
      wrong: [
        { t: "SCM, because the product was shipped", why: "SCM may handle the physical return, but the complaint and the relationship record belong in CRM." },
        { t: "ERP accounts payable", why: "Accounts payable is money the company owes suppliers, not customer complaints." },
        { t: "Nowhere: complaints are informal and shouldn't be recorded", why: "Untracked complaints are exactly what CRM exists to prevent." },
      ],
      sol: ["Separate the goods (which may flow back through SCM returns) from the relationship.", "The complaint itself is a service ticket in the customer's history → CRM."],
    },
    {
      q: "A firm's ERP includes a supply-chain module and a customer-service module. Does it ever need a separate CRM or SCM?",
      right: "Possibly: ERP modules cover core needs, but firms may add specialized CRM or SCM tools for deeper functionality",
      rightWhy: "Suites are rarely best-in-class everywhere, which is why hybrid designs exist.",
      wrong: [
        { t: "Never: ERP modules are always best-in-class", why: "No vendor's modules are best in every function. That's the integrated suite's main tradeoff." },
        { t: "Always: ERP can't hold any customer or supply data", why: "ERP does include supply-chain and customer-service modules." },
        { t: "No, because CRM and SCM are just old names for ERP modules", why: "CRM and SCM are distinct enterprise applications with their own focus." },
      ],
      sol: ["Recall the integration dilemma: suites trade some functionality for seamless data.", "So a firm may keep the ERP core and add a specialized CRM or SCM where it needs more."],
    },
  ];
  const SYS_TF = [
    { s: "CRM's philosophy treats customers as among the organization's most valuable assets.", truth: true, why: "That is the stated philosophy behind CRM." },
    { s: "SCM is mainly concerned with what happens after the customer has received the product.", truth: false, why: "SCM covers sourcing through delivery to the buyer. After-sale relationships are CRM's focus (returns are SCM's reverse-flow exception)." },
    { s: "ERP's defining characteristic is that data entered once is available to every function that needs it.", truth: true, why: "Integration (enter once, share everywhere) defines ERP." },
    { s: "Because a bank sells no physical products, CRM is the only enterprise system it can use.", truth: false, why: "Banks run ERP for finance and HR and still buy and move physical goods (ATM parts, cards), which is SCM." },
    { s: "Demand forecasting and procurement are both core SCM functions.", truth: true, why: "Both are on the SCM list along with production planning, inventory, logistics and returns." },
    { s: "Sales pipeline tracking is an SCM function because it involves the flow of orders.", truth: false, why: "Tracking deals in progress and forecasting revenue is a CRM function." },
  ];

  const sysGen = STUDY.makeGenerator({
    id: "k201-ch7-crmscmerp",
    name: "CRM vs. SCM vs. ERP",
    blurb: "Match functions, benefits and managerial questions to the system that handles them.",
    variants: [
      ...K.sortVariants({ key: "ch7-sys", bank: SYS_BANK, cats: ["CRM", "SCM", "ERP"], defs: SYS_DEFS, ask: "question or task",
        hint: "CRM faces the customer (relationships, sales, service, marketing). SCM follows the goods (forecast, buy, stock, ship). ERP ties internal core processes together on shared data (finance, HR, one order updating everything)." }),
      {
        name: "Which benefit, which system?",
        make() {
          const b = U.deal("ch7-benefit", BENEFITS, 1)[0];
          const co = U.pick(COMPANIES);
          const others = ["CRM", "SCM", "ERP"].filter(x => x !== b.sys);
          return Q.mc({
            q: `<p>A year after a new system went live at <b>${co}</b>, the project review reports this result:</p><blockquote>${b.t}</blockquote><p>Which system most directly delivers this benefit?</p>`,
            right: b.sys, rightWhy: b.why,
            wrong: others.map(o => ({ t: o, why: `${o} ${SYS_DEFS[o]}. ${b.why}` })),
            keepOrder: ["CRM", "SCM", "ERP"],
            sol: S("Recall each system's benefit list: CRM = retention, sales efficiency, personalization, service, alignment; SCM = inventory cost, speed, risk, flexibility, traceability; ERP = single source of truth, efficiency, visibility, compliance, scalability.",
              `${b.why} So the answer is <b>${b.sys}</b>.`),
          });
        },
      },
      K.conceptVariant("Edge cases and large-bank questions", "ch7-sys", SYS_CONCEPT),
      K.tfVariant("True or false", "ch7-sys", SYS_TF),
    ],
  });

  /* ============================================================
   * TOPIC 3 · ERP MODULES AND INTEGRATION
   * ============================================================ */
  const MODULES = {
    "Financial management": "general ledger, payables/receivables, reporting, budgeting",
    "Human resources": "payroll, employee records, performance, recruiting",
    "Manufacturing": "production planning, quality control, shop-floor scheduling",
    "Supply chain": "procurement, inventory, warehouse management, logistics",
    "Sales & distribution": "order management, pricing, shipping, invoicing",
    "Project management": "project planning, resource allocation, cost tracking",
    "Customer service": "service contracts, field service, returns",
  };
  const MOD_TASKS = [
    { m: "Financial management", t: "Posting a journal entry to the general ledger" },
    { m: "Financial management", t: "Paying a supplier's invoice out of accounts payable" },
    { m: "Financial management", t: "Preparing next year's departmental budgets" },
    { m: "Financial management", t: "Recording a customer's payment against accounts receivable" },
    { m: "Human resources", t: "Running the biweekly payroll" },
    { m: "Human resources", t: "Recording an employee's annual performance review" },
    { m: "Human resources", t: "Posting a job opening and tracking applicants" },
    { m: "Manufacturing", t: "Scheduling which machine runs which job on the shop floor" },
    { m: "Manufacturing", t: "Recording quality-control inspection results for a batch" },
    { m: "Manufacturing", t: "Planning how many units each production line makes next week" },
    { m: "Supply chain", t: "Issuing a purchase order to a raw-material supplier" },
    { m: "Supply chain", t: "Tracking stock levels and bin locations in the warehouse" },
    { m: "Supply chain", t: "Arranging transfers of stock between two warehouses" },
    { m: "Sales & distribution", t: "Entering a customer's order for 40 cases" },
    { m: "Sales & distribution", t: "Applying the customer's contract price and volume discount to an order" },
    { m: "Sales & distribution", t: "Generating the customer's invoice for a shipped order" },
    { m: "Project management", t: "Assigning engineers to a client implementation project" },
    { m: "Project management", t: "Comparing a project's costs to date against its budget" },
    { m: "Project management", t: "Planning the milestones of an office-renovation project" },
    { m: "Customer service", t: "Renewing a customer's annual equipment service contract" },
    { m: "Customer service", t: "Dispatching a field technician to repair installed equipment" },
    { m: "Customer service", t: "Processing a warranty return of a faulty unit" },
  ];
  const MOD_HINT = "Ask what kind of work it is: money (finance), people (HR), making things (manufacturing), getting and storing materials (supply chain), selling and billing (sales & distribution), running projects, or after-sale service.";
  const modList = () => ul(Object.keys(MODULES).map(m => `<b>${m}</b>: ${MODULES[m]}`));

  const ORDER_EVENTS = [
    { co: "Limestone Furniture Co.", item: "oak dining chairs", qty: 300, raw: "oak lumber" },
    { co: "Cardinal Cycle Works", item: "commuter bikes", qty: 120, raw: "aluminum frame tubing" },
    { co: "Brown County Candles", item: "gift-box candle sets", qty: 2500, raw: "soy wax" },
    { co: "Wabash Hardware", item: "steel shelving units", qty: 800, raw: "rolled steel" },
    { co: "Crimson Office Products", item: "ergonomic desks", qty: 450, raw: "laminate panels" },
  ];
  const ERP_BENCOST = [
    { cat: "Benefit", t: "Every department reads the same customer and product records", why: "A single source of truth is an ERP benefit." },
    { cat: "Benefit", t: "Orders are processed without being retyped into other systems", why: "Operational efficiency from entering data once." },
    { cat: "Benefit", t: "Managers can see status across sales, production and finance at once", why: "Improved visibility is an ERP benefit." },
    { cat: "Benefit", t: "Auditors trace transactions within one system", why: "One auditable system eases regulatory compliance." },
    { cat: "Benefit", t: "New plants and offices are added without replacing the core system", why: "Scalability is an ERP benefit." },
    { cat: "Benefit", t: "Service reps answer order-status questions on the first call", why: "Better customer service comes from shared, current data." },
    { cat: "Cost or risk", t: "Converting years of old records into the new system's format", why: "Data conversion is a major part of an ERP's real cost." },
    { cat: "Cost or risk", t: "Teaching every employee new screens and procedures", why: "Training takes time and money and is part of the implementation cost." },
    { cat: "Cost or risk", t: "Rethinking business processes so they fit the new system", why: "Process redesign is effort the firm must invest." },
    { cat: "Cost or risk", t: "Weeks of testing before go-live", why: "Testing is a necessary implementation cost." },
    { cat: "Cost or risk", t: "Payoff that depends on user adoption and data governance", why: "Benefits aren't automatic; poor adoption or governance is a real risk." },
    { cat: "Cost or risk", t: "Managing employee resistance to giving up familiar tools", why: "Change management is part of the cost and a common risk." },
  ];
  const ERP_CONCEPT = [
    {
      q: "A growing manufacturer replaces production spreadsheets, a separate accounting package and a standalone HR program with one ERP. What is the most direct improvement?",
      right: "Each piece of data is entered once and shared, so departments stop reconciling conflicting copies",
      rightWhy: "Single entry and shared data, a single source of truth, is ERP's core benefit.",
      wrong: [
        { t: "Employees become more productive automatically, with no training", why: "Training is one of ERP's real costs; productivity doesn't come automatically." },
        { t: "The company no longer needs to redesign any processes", why: "Process redesign is usually part of an ERP implementation, not something it removes." },
        { t: "Data-quality problems vanish regardless of governance", why: "Benefits depend on data governance; bad data stays bad in a new system." },
      ],
      sol: ["What did the old setup lack? Shared data. Each program had its own database.", "ERP gives one shared database, so data is entered once and the reconciling stops."],
    },
    {
      q: "Two firms install the same ERP product. One reports large gains; the other sees little change. What best explains the difference?",
      right: "ERP results depend on implementation quality, user adoption, data governance and alignment with the business",
      rightWhy: "The chapter stresses that ERP benefits are not automatic.",
      wrong: [
        { t: "The second firm must have installed a different version", why: "Same product, different results is usually about people, processes and data, not the version." },
        { t: "ERP benefits are automatic, so the second firm must be misreporting", why: "Benefits are not automatic. That is exactly the point." },
        { t: "The larger firm always gains more", why: "Size doesn't decide it; implementation and adoption do." },
      ],
      sol: ["Remember the cost side of ERP: conversion, training, redesign, testing, change management.", "How well those are done (and whether people adopt the system) decides the payoff."],
    },
    {
      q: "Why is “regulatory compliance” listed as an ERP benefit?",
      right: "One auditable system records transactions consistently, making reliable reports and audit trails easier to produce",
      rightWhy: "A single system of record simplifies audits and reporting.",
      wrong: [
        { t: "ERP vendors become legally responsible for the client's compliance", why: "The company remains responsible; ERP only makes compliance easier." },
        { t: "ERP hides sensitive transactions from auditors", why: "The opposite: it makes transactions easier to trace." },
        { t: "Compliance only concerns the HR module", why: "Financial reporting rules are a central compliance concern, and they span modules." },
      ],
      sol: ["Think about what an auditor needs: a complete, consistent trail.", "One integrated system provides that trail far more easily than scattered silos."],
    },
    {
      q: "What does <b>single source of truth</b> mean in an ERP?",
      right: "There is one authoritative version of each data item that every function uses",
      rightWhy: "No conflicting copies, so everyone works from the same facts.",
      wrong: [
        { t: "One employee does all the data entry", why: "It describes the data, not who types it." },
        { t: "Only the CEO can see the data", why: "Authorized users across functions see the same data; that's the point." },
        { t: "The system keeps only one year of history", why: "It's about having one version, not one year." },
      ],
      sol: ["“Source of truth” refers to which copy of the data is authoritative.", "In ERP there is one copy, shared by all functions."],
    },
  ];
  const ERP_TF = [
    { s: "In an ERP, one sales order can update inventory, trigger purchasing, schedule production and adjust the financial forecast without re-entry.", truth: true, why: "That ripple effect is the chapter's central picture of ERP integration." },
    { s: "Once an ERP is installed, its benefits arrive automatically whatever the data quality or user adoption.", truth: false, why: "Benefits depend on implementation quality, adoption, data governance and alignment." },
    { s: "Data conversion, training and process redesign are part of the real cost of an ERP.", truth: true, why: "Those, plus testing and change management, are why ERP takes significant time and money." },
    { s: "In an ERP, each department keeps its own database and emails files to the others.", truth: false, why: "That describes silos. ERP replaces separate databases with one unified system." },
    { s: "ERP data is often available to other functions in real time or near real time.", truth: true, why: "Data entered once is shared quickly with every function that needs it." },
    { s: "The human resources module of an ERP is where the general ledger and budgeting live.", truth: false, why: "General ledger and budgeting belong to financial management; HR covers payroll, records, performance and recruiting." },
  ];
  const erpBC = K.sortVariants({ key: "ch7-erpbc", bank: ERP_BENCOST, cats: ["Benefit", "Cost or risk"], ask: "item",
    defs: { "Benefit": "a payoff the ERP delivers once it is working", "Cost or risk": "effort, expense or uncertainty the firm must take on to get there" },
    hint: "Is this something the firm <em>gets</em> from a working ERP, or something it must <em>spend or risk</em> to implement one?" });

  const erpGen = STUDY.makeGenerator({
    id: "k201-ch7-erp",
    name: "ERP modules and integration",
    blurb: "Place tasks in ERP modules, trace what one sales order updates, and weigh ERP's benefits against its costs.",
    variants: [
      {
        name: "Which module?",
        make() {
          const task = U.deal("ch7-mod", MOD_TASKS, 1)[0];
          const wrongMods = U.sample(Object.keys(MODULES).filter(m => m !== task.m), 3);
          return Q.mc({
            q: `<p>In an ERP, which module handles this task?</p><blockquote>${task.t}</blockquote>`,
            right: task.m, rightWhy: `${task.m} covers ${MODULES[task.m]}.`,
            wrong: wrongMods.map(m => ({ t: m, why: `${m} covers ${MODULES[m]}. This task belongs to ${task.m}.` })),
            sol: S(MOD_HINT, `The seven modules:${modList()}`, `“${task.t}” is <b>${task.m}</b> work.`),
          });
        },
      },
      {
        name: "Sort tasks into modules",
        make() {
          const mods = U.sample(Object.keys(MODULES), 3);
          const items = U.shuffle(mods.flatMap(m => U.sample(MOD_TASKS.filter(x => x.m === m), 2))).slice(0, 5);
          return Q.classify({
            q: `<p>Assign each task to the ERP module that handles it.</p>`,
            cats: mods,
            items: items.map(i => ({ t: i.t, cat: i.m, why: `${i.m} covers ${MODULES[i.m]}.` })),
            sol: S(MOD_HINT, `Module scopes:${ul(mods.map(m => `<b>${m}</b>: ${MODULES[m]}`))}`),
          });
        },
      },
      {
        name: "One order, many updates",
        make() {
          const ev = U.pick(ORDER_EVENTS);
          const TRUE = [
            { t: `The available stock of ${ev.item} is updated in the shared database`, why: "Inventory updates automatically from the order." },
            { t: `A purchase order for ${ev.raw} is triggered if materials run short`, why: "The order can trigger purchasing of raw materials." },
            { t: `Production of the ${ev.item} is scheduled`, why: "Manufacturing scheduling picks up the order." },
            { t: "The financial forecast reflects the expected revenue", why: "Finance sees the order's effect without re-entry." },
            { t: "The customer's invoice can be produced from the same order record", why: "Sales & distribution invoices from the one shared order." },
          ];
          const FALSE = [
            { t: "A warehouse clerk retypes the order into the inventory system", why: "Re-keying is the silo problem ERP removes. Data entered once is shared." },
            { t: "Sales emails finance a spreadsheet so revenue can be updated at month-end", why: "In an ERP, finance reads the same order record, often in near-real time." },
            { t: "Payroll for the sales team is recalculated from the order", why: "Payroll is an HR process. A sales order doesn't trigger it." },
            { t: "The customer must re-enter the shipping address for billing", why: "Billing uses the same customer record; nobody re-enters it." },
            { t: "The order is stored in a separate sales database that production can't read", why: "That describes silos. ERP modules share one database." },
          ];
          const k = U.randInt(2, 4);
          const opts = [...U.sample(TRUE, k).map(o => ({ ...o, ok: true })), ...U.sample(FALSE, 6 - k).map(o => ({ ...o, ok: false }))];
          return Q.multi({
            q: `<p><b>${ev.co}</b> runs an integrated ERP. A sales rep enters an order for <b>${U.fmt(ev.qty)} ${ev.item}</b>. Select <b>every</b> update that happens as a result of entering the order once.</p>`,
            options: opts,
            sol: S("ERP's defining trait: data entered once is available to every function that needs it. Ask whether each option is an automatic ripple of the order or a manual workaround / unrelated process.",
              "A sales order can update inventory, trigger a purchase order for raw materials, schedule production, adjust the financial forecast and feed the invoice. Re-typing, emailed spreadsheets and separate databases are silo behavior, and payroll is unrelated."),
          });
        },
      },
      { ...erpBC[0], name: "Benefit or cost? (sort)" },
      { ...erpBC[2], name: "Benefit or cost? (which is NOT)" },
      K.conceptVariant("Explain ERP's payoff", "ch7-erp", ERP_CONCEPT),
      K.tfVariant("True or false", "ch7-erp", ERP_TF),
    ],
  });

  /* ============================================================
   * TOPIC 4 · DECISION SUPPORT FROM OPERATIONAL DATA
   * ============================================================ */
  const DSS_BANK = [
    { cat: "Capture & coordinate", t: "Recording each item scanned at the checkout", why: "Logging a transaction as it happens is operational (TPS) work." },
    { cat: "Capture & coordinate", t: "Updating stock counts when a pallet is received", why: "Keeping operational records current is capture and coordination." },
    { cat: "Capture & coordinate", t: "Logging a customer's support ticket", why: "CRM captures the interaction as an operational record." },
    { cat: "Capture & coordinate", t: "Posting an invoice to accounts receivable", why: "ERP records the financial transaction." },
    { cat: "Capture & coordinate", t: "Sending a purchase order to a supplier", why: "SCM/ERP coordinates the operational step of buying." },
    { cat: "Capture & coordinate", t: "Saving a new hire's tax forms and pay rate", why: "HR records are operational data captured by the ERP." },
    { cat: "Analyze & decide", t: "A what-if model comparing profit from opening a second warehouse vs. expanding the first", why: "Scenario analysis that compares alternatives is decision support." },
    { cat: "Analyze & decide", t: "A dashboard of weekly sales trends by region", why: "Dashboards summarize operational data to inform decisions." },
    { cat: "Analyze & decide", t: "A report ranking stores by return rate to decide where to investigate", why: "Reports that guide a decision are decision support." },
    { cat: "Analyze & decide", t: "Estimating how a 10% fuel-price rise would change delivery costs", why: "What-if scenario analysis is a decision-support tool." },
    { cat: "Analyze & decide", t: "Comparing three supplier bids on cost, risk and lead time", why: "Evaluating alternatives is what a DSS helps with." },
    { cat: "Analyze & decide", t: "Using past stockouts to decide next semester's textbook order", why: "Turning recorded history into a decision is decision support." },
  ];
  const DSS_DEFS = {
    "Capture & coordinate": "operational systems (TPS, CRM, SCM, ERP) recording and moving day-to-day transactions",
    "Analyze & decide": "reports, dashboards, scenario analysis and DSS that use that data to compare alternatives",
  };
  const dssSort = K.sortVariants({ key: "ch7-dss", bank: DSS_BANK, cats: Object.keys(DSS_DEFS), defs: DSS_DEFS, ask: "activity",
    hint: "Is the activity <em>recording</em> a business event as it happens, or <em>using</em> recorded data to compare options and decide?" });
  const DECIDE_OPTS = ["Act on the recommendation", "Pause and check the input data", "Adjust for something the model can't see"];
  const DECIDE = [
    { a: 0, s: "The DSS recommends raising the reorder quantity for umbrellas. Its inputs come straight from the integrated ERP, were validated this morning, and the season looks like past years.", why: "Inputs are validated, assumptions hold and nothing unusual is known, so acting is reasonable." },
    { a: 0, s: "The routing tool suggests moving two trucks to the north route. Traffic and order data are current, and the regional manager confirms nothing unusual is coming.", why: "The data are current and a human has checked for exceptions, so the recommendation can be used." },
    { a: 0, s: "A scenario model shows that combining two small warehouses saves 12% with no loss of service. Finance reconciled the cost inputs, and the assumptions match current contracts.", why: "Validated inputs and sound assumptions mean the analysis can support the decision." },
    { a: 1, s: "The dashboard says one store sold 4,000 winter coats yesterday (ten times its best day ever), and IT mentions a duplicate upload last night.", why: "A wildly unusual figure plus a known glitch means the input data must be checked before anyone acts." },
    { a: 1, s: "The sales forecast was built from a spreadsheet exported from the old CRM, while finance's figures come from the ERP, and the two totals differ by 15%.", why: "The analyses start from different versions of the data. Reconcile the inputs first." },
    { a: 1, s: "A recommendation to cut staff at a branch relies on foot-traffic counts, but the branch's door counter has been broken for three weeks.", why: "The input data are known to be bad, so the output can't be trusted until it is fixed." },
    { a: 2, s: "The model recommends cutting bottled-water stock, but a hurricane is forecast to hit the region next week, something the historical data never included.", why: "The data are fine, but the model can't see the coming storm. The manager must adjust for it." },
    { a: 2, s: "The DSS suggests dropping a low-margin customer, but the account manager knows the customer is about to sign a large multi-year contract that isn't in any system yet.", why: "Human knowledge of a condition the model doesn't capture should change the decision." },
    { a: 2, s: "The route optimizer sends trucks over a bridge the city just announced will close for repairs starting tomorrow.", why: "The model's data predate the closure. Judgment must adjust the plan." },
  ];
  const DSS_CONCEPT = [
    {
      q: "Sales reports $4.2M in quarterly revenue; finance reports $3.9M. Sales works in its CRM, finance in a separate accounting package, and orders are re-keyed between them. What is the most likely cause?",
      right: "The two reports start from different versions of the data held in disconnected systems",
      rightWhy: "Disconnected systems give conflicting reports because the analyses begin from different data.",
      wrong: [
        { t: "The reporting tool rounds differently in each department", why: "A $300K gap isn't rounding; it points to different underlying data." },
        { t: "One department is deliberately misreporting", why: "Don't assume bad intent when silos and re-keying fully explain the gap." },
        { t: "Decision-support tools always disagree, so neither number matters", why: "Integrated systems produce consistent reports. The disagreement is a symptom to fix." },
      ],
      sol: ["Look at how data reaches each report: two systems, connected by re-typing.", "Different copies of the data → different results. Integration gives one consistent view."],
    },
    {
      q: "What does an integrated enterprise system add to decision support?",
      right: "A consistent, shared view of operational data, so different reports start from the same numbers",
      rightWhy: "Integration means analyses begin from the same data.",
      wrong: [
        { t: "It makes the decision so managers don't have to", why: "Decision support never replaces managerial judgment." },
        { t: "It removes the need to interpret results", why: "Managers still interpret results and weigh risks and exceptions." },
        { t: "It guarantees forecasts are accurate", why: "Forecasts still depend on data quality and model assumptions." },
      ],
      sol: ["Separate two roles: operational systems supply the data; decision tools analyze it.", "Integration makes the supplied data consistent, which is the foundation for trustworthy reports."],
    },
    {
      q: "Which statement about a decision support system is accurate?",
      right: "It helps managers analyze data and compare alternatives, but they still validate inputs and weigh risks",
      rightWhy: "That is the chapter's definition of a DSS's role.",
      wrong: [
        { t: "It replaces managerial judgment by choosing the best option automatically", why: "A DSS supports judgment; it doesn't replace it." },
        { t: "It records day-to-day transactions such as checkout scans", why: "That's a TPS. A DSS uses recorded data to analyze." },
        { t: "It works best when the input data are incomplete", why: "Recommendations depend on data quality; incomplete data weakens them." },
      ],
      sol: ["Recall the definition: interactive, analyzes, compares alternatives.", "And the caveat: managers validate inputs, interpret results and consider exceptions."],
    },
    {
      q: "A scenario model assumes diesel stays at $3.00 a gallon. Diesel jumps to $4.50. What should the planner do?",
      right: "Update the assumption and rerun the model before relying on its recommendation",
      rightWhy: "Recommendations are only as good as the model's assumptions.",
      wrong: [
        { t: "Keep using the old output because the model was approved", why: "A broken assumption makes the old output unreliable, whoever approved it." },
        { t: "Stop using decision support entirely", why: "The tool is still useful once its assumptions are updated." },
        { t: "Ask IT to re-enter last month's transactions", why: "The transactions aren't the problem; the assumption is." },
      ],
      sol: ["Which of the three DSS dependencies failed: data, assumptions or unseen conditions?", "The fuel assumption is out of date. Update it and rerun."],
    },
    {
      q: "Which of these counts as a decision-support tool in this chapter's sense?",
      right: "A scenario analysis built on operational data",
      rightWhy: "Reports, dashboards and scenario analysis are the decision-support tools named in the chapter.",
      wrong: [
        { t: "The CRM screen where an agent types a customer's new phone number", why: "That captures operational data. It doesn't analyze it." },
        { t: "A barcode scanner at the loading dock", why: "Scanners capture transactions." },
        { t: "The payroll run", why: "Payroll is an operational ERP process." },
      ],
      sol: ["Decision support <em>uses</em> data to compare options.", "Only the scenario analysis does that; the rest record or process transactions."],
    },
  ];
  const DSS_TF = [
    { s: "A DSS is interactive: managers can change inputs to compare alternatives.", truth: true, why: "Interactivity and comparing alternatives are central to a DSS." },
    { s: "Because DSS output is computer-generated, managers should not question it.", truth: false, why: "Managers validate inputs, interpret results and consider risks the model may miss." },
    { s: "Decision-support tools depend on operational data captured by systems such as CRM, SCM and ERP.", truth: true, why: "Those systems capture and coordinate the data that reports and dashboards analyze." },
    { s: "Disconnected systems produce more reliable reports because each department checks its own data.", truth: false, why: "Disconnected systems produce conflicting reports because they start from different versions of the data." },
    { s: "A DSS recommendation can be wrong if conditions change in ways the model doesn't capture.", truth: true, why: "Unseen conditions are one of the three reasons a recommendation can mislead." },
    { s: "Transaction processing and decision support are the same thing because both use data.", truth: false, why: "TPS records transactions; decision support analyzes recorded data to compare options." },
  ];

  const dssGen = STUDY.makeGenerator({
    id: "k201-ch7-dss",
    name: "Decision support from integrated data",
    blurb: "Tell operational capture from decision support, and decide when to act on, check or adjust a DSS recommendation.",
    variants: [
      dssSort[0], dssSort[1], dssSort[3],
      {
        name: "Act, pause or adjust?",
        make() {
          const d = U.deal("ch7-decide", DECIDE, 1)[0];
          const mgr = U.pick(["The operations manager", "The regional director", "The store manager", "The supply planner"]);
          const optWhy = [
            "Acting is right only when inputs are trustworthy, assumptions hold and no known condition is missing.",
            "Pausing to check is right when the input data are suspect: glitches, stale exports, broken sensors or conflicting sources.",
            "Adjusting is right when the data are fine but the manager knows of a condition the model can't capture.",
          ];
          return Q.mc({
            q: `<p>${mgr} at <b>${U.pick(COMPANIES)}</b> faces this:</p><blockquote>${d.s}</blockquote><p>What is the best response?</p>`,
            right: DECIDE_OPTS[d.a], rightWhy: d.why,
            wrong: DECIDE_OPTS.filter((_, i) => i !== d.a).map(o => ({ t: o, why: `${optWhy[DECIDE_OPTS.indexOf(o)]} ${d.why}` })),
            keepOrder: DECIDE_OPTS,
            sol: S("A DSS supports judgment but doesn't replace it. Check its three dependencies: is the <b>data</b> trustworthy, do the <b>assumptions</b> hold, and is there a <b>condition the model can't see</b>?",
              `${d.why} So: <b>${DECIDE_OPTS[d.a]}</b>.`),
          });
        },
      },
      K.conceptVariant("Explain decision support", "ch7-dss", DSS_CONCEPT),
      K.tfVariant("True or false", "ch7-dss", DSS_TF),
    ],
  });

  /* ============================================================
   * TOPIC 5 · SYSTEMS MAPPING
   * ============================================================ */
  const EVENTS = [
    {
      name: "a campus bookstore textbook stockout", intro: "A student tries to buy a required textbook, but the system shows none left.",
      nodes: [
        { id: "TPS", sub: "point of sale", does: "records the attempted sale and sees the title has zero copies" },
        { id: "SCM", sub: "supply chain", does: "automatically sends a reorder to the publisher once it learns the title is out" },
        { id: "ERP", sub: "finance", does: "updates the budget and financial records for the reorder that was placed" },
        { id: "DSS", sub: "manager reports", does: "puts the stockout into a sales-trend report used to size next semester's order" },
      ],
      edges: [
        { from: "TPS", to: "SCM", sends: "a zero-stock alert for the title" },
        { from: "SCM", to: "ERP", sends: "the reorder (purchase order) details" },
        { from: "ERP", to: "DSS", sends: "sales and financial records, including the stockout" },
      ],
      bad: [
        { order: ["SCM", "TPS", "ERP", "DSS"], why: "The SCM can't reorder a title it doesn't know has sold out. The TPS must record the failed sale first." },
        { order: ["TPS", "ERP", "SCM", "DSS"], why: "The ERP records the financial side of a reorder, and there is no reorder until the SCM sends one." },
        { order: ["DSS", "TPS", "SCM", "ERP"], why: "The DSS analyzes what has already happened, so it comes after the stockout is recorded and the reorder processed." },
      ],
    },
    {
      name: "an online “Buy Now” click", intro: "A shopper clicks “Buy Now” on a pair of headphones.",
      nodes: [
        { id: "TPS", sub: "online checkout", does: "logs the order and the items in it" },
        { id: "CRM", sub: "customer records", does: "adds the new order to the shopper's purchase history, confirms the purchase and sends a thank-you email" },
        { id: "ERP", sub: "finance", does: "bills the confirmed purchase: processes the payment, books revenue and updates the general ledger" },
        { id: "SCM", sub: "fulfillment", does: "once the order is paid, deducts inventory, prints a shipping label and alerts the warehouse" },
        { id: "DSS", sub: "executive reports", does: "uses the sales and shipping data to show the headphones as a trending item in the executive sales report" },
      ],
      edges: [
        { from: "TPS", to: "CRM", sends: "the order and the customer's ID" },
        { from: "CRM", to: "ERP", sends: "the confirmed purchase to be billed" },
        { from: "ERP", to: "SCM", sends: "the paid order to fulfill" },
        { from: "SCM", to: "DSS", sends: "sales, stock and shipping data" },
      ],
      bad: [
        { order: ["CRM", "TPS", "ERP", "SCM", "DSS"], why: "The CRM can't add a purchase to the shopper's history before the checkout system has captured the order." },
        { order: ["TPS", "CRM", "ERP", "DSS", "SCM"], why: "The executive report includes shipping and stock data, so it comes after fulfillment." },
        { order: ["TPS", "SCM", "CRM", "ERP", "DSS"], why: "In this company's flow the warehouse ships only paid orders, so finance processes payment before fulfillment." },
      ],
    },
    {
      name: "a restaurant running out of avocados", intro: "A restaurant's kitchen-order system rings up the last guacamole of the night.",
      nodes: [
        { id: "TPS", sub: "kitchen orders", does: "records the sale and sees avocado stock fall below the reorder point" },
        { id: "SCM", sub: "purchasing", does: "sends a reorder to the produce supplier when alerted that stock is low" },
        { id: "ERP", sub: "accounting", does: "records the amount owed for that purchase order (accounts payable)" },
        { id: "DSS", sub: "ops dashboard", does: "adds the shortage to a weekly demand report used to adjust standing orders" },
      ],
      edges: [
        { from: "TPS", to: "SCM", sends: "a below-reorder-point alert" },
        { from: "SCM", to: "ERP", sends: "the purchase order to be paid" },
        { from: "ERP", to: "DSS", sends: "cost and sales history" },
      ],
      bad: [
        { order: ["SCM", "TPS", "ERP", "DSS"], why: "Purchasing has nothing to reorder until the TPS reports that stock fell below the reorder point." },
        { order: ["TPS", "ERP", "SCM", "DSS"], why: "Accounting can't record an amount owed before purchasing has placed the order." },
        { order: ["DSS", "TPS", "SCM", "ERP"], why: "The weekly report summarizes recorded events, so it comes last." },
      ],
    },
    {
      name: "a manufacturer winning a large order", intro: "A sales rep closes a deal for 2,000 office chairs.",
      nodes: [
        { id: "CRM", sub: "sales pipeline", does: "marks the deal won and passes on the customer and order details" },
        { id: "ERP", sub: "orders & production", does: "turns the won deal into a sales order, checks materials and schedules production" },
        { id: "SCM", sub: "procurement", does: "orders the fabric the production plan is short of and books a carrier for delivery" },
        { id: "DSS", sub: "planning", does: "uses the order, schedule and supplier data to run a scenario on whether the plant can take more orders like this" },
      ],
      edges: [
        { from: "CRM", to: "ERP", sends: "the won deal: customer, items and quantities" },
        { from: "ERP", to: "SCM", sends: "the material shortfall and ship date" },
        { from: "SCM", to: "DSS", sends: "supplier lead times and logistics costs" },
      ],
      bad: [
        { order: ["ERP", "CRM", "SCM", "DSS"], why: "The ERP has no sales order to create until the CRM records that the deal was won." },
        { order: ["CRM", "SCM", "ERP", "DSS"], why: "Procurement only learns which fabric is short after the ERP turns the order into a production plan." },
        { order: ["DSS", "CRM", "ERP", "SCM"], why: "The capacity scenario uses the order, schedule and supplier data, so it comes after them." },
      ],
    },
    {
      name: "a student enrolling in a course", intro: "A student registers for a section of a class.",
      nodes: [
        { id: "SIS", sub: "student info", does: "checks prerequisites, reserves a seat and records the enrollment" },
        { id: "LMS", sub: "e.g. Canvas", does: "gives the student access to the course site" },
        { id: "ERP", sub: "finance", does: "calculates the tuition and fees owed" },
      ],
      edges: [
        { from: "SIS", to: "LMS", sends: "the enrollment, so course access can be granted" },
        { from: "SIS", to: "ERP", sends: "the enrollment, so fees can be calculated" },
      ],
    },
    {
      name: "a customer changing her address", intro: "A customer updates her mailing address in her online account.",
      nodes: [
        { id: "CRM", sub: "customer master", does: "stores the new address as the master record" },
        { id: "ERP", sub: "billing", does: "updates the billing profile so invoices go to the new address" },
        { id: "SCM", sub: "shipping", does: "updates the ship-to address on her open orders" },
      ],
      edges: [
        { from: "CRM", to: "ERP", sends: "the new address for billing" },
        { from: "CRM", to: "SCM", sends: "the new address for open shipments" },
      ],
    },
  ];
  const LINEAR = EVENTS.filter(e => e.bad);
  const seqText = order => order.join(" → ");
  const MAP_VS_FLOW = [
    { cat: "Systems map", t: "Boxes for CRM, ERP and SCM with arrows showing an order record passing from one to the next", why: "Systems as boxes and data flow as arrows is a systems map." },
    { cat: "Systems map", t: "A diagram showing an address change in the CRM being pushed to the ERP billing profile", why: "It shows where data goes between systems." },
    { cat: "Systems map", t: "A picture of which applications receive enrollment data after a student registers", why: "Which systems receive data, in what order, is the map's job." },
    { cat: "Systems map", t: "Arrows labeled “invoice data” and “shipment status” drawn between the company's applications", why: "Labeled information flows between systems make it a systems map." },
    { cat: "Systems map", t: "A one-page view used to spot where data waits for manual re-entry between applications", why: "Finding bottlenecks between systems is a reason to map systems." },
    { cat: "Systems map", t: "A diagram used to see which systems would be affected if the old warehouse software is replaced", why: "Planning upgrades is a reason for systems mapping." },
    { cat: "Flowchart", t: "Step 1: open the order form. Step 2: check the credit limit. Step 3: if over the limit, call the manager.", why: "Steps a person follows to finish a task make a flowchart." },
    { cat: "Flowchart", t: "Decision diamonds showing what a clerk does when an item is out of stock", why: "A person's decision points within a task belong in a flowchart." },
    { cat: "Flowchart", t: "The sequence of tasks an employee follows to submit an expense report", why: "A person's task steps are flowchart content." },
    { cat: "Flowchart", t: "The steps a cashier takes to process a return, including when to ask for a receipt", why: "This is a person's procedure, so it's a flowchart." },
    { cat: "Flowchart", t: "A help-desk technician's steps for resetting a customer's password", why: "Task steps for a person make a flowchart." },
    { cat: "Flowchart", t: "The ordered actions a nurse takes to admit a patient", why: "A person's sequence of actions is a flowchart." },
  ];
  const WHY_MAP_OPTS = ["Find a bottleneck", "Protect data integrity", "Plan an upgrade safely"];
  const WHY_MAP = [
    { a: 0, s: "Orders take two days to get from the website to the warehouse, and no one knows where they sit in between.", why: "Locating where data gets stuck is bottleneck-finding." },
    { a: 0, s: "Staff complain they type the same customer number into three different screens for each order.", why: "Manual re-entry points are bottlenecks a map exposes." },
    { a: 0, s: "Invoices go out a week late, and managers suspect a hand-off between two systems that runs only on Fridays.", why: "Finding the slow hand-off between systems is bottleneck-finding." },
    { a: 1, s: "Customer addresses differ between billing and shipping, and the team wants to know which system holds the master record.", why: "Knowing where master data lives and how updates spread protects data integrity." },
    { a: 1, s: "The firm wants an address updated in the CRM to flow automatically to the billing profile in the ERP.", why: "Making sure updates propagate from the master record keeps data consistent: integrity." },
    { a: 1, s: "Product prices are maintained in two places and keep drifting apart, so the team wants to see which system should own them.", why: "Deciding where the authoritative copy lives is about data integrity." },
    { a: 2, s: "IT plans to replace the 15-year-old inventory system and needs to know which other systems depend on it.", why: "Knowing what breaks if software is replaced is upgrade planning." },
    { a: 2, s: "Before switching payroll vendors, HR wants to see what data the old payroll system sends to finance.", why: "Seeing dependencies before a replacement is upgrade planning." },
    { a: 2, s: "The company is moving its CRM to a new cloud product and wants to list every system that reads from the old one.", why: "Identifying what depends on a system before swapping it is upgrade planning." },
  ];
  const MAP_HINT = "A systems map shows which system acts, in what order, and what information moves along each arrow. A system can act only on data that has reached it.";

  const mapGen = STUDY.makeGenerator({
    id: "k201-ch7-sysmap",
    name: "Systems mapping",
    blurb: "Order the systems a business event flows through, read a systems map, and predict what breaks when a link fails.",
    variants: [
      {
        name: "Order the systems",
        make() {
          const ev = U.pick(LINEAR);
          const right = seqText(ev.nodes.map(n => n.id));
          const desc = U.shuffle(ev.nodes).map(n => `<b>${n.id}</b> ${n.does}`);
          return Q.mc({
            q: `<p>Event: <b>${ev.name}</b>. ${ev.intro}</p><p>Here is what each system does (in scrambled order):</p>${ul(desc)}<p>In what order does the event flow through the systems?</p>`,
            right, rightWhy: "Each system acts on what the one before it sends; decision support comes last because it analyzes what was recorded.",
            wrong: ev.bad.map(b => ({ t: seqText(b.order), why: b.why })),
            sol: S("Find the system that captures the event first. Then ask, for each other system: what information does it need, and who could have sent it?",
              `The flow is <b>${right}</b>:${ul(ev.nodes.map(n => `<b>${n.id}</b> ${n.does}`))}`,
              "Processes flow <em>through</em> systems, not around them. No system can act on data that hasn't reached it yet."),
          });
        },
      },
      {
        name: "Read the map: who receives it?",
        make() {
          const ev = U.pick(EVENTS);
          const ei = U.randInt(0, ev.edges.length - 1);
          const e = ev.edges[ei];
          const others = ev.nodes.map(n => n.id).filter(id => id !== e.to);
          return Q.mc({
            q: `<p>Systems map for <b>${ev.name}</b>:</p>${mapSvg(ev)}<p>Which system <b>receives</b> “${e.sends}”, the information on arrow ${ei + 1}?</p>`,
            right: e.to, rightWhy: `Arrow ${ei + 1} points from ${e.from} to ${e.to}.`,
            wrong: others.map(id => ({ t: id, why: id === e.from ? `${id} is the <em>sender</em>: arrows point from the system that sends to the system that receives.` : `${id} is not at either end of arrow ${ei + 1}; it ${ev.nodes.find(n => n.id === id).does}.` })),
            sol: S("Boxes are systems; an arrow points in the direction the information flows. Find arrow " + (ei + 1) + " and look at its head.",
              `Arrow ${ei + 1} runs <b>${e.from} → ${e.to}</b>, so <b>${e.to}</b> receives ${e.sends}.`),
          });
        },
      },
      {
        name: "Read the map: what flows?",
        make() {
          const ev = U.pick(EVENTS);
          const ei = U.randInt(0, ev.edges.length - 1);
          const e = ev.edges[ei];
          const wrong = ev.edges.filter((_, j) => j !== ei).slice(0, 2).map(x => ({ t: `${x.sends[0].toUpperCase()}${x.sends.slice(1)}`, why: `That travels on the arrow from ${x.from} to ${x.to}, not on arrow ${ei + 1}.` }));
          wrong.push({ t: "The step-by-step instructions an employee follows at the counter", why: "That is flowchart content. A systems map shows data moving between systems, not a person's steps." });
          if (wrong.length < 3) wrong.push({ t: "The source code of the receiving system", why: "A systems map is not a technical blueprint; it shows business information flows." });
          return Q.mc({
            q: `<p>Systems map for <b>${ev.name}</b>. ${ev.intro}</p>${mapSvg(ev)}${ul(ev.nodes.map(n => `<b>${n.id}</b> ${n.does}`))}<p>What information most likely travels along <b>arrow ${ei + 1}</b> (${e.from} → ${e.to})?</p>`,
            right: `${e.sends[0].toUpperCase()}${e.sends.slice(1)}`, rightWhy: `${e.to} ${ev.nodes.find(n => n.id === e.to).does}, which needs ${e.sends}.`,
            wrong,
            sol: S("Ask what the receiving system needs in order to do its job, and what the sending system has just produced.",
              `${e.from} ${ev.nodes.find(n => n.id === e.from).does}; ${e.to} ${ev.nodes.find(n => n.id === e.to).does}. So arrow ${ei + 1} carries <b>${e.sends}</b>.`),
          });
        },
      },
      {
        name: "Predict: what breaks?",
        make() {
          const ev = U.pick(EVENTS);
          const senders = ev.nodes.filter(n => ev.edges.some(e => e.from === n.id));
          const x = U.pick(senders);
          const out = ev.edges.find(e => e.from === x.id);
          const tgt = ev.nodes.find(n => n.id === out.to);
          const ups = ev.edges.filter(e => e.to === x.id).map(e => ev.nodes.find(n => n.id === e.from));
          const wrong = [
            { t: `Nothing: ${tgt.id} will get the information some other way`, why: "Processes flow through systems, not around them. Without the handoff, the next system has nothing to act on." },
            { t: `Only ${x.id}'s own users notice; every other system carries on normally`, why: `Systems downstream of ${x.id} depend on what it sends, so they are affected too.` },
          ];
          if (ups.length) wrong.push({ t: `${ups[0].id} can't do its job (it ${ups[0].does})`, why: `${ups[0].id} acts <em>before</em> ${x.id}. A failure passes downstream, not upstream.` });
          else wrong.push({ t: `${x.id} keeps running, but ${tgt.id} slows down slightly`, why: `${tgt.id} doesn't just slow down; it never receives the data it needs from ${x.id}.` });
          return Q.mc({
            q: `<p>Systems map for <b>${ev.name}</b>:</p>${mapSvg(ev)}<p>Suppose <b>${x.id}</b> is down for a day and passes nothing on. What is the most direct consequence?</p>`,
            right: `${tgt.id} never receives ${out.sends}, so it can't do its part`,
            rightWhy: `${tgt.id} ${tgt.does}, and it depends on ${x.id} for ${out.sends}.`,
            wrong,
            sol: S(`Follow the arrows <em>out of</em> ${x.id}. Failures travel downstream.`,
              `${x.id} sends ${out.sends} to <b>${tgt.id}</b>, which ${tgt.does}. Without that handoff, ${tgt.id} is stuck. Systems that act before ${x.id} are unaffected.`),
          });
        },
      },
      {
        name: "Count the manual handoffs",
        make() {
          const ev = U.pick(EVENTS);
          const n = U.pick([12, 15, 20, 25, 30, 40, 45, 60]);
          const h = ev.edges.length;
          return Q.num({
            q: `<p>Systems map for <b>${ev.name}</b>:</p>${mapSvg(ev)}<p>In the company's current setup, none of these systems is connected: every arrow is a person retyping the information into the next system. The event happens <b>${n}</b> times a day. How many manual re-entries does that create per day?</p>`,
            answer: h * n, kind: "count", unit: "re-entries",
            traps: [
              { value: ev.nodes.length * n, why: "You counted systems (boxes). Re-entry happens on each handoff (arrow) between systems, and the first system captures the event originally." },
              { value: h, why: "That is the handoffs for one event. Multiply by the number of events per day." },
            ],
            sol: S("Each arrow is a handoff between systems. Without integration, each handoff is a retyping. Count arrows, not boxes.",
              `The map has <b>${h}</b> arrows. ${h} × ${n} events = <b>${h * n}</b> manual re-entries per day, each one a chance for a typo. Integration removes them.`),
          });
        },
      },
      {
        name: "Systems map or flowchart?",
        make() {
          const items = [...U.deal("ch7-mvf:m", MAP_VS_FLOW.filter(x => x.cat === "Systems map"), U.randInt(2, 3)),
            ...U.deal("ch7-mvf:f", MAP_VS_FLOW.filter(x => x.cat === "Flowchart"), 2)];
          return Q.classify({
            q: `<p>Is each diagram a <b>systems map</b> or a <b>flowchart</b>?</p>`,
            cats: ["Systems map", "Flowchart"], items,
            sol: S("Ask: does it follow a <em>person's</em> steps, or the <em>data's</em> path between systems?",
              "A flowchart shows the steps a person follows to finish a task. A systems map shows which systems receive, update and act on the data next."),
          });
        },
      },
      {
        name: "Why map it?",
        make() {
          const w = U.deal("ch7-whymap", WHY_MAP, 1)[0];
          const generic = [
            "Bottlenecks are places where data gets stuck or is retyped by hand.",
            "Data integrity is about where master data lives and making updates spread consistently.",
            "Upgrade planning is about knowing what depends on a system before replacing it.",
          ];
          return Q.mc({
            q: `<p>${w.s}</p><p>Which purpose of systems mapping does this situation call for?</p>`,
            right: WHY_MAP_OPTS[w.a], rightWhy: w.why,
            wrong: WHY_MAP_OPTS.filter((_, i) => i !== w.a).map(o => ({ t: o, why: `${generic[WHY_MAP_OPTS.indexOf(o)]} ${w.why}` })),
            keepOrder: WHY_MAP_OPTS,
            sol: S("Three reasons to map: find bottlenecks, protect data integrity, plan upgrades. Which problem is the team actually facing?", w.why),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 6 · INFORMATION SILOS
   * ============================================================ */
  const SILO_DEFS = {
    "Data inconsistency": "copies of the same data in different systems drift apart",
    "Manual re-entry": "people retype data from one system into another",
    "No big picture": "each department sees only its own slice, so nobody sees the whole",
    "Poor customer experience": "customers repeat themselves or get mixed answers",
    "High IT costs": "separate licenses, servers, patches and support for each system",
    "Compliance & audit risk": "scattered data makes audit trails, reporting rules and privacy laws hard to satisfy",
    "Resistance to change": "people cling to familiar tools and guard their data",
  };
  const SILO_BANK = [
    { cat: "Data inconsistency", t: "The website shows a sweater at $39, but the store register still charges the old $45.", why: "One price stored in two systems has drifted apart." },
    { cat: "Data inconsistency", t: "A customer's new address is in the CRM, but invoices still go to her old one.", why: "Two copies of the address no longer match." },
    { cat: "Data inconsistency", t: "Marketing counts 12,400 active customers; finance counts 11,050.", why: "Separate copies of customer data give conflicting totals." },
    { cat: "Data inconsistency", t: "The same supplier appears under three slightly different names in three systems.", why: "Duplicated records drift into inconsistent versions." },
    { cat: "Data inconsistency", t: "Product weights in the shipping system differ from the catalog's, so freight quotes are wrong.", why: "The same product data disagrees between systems." },
    { cat: "Manual re-entry", t: "Each web order is printed and typed into the inventory system, then typed again into invoicing.", why: "Retyping the same order into several systems is manual re-entry." },
    { cat: "Manual re-entry", t: "An HR assistant copies new-hire details from the HR spreadsheet into payroll by hand.", why: "Hand-copying between systems is manual re-entry." },
    { cat: "Manual re-entry", t: "Warehouse staff key in tracking numbers that the carrier's system already produced.", why: "Re-typing data that already exists elsewhere is manual re-entry." },
    { cat: "Manual re-entry", t: "Orders ship a day late because they wait in a queue for someone to retype them.", why: "The delay comes from manual re-entry between systems." },
    { cat: "Manual re-entry", t: "An analyst spends every Monday copying sales figures from one program into another.", why: "Recurring hand-copying between systems is re-entry." },
    { cat: "No big picture", t: "Sales celebrates a record month without knowing the warehouse is nearly out of the best seller.", why: "Sales can't see warehouse data, so nobody has the whole picture." },
    { cat: "No big picture", t: "A big customer's new order ships before anyone notices its last invoice is two months unpaid.", why: "Shipping can't see finance's data, so a risk goes unnoticed." },
    { cat: "No big picture", t: "No one can say what a product line really costs, because production, purchasing and shipping costs sit in separate systems.", why: "The full cost picture is split across silos." },
    { cat: "No big picture", t: "One region reorders a product while another region sits on a surplus of it.", why: "Each region sees only its own inventory." },
    { cat: "No big picture", t: "The CEO waits two weeks for analysts to stitch department reports together before seeing company-wide results.", why: "No single view of the whole organization exists." },
    { cat: "Poor customer experience", t: "A caller explains her problem to three agents because each transfer lands in a different system.", why: "Customers repeating themselves is the silo's customer-experience cost." },
    { cat: "Poor customer experience", t: "A support agent keeps a customer on hold while switching among four applications to find an order.", why: "App-hopping slows service and frustrates the customer." },
    { cat: "Poor customer experience", t: "A loyal customer gets a “welcome, new customer!” offer because marketing can't see his purchase history.", why: "Disconnected data makes the company look like it doesn't know its customer." },
    { cat: "Poor customer experience", t: "A customer is told her refund was issued, but billing has no record of it and charges her again.", why: "Contradictory answers from different systems hurt the customer." },
    { cat: "Poor customer experience", t: "Shoppers must re-enter their account details when moving from the online store to the help portal.", why: "Making customers repeat information is a customer-experience problem." },
    { cat: "High IT costs", t: "The company pays for separate licenses, servers and support contracts for six overlapping systems.", why: "Each silo carries its own running costs." },
    { cat: "High IT costs", t: "IT spends most weekends applying security patches to a dozen separate applications.", why: "Many separate systems multiply maintenance work." },
    { cat: "High IT costs", t: "Custom scripts that copy data between old systems break after every upgrade and must be rewritten.", why: "Patching homemade connections between silos is costly maintenance." },
    { cat: "High IT costs", t: "Three different vendors must be called when one data problem spans their systems.", why: "Multiple vendors and support contracts raise IT cost and effort." },
    { cat: "High IT costs", t: "Each department's homegrown database needs its own backups and its own administrator.", why: "Duplicated infrastructure raises maintenance costs." },
    { cat: "Compliance & audit risk", t: "Auditors ask for a complete trail of one transaction, but its pieces are scattered across systems with no common ID.", why: "Scattered data makes an accurate audit trail hard to produce." },
    { cat: "Compliance & audit risk", t: "A customer asks the company to delete her personal data under a privacy law, and no one knows which systems hold copies.", why: "Privacy laws are hard to honor when data is scattered." },
    { cat: "Compliance & audit risk", t: "Quarterly financial statements are assembled by hand from four ledgers.", why: "Manual consolidation raises the risk of breaking financial-reporting standards." },
    { cat: "Compliance & audit risk", t: "The firm can't prove who approved a payment because approvals happened in emails outside the accounting system.", why: "Missing approval records are an audit risk." },
    { cat: "Compliance & audit risk", t: "Sensitive employee data has been copied into personal spreadsheets that IT doesn't know exist.", why: "Untracked copies of sensitive data create compliance exposure." },
    { cat: "Resistance to change", t: "Warehouse supervisors insist on keeping their old system because “it works for us,” even after the new one launches.", why: "Attachment to familiar tools is the human barrier to integration." },
    { cat: "Resistance to change", t: "Staff quietly maintain their own spreadsheets instead of entering data into the shared system.", why: "Workarounds that rebuild the silo are resistance to change." },
    { cat: "Resistance to change", t: "A department head blocks the integration project for fear of losing control over “our” data.", why: "Guarding data is a people problem, not a technical one." },
    { cat: "Resistance to change", t: "Long-time employees skip the new-system training, assuming the old way will come back.", why: "Refusing to engage with the change is resistance." },
    { cat: "Resistance to change", t: "The switch-over date has been pushed back three times because teams won't give up familiar tools.", why: "Reluctance to let go of old tools delays integration." },
  ];
  const SILO_CATS = Object.keys(SILO_DEFS);

  const siloGen = STUDY.makeGenerator({
    id: "k201-ch7-silo",
    name: "Diagnosing information silos",
    blurb: "Name the silo problem in a scenario, diagnose several at once, and put a number on the cost of re-entry.",
    variants: [
      ...K.sortVariants({ key: "ch7-silo", bank: SILO_BANK, cats: SILO_CATS, defs: SILO_DEFS, ask: "symptom",
        hint: "Ask who is hurt and how: conflicting copies, retyping, a missing whole view, the customer, IT's budget, auditors and regulators, or people holding on to old tools." }),
      {
        name: "Diagnose the scenario",
        make() {
          const k = U.randInt(2, 3);
          const picked = U.sample(SILO_CATS, k);
          const facts = picked.map(c => U.pick(SILO_BANK.filter(b => b.cat === c)));
          const co = U.pick(COMPANIES);
          return Q.multi({
            q: `<p>A consultant's notes from a week at <b>${co}</b>:</p>${ul(facts.map(f => f.t))}<p>Select <b>every</b> silo problem these notes show.</p>`,
            options: SILO_CATS.map(c => {
              const i = picked.indexOf(c);
              return i >= 0 ? { t: c, ok: true, why: `“${facts[i].t}” ${facts[i].why}` } : { t: c, ok: false, why: `Nothing in the notes shows this (${SILO_DEFS[c]}).` };
            }),
            sol: S("Take the notes one at a time and name the single problem each one shows. Only tick problems that actually appear.",
              `The notes show:${ul(picked.map((c, i) => `<b>${c}</b>: ${facts[i].why}`))}`),
          });
        },
      },
      {
        name: "Cost of re-entry",
        make() {
          const co = U.pick(COMPANIES);
          const pool = ["inventory", "shipping", "invoicing", "the warehouse system", "the accounting package"];
          const k = U.randInt(2, 4);
          const sys = U.sample(pool, k);
          const n = U.pick([20, 30, 40, 50, 60, 80]);
          const m = U.randInt(2, 5);
          const ans = n * k * m;
          return Q.num({
            q: `<p>At <b>${co}</b>, each order is entered once in the order system, then retyped by hand into ${k} other systems (${sys.join(", ")}). Each retyping takes about <b>${m} minutes</b>. The company handles <b>${n} orders</b> a day. How many staff minutes per day go to re-entry?</p>`,
            answer: ans, unit: "minutes",
            traps: [
              { value: n * (k + 1) * m, why: "You counted the original entry too. Only the retypings into the other systems are re-entry." },
              { value: n * m, why: "You counted one retyping per order, but each order is retyped into several systems." },
              { value: k * m, why: "That is the time for one order. Multiply by the orders per day." },
            ],
            sol: S("Re-entry happens once per order <em>per other system</em>. The first entry isn't re-entry.",
              `${n} orders × ${k} systems × ${m} min = <b>${U.fmt(ans)} minutes</b> a day (about ${U.fmt(U.round(ans / 60, 1))} hours), before counting the errors retyping creates.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 7 · BEST-OF-BREED VS SUITE VS HYBRID
   * ============================================================ */
  const APPROACHES = ["Best-of-breed", "Integrated suite", "Hybrid"];
  const APP_DEFS = {
    "Best-of-breed": "top-rated product for each function; strongest tools, hardest integration",
    "Integrated suite": "one vendor's ERP for all functions; seamless data, uneven modules, vendor dependence",
    "Hybrid": "core ERP plus specialized tools connected through APIs or other integration methods",
  };
  const APP_BANK = [
    { cat: "Best-of-breed", t: "Buy the top-rated CRM, the top-rated SCM and the top-rated accounting package, each from a different vendor.", why: "Picking the leader in every function is best-of-breed." },
    { cat: "Best-of-breed", t: "Each tool may be the strongest in its area, but connecting them is complex and expensive.", why: "That is best-of-breed's core tradeoff." },
    { cat: "Best-of-breed", t: "Links between products are often imperfect, so some data still syncs late or gets re-keyed.", why: "Imperfect integration is best-of-breed's typical weakness." },
    { cat: "Best-of-breed", t: "IT juggles many vendor contracts and builds connectors between every pair of systems that share data.", why: "Many vendors and many custom connections come with best-of-breed." },
    { cat: "Best-of-breed", t: "The firm wants the most advanced tool in every area and has a large team experienced in building integrations.", why: "Best-of-breed fits when top functionality matters most and integration skill is available." },
    { cat: "Integrated suite", t: "One vendor supplies finance, HR, sales and supply-chain modules on a single shared database.", why: "One vendor, one database is the integrated suite." },
    { cat: "Integrated suite", t: "Data flows between functions with little custom integration work.", why: "Seamless data flow is the suite's main advantage." },
    { cat: "Integrated suite", t: "Support comes from a single vendor, so there is one number to call.", why: "Single-vendor support is a suite benefit." },
    { cat: "Integrated suite", t: "Some modules are weaker than standalone rivals because no vendor is best at everything.", why: "Uneven module strength is the suite's tradeoff." },
    { cat: "Integrated suite", t: "The firm becomes heavily dependent on one vendor's pricing, roadmap and upgrade schedule.", why: "Vendor dependence is highest with a single suite." },
    { cat: "Integrated suite", t: "Integration costs are lower because the modules are designed to work together from the start.", why: "Built-in integration lowers cost in a suite." },
    { cat: "Hybrid", t: "A core ERP runs finance and operations while a specialized marketing tool connects to it through APIs.", why: "Core suite plus API-connected specialist is hybrid." },
    { cat: "Hybrid", t: "Specialized tools are added only where the core system's module falls short.", why: "Targeted add-ons on a core are the hybrid approach." },
    { cat: "Hybrid", t: "An API lets a specialized warehouse app read and write orders in the core ERP.", why: "APIs connecting specialist apps to the core define hybrid." },
    { cat: "Hybrid", t: "The company keeps one financial backbone but plugs in a top analytics tool where it matters most.", why: "One core plus selective best-of-breed is hybrid." },
    { cat: "Hybrid", t: "Success depends on well-managed connections between the core system and its add-ons.", why: "Hybrid's risk sits in managing those connections." },
  ];
  const appSort = K.sortVariants({ key: "ch7-app", bank: APP_BANK, cats: APPROACHES, defs: APP_DEFS, ask: "statement",
    hint: "How many vendors, and how is data connected? Many leaders patched together → best-of-breed; one vendor for all → suite; a core plus API-connected specialists → hybrid." });
  const RECOMMEND = [
    { a: 1, s: "A 120-employee regional distributor has a two-person IT team. It wants to replace spreadsheets and an aging accounting package, and its top priority is getting everyone onto consistent data quickly with as little integration work as possible.",
      why: "Small IT staff + priority on consistent data and minimal integration → integrated suite. Accepted tradeoff: some modules won't be best-in-class, and the firm depends on one vendor.",
      not: { "Best-of-breed": "Connecting several vendors' products would overwhelm a two-person IT team and delay consistent data.", "Hybrid": "There is no existing core to keep and no specialized need named, so adding API-connected tools only adds integration work." } },
    { a: 1, s: "A mid-size manufacturer failed an audit because transactions were scattered across five systems. Leadership wants one auditable record and one vendor accountable for support.",
      why: "One auditable system and one accountable vendor are the suite's strengths. Accepted tradeoff: vendor dependence.",
      not: { "Best-of-breed": "Several vendors and imperfect links recreate the scattered-data audit problem.", "Hybrid": "Add-ons spread data and accountability across vendors, against the stated goals." } },
    { a: 0, s: "A specialty research firm depends on three highly specialized functions. No suite offers adequate modules for any of them, and the firm has a dedicated integration budget and an experienced integration team.",
      why: "When suites can't meet the core needs and integration capacity exists, best-of-breed fits. Accepted tradeoff: higher integration cost and risk.",
      not: { "Integrated suite": "No suite has adequate modules for the firm's critical functions.", "Hybrid": "A hybrid needs a suitable core system, and here no suite fits the main functions." } },
    { a: 0, s: "A fast-growing online brand competes on cutting-edge personalization and world-class logistics. It has no legacy ERP and a large engineering team that already builds and maintains integrations.",
      why: "Top functionality in each area is the competitive edge, and the team can handle integration → best-of-breed. Accepted tradeoff: integration cost and many vendors.",
      not: { "Integrated suite": "A suite's uneven modules would blunt the firm's competitive edge in personalization and logistics.", "Hybrid": "With no existing core and strong integration skills, there is little reason to build around one suite." } },
    { a: 2, s: "A national retailer runs a stable ERP for finance and inventory, but the ERP's CRM module can't support the loyalty-program personalization marketing needs.",
      why: "Keep the working core and connect a specialized loyalty/CRM tool through APIs → hybrid. Accepted tradeoff: one more connection to manage.",
      not: { "Best-of-breed": "Replacing a stable ERP everywhere adds cost and risk to fix one gap.", "Integrated suite": "Staying suite-only ignores a real requirement the suite can't meet." } },
    { a: 2, s: "A hospital network's ERP handles finance and HR well, but its scheduling module can't handle complex operating-room schedules. A specialized scheduling product with a published API is available.",
      why: "Core ERP + API-connected specialist for the one weak area → hybrid.",
      not: { "Best-of-breed": "Finance and HR already work; swapping everything for separate leaders adds needless risk.", "Integrated suite": "The suite's scheduling module is the problem, so staying suite-only leaves it unsolved." } },
    { a: 2, s: "A large bank keeps its ERP general ledger but needs a specialized fraud-analytics tool that pulls transaction data in near real time.",
      why: "Keep the core ledger and connect the specialist tool through APIs → hybrid.",
      not: { "Best-of-breed": "There's no case for replacing the working ledger; only fraud analytics needs a specialist.", "Integrated suite": "A suite-only approach would forgo the specialized fraud capability the bank needs." } },
  ];
  const DIMENSIONS = [
    { a: 0, s: "offers the strongest functionality within each individual business function", why: "Each best-of-breed tool is chosen as the leader in its area." },
    { a: 1, s: "gives the smoothest data flow and the lowest integration cost", why: "Suite modules share one database and are designed to work together." },
    { a: 1, s: "creates the greatest dependence on a single vendor", why: "With a suite, one vendor supplies everything." },
    { a: 0, s: "requires the most custom integration work between systems", why: "Products from many vendors must be connected one by one." },
    { a: 2, s: "keeps one core platform while adding specialized strength only where needed", why: "That is the definition of a hybrid." },
    { a: 0, s: "carries the highest risk that data moves imperfectly between functions", why: "Best-of-breed links are often complex and imperfect." },
    { a: 1, s: "gives the company one vendor to call for support", why: "Single-vendor support is a suite advantage." },
    { a: 2, s: "depends on APIs or similar methods to link specialist tools to a core system", why: "APIs connecting add-ons to the core are the hybrid's mechanism." },
  ];
  const REVISE = [
    {
      q: "A firm chose an integrated suite. Two years later, marketing needs advanced personalization the suite's CRM module can't deliver, while finance and HR run well. What is the best revised recommendation?",
      right: "Move to a hybrid: keep the suite as the core and connect a specialized personalization tool through APIs",
      rightWhy: "It meets the new requirement while keeping what already works.",
      wrong: [
        { t: "Replace the whole suite with best-of-breed products", why: "That discards a working core and takes on large cost and risk to fix one gap." },
        { t: "Keep the suite unchanged and tell marketing to manage without", why: "A recommendation should change when requirements change; ignoring a real need isn't defensible." },
        { t: "Let marketing build its own spreadsheet database", why: "That creates a new information silo." },
      ],
      sol: ["Requirements changed in one area only. What is the smallest change that meets them?", "Keep the core, add a specialist via APIs: a hybrid."],
    },
    {
      q: "A company planned a best-of-breed design across six functions. Then its IT budget is cut in half and two integration developers leave. What should happen to the recommendation?",
      right: "Reconsider an integrated suite (or a hybrid with fewer specialist tools), because best-of-breed's integration load is no longer sustainable",
      rightWhy: "Best-of-breed depends on integration capacity, which just shrank.",
      wrong: [
        { t: "Keep the plan; best-of-breed always gives the best result", why: "Best per function doesn't mean best overall, especially without people to build integrations." },
        { t: "Add even more specialist tools to compensate", why: "More tools mean more integration work, which the firm can no longer handle." },
        { t: "Drop integration and let each department run its own tool", why: "That deliberately builds silos." },
      ],
      sol: ["Which constraint changed, and which approach depends on it most?", "Integration capacity fell, so shift toward the approach with the least integration work."],
    },
    {
      q: "A hybrid design connects a specialized e-commerce app to the core ERP through APIs. A new privacy rule requires the company to find and delete any customer's data on request. What is the best next step?",
      right: "Update the systems map to show everywhere customer data lives and flows, so every copy can be found",
      rightWhy: "Mapping where data lives supports data integrity and compliance.",
      wrong: [
        { t: "Nothing; APIs automatically delete data everywhere", why: "APIs move data where they're built to; they don't track or delete copies on their own." },
        { t: "Replace the hybrid with a different vendor's suite immediately", why: "A drastic switch isn't the first step; first find where the data is." },
        { t: "Delete the data only from the core ERP", why: "Copies in the e-commerce app would remain, breaking the rule." },
      ],
      sol: ["A compliance question about data spread across systems → you need to know where the data is.", "Systems mapping shows where customer data lives and moves."],
    },
    {
      q: "A suite-based company acquires a firm whose world-class SCM tool is critical to the acquired business. What is a defensible recommendation?",
      right: "Keep the SCM tool and connect it to the suite through APIs (a hybrid), at least until the suite's module can match it",
      rightWhy: "It protects a critical capability while keeping data connected.",
      wrong: [
        { t: "Force the acquired firm onto the suite's SCM module immediately", why: "That risks damaging a capability the business depends on." },
        { t: "Run the SCM tool with no connection to the suite", why: "That creates a silo between the two companies' data." },
        { t: "Abandon the suite and go fully best-of-breed", why: "One strong tool doesn't justify replacing the whole core." },
      ],
      sol: ["Balance two goals: keep the critical capability and avoid a new silo.", "A hybrid connection through APIs does both."],
    },
  ];
  const APP_TF = [
    { s: "A hybrid approach usually relies on APIs or similar integration methods to connect specialized tools to a core system.", truth: true, why: "That is how hybrids link add-ons to the core." },
    { s: "Best-of-breed is always the cheapest option because each tool is chosen for value.", truth: false, why: "Best-of-breed often has the highest integration cost; the tools are chosen for functionality." },
    { s: "Integrated suites trade some best-in-class functionality for smoother data flow.", truth: true, why: "No vendor is best at everything, but suite modules share data seamlessly." },
    { s: "Choosing an integrated suite eliminates vendor dependence.", truth: false, why: "It maximizes dependence on one vendor." },
    { s: "An integration recommendation should be revisited when business requirements change.", truth: true, why: "Developing a recommendation includes revising it when requirements change." },
    { s: "With best-of-breed, data flows between the applications automatically, with no integration effort.", truth: false, why: "Integration is complex, expensive and often imperfect with best-of-breed." },
  ];

  const stratGen = STUDY.makeGenerator({
    id: "k201-ch7-strategy",
    name: "Best-of-breed vs. suite vs. hybrid",
    blurb: "Recognize each integration approach, compare their tradeoffs, and recommend (and revise) one for a scenario.",
    variants: [
      appSort[0], appSort[2], appSort[4],
      {
        name: "Recommend an approach",
        make() {
          const r = U.deal("ch7-rec", RECOMMEND, 1)[0];
          const right = APPROACHES[r.a];
          return Q.mc({
            q: `<p>${r.s}</p><p>Which integration approach would you recommend?</p>`,
            right, rightWhy: r.why,
            wrong: APPROACHES.filter(x => x !== right).map(x => ({ t: x, why: r.not[x] })),
            keepOrder: APPROACHES,
            sol: S("List the firm's priorities and constraints (IT capacity, budget, existing core system, need for specialized functionality, audit needs). Then match them to each approach's tradeoffs.",
              r.why, "A good recommendation names the tradeoff it accepts, not just the benefit."),
          });
        },
      },
      {
        name: "Compare the tradeoffs",
        make() {
          const d = U.deal("ch7-dim", DIMENSIONS, 1)[0];
          const right = APPROACHES[d.a];
          return Q.mc({
            q: `<p>Compared with the other two approaches, which one typically <b>${d.s}</b>?</p>`,
            right, rightWhy: d.why,
            wrong: APPROACHES.filter(x => x !== right).map(x => ({ t: x, why: `${x}: ${APP_DEFS[x]}. ${d.why}` })),
            keepOrder: APPROACHES,
            sol: S("Recall what each approach optimizes: best-of-breed = functionality per area; suite = seamless data and one vendor; hybrid = a core plus targeted specialists via APIs.",
              `${d.why} So the answer is <b>${right}</b>.`),
          });
        },
      },
      K.conceptVariant("Revise when requirements change", "ch7-app", REVISE),
      K.tfVariant("True or false", "ch7-app", APP_TF),
    ],
  });

  /* ============================================================
   * TOPIC 8 · HUMAN AND ORGANIZATIONAL FACTORS
   * ============================================================ */
  const HUMAN_DEFS = {
    "Process redesign": "rethinking how work flows instead of automating the old steps",
    "Data ownership": "naming who is accountable for each kind of shared data",
    "Training": "role-based practice on the tasks each person will do",
    "Change management": "explaining why, communicating, involving people and phasing the change",
    "Human validation": "people checking migrated data and automated outputs before trusting them",
  };
  const HUMAN_BANK = [
    { cat: "Process redesign", t: "Before go-live, the team works out how purchase approvals should flow in the new system instead of copying the old paper steps.", why: "Rethinking the flow of work is process redesign." },
    { cat: "Process redesign", t: "Three different invoice-approval routines used by regional offices are merged into one standard process.", why: "Standardizing how work is done is process redesign." },
    { cat: "Process redesign", t: "A step where orders were printed and signed is dropped because the system now records approvals.", why: "Removing unneeded steps is process redesign." },
    { cat: "Process redesign", t: "Order handling is changed so the warehouse acts on orders the moment they're entered, not at day's end.", why: "Changing how work flows is process redesign." },
    { cat: "Process redesign", t: "Managers decide whether to change the business process or configure the software where the two don't match.", why: "Deciding how the process should work is process redesign." },
    { cat: "Data ownership", t: "The sales-operations manager is made responsible for keeping customer master records accurate.", why: "Naming an accountable owner for a data set is data ownership." },
    { cat: "Data ownership", t: "A rule states that only HR may change an employee's job title and pay grade.", why: "Assigning who controls a data item is data ownership." },
    { cat: "Data ownership", t: "Every shared data field has a named owner who approves changes to its definition.", why: "Accountability for definitions is data ownership." },
    { cat: "Data ownership", t: "When the catalog and the ERP disagree on a price, everyone knows whose record wins.", why: "Settling which record is authoritative is data ownership." },
    { cat: "Data ownership", t: "Merchandising is accountable for product descriptions, and finance for cost data.", why: "Splitting accountability by data type is data ownership." },
    { cat: "Training", t: "Warehouse staff practice receiving shipments in a test copy of the new system before launch.", why: "Hands-on practice before go-live is training." },
    { cat: "Training", t: "Role-based lessons show buyers exactly which screens they'll use to create purchase orders.", why: "Teaching the tasks each role performs is training." },
    { cat: "Training", t: "Super-users in each department get extra instruction so they can help coworkers after go-live.", why: "Building in-house expertise is part of training." },
    { cat: "Training", t: "Quick-reference guides and refresher sessions are offered in the first month after launch.", why: "Ongoing learning support is training." },
    { cat: "Training", t: "New hires learn the system during onboarding rather than by trial and error.", why: "Structured instruction on the system is training." },
    { cat: "Change management", t: "Leaders explain why the old systems are being retired and what problems the new one solves.", why: "Explaining the reasons for change is change management." },
    { cat: "Change management", t: "A communication plan updates employees every two weeks on the timeline and what will change in their jobs.", why: "Regular communication about the change is change management." },
    { cat: "Change management", t: "Concerns raised by the warehouse team are collected and addressed before rollout.", why: "Listening to and addressing resistance is change management." },
    { cat: "Change management", t: "Respected employees from each department are recruited as champions of the new system.", why: "Using trusted peers to lead adoption is change management." },
    { cat: "Change management", t: "The rollout is phased so teams aren't asked to change everything at once.", why: "Pacing the change is change management." },
    { cat: "Human validation", t: "A planner reviews the system's auto-generated purchase orders before they go to suppliers.", why: "A person checking automated output is human validation." },
    { cat: "Human validation", t: "Finance checks a sample of migrated account balances against the old ledger before switching over.", why: "Verifying migrated data is human validation." },
    { cat: "Human validation", t: "A manager questions a forecast that looks implausibly high before acting on it.", why: "Sanity-checking system output is human validation." },
    { cat: "Human validation", t: "Someone confirms a dashboard's totals match a known figure before it goes to executives.", why: "Verifying numbers before they're trusted is human validation." },
    { cat: "Human validation", t: "An analyst spot-checks automatically generated customer segments for obviously wrong groupings.", why: "Reviewing automated results is human validation." },
  ];
  const humSort = K.sortVariants({ key: "ch7-hum", bank: HUMAN_BANK, cats: Object.keys(HUMAN_DEFS), defs: HUMAN_DEFS, ask: "action",
    hint: "Is the action about how work flows, who is accountable for data, teaching skills, helping people accept the change, or checking outputs?" });
  const FIX = [
    {
      q: "Six months after go-live, the ERP works technically, but staff still keep side spreadsheets and much of their data never reaches the system. What should leaders do first?",
      right: "Find out why people avoid the system, explain the reasons for the change and back it up with targeted training",
      rightWhy: "Workarounds are a change-management and training problem, not a software one.",
      wrong: [
        { t: "Buy a second system that works more like the spreadsheets", why: "That adds a new silo instead of addressing why people resist." },
        { t: "Roll back to the old systems", why: "That abandons the investment without fixing the human cause." },
        { t: "Ask the vendor for more features", why: "The system already works; the barrier is people, not features." },
      ],
      sol: ["Is the problem technical or human? The system works, so it's human.", "Address resistance (change management) and skills (training)."],
    },
    {
      q: "After data migration, customer records are duplicated and nobody knows which version to correct. What is the key fix?",
      right: "Assign an owner for customer master data with authority to set rules and resolve conflicts",
      rightWhy: "Without ownership, conflicting records have no one to resolve them.",
      wrong: [
        { t: "Give everyone more training on data entry", why: "Training helps entry quality, but someone still has to decide which record is right." },
        { t: "Buy more storage for the duplicates", why: "Storing duplicates doesn't make them consistent." },
        { t: "Let each department keep the version it prefers", why: "That rebuilds the inconsistency silos cause." },
      ],
      sol: ["Who decides which record is authoritative?", "That accountability is data ownership."],
    },
    {
      q: "A company configured its new ERP to mirror its old 14-step paper approval exactly, and approvals are just as slow as before. What was missed?",
      right: "Process redesign: rethinking the approval flow before automating it",
      rightWhy: "Automating an inefficient process keeps it inefficient.",
      wrong: [
        { t: "Human validation of the approval outputs", why: "Checking outputs doesn't shorten a bloated process." },
        { t: "More servers to speed up the software", why: "The delay comes from the process steps, not computing power." },
        { t: "A different vendor's ERP", why: "Any system configured to the same 14 steps would be just as slow." },
      ],
      sol: ["The software faithfully copied the old process. Is that the problem?", "Yes: the process itself needed redesign."],
    },
    {
      q: "After a data glitch, an automatic replenishment rule ordered 10,000 units of a seasonal item, and nobody looked before the order went out. Which safeguard was missing?",
      right: "Human validation of unusual automated outputs before they're acted on",
      rightWhy: "A person reviewing out-of-pattern orders would have caught it.",
      wrong: [
        { t: "Process redesign of the sales process", why: "The issue was an unchecked automated output, not the sales process." },
        { t: "Data ownership of payroll records", why: "Payroll has nothing to do with the bad order." },
        { t: "Removing automation entirely", why: "Automation is fine with a human checkpoint for exceptions." },
      ],
      sol: ["Integrated systems can spread a mistake fast. Where should a person have looked?", "At the unusual output before it was sent: human validation."],
    },
    {
      q: "Buyers keep entering purchase orders with the wrong cost center because they never learned which field matters on the new screen. What is the best fix?",
      right: "Role-based training on the purchase-order screens buyers actually use",
      rightWhy: "The gap is skill with the new tool, so the fix is training.",
      wrong: [
        { t: "Make buyers the owners of the general ledger", why: "Ownership of the ledger doesn't teach the screen." },
        { t: "Phase the rollout more slowly", why: "The system is already in use; the buyers need to learn the field." },
        { t: "Go back to paper purchase orders", why: "That rebuilds manual re-entry and silos." },
      ],
      sol: ["Do people resist the system, or don't they know how to use it?", "They don't know how, so train them on their role's tasks."],
    },
  ];
  const HUMAN_TF = [
    { s: "Resistance to change is often a bigger barrier to integration than the technology itself.", truth: true, why: "The chapter calls the human factor the biggest barrier, so it needs leadership, communication and training." },
    { s: "If the software is configured correctly, process redesign is unnecessary.", truth: false, why: "Configuring software to copy an old, slow process keeps it slow. The process itself may need redesign." },
    { s: "Assigning data ownership clarifies who is accountable for the accuracy of shared records.", truth: true, why: "That is what data ownership does." },
    { s: "Human validation is only needed in the first week; after that, automated outputs can be trusted without review.", truth: false, why: "Data glitches and changing conditions can happen at any time, so unusual outputs always deserve a human check." },
    { s: "Training works best when it is tailored to the tasks each role will actually perform.", truth: true, why: "Role-based training focuses on what each person really does in the system." },
    { s: "Change management means switching to a different software vendor when users complain.", truth: false, why: "Change management is about helping people through the change: explaining why, communicating and involving them." },
  ];
  const READY = [
    { f: "Process redesign", ok: "Key processes redesigned and signed off by their managers", bad: "Key processes copied from the old system unchanged; no redesign sign-off" },
    { f: "Data ownership", ok: "Owners named for customer, product and supplier data", bad: "No one assigned to own customer, product or supplier data" },
    { f: "Training", ok: "Role-based training completed by 96% of users", bad: "Role-based training completed by only 41% of users" },
    { f: "Change management", ok: "All teams briefed on why the change is happening; concerns log reviewed", bad: "Teams not yet told why the change is happening; warehouse leads openly oppose it" },
    { f: "Human validation", ok: "Migrated balances reconciled to the old ledger, differences resolved", bad: "Migrated balances not yet checked against the old ledger" },
  ];

  const humanGen = STUDY.makeGenerator({
    id: "k201-ch7-human",
    name: "Human and organizational factors",
    blurb: "Name the human factor at work, pick the fix for a struggling rollout, and make a go-live call.",
    variants: [
      humSort[0], humSort[1], humSort[3], humSort[4],
      K.conceptVariant("Choose the fix", "ch7-hum", FIX),
      {
        name: "Go-live readiness call",
        make() {
          const allGood = Math.random() < 0.25;
          const failIdx = allGood ? -1 : U.randInt(0, READY.length - 1);
          const co = U.pick(COMPANIES);
          const rows = READY.map((r, i) => `<tr><td>${r.f}</td><td>${i === failIdx ? r.bad : r.ok}</td><td>${i === failIdx ? "✗" : "✓"}</td></tr>`).join("");
          const GO = "Go live as planned";
          const delay = f => `Delay go-live and fix ${f.toLowerCase()} first`;
          const right = allGood ? GO : delay(READY[failIdx].f);
          const distractF = U.sample(READY.map(r => r.f).filter((_, i) => i !== failIdx), allGood ? 3 : 2);
          const wrong = distractF.map(f => ({ t: delay(f), why: `The checklist shows ${f.toLowerCase()} is ready (✓), so delaying for it fixes nothing.` }));
          if (!allGood) wrong.push({ t: GO, why: `${READY[failIdx].f} is not ready. Going live anyway risks the rollout, since human and organizational factors decide whether integration succeeds.` });
          return Q.mc({
            q: `<p>${co}'s ERP project team presents its go-live readiness checklist:</p><table class="tbl"><thead><tr><th>Factor</th><th>Status</th><th>Ready?</th></tr></thead><tbody>${rows}</tbody></table><p>What should the steering committee decide?</p>`,
            right, rightWhy: allGood ? "Every human and organizational factor is ready, so there is no reason to delay." : `${READY[failIdx].f} is the gap: “${READY[failIdx].bad}.”`,
            wrong,
            sol: S("Scan each factor: process redesign, data ownership, training, change management, human validation. Is any of them not ready?",
              allGood ? "All five are ready → <b>go live as planned</b>." : `Only <b>${READY[failIdx].f}</b> fails (${READY[failIdx].bad}). Fix that before go-live; delaying for a factor that is already ready wastes time.`),
          });
        },
      },
      K.tfVariant("True or false", "ch7-hum", HUMAN_TF),
    ],
  });

  const generators = [traitsGen, sysGen, erpGen, dssGen, mapGen, siloGen, stratGen, humanGen];

  STUDY.registerUnit(C, {
    id: "ch7", order: 7,
    title: "Chapter 7 · Enterprise Systems: Integrating Processes, Data, and Decisions",
    short: "Ch 7 · Enterprise systems",
    description: "How CRM, SCM and ERP integrate processes and data, how decision support uses that data, and how to diagnose silos and recommend an integration approach.",
    notes, flashcards, cues, generators,
  });
})();
