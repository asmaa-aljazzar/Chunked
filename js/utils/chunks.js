export const CHUNKS = {
  fajr: { label: "Fajr", range: "5:00 AM – 11:30 AM", tasks: ["Plan the week", "Review today’s intention", "Choose one priority", "Check today’s calendar", "Prepare your workspace", "Drink a glass of water", "Begin the first priority", "Take a short stretch", "Note one small win"] },
  dhuhr: { label: "Dhuhr", range: "11:30 AM – 3:30 PM", tasks: ["Finish the first draft", "Reply to the project email", "Stretch for five minutes", "Review the draft outline", "Write the next section", "Save and organize your notes", "Check in on one open task", "Take a screen break", "Write down the next step"] },
  asr: { label: "Asr", range: "3:30 PM – 6:00 PM", tasks: ["Take a short walk", "Refill your water", "Reset your workspace", "Review what is still open", "Handle one quick task", "Prepare what you need next", "Step away from your screen", "Tidy one small area", "Choose a stopping point"] },
  maghrib: { label: "Maghrib", range: "6:00 PM – 8:30 PM", tasks: ["Prepare dinner", "Check in with family", "Tidy one small area", "Set out what you need", "Make time to eat", "Clear one surface", "Send one thoughtful message", "Take a quiet pause", "Put away a few things"] },
  isha: { label: "Isha", range: "8:30 PM – 5:00 AM", tasks: ["Tidy your desk", "Read for ten minutes", "Set one intention for tomorrow", "Close any open tabs", "Write down tomorrow’s priority", "Prepare for rest", "Put your phone aside", "Reflect on one good moment", "Settle in for the night"] },
};

const CURRENT_CHUNK_STORAGE_KEY = "chunked-current-period";
const DEFAULT_CHUNK_KEY = "dhuhr";

export function getCurrentChunkKey() {
  try {
    const savedKey = localStorage.getItem(CURRENT_CHUNK_STORAGE_KEY);
    return Object.prototype.hasOwnProperty.call(CHUNKS, savedKey) ? savedKey : DEFAULT_CHUNK_KEY;
  } catch {
    return DEFAULT_CHUNK_KEY;
  }
}

export function setCurrentChunkKey(chunkKey) {
  if (!Object.prototype.hasOwnProperty.call(CHUNKS, chunkKey)) return;

  try {
    localStorage.setItem(CURRENT_CHUNK_STORAGE_KEY, chunkKey);
  } catch {
    // Keep the current selection for this page even when storage is unavailable.
  }

  document.dispatchEvent(new CustomEvent("chunked:currentchunkchange", {
    detail: { key: chunkKey, ...CHUNKS[chunkKey] },
  }));
}
