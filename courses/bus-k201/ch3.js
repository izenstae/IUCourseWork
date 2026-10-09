/* ============================================================
 * BUS K201 · Chapter 3 · Information Systems in Business:
 * Operations, Decisions, and Strategy
 * Data / information / knowledge; the IS as a sociotechnical system
 * (people, process, data, technology) and human-in-the-loop review;
 * TPS / MIS / DSS / EIS and the performance benefits and risks of IS;
 * business processes, functional systems, ERP and BPR; Porter's Five
 * Forces, the generic strategies, and other IS sources of advantage.
 * All explanations, examples and scenarios are written for this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const { S, sortVariants, conceptVariant, tfVariant } = STUDY.k201;
  const C = "bus-k201";

  /* ---------- small local helpers ---------- */
  const NAMES = ["Maya", "Jordan", "Priya", "Luis", "Aisha", "Ben", "Chloe", "Diego", "Hana", "Isaac", "Keisha", "Mateo",
    "Nora", "Omar", "Quinn", "Rosa", "Tariq", "Uma", "Wes", "Yara", "Elena", "Malik", "Devon", "Grace"];
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const lc1 = t => t.charAt(0).toLowerCase() + t.slice(1);
  const pickVariants = (vs, names) => vs.filter(v => names.includes(v.name));

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Data, information and knowledge",
      lo: "Distinguish data, information and knowledge, and explain how an information system turns one into the next to support decisions.",
      html: `<p>Organizations drown in facts, but facts alone do not make decisions. The chapter separates three layers:</p>
<ul>
<li><b>Data</b>: raw, unorganized facts (numbers, words, symbols, timestamps) that mean little on their own. "41", "Friday", a column of part numbers.</li>
<li><b>Information</b>: data that has been organized, processed or put in context so it means something and can be compared, shared and used. "Average wait time on Friday was 41 minutes, double Thursday's."</li>
<li><b>Knowledge</b>: information combined with <b>experience, context and judgment</b> so that someone can draw a conclusion or decide what to do. "Fridays double because two technicians are off. Move one to Fridays."</li>
</ul>
<p>An <b>information system (IS)</b> is the set of interrelated components (people, processes and procedures, data, and technology) that <b>collect, process, store and distribute</b> information so an organization can make decisions, coordinate work and keep control. The technology can turn data into information very quickly. Turning information into knowledge still needs a person who understands the business.</p>
<div class="keyidea"><b>Key idea.</b> Data + organization/context = information. Information + experience and judgment = knowledge. The test for knowledge is a <em>conclusion or a decision</em>, not just a nicer-looking number.</div>
<div class="example"><b>Example.</b> A campus coffee cart's register logs every sale (data). A weekly report shows cold-brew sales are up 30% since the weather warmed (information). The owner, who remembers the same pattern last spring and knows finals week is coming, decides to double the cold-brew batch and add a second pickup line (knowledge).</div>
<div class="trap"><b>Common trap.</b> Calling a chart or dashboard "knowledge" because it looks polished. A summary, average or chart is still <em>information</em>. It becomes knowledge only when someone interprets it with experience and reaches a judgment about what it means or what to do.</div>`,
      gens: ["k201-ch3-dik"],
    },
    {
      title: "An IS is sociotechnical: people, process, data, technology",
      lo: "Analyze an information system as a sociotechnical system, identify its components and diagnose misalignment.",
      html: `<p>A common misconception is that an information system <em>is</em> its software and hardware. The chapter treats it as a <b>sociotechnical system</b>: a social side (people, culture, processes) and a technical side (hardware, software, data) that depend on each other. Sociotechnical systems theory says the whole performs well only when the two sides are <b>aligned</b>. Excellent software dropped into an organization that is not ready for it still fails.</p>
<p>The four components:</p>
<ul>
<li><b>People</b>: users, managers, developers and decision-makers. They interpret output, make judgment calls and invent workarounds. In a hospital, nurses, doctors, billing staff and patients all touch the same health record.</li>
<li><b>Processes and procedures</b>: the rules, workflows and routines that say how work gets done, such as the login steps (password plus a texted code) before you can see a bank balance.</li>
<li><b>Data and information</b>: what the system captures and produces. A point-of-sale system captures each sale and turns the stream into weekly sales reports, low-stock alerts and purchase histories.</li>
<li><b>Technology</b>: hardware, software and networks. It is the engine, but it does not drive itself.</li>
</ul>
<p>A handy diagnostic lens is <b>PPT (People, Process, Technology)</b>: Are the right people involved and prepared? Do the processes support the outcome we want? Does the technology enable the work? Data flows through and links all three.</p>
<p><b>Automation</b> means work done by the technology side. Not every IS aims to automate. A decision support system, for example, gives a person better information and leaves the decision with them.</p>
<p>Change is <b>easy on the technology side</b> (swap a keyboard, install an update) and <b>hard on the people side</b> (changing how people work, what they are rewarded for and how they feel about it). That is why most failed systems fail on alignment, not on code.</p>
<div class="keyidea"><b>Key idea.</b> When a new system disappoints, check the people and process sides before blaming the technology. Misalignment, not a bug, is the usual culprit.</div>
<div class="example"><b>Example.</b> A company buys a CRM, but sales reps are still paid only for closing deals fast. Logging every call slows them down, so they skip it, and the CRM becomes an expensive empty database. The fix is to change incentives and the sales process (people/process), not to buy a better CRM.</div>
<div class="trap"><b>Common trap.</b> "The technology works, so the system works." Self-checkout kiosks can scan perfectly and still create long lines and losses if nobody adjusted staffing (people) or wrote procedures for errors and theft (process).</div>`,
      gens: ["k201-ch3-ppt"],
    },
    {
      title: "Human in the loop: Sparky's HR Flow and blind filters",
      lo: "Explain where human review is needed in an automated information system.",
      html: `<p>In the chapter's simulation, Sparky's Auto Care moves hiring from paper to an HR system called <b>HR Flow</b>. The manager enters the job posting as structured data, and the system pushes it to job boards automatically and collects responses in an <b>Applicants</b> table. Gains: speed, structure, and no more lost paper applications.</p>
<p>Then a "Smart Screen" feature filters the table by an <b>exact text match</b> on the certification "ASE Master Certified." Applicants whose certification field says exactly that appear. Alex Mercer, with 12 years of experience and an advanced engine-performance certification (L1), does not, because his credential is worded differently. The most qualified applicant becomes invisible.</p>
<p>The rule did exactly what it was told. What it lacked was <b>business context</b>: a human recruiter would know that some credentials are equivalent or even stronger. Automation added a new risk: <b>blind algorithmic filtering</b>, which can produce flawed and potentially biased outcomes without anyone noticing.</p>
<p>Fixes keep a <b>human in the loop</b>:</p>
<ul>
<li>accept equivalent certifications, or maintain a list of acceptable credentials;</li>
<li><b>flag</b> non-matching applicants for review instead of <b>hiding</b> them;</li>
<li>have a person review the filtered-out pile before decisions are final.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Exact-match rules are fast and consistent but literal. Wherever a rule makes a consequential call about people, design in human review of what the rule excluded.</div>
<div class="example"><b>Example.</b> A scholarship portal auto-rejects anyone whose GPA field is blank. Transfer students whose GPA sits in a different field vanish. Changing "reject" to "flag for a reviewer" keeps the speed and restores judgment.</div>
<div class="trap"><b>Common trap.</b> Thinking the answer is to drop automation and go back to paper. The paper process lost applications and was slow. The better answer is to keep the system and add review where context matters.</div>`,
      gens: ["k201-ch3-ppt"],
    },
    {
      title: "IS types by management level: TPS, MIS, DSS, EIS",
      lo: "Explain how information systems support operations and managerial decisions at different levels.",
      html: `<p>Information systems serve two broad purposes: running daily <b>operations</b> and supporting <b>decisions</b>.</p>
<p><b>Transaction processing systems (TPS)</b> handle routine, repeatable, high-volume work: recording sales, running payroll, updating inventory, logging shipments. Their job is to process each transaction quickly, accurately and cheaply. They also produce the raw data the other systems summarize.</p>
<p>Decision needs change with the manager's level. In this chapter's mapping:</p>
<table class="tbl"><tr><th>Who</th><th>What they need</th><th>System</th></tr>
<tr><td>Operational managers</td><td>Routine, detailed reports: today's shift schedule, current inventory</td><td><b>MIS</b> (management information system)</td></tr>
<tr><td>Middle managers</td><td>Summarized performance data, such as monthly regional sales trends, for tactical decisions</td><td><b>DSS</b> (decision support system)</td></tr>
<tr><td>Senior executives</td><td>High-level strategic information: overall profitability, market-share trends</td><td><b>EIS</b> (executive information system)</td></tr></table>
<div class="keyidea"><b>Key idea.</b> Move up the organization and information gets more <b>summarized</b>, more <b>forward-looking</b> and more <b>strategic</b>; move down and it gets more <b>detailed</b>, <b>routine</b> and <b>current</b>. TPS sits underneath, capturing the transactions.</div>
<div class="example"><b>Example.</b> At a regional pharmacy chain, the register and prescription system (TPS) records every fill. A store supervisor's morning report of yesterday's unfilled prescriptions is MIS. A district manager comparing monthly fill rates across 12 stores to decide where to add a pharmacist is using a DSS. The CEO's dashboard of company-wide margin and market share is an EIS.</div>
<div class="trap"><b>Common trap.</b> Classifying by the <em>topic</em> instead of the <em>level and use</em>. "Sales" can show up in all four: recording a sale (TPS), today's sales by register (MIS), monthly sales trends by region (DSS), five-year market share (EIS).</div>`,
      gens: ["k201-ch3-istypes"],
    },
    {
      title: "Performance benefits, broader impact and new risks",
      lo: "Compare how IS improve efficiency, accuracy, speed, scalability, transparency and control, and identify the risks they introduce.",
      html: `<p>The chapter lists five ways an IS improves performance:</p>
<ul>
<li><b>Efficiency</b>: automating manual tasks cuts labor cost and time per task.</li>
<li><b>Accuracy</b>: less manual entry means fewer errors.</li>
<li><b>Speed</b>: real-time data lets people respond faster.</li>
<li><b>Scalability</b>: the business can grow without overhead growing in proportion.</li>
<li><b>Transparency and control</b>: activity is recorded and visible, so performance can be monitored and people held accountable.</li>
</ul>
<p>Beyond a single firm, IS have <b>flattened hierarchies</b> (fewer layers needed to pass information up and down), enabled <b>remote and global work</b>, and created <b>new industries and business models</b> such as ride-sharing and streaming.</p>
<p>They also bring <b>new risks</b>: cybersecurity threats, data-privacy obligations, and <b>dependence</b> on systems that must be maintained, secured and updated (when the system is down, the business may be down). Automated rules can also filter or decide blindly, as Sparky's showed.</p>
<div class="keyidea"><b>Key idea.</b> Name the benefit by the <em>mechanism</em>: fewer people-hours → efficiency; fewer mistakes → accuracy; faster reaction → speed; growth without proportional cost → scalability; visible, auditable activity → transparency and control.</div>
<div class="example"><b>Example.</b> A food bank moves volunteer sign-ups online. Staff stop re-typing paper forms (efficiency), names and phone numbers are no longer misread (accuracy), coordinators see a gap in Saturday coverage the moment it appears (speed), a second site uses the same system with no new staff (scalability), and every shift change is logged (transparency). It now also holds volunteers' personal data that must be protected (risk).</div>
<div class="trap"><b>Common trap.</b> Mixing up efficiency and speed. Efficiency is about using <em>fewer resources</em> for a task; speed is about <em>reacting sooner</em> because information is current. A report that saves a clerk two hours is efficiency; a real-time alert that lets you fix a problem today instead of next week is speed.</div>`,
      gens: ["k201-ch3-istypes"],
    },
    {
      title: "Business processes and cross-functional work",
      lo: "Describe common business processes and explain how different functions share data within one process.",
      html: `<p>A <b>business process</b> is a set of related, structured activities that produce a product or service for a customer (internal or external). Three end-to-end processes show up in almost every organization:</p>
<ul>
<li><b>Order-to-cash</b>: from a customer's order through fulfillment and invoicing to <em>receiving the payment</em>.</li>
<li><b>Procure-to-pay</b>: from identifying a need and buying from a supplier to <em>paying that supplier</em>.</li>
<li><b>Hire-to-retire</b>: the whole employee lifecycle, from posting a job and hiring to development, pay and, eventually, separation or retirement.</li>
</ul>
<p>Processes cut <b>across</b> departments. One customer order is recorded by sales, fulfilled and shipped by operations, billed and booked as revenue by accounting, and followed up by customer service. Each hand-off needs the <em>same</em> order data.</p>
<div class="keyidea"><b>Key idea.</b> Read the process name as "start → end": order → cash (the customer pays us), procure → pay (we pay the supplier), hire → retire (an employee's whole career with us).</div>
<div class="example"><b>Example.</b> At an auto shop, ordering brake pads from a distributor, checking the delivery against the purchase order, and paying the distributor's invoice are procure-to-pay. Writing up a customer's repair, doing the job, and collecting payment at pickup is order-to-cash.</div>
<div class="trap"><b>Common trap.</b> Mixing up the two money flows. Sending an invoice to a <em>customer</em> and recording their payment is order-to-cash. Receiving a <em>supplier's</em> invoice and paying it is procure-to-pay. Ask: is money coming in or going out?</div>`,
      gens: ["k201-ch3-process"],
    },
    {
      title: "Functional systems, ERP and process reengineering",
      lo: "Describe functional and integrated (enterprise) systems and how they support business processes.",
      html: `<p><b>Functional area systems</b> serve one part of the business:</p>
<ul>
<li><b>Accounting and finance</b>: revenues, expenses, budgets, payroll, financial reporting, compliance.</li>
<li><b>Human resources</b>: recruiting, hiring, benefits, performance reviews, employee records.</li>
<li><b>Marketing and sales</b>: customer interactions, campaigns, buying patterns, usually through a <b>CRM</b> (customer relationship management) system.</li>
<li><b>Operations and supply chain</b>: production scheduling, inventory, logistics, suppliers, usually through <b>SCM</b> (supply chain management).</li>
</ul>
<p>When each function keeps its own copy of shared data, the copies drift apart. Different versions of one order record lead to wrong shipments, billing errors and confused customer service. An <b>enterprise resource planning (ERP)</b> system is a large integrated platform that keeps data and processes for many functions in <b>one system</b>, so everyone works from the same real-time information: less duplicate entry, fewer inconsistencies, and a full picture of the business.</p>
<p><b>Business process reengineering (BPR)</b> goes further than automating the current steps. It uses new technology to <b>redesign</b> an inefficient process from scratch, for example replacing paper refund forms that took weeks with a self-service portal that takes minutes.</p>
<div class="keyidea"><b>Key idea.</b> Functional systems optimize a department; ERP integrates departments around shared data; BPR rethinks the process itself instead of paving the old cow path.</div>
<div class="example"><b>Example.</b> A furniture maker's sales team promises a delivery date from its CRM while the factory's scheduling system shows the item is backordered. Customers get angry calls. On a shared ERP, the sales rep sees the same inventory and schedule the factory sees before promising anything.</div>
<div class="trap"><b>Common trap.</b> Thinking BPR means "put the paper form online." Scanning the same 6-signature form into a PDF automates the old process. Reengineering asks why six signatures are needed at all and redesigns the flow.</div>`,
      gens: ["k201-ch3-functional"],
    },
    {
      title: "Competitive advantage and Porter's Five Forces",
      lo: "Apply Porter's Five Forces to analyze an industry and identify IS responses.",
      html: `<p><b>Competitive advantage</b> is the ability to outperform rivals by delivering greater value, keeping costs lower, or owning unique capabilities that are hard to copy. Porter's <b>Five Forces</b> describe the pressures on an industry's profits. The <b>stronger</b> a force, the <b>lower</b> the profit potential.</p>
<table class="tbl"><tr><th>Force</th><th>Strong (high) when…</th></tr>
<tr><td><b>Bargaining power of buyers</b></td><td>customers have many alternatives, can switch easily, buy in large volumes, can push down price or demand better terms</td></tr>
<tr><td><b>Bargaining power of suppliers</b></td><td>there are few suppliers of an important input, switching suppliers is costly, the firm depends heavily on them</td></tr>
<tr><td><b>Rivalry among competitors</b></td><td>many competitors chase the same customers, the industry grows slowly, offerings are hard to tell apart, price competition is intense</td></tr>
<tr><td><b>Threat of substitutes</b></td><td>customers can meet the <em>same need</em> with a <em>different</em> kind of product or service at an attractive price/performance</td></tr>
<tr><td><b>Threat of new entrants</b></td><td>entering takes little capital and faces few regulatory, technical, distribution or customer-loyalty barriers</td></tr></table>
<p>IS can push forces in a firm's favor: a loyalty program raises buyers' switching costs; a proprietary logistics system is too expensive for a newcomer to copy (a barrier to entry); procurement systems that compare many suppliers reduce supplier leverage. The forces keep changing, so information is also how a firm <b>detects</b> shifts and reacts. Even routine "on sale" pricing touches several forces: it intensifies rivalry and trains buyers to expect discounts.</p>
<div class="keyidea"><b>Key idea.</b> Identify the force by <em>who</em> holds the pressure (customers, suppliers, current rivals, a different product, a would-be competitor), then rate it high or low by the conditions in the table.</div>
<div class="example"><b>Example.</b> Grocery delivery apps: customers can switch apps in seconds (buyer power high); several apps chase the same households with promo codes (rivalry high); shoppers can simply drive to the store (substitute); and launching a new app needs drivers, partner stores and marketing (some entry barriers).</div>
<div class="trap"><b>Common trap.</b> Confusing <b>substitutes</b> with <b>rivals</b>. Another pizza place is a rival. A frozen pizza, a meal kit or a sandwich shop meeting the same "quick dinner" need in a different way is a substitute. Also: a new company that has <em>not yet entered</em> is the threat of new entrants, not rivalry.</div>`,
      gens: ["k201-ch3-forces"],
    },
    {
      title: "Generic strategies and the IS that support them",
      lo: "Classify businesses by generic strategy and recommend a competitive approach with supporting IS capabilities.",
      html: `<p>Porter's generic strategies combine two choices: <b>how</b> you create value (lowest cost vs. something unique) and <b>where</b> you compete (a broad market vs. a narrow segment).</p>
<table class="tbl"><tr><th></th><th>Lower cost</th><th>Differentiation</th></tr>
<tr><td><b>Broad market</b></td><td><b>Cost leadership</b>: lowest cost across the market through efficient supply chains, standardized processes and automation</td><td><b>Differentiation</b>: something customers value and pay more for (quality, features, service, convenience, brand)</td></tr>
<tr><td><b>Narrow segment</b></td><td><b>Cost focus</b>: lowest cost for one region, industry or customer group, often with simplified operations</td><td><b>Differentiation focus</b>: a specialized product or service designed around one segment's needs</td></tr></table>
<p>IS can support any of the four, but an IS investment creates value only when it supports the chosen strategy. Cost leaders invest in automation, inventory optimization and supplier integration. Differentiators invest in CRM, personalization and features. Focusers tailor systems to the niche, either lean and cheap or deeply specialized.</p>
<div class="keyidea"><b>Key idea.</b> Ask two questions: "Do customers choose them mainly for low price or for something special?" and "Do they serve almost everyone or one defined group?" The answers place the business in one quadrant.</div>
<div class="example"><b>Example.</b> An auto shop that only services the delivery vans of local courier companies, at the lowest rates in the county, is pursuing <b>cost focus</b>. A fleet-maintenance tracker that schedules every van's service automatically and cuts paperwork fits that strategy. A glossy customer app with loyalty badges does not.</div>
<div class="trap"><b>Common trap.</b> Treating "small" or "local" as automatically "focus," or "expensive" as automatically "differentiation." Focus means the business deliberately targets a <em>narrow segment</em>. A national premium brand is differentiation, not differentiation focus, and a small shop that serves anyone is not focused just because it is small.</div>`,
      gens: ["k201-ch3-generic"],
    },
    {
      title: "Other IS sources of advantage, and why advantage fades",
      lo: "Explain switching costs, network effects, data as an asset and first-mover advantage, and what makes an IS advantage sustainable.",
      html: `<p>Besides the forces and generic strategies, the chapter names four more ways IS create an edge:</p>
<ul>
<li><b>Switching costs</b>: the system is so embedded in the customer's work that leaving is painful. Accounting software holding years of a firm's records is the classic case.</li>
<li><b>Network effects</b>: the service becomes more valuable as more people use it. More riders attract more drivers, which shortens waits and attracts more riders. Social media works the same way.</li>
<li><b>Data as an asset</b>: collecting and analyzing customer data to spot trends, predict needs and personalize offers.</li>
<li><b>First-mover advantage</b>: being first to implement a technology can win brand recognition and loyalty before competitors arrive.</li>
</ul>
<p>Advantage built on technology alone is <b>rarely permanent</b>: competitors can buy or copy the same tools. <b>Sustainable</b> advantage comes from combining technology with things that are hard to copy, such as unique processes, culture, expertise and accumulated data. That is the sociotechnical idea again.</p>
<div class="keyidea"><b>Key idea.</b> Ask "Why can't a rival just buy the same software next year?" If the honest answer is "they can," the advantage is temporary. Durable advantage lives in how people, processes and data are woven around the technology.</div>
<div class="example"><b>Example.</b> Two bike shops buy the same booking software. One also trains mechanics to log every repair's details and uses that history to text riders before parts wear out; customers come to rely on the reminders. Rivals can copy the software in a week but not years of service records and the habits built around them.</div>
<div class="trap"><b>Common trap.</b> Confusing network effects with simply being big or popular. A network effect means each <em>additional user makes the product more valuable to the other users</em>. A popular sandwich is not better for you because others eat it; a messaging app is.</div>`,
      gens: ["k201-ch3-advantage"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const fc = (id, tag, front, back) => ({ id: "k201-ch3-c-" + id, tag, front, back });
  const flashcards = [
    fc("data", "Definition", "What is <em>data</em>?", "Raw, unorganized facts (numbers, words, symbols) with no meaning on their own, such as “72” or a list of zip codes."),
    fc("information", "Definition", "What is <em>information</em>?", "Data that has been organized, processed or put in context so it is meaningful and usable, e.g. “72% of last Tuesday's survey respondents were satisfied.”"),
    fc("knowledge", "Definition", "What is <em>knowledge</em>?", "Information combined with experience, context and judgment so someone can draw a conclusion or make a decision."),
    fc("dik-diff", "Distinction", "What turns information into knowledge? Give an example.", "Human experience and judgment. A report shows three months of falling satisfaction (information); a manager who knows the checkout was redesigned concludes the new checkout is the cause and orders a fix (knowledge)."),
    fc("is", "Definition", "Define an <em>information system</em>.", "A set of interrelated components (people, processes and procedures, data, technology) that collect, process, store and distribute information to support decision-making, coordination and control."),
    fc("sociotech", "Concept", "Why is an IS called a <em>sociotechnical</em> system?", "Because its social side (people, culture, processes) and technical side (hardware, software, data) are interdependent; it performs well only when both are aligned."),
    fc("ppt", "Framework", "What three questions does the PPT lens ask?", "People: are the right people involved and prepared? Process: do processes support the intended outcome? Technology: does the technology enable the work? Data flows through all three."),
    fc("components", "List", "Name the four components of an IS.", "People; processes and procedures; data and information; technology (hardware, software, networks)."),
    fc("automation", "Concept", "What is automation, and does every IS aim to automate?", "Work performed by the technology side. No: a decision support system, for instance, informs a human decision rather than replacing it."),
    fc("change", "Why", "Why is change harder on the people side than the technology side?", "Swapping hardware or installing an update is quick; changing how people work, what they are rewarded for and their attitudes takes time, training and buy-in."),
    fc("misalign", "Example", "Give an example of misalignment where the technology was not the problem.", "A CRM adopted while sales reps are still rewarded only for closing fast: reps skip data entry and the CRM sits empty. The incentive (people/process) was misaligned."),
    fc("sparky", "Case", "What went wrong with Sparky's HR Flow “Smart Screen”?", "An exact-text match on “ASE Master Certified” hid Alex Mercer, a highly qualified applicant with a differently worded advanced certification. The rule lacked business context."),
    fc("hitl", "Why", "How do you keep a human in the loop in a screening system? Name two fixes.", "Accept equivalent credentials or keep a list of acceptable ones; flag non-matches instead of hiding them; have a person review the filtered-out applicants."),
    fc("tps", "Definition", "What does a <em>TPS</em> do?", "A transaction processing system handles routine, repeatable, high-volume transactions (sales, payroll, inventory updates, shipments) quickly, accurately and cheaply."),
    fc("levels", "List", "Match MIS, DSS and EIS to management levels (per this chapter).", "Operational managers → MIS (routine detailed reports); middle managers → DSS (summarized performance data for tactical decisions); senior executives → EIS (high-level strategic information)."),
    fc("benefits", "List", "Name the five performance benefits of IS.", "Efficiency, accuracy, speed, scalability, transparency and control."),
    fc("eff-speed", "Distinction", "What is the difference between efficiency and speed as IS benefits?", "Efficiency = fewer resources (labor, cost, time) per task through automation. Speed = faster response because data is real-time."),
    fc("risks", "List", "What new risks do information systems introduce?", "Cybersecurity threats, data-privacy obligations, and dependence on systems that must be maintained, secured and updated (plus blind automated decisions)."),
    fc("impact", "Concept", "Name three broader impacts of IS on organizations and society.", "Flatter hierarchies; remote and global work; new industries and business models (ride-sharing, streaming)."),
    fc("process", "Definition", "What is a <em>business process</em>?", "A set of related, structured activities that produce a product or service for a customer."),
    fc("o2c", "Process", "What does <em>order-to-cash</em> cover?", "From the customer's order through fulfillment and invoicing to receiving the customer's payment."),
    fc("p2p", "Process", "What does <em>procure-to-pay</em> cover?", "From identifying a need and purchasing from a supplier to receiving the goods and paying the supplier."),
    fc("h2r", "Process", "What does <em>hire-to-retire</em> cover?", "The full employee lifecycle: recruiting and hiring, onboarding, pay, performance and development, through separation or retirement."),
    fc("functional", "List", "Name the four functional area systems and one job of each.", "Accounting & finance (budgets, payroll, reporting); HR (recruiting, benefits, reviews); marketing & sales / CRM (customer interactions, campaigns); operations & supply chain / SCM (scheduling, inventory, logistics)."),
    fc("erp", "Definition", "What is ERP and what problem does it solve?", "Enterprise resource planning: one integrated platform for many functions' data and processes, so everyone uses the same real-time information. It cures duplicate, inconsistent records across departments."),
    fc("bpr", "Definition", "What is business process reengineering?", "Using new technology to redesign an inefficient process altogether, not just automate the old steps (e.g. paper refund forms → self-service portal, weeks → minutes)."),
    fc("advantage", "Definition", "What is <em>competitive advantage</em>?", "The ability to outperform rivals by offering greater value, lower costs, or unique capabilities that are hard to copy."),
    fc("forces", "List", "Name Porter's Five Forces.", "Bargaining power of buyers; bargaining power of suppliers; rivalry among existing competitors; threat of substitutes; threat of new entrants."),
    fc("forces-strong", "Concept", "What does a strong force mean for profits?", "Stronger forces reduce an industry's profit potential."),
    fc("buyers", "Conditions", "When is buyer power high?", "Customers have many alternatives, can switch easily, buy in large volume, and can pressure prices or terms."),
    fc("suppliers", "Conditions", "When is supplier power high?", "Few suppliers of an important input, costly to switch suppliers, heavy dependence on them."),
    fc("subs-rivals", "Distinction", "What is the difference between a rival and a substitute?", "A rival sells the same kind of product to the same customers; a substitute meets the same need with a different kind of product (video calls vs. business flights)."),
    fc("entrants", "Conditions", "When is the threat of new entrants high? Give an IS barrier.", "Entry needs little capital and faces few regulatory, technical, distribution or loyalty barriers. A proprietary logistics or data system too costly to copy raises the barrier."),
    fc("generic", "List", "Name the four generic strategies and the two dimensions behind them.", "Cost leadership, differentiation, cost focus, differentiation focus. Dimensions: source of value (low cost vs. uniqueness) and scope (broad vs. narrow)."),
    fc("cf-df", "Distinction", "Cost focus vs. differentiation focus?", "Both serve a narrow segment; cost focus wins it with the lowest cost, differentiation focus with a specialized offering designed around that segment's needs."),
    fc("switching", "Concept", "How can an IS create switching costs? Give an example.", "By embedding itself in the customer's workflow so leaving is painful, e.g. accounting software holding years of a firm's records."),
    fc("network", "Concept", "What is a network effect?", "A product becomes more valuable to each user as more people use it, e.g. ride-sharing (more riders ↔ more drivers) or social media."),
    fc("data-asset", "Concept", "What does “data as an asset” mean?", "Collecting and analyzing customer data to spot trends, predict needs and personalize offers in ways rivals cannot."),
    fc("first-mover", "Concept", "What is first-mover advantage, and its weakness?", "Being first to implement a technology can win recognition and loyalty; but competitors can copy the technology later."),
    fc("sustain", "Why", "What makes an IS-based advantage sustainable?", "Combining technology with unique processes, culture, expertise and data that rivals cannot simply buy. Technology alone is usually copied."),
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "Bare numbers, codes, timestamps, unsorted lists", think: "Data", why: "Raw facts with no organization or context yet." },
    { when: "Totals, averages, percentages, charts, comparisons, reports", think: "Information", why: "Data has been organized and given context so it can be used." },
    { when: "“concludes”, “realizes”, “decides”, “based on experience”", think: "Knowledge", why: "A person applied judgment and context to information." },
    { when: "“The software works but nobody uses it / people work around it”", think: "Sociotechnical misalignment (PPT)", why: "Check people (training, incentives) and process (workflow, procedures), not just technology." },
    { when: "Exact-match rule, auto-reject, applicant “disappeared”", think: "Human in the loop", why: "Literal rules lack business context; flag instead of hide, review exclusions." },
    { when: "Routine, high-volume: sales, payroll, scans, orders", think: "TPS", why: "Processes individual transactions quickly, accurately, cheaply." },
    { when: "Today's schedule, current inventory, detailed daily report", think: "MIS (operational managers)", why: "Routine detailed reports for running today's operations." },
    { when: "Monthly/regional trends, what-if, tactical choice by a middle manager", think: "DSS", why: "Summarized performance data to support tactical decisions." },
    { when: "Company-wide profitability, market share, multi-year trends for top leaders", think: "EIS", why: "High-level strategic information for senior executives." },
    { when: "Grow without proportional staff or cost", think: "Scalability", why: "The system absorbs volume that would otherwise need more people." },
    { when: "Logged, audited, visible to managers, accountability", think: "Transparency and control", why: "Recorded activity lets performance be monitored." },
    { when: "Customer order → shipment → invoice → payment received", think: "Order-to-cash", why: "Money comes in from a customer." },
    { when: "Requisition → purchase order → receipt → supplier invoice → payment", think: "Procure-to-pay", why: "Money goes out to a supplier." },
    { when: "Departments have conflicting copies of the same record", think: "ERP / integration", why: "One shared real-time database removes duplicate, inconsistent data." },
    { when: "Redesign the process from scratch using new technology", think: "Business process reengineering", why: "BPR rethinks the steps instead of automating the old ones." },
    { when: "A different kind of product meets the same need", think: "Threat of substitutes", why: "Not a rival in the same industry; an alternative way to satisfy the need." },
    { when: "Few suppliers, critical input, costly to switch vendors", think: "High supplier power", why: "The firm depends on suppliers who can dictate terms." },
    { when: "Cheap to start, no licenses, no loyalty barriers", think: "High threat of new entrants", why: "Little stops a newcomer from entering." },
    { when: "Narrow segment + specialized offering", think: "Differentiation focus", why: "Unique value designed for one group." },
    { when: "Each new user makes it better for every other user", think: "Network effect", why: "Value grows with the number of users." },
    { when: "Leaving would mean losing years of records or retraining everyone", think: "Switching costs", why: "Embedded systems make customers reluctant to leave." },
  ];

  /* ============================================================
   * TOPIC 1 · Data, information, knowledge
   * ============================================================ */
  const DIK_DEFS = {
    Data: "raw, unorganized facts with no meaning on their own",
    Information: "data organized, processed or put in context so it is meaningful and usable",
    Knowledge: "information plus experience, context and judgment, leading to a conclusion or decision",
  };
  const DIK_BANK = [
    { t: "The number 1,284 in a spreadsheet cell with no column heading.", cat: "Data", why: "Without a label or context, nobody can tell what 1,284 means." },
    { t: "A list of 400 zip codes copied from shipping labels, not grouped or counted.", cat: "Data", why: "Unorganized raw facts; nothing has been summarized or compared." },
    { t: "A barcode scan record: 0049000028911 at 14:02:07.", cat: "Data", why: "A single raw transaction record; no meaning has been extracted yet." },
    { t: "Individual star ratings (4, 2, 5, 5, 3, …) as they stream in from an app.", cat: "Data", why: "Raw, unsorted values; nobody has averaged or compared them." },
    { t: "Raw GPS pings from a delivery van, one every five seconds.", cat: "Data", why: "Coordinates and timestamps with no processing into routes or times." },
    { t: "A column of employee ID numbers exported from the time clock.", cat: "Data", why: "Just identifiers; no hours, totals or comparisons yet." },
    { t: "The word “Thursday” and the number 38 written on a sticky note.", cat: "Data", why: "Isolated facts; there is no context to tell what 38 refers to." },
    { t: "Average delivery time in Indianapolis was 41 minutes last week, up from 33 the week before.", cat: "Information", why: "Raw times have been averaged and compared, so the numbers mean something." },
    { t: "A chart showing that 64% of last month's returns came from one product line.", cat: "Information", why: "Returns data was organized and summarized into a usable pattern." },
    { t: "A report listing the five best-selling menu items at each store for October.", cat: "Information", why: "Sales data sorted and grouped so it can be used and compared." },
    { t: "Customer satisfaction scores grouped by store and compared with last quarter.", cat: "Information", why: "Organized and placed in context, but no one has drawn a conclusion yet." },
    { t: "An inventory alert: “Only 6 brake-pad sets left at the north warehouse.”", cat: "Information", why: "Inventory counts processed into a meaningful, actionable message." },
    { t: "A summary showing that weekend shifts averaged 18% overtime this month.", cat: "Information", why: "Time-clock data was totaled and compared, giving it meaning." },
    { t: "After three straight months of falling scores, a manager concludes the new checkout screen frustrates customers and orders a redesign.", cat: "Knowledge", why: "The manager adds context and judgment to information and reaches a decision." },
    { t: "A veteran buyer recognizes that a supplier's “temporary” delays always come before a price increase, so she locks in a contract now.", cat: "Knowledge", why: "Experience turns a pattern in information into a decision." },
    { t: "Seeing repeat repairs cluster on one technician's jobs, a shop owner decides the technician needs refresher training on one system rather than discipline.", cat: "Knowledge", why: "Judgment interprets the report and chooses an action." },
    { t: "A store manager knows the spike in umbrella sales on the report was weather-driven, so he does not double the next order.", cat: "Knowledge", why: "Context explains the information and shapes the decision." },
    { t: "An analyst recognizes a dip in web traffic as the August pattern she has seen every year and advises the team not to change the ad budget.", cat: "Knowledge", why: "Experience lets her interpret the information and recommend an action." },
    { t: "A nurse manager judges that rising night-shift overtime reflects understaffing and recommends hiring two nurses.", cat: "Knowledge", why: "Information plus professional judgment leads to a recommendation." },
  ];
  const DIK_CHAINS = [
    { ctx: "a campus coffee shop",
      d: "Register lines: 7:02 latte $5.25; 7:03 muffin $3.10; 7:05 latte $5.25 …",
      i: "Lattes were 38% of morning revenue last week, up from 30% the week before.",
      k: "Knowing the oat-milk option launched last week, the owner concludes it is drawing morning customers and adds a second espresso machine." },
    { ctx: "Sparky's Auto Care",
      d: "Repair-order lines: RO 5521, brake pads, 2.4 hrs; RO 5522, oil change, 0.5 hrs …",
      i: "Brake jobs averaged 2.1 hours this month against a 1.5-hour standard.",
      k: "The service manager recognizes the overruns began when a new vendor started shipping mismatched pads, and switches vendors." },
    { ctx: "a university dining hall",
      d: "Card-swipe timestamps from the dining hall door, one row per swipe.",
      i: "Dinner traffic peaks between 6:00 and 6:30 pm at about 900 swipes.",
      k: "Aware that evening labs end at 5:50, the director staggers staff breaks so the full crew is on the line at 6:00." },
    { ctx: "an online clothing store",
      d: "Cart events: user 8812 added item 31; user 8812 left the page; user 9040 added item 7 …",
      i: "Cart abandonment rose to 72% after shipping cost moved to the final checkout step.",
      k: "The e-commerce lead concludes surprise shipping fees are driving people away and shows the shipping cost on each product page." },
    { ctx: "a family medicine clinic",
      d: "Each patient's check-in time and appointment time.",
      i: "Average wait was 34 minutes on Mondays versus 12 minutes on other days.",
      k: "The office manager knows one physician does hospital rounds on Monday mornings, so she shifts that doctor's Monday appointments an hour later." },
    { ctx: "a regional food bank",
      d: "Donation log entries: 6/3 canned beans 40 lb; 6/3 rice 25 lb; 6/4 cereal 12 lb …",
      i: "Protein donations fell 45% this summer compared with last summer.",
      k: "Remembering that school food drives stop in summer, the director asks local grocers for a June protein drive." },
  ];
  const DIK_CONCEPT = [
    { q: "What has to be added to <b>data</b> to turn it into <b>information</b>?", right: "Organization, processing or context, so the facts mean something",
      rightWhy: "Sorting, summarizing, labeling and comparing give raw facts meaning.",
      wrong: [{ t: "Personal experience and judgment", why: "That is what turns information into knowledge, one step later." },
        { t: "More data points of the same kind", why: "More raw facts are still raw; volume alone adds no meaning." },
        { t: "Faster hardware", why: "Technology can speed processing, but meaning comes from organization and context." }],
      sol: ["Information is data that has been made meaningful.", "The step from data to information is organizing, processing and adding context; judgment comes later."] },
    { q: "What has to be added to <b>information</b> to turn it into <b>knowledge</b>?", right: "Experience, context and judgment applied by a person",
      rightWhy: "Knowledge is information that someone interprets to reach a conclusion or decision.",
      wrong: [{ t: "A better chart", why: "A clearer display is still information until someone draws a conclusion from it." },
        { t: "Converting it back to raw numbers", why: "That moves backwards toward data." },
        { t: "Storing it in a larger database", why: "Storage does not create judgment." }],
      sol: ["Knowledge is the layer where a conclusion or decision appears.", "Experience and judgment applied to information produce knowledge."] },
    { q: "Two managers look at the same sales report. One concludes the dip is seasonal; the other concludes a competitor stole customers. What does this show?", right: "Knowledge depends on each person's experience and context, so the same information can yield different conclusions",
      rightWhy: "The information is identical; the knowledge differs because judgment differs.",
      wrong: [{ t: "The report must contain errors", why: "Nothing suggests the data is wrong; interpretation is what differs." },
        { t: "The report is really just data", why: "A report with totals and trends is information." },
        { t: "Information systems cannot support decisions", why: "The IS supplied useful information; people still supply judgment." }],
      sol: ["Ask which layer is the same for both managers and which differs.", "Same information, different experience → different knowledge."] },
    { q: "Which statement best describes the role of an information system in decision-making?", right: "It collects, processes, stores and distributes information so people can coordinate, control and decide",
      rightWhy: "That is the chapter's definition of an IS's purpose.",
      wrong: [{ t: "It replaces managers' judgment with automatic decisions in every case", why: "Many IS (like a DSS) inform decisions rather than make them; judgment stays with people." },
        { t: "It is the hardware and software that store data", why: "That is only the technology component; an IS also includes people, processes and data." },
        { t: "It turns information back into raw data for storage", why: "Its job is to turn data into usable information, not the reverse." }],
      sol: ["Recall the four verbs in the definition of an IS.", "Collect, process, store, distribute, in support of decisions, coordination and control."] },
    { q: "A dashboard turns 50,000 rows of transactions into a one-line message: “Returns up 22% this month.” Which layer is that message?", right: "Information",
      rightWhy: "The rows were processed into a meaningful summary, but no one has interpreted or acted on it yet.",
      wrong: [{ t: "Data", why: "Raw rows are data; the summary has been processed and given meaning." },
        { t: "Knowledge", why: "Knowledge would need someone to interpret why returns rose and decide what to do." },
        { t: "Technology", why: "Technology is an IS component, not a layer of the data–information–knowledge chain." }],
      sol: ["Has the data been processed? Has anyone drawn a conclusion?", "Processed but not yet interpreted → information."] },
  ];
  const DIK_TF = [
    { s: "A chart that summarizes last month's sales is an example of knowledge.", truth: false, why: "A summary or chart is information. It becomes knowledge only when someone interprets it and reaches a conclusion.", hint: "What must a person add to information?" },
    { s: "The same piece of information can lead two experienced managers to different knowledge.", truth: true, why: "Knowledge adds each person's experience and judgment, which can differ.", hint: "Where does judgment enter the chain?" },
    { s: "Data such as “72” is meaningless on its own until it is organized or placed in context.", truth: true, why: "Raw data needs context (72 what? when?) to become information.", hint: "Recall what separates data from information." },
    { s: "An information system is mainly its hardware and software.", truth: false, why: "An IS includes people, processes and procedures, data, and technology.", hint: "Count the components in the definition." },
    { s: "Turning information into knowledge requires human experience, context and judgment.", truth: true, why: "That is exactly what distinguishes knowledge from information.", hint: "What is the extra ingredient in knowledge?" },
    { s: "Collecting more raw data automatically produces more knowledge.", truth: false, why: "More raw facts are still data; they must be organized (information) and interpreted (knowledge).", hint: "Does volume add meaning or judgment?" },
  ];

  const genDik = STUDY.makeGenerator({
    id: "k201-ch3-dik",
    name: "Data, information, knowledge",
    blurb: "Tell raw facts from organized information and from judgment-based knowledge.",
    variants: [
      ...sortVariants({ key: "ch3-dik", bank: DIK_BANK, cats: ["Data", "Information", "Knowledge"], defs: DIK_DEFS, ask: "item",
        hint: "Ask two questions: has anyone organized or summarized it (information)? Has anyone drawn a conclusion or decision from it (knowledge)?" }),
      {
        name: "Same context, three layers",
        make() {
          const c = U.rotate("ch3-dik-chain", DIK_CHAINS);
          return Q.classify({
            q: `<p>All three items come from <b>${c.ctx}</b>. Classify each one.</p>`,
            cats: ["Data", "Information", "Knowledge"],
            items: [
              { t: c.d, cat: "Data", why: "Raw records with no summarizing or context." },
              { t: c.i, cat: "Information", why: "The records were organized and compared so they mean something, but no decision yet." },
              { t: c.k, cat: "Knowledge", why: "A person used experience and context to reach a conclusion and act." },
            ],
            sol: S("When the topic is the same, look for the <em>process</em>: raw records → summarized pattern → someone's conclusion.",
              `Data: the raw log. Information: “${c.i}” Knowledge: the step where a person explains the pattern and decides what to do.`),
          });
        },
      },
      {
        name: "Climb the ladder (reverse)",
        make() {
          const c = U.rotate("ch3-dik-chain2", DIK_CHAINS);
          const others = DIK_CHAINS.filter(x => x !== c);
          const o = U.sample(others, 2);
          return Q.mc({
            q: `<p>At ${c.ctx}, a report says: “${c.i}”</p><p>Which next step turns this <b>information</b> into <b>knowledge</b>?</p>`,
            right: c.k, rightWhy: "A person applies experience and context to explain the pattern and decide what to do.",
            wrong: [
              { t: c.d, why: "That goes backwards: it is the raw data the report was built from." },
              { t: "Re-drawing the same figures as a colorful bar chart for the team.", why: "A new display is still information; nobody has interpreted it." },
              { t: "Exporting the underlying records to a bigger database.", why: "Storage adds no judgment or conclusion." },
            ],
            sol: S("Knowledge appears when someone explains <em>why</em> and decides <em>what to do</em>.",
              `The right step: “${c.k}” Everything else either repackages the information or goes back to raw data.`),
          });
        },
      },
      conceptVariant("Explain the chain", "ch3-dik", DIK_CONCEPT),
    ],
  });

  /* ============================================================
   * TOPIC 2 · Sociotechnical system: PPT, components, human in the loop
   * ============================================================ */
  const COMP_DEFS = {
    People: "users, managers, developers and decision-makers who interpret, judge and work around",
    "Processes & procedures": "rules, workflows and routines for how work gets done",
    "Data & information": "the facts captured and the reports, alerts and histories produced from them",
    Technology: "hardware, software and networks",
  };
  const COMP_BANK = [
    { t: "Nurses, physicians and billing clerks who all read and update the same patient record.", cat: "People", why: "These are the users whose skills and habits shape how the system is used." },
    { t: "A sales rep deciding whether a lead in the CRM is worth a follow-up call.", cat: "People", why: "Human judgment applied to the system's output." },
    { t: "The developer who maintains the HR system's screening rules.", cat: "People", why: "Developers are part of the people component." },
    { t: "A store manager who invents a workaround when the kiosk freezes.", cat: "People", why: "Workarounds come from people adapting to the system." },
    { t: "Customers who request refunds through a self-service portal.", cat: "People", why: "Customers are users of the system too." },
    { t: "An executive who interprets the quarterly dashboard before a board meeting.", cat: "People", why: "Decision-makers turn the system's information into knowledge." },
    { t: "The rule that any refund over $200 needs a supervisor's approval.", cat: "Processes & procedures", why: "A business rule that governs how work flows." },
    { t: "The required login steps for online banking: password, then a code texted to your phone.", cat: "Processes & procedures", why: "A defined procedure users must follow." },
    { t: "A checklist technicians must complete before a car is released to its owner.", cat: "Processes & procedures", why: "A routine that standardizes the work." },
    { t: "The written steps an attendant follows when self-checkout flags an unscanned item.", cat: "Processes & procedures", why: "A procedure for handling exceptions." },
    { t: "The workflow that routes a new job posting to the owner for approval before it goes live.", cat: "Processes & procedures", why: "A workflow defining who does what, in what order." },
    { t: "The month-end routine for closing the books and reconciling accounts.", cat: "Processes & procedures", why: "A recurring routine for how work gets done." },
    { t: "Each sale captured at the register: item, price, time and store.", cat: "Data & information", why: "The raw facts the system collects." },
    { t: "The Applicants table listing each candidate's experience and certifications.", cat: "Data & information", why: "Structured data the system stores and filters." },
    { t: "Purchase histories stored for every loyalty member.", cat: "Data & information", why: "Stored data about customers." },
    { t: "A weekly sales report generated from the transactions.", cat: "Data & information", why: "Information produced by processing data." },
    { t: "Inventory counts for every part number.", cat: "Data & information", why: "Facts the system tracks and reports." },
    { t: "Allergy entries recorded in a patient's health record.", cat: "Data & information", why: "Data captured and shared through the system." },
    { t: "Barcode scanners and receipt printers at the register.", cat: "Technology", why: "Hardware." },
    { t: "The cloud database server that stores order records.", cat: "Technology", why: "Hardware and software infrastructure." },
    { t: "The Wi-Fi network connecting the shop's tablets.", cat: "Technology", why: "Networks are part of the technology component." },
    { t: "The HR software that pushes postings to job boards automatically.", cat: "Technology", why: "Software performing work: automation on the technology side." },
    { t: "A software update that adds a new menu to the records screen.", cat: "Technology", why: "A change to the software itself." },
    { t: "Laptops issued to the sales team.", cat: "Technology", why: "Hardware." },
  ];
  const PPT_LABEL = {
    People: "People (skills, training, incentives, buy-in)",
    Process: "Process (rules, workflow, procedures)",
    Technology: "Technology (hardware, software, network)",
  };
  const MISALIGN = [
    { s: "A company rolls out a CRM, but sales reps are still paid only on deals closed quickly. Logging calls slows them down, so they skip it. The software works fine.", side: "People",
      why: "The reps' incentives reward skipping the system; the technology is not at fault.",
      fix: "Tie part of the reps' pay or recognition to complete CRM records and explain how the data helps them sell.",
      bad: [{ t: "Replace the CRM with a more expensive one with more features.", why: "The technology works; a new tool meets the same incentive problem." },
        { t: "Add faster laptops for the sales team.", why: "Speed is not why reps skip entry; their pay structure is." },
        { t: "Drop the CRM and go back to spreadsheets.", why: "That abandons the benefits instead of fixing the misalignment." }] },
    { s: "A grocery store installs self-checkout kiosks that scan reliably. No one decided what attendants should do when the scale flags a mismatch, so each attendant handles it differently and lines back up.", side: "Process",
      why: "There is no defined procedure for exceptions; the kiosks themselves work.",
      fix: "Write and train a standard procedure for weight mismatches and suspected theft, and adjust attendant staffing.",
      bad: [{ t: "Buy newer kiosks with better scanners.", why: "Scanning is not the problem; the missing exception procedure is." },
        { t: "Remove attendants completely to save money.", why: "That makes the gap in the process worse." },
        { t: "Install a faster network at the store.", why: "Network speed is unrelated to how mismatches are handled." }] },
    { s: "A hospital launches a new order-entry screen. The workflow is sound, but nurses got only a 20-minute video, and many enter orders in the wrong field.", side: "People",
      why: "Users were not prepared; the gap is training, not software or workflow.",
      fix: "Provide hands-on training with super-users on each unit and quick-reference guides at the stations.",
      bad: [{ t: "Rewrite the order-entry software from scratch.", why: "The design and workflow are fine; users need preparation." },
        { t: "Tell nurses to keep using paper orders.", why: "That creates duplicate systems and errors instead of fixing the readiness gap." },
        { t: "Buy larger monitors for the nursing stations.", why: "Screen size does not teach people where orders go." }] },
    { s: "A warehouse's handheld scanners keep dropping their connection in the freezer section. Staff are trained and the receiving procedure is clear.", side: "Technology",
      why: "People and process are ready; the network fails in one area.",
      fix: "Extend wireless coverage into the freezer (or use scanners that store scans offline and sync later).",
      bad: [{ t: "Retrain staff on the receiving procedure.", why: "They already know it; the connection is what fails." },
        { t: "Rewrite the receiving procedure.", why: "The procedure is clear; it is the hardware/network that breaks." },
        { t: "Offer bonuses for scanning faster.", why: "Incentives cannot fix a dropped signal." }] },
    { s: "A clinic adopts an online scheduling system, but the policy manual still requires a paper sign-in sheet, so staff book on paper first and type it in later. Double bookings follow.", side: "Process",
      why: "The old procedure was never redesigned around the new system.",
      fix: "Retire the paper sign-in requirement and redesign the front-desk workflow around the online schedule.",
      bad: [{ t: "Buy a second scheduling system for backup.", why: "Two systems would worsen the duplicate-entry problem." },
        { t: "Discipline the staff who follow the manual.", why: "Staff are following the official process; the process is what is misaligned." },
        { t: "Upgrade the clinic's computers.", why: "The software runs fine; the workflow is the issue." }] },
    { s: "A restaurant's order tablets freeze whenever more than 20 tickets are open. Servers are trained and the ordering steps are clear.", side: "Technology",
      why: "The software cannot handle the load; people and process are fine.",
      fix: "Have the vendor fix or upgrade the software (or hardware) so it handles peak ticket volume.",
      bad: [{ t: "Retrain servers on how to enter orders.", why: "They enter orders correctly; the system freezes under load." },
        { t: "Change the menu to fewer items.", why: "Menu size is not what crashes the tablets." },
        { t: "Pay servers more during busy shifts.", why: "Pay does not fix a software capacity limit." }] },
    { s: "An accounts-payable system now matches invoices automatically. Clerks, worried about their jobs and never told how their roles will change, keep duplicate spreadsheets and re-check everything by hand.", side: "People",
      why: "Fear and lack of buy-in drive the workaround; the system works.",
      fix: "Explain the change, redefine the clerks' roles (exception handling, vendor relations) and involve them in rollout.",
      bad: [{ t: "Add more automation so the clerks cannot touch the data.", why: "That deepens resistance without addressing the people side." },
        { t: "Switch to a different accounts-payable vendor.", why: "The tool is not the cause of resistance." },
        { t: "Buy more storage for the spreadsheets.", why: "That supports the workaround rather than fixing it." }] },
    { s: "A store launches an online refund portal, but policy still requires customers to mail a signed form before any refund is issued. Refunds still take weeks.", side: "Process",
      why: "The process was not redesigned, so the new technology cannot deliver its speed.",
      fix: "Redesign the refund policy so the portal can approve standard refunds on the spot (reengineer, don't just digitize).",
      bad: [{ t: "Make the portal's pages load faster.", why: "Page speed is not the bottleneck; the mailed form is." },
        { t: "Hire more staff to open the mailed forms.", why: "That keeps the slow process in place." },
        { t: "Train customers to fill out the form more neatly.", why: "Neatness does not remove the mail-in step." }] },
  ];
  const SPARKY_CERTS = [
    { c: "ASE Master Certified", exact: true, qual: true },
    { c: "ASE Master Technician (all eight A-series tests)", exact: false, qual: true },
    { c: "Advanced Engine Performance Specialist (L1)", exact: false, qual: true },
    { c: "ASE Certified Master Automobile Technician", exact: false, qual: true },
    { c: "ASE Entry-Level Student Certification", exact: false, qual: false },
    { c: "None listed", exact: false, qual: false },
    { c: "State emissions inspector license only", exact: false, qual: false },
  ];
  function sparkyTable() {
    const n = U.randInt(5, 6);
    const names = U.sample(NAMES, n);
    let rows;
    for (let guard = 0; guard < 50; guard++) {
      rows = names.map(name => {
        const c = U.pick(SPARKY_CERTS);
        const yrs = c.qual ? U.randInt(5, 14) : U.randInt(0, 3);
        return { name, cert: c.c, exact: c.exact, qual: c.qual, yrs };
      });
      const ex = rows.filter(r => r.exact).length, hidQ = rows.filter(r => !r.exact && r.qual).length, unq = rows.filter(r => !r.qual).length;
      if (ex >= 1 && hidQ >= 1 && unq >= 1) break;
    }
    const html = `<table class="tbl"><tr><th>Applicant</th><th>Years exp.</th><th>Certification field</th></tr>${rows.map(r => `<tr><td>${r.name}</td><td>${r.yrs}</td><td>${r.cert}</td></tr>`).join("")}</table>`;
    return { rows, html };
  }
  const PPT_TF = [
    { s: "Changing the technology side of an IS (swapping hardware, installing updates) is usually harder than changing the people side.", truth: false, why: "It is the reverse: technology changes are quick; changing how people work, their incentives and attitudes is hard.", hint: "Which side involves habits and attitudes?" },
    { s: "Sociotechnical systems theory says an IS performs best when its human and technical sides are aligned.", truth: true, why: "Both sides are interdependent; misalignment causes failure even with good software.", hint: "What does “sociotechnical” combine?" },
    { s: "Every information system is designed to automate work so that people are no longer needed.", truth: false, why: "Some IS, such as decision support systems, exist to inform human decisions rather than automate them.", hint: "Think of a DSS." },
    { s: "In the Sparky's case, the exact-match Smart Screen hid a highly qualified applicant whose certification was worded differently.", truth: true, why: "Alex Mercer's advanced certification did not match the literal text, so the rule hid him.", hint: "What did the rule compare?" },
    { s: "The best fix for Sparky's Smart Screen problem is to return to paper applications.", truth: false, why: "Paper was slow and lost applications. Keep the system and add human review: accept equivalents, flag instead of hide, review exclusions.", hint: "Which fix keeps the benefits and adds judgment?" },
    { s: "Data flows through and connects people, process and technology in the PPT lens.", truth: true, why: "PPT names three elements; data links them all.", hint: "Where does data sit in PPT?" },
  ];

  const genPpt = STUDY.makeGenerator({
    id: "k201-ch3-ppt",
    name: "IS as a sociotechnical system",
    blurb: "Name IS components, diagnose people/process/technology misalignment, and keep a human in the loop.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-comp", bank: COMP_BANK, cats: Object.keys(COMP_DEFS), defs: COMP_DEFS, ask: "element",
        hint: "Ask: is this a person, a rule or routine, a fact/report, or a piece of hardware, software or network?" }),
      ["Sort (drop-down)", "Which is NOT…", "Select all that apply"]),
      {
        name: "Diagnose the misalignment",
        make() {
          const m = U.rotate("ch3-mis", MISALIGN);
          const sides = ["People", "Process", "Technology"];
          return Q.mc({
            q: `<p>${m.s}</p><p>Using the PPT lens, where is the <b>root</b> misalignment?</p>`,
            right: PPT_LABEL[m.side], rightWhy: m.why,
            wrong: sides.filter(x => x !== m.side).map(x => ({ t: PPT_LABEL[x], why: x === "Technology" ? "The scenario says the technology itself works; blaming it repeats the “IS = software” misconception." : `Nothing in the scenario points to a ${x.toLowerCase()} gap. ${m.why}` })),
            keepOrder: sides.map(x => PPT_LABEL[x]),
            sol: S("Rule out each side in turn: is the technology actually failing? Are people unprepared or rewarded for the wrong thing? Is a rule or workflow missing or outdated?",
              `Root cause: <b>${m.side}</b>. ${m.why}`),
          });
        },
      },
      {
        name: "Choose the fix",
        make() {
          const m = U.rotate("ch3-mis-fix", MISALIGN);
          return Q.mc({
            q: `<p>${m.s}</p><p>Which action best fixes the problem?</p>`,
            right: m.fix, rightWhy: `It targets the real gap (${m.side.toLowerCase()}). ${m.why}`,
            wrong: m.bad,
            sol: S("First diagnose which PPT element is misaligned; a fix only works if it targets that element.",
              `The gap is <b>${m.side}</b>: ${m.why} So the fix is: ${m.fix}`),
          });
        },
      },
      {
        name: "Run the Smart Screen (count)",
        make() {
          const { rows, html } = sparkyTable();
          const ans = rows.filter(r => r.exact).length;
          const qual = rows.filter(r => r.qual).length;
          const traps = [{ value: rows.length, why: "The rule does not show everyone; it hides any row whose text is not an exact match." }];
          if (qual !== ans && qual !== rows.length) traps.push({ value: qual, why: "That counts everyone a human would consider qualified. The rule only matches the literal text." });
          return Q.num({
            kind: "count",
            q: `<p>Sparky's Auto Care is hiring a master technician. HR Flow's <b>Smart Screen</b> shows an applicant only if the Certification field reads <em>exactly</em> “ASE Master Certified”. Everyone else is hidden.</p>${html}<p>How many applicants does the manager see?</p>`,
            answer: ans, traps,
            sol: S("An exact-text rule ignores meaning: compare each Certification cell character by character with “ASE Master Certified”.",
              `Exact matches: ${rows.filter(r => r.exact).map(r => r.name).join(", ")} → <b>${ans}</b>.`,
              `Notice who disappears despite being qualified: ${rows.filter(r => r.qual && !r.exact).map(r => `${r.name} (${r.cert})`).join("; ")}. That is the Alex Mercer problem: the rule needs a human in the loop.`),
          });
        },
      },
      {
        name: "Who needs a human second look?",
        make() {
          const { rows, html } = sparkyTable();
          return Q.multi({
            q: `<p>Sparky's Smart Screen shows only applicants whose Certification field reads exactly “ASE Master Certified”. The job needs a senior, master-level technician.</p>${html}<p>Select <b>every</b> applicant who was hidden by the rule but deserves a human reviewer's attention.</p>`,
            options: rows.map(r => ({
              t: `${r.name}: ${r.cert}, ${r.yrs} yrs`,
              ok: !r.exact && r.qual,
              why: r.exact ? "Already shown by the rule, so not hidden." : r.qual ? "Hidden only because the wording differs; the credential is equivalent or stronger." : "Hidden, but the credential and experience do not meet the senior-role need.",
            })),
            sol: S("First find who was hidden (any non-exact text). Then, among those, ask whether a knowledgeable person would see an equivalent credential.",
              "The rescue list is hidden-but-qualified applicants. Fixes that build this in: accept equivalent credentials, flag instead of hide, and review the excluded pile."),
          });
        },
      },
      tfVariant("True or false: sociotechnical ideas", "ch3-ppt", PPT_TF),
    ],
  });

  /* ============================================================
   * TOPIC 3 · IS types by level + performance benefits and risks
   * ============================================================ */
  const TYPE_DEFS = {
    TPS: "processes routine, high-volume transactions quickly and accurately",
    MIS: "routine, detailed reports for operational managers",
    DSS: "summarized performance data and analysis for middle managers' tactical decisions",
    EIS: "high-level strategic information for senior executives",
  };
  const TYPE_BANK = [
    { t: "Recording each card payment at a gas pump.", cat: "TPS", why: "A single routine transaction, processed thousands of times a day." },
    { t: "Running the biweekly paycheck for 900 employees.", cat: "TPS", why: "Payroll is routine, repeatable, high-volume processing." },
    { t: "Logging every package scan as it leaves the warehouse.", cat: "TPS", why: "High-volume transaction capture." },
    { t: "Reducing the parts count when a mechanic pulls a part for a repair order.", cat: "TPS", why: "A routine inventory transaction." },
    { t: "Taking online orders and issuing confirmation numbers.", cat: "TPS", why: "Processing individual sales transactions." },
    { t: "Registering students into course sections during enrollment.", cat: "TPS", why: "Each registration is a routine transaction." },
    { t: "Today's shift schedule printed for the shop-floor supervisor.", cat: "MIS", why: "A routine, detailed report for an operational manager." },
    { t: "A current inventory-on-hand report for a store's receiving lead.", cat: "MIS", why: "Detailed, current, routine information for daily operations." },
    { t: "A daily list of overdue repair orders for the service-desk lead.", cat: "MIS", why: "Routine detailed report used to run today's work." },
    { t: "A nightly report of which delivery drivers have not checked in.", cat: "MIS", why: "Detailed operational report on a fixed schedule." },
    { t: "A morning list of yesterday's missed appointments by technician.", cat: "MIS", why: "Routine detailed report for front-line supervision." },
    { t: "A regional manager comparing monthly sales trends across eight stores to decide where to run a promotion.", cat: "DSS", why: "Summarized performance data supporting a tactical decision." },
    { t: "A what-if model letting a logistics manager test three delivery-route plans.", cat: "DSS", why: "Analysis tool that supports, not replaces, a middle manager's decision." },
    { t: "Quarterly overtime summarized by department to plan next quarter's staffing.", cat: "DSS", why: "Summarized data for a tactical planning decision." },
    { t: "A district manager modeling how a 5% price cut would change margin.", cat: "DSS", why: "Decision support through scenario analysis." },
    { t: "Monthly return rates by product line, used to decide which supplier to renegotiate with.", cat: "DSS", why: "Summarized performance data for a tactical choice." },
    { t: "A CEO dashboard of company-wide profitability and five-year market-share trends.", cat: "EIS", why: "High-level strategic information for a senior executive." },
    { t: "A one-screen view for the board of revenue by division compared with competitors.", cat: "EIS", why: "Strategic, highly summarized view for top leadership." },
    { t: "An executive dashboard used to decide whether the company should enter a new country.", cat: "EIS", why: "Supports a strategic, long-range decision at the top." },
    { t: "A CFO's high-level view of total cash position and long-run profitability.", cat: "EIS", why: "Strategic, company-wide information for a senior executive." },
  ];
  const LEVELS = [
    { sys: "EIS", who: "Senior executives", need: "High-level strategic information, e.g. company-wide profitability and market-share trends" },
    { sys: "DSS", who: "Middle managers", need: "Summarized performance data, e.g. monthly regional sales trends, for tactical decisions" },
    { sys: "MIS", who: "Operational managers", need: "Routine, detailed reports, e.g. today's shift schedule or current inventory" },
    { sys: "TPS", who: "Front-line operations", need: "Fast, accurate processing of each routine transaction, e.g. a sale or a paycheck" },
  ];
  function pyramid(mark, inside) {
    // 4 bands, apex at top; mark = index 0..3 (0 = top); inside = labels drawn in bands (or "?")
    const ys = [12, 62, 112, 162, 212];
    const hw = y => 120 * (y - 12) / 200;
    let s = `<svg viewBox="0 0 460 222" style="max-width:100%;height:auto" role="img" aria-label="management pyramid" xmlns="http://www.w3.org/2000/svg">`;
    s += `<polygon points="130,12 10,212 250,212" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    for (let i = 1; i < 4; i++) s += `<line x1="${130 - hw(ys[i])}" y1="${ys[i]}" x2="${130 + hw(ys[i])}" y2="${ys[i]}" stroke="currentColor"/>`;
    for (let i = 0; i < 4; i++) {
      const yc = (ys[i] + ys[i + 1]) / 2 + 5 + (i === 0 ? 10 : 0);
      s += `<text x="130" y="${yc}" text-anchor="middle" font-size="13" font-weight="bold" fill="currentColor">${i === mark ? "?" : inside[i]}</text>`;
      s += `<line x1="${130 + hw(ys[i + 1]) - 8}" y1="${(ys[i] + ys[i + 1]) / 2 + 2}" x2="262" y2="${(ys[i] + ys[i + 1]) / 2 + 2}" stroke="currentColor" stroke-dasharray="3 3"/>`;
      s += `<text x="268" y="${(ys[i] + ys[i + 1]) / 2 + 6}" font-size="12" fill="currentColor">${LEVELS[i].who}</text>`;
    }
    return s + `</svg>`;
  }
  const BEN_DEFS = {
    Efficiency: "fewer people-hours or lower cost per task through automation",
    Accuracy: "fewer errors because less is entered by hand",
    Speed: "faster response because data is real-time",
    Scalability: "growth without proportional growth in staff or overhead",
    "Transparency & control": "activity is recorded and visible so performance can be monitored and people held accountable",
  };
  const BEN_BANK = [
    { t: "Automatic invoice matching frees two clerks from re-keying paper invoices.", cat: "Efficiency", why: "Less labor per task." },
    { t: "Online self-booking means the front desk spends far fewer hours on the phone.", cat: "Efficiency", why: "Automation removes manual work." },
    { t: "Software handles routine bank-reconciliation steps staff once did by hand.", cat: "Efficiency", why: "Automating manual tasks cuts labor cost and time." },
    { t: "Job postings go to five job boards automatically instead of being posted one by one.", cat: "Efficiency", why: "One entry replaces repeated manual work." },
    { t: "Scanning barcodes instead of typing item numbers cuts pricing mistakes at the register.", cat: "Accuracy", why: "Less manual entry, fewer errors." },
    { t: "Web orders flow straight into the warehouse system, so nobody re-types addresses and mislabeled shipments drop.", cat: "Accuracy", why: "Removing re-entry removes transcription errors." },
    { t: "Drop-down lists stop technicians from entering part numbers that do not exist.", cat: "Accuracy", why: "Validated entry prevents mistakes." },
    { t: "Payroll calculates tax withholding by rule, ending hand-calculation errors.", cat: "Accuracy", why: "Rules replace error-prone manual math." },
    { t: "Real-time sales data lets a manager spot a sold-out item by noon and transfer stock that afternoon.", cat: "Speed", why: "Current data → faster response." },
    { t: "A live dashboard alerts a plant supervisor to a line slowdown within minutes.", cat: "Speed", why: "Real-time information shortens reaction time." },
    { t: "A fraud alert reaches the cardholder seconds after a suspicious charge.", cat: "Speed", why: "Immediate information allows immediate action." },
    { t: "A restaurant sees online reviews the same day and fixes a recurring complaint by dinner.", cat: "Speed", why: "Faster information, faster response." },
    { t: "An online store handles triple its usual holiday traffic without tripling its staff.", cat: "Scalability", why: "Volume grows without proportional overhead." },
    { t: "A cloud HR system adds a fourth location simply by creating new user accounts.", cat: "Scalability", why: "Growth with almost no added infrastructure." },
    { t: "A ride app launches in a new city on the same platform with a small local team.", cat: "Scalability", why: "The system supports growth without rebuilding." },
    { t: "A course platform serving 200 students serves 2,000 with the same two administrators.", cat: "Scalability", why: "Ten times the users, same overhead." },
    { t: "Every refund is logged with the ID of the employee who approved it, so managers can audit unusual patterns.", cat: "Transparency & control", why: "Recorded activity enables accountability." },
    { t: "A dashboard shows each technician's repeat-repair rate, making performance visible.", cat: "Transparency & control", why: "Monitoring performance and accountability." },
    { t: "Purchases over $5,000 are tracked and require recorded sign-off.", cat: "Transparency & control", why: "Control over spending through visible approvals." },
    { t: "A tracking screen shows exactly which step each customer order is stuck in.", cat: "Transparency & control", why: "Visibility into the process supports control." },
  ];
  const RISK_OPTS = [
    { t: "Hackers could steal customer records from the new system.", ok: true, why: "Cybersecurity is a new risk IS introduce." },
    { t: "The firm now stores personal data it is obligated to protect.", ok: true, why: "Data privacy is a new obligation and risk." },
    { t: "When the system goes down, orders cannot be taken at all.", ok: true, why: "Dependence on systems that must be maintained is a risk." },
    { t: "Software must be patched and updated regularly or it becomes vulnerable.", ok: true, why: "Ongoing maintenance and security updates are part of the dependence risk." },
    { t: "An automated filter quietly excludes qualified applicants.", ok: true, why: "Blind algorithmic decisions are a risk, as in Sparky's Smart Screen." },
    { t: "Clerks spend less time re-typing invoices.", ok: false, why: "That is an efficiency benefit, not a risk." },
    { t: "Managers see sales results in real time.", ok: false, why: "That is a speed benefit." },
    { t: "The business can add a new store without adding back-office staff.", ok: false, why: "That is a scalability benefit." },
    { t: "Each approval is logged with who approved it.", ok: false, why: "That is a transparency and control benefit." },
    { t: "Barcode scanning reduces pricing errors.", ok: false, why: "That is an accuracy benefit." },
  ];
  const TYPE_CONCEPT = [
    { q: "Information systems have <b>flattened</b> many organizational hierarchies. Why?", right: "Information that once passed up and down through layers of managers can now reach decision-makers directly",
      rightWhy: "When systems distribute information widely, fewer intermediate layers are needed.",
      wrong: [{ t: "Systems make managers unnecessary at every level", why: "Managers still decide; fewer layers are needed, not zero." },
        { t: "Flat organizations need less data", why: "Flatter organizations rely on more widely shared data, not less." },
        { t: "Hardware is cheaper in flat organizations", why: "Hardware cost is not the mechanism." }],
      sol: ["What did middle layers of management traditionally do with information?", "They relayed and summarized it; systems now do much of that, so hierarchies can flatten."] },
    { q: "Which pair is an example of IS creating <b>new business models</b>?", right: "Ride-sharing and streaming services",
      rightWhy: "Both exist only because information systems match users and deliver content at scale.",
      wrong: [{ t: "A bakery and a hardware store", why: "Traditional businesses that may use IS but were not created by them." },
        { t: "Payroll and inventory", why: "Those are functions supported by TPS, not new business models." },
        { t: "Accuracy and speed", why: "Those are performance benefits, not business models." }],
      sol: ["Look for businesses that could not exist without information systems.", "Ride-sharing and streaming were created by IS."] },
    { q: "A middle manager has a what-if tool that projects staffing costs under three plans; she picks one. What kind of system is this, and who decides?", right: "A DSS; the manager still makes the decision",
      rightWhy: "A DSS supports a human decision with summarized data and analysis.",
      wrong: [{ t: "A TPS; the system decides automatically", why: "A TPS processes transactions; it does not model plans." },
        { t: "An EIS; the CEO decides", why: "EIS serves senior executives' strategic view; this is a tactical choice by a middle manager." },
        { t: "An MIS; the software chooses the plan", why: "MIS produces routine detailed reports, and here the person chooses." }],
      sol: ["Who is the user and what kind of decision is it?", "Middle manager + tactical choice + analysis tool → DSS, with a human decision."] },
    { q: "Why is the TPS often described as the foundation for the other system types?", right: "It captures the transaction data that MIS, DSS and EIS later summarize",
      rightWhy: "Reports and dashboards are built from the transactions the TPS records.",
      wrong: [{ t: "It is used mainly by senior executives", why: "Executives use EIS; the TPS serves operations." },
        { t: "It makes strategic decisions automatically", why: "TPS processes routine transactions, not strategy." },
        { t: "It replaces the need for reports", why: "It feeds the reports; it does not replace them." }],
      sol: ["Where does the data in a sales-trend report originally come from?", "From individual transactions recorded by the TPS."] },
  ];

  const typeSort = sortVariants({ key: "ch3-types", bank: TYPE_BANK, cats: ["TPS", "MIS", "DSS", "EIS"], defs: TYPE_DEFS, ask: "use",
    hint: "Ask who uses it and how summarized it is: individual transactions (TPS), detailed routine reports (MIS), summarized trends for tactical choices (DSS), or company-wide strategy (EIS)?" });
  const benSort = sortVariants({ key: "ch3-ben", bank: BEN_BANK, cats: Object.keys(BEN_DEFS), defs: BEN_DEFS, ask: "improvement",
    hint: "Name the mechanism: fewer hours, fewer errors, faster reaction, growth without added overhead, or visible/auditable activity?" });

  const genTypes = STUDY.makeGenerator({
    id: "k201-ch3-istypes",
    name: "TPS, MIS, DSS, EIS and IS benefits",
    blurb: "Match systems to management levels and name the performance benefits and risks of IS.",
    variants: [
      ...pickVariants(typeSort, ["Sort (drop-down)", "Pick the example", "Name the category"]),
      {
        name: "Read the pyramid",
        make() {
          const mark = U.randInt(0, 3);
          const L = LEVELS[mark];
          if (U.randInt(0, 1)) {
            return Q.mc({
              q: `<p>The pyramid shows management levels (right) and the system type that mainly serves each (inside). One system is hidden.</p>${pyramid(mark, LEVELS.map(l => l.sys))}<p>Which system belongs at <b>?</b></p>`,
              right: L.sys, rightWhy: `${L.who}: ${TYPE_DEFS[L.sys]}.`,
              wrong: LEVELS.filter(l => l !== L).map(l => ({ t: l.sys, why: `${l.sys} serves ${l.who.toLowerCase()} (${TYPE_DEFS[l.sys]}), and it is already shown in its own band.` })),
              keepOrder: ["TPS", "MIS", "DSS", "EIS"],
              sol: S("Information gets more summarized and strategic as you go up; the bottom handles transactions.",
                `The marked band is <b>${L.who}</b>, served by <b>${L.sys}</b>: ${TYPE_DEFS[L.sys]}.`),
            });
          }
          return Q.mc({
            q: `<p>In the pyramid below, the band marked <b>?</b> is served by one system type (the others are labeled).</p>${pyramid(mark, LEVELS.map(l => l.sys))}<p>What kind of information does the marked level mainly need?</p>`,
            right: L.need, rightWhy: `${L.who} are served by ${L.sys}.`,
            wrong: LEVELS.filter(l => l !== L).map(l => ({ t: l.need, why: `That is what ${l.who.toLowerCase()} need (${l.sys}).` })),
            sol: S("Find the level next to the ? mark, then recall how detailed vs. summarized its information is.",
              `<b>${L.who}</b> → ${L.sys}: ${L.need}.`),
          });
        },
      },
      {
        name: "Name the performance benefit",
        make() { const v = benSort.find(x => x.name === "Sort (drop-down)"); return v.make(); },
      },
      {
        name: "Benefit or risk? (select all risks)",
        make() {
          const risks = RISK_OPTS.filter(o => o.ok), bens = RISK_OPTS.filter(o => !o.ok);
          const k = U.randInt(1, 4);
          const opts = U.sample(risks, k).concat(U.sample(bens, 5 - k));
          return Q.multi({
            q: `<p>A small chain moves its ordering, payroll and hiring onto new information systems. Select <b>every</b> item that is a <b>new risk</b> the systems introduce (not a benefit).</p>`,
            options: opts,
            sol: S("Benefits are efficiency, accuracy, speed, scalability, transparency and control. Risks are what can go wrong because you now depend on the system.",
              "The chapter's risks: cybersecurity, data privacy, dependence on systems that must be maintained, secured and updated, and blind automated decisions."),
          });
        },
      },
      conceptVariant("Explain the impact", "ch3-types", TYPE_CONCEPT),
    ],
  });

  /* ============================================================
   * TOPIC 4 · Business processes and cross-functional work
   * ============================================================ */
  const PROC_DEFS = {
    "Order-to-cash": "from a customer's order to receiving the customer's payment",
    "Procure-to-pay": "from buying from a supplier to paying that supplier",
    "Hire-to-retire": "the employee lifecycle, from recruiting to retirement",
  };
  const PROC_BANK = [
    { t: "A customer places an order online for 50 custom T-shirts.", cat: "Order-to-cash", why: "The customer's order starts order-to-cash." },
    { t: "Checking a business customer's credit before accepting a large order.", cat: "Order-to-cash", why: "Part of accepting a customer order." },
    { t: "Picking, packing and shipping a customer's order.", cat: "Order-to-cash", why: "Fulfillment sits between the order and the cash." },
    { t: "Sending an invoice to the customer.", cat: "Order-to-cash", why: "Billing the customer is part of collecting cash." },
    { t: "Recording the customer's payment and closing the invoice.", cat: "Order-to-cash", why: "Cash received ends order-to-cash." },
    { t: "Following up on a customer payment that is 30 days late.", cat: "Order-to-cash", why: "Collecting money owed by a customer." },
    { t: "Posting a technician opening on job boards.", cat: "Hire-to-retire", why: "Recruiting starts the employee lifecycle." },
    { t: "Screening applicants and scheduling interviews.", cat: "Hire-to-retire", why: "Part of hiring." },
    { t: "Onboarding a new hire: payroll setup, benefits enrollment, training.", cat: "Hire-to-retire", why: "Onboarding is early in the employee lifecycle." },
    { t: "Conducting an employee's annual performance review.", cat: "Hire-to-retire", why: "Performance management during employment." },
    { t: "Processing a promotion and raise.", cat: "Hire-to-retire", why: "Career development within the lifecycle." },
    { t: "Handling a retiring employee's final paycheck and benefits.", cat: "Hire-to-retire", why: "Retirement ends hire-to-retire." },
    { t: "Creating a purchase requisition for brake pads.", cat: "Procure-to-pay", why: "Identifying a purchasing need starts procure-to-pay." },
    { t: "Issuing a purchase order to a parts supplier.", cat: "Procure-to-pay", why: "Ordering from a supplier." },
    { t: "Receiving a supplier's shipment and checking it against the purchase order.", cat: "Procure-to-pay", why: "Goods receipt in the purchasing cycle." },
    { t: "Matching a supplier's invoice to the purchase order and receipt.", cat: "Procure-to-pay", why: "Verifying what we owe a supplier." },
    { t: "Paying the supplier.", cat: "Procure-to-pay", why: "Payment to the supplier ends procure-to-pay." },
    { t: "Comparing bids from three suppliers before buying.", cat: "Procure-to-pay", why: "Sourcing is part of procurement." },
  ];
  const PROC_STEPS = {
    "Order-to-cash": ["Customer places an order", "Confirm the order and check the customer's credit", "Pick, pack and ship the goods", "Send the customer an invoice", "Receive and record the customer's payment"],
    "Procure-to-pay": ["Identify a need and create a requisition", "Approve it and send a purchase order to the supplier", "Receive the goods and check them against the purchase order", "Receive and match the supplier's invoice", "Pay the supplier"],
    "Hire-to-retire": ["Plan the position and post the job", "Recruit, screen and hire", "Onboard: payroll, benefits, training", "Manage performance, pay and development", "Process separation or retirement"],
  };
  const DEPTS = ["Sales & marketing", "Operations", "Accounting", "Customer service"];
  const ORDER_CASES = [
    { ctx: "a promotional-products company receives an order for 200 logo mugs", steps: [
      { t: "A sales rep enters the order and confirms the quoted price", d: "Sales & marketing" },
      { t: "Accounting checks the customer's credit limit", d: "Accounting" },
      { t: "Production schedules the logo printing", d: "Operations" },
      { t: "The warehouse picks and packs the mugs", d: "Operations" },
      { t: "Shipping books the carrier and creates a tracking number", d: "Operations" },
      { t: "An invoice is sent to the customer", d: "Accounting" },
      { t: "Revenue is recorded in the general ledger", d: "Accounting" },
      { t: "A rep calls a week later to confirm the mugs arrived intact", d: "Customer service" },
      { t: "The customer is added to a reorder email campaign", d: "Sales & marketing" }] },
    { ctx: "an office-furniture maker sells 30 desks to a university", steps: [
      { t: "The account manager records the signed quote as an order", d: "Sales & marketing" },
      { t: "The plant schedules the desks into next week's production run", d: "Operations" },
      { t: "Logistics plans the delivery truck route", d: "Operations" },
      { t: "Billing issues the invoice with net-30 terms", d: "Accounting" },
      { t: "The university's payment is posted to its account", d: "Accounting" },
      { t: "Support handles a report that two desks arrived scratched", d: "Customer service" },
      { t: "Marketing tags the university for a case-study campaign", d: "Sales & marketing" }] },
    { ctx: "Sparky's Auto Care sells a fleet customer a set of 12 tire replacements", steps: [
      { t: "The service advisor writes up the fleet order and price", d: "Sales & marketing" },
      { t: "The parts room pulls tires from inventory", d: "Operations" },
      { t: "Technicians mount and balance the tires", d: "Operations" },
      { t: "The bookkeeper invoices the fleet account", d: "Accounting" },
      { t: "The fleet's payment is recorded and the invoice closed", d: "Accounting" },
      { t: "The front desk calls the fleet manager to check that all vans are running well", d: "Customer service" }] },
  ];
  const PROC_TF = [
    { s: "Paying a supplier's invoice is part of order-to-cash.", truth: false, why: "Money going out to a supplier is procure-to-pay; order-to-cash is money coming in from a customer.", hint: "Is money coming in or going out?" },
    { s: "A single customer order usually involves several functional areas, such as sales, operations, accounting and customer service.", truth: true, why: "Business processes are cross-functional; each area handles part of the order.", hint: "Trace one order from start to finish." },
    { s: "Hire-to-retire covers the whole employee lifecycle, from recruiting to separation or retirement.", truth: true, why: "That is the definition of hire-to-retire.", hint: "Read the name as start → end." },
    { s: "A business process is the same thing as a department.", truth: false, why: "A process is a sequence of activities that produces an output for a customer; it usually crosses several departments.", hint: "Does an order stay in one department?" },
  ];

  const genProcess = STUDY.makeGenerator({
    id: "k201-ch3-process",
    name: "Business processes",
    blurb: "Sort activities into order-to-cash, procure-to-pay and hire-to-retire, and trace one order across departments.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-proc", bank: PROC_BANK, cats: Object.keys(PROC_DEFS), defs: PROC_DEFS, ask: "activity",
        hint: "Ask who is on the other side: a customer paying us, a supplier we pay, or an employee moving through their career?" }),
      ["Sort (drop-down)", "Which is NOT…", "Select all that apply"]),
      {
        name: "Fill the missing step",
        make() {
          const name = U.pick(Object.keys(PROC_STEPS));
          const steps = PROC_STEPS[name];
          const gap = U.randInt(1, 4);
          const others = Object.keys(PROC_STEPS).filter(n => n !== name);
          const wrong = U.sample(others.flatMap(n => PROC_STEPS[n].map(t => ({ t, n }))), 2).map(w => ({ t: w.t, why: `That step belongs to <b>${w.n}</b>, not ${name}.` }));
          const sameWrong = steps.filter((_, i) => i !== gap);
          const dup = U.pick(sameWrong);
          wrong.push({ t: dup, why: "That step is already shown elsewhere in this sequence." });
          return Q.mc({
            q: `<p>The <b>${name}</b> process, in order:</p><ol>${steps.map((s, i) => `<li>${i === gap ? "<b>_____</b>" : s}</li>`).join("")}</ol><p>Which step fills the blank?</p>`,
            right: steps[gap], rightWhy: `It sits between “${steps[gap - 1]}” and ${gap + 1 < steps.length ? `“${steps[gap + 1]}”` : "the end"}.`,
            wrong,
            sol: S(`Recall what starts and ends ${name}: ${PROC_DEFS[name]}.`, `The full sequence: ${steps.join(" → ")}.`),
          });
        },
      },
      {
        name: "Trace an order across departments",
        make() {
          const c = U.rotate("ch3-ordercase", ORDER_CASES);
          const items = U.sample(c.steps, 5);
          return Q.classify({
            q: `<p>${c.ctx[0].toUpperCase() + c.ctx.slice(1)}. Which functional area handles each step?</p>`,
            cats: DEPTS,
            items: items.map(s => ({ t: s.t, cat: s.d, why: s.d === "Accounting" ? "Billing, credit and recording revenue or payments are accounting." : s.d === "Operations" ? "Producing, storing, moving and fulfilling are operations / supply chain." : s.d === "Sales & marketing" ? "Recording orders and campaigns are sales & marketing." : "After-sale follow-up and problem handling are customer service." })),
            sol: S("Ask what kind of work each step is: selling, making/moving, money and records, or after-sale care.",
              "One order touches several functions, which is exactly why they need to share the same order record."),
          });
        },
      },
      {
        name: "Count the departments touched",
        make() {
          let c, items, n;
          for (let g = 0; g < 40; g++) {
            c = U.pick(ORDER_CASES);
            const k = U.randInt(4, Math.min(6, c.steps.length));
            const idx = U.sample(c.steps.map((_, i) => i), k).sort((a, b) => a - b);
            items = idx.map(i => c.steps[i]);
            n = new Set(items.map(s => s.d)).size;
            if (n < items.length && n >= 2) break;
          }
          const traps = [{ value: items.length, why: "That counts steps. Several steps belong to the same department." }];
          if (n !== 1) traps.push({ value: 1, why: "A process is not one department; each step may be handled by a different area." });
          if (n !== 4 && items.length !== 4) traps.push({ value: 4, why: "Not every order in this list touches all four areas; count only those that appear." });
          return Q.num({
            kind: "count",
            q: `<p>${c.ctx[0].toUpperCase() + c.ctx.slice(1)}. These steps happen:</p><ol>${items.map(s => `<li>${s.t}</li>`).join("")}</ol><p>How many <b>different</b> functional areas (sales &amp; marketing, operations, accounting, customer service) handle this order?</p>`,
            answer: n, traps,
            sol: S("Label each step with its functional area first, then count the distinct labels, not the steps.",
              `${items.map(s => `${s.t} → ${s.d}`).join("; ")}. Distinct areas: <b>${n}</b>.`),
          });
        },
      },
      tfVariant("True or false: processes", "ch3-proc", PROC_TF),
    ],
  });

  /* ============================================================
   * TOPIC 5 · Functional systems, ERP, BPR
   * ============================================================ */
  const FUNC_DEFS = {
    "Accounting & finance": "revenues, expenses, budgets, payroll, financial reporting, compliance",
    "Human resources": "recruiting, hiring, benefits, performance reviews, employee records",
    "Marketing & sales (CRM)": "customer interactions, campaigns, buying patterns",
    "Operations & supply chain (SCM)": "production scheduling, inventory, logistics, suppliers",
  };
  const FUNC_BANK = [
    { t: "Tracking each department's spending against its budget.", cat: "Accounting & finance", why: "Budgets and expenses are finance." },
    { t: "Producing quarterly financial statements.", cat: "Accounting & finance", why: "Financial reporting." },
    { t: "Running payroll and recording payroll expenses.", cat: "Accounting & finance", why: "The chapter lists payroll under accounting and finance." },
    { t: "Monitoring cash flow and money owed by customers.", cat: "Accounting & finance", why: "Revenue and cash tracking." },
    { t: "Preparing records for a tax or regulatory audit.", cat: "Accounting & finance", why: "Compliance reporting." },
    { t: "Tracking applicants for open positions.", cat: "Human resources", why: "Recruiting." },
    { t: "Managing benefits enrollment.", cat: "Human resources", why: "Benefits administration." },
    { t: "Storing employees' performance reviews.", cat: "Human resources", why: "Performance management." },
    { t: "Keeping employee records such as certifications and emergency contacts.", cat: "Human resources", why: "Employee records." },
    { t: "Scheduling mandatory safety training for new hires.", cat: "Human resources", why: "Employee development and compliance training." },
    { t: "Logging every customer call and email in one shared history.", cat: "Marketing & sales (CRM)", why: "Customer interactions in a CRM." },
    { t: "Segmenting customers for a spring email campaign.", cat: "Marketing & sales (CRM)", why: "Campaign management." },
    { t: "Analyzing buying patterns to suggest add-on products.", cat: "Marketing & sales (CRM)", why: "Buying-pattern analysis." },
    { t: "Tracking each sales rep's pipeline of open deals.", cat: "Marketing & sales (CRM)", why: "Sales management." },
    { t: "Measuring which ad brought in the most new customers.", cat: "Marketing & sales (CRM)", why: "Marketing analysis." },
    { t: "Scheduling next week's production runs.", cat: "Operations & supply chain (SCM)", why: "Production scheduling." },
    { t: "Tracking inventory levels across three warehouses.", cat: "Operations & supply chain (SCM)", why: "Inventory management." },
    { t: "Planning delivery routes.", cat: "Operations & supply chain (SCM)", why: "Logistics." },
    { t: "Sharing demand forecasts with key suppliers.", cat: "Operations & supply chain (SCM)", why: "Supplier coordination in SCM." },
    { t: "Monitoring suppliers' on-time delivery rates.", cat: "Operations & supply chain (SCM)", why: "Supplier management." },
  ];
  const ERP_CASES = [
    { s: "Sales promises a delivery date from the CRM, but the factory's scheduling system shows the item is backordered. Customers get conflicting answers.",
      right: "Integrate sales and operations on a shared ERP so everyone sees the same real-time inventory and schedule", why: "The root cause is separate, inconsistent copies of shared data." },
    { s: "Accounting bills a customer for 100 units, but the warehouse system shows only 90 shipped because a change was entered in one system and not the other.",
      right: "Put order, shipping and billing on one integrated ERP record so a change updates every function", why: "Duplicate records drift apart; one shared record prevents billing errors." },
    { s: "Each department keeps its own customer address list. Customer service mails a replacement part to an address the customer updated with sales months ago.",
      right: "Use one shared customer record in an integrated (ERP) system", why: "The problem is duplicated, unsynchronized data across functions." },
    { s: "HR updates an employee's pay rate, but payroll in finance still pays the old rate for two cycles because someone has to re-key the change.",
      right: "Integrate HR and finance in an ERP so the pay change flows automatically to payroll", why: "Re-keying between separate systems causes delays and errors." },
  ];
  const ERP_WRONG = [
    { t: "Hire more staff to double-check every record by hand", why: "That treats the symptom with more manual work; the cause is duplicate data." },
    { t: "Buy a separate, more powerful system for each department", why: "More silos make inconsistencies worse, not better." },
    { t: "Print reports more often so everyone has a paper copy", why: "Paper copies multiply the versions instead of unifying them." },
    { t: "Add a faster network between the existing systems", why: "Speed does not fix two systems holding different versions of the truth." },
  ];
  const BPR_BANK = [
    { t: "Replacing mailed paper refund forms with a self-service portal that approves standard refunds in minutes.", ok: true, why: "The process itself is redesigned around new technology." },
    { t: "Letting customers check in for car service on their phone so the advisor's paper intake step disappears.", ok: true, why: "A step is eliminated, not just digitized." },
    { t: "Having suppliers see inventory levels and restock automatically, removing the purchase-request step.", ok: true, why: "The process is rethought end to end." },
    { t: "Replacing a six-signature approval chain with automatic approval for purchases under a set limit and one signature above it.", ok: true, why: "The flow is redesigned rather than copied." },
    { t: "Scanning the same six-signature paper form into a PDF that still circulates for six signatures.", ok: false, why: "That automates the old process without redesigning it." },
    { t: "Typing handwritten order forms into a spreadsheet each evening.", ok: false, why: "Same steps, plus a re-entry step; nothing is redesigned." },
    { t: "Buying faster printers so paper forms print more quickly.", ok: false, why: "Speeds a step but keeps the old process intact." },
    { t: "Emailing a photo of the paper timesheet instead of handing it in.", ok: false, why: "The process is unchanged; only the delivery medium changed." },
  ];
  const FUNC_TF = [
    { s: "An ERP system integrates data and processes from many functions into one platform so everyone uses the same real-time information.", truth: true, why: "That is what ERP means in this chapter.", hint: "What does “enterprise” suggest about scope?" },
    { s: "CRM systems mainly support production scheduling and inventory.", truth: false, why: "CRM supports marketing and sales (customer interactions, campaigns, buying patterns); SCM supports operations.", hint: "What does the C in CRM stand for?" },
    { s: "Business process reengineering means automating the existing steps of a process exactly as they are.", truth: false, why: "BPR redesigns the process using new technology instead of automating the old steps.", hint: "Re-engineer vs. re-type." },
    { s: "Separate departmental systems holding different versions of one order can cause wrong shipments and billing errors.", truth: true, why: "Inconsistent copies of shared data are exactly what ERP integration is meant to fix.", hint: "Think of data drifting apart." },
  ];

  const genFunctional = STUDY.makeGenerator({
    id: "k201-ch3-functional",
    name: "Functional systems, ERP and BPR",
    blurb: "Match tasks to functional systems, diagnose data silos and tell reengineering from simple automation.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-func", bank: FUNC_BANK, cats: Object.keys(FUNC_DEFS), defs: FUNC_DEFS, ask: "task",
        hint: "Ask which department owns the work: money and reporting, employees, customers, or making and moving goods?" }),
      ["Sort (drop-down)", "Pick the example", "Which is NOT…", "Name the category"]),
      {
        name: "Diagnose the silo (ERP)",
        make() {
          const e = U.rotate("ch3-erp", ERP_CASES);
          return Q.mc({
            q: `<p>${e.s}</p><p>What is the best long-term fix?</p>`,
            right: e.right, rightWhy: e.why,
            wrong: U.sample(ERP_WRONG, 3),
            sol: S("Look for the root cause: are two functions working from different copies of the same data?",
              `${e.why} An ERP gives every function one shared, real-time record.`),
          });
        },
      },
      {
        name: "Reengineering or just automating?",
        make() {
          const k = U.randInt(1, 3);
          const opts = U.sample(BPR_BANK.filter(b => b.ok), k).concat(U.sample(BPR_BANK.filter(b => !b.ok), 5 - k));
          return Q.multi({
            q: `<p>Select <b>every</b> change that is genuine <b>business process reengineering</b> (redesigning the process), not just putting the old steps on a computer.</p>`,
            options: opts,
            sol: S("Ask: after the change, are the steps themselves different (some removed or re-ordered), or are the same steps just digital?",
              "BPR redesigns the process around new technology, for example paper refund forms (weeks) → self-service portal (minutes)."),
          });
        },
      },
      tfVariant("True or false: integration", "ch3-func", FUNC_TF),
    ],
  });

  /* ============================================================
   * TOPIC 6 · Porter's Five Forces
   * ============================================================ */
  const FORCES = ["Buyer power", "Supplier power", "Rivalry", "Threat of substitutes", "Threat of new entrants"];
  const FORCE_DEFS = {
    "Buyer power": "customers' ability to push prices down or demand better terms",
    "Supplier power": "suppliers' ability to raise prices or dictate terms",
    Rivalry: "intensity of competition among existing firms",
    "Threat of substitutes": "a different kind of product meeting the same need",
    "Threat of new entrants": "how easily new competitors can enter",
  };
  const FORCE_BANK = [
    { t: "A national grocery chain buys 40% of a small salsa maker's output and demands a 10% price cut to keep shelf space.", cat: "Buyer power", level: "High", why: "A large-volume customer can pressure price and terms." },
    { t: "Shoppers can compare prices for the same TV across six websites in seconds and switch with one click.", cat: "Buyer power", level: "High", why: "Many alternatives and easy switching give customers power." },
    { t: "Corporate clients that each order thousands of laptops negotiate custom pricing and payment terms.", cat: "Buyer power", level: "High", why: "Volume buyers can demand better terms." },
    { t: "A rural hospital's patients have only one imaging center within 90 miles.", cat: "Buyer power", level: "Low", why: "Customers with no alternatives have little bargaining power." },
    { t: "Small firms that keep years of records in one accounting app rarely push back on its annual price increase, because leaving would be painful.", cat: "Buyer power", level: "Low", why: "High switching costs weaken customers' bargaining power." },
    { t: "Only two companies in the world make the specialized chip a drone maker needs.", cat: "Supplier power", level: "High", why: "Few suppliers of a critical input." },
    { t: "Switching a restaurant's point-of-sale vendor would mean retraining every server and re-entering the whole menu, so the vendor raises fees freely.", cat: "Supplier power", level: "High", why: "Costly to switch suppliers." },
    { t: "An auto shop relies on a single regional distributor for one brand's proprietary parts.", cat: "Supplier power", level: "High", why: "Heavy dependence on one supplier." },
    { t: "A bakery can buy flour from dozens of interchangeable mills.", cat: "Supplier power", level: "Low", why: "Many suppliers of a standard input." },
    { t: "Office paper is a commodity that any of several vendors will deliver tomorrow.", cat: "Supplier power", level: "Low", why: "Easy to switch among many suppliers." },
    { t: "Five nearly identical oil-change shops on one mile of road keep undercutting each other's coupons.", cat: "Rivalry", level: "High", why: "Many similar competitors and price competition." },
    { t: "The phone-plan market has stopped growing, so carriers fight over each other's customers with switching deals.", cat: "Rivalry", level: "High", why: "Slow growth means firms compete for the same customers." },
    { t: "Airlines on a popular route match each other's fare cuts within hours.", cat: "Rivalry", level: "High", why: "Intense price competition among existing firms." },
    { t: "A fast-growing niche has more demand than its three providers can serve.", cat: "Rivalry", level: "Low", why: "Rapid growth and few competitors ease rivalry." },
    { t: "The only bike repair shop in a small town has a two-week waiting list.", cat: "Rivalry", level: "Low", why: "No direct competitors chasing the same customers." },
    { t: "Video calls let companies replace many business trips, hurting a regional airline.", cat: "Threat of substitutes", level: "High", why: "A different product meets the same need (meeting in person) cheaply." },
    { t: "Streaming services meet the same entertainment need as cable TV at a lower price.", cat: "Threat of substitutes", level: "High", why: "An attractive alternative product for the same need." },
    { t: "Ride-sharing gives people a cheaper, more convenient way across town than taxis.", cat: "Threat of substitutes", level: "High", why: "A different service meeting the same transportation need." },
    { t: "Free online writing tools give students an alternative to paid tutoring for basic essay feedback.", cat: "Threat of substitutes", level: "High", why: "A different kind of product satisfies the same need." },
    { t: "For crossing an ocean in a day, travelers have no realistic alternative to flying.", cat: "Threat of substitutes", level: "Low", why: "No other kind of product meets that need." },
    { t: "Anyone with a laptop can open an online T-shirt store for under $100 using print-on-demand.", cat: "Threat of new entrants", level: "High", why: "Very little capital and no barriers to enter." },
    { t: "A food truck needs little capital and only a health permit to start.", cat: "Threat of new entrants", level: "High", why: "Low capital and regulatory barriers." },
    { t: "Starting a commercial airline requires billions in aircraft, airport slots and federal certification.", cat: "Threat of new entrants", level: "Low", why: "High capital and regulatory barriers." },
    { t: "A new bank must meet strict capital and licensing rules before opening.", cat: "Threat of new entrants", level: "Low", why: "Regulatory barriers keep entrants out." },
    { t: "A newcomer would need years and huge sums to copy a retailer's proprietary logistics network.", cat: "Threat of new entrants", level: "Low", why: "A hard-to-copy IS creates a barrier to entry." },
  ];
  const IS_RESP = {
    "Buyer power": "A loyalty program and personalized offers that raise customers' switching costs",
    "Supplier power": "A procurement system that qualifies and compares many suppliers so no single one has leverage",
    Rivalry: "Customer analytics that let the firm differentiate with personalized service rivals cannot easily match",
    "Threat of substitutes": "Digital features (online booking, tracking, bundling) that make the offering more convenient than the alternative",
    "Threat of new entrants": "A proprietary logistics or data platform too costly for newcomers to copy",
  };
  const FORCE_COND = {
    "Buyer power": ["Customers have many alternative sellers", "Customers can switch sellers easily and cheaply", "Customers buy in very large volumes", "Customers can pressure prices and terms"],
    "Supplier power": ["Only a few suppliers provide a critical input", "Switching to a different supplier is costly", "The firm depends heavily on one supplier"],
    Rivalry: ["Many competitors chase the same customers", "The industry is growing slowly", "Competitors' offerings are hard to tell apart", "Competitors cut prices aggressively"],
    "Threat of substitutes": ["A different kind of product meets the same need", "The alternative product offers attractive price/performance"],
    "Threat of new entrants": ["Entering requires little capital", "There are few regulatory or licensing barriers", "Newcomers can easily reach distribution channels", "Customers show little brand loyalty"],
  };
  const FORCE_TF = [
    { s: "The stronger Porter's forces are in an industry, the higher its profit potential.", truth: false, why: "Stronger forces squeeze prices and costs, so they reduce profit potential.", hint: "Do strong buyers and rivals help or hurt margins?" },
    { s: "A loyalty program can lower buyer power by raising customers' switching costs.", truth: true, why: "If leaving means losing points or benefits, customers are less able to bargain or switch.", hint: "What makes switching easy or hard?" },
    { s: "A new pizza restaurant opening across the street from an existing pizza place is an example of a substitute.", truth: false, why: "Same kind of product, same customers: once it opens it is a rival (and before it opened, it was a potential new entrant).", hint: "Is it a different product meeting the same need?" },
    { s: "A proprietary logistics system that rivals cannot afford to copy raises barriers to new entrants.", truth: true, why: "Hard-to-copy IS capabilities make entry more costly.", hint: "What makes entering an industry hard?" },
    { s: "Supplier power is high when a firm can choose among many interchangeable suppliers.", truth: false, why: "Many interchangeable suppliers means low supplier power.", hint: "Who holds leverage when there are many options?" },
    { s: "Frequent “on sale” pricing can intensify rivalry and train buyers to expect discounts.", truth: true, why: "Price promotions provoke competitors and shift buyer expectations, touching several forces.", hint: "Which forces does a price war involve?" },
  ];

  const genForces = STUDY.makeGenerator({
    id: "k201-ch3-forces",
    name: "Porter's Five Forces",
    blurb: "Name the force in a scenario, rate it high or low, and pick the IS response that weakens it.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-forces", bank: FORCE_BANK, cats: FORCES, defs: FORCE_DEFS, ask: "scenario",
        hint: "Find who holds the pressure: customers, suppliers, current competitors, a different kind of product, or a company not yet in the market." }),
      ["Sort (drop-down)", "Which is NOT…", "Name the category"]),
      {
        name: "High or low?",
        make() {
          const f = U.rotate("ch3-hl", FORCE_BANK);
          return Q.mc({
            q: `<p>${f.t}</p><p>This describes <b>${f.cat.toLowerCase()}</b>. Is that force <b>high</b> or <b>low</b> here?</p>`,
            right: f.level, rightWhy: f.why,
            wrong: [{ t: f.level === "High" ? "Low" : "High", why: `The conditions point the other way: ${f.why}` }],
            keepOrder: ["High", "Low"],
            sol: S(`Recall when ${f.cat.toLowerCase()} is strong: ${FORCE_COND[f.cat].join("; ").toLowerCase()}.`,
              `Here it is <b>${f.level.toLowerCase()}</b>: ${f.why}`),
          });
        },
      },
      {
        name: "Pick the IS response",
        make() {
          const highs = FORCE_BANK.filter(b => b.level === "High");
          const f = U.rotate("ch3-isresp", highs);
          return Q.mc({
            q: `<p>${f.t}</p><p>Which IS investment most directly weakens the force at work here?</p>`,
            right: IS_RESP[f.cat], rightWhy: `The force is ${f.cat.toLowerCase()} (${f.why.toLowerCase()}), and this targets it.`,
            wrong: U.sample(FORCES.filter(x => x !== f.cat), 3).map(x => ({ t: IS_RESP[x], why: `Useful against ${x.toLowerCase()}, but the pressure here comes from ${f.cat.toLowerCase()}.` })),
            sol: S("First name the force, then ask what would reduce <em>that</em> party's leverage.",
              `Force: <b>${f.cat}</b>. Response: ${IS_RESP[f.cat]}.`),
          });
        },
      },
      {
        name: "What makes the force strong? (select all)",
        make() {
          const f = U.pick(FORCES);
          const mine = FORCE_COND[f];
          const k = U.randInt(1, Math.min(3, mine.length));
          const other = FORCES.filter(x => x !== f).flatMap(x => FORCE_COND[x].map(t => ({ t, x })));
          const opts = U.sample(mine, k).map(t => ({ t, ok: true, why: `This strengthens ${f.toLowerCase()}.` }))
            .concat(U.sample(other, 5 - k).map(o => ({ t: o.t, ok: false, why: `This strengthens ${o.x.toLowerCase()}, a different force.` })));
          return Q.multi({
            q: `<p>Select <b>every</b> condition that makes <b>${f.toLowerCase()}</b> high.</p>`,
            options: opts,
            sol: S(`Picture the party behind ${f.toLowerCase()} and ask what gives <em>them</em> leverage.`,
              `${f} is high when: ${mine.join("; ").toLowerCase()}.`),
          });
        },
      },
      tfVariant("True or false: forces", "ch3-forces", FORCE_TF),
    ],
  });

  /* ============================================================
   * TOPIC 7 · Generic strategies
   * ============================================================ */
  const STRATS = ["Cost leadership", "Differentiation", "Cost focus", "Differentiation focus"];
  const STRAT_DEFS = {
    "Cost leadership": "lowest cost across a broad market",
    Differentiation: "unique, valued offering across a broad market; customers pay more",
    "Cost focus": "lowest cost for one narrow segment",
    "Differentiation focus": "specialized offering designed for one narrow segment",
  };
  const STRAT_BANK = [
    { t: "A national discount retailer that wins on everyday low prices through a hyper-efficient supply chain.", cat: "Cost leadership", why: "Broad market, competing on lowest cost." },
    { t: "A budget airline flying one aircraft type nationwide with online-only booking and no assigned seats.", cat: "Cost leadership", why: "Standardized, stripped-down operations to be cheapest for everyone." },
    { t: "A warehouse club selling bulk goods to the general public with minimal service.", cat: "Cost leadership", why: "Broad market, low cost through volume and simplicity." },
    { t: "A generic-drug maker supplying pharmacies nationwide at rock-bottom prices.", cat: "Cost leadership", why: "Broad market, lowest-cost producer." },
    { t: "A fast-food chain that standardizes every kitchen step to keep prices low in every state.", cat: "Cost leadership", why: "Standardized processes and automation for low cost across a broad market." },
    { t: "A smartphone maker charging premium prices for design, its ecosystem and brand.", cat: "Differentiation", why: "Broad market, customers pay more for something unique." },
    { t: "A national coffee chain that charges more for its atmosphere and endless customization.", cat: "Differentiation", why: "Broad market, distinctive experience." },
    { t: "A carmaker known for safety engineering whose buyers willingly pay extra.", cat: "Differentiation", why: "Unique valued feature across a broad market." },
    { t: "An online retailer serving everyone that is famous for free, fast, no-questions returns.", cat: "Differentiation", why: "Distinctive service across a broad market." },
    { t: "A national hotel brand known for consistently upscale service.", cat: "Differentiation", why: "Premium experience for a broad market." },
    { t: "A no-frills auto shop that services only local courier companies' vans at the lowest rates in the county.", cat: "Cost focus", why: "Narrow segment (fleet vans, one county), lowest cost." },
    { t: "A bare-bones tax-preparation service only for college students in one city.", cat: "Cost focus", why: "Narrow segment with simplified, cheap service." },
    { t: "A low-cost regional airline serving only small airports in one state.", cat: "Cost focus", why: "One region, lowest-cost operations." },
    { t: "A discount uniform supplier selling only to local restaurants.", cat: "Cost focus", why: "One industry segment, low price." },
    { t: "A no-frills laundromat chain operating only in college towns at student prices.", cat: "Cost focus", why: "Narrow customer group, low cost." },
    { t: "A bike shop that only builds custom bikes for competitive triathletes.", cat: "Differentiation focus", why: "Narrow segment, specialized product." },
    { t: "A bakery that makes only allergen-free cakes for customers with celiac disease.", cat: "Differentiation focus", why: "Specialized offering for one segment's needs." },
    { t: "An auto shop that only restores classic European sports cars.", cat: "Differentiation focus", why: "Specialized expertise for a narrow segment." },
    { t: "A software firm building scheduling tools only for veterinary clinics.", cat: "Differentiation focus", why: "Designed around one industry's needs." },
    { t: "A tutoring service only for students preparing for medical-school entrance exams.", cat: "Differentiation focus", why: "Specialized service for one segment." },
  ];
  const STRAT_IS = {
    "Cost leadership": ["Automated inventory replenishment and supply-chain analytics that squeeze cost from every shipment", "Self-service kiosks and standardized process automation that cut labor per transaction", "Electronic links with suppliers so orders flow automatically without clerks"],
    Differentiation: ["A CRM that remembers every customer's preferences for personalized service", "A feature-rich mobile app that reinforces the premium brand", "Quality and product-design analytics that support standout features"],
    "Cost focus": ["A lean, low-cost cloud scheduling and billing tool sized for its one segment", "Simple route and job planning tuned to its single region to keep costs lowest", "A basic self-service portal that handles its niche customers with almost no staff"],
    "Differentiation focus": ["A specialized system that records each client's unique specifications and history", "A niche online community and expert content built for its one segment", "Custom tracking tools designed around the segment's particular needs"],
  };
  const SCOPE = { "Cost leadership": ["Broad", "Lower cost"], Differentiation: ["Broad", "Differentiation"], "Cost focus": ["Narrow", "Lower cost"], "Differentiation focus": ["Narrow", "Differentiation"] };
  function grid(letters) {
    // letters: map strategy → letter; quadrants fixed by scope/value
    const pos = { "Cost leadership": [145, 70], Differentiation: [275, 70], "Cost focus": [145, 160], "Differentiation focus": [275, 160] };
    let s = `<svg viewBox="0 0 360 250" style="max-width:100%;height:auto" role="img" aria-label="generic strategies grid" xmlns="http://www.w3.org/2000/svg">`;
    s += `<rect x="80" y="25" width="260" height="180" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    s += `<line x1="210" y1="25" x2="210" y2="205" stroke="currentColor"/><line x1="80" y1="115" x2="340" y2="115" stroke="currentColor"/>`;
    s += `<text x="145" y="222" text-anchor="middle" font-size="12" fill="currentColor">Lower cost</text>`;
    s += `<text x="275" y="222" text-anchor="middle" font-size="12" fill="currentColor">Differentiation</text>`;
    s += `<text x="210" y="242" text-anchor="middle" font-size="11" fill="currentColor">Source of advantage</text>`;
    s += `<text x="42" y="74" text-anchor="middle" font-size="12" fill="currentColor">Broad</text>`;
    s += `<text x="42" y="164" text-anchor="middle" font-size="12" fill="currentColor">Narrow</text>`;
    s += `<text x="42" y="16" text-anchor="middle" font-size="11" fill="currentColor">Market scope</text>`;
    for (const k of STRATS) s += `<text x="${pos[k][0]}" y="${pos[k][1]}" text-anchor="middle" font-size="22" font-weight="bold" fill="currentColor">${letters[k]}</text>`;
    return s + `</svg>`;
  }

  const genGeneric = STUDY.makeGenerator({
    id: "k201-ch3-generic",
    name: "Generic strategies",
    blurb: "Classify businesses by generic strategy, read the strategy grid, and match IS capabilities to strategy.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-strat", bank: STRAT_BANK, cats: STRATS, defs: STRAT_DEFS, ask: "business",
        hint: "Two questions: do customers choose it mainly for low price or for something special? Does it serve almost everyone or one defined group?" }),
      ["Sort (drop-down)", "Pick the example", "Select all that apply", "Name the category"]),
      {
        name: "Read the strategy grid",
        make() {
          const L = U.shuffle(["A", "B", "C", "D"]);
          const letters = {}; STRATS.forEach((s, i) => { letters[s] = L[i]; });
          const target = U.pick(STRATS);
          if (U.randInt(0, 1)) {
            return Q.mc({
              q: `<p>In the grid, which letter marks <b>${target.toLowerCase()}</b>?</p>${grid(letters)}`,
              right: letters[target], rightWhy: `${target} = ${SCOPE[target][0].toLowerCase()} scope + ${SCOPE[target][1].toLowerCase()}.`,
              wrong: STRATS.filter(s => s !== target).map(s => ({ t: letters[s], why: `${letters[s]} is ${s.toLowerCase()} (${SCOPE[s][0].toLowerCase()} scope, ${SCOPE[s][1].toLowerCase()}).` })),
              keepOrder: ["A", "B", "C", "D"],
              sol: S("Place the strategy on two axes: scope (broad top, narrow bottom) and source of advantage (cost left, differentiation right).",
                `${target}: ${SCOPE[target][0]} + ${SCOPE[target][1]} → <b>${letters[target]}</b>.`),
            });
          }
          return Q.mc({
            q: `<p>Which strategy sits in quadrant <b>${letters[target]}</b>?</p>${grid(letters)}`,
            right: target, rightWhy: `${SCOPE[target][0]} scope + ${SCOPE[target][1].toLowerCase()}.`,
            wrong: STRATS.filter(s => s !== target).map(s => ({ t: s, why: `${s} is ${SCOPE[s][0].toLowerCase()} scope with ${SCOPE[s][1].toLowerCase()}, a different quadrant.` })),
            keepOrder: STRATS,
            sol: S("Read the row (scope) and the column (source of advantage) for that letter.",
              `Quadrant ${letters[target]} = ${SCOPE[target][0]} + ${SCOPE[target][1]} → <b>${target}</b>.`),
          });
        },
      },
      {
        name: "Recommend strategy + IS capability",
        make() {
          const b = U.rotate("ch3-rec", STRAT_BANK);
          const s = b.cat;
          const others = STRATS.filter(x => x !== s);
          const o1 = U.pick(others), o2 = U.pick(others.filter(x => x !== o1));
          const right = `${s}, supported by: ${lc1(U.pick(STRAT_IS[s]))}`;
          return Q.mc({
            q: `<p>${b.t}</p><p>Which pairing best names its strategy <b>and</b> an IS capability that supports it?</p>`,
            right, rightWhy: `${b.why} The IS capability reinforces that strategy.`,
            wrong: [
              { t: `${s}, supported by: ${lc1(U.pick(STRAT_IS[o1]))}`, why: `The strategy is right, but that capability serves ${o1.toLowerCase()}. IS adds value only when it supports the chosen strategy.` },
              { t: `${o1}, supported by: ${lc1(U.pick(STRAT_IS[o1]))}`, why: `Misreads the business: ${STRAT_DEFS[o1]} does not fit. ${b.why}` },
              { t: `${o2}, supported by: ${lc1(U.pick(STRAT_IS[o2]))}`, why: `Misreads the business: ${STRAT_DEFS[o2]} does not fit. ${b.why}` },
            ],
            sol: S("Classify the business first (scope × source of value), then pick the IS that strengthens that specific advantage.",
              `It is <b>${s}</b> (${STRAT_DEFS[s]}). Fitting IS: ${STRAT_IS[s].map(lc1).join("; ")}.`),
          });
        },
      },
      {
        name: "Which IS does NOT fit the strategy?",
        make() {
          const s = U.pick(STRATS);
          const other = U.pick(STRATS.filter(x => x !== s));
          return Q.mc({
            q: `<p>A firm pursues <b>${s.toLowerCase()}</b> (${STRAT_DEFS[s]}). Three of these IS investments support it. Which one does <b>NOT</b>?</p>`,
            right: U.pick(STRAT_IS[other]), rightWhy: `That capability serves ${other.toLowerCase()}, not ${s.toLowerCase()}.`,
            wrong: STRAT_IS[s].map(t => ({ t, why: `This supports ${s.toLowerCase()}: it fits ${STRAT_DEFS[s]}.` })),
            sol: S(`Ask of each option: does it lower cost or create uniqueness, and for a broad market or one segment?`,
              `${s} needs IS that support ${STRAT_DEFS[s]}. The misfit is built for ${other.toLowerCase()}.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 8 · Other IS advantage sources and sustainability
   * ============================================================ */
  const ADV = ["Switching costs", "Network effects", "Data as an asset", "First-mover advantage"];
  const ADV_DEFS = {
    "Switching costs": "the system is embedded in the customer's work, so leaving is painful",
    "Network effects": "the product becomes more valuable to each user as more people use it",
    "Data as an asset": "collecting and analyzing data to spot trends and personalize",
    "First-mover advantage": "being first to implement a technology wins recognition and loyalty",
  };
  const ADV_BANK = [
    { t: "A small firm's accounting app holds seven years of records and custom reports, so moving to another product would be painful.", cat: "Switching costs", why: "Leaving means migrating years of embedded data." },
    { t: "A shop's scheduling system is wired into its parts ordering and customer reminders; replacing it would disrupt everything.", cat: "Switching costs", why: "Deep integration into the workflow makes leaving costly." },
    { t: "A university's learning platform stores every course and gradebook, so changing platforms is a multi-year project.", cat: "Switching costs", why: "The effort to move locks the customer in." },
    { t: "A photo service holds a family's 20,000 tagged photos and albums.", cat: "Switching costs", why: "Moving everything elsewhere is a large effort." },
    { t: "A coffee chain's app holds members' saved orders, stored balance and earned rewards they would lose by leaving.", cat: "Switching costs", why: "Leaving forfeits accumulated value." },
    { t: "A ride-sharing app attracts more drivers as riders grow, which shortens waits and attracts still more riders.", cat: "Network effects", why: "Each side grows the value for the other." },
    { t: "A payment app is useful mainly because your friends already use it.", cat: "Network effects", why: "Value comes from the number of other users." },
    { t: "An online marketplace with more sellers draws more buyers, which draws more sellers.", cat: "Network effects", why: "More users on each side make it more valuable to all." },
    { t: "A professional networking site becomes more valuable to job seekers as more recruiters join.", cat: "Network effects", why: "Value rises with participation." },
    { t: "A multiplayer game's matchmaking gets better as more players join.", cat: "Network effects", why: "Each extra player improves the experience for others." },
    { t: "A grocery chain analyzes loyalty-card purchases to send each shopper personalized coupons.", cat: "Data as an asset", why: "Customer data drives personalization." },
    { t: "A streaming service uses viewing history to decide which shows to fund.", cat: "Data as an asset", why: "Analyzing data guides decisions." },
    { t: "An auto shop's repair history shows which models need brake work around 40,000 miles, so it sends timed reminders.", cat: "Data as an asset", why: "Accumulated data reveals patterns to act on." },
    { t: "A retailer spots a regional trend in its sales data and stocks up weeks before competitors.", cat: "Data as an asset", why: "Data analysis reveals trends early." },
    { t: "A fitness app uses aggregated workout data to improve its training plans.", cat: "Data as an asset", why: "Collected data improves the product." },
    { t: "The first bank in a region to offer mobile check deposit wins customers and recognition.", cat: "First-mover advantage", why: "Being first builds brand recognition and loyalty." },
    { t: "The first coffee shop in a college town with mobile ordering builds a habit before rivals copy it.", cat: "First-mover advantage", why: "Early adoption locks in loyalty." },
    { t: "The first airline to launch online check-in earns a reputation for convenience.", cat: "First-mover advantage", why: "First to implement gains reputation." },
    { t: "The first company to put a niche parts catalog online becomes the name customers search for.", cat: "First-mover advantage", why: "Early entry wins recognition." },
    { t: "The first grocer in town to offer curbside pickup builds loyalty before others catch up.", cat: "First-mover advantage", why: "Being first wins customers early." },
  ];
  const DURABLE = [
    { t: "Years of proprietary customer data plus analysts whose methods are built into daily decisions", ok: true, why: "Data and embedded expertise take years to replicate." },
    { t: "A service culture where staff use the CRM history to anticipate each customer's needs", ok: true, why: "Culture and process woven around technology are hard to copy." },
    { t: "A large, active user network that makes the platform more valuable to each new user", ok: true, why: "Network effects are hard for a newcomer to overcome." },
    { t: "Unique logistics processes refined over a decade and supported by custom software", ok: true, why: "Process know-how combined with technology is sustainable." },
    { t: "An off-the-shelf CRM that any competitor can license next month", ok: false, why: "Purchasable technology alone is easily copied." },
    { t: "Being first with a mobile app that rivals can build in six months", ok: false, why: "First-mover edges fade once the feature is copied, unless reinforced." },
    { t: "Faster laptops for the sales team", ok: false, why: "Commodity hardware gives no lasting edge." },
    { t: "A website redesign using a popular template", ok: false, why: "Anyone can use the same template." },
  ];
  const ADV_CONCEPT = [
    { q: "A rival copies a firm's new mobile app within six months. According to the chapter, what makes an IS-based advantage <b>sustainable</b>?", right: "Combining the technology with unique processes, culture and expertise that are hard to copy",
      rightWhy: "Technology alone is copied; the sociotechnical combination is not.",
      wrong: [{ t: "Buying the most expensive software available", why: "Competitors can buy the same software." },
        { t: "Being first, since first movers keep their lead forever", why: "First-mover advantage fades as competitors copy." },
        { t: "Patenting every screen in the app", why: "The chapter's answer is the people-process-technology combination, not legal protection of screens." }],
      sol: ["Ask what a rival cannot simply purchase.", "Unique processes, culture and expertise woven around technology create durable advantage."] },
    { q: "Why do network effects make it hard for a new competitor to win users from an established platform?", right: "The established platform is more valuable precisely because so many others already use it",
      rightWhy: "A newcomer with few users offers less value, even with similar features.",
      wrong: [{ t: "Because the established platform must be cheaper", why: "Price is not the mechanism; user count is." },
        { t: "Because government rules forbid new platforms", why: "That would be a regulatory barrier, not a network effect." },
        { t: "Because users store years of records there", why: "That describes switching costs, a different source of advantage." }],
      sol: ["What makes a network-effect product valuable?", "The number of users; a newcomer starts with few."] },
    { q: "An accounting software company keeps customers even after raising prices, because customers' years of records and reports live in the product. Which advantage is this?", right: "Switching costs",
      rightWhy: "Leaving would require moving years of embedded records.",
      wrong: [{ t: "Network effects", why: "The product's value does not depend on how many other firms use it." },
        { t: "First-mover advantage", why: "Nothing says the company was first; the lock-in comes from embedded data." },
        { t: "Cost leadership", why: "It raised prices; this is not about being lowest cost." }],
      sol: ["Ask why customers do not leave.", "Leaving is painful because the system is embedded in their work → switching costs."] },
    { q: "Why is first-mover advantage often temporary?", right: "Competitors can copy the technology once it proves valuable",
      rightWhy: "Being first wins attention, but the tool itself can be replicated.",
      wrong: [{ t: "Because customers always prefer the second company", why: "There is no such rule; first movers can win loyalty." },
        { t: "Because the first mover cannot collect data", why: "First movers can collect data; the issue is imitation." },
        { t: "Because first movers face no switching costs", why: "Switching costs could help them; that is not why the edge fades." }],
      sol: ["What happens after a technology proves itself in the market?", "Rivals copy it, so the edge fades unless it is reinforced by data, processes or network effects."] },
  ];
  const ADV_TF = [
    { s: "A competitive advantage based on technology alone is rarely permanent.", truth: true, why: "Competitors can buy or copy the technology.", hint: "Can rivals buy the same tools?" },
    { s: "A product has network effects if it is simply very popular.", truth: false, why: "Network effects mean each additional user makes it more valuable to the others, not just that many people buy it.", hint: "Does another user make it better for you?" },
    { s: "Collecting and analyzing customer data to personalize offers treats data as an asset.", truth: true, why: "That is the chapter's description of data as an asset.", hint: "What is the data used for?" },
    { s: "Switching costs come from a firm being the first to adopt a technology.", truth: false, why: "That is first-mover advantage. Switching costs come from a system being embedded in the customer's work.", hint: "Why would a customer find leaving painful?" },
  ];

  const genAdvantage = STUDY.makeGenerator({
    id: "k201-ch3-advantage",
    name: "Other sources of IS advantage",
    blurb: "Recognize switching costs, network effects, data as an asset and first-mover advantage, and judge which advantages last.",
    variants: [
      ...pickVariants(sortVariants({ key: "ch3-adv", bank: ADV_BANK, cats: ADV, defs: ADV_DEFS, ask: "situation",
        hint: "Ask where the edge comes from: pain of leaving, value from other users, insight from data, or simply being first?" }),
      ["Sort (drop-down)", "Pick the example", "Which is NOT…"]),
      {
        name: "Which advantages will last? (select all)",
        make() {
          const k = U.randInt(1, 4);
          const opts = U.sample(DURABLE.filter(d => d.ok), k).concat(U.sample(DURABLE.filter(d => !d.ok), 5 - k));
          return Q.multi({
            q: `<p>A mid-sized retailer lists its possible sources of advantage. Select <b>every</b> one that would be <b>hard for a rival to copy</b> within a year or two.</p>`,
            options: opts,
            sol: S("For each, ask: could a competitor simply buy or build this next year?",
              "Durable advantage combines technology with unique processes, culture, expertise, data or a large network. Purchasable technology alone is temporary."),
          });
        },
      },
      conceptVariant("Explain the advantage", "ch3-adv", ADV_CONCEPT),
      tfVariant("True or false: advantage", "ch3-adv", ADV_TF),
    ],
  });

  const generators = [genDik, genPpt, genTypes, genProcess, genFunctional, genForces, genGeneric, genAdvantage];

  STUDY.registerUnit(C, {
    id: "ch3", order: 3,
    title: "Chapter 3 · Information Systems in Business: Operations, Decisions, and Strategy",
    short: "Ch 3 · IS in Business",
    description: "Data vs. information vs. knowledge, the IS as a people-process-technology system, TPS/MIS/DSS/EIS, business processes and ERP, and how IS support Porter's Five Forces and generic strategies.",
    notes, flashcards, cues, generators,
  });
})();
