// topbar.js — menu button (mobile), top navigation (when nav style = "top"), search, quick add,
// notifications, AI, theme + language switches, profile menu.
import { getState, update } from "../state.js";
import { t } from "../utils/i18n.js";
import { THEMES } from "../utils/theme.js";
import { renderNavList, toggleSidebar } from "./sidebar.js";
import { openDrawer } from "./drawer.js";
import { toast } from "./toast.js";
import { navigate } from "../router.js";
import { CHUNKS } from "../../data/chunks.js";

export function renderTopbar() {
  const { settings, user } = getState();
  const topbar = document.getElementById("topbar");
  const initial = (user?.name ?? "S").trim().charAt(0).toUpperCase();

  topbar.innerHTML = `
    <button type="button" class="icon-btn menu-btn" data-act="menu" aria-label="${t("top.menu")}"><i class="bi bi-list fs-4" aria-hidden="true"></i></button>
    ${settings.nav_style === "top" ? `<a class="brand" href="#/dashboard">${t("app.name")}</a><nav class="topnav"><ul class="nav-list flex-row">${renderNavList()}</ul></nav>` : ""}

    <div class="search">
      <i class="bi bi-search" aria-hidden="true"></i>
      <input class="form-control" type="search" placeholder="${t("top.search")}" aria-label="${t("top.search")}">
    </div>

    <div class="topbar-actions">
      <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-1" data-act="quickadd" style="min-height:var(--tap)">
        <i class="bi bi-plus-lg" aria-hidden="true"></i><span class="d-none d-sm-inline">${t("top.quickAdd")}</span>
      </button>
      <button type="button" class="icon-btn" data-act="notifications" aria-label="${t("top.notifications")}"><i class="bi bi-bell" aria-hidden="true"></i></button>
      ${settings.ai_enabled ? `<button type="button" class="icon-btn" data-act="ai" aria-label="${t("top.ai")}"><i class="bi bi-stars" aria-hidden="true"></i></button>` : ""}

      <div class="dropdown">
        <button type="button" class="icon-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-label="${t("top.theme")}"><i class="bi bi-palette" aria-hidden="true"></i></button>
        <ul class="dropdown-menu dropdown-menu-end">
          ${THEMES.map(
            (th) => `<li><button type="button" class="dropdown-item ${th.id === settings.theme_id ? "active" : ""}" data-theme-pick="${th.id}">
              <span class="swatch" style="--sw-bg:${th.bg};--sw-accent:${th.accent}"></span>${t(`theme.${th.key}`)}</button></li>`,
          ).join("")}
        </ul>
      </div>

      <button type="button" class="icon-btn fw-semibold" data-act="lang" aria-label="${t("top.language")}">${settings.lang === "ar" ? "EN" : "ع"}</button>

      <div class="dropdown">
        <button type="button" class="icon-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-label="${t("top.profile")}"
          style="background:var(--accent-soft);color:var(--accent-text);font-weight:700">${initial}</button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#/settings"><i class="bi bi-gear" aria-hidden="true"></i>${t("nav.settings")}</a></li>
          ${user?.role === "admin" ? `<li><a class="dropdown-item" href="#/admin"><i class="bi bi-shield-check" aria-hidden="true"></i>${t("nav.admin")}</a></li>` : ""}
          <li><a class="dropdown-item" href="#/login"><i class="bi bi-box-arrow-right" aria-hidden="true"></i>${t("top.logout")}</a></li>
        </ul>
      </div>
    </div>`;
}

// One delegated listener (set once; survives re-renders of the topbar)
document.getElementById("topbar").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-theme-pick]");
  if (pick) return update({ settings: { theme_id: Number(pick.dataset.themePick) } });

  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  const { settings } = getState();
  if (act === "menu") toggleSidebar(true);
  if (act === "lang") update({ settings: { lang: settings.lang === "ar" ? "en" : "ar" } });
  if (act === "ai") navigate("ai");
  if (act === "notifications") toast(t("top.notifications"));
  if (act === "quickadd") openQuickAdd();
});

// Demo of the drawer component; the real task form arrives on Day 4.
function openQuickAdd() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label class="form-label fw-semibold" for="qa-title">${t("task.title")}</label>
    <input id="qa-title" class="form-control mb-3" required>
    <label class="form-label fw-semibold" for="qa-chunk">${t("task.chunk")}</label>
    <select id="qa-chunk" class="form-select mb-3">${CHUNKS.map((c) => `<option value="${c.id}">${t(`prayer.${c.id}`)}</option>`).join("")}</select>
    <label class="form-label fw-semibold" for="qa-pri">${t("task.priority")}</label>
    <select id="qa-pri" class="form-select">
      <option>${t("task.priority.low")}</option><option selected>${t("task.priority.normal")}</option><option>${t("task.priority.high")}</option>
    </select>`;

  const footer = document.createElement("div");
  footer.className = "d-flex gap-2 w-100 justify-content-end";
  footer.innerHTML = `<button type="button" class="btn btn-outline-secondary" data-cancel>${t("common.cancel")}</button>
    <button type="submit" class="btn btn-primary">${t("common.add")}</button>`;

  const d = openDrawer({ title: t("top.quickAdd"), body: form, footer });
  footer.querySelector("[data-cancel]").onclick = d.close;
  footer.querySelector('[type="submit"]').onclick = (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    d.close();
    toast(t("task.added"), { type: "success" });
  };
}

window.addEventListener("route", () => {
  if (document.getElementById("topbar").firstElementChild) renderTopbar();
});
