export const DEMO_SESSION_KEY = "chunked-demo-session-v1";

// Public demo credentials. This is presentation-only authentication, not security.
const DEMO_ACCOUNTS = [
  { email: "admin@example.com", password: "admin123", name: "Admin", role: "admin" },
  { email: "user@example.com", password: "user123", name: "Alex Morgan", role: "user" },
];

export function signInDemo(email, password) {
  const normalizedEmail = String(email || "").trim().toLocaleLowerCase();
  const account = DEMO_ACCOUNTS.find((entry) => entry.email === normalizedEmail && entry.password === String(password || ""));
  if (!account) return null;
  const session = {
    email: account.email,
    name: account.name,
    role: account.role,
    signedInAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    return null;
  }
  document.dispatchEvent(new CustomEvent("chunked:authchange", { detail: session }));
  return session;
}

export function getDemoSession() {
  try {
    const session = JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || "null");
    if (!session || !["admin", "user"].includes(session.role) || typeof session.email !== "string") return null;
    const normalizedName = session.role === "user" ? "Alex Morgan" : "Admin";
    if (session.name === "Demo User" || session.name === "Demo Admin") {
      session.name = normalizedName;
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

export function signOutDemo() {
  try { localStorage.removeItem(DEMO_SESSION_KEY); } catch { /* Continue to the login page. */ }
  document.dispatchEvent(new CustomEvent("chunked:authchange", { detail: null }));
}

export function getDemoDestination(session) {
  return session?.role === "admin" ? "../admin/dashboard.html" : "dashboard.html";
}
