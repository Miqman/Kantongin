<script lang="ts">
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';

  interface Props {
    id?: string;
    icon: string;
    category: string;
    vendor: string;
    amount: string;
    date: string;
    isIncome?: boolean;
    iconColorClass?: string;
    onDelete?: () => void;
    onEdit?: () => void;
  }

  let {
    id,
    icon,
    category,
    vendor,
    amount,
    date,
    isIncome = false,
    iconColorClass = 'text-primary',
    onDelete,
    onEdit,
  }: Props = $props();

  let dialog = $state<'edit' | 'delete' | null>(null);

  // Touch swipe handling
  let startX = 0;
  let currentX = $state(0);
  let isSwiping = $state(false);
  const swipeThreshold = 65;

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    isSwiping = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    // Limit drag to [-100, 100]
    currentX = Math.max(-100, Math.min(100, diff));
  }

  function handleTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;

    if (currentX < -swipeThreshold) {
      if (onDelete) dialog = 'delete';
    } else if (currentX > swipeThreshold) {
      if (onEdit) dialog = 'edit';
    }
    currentX = 0;
  }

  let amountColor = $derived(
    isIncome ? 'var(--app-secondary)' : 'var(--app-tertiary)'
  );
</script>

<div class="relative w-full rounded-2xl overflow-hidden bg-surface-container-high/30 group touch-pan-y">
  <!-- Background action hints -->
  <div class="absolute inset-0 flex justify-between items-center px-4">
    <button
      type="button"
      onclick={() => onEdit?.()}
      class="flex items-center text-primary gap-1.5 cursor-pointer"
    >
      <span class="material-symbols-outlined text-[18px]">edit</span>
      <span class="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Edit</span>
    </button>
    <button
      type="button"
      onclick={() => onDelete?.()}
      class="flex items-center text-error gap-1.5 cursor-pointer"
    >
      <span class="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Hapus</span>
      <span class="material-symbols-outlined text-[18px]">delete</span>
    </button>
  </div>

  <!-- Foreground item -->
  <div
    role="button"
    tabindex="0"
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    onclick={() => {
      // Click opens edit if available
      if (onEdit) dialog = 'edit';
    }}
    onkeydown={(e) => {
      if (e.key === 'Enter' && onEdit) dialog = 'edit';
    }}
    style="transform: translateX({currentX}px); transition: {isSwiping ? 'none' : 'transform 0.2s ease'};"
    class="relative z-10 flex items-center justify-between px-3.5 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl cursor-pointer select-none"
  >
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 {isIncome ? 'bg-secondary/10' : 'bg-primary/8'} {iconColorClass}">
        <span
          class="material-symbols-outlined text-[20px]"
          style="font-variation-settings: 'FILL' 1, 'wght' 400;"
        >
          {icon}
        </span>
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-on-surface text-[13px] leading-tight">{category}</p>
        <p class="text-[11px] text-on-surface-variant/55 mt-0.5 max-w-[140px] truncate">{vendor}</p>
      </div>
    </div>

    <div class="text-right flex-shrink-0 ml-2">
      <p class="font-bold text-[13px] amount-badge leading-tight" style="color: {amountColor};">
        {amount}
      </p>
      <p class="text-[10px] text-on-surface-variant/40 font-medium mt-0.5">{date}</p>
    </div>
  </div>
</div>

<!-- Delete confirmation -->
<ConfirmDialog
  open={dialog === 'delete'}
  onClose={() => (dialog = null)}
  onConfirm={() => onDelete?.()}
  variant="danger"
  icon="delete"
  title="Hapus Transaksi?"
  message="Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen."
  confirmLabel="Ya, Hapus"
  cancelLabel="Batal"
/>

<!-- Edit confirmation -->
<ConfirmDialog
  open={dialog === 'edit'}
  onClose={() => (dialog = null)}
  onConfirm={() => onEdit?.()}
  variant="primary"
  icon="edit"
  title="Edit Transaksi?"
  message="Anda akan diarahkan ke form untuk mengubah detail transaksi ini."
  confirmLabel="Lanjut Edit"
  cancelLabel="Batal"
/>

