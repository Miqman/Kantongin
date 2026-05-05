"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { migrateGuestToCloud } from '@/lib/sync';
import db from '@/lib/dexie';

export default function AppInitializer() {
  const { setUser, fetchCategories, fetchData } = useStore();
  const hasMigrated = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // ── onAuthStateChange: single source of truth ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        console.log(`[Auth Event] ${event}`, user?.email);

        // 1. Update store state first
        setUser(user);

        // 2. Handle data fetching and migration
        if (user) {
          if (!hasMigrated.current) {
            try {
              const localCount = await db.transactions.count();
              if (localCount > 0) {
                console.log(`[Migration] Starting for ${user.email}`);
                hasMigrated.current = true; // Mark as migrating to prevent race
                await migrateGuestToCloud();
                console.log('[Migration] Success');
              } else {
                hasMigrated.current = true; // Nothing to migrate
              }
            } catch (err) {
              console.error('[Migration] Failed', err);
              hasMigrated.current = false; // Reset on failure so it can try again
            }
          }
        } else {
          hasMigrated.current = false; // Reset for next user
        }

        // Always refresh data when auth state changes
        await fetchCategories();
        await fetchData();
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, fetchCategories, fetchData]);

  return null;
}
