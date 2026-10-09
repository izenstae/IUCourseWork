/* ============================================================
 * BUS K201 · Chapter 2 · Introduction to Computing and IU Resources
 * Data vs. information, quantitative vs. qualitative data, how data
 * is collected and what it costs, volatile vs. non-volatile storage,
 * structured vs. unstructured data, AI / machine learning, on-premises
 * vs. edge vs. cloud, IU enterprise systems, and file management,
 * sharing and Canvas submission.
 * All explanations, examples and scenarios are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const S = K.S;
  const C = "bus-k201";

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const rename = (vs, suffix) => vs.map(v => ({ name: `${v.name} · ${suffix}`, make: v.make }));
  const pickNames = names => vs => vs.filter(v => names.includes(v.name));
  const NAMES = ["Maya", "Jordan", "Priya", "Luis", "Aisha", "Ben", "Chloe", "Diego", "Hana", "Isaac", "Keisha", "Mateo",
    "Nora", "Omar", "Quinn", "Rosa", "Sam", "Tariq", "Uma", "Wes", "Yara", "Zoe", "Elena", "Malik"];
  /* drop trap values that collide with the answer or each other */
  function cleanTraps(answer, traps) {
    const out = [];
    for (const t of traps) {
      if (!Number.isFinite(t.value)) continue;
      if (Math.abs(t.value - answer) <= Math.max(0.011, Math.abs(answer) * 0.01)) continue;
      if (out.some(o => Math.abs(o.value - t.value) < 0.001)) continue;
      out.push(t);
    }
    return out;
  }

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Bits, data and information",
      lo: "Discuss what data is and how raw data becomes information that supports decisions.",
      html: `<p>Everything a computer handles is stored as <b>bits</b>: tiny electrical states that are either off (<b>0</b>) or on (<b>1</b>). A processor reads long strings of these binary digits and interprets them as numbers, letters, pixels or instructions. Every click, keystroke, card swipe and app tap you make leaves a trail of bits behind, which is why this course treats <em>every computing interaction as data</em>.</p>
<p><b>Data</b> is the raw material: recorded facts with no meaning on their own. A cell that says <code>37</code> could be a price, an age, a temperature or a room number. Data becomes <b>information</b> once someone cleans it, processes it and organizes it so that it answers a question and can support a decision.</p>
<div class="keyidea"><b>Key idea.</b> Data → (clean, process, organize, give context) → information → decision. If nobody can act on it yet, it is still data.</div>
<div class="example"><b>Example.</b> A campus coffee cart's card reader logs 2,140 individual transactions in a month: that is data. A one-page summary showing that sales drop 60% after 2 p.m. on Fridays and that oat-milk lattes outsell every other drink is information; the owner can now decide to close early on Fridays and stock more oat milk.</div>
<div class="trap"><b>Common trap.</b> “Big file = information.” A huge spreadsheet of raw rows is still <em>data</em>. Size or volume does not create meaning; processing and context for a decision do. Equally, a single number can be information if it is in context (“this week's returns are triple last week's”).</div>`,
      gens: ["k201-ch2-datainfo"],
    },
    {
      title: "Quantitative vs. qualitative data, and where data comes from",
      lo: "Categorize data as quantitative or qualitative and describe the ways businesses collect it.",
      html: `<p>One common way to categorize data is by the <b>type</b> collected:</p>
<ul>
<li><b>Quantitative</b> data is numeric. It answers “How much?” or “How many?” (units sold, minutes on a page, dollars spent, items in stock). Because it is numeric you can add it up, average it, chart it and feed it into What-If predictions.</li>
<li><b>Qualitative</b> data describes characteristics, opinions or qualities, usually in words, images or sound (a written product review, a focus-group comment, the photo used in an ad, the color of a car).</li>
</ul>
<p>Two quantitative measures you will meet constantly: <b>revenue</b> is the total of all sales in a period (the dollars), while <b>volume</b> is a <em>count</em> of how many items or transactions meet some condition.</p>
<p>Businesses collect data in far more ways than a sales register or a spreadsheet: surveys, interviews and focus groups; social media posts; website <b>cookies</b> that record how a visitor arrived and how long they stayed on each page; and <b>CRM</b> (customer relationship management) software that ties together email click-throughs, app use, purchases, support calls and social media activity into one picture of each customer. Data is often combined with demographics to see who is behind the numbers.</p>
<div class="keyidea"><b>Key idea.</b> Numbers you can calculate with → quantitative. Words, descriptions, opinions, images → qualitative. A number used only as a label (a ZIP code, a jersey number) is not something you would add up.</div>
<div class="example"><b>Example.</b> A gym's app records that a member checked in 14 times in March (quantitative) and that she wrote “the 6 a.m. spin class is too crowded” in a feedback box (qualitative). A star rating of 4 out of 5 is quantitative; the comment typed under it is qualitative.</div>
<div class="trap"><b>Common trap.</b> Mixing up revenue and volume. “How many orders were over $50?” asks for a <em>count</em> (volume), not a dollar total. And a survey can produce both kinds of data: the 1–10 score is quantitative, the open-ended answer is qualitative.</div>`,
      gens: ["k201-ch2-datainfo", "k201-ch2-collect"],
    },
    {
      title: "The cost of data: collect “just enough”",
      lo: "Explain the costs and trade-offs of collecting, storing and processing data.",
      html: `<p>Data is never free. Every step (collecting it, saving it, cleaning it, analyzing it) consumes something:</p>
<ul>
<li><b>Storage</b>: drives, servers or cloud space must be paid for, and the bill grows with everything you keep.</li>
<li><b>Processing</b>: turning raw data into information needs computing power and, above all, employee time spent cleaning and checking it.</li>
<li><b>Risk</b>: anything you hold can be breached, whether it sits on your own servers or in the cloud. A breach can bring fines, cleanup costs and lost customer trust; an accidental leak can hurt customers and vendors and hand competitors an advantage.</li>
</ul>
<p>Too much data is as unhelpful as too little: it costs more, slows analysis down and buries the useful signal. The defence is to <b>define the problem first</b> (what decision are we making, what questions must the data answer?) and then collect accurate, relevant, “just enough” data rather than everything “just in case.”</p>
<div class="keyidea"><b>Key idea.</b> Question first, data second. Each extra field you collect should earn its keep against the storage, processing and breach risk it adds.</div>
<div class="example"><b>Example.</b> A food truck wants to know which neighborhood to park in on Tuesdays. It needs location, date, time and sales per stop. Recording every customer's name, phone number and birthday would not help that decision, would cost storage and cleanup time, and would create personal data that could leak.</div>
<div class="trap"><b>Common trap.</b> “Storage is cheap, so keep everything.” Disk space may be cheap, but cleaning, securing and analyzing the extra data is not, and data you hold but do not need is pure risk if it is breached.</div>`,
      gens: ["k201-ch2-collect"],
    },
    {
      title: "Storing data: volatile vs. non-volatile, structured vs. unstructured",
      lo: "Contrast volatile and non-volatile storage and structured and unstructured data, and describe how unstructured data is analyzed.",
      html: `<p><b>Non-volatile (permanent) storage</b> keeps its contents when the power goes off: hard drives, solid-state drives, flash drives and ROM. <b>Volatile (temporary) storage</b> is <b>RAM</b>: fast working memory that is wiped when power is lost.</p>
<p>When a computer boots, the core of the operating system (the <b>kernel</b>, stored on permanent storage) is loaded and expanded into RAM. The apps and files you open are also held in RAM while you work. That is why an unsaved document disappears in a power cut, and why <b>rebooting</b> fixes so many glitches: it clears RAM, including any corrupted data sitting there, and reloads a clean copy from permanent storage.</p>
<p>Data can also be categorized by its <b>shape</b>:</p>
<ul>
<li><b>Structured</b> data lives in rows and named columns, each column holding one kind of value, as in a spreadsheet (Excel, Google Sheets) or a relational database (e.g., PostgreSQL). It is usually <b>cleaned</b> (errors fixed, formats made consistent) and <b>normalized</b> (organized consistently, duplicates removed), so it is easy to sort, filter, total and model.</li>
<li><b>Unstructured</b> data has no fixed format: audio, video, images, social posts, emails, free-text form answers. It makes up the large majority (roughly 80–90%) of what business systems collect, and insights are harder to pull out of it.</li>
</ul>
<p>To mine unstructured data, analysts use <b>data mining</b> techniques: <b>classification</b> (sorting items into known categories) and <b>clustering</b> (discovering groups of similar items nobody defined in advance). <b>Natural language processing (NLP)</b> extracts meaning and relationships from text, and <b>sentiment analysis</b> estimates the emotion or tone behind a message (positive, negative, angry, delighted).</p>
<div class="keyidea"><b>Key idea.</b> Volatile vs. non-volatile is about <em>whether data survives power loss</em>. Structured vs. unstructured is about <em>whether data fits named columns</em>. They are separate questions.</div>
<div class="example"><b>Example.</b> A hotel's booking table (guest ID, check-in date, nights, rate) is structured. The 9,000 written reviews guests left last year are unstructured; sentiment analysis could flag which ones are angry, and clustering could reveal that complaints group around “parking” and “noise.”</div>
<div class="trap"><b>Common trap.</b> “If it's stored in a database or a file, it's structured.” A spreadsheet column full of free-text comments is still unstructured <em>content</em>; a video saved on a hard drive is non-volatile but unstructured. Where data is kept does not decide its shape.</div>`,
      gens: ["k201-ch2-storage"],
    },
    {
      title: "Artificial intelligence, machine learning and neural networks",
      lo: "Distinguish the main types of AI and explain how machine learning and neural networks learn from data.",
      html: `<p><b>Artificial intelligence (AI)</b> is any application or machine that imitates human intelligence. Three types matter here:</p>
<ul>
<li><b>Summative AI</b> uses natural language processing to pull the important points out of a large body of text and condense them, e.g., into an outline or bullet list.</li>
<li><b>Generative AI (GenAI)</b> creates <em>new</em> content (text, images, code, music) from patterns learned by a neural network.</li>
<li><b>Agentic AI</b> is an autonomous system that plans and carries out a series of tasks toward a goal, making decisions along the way with little human intervention.</li>
</ul>
<p><b>Machine learning</b> is a subset of AI in which a model is <em>trained on data</em> to make predictions or forecasts. A <b>neural network</b> is one kind of model loosely inspired by the brain: layers of interconnected nodes (“artificial neurons”) whose connections are tuned from training data. It predicts from patterns in that data rather than from rules a programmer wrote out explicitly. More (and better) training data usually makes it more reliable, and it can adapt to changing inputs without being reprogrammed.</p>
<div class="keyidea"><b>Key idea.</b> Summarize existing content → summative. Make something new → generative. Pursue a goal by planning and acting on its own → agentic. Learned from examples rather than hand-coded rules → machine learning.</div>
<div class="example"><b>Example.</b> A bank's compliance team uses one tool to condense a 300-page regulation into ten bullets (summative), another to draft a customer letter (generative), and a third that monitors overnight transactions, opens cases, requests documents and closes resolved ones on its own (agentic). The fraud score behind that third tool came from a model trained on millions of past transactions (machine learning).</div>
<div class="trap"><b>Common trap.</b> Treating every AI as a rule-following program. A neural network does not contain a hand-written rule such as “flag any purchase over $5,000”; it learned weights from data, so its output is only as good as the data it was trained on.</div>`,
      gens: ["k201-ch2-ai"],
    },
    {
      title: "On-premises vs. edge vs. cloud architecture",
      lo: "Contrast on-premises, edge and cloud-based architecture in efficiency, cost, reliability and scalability.",
      html: `<p>Where should the computers that store and process an organization's data actually live? Three broad answers:</p>
<ul>
<li><b>On-premises</b>: the organization buys, houses and runs its own servers on its own sites. It has full control, but pays a large <b>up-front (capital) cost</b>, must staff IT to maintain the hardware, and is itself responsible for reliability (backup power, spare parts) and for scaling (buying more machines before demand arrives).</li>
<li><b>Cloud</b>: the organization rents computing and storage from a provider over the internet and pays as it goes (an <b>operating cost</b>). Capacity scales up or down quickly (<b>elastic</b>), and the provider handles hardware, redundancy and upkeep. It depends on an internet connection, and monthly bills keep coming as long as you use it.</li>
<li><b>Edge</b>: data is processed <b>close to where it is generated</b> (in the store, vehicle, device or sensor) instead of being shipped to a distant data center first. That cuts delay (<b>latency</b>) and bandwidth, and keeps working when connectivity is patchy, but it means many more devices spread out in the field to manage and secure. Edge is often paired with the cloud: decide locally now, send summaries to the cloud later.</li>
</ul>
<table class="tbl"><thead><tr><th></th><th>On-premises</th><th>Edge</th><th>Cloud</th></tr></thead><tbody>
<tr><td><b>Efficiency</b></td><td>Fast on the local network; capacity often sits idle</td><td>Lowest latency; sends less data over the network</td><td>Resources shared and used as needed; speed depends on the connection</td></tr>
<tr><td><b>Cost</b></td><td>High up-front purchase plus ongoing staff and upkeep</td><td>Cost of many local devices plus their management</td><td>Little up front; pay-as-you-go monthly bills</td></tr>
<tr><td><b>Reliability</b></td><td>Only as good as the firm's own backups and staff</td><td>Keeps working locally when the internet drops</td><td>Provider redundancy across data centers; needs internet</td></tr>
<tr><td><b>Scalability</b></td><td>Slow: buy and install hardware ahead of demand</td><td>Add devices site by site</td><td>Rapid and elastic, up or down</td></tr>
</tbody></table>
<div class="keyidea"><b>Key idea.</b> Need control and have steady, predictable demand → on-premises can make sense. Need split-second local decisions or must survive weak connectivity → edge. Need to scale fast or avoid a big up-front purchase → cloud.</div>
<div class="example"><b>Example.</b> A ticketing start-up expecting huge spikes on concert on-sale days picks the cloud so it can scale for a few hours and pay only for what it uses. A self-driving delivery robot must brake in milliseconds, so it processes camera data on board (edge). A hospital lab with strict control requirements and stable workloads may keep its system on-premises.</div>
<div class="trap"><b>Common trap.</b> “The cloud is always cheaper.” Cloud avoids the up-front purchase, but the monthly bill never ends; for a steady, predictable workload, owned hardware can cost less over several years. Equally, “cloud = no outages”: if your own internet link fails, cloud apps are out of reach even though the provider is fine.</div>`,
      gens: ["k201-ch2-arch"],
    },
    {
      title: "IU's digital ecosystem and enterprise systems",
      lo: "Define IU enterprise systems (IUanyWare STC Desktop and IUanyWare Desktop, Canvas, OneDrive, SharePoint) and explain managed devices, Duo and data classification.",
      html: `<p>A <b>digital ecosystem</b> is the interconnected network of users, hardware and software an organization runs on. An <b>enterprise system</b> is a large-scale software platform built or bought to support the <em>whole</em> organization rather than one department (a university-wide finance and timekeeping system is a typical example). At IU these systems support research, teaching and learning and work the same way across campuses: Microsoft 365, Canvas and Google at IU, plus systems you use away from a computer too, such as Stellic and your Crimson Card.</p>
<ul>
<li><b>Canvas</b>: IU's learning management system, where courses, modules, assignments and submissions live (and where links to McGraw-Hill Connect activities appear).</li>
<li><b>OneDrive</b>: your Microsoft 365 cloud storage for storing, syncing and sharing files, reached in a browser or mapped into Windows File Explorer.</li>
<li><b>SharePoint</b>: Microsoft 365 team sites with shared document libraries and permissions, for collaborating as a group.</li>
<li><b>IUanyWare</b>: reach IU computing from a web browser on almost any device. <b>STC Desktop</b> remotely logs you in to a real Bloomington Student Technology Center lab computer (K201/K204 students during the day; all students in evenings and on weekends). <b>IUanyWare Desktop</b> uses <b>virtual desktop infrastructure (VDI)</b>, much like a virtual machine, and is open to every IU user at any time, whether you want a single app or a full desktop.</li>
</ul>
<p>An STC lab computer is a <b>managed device</b>: its operating system and software are governed by policies set by a central IT service, which is why some settings are locked or show administrator warnings. Logging in to IU systems uses <b>Duo</b> multi-factor authentication: <em>something you know</em> (your passphrase) plus <em>something you have</em> (your phone or a token that gives a code or push). Finally, IU's <b>data classification</b> levels (Public, University-Internal, Restricted, Critical, from least to most sensitive) limit how data may be used, including whether it may be put into AI tools; check the classification before you share or upload anything.</p>
<div class="keyidea"><b>Key idea.</b> Course work and submissions → Canvas. Your own cloud files → OneDrive. Team document space → SharePoint. Windows apps from any device → IUanyWare (STC Desktop for a lab machine, IUanyWare Desktop/VDI for anyone, anytime). Proving it's you → Duo.</div>
<div class="example"><b>Example.</b> On a Sunday night, a K201 student on a Chromebook opens IUanyWare in her browser, chooses an STC Desktop, approves a Duo push on her phone, opens the Excel file from her OneDrive in File Explorer, and later uploads the finished workbook to the assignment in Canvas.</div>
<div class="trap"><b>Common trap.</b> Confusing the two IUanyWare options. STC Desktop is a real lab computer with time-and-course limits; IUanyWare Desktop (VDI) is a virtual desktop open to every IU user at all hours. Also: a password alone is not multi-factor; two things you <em>know</em> are still one factor type.</div>`,
      gens: ["k201-ch2-iusys"],
    },
    {
      title: "Managing, sharing and submitting files",
      lo: "Manage files locally and in the cloud, share them correctly, and submit a file in Canvas and verify the submission.",
      html: `<p>Files are grouped into <b>folders</b>, and folders can be nested inside other folders, like shelves inside a bookcase, with permissions that control who can open what. <b>Windows File Explorer</b> is the graphical app for browsing, renaming, moving, sharing and checking properties of files and folders.</p>
<p>A file on the <b>local machine</b> lives on the device in front of you: handy offline, but if the laptop is lost, stolen or broken and there is no copy elsewhere, the file is gone for good. A file in <b>cloud/remote storage</b> such as OneDrive needs an internet connection but can be opened from many devices, always in its latest version, and is easier to recover if something goes wrong. In File Explorer the two can look identical, so check the path or location. When you open a OneDrive file from File Explorer it opens in the full desktop app with no download/re-upload; saving back to the cloud may lag a moment. On a managed STC machine, OneDrive's “back up folders on this PC” screen may show an IT-administrator warning and red folders; that is expected, so just continue.</p>
<p>OneDrive keeps files in georedundant cloud storage, but it is a <b>file repository, not a true backup</b>. A true backup is an <b>immutable</b> (unchangeable) copy, for example on separate physical media, so that a deletion, overwrite or corruption that syncs everywhere cannot touch it.</p>
<p>Two ways to share (note: sharing files between students is <em>not</em> permitted in K201/K204 unless your instructor asks for it):</p>
<ul>
<li><b>As an attachment</b> (email, Canvas message, Teams): you send a <em>copy</em>. Recipients edit their own copies, never your original, and you have to merge their changes back by hand. Large or macro-enabled files may need compressing to a .zip first.</li>
<li><b>By granting access</b>: you set permissions (view, edit, download, delete) on the original file or folder. Everyone works on the one current version, so there is nothing to merge.</li>
</ul>
<p><b>Submitting in Canvas.</b> Upload from the assignment's own page and make sure the file type matches what is required. Then <b>verify</b>: look for the submission confirmation and its timestamp, and open or download the file you actually submitted to check it is the right file, the right version, and that it opens.</p>
<div class="keyidea"><b>Key idea.</b> Attachment = copy (many versions, manual merging). Granting access = one shared original (always current). Repository ≠ backup: only an unchangeable copy protects you from changes that sync.</div>
<div class="example"><b>Example.</b> Jordan emails a budget workbook to three teammates; two edit their copies and send them back, so Jordan now juggles four versions and must merge two sets of edits. Had Jordan shared the OneDrive file with edit permission, all three would have edited the one original.</div>
<div class="trap"><b>Common trap.</b> “I clicked Submit, so it's done.” Students regularly submit last week's draft, the wrong workbook, or a file that will not open. Re-open the submitted file from Canvas; the timestamp alone does not prove you sent the right thing.</div>`,
      gens: ["k201-ch2-files"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const fc = (id, tag, front, back) => ({ id: "k201-ch2-c-" + id, tag, front, back });
  const flashcards = [
    fc("bit", "Definition", "What is a <em>bit</em>?", "The smallest unit of computer data: an electrical state stored as 0 (off) or 1 (on). The processor interprets strings of bits as numbers, text, images and instructions."),
    fc("data-info", "Distinction", "What is the difference between <em>data</em> and <em>information</em>?", "Data is raw, recorded facts with no meaning on their own. Information is data that has been cleaned, processed and organized in context so it can support a decision."),
    fc("data-info-ex", "Example", "Give an example of data becoming information.", "A register's list of 2,000 transactions (data) summarized into “sales fall 60% after 2 p.m. on Fridays” (information), which lets the owner decide on staffing or hours."),
    fc("ways-classify", "List", "Name three ways data can be categorized.", "By how it is <b>used</b>, by the <b>type</b> collected (quantitative vs. qualitative), and by how it is <b>stored</b> (volatile vs. non-volatile; structured vs. unstructured)."),
    fc("quant-qual", "Distinction", "Quantitative vs. qualitative data?", "Quantitative is numeric and answers “how much / how many” (units sold, minutes on page). Qualitative describes qualities, opinions or characteristics in words, images or sound (a review comment, a product photo)."),
    fc("rev-vol", "Distinction", "Revenue vs. volume?", "Revenue is the dollar total of all sales in a period. Volume is a count of how many items or transactions meet a criterion."),
    fc("quant-use", "Why", "Why is quantitative data especially useful to managers?", "Because it can be calculated with: totals, averages, What-If predictions and visualizations."),
    fc("collect", "List", "List several ways businesses collect data beyond the register.", "Surveys, interviews, focus groups, social media, website cookies, CRM software, often combined with demographic data."),
    fc("cookies", "Definition", "What do website <em>cookies</em> let a business track?", "How a visitor found the site and how they behave on it, such as how long they spend on each page."),
    fc("crm", "Definition", "What does CRM software contribute to data collection?", "It joins a customer's email click-throughs, app use, purchases, support interactions and social media presence into one holistic view of that customer."),
    fc("costs", "List", "What are the main costs of collecting data?", "Storage, processing (computing power and employee time cleaning it), and risk: breaches (fines, remediation, lost trust) and accidental leaks that hurt customers or help competitors."),
    fc("just-enough", "Why", "Why should a business collect “just enough” data, and how?", "Too much data is as costly and ineffective as too little. Define the problem and questions first, then collect only accurate, relevant data that answers them, not everything “just in case.”"),
    fc("volatile", "Distinction", "Volatile vs. non-volatile storage?", "Volatile (RAM) loses its contents when power is lost. Non-volatile (hard drive, SSD, ROM, flash) keeps data through a power cycle."),
    fc("kernel", "Definition", "What is the <em>kernel</em>, and where does it go at boot?", "The core of the operating system. It is stored on permanent storage and loaded/expanded into RAM when the computer starts."),
    fc("reboot", "Why", "Why does rebooting fix so many computer problems?", "Restarting clears RAM, including corrupted data held there, and reloads a clean copy of the OS and apps from permanent storage."),
    fc("struct", "Distinction", "Structured vs. unstructured data?", "Structured fits rows and named columns of consistent types (spreadsheet, relational database). Unstructured has no standard format: audio, video, images, social posts, free text."),
    fc("unstruct-share", "Fact", "Roughly how much of the data business systems collect is unstructured?", "About 80–90%, which is why techniques for analyzing it matter so much."),
    fc("clean-norm", "Distinction", "What do <em>cleaned</em> and <em>normalized</em> mean for structured data?", "Cleaned: errors corrected and formats made consistent. Normalized: organized consistently with duplicate instances removed."),
    fc("mining", "Definition", "What is data mining, and what are classification and clustering?", "Techniques for finding patterns in (often unstructured) data. Classification sorts items into known categories; clustering discovers groups of similar items that were not defined in advance."),
    fc("sentiment", "Definition", "What do NLP and sentiment analysis do?", "Natural language processing extracts meaning and relationships from text; sentiment analysis predicts the emotion or tone behind a message."),
    fc("ai", "Definition", "What is artificial intelligence?", "Any application or machine that mimics human intelligence."),
    fc("ai-types", "List", "Name and describe the three main types of AI.", "<b>Summative</b>: condenses large text into key points. <b>Generative</b>: creates new content (text, images, code, music). <b>Agentic</b>: autonomously plans and executes tasks toward a goal with minimal human input."),
    fc("ml", "Definition", "What is machine learning?", "A subset of AI in which a model is trained on data to make predictions or forecasts."),
    fc("nn", "Why", "How does a neural network differ from a rule-based program?", "It learns connection weights between artificial neurons from training data and predicts from those patterns, rather than following explicit pre-programmed rules. More training data generally makes it more reliable, and it can adapt without reprogramming."),
    fc("onprem", "Definition", "What is on-premises architecture? Pros and cons?", "The organization owns and runs its servers on site. Full control, but high up-front cost, its own staff for upkeep, and it is responsible for reliability and scaling."),
    fc("cloud", "Definition", "What is cloud architecture? Pros and cons?", "Computing and storage rented from a provider over the internet, pay-as-you-go. Elastic scaling and provider-managed hardware and redundancy, but it needs internet access and bills continue."),
    fc("edge", "Definition", "What is edge computing, and why use it?", "Processing data near where it is generated (store, device, sensor, vehicle). It cuts latency and bandwidth and keeps working with intermittent connectivity, at the cost of many more devices to manage."),
    fc("four-dims", "List", "On which four dimensions does the chapter compare on-prem, edge and cloud?", "Efficiency, cost, reliability and scalability."),
    fc("enterprise", "Definition", "What is an enterprise system?", "A large-scale software platform designed or purchased to support an entire organization, not one department (e.g., a university-wide finance/timekeeping system, Canvas, Microsoft 365)."),
    fc("ecosystem", "Definition", "What is a digital ecosystem?", "The interconnected network of users, hardware and software an organization relies on."),
    fc("managed", "Definition", "What is a managed device?", "A computer (like an STC lab machine) whose OS and software are governed by policies from a central IT service."),
    fc("iuanyware", "Distinction", "STC Desktop vs. IUanyWare Desktop?", "STC Desktop: remote login to a real Bloomington STC lab computer (K201/K204 students during the day; all students evenings and weekends). IUanyWare Desktop: a virtual desktop (VDI) for all IU users at any time, for single apps or a full desktop."),
    fc("systems", "Distinction", "Canvas vs. OneDrive vs. SharePoint?", "Canvas: learning management system for courses and submissions. OneDrive: your personal Microsoft 365 cloud file storage. SharePoint: Microsoft 365 team sites with shared document libraries."),
    fc("duo", "Definition", "What two factors does Duo combine?", "Something you know (your passphrase) and something you have (a phone or token providing a push or code)."),
    fc("classification", "List", "What are IU's data classification levels, least to most sensitive, and why do they matter?", "Public, University-Internal, Restricted, Critical. They limit how data may be used and shared, including whether it can go into AI tools."),
    fc("local-cloud", "Distinction", "Local vs. cloud storage of a file?", "Local: on your device, works offline, but lost forever if the device dies with no copy. Cloud: needs internet, reachable from many devices in its latest version, easier to recover."),
    fc("backup", "Why", "Why is OneDrive not a true backup?", "It is a georedundant file repository: deletions, overwrites and corruption sync to it. A true backup is an immutable (unchangeable) copy, e.g., on separate physical media."),
    fc("share", "Distinction", "Sharing as an attachment vs. granting access?", "Attachment sends a copy: recipients edit their own copies and the owner merges changes manually. Granting access sets permissions on the original, so everyone sees one current version with no merging."),
    fc("verify", "Procedure", "How do you verify a Canvas submission?", "Submit from the assignment page in the required file type, look for the confirmation and timestamp, then open or download the submitted file to confirm it is the right file and version and that it opens."),
  ];

  /* ============================================================
   * CUES
   * ============================================================ */
  const cues = [
    { when: "Raw rows, log entries, readings nobody has summarized", think: "Data", why: "Recorded facts with no context yet; nothing to decide on." },
    { when: "A summary, trend or comparison that lets someone decide", think: "Information", why: "Data that has been processed and organized in context." },
    { when: "“How much?”, “how many?”, a value you could add or average", think: "Quantitative data", why: "Numeric, so it supports calculation and What-If analysis." },
    { when: "Comments, opinions, photos, descriptions, colors", think: "Qualitative data", why: "Describes characteristics rather than measuring an amount." },
    { when: "“How many orders…?” vs. “how many dollars…?”", think: "Volume vs. revenue", why: "Volume counts items meeting a condition; revenue totals sales dollars." },
    { when: "“Let's collect everything just in case”", think: "Too much data / define the question first", why: "Every field adds storage, processing and breach risk without guaranteed value." },
    { when: "Lost on power failure; cleared by a reboot; open apps", think: "Volatile storage (RAM)", why: "RAM needs power to hold its contents." },
    { when: "Survives shutdown: hard drive, SSD, ROM, flash drive", think: "Non-volatile storage", why: "Permanent media keep data through a power cycle." },
    { when: "Rows and named columns, one type per column", think: "Structured data", why: "Fits a spreadsheet or relational database; easy to analyze." },
    { when: "Videos, call audio, social posts, free-text reviews", think: "Unstructured data → data mining, NLP, sentiment analysis", why: "No fixed format; needs special techniques to extract insight." },
    { when: "“Find groups we didn't know existed”", think: "Clustering", why: "Discovers groups of similar items without predefined labels." },
    { when: "Condense / outline / bullet a long document", think: "Summative AI", why: "Extracts the key points from existing text." },
    { when: "Draft, design, write code, compose", think: "Generative AI", why: "Creates new content from learned patterns." },
    { when: "Plans steps and acts toward a goal on its own", think: "Agentic AI", why: "Autonomous, goal-directed action with minimal human input." },
    { when: "Learned from examples / training data, not hand-coded rules", think: "Machine learning / neural network", why: "Predictions come from patterns in data." },
    { when: "Big spikes, fast growth, no up-front budget", think: "Cloud", why: "Elastic, pay-as-you-go capacity." },
    { when: "Millisecond decisions, sensors, spotty internet", think: "Edge", why: "Processing near the data source cuts latency and survives outages." },
    { when: "Full control, steady demand, willing to buy hardware", think: "On-premises", why: "Owned servers; high up-front cost; firm handles reliability and scaling." },
    { when: "Windows lab software from a browser, any device", think: "IUanyWare (STC Desktop or IUanyWare Desktop/VDI)", why: "STC Desktop has course and time limits; VDI is open to all IU users anytime." },
    { when: "Passphrase + phone push", think: "Duo multi-factor authentication", why: "Something you know plus something you have." },
    { when: "Recipients edit their own copies; owner must merge", think: "Sharing as an attachment", why: "An attachment is a copy, not the original." },
    { when: "“Is my OneDrive a backup?”", think: "Repository, not an immutable backup", why: "Changes and deletions sync; only an unchangeable copy is a true backup." },
  ];

  /* ============================================================
   * BANKS
   * ============================================================ */
  const QQ_BANK = [
    { t: "Number of loyalty-card sign-ups this week", cat: "Quantitative", why: "a count answers “how many?”." },
    { t: "Average minutes a visitor spends on the checkout page", cat: "Quantitative", why: "a measured amount you can average and compare." },
    { t: "Units of a hoodie left in the warehouse", cat: "Quantitative", why: "inventory on hand is a count." },
    { t: "Total dollars spent on ads in March", cat: "Quantitative", why: "a dollar amount you can add and compare." },
    { t: "Star rating (1 to 5) a guest gave a hotel stay", cat: "Quantitative", why: "a numeric score that can be averaged across guests." },
    { t: "Number of support tickets closed per agent", cat: "Quantitative", why: "a count you can total and rank." },
    { t: "Delivery time in hours for each online order", cat: "Quantitative", why: "a measured quantity of time." },
    { t: "Percentage of email recipients who clicked a link", cat: "Quantitative", why: "a rate computed from counts." },
    { t: "A customer's written comment that the app “feels clunky”", cat: "Qualitative", why: "an opinion expressed in words, not an amount." },
    { t: "Photos of a new sneaker used in a marketing campaign", cat: "Qualitative", why: "images describe the product; they do not measure an amount." },
    { t: "Focus-group notes on how a logo makes people feel", cat: "Qualitative", why: "feelings and impressions are descriptive." },
    { t: "The color options a car model comes in", cat: "Qualitative", why: "a characteristic described by name, not counted." },
    { t: "Transcript of an interview with a supplier about delays", cat: "Qualitative", why: "narrative text describing reasons and opinions." },
    { t: "Open-ended survey answer: “What should we improve?”", cat: "Qualitative", why: "free-text opinions rather than numbers." },
    { t: "A social media post praising a store's staff", cat: "Qualitative", why: "an opinion in words; you would need text analysis to quantify it." },
    { t: "The flavor name of each smoothie on the menu", cat: "Qualitative", why: "a descriptive label, not a measured amount." },
  ];
  const QQ_DEFS = { Quantitative: "numeric; answers how much / how many", Qualitative: "describes qualities, characteristics or opinions" };

  const DI_TF = [
    { s: "A spreadsheet of 50,000 raw sales rows is information because it contains so many facts.", truth: false, why: "Volume does not create meaning. Until the rows are processed and organized to answer a question, they are data.", hint: "What has to happen to data before it is information?" },
    { s: "Data becomes information once it is cleaned, processed and organized so that it can support a decision.", truth: true, why: "That is exactly the transformation that gives raw facts meaning and usefulness.", hint: "Recall the data → information pipeline." },
    { s: "A bit is stored as either 0 (off) or 1 (on).", truth: true, why: "Binary digits are two-state electrical impulses that the processor interprets.", hint: "Think about what “binary” means." },
    { s: "Qualitative data cannot be collected through surveys, because surveys only produce numbers.", truth: false, why: "Open-ended survey answers are qualitative. Surveys often yield both kinds of data.", hint: "Think of a survey question with a text box." },
    { s: "“How many orders over $100 did we receive?” asks for volume, not revenue.", truth: true, why: "It counts transactions meeting a condition; revenue would total the dollars.", hint: "Is the answer a count or a dollar sum?" },
    { s: "Revenue is the number of items sold in a period.", truth: false, why: "Revenue is the dollar total of sales; the number of items meeting a criterion is volume.", hint: "Revenue is measured in what unit?" },
    { s: "Quantitative data is what makes What-If predictions and charts possible, because you can calculate with it.", truth: true, why: "Numeric data can be added, averaged and modeled.", hint: "Which type of data can you do arithmetic on?" },
    { s: "A product photo is quantitative data because the file is made of bits.", truth: false, why: "Everything digital is bits; what matters is what the data describes. A photo describes characteristics, so it is qualitative.", hint: "Classify by what the data says, not how it is stored." },
  ];

  const DI_CONCEPT = [
    { q: "A regional manager must decide which of four stores gets an extra employee on weekends. Which of these is <b>information</b> for that decision?",
      right: "A chart of average weekend customers per staff member at each store over the last quarter",
      rightWhy: "It is processed, organized and tied directly to the staffing decision.",
      wrong: [
        { t: "The raw door-counter export: a timestamp for every person who entered any store", why: "Raw, unsummarized records are data; nobody can decide from them yet." },
        { t: "The total number of bits used to store last quarter's sales file", why: "File size says nothing about the business question." },
        { t: "A list of every employee's ID number", why: "Identifiers with no context for the decision are data." },
      ],
      sol: ["Information = data processed and organized so it supports <em>this</em> decision.", "Only the per-store weekend workload chart answers “where is extra staff most needed?”"] },
    { q: "Why does the same cell value, <code>48</code>, count as data rather than information?",
      right: "Without context (48 what? when? compared to what?) it has no meaning anyone can act on",
      rightWhy: "Context and processing turn a value into information.",
      wrong: [
        { t: "Because numbers are always data and words are always information", why: "Both numbers and words can be data or information; context and processing decide." },
        { t: "Because it has not been stored on a hard drive yet", why: "Where data is stored does not determine whether it is meaningful." },
        { t: "Because it is quantitative, and only qualitative data can be information", why: "Quantitative summaries are some of the most useful information there is." },
      ],
      sol: ["Ask: could a manager make a decision from this alone?", "A lone number has no unit, period or comparison, so it is raw data."] },
    { q: "A café owner wants to know whether to keep a seasonal pumpkin drink. Which pair of data would best combine quantitative and qualitative evidence?",
      right: "Weekly units sold of the drink, plus customers' written comments about it",
      rightWhy: "Sales counts show demand (quantitative); comments explain why (qualitative).",
      wrong: [
        { t: "Weekly units sold and weekly dollars of the drink", why: "Both are quantitative; there is no qualitative evidence." },
        { t: "Customer comments and photos of the drink", why: "Both are qualitative; nothing measures how much sold." },
        { t: "The drink's recipe and the menu font", why: "Neither tells you about demand or customer opinion." },
      ],
      sol: ["Quantitative = how much/how many; qualitative = descriptions and opinions.", "The best evidence pairs a measure of demand with customers' reasons."] },
    { q: "Which question can <b>only</b> be answered with qualitative data?",
      right: "Why do customers say they abandon their online carts?",
      rightWhy: "Reasons in customers' own words are descriptive; numbers can show <em>that</em> they abandon, not <em>why</em> they say they do.",
      wrong: [
        { t: "How many carts were abandoned last month?", why: "A count: quantitative." },
        { t: "What is the average cart value at checkout?", why: "An average of dollar amounts: quantitative." },
        { t: "What share of carts are abandoned on mobile?", why: "A percentage computed from counts: quantitative." },
      ],
      sol: ["“How many / how much / what share” questions are quantitative.", "“Why do they say…” needs words, opinions and explanations."] },
  ];

  const COST_BANK = [
    { t: "Monthly bill for the cloud space holding three years of click logs", cat: "Storage", why: "paying to keep data that has been saved." },
    { t: "Buying another drive array because the file server is full", cat: "Storage", why: "capacity to hold data costs money." },
    { t: "Keeping every version of every product photo ever taken", cat: "Storage", why: "retained files keep consuming paid space." },
    { t: "Archiving years of security-camera video nobody reviews", cat: "Storage", why: "large unused files still take up paid capacity." },
    { t: "An analyst spends two days fixing inconsistent date formats", cat: "Processing", why: "employee time cleaning raw data is a processing cost." },
    { t: "Renting extra computing power to crunch a huge survey file", cat: "Processing", why: "turning raw data into information consumes computing resources." },
    { t: "De-duplicating 40,000 customer records before a mailing", cat: "Processing", why: "cleaning work required before the data is usable." },
    { t: "Writing scripts to merge app data with CRM data", cat: "Processing", why: "integrating and preparing data takes skilled time." },
    { t: "A regulator fines the company after customer data is stolen", cat: "Breach / leak risk", why: "monetary penalties follow a breach." },
    { t: "Customers stop shopping after news of a data breach", cat: "Breach / leak risk", why: "lost consumer confidence is a breach cost." },
    { t: "A spreadsheet of vendor prices is accidentally emailed to a competitor", cat: "Breach / leak risk", why: "an accidental leak helps competitors and harms vendors." },
    { t: "Hiring a firm to investigate and repair systems after a hack", cat: "Breach / leak risk", why: "remediation is a direct breach cost." },
  ];
  const COST_DEFS = { "Storage": "paying to keep data", "Processing": "computing power and staff time to clean and analyze it", "Breach / leak risk": "fines, remediation and lost trust if held data escapes" };

  const FIELD_SCEN = [
    { goal: "A bike-share program wants to decide where to add docking stations.",
      fields: [
        { t: "Start and end station of each trip", ok: true, why: "shows where demand is." },
        { t: "Time of day each trip starts", ok: true, why: "reveals when stations run empty or full." },
        { t: "Times a station was full when a rider tried to return a bike", ok: true, why: "direct evidence of unmet demand." },
        { t: "Riders' favorite music genres", ok: false, why: "unrelated to station placement; pure cost and risk." },
        { t: "Riders' full home addresses", ok: false, why: "sensitive personal data the decision does not need; trip data already shows demand." },
        { t: "Each rider's social media handles", ok: false, why: "irrelevant to the question and raises privacy risk." },
      ] },
    { goal: "An online bookstore wants to know why customers abandon checkout.",
      fields: [
        { t: "The checkout step where each session ended", ok: true, why: "pinpoints where people drop off." },
        { t: "Device type (phone or computer) for each session", ok: true, why: "abandonment often differs by device." },
        { t: "Short exit-survey comment on why they left", ok: true, why: "qualitative reasons explain the numbers." },
        { t: "Customers' birthdates", ok: false, why: "sensitive and not needed to find the drop-off point." },
        { t: "Every mouse movement on every page of the site", ok: false, why: "enormous volume, mostly irrelevant; classic “just in case” collection." },
        { t: "Customers' employer names", ok: false, why: "unrelated to checkout friction." },
      ] },
    { goal: "A campus dining hall wants to cut food waste at lunch.",
      fields: [
        { t: "Pounds of each dish thrown away per day", ok: true, why: "directly measures waste by item." },
        { t: "Number of servings of each dish prepared", ok: true, why: "compare with what was eaten to spot over-production." },
        { t: "Number of diners each lunch period", ok: true, why: "demand drives how much should be prepared." },
        { t: "Students' ID photos", ok: false, why: "personal data with no bearing on waste." },
        { t: "Students' majors", ok: false, why: "not connected to how much food is wasted." },
        { t: "Video of every table throughout lunch", ok: false, why: "huge unstructured data and a privacy risk; weighing waste answers the question more cheaply." },
      ] },
    { goal: "A gym wants to decide whether to extend its weekday hours.",
      fields: [
        { t: "Check-ins per hour, by weekday", ok: true, why: "shows demand at the edges of current hours." },
        { t: "Survey answer: would you come earlier or later if open?", ok: true, why: "captures demand that cannot show up in check-ins yet." },
        { t: "Staffing cost per extra hour", ok: true, why: "needed to weigh the benefit against the cost." },
        { t: "Members' credit-card numbers", ok: false, why: "highly sensitive and irrelevant to hours; a breach risk." },
        { t: "Members' favorite TV shows", ok: false, why: "has nothing to do with opening hours." },
        { t: "Heart-rate readings from every workout", ok: false, why: "detailed health data the hours decision does not need." },
      ] },
  ];

  const TOOL_BANK = [
    { need: "how each visitor arrived at the website and how long they stayed on each page", tool: "Website cookies", why: "Cookies track a visitor's path to and through the site." },
    { need: "one combined view of a customer's email clicks, app use, purchases and support calls", tool: "CRM software", why: "CRM systems tie many touchpoints together into one customer picture." },
    { need: "how eight carefully chosen customers react to three package designs, discussed as a group", tool: "A focus group", why: "Focus groups capture rich group reactions and discussion." },
    { need: "quick 1–10 ratings from thousands of recent buyers", tool: "A survey", why: "Surveys reach many people cheaply with standard questions." },
    { need: "exactly which items sold, at what price, at each register", tool: "Point-of-sale (POS) records", why: "The POS logs each transaction as it happens." },
    { need: "what people are saying publicly about a brand this week", tool: "Social media monitoring", why: "Public posts reveal unprompted opinions about the brand." },
    { need: "a supplier's detailed explanation of recurring delivery delays", tool: "An interview", why: "One-on-one interviews draw out detailed explanations." },
  ];

  const COLLECT_CONCEPT = [
    { q: "A marketing director says: “Storage is cheap. Let's log every customer interaction forever, just in case.” What is the best response?",
      right: "First define the decisions and questions the data must support, then collect only relevant, accurate data for them",
      rightWhy: "Question-first collection controls storage, processing and breach costs.",
      wrong: [
        { t: "Agree; more data always leads to better decisions", why: "Too much data is as ineffective and expensive as too little; it buries the signal." },
        { t: "Agree, as long as the data is stored in the cloud, where it cannot be breached", why: "Cloud-held data can be breached too." },
        { t: "Collect nothing until the company buys its own servers", why: "On-premises storage does not remove the need to choose what to collect." },
      ],
      sol: ["Recall the mitigation the chapter recommends for data costs.", "Define the problem first; then collect “just enough” relevant data."] },
    { q: "Which cost is <b>easiest to overlook</b> when a team says “the extra data only costs a few dollars of disk space”?",
      right: "Employee time spent cleaning and preparing the extra data, plus the risk of holding it",
      rightWhy: "Processing time and breach exposure usually dwarf raw storage cost.",
      wrong: [
        { t: "The cost of the electricity for the monitor", why: "Trivial and unrelated to the volume of data held." },
        { t: "There is no other cost; disk space is the only cost of data", why: "Processing and risk are real costs of every byte kept." },
        { t: "The cost of buying a faster keyboard", why: "Not a cost of collecting or holding data." },
      ],
      sol: ["List the three families of data cost: storage, processing, risk.", "Disk is cheap; people's cleaning time and breach exposure are not."] },
    { q: "A startup keeps customers' full birthdates, though it only uses them to check that buyers are over 18. What change best reduces risk without losing value?",
      right: "Store only a yes/no “verified 18+” flag after checking, instead of the birthdate",
      rightWhy: "The decision needs only the flag; dropping the birthdate removes sensitive data that could leak.",
      wrong: [
        { t: "Keep the birthdates but also collect home addresses for extra verification", why: "Adds more sensitive data, increasing breach risk." },
        { t: "Keep everything; a breach only matters if it is on-premises", why: "Breaches happen on-premises and in the cloud alike." },
        { t: "Stop checking ages so no data is needed", why: "Abandons a legitimate business need instead of collecting just enough." },
      ],
      sol: ["Ask what the business decision actually requires.", "Collect the minimum that answers it: a verification flag, not the birthdate."] },
    { q: "After a breach, which of these is <b>not</b> one of the costs the company faces?",
      right: "A lower monthly cloud storage rate",
      rightWhy: "A breach does not reduce storage pricing; the others are breach costs.",
      wrong: [
        { t: "Monetary penalties", why: "Fines are a classic breach cost." },
        { t: "Lost consumer confidence", why: "Customers may leave after a breach." },
        { t: "Remediation costs to fix the systems", why: "Investigating and repairing is costly." },
      ],
      sol: ["Recall the costs a breach brings.", "Fines, cleanup and lost trust; nothing about cheaper storage."] },
  ];

  const VOL_BANK = [
    { t: "RAM holding the browser tabs you have open", cat: "Volatile", why: "RAM is cleared when power is lost." },
    { t: "An essay you have typed but not yet saved", cat: "Volatile", why: "unsaved work exists only in RAM." },
    { t: "The working copy of the OS loaded at boot", cat: "Volatile", why: "the kernel is expanded into RAM, which is wiped at shutdown." },
    { t: "A spreadsheet's recalculated values while the file is open and unsaved", cat: "Volatile", why: "open, unsaved data lives in RAM." },
    { t: "Corrupted data that disappears after a restart", cat: "Volatile", why: "a reboot clears RAM, taking the corruption with it." },
    { t: "A laptop's solid-state drive", cat: "Non-volatile", why: "SSDs retain data without power." },
    { t: "A USB flash drive in your backpack", cat: "Non-volatile", why: "flash memory keeps its contents unpowered." },
    { t: "ROM chip holding start-up instructions", cat: "Non-volatile", why: "read-only memory keeps its contents through power cycles." },
    { t: "An external hard drive used for backups", cat: "Non-volatile", why: "hard drives are permanent storage." },
    { t: "The kernel file stored on the hard drive", cat: "Non-volatile", why: "the OS core is kept on permanent storage and loaded from it at boot." },
  ];
  const VOL_DEFS = { "Volatile": "temporary (RAM); lost when power is lost", "Non-volatile": "permanent (drives, ROM, flash); survives power loss" };

  const SU_BANK = [
    { t: "A table of orders with columns OrderID, Date, Qty, Price", cat: "Structured", why: "rows and named, typed columns." },
    { t: "An Excel sheet of employee IDs, departments and start dates", cat: "Structured", why: "consistent columns ready to sort and filter." },
    { t: "A PostgreSQL table of student enrollments", cat: "Structured", why: "a relational database table is structured by definition." },
    { t: "Inventory counts by SKU and warehouse", cat: "Structured", why: "values fit fixed columns." },
    { t: "Daily temperature readings with sensor ID and timestamp columns", cat: "Structured", why: "each reading is a row with consistent fields." },
    { t: "A cleaned, de-duplicated customer list with email and ZIP columns", cat: "Structured", why: "cleaned and normalized rows and columns." },
    { t: "Recordings of customer service calls", cat: "Unstructured", why: "audio has no rows and columns." },
    { t: "Videos customers post unboxing a product", cat: "Unstructured", why: "video is non-standard data." },
    { t: "Free-text answers in an online feedback form", cat: "Unstructured", why: "open text varies in length and content." },
    { t: "Tweets and comments mentioning the brand", cat: "Unstructured", why: "social media posts have no fixed format." },
    { t: "Scanned photos of handwritten receipts", cat: "Unstructured", why: "images must be interpreted before they fit columns." },
    { t: "Email threads between sales reps and clients", cat: "Unstructured", why: "free-form text messages." },
  ];
  const SU_DEFS = { "Structured": "rows and named columns of consistent types", "Unstructured": "no standard format: audio, video, images, free text" };

  const TECH_BANK = [
    { task: "Discover groups of shoppers with similar buying habits that nobody had defined before", right: "Clustering", why: "Clustering finds natural groups without predefined labels." },
    { task: "Sort incoming support emails into the known categories “billing”, “shipping” and “returns”", right: "Classification", why: "Classification assigns items to categories that already exist." },
    { task: "Estimate whether each product review is positive, negative or angry", right: "Sentiment analysis", why: "Sentiment analysis predicts the emotion or tone of a message." },
    { task: "Extract which people, companies and places are mentioned in thousands of news articles and how they are related", right: "Natural language processing", why: "NLP extracts meaning and relationships from text." },
    { task: "Group thousands of open-ended survey answers into themes that emerge from the text itself", right: "Clustering", why: "The themes are discovered, not set in advance." },
    { task: "Flag whether each insurance claim note belongs to the existing “fraud review” or “routine” category", right: "Classification", why: "Items are assigned to predefined categories." },
    { task: "Track whether the tone of social posts about a new phone is getting more negative week by week", right: "Sentiment analysis", why: "Measuring tone over time is sentiment analysis." },
  ];
  const TECHS = ["Classification", "Clustering", "Natural language processing", "Sentiment analysis"];
  const TECH_WHY = {
    "Classification": "Classification needs categories defined in advance.",
    "Clustering": "Clustering discovers new groups rather than assigning known ones or reading tone.",
    "Natural language processing": "NLP extracts meaning and relationships from text, a broader goal than this specific task.",
    "Sentiment analysis": "Sentiment analysis reads emotion or tone, which this task does not ask for.",
  };

  const STORAGE_CONCEPT = [
    { q: "Lena is typing a report when the building loses power. She saved it 20 minutes ago. When the computer restarts, what will she find?",
      right: "The report as it was at the last save; the last 20 minutes of typing are gone",
      rightWhy: "Saved work is on non-volatile storage; unsaved changes lived only in RAM.",
      wrong: [
        { t: "The full report including everything typed before the outage", why: "Unsaved edits were in volatile RAM, which loses its contents without power." },
        { t: "Nothing at all; the whole file is erased", why: "The saved version is on the drive, which keeps data through power loss." },
        { t: "The report, but only if the power comes back within an hour", why: "RAM is cleared immediately; waiting time does not matter." },
      ],
      sol: ["Ask which parts of the work were in RAM and which were on the drive.", "Saved = non-volatile (survives); unsaved = volatile (lost)."] },
    { q: "Why does restarting a frozen computer often fix the problem?",
      right: "It clears RAM, including any corrupted data there, and reloads a clean OS from permanent storage",
      rightWhy: "Volatile memory is wiped; the kernel is re-expanded from the drive.",
      wrong: [
        { t: "It erases the hard drive and reinstalls the operating system", why: "A reboot does not touch non-volatile storage." },
        { t: "It downloads a new copy of every app from the internet", why: "Apps are reloaded from local permanent storage." },
        { t: "It moves all files from RAM to the cloud", why: "RAM is simply cleared, not copied to the cloud." },
      ],
      sol: ["Which storage type is reset when power is cycled?", "RAM is cleared; the kernel loads fresh from the drive into RAM."] },
    { q: "When a computer boots, where does the operating system's kernel come from and where does it go?",
      right: "From permanent storage into RAM",
      rightWhy: "The kernel is stored on non-volatile storage and expanded into RAM to run.",
      wrong: [
        { t: "From RAM onto the hard drive", why: "Reversed: RAM is empty at power-on." },
        { t: "From the cloud into ROM", why: "The kernel is stored locally and runs from RAM; ROM is not written at boot." },
        { t: "It stays on the hard drive and never enters RAM", why: "Running software is held in RAM." },
      ],
      sol: ["At power-on, which storage is empty?", "So the kernel must be copied from the drive (non-volatile) into RAM (volatile)."] },
    { q: "A retailer has 2 million product reviews and wants actionable insight. Why is this harder than analyzing its sales table?",
      right: "Reviews are unstructured text, so techniques like NLP and sentiment analysis are needed before they can be summarized",
      rightWhy: "Unstructured data lacks columns to sort, total or filter directly.",
      wrong: [
        { t: "Reviews are stored in RAM, so they disappear too quickly", why: "Where data is stored is unrelated; reviews are kept on permanent storage." },
        { t: "Reviews are quantitative, and quantitative data cannot be analyzed", why: "Free-text reviews are qualitative and unstructured; quantitative data is the easy kind." },
        { t: "There is no way to get insight from reviews at all", why: "Data mining, NLP and sentiment analysis exist for exactly this." },
      ],
      sol: ["What shape is review text?", "Unstructured data needs mining/NLP before it yields insight."] },
  ];

  const AI_BANK = [
    { t: "A tool that turns a 90-minute meeting transcript into five bullet points", cat: "Summative AI", why: "it condenses existing text into key points." },
    { t: "Condensing 400 pages of contract terms into a one-page outline", cat: "Summative AI", why: "it extracts and outlines what matters." },
    { t: "Pulling the main complaints out of a long report of customer emails", cat: "Summative AI", why: "it extracts important information from a large text." },
    { t: "Producing a short abstract of a research article", cat: "Summative AI", why: "it summarizes content that already exists." },
    { t: "Writing a first draft of a product description from a few notes", cat: "Generative AI", why: "it creates new text." },
    { t: "Creating an original jingle for a radio ad", cat: "Generative AI", why: "it composes new music." },
    { t: "Producing Python code to clean a CSV file", cat: "Generative AI", why: "it generates new code." },
    { t: "Designing three new logo concepts from a text prompt", cat: "Generative AI", why: "it generates new images." },
    { t: "A system that, given a travel budget, searches flights, books the best one and adds it to your calendar", cat: "Agentic AI", why: "it plans and executes multiple steps toward a goal on its own." },
    { t: "An assistant that monitors stock levels, places reorders and emails suppliers without being asked each time", cat: "Agentic AI", why: "it acts autonomously toward a goal." },
    { t: "Software that triages IT tickets, runs fixes and closes resolved tickets by itself", cat: "Agentic AI", why: "it makes decisions and takes actions with minimal human input." },
    { t: "A bot that schedules interviews by checking calendars, proposing times and sending invites", cat: "Agentic AI", why: "it carries out a multi-step task toward a goal." },
  ];
  const AI_DEFS = { "Summative AI": "extracts and condenses key information from large text", "Generative AI": "creates new content (text, images, code, music)", "Agentic AI": "plans and executes tasks toward a goal with minimal human input" };

  const RULE_BANK = [
    { t: "If an order total is over $500, send it for manager approval.", cat: "Explicit rule (programmed)", why: "a programmer wrote the exact condition." },
    { t: "Charge 7% sales tax on every taxable item.", cat: "Explicit rule (programmed)", why: "a fixed calculation written into the code." },
    { t: "Lock the account after five failed passphrase attempts.", cat: "Explicit rule (programmed)", why: "a hard-coded threshold." },
    { t: "Sort the list of students alphabetically by last name.", cat: "Explicit rule (programmed)", why: "a fixed instruction with a deterministic result." },
    { t: "Ship free if the customer is a member.", cat: "Explicit rule (programmed)", why: "an if-then rule someone wrote." },
    { t: "Estimate how likely a transaction is to be fraud based on millions of past examples.", cat: "Learned from training data", why: "the model found patterns in past data, not written rules." },
    { t: "Recognize which photos contain a damaged package.", cat: "Learned from training data", why: "a neural network learned visual patterns from labeled photos." },
    { t: "Forecast next month's demand from years of sales history.", cat: "Learned from training data", why: "machine learning predicts from patterns in historical data." },
    { t: "Suggest songs a listener will probably like.", cat: "Learned from training data", why: "learned from listening behavior across many users." },
    { t: "Improve spam filtering as new kinds of spam appear, without a programmer rewriting it.", cat: "Learned from training data", why: "neural networks adapt to changing inputs without reprogramming." },
  ];
  const RULE_DEFS = { "Explicit rule (programmed)": "a person wrote the exact logic", "Learned from training data": "machine learning / neural network found the pattern in data" };

  const AI_CONCEPT = [
    { q: "A neural network that predicts late deliveries was trained on 500 shipments. The team can add 50,000 more historical shipments. What is the most likely effect?",
      right: "Predictions usually become more reliable, because the network learns from more examples",
      rightWhy: "More (good) training data generally improves a neural network's reliability.",
      wrong: [
        { t: "No effect, because a neural network follows rules a programmer wrote", why: "Neural networks learn from data rather than explicit rules." },
        { t: "It must be completely reprogrammed before it can use new data", why: "Neural networks adapt to new inputs without reprogramming." },
        { t: "It becomes generative AI", why: "The amount of training data does not change what the system does." },
      ],
      sol: ["How does a neural network get its “knowledge”?", "From training data, so more relevant data usually means more reliable predictions."] },
    { q: "Which statement best describes the relationship between AI and machine learning?",
      right: "Machine learning is a subset of AI in which models are trained on data to make predictions",
      rightWhy: "All machine learning is AI, but not all AI is machine learning.",
      wrong: [
        { t: "AI is a subset of machine learning", why: "Reversed: AI is the broad field." },
        { t: "They are unrelated fields", why: "Machine learning sits inside AI." },
        { t: "Machine learning means a programmer writes every rule by hand", why: "That describes traditional rule-based programming." },
      ],
      sol: ["AI = anything that mimics human intelligence.", "ML is one way to build AI: learn from data."] },
    { q: "A model trained only on winter sales data is used to predict summer sales and does badly. What is the best explanation?",
      right: "Neural networks predict from the patterns in their training data, and summer patterns were not represented",
      rightWhy: "A model is only as good as the data it learned from.",
      wrong: [
        { t: "The programmer forgot to write a rule for summer", why: "Neural networks are not built from hand-written rules." },
        { t: "AI cannot make predictions, only summaries", why: "Prediction is exactly what machine learning does." },
        { t: "The model ran out of RAM", why: "Memory is unrelated to the pattern mismatch." },
      ],
      sol: ["Where does a neural network get its patterns?", "If the training data lacks a situation, the model has not learned it."] },
    { q: "What most clearly separates <b>agentic</b> AI from <b>generative</b> AI?",
      right: "Agentic AI plans and takes a sequence of actions toward a goal on its own; generative AI produces content when asked",
      rightWhy: "Autonomy and action toward a goal define agentic AI.",
      wrong: [
        { t: "Agentic AI only summarizes long documents", why: "That is summative AI." },
        { t: "Generative AI never uses neural networks", why: "GenAI produces content from patterns learned by neural networks." },
        { t: "Agentic AI requires a human to approve every single step", why: "It works with minimal human intervention." },
      ],
      sol: ["Compare what each produces: content vs. completed tasks.", "Agentic = autonomous, goal-directed actions."] },
  ];

  const AI_TF = [
    { s: "A neural network makes predictions by following rules a programmer explicitly wrote for each case.", truth: false, why: "It predicts from patterns learned from training data, not explicit rules.", hint: "How does a neural network acquire its behavior?" },
    { s: "Generative AI creates new content such as text, images, code or music.", truth: true, why: "Creating new content is what “generative” means.", hint: "What does generate mean?" },
    { s: "Summative AI uses natural language processing to pull key points out of large amounts of text.", truth: true, why: "That is its defining job.", hint: "Think “summary”." },
    { s: "Machine learning is a broader category that contains all of AI.", truth: false, why: "It is the other way round: machine learning is a subset of AI.", hint: "Which is the umbrella term?" },
    { s: "Agentic AI can plan and carry out tasks toward a goal with little human intervention.", truth: true, why: "Autonomous, goal-directed action defines agentic AI.", hint: "Think of an “agent” acting for you." },
    { s: "A neural network needs to be reprogrammed every time its inputs change.", truth: false, why: "Neural networks can adapt to changing inputs without reprogramming.", hint: "Recall one advantage of learning from data." },
  ];

  const ARCH_BANK = [
    { t: "Company buys and installs its own servers in its headquarters", cat: "On-premises", why: "owned hardware on the firm's own site." },
    { t: "Large up-front capital purchase before any work can run", cat: "On-premises", why: "you must buy the hardware first." },
    { t: "In-house IT staff replace failed disks and manage backup power", cat: "On-premises", why: "the firm itself is responsible for reliability." },
    { t: "To handle growth, the firm must order and install more machines months ahead", cat: "On-premises", why: "scaling means buying hardware in advance." },
    { t: "Rented computing billed monthly by how much is used", cat: "Cloud", why: "pay-as-you-go operating cost." },
    { t: "Capacity grows for a holiday rush and shrinks afterward in minutes", cat: "Cloud", why: "elastic scalability." },
    { t: "The provider handles hardware failures and redundancy across data centers", cat: "Cloud", why: "the provider owns and maintains the hardware." },
    { t: "Employees cannot reach the system when the office internet is down", cat: "Cloud", why: "cloud services depend on an internet connection." },
    { t: "A camera analyzes shelf stock inside the store instead of uploading all video", cat: "Edge", why: "processing near the data source saves bandwidth." },
    { t: "A delivery drone decides how to avoid obstacles on board in milliseconds", cat: "Edge", why: "local processing for minimal latency." },
    { t: "Farm sensors keep working in a field with spotty cell coverage and upload summaries later", cat: "Edge", why: "edge tolerates intermittent connectivity." },
    { t: "IT now has to secure and update hundreds of small devices spread across stores", cat: "Edge", why: "more distributed devices to manage is edge's trade-off." },
  ];
  const ARCH_DEFS = { "On-premises": "the organization owns and runs servers on its own site", "Edge": "processing happens near where the data is generated", "Cloud": "computing rented from a provider over the internet, pay-as-you-go" };

  const ARCH_SCEN = [
    { s: "A new online ticket seller expects almost no traffic most days but massive spikes for a few hours when big concerts go on sale. It has little cash for equipment.", right: "Cloud",
      why: "Elastic, pay-as-you-go capacity handles spikes without buying hardware that sits idle.",
      not: { "On-premises": "It would have to buy enough servers for the biggest spike, which sit idle most of the time and need cash up front.", "Edge": "The problem is bursty central demand, not processing near sensors or devices." } },
    { s: "An oil company runs pumps in remote desert sites with unreliable satellite internet. Sensors must detect a pressure problem and shut a valve within a fraction of a second.", right: "Edge",
      why: "Local processing gives near-instant reaction and keeps working when the link drops.",
      not: { "On-premises": "Servers at headquarters are far away; every reading would have to cross the unreliable link before any decision.", "Cloud": "Round trips to a data center add delay and fail whenever the satellite link drops." } },
    { s: "A small research lab has a steady, predictable workload, strict rules requiring that it physically controls its machines, and IT staff on site.", right: "On-premises",
      why: "Full control and stable demand favor owned hardware; the lab can staff its upkeep.",
      not: { "Cloud": "Renting from a provider gives up the physical control the rules demand.", "Edge": "There is no need to process data out at many device locations." } },
    { s: "A retail chain wants smart cameras in 300 stores to count shoppers in real time without uploading hours of video over each store's modest internet connection.", right: "Edge",
      why: "Processing video in the store cuts bandwidth and latency; only counts need to travel.",
      not: { "Cloud": "Shipping all raw video to a data center would overwhelm store bandwidth.", "On-premises": "A central server room would still need all the video sent to it." } },
    { s: "A five-person startup expects to grow from 100 to 100,000 users within a year but cannot predict how fast, and wants no hardware to maintain.", right: "Cloud",
      why: "Elastic scaling matches unpredictable growth; the provider maintains hardware.",
      not: { "On-premises": "It would have to guess capacity, buy servers up front and maintain them itself.", "Edge": "The need is central capacity that scales, not processing near devices." } },
    { s: "A manufacturer has run the same payroll and inventory workload for ten years with almost no change, already owns a staffed server room, and wants full control of its data.", right: "On-premises",
      why: "With steady demand, existing hardware and staff, and a control requirement, owned servers can be the most economical choice.",
      not: { "Cloud": "Pay-as-you-go flexibility adds little when demand never changes, and monthly bills never stop.", "Edge": "Nothing here needs to be processed at many remote device locations." } },
    { s: "A city's traffic lights must adjust timing instantly from roadside sensors, even if the central network goes down for a while.", right: "Edge",
      why: "Decisions must be made locally and immediately, and survive network outages.",
      not: { "Cloud": "Sending every reading to a distant data center adds delay and fails during outages.", "On-premises": "A central city server room is still remote from each intersection." } },
    { s: "A seasonal tax-preparation firm needs ten times its normal computing power from February to April and very little the rest of the year.", right: "Cloud",
      why: "Pay only for the busy season; scale back down afterward.",
      not: { "On-premises": "It would own peak-sized hardware that sits idle nine months a year.", "Edge": "The workload is central number-crunching, not device-side processing." } },
  ];
  const ARCHS = ["On-premises", "Edge", "Cloud"];

  const ARCH_CONCEPT = [
    { q: "Which architecture typically has the <b>highest up-front cost</b>?",
      right: "On-premises", rightWhy: "The firm must buy servers, space and power infrastructure before anything runs.",
      wrong: [
        { t: "Cloud", why: "Cloud shifts spending to pay-as-you-go operating costs, with little up front." },
        { t: "Edge", why: "Edge devices cost money, but the classic large capital purchase is an on-site server room." },
      ],
      sol: ["Which option requires buying hardware before use?", "On-premises: capital expense first, then upkeep."] },
    { q: "A company's internet connection fails for a full day. Which architecture's core functions are <b>most</b> at risk?",
      right: "Cloud", rightWhy: "Cloud services are reached over the internet; no link, no access.",
      wrong: [
        { t: "On-premises", why: "Local servers stay reachable on the internal network." },
        { t: "Edge", why: "Edge is designed to keep processing locally during outages." },
      ],
      sol: ["Which option depends on reaching someone else's data center?", "Cloud: provider redundancy cannot help if your own link is down."] },
    { q: "Which architecture scales up and down most <b>quickly</b>?",
      right: "Cloud", rightWhy: "Elastic capacity can be added or released in minutes.",
      wrong: [
        { t: "On-premises", why: "Scaling means ordering and installing hardware, which takes weeks or months." },
        { t: "Edge", why: "Edge scales by adding devices site by site, which is slower than renting capacity." },
      ],
      sol: ["Think about what “adding capacity” physically means for each.", "Cloud just rents more; the others install hardware."] },
    { q: "Which architecture is <b>most efficient</b> for reacting in milliseconds to sensor data while sending little over the network?",
      right: "Edge", rightWhy: "Processing next to the sensor cuts latency and bandwidth.",
      wrong: [
        { t: "Cloud", why: "Every reading would travel to a distant data center and back." },
        { t: "On-premises", why: "A central server room is still a network hop away from field sensors." },
      ],
      sol: ["Where is the data generated?", "Process it right there: edge."] },
    { q: "Who is responsible for replacing failed hardware and keeping systems redundant in an <b>on-premises</b> setup?",
      right: "The organization's own IT staff", rightWhy: "On-premises means the organization owns and maintains everything.",
      wrong: [
        { t: "The cloud provider", why: "No provider is involved in a purely on-premises setup." },
        { t: "Nobody; on-premises hardware does not fail", why: "All hardware fails eventually; someone must plan for it." },
        { t: "The internet service provider", why: "The ISP supplies connectivity, not your servers." },
      ],
      sol: ["Who owns on-premises hardware?", "Whoever owns it maintains it: the organization."] },
    { q: "A firm's workload has been steady for years and is expected to stay that way. Over five years, which statement is most accurate?",
      right: "Owned on-premises servers can end up cheaper than paying cloud bills indefinitely",
      rightWhy: "Without demand swings, cloud elasticity adds little, and monthly bills never stop.",
      wrong: [
        { t: "The cloud is always the cheapest option over any period", why: "Pay-as-you-go can cost more than owning when demand is steady over years." },
        { t: "On-premises has no ongoing costs once bought", why: "Staff, power, maintenance and replacement continue." },
        { t: "Edge computing eliminates all costs", why: "Edge adds many devices to buy and manage." },
      ],
      sol: ["Compare up-front + upkeep against a monthly bill that never ends.", "Steady demand removes cloud's main advantage (elasticity)."] },
  ];

  const IU_BANK = [
    { t: "Upload your Excel assignment and check its submission timestamp", cat: "Canvas", why: "Canvas is IU's learning management system for assignments and submissions." },
    { t: "Find this week's course module and its McGraw-Hill Connect link", cat: "Canvas", why: "course modules and Connect links live in Canvas." },
    { t: "Read an instructor announcement and check assignment due dates", cat: "Canvas", why: "course communication and assignments are in the LMS." },
    { t: "See feedback and grades on a graded assignment", cat: "Canvas", why: "grading and feedback happen in Canvas." },
    { t: "Store your personal course files in the cloud and sync them to File Explorer", cat: "OneDrive", why: "OneDrive is your Microsoft 365 cloud storage." },
    { t: "Open a workbook from your cloud storage on a lab PC without downloading it", cat: "OneDrive", why: "OneDrive maps into File Explorer and opens files in the desktop app." },
    { t: "Recover the latest version of a file after your laptop is stolen", cat: "OneDrive", why: "cloud-stored files survive the loss of a device." },
    { t: "Give your instructor view permission on one of your own files", cat: "OneDrive", why: "OneDrive lets you share files by granting access." },
    { t: "A student organization's team site with a shared document library", cat: "SharePoint", why: "SharePoint provides Microsoft 365 team sites for collaboration." },
    { t: "A department's shared policy documents with group permissions", cat: "SharePoint", why: "shared libraries with permissions for a group are SharePoint's role." },
    { t: "A project team's central site where everyone edits the same documents", cat: "SharePoint", why: "team collaboration space is SharePoint." },
    { t: "A shared site where a club posts meeting minutes for all its members", cat: "SharePoint", why: "group document libraries live in SharePoint." },
    { t: "Run Windows lab software from a Chromebook in a web browser", cat: "IUanyWare", why: "IUanyWare delivers IU computing to nearly any device through a browser." },
    { t: "Log in remotely to a Bloomington STC lab computer", cat: "IUanyWare", why: "that is the STC Desktop option of IUanyWare." },
    { t: "Use a virtual desktop (VDI) at 3 a.m. as an IU staff member", cat: "IUanyWare", why: "IUanyWare Desktop is open to all IU users at any time." },
    { t: "Open a single Windows app from a Mac without installing it", cat: "IUanyWare", why: "IUanyWare offers individual apps as well as full desktops." },
    { t: "Approve a push on your phone after entering your passphrase", cat: "Duo", why: "Duo provides IU's multi-factor authentication." },
    { t: "Type a code from a token after your passphrase to sign in", cat: "Duo", why: "the token is the “something you have” factor in Duo." },
    { t: "Prove it's really you, not someone who stole your passphrase", cat: "Duo", why: "the second factor blocks someone with just your passphrase." },
    { t: "Add a second factor so a phished passphrase alone cannot unlock your account", cat: "Duo", why: "that is the purpose of multi-factor authentication." },
  ];
  const IU_CATS = ["Canvas", "OneDrive", "SharePoint", "IUanyWare", "Duo"];
  const IU_DEFS = { Canvas: "learning management system: courses, assignments, submissions", OneDrive: "your Microsoft 365 cloud file storage", SharePoint: "Microsoft 365 team sites and shared libraries", IUanyWare: "IU computing in a browser (STC Desktop or IUanyWare Desktop/VDI)", Duo: "multi-factor authentication" };

  const FACTOR_BANK = [
    { t: "Your IU passphrase", cat: "Something you know", why: "it is memorized knowledge." },
    { t: "A PIN you memorized", cat: "Something you know", why: "a remembered secret." },
    { t: "The answer to a security question", cat: "Something you know", why: "knowledge, even if it is weak." },
    { t: "A pattern you trace to unlock a screen", cat: "Something you know", why: "it is a remembered secret." },
    { t: "A Duo push sent to your registered phone", cat: "Something you have", why: "it proves you hold the phone." },
    { t: "A six-digit code displayed on a hardware token", cat: "Something you have", why: "only the token holder sees the code." },
    { t: "A one-time passcode generated by an app on your phone", cat: "Something you have", why: "it proves possession of that device." },
    { t: "A code texted to your registered mobile number", cat: "Something you have", why: "receiving it proves you have the phone." },
  ];

  const IU_CONCEPT = [
    { q: "While setting up OneDrive on an STC lab computer, the “back up folders on this PC” screen shows an IT-administrator warning and red Documents, Pictures and Desktop folders. What should the student do?",
      right: "Recognize this as normal on a managed device and click Next",
      rightWhy: "STC computers are managed by central policies, so these warnings are expected.",
      wrong: [
        { t: "Stop and report a virus to the help desk", why: "The warning reflects device-management policy, not malware." },
        { t: "Try to change the administrator settings to turn the folders green", why: "Policies on managed devices are set centrally; students should not try to override them." },
        { t: "Give up on OneDrive and save everything to the lab computer's desktop", why: "Local lab storage is the riskier option; OneDrive works fine after clicking Next." },
      ],
      sol: ["What kind of device is an STC computer?", "Managed devices show policy warnings like this; it is expected, so continue."] },
    { q: "Which of these is the best example of an <b>enterprise system</b>?",
      right: "A university-wide financial and timekeeping system used by every department",
      rightWhy: "It is a large platform supporting the entire organization.",
      wrong: [
        { t: "A spreadsheet one professor uses to track office hours", why: "A personal file supports one person, not the organization." },
        { t: "A calculator app on a student's phone", why: "Single-user software, not an organization-wide platform." },
        { t: "A USB drive with a club's photos", why: "That is storage media, not an enterprise software platform." },
      ],
      sol: ["Enterprise = supports the whole organization.", "Look for the platform every department depends on."] },
    { q: "A student wants to paste a spreadsheet of classmates' grades into an online AI tool to “find patterns.” What should she do first?",
      right: "Pause and check IU's data classification rules for that data before using any AI tool",
      rightWhy: "Data classification limits how data may be used, including with AI tools.",
      wrong: [
        { t: "Go ahead; data in an AI tool is automatically private", why: "There is no such guarantee; classification governs what is allowed." },
        { t: "Go ahead as long as she uses her own laptop", why: "The device does not change the data's classification or permitted uses." },
        { t: "Email the spreadsheet to a friend to run it instead", why: "Sharing the data more widely makes the problem worse." },
      ],
      sol: ["Who decides how sensitive data may be used?", "Check IU's data classification before putting data into AI tools."] },
    { q: "IU's data classification levels from <b>least</b> to <b>most</b> sensitive are:",
      right: "Public → University-Internal → Restricted → Critical",
      rightWhy: "Sensitivity, and the limits on use, increase in that order.",
      wrong: [
        { t: "Critical → Restricted → University-Internal → Public", why: "That runs from most to least sensitive." },
        { t: "Public → Restricted → University-Internal → Critical", why: "University-Internal is less sensitive than Restricted." },
        { t: "University-Internal → Public → Critical → Restricted", why: "Public is the least sensitive; Critical is the most." },
      ],
      sol: ["Start from data anyone may see.", "Public, then internal to IU, then Restricted, and Critical at the top."] },
    { q: "Why do IU systems such as Canvas and Microsoft 365 work the same way at every campus?",
      right: "They are enterprise systems serving the whole university",
      rightWhy: "Enterprise systems are organization-wide, not campus-specific.",
      wrong: [
        { t: "Because each campus installs its own copy on lab computers", why: "They are central platforms, not local installs." },
        { t: "Because they only run on managed devices", why: "You can use them from personal devices too." },
        { t: "Because they store everything in RAM", why: "Storage type has nothing to do with being organization-wide." },
      ],
      sol: ["What does “enterprise” mean?", "One platform for the whole organization behaves the same everywhere."] },
  ];

  const IU_TF = [
    { s: "IUanyWare Desktop (VDI) is available to all IU users at any time.", truth: true, why: "VDI access is not limited by course or time of day.", hint: "Which IUanyWare option has no time limits?" },
    { s: "STC Desktop is available to every student, including non-K201 students, at any hour.", truth: false, why: "Non-K201/K204 students can use STC Desktop only in evenings and on weekends.", hint: "Recall who gets STC Desktop during the day." },
    { s: "Entering your passphrase and then answering a security question is multi-factor authentication.", truth: false, why: "Both are “something you know”, a single factor type. Duo adds “something you have.”", hint: "Count the factor types, not the steps." },
    { s: "A managed device's software and operating system are governed by policies from a central service.", truth: true, why: "That is the definition of a managed device, like an STC lab PC.", hint: "Who controls an STC computer's settings?" },
    { s: "SharePoint is IU's learning management system for submitting assignments.", truth: false, why: "That is Canvas. SharePoint provides team sites and shared document libraries.", hint: "Where do you submit assignments?" },
    { s: "A digital ecosystem is the interconnected network of users, hardware and software.", truth: true, why: "That is the chapter's definition.", hint: "Ecosystem = everything connected." },
  ];

  const SHARE_BANK = [
    { t: "Emailing a workbook to your project team", cat: "Attachment (copy)", why: "email sends a copy of the file." },
    { t: "Sending a file in a Canvas message", cat: "Attachment (copy)", why: "the recipient receives a copy." },
    { t: "Dropping a file into a Teams chat as an attachment", cat: "Attachment (copy)", why: "the attachment is a separate copy." },
    { t: "Zipping a macro-enabled workbook so it can be emailed", cat: "Attachment (copy)", why: "compressing is often needed to attach large or macro files." },
    { t: "Teammates each edit their own version and you merge changes by hand", cat: "Attachment (copy)", why: "multiple copies must be merged manually." },
    { t: "Setting edit permission on your OneDrive file for a teammate", cat: "Granting access", why: "permissions are set on the original file." },
    { t: "Giving your instructor view-only permission on a folder", cat: "Granting access", why: "access is granted on the original folder." },
    { t: "Everyone sees the most current version and nothing needs merging", cat: "Granting access", why: "only one original file exists." },
    { t: "Choosing whether others can view, edit, download or delete", cat: "Granting access", why: "those are permission levels on the original." },
    { t: "Uploading a file to a shared library and adding the team as editors", cat: "Granting access", why: "the team works on the one uploaded original." },
  ];

  const INCIDENT_BANK = [
    { q: "Ravi kept his only copy of a term project on his laptop's local drive. The laptop is stolen. What is the likely outcome?",
      right: "The project is permanently lost, because there was no copy anywhere else",
      rightWhy: "Local-only files disappear with the device.",
      wrong: [
        { t: "He can recover it from OneDrive automatically", why: "Only files actually stored or synced to OneDrive can be recovered there." },
        { t: "He can recover it by rebooting a lab computer", why: "Rebooting clears RAM; it cannot retrieve files from another machine." },
        { t: "Canvas keeps a copy of every file on students' laptops", why: "Canvas only has files you submit to it." },
      ],
      sol: ["Where was the only copy stored?", "Local only + device gone = file gone. Cloud storage or a backup would have saved it."] },
    { q: "Ana is on a flight with no Wi-Fi and needs to edit a file that exists only in her web-only cloud storage. What is the problem?",
      right: "Cloud/remote files need an internet connection to reach",
      rightWhy: "Remote storage's main drawback is dependence on connectivity.",
      wrong: [
        { t: "Cloud files are deleted when you are offline", why: "They are still there; she just cannot reach them." },
        { t: "Cloud files can only be opened on lab computers", why: "They can be opened from many devices, when online." },
        { t: "There is no problem; cloud files are always on every device", why: "Unless synced locally, they need internet access." },
      ],
      sol: ["Trade-off of remote storage: what does it require?", "No connection, no access."] },
    { q: "A team's shared OneDrive folder is accidentally overwritten with an empty version, and the change syncs to everyone's computer. What would have protected them best?",
      right: "A separate immutable backup copy, such as on physical media, that syncing cannot change",
      rightWhy: "A true backup is unchangeable; a synced repository spreads the damage.",
      wrong: [
        { t: "Keeping the folder in OneDrive, since OneDrive is a backup", why: "OneDrive is a georedundant repository; the overwrite synced everywhere." },
        { t: "Emailing the folder to themselves after the overwrite", why: "That would only copy the damaged version." },
        { t: "Rebooting each computer", why: "Rebooting clears RAM; it does not restore files." },
      ],
      sol: ["What separates a repository from a true backup?", "Only an immutable copy survives a change that syncs everywhere."] },
    { q: "Marcus opened a OneDrive workbook through File Explorer on an STC computer, edited it in Excel and saved. The web version shows the old content for a few seconds. What is happening?",
      right: "Saving back to the cloud can lag slightly; the change will sync",
      rightWhy: "Files opened from File Explorer save to OneDrive with a short delay.",
      wrong: [
        { t: "His changes are lost because he did not download the file first", why: "Opening from File Explorer needs no download or re-upload." },
        { t: "He edited a local copy that will never reach OneDrive", why: "The mapped OneDrive file is the cloud file." },
        { t: "The managed device blocks saving to OneDrive", why: "Managed devices allow OneDrive; the warning screens are normal." },
      ],
      sol: ["How does editing a mapped OneDrive file work?", "It opens in the desktop app and saves back to the cloud, sometimes with a short lag."] },
    { q: "Two files in File Explorer look identical: one is on the laptop's drive and one is in OneDrive. How can Priya tell which is which?",
      right: "Check the file's path or location",
      rightWhy: "Local and remote files can look the same; the path reveals where each lives.",
      wrong: [
        { t: "Local files always have a different icon color", why: "They can look alike; the chapter warns it is hard to tell without the path." },
        { t: "Open both; cloud files open in a browser only", why: "OneDrive files open in the full desktop app from File Explorer." },
        { t: "Cloud files are always larger", why: "File size does not indicate location." },
      ],
      sol: ["What piece of information tells you where a file lives?", "Its path."] },
  ];

  const VERIFY_GOOD = [
    "Submit from the assignment's own page in Canvas",
    "Confirm the file type matches what the assignment requires",
    "Look for the submission confirmation and its timestamp",
    "Open or download the submitted file from Canvas to check it is the right file and version",
    "Check that the submitted file opens without errors",
  ];
  const VERIFY_BAD = [
    { t: "Assume it worked because you clicked Submit", why: "Clicking Submit does not prove the right file arrived." },
    { t: "Check that the file is still in your OneDrive", why: "That shows your copy exists, not what Canvas received." },
    { t: "Email the file to a classmate so they can compare", why: "Sharing files between students is not permitted, and it verifies nothing." },
    { t: "Rename the file on your computer after uploading", why: "Changes to your copy after upload do not affect the submission." },
    { t: "Close the browser right away so the upload is saved", why: "Closing the browser does not confirm anything." },
    { t: "Send the file to the instructor by email instead of Canvas", why: "Submissions belong on the assignment page, not email." },
  ];

  const FILE_TF = [
    { s: "OneDrive is a true backup because it stores files in georedundant data centers.", truth: false, why: "It is a file repository; a true backup is an immutable copy that changes cannot reach.", hint: "What makes a backup a backup?" },
    { s: "When you share a file as an attachment, recipients edit a copy, not your original.", truth: true, why: "Attachments are copies; you must merge changes back yourself.", hint: "What actually travels in an email?" },
    { s: "Granting access means each person gets their own copy to edit.", truth: false, why: "Granting access sets permissions on one original, so everyone sees the current version.", hint: "How many files exist after granting access?" },
    { s: "Folders can contain other folders, and folders can have their own permissions.", truth: true, why: "Nesting and permissions are basic features of folders.", hint: "Think of shelves in a bookcase." },
    { s: "Seeing a submission timestamp in Canvas proves you uploaded the correct version of your file.", truth: false, why: "The timestamp shows something was submitted; open the submitted file to confirm it is the right one.", hint: "What does a timestamp not tell you?" },
    { s: "Opening a OneDrive file from File Explorer opens it in the full desktop app without downloading and re-uploading.", truth: true, why: "Mapped OneDrive files open directly in the desktop app.", hint: "Recall how OneDrive appears in File Explorer." },
  ];

  /* ============================================================
   * GENERATORS
   * ============================================================ */

  /* ---- Topic 1: data vs. information; quantitative vs. qualitative ---- */
  const PRODUCTS = [
    ["Latte", 5], ["Cold brew", 4], ["Bagel", 3], ["Muffin", 3], ["Smoothie", 6], ["Chai", 4], ["Sandwich", 8], ["Cookie", 2],
  ];
  function salesTable() {
    const n = U.randInt(5, 7);
    const prods = U.sample(PRODUCTS, 4);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const [p, price] = U.pick(prods);
      rows.push({ id: 1000 + i * U.randInt(1, 3) + i, p, price, qty: U.randInt(1, 5) });
    }
    const html = `<table class="tbl"><thead><tr><th>Order</th><th>Item</th><th>Unit price</th><th>Qty</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.id}</td><td>${r.p}</td><td>${U.money(r.price)}</td><td>${r.qty}</td></tr>`).join("")}</tbody></table>`;
    return { rows, html };
  }

  const t1 = STUDY.makeGenerator({
    id: "k201-ch2-datainfo",
    name: "Data vs. information; quantitative vs. qualitative",
    blurb: "Tell raw data from decision-ready information, sort data by type, and compute revenue and volume.",
    variants: [
      ...rename(K.sortVariants({ key: "ch2-qq", bank: QQ_BANK, cats: ["Quantitative", "Qualitative"], defs: QQ_DEFS, ask: "piece of data",
        hint: "Ask: is this an amount you could add or average (how much / how many), or a description, opinion or image?" }).filter(v => !["Name the category", "Pick the example"].includes(v.name)), "quant/qual"),
      {
        name: "Compute revenue from a sales table",
        make() {
          const { rows, html } = salesTable();
          const ans = rows.reduce((a, r) => a + r.price * r.qty, 0);
          const units = rows.reduce((a, r) => a + r.qty, 0);
          const prices = rows.reduce((a, r) => a + r.price, 0);
          return Q.num({
            q: `<p>A campus café exported these orders for Monday:</p>${html}<p>What was Monday's <b>revenue</b>?</p>`,
            answer: ans, unit: "$",
            traps: cleanTraps(ans, [
              { value: units, why: "That is the number of units sold (a volume), not dollars." },
              { value: rows.length, why: "That counts orders; revenue totals the sales dollars." },
              { value: prices, why: "You added unit prices without multiplying by quantity." },
            ]),
            sol: S("Revenue is the dollar total of all sales in the period, so each row contributes price × quantity.",
              `Row by row: ${rows.map(r => `${U.money(r.price)} × ${r.qty}`).join(" + ")} = <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Count a volume from a sales table",
        make() {
          const { rows, html } = salesTable();
          const mode = U.pick(["qty", "item"]);
          let cond, test, desc;
          if (mode === "qty") {
            const k = U.randInt(2, 4);
            cond = `orders with a quantity of <b>${k} or more</b>`; test = r => r.qty >= k; desc = `quantity ≥ ${k}`;
          } else {
            const p = U.pick(rows).p;
            cond = `orders for <b>${p}</b>`; test = r => r.p === p; desc = `item = ${p}`;
          }
          const ans = rows.filter(test).length;
          const unitsMatching = rows.filter(test).reduce((a, r) => a + r.qty, 0);
          return Q.num({
            q: `<p>Here are a food stand's orders for one afternoon:</p>${html}<p>What is the <b>volume</b> of ${cond}? (Count the orders that meet the condition.)</p>`,
            answer: ans, kind: "count",
            traps: cleanTraps(ans, [
              { value: rows.length, why: "That is every order; volume counts only those meeting the condition." },
              { value: unitsMatching, why: "You added up quantities; the question counts orders that meet the condition." },
            ]),
            sol: S("Volume is a count of items that meet a criterion, not a dollar amount.",
              `Mark each order where ${desc}: ${rows.filter(test).map(r => r.id).join(", ") || "none"}. That is <b>${ans}</b>.`),
          });
        },
      },
      K.conceptVariant("Data or information for this decision?", "ch2-di", DI_CONCEPT),
      K.tfVariant("True or false: data, information, bits", "ch2-di-tf", DI_TF),
      {
        name: "Data or information? (scenario sort)",
        make() {
          const BANK = [
            { t: "A log of every badge swipe at the gym's front door", cat: "Data", why: "raw records with no summary or context." },
            { t: "A table of 12,000 website visit timestamps", cat: "Data", why: "unprocessed rows." },
            { t: "Each cash register's list of item codes scanned today", cat: "Data", why: "raw transaction records." },
            { t: "Thousands of temperature readings from a warehouse sensor", cat: "Data", why: "raw measurements, not yet interpreted." },
            { t: "A chart showing the warehouse got too hot on 3 of 30 days, all in the afternoon", cat: "Information", why: "processed and in context, so a manager can act." },
            { t: "A dashboard ranking stores by weekly sales growth", cat: "Information", why: "organized to support a decision." },
            { t: "A summary showing 70% of website visits come from phones", cat: "Information", why: "processed into a pattern that informs design decisions." },
            { t: "A report that peak gym check-ins are 5–7 p.m. on weekdays", cat: "Information", why: "summarized for a staffing decision." },
          ];
          const items = [...U.sample(BANK.filter(b => b.cat === "Data"), 2), ...U.sample(BANK.filter(b => b.cat === "Information"), 2), U.pick(BANK.filter((b, i) => i % 3 === 0))];
          const uniq = [...new Set(items)];
          return Q.classify({
            q: "<p>Classify each as raw <b>data</b> or decision-ready <b>information</b>.</p>", cats: ["Data", "Information"],
            items: uniq, sol: S("Ask: could a manager make a decision from this as it stands, or must it still be processed?", "Raw logs, readings and lists are data; summaries, rankings and patterns in context are information."),
          });
        },
      },
    ],
  });

  /* ---- Topic 2: collection methods, costs and trade-offs ---- */
  const t2 = STUDY.makeGenerator({
    id: "k201-ch2-collect",
    name: "Collecting data: methods, costs and trade-offs",
    blurb: "Match collection methods to needs, name the costs of data, and decide what is “just enough.”",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Pick the example", "Name the category"])(K.sortVariants({ key: "ch2-cost", bank: COST_BANK, cats: ["Storage", "Processing", "Breach / leak risk"], defs: COST_DEFS, ask: "cost",
        hint: "Is this about paying to keep data, working to make it usable, or what happens if it escapes?" })), "costs of data"),
      {
        name: "Choose the fields worth collecting",
        make() {
          const sc = U.rotate("ch2-fields", FIELD_SCEN);
          const good = sc.fields.filter(f => f.ok), bad = sc.fields.filter(f => !f.ok);
          const k = U.randInt(1, 3);
          const opts = [...U.sample(good, k), ...U.sample(bad, U.randInt(2, 3))].map(f => ({ t: f.t, ok: f.ok, why: (f.ok ? "Worth collecting: " : "Skip it: ") + f.why }));
          return Q.multi({
            q: `<p>${sc.goal}</p><p>Applying “define the question first, collect just enough,” select <b>every</b> field worth collecting.</p>`,
            options: opts,
            sol: S("Start from the decision. A field earns its place only if it helps answer that question.", "Tick fields that directly inform the decision; skip personal or unrelated data that adds cost and breach risk without value."),
          });
        },
      },
      {
        name: "Which collection method fits?",
        make() {
          const e = U.rotate("ch2-tool", TOOL_BANK);
          const wrong = U.sample(TOOL_BANK.filter(x => x.tool !== e.tool), 3).map(x => ({ t: x.tool, why: `${x.why} That is not what this need calls for.` }));
          return Q.mc({
            q: `<p>A business needs data on <b>${e.need}</b>. Which collection method fits best?</p>`,
            right: e.tool, rightWhy: e.why, wrong,
            sol: S("Think about what each method naturally captures: behavior online, combined customer touchpoints, group reactions, ratings at scale, transactions, public opinion, detailed explanations.", `${e.tool}: ${e.why}`),
          });
        },
      },
      K.conceptVariant("Respond to a data-collection proposal", "ch2-collect", COLLECT_CONCEPT),
      {
        name: "Compute the cost of “just in case” data",
        make() {
          const a = U.pick([40, 50, 60, 80, 90, 120]);
          const b = U.pick([5, 10, 15, 20, 25]);
          const p = U.pick([0.02, 0.03, 0.05]);
          const days = 30;
          const ans = U.round((a - b) * days * p, 2);
          const who = U.pick(["A delivery company's truck sensors", "A chain of smart vending machines", "A streaming app's event tracker", "A warehouse's RFID readers"]);
          return Q.num({
            q: `<p>${who} can either log <b>everything</b> (${a} GB of new data per day) or only the fields needed for the defined questions (${b} GB per day). Storage is billed at <b>${U.money(p, 2)} per GB per month</b>.</p><p>After ${days} days of logging, how much <b>more</b> per month does the “everything” plan cost to store than the “just enough” plan?</p>`,
            answer: ans, unit: "$",
            traps: cleanTraps(ans, [
              { value: U.round(a * days * p, 2), why: "That is the full cost of the “everything” plan; the question asks for the difference." },
              { value: U.round((a - b) * p, 2), why: `That is only one day's extra data; ${days} days of data accumulate.` },
              { value: U.round(b * days * p, 2), why: "That is what the “just enough” plan costs, not the extra." },
            ]),
            sol: S("Find the extra data the “everything” plan stores, then price it. And remember storage is only one of the costs; cleaning and breach risk grow too.",
              `Extra per day: ${a} − ${b} = ${a - b} GB. Over ${days} days: ${(a - b) * days} GB. Cost: ${(a - b) * days} × ${U.money(p, 2)} = <b>${U.money(ans, 2)}</b> more per month (and it keeps growing).`),
          });
        },
      },
    ],
  });

  /* ---- Topic 3: storage and data shape ---- */
  const t3 = STUDY.makeGenerator({
    id: "k201-ch2-storage",
    name: "Storage and data shape",
    blurb: "Volatile vs. non-volatile storage, structured vs. unstructured data, and how unstructured data is mined.",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Name the category"])(K.sortVariants({ key: "ch2-vol", bank: VOL_BANK, cats: ["Volatile", "Non-volatile"], defs: VOL_DEFS, ask: "item",
        hint: "Ask: would this survive if the power were cut right now?" })), "volatile?"),
      ...rename(pickNames(["Sort (drop-down)", "Which is NOT…", "Select all that apply"])(K.sortVariants({ key: "ch2-su", bank: SU_BANK, cats: ["Structured", "Unstructured"], defs: SU_DEFS, ask: "data set",
        hint: "Ask: does this fit neatly into rows and named columns of consistent types?" })), "structured?"),
      K.conceptVariant("Predict what survives (RAM, kernel, reboot)", "ch2-storage", STORAGE_CONCEPT),
      {
        name: "Count the unstructured data sets",
        make() {
          const n = 6;
          const k = U.randInt(1, 5);
          const items = U.shuffle([...U.sample(SU_BANK.filter(b => b.cat === "Unstructured"), k), ...U.sample(SU_BANK.filter(b => b.cat === "Structured"), n - k)]);
          return Q.num({
            q: `<p>A company inventories its data. How many of these ${n} data sets are <b>unstructured</b>?</p>${ul(items.map(i => i.t))}`,
            answer: k, kind: "count",
            traps: cleanTraps(k, [
              { value: n - k, why: "That is the number of structured data sets." },
              { value: n, why: "Not everything stored digitally is unstructured; tables with named columns are structured." },
            ]),
            sol: S("Unstructured = no fixed rows/columns: audio, video, images, free text, posts.",
              ul(items.map(i => `${i.t}: <b>${i.cat}</b> (${i.why})`)) + `Total unstructured: <b>${k}</b>.`),
          });
        },
      },
      {
        name: "Choose the analysis technique",
        make() {
          const e = U.rotate("ch2-tech", TECH_BANK);
          return Q.mc({
            q: `<p>An analyst wants to <b>${e.task.charAt(0).toLowerCase() + e.task.slice(1)}</b>. Which technique fits best?</p>`,
            right: e.right, rightWhy: e.why,
            wrong: TECHS.filter(t => t !== e.right).map(t => ({ t, why: TECH_WHY[t] })),
            keepOrder: TECHS,
            sol: S("Are the categories known in advance (classification) or discovered (clustering)? Is the goal tone (sentiment) or meaning and relationships (NLP)?", `${e.right}: ${e.why}`),
          });
        },
      },
    ],
  });

  /* ---- Topic 4: AI ---- */
  const t4 = STUDY.makeGenerator({
    id: "k201-ch2-ai",
    name: "AI types, machine learning and neural networks",
    blurb: "Tell summative, generative and agentic AI apart and explain how models learn from data.",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Pick the example", "Which is NOT…", "Name the category"])(K.sortVariants({ key: "ch2-ai", bank: AI_BANK, cats: ["Summative AI", "Generative AI", "Agentic AI"], defs: AI_DEFS, ask: "AI use",
        hint: "Does the tool condense existing content, create new content, or plan and act toward a goal on its own?" })), "AI types"),
      {
        name: "Rule-based or learned?",
        make() {
          const items = [...U.sample(RULE_BANK.filter(b => b.cat === RULE_BANK[0].cat), 2), ...U.sample(RULE_BANK.filter(b => b.cat !== RULE_BANK[0].cat), 2)];
          const extra = U.pick(RULE_BANK.filter(b => !items.includes(b)));
          return Q.classify({
            q: "<p>Which of these behaviors come from an <b>explicit, hand-written rule</b>, and which were most likely <b>learned from training data</b> by a machine-learning model?</p>",
            cats: ["Explicit rule (programmed)", "Learned from training data"],
            items: U.shuffle([...items, extra]),
            sol: S("Could a person write the exact rule as a short if-then statement? If so, it is programmed.", `Definitions:${ul(Object.entries(RULE_DEFS).map(([k, v]) => `<b>${k}</b>: ${v}`))}`),
          });
        },
      },
      K.conceptVariant("Explain how machine learning behaves", "ch2-ai", AI_CONCEPT),
      K.tfVariant("True or false: AI and neural networks", "ch2-ai-tf", AI_TF),
    ],
  });

  /* ---- Topic 5: on-premises vs. edge vs. cloud ---- */
  function archSvg(type) {
    const box = (x, y, w, h, lines, hot) => {
      const r = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="currentColor" stroke-width="${hot ? 3.5 : 1.2}"/>`;
      const t = lines.map((l, i) => `<text x="${x + w / 2}" y="${y + 22 + i * 16}" text-anchor="middle" font-size="12" fill="currentColor">${l}</text>`).join("");
      const hotLabel = hot ? `<text x="${x + w / 2}" y="${y + h - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">★ processing</text>` : "";
      return r + t + hotLabel;
    };
    const link = (x1, x2, dashed, label) => `<line x1="${x1}" y1="85" x2="${x2}" y2="85" stroke="currentColor" stroke-width="1.5"${dashed ? ' stroke-dasharray="6 4"' : ""}/>` +
      `<polygon points="${x2},85 ${x2 - 8},80 ${x2 - 8},90" fill="currentColor"/>` +
      (label ? `<text x="${(x1 + x2) / 2}" y="75" text-anchor="middle" font-size="11" fill="currentColor">${label}</text>` : "");
    const D = {
      "On-premises": [
        box(10, 40, 150, 90, ["Cash registers", "and staff PCs"], false), link(160, 200, false, "office LAN"),
        box(200, 30, 170, 110, ["Server room in the", "company's own building", "(bought, run by its IT)"], true),
        link(370, 400, true, "internet"), box(400, 40, 110, 90, ["Outside world", "(email, web)"], false),
      ],
      "Edge": [
        box(10, 40, 150, 90, ["Cameras and sensors", "on the shop floor"], false), link(160, 200, false, "local"),
        box(200, 30, 170, 110, ["Small computer", "next to the machines"], true),
        link(370, 400, true, "summaries"), box(400, 40, 110, 90, ["Remote data", "center"], false),
      ],
      "Cloud": [
        box(10, 40, 150, 90, ["Laptops and phones", "anywhere"], false), link(160, 200, true, "internet"),
        box(200, 40, 110, 90, ["Internet", "connection"], false), link(310, 340, true, ""),
        box(340, 30, 170, 110, ["Rented servers in a", "provider's data center", "(billed monthly)"], true),
      ],
    };
    return `<svg viewBox="0 0 520 170" style="max-width:100%;height:auto" role="img" aria-label="architecture diagram">${D[type].join("")}<text x="10" y="162" font-size="11" fill="currentColor">Dashed line = internet link. ★ = where the data is processed.</text></svg>`;
  }
  const OUTAGE = {
    "On-premises": { right: "Internal systems keep running on the company's own servers; only outside connections (web, email) are cut", why: "Processing happens on owned servers reachable over the local network." },
    "Edge": { right: "Local processing keeps working; the summaries simply upload once the link returns", why: "Edge is designed to work through intermittent connectivity." },
    "Cloud": { right: "Users cannot reach the applications or data until the connection returns", why: "Everything runs in the provider's data center, reached only over the internet." },
  };

  const t5 = STUDY.makeGenerator({
    id: "k201-ch2-arch",
    name: "On-premises vs. edge vs. cloud",
    blurb: "Compare architectures on efficiency, cost, reliability and scalability, and recommend one for a scenario.",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Which is NOT…", "Select all that apply"])(K.sortVariants({ key: "ch2-arch", bank: ARCH_BANK, cats: ARCHS, defs: ARCH_DEFS, ask: "feature",
        hint: "Ask who owns the hardware and where the processing happens: the firm's own site, near the data source, or a provider's data center?" })), "features"),
      {
        name: "Recommend an architecture",
        make() {
          const sc = U.rotate("ch2-archscen", ARCH_SCEN);
          return Q.mc({
            q: `<p>${sc.s}</p><p>Which architecture would you recommend?</p>`,
            right: sc.right, rightWhy: sc.why,
            wrong: ARCHS.filter(a => a !== sc.right).map(a => ({ t: a, why: sc.not[a] })),
            keepOrder: ARCHS,
            sol: S("Identify the deciding factor: cost pattern (up-front vs. pay-as-you-go), need to scale, latency/connectivity, or control.", `<b>${sc.right}</b>: ${sc.why}`),
          });
        },
      },
      {
        name: "Read an architecture diagram",
        make() {
          const type = U.pick(ARCHS);
          const svg = archSvg(type);
          if (U.randInt(0, 1) === 0) {
            return Q.mc({
              q: `<p>Study the diagram.</p>${svg}<p>Which architecture does it show?</p>`,
              right: type, rightWhy: ARCH_DEFS[type] + ".",
              wrong: ARCHS.filter(a => a !== type).map(a => ({ t: a, why: `In ${a} architecture ${ARCH_DEFS[a]}, which is not where the ★ sits here.` })),
              keepOrder: ARCHS,
              sol: S("Find the ★: where is the data processed, and who owns that hardware?", `Processing happens in the starred box, so this is <b>${type}</b>: ${ARCH_DEFS[type]}.`),
            });
          }
          const o = OUTAGE[type];
          return Q.mc({
            q: `<p>Study the diagram.</p>${svg}<p>The dashed internet link fails for an afternoon. What happens?</p>`,
            right: o.right, rightWhy: o.why,
            wrong: ARCHS.filter(a => a !== type).map(a => ({ t: OUTAGE[a].right, why: `That describes ${a}, where ${OUTAGE[a].why.charAt(0).toLowerCase() + OUTAGE[a].why.slice(1)} Look at where the ★ is in this diagram.` }))
              .concat([{ t: "Nothing changes, because no part of this design ever uses the internet", why: "The dashed line shows an internet link the design depends on in some way." }]),
            sol: S("Locate the ★ and ask: is the processing on this side of the dashed link or the far side?", `This is <b>${type}</b>. ${o.why}`),
          });
        },
      },
      {
        name: "Find the cost break-even point",
        make() {
          let upfront, m, c, ans;
          do {
            upfront = U.pick([12000, 18000, 24000, 30000, 36000]);
            m = U.pick([200, 300, 400, 500]);
            c = m + U.pick([600, 800, 1000, 1200, 1500]);
            ans = Math.ceil(upfront / (c - m));
          } while (ans < 4 || ans > 60);
          const firm = U.pick(["A regional law office", "A family-owned distributor", "A mid-size clinic", "A credit union branch network"]);
          return Q.num({
            q: `<p>${firm} has a steady workload. Option A, <b>on-premises</b>: buy servers for ${U.money(upfront)} up front, then ${U.money(m)} per month for power and upkeep. Option B, <b>cloud</b>: no up-front cost, ${U.money(c)} per month.</p><p>After how many whole months is the <b>total</b> cost of on-premises first <b>no more than</b> the total cost of cloud?</p>`,
            answer: ans, kind: "count",
            traps: cleanTraps(ans, [
              { value: Math.ceil(upfront / c), why: "You ignored on-premises' own monthly upkeep; compare the monthly difference." },
              { value: Math.floor(upfront / (c - m)), why: "Rounded down: at that month on-premises is still slightly more expensive." },
              { value: Math.ceil(upfront / m), why: "Divide the up-front cost by the monthly <em>saving</em> (cloud minus upkeep), not by the upkeep." },
            ]),
            sol: S("On-premises costs more at first but saves money every month. How long until the savings repay the up-front purchase?",
              `Monthly saving = ${U.money(c)} − ${U.money(m)} = ${U.money(c - m)}. Months needed = ${U.money(upfront)} ÷ ${U.money(c - m)} = ${U.round(upfront / (c - m), 2)} → <b>${ans}</b> whole months. With a steady workload over several years, owning can win; with spiky or uncertain demand, cloud flexibility may matter more.`),
          });
        },
      },
      K.conceptVariant("Compare on one dimension", "ch2-arch", ARCH_CONCEPT),
    ],
  });

  /* ---- Topic 6: IU enterprise systems ---- */
  const PEOPLE = [
    { who: "a K201 student", k: "k201" }, { who: "a K204 student", k: "k201" },
    { who: "a biology major not taking K201 or K204", k: "student" }, { who: "a first-year music student not in K201 or K204", k: "student" },
    { who: "an IU staff member in the registrar's office", k: "staff" }, { who: "a faculty member", k: "staff" },
  ];
  const TIMES = [
    { t: "on a Wednesday at 10 a.m.", day: true }, { t: "on a Thursday at 2 p.m.", day: true },
    { t: "on a Tuesday at 9 p.m.", day: false }, { t: "on a Saturday afternoon", day: false }, { t: "on a Sunday morning", day: false },
  ];
  const IUA_OPTS = ["Both STC Desktop and IUanyWare Desktop (VDI)", "Only STC Desktop", "Only IUanyWare Desktop (VDI)", "Neither option"];

  const t6 = STUDY.makeGenerator({
    id: "k201-ch2-iusys",
    name: "IU enterprise systems",
    blurb: "Pick the right IU system, decide which IUanyWare option is available, and apply Duo and data classification.",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Pick the example", "Name the category"])(K.sortVariants({ key: "ch2-iu", bank: IU_BANK, cats: IU_CATS, defs: IU_DEFS, ask: "task",
        hint: "Is the task about a course, your own files, a team space, running Windows software remotely, or proving your identity?" })), "which system"),
      {
        name: "Which IUanyWare option is available?",
        make() {
          const p = U.pick(PEOPLE), tm = U.pick(TIMES);
          const stc = p.k === "k201" || (p.k === "student" && !tm.day);
          const right = stc ? IUA_OPTS[0] : IUA_OPTS[2];
          const name = U.pick(NAMES);
          const reason = p.k === "k201" ? "K201/K204 students may use STC Desktop during the day as well as evenings and weekends, and VDI is open to everyone."
            : p.k === "staff" ? "STC Desktop is for students; IUanyWare Desktop (VDI) is open to all IU users at any time."
              : tm.day ? "Students outside K201/K204 get STC Desktop only in evenings and on weekends; VDI is always open."
                : "In evenings and on weekends STC Desktop is open to all students, and VDI is always open.";
          const whyFor = {
            [IUA_OPTS[0]]: "STC Desktop is not open to this person at this time.",
            [IUA_OPTS[1]]: "IUanyWare Desktop (VDI) is available to every IU user at any time, so it can never be unavailable.",
            [IUA_OPTS[2]]: "STC Desktop is also open to this person at this time.",
            [IUA_OPTS[3]]: "IUanyWare Desktop (VDI) is always available to every IU user.",
          };
          return Q.mc({
            q: `<p>${name}, ${p.who}, wants to use IUanyWare ${tm.t} from a personal laptop. Which IUanyWare option(s) can ${name} use?</p>`,
            right, rightWhy: reason,
            wrong: IUA_OPTS.filter(o => o !== right).map(o => ({ t: o, why: whyFor[o] })),
            keepOrder: IUA_OPTS,
            sol: S("IUanyWare Desktop (VDI) has no restrictions: all IU users, any time. So the only question is whether STC Desktop is also open.", `STC Desktop: K201/K204 students during the day; all students evenings and weekends. ${reason}`),
          });
        },
      },
      {
        name: "Sort authentication factors",
        make() {
          const items = [...U.sample(FACTOR_BANK.filter(f => f.cat === "Something you know"), 2), ...U.sample(FACTOR_BANK.filter(f => f.cat === "Something you have"), U.randInt(2, 3))];
          return Q.classify({
            q: "<p>Duo combines two factor types. Classify each credential.</p>",
            cats: ["Something you know", "Something you have"], items: U.shuffle(items),
            sol: S("Is it held in your memory, or does it prove you possess a physical device?", "Passphrases, PINs and answers are things you know; pushes, token codes and texted codes prove something you have. Multi-factor needs one of each."),
          });
        },
      },
      K.conceptVariant("Act, pause or continue?", "ch2-iu", IU_CONCEPT),
      K.tfVariant("True or false: IU systems", "ch2-iu-tf", IU_TF),
    ],
  });

  /* ---- Topic 7: files, sharing, submission ---- */
  const t7 = STUDY.makeGenerator({
    id: "k201-ch2-files",
    name: "File management, sharing and Canvas submission",
    blurb: "Local vs. cloud files, attachment vs. granting access, repository vs. backup, and verifying a Canvas submission.",
    variants: [
      ...rename(pickNames(["Sort (drop-down)", "Pick the example", "Select all that apply"])(K.sortVariants({ key: "ch2-share", bank: SHARE_BANK, cats: ["Attachment (copy)", "Granting access"],
        defs: { "Attachment (copy)": "a copy is sent; changes must be merged by hand", "Granting access": "permissions on the one original; always current" }, ask: "sharing action",
        hint: "Ask: does the other person end up with their own copy, or with permission on your original?" })), "sharing"),
      {
        name: "Count versions after attaching",
        make() {
          const owner = U.pick(NAMES);
          const k = U.randInt(2, 5);
          const j = U.randInt(1, k);
          const askCopies = U.randInt(0, 1) === 0;
          const ans = askCopies ? k + 1 : j;
          return Q.num({
            q: `<p>${owner} emails a project workbook as an <b>attachment</b> to ${k} teammates. ${j} of them edit their copy and send it back.</p><p>${askCopies ? "Including the original, how many separate copies of the workbook now exist?" : `How many sets of changes must ${owner} merge into the original by hand?`}</p>`,
            answer: ans, kind: "count",
            traps: cleanTraps(ans, askCopies ? [
              { value: k, why: "Don't forget the owner's original." },
              { value: 1, why: "That would be true if access had been granted; attachments create copies." },
              { value: j + 1, why: "Every recipient has a copy, whether or not they edited it." },
            ] : [
              { value: k, why: "Only teammates who edited have changes to merge." },
              { value: 0, why: "That would be true with granted access; attachments require manual merging." },
              { value: k + 1, why: "That counts copies, not edited copies to merge." },
            ]),
            sol: S("An attachment is a copy: each recipient gets one, and edits stay in that copy.",
              askCopies ? `${k} copies sent + 1 original = <b>${k + 1}</b>. With granted access there would be just 1.` : `Each of the ${j} edited copies must be merged by hand: <b>${j}</b>. With granted access there would be nothing to merge.`),
          });
        },
      },
      K.conceptVariant("Diagnose a file incident", "ch2-files", INCIDENT_BANK),
      {
        name: "Verify a Canvas submission",
        make() {
          const k = U.randInt(2, 4);
          const opts = [...U.sample(VERIFY_GOOD, k).map(t => ({ t, ok: true, why: "This checks what Canvas actually received or that it meets requirements." })),
            ...U.sample(VERIFY_BAD, 5 - k).map(b => ({ t: b.t, ok: false, why: b.why }))];
          const name = U.pick(NAMES);
          return Q.multi({
            q: `<p>${name} has just uploaded a workbook to a Canvas assignment. Select <b>every</b> step that helps confirm the submission is correct.</p>`,
            options: opts,
            sol: S("Verification means checking what Canvas received, not what is on your computer.", `Good practice: ${ul(VERIFY_GOOD)}`),
          });
        },
      },
      K.tfVariant("True or false: files, backups and sharing", "ch2-files-tf", FILE_TF),
    ],
  });

  const generators = [t1, t2, t3, t4, t5, t6, t7];

  STUDY.registerUnit(C, {
    id: "ch2", order: 2,
    title: "Chapter 2 · Introduction to Computing and IU Resources",
    short: "Ch 2 · Computing & IU",
    description: "Data vs. information, how data is collected, stored and mined, AI basics, on-premises vs. edge vs. cloud, and the IU systems and file habits you need for K201.",
    notes, flashcards, cues, generators,
  });
})();
