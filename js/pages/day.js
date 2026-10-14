import { CHUNKS } from "../utils/chunks.js";

const PERIODS = [
  { id: "fajr", label: "Fajr", range: "5:00 AM – 11:30 AM", state: "Finished" },
  { id: "dhuhr", label: "Dhuhr", range: "11:30 AM – 3:30 PM", state: "Current sample" },
  { id: "asr", label: "Asr", range: "3:30 PM – 6:00 PM", state: "Upcoming" },
  { id: "maghrib", label: "Maghrib", range: "6:00 PM – 8:30 PM", state: "Upcoming" },
  { id: "isha", label: "Isha", range: "8:30 PM – 5:00 AM", state: "Upcoming" },
];

const STORAGE_KEY = "chunked-day-tasks-v1";
const SAMPLE_TASKS = [
  ...CHUNKS.dhuhr.tasks.map((title, index) => ({
    id: `sample-dhuhr-${index + 1}`,
    title,
    period: "dhuhr",
    duration: null,
    priority: "",
    completed: false,
  })),
  { id: "sample-break", title: "Take a short break", period: "unscheduled", duration: 10, priority: "", completed: false },
];

const dateDisplay = document.querySelector("#day-date");
const periodButtons = document.querySelectorAll(".day-period[data-period]");
const selectedTasksTitle = document.querySelector("#day-tasks-title");
const periodTaskList = document.querySelector("#day-task-list");
const taskSlider = document.querySelector("#day-task-slider");
const taskSliderControls = document.querySelector("#day-task-slider-controls");
const previousTaskCard = document.querySelector("#day-task-card-previous");
const nextTaskCard = document.querySelector("#day-task-card-next");
const taskCardPosition = document.querySelector("#day-task-card-position");
const unscheduledTaskList = document.querySelector("#unscheduled-task-list");
const periodEmptyState = document.querySelector("#day-period-empty");
const unscheduledEmptyState = document.querySelector("#unscheduled-empty");
const currentTaskCount = document.querySelector("#current-period-task-count");
const currentProgress = document.querySelector("#current-period-progress");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskTitleInput = document.querySelector("#task-title");
const taskPeriodInput = document.querySelector("#task-period");
const taskDurationInput = document.querySelector("#task-duration");
const taskPriorityInput = document.querySelector("#task-priority");
const dialogTitle = document.querySelector("#task-dialog-title");
const submitTaskButton = taskForm.querySelector("[type='submit']");

let selectedPeriod = "dhuhr";
let editingTaskId = null;
const tasksPerCard = 3;
let activeTaskCard = 0;

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks === null) return SAMPLE_TASKS.map((task) => ({ ...task }));

    const parsedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(parsedTasks)) return SAMPLE_TASKS.map((task) => ({ ...task }));

    const validTasks = parsedTasks.filter((task) => (
      task
      && typeof task.id === "string"
      && typeof task.title === "string"
      && (task.period === "unscheduled" || PERIODS.some((period) => period.id === task.period))
    )).map((task) => ({
      id: task.id,
      title: task.title,
      period: task.period,
      duration: Number.isFinite(task.duration) ? task.duration : null,
      priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "",
      completed: Boolean(task.completed),
    }));

    const oldSampleIds = ["sample-js-events", "sample-academy-exercise"];
    const oldSamplesAreUnedited = oldSampleIds.every((id, index) => {
      const oldTask = validTasks.find((task) => task.id === id);
      const expectedTitle = index === 0 ? "Review JavaScript events" : "Finish one Academy exercise";
      return oldTask?.title === expectedTitle && oldTask.period === "dhuhr";
    });

    if (oldSamplesAreUnedited) {
      return [
        ...SAMPLE_TASKS.filter((task) => task.period === "dhuhr"),
        ...validTasks.filter((task) => !oldSampleIds.includes(task.id)),
      ];
    }

    return validTasks;
  } catch {
    return SAMPLE_TASKS.map((task) => ({ ...task }));
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // The page remains usable for this session if browser storage is unavailable.
  }
}

function getPeriod(periodId) {
  return PERIODS.find((period) => period.id === periodId);
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderTask(task, isUnscheduled = false) {
  const item = makeElement("li", `day-task${task.completed ? " is-complete" : ""}`);
  item.dataset.taskId = task.id;

  const main = makeElement("div", "day-task__main");
  const checkbox = document.createElement("input");
  checkbox.className = "day-task__checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.dataset.action = "complete";
  checkbox.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`);

  const copy = makeElement("div", "day-task__copy");
  const title = makeElement("span", "day-task__title", task.title);
  copy.append(title);

  const metadata = [];
  if (task.duration) metadata.push(`${task.duration} min`);
  if (task.priority) {
    const priority = makeElement("span", "day-task__priority", `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`);
    metadata.push(priority);
  }
  if (metadata.length) {
    const meta = makeElement("span", "day-task__meta");
    metadata.forEach((value) => {
      if (typeof value === "string") meta.append(makeElement("span", "", value));
      else meta.append(value);
    });
    copy.append(meta);
  }

  main.append(checkbox, copy);
  item.append(main);

  const actions = makeElement("div", "day-task__actions");
  const editButton = makeElement("button", "day-task__action", "Edit");
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.setAttribute("aria-label", `Edit task: ${task.title}`);

  const deleteButton = makeElement("button", "day-task__action", "Delete");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
  actions.append(editButton, deleteButton);
  item.append(actions);

  if (isUnscheduled) {
    const assignSelect = document.createElement("select");
    assignSelect.className = "day-task__assign";
    assignSelect.dataset.action = "assign";
    assignSelect.setAttribute("aria-label", `Assign ${task.title} to a period`);
    const prompt = new Option("Assign to a period…", "unscheduled");
    assignSelect.add(prompt);
    PERIODS.forEach((period) => assignSelect.add(new Option(period.label, period.id)));
    item.append(assignSelect);
  }

  return item;
}

function getCounts(periodId) {
  const periodTasks = tasks.filter((task) => task.period === periodId);
  return {
    total: periodTasks.length,
    completed: periodTasks.filter((task) => task.completed).length,
  };
}

function renderPeriods() {
  periodButtons.forEach((button) => {
    const period = getPeriod(button.dataset.period);
    const counts = getCounts(period.id);
    const isSelected = period.id === selectedPeriod;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("is-current", isSelected);
    button.querySelector(".day-period__state").textContent = period.state;
    button.querySelector("small").textContent = `${counts.completed} of ${counts.total} complete`;
  });
}

function renderSelectedPeriod() {
  const period = getPeriod(selectedPeriod);
  const periodTasks = tasks.filter((task) => task.period === selectedPeriod);
  const taskCardCount = Math.max(1, Math.ceil(periodTasks.length / tasksPerCard));
  activeTaskCard = Math.min(activeTaskCard, taskCardCount - 1);
  const firstTaskIndex = activeTaskCard * tasksPerCard;
  const visibleTasks = periodTasks.slice(firstTaskIndex, firstTaskIndex + tasksPerCard);
  selectedTasksTitle.textContent = `Tasks for ${period.label}`;
  periodTaskList.replaceChildren(...visibleTasks.map((task) => renderTask(task)));
  periodTaskList.setAttribute("aria-label", `Tasks on card ${activeTaskCard + 1} of ${taskCardCount} for ${period.label}`);
  periodTaskList.hidden = periodTasks.length === 0;
  taskSlider.hidden = periodTasks.length === 0;
  taskSliderControls.hidden = periodTasks.length <= tasksPerCard;
  taskCardPosition.textContent = `Card ${activeTaskCard + 1} of ${taskCardCount}`;
  previousTaskCard.disabled = activeTaskCard === 0;
  nextTaskCard.disabled = activeTaskCard === taskCardCount - 1;
  periodEmptyState.hidden = periodTasks.length > 0;
}

function moveTaskCard(direction) {
  const periodTaskCount = tasks.filter((task) => task.period === selectedPeriod).length;
  const taskCardCount = Math.max(1, Math.ceil(periodTaskCount / tasksPerCard));
  activeTaskCard = Math.min(taskCardCount - 1, Math.max(0, activeTaskCard + direction));
  renderSelectedPeriod();
  renderCurrentChunkSummary();
}

function renderUnscheduledTasks() {
  const unscheduledTasks = tasks.filter((task) => task.period === "unscheduled");
  unscheduledTaskList.replaceChildren(...unscheduledTasks.map((task) => renderTask(task, true)));
  unscheduledTaskList.hidden = unscheduledTasks.length === 0;
  unscheduledEmptyState.hidden = unscheduledTasks.length > 0;
}

function renderCurrentChunkSummary() {
  const counts = getCounts("dhuhr");
  const currentCardIndex = selectedPeriod === "dhuhr" ? activeTaskCard : 0;
  const tasksShown = Math.min(counts.total, (currentCardIndex + 1) * tasksPerCard);
  const percentShown = counts.total === 0 ? 0 : Math.round((tasksShown / counts.total) * 100);
  currentTaskCount.textContent = `${tasksShown} of ${counts.total}`;
  currentProgress.setAttribute("aria-valuenow", String(tasksShown));
  currentProgress.setAttribute("aria-valuemax", String(Math.max(1, counts.total)));
  currentProgress.setAttribute("aria-valuetext", `${tasksShown} of ${counts.total} tasks shown`);
  currentProgress.querySelector("span").style.width = `${percentShown}%`;
}

function render() {
  renderPeriods();
  renderSelectedPeriod();
  renderUnscheduledTasks();
  renderCurrentChunkSummary();
}

function openTaskDialog(periodId = selectedPeriod, task = null) {
  editingTaskId = task?.id ?? null;
  taskForm.reset();
  taskTitleInput.setCustomValidity("");
  taskPeriodInput.value = task?.period ?? periodId;
  taskTitleInput.value = task?.title ?? "";
  taskDurationInput.value = task?.duration ?? "";
  taskPriorityInput.value = task?.priority ?? "";
  dialogTitle.textContent = task ? "Edit task" : "Add a task";
  submitTaskButton.textContent = task ? "Save changes" : "Save task";
  taskDialog.showModal();
  taskTitleInput.focus();
}

function closeTaskDialog() {
  taskDialog.close();
  taskForm.reset();
  editingTaskId = null;
}

function updateTask(taskId, changes) {
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, ...changes } : task));
  saveTasks();
  render();
}

function makeTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

dateDisplay.textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

document.querySelectorAll("#add-task-open, #add-period-task-open, #add-period-empty-open").forEach((button) => {
  button.addEventListener("click", () => openTaskDialog(selectedPeriod));
});

document.querySelector("#add-unscheduled-task-open").addEventListener("click", () => openTaskDialog("unscheduled"));
document.querySelector("#task-dialog-close").addEventListener("click", closeTaskDialog);
document.querySelector("#task-cancel").addEventListener("click", closeTaskDialog);

taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) closeTaskDialog();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.setCustomValidity("Please enter a task title.");
    taskTitleInput.reportValidity();
    return;
  }

  const duration = taskDurationInput.value ? Number(taskDurationInput.value) : null;
  const taskData = {
    title,
    period: taskPeriodInput.value,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    priority: taskPriorityInput.value,
  };

  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
  } else {
    tasks.push({ id: makeTaskId(), ...taskData, completed: false });
    saveTasks();
    render();
  }

  closeTaskDialog();
});

taskTitleInput.addEventListener("input", () => taskTitleInput.setCustomValidity(""));

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period;
    activeTaskCard = 0;
    render();
  });
});

previousTaskCard.addEventListener("click", () => moveTaskCard(-1));
nextTaskCard.addEventListener("click", () => moveTaskCard(1));

let swipeStart = null;
taskSlider.addEventListener("pointerdown", (event) => {
  swipeStart = event.target.closest("button, input, select") ? null : [event.clientX, event.clientY];
});
taskSlider.addEventListener("pointerup", (event) => {
  if (!swipeStart) return;
  const [startX, startY] = swipeStart;
  const horizontalDistance = event.clientX - startX;
  const verticalDistance = event.clientY - startY;
  swipeStart = null;
  if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) < Math.abs(verticalDistance)) return;
  event.preventDefault();
  moveTaskCard(horizontalDistance < 0 ? 1 : -1);
});
taskSlider.addEventListener("pointercancel", () => { swipeStart = null; });

function handleTaskClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const taskItem = actionButton.closest("[data-task-id]");
  if (!taskItem) return;
  const task = tasks.find((item) => item.id === taskItem.dataset.taskId);
  if (!task) return;

  if (actionButton.dataset.action === "edit") openTaskDialog(task.period, task);
  if (actionButton.dataset.action === "delete") {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
  }
}

function handleTaskChange(event) {
  const control = event.target.closest("[data-action]");
  const taskItem = control?.closest("[data-task-id]");
  if (!control || !taskItem) return;
  const task = tasks.find((item) => item.id === taskItem.dataset.taskId);
  if (!task) return;

  if (control.dataset.action === "complete") updateTask(task.id, { completed: control.checked });
  if (control.dataset.action === "assign" && control.value !== "unscheduled") {
    updateTask(task.id, { period: control.value });
  }
}

periodTaskList.addEventListener("click", handleTaskClick);
unscheduledTaskList.addEventListener("click", handleTaskClick);
periodTaskList.addEventListener("change", handleTaskChange);
unscheduledTaskList.addEventListener("change", handleTaskChange);

render();
