// toast.js — toast("Saved") / toast("Oops", { type: "error" }). Calm tone: no scary language.
export function toast(message, { type = "info", timeout = 3500 } = {}) {
  const icons = { info: "bi-info-circle", success: "bi-check-circle", error: "bi-exclamation-circle" };
  const el = document.createElement("div");
  el.className = `toast-x is-${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `<i class="bi ${icons[type] ?? icons.info}" aria-hidden="true"></i><span></span>`;
  el.querySelector("span").textContent = message;
  document.getElementById("toast-root").append(el);
  setTimeout(() => el.remove(), timeout);
  return el;
}
