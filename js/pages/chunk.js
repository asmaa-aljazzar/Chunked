import { CHUNKS, getCurrentChunkKey, setCurrentChunkKey } from "../utils/chunks.js";
import { getDayMode, getPeriodDisplay } from "../utils/day-preferences.js";

const params = new URLSearchParams(window.location.search);
const requestedChunk = params.get("period")?.toLowerCase();
const activeChunk = CHUNKS[requestedChunk] ? requestedChunk : getCurrentChunkKey();
const chunk = CHUNKS[activeChunk];
const customDayMode = getDayMode() === "custom";
const displayChunkLabel = getPeriodDisplay(activeChunk, chunk.label);
setCurrentChunkKey(activeChunk);
const title = document.querySelector("#chunk-title");
const timeRange = document.querySelector("#chunk-time-range");
const checklistTitle = document.querySelector("#checklist-title");
const checklist = document.querySelector("#chunk-checklist");
const progress = document.querySelector("#checklist-progress");
const taskCardPrevious = document.querySelector("#task-card-previous");
const taskCardNext = document.querySelector("#task-card-next");
const taskCardPosition = document.querySelector("#task-card-position");
const taskCardSlider = document.querySelector("#chunk-task-slider");
const timerDisplay = document.querySelector("#timer-display");
const timerStatus = document.querySelector("#timer-status");
const timerToggle = document.querySelector("#timer-toggle");
const timerDuration = document.querySelector("#timer-duration");
const timerDurationLabel = document.querySelector("#timer-duration-label");
const chunkRemaining = document.querySelector("#chunk-remaining");
const sampleNowDisplay = document.querySelector("#chunk-sample-now");
const sessionCount = document.querySelector("#session-count");
const breakTimerDisplay = document.querySelector("#break-counter-display");
const breakToggle = document.querySelector("#break-toggle");
const sessionMessage = document.querySelector("#session-message");

document.title = `${displayChunkLabel} session — Chunked`;
title.textContent = displayChunkLabel;
timeRange.textContent = customDayMode ? "Custom period · no time set" : `Sample range: ${chunk.range}`;
checklistTitle.textContent = `${displayChunkLabel} checklist`;

function parseClockTime(value) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

const [startLabel, endLabel] = (customDayMode ? "" : chunk.range).split(/\s*[–-]\s*/);
const startMinute = parseClockTime(startLabel);
const endMinute = parseClockTime(endLabel);
const sampleTimeStart = Date.now();
const sampleStartOffset = startMinute === null ? null : (startMinute + 30) % (24 * 60);
const sampleElapsedAtStart = 30 * 60;
const sampleEndOffset = endMinute === null ? null : endMinute;
const sampleDurationMinutes = startMinute === null || endMinute === null
  ? null
  : (endMinute > startMinute ? endMinute - startMinute : endMinute + 24 * 60 - startMinute);

function formatSampleTime(date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function updateChunkRemaining() {
  if (sampleStartOffset === null || sampleEndOffset === null || sampleDurationMinutes === null) {
    sampleNowDisplay.textContent = "Time not set";
    chunkRemaining.textContent = "—";
    return;
  }

  const elapsedSeconds = Math.floor((Date.now() - sampleTimeStart) / 1000);
  const sampleNow = new Date();
  sampleNow.setHours(0, sampleStartOffset + Math.floor(elapsedSeconds / 60), elapsedSeconds % 60, 0);
  const durationSeconds = sampleDurationMinutes * 60;
  const secondsLeft = Math.max(0, durationSeconds - sampleElapsedAtStart - elapsedSeconds);
  sampleNowDisplay.textContent = formatSampleTime(sampleNow);
  const hours = Math.floor(secondsLeft / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  chunkRemaining.textContent = `${hours}:${minutes}:${seconds}`;
}

updateChunkRemaining();
window.setInterval(updateChunkRemaining, 1000);

const checklistStorageKey = `chunked-checklist-${activeChunk}`;
let checkedTasks = new Set();

try {
  const savedTasks = JSON.parse(localStorage.getItem(checklistStorageKey) || "[]");
  if (Array.isArray(savedTasks)) {
    checkedTasks = new Set(savedTasks.filter((index) => Number.isInteger(index) && index >= 0 && index < chunk.tasks.length));
  }
} catch {
  checkedTasks = new Set();
}

function updateChecklistProgress() {
  const checkedCount = checkedTasks.size;
  progress.textContent = `${checkedCount} of ${chunk.tasks.length} complete`;
}

const tasksPerCard = 3;
const taskCardCount = Math.ceil(chunk.tasks.length / tasksPerCard);
let activeTaskCard = 0;

function createTaskItem(task, index) {
  const item = document.createElement("li");
  const label = document.createElement("label");
  label.className = "chunk-checklist__item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checkedTasks.has(index);
  checkbox.setAttribute("aria-label", task);

  const text = document.createElement("span");
  text.textContent = task;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) checkedTasks.add(index);
    else checkedTasks.delete(index);
    try {
      localStorage.setItem(checklistStorageKey, JSON.stringify([...checkedTasks]));
    } catch {
      // Checklist interaction remains available for this visit if storage is unavailable.
    }
    item.classList.toggle("is-checked", checkbox.checked);
    updateChecklistProgress();
  });

  item.classList.toggle("is-checked", checkbox.checked);
  label.append(checkbox, text);
  item.append(label);
  return item;
}

function renderTaskCard() {
  const firstTaskIndex = activeTaskCard * tasksPerCard;
  const visibleTasks = chunk.tasks.slice(firstTaskIndex, firstTaskIndex + tasksPerCard);
  checklist.replaceChildren(...visibleTasks.map((task, offset) => createTaskItem(task, firstTaskIndex + offset)));
  checklist.setAttribute("aria-label", `Tasks on card ${activeTaskCard + 1} of ${taskCardCount}`);
  taskCardPosition.textContent = `Card ${activeTaskCard + 1} of ${taskCardCount}`;
  taskCardPrevious.disabled = activeTaskCard === 0;
  taskCardNext.disabled = activeTaskCard === taskCardCount - 1;
}

function moveTaskCard(direction) {
  activeTaskCard = Math.min(taskCardCount - 1, Math.max(0, activeTaskCard + direction));
  renderTaskCard();
}

taskCardPrevious.addEventListener("click", () => moveTaskCard(-1));
taskCardNext.addEventListener("click", () => moveTaskCard(1));

let swipeStart = null;
taskCardSlider.addEventListener("pointerdown", (event) => {
  swipeStart = event.target.closest("button, input") ? null : [event.clientX, event.clientY];
});
taskCardSlider.addEventListener("pointerup", (event) => {
  if (!swipeStart) return;
  const [startX, startY] = swipeStart;
  const horizontalDistance = event.clientX - startX;
  const verticalDistance = event.clientY - startY;
  swipeStart = null;
  if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) < Math.abs(verticalDistance)) return;
  event.preventDefault();
  moveTaskCard(horizontalDistance < 0 ? 1 : -1);
});
taskCardSlider.addEventListener("pointercancel", () => { swipeStart = null; });

renderTaskCard();
updateChecklistProgress();

const sessionStorageKey = `chunked-sessions-${new Date().toDateString()}-${activeChunk}`;
let completedSessions = 0;
try {
  completedSessions = Number(localStorage.getItem(sessionStorageKey) || 0);
  if (!Number.isFinite(completedSessions) || completedSessions < 0) completedSessions = 0;
} catch {
  completedSessions = 0;
}
sessionCount.textContent = String(completedSessions);

document.querySelector("#log-session").addEventListener("click", () => {
  completedSessions += 1;
  sessionCount.textContent = String(completedSessions);
  sessionMessage.textContent = "Nice work. Your session has been counted.";
  try {
    localStorage.setItem(sessionStorageKey, String(completedSessions));
  } catch {
    // The counter remains updated for this visit if storage is unavailable.
  }
});

let breakStartedAt = null;
let breakElapsedSeconds = 0;
let breakInterval = null;

function formatClock(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function renderBreakTimer() {
  if (breakStartedAt !== null) {
    breakElapsedSeconds = Math.floor((Date.now() - breakStartedAt) / 1000);
  }
  breakTimerDisplay.textContent = formatClock(breakElapsedSeconds);
}

breakToggle.addEventListener("click", () => {
  if (breakInterval) {
    window.clearInterval(breakInterval);
    breakInterval = null;
    breakStartedAt = null;
    breakToggle.textContent = "Start break";
    sessionMessage.textContent = "Break ended. Ready when you are.";
    renderBreakTimer();
    return;
  }

  breakElapsedSeconds = 0;
  breakStartedAt = Date.now();
  breakToggle.textContent = "End break";
  sessionMessage.textContent = "Take a moment. Your break is being timed.";
  renderBreakTimer();
  breakInterval = window.setInterval(renderBreakTimer, 1000);
});

let selectedDurationSeconds = Number(timerDuration.value) * 60;
let remainingSeconds = selectedDurationSeconds;
let timerInterval = null;

function renderTimer() {
  timerDisplay.textContent = formatClock(remainingSeconds);
}

function stopTimer(message) {
  window.clearInterval(timerInterval);
  timerInterval = null;
  timerDuration.disabled = false;
  timerToggle.textContent = remainingSeconds === selectedDurationSeconds ? "Start session" : "Resume session";
  timerStatus.textContent = message;
}

timerDuration.addEventListener("input", () => {
  const minutes = Number(timerDuration.value);
  selectedDurationSeconds = minutes * 60;
  remainingSeconds = selectedDurationSeconds;
  timerDurationLabel.value = minutes === 180 ? "3 hours" : `${minutes} min`;
  timerDurationLabel.textContent = timerDurationLabel.value;
  renderTimer();
  stopTimer("Session length updated. Ready when you are.");
});

timerDurationLabel.value = `${timerDuration.value} min`;
timerDurationLabel.textContent = timerDurationLabel.value;
renderTimer();

timerToggle.addEventListener("click", () => {
  if (timerInterval) {
    stopTimer("Session paused. Take a breath.");
    return;
  }

  if (remainingSeconds === 0) {
    remainingSeconds = selectedDurationSeconds;
    renderTimer();
  }
  timerDuration.disabled = true;
  timerToggle.textContent = "Pause session";
  timerStatus.textContent = "You’re doing one thing at a time.";
  timerInterval = window.setInterval(() => {
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      renderTimer();
      stopTimer("Your focus session is complete.");
      timerToggle.textContent = "Start another session";
    }
  }, 1000);
});

document.querySelector("#timer-reset").addEventListener("click", () => {
  remainingSeconds = selectedDurationSeconds;
  renderTimer();
  stopTimer("Ready when you are.");
});
