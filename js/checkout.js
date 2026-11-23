/* NOVA MART – checkout: order summary, validation and order confirmation */
const checkoutForm = $('#checkout-form');

if (checkoutForm) {
  checkoutForm.addEventListener('submit', e => e.preventDefault());   // never let the form submit natively while data loads
  loadProducts().then(products => {
    const lines = cartLines(products), area = $('#checkout-area');
    if (!lines.length) {
      area.innerHTML = '<div class="empty"><p>Your cart is empty, so there is nothing to check out.</p><br><a class="btn dark" href="products.html">Continue shopping</a></div>';
      return;
    }
    const totals = cartTotals(lines);
    $('#co-lines').innerHTML = lines.map(({ p, qty }) => `<div class="co-line"><span>${esc(p.name)} × ${qty}</span><span>${money(p.price * qty)}</span></div>`).join('');
    $('#co-sub').textContent = money(totals.subtotal);
    $('#co-ship').textContent = totals.shipping ? money(totals.shipping) : 'Free';
    $('#co-total').textContent = money(totals.total);

    const online = () => checkoutForm.elements.payment.value === 'online';
    const toggleCard = () => { $('#card-fields').hidden = !online(); };
    $$('input[name=payment]', checkoutForm).forEach(r => r.addEventListener('change', toggleCard));
    toggleCard();

    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      const rules = {
        name: v => v.length >= 2 ? '' : 'Enter your full name.',
        email: v => emailRe.test(v) ? '' : 'Enter a valid email address.',
        phone: v => /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a 10-digit Indian mobile number.',
        address: v => v.length >= 10 ? '' : 'Enter your full delivery address (at least 10 characters).',
        city: v => v ? '' : 'Enter your city.',
        pincode: v => /^\d{6}$/.test(v) ? '' : 'Enter a 6-digit PIN code.'
      };
      if (online()) Object.assign(rules, {
        card: v => /^\d{16}$/.test(v.replace(/\s/g, '')) ? '' : 'Enter a 16-digit card number.',
        expiry: v => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) ? '' : 'Use MM/YY format.',
        cvv: v => /^\d{3}$/.test(v) ? '' : 'Enter the 3-digit CVV.'
      });
      if (!validate(checkoutForm, rules)) { $('[aria-invalid=true]', checkoutForm)?.focus(); return; }

      const f = checkoutForm.elements;
      const order = {
        id: 'NM' + Date.now().toString().slice(-8), date: new Date().toISOString(),
        customer: { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
          address: `${f.address.value.trim()}, ${f.city.value.trim()} - ${f.pincode.value.trim()}` },
        items: lines.map(l => ({ id: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price })),
        totals, payment: online() ? 'Online payment (simulated)' : 'Cash on delivery'   // card details are never stored
      };
      const orders = JSON.parse(localStorage.getItem('novamart_orders') || '[]');
      orders.push(order);
      localStorage.setItem('novamart_orders', JSON.stringify(orders));
      saveCart([]);

      area.innerHTML = `<div class="confirm"><h2>Thank you, ${esc(order.customer.name.split(' ')[0])}! Your order is confirmed.</h2>
        <p>Order number <b>${order.id}</b> · ${esc(order.payment)} · Total <b>${money(totals.total)}</b></p>
        <p>We will deliver to ${esc(order.customer.address)}. A confirmation will be sent to ${esc(order.customer.email)}.</p><br>
        <a class="btn dark" href="products.html">Continue shopping</a></div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }).catch(() => showLoadError($('#checkout-area')));
}
