"use client";
import React, { useState, useEffect } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

export default function Profil() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle function
  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-10">
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface">
                <img alt="User profile photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrwIwg9zLLCzeXQZpxjYHBOCbm8JREp1SEFINmkqYOc0HUyJQrpLyDHczQZiFp3EFLsws1TrEXvWR87fTvMkuIWqfld_gzVOK7Gk9nq8SZMLVlTZ3dsng7NEismCbua0IP69V2-4kQoyNyR36IQ-RmjrZU5TSUC3m6pfmwP-Dkf8NKZk8zX5nzca3hvtvB2_w418Cx3uCFgen5pwHMfnX8Pzv2kwI4CICN8mRx0ij6nyar4Fq8ehmMZWlWvme4v1ARjSevOlFOu1M"/>
              </div>
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow-lg">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Julian Sterling</h1>
            <p className="text-on-surface-variant font-medium">julian.sterling@ledger.sovereign</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <span className="material-symbols-outlined text-secondary">sync</span>
              </div>
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-2 py-1 rounded-full">Active</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg">Google Sheets</h3>
              <p className="text-on-surface-variant text-sm mt-1">Last synced 2m ago</p>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col justify-between border border-primary/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              </div>
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg">Budget Limit</h3>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-on-surface font-bold text-xl">$4,250</p>
                <p className="text-on-surface-variant text-xs mb-0.5">/ month</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Preferences & Management</h2>
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden">
            {/* Toggle Theme Switch */}
            <div onClick={toggleTheme} className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              {/* Custom Switch Component */}
              <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-outline-variant'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-6 bg-on-primary' : 'translate-x-0 bg-surface'}`}></div>
              </div>
            </div>
            
            <div className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">category</span>
                <span className="font-medium">Category Management</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
            </div>

            <div className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">cloud_sync</span>
                <span className="font-medium">Sync Settings</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Data Operations</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest transition-all py-4 rounded-full border border-outline-variant/10">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">csv</span>
              <span className="font-medium text-sm">Export CSV</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest transition-all py-4 rounded-full border border-outline-variant/10">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">picture_as_pdf</span>
              <span className="font-medium text-sm">Export PDF</span>
            </button>
          </div>
        </section>

        <footer className="pt-10 pb-4">
          <button className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-error-container/10 border border-error-container/20 text-error hover:bg-error-container/20 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-bold tracking-wide">Logout Account</span>
          </button>
          <p className="text-center text-[10px] text-on-surface-variant/40 mt-8 uppercase tracking-widest font-label">Sovereign Ledger v2.4.0 • Enterprise Edition</p>
        </footer>
      </main>
      <BottomNavBar />
    </>
  );
}
