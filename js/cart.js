/* NOVA MART – cart storage (localStorage) and the cart page */
const CART_KEY = 'novamart_cart';
const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };

function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() {
  const el = $('#cart-count');
  if (el) el.textContent = getCart().reduce((n, i) => n + i.qty, 0);
}
function addToCart(id, qty = 1) {
  const cart = getCart(), item = cart.find(i => i.id === id);
  if (item) item.qty = Math.min(10, item.qty + qty); else cart.push({ id, qty: Math.min(10, qty) });
  saveCart(cart);
}
/* Joins stored {id, qty} with full product data from the XML */
const cartLines = products => getCart().map(i => ({ p: products.find(p => p.id === i.id), qty: i.qty })).filter(l => l.p);
function cartTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderCart(products) {
  const lines = cartLines(products), box = $('#cart-items'), summary = $('#cart-summary');
  if (!lines.length) {
    box.innerHTML = '<div class="empty"><p>Your cart is empty.</p><br><a class="btn dark" href="products.html">Start shopping</a></div>';
    summary.hidden = true;
    return;
  }
  summary.hidden = false;
  box.innerHTML = lines.map(({ p, qty }) => `
    <article class="cart-row">
      <a href="product-details.html?id=${p.id}"><img src="${p.image}" alt="${esc(p.name)}"></a>
      <div><small>${esc(p.category)}</small><a href="product-details.html?id=${p.id}">${esc(p.name)}</a>
        <small>${money(p.price)} each</small><button class="link-btn" data-remove="${p.id}">Remove</button></div>
      <div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">−</button><span aria-live="polite">${qty}</span><button data-inc="${p.id}" aria-label="Increase quantity">+</button></div>
      <b>${money(p.price * qty)}</b></article>`).join('');
  const t = cartTotals(lines);
  $('#sum-sub').textContent = money(t.subtotal);
  $('#sum-ship').textContent = t.shipping ? money(t.shipping) : 'Free';
  $('#sum-total').textContent = money(t.total);
}

if ($('#cart-items')) {
  loadProducts().then(products => {
    renderCart(products);
    $('#cart-items').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const cart = getCart(), id = +(b.dataset.inc || b.dataset.dec || b.dataset.remove), item = cart.find(i => i.id === id);
      if (!item) return;
      if (b.dataset.inc) item.qty = Math.min(10, item.qty + 1);
      else if (b.dataset.dec) item.qty = Math.max(1, item.qty - 1);
      else cart.splice(cart.indexOf(item), 1);
      saveCart(cart);
      renderCart(products);
    });
  }).catch(() => showLoadError($('#cart-items')));
}
updateCartCount();
