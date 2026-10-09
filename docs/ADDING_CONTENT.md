# Adding course content

The site is data-driven. A **course** is a folder under `courses/`; each **unit** (module, chapter, week) is one self-registering JavaScript file in that folder. The hub, dashboard, Learn, Flashcards, Practice, Exam mode, Reference and Progress views all pick up new files on their own. You never touch the application code to add material.

> **Fastest workflow.** Upload the new lecture slides / notes / homework to Claude and say:
> *"Add this to the IU Study Hub following docs/ADDING_CONTENT.md: course `<course-id>`, unit `<mN>`. Write the lessons, flashcards, cue table and 5–8 practice topics with 5–8 structurally different question types each, then run `node tools/check-content.js` and `node tools/check-app.js`."*
>
> For a brand-new course, also give it the syllabus and say *"start a new course"*.

## Adding a unit to an existing course (two steps)

1. Create `courses/<course-id>/<unit-id>.js` from the template below (copy an existing module as a starting point).
2. Add one line to `index.html`, after that course's other files:

   ```html
   <script src="courses/<course-id>/<unit-id>.js"></script>
   ```

Then run the checks, commit and push. Once it reaches `main`, the **Deploy to GitHub Pages** workflow republishes the site.

If a unit's material arrives in pieces (for example the "A" and "B" halves of a module's slides), extend the existing file instead of creating a second unit.

## Adding a new course

1. Create `courses/<course-id>/course.js` that calls `STUDY.registerCourse({...})`. Copy `courses/econ-b251/course.js` and replace the syllabus facts: code, name, term, instructor, meeting times, schedule rows (with `unit` ids for rows that will get content), key dates (quizzes, homework, exams), grade weights (they must sum to 100), and exam presets sized to the real assessments.
2. Add its `<script>` tag to `index.html` **before** its unit files.
3. Add units as above.

Course ids look like `dept-number`, e.g. `econ-b251`, `math-m118`, `bus-k201`. Progress is stored per course id, so **never rename one** after it has been published.

## Unit template

```js
(function () {
  const U = STUDY.util;   // randInt, pick, shuffle, sample, money, fmt, round, frac, plural, deal, rotate
  const Q = STUDY.q;      // question builders: mc, tf, multi, classify, num
  const G = STUDY.svg;    // plot(), bowed(), bowedY() — small themed SVG graphs
  const C = "econ-b251";  // course id

  /* ---- Lessons: the "Learn" page. One section per learning objective. ---- */
  const notes = [
    {
      title: "Scarcity and the economic problem",
      lo: "Define economics and scarcity and explain the economic problem.",   // optional, shown as the objective
      html: `<p>…explanation in your own words…</p>
             <div class="keyidea"><b>Key idea.</b> …one sentence worth remembering…</div>
             <div class="example"><b>Example.</b> …a fresh, concrete example…</div>
             <div class="trap"><b>Common trap.</b> …the mistake students make, and why it is wrong…</div>`,
      gens: ["b251-m1-scarcity"],   // practice topics that test this section (buttons under the lesson)
    },
  ];

  /* ---- Flashcards: one per definition / distinction / principle. ---- */
  const flashcards = [
    { id: "b251-m1-c-scarcity", tag: "Definition", front: "What is <em>scarcity</em>?", back: "…" },
  ];

  /* ---- Cue table ("Spotting the concept" on the Reference page) ---- */
  const cues = [
    { when: "“should”, “ought”, “fair”, “too high”", think: "Normative statement", why: "A value judgment — it cannot be settled by data." },
  ];

  /* ---- Practice topics ---- */
  const generators = [
    STUDY.makeGenerator({
      id: "b251-m1-posnorm",                 // stable — progress is keyed on it
      name: "Positive vs. normative",
      blurb: "Tell testable claims about what is from value judgments about what ought to be.",
      variants: [
        {
          name: "Sort statements",           // the *thinking* the question demands; shown after answering
          make() {
            return Q.classify({
              q: "Classify each statement.",
              cats: ["Positive", "Normative"],
              items: [{ t: "…", cat: "Positive", why: "…" }, /* … */],
              sol: `<div class="sol-step">Nudge toward the method…</div><div class="sol-step">…</div>`,
            });
          },
        },
        // … 5–8 variants
      ],
    }),
  ];

  STUDY.registerUnit(C, {
    id: "m1", order: 1,
    title: "Module 1 · Basic Economics",
    short: "M1 · Basics",
    description: "One-sentence summary shown on the dashboard.",
    notes, flashcards, cues, generators,
  });
})();
```

## Question kinds

All builders return an object with `q` (question HTML), `sol` (worked solution HTML) and a `kind`. The **exam formats** — multiple choice, drop-down, fill-in, graphical and numerical — map onto these kinds:

| Builder | Use it for | Notes |
| --- | --- | --- |
| `Q.mc({ q, right, wrong, sol, rightWhy })` | Multiple choice | `wrong` is a list of strings **or `{ t, why }`**. The `why` names the misconception behind that option. It is shown when a student picks it, and listed with the solution. Write a `why` for every wrong option you can. Choices are shuffled. Pass `keepOrder: true` for ordered options such as "increases / decreases / no change": they appear in a canonical order (up, down, same, ambiguous, then alphabetical) that never depends on which option is right. Pass `keepOrder: ["…", "…"]` to set the exact order. Never put the right answer in a fixed position. |
| `Q.tf({ q, truth, why, sol })` | True / false | Two options, so there is no second attempt. Use it sparingly, for sharp misconceptions only. |
| `Q.multi({ q, options: [{ t, ok, why }], sol })` | Select all that apply | At least 3 options. Vary how many are correct, including just one or all of them. |
| `Q.classify({ q, cats, items: [{ t, cat, why }], sol })` | Drop-down sorting | `cat` is a category label from `cats`. 4–6 items per question, drawn from a bank. |
| `Q.num({ q, answer, sol, unit, tol, traps })` | Numerical / fill-in | `unit`: `"$"`, `"%"` (answer in percent, so `3.5` means 3.5%), or a word like `"years"`, `"pizzas"`. `traps: [{ value, why }]` names the mistake behind a specific wrong number, such as adding the alternatives instead of taking the best one. Pass `kind: "count"` for an exact whole number. |

Numeric grading accepts `$1,200`, `12.5`, `3/4`, `40%`. It credits a correct rounding to one decimal place (two for answers below 1). Set `tol` when the number is approximate by nature, such as the Rule of 70.

### Graphs

`G.plot({...})` returns an inline SVG that follows the light/dark theme. Put it straight into `q` or `sol`.

```js
G.plot({
  xLabel: "Laptops (per day)", yLabel: "Tablets (per day)",
  xMax: 50, yMax: 120, xTicks: [10, 20, 30, 40, 50], yTicks: [40, 80, 120],
  curves: [{ pts: G.bowed(40, 100), style: "main", label: "PPC" },        // style: main | alt | dash | faint
           { pts: G.bowed(48, 115), style: "alt", label: "PPC₂" }],
  points: [{ x: 20, y: 60, label: "W" }],
  arrows: [{ from: [20, 60], to: [28, 70] }],
});
```

`G.bowedY(x, xMax, yMax)` gives the height of a bowed curve at `x`, so you can tell whether a point lies inside it, on it, or beyond it.

## Writing questions that teach rather than drill

A topic is a **family of structurally different questions**, not one template with new numbers. `makeGenerator` deals out the variants round-robin, so a topic cycles through all of its question types before any repeats.

Aim for **5–8 variants per topic**. Make them differ in the *thinking required*, not the scenery:

- ✅ **recognise** (which example shows X?) vs **apply** (compute X) vs **reverse** (given X, what must the input have been?) vs **explain** (why does X happen?) vs **predict** (what happens to X if…?)
- ✅ the same idea in a **different representation**: a table, a graph, a word problem, a statement to classify
- ✅ **edge cases that punish autopilot**: a positive statement that is false, a giant firm that is still micro, a producer with an absolute advantage in both goods, "free" things that still have an opportunity cost
- ✅ "Which is **NOT**…" and "select all" versions, which stop students from matching on a single keyword
- ❌ the same question with a different noun ("pizza" → "burgers"). Re-skinning is still worth doing *inside* a variant (`U.pick` over several scenarios and names) so that wording never becomes a memorised cue, but it does not count as a new variant.

**Statement banks.** For classification topics, write a bank of 15–30 statements per category and deal from it with `U.deal(key, bank, k)` or `U.sample`. Then no two sessions look alike.

**Solutions are the hint ladder.** Each `<div class="sol-step">` is revealed one at a time when the student asks for a hint or misses a first attempt. Write step 1 as a *nudge toward the concept* ("Opportunity cost is only the single best alternative given up"), not as the arithmetic. Aim for 2–4 steps.

**Original wording.** Course slides belong to the instructor, and the syllabus forbids reposting them. Explain the ideas in your own words, with your own examples and numbers. Never paste slide text or reuse the instructor's worked examples verbatim. The site is public.

## Optional extras

- **Shared question kit.** A course can keep helpers in its own non-unit file loaded after `course.js`. For example, `courses/bus-k201/kit.js` builds the five standard "tell these categories apart" question types from a bank of labelled examples.
- **SQL Lab.** A course gets a SQL Lab view by attaching `sqlLab = { intro, setup, tables, exercises }` to its course object, as `courses/bus-k201/sqllab.js` does. `setup` is SQL that builds the practice database. Each exercise has a `solution` written in the course's SQL dialect, and grading compares the student's result rows with the solution's. Run `node tools/check-sqllab.js` after editing.

## Conventions and gotchas

- **Stable ids.** Card, generator, unit and course ids key saved progress. Never rename them once pushed. Prefix them with the course and unit, e.g. `b251-m2-compadv`.
- **HTML in strings.** Questions are injected as HTML. Write a literal `<` as `&lt;`, or the browser will swallow it as a tag. The checker flags unknown tags.
- **Math.** Plain HTML (`<sup>`, `×`, `÷`) is usually enough. For real formulas, use KaTeX with `\( … \)` inline or `$$ … $$` display, inside `String.raw` template literals so the backslashes survive.
- **Well-posed numbers.** Every random draw must produce a sensible problem: no negative quantities, no division by zero, no ties when the question asks "who has the advantage" (unless the tie is the point), and no distractor that equals the answer. The checker fails duplicate MC choices and traps that equal the answer.
- **Run the checks before pushing** (Node only, no dependencies):

  ```sh
  node tools/check-content.js        # hammers every generator 300× (CI uses 1000)
  node tools/check-app.js            # grading, scheduling, store, exam builder
  ```

- **Keep the README in step.** It quotes card / topic / question-type counts per unit, and `check-content.js` prints them.
