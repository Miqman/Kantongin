export type DateFilterMode = 'MONTH' | 'YEAR' | 'RANGE';

export interface DateFilterValue {
  mode: DateFilterMode;
  year?: number;
  month?: number; // 0-11
  from?: Date;
  to?: Date;
}

export function dateFilterToRange(f: DateFilterValue | null): { start?: string; end?: string } {
  if (!f) return {};

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (f.mode === 'RANGE') {
    return {
      start: f.from ? fmt(f.from) : undefined,
      end: f.to ? fmt(f.to) : undefined,
    };
  }
  if (f.mode === 'MONTH' && f.month !== undefined && f.year !== undefined) {
    const lastDay = new Date(f.year, f.month + 1, 0).getDate();
    return {
      start: `${f.year}-${pad(f.month + 1)}-01`,
      end: `${f.year}-${pad(f.month + 1)}-${pad(lastDay)}`,
    };
  }
  if (f.mode === 'YEAR' && f.year !== undefined) {
    return {
      start: `${f.year}-01-01`,
      end: `${f.year}-12-31`,
    };
  }
  return {};
}

class HistoryFiltersStore {
  searchQuery = $state('');
  dateFilter = $state<DateFilterValue | null>(null);
  categoryId = $state('ALL');
  type = $state<'ALL' | 'income' | 'expense'>('ALL');

  range = $derived(dateFilterToRange(this.dateFilter));

  reset() {
    this.searchQuery = '';
    this.dateFilter = null;
    this.categoryId = 'ALL';
    this.type = 'ALL';
  }
}

export const historyFilters = new HistoryFiltersStore();

