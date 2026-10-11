// router.js — tiny hash router. "#/day/week" -> page module "pages/day.js", parts = ["day","week"].
// A page module exports: render(view, { parts }) and optionally destroy().
import { t, applyI18n } from "./utils/i18n.js";
import { getState } from "./state.js";
import { logout } from "./api.js";

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
const PUBLIC = new Set(["login", "signup", "forgot"]); // reachable while logged out
const BARE = new Set(["onboarding", "login", "signup", "forgot"]); // screens without sidebar/topbar

let current = null; // the page module currently on screen
let renderId = 0; // lets a newer navigation cancel an older, slower one

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

/** Who may see what. Returns the route to go to instead, or null if the visit is allowed. */
function guard(key) {
  const { user, settings } = getState();
  if (!user) return PUBLIC.has(key) ? null : "login";
  if (user.role === "admin") return key === "admin" ? null : "admin"; // admins only see the admin area
  if (key === "admin") return "dashboard"; // typing #/admin is not enough: the real check is in Laravel
  if (PUBLIC.has(key)) return settings.onboarded ? "dashboard" : "onboarding";
  if (!settings.onboarded && key !== "onboarding") return "onboarding";
  return null;
}

async function render(opts = {}) {
  const view = document.getElementById("view");
  const parts = currentParts();
  const key = parts[0];

  if (key === "logout") {
    logout();
    return navigate("login");
  }

  const redirect = guard(key);
  if (redirect) return navigate(redirect);

  const myId = ++renderId;
  current?.destroy?.({ refreshing: !!opts.keepScroll }); // a refresh redraws the SAME page, so pages may keep their state
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
  if (myId !== renderId) return; // user navigated again while this page was loading

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
