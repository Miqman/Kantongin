"use client";
import React, { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';

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
  onEdit
}: TransactionItemProps) {
  const amountColorClass = isIncome ? "text-secondary" : "text-tertiary-fixed-dim";
  
  const controls = useAnimation();
  const swipeThreshold = 75;

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -swipeThreshold || velocity < -500) {
      if (onDelete) {
        await controls.start({ x: -1000, transition: { duration: 0.2 } });
        onDelete();
      } else {
        controls.start({ x: 0 });
      }
    } else if (offset > swipeThreshold || velocity > 500) {
      if (onEdit) {
        await controls.start({ x: 1000, transition: { duration: 0.2 } });
        onEdit();
        controls.start({ x: 0 });
      } else {
        controls.start({ x: 0 });
      }
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-high group touch-pan-y">
      {/* Background Actions */}
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

      {/* Foreground Draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 flex items-center justify-between p-4 bg-surface-container-low rounded-xl group-hover:bg-surface-container-highest transition-colors cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center ${iconColorClass}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <p className="font-bold text-on-surface">{category}</p>
            <p className="text-xs text-on-surface-variant max-w-[150px] truncate">{vendor}</p>
          </div>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className={`font-bold ${amountColorClass}`}>{amount}</p>
          <p className="text-[10px] text-outline uppercase font-bold tracking-tighter">{date}</p>
        </div>
      </motion.div>
    </div>
  );
}
