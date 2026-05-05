import db from './dexie';

export async function migrateGuestToCloud() {
  const localTransactions = await db.transactions.toArray();
  const localCategories = await db.categories.toArray();

  if (localTransactions.length === 0) {
    console.log('[Sync] Tidak ada transaksi lokal untuk dimigrasi.');
    if (localCategories.length > 0) await db.categories.clear();
    return;
  }

  console.log(`[Sync] Memulai migrasi: ${localTransactions.length} transaksi, ${localCategories.length} kategori lokal.`);

  // ─── STEP 1: Fetch default Supabase categories (user_id IS NULL) ───
  // These exist in Supabase after running supabase-setup.sql
  let supabaseDefaultCategories: Array<{ id: string; name: string }> = [];
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      supabaseDefaultCategories = await res.json();
    }
  } catch (e) {
    console.warn('[Sync] Tidak bisa fetch default categories dari server:', e);
  }

  // Build a name-based lookup for default categories: name → supabase_id
  const defaultCatByName = new Map(
    supabaseDefaultCategories.map((c) => [c.name.toLowerCase(), c.id])
  );

  // ─── STEP 2: Build localId → supabaseId map ───────────────────────
  const categoryIdMap = new Map<string, string>();

  for (const localCat of localCategories) {
    // Try to match by name against existing Supabase default categories first
    const matchedId = defaultCatByName.get(localCat.name.toLowerCase());

    if (matchedId) {
      // Use existing Supabase category — no need to create a duplicate
      categoryIdMap.set(localCat.id, matchedId);
      console.log(`[Sync] Kategori "${localCat.name}" matched → ${matchedId}`);
      continue;
    }

    // Custom category — create it in Supabase
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
        console.log(`[Sync] Kategori custom "${localCat.name}" dibuat → ${newCat.id}`);
      } else {
        const errBody = await res.text();
        console.warn(`[Sync] Gagal buat kategori "${localCat.name}":`, errBody);
      }
    } catch (e) {
      console.warn(`[Sync] Error buat kategori "${localCat.name}":`, e);
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

  // Warn about any unmapped categories (FK constraint may fail for these)
  const unmapped = transactionsToMigrate.filter((tx) =>
    localTransactions.some(
      (orig) =>
        orig.category_id === tx.category_id && !categoryIdMap.has(orig.category_id)
    )
  );
  if (unmapped.length > 0) {
    console.warn(`[Sync] ${unmapped.length} transaksi memiliki category_id yang tidak bisa di-map. Akan dicoba tetap diinsert.`);
  }

  // ─── STEP 4: Batch insert transactions ───────────────────────────
  const res = await fetch('/api/transactions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: transactionsToMigrate }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Sync] Batch insert gagal:', errBody);
    throw new Error(`Gagal migrasi transaksi ke server: ${res.status}`);
  }

  const result = await res.json();
  console.log(`[Sync] ✅ Berhasil migrasi ${result.count} transaksi ke Supabase.`);

  // ─── STEP 5: Clear local IndexedDB ───────────────────────────────
  await db.transactions.clear();
  await db.categories.clear();
  console.log('[Sync] Data lokal (IndexedDB) berhasil dibersihkan.');
}
