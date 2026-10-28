<script lang="ts">
  interface Props {
    open: boolean;
    onClose: () => void;
    onRetry: () => void;
    isRetrying?: boolean;
  }

  let { open = $bindable(false), onClose, onRetry, isRetrying = false }: Props = $props();

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
</script>

{#if open}
  <div
    class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ai-offline-title"
  >
    <!-- Dimmed overlay -->
    <button
      type="button"
      aria-label="Tutup dialog"
      class="absolute inset-0 bg-black/60 backdrop-blur-sm border-none p-0 cursor-default"
      onclick={onClose}
    ></button>

    <!-- Dialog panel -->
    <div class="relative w-full max-w-sm bg-surface-container-low rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div class="h-1 w-full bg-gradient-to-r from-tertiary via-error to-tertiary"></div>

      <div class="p-6">
        <div class="mx-auto mb-4 w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-error text-3xl">cloud_off</span>
        </div>

        <h2 id="ai-offline-title" class="font-headline text-lg font-bold text-on-surface text-center mb-2">
          Fitur AI Tidak Tersedia
        </h2>

        <p class="font-body text-sm text-on-surface-variant text-center mb-1">
          Layanan AI sedang tidak dapat digunakan saat ini.
        </p>
        <p class="font-body text-xs text-on-surface-variant/70 text-center mb-6">
          Silakan hubungi developer jika masalah ini berlanjut.
        </p>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            onclick={onRetry}
            disabled={isRetrying}
            class="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-headline font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait cursor-pointer flex items-center justify-center gap-2"
          >
            {#if isRetrying}
              <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Memeriksa...
            {:else}
              <span class="material-symbols-outlined text-base">refresh</span>
              Coba Lagi
            {/if}
          </button>

          <button
            type="button"
            onclick={onClose}
            class="w-full py-3 rounded-2xl bg-transparent text-on-surface-variant font-headline font-medium text-sm hover:bg-surface-container transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

