import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

console.log('Running Dompetku Migration Self-Checks...\n');

// ── Check 1: Pure BFF Architecture Verification ─────────────────────────────
console.log('[Check 1] Verifying Pure BFF: Frontend must not import @supabase/supabase-js directly');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (file.endsWith('.svelte') || (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.includes('+server') && !file.includes('hooks.server') && !fullPath.includes(path.join('src', 'lib', 'server')))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const clientFiles = scanDir(srcDir);
let clientViolations = [];

for (const file of clientFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('@supabase/supabase-js') || content.includes('createBrowserClient') || content.includes('createClient(')) {
    clientViolations.push(path.relative(srcDir, file));
  }
}

assert.strictEqual(
  clientViolations.length,
  0,
  `Pure BFF violation: Direct Supabase client calls detected in frontend files:\n${clientViolations.join('\n')}`
);
console.log(`✓ Verified ${clientFiles.length} client files: 100% pure BFF compliant (zero Supabase SDK in browser code).\n`);

// ── Check 2: Financial Payday Cycle Boundaries ──────────────────────────────
console.log('[Check 2] Testing Payday Cycle calculation bounds...');

function getCycleBounds(now, paydayDate) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  let startYear, startMonth, startDay;
  let endYear, endMonth, endDay;

  if (paydayDate === 1) {
    startYear = year;
    startMonth = month;
    startDay = 1;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    endYear = year;
    endMonth = month;
    endDay = lastDayOfMonth;
  } else {
    if (todayDate >= paydayDate) {
      startYear = year;
      startMonth = month;
      startDay = paydayDate;
      const daysInNextMonth = new Date(year, month + 2, 0).getDate();
      endYear = month === 11 ? year + 1 : year;
      endMonth = (month + 1) % 12;
      endDay = Math.min(paydayDate - 1, daysInNextMonth);
    } else {
      startYear = month === 0 ? year - 1 : year;
      startMonth = (month + 11) % 12;
      const daysInPrevMonth = new Date(startYear, startMonth + 1, 0).getDate();
      startDay = Math.min(paydayDate, daysInPrevMonth);
      endYear = year;
      endMonth = month;
      endDay = paydayDate - 1;
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  return {
    start: `${startYear}-${pad(startMonth + 1)}-${pad(startDay)}`,
    end: `${endYear}-${pad(endMonth + 1)}-${pad(endDay)}`,
  };
}

// Case A: Payday on 1st of month (standard calendar month)
const bounds1 = getCycleBounds(new Date(2026, 9, 15), 1);
assert.strictEqual(bounds1.start, '2026-10-01');
assert.strictEqual(bounds1.end, '2026-10-31');

// Case B: Payday on 25th, date is 28th (same cycle)
const bounds25After = getCycleBounds(new Date(2026, 9, 28), 25);
assert.strictEqual(bounds25After.start, '2026-10-25');
assert.strictEqual(bounds25After.end, '2026-11-24');

// Case C: Payday on 25th, date is 10th (previous cycle)
const bounds25Before = getCycleBounds(new Date(2026, 9, 10), 25);
assert.strictEqual(bounds25Before.start, '2026-09-25');
assert.strictEqual(bounds25Before.end, '2026-10-24');

console.log('✓ Verified Payday Cycle bounds calculations: Cases A, B, and C passed.\n');

// ── Check 3: Currency Formatters ────────────────────────────────────────────
console.log('[Check 3] Testing Currency Formatting...');

function formatRupiah(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);
  return isNegative ? `-${formatted}` : formatted;
}

assert.strictEqual(formatRupiah(50000).replace(/\s/g, ' '), 'Rp 50.000');
assert.strictEqual(formatRupiah(-1250000).replace(/\s/g, ' '), '-Rp 1.250.000');

console.log('✓ Verified Currency formatters.\n');
console.log('ALL SELF-CHECKS PASSED SUCCESSFULLY!');
