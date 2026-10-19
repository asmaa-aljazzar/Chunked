const SAVED_KEY = "chunked-saved-templates-v1";
const CART_KEY = "chunked-template-cart-v1";
const OWNED_KEY = "chunked-owned-templates-v1";

const templates = [
  {
    id: "calm-day-plan",
    name: "A Calm Day Plan",
    description: "Shape a manageable day with a few thoughtful priorities and room to pause.",
    category: "day",
    access: "free",
    price: 0,
    icon: "☼",
    previewTitle: "A little plan for today",
    previewRows: ["Choose one priority", "Make room for a pause", "Wrap up gently"],
    items: ["Choose one main priority", "Add two small supporting tasks", "Leave a little breathing room"],
  },
  {
    id: "study-week",
    name: "Study Week",
    description: "A flexible study rhythm with focused sessions, review, and rest built in.",
    category: "study",
    access: "paid",
    price: 1.99,
    icon: "✎",
    previewTitle: "This week’s study rhythm",
    previewRows: ["Read one short chapter", "Review yesterday’s notes", "Take a proper break"],
    items: ["Pick one topic for each study session", "Review notes in short chunks", "Plan a lighter catch-up block"],
  },
  {
    id: "gentle-morning",
    name: "Gentle Morning Routine",
    description: "Start with a few easy habits that help the morning feel more settled.",
    category: "habits",
    access: "paid",
    price: 1.49,
    icon: "☀",
    previewTitle: "A softer start",
    previewRows: ["Drink some water", "Open the curtains", "Pick one intention"],
    items: ["Drink a glass of water", "Take a few quiet minutes", "Choose one intention for the day"],
  },
  {
    id: "weekly-goal-planner",
    name: "Weekly Goal Planner",
    description: "Turn a meaningful goal into a small set of steps you can revisit each week.",
    category: "grow",
    access: "paid",
    price: 2.99,
    icon: "↗",
    previewTitle: "One goal, small steps",
    previewRows: ["Choose a weekly milestone", "Set a first action", "Notice what moved forward"],
    items: ["Name the goal that matters this week", "Choose one milestone", "Write a small first action"],
  },
  {
    id: "daily-focus-plan",
    name: "Daily Focus Plan",
    description: "Choose a focus, check what you need, and make the next step feel clear.",
    category: "focus",
    access: "paid",
    price: 1.49,
    icon: "◎",
    previewTitle: "My focus for this chunk",
    previewRows: ["Pick one thing to work on", "Check what I need", "Choose a next step"],
    items: ["Choose one current focus", "Check your readiness", "Write one possible next step"],
  },
  {
    id: "habit-builder",
    name: "Habit Builder",
    description: "Begin with a few repeatable habits and a schedule that fits your week.",
    category: "habits",
    access: "paid",
    price: 1.99,
    icon: "◷",
    previewTitle: "A habit that fits my week",
    previewRows: ["Choose the days", "Keep the first step small", "Check in without pressure"],
    items: ["Choose a small habit", "Pick the days that suit you", "Decide what will make it easier"],
  },
  {
    id: "kind-workweek",
    name: "A Kinder Workweek",
    description: "Organize work into clear priorities, focused blocks, and realistic breaks.",
    category: "work",
    access: "paid",
    price: 1.99,
    icon: "▤",
    previewTitle: "A kinder workweek",
    previewRows: ["Name the key outcomes", "Group similar work", "Keep a little margin"],
    items: ["Choose the week’s key outcomes", "Group related tasks", "Protect time to pause"],
  },
  {
    id: "self-care-reset",
    name: "Self-Care Reset",
    description: "Make a little room for rest and care without turning it into another checklist.",
    category: "self-care",
    access: "paid",
    price: 2.49,
    icon: "✦",
    previewTitle: "A small reset for me",
    previewRows: ["Notice what feels supportive", "Choose one gentle thing", "Let the rest wait"],
    items: ["Notice what would feel supportive", "Choose one gentle activity", "Leave the rest optional"],
  },
];

const searchInput = document.querySelector("#template-search");
const accessSelect = document.querySelector("#template-access");
const categoryNav = document.querySelector("#template-categories");
const resultCount = document.querySelector("#template-results-count");
const templateGrid = document.querySelector("#template-grid");
const emptyState = document.querySelector("#template-empty");
const emptyTitle = document.querySelector("#template-empty-title");
const emptyCopy = document.querySelector("#template-empty-copy");
const savedGrid = document.querySelector("#saved-template-grid");
const savedCount = document.querySelector("#saved-template-count");
const savedResultCount = document.querySelector("#saved-results-count");
const savedEmpty = document.querySelector("#saved-template-empty");
const detailsDialog = document.querySelector("#template-details-dialog");
const detailActions = document.querySelector("#template-detail-actions");
const detailStatus = document.querySelector("#template-detail-status");
const savedTab = document.querySelector("#saved-templates-tab");
const marketTab = document.querySelector("#marketplace-tab");
let activeCategory = "all";
let activeAccess = accessSelect.value;
let selectedTemplate = null;
let savedIds = loadSavedIds();
let ownedIds = loadIdList(OWNED_KEY);

function loadIdList(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [];
  } catch { return []; }
}

function hasTemplateAccess(template) {
  return template.access === "free" || ownedIds.includes(template.id);
}

function updateCartBadge() {
  let count = 0;
  try { count = JSON.parse(localStorage.getItem(CART_KEY) || "[]").length; } catch { count = 0; }
  const badge = document.querySelector("#template-cart-count");
  badge.textContent = String(count);
  badge.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in cart`);
}

function addToCart(template) {
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { cart = []; }
  if (!Array.isArray(cart)) cart = [];
  if (!cart.some((item) => item.id === template.id)) cart.push({ id: template.id, name: template.name, price: template.price });
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.location.href = "cart.html";
}

function loadSavedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveSavedIds() {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds));
    return true;
  } catch {
    return false;
  }
}

function categoryName(category) {
  return ({ day: "DAY", grow: "GROW", focus: "FOCUS", habits: "Habits", study: "Study", work: "Work", "self-care": "Self-care" })[category] || category;
}

function makeButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function createTemplateCard(template) {
  const card = document.createElement("article");
  card.className = "template-card";
  card.dataset.templateId = template.id;

  const preview = document.createElement("div");
  preview.className = "template-card__preview";
  preview.dataset.category = template.category;
  preview.setAttribute("aria-hidden", "true");
  preview.append(createPreviewSheet(template));

  const body = document.createElement("div");
  body.className = "template-card__body";
  const meta = document.createElement("div");
  meta.className = "template-card__meta";
  const category = document.createElement("span");
  category.className = "template-card__category";
  category.textContent = categoryName(template.category);
  const access = document.createElement("span");
  access.className = `template-card__access${template.access === "paid" ? " template-card__access--paid" : ""}`;
  access.textContent = ownedIds.includes(template.id) ? "Owned" : template.access === "paid" ? "Paid" : "Free";
  meta.append(category, access);

  const title = document.createElement("h2");
  title.textContent = template.name;
  const description = document.createElement("p");
  description.className = "template-card__description";
  description.textContent = template.description;
  const price = document.createElement("p");
  price.className = "template-card__price";
  price.textContent = template.access === "free" ? "Free sample" : hasTemplateAccess(template) ? "Ready to print" : `$${template.price.toFixed(2)} · Demo price`;

  const actions = document.createElement("div");
  actions.className = "template-card__actions";
  actions.append(makeButton("Preview printable", "button button--secondary", () => openDetails(template)));
  if (template.access === "paid" && !hasTemplateAccess(template)) {
    actions.append(makeButton("Add to cart", "button button--primary", () => addToCart(template)));
  } else {
    actions.append(makeButton("Print / Save PDF", "button button--primary", () => printTemplate(template)));
    if (template.access === "free") {
      actions.append(makeButton(savedIds.includes(template.id) ? "Remove saved" : "Save", "button button--secondary", () => toggleSaved(template)));
    }
  }
  body.append(meta, title, description, price, actions);
  card.append(preview, body);
  return card;
}

function createPreviewSheet(template) {
  const sheet = document.createElement("div");
  sheet.className = "template-preview-sheet";
  const top = document.createElement("div");
  top.className = "template-preview-sheet__top";
  const mark = document.createElement("span");
  mark.className = "template-preview-sheet__mark";
  mark.textContent = template.icon;
  const category = document.createElement("span");
  category.className = "template-preview-sheet__category";
  category.textContent = categoryName(template.category);
  top.append(mark, category);

  const heading = document.createElement("p");
  heading.className = "template-preview-sheet__title";
  heading.textContent = template.previewTitle;
  const rows = document.createElement("ul");
  rows.className = "template-preview-sheet__rows";
  template.previewRows.forEach((text, index) => {
    const row = document.createElement("li");
    const check = document.createElement("span");
    check.className = "template-preview-sheet__check";
    check.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = text;
    row.append(check, label);
    rows.append(row);
  });
  sheet.append(top, heading, rows);
  return sheet;
}

function getFilteredTemplates() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return templates.filter((template) => {
    const matchesQuery = `${template.name} ${template.description} ${categoryName(template.category)}`.toLocaleLowerCase().includes(query);
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    const matchesAccess = activeAccess === "all" || template.access === activeAccess;
    return matchesQuery && matchesCategory && matchesAccess;
  });
}

function renderMarketplace() {
  const filtered = getFilteredTemplates();
  templateGrid.replaceChildren(...filtered.map(createTemplateCard));
  resultCount.textContent = `${filtered.length} example ${filtered.length === 1 ? "template" : "templates"}`;
  emptyState.hidden = filtered.length > 0;
  emptyTitle.textContent = "No templates match those filters.";
  emptyCopy.textContent = "Try another search or category to find a starting point.";
}

function renderSaved() {
  const freeSavedIds = savedIds.filter((id) => templates.some((template) => template.id === id && template.access === "free"));
  const saved = [...new Set([...freeSavedIds, ...ownedIds])].map((id) => templates.find((template) => template.id === id)).filter(Boolean);
  savedGrid.replaceChildren(...saved.map(createTemplateCard));
  savedEmpty.hidden = saved.length > 0;
  savedResultCount.textContent = `${saved.length} ${saved.length === 1 ? "template" : "templates"} in your library`;
  savedCount.textContent = String(saved.length);
  savedCount.hidden = saved.length === 0;
}

function setActiveTab(showSaved) {
  const marketplacePanel = document.querySelector("#marketplace-panel");
  const savedPanel = document.querySelector("#saved-templates-panel");
  marketTab.classList.toggle("is-active", !showSaved);
  marketTab.setAttribute("aria-selected", String(!showSaved));
  marketTab.tabIndex = showSaved ? -1 : 0;
  savedTab.classList.toggle("is-active", showSaved);
  savedTab.setAttribute("aria-selected", String(showSaved));
  savedTab.tabIndex = showSaved ? 0 : -1;
  marketplacePanel.hidden = showSaved;
  savedPanel.hidden = !showSaved;
  if (showSaved) renderSaved();
}

function openDetails(template) {
  selectedTemplate = template;
  document.querySelector("#template-detail-title").textContent = template.name;
  document.querySelector("#template-detail-category").textContent = categoryName(template.category);
  document.querySelector("#template-detail-description").textContent = template.description;
  const detailPreview = document.querySelector("#template-detail-preview");
  detailPreview.dataset.category = template.category;
  detailPreview.replaceChildren(createPreviewSheet(template));
  const detailAccess = document.querySelector("#template-detail-access");
  detailAccess.textContent = template.access === "free" ? "Free sample printable" : ownedIds.includes(template.id) ? "Purchased · ready to print" : `Paid printable · $${template.price.toFixed(2)} (demo price)`;
  const itemList = document.querySelector("#template-detail-items");
  itemList.replaceChildren(...template.items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));

  const guideSection = document.querySelector("#template-detail-guide");
  const guide = template.pdfUrl && template.pdfName && template.access === "free" ? template : null;
  guideSection.hidden = !guide;
  if (guide) {
    document.querySelector("#template-guide-name").textContent = guide.pdfName;
    const preview = document.querySelector("#template-guide-preview");
    preview.src = guide.pdfUrl;
    preview.hidden = false;
    const download = document.querySelector("#template-guide-download");
    download.href = guide.pdfUrl;
    download.download = guide.pdfName;
  }

  detailStatus.textContent = "";
  detailActions.replaceChildren();
  if (hasTemplateAccess(template)) {
    if (template.access === "free") {
      detailActions.append(makeButton(savedIds.includes(template.id) ? "Remove from My templates" : "Save template", "button button--secondary", () => toggleSaved(template, true)));
    }
    detailActions.append(makeButton("Print / Save as PDF", "button button--primary", () => printTemplate(template)));
  } else {
    detailActions.append(makeButton("Add to cart", "button button--primary", () => addToCart(template)));
  }
  detailsDialog.showModal();
}

detailsDialog.addEventListener("click", (event) => {
  if (event.target !== detailsDialog) return;
  const bounds = detailsDialog.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (clickedOutside) detailsDialog.close();
});

function toggleSaved(template, updateDetails = false) {
  const isSaved = savedIds.includes(template.id);
  savedIds = isSaved ? savedIds.filter((id) => id !== template.id) : [...savedIds, template.id];
  if (!saveSavedIds()) {
    savedIds = loadSavedIds();
    if (updateDetails) detailStatus.textContent = "This browser could not save that change.";
    return;
  }
  renderMarketplace();
  renderSaved();
  if (updateDetails && selectedTemplate) {
    detailStatus.textContent = isSaved ? "Removed from My templates." : "Saved to My templates on this device.";
    const saveButton = detailActions.querySelector("button");
    if (saveButton) saveButton.textContent = isSaved ? "Save template" : "Remove from My templates";
  }
}

function printTemplate(template) {
  if (template.pdfUrl) {
    const pdfWindow = window.open(template.pdfUrl, "_blank");
    if (pdfWindow) pdfWindow.opener = null;
    else detailStatus.textContent = "Allow the new tab to open so you can print the PDF.";
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    detailStatus.textContent = "Allow the printable preview to open, then you can print or save it as a PDF.";
    return;
  }
  printWindow.opener = null;
  const printDocument = printWindow.document;
  printDocument.open();
  printDocument.write("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Printable template</title></head><body><main class=\"printable\"></main></body></html>");
  printDocument.close();
  printDocument.title = `${template.name} — Chunked printable`;
  const style = printDocument.createElement("style");
  style.textContent = `
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #25332b; font: 15px/1.55 Inter, Arial, sans-serif; }
    .printable { max-width: 720px; margin: 0 auto; }
    .brand { margin: 0 0 34px; color: #397355; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 32px; line-height: 1.15; }
    .description { margin: 0 0 24px; color: #58645d; }
    .category { display: inline-block; margin: 0 0 22px; border-bottom: 1px solid #a6b9ad; padding-bottom: 5px; color: #397355; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h2 { margin: 0 0 12px; font-size: 17px; }
    .item { display: flex; align-items: flex-start; gap: 11px; margin: 0 0 15px; }
    .box { width: 16px; height: 16px; flex: 0 0 16px; border: 1px solid #73847a; border-radius: 3px; margin-top: 2px; }
    .notes { margin-top: 34px; }
    .line { height: 34px; border-bottom: 1px solid #d4ddd7; }
    .footer { margin-top: 28px; color: #738078; font-size: 11px; }
    @media screen { body { background: #f3f5f2; padding: 28px 18px; } .printable { min-height: 90vh; background: white; box-shadow: 0 8px 32px #18271b18; padding: 40px; } }
    @media print { .printable { max-width: none; } }
  `;
  printDocument.head.append(style);
  const page = printDocument.querySelector(".printable");
  const brand = printDocument.createElement("p");
  brand.className = "brand";
  brand.textContent = "Chunked · Printable template";
  const title = printDocument.createElement("h1");
  title.textContent = template.name;
  const description = printDocument.createElement("p");
  description.className = "description";
  description.textContent = template.description;
  const category = printDocument.createElement("p");
  category.className = "category";
  category.textContent = categoryName(template.category);
  const heading = printDocument.createElement("h2");
  heading.textContent = template.previewTitle;
  const items = printDocument.createElement("section");
  items.setAttribute("aria-label", "Printable prompts");
  template.items.forEach((item) => {
    const row = printDocument.createElement("div");
    row.className = "item";
    const box = printDocument.createElement("span");
    box.className = "box";
    box.setAttribute("aria-hidden", "true");
    const text = printDocument.createElement("span");
    text.textContent = item;
    row.append(box, text);
    items.append(row);
  });
  const notes = printDocument.createElement("section");
  notes.className = "notes";
  const notesHeading = printDocument.createElement("h2");
  notesHeading.textContent = "Notes";
  notes.append(notesHeading);
  for (let index = 0; index < 5; index += 1) {
    const line = printDocument.createElement("div");
    line.className = "line";
    notes.append(line);
  }
  const footer = printDocument.createElement("p");
  footer.className = "footer";
  footer.textContent = "Small steps count.";
  page.append(brand, title, description, category, heading, items, notes, footer);
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 500);
}

searchInput.addEventListener("input", renderMarketplace);
accessSelect.addEventListener("change", () => {
  activeAccess = accessSelect.value;
  renderMarketplace();
});
categoryNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  categoryNav.querySelectorAll("[data-category]").forEach((option) => {
    const active = option === button;
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  renderMarketplace();
});

document.querySelector("#clear-template-filters").addEventListener("click", () => {
  searchInput.value = "";
  activeAccess = "all";
  accessSelect.value = "all";
  accessSelect.dispatchEvent(new Event("change", { bubbles: true }));
  activeCategory = "all";
  categoryNav.querySelectorAll("[data-category]").forEach((option) => {
    const active = option.dataset.category === "all";
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  renderMarketplace();
});

marketTab.addEventListener("click", () => setActiveTab(false));
savedTab.addEventListener("click", () => setActiveTab(true));
document.querySelector("#back-to-marketplace").addEventListener("click", () => setActiveTab(false));
document.querySelectorAll("[data-show-marketplace]").forEach((button) => button.addEventListener("click", () => setActiveTab(false)));

window.addEventListener("storage", (event) => {
  if (event.key === OWNED_KEY) { ownedIds = loadIdList(OWNED_KEY); renderMarketplace(); renderSaved(); }
  if (event.key === CART_KEY) updateCartBadge();
});

renderMarketplace();
renderSaved();
updateCartBadge();
