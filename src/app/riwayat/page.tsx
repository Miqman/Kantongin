"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import TransactionItem from '@/components/TransactionItem';
import DateFilterPicker, { DateFilterValue } from '@/components/DateFilterPicker';
import CategoryFilterPicker from '@/components/CategoryFilterPicker';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import type { Transaction, Category } from '@/types';

export default function Riwayat() {
  const {
    transactions,
    isLoading,
    isLoadingMore,
    hasMore,
    deleteTransaction,
    loadMoreTransactions,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const router = useRouter();

  // ── Infinite scroll via Intersection Observer ──
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await loadMoreTransactions();
  }, [hasMore, isLoadingMore, loadMoreTransactions]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' } // Trigger 200px before reaching bottom
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Terjadi kesalahan koneksi saat menghapus.');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/tambah?edit=${id}`);
  };

  // Get unique categories natively from loaded transactions
  const uniqueCategories: Category[] = Array.from(new Set(transactions.map(t => t.category_id)))
    .map(id => transactions.find(t => t.category_id === id)?.category)
    .filter((c): c is Category => c != null);

  // Filter based on search query and active parameters
  const filteredTransactions = transactions.filter(trx => {
    // 1. Search Logic
    const text = `${trx.note || ''} ${trx.category?.name || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());

    // 2. Date Filter Logic
    let matchesDate = true;
    if (dateFilter) {
      const trxDate = new Date(trx.date);
      if (dateFilter.mode === 'RANGE') {
        const from = dateFilter.from ? new Date(new Date(dateFilter.from).setHours(0, 0, 0, 0)) : null;
        const to = dateFilter.to ? new Date(new Date(dateFilter.to).setHours(23, 59, 59, 999)) : null;
        if (from) matchesDate = matchesDate && trxDate >= from;
        if (to) matchesDate = matchesDate && trxDate <= to;
      } else if (dateFilter.mode === 'MONTH') {
        matchesDate =
          trxDate.getMonth() === dateFilter.month &&
          trxDate.getFullYear() === dateFilter.year;
      } else if (dateFilter.mode === 'YEAR') {
        matchesDate = trxDate.getFullYear() === dateFilter.year;
      }
    }

    // 3. Category Filter Logic
    let matchesCategory = true;
    if (filterCategory !== 'ALL') {
      matchesCategory = trx.category_id === filterCategory;
    }

    return matchesSearch && matchesDate && matchesCategory;
  });

  // Grouping Function by Date
  const groupTransactions = (trxs: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    trxs.forEach((trx) => {
      const dateKey = new Date(trx.date).toLocaleDateString('en-CA');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(trx);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({ date: key, items: groups[key] }));
  };

  const getLabelForDate = (dateString: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');

    if (dateString === today) return "Hari Ini";
    if (dateString === yesterday) return "Kemarin";
    return new Date(dateString).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const groupedData = groupTransactions(filteredTransactions);
  const hasActiveFilter = dateFilter !== null || filterCategory !== 'ALL' || searchQuery !== "";

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
          {/* Horizontal Filters */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <DateFilterPicker value={dateFilter} onChange={setDateFilter} />
            <CategoryFilterPicker
              value={filterCategory}
              categories={uniqueCategories}
              onChange={setFilterCategory}
            />
            {hasActiveFilter && (
              <button
                onClick={() => { setDateFilter(null); setFilterCategory('ALL'); setSearchQuery(""); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-error/10 text-error rounded-full text-xs font-bold whitespace-nowrap hover:bg-error/20 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Hapus Filter
              </button>
            )}
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
              <p className="font-body text-sm font-medium">Buku besar bersih. Tidak ada rekam jejak.</p>
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
                          date={new Date(trx.date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          isIncome={isIncome}
                          iconColorClass={isIncome ? "text-secondary" : "text-primary"}
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
