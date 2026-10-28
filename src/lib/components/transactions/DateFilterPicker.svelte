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

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function getLabel(v: DateFilterValue | null): string {
    if (!v) return 'Semua Waktu';
    if (v.mode === 'MONTH' && v.month !== undefined && v.year !== undefined) {
      return `${MONTHS_SHORT[v.month]} ${v.year}`;
    }
    if (v.mode === 'YEAR' && v.year !== undefined) {
      return `Tahun ${v.year}`;
    }
    return 'Filter Waktu';
  }

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
    onChange(null);
    open = false;
  }
</script>

<div class="relative">
  <!-- Trigger Button -->
  <button
    type="button"
    onclick={() => (open = !open)}
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
      class="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:left-0 sm:right-auto z-50 sm:mt-2 w-full sm:w-72 bg-surface-container-low border border-outline-variant/20 rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 space-y-4"
    >
      <!-- Mode Tabs -->
      <div class="flex p-1 bg-surface-container rounded-xl text-xs font-semibold">
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

      {#if activeTab === 'MONTH'}
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

