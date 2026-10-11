// main.js — boot sequence: load settings -> apply theme/language/density -> draw chrome -> start router.
import { getState, subscribe } from "./state.js";
import { applyTheme } from "./utils/theme.js";
import { setLang, applyI18n } from "./utils/i18n.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderTopbar } from "./components/topbar.js";
import { start, refresh } from "./router.js";

const shell = document.getElementById("app-shell");

function applySettings() {
  const s = getState().settings;
  applyTheme(s.theme_id);
  setLang(s.lang);
  document.documentElement.dataset.density = s.density;
  shell.dataset.nav = s.nav_style;
}

function renderChrome() {
  renderSidebar();
  renderTopbar();
  applyI18n(document);
}

applySettings();
renderChrome();
start();

// Any settings change (theme, language, enabled modules...) redraws the chrome and the current page.
subscribe((_state, patch) => {
  if (patch.settings) {
    applySettings();
    renderChrome();
    refresh();
  } else if ("user" in patch) {
    renderChrome(); // login / logout changes the sidebar and the profile menu
  }
});

// Route guard (login, onboarding, admin) lives in router.js.
