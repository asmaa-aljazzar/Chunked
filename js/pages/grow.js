const GOALS_KEY = "chunked-grow-goals-v1";
const HABITS_KEY = "chunked-grow-habits-v1";
const sampleGoals = [
  { id: "goal-developer", title: "Become a stronger full-stack developer", description: "Improve my practical development skills through projects.", progress: 35, targetDate: "", sample: true },
  { id: "goal-english", title: "Improve my English", description: "Become more confident communicating in English.", progress: 20, targetDate: "", sample: true },
  { id: "goal-drawing", title: "Build a consistent drawing practice", description: "Practice drawing through small, regular exercises.", progress: 15, targetDate: "", sample: true },
];
const sampleHabits = [
  { id: "habit-reading", name: "Read for 15 minutes", description: "", schedule: "Daily", weekdays: [0,1,2,3,4,5,6], startDate: "", completionDates: [], scheduleHistory: [], pauseRanges: [], status: "active", sample: true },
  { id: "habit-english", name: "Practice English", description: "", schedule: "Daily", weekdays: [0,1,2,3,4,5,6], startDate: "", completionDates: [], scheduleHistory: [], pauseRanges: [], status: "active", sample: true },
  { id: "habit-drawing", name: "Draw for 10 minutes", description: "", schedule: "Daily", weekdays: [0,1,2,3,4,5,6], startDate: "", completionDates: [], scheduleHistory: [], pauseRanges: [], status: "active", sample: true },
];

const goalList = document.querySelector("#goal-list");
const habitList = document.querySelector("#habit-list");
const goalSliderControls = document.querySelector("#goal-slider-controls");
const goalPosition = document.querySelector("#goal-position");
const goalPrevious = document.querySelector("#goal-previous");
const goalNext = document.querySelector("#goal-next");
const dialog = document.querySelector("#grow-dialog");
const form = document.querySelector("#grow-form");
const nameInput = document.querySelector("#grow-name");
const descriptionInput = document.querySelector("#grow-description");
const dateInput = document.querySelector("#grow-date");
const progressInput = document.querySelector("#grow-progress");
const progressOutput = document.querySelector("#grow-progress-output");
const goalFields = document.querySelector("#goal-fields");
const habitFields = document.querySelector("#habit-fields");
const weekdayOptions = document.querySelector("#grow-weekday-options");
const scheduleHint = document.querySelector("#grow-schedule-hint");
const formTitle = document.querySelector("#grow-dialog-title");
const formEyebrow = document.querySelector("#grow-dialog-eyebrow");
const submitButton = document.querySelector("#grow-submit");
const descriptionLabel = document.querySelector("#grow-description-label");

let goals = loadItems(GOALS_KEY, sampleGoals);
let habits = loadItems(HABITS_KEY, sampleHabits).map(normalizeHabit);
let formType = "goal";
let editingId = null;
let activeGoalIndex = 0;

function loadItems(key, defaults) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaults.map((item) => ({ ...item })) : JSON.parse(stored);
  } catch {
    return defaults.map((item) => ({ ...item }));
  }
}

function saveItems() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

function makeButton(label, action, className = "grow-card__action") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function createGoalCard(goal) {
  const card = document.createElement("article");
  card.className = "grow-goal-card";

  const top = document.createElement("div");
  top.className = "grow-goal-card__top";
  const symbol = document.createElement("span");
  symbol.className = "grow-goal-card__symbol";
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = goal.progress >= 100 ? "✓" : "↗";
  const status = document.createElement("span");
  status.className = `grow-status${goal.progress >= 100 ? " is-complete" : ""}`;
  status.textContent = goal.progress >= 100 ? "Completed" : "In progress";
  top.append(symbol, status);

  const title = document.createElement("h3");
  title.textContent = goal.title;
  const description = document.createElement("p");
  description.className = "grow-goal-card__description";
  description.textContent = goal.description || "A goal you can shape as you go.";

  const progressLabel = document.createElement("div");
  progressLabel.className = "grow-goal-card__progress-label";
  const progressText = document.createElement("span");
  progressText.textContent = "Progress";
  const progressValue = document.createElement("strong");
  progressValue.textContent = `${goal.progress}%`;
  progressLabel.append(progressText, progressValue);

  const progress = document.createElement("div");
  progress.className = "grow-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", `${goal.title} progress`);
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", String(goal.progress));
  const fill = document.createElement("span");
  fill.style.width = `${goal.progress}%`;
  progress.append(fill);

  const meta = document.createElement("p");
  meta.className = "grow-goal-card__meta";
  if (goal.targetDate) {
    const date = new Date(`${goal.targetDate}T12:00:00`);
    meta.textContent = `Target · ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)}`;
  } else {
    meta.textContent = "No deadline · move at your own pace";
  }

  const actions = document.createElement("div");
  actions.className = "grow-card__actions";
  const edit = makeButton("Edit", "edit-goal");
  const remove = makeButton("Delete", "delete-goal");
  remove.classList.add("is-subtle");
  edit.dataset.id = remove.dataset.id = goal.id;
  actions.append(edit, remove);

  card.append(top, title, description, progressLabel, progress, meta, actions);
  return card;
}

function createHabitRow(habit) {
  const today = todayKey();
  const dueToday = habit.status === "active" && isScheduled(habit, today);
  const doneToday = habit.completionDates.includes(today);
  const item = document.createElement("li");
  item.className = `grow-habit${doneToday ? " is-done" : ""}${habit.status === "paused" ? " is-paused" : ""}`;
  item.dataset.id = habit.id;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "grow-habit__toggle";
  toggle.dataset.action = "toggle-habit";
  toggle.dataset.id = habit.id;
  toggle.disabled = !dueToday;
  toggle.setAttribute("aria-pressed", String(doneToday));
  toggle.setAttribute("aria-label", `${doneToday ? "Undo completion of" : "Mark complete"}: ${habit.name}`);
  toggle.textContent = "";
  toggle.classList.toggle("is-checked", doneToday);

  const copy = document.createElement("div");
  copy.className = "grow-habit__copy";
  const title = document.createElement("h3");
  title.textContent = habit.name;
  const description = document.createElement("p");
  description.textContent = habit.description || scheduleLabel(habit.weekdays);
  copy.append(title, description);

  const todayLabel = document.createElement("span");
  todayLabel.className = "grow-habit__today";
  todayLabel.textContent = habit.status === "paused" ? "Paused" : dueToday ? doneToday ? "Done today" : "For today" : "Not scheduled today";

  const streak = document.createElement("span");
  streak.className = "grow-habit__streak";
  const count = currentStreak(habit);
  streak.textContent = count ? `🔥 ${count} scheduled ${count === 1 ? "day" : "days"} in a row` : "Every habit starts somewhere.";
  streak.title = habit.longestStreak ? `Longest streak: ${habit.longestStreak} scheduled ${habit.longestStreak === 1 ? "day" : "days"}` : "Your streak grows on scheduled days you complete.";

  const actions = document.createElement("div");
  actions.className = "grow-card__actions grow-habit__actions";
  const edit = makeButton("Edit", "edit-habit");
  const remove = makeButton("Delete", "delete-habit");
  const status = makeButton(habit.status === "paused" ? "Resume" : "Pause", habit.status === "paused" ? "resume-habit" : "pause-habit");
  status.hidden = habit.status === "archived";
  const archive = makeButton(habit.status === "archived" ? "Restore" : "Archive", habit.status === "archived" ? "restore-habit" : "archive-habit");
  if (habit.status === "paused") status.classList.add("is-positive");
  if (habit.status === "archived") archive.classList.add("is-positive");
  remove.classList.add("is-subtle");
  status.dataset.id = archive.dataset.id = habit.id;
  edit.dataset.id = remove.dataset.id = habit.id;
  actions.append(status, archive, edit, remove);

  const footer = document.createElement("div");
  footer.className = "grow-habit__footer";
  footer.append(todayLabel, streak, actions);
  copy.append(footer);

  item.append(toggle, copy);
  return item;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tomorrowKey() {
  const tomorrow = dateFromKey(todayKey());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return keyFromDate(tomorrow);
}

function yesterdayKey() {
  const yesterday = dateFromKey(todayKey());
  yesterday.setDate(yesterday.getDate() - 1);
  return keyFromDate(yesterday);
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function keyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeHabit(habit) {
  const weekdays = Array.isArray(habit.weekdays) ? habit.weekdays.map(Number) : [0, 1, 2, 3, 4, 5, 6];
  const completionDates = Array.isArray(habit.completionDates) ? [...habit.completionDates] : [];
  if (habit.completedOn && !completionDates.includes(habit.completedOn)) completionDates.push(habit.completedOn);
  const startDate = habit.startDate || todayKey();
  return {
    ...habit, weekdays, completionDates, startDate,
    scheduleHistory: Array.isArray(habit.scheduleHistory) && habit.scheduleHistory.length
      ? habit.scheduleHistory
      : [{ from: startDate, weekdays }],
    pauseRanges: Array.isArray(habit.pauseRanges) ? habit.pauseRanges : [],
    longestStreak: Number(habit.longestStreak) || 0,
    status: ["active", "paused", "archived"].includes(habit.status) ? habit.status : "active",
  };
}

function scheduleForDate(habit, key) {
  let scheduledDays = habit.scheduleHistory[0]?.weekdays || habit.weekdays;
  for (const change of habit.scheduleHistory) if (change.from <= key) scheduledDays = change.weekdays;
  return scheduledDays;
}

function isPausedOn(habit, key) {
  return habit.pauseRanges.some((range) => range.from <= key && (!range.to || key <= range.to));
}

function isScheduled(habit, key) {
  return key >= habit.startDate && !isPausedOn(habit, key) && scheduleForDate(habit, key).includes(dateFromKey(key).getDay());
}

function scheduleLabel(days) {
  if (days.length === 7) return "Every day";
  return days.map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(" · ");
}

function currentStreak(habit) {
  const today = todayKey();
  const cursor = dateFromKey(today);
  let count = 0;
  while (keyFromDate(cursor) >= habit.startDate) {
    const key = keyFromDate(cursor);
    if (isPausedOn(habit, key) || !isScheduled(habit, key)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!habit.completionDates.includes(key)) {
      // Today's habit can still be completed, so it doesn't end the streak yet.
      if (key === today) { cursor.setDate(cursor.getDate() - 1); continue; }
      break;
    }
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function render() {
  const activeGoals = goals.filter((goal) => goal.progress < 100).length;
  document.querySelector("#active-goal-count").textContent = String(activeGoals);
  document.querySelector("#completed-goal-count").textContent = String(goals.length - activeGoals);
  const activeHabits = habits.filter((habit) => habit.status !== "archived");
  const dueHabits = activeHabits.filter((habit) => habit.status === "active" && isScheduled(habit, todayKey()));
  const completedHabits = dueHabits.filter((habit) => habit.completionDates.includes(todayKey())).length;
  document.querySelector("#habits-today-count").textContent = dueHabits.length ? `${completedHabits} of ${dueHabits.length}` : "No habits scheduled";

  activeGoalIndex = Math.min(activeGoalIndex, Math.max(0, goals.length - 1));
  goalList.replaceChildren(...(goals[activeGoalIndex] ? [createGoalCard(goals[activeGoalIndex])] : []));
  goalSliderControls.hidden = goals.length <= 1;
  goalPosition.textContent = goals.length ? `Goal ${activeGoalIndex + 1} of ${goals.length}` : "No goals yet";
  goalPrevious.disabled = activeGoalIndex === 0;
  goalNext.disabled = activeGoalIndex >= goals.length - 1;
  habitList.replaceChildren(...activeHabits.filter((habit) => habit.status !== "archived").map(createHabitRow));
  const archived = habits.filter((habit) => habit.status === "archived");
  const archivedList = document.querySelector("#archived-habit-list");
  archivedList.replaceChildren(...archived.map(createHabitRow));
  document.querySelector("#archived-habits").hidden = archived.length === 0;
  const noGoals = goals.length === 0;
  const noHabits = activeHabits.length === 0;
  goalList.hidden = noGoals;
  document.querySelector("#grow-goal-slider").hidden = noGoals;
  habitList.hidden = noHabits;
  document.querySelector("#goals-empty").hidden = !noGoals;
  document.querySelector("#habits-empty").hidden = !noHabits;
}

function openForm(type, item = null) {
  formType = type;
  editingId = item?.id ?? null;
  form.reset();
  const isGoal = type === "goal";
  dateInput.min = item?.targetDate && item.targetDate < todayKey() ? item.targetDate : todayKey();
  goalFields.hidden = !isGoal;
  habitFields.hidden = isGoal;
  descriptionLabel.hidden = false;
  descriptionLabel.replaceChildren(document.createTextNode("Description "));
  const optional = document.createElement("span");
  optional.textContent = "(optional)";
  descriptionLabel.append(optional);
  formEyebrow.textContent = isGoal ? "A new direction" : "A routine that supports you";
  formTitle.textContent = `${editingId ? "Edit" : isGoal ? "Create a" : "Add a"} ${isGoal ? "goal" : "habit"}`;
  document.querySelector("#grow-name-label").textContent = isGoal ? "Goal title" : "Habit name";
  descriptionInput.placeholder = isGoal ? "What would you like to work toward?" : "Add a little detail if you like";
  submitButton.textContent = editingId ? "Save changes" : isGoal ? "Create goal" : "Save habit";

  if (item) {
    nameInput.value = isGoal ? item.title : item.name;
    descriptionInput.value = item.description || "";
    if (isGoal) {
      dateInput.value = item.targetDate || "";
      progressInput.value = String(item.progress ?? 0);
      progressOutput.value = `${progressInput.value}%`;
    } else {
      const type = item.weekdays.length === 7 ? "daily" : "selected";
      document.querySelector(`input[name="schedule-type"][value="${type}"]`).checked = true;
      weekdayOptions.querySelectorAll('input[name="weekdays"]').forEach((input) => { input.checked = item.weekdays.includes(Number(input.value)); });
    }
  } else {
    progressInput.value = "0";
    progressOutput.value = "0%";
    document.querySelector('input[name="schedule-type"][value="daily"]').checked = true;
    weekdayOptions.querySelectorAll('input[name="weekdays"]').forEach((input) => { input.checked = false; });
  }
  updateScheduleFields();
  dialog.showModal();
  nameInput.focus();
}

document.querySelectorAll('input[name="schedule-type"]').forEach((radio) => radio.addEventListener("change", updateScheduleFields));
function updateScheduleFields() {
  const selected = document.querySelector('input[name="schedule-type"]:checked')?.value === "selected";
  weekdayOptions.hidden = !selected;
  scheduleHint.textContent = selected ? "Choose at least one day. Schedule changes begin tomorrow." : "This habit is expected every day.";
}

document.querySelectorAll('[data-open-form="goal"]').forEach((button) => button.addEventListener("click", () => openForm("goal")));
document.querySelectorAll('[data-open-form="habit"]').forEach((button) => button.addEventListener("click", () => openForm("habit")));
goalPrevious.addEventListener("click", () => {
  if (activeGoalIndex > 0) {
    activeGoalIndex -= 1;
    render();
    animateGoalSlide("previous");
  }
});
goalNext.addEventListener("click", () => {
  if (activeGoalIndex < goals.length - 1) {
    activeGoalIndex += 1;
    render();
    animateGoalSlide("next");
  }
});

function animateGoalSlide(direction) {
  const card = goalList.firstElementChild;
  if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const offset = direction === "next" ? "2.25rem" : "-2.25rem";
  card.animate(
    [
      { transform: `translateX(${offset})`, opacity: 0.45 },
      { transform: "translateX(0)", opacity: 1 },
    ],
    { duration: 300, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
  );
}
progressInput.addEventListener("input", () => { progressOutput.value = `${progressInput.value}%`; });
document.querySelector("#grow-dialog-close").addEventListener("click", () => dialog.close());
document.querySelector("#grow-cancel").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  const description = descriptionInput.value.trim();
  if (formType === "goal") {
    const existingGoal = goals.find((goal) => goal.id === editingId);
    const unchangedExistingDate = existingGoal?.targetDate && existingGoal.targetDate === dateInput.value;
    if (dateInput.value && dateInput.value < todayKey() && !unchangedExistingDate) {
      dateInput.setCustomValidity("Choose today or a future date.");
      dateInput.reportValidity();
      return;
    }
    dateInput.setCustomValidity("");
    const goal = { id: editingId || crypto.randomUUID(), title: name, description, progress: Number(progressInput.value), targetDate: dateInput.value, sample: false };
    if (editingId) {
      goals = goals.map((item) => item.id === editingId ? goal : item);
    } else {
      goals = [...goals, goal];
      activeGoalIndex = goals.length - 1;
    }
  } else {
    const previous = habits.find((item) => item.id === editingId);
    const selected = document.querySelector('input[name="schedule-type"]:checked')?.value === "selected";
    const weekdays = selected ? [...weekdayOptions.querySelectorAll('input[name="weekdays"]:checked')].map((input) => Number(input.value)) : [0, 1, 2, 3, 4, 5, 6];
    if (selected && weekdays.length === 0) {
      scheduleHint.textContent = "Choose at least one weekday.";
      weekdayOptions.querySelector("input").focus();
      return;
    }
    const changed = previous && weekdays.join(",") !== previous.weekdays.join(",");
    const scheduleHistory = previous ? [...previous.scheduleHistory] : [];
    if (!previous || changed) scheduleHistory.push({ from: previous ? tomorrowKey() : todayKey(), weekdays });
    const habit = normalizeHabit({
      ...(previous || {}), id: editingId || crypto.randomUUID(), name, description, weekdays,
      schedule: weekdays.length === 7 ? "Daily" : "Selected days",
      startDate: previous?.startDate || todayKey(), completionDates: previous?.completionDates || [],
      scheduleHistory, pauseRanges: previous?.pauseRanges || [], status: previous?.status || "active", sample: false,
    });
    habits = editingId ? habits.map((item) => item.id === editingId ? habit : item) : [...habits, habit];
  }
  saveItems();
  render();
  dialog.close();
});

function handleCardAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "edit-goal") openForm("goal", goals.find((goal) => goal.id === id));
  if (action === "edit-habit") openForm("habit", habits.find((habit) => habit.id === id));
  if (action === "delete-goal" && window.confirm("Delete this goal?")) {
    goals = goals.filter((goal) => goal.id !== id);
    activeGoalIndex = Math.min(activeGoalIndex, Math.max(0, goals.length - 1));
  }
  if (action === "delete-habit" && window.confirm("Delete this habit and its completion history?")) habits = habits.filter((habit) => habit.id !== id);
  if (action === "pause-habit") habits = habits.map((habit) => habit.id === id ? { ...habit, status: "paused", pauseRanges: [...habit.pauseRanges, { from: tomorrowKey(), to: "" }] } : habit);
  if (action === "resume-habit") habits = habits.map((habit) => habit.id === id ? { ...habit, status: "active", pauseRanges: habit.pauseRanges.map((range) => !range.to ? { ...range, to: yesterdayKey() } : range) } : habit);
  if (action === "archive-habit") habits = habits.map((habit) => habit.id === id ? { ...habit, status: "archived", pauseRanges: [...habit.pauseRanges, { from: tomorrowKey(), to: "" }] } : habit);
  if (action === "restore-habit") habits = habits.map((habit) => habit.id === id ? { ...habit, status: "active", pauseRanges: habit.pauseRanges.map((range) => !range.to ? { ...range, to: yesterdayKey() } : range) } : habit);
  if (action === "toggle-habit") {
    habits = habits.map((habit) => {
      if (habit.id !== id || habit.status !== "active" || !isScheduled(habit, todayKey())) return habit;
      const dates = habit.completionDates.includes(todayKey())
        ? habit.completionDates.filter((date) => date !== todayKey())
        : [...habit.completionDates, todayKey()];
      const updated = { ...habit, completionDates: dates, completedOn: dates.includes(todayKey()) ? todayKey() : "" };
      return { ...updated, sample: false, longestStreak: Math.max(habit.longestStreak, currentStreak(updated)) };
    });
  }
  saveItems();
  render();
}

goalList.addEventListener("click", handleCardAction);
habitList.addEventListener("click", handleCardAction);
document.querySelector("#archived-habit-list").addEventListener("click", handleCardAction);
render();

const growQuery = new URLSearchParams(window.location.search);
const quickAdd = growQuery.get("quickAdd");
const openGoalForm = growQuery.get("newGoal") === "1" || quickAdd === "goal";
if (openGoalForm || quickAdd === "habit") {
  window.history.replaceState(null, "", window.location.pathname);
  openForm(quickAdd === "habit" ? "habit" : "goal");
}
