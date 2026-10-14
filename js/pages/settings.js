import { applyTheme, getActiveMode, getActiveThemeKey, THEMES } from "../utils/theme.js";

const themeOptions = document.querySelector("#theme-options");
const currentThemeLabel = document.querySelector("#theme-current");
const themeStatus = document.querySelector("#theme-status");
const groupOrder = ["Base", "Seasonal", "Style", "Occasion"];
const premiumThemeKeys = new Set(["autumn", "summer", "spring", "winter"]);

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
  themeStatus.textContent = `${theme.label} ${theme.mode} theme applied.`;
}

function updateCurrentTheme(selection) {
  currentThemeLabel.textContent = `Current theme: ${selection.label} · ${selection.mode}`;
}

const activeTheme = getActiveThemeKey();
const initialTheme = THEMES.find((theme) => theme.key === activeTheme) ?? THEMES[0];
renderThemeOptions(initialTheme.key);
updateCurrentTheme({ ...initialTheme, mode: getActiveMode() });

document.addEventListener("chunked:themechange", (event) => {
  updateCurrentTheme(event.detail);
});

themeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-key]");
  if (button) selectTheme(button.dataset.themeKey);
});
