import db from './dexie';

/**
 * Migrates all local (IndexedDB) guest data to Supabase.
 * Returns the number of successfully migrated transactions.
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
    console.log('[Sync] Tidak ada transaksi lokal untuk dimigrasi.');
    if (localCategories.length > 0) await db.categories.clear();
    return 0;
  }

  console.log(`[Sync] Starting migration: ${localTransactions.length} transactions, ${localCategories.length} local categories.`);

  // ─── STEP 1: Fetch default Supabase categories ───────────────────
  let supabaseDefaultCategories: Array<{ id: string; name: string }> = [];
  try {
    const res = await fetch('/api/categories');
    if (res.ok) supabaseDefaultCategories = await res.json();
  } catch (e) {
    console.warn('[Sync] Cannot fetch default categories from server:', e);
  }

  const defaultCatByName = new Map(
    supabaseDefaultCategories.map((c) => [c.name.toLowerCase(), c.id])
  );

  // ─── STEP 2: Build localId → supabaseId map ──────────────────────
  const categoryIdMap = new Map<string, string>();
  const createdCatIds: string[] = []; // track custom cats created for rollback

  for (const localCat of localCategories) {
    const matchedId = defaultCatByName.get(localCat.name.toLowerCase());
    if (matchedId) {
      categoryIdMap.set(localCat.id, matchedId);
      continue;
    }

    // Custom category — create in Supabase
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: localCat.name,
          icon: localCat.icon,
          color: localCat.color,
          is_default: false,
        }),
      });

      if (res.ok) {
        const newCat = await res.json();
        categoryIdMap.set(localCat.id, newCat.id);
        createdCatIds.push(newCat.id);
      } else {
        console.warn(`[Sync] Failed to create category "${localCat.name}":`, await res.text());
      }
    } catch (e) {
      console.warn(`[Sync] Error creating category "${localCat.name}":`, e);
    }
  }

  // ─── STEP 3: Remap transaction category_ids ──────────────────────
  const transactionsToMigrate = localTransactions.map((tx) => ({
    amount: tx.amount,
    category_id: categoryIdMap.get(tx.category_id) ?? tx.category_id,
    note: tx.note ?? '',
    date: tx.date,
    created_at: tx.created_at,
  }));

  // ─── STEP 4: Batch insert ─────────────────────────────────────────
  const res = await fetch('/api/transactions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: transactionsToMigrate }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Sync] Batch insert failed:', errBody);

    // ── Rollback: delete any custom categories we just created ──
    if (createdCatIds.length > 0) {
      console.log(`[Sync] Rolling back ${createdCatIds.length} created categories...`);
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
  console.log(`[Sync] ✅ Successfully migrated ${migratedCount} transactions to Supabase.`);

  // ─── STEP 4.5: Migrate budgets ─────────────────────────────────────
  const localBudgets = await db.budgets.toArray();
  if (localBudgets.length > 0) {
    console.log(`[Sync] Migrating ${localBudgets.length} budgets...`);
    for (const b of localBudgets) {
      try {
        await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            limit_amount: b.limit_amount,
            period: b.period,
            category_id: b.category_id ? (categoryIdMap.get(b.category_id) ?? b.category_id) : null
          })
        });
      } catch (err) {
        console.warn('[Sync] Failed to migrate budget:', err);
      }
    }
  }

  // ─── STEP 5: Clear local IndexedDB (only after confirmed success) ─
  await db.transactions.clear();
  await db.categories.clear();
  await db.budgets.clear();
  console.log('[Sync] Local IndexedDB cleared.');

  return migratedCount;
}
