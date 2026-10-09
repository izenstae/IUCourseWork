/* ============================================================
 * BUS K201 · Chapter 5 · From Requirements to Reality
 * The system development lifecycle as a handoff system, ROI and
 * problem framing, business requirements (and what is NOT one),
 * build vs. buy vs. configure, development approaches, testing with
 * use cases, edge cases and Given/When/Then acceptance tests, and
 * deployment, production signals and change management.
 * All explanations, examples and scenarios are written for this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const S = K.S;
  const C = "bus-k201";
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "The SDLC as a handoff system",
      lo: "Explain how each stage of the system development lifecycle creates (or destroys) business value.",
      html: `<p>The <b>system development lifecycle (SDLC)</b> is the structured path from "we have a business problem" to "we have a working, supported system." The most useful way to picture it is as a <b>relay of handoffs</b>: each stage passes the next one better evidence about what to build and whether it works.</p>
<ol>
<li><b>Planning, analysis &amp; requirements</b> — Which problem is worth solving? What evidence shows it is real? What must the system accomplish? (Are we solving the <em>right</em> problem?)</li>
<li><b>Design</b> — How will the process, data, security, user experience, integrations and exceptions work?</li>
<li><b>Development</b> — Turning the design into software, configuration, automation, reports, workflows and integrations.</li>
<li><b>Testing</b> — Gathering evidence that it works under normal <em>and</em> unusual conditions.</li>
<li><b>Deployment</b> — Launching: preparing users, moving data, managing risk, avoiding disruption.</li>
<li><b>Maintenance</b> — Supporting, monitoring, fixing and improving it, and making sure people keep using it correctly.</li>
</ol>
<p>If any link breaks, value leaks out: a brilliant build aimed at the wrong problem wastes money; a requirement nobody tested creates risk; a tool nobody adopts creates almost no value.</p>
<p>Before funding any proposal, ask the <b>five-part question set</b>:</p>
<ul>
<li><b>Problem</b> — What business problem are we solving?</li>
<li><b>Evidence</b> — What do stakeholders show us that proves it exists and matters?</li>
<li><b>Requirement</b> — What must the system accomplish, without assuming a design?</li>
<li><b>Reality test</b> — How will we know it works under real conditions?</li>
<li><b>Change</b> — Who will adopt, support, monitor and improve it after launch?</li>
</ul>
<p>Many people share the work: <b>business analysts</b> turn stakeholder evidence into requirements; <b>product owners</b> prioritize value; <b>UX designers</b> shape how people interact with it; <b>software engineers</b> build and maintain code; <b>data architects and DBAs</b> design the data structures; <b>security specialists</b> manage risk; <b>integration specialists</b> connect systems; <b>QA testers</b> create evidence that it works; and <b>managers</b> make the tradeoffs and own the business result.</p>
<div class="keyidea"><b>Key idea.</b> If you cannot answer all five questions (problem, evidence, requirement, reality test, change), the return on the investment is still unproven, however impressive the demo.</div>
<div class="example"><b>Example.</b> A food-delivery startup's team builds a slick driver-tip feature in two weeks. It passes every test. But nobody asked drivers; their real complaint was unpredictable pickup wait times. Development and testing were excellent; the first handoff (problem and evidence) was broken, so the value never arrived.</div>
<div class="trap"><b>Common trap.</b> Thinking design is "what the screens look like." Design also covers workflow, data structure, permissions, integrations, security, error handling, auditability, performance, accessibility, reporting and support. Managers check that the design keeps business rules, user needs and risk controls intact.</div>`,
      gens: ["k201-ch5-sdlc"],
    },
    {
      title: "ROI starts with framing the right problem",
      lo: "Frame a business problem by separating symptoms from causes, and judge return on investment beyond the technology.",
      html: `<p><b>ROI</b> asks whether the value a system creates is worth what the organization spends to make it real. "Spend" is much more than the price tag: money, staff time, risk, disruption, training, support and the effort of changing how people work.</p>
<p>That is why the first step is <b>never "choose the software."</b> Requests usually arrive as solutions ("we need an app," "build a dashboard," "get an AI tool"), and a solution can treat only the <b>symptom</b>. Think of a patient with foot pain: a stronger painkiller hides the symptom but leaves a fracture untreated.</p>
<ul>
<li><b>Symptom</b> — what people notice first (slow approvals, angry calls, overtime).</li>
<li><b>Cause</b> — the underlying reason it keeps happening (unclear policy, missing data, poor communication, inconsistent decisions, too many handoffs).</li>
</ul>
<p>The <b>5 Ws</b> help you dig: <b>Who</b> is affected? <b>What</b> exactly is the problem? <b>Where</b> does it occur? <b>When</b> does it happen? <b>Why</b> does it happen (and why does it matter)?</p>
<p>A <b>weak problem frame</b> jumps to a solution ("Build a complaints dashboard"). A <b>strong frame</b> explains the business issue: who is affected, what goes wrong, where and why, and what it costs.</p>
<div class="keyidea"><b>Key idea.</b> A strong problem statement describes the business issue and its cause without naming a tool. If the statement contains "app," "dashboard" or a product name, you are probably looking at a solution in disguise.</div>
<div class="example"><b>Example.</b> Weak: "We need a delivery-tracking app." Strong: "Sales staff at our three stores promise delivery dates without seeing warehouse capacity, so about one delivery in five is rescheduled, which drives repeat calls and refund requests." The strong version points at the cause (no shared view of capacity), and the fix might not need a new app at all.</div>
<div class="trap"><b>Common trap.</b> Assuming more data, more automation or more features means more value. A system can be a technical success and an economic failure: perfectly accurate data that nobody uses, a broken process that is now automated, or wrong decisions made faster.</div>`,
      gens: ["k201-ch5-framing"],
    },
    {
      title: "Tradeoffs, the smallest responsible investment, and AI",
      lo: "Use tradeoff triangles to reason about cost, scope, time and quality, and explain why AI speeds creation but not accountability.",
      html: `<p>Most ROI decisions happen <b>early</b>: which problem to solve, how much evidence to gather, which requirements matter, which tradeoffs to accept. A useful managerial question is not "Can we build this?" but <em>"What is the smallest responsible investment that lets us solve the right problem, learn enough, protect the business and create measurable value?"</em></p>
<p>Evidence costs money too. A restaurant curious about slow soft-drink service could time every single pour for a month, which is accurate but overkill. Timing a smaller sample during busy and quiet hours may reveal the same bottleneck for a fraction of the cost.</p>
<p><b>Tradeoff triangles.</b> Formal project management uses <b>cost, scope and time</b>: if scope grows while cost and time are fixed, something else gives, usually quality or risk. The technology version is <b>cost, quality and speed</b> ("cheaper, better, faster — pick two"). When someone wants all three, ask: what scope changes, what resources are added, what risk are we accepting, or what process improvement makes it realistic? Otherwise the hidden cost shows up later as rework, security exposure, frustrated users, support tickets and failed adoption.</p>
<p><b>AI speeds creation, not accountability.</b> AI can draft requirements, mock-ups and documentation, summarize interview notes and produce prototypes. It can also misunderstand the problem, miss exceptions, bake in wrong assumptions, expose data, or produce code that only works in a demo. Faster output makes a <b>human in the loop</b> more important, not less.</p>
<div class="keyidea"><b>Key idea.</b> AI can accelerate parts of the lifecycle; it cannot take responsibility for the outcome. Every triangle has a side that gives; a good manager decides which one on purpose.</div>
<div class="example"><b>Example.</b> A director asks for a scheduling tool "with all the features, by next month, on the current budget." A good response: "We can hit the date and budget if we limit version 1 to shift-swap requests, accept that reports come in version 2, and pilot it in one department first."</div>
<div class="trap"><b>Common trap.</b> Believing a strong team can absorb added scope "for free." The cost does not disappear; it moves to quality, risk or a later budget.</div>`,
      gens: ["k201-ch5-framing"],
    },
    {
      title: "What a business requirement is — and is not",
      lo: "Distinguish business requirements from vague wishes, design choices, tool choices, complaints, workarounds and build tasks.",
      html: `<p>A <b>business requirement</b> is a clear statement of what a system must accomplish or support so the organization can achieve a business purpose. It sits <b>between</b> messy human evidence (interviews, complaints, observations) and technical work (design and code). The usual pattern is <b>"The system must …"</b>.</p>
<p>Six kinds of statements sound like requirements but are not:</p>
<table class="tbl"><thead><tr><th>Type</th><th>What it is</th><th>Example</th></tr></thead><tbody>
<tr><td>Vague wish</td><td>A feeling with nothing you can check</td><td>"It should be intuitive."</td></tr>
<tr><td>Design choice</td><td>How it looks or is laid out</td><td>"Holidays should show in orange."</td></tr>
<tr><td>Tool choice</td><td>Which product or technology to use</td><td>"Do it in Google Sheets."</td></tr>
<tr><td>Complaint</td><td>Frustration that signals a problem</td><td>"The current form is awful."</td></tr>
<tr><td>Workaround</td><td>What people do today to cope</td><td>"I text the supervisor a photo of the sign-in sheet."</td></tr>
<tr><td>Build task</td><td>A piece of technical work</td><td>"Create the endpoint for requests."</td></tr>
</tbody></table>
<p>Each one is still <b>useful evidence</b>. A complaint tells you where it hurts; a workaround shows what people actually need; a tool suggestion hints at a constraint. Your job is to translate the evidence into what the system must accomplish.</p>
<div class="keyidea"><b>Key idea.</b> A requirement states <em>what</em> must be accomplished for the business, not <em>how</em> it will look, <em>which</em> tool will do it, or <em>who feels bad</em> today.</div>
<div class="example"><b>Example.</b> Evidence: "Every Friday I email payroll a list of who was out." Requirement: "The system must send payroll each approved absence, with the employee, dates and leave type, before the weekly payroll run."</div>
<div class="trap"><b>Common trap.</b> Starting a design choice or tool choice with "The system must…" does not turn it into a requirement. "The system must use a red banner" is still a design choice; ask what the banner is <em>for</em> (warning a manager about an understaffed shift) and write that.</div>`,
      gens: ["k201-ch5-reqsort"],
    },
    {
      title: "Writing strong, testable requirements",
      lo: "Translate stakeholder evidence into specific, testable requirements and connect them to the data lifecycle.",
      html: `<p>A strong requirement is:</p>
<ul>
<li><b>Specific</b> — it names the exact capability, not a general hope.</li>
<li><b>Stakeholder-aware</b> — it reflects who needs it and who may see or do what.</li>
<li><b>Information-focused</b> — it is about the information and decisions the business needs, not colors or layout.</li>
<li><b>Testable</b> — someone could check it and see pass or fail.</li>
<li><b>Concise</b> — one idea, stated plainly.</li>
</ul>
<p><b>Stakeholders are evidence, not answer keys.</b> When someone asks for a dashboard, the real need may be "I can't see approval status." A request for "a button" may mean "this decision takes too long." A "prettier spreadsheet" may mean "our records aren't structured, searchable or enforceable." Listen to the request, then ask what problem it is solving.</p>
<p>Requirements are also where the <b>data lifecycle</b> shows up: what data must be <b>captured</b>, <b>validated</b>, <b>protected</b>, <b>shared</b>, <b>tested</b>, <b>migrated</b>, <b>monitored</b>, <b>corrected</b> and <b>improved</b> once the system is in production.</p>
<div class="keyidea"><b>Key idea.</b> A requirement is not finished until you can say how it would be tested. If no one could ever show it passing or failing, rewrite it.</div>
<div class="example"><b>Example.</b> Complaint: "Customers say our site is slow." Testable requirement: "The system must display a customer's order history within 3 seconds of the request." Untestable version: "The system should be fast for customers."</div>
<div class="trap"><b>Common trap.</b> Building exactly what a stakeholder asked for. The request ("add a dashboard") is a clue to the need ("managers can't see which requests are stuck"), and the need may be met more cheaply another way, such as a daily alert.</div>`,
      gens: ["k201-ch5-reqwrite"],
    },
    {
      title: "Build, buy or configure",
      lo: "Evaluate build vs. buy vs. configure using business fit, total cost, risk, supportability and long-term value.",
      html: `<ul>
<li><b>Buy packaged software</b> when the process is common, a vendor product fits, support is strong and speed matters. The vendor has already built, tested and supports it, and keeps updating it.</li>
<li><b>Configure / customize</b> a vendor system when it mostly fits but the organization needs its own rules, roles, fields, workflows, reports or permissions.</li>
<li><b>Develop custom</b> when the capability is unique, strategic, data-sensitive, tightly integrated or central to competitive advantage. You get stronger fit and control, but you also take on responsibility for design, testing, security, maintenance and support.</li>
</ul>
<p>Inside custom work there are three routes: <b>prototype</b> (when requirements are uncertain and users need something concrete to react to), <b>build new functionality</b> (when no existing tool fits and you are ready to own it), and <b>integrate systems</b> (when good tools exist but do not work together, which demands care with data quality, permissions, timing, error handling and who is responsible when the connection fails).</p>
<p><b>Total cost</b> includes licensing, configuration, data migration, integration, training, support, security, compliance, vendor dependence, future changes and disruption, and for custom work the ongoing capacity to maintain it.</p>
<div class="keyidea"><b>Key idea.</b> None of the options is automatically best. And "buy" does not mean "done": the organization still owns its requirements, setup, data, testing, training, support and the question of fit.</div>
<div class="example"><b>Example.</b> A 60-person accounting firm buys a packaged payroll product (a common process, strong vendors). It configures the firm's own approval chain in its HR system. It integrates the two so changes in HR reach payroll automatically. Nothing there needs to be built from scratch.</div>
<div class="trap"><b>Common trap.</b> Treating a prototype as nearly finished. A prototype proves an idea is possible; it usually lacks security, error handling, documentation, testing, scalability and a support owner.</div>`,
      gens: ["k201-ch5-sourcing"],
    },
    {
      title: "Waterfall, Agile, Scrum and DevOps",
      lo: "Compare development approaches by their rhythm and feedback loop, and choose one that fits a situation.",
      html: `<p>Every approach still needs problem framing, requirements, design, development, testing, deployment and maintenance. What differs is the <b>rhythm</b> and <b>how often feedback arrives</b>.</p>
<ul>
<li><b>Waterfall</b> — linear: finish each stage before starting the next. Strong documentation, approvals, budgets and milestones. Best when the problem is well understood and requirements are stable. Risk: it assumes certainty early, so learning late is expensive. Waterfall is not the villain; it fits stable, regulated, contract-driven work.</li>
<li><b>Agile</b> — short feedback loops: build in small increments, get frequent feedback, adapt. Requirements and testing become continuous, which lowers the cost of misunderstanding.</li>
<li><b>Scrum</b> — one common way to organize Agile: short work cycles, a focused set of tasks per cycle, and a regular review of what was finished.</li>
<li><b>DevOps</b> — connects development with release, operations, monitoring and improvement, closing the gap between the people who build and the people who run systems. <b>CI/CD</b> (continuous integration / continuous delivery) tests and releases changes frequently and consistently.</li>
</ul>
<p>Design turns into build through software, configuration, automation, integrations, reports, migration scripts and workflows. Good teams use professional practices: version control, documentation, naming conventions, code review, accessibility and security checks, dependency management, integration testing, monitoring hooks and deployment readiness.</p>
<div class="keyidea"><b>Key idea.</b> Modern methods shrink the feedback loop; they do not transfer accountability. Choose the rhythm that matches how certain the requirements are.</div>
<div class="example"><b>Example.</b> A state-mandated tax-reporting module with fixed rules and audit sign-offs suits Waterfall. A new customer app whose features are still a guess suits Agile with two-week Scrum cycles. A retailer pushing small fixes to a live site several times a week suits DevOps with CI/CD.</div>
<div class="trap"><b>Common trap.</b> "Agile means no requirements or documentation." Agile still writes requirements and tests; it just revisits them continuously instead of freezing them once.</div>`,
      gens: ["k201-ch5-methods"],
    },
    {
      title: "Testing: use cases, edge cases and Given/When/Then",
      lo: "Connect requirements to normal use cases, edge cases and acceptance tests written as Given/When/Then.",
      html: `<p>Testing is <b>evidence gathering</b>, not a last-minute check. Three tools link a requirement to reality:</p>
<ul>
<li><b>Normal use case</b> — the expected, everyday workflow.</li>
<li><b>Edge case</b> — an unusual, boundary, conflicting, missing-data or high-risk situation.</li>
<li><b>Acceptance test</b> — a specific, verifiable condition that must be true for the feature to count as complete. Anyone can run it and see pass or fail.</li>
</ul>
<p>Acceptance tests are often written as <b>Given / When / Then</b>: <b>Given</b> the starting condition, <b>When</b> an action happens, <b>Then</b> an expected, observable result. Because it describes observable outcomes, the test stays valid even if the code underneath changes.</p>
<table class="tbl"><tbody>
<tr><th>Requirement</th><td>The system must block approval of any absence that would drop a shift below its minimum staffing for that department, role and shift.</td></tr>
<tr><th>Normal use case</th><td>A cashier asks for one Saturday off; coverage stays above the minimum, and the manager approves.</td></tr>
<tr><th>Edge case</th><td>Two pharmacists ask for the same overnight shift off; approving both would break the minimum.</td></tr>
<tr><th>Acceptance test</th><td><b>Given</b> an overnight shift with a minimum of 5 pharmacists and two pending requests that would leave 4, <b>when</b> the manager tries to approve the second request, <b>then</b> the system refuses, alerts the manager and records the reason.</td></tr>
</tbody></table>
<div class="keyidea"><b>Key idea.</b> If a requirement has no acceptance test, you cannot prove it is done. "Then" must be something you can observe, not "it works correctly."</div>
<div class="example"><b>Example.</b> Requirement: refunds over $500 need a supervisor. Edge case: two $300 refunds on the same order a minute apart. Acceptance test: Given an order with a $650 refund request, when an agent clicks Issue refund, then the refund shows "Awaiting supervisor" and no money is sent.</div>
<div class="trap"><b>Common trap.</b> Testing only the happy path. AI-assisted building makes code appear faster, so weak testing just moves defects into production faster, where they cost the most (rework, support load, compliance exposure, lost trust).</div>`,
      gens: ["k201-ch5-testing"],
    },
    {
      title: "Deployment, production and change management",
      lo: "Describe deployment and production support, read production signals, and explain why change management is where ROI becomes real.",
      html: `<p><b>Deployment</b> moves a tested system into use: data migration, cutover planning, a pilot rollout, a staged release, permissions, training, communication, fallback plans and go-live support.</p>
<p><b>Production</b> means real users, real data, real decisions and real consequences. <b>Production support</b> includes monitoring, alerts, incident response, bug fixes, user support, data correction, security updates, performance tuning, vendor coordination and continuous improvement.</p>
<p><b>Production signals</b> tell you whether the system is creating value: error rates, support tickets, incomplete transactions, approval delays, failed integrations, adoption rates, data-correction requests, customer complaints and exception overrides.</p>
<p><b>Change management</b> is where ROI becomes real, and it cannot be automated away. Before launch, ask: What will we monitor? Who owns support when it fails? What training and communication do people need? How will changes and enhancements be requested? What is the fallback plan?</p>
<p><b>Vibe coding</b> is building software mainly by describing it in plain language and letting AI write much of the code. It is powerful for exploring ideas, but a working demo is not a maintainable, secure, integrated system. A prototype should never be used to justify "Can we deploy next week?" without architecture, integration, privacy and security review, testing, training, monitoring and a support owner.</p>
<div class="keyidea"><b>Key idea.</b> A prototype shows an idea is possible. It does not prove the problem is right, the right people were involved, data is protected, exceptions are handled, users are trained, or enough value is created.</div>
<div class="example"><b>Example.</b> Two weeks after a new expense system goes live, exception overrides climb from 3% to 22% of claims. The system "works," but managers are bypassing it, a production signal that the rules or the training are wrong. That is a reason to investigate, not to celebrate the launch.</div>
<div class="trap"><b>Common trap.</b> Treating go-live as the finish line. Most of the value (and most of the risk) arrives after launch, when real people either adopt the system or work around it.</div>`,
      gens: ["k201-ch5-launch"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const P = "k201-ch5-c-";
  const flashcards = [
    { id: P + "sdlc", tag: "Definition", front: "What is the <em>system development lifecycle (SDLC)</em>?", back: "A structured path from a business problem to a working, supported system. Best seen as a <b>handoff system</b>: each stage passes the next one better evidence." },
    { id: P + "stages", tag: "List", front: "Name the six SDLC stages in order.", back: "1 Planning, analysis &amp; requirements · 2 Design · 3 Development · 4 Testing · 5 Deployment · 6 Maintenance." },
    { id: P + "chain", tag: "Why", front: "Why does a brilliant build still fail to create value?", back: "The chain must hold. A great build on the wrong problem wastes money; an untested requirement creates risk; a tool nobody adopts creates little value." },
    { id: P + "five", tag: "List", front: "What is the five-part question set for any proposal?", back: "<b>Problem</b> (what business problem?), <b>Evidence</b> (proof it exists and matters), <b>Requirement</b> (what must the system accomplish, without assuming the design), <b>Reality test</b> (how will we know it works under real conditions), <b>Change</b> (who adopts, supports, monitors, improves it)." },
    { id: P + "roi", tag: "Definition", front: "What does <em>ROI</em> mean for an information system, and what counts as \"spend\"?", back: "Whether the value created is worth what it costs to make real. Spend includes money, time, risk, disruption, training, support and change effort, not just the price." },
    { id: P + "techecon", tag: "Example", front: "Give an example of a system that is a technical success but an economic failure.", back: "Accurate data that nobody uses; automating a broken process; an AI tool that makes wrong decisions faster." },
    { id: P + "smallest", tag: "Principle", front: "Instead of \"Can we build this?\", what should a manager ask?", back: "\"What is the smallest responsible investment that lets us solve the right problem, learn enough, protect the business and create measurable value?\"" },
    { id: P + "symptom", tag: "Distinction", front: "Symptom vs. cause — what's the difference?", back: "A <b>symptom</b> is what people notice first (slow approvals). A <b>cause</b> is the underlying reason it keeps happening (no one agrees who must approve). Fixing the symptom alone is like a painkiller for a broken foot." },
    { id: P + "5w", tag: "List", front: "What are the 5 Ws of problem framing?", back: "Who is affected? What is the problem? Where does it occur? When does it happen? Why does it happen (and matter)?" },
    { id: P + "frame", tag: "Distinction", front: "Weak vs. strong problem statement?", back: "Weak jumps to a solution (\"Build a complaints dashboard\"). Strong explains the business issue and cause (\"Managers can't spot urgent complaints because feedback arrives through four channels with no shared severity label or tracking\")." },
    { id: P + "triangle", tag: "Distinction", front: "Compare the two tradeoff triangles.", back: "Project management: <b>cost, scope, time</b>. Technology: <b>cost, quality, speed</b> (cheaper, better, faster). Push one side and another gives, often quality or risk." },
    { id: P + "hidden", tag: "Why", front: "If a team ignores the tradeoff triangle, where does the hidden cost show up?", back: "Later, as rework, security exposure, user frustration, support tickets and failed adoption." },
    { id: P + "ai", tag: "Principle", front: "What can AI do in the lifecycle, and what can't it do?", back: "It can draft requirements, mock-ups, summaries, tests, docs and prototypes. It can't take responsibility for the outcome, and may misread the problem, miss exceptions or expose data, so a human in the loop matters more." },
    { id: P + "req", tag: "Definition", front: "What is a <em>business requirement</em>?", back: "A clear statement of what the system must accomplish or support so the organization achieves a business purpose. It sits between messy human evidence and technical work. Pattern: \"The system must…\"" },
    { id: P + "ssitc", tag: "List", front: "Five qualities of a strong requirement?", back: "<b>S</b>pecific, <b>S</b>takeholder-aware, <b>I</b>nformation-focused, <b>T</b>estable, <b>C</b>oncise." },
    { id: P + "notreq", tag: "List", front: "Six kinds of statements that are NOT requirements?", back: "Vague wish (\"should be easy\"), design choice (\"show it in red\"), tool choice (\"build it in Excel\"), complaint (\"managers hate the spreadsheet\"), workaround (\"email payroll every Friday\"), build task (\"create the API endpoint\")." },
    { id: P + "workaround", tag: "Why", front: "Why is a workaround valuable even though it is not a requirement?", back: "It shows what people actually need to get done. \"I email payroll every Friday\" reveals a requirement: approved absences must reach payroll before each run." },
    { id: P + "evidence", tag: "Example", front: "\"Stakeholders are evidence, not answer keys.\" Give an example.", back: "A request for a dashboard may really mean \"I can't see approval status\"; a request for a new button may mean \"this decision takes too long\"; a prettier spreadsheet may mean \"records aren't structured or searchable.\"" },
    { id: P + "datalc", tag: "List", front: "Which data-lifecycle concerns show up in requirements?", back: "What data must be captured, validated, protected, shared, tested, migrated, monitored, corrected and improved in production." },
    { id: P + "buy", tag: "Principle", front: "When does buying packaged software make sense?", back: "When the process is common, a vendor product fits, support is strong and speed matters. The vendor already built, tested, supports and updates it." },
    { id: P + "configure", tag: "Principle", front: "When do you configure/customize instead of buying as-is?", back: "When a vendor system mostly fits but you need your own rules, roles, fields, workflows, reports or permissions." },
    { id: P + "custom", tag: "Principle", front: "When is custom development justified, and what is the price?", back: "When the capability is unique, strategic, data-sensitive, tightly integrated or a competitive advantage. Price: you own design, testing, security, maintenance and support." },
    { id: P + "buydone", tag: "Misconception", front: "True or false: \"Once we buy the software, we're done.\"", back: "<b>False.</b> The organization still owns requirements, setup, data, testing, training, support and fit." },
    { id: P + "routes", tag: "Distinction", front: "Prototype vs. build new vs. integrate?", back: "<b>Prototype</b>: requirements are uncertain; users react to something concrete. <b>Build new</b>: no tool fits; you own it. <b>Integrate</b>: good tools exist but don't talk to each other; watch data quality, permissions, timing, errors and failure ownership." },
    { id: P + "tco", tag: "List", front: "What belongs in the full cost of a system option?", back: "Licensing, configuration, data migration, integration, training, support, security, compliance, vendor dependence, future changes, disruption, and (for custom) the capacity to maintain it." },
    { id: P + "waterfall", tag: "Definition", front: "Waterfall: how it works, when it fits, its risk?", back: "Linear stages, each finished before the next, with documentation and approvals. Fits stable, well-understood requirements. Risk: assumes early certainty, so late learning is expensive." },
    { id: P + "agile", tag: "Distinction", front: "Agile vs. Scrum?", back: "<b>Agile</b> is the approach: small increments, frequent feedback, adapting. <b>Scrum</b> is one way to organize Agile: short work cycles, a focused task set per cycle, frequent review." },
    { id: P + "devops", tag: "Definition", front: "What are DevOps and CI/CD?", back: "<b>DevOps</b> connects development with release, operations and monitoring. <b>CI/CD</b> (continuous integration / continuous delivery) tests and releases changes frequently and consistently." },
    { id: P + "methods", tag: "Principle", front: "What do all development approaches have in common?", back: "All still need problem framing, requirements, design, development, testing, deployment and maintenance. They differ in rhythm and feedback frequency, and none transfers accountability." },
    { id: P + "testing", tag: "Principle", front: "Why is testing called \"evidence gathering\"?", back: "It produces proof that the system meets its requirements under normal and unusual conditions. A requirement is incomplete until you know how it could be tested." },
    { id: P + "edge", tag: "Distinction", front: "Normal use case vs. edge case vs. acceptance test?", back: "<b>Normal use case</b>: the expected workflow. <b>Edge case</b>: unusual, boundary, conflicting, missing or high-risk conditions. <b>Acceptance test</b>: a specific pass/fail condition that must be true for the feature to be complete." },
    { id: P + "gwt", tag: "Definition", front: "What do Given, When and Then each describe?", back: "<b>Given</b> the starting condition; <b>When</b> the action; <b>Then</b> the expected observable result. It stays valid even if the implementation changes." },
    { id: P + "deploy", tag: "List", front: "What does deployment involve?", back: "Data migration, cutover planning, pilot rollout, staged release, permissions, training, communication, fallback plans and go-live support." },
    { id: P + "signals", tag: "List", front: "Name production signals worth watching.", back: "Error rates, support tickets, incomplete transactions, approval delays, failed integrations, adoption rates, data-correction requests, customer complaints, exception overrides." },
    { id: P + "change", tag: "List", front: "Five change-management questions to answer before launch?", back: "What will we monitor? Who owns support when it fails? What training and communication? How are changes and enhancements requested? What is the fallback plan?" },
    { id: P + "vibe", tag: "Definition", front: "What is <em>vibe coding</em>, and what is its risk?", back: "Creating software mainly by describing it in natural language and letting AI generate the code. Great for exploring, but it can hide defects: a working demo is not a maintainable, secure, integrated system." },
    { id: P + "proto", tag: "Why", front: "What does a prototype NOT prove?", back: "That it's the right problem, the right people were involved, data is protected, exceptions are handled, users are trained, or enough value is created." },
    { id: P + "roles", tag: "List", front: "Who does what? (business analyst, product owner, QA, manager)", back: "Business analyst: evidence → requirements. Product owner: prioritizes value. QA/tester: creates evidence it works. Manager: makes tradeoffs and owns the business outcome. (Also UX, engineers, data architects/DBAs, security and integration specialists.)" },
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "“We need an app / a dashboard / an AI tool”", think: "A solution in disguise — find the problem", why: "Requests usually name a solution; ask the 5 Ws to find the cause." },
    { when: "What people notice first (delays, angry calls, overtime)", think: "Symptom", why: "The cause is the reason it keeps happening; fix that." },
    { when: "“Should be easy / fast / modern”", think: "Vague wish", why: "Nothing can be tested; rewrite as a specific, checkable capability." },
    { when: "Colors, layout, button placement", think: "Design choice", why: "It says how it looks, not what the business must accomplish." },
    { when: "A product or technology name (Excel, a CRM, Python)", think: "Tool choice", why: "Tools come after requirements, in sourcing and design." },
    { when: "“I do X every Friday so that…”", think: "Workaround → hidden requirement", why: "It shows what people actually need the system to do." },
    { when: "“Create the endpoint / add the column / write the script”", think: "Build task", why: "Technical work in development, not a business requirement." },
    { when: "“The system must…” + observable, checkable outcome", think: "Business requirement", why: "Specific, stakeholder-aware, information-focused, testable, concise." },
    { when: "Common process, good vendors, need it fast", think: "Buy packaged software", why: "The vendor already built, tested and supports it." },
    { when: "Vendor product fits except for our rules, roles, fields", think: "Configure / customize", why: "Adjust the product rather than build from scratch." },
    { when: "Unique, strategic, sensitive, competitive advantage", think: "Custom development", why: "Control and fit, at the price of owning everything." },
    { when: "Good tools that don't talk to each other", think: "Integrate", why: "Mind data quality, permissions, timing, errors and ownership." },
    { when: "Stable, well-understood, signed-off requirements", think: "Waterfall", why: "Linear stages fit when early certainty is real." },
    { when: "Unclear needs, users change minds after seeing it", think: "Agile (e.g., Scrum)", why: "Short loops lower the cost of misunderstanding." },
    { when: "Frequent releases, monitoring, builders + operators", think: "DevOps with CI/CD", why: "Closes the gap between building and running." },
    { when: "Boundary, conflicting, missing or high-risk condition", think: "Edge case", why: "Normal use cases only test the expected flow." },
    { when: "Given … When … Then …", think: "Acceptance test", why: "Starting condition, action, observable pass/fail result." },
    { when: "Overrides, tickets, failed integrations rising after launch", think: "Production signal — investigate", why: "Users may be working around the system; ROI is at risk." },
    { when: "“The demo works, let's go live next week”", think: "Prototype ≠ production — pause", why: "No security, testing, training, monitoring or support owner yet." },
  ];

  /* ============================================================
   * TOPIC 1 · SDLC stages, five questions, roles
   * ============================================================ */
  const STAGES = ["Planning & requirements", "Design", "Development", "Testing", "Deployment", "Maintenance"];
  const stageDefs = {
    "Planning & requirements": "which problem is worth solving, what evidence shows it, what the system must accomplish",
    "Design": "how process, data, security, user experience, integrations and exceptions will work",
    "Development": "turning the design into software, configuration, automation, reports and integrations",
    "Testing": "gathering evidence it works under normal and unusual conditions",
    "Deployment": "launching: moving data, preparing users, managing risk and disruption",
    "Maintenance": "supporting, monitoring, fixing and improving it after launch",
  };
  const stageBank = [
    { t: "Interviewing schedulers to learn why shifts keep going uncovered", cat: "Planning & requirements", why: "gathering stakeholder evidence about the problem comes first." },
    { t: "Writing a problem statement that names who is affected and why it matters", cat: "Planning & requirements", why: "framing the problem is the opening handoff." },
    { t: "Deciding which of three proposed problems is worth solving first", cat: "Planning & requirements", why: "choosing the right problem is a planning decision about value." },
    { t: "Turning interview notes into \"The system must…\" statements", cat: "Planning & requirements", why: "translating evidence into requirements belongs to analysis." },
    { t: "Estimating whether the expected value justifies the full cost", cat: "Planning & requirements", why: "ROI judgments are made early, in planning." },
    { t: "Deciding which roles may view salary fields", cat: "Design", why: "permissions and security are designed before they are built." },
    { t: "Mapping how a request moves from employee to manager to payroll", cat: "Design", why: "designing the user workflow." },
    { t: "Planning what should happen when the payroll connection is down", cat: "Design", why: "exception handling is a design concern." },
    { t: "Choosing how the data tables will relate to each other", cat: "Design", why: "data structure is part of design." },
    { t: "Deciding how the new system will exchange data with the scheduling tool", cat: "Design", why: "integration design comes before integration code." },
    { t: "Writing the code for the approval workflow", cat: "Development", why: "turning the design into software." },
    { t: "Configuring the vendor product's fields and permission roles", cat: "Development", why: "configuration is how a bought product gets built out." },
    { t: "Building the monthly absence report", cat: "Development", why: "reports are produced in development." },
    { t: "Writing the script that will later move the old records", cat: "Development", why: "the migration script is built in development (it is run during deployment)." },
    { t: "Connecting the system to payroll through an API", cat: "Development", why: "integrations are built in development." },
    { t: "Trying a case where two people request the same shift off", cat: "Testing", why: "running an edge case produces evidence." },
    { t: "Checking that a $600 refund is held for a supervisor", cat: "Testing", why: "verifying a requirement against an acceptance test." },
    { t: "Having users try the system with realistic data to confirm it meets requirements", cat: "Testing", why: "user acceptance testing gathers evidence." },
    { t: "Confirming that a blocked approval writes its reason to the log", cat: "Testing", why: "checking an observable result." },
    { t: "Moving three years of records into the new system on cutover weekend", cat: "Deployment", why: "data migration happens at launch." },
    { t: "Launching at one store first as a pilot", cat: "Deployment", why: "pilot rollouts manage launch risk." },
    { t: "Training managers the week before go-live", cat: "Deployment", why: "preparing users is part of deployment." },
    { t: "Preparing a fallback plan in case go-live fails", cat: "Deployment", why: "fallback planning manages launch risk." },
    { t: "Watching error rates and support tickets in the months after launch", cat: "Maintenance", why: "monitoring production signals is ongoing support." },
    { t: "Fixing a bug users report in the second month of use", cat: "Maintenance", why: "bug fixes after launch are maintenance." },
    { t: "Applying a security update to the live system", cat: "Maintenance", why: "keeping the production system safe." },
    { t: "Adding a field HR requests six months after launch", cat: "Maintenance", why: "continuous improvement after go-live." },
    { t: "Correcting records saved with the wrong department", cat: "Maintenance", why: "data correction is production support." },
  ];
  const stageSort = K.sortVariants({
    key: "ch5-stage", bank: stageBank, cats: STAGES, defs: stageDefs, ask: "activity",
    hint: "Picture the relay: problem → design → build → test → launch → support. Where in that chain does this activity sit?",
  });

  const FIVE = ["Problem", "Evidence", "Requirement", "Reality test", "Change"];
  const fiveDefs = {
    "Problem": "what business problem are we solving?",
    "Evidence": "what stakeholder evidence shows it exists and matters?",
    "Requirement": "what must the system accomplish, without assuming the design?",
    "Reality test": "how will we know it works under real conditions?",
    "Change": "who adopts, supports, monitors and improves it after launch?",
  };
  const proposals = [
    { title: "a regional dental chain wants a new patient-reminder system", parts: {
      "Problem": "About 14% of appointments are no-shows, leaving hygienists idle and patients waiting weeks for openings.",
      "Evidence": "Front-desk logs from six offices and interviews with twelve receptionists show most no-shows had no reminder after booking.",
      "Requirement": "The system must remind each patient of an appointment 48 hours ahead and record whether they confirmed.",
      "Reality test": "In a one-office pilot, no-shows will be compared with the prior quarter, including patients without a mobile number.",
      "Change": "Office managers will own the reminder settings; IT will monitor failed messages weekly." } },
    { title: "a university housing office wants to replace its paper maintenance requests", parts: {
      "Problem": "Repair requests get lost between the front desk and facilities, so residents wait days for urgent fixes.",
      "Evidence": "A review of 300 paper slips found 1 in 8 had no date received and several urgent leaks were logged as routine.",
      "Requirement": "The system must record every request with a time received and an urgency level, and show facilities all open urgent requests.",
      "Reality test": "Staff will run a set of sample requests, including a leak reported twice and one with no room number, before launch.",
      "Change": "Resident assistants will be trained to log requests, and facilities will review overdue items every morning." } },
    { title: "a craft brewery wants software for tracking kegs", parts: {
      "Problem": "Kegs sent to bars are not returned on time, so the brewery buys replacements it should not need.",
      "Evidence": "Last year it bought 90 new kegs while its delivery records showed roughly 110 kegs sitting at customer sites.",
      "Requirement": "The system must show which customer holds each keg and for how many days.",
      "Reality test": "For a month, drivers will scan kegs on delivery and pickup, and staff will compare the system's count with a physical count.",
      "Change": "The sales manager will follow up on overdue kegs, and a driver lead will report scanning problems." } },
    { title: "a city parks department wants online shelter reservations", parts: {
      "Problem": "Picnic shelters are double-booked about twice a month because two clerks keep separate calendars.",
      "Evidence": "Complaint records and the two calendars show 23 double bookings last season.",
      "Requirement": "The system must prevent two reservations for the same shelter and time slot.",
      "Reality test": "Before launch, testers will try to book the same shelter from two computers at the same moment.",
      "Change": "One clerk will own the reservation rules, and residents will get an email explaining the new process." } },
  ];

  const roleBank = [
    { role: "Business analyst", acts: ["Turns interview notes and observations into clear business requirements", "Asks stakeholders follow-up questions to find the real need behind a request"] },
    { role: "Product owner", acts: ["Decides which features deliver the most value and orders the work", "Chooses what goes into the next release when time is short"] },
    { role: "UX designer", acts: ["Shapes how users move through screens and workflows", "Runs a session where users react to a clickable mock-up"] },
    { role: "Software engineer", acts: ["Writes and maintains the application code", "Fixes a defect in the approval logic"] },
    { role: "Data architect / DBA", acts: ["Designs how tables and keys are structured", "Plans how data is stored, backed up and kept consistent"] },
    { role: "Security specialist", acts: ["Reviews who can access sensitive payroll data", "Assesses the risk of exposing customer records in a prototype"] },
    { role: "Integration specialist", acts: ["Connects the HR system so changes reach payroll", "Decides what happens when the link to the CRM fails"] },
    { role: "QA / tester", acts: ["Runs edge cases and acceptance tests to create evidence the system works", "Writes test cases from the requirements"] },
    { role: "Manager", acts: ["Decides whether to cut scope or extend the deadline", "Stays accountable for whether the system creates business value"] },
  ];

  const breakBank = [
    { story: "A team spent four months building a polished approval app. Approvals stayed slow, because the real issue was that no policy said who must approve claims over the limit.", stage: "Planning & requirements", why: "the problem was framed wrong; the build aimed at a symptom." },
    { story: "A new scheduling system crashed the first time two employees swapped the same shift at once. Nobody had tried that situation before launch.", stage: "Testing", why: "an edge case was never tested, so the defect reached production." },
    { story: "The system worked, but on launch day managers had no training and kept using the old spreadsheet. Six months later almost nobody used it.", stage: "Deployment", why: "users were never prepared, so adoption failed at launch." },
    { story: "Every employee could open every other employee's salary record because nobody decided who should see which fields.", stage: "Design", why: "permissions are a design decision, and it was skipped." },
    { story: "A year after launch, the payroll link had been failing silently for weeks; no one was monitoring it or owned support.", stage: "Maintenance", why: "production monitoring and support ownership were missing." },
    { story: "The developers built the workflow from memory, skipping version control and code review; a later change wiped out a working feature and no one could restore it.", stage: "Development", why: "professional build practices were skipped." },
  ];

  const sdlcTF = [
    { s: "The SDLC is best understood as a series of handoffs in which each stage gives the next better evidence.", truth: true, why: "That is the handoff view: problem → design → build → test → launch → support." },
    { s: "If the build quality is excellent, the system will create value even if the problem was framed poorly.", truth: false, why: "A brilliant build on the wrong problem wastes money; every link in the chain must hold." },
    { s: "Design is mainly about choosing colors and screen layouts.", truth: false, why: "Design also covers workflow, data, permissions, integrations, security, error handling, auditability, performance, accessibility and support." },
    { s: "If a team cannot say how a system will be supported after launch, its ROI is still unproven.", truth: true, why: "\"Change\" is one of the five questions; without it, value may never materialize." },
    { s: "Maintenance ends once the system goes live.", truth: false, why: "Maintenance starts at go-live: support, monitoring, fixing and improving." },
    { s: "A business analyst's main job is turning stakeholder evidence into requirements.", truth: true, why: "That is the analyst's role in the handoff chain." },
  ];

  const genSdlc = STUDY.makeGenerator({
    id: "k201-ch5-sdlc",
    name: "The SDLC as a handoff system",
    blurb: "Place activities in the six stages, use the five-part question set, find where the chain broke, and match roles.",
    variants: [
      stageSort[0], stageSort[2], stageSort[3],
      {
        name: "Five questions: classify",
        make() {
          const ps = U.sample(proposals, 2);
          const items = [];
          const cats5 = U.sample(FIVE, 5);
          cats5.forEach((c, i) => { const p = ps[i % 2]; if (items.length < 5) items.push({ t: p.parts[c], cat: c, why: `It answers <b>${c}</b>: ${fiveDefs[c]}` }); });
          return Q.classify({
            q: `<p>Each statement comes from a project proposal. Which of the five questions does it answer?</p>`,
            cats: FIVE, items,
            sol: S("Ask what each sentence is <em>doing</em>: naming the pain, proving it, saying what the system must do, saying how you'll check it, or saying who carries it after launch.",
              `The five questions:${ul(FIVE.map(c => `<b>${c}</b>: ${fiveDefs[c]}`))}`),
          });
        },
      },
      {
        name: "Which question is unanswered?",
        make() {
          const p = U.rotate("ch5-prop", proposals);
          const missing = U.pick(FIVE);
          const shown = U.shuffle(FIVE.filter(c => c !== missing));
          return Q.mc({
            q: `<p>A proposal says ${p.title}. It contains these four statements:</p>${ul(shown.map(c => p.parts[c]))}<p>Which of the five questions does the proposal leave <b>unanswered</b>?</p>`,
            right: missing, rightWhy: `Nothing in the proposal addresses <b>${missing}</b> (${fiveDefs[missing]}).`,
            wrong: shown.map(c => ({ t: c, why: `It is answered: “${p.parts[c]}”` })),
            keepOrder: FIVE,
            sol: S("Label each statement with one of the five questions (Problem, Evidence, Requirement, Reality test, Change). The one with no statement is the gap.",
              `Matches: ${ul(shown.map(c => `<b>${c}</b> — ${p.parts[c]}`))}Missing: <b>${missing}</b>, ${fiveDefs[missing]} Until it is answered, the ROI is unproven.`),
          });
        },
      },
      {
        name: "Where did the chain break?",
        make() {
          const b = U.rotate("ch5-break", breakBank);
          return Q.mc({
            q: `<p>${b.story}</p><p>Which SDLC stage's handoff failed?</p>`,
            right: b.stage, rightWhy: `Yes — ${b.why}`,
            wrong: STAGES.filter(s => s !== b.stage).map(s => ({ t: s, why: `${s} covers ${stageDefs[s]}. The failure here is different: ${b.why}` })),
            keepOrder: STAGES,
            sol: S("Find the first point where the right evidence or work was missing; later stages just carried the mistake forward.", `It broke in <b>${b.stage}</b>: ${b.why}`),
          });
        },
      },
      {
        name: "Who does this?",
        make() {
          const r = U.rotate("ch5-role", roleBank);
          const act = U.pick(r.acts);
          const others = U.sample(roleBank.filter(x => x !== r), 3);
          return Q.mc({
            q: `<p>On a project team, who is <b>primarily</b> responsible for this?</p><p>“${act}”</p>`,
            right: r.role, rightWhy: `That is the ${r.role.toLowerCase()}'s job.`,
            wrong: others.map(o => ({ t: o.role, why: `The ${o.role.toLowerCase()} mainly ${o.acts[0].charAt(0).toLowerCase() + o.acts[0].slice(1)}.` })),
            sol: S("Ask what kind of work this is: evidence and requirements, priorities, user interaction, code, data, risk, connections, test evidence, or business tradeoffs.", `It is the <b>${r.role}</b>. ${ul(roleBank.map(x => `<b>${x.role}</b>: ${x.acts[0]}`))}`),
          });
        },
      },
      K.tfVariant("True or false: the lifecycle", "ch5-sdlc", sdlcTF),
    ],
  });

  /* ============================================================
   * TOPIC 2 · ROI, problem framing, tradeoffs
   * ============================================================ */
  const framingCases = [
    { head: "A furniture retailer says its deliveries are “a mess.”",
      Symptom: ["Customers call repeatedly to ask where their sofa is", "Delivery trucks leave half empty some days and overloaded on others"],
      Cause: ["Sales staff promise delivery dates without seeing the warehouse schedule", "There is no shared record of which orders are ready to ship"],
      Solution: ["Buy a GPS tracking app for the trucks", "Build a customer-facing delivery dashboard"] },
    { head: "A medical clinic's overtime bill keeps climbing.",
      Symptom: ["Overtime costs jumped 30% this quarter", "Front-desk staff stay late to finish check-ins"],
      Cause: ["Patient intake forms are filled out on paper and re-typed by hand", "Appointments are booked without checking how many staff are on shift"],
      Solution: ["Get an AI scheduling assistant", "Add a second monitor at every front-desk computer"] },
    { head: "Consultants at a firm complain about reimbursements.",
      Symptom: ["Consultants wait up to six weeks to be repaid", "Finance receives dozens of “where is my money?” emails a week"],
      Cause: ["No policy says who must approve claims over the travel limit", "Receipts arrive as photos in personal email with no link to the claim"],
      Solution: ["We need a new approval app", "Build a chatbot that answers reimbursement questions"] },
    { head: "A software company's customer complaints are getting out of hand.",
      Symptom: ["Urgent complaints sit unanswered for days", "Managers learn about serious issues from social media first"],
      Cause: ["Feedback comes through four channels with no shared severity label", "No one tracks whether a complaint has been resolved"],
      Solution: ["Build a dashboard for customer complaints", "Buy a social-media monitoring tool"] },
    { head: "A food bank keeps running short of volunteers on Saturdays.",
      Symptom: ["Saturday events start with half the needed volunteers", "Coordinators spend Friday nights making phone calls"],
      Cause: ["Shifts are confirmed by individual text messages, so no one sees the full roster", "Volunteers who cancel have no way to tell anyone except their own coordinator"],
      Solution: ["Build a volunteer mobile app", "Buy a premium texting service"] },
  ];
  const FR_CATS = ["Symptom", "Underlying cause", "Jumping to a solution"];
  const frWhy = {
    "Symptom": "it is what people notice first, not the reason it keeps happening.",
    "Underlying cause": "it explains why the problem keeps happening; fixing it removes the symptom.",
    "Jumping to a solution": "it names a tool before the cause is understood.",
  };

  const statementBank = [
    { ctx: "late furniture deliveries", strong: "Sales staff at our three stores promise delivery dates without seeing warehouse capacity, so about one delivery in five is rescheduled, driving repeat calls and refund requests.",
      weak: [{ t: "We need a delivery-tracking app.", why: "It jumps straight to a solution and says nothing about who is affected or why." },
             { t: "Deliveries are bad and customers are annoyed.", why: "It is a vague symptom: no who, where, why or business cost." },
             { t: "Our trucks are not full enough.", why: "It describes one symptom and ignores the cause (dates promised without capacity data)." }] },
    { ctx: "clinic overtime", strong: "Front-desk staff re-type paper intake forms into the records system, adding about eight minutes per patient and pushing check-in staff into overtime on busy days.",
      weak: [{ t: "Buy an AI scheduler for the front desk.", why: "It names a tool before the cause is known." },
             { t: "Overtime is too high.", why: "That is the symptom, not the cause." },
             { t: "The front desk needs to work faster.", why: "It blames people and gives no cause, scope or evidence." }] },
    { ctx: "slow reimbursements", strong: "Claims over the travel limit stall because no policy says who approves them, so reimbursements take up to six weeks and consultants flood finance with status emails.",
      weak: [{ t: "We need a new approval app.", why: "A solution in disguise; the real cause may be an unclear policy no app would fix." },
             { t: "Finance is slow.", why: "Vague and blaming; it gives no where, when or why." },
             { t: "Build a chatbot so consultants stop emailing finance.", why: "It treats a symptom (emails) with a tool." }] },
    { ctx: "customer complaints", strong: "Managers cannot tell which complaints are urgent because feedback arrives by email, web form, phone notes and social media with no shared severity label or resolution tracking.",
      weak: [{ t: "Build a dashboard for customer complaints.", why: "It jumps to a solution; a dashboard of unlabeled complaints would not show urgency." },
             { t: "Customers complain too much.", why: "A complaint about complaints; no cause or business impact." },
             { t: "We should hire more help-desk agents.", why: "Another solution, chosen before the cause is understood." }] },
    { ctx: "volunteer shortages", strong: "Coordinators confirm volunteer shifts by individual text messages, so nobody can see which Saturday events are short-staffed until the morning of the event.",
      weak: [{ t: "Build a volunteer app.", why: "It names a solution without describing the issue." },
             { t: "Scheduling volunteers is chaotic.", why: "Vague; it gives no who, where or why." },
             { t: "Volunteers are unreliable.", why: "Blames people and ignores the process cause (no shared roster)." }] },
  ];

  const W5 = ["Who", "What", "Where", "When", "Why"];
  const w5Bank = [
    { t: "Which employees or customers run into this problem?", cat: "Who" },
    { t: "Whose work is slowed down when it happens?", cat: "Who" },
    { t: "Which department pays the cost?", cat: "Who" },
    { t: "What exactly goes wrong, in observable terms?", cat: "What" },
    { t: "What does the problem cost us in errors, time or money?", cat: "What" },
    { t: "What happens today when a request arrives?", cat: "What" },
    { t: "In which store or system does it show up?", cat: "Where" },
    { t: "At which handoff in the process do requests get stuck?", cat: "Where" },
    { t: "Through which channel (phone, email, web) does the bad data enter?", cat: "Where" },
    { t: "Does it happen at month-end, on weekends, or all the time?", cat: "When" },
    { t: "How long has this been going on?", cat: "When" },
    { t: "During which hours or seasons does it spike?", cat: "When" },
    { t: "What underlying reason keeps it happening?", cat: "Why" },
    { t: "Why does it matter to the business if we leave it alone?", cat: "Why" },
    { t: "Why did the last fix not stick?", cat: "Why" },
  ];

  const roiCases = [
    { t: "A dashboard with perfectly accurate data that managers never open", ok: true, why: "Accurate but unused: cost with no value." },
    { t: "Automating a seven-step approval process that only needed two steps", ok: true, why: "Automating a broken process just makes the waste faster." },
    { t: "An AI pricing tool that helps the team reach wrong prices faster", ok: true, why: "Faster wrong decisions destroy value." },
    { t: "A reporting system that captures 200 fields when decisions use only six", ok: true, why: "More data is not more value; every extra field costs capture, cleaning and storage." },
    { t: "A shared form that cut reimbursement time from six weeks to one and that everyone uses", ok: false, why: "Clear value, widely adopted: an economic success." },
    { t: "A cheap prototype that showed users did not want a feature before money was spent building it", ok: false, why: "Cheap learning that avoided waste is good ROI." },
    { t: "An app that crashes every time two people use it", ok: false, why: "That is not a technical success at all; it fails technically." },
    { t: "A simple alert that warns managers about understaffed shifts and has cut last-minute overtime", ok: false, why: "It creates measurable value." },
  ];

  const costItems = [
    "License or subscription fees", "Hours staff spend in training", "Lost sales during the cutover weekend", "Ongoing help-desk support",
    "Manager time spent changing how approvals are done", "Integration work with the payroll system", "Cleaning old data before migration",
    "Security and compliance review", "Risk of exposing customer data during migration",
  ];
  const benefitItems = [
    "Hours saved each week once the system works", "Fewer refund errors", "Faster responses to customers", "Fewer missed appointments",
  ];

  const tradeBank = [
    { q: "Midway through a project, the scope grows by a third. The budget and deadline are locked. Under the project-management triangle, what is most likely to give?",
      right: "Quality or risk — corners get cut or more risk is accepted",
      wrong: [{ t: "Nothing; a skilled team absorbs the extra scope", why: "The cost doesn't vanish; it moves to quality, risk or a later budget." },
              { t: "The cost automatically falls", why: "Adding scope never lowers cost." },
              { t: "The scope shrinks back on its own", why: "Scope only shrinks if someone decides to cut it." }],
      sol: ["Cost, scope and time are linked; if one side grows and two are fixed, something else must move.", "With cost and time locked, the pressure lands on quality or risk."] },
    { q: "An executive asks for a system that is cheaper, better <em>and</em> faster than planned. What is the best response?",
      right: "Ask which side gives: what scope changes, what resources are added, what risk is accepted, or what process improvement makes it realistic",
      wrong: [{ t: "Agree; modern tools make all three possible", why: "The tech triangle says you rarely get all three without changing something." },
              { t: "Refuse to start the project", why: "Tradeoffs are a conversation, not a reason to stop." },
              { t: "Quietly drop testing to save time", why: "Hiding the tradeoff creates rework and risk later." }],
      sol: ["Recall the technology triangle: cost, quality, speed.", "The honest move is to make the tradeoff explicit and choose it on purpose."] },
    { q: "Which pair correctly names the two tradeoff triangles?",
      right: "Project management: cost, scope, time · Technology: cost, quality, speed",
      wrong: [{ t: "Project management: cost, quality, speed · Technology: cost, scope, time", why: "Swapped: scope and time belong to the formal project-management version." },
              { t: "Both: people, process, technology", why: "That is a different framework, not the tradeoff triangle." },
              { t: "Project management: risk, return, time · Technology: cost, scope, data", why: "Mixed-up terms; neither triangle is described this way." }],
      sol: ["One triangle comes from formal project management, the other is the everyday \"cheaper, better, faster.\"", "PM: cost, scope, time. Tech: cost, quality, speed."] },
    { q: "When are most ROI decisions about a system actually made?",
      right: "Early: choosing the problem, how much evidence to gather, which requirements matter and which tradeoffs to accept",
      wrong: [{ t: "At go-live, when the system is switched on", why: "By then most value-shaping choices are locked in." },
              { t: "During coding, when engineers choose a language", why: "Technical choices matter, but the big value choices come first." },
              { t: "A year later, when finance audits the project", why: "That measures ROI; it does not decide it." }],
      sol: ["Think about which choices determine whether value is even possible.", "Problem, evidence, requirements and tradeoffs are chosen early, so that is where ROI is won or lost."] },
    { q: "A restaurant suspects drink orders are slowing service. Someone proposes timing every pour, every shift, for three months. What's the best critique?",
      right: "A smaller sample at busy and quiet times would probably reveal the same bottleneck for far less cost",
      wrong: [{ t: "More data always gives more value, so time every pour", why: "Evidence has a cost; past a point it adds little." },
              { t: "No measurement is needed; just buy a faster drink machine", why: "That skips evidence and jumps to a solution." },
              { t: "Measure only the fastest bartender", why: "A biased sample hides the bottleneck." }],
      sol: ["Evidence is part of the investment, so ask: what is the smallest amount that answers the question?", "A well-chosen sample is the smallest responsible investment here."] },
    { q: "Which question best reflects the chapter's ROI mindset?",
      right: "What is the smallest responsible investment that lets us solve the right problem, learn enough, protect the business and create measurable value?",
      wrong: [{ t: "Can we build this?", why: "Almost anything can be built; the question is whether it is worth it." },
              { t: "What is the newest technology we could use?", why: "Novelty is not value." },
              { t: "How many features can we fit in?", why: "More features add cost and do not guarantee more value." }],
      sol: ["The goal is value per unit of investment and risk, not technical possibility.", "The \"smallest responsible investment\" question captures problem, learning, protection and value."] },
  ];

  const framingTF = [
    { s: "A request for a new app may address only a symptom of the real problem.", truth: true, why: "Requests often name a solution; the cause may be policy, data or communication." },
    { s: "A strong problem statement usually names the software product that will fix it.", truth: false, why: "A strong frame describes the business issue and cause; naming a tool is the weak-frame pattern." },
    { s: "\"Spend\" in an ROI calculation includes training, disruption and change effort, not just the purchase price.", truth: true, why: "Making a system real costs time, risk, disruption, training, support and change effort." },
    { s: "Automating a process always increases its value.", truth: false, why: "Automating a broken process just produces waste faster." },
    { s: "The 5 Ws are Who, What, Where, When and Why.", truth: true, why: "They help separate symptoms from causes." },
    { s: "AI tools take on accountability for the outcomes of the systems they help build.", truth: false, why: "AI can accelerate parts of the lifecycle but cannot take responsibility; humans stay accountable." },
  ];

  const genFraming = STUDY.makeGenerator({
    id: "k201-ch5-framing",
    name: "ROI, problem framing & tradeoffs",
    blurb: "Separate symptoms from causes, pick strong problem statements, use the 5 Ws, and reason about ROI and tradeoff triangles.",
    variants: [
      {
        name: "Symptom, cause or solution?",
        make() {
          const c = U.rotate("ch5-frcase", framingCases);
          const items = [
            ...U.sample(c.Symptom, U.randInt(1, 2)).map(t => ({ t, cat: "Symptom" })),
            ...c.Cause.map(t => ({ t, cat: "Underlying cause" })),
            ...U.sample(c.Solution, U.randInt(1, 2)).map(t => ({ t, cat: "Jumping to a solution" })),
          ].map(i => ({ ...i, why: `${i.cat}: ${frWhy[i.cat]}` }));
          return Q.classify({
            q: `<p>${c.head} Classify each statement.</p>`, cats: FR_CATS, items,
            sol: S("Ask of each: is it what people <em>notice</em>, the <em>reason</em> it keeps happening, or a <em>tool</em> someone wants to buy?",
              ul(FR_CATS.map(k => `<b>${k}</b>: ${frWhy[k]}`))),
          });
        },
      },
      {
        name: "Pick the strongest problem statement",
        make() {
          const e = U.rotate("ch5-stmt", statementBank);
          return Q.mc({
            q: `<p>A team is framing a problem about ${e.ctx}. Which is the <b>strongest</b> problem statement?</p>`,
            right: e.strong, rightWhy: "It names who is affected, what goes wrong, why it happens and what it costs, without naming a tool.",
            wrong: e.weak,
            sol: S("A strong frame explains the business issue and its cause; a weak one names a tool, blames people or describes only a symptom.",
              `The strongest: “${e.strong}”`),
          });
        },
      },
      {
        name: "Which W is this?",
        make() {
          const items = U.deal("ch5-w5", w5Bank, 5).map(i => ({ t: i.t, cat: i.cat, why: `It asks <b>${i.cat}</b>.` }));
          return Q.classify({
            q: "<p>A team is using the 5 Ws to frame a problem. Which W does each question ask?</p>", cats: W5, items,
            sol: S("Look for the focus of each question: people, the problem itself, a place or step, a time, or a reason.",
              "Who = people affected · What = the problem and its cost · Where = location, system or step · When = timing and frequency · Why = cause and importance."),
          });
        },
      },
      {
        name: "Technical success, economic failure?",
        make() {
          const k = U.randInt(1, 4);
          const opts = [...U.sample(roiCases.filter(r => r.ok), k), ...U.sample(roiCases.filter(r => !r.ok), 5 - k)];
          return Q.multi({
            q: "<p>Select <b>every</b> situation where a system works technically but is a poor <b>economic</b> investment.</p>", options: opts,
            sol: S("Technical success means it runs; economic success means the value is worth the spend. Look for cases where it runs but adds little value.",
              "Classic examples: accurate data nobody uses, automating a broken process, faster wrong decisions, data collected that no decision needs."),
          });
        },
      },
      {
        name: "Count the costs",
        make() {
          const nc = U.randInt(3, 6), nb = U.randInt(1, 3);
          const costs = U.sample(costItems, nc), bens = U.sample(benefitItems, nb);
          const all = U.shuffle([...costs, ...bens]);
          const traps = [{ value: all.length, why: "Benefits are not spend; only count what it takes to make the system real." }];
          return Q.num({
            kind: "count",
            q: `<p>A manager lists items for an ROI review of a new scheduling system:</p>${ul(all)}<p>How many of these belong on the <b>spend</b> side (what it costs to make the system real)?</p>`,
            answer: nc, traps,
            sol: S("Spend is more than the price tag: money, time, risk, disruption, training, support and change effort. Benefits go on the other side.",
              `Spend items (${nc}): ${costs.join("; ")}. Benefits (${nb}): ${bens.join("; ")}.`),
          });
        },
      },
      K.conceptVariant("Tradeoffs & ROI reasoning", "ch5-trade", tradeBank),
      K.tfVariant("True or false: framing and ROI", "ch5-frame", framingTF),
    ],
  });

  /* ============================================================
   * TOPIC 3 · Requirement or not?
   * ============================================================ */
  const RCATS = ["Requirement", "Vague wish", "Design choice", "Tool choice", "Complaint", "Workaround", "Build task"];
  const rdefs = {
    "Requirement": "what the system must accomplish for a business purpose, checkable",
    "Vague wish": "a feeling or hope with nothing you could test",
    "Design choice": "how it looks or is laid out",
    "Tool choice": "which product or technology to use",
    "Complaint": "frustration that signals a problem but states no need",
    "Workaround": "what people do today to cope",
    "Build task": "a piece of technical work to do",
  };
  const R = (t, cat, why) => ({ t, cat, why });
  const reqBank = [
    R("The system must record who approved each time-off request and when.", "Requirement", "a specific, checkable capability the business needs (an audit trail)."),
    R("The system must prevent approval of time off that overlaps a company blackout date.", "Requirement", "it states what must be accomplished and could be tested."),
    R("The system must let customers see the current status of their repair order.", "Requirement", "a specific information need, testable by looking up an order."),
    R("The system must flag any complaint marked as a safety issue for review within one business day.", "Requirement", "specific, stakeholder-aware and testable."),
    R("The system must update an employee's remaining vacation balance after every approval.", "Requirement", "a checkable business rule."),
    R("The system must show a dispatcher which technicians are free in a chosen time slot.", "Requirement", "states an information need for a named stakeholder."),
    R("The system must text a customer when their order is ready for pickup.", "Requirement", "an observable outcome you can test."),
    R("The system must stop an order from being submitted when the shipping address is incomplete.", "Requirement", "a testable validation rule."),
    R("The system should be easy to use.", "Vague wish", "\"easy\" means nothing until you say for whom and how you'd check it."),
    R("The new tool should make everyone more productive.", "Vague wish", "a hope with no specific, testable capability."),
    R("It should feel modern.", "Vague wish", "a feeling, not something the system must accomplish."),
    R("The process should be smoother for customers.", "Vague wish", "\"smoother\" is not checkable as stated."),
    R("We want the system to be fast.", "Vague wish", "no measure of what must be fast, for whom, or how fast."),
    R("The app should just work.", "Vague wish", "it names no capability at all."),
    R("Scheduling should be less of a headache.", "Vague wish", "a feeling; the need behind it still has to be found."),
    R("Blackout dates should appear in red on the calendar.", "Design choice", "it decides appearance, not what must be accomplished."),
    R("Put the Approve button in the top-right corner.", "Design choice", "a layout decision."),
    R("Use a drop-down menu for choosing the department.", "Design choice", "a choice about the interface control."),
    R("The dashboard should have three tabs.", "Design choice", "it decides layout, not need."),
    R("Show the vacation balance as a progress bar.", "Design choice", "a presentation choice."),
    R("Make the header the company's shade of blue.", "Design choice", "appearance only."),
    R("List pending requests as cards, newest first.", "Design choice", "a layout and ordering choice for the screen."),
    R("Build this in Excel.", "Tool choice", "it names a tool before the requirements are known."),
    R("We should use Salesforce for this.", "Tool choice", "a product decision, which belongs in sourcing."),
    R("Let's put it in a SharePoint list.", "Tool choice", "a technology choice, not a need."),
    R("Run it on Google Sheets with a few macros.", "Tool choice", "names the platform, not the capability."),
    R("Write the whole thing in Python.", "Tool choice", "a technology choice."),
    R("Host it on the cloud provider IT already pays for.", "Tool choice", "an infrastructure choice, not a business need."),
    R("Our managers can't stand the spreadsheet we use now.", "Complaint", "frustration; it signals a problem but says nothing about what is needed."),
    R("Nobody can ever find anything on the shared drive.", "Complaint", "a pain point to investigate, not a requirement."),
    R("The old system is a total mess.", "Complaint", "an emotional judgment with no stated need."),
    R("Customers are always angry when they call.", "Complaint", "a symptom that needs the 5 Ws."),
    R("I'm tired of chasing people for signatures.", "Complaint", "it shows a pain, not what the system must do."),
    R("Approvals take forever around here.", "Complaint", "a symptom stated as frustration."),
    R("The reports are useless.", "Complaint", "it tells you where it hurts, not what is needed."),
    R("Every Friday I email payroll a list of who took time off.", "Workaround", "how people cope today; it hints that absences must reach payroll."),
    R("We keep a sticky note on the monitor showing who is out today.", "Workaround", "a coping habit that reveals a need for visible absence info."),
    R("I re-type the web orders into the warehouse system each morning.", "Workaround", "manual re-entry that signals a missing integration."),
    R("We phone every technician at 7 a.m. to ask where they'll be.", "Workaround", "a coping routine that hints at a need for technician availability."),
    R("Sales copies the customer list into personal spreadsheets so they can sort it.", "Workaround", "people working around a system that doesn't meet their need."),
    R("The front desk texts the manager a photo of the paper sign-in sheet.", "Workaround", "a manual fix for missing attendance data."),
    R("Create the API endpoint for time-off requests.", "Build task", "technical work during development."),
    R("Write the SQL script that migrates the old records.", "Build task", "a development task, not a business need."),
    R("Add a column called approval_status to the requests table.", "Build task", "a database change, which is implementation."),
    R("Set up the nightly backup job.", "Build task", "operational technical work."),
    R("Code the sign-in page.", "Build task", "a development task."),
    R("Write unit tests for the balance calculation.", "Build task", "engineering work; the requirement it serves is stated elsewhere."),
  ];
  const reqSort = K.sortVariants({
    key: "ch5-req", bank: reqBank, cats: RCATS, defs: rdefs, ask: "statement",
    hint: "Ask: does it say <em>what the system must accomplish</em> in a checkable way, or is it a feeling, a look, a tool, a gripe, a coping habit or a coding chore?",
  });

  const reqTF = [
    { s: "Starting a sentence with \"The system must…\" automatically makes it a requirement.", truth: false, why: "\"The system must use red banners\" is still a design choice. Content matters, not the opening words." },
    { s: "A workaround is useful evidence because it reveals what people actually need to accomplish.", truth: true, why: "Workarounds point straight at unmet needs." },
    { s: "Complaints should be ignored during requirements gathering because they are emotional.", truth: false, why: "Complaints are evidence of where it hurts; translate them, don't ignore them." },
    { s: "\"Create the API endpoint\" is a build task, not a business requirement.", truth: true, why: "It is technical work in development." },
    { s: "\"The system should be easy to use\" is a strong requirement because every stakeholder agrees with it.", truth: false, why: "Agreement doesn't make it testable; it is a vague wish." },
    { s: "A requirement sits between messy human evidence and technical work.", truth: true, why: "It translates evidence into what the system must accomplish, before design and build." },
  ];

  const genReqSort = STUDY.makeGenerator({
    id: "k201-ch5-reqsort",
    name: "Requirement or not?",
    blurb: "Tell real business requirements from vague wishes, design choices, tool choices, complaints, workarounds and build tasks.",
    variants: [
      ...reqSort,
      {
        name: "Count the real requirements",
        make() {
          const nReq = U.randInt(1, 4);
          const reqs = U.deal("ch5-req:Requirement", reqBank.filter(b => b.cat === "Requirement"), nReq);
          const decoyTs = U.sample(reqBank.filter(b => b.cat !== "Requirement"), 6 - nReq);
          const all = U.shuffle([...reqs, ...decoyTs]);
          const looksLike = all.filter(b => /^The system must/.test(b.t) || b.cat === "Requirement").length;
          const traps = [];
          if (looksLike !== nReq) traps.push({ value: looksLike, why: "Opening words don't decide it." });
          traps.push({ value: 6, why: "Not every statement from a stakeholder is a requirement." });
          if (nReq !== 0) traps.push({ value: 0, why: "At least one statement states a checkable capability." });
          return Q.num({
            kind: "count",
            q: `<p>A business analyst collected these statements in interviews:</p>${ul(all.map(b => b.t))}<p>How many are genuine <b>business requirements</b>?</p>`,
            answer: nReq, traps: traps.filter(t => t.value !== nReq),
            sol: S("Count only statements that say what the system must accomplish, in a way someone could test. Wishes, looks, tools, gripes, workarounds and coding chores don't count.",
              ul(all.map(b => `“${b.t}” — <b>${b.cat}</b>`)) + `So there ${nReq === 1 ? "is" : "are"} <b>${nReq}</b>.`),
          });
        },
      },
      K.tfVariant("True or false: requirements", "ch5-req", reqTF),
    ],
  });

  /* ============================================================
   * TOPIC 4 · Writing requirements
   * ============================================================ */
  const rewriteBank = [
    { ev: "Managers can't stand the spreadsheet we use for vacation requests.", right: "The system must show each manager every pending request for their team, with the date submitted and its approval status.",
      wrong: [{ t: "Replace the spreadsheet with a mobile app.", why: "Tool choice: it picks a platform without saying what must be accomplished." },
              { t: "The new system should be pleasant for managers.", why: "Vague wish: \"pleasant\" can't be tested." },
              { t: "Highlight pending rows in yellow.", why: "Design choice: it changes the look, not the capability." }] },
    { ev: "Customers say they never know when their repair is done.", right: "The system must notify a customer by text or email when their repair status changes to Ready.",
      wrong: [{ t: "Customers are frustrated about repair updates.", why: "Still a complaint; nothing the system must do." },
              { t: "Buy a chatbot for the website.", why: "Tool choice that may not address the need." },
              { t: "The system should communicate better.", why: "Vague wish; what, to whom, when?" }] },
    { ev: "I re-type every web order into the warehouse system each morning.", right: "The system must send each confirmed web order to the warehouse system without manual re-entry.",
      wrong: [{ t: "Write a nightly script that copies the orders table.", why: "Build task; it jumps to implementation." },
              { t: "Hire a temp to do the re-typing.", why: "A new workaround, not a requirement." },
              { t: "The warehouse process should be more efficient.", why: "Vague wish with no testable capability." }] },
    { ev: "Approvals take forever around here.", right: "The system must route each expense claim to the correct approver based on amount and alert them when a claim has waited more than two business days.",
      wrong: [{ t: "Put a big green Approve button on the home screen.", why: "Design choice; a button doesn't fix routing or delay." },
              { t: "Approvals should be faster.", why: "Vague wish; no measure, no rule." },
              { t: "Approvers are lazy.", why: "A complaint that blames people instead of naming a need." }] },
    { ev: "Nobody can find the signed contracts on the shared drive.", right: "The system must let staff search signed contracts by client name, contract date and contract type.",
      wrong: [{ t: "Move everything to a SharePoint site.", why: "Tool choice; a new home doesn't guarantee searchability." },
              { t: "Organize the files better.", why: "Vague wish; what does \"better\" mean?" },
              { t: "Create a folder for each year.", why: "A design/build idea that may not let people search by client." }] },
    { ev: "We phone each technician at 7 a.m. to find out where they'll be.", right: "The system must show dispatchers each technician's assigned jobs and availability for the day.",
      wrong: [{ t: "Give every technician a company phone.", why: "Tool choice that keeps the phone-call workaround." },
              { t: "Dispatching should be less stressful.", why: "Vague wish." },
              { t: "Add a technicians table with a status column.", why: "Build task; implementation detail." }] },
  ];

  const testableBank = [
    { ctx: "online orders", right: "The system must email the customer an order confirmation within 5 minutes of payment.",
      wrong: [{ t: "The system should keep customers happy after they order.", why: "Not testable: \"happy\" has no pass/fail check." },
              { t: "The system must be quick and reliable.", why: "Not specific: quick at what, reliable how?" },
              { t: "Use the email service the marketing team likes.", why: "A tool choice, not a requirement." }] },
    { ctx: "time-off requests", right: "The system must reject a time-off request that overlaps a company blackout date and tell the employee which date conflicts.",
      wrong: [{ t: "The system should handle time off properly.", why: "\"Properly\" is untestable." },
              { t: "The time-off feature must be user-friendly.", why: "A vague wish dressed up with \"must.\"" },
              { t: "Show blackout dates in red.", why: "A design choice." }] },
    { ctx: "student advising", right: "The system must show an advisor every advisee who has not registered for next term, by the first day of registration.",
      wrong: [{ t: "The system must support advisors.", why: "Too general to test." },
              { t: "Advisors should feel more informed.", why: "A feeling, not an observable outcome." },
              { t: "Build an advisor dashboard with charts.", why: "Design/solution choice." }] },
    { ctx: "inventory", right: "The system must create a reorder alert when an item's on-hand count falls below its reorder point.",
      wrong: [{ t: "The system should help us never run out of stock.", why: "A goal, not a checkable capability." },
              { t: "Inventory tracking must be accurate and modern.", why: "Vague: no rule you could test." },
              { t: "Track inventory in Excel with macros.", why: "Tool choice." }] },
    { ctx: "patient records", right: "The system must allow only a patient's care team to view that patient's lab results.",
      wrong: [{ t: "Patient data must be secure.", why: "Important but not specific enough to test as stated." },
              { t: "The system should respect privacy.", why: "A value statement, not a checkable rule." },
              { t: "Encrypt the database with the vendor's default settings.", why: "A build/configuration task." }] },
  ];

  const stripBank = [
    { bad: "The system must use a red pop-up to warn managers about understaffed shifts.", right: "The system must warn a manager before they approve an absence that would leave a shift below minimum staffing.",
      wrong: [{ t: "The system must use a pop-up to warn managers.", why: "Still specifies the design (a pop-up)." },
              { t: "Managers dislike understaffed shifts.", why: "That is a complaint, not a requirement." },
              { t: "Add a red_flag column to the shifts table.", why: "A build task." }] },
    { bad: "The system must have a Salesforce screen where sales reps see overdue invoices.", right: "The system must show each sales rep the overdue invoices for their own accounts.",
      wrong: [{ t: "The system must use Salesforce.", why: "Keeps only the tool choice." },
              { t: "Sales reps should know about invoices.", why: "Vague; which invoices, when?" },
              { t: "Overdue invoices should be shown in a bold table.", why: "Still a design choice." }] },
    { bad: "The system must show a progress bar so employees see their vacation balance.", right: "The system must show each employee their current remaining vacation balance.",
      wrong: [{ t: "The system must show a progress bar.", why: "Keeps the design and loses the need." },
              { t: "Employees should feel informed about vacation.", why: "Vague wish." },
              { t: "Write a function that computes the balance.", why: "A build task." }] },
    { bad: "The system must send a Slack message to the duty manager for high-severity complaints.", right: "The system must alert the duty manager within 15 minutes when a complaint is tagged high severity.",
      wrong: [{ t: "The system must integrate with Slack.", why: "Tool choice only." },
              { t: "Complaints should be handled quickly.", why: "Vague: how fast, by whom?" },
              { t: "Managers are annoyed by slow complaint handling.", why: "A complaint." }] },
    { bad: "The system must use a drop-down list so agents choose a refund reason.", right: "The system must record a refund reason, from the company's approved list, for every refund.",
      wrong: [{ t: "The system must use a drop-down list.", why: "Keeps only the design choice." },
              { t: "Refunds should be tracked better.", why: "Vague wish." },
              { t: "Add a refund_reason column.", why: "A build task." }] },
  ];

  const needBank = [
    { req: "We need a dashboard.", right: "Managers can't see which requests are waiting on whom",
      wrong: [{ t: "Managers like charts", why: "Takes the request at face value instead of asking what problem it solves." },
              { t: "The company needs more software", why: "A solution in disguise, not a need." },
              { t: "The data team needs a project", why: "Not a stakeholder need at all." }] },
    { req: "Can you add a button that approves everything at once?", right: "Approval decisions take too long and pile up",
      wrong: [{ t: "Users want more buttons", why: "Literal reading of the request." },
              { t: "Approvals are unnecessary", why: "Jumps to a conclusion the evidence doesn't support." },
              { t: "The screen needs a redesign", why: "A design idea, not the underlying need." }] },
    { req: "Just make the spreadsheet look nicer.", right: "Records aren't structured, searchable or enforceable",
      wrong: [{ t: "Staff prefer a different font", why: "Takes \"nicer\" literally." },
              { t: "They need a bigger monitor", why: "A hardware solution with no evidence behind it." },
              { t: "The spreadsheet must be printed", why: "Unrelated to the likely need." }] },
    { req: "We need an AI chatbot on the website.", right: "Customers can't find their order status without calling",
      wrong: [{ t: "AI is popular and we should have it", why: "A tool choice driven by trend, not need." },
              { t: "Customers want to chat for fun", why: "No evidence; misses the real pain." },
              { t: "The website needs new colors", why: "Design, not need." }] },
    { req: "Send me a text every time anything changes.", right: "Urgent changes are being missed among routine ones",
      wrong: [{ t: "The manager wants a new phone plan", why: "Irrelevant to the need." },
              { t: "Every change is equally important", why: "That would cause alert overload; the need is about urgency." },
              { t: "Texts are better than email", why: "A channel preference, not the need." }] },
  ];

  const DL = ["Captured", "Validated", "Protected", "Migrated", "Corrected"];
  const dlBank = [
    { t: "The system must record the date and time each request is submitted.", cat: "Captured" },
    { t: "The system must store the reason a manager gives for rejecting a request.", cat: "Captured" },
    { t: "The system must save the employee ID with every timesheet entry.", cat: "Captured" },
    { t: "The system must reject a hire date that is in the future.", cat: "Validated" },
    { t: "The system must refuse an order quantity of zero or less.", cat: "Validated" },
    { t: "The system must check that every new customer has a valid email format.", cat: "Validated" },
    { t: "The system must allow only HR staff to view salary information.", cat: "Protected" },
    { t: "The system must hide the full card number from service agents.", cat: "Protected" },
    { t: "The system must log every access to a patient's record.", cat: "Protected" },
    { t: "The system must load all 4,200 records from the old spreadsheet with none missing.", cat: "Migrated" },
    { t: "The system must convert old department codes to the new codes during the move.", cat: "Migrated" },
    { t: "The system must keep each customer's purchase history when moving from the old system.", cat: "Migrated" },
    { t: "The system must let an administrator fix a record saved with the wrong department, keeping a history of the change.", cat: "Corrected" },
    { t: "The system must let finance reverse a payment entered twice.", cat: "Corrected" },
    { t: "The system must let a customer update a misspelled shipping name.", cat: "Corrected" },
  ];

  const ssitcBank = [
    { q: "\"The system must be better than the old one.\" Which quality of a strong requirement is most clearly missing?", right: "Specific — it names no capability",
      wrong: [{ t: "Concise — it is too long", why: "It is short; brevity isn't the problem." },
              { t: "Information-focused — it is about colors", why: "It says nothing about colors." },
              { t: "Nothing; it is a strong requirement", why: "\"Better\" names no capability anyone could build or check." }],
      sol: ["Check each quality in turn: what exactly must the system do?", "Nothing is named, so it fails Specific (and so can't be tested either)."] },
    { q: "\"The system must have a blue home page with three large icons.\" Which quality is missing?", right: "Information-focused — it is about appearance, not the information the business needs",
      wrong: [{ t: "Testable — you can't check colors", why: "You could check it; the issue is that it's a design choice." },
              { t: "Concise — it has too many words", why: "Length isn't the problem." },
              { t: "Stakeholder-aware — it names a stakeholder", why: "It names none; but the bigger issue is appearance." }],
      sol: ["Ask: does this describe information or decisions, or how the screen looks?", "It is a design choice, so it fails Information-focused."] },
    { q: "\"The system must make scheduling feel smoother.\" Which quality is missing?", right: "Testable — no one could show it passing or failing",
      wrong: [{ t: "Concise", why: "It is short." },
              { t: "Information-focused", why: "Arguably, but the clearest gap is that you can't test a feeling." },
              { t: "None; it is fine", why: "\"Feel smoother\" has no pass/fail check." }],
      sol: ["Imagine writing a Given/When/Then for it. What would \"Then\" be?", "There is no observable result, so it fails Testable."] },
    { q: "\"The system must show every employee's salary, home address and performance rating on the team page.\" Which quality is most at risk?", right: "Stakeholder-aware — it ignores who should and should not see sensitive data",
      wrong: [{ t: "Specific", why: "It is quite specific." },
              { t: "Testable", why: "You could test it; that's the problem." },
              { t: "Concise", why: "It is one idea, stated briefly." }],
      sol: ["Think about every stakeholder affected, including the employees whose data appears.", "It fails Stakeholder-aware: privacy and access depend on who the user is."] },
    { q: "A requirement runs to 140 words and bundles approvals, payroll export, reporting, notifications and a color scheme. Which quality is missing?", right: "Concise — it should be split into separate, single-idea requirements",
      wrong: [{ t: "Specific", why: "It may be specific in parts; the problem is bundling." },
              { t: "Stakeholder-aware", why: "Nothing suggests stakeholders are ignored." },
              { t: "Nothing; longer requirements are more thorough", why: "Bundling makes it hard to test and prioritize." }],
      sol: ["A strong requirement states one idea plainly.", "Split it; it fails Concise."] },
    { q: "Which list correctly gives the five qualities of a strong requirement?", right: "Specific, Stakeholder-aware, Information-focused, Testable, Concise",
      wrong: [{ t: "Simple, Speedy, Innovative, Technical, Cheap", why: "Invented list; none of these define requirement quality." },
              { t: "Specific, Measurable, Achievable, Relevant, Time-bound", why: "That is SMART, a goal-setting acronym, not the chapter's list." },
              { t: "Secure, Scalable, Integrated, Tested, Coded", why: "Those describe a built system, not a requirement statement." }],
      sol: ["The chapter's list spells S-S-I-T-C.", "Specific, Stakeholder-aware, Information-focused, Testable, Concise."] },
  ];

  const genReqWrite = STUDY.makeGenerator({
    id: "k201-ch5-reqwrite",
    name: "Writing strong requirements",
    blurb: "Turn complaints and requests into testable requirements, strip out design and tool choices, and link requirements to the data lifecycle.",
    variants: [
      {
        name: "Rewrite the evidence as a requirement",
        make() {
          const e = U.rotate("ch5-rw", rewriteBank);
          return Q.mc({
            q: `<p>A stakeholder says: “${e.ev}”</p><p>Which is the best <b>business requirement</b> based on this evidence?</p>`,
            right: e.right, rightWhy: "It states a specific, testable capability that addresses the need behind the evidence.",
            wrong: e.wrong,
            sol: S("Treat the statement as evidence. Ask: what does this person need the system to accomplish?",
              `Strong rewrite: “${e.right}” It begins with what the system must do, names who benefits, and could be tested.`),
          });
        },
      },
      {
        name: "Which requirement is testable?",
        make() {
          const e = U.rotate("ch5-testable", testableBank);
          return Q.mc({
            q: `<p>For a system handling ${e.ctx}, which statement is the most <b>specific and testable</b> requirement?</p>`,
            right: e.right, rightWhy: "Someone could set up the situation and see it pass or fail.",
            wrong: e.wrong,
            sol: S("Try writing a pass/fail check for each. If you can't say what you'd observe, it isn't testable.",
              `“${e.right}” has a clear, observable outcome.`),
          });
        },
      },
      {
        name: "Strip out the design choice",
        make() {
          const e = U.rotate("ch5-strip", stripBank);
          return Q.mc({
            q: `<p>This statement mixes a requirement with a design or tool choice:</p><p>“${e.bad}”</p><p>Which rewrite keeps the business need and drops the design/tool decision?</p>`,
            right: e.right, rightWhy: "It keeps what must be accomplished and leaves the how to design.",
            wrong: e.wrong,
            sol: S("Ask what the color, widget or product is <em>for</em>. That purpose is the requirement.", `“${e.right}”`),
          });
        },
      },
      {
        name: "Find the real need",
        make() {
          const e = U.rotate("ch5-need", needBank);
          return Q.mc({
            q: `<p>A stakeholder asks: “${e.req}”</p><p>Treating stakeholders as <b>evidence, not answer keys</b>, which underlying need is most likely?</p>`,
            right: e.right, rightWhy: "The request is a clue; this is the problem it is trying to solve.",
            wrong: e.wrong,
            sol: S("A request names a solution. Ask: what problem would this solution solve for the person asking?", `Likely need: ${e.right}. Confirm it with more evidence before writing the requirement.`),
          });
        },
      },
      {
        name: "Data lifecycle in requirements",
        make() {
          const items = U.deal("ch5-dl", dlBank, 5).map(i => ({ t: i.t, cat: i.cat, why: `It is about data being <b>${i.cat.toLowerCase()}</b>.` }));
          return Q.classify({
            q: "<p>Which data-lifecycle concern does each requirement address?</p>", cats: DL, items,
            sol: S("For each, ask what happens to the data: recorded, checked, guarded, moved from the old system, or fixed?",
              "Captured = recorded in the first place · Validated = checked for correctness · Protected = access and privacy · Migrated = moved from an old system · Corrected = fixed after the fact."),
          });
        },
      },
      K.conceptVariant("Spot the missing quality", "ch5-ssitc", ssitcBank),
    ],
  });

  /* ============================================================
   * TOPIC 5 · Build / buy / configure
   * ============================================================ */
  const SC = ["Buy packaged", "Configure / customize", "Build custom"];
  const scDefs = {
    "Buy packaged": "common process, a vendor product fits, strong support, speed matters",
    "Configure / customize": "the vendor product mostly fits; you add your own rules, roles, fields, workflows, reports",
    "Build custom": "unique, strategic, data-sensitive, tightly integrated or a competitive advantage",
  };
  const scBank = [
    R("A 40-person firm needs standard payroll and tax filing, and several well-supported vendors do exactly that.", "Buy packaged", "a common process with good products available."),
    R("A dental office needs basic appointment reminders, a need many existing products already meet.", "Buy packaged", "nothing unique; vendors have already built and tested it."),
    R("A store needs a point-of-sale system before the holiday rush in six weeks, and a well-supported product fits.", "Buy packaged", "speed matters and a vendor fits."),
    R("A company needs ordinary email and calendars for its staff.", "Buy packaged", "a commodity need with mature products."),
    R("A small nonprofit needs a standard donor database used by thousands of similar groups.", "Buy packaged", "common process, proven products."),
    R("A vendor HR system fits, but the company has its own three-level approval chain and special leave types.", "Configure / customize", "the product fits except for the organization's own rules."),
    R("A CRM suits the sales team, but they need their own territory fields and role-based permissions.", "Configure / customize", "adding fields and permissions to a product that mostly fits."),
    R("A help-desk product is right, but it needs the firm's own severity categories and routing rules.", "Configure / customize", "own workflows inside a fitting product."),
    R("An accounting package covers purchasing; the firm needs its own approval thresholds and monthly reports.", "Configure / customize", "own rules and reports on top of a vendor system."),
    R("A university buys a learning platform and sets up its own course roles and grading categories.", "Configure / customize", "configuration of roles and fields."),
    R("An airline's pricing engine is a core competitive advantage built on proprietary data.", "Build custom", "strategic, data-sensitive and a source of advantage."),
    R("A logistics firm's routing method is what wins its contracts, and no vendor offers it.", "Build custom", "unique and central to competitive advantage."),
    R("A research lab needs software tightly integrated with its one-of-a-kind instruments and sensitive data.", "Build custom", "unique, tightly integrated, data-sensitive."),
    R("A bank's fraud scoring blends its own models and must integrate tightly with core systems.", "Build custom", "strategic, sensitive and tightly integrated."),
    R("A sports analytics startup's whole product is its player-tracking algorithm.", "Build custom", "the capability is the business's advantage."),
  ];
  const scSort = K.sortVariants({
    key: "ch5-sc", bank: scBank, cats: SC, defs: scDefs, ask: "situation",
    hint: "Ask how common the need is, how well vendor products fit, and whether the capability is a source of competitive advantage.",
  });

  const ROUTES = ["Prototype", "Build new functionality", "Integrate systems"];
  const routeBank = [
    { t: "Stakeholders can't describe what they want; they say they'll know it when they see it.", r: "Prototype", why: "requirements are uncertain; users need something concrete to react to." },
    { t: "Leaders aren't sure an AI triage idea would even help support agents, and want to learn cheaply.", r: "Prototype", why: "an uncertain idea is tested before committing." },
    { t: "The team wants users to click through a mock-up before locking requirements.", r: "Prototype", why: "reactions to something concrete sharpen requirements." },
    { t: "No existing tool supports the firm's unique, strategic scheduling rules, and the firm is ready to own and support the result.", r: "Build new functionality", why: "nothing fits, and the firm accepts ownership." },
    { t: "The company needs a capability no vendor offers and has the staff to test, secure and maintain it.", r: "Build new functionality", why: "a real gap plus the capacity to own it." },
    { t: "The CRM and the billing system both work well, but staff re-key customer data between them.", r: "Integrate systems", why: "good tools exist; they just don't talk to each other." },
    { t: "Web-store orders and warehouse inventory live in two systems that keep disagreeing.", r: "Integrate systems", why: "connecting existing systems is the gap." },
    { t: "HR and payroll each work, but changes made in HR never reach payroll.", r: "Integrate systems", why: "the systems need to share data reliably." },
  ];
  const routeDefs = { "Prototype": "requirements uncertain; users react to something concrete", "Build new functionality": "no tool fits; you take on ownership", "Integrate systems": "useful tools exist but don't work together" };

  const ownBank = [
    { t: "Defining the organization's own requirements", ok: true, why: "The vendor can't know your needs for you." },
    { t: "Setting up and configuring the product", ok: true, why: "Setup is the buyer's responsibility." },
    { t: "Cleaning and migrating the organization's data", ok: true, why: "Your data is yours to prepare and move." },
    { t: "Testing it against the organization's own processes", ok: true, why: "Only you can verify it fits your workflows." },
    { t: "Training the organization's users", ok: true, why: "Adoption is your job." },
    { t: "Judging whether the product truly fits", ok: true, why: "Fit is an ongoing business judgment." },
    { t: "Supporting users day to day", ok: true, why: "First-line support usually stays with you." },
    { t: "Writing the core code of the vendor's product", ok: false, why: "The vendor already built it; that is the point of buying." },
    { t: "Releasing the vendor's next product version", ok: false, why: "The vendor builds and ships updates." },
    { t: "Fixing defects in the vendor's own source code", ok: false, why: "You report them; the vendor fixes its product." },
  ];

  const scConcept = [
    { q: "Which list best reflects the <b>full</b> cost of a system option?", right: "Licensing, configuration, data migration, integration, training, support, security, compliance, vendor dependence, future changes and disruption",
      wrong: [{ t: "The license fee and the hardware", why: "The sticker price is only a fraction of total cost." },
              { t: "Developer salaries only", why: "Ignores migration, training, support, disruption and more." },
              { t: "Whatever the vendor quotes", why: "A quote leaves out your own costs: data, training, change." }],
      sol: ["Total cost covers everything needed to make the system real and keep it running.", "Licensing, configuration, migration, integration, training, support, security, compliance, vendor dependence, future change, disruption, plus maintenance capacity for custom work."] },
    { q: "Why does custom development carry more risk than buying?", right: "The organization takes on responsibility for design, testing, security, maintenance and support",
      wrong: [{ t: "Custom code is always lower quality", why: "Quality depends on the team; the issue is ownership." },
              { t: "Custom software cannot be integrated", why: "It can; integration is often why you build custom." },
              { t: "Vendors forbid custom work", why: "Not true; it is a strategic choice." }],
      sol: ["Think about who carries the burden after launch.", "With custom work, you own everything a vendor would otherwise handle."] },
    { q: "Which option is <b>automatically</b> the best choice?", right: "None; the right choice depends on fit, total cost, risk, supportability and long-term value",
      wrong: [{ t: "Buy, because vendors know best", why: "A product that doesn't fit creates costly workarounds." },
              { t: "Build custom, because it fits perfectly", why: "Fit comes at the price of owning everything." },
              { t: "Configure, because it is the middle option", why: "Middle isn't automatically right either." }],
      sol: ["The chapter's criteria are fit, total cost, risk, supportability and long-term value.", "None wins by default."] },
    { q: "When integrating two systems, which concern is most specific to integration?", right: "Data quality, permissions, timing, error handling and who is responsible when the connection fails",
      wrong: [{ t: "Choosing the screen colors", why: "A design detail unrelated to integration risk." },
              { t: "Negotiating the vendor's marketing budget", why: "Irrelevant." },
              { t: "Picking a project name", why: "Irrelevant to integration risk." }],
      sol: ["Integration moves data between systems that someone else built.", "So watch data quality, permissions, timing, errors and failure ownership."] },
    { q: "A prototype built in two weeks impresses executives. Which statement is accurate?", right: "It shows the idea is possible but probably lacks security, error handling, documentation, testing, scalability and support",
      wrong: [{ t: "It is production-ready because it works in the demo", why: "A demo is not a maintainable, secure system." },
              { t: "It proves the business problem is the right one", why: "A prototype doesn't prove the problem framing." },
              { t: "It should be thrown away immediately", why: "Prototypes are valuable for learning; they just aren't production." }],
      sol: ["Ask what a prototype is <em>for</em>: learning, not launching.", "It shows possibility, not production readiness."] },
  ];

  const genSourcing = STUDY.makeGenerator({
    id: "k201-ch5-sourcing",
    name: "Build vs. buy vs. configure",
    blurb: "Match situations to buy, configure or build; choose among prototype, build and integrate; and reason about total cost and ownership.",
    variants: [
      ...scSort,
      {
        name: "Prototype, build or integrate?",
        make() {
          const e = U.rotate("ch5-route", routeBank);
          return Q.mc({
            q: `<p>A team has decided on custom work. ${e.t}</p><p>Which custom route fits best?</p>`,
            right: e.r, rightWhy: `Yes — ${e.why}`,
            wrong: ROUTES.filter(r => r !== e.r).map(r => ({ t: r, why: `${r} fits when ${routeDefs[r]}; here ${e.why}` })),
            keepOrder: ROUTES,
            sol: S("Ask: are requirements uncertain, is a capability missing, or do existing tools just fail to connect?", `<b>${e.r}</b>: ${e.why}`),
          });
        },
      },
      {
        name: "Buy doesn't mean done",
        make() {
          const k = U.randInt(2, 4);
          const opts = [...U.sample(ownBank.filter(o => o.ok), k), ...U.sample(ownBank.filter(o => !o.ok), U.randInt(1, 2))];
          return Q.multi({
            q: "<p>A company buys a packaged HR system. Select <b>every</b> responsibility that still belongs to the company.</p>", options: opts,
            sol: S("Buying shifts the building, testing and updating of the <em>product</em> to the vendor; it does not shift your business's needs, data or people.",
              "The buyer still owns requirements, setup, data, testing against its processes, training, support and fit."),
          });
        },
      },
      K.conceptVariant("Cost, risk & ownership", "ch5-sc", scConcept),
    ],
  });

  /* ============================================================
   * TOPIC 6 · Development approaches
   * ============================================================ */
  const M = ["Waterfall", "Agile (e.g., Scrum)", "DevOps with CI/CD"];
  const mDefs = {
    "Waterfall": "linear stages, each finished before the next; fits stable, well-understood requirements",
    "Agile (e.g., Scrum)": "small increments and frequent feedback; fits uncertain or changing requirements",
    "DevOps with CI/CD": "connects building with releasing, running and monitoring; frequent, consistent releases",
  };
  const mBank = [
    R("Finishes each stage completely before the next one starts", "Waterfall", "linear stage-by-stage flow."),
    R("Relies on formal approvals and documentation at each milestone", "Waterfall", "strong documentation and sign-offs."),
    R("Works best when the problem is well understood and requirements are stable", "Waterfall", "it assumes certainty early."),
    R("Discovering a misunderstood requirement late is very expensive", "Waterfall", "earlier stages are already signed off."),
    R("Sets the budget and milestones up front", "Waterfall", "fixed plans suit its linear rhythm."),
    R("Delivers in small increments and adapts as feedback arrives", "Agile (e.g., Scrum)", "short feedback loops."),
    R("Treats requirements and testing as continuous rather than one-time", "Agile (e.g., Scrum)", "they are revisited every increment."),
    R("Shows users something working early to reduce the cost of misunderstanding", "Agile (e.g., Scrum)", "early feedback catches misunderstandings."),
    R("Organizes work into short, fixed-length cycles, each with a focused set of tasks", "Agile (e.g., Scrum)", "that is Scrum, one way to run Agile."),
    R("Ends each short cycle with a review of what was finished", "Agile (e.g., Scrum)", "frequent review is part of Scrum."),
    R("Closes the gap between the people who build software and the people who run it", "DevOps with CI/CD", "DevOps joins development and operations."),
    R("Runs automated tests every time a change is merged into the shared code", "DevOps with CI/CD", "continuous integration."),
    R("Releases small changes to production frequently through an automated pipeline", "DevOps with CI/CD", "continuous delivery."),
    R("Treats monitoring the live system as part of the development team's job", "DevOps with CI/CD", "it connects building with operating and monitoring."),
  ];
  const mSort = K.sortVariants({
    key: "ch5-m", bank: mBank, cats: M, defs: mDefs, ask: "practice",
    hint: "Think about rhythm: one long pass through the stages, short cycles of feedback, or a continuous pipeline from code to production.",
  });

  const fitBank = [
    { t: "A bank must rebuild a regulatory report whose rules are fixed by law; auditors want a sign-off at each stage.", m: "Waterfall", why: "stable requirements and formal approvals suit a linear approach." },
    { t: "A startup is building a customer app, and nobody is sure which features users will value.", m: "Agile (e.g., Scrum)", why: "uncertain requirements call for small increments and frequent feedback." },
    { t: "An online retailer already runs a working site and wants to ship small fixes several times a week with automated testing and monitoring.", m: "DevOps with CI/CD", why: "frequent, consistent releases plus monitoring is DevOps territory." },
    { t: "A county replaces a paper equipment-inspection form; the process is stable, well documented, and the budget must be approved up front.", m: "Waterfall", why: "a well-understood, stable process with fixed budget." },
    { t: "An HR team is redesigning onboarding, and managers keep changing their minds once they see screens.", m: "Agile (e.g., Scrum)", why: "changing needs are cheaper to handle in short loops." },
    { t: "Operations staff complain that developers toss releases \"over the wall\" and nobody watches production afterward.", m: "DevOps with CI/CD", why: "the gap between builders and operators is exactly what DevOps closes." },
    { t: "A team wants two-week cycles, each ending in a demo of working features to stakeholders.", m: "Agile (e.g., Scrum)", why: "short cycles with frequent review describe Scrum." },
    { t: "A mobile game company pushes dozens of tiny updates a week and needs every change tested automatically before release.", m: "DevOps with CI/CD", why: "continuous integration and delivery." },
  ];

  const mTF = [
    { s: "Agile projects skip requirements.", truth: false, why: "Agile still writes requirements; it revisits them continuously." },
    { s: "Waterfall is always the wrong choice.", truth: false, why: "It fits stable, well-understood, approval-heavy work. It's not the villain." },
    { s: "Every approach still needs problem framing, requirements, design, development, testing, deployment and maintenance.", truth: true, why: "They differ in rhythm and feedback frequency, not in which work exists." },
    { s: "Scrum is one common way of organizing Agile work.", truth: true, why: "Scrum uses short cycles, a focused task set and frequent review." },
    { s: "Adopting DevOps moves accountability for outcomes onto the automated pipeline.", truth: false, why: "Modern methods shrink the feedback loop; they don't transfer accountability." },
    { s: "In Waterfall, learning late in the project tends to be expensive.", truth: true, why: "Earlier stages were signed off on assumptions; changing them means rework." },
    { s: "CI/CD stands for continuous integration / continuous delivery.", truth: true, why: "It tests and releases changes frequently and consistently." },
    { s: "The main advantage of Agile is that it eliminates the need for testing.", truth: false, why: "Agile makes testing continuous, not optional." },
  ];

  const mConcept = [
    { q: "A Waterfall project reaches testing, and users say the core workflow is wrong. What is the most likely consequence?", right: "Costly rework, because design and build rested on requirements signed off months ago",
      wrong: [{ t: "A quick fix, because Waterfall is built for change", why: "Waterfall assumes early certainty; late change is expensive." },
              { t: "No impact, since testing is the last step", why: "Testing found a requirements error; that ripples back." },
              { t: "The project automatically switches to DevOps", why: "Methods don't switch themselves." }],
      sol: ["Recall Waterfall's main risk.", "It assumes early certainty, so late learning means expensive rework."] },
    { q: "What is the main thing that differs between Waterfall, Agile and DevOps?", right: "The rhythm of the work and how often feedback arrives",
      wrong: [{ t: "Whether requirements are needed", why: "All approaches need requirements." },
              { t: "Whether testing happens", why: "All approaches test." },
              { t: "Who is accountable for the outcome", why: "Accountability doesn't transfer with the method." }],
      sol: ["List the stages each approach must still cover.", "Since all cover the same work, the difference is rhythm and feedback frequency."] },
    { q: "Why does Agile reduce the cost of misunderstanding?", right: "Users see working increments early, so wrong assumptions surface before much is built on them",
      wrong: [{ t: "Agile teams never misunderstand requirements", why: "They do; they just find out sooner." },
              { t: "Agile skips documentation, which saves money", why: "Saving documentation isn't the mechanism." },
              { t: "Agile uses cheaper programmers", why: "Unrelated to the method." }],
      sol: ["Think about when a misunderstanding is discovered.", "Short feedback loops expose it early, when it's cheap to fix."] },
    { q: "What does DevOps mainly try to connect?", right: "Development with release, operations, monitoring and improvement",
      wrong: [{ t: "Sales with marketing", why: "Different functions." },
              { t: "Requirements with the vendor contract", why: "Not DevOps' purpose." },
              { t: "Waterfall with Scrum", why: "DevOps is not a blend of methods." }],
      sol: ["Split the word: Dev + Ops.", "It joins building software with running and monitoring it."] },
  ];

  const genMethods = STUDY.makeGenerator({
    id: "k201-ch5-methods",
    name: "Waterfall, Agile, Scrum & DevOps",
    blurb: "Match practices and situations to development approaches and predict where each succeeds or struggles.",
    variants: [
      mSort[0], mSort[2], mSort[3],
      {
        name: "Which approach fits?",
        make() {
          const e = U.rotate("ch5-fit", fitBank);
          return Q.mc({
            q: `<p>${e.t}</p><p>Which development approach fits best?</p>`,
            right: e.m, rightWhy: `Yes — ${e.why}`,
            wrong: [...M.filter(m => m !== e.m).map(m => ({ t: m, why: `${m}: ${mDefs[m]}. Here, ${e.why}` })),
                    { t: "Skip a method and ship the AI-generated prototype", why: "No approach removes the need for testing, deployment and support." }],
            sol: S("Ask how certain the requirements are, and whether the challenge is changing needs or frequent releases to a live system.", `<b>${e.m}</b>: ${e.why}`),
          });
        },
      },
      K.conceptVariant("Predict the consequence", "ch5-m", mConcept),
      K.tfVariant("True or false: approaches", "ch5-m", mTF),
    ],
  });

  /* ============================================================
   * TOPIC 7 · Testing
   * ============================================================ */
  const TS = [
    { area: "staff absences", req: "The system must block approval of any absence that would drop a shift below its minimum staffing.",
      normal: "A cashier asks for one Saturday off, and the shift stays above its minimum.",
      edge: "Two pharmacists ask for the same overnight shift off, and approving both would break the minimum.",
      design: "Understaffed shifts appear with an orange stripe on the calendar.",
      g: "an overnight shift with a minimum of 5 pharmacists and two pending requests that would leave 4",
      w: "the manager tries to approve the second request",
      t: "the system refuses the approval, alerts the manager and records the reason" },
    { area: "refunds", req: "The system must hold any refund over $500 for supervisor approval before money is returned.",
      normal: "A customer returns a $40 sweater and is refunded automatically.",
      edge: "An agent enters two $300 refunds on the same order a minute apart.",
      design: "Held refunds are shown in a separate tab.",
      g: "an order with a $650 refund request",
      w: "a service agent clicks Issue refund",
      t: "the refund shows Awaiting supervisor and no money is sent" },
    { area: "course registration", req: "The system must prevent enrollment when a student has not completed the listed prerequisite, unless an advisor override is recorded.",
      normal: "A student who passed Accounting I enrolls in Accounting II.",
      edge: "A transfer student's prerequisite credit is still being evaluated on registration day.",
      design: "The prerequisite list appears in a pop-up box.",
      g: "a student with no record of the prerequisite and no advisor override",
      w: "the student tries to enroll in the course",
      t: "enrollment is refused and the message names the missing prerequisite" },
    { area: "inventory", req: "The system must create a reorder alert when an item's on-hand count falls below its reorder point.",
      normal: "Tent stock falls from 30 to 12, below its reorder point of 15, and an alert appears.",
      edge: "A sale and a return for the same item post in the same second, leaving stock exactly at the reorder point.",
      design: "Reorder alerts use a bell icon.",
      g: "a backpack with a reorder point of 20 and 21 units on hand",
      w: "two backpacks are sold",
      t: "a reorder alert for the backpack appears in the buyer's queue" },
    { area: "flight cancellations", req: "The system must offer every affected passenger a rebooking option within 15 minutes of a flight cancellation.",
      normal: "A flight with 120 passengers is cancelled, and each receives a rebooking offer by text.",
      edge: "A passenger on the cancelled flight has a connection on a partner airline and no phone number on file.",
      design: "Rebooking offers include the airline logo.",
      g: "a cancelled flight with a passenger whose email address is on file",
      w: "the cancellation is entered at 2:00 p.m.",
      t: "that passenger receives a rebooking offer no later than 2:15 p.m." },
    { area: "expense claims", req: "The system must reject any expense item over $75 that has no receipt image attached.",
      normal: "An employee submits a $20 taxi claim without a receipt, and it is accepted.",
      edge: "An employee submits an item for exactly $75 with no receipt.",
      design: "The receipt upload area has a dashed border.",
      g: "a $120 hotel item with no receipt attached",
      w: "the employee presses Submit",
      t: "the claim is rejected with a message asking for the receipt" },
    { area: "complaint handling", req: "The system must tag each complaint with a severity level and show every unresolved high-severity complaint to the duty manager.",
      normal: "A web-form complaint about a late delivery is tagged medium and queued.",
      edge: "The same customer reports a safety hazard by phone and on social media, creating two records.",
      design: "High-severity complaints are listed at the top in bold.",
      g: "a phone complaint describing a product safety hazard",
      w: "the agent saves the complaint",
      t: "it is tagged High and appears on the duty manager's open list" },
    { area: "account sign-in", req: "The system must lock an account for 15 minutes after five failed sign-in attempts in a row.",
      normal: "A user mistypes the password once, then signs in successfully.",
      edge: "A user fails four times, the password is reset by the help desk, then they fail twice more.",
      design: "The lock message appears in a gray box.",
      g: "an account with four failed sign-in attempts in a row",
      w: "a fifth wrong password is entered",
      t: "the account locks, and even the correct password is refused for 15 minutes" },
  ];
  const gwt = s => `<b>Given</b> ${s.g}, <b>when</b> ${s.w}, <b>then</b> ${s.t}.`;
  const gwtPlain = s => `Given ${s.g}, when ${s.w}, then ${s.t}.`;
  const GWT = ["Given", "When", "Then"];
  const gwtDefs = { Given: "the starting condition", When: "the action or event", Then: "the expected observable result" };

  const TT = ["Normal use case", "Edge case", "Acceptance test"];
  const ttDefs = {
    "Normal use case": "the expected, everyday workflow",
    "Edge case": "an unusual, boundary, conflicting, missing or high-risk condition",
    "Acceptance test": "a specific pass/fail condition, often Given/When/Then",
  };

  const testTF = [
    { s: "Testing is best understood as evidence gathering, not a final checkbox.", truth: true, why: "It creates proof the system works under normal and unusual conditions." },
    { s: "A requirement is complete even if nobody knows how it could be tested.", truth: false, why: "A requirement is incomplete until you know how to test it." },
    { s: "\"Then the system works correctly\" is a good Then clause.", truth: false, why: "Then must be observable; \"works correctly\" can't be seen or checked." },
    { s: "A Given/When/Then test stays valid even if the underlying code is rewritten.", truth: true, why: "It describes observable outcomes, not implementation." },
    { s: "Because AI writes code faster, testing matters less than it used to.", truth: false, why: "Faster building with weak testing just moves defects into production faster." },
    { s: "An edge case can involve missing data, a boundary value or two conflicting actions.", truth: true, why: "Edge cases cover unusual, boundary, conflicting, missing or high-risk conditions." },
  ];

  const genTesting = STUDY.makeGenerator({
    id: "k201-ch5-testing",
    name: "Use cases, edge cases & acceptance tests",
    blurb: "Pick acceptance tests that verify requirements, find edge cases, and read and repair Given/When/Then tests.",
    variants: [
      {
        name: "Which test verifies the requirement?",
        make() {
          const s = U.rotate("ch5-ts-a", TS);
          const o = U.pick(TS.filter(x => x !== s));
          return Q.mc({
            q: `<p><b>Requirement:</b> ${s.req}</p><p>Which acceptance test verifies this requirement?</p>`,
            right: gwtPlain(s), rightWhy: "Its Given sets up the rule's condition, When triggers it, and Then is an observable result that matches the requirement.",
            wrong: [
              { t: gwtPlain(o), why: `A well-written test, but for a different requirement (${o.area}).` },
              { t: `Check that the ${s.area} feature works well and users are satisfied.`, why: "Not verifiable: no starting condition, action or observable pass/fail result." },
              { t: `Confirm that the code for the ${s.area} feature was reviewed and merged.`, why: "That checks a build task, not whether the business requirement is met." },
            ],
            sol: S("An acceptance test must (1) target <em>this</em> requirement and (2) give a pass/fail result anyone can observe.", `The test: ${gwt(s)}`),
          });
        },
      },
      {
        name: "Pick the edge case",
        make() {
          const s = U.rotate("ch5-ts-e", TS);
          const o = U.pick(TS.filter(x => x !== s));
          return Q.mc({
            q: `<p><b>Requirement:</b> ${s.req}</p><p>Which scenario is the best <b>edge case</b> to test?</p>`,
            right: s.edge, rightWhy: "It is an unusual, boundary or conflicting situation for this rule.",
            wrong: [
              { t: s.normal, why: "That is the normal use case: the expected, everyday flow." },
              { t: o.edge, why: `An edge case, but for a different requirement (${o.area}).` },
              { t: s.design, why: "That is a design choice, not a test scenario." },
            ],
            sol: S("Edge cases live at the boundaries: unusual, conflicting, missing or high-risk conditions for <em>this</em> rule.", `Edge case: ${s.edge}`),
          });
        },
      },
      {
        name: "Label Given, When, Then",
        make() {
          const ss = U.sample(TS, 2);
          const parts = [];
          ss.forEach(s => { parts.push({ t: s.g, cat: "Given" }, { t: s.w, cat: "When" }, { t: s.t, cat: "Then" }); });
          const items = U.sample(parts, 5).map(i => ({ ...i, why: `${i.cat} = ${gwtDefs[i.cat]}.` }));
          return Q.classify({
            q: "<p>These fragments come from two acceptance tests. Is each a Given, a When or a Then?</p>", cats: GWT, items,
            sol: S("Given sets the scene before anything happens; When is the single action; Then is what you can observe afterward.",
              ss.map(s => gwt(s)).join("<br>")),
          });
        },
      },
      {
        name: "Repair the Then",
        make() {
          const s = U.rotate("ch5-ts-t", TS);
          return Q.mc({
            q: `<p>Complete this acceptance test with the best <b>Then</b>:</p><p><b>Given</b> ${s.g}, <b>when</b> ${s.w}, <b>then</b> …</p>`,
            right: s.t, rightWhy: "It is a specific result anyone can observe.",
            wrong: [
              { t: "the system works correctly", why: "Not observable: what exactly would you check?" },
              { t: "the developers are satisfied with the code", why: "About the build, not the business outcome." },
              { t: s.w, why: "That is the action (When), not the result." },
            ],
            sol: S("Then must be something you can see happen, or see not happen, after the action.", `Then ${s.t}.`),
          });
        },
      },
      {
        name: "Use case, edge case or acceptance test?",
        make() {
          const ss = U.sample(TS, 3);
          const pool = [];
          ss.forEach(s => {
            pool.push({ t: s.normal, cat: "Normal use case" }, { t: s.edge, cat: "Edge case" }, { t: gwtPlain(s), cat: "Acceptance test" });
          });
          const first = [pool[0], pool[4], pool[8]];
          const items = [...first, ...U.sample(pool.filter(p => !first.includes(p)), 2)].map(i => ({ ...i, why: `${i.cat}: ${ttDefs[i.cat]}.` }));
          return Q.classify({
            q: "<p>Classify each item from a test plan.</p>", cats: TT, items,
            sol: S("Ask: is it the everyday path, an unusual or boundary situation, or a precise pass/fail check?", ul(TT.map(c => `<b>${c}</b>: ${ttDefs[c]}`))),
          });
        },
      },
      {
        name: "Count the edge cases",
        make() {
          const ss = U.sample(TS, 6);
          const nEdge = U.randInt(1, 4);
          const items = U.shuffle(ss.map((s, i) => i < nEdge ? { t: s.edge, e: true } : { t: s.normal, e: false }));
          return Q.num({
            kind: "count",
            q: `<p>A QA tester drafted these scenarios across several features:</p>${ul(items.map(i => i.t))}<p>How many are <b>edge cases</b> rather than normal use cases?</p>`,
            answer: nEdge,
            traps: [{ value: 6 - nEdge, why: "That counts the normal, everyday scenarios instead." }, { value: 6, why: "Not every scenario is unusual." }].filter(t => t.value !== nEdge),
            sol: S("An edge case involves a boundary, conflict, missing data or high-risk twist. The everyday path is a normal use case.",
              ul(items.map(i => `${i.t} — <b>${i.e ? "Edge case" : "Normal use case"}</b>`))),
          });
        },
      },
      K.tfVariant("True or false: testing", "ch5-test", testTF),
    ],
  });

  /* ============================================================
   * TOPIC 8 · Deployment, production signals, change, AI
   * ============================================================ */
  const DP = ["Deployment", "Production support"];
  const dpDefs = { "Deployment": "moving a tested system into use", "Production support": "keeping the live system working and improving" };
  const dpBank = [
    R("Migrating customer records from the old system", "Deployment", "data migration happens as you launch."),
    R("Planning the cutover weekend", "Deployment", "cutover is a launch activity."),
    R("Rolling out to one region as a pilot", "Deployment", "a pilot rollout manages launch risk."),
    R("Releasing to stores in three waves", "Deployment", "a staged release."),
    R("Setting up user permissions before go-live", "Deployment", "permissions are prepared for launch."),
    R("Writing a fallback plan in case launch fails", "Deployment", "fallback planning protects the launch."),
    R("Staffing a go-live help desk for launch week", "Deployment", "go-live support is part of deployment."),
    R("Responding to an outage reported at 2 a.m.", "Production support", "incident response on the live system."),
    R("Applying a security patch to the live system", "Production support", "security updates are ongoing."),
    R("Fixing records saved with the wrong customer ID last month", "Production support", "data correction in production."),
    R("Tuning a slow monthly report", "Production support", "performance tuning."),
    R("Working with the vendor on a recurring sync error", "Production support", "vendor coordination."),
    R("Setting alert thresholds on failed integrations", "Production support", "monitoring and alerts."),
  ];

  const sigBank = [
    { t: "Support tickets doubled in the two weeks after launch", ok: true, why: "A classic production signal." },
    { t: "Managers override the system's decision on a quarter of claims", ok: true, why: "Exception overrides suggest the rules or training are wrong." },
    { t: "Only 35% of staff have signed in since go-live", ok: true, why: "Low adoption means value is not being created." },
    { t: "One order in ten is left half-finished", ok: true, why: "Incomplete transactions point to friction or defects." },
    { t: "The nightly link to payroll failed three times this week", ok: true, why: "Failed integrations are a key signal." },
    { t: "Requests to fix wrong data keep climbing", ok: true, why: "Data-correction requests reveal validation gaps." },
    { t: "Average approval time rose from one day to four", ok: true, why: "Approval delays show the process isn't flowing." },
    { t: "The project finished two weeks ahead of schedule", ok: false, why: "A project metric, not a sign of how the live system performs." },
    { t: "The demo impressed the executive team", ok: false, why: "A demo is not production evidence." },
    { t: "The codebase now has 40,000 lines", ok: false, why: "Size says nothing about value or health." },
    { t: "The vendor won an industry award", ok: false, why: "Irrelevant to how your system performs." },
  ];

  const CM = ["Monitoring", "Support ownership", "Training & communication", "Change requests", "Fallback plan"];
  const cmDefs = {
    "Monitoring": "what will we watch after launch?",
    "Support ownership": "who owns support when it fails?",
    "Training & communication": "what do people need to learn and hear?",
    "Change requests": "how are changes and enhancements requested?",
    "Fallback plan": "what happens if launch goes wrong?",
  };
  const launchPlans = [
    { sys: "a new expense-claim system at a consulting firm", parts: {
      "Monitoring": "Finance will track rejected claims, overrides and average reimbursement time each week.",
      "Support ownership": "The finance systems lead owns support; the vendor handles product defects.",
      "Training & communication": "Every consultant gets a 20-minute video and a one-page guide before go-live.",
      "Change requests": "Enhancement ideas go to a shared form reviewed by finance every month.",
      "Fallback plan": "If the system fails in week one, claims can be filed on the old form for two weeks." } },
    { sys: "a hospital's new shift-scheduling tool", parts: {
      "Monitoring": "Nursing administration will review unfilled shifts and failed swap requests daily for the first month.",
      "Support ownership": "The clinical IT team owns support around the clock, with a named on-call person.",
      "Training & communication": "Charge nurses attend hands-on sessions, and all staff get an email explaining the changes.",
      "Change requests": "Nurse managers submit change requests through the IT portal, prioritized every two weeks.",
      "Fallback plan": "The previous paper schedule will be printed weekly and kept at each unit for 30 days." } },
    { sys: "an online ordering system for a bakery chain", parts: {
      "Monitoring": "The owner will watch abandoned carts, failed payments and late pickups every morning.",
      "Support ownership": "The web agency owns support during business hours under its contract.",
      "Training & communication": "Counter staff practice taking online orders, and a sign in each shop explains pickup.",
      "Change requests": "Store managers send improvement ideas to the owner, who batches them monthly.",
      "Fallback plan": "If online ordering fails, phone orders resume and the website shows a notice." } },
  ];

  const decideBank = [
    { s: "A manager vibe-coded a working absence tracker over a weekend and wants it live for 600 employees on Monday. There has been no security or privacy review and nobody owns support.", d: "Pause", why: "A demo is not production: it lacks security and privacy review, testing, training, monitoring and a support owner." },
    { s: "A product team used AI to build a quick clickable prototype of a new pricing page and wants to show it to eight customers in a usability session using fake data.", d: "Act", why: "This is exactly what prototypes are for: cheap learning with no real data at risk." },
    { s: "In the week after go-live, exception overrides jumped from 2% to 25% of approvals.", d: "Investigate", why: "A strong production signal; find out whether the rules, the data or the training are wrong before deciding what to fix." },
    { s: "A prototype demo for the sales team uses real customer card numbers copied from the production database.", d: "Pause", why: "Real sensitive data in a prototype is a security exposure; stop and use fake data." },
    { s: "Production signals have been stable for two months, and a requested enhancement has passed its acceptance tests and has a rollback plan.", d: "Act", why: "Evidence, testing and a fallback are all in place." },
    { s: "Support tickets doubled after a release, and nobody yet knows whether the cause is a defect or a training gap.", d: "Investigate", why: "Gather evidence first; the fix for a defect is different from the fix for a training gap." },
    { s: "An AI tool drafted twenty requirements from interview transcripts, and the team wants to send them straight to developers without review.", d: "Pause", why: "AI speeds creation, not accountability; a human must check the requirements against the evidence first." },
    { s: "Adoption is at 40% three weeks after launch, but no one knows which teams are not using the system or why.", d: "Investigate", why: "Low adoption is a signal; find out who and why before adding features or training." },
  ];
  const DECIDE = ["Act", "Pause", "Investigate"];
  const decideDefs = { Act: "go ahead; the evidence and safeguards are in place", Pause: "stop before going further; something essential is missing or risky", Investigate: "gather evidence before choosing a fix" };

  const METRICS = [
    { name: "Support tickets", good: "down", base: [40, 70], unit: "" },
    { name: "Exception overrides (% of approvals)", good: "down", base: [2, 6], unit: "%" },
    { name: "Failed integrations", good: "down", base: [1, 4], unit: "" },
    { name: "Adoption (% of staff using it)", good: "up", base: [55, 75], unit: "%" },
    { name: "Incomplete transactions", good: "down", base: [10, 25], unit: "" },
  ];

  const aiConcept = [
    { q: "What is <em>vibe coding</em>?", right: "Creating software mainly by describing it in natural language and letting AI generate much of the code",
      wrong: [{ t: "Coding while listening to music", why: "A joke reading; it's about AI generating code from descriptions." },
              { t: "A formal testing method for user experience", why: "It is a way of building, not testing." },
              { t: "Writing code with no tools at all", why: "The opposite: AI does much of the writing." }],
      sol: ["Think about who writes the code and how it is requested.", "You describe; the AI generates. Powerful for exploring, risky for production."] },
    { q: "Why does AI make the human in the loop <b>more</b> important?", right: "AI produces output faster but can misread the problem, miss exceptions, bake in wrong assumptions or expose data, and it can't be accountable",
      wrong: [{ t: "AI output is always wrong", why: "It's often useful; the issue is unchecked errors at speed." },
              { t: "Humans type faster than AI", why: "Not the point." },
              { t: "Regulations ban AI-written code", why: "Not a general rule; the issue is accountability and risk." }],
      sol: ["Separate speed of creation from responsibility for outcomes.", "Faster output means more to check, and only people can own the result."] },
    { q: "Where does ROI become real, according to the chapter?", right: "In change management, when people actually adopt and correctly use the system",
      wrong: [{ t: "At the moment the code compiles", why: "Working code alone creates no value." },
              { t: "When the vendor contract is signed", why: "Signing is spending, not value." },
              { t: "In the prototype demo", why: "A demo shows possibility, not value." }],
      sol: ["Value only appears when the system changes how work gets done.", "That is change management, and it can't be automated away."] },
    { q: "Which list describes deployment activities?", right: "Data migration, cutover planning, pilot rollout, staged release, permissions, training, communication, fallback plans, go-live support",
      wrong: [{ t: "Interviews, problem statements, requirements", why: "Those are planning and analysis." },
              { t: "Workflow, data structure and permission design", why: "Those are design." },
              { t: "Bug fixes, security updates and performance tuning", why: "Those are production support after launch." }],
      sol: ["Deployment is the move from tested system to system in use.", "It covers migration, cutover, rollout, permissions, training, communication, fallback and go-live support."] },
  ];

  function signalTable() {
    const ms = U.sample(METRICS, 3);
    const badI = U.randInt(0, 2);
    const rows = ms.map((m, i) => {
      let v = U.randInt(m.base[0], m.base[1]);
      const vals = [];
      for (let w = 0; w < 4; w++) {
        vals.push(v);
        const bad = i === badI;
        const step = Math.max(1, Math.round(v * (bad ? 0.3 : 0.05)));
        const dirUp = bad ? (m.good === "down") : (m.good === "up");
        v = dirUp ? v + step : Math.max(0, v - step);
      }
      return { m, vals };
    });
    return { rows, bad: ms[badI] };
  }

  const genLaunch = STUDY.makeGenerator({
    id: "k201-ch5-launch",
    name: "Deployment, production & change",
    blurb: "Tell deployment from production support, read production signals, check launch readiness, and decide when a prototype is ready.",
    variants: [
      {
        name: "Deployment or production support?",
        make() {
          const items = [...U.deal("ch5-dp:d", dpBank.filter(b => b.cat === "Deployment"), U.randInt(2, 3)),
                         ...U.deal("ch5-dp:p", dpBank.filter(b => b.cat === "Production support"), 2)];
          return Q.classify({
            q: "<p>Is each activity part of <b>deployment</b> or <b>production support</b>?</p>", cats: DP, items,
            sol: S("Deployment moves the tested system into use; production support keeps the live system healthy afterward.", ul(DP.map(c => `<b>${c}</b>: ${dpDefs[c]}`))),
          });
        },
      },
      {
        name: "Spot the production signals",
        make() {
          const k = U.randInt(2, 4);
          const opts = [...U.sample(sigBank.filter(s => s.ok), k), ...U.sample(sigBank.filter(s => !s.ok), 5 - k)];
          return Q.multi({
            q: "<p>A month after launch, which of these are <b>production signals</b> that tell you how the live system is doing? Select all that apply.</p>", options: opts,
            sol: S("Production signals come from real users, real data and real transactions, not from the project or the demo.",
              "Examples: error rates, support tickets, incomplete transactions, approval delays, failed integrations, adoption, data-correction requests, complaints, exception overrides."),
          });
        },
      },
      {
        name: "Read the signal table",
        make() {
          const { rows, bad } = signalTable();
          const fmtV = (v, m) => m.unit === "%" ? v + "%" : String(v);
          const table = `<table class="tbl"><thead><tr><th>Signal</th><th>Week 1</th><th>Week 2</th><th>Week 3</th><th>Week 4</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.m.name}</td>${r.vals.map(v => `<td>${fmtV(v, r.m)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
          const dirWord = m => m.good === "down" ? "rising" : "falling";
          return Q.mc({
            q: `<p>Production signals for the first four weeks after a launch:</p>${table}<p>Which signal is the clearest <b>warning sign</b> to investigate?</p>`,
            right: bad.name, rightWhy: `It is ${dirWord(bad)} steadily, the wrong direction for this signal.`,
            wrong: [...rows.filter(r => r.m !== bad).map(r => ({ t: r.m.name, why: `It is stable or moving the healthy way (${r.m.good === "down" ? "lower" : "higher"} is better).` })),
                    { t: "None; all signals look healthy", why: `${bad.name} is ${dirWord(bad)} week after week.` }],
            sol: S("For each row, decide which direction is healthy (fewer tickets, overrides and failures; higher adoption), then look for a steady move the wrong way.",
              `<b>${bad.name}</b> is ${dirWord(bad)}: ${rows.find(r => r.m === bad).vals.map(v => fmtV(v, bad)).join(" → ")}. Investigate why before choosing a fix.`),
          });
        },
      },
      {
        name: "Weeks over the threshold",
        make() {
          const th = U.pick([40, 50, 60]);
          let vals, n;
          do {
            vals = Array.from({ length: 6 }, () => { let v; do { v = U.randInt(th - 30, th + 35); } while (v === th); return v; });
            n = vals.filter(v => v > th).length;
          } while (n === 0 || n === 6);
          const table = `<table class="tbl"><thead><tr><th>Week</th>${vals.map((_, i) => `<th>${i + 1}</th>`).join("")}</tr></thead><tbody><tr><td>Support tickets</td>${vals.map(v => `<td>${v}</td>`).join("")}</tr></tbody></table>`;
          return Q.num({
            kind: "count",
            q: `<p>The support team agreed to investigate any week with <b>more than ${th}</b> tickets after launch.</p>${table}<p>How many weeks trigger an investigation?</p>`,
            answer: n,
            traps: [{ value: 6 - n, why: "That counts the weeks at or below the threshold." }].filter(t => t.value !== n),
            sol: S(`Compare each week with ${th}; only weeks strictly above it count.`, `Above ${th}: ${vals.map((v, i) => v > th ? `week ${i + 1} (${v})` : null).filter(Boolean).join(", ")}. That is <b>${n}</b>.`),
          });
        },
      },
      {
        name: "Launch-readiness gap",
        make() {
          const p = U.rotate("ch5-plan", launchPlans);
          const missing = U.pick(CM);
          const shown = U.shuffle(CM.filter(c => c !== missing));
          return Q.mc({
            q: `<p>The launch plan for ${p.sys} says:</p>${ul(shown.map(c => p.parts[c]))}<p>Which change-management question is <b>not</b> answered?</p>`,
            right: missing, rightWhy: `Nothing in the plan covers it: ${cmDefs[missing]}`,
            wrong: shown.map(c => ({ t: c, why: `Covered: “${p.parts[c]}”` })),
            keepOrder: CM,
            sol: S("Match each sentence to one of the five pre-launch questions: monitoring, support ownership, training and communication, change requests, fallback.",
              `Missing: <b>${missing}</b> (${cmDefs[missing]}).`),
          });
        },
      },
      {
        name: "Act, pause or investigate?",
        make() {
          const e = U.rotate("ch5-decide", decideBank);
          return Q.mc({
            q: `<p>${e.s}</p><p>What should the manager do?</p>`,
            right: e.d, rightWhy: e.why,
            wrong: DECIDE.filter(d => d !== e.d).map(d => ({ t: d, why: `${d} means ${decideDefs[d]}. Here: ${e.why}` })),
            keepOrder: DECIDE,
            sol: S("Ask: is the evidence in, are safeguards (testing, security, support, fallback) in place, and is real data or real users at risk?", `<b>${e.d}</b>: ${e.why}`),
          });
        },
      },
      K.conceptVariant("AI, deployment & change", "ch5-ai", aiConcept),
    ],
  });

  const generators = [genSdlc, genFraming, genReqSort, genReqWrite, genSourcing, genMethods, genTesting, genLaunch];

  STUDY.registerUnit(C, {
    id: "ch5", order: 5,
    title: "Chapter 5 · From Requirements to Reality: Building Systems That Create Business Value",
    short: "Ch 5 · Requirements to Reality",
    description: "How the SDLC turns a well-framed problem into testable requirements, a sourcing choice, tested software and a launch that actually creates value.",
    notes, flashcards, cues, generators,
  });
})();
