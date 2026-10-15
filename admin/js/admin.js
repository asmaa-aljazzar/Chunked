import { applyTheme, getActiveMode, getActiveThemeKey } from "../../js/utils/theme.js";

const STORAGE_KEY = "chunked-admin-templates-demo-v1";
const CATEGORY_STORAGE_KEY = "chunked-admin-categories-demo-v1";
const ANNOUNCEMENT_STORAGE_KEY = "chunked-admin-announcements-demo-v1";
const PAGE_SIZE = 7;
const platformTemplateBaseline = { published: 48, draft: 12, review: 6, archived: 4 };
const categories = ["DAY", "GROW", "FOCUS", "Habits", "Study", "Work", "Self-care"];
const sampleTemplates = [
  { id: "demo-calm-day", title: "A Calm Day Plan", description: "Shape a manageable day with thoughtful priorities and room to pause.", category: "DAY", access: "free", status: "published", price: 0, image: "", creator: "Chunked team", updatedAt: "2026-10-15", contents: "Three daily priorities\nGentle planning prompts\nEnd-of-day reflection" },
  { id: "demo-study-week", title: "Study Week", description: "A flexible study rhythm with focused sessions, review, and rest built in.", category: "Study", access: "free", status: "published", price: 0, image: "", creator: "Chunked team", updatedAt: "2026-10-14", contents: "Weekly study plan\nFocused sessions\nReview and rest" },
  { id: "demo-morning", title: "Gentle Morning Routine", description: "Start with a few easy habits that help the morning feel more settled.", category: "Habits", access: "free", status: "published", price: 0, image: "", creator: "Maya Lee", updatedAt: "2026-10-13", contents: "Water\nA little movement\nChoose one priority" },
  { id: "demo-focus-sprint", title: "Quiet Focus Sprint", description: "A printable focus guide for one meaningful task at a time.", category: "FOCUS", access: "premium", status: "published", price: 4.99, image: "", creator: "Chunked team", updatedAt: "2026-10-12", contents: "Choose one task\nSet a focus window\nRecord a small win" },
  { id: "demo-work-reset", title: "Workday Reset", description: "A practical reset for planning priorities and clearing mental clutter.", category: "Work", access: "premium", status: "review", price: 5.99, image: "", creator: "Sam Rivera", updatedAt: "2026-10-11", contents: "Review open work\nPick three priorities\nPlan a stopping point" },
  { id: "demo-self-care", title: "Small Self-care Menu", description: "A gentle menu of simple ways to make a little room for yourself.", category: "Self-care", access: "free", status: "draft", price: 0, image: "", creator: "Alex Morgan", updatedAt: "2026-10-10", contents: "Five-minute reset\nReach out to someone\nTake a quiet break" },
  { id: "demo-grow-map", title: "A Goal in Small Steps", description: "Break a meaningful goal into manageable milestones and next actions.", category: "GROW", access: "premium", status: "review", price: 3.99, image: "", creator: "Chunked team", updatedAt: "2026-10-09", contents: "Define a goal\nChoose milestones\nName the next step" },
  { id: "demo-weekly-habits", title: "Weekly Habit Tracker", description: "A simple weekly page for noticing the habits you want to keep close.", category: "Habits", access: "free", status: "archived", price: 0, image: "", creator: "Alex Morgan", updatedAt: "2026-10-08", contents: "Habit list\nWeek overview\nReflection prompt" },
];

const navButtons = [...document.querySelectorAll("[data-admin-view]")];
const views = [...document.querySelectorAll("[data-view-panel]")];
const templateRows = document.querySelector("#admin-template-rows");
const table = document.querySelector(".admin-table");
const emptyState = document.querySelector("#admin-template-empty");
const pagination = document.querySelector("#admin-template-pagination");
const dialog = document.querySelector("#admin-template-dialog");
const form = document.querySelector("#admin-template-form");
const formStatus = document.querySelector("#admin-template-form-status-message");
const toast = document.querySelector("#admin-toast");
const search = document.querySelector("#admin-template-search");
const categoryFilter = document.querySelector("#admin-template-category");
const accessFilter = document.querySelector("#admin-template-access");
const statusFilter = document.querySelector("#admin-template-status");
const formCategory = document.querySelector("#admin-template-form-category");
const formAccess = document.querySelector("#admin-template-form-access");
const formStatusSelect = document.querySelector("#admin-template-form-status");
const priceInput = document.querySelector("#admin-template-price");
const priceWrap = document.querySelector("#admin-template-price-wrap");
const quickCreateDialog = document.querySelector("#admin-quick-create-dialog");
const quickCreateForm = document.querySelector("#admin-quick-create-form");
const quickCreateName = document.querySelector("#admin-quick-create-name");
const quickCreateDetail = document.querySelector("#admin-quick-create-detail");
const quickCreateStatus = document.querySelector("#admin-quick-create-status");
let quickCreateType = "category";
let templates = loadTemplates();
let currentPage = 1;
let toastTimer;

applyTheme(getActiveThemeKey(), { mode: getActiveMode(), persist: false });

function loadTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) return saved;
  } catch { /* Invalid demo storage falls back to the seed list. */ }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTemplates)); } catch { /* Use the samples for this visit. */ }
  return sampleTemplates.map((item) => ({ ...item }));
}

function persistTemplates() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

function newId() { return globalThis.crypto?.randomUUID?.() || `template-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function dateToday() { return new Date().toISOString().slice(0, 10); }

function readDemoList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function saveDemoList(key, records) {
  try { localStorage.setItem(key, JSON.stringify(records)); return true; }
  catch { return false; }
}

function createTextCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function renderSavedDemoItems() {
  const categoryGrid = document.querySelector("#admin-category-grid");
  readDemoList(CATEGORY_STORAGE_KEY).forEach((item) => {
    const card = document.createElement("article");
    card.className = "admin-panel";
    const icon = document.createElement("span");
    icon.className = "admin-category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const title = document.createElement("h2");
    title.textContent = item.name;
    const description = document.createElement("p");
    description.textContent = item.description;
    const count = document.createElement("strong");
    count.textContent = "0 templates";
    const badgeElement = document.createElement("span");
    badgeElement.className = "admin-badge";
    badgeElement.textContent = "Draft · demo";
    card.append(icon, title, description, count, badgeElement);
    categoryGrid.append(card);
  });

  const announcementRows = document.querySelector("#admin-announcement-rows");
  readDemoList(ANNOUNCEMENT_STORAGE_KEY).forEach((item) => {
    const row = document.createElement("tr");
    const copyCell = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const description = document.createElement("small");
    description.textContent = item.description;
    copyCell.append(title, description);
    const statusCell = document.createElement("td");
    const badgeElement = document.createElement("span");
    badgeElement.className = "admin-badge";
    badgeElement.textContent = "Draft · demo";
    statusCell.append(badgeElement);
    row.append(copyCell, createTextCell(item.audience), statusCell, createTextCell("Not scheduled"), createTextCell("—"));
    announcementRows.prepend(row);
  });
}

function openQuickCreate(type) {
  quickCreateType = type;
  quickCreateForm.reset();
  quickCreateStatus.textContent = "";
  const isCategory = type === "category";
  document.querySelector("#admin-quick-create-eyebrow").textContent = isCategory ? "NEW CATEGORY · DEMO" : "NEW ANNOUNCEMENT · DEMO";
  document.querySelector("#admin-quick-create-title").textContent = isCategory ? "Create a category" : "Draft an announcement";
  document.querySelector("#admin-quick-create-name-label").textContent = isCategory ? "Category name" : "Announcement title";
  document.querySelector("#admin-quick-create-detail-label").textContent = isCategory ? "Description" : "Message";
  quickCreateName.placeholder = isCategory ? "e.g. Wellbeing" : "e.g. A small update for your week";
  quickCreateDetail.placeholder = isCategory ? "What kind of printable templates belong here?" : "Write a short announcement for the selected audience.";
  document.querySelector("#admin-announcement-audience-wrap").hidden = isCategory;
  quickCreateDialog.showModal();
  quickCreateName.focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3400);
}

function switchView(id) {
  const view = views.find((item) => item.dataset.viewPanel === id);
  if (!view) return;
  views.forEach((item) => { item.hidden = item !== view; item.classList.toggle("is-active", item === view); });
  navButtons.forEach((button) => {
    const active = button.classList.contains("admin-nav__link") && button.dataset.adminView === id;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const label = document.querySelector(`.admin-nav__link[data-admin-view="${CSS.escape(id)}"]`)?.textContent.trim() || "Dashboard";
  document.querySelector("#admin-breadcrumb").textContent = label;
  document.title = `${label} — Chunked Admin`;
  document.body.classList.remove("admin-nav-open");
  document.querySelector("#admin-menu-toggle").setAttribute("aria-expanded", "false");
  if (id === "templates") renderTemplates();
}

function getFilteredTemplates() {
  const query = search.value.trim().toLocaleLowerCase();
  return templates.filter((item) => {
    const matchesText = !query || `${item.title} ${item.description} ${item.creator}`.toLocaleLowerCase().includes(query);
    return matchesText
      && (categoryFilter.value === "all" || item.category === categoryFilter.value)
      && (accessFilter.value === "all" || item.access === accessFilter.value)
      && (statusFilter.value === "all" || item.status === statusFilter.value);
  }).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

function badge(text, variant) {
  const element = document.createElement("span");
  element.className = `admin-badge admin-badge--${variant}`;
  element.textContent = text;
  return element;
}

function actionButton(text, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function safeImage(value) {
  try {
    const url = new URL(value, location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function renderTemplates() {
  const filtered = getFilteredTemplates();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const records = filtered.slice(start, start + PAGE_SIZE);
  templateRows.replaceChildren();
  records.forEach((item) => {
    const row = document.createElement("tr");
    const mainCell = document.createElement("td");
    const content = document.createElement("div");
    content.className = "admin-template-cell";
    const art = document.createElement("span");
    art.className = "admin-template-cell__preview";
    const imageUrl = safeImage(item.image);
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      art.append(image);
    } else art.textContent = item.category === "DAY" ? "☼" : item.category === "GROW" ? "↗" : "✦";
    const copy = document.createElement("span");
    copy.className = "admin-template-cell__copy";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const creator = document.createElement("small");
    creator.textContent = `by ${item.creator || "Admin"}`;
    copy.append(title, creator);
    content.append(art, copy);
    mainCell.append(content);
    row.append(mainCell);

    const category = document.createElement("td");
    category.textContent = item.category;
    row.append(category);
    const access = document.createElement("td");
    access.append(badge(item.access === "premium" ? `Premium · $${Number(item.price || 0).toFixed(2)}` : "Free", item.access));
    row.append(access);
    const status = document.createElement("td");
    const labels = { published: "Published", draft: "Draft", review: "Pending review", archived: "Archived" };
    status.append(badge(labels[item.status] || "Draft", item.status));
    row.append(status);
    const updated = document.createElement("td");
    const date = new Date(`${item.updatedAt || ""}T12:00:00`);
    updated.textContent = Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
    row.append(updated);
    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "admin-row-actions";
    actions.append(actionButton("Preview", "preview", item.id), actionButton("Edit", "edit", item.id));
    if (item.status === "published") actions.append(actionButton("Unpublish", "unpublish", item.id));
    else if (item.status !== "archived") actions.append(actionButton("Publish", "publish", item.id));
    if (item.status === "archived") actions.append(actionButton("Restore", "restore", item.id));
    else actions.append(actionButton("Archive", "archive", item.id));
    actions.append(actionButton("Delete", "delete", item.id));
    actionsCell.append(actions);
    row.append(actionsCell);
    templateRows.append(row);
  });
  emptyState.hidden = filtered.length > 0;
  table.hidden = filtered.length === 0;
  pagination.hidden = filtered.length === 0;
  renderPagination(filtered.length, pages);
  updateTemplateMetrics();
}

function renderPagination(total, pages) {
  pagination.replaceChildren();
  if (!total) return;
  const button = (label, nextPage, disabled = false, current = false) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = label;
    item.disabled = disabled;
    if (current) item.setAttribute("aria-current", "page");
    item.addEventListener("click", () => { currentPage = nextPage; renderTemplates(); });
    return item;
  };
  pagination.append(button("←", currentPage - 1, currentPage === 1));
  for (let page = 1; page <= pages; page += 1) pagination.append(button(String(page), page, false, page === currentPage));
  pagination.append(button("→", currentPage + 1, currentPage === pages));
  const count = document.createElement("span");
  count.className = "admin-pagination__status";
  count.textContent = `${total} templates`;
  pagination.append(count);
}

function updateTemplateMetrics() {
  const sampleIds = new Set(sampleTemplates.map((item) => item.id));
  const counts = Object.fromEntries(["published", "draft", "review", "archived"].map((status) => {
    const baselineInSample = sampleTemplates.filter((item) => item.status === status).length;
    const currentInSample = templates.filter((item) => sampleIds.has(item.id) && item.status === status).length;
    const addedByAdmin = templates.filter((item) => !sampleIds.has(item.id) && item.status === status).length;
    return [status, platformTemplateBaseline[status] + currentInSample - baselineInSample + addedByAdmin];
  }));
  document.querySelector("#metric-published-templates").textContent = String(counts.published);
  document.querySelector("#metric-pending-templates").textContent = String(counts.review);
  document.querySelectorAll(".admin-template-summary__stats p").forEach((item) => {
    const label = item.querySelector("span")?.textContent;
    const value = item.querySelector("strong");
    const key = { Published: "published", Drafts: "draft", "Pending review": "review", Archived: "archived" }[label];
    if (value && key) value.textContent = String(counts[key]);
  });
}

function recordActivity(message) {
  const list = document.querySelector("#admin-activity-list");
  const item = document.createElement("li");
  const icon = document.createElement("span");
  icon.className = "admin-activity-list__icon";
  icon.textContent = "•";
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = message;
  const source = document.createElement("p");
  source.textContent = "Alex Morgan · Templates";
  copy.append(title, source);
  const time = document.createElement("time");
  time.dateTime = new Date().toISOString();
  time.textContent = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  item.append(icon, copy, time);
  list.prepend(item);
  while (list.children.length > 5) list.lastElementChild.remove();
}

function appendPreview(template) {
  form.querySelector(".admin-template-preview")?.remove();
  const preview = document.createElement("section");
  preview.className = "admin-template-preview";
  preview.setAttribute("aria-label", "Marketplace template preview");
  const chips = document.createElement("p");
  chips.append(badge(template.category || "DAY", "free"), document.createTextNode(" "), badge(template.access === "premium" ? `Premium · $${Number(template.price || 0).toFixed(2)}` : "Free", template.access || "free"));
  const title = document.createElement("h3");
  title.textContent = template.title || "Template title";
  const description = document.createElement("p");
  description.textContent = template.description || "A short description of this printable.";
  const status = document.createElement("p");
  status.textContent = `Status: ${template.status || "draft"} · Creator: ${template.creator || "Alex Morgan"}`;
  const contents = document.createElement("p");
  contents.textContent = template.contents ? `Includes: ${template.contents}` : "Template details will appear here.";
  preview.append(chips, title, description, status, contents);
  form.querySelector(".admin-dialog__actions").before(preview);
}

function resetPreview() {
  form.querySelector(".admin-template-preview")?.remove();
  form.querySelectorAll("input, select, textarea, button[type=submit]").forEach((control) => { control.disabled = false; control.hidden = false; });
  form.querySelectorAll(".chunked-dropdown__trigger").forEach((control) => { control.disabled = false; });
  formStatus.textContent = "";
}

function openEditor(template = null, readOnly = false) {
  form.reset();
  resetPreview();
  document.querySelector("#admin-template-dialog-title").textContent = readOnly ? "Template preview" : template ? "Edit template" : "New template";
  document.querySelector("#admin-template-id").value = template?.id || "";
  document.querySelector("#admin-template-title").value = template?.title || "";
  document.querySelector("#admin-template-description").value = template?.description || "";
  formCategory.value = template?.category || "DAY";
  formAccess.value = template?.access || "free";
  priceInput.value = String(template?.price || 4.99);
  document.querySelector("#admin-template-image").value = template?.image || "";
  document.querySelector("#admin-template-contents").value = template?.contents || "";
  document.querySelector("#admin-template-form-status").value = template?.status || "draft";
  form.querySelectorAll("input:not([type=hidden]), select, textarea").forEach((control) => { control.disabled = readOnly; });
  form.querySelectorAll(".chunked-dropdown__trigger").forEach((control) => { control.disabled = readOnly; });
  form.querySelectorAll("button[type=submit]").forEach((control) => { control.hidden = readOnly; });
  priceInput.required = formAccess.value === "premium" && !readOnly;
  priceWrap.hidden = readOnly || formAccess.value !== "premium";
  if (readOnly && template) appendPreview(template);
  dialog.showModal();
}

navButtons.forEach((control) => control.addEventListener("click", () => switchView(control.dataset.adminView)));
document.querySelector("#admin-menu-toggle").addEventListener("click", (event) => {
  const open = document.body.classList.toggle("admin-nav-open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (document.body.classList.contains("admin-nav-open") && !event.target.closest(".admin-sidebar, #admin-menu-toggle")) {
    document.body.classList.remove("admin-nav-open");
    document.querySelector("#admin-menu-toggle").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") document.body.classList.remove("admin-nav-open"); });

document.querySelector("#admin-create-template").addEventListener("click", () => openEditor());
document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
document.querySelectorAll("[data-quick-create-close]").forEach((button) => button.addEventListener("click", () => quickCreateDialog.close()));
document.querySelector("#admin-create-category").addEventListener("click", () => openQuickCreate("category"));
document.querySelector("#admin-create-announcement").addEventListener("click", () => openQuickCreate("announcement"));
quickCreateDialog.addEventListener("click", (event) => { if (event.target === quickCreateDialog) quickCreateDialog.close(); });
quickCreateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = quickCreateName.value.trim();
  const detail = quickCreateDetail.value.trim();
  if (!name || !detail) return;

  if (quickCreateType === "category") {
    const savedCategories = readDemoList(CATEGORY_STORAGE_KEY);
    const existingNames = [
      ...[...document.querySelectorAll("#admin-category-grid h2")].map((heading) => heading.textContent.trim().toLocaleLowerCase()),
      ...savedCategories.map((item) => item.name.toLocaleLowerCase()),
    ];
    if (existingNames.includes(name.toLocaleLowerCase())) {
      quickCreateStatus.textContent = "A category with that name already exists.";
      quickCreateName.focus();
      return;
    }
    savedCategories.push({ id: newId(), name, description: detail });
    const stored = saveDemoList(CATEGORY_STORAGE_KEY, savedCategories);
    const categoryGrid = document.querySelector("#admin-category-grid");
    const card = document.createElement("article");
    card.className = "admin-panel";
    const icon = document.createElement("span");
    icon.className = "admin-category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const title = document.createElement("h2");
    title.textContent = name;
    const description = document.createElement("p");
    description.textContent = detail;
    const count = document.createElement("strong");
    count.textContent = "0 templates";
    const status = document.createElement("span");
    status.className = "admin-badge";
    status.textContent = "Draft · demo";
    card.append(icon, title, description, count, status);
    categoryGrid.append(card);
    quickCreateDialog.close();
    showToast(stored ? `“${name}” added as a demo category.` : `“${name}” added for this visit only.`);
    return;
  }

  const announcements = readDemoList(ANNOUNCEMENT_STORAGE_KEY);
  const audience = document.querySelector("#admin-announcement-audience").value;
  announcements.unshift({ id: newId(), title: name, description: detail, audience });
  const stored = saveDemoList(ANNOUNCEMENT_STORAGE_KEY, announcements);
  const row = document.createElement("tr");
  const copyCell = document.createElement("td");
  const title = document.createElement("strong");
  title.textContent = name;
  const message = document.createElement("small");
  message.textContent = detail;
  copyCell.append(title, message);
  const statusCell = document.createElement("td");
  const badgeElement = document.createElement("span");
  badgeElement.className = "admin-badge";
  badgeElement.textContent = "Draft · demo";
  statusCell.append(badgeElement);
  row.append(copyCell, createTextCell(audience), statusCell, createTextCell("Not scheduled"), createTextCell("—"));
  document.querySelector("#admin-announcement-rows").prepend(row);
  quickCreateDialog.close();
  showToast(stored ? `“${name}” saved as a demo draft. It was not sent.` : `“${name}” added for this visit only. It was not sent.`);
});
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", resetPreview);
formAccess.addEventListener("change", () => {
  const premium = formAccess.value === "premium";
  priceWrap.hidden = !premium;
  priceInput.required = premium;
});
document.querySelector("#admin-template-clear").addEventListener("click", () => {
  search.value = "";
  categoryFilter.value = accessFilter.value = statusFilter.value = "all";
  currentPage = 1;
  renderTemplates();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const isPreview = event.submitter?.value === "preview";
  if (!form.reportValidity()) return;
  const id = document.querySelector("#admin-template-id").value;
  const existing = templates.find((item) => item.id === id);
  const item = {
    id: id || newId(),
    title: document.querySelector("#admin-template-title").value.trim(),
    description: document.querySelector("#admin-template-description").value.trim(),
    category: formCategory.value,
    access: formAccess.value,
    status: formStatusSelect.value,
    price: formAccess.value === "premium" ? Number(priceInput.value) : 0,
    image: document.querySelector("#admin-template-image").value.trim(),
    contents: document.querySelector("#admin-template-contents").value.trim(),
    creator: existing?.creator || "Alex Morgan",
    updatedAt: dateToday(),
  };
  if (item.access === "premium" && (!Number.isFinite(item.price) || item.price <= 0)) {
    formStatus.textContent = "Enter a price greater than zero for a premium template.";
    priceInput.focus();
    return;
  }
  if (isPreview) {
    appendPreview(item);
    formStatus.textContent = "Local preview only. This template has not been published.";
    return;
  }
  if (item.status === "published" && (!item.title || !item.description || !categories.includes(item.category))) {
    formStatus.textContent = "Add a title, description, and category before publishing.";
    return;
  }
  templates = existing ? templates.map((entry) => entry.id === id ? item : entry) : [item, ...templates];
  const stored = persistTemplates();
  recordActivity(`${existing ? "Updated" : "Created"} “${item.title}”`);
  dialog.close();
  renderTemplates();
  showToast(stored ? `“${item.title}” saved in this browser’s demo.` : `“${item.title}” is only saved for this visit; browser storage is unavailable.`);
});

templateRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = templates.find((entry) => entry.id === button.dataset.id);
  if (!item) return;
  const { action } = button.dataset;
  if (action === "edit" || action === "preview") { openEditor(item, action === "preview"); return; }
  if (action === "delete") {
    if (!confirm(`Delete “${item.title}” from this browser’s demo library?`)) return;
    templates = templates.filter((entry) => entry.id !== item.id);
    const stored = persistTemplates();
    recordActivity(`Deleted “${item.title}”`);
    renderTemplates();
    showToast(stored ? "Template deleted from the local demo library." : "Template removed for this visit only; browser storage is unavailable.");
    return;
  }
  const nextStatus = { publish: "published", unpublish: "draft", archive: "archived", restore: "draft" }[action];
  if (!nextStatus) return;
  if (nextStatus === "published" && (!item.title || !item.description || !categories.includes(item.category))) {
    showToast("This template needs a title, description, and category before publishing.");
    return;
  }
  item.status = nextStatus;
  item.updatedAt = dateToday();
  const stored = persistTemplates();
  const verb = { published: "Published", draft: action === "unpublish" ? "Unpublished" : "Restored", archived: "Archived" }[nextStatus];
  recordActivity(`${verb} “${item.title}”`);
  renderTemplates();
  showToast(stored ? `Template ${verb.toLowerCase()} in this browser’s demo.` : `Status changed for this visit only; browser storage is unavailable.`);
});

[search, categoryFilter, accessFilter, statusFilter].forEach((control) => {
  control.addEventListener("input", () => { currentPage = 1; renderTemplates(); });
  control.addEventListener("change", () => { currentPage = 1; renderTemplates(); });
});

document.querySelector("#admin-date").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
renderSavedDemoItems();
renderTemplates();
