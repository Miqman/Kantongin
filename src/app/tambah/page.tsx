"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

export default function TambahTransaksi() {
  const router = useRouter();

  // Functional States
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  // Fetch categories from Backend API
  useEffect(() => {
    fetch('/api/categories')
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat kategori");
        return res.json();
      })
      .then((data) => {
        if (!data.error) {
          setCategories(data);
          // Set default selected category to the first one available
          if (data.length > 0) setSelectedCategoryId(data[0].id);
        }
        setFetchingCategories(false);
      })
      .catch((err) => {
        console.error(err);
        setFetchingCategories(false);
      });
  }, []);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !selectedCategoryId) {
      alert("Masukkan nominal dan kategori yang valid.");
      return;
    }

    setLoading(true);
    try {
      // By our backend convention: Positive numbers are Expenses, Negative numbers are Incomes
      const finalAmount = transactionType === 'income' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          category_id: selectedCategoryId,
          note,
          date: new Date(date).toISOString(),
        })
      });

      if (!res.ok) throw new Error("Gagal merespon peladen");

      // Navigate to History view after success
      router.push('/riwayat');
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menyimpan transaksi.");
      setLoading(false);
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="px-6 pt-8 max-w-lg mx-auto pb-32">

        {/* switch income and expense */}
        <div className="flex bg-surface-container-low rounded-full p-1 mb-8 max-w-[240px] mx-auto border border-outline-variant/10 shadow-inner">
          <button 
            onClick={() => setTransactionType('expense')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              transactionType === 'expense' ? 'bg-surface-bright text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pengeluaran
          </button>
          <button 
            onClick={() => setTransactionType('income')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              transactionType === 'income' ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Hero Amount Display */}
        <section className="mb-10 text-center">
          <label className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-2 block">
            {transactionType === 'expense' ? 'Jumlah Pengeluaran' : 'Jumlah Pemasukan'}
          </label>
          <div className="relative inline-flex items-baseline">
            <span className={`font-headline text-2xl font-extrabold mr-2 ${transactionType === 'expense' ? 'text-primary' : 'text-secondary'}`}>Rp</span>
            <input
              autoFocus
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`bg-transparent border-none focus:ring-0 p-0 font-headline text-6xl font-extrabold w-full max-w-[280px] outline-none ${transactionType === 'expense' ? 'text-on-surface selection:bg-primary/30' : 'text-secondary selection:bg-secondary/30'}`}
              placeholder="0"
            />
            <div className={`absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent ${transactionType === 'expense' ? 'via-primary/40' : 'via-secondary/40'}`}></div>
          </div>
        </section>

        {/* Dynamic Category Bento Grid */}
        <section className="mb-8">
          <h2 className="font-headline text-sm font-semibold text-on-surface-variant mb-4 ml-1">Pilih Kategori</h2>
          {fetchingCategories ? (
            <p className="text-center text-on-surface-variant text-sm my-6">Memuat kategori...</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all border group ${isSelected
                        ? 'bg-surface-container-highest border-primary/30 shadow-md ring-1 ring-primary/20 scale-105'
                        : 'bg-surface-container-low hover:bg-surface-container-high border-outline-variant/5'
                      }`}
                  >
                    <div style={{ backgroundColor: `${cat.color}20` }} className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <span style={{ color: cat.color }} className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <span className={`font-label text-[11px] font-medium text-center ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Transaction Details */}
        <section className="space-y-4">
          {/* Native HTML Date Selector - styled consistently */}
          <div className="bg-surface-container-low p-4 rounded-full flex items-center gap-3 border border-outline-variant/5 focus-within:ring-1 focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none text-sm font-body font-medium flex-1 outline-none appearance-none text-on-surface"
            />
          </div>

          {/* Note Field with Auto-Suggest functionality simulated */}
          <div className="space-y-3">
            <div className="bg-surface-container-low p-4 rounded-full flex items-center gap-3 border border-outline-variant/5 focus-within:bg-surface-bright focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">notes</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full placeholder:text-on-surface-variant/40 outline-none"
                placeholder="Tambah catatan (opsional)"
                type="text"
              />
            </div>

            {/* Auto-suggest chips component mapping */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['Makan Siang', 'Gojek', 'Coffee Break', 'Belanja Bulanan'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setNote(suggestion)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-[11px] font-medium text-primary-fixed-dim hover:bg-primary/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Action Controls */}
        <div className="mt-8">
          <button
            disabled={loading}
            onClick={handleSave}
            className="w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg shadow-[0px_24px_48px_rgba(6,14,32,0.4)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait"
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
