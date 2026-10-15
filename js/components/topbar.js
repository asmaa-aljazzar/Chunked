import { applyTheme, getActiveMode, getActiveThemeKey, toggleThemeMode } from "../utils/theme.js";
import { getLanguage, toggleLanguage } from "../utils/language.js?v=3";
import { getProfile } from "../utils/profile.js";

const sunIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>
  </svg>`;

const moonIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"></path>
  </svg>`;

const bellIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path>
  </svg>`;

const profileIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="3.5"></circle>
    <path d="M5 20a7 7 0 0 1 14 0"></path>
  </svg>`;

const sidebarIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
    <path d="M9 4v16"></path>
  </svg>`;

export function mountTopbar(container) {
  container.innerHTML = `
    <header class="app-topbar">
      <div class="app-topbar__leading">
        <button class="icon-button app-sidebar-toggle" id="sidebar-toggle" type="button" aria-controls="app-nav" aria-expanded="true" title="Hide navigation">
          ${sidebarIcon}
        </button>
        <p class="app-topbar__context">Your space, at your pace</p>
      </div>
      <div class="app-topbar__actions">
        <button class="language-toggle" id="language-toggle" type="button" aria-label="Switch layout to Arabic (right-to-left)" title="Switch layout direction">AR</button>
        <button class="icon-button" id="theme-toggle" type="button" title="Switch theme" aria-pressed="false"></button>
        <div class="notification-wrap" id="notification-wrap">
          <button class="icon-button" id="notification-toggle" type="button" aria-label="Open notifications" aria-expanded="false" aria-controls="notification-panel" title="Notifications">
            ${bellIcon}
          </button>
          <section class="notification-panel" id="notification-panel" aria-labelledby="notification-title" hidden>
            <div class="notification-panel__heading">
              <h2 id="notification-title">Notifications</h2>
              <button class="notification-panel__close" id="notification-close" type="button" aria-label="Close notifications">×</button>
            </div>
            <p class="notification-panel__empty">You’re all caught up.</p>
            <p class="notification-panel__note">Reminders will appear here when notifications are connected.</p>
          </section>
        </div>
        <div class="account-menu-wrap" id="account-menu-wrap">
          <button class="app-topbar__account" id="account-menu-toggle" type="button" aria-label="Open profile menu" aria-expanded="false" aria-controls="account-menu">
            <span class="app-topbar__avatar" aria-hidden="true">${profileIcon}</span>
            <span class="app-topbar__profile-name">Alex Morgan</span>
          </button>
          <nav class="account-menu" id="account-menu" aria-label="Profile menu" hidden>
            <a class="account-menu__link" href="profile.html">Profile</a>
            <a class="account-menu__link" href="settings.html">Settings</a>
            <span class="account-menu__divider" aria-hidden="true"></span>
            <a class="account-menu__link account-menu__link--logout" href="login.html">Log out</a>
          </nav>
        </div>
      </div>
    </header>`;

  const themeButton = container.querySelector("#theme-toggle");
  const languageButton = container.querySelector("#language-toggle");
  const sidebarButton = container.querySelector("#sidebar-toggle");
  const sidebar = document.querySelector("#app-nav .app-sidebar");
  const notificationButton = container.querySelector("#notification-toggle");
  const notificationClose = container.querySelector("#notification-close");
  const notificationPanel = container.querySelector("#notification-panel");
  const notificationWrap = container.querySelector("#notification-wrap");
  const accountMenuWrap = container.querySelector("#account-menu-wrap");
  const accountMenuButton = container.querySelector("#account-menu-toggle");
  const accountMenu = container.querySelector("#account-menu");
  const sidebarStorageKey = "chunked-sidebar-hidden";

  function setSidebarVisible(isVisible, persist = true) {
    document.body.classList.toggle("sidebar-hidden", !isVisible);
    sidebarButton.setAttribute("aria-expanded", String(isVisible));
    const navigationLabel = `${isVisible ? "Hide" : "Show"} navigation`;
    sidebarButton.setAttribute("aria-label", navigationLabel);
    sidebarButton.title = navigationLabel;
    if (sidebar) sidebar.inert = !isVisible;
    if (!isVisible && sidebar?.contains(document.activeElement)) sidebarButton.focus();
    if (!persist) return;
    try {
      localStorage.setItem(sidebarStorageKey, isVisible ? "visible" : "hidden");
    } catch {
      // Sidebar visibility remains available for this visit if storage is unavailable.
    }
  }

  let isSidebarVisible = true;
  try {
    isSidebarVisible = localStorage.getItem(sidebarStorageKey) !== "hidden";
  } catch {
    isSidebarVisible = true;
  }
  setSidebarVisible(isSidebarVisible, false);

  function syncThemeButton(theme) {
    const isDark = theme.mode === "dark";
    themeButton.innerHTML = isDark ? sunIcon : moonIcon;
    const nextMode = isDark ? "light" : "dark";
    const label = `Switch to ${nextMode} theme`;
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("aria-pressed", String(isDark));
  }

  function syncLanguageButton(language = getLanguage()) {
    const arabic = language === "ar";
    languageButton.textContent = arabic ? "EN" : "AR";
    const label = `Switch layout to ${arabic ? "English (left-to-right)" : "Arabic (right-to-left)"}`;
    languageButton.setAttribute("aria-label", label);
    languageButton.title = label;
  }

  function syncProfile(profile = getProfile()) {
    const name = profile.displayName || "Profile";
    container.querySelector(".app-topbar__profile-name").textContent = name;
    accountMenuButton.setAttribute("aria-label", `Open profile menu for ${name}`);
  }

  function setNotificationsOpen(isOpen) {
    notificationPanel.hidden = !isOpen;
    notificationButton.setAttribute("aria-expanded", String(isOpen));
  }

  function setAccountMenuOpen(isOpen) {
    accountMenu.hidden = !isOpen;
    accountMenuButton.setAttribute("aria-expanded", String(isOpen));
  }

  syncThemeButton(applyTheme(getActiveThemeKey(), { mode: getActiveMode(), persist: false }));
  syncLanguageButton();
  syncProfile();

  sidebarButton.addEventListener("click", () => {
    setSidebarVisible(sidebarButton.getAttribute("aria-expanded") !== "true");
  });
  themeButton.addEventListener("click", () => toggleThemeMode());
  languageButton.addEventListener("click", () => toggleLanguage());
  document.addEventListener("chunked:themechange", (event) => syncThemeButton(event.detail));
  document.addEventListener("chunked:languagechange", (event) => {
    syncLanguageButton(event.detail.language);
    setSidebarVisible(sidebarButton.getAttribute("aria-expanded") === "true", false);
    syncThemeButton({ mode: getActiveMode() });
    syncProfile();
  });
  document.addEventListener("chunked:profilechange", (event) => syncProfile(event.detail));
  window.addEventListener("storage", (event) => {
    if (event.key === "chunked-profile-v1") syncProfile();
    if (event.key === "chunked-language-v1") syncLanguageButton();
  });

  notificationButton.addEventListener("click", () => {
    setAccountMenuOpen(false);
    setNotificationsOpen(notificationPanel.hidden);
  });

  accountMenuButton.addEventListener("click", () => {
    setNotificationsOpen(false);
    setAccountMenuOpen(accountMenu.hidden);
  });

  notificationClose.addEventListener("click", () => setNotificationsOpen(false));

  document.addEventListener("click", (event) => {
    if (!notificationWrap.contains(event.target)) setNotificationsOpen(false);
    if (!accountMenuWrap.contains(event.target)) setAccountMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !notificationPanel.hidden) {
      setNotificationsOpen(false);
      notificationButton.focus();
    }
    if (event.key === "Escape" && !accountMenu.hidden) {
      setAccountMenuOpen(false);
      accountMenuButton.focus();
    }
  });
}
