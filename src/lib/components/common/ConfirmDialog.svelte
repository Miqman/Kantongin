<script lang="ts">
  interface Props {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    icon?: string;
    onClose: () => void;
    onConfirm: () => void;
  }

  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    variant = 'primary',
    icon,
    onClose,
    onConfirm,
  }: Props = $props();

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

  let confirmColors = $derived(
    variant === 'danger'
      ? 'bg-error text-on-error hover:opacity-90'
      : 'bg-primary text-on-primary hover:opacity-90'
  );

  let iconColors = $derived(
    variant === 'danger' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <button
    type="button"
    aria-label="Tutup dialog"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] border-none p-0 cursor-default"
    onclick={onClose}
  ></button>

  <!-- Sheet / Modal -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    class="fixed z-[9999] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl bottom-0 left-0 right-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
  >
    <!-- Handle (mobile only) -->
    <div class="flex justify-center pt-3 pb-1 sm:hidden">
      <div class="w-10 h-1 rounded-full bg-outline-variant/40"></div>
    </div>

    <!-- Content -->
    <div class="px-6 pt-6 pb-2 flex flex-col items-center text-center gap-4">
      {#if icon}
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center {iconColors}">
          <span class="material-symbols-outlined text-3xl">{icon}</span>
        </div>
      {/if}
      <div>
        <h2 id="confirm-dialog-title" class="font-headline font-bold text-lg text-on-surface">
          {title}
        </h2>
        {#if message}
          <p class="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{message}</p>
        {/if}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 px-6 py-5">
      <button
        type="button"
        onclick={onClose}
        class="flex-1 py-3.5 rounded-full text-sm font-bold text-on-surface-variant border border-outline-variant/25 hover:bg-surface-container transition-colors cursor-pointer"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onclick={() => {
          onConfirm();
          onClose();
        }}
        class="flex-1 py-3.5 rounded-full text-sm font-bold transition-opacity cursor-pointer shadow-sm {confirmColors}"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
{/if}

