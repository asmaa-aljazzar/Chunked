import { mountSidebar } from "./components/sidebar.js?v=6";
import { mountTopbar } from "./components/topbar.js?v=7";
import { enhanceSelects } from "./components/dropdown.js?v=1";
import { applyLanguage, getLanguage, LANGUAGE_STORAGE_KEY } from "./utils/language.js?v=3";
import { getProfile } from "./utils/profile.js?v=1";

applyLanguage(getLanguage(), { persist: false });

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDateFieldMinimums() {
  const now = new Date();
  const today = formatLocalDate(now);
  const localDateTime = `${today}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.min = today;
    if (!input.title) input.title = "Choose today or a future date.";
  });

  document.querySelectorAll('input[type="datetime-local"]').forEach((input) => {
    input.min = localDateTime;
    if (!input.title) input.title = "Choose a date and time that has not passed.";
  });
}

setDateFieldMinimums();

const sidebarRoot = document.querySelector("#app-nav");

if (sidebarRoot) {
  mountSidebar(sidebarRoot, sidebarRoot.dataset.activePage);
}

const topbarRoot = document.querySelector("#app-topbar");

if (topbarRoot) {
  mountTopbar(topbarRoot);
}

function syncProfilePageContent(profile = getProfile()) {
  document.querySelectorAll("[data-profile-name]").forEach((element) => { element.textContent = profile.displayName; });
  document.querySelectorAll("[data-profile-email]").forEach((element) => { element.textContent = profile.email; });
  const initials = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
  document.querySelectorAll("[data-profile-initials]").forEach((element) => { element.textContent = initials || "?"; });
}

syncProfilePageContent();
document.addEventListener("chunked:profilechange", (event) => syncProfilePageContent(event.detail));
window.addEventListener("storage", (event) => {
  if (event.key === "chunked-profile-v1") syncProfilePageContent();
});

const progressObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-progress-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -5% 0px" })
  : null;
const observedProgress = new WeakSet();
const progressSelector = ".progress-track, .grow-progress, .insights-progress, .progress-ring";

function observeProgress(element) {
  if (!(element instanceof Element) || !element.matches(progressSelector) || observedProgress.has(element)) return;
  observedProgress.add(element);

  const siblings = [...(element.parentElement?.querySelectorAll(progressSelector) || [])];
  const stagger = Math.min(Math.max(0, siblings.indexOf(element)) * 65, 260);
  element.style.setProperty("--progress-delay", `${stagger}ms`);

  if (element.classList.contains("progress-ring")) {
    const accessibleValue = element.getAttribute("aria-valuenow");
    const labelValue = element.getAttribute("aria-label")?.match(/(\d+(?:\.\d+)?)\s*percent/i)?.[1];
    const value = Number(accessibleValue ?? labelValue ?? 0);
    element.style.setProperty("--ring-target", `${Math.min(100, Math.max(0, value))}%`);
  }

  if (progressObserver) progressObserver.observe(element);
  else element.classList.add("is-progress-visible");
}

function scanProgress(root) {
  if (root instanceof Element) observeProgress(root);
  root.querySelectorAll?.(progressSelector).forEach(observeProgress);
}

scanProgress(document);
function scanControls(root) {
  if (root instanceof Element && root.matches('input[type="checkbox"], input[type="radio"]')) {
    root.classList.add("chunked-check");
  }
  root.querySelectorAll?.('input[type="checkbox"], input[type="radio"]').forEach((input) => input.classList.add("chunked-check"));
  enhanceSelects(root);
}

scanControls(document);
new MutationObserver((records) => {
  records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof Element) {
      scanProgress(node);
      scanControls(node);
    }
  }));
}).observe(document.body, { childList: true, subtree: true });

window.addEventListener("storage", (event) => {
  if (event.key === LANGUAGE_STORAGE_KEY) applyLanguage(event.newValue, { persist: false });
});
