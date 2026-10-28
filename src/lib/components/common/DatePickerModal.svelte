<script lang="ts">
  import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    subDays,
    isSameMonth,
    isSameDay,
    isToday,
  } from 'date-fns';
  import { id } from 'date-fns/locale';

  interface Props {
    open: boolean;
    value: string; // YYYY-MM-DD
    onClose: () => void;
    onChange: (dateStr: string) => void;
  }

  let { open = $bindable(false), value, onClose, onChange }: Props = $props();

  // Internal view month state, defaults to the selected date's month
  let currentMonth = $state(new Date());

  $effect(() => {
    if (open) {
      if (value) {
        try {
          const parsed = parseISO(value);
          if (!isNaN(parsed.getTime())) {
            currentMonth = parsed;
          }
        } catch {
          currentMonth = new Date();
        }
      } else {
        currentMonth = new Date();
      }
    }
  });

  // Prevent background scroll when modal is active
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : '';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') {
      onClose();
    }
  }

  // Days matrix generation
  let days = $derived.by(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  });

  const parsedSelectedDate = $derived.by(() => {
    if (!value) return null;
    try {
      const p = parseISO(value);
      return isNaN(p.getTime()) ? null : p;
    } catch {
      return null;
    }
  });

  const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  function selectDate(d: Date) {
    const str = format(d, 'yyyy-MM-dd');
    onChange(str);
    onClose();
  }

  function handleQuickSelect(type: 'today' | 'yesterday') {
    const target = type === 'today' ? new Date() : subDays(new Date(), 1);
    selectDate(target);
  }

  function prevMonth() {
    currentMonth = subMonths(currentMonth, 1);
  }

  function nextMonth() {
    currentMonth = addMonths(currentMonth, 1);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <button
    type="button"
    aria-label="Tutup dialog kalender"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] border-none p-0 cursor-default animate-in fade-in duration-200"
    onclick={onClose}
  ></button>

  <!-- Modal / Bottom Sheet -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Pilih tanggal"
    class="fixed z-[9999] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl bottom-0 left-0 right-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm border border-outline-variant/15 p-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
  >
    <!-- Mobile drag handle -->
    <div class="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4 sm:hidden"></div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-lg">calendar_month</span>
        </div>
        <div>
          <h3 class="font-headline font-bold text-base text-on-surface leading-tight">Pilih Tanggal</h3>
          <p class="text-xs text-on-surface-variant font-medium">
            {parsedSelectedDate ? format(parsedSelectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Belum dipilih'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
        aria-label="Tutup"
      >
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    </div>

    <!-- Quick Shortcuts -->
    <div class="flex gap-2 mb-4">
      <button
        type="button"
        onclick={() => handleQuickSelect('today')}
        class="flex-1 py-1.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 text-xs font-semibold text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span class="material-symbols-outlined text-sm">today</span>
        <span>Hari ini</span>
      </button>
      <button
        type="button"
        onclick={() => handleQuickSelect('yesterday')}
        class="flex-1 py-1.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span class="material-symbols-outlined text-sm">history</span>
        <span>Kemarin</span>
      </button>
    </div>

    <!-- Month Navigation -->
    <div class="flex items-center justify-between px-1 mb-3">
      <button
        type="button"
        onclick={prevMonth}
        class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
        aria-label="Bulan sebelumnya"
      >
        <span class="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      <span class="font-headline font-bold text-sm text-on-surface capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: id })}
      </span>

      <button
        type="button"
        onclick={nextMonth}
        class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
        aria-label="Bulan berikutnya"
      >
        <span class="material-symbols-outlined text-lg">chevron_right</span>
      </button>
    </div>

    <!-- Weekday Headers -->
    <div class="grid grid-cols-7 gap-1 text-center mb-1">
      {#each WEEKDAYS as w}
        <span class="text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider py-1">
          {w}
        </span>
      {/each}
    </div>

    <!-- Days Grid -->
    <div class="grid grid-cols-7 gap-1">
      {#each days as day}
        {@const isCurrent = isSameMonth(day, currentMonth)}
        {@const isSel = parsedSelectedDate ? isSameDay(day, parsedSelectedDate) : false}
        {@const isTod = isToday(day)}

        <button
          type="button"
          onclick={() => selectDate(day)}
          class="aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer relative
            {isSel
              ? 'bg-primary text-on-primary font-bold shadow-md scale-105 z-10'
              : isTod
                ? 'bg-primary/10 text-primary font-bold border border-primary/30 hover:bg-primary/20'
                : isCurrent
                  ? 'text-on-surface hover:bg-surface-container-high'
                  : 'text-on-surface-variant/30 hover:bg-surface-container/50'}"
        >
          {format(day, 'd')}
          {#if isTod && !isSel}
            <span class="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

