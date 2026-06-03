"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store/useStore";

// ── Canvas-based image compress to 256×256 WebP ──────────────────────────────
async function compressAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const SIZE = 256;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Cover crop: center the image
      const { naturalWidth: w, naturalHeight: h } = img;
      const ratio = Math.max(SIZE / w, SIZE / h);
      const scaledW = w * ratio;
      const scaledH = h * ratio;
      const offsetX = (SIZE - scaledW) / 2;
      const offsetY = (SIZE - scaledH) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(blob);
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";
  const currentAvatar = user?.user_metadata?.avatar_url as string | undefined;

  const [fullName, setFullName] = useState(currentName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar ?? null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(currentName);
      setPreviewUrl(currentAvatar ?? null);
      setPendingBlob(null);
      setIsSaving(false);
    }
  }, [isOpen, currentName, currentAvatar]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    // Validate size (5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      return;
    }

    try {
      const compressed = await compressAvatar(file);
      const localUrl = URL.createObjectURL(compressed);
      setPreviewUrl(localUrl);
      setPendingBlob(compressed);
    } catch {
      toast.error("Gagal memproses gambar.");
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl: string | undefined;

      // Upload photo if there's a new one
      if (pendingBlob) {
        const supabase = createClient();
        const filePath = `${user.id}/avatar.webp`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, pendingBlob, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        // Bust cache by appending timestamp
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      await updateProfile({
        full_name: fullName.trim(),
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      });

      toast.success("Profil berhasil diperbarui!");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(`Gagal menyimpan: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || typeof window === "undefined") return null;

  const avatarContent =
    previewUrl ? (
      <Image
        src={previewUrl}
        alt="Avatar preview"
        fill
        className="object-cover"
        unoptimized // blob URLs and cache-busted URLs bypass Next.js image optimizer
      />
    ) : (
      <span className="text-on-surface font-extrabold text-4xl select-none">
        {user?.email?.charAt(0).toUpperCase() ?? "U"}
      </span>
    );

  const modal = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] flex flex-col max-h-[92dvh] animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
          <h2 className="font-headline font-bold text-base text-on-surface">Edit Profil</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 space-y-6 flex-1">

          {/* ── Avatar Section ── */}
          <div className="flex flex-col items-center gap-4">
            {/* Avatar ring + preview */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
                <button
                  type="button"
                  onClick={() => previewUrl && setIsLightboxOpen(true)}
                  className={`w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative ${previewUrl ? "cursor-zoom-in" : "cursor-default"}`}
                  title={previewUrl ? "Lihat foto" : undefined}
                >
                  {avatarContent}
                </button>
              </div>
              {/* Change photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                title="Ganti foto"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Ganti Foto Profil
            </button>
          </div>

          {/* ── Name Input ── */}
          <div className="space-y-2">
            <label
              htmlFor="edit-profile-name"
              className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70"
            >
              Nama Tampilan
            </label>
            <input
              id="edit-profile-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama kamu..."
              maxLength={50}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 shadow-sm transition-all font-medium outline-none"
            />
            <p className="text-[10px] text-on-surface-variant/40 text-right pr-1">
              {fullName.length}/50
            </p>
          </div>

          {/* ── Email (read-only) ── */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
              Email
            </label>
            <div className="w-full bg-surface-container-lowest/50 border border-outline-variant/10 rounded-2xl py-3.5 px-4 text-on-surface-variant font-medium text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-on-surface-variant/50">lock</span>
              {user?.email ?? "—"}
            </div>
            <p className="text-[10px] text-on-surface-variant/40 pl-1">
              Email tidak dapat diubah
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-4 flex gap-3 flex-shrink-0 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-full border border-outline-variant/20 text-on-surface font-bold text-sm hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !fullName.trim()}
            className="flex-1 py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {isLightboxOpen && previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            onClick={() => setIsLightboxOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div
            className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewUrl}
              alt="Avatar besar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
}
