// settings.js — edit the same preferences as onboarding, but all on one page.
// How it works: we edit a COPY (draft) of settings. Nothing is saved until "Save changes".
// The sections come from components/prefSteps.js (shared with onboarding), so they never drift apart.
import { getState, update, resetAll } from "../state.js";
import { t, getLang } from "../utils/i18n.js";
import { applyTheme } from "../utils/theme.js";
import { STEPS } from "../components/prefSteps.js";
import { toast } from "../components/toast.js";
import { openOverlay } from "../components/modal.js";
import { navigate } from "../router.js";

let draft = null; // module-level so a language switch (page redraw) keeps unsaved edits

const SECTION_ICONS = { modules: "bi-grid", layout: "bi-layout-sidebar", theme: "bi-palette", prayer: "bi-moon-stars", ai: "bi-stars" };
const clean = (s) => { const { lang, ...rest } = s; return JSON.stringify(rest); }; // lang saves instantly, so ignore it when comparing

export function render(view) {
  const { user, settings } = getState();
  if (!draft) draft = structuredClone(settings);
  const lang = getLang();
  applyTheme(draft.theme_id); // keep a previewed theme across redraws

  view.innerHTML = `
    <div class="settings">
      <header class="mb-4">
        <h1 class="h3 mb-1">${t("set.title")}</h1>
        <p class="text-muted-x mb-0">${t("set.subtitle")}</p>
      </header>

      <section class="ui-card mb-4" aria-labelledby="set-account">
        <h2 class="ui-card-title" id="set-account"><span><i class="bi bi-person-circle me-2" aria-hidden="true"></i>${t("set.account")}</span></h2>
        <dl class="set-list">
          <div><dt>${t("set.email")}</dt><dd dir="ltr">${user?.email ?? ""}</dd></div>
          <div><dt>${t("set.plan")}</dt><dd>${t(user?.plan === "premium" ? "common.premium" : "common.free")}</dd></div>
          <div><dt>${t("set.language")}<small class="d-block text-muted-x">${t("set.language.hint")}</small></dt>
            <dd><button type="button" class="btn btn-outline-secondary btn-sm" data-lang>${lang === "ar" ? "English" : "العربية"}</button></dd></div>
        </dl>
        <a class="btn btn-outline-secondary btn-sm" href="#/logout"><i class="bi bi-box-arrow-right flip" aria-hidden="true"></i> ${t("set.logout")}</a>
      </section>

      ${STEPS.map((s) => `
        <section class="ui-card mb-4" aria-labelledby="set-${s.id}" data-section="${s.id}">
          <h2 class="ui-card-title" id="set-${s.id}"><span><i class="bi ${SECTION_ICONS[s.id] ?? "bi-gear"} me-2" aria-hidden="true"></i>${t(s.title)}</span></h2>
          <p class="text-muted-x small">${t(s.subtitle)}</p>
          <div data-body>${s.html(draft)}</div>
        </section>`).join("")}

      <section class="ui-card mb-5" aria-labelledby="set-danger">
        <h2 class="ui-card-title" id="set-danger"><span><i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>${t("set.danger")}</span></h2>
        <p class="text-muted-x small">${t("set.reset.hint")}</p>
        <button type="button" class="btn btn-outline-secondary btn-sm" data-reset>${t("set.reset")}</button>
      </section>

      <div class="save-bar" data-savebar hidden role="status">
        <span><i class="bi bi-dot" aria-hidden="true"></i> ${t("set.unsaved")}</span>
        <span class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" data-discard>${t("set.discard")}</button>
          <button type="button" class="btn btn-primary btn-sm" data-save>${t("set.save")}</button>
        </span>
      </div>
    </div>`;

  const bar = view.querySelector("[data-savebar]");
  const saveBtn = view.querySelector("[data-save]");
  const allValid = () => STEPS.every((s) => !s.valid || s.valid(draft));
  const refreshBar = () => {
    bar.hidden = clean(draft) === clean(getState().settings);
    saveBtn.disabled = !allValid();
  };

  // Wire every section. refreshNav is the hook the steps call when validity changes.
  STEPS.forEach((s) => s.bind(view.querySelector(`[data-section="${s.id}"] [data-body]`), draft, { refreshNav: refreshBar }));
  view.addEventListener("input", refreshBar);  // bubbles after each step's own handler has updated the draft
  view.addEventListener("change", refreshBar);
  refreshBar();

  view.querySelector("[data-lang]").onclick = () => update({ settings: { lang: lang === "ar" ? "en" : "ar" } });

  saveBtn.onclick = () => {
    if (!allValid()) return toast(t("set.minModule"), { type: "info" });
    const { lang: _ignore, ...answers } = draft; // never overwrite the language with the draft's old copy
    update({ settings: answers }); // main.js re-applies theme/layout and redraws this page
    toast(t("set.saved"), { type: "success" });
  };

  view.querySelector("[data-discard]").onclick = () => {
    draft = null;
    applyTheme(getState().settings.theme_id);
    render(view);
  };

  view.querySelector("[data-reset]").onclick = () => {
    const body = document.createElement("p");
    body.textContent = t("set.reset.confirmText");
    const foot = document.createElement("div");
    foot.className = "d-flex gap-2 justify-content-end";
    foot.innerHTML = `<button type="button" class="btn btn-outline-secondary" data-no>${t("common.cancel")}</button>
      <button type="button" class="btn btn-primary" data-yes>${t("set.reset")}</button>`;
    const ov = openOverlay({ kind: "modal", title: t("set.reset.confirm"), body, footer: foot });
    foot.querySelector("[data-no]").onclick = () => ov.close();
    foot.querySelector("[data-yes]").onclick = () => {
      ov.close();
      draft = null;
      resetAll();
      navigate("login");
    };
  };
}

export function destroy({ refreshing } = {}) {
  if (refreshing) return; // language switch / save: keep the draft
  draft = null; // leaving the page: drop unsaved edits and restore the saved theme
  applyTheme(getState().settings.theme_id);
}
