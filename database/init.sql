    -- Buat database jika belum ada
    CREATE DATABASE IF NOT EXISTS db_joy_records;

    -- Gunakan database db_joy_records
    USE db_joy_records;

    -- Buat tabel tb_jurnal
    CREATE TABLE IF NOT EXISTS tb_jurnal (
        id             INT           NOT NULL AUTO_INCREMENT,
        judul          VARCHAR(255)  NOT NULL,
        isi            TEXT,
        kategori       VARCHAR(50)   DEFAULT 'Umum',
        tanggal_dibuat DATETIME      DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    );
