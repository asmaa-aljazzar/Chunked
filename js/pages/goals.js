const STORAGE_KEY = "chunked-grow-goals-v1";
const PAGE_SIZE = 6;
const sampleGoals = [
  { id: "goal-developer", title: "Become a stronger full-stack developer", description: "Improve my practical development skills through projects.", progress: 35, targetDate: "" },
  { id: "goal-english", title: "Improve my English", description: "Become more confident communicating in English.", progress: 20, targetDate: "" },
  { id: "goal-drawing", title: "Build a consistent drawing practice", description: "Practice drawing through small, regular exercises.", progress: 15, targetDate: "" },
];

const grid = document.querySelector("#goals-grid");
const searchInput = document.querySelector("#goals-search-input");
const resultsCount = document.querySelector("#goals-results-count");
const emptyState = document.querySelector("#goals-empty");
const emptyTitle = document.querySelector("#goals-empty-title");
const emptyCopy = document.querySelector("#goals-empty-copy");
const pagination = document.querySelector("#goals-pagination");
const pageButtons = document.querySelector("#goals-page-buttons");
const previousButton = document.querySelector("#goals-previous");
const nextButton = document.querySelector("#goals-next");

let currentPage = 1;
let goals = loadGoals();

function loadGoals() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? sampleGoals.map((goal) => ({ ...goal })) : JSON.parse(stored);
  } catch {
    return sampleGoals.map((goal) => ({ ...goal }));
  }
}

function createGoalCard(goal) {
  const card = document.createElement("article");
  card.className = "grow-goal-card goals-grid__card";

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

  card.append(top, title, description, progressLabel, progress, meta);
  return card;
}

function getFilteredGoals() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  if (!query) return goals;
  return goals.filter((goal) => `${goal.title} ${goal.description || ""}`.toLocaleLowerCase().includes(query));
}

function createPageButton(page) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "goals-pagination__button goals-pagination__number";
  button.textContent = String(page);
  button.setAttribute("aria-label", `Page ${page}`);
  button.setAttribute("aria-current", page === currentPage ? "page" : "false");
  button.classList.toggle("is-current", page === currentPage);
  button.addEventListener("click", () => {
    currentPage = page;
    render();
  });
  return button;
}

function render() {
  const filteredGoals = getFilteredGoals();
  const pageCount = Math.ceil(filteredGoals.length / PAGE_SIZE);
  currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleGoals = filteredGoals.slice(start, start + PAGE_SIZE);

  grid.replaceChildren(...visibleGoals.map(createGoalCard));
  const hasResults = filteredGoals.length > 0;
  grid.hidden = !hasResults;
  emptyState.hidden = hasResults;
  if (!hasResults) {
    const hasQuery = searchInput.value.trim().length > 0;
    emptyTitle.textContent = hasQuery ? "No goals found." : "No goals yet.";
    emptyCopy.textContent = hasQuery ? "Try another search, or clear the search to see all your goals." : "Create a goal in GROW and it will appear here.";
    resultsCount.textContent = "0 goals";
  } else {
    resultsCount.textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filteredGoals.length)} of ${filteredGoals.length} ${filteredGoals.length === 1 ? "goal" : "goals"}`;
  }

  pagination.hidden = pageCount <= 1;
  pageButtons.replaceChildren(...Array.from({ length: pageCount }, (_, index) => createPageButton(index + 1)));
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= pageCount;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});

previousButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    render();
  }
});

nextButton.addEventListener("click", () => {
  const pageCount = Math.ceil(getFilteredGoals().length / PAGE_SIZE);
  if (currentPage < pageCount) {
    currentPage += 1;
    render();
  }
});

render();
