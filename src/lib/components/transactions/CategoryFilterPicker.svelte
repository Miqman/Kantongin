<script lang="ts">
  import type { Category } from '$lib/types';

  interface Props {
    value: string;
    categories: Category[];
    onChange: (id: string) => void;
  }

  let { value, categories, onChange }: Props = $props();

  let open = $state(false);
  let selected = $derived(categories.find((c) => c.id === value));
  let isActive = $derived(value !== 'ALL');

  function handleSelect(id: string) {
    onChange(id);
    open = false;
  }
</script>

<div class="relative">
  <!-- Trigger Button -->
  <button
    type="button"
    onclick={() => (open = !open)}
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer {isActive ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/15 text-on-surface-variant/80 hover:bg-surface-container'}"
  >
    {#if selected}
      <span class="w-2 h-2 rounded-full" style="background-color: {selected.color};"></span>
      <span>{selected.name}</span>
    {:else}
      <span class="material-symbols-outlined text-[16px]">category</span>
      <span>Semua Kategori</span>
    {/if}
    <span class="material-symbols-outlined text-[14px]">
      {open ? 'arrow_drop_up' : 'arrow_drop_down'}
    </span>
  </button>

  <!-- Modal / Dropdown -->
  {#if open}
    <button
      type="button"
      aria-label="Tutup filter"
      class="fixed inset-0 z-40 bg-black/40 border-none p-0 cursor-default"
      onclick={() => (open = false)}
    ></button>

    <div
      class="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:left-0 sm:right-auto z-50 sm:mt-2 w-full sm:w-64 max-h-80 overflow-y-auto bg-surface-container-low border border-outline-variant/20 rounded-t-3xl sm:rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
    >
      <div class="flex flex-col gap-1">
        <button
          type="button"
          onclick={() => handleSelect('ALL')}
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer {value === 'ALL' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container'}"
        >
          <span class="material-symbols-outlined text-[18px]">apps</span>
          <span>Semua Kategori</span>
          {#if value === 'ALL'}
            <span class="ml-auto material-symbols-outlined text-primary text-[16px]">check</span>
          {/if}
        </button>

        {#each categories as cat (cat.id)}
          <button
            type="button"
            onclick={() => handleSelect(cat.id)}
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer {value === cat.id ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container'}"
          >
            <span
              class="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
              style="background-color: {cat.color}25; color: {cat.color};"
            >
              <span class="material-symbols-outlined text-[14px]">{cat.icon}</span>
            </span>
            <span class="truncate">{cat.name}</span>
            {#if value === cat.id}
              <span class="ml-auto material-symbols-outlined text-primary text-[16px]">check</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

