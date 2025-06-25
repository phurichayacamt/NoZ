const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // เพิ่ม bcrypt สำหรับการเข้ารหัสรหัสผ่าน
const app = express();
const PORT = 3000;

// เสิร์ฟไฟล์จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

console.log("🔥🔥 Launch the latest Server.js! 🔥🔥");

// ไฟล์เว็บ (HTML/CSS/JS) จาก root project
const staticPath = path.resolve(__dirname, '..');
app.use(express.static(staticPath));

// รูปจาก backend/public/images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// เชื่อมฐานข้อมูล
const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
  }
});

// สร้างตาราง users 
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('❌ เกิดข้อผิดพลาดในการสร้างตาราง:', err.message);
    } else {
      console.log('✅ สร้างตาราง users สำเร็จ');
    }
  });
});

// API: ลงทะเบียนผู้ใช้
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  // ตรวจสอบว่าอีเมลมีในฐานข้อมูลยัง
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ message: 'This email is already in use' });
    }

    // เข้ารหัสรหัสผ่าน
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'An encoding error occurred' });
      }

      // บันทึกข้อมูลผู้ใช้ลงในฐานข้อมูล
      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      stmt.run([name, email, hashedPassword], function (err) {
        if (err) {
          return res.status(500).json({ error: 'An error occurred while saving user data.' });
        }
        res.status(201).json({ message: 'Successfully registered', userId: this.lastID });
      });
    });
  });
});
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // // ตรวจสอบว่าอีเมลมีในฐานข้อมูลหรือไม่

  // db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
  //   if (err) {
  //     return res.status(500).json({ error: err.message });
  //   }

  //   if (!user) {
  //     return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  //   }

  // เปรียบเทียบรหัสผ่านที่กรอกกับรหัสผ่านที่เก็บไว้ในฐานข้อมูล
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'There was an error verifying password' });
    }

    if (!result) {
      return res.status(400).json({ message: 'Email or password is incorrect' });
    }

    // ถ้ารหัสผ่านถูก
    res.status(200).json({ message: 'Login successful', userId: user.id });
  });
});

//  admin (เพิ่ม/แก้/ลบสินค้า)
app.use('/api/admin', require('./routes/admin'));

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

//  API: กรองสินค้าตามหมวดหมู่
app.get('/api/products/category/:cat', (req, res) => {
  db.all("SELECT * FROM products WHERE category = ?", [req.params.cat], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

//  API: เพิ่มสินค้าลงตะกร้า
app.post('/api/cart', (req, res) => {
  const { product_id, quantity, session_id } = req.body;
  db.run("INSERT INTO carts (product_id, quantity, session_id) VALUES (?, ?, ?)",
    [product_id, quantity, session_id || 'guest'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, cart_id: this.lastID });
    });
});

//  API: แสดงตะกร้าสินค้า
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

// API: ลบสินค้าจากตะกร้า
app.delete('/api/cart/:id', (req, res) => {
  db.run("DELETE FROM carts WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// API: อัปเดตจำนวนสินค้าในตะกร้า
app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  db.run("UPDATE carts SET quantity = ? WHERE id = ?", [quantity, req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// Routes พิเศษ บังคับเสิร์ฟ index.html และ shop.html
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/shop.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'shop.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

//  Default route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

//  Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.put('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, image } = req.body;

  const query = `UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image = ? WHERE id = ?`;
  db.run(query, [name, category, price, stock, image, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Product updated successfully' });
  });
});
