'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThemeId =
  | 'slate-dark'
  | 'slate-light'
  | 'emerald-dark'
  | 'rose-dark'
  | 'violet-dark'
  | 'amber-light'
  | 'ocean-dark'
  | 'forest-dark'
  | 'sunset-light'
  | 'arctic-light'
  | 'lavender-light'
  | 'cherry-blossom'
  | 'pink-leopard';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  mode: 'dark' | 'light';
  isExclusive: boolean;
  /** Preview dot colors: [primary, surface, secondary] */
  preview: [string, string, string];
}

interface ThemeContextValue {
  currentTheme: ThemeId;
  availableThemes: (ThemeMeta & { unlocked: boolean })[];
  allowedExclusiveIds: string[];
  setTheme: (id: ThemeId) => void;
}

// ── Theme registry ────────────────────────────────────────────────────────────

export const ALL_THEMES: ThemeMeta[] = [
  {
    id: 'slate-dark',
    name: 'Slate Dark',
    mode: 'dark',
    isExclusive: false,
    preview: ['#adc6ff', '#0b1326', '#4edea3'],
  },
  {
    id: 'slate-light',
    name: 'Slate Light',
    mode: 'light',
    isExclusive: false,
    preview: ['#005ac2', '#f8fafc', '#006c4c'],
  },
  {
    id: 'emerald-dark',
    name: 'Emerald Night',
    mode: 'dark',
    isExclusive: false,
    preview: ['#6ee7b7', '#071812', '#67e8f9'],
  },
  {
    id: 'rose-dark',
    name: 'Rose Dusk',
    mode: 'dark',
    isExclusive: false,
    preview: ['#fda4af', '#170407', '#fdba74'],
  },
  {
    id: 'violet-dark',
    name: 'Violet Void',
    mode: 'dark',
    isExclusive: false,
    preview: ['#c4b5fd', '#0c0818', '#7dd3fc'],
  },
  {
    id: 'amber-light',
    name: 'Amber Day',
    mode: 'light',
    isExclusive: false,
    preview: ['#b45309', '#fffbf0', '#047857'],
  },
  {
    id: 'ocean-dark',
    name: 'Ocean Deep',
    mode: 'dark',
    isExclusive: false,
    preview: ['#7dd3fc', '#040b18', '#6ee7b7'],
  },
  {
    id: 'forest-dark',
    name: 'Forest',
    mode: 'dark',
    isExclusive: false,
    preview: ['#86efac', '#060f07', '#fde68a'],
  },
  {
    id: 'sunset-light',
    name: 'Sunset',
    mode: 'light',
    isExclusive: false,
    preview: ['#c2410c', '#fff8f5', '#be185d'],
  },
  {
    id: 'arctic-light',
    name: 'Arctic',
    mode: 'light',
    isExclusive: false,
    preview: ['#0369a1', '#f0f8ff', '#0e7490'],
  },
  {
    id: 'lavender-light',
    name: 'Lavender',
    mode: 'light',
    isExclusive: false,
    preview: ['#6d28d9', '#faf5ff', '#be185d'],
  },
  // ── Exclusive ──
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    mode: 'light',
    isExclusive: true,
    preview: ['#db2777', '#fff0f7', '#e11d48'],
  },
  {
    id: 'pink-leopard',
    name: 'Pink Leopard',
    mode: 'light',
    isExclusive: true,
    preview: ['#e91e8c', '#fff5fb', '#c6963a'],
  },
];

const EXCLUSIVE_IDS = ALL_THEMES.filter((t) => t.isExclusive).map((t) => t.id);

// ── Helper ────────────────────────────────────────────────────────────────────

/** Apply the theme class to <html> without re-rendering */
function applyThemeClass(id: ThemeId) {
  const el = document.documentElement;
  // Remove any existing theme classes
  const toRemove = [...el.classList].filter(
    (c) => c === 'dark' || c.startsWith('theme-')
  );
  toRemove.forEach((c) => el.classList.remove(c));

  if (id === 'slate-dark') {
    el.classList.add('dark');
  } else if (id !== 'slate-light') {
    el.classList.add(`theme-${id}`);
  }
  // slate-light → no class needed (bare :root vars)
}

// ── Context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: 'slate-dark',
  availableThemes: ALL_THEMES.map((t) => ({ ...t, unlocked: !t.isExclusive })),
  allowedExclusiveIds: [],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('slate-dark');
  const [allowedExclusiveIds, setAllowedExclusiveIds] = useState<string[]>([]);

  // ── 1. Sync state with what the no-FOUC script already applied ──
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeId | null) ?? 'slate-dark';
    setCurrentTheme(saved);
    // Ensure the class is also correct (handles edge cases)
    applyThemeClass(saved);
  }, []);

  // ── 2. Fetch allowed exclusive themes (only for logged-in users) ──
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.allowed_themes && Array.isArray(data.allowed_themes)) {
          const ids: string[] = data.allowed_themes;
          setAllowedExclusiveIds(ids);

          // ── Auto-switch: jika tema aktif eksklusif & akses dicabut ──
          const activeId = (localStorage.getItem('theme') as ThemeId | null) ?? 'slate-dark';
          const activeMeta = ALL_THEMES.find((t) => t.id === activeId);
          if (activeMeta?.isExclusive && !ids.includes(activeId)) {
            // Fallback ke slate-dark (tema default pertama)
            applyThemeClass('slate-dark');
            localStorage.setItem('theme', 'slate-dark');
            setCurrentTheme('slate-dark');
          }
        }
      })
      .catch(() => {
        // Guest atau network error — tidak ada tema eksklusif
      });
  }, []);

  // ── setTheme ──────────────────────────────────────────────────────
  const setTheme = useCallback((id: ThemeId) => {
    applyThemeClass(id);
    localStorage.setItem('theme', id);
    setCurrentTheme(id);
  }, []);

  // ── Derived: augment themes with unlocked flag ────────────────────
  const availableThemes = useMemo(
    () =>
      ALL_THEMES.map((t) => ({
        ...t,
        unlocked: !t.isExclusive || allowedExclusiveIds.includes(t.id),
      })),
    [allowedExclusiveIds]
  );

  return (
    <ThemeContext.Provider
      value={{ currentTheme, availableThemes, allowedExclusiveIds, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
