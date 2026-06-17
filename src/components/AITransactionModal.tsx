"use client";
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { toast } from 'react-hot-toast';
import type { ParsedTransaction } from '@/lib/ai/types';
import type { TransactionInput } from '@/types';

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

/** One editable row in the item list */
interface EditableItem {
  id: string;
  name: string;
  amount: string; // string for controlled input
  categoryId: string;
  checked: boolean;
}

type SaveMode = 'total' | 'items';

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
// Helper: find best matching category id from a hint
// ─────────────────────────────────────────────────────────────────────────────

function matchCategory(
  hint: string | null,
  categories: { id: string; name: string }[],
  fallback: string
): string {
  if (!hint || categories.length === 0) return fallback;
  const lower = hint.toLowerCase();
  const matched = categories.find(
    (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
  );
  return matched?.id ?? fallback;
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
  const { categories, addTransaction, addTransactionsBulk } = useStore();

  // ── Single-total mode state ──────────────────────────────────────────────
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isSaving, setIsSaving] = useState(false);

  // ── Items mode state ─────────────────────────────────────────────────────
  const [saveMode, setSaveMode] = useState<SaveMode>('total');
  const [localItems, setLocalItems] = useState<EditableItem[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close inline picker when clicking outside the item list
  useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close if the click is not inside any item card
      if (!target.closest('[data-item-card]')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  // Sync from AI result when result changes
  React.useEffect(() => {
    if (result) {
      const absAmount = result.amount !== null ? Math.abs(result.amount).toString() : '';
      setAmount(absAmount);
      setNote(result.note ?? '');
      setDate(result.date ?? format(new Date(), 'yyyy-MM-dd'));
      setTransactionType(result.transaction_type === 'income' ? 'income' : 'expense');

      const fallbackCatId = categories[0]?.id ?? '';

      // Match category for total
      const totalCatId = matchCategory(result.category_hint, categories, fallbackCatId);
      setSelectedCategoryId(totalCatId);

      // Populate editable items from AI result
      if (result.items && result.items.length > 0) {
        const mapped: EditableItem[] = result.items.map((item, idx) => ({
          id: `item-${idx}`,
          name: item.name,
          amount: item.amount.toString(),
          categoryId: matchCategory(item.category_hint, categories, totalCatId),
          checked: true,
        }));
        setLocalItems(mapped);
        // Default to items mode when items are detected
        setSaveMode('items');
      } else {
        setLocalItems([]);
        setSaveMode('total');
      }
    }
  }, [result, categories]);

  // ── Computed values ──────────────────────────────────────────────────────
  const checkedItems = useMemo(
    () => localItems.filter((item) => item.checked && Number(item.amount) > 0),
    [localItems]
  );

  const itemsTotal = useMemo(
    () => checkedItems.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0),
    [checkedItems]
  );

  // ── Item edit helpers ────────────────────────────────────────────────────
  const updateItem = useCallback(
    <K extends keyof EditableItem>(id: string, key: K, value: EditableItem[K]) => {
      setLocalItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      );
    },
    []
  );

  const toggleAll = useCallback((checked: boolean) => {
    setLocalItems((prev) => prev.map((item) => ({ ...item, checked })));
  }, []);

  // ── Save: single total ───────────────────────────────────────────────────
  const handleSaveTotal = useCallback(async () => {
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

  // ── Save: bulk items ─────────────────────────────────────────────────────
  const handleSaveBulk = useCallback(async () => {
    if (checkedItems.length === 0) {
      toast.error('Pilih minimal satu item untuk disimpan.');
      return;
    }
    const invalid = checkedItems.find(
      (item) => !item.categoryId || isNaN(Number(item.amount)) || Number(item.amount) <= 0
    );
    if (invalid) {
      toast.error('Pastikan semua item yang dipilih memiliki nominal dan kategori valid.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: TransactionInput[] = checkedItems.map((item) => ({
        amount: Math.abs(Number(item.amount)), // expense = positive
        category_id: item.categoryId,
        note: item.name.slice(0, 255),
        date,
      }));
      await addTransactionsBulk(payload);
      toast.success(`${checkedItems.length} transaksi berhasil disimpan 🎉`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  }, [checkedItems, date, addTransactionsBulk, onClose]);

  const handleSave = saveMode === 'items' ? handleSaveBulk : handleSaveTotal;

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

  const hasItems = localItems.length > 0;
  const allChecked = localItems.length > 0 && localItems.every((i) => i.checked);

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

        {/* Mode toggle — only shown when items are detected */}
        {result && !isLoading && !error && hasItems && (
          <div className="px-6 pb-3 flex-shrink-0">
            <div className="flex gap-1 p-1 bg-surface-container-low rounded-2xl">
              <button
                id="ai-modal-mode-total"
                onClick={() => setSaveMode('total')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5
                  ${saveMode === 'total'
                    ? 'bg-surface text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                Gabung Total
              </button>
              <button
                id="ai-modal-mode-items"
                onClick={() => setSaveMode('items')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5
                  ${saveMode === 'items'
                    ? 'bg-surface text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">list_alt</span>
                Pecah per Item
                <span className="bg-secondary/15 text-secondary text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {localItems.length}
                </span>
              </button>
            </div>
          </div>
        )}

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
              {/* ── MODE: GABUNG TOTAL ──────────────────────────────────── */}
              {saveMode === 'total' && (
                <>
                  {/* Premium Summary Card */}
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
                </>
              )}

              {/* ── MODE: PECAH PER ITEM ────────────────────────────────── */}
              {saveMode === 'items' && (
                <>
                  {/* Select all header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <input
                        id="ai-modal-select-all"
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="w-4 h-4 rounded accent-secondary cursor-pointer"
                      />
                      <label htmlFor="ai-modal-select-all" className="text-xs font-bold text-on-surface-variant cursor-pointer select-none">
                        Pilih semua
                      </label>
                    </div>
                    <span className="text-[10px] text-on-surface-variant/60 font-semibold">
                      {checkedItems.length}/{localItems.length} dipilih
                    </span>
                  </div>

                  {/* Item list */}
                  <div className="space-y-2">
                    {localItems.map((item) => {
                      const cat = categories.find((c) => c.id === item.categoryId);
                      return (
                        <div
                          key={item.id}
                          data-item-card
                          className={`rounded-2xl border p-3 transition-all ${
                            item.checked
                              ? 'bg-surface-container-lowest border-outline-variant/20'
                              : 'bg-surface-container-low/50 border-outline-variant/10 opacity-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => updateItem(item.id, 'checked', e.target.checked)}
                              className="w-4 h-4 mt-0.5 rounded accent-secondary cursor-pointer flex-shrink-0"
                            />

                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Name input */}
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                disabled={!item.checked}
                                placeholder="Nama item..."
                                className="w-full bg-transparent text-sm font-semibold text-on-surface placeholder-on-surface-variant/40 outline-none border-b border-outline-variant/20 pb-1 focus:border-secondary transition-colors disabled:opacity-40"
                              />

                              <div className="flex items-center gap-2">
                                {/* Amount input */}
                                <div className="flex items-center gap-1 flex-1">
                                  <span className="text-xs font-bold text-on-surface-variant/60">Rp</span>
                                  <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                    disabled={!item.checked}
                                    placeholder="0"
                                    min="0"
                                    className="flex-1 bg-transparent text-sm font-bold text-on-surface placeholder-on-surface-variant/40 outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>

                                {/* Category trigger pill */}
                                <button
                                  type="button"
                                  disabled={!item.checked}
                                  onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-surface-container disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors hover:bg-surface-container-high group flex-shrink-0"
                                >
                                  {cat ? (
                                    <div
                                      style={{ backgroundColor: `${cat.color}20` }}
                                      className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
                                    >
                                      <span style={{ color: cat.color }} className="material-symbols-outlined !text-[10px]">
                                        {cat.icon}
                                      </span>
                                    </div>
                                  ) : null}
                                  <span className="text-[11px] font-semibold text-on-surface-variant max-w-[72px] truncate">
                                    {cat?.name ?? 'Kategori'}
                                  </span>
                                  <span className="material-symbols-outlined !text-[10px] text-on-surface-variant/60 transition-transform duration-200" style={{ transform: openDropdownId === item.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    expand_more
                                  </span>
                                </button>
                              </div>

                              {/* Inline category picker — expands inside the card */}
                              {openDropdownId === item.id && (
                                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-outline-variant/10">
                                  {categories.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        updateItem(item.id, 'categoryId', c.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-left
                                        ${
                                          item.categoryId === c.id
                                            ? 'bg-secondary/12 text-secondary ring-1 ring-secondary/30'
                                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                                        }`}
                                    >
                                      <div
                                        style={{ backgroundColor: `${c.color}20` }}
                                        className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                                      >
                                        <span style={{ color: c.color }} className="material-symbols-outlined !text-[12px]">
                                          {c.icon}
                                        </span>
                                      </div>
                                      <span className="flex-1 truncate leading-tight">{c.name}</span>
                                      {item.categoryId === c.id && (
                                        <span className="material-symbols-outlined !text-[12px] text-secondary flex-shrink-0">check</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary bar */}
                  <div className="bg-secondary/8 rounded-2xl px-4 py-3 flex items-center justify-between border border-secondary/15">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">calculate</span>
                      <span className="text-xs font-bold text-on-surface-variant">
                        {checkedItems.length} item dipilih
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold text-secondary">Rp</span>
                      <span className="text-base font-black text-on-surface">
                        {itemsTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Date context */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-sm">calendar_today</span>
                    <span className="text-xs text-on-surface-variant/70">
                      Semua item akan disimpan pada{' '}
                      <span className="font-semibold text-on-surface">
                        {date ? format(parseISO(date), 'd MMMM yyyy', { locale: id }) : '—'}
                      </span>
                    </span>
                  </div>
                </>
              )}
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
                disabled={isSaving || (saveMode === 'items' && checkedItems.length === 0)}
                className={`w-full py-4 rounded-2xl font-headline font-bold text-base shadow-lg active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  saveMode === 'items'
                    ? 'bg-secondary text-on-secondary shadow-secondary/20'
                    : transactionType === 'expense'
                    ? 'bg-primary text-on-primary shadow-primary/20'
                    : 'bg-secondary text-on-secondary shadow-secondary/20'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Menyimpan...
                  </span>
                ) : saveMode === 'items' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">save</span>
                    {checkedItems.length > 0
                      ? `Simpan ${checkedItems.length} Transaksi`
                      : 'Pilih Item untuk Disimpan'}
                  </span>
                ) : (
                  'Simpan Transaksi'
                )}
              </button>
            )}

            {onEditInForm && result && !error && saveMode === 'total' && (
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
