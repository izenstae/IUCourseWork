/* ============================================================
 * ECON B251 · Module 1 · Basic Economics
 * Scarcity, micro vs macro, self-interest and social interest,
 * opportunity cost, marginal analysis and incentives, positive vs
 * normative, and theories / models / data.
 * All explanations, examples and numbers are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const C = "econ-b251";

  /* ---------- small local helpers ---------- */
  const S = (...steps) => steps.map(s => `<div class="sol-step">${s}</div>`).join("");
  const NAMES = ["Maya", "Jordan", "Priya", "Luis", "Aisha", "Ben", "Chloe", "Diego", "Hana", "Isaac", "Keisha", "Mateo",
    "Nora", "Omar", "Quinn", "Rosa", "Sam", "Tariq", "Uma", "Wes", "Yara", "Zoe", "Elena", "Malik"];
  const names = k => U.sample(NAMES, k);
  /* distinct random values, multiples of `step`, in [lo, hi] */
  function distinct(k, lo, hi, step) {
    const pool = [];
    for (let v = lo; v <= hi; v += step) pool.push(v);
    return U.sample(pool, k);
  }
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "What economics is: scarcity and the economic problem",
      lo: "Define economics and scarcity and explain the economic problem.",
      html: `<p><b>Economics</b> is the study of how people use limited resources to satisfy wants that never run out. Put more simply, it is the study of <b>choice</b>: what people, businesses and governments decide to do when they cannot have everything.</p>
<p><b>Scarcity</b> is the condition behind every one of those choices. The ingredients we use to make the things we want (time, labor, land, raw materials, machines, know-how) are not enough to satisfy every want at once. That mismatch between <em>limited resources</em> and <em>unlimited wants</em> is called <b>the economic problem</b>.</p>
<div class="keyidea"><b>Key idea.</b> Limited resources + unlimited wants = scarcity. Scarcity forces choices, and every choice has a cost.</div>
<p>Because economics is about choice, it reaches far beyond money. Deciding how to split a weekend between a part-time job, a group project and sleep is an economic decision even if no dollars change hands.</p>
<div class="example"><b>Example.</b> A food bank has 400 volunteer hours this month. It could sort donations, deliver meals to seniors, or run a fundraising drive. It cannot do all three as much as it would like, so it has to decide how to allocate those hours. That is the economic problem in miniature.</div>
<div class="trap"><b>Common trap.</b> "Economics is the study of money." Money is one tool people use, but the subject is <em>choice under scarcity</em>. Time, attention and effort are scarce too.</div>`,
      gens: ["b251-m1-scarcity"],
    },
    {
      title: "Microeconomics vs. macroeconomics",
      lo: "Differentiate between microeconomics and macroeconomics.",
      html: `<p>Economics is usually split into two branches according to the <b>level</b> at which we look.</p>
<ul>
<li><b>Microeconomics</b> studies the decisions of individual decision makers (people, households and firms) and how they interact in particular markets. How a bakery prices its croissants, how a household chooses a health-insurance plan, how a city's rent levels respond to a new university dorm, how a pollution fee changes a factory's output: all micro.</li>
<li><b>Macroeconomics</b> studies the economy <em>as a whole</em>: the overall price level and inflation, the national unemployment rate, total output (GDP), economic growth, and national tax and budget policy.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Ask "Is this about one decision maker or one market, or about the whole economy added together?" One market → micro. Economy-wide totals and averages → macro.</div>
<div class="example"><b>Example.</b> "How will a new tax on sugary drinks change the number of sodas sold in Indiana?" is micro: one product, one market. "How will a cut in the federal income tax affect national employment and total spending?" is macro: economy-wide totals. Same subject (taxes), different level.</div>
<div class="trap"><b>Common trap.</b> Size does not make something macro. A company with a million employees, or an entire industry like airlines or health care, is still a <em>part</em> of the economy, so studying it is microeconomics.</div>`,
      gens: ["b251-m1-micromacro"],
    },
    {
      title: "Self-interest, rationality and the social interest",
      lo: "Distinguish between self-interest and social interest; explain the rationality assumption and why people sometimes depart from it.",
      html: `<p>Economists start from the <b>rationality assumption</b>: people do not <em>intentionally</em> make choices that leave them worse off. It does not say people never make mistakes, or that they care only about money. It says that, given what they know and value, they try to do what they think is best for them.</p>
<p><b>Self-interest</b> means pursuing <em>your own goals</em>, whatever they are: wealth, prestige, power, time with family and friends, helping others, protecting the environment. Someone who donates a kidney or spends Saturdays volunteering is acting in their self-interest if that is what they value. Economists also usually assume <b>"more is better"</b>: more of something you value (money, free time, things you enjoy) makes you better off.</p>
<p>Real people do depart from perfect rationality, usually because of:</p>
<ul>
<li><b>Asymmetric information</b>: one side of a deal knows more than the other (a seller knows the used laptop's battery is failing; you do not).</li>
<li><b>Limited time, cognitive ability or resources</b>: you cannot compare all 300 phone plans before your current one expires.</li>
<li><b>Bias</b>: systematic mental shortcuts, such as sticking with a familiar brand or anchoring on the first price you see.</li>
<li><b>Emotion under uncertainty and risk</b>: fear or excitement steering a decision, for example panic-selling investments during a market drop.</li>
</ul>
<p>Two alternative theories describe these patterns. <b>Bounded rationality</b> says people are rational within limits of information, time and brainpower, so they use rules of thumb. <b>Prospect theory</b> notes that people feel losses more sharply than equal-sized gains (<b>loss aversion</b>). This links to two decision styles: a <b>maximizer</b> searches for the best possible option, while a <b>satisficer</b> settles on the first option that is "good enough."</p>
<p>Choices that are best for society as a whole are in the <b>social interest</b>. Economists ask three questions to judge whether self-interested choices also serve society:</p>
<ol>
<li>Are we producing the <b>right things in the right quantities</b>?</li>
<li>Are we using our <b>factors of production</b> (labor, land, capital, entrepreneurship) <b>in the best way</b>?</li>
<li>Do goods and services go to the people who <b>benefit most</b> from them?</li>
</ol>
<div class="keyidea"><b>Key idea.</b> Economists take human nature as given. To get self-interest to serve the social interest, they look to <b>institutions</b>, such as governments, laws that protect private property and courts that enforce voluntary exchange, which create incentives that line the two up.</div>
<div class="example"><b>Example.</b> A farmer who could lose her land at any moment has little reason to plant fruit trees that take seven years to bear fruit. Secure property rights mean she keeps the reward, so her self-interest (future income) now leads to an action that also serves society (more food from the same land).</div>
<div class="trap"><b>Common trap.</b> "Rational means selfish and greedy." No. Rational means not choosing to make yourself worse off given your own goals. Those goals can be generous ones.</div>`,
      gens: ["b251-m1-rational"],
    },
    {
      title: "Scarcity, choice and opportunity cost",
      lo: "Indicate how scarcity leads to choices and how to measure opportunity cost.",
      html: `<p>Scarcity means every choice is a <b>tradeoff</b>: to get one thing, you give up something else. In economics, <b>cost is always a forgone opportunity</b>.</p>
<p>The <b>opportunity cost</b> of a choice is the value of the <b>highest-valued, next-best alternative</b> you give up. It is <em>one</em> alternative, the best one you passed over, not the sum of everything you could have done. That is the meaning of the old line <b>TANSTAAFL</b>: "there ain't no such thing as a free lunch." Even a "free" lunch costs the time you spend eating it.</p>
<p>When a choice costs money <em>and</em> time, the opportunity cost includes both: the money you pay (which you could have spent elsewhere) plus the value of what you would have done with the time, such as wages from a job. Spending you would have made anyway (like groceries you would buy either way) is <em>not</em> part of the cost of the choice.</p>
<div class="example"><b>Example.</b> Dani gets a free ticket to a Saturday concert (it cannot be resold). Her alternatives were a $96 shift at a bike shop or a hike she values at $40. The ticket price was zero, but the opportunity cost of the concert is <b>$96</b>, the value of the best thing she gave up. It is not $0, and it is not $136.</div>
<p>Some more points worth remembering:</p>
<ul>
<li><b>Scarcity is not a shortage.</b> A shortage is a temporary situation in a market (more people want to buy at the current price than sellers offer). Scarcity is permanent and universal. Even a store with full shelves sells scarce goods.</li>
<li><b>Scarcity is not poverty.</b> Rich people and rich countries face scarcity too. Everyone has 24 hours a day.</li>
<li><b>Choices today shape tomorrow.</b> Studying, saving and health habits trade some enjoyment now for more options later, and they change the choices you will face in the future.</li>
<li><b>Non-strategic vs. strategic choices.</b> A non-strategic choice depends only on your own costs and benefits and on market conditions (buying gas at the posted price). A strategic choice depends on what others decide (pricing your food truck after you see whether the truck next door cuts its prices). Strategic choices are studied with <b>game theory</b>.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Opportunity cost = the value of the single best alternative you gave up. Add the money you spend to the value of the time you use, and leave out costs you would have paid anyway.</div>
<div class="trap"><b>Common trap.</b> Adding up every alternative. If you skip a $60 work shift to go to a game, and your other option was a $25 movie, the opportunity cost is $60, not $85. You could only have done one of them.</div>`,
      gens: ["b251-m1-oppcost", "b251-m1-scarcity"],
    },
    {
      title: "Marginal analysis and incentives",
      lo: "Define, apply and explain how incentives affect marginal analysis.",
      html: `<p>Most real choices are not all-or-nothing. They are about <em>a little more or a little less</em>: one more hour of studying, one more employee, one more slice. Economists say people <b>choose at the margin</b>, meaning they weigh the consequences of small, incremental changes.</p>
<ul>
<li><b>Marginal benefit (MB)</b>: the extra benefit from one more unit. In a table it is the change in total benefit: MB of the 3rd unit = TB(3) − TB(2).</li>
<li><b>Marginal cost (MC)</b>: the extra cost (opportunity cost) of one more unit.</li>
</ul>
<p><b>Decision rule.</b> Keep going as long as the next unit's MB exceeds its MC. Stop when the next unit would cost more than it adds. Totals, averages and money already spent (sunk costs) do not tell you whether the <em>next</em> unit is worth it.</p>
<div class="example"><b>Example.</b> Rafael is deciding how many hours to tutor this week. Each hour costs him about $15 in other things he could do. The extra benefit of his 1st, 2nd, 3rd and 4th hours is $40, $28, $18 and $9. He tutors 3 hours: the 3rd hour adds $18 &gt; $15, but the 4th adds only $9 &lt; $15.</div>
<p>Because choices weigh benefits against costs, they respond to <b>incentives</b>, which are rewards or penalties that change those benefits or costs. A <b>positive incentive</b> (a reward, discount, bonus or subsidy) encourages an action. A <b>negative incentive</b> (a fine, fee, tax or penalty) discourages one. Raise the cost of something and people do less of it; raise the benefit and they do more.</p>
<div class="keyidea"><b>Key idea.</b> Incentives work through the margin: they shift MB or MC, which changes how much people choose to do. Well-designed incentives, like financial aid that lowers the cost of college, can line up self-interest with the social interest.</div>
<div class="trap"><b>Common trap.</b> "I've already paid for it, so I should keep going." Money already spent is gone whatever you do next. Only the <em>additional</em> benefits and costs from here on matter.</div>`,
      gens: ["b251-m1-margin"],
    },
    {
      title: "Positive vs. normative economics",
      lo: "Differentiate between positive and normative economics.",
      html: `<p><b>Positive economics</b> describes <em>what is</em>, what was, or what will happen. A positive statement can be tested, at least in principle, by checking it against facts. It does <em>not</em> have to be true: "Raising bus fares will increase ridership" is positive even though it is probably false, because data could show it to be wrong.</p>
<p><b>Normative economics</b> is about <em>what ought to be</em>. Normative statements rest on value judgments, about fairness, priorities, what is "too much" or "better," so no amount of data can settle them.</p>
<div class="keyidea"><b>Key idea.</b> Ask "Could evidence, in principle, prove this right or wrong?" Yes → positive. If it depends on values → normative.</div>
<div class="example"><b>Example.</b> "Rents in Bloomington rose 9% last year" (positive). "A rent cap would reduce the number of new apartments built" (positive: a testable prediction). "Rents in Bloomington are unfairly high" (normative). "The city should cap rents" (normative).</div>
<p>Watch for two edge cases:</p>
<ul>
<li>A statement <em>about</em> opinions is positive. "62% of students think tuition should be lower" reports a fact about what people believe, and a survey can check it.</li>
<li>Normative statements do not always contain "should." Words like "fair," "too high," "deserve," "better" and "worth it" also signal value judgments.</li>
</ul>
<div class="trap"><b>Common trap.</b> Treating "positive" as "true" and "normative" as "false." Positive means <em>testable</em>, not correct. A false factual claim is still positive.</div>`,
      gens: ["b251-m1-posnorm"],
    },
    {
      title: "Theories, models and data",
      lo: "Examine how economic theory is illustrated by models, which are in turn evaluated by data.",
      html: `<p>An <b>economic theory</b> is a generalization about how people, firms, industries or whole economies make choices and perform. A <b>model</b> is a deliberately simplified representation of the real world that we use to explain or predict. A map is the classic model: a hiking map leaves out almost everything about a forest except trails, streams and elevation, and that is exactly why it helps you get to the summit.</p>
<p>Every model rests on <b>assumptions</b>, the set of circumstances under which it applies. The most important in economics is <b>ceteris paribus</b> (Latin for "other things equal"): we change one factor and hold every other relevant factor constant, so we can isolate cause and effect.</p>
<div class="example"><b>Example.</b> A café wants to know whether a lower price raises latte sales. If it cuts the price <em>and</em> starts a social-media campaign in the same week, it cannot tell which change caused any jump in sales. To test the price effect, it should change only the price and keep everything else (advertising, menu, hours) the same.</div>
<p><b>Economics is empirical.</b> Models are judged by how well their predictions match real-world data, not by how realistic their assumptions sound. If the data keep contradicting a model's predictions, the model, or an assumption behind it, needs to be revised or dropped.</p>
<div class="keyidea"><b>Key idea.</b> Models predict how people <em>act</em>, not what goes on in their heads. Shoppers do not literally calculate marginal benefit, but a model that assumes they do can still predict well what they buy.</div>
<div class="trap"><b>Common trap.</b> "That model is unrealistic, so it is useless." Every model leaves things out on purpose. The real test is whether it predicts well for the question being asked.</div>`,
      gens: ["b251-m1-models"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "b251-m1-c-economics", tag: "Definition", front: "What is <em>economics</em>?", back: "The study of how people use <b>limited resources</b> to satisfy <b>unlimited wants</b>. In short, the study of how people make <b>choices</b> under scarcity." },
    { id: "b251-m1-c-scarcity", tag: "Definition", front: "What is <em>scarcity</em>?", back: "The condition in which the resources (inputs) available for producing the things people want are not enough to satisfy all of those wants." },
    { id: "b251-m1-c-econproblem", tag: "Principle", front: "What is <em>the economic problem</em>?", back: "Limited resources versus unlimited wants. Because we cannot have everything, we must choose, and every choice has an opportunity cost." },
    { id: "b251-m1-c-notshortage", tag: "Misconception", front: "True or false, and why: “If a store's shelves are fully stocked, the product isn't scarce.”", back: "<b>False.</b> A shortage is a temporary market situation. Scarcity is permanent: the resources used to make the product could have made something else, and wants still exceed what can be produced." },
    { id: "b251-m1-c-notpoverty", tag: "Misconception", front: "Does a billionaire face scarcity?", back: "<b>Yes.</b> Scarcity is not poverty. A billionaire still has only 24 hours a day and must choose how to spend time, attention and money. Every option chosen means another is given up." },
    { id: "b251-m1-c-micro", tag: "Definition", front: "What is <em>microeconomics</em>?", back: "The study of decisions by individuals, households and firms, and of how particular markets work. Examples: one firm's pricing, the market for health care, the effects of a pollution fee." },
    { id: "b251-m1-c-macro", tag: "Definition", front: "What is <em>macroeconomics</em>?", back: "The study of the economy <b>as a whole</b>: inflation, the national unemployment rate, total output (GDP), growth, and national tax and budget policy." },
    { id: "b251-m1-c-bigfirm", tag: "Misconception", front: "Is a study of how the country's largest airline sets fares micro or macro?", back: "<b>Micro.</b> However big the firm or industry, it is still one part of the economy. Macro is about economy-wide totals and averages." },
    { id: "b251-m1-c-rationality", tag: "Definition", front: "What does the <em>rationality assumption</em> say?", back: "People do not <b>intentionally</b> make choices that leave them worse off. It does not say they never make mistakes, and it does not say they care only about money." },
    { id: "b251-m1-c-selfinterest", tag: "Definition", front: "How do economists define <em>self-interest</em>?", back: "The pursuit of <b>one's own goals</b>, which can be wealth, prestige, power, family and friends, helping others or protecting the environment. Volunteering is consistent with self-interest if you value it." },
    { id: "b251-m1-c-deviate", tag: "Principle", front: "Name four reasons people may not behave fully rationally.", back: "1) <b>Asymmetric information</b> (the other side knows more); 2) limited <b>time, cognitive ability or resources</b>; 3) <b>bias</b>; 4) <b>emotion</b> under uncertainty and risk." },
    { id: "b251-m1-c-bounded", tag: "Definition", front: "What is <em>bounded rationality</em>?", back: "The idea that people are rational only within limits of information, time and mental capacity, so they use rules of thumb and look for solutions that are good enough rather than the best." },
    { id: "b251-m1-c-loss", tag: "Definition", front: "What is <em>loss aversion</em> (prospect theory)?", back: "People feel a loss more strongly than a gain of the same size. For example, many people turn down a coin flip that wins $110 or loses $100, even though on average it pays off." },
    { id: "b251-m1-c-maxsat", tag: "Distinction", front: "Maximizer vs. satisficer: what's the difference?", back: "A <b>maximizer</b> searches for the best possible option (full rationality). A <b>satisficer</b> takes the first option that is “good enough” (bounded rationality)." },
    { id: "b251-m1-c-social", tag: "Definition", front: "What is a choice in the <em>social interest</em>?", back: "A choice that is best for society as a whole, as opposed to just for the person making it." },
    { id: "b251-m1-c-3questions", tag: "Principle", front: "What three questions ask whether self-interested choices also serve the social interest?", back: "1) Do we produce the <b>right things in the right quantities</b>? 2) Do we use our <b>factors of production in the best way</b>? 3) Do goods and services go to <b>those who benefit most</b>?" },
    { id: "b251-m1-c-institutions", tag: "Principle", front: "How can self-interest be made to serve the social interest?", back: "Through <b>institutions</b>, such as government, laws that protect private property and the enforcement of voluntary exchange. These create incentives that reward socially useful behavior." },
    { id: "b251-m1-c-oppcost", tag: "Definition", front: "What is <em>opportunity cost</em>?", back: "The value of the <b>highest-valued, next-best alternative</b> given up to get something. It is one alternative, the best one forgone, not the sum of all of them." },
    { id: "b251-m1-c-tanstaafl", tag: "Principle", front: "What does <em>TANSTAAFL</em> mean?", back: "“There ain't no such thing as a free lunch.” Every choice has an opportunity cost, even when the price is zero. At the very least, you give up the time." },
    { id: "b251-m1-c-sumtrap", tag: "Application", front: "You skip a $70 work shift to see a game. Your other option was a movie you value at $20. What is the opportunity cost of the game?", back: "<b>$70</b>, the value of the single best alternative. Not $90: you could not have done both the shift and the movie in that time." },
    { id: "b251-m1-c-implicit", tag: "Application", front: "A weekend trip costs $180 in gas and lodging plus a $120 shift you skip. You'd spend $40 on food either way. Opportunity cost?", back: "<b>$300</b> = $180 spent + $120 earnings forgone. The $40 of food is not a cost of the trip, since you would pay it anyway." },
    { id: "b251-m1-c-strategic", tag: "Distinction", front: "Strategic vs. non-strategic choices: what's the difference?", back: "A <b>non-strategic</b> choice depends only on your own costs and benefits and on market conditions. A <b>strategic</b> choice also depends on what others decide (studied with game theory)." },
    { id: "b251-m1-c-tomorrow", tag: "Principle", front: "Why do economists say choices bring change?", back: "Choices today affect your well-being tomorrow <em>and</em> the options you will face later. Education, saving and health habits trade something now for different possibilities in the future." },
    { id: "b251-m1-c-margin", tag: "Definition", front: "What does it mean to <em>choose at the margin</em>?", back: "To weigh the consequences of an <b>incremental</b> change, one more or one less unit, by comparing its marginal benefit with its marginal cost." },
    { id: "b251-m1-c-mbmc", tag: "Principle", front: "What is the marginal decision rule?", back: "Do one more unit if its <b>marginal benefit &gt; marginal cost</b>. Stop when the next unit's MC exceeds its MB. Totals, averages and sunk costs don't decide it." },
    { id: "b251-m1-c-mbcalc", tag: "Application", front: "Total benefit is $50 after 2 hours and $62 after 3 hours. What is the marginal benefit of the 3rd hour?", back: "<b>$12</b> = $62 − $50. Marginal means the <em>change</em> in the total from one more unit." },
    { id: "b251-m1-c-incentive", tag: "Definition", front: "Positive vs. negative incentives?", back: "A <b>positive incentive</b> is a reward that encourages an action (bonus, discount, subsidy). A <b>negative incentive</b> is a penalty that discourages one (fine, fee, tax)." },
    { id: "b251-m1-c-positive", tag: "Definition", front: "What is a <em>positive</em> economic statement?", back: "A statement about <b>what is</b> (or was, or will be) that can be tested against facts, even if it turns out to be false." },
    { id: "b251-m1-c-normative", tag: "Definition", front: "What is a <em>normative</em> economic statement?", back: "A statement about <b>what ought to be</b>. It rests on value judgments and cannot be settled by data." },
    { id: "b251-m1-c-falsepos", tag: "Misconception", front: "True or false, and why: “‘Lowering prices always reduces sales’ is normative because it's wrong.”", back: "<b>False.</b> It is a <b>positive</b> statement: it is false, but it can be tested against data. Positive means testable, not true." },
    { id: "b251-m1-c-beliefpos", tag: "Misconception", front: "Is “Most voters believe the minimum wage should be higher” positive or normative?", back: "<b>Positive.</b> It reports a fact about what people believe, and a survey can check it. The voters' opinion is normative, but the statement <em>about</em> their opinion is not." },
    { id: "b251-m1-c-model", tag: "Definition", front: "What is an economic <em>model</em>?", back: "A simplified representation of the real world used to explain or predict, like a map that leaves out detail on purpose so it is useful." },
    { id: "b251-m1-c-ceteris", tag: "Definition", front: "What does <em>ceteris paribus</em> mean, and why use it?", back: "“Other things equal.” Only the factor being studied changes and all other relevant factors are held constant, so cause and effect can be isolated." },
    { id: "b251-m1-c-empirical", tag: "Principle", front: "How are economic models judged?", back: "Empirically, by whether their <b>predictions match real-world data</b>, not by how realistic their assumptions look. Models predict how people <em>act</em>, not how they think." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "“should”, “ought”, “fair”, “too high”, “deserve”", think: "Normative statement", why: "A value judgment, so no data can settle it." },
    { when: "A claim that could be checked with data, even a wrong one", think: "Positive statement", why: "Positive means testable, not true." },
    { when: "“X% of people believe…”, “economists disagree about…”", think: "Positive (a fact about opinions)", why: "A survey can verify what people believe." },
    { when: "One firm, one household, one market or industry (however large)", think: "Microeconomics", why: "It is a part of the economy, not the whole." },
    { when: "Inflation, national unemployment, GDP, overall growth, federal tax policy", think: "Macroeconomics", why: "Economy-wide totals and averages." },
    { when: "“Gave up”, “instead of”, “next-best”, “free ticket”", think: "Opportunity cost / TANSTAAFL", why: "Value of the single best alternative forgone, never zero." },
    { when: "Several alternatives listed with dollar values", think: "Take the max of the forgone options, don't add them", why: "You could only have done one of them." },
    { when: "“Skips work”, “instead of a job”, plus money spent", think: "Explicit + implicit cost", why: "Opportunity cost = money spent + earnings forgone (minus what you'd pay anyway)." },
    { when: "“One more”, “an extra hour”, “additional unit”", think: "Marginal analysis: compare MB with MC", why: "Totals, averages and sunk costs don't decide the next step." },
    { when: "Fine, fee, tax, penalty / bonus, discount, subsidy, reward", think: "Negative / positive incentive", why: "Changes MC or MB, so the chosen quantity changes." },
    { when: "“Depends on what rivals / the other player does”", think: "Strategic choice (game theory)", why: "The best move depends on others' decisions." },
    { when: "“Good enough”, “took the first one that worked”", think: "Satisficer / bounded rationality", why: "Limited time, information or brainpower." },
    { when: "Refuses a favorable bet, or holds a losing asset to avoid “locking in” a loss", think: "Loss aversion (prospect theory)", why: "Losses loom larger than equal gains." },
    { when: "“Seller knew but buyer didn't”", think: "Asymmetric information", why: "One side has better information, so the other may choose badly." },
    { when: "Two things changed at once in a study", think: "Ceteris paribus violated", why: "Cause and effect can't be separated." },
    { when: "“Unrealistic assumptions, but it predicts well”", think: "A useful model", why: "Models are judged by predictions against data." },
  ];

  /* ============================================================
   * TOPIC 1 · POSITIVE VS NORMATIVE
   * ============================================================ */
  const POS = [
    "The national unemployment rate fell by half a percentage point last year.",
    "When movie theaters raise ticket prices, they sell fewer tickets.",
    "Students who work more than 30 hours a week have lower average GPAs than students who don't work.",
    "A tax on plastic bags will reduce the number of bags shoppers use.",
    "Average rent for a one-bedroom apartment in the city rose 7% over the past two years.",
    "Raising the minimum wage to $20 would reduce the number of teenagers employed in fast food.",
    "Countries that trade more with other countries tend to have higher average incomes.",
    "Gas prices in Indiana were higher in July than in January.",
    "A subsidy for electric cars will increase the number of electric cars sold.",
    "Free public transit would increase the number of bus riders downtown.",
    "College graduates earn more over their careers, on average, than high-school graduates.",
    "If coffee prices double, many people will switch to tea.",
    "The price of eggs has risen faster than overall inflation this year.",
    "Cities with rent control have fewer new apartment buildings than similar cities without it.",
    "The company's profits rose after it began offering free shipping.",
    "Reducing the speed limit on the highway would lower the number of fatal accidents.",
    "A 10% increase in cigarette taxes reduces teen smoking by about 7%.",
    "Most of the growth in health-care spending over the past decade came from hospital costs.",
    "Opening a second campus bookstore would lower average textbook prices on campus.",
    "Farmers planted more soybeans this year after soybean prices rose.",
    "Unemployment benefits that last longer lead people to take longer to find new jobs.",
    "A ban on happy-hour drink specials would reduce late-night bar revenue.",
  ];
  /* positive but very likely (or plainly) false: positive ≠ true */
  const POS_FALSE = [
    "Raising the price of concert tickets will cause fans to buy more tickets.",
    "The United States has had zero inflation in every year since 2000.",
    "Doubling the tax on gasoline would have no effect at all on how much gas people buy.",
    "Every college graduate in the country earns over $1 million in their first year of work.",
    "Lowering the price of pizza will reduce the number of pizzas sold.",
    "The unemployment rate has never been above 2% in American history.",
    "Giving away free bus passes will reduce the number of bus riders.",
    "Smartphones cost more today than they did in 1950.",
    "No business has ever gone bankrupt in Indiana.",
    "Paying workers more per hour always causes them to work fewer hours, with no exceptions anywhere.",
  ];
  const NORM = [
    "The government should provide free tuition at all public universities.",
    "The minimum wage is too low to live on, so it ought to be raised.",
    "It is unfair that CEOs earn 300 times what their average workers earn.",
    "Reducing inflation is more important than reducing unemployment.",
    "Landlords should not be allowed to raise rent by more than 3% a year.",
    "Taxes on the wealthy are too low.",
    "Every citizen deserves access to affordable health care.",
    "The city ought to spend more on parks and less on parking garages.",
    "Gas prices are unreasonably high right now.",
    "Protecting the environment is worth slowing economic growth.",
    "Textbooks are overpriced, and publishers should be ashamed.",
    "College athletes deserve to be paid by their universities.",
    "Unemployment benefits are too generous.",
    "The state should ban sugary drinks in public schools.",
    "It would be better for society if more people rode bikes to work.",
    "A fair economy is one where nobody earns less than a living wage.",
    "Tariffs on imported cars are a bad idea.",
    "Our town needs a new stadium more than it needs a new library.",
    "Companies have a moral duty to give part of their profits to charity.",
    "Student-loan debt should be forgiven.",
    "The national debt is too large.",
    "Wealthy countries ought to give more foreign aid.",
  ];
  /* positive statements that are ABOUT opinions or disagreement */
  const BELIEF = [
    { t: "62% of surveyed students say tuition should be lower.", why: "It reports what students believe. A survey can check whether 62% is right." },
    { t: "Most economists believe that rent control reduces the supply of housing.", why: "It describes economists' views, which can be checked by polling economists." },
    { t: "Economists disagree about whether the minimum wage should be raised.", why: "Whether economists disagree is a fact that can be checked, even though the underlying question is normative." },
    { t: "A majority of voters in the last election supported higher taxes on the wealthy.", why: "It describes how people voted, which election data can verify." },
    { t: "Fewer than half of Americans think the national debt is a serious problem.", why: "It is a claim about public opinion, testable with a poll." },
    { t: "Many small-business owners say regulations are too strict.", why: "It reports what business owners say, which a survey can check." },
    { t: "Support for a carbon tax among young voters has risen over the past decade.", why: "Changes in opinion over time can be measured with repeated polls." },
    { t: "Two-thirds of parents in the district believe school should start later.", why: "It is a fact about parents' beliefs, verifiable with a survey." },
  ];
  /* normative argument = testable premise + value-laden conclusion */
  const ARGS = [
    { prem: "a $1 tax on sugary drinks would cut soda purchases by about 20%", conc: "the city ought to adopt the tax because public health matters more than cheap soda" },
    { prem: "free community college would raise enrollment by about 15%", conc: "the state should fund it because everyone deserves a chance at higher education" },
    { prem: "congestion pricing reduced downtown traffic by 25% in other cities", conc: "our city should adopt it because drivers who clog the roads ought to pay" },
    { prem: "raising the minimum wage would lift some workers' incomes but reduce the hours of others", conc: "we should raise it because a full-time worker deserves a living wage" },
    { prem: "a bottle-deposit law raises the share of bottles that are recycled", conc: "every state should pass one, since protecting the environment is worth the inconvenience" },
    { prem: "building more apartments near campus would lower average rents", conc: "the city should relax zoning rules because affordable housing is the top priority" },
    { prem: "a subsidy for solar panels would increase the number of homes with solar", conc: "the government should pay for it because fighting climate change is worth the cost to taxpayers" },
    { prem: "tariffs on imported steel would raise the price of cars made in the U.S.", conc: "tariffs are a bad policy because consumers' interests should come first" },
  ];
  const posWhy = t => (POS_FALSE.includes(t) ? "Positive. It is a factual claim that data can check. It happens to be false, but that does not make it normative." : "Positive. It describes what is or predicts what will happen, so it can be tested against data.");
  const normWhy = "Normative. It is a value judgment about what ought to be (look for words like should, fair, too, deserve, better), so data cannot settle it.";

  const genPosNorm = STUDY.makeGenerator({
    id: "b251-m1-posnorm",
    name: "Positive vs. normative",
    blurb: "Tell testable claims about what is from value judgments about what ought to be, including false positives and statements about opinions.",
    variants: [
      {
        name: "Sort statements (drop-down)",
        make() {
          const nP = U.randInt(2, 3), nN = 5 - nP;
          const items = [
            ...U.deal("pn-pos-a", POS.concat(POS_FALSE.slice(0, 4)), nP).map(t => ({ t, cat: "Positive", why: posWhy(t) })),
            ...U.deal("pn-norm", NORM, nN).map(t => ({ t, cat: "Normative", why: normWhy })),
          ];
          if (Math.random() < 0.4) items[0] = Object.assign({}, U.pick(BELIEF), { cat: "Positive" });
          return Q.classify({
            q: "<p>Classify each statement as <b>positive</b> or <b>normative</b>.</p>",
            cats: ["Positive", "Normative"], items,
            sol: S("Ask of each statement: could evidence, at least in principle, show it to be right or wrong? Whether it is actually true doesn't matter.",
              "Statements that rely on judgments like <em>should, fair, too high, deserve, better</em> are normative. Descriptions and predictions, including statements about what people believe, are positive."),
          });
        },
      },
      {
        name: "Pick the normative statement",
        make() {
          const right = U.deal("pn-norm", NORM, 1)[0];
          const wrong = U.deal("pn-pos-b", POS, 3).map(t => ({ t, why: "This is positive: it describes or predicts something that data could check." }));
          return Q.mc({
            q: "<p>Which statement is <b>normative</b>?</p>", right, wrong,
            rightWhy: "It expresses a value judgment about what ought to be.",
            sol: S("Normative statements say what <em>ought</em> to be. They depend on values, so no data can prove them right or wrong.",
              "Three options are descriptions or predictions you could check against data. The remaining one rests on a value judgment."),
          });
        },
      },
      {
        name: "Positive even when false",
        make() {
          const right = U.deal("pn-posfalse", POS_FALSE, 1)[0];
          const wrong = U.deal("pn-norm", NORM, 3).map(t => ({ t, why: "This is a value judgment about what ought to be, so it is normative." }));
          return Q.mc({
            q: "<p>Which statement is <b>positive</b>?</p>", right, wrong,
            rightWhy: "It is false, but it is a factual claim that can be checked, so it is positive.",
            sol: S("Positive does not mean <em>true</em>. It means <em>testable</em>: the statement makes a claim about the world that evidence could confirm or refute.",
              "Three options are value judgments. The remaining option is almost certainly false, but it is a checkable factual claim, so it is the positive one."),
          });
        },
      },
      {
        name: "Statements about opinions",
        make() {
          const b = U.pick(BELIEF);
          return Q.mc({
            q: `<p>A news report says: “${b.t}”</p><p>How should an economist classify the <b>report's</b> statement?</p>`,
            right: "Positive: it describes what people believe or how they behave, which can be checked with data.",
            wrong: [
              { t: "Normative: it contains an opinion, and opinions are value judgments.", why: "The people surveyed hold opinions, but the report only describes those opinions. Whether the description is accurate is a factual question." },
              { t: "Normative: words like “should” or “too” make any sentence normative.", why: "Keywords are a hint, not a rule. Here the value-laden words sit inside a factual report about what people think." },
              { t: "Neither: statements about opinions can't be classified.", why: "Every economic statement is either testable (positive) or a value judgment (normative). This one is testable." },
            ],
            rightWhy: b.why,
            sol: S("Separate the opinion being reported from the act of reporting it. Who believes what is itself a fact about the world.",
              `Could a survey, poll or vote count show the report to be wrong? Yes. ${b.why}`, "So the report is a <b>positive</b> statement."),
          });
        },
      },
      {
        name: "Find the testable claim in an argument",
        make() {
          const a = U.pick(ARGS), [n] = names(1);
          const parts = [
            { t: `That ${a.prem}.`, ok: true },
            { t: `That ${a.conc.split(" because ")[0].split(", since ")[0]}.`, ok: false, why: "This is the conclusion, a recommendation about what ought to be done. That is normative." },
            { t: `That ${(a.conc.split(" because ")[1] || a.conc.split(", since ")[1])}.`, ok: false, why: "This is the value judgment the conclusion rests on. It is about priorities, not facts." },
          ];
          return Q.mc({
            q: `<p>${n} argues: “Studies show that ${a.prem}. Therefore ${a.conc}.”</p><p>Which part of ${n}'s argument is a <b>positive</b> claim that could be checked with data?</p>`,
            right: parts[0].t,
            wrong: [parts[1], parts[2], { t: "None of it: the whole argument is normative because it ends in a recommendation.", why: "A normative conclusion can rest on a positive premise. The factual premise can still be tested on its own." }],
            sol: S("Arguments for policies usually mix facts with values. Look for the piece that describes cause and effect in the world.",
              "The recommendation (“should/ought”) and the reason given for it (what matters most or what people deserve) are value judgments.",
              `The premise that ${a.prem} is a factual prediction. Data from studies or experiments can confirm or refute it, so it is positive.`),
          });
        },
      },
      {
        name: "Which is NOT positive?",
        make() {
          const right = U.deal("pn-norm", NORM, 1)[0];
          const pool = POS.concat(POS_FALSE);
          const wrong = U.deal("pn-pos2", pool, 2).map(t => ({ t, why: POS_FALSE.includes(t) ? "Probably false, but still testable, so it is positive." : "Testable against data, so it is positive." }));
          const b = U.pick(BELIEF);
          wrong.push({ t: b.t, why: "A statement about what people believe is positive, since a survey can check it." });
          return Q.mc({
            q: "<p>Three of these statements are positive. Which one is <b>NOT</b> a positive statement?</p>", right, wrong,
            rightWhy: "It rests on a value judgment, so it is normative.",
            sol: S("Don't cross out options because they sound false or mention opinions. Ask whether each one could be tested.",
              "The false-sounding claim and the poll result are both testable, so they are positive.",
              "The odd one out is the value judgment."),
          });
        },
      },
      {
        name: "Select all normative statements",
        make() {
          const nN = U.randInt(1, 4), nP = 5 - nN;
          const opts = [
            ...U.deal("pn-norm", NORM, nN).map(t => ({ t, ok: true, why: "Value judgment, so normative." })),
            ...U.deal("pn-pos-c", POS.concat(POS_FALSE.slice(4)), nP).map(t => ({ t, ok: false, why: posWhy(t) })),
          ];
          if (nP >= 2 && Math.random() < 0.5) { const b = U.pick(BELIEF); opts[opts.length - 1] = { t: b.t, ok: false, why: "Positive: " + b.why }; }
          return Q.multi({
            q: "<p>Select <b>every</b> normative statement. There may be one or several.</p>", options: opts,
            sol: S("Check each statement separately: is it a claim about how the world is (testable) or about how it ought to be (values)?",
              "Normative signals include <em>should, ought, fair, deserve, too high, better, worth it</em>. Reports of opinions and false factual claims are still positive."),
          });
        },
      },
      {
        name: "True or false: what positive means",
        make() {
          const bank = [
            { s: "A statement must be true to count as a positive statement.", v: false, why: "Positive means testable, not correct. A false factual claim is still positive." },
            { s: "Economists can disagree about positive statements.", v: true, why: "They can disagree about what the evidence shows. That disagreement can, in principle, be resolved with better data." },
            { s: "With enough data, a normative statement can be proved true or false.", v: false, why: "Normative statements rest on values. Data can inform them, but can't settle them." },
            { s: "Including a number makes a statement positive.", v: false, why: "“An unemployment rate of 5% is too high” contains a number but is a value judgment, so it is normative." },
            { s: "A prediction about the future can be a positive statement.", v: true, why: "Predictions are positive because they can be checked once the future arrives." },
            { s: "Every statement that uses the word “should” in an economics article is normative.", v: false, why: "“62% of voters say taxes should fall” uses “should,” but it reports opinions, so it is positive." },
            { s: "A normative statement can be based on a positive one.", v: true, why: "Policy arguments typically combine a testable premise (positive) with a value judgment (normative)." },
            { s: "“Unemployment is too high” is normative even though unemployment can be measured.", v: true, why: "The rate can be measured, but “too high” is a value judgment." },
          ];
          const it = U.pick(bank);
          return Q.tf({
            q: `<p>True or false: ${it.s}</p>`, truth: it.v, why: it.why,
            sol: S("Remember: positive = testable (what is), normative = value judgment (what ought to be). Truth and keywords are not the test.", (it.v ? "True. " : "False. ") + it.why),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 2 · MICRO VS MACRO
   * ============================================================ */
  const MICRO = [
    "How does a local bakery decide what price to charge for a loaf of bread?",
    "Why do some households buy health insurance with high deductibles?",
    "How would a fee on factory smoke emissions change a steel mill's output?",
    "How does a student decide how many hours to work at a part-time job?",
    "How did a frost in Florida affect the price of oranges?",
    "Why do rents near campus rise when a university admits more students?",
    "How would a city's ban on short-term rentals affect hotel prices there?",
    "How does a higher tuition rate affect enrollment at one university?",
    "Why do airlines charge more for tickets bought the day before a flight?",
    "How does a new competitor affect the profits of the only gym in town?",
    "How does a tax on cigarettes change the number of cigarettes smokers buy?",
    "How do hospitals decide how many nurses to hire?",
    "Why do farmers switch from corn to soybeans when soybean prices rise?",
    "How would stricter penalties for shoplifting affect a store's theft losses?",
    "How does the price of gasoline affect how many people buy hybrid cars?",
    "How do coffee shops decide whether to stay open an extra hour?",
    "How would a subsidy for after-school tutoring affect how much tutoring families buy?",
    "Why do wages for software engineers differ from wages for teachers?",
    "How does a family choose between renting and buying a home?",
    "How does a rise in the price of beef affect the demand for chicken?",
    "What determines the price of a used textbook on a campus resale site?",
    "How would a recycling fee change the amount of trash a household throws away?",
  ];
  const MACRO = [
    "Why did the overall price level in the country rise 4% last year?",
    "What causes the national unemployment rate to climb during recessions?",
    "How fast did the country's total output (real GDP) grow this year?",
    "How would a cut in federal income-tax rates affect total spending in the economy?",
    "Why do some countries grow richer over decades while others stagnate?",
    "How does the central bank's interest-rate policy affect inflation?",
    "What happens to national employment when the government increases total spending?",
    "Why is the U.S. inflation rate higher than Japan's?",
    "How large is the federal budget deficit as a share of GDP?",
    "What causes economy-wide booms and recessions?",
    "How does the size of the national debt affect long-run economic growth?",
    "What explains the average standard of living across the entire country?",
    "How much did total national tax revenue change after the tax reform?",
    "How does the overall labor-force participation rate change during a recession?",
    "Why did the average price of all goods and services rise faster this decade than last?",
    "How does a stronger dollar affect the country's total exports and imports?",
    "What is the economy-wide rate of productivity growth?",
    "How does a nationwide stimulus payment affect total consumer spending?",
    "What is the unemployment rate for the country as a whole?",
    "How do changes in the money supply affect the general price level?",
  ];
  /* giant firms / whole industries: still micro */
  const BIG = [
    "how the nation's largest online retailer, with over a million workers, decides how fast to deliver packages",
    "how the entire U.S. airline industry responds to higher jet-fuel prices",
    "why the market for health care in the U.S. has rising prices",
    "how the world's biggest smartphone maker sets the price of its newest model",
    "how the whole automobile industry decides how many electric cars to produce",
    "how the national market for college education responds to rising tuition",
    "how the country's largest bank decides what interest rate to charge on car loans",
    "how the trillion-dollar oil industry decides how much oil to pump",
    "how the entire fast-food industry reacts to a higher price of beef",
  ];
  const PAIRS = [
    { topic: "taxes", mi: "How would a 50-cent tax on bottled water change how much bottled water people buy?", ma: "How would a 10% cut in all federal income taxes affect total spending and national employment?" },
    { topic: "jobs", mi: "Why did a car factory in Kokomo lay off 300 workers?", ma: "Why did the national unemployment rate rise from 4% to 6%?" },
    { topic: "prices", mi: "Why did the price of avocados jump this spring?", ma: "Why did the overall inflation rate jump this spring?" },
    { topic: "growth", mi: "Why is the local solar-panel installer growing faster than its competitors?", ma: "Why is the country's real GDP growing faster than last year?" },
    { topic: "wages", mi: "Why do nurses earn more than child-care workers?", ma: "Why has the average wage across the whole economy failed to keep up with inflation?" },
    { topic: "interest rates", mi: "How does a credit union decide what rate to pay on savings accounts?", ma: "How do changes in the central bank's interest rates affect inflation nationwide?" },
    { topic: "spending", mi: "How does a family decide how much of its income to spend on groceries?", ma: "Why did total consumer spending in the economy fall last quarter?" },
  ];
  const genMicroMacro = STUDY.makeGenerator({
    id: "b251-m1-micromacro",
    name: "Micro vs. macro",
    blurb: "Decide whether a question is about individual decision makers and markets or about the economy as a whole.",
    variants: [
      {
        name: "Sort questions (drop-down)",
        make() {
          const nMi = U.randInt(2, 3);
          const items = [
            ...U.deal("mm-mi", MICRO, nMi).map(t => ({ t, cat: "Microeconomics", why: "About one decision maker or one market." })),
            ...U.deal("mm-ma", MACRO, 5 - nMi).map(t => ({ t, cat: "Macroeconomics", why: "About an economy-wide total or average." })),
          ];
          return Q.classify({
            q: "<p>Classify each question as <b>microeconomics</b> or <b>macroeconomics</b>.</p>",
            cats: ["Microeconomics", "Macroeconomics"], items,
            sol: S("Ask what level the question looks at: one household, firm or market, or the whole economy added up?",
              "Prices of particular goods, single firms and particular industries are micro. The overall price level (inflation), national unemployment, GDP and national budgets are macro."),
          });
        },
      },
      {
        name: "Pick the macro question",
        make() {
          const right = U.deal("mm-ma", MACRO, 1)[0];
          const wrong = U.deal("mm-mi", MICRO, 3).map(t => ({ t, why: "This is about one decision maker or one market, so it is microeconomics." }));
          return Q.mc({
            q: "<p>Which question would a <b>macroeconomist</b> most likely study?</p>", right, wrong,
            rightWhy: "It concerns the economy as a whole.",
            sol: S("Macroeconomics looks at the economy as a whole: total output, the overall price level, national unemployment, growth.",
              "Three options focus on a specific firm, household or market. The remaining one is about an economy-wide total."),
          });
        },
      },
      {
        name: "Huge firm or whole industry",
        make() {
          const b = U.pick(BIG);
          return Q.mc({
            q: `<p>An economist studies ${b}. Which branch of economics is this?</p>`,
            right: "Microeconomics: one firm or one industry is still a part of the economy.",
            wrong: [
              { t: "Macroeconomics: the firm or industry is so large it affects the whole economy.", why: "Size doesn't change the level of analysis. One firm or one market, however big, is micro." },
              { t: "Macroeconomics: anything involving billions of dollars is macro.", why: "Dollar amounts don't decide the branch. Macro is about economy-wide totals like GDP, inflation and national unemployment." },
              { t: "Neither: businesses are studied in business school, not economics.", why: "How firms and industries make decisions is a core part of microeconomics." },
            ],
            keepOrder: false,
            sol: S("Ignore the size of the numbers. Ask whether the question is about one decision maker or market, or about the whole economy.",
              "A single firm or a single industry is still one part of the economy, so this is <b>microeconomics</b>."),
          });
        },
      },
      {
        name: "Same topic, two levels",
        make() {
          const p = U.pick(PAIRS);
          const askMicro = Math.random() < 0.5;
          const target = askMicro ? "microeconomic" : "macroeconomic";
          const right = askMicro ? p.mi : p.ma, other = askMicro ? p.ma : p.mi;
          return Q.mc({
            q: `<p>Both questions below are about <b>${p.topic}</b>. Which one is <b>${target}</b>?</p>`,
            right,
            wrong: [
              { t: other, why: askMicro ? "This looks at an economy-wide total, so it is macro." : "This looks at one market or decision maker, so it is micro." },
              { t: "Both, because they are about the same topic.", why: "The topic doesn't decide the branch. The level of analysis does." },
              { t: "Neither, because they both involve government or money.", why: "Government and money appear in both branches. What matters is one market versus the whole economy." },
            ],
            sol: S(`The same subject (${p.topic}) can be studied at either level. Look at the scope of each question.`,
              "One product, firm, occupation or household → micro. Nationwide totals and averages (inflation, unemployment rate, GDP, total spending) → macro."),
          });
        },
      },
      {
        name: "Select all macro questions",
        make() {
          const nMa = U.randInt(1, 4);
          const opts = [
            ...U.deal("mm-ma", MACRO, nMa).map(t => ({ t, ok: true, why: "Economy-wide, so macro." })),
            ...U.deal("mm-mi", MICRO, 5 - nMa).map(t => ({ t, ok: false, why: "One decision maker or market, so micro." })),
          ];
          if (5 - nMa >= 2 && Math.random() < 0.5) opts[opts.length - 1] = { t: "A study of " + U.pick(BIG) + ".", ok: false, why: "A huge firm or whole industry is still micro." };
          return Q.multi({
            q: "<p>Select <b>every</b> question that belongs to <b>macroeconomics</b>.</p>", options: opts,
            sol: S("Check each question's scope: the whole economy, or one part of it?",
              "Only questions about economy-wide totals and averages, such as inflation, national unemployment, GDP and national debt, are macro. Large firms and whole industries are still micro."),
          });
        },
      },
      {
        name: "Which is NOT micro?",
        make() {
          const right = U.deal("mm-ma", MACRO, 1)[0];
          const wrong = U.deal("mm-mi", MICRO, 2).map(t => ({ t, why: "One market or decision maker, so micro." }));
          wrong.push({ t: "A study of " + U.pick(BIG) + ".", why: "However large, one firm or industry is still micro." });
          return Q.mc({
            q: "<p>Three of these are microeconomic topics. Which one is <b>NOT</b>?</p>", right, wrong,
            rightWhy: "It is about the whole economy, so it is macro.",
            sol: S("Watch out for the big-sounding option. Size doesn't make a question macro.",
              "The only option about an economy-wide total or average is the macro one."),
          });
        },
      },
      {
        name: "What separates micro from macro",
        make() {
          const bank = [
            {
              q: "What is the best way to tell a microeconomic question from a macroeconomic one?",
              right: "Whether it studies individual decision makers and particular markets, or the economy as a whole.",
              wrong: [
                { t: "Whether the dollar amounts involved are small or large.", why: "A trillion-dollar industry is still micro." },
                { t: "Whether it involves the government or private businesses.", why: "Both branches study government. A tax on one product is micro, while national tax policy is macro." },
                { t: "Whether it is about money or about non-money choices.", why: "Both branches deal with money and with choices that don't involve it." },
              ],
            },
            {
              q: "Which list contains only macroeconomic topics?",
              right: "Inflation, the national unemployment rate, real GDP growth.",
              wrong: [
                { t: "Pollution from one factory, crime prevention in a city, the price of health insurance.", why: "These are particular decisions and markets, so they are micro." },
                { t: "The airline industry, the largest retailer's prices, the market for nurses.", why: "Industries and markets, however big, are micro." },
                { t: "Inflation, a household's grocery budget, GDP.", why: "A household's grocery budget is micro, so this list is mixed." },
              ],
            },
            {
              q: "Which list contains only microeconomic topics?",
              right: "A firm's hiring decision, the market for college education, a city's pollution fee on factories.",
              wrong: [
                { t: "National unemployment, the price of one brand of cereal, inflation.", why: "National unemployment and inflation are macro, so this list is mixed." },
                { t: "GDP growth, the federal budget deficit, the overall price level.", why: "These are all economy-wide, so they are macro." },
                { t: "The national debt, a bakery's prices, total national tax revenue.", why: "The national debt and total tax revenue are macro." },
              ],
            },
          ];
          const it = U.pick(bank);
          return Q.mc({
            q: `<p>${it.q}</p>`, right: it.right, wrong: it.wrong,
            sol: S("The dividing line is the level of analysis, not the subject, the size, or who is involved.",
              "Micro covers individuals, households, firms and particular markets. Macro covers economy-wide totals and averages."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 3 · OPPORTUNITY COST
   * ============================================================ */
  const SAT_ALTS = [
    { t: "work an extra shift at the campus bookstore", money: true },
    { t: "help a friend move", money: false },
    { t: "study for a midterm", money: false },
    { t: "go hiking at a state park", money: false },
    { t: "drive for a delivery app", money: true },
    { t: "babysit for a neighbor", money: true },
    { t: "go to a football game", money: false },
    { t: "catch up on sleep", money: false },
    { t: "tutor a high-school student", money: true },
    { t: "volunteer at an animal shelter", money: false },
  ];
  const genOppCost = STUDY.makeGenerator({
    id: "b251-m1-oppcost",
    name: "Opportunity cost",
    blurb: "Find the value of the next-best alternative, including time and earnings forgone, and see why “free” is never free.",
    variants: [
      {
        name: "Best forgone alternative ($)",
        make() {
          const [n] = names(1);
          const k = U.randInt(3, 4);
          const alts = U.sample(SAT_ALTS, k);
          const vals = distinct(k, 20, 140, 5).sort((a, b) => b - a);
          const chosen = 0; // highest valued option is chosen
          const order = U.shuffle(alts.map((a, i) => ({ t: a.t, v: vals[i], chosen: i === chosen })));
          const forgone = vals.slice(1);
          const ans = forgone[0];
          const rows = order.map(o => `<tr><td>${o.t}</td><td>${U.money(o.v)}</td></tr>`).join("");
          const chosenAlt = order.find(o => o.chosen);
          const traps = [
            { value: forgone.reduce((a, b) => a + b, 0), why: "That adds up every alternative. You could only have done one of them, so count only the best one." },
            { value: vals[0], why: "That is the value of what was chosen, not of what was given up." },
            { value: forgone[forgone.length - 1], why: "That is the <em>least</em> valuable alternative. Opportunity cost is the <em>best</em> one forgone." },
          ];
          if (vals[0] - ans !== ans) traps.push({ value: vals[0] - ans, why: "That is the net gain from the choice (value minus opportunity cost), not the opportunity cost itself." });
          return Q.num({
            q: `<p>${n} has a free Saturday afternoon and can do exactly one of these. Each is worth the amount shown to ${n} (in earnings or in enjoyment):</p>
<table class="data-tbl"><tr><th>Option</th><th>Value to ${n}</th></tr>${rows}</table>
<p>${n} chooses to <b>${chosenAlt.t}</b>. What is the opportunity cost of that choice?</p>`,
            answer: ans, unit: "$", traps,
            sol: S("Opportunity cost is the value of the <em>single</em> best alternative given up, not the sum of all of them.",
              `Cross out the chosen option. The remaining values are ${forgone.map(v => U.money(v)).join(", ")}.`,
              `The best of those is <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Money spent + time forgone ($)",
        make() {
          const [n] = names(1);
          const sc = U.pick(["trip", "course", "game"]);
          let q, ans, explicit, anyway, forgone, lines;
          const wage = U.pick([12, 14, 15, 16, 18, 20]);
          if (sc === "trip") {
            const gas = U.randInt(4, 12) * 10, hotel = U.randInt(8, 20) * 10, ticket = U.randInt(5, 15) * 10;
            const hours = U.pick([8, 10, 12, 16]); anyway = U.randInt(3, 8) * 10;
            explicit = gas + hotel + ticket; forgone = hours * wage;
            lines = [`Concert ticket: ${U.money(ticket)}`, `Gas: ${U.money(gas)}`, `Hotel: ${U.money(hotel)}`, `Food for the weekend: ${U.money(anyway)} (${n} would spend the same on food at home)`, `${n} must skip ${hours} hours of work at ${U.money(wage)} per hour`];
            q = `${n} is deciding whether to take a weekend trip to a music festival. The costs are:`;
          } else if (sc === "course") {
            const tuition = U.randInt(10, 20) * 100, books = U.randInt(8, 25) * 10;
            const weeks = U.pick([6, 8, 10]), hpw = U.pick([20, 25, 30]);
            anyway = U.randInt(6, 12) * 100;
            explicit = tuition + books; forgone = weeks * hpw * wage;
            lines = [`Tuition: ${U.money(tuition)}`, `Books: ${U.money(books)}`, `Rent for the summer: ${U.money(anyway)} (${n} pays this lease whether or not ${n} takes the course)`, `${n} would give up a summer job: ${hpw} hours a week for ${weeks} weeks at ${U.money(wage)} per hour`];
            q = `${n} is deciding whether to take a summer course. The costs are:`;
          } else {
            const ticket = U.randInt(4, 12) * 10, parking = U.randInt(2, 4) * 5;
            const hours = U.pick([3, 4, 5]); anyway = U.randInt(2, 4) * 5;
            explicit = ticket + parking; forgone = hours * wage;
            lines = [`Ticket: ${U.money(ticket)}`, `Parking: ${U.money(parking)}`, `Dinner: ${U.money(anyway)} (${n} would eat the same dinner at home for the same price)`, `${n} would skip a ${hours}-hour shift at ${U.money(wage)} per hour`];
            q = `${n} is deciding whether to go to a basketball game. The costs are:`;
          }
          ans = explicit + forgone;
          return Q.num({
            q: `<p>${q}</p>${ul(lines)}<p>What is the total opportunity cost of the choice?</p>`,
            answer: ans, unit: "$",
            traps: [
              { value: ans + anyway, why: "That includes a cost that would be paid anyway. Spending that doesn't change with the choice is not part of its cost." },
              { value: explicit, why: "That counts only the money spent. The earnings given up are part of the opportunity cost too." },
              { value: explicit + anyway, why: "That counts money spent (including a cost paid anyway) but leaves out the forgone earnings." },
              { value: forgone, why: "That counts only the forgone earnings. The money spent could also have bought something else." },
            ],
            sol: S("Opportunity cost includes everything given up <em>because of this choice</em>: money spent plus the value of the time. Leave out anything paid either way.",
              `Money spent because of the choice: ${U.money(explicit)}. Forgone earnings: ${U.money(forgone)}. The ${U.money(anyway)} is paid either way, so leave it out.`,
              `Total: ${U.money(explicit)} + ${U.money(forgone)} = <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Ranked choices: what is the next-best?",
        make() {
          const [n] = names(1);
          const acts = U.sample(["see a movie", "go bowling", "study at the library", "work a paid shift", "play pickup basketball", "cook dinner with friends", "go to a trivia night", "visit family"], 4);
          const soldOut = Math.random() < 0.45;
          const list = acts.map((a, i) => `<li>${i + 1}. ${a}</li>`).join("");
          const chosen = soldOut ? acts[1] : acts[0];
          const right = soldOut ? acts[2] : acts[1];
          const note = soldOut ? `<p>When ${n} checks, the first choice turns out to be impossible tonight (everything is sold out / closed), so ${n} goes with “${acts[1]}”.</p>` : `<p>${n} goes with “${acts[0]}”.</p>`;
          const wrong = soldOut ? [
            { t: `Giving up “${acts[0]}”`, why: "That option was not available, so it was not given up by this choice. Opportunity cost only counts alternatives you could actually have chosen." },
            { t: `Giving up “${acts[2]}”, “${acts[3]}” and “${acts[0]}” together`, why: "Opportunity cost is the single best available alternative, not all of them." },
            { t: `Giving up “${acts[3]}”`, why: "That is the lowest-ranked option, not the next-best." },
          ] : [
            { t: `Giving up “${acts[2]}” and “${acts[3]}” and “${acts[1]}” together`, why: "Opportunity cost is the single best alternative, not all of them combined." },
            { t: `Giving up “${acts[3]}”`, why: "That is the lowest-ranked option, not the next-best." },
            { t: "Nothing, because the evening was free.", why: "Time is scarce. Choosing one activity always means giving up the best other use of that time." },
          ];
          return Q.mc({
            q: `<p>For tonight, ${n} ranks these options from most to least preferred (only one is possible):</p><ul>${list}</ul>${note}<p>What is the opportunity cost of ${n}'s choice?</p>`,
            right: `Giving up “${right}”`, wrong,
            sol: S("Opportunity cost is the <em>highest-valued alternative you could actually have chosen</em> but didn't.",
              soldOut ? `The first choice wasn't available, so it is not a forgone opportunity. ${n} chose #2, and the best remaining option is #3.` : `${n} chose #1, so the next-best alternative is #2.`,
              `So the opportunity cost is “${right}”.`),
          });
        },
      },
      {
        name: "Predict the change in opportunity cost",
        make() {
          const [n] = names(1);
          const hours = U.pick([3, 4, 5]);
          let w = U.pick([12, 14, 15, 16, 18]);
          let other = U.randInt(4, 14) * 5;
          const otherName = U.pick(["a pickup soccer game", "a long nap", "a coffee date", "a video-game session"]);
          const before = Math.max(w * hours, other);
          const kind = U.pick(["raise", "cut", "otherUp", "otherUp", "fired"]);
          let story, w2 = w, other2 = other;
          if (kind === "raise") { w2 = w + U.pick([2, 4, 6, 8]); story = `${n}'s employer raises the pay to ${U.money(w2)} per hour.`; }
          else if (kind === "cut") { w2 = w - U.pick([2, 3, 4]); story = `${n}'s employer cuts the pay to ${U.money(w2)} per hour.`; }
          else if (kind === "fired") { w2 = 0; story = `The store closes permanently, so the shift is no longer an option.`; }
          else { other2 = other + U.pick([5, 10, 15, 25, 40]); story = `${n} now values the other activity at ${U.money(other2)} instead of ${U.money(other)}.`; }
          const after = Math.max(w2 * hours, other2);
          if (after === before && w2 * hours === other2) return this.make();
          if (w * hours === other) return this.make();
          const right = after > before ? "It increases." : after < before ? "It decreases." : "It stays the same.";
          const all = ["It increases.", "It decreases.", "It stays the same."];
          const whyMap = {
            "It increases.": "The best forgone alternative did not become more valuable here.",
            "It decreases.": "The best forgone alternative did not become less valuable here.",
            "It stays the same.": "The value of the best forgone alternative changed, so the opportunity cost changed.",
          };
          if (right !== "It stays the same.") whyMap["It stays the same."] = "The value of the best forgone alternative changed, so the opportunity cost changed.";
          else { whyMap["It increases."] = "The option that changed was not the next-best one, before or after, so the opportunity cost is unchanged."; whyMap["It decreases."] = whyMap["It increases."]; }
          return Q.mc({
            q: `<p>${n} attends a ${hours}-hour Saturday review session. ${n}'s alternatives were a ${hours}-hour work shift at ${U.money(w)} per hour, or ${otherName} worth ${U.money(other)} to ${n}.</p><p>Then: ${story} ${n} still attends the review session. What happens to the <b>opportunity cost</b> of attending?</p>`,
            right, wrong: all.filter(x => x !== right).map(t => ({ t, why: whyMap[t] })), keepOrder: true,
            sol: S("Opportunity cost is the value of the best alternative given up. Find the best alternative before and after the change.",
              `Before: shift = ${U.money(w * hours)}, other = ${U.money(other)}, so opportunity cost = ${U.money(before)}.`,
              `After: shift = ${U.money(w2 * hours)}, other = ${U.money(other2)}, so opportunity cost = ${U.money(after)}. ${right}`),
          });
        },
      },
      {
        name: "“Free” is not free ($)",
        make() {
          const [n] = names(1);
          const ev = U.pick(["a concert", "a playoff game", "a comedy show", "a theme-park day"]);
          let face = U.randInt(6, 20) * 10;
          const hours = U.pick([4, 5, 6]), wage = U.pick([13, 15, 16, 18, 20]);
          const shift = hours * wage;
          let other = U.randInt(4, 20) * 5;
          if (other === shift) other += 5;
          const ans = Math.max(shift, other);
          if (face === ans || face === shift + other) face += 5;
          return Q.num({
            q: `<p>A friend gives ${n} a free ticket to ${ev} (face value ${U.money(face)}). The ticket is in ${n}'s name and <b>cannot be resold</b>. Going takes ${hours} hours. Otherwise ${n} would either work a ${hours}-hour shift at ${U.money(wage)} per hour or spend the time on a hobby worth ${U.money(other)} to ${n}.</p><p>What is the opportunity cost of going?</p>`,
            answer: ans, unit: "$",
            traps: [
              { value: 0, why: "The ticket was free, but the time was not. TANSTAAFL: there is no such thing as a free lunch." },
              { value: face, why: "The face value is irrelevant: the ticket can't be resold, so going doesn't give up that money." },
              { value: shift + other, why: "The shift and the hobby use the same hours, so only the better one is given up." },
            ],
            sol: S("A zero price does not mean a zero opportunity cost. What does going actually make " + n + " give up?",
              `The ticket can't be sold, so its face value isn't forgone. What is forgone is the time: the shift (${U.money(shift)}) or the hobby (${U.money(other)}).`,
              `Opportunity cost = the better of the two = <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Reverse: which alternative is impossible?",
        make() {
          const [n] = names(1);
          const oc = U.randInt(8, 20) * 5;
          const lows = distinct(2, 10, oc - 5, 5);
          const high = oc + U.randInt(2, 8) * 5;
          const acts = U.sample(["a tutoring gig paying", "a road trip worth", "a paid survey study paying", "a concert worth", "a day of overtime paying", "a cooking class worth", "a yard-work job paying"], 4);
          return Q.mc({
            q: `<p>${n} spent Sunday at a volunteer clean-up and correctly says the opportunity cost was <b>${U.money(oc)}</b>. Which of these could <b>NOT</b> have been one of the Sunday options ${n} gave up?</p>`,
            right: `${acts[0]} ${U.money(high)}`,
            wrong: [
              { t: `${acts[1]} ${U.money(lows[0])}`, why: "An alternative worth less than the opportunity cost could easily have been one of the options given up. It just wasn't the best one." },
              { t: `${acts[2]} ${U.money(lows[1])}`, why: "Lower-valued alternatives are consistent with the stated opportunity cost." },
              { t: `${acts[3]} ${U.money(oc)}`, why: "This could be exactly the next-best alternative. Its value equals the opportunity cost." },
            ],
            rightWhy: `If an option worth ${U.money(high)} had been given up, the opportunity cost would be at least ${U.money(high)}, not ${U.money(oc)}.`,
            sol: S("Opportunity cost is the value of the <em>best</em> alternative forgone, so every forgone alternative is worth no more than it.",
              `So no forgone option can be worth more than ${U.money(oc)}.`,
              `The option worth ${U.money(high)} is the impossible one.`),
          });
        },
      },
      {
        name: "Opportunity cost of public choices",
        make() {
          const bank = [
            { s: "A city spends $3 million of its budget building a new skate park.", right: "The most valuable other project the city could have funded with that $3 million (for example, repaving roads, if that was the best alternative).",
              wrong: [{ t: "Zero, because residents get to use the skate park for free.", why: "Free use doesn't erase the cost. The resources could have done something else." },
                { t: "The total value of every other project the $3 million could have funded.", why: "The money could only fund one alternative. Count only the best one." },
                { t: "The $3 million is the benefit of the park, not a cost.", why: "Spending is a cost: those funds are given up for other uses." }] },
            { s: "A state university decides to use a large empty lot for a new research lab.", right: "The value of the best other use of that lot, such as student housing if that was the next-best option.",
              wrong: [{ t: "Nothing, because the university already owns the land.", why: "Owning the land doesn't make it free to use. Using it here means giving up its best other use." },
                { t: "The value of the lab once it is built.", why: "That is the benefit of the choice, not what is given up." },
                { t: "The sum of the values of all possible uses of the lot.", why: "The lot can only be used one way. Opportunity cost is the single best alternative." }] },
            { s: "The federal government increases funding for research on a new vaccine.", right: "The most valuable alternative use of those funds and scientists' time, such as research on a different disease.",
              wrong: [{ t: "Zero, if the money comes from taxes rather than from the researchers.", why: "Tax money still has alternative uses. Someone gives up something." },
                { t: "The number of lives the vaccine will save.", why: "That is a benefit, not a cost." },
                { t: "Only the salaries of the scientists, since the lab already exists.", why: "Opportunity cost is about the best alternative use of all the resources, not just the new cash outlay." }] },
            { s: "A town lets residents park for free on Main Street instead of charging for spots.", right: "The best alternative use of that curb space or the revenue it could have earned, such as parking fees that could fund street repairs.",
              wrong: [{ t: "Nothing, since drivers pay $0.", why: "A zero price doesn't mean zero cost. The curb space has other valuable uses." },
                { t: "The total of every possible use of the street.", why: "Only the best forgone use counts." },
                { t: "The cost of painting the parking lines only.", why: "That's an expense, but it misses the bigger forgone opportunity." }] },
            { s: "A school district uses its gym on weeknights for adult basketball leagues.", right: "The best alternative use of the gym on those nights, such as renting it to a youth club, if that was the next-best option.",
              wrong: [{ t: "Nothing, because the gym would otherwise sit empty.", why: "That is only true if there is truly no other use. The question says other uses exist." },
                { t: "The value the players get from the league.", why: "That's the benefit, not the cost." },
                { t: "The combined value of every other group that wanted the gym.", why: "Only one group could use it. Count the best alternative only." }] },
          ];
          const it = U.pick(bank);
          return Q.mc({
            q: `<p>${it.s} What is the opportunity cost of this decision?</p>`, right: it.right, wrong: it.wrong,
            sol: S("TANSTAAFL applies to governments and organizations too: using resources one way means they can't be used another way.",
              "The opportunity cost is the single most valuable alternative use of those resources, not zero and not the sum of all alternatives."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 4 · SCARCITY, CHOICE, TRADEOFFS
   * ============================================================ */
  const STRAT = [
    "A gas station on a busy corner decides whether to cut its price after seeing that the station across the street just did.",
    "Two candidates for student government each decide which issue to campaign on, knowing the other will react.",
    "A soccer penalty kicker chooses which side to aim for, guessing where the goalie will dive.",
    "A streaming service sets its subscription price after its main rival announces a price increase.",
    "In a group project, a student decides how much effort to put in based on how hard she expects her teammates to work.",
    "One of only two airlines on a route decides whether to add more flights, anticipating the other airline's response.",
    "A bidder in a sealed-bid auction decides how much to bid, thinking about what other bidders will offer.",
    "Two food trucks decide where to park at a festival, each trying to predict where the other will set up.",
    "A poker player decides whether to bluff based on how she thinks her opponents will read her.",
    "A chess player chooses a move by thinking about how the opponent will respond.",
    "Two coffee shops on the same block each decide whether to open earlier, knowing the other may follow.",
    "A job candidate decides what salary to ask for, predicting how the employer will counter.",
    "A union decides how high a wage to demand, anticipating the company's response.",
    "Two countries each decide whether to raise tariffs, expecting the other to retaliate.",
  ];
  const NONSTRAT = [
    "A shopper buys gas at the posted price because her tank is nearly empty.",
    "A student decides how many hours to study based on how much her grade improves with each hour.",
    "A wheat farmer, one of thousands, decides how much wheat to plant given the market price.",
    "A retiree decides how much of his pension to save each month based on his own budget.",
    "A worker decides whether to take an online coding course based on its cost and the raise it might bring.",
    "A family chooses a grocery store because it is the closest one with the items they need.",
    "A college student buys a winter coat because the weather forecast calls for snow.",
    "A homeowner decides whether to replace old windows based on the heating bills she would save.",
    "A runner decides to buy new shoes because her old pair is worn out.",
    "A diner chooses the pasta over the steak because he prefers it at the listed prices.",
    "A commuter decides to bike instead of drive after gas prices rise.",
    "A small apple orchard sells its apples at the going price at the farmers' market.",
    "A renter chooses a cheaper apartment farther from campus to save money.",
    "A teenager decides how many hours to babysit based on the hourly pay and her free time.",
  ];
  const genScarcity = STUDY.makeGenerator({
    id: "b251-m1-scarcity",
    name: "Scarcity, choice and tradeoffs",
    blurb: "What scarcity is (and is not), economics as the study of choice, strategic vs. non-strategic choices, and tradeoffs over time.",
    variants: [
      {
        name: "Scarcity vs. shortage vs. poverty",
        make() {
          const right = U.pick([
            "Scarcity exists whenever resources are not enough to satisfy all wants, even if store shelves are full.",
            "Every person, business and country faces scarcity, no matter how rich.",
            "Scarcity is permanent, while a shortage is a temporary market situation.",
            "Scarcity forces people to choose, and every choice has an opportunity cost.",
            "Even time is scarce: everyone has only 24 hours in a day.",
          ]);
          const wrongBank = [
            { t: "Scarcity only exists when a store runs out of a product.", why: "Running out is a <em>shortage</em>, a temporary market situation. Scarcity exists even with full shelves." },
            { t: "Scarcity is just another word for poverty.", why: "Wealthy people and countries face scarcity too: time and resources are always limited relative to wants." },
            { t: "If prices fall low enough, scarcity disappears.", why: "Lower prices don't create more resources. Wants still exceed what can be produced." },
            { t: "A rich country has solved the problem of scarcity.", why: "Rich countries still must choose how to use limited resources. Wants keep growing." },
            { t: "Scarcity applies to goods you buy with money, but not to time.", why: "Time is perhaps the scarcest resource of all." },
            { t: "New technology will eventually eliminate scarcity.", why: "Technology lets us produce more, but wants remain unlimited, so choices are still needed." },
          ];
          return Q.mc({
            q: "<p>Which statement about <b>scarcity</b> is correct?</p>", right, wrong: U.sample(wrongBank, 3),
            sol: S("Scarcity is the gap between limited resources and unlimited wants. It is universal and permanent.",
              "A shortage (a store running out) and poverty (low income) are different ideas. Neither one is required for scarcity."),
          });
        },
      },
      {
        name: "Does the rich person face scarcity?",
        make() {
          const who = U.pick([
            "a tech billionaire who owns three homes and a private jet",
            "a lottery winner who just received $200 million",
            "a famous athlete earning $40 million a year",
            "the oil-rich government of a small country with a huge budget surplus",
            "a movie star with more money than she could spend in ten lifetimes",
          ]);
          return Q.mc({
            q: `<p>Does ${who} face scarcity?</p>`,
            right: "Yes: time, attention and resources are still limited relative to wants, so choices with opportunity costs remain.",
            wrong: [
              { t: "No: scarcity only affects people who can't afford what they want.", why: "That confuses scarcity with poverty." },
              { t: "No: with enough money, every want can be satisfied.", why: "Money can't buy more than 24 hours a day, and wants expand as income rises." },
              { t: "Only if a shortage occurs in a market they buy from.", why: "That confuses scarcity with a shortage. Scarcity is permanent and universal." },
            ],
            sol: S("Scarcity isn't about being poor. It is about limited resources (including time) compared with unlimited wants.",
              "Even with enormous wealth, every hour spent one way can't be spent another way, so choices and opportunity costs remain. <b>Yes.</b>"),
          });
        },
      },
      {
        name: "Strategic or non-strategic? (drop-down)",
        make() {
          const nS = U.randInt(2, 3);
          const items = [
            ...U.deal("sc-st", STRAT, nS).map(t => ({ t, cat: "Strategic", why: "The best choice depends on what someone else decides." })),
            ...U.deal("sc-ns", NONSTRAT, 5 - nS).map(t => ({ t, cat: "Non-strategic", why: "Based on own costs and benefits or market conditions, not on predicting a rival's move." })),
          ];
          return Q.classify({
            q: "<p>Classify each choice as <b>strategic</b> or <b>non-strategic</b>.</p>", cats: ["Strategic", "Non-strategic"], items,
            sol: S("Ask: does this decision maker need to anticipate how a specific other person or rival will act or react?",
              "If yes, it is strategic (the subject of game theory). If the choice depends only on one's own costs and benefits and on market prices, it is non-strategic."),
          });
        },
      },
      {
        name: "Choices today shape tomorrow",
        make() {
          const [n] = names(1);
          const right = U.pick([
            `${n} skips a $400 concert trip this month and puts the money in a savings account for a car next year.`,
            `${n} spends evenings in a certification course instead of watching TV, hoping to qualify for a better-paying job.`,
            `${n} quits vaping, giving up something she enjoys now in exchange for better health later.`,
            `${n} takes on extra credit hours this year to graduate a semester early and start earning sooner.`,
            `${n} buys a cheaper used car so she can invest the difference for retirement.`,
            `${n} works out three mornings a week instead of sleeping in, to lower health risks later in life.`,
          ]);
          const wrong = U.sample([
            { t: `${n} chooses tacos instead of pizza for tonight's dinner.`, why: "Both options are consumed tonight. This tradeoff doesn't involve the future." },
            { t: `${n} picks a blue shirt instead of a green one that costs the same.`, why: "A same-day choice between similar goods involves no tradeoff over time." },
            { t: `${n} watches a comedy instead of a thriller on Friday night.`, why: "This is a tradeoff within the same evening, not between today and the future." },
            { t: `${n} buys store-brand cereal instead of the name brand this week.`, why: "A small tradeoff today with no meaningful effect on future options." },
            { t: `${n} decides to walk instead of taking the bus to a friend's house this afternoon.`, why: "This is a tradeoff right now. Nothing is being given up today to gain tomorrow." },
          ], 3);
          return Q.mc({
            q: "<p>Which choice most clearly shows a tradeoff between <b>today and the future</b>?</p>", right, wrong,
            rightWhy: "It gives up some current enjoyment or money in exchange for better options later.",
            sol: S("Every option involves a tradeoff. Look for the one where something is given up <em>now</em> to change what happens <em>later</em>.",
              "Saving, education and health habits are classic examples: today's choices affect tomorrow's well-being and tomorrow's choices."),
          });
        },
      },
      {
        name: "Select all economic questions",
        make() {
          const ECON = [
            "How should a student divide 20 free hours a week between studying and a part-time job?",
            "Should a couple have dinner with friends or spend the evening alone together?",
            "How does a hospital decide which patients get the one available ICU bed first?",
            "Should a retiree spend her mornings volunteering or gardening?",
            "How many hours of sleep should a student trade for extra study time before an exam?",
            "How does a nonprofit decide whether to spend volunteer hours on fundraising or service?",
            "Should a family move to a bigger house farther from work or stay in a smaller one nearby?",
            "Should a city use an empty lot for a park or for affordable housing?",
            "How does a student choose which two of five interesting electives to take?",
            "How does a person decide how much time to spend on social media each day?",
          ];
          const NON = [
            "At what temperature does water boil at sea level?",
            "What is the chemical symbol for gold?",
            "How many moons does Mars have?",
            "In what year did the first person walk on the Moon?",
            "What is the square root of 144?",
            "How far is the Earth from the Sun?",
          ];
          const nE = U.randInt(2, 4);
          const opts = [
            ...U.deal("sc-econ", ECON, nE).map(t => ({ t, ok: true, why: "A choice about how to use scarce resources (often time), so it's an economic question, even without money." })),
            ...U.sample(NON, 5 - nE).map(t => ({ t, ok: false, why: "A question of fact with no choice involved. Economics studies how people choose under scarcity." })),
          ];
          return Q.multi({
            q: "<p>Economics is the study of choice under scarcity. Select <b>every</b> question that economic analysis could help answer.</p>", options: opts,
            sol: S("Economics isn't only about money. Ask whether each question involves choosing how to use limited resources such as time, space or effort.",
              "Questions about allocating time, attention, space or medical care are economic even when no money changes hands. Questions about natural facts involve no choice, so they aren't."),
          });
        },
      },
      {
        name: "The economic problem",
        make() {
          const bank = [
            {
              q: "Which sequence correctly links the core ideas of economics?",
              right: "Limited resources and unlimited wants → scarcity → choice → opportunity cost",
              wrong: [
                { t: "Choice → scarcity → limited resources → opportunity cost", why: "Scarcity comes first and forces choices. Choices don't create scarcity." },
                { t: "Opportunity cost → choice → scarcity → unlimited wants", why: "The order is reversed: costs arise because scarcity forces choices." },
                { t: "Shortage → poverty → scarcity → choice", why: "Shortages and poverty aren't the root of the economic problem. Limited resources versus unlimited wants is." },
              ],
            },
            {
              q: "What is <em>the economic problem</em>?",
              right: "Resources are limited but wants are unlimited, so people must choose.",
              wrong: [
                { t: "Some people don't have enough money.", why: "That describes poverty. The economic problem applies to everyone, rich and poor." },
                { t: "Stores sometimes run out of popular goods.", why: "That is a shortage, a temporary market situation." },
                { t: "Prices tend to rise over time.", why: "That is inflation, a macroeconomic topic, not the basic economic problem." },
              ],
            },
            {
              q: "Which is the best definition of <em>economics</em>?",
              right: "The study of how people use limited resources to satisfy unlimited wants, that is, how they make choices.",
              wrong: [
                { t: "The study of money and the stock market.", why: "Money is one tool. Economics studies all choices under scarcity, including time." },
                { t: "The study of how businesses maximize profit.", why: "That's one application. Economics also covers households, governments and non-money choices." },
                { t: "The study of how governments set taxes.", why: "Too narrow. Taxes are one topic among many." },
              ],
            },
            {
              q: "Why does scarcity force people to make choices?",
              right: "Because using resources for one want means those resources can't be used to satisfy another.",
              wrong: [
                { t: "Because the government limits how much people can buy.", why: "Scarcity exists with or without government limits." },
                { t: "Because prices are too high.", why: "Even at low prices, resources are limited relative to wants." },
                { t: "Because some goods are in shortage.", why: "Shortages are temporary. Scarcity is permanent and universal." },
              ],
            },
          ];
          const it = U.pick(bank);
          return Q.mc({
            q: `<p>${it.q}</p>`, right: it.right, wrong: it.wrong,
            sol: S("Start at the root: resources are limited, wants are not.",
              "That gap is scarcity, scarcity forces choices, and every choice gives up a next-best alternative (opportunity cost)."),
          });
        },
      },
      {
        name: "True or false: scarcity edge cases",
        make() {
          const bank = [
            { s: "If a grocery store has plenty of milk on its shelves, milk is not scarce.", v: false, why: "Plenty on the shelf means no shortage, but the resources used to produce milk could have made other things, and wants still exceed resources." },
            { s: "A person who wins the lottery still faces scarcity.", v: true, why: "Time and other resources remain limited relative to wants." },
            { s: "Scarcity and shortage mean the same thing.", v: false, why: "A shortage is temporary (people want more than is offered at the current price). Scarcity is permanent." },
            { s: "Choosing how to spend a free afternoon is an economic decision even if no money is involved.", v: true, why: "Time is a scarce resource, and using it one way gives up other uses." },
            { s: "Every choice involves a tradeoff.", v: true, why: "Because of scarcity, getting one thing always means giving up something else." },
            { s: "A strategic choice is one that is planned carefully in advance.", v: false, why: "In economics, strategic means the best choice depends on what <em>others</em> decide, not that it is carefully planned." },
            { s: "A wheat farmer who takes the market price as given is making a non-strategic choice.", v: true, why: "The farmer reacts to market conditions, not to the choices of a specific rival." },
            { s: "Scarcity would disappear if everyone had a high income.", v: false, why: "Scarcity is not poverty. Resources and time are still limited relative to wants." },
          ];
          const it = U.pick(bank);
          return Q.tf({
            q: `<p>True or false: ${it.s}</p>`, truth: it.v, why: it.why,
            sol: S("Keep three ideas apart: scarcity (permanent, universal), shortage (temporary, in a market) and poverty (low income).", (it.v ? "True. " : "False. ") + it.why),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 5 · MARGINAL ANALYSIS AND INCENTIVES
   * ============================================================ */
  const MARG_CTX = [
    { nu: "hours", unit: "hours of studying", u1: "hour", who: "a student", label: "Hours of studying" },
    { nu: "hours", unit: "hours of tutoring", u1: "hour", who: "a tutor", label: "Hours of tutoring" },
    { nu: "trips", unit: "trips to the gym", u1: "trip", who: "a gym member", label: "Gym trips per week" },
    { nu: "hours", unit: "extra hours open", u1: "hour", who: "a coffee shop", label: "Extra hours open" },
    { nu: "ads", unit: "online ads", u1: "ad", who: "a bike shop", label: "Online ads per week" },
    { nu: "sessions", unit: "practice sessions", u1: "session", who: "a musician", label: "Practice sessions" },
  ];
  /* strictly decreasing marginal benefits */
  function mbSeq(n, lo, hi, dlo, dhi) {
    const out = [U.randInt(lo, hi)];
    for (let i = 1; i < n; i++) out.push(out[i - 1] - U.randInt(dlo, dhi));
    return out;
  }
  const cum = arr => arr.reduce((a, x) => (a.push((a[a.length - 1] || 0) + x), a), []);
  const ordinal = k => k + (k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th");
  /* q* = number of leading units with MB > MC (assumes single crossing, no ties) */
  const optQ = (mb, mc) => { let q = 0; while (q < mb.length && mb[q] > mc[q]) q++; return q; };

  const POS_INC = [
    "A $500 scholarship for students who keep a 3.5 GPA",
    "A store gives 20% off to customers who bring a reusable bag",
    "A city pays residents $100 to replace an old toilet with a water-saving model",
    "An employer pays a bonus for every month with zero safety accidents",
    "A gym refunds part of the membership if you attend 12 times a month",
    "A tax credit for families who install solar panels",
    "A coffee shop's loyalty card gives a free drink after nine purchases",
    "A professor offers extra credit for attending review sessions",
    "Happy-hour half-price appetizers from 3 to 5 pm",
    "A government subsidy that lowers the price of electric bikes",
    "An insurance discount for drivers with no tickets",
    "Financial aid that lowers the cost of attending college",
    "A $5 credit for referring a friend to a rideshare app",
    "Free museum admission on the first Sunday of every month",
    "A raise for employees who complete a training certificate",
  ];
  const NEG_INC = [
    "A $250 fine for parking in a fire lane",
    "A 15% tax on sugary drinks",
    "A library charges $1 a day for overdue books",
    "A landlord charges a $75 fee for late rent",
    "A professor takes 10% off for each day an assignment is late",
    "A city charges a toll to drive downtown during rush hour",
    "A cell-phone plan charges extra for going over the data limit",
    "A higher tax on cigarettes",
    "A bank charges a $35 overdraft fee",
    "Points on your driver's license for speeding",
    "A deposit you lose if you cancel a hotel booking at the last minute",
    "A surcharge for checking a second bag on a flight",
    "A fee for each bag of trash beyond the first",
    "Detention for students who are repeatedly late to class",
    "A penalty for withdrawing retirement savings early",
  ];
  const RESPONSES = [
    { s: "A city doubles the fine for parking illegally downtown.", right: "Fewer drivers park illegally, and more use garages, transit or legal spots.", wrong: [
      { t: "Illegal parking stays the same, because people who park illegally are not rational.", why: "Economists assume people respond to costs. A higher expected cost of illegal parking reduces how often people do it." },
      { t: "More drivers park illegally, because the city clearly needs the money.", why: "The city's motives don't change drivers' costs. The fine raises the cost of illegal parking." },
      { t: "Nobody will ever park illegally again.", why: "Incentives shift behavior at the margin. Some people still find the benefit worth the cost." }] },
    { s: "A university starts charging $8 a day for parking that used to be free.", right: "Some students switch to biking, walking, carpooling or the bus, so fewer cars park on campus.", wrong: [
      { t: "Exactly the same number of students drive, since they need to get to class.", why: "Getting to class doesn't require driving for everyone. Some will find another way once driving costs more." },
      { t: "More students drive, because paid parking is more convenient.", why: "A higher price raises the cost of driving, which reduces driving." },
      { t: "Students stop attending class.", why: "Far too extreme. Most adjust how they travel, not whether they attend." }] },
    { s: "A grocery chain offers 30% off bakery items in the last hour before closing.", right: "More shoppers buy bakery items late in the day, and the store throws away less bread.", wrong: [
      { t: "Bakery sales fall, because discounts make people suspicious.", why: "A lower price lowers the cost to shoppers, which encourages buying." },
      { t: "Nothing changes, because people shop when it's convenient.", why: "Some shoppers on the margin will shift their timing to save 30%." },
      { t: "The store sells more bread at full price in the morning.", why: "If anything, some shoppers wait for the discount. Morning full-price sales won't rise because of it." }] },
    { s: "A state offers a $2,000 tax credit to anyone who buys an electric car.", right: "More people buy electric cars than would have otherwise.", wrong: [
      { t: "Fewer electric cars are sold, because buyers wait for the credit to grow.", why: "The credit lowers the effective price now. That encourages purchases." },
      { t: "Sales don't change, because only environmentalists buy electric cars.", why: "Some buyers on the fence will be tipped by a lower effective price." },
      { t: "Gasoline cars become illegal.", why: "A subsidy changes incentives. It doesn't ban anything." }] },
    { s: "An employer begins paying time-and-a-half for weekend shifts.", right: "More workers volunteer for weekend shifts.", wrong: [
      { t: "Fewer workers want weekends, because they have to work harder.", why: "The work is the same, but the reward is higher. That encourages more weekend work." },
      { t: "No change, because pay doesn't matter to workers.", why: "Pay is one of the benefits workers weigh. Raising it changes choices at the margin." },
      { t: "Workers quit to protest the policy.", why: "Higher pay is a positive incentive. There's no reason to expect protest." }] },
    { s: "A city introduces a $0.10 fee on every disposable shopping bag.", right: "Shoppers use fewer disposable bags and bring more reusable ones.", wrong: [
      { t: "Bag use rises, because shoppers want to get their money's worth.", why: "The fee raises the cost of each bag. A higher cost discourages use." },
      { t: "Nothing changes, since 10 cents is too small to notice.", why: "Small costs still change some people's choices at the margin. Many shoppers respond." },
      { t: "Stores stop selling groceries.", why: "Far too extreme. The fee changes bag use, not whether stores operate." }] },
    { s: "A professor announces that homework turned in late will get zero credit instead of a 10% penalty.", right: "Fewer students turn in homework late.", wrong: [
      { t: "More students turn in homework late, because the penalty is simpler.", why: "The cost of being late went up sharply, so lateness should fall." },
      { t: "No change, because students are not rational.", why: "Students respond to costs and benefits like everyone else." },
      { t: "Students stop doing homework entirely.", why: "Raising the cost of lateness encourages on-time work, not no work." }] },
    { s: "A gym cuts its monthly fee in half for students.", right: "More students sign up for memberships.", wrong: [
      { t: "Fewer students sign up, because cheaper gyms seem lower quality.", why: "A lower price lowers the cost of joining, which encourages more sign-ups." },
      { t: "No change, because students who exercise already belong to a gym.", why: "Some students on the margin, who weren't willing to pay the old price, now join." },
      { t: "Non-student members get the discount too.", why: "That's about the gym's policy, not about how students respond to the incentive." }] },
  ];

  const genMargin = STUDY.makeGenerator({
    id: "b251-m1-margin",
    name: "Marginal analysis and incentives",
    blurb: "Compute marginal benefit, find the best quantity with MB vs. MC, and predict how incentives change choices.",
    variants: [
      {
        name: "Marginal benefit from a total-benefit table ($)",
        make() {
          const c = U.pick(MARG_CTX);
          const n = 5;
          const mb = mbSeq(n, 40, 70, 4, 12);
          const tb = cum(mb);
          const k = U.randInt(2, n - 1);
          const ans = mb[k - 1];
          const rows = [`<tr><td>0</td><td>${U.money(0)}</td></tr>`].concat(tb.map((v, i) => `<tr><td>${i + 1}</td><td>${U.money(v)}</td></tr>`)).join("");
          const traps = [
            { value: tb[k - 1], why: `That is the total benefit of ${k} ${c.unit}, not the extra benefit of the ${ordinal(k)} one.` },
            { value: mb[k], why: `That is the marginal benefit of the ${ordinal(k + 1)} ${c.u1}. You moved one row too far.` },
            { value: U.round(tb[k - 1] / k, 2), why: "That is the average benefit per unit. Marginal means the change in total from one more unit." },
          ];
          return Q.num({
            q: `<p>The table shows the total benefit ${c.who} gets from ${c.unit}.</p><table class="data-tbl"><tr><th>${c.label}</th><th>Total benefit</th></tr>${rows}</table><p>What is the <b>marginal benefit</b> of the <b>${ordinal(k)}</b> ${c.u1}?</p>`,
            answer: ans, unit: "$", traps,
            sol: S("Marginal benefit is the <em>extra</em> benefit from one more unit: the change in total benefit between two neighboring rows.",
              `MB of unit ${k} = TB(${k}) − TB(${k - 1}) = ${U.money(tb[k - 1])} − ${U.money(k > 1 ? tb[k - 2] : 0)}.`,
              `= <b>${U.money(ans)}</b>.`),
          });
        },
      },
      {
        name: "Best quantity from MB and MC",
        make() {
          const c = U.pick(MARG_CTX);
          const n = 6;
          const mb = mbSeq(n, 80, 100, 5, 12);
          const q = U.randInt(2, 5);
          let mc;
          let mcNote;
          if (Math.random() < 0.5) {
            const lo = mb[q], hi = mb[q - 1];
            const v = U.randInt(lo + 1, hi - 1);
            mc = Array(n).fill(v);
            mcNote = "constant";
          } else {
            const s = U.randInt(2, 4);
            const lo = Math.max(mb[q] - s * q + 1, 1), hi = mb[q - 1] - s * (q - 1) - 1;
            const m0 = U.randInt(lo, hi);
            mc = Array.from({ length: n }, (_, i) => m0 + s * i);
            mcNote = "rising";
          }
          const qq = optQ(mb, mc);
          if (qq !== q || mb.some((x, i) => x === mc[i])) return this.make();
          const rows = mb.map((x, i) => `<tr><td>${i + 1}</td><td>${U.money(x)}</td><td>${U.money(mc[i])}</td></tr>`).join("");
          const traps = [{ value: n, why: "That maximizes total benefit but ignores cost. Units whose MC exceeds their MB make the decision maker worse off." }];
          if (q + 1 < n) traps.push({ value: q + 1, why: `The ${ordinal(q + 1)} ${c.u1} costs more than it adds (MC &gt; MB), so it shouldn't be chosen.` });
          traps.push({ value: 1, why: "Stopping where MB is highest leaves out units that still add more benefit than they cost." });
          return Q.num({
            q: `<p>The table shows the marginal benefit and marginal cost of each ${c.u1} for ${c.who}.</p><table class="data-tbl"><tr><th>${c.label}</th><th>Marginal benefit</th><th>Marginal cost</th></tr>${rows}</table><p>How many ${c.unit} should ${c.who} choose to get the largest net benefit?</p>`,
            answer: q, unit: c.nu, kind: "count", traps,
            sol: S("Think one unit at a time: take the next unit only if its marginal benefit is greater than its marginal cost.",
              `Units 1–${q}: MB &gt; MC (e.g. unit ${q}: ${U.money(mb[q - 1])} vs ${U.money(mc[q - 1])}). Unit ${q + 1}: MB ${U.money(mb[q])} &lt; MC ${U.money(mc[q])}.`,
              `So stop at <b>${q}</b>. Every unit after that adds more cost than benefit.`),
          });
        },
      },
      {
        name: "One more hour? (MB vs. MC)",
        make() {
          const [n] = names(1);
          const h = U.randInt(2, 5);
          const wage = U.pick([12, 14, 15, 16, 18, 20]);
          const yes = Math.random() < 0.5;
          const mb = yes ? wage + U.randInt(2, 10) : wage - U.randInt(2, Math.min(10, wage - 2));
          const totalB = U.randInt(11, 20) * 10, totalC = h * wage;
          const sunk = U.pick([30, 40, 50, 60]);
          const courseFee = `${U.money(sunk)} nonrefundable fee for a test-prep app`;
          const rightT = yes
            ? `Yes: the next hour adds ${U.money(mb)} of benefit and costs only ${U.money(wage)}.`
            : `No: the next hour would cost ${U.money(wage)} but add only ${U.money(mb)}.`;
          const wrong = [
            { t: yes ? `No: the next hour would cost ${U.money(wage)} but add only ${U.money(mb)}.` : `Yes: the next hour adds ${U.money(mb)} of benefit and costs only ${U.money(wage)}.`, why: "That gets the comparison backwards. Check which number is larger." },
            { t: `${yes ? "No" : "Yes"}: the total benefit so far (${U.money(totalB)}) ${yes ? "is already large enough" : "exceeds the total cost so far (" + U.money(totalC) + ")"}.`, why: "Totals so far don't tell you whether the <em>next</em> hour is worth it. Compare that hour's marginal benefit with its marginal cost." },
            { t: `Yes: ${n} already paid the ${U.money(sunk)} app fee and should get the most out of it.`, why: "The fee is a sunk cost. It's gone whatever happens next, so it shouldn't affect the decision." },
          ];
          return Q.mc({
            q: `<p>${n} has studied for ${h} hours tonight and has gotten about ${U.money(totalB)} worth of benefit from it so far. Earlier this week, ${n} paid a ${courseFee}. An extra hour of studying would mean giving up an hour of paid work at ${U.money(wage)}. ${n} estimates one more hour of studying would add ${U.money(mb)} of benefit.</p><p>Should ${n} study one more hour?</p>`,
            right: rightT, wrong,
            sol: S("Decisions about “one more” are made at the margin: compare the extra benefit with the extra cost of <em>that</em> hour only.",
              `MB of the next hour = ${U.money(mb)}. MC = the forgone wage, ${U.money(wage)}. The app fee is sunk and the totals so far are irrelevant.`,
              yes ? `${U.money(mb)} &gt; ${U.money(wage)}, so <b>yes</b>.` : `${U.money(mb)} &lt; ${U.money(wage)}, so <b>no</b>.`),
          });
        },
      },
      {
        name: "Predict how an incentive changes the choice",
        make() {
          const shop = U.pick(["a coffee shop", "a food truck", "a bookstore café", "a pizza place"]);
          const n = 6;
          const mb = mbSeq(n, 120, 160, 10, 22);
          const q = U.randInt(2, 4);
          const c0 = U.randInt(mb[q] + 1, mb[q - 1] - 1);
          const mc = Array(n).fill(c0);
          const change = U.pick(["wageUp", "utilDown", "festival", "rival"]);
          let d = U.pick([4, 8, 12, 18, 25, 30]);
          let mb2 = mb.slice(), mc2 = mc.slice(), story;
          if (change === "wageUp") { mc2 = mc.map(x => x + d); story = `A new state law raises the cost of each extra hour open by ${U.money(d)} (higher wages).`; }
          else if (change === "utilDown") { if (d >= c0) d = Math.floor(c0 / 2); mc2 = mc.map(x => x - d); story = `The power company gives a discount that lowers the cost of each extra hour open by ${U.money(d)}.`; }
          else if (change === "festival") { mb2 = mb.map(x => x + d); story = `A month-long street festival raises the extra revenue from each late hour by ${U.money(d)}.`; }
          else { mb2 = mb.map(x => x - d); story = `A rival opens next door, cutting the extra revenue from each late hour by ${U.money(d)}.`; }
          if (mb2.some((x, i) => x === mc2[i]) || mb2[n - 1] <= 0) return this.make();
          const q2 = optQ(mb2, mc2);
          const right = q2 > q ? "Stay open more extra hours" : q2 < q ? "Stay open fewer extra hours" : "Stay open the same number of extra hours";
          const rows = mb.map((x, i) => `<tr><td>${i + 1}</td><td>${U.money(x)}</td><td>${U.money(mc[i])}</td></tr>`).join("");
          const all = ["Stay open more extra hours", "Stay open fewer extra hours", "Stay open the same number of extra hours"];
          return Q.mc({
            q: `<p>${shop[0].toUpperCase() + shop.slice(1)} decides how many extra hours to stay open in the evening. Before any change:</p><table class="data-tbl"><tr><th>Extra hour</th><th>Marginal benefit (revenue)</th><th>Marginal cost</th></tr>${rows}</table><p>Then: ${story} What will the owner do?</p>`,
            right, keepOrder: true,
            wrong: all.filter(x => x !== right).map(t => ({ t, why: t.includes("same") ? "Recompute MB and MC for each hour after the change. The crossing point moves." : "Recompute MB vs. MC for each hour after the change and count the hours where MB still exceeds MC." })),
            sol: S("An incentive shifts marginal benefit or marginal cost. Redo the comparison hour by hour.",
              `Before: MB &gt; MC for the first ${q} hours, so the owner stays open ${q} extra hours.`,
              `After the change: MB &gt; MC for the first ${q2} hours. So the owner chooses ${q2}: <b>${right.toLowerCase()}</b>.${q2 === q ? " The change wasn't big enough to flip any hour." : ""}`),
          });
        },
      },
      {
        name: "Positive or negative incentive? (drop-down)",
        make() {
          const nP = U.randInt(2, 3);
          const items = [
            ...U.deal("mg-pos", POS_INC, nP).map(t => ({ t, cat: "Positive incentive", why: "A reward that makes the action more attractive, encouraging it." })),
            ...U.deal("mg-neg", NEG_INC, 5 - nP).map(t => ({ t, cat: "Negative incentive", why: "A penalty or extra cost that discourages the action." })),
          ];
          return Q.classify({
            q: "<p>Classify each as a <b>positive</b> or <b>negative</b> incentive.</p>", cats: ["Positive incentive", "Negative incentive"], items,
            sol: S("Ask whether it raises the benefit (or lowers the cost) of an action, or raises the cost of an action.",
              "Rewards, discounts, bonuses, credits and subsidies are positive incentives. Fines, fees, taxes and penalties are negative incentives."),
          });
        },
      },
      {
        name: "Predict the response to an incentive",
        make() {
          const it = U.pick(RESPONSES);
          return Q.mc({
            q: `<p>${it.s} What is the most likely result?</p>`, right: it.right, wrong: it.wrong,
            sol: S("Rational choices respond to incentives: raise the cost of an action and people do less of it, raise the benefit and they do more.",
              "Not everyone changes, but people at the margin, those who were nearly indifferent, do. That is enough to change the overall pattern."),
          });
        },
      },
      {
        name: "True or false: thinking at the margin",
        make() {
          const bank = [
            { s: "Thinking at the margin means comparing the additional benefit and additional cost of one more unit.", v: true, why: "That is exactly what marginal analysis does." },
            { s: "If the total benefit of an activity is greater than its total cost, you should always do one more unit of it.", v: false, why: "Totals don't tell you about the next unit. One more is worth it only if its MB exceeds its MC." },
            { s: "Money you have already spent and can't get back should not affect your decision about what to do next.", v: true, why: "Sunk costs are the same whatever you choose, so they don't change the comparison of marginal benefit and marginal cost." },
            { s: "An incentive works by changing the marginal benefit or marginal cost of a choice.", v: true, why: "Rewards raise the benefit and penalties raise the cost, which shifts how much people choose to do." },
            { s: "A negative incentive is one that has bad effects on society.", v: false, why: "Negative incentive means a penalty that discourages an action, like a fine. It can be very good for society." },
            { s: "Incentives can help line up self-interest with the social interest.", v: true, why: "For example, financial aid lowers the cost of college, so students' self-interest leads to more education, which also benefits society." },
            { s: "The best quantity of an activity is where total benefit is as large as possible.", v: false, why: "Maximizing total benefit ignores cost. The best quantity is where net benefit is largest: keep going while MB &gt; MC." },
            { s: "If an incentive is small, nobody will change their behavior.", v: false, why: "Even small incentives tip people who are close to indifferent. Choices change at the margin." },
          ];
          const it = U.pick(bank);
          return Q.tf({
            q: `<p>True or false: ${it.s}</p>`, truth: it.v, why: it.why,
            sol: S("Marginal = the next unit. Compare its extra benefit with its extra cost and ignore totals and sunk costs.", (it.v ? "True. " : "False. ") + it.why),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 6 · RATIONALITY AND SELF-INTEREST
   * ============================================================ */
  const MAXER = [
    "Before buying a laptop, she reads reviews of every model under $1,500 and builds a spreadsheet comparing all 30 of them.",
    "He visits 14 apartments over two months to be sure he gets the very best one for his budget.",
    "She tests every route to campus for a week, timing each one, to find the fastest.",
    "Before choosing a phone plan, he compares every carrier's plans line by line for the lowest possible cost.",
    "She applies to 25 internships and waits to hear from all of them before accepting any offer.",
    "He tries on every pair of running shoes in three different stores before deciding.",
    "She researches every flight option across six websites to find the absolute cheapest fare.",
    "He reads the full menu, the online reviews and the specials before ordering, determined to get the best dish.",
    "She compares the interest rates of every bank in the state before opening a savings account.",
    "He keeps scrolling through streaming options for 40 minutes, looking for the perfect movie.",
  ];
  const SATER = [
    "She buys the first laptop she finds that has enough memory and fits her budget.",
    "He signs a lease on the second apartment he sees because it is clean, affordable and close enough to campus.",
    "She takes the route to campus her roommate suggested because it gets her there on time.",
    "He picks a phone plan that is cheaper than his old one and stops looking.",
    "She accepts the first internship offer that pays decently and matches her major.",
    "He buys the first pair of running shoes that fits comfortably.",
    "She books a reasonably priced flight on the first website she checks.",
    "He orders the first dish on the menu that sounds good.",
    "She opens a savings account at her current bank since its rate is decent.",
    "He watches the first movie that looks entertaining enough.",
  ];
  const REASONS = ["Asymmetric information", "Limited time, cognitive ability or resources", "Bias", "Emotion under uncertainty and risk"];
  const REASON_SC = [
    { r: 0, s: "buys a used car that turns out to have a cracked engine block, which the seller knew about but didn't mention" },
    { r: 0, s: "pays full price for a “like new” phone from an online seller who knew the screen had been replaced with a cheap part" },
    { r: 0, s: "signs up for a gym whose staff knows the location will close next month, but no one tells new members" },
    { r: 0, s: "hires a contractor who knows he lacks experience with this kind of roof, while the homeowner has no way to tell" },
    { r: 0, s: "buys a house without knowing that the sellers had hidden water damage behind fresh paint" },
    { r: 1, s: "has only five minutes to pick a health-insurance plan from 40 options before enrollment closes, so picks one almost at random" },
    { r: 1, s: "can't afford the time off work to compare loan offers, so takes the first loan the car dealer offers" },
    { r: 1, s: "faces a retirement-plan form with dozens of complex funds, finds the math overwhelming, and leaves everything in the default option" },
    { r: 1, s: "has a dead phone and an hour before a flight, so buys a charger at the airport for three times the usual price" },
    { r: 1, s: "is juggling three jobs and doesn't have time to read the terms of a credit-card offer before signing" },
    { r: 2, s: "always buys the same brand of detergent her parents used, even though a cheaper brand scored better in every test" },
    { r: 2, s: "assumes a $90 jacket is a great deal because the tag shows an “original price” of $250, without checking what it sells for elsewhere" },
    { r: 2, s: "is overconfident about his driving skills, so skips buying insurance coverage he actually needs" },
    { r: 2, s: "only reads news that agrees with what he already believes about a stock, and ignores warning signs" },
    { r: 2, s: "keeps choosing a familiar restaurant chain on road trips even when better-rated local spots are closer and cheaper" },
    { r: 3, s: "panics during a sudden stock-market drop and sells all her investments at a loss, out of fear" },
    { r: 3, s: "is so excited after winning a small bet that he immediately places a much larger, riskier one" },
    { r: 3, s: "is terrified of flying after seeing a news story, so drives 900 miles instead, even though driving is riskier" },
    { r: 3, s: "feels anxious about an uncertain job market and accepts a low-paying offer on the spot to end the stress" },
    { r: 3, s: "gets caught up in the thrill of an online auction and bids far more than she had planned" },
  ];
  const LOSS = [
    "turns down a coin flip that pays $120 on heads and costs $100 on tails, even though it pays off on average",
    "refuses to sell a stock that has fallen in value, hoping to “get back to even” rather than accept the loss",
    "is far more upset about losing a $20 bill than happy about finding a $20 bill",
    "reacts angrily to a “$3 surcharge for card payments” but is happy with a “$3 discount for paying cash” that leaves the same prices",
    "keeps an unused gym membership because cancelling would feel like admitting the money was lost",
    "won't sell concert tickets for $150, but would never have paid more than $80 to buy them",
  ];
  const NOT_LOSS = [
    { s: "picks the first apartment that meets her basic needs because searching longer would take too much time", why: "That's satisficing under limited time, which is bounded rationality, not a reaction to losses." },
    { s: "buys a car from a seller who hid known defects", why: "That's asymmetric information: the seller knew more." },
    { s: "chooses a price for her food truck after watching what the truck next door charges", why: "That's a strategic choice, not loss aversion." },
    { s: "studies an extra hour because the extra benefit exceeds the extra cost", why: "That's ordinary marginal analysis." },
    { s: "compares every phone on the market before buying the best one", why: "That's maximizing, not loss aversion." },
    { s: "uses a simple rule of thumb, always buying the mid-priced wine, because comparing labels is overwhelming", why: "That's a rule of thumb due to limited cognitive capacity (bounded rationality)." },
  ];
  const SI_OK = [
    "Spending Saturdays volunteering at a homeless shelter because helping others matters to you",
    "Donating part of your paycheck to a cancer charity",
    "Taking a lower-paying job at a nonprofit because you value its mission",
    "Turning down overtime to spend evenings with your kids",
    "Paying more for locally grown food because you care about the environment",
    "Running for student government for the prestige and influence",
    "Working extra hours to save for a house",
    "Giving up a weekend to help your best friend move",
    "Choosing a smaller apartment so you can afford to travel",
    "Taking a demanding job mainly for the power and status it brings",
  ];
  const SI_BAD = [
    "Knowingly choosing the plan you believe is worse for you in every way, at the same price",
    "Deliberately picking the option you are sure you'll regret, with no benefit to anyone",
    "Paying more for a product you value less than an identical cheaper one, on purpose and with full information",
    "Intentionally doing the opposite of what you want, purely to make yourself worse off",
  ];
  const INSTITUTIONS = [
    { s: "Farmers in a region won't plant orchards that take years to bear fruit, because the land could be taken from them at any time.", right: "Laws that secure private property rights, so farmers keep the rewards of long-term investment", wrong: [
      { t: "A rule that all farmers must plant the same crop", why: "That doesn't give individuals a reason to invest. It just removes choice." },
      { t: "Asking farmers to act unselfishly for the good of the country", why: "Economists take self-interest as given. Institutions should harness it, not wish it away." },
      { t: "Banning the sale of fruit", why: "That would destroy the reward for planting orchards." }] },
    { s: "Small businesses refuse to sell on credit because buyers who don't pay can never be made to.", right: "Courts that enforce contracts, so voluntary agreements are kept", wrong: [
      { t: "A law requiring all sales to be in cash", why: "That would shrink trade instead of making it safer." },
      { t: "Encouraging businesses to trust everyone", why: "Hoping for trust doesn't change incentives. Enforcement does." },
      { t: "Higher taxes on small businesses", why: "That raises costs and doesn't solve the enforcement problem." }] },
    { s: "Talented low-income students skip college because they can't afford it, even though more education would benefit them and society.", right: "Financial aid that lowers the cost of attending college", wrong: [
      { t: "Requiring every student to attend college whether it benefits them or not", why: "A mandate ignores individual costs and benefits. An incentive works with self-interest." },
      { t: "Raising tuition to signal that college is valuable", why: "Higher cost discourages exactly the students in question." },
      { t: "Telling students that education is a moral duty", why: "Appeals don't change costs or benefits. Economists rely on incentives." }] },
    { s: "Inventors hesitate to spend years developing new medicines because competitors could instantly copy them.", right: "Patent laws that give inventors the rights to their inventions for a period of time", wrong: [
      { t: "Requiring all inventions to be shared freely the day they are made", why: "That removes the reward for inventing, so less invention happens." },
      { t: "Banning new medicines until they are proven perfect", why: "That raises costs and doesn't address copying." },
      { t: "Relying on inventors' desire to help humanity", why: "Some inventors are motivated that way, but institutions shouldn't depend on it." }] },
    { s: "Nobody bothers to keep up a shared lakeside beach that belongs to no one, so it is covered in trash.", right: "Clear rules about who is responsible, such as a park authority that charges a small fee and maintains the beach", wrong: [
      { t: "Hoping visitors will clean up after themselves", why: "Hope doesn't change incentives. Each visitor bears the full cost of cleaning but gets only a small share of the benefit." },
      { t: "Closing the beach forever", why: "That eliminates the benefits of the beach instead of aligning incentives." },
      { t: "Doubling the number of visitors", why: "More visitors with the same incentives means more trash." }] },
  ];
  const SOCIALQ_CATS = ["Right things in the right quantities?", "Factors of production used in the best way?", "Goods go to those who benefit most?"];
  const SOCIALQ = [
    { c: 0, t: "A town builds three new parking garages that sit mostly empty, while its only clinic has a six-week waiting list." },
    { c: 0, t: "A factory keeps making flip phones that almost nobody wants to buy anymore." },
    { c: 0, t: "A region produces so many winter coats that thousands go unsold, while it has too few air conditioners for its hot summers." },
    { c: 0, t: "A school district spends heavily on a new football scoreboard while classrooms lack enough textbooks." },
    { c: 0, t: "A country produces huge amounts of a crop that consumers no longer want, while fresh vegetables are hard to find." },
    { c: 1, t: "A hospital has its highly trained surgeons spend half their time on filing that a clerk could do." },
    { c: 1, t: "A farm still harvests wheat by hand even though a machine could do it at a fraction of the cost." },
    { c: 1, t: "A bakery runs a large oven for one tray of bread at a time, wasting energy." },
    { c: 1, t: "A construction company leaves its expensive cranes idle while paying workers to carry steel beams by hand." },
    { c: 1, t: "A software firm assigns its best programmers to answer customer phone calls." },
    { c: 2, t: "Free flu shots are handed out at random, so many go to people who don't want them while high-risk seniors go without." },
    { c: 2, t: "Concert tickets go to random lottery winners who barely care, while devoted fans who would pay a lot get none." },
    { c: 2, t: "A food pantry gives most of its food to families who don't need it, while struggling families nearby are turned away." },
    { c: 2, t: "Donated wheelchairs are stored at an office where no one needs them, instead of reaching patients who can't walk." },
    { c: 2, t: "A university assigns parking spots near the medical building to students who never drive there, while patients with disabilities park far away." },
  ];
  const genRational = STUDY.makeGenerator({
    id: "b251-m1-rational",
    name: "Rationality and self-interest",
    blurb: "What rationality does and doesn't claim, why people deviate from it, and how institutions align self-interest with the social interest.",
    variants: [
      {
        name: "Maximizer or satisficer? (drop-down)",
        make() {
          const nM = U.randInt(2, 3);
          const ns = names(5);
          const items = [
            ...U.deal("ra-max", MAXER, nM).map(t => ({ t, cat: "Maximizer", why: "Searches through options to find the best possible choice." })),
            ...U.deal("ra-sat", SATER, 5 - nM).map(t => ({ t, cat: "Satisficer", why: "Stops at the first option that is good enough." })),
          ].map((it, i) => Object.assign(it, { t: `${ns[i]}: ${it.t}` }));
          return Q.classify({
            q: "<p>Classify each person as a <b>maximizer</b> or a <b>satisficer</b>.</p>", cats: ["Maximizer", "Satisficer"], items,
            sol: S("Ask whether the person keeps searching for the <em>best</em> option or stops once an option is <em>good enough</em>.",
              "Maximizers act on full rationality: compare everything and pick the optimum. Satisficers act under bounded rationality: they accept a satisfactory option to save time and effort."),
          });
        },
      },
      {
        name: "Why did they deviate from rationality?",
        make() {
          const sc = U.pick(REASON_SC);
          const [n] = names(1);
          const whys = [
            "That fits when one side of a deal knows something important the other side doesn't.",
            "That fits when the decision maker lacks the time, money or mental capacity to evaluate the options.",
            "That fits when a systematic mental shortcut (habit, anchoring, overconfidence) skews the choice.",
            "That fits when fear, excitement or stress about risk drives the decision.",
          ];
          return Q.mc({
            q: `<p>${n} ${sc.s}.</p><p>Which reason best explains why ${n}'s choice departed from what a fully rational decision would be?</p>`,
            right: REASONS[sc.r],
            wrong: REASONS.map((t, i) => ({ t, i })).filter(x => x.i !== sc.r).map(x => ({ t: x.t, why: whys[x.i] + " That isn't the main issue here." })),
            sol: S("Four common reasons: the other side knew more (asymmetric information); not enough time, money or brainpower; a systematic bias; or emotion in a risky situation.",
              `Look at what drove the choice in this case. ${whys[sc.r]}`,
              `So the best answer is <b>${REASONS[sc.r]}</b>.`),
          });
        },
      },
      {
        name: "Spot loss aversion",
        make() {
          const ns = names(4);
          const right = `${ns[0]} ${U.pick(LOSS)}.`;
          const wrong = U.sample(NOT_LOSS, 3).map((x, i) => ({ t: `${ns[i + 1]} ${x.s}.`, why: x.why }));
          return Q.mc({
            q: "<p>Which person's behavior best illustrates <b>loss aversion</b> (prospect theory)?</p>", right, wrong,
            rightWhy: "The prospect of a loss weighs more heavily than an equal-sized gain.",
            sol: S("Loss aversion: a loss hurts more than an equal gain feels good, so people go to lengths to avoid losses or to avoid admitting them.",
              "Look for the option where how the outcome is framed (as a loss versus a gain) drives the choice. The others are bounded rationality, asymmetric information, strategic choice or ordinary marginal analysis."),
          });
        },
      },
      {
        name: "Select all consistent with self-interest",
        make() {
          const nOk = U.randInt(2, 4);
          const opts = [
            ...U.deal("ra-si", SI_OK, nOk).map(t => ({ t, ok: true, why: "Pursues the person's own goals, whatever they are, so it is consistent with self-interest." })),
            ...U.sample(SI_BAD, 5 - nOk).map(t => ({ t, ok: false, why: "Knowingly making yourself worse off by your own standards violates the rationality assumption." })),
          ];
          const uniq = opts;
          return Q.multi({
            q: "<p>Economists define self-interest as the pursuit of one's own goals. Select <b>every</b> choice that is consistent with a rational person acting in their self-interest.</p>", options: uniq,
            sol: S("Self-interest is not the same as selfishness or money-grabbing. Goals can include helping others, family, prestige, power or the environment.",
              "The only choices that clash with it are ones where a person knowingly makes themselves worse off by their own standards."),
          });
        },
      },
      {
        name: "True or false: what rationality claims",
        make() {
          const bank = [
            { s: "The rationality assumption says people never make mistakes.", v: false, why: "It says people don't <em>intentionally</em> make themselves worse off. Mistakes from bad information or limited time are still possible." },
            { s: "Under the rationality assumption, a rational person cares only about money.", v: false, why: "Self-interest is the pursuit of one's own goals, which can include family, helping others or the environment." },
            { s: "Donating to charity can be consistent with rational self-interest.", v: true, why: "If the donor values helping others, giving pursues their own goals." },
            { s: "Economists generally assume that “more is better” for things people value.", v: true, why: "More money, time or goods you value makes you better off, other things equal." },
            { s: "Bounded rationality means people are irrational and choose randomly.", v: false, why: "It means people are rational within limits of information, time and brainpower, so they use reasonable shortcuts." },
            { s: "A satisficer is acting completely irrationally.", v: false, why: "Satisficing is a sensible response to limited time and information (bounded rationality)." },
            { s: "Economists take human nature as given and look to institutions to align self-interest with the social interest.", v: true, why: "Rather than trying to change people, they look at how rules and incentives channel self-interest." },
            { s: "If everyone acts in their self-interest, the outcome is always bad for society.", v: false, why: "With the right institutions (property rights, voluntary exchange), self-interested choices can also serve the social interest." },
            { s: "Loss aversion means people feel losses more strongly than gains of the same size.", v: true, why: "That is the core finding of prospect theory." },
          ];
          const it = U.pick(bank);
          return Q.tf({
            q: `<p>True or false: ${it.s}</p>`, truth: it.v, why: it.why,
            sol: S("The rationality assumption is modest: people don't <em>intentionally</em> choose to be worse off, given their own goals.", (it.v ? "True. " : "False. ") + it.why),
          });
        },
      },
      {
        name: "Institutions that align incentives",
        make() {
          const it = U.pick(INSTITUTIONS);
          return Q.mc({
            q: `<p>${it.s}</p><p>Which institution would best line up individuals' self-interest with the social interest here?</p>`, right: it.right, wrong: it.wrong,
            sol: S("Economists take self-interest as given. The question is which rule or institution changes the <em>incentives</em> so that self-interested choices also help society.",
              "Secure property rights, enforceable voluntary exchange and well-designed policies like financial aid let people keep the rewards of socially useful actions."),
          });
        },
      },
      {
        name: "Which social-interest question? (drop-down)",
        make() {
          const picks = [];
          [0, 1, 2].forEach(c => picks.push(U.pick(SOCIALQ.filter(x => x.c === c))));
          const extra = U.sample(SOCIALQ.filter(x => !picks.includes(x)), U.randInt(1, 2));
          const items = picks.concat(extra).map(x => ({ t: x.t, cat: SOCIALQ_CATS[x.c], why: ["The economy is producing the wrong mix of goods.", "Resources (labor, capital, land) are being used wastefully.", "Goods are reaching people who value them less than others do."][x.c] }));
          return Q.classify({
            q: "<p>Each situation fails one of the three social-interest questions. Match each to the question it fails.</p>", cats: SOCIALQ_CATS, items,
            sol: S("Ask: is the problem <em>what</em> is produced, <em>how</em> it is produced, or <em>who</em> gets it?",
              "Wrong mix of goods → right things in right quantities. Wasteful use of labor or machines → factors of production. Goods going to people who value them little → those who benefit most."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 7 · MODELS, ASSUMPTIONS, CETERIS PARIBUS, DATA
   * ============================================================ */
  const CP_STUDIES = [
    { s: "A pizza shop cuts the price of a large pizza from $14 to $11 in the same week that the university's football team plays its biggest home game. Sales jump 40%, and the owner concludes the price cut caused the increase.", x: "the home game also brought extra customers" },
    { s: "A city lowers bus fares in September, the same month students return to campus. Ridership rises, and officials credit the lower fare.", x: "thousands of students returned at the same time" },
    { s: "A clothing store raises prices on winter coats in December and finds it sells more coats than in October. The manager concludes higher prices increase sales.", x: "colder weather in December also raised demand for coats" },
    { s: "A gym launches a TV ad campaign and cuts its membership fee in the same month. Sign-ups double, and the marketing team credits the ads.", x: "the fee was cut at the same time" },
    { s: "A researcher compares ice-cream sales in July (after a price increase) with sales in February (before it), finds sales were higher in July, and concludes the price increase boosted sales.", x: "summer heat raises ice-cream purchases regardless of price" },
    { s: "A coffee chain introduces a new loyalty app in the same week a rival café across the street closes. Sales rise, and the chain credits the app.", x: "the rival's closure sent its customers to the chain" },
    { s: "A state raises its cigarette tax during the same year it launches a large anti-smoking ad campaign. Smoking falls, and lawmakers conclude the tax alone caused the drop.", x: "the ad campaign could also have reduced smoking" },
  ];
  const EXPERIMENTS = [
    { goal: "whether a lower price increases sales of its smoothies", factor: "price",
      right: "Lower the smoothie price for a month while keeping the menu, advertising, hours and recipes exactly the same, then compare sales.",
      wrong: [{ t: "Lower the price and add three new flavors in the same month, then compare sales.", why: "Two things changed at once, so you can't tell which one moved sales." },
        { t: "Lower the price in summer and compare with sales from the previous winter.", why: "The season changed too. Smoothie demand differs by season." },
        { t: "Ask customers whether they think they would buy more at a lower price.", why: "Models are tested against what people do, not what they say they'd do." }] },
    { goal: "whether a later closing time increases a bookstore's weekly revenue", factor: "closing time",
      right: "Extend closing time by two hours for several weeks while holding prices, staffing, promotions and inventory constant.",
      wrong: [{ t: "Extend hours during the week of a big sale and compare with a normal week.", why: "The sale also raises revenue, so the effect of hours can't be isolated." },
        { t: "Extend hours and hire a famous author for nightly signings.", why: "The signings change revenue too, so the effect of hours can't be isolated." },
        { t: "Compare revenue with a different bookstore in another city that stays open later.", why: "Many other things differ between the two stores." }] },
    { goal: "whether paying tutors more raises the number of tutoring hours they offer", factor: "the hourly wage",
      right: "Raise the hourly wage while keeping the schedule, location, subjects and workload the same, then compare hours offered.",
      wrong: [{ t: "Raise the wage and also let tutors work from home, then compare hours.", why: "Two incentives changed at once." },
        { t: "Raise the wage during final exams week and compare with a quiet week.", why: "Demand for tutoring differs across weeks too." },
        { t: "Ask tutors how they feel about the current wage.", why: "Feelings aren't the outcome being tested, and nothing is varied." }] },
    { goal: "whether free shipping raises online orders", factor: "the shipping fee",
      right: "Offer free shipping to a random half of website visitors, keep prices and site design the same for everyone, and compare orders.",
      wrong: [{ t: "Offer free shipping starting on Black Friday and compare with the week before.", why: "Black Friday raises orders on its own." },
        { t: "Offer free shipping and cut prices 10% at the same time.", why: "The price cut and free shipping are mixed together." },
        { t: "Redesign the whole website and add free shipping in the same week.", why: "The redesign could change orders too." }] },
  ];
  const genModels = STUDY.makeGenerator({
    id: "b251-m1-models",
    name: "Models, ceteris paribus and data",
    blurb: "Why models simplify, how ceteris paribus isolates cause and effect, and how data judge a model.",
    variants: [
      {
        name: "Spot the ceteris paribus problem",
        make() {
          const st = U.pick(CP_STUDIES);
          return Q.mc({
            q: `<p>${st.s}</p><p>What is the main flaw in this conclusion?</p>`,
            right: `Other things were not held equal: ${st.x}, so the effect can't be credited to the one change.`,
            wrong: [
              { t: "Nothing: it is fine to change several things at once as long as the result is large.", why: "A large effect still can't be attributed to one cause if several things changed." },
              { t: "The conclusion is a normative statement, so it can't be tested.", why: "It's a positive claim about cause and effect. It is testable but poorly tested here." },
              { t: "Economic models should never be tested with real data.", why: "Economics is empirical. Models must be checked against data, just carefully." },
            ],
            sol: S("To isolate cause and effect, change one factor and hold everything else constant (ceteris paribus).",
              `Ask what else changed at the same time. Here, ${st.x}.`,
              "Because two things changed, the data can't tell us how much of the effect came from the change being credited."),
          });
        },
      },
      {
        name: "Design the experiment",
        make() {
          const e = U.pick(EXPERIMENTS);
          const biz = U.pick(["A small business", "A local shop owner", "A campus business", "A start-up"]);
          return Q.mc({
            q: `<p>${biz} wants to learn ${e.goal}. Which plan best isolates the effect of ${e.factor}?</p>`, right: e.right, wrong: e.wrong,
            sol: S("Ceteris paribus: change only the factor you're studying and hold everything else equal.",
              `The good plan varies ${e.factor} alone. Every other option lets something else change too, or doesn't measure actual behavior.`),
          });
        },
      },
      {
        name: "Which model is more useful?",
        make() {
          const topic = U.pick([
            { what: "how many lattes customers buy at different prices", a: "assumes every customer carefully compares the benefit and cost of each extra latte", b: "describes in detail each customer's mood, morning routine and favorite mug" },
            { what: "how drivers respond to higher gas prices", a: "assumes drivers weigh the cost of each extra mile against its benefit", b: "includes every driver's personal history, car color and favorite radio station" },
            { what: "how many hours students work at part-time jobs", a: "assumes students compare the wage with the value of an hour of free time", b: "records each student's full daily schedule and personality traits" },
          ]);
          const [x, y] = U.shuffle(["A", "B"]);
          return Q.mc({
            q: `<p>Two economists build models to predict ${topic.what}.</p><ul><li><b>Model ${x}</b> ${topic.a}. It seems unrealistic, but its predictions have matched real data closely for years.</li><li><b>Model ${y}</b> ${topic.b}. It feels realistic, but its predictions are often far off.</li></ul><p>Which model is more useful to an economist?</p>`,
            right: `Model ${x}, because models are judged by how well they predict, not by how realistic they look.`,
            wrong: [
              { t: `Model ${y}, because a model should include as much real-world detail as possible.`, why: "Detail for its own sake doesn't help. A model is useful because it simplifies and still predicts well." },
              { t: "Neither: a model with any unrealistic assumption is useless.", why: "Every model simplifies. A map leaves out most of the world and is still useful." },
              { t: `Model ${y}, because people don't really think in terms of costs and benefits.`, why: "Models predict how people act, not how they think. What matters is whether the predictions hold up." },
            ],
            sol: S("Economics is empirical: compare models by checking their predictions against real-world data.",
              `Model ${x} simplifies heavily but predicts well. Model ${y} is detailed but predicts poorly.`,
              `So <b>Model ${x}</b> is more useful, the same way a simple subway map beats a satellite photo for getting across town.`),
          });
        },
      },
      {
        name: "Models as maps: simplification",
        make() {
          const bank = [
            {
              q: "A campus bus map shows only bus routes and stops. It leaves out buildings, trees and the exact shapes of streets. Why is it still a good model?",
              right: "Because it keeps only what matters for its purpose, getting from stop to stop, and leaves out distracting detail.",
              wrong: [
                { t: "It isn't a good model. A model must show everything in the real world.", why: "A model that showed everything would be as complicated as reality and useless for its purpose." },
                { t: "Because it is a normative statement about where buses should go.", why: "A map describes what is. It isn't a value judgment." },
                { t: "Because it was made by experts, so it must be correct.", why: "A model's usefulness depends on how well it serves its purpose and predicts, not on who made it." },
              ],
            },
            {
              q: "What is an economic model?",
              right: "A simplified representation of the real world used to explain or predict economic behavior.",
              wrong: [
                { t: "An exact, complete description of how the economy works.", why: "Models are deliberately simplified. Complete descriptions aren't possible or useful." },
                { t: "A statement of what economic policy ought to be.", why: "That's normative economics, not a model." },
                { t: "A survey of what people think about the economy.", why: "Surveys produce data. Models are simplified frameworks for explaining or predicting." },
              ],
            },
            {
              q: "What role do a model's <em>assumptions</em> play?",
              right: "They describe the set of circumstances in which the model applies.",
              wrong: [
                { t: "They must be perfectly realistic, or the model should be thrown out.", why: "Assumptions simplify on purpose. A model is judged by its predictions." },
                { t: "They state which outcomes are fair.", why: "That would be a normative judgment, not an assumption of a positive model." },
                { t: "They are optional decorations with no effect on predictions.", why: "Assumptions determine where a model applies and what it predicts." },
              ],
            },
            {
              q: "What does an economic theory do?",
              right: "It generalizes about how people, firms and economies make choices and perform, summarizing what we think we understand.",
              wrong: [
                { t: "It lists every fact about the economy without any generalization.", why: "A theory generalizes. A list of facts is just data." },
                { t: "It tells people what they ought to do.", why: "That's normative. Theory explains and predicts." },
                { t: "It proves something beyond any possible doubt.", why: "Theories are tested against data and can be revised if the evidence contradicts them." },
              ],
            },
          ];
          const it = U.pick(bank);
          return Q.mc({
            q: `<p>${it.q}</p>`, right: it.right, wrong: it.wrong,
            sol: S("A model is a purposeful simplification, like a map: it leaves things out so it can be useful.",
              "Assumptions set the circumstances where the model applies, and its usefulness is judged by its predictions."),
          });
        },
      },
      {
        name: "Actions, not thoughts",
        make() {
          const [n] = names(1);
          const sc = U.pick([
            { model: "shoppers buy fewer strawberries when strawberry prices rise", critique: "nobody in a grocery store actually calculates marginal benefit and marginal cost" },
            { model: "drivers take fewer trips when gas prices rise", critique: "most drivers have never heard of opportunity cost" },
            { model: "students study more for exams worth more of their grade", critique: "students don't sit down and compute marginal benefit before studying" },
            { model: "firms hire fewer workers when wages rise", critique: "managers say they hire based on gut feeling, not equations" },
          ]);
          return Q.mc({
            q: `<p>A model predicts that ${sc.model}, and data confirm the prediction. ${n} objects: “The model is wrong, because ${sc.critique}.”</p><p>What is the best response?</p>`,
            right: "Economic models predict how people act, not how they think. If the predictions match behavior, the model is useful.",
            wrong: [
              { t: `${n} is right: a model is only valid if it describes people's actual thought process.`, why: "Models are judged by their predictions about actions, not by how literally they describe mental steps." },
              { t: "The model should be replaced by asking people how they make decisions.", why: "What people say about their thinking is a poor guide. Economists test models against actual behavior." },
              { t: "The data must be wrong, since people don't think that way.", why: "Data are how models are judged, not the other way around." },
            ],
            sol: S("Ask what a model is supposed to do: predict behavior.",
              "People don't need to consciously calculate MB and MC for the model to predict their actions well. A pool player can sink shots without solving physics equations.",
              "Since the predictions match the data, the objection misses the point."),
          });
        },
      },
      {
        name: "When data contradict the model",
        make() {
          const sc = U.pick([
            { m: "a city's bus ridership would rise by 20% after fares were cut", d: "ridership barely changed in five separate cities that tried it" },
            { m: "a sales tax on soda would cut purchases sharply", d: "purchases fell only slightly in every town studied" },
            { m: "raising a campus parking fee would empty half the lots", d: "the lots stayed nearly full after three different fee increases" },
            { m: "a loyalty program would double repeat visits", d: "repeat visits rose only 5% across dozens of stores" },
          ]);
          return Q.mc({
            q: `<p>An economic model predicted that ${sc.m}. Careful studies found that ${sc.d}.</p><p>What should economists do?</p>`,
            right: "Revise the model or its assumptions (or replace it), because a model's predictions must hold up against real-world data.",
            wrong: [
              { t: "Keep the model as it is, since a good theory doesn't need to match data.", why: "Economics is empirical. Repeated failed predictions mean the model needs work." },
              { t: "Treat the question as normative, since the data are inconvenient.", why: "Whether the policy works is a positive, testable question. The data answered it." },
              { t: "Ignore the data and add more realistic detail to the model's description.", why: "Realism isn't the goal. The model must be adjusted until its predictions fit the evidence." },
            ],
            sol: S("Economics is an empirical science: data are the referee.",
              "When careful evidence repeatedly contradicts a prediction, the model (or an assumption it relies on) must be revised or dropped."),
          });
        },
      },
      {
        name: "Select what ceteris paribus holds constant",
        make() {
          const g = U.pick([
            { good: "coffee", rel: ["the price of tea", "consumers' incomes", "consumers' tastes for coffee", "the number of coffee drinkers in town", "advertising for coffee"] },
            { good: "movie tickets", rel: ["the price of streaming subscriptions", "consumers' incomes", "the quality of movies showing", "the population of the town", "the price of popcorn at the theater"] },
            { good: "bicycles", rel: ["the price of bus passes", "consumers' incomes", "the weather", "the price of gasoline", "how many bike lanes the city has"] },
          ]);
          const held = U.sample(g.rel, U.randInt(2, 4));
          const opts = held.map(t => ({ t: t[0].toUpperCase() + t.slice(1), ok: true, why: "Another factor that affects purchases, so it is held constant." }));
          opts.push({ t: `The price of ${g.good}`, ok: false, why: "This is the factor being studied, so it is the one allowed to change." });
          opts.push({ t: `The quantity of ${g.good} people buy`, ok: false, why: "This is the outcome being measured. It changes in response to the price." });
          return Q.multi({
            q: `<p>An economist studies how the <b>price of ${g.good}</b> affects the <b>quantity of ${g.good}</b> people buy, using the ceteris paribus assumption. Select <b>every</b> item she holds constant.</p>`, options: opts,
            sol: S("Ceteris paribus means only the factor being studied changes. Everything else that could affect the outcome is held fixed.",
              `The price of ${g.good} is varied and the quantity bought is measured. All the other influences listed are held constant.`),
          });
        },
      },
    ],
  });

  const generators = [genPosNorm, genMicroMacro, genOppCost, genScarcity, genMargin, genRational, genModels];

  STUDY.registerUnit(C, {
    id: "m1", order: 1,
    title: "Module 1 · Basic Economics",
    short: "M1 · Basics",
    description: "Scarcity and choice, micro vs. macro, rationality and self-interest, opportunity cost, thinking at the margin, positive vs. normative, and how models are tested with data.",
    notes, flashcards, cues, generators,
  });
})();
