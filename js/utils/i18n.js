// Translation helper + RTL switching
import { translations } from '../../data/translations.js';

let current = 'en';
export const t = (key) => translations[current]?.[key] ?? translations.en[key] ?? key;

export const applyLang = (lang) => {
  current = translations[lang] ? lang : 'en';
  document.documentElement.lang = current;
  document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
  // Translate every element marked data-i18n (and data-i18n-placeholder)
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
};
