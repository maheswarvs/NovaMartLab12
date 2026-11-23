/* NOVA MART – shared helpers: DOM utilities, header/footer, XML loading, product cards, validation */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const getSession = () => { try { return JSON.parse(localStorage.getItem('novamart_session')); } catch { return null; } };

/* ---------- toast notification ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- header and footer (injected so every page stays consistent) ---------- */
function renderLayout() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const user = getSession();
  const nav = (href, text) => `<a href="${href}"${page === href && !location.search ? ' aria-current="page"' : ''}>${text}</a>`;
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const cats = ['Electronics', 'Fashion', 'Footwear', 'Bags', 'Accessories', 'Home'];

  $('#site-header').innerHTML = `
    <div class="strip">Free delivery on orders above ₹999 · 14-day easy returns</div>
    <div class="bar wrap">
      <a class="logo" href="index.html">NOVA<span>MART</span></a>
      <form class="search" action="products.html" role="search">
        <input type="search" name="q" placeholder="Search for products" aria-label="Search products">
        <button type="submit">Search</button>
      </form>
      <div class="actions">
        <a class="act" href="login.html">${icon('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>')}<span>${user ? esc(user.name.split(' ')[0]) : 'Account'}</span></a>
        <a class="act" href="cart.html">${icon('<path d="M3 4h3l2.5 11h9.5l2-8H7"/><circle cx="10" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>')}<span>Cart</span><b id="cart-count">0</b></a>
      </div>
    </div>
    <nav class="wrap mainnav" aria-label="Main">${nav('index.html', 'Home')}${nav('products.html', 'Shop all')}
      ${cats.map(c => `<a href="products.html?cat=${c}">${c === 'Home' ? 'Home &amp; Living' : c}</a>`).join('')}${nav('contact.html', 'Contact')}</nav>`;

  $('#site-footer').innerHTML = `
    <footer><div class="wrap foot">
      <div><a class="logo" href="index.html">NOVA<span>MART</span></a><p>Well-made everyday things for the way you live. Delivered across India.</p></div>
      <div><h4>Shop</h4><a href="products.html">All products</a><a href="products.html?cat=Fashion">Fashion</a><a href="products.html?cat=Bags">Bags</a><a href="products.html?cat=Home">Home &amp; Living</a></div>
      <div><h4>Help</h4><a href="cart.html">Your cart</a><a href="checkout.html">Checkout</a><a href="login.html">Login / Register</a><a href="contact.html">Contact us</a></div>
      <div><h4>Follow us</h4><div class="social">
        <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
        <a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">FB</a>
        <a href="https://x.com/" target="_blank" rel="noopener" aria-label="X">X</a>
        <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube">YT</a></div></div>
    </div><div class="copy">© 2026 NOVA MART. A college web development laboratory project.</div></footer>`;
}
renderLayout();

/* ---------- XML product loading (fetched once, then cached) ---------- */
let productsPromise;
function loadProducts() {
  productsPromise ??= fetch('data/products.xml')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => {
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
      return $$('product', doc).map(el => {
        const g = tag => el.querySelector(tag)?.textContent.trim() ?? '';
        return { id: +el.getAttribute('id'), name: g('name'), category: g('category'), price: +g('price'), oldPrice: +g('oldPrice') || 0,
          rating: +g('rating'), reviews: +g('reviews'), stock: +g('stock'), featured: g('featured') === 'true',
          bestseller: g('bestseller') === 'true', image: g('image'), description: g('description') };
      });
    });
  return productsPromise;
}
const showLoadError = el => { el.innerHTML = '<p class="empty">Could not load data/products.xml. Run the site through a local server such as VS Code Live Server (opening the file directly is blocked by the browser).</p>'; };

/* ---------- reusable product markup ---------- */
function productCard(p) {
  const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return `<article class="pcard">
    <a class="pimg" href="product-details.html?id=${p.id}"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy">${off ? `<span class="badge">-${off}%</span>` : ''}</a>
    <div class="pbody"><small>${esc(p.category)}</small>
      <h3><a href="product-details.html?id=${p.id}">${esc(p.name)}</a></h3>
      <div class="rate" aria-label="Rated ${p.rating} out of 5"><span>${stars(p.rating)}</span> <small>(${p.reviews})</small></div>
      <div class="price"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
      <button class="btn dark" data-add="${p.id}"${p.stock ? '' : ' disabled'}>${p.stock ? 'Add to cart' : 'Out of stock'}</button></div></article>`;
}
function rowItem(p, rank) {
  return `<div class="row-item">${rank ? `<span class="rank">0${rank}</span>` : ''}
    <a href="product-details.html?id=${p.id}"><img src="${p.image}" alt="${esc(p.name)}"></a>
    <div><a href="product-details.html?id=${p.id}">${esc(p.name)}</a><small>${esc(p.category)} · ${stars(p.rating)}</small></div>
    <b>${money(p.price)}</b><button class="btn line" data-add="${p.id}">Add</button></div>`;
}

/* ---------- form validation: rules = { fieldName: (value, form) => 'error text' or '' } ---------- */
function validate(form, rules) {
  let ok = true;
  for (const [name, check] of Object.entries(rules)) {
    const field = form.elements[name];
    const msg = check(field.value.trim(), form);
    const out = form.querySelector(`[data-err="${name}"]`);
    if (out) out.textContent = msg;
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) ok = false;
  }
  return ok;
}
function setMsg(el, text, good) { el.textContent = text; el.className = 'form-msg ' + (good ? 'ok' : 'bad'); }

/* "Add to cart" buttons work on every page through one delegated listener */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const id = +btn.dataset.add;
  addToCart(id, 1);
  loadProducts().then(ps => toast(`${ps.find(p => p.id === id).name} added to cart`));
});

/* Newsletter form (home page) */
const news = $('#newsletter');
if (news) news.addEventListener('submit', e => {
  e.preventDefault();
  const good = emailRe.test(news.elements.email.value.trim());
  setMsg($('.form-msg', news), good ? 'Thanks for subscribing! Watch your inbox for our next edit.' : 'Please enter a valid email address.', good);
  if (good) news.reset();
});
