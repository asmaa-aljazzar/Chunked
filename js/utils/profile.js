export const PROFILE_STORAGE_KEY = "chunked-profile-v1";

export function getProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
    return {
      displayName: typeof value.displayName === "string" && value.displayName.trim() ? value.displayName.trim() : "Alex Morgan",
      email: typeof value.email === "string" && value.email.trim() ? value.email.trim() : "alex@example.com",
    };
  } catch {
    return { displayName: "Alex Morgan", email: "alex@example.com" };
  }
}

export function saveProfile(profile) {
  const next = {
    displayName: String(profile.displayName || "").trim(),
    email: String(profile.email || "").trim(),
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  document.dispatchEvent(new CustomEvent("chunked:profilechange", { detail: next }));
  return true;
}
