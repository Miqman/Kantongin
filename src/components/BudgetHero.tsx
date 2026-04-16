import React from 'react';

export default function BudgetHero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="md:col-span-2 bg-surface-container-low p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        <div className="relative z-10">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Total Budget Used</p>
          <h2 className="text-5xl font-black text-primary">68%</h2>
        </div>
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">
              $4,250.00 <span className="text-sm font-normal opacity-60">of $6,200.00</span>
            </p>
          </div>
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center text-xs font-bold">
              12d
            </div>
          </div>
        </div>
        {/* Abstract BG Shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      <div className="bg-secondary-container p-8 rounded-3xl flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span
            className="material-symbols-outlined text-on-secondary-container"
            data-icon="warning"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <span className="bg-on-secondary-container/20 text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            High Risk
          </span>
        </div>
        <div>
          <p className="text-on-secondary-container/80 text-sm font-medium">Critical Items</p>
          <h3 className="text-3xl font-bold text-on-secondary-container">3 Over Budget</h3>
        </div>
      </div>
    </div>
  );
}
