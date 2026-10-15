import { getProfile } from "../utils/profile.js";
import { getDayMode } from "../utils/day-preferences.js";

const greeting = document.querySelector("#greeting");
const todayDate = document.querySelector("#today-date");
const welcomeName = document.querySelector("#welcome-name");

function syncDashboardPreferences() {
  const profile = getProfile();
  if (welcomeName) welcomeName.textContent = profile.displayName;

  const isCustom = getDayMode() === "custom";
  const periodNames = ["Custom period 1", "Custom period 2", "Custom period 3", "Custom period 4", "Custom period 5"];
  document.querySelectorAll(".rhythm-item[data-period]").forEach((item, index) => {
    const name = item.querySelector(".rhythm-item__name");
    const time = item.querySelector(".rhythm-item__time");
    name.dataset.prayerLabel ||= name.textContent;
    time.dataset.prayerRange ||= time.textContent;
    name.textContent = isCustom ? periodNames[index] : name.dataset.prayerLabel;
    time.textContent = isCustom ? "No time set" : time.dataset.prayerRange;
    time.hidden = isCustom;
  });
  document.querySelector(".day-rhythm__sample-note").textContent = isCustom
    ? "Custom period slots · no times set"
    : "Sample time ranges for this preview";

  const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  document.querySelectorAll(".task-period").forEach((period) => {
    const original = period.dataset.prayerLabel || period.textContent.trim();
    if (!period.dataset.prayerLabel) period.dataset.prayerLabel = original;
    const prayerIndex = prayerNames.findIndex((name) => original.toLowerCase().includes(name.toLowerCase()));
    period.textContent = isCustom && prayerIndex >= 0 ? periodNames[prayerIndex] : original;
  });
}

syncDashboardPreferences();
document.addEventListener("chunked:profilechange", () => syncDashboardPreferences());
document.addEventListener("chunked:daymodechange", () => syncDashboardPreferences());
window.addEventListener("storage", (event) => {
  if (event.key === "chunked-profile-v1" || event.key === "chunked-day-mode-v1") syncDashboardPreferences();
});

function updateDateAndGreeting() {
  if (!greeting) return;
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  greeting.textContent = greetingText;

  if (todayDate) todayDate.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

updateDateAndGreeting();
const revealTargets = document.querySelectorAll(
  ".dashboard-content > section, .dashboard-grid > *, .dashboard-content > .demo-note",
);
const supportsScrollReveal = "IntersectionObserver" in window
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (supportsScrollReveal) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

  revealTargets.forEach((target, index) => {
    target.classList.add("dashboard-reveal");
    target.style.setProperty("--reveal-delay", `${Math.min(index * 65, 260)}ms`);
    revealObserver.observe(target);
  });
}
