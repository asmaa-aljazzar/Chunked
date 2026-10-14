const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const loginForm = document.querySelector("#login-form");
const formStatus = document.querySelector("#form-status");

passwordToggle?.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "Show" : "Hide";
  passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.hidden = false;
  formStatus.textContent = "The sign-in service is not connected yet. Your details were not sent or saved.";
});
