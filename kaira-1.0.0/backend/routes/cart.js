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
// ก่อน INSERT ให้ตรวจสอบว่าสินค้าในตะกร้ารวมกับที่กำลังเพิ่ม <= stock
db.get("SELECT stock FROM products WHERE id = ?", [product_id], (err, row) => {
  if (err || !row) return res.status(400).json({ success: false, error: 'ไม่พบสินค้า' });

  const availableStock = row.stock;
  db.get("SELECT SUM(quantity) AS total FROM carts WHERE product_id = ? AND session_id = ?", [product_id, session_id], (err2, row2) => {
    const currentQty = row2?.total || 0;
    if (currentQty + quantity > availableStock) {
      return res.status(400).json({ success: false, error: 'จำนวนเกินสต็อก' });
    }

    db.run("INSERT INTO carts (product_id, quantity, session_id) VALUES (?, ?, ?)",
      [product_id, quantity, session_id],
      function(err3) {
        if (err3) return res.status(500).json({ success: false, error: err3.message });
        res.json({ success: true, cart_id: this.lastID });
      }
    );
  });
});