<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';

  let sheetOpen = $state(false);
  let inputValue = $state('');
  let saving = $state(false);
  let deleteConfirm = $state(false);

  const activeBudget = $derived(
    Array.isArray(appStore.budgets)
      ? appStore.budgets.find((b) => b.period === 'monthly' && !b.category_id)
      : null
  );

  function formatCurrency(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  function parseInput(raw: string): number {
    return Number(raw.replace(/\D/g, ''));
  }

  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const raw = target.value.replace(/\D/g, '');
    inputValue = raw ? Number(raw).toLocaleString('id-ID') : '';
  }

  function openSheet() {
    inputValue = activeBudget ? Number(activeBudget.limit_amount).toLocaleString('id-ID') : '';
    sheetOpen = true;
  }

  async function handleSave() {
    const amount = parseInput(inputValue);
    if (!amount || amount <= 0) {
      toast.error('Masukkan nominal yang valid');
      return;
    }

    saving = true;
    try {
      await appStore.setBudget(amount, 'monthly');
      toast.success('Budget bulanan berhasil disimpan!');
      sheetOpen = false;
    } catch {
      toast.error('Gagal menyimpan budget');
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!activeBudget) return;
    try {
      await appStore.deleteBudget(activeBudget.id);
      toast.success('Budget berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus budget');
    }
  }
</script>

<!-- Card -->
<div
  class="bg-surface-container-low p-6 rounded-[2rem] flex flex-col justify-between border border-primary/10 cursor-pointer hover:bg-surface-container transition-colors group"
  onclick={openSheet}
  role="button"
  tabindex="0"
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openSheet(); }}
>
  <div class="flex justify-between items-start mb-4">
    <div class="p-2 bg-primary/10 rounded-xl">
      <span class="material-symbols-outlined text-primary">account_balance_wallet</span>
    </div>
    {#if activeBudget}
      <span class="text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary px-2.5 py-1 rounded-full">
        Aktif
      </span>
    {/if}
  </div>

  <div>
    <h3 class="font-headline font-bold text-lg">Budget Bulanan</h3>
    {#if activeBudget}
      <p class="text-primary font-bold text-base mt-1">
        Rp {formatCurrency(activeBudget.limit_amount)}
      </p>
    {:else}
      <p class="text-on-surface-variant text-sm mt-1">Tap untuk atur batas pengeluaran</p>
    {/if}
  </div>

  <div class="mt-3 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
    <span class="material-symbols-outlined text-[16px]">edit</span>
    <span class="text-xs font-bold">{activeBudget ? 'Ubah' : 'Atur'} budget</span>
  </div>
</div>

<!-- Bottom Sheet -->
{#if sheetOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
    onclick={() => (sheetOpen = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Escape') sheetOpen = false; }}
  ></div>

  <div
    class="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] animate-in slide-in-from-bottom duration-300"
    style="max-height: 80dvh;"
  >
    <!-- Handle -->
    <div class="flex justify-center pt-3 pb-1">
      <div class="w-10 h-1 rounded-full bg-outline-variant/40"></div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4">
      <h2 class="font-headline font-bold text-lg">
        {activeBudget ? 'Ubah Budget Bulanan' : 'Atur Budget Bulanan'}
      </h2>
      <button
        onclick={() => (sheetOpen = false)}
        class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
        aria-label="Tutup"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
      </button>
    </div>

    <div class="px-6 pb-8 space-y-6">
      <p class="text-sm text-on-surface-variant leading-relaxed">
        Batas pengeluaran total per bulan. Sisa budget akan tampil di dashboard.
      </p>

      <!-- Input -->
      <div class="space-y-2">
        <label for="budget-input" class="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
          Nominal Budget
        </label>
        <div class="flex items-center gap-3 bg-surface-container-low border border-outline-variant/15 rounded-2xl px-4 py-4 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <span class="text-on-surface-variant font-bold text-sm">Rp</span>
          <input
            id="budget-input"
            type="text"
            inputmode="numeric"
            value={inputValue}
            oninput={handleInputChange}
            placeholder="0"
            class="flex-1 bg-transparent outline-none text-on-surface font-headline font-bold text-xl placeholder:text-on-surface-variant/30"
          />
        </div>
      </div>

      <!-- Quick picks -->
      <div class="flex gap-2 flex-wrap">
        {#each [500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000] as amt}
          <button
            type="button"
            onclick={() => (inputValue = amt.toLocaleString('id-ID'))}
            class="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            {amt >= 1_000_000 ? `${amt / 1_000_000}jt` : `${amt / 1_000}rb`}
          </button>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        {#if activeBudget}
          <button
            type="button"
            onclick={() => {
              sheetOpen = false;
              deleteConfirm = true;
            }}
            class="px-5 py-3.5 rounded-full text-sm font-bold text-error border border-error/20 hover:bg-error/10 transition-colors cursor-pointer"
          >
            Hapus
          </button>
        {/if}
        <button
          type="button"
          onclick={handleSave}
          disabled={saving}
          class="flex-1 py-3.5 rounded-full text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {saving ? 'Menyimpan...' : 'Simpan Budget'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation -->
<ConfirmDialog
  open={deleteConfirm}
  title="Hapus Budget?"
  message="Kartu Sisa Budget di dashboard akan tersembunyi. Anda bisa mengaturnya kembali kapan saja."
  confirmLabel="Ya, Hapus"
  cancelLabel="Batal"
  variant="danger"
  icon="delete"
  onConfirm={handleDelete}
  onClose={() => (deleteConfirm = false)}
/>

