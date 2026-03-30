/* ════════════════════════════════════════════════════════
   JoyRecords — app.js
   fetch() CRUD → /api/v1/jurnal  |  tema: Developer Terminal
   ════════════════════════════════════════════════════════ */

'use strict';

// ── Config ──────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api/v1/jurnal';

// ── State ───────────────────────────────────────────────────────
let dataJurnal     = [];
let idPendingHapus = null;

// ── DOM Refs ─────────────────────────────────────────────────────
const formJurnal    = document.getElementById('note-form');
const inputJudul    = document.getElementById('input-judul');
const inputIsi      = document.getElementById('input-isi');
const inputKategori = document.getElementById('input-kategori');
const editIdField   = document.getElementById('edit-id');
const formTitle     = document.getElementById('form-title');
const btnSubmitText = document.getElementById('btn-submit-text');
const btnSubmit     = document.getElementById('btn-submit');
const btnCancel     = document.getElementById('btn-cancel');
const errorJudul    = document.getElementById('error-judul');
const sysOutput     = document.getElementById('sys-output');

const gridJurnal        = document.getElementById('notes-grid');
const konterJurnal      = document.getElementById('note-counter');
const inputCari         = document.getElementById('search-input');

const stateMuat         = document.getElementById('state-loading');
const stateKosong       = document.getElementById('state-empty');
const stateTakDitemukan = document.getElementById('state-not-found');

const modalBackdrop = document.getElementById('modal-overlay');
const modalBatal    = document.getElementById('modal-cancel');
const modalKonfirm  = document.getElementById('modal-confirm');
const wadahToast    = document.getElementById('toast-container');

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

/** Format tanggal ke format lokal Indonesia singkat. */
function formatTanggal(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Escape HTML untuk mencegah XSS. */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Kembalikan CSS class badge berdasarkan nama kategori. */
function badgeClass(kategori) {
  const map = {
    pribadi : 'badge--pribadi',
    kampus  : 'badge--kampus',
    koding  : 'badge--koding',
    penting : 'badge--penting',
  };
  return map[(kategori || '').toLowerCase()] ?? 'badge--umum';
}

/** Tampilkan pesan di sys-output panel bawah form. */
function setSysOutput(tipe, pesan) {
  const tag = { ok: '[OK]', err: '[ERR]', info: '[INFO]', warn: '[WARN]' };
  const cls = { ok: 'sys-ok', err: 'sys-err', info: 'sys-info', warn: 'sys-warn' };
  sysOutput.innerHTML =
    `<span class="${cls[tipe] ?? 'sys-info'}">${tag[tipe] ?? '[LOG]'}</span> ${esc(pesan)}`;
}

/**
 * Tampilkan toast notifikasi terminal-style.
 * @param {'success'|'error'|'info'} tipe
 * @param {string} pesan
 */
function tampilkanToast(tipe, pesan) {
  const tags = { success: '[OK]', error: '[ERR]', info: '[INFO]' };
  const toast = document.createElement('div');
  toast.className = `toast ${tipe}`;
  toast.innerHTML =
    `<span class="toast-tag">${tags[tipe] ?? '[LOG]'}</span><span>${esc(pesan)}</span>`;
  wadahToast.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

/** Perbarui konter record di statusbar. */
function perbaruiKonter(jumlah) {
  konterJurnal.textContent = `RECORDS: ${jumlah}`;
}

/** Tampilkan state panel yang tepat. */
function tampilkanState(state) {
  stateMuat.hidden        = state !== 'loading';
  stateKosong.hidden      = state !== 'empty';
  stateTakDitemukan.hidden = state !== 'not-found';
  gridJurnal.style.display = state === 'grid' ? '' : 'none';
}

/** Set tombol submit ke mode loading atau normal. */
function setLoadingSubmit(loading) {
  btnSubmit.disabled = loading;
  btnSubmitText.textContent = loading
    ? 'PROCESSING...'
    : (editIdField.value ? 'UPDATE_ENTRY' : 'PUSH_ENTRY');
}

// ════════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════════

/** Buat satu elemen kartu log jurnal. */
function buatKartuJurnal(jurnal, indeks) {
  const kartu = document.createElement('article');
  kartu.className      = 'log-card';
  kartu.role           = 'listitem';
  kartu.dataset.id     = jurnal.id;
  kartu.dataset.kategori = jurnal.kategori || 'Umum';

  const jdl = esc(jurnal.judul);
  const isi  = esc(jurnal.isi || '');
  const kat  = esc(jurnal.kategori || 'Umum');
  const tgl  = formatTanggal(jurnal.tanggal_dibuat);
  const bCls = badgeClass(jurnal.kategori);
  const logId = String(indeks + 1).padStart(3, '0');

  kartu.innerHTML = `
    <div class="log-card-bar">
      <span class="log-id">LOG_${logId}</span>
      <span class="log-kategori-badge ${bCls}">${kat.toUpperCase()}</span>
    </div>
    <div class="log-card-body">
      <h3 class="log-judul">${jdl}</h3>
      ${isi ? `<p class="log-isi">${isi}</p>` : ''}
    </div>
    <div class="log-card-footer">
      <time class="log-timestamp" datetime="${jurnal.tanggal_dibuat}">${tgl}</time>
      <div class="log-actions">
        <button class="btn-log-action btn-log-edit"
          id="btn-edit-${jurnal.id}"
          aria-label="Edit jurnal: ${jdl}"
          data-id="${jurnal.id}">EDIT</button>
        <button class="btn-log-action btn-log-del"
          id="btn-del-${jurnal.id}"
          aria-label="Hapus jurnal: ${jdl}"
          data-id="${jurnal.id}">DEL</button>
      </div>
    </div>`;

  kartu.querySelector('.btn-log-edit').addEventListener('click', () => mulaiEdit(jurnal));
  kartu.querySelector('.btn-log-del').addEventListener('click',  () => bukaModalHapus(jurnal.id, jurnal.judul));

  return kartu;
}

/** Render semua jurnal ke log-grid berdasarkan kata kunci. */
function renderJurnal(katakunci = '') {
  const q = katakunci.trim().toLowerCase();
  const terfilter = q
    ? dataJurnal.filter(j =>
        j.judul.toLowerCase().includes(q) ||
        (j.isi      || '').toLowerCase().includes(q) ||
        (j.kategori || '').toLowerCase().includes(q)
      )
    : dataJurnal;

  gridJurnal.innerHTML = '';

  if (dataJurnal.length === 0)  { tampilkanState('empty');     return; }
  if (terfilter.length === 0)   { tampilkanState('not-found'); return; }

  tampilkanState('grid');
  terfilter.forEach((j, i) => gridJurnal.appendChild(buatKartuJurnal(j, i)));
}

// ════════════════════════════════════════════════════════════════
// FORM STATE
// ════════════════════════════════════════════════════════════════

/** Reset form ke mode tambah baru. */
function resetForm() {
  formJurnal.reset();
  editIdField.value         = '';
  formTitle.textContent     = 'NEW_ENTRY.log';
  btnSubmitText.textContent = 'PUSH_ENTRY';
  btnCancel.hidden          = true;
  errorJudul.textContent    = '';
  inputJudul.classList.remove('is-error');
  setSysOutput('ok', 'System ready. Awaiting input...');
  inputJudul.focus();
}

/** Isi form dengan data jurnal untuk mode edit. */
function mulaiEdit(jurnal) {
  editIdField.value         = jurnal.id;
  inputJudul.value          = jurnal.judul;
  inputIsi.value            = jurnal.isi || '';
  if (inputKategori) {
    inputKategori.value = jurnal.kategori || 'Umum';
  }
  formTitle.textContent     = `EDIT_ENTRY_${jurnal.id}.log`;
  btnSubmitText.textContent = 'UPDATE_ENTRY';
  btnCancel.hidden          = false;
  errorJudul.textContent    = '';
  inputJudul.classList.remove('is-error');
  setSysOutput('info', `Editing record #${jurnal.id}. Modify fields and PUSH.`);

  formJurnal.closest('.terminal-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  inputJudul.focus();
}

// ════════════════════════════════════════════════════════════════
// API CALLS
// ════════════════════════════════════════════════════════════════

/** GET /api/v1/jurnal */
async function ambilSemuaJurnal() {
  tampilkanState('loading');
  try {
    const res   = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json  = await res.json();
    dataJurnal  = json.data ?? [];
    perbaruiKonter(dataJurnal.length);
    renderJurnal(inputCari.value);
  } catch (err) {
    tampilkanState('empty');
    tampilkanToast('error', 'Koneksi server gagal. Pastikan node server.js berjalan.');
    setSysOutput('err', `Connection refused: ${err.message}`);
    console.error('[ambilSemuaJurnal]', err);
  }
}

/** POST /api/v1/jurnal */
async function tambahJurnal(judul, isi, kategori) {
  const res = await fetch(API_BASE, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ judul, isi, kategori }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/** PUT /api/v1/jurnal/:id */
async function perbaruiJurnal(id, judul, isi, kategori) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method  : 'PUT',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ judul, isi, kategori }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/** DELETE /api/v1/jurnal/:id */
async function hapusJurnal(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ════════════════════════════════════════════════════════════════
// MODAL HAPUS
// ════════════════════════════════════════════════════════════════

function bukaModalHapus(id, judul) {
  idPendingHapus = id;
  const target = document.getElementById('modal-body');
  if (target) target.textContent = `"${judul}"`;
  modalBackdrop.hidden = false;
}

function tutupModalHapus() {
  modalBackdrop.hidden = true;
  idPendingHapus = null;
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

/* ─ Form Submit ─ */
formJurnal.addEventListener('submit', async (e) => {
  e.preventDefault();

  const judul    = inputJudul.value.trim();
  const isi      = inputIsi.value.trim();
  const kategori = inputKategori ? inputKategori.value.trim() : 'Umum';

  if (!judul) {
    inputJudul.classList.add('is-error');
    errorJudul.textContent = 'Field JUDUL tidak boleh kosong.';
    setSysOutput('err', 'Validation failed: JUDUL is required.');
    inputJudul.focus();
    return;
  }

  inputJudul.classList.remove('is-error');
  errorJudul.textContent = '';
  setLoadingSubmit(true);
  setSysOutput('info', 'Sending payload to API...');

  const sedangEdit = Boolean(editIdField.value);

  try {
    if (sedangEdit) {
      await perbaruiJurnal(editIdField.value, judul, isi, kategori);
      tampilkanToast('success', `Entry #${editIdField.value} updated successfully.`);
      setSysOutput('ok', `Record #${editIdField.value} patched. Changes committed.`);
    } else {
      const hasil = await tambahJurnal(judul, isi, kategori);
      tampilkanToast('success', 'New entry pushed to log.');
      setSysOutput('ok', `New record created with id=${hasil.data?.id ?? '–'}.`);
    }
    resetForm();
    await ambilSemuaJurnal();
  } catch (err) {
    tampilkanToast('error', `Push failed: ${err.message}`);
    setSysOutput('err', `API error: ${err.message}`);
    console.error('[submit]', err);
  } finally {
    setLoadingSubmit(false);
  }
});

/* ─ Batal Edit ─ */
btnCancel.addEventListener('click', resetForm);

/* ─ Pencarian real-time ─ */
inputCari.addEventListener('input', () => renderJurnal(inputCari.value));

/* ─ Modal: batal ─ */
modalBatal.addEventListener('click', tutupModalHapus);

/* ─ Modal: konfirmasi hapus ─ */
modalKonfirm.addEventListener('click', async () => {
  if (!idPendingHapus) return;

  const id = idPendingHapus;
  tutupModalHapus();

  const kartu = gridJurnal.querySelector(`[data-id="${id}"]`);
  if (kartu) kartu.classList.add('removing');

  try {
    await hapusJurnal(id);
    dataJurnal = dataJurnal.filter(j => j.id !== Number(id));
    perbaruiKonter(dataJurnal.length);
    setTimeout(() => renderJurnal(inputCari.value), 360);
    tampilkanToast('success', `Record #${id} deleted from log.`);
    setSysOutput('ok', `rm -rf record/${id} — exit code 0.`);
  } catch (err) {
    if (kartu) kartu.classList.remove('removing');
    tampilkanToast('error', `Delete failed: ${err.message}`);
    setSysOutput('err', `rm: cannot remove — ${err.message}`);
    console.error('[hapus]', err);
  }
});

/* ─ Klik area gelap untuk tutup modal ─ */
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) tutupModalHapus();
});

/* ─ ESC untuk tutup modal ─ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalBackdrop.hidden) tutupModalHapus();
});

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
(async () => {
  setSysOutput('info', 'Booting JoyRecords daemon...');
  await ambilSemuaJurnal();
  setSysOutput('ok', `System ready. ${dataJurnal.length} record(s) loaded.`);
  inputJudul.focus();
})();
