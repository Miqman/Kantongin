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

  let voiceState = $state<'idle' | 'checking' | 'recording' | 'processing' | 'done' | 'error'>('idle');
  let offlineOpen = $state(false);
  let modalOpen = $state(false);
  let parsedResult = $state<ParsedTransaction | null>(null);
  let parseError = $state<string | null>(null);
  let isRetrying = $state(false);
  let transcript = $state('');

  let recognition: any = null;

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

  async function processTranscript(text: string) {
    if (!text.trim()) {
      voiceState = 'idle';
      return;
    }

    voiceState = 'processing';
    modalOpen = true;
    parseError = null;
    parsedResult = null;

    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memproses suara');
      }

      const result = await res.json();
      parsedResult = result;
      voiceState = 'done';
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'Terjadi kesalahan';
      voiceState = 'error';
    }
  }

  async function handleToggleRecord() {
    if (voiceState === 'recording') {
      recognition?.stop();
      return;
    }

    voiceState = 'checking';
    const isOnline = await checkHealth();
    if (!isOnline) {
      voiceState = 'idle';
      offlineOpen = true;
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      const manual = prompt('Browser Anda tidak mendukung suara langsung. Masukkan teks transaksi:');
      if (manual) {
        await processTranscript(manual);
      } else {
        voiceState = 'idle';
      }
      return;
    }

    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;

      recognition.onstart = () => {
        voiceState = 'recording';
        transcript = '';
      };

      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript ?? '';
        transcript = text;
      };

      recognition.onerror = () => {
        voiceState = 'idle';
      };

      recognition.onend = async () => {
        if (transcript) {
          await processTranscript(transcript);
        } else {
          voiceState = 'idle';
        }
      };

      recognition.start();
    } catch {
      voiceState = 'idle';
    }
  }

  async function handleRetry() {
    isRetrying = true;
    const isOnline = await checkHealth();
    isRetrying = false;
    if (isOnline) {
      offlineOpen = false;
      handleToggleRecord();
    }
  }
</script>

{#if compact}
  <button
    type="button"
    onclick={handleToggleRecord}
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl {voiceState === 'recording' ? 'bg-error text-on-error animate-pulse' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'} text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-outline-variant/10"
  >
    <span class="material-symbols-outlined text-[16px] {voiceState === 'recording' ? 'text-white' : 'text-primary'}">
      {voiceState === 'recording' ? 'mic' : 'mic_none'}
    </span>
    <span>{voiceState === 'recording' ? 'Mendengarkan...' : 'Suara'}</span>
  </button>
{:else}
  <button
    type="button"
    onclick={handleToggleRecord}
    class="flex items-center gap-2 px-4 py-2.5 rounded-2xl {voiceState === 'recording' ? 'bg-error text-on-error animate-pulse' : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'} text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-sm border border-outline-variant/10"
  >
    <span class="material-symbols-outlined text-xl {voiceState === 'recording' ? 'text-white' : 'text-primary'}">
      {voiceState === 'recording' ? 'mic' : 'mic_none'}
    </span>
    <span>{voiceState === 'recording' ? 'Mendengarkan...' : 'Input Suara'}</span>
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
  isLoading={voiceState === 'processing'}
  error={parseError}
  onClose={() => (modalOpen = false)}
  onEditInForm={onPrefillForm}
/>
