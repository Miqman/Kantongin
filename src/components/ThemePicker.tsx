'use client';

import React from 'react';
import { useTheme, type ThemeMeta } from '@/context/ThemeContext';

// ── Mini color swatch preview ─────────────────────────────────────────────────

function ThemePreview({ colors, mode }: { colors: [string, string, string]; mode: 'dark' | 'light' }) {
  const [primary, surface, secondary] = colors;
  return (
    <div
      className="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 relative overflow-hidden"
      style={{ backgroundColor: surface, border: `1px solid ${primary}22` }}
    >
      {/* Background shimmer for dark themes */}
      {mode === 'dark' && (
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at 70% 30%, ${primary}60, transparent 70%)` }}
        />
      )}
      {/* Color dots */}
      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: primary }} />
      <div className="w-3 h-3 rounded-full shadow-sm opacity-80" style={{ backgroundColor: secondary }} />
      <div
        className="w-2.5 h-2.5 rounded-full shadow-sm opacity-60"
        style={{ backgroundColor: primary, filter: 'brightness(1.4)' }}
      />
    </div>
  );
}

// ── Single theme card ─────────────────────────────────────────────────────────

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: ThemeMeta & { unlocked: boolean };
  isActive: boolean;
  onSelect: () => void;
}) {
  const [primary] = theme.preview;

  return (
    <button
      type="button"
      onClick={theme.unlocked ? onSelect : undefined}
      className={`
        relative flex flex-col gap-2 p-2.5 rounded-2xl border transition-all duration-200
        ${isActive
          ? 'border-primary/70 shadow-md ring-2 ring-primary/30 bg-primary/5'
          : theme.unlocked
            ? 'border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container cursor-pointer'
            : 'border-outline-variant/10 opacity-50 cursor-not-allowed bg-surface-container-lowest/50'
        }
      `}
      aria-label={`Tema ${theme.name}${!theme.unlocked ? ' (terkunci)' : ''}`}
      aria-pressed={isActive}
    >
      {/* Preview */}
      <ThemePreview colors={theme.preview} mode={theme.mode} />

      {/* Name row */}
      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="text-[11px] font-semibold text-on-surface leading-tight truncate">
          {theme.name}
        </span>

        {/* Status icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {theme.isExclusive && (
            <span
              className="text-[9px] leading-none"
              title="Tema Eksklusif"
            >
              ⭐
            </span>
          )}
          {isActive && (
            <span
              className="material-symbols-outlined text-[13px] leading-none"
              style={{ color: primary, fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          {!theme.unlocked && (
            <span className="material-symbols-outlined text-[13px] leading-none text-on-surface-variant/50">
              lock
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main ThemePicker ──────────────────────────────────────────────────────────

export default function ThemePicker() {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  const defaultThemes = availableThemes.filter((t) => !t.isExclusive);
  const exclusiveThemes = availableThemes.filter((t) => t.isExclusive);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-0.5">
        <span className="material-symbols-outlined text-primary text-xl">palette</span>
        <div>
          <p className="font-semibold text-sm text-on-surface">Tema Aplikasi</p>
          <p className="text-[11px] text-on-surface-variant/70">
            {availableThemes.find((t) => t.id === currentTheme)?.name ?? 'Slate Dark'}
          </p>
        </div>
      </div>

      {/* Default themes grid */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-2 ml-0.5">
          Default
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {defaultThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Exclusive themes */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 ml-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            Eksklusif
          </span>
          <span className="text-[10px]">⭐</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {exclusiveThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
        {exclusiveThemes.every((t) => !t.unlocked) && (
          <p className="text-[11px] text-on-surface-variant/50 mt-2 ml-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Tema eksklusif hanya tersedia untuk akun tertentu.
          </p>
        )}
      </div>
    </div>
  );
}
