"use client";
import React from 'react';

interface AIOfflineDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function AIOfflineDialog({
  open,
  onClose,
  onRetry,
  isRetrying = false,
}: AIOfflineDialogProps) {
  // Lock body scroll when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-offline-title"
    >
      {/* Dimmed overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-sm bg-surface-container-low rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-tertiary via-error to-tertiary" />

        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-3xl">
              cloud_off
            </span>
          </div>

          {/* Title */}
          <h2
            id="ai-offline-title"
            className="font-headline text-lg font-bold text-on-surface text-center mb-2"
          >
            Fitur AI Tidak Tersedia
          </h2>

          {/* Body */}
          <p className="font-body text-sm text-on-surface-variant text-center mb-1">
            Layanan AI sedang tidak dapat digunakan saat ini.
          </p>
          <p className="font-body text-xs text-on-surface-variant/70 text-center mb-6">
            Silakan hubungi developer jika masalah ini berlanjut.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              id="ai-offline-retry-btn"
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-headline font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait cursor-pointer flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  Memeriksa...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">
                    refresh
                  </span>
                  Coba Lagi
                </>
              )}
            </button>

            <button
              id="ai-offline-close-btn"
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-on-surface-variant font-body text-sm font-medium hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
