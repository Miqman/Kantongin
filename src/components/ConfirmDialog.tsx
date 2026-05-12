"use client";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  icon?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "primary",
  icon,
}: Props) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const confirmColors =
    variant === "danger"
      ? "bg-error text-on-error hover:opacity-90"
      : "bg-primary text-on-primary hover:opacity-90";

  const iconColors =
    variant === "danger"
      ? "bg-error/10 text-error"
      : "bg-primary/10 text-primary";

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={[
          "fixed z-[9999] bg-surface rounded-t-3xl shadow-2xl",
          // Mobile: bottom sheet full width
          "bottom-0 left-0 right-0",
          // Desktop: centered modal
          "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-full sm:max-w-sm sm:rounded-3xl",
        ].join(" ")}
      >
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center gap-4">
          {icon && (
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconColors}`}>
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
          )}
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-headline font-bold text-lg text-on-surface"
            >
              {title}
            </h2>
            {message && (
              <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full text-sm font-bold text-on-surface-variant border border-outline-variant/25 hover:bg-surface-container transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-3.5 rounded-full text-sm font-bold transition-opacity cursor-pointer shadow-sm ${confirmColors}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );

  return typeof window !== "undefined"
    ? ReactDOM.createPortal(content, document.body)
    : null;
}
