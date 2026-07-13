"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import TransactionItem from '@/components/TransactionItem';
import DateFilterPicker, { DateFilterValue } from '@/components/DateFilterPicker';
import CategoryFilterPicker from '@/components/CategoryFilterPicker';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import type { Transaction, Category } from '@/types';

// ── Convert DateFilterValue → { start_date, end_date } YYYY-MM-DD strings ────
function dateFilterToRange(f: DateFilterValue | null): { start?: string; end?: string } {
  if (!f) return {};

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (f.mode === 'RANGE') {
    return {
      start: f.from ? fmt(f.from) : undefined,
      end: f.to ? fmt(f.to) : undefined,
    };
  }
  if (f.mode === 'MONTH' && f.month !== undefined && f.year !== undefined) {
    const lastDay = new Date(f.year, f.month + 1, 0).getDate();
    return {
      start: `${f.year}-${pad(f.month + 1)}-01`,
      end: `${f.year}-${pad(f.month + 1)}-${pad(lastDay)}`,
    };
  }
  if (f.mode === 'YEAR' && f.year !== undefined) {
    return {
      start: `${f.year}-01-01`,
      end: `${f.year}-12-31`,
    };
  }
  return {};
}

// ── Build API URL from active filters ─────────────────────────────────────────
function buildUrl(params: {
  start?: string;
  end?: string;
  type: 'ALL' | 'income' | 'expense';
  categoryId: string;
  search: string;
  cursor?: string;
}): string {
  const p = new URLSearchParams();
  if (params.start) p.set('start_date', params.start);
  if (params.end) p.set('end_date', params.end);
  if (params.type !== 'ALL') p.set('type', params.type);
  if (params.categoryId !== 'ALL') p.set('category_id', params.categoryId);
  if (params.search.trim()) p.set('search', params.search.trim());
  if (params.cursor) p.set('cursor', params.cursor);
  return `/api/transactions?${p.toString()}`;
}

const PAGE_SIZE = 50;

export default function Riwayat() {
  const { deleteTransaction, updateTransaction, user, isLoading: storeLoading } = useStore();
  const router = useRouter();

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'income' | 'expense'>('ALL');

  // ── Page-local transaction state ──────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // ── Debounced search (avoid API call on every keystroke) ───────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Derived: unique categories from loaded transactions (for picker) ────────
  const uniqueCategories: Category[] = useMemo(() => {
    const seen = new Set<string>();
    const cats: Category[] = [];
    transactions.forEach(t => {
      if (t.category && !seen.has(t.category_id)) {
        seen.add(t.category_id);
        cats.push(t.category);
      }
    });
    return cats;
  }, [transactions]);

  // ── Fetch (reset) when any filter changes ─────────────────────────────────
  const dateRange = useMemo(() => dateFilterToRange(dateFilter), [dateFilter]);

  const fetchTransactions = useCallback(async () => {
    if (storeLoading) return; // wait until auth is resolved

    setIsLoading(true);
    setNextCursor(null);

    try {
      if (user) {
        // ── Online: server-side filtering via API ─────────────────────────────
        const url = buildUrl({
          ...dateRange,
          type: filterType,
          categoryId: filterCategory,
          search: debouncedSearch,
        });
        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal mengambil data transaksi');
        const json = await res.json();
        const items: Transaction[] = json.data ?? [];
        setTransactions(items);
        setNextCursor(json.nextCursor ?? null);
        setHasMore(json.hasMore ?? false);
      } else {
        // ── Guest: Dexie (all data local — client-side filtering is fine) ─────
        const { default: db } = await import('@/lib/dexie');
        const catData = await db.categories.toArray();
        const catMap = new Map(catData.map(c => [c.id, c as Category]));

        let all = (await db.transactions.orderBy('date').reverse().toArray()).map(tx => ({
          ...tx,
          category: catMap.get(tx.category_id) ?? null,
        })) as Transaction[];

        // Date filter
        if (dateRange.start) all = all.filter(t => t.date >= dateRange.start!);
        if (dateRange.end)   all = all.filter(t => t.date <= dateRange.end!);
        // Type filter
        if (filterType === 'income')  all = all.filter(t => Number(t.amount) < 0);
        if (filterType === 'expense') all = all.filter(t => Number(t.amount) > 0);
        // Category filter
        if (filterCategory !== 'ALL') all = all.filter(t => t.category_id === filterCategory);
        // Search filter
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          all = all.filter(t =>
            (t.note || '').toLowerCase().includes(q) ||
            (t.category?.name || '').toLowerCase().includes(q)
          );
        }

        setTransactions(all);
        setHasMore(false);
        setNextCursor(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat transaksi.');
    } finally {
      setIsLoading(false);
    }
  }, [storeLoading, user, dateRange, filterType, filterCategory, debouncedSearch]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Load more (infinite scroll) ──────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor || !user) return;
    setIsLoadingMore(true);
    try {
      const url = buildUrl({
        ...dateRange,
        type: filterType,
        categoryId: filterCategory,
        search: debouncedSearch,
        cursor: nextCursor,
      });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat lebih banyak');
      const json = await res.json();
      const items: Transaction[] = json.data ?? [];
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        return [...prev, ...items.filter(t => !existingIds.has(t.id))];
      });
      setNextCursor(json.nextCursor ?? null);
      setHasMore(json.hasMore ?? false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor, user, dateRange, filterType, filterCategory, debouncedSearch]);

  // ── Intersection Observer for infinite scroll ─────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Terjadi kesalahan koneksi saat menghapus.');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/tambah?edit=${id}`);
  };

  const resetAllFilters = () => {
    setDateFilter(null);
    setFilterCategory('ALL');
    setFilterType('ALL');
    setSearchQuery('');
  };

  // ── Grouping ─────────────────────────────────────────────────────────────────
  const groupedData = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(trx => {
      // Normalisasi ke YYYY-MM-DD: API Supabase bisa return full ISO datetime
      const key = trx.date.slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(trx);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({ date: key, items: groups[key] }));
  }, [transactions]);

  const getLabelForDate = (dateString: string) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toLocaleDateString('en-CA');
    if (dateString === today) return 'Hari Ini';
    if (dateString === yest) return 'Kemarin';
    // Parse as local date (split string, no UTC conversion)
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const hasActiveFilter = dateFilter !== null || filterCategory !== 'ALL' || searchQuery !== '' || filterType !== 'ALL';

  return (
    <>
      <TopAppBar />
      <main className="px-6 pt-6 max-w-2xl mx-auto pb-32">
        {/* Search & Filter Section */}
        <section className="space-y-6 mb-10">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight mb-2">Riwayat Transaksi</h2>
            <p className="text-on-surface-variant text-sm font-medium">Melacak aliran modal berdaulat Anda</p>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-2xl py-3.5 pl-12 pr-6 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/15 focus:border-primary/30 shadow-sm transition-all font-medium outline-none"
              placeholder="Cari transaksi..."
              type="text"
            />
          </div>

          {/* Horizontal Filters — 2 rows */}
          <div className="space-y-2 -mx-6">

            {/* Row 1: Date + Category pickers */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-surface to-transparent" />
              <div className="flex items-center gap-2 overflow-x-auto px-6 scrollbar-hide">
                <DateFilterPicker value={dateFilter} onChange={setDateFilter} />
                <CategoryFilterPicker
                  value={filterCategory}
                  categories={uniqueCategories}
                  onChange={setFilterCategory}
                />
                {hasActiveFilter && (
                  <button
                    onClick={resetAllFilters}
                    className="flex items-center gap-1 pl-3 pr-3.5 py-2 bg-error/8 text-error rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 hover:bg-error/15 active:scale-95 transition-all cursor-pointer border border-error/15"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>close</span>
                    Reset
                  </button>
                )}
                <div className="w-4 shrink-0" />
              </div>
            </div>

            {/* Row 2: Type chips — always visible, no scroll needed */}
            <div className="flex items-center gap-1.5 px-6">
              {(['ALL', 'income', 'expense'] as const).map((type) => {
                const label = type === 'ALL' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran';
                const icon  = type === 'ALL' ? 'filter_list' : type === 'income' ? 'south' : 'north';
                const isActive = filterType === type;
                const activeClass =
                  type === 'income'  ? 'bg-secondary/15 text-secondary border-secondary/20' :
                  type === 'expense' ? 'bg-error/12 text-error border-error/20' :
                                       'bg-on-surface/8 text-on-surface border-transparent';
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0
                      border transition-all duration-200 active:scale-95 cursor-pointer ${
                      isActive
                        ? activeClass
                        : 'bg-transparent border-outline-variant/20 text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>

          </div>


        </section>

        {/* Transactions List Grouped by Date */}
        <section className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <p className="font-medium text-on-surface-variant/50 animate-pulse">Menyelaraskan buku besar...</p>
            </div>
          ) : groupedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <span className="material-symbols-outlined text-5xl mb-4">receipt_long</span>
              <p className="font-body text-sm font-medium">
                {hasActiveFilter ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Buku besar bersih. Tidak ada rekam jejak.'}
              </p>
            </div>
          ) : (
            <>
              {groupedData.map((group, index) => (
                <div key={group.date} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                      {getLabelForDate(group.date)}
                    </h3>
                    {index === 0 && (
                      <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full uppercase">
                        Terkini
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {group.items.map(trx => {
                      const isIncome = Number(trx.amount) < 0;
                      const absoluteAmountStr = Math.abs(Number(trx.amount)).toLocaleString('id-ID');
                      return (
                        <TransactionItem
                          key={trx.id}
                          id={trx.id}
                          icon={trx.category?.icon || 'payments'}
                          category={trx.category?.name || 'Tanpa Kategori'}
                          vendor={trx.note || 'Transaksi Kriptik'}
                          amount={isIncome ? `+ Rp ${absoluteAmountStr}` : `- Rp ${absoluteAmountStr}`}
                          date={(() => {
                            // Ambil YYYY-MM-DD saja, lalu format lokal tanpa konversi timezone
                            const ymd = trx.date.slice(0, 10);
                            const [y, m, d] = ymd.split('-').map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            });
                          })()}
                          isIncome={isIncome}
                          iconColorClass={isIncome ? 'text-secondary' : 'text-primary'}
                          onDelete={() => handleDelete(trx.id)}
                          onEdit={() => handleEdit(trx.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ── Infinite scroll sentinel ── */}
              <div ref={sentinelRef} className="h-4" aria-hidden="true" />

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    <span className="text-sm font-medium">Memuat lebih banyak...</span>
                  </div>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && transactions.length > 0 && !isLoadingMore && (
                <p className="text-center text-[11px] text-on-surface-variant/30 uppercase tracking-widest font-label py-2">
                  — Semua transaksi telah dimuat —
                </p>
              )}
            </>
          )}
        </section>
      </main>
      <BottomNavBar />
    </>
  );
}
