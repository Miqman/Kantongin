<script lang="ts">
  import { goto } from '$app/navigation';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import BottomNavBar from '$lib/components/common/BottomNavBar.svelte';
  import TransactionItem from '$lib/components/transactions/TransactionItem.svelte';
  import DateFilterPicker from '$lib/components/transactions/DateFilterPicker.svelte';
  import CategoryFilterPicker from '$lib/components/transactions/CategoryFilterPicker.svelte';
  import { historyFilters, dateFilterToRange } from '$lib/stores/filters.svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import db from '$lib/db/dexie';
  import type { Transaction } from '$lib/types';

  // Page-level transaction state for history view
  let transactions = $state<Transaction[]>([]);
  let isLoading = $state(true);
  let isLoadingMore = $state(false);
  let hasMore = $state(false);
  let nextCursor = $state<string | null>(null);

  // Debounced search query to prevent spamming server API on every keystroke
  let debouncedSearch = $state(historyFilters.searchQuery);

  $effect(() => {
    const q = historyFilters.searchQuery;
    if (q === '') {
      debouncedSearch = '';
      return;
    }
    const timer = setTimeout(() => {
      debouncedSearch = q;
    }, 300);
    return () => clearTimeout(timer);
  });

  function buildApiUrl(cursor?: string): string {
    const p = new URLSearchParams();
    const range = dateFilterToRange(historyFilters.dateFilter);
    if (range.start) p.set('start_date', range.start);
    if (range.end) p.set('end_date', range.end);
    if (historyFilters.type !== 'ALL') p.set('type', historyFilters.type);
    if (historyFilters.categoryId !== 'ALL') p.set('category_id', historyFilters.categoryId);
    if (debouncedSearch.trim()) p.set('search', debouncedSearch.trim());
    if (cursor) p.set('cursor', cursor);
    return `/api/transactions?${p.toString()}`;
  }

  let fetchRequestId = 0;
  async function loadTransactions() {
    if (appStore.isLoading) return;

    const reqId = ++fetchRequestId;
    isLoading = true;
    nextCursor = null;

    try {
      if (appStore.user) {
        // Logged-in mode: server-side query with active filters
        const res = await fetch(buildApiUrl());
        if (!res.ok) throw new Error('Gagal memuat transaksi');
        const json = await res.json();
        if (reqId !== fetchRequestId) return;

        transactions = json.data ?? [];
        nextCursor = json.nextCursor ?? null;
        hasMore = json.hasMore ?? false;
      } else {
        // Guest mode: Dexie local IndexedDB
        const all = await db.transactions.orderBy('date').reverse().toArray();
        if (reqId !== fetchRequestId) return;

        const catMap = appStore.categoryMap;
        let list: Transaction[] = all.map((tx) => ({
          ...tx,
          category: catMap.get(tx.category_id) ?? null,
        }));

        // Type filter
        if (historyFilters.type === 'income') {
          list = list.filter((t) => Number(t.amount) < 0);
        } else if (historyFilters.type === 'expense') {
          list = list.filter((t) => Number(t.amount) > 0);
        }

        // Category filter
        if (historyFilters.categoryId !== 'ALL') {
          list = list.filter((t) => t.category_id === historyFilters.categoryId);
        }

        // Date range filter
        const range = dateFilterToRange(historyFilters.dateFilter);
        if (range.start) list = list.filter((t) => t.date >= range.start!);
        if (range.end) list = list.filter((t) => t.date <= range.end!);

        // Search query
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.trim().toLowerCase();
          list = list.filter(
            (t) =>
              (t.note && t.note.toLowerCase().includes(q)) ||
              ((t.category?.name || catMap.get(t.category_id)?.name)?.toLowerCase().includes(q))
          );
        }

        transactions = list;
        hasMore = false;
        nextCursor = null;
      }
    } catch {
      toast.error('Gagal memuat riwayat transaksi');
    } finally {
      if (reqId === fetchRequestId) {
        isLoading = false;
      }
    }
  }

  async function loadMore() {
    if (!appStore.user || isLoadingMore || !hasMore || !nextCursor) return;
    isLoadingMore = true;
    try {
      const res = await fetch(buildApiUrl(nextCursor));
      if (!res.ok) throw new Error('Gagal memuat lebih banyak');
      const json = await res.json();
      const newItems: Transaction[] = json.data ?? [];

      const existingIds = new Set(transactions.map((t) => t.id));
      const deduped = newItems.filter((t) => !existingIds.has(t.id));

      transactions = [...transactions, ...deduped];
      nextCursor = json.nextCursor ?? null;
      hasMore = json.hasMore ?? false;
    } catch {
      toast.error('Gagal memuat lebih banyak transaksi');
    } finally {
      isLoadingMore = false;
    }
  }

  // Reactive trigger on filter or auth state change
  $effect(() => {
    debouncedSearch;
    historyFilters.categoryId;
    historyFilters.dateFilter;
    historyFilters.type;
    appStore.user;
    appStore.isLoading;

    loadTransactions();
  });

  // Group by date
  let groupedTransactions = $derived.by(() => {
    const groups: { date: string; displayDate: string; totalExpense: number; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    transactions.forEach((t) => {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    });

    for (const [dateStr, items] of map.entries()) {
      const totalExpense = items
        .filter((t) => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const d = new Date(dateStr);
      const displayDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      groups.push({
        date: dateStr,
        displayDate,
        totalExpense,
        items,
      });
    }

    return groups;
  });

  async function handleDelete(id: string) {
    try {
      await appStore.deleteTransaction(id);
      transactions = transactions.filter((t) => t.id !== id);
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  }

  function handleEdit(id: string) {
    goto(`/tambah?edit=${id}`);
  }
</script>

<TopAppBar />

<main class="px-5 pt-4 pb-32 max-w-2xl mx-auto space-y-6">
  <!-- Title & Search Bar -->
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="font-headline text-2xl font-bold tracking-tight text-on-surface">Riwayat Transaksi</h1>
      <span class="text-xs font-semibold text-on-surface-variant/70">
        {transactions.length} transaksi
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:ring-2 focus-within:ring-primary/20">
      <span class="material-symbols-outlined text-on-surface-variant/50 text-xl mr-2.5">search</span>
      <input
        type="text"
        bind:value={historyFilters.searchQuery}
        placeholder="Cari transaksi atau catatan..."
        class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
      />
      {#if historyFilters.searchQuery}
        <button
          type="button"
          onclick={() => (historyFilters.searchQuery = '')}
          class="text-on-surface-variant/50 hover:text-on-surface"
        >
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      {/if}
    </div>

    <!-- Filter Buttons (Category, Date, Type) -->
    <div class="flex flex-wrap items-center gap-2">
      <CategoryFilterPicker
        value={historyFilters.categoryId}
        categories={appStore.categories}
        onChange={(id) => (historyFilters.categoryId = id)}
      />

      <DateFilterPicker
        value={historyFilters.dateFilter}
        onChange={(v) => (historyFilters.dateFilter = v)}
      />

      <!-- Type Pills -->
      <div class="flex items-center gap-1 p-0.5 bg-surface-container-low rounded-full border border-outline-variant/10 ml-auto text-xs font-semibold">
        <button
          type="button"
          onclick={() => (historyFilters.type = 'ALL')}
          class="px-2.5 py-1 rounded-full transition-colors cursor-pointer {historyFilters.type === 'ALL' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant/70'}"
        >
          Semua
        </button>
        <button
          type="button"
          onclick={() => (historyFilters.type = 'expense')}
          class="px-2.5 py-1 rounded-full transition-colors cursor-pointer {historyFilters.type === 'expense' ? 'bg-surface shadow text-error' : 'text-on-surface-variant/70'}"
        >
          Keluar
        </button>
        <button
          type="button"
          onclick={() => (historyFilters.type = 'income')}
          class="px-2.5 py-1 rounded-full transition-colors cursor-pointer {historyFilters.type === 'income' ? 'bg-surface shadow text-secondary' : 'text-on-surface-variant/70'}"
        >
          Masuk
        </button>
      </div>
    </div>
  </div>

  <!-- Transactions Grouped by Date -->
  <div class="space-y-6">
    {#if isLoading}
      {#each [1, 2, 3] as _}
        <div class="space-y-2">
          <div class="h-4 w-32 skeleton-wave rounded"></div>
          <div class="h-16 skeleton-wave rounded-2xl"></div>
        </div>
      {/each}
    {:else if groupedTransactions.length > 0}
      {#each groupedTransactions as group (group.date)}
        <div class="space-y-2.5">
          <!-- Date Header -->
          <div class="flex justify-between items-center px-1">
            <span class="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
              {group.displayDate}
            </span>
            {#if group.totalExpense > 0}
              <span class="text-[11px] font-semibold text-error/80">
                -Rp {group.totalExpense.toLocaleString('id-ID')}
              </span>
            {/if}
          </div>

          <!-- Items in group -->
          <div class="space-y-2">
            {#each group.items as trx (trx.id)}
              {@const isIncome = Number(trx.amount) < 0}
              {@const absoluteAmountStr = Math.abs(Number(trx.amount)).toLocaleString('id-ID')}
              <TransactionItem
                id={trx.id}
                icon={trx.category?.icon || 'payments'}
                category={trx.category?.name || 'Tanpa Kategori'}
                vendor={trx.note || 'Transaksi biasa'}
                amount={isIncome ? `+ Rp ${absoluteAmountStr}` : `- Rp ${absoluteAmountStr}`}
                date={new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                isIncome={isIncome}
                iconColorClass={isIncome ? 'text-secondary' : 'text-primary'}
                onEdit={() => handleEdit(trx.id)}
                onDelete={() => handleDelete(trx.id)}
              />
            {/each}
          </div>
        </div>
      {/each}

      <!-- Infinite Scroll Trigger -->
      {#if hasMore}
        <div class="text-center pt-4">
          <button
            type="button"
            onclick={loadMore}
            disabled={isLoadingMore}
            class="px-6 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? 'Memuat lebih banyak...' : 'Muat Lebih Banyak'}
          </button>
        </div>
      {/if}
    {:else}
      <div class="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div class="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center">
          <span class="material-symbols-outlined text-on-surface-variant/30 text-3xl">filter_alt_off</span>
        </div>
        <div>
          <p class="font-headline font-bold text-sm text-on-surface">Tidak ada transaksi ditemukan</p>
          <p class="text-xs text-on-surface-variant/60 mt-1">Coba sesuaikan kata kunci atau filter tanggal Anda</p>
        </div>
      </div>
    {/if}
  </div>
</main>

<BottomNavBar />

