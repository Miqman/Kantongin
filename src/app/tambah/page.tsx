"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

function TambahTransaksiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { categories, addTransaction, updateTransaction, transactions } = useStore();

  // Functional States
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // UI States
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId && !editId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId, editId]);

  useEffect(() => {
    if (editId && transactions.length > 0) {
      const txToEdit = transactions.find(t => t.id === editId);
      if (txToEdit) {
        setTransactionType(Number(txToEdit.amount) < 0 ? 'income' : 'expense');
        setAmount(Math.abs(Number(txToEdit.amount)).toString());
        setSelectedCategoryId(txToEdit.category_id);
        setNote(txToEdit.note || '');
        setDate(txToEdit.date);
      }
    }
  }, [editId, transactions]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !selectedCategoryId) {
      toast.error("Masukkan nominal dan kategori yang valid.");
      return;
    }

    setLoading(true);
    try {
      const finalAmount = transactionType === 'income' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

      if (editId) {
        await updateTransaction(editId, {
          amount: finalAmount,
          category_id: selectedCategoryId,
          note,
          date,
        });
        toast.success("Transaksi berhasil diperbarui");
      } else {
        await addTransaction({
          amount: finalAmount,
          category_id: selectedCategoryId,
          note,
          date,
        });
        toast.success("Transaksi berhasil disimpan");
      }

      router.push('/riwayat');
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat menyimpan transaksi.");
      setLoading(false);
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="px-6 pt-8 max-w-lg mx-auto pb-32">

        {/* switch income and expense */}
        <div className="flex bg-surface-container-low rounded-full p-1.5 mb-8 max-w-[260px] mx-auto border border-outline-variant/20 shadow-sm">
          <button
            onClick={() => setTransactionType('expense')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${transactionType === 'expense' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setTransactionType('income')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${transactionType === 'income' ? 'bg-secondary text-on-secondary shadow-md' : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Hero Amount Display */}
        <section className="mb-10 text-center">
          <label className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/70 mb-3 block font-semibold">
            {transactionType === 'expense' ? 'Jumlah Pengeluaran' : 'Jumlah Pemasukan'}
          </label>
          <div className="relative inline-flex items-baseline bg-surface-container-low/50 px-6 py-4 rounded-3xl">
            <span className={`font-headline text-2xl font-extrabold mr-2 ${transactionType === 'expense' ? 'text-primary' : 'text-secondary'}`}>Rp</span>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              className={`bg-transparent border-none focus:ring-0 p-0 font-headline text-5xl font-extrabold w-full max-w-[240px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${transactionType === 'expense' ? 'text-on-surface selection:bg-primary/30' : 'text-secondary selection:bg-secondary/30'}`}
              placeholder="0"
            />
            <div className={`absolute bottom-3 left-6 right-6 h-0.5 rounded-full ${transactionType === 'expense' ? 'bg-primary/30' : 'bg-secondary/30'}`}></div>
          </div>
        </section>

        {/* Dynamic Category Bento Grid */}
        <section className="mb-8">
          <h2 className="font-headline text-sm font-semibold text-on-surface mb-4 ml-1">Pilih Kategori</h2>
          {categories.length === 0 ? (
            <p className="text-center text-on-surface-variant text-sm my-6">Memuat kategori...</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border group cursor-pointer ${isSelected
                      ? 'bg-primary/10 border-primary/30 dark:bg-primary/15 dark:border-primary/40 ring-1 ring-primary/20'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/20 dark:bg-surface-container-low dark:border-outline-variant/10 dark:hover:bg-surface-container'
                      }`}
                  >
                    <div style={{ backgroundColor: `${cat.color}18` }} className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform`}>
                      <span style={{ color: cat.color }} className="material-symbols-outlined text-xl">{cat.icon}</span>
                    </div>
                    <span className={`font-label text-[10px] font-semibold text-center leading-tight ${isSelected ? 'text-primary dark:text-primary' : 'text-on-surface-variant'}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Transaction Details */}
        <section className="space-y-4">
          {/* Premium Date Selector */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full h-auto p-4 rounded-2xl flex items-center justify-start gap-3 border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low shadow-sm transition-all text-sm font-body font-medium cursor-pointer",
                !date && "text-on-surface-variant"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="text-primary size-4" />
              </div>
              {date ? (
                <span className="text-on-surface">{format(parseISO(date), "EEEE, d MMMM yyyy", { locale: id })}</span>
              ) : (
                <span>Pilih tanggal</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg" align="start">
              <Calendar
                mode="single"
                selected={date ? parseISO(date) : undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setDate(format(selectedDate, "yyyy-MM-dd"));
                    setOpen(false);
                  }
                }}
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>

          {/* Note Field with Auto-Suggest functionality simulated */}
          <div className="space-y-3">
            <div className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3 border border-outline-variant/20 shadow-sm focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant/60 text-xl">notes</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full placeholder:text-on-surface-variant/50 outline-none"
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
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/20 text-[11px] font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Action Controls */}
        <div className="mt-10">
          <button
            disabled={loading}
            onClick={handleSave}
            className={`w-full py-5 rounded-full font-headline font-bold text-lg shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-wait cursor-pointer ${
              transactionType === 'expense' 
                ? 'bg-primary text-on-primary shadow-primary/25 hover:shadow-primary/40' 
                : 'bg-secondary text-on-secondary shadow-secondary/25 hover:shadow-secondary/40'
            }`}
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}

export default function TambahTransaksi() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-on-surface-variant">Memuat...</div>}>
      <TambahTransaksiContent />
    </Suspense>
  );
}

