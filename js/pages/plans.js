import { getSubscription, saveSubscription } from "../utils/subscription.js?v=3";

const cadenceButtons = [...document.querySelectorAll("[data-cadence]")];
const premiumPrice = document.querySelector("#premium-price");
const freeButton = document.querySelector("#continue-free");
const plansStatus = document.querySelector("#plans-status");
const currentPlanBadge = document.querySelector("#current-plan-badge");
const currentPlanCopy = document.querySelector("#current-plan-copy");
let cadence = "monthly";

function readPlan() {
  return getSubscription();
}

function renderPlan() {
  const plan = readPlan();
  const premium = plan.plan === "premium";
  currentPlanBadge.textContent = premium ? "Active" : "Free";
  currentPlanCopy.textContent = premium
    ? `Your selected plan is active${plan.cadence ? ` · ${plan.cadence} billing` : ""}.`
    : "You’re currently on the Free plan.";
}

function setCadence(value) {
  cadence = value === "yearly" ? "yearly" : "monthly";
  cadenceButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.cadence === cadence)));
  premiumPrice.querySelector("span").textContent = `${cadence} billing`;
  const destination = new URLSearchParams(window.location.search).get("return");
  const returnQuery = destination === "settings" || destination === "templates" ? `&return=${destination}` : "";
  document.querySelector("#review-premium").href = `checkout.html?billing=${cadence}${returnQuery}`;
}

cadenceButtons.forEach((button) => button.addEventListener("click", () => setCadence(button.dataset.cadence)));

freeButton.addEventListener("click", () => {
  try {
    if (!saveSubscription("free")) throw new Error("Plan could not be saved");
    plansStatus.textContent = "Free plan selected.";
    renderPlan();
  } catch {
    plansStatus.textContent = "Your plan selection could not be saved.";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "chunked-demo-plan-v1") renderPlan();
});
document.addEventListener("chunked:planchange", renderPlan);

setCadence(cadence);
renderPlan();
