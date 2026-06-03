"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

function getInitials(email: string): string {
  // Take first letter of email local part
  return email.charAt(0).toUpperCase();
}

export default function TopAppBar() {
  const { user } = useStore();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <nav className="sticky top-0 z-50 docked full-width bg-gradient-to-b from-surface to-surface-container-low flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Avatar — links to profil if logged in, login if guest */}
        <Link
          href={user ? '/profil' : '/login'}
          className="relative flex-shrink-0"
          aria-label={user ? 'Lihat profil' : 'Masuk ke akun'}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/20 flex items-center justify-center transition-transform active:scale-95">
            {user ? (
              avatarUrl ? (
                /* Logged in with photo */
                <div className="relative w-full h-full">
                  <Image
                    src={avatarUrl}
                    alt="Foto profil"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                /* Logged in: show initials avatar */
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-on-primary font-bold text-base select-none">
                    {getInitials(user.email ?? 'U')}
                  </span>
                </div>
              )
            ) : (
              /* Guest: show person icon */
              <span className="material-symbols-outlined text-on-surface-variant text-xl">
                person
              </span>
            )}
          </div>
          {/* Online indicator dot — only when logged in */}
          {user && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface" />
          )}
        </Link>


        <div>
          <h1 className="font-headline text-xl font-bold tracking-tighter text-on-surface leading-tight">
            Uangmu
          </h1>
          {user ? (
            <p className="text-[10px] text-on-surface-variant/70 font-medium leading-none truncate max-w-[160px]">
              {user.email}
            </p>
          ) : (
            <Link
              href="/login"
              className="text-[10px] text-primary font-semibold leading-none hover:underline"
            >
              Masuk / Daftar →
            </Link>
          )}
        </div>
      </div>

      <button
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant active:opacity-80 duration-200"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined">notifications</span>
      </button>
    </nav>
  );
}
