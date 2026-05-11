const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Koneksi Database (server TCC) ───────────────────────────────────────────
const db = mysql.createConnection({
  host     : '34.172.113.167',
  user     : 'admin',
  password : 'mypassword',
  database : 'notes_123230230',   // <-- ganti dengan NIM kamu
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke database:', err.message);
    process.exit(1);
  }
  console.log('✅ Terhubung ke database notes_123230230');
});

// ── Helper ──────────────────────────────────────────────────────────────────
const tanganiErrorDB = (res, err) => {
  console.error('DB Error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
};

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'JoyRecords API is running' });
});

// GET /api/v1/jurnal
app.get('/api/v1/jurnal', (req, res) => {
  const sql = 'SELECT * FROM tb_jurnal ORDER BY tanggal_dibuat DESC';
  db.query(sql, (err, hasilQuery) => {
    if (err) return tanganiErrorDB(res, err);
    res.json({ success: true, data: hasilQuery });
  });
});

// GET /api/v1/jurnal/:id
app.get('/api/v1/jurnal/:id', (req, res) => {
  const sql = 'SELECT * FROM tb_jurnal WHERE id = ?';
  db.query(sql, [req.params.id], (err, hasilQuery) => {
    if (err) return tanganiErrorDB(res, err);
    if (hasilQuery.length === 0) {
      return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan.' });
    }
    res.json({ success: true, data: hasilQuery[0] });
  });
});

// POST /api/v1/jurnal
app.post('/api/v1/jurnal', (req, res) => {
  const { judul, isi, kategori } = req.body;
  if (!judul || judul.trim() === '') {
    return res.status(400).json({ success: false, message: 'Judul wajib diisi.' });
  }
  const kategoriDipilih = kategori && kategori.trim() !== '' ? kategori.trim() : 'Umum';
  const sql = 'INSERT INTO tb_jurnal (judul, isi, kategori) VALUES (?, ?, ?)';
  db.query(sql, [judul, isi || '', kategoriDipilih], (err, hasilInsert) => {
    if (err) return tanganiErrorDB(res, err);
    res.status(201).json({
      success : true,
      message : 'Jurnal berhasil ditambahkan.',
      data    : { id: hasilInsert.insertId, judul, isi: isi || '', kategori: kategoriDipilih },
    });
  });
});

// PUT /api/v1/jurnal/:id
app.put('/api/v1/jurnal/:id', (req, res) => {
  const { judul, isi, kategori } = req.body;
  if (!judul || judul.trim() === '') {
    return res.status(400).json({ success: false, message: 'Judul wajib diisi.' });
  }
  const kategoriDipilih = kategori && kategori.trim() !== '' ? kategori.trim() : 'Umum';
  const sql = 'UPDATE tb_jurnal SET judul = ?, isi = ?, kategori = ? WHERE id = ?';
  db.query(sql, [judul, isi || '', kategoriDipilih, req.params.id], (err, hasilUpdate) => {
    if (err) return tanganiErrorDB(res, err);
    if (hasilUpdate.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Jurnal berhasil diperbarui.' });
  });
});

// DELETE /api/v1/jurnal/:id
app.delete('/api/v1/jurnal/:id', (req, res) => {
  const sql = 'DELETE FROM tb_jurnal WHERE id = ?';
  db.query(sql, [req.params.id], (err, hasilDelete) => {
    if (err) return tanganiErrorDB(res, err);
    if (hasilDelete.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Jurnal tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Jurnal berhasil dihapus.' });
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});