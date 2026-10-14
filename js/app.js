import { mountSidebar } from "./components/sidebar.js";
import { mountTopbar } from "./components/topbar.js";

const sidebarRoot = document.querySelector("#app-nav");

if (sidebarRoot) {
  mountSidebar(sidebarRoot, sidebarRoot.dataset.activePage);
}

const topbarRoot = document.querySelector("#app-topbar");

if (topbarRoot) {
  mountTopbar(topbarRoot);
}
