"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

type SheetsStatus = {
  connected: boolean;
  lastSynced: string | null;
  spreadsheetId: string | null;
};

export default function GoogleSheetsCard() {
  const [status, setStatus] = useState<SheetsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  // Check for URL params (callback result)
  useEffect(() => {
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
      const errorMsg = reason && details 
        ? `${reason}: ${details}`
        : reason || 'Unknown error';
      
      toast.error(`Gagal menghubungkan: ${errorMsg}`, { duration: 8000 });
      console.error('[Sheets Connect Error]', { reason, details });
      window.history.replaceState({}, '', '/profil');
    }
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/integrations/google-sheets/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to check sheets status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/connect', { method: 'POST' });
      const data = await res.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Gagal memulai koneksi');
        setConnecting(false);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Berhasil sync ${data.transactions_count} transaksi`);
        setStatus(prev => prev ? { ...prev, lastSynced: data.synced_at } : prev);
      } else if (data.needsReconnect) {
        toast.error('Token expired. Silakan hubungkan ulang.');
        setStatus(prev => prev ? { ...prev, connected: false } : prev);
      } else {
        toast.error(data.error || 'Sync gagal');
      }
    } catch (err) {
      toast.error('Gagal melakukan sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/google-sheets', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Google Sheets berhasil diputus');
        setStatus({ connected: false, lastSynced: null, spreadsheetId: null });
      } else {
        toast.error('Gagal memutus koneksi');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setDisconnecting(false);
    }
  };

  const formatLastSynced = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low p-6 rounded-[2rem] animate-pulse">
        <div className="h-10 w-10 bg-surface-container-high rounded-xl mb-4" />
        <div className="h-5 w-32 bg-surface-container-high rounded mb-2" />
        <div className="h-4 w-48 bg-surface-container-high rounded" />
      </div>
    );
  }

  // Connected state
  if (status?.connected) {
    return (
      <div className="bg-surface-container-low p-6 rounded-[2rem] border border-secondary/20 space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-secondary/10 rounded-xl">
            <span className="material-symbols-outlined text-secondary">sync</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Terhubung
          </span>
        </div>

        <div>
          <h3 className="font-headline font-bold text-lg">Google Sheets</h3>
          {status.lastSynced && (
            <p className="text-on-surface-variant text-sm mt-1">
              Terakhir sync: {formatLastSynced(status.lastSynced)}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-secondary text-on-secondary font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-lg ${syncing ? 'animate-spin' : ''}`}>
              {syncing ? 'progress_activity' : 'sync'}
            </span>
            {syncing ? 'Syncing...' : 'Sync Sekarang'}
          </button>
          
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50 cursor-pointer"
            title="Putuskan koneksi"
          >
            <span className="material-symbols-outlined text-lg">link_off</span>
          </button>
        </div>

        {status.spreadsheetId && (
          <a
            href={`https://docs.google.com/spreadsheets/d/${status.spreadsheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline mt-1"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Buka Spreadsheet
          </a>
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="bg-surface-container-low p-6 rounded-[2rem] space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-on-surface-variant/10 rounded-xl">
          <span className="material-symbols-outlined text-on-surface-variant">sync_disabled</span>
        </div>
        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant bg-outline-variant/20 px-2 py-1 rounded-full">
          Tidak Terhubung
        </span>
      </div>

      <div>
        <h3 className="font-headline font-bold text-lg">Google Sheets</h3>
        <p className="text-on-surface-variant text-sm mt-1">
          Sinkronkan data keuangan ke spreadsheet Google Anda secara otomatis
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">link</span>
        {connecting ? 'Menghubungkan...' : 'Hubungkan Google Sheets'}
      </button>
    </div>
  );
}
