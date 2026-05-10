"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { migrateGuestToCloud } from '@/lib/sync';
import db from '@/lib/dexie';

export default function AppInitializer() {
  const { setUser, fetchCategories, fetchData } = useStore();
  const hasMigrated = useRef(false);
  const hasInitialized = useRef(false);

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
          if (!hasMigrated.current) {
            try {
              const localCount = await db.transactions.count();
              if (localCount > 0) {
                console.log(`[Migration] Starting for ${user.email}`);
                hasMigrated.current = true;
                await migrateGuestToCloud();
                console.log('[Migration] Success');
              } else {
                hasMigrated.current = true;
              }
            } catch (err) {
              console.error('[Migration] Failed', err);
              hasMigrated.current = false;
            }
          }
        } else {
          hasMigrated.current = false;
        }

        // console.log(event, "<<<< cek event");
        

        // 3. Only fetch data once on INITIAL_SESSION, or on actual sign-in/out
        if (event === 'INITIAL_SESSION') {
          if (!hasInitialized.current) {
            hasInitialized.current = true;
            await fetchCategories(true);
            await fetchData(true);
          }
        } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Reset lastFetchedAt so data is fresh for new auth state
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
