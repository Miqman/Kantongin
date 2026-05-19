"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { migrateGuestToCloud } from '@/lib/sync';
import { toast } from 'react-hot-toast';
import db from '@/lib/dexie';
import { logger } from '@/lib/logger';
import type { AppUser } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Module-level flags survive React Strict Mode remounts
let globalInitialized = false;
let globalMigrated = false;

export default function AppInitializer() {
  const { setUser, fetchCategories, fetchData } = useStore();
  const lastAuthUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // ── onAuthStateChange: single source of truth ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const user = (session?.user ?? null) as AppUser | null;
        logger.log(`[Auth Event] ${event}`, user?.email);

        // 1. Update store state first
        setUser(user);

        // 2. Handle migration for logged-in users
        if (user) {
          if (!globalMigrated) {
            try {
              const localCount = await db.transactions.count();
              if (localCount > 0) {
                logger.log(`[Migration] Starting for ${user.email}`);
                globalMigrated = true;
                const migratedCount = await migrateGuestToCloud();
                logger.log('[Migration] Success');
                toast.success(
                  `✅ ${migratedCount} transaksi berhasil disinkronkan ke cloud!`,
                  { duration: 5000 }
                );
              } else {
                globalMigrated = true;
              }
            } catch (err) {
              logger.error('[Migration] Failed', err);
              globalMigrated = false;
              toast.error('Gagal menyinkronkan data lokal. Data Anda tetap aman di perangkat ini.', { duration: 6000 });
            }
          }
        } else {
          globalMigrated = false;
        }

        // 3. Fetch data only once per auth state
        if (event === 'INITIAL_SESSION') {
          if (!globalInitialized) {
            globalInitialized = true;
            lastAuthUserId.current = user?.id ?? null;
            await fetchCategories(true);
            await fetchData(true);
          }
        } else if (event === 'SIGNED_IN') {
          // Only fetch if this is a genuine new sign-in (different user or first time)
          const newUserId = user?.id ?? null;
          if (newUserId !== lastAuthUserId.current) {
            lastAuthUserId.current = newUserId;
            await fetchCategories(true);
            await fetchData(true);
          }
        } else if (event === 'SIGNED_OUT') {
          lastAuthUserId.current = null;
          globalInitialized = false;
          globalMigrated = false;
          await fetchCategories(true);
          await fetchData(true);
        }
        // TOKEN_REFRESHED → do nothing, data is still valid
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, fetchCategories, fetchData]);

  return null;
}
