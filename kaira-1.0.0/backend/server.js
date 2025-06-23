const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// ประกาศตัวแปร `app` ก่อนการใช้งาน
//const app = express(); // **ประกาศ app ก่อนการใช้งาน**
const PORT = 3000;

// เปรียบเทียบรหัสผ่าน
const match = await bcrypt.compare('123456', '$2b$10$7hLo1VfVfTQk9sm8sQtUE5a6dQjHhB7fXrXT...');
console.log(match); // true หรือ false

// ✅ กำหนดให้ Express รับข้อมูล JSON
app.use(express.json()); // สำหรับการรับข้อมูล JSON
app.use(express.urlencoded({ extended: true })); // สำหรับการรับข้อมูลจากฟอร์ม

// ✅ เชื่อมต่อฐานข้อมูล
const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
  }
});

// ✅ สร้างตาราง `users` หากยังไม่มี
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error("เกิดข้อผิดพลาดในการสร้างตาราง users:", err.message);
  } else {
    console.log("✅ ตาราง users ถูกสร้างขึ้นเรียบร้อยแล้ว");
  }
});

console.log("🔥🔥 The latest Server.js is here 🔥🔥");

// ✅ เสิร์ฟไฟล์เว็บ (HTML/CSS/JS) จาก root project
const staticPath = path.resolve(__dirname, '..');
app.use(express.static(staticPath));

// ✅ เสิร์ฟรูปจาก backend/public/images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ เส้นทาง admin (เพิ่ม/แก้/ลบสินค้า)
app.use('/api/admin', require('./routes/admin'));

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

// ✅ API: กรองสินค้าตามหมวดหมู่
app.get('/api/products/category/:cat', (req, res) => {
  db.all("SELECT * FROM products WHERE category = ?", [req.params.cat], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ API: เพิ่มสินค้าลงตะกร้า
app.post('/api/cart', (req, res) => {
  const { product_id, quantity, session_id } = req.body;
  db.run("INSERT INTO carts (product_id, quantity, session_id) VALUES (?, ?, ?)",
    [product_id, quantity, session_id || 'guest'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, cart_id: this.lastID });
    });
});

// ✅ API: แสดงตะกร้าสินค้า
app.get('/api/cart/guest', (req, res) => {
  const sql = 
      `SELECT
          carts.id,
          carts.quantity,
          products.id AS product_id,
          products.name,
          products.price,
          products.image,
          products.stock
      FROM carts
      JOIN products ON carts.product_id = products.id
      WHERE carts.session_id = ?`
  ;
  db.all(sql, ['guest'], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(rows);
  });
});

// ✅ API: ลบสินค้าจากตะกร้า
app.delete('/api/cart/:id', (req, res) => {
  db.run("DELETE FROM carts WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ✅ API: อัปเดตจำนวนสินค้าในตะกร้า
app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  db.run("UPDATE carts SET quantity = ? WHERE id = ?", [quantity, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ✅ Routes พิเศษ: บังคับเสิร์ฟ index.html และ shop.html
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/shop.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'shop.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname,'public' ,'admin.html'));
});

// ✅ Default route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// API สำหรับการลงทะเบียนผู้ใช้
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (user) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
        res.json({ message: "สมัครสมาชิกเรียบร้อย" });
      }
    );
  });
});

// ✅ API: ล็อกอิน
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error("Error in SQL query:", err.message);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล" });
    }

    console.log('User found:', user); // ตรวจสอบข้อมูลที่ได้จากฐานข้อมูล

    if (!user) {
      return res.status(400).json({ success: false, message: "ไม่พบผู้ใช้งานนี้" });
    }

    // ตรวจสอบรหัสผ่านที่กรอกกับรหัสที่ถูกแฮชในฐานข้อมูล
    console.log('Password to compare:', password); // ตรวจสอบรหัสผ่านที่กรอก
    console.log('Stored hashed password:', user.password); // ตรวจสอบรหัสผ่านที่แฮช

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    res.json({
      success: true,
      message: "ล็อกอินสำเร็จ",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
});



// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});