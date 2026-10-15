const STORAGE_KEY = "chunked-insights-reflection-v1";
const PAGE_SIZE = 8;
const searchInput = document.querySelector("#reflections-search");
const list = document.querySelector("#reflections-list");
const count = document.querySelector("#reflections-count");
const empty = document.querySelector("#reflections-empty");
const emptyTitle = document.querySelector("#reflections-empty-title");
const emptyCopy = document.querySelector("#reflections-empty-copy");
const pagination = document.querySelector("#reflections-pagination");
const pageButtons = document.querySelector("#reflections-page-buttons");
const previousButton = document.querySelector("#reflections-previous");
const nextButton = document.querySelector("#reflections-next");
let currentPage = 1;

function loadReflections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    let saved;
    try { saved = JSON.parse(raw); } catch { return [{ text: raw.trim(), createdAt: new Date().toISOString() }].filter((entry) => entry.text); }
    if (Array.isArray(saved)) return saved.map((entry, index) => entry && typeof entry.text === "string" ? { ...entry, id: entry.id || `legacy-${index}-${entry.createdAt || entry.text.length}` } : null).filter(Boolean);
    if (typeof saved === "string" && saved.trim()) return [{ id: "legacy-single-reflection", text: saved.trim(), createdAt: new Date().toISOString() }];
  } catch { /* Show an empty archive if the saved value cannot be read. */ }
  return [];
}

function makeCard(reflection) {
  const card = document.createElement("article");
  card.className = "reflection-card";
  const body = document.createElement("p");
  body.textContent = reflection.text;
  card.append(body);
  const date = new Date(reflection.createdAt || 0);
  const time = document.createElement("time");
  if (!Number.isNaN(date.getTime())) {
    time.dateTime = date.toISOString();
    time.textContent = date.toLocaleDateString(undefined, { dateStyle: "long" });
  } else {
    time.textContent = "Saved reflection";
  }
  const actions = document.createElement("div");
  actions.className = "reflection-card__actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "button button--secondary";
  edit.textContent = "Edit";
  edit.addEventListener("click", () => showEditor(card, reflection));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "button button--secondary";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => {
    if (!window.confirm("Delete this reflection? This cannot be undone.")) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loadReflections().filter((entry) => entry.id !== reflection.id)));
      render();
    } catch {
      count.textContent = "This browser could not delete the reflection.";
    }
  });
  actions.append(edit, remove);
  card.append(time, actions);
  return card;
}

function showEditor(card, reflection) {
  card.replaceChildren();
  const form = document.createElement("form");
  form.className = "reflection-edit-form";
  const label = document.createElement("label");
  label.textContent = "Edit reflection";
  const input = document.createElement("textarea");
  input.maxLength = 500;
  input.required = true;
  input.value = reflection.text;
  label.append(input);
  const status = document.createElement("span");
  status.className = "reflection-edit-form__status";
  status.setAttribute("role", "status");
  const actions = document.createElement("div");
  actions.className = "reflection-card__actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "button button--primary";
  save.textContent = "Save changes";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "button button--secondary";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", render);
  actions.append(save, cancel);
  form.append(label, status, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    try {
      const reflections = loadReflections();
      const target = reflections.find((entry) => entry.id === reflection.id);
      if (target) target.text = text;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
      render();
    } catch {
      status.textContent = "This browser could not save your changes.";
    }
  });
  card.append(form);
  input.focus();
}

function makePageButton(page, current) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `goals-pagination__button goals-pagination__number${page === current ? " is-current" : ""}`;
  button.textContent = String(page);
  button.setAttribute("aria-label", `Page ${page}`);
  if (page === current) button.setAttribute("aria-current", "page");
  button.addEventListener("click", () => { currentPage = page; render(); });
  return button;
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const reflections = loadReflections().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const filtered = reflections.filter((reflection) => reflection.text.toLocaleLowerCase().includes(query));
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, Math.max(pageCount, 1));
  const start = (currentPage - 1) * PAGE_SIZE;
  list.replaceChildren(...filtered.slice(start, start + PAGE_SIZE).map(makeCard));
  count.textContent = query ? `${filtered.length} of ${reflections.length} reflections` : `${reflections.length} ${reflections.length === 1 ? "reflection" : "reflections"}`;
  empty.hidden = filtered.length > 0;
  emptyTitle.textContent = reflections.length && query ? "No matching reflections." : "No reflections yet.";
  emptyCopy.textContent = reflections.length && query ? "Try another search to find what you wrote." : "When you save a reflection in Insights, it will appear here.";
  pagination.hidden = pageCount <= 1;
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= pageCount;
  pageButtons.replaceChildren(...Array.from({ length: pageCount }, (_, index) => makePageButton(index + 1, currentPage)));
}

searchInput.addEventListener("input", () => { currentPage = 1; render(); });
previousButton.addEventListener("click", () => { currentPage -= 1; render(); });
nextButton.addEventListener("click", () => { currentPage += 1; render(); });
render();
