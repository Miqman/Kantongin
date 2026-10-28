<script lang="ts">
  import type { ParsedTransaction } from '$lib/types';
  import AIOfflineDialog from './AIOfflineDialog.svelte';
  import AITransactionModal from './AITransactionModal.svelte';

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
  let offlineOpen = $state(false);
  let modalOpen = $state(false);
  let parsedResult = $state<ParsedTransaction | null>(null);
  let parseError = $state<string | null>(null);
  let isRetrying = $state(false);

  let fileInputEl: HTMLInputElement;

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

  async function handleClick() {
    photoState = 'checking';
    const isOnline = await checkHealth();
    if (!isOnline) {
      photoState = 'idle';
      offlineOpen = true;
      return;
    }
    photoState = 'idle';
    fileInputEl?.click();
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
      const { base64, mimeType } = await compressImage(file);
      const res = await fetch('/api/ai/parse-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
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
      if (fileInputEl) fileInputEl.value = '';
    }
  }

  async function handleRetry() {
    isRetrying = true;
    const isOnline = await checkHealth();
    isRetrying = false;
    if (isOnline) {
      offlineOpen = false;
      fileInputEl?.click();
    }
  }
</script>

<input
  bind:this={fileInputEl}
  type="file"
  accept="image/*"
  class="hidden"
  onchange={handleFileChange}
/>

{#if compact}
  <button
    type="button"
    onclick={handleClick}
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-all active:scale-95 cursor-pointer border border-outline-variant/10"
  >
    <span class="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
    <span>Foto Struk</span>
  </button>
{:else}
  <button
    type="button"
    onclick={handleClick}
    class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-sm font-semibold text-on-surface transition-all active:scale-95 cursor-pointer shadow-sm border border-outline-variant/10"
  >
    <span class="material-symbols-outlined text-xl text-primary">photo_camera</span>
    <span>Scan Struk</span>
  </button>
{/if}

<AIOfflineDialog
  open={offlineOpen}
  onClose={() => (offlineOpen = false)}
  onRetry={handleRetry}
  {isRetrying}
/>

<AITransactionModal
  open={modalOpen}
  result={parsedResult}
  isLoading={photoState === 'processing'}
  error={parseError}
  onClose={() => (modalOpen = false)}
  onEditInForm={onPrefillForm}
/>

