import { applyTheme, getActiveThemeKey } from "./theme.js?v=2";

export const SUBSCRIPTION_STORAGE_KEY = "chunked-demo-plan-v1";
const PREMIUM_THEME_KEYS = new Set(["autumn", "summer", "spring", "winter", "lavender", "ivory", "sage", "graphite", "midnight", "forest", "gothic-classic", "nocturne", "rose-noir"]);

export function getSubscription() {
  try {
    const value = JSON.parse(localStorage.getItem(SUBSCRIPTION_STORAGE_KEY) || "null");
    return value?.plan === "premium" ? value : { plan: "free", cadence: null };
  } catch {
    return { plan: "free", cadence: null };
  }
}

export function isPremium() {
  return getSubscription().plan === "premium";
}

export function isPremiumTheme(themeKey) {
  return PREMIUM_THEME_KEYS.has(themeKey);
}

export function normalizeThemeForPlan() {
  if (!isPremium() && isPremiumTheme(getActiveThemeKey())) applyTheme("light");
}

export function saveSubscription(plan, cadence = null) {
  const value = {
    plan: plan === "premium" ? "premium" : "free",
    cadence: plan === "premium" && cadence === "yearly" ? "yearly" : plan === "premium" ? "monthly" : null,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(value));
    normalizeThemeForPlan();
    document.dispatchEvent(new CustomEvent("chunked:planchange", { detail: value }));
    return true;
  } catch {
    return false;
  }
}

export function syncPlanPresentation(root = document) {
  const premium = isPremium();
  document.documentElement.dataset.plan = premium ? "premium" : "free";

  root.querySelectorAll("[data-premium-upsell]").forEach((element) => {
    element.hidden = premium;
  });
  root.querySelectorAll("[data-premium-label]").forEach((element) => {
    element.hidden = !premium;
  });

  root.querySelectorAll(".sidebar-link--premium").forEach((link) => {
    const crown = link.querySelector(".sidebar-link__premium");
    if (crown) crown.hidden = premium;
    if (premium) {
      link.removeAttribute("aria-label");
      link.removeAttribute("title");
    } else {
      link.setAttribute("aria-label", "Insights, Premium feature");
      link.title = "Premium feature";
    }
  });

  return premium;
}

document.addEventListener("chunked:planchange", () => syncPlanPresentation());
window.addEventListener("storage", (event) => {
  if (event.key === SUBSCRIPTION_STORAGE_KEY) syncPlanPresentation();
});
