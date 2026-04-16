import { create } from 'zustand';

interface AppState {
  transactions: any[];
  budgets: any[];
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  budgets: [],
  isLoading: true,
  error: null,
  fetchData: async () => {
    // Prevent refetching if we already have data to save even more requests during rapid navigation
    // (Optional: can be removed if fresh data is always required)
    
    set({ isLoading: true, error: null });
    try {
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
    } catch (error) {
      console.error('State Management Fetch Error:', error);
      set({ error: 'Gagal mengambil data dari server', isLoading: false });
    }
  }
}));
