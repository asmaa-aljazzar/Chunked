export const DAY_MODE_STORAGE_KEY = "chunked-day-mode-v1";

export function getDayMode() {
  try {
    return localStorage.getItem(DAY_MODE_STORAGE_KEY) === "custom" ? "custom" : "prayer";
  } catch {
    return "prayer";
  }
}

export function getPeriodDisplay(id, prayerLabel) {
  if (getDayMode() !== "custom") return prayerLabel;
  const position = ["fajr", "dhuhr", "asr", "maghrib", "isha"].indexOf(id) + 1;
  return `Custom period ${position || 1}`;
}
