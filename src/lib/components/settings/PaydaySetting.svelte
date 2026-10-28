<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { getCycleBounds } from '$lib/cycle';
  import { toast } from '$lib/stores/toast.svelte';

  const COMMON_DAYS = [1, 25, 26, 27, 28];

  let isOpen = $state(false);
  let selectedDay = $state(appStore.paydayDate);

  const previewCycle = $derived(getCycleBounds(new Date(), selectedDay));
  const activeCycle = $derived(getCycleBounds(new Date(), appStore.paydayDate));

  function openModal() {
    selectedDay = appStore.paydayDate;
    isOpen = true;
  }

  async function handleSave() {
    try {
      await appStore.setPaydayDate(selectedDay);
      toast.success(`Siklus gajian diatur ke tanggal ${selectedDay}`);
      isOpen = false;
    } catch {
      toast.error('Gagal menyimpan tanggal gajian');
    }
  }
</script>

<div
  onclick={openModal}
  role="button"
  tabindex="0"
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(); }}
  class="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group border-b border-outline-variant/5"
>
  <div class="flex items-center gap-4">
    <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span class="material-symbols-outlined text-primary text-lg">event_repeat</span>
    </div>
    <div>
      <div class="font-medium text-sm text-on-surface flex items-center gap-2">
        <span>Siklus Gajian</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          Tgl {appStore.paydayDate}
        </span>
      </div>
      <p class="text-xs text-on-surface-variant/70 mt-0.5">
        {appStore.paydayDate === 1
          ? 'Mengikuti bulan kalender (Tgl 1 - akhir bulan)'
          : `Siklus berjalan: ${activeCycle.label}`}
      </p>
    </div>
  </div>
  <span class="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-0.5 transition-transform">
    chevron_right
  </span>
</div>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
    onclick={() => (isOpen = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Escape') isOpen = false; }}
  ></div>

  <!-- Modal Dialog -->
  <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div
      class="w-full max-w-sm rounded-[1.75rem] bg-surface-container-high p-6 shadow-2xl border border-outline-variant/15 space-y-5 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-primary text-xl">event_repeat</span>
        </div>
        <div>
          <h3 class="font-headline font-bold text-base text-on-surface">Tanggal Siklus Gajian</h3>
          <p class="text-xs text-on-surface-variant/70 mt-0.5">Awal perhitungan pembukuan bulanan</p>
        </div>
      </div>

      <p class="text-xs text-on-surface-variant leading-relaxed">
        Pemasukan, pengeluaran, dan budget bulanan akan otomatis dihitung mulai dari tanggal gajian ini.
      </p>

      <!-- Quick Presets -->
      <div class="space-y-1.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block">
          Pilihan Populer
        </span>
        <div class="flex flex-wrap gap-2">
          {#each COMMON_DAYS as day}
            {@const isSelected = selectedDay === day}
            <button
              type="button"
              onclick={() => (selectedDay = day)}
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {isSelected
                ? 'bg-primary text-on-primary shadow-sm scale-105'
                : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'}"
            >
              {day === 1 ? 'Tgl 1 (Normal)' : `Tgl ${day}`}
            </button>
          {/each}
        </div>
      </div>

      <!-- Select dropdown for 1-31 -->
      <div class="space-y-1.5">
        <label for="payday-select" class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block">
          Atau Pilih Tanggal Lain (1 - 31)
        </label>
        <select
          id="payday-select"
          bind:value={selectedDay}
          class="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {#each Array.from({ length: 31 }, (_, i) => i + 1) as d}
            <option value={d}>
              Tanggal {d} {d === 1 ? '(Awal bulan kalender)' : ''}
            </option>
          {/each}
        </select>
      </div>

      <!-- Live Preview Card -->
      <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-1">
        <div class="flex items-center gap-1.5 text-primary text-xs font-bold">
          <span class="material-symbols-outlined text-sm">info</span>
          <span>Pratinjau Siklus Berjalan</span>
        </div>
        <p class="text-xs text-on-surface font-medium">
          {previewCycle.start} s/d {previewCycle.end}
        </p>
        <p class="text-[11px] text-on-surface-variant/60">
          Label: <span class="font-semibold text-on-surface">{previewCycle.label}</span>
        </p>
      </div>

      <!-- Buttons -->
      <div class="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onclick={() => (isOpen = false)}
          class="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          onclick={handleSave}
          class="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          Simpan
        </button>
      </div>
    </div>
  </div>
{/if}

