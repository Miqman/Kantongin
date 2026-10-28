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
  import type { Transaction } from '$lib/types';

  let localSearch = $state('');
  let debouncedSearch = $state('');

  let debounceTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedSearch = localSearch.trim().toLowerCase();
    }, 300);
  });

  // Filtered transactions computed reactively
  let filteredTransactions = $derived.by(() => {
    let list = appStore.transactions;

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
    if (range.start) {
      list = list.filter((t) => t.date >= range.start!);
    }
    if (range.end) {
      list = list.filter((t) => t.date <= range.end!);
    }

    // Search query
    if (debouncedSearch) {
      list = list.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(debouncedSearch)) ||
          (t.category?.name && t.category.name.toLowerCase().includes(debouncedSearch))
      );
    }

    return list;
  });

  // Group by date
  let groupedTransactions = $derived.by(() => {
    const groups: { date: string; displayDate: string; totalExpense: number; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach((t) => {
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
        {filteredTransactions.length} transaksi
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 focus-within:ring-2 focus-within:ring-primary/20">
      <span class="material-symbols-outlined text-on-surface-variant/50 text-xl mr-2.5">search</span>
      <input
        type="text"
        bind:value={localSearch}
        placeholder="Cari transaksi atau catatan..."
        class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
      />
      {#if localSearch}
        <button
          type="button"
          onclick={() => (localSearch = '')}
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
    {#if appStore.isLoading}
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
      {#if appStore.hasMore}
        <div class="text-center pt-4">
          <button
            type="button"
            onclick={() => appStore.loadMoreTransactions()}
            disabled={appStore.isLoadingMore}
            class="px-6 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition-all cursor-pointer disabled:opacity-50"
          >
            {appStore.isLoadingMore ? 'Memuat lebih banyak...' : 'Muat Lebih Banyak'}
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

