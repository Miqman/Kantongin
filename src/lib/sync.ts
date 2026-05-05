import db from './dexie';

export async function migrateGuestToCloud() {
  try {
    const localTransactions = await db.transactions.toArray();
    
    if (localTransactions.length === 0) {
      console.log('No local transactions to migrate.');
      return;
    }

    console.log(`Starting migration of ${localTransactions.length} transactions...`);

    // Prepare batch insert (we might need to map Dexie categories to Cloud categories later
    // but for now, we assume user uses default categories that have matching IDs, or we create them)
    
    // Instead of doing complex syncing of categories, the MVP allows transactions to just be posted.
    // However, if the category_id is generated locally and not in Supabase, the foreign key constraint will fail.
    // For simplicity, we fetch all local categories and create them on server if they don't exist, 
    // or we just rely on the API to handle the transaction inserts.
    
    const res = await fetch('/api/transactions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: localTransactions })
    });

    if (!res.ok) {
      throw new Error('Gagal migrasi data ke server');
    }

    // Clear local data after successful migration
    await db.transactions.clear();
    console.log('Migration successful. Local data cleared.');

  } catch (error) {
    console.error('Migration failed:', error);
    // Throw error so UI can know it failed
    throw error;
  }
}
