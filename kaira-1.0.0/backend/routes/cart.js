async function fetchCart() {
  const res = await fetch('/api/cart/guest');
  const cart = await res.json();
  const container = document.getElementById('offcanvasCartItems');
  container.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    container.innerHTML += `
      <div class="cart-item d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center">
          <img src="/${item.image}" alt="${item.name}" width="50" class="me-2">
          <div>
            <strong>${item.name}</strong><br>
            ฿${item.price} x ${item.quantity} = ฿${subtotal}
          </div>
        </div>
        <div class="d-flex align-items-center">
          <button onclick="updateQty(${item.id}, ${item.quantity - 1})" class="btn btn-sm btn-outline-secondary">−</button>
          <span class="mx-2">${item.quantity}</span>
          <button onclick="updateQty(${item.id}, ${item.quantity + 1})" class="btn btn-sm btn-outline-secondary">+</button>
          <button onclick="deleteItem(${item.id})" class="btn btn-sm btn-outline-danger ms-2">🗑</button>
        </div>
      </div>
    `;
  });

  document.getElementById('cartTotal').textContent = '฿' + total;
}

async function updateQty(id, qty) {
  if (qty <= 0) {
    await deleteItem(id);
  } else {
    await fetch('/api/cart/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty })
    });
  }
  fetchCart();
}

async function deleteItem(id) {
  await fetch('/api/cart/' + id, { method: 'DELETE' });
  fetchCart();
}
