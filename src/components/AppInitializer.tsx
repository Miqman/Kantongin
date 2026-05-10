"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { migrateGuestToCloud } from '@/lib/sync';
import db from '@/lib/dexie';

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
      async (event: string, session: any) => {
        const user = session?.user ?? null;
        console.log(`[Auth Event] ${event}`, user?.email);

        // 1. Update store state first
        setUser(user);

        // 2. Handle migration for logged-in users
        if (user) {
          if (!globalMigrated) {
            try {
              const localCount = await db.transactions.count();
              if (localCount > 0) {
                console.log(`[Migration] Starting for ${user.email}`);
                globalMigrated = true;
                await migrateGuestToCloud();
                console.log('[Migration] Success');
              } else {
                globalMigrated = true;
              }
            } catch (err) {
              console.error('[Migration] Failed', err);
              globalMigrated = false;
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
