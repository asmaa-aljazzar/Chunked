export const LANGUAGE_STORAGE_KEY = "chunked-language-v1";

export function getLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function applyLanguage(language, { persist = true } = {}) {
  const selected = language === "ar" ? "ar" : "en";
  document.documentElement.lang = selected;
  document.documentElement.dir = selected === "ar" ? "rtl" : "ltr";

  if (persist) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selected);
    } catch {
      // Keep the selected direction for this visit if storage is unavailable.
    }
  }

  document.dispatchEvent(new CustomEvent("chunked:languagechange", { detail: { language: selected } }));
  return selected;
}

export function toggleLanguage() {
  return applyLanguage(getLanguage() === "ar" ? "en" : "ar");
}
