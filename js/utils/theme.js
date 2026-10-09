// Applies a theme by setting data-theme on <html>
export const THEMES = ['light', 'dark', 'gothic', 'ramadan'];
export const applyTheme = (theme) => {
  const safe = THEMES.includes(theme) ? theme : 'light';
  document.documentElement.setAttribute('data-theme', safe);
};
