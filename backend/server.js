const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Sajikan file statis dari folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Koneksi Database ────────────────────────────────────────────────────────
const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'db_joy_records',
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke database:', err.message);
    process.exit(1);
  }
  console.log('✅ Terhubung ke database db_joy_records');
});

// ── Helper: kirim error 500 ─────────────────────────────────────────────────
const tanganiErrorDB = (res, err) => {
  console.error('DB Error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
};

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/v1/jurnal — Ambil semua jurnal
app.get('/api/v1/jurnal', (req, res) => {
  const sql = 'SELECT * FROM tb_jurnal ORDER BY tanggal_dibuat DESC';
  db.query(sql, (err, hasilQuery) => {
    if (err) return tanganiErrorDB(res, err);
    res.json({ success: true, data: hasilQuery });
  });
});

// GET /api/v1/jurnal/:id — Ambil satu jurnal berdasarkan id
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

// POST /api/v1/jurnal — Tambah jurnal baru
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

// PUT /api/v1/jurnal/:id — Update jurnal berdasarkan id
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

// DELETE /api/v1/jurnal/:id — Hapus jurnal berdasarkan id
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
