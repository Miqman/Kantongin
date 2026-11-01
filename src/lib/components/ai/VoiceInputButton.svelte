<script lang="ts">
  import type { ParsedTransaction } from '$lib/types';
  import AIOfflineDialog from './AIOfflineDialog.svelte';
  import AITransactionModal from './AITransactionModal.svelte';
  import { toast } from '$lib/stores/toast.svelte';

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

  let voiceState = $state<'idle' | 'starting' | 'recording' | 'processing' | 'done' | 'error'>('idle');
  let offlineOpen = $state(false);
  let modalOpen = $state(false);
  let parsedResult = $state<ParsedTransaction | null>(null);
  let parseError = $state<string | null>(null);
  let isRetrying = $state(false);
  let transcript = $state('');

  let recognition: any = null;
  let healthPromise: Promise<boolean> | null = null;

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

  function handleToggleRecord() {
    if (voiceState === 'recording') {
      recognition?.stop();
      return;
    }

    if (voiceState === 'starting' || voiceState === 'processing') {
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      toast.info('Browser Anda tidak mendukung input suara langsung.');
      const manual = prompt('Browser Anda tidak mendukung suara langsung. Masukkan teks transaksi:');
      if (manual) {
        processTranscript(manual);
      } else {
        voiceState = 'idle';
      }
      return;
    }

    // ponytail: Start recording instantly without blocking on health check.
    // Run health check concurrently in background; verified before AI parsing.
    voiceState = 'starting';
    transcript = '';
    healthPromise = checkHealth();

    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        voiceState = 'recording';
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0]?.transcript || '';
        }
        transcript = current.trim();
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('Izin mikrofon diperlukan. Silakan izinkan di browser Anda.');
        } else if (event.error !== 'no-speech') {
          toast.error('Gagal merekam suara (' + event.error + ')');
        }
        voiceState = 'idle';
      };

      recognition.onend = async () => {
        const text = transcript.trim();
        if (!text) {
          voiceState = 'idle';
          return;
        }

        voiceState = 'processing';
        const isOnline = await (healthPromise ?? checkHealth());
        if (!isOnline) {
          voiceState = 'idle';
          offlineOpen = true;
          return;
        }

        await processTranscript(text);
      };

      recognition.start();
    } catch (err) {
      console.error('[VoiceInput] Start error:', err);
      toast.error('Tidak dapat mengaktifkan mikrofon');
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

<div class="relative inline-flex items-center">
  {#if voiceState === 'recording'}
    <button
      type="button"
      onclick={handleToggleRecord}
      class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full bg-error text-white font-bold shadow-lg shadow-error/30 ring-4 ring-error/25 transition-all duration-200 cursor-pointer active:scale-95"
      aria-label="Sedang mendengarkan — ketuk untuk selesai"
    >
      <!-- Animated Soundwave equalizer bars -->
      <span class="flex items-center gap-0.5 h-3.5 px-0.5" aria-hidden="true">
        <span class="w-1 bg-white rounded-full soundwave-bar soundwave-bar-1"></span>
        <span class="w-1 bg-white rounded-full soundwave-bar soundwave-bar-2"></span>
        <span class="w-1 bg-white rounded-full soundwave-bar soundwave-bar-3"></span>
      </span>
      <span class="tracking-wide">Mendengarkan...</span>
      <span class="material-symbols-outlined text-[15px] opacity-80 ml-0.5" title="Selesai bicara">
        stop_circle
      </span>
    </button>
  {:else if voiceState === 'starting'}
    <button
      type="button"
      disabled
      class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full border bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold shadow-sm transition-all duration-200 cursor-wait animate-pulse"
      aria-label="Menyiapkan mikrofon..."
    >
      <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
      <span class="tracking-wide">Menyiapkan mic...</span>
    </button>
  {:else if voiceState === 'processing'}
    <button
      type="button"
      disabled
      class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full border bg-primary/15 border-primary/30 text-primary font-bold shadow-sm transition-all duration-200 cursor-wait"
      aria-label="Memproses suara..."
    >
      <span class="material-symbols-outlined text-base animate-spin">auto_awesome</span>
      <span class="tracking-wide">Memproses AI...</span>
    </button>
  {:else}
    <!-- Idle state -->
    <button
      type="button"
      onclick={handleToggleRecord}
      class="relative flex items-center gap-2 {compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} rounded-full border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm font-bold"
      aria-label="Input suara"
    >
      <span class="material-symbols-outlined text-base">mic</span>
      <span class="tracking-wide">Input Suara</span>
    </button>
  {/if}

  <!-- Live speech bubble / hint when listening -->
  {#if voiceState === 'recording'}
    <div
      class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[260px] sm:max-w-xs px-3 py-1.5 rounded-full bg-surface-container-high/95 dark:bg-surface-container/95 backdrop-blur-md border border-outline-variant/30 shadow-xl text-center z-30 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {#if transcript}
        <p class="text-xs text-on-surface font-medium truncate">
          <span class="text-primary font-bold mr-0.5">“</span>{transcript}<span class="text-primary font-bold ml-0.5">”</span>
        </p>
      {:else}
        <p class="text-[11px] text-on-surface-variant flex items-center justify-center gap-1.5 font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
          <span>Bicara: <em>"Beli kopi 25rb"</em></span>
        </p>
      {/if}
    </div>
  {/if}
</div>

<AIOfflineDialog
  open={offlineOpen}
  onClose={() => {
    offlineOpen = false;
    voiceState = 'idle';
  }}
  onRetry={handleRetry}
  {isRetrying}
/>

<AITransactionModal
  open={modalOpen}
  result={parsedResult}
  isLoading={voiceState === 'processing'}
  error={parseError}
  onClose={() => {
    modalOpen = false;
    voiceState = 'idle';
  }}
  onEditInForm={onPrefillForm}
/>

<style>
  .soundwave-bar {
    display: inline-block;
    animation: soundwave 0.8s ease-in-out infinite;
    transform-origin: bottom;
  }
  .soundwave-bar-1 {
    height: 6px;
    animation-delay: 0s;
  }
  .soundwave-bar-2 {
    height: 14px;
    animation-delay: 0.2s;
  }
  .soundwave-bar-3 {
    height: 9px;
    animation-delay: 0.4s;
  }
  @keyframes soundwave {
    0%, 100% {
      transform: scaleY(0.4);
    }
    50% {
      transform: scaleY(1.3);
    }
  }
</style>
