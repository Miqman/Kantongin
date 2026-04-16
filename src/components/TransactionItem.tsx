import React from 'react';

type TransactionItemProps = {
  icon: string;
  category: string;
  vendor: string;
  amount: string;
  date: string;
  isIncome?: boolean;
  iconColorClass?: string;
};

export default function TransactionItem({
  icon,
  category,
  vendor,
  amount,
  date,
  isIncome = false,
  iconColorClass = "text-primary"
}: TransactionItemProps) {
  const amountColorClass = isIncome ? "text-secondary" : "text-tertiary-fixed-dim";
  
  return (
    <div className="group flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center ${iconColorClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface">{category}</p>
          <p className="text-xs text-on-surface-variant">{vendor}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${amountColorClass}`}>{amount}</p>
        <p className="text-[10px] text-outline uppercase font-bold tracking-tighter">{date}</p>
      </div>
    </div>
  );
}
