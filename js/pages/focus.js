const STATE_KEY = "chunked-focus-state-v1";
const GOALS_KEY = "chunked-grow-goals-v1";
const sampleGoals = [
  { id: "goal-developer", title: "Become a stronger full-stack developer", description: "Improve my practical development skills through projects.", sample: true },
  { id: "goal-english", title: "Improve my English", description: "Become more confident communicating in English.", sample: true },
  { id: "goal-drawing", title: "Build a consistent drawing practice", description: "Practice drawing through small, regular exercises.", sample: true },
];
const statusCopy = {
  ready: { label: "Ready", message: "Things look manageable. You can take the next step when you're ready." },
  prepare: { label: "Needs preparation", message: "A little preparation may make the next step easier." },
  blocked: { label: "Blocked", message: "Something may be getting in the way. Identify the blocker before deciding what to do next." },
};
const emptyState = { selectedId: "", independent: [], details: {} };
const currentTitle = document.querySelector("#current-focus-title");
const currentDescription = document.querySelector("#current-focus-description");
const currentLinked = document.querySelector("#current-focus-linked");
const currentReadiness = document.querySelector("#current-focus-readiness");
const selectedPanel = document.querySelector("#focus-selected");
const emptyPanel = document.querySelector("#focus-empty");
const optionsSection = document.querySelector("#focus-options-section");
const optionsList = document.querySelector("#focus-options-list");
const noOptions = document.querySelector("#focus-no-options");
const workspace = document.querySelector("#focus-workspace");
const demoLabel = document.querySelector("#focus-demo-label");
const createForm = document.querySelector("#focus-create-form");
const storageNote = document.querySelector("#focus-storage-note");
const explanationInput = document.querySelector("#readiness-explanation");
const nextStepInput = document.querySelector("#next-step-input");
const nextStepDuration = document.querySelector("#next-step-duration");
const readinessMessage = document.querySelector("#readiness-message");
const nextStepStatus = document.querySelector("#next-step-status");
const readinessNoteStatus = document.querySelector("#readiness-note-status");
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    if (saved && typeof saved === "object") return { ...emptyState, ...saved, independent: Array.isArray(saved.independent) ? saved.independent : [], details: saved.details && typeof saved.details === "object" ? saved.details : {} };
  } catch { /* Start with a fresh local state if saved data is unavailable. */ }
  return { ...emptyState, independent: [], details: {} };
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    storageNote.textContent = "Saved on this device.";
    return true;
  } catch {
    storageNote.textContent = "This browser could not save your focus changes.";
    return false;
  }
}

function getGoals() {
  try {
    const stored = localStorage.getItem(GOALS_KEY);
    if (stored === null) return sampleGoals;
    const goals = JSON.parse(stored);
    return Array.isArray(goals) ? goals.filter((goal) => goal && goal.title).map((goal) => ({ ...goal, type: "goal", focusId: `goal:${goal.id}` })) : [];
  } catch {
    return sampleGoals;
  }
}

function getOptions() {
  const goals = getGoals().map((goal) => ({ ...goal, type: "goal", focusId: goal.focusId || `goal:${goal.id}` }));
  const independent = state.independent.map((focus) => ({ ...focus, type: "independent", focusId: `independent:${focus.id}` }));
  return [...goals, ...independent];
}

function getSelected() {
  return getOptions().find((focus) => focus.focusId === state.selectedId) || null;
}

function getDetails(focusId = state.selectedId) {
  if (!state.details[focusId]) state.details[focusId] = { readiness: "", explanation: "", nextStep: "", duration: "" };
  return state.details[focusId];
}

function renderOptions() {
  const options = getOptions();
  optionsList.replaceChildren();
  noOptions.hidden = options.length > 0;
  options.forEach((focus) => {
    const card = document.createElement("article");
    card.className = `focus-option${state.selectedId === focus.focusId ? " is-selected" : ""}`;
    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "focus-option__choose";
    choose.setAttribute("aria-pressed", String(state.selectedId === focus.focusId));
    const title = document.createElement("strong");
    title.textContent = focus.title;
    const description = document.createElement("span");
    description.className = "focus-option__description";
    description.textContent = focus.description || (focus.type === "goal" ? "A goal you can shape as you go." : "An independent priority.");
    const type = document.createElement("span");
    type.className = "focus-option__type";
    type.textContent = focus.type === "goal" ? "GROW goal" : "Independent focus";
    choose.append(title, description, type);
    choose.addEventListener("click", () => selectFocus(focus.focusId));
    card.append(choose);
    if (focus.type === "independent") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "focus-option__remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove focus: ${focus.title}`);
      remove.addEventListener("click", () => removeFocus(focus));
      card.append(remove);
    }
    optionsList.append(card);
  });
}

function renderSelected() {
  const selected = getSelected();
  const hasFocus = Boolean(selected);
  emptyPanel.hidden = hasFocus;
  selectedPanel.hidden = !hasFocus;
  workspace.hidden = !hasFocus;
  demoLabel.hidden = !selected?.sample;
  if (!selected) return;

  currentTitle.textContent = selected.title;
  currentDescription.textContent = selected.description || "A priority you can shape one step at a time.";
  currentLinked.hidden = selected.type !== "goal";
  currentLinked.textContent = selected.type === "goal" ? "Linked to a GROW goal" : "";
  const details = getDetails();
  const readiness = statusCopy[details.readiness];
  currentReadiness.textContent = readiness ? `Readiness: ${readiness.label}` : "Readiness not set yet";
  document.querySelectorAll('input[name="readiness"]').forEach((input) => { input.checked = input.value === details.readiness; });
  readinessMessage.textContent = readiness?.message || "Choose the status that feels accurate to you. Nothing is selected for you.";
  explanationInput.value = details.explanation || "";
  nextStepInput.value = details.nextStep || "";
  nextStepDuration.value = details.duration || "";
  nextStepStatus.textContent = details.nextStepSaved ? "Saved as your next step." : "";
  readinessNoteStatus.textContent = details.explanationSaved ? "Your note is saved." : "";
}

function render() {
  renderOptions();
  renderSelected();
}

function selectFocus(focusId) {
  state.selectedId = focusId;
  saveState();
  render();
}

function removeFocus(focus) {
  state.independent = state.independent.filter((item) => item.id !== focus.id);
  delete state.details[focus.focusId];
  if (state.selectedId === focus.focusId) state.selectedId = "";
  saveState();
  render();
}

function updateSelectedDetail(key, value) {
  if (!state.selectedId) return;
  getDetails()[key] = value;
  saveState();
}

function updateNextStepDraft(key, value) {
  if (!state.selectedId) return;
  const details = getDetails();
  details[key] = value;
  details.nextStepSaved = false;
  saveState();
  nextStepStatus.textContent = "Save when this feels like the right next step.";
}

function updateExplanationDraft(value) {
  if (!state.selectedId) return;
  const details = getDetails();
  details.explanation = value;
  details.explanationSaved = false;
  saveState();
  readinessNoteStatus.textContent = "Save your note when it feels ready.";
}

document.querySelector("#choose-focus-button").addEventListener("click", () => {
  document.querySelector("#focus-options-heading").focus?.();
  optionsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#change-focus-button").addEventListener("click", () => optionsSection.scrollIntoView({ behavior: "smooth", block: "start" }));
document.querySelector("#add-focus-button").addEventListener("click", () => {
  createForm.hidden = false;
  createForm.querySelector('[name="title"]').focus();
});
document.querySelector("#cancel-create-focus").addEventListener("click", () => { createForm.reset(); createForm.hidden = true; });
createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(createForm);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const id = globalThis.crypto?.randomUUID?.() || `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const focus = { id, title, description: String(formData.get("description") || "").trim() };
  state.independent.push(focus);
  state.selectedId = `independent:${id}`;
  createForm.reset();
  createForm.hidden = true;
  saveState();
  render();
});

document.querySelectorAll('input[name="readiness"]').forEach((input) => input.addEventListener("change", () => {
  updateSelectedDetail("readiness", input.value);
  renderSelected();
}));
explanationInput.addEventListener("input", () => updateExplanationDraft(explanationInput.value));
document.querySelector("#save-readiness-note").addEventListener("click", () => {
  if (!state.selectedId) return;
  const details = getDetails();
  details.explanation = explanationInput.value.trim();
  details.explanationSaved = true;
  if (saveState()) readinessNoteStatus.textContent = details.explanation ? "Your note is saved." : "Your note is cleared.";
});
nextStepInput.addEventListener("input", () => updateNextStepDraft("nextStep", nextStepInput.value));
nextStepDuration.addEventListener("input", () => updateNextStepDraft("duration", nextStepDuration.value));
document.querySelector("#save-next-step").addEventListener("click", () => {
  if (!state.selectedId) return;
  const details = getDetails();
  details.nextStep = nextStepInput.value.trim();
  details.duration = nextStepDuration.value.trim();
  if (!details.nextStep) {
    nextStepStatus.textContent = "Write a next step before saving.";
    nextStepInput.focus();
    return;
  }
  details.nextStepSaved = true;
  if (saveState()) nextStepStatus.textContent = "Saved as your next step.";
});

window.addEventListener("storage", (event) => {
  if (event.key === GOALS_KEY) render();
});

render();
