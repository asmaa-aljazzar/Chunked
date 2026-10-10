// modal.js — accessible overlay used for both centered modals and side drawers (see drawer.js).
import { t } from "../utils/i18n.js";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * openOverlay({ kind: "modal"|"drawer", title, body: Node|string, footer: Node|string, onClose })
 * returns { close, el }
 */
export function openOverlay({ kind = "modal", title = "", body = "", footer = null, onClose } = {}) {
  const previouslyFocused = document.activeElement;
  const scrim = document.createElement("div");
  scrim.className = `scrim is-${kind}`;

  const panel = document.createElement("div");
  panel.className = `panel is-${kind}`;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const titleId = `ov-${Math.random().toString(36).slice(2, 8)}`;
  panel.setAttribute("aria-labelledby", titleId);

  panel.innerHTML = `
    <div class="panel-head">
      <h2 id="${titleId}"></h2>
      <button type="button" class="icon-btn" data-close aria-label="${t("common.close")}"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
    </div>
    <div class="panel-body"></div>
    ${footer ? '<div class="panel-foot"></div>' : ""}`;
  panel.querySelector("h2").textContent = title;

  const put = (host, content) => (typeof content === "string" ? (host.innerHTML = content) : host.append(content));
  put(panel.querySelector(".panel-body"), body);
  if (footer) put(panel.querySelector(".panel-foot"), footer);

  scrim.append(panel);
  document.getElementById("overlay-root").append(scrim);
  requestAnimationFrame(() => scrim.classList.add("is-in"));

  const first = panel.querySelector(".panel-body " + FOCUSABLE) ?? panel.querySelector("[data-close]");
  first?.focus();

  function close() {
    document.removeEventListener("keydown", onKey);
    scrim.classList.remove("is-in");
    setTimeout(() => scrim.remove(), 200);
    previouslyFocused?.focus?.();
    onClose?.();
  }

  function onKey(e) {
    if (e.key === "Escape") return close();
    if (e.key !== "Tab") return; // keep focus inside the dialog
    const items = [...panel.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const [a, z] = [items[0], items[items.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  document.addEventListener("keydown", onKey);
  panel.querySelector("[data-close]").addEventListener("click", close);
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) close(); });

  return { close, el: panel };
}

export const openModal = (opts) => openOverlay({ ...opts, kind: "modal" });
