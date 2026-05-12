"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import db from '@/lib/dexie';

const SESSION_KEY = 'uangmu_banner_dismissed';

export default function GuestMigrationBanner() {
  const { user } = useStore();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    // Only show for guests
    if (user) return;

    // Check per-session dismiss flag
    const isDismissed = sessionStorage.getItem(SESSION_KEY) === '1';
    if (isDismissed) return;

    // Check if there's any local data worth backing up
    db.transactions.count().then(count => {
      setHasLocalData(count > 0);
      setDismissed(false);
    });
  }, [user]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  if (user || dismissed || !hasLocalData) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/8 to-secondary/10 border border-primary/15 rounded-2xl px-4 py-3.5 flex items-center gap-3">
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">cloud_upload</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface leading-tight">
          Backup data ke cloud
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
          Data lokal Anda akan otomatis tersinkron saat buat akun.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/register"
        className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold whitespace-nowrap active:scale-95 transition-transform shadow-sm"
      >
        Buat Akun
      </Link>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Tutup banner"
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
      </button>
    </div>
  );
}
