// auth.js — login, signup and forgot-password in one file (same centered-card layout, different fields).
// Routes: #/login  #/signup  #/forgot.  All server calls go through js/api.js (fake for now).
import { getState, update } from "../state.js";
import { t } from "../utils/i18n.js";
import { navigate } from "../router.js";
import * as api from "../api.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELDS = {
  name: { id: "name", type: "text", label: "auth.name", autocomplete: "name" },
  email: { id: "email", type: "email", label: "auth.email", autocomplete: "email" },
  password: { id: "password", type: "password", label: "auth.password", autocomplete: "current-password" },
  confirm: { id: "confirm", type: "password", label: "auth.confirm", autocomplete: "new-password" },
};

const VIEWS = {
  login: { fields: ["email", "password"], cta: "auth.login.cta" },
  signup: { fields: ["name", "email", "password", "confirm"], cta: "auth.signup.cta" },
  forgot: { fields: ["email"], cta: "auth.forgot.cta" },
};

function fieldHtml(key, kind) {
  const f = FIELDS[key];
  const autocomplete = key === "password" && kind === "signup" ? "new-password" : f.autocomplete;
  const input = `<input class="form-control" id="${f.id}" name="${f.id}" type="${f.type}" autocomplete="${autocomplete}"
        aria-describedby="${f.id}-err" ${key === "email" ? 'inputmode="email" dir="ltr"' : ""}>`;
  const control =
    f.type === "password"
      ? `<div class="input-group">${input}
           <button type="button" class="btn btn-outline-secondary" data-toggle="${f.id}" aria-label="${t("auth.show")}" aria-pressed="false">
             <i class="bi bi-eye" aria-hidden="true"></i></button></div>`
      : input;
  return `<div class="mb-3">
      <label class="form-label fw-semibold" for="${f.id}">${t(f.label)}</label>${control}
      <div class="field-error" id="${f.id}-err" hidden></div></div>`;
}

function validate(kind, data) {
  const errors = {};
  if (kind === "signup" && !data.name?.trim()) errors.name = "auth.err.name";
  if (!EMAIL_RE.test((data.email ?? "").trim())) errors.email = "auth.err.email";
  if (kind !== "forgot" && (data.password ?? "").length < 8) errors.password = "auth.err.password";
  if (kind === "signup" && data.confirm !== data.password) errors.confirm = "auth.err.match";
  return errors;
}

export function render(view, { parts }) {
  const kind = VIEWS[parts[0]] ? parts[0] : "login";
  const cfg = VIEWS[kind];
  const lang = getState().settings.lang;

  const links = {
    login: `<p class="mb-0 text-muted-x">${t("auth.noAccount")} <a href="#/signup">${t("auth.toSignup")}</a></p>`,
    signup: `<p class="mb-0 text-muted-x">${t("auth.haveAccount")} <a href="#/login">${t("auth.toLogin")}</a></p>`,
    forgot: `<p class="mb-0"><a href="#/login"><i class="bi bi-arrow-left flip" aria-hidden="true"></i> ${t("auth.backToLogin")}</a></p>`,
  }[kind];

  view.innerHTML = `
    <div class="auth">
      <aside class="auth-side" aria-hidden="true">
        <div class="brand"><span class="brand-mark"><i class="bi bi-layers"></i></span><span>${t("app.name")}</span></div>
        <p class="auth-tagline h-font">${t("auth.tagline")}</p>
        <ul class="auth-points">
          <li><i class="bi bi-sun"></i><span>${t("mod.day.desc")}</span></li>
          <li><i class="bi bi-graph-up-arrow"></i><span>${t("mod.grow.desc")}</span></li>
          <li><i class="bi bi-bullseye"></i><span>${t("mod.focus.desc")}</span></li>
        </ul>
      </aside>

      <section class="auth-main">
        <div class="auth-top">
          <a class="brand d-lg-none" href="#/login"><span class="brand-mark"><i class="bi bi-layers"></i></span><span>${t("app.name")}</span></a>
          <button type="button" class="icon-btn fw-semibold ms-auto" data-lang aria-label="${t("top.language")}">${lang === "ar" ? "EN" : "ع"}</button>
        </div>

        <div class="auth-card" id="auth-card">
          <h1 class="h3">${t(`auth.${kind}.title`)}</h1>
          <p class="text-muted-x mb-4">${t(`auth.${kind}.subtitle`)}</p>

          <div class="notice" id="auth-alert" role="alert" hidden></div>

          <form novalidate id="auth-form">
            ${cfg.fields.map((k) => fieldHtml(k, kind)).join("")}
            ${kind === "login" ? `<p class="text-end mb-3"><a href="#/forgot">${t("auth.forgot.link")}</a></p>` : ""}
            <button type="submit" class="btn btn-primary w-100" id="auth-submit" style="min-height:var(--tap)">
              <span class="spinner-border spinner-border-sm me-2" hidden aria-hidden="true"></span><span>${t(cfg.cta)}</span>
            </button>
          </form>

          <div class="mt-4">${links}</div>
          ${kind === "login" ? `<p class="demo-hint small mt-4 mb-0">${t("auth.demoHint")}</p>` : ""}
        </div>
      </section>
    </div>`;

  const form = view.querySelector("#auth-form");
  const alertBox = view.querySelector("#auth-alert");
  const submit = view.querySelector("#auth-submit");

  view.querySelector("[data-lang]").onclick = () => update({ settings: { lang: lang === "ar" ? "en" : "ar" } });

  // show / hide password
  view.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.onclick = () => {
      const input = view.querySelector(`#${btn.dataset.toggle}`);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", t(show ? "auth.hide" : "auth.show"));
      btn.firstElementChild.className = `bi ${show ? "bi-eye-slash" : "bi-eye"}`;
    };
  });

  const setLoading = (on) => {
    submit.disabled = on;
    submit.querySelector(".spinner-border").hidden = !on;
  };
  const clearErrors = () => {
    alertBox.hidden = true;
    form.querySelectorAll(".field-error").forEach((el) => (el.hidden = true));
    form.querySelectorAll(".form-control").forEach((el) => el.removeAttribute("aria-invalid"));
  };
  const showFieldError = (id, key) => {
    const box = form.querySelector(`#${id}-err`);
    box.innerHTML = `<i class="bi bi-exclamation-circle" aria-hidden="true"></i> ${t(key)}`;
    box.hidden = false;
    form.querySelector(`#${id}`).setAttribute("aria-invalid", "true");
  };
  const showAlert = (key) => {
    alertBox.innerHTML = `<i class="bi bi-exclamation-circle" aria-hidden="true"></i> ${t(key)}`;
    alertBox.hidden = false;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const data = Object.fromEntries(new FormData(form));
    const errors = validate(kind, data);
    const ids = Object.keys(errors);
    if (ids.length) {
      ids.forEach((id) => showFieldError(id, errors[id]));
      form.querySelector(`#${ids[0]}`).focus();
      return;
    }

    setLoading(true);
    try {
      if (kind === "login") await api.login(data.email, data.password);
      if (kind === "signup") await api.signup(data.name, data.email, data.password);
      if (kind === "forgot") {
        await api.forgotPassword(data.email);
        view.querySelector("#auth-card").innerHTML = `
          <div class="text-center py-3">
            <i class="bi bi-envelope-check display-4 d-block mb-3" style="color:var(--accent-text)" aria-hidden="true"></i>
            <h1 class="h3">${t("auth.forgot.sentTitle")}</h1>
            <p class="text-muted-x mb-4">${t("auth.forgot.sentBody")}</p>
            <a class="btn btn-primary" href="#/login">${t("auth.backToLogin")}</a>
          </div>`;
        return;
      }
      navigate("dashboard"); // the router's guard sends new users to onboarding and admins to the admin area
    } catch (err) {
      showAlert(err.code === "credentials" ? "auth.err.credentials" : "auth.err.generic");
      setLoading(false);
    }
  });
}
