const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();   //ถ้าเป็นwindow แก้เป็น 'sqlite3' แทน 'sqlite3.verbose()'
const path = require('path');

const app = express();
const PORT = 3000;

// ✅ Serve static files
const staticPath = path.join(__dirname, 'public');
console.log("📂 Serving static from:", staticPath);
console.log("🔥🔥 เริ่มต้น Server.js ตัวล่าสุดแล้ว! 🔥🔥");

app.use(express.static(staticPath));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Routes
app.use('/api/admin', require('./routes/admin'));

// ✅ เชื่อมต่อฐานข้อมูล
const dbPath = path.join(__dirname, '/data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
  }
});

// ✅ API: ดึงสินค้าทั้งหมด
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ API: ค้นหาสินค้าตามชื่อ
app.get('/api/products/search/:keyword', (req, res) => {
  const keyword = `%${req.params.keyword}%`;
  db.all("SELECT * FROM products WHERE name LIKE ?", [keyword], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ API: เพิ่มสินค้าลงตะกร้า
app.post('/api/cart', (req, res) => {
  const { product_id, quantity, session_id } = req.body;
  db.run("INSERT INTO cart (product_id, quantity, session_id) VALUES (?, ?, ?)",
    [product_id, quantity, session_id || 'guest'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, cart_id: this.lastID });
    });
});

// ✅ API: แสดงตะกร้าสินค้า
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

// ✅ Default route (ไว้ท้ายสุดเสมอ)
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
