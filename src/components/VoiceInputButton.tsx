"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ParsedTransaction } from '@/lib/ai/types';
import AIOfflineDialog from './AIOfflineDialog';
import AITransactionModal from './AITransactionModal';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VoiceInputButtonProps {
  onPrefillForm?: (data: {
    amount: string;
    categoryId: string;
    note: string;
    date: string;
    transactionType: 'expense' | 'income';
  }) => void;
  /** Compact pill mode — for inline placement inside forms */
  compact?: boolean;
}

type RecordingState = 'idle' | 'checking' | 'recording' | 'processing' | 'done' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Browser SpeechRecognition type shims (not in all TS lib.dom versions)
// ─────────────────────────────────────────────────────────────────────────────

interface ISpeechRecognitionResult {
  readonly [index: number]: { readonly transcript: string; readonly confidence: number };
  readonly isFinal: boolean;
  readonly length: number;
}

interface ISpeechRecognitionResultList {
  readonly [index: number]: ISpeechRecognitionResult;
  readonly length: number;
}

interface ISpeechRecognitionEvent extends Event {
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check helper (client calls /api/ai/health)
// ─────────────────────────────────────────────────────────────────────────────

async function checkHealth(): Promise<boolean> {
  const res = await fetch('/api/ai/health');
  if (!res.ok) return false;
  const data = await res.json();
  return data?.online === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceInputButton({ onPrefillForm, compact = false }: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [transcript, setTranscript] = useState('');
  // Fallback textarea mode for unsupported browsers
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackText, setFallbackText] = useState('');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Check SpeechRecognition support AFTER hydration (client-only)
  useEffect(() => {
    setIsBrowserSupported(
      typeof window !== 'undefined' &&
      (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
    );
  }, []);

  // Lock body scroll when fallback mode is active
  useEffect(() => {
    if (fallbackMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fallbackMode]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Send transcript to API ──────────────────────────────────────────────────
  const parseTranscript = useCallback(async (text: string) => {
    if (!text.trim()) {
      setState('error');
      setParseError('Tidak ada suara yang terdeteksi. Coba lagi.');
      setModalOpen(true);
      return;
    }

    setTranscript(text);
    setState('processing');
    setParseError(null);
    setParsedResult(null);
    setModalOpen(true);

    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Server error ${res.status}`);
      }

      const data: ParsedTransaction = await res.json();
      setParsedResult(data);
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses suara';
      setParseError(msg);
      setState('error');
    }
  }, []);

  // ── Start recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setFallbackMode(true);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setState('recording');

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      recognition.stop();
      parseTranscript(text);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // Try fallback language en-US if id-ID not found
      if (event.error === 'language-not-supported' || event.error === 'no-speech') {
        recognition.lang = 'en-US';
        recognition.start();
        return;
      }
      setState('error');
      setParseError('Mikrofon tidak dapat diakses. Pastikan izin mikrofon sudah diberikan.');
      setModalOpen(true);
    };

    recognition.onend = () => {
      if (state === 'recording') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    setState('checking');
    recognition.start();
  }, [parseTranscript, state]);

  // ── Handle button press ─────────────────────────────────────────────────────
  const handlePress = useCallback(async () => {
    if (state !== 'idle') return;

    // If fallback mode, open textarea directly
    if (fallbackMode) {
      setFallbackMode(true);
      return;
    }

    setState('checking');
    try {
      const online = await checkHealth();
      if (!online) {
        setState('idle');
        setOfflineOpen(true);
        return;
      }
      startRecording();
    } catch {
      setState('idle');
      setOfflineOpen(true);
    }
  }, [state, fallbackMode, startRecording]);

  // ── Retry health check ──────────────────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const online = await checkHealth();
      if (online) {
        setOfflineOpen(false);
        startRecording();
      }
    } finally {
      setIsRetrying(false);
    }
  }, [startRecording]);

  // ── Submit fallback text ────────────────────────────────────────────────────
  const handleFallbackSubmit = useCallback(async () => {
    if (!fallbackText.trim()) return;
    setFallbackMode(false);

    setState('checking');
    const online = await checkHealth().catch(() => false);
    if (!online) {
      setState('idle');
      setOfflineOpen(true);
      return;
    }

    parseTranscript(fallbackText);
    setFallbackText('');
  }, [fallbackText, parseTranscript]);

  // ── Modal close ─────────────────────────────────────────────────────────────
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setState('idle');
    setParsedResult(null);
    setParseError(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  const isActive = state === 'recording';
  const isProcessing = state === 'checking' || state === 'processing';

  // ── Compact pill render ─────────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <button
          id="voice-input-btn-compact"
          onClick={handlePress}
          disabled={isProcessing}
          aria-label="Input transaksi dengan suara"
          className={`
            relative flex items-center gap-2 px-5 py-2.5 rounded-full border
            transition-all duration-200 cursor-pointer disabled:cursor-wait
            overflow-hidden group active:scale-95
            ${
              isActive
                ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/25'
                : isProcessing
                ? 'bg-primary/10 text-primary border-primary/20 opacity-70'
                : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40'
            }
          `}
        >
          {/* Pulse ring when recording */}
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.2s' }} />
          )}
          <span
            className={`material-symbols-outlined text-base relative z-10 ${
              isActive || isProcessing ? 'animate-pulse' : ''
            }`}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {isProcessing ? 'progress_activity' : 'mic'}
          </span>
          <span className="relative z-10 text-xs font-bold tracking-wide">
            {isActive ? 'Mendengarkan...' : isProcessing ? 'Memproses...' : 'Input Suara'}
          </span>
          {isActive && (
            <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-on-primary/80 animate-pulse" />
          )}
        </button>

        {/* Fallback, offline dialog, modal — same as full mode */}
        {fallbackMode && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFallbackMode(false)} />
            <div className="relative w-full max-w-sm bg-surface-container-low rounded-3xl p-6 shadow-2xl border border-outline-variant/20 animate-in slide-in-from-bottom-4">
              <h3 className="font-headline text-base font-bold text-on-surface mb-1">Ketik Transaksi</h3>
              <p className="font-body text-xs text-on-surface-variant mb-4">
                Browser Anda tidak mendukung input suara.
              </p>
              <textarea
                autoFocus
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder='Contoh: "Beli makan siang 25 ribu"'
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-3 text-sm text-on-surface resize-none outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setFallbackMode(false)} className="flex-1 py-3 rounded-2xl text-on-surface-variant text-sm border border-outline-variant/20 cursor-pointer">Batal</button>
                <button onClick={handleFallbackSubmit} disabled={!fallbackText.trim()} className="flex-1 py-3 rounded-2xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 cursor-pointer">Proses AI</button>
              </div>
            </div>
          </div>
        )}
        <AIOfflineDialog open={offlineOpen} onClose={() => { setOfflineOpen(false); setState('idle'); }} onRetry={handleRetry} isRetrying={isRetrying} />
        <AITransactionModal open={modalOpen} result={parsedResult} isLoading={state === 'processing' || state === 'checking'} error={parseError} onClose={handleModalClose} onEditInForm={onPrefillForm} />
      </>
    );
  }

  // ── Full card render ────────────────────────────────────────────────────────
  return (
    <>
      {/* Main button */}
      <button
        id="voice-input-btn"
        onClick={handlePress}
        disabled={isProcessing || state === 'done'}
        aria-label="Input transaksi dengan suara"
        className={`
          relative flex flex-col items-center justify-center gap-2 w-full h-full min-h-[80px]
          rounded-2xl border transition-all duration-200 cursor-pointer
          disabled:cursor-wait overflow-hidden group
          ${isActive
            ? 'bg-primary/15 border-primary/40 shadow-lg shadow-primary/20'
            : isProcessing
            ? 'bg-surface-container-low border-outline-variant/20 opacity-70'
            : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-primary/5 hover:border-primary/30 active:scale-[0.97]'
          }
        `}
      >
        {/* Pulse animation rings when recording */}
        {isActive && (
          <>
            <div ref={pulseRef} className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
          </>
        )}

        {/* Icon area */}
        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isActive ? 'bg-primary shadow-lg shadow-primary/30 scale-110' : 'bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105'
        }`}>
          {isProcessing ? (
            <span className="material-symbols-outlined text-primary text-xl animate-spin">
              progress_activity
            </span>
          ) : (
            <span className={`material-symbols-outlined text-xl transition-colors ${isActive ? 'text-on-primary' : 'text-primary'}`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              mic
            </span>
          )}
        </div>

        {/* Label */}
        <div className="relative z-10 text-center">
          <p className={`font-label text-xs font-bold tracking-wide ${
            isActive ? 'text-primary' : 'text-on-surface'
          }`}>
            {isActive ? 'Mendengarkan...' : isProcessing ? 'Memproses...' : 'Input Suara'}
          </p>
          {!isActive && !isProcessing && (
            <p className="font-label text-[10px] text-on-surface-variant/60 mt-0.5">
              {isBrowserSupported ? 'Ketuk & bicara' : 'Ketik teks'}
            </p>
          )}
        </div>

        {/* Recording indicator dot */}
        {isActive && (
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-error animate-pulse" />
        )}
      </button>

      {/* Fallback textarea dialog */}
      {fallbackMode && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFallbackMode(false)} />
          <div className="relative w-full max-w-sm bg-surface-container-low rounded-3xl p-6 shadow-2xl border border-outline-variant/20 animate-in slide-in-from-bottom-4">
            <h3 className="font-headline text-base font-bold text-on-surface mb-1">Ketik Transaksi</h3>
            <p className="font-body text-xs text-on-surface-variant mb-4">
              Browser Anda tidak mendukung input suara. Ketikkan transaksi secara manual.
            </p>
            <textarea
              autoFocus
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder='Contoh: "Beli makan siang 25 ribu" atau "Gajian 5 juta"'
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-3 text-sm text-on-surface resize-none outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFallbackMode(false)}
                className="flex-1 py-3 rounded-2xl text-on-surface-variant text-sm font-medium border border-outline-variant/20 hover:bg-surface-container cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleFallbackSubmit}
                disabled={!fallbackText.trim()}
                className="flex-1 py-3 rounded-2xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 cursor-pointer hover:opacity-90"
              >
                Proses AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline dialog */}
      <AIOfflineDialog
        open={offlineOpen}
        onClose={() => { setOfflineOpen(false); setState('idle'); }}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />

      {/* Result modal */}
      <AITransactionModal
        open={modalOpen}
        result={parsedResult}
        isLoading={state === 'processing' || state === 'checking'}
        error={parseError}
        onClose={handleModalClose}
        onEditInForm={onPrefillForm}
      />

      {/* Show transcript preview */}
      {transcript && state === 'done' && (
        <p className="text-[10px] text-on-surface-variant/50 text-center mt-1 truncate px-2">
          &quot;{transcript}&quot;
        </p>
      )}
    </>
  );
}
