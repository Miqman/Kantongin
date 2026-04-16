"use client";
import React from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import TransactionItem from './TransactionItem';

export default function RecentTransactions() {
  const { transactions, isLoading: loading } = useStore();

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-lg font-semibold tracking-tight">Recent Transactions</h2>
        <Link href="/riwayat" className='text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all'>
          See All
        </Link>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-on-surface-variant text-center my-6">Memuat log transaksi...</p>
        ) : transactions.length > 0 ? (
          transactions.slice(0, 5).map((trx: any) => {
            const isIncome = Number(trx.amount) < 0;
            const absoluteAmountStr = `${Math.abs(Number(trx.amount)).toLocaleString('id-ID')}K`;
            
            return (
              <TransactionItem
                key={trx.id}
                icon={trx.category?.icon || 'payments'}
                category={trx.category?.name || 'Tanpa Kategori'}
                vendor={trx.note || 'Transaksi Biasa'}
                amount={isIncome ? `+Rp ${absoluteAmountStr}` : `-Rp ${absoluteAmountStr}`}
                date={new Date(trx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                iconColorClass={isIncome ? "text-secondary" : "text-primary"}
              />
            );
          })
        ) : (
          <p className="text-sm text-on-surface-variant opacity-70 text-center my-6">Belum ada transaksi.</p>
        )}
      </div>
    </section>
  );
}
