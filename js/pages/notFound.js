// notFound.js — friendly 404 (calm tone, one clear way back)
import { t } from "../utils/i18n.js";

export function render(view) {
  view.innerHTML = `
    <div class="empty">
      <i class="bi bi-compass" aria-hidden="true"></i>
      <h2>${t("common.notFound")}</h2>
      <p>${t("common.notFoundHint")}</p>
      <a class="btn btn-primary" href="#/dashboard">${t("common.backHome")}</a>
    </div>`;
}
