// onboarding.js — 5-step wizard, skippable. Saves into settings (same shape as user_settings) when finished.
// To add / remove / reorder steps, edit STEPS below; each step is { id, title, subtitle, html(draft), bind(root, draft, ctx), valid(draft) }.
import { getState, update } from "../state.js";
import { t, getLang } from "../utils/i18n.js";
import { applyTheme } from "../utils/theme.js";
import { STEPS } from "../components/prefSteps.js";
import { navigate } from "../router.js";
import { toast } from "../components/toast.js";

let wiz = null; // { step, draft } — module-level so a language switch (which redraws the page) keeps your answers

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
