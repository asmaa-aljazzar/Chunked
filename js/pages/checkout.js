import { applyTheme, getActiveMode, getActiveThemeKey } from "../utils/theme.js?v=2";
import { applyLanguage, getLanguage } from "../utils/language.js";
import { saveSubscription } from "../utils/subscription.js?v=3";

applyTheme(getActiveThemeKey(), { mode: getActiveMode(), persist: false });
applyLanguage(getLanguage(), { persist: false });

const form = document.querySelector("#checkout-form");
const status = document.querySelector("#checkout-status");
const success = document.querySelector("#checkout-success");
const successLink = document.querySelector("#checkout-success-link");
const successSecondary = document.querySelector("#checkout-success-secondary");
const params = new URLSearchParams(window.location.search);
const isTemplateCheckout = params.get("purchase") === "templates";
const billing = params.get("billing") === "yearly" ? "yearly" : "monthly";
const billingLabel = billing === "yearly" ? "Yearly billing" : "Monthly billing";

const cartKey = "chunked-template-cart-v1";
const ownedKey = "chunked-owned-templates-v1";
let cartItems = [];
try {
  const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
  cartItems = Array.isArray(savedCart) ? savedCart.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(Number(item.price))) : [];
} catch { cartItems = []; }

if (isTemplateCheckout) {
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  document.title = "Template checkout — Chunked";
  document.querySelector(".checkout-heading .eyebrow").textContent = "Printable templates";
  document.querySelector("#checkout-title").textContent = "Complete your order";
  document.querySelector(".checkout-heading > p:last-child").textContent = "Review your printable templates and continue.";
  document.querySelector("#order-title").textContent = "Your templates";
  document.querySelector(".order-panel__description").textContent = cartItems.map((item) => item.name).join(", ") || "Your cart is empty.";
  document.querySelector(".order-plan strong").textContent = `${cartItems.length} printable${cartItems.length === 1 ? "" : "s"}`;
  document.querySelector("#order-billing").textContent = "One-time demo purchase";
  document.querySelector(".order-plan__change").hidden = true;
  document.querySelector("#order-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.querySelector("#order-total").textContent = `$${subtotal.toFixed(2)}`;
  document.querySelector("#order-renewal").textContent = "One-time purchase. No subscription is created.";
  document.querySelector("#order-renewal").hidden = false;
  document.querySelector(".billing-consent span").textContent = "I understand this is a frontend demo checkout.";
  document.querySelector(".checkout-note").textContent = "Demo checkout only. No payment details are sent or saved.";
  document.querySelector(".checkout-back").href = "cart.html";
  document.querySelector(".checkout-back span").textContent = "Back to cart";
  document.querySelector(".checkout-submit span:first-child").textContent = "Complete demo purchase";
  document.querySelector("#checkout-success-title").textContent = "Your templates are ready.";
  document.querySelector("#checkout-success > p:not(.eyebrow)").textContent = "Your purchased printables are now available in My templates.";
  successLink.href = "templates.html";
  successLink.innerHTML = 'View my templates <span aria-hidden="true">→</span>';
  successSecondary.hidden = true;
  if (!cartItems.length) {
    status.textContent = "Your cart is empty. Add a paid printable before checkout.";
    status.hidden = false;
    form.querySelectorAll("input, button").forEach((field) => { field.disabled = true; });
  }
} else {
  document.querySelector("#order-billing").textContent = billingLabel;
  document.querySelector("#order-renewal").textContent = billing === "yearly"
    ? "Your subscription renews yearly. Cancel any time."
    : "Your subscription renews monthly. Cancel any time.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isTemplateCheckout) {
    try {
      const owned = JSON.parse(localStorage.getItem(ownedKey) || "[]");
      const ownedIds = new Set(Array.isArray(owned) ? owned : []);
      cartItems.forEach((item) => ownedIds.add(item.id));
      localStorage.setItem(ownedKey, JSON.stringify([...ownedIds]));
      localStorage.removeItem(cartKey);
    } catch {
      status.textContent = "This browser could not save your template purchase.";
      status.hidden = false;
      return;
    }
  } else if (!saveSubscription("premium", billing)) {
    status.textContent = "Premium could not be activated in this browser. Please try again.";
    status.hidden = false;
    return;
  }
  form.querySelectorAll("[autocomplete^='cc-']").forEach((field) => { field.value = ""; });
  form.hidden = true;
  success.hidden = false;
  if (!isTemplateCheckout) {
    successLink.href = "dashboard.html";
    successLink.innerHTML = 'Continue to Premium <span aria-hidden="true">→</span>';
    successSecondary.href = "insights.html";
    successSecondary.textContent = "Explore Insights";
  }
});
