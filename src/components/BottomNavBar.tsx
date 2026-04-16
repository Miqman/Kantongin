"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavBar() {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "flex flex-col items-center justify-center text-primary font-bold scale-110 transition-transform";
    }
    return "flex flex-col items-center justify-center text-on-surface-variant/70 transition-all hover:text-primary active:scale-95 duration-150";
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-[2rem] bg-surface-container-high/60 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0px_-8px_24px_rgba(6,14,32,0.4)] flex justify-around items-center px-4 pb-6 pt-3">
      {/* Beranda */}
      <Link href="/" className={getLinkClasses('/')}>
        <span className="material-symbols-outlined mb-1" style={pathname === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
        <span className="font-body text-[11px] font-medium tracking-wide uppercase">Beranda</span>
      </Link>
      
      {/* Tambah */}
      <Link href="/tambah" className={getLinkClasses('/tambah')}>
        {pathname === '/tambah' ? (
          <div className="bg-primary/10 p-2 rounded-xl mb-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          </div>
        ) : (
          <span className="material-symbols-outlined mb-1">add_circle</span>
        )}
        <span className="font-body text-[11px] font-medium tracking-wide uppercase">Tambah</span>
      </Link>

      {/* Riwayat */}
      <Link href="/riwayat" className={getLinkClasses('/riwayat')}>
        <span className="material-symbols-outlined mb-1" style={pathname === '/riwayat' ? { fontVariationSettings: "'FILL' 1" } : {}}>history</span>
        <span className="font-body text-[11px] font-medium tracking-wide uppercase">Riwayat</span>
      </Link>

      {/* Profil */}
      <Link href="/profil" className={getLinkClasses('/profil')}>
        <span className="material-symbols-outlined mb-1" style={pathname === '/profil' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
        <span className="font-body text-[11px] font-medium tracking-wide uppercase">Profil</span>
      </Link>
    </nav>
  );
}
