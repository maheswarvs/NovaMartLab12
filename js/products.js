/* NOVA MART – home sections, products page (search / filter / sort) and product details page */
const categoriesOf = ps => [...new Set(ps.map(p => p.category))];

/* Runs a renderer only on the page that contains the target element */
function onPage(selector, render) {
  const el = $(selector);
  if (el) loadProducts().then(render).catch(() => showLoadError(el));
}

/* ---------- Home page ---------- */
onPage('#home-featured', ps => {
  $('#home-cats').innerHTML = categoriesOf(ps).map(c => {
    const items = ps.filter(p => p.category === c);
    return `<a class="cat" href="products.html?cat=${encodeURIComponent(c)}"><img src="${items[0].image}" alt=""><span>${c}<small>${items.length} products</small></span></a>`;
  }).join('');

  const [big, ...rest] = ps.filter(p => p.featured).slice(0, 4);
  $('#home-featured').innerHTML = `
    <a class="feat-big" href="product-details.html?id=${big.id}"><img src="${big.image}" alt="${esc(big.name)}">
      <div><span class="tag">Editor's pick</span><h3>${esc(big.name)}</h3><p>${esc(big.description)}</p><b>${money(big.price)}</b></div></a>
    <div class="list">${rest.map(p => rowItem(p)).join('')}</div>`;

  $('#home-best').innerHTML = ps.filter(p => p.bestseller).slice(0, 6).map((p, i) => rowItem(p, i + 1)).join('');
});

/* ---------- Products page ---------- */
onPage('#shop-grid', ps => {
  const params = new URLSearchParams(location.search);
  const state = { q: params.get('q') || '', cat: params.get('cat') || 'All', sort: 'featured' };
  const cats = ['All', ...categoriesOf(ps)];
  const countIn = c => c === 'All' ? ps.length : ps.filter(p => p.category === c).length;

  $('#cat-filter').innerHTML = cats.map(c => `<button data-cat="${c}">${c}<small>${countIn(c)}</small></button>`).join('');
  $('#shop-q').value = state.q;

  function draw() {
    const term = state.q.toLowerCase();
    const list = ps.filter(p => (state.cat === 'All' || p.category === state.cat) &&
      `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term));
    const sorters = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
    if (sorters[state.sort]) list.sort(sorters[state.sort]);
    $('#shop-count').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
    $('#shop-grid').innerHTML = list.length ? list.map(productCard).join('') : '<p class="empty">No products match your search. Try another word or category.</p>';
    $$('#cat-filter button').forEach(b => b.classList.toggle('on', b.dataset.cat === state.cat));
  }
  $('#shop-q').addEventListener('input', e => { state.q = e.target.value.trim(); draw(); });
  $('#shop-sort').addEventListener('change', e => { state.sort = e.target.value; draw(); });
  $('#cat-filter').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { state.cat = b.dataset.cat; draw(); } });
  draw();
});

/* ---------- Product details page ---------- */
onPage('#product-detail', ps => {
  const box = $('#product-detail');
  const p = ps.find(x => x.id === +new URLSearchParams(location.search).get('id'));
  if (!p) { box.innerHTML = '<p class="empty">Product not found. <a href="products.html">Browse all products</a></p>'; return; }

  document.title = `${p.name} – NOVA MART`;
  const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const max = Math.min(10, p.stock);
  box.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="products.html">Shop</a> / <a href="products.html?cat=${encodeURIComponent(p.category)}">${esc(p.category)}</a> / ${esc(p.name)}</nav>
    <div class="pd">
      <div class="pd-img"><img src="${p.image}" alt="${esc(p.name)}"></div>
      <div class="pd-info">
        <span class="tag">${esc(p.category)}</span>
        <h1>${esc(p.name)}</h1>
        <div class="rate"><span>${stars(p.rating)}</span> <small>${p.rating} · ${p.reviews} reviews</small></div>
        <div class="pd-price">${money(p.price)}${off ? `<s>${money(p.oldPrice)}</s><em>${off}% OFF</em>` : ''}</div>
        <p>${esc(p.description)}</p>
        <p class="stock ${p.stock ? 'ok' : 'bad'}">${p.stock ? (p.stock <= 10 ? `Only ${p.stock} left in stock` : 'In stock') : 'Out of stock'}</p>
        ${p.stock ? `<div class="row"><div class="qty"><button id="q-dec" aria-label="Decrease quantity">−</button><input id="q-val" value="1" readonly aria-label="Quantity"><button id="q-inc" aria-label="Increase quantity">+</button></div>
          <button class="btn dark" id="pd-add">Add to cart</button></div>` : ''}
        <ul class="perks"><li>Free delivery on orders above ₹999</li><li>14-day easy returns</li><li>Cash on delivery available</li></ul>
      </div></div>
    <section class="related"><div class="sec-head"><h2>You may also like</h2></div><div id="related" class="grid" style="grid-template-columns:repeat(4,1fr)"></div></section>`;

  if (p.stock) {
    const val = $('#q-val');
    $('#q-dec').onclick = () => { val.value = Math.max(1, +val.value - 1); };
    $('#q-inc').onclick = () => { val.value = Math.min(max, +val.value + 1); };
    $('#pd-add').onclick = () => { addToCart(p.id, +val.value); toast(`${val.value} × ${p.name} added to cart`); };
  }
  const others = ps.filter(x => x.id !== p.id);
  const related = [...others.filter(x => x.category === p.category), ...others.filter(x => x.category !== p.category)].slice(0, 4);
  $('#related').innerHTML = related.map(productCard).join('');
});
