/* ============================================================
 * BUS K201 · The Computer in Business — Fall 2026
 * Course facts from the chapter readings (IU Pressbooks eText).
 * No syllabus has been added yet, so there is no dated schedule,
 * key-date list or grade weighting; add them here when it arrives.
 * Chapters register themselves from the other files in this folder
 * (ch2.js, ch3.js, …); kit.js holds the shared question builders.
 * ============================================================ */
STUDY.registerCourse({
  id: "bus-k201",
  order: 2,
  code: "BUS K201",
  name: "The Computer in Business",
  term: "Fall 2026",
  instructor: "Kelley School of Business",
  text: "K201 eText (IU Pressbooks, via Canvas)",
  mark: "K201",
  color: "#006298",
  tagline: "Data, information systems, processes, requirements, data models and SQL — thinking like a business analyst.",
  unitNoun: "Chapter",

  schedule: [],
  keyDates: [],
  gradeWeights: [],

  /* Exam-mode presets. Sized as study sets, not copies of the real
   * assessments (add those when the syllabus is provided). */
  examPresets: [
    { id: "quiz", label: "Chapter check", icon: "✎", n: 10, minutes: 15, scope: "recent",
      blurb: "Ten questions on the latest chapter." },
    { id: "sprint0", label: "Foundations check", icon: "▤", n: 12, minutes: 20, scope: ["ch2"],
      blurb: "Chapter 2: data, storage, cloud vs. edge, and IU systems." },
    { id: "sprint1", label: "Sprint 1 review", icon: "▦", n: 25, minutes: 45, scope: ["ch3", "ch4", "ch5", "ch6", "ch7"],
      blurb: "Chapters 3–7: information systems, process mapping, requirements, data models and enterprise systems." },
    { id: "sprint2", label: "Sprint 2 review", icon: "▣", n: 25, minutes: 45, scope: ["ch8", "ch9", "ch10", "ch11", "ch12"],
      blurb: "Chapters 8–12: ERDs, verifying production data, SQL you can defend, data storage homes and AI-assisted architecture." },
    { id: "all", label: "Everything so far", icon: "◆", n: 35, minutes: 60, scope: "all",
      blurb: "Every chapter loaded, mixed." },
  ],
});
