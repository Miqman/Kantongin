"use client";
import React, { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import type { ParsedTransaction } from '@/lib/ai/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AITransactionModalProps {
  open: boolean;
  result: ParsedTransaction | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  /** Called when user edits in form instead of saving directly */
  onEditInForm?: (prefill: {
    amount: string;
    categoryId: string;
    note: string;
    date: string;
    transactionType: 'expense' | 'income';
  }) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence badge
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: ParsedTransaction['confidence'] }) {
  const map = {
    high: { label: 'Akurasi Tinggi', cls: 'bg-secondary/10 text-secondary border-secondary/20' },
    medium: { label: 'Akurasi Sedang', cls: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
    low: { label: 'Akurasi Rendah', cls: 'bg-error/10 text-error border-error/20' },
  };
  const { label, cls } = map[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[8px] font-bold capitalize tracking-wider ${cls}`}>
      <span className="material-symbols-outlined !text-[12px]">
        {level === 'high' ? 'verified' : level === 'medium' ? 'info' : 'warning'}
      </span>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl animate-spin">progress_activity</span>
        </div>
        <div>
          <div className="h-4 w-32 bg-surface-container-high rounded-full mb-1.5" />
          <div className="h-3 w-20 bg-surface-container rounded-full" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 bg-surface-container-low rounded-2xl" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

export default function AITransactionModal({
  open,
  result,
  isLoading,
  error,
  onClose,
  onEditInForm,
}: AITransactionModalProps) {
  const { categories, addTransaction } = useStore();

  // Editable local state (pre-filled from AI result)
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isSaving, setIsSaving] = useState(false);

  // Sync from AI result when result changes
  React.useEffect(() => {
    if (result) {
      const absAmount = result.amount !== null ? Math.abs(result.amount).toString() : '';
      setAmount(absAmount);
      setNote(result.note ?? '');
      setDate(result.date ?? format(new Date(), 'yyyy-MM-dd'));
      setTransactionType(result.transaction_type === 'income' ? 'income' : 'expense');

      // Match category by hint
      if (result.category_hint && categories.length > 0) {
        const hint = result.category_hint.toLowerCase();
        const matched = categories.find(
          (c) =>
            c.name.toLowerCase().includes(hint) ||
            hint.includes(c.name.toLowerCase())
        );
        setSelectedCategoryId(matched?.id ?? categories[0]?.id ?? '');
      } else if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }
    }
  }, [result, categories]);

  const handleSave = useCallback(async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !selectedCategoryId) {
      toast.error('Nominal dan kategori harus diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const finalAmount =
        transactionType === 'income'
          ? -Math.abs(Number(amount))
          : Math.abs(Number(amount));

      await addTransaction({
        amount: finalAmount,
        category_id: selectedCategoryId,
        note,
        date,
      });

      toast.success('Transaksi berhasil disimpan 🎉');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  }, [amount, selectedCategoryId, transactionType, note, date, addTransaction, onClose]);

  const handleEditInForm = useCallback(() => {
    onEditInForm?.({
      amount,
      categoryId: selectedCategoryId,
      note,
      date,
      transactionType,
    });
    onClose();
  }, [amount, selectedCategoryId, note, date, transactionType, onEditInForm, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] flex flex-col">
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary flex-shrink-0" />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 pt-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
            </div>
            <div className="flex flex-col items-start gap-1">
              <h2 id="ai-modal-title" className="font-headline text-base font-bold text-on-surface leading-tight">
                Hasil Deteksi AI
              </h2>
              {result && !isLoading && (
                <ConfidenceBadge level={result.confidence} />
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {isLoading && <LoadingSkeleton />}

          {error && !isLoading && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-2xl">sentiment_dissatisfied</span>
              </div>
              <p className="font-body text-sm text-on-surface-variant">{error}</p>
              <p className="font-body text-xs text-on-surface-variant/60 mt-1">
                Coba lagi atau masukkan manual di form.
              </p>
            </div>
          )}

          {result && !isLoading && !error && (
            <div className="space-y-4 pb-2">
              {/* Premium Summary Card (Amount & Type) */}
              <div className="text-center py-4 px-4 bg-surface-container-low rounded-3xl border border-outline-variant/10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2.5 ${transactionType === 'expense'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {transactionType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-xl font-extrabold font-headline ${transactionType === 'expense' ? 'text-primary' : 'text-secondary'}`}>Rp</span>
                  <span className="text-4xl font-black font-headline text-on-surface tracking-tight">
                    {amount ? Number(amount).toLocaleString('id-ID') : '0'}
                  </span>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/20 space-y-4">
                {/* Kategori */}
                <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/15">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Kategori</span>
                  {(() => {
                    const cat = categories.find((c) => c.id === selectedCategoryId);
                    if (!cat) return <span className="text-sm font-semibold text-on-surface">—</span>;
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: `${cat.color}18` }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                        >
                          <span style={{ color: cat.color }} className="material-symbols-outlined text-base">
                            {cat.icon}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-on-surface">{cat.name}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Tanggal */}
                <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/15">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Tanggal</span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-base">calendar_today</span>
                    <span className="text-sm font-semibold">
                      {date ? format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: id }) : '—'}
                    </span>
                  </div>
                </div>

                {/* Catatan */}
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mt-1">Catatan</span>
                  <div className="flex items-start gap-2 text-on-surface max-w-[65%] text-right justify-end">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-base mt-0.5">notes</span>
                    <span className="text-sm font-semibold leading-relaxed break-words text-left">
                      {note || <span className="text-on-surface-variant/40 italic font-body">Tidak ada catatan</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons — sticky at bottom */}
        {!isLoading && (
          <div className="px-6 py-4 space-y-2 flex-shrink-0 border-t border-outline-variant/10">
            {result && !error && (
              <button
                id="ai-modal-save-btn"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-4 rounded-2xl font-headline font-bold text-base shadow-lg active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-wait cursor-pointer ${transactionType === 'expense'
                  ? 'bg-primary text-on-primary shadow-primary/20'
                  : 'bg-secondary text-on-secondary shadow-secondary/20'
                  }`}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Transaksi'
                )}
              </button>
            )}

            {onEditInForm && result && !error && (
              <button
                id="ai-modal-edit-btn"
                onClick={handleEditInForm}
                className="w-full py-3 rounded-2xl text-on-surface-variant font-body text-sm font-medium hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit di Form
              </button>
            )}

            {error && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-surface-container text-on-surface font-body text-sm font-semibold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Tutup
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
