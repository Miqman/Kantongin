import db, { generateId } from '$lib/db/dexie';
import { logger } from '$lib/logger';
import { migrateGuestToCloud } from '$lib/sync';
import type {
  AppUser,
  Transaction,
  Budget,
  Category,
  TransactionInput,
  CategoryInput,
  BudgetPeriod,
} from '$lib/types';

const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: 'Makan & Minum', icon: 'restaurant', color: '#ff9800' },
  { name: 'Transportasi', icon: 'directions_car', color: '#2196f3' },
  { name: 'Belanja', icon: 'shopping_cart', color: '#e91e63' },
  { name: 'Tagihan', icon: 'receipt', color: '#f44336' },
  { name: 'Hiburan', icon: 'movie', color: '#9c27b0' },
  { name: 'Gaji', icon: 'payments', color: '#4caf50' },
];

const getInitialPaydayDate = (): number => {
  if (typeof window !== 'undefined') {
    const val = localStorage.getItem('payday_date');
    if (val && !isNaN(Number(val))) return Math.max(1, Math.min(31, Number(val)));
  }
  return 27;
};

let fetchDataInFlight: Promise<void> | null = null;
let fetchCatsInFlight: Promise<void> | null = null;
let globalInitialized = false;

class AppStore {
  // ── Svelte 5 Runes State ──────────────────────────────────────────────────
  transactions = $state<Transaction[]>([]);
  budgets = $state<Budget[]>([]);
  categories = $state<Category[]>([]);
  isLoading = $state(true);          // Initial loading state
  isSyncing = $state(false);         // Background non-blocking sync state
  isLoadingMore = $state(false);     // Infinite scroll pagination state
  hasMore = $state(false);
  nextCursor = $state<string | null>(null);
  error = $state<string | null>(null);
  user = $state<AppUser | null>(null);
  lastFetchedAt = $state<number | null>(null);
  paydayDate = $state<number>(getInitialPaydayDate());

  // ── Derived State ─────────────────────────────────────────────────────────
  isGuest = $derived(this.user === null);
  categoryMap = $derived(new Map(this.categories.map((c) => [c.id, c])));

  // ── Auth & Initialization ─────────────────────────────────────────────────
  async checkAuth(): Promise<AppUser | null> {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        const activeUser: AppUser | null = data.user ?? null;
        this.setUser(activeUser);

        if (activeUser?.user_metadata?.payday_date) {
          const payday = Math.max(1, Math.min(31, Number(activeUser.user_metadata.payday_date) || 27));
          this.paydayDate = payday;
          if (typeof window !== 'undefined') {
            localStorage.setItem('payday_date', String(payday));
          }
        }
        return activeUser;
      }
    } catch (err) {
      logger.error('[AppStore] checkAuth failed:', err);
    }
    return null;
  }

  async init(userFromPageData?: AppUser | null) {
    if (userFromPageData !== undefined) {
      this.setUser(userFromPageData);
    } else {
      await this.checkAuth();
    }

    if (!globalInitialized) {
      globalInitialized = true;

      // Handle automatic guest migration if user is authenticated and local data exists
      if (this.user) {
        try {
          const localCount = await db.transactions.count();
          if (localCount > 0) {
            logger.log(`[AppStore Migration] Migrating ${localCount} guest transactions...`);
            await migrateGuestToCloud();
          }
        } catch (err) {
          logger.error('[AppStore Migration] Error:', err);
        }
      }

      await this.fetchCategories(true);
      await this.fetchData({ force: true });
    }
  }

  setUser(user: AppUser | null) {
    this.user = user;
  }

  // ── Read: Data Fetching with Non-blocking Background Support ───────────────
  async fetchData(options?: { background?: boolean; force?: boolean }): Promise<void> {
    const background = options?.background ?? false;
    const force = options?.force ?? false;

    if (fetchDataInFlight) return fetchDataInFlight;

    if (!force && this.lastFetchedAt && Date.now() - this.lastFetchedAt < 30_000) {
      return;
    }

    fetchDataInFlight = (async () => {
      if (background) {
        this.isSyncing = true;
      } else {
        this.isLoading = true;
      }
      this.error = null;

      try {
        if (this.user) {
          const [txRes, bdgRes] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/budgets'),
          ]);

          const txJson = await txRes.json();
          const bdgData: Budget[] = await bdgRes.json();

          const txData: Transaction[] = Array.isArray(txJson)
            ? txJson
            : (txJson.data ?? []);
          const nextCursor: string | null = txJson.nextCursor ?? null;
          const hasMore: boolean = txJson.hasMore ?? false;

          // Reactively update arrays without full reload
          this.transactions = txData;
          this.budgets = Array.isArray(bdgData) ? bdgData : [];
          this.nextCursor = nextCursor;
          this.hasMore = hasMore;
          this.lastFetchedAt = Date.now();
        } else {
          // Guest mode via Dexie IndexedDB
          const txData = await db.transactions.orderBy('date').reverse().toArray();
          const catData = await db.categories.toArray();
          const catMap = new Map(catData.map((c) => [c.id, c as Category]));

          const txWithCategories: Transaction[] = txData.map((tx) => ({
            ...tx,
            category: catMap.get(tx.category_id) ?? null,
          }));

          const bdgData = await db.budgets.toArray();

          this.transactions = txWithCategories;
          this.budgets = bdgData as Budget[];
          this.hasMore = false;
          this.nextCursor = null;
          this.lastFetchedAt = Date.now();
        }
      } catch (err) {
        logger.error('[AppStore] Fetch Error:', err);
        this.error = 'Gagal mengambil data';
      } finally {
        this.isLoading = false;
        this.isSyncing = false;
        fetchDataInFlight = null;
      }
    })();

    return fetchDataInFlight;
  }

  async loadMoreTransactions(): Promise<void> {
    if (!this.user || this.isLoadingMore || !this.hasMore || !this.nextCursor) return;

    this.isLoadingMore = true;
    try {
      const res = await fetch(`/api/transactions?cursor=${encodeURIComponent(this.nextCursor)}`);
      const json = await res.json();
      const newItems: Transaction[] = json.data ?? [];

      const existingIds = new Set(this.transactions.map((t) => t.id));
      const dedupedNewItems = newItems.filter((t) => !existingIds.has(t.id));

      this.transactions = [...this.transactions, ...dedupedNewItems];
      this.nextCursor = json.nextCursor ?? null;
      this.hasMore = json.hasMore ?? false;
    } catch (err) {
      logger.error('[AppStore] Load More Error:', err);
    } finally {
      this.isLoadingMore = false;
    }
  }

  async fetchCategories(force = false): Promise<void> {
    if (fetchCatsInFlight) return fetchCatsInFlight;
    if (!force && this.categories.length > 0) return;

    fetchCatsInFlight = (async () => {
      try {
        if (this.user) {
          const res = await fetch('/api/categories');
          const data: Category[] = await res.json();
          this.categories = Array.isArray(data) ? data : [];
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
          this.categories = cats as Category[];
        }
      } catch (err) {
        logger.error('[AppStore] Fetch Categories Error:', err);
      } finally {
        fetchCatsInFlight = null;
      }
    })();

    return fetchCatsInFlight;
  }

  // ── Transactions: Optimistic Mutation Actions ─────────────────────────────
  async addTransaction(data: TransactionInput): Promise<Transaction> {
    const catMap = this.categoryMap;

    if (this.user) {
      // Optimistic update: instantly prepend to reactive state
      const tempId = `temp_${Date.now()}`;
      const optimisticTx: Transaction = {
        id: tempId,
        user_id: this.user.id,
        amount: data.amount,
        category_id: data.category_id,
        category: catMap.get(data.category_id) ?? null,
        note: data.note ?? '',
        date: data.date,
        created_at: new Date().toISOString(),
      };

      this.transactions = [optimisticTx, ...this.transactions];

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Gagal menambah transaksi');
        const saved: Transaction = await res.json();

        // Swap optimistic item with server truth
        this.transactions = this.transactions.map((tx) =>
          tx.id === tempId ? saved : tx
        );
        this.lastFetchedAt = Date.now();
        return saved;
      } catch (err) {
        // Rollback on failure
        this.transactions = this.transactions.filter((tx) => tx.id !== tempId);
        logger.error('[AppStore] Add Transaction Error:', err);
        throw err;
      }
    } else {
      // Guest mode
      const newTx: Transaction = {
        id: generateId(),
        user_id: null,
        amount: data.amount,
        category_id: data.category_id,
        category: catMap.get(data.category_id) ?? null,
        note: data.note ?? '',
        date: data.date,
        created_at: new Date().toISOString(),
      };

      await db.transactions.add({
        id: newTx.id,
        user_id: null,
        amount: newTx.amount,
        category_id: newTx.category_id,
        note: newTx.note,
        date: newTx.date,
        created_at: newTx.created_at,
      });

      this.transactions = [newTx, ...this.transactions];
      return newTx;
    }
  }

  async updateTransaction(id: string, data: Partial<TransactionInput>): Promise<void> {
    const catMap = this.categoryMap;

    if (this.user) {
      const prevTransactions = this.transactions;

      // Optimistic update
      this.transactions = this.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              ...data,
              category: data.category_id
                ? (catMap.get(data.category_id) ?? tx.category)
                : tx.category,
            }
          : tx
      );

      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Gagal update transaksi');
        const saved: Transaction = await res.json();

        this.transactions = this.transactions.map((tx) =>
          tx.id === id ? saved : tx
        );
      } catch (err) {
        // Rollback
        this.transactions = prevTransactions;
        logger.error('[AppStore] Update Transaction Error:', err);
        throw err;
      }
    } else {
      await db.transactions.update(id, data);
      await this.fetchData({ force: true, background: true });
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (this.user) {
      const prevTransactions = this.transactions;
      // Optimistic delete
      this.transactions = this.transactions.filter((tx) => tx.id !== id);

      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus transaksi');
      } catch (err) {
        // Rollback
        this.transactions = prevTransactions;
        logger.error('[AppStore] Delete Transaction Error:', err);
        throw err;
      }
    } else {
      await db.transactions.delete(id);
      this.transactions = this.transactions.filter((tx) => tx.id !== id);
    }
  }

  async addTransactionsBulk(data: TransactionInput[]): Promise<void> {
    if (data.length === 0) return;
    const catMap = this.categoryMap;

    if (this.user) {
      const now = Date.now();
      const tempTxs: Transaction[] = data.map((item, idx) => ({
        id: `temp_bulk_${now}_${idx}`,
        user_id: this.user!.id,
        amount: item.amount,
        category_id: item.category_id,
        category: catMap.get(item.category_id) ?? null,
        note: item.note ?? '',
        date: item.date,
        created_at: new Date().toISOString(),
      }));
      const tempIds = new Set(tempTxs.map((t) => t.id));

      this.transactions = [...tempTxs, ...this.transactions];

      try {
        const res = await fetch('/api/transactions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: data }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error ?? 'Gagal menyimpan transaksi bulk');
        }

        // Silent background fetch to get full server records
        await this.fetchData({ force: true, background: true });
      } catch (err) {
        this.transactions = this.transactions.filter((t) => !tempIds.has(t.id));
        logger.error('[AppStore] Add Transactions Bulk Error:', err);
        throw err;
      }
    } else {
      const now = new Date().toISOString();
      const newTxs = data.map((item) => ({
        id: generateId(),
        user_id: null,
        amount: item.amount,
        category_id: item.category_id,
        note: item.note ?? '',
        date: item.date,
        created_at: now,
      }));

      await db.transactions.bulkAdd(newTxs);
      await this.fetchData({ force: true, background: true });
    }
  }

  // ── Budgets ───────────────────────────────────────────────────────────────
  async setBudget(limitAmount: number, period: BudgetPeriod = 'monthly'): Promise<void> {
    const existing = this.budgets.find((b) => b.period === period && !b.category_id);

    try {
      if (this.user) {
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
      await this.fetchData({ force: true, background: true });
    } catch (err) {
      logger.error('[AppStore] Set Budget Error:', err);
      throw err;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      if (this.user) {
        const res = await fetch(`/api/budgets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal hapus budget');
      } else {
        await db.budgets.delete(id);
      }
      await this.fetchData({ force: true, background: true });
    } catch (err) {
      logger.error('[AppStore] Delete Budget Error:', err);
      throw err;
    }
  }

  // ── Categories ────────────────────────────────────────────────────────────
  async addCategory(data: CategoryInput): Promise<void> {
    try {
      if (this.user) {
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
      await this.fetchCategories(true);
    } catch (err) {
      logger.error('[AppStore] Add Category Error:', err);
      throw err;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      if (this.user) {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus kategori');
      } else {
        await db.categories.delete(id);
      }
      await this.fetchCategories(true);
    } catch (err) {
      logger.error('[AppStore] Delete Category Error:', err);
      throw err;
    }
  }

  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<void> {
    try {
      if (this.user) {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Gagal update kategori');
      } else {
        await db.categories.update(id, data);
      }
      await this.fetchCategories(true);
    } catch (err) {
      logger.error('[AppStore] Update Category Error:', err);
      throw err;
    }
  }

  // ── Profile & Settings ────────────────────────────────────────────────────
  async updateProfile(data: { full_name?: string; avatar_url?: string; payday_date?: number }): Promise<void> {
    if (!this.user) return;

    const prevUser = this.user;
    this.user = {
      ...this.user,
      user_metadata: {
        ...this.user.user_metadata,
        ...data,
      },
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Gagal update profil');
      const json = await res.json();
      if (json.user?.user_metadata) {
        this.user = {
          ...this.user,
          user_metadata: json.user.user_metadata,
        };
      }
    } catch (err) {
      this.user = prevUser;
      logger.error('[AppStore] Update Profile Error:', err);
      throw err;
    }
  }

  async setPaydayDate(date: number): Promise<void> {
    const valid = Math.max(1, Math.min(31, Math.floor(date)));
    this.paydayDate = valid;
    if (typeof window !== 'undefined') {
      localStorage.setItem('payday_date', String(valid));
    }
    if (this.user) {
      await this.updateProfile({ payday_date: valid });
    }
  }
}

export const appStore = new AppStore();

