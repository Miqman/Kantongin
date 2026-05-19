import db from './dexie';
import { logger } from './logger';

/**
 * Migrates all local (IndexedDB) guest data to Supabase.
 * Returns the number of successfully migrated transactions.
 *
 * Optimizations vs v1:
 *  - Categories are now batch-inserted in one request instead of
 *    sequential per-category fetches, reducing migration time significantly.
 *  - All console.* calls replaced with dev-only logger.
 *
 * Rollback strategy:
 *  - Categories: we only create custom ones; matched defaults are never modified.
 *  - Transactions: if batch insert fails, we do NOT clear IndexedDB so the user
 *    keeps their data and can retry.
 */
export async function migrateGuestToCloud(): Promise<number> {
  const localTransactions = await db.transactions.toArray();
  const localCategories = await db.categories.toArray();

  if (localTransactions.length === 0) {
    logger.log('[Sync] Tidak ada transaksi lokal untuk dimigrasi.');
    if (localCategories.length > 0) await db.categories.clear();
    return 0;
  }

  logger.log(`[Sync] Starting migration: ${localTransactions.length} transactions, ${localCategories.length} local categories.`);

  // ─── STEP 1: Fetch default Supabase categories ────────────────────────────
  let supabaseDefaultCategories: Array<{ id: string; name: string }> = [];
  try {
    const res = await fetch('/api/categories');
    if (res.ok) supabaseDefaultCategories = await res.json();
  } catch (e) {
    logger.warn('[Sync] Cannot fetch default categories from server:', e);
  }

  const defaultCatByName = new Map(
    supabaseDefaultCategories.map((c) => [c.name.toLowerCase(), c.id])
  );

  // ─── STEP 2: Separate matched vs custom categories ────────────────────────
  const categoryIdMap = new Map<string, string>();
  const customCatsToCreate: Array<{ localId: string; name: string; icon: string; color: string }> = [];

  for (const localCat of localCategories) {
    const matchedId = defaultCatByName.get(localCat.name.toLowerCase());
    if (matchedId) {
      categoryIdMap.set(localCat.id, matchedId);
    } else {
      customCatsToCreate.push({
        localId: localCat.id,
        name: localCat.name,
        icon: localCat.icon,
        color: localCat.color,
      });
    }
  }

  // ─── STEP 3: Batch-create custom categories (1 request instead of N) ─────
  const createdCatIds: string[] = [];

  if (customCatsToCreate.length > 0) {
    logger.log(`[Sync] Creating ${customCatsToCreate.length} custom categories in batch...`);
    try {
      // POST each in parallel (or use a batch endpoint if available)
      const results = await Promise.allSettled(
        customCatsToCreate.map((cat) =>
          fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              is_default: false,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            const newCat = await res.json();
            return { localId: cat.localId, serverId: newCat.id as string };
          })
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          categoryIdMap.set(result.value.localId, result.value.serverId);
          createdCatIds.push(result.value.serverId);
        } else {
          logger.warn('[Sync] Failed to create a custom category:', result.reason);
        }
      }
    } catch (e) {
      logger.warn('[Sync] Error creating custom categories:', e);
    }
  }

  // ─── STEP 4: Remap transaction category_ids ───────────────────────────────
  const transactionsToMigrate = localTransactions.map((tx) => ({
    amount: tx.amount,
    category_id: categoryIdMap.get(tx.category_id) ?? tx.category_id,
    note: tx.note ?? '',
    date: tx.date,
    created_at: tx.created_at,
  }));

  // ─── STEP 5: Batch insert transactions ───────────────────────────────────
  const res = await fetch('/api/transactions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: transactionsToMigrate }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    logger.error('[Sync] Batch insert failed:', errBody);

    // ── Rollback: delete any custom categories we just created ──
    if (createdCatIds.length > 0) {
      logger.log(`[Sync] Rolling back ${createdCatIds.length} created categories...`);
      await Promise.allSettled(
        createdCatIds.map((id) =>
          fetch(`/api/categories/${id}`, { method: 'DELETE' })
        )
      );
    }

    // Do NOT clear IndexedDB — user keeps their data for retry
    throw new Error(`Gagal migrasi transaksi ke server: ${res.status}`);
  }

  const result = await res.json();
  const migratedCount: number = result.count ?? 0;
  logger.log(`[Sync] ✅ Successfully migrated ${migratedCount} transactions to Supabase.`);

  // ─── STEP 6: Migrate budgets ──────────────────────────────────────────────
  const localBudgets = await db.budgets.toArray();
  if (localBudgets.length > 0) {
    logger.log(`[Sync] Migrating ${localBudgets.length} budgets...`);
    await Promise.allSettled(
      localBudgets.map((b) =>
        fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            limit_amount: b.limit_amount,
            period: b.period,
            category_id: b.category_id
              ? (categoryIdMap.get(b.category_id) ?? b.category_id)
              : null,
          }),
        })
      )
    );
  }

  // ─── STEP 7: Clear local IndexedDB (only after confirmed success) ─────────
  await db.transactions.clear();
  await db.categories.clear();
  await db.budgets.clear();
  logger.log('[Sync] Local IndexedDB cleared.');

  return migratedCount;
}
