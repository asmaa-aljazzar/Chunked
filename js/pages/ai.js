import { getDemoSession } from "../utils/demo-auth.js?v=2";
import { isPremium } from "../utils/subscription.js?v=3";

const form = document.querySelector("#ai-composer");
const promptInput = document.querySelector("#ai-prompt");
const messages = document.querySelector("#ai-messages");
const sendButton = form.querySelector('button[type="submit"]');
const sendLabel = document.querySelector("#ai-send-label");
const usageDetail = document.querySelector("#ai-usage-detail");
const usagePlan = document.querySelector("#ai-usage-plan");
const usageProgress = document.querySelector("#ai-usage-progress");
const usageReset = document.querySelector("#ai-usage-reset");
const usageLimitNote = document.querySelector("#ai-usage-limit");
const usageLimitText = document.querySelector("#ai-usage-limit-text");
const usageUpgradeLink = usageLimitNote.querySelector("a");
const dailyFreeLimit = 5;
const dailyPremiumLimit = 30;
const accountEmail = getDemoSession()?.email?.trim().toLocaleLowerCase() || "demo";
const usageStorageKey = `chunked-ai-usage-v1:${encodeURIComponent(accountEmail)}`;
const conversationStorageKey = `chunked-ai-conversation-v1:${encodeURIComponent(accountEmail)}`;
let waitingForReply = false;

function readConversation() {
  try {
    const saved = JSON.parse(localStorage.getItem(conversationStorageKey) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((message) =>
      message && ["user", "assistant"].includes(message.role) && typeof message.text === "string" && message.text.trim(),
    );
  } catch {
    return [];
  }
}

let conversation = readConversation();

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readUsage() {
  try {
    const saved = JSON.parse(localStorage.getItem(usageStorageKey) || "null");
    if (saved?.date === localDateKey() && Number.isInteger(saved.count) && saved.count >= 0) return saved;
  } catch { /* Start a fresh daily counter when browser storage is unavailable. */ }
  return { date: localDateKey(), count: 0 };
}

let usage = readUsage();

function dailyLimit() {
  return isPremium() ? dailyPremiumLimit : dailyFreeLimit;
}

function updateUsage() {
  if (usage.date !== localDateKey()) usage = { date: localDateKey(), count: 0 };
  const limit = dailyLimit();
  const premium = isPremium();
  const plan = premium ? "Premium" : "Free";
  const atLimit = usage.count >= limit;
  const used = Math.min(usage.count, limit);
  usagePlan.textContent = plan;
  usageDetail.textContent = `${used} of ${limit} AI replies used today`;
  usageProgress.setAttribute("aria-valuemax", String(limit));
  usageProgress.setAttribute("aria-valuenow", String(used));
  usageProgress.style.setProperty("--ai-usage-fill", `${Math.min(100, (used / limit) * 100)}%`);
  usageLimitNote.hidden = used < limit;
  usageReset.hidden = atLimit;
  usageLimitText.textContent = "Daily limit reached.";
  usageUpgradeLink.hidden = premium;
  sendButton.disabled = waitingForReply || atLimit;
  sendLabel.textContent = atLimit ? "Limit reached" : "Send";
  sendButton.title = atLimit ? "You've used all of today's AI replies." : "";
}

function saveUsage() {
  usage.date = localDateKey();
  try { localStorage.setItem(usageStorageKey, JSON.stringify(usage)); } catch { /* Keep the count for this visit. */ }
  updateUsage();
}

updateUsage();
document.addEventListener("chunked:planchange", updateUsage);
window.addEventListener("storage", (event) => {
  if (event.key === usageStorageKey) {
    usage = readUsage();
    updateUsage();
  }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) updateUsage(); });

function resizePrompt() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 160)}px`;
  promptInput.style.overflowY = promptInput.scrollHeight > 160 ? "auto" : "hidden";
}

promptInput.addEventListener("input", resizePrompt);

function appendMessage(text, role, { scroll = true, persist = true } = {}) {
  const article = document.createElement("article");
  article.className = `ai-message ai-message--${role}`;
  if (role === "assistant") {
    const avatar = document.createElement("span");
    avatar.className = "ai-message__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "✦";
    article.append(avatar);
  }
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  article.append(paragraph);
  messages.append(article);
  if (persist) {
    conversation.push({ text, role });
    try { localStorage.setItem(conversationStorageKey, JSON.stringify(conversation)); } catch { /* Keep the current conversation available for this visit. */ }
  }
  if (scroll) messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

if (conversation.length) {
  messages.replaceChildren();
  conversation.forEach(({ text, role }) => appendMessage(text, role, { scroll: false, persist: false }));
  messages.scrollTop = messages.scrollHeight;
}

function sampleReply(message) {
  const lower = message.toLocaleLowerCase();
  if (lower.includes("wait") || lower.includes("list")) return "Try keeping the one task that matters most for this chunk. Anything less urgent can move to a later chunk, so your list stays kind to your attention.";
  if (lower.includes("switch") || lower.includes("focus")) return "Before switching, ask: have I reached a natural stopping point, or is there a blocker? You can stay with this focus, take a short break, or choose another priority when it feels right.";
  if (lower.includes("big task") || lower.includes("first step")) return "Make the first step small enough to begin in about 10–15 minutes. Write one action with a clear finish, then decide what comes next after that.";
  return "Let’s make this manageable: choose one useful next step, give it a short time window, and leave the rest for later. What would feel like a good first move?";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = promptInput.value.trim();
  if (!message || waitingForReply) return;
  usage = readUsage();
  if (usage.count >= dailyLimit()) {
    updateUsage();
    usageLimitNote.hidden = false;
    return;
  }
  appendMessage(message, "user");
  promptInput.value = "";
  resizePrompt();
  waitingForReply = true;
  sendButton.disabled = true;
  window.setTimeout(() => {
    appendMessage(sampleReply(message), "assistant");
    if (usage.date !== localDateKey()) usage = { date: localDateKey(), count: 0 };
    usage.count += 1;
    saveUsage();
    waitingForReply = false;
    updateUsage();
  }, 450);
});

document.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => {
  promptInput.value = button.dataset.prompt;
  resizePrompt();
  promptInput.focus();
}));

const incomingPrompt = new URLSearchParams(window.location.search).get("prompt");
if (incomingPrompt) {
  promptInput.value = incomingPrompt;
  resizePrompt();
  promptInput.focus({ preventScroll: true });
}
