<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import type { ParsedTransaction } from '$lib/types';

  interface Props {
    open: boolean;
    result: ParsedTransaction | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onEditInForm?: (prefill: {
      amount: string;
      categoryId: string;
      note: string;
      date: string;
      transactionType: 'expense' | 'income';
    }) => void;
  }

  let {
    open = $bindable(false),
    result,
    isLoading,
    error,
    onClose,
    onEditInForm,
  }: Props = $props();

  let saveMode = $state<'total' | 'items'>('total');
  let selectedCategory = $state('');
  let isSaving = $state(false);

  function matchCategory(
    hint: string | null,
    categories: { id: string; name: string }[],
    fallback: string
  ): string {
    if (!hint || categories.length === 0) return fallback;
    const lower = hint.toLowerCase();
    const matched = categories.find(
      (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
    );
    return matched?.id ?? fallback;
  }

  let defaultCatId = $derived(
    appStore.categories.length > 0
      ? matchCategory(result?.category_hint ?? null, appStore.categories, appStore.categories[0].id)
      : ''
  );

  $effect(() => {
    if (defaultCatId && !selectedCategory) {
      selectedCategory = defaultCatId;
    }
  });

  async function handleSaveTotal() {
    if (!result || result.amount == null) return;
    isSaving = true;
    try {
      const type = result.transaction_type ?? (result.amount < 0 ? 'income' : 'expense');
      const finalAmount = type === 'income' ? -Math.abs(result.amount) : Math.abs(result.amount);
      const catId = selectedCategory || appStore.categories[0]?.id || '';

      await appStore.addTransaction({
        amount: finalAmount,
        category_id: catId,
        note: result.note ?? 'Transaksi AI',
        date: result.date ?? new Date().toISOString().slice(0, 10),
      });

      toast.success('Transaksi berhasil disimpan!');
      onClose();
    } catch {
      toast.error('Gagal menyimpan transaksi');
    } finally {
      isSaving = false;
    }
  }

  function handlePrefill() {
    if (!result) return;
    const type = result.transaction_type ?? (result.amount && result.amount < 0 ? 'income' : 'expense');
    const absAmount = result.amount != null ? String(Math.abs(result.amount)) : '';
    const catId = selectedCategory || appStore.categories[0]?.id || '';

    onEditInForm?.({
      amount: absAmount,
      categoryId: catId,
      note: result.note ?? '',
      date: result.date ?? new Date().toISOString().slice(0, 10),
      transactionType: type,
    });
    onClose();
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
  >
    <!-- Overlay -->
    <button
      type="button"
      aria-label="Tutup modal"
      class="absolute inset-0 bg-black/60 backdrop-blur-sm border-none p-0 cursor-default"
      onclick={onClose}
    ></button>

    <!-- Modal Panel -->
    <div
      class="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/10 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
    >
      <!-- Header -->
      <div class="px-6 pt-5 pb-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface/50">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          <h2 class="font-headline font-bold text-base text-on-surface">Hasil Parsing AI</h2>
        </div>
        <button
          type="button"
          onclick={onClose}
          aria-label="Tutup"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto space-y-5">
        {#if isLoading}
          <div class="p-8 flex flex-col items-center justify-center gap-4 text-center">
            <span class="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            <div>
              <p class="font-headline font-bold text-sm text-on-surface">Memproses data dengan AI...</p>
              <p class="text-xs text-on-surface-variant mt-1">Mengekstrak nominal, tanggal, dan kategori transaksi</p>
            </div>
          </div>
        {:else if error}
          <div class="p-4 rounded-2xl bg-error/10 text-error text-sm font-medium flex items-center gap-3">
            <span class="material-symbols-outlined text-lg">error</span>
            <p>{error}</p>
          </div>
        {:else if result}
          <!-- Amount Box -->
          <div class="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-center space-y-1">
            <p class="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Terdeteksi</p>
            <p class="font-headline text-3xl font-extrabold text-on-surface amount-badge">
              Rp {Math.abs(result.amount ?? 0).toLocaleString('id-ID')}
            </p>
            {#if result.date}
              <p class="text-xs text-on-surface-variant/70 font-medium">
                Tanggal: {result.date}
              </p>
            {/if}
          </div>

          <!-- Note -->
          {#if result.note}
            <div class="space-y-1.5">
              <span class="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Catatan
              </span>
              <div class="p-3.5 rounded-xl bg-surface-container text-sm text-on-surface">
                {result.note}
              </div>
            </div>
          {/if}

          <!-- Category Selection -->
          <div class="space-y-1.5">
            <label for="modal-category-select" class="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Pilih Kategori
            </label>
            <select
              id="modal-category-select"
              bind:value={selectedCategory}
              class="w-full bg-surface-container rounded-xl p-3 text-sm text-on-surface font-medium outline-none border border-outline-variant/10 focus:ring-2 focus:ring-primary/20"
            >
              {#each appStore.categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      {#if !isLoading && result}
        <div class="px-6 py-4 border-t border-outline-variant/10 bg-surface/50 flex gap-3">
          <button
            type="button"
            onclick={handlePrefill}
            class="flex-1 py-3 rounded-2xl border border-outline-variant/30 text-on-surface font-semibold text-sm hover:bg-surface-container transition-all cursor-pointer"
          >
            Edit di Form
          </button>
          <button
            type="button"
            onclick={handleSaveTotal}
            disabled={isSaving}
            class="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {#if isSaving}
              <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            {/if}
            Simpan Sekarang
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

