"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '@/store/useStore';
import { getCycleBounds } from '@/lib/cycle';
import { toast } from 'react-hot-toast';

const COMMON_DAYS = [1, 25, 26, 27, 28];

export default function PaydaySetting() {
  const { paydayDate, setPaydayDate } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(paydayDate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedDay(paydayDate);
    }
  }, [isOpen, paydayDate]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const previewCycle = getCycleBounds(new Date(), selectedDay);
  const activeCycle = getCycleBounds(new Date(), paydayDate);

  const handleSave = async () => {
    try {
      await setPaydayDate(selectedDay);
      toast.success(`Siklus gajian diatur ke tanggal ${selectedDay}`);
      setIsOpen(false);
    } catch {
      toast.error('Gagal menyimpan tanggal gajian');
    }
  };

  const modalContent = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-[1.75rem] bg-surface-container-high p-6 shadow-2xl border border-outline-variant/15 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">
                event_repeat
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Tanggal Siklus Gajian
              </h3>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">
                Awal perhitungan pembukuan bulanan
              </p>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Pemasukan, pengeluaran, dan budget bulanan akan otomatis dihitung mulai dari tanggal gajian ini.
          </p>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
              Pilihan Populer
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_DAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm scale-105'
                        : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'
                    }`}
                  >
                    {day === 1 ? 'Tgl 1 (Normal)' : `Tgl ${day}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select dropdown for all 1-31 */}
          <div className="space-y-1.5">
            <label
              htmlFor="payday-select"
              className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60"
            >
              Atau Pilih Tanggal Lain (1 - 31)
            </label>
            <select
              id="payday-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              aria-label="Pilih tanggal gajian"
              className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Tanggal {d} {d === 1 ? '(Awal bulan kalender)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-1">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Pratinjau Siklus Berjalan</span>
            </div>
            <p className="text-xs text-on-surface font-medium">
              {previewCycle.start} s/d {previewCycle.end}
            </p>
            <p className="text-[11px] text-on-surface-variant/60">
              Label: <span className="font-semibold text-on-surface">{previewCycle.label}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group border-b border-outline-variant/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">
              event_repeat
            </span>
          </div>
          <div>
            <div className="font-medium text-sm text-on-surface flex items-center gap-2">
              <span>Siklus Gajian</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Tgl {paydayDate}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant/70 mt-0.5">
              {paydayDate === 1
                ? 'Mengikuti bulan kalender (Tgl 1 - akhir bulan)'
                : `Siklus berjalan: ${activeCycle.label}`}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-0.5 transition-transform">
          chevron_right
        </span>
      </div>

      {mounted && typeof document !== 'undefined' && ReactDOM.createPortal(modalContent, document.body)}
    </>
  );
}
