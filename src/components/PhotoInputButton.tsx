"use client";
import React, { useState, useCallback, useRef } from 'react';
import type { ParsedTransaction } from '@/lib/ai/types';
import AIOfflineDialog from './AIOfflineDialog';
import AITransactionModal from './AITransactionModal';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PhotoInputButtonProps {
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

type PhotoState = 'idle' | 'checking' | 'processing' | 'done' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Image compression utility (canvas-based)
// ─────────────────────────────────────────────────────────────────────────────

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
      if (!ctx) return reject(new Error('Canvas context not available'));

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

// ─────────────────────────────────────────────────────────────────────────────
// Health check helper
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

export default function PhotoInputButton({ onPrefillForm, compact = false }: PhotoInputButtonProps) {
  const [photoState, setPhotoState] = useState<PhotoState>('idle');
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Process selected file ───────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setParseError('File harus berupa gambar (JPEG, PNG, atau WebP).');
      setPhotoState('error');
      setModalOpen(true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError('Ukuran file terlalu besar. Maksimal 10MB.');
      setPhotoState('error');
      setModalOpen(true);
      return;
    }

    // Show preview
    const previewObjectUrl = URL.createObjectURL(file);
    setPreviewUrl(previewObjectUrl);

    setPhotoState('processing');
    setParseError(null);
    setParsedResult(null);
    setModalOpen(true);
    setUploadProgress(20);

    try {
      // Compress image on client
      const { base64, mimeType } = await compressImage(file);
      setUploadProgress(60);

      // Send to API
      const res = await fetch('/api/ai/parse-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      setUploadProgress(90);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Server error ${res.status}`);
      }

      const data: ParsedTransaction = await res.json();
      setParsedResult(data);
      setPhotoState('done');
      setUploadProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses foto';
      setParseError(msg);
      setPhotoState('error');
    } finally {
      // Revoke preview URL to free memory
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewUrl(null);
      setUploadProgress(0);
    }
  }, []);

  // ── Handle button tap ───────────────────────────────────────────────────────
  const handlePress = useCallback(async () => {
    if (photoState !== 'idle') return;

    setPhotoState('checking');
    try {
      const online = await checkHealth();
      if (!online) {
        setPhotoState('idle');
        setOfflineOpen(true);
        return;
      }
      // Open file picker
      fileInputRef.current?.click();
      setPhotoState('idle');
    } catch {
      setPhotoState('idle');
      setOfflineOpen(true);
    }
  }, [photoState]);

  // ── Retry health check ──────────────────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const online = await checkHealth();
      if (online) {
        setOfflineOpen(false);
        fileInputRef.current?.click();
      }
    } finally {
      setIsRetrying(false);
    }
  }, []);

  // ── File input change ───────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so same file can be picked again
      e.target.value = '';
      processFile(file);
    },
    [processFile]
  );

  // ── Modal close ─────────────────────────────────────────────────────────────
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setPhotoState('idle');
    setParsedResult(null);
    setParseError(null);
    setUploadProgress(0);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  const isProcessing = photoState === 'checking' || photoState === 'processing';

  // ── Compact pill render ─────────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
        <button
          id="photo-input-btn-compact"
          onClick={handlePress}
          disabled={isProcessing}
          aria-label="Scan struk atau nota dengan kamera"
          className={`
            relative flex items-center gap-2 px-5 py-2.5 rounded-full border
            transition-all duration-200 cursor-pointer disabled:cursor-wait
            overflow-hidden group active:scale-95
            ${
              isProcessing
                ? 'bg-secondary/10 text-secondary border-secondary/20 opacity-70'
                : 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40'
            }
          `}
        >
          {/* Shimmer when processing */}
          {isProcessing && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/15 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          )}
          <span className={`material-symbols-outlined text-base relative z-10 ${ isProcessing ? 'animate-spin' : '' }`}>
            {isProcessing ? 'progress_activity' : 'camera_alt'}
          </span>
          <span className="relative z-10 text-xs font-bold tracking-wide">
            {isProcessing
              ? uploadProgress > 0 ? `Menganalisis ${uploadProgress}%` : 'Memproses...'
              : 'Scan Struk'}
          </span>
          {/* Mini progress bar */}
          {isProcessing && uploadProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/20 rounded-full">
              <div className="h-full bg-secondary transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </button>
        <AIOfflineDialog open={offlineOpen} onClose={() => { setOfflineOpen(false); setPhotoState('idle'); }} onRetry={handleRetry} isRetrying={isRetrying} />
        <AITransactionModal open={modalOpen} result={parsedResult} isLoading={photoState === 'processing' || photoState === 'checking'} error={parseError} onClose={handleModalClose} onEditInForm={onPrefillForm} />
      </>
    );
  }

  // ── Full card render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* Main button */}
      <button
        id="photo-input-btn"
        onClick={handlePress}
        disabled={isProcessing}
        aria-label="Scan struk atau nota dengan kamera"
        className={`
          relative flex flex-col items-center justify-center gap-2 w-full h-full min-h-[80px]
          rounded-2xl border transition-all duration-200 cursor-pointer
          disabled:cursor-wait overflow-hidden group
          ${isProcessing
            ? 'bg-surface-container-low border-outline-variant/20 opacity-70'
            : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-secondary/5 hover:border-secondary/30 active:scale-[0.97]'
          }
        `}
      >
        {/* Shimmer effect when processing */}
        {isProcessing && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
        )}

        {/* Icon area */}
        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isProcessing ? 'bg-secondary/10' : 'bg-secondary/10 group-hover:bg-secondary/20 group-hover:scale-105'
        }`}>
          {isProcessing ? (
            <span className="material-symbols-outlined text-secondary text-xl animate-spin">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>
              camera_alt
            </span>
          )}
        </div>

        {/* Label */}
        <div className="relative z-10 text-center">
          <p className="font-label text-xs font-bold tracking-wide text-on-surface">
            {isProcessing ? 'Memproses...' : 'Scan Struk'}
          </p>
          <p className="font-label text-[10px] text-on-surface-variant/60 mt-0.5">
            {isProcessing
              ? uploadProgress > 0 ? `${uploadProgress}%` : 'Menganalisis...'
              : 'Foto atau galeri'
            }
          </p>
        </div>

        {/* Progress bar */}
        {isProcessing && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-container">
            <div
              className="h-full bg-secondary transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </button>

      {/* Offline dialog */}
      <AIOfflineDialog
        open={offlineOpen}
        onClose={() => { setOfflineOpen(false); setPhotoState('idle'); }}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />

      {/* Result modal */}
      <AITransactionModal
        open={modalOpen}
        result={parsedResult}
        isLoading={photoState === 'processing' || photoState === 'checking'}
        error={parseError}
        onClose={handleModalClose}
        onEditInForm={onPrefillForm}
      />
    </>
  );
}
