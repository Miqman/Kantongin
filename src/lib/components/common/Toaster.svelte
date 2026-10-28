<script lang="ts">
  import { toast } from '$lib/stores/toast.svelte';
</script>

<div
  class="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
>
  {#each toast.toasts as t (t.id)}
    <div
      role="status"
      class="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg border transition-all animate-in fade-in slide-in-from-top-4"
      style="background: var(--app-surface-container-high); color: var(--app-on-surface); border-color: var(--app-outline-variant);"
    >
      {#if t.type === 'success'}
        <span class="material-symbols-outlined text-green-500 text-lg">check_circle</span>
      {:else if t.type === 'error'}
        <span class="material-symbols-outlined text-red-500 text-lg">error</span>
      {:else}
        <span class="material-symbols-outlined text-primary text-lg">info</span>
      {/if}
      <span>{t.message}</span>
    </div>
  {/each}
</div>

