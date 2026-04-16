import React from 'react';

export default function SpendingIntelligence() {
  return (
    <section className="mt-16">
      <h3 className="text-xl font-bold mb-6 px-2">Spending Intelligence</h3>
      <div className="bg-surface-container-low p-1 rounded-3xl">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8">
            <h4 className="text-sm font-bold text-primary mb-4">Smart Prediction</h4>
            <p className="text-lg leading-relaxed">
              Based on your current trajectory, you will save <span className="text-primary font-bold">$420.00</span> more than last month if you maintain current spending in 'Transport'.
            </p>
          </div>
          <div className="w-full md:w-1/3 bg-surface-container-highest/30 p-8 flex items-center justify-center rounded-r-3xl">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-lowest" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="60" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">75%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
