import { applyTheme, getActiveMode, getActiveThemeKey, THEMES } from "../utils/theme.js";
import { applyLanguage, getLanguage, LANGUAGE_STORAGE_KEY } from "../utils/language.js?v=3";
import { getProfile, saveProfile, PROFILE_STORAGE_KEY } from "../utils/profile.js";
import { DAY_MODE_STORAGE_KEY, getDayMode } from "../utils/day-preferences.js";

const themeOptions = document.querySelector("#theme-options");
const currentThemeLabel = document.querySelector("#theme-current");
const themeStatus = document.querySelector("#theme-status");
const profileForm = document.querySelector("#profile-settings-form");
const profileNameInput = document.querySelector("#profile-name");
const profileEmailInput = document.querySelector("#profile-email");
const profileNamePreview = document.querySelector("#profile-display-name");
const profileAvatar = document.querySelector("#profile-avatar");
const profileStatus = document.querySelector("#profile-settings-status");
const languageSelect = document.querySelector("#interface-language");
const languageStatus = document.querySelector("#language-settings-status");
const dayModeInputs = [...document.querySelectorAll('input[name="dayMode"]')];
const dayStatus = document.querySelector("#day-settings-status");
const settingsPreferenceInputs = {
  compactSpacing: document.querySelector("#compact-spacing"),
  reducedMotion: document.querySelector("#reduced-motion"),
  taskReminders: document.querySelector("#task-reminders"),
  habitReminders: document.querySelector("#habit-reminders"),
  dailyPlanningReminder: document.querySelector("#daily-planning-reminder"),
};
const notificationStatus = document.querySelector("#notification-settings-status");
const resetButton = document.querySelector("#reset-demo-settings");
const resetStatus = document.querySelector("#reset-settings-status");
const SETTINGS_PREFERENCES_KEY = "chunked-settings-preferences-v1";
const groupOrder = ["Base", "Seasonal", "Style", "Occasion"];
const premiumThemeKeys = new Set(["autumn", "summer", "spring", "winter"]);

function readSettingsPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_PREFERENCES_KEY) || "{}");
    return Object.fromEntries(Object.keys(settingsPreferenceInputs).map((key) => [key, saved[key] === true]));
  } catch {
    return Object.fromEntries(Object.keys(settingsPreferenceInputs).map((key) => [key, false]));
  }
}

function applyDisplayPreferences(preferences) {
  document.documentElement.dataset.compactSpacing = String(preferences.compactSpacing);
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
}

function updateProfilePreview(name) {
  const cleanName = name.trim();
  profileNamePreview.textContent = cleanName || "Your name";
  profileAvatar.textContent = cleanName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "?";
}

function saveSettingsPreferences() {
  const preferences = Object.fromEntries(Object.entries(settingsPreferenceInputs).map(([key, input]) => [key, input.checked]));
  try {
    localStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    notificationStatus.textContent = "This browser could not save the preference. It will apply for this visit only.";
  }
  applyDisplayPreferences(preferences);
}

function createThemeOption(theme, selectedTheme) {
  const button = document.createElement("button");
  button.className = "theme-option";
  button.type = "button";
  button.dataset.themeKey = theme.key;
  button.setAttribute("aria-pressed", String(theme.key === selectedTheme));

  const preview = document.createElement("span");
  preview.className = "theme-option__preview";
  preview.dataset.preview = theme.key;
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = "<span></span><span></span><span></span>";

  const copy = document.createElement("span");
  copy.className = "theme-option__copy";

  const name = document.createElement("span");
  name.className = "theme-option__name";
  name.textContent = theme.label;

  const title = document.createElement("span");
  title.className = "theme-option__title";
  title.append(name);

  if (premiumThemeKeys.has(theme.key)) {
    const premiumBadge = document.createElement("span");
    premiumBadge.className = "premium-badge";
    premiumBadge.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m2 5 3.1 2.2L8 2l2.9 5.2L14 5l-1.2 8H3.2L2 5Z"/><path d="M3.3 11h9.4"/></svg><span>Premium</span>';
    title.append(premiumBadge);
  }

  const description = document.createElement("span");
  description.className = "theme-option__description";
  description.textContent = theme.description;
  copy.append(title, description);

  const selectedMark = document.createElement("span");
  selectedMark.className = "theme-option__selected";
  selectedMark.setAttribute("aria-hidden", "true");
  selectedMark.textContent = "✓";

  button.append(preview, copy, selectedMark);
  return button;
}

function renderThemeOptions(selectedTheme) {
  themeOptions.replaceChildren();

  for (const groupName of groupOrder) {
    const themes = THEMES.filter((theme) => theme.group === groupName);
    if (!themes.length) continue;

    const group = document.createElement("section");
    group.className = "theme-group";
    const heading = document.createElement("h3");
    heading.textContent = groupName;
    const grid = document.createElement("div");
    grid.className = "theme-options-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", `${groupName} themes`);

    for (const theme of themes) grid.append(createThemeOption(theme, selectedTheme));
    group.append(heading, grid);
    themeOptions.append(group);
  }
}

function selectTheme(themeKey) {
  const theme = applyTheme(themeKey);
  themeOptions.querySelectorAll("[data-theme-key]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeKey === theme.key));
  });
  updateCurrentTheme(theme);
  updateThemeStatus(theme);
}

function updateThemeStatus(theme) {
  themeStatus.textContent = `${theme.label} ${theme.mode} theme applied.`;
}

function syncThemeSelection(themeKey) {
  themeOptions.querySelectorAll("[data-theme-key]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeKey === themeKey));
  });
}

function updateCurrentTheme(selection) {
  currentThemeLabel.textContent = `Current theme: ${selection.label} · ${selection.mode}`;
}

const activeTheme = getActiveThemeKey();
const initialTheme = THEMES.find((theme) => theme.key === activeTheme) ?? THEMES[0];
renderThemeOptions(initialTheme.key);
updateCurrentTheme({ ...initialTheme, mode: getActiveMode() });

const profile = getProfile();
profileNameInput.value = profile.displayName;
profileEmailInput.value = profile.email;
updateProfilePreview(profile.displayName);

profileForm.addEventListener("input", () => {
  profileNameInput.setCustomValidity(profileNameInput.value.trim() ? "" : "Please enter a display name.");
  updateProfilePreview(profileNameInput.value);
});
profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profileNameInput.setCustomValidity(profileNameInput.value.trim() ? "" : "Please enter a display name.");
  if (!profileForm.reportValidity()) return;
  if (!saveProfile({ displayName: profileNameInput.value, email: profileEmailInput.value })) {
    profileStatus.textContent = "This browser could not save your profile name.";
    return;
  }
  profileNameInput.value = profileNameInput.value.trim();
  updateProfilePreview(profileNameInput.value);
  profileStatus.textContent = "Your name is saved in this browser and will appear across Chunked.";
});

languageSelect.value = getLanguage();
languageSelect.addEventListener("change", () => {
  const language = applyLanguage(languageSelect.value);
  languageStatus.textContent = language === "ar"
    ? "Right-to-left layout is active. Interface text remains in English."
    : "Left-to-right layout is active. Interface text remains in English.";
});
document.addEventListener("chunked:languagechange", (event) => {
  languageSelect.value = event.detail.language;
  const selectedTheme = THEMES.find((theme) => theme.key === getActiveThemeKey()) ?? THEMES[0];
  const selection = { ...selectedTheme, mode: getActiveMode() };
  updateCurrentTheme(selection);
  if (themeStatus.textContent) updateThemeStatus(selection);
});

const savedDayMode = getDayMode();
dayModeInputs.forEach((input) => { input.checked = input.value === savedDayMode; });
dayModeInputs.forEach((input) => input.addEventListener("change", () => {
  if (!input.checked) return;
  try { localStorage.setItem(DAY_MODE_STORAGE_KEY, input.value); } catch { /* Apply for this visit if storage is unavailable. */ }
  document.dispatchEvent(new CustomEvent("chunked:daymodechange", { detail: { mode: input.value } }));
  dayStatus.textContent = input.value === "prayer"
    ? "Prayer periods are active in DAY and on your Dashboard. Times shown are sample values."
    : "Five custom period slots are active in DAY and on your Dashboard. No times are assigned.";
}));

const savedPreferences = readSettingsPreferences();
Object.entries(settingsPreferenceInputs).forEach(([key, input]) => { input.checked = savedPreferences[key]; });
applyDisplayPreferences(savedPreferences);
Object.entries(settingsPreferenceInputs).forEach(([key, input]) => input.addEventListener("change", () => {
  saveSettingsPreferences();
  if (["taskReminders", "habitReminders", "dailyPlanningReminder"].includes(key)) {
    notificationStatus.textContent = "Reminder preferences are saved in this browser. This demo does not send notifications.";
  }
}));

resetButton.addEventListener("click", () => {
  const confirmCopy = "Reset your profile, appearance, language, DAY, and reminder settings in this browser? Your tasks, goals, habits, and reflections will stay untouched.";
  if (!window.confirm(confirmCopy)) return;
  [PROFILE_STORAGE_KEY, LANGUAGE_STORAGE_KEY, DAY_MODE_STORAGE_KEY, SETTINGS_PREFERENCES_KEY, "chunked-theme", "chunked-mode"].forEach((key) => {
    try { localStorage.removeItem(key); } catch { /* Continue resetting in-memory defaults. */ }
  });
  profileForm.reset();
  const defaultProfile = { displayName: "Alex Morgan", email: "alex@example.com" };
  profileNameInput.value = defaultProfile.displayName;
  profileEmailInput.value = defaultProfile.email;
  saveProfile(defaultProfile);
  languageSelect.value = "en";
  languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
  dayModeInputs.forEach((input) => { input.checked = input.value === "prayer"; });
  document.dispatchEvent(new CustomEvent("chunked:daymodechange", { detail: { mode: "prayer" } }));
  Object.values(settingsPreferenceInputs).forEach((input) => { input.checked = false; });
  saveSettingsPreferences();
  const resetTheme = applyTheme("light");
  syncThemeSelection(resetTheme.key);
  updateCurrentTheme(resetTheme);
  updateProfilePreview(defaultProfile.displayName);
  profileStatus.textContent = "";
  languageStatus.textContent = "";
  dayStatus.textContent = "";
  notificationStatus.textContent = "";
  resetStatus.textContent = "Demo settings reset. Your saved content was kept.";
});

document.addEventListener("chunked:themechange", (event) => {
  updateCurrentTheme(event.detail);
});

themeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-key]");
  if (button) selectTheme(button.dataset.themeKey);
});

const settingsNavLinks = [...document.querySelectorAll(".settings-nav__link")];
const settingsSections = settingsNavLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveSettingsSection(sectionId) {
  settingsNavLinks.forEach((link) => {
    if (link.hash === `#${sectionId}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

settingsNavLinks.forEach((link) => link.addEventListener("click", () => {
  setActiveSettingsSection(link.hash.slice(1));
}));

if ("IntersectionObserver" in window) {
  const settingsSectionObserver = new IntersectionObserver((entries) => {
    const visibleSections = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visibleSections[0]) setActiveSettingsSection(visibleSections[0].target.id);
  }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.25, 0.5] });

  settingsSections.forEach((section) => settingsSectionObserver.observe(section));
}
