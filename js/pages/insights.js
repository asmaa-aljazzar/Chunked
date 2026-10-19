import { isPremium } from "../utils/subscription.js?v=3";

const TASKS_KEY = "chunked-day-tasks-v1";
const GOALS_KEY = "chunked-grow-goals-v1";
const HABITS_KEY = "chunked-grow-habits-v1";
const REFLECTION_KEY = "chunked-insights-reflection-v1";

const rangeSelect = document.querySelector("#insights-range");
const taskOverview = document.querySelector("#task-overview");
const taskEmpty = document.querySelector("#task-empty");
const goalSummary = document.querySelector("#goal-summary");
const goalEmpty = document.querySelector("#goal-empty");
const habitSummaryList = document.querySelector("#habit-summary-list");
const habitEmpty = document.querySelector("#habit-empty");
const activityChart = document.querySelector("#activity-chart");
const activityEmpty = document.querySelector("#activity-empty");
const reflectionForm = document.querySelector("#reflection-form");
const reflectionInput = document.querySelector("#reflection-text");
const reflectionStatus = document.querySelector("#reflection-status");
const reflectionAdd = document.querySelector("#reflection-add");
const reflectionCancel = document.querySelector("#reflection-cancel");
const reflectionLatest = document.querySelector("#reflection-latest");
const reflectionEmpty = document.querySelector("#reflection-empty");
const protectedInsights = document.querySelector("#insights-protected");
const protectedContent = document.querySelector("#insights-protected-content");
const insightsLockCard = document.querySelector("#insights-lock-card");
let editingReflectionId = null;

function syncInsightAccess() {
  const premium = isPremium();
  protectedInsights.dataset.plan = premium ? "premium" : "free";
  protectedContent.inert = !premium;
  protectedContent.setAttribute("aria-hidden", String(!premium));
  insightsLockCard.hidden = premium;
}

syncInsightAccess();
document.addEventListener("chunked:planchange", syncInsightAccess);
window.addEventListener("storage", (event) => {
  if (event.key === "chunked-demo-plan-v1") syncInsightAccess();
});

function readRecords(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readValue(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function localKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function keyFromDate(date) {
  return localKey(date);
}

function selectedDates() {
  const today = new Date();
  const numberOfDays = Number(rangeSelect.value);
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - numberOfDays + 1, 12);
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return keyFromDate(date);
  });
}

function isValidDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= localKey();
}

function demoTaskRecords() {
  const records = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = dateFromKey(localKey());
    date.setDate(date.getDate() - offset);
    const key = keyFromDate(date);
    const count = 1 + ((offset * 3 + 1) % 4);
    const completed = count - (offset % 5 === 2 ? 1 : 0);
    for (let index = 0; index < count; index += 1) {
      const isComplete = index < completed;
      records.push({ id: `example-task-${offset}-${index}`, createdOn: key, completedOn: isComplete ? key : "", completed: isComplete });
    }
  }
  return records;
}

function demoGoals() {
  return [
    { id: "example-goal-1", title: "Build a small portfolio", progress: 68 },
    { id: "example-goal-2", title: "Practice English", progress: 42 },
    { id: "example-goal-3", title: "Make time to draw", progress: 24 },
    { id: "example-goal-4", title: "Finish a first sketch set", progress: 100 },
  ];
}

function demoHabits() {
  const definitions = [
    { id: "example-habit-reading", name: "Read for 15 minutes", weekdays: [0, 1, 2, 3, 4, 5, 6], done: (offset) => offset % 7 !== 5 },
    { id: "example-habit-english", name: "Practice English", weekdays: [0, 2, 4], done: (offset) => offset % 9 !== 4 },
    { id: "example-habit-drawing", name: "Draw for 10 minutes", weekdays: [1, 3, 5], done: (offset) => offset % 8 !== 3 },
  ];
  return definitions.map((habit) => {
    const start = dateFromKey(localKey());
    start.setDate(start.getDate() - 29);
    const startDate = keyFromDate(start);
    const completionDates = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = dateFromKey(localKey());
      date.setDate(date.getDate() - offset);
      const key = keyFromDate(date);
      if (habit.weekdays.includes(date.getDay()) && habit.done(offset)) completionDates.push(key);
    }
    return { ...habit, startDate, completionDates, scheduleHistory: [{ from: startDate, weekdays: habit.weekdays }], pauseRanges: [], status: "active", longestStreak: 0 };
  });
}

function taskDataSource() {
  const stored = readValue(TASKS_KEY);
  const records = readRecords(TASKS_KEY);
  if (stored === null) return { records: demoTaskRecords(), demo: true };
  if (records.length === 0) return { records: demoTaskRecords(), demo: true };
  if (records.some((task) => isValidDateKey(task.createdOn))) return { records, demo: false };
  return { records: demoTaskRecords(), demo: true };
}

function goalDataSource() {
  const stored = readValue(GOALS_KEY);
  if (stored === null) return { records: demoGoals(), demo: true };
  const records = readRecords(GOALS_KEY);
  if (records.length === 0) return { records: demoGoals(), demo: true };
  const userGoals = records.filter((goal) => goal.sample !== true);
  if (userGoals.length) return { records: userGoals, demo: false };
  return { records: demoGoals(), demo: true };
}

function habitDataSource() {
  const stored = readValue(HABITS_KEY);
  if (stored === null) return { records: demoHabits(), demo: true };
  const records = readRecords(HABITS_KEY);
  if (records.length === 0) return { records: demoHabits(), demo: true };
  const visible = records.filter((habit) => habit.status !== "archived");
  const actual = visible.filter((habit) => habit.sample !== true || habit.status === "paused" || (habit.completionDates?.length || habit.completedOn));
  if (actual.length) return { records: actual, demo: false };
  if (visible.length) return { records: demoHabits(), demo: true };
  return { records: [], demo: false };
}

function renderTasks(dates, source) {
  const dateSet = new Set(dates);
  const tasks = source.records.filter((task) => isValidDateKey(task.createdOn) && dateSet.has(task.createdOn));
  const complete = tasks.filter((task) => task.completed).length;
  const open = tasks.length - complete;
  const rate = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
  document.querySelector("#tasks-created").textContent = String(tasks.length);
  document.querySelector("#tasks-completed").textContent = String(complete);
  document.querySelector("#tasks-open").textContent = String(open);
  document.querySelector("#task-completion-rate").textContent = `${rate}%`;
  taskOverview.hidden = tasks.length === 0;
  taskEmpty.hidden = tasks.length > 0 || source.demo;
  document.querySelector("#task-demo-label").hidden = !source.demo;
  return source.demo;
}

function renderGoals(source) {
  const goals = source.records;
  const active = goals.filter((goal) => Number(goal.progress) < 100);
  const completed = goals.length - active.length;
  goalSummary.replaceChildren();
  goalSummary.hidden = goals.length === 0;
  goalEmpty.hidden = goals.length > 0 || source.demo;
  document.querySelector("#goal-demo-label").hidden = !source.demo;

  const counts = document.createElement("div");
  counts.className = "insights-goal-counts";
  counts.innerHTML = `<span><strong>${active.length}</strong> active</span><span><strong>${completed}</strong> completed</span>`;
  goalSummary.append(counts);

  goals.forEach((goal) => {
    const row = document.createElement("article");
    row.className = "insights-goal-row";
    const top = document.createElement("div");
    top.className = "insights-goal-row__top";
    const title = document.createElement("h3");
    title.textContent = goal.title;
    const percent = Math.min(100, Math.max(0, Number(goal.progress) || 0));
    const value = document.createElement("span");
    value.textContent = `${percent}%`;
    top.append(title, value);

    const progress = document.createElement("div");
    progress.className = "insights-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", `${goal.title} progress`);
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", String(percent));
    const fill = document.createElement("span");
    fill.style.width = `${percent}%`;
    progress.append(fill);
    row.append(top, progress);
    goalSummary.append(row);
  });
  return source.demo;
}

function normalizeHabit(habit) {
  const weekdays = Array.isArray(habit.weekdays) ? habit.weekdays.map(Number) : [0, 1, 2, 3, 4, 5, 6];
  const completionDates = Array.isArray(habit.completionDates) ? habit.completionDates : [];
  if (habit.completedOn && !completionDates.includes(habit.completedOn)) completionDates.push(habit.completedOn);
  const startDate = habit.startDate || localKey();
  return {
    ...habit,
    weekdays,
    completionDates,
    startDate,
    scheduleHistory: Array.isArray(habit.scheduleHistory) && habit.scheduleHistory.length ? habit.scheduleHistory : [{ from: startDate, weekdays }],
    pauseRanges: Array.isArray(habit.pauseRanges) ? habit.pauseRanges : [],
  };
}

function scheduleForDate(habit, key) {
  let days = habit.scheduleHistory[0]?.weekdays || habit.weekdays;
  for (const change of habit.scheduleHistory) if (change.from <= key) days = change.weekdays;
  return days;
}

function pausedOn(habit, key) {
  return habit.pauseRanges.some((range) => range.from <= key && (!range.to || key <= range.to));
}

function scheduledOn(habit, key) {
  return key >= habit.startDate && !pausedOn(habit, key) && scheduleForDate(habit, key).includes(dateFromKey(key).getDay());
}

function currentStreak(habit) {
  const today = localKey();
  const cursor = dateFromKey(today);
  let streak = 0;
  while (keyFromDate(cursor) >= habit.startDate) {
    const key = keyFromDate(cursor);
    if (pausedOn(habit, key) || !scheduledOn(habit, key)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!habit.completionDates.includes(key)) {
      if (key === today) { cursor.setDate(cursor.getDate() - 1); continue; }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function calculateLongestStreak(habit) {
  let longest = Number(habit.longestStreak) || 0;
  const cursor = dateFromKey(habit.startDate);
  const today = dateFromKey(localKey());
  let current = 0;
  while (cursor <= today) {
    const key = keyFromDate(cursor);
    if (pausedOn(habit, key) || !scheduledOn(habit, key)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (habit.completionDates.includes(key)) current += 1;
    else current = 0;
    longest = Math.max(longest, current);
    cursor.setDate(cursor.getDate() + 1);
  }
  return longest;
}

function renderHabits(dates, source) {
  const dateSet = new Set(dates);
  const habits = source.records;
  const normalized = habits.map(normalizeHabit);
  const today = localKey();
  const dueToday = normalized.filter((habit) => habit.status !== "paused" && scheduledOn(habit, today));
  const doneToday = dueToday.filter((habit) => habit.completionDates.includes(today)).length;
  document.querySelector("#habits-completed-today").textContent = dueToday.length ? `${doneToday} of ${dueToday.length}` : "No habits scheduled";

  let eligible = 0;
  let completed = 0;
  normalized.forEach((habit) => dates.forEach((date) => {
    if (habit.status === "paused" && date === today) return;
    if (!scheduledOn(habit, date)) return;
    eligible += 1;
    if (habit.completionDates.includes(date)) completed += 1;
  }));
  document.querySelector("#habit-period-summary").textContent = eligible
    ? `You showed up for ${completed} of your ${eligible} planned habit ${eligible === 1 ? "session" : "sessions"} (${Math.round((completed / eligible) * 100)}%).`
    : "No scheduled habit sessions in this period. Your pace is yours to set.";

  const withHistory = normalized.filter((habit) => habit.status === "active");
  habitSummaryList.replaceChildren();
  withHistory.forEach((habit) => {
    const row = document.createElement("article");
    row.className = "insights-habit-row";
    const heading = document.createElement("div");
    heading.className = "insights-habit-row__top";
    const title = document.createElement("h3");
    title.textContent = habit.name;
    const current = currentStreak(habit);
    const currentText = document.createElement("span");
    currentText.className = "insights-habit-row__meta";
    currentText.textContent = current ? `🔥 ${current} scheduled ${current === 1 ? "day" : "days"} in a row` : "Ready to begin again?";
    heading.append(title, currentText);
    const best = calculateLongestStreak(habit);
    row.append(heading);
    if (best > 0) {
      const longest = document.createElement("div");
      longest.className = "insights-habit-row__meta";
      longest.textContent = `Longest streak: ${best} ${best === 1 ? "scheduled day" : "scheduled days"}`;
      row.append(longest);
    }
    habitSummaryList.append(row);
  });
  const hasHistory = normalized.some((habit) => habit.completionDates.some((date) => dateSet.has(date)));
  habitSummaryList.hidden = withHistory.length === 0;
  habitEmpty.hidden = hasHistory || source.demo;
  document.querySelector("#habit-demo-label").hidden = !source.demo;
  return source.demo;
}

function renderActivity(dates, source) {
  const completedByDay = new Map(dates.map((date) => [date, 0]));
  source.records.forEach((task) => {
    if (task.completed && isValidDateKey(task.completedOn) && completedByDay.has(task.completedOn)) {
      completedByDay.set(task.completedOn, completedByDay.get(task.completedOn) + 1);
    }
  });
  const max = Math.max(1, ...completedByDay.values());
  activityChart.replaceChildren();
  activityChart.setAttribute("aria-label", `Completed task counts for the last ${dates.length} days`);
  dates.forEach((key, index) => {
    const date = dateFromKey(key);
    const count = completedByDay.get(key);
    const day = document.createElement("div");
    day.className = "activity-chart__day";
    day.setAttribute("role", "img");
    day.setAttribute("aria-label", `${new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date)}: ${count} completed ${count === 1 ? "task" : "tasks"}`);
    const countLabel = document.createElement("span");
    countLabel.className = "activity-chart__count";
    countLabel.textContent = String(count);
    const barArea = document.createElement("span");
    barArea.className = "activity-chart__bar-area";
    const bar = document.createElement("span");
    bar.className = `activity-chart__bar${count === 0 ? " is-zero" : ""}`;
    bar.style.setProperty("--bar-height", `${count === 0 ? 0 : (count / max) * 100}%`);
    const waveStep = dates.length > 7 ? 32 : 100;
    bar.style.animationDelay = `${Math.min(index * waveStep, 900)}ms`;
    barArea.append(bar);
    const label = document.createElement("span");
    label.textContent = dates.length === 7
      ? new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)
      : new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric" }).format(date);
    day.append(countLabel, barArea, label);
    activityChart.append(day);
  });
  const hasActivity = [...completedByDay.values()].some((count) => count > 0);
  activityChart.hidden = !hasActivity;
  activityEmpty.hidden = hasActivity;
  document.querySelector("#activity-demo-label").hidden = !source.demo;
}

function render() {
  const dates = selectedDates();
  const tasks = taskDataSource();
  const goals = goalDataSource();
  const habits = habitDataSource();
  const note = document.querySelector("#insights-data-note");
  const hasExampleData = tasks.demo || goals.demo || habits.demo;
  note.textContent = hasExampleData
    ? "Example data is shown only in sections without usable records. It’s for preview and does not replace your saved data."
    : "Insights use saved data in this browser. Tasks created before date tracking began are left out of date-range totals.";
  note.hidden = !hasExampleData && !readRecords(TASKS_KEY).some((task) => !isValidDateKey(task.createdOn));
  renderTasks(dates, tasks);
  renderGoals(goals);
  renderHabits(dates, habits);
  renderActivity(dates, tasks);
  document.querySelector("#activity-period").textContent = `Last ${dates.length} days`;
}

rangeSelect.addEventListener("change", render);

const revealItems = document.querySelectorAll(".insights-intro, .insights-section, .insights-note-card");
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  revealItems.forEach((item) => item.classList.add("insights-reveal"));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

function loadReflections() {
  try {
    const raw = localStorage.getItem(REFLECTION_KEY);
    if (!raw) return [];
    let saved;
    try { saved = JSON.parse(raw); } catch { return [{ text: raw.trim(), createdAt: new Date().toISOString() }].filter((entry) => entry.text); }
    if (Array.isArray(saved)) return saved.map((entry, index) => entry && typeof entry.text === "string" ? { ...entry, id: entry.id || `legacy-${index}-${entry.createdAt || entry.text.length}` } : null).filter(Boolean);
    if (typeof saved === "string" && saved.trim()) return [{ id: "legacy-single-reflection", text: saved.trim(), createdAt: new Date().toISOString() }];
  } catch { /* Keep the page usable if local storage contains old or invalid data. */ }
  return [];
}

function renderLatestReflection() {
  const [latest] = loadReflections().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  reflectionLatest.replaceChildren();
  reflectionLatest.hidden = !latest;
  reflectionEmpty.hidden = Boolean(latest);
  if (!latest) return;
  const body = document.createElement("p");
  body.textContent = latest.text;
  const date = document.createElement("time");
  const parsedDate = new Date(latest.createdAt || Date.now());
  date.dateTime = Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
  date.textContent = Number.isNaN(parsedDate.getTime()) ? "Saved reflection" : parsedDate.toLocaleDateString(undefined, { dateStyle: "medium" });
  const actions = document.createElement("div");
  actions.className = "reflection-card__actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "button button--secondary";
  edit.textContent = "Edit";
  edit.addEventListener("click", () => openReflectionEditor(latest));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "button button--secondary";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => deleteReflection(latest));
  actions.append(edit, remove);
  reflectionLatest.append(body, date, actions);
}

function openReflectionEditor(reflection = null) {
  editingReflectionId = reflection?.id || null;
  reflectionInput.value = reflection?.text || "";
  reflectionForm.hidden = false;
  reflectionAdd.hidden = true;
  reflectionForm.querySelector('[type="submit"]').textContent = reflection ? "Save changes" : "Save reflection";
  reflectionInput.focus();
}

function createReflectionId() {
  return globalThis.crypto?.randomUUID?.() || `reflection-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function deleteReflection(reflection) {
  if (!window.confirm("Delete this reflection? This cannot be undone.")) return;
  const remaining = loadReflections().filter((entry) => entry.id !== reflection.id);
  try {
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(remaining));
    renderLatestReflection();
  } catch {
    reflectionStatus.textContent = "This browser could not delete the reflection.";
  }
}

reflectionAdd.addEventListener("click", () => {
  openReflectionEditor();
});
reflectionCancel.addEventListener("click", () => {
  reflectionForm.reset();
  reflectionForm.hidden = true;
  reflectionAdd.hidden = false;
  editingReflectionId = null;
  reflectionForm.querySelector('[type="submit"]').textContent = "Save reflection";
  reflectionStatus.textContent = "";
});
reflectionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = reflectionInput.value.trim();
  if (!text) return;
  try {
    const reflections = loadReflections();
    if (editingReflectionId) {
      const existing = reflections.find((entry) => entry.id === editingReflectionId);
      if (existing) existing.text = text;
    } else {
      reflections.push({ id: createReflectionId(), text, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(reflections));
    reflectionForm.reset();
    reflectionForm.hidden = true;
    reflectionAdd.hidden = false;
    editingReflectionId = null;
    reflectionForm.querySelector('[type="submit"]').textContent = "Save reflection";
    reflectionStatus.textContent = "Saved on this device.";
    renderLatestReflection();
  } catch {
    reflectionStatus.textContent = "This browser could not save the reflection.";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === REFLECTION_KEY) renderLatestReflection();
});
renderLatestReflection();

render();

if (!("IntersectionObserver" in window)) {
  activityChart.classList.add("is-animated");
} else {
  const chartObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activityChart.classList.add("is-animated");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  chartObserver.observe(activityChart);
}
