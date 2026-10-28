<script lang="ts">
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let fileInput: HTMLInputElement | null = $state(null);
  let fullName = $state('');
  let previewUrl = $state<string | null>(null);
  let pendingBlob = $state<Blob | null>(null);
  let isSaving = $state(false);
  let isLightboxOpen = $state(false);

  // Sync state whenever modal opens
  $effect(() => {
    if (isOpen) {
      const user = appStore.user;
      fullName =
        (user?.user_metadata?.full_name as string | undefined) ??
        user?.email?.split('@')[0] ??
        '';
      previewUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
      pendingBlob = null;
      isSaving = false;
    }
  });

  async function compressAvatar(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const SIZE = 256;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));

        const { naturalWidth: w, naturalHeight: h } = img;
        const ratio = Math.max(SIZE / w, SIZE / h);
        const scaledW = w * ratio;
        const scaledH = h * ratio;
        const offsetX = (SIZE - scaledW) / 2;
        const offsetY = (SIZE - scaledH) / 2;

        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            resolve(blob);
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
    });
  }

  async function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB.');
      return;
    }

    try {
      const compressed = await compressAvatar(file);
      previewUrl = URL.createObjectURL(compressed);
      pendingBlob = compressed;
    } catch {
      toast.error('Gagal memproses gambar.');
    }

    target.value = '';
  }

  async function handleSave() {
    if (!appStore.user) return;
    if (!fullName.trim()) {
      toast.error('Nama tidak boleh kosong.');
      return;
    }

    isSaving = true;
    try {
      let avatarUrl: string | undefined;

      // Pure BFF: upload avatar via server bridge endpoint
      if (pendingBlob) {
        const formData = new FormData();
        formData.append('avatar', pendingBlob, 'avatar.webp');

        const uploadRes = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData?.error ?? 'Gagal mengunggah foto profil');
        }

        const data = await uploadRes.json();
        avatarUrl = data.url;
      }

      await appStore.updateProfile({
        full_name: fullName.trim(),
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      });

      toast.success('Profil berhasil diperbarui!');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      toast.error(`Gagal menyimpan: ${message}`);
    } finally {
      isSaving = false;
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  ></div>

  <!-- Bottom Sheet -->
  <div
    class="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom duration-300"
  >
    <!-- Handle -->
    <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
      <div class="w-10 h-1 rounded-full bg-outline-variant/40"></div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
      <h2 class="font-headline font-bold text-base text-on-surface">Edit Profil</h2>
      <button
        type="button"
        onclick={onClose}
        class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
        aria-label="Tutup"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
      </button>
    </div>

    <!-- Content -->
    <div class="overflow-y-auto px-6 py-6 space-y-6 flex-1">
      <!-- Avatar Section -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
            <button
              type="button"
              onclick={() => { if (previewUrl) isLightboxOpen = true; }}
              class="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative {previewUrl ? 'cursor-zoom-in' : 'cursor-default'}"
              title={previewUrl ? 'Lihat foto' : undefined}
            >
              {#if previewUrl}
                <img src={previewUrl} alt="Avatar preview" class="w-full h-full object-cover" />
              {:else}
                <span class="text-on-surface font-extrabold text-4xl select-none">
                  {appStore.user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              {/if}
            </button>
          </div>
          <!-- Change photo button -->
          <button
            type="button"
            onclick={() => fileInput?.click()}
            class="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
            title="Ganti foto"
          >
            <span class="material-symbols-outlined text-sm">photo_camera</span>
          </button>
        </div>

        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          class="hidden"
          onchange={handleFileChange}
        />

        <button
          type="button"
          onclick={() => fileInput?.click()}
          class="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          Ganti Foto Profil
        </button>
      </div>

      <!-- Name Input -->
      <div class="space-y-2">
        <label
          for="edit-profile-name"
          class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70"
        >
          Nama Tampilan
        </label>
        <input
          id="edit-profile-name"
          type="text"
          bind:value={fullName}
          placeholder="Nama kamu..."
          maxlength={50}
          class="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 shadow-sm transition-all font-medium outline-none"
        />
        <p class="text-[10px] text-on-surface-variant/40 text-right pr-1">
          {fullName.length}/50
        </p>
      </div>

      <!-- Email (read-only) -->
      <div class="space-y-2">
        <span class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
          Email
        </span>
        <div class="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-2xl py-3.5 px-4 text-on-surface-variant font-medium text-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-on-surface-variant/50">lock</span>
          {appStore.user?.email ?? '—'}
        </div>
        <p class="text-[10px] text-on-surface-variant/40 pl-1">Email tidak dapat diubah</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 pb-8 pt-4 flex gap-3 flex-shrink-0 border-t border-outline-variant/10">
      <button
        type="button"
        onclick={onClose}
        disabled={isSaving}
        class="flex-1 py-3.5 rounded-full border border-outline-variant/20 text-on-surface font-bold text-sm hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
      >
        Batal
      </button>
      <button
        type="button"
        onclick={handleSave}
        disabled={isSaving || !fullName.trim()}
        class="flex-1 py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {#if isSaving}
          <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
          <span>Menyimpan...</span>
        {:else}
          <span class="material-symbols-outlined text-base">check</span>
          <span>Simpan</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Lightbox -->
  {#if isLightboxOpen && previewUrl}
    <div
      class="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center animate-in fade-in duration-200"
      onclick={() => (isLightboxOpen = false)}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Escape') isLightboxOpen = false; }}
    >
      <button
        type="button"
        class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
        onclick={() => (isLightboxOpen = false)}
        aria-label="Tutup tampilan foto"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
      <div
        class="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <img src={previewUrl} alt="Avatar besar" class="w-full h-full object-cover" />
      </div>
    </div>
  {/if}
{/if}

