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
  const amountColorClass = isIncome ? "text-secondary" : "text-tertiary-fixed-dim";
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
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-high/50 group touch-pan-y">
        {/* Background action hints */}
        <div className="absolute inset-0 flex justify-between items-center px-5">
          <div className="flex items-center text-primary font-bold gap-2">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            <span className="text-xs uppercase tracking-widest hidden sm:inline">Edit</span>
          </div>
          <div className="flex items-center text-error font-bold gap-2">
            <span className="text-xs uppercase tracking-widest hidden sm:inline">Hapus</span>
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </div>
        </div>

        {/* Foreground draggable */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          dragDirectionLock
          onDragEnd={handleDragEnd}
          animate={controls}
          className="relative z-10 flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl bg-primary/8 dark:bg-surface-container-highest flex items-center justify-center ${iconColorClass}`}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{category}</p>
              <p className="text-xs text-on-surface-variant/70 max-w-[150px] truncate">{vendor}</p>
            </div>
          </div>
          <div className="text-right whitespace-nowrap">
            <p className={`font-bold text-sm ${amountColorClass}`}>{amount}</p>
            <p className="text-[10px] text-on-surface-variant/50 font-medium">{date}</p>
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
