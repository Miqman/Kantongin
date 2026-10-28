<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import BottomNavBar from '$lib/components/common/BottomNavBar.svelte';
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
  import type { Category } from '$lib/types';

  const ICON_PRESETS = [
    'restaurant', 'shopping_cart', 'directions_car', 'payments', 'movie',
    'medical_services', 'school', 'home', 'flight', 'fitness_center',
    'shopping_bag', 'receipt_long', 'local_gas_station', 'redeem', 'account_balance_wallet'
  ];

  const COLOR_PRESETS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  let isModalOpen = $state(false);
  let editingCategory = $state<Category | null>(null);
  let deleteTarget = $state<string | null>(null);

  let name = $state('');
  let icon = $state(ICON_PRESETS[0]);
  let color = $state(COLOR_PRESETS[0]);
  let isSubmitting = $state(false);

  function handleOpenModal(cat: Category | null = null) {
    if (cat) {
      editingCategory = cat;
      name = cat.name;
      icon = cat.icon;
      color = cat.color;
    } else {
      editingCategory = null;
      name = '';
      icon = ICON_PRESETS[0];
      color = COLOR_PRESETS[0];
    }
    isModalOpen = true;
  }

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    isSubmitting = true;
    try {
      if (editingCategory) {
        await appStore.updateCategory(editingCategory.id, { name: name.trim(), icon, color });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await appStore.addCategory({ name: name.trim(), icon, color });
        toast.success('Kategori berhasil ditambahkan');
      }
      isModalOpen = false;
    } catch {
      toast.error('Gagal menyimpan kategori');
    } finally {
      isSubmitting = false;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await appStore.deleteCategory(deleteTarget);
      toast.success('Kategori berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus kategori');
    } finally {
      deleteTarget = null;
    }
  }
</script>

<TopAppBar />

<main class="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8">
  <header class="flex items-center justify-between">
    <div>
      <h2 class="font-headline text-2xl font-bold text-on-surface">Kelola Kategori</h2>
      <p class="text-on-surface-variant text-sm">Sesuaikan kategori pengeluaran Anda</p>
    </div>
    <button
      type="button"
      onclick={() => handleOpenModal()}
      class="w-12 h-12 rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
      aria-label="Tambah Kategori"
    >
      <span class="material-symbols-outlined">add</span>
    </button>
  </header>

  <section class="space-y-4">
    <h3 class="font-label text-xs uppercase tracking-widest text-on-surface-variant/70 ml-1">
      Kategori Anda
    </h3>
    <div class="grid grid-cols-1 gap-3">
      {#each appStore.categories as cat (cat.id)}
        <div
          class="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/5 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style="background-color: {cat.color};"
            >
              <span class="material-symbols-outlined">{cat.icon}</span>
            </div>
            <div>
              <h4 class="font-bold text-on-surface">{cat.name}</h4>
              {#if cat.is_default}
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-tighter">
                  Default
                </span>
              {/if}
            </div>
          </div>

          {#if !cat.is_default}
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onclick={() => handleOpenModal(cat)}
                class="w-10 h-10 rounded-full hover:bg-primary/10 text-primary transition-colors flex items-center justify-center cursor-pointer"
                title="Edit Kategori"
              >
                <span class="material-symbols-outlined text-xl">edit</span>
              </button>
              <button
                type="button"
                onclick={() => (deleteTarget = cat.id)}
                class="w-10 h-10 rounded-full hover:bg-error/10 text-error transition-colors flex items-center justify-center cursor-pointer"
                title="Hapus Kategori"
              >
                <span class="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <!-- Add/Edit Modal -->
  {#if isModalOpen}
    <div
      class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onclick={() => (isModalOpen = false)}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Escape') isModalOpen = false; }}
    >
      <div
        class="w-full max-w-md bg-surface p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom duration-300"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div class="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8 sm:hidden"></div>

        <div class="mb-8">
          <h3 class="font-headline text-2xl font-bold">
            {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
          </h3>
          <p class="text-on-surface-variant text-sm">Pilih nama, ikon, dan warna yang sesuai</p>
        </div>

        <form onsubmit={handleSave} class="space-y-8">
          <div class="space-y-2">
            <label for="cat-name-input" class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">
              Nama Kategori
            </label>
            <input
              id="cat-name-input"
              type="text"
              bind:value={name}
              placeholder="Misal: Jajan Sore"
              required
              class="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
            />
          </div>

          <div class="space-y-3">
            <span class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 block">
              Pilih Ikon
            </span>
            <div class="grid grid-cols-5 gap-3">
              {#each ICON_PRESETS as ic}
                <button
                  type="button"
                  onclick={() => (icon = ic)}
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer {icon === ic
                    ? 'bg-primary text-on-primary scale-110 shadow-md'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}"
                >
                  <span class="material-symbols-outlined text-xl">{ic}</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="space-y-3">
            <span class="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 block">
              Pilih Warna
            </span>
            <div class="grid grid-cols-8 gap-3">
              {#each COLOR_PRESETS as cl}
                <button
                  type="button"
                  onclick={() => (color = cl)}
                  class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-surface cursor-pointer {color === cl
                    ? 'ring-2 ring-primary scale-125'
                    : 'hover:scale-110'}"
                  style="background-color: {cl};"
                  aria-label="Pilih warna {cl}"
                ></button>
              {/each}
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              onclick={() => (isModalOpen = false)}
              class="flex-1 py-4 rounded-2xl bg-surface-container-high font-bold active:scale-95 transition-transform cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              class="flex-2 py-4 rounded-2xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingCategory
                  ? 'Simpan Perubahan'
                  : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</main>

<BottomNavBar />

<!-- Delete Confirm Dialog -->
<ConfirmDialog
  open={!!deleteTarget}
  title="Hapus Kategori"
  message="Hapus kategori ini? Transaksi dengan kategori ini mungkin akan terpengaruh."
  confirmLabel="Hapus"
  cancelLabel="Batal"
  variant="danger"
  icon="delete"
  onConfirm={confirmDelete}
  onClose={() => (deleteTarget = null)}
/>

