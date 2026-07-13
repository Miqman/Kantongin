"use client";
import React, { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

type TransactionItemProps = {
  id?: string;
  icon: string;
  category: string;
  vendor: string;
  amount: string;
  date: string;
  isIncome?: boolean;
  iconColorClass?: string;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function TransactionItem({
  icon,
  category,
  vendor,
  amount,
  date,
  isIncome = false,
  iconColorClass = "text-primary",
  onDelete,
  onEdit,
}: TransactionItemProps) {
  /**
   * Use inline CSS vars instead of Tailwind classes so the color always
   * maps to the active theme's vivid tokens, regardless of which theme is selected.
   * - Income  → --app-secondary  (vibrant green/teal/gold per theme)
   * - Expense → --app-tertiary   (vibrant red/rose/warm per theme)
   * Both are guaranteed to have good contrast against --app-surface-container-lowest.
   */
  const amountStyle: React.CSSProperties = isIncome
    ? { color: 'var(--app-secondary)' }
    : { color: 'var(--app-tertiary)' };

  const controls = useAnimation();
  const swipeThreshold = 75;

  // Dialog state
  const [dialog, setDialog] = useState<null | 'edit' | 'delete'>(null);

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    const offset   = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -swipeThreshold || velocity < -500) {
      // Swipe left → delete confirmation
      await controls.start({ x: 0 });
      if (onDelete) setDialog('delete');
    } else if (offset > swipeThreshold || velocity > 500) {
      // Swipe right → edit confirmation
      await controls.start({ x: 0 });
      if (onEdit) setDialog('edit');
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-high/30 group touch-pan-y">
        {/* Background action hints */}
        <div className="absolute inset-0 flex justify-between items-center px-4">
          <div className="flex items-center text-primary gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Edit</span>
          </div>
          <div className="flex items-center text-error gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Hapus</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
          </div>
        </div>

        {/* Foreground draggable */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          dragDirectionLock
          onDragEnd={handleDragEnd}
          animate={controls}
          className="relative z-10 flex items-center justify-between px-3.5 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3">
            {/* Icon container — square, not round */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-secondary/10' : 'bg-primary/8'} ${iconColorClass}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-on-surface text-[13px] leading-tight">{category}</p>
              <p className="text-[11px] text-on-surface-variant/55 mt-0.5 max-w-[140px] truncate">{vendor}</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0 ml-2">
            <p className="font-bold text-[13px] amount-badge leading-tight" style={amountStyle}>{amount}</p>
            <p className="text-[10px] text-on-surface-variant/40 font-medium mt-0.5">{date}</p>
          </div>
        </motion.div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={() => onDelete?.()}
        variant="danger"
        icon="delete"
        title="Hapus Transaksi?"
        message="Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      {/* Edit confirmation */}
      <ConfirmDialog
        open={dialog === 'edit'}
        onClose={() => setDialog(null)}
        onConfirm={() => onEdit?.()}
        variant="primary"
        icon="edit"
        title="Edit Transaksi?"
        message="Anda akan diarahkan ke form untuk mengubah detail transaksi ini."
        confirmLabel="Lanjut Edit"
        cancelLabel="Batal"
      />
    </>
  );
}
