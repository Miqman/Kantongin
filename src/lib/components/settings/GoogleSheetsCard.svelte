<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast.svelte';

  type SheetsStatus = {
    connected: boolean;
    lastSynced: string | null;
    spreadsheetId: string | null;
  };

  let status = $state<SheetsStatus | null>(null);
  let loading = $state(true);
  let syncing = $state(false);
  let connecting = $state(false);
  let disconnecting = $state(false);

  onMount(() => {
    checkStatus();

    // Check URL parameters for OAuth redirect callbacks
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sheetsParam = params.get('sheets');
      const reason = params.get('reason');
      const details = params.get('details');

      if (sheetsParam === 'connected') {
        toast.success('Google Sheets berhasil terhubung!');
        checkStatus();
        window.history.replaceState({}, '', '/profil');
      } else if (sheetsParam === 'denied') {
        toast.error('Akses Google Sheets ditolak');
        window.history.replaceState({}, '', '/profil');
      } else if (sheetsParam === 'error') {
        const errorMsg = reason && details ? `${reason}: ${details}` : reason || 'Unknown error';
        toast.error(`Gagal menghubungkan: ${errorMsg}`);
        window.history.replaceState({}, '', '/profil');
      }
    }
  });

  async function checkStatus() {
    try {
      const res = await fetch('/api/integrations/google-sheets/status');
      if (res.ok) {
        const data = await res.json();
        status = data;
      }
    } catch (err) {
      console.error('Failed to check sheets status:', err);
    } finally {
      loading = false;
    }
  }

  async function handleConnect() {
    connecting = true;
    try {
      const res = await fetch('/api/integrations/google-sheets/connect', { method: 'POST' });
      const data = await res.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Gagal memulai koneksi');
        connecting = false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      connecting = false;
    }
  }

  async function handleSync() {
    syncing = true;
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Berhasil sync ${data.transactions_count} transaksi`);
        if (status) {
          status.lastSynced = data.synced_at;
        }
      } else if (data.needsReconnect) {
        toast.error('Token expired. Silakan hubungkan ulang.');
        if (status) {
          status.connected = false;
        }
      } else {
        toast.error(data.error || 'Sync gagal');
      }
    } catch {
      toast.error('Gagal melakukan sync');
    } finally {
      syncing = false;
    }
  }

  async function handleDisconnect() {
    disconnecting = true;
    try {
      const res = await fetch('/api/integrations/google-sheets', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Google Sheets berhasil diputus');
        status = { connected: false, lastSynced: null, spreadsheetId: null };
      } else {
        toast.error('Gagal memutus koneksi');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      disconnecting = false;
    }
  }

  function formatLastSynced(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;

    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

{#if loading}
  <div class="bg-surface-container-low p-6 rounded-[2rem] animate-pulse">
    <div class="h-10 w-10 bg-surface-container-high rounded-xl mb-4"></div>
    <div class="h-5 w-32 bg-surface-container-high rounded mb-2"></div>
    <div class="h-4 w-48 bg-surface-container-high rounded"></div>
  </div>
{:else if status?.connected}
  <div class="bg-surface-container-low p-6 rounded-[2rem] border border-secondary/20 space-y-4">
    <div class="flex justify-between items-start">
      <div class="p-2.5 bg-secondary/10 rounded-xl">
        <span class="material-symbols-outlined text-secondary">sync</span>
      </div>
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
        <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        Terhubung
      </span>
    </div>

    <div>
      <h3 class="font-headline font-bold text-lg">Google Sheets</h3>
      {#if status.lastSynced}
        <p class="text-on-surface-variant text-sm mt-1">
          Terakhir sync: {formatLastSynced(status.lastSynced)}
        </p>
      {/if}
    </div>

    <div class="flex gap-2 pt-2">
      <button
        type="button"
        onclick={handleSync}
        disabled={syncing}
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-secondary text-on-secondary font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
      >
        <span class="material-symbols-outlined text-lg {syncing ? 'animate-spin' : ''}">
          {syncing ? 'progress_activity' : 'sync'}
        </span>
        {syncing ? 'Syncing...' : 'Sync Sekarang'}
      </button>

      <button
        type="button"
        onclick={handleDisconnect}
        disabled={disconnecting}
        class="w-12 h-12 flex items-center justify-center rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50 cursor-pointer"
        title={disconnecting ? 'Memutuskan...' : 'Putuskan koneksi'}
      >
        <span class="material-symbols-outlined text-lg {disconnecting ? 'animate-spin' : ''}">
          {disconnecting ? 'progress_activity' : 'link_off'}
        </span>
      </button>
    </div>

    {#if status.spreadsheetId}
      <a
        href="https://docs.google.com/spreadsheets/d/{status.spreadsheetId}"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-xs text-primary hover:underline mt-1"
      >
        <span class="material-symbols-outlined text-sm">open_in_new</span>
        Buka Spreadsheet
      </a>
    {/if}
  </div>
{:else}
  <div class="bg-surface-container-low p-6 rounded-[2rem] space-y-4">
    <div class="flex justify-between items-start">
      <div class="p-2.5 bg-on-surface-variant/10 rounded-xl">
        <span class="material-symbols-outlined text-on-surface-variant">sync_disabled</span>
      </div>
      <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-outline-variant/20 px-2 py-1 rounded-full">
        Tidak Terhubung
      </span>
    </div>

    <div>
      <h3 class="font-headline font-bold text-lg">Google Sheets</h3>
      <p class="text-on-surface-variant text-sm mt-1">
        Sinkronkan data keuangan ke spreadsheet Google Anda secara otomatis
      </p>
    </div>

    <button
      type="button"
      onclick={handleConnect}
      disabled={connecting}
      class="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
    >
      <span class="material-symbols-outlined text-lg">link</span>
      {connecting ? 'Menghubungkan...' : 'Hubungkan Google Sheets'}
    </button>
  </div>
{/if}

