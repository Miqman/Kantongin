"use client";
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { migrateGuestToCloud } from '@/lib/sync';
import db from '@/lib/dexie';

export default function AppInitializer() {
  const { checkAuth, fetchCategories, fetchData, user } = useStore();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchCategories(); // Fetch categories globally so they are ready
    };
    init();
  }, [checkAuth, fetchCategories]);

  // Migration Effect
  useEffect(() => {
    const runMigrationIfNeeded = async () => {
      if (user) {
        try {
          const localCount = await db.transactions.count();
          if (localCount > 0) {
            await migrateGuestToCloud();
            // Refresh data from server after migration
            await fetchData();
          }
        } catch (error) {
          console.error("Migration check error:", error);
        }
      }
    };
    runMigrationIfNeeded();
  }, [user, fetchData]);

  return null;
}
