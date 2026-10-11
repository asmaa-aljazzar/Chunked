// i18n.js — t("key"), language switch, and RTL handling (dir + Bootstrap RTL stylesheet).
import { translations } from "../../data/translations.js";

const BS_LTR = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
const BS_RTL = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css";

let lang = "en";

export const getLang = () => lang;
export const isRTL = () => lang === "ar";

/** t("nav.day") -> "Day" / "اليوم". Falls back to English, then to the key itself. */
export function t(key, vars) {
  let text = translations[lang]?.[key] ?? translations.en[key] ?? key;
  if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value);
  return text;
}

export function setLang(next) {
  lang = next === "ar" ? "ar" : "en";
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";

  const link = document.getElementById("bs-css");
  const wanted = lang === "ar" ? BS_RTL : BS_LTR;
  if (link && link.getAttribute("href") !== wanted) link.setAttribute("href", wanted);
}

/** Fills every [data-i18n] (text) and [data-i18n-attr="placeholder:key;aria-label:key"] inside root. */
export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

/** Locale-aware date, e.g. fmtDate(new Date(), { weekday: "long", month: "long", day: "numeric" }) */
export function fmtDate(date, opts) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", opts).format(date);
}
