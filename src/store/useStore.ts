import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import db, { generateId } from '@/lib/dexie';
import { logger } from '@/lib/logger';
import type {
  AppUser,
  Transaction,
  Budget,
  Category,
  TransactionInput,
  CategoryInput,
  BudgetInput,
  BudgetPeriod,
} from '@/types';

// ── State & actions interface ─────────────────────────────────────────────────

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  isLoading: boolean;
  isLoadingMore: boolean;    // For infinite scroll "load more" state
  hasMore: boolean;          // Whether more pages are available
  nextCursor: string | null; // Cursor for the next page
  error: string | null;
  user: AppUser | null;
  lastFetchedAt: number | null;

  checkAuth: () => Promise<void>;
  fetchData: (force?: boolean) => Promise<void>;
  loadMoreTransactions: () => Promise<void>; // Infinite scroll: append next page
  fetchCategories: (force?: boolean) => Promise<void>;

  addTransaction: (data: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionInput>) => Promise<void>;

  setBudget: (limitAmount: number, period?: BudgetPeriod) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addCategory: (data: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, data: Partial<CategoryInput>) => Promise<void>;
  setUser: (user: AppUser | null) => void;
}

// ── In-flight deduplication ───────────────────────────────────────────────────
let fetchDataInFlight: Promise<void> | null = null;
let fetchCatsInFlight: Promise<void> | null = null;

const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: 'Makan & Minum', icon: 'restaurant', color: '#ff9800' },
  { name: 'Transportasi', icon: 'directions_car', color: '#2196f3' },
  { name: 'Belanja', icon: 'shopping_cart', color: '#e91e63' },
  { name: 'Tagihan', icon: 'receipt', color: '#f44336' },
  { name: 'Hiburan', icon: 'movie', color: '#9c27b0' },
  { name: 'Gaji', icon: 'payments', color: '#4caf50' },
];

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  budgets: [],
  categories: [],
  isLoading: true,
  isLoadingMore: false,
  hasMore: false,
  nextCursor: null,
  error: null,
  user: null,
  lastFetchedAt: null,

  checkAuth: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    set({ user: user as AppUser | null });
  },

  // ── READ ──────────────────────────────────────────────────────────────────

  fetchData: async (force = false) => {
    if (fetchDataInFlight) return fetchDataInFlight;

    const { lastFetchedAt } = get();
    if (!force && lastFetchedAt && Date.now() - lastFetchedAt < 30_000) return;

    fetchDataInFlight = (async () => {
      set({ isLoading: true, error: null });
      const { user } = get();
      try {
        if (user) {
          const [txRes, bdgRes] = await Promise.all([
            fetch('/api/transactions'), // First page (cursor=undefined)
            fetch('/api/budgets'),
          ]);

          const txJson = await txRes.json();
          const bdgData: Budget[] = await bdgRes.json();

          // Handle both paginated { data, nextCursor, hasMore } and legacy flat array
          const txData: Transaction[] = Array.isArray(txJson)
            ? txJson
            : (txJson.data ?? []);
          const nextCursor: string | null = txJson.nextCursor ?? null;
          const hasMore: boolean = txJson.hasMore ?? false;

          set({
            transactions: txData,
            budgets: Array.isArray(bdgData) ? bdgData : [],
            nextCursor,
            hasMore,
            isLoading: false,
            lastFetchedAt: Date.now(),
          });
        } else {
          // Guest mode — Dexie
          const txData = await db.transactions.orderBy('date').reverse().toArray();
          const catData = await db.categories.toArray();
          const catMap = new Map(catData.map((c) => [c.id, c as Category]));

          const txWithCategories: Transaction[] = txData.map((tx) => ({
            ...tx,
            category: catMap.get(tx.category_id) ?? null,
          }));

          const bdgData = await db.budgets.toArray();

          set({
            transactions: txWithCategories,
            budgets: bdgData as Budget[],
            hasMore: false,
            nextCursor: null,
            isLoading: false,
            lastFetchedAt: Date.now(),
          });
        }
      } catch (error) {
        logger.error('Fetch Error:', error);
        set({ error: 'Gagal mengambil data', isLoading: false });
      } finally {
        fetchDataInFlight = null;
      }
    })();

    return fetchDataInFlight;
  },

  loadMoreTransactions: async () => {
    const { user, isLoadingMore, hasMore, nextCursor } = get();
    if (!user || isLoadingMore || !hasMore || !nextCursor) return;

    set({ isLoadingMore: true });
    try {
      const res = await fetch(`/api/transactions?cursor=${encodeURIComponent(nextCursor)}`);
      const json = await res.json();
      const newItems: Transaction[] = json.data ?? [];

      set((state) => {
        const existingIds = new Set(state.transactions.map((tx) => tx.id));
        const dedupedNewItems = newItems.filter((tx) => !existingIds.has(tx.id));
        return {
          transactions: [...state.transactions, ...dedupedNewItems],
          nextCursor: json.nextCursor ?? null,
          hasMore: json.hasMore ?? false,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      logger.error('Load More Error:', error);
      set({ isLoadingMore: false });
    }
  },

  fetchCategories: async (force = false) => {
    if (fetchCatsInFlight) return fetchCatsInFlight;

    const { user, categories } = get();
    if (!force && categories.length > 0) return;

    fetchCatsInFlight = (async () => {
      try {
        if (user) {
          const res = await fetch('/api/categories');
          const data: Category[] = await res.json();
          set({ categories: Array.isArray(data) ? data : [] });
        } else {
          let cats = await db.categories.toArray();
          if (cats.length === 0) {
            const seedData = DEFAULT_CATEGORIES.map((c) => ({
              id: generateId(),
              user_id: null,
              name: c.name,
              icon: c.icon,
              color: c.color,
              is_default: true,
            }));
            await db.categories.bulkAdd(seedData);
            cats = await db.categories.toArray();
          }
          set({ categories: cats as Category[] });
        }
      } catch (error) {
        logger.error('Fetch Categories Error:', error);
      } finally {
        fetchCatsInFlight = null;
      }
    })();

    return fetchCatsInFlight;
  },

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────

  addTransaction: async (data: TransactionInput) => {
    const { user, categories } = get();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    if (user) {
      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const optimisticTx: Transaction = {
        id: tempId,
        user_id: user.id,
        amount: data.amount,
        category_id: data.category_id,
        category: catMap.get(data.category_id) ?? null,
        note: data.note ?? '',
        date: data.date,
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        transactions: [optimisticTx, ...state.transactions],
      }));

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Gagal menambah transaksi');
        const saved: Transaction = await res.json();

        // Replace optimistic item with real server data
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === tempId ? saved : tx
          ),
          lastFetchedAt: Date.now(),
        }));
      } catch (error) {
        // Rollback on failure
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== tempId),
        }));
        logger.error('Add Transaction Error:', error);
        throw error;
      }
    } else {
      // Guest mode
      const newTx = {
        id: generateId(),
        user_id: null,
        amount: data.amount,
        category_id: data.category_id,
        note: data.note ?? '',
        date: data.date,
        created_at: new Date().toISOString(),
      };
      await db.transactions.add(newTx);
      await get().fetchData(true);
    }
  },

  deleteTransaction: async (id: string) => {
    const { user } = get();

    if (user) {
      // Optimistic update
      const prev = get().transactions;
      set((state) => ({
        transactions: state.transactions.filter((tx) => tx.id !== id),
      }));

      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus transaksi');
      } catch (error) {
        // Rollback
        set({ transactions: prev });
        logger.error('Delete Transaction Error:', error);
        throw error;
      }
    } else {
      await db.transactions.delete(id);
      await get().fetchData(true);
    }
  },

  updateTransaction: async (id: string, data: Partial<TransactionInput>) => {
    const { user, categories } = get();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    if (user) {
      const prev = get().transactions;
      // Optimistic update
      set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === id
            ? {
                ...tx,
                ...data,
                category: data.category_id
                  ? (catMap.get(data.category_id) ?? tx.category)
                  : tx.category,
              }
            : tx
        ),
      }));

      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Gagal update transaksi');
        const saved: Transaction = await res.json();

        // Replace with server truth
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? saved : tx
          ),
        }));
      } catch (error) {
        set({ transactions: prev });
        logger.error('Update Transaction Error:', error);
        throw error;
      }
    } else {
      await db.transactions.update(id, data);
      await get().fetchData(true);
    }
  },

  // ── BUDGETS ───────────────────────────────────────────────────────────────

  setBudget: async (limitAmount: number, period: BudgetPeriod = 'monthly') => {
    const { user, budgets, fetchData } = get();
    const existing = budgets.find((b) => b.period === period && !b.category_id);

    try {
      if (user) {
        if (existing) {
          const res = await fetch('/api/budgets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existing.id, limit_amount: limitAmount, period }),
          });
          if (!res.ok) throw new Error('Gagal update budget');
        } else {
          const res = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit_amount: limitAmount, period }),
          });
          if (!res.ok) throw new Error('Gagal simpan budget');
        }
      } else {
        if (existing) {
          await db.budgets.update(existing.id, { limit_amount: limitAmount });
        } else {
          await db.budgets.add({
            id: generateId(),
            user_id: null,
            category_id: null,
            limit_amount: limitAmount,
            period,
          });
        }
      }
      await fetchData(true);
    } catch (error) {
      logger.error('Set Budget Error:', error);
      throw error;
    }
  },

  deleteBudget: async (id: string) => {
    const { user, fetchData } = get();
    try {
      if (user) {
        const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal hapus budget');
      } else {
        await db.budgets.delete(id);
      }
      await fetchData(true);
    } catch (error) {
      logger.error('Delete Budget Error:', error);
      throw error;
    }
  },

  // ── CATEGORIES ────────────────────────────────────────────────────────────

  addCategory: async (data: CategoryInput) => {
    const { user, fetchCategories } = get();
    try {
      if (user) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Gagal menambah kategori');
      } else {
        await db.categories.add({
          id: generateId(),
          user_id: null,
          name: data.name,
          icon: data.icon,
          color: data.color,
          is_default: false,
        });
      }
      await fetchCategories(true);
    } catch (error) {
      logger.error('Add Category Error:', error);
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    const { user, fetchCategories } = get();
    try {
      if (user) {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus kategori');
      } else {
        await db.categories.delete(id);
      }
      await fetchCategories(true);
    } catch (error) {
      logger.error('Delete Category Error:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, data: Partial<CategoryInput>) => {
    const { user, fetchCategories } = get();
    try {
      if (user) {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Gagal update kategori');
      } else {
        await db.categories.update(id, data);
      }
      await fetchCategories(true);
    } catch (error) {
      logger.error('Update Category Error:', error);
      throw error;
    }
  },

  setUser: (user) => set({ user }),
}));
