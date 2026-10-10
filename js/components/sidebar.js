// sidebar.js — main navigation. Day / Grow / Focus links show only if the module is in settings.enabled_modules.
// The same list also feeds the top-bar navigation style (see topbar.js).
import { getState, isModuleOn, isPremium } from "../state.js";
import { t } from "../utils/i18n.js";
import { currentParts } from "../router.js";

// module: shown only if that module is enabled.  needsAI: shown only if AI is turned on in settings.
const NAV = [
  { id: "dashboard", icon: "bi-grid-1x2" },
  { id: "day", icon: "bi-sun", module: "day" },
  { id: "grow", icon: "bi-graph-up-arrow", module: "grow" },
  { id: "focus", icon: "bi-bullseye", module: "focus" },
  { id: "ai", icon: "bi-stars", needsAI: true },
  { id: "insights", icon: "bi-bar-chart-line", premium: true },
  { id: "templates", icon: "bi-file-earmark-pdf" },
  { id: "settings", icon: "bi-gear" },
];

export function visibleNav() {
  const { settings } = getState();
  return NAV.filter((i) => (!i.module || isModuleOn(i.module)) && (!i.needsAI || settings.ai_enabled));
}

export function renderNavList() {
  const section = currentParts()[0];
  return visibleNav()
    .map((item) => {
      const active = section === item.id;
      const badge = item.premium && !isPremium() ? `<span class="badge-x badge-premium" style="margin-inline-start:auto">${t("common.premium")}</span>` : "";
      return `<li><a class="nav-link-x ${active ? "active" : ""}" href="#/${item.id}" ${active ? 'aria-current="page"' : ""}>
          <i class="bi ${item.icon}" aria-hidden="true"></i><span>${t(`nav.${item.id}`)}</span>${badge}</a></li>`;
    })
    .join("");
}

export function renderSidebar() {
  const el = document.getElementById("sidebar");
  el.innerHTML = `
    <a class="brand" href="#/dashboard"><span class="brand-mark"><i class="bi bi-layers" aria-hidden="true"></i></span><span>${t("app.name")}</span></a>
    <nav><ul class="nav-list">${renderNavList()}</ul></nav>
    <div class="sidebar-foot">
      ${
        isPremium()
          ? ""
          : `<div class="ui-card is-highlight" style="padding:16px">
               <div class="fw-semibold mb-1">${t("common.premium")}</div>
               <div class="small text-muted-x mb-2">${t("dash.templatesHint")}</div>
               <a class="btn btn-primary btn-sm" href="#/templates">${t("common.upgrade")}</a>
             </div>`
      }
    </div>`;
}

export const toggleSidebar = (open) => document.getElementById("sidebar").classList.toggle("is-open", open);

// keep the active item in sync, and close the mobile drawer after navigating
window.addEventListener("route", () => {
  if (document.getElementById("sidebar").firstElementChild) renderSidebar();
  toggleSidebar(false);
});
