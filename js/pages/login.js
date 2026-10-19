import { getDemoDestination, getDemoSession, signInDemo } from "../utils/demo-auth.js?v=2";
import { saveProfile } from "../utils/profile.js?v=1";

const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const loginForm = document.querySelector("#login-form");
const formStatus = document.querySelector("#form-status");

const currentSession = getDemoSession();
if (currentSession) window.location.replace(getDemoDestination(currentSession));

passwordToggle?.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "Show" : "Hide";
  passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value;
  const session = signInDemo(email, passwordInput.value);
  formStatus.hidden = false;
  if (!session) {
    formStatus.textContent = "That email and password don’t match either demo account.";
    return;
  }
  saveProfile({ displayName: session.name, email: session.email });
  formStatus.textContent = `Signed in as ${session.role === "admin" ? "Admin" : "User"}. Opening your workspace…`;
  window.setTimeout(() => window.location.assign(getDemoDestination(session)), 180);
});

document.querySelectorAll("[data-demo-login]").forEach((button) => button.addEventListener("click", () => {
  const account = button.dataset.demoLogin;
  loginForm.elements.email.value = account === "admin" ? "admin@example.com" : "user@example.com";
  passwordInput.value = account === "admin" ? "admin123" : "user123";
  loginForm.requestSubmit();
}));
