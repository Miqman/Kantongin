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
    <nav className="sticky top-0 z-50 w-full px-5 py-3 flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-outline-variant/8">
      {/* Left: Avatar + brand */}
      <div className="flex items-center gap-3">
        <Link
          href={user ? '/profil' : '/login'}
          className="relative flex-shrink-0 active:scale-95 transition-transform"
          aria-label={user ? 'Lihat profil' : 'Masuk ke akun'}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-surface-container-high ring-1 ring-primary/20 flex items-center justify-center">
            {user ? (
              avatarUrl ? (
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
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center">
                  <span className="text-on-primary font-bold text-sm select-none">
                    {getInitials(user.email ?? 'U')}
                  </span>
                </div>
              )
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>
                person
              </span>
            )}
          </div>
          {user && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface" />
          )}
        </Link>

        <div className="leading-none">
          <h1 className="font-headline text-[1.1rem] font-extrabold tracking-[-0.03em] text-on-surface">
            Uangmu
          </h1>
          {user ? (
            <p className="text-[10px] text-on-surface-variant/60 font-medium mt-0.5 truncate max-w-[150px]">
              {user.email}
            </p>
          ) : (
            <Link
              href="/login"
              className="text-[10px] text-primary font-semibold mt-0.5 block hover:opacity-80 transition-opacity"
            >
              Masuk / Daftar →
            </Link>
          )}
        </div>
      </div>

      {/* Right: notification */}
      <button
        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-highest transition-colors text-on-surface-variant active:scale-95 duration-150"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
      </button>
    </nav>
  );
}
