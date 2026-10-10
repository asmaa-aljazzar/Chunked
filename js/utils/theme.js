// theme.js — applies a theme by setting attributes on <html>. All colors live in css/tokens.css.
// `id` matches the `themes.id` seeded in the database; `key` matches themes.key and the CSS [data-theme] block.
export const THEMES = [
  { id: 1, key: "light", mode: "light", type: "base", bg: "#f7f6f3", accent: "#2f6b64" },
  { id: 2, key: "dark", mode: "dark", type: "base", bg: "#12151c", accent: "#7cc4b8" },
  { id: 3, key: "autumn", mode: "light", type: "seasonal", bg: "#faf3ea", accent: "#a84a14" },
  { id: 4, key: "summer", mode: "light", type: "seasonal", bg: "#fffbeb", accent: "#a9470b" },
  { id: 5, key: "spring", mode: "light", type: "seasonal", bg: "#f4faf2", accent: "#2a7048" },
  { id: 6, key: "winter", mode: "light", type: "seasonal", bg: "#f1f5fa", accent: "#2a5696" },
  { id: 7, key: "gothic", mode: "dark", type: "style", bg: "#0d0b0c", accent: "#c9a24b" },
  { id: 8, key: "ramadan", mode: "dark", type: "event", bg: "#0b1530", accent: "#e2b94b" },
  { id: 9, key: "eid", mode: "light", type: "event", bg: "#fff8f0", accent: "#a02a69" },
];

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === Number(themeId)) ?? THEMES[0];
  const root = document.documentElement;
  root.dataset.theme = theme.key;
  root.dataset.mode = theme.mode; // decides status colors
  root.dataset.bsTheme = theme.mode; // Bootstrap's own light/dark switch
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.bg);
  return theme;
}
