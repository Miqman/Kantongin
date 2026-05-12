"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import TransactionItem from './TransactionItem';

export default function RecentTransactions() {
  const { transactions, isLoading: loading, deleteTransaction } = useStore();
  const router = useRouter();

  // Take the 5 most recent transactions (already sorted desc by store)
  const recent = transactions.slice(0, 5);

  const handleEdit = (id: string) => {
    router.push(`/tambah?edit=${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-lg font-bold tracking-tight">Transaksi Terakhir</h2>
        <Link
          href="/riwayat"
          className="text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          /* Skeleton */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-container-high animate-pulse" />
          ))
        ) : recent.length > 0 ? (
          recent.map((trx: any) => {
            const isIncome = Number(trx.amount) < 0;
            const absoluteAmountStr = Math.abs(Number(trx.amount)).toLocaleString('id-ID');

            return (
              <TransactionItem
                key={trx.id}
                id={trx.id}
                icon={trx.category?.icon || 'payments'}
                category={trx.category?.name || 'Tanpa Kategori'}
                vendor={trx.note || 'Transaksi Biasa'}
                amount={isIncome ? `+ Rp ${absoluteAmountStr}` : `- Rp ${absoluteAmountStr}`}
                date={new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                isIncome={isIncome}
                iconColorClass={isIncome ? "text-secondary" : "text-primary"}
                onEdit={() => handleEdit(trx.id)}
                onDelete={() => handleDelete(trx.id)}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant/40">receipt_long</span>
            <p className="text-sm text-on-surface-variant font-medium">Belum ada transaksi.</p>
          </div>
        )}
      </div>
    </section>
  );
}
