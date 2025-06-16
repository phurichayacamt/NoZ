// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../data/database.sqlite'));

// เพิ่มสินค้าลงตะกร้า
router.post('/', (req, res) => {
  const { product_id, quantity, session_id } = req.body;
  db.run("INSERT INTO cart (product_id, quantity, session_id) VALUES (?, ?, ?)",
    [product_id, quantity, session_id || 'guest'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, cart_id: this.lastID });
    });
});

// แสดงตะกร้าสินค้าของ session_id
router.get('/:session_id', (req, res) => {
  const session_id = req.params.session_id;
  db.all(
    `SELECT cart.id, products.*, cart.quantity
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.session_id = ?`,
    [session_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
