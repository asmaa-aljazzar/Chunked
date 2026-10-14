export const THEMES = [
  { key: "light", label: "Light", group: "Base", mode: "light", description: "Warm neutrals and gentle teal." },
  { key: "dark", label: "Dark", group: "Base", mode: "dark", description: "A quiet, low-light workspace." },
  { key: "autumn", label: "Autumn", group: "Seasonal", mode: "light", description: "Soft cream with warm amber tones." },
  { key: "summer", label: "Summer", group: "Seasonal", mode: "light", description: "Sunny, golden warmth." },
  { key: "spring", label: "Spring", group: "Seasonal", mode: "light", description: "Fresh green with a light touch." },
  { key: "winter", label: "Winter", group: "Seasonal", mode: "light", description: "Cool, calm blue and soft gray." },
  { key: "gothic", label: "Gothic", group: "Style", mode: "dark", description: "Deep tones, muted gold, and serif headings." },
  { key: "ramadan", label: "Ramadan", group: "Occasion", mode: "dark", description: "Midnight blue with a golden accent." },
  { key: "eid", label: "Eid", group: "Occasion", mode: "light", description: "A soft festive palette with berry accents." },
];

const DEFAULT_THEME = "light";
const THEME_STORAGE_KEY = "chunked-theme";
const MODE_STORAGE_KEY = "chunked-mode";

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getActiveThemeKey() {
  const savedTheme = readStored(THEME_STORAGE_KEY);
  if (THEMES.some((theme) => theme.key === savedTheme)) return savedTheme;

  const pageTheme = document.documentElement.dataset.theme;
  return THEMES.some((theme) => theme.key === pageTheme) ? pageTheme : DEFAULT_THEME;
}

export function getActiveMode() {
  const savedMode = readStored(MODE_STORAGE_KEY);
  if (savedMode === "light" || savedMode === "dark") return savedMode;

  const pageMode = document.documentElement.dataset.mode;
  if (pageMode === "light" || pageMode === "dark") return pageMode;

  return THEMES.find((theme) => theme.key === getActiveThemeKey())?.mode ?? "light";
}

export function applyTheme(themeKey, { mode, persist = true } = {}) {
  const theme = THEMES.find((item) => item.key === themeKey) ?? THEMES[0];
  const selectedMode = mode === "dark" || mode === "light" ? mode : theme.mode;
  const root = document.documentElement;
  root.dataset.theme = theme.key;
  root.dataset.mode = selectedMode;
  root.style.colorScheme = selectedMode;

  const background = getComputedStyle(root).getPropertyValue("--color-bg").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background || "#f7f6f3");

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.key);
      localStorage.setItem(MODE_STORAGE_KEY, selectedMode);
    } catch {
      // The selected theme remains active for this page if storage is unavailable.
    }
  }

  const selection = { ...theme, mode: selectedMode };
  document.dispatchEvent(new CustomEvent("chunked:themechange", { detail: selection }));
  return selection;
}

export function toggleThemeMode() {
  const nextMode = getActiveMode() === "dark" ? "light" : "dark";
  return applyTheme(getActiveThemeKey(), { mode: nextMode });
}
