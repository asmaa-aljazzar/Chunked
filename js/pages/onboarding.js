// onboarding.js — 5-step wizard, skippable. Saves into settings (same shape as user_settings) when finished.
// To add / remove / reorder steps, edit STEPS below; each step is { id, title, subtitle, html(draft), bind(root, draft, ctx), valid(draft) }.
import { getState, update, MODULES } from "../state.js";
import { t, getLang } from "../utils/i18n.js";
import { THEMES, applyTheme } from "../utils/theme.js";
import { navigate } from "../router.js";
import { toast } from "../components/toast.js";
import { getPrayerTimes } from "../utils/prayerTimes.js";
import { CHUNKS } from "../../data/chunks.js";

const METHODS = [3, 4, 5, 8, 9, 10, 16, 23, 2, 1, 13]; // Aladhan method ids (see aladhan.com/calculation-methods)
const MODULE_ICONS = { day: "bi-sun", grow: "bi-graph-up-arrow", focus: "bi-bullseye" };

let wiz = null; // { step, draft } — module-level so a language switch (which redraws the page) keeps your answers

/** A big selectable card: <input> is visually hidden but real, so keyboard + screen readers work. */
const choice = ({ type, name, value, checked, icon, title, desc }) => `
  <label class="choice">
    <input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""}>
    ${icon ? `<i class="bi ${icon} choice-icon" aria-hidden="true"></i>` : ""}
    <span class="choice-text"><strong>${title}</strong>${desc ? `<small>${desc}</small>` : ""}</span>
    <i class="bi bi-check-circle-fill choice-check" aria-hidden="true"></i>
  </label>`;

const STEPS = [
  {
    id: "modules",
    title: "ob.modules.title",
    subtitle: "ob.modules.subtitle",
    html: (d) => `<div class="choices">${MODULES.map((m) =>
      choice({ type: "checkbox", name: "module", value: m, checked: d.enabled_modules.includes(m), icon: MODULE_ICONS[m], title: t(`nav.${m}`), desc: t(`mod.${m}.desc`) }),
    ).join("")}</div>
    <p class="field-error mt-3" id="mod-min" hidden><i class="bi bi-exclamation-circle" aria-hidden="true"></i> ${t("ob.modules.min")}</p>`,
    bind: (root, d, { refreshNav }) => {
      root.querySelectorAll('input[name="module"]').forEach((el) => {
        el.onchange = () => {
          d.enabled_modules = MODULES.filter((m) => root.querySelector(`input[value="${m}"]`).checked);
          root.querySelector("#mod-min").hidden = d.enabled_modules.length > 0;
          refreshNav();
        };
      });
    },
    valid: (d) => d.enabled_modules.length > 0,
  },

  {
    id: "layout",
    title: "ob.layout.title",
    subtitle: "ob.layout.subtitle",
    html: (d) => `
      <h3 class="h6 mb-2">${t("ob.density")}</h3>
      <div class="choices choices-2 mb-4">
        ${["comfortable", "compact"].map((v) => choice({ type: "radio", name: "density", value: v, checked: d.density === v, title: t(`ob.density.${v}`), desc: t(`ob.density.${v}.desc`) })).join("")}
      </div>
      <h3 class="h6 mb-2">${t("ob.nav")}</h3>
      <div class="choices choices-2">
        ${["sidebar", "top"].map((v) => choice({ type: "radio", name: "nav_style", value: v, checked: d.nav_style === v, icon: v === "top" ? "bi-layout-three-columns" : "bi-layout-sidebar", title: t(`ob.nav.${v}`), desc: t(`ob.nav.${v}.desc`) })).join("")}
      </div>`,
    bind: (root, d) => {
      root.querySelectorAll('input[name="density"]').forEach((el) => (el.onchange = () => (d.density = el.value)));
      root.querySelectorAll('input[name="nav_style"]').forEach((el) => (el.onchange = () => (d.nav_style = el.value)));
    },
  },

  {
    id: "theme",
    title: "ob.theme.title",
    subtitle: "ob.theme.subtitle",
    html: (d) => `
      <div class="choices choices-theme mb-4">
        ${THEMES.map((th) => `
          <label class="choice choice-theme">
            <input type="radio" name="theme_id" value="${th.id}" ${d.theme_id === th.id ? "checked" : ""}>
            <span class="theme-chip" style="--sw-bg:${th.bg};--sw-accent:${th.accent}"><span></span></span>
            <span class="choice-text"><strong>${t(`theme.${th.key}`)}</strong></span>
            <i class="bi bi-check-circle-fill choice-check" aria-hidden="true"></i>
          </label>`).join("")}
      </div>
      <div class="ui-card">
        <p class="small text-muted-x mb-2">${t("ob.theme.preview")}</p>
        <div class="chunks mb-3">${CHUNKS.slice(0, 3).map((c, i) => `<div class="chunk ${i === 1 ? "is-current" : ""}"><div class="chunk-name">${t(`prayer.${c.id}`)}</div></div>`).join("")}</div>
        <button type="button" class="btn btn-primary" tabindex="-1">${t("ob.theme.sampleButton")}</button>
        <span class="readiness is-green ms-2"><i class="bi bi-check-circle" aria-hidden="true"></i>OK</span>
      </div>`,
    bind: (root, d) => {
      root.querySelectorAll('input[name="theme_id"]').forEach((el) => {
        el.onchange = () => {
          d.theme_id = Number(el.value);
          applyTheme(d.theme_id); // live preview: the whole page re-colors; it is only saved on Finish
        };
      });
    },
  },

  {
    id: "prayer",
    title: "ob.prayer.title",
    subtitle: "ob.prayer.subtitle",
    html: (d) => `
      <div class="row g-3">
        <div class="col-sm-6"><label class="form-label fw-semibold" for="pr-city">${t("ob.city")}</label>
          <input class="form-control" id="pr-city" value="${d.city}"></div>
        <div class="col-sm-6"><label class="form-label fw-semibold" for="pr-country">${t("ob.country")}</label>
          <input class="form-control" id="pr-country" value="${d.country}"></div>
        <div class="col-12"><label class="form-label fw-semibold" for="pr-method">${t("ob.method")}</label>
          <select class="form-select" id="pr-method">${METHODS.map((m) => `<option value="${m}" ${Number(d.calculation_method) === m ? "selected" : ""}>${t(`method.${m}`)}</option>`).join("")}</select></div>
      </div>

      <div class="form-check form-switch my-4">
        <input class="form-check-input" type="checkbox" role="switch" id="pr-notify" ${d.prayer_notifications ? "checked" : ""}>
        <label class="form-check-label" for="pr-notify">${t("ob.notify")}</label>
      </div>

      <details class="mb-4">
        <summary class="fw-semibold">${t("ob.offsets")}</summary>
        <p class="small text-muted-x mt-2">${t("ob.offsets.hint")}</p>
        <div class="row g-2">${CHUNKS.map((c) => `
          <div class="col-4 col-md-2"><label class="form-label small" for="off-${c.id}">${t(`prayer.${c.id}`)}</label>
            <input class="form-control" type="number" step="1" min="-60" max="60" id="off-${c.id}" value="${d.prayer_offsets[c.id] ?? 0}" dir="ltr"></div>`).join("")}
        </div>
      </details>

      <button type="button" class="btn btn-outline-secondary" id="pr-show">${t("ob.times.show")}</button>
      <div class="mt-3" id="pr-times" aria-live="polite"></div>`,
    bind: (root, d) => {
      root.querySelector("#pr-city").oninput = (e) => (d.city = e.target.value.trim());
      root.querySelector("#pr-country").oninput = (e) => (d.country = e.target.value.trim());
      root.querySelector("#pr-method").onchange = (e) => (d.calculation_method = Number(e.target.value));
      root.querySelector("#pr-notify").onchange = (e) => (d.prayer_notifications = e.target.checked);
      CHUNKS.forEach((c) => {
        root.querySelector(`#off-${c.id}`).oninput = (e) => (d.prayer_offsets[c.id] = Number(e.target.value) || 0);
      });

      const out = root.querySelector("#pr-times");
      root.querySelector("#pr-show").onclick = async () => {
        out.textContent = t("ob.times.loading");
        const day = await getPrayerTimes(d);
        out.innerHTML = `${day.source === "fallback" ? `<p class="small text-muted-x"><i class="bi bi-info-circle" aria-hidden="true"></i> ${t("ob.times.fallback")}</p>` : ""}
          <ul class="times">${day.chunks.map((c) => `<li><span>${t(`prayer.${c.id}`)}</span><strong dir="ltr">${c.label}</strong></li>`).join("")}</ul>`;
      };
    },
  },

  {
    id: "ai",
    title: "ob.ai.title",
    subtitle: "ob.ai.subtitle",
    html: (d) => `
      <div class="form-check form-switch mb-1">
        <input class="form-check-input" type="checkbox" role="switch" id="ai-on" ${d.ai_enabled ? "checked" : ""}>
        <label class="form-check-label fw-semibold" for="ai-on">${t("ob.ai.enabled")}</label>
      </div>
      <p class="small text-muted-x mb-4">${t("ob.ai.enabledHint")}</p>

      <h3 class="h6 mb-2">${t("ob.energy")}</h3>
      <div class="choices choices-2 mb-4">
        ${[["morning", "bi-brightness-high"], ["evening", "bi-moon"]].map(([v, icon]) => choice({ type: "radio", name: "energy", value: v, checked: d.energy_pattern === v, icon, title: t(`energy.${v}`) })).join("")}
      </div>

      <label class="form-label fw-semibold" for="ai-bio">${t("ob.bio")}</label>
      <textarea class="form-control" id="ai-bio" rows="3" maxlength="280" placeholder="${t("ob.bio.placeholder")}">${d.ai_bio}</textarea>`,
    bind: (root, d) => {
      root.querySelector("#ai-on").onchange = (e) => (d.ai_enabled = e.target.checked);
      root.querySelectorAll('input[name="energy"]').forEach((el) => (el.onchange = () => (d.energy_pattern = el.value)));
      root.querySelector("#ai-bio").oninput = (e) => (d.ai_bio = e.target.value);
    },
  },
];

function finish(draft) {
  wiz = null;
  const { lang, ...answers } = draft; // language is saved the moment it is switched; the draft's copy is stale
  update({ settings: { ...answers, onboarded: true } });
  toast(t("ob.done"), { type: "success" });
  navigate("dashboard");
}

function skip() {
  wiz = null;
  update({ settings: { onboarded: true } }); // keeps the defaults / what was saved before
  navigate("dashboard");
}

export function render(view) {
  if (!wiz) wiz = { step: 0, draft: structuredClone(getState().settings) };
  const { draft } = wiz;
  const step = STEPS[wiz.step];
  const last = wiz.step === STEPS.length - 1;
  const lang = getLang();

  applyTheme(draft.theme_id); // keep the in-progress theme choice when the page redraws (e.g. language switch)

  view.innerHTML = `
    <div class="wizard">
      <header class="wizard-top">
        <a class="brand" href="#/onboarding"><span class="brand-mark"><i class="bi bi-layers" aria-hidden="true"></i></span><span>${t("app.name")}</span></a>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="icon-btn fw-semibold" data-lang aria-label="${t("top.language")}">${lang === "ar" ? "EN" : "ع"}</button>
          <button type="button" class="btn btn-link" data-skip>${t("ob.skip")}</button>
        </div>
      </header>

      <div class="wizard-card">
        <p class="small text-muted-x mb-2" id="wiz-count">${t("ob.step", { n: wiz.step + 1, total: STEPS.length })}</p>
        <div class="bar mb-4" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${wiz.step + 1}"><span style="width:${((wiz.step + 1) / STEPS.length) * 100}%"></span></div>

        <h1 class="h3 mb-1">${t(step.title)}</h1>
        <p class="text-muted-x mb-4">${t(step.subtitle)}</p>

        <div id="wiz-body">${step.html(draft)}</div>

        <footer class="wizard-foot">
          <button type="button" class="btn btn-outline-secondary" data-back ${wiz.step === 0 ? "hidden" : ""}>
            <i class="bi bi-arrow-left flip" aria-hidden="true"></i> ${t("ob.back")}</button>
          <button type="button" class="btn btn-primary ms-auto" data-next style="min-width:120px">${t(last ? "ob.finish" : "ob.next")}</button>
        </footer>
      </div>
    </div>`;

  const next = view.querySelector("[data-next]");
  const refreshNav = () => (next.disabled = step.valid ? !step.valid(draft) : false);
  refreshNav();

  step.bind(view.querySelector("#wiz-body"), draft, { refreshNav });

  view.querySelector("[data-lang]").onclick = () => update({ settings: { lang: lang === "ar" ? "en" : "ar" } });
  view.querySelector("[data-skip]").onclick = skip;
  view.querySelector("[data-back]").onclick = () => {
    wiz.step -= 1;
    render(view);
  };
  next.onclick = () => {
    if (step.valid && !step.valid(draft)) return;
    if (last) return finish(draft);
    wiz.step += 1;
    render(view);
    view.querySelector("h1")?.focus?.();
  };
}

export function destroy({ refreshing } = {}) {
  if (refreshing) return; // language switch etc.: keep the answers and the current step
  // Leaving without finishing: forget the draft and restore the saved theme.
  wiz = null;
  applyTheme(getState().settings.theme_id);
}
