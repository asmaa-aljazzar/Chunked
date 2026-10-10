// router.js — tiny hash router. "#/day/week" -> page module "pages/day.js", parts = ["day","week"].
// A page module exports: render(view, { parts }) and optionally destroy().
import { t, applyI18n } from "./utils/i18n.js";

// first URL segment -> page file in js/pages/
const ROUTES = {
  dashboard: "dashboard",
  day: "day",
  grow: "grow",
  focus: "focus",
  ai: "ai",
  insights: "insights",
  templates: "templates", // printable PDFs (the money feature)
  settings: "settings",
  onboarding: "onboarding",
  login: "auth",
  signup: "auth",
  forgot: "auth",
  admin: "admin",
};
const BARE = new Set(["onboarding", "login", "signup", "forgot"]); // screens without sidebar/topbar

let current = null; // the page module currently on screen

export const currentParts = () => (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");

export function navigate(path) {
  location.hash = path.startsWith("#") ? path : `#/${path.replace(/^\//, "")}`;
}

export function start() {
  window.addEventListener("hashchange", render);
  return render();
}

/** Re-render the current page (used after language/theme/settings changes). */
export function refresh() {
  return render({ keepScroll: true });
}

async function render(opts = {}) {
  const view = document.getElementById("view");
  const parts = currentParts();
  const key = parts[0];

  current?.destroy?.();
  current = null;

  document.body.dataset.layout = BARE.has(key) ? "bare" : "app";
  view.replaceChildren();

  let mod;
  if (!ROUTES[key]) {
    mod = await import("./pages/notFound.js");
  } else {
    try {
      mod = await import(`./pages/${ROUTES[key]}.js`);
    } catch (err) {
      // Page file doesn't exist yet (it's on the build plan) — show a friendly placeholder.
      console.warn(`[router] pages/${ROUTES[key]}.js not loaded:`, err.message);
      mod = { render: (el) => placeholder(el, key) };
    }
  }

  current = mod;
  mod.render(view, { parts });
  applyI18n(view);
  document.title = `${t(`nav.${key}`) !== `nav.${key}` ? t(`nav.${key}`) + " · " : ""}${t("app.name")}`;

  window.dispatchEvent(new CustomEvent("route", { detail: { parts } }));
  if (!opts.keepScroll) {
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
}

function placeholder(view, key) {
  view.innerHTML = `
    <div class="empty">
      <i class="bi bi-hourglass-split" aria-hidden="true"></i>
      <h2>${t(`nav.${key}`) !== `nav.${key}` ? t(`nav.${key}`) : key}</h2>
      <p data-i18n="common.comingSoon"></p>
      <p class="small" data-i18n="common.comingSoonHint"></p>
    </div>`;
}
