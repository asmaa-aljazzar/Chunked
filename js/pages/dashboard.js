// dashboard.js — Day 1: header with the real next-prayer countdown, the 6 prayer chunks with the current one
// highlighted, plus demo widgets. Day 3 replaces the demo widgets with real ones from data/mock.js.
import { getState, isModuleOn, isPremium } from "../state.js";
import { t, fmtDate, getLang } from "../utils/i18n.js";
import { progressRing } from "../components/progressRing.js";
import { getPrayerTimes, minutesNow, currentChunk, nextPrayer, splitMinutes } from "../utils/prayerTimes.js";

let timer = null;
let token = 0; // lets a newer render cancel an older one that is still waiting for the network

function greeting() {
  const h = new Date().getHours();
  return t(h < 12 ? "dash.greeting.morning" : h < 17 ? "dash.greeting.afternoon" : "dash.greeting.evening");
}

const widget = (size, title, body) => `
  <section class="widget" data-size="${size}">
    <div class="ui-card" style="height:100%">
      <h2 class="ui-card-title">${title}</h2>${body}
    </div>
  </section>`;

function countdown(minutes) {
  if (minutes < 1) return t("common.lessThanMinute");
  const { h, m } = splitMinutes(minutes);
  return `${h ? `${h}${t("time.h")} ` : ""}${m}${t("time.m")}`;
}

function chunkTimeline(day, nowMin) {
  const current = currentChunk(day, nowMin).id;
  return day.chunks
    .map(
      (c, i) => `
      <div class="chunk ${c.id === current ? "is-current" : ""}" ${c.id === current ? 'aria-current="true"' : ""}>
        <div class="chunk-name">${t(`prayer.${c.id}`)}</div>
        <div class="chunk-time">${c.label}</div>
        <div class="chunk-time mt-2">${i + 1} ${t("dash.chunkTasks")}</div>
      </div>`,
    )
    .join("");
}

function paint(view, day) {
  const { user } = getState();
  const name = user?.name ? `${getLang() === "ar" ? "، " : ", "}${user.name}` : "";
  const nowMin = minutesNow(day.timezone);
  const next = nextPrayer(day, nowMin);

  const widgets = [
    isModuleOn("day") && widget("full", t("dash.chunks"), `<div class="chunks">${chunkTimeline(day, nowMin)}</div>`),
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
          ? `<div class="chip is-active"><i class="bi bi-moon-stars" aria-hidden="true"></i>${t("prayer.next")}: ${t(`prayer.${next.id}`)} · ${next.label} · ${t("time.in")} ${countdown(next.minutesUntil)}</div>`
          : ""
      }
    </header>
    ${day.source === "fallback" ? `<p class="small text-muted-x"><i class="bi bi-info-circle" aria-hidden="true"></i> ${t("ob.times.fallback")}</p>` : ""}
    <div class="widget-grid">${widgets.join("")}</div>`;
}

export async function render(view) {
  clearInterval(timer);
  const mine = ++token;

  // Skeleton while the prayer times load (usually instant: they are cached after the first call)
  view.innerHTML = `<div class="skeleton mb-4" style="height:84px;max-width:420px"></div>
    <div class="widget-grid"><div class="widget" data-size="full"><div class="skeleton" style="height:150px"></div></div></div>`;

  const day = await getPrayerTimes(getState().settings);
  if (mine !== token || !view.isConnected) return;

  paint(view, day);
  timer = setInterval(() => paint(view, day), 30_000); // keeps the current chunk and countdown fresh
}

export function destroy() {
  clearInterval(timer);
  token++;
}
