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
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-base font-bold tracking-tight text-on-surface">Transaksi terakhir</h2>
        <Link
          href="/riwayat"
          className="text-[10px] font-semibold text-primary/80 hover:text-primary uppercase tracking-[0.1em] active:scale-95 transition-all duration-150 flex items-center gap-0.5"
        >
          Lihat semua
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>
        </Link>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[60px] rounded-2xl skeleton-wave" />
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
                vendor={trx.note || 'Transaksi biasa'}
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
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: '24px' }}>receipt_long</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-on-surface-variant/60">Belum ada transaksi</p>
              <p className="text-xs text-on-surface-variant/40 mt-0.5">Tambahkan transaksi pertamamu</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
