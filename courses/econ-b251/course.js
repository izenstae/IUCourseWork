/* ============================================================
 * ECON B251 · Principles of Microeconomics for Business — Fall 2026
 * Course facts from the syllabus. Modules register themselves from
 * the other files in this folder (m1.js, m2.js, …).
 * ============================================================ */
STUDY.registerCourse({
  id: "econ-b251",
  order: 1,
  code: "ECON B251",
  name: "Principles of Microeconomics",
  term: "Fall 2026",
  instructor: "Jun-Yuan “Jay” Chen",
  meets: "Tue/Thu 2:20–3:35 pm · Woodburn Hall 011",
  text: "Graf, Introductory Microeconomics (IU eText, via Canvas)",
  mark: "B251",
  color: "#990000",
  tagline: "Scarcity, markets, consumers, firms and strategy — the economic way of thinking.",
  unitNoun: "Module",
  calculator: "Basic four-function calculator",
  examFormat: "Multiple choice, fill-in-the-blank, drop-down, graphical/numerical problems and short essays. Exams are cumulative.",

  /* Tentative schedule. `unit` links a row to its content file once it exists. */
  schedule: [
    { start: "2026-08-25", end: "2026-08-25", title: "Introduction: syllabus and Canvas" },
    { start: "2026-08-27", end: "2026-09-03", title: "Module 1 · Basic Economics", unit: "m1", due: "Quiz 1 · Fri 9/4" },
    { start: "2026-09-08", end: "2026-09-10", title: "Module 2 · The Basic Economic Model: PPC", unit: "m2", due: "Quiz 2 · Fri 9/11" },
    { start: "2026-09-15", end: "2026-09-17", title: "Module 3 · Markets: Basic Demand and Supply", unit: "m3", due: "Quiz 3 · Fri 9/18" },
    { start: "2026-09-22", end: "2026-09-29", title: "Module 4 · Markets: Elasticity", unit: "m4", due: "Quiz 4 · Fri 9/25 · Q&A 1 · Sat 9/26" },
    { start: "2026-10-01", end: "2026-10-01", title: "Exam 1 (Modules 1–4)", exam: true },
    { start: "2026-10-06", end: "2026-10-08", title: "Module 5 · Markets: Efficiency and Equity", unit: "m5", due: "Quiz 5 · Fri 10/9" },
    { start: "2026-10-13", end: "2026-10-15", title: "Module 6 · Price Ceilings, Floors, Taxes and Subsidies", unit: "m6", due: "Quiz 6 · Fri 10/16 · Q&A 2 · Sat 10/17" },
    { start: "2026-10-20", end: "2026-10-22", title: "Module 7 · Markets: Other Market Failures", unit: "m7", due: "Quiz 7 · Fri 10/23" },
    { start: "2026-10-27", end: "2026-11-03", title: "Module 8 · Consumer Optimum", unit: "m8", due: "Quiz 8 · Fri 10/30 · Q&A 3 · Sat 10/31" },
    { start: "2026-11-05", end: "2026-11-05", title: "Exam 2 (Modules 5–8, cumulative)", exam: true },
    { start: "2026-11-10", end: "2026-11-12", title: "Module 9 · Firms: Structures, Production and Costs", unit: "m9", due: "Quiz 9 · Fri 11/13 · Q&A 4 · Sat 11/14" },
    { start: "2026-11-17", end: "2026-11-19", title: "Module 10 · Perfect Competition", unit: "m10", due: "Quiz 10 · Fri 11/20" },
    { start: "2026-11-23", end: "2026-11-27", title: "Thanksgiving break", off: true },
    { start: "2026-12-01", end: "2026-12-03", title: "Module 11 · Monopoly", unit: "m11", due: "Quiz 11 · Fri 12/4 · Q&A 5 · Sat 12/5" },
    { start: "2026-12-08", end: "2026-12-10", title: "Module 12 · Oligopolies and Game Theory", unit: "m12", due: "Quiz 12 · Fri 12/11" },
    { start: "2026-12-17", end: "2026-12-17", title: "Final exam · 3:00–5:00 pm (cumulative)", exam: true },
  ],

  keyDates: [
    { date: "2026-09-04", label: "Quiz 1 due 11:59 pm", kind: "quiz", unit: "m1" },
    { date: "2026-09-05", label: "Personal blog due 11:59 pm", kind: "hw" },
    { date: "2026-09-11", label: "Quiz 2 due 11:59 pm", kind: "quiz", unit: "m2" },
    { date: "2026-09-18", label: "Quiz 3 due 11:59 pm", kind: "quiz", unit: "m3" },
    { date: "2026-09-25", label: "Quiz 4 due 11:59 pm", kind: "quiz", unit: "m4" },
    { date: "2026-09-26", label: "Q&A 1 due 11:59 pm", kind: "hw" },
    { date: "2026-10-01", label: "Exam 1 · Modules 1–4 · in class", kind: "exam", preset: "exam1" },
    { date: "2026-10-09", label: "Quiz 5 due 11:59 pm", kind: "quiz", unit: "m5" },
    { date: "2026-10-16", label: "Quiz 6 due 11:59 pm", kind: "quiz", unit: "m6" },
    { date: "2026-10-17", label: "Q&A 2 due 11:59 pm", kind: "hw" },
    { date: "2026-10-23", label: "Quiz 7 due 11:59 pm", kind: "quiz", unit: "m7" },
    { date: "2026-10-25", label: "Last day for automatic W (5 pm)", kind: "info" },
    { date: "2026-10-30", label: "Quiz 8 due 11:59 pm", kind: "quiz", unit: "m8" },
    { date: "2026-10-31", label: "Q&A 3 due 11:59 pm", kind: "hw" },
    { date: "2026-11-05", label: "Exam 2 · Modules 5–8 (cumulative) · in class", kind: "exam", preset: "exam2" },
    { date: "2026-11-13", label: "Quiz 9 due 11:59 pm", kind: "quiz", unit: "m9" },
    { date: "2026-11-14", label: "Q&A 4 due 11:59 pm", kind: "hw" },
    { date: "2026-11-20", label: "Quiz 10 due 11:59 pm", kind: "quiz", unit: "m10" },
    { date: "2026-12-04", label: "Quiz 11 due 11:59 pm", kind: "quiz", unit: "m11" },
    { date: "2026-12-05", label: "Q&A 5 due 11:59 pm", kind: "hw" },
    { date: "2026-12-11", label: "Quiz 12 due 11:59 pm", kind: "quiz", unit: "m12" },
    { date: "2026-12-17", label: "Final exam · 3:00–5:00 pm · cumulative", kind: "exam", preset: "final" },
  ],

  gradeWeights: [
    { name: "Canvas quizzes (12)", pct: 20 },
    { name: "Q&A discussions (5)", pct: 10 },
    { name: "Exam 1", pct: 22.4 },
    { name: "Exam 2", pct: 22.4 },
    { name: "Final exam", pct: 25.2 },
  ],
  gradeNote: "Up to two quizzes can be missed without penalty; completing all 12 earns up to 20 extra-credit points. Late quizzes and Q&As score 0. No curve: 92%+ is an A.",

  /* Exam-mode presets. `scope` is "recent" (the latest module that has
   * started), "all", or a list of unit ids; ids that do not exist yet are
   * skipped, so presets fill in as modules are added. */
  examPresets: [
    { id: "quiz", label: "Weekly Canvas quiz", icon: "✎", n: 10, minutes: 20, scope: "recent",
      blurb: "Ten questions on the latest module — the Friday quiz habit." },
    { id: "exam1", label: "Exam 1 rehearsal", icon: "▦", n: 25, minutes: 75, scope: ["m1", "m2", "m3", "m4"],
      blurb: "Modules 1–4 under the 75-minute class-period clock." },
    { id: "exam2", label: "Exam 2 rehearsal", icon: "▣", n: 25, minutes: 75, scope: "all", emphasis: ["m5", "m6", "m7", "m8"],
      blurb: "Weighted toward Modules 5–8, cumulative like the real one." },
    { id: "final", label: "Final rehearsal", icon: "◆", n: 35, minutes: 120, scope: "all",
      blurb: "Everything registered, 2 hours — the final is cumulative." },
  ],
});
