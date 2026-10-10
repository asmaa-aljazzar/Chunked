// chunks.js — the ONE list of Day chunks. Pages, the task form and the API all read this list.
// A chunk starts at its anchor time and lasts until the next chunk starts (Isha lasts until the next Fajr).
// `anchor` is the key in the Aladhan API response. Aladhan has no "Duha", so utils/prayerTimes.js
// should compute it as Sunrise + ~15 minutes. User offsets (settings.prayer_offsets) are added on top.
export const CHUNKS = [
  { id: "fajr", anchor: "Fajr" },
  { id: "duha", anchor: "Sunrise" },
  { id: "dhuhr", anchor: "Dhuhr" },
  { id: "asr", anchor: "Asr" },
  { id: "maghrib", anchor: "Maghrib" },
  { id: "isha", anchor: "Isha" },
];

export const CHUNK_IDS = CHUNKS.map((c) => c.id);
