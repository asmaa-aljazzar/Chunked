import { CHUNKS, getCurrentChunkKey } from "../utils/chunks.js";
import { getPeriodDisplay } from "../utils/day-preferences.js";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "⌂" },
  { id: "day", label: "DAY", href: "day.html", icon: "☼" },
  { id: "grow", label: "GROW", href: "grow.html", icon: "↗" },
  { id: "templates", label: "Templates", href: "templates.html", icon: "▤" },
  { id: "insights", label: "Insights", href: "insights.html", icon: "▥", premium: true },
  { id: "focus", label: "FOCUS", href: "focus.html", icon: "◎" },
  { id: "ai", label: "AI chat", href: "ai.html", icon: "✦" },
  { id: "community", label: "Community", href: "community.html", icon: "◇", comingSoon: true },
  { id: "plans", label: "Plans", href: "plans.html", icon: "✦" },
  { id: "settings", label: "Settings", href: "settings.html", icon: "⚙" },
];

const premiumCrown = `
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="m2 5 3.1 2.2L8 2l2.9 5.2L14 5l-1.2 8H3.2L2 5Z"></path>
    <path d="M3.3 11h9.4"></path>
  </svg>`;

function brandMarkup() {
  return `
    <a class="brand app-sidebar__brand" href="index.html" aria-label="Chunked home">
      <span class="brand__mark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
      <span class="brand__wordmark"><span class="brand__plan-label" data-premium-label hidden>Premium</span><span class="brand__name">Chunked</span></span>
    </a>`;
}

function currentChunkMarkup() {
  return `
    <a class="sidebar-current-chunk" id="sidebar-current-chunk" href="chunk.html?period=dhuhr" aria-label="Open current chunk: Dhuhr">
      <span class="sidebar-current-chunk__icon" aria-hidden="true">◷</span>
      <span class="sidebar-current-chunk__copy">
        <span class="sidebar-current-chunk__eyebrow">Current chunk</span>
        <strong id="sidebar-current-chunk-label">Dhuhr</strong>
      </span>
      <span class="sidebar-current-chunk__arrow" aria-hidden="true">→</span>
    </a>`;
}

function quickAccessMarkup() {
  return `
    <details class="app-sidebar__quick-access" open>
      <summary><span class="quick-access__plus" aria-hidden="true">＋</span><span>Quick access</span><span class="quick-access__chevron" aria-hidden="true">⌄</span></summary>
      <nav class="quick-access__links" aria-label="Quick access">
        <a href="day.html?quickAdd=task"><span aria-hidden="true">＋</span><span>Add task</span></a>
        <a href="grow.html?quickAdd=goal"><span aria-hidden="true">↗</span><span>Add goal</span></a>
        <a href="grow.html?quickAdd=habit"><span aria-hidden="true">☼</span><span>Add habit</span></a>
      </nav>
    </details>`;
}

export function mountSidebar(container, activePage = "") {
  const links = navigationItems.map(({ id, label, href, icon, premium, comingSoon }) => {
    const link = `
      <a class="sidebar-link${id === activePage ? " is-active" : ""}${premium ? " sidebar-link--premium" : ""}" href="${href}"${id === activePage ? ' aria-current="page"' : ""}${premium ? ' aria-label="Insights, Premium feature" title="Premium feature"' : comingSoon ? ' title="Coming soon"' : ""}>
        <span class="sidebar-link__icon" aria-hidden="true">${icon}</span>
        <span class="sidebar-link__label-wrap">
          <span class="sidebar-link__label">${label}</span>
          ${comingSoon ? '<span class="sidebar-link__status">Soon</span>' : ""}
          ${premium ? `<span class="sidebar-link__premium" data-premium-upsell aria-hidden="true">${premiumCrown}</span>` : ""}
        </span>
      </a>`;

    return id === "dashboard" ? `${link}${currentChunkMarkup()}` : link;
  }).join("");

  container.innerHTML = `
    <aside class="app-sidebar" aria-label="App navigation">
      ${brandMarkup()}
      <p class="app-sidebar__caption">YOUR SPACE</p>
      <nav class="sidebar-nav" aria-label="Main navigation">${links}</nav>
      ${quickAccessMarkup()}
      <div class="app-sidebar__note">
        <span aria-hidden="true">✦</span>
        <p>Small steps count.</p>
      </div>
    </aside>`;

  const currentChunkLink = container.querySelector("#sidebar-current-chunk");
  const currentChunkLabel = container.querySelector("#sidebar-current-chunk-label");
  const quickAccess = container.querySelector(".app-sidebar__quick-access");
  const compactSidebar = window.matchMedia("(max-width: 760px)");

  const syncQuickAccess = () => {
    quickAccess.open = !compactSidebar.matches;
  };

  syncQuickAccess();
  compactSidebar.addEventListener("change", syncQuickAccess);

  function syncCurrentChunk(chunkKey) {
    const validKey = Object.prototype.hasOwnProperty.call(CHUNKS, chunkKey) ? chunkKey : getCurrentChunkKey();
    currentChunkLink.href = `chunk.html?period=${validKey}`;
    const label = getPeriodDisplay(validKey, CHUNKS[validKey].label);
    currentChunkLabel.textContent = label;
    currentChunkLink.setAttribute("aria-label", `Open current chunk: ${label}`);
  }

  syncCurrentChunk(getCurrentChunkKey());
  document.addEventListener("chunked:daymodechange", () => syncCurrentChunk(getCurrentChunkKey()));
  window.addEventListener("storage", (event) => {
    if (event.key === "chunked-day-mode-v1") syncCurrentChunk(getCurrentChunkKey());
  });
  document.addEventListener("chunked:currentchunkchange", (event) => {
    syncCurrentChunk(event.detail.key);
  });
}
