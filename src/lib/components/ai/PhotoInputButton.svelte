<script lang="ts">
  import type { ParsedTransaction } from '$lib/types';
  import AIOfflineDialog from './AIOfflineDialog.svelte';
  import AITransactionModal from './AITransactionModal.svelte';
  import { appStore } from '$lib/stores/app.svelte';

  interface Props {
    onPrefillForm?: (data: {
      amount: string;
      categoryId: string;
      note: string;
      date: string;
      transactionType: 'expense' | 'income';
    }) => void;
    compact?: boolean;
  }

  let { onPrefillForm, compact = false }: Props = $props();

  let photoState = $state<'idle' | 'checking' | 'processing' | 'done' | 'error'>('idle');
  let showSourceSheet = $state(false);
  let offlineOpen = $state(false);
  let modalOpen = $state(false);
  let parsedResult = $state<ParsedTransaction | null>(null);
  let parseError = $state<string | null>(null);
  let isRetrying = $state(false);

  let cameraInputEl: HTMLInputElement;
  let galleryInputEl: HTMLInputElement;

  // Lock background scroll when source sheet is active
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = showSourceSheet ? 'hidden' : '';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  });

  async function checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/health');
      if (!res.ok) return false;
      const data = await res.json();
      return data?.online === true;
    } catch {
      return false;
    }
  }

  async function compressImage(
    file: File,
    maxDimension = 1024,
    quality = 0.82
  ): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas error'));

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gagal memuat gambar'));
      };

      img.src = objectUrl;
    });
  }

  function handleClick() {
    showSourceSheet = true;
  }

  async function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    photoState = 'processing';
    modalOpen = true;
    parseError = null;
    parsedResult = null;

    try {
      const isOnline = await checkHealth();
      if (!isOnline) {
        modalOpen = false;
        photoState = 'idle';
        offlineOpen = true;
        return;
      }

      const { base64, mimeType } = await compressImage(file);
      const res = await fetch('/api/ai/parse-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          categoryNames: appStore.categories.map((c) => c.name),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memproses struk');
      }

      const result = await res.json();
      parsedResult = result;
      photoState = 'done';
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'Terjadi kesalahan';
      photoState = 'error';
    } finally {
      if (cameraInputEl) cameraInputEl.value = '';
      if (galleryInputEl) galleryInputEl.value = '';
    }
  }

  async function handleRetry() {
    isRetrying = true;
    const isOnline = await checkHealth();
    isRetrying = false;
    if (isOnline) {
      offlineOpen = false;
      showSourceSheet = true;
    }
  }
</script>

<!-- Native Camera capture input (environment = rear camera on mobile) -->
<input
  bind:this={cameraInputEl}
  type="file"
  accept="image/*"
  capture="environment"
  class="hidden"
  onchange={handleFileChange}
/>

<!-- Native Gallery / File picker input -->
<input
  bind:this={galleryInputEl}
  type="file"
  accept="image/*"
  class="hidden"
  onchange={handleFileChange}
/>

{#if photoState === 'processing'}
  <button
    type="button"
    disabled
    class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full border bg-secondary/15 border-secondary/30 text-secondary font-bold shadow-sm transition-all duration-200 cursor-wait animate-pulse"
    aria-label="Memproses foto struk..."
  >
    <span class="material-symbols-outlined text-base animate-spin">auto_awesome</span>
    <span class="tracking-wide">Memproses Struk...</span>
  </button>
{:else}
  <button
    type="button"
    onclick={handleClick}
    class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full border bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm font-bold"
    aria-label="Input foto struk"
  >
    <span class="material-symbols-outlined text-base">photo_camera</span>
    <span class="tracking-wide">Input Foto</span>
  </button>
{/if}

<!-- Bottom sheet / Modal to choose between Camera or Gallery -->
{#if showSourceSheet}
  <div
    class="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="photo-source-title"
  >
    <!-- Backdrop overlay -->
    <button
      type="button"
      aria-label="Tutup pilihan"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm border-none p-0 cursor-default"
      onclick={() => (showSourceSheet = false)}
    ></button>

    <!-- Sheet Panel -->
    <div
      class="relative w-full sm:max-w-sm bg-surface-container-low rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/20 p-6 z-10 animate-in slide-in-from-bottom-4 duration-200"
    >
      <!-- Drag handle for mobile -->
      <div class="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4 sm:hidden"></div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 id="photo-source-title" class="font-headline font-bold text-base text-on-surface">
            Pilih Foto Struk
          </h3>
          <p class="text-xs text-on-surface-variant font-medium mt-0.5">
            Foto langsung atau upload dari galeri
          </p>
        </div>
        <button
          type="button"
          onclick={() => (showSourceSheet = false)}
          class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <!-- Source Options -->
      <div class="flex flex-col gap-2.5 mb-4">
        <!-- Option 1: Kamera langsung -->
        <button
          type="button"
          onclick={() => {
            showSourceSheet = false;
            cameraInputEl?.click();
          }}
          class="flex items-center gap-3.5 p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-secondary/10 hover:border-secondary/30 transition-all cursor-pointer group active:scale-[0.98] text-left"
        >
          <div class="w-11 h-11 rounded-xl bg-secondary/10 group-hover:bg-secondary text-secondary group-hover:text-on-secondary flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-2xl">photo_camera</span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">
              Ambil Foto (Kamera)
            </div>
            <div class="text-xs text-on-surface-variant/80">
              Buka kamera dan foto struk belanja sekarang
            </div>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all">
            chevron_right
          </span>
        </button>

        <!-- Option 2: Upload galeri / file -->
        <button
          type="button"
          onclick={() => {
            showSourceSheet = false;
            galleryInputEl?.click();
          }}
          class="flex items-center gap-3.5 p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98] text-left"
        >
          <div class="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-on-primary flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-2xl">photo_library</span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
              Pilih dari Galeri (Upload)
            </div>
            <div class="text-xs text-on-surface-variant/80">
              Pilih foto atau screenshot struk dari galeri
            </div>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            chevron_right
          </span>
        </button>
      </div>

      <button
        type="button"
        onclick={() => (showSourceSheet = false)}
        class="w-full py-2.5 rounded-2xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant font-medium text-xs transition-colors cursor-pointer text-center"
      >
        Batal
      </button>
    </div>
  </div>
{/if}

<AIOfflineDialog
  open={offlineOpen}
  onClose={() => {
    offlineOpen = false;
    photoState = 'idle';
  }}
  onRetry={handleRetry}
  {isRetrying}
/>

<AITransactionModal
  open={modalOpen}
  result={parsedResult}
  isLoading={photoState === 'processing'}
  error={parseError}
  onClose={() => {
    modalOpen = false;
    photoState = 'idle';
  }}
  onEditInForm={onPrefillForm}
/>

