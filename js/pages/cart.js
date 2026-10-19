const CART_KEY = "chunked-template-cart-v1";
const list = document.querySelector("#cart-list");
const empty = document.querySelector("#cart-empty");
const checkout = document.querySelector("#cart-checkout");

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(items) ? items.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(Number(item.price))) : [];
  } catch { return []; }
}

function render() {
  const items = readCart();
  const subtotal = items.reduce((total, item) => total + Number(item.price), 0);
  list.replaceChildren(...items.map((item) => {
    const row = document.createElement("article");
    row.className = "cart-item";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const note = document.createElement("p");
    note.textContent = "Printable template · one-time demo purchase";
    copy.append(title, note);
    const price = document.createElement("strong");
    price.className = "cart-item__price";
    price.textContent = `$${Number(item.price).toFixed(2)}`;
    const remove = document.createElement("button");
    remove.className = "cart-item__remove";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
    remove.addEventListener("click", () => {
      const updated = readCart().filter((entry) => entry.id !== item.id);
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
      render();
    });
    row.append(copy, price, remove);
    return row;
  }));
  document.querySelector("#cart-count").textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  document.querySelector("#cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.querySelector("#cart-total").textContent = `$${subtotal.toFixed(2)}`;
  empty.hidden = items.length > 0;
  list.hidden = items.length === 0;
  checkout.setAttribute("aria-disabled", String(items.length === 0));
}

checkout.addEventListener("click", (event) => { if (readCart().length === 0) event.preventDefault(); });
window.addEventListener("storage", (event) => { if (event.key === CART_KEY) render(); });
render();
