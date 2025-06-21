const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

console.log("🔥🔥 เริ่มต้น Server.js ตัวล่าสุดแล้ว! 🔥🔥");

// ✅ เสิร์ฟไฟล์เว็บ (HTML/CSS/JS) จาก root project
const staticPath = path.resolve(__dirname, '..');
app.use(express.static(staticPath));

// ✅ เสิร์ฟรูปจาก backend/public/images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ เชื่อมต่อฐานข้อมูล
const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
  }
});

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
  db.all(`
    SELECT cart.id, products.*, cart.quantity
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

// ✅ API: ลบสินค้าจากตะกร้า
app.delete('/api/cart/:id', (req, res) => {
  db.run("DELETE FROM cart WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});


// ✅ API: อัปเดตจำนวนสินค้าในตะกร้า
app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  db.run("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, req.params.id], function(err) {
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

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});




// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const sqlite3 = require('sqlite3').verbose();   //ถ้าเป็นwindow แก้เป็น 'sqlite3' แทน 'sqlite3.verbose()'
// const path = require('path');

// const app = express();
// const PORT = 3000;
// const frontendPath = path.join(__dirname, '..'); // ถ้าไฟล์ HTML อยู่ที่ kaira-1.0.0/

// // ✅ Serve static files
// const staticPath = path.join(__dirname, 'public');
// console.log("📂 Serving static from:", staticPath);
// console.log("🔥🔥 เริ่มต้น Server.js ตัวล่าสุดแล้ว! 🔥🔥");

// app.use('/images', express.static(path.join(__dirname, '/public/images')));
// app.use(express.static(path.join(__dirname, '..'))); 
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(frontendPath));




// // ✅ Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // ✅ Routes
// app.use('/api/admin', require('./routes/admin'));

// // ✅ เชื่อมต่อฐานข้อมูล
// const dbPath = path.join(__dirname, '/data/database.sqlite');
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err.message);
//   } else {
//     console.log('✅ เชื่อมต่อ database.sqlite สำเร็จ');
//   }
// });

// // ✅ API: ดึงสินค้าทั้งหมด
// app.get('/api/products', (req, res) => {
//   db.all("SELECT * FROM products", [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// });

// // ✅ API: ค้นหาสินค้าตามชื่อ
// app.get('/api/products/search/:keyword', (req, res) => {
//   const keyword = `%${req.params.keyword}%`;
//   db.all("SELECT * FROM products WHERE name LIKE ?", [keyword], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// });

// // ✅ API: เพิ่มสินค้าลงตะกร้า
// app.post('/api/cart', (req, res) => {
//   const { product_id, quantity, session_id } = req.body;
//   db.run("INSERT INTO cart (product_id, quantity, session_id) VALUES (?, ?, ?)",
//     [product_id, quantity, session_id || 'guest'],
//     function(err) {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json({ success: true, cart_id: this.lastID });
//     });
// });

// // ✅ API: แสดงตะกร้าสินค้า
// app.get('/api/cart/:session_id', (req, res) => {
//   const session_id = req.params.session_id || 'guest';
//   db.all(
//     `SELECT cart.id, products.*, cart.quantity
//      FROM cart
//      JOIN products ON cart.product_id = products.id
//      WHERE cart.session_id = ?`,
//     [session_id],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json(rows);
//     }
//   );
// });

// // ✅ Default route (ไว้ท้ายสุดเสมอ)
// app.get('/', (req, res) => {
//   res.send('✅ API is running...');
// });

// // ✅ Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });

// app.delete('/api/cart/:id', (req, res) => {
//   db.run("DELETE FROM cart WHERE id = ?", [req.params.id], function(err) {
//     if (err) return res.status(500).json({ success: false, error: err.message });
//     res.json({ success: true });
//   });
// });
// app.get('/api/products/category/:cat', (req, res) => {
//   db.all("SELECT * FROM products WHERE category = ?", [req.params.cat], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// });
