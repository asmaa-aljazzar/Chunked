// prayerTimes.js — today's prayer times -> the 6 Day chunks, current chunk, next prayer, countdown.
//
// Source: Aladhan API (free, no key):  https://api.aladhan.com/v1/timingsByCity/DD-MM-YYYY?city=..&country=..&method=..
// Flow: cache (per day + city + method)  ->  live API  ->  approximate fallback times (so the app never breaks offline).
//
// Everything is calculated in "minutes since midnight" in the CITY's own timezone (Aladhan returns it in
// meta.timezone), so the result is correct even if the device is set to another timezone.
//
// NOTE: Aladhan has no "Duha". We start the Duha chunk 15 minutes after Sunrise.
import { load, save } from "./storage.js";
import { CHUNKS } from "../../data/chunks.js";

const API = "https://api.aladhan.com/v1/timingsByCity";
const DUHA_AFTER_SUNRISE_MIN = 15;
const TIMEOUT_MS = 6000;

// Rough times (Amman, autumn), used only when the API and the cache are both unavailable.
const FALLBACK = { Fajr: "05:00", Sunrise: "06:25", Dhuhr: "12:25", Asr: "15:45", Maghrib: "18:10", Isha: "19:35" };

const toMin = (hhmm) => {
  const [, h, m] = /(\d{1,2}):(\d{2})/.exec(hhmm) ?? [];
  return Number(h) * 60 + Number(m);
};

/** 0..1439 -> "05:07" (Western digits in both languages, easy to scan) */
export const fmtMinutes = (min) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Minutes since midnight right now in `timeZone` (falls back to the device timezone if it is invalid). */
export function minutesNow(timeZone) {
  const format = (tz) =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).formatToParts(new Date());
  let parts;
  try {
    parts = format(timeZone);
  } catch {
    parts = format(undefined);
  }
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return (get("hour") % 24) * 60 + get("minute");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

async function fetchTimings(settings) {
  const now = new Date();
  const day = `${pad2(now.getDate())}-${pad2(now.getMonth() + 1)}-${now.getFullYear()}`;
  const url = `${API}/${day}?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${encodeURIComponent(settings.calculation_method)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const json = await res.json();
    if (!res.ok || json.code !== 200) throw new Error("bad response");
    return { timings: json.data.timings, timezone: json.data.meta?.timezone };
  } finally {
    clearTimeout(timer);
  }
}

/** Build the chunk list from raw timings + the user's offsets (minutes per chunk id). */
export function buildDay({ timings, timezone }, offsets = {}, source = "live") {
  const starts = CHUNKS.map((c) => ({
    id: c.id,
    start: toMin(timings[c.anchor]) + (c.id === "duha" ? DUHA_AFTER_SUNRISE_MIN : 0) + (Number(offsets[c.id]) || 0),
  }));
  const chunks = starts.map((c, i) => ({
    id: c.id,
    start: c.start,
    end: i < starts.length - 1 ? starts[i + 1].start : starts[0].start + 1440, // Isha lasts until the next Fajr
    label: fmtMinutes(c.start),
  }));
  const prayers = chunks.filter((c) => c.id !== "duha"); // Duha is a chunk, not one of the five prayers
  return { chunks, prayers, timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, source };
}

/** getPrayerTimes(settings) -> { chunks, prayers, timezone, source: "cache" | "live" | "fallback" } (never throws) */
export async function getPrayerTimes(settings) {
  const now = new Date();
  const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`; // device-local date
  const key = `prayer:${today}:${settings.city}:${settings.country}:${settings.calculation_method}`;

  const cached = load(key);
  if (cached) return buildDay(cached, settings.prayer_offsets, "cache");

  try {
    if (!settings.city?.trim() || !settings.country?.trim()) throw new Error("no location");
    const live = await fetchTimings(settings);
    save(key, live);
    return buildDay(live, settings.prayer_offsets, "live");
  } catch {
    return buildDay({ timings: FALLBACK }, settings.prayer_offsets, "fallback");
  }
}

/** The chunk that contains `nowMin`. Before today's Fajr we are still in yesterday's Isha chunk. */
export function currentChunk(day, nowMin) {
  const { chunks } = day;
  if (nowMin < chunks[0].start) return chunks[chunks.length - 1];
  return [...chunks].reverse().find((c) => nowMin >= c.start) ?? chunks[chunks.length - 1];
}

/** The next of the five prayers: { id, label, minutesUntil }. After Isha it is tomorrow's Fajr. */
export function nextPrayer(day, nowMin) {
  const next = day.prayers.find((p) => p.start > nowMin);
  const prayer = next ?? day.prayers[0];
  const start = next ? prayer.start : prayer.start + 1440;
  return { id: prayer.id, label: prayer.label, minutesUntil: start - nowMin };
}

/** 83 -> { h: 1, m: 23 } */
export const splitMinutes = (total) => ({ h: Math.floor(total / 60), m: total % 60 });
