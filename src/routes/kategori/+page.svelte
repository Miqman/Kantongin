<script lang="ts">
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import BottomNavBar from '$lib/components/common/BottomNavBar.svelte';
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let isAdding = $state(false);
  let newCatName = $state('');
  let newCatIcon = $state('category');
  let newCatColor = $state('#2196f3');
  let loading = $state(false);
  let deleteTarget = $state<string | null>(null);

  const ICON_PRESETS = [
    'restaurant',
    'shopping_cart',
    'directions_car',
    'receipt',
    'movie',
    'payments',
    'home',
    'local_hospital',
    'school',
    'fitness_center',
    'flight',
    'pets',
  ];

  const COLOR_PRESETS = [
    '#ff9800',
    '#2196f3',
    '#e91e63',
    '#f44336',
    '#9c27b0',
    '#4caf50',
    '#00bcd4',
    '#795548',
    '#607d8b',
    '#3f51b5',
  ];

  async function handleAdd(e: SubmitEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    loading = true;
    try {
      await appStore.addCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
      });
      isAdding = false;
      newCatName = '';
      toast.success('Kategori berhasil ditambahkan');
    } catch {
      toast.error('Gagal menambah kategori');
    } finally {
      loading = false;
    }
  }

  function handleDeleteClick(id: string, isDefault: boolean) {
    if (isDefault) {
      toast.error('Kategori bawaan tidak dapat dihapus');
      return;
    }
    deleteTarget = id;
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

<main class="px-6 pt-6 max-w-lg mx-auto pb-32 space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-headline text-2xl font-bold tracking-tight text-on-surface">Kategori</h1>
      <p class="text-on-surface-variant text-xs font-medium mt-0.5">Kelola label untuk transaksi Anda</p>
    </div>
    <button
      type="button"
      onclick={() => (isAdding = !isAdding)}
      class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
    >
      <span class="material-symbols-outlined text-xl">{isAdding ? 'close' : 'add'}</span>
    </button>
  </div>

  {#if isAdding}
    <form
      onsubmit={handleAdd}
      class="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/15 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-200"
    >
      <h2 class="font-headline font-bold text-base text-on-surface">Tambah Kategori Baru</h2>

      <div class="space-y-1.5">
        <label for="cat-name-input" class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Nama Kategori</label>
        <input
          id="cat-name-input"
          bind:value={newCatName}
          placeholder="Cth: Belanja Online, Kopi, Olahraga"
          required
          class="w-full bg-surface-container rounded-xl p-3 text-sm text-on-surface outline-none border border-outline-variant/10 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <!-- Icon presets -->
      <div class="space-y-1.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Pilih Ikon</span>
        <div class="flex flex-wrap gap-2">
          {#each ICON_PRESETS as ic}
            <button
              type="button"
              onclick={() => (newCatIcon = ic)}
              class="w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer {newCatIcon === ic ? 'bg-primary text-on-primary border-primary ring-2 ring-primary/30' : 'bg-surface-container border-outline-variant/10 text-on-surface hover:bg-surface-container-high'}"
            >
              <span class="material-symbols-outlined text-[18px]">{ic}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Color presets -->
      <div class="space-y-1.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Pilih Warna</span>
        <div class="flex flex-wrap gap-2">
          {#each COLOR_PRESETS as c}
            <button
              type="button"
              onclick={() => (newCatColor = c)}
              style="background-color: {c};"
              aria-label="Warna {c}"
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer {newCatColor === c ? 'scale-125 border-white shadow' : 'border-transparent hover:scale-110'}"
            ></button>
          {/each}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-3 rounded-full bg-primary text-on-primary font-headline font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {#if loading}
          <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
        {/if}
        Simpan Kategori
      </button>
    </form>
  {/if}

  <!-- Category List -->
  <div class="space-y-2.5">
    {#each appStore.categories as cat (cat.id)}
      <div class="flex items-center justify-between p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style="background-color: {cat.color}20; color: {cat.color};"
          >
            <span class="material-symbols-outlined">{cat.icon}</span>
          </div>
          <div>
            <p class="font-bold text-sm text-on-surface">{cat.name}</p>
            <p class="text-[10px] text-on-surface-variant/60 font-medium">
              {cat.is_default ? 'Kategori Bawaan' : 'Kustom'}
            </p>
          </div>
        </div>

        {#if !cat.is_default}
          <button
            type="button"
            onclick={() => handleDeleteClick(cat.id, cat.is_default)}
            class="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</main>

<BottomNavBar />

<!-- Delete Confirm Dialog -->
<ConfirmDialog
  open={deleteTarget !== null}
  onClose={() => (deleteTarget = null)}
  onConfirm={confirmDelete}
  variant="danger"
  icon="delete"
  title="Hapus Kategori?"
  message="Kategori kustom ini akan dihapus secara permanen."
  confirmLabel="Hapus"
  cancelLabel="Batal"
/>

