-- ============================================================
-- Kantongin — Supabase Database Setup
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. TABEL categories ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false
);

-- ── 2. TABEL transactions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  note        TEXT,
  date        TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. TABEL budgets ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC NOT NULL,
  period       TEXT NOT NULL DEFAULT 'monthly'
);

-- ── 4. INDEX untuk performa query ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id     ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id        ON public.budgets(user_id);

-- ── 5. ROW LEVEL SECURITY (RLS) ──────────────────────────────
-- Wajib aktifkan RLS agar setiap user hanya bisa akses data miliknya

ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets      ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS POLICIES: categories ──────────────────────────────
-- User bisa baca kategori miliknya ATAU kategori default sistem (user_id IS NULL)
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- User hanya bisa insert kategori untuk dirinya sendiri
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User hanya bisa update/delete kategori miliknya sendiri
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- ── 7. RLS POLICIES: transactions ────────────────────────────
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ── 8. RLS POLICIES: budgets ─────────────────────────────────
CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ── 9. SEED: Default system categories ───────────────────────
-- Kategori default sistem (user_id = NULL), tersedia untuk semua user
INSERT INTO public.categories (id, user_id, name, icon, color, is_default) VALUES
  (gen_random_uuid(), NULL, 'Makan & Minum',  'restaurant',    '#ff9800', true),
  (gen_random_uuid(), NULL, 'Transportasi',   'directions_car','#2196f3', true),
  (gen_random_uuid(), NULL, 'Belanja',        'shopping_cart', '#e91e63', true),
  (gen_random_uuid(), NULL, 'Tagihan',        'receipt',       '#f44336', true),
  (gen_random_uuid(), NULL, 'Hiburan',        'movie',         '#9c27b0', true),
  (gen_random_uuid(), NULL, 'Gaji',           'payments',      '#4caf50', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Selesai! Verifikasi dengan:
-- SELECT * FROM public.categories WHERE user_id IS NULL;
-- ============================================================
