-- ============================================================
-- Kantongin — Cleanup: Hapus tabel lama dari Prisma
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Tabel lama (PascalCase, dibuat Prisma) sudah tidak dipakai.
-- API sekarang menggunakan tabel lowercase dengan Supabase SDK.
-- ============================================================

-- Hapus tabel dengan FK dependency dulu (urutan penting!)
DROP TABLE IF EXISTS public."Budget"      CASCADE;
DROP TABLE IF EXISTS public."Transaction" CASCADE;
DROP TABLE IF EXISTS public."Category"    CASCADE;
DROP TABLE IF EXISTS public."User"        CASCADE;

-- Verifikasi: tabel yang tersisa seharusnya hanya ini:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Hasil yang benar: budgets, categories, transactions
