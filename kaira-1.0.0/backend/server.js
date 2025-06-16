const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ชี้ไปยังไฟล์ฐานข้อมูล
const dbPath = path.join(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
  }
});

// Routes ตัวอย่าง
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API: ดึงสินค้าทั้งหมด
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: ค้นหาสินค้าตามชื่อ
app.get('/api/products/search/:keyword', (req, res) => {
  const keyword = `%${req.params.keyword}%`;
  db.all("SELECT * FROM products WHERE name LIKE ?", [keyword], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: เพิ่มสินค้าลงตะกร้า
app.post('/api/cart', (req, res) => {
  const { product_id, quantity, session_id } = req.body;
  db.run("INSERT INTO cart (product_id, quantity, session_id) VALUES (?, ?, ?)",
    [product_id, quantity, session_id || 'guest'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, cart_id: this.lastID });
    });
});

// API: แสดงตะกร้าสินค้า
app.get('/api/cart/:session_id', (req, res) => {
  const session_id = req.params.session_id || 'guest';
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

// (อื่น ๆ เช่น checkout, ลบสินค้าในตะกร้า เพิ่มเติมทีหลังได้)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
