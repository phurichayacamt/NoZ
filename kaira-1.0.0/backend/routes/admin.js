const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../data/database.sqlite'));

// Multer config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/images'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// CREATE
router.post('/products', upload.single('image'), (req, res) => {
  const { name, category, price } = req.body;
  const image = req.file ? 'images/' + req.file.filename : null;

  db.run(
    'INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)',
    [name, category, price, image],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// READ
router.get('/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// DELETE
router.delete('/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// UPDATE
router.put('/products/:id', upload.single('image'), (req, res) => {
  const { name, category, price } = req.body;
  const id = req.params.id;

  let sql = 'UPDATE products SET name = ?, category = ?, price = ?';
  const params = [name, category, price];

  if (req.file) {
    sql += ', image = ?';
    params.push('images/' + req.file.filename);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


module.exports = router;