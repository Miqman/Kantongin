// ── Helper Siklus Keuangan / Payday Cycle ────────────────────────────────────

export interface CycleBounds {
  start: string;       // YYYY-MM-DD
  end: string;         // YYYY-MM-DD
  prevStart: string;   // YYYY-MM-DD
  prevEnd: string;     // YYYY-MM-DD
  startDate: Date;
  endDate: Date;
  label: string;       // e.g. "27 Agu - 26 Sep"
}

const ID_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Normalisasi string tanggal ke format YYYY-MM-DD
 */
export function normalizeDateStr(dStr: string): string {
  if (!dStr) return '';
  if (dStr.length >= 10 && dStr[4] === '-' && dStr[7] === '-') {
    return dStr.slice(0, 10);
  }
  try {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return dStr;
}

/**
 * Format rentang tanggal siklus menjadi label ringkas (misal: "27 Agu - 26 Sep")
 */
export function formatCycleLabel(start: Date, end: Date): string {
  const d1 = start.getDate();
  const m1 = ID_MONTHS[start.getMonth()];
  const d2 = end.getDate();
  const m2 = ID_MONTHS[end.getMonth()];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${d1} - ${d2} ${m1}`;
  }
  return `${d1} ${m1} - ${d2} ${m2}`;
}

/**
 * Menghitung tanggal awal dan akhir siklus berjalan serta siklus sebelumnya
 * berdasarkan tanggal gajian (cut-off).
 *
 * @param now Waktu saat ini (default: new Date())
 * @param paydayDay Tanggal gajian 1 - 31 (default: 27)
 */
export function getCycleBounds(now: Date = new Date(), paydayDay: number = 27): CycleBounds {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Pastikan payday valid 1-31
  const targetDay = Math.max(1, Math.min(31, Math.floor(paydayDay || 27)));

  const curDay = now.getDate();
  let startYear = now.getFullYear();
  let startMonth = now.getMonth();

  // Jika belum mencapai tanggal gajian di bulan ini,
  // berarti siklus berjalan berakar dari bulan sebelumnya
  if (curDay < targetDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  // Tanggal awal siklus ini
  const maxDaysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const actualStartDay = Math.min(targetDay, maxDaysInStartMonth);
  const startDate = new Date(startYear, startMonth, actualStartDay, 0, 0, 0, 0);

  // Tanggal awal siklus berikutnya
  let nextCycleYear = startYear;
  let nextCycleMonth = startMonth + 1;
  if (nextCycleMonth > 11) {
    nextCycleMonth = 0;
    nextCycleYear += 1;
  }
  const maxDaysInNextMonth = new Date(nextCycleYear, nextCycleMonth + 1, 0).getDate();
  const actualNextDay = Math.min(targetDay, maxDaysInNextMonth);
  const nextCycleStartDate = new Date(nextCycleYear, nextCycleMonth, actualNextDay, 0, 0, 0, 0);

  // Tanggal akhir siklus ini = 1 hari sebelum awal siklus berikutnya
  const endDate = new Date(nextCycleStartDate);
  endDate.setDate(endDate.getDate() - 1);

  // Tanggal awal siklus sebelumnya
  let prevCycleYear = startYear;
  let prevCycleMonth = startMonth - 1;
  if (prevCycleMonth < 0) {
    prevCycleMonth = 11;
    prevCycleYear -= 1;
  }
  const maxDaysInPrevMonth = new Date(prevCycleYear, prevCycleMonth + 1, 0).getDate();
  const actualPrevDay = Math.min(targetDay, maxDaysInPrevMonth);
  const prevStartDate = new Date(prevCycleYear, prevCycleMonth, actualPrevDay, 0, 0, 0, 0);

  // Tanggal akhir siklus sebelumnya = 1 hari sebelum startDate siklus ini
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  return {
    start: fmt(startDate),
    end: fmt(endDate),
    prevStart: fmt(prevStartDate),
    prevEnd: fmt(prevEndDate),
    startDate,
    endDate,
    label: formatCycleLabel(startDate, endDate),
  };
}
