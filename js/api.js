// api.js — the ONLY place that talks to "the server". Right now it is FAKE (localStorage + small delays).
// When Laravel exists, replace the body of each function with fetch("/api/...") and keep the same signatures,
// so no page has to change.
import { getState, update } from "./state.js";
import { load, save } from "./utils/storage.js";

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // e.g. "credentials"
  }
}

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

// DEMO ONLY. A real admin account is created by a Laravel seeder, never in frontend code.
export const DEMO_ADMIN = { email: "admin@chunked.test", password: "admin12345" };

/** login(email, password) -> user. Demo rule: any valid email logs in as a normal user, except the demo admin. */
export async function login(email, password) {
  await delay();
  email = email.trim().toLowerCase();

  if (email === DEMO_ADMIN.email) {
    if (password !== DEMO_ADMIN.password) throw new ApiError("credentials");
    const admin = { id: 1, name: "Admin", email, role: "admin", plan: "premium" };
    update({ user: admin });
    return admin;
  }

  const known = load("users", {})[email];
  const user = { id: known?.id ?? Date.now(), name: known?.name ?? email.split("@")[0], email, role: "user", plan: "free" };
  update({ user });
  return user;
}

/** signup(name, email, password) -> user. The server always creates role "user"; the form can never choose a role. */
export async function signup(name, email, password) {
  await delay();
  email = email.trim().toLowerCase();
  const user = { id: Date.now(), name: name.trim(), email, role: "user", plan: "free" };
  const users = load("users", {});
  users[email] = { id: user.id, name: user.name }; // the password is NOT stored
  save("users", users);
  update({ user, settings: { onboarded: false } }); // new accounts start onboarding
  return user;
}

export async function forgotPassword() {
  await delay();
  return true; // the real server answers the same whether or not the email exists
}

export function logout() {
  update({ user: null });
}

export const currentUser = () => getState().user;
