"use client";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function BudgetCard() {
  const { budgets, setBudget, deleteBudget } = useStore();

  // Global monthly budget (no category)
  const activeBudget = Array.isArray(budgets)
    ? budgets.find((b: any) => b.period === 'monthly' && !b.category_id)
    : null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Sync input with current budget when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setInputValue(activeBudget ? String(activeBudget.limit_amount) : '');
    }
  }, [sheetOpen, activeBudget]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('id-ID').format(num);

  const parseInput = (raw: string) =>
    Number(raw.replace(/\D/g, ''));

  const handleSave = async () => {
    const amount = parseInput(inputValue);
    if (!amount || amount <= 0) {
      toast.error('Masukkan nominal yang valid');
      return;
    }
    setSaving(true);
    try {
      await setBudget(amount, 'monthly');
      toast.success('Budget bulanan berhasil disimpan!');
      setSheetOpen(false);
    } catch {
      toast.error('Gagal menyimpan budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeBudget) return;
    try {
      await deleteBudget(activeBudget.id);
      toast.success('Budget berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus budget');
    }
  };

  // Format while typing: "1500000" → "1.500.000"
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setInputValue(raw ? Number(raw).toLocaleString('id-ID') : '');
  };

  const progressPct = activeBudget ? 0 : 0; // will be enriched from HeroSection data if needed

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────── */}
      <div
        className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col justify-between border border-primary/10 cursor-pointer hover:bg-surface-container transition-colors group"
        onClick={() => setSheetOpen(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          {activeBudget && (
            <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary px-2.5 py-1 rounded-full">
              Aktif
            </span>
          )}
        </div>

        <div>
          <h3 className="font-headline font-bold text-lg">Budget Bulanan</h3>
          {activeBudget ? (
            <p className="text-primary font-bold text-base mt-1">
              Rp {formatCurrency(activeBudget.limit_amount)}
            </p>
          ) : (
            <p className="text-on-surface-variant text-sm mt-1">Tap untuk atur batas pengeluaran</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span className="text-xs font-bold">{activeBudget ? 'Ubah' : 'Atur'} budget</span>
        </div>
      </div>

      {/* ── Bottom Sheet ──────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999]"
            style={{ maxHeight: '80dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-headline font-bold text-lg">
                {activeBudget ? 'Ubah Budget Bulanan' : 'Atur Budget Bulanan'}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
              </button>
            </div>

            <div className="px-6 pb-8 space-y-6">
              {/* Description */}
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Batas pengeluaran total per bulan. Sisa budget akan tampil di dashboard.
              </p>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                  Nominal Budget
                </label>
                <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/15 rounded-2xl px-4 py-4 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <span className="text-on-surface-variant font-bold text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="0"
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-on-surface font-headline font-bold text-xl placeholder:text-on-surface-variant/30"
                  />
                </div>
              </div>

              {/* Quick picks */}
              <div className="flex gap-2 flex-wrap">
                {[500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInputValue(amt.toLocaleString('id-ID'))}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    {amt >= 1_000_000 ? `${amt / 1_000_000}jt` : `${amt / 1_000}rb`}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {activeBudget && (
                  <button
                    onClick={() => { setSheetOpen(false); setDeleteConfirm(true); }}
                    className="px-5 py-3.5 rounded-full text-sm font-bold text-error border border-error/20 hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-full text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Budget'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation ───────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        variant="danger"
        icon="delete"
        title="Hapus Budget?"
        message="Kartu Sisa Budget di dashboard akan tersembunyi. Anda bisa mengaturnya kembali kapan saja."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />
    </>
  );
}
