import React from 'react';

export default function TopAppBar() {
  return (
    <nav className="sticky top-0 z-50 docked full-width bg-gradient-to-b from-surface to-surface-container-low flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/20">
          <img
            alt="User profile photo"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtuERyUWvWycJKKdTwRUeWNMNkIy_-Cptz-5hhOMAV7ed9Tirm2Cm-uwz8HI3p4Lcg5ZCuN9dnqTlmPsgi-0-yhkRjnkpExQ_QyekyIQ-Nw6Qcaw66X-lCQ73oh7y8qzVU8tOL8V6qIiJ-LWPLdtqXtAGcbwvccRM2zCAY2WQfbciJoRxZwjYAgMjYv0gRL23HIU8G0xZGwwXrJajOogrUuzEbyVPr7KE6ftjq_d2Xw_aN8gPg5jqBEXtV7d_FiQTCsL4z0lRsBFE"
          />
        </div>
        <h1 className="font-headline text-xl font-bold tracking-tighter text-on-surface">
          Sovereign Ledger
        </h1>
      </div>
      <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant active:opacity-80 duration-200">
        <span className="material-symbols-outlined">notifications</span>
      </button>
    </nav>
  );
}
