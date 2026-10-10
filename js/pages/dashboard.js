// dashboard.js — Day 1 skeleton: proves the shell, tokens, RTL and widget grid work.
// Day 3 replaces the demo widgets with real ones from data/mock.js + utils/prayerTimes.js.
import { getState, isModuleOn, isPremium } from "../state.js";
import { t, fmtDate } from "../utils/i18n.js";
import { progressRing } from "../components/progressRing.js";
import { CHUNKS } from "../../data/chunks.js";

// Demo start times per chunk. Day 1 replaces these with real times from utils/prayerTimes.js.
const DEMO_TIMES = { fajr: "05:12", duha: "06:40", dhuhr: "12:24", asr: "15:41", maghrib: "18:02", isha: "19:25" };
const DEMO_CURRENT = "dhuhr";

function greeting() {
  const h = new Date().getHours();
  return t(h < 12 ? "dash.greeting.morning" : h < 17 ? "dash.greeting.afternoon" : "dash.greeting.evening");
}

const widget = (size, title, body, { highlight = false } = {}) => `
  <section class="widget" data-size="${size}">
    <div class="ui-card ${highlight ? "is-highlight" : ""}" style="height:100%">
      <h2 class="ui-card-title">${title}</h2>${body}
    </div>
  </section>`;

export function render(view) {
  const { user } = getState();
  const name = user?.name ? `, ${user.name}` : "";

  const chunks = CHUNKS.map(
    ({ id }, i) => `
      <div class="chunk ${id === DEMO_CURRENT ? "is-current" : ""}">
        <div class="chunk-name">${t(`prayer.${id}`)}</div>
        <div class="chunk-time">${DEMO_TIMES[id]}</div>
        <div class="chunk-time mt-2">${i + 1} ${t("dash.chunkTasks")}</div>
      </div>`,
  ).join("");

  const widgets = [
    isModuleOn("day") &&
      widget("full", t("dash.chunks"), `<div class="chunks">${chunks}</div>`),
    isModuleOn("grow") &&
      widget(
        "md",
        t("dash.mainGoal"),
        `<div class="d-flex align-items-center gap-3">${progressRing(64)}
           <div><div class="fw-semibold">Finish the frontend</div>
           <div class="small text-muted-x">${t("dash.nextMilestone")}: Dashboard</div></div></div>`,
      ),
    isModuleOn("focus") &&
      widget(
        "md",
        t("dash.readiness"),
        `<span class="readiness is-yellow"><i class="bi bi-hourglass-split" aria-hidden="true"></i>${t("dash.readiness.yellow")}</span>
         <p class="small text-muted-x mt-3 mb-0">${t("dash.readiness.reason")}</p>`,
      ),
    widget(
      "md",
      `${t("dash.templates")} <span class="badge-x ${isPremium() ? "badge-premium" : "badge-free"}">${t(isPremium() ? "common.premium" : "common.free")}</span>`,
      `<p class="small text-muted-x">${t("dash.templatesHint")}</p><a class="btn btn-primary btn-sm" href="#/templates">${t("nav.templates")}</a>`,
    ),
  ].filter(Boolean);

  view.innerHTML = `
    <header class="mb-4 d-flex flex-wrap align-items-end justify-content-between gap-3">
      <div>
        <p class="text-muted-x mb-1">${fmtDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 class="h2 mb-1">${greeting()}${name}</h1>
        <p class="text-muted-x mb-0">${t("dash.subtitle")}</p>
      </div>
      ${
        isModuleOn("day")
          ? `<div class="chip is-active"><i class="bi bi-moon-stars" aria-hidden="true"></i>${t("prayer.next")}: ${t("prayer.asr")} · 15:41</div>`
          : ""
      }
    </header>
    <div class="widget-grid">${widgets.join("")}</div>`;
}
