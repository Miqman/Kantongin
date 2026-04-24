# Product Requirements Document
## Aplikasi Pencatatan Keuangan Pribadi — FinanceTrack
**Versi 1.0 · April 2025 · CONFIDENTIAL**

---

## 1. Executive Summary

### 1.1 Problem Statement
Mayoritas masyarakat Indonesia — khususnya kalangan mahasiswa, young professional, dan freelancer — gagal mempertahankan kebiasaan mencatat pengeluaran karena aplikasi keuangan yang ada terlalu kompleks dan lambat untuk digunakan sehari-hari. Friction onboarding yang tinggi (wajib registrasi, setup akun) memperburuk adopsi awal.

### 1.2 Proposed Solution
Aplikasi web mobile-first (PWA) yang memungkinkan pengguna mencatat transaksi dalam ≤10 detik tanpa registrasi, dengan mode tamu berbasis penyimpanan lokal. Pengguna dapat membuat akun kapan saja untuk mengaktifkan sinkronisasi cloud, backup, dan fitur lanjutan — tanpa kehilangan data.

### 1.3 Success Criteria (KPIs)

| Metrik | Target | Cara Ukur |
|---|---|---|
| Waktu input transaksi | ≤10 detik | Stopwatch user testing, n=5 |
| Retensi D7 (mode akun) | ≥40% | Cohort analysis Supabase |
| Lighthouse Performance Score | ≥90 (mobile) | Lighthouse CI di setiap deploy |
| Lighthouse Accessibility Score | 100 | Lighthouse CI |
| Konversi tamu → akun | ≥20% dalam 7 hari | Event tracking (Plausible/Umami) |

---

## 2. User Experience & Functionality

### 2.1 User Personas

| Persona | Karakteristik | Pain Point Utama | Kebutuhan Kritis |
|---|---|---|---|
| Mahasiswa / Gen-Z | Transaksi kecil & sering, aktif mobile | Aplikasi lain terlalu lambat | Input ≤10 detik, kategori sederhana |
| Young Professional | Pendapatan tetap, ingin kontrol | Tidak sempat review pengeluaran | Dashboard bulanan, budget alert |
| Freelancer / UMKM | Arus kas tidak tetap | Butuh riwayat terstruktur | Filter, ekspor CSV/PDF, backup |

### 2.2 User Stories & Acceptance Criteria

#### US-01 · Input Transaksi Cepat
> Sebagai pengguna tamu, saya ingin mencatat pengeluaran tanpa registrasi sehingga saya bisa langsung mulai tanpa hambatan.

**Acceptance Criteria:**
- Aplikasi dapat digunakan penuh tanpa login — tidak ada redirect ke halaman auth
- FAB ➕ membuka form dengan keyboard numerik aktif otomatis dalam ≤300ms
- Form mencakup: Nominal (required), Kategori (required, grid 3 kolom), Catatan (opsional), Tanggal (default hari ini, bisa diubah)
- Tombol Simpan → toast konfirmasi dalam ≤500ms → kembali ke Beranda
- Alur lengkap (tap FAB → konfirmasi tersimpan) selesai dalam ≤10 detik di jaringan 3G/4G

#### US-02 · Dashboard & Ringkasan
> Sebagai pengguna, saya ingin melihat ringkasan pengeluaran hari ini dan bulan ini sehingga saya tahu kondisi keuangan tanpa harus menghitung manual.

**Acceptance Criteria:**
- Kartu ringkasan menampilkan: Total Hari Ini | Total Bulan Ini | Sisa Budget (jika budget diset)
- Grafik batang 7 hari terakhir menggunakan warna semantik (merah/oranye untuk pengeluaran, hijau untuk pemasukan)
- List 5 transaksi terbaru scrollable, tap item membuka detail/edit
- Data grafik ter-render dalam ≤1 detik pada dataset 10.000 record

#### US-03 · Manajemen Riwayat
> Sebagai pengguna, saya ingin menyaring dan mencari transaksi lama sehingga saya bisa melacak pengeluaran per kategori atau periode.

**Acceptance Criteria:**
- Filter: rentang tanggal, kategori (multi-select), kata kunci (debounce 300ms)
- Swipe kiri pada item → hapus (dengan konfirmasi dialog)
- Swipe kanan pada item → edit cepat (buka form pra-isi)
- Hasil filter muncul dalam ≤200ms untuk dataset ≤10.000 record

#### US-04 · Migrasi Data Tamu → Akun
> Sebagai pengguna tamu yang ingin backup, saya ingin membuat akun dan data lokal saya otomatis terpindah sehingga tidak ada data yang hilang.

**Acceptance Criteria:**
- Banner non-intrusif di Beranda menampilkan ajakan buat akun (dapat di-dismiss per sesi)
- Saat registrasi pertama kali, fungsi `migrateGuestToCloud()` berjalan otomatis di background
- Migrasi dalam batch; jika gagal sebagian, sistem melakukan rollback dan menyimpan log untuk retry
- Setelah migrasi sukses, data lokal IndexedDB dibersihkan
- Pengguna melihat notifikasi sukses dengan jumlah record yang berhasil dipindahkan

#### US-05 · Ekspor Data
> Sebagai pengguna (mode akun atau tamu), saya ingin mengekspor transaksi sehingga saya bisa menganalisis data di luar aplikasi.

**Acceptance Criteria:**
- Ekspor CSV: download native browser, kolom (Tanggal, Nominal, Kategori, Catatan, Tipe)
- Ekspor PDF: ringkasan bulanan via jsPDF, client-side tanpa request ke server
- Filter rentang tanggal sebelum ekspor

### 2.3 Non-Goals (Batasan Eksplisit)
Hal-hal berikut **TIDAK** dibangun dalam scope v1.0:
- Integrasi bank otomatis / open banking API
- Fitur investasi, pinjaman, atau produk keuangan
- Multi-currency atau konversi mata uang
- Laporan pajak atau akuntansi formal
- Aplikasi native iOS/Android (hanya PWA)
- OCR struk (dijadwalkan Phase 3, bukan v1.0)

---

## 3. Technical Specifications

### 3.1 Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | Next.js + TailwindCSS | `darkMode: 'class'`, CSS variables untuk tema |
| Charting | Recharts | Grafik batang ringan, SSR-friendly |
| PWA | Service Worker + manifest.json | Offline input → sync queue saat online |
| Local Storage (tamu) | Dexie.js (IndexedDB) | Storage engine mode tamu |
| Backend / BaaS | Supabase | Auth, PostgreSQL, Realtime, Edge Functions |
| Auth | Supabase Auth | Email+Password + Google OAuth (opsional) |
| Google Sheets | googleapis npm | OAuth 2.0, scope: spreadsheets — Phase 2 |
| PDF Export | jsPDF | Client-side, tanpa server |
| Hosting | Vercel (frontend) | CI/CD via GitHub Actions |
| Analytics | Plausible / Umami | Anonim, tanpa cookie, self-host opsional |

### 3.2 Architecture Overview

Aplikasi menggunakan abstraksi layer data (`useDataStore()` hook) sebagai single interface yang secara transparan mengarahkan operasi CRUD ke Dexie.js (mode tamu) atau Supabase (mode akun). Komponen UI tidak perlu mengetahui asal data.

```
User Action
  └── UI Component
      └── useDataStore() hook  [abstraksi]
          ├── [mode tamu]  → Dexie.js (IndexedDB)
          └── [mode akun]  → Supabase Client SDK
                                └── PostgreSQL (RLS)
```

### 3.3 Database Schema

#### Tabel: `transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key, auto-generate |
| `user_id` | uuid FK | Relasi ke tabel users (null untuk mode tamu lokal) |
| `amount` | numeric | Nominal transaksi, wajib > 0 |
| `category_id` | uuid FK | Relasi ke tabel categories |
| `note` | text | Catatan opsional, max 255 karakter |
| `date` | date | Tanggal transaksi |
| `created_at` | timestamptz | Waktu dibuat, default NOW() |

#### Tabel: `categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `user_id` | uuid FK | Nullable — null berarti kategori default sistem |
| `name` | text | Nama kategori, max 50 karakter |
| `icon` | text | Kode ikon (emoji atau icon set) |
| `color` | text | Hex warna (#RRGGBB) |
| `is_default` | boolean | TRUE = kategori bawaan sistem, tidak bisa dihapus |

#### Tabel: `budgets`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Primary key |
| `user_id` | uuid FK | Hanya tersedia untuk mode akun |
| `category_id` | uuid FK | Budget per kategori |
| `limit_amount` | numeric | Batas pengeluaran, wajib > 0 |
| `period` | text | Enum: `'monthly'` \| `'weekly'` |

### 3.4 Integration Points

| Integrasi | Phase | Auth | Catatan Kritis |
|---|---|---|---|
| Supabase Auth | Phase 1 | JWT | RLS wajib aktif di semua tabel |
| Google OAuth (opsional) | Phase 1 | OAuth 2.0 | Scope minimal: openid, email, profile |
| Google Sheets API | Phase 2 | OAuth 2.0 | Submit consent screen di minggu 1–2 (approval 1–2 minggu) |
| Supabase Realtime | Phase 3 | JWT | Multi-device sync, conflict: last-write-wins |

### 3.5 Security & Privacy
- HTTPS wajib di semua environment (enforce via Vercel)
- Row Level Security (RLS) aktif di semua tabel Supabase — user hanya bisa akses data miliknya sendiri
- Sanitasi input di sisi client dan server (`amount` validasi > 0, `note` max 255 char)
- Rate limiting pada endpoint auth (Supabase default + custom rule jika diperlukan)
- Token Google Sheets disimpan terenkripsi di kolom `sheets_token` (jsonb) dengan enkripsi at-rest Supabase
- Data mode tamu tidak dikirim ke server — sepenuhnya tersimpan di IndexedDB perangkat pengguna
- Peringatan onboarding pertama: penghapusan cache browser akan menghapus data tamu permanen
- Kebijakan penghapusan akun: semua data dihapus permanen dari Supabase dalam ≤30 hari
- Tidak menjual atau berbagi data pengguna dengan pihak ketiga

### 3.6 Non-Functional Requirements

| Aspek | Target | Cara Ukur |
|---|---|---|
| Performa | LCP < 2.5s, TTI < 3s (3G/4G) | Lighthouse CI, WebPageTest |
| Input Speed | Input transaksi < 1 detik setelah tap Simpan | Profiling React DevTools |
| Aksesibilitas | WCAG 2.1 AA, kontras ≥4.5:1, navigasi keyboard penuh | Lighthouse Accessibility = 100 |
| Kompatibilitas | iOS Safari 15+, Android Chrome 90+ | BrowserStack manual testing |
| Skalabilitas | 10.000 MAU pada infrastruktur free tier awal | Load test Supabase pgbench |

---

## 4. Risks & Roadmap

### 4.1 Phased Rollout

| Phase | Timeline | Scope Utama | Exit Criteria |
|---|---|---|---|
| **MVP (v1.0)** | Minggu 1–6 | Mode tamu, input transaksi, dashboard, riwayat, CRUD kategori | Input ≤10 detik terbukti di user testing n=5 |
| **v1.1 Growth** | Minggu 7–12 | Google Sheets sync, budget bulanan, notifikasi, ekspor CSV/PDF | Retensi D7 ≥40% pada cohort pertama 100 user |
| **v2.0 Scale** | Minggu 13–20 | Multi-device sync (Realtime), OCR struk, backup & restore | 10.000 MAU, uptime ≥99.5% selama 30 hari |

### 4.2 Technical Risks

| Risiko | Dampak | Probabilitas | Mitigasi |
|---|---|---|---|
| Alur input > 10 detik di perangkat low-end | Tinggi — nilai produk hilang | Sedang | Prototype & stopwatch test di minggu 1 sebelum build fitur lain |
| Google OAuth consent screen terlambat disetujui | Sedang — delay Phase 2 | Tinggi | Submit di minggu 1–2, bukan saat Phase 2 mulai |
| Data tamu hilang karena cache browser dihapus | Sedang — kepercayaan pengguna | Sedang | Peringatan onboarding + prompt migrasi berkala |
| Migrasi tamu → cloud gagal sebagian | Tinggi — data tidak lengkap | Rendah | Batch transaction + rollback otomatis + retry log |
| Token Google Sheets expired memblokir app | Rendah — hanya fitur Sheets | Tinggi | Re-auth hanya trigger untuk fitur Sheets, tidak memblokir fitur utama |
| IndexedDB tidak tersedia di browser tertentu | Sedang — mode tamu tidak berfungsi | Rendah | Fallback ke localStorage untuk data minimal; tampilkan warning |

### 4.3 Implementation Guidelines

#### ✅ DO (Selalu Lakukan)
- Prototype alur input transaksi di minggu pertama dan ukur waktu sebelum build fitur lain
- Submit Google OAuth consent screen verification di minggu 1–2
- Jalankan Lighthouse CI di setiap pull request — block merge jika skor turun
- Gunakan `useDataStore()` hook sebagai satu-satunya interface data — jangan akses Dexie/Supabase langsung dari komponen
- Tulis unit test untuk `migrateGuestToCloud()` dengan kasus: sukses penuh, gagal sebagian, data kosong

#### ❌ DON'T (Hindari)
- Jangan build fitur Phase 2 sebelum alur input ≤10 detik terbukti — ini adalah north star metric
- Jangan gunakan `WidthType.PERCENTAGE` pada tabel — tidak kompatibel lintas platform
- Jangan akses Supabase langsung dari komponen UI — selalu lewat abstraksi layer
- Jangan anggap offline-first selesai hanya dengan Service Worker — Dexie.js queue wajib untuk data persistence

---

*Dokumen ini mencerminkan scope MVP hingga Phase 3. Prioritas dapat disesuaikan berdasarkan feedback pengguna setelah Phase 1 diluncurkan.*