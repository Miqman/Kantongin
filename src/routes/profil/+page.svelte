<script lang="ts">
  import { goto } from '$app/navigation';
  import { appStore } from '$lib/stores/app.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import TopAppBar from '$lib/components/common/TopAppBar.svelte';
  import BottomNavBar from '$lib/components/common/BottomNavBar.svelte';
  import GoogleSheetsCard from '$lib/components/settings/GoogleSheetsCard.svelte';
  import BudgetCard from '$lib/components/settings/BudgetCard.svelte';
  import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
  import PaydaySetting from '$lib/components/settings/PaydaySetting.svelte';
  import EditProfileModal from '$lib/components/settings/EditProfileModal.svelte';
  import { db } from '$lib/db/dexie';
  import type { Transaction } from '$lib/types';

  let isLoggingOut = $state(false);
  let isExportingCsv = $state(false);
  let isExportingPdf = $state(false);
  let isEditModalOpen = $state(false);
  let isAvatarLightboxOpen = $state(false);

  let dateRangeType = $state<'all' | 'this_month' | 'last_month' | 'last_30_days' | 'custom'>('all');
  let customStartDate = $state('');
  let customEndDate = $state('');

  const avatarUrl = $derived(
    appStore.user?.user_metadata?.avatar_url as string | undefined
  );

  const displayName = $derived(
    (appStore.user?.user_metadata?.full_name as string | undefined) ??
    appStore.user?.email?.split('@')[0] ??
    'Pengguna'
  );

  function getInitials(email: string): string {
    return email ? email.charAt(0).toUpperCase() : 'U';
  }

  async function handleLogout() {
    isLoggingOut = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      appStore.setUser(null);
      toast.success('Berhasil keluar');
      goto('/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Gagal keluar');
    } finally {
      isLoggingOut = false;
    }
  }

  function getDateRangeParams(): { start: string | null; end: string | null } {
    let start: string | null = null;
    let end: string | null = null;
    const today = new Date();
    const toISO = (d: Date) => d.toLocaleDateString('en-CA');

    if (dateRangeType === 'this_month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      start = toISO(new Date(y, m, 1));
      end = toISO(new Date(y, m + 1, 0));
    } else if (dateRangeType === 'last_month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      start = toISO(new Date(y, m - 1, 1));
      end = toISO(new Date(y, m, 0));
    } else if (dateRangeType === 'last_30_days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      start = toISO(past);
      end = toISO(today);
    } else if (dateRangeType === 'custom') {
      start = customStartDate || null;
      end = customEndDate || null;
    }

    return { start, end };
  }

  async function fetchTransactionsForExport(): Promise<Transaction[] | null> {
    const { start, end } = getDateRangeParams();

    if (dateRangeType === 'custom') {
      if (!start || !end) {
        toast.error('Silakan tentukan tanggal mulai dan selesai.');
        return null;
      }
      if (start > end) {
        toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
        return null;
      }
    }

    try {
      if (appStore.user) {
        let url = `/api/transactions?limit=10000`;
        if (start) url += `&start_date=${start}`;
        if (end) url += `&end_date=${end}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal mengambil data dari server');
        const json = await res.json();
        return json.data ?? [];
      } else {
        const txs = await db.transactions.toArray();
        const catData = await db.categories.toArray();
        const catMap = new Map(catData.map((c) => [c.id, c]));

        let filtered: Transaction[] = txs.map((tx) => ({
          ...tx,
          category: catMap.get(tx.category_id) ?? null,
        }));

        if (start) filtered = filtered.filter((tx) => tx.date >= start);
        if (end) filtered = filtered.filter((tx) => tx.date <= end);

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (err) {
      console.error('Error fetching transactions for export:', err);
      toast.error('Gagal mengambil data transaksi untuk diekspor.');
      return null;
    }
  }

  async function handleExportCsv() {
    isExportingCsv = true;
    try {
      const dataToExport = await fetchTransactionsForExport();
      if (!dataToExport) return;

      if (dataToExport.length === 0) {
        toast.error('Tidak ada data transaksi pada rentang tanggal ini.');
        return;
      }

      const header = ['Tanggal', 'Kategori', 'Catatan', 'Jumlah (Rp)', 'Tipe'];
      const rows = dataToExport.map((t) => [
        new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.category?.name ?? 'Tanpa Kategori',
        t.note ?? '',
        Math.abs(Number(t.amount)),
        Number(t.amount) < 0 ? 'Pemasukan' : 'Pengeluaran',
      ]);

      const csvContent =
        '\uFEFF' +
        [header, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const { start, end } = getDateRangeParams();
      const filenameSuffix = dateRangeType === 'all' ? 'semua' : `${start}_ke_${end}`;
      link.href = url;
      link.download = `uangmu-transaksi-${filenameSuffix}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV berhasil diunduh!');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Gagal mengekspor CSV.');
    } finally {
      isExportingCsv = false;
    }
  }

  async function handleExportPdf() {
    isExportingPdf = true;
    try {
      const dataToExport = await fetchTransactionsForExport();
      if (!dataToExport) return;

      if (dataToExport.length === 0) {
        toast.error('Tidak ada data transaksi pada rentang tanggal ini.');
        return;
      }

      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Dompetku – Laporan Transaksi', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);

      const { start, end } = getDateRangeParams();
      let rangeText = 'Semua Waktu';
      if (dateRangeType === 'this_month') rangeText = 'Bulan Ini';
      else if (dateRangeType === 'last_month') rangeText = 'Bulan Lalu';
      else if (dateRangeType === 'last_30_days') rangeText = '30 Hari Terakhir';
      else if (dateRangeType === 'custom' && start && end) {
        const formatIndo = (dStr: string) =>
          new Date(dStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        rangeText = `${formatIndo(start)} - ${formatIndo(end)}`;
      }

      doc.text(
        `Periode: ${rangeText}   |   Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        14,
        25
      );
      doc.setTextColor(0);

      const totalPemasukan = dataToExport
        .filter((t) => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const totalPengeluaran = dataToExport
        .filter((t) => Number(t.amount) >= 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      doc.setFontSize(9);
      doc.text(
        `Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}   |   Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`,
        14,
        31
      );

      const head = [['Tanggal', 'Kategori', 'Catatan', 'Tipe', 'Jumlah (Rp)']];
      const body = [...dataToExport]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((t) => [
          new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          t.category?.name ?? 'Tanpa Kategori',
          t.note ?? '-',
          Number(t.amount) < 0 ? 'Pemasukan' : 'Pengeluaran',
          Math.abs(Number(t.amount)).toLocaleString('id-ID'),
        ]);

      const foot = [
        [
          { content: 'TOTAL PENGELUARAN', colSpan: 4, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
          { content: `Rp ${totalPengeluaran.toLocaleString('id-ID')}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        ],
      ];

      autoTable(doc, {
        head,
        body,
        foot,
        startY: 36,
        showFoot: 'lastPage',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        footStyles: { fillColor: [232, 232, 250], textColor: [50, 50, 120], fontSize: 8.5 },
        columnStyles: { 4: { halign: 'right' } },
      });

      const filenameSuffix = dateRangeType === 'all' ? 'semua' : `${start}_ke_${end}`;
      doc.save(`dompetku-transaksi-${filenameSuffix}.pdf`);
      toast.success('PDF berhasil diunduh!');
    } catch (err) {
      console.error('Export PDF error:', err);
      toast.error('Gagal mengekspor PDF.');
    } finally {
      isExportingPdf = false;
    }
  }
</script>

<TopAppBar />

<main class="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-10">
  <!-- Profile Header -->
  <section class="flex flex-col items-center text-center space-y-4">
    <div class="relative">
      <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
        <button
          type="button"
          onclick={() => { if (avatarUrl) isAvatarLightboxOpen = true; }}
          class="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative {avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}"
          title={avatarUrl ? 'Lihat foto profil' : undefined}
        >
          {#if appStore.user}
            {#if avatarUrl}
              <img src={avatarUrl} alt="Foto profil" class="w-full h-full object-cover" />
            {:else}
              <span class="text-on-surface font-extrabold text-4xl select-none">
                {getInitials(appStore.user.email ?? 'U')}
              </span>
            {/if}
          {:else}
            <span class="material-symbols-outlined text-on-surface-variant text-5xl">person</span>
          {/if}
        </button>
      </div>

      {#if appStore.user}
        <button
          type="button"
          onclick={() => (isEditModalOpen = true)}
          class="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
          aria-label="Edit Profil"
        >
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
      {/if}
    </div>

    <div>
      {#if appStore.user}
        <h1 class="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
          {displayName}
        </h1>
        <p class="text-on-surface-variant font-medium mt-1">{appStore.user.email}</p>
        <span class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest">
          <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          Cloud Sync Aktif
        </span>
      {:else}
        <h1 class="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
          Mode Tamu
        </h1>
        <p class="text-on-surface-variant font-medium mt-1 text-sm">
          Data tersimpan di perangkat ini saja
        </p>
        <span class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
          <span class="material-symbols-outlined text-xs">device_unknown</span>
          Lokal Saja
        </span>
      {/if}
    </div>
  </section>

  <!-- Guest CTA Banner -->
  {#if !appStore.user}
    <section class="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl p-6 text-center space-y-4">
      <span class="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
      <div>
        <h2 class="font-headline font-bold text-lg text-on-surface">Backup Data ke Cloud</h2>
        <p class="text-on-surface-variant text-sm mt-1">
          Buat akun gratis untuk menyimpan data secara aman dan sinkron di semua perangkat.
        </p>
      </div>
      <div class="flex gap-3 justify-center">
        <a
          href="/register"
          class="px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 transition-transform"
        >
          Buat Akun Gratis
        </a>
        <a
          href="/login"
          class="px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-bold text-sm active:scale-95 transition-transform"
        >
          Sudah Punya Akun
        </a>
      </div>
    </section>
  {/if}

  <!-- Integrations (logged-in only) -->
  {#if appStore.user}
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GoogleSheetsCard />
      <BudgetCard />
    </section>
  {/if}

  <!-- Preferences -->
  <section class="space-y-6">
    <h2 class="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">
      Preferensi
    </h2>
    <div class="bg-surface-container-low rounded-[1.5rem] overflow-hidden">
      <div class="p-5 border-b border-outline-variant/5">
        <ThemePicker />
      </div>

      <PaydaySetting />

      <a
        href="/profil/categories"
        class="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group border-b border-outline-variant/5"
      >
        <div class="flex items-center gap-4">
          <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
            category
          </span>
          <span class="font-medium">Kelola Kategori</span>
        </div>
        <span class="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-0.5 transition-transform">
          chevron_right
        </span>
      </a>
    </div>
  </section>

  <!-- Data Operations -->
  <section class="space-y-6">
    <h2 class="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">
      Operasi Data
    </h2>

    <div class="bg-surface-container-low rounded-[1.5rem] p-5 border border-outline-variant/10 space-y-4">
      <div class="flex items-center gap-2 text-on-surface-variant ml-1">
        <span class="material-symbols-outlined text-lg">calendar_month</span>
        <span class="text-xs font-bold uppercase tracking-wider">Rentang Tanggal Ekspor</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {#each [
          { value: 'all', label: 'Semua Waktu' },
          { value: 'this_month', label: 'Bulan Ini' },
          { value: 'last_month', label: 'Bulan Lalu' },
          { value: 'last_30_days', label: '30 Hari' },
          { value: 'custom', label: 'Kustom' },
        ] as opt}
          <button
            type="button"
            onclick={() => (dateRangeType = opt.value as any)}
            class="px-3 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer text-center {dateRangeType === opt.value
              ? 'bg-primary text-on-primary border-primary shadow-md'
              : 'bg-surface-container hover:bg-surface-container-highest border-outline-variant/10 text-on-surface-variant'}"
          >
            {opt.label}
          </button>
        {/each}
      </div>

      {#if dateRangeType === 'custom'}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
          <div class="space-y-1">
            <label for="custom-start-date" class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 ml-1 block">
              Tanggal Mulai
            </label>
            <input
              id="custom-start-date"
              type="date"
              bind:value={customStartDate}
              class="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs font-medium text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            />
          </div>
          <div class="space-y-1">
            <label for="custom-end-date" class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 ml-1 block">
              Tanggal Selesai
            </label>
            <input
              id="custom-end-date"
              type="date"
              bind:value={customEndDate}
              class="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs font-medium text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            />
          </div>
        </div>

        {#if customStartDate && customEndDate && customStartDate > customEndDate}
          <p class="flex items-center gap-1.5 text-xs text-error mt-1 px-1">
            <span class="material-symbols-outlined text-sm">error</span>
            Tanggal mulai tidak boleh lebih baru dari tanggal selesai.
          </p>
        {/if}
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <button
        type="button"
        onclick={handleExportCsv}
        disabled={isExportingCsv}
        class="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-lg {isExportingCsv ? 'animate-spin' : ''}">
          {isExportingCsv ? 'progress_activity' : 'csv'}
        </span>
        <span class="font-medium text-sm">{isExportingCsv ? 'Mengekspor...' : 'Export CSV'}</span>
      </button>

      <button
        type="button"
        onclick={handleExportPdf}
        disabled={isExportingPdf}
        class="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-on-surface-variant text-lg {isExportingPdf ? 'animate-spin' : ''}">
          {isExportingPdf ? 'progress_activity' : 'picture_as_pdf'}
        </span>
        <span class="font-medium text-sm">{isExportingPdf ? 'Mengekspor...' : 'Export PDF'}</span>
      </button>
    </div>
  </section>

  <!-- Footer: Logout (if user is logged in) -->
  <footer class="pt-4 pb-4 space-y-4">
    {#if appStore.user}
      <button
        type="button"
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-error-container/10 border border-error-container/20 text-error hover:bg-error-container/20 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
      >
        <span class="material-symbols-outlined">logout</span>
        <span class="font-bold tracking-wide">
          {isLoggingOut ? 'Keluar...' : 'Keluar dari Akun'}
        </span>
      </button>
    {/if}
    <p class="text-center text-[10px] text-on-surface-variant/40 mt-4 uppercase tracking-widest font-label">
      Dompetku v1.0 • {appStore.user ? 'Cloud Mode' : 'Guest Mode'}
    </p>
  </footer>
</main>

<BottomNavBar />

<!-- Edit Profile Modal -->
<EditProfileModal
  isOpen={isEditModalOpen}
  onClose={() => (isEditModalOpen = false)}
/>

<!-- Avatar Lightbox -->
{#if isAvatarLightboxOpen && avatarUrl}
  <div
    class="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center animate-in fade-in duration-200"
    onclick={() => (isAvatarLightboxOpen = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Escape') isAvatarLightboxOpen = false; }}
  >
    <button
      type="button"
      class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
      onclick={() => (isAvatarLightboxOpen = false)}
      aria-label="Tutup"
    >
      <span class="material-symbols-outlined">close</span>
    </button>
    <div
      class="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <img src={avatarUrl} alt="Foto profil besar" class="w-full h-full object-cover" />
    </div>
  </div>
{/if}

