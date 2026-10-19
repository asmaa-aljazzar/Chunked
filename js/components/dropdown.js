const instances = new WeakMap();
let nextDropdownId = 0;

function selectedOption(select) {
  return select.options[select.selectedIndex] ?? select.options[0];
}

function optionLabel(select) {
  const explicit = select.getAttribute("aria-label");
  if (explicit) return explicit;
  const label = [...(select.labels || [])].find((item) => item.textContent.trim());
  return label?.textContent.trim() || "Choose an option";
}

export function enhanceSelect(select) {
  if (!(select instanceof HTMLSelectElement) || select.hidden || instances.has(select)) return instances.get(select);

  const label = optionLabel(select);
  const wrappingLabel = select.closest("label");
  const associatedLabels = [...(select.labels || [])];
  const wrapper = document.createElement("div");
  wrapper.className = "chunked-dropdown";
  wrapper.dataset.dropdownFor = select.id || `select-${++nextDropdownId}`;

  if (wrappingLabel) {
    if (!wrappingLabel.id) wrappingLabel.id = `dropdown-label-${++nextDropdownId}`;
    wrappingLabel.append(wrapper);
  } else {
    select.before(wrapper);
  }
  wrapper.append(select);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "chunked-dropdown__trigger";
  trigger.id = `${wrapper.dataset.dropdownFor}-trigger`;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", label);
  associatedLabels.forEach((associatedLabel) => { associatedLabel.htmlFor = trigger.id; });
  if (wrappingLabel) trigger.setAttribute("aria-labelledby", wrappingLabel.id);

  const value = document.createElement("span");
  value.className = "chunked-dropdown__value";
  const chevron = document.createElement("span");
  chevron.className = "chunked-dropdown__chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  trigger.append(value, chevron);

  const menu = document.createElement("div");
  menu.className = "chunked-dropdown__menu";
  menu.id = `${wrapper.dataset.dropdownFor}-options`;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", label);
  menu.hidden = true;
  trigger.setAttribute("aria-controls", menu.id);
  wrapper.append(trigger, menu);

  select.classList.add("chunked-dropdown__native");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  function renderOptions() {
    menu.replaceChildren();
    [...select.options].forEach((sourceOption, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "chunked-dropdown__option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(sourceOption === selectedOption(select)));
      option.disabled = sourceOption.disabled;
      option.dataset.optionIndex = String(index);
      option.textContent = sourceOption.textContent.trim();
      menu.append(option);
    });
    syncValue();
  }

  function syncValue() {
    const current = selectedOption(select);
    value.textContent = current?.textContent.trim() || "Choose an option";
    trigger.disabled = select.disabled;
    menu.querySelectorAll("[role=option]").forEach((option, index) => {
      option.setAttribute("aria-selected", String(select.options[index] === current));
    });
  }

  function setOpen(open, focusSelected = false) {
    menu.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    if (open && focusSelected) {
      (menu.querySelector('[aria-selected="true"]:not(:disabled)') || menu.querySelector('[role="option"]:not(:disabled)'))?.focus();
    }
  }

  function commitOption(option) {
    if (!option || option.disabled) return;
    select.selectedIndex = Number(option.dataset.optionIndex);
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncValue();
    setOpen(false);
    trigger.focus();
  }

  renderOptions();
  select.addEventListener("change", renderOptions);
  trigger.addEventListener("click", () => setOpen(menu.hidden, menu.hidden));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true, true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(menu.hidden, menu.hidden);
    }
  });
  menu.addEventListener("click", (event) => commitOption(event.target.closest("[role=option]")));
  menu.addEventListener("keydown", (event) => {
    const options = [...menu.querySelectorAll('[role="option"]:not(:disabled)')];
    const index = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      options[(index + step + options.length) % options.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? options[0] : options[options.length - 1])?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitOption(document.activeElement);
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!wrapper.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setOpen(false);
      trigger.focus();
    }
  });
  select.form?.addEventListener("reset", () => queueMicrotask(syncValue));

  const instance = { select, trigger, menu, syncValue };
  instances.set(select, instance);
  return instance;
}

export function enhanceSelects(root = document) {
  root.querySelectorAll?.("select:not([hidden])").forEach(enhanceSelect);
}
