// state.js — the single source of truth.
// `settings` mirrors the `user_settings` table column-for-column, so the future Laravel API
// (GET/PUT /api/settings) can return and accept this exact object.
import { load, save, remove } from "./utils/storage.js";

export const MODULES = ["day", "grow", "focus"];

export const DEFAULTS = {
  user: null, // { name, email, role: "user" | "admin", plan: "free" | "premium" }  (fake until Laravel exists)
  settings: {
    onboarded: false,
    lang: "en", // "en" | "ar"
    theme_id: 1, // themes.id  (see THEMES in utils/theme.js: 1 = light ... 9 = eid)
    density: "comfortable", // "comfortable" | "compact"
    nav_style: "sidebar", // "sidebar" | "top"
    accent_color: null,
    enabled_modules: ["day", "grow", "focus"], // any non-empty subset of MODULES
    city: "Amman",
    country: "Jordan",
    calculation_method: 3, // Aladhan method id
    prayer_offsets: { fajr: 0, duha: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, // minutes added to each prayer time
    prayer_notifications: true,
    ai_enabled: true,
    ai_bio: "",
    energy_pattern: "morning", // "morning" | "evening"
  },
  widgets: null, // dashboard layout; null = default for the enabled modules
};

const isPlain = (v) => v && typeof v === "object" && !Array.isArray(v);

// Deep-merge plain objects; arrays and primitives are replaced.
function merge(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch ?? {})) {
    out[k] = isPlain(v) && isPlain(base?.[k]) ? merge(base[k], v) : v;
  }
  return out;
}

// Keep ONLY known settings keys (drops leftovers like old `rhythm`/`modules` from earlier saved data)
// and guarantee enabled_modules is a valid, non-empty list.
function sanitize(next) {
  const settings = {};
  for (const key of Object.keys(DEFAULTS.settings)) settings[key] = next.settings?.[key] ?? DEFAULTS.settings[key];
  settings.prayer_offsets = { ...DEFAULTS.settings.prayer_offsets, ...settings.prayer_offsets };
  const mods = Array.isArray(settings.enabled_modules) ? settings.enabled_modules.filter((m) => MODULES.includes(m)) : [];
  settings.enabled_modules = mods.length ? [...new Set(mods)] : [...DEFAULTS.settings.enabled_modules];
  return { ...next, settings };
}

let state = sanitize(merge(DEFAULTS, load("state", {})));
const listeners = new Set();

export const getState = () => state;
export const getSettings = () => state.settings;

/** update({ settings: { theme_id: 2 } }) — merges, saves, notifies subscribers with the patch. */
export function update(patch) {
  state = sanitize(merge(state, patch));
  save("state", state);
  listeners.forEach((fn) => fn(state, patch));
}

/** subscribe((state, patch) => ...) — returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetAll() {
  remove("state");
  state = sanitize(merge(DEFAULTS, {}));
  listeners.forEach((fn) => fn(state, { settings: state.settings }));
}

// Helpers other files use constantly
export const isModuleOn = (id) => state.settings.enabled_modules.includes(id);
export const isPremium = () => state.user?.plan === "premium";
export const isAdmin = () => state.user?.role === "admin";
