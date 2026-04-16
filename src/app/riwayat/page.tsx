"use client";
import React, { useState, useEffect } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import TransactionItem from '@/components/TransactionItem';

export default function Riwayat() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterTime, setFilterTime] = useState<'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Fetch transactions exactly like on Dashboard
  const loadTransactions = () => {
    fetch('/api/transactions')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (!data.error) setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id));
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Gagal menghapus data dari server');
      }
      // Re-trigger global store or similar if needed, here we just stick to local state optimistic
    } catch (error) {
      alert('Terjadi kesalahan koneksi saat menghapus. Mengembalikan data.');
      loadTransactions(); // refresh
    }
  };

  const handleEdit = (id: string) => {
    // For now, redirect to `/tambah?edit=${id}` or just notify
    alert("Fitur edit akan datang! Transaksi ID: " + id);
  };

  // Get unique categories natively from loaded transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category_id)))
    .map(id => transactions.find(t => t.category_id === id)?.category)
    .filter(Boolean);

  // Filter based on search query and active parameters
  const filteredTransactions = transactions.filter(trx => {
     // 1. Search Logic
     const text = `${trx.note || ''} ${trx.category?.name || ''}`.toLowerCase();
     const matchesSearch = text.includes(searchQuery.toLowerCase());

     // 2. Time Filter Logic
     let matchesTime = true;
     if (filterTime === 'THIS_MONTH') {
       const trxDate = new Date(trx.date);
       const now = new Date();
       matchesTime = trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
     }

     // 3. Category Filter Logic
     let matchesCategory = true;
     if (filterCategory !== 'ALL') {
       matchesCategory = trx.category_id === filterCategory;
     }

     return matchesSearch && matchesTime && matchesCategory;
  });

  // Grouping Function by Date
  const groupTransactions = (trxs: any[]) => {
    const groups: Record<string, any[]> = {};
    trxs.forEach((trx) => {
      // Clean string "YYYY-MM-DD" without timezone interference issues locally
      const dateKey = new Date(trx.date).toLocaleDateString('en-CA'); 
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(trx);
    });
    
    // Convert to Array and sort by date descending
    return Object.keys(groups)
      .sort((a,b) => b.localeCompare(a))
      .map(key => ({
        date: key,
        items: groups[key]
      }));
  };

  const getLabelForDate = (dateString: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');
    
    if (dateString === today) return "Hari Ini";
    if (dateString === yesterday) return "Kemarin";
    
    // Regular date like "22 Mei 2024"
    return new Date(dateString).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const groupedData = groupTransactions(filteredTransactions);

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
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/60 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full py-4 pl-12 pr-6 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright transition-all font-medium outline-none" 
              placeholder="Cari transaksi..." 
              type="text"
            />
          </div>
          {/* Horizontal Filters */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <button 
              onClick={() => setFilterTime(prev => prev === 'THIS_MONTH' ? 'ALL' : 'THIS_MONTH')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filterTime === 'THIS_MONTH' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              {filterTime === 'THIS_MONTH' ? 'Bulan Ini' : 'Semua Waktu'}
            </button>
            
            {/* Category Filter using invisible <select> for native seamless UX */}
            <div className="relative flex">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                {uniqueCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors pointer-events-none ${
                  filterCategory !== 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">category</span>
                {filterCategory === 'ALL' ? 'Kategori' : uniqueCategories.find(c => c.id === filterCategory)?.name}
              </button>
            </div>

            {/* Clear Filters conditionally renders */}
            {(filterTime !== 'THIS_MONTH' || filterCategory !== 'ALL' || searchQuery !== "") && (
              <button 
                onClick={() => { setFilterTime('THIS_MONTH'); setFilterCategory('ALL'); setSearchQuery(""); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-error/10 text-error rounded-full text-sm font-semibold whitespace-nowrap hover:bg-error/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Hapus Filter
              </button>
            )}
          </div>
        </section>

        {/* Transactions List Grouped by Date */}
        <section className="space-y-10">
          {loading ? (
             <div className="flex justify-center items-center py-20">
               <p className="font-medium text-on-surface-variant/50 animate-pulse">Menyelaraskan buku besar...</p>
             </div>
          ) : groupedData.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 opacity-50">
               <span className="material-symbols-outlined text-5xl mb-4">receipt_long</span>
               <p className="font-body text-sm font-medium">Buku besar bersih. Tidak ada rekam jejak.</p>
             </div>
          ) : (
            groupedData.map((group, index) => (
              <div key={group.date} className={`space-y-4 ${index > 1 ? 'opacity-80' : ''}`}>
                <div className="flex justify-between items-end px-2">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                    {getLabelForDate(group.date)}
                  </h3>
                  {/* Provide visual hints similar to design */}
                  {index === 0 && <span className="text-[10px] font-bold text-secondary/80 bg-secondary-container/10 px-2 py-0.5 rounded-full uppercase">Terkini</span>}
                </div>
                <div className="space-y-3">
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
                        amount={isIncome ? `+ Rp${absoluteAmountStr}` : `- Rp${absoluteAmountStr}`}
                        date={new Date(trx.date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        iconColorClass={isIncome ? "text-secondary" : "text-primary"}
                        onDelete={() => handleDelete(trx.id)}
                        onEdit={() => handleEdit(trx.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
      <BottomNavBar />
    </>
  );
}
