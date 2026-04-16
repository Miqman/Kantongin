# Project Plan — Aplikasi Pencatatan Keuangan Pribadi

> **Visi:** Membuat pencatatan keuangan pribadi menjadi kebiasaan mudah yang bisa dilakukan dalam hitungan detik, kapan saja dan di mana saja.

---

## Ringkasan Eksekutif

Aplikasi web mobile-first yang dirancang untuk membantu pengguna mencatat, mengelola, dan memantau pengeluaran keuangan sehari-hari secara sederhana, cepat, dan ringan. Fokus pada kecepatan input ≤10 detik, kejelasan data, dan pengalaman pengguna yang intuitif di perangkat seluler. Tidak memerlukan fitur perbankan kompleks.

Aplikasi dapat **digunakan tanpa login** (mode tamu) — semua data disimpan secara lokal di perangkat. Pengguna dapat membuat akun kapan saja untuk mengaktifkan sinkronisasi cloud, backup, dan fitur lanjutan.

---

## Target Pengguna

| Persona | Karakteristik | Kebutuhan Utama |
|---|---|---|
| Mahasiswa / Gen-Z | Terbatas budget, sering transaksi kecil, aktif di mobile | Input cepat, kategori sederhana, ringkasan harian |
| Pekerja / Young Professional | Pendapatan tetap, ingin kontrol pengeluaran, tidak mau ribet | Dashboard bulanan, budget alert, ekspor data |
| Freelancer / UMKM | Arus kas tidak tetap, butuh pencatatan terstruktur | Filter transaksi, riwayat lengkap, backup |

> **Batasan fase awal:** Tidak menargetkan fitur investasi, pinjaman, atau integrasi bank otomatis.

---

## Mode Tamu (Tanpa Login)

Aplikasi mendukung dua mode penggunaan untuk menurunkan friction onboarding semaksimal mungkin:

| | Mode Tamu | Mode Akun |
|---|---|---|
| **Login diperlukan** | Tidak | Ya |
| **Penyimpanan data** | `localStorage` + IndexedDB (lokal) | Supabase cloud |
| **Input transaksi** | ✅ | ✅ |
| **Dashboard & riwayat** | ✅ | ✅ |
| **Manajemen kategori** | ✅ | ✅ |
| **Filter & pencarian** | ✅ | ✅ |
| **Preferensi tema** | ✅ (tersimpan lokal) | ✅ (tersimpan di profil) |
| **Sinkronisasi Google Sheets** | ❌ | ✅ |
| **Budget & notifikasi** | ❌ | ✅ |
| **Ekspor CSV / PDF** | ✅ | ✅ |
| **Sinkronisasi multi-device** | ❌ | ✅ |
| **Backup & pemulihan data** | ❌ | ✅ |

### Alur Onboarding Mode Tamu

```
Buka aplikasi
└── Tanpa halaman login → langsung ke Beranda (mode tamu)
    ├── Gunakan semua fitur inti secara normal
    └── Banner/prompt non-intrusif: "Buat akun untuk backup & sync"
        └── Tap → halaman registrasi → migrasi data lokal ke cloud otomatis
```

### Kebijakan Data Mode Tamu

- Data disimpan sepenuhnya di perangkat pengguna (`localStorage` + IndexedDB)
- Tidak ada data yang dikirim ke server selama mode tamu aktif
- Saat pengguna membuat akun, semua data lokal **dimigrasikan otomatis** ke cloud — tidak ada yang hilang
- Jika pengguna menghapus cache browser, data mode tamu akan ikut terhapus — pengguna diperingatkan saat pertama kali menggunakan aplikasi

### Implementasi Teknis

- Gunakan **Dexie.js** (wrapper IndexedDB) sebagai storage engine untuk mode tamu
- Buat abstraksi layer data sehingga komponen tidak perlu tahu apakah data berasal dari lokal atau Supabase
- Saat login pertama kali: jalankan fungsi `migrateGuestToCloud(userId)` yang membaca semua record lokal dan menulis ke Supabase dalam batch
- Setelah migrasi berhasil, bersihkan data lokal

---

## Timeline Proyek

```
Minggu 1–6    │ Phase 1 — MVP         │ Foundation + core features
Minggu 7–12   │ Phase 2 — Growth      │ Integrasi + budget + ekspor
Minggu 13–20  │ Phase 3 — Scale       │ Multi-device + OCR
```

---

## Phase 1 — MVP (Minggu 1–6)

### Minggu 1–2 · Foundation & Setup

- Setup project: Next.js + TailwindCSS (`darkMode: 'class'`, CSS variables)
- Supabase project: auth + skema database awal
- PWA manifest + service worker (offline input → sync saat online)
- Sistem tema gelap/terang — default dark (`#0F172A`), simpan preferensi ke `localStorage` + profil
- Shell navigasi bottom bar + routing (Beranda | ➕ Tambah | Riwayat | Profil)
- **Mode tamu:** aplikasi langsung bisa digunakan tanpa login — data disimpan via Dexie.js (IndexedDB)
- Abstraksi layer data: `useDataStore()` hook yang otomatis routing ke lokal (mode tamu) atau Supabase (mode akun)
- Banner non-intrusif di Beranda: ajakan buat akun untuk backup & sync
- Auth: Email + Password dan Google OAuth (opsional, bisa dilakukan kapan saja)
- Fungsi migrasi `migrateGuestToCloud(userId)` saat pertama kali login

### Minggu 3–4 · Input Transaksi ≤10 Detik

- FAB ➕ → keyboard numerik otomatis fokus ke field Nominal
- Grid kategori (3 kolom, ikon + warna per kategori)
- Field catatan opsional dengan auto-suggest dari riwayat
- Tanggal otomatis dengan opsi override manual
- Tombol Simpan → toast konfirmasi ✅ → kembali ke Beranda
- Set kategori default (7–10 item: Makan, Transport, Belanja, Hiburan, dll.)

**Target:** ≤10 detik dari tap pertama hingga konfirmasi tersimpan.

### Minggu 5–6 · Dashboard & Riwayat

- Kartu ringkasan: Total Hari Ini | Total Bulan Ini | Sisa Budget
- Grafik batang 7 hari (warna semantik: merah/oranye untuk pengeluaran)
- List transaksi terbaru — scrollable, tap untuk detail/edit
- Swipe kiri → hapus, swipe kanan → edit
- Filter: rentang tanggal, kategori, kata kunci
- CRUD kategori: tambah, edit, hapus + pilih ikon

---

## Phase 2 — Growth (Minggu 7–12)

### Minggu 7–9 · Sinkronisasi Google Sheets

- OAuth 2.0 consent screen + penyimpanan `access_token` & `refresh_token`
- Auto-create sheet baru jika belum ada
- Mapping kolom: `Tanggal | Nominal | Kategori | Catatan | Tipe | ID Transaksi`
- Sync mode: 1-arah (App → Sheets) untuk menghindari konflik
- Manual sync + auto-sync harian (jika online)
- Token refresh + re-auth fallback tanpa memblokir fitur utama
- Indikator status sync di UI

> ⚠️ **Penting:** Submit OAuth consent screen verification ke Google sedini mungkin (bisa memakan 1–2 minggu approval).

### Minggu 9–11 · Budget Bulanan & Notifikasi

- Set limit bulanan per kategori
- Kartu "Sisa Budget" di dashboard
- In-app alert pada 80% dan 100% dari limit
- Push notification via PWA

### Minggu 12 · Ekspor Data

- Pilih rentang tanggal ekspor
- Unduh CSV (native browser)
- Unduh PDF ringkasan (via jsPDF)

---

## Phase 3 — Scale (Minggu 13–20)

### Sinkronisasi Multi-Device

- Real-time sync via Supabase Realtime
- Manajemen sesi multi-device
- Conflict resolution (last-write-wins untuk MVP)

### Upload Struk & OCR Dasar

- Input kamera → upload foto struk
- OCR ekstraksi nominal + tanggal (Tesseract.js atau cloud API)
- Konfirmasi pengguna sebelum menyimpan hasil OCR

---

## Skema Database

### `transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `user_id` | uuid FK | Relasi ke tabel users |
| `amount` | numeric | Nominal transaksi |
| `category_id` | uuid FK | Relasi ke tabel categories |
| `note` | text | Catatan opsional |
| `date` | date | Tanggal transaksi |
| `created_at` | timestamptz | Waktu dibuat |

### `categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `user_id` | uuid FK | Relasi ke tabel users |
| `name` | text | Nama kategori |
| `icon` | text | Kode ikon |
| `color` | text | Hex warna |
| `is_default` | boolean | Kategori bawaan sistem |

### `budgets`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `user_id` | uuid FK | Relasi ke tabel users |
| `category_id` | uuid FK | Relasi ke tabel categories |
| `limit_amount` | numeric | Batas pengeluaran |
| `period` | text | `monthly` / `weekly` |

### `users` (via Supabase Auth)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `email` | text | Email pengguna |
| `theme_pref` | text | `dark` / `light` |
| `sheets_token` | jsonb | Token Google Sheets (encrypted) |
| `created_at` | timestamptz | Waktu registrasi |

---

## Tech Stack

| Layer | Pilihan | Catatan |
|---|---|---|
| Frontend | Next.js + TailwindCSS | `darkMode: 'class'`, CSS variables untuk tema |
| Charting | Recharts | Grafik batang ringan |
| PWA | Service Worker + manifest.json | Offline input → sync saat online |
| Local Storage (mode tamu) | Dexie.js (IndexedDB) | Storage lokal untuk pengguna tanpa akun |
| Backend / BaaS | Supabase | Auth, PostgreSQL, Edge Functions, Realtime |
| Database | PostgreSQL (via Supabase) | RLS untuk keamanan per-user |
| Auth | Supabase Auth | Email+Password + Google OAuth (opsional) |
| Google Sheets | `googleapis` npm package | OAuth 2.0, scope: `spreadsheets` |
| PDF Export | jsPDF | Client-side, tanpa server |
| Hosting | Vercel (frontend) | CI/CD via GitHub Actions |
| Analytics | Plausible / Umami | Anonim, tanpa cookie |
| OCR (P2) | Tesseract.js / cloud API | Fase 3 |

---

## Sistem Tema & Warna

### Palet Utama

| Konteks | Warna | Hex | Makna Psikologis |
|---|---|---|---|
| Background gelap (primary) | Slate 900 | `#0F172A` | Netral, fokus |
| Background gelap (surface) | Slate 800 | `#1E293B` | Kedalaman |
| Background terang (primary) | Gray 50 | `#F9FAFB` | Bersih |
| Background terang (surface) | Cream | `#FEFCE8` | Hangat |
| Pemasukan / Saldo / Target ✅ | Biru / Hijau | — | Kepercayaan & Stabilitas |
| Pengeluaran / Alert / Melebihi Budget | Merah / Oranye | — | Urgensi & Peringatan |

### Aturan Aksesibilitas

- Kontras warna minimal **4.5:1** (WCAG 2.1 AA)
- Semua indikator status dilengkapi **ikon + label teks** — tidak bergantung pada warna saja
- Navigasi keyboard penuh + label ARIA

---

## Persyaratan Non-Fungsional

| Aspek | Target |
|---|---|
| Performa | LCP < 2.5s, TTI < 3s, input transaksi < 1s (jaringan 3G/4G) |
| Keamanan | HTTPS wajib, sanitasi input, rate limiting auth, enkripsi data di transit & rest |
| Aksesibilitas | WCAG 2.1 AA, kontras 4.5:1, navigasi keyboard, label ARIA |
| Kompatibilitas | iOS Safari 15+, Android Chrome 90+, Firefox & Safari modern |
| Skalabilitas | 10.000 user aktif bulanan pada infrastruktur awal |
| Privasi | Tidak menjual data, opsi hapus akun permanen, kebijakan transparan |

---

## Alur Navigasi

```
Bottom Navigation
├── 🏠  Beranda      → Dashboard (ringkasan + grafik + transaksi terbaru)
├── ➕  Tambah (FAB) → Form input transaksi
├── 📋  Riwayat      → List lengkap + filter + pencarian
└── 👤  Profil       → Pengaturan tema, budget, Google Sheets, ekspor
```

**Gestur:** Swipe kiri pada item riwayat → hapus | Swipe kanan → edit cepat

---

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Alur input > 10 detik | Nilai produk hilang | Prototype & time test di minggu pertama sebelum build fitur lain |
| Google OAuth consent screen terlambat disetujui | Delay Phase 2 | Submit di minggu 1–2, bukan saat mulai Phase 2 |
| Offline sync conflict | Data ganda / hilang | Gunakan IndexedDB (Dexie.js) sebagai buffer lokal dengan queue strategy |
| OCR akurasi rendah | Frustrasi pengguna | Selalu tampilkan konfirmasi pengguna sebelum simpan hasil OCR |
| Token Sheets kadaluarsa memblokir app | UX rusak | Re-auth hanya untuk fitur Sheets, tidak memblokir fitur utama |
| Pengguna tamu menghapus cache browser | Data lokal hilang permanen | Tampilkan peringatan onboarding pertama kali; tampilkan prompt migrasi secara berkala |
| Migrasi data tamu → cloud gagal sebagian | Data tidak lengkap setelah daftar | Jalankan migrasi dalam transaksi batch; rollback jika gagal; simpan log untuk retry |

---

*Dokumen ini mencerminkan scope MVP hingga Phase 3. Prioritas dapat disesuaikan berdasarkan feedback pengguna setelah Phase 1 diluncurkan.*