<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { getCycleBounds, normalizeDateStr } from '$lib/cycle';
  import { formatNumber } from '$lib/utils';
  import type { Transaction } from '$lib/types';
  import db from '$lib/db/dexie';

  let showAllTime = $state(false);
  let summaryLoading = $state(true);

  let totalDanaBulanIni = $state(0);
  let totalDanaAllTime = $state(0);
  let growthBulanIni = $state(0);
  let totalHariIni = $state(0);
  let totalBulanIni = $state(0);
  let sisaBudget = $state(0);

  function calcSummary(
    allTxs: Transaction[],
    monthTxs: Transaction[],
    prevMonthTxs: Transaction[],
    todayStr: string
  ) {
    const atIncome = allTxs
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const atExpense = allTxs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    totalDanaAllTime = atIncome - atExpense;

    const mIncome = monthTxs
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const mExpense = monthTxs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    const mBalance = mIncome - mExpense;
    totalDanaBulanIni = mBalance;
    totalBulanIni = mExpense;

    const todayExp = allTxs
      .filter((t) => normalizeDateStr(t.date) === todayStr && Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    totalHariIni = todayExp;

    const pIncome = prevMonthTxs
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const pExpense = prevMonthTxs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    const pBalance = pIncome - pExpense;
    if (pBalance !== 0) {
      growthBulanIni = ((mBalance - pBalance) / Math.abs(pBalance)) * 100;
    } else if (mBalance !== 0) {
      growthBulanIni = 100;
    } else {
      growthBulanIni = 0;
    }

    const monthBudget = appStore.budgets
      .filter((b) => b.period === 'monthly')
      .reduce((s, b) => s + Number(b.limit_amount || 0), 0);
    sisaBudget = monthBudget - mExpense;
  }

  $effect(() => {
    if (appStore.isLoading) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const { start: mStart, end: mEnd, prevStart: pStart, prevEnd: pEnd } = getCycleBounds(now, appStore.paydayDate);

    if (appStore.user) {
      summaryLoading = true;
      Promise.all([
        fetch('/api/transactions?limit=100000').then((r) => r.json()).then((j) => j.data ?? []),
        fetch(`/api/transactions?limit=10000&start_date=${mStart}&end_date=${mEnd}`).then((r) => r.json()).then((j) => j.data ?? []),
        fetch(`/api/transactions?limit=10000&start_date=${pStart}&end_date=${pEnd}`).then((r) => r.json()).then((j) => j.data ?? []),
      ])
        .then(([allTxs, monthTxs, prevTxs]) => {
          const txMap = new Map<string, Transaction>();
          (allTxs as Transaction[]).forEach((t) => txMap.set(t.id, t));
          appStore.transactions.forEach((t) => txMap.set(t.id, t));
          const combinedAll = Array.from(txMap.values());

          calcSummary(combinedAll, monthTxs, prevTxs, todayStr);
        })
        .catch(console.error)
        .finally(() => {
          summaryLoading = false;
        });
    } else {
      db.transactions.toArray().then((all) => {
        const monthTxs = all.filter((t) => {
          const d = t.date && t.date.length >= 10 ? t.date.slice(0, 10) : '';
          return d >= mStart && d <= mEnd;
        });
        const prevTxs = all.filter((t) => {
          const d = t.date && t.date.length >= 10 ? t.date.slice(0, 10) : '';
          return d >= pStart && d <= pEnd;
        });

        calcSummary(all as Transaction[], monthTxs as Transaction[], prevTxs as Transaction[], todayStr);
        summaryLoading = false;
      }).catch(console.error);
    }
  });

  function formatCompact(num: number): string {
    return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  }

  let loading = $derived(appStore.isLoading || summaryLoading);
  let displayDana = $derived(showAllTime ? totalDanaAllTime : totalDanaBulanIni);
  let growth = $derived(showAllTime ? null : growthBulanIni);
  let cycle = $derived(getCycleBounds(new Date(), appStore.paydayDate));
</script>

<!-- Hero Section: Total Balance -->
<section class="relative space-y-3 hero-glow">
  <!-- Label + toggle -->
  <div class="relative z-10 flex items-center gap-2">
    <p class="font-label text-[10px] font-semibold tracking-[0.12em] uppercase text-on-surface-variant/70">
      {#if showAllTime}
        Semua waktu
      {:else if appStore.paydayDate === 1}
        Bulan ini
      {:else}
        Siklus {cycle.label}
      {/if}
    </p>
    <button
      type="button"
      onclick={() => (showAllTime = !showAllTime)}
      title={showAllTime ? 'Tampilkan siklus ini' : 'Tampilkan semua waktu'}
      class="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide border border-outline-variant/20 text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface hover:border-outline-variant/40 transition-all duration-200 active:scale-95 cursor-pointer"
    >
      <span class="material-symbols-outlined text-[12px]">
        {showAllTime ? 'calendar_month' : 'all_inclusive'}
      </span>
      {showAllTime ? (appStore.paydayDate === 1 ? 'Bulan ini' : 'Siklus ini') : 'Semua'}
    </button>
  </div>

  <!-- Balance + growth -->
  <div class="relative z-10 flex items-end gap-3">
    {#if loading}
      <div class="h-12 w-52 skeleton-wave rounded-xl"></div>
    {:else}
      <span class="font-headline text-[2.6rem] font-extrabold tracking-[-0.04em] text-on-surface leading-none amount-badge">
        Rp {formatNumber(displayDana)}
      </span>
      {#if growth !== null}
        <span
          class="mb-1 inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full transition-all {growth >= 0 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}"
        >
          <span class="material-symbols-outlined text-[12px]">
            {growth >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </span>
      {/if}
    {/if}
  </div>

  {#if !loading && !showAllTime}
    <p class="relative z-10 text-[10px] text-on-surface-variant/40 font-medium">
      dibandingkan {appStore.paydayDate === 1 ? 'bulan lalu' : 'siklus sebelumnya'}
    </p>
  {/if}
</section>

<!-- Bento Grid: Summary Cards -->
<section class="grid grid-cols-2 md:grid-cols-3 gap-3">
  <!-- Total Hari Ini -->
  <div class="col-span-1 p-4 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-4 border border-outline-variant/8 card-spotlight transition-all duration-200">
    <div class="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
      <span class="material-symbols-outlined text-secondary text-[18px]" style="font-variation-settings: 'FILL' 1;">
        account_balance_wallet
      </span>
    </div>
    <div>
      <p class="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Hari ini</p>
      {#if loading}
        <div class="h-5 w-16 skeleton-wave rounded"></div>
      {:else}
        <p class="font-headline text-base font-bold text-on-surface amount-badge">Rp {formatCompact(totalHariIni)}</p>
      {/if}
    </div>
  </div>

  <!-- Total Siklus/Bulan Ini -->
  <div class="col-span-1 p-4 rounded-2xl bg-surface-container-high flex flex-col justify-between gap-4 border border-outline-variant/10 card-spotlight transition-all duration-200">
    <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
      <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">
        calendar_month
      </span>
    </div>
    <div>
      <p class="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">
        {appStore.paydayDate === 1 ? 'Bulan ini' : 'Siklus ini'}
      </p>
      {#if loading}
        <div class="h-5 w-16 skeleton-wave rounded"></div>
      {:else}
        <p class="font-headline text-base font-bold text-on-surface amount-badge">Rp {formatCompact(totalBulanIni)}</p>
      {/if}
    </div>
  </div>

  <!-- Sisa Budget -->
  {#if sisaBudget !== 0 || appStore.budgets.some((b) => b.period === 'monthly')}
    <div
      class="col-span-2 md:col-span-1 p-4 rounded-2xl flex flex-col justify-between gap-4 border transition-all duration-300 card-spotlight {sisaBudget < 0 ? 'bg-error/6 border-error/20' : 'bg-surface-container-low border-outline-variant/8'}"
    >
      <div class="w-8 h-8 rounded-xl flex items-center justify-center {sisaBudget < 0 ? 'bg-error/10' : 'bg-primary/10'}">
        <span
          class="material-symbols-outlined text-[18px] {sisaBudget < 0 ? 'text-error' : 'text-primary'}"
          style="font-variation-settings: 'FILL' 1;"
        >
          {sisaBudget < 0 ? 'warning' : 'analytics'}
        </span>
      </div>
      <div>
        <p class="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Sisa budget</p>
        {#if loading}
          <div class="h-5 w-24 skeleton-wave rounded"></div>
        {:else}
          <p class="font-headline text-base font-extrabold amount-badge {sisaBudget < 0 ? 'text-error' : 'text-on-surface'}">
            Rp {formatCompact(Math.abs(sisaBudget))}{sisaBudget < 0 ? ' lebih' : ''}
          </p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="col-span-2 md:col-span-1 p-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/20 flex flex-col justify-between gap-4 opacity-50">
      <div class="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
        <span class="material-symbols-outlined text-on-surface-variant text-[18px]">savings</span>
      </div>
      <div>
        <p class="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Budget bulanan</p>
        <p class="text-xs text-on-surface-variant/50 font-medium">Belum diatur</p>
      </div>
    </div>
  {/if}
</section>

