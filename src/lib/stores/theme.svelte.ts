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
  preview: [string, string, string];
}

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
    preview: ['#86efac', '#051b11', '#a7f3d0'],
  },
  {
    id: 'sunset-light',
    name: 'Sunset Glow',
    mode: 'light',
    isExclusive: false,
    preview: ['#ea580c', '#fffaf5', '#0284c7'],
  },
  {
    id: 'arctic-light',
    name: 'Arctic Frost',
    mode: 'light',
    isExclusive: false,
    preview: ['#0284c7', '#f0f9ff', '#059669'],
  },
  {
    id: 'lavender-light',
    name: 'Lavender Mist',
    mode: 'light',
    isExclusive: false,
    preview: ['#7c3aed', '#faf5ff', '#db2777'],
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    mode: 'light',
    isExclusive: false,
    preview: ['#db2777', '#fff1f2', '#059669'],
  },
  {
    id: 'pink-leopard',
    name: 'Pink Leopard',
    mode: 'light',
    isExclusive: false,
    preview: ['#e91e8c', '#fff5f8', '#c6963a'],
  },
];

class ThemeStore {
  currentTheme = $state<ThemeId>('slate-dark');
  allowedExclusiveIds = $state<string[]>([]);

  availableThemes = $derived(
    ALL_THEMES.map((theme) => ({
      ...theme,
      unlocked: !theme.isExclusive || this.allowedExclusiveIds.includes(theme.id),
    }))
  );

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeId | null;
      if (saved && ALL_THEMES.some((t) => t.id === saved)) {
        this.currentTheme = saved;
      }
      this.applyThemeClass(this.currentTheme);
    }
  }

  applyThemeClass(themeId: ThemeId) {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const toRemove = Array.from(el.classList).filter(
      (c) => c === 'dark' || c.startsWith('theme-')
    );
    toRemove.forEach((c) => el.classList.remove(c));

    if (themeId === 'slate-dark') {
      el.classList.add('dark');
    } else if (themeId !== 'slate-light') {
      el.classList.add(`theme-${themeId}`);
    }
  }

  setTheme(themeId: ThemeId) {
    const meta = ALL_THEMES.find((t) => t.id === themeId);
    if (meta?.isExclusive && !this.allowedExclusiveIds.includes(themeId)) {
      return;
    }

    this.currentTheme = themeId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', themeId);
    }
    this.applyThemeClass(themeId);
  }

  async fetchEntitlements() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        this.allowedExclusiveIds = data.allowed_themes ?? [];
      }
    } catch {
      // Ignored
    }
  }
}

export const themeStore = new ThemeStore();

