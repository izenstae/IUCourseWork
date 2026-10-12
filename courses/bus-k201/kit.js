/* ============================================================
 * BUS K201 · shared question kit
 * Most K201 ideas are about telling categories apart (data vs.
 * information vs. knowledge, TPS vs. DSS, requirement vs. design
 * choice, entity vs. attribute…). Given a bank of labelled examples,
 * `sortVariants` builds five structurally different question types
 * on one idea: sort, pick the example, which is NOT, select all, and
 * name the category. `conceptVariant` and `tfVariant` deal explain /
 * predict questions from a bank. Chapter files (ch2.js, ch3.js, …)
 * build their practice topics from these. Loaded after course.js.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const S = (...steps) => steps.map(s => `<div class="sol-step">${s}</div>`).join("");

  /* sortVariants({ key, bank, cats, defs, ask, hint })
   *   key   unique string (deal queues)
   *   bank  [{ t, cat, why }] — `why` explains why t belongs to its cat
   *   cats  category labels, in the order they should be shown
   *   defs  { cat: "one-line definition" } — used in feedback
   *   ask   noun for the items, e.g. "example", "statement", "scenario"
   *   hint  first hint step (a nudge toward the concept)
   * Every category should have at least 3 bank items (ideally 6+). */
  function sortVariants({ key, bank, cats, defs, ask = "example", hint }) {
    const by = c => bank.filter(b => b.cat === c);
    const fits = c => `<b>${c}</b>${defs && defs[c] ? ": " + defs[c] : ""}`;
    const deal = (c, k) => U.deal(key + ":" + c, by(c), k);
    const others = (c, k) => U.sample(cats.filter(x => x !== c).flatMap(by), k);
    const defList = () => defs ? `<ul>${cats.map(c => `<li>${fits(c)}</li>`).join("")}</ul>` : "";
    const sol = extra => S(hint, `Check each ${ask} against the definitions:${defList()}`, ...(extra ? [extra] : []));
    const usable = (k) => cats.filter(c => by(c).length >= k);

    return [
      {
        name: "Sort (drop-down)",
        make() {
          const n = Math.min(5, bank.length);
          const firstCats = U.sample(usable(1), Math.min(2, usable(1).length));
          let items = firstCats.map(c => deal(c, 1)[0]);
          const rest = U.shuffle(bank.filter(b => !items.includes(b)));
          items = items.concat(rest.slice(0, n - items.length));
          return Q.classify({
            q: `<p>Classify each ${ask}.</p>`, cats,
            items: items.map(i => ({ t: i.t, cat: i.cat, why: i.why })),
            sol: sol(),
          });
        },
      },
      {
        name: "Pick the example",
        make() {
          const c = U.pick(usable(1));
          const right = deal(c, 1)[0];
          const wrong = others(c, 3);
          return Q.mc({
            q: `<p>Which ${ask} is an example of <b>${c}</b>?</p>`,
            right: right.t, rightWhy: right.why,
            wrong: wrong.map(w => ({ t: w.t, why: `That is <b>${w.cat}</b>: ${w.why}` })),
            sol: sol(`The answer: “${right.t}” — ${right.why}`),
          });
        },
      },
      {
        name: "Which is NOT…",
        make() {
          const c = U.pick(usable(3));
          const wrong = deal(c, 3);
          const right = others(c, 1)[0];
          return Q.mc({
            q: `<p>Three of these are examples of <b>${c}</b>. Which one is <b>NOT</b>?</p>`,
            right: right.t, rightWhy: `It is <b>${right.cat}</b>: ${right.why}`,
            wrong: wrong.map(w => ({ t: w.t, why: `This one is ${c}: ${w.why}` })),
            sol: sol(`The odd one out is “${right.t}”, which is <b>${right.cat}</b>: ${right.why}`),
          });
        },
      },
      {
        name: "Select all that apply",
        make() {
          const c = U.pick(usable(1));
          const k = U.randInt(1, Math.min(4, by(c).length));
          const opts = [
            ...deal(c, k).map(o => ({ t: o.t, ok: true, why: o.why })),
            ...others(c, 5 - k).map(o => ({ t: o.t, ok: false, why: `That is ${o.cat}: ${o.why}` })),
          ];
          return Q.multi({
            q: `<p>Select <b>every</b> ${ask} that is an example of <b>${c}</b>.</p>`, options: opts,
            sol: sol(`Only the ${ask}s that fit ${fits(c)} should be ticked. The number of correct options varies.`),
          });
        },
      },
      {
        name: "Name the category",
        make() {
          const item = U.pick(bank);
          return Q.mc({
            q: `<p>${item.t}</p><p>Which category fits best?</p>`,
            right: item.cat, rightWhy: item.why,
            wrong: cats.filter(c => c !== item.cat).map(c => ({ t: c, why: `${fits(c)}. ${item.why}` })),
            keepOrder: cats,
            sol: sol(`It is <b>${item.cat}</b>: ${item.why}`),
          });
        },
      },
    ];
  }

  /* conceptVariant(name, key, bank) — bank entries:
   *   { q, right, rightWhy?, wrong: [{ t, why }], sol: ["step", "step", …] } */
  function conceptVariant(name, key, bank) {
    return {
      name,
      make() {
        const e = U.rotate("cv:" + key, bank);
        return Q.mc({ q: `<p>${e.q}</p>`, right: e.right, rightWhy: e.rightWhy, wrong: e.wrong, sol: S(...e.sol) });
      },
    };
  }

  /* tfVariant(name, key, bank) — bank entries: { s, truth, why, hint }.
   * Keep the bank balanced between true and false statements. */
  function tfVariant(name, key, bank) {
    return {
      name,
      make() {
        const e = U.rotate("tf:" + key, bank);
        return Q.tf({
          q: `<p>True or false?</p><p>${e.s}</p>`, truth: e.truth, why: e.why,
          sol: S(e.hint || "Find the key term in the statement and recall its exact meaning.", (e.truth ? "<b>True.</b> " : "<b>False.</b> ") + e.why),
        });
      },
    };
  }

  STUDY.k201 = { S, sortVariants, conceptVariant, tfVariant };
})();
