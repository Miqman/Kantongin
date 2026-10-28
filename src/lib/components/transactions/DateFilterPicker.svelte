<script lang="ts">
  import type { DateFilterValue, DateFilterMode } from '$lib/stores/filters.svelte';

  interface Props {
    value: DateFilterValue | null;
    onChange: (v: DateFilterValue | null) => void;
  }

  let { value, onChange }: Props = $props();

  let open = $state(false);
  let activeTab = $state<DateFilterMode>('MONTH');

  const THIS_YEAR = new Date().getFullYear();
  const THIS_MONTH = new Date().getMonth();

  let selectedYear = $state(THIS_YEAR);
  let selectedMonth = $state(THIS_MONTH);

  // Range calendar state
  let calYear = $state(THIS_YEAR);
  let calMonth = $state(THIS_MONTH);
  let rangeFrom = $state<Date | undefined>(undefined);
  let rangeTo = $state<Date | undefined>(undefined);

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_FULL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function startOfDay(d: Date): Date {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  }

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function getLabel(v: DateFilterValue | null): string {
    if (!v) return 'Semua Waktu';
    if (v.mode === 'RANGE') {
      const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (v.from && v.to) {
        if (v.from.getTime() === v.to.getTime()) return fmt(v.from);
        return `${fmt(v.from)} – ${fmt(v.to)}`;
      }
      if (v.from) return `Dari ${fmt(v.from)}`;
      return 'Rentang Tanggal';
    }
    if (v.mode === 'MONTH' && v.month !== undefined && v.year !== undefined) {
      return `${MONTHS_SHORT[v.month]} ${v.year}`;
    }
    if (v.mode === 'YEAR' && v.year !== undefined) {
      return `Tahun ${v.year}`;
    }
    return 'Filter Waktu';
  }

  function handleOpen() {
    if (value?.mode === 'RANGE') {
      activeTab = 'RANGE';
      rangeFrom = value.from ? startOfDay(value.from) : undefined;
      rangeTo = value.to ? startOfDay(value.to) : undefined;
      if (value.from) {
        calYear = value.from.getFullYear();
        calMonth = value.from.getMonth();
      }
    } else if (value?.mode === 'MONTH') {
      activeTab = 'MONTH';
      if (value.year !== undefined) selectedYear = value.year;
      if (value.month !== undefined) selectedMonth = value.month;
    } else if (value?.mode === 'YEAR') {
      activeTab = 'YEAR';
      if (value.year !== undefined) selectedYear = value.year;
    }
    open = !open;
  }

  function handleDayClick(day: number) {
    const clicked = startOfDay(new Date(calYear, calMonth, day));
    if (!rangeFrom || (rangeFrom && rangeTo)) {
      rangeFrom = clicked;
      rangeTo = undefined;
    } else {
      if (clicked < rangeFrom) {
        rangeTo = rangeFrom;
        rangeFrom = clicked;
      } else {
        rangeTo = clicked;
      }
    }
  }

  function applyRange() {
    if (!rangeFrom) return;
    onChange({
      mode: 'RANGE',
      from: rangeFrom,
      to: rangeTo || rangeFrom,
    });
    open = false;
  }

  function handlePreset(type: '7_DAYS' | '30_DAYS' | 'THIS_MONTH') {
    const today = startOfDay(new Date());
    let from: Date;
    if (type === '7_DAYS') {
      from = new Date(today);
      from.setDate(today.getDate() - 6);
    } else if (type === '30_DAYS') {
      from = new Date(today);
      from.setDate(today.getDate() - 29);
    } else {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    rangeFrom = from;
    rangeTo = today;
    onChange({
      mode: 'RANGE',
      from,
      to: today,
    });
    open = false;
  }

  function prevCalMonth() {
    if (calMonth === 0) {
      calMonth = 11;
      calYear--;
    } else {
      calMonth--;
    }
  }

  function nextCalMonth() {
    if (calMonth === 11) {
      calMonth = 0;
      calYear++;
    } else {
      calMonth++;
    }
  }

  let calCells = $derived.by(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  function handleSelectMonth(m: number) {
    selectedMonth = m;
    onChange({
      mode: 'MONTH',
      month: m,
      year: selectedYear,
    });
    open = false;
  }

  function handleSelectYear(y: number) {
    selectedYear = y;
    onChange({
      mode: 'YEAR',
      year: y,
    });
    open = false;
  }

  function handleReset() {
    rangeFrom = undefined;
    rangeTo = undefined;
    onChange(null);
    open = false;
  }
</script>

<div class="relative">
  <!-- Trigger Button -->
  <button
    type="button"
    onclick={handleOpen}
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer {value ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/15 text-on-surface-variant/80 hover:bg-surface-container'}"
  >
    <span class="material-symbols-outlined text-[16px]">calendar_today</span>
    <span>{getLabel(value)}</span>
    <span class="material-symbols-outlined text-[14px]">
      {open ? 'arrow_drop_up' : 'arrow_drop_down'}
    </span>
  </button>

  {#if open}
    <button
      type="button"
      aria-label="Tutup filter"
      class="fixed inset-0 z-40 bg-black/40 border-none p-0 cursor-default"
      onclick={() => (open = false)}
    ></button>

    <div
      class="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:left-0 sm:right-auto z-50 sm:mt-2 w-full sm:w-80 bg-surface-container-low border border-outline-variant/20 rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 space-y-4"
    >
      <!-- Mode Tabs -->
      <div class="flex p-1 bg-surface-container rounded-xl text-xs font-semibold">
        <button
          type="button"
          onclick={() => (activeTab = 'RANGE')}
          class="flex-1 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === 'RANGE' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant'}"
        >
          Rentang
        </button>
        <button
          type="button"
          onclick={() => (activeTab = 'MONTH')}
          class="flex-1 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === 'MONTH' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant'}"
        >
          Per Bulan
        </button>
        <button
          type="button"
          onclick={() => (activeTab = 'YEAR')}
          class="flex-1 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === 'YEAR' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant'}"
        >
          Per Tahun
        </button>
      </div>

      {#if activeTab === 'RANGE'}
        <!-- Quick Preset Chips -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-hide">
          <button
            type="button"
            onclick={() => handlePreset('7_DAYS')}
            class="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors whitespace-nowrap cursor-pointer"
          >
            7 Hari
          </button>
          <button
            type="button"
            onclick={() => handlePreset('30_DAYS')}
            class="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors whitespace-nowrap cursor-pointer"
          >
            30 Hari
          </button>
          <button
            type="button"
            onclick={() => handlePreset('THIS_MONTH')}
            class="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors whitespace-nowrap cursor-pointer"
          >
            Bulan Ini
          </button>
        </div>

        <!-- Month Navigation -->
        <div class="flex justify-between items-center px-1">
          <button
            type="button"
            onclick={prevCalMonth}
            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span class="font-headline font-bold text-sm text-on-surface">
            {MONTHS_FULL[calMonth]} {calYear}
          </span>
          <button
            type="button"
            onclick={nextCalMonth}
            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 text-center text-[10px] font-bold text-on-surface-variant/60">
          {#each ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as d}
            <div class="py-1">{d}</div>
          {/each}
        </div>

        <!-- Calendar Days Grid -->
        <div class="grid grid-cols-7 gap-y-1">
          {#each calCells as day, idx}
            {#if day === null}
              <div></div>
            {:else}
              {@const cellDate = new Date(calYear, calMonth, day)}
              {@const isStart = rangeFrom && isSameDay(cellDate, rangeFrom)}
              {@const isEnd = rangeTo && isSameDay(cellDate, rangeTo)}
              {@const inRange = rangeFrom && rangeTo && cellDate > rangeFrom && cellDate < rangeTo}
              {@const isToday = isSameDay(cellDate, new Date())}
              {@const isSelected = isStart || isEnd}
              <button
                type="button"
                onclick={() => handleDayClick(day)}
                class="relative h-8 w-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors
                  {inRange ? 'bg-primary/15 text-primary' : ''}
                  {isStart ? 'rounded-l-full bg-primary text-on-primary' : ''}
                  {isEnd ? 'rounded-r-full bg-primary text-on-primary' : ''}
                  {isSelected && !inRange ? 'rounded-full bg-primary text-on-primary' : ''}
                  {!isSelected && isToday ? 'ring-1 ring-primary ring-inset rounded-full text-primary' : ''}
                  {!isSelected && !inRange ? 'hover:bg-surface-container rounded-full text-on-surface' : ''}"
              >
                {day}
              </button>
            {/if}
          {/each}
        </div>

        <!-- Selected Range Preview & Apply -->
        <div class="flex items-center justify-between pt-1">
          <div class="text-[11px] text-on-surface-variant">
            {#if rangeFrom && rangeTo}
              <span class="font-bold text-primary">
                {rangeFrom.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
              <span class="mx-1">→</span>
              <span class="font-bold text-primary">
                {rangeTo.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            {:else if rangeFrom}
              <span class="text-primary font-medium">Pilih tanggal akhir</span>
            {:else}
              <span>Pilih tanggal</span>
            {/if}
          </div>
          <button
            type="button"
            onclick={applyRange}
            disabled={!rangeFrom}
            class="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      {:else if activeTab === 'MONTH'}
        <!-- Year Selector Header -->
        <div class="flex justify-between items-center px-1">
          <button
            type="button"
            onclick={() => selectedYear--}
            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span class="font-headline font-bold text-sm text-on-surface">{selectedYear}</span>
          <button
            type="button"
            onclick={() => selectedYear++}
            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        <div class="grid grid-cols-4 gap-1.5">
          {#each MONTHS_SHORT as m, idx}
            {@const isSelected = value?.mode === 'MONTH' && value.month === idx && value.year === selectedYear}
            <button
              type="button"
              onclick={() => handleSelectMonth(idx)}
              class="py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer {isSelected ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container text-on-surface'}"
            >
              {m}
            </button>
          {/each}
        </div>
      {:else}
        <div class="grid grid-cols-3 gap-2">
          {#each [THIS_YEAR - 2, THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1] as y}
            {@const isSelected = value?.mode === 'YEAR' && value.year === y}
            <button
              type="button"
              onclick={() => handleSelectYear(y)}
              class="py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {isSelected ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container text-on-surface'}"
            >
              {y}
            </button>
          {/each}
        </div>
      {/if}

      <div class="pt-2 border-t border-outline-variant/10 flex justify-between">
        <button
          type="button"
          onclick={handleReset}
          class="text-xs font-semibold text-error hover:underline cursor-pointer"
        >
          Reset Filter
        </button>
        <button
          type="button"
          onclick={() => (open = false)}
          class="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  {/if}
</div>
