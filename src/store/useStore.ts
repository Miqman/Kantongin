import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import db, { generateId } from '@/lib/dexie';

interface AppState {
  transactions: any[];
  budgets: any[];
  categories: any[];
  isLoading: boolean;
  error: string | null;
  user: any | null;
  lastFetchedAt: number | null;
  
  checkAuth: () => Promise<void>;
  fetchData: (force?: boolean) => Promise<void>;
  fetchCategories: (force?: boolean) => Promise<void>;
  
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  
  setBudget: (limitAmount: number, period?: string) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addCategory: (data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  setUser: (user: any | null) => void;
}

// ── In-flight deduplication ─────────────────────────────────────────────────
// Ensures concurrent calls to fetchData / fetchCategories share one request.
let fetchDataInFlight: Promise<void> | null = null;
let fetchCatsInFlight: Promise<void> | null = null;

const DEFAULT_CATEGORIES = [
  { name: 'Makan & Minum', icon: 'restaurant', color: '#ff9800' },
  { name: 'Transportasi', icon: 'directions_car', color: '#2196f3' },
  { name: 'Belanja', icon: 'shopping_cart', color: '#e91e63' },
  { name: 'Tagihan', icon: 'receipt', color: '#f44336' },
  { name: 'Hiburan', icon: 'movie', color: '#9c27b0' },
  { name: 'Gaji', icon: 'payments', color: '#4caf50' }
];

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  budgets: [],
  categories: [],
  isLoading: true,
  error: null,
  user: null,
  lastFetchedAt: null,

  checkAuth: async () => {
    // Simple auth check — AppInitializer's onAuthStateChange handles
    // the full init sequence (fetchCategories, fetchData, migration)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },

  fetchData: async (force = false) => {
    // Deduplicate: if a fetch is already in-flight, return the same promise
    if (fetchDataInFlight) return fetchDataInFlight;

    // Skip if data was fetched recently (within 30 seconds) unless forced
    const { lastFetchedAt } = get();
    if (!force && lastFetchedAt && Date.now() - lastFetchedAt < 30000) return;

    fetchDataInFlight = (async () => {
      set({ isLoading: true, error: null });
      const { user } = get();
      try {
      if (user) {
        const [txRes, bdgRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/budgets')
        ]);
        
        const txData = await txRes.json();
        const bdgData = await bdgRes.json();

        set({
          transactions: Array.isArray(txData) ? txData : [],
          budgets: Array.isArray(bdgData) ? bdgData : [],
          isLoading: false,
          lastFetchedAt: Date.now()
        });
      } else {
        // Guest mode using Dexie
        const txData = await db.transactions.orderBy('date').reverse().toArray();
        // Since local dexie transaction has category_id but not the joined category object, we need to map it
        const catData = await db.categories.toArray();
        const catMap = new Map(catData.map(c => [c.id, c]));
        
        const txWithCategories = txData.map(tx => ({
          ...tx,
          category: catMap.get(tx.category_id) || null
        }));

        set({ transactions: txWithCategories, budgets: [], isLoading: false, lastFetchedAt: Date.now() });
      }
      } catch (error) {
        console.error('Fetch Error:', error);
        set({ error: 'Gagal mengambil data', isLoading: false });
      } finally {
        fetchDataInFlight = null;
      }
    })();

    return fetchDataInFlight;
  },

  fetchCategories: async (force = false) => {
    // Deduplicate concurrent calls
    if (fetchCatsInFlight) return fetchCatsInFlight;

    const { user, categories } = get();
    if (!force && categories.length > 0) return;

    fetchCatsInFlight = (async () => {
      try {
      if (user) {
        const res = await fetch('/api/categories');
        const data = await res.json();
        set({ categories: Array.isArray(data) ? data : [] });
      } else {
        let cats = await db.categories.toArray();
        if (cats.length === 0) {
          // Seed default categories
          const seedData = DEFAULT_CATEGORIES.map(c => ({
            id: generateId(),
            user_id: null,
            name: c.name,
            icon: c.icon,
            color: c.color,
            is_default: true
          }));
          await db.categories.bulkAdd(seedData);
          cats = await db.categories.toArray();
        }
        set({ categories: cats });
      }
      } catch (error) {
        console.error('Fetch Categories Error:', error);
      } finally {
        fetchCatsInFlight = null;
      }
    })();

    return fetchCatsInFlight;
  },

  addTransaction: async (data: any) => {
    const { user, fetchData } = get();
    try {
      if (user) {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Gagal menambah transaksi');
      } else {
        const newTx = {
          id: generateId(),
          user_id: null,
          amount: data.amount,
          category_id: data.category_id,
          note: data.note || '',
          date: data.date,
          created_at: new Date().toISOString()
        };
        await db.transactions.add(newTx);
      }
      await fetchData(true); // Force refresh after mutation
    } catch (error) {
      console.error('Add Transaction Error:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    const { user, fetchData } = get();
    try {
      if (user) {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus transaksi');
      } else {
        await db.transactions.delete(id);
      }
      await fetchData(true);
    } catch (error) {
      console.error('Delete Transaction Error:', error);
      throw error;
    }
  },

  updateTransaction: async (id: string, data: any) => {
    const { user, fetchData } = get();
    try {
      if (user) {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Gagal update transaksi');
      } else {
        await db.transactions.update(id, data);
      }
      await fetchData(true);
    } catch (error) {
      console.error('Update Transaction Error:', error);
      throw error;
    }
  },

  setBudget: async (limitAmount: number, period = 'monthly') => {
    const { budgets, fetchData } = get();
    try {
      // Upsert: update existing global budget for this period, or insert new
      const existing = Array.isArray(budgets)
        ? budgets.find((b: any) => b.period === period && !b.category_id)
        : null;

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
      await fetchData(true);
    } catch (error) {
      console.error('Set Budget Error:', error);
      throw error;
    }
  },

  deleteBudget: async (id: string) => {
    const { fetchData } = get();
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal hapus budget');
      await fetchData(true);
    } catch (error) {
      console.error('Delete Budget Error:', error);
      throw error;
    }
  },

  addCategory: async (data: any) => {
    const { user, fetchCategories } = get();
    try {
      if (user) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Gagal menambah kategori');
      } else {
        const newCat = {
          id: generateId(),
          user_id: null,
          name: data.name,
          icon: data.icon,
          color: data.color,
          is_default: false
        };
        await db.categories.add(newCat);
      }
      await fetchCategories(true);
    } catch (error) {
      console.error('Add Category Error:', error);
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
      console.error('Delete Category Error:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, data: any) => {
    const { user, fetchCategories } = get();
    try {
      if (user) {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Gagal update kategori');
      } else {
        await db.categories.update(id, data);
      }
      await fetchCategories(true);
    } catch (error) {
      console.error('Update Category Error:', error);
      throw error;
    }
  },

  setUser: (user) => set({ user })
}));
