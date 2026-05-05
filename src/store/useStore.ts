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
  
  checkAuth: () => Promise<void>;
  fetchData: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  
  addCategory: (data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setUser: (user: any | null) => void;
}

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

  checkAuth: async () => {
    // Simple auth check — AppInitializer's onAuthStateChange handles
    // the full init sequence (fetchCategories, fetchData, migration)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },

  fetchData: async () => {
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
          isLoading: false
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

        set({ transactions: txWithCategories, budgets: [], isLoading: false });
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      set({ error: 'Gagal mengambil data', isLoading: false });
    }
  },

  fetchCategories: async () => {
    const { user } = get();
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
    }
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
      await fetchData(); // Refresh data
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
      await fetchData();
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
      await fetchData();
    } catch (error) {
      console.error('Update Transaction Error:', error);
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
      await fetchCategories();
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
      await fetchCategories();
    } catch (error) {
      console.error('Delete Category Error:', error);
      throw error;
    }
  },

  setUser: (user) => set({ user })
}));
