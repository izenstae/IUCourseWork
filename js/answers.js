/* ============================================================
 * Answer widgets — rendering, reading and grading for every
 * question kind. Shared by Practice (instant feedback) and Exam
 * mode (deferred feedback) so both grade identically.
 *
 *   num / count  a typed number ($, commas, %, fractions accepted)
 *   mc           pick one
 *   multi        select all that apply
 *   classify     a drop-down per item (the exam's "drop-down" format)
 * ============================================================ */
const Answers = (() => {
  const U = () => STUDY.util;

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /* ---------------- numbers ---------------- */

  function parseNumber(text, unit) {
    let t = String(text || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!t) return NaN;
    t = t.replace(/^\$/, "").replace(/^-\$/, "-").replace(/(years?|yrs?|units?|hours?|hrs?)$/, "");
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
    if (/^-?\d*\.?\d+%$/.test(t)) {
      const v = parseFloat(t);
      return unit === "%" ? v : v / 100;
    }
    const frac = t.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
    if (frac) {
      const den = parseFloat(frac[2]);
      return den === 0 ? NaN : parseFloat(frac[1]) / den;
    }
    const v = Number(t);
    return Number.isFinite(v) ? v : NaN;
  }

  function typedDecimals(text) {
    const m = String(text || "").trim().replace(/[\s$,%]/g, "").match(/^-?\d*\.(\d+)$/);
    return m ? m[1].length : -1;
  }

  function tolFor(p) {
    if (p.kind === "count") return 1e-6;
    return p.tol != null ? p.tol : Math.max(0.0006, Math.abs(p.answer) * 0.004);
  }

  /* Within tolerance, or a correct rounding of the exact value (to at least
   * one decimal for answers >= 1, two for smaller ones), capped at 5%. */
  function numCorrect(p, v, text) {
    if (!Number.isFinite(v)) return false;
    const ans = p.answer;
    if (p.kind === "count") return Math.abs(v - ans) < 1e-6;
    if (Math.abs(v - ans) <= tolFor(p)) return true;
    // "%" answers typed as a decimal fraction (0.035 for 3.5%).
    if (p.unit === "%" && Math.abs(v) <= 1 && Math.abs(ans) > 1 && Math.abs(v * 100 - ans) <= tolFor(p)) return true;
    const d = typedDecimals(text);
    const minD = Math.abs(ans) >= 1 ? 1 : 2;
    if (d >= minD && Math.abs(v - ans) <= Math.max(Math.abs(ans) * 0.05, 1e-9)) {
      return U().round(ans, d) === U().round(v, d);
    }
    return false;
  }

  function fmtNum(p, x) {
    const v = x != null ? x : p.answer;
    if (p.unit === "$") return U().money(U().round(v, 2));
    if (p.unit === "%") return U().fmt(v, 3) + "%";
    return U().fmt(v, 4) + (p.unit && p.unit !== "$" && p.unit !== "%" ? " " + p.unit : "");
  }

  function placeholder(p) {
    if (p.kind === "count") return "Enter a whole number…";
    if (p.unit === "$") return "Dollar amount, e.g. 45 or 12.50…";
    if (p.unit === "%") return "Percent, e.g. 3.5…";
    if (p.unit) return `Number of ${p.unit}…`;
    return "Enter a number, e.g. 2.5 or 5/2…";
  }

  /* ---------------- render ----------------
   * opts: { disabled, reveal, eliminated: Set<index>, id }
   * `reveal` paints right/wrong; `eliminated` greys out options already
   * tried and rejected in this problem (practice second attempt). */
  function render(p, response, opts) {
    opts = opts || {};
    const dis = opts.disabled || opts.reveal ? "disabled" : "";
    if (p.kind === "num" || p.kind === "count") {
      return `<div class="answer-row">
        ${p.unit === "$" ? `<span class="unit-pre">$</span>` : ""}
        <input type="text" class="ans-input" data-ans aria-label="Your answer" autocomplete="off" inputmode="decimal"
          placeholder="${placeholder(p)}" value="${esc(response || "")}" ${dis}>
        ${p.unit && p.unit !== "$" ? `<span class="unit-post">${p.unit}</span>` : ""}
      </div>`;
    }
    if (p.kind === "mc") {
      const elim = opts.eliminated || new Set();
      const many = p.choices.length > 2;
      return `<div class="mc-opts ${p.choices.length === 2 ? "two" : ""} ${p.choices.some(c => U().plain(c).length > 60) ? "long" : ""}" role="radiogroup">
        ${p.choices.map((c, i) => {
          let cls = response === i ? "picked" : "";
          if (opts.reveal) {
            if (i === p.answer) cls = response === i ? "sel-right" : "reveal-right";
            else if (response === i || elim.has(i)) cls = "sel-wrong";
          } else if (elim.has(i)) cls = "eliminated";
          return `<button type="button" class="mc-opt ${cls}" data-opt="${i}" role="radio" aria-checked="${response === i}" ${dis || elim.has(i) ? "disabled" : ""}>
            ${many ? `<span class="opt-key">${String.fromCharCode(65 + i)}</span>` : ""}<span class="opt-text">${c}</span></button>`;
        }).join("")}
      </div>`;
    }
    if (p.kind === "multi") {
      const sel = new Set(Array.isArray(response) ? response : []);
      const right = new Set(p.answer);
      return `<p class="muted select-all-note">Select <b>all</b> that apply.</p>
        <div class="mc-opts multi">
        ${p.choices.map((c, i) => {
          let cls = sel.has(i) ? "picked" : "";
          if (opts.reveal) {
            cls = right.has(i) ? (sel.has(i) ? "sel-right" : "reveal-right missed") : (sel.has(i) ? "sel-wrong" : "");
          }
          return `<button type="button" class="mc-opt ${cls}" data-multi="${i}" role="checkbox" aria-checked="${sel.has(i)}" ${dis}>
            <span class="opt-box">${sel.has(i) ? "✓" : ""}</span><span class="opt-text">${c}</span></button>`;
        }).join("")}
      </div>`;
    }
    if (p.kind === "classify") {
      const resp = Array.isArray(response) ? response : [];
      return `<div class="classify">
        ${p.items.map((it, i) => {
          const r = resp[i];
          const ok = opts.reveal ? r === p.answer[i] : null;
          return `<div class="cls-row ${ok === true ? "ok" : ok === false ? "bad" : ""}">
            <div class="cls-item">${it}</div>
            <select class="select cls-select" data-cls="${i}" aria-label="Category for item ${i + 1}" ${dis}>
              <option value="">— choose —</option>
              ${p.cats.map((c, k) => `<option value="${k}" ${r === k ? "selected" : ""}>${c}</option>`).join("")}
            </select>
            ${ok === false ? `<div class="cls-fix">✓ ${p.cats[p.answer[i]]}${p.whys && p.whys[i] ? ` — <span class="muted">${p.whys[i]}</span>` : ""}</div>` : ""}
            ${ok === true && p.whys && p.whys[i] ? `<div class="cls-fix ok muted">${p.whys[i]}</div>` : ""}
          </div>`;
        }).join("")}
      </div>`;
    }
    return `<div class="verdict bad">Unknown question kind: ${esc(p.kind)}</div>`;
  }

  /* Wire up a rendered widget. onChange(response) fires on every edit;
   * onSubmit fires on Enter in a number box. Returns a getter. */
  function bind(root, p, initial, onChange, onSubmit) {
    let resp = initial;
    if (p.kind === "num" || p.kind === "count") {
      const input = root.querySelector("[data-ans]");
      if (input) {
        input.addEventListener("input", () => { resp = input.value; onChange && onChange(resp); });
        input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); onSubmit && onSubmit(); } });
      }
    } else if (p.kind === "mc") {
      root.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
        resp = Number(b.dataset.opt);
        root.querySelectorAll("[data-opt]").forEach(o => {
          const on = Number(o.dataset.opt) === resp;
          o.classList.toggle("picked", on);
          o.setAttribute("aria-checked", on);
        });
        onChange && onChange(resp);
      }));
    } else if (p.kind === "multi") {
      resp = Array.isArray(resp) ? resp.slice() : [];
      root.querySelectorAll("[data-multi]").forEach(b => b.addEventListener("click", () => {
        const i = Number(b.dataset.multi);
        const set = new Set(resp);
        if (set.has(i)) set.delete(i); else set.add(i);
        resp = [...set].sort((a, c) => a - c);
        b.classList.toggle("picked", set.has(i));
        b.setAttribute("aria-checked", set.has(i));
        b.querySelector(".opt-box").textContent = set.has(i) ? "✓" : "";
        onChange && onChange(resp);
      }));
    } else if (p.kind === "classify") {
      resp = Array.isArray(resp) ? resp.slice() : p.items.map(() => null);
      root.querySelectorAll("[data-cls]").forEach(s => s.addEventListener("change", () => {
        resp[Number(s.dataset.cls)] = s.value === "" ? null : Number(s.value);
        onChange && onChange(resp.slice());
      }));
    }
    return () => resp;
  }

  /* Keyboard: A–H / 1–9 pick an option when focus is not in a text box. */
  function key(root, p, e) {
    if (p.kind !== "mc" && p.kind !== "multi") return false;
    let i = -1;
    if (/^[1-9]$/.test(e.key)) i = Number(e.key) - 1;
    else if (/^[a-h]$/i.test(e.key) && p.kind === "mc" && p.choices.length > 2) i = e.key.toLowerCase().charCodeAt(0) - 97;
    if (i < 0 || i >= p.choices.length) return false;
    const btn = root.querySelector(p.kind === "mc" ? `[data-opt="${i}"]` : `[data-multi="${i}"]`);
    if (btn && !btn.disabled) { btn.click(); return true; }
    return false;
  }

  function isBlank(p, r) {
    if (p.kind === "num" || p.kind === "count") return !String(r || "").trim();
    if (p.kind === "mc") return r == null;
    if (p.kind === "multi") return !Array.isArray(r) || !r.length;
    if (p.kind === "classify") return !Array.isArray(r) || r.every(x => x == null);
    return true;
  }
  function isComplete(p, r) {
    if (p.kind === "classify") return Array.isArray(r) && r.length === p.items.length && r.every(x => x != null);
    return !isBlank(p, r);
  }

  /* grade → { correct, wrongCount?, value?, rounded? } */
  function grade(p, r) {
    if (p.kind === "num" || p.kind === "count") {
      const v = parseNumber(r, p.unit);
      const correct = numCorrect(p, v, r);
      return { correct, value: v, valid: Number.isFinite(v), rounded: correct && Math.abs(v - p.answer) > tolFor(p) };
    }
    if (p.kind === "mc") return { correct: r === p.answer, valid: r != null };
    if (p.kind === "multi") {
      const sel = new Set(Array.isArray(r) ? r : []);
      const right = new Set(p.answer);
      let wrong = 0;
      p.choices.forEach((_, i) => { if (sel.has(i) !== right.has(i)) wrong++; });
      return { correct: wrong === 0, wrongCount: wrong, valid: sel.size > 0 };
    }
    if (p.kind === "classify") {
      const resp = Array.isArray(r) ? r : [];
      let wrong = 0;
      p.answer.forEach((a, i) => { if (resp[i] !== a) wrong++; });
      return { correct: wrong === 0, wrongCount: wrong, valid: isComplete(p, r) };
    }
    return { correct: false, valid: false };
  }

  /* The correct answer, in words. */
  function describe(p) {
    if (p.kind === "num" || p.kind === "count") return `<b>${fmtNum(p)}</b>`;
    if (p.kind === "mc") return `<b>${p.choices.length > 2 ? String.fromCharCode(65 + p.answer) + ". " : ""}${p.choices[p.answer]}</b>`;
    if (p.kind === "multi") return p.answer.length ? p.answer.map(i => `<b>${p.choices[i]}</b>`).join("; ") : "<b>none of them</b>";
    if (p.kind === "classify") return "shown item by item above";
    return "";
  }

  function describeResponse(p, r) {
    if (isBlank(p, r)) return "—";
    if (p.kind === "num" || p.kind === "count") return esc(r);
    if (p.kind === "mc") return p.choices.length > 2 ? String.fromCharCode(65 + r) : U().plain(p.choices[r]);
    if (p.kind === "multi") return r.map(i => String.fromCharCode(65 + i)).join(", ");
    if (p.kind === "classify") return `${r.filter((x, i) => x === p.answer[i]).length}/${p.items.length} placed correctly`;
    return "";
  }

  /* A wrong answer is usually a recognisable mistake; name it. */
  function diagnose(p, r) {
    if (p.kind === "mc") return p.whys && r != null ? p.whys[r] : null;
    if (p.kind === "multi" || p.kind === "classify") {
      const g = grade(p, r);
      const what = p.kind === "multi" ? "option" : "item";
      return g.wrongCount ? `${g.wrongCount} ${what}${g.wrongCount === 1 ? " is" : "s are"} wrong — ${p.kind === "multi" ? "either ticked when it should not be, or missed" : "placed in the wrong category"}.` : null;
    }
    if (p.kind === "num" || p.kind === "count") {
      const v = parseNumber(r, p.unit);
      if (!Number.isFinite(v)) return null;
      for (const t of (p.traps || [])) {
        if (Math.abs(v - t.value) <= Math.max(0.011, Math.abs(t.value) * 0.01)) return t.why;
      }
      if (p.answer !== 0 && Math.abs(v + p.answer) <= Math.max(0.011, Math.abs(p.answer) * 0.01)) {
        return "Right size, wrong sign — check which direction the change goes.";
      }
      if (p.answer !== 0 && Math.abs(v * p.answer - 1) <= 0.02) {
        return "That is the <b>reciprocal</b> of the answer — you divided the wrong way round. Ask: cost <em>per unit of which good</em>?";
      }
    }
    return null;
  }

  /* "Why the other options are wrong" — shown with the solution. */
  function whyList(p, r) {
    if (p.kind === "mc" || p.kind === "multi") {
      const rows = [];
      const right = new Set(p.kind === "mc" ? [p.answer] : p.answer);
      p.choices.forEach((c, i) => {
        const w = p.whys && p.whys[i];
        if (!w) return;
        rows.push(`<li class="${right.has(i) ? "why-ok" : "why-bad"}"><span class="why-mark">${right.has(i) ? "✓" : "✗"}</span> <span>${p.choices.length > 2 ? `<b>${String.fromCharCode(65 + i)}.</b> ` : ""}${U().plain(c).length > 90 ? "" : c + " — "}${w}</span></li>`);
      });
      return rows.length ? `<div class="why-list"><b>Option by option</b><ul>${rows.join("")}</ul></div>` : "";
    }
    return "";
  }

  return { parseNumber, numCorrect, render, bind, key, isBlank, isComplete, grade, describe, describeResponse, diagnose, whyList, fmtNum, esc };
})();
