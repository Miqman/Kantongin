<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';

  interface DayData {
    dateStr: string;
    dayName: string;
    fullDate: string;
    pengeluaran: number;
    pemasukan: number;
  }

  let hoveredIdx = $state<number | null>(null);

  let chartData = $derived.by(() => {
    const last7: DayData[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toLocaleDateString('en-CA'),
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        pengeluaran: 0,
        pemasukan: 0,
      };
    });

    appStore.transactions.forEach((trx) => {
      const dateStr = new Date(trx.date).toLocaleDateString('en-CA');
      const idx = last7.findIndex((d) => d.dateStr === dateStr);
      if (idx === -1) return;
      const amt = Number(trx.amount);
      if (amt > 0) {
        last7[idx].pengeluaran += amt;
      } else {
        last7[idx].pemasukan += Math.abs(amt);
      }
    });

    return last7;
  });

  let maxVal = $derived.by(() => {
    let max = 1000;
    for (const d of chartData) {
      if (d.pengeluaran > max) max = d.pengeluaran;
      if (d.pemasukan > max) max = d.pemasukan;
    }
    return max * 1.15; // 15% headroom
  });

  const chartHeight = 120;
</script>

<section class="space-y-3">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h2 class="font-headline text-base font-bold tracking-tight text-on-surface">Tren 7 hari</h2>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-error/80"></span>
        <span class="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Keluar</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-secondary/80"></span>
        <span class="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Masuk</span>
      </div>
    </div>
  </div>

  <!-- Chart container -->
  <div class="bg-surface-container-lowest px-4 pt-5 pb-3 rounded-2xl border border-outline-variant/6 card-spotlight">
    {#if appStore.isLoading}
      <div class="flex justify-center items-center h-[180px]">
        <div class="flex flex-col items-center gap-2 w-full">
          <div class="h-[80px] w-full skeleton-wave rounded-xl"></div>
          <p class="text-[10px] text-on-surface-variant/40 font-medium">Menganalisis data...</p>
        </div>
      </div>
    {:else}
      <div class="relative w-full h-[180px] flex flex-col justify-end select-none">
        <!-- Floating Tooltip -->
        {#if hoveredIdx !== null && chartData[hoveredIdx]}
          {@const d = chartData[hoveredIdx]}
          <div
            class="absolute top-0 z-20 left-1/2 -translate-x-1/2 bg-surface-container-highest px-3 py-2 rounded-xl shadow-xl border border-outline-variant/10 text-xs flex items-center gap-3 animate-in fade-in zoom-in-95 pointer-events-none"
          >
            <span class="font-bold text-on-surface/80 uppercase tracking-wider text-[10px]">{d.fullDate}</span>
            <div class="flex items-center gap-2">
              <span class="text-error font-bold">Rp {d.pengeluaran.toLocaleString('id-ID')}</span>
              {#if d.pemasukan > 0}
                <span class="text-secondary font-bold">/ +Rp {d.pemasukan.toLocaleString('id-ID')}</span>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Bars Area -->
        <div class="flex items-end justify-between w-full h-[140px] px-2 pt-6">
          {#each chartData as item, idx}
            {@const expH = Math.max(4, Math.round((item.pengeluaran / maxVal) * chartHeight))}
            {@const incH = Math.max(4, Math.round((item.pemasukan / maxVal) * chartHeight))}
            {@const isHovered = hoveredIdx === idx}

            <div
              role="button"
              tabindex="0"
              class="flex flex-col items-center gap-1.5 flex-1 cursor-pointer group"
              onmouseenter={() => (hoveredIdx = idx)}
              onmouseleave={() => (hoveredIdx = null)}
              onclick={() => (hoveredIdx = hoveredIdx === idx ? null : idx)}
              onkeydown={(e) => {
                if (e.key === 'Enter') hoveredIdx = hoveredIdx === idx ? null : idx;
              }}
            >
              <!-- Pair of bars -->
              <div
                class="flex items-end gap-1 px-1 py-1 rounded-lg transition-colors {isHovered ? 'bg-surface-container/60' : ''}"
              >
                <!-- Expense Bar (Red) -->
                <div
                  style="height: {item.pengeluaran > 0 ? `${expH}px` : '4px'};"
                  class="w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 {item.pengeluaran > 0 ? 'bg-error/80 group-hover:bg-error' : 'bg-outline-variant/15'}"
                ></div>

                <!-- Income Bar (Green) -->
                <div
                  style="height: {item.pemasukan > 0 ? `${incH}px` : '4px'};"
                  class="w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 {item.pemasukan > 0 ? 'bg-secondary/80 group-hover:bg-secondary' : 'bg-outline-variant/15'}"
                ></div>
              </div>

              <!-- Day Label -->
              <span
                class="text-[10px] font-semibold uppercase tracking-wider transition-colors {isHovered ? 'text-primary font-bold' : 'text-on-surface-variant/60'}"
              >
                {item.dayName}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

