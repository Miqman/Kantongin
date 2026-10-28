// ─────────────────────────────────────────────────────────────────────────────
// Domain types — single source of truth untuk seluruh aplikasi Dompetku SvelteKit
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedItem {
  name: string;
  amount: number;
  category_hint: string | null;
}

export interface ParsedTransaction {
  amount: number | null;
  category_hint: string | null;
  note: string | null;
  date: string | null;
  confidence: 'high' | 'medium' | 'low';
  transaction_type: 'expense' | 'income' | null;
  items?: ParsedItem[];
}

export interface HealthCheckResult {
  online: boolean;
  latencyMs?: number;
  provider: string;
  error?: string;
}

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface Transaction {
  id: string;
  user_id: string | null;
  amount: number;
  category_id: string;
  category: Category | null;
  note: string;
  date: string;           // ISO date string: "YYYY-MM-DD"
  created_at: string;     // ISO datetime string
}

export interface Budget {
  id: string;
  user_id: string | null;
  category_id: string | null;
  category: Category | null;
  limit_amount: number;
  period: BudgetPeriod;
}

export interface AppUser {
  id: string;
  email: string | undefined;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Input types — untuk form / API payload (tanpa id / timestamps)
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionInput {
  amount: number;
  category_id: string;
  note?: string;
  date: string;
}

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  is_default?: boolean;
}

export interface BudgetInput {
  limit_amount: number;
  period?: BudgetPeriod;
  category_id?: string | null;
}

