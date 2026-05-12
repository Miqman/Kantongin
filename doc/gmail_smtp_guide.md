# Panduan Integrasi Gmail SMTP dengan Supabase

Jika Anda **belum memiliki custom domain**, Anda tidak bisa menggunakan layanan seperti Resend untuk mengirim email secara langsung (karena Resend mensyaratkan verifikasi domain). 

Solusi terbaik dan termudah adalah menggunakan **Gmail SMTP**. Dengan cara ini, Supabase akan mengirimkan email (konfirmasi pendaftaran, reset password) langsung dari akun Gmail Anda. Limit dari Google untuk ini adalah **500 email per hari**, yang sudah sangat jauh lebih baik dari batas bawaan Supabase (2 email per jam).

---

## Langkah 1: Aktifkan 2-Step Verification di Akun Google Anda
Agar kita bisa membuat *App Password*, akun Google/Gmail yang akan Anda gunakan **wajib** mengaktifkan Verifikasi 2 Langkah (2FA).

1. Buka [Pengaturan Keamanan Google (myaccount.google.com/security)](https://myaccount.google.com/security).
2. Login menggunakan akun Gmail yang ingin Anda pakai untuk mengirim email Uangmu (misal: `uangmu.app@gmail.com`).
3. Scroll ke bagian **"Cara Anda login ke Google"** (How you sign in to Google).
4. Klik **Verifikasi 2 Langkah** (2-Step Verification) dan ikuti instruksi untuk mengaktifkannya (jika belum aktif).

---

## Langkah 2: Buat App Password (Sandi Aplikasi)
*App Password* adalah password khusus 16 karakter yang memberikan akses ke aplikasi pihak ketiga (dalam hal ini, Supabase) untuk login ke akun Gmail Anda dan mengirim email.

1. Masih di [halaman Keamanan Google](https://myaccount.google.com/security).
2. Cari kotak pencarian di bagian atas, lalu ketik **App passwords** (atau Sandi aplikasi).
3. Anda akan diminta memasukkan ulang password Gmail Anda.
4. Di halaman App Passwords, beri nama aplikasinya (misal: `Supabase Uangmu`), lalu klik **Create** (Buat).
5. Google akan menampilkan password sebanyak 16 huruf (contoh: `abcd efgh ijkl mnop`).
6. **PENTING**: Salin (copy) password 16 huruf ini dan simpan. Google tidak akan pernah menampilkannya lagi setelah jendela ditutup.

---

## Langkah 3: Konfigurasi Supabase Custom SMTP
Sekarang kita hubungkan akun Gmail tersebut ke dalam project Supabase.

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan masuk ke project Anda.
2. Di sidebar kiri, klik menu **Authentication** (ikon gembok).
3. Buka tab **Providers**.
4. Scroll ke bawah, cari menu **Email** dan perluas (*expand*).
5. Pastikan tombol **Enable Email Provider** dalam kondisi aktif.
6. Scroll ke bagian bawah, aktifkan opsi **Enable Custom SMTP**.
7. Isi formulir dengan data Gmail Anda sebagai berikut:
   - **Host**: `smtp.gmail.com`
   - **Port Number**: `465`
   - **Username**: Masukkan alamat lengkap email Gmail Anda (contoh: `uangmu.app@gmail.com`).
   - **Password**: *Paste 16 karakter App Password yang baru saja Anda buat di Langkah 2 (hilangkan spasinya jika ada).*
   - **Sender Email Address**: Sama dengan Username di atas (contoh: `uangmu.app@gmail.com`).
   - **Sender Name**: Ketik `Uangmu`.
8. Klik tombol **Save** di pojok kanan kotak.

---

## Langkah 4: Pengujian
Selesai! Sekarang mari kita uji:

1. Pastikan server lokal aplikasi Next.js Anda berjalan (`npm run dev`).
2. Masuk ke halaman `/login` lalu klik **Lupa Password?** (atau lakukan proses daftar akun baru).
3. Masukkan email pribadi Anda yang lain untuk diuji.
4. Buka kotak masuk email penerima. Anda seharusnya menerima instruksi reset password / konfirmasi pendaftaran.
5. Jika Anda periksa pengirimnya, email tersebut akan terlihat dikirim oleh `Uangmu <uangmu.app@gmail.com>`, menggunakan template desain Uangmu yang telah Anda *paste* di Supabase sebelumnya.

> [!TIP]
> Jika terjadi gagal kirim (error 535 Authentication Failed), periksa kembali apakah **App Password** disalin dengan benar tanpa spasi, dan pastikan Anda memasukkan sandi tersebut di kolom "Password" Supabase, **bukan** password asli Gmail Anda.
