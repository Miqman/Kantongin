"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
export type DateFilterMode = "RANGE" | "MONTH" | "YEAR";

export interface DateFilterValue {
  mode: DateFilterMode;
  from?: Date;
  to?: Date;
  month?: number; // 0-indexed
  year?: number;
}

interface Props {
  value: DateFilterValue | null;
  onChange: (v: DateFilterValue | null) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const MONTHS_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_SHORT   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const THIS_YEAR    = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => THIS_YEAR - i);

// ── Label helper ──────────────────────────────────────────────────────────────
function getLabel(v: DateFilterValue | null): string {
  if (!v) return "Semua Waktu";
  const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  if (v.mode === "RANGE") {
    if (v.from && v.to) return `${fmt(v.from)} – ${fmt(v.to)}`;
    if (v.from) return `Dari ${fmt(v.from)}`;
  }
  if (v.mode === "MONTH" && v.month !== undefined && v.year !== undefined)
    return `${MONTHS_FULL[v.month]} ${v.year}`;
  if (v.mode === "YEAR" && v.year !== undefined) return `Tahun ${v.year}`;
  return "Semua Waktu";
}

// ── Mini Calendar (custom, no external CSS dependency) ────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function startOf(d: Date) {
  const c = new Date(d); c.setHours(0,0,0,0); return c;
}

interface CalProps {
  range: { from?: Date; to?: Date };
  onChange: (r: { from?: Date; to?: Date }) => void;
}

function MiniCalendar({ range, onChange }: CalProps) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build grid: leading blanks + days of month
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const clicked = startOf(new Date(viewYear, viewMonth, day));
    if (!range.from || (range.from && range.to)) {
      onChange({ from: clicked, to: undefined });
    } else {
      const from = startOf(range.from);
      if (clicked < from) onChange({ from: clicked, to: from });
      else onChange({ from, to: clicked });
    }
  };

  const getDayState = (day: number) => {
    const d = startOf(new Date(viewYear, viewMonth, day));
    const from = range.from ? startOf(range.from) : null;
    const to   = range.to   ? startOf(range.to)   : null;
    const isStart   = from && isSameDay(d, from);
    const isEnd     = to   && isSameDay(d, to);
    const inRange   = from && to && d > from && d < to;
    const isToday   = isSameDay(d, startOf(today));
    return { isStart, isEnd, inRange, isToday };
  };

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">chevron_left</span>
        </button>
        <span className="font-bold text-sm text-on-surface">
          {MONTHS_FULL[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">chevron_right</span>
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-on-surface-variant/50 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`blank-${idx}`} />;
          const { isStart, isEnd, inRange, isToday } = getDayState(day);
          const isSelected = isStart || isEnd;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={[
                "relative h-9 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors",
                // range fill — extends to edge for middle days
                inRange ? "bg-primary/15 text-primary" : "",
                // rounded caps for start/end
                isStart ? "rounded-l-full bg-primary text-on-primary" : "",
                isEnd   ? "rounded-r-full bg-primary text-on-primary" : "",
                // single selected (start only, no end yet)
                isSelected && !inRange ? "rounded-full bg-primary text-on-primary" : "",
                // today ring
                !isSelected && isToday ? "ring-1 ring-primary ring-inset rounded-full text-primary" : "",
                // default hover
                !isSelected && !inRange ? "hover:bg-surface-container rounded-full" : "",
              ].filter(Boolean).join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DateFilterPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<DateFilterMode>("RANGE");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // draft state
  const [range,    setRange]    = useState<{ from?: Date; to?: Date }>({});
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear,  setSelYear]  = useState(THIS_YEAR);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Dropdown position (desktop)
  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const w = 320, vw = window.innerWidth;
    let left = rect.left;
    if (left + w > vw - 8) left = vw - w - 8;
    setDropdownStyle({ position: "fixed", top: rect.bottom + 8, left, width: w, zIndex: 9999 });
  }, []);

  // Outside click (desktop)
  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", computePos, true);
    window.addEventListener("resize", computePos);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", computePos, true);
      window.removeEventListener("resize", computePos);
    };
  }, [open, isMobile, computePos]);

  // Body scroll lock (mobile)
  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, isMobile]);

  const handleOpen = () => {
    if (!isMobile) computePos();
    setOpen(o => !o);
  };

  const handleApply = () => {
    if (mode === "RANGE")
      onChange(range.from || range.to ? { mode: "RANGE", from: range.from, to: range.to } : null);
    else if (mode === "MONTH")
      onChange({ mode: "MONTH", month: selMonth, year: selYear });
    else
      onChange({ mode: "YEAR", year: selYear });
    setOpen(false);
  };

  const handleClear = () => { setRange({}); onChange(null); setOpen(false); };

  const isActive = value !== null;

  const TABS: { key: DateFilterMode; label: string }[] = [
    { key: "RANGE", label: "Rentang" },
    { key: "MONTH", label: "Bulan" },
    { key: "YEAR",  label: "Tahun" },
  ];

  // ── Panel Body ─────────────────────────────────────────────────────────────
  const Body = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/10 flex-shrink-0">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
              mode === key ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* RANGE — custom calendar */}
        {mode === "RANGE" && (
          <div className="space-y-4">
            <MiniCalendar range={range} onChange={setRange} />
            {(range.from || range.to) && (
              <div className="flex items-center gap-2 bg-primary/8 rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-primary text-[18px]">date_range</span>
                <span className="text-xs text-on-surface font-medium flex-1">
                  <span className="font-bold text-primary">
                    {range.from?.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }) ?? "—"}
                  </span>
                  <span className="text-on-surface-variant/60 mx-2">→</span>
                  <span className="font-bold text-primary">
                    {range.to?.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }) ?? "pilih akhir"}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* MONTH */}
        {mode === "MONTH" && (
          <div className="space-y-5">
            {/* Year chips */}
            <div className="flex gap-2 flex-wrap">
              {YEAR_OPTIONS.map(y => (
                <button key={y} onClick={() => setSelYear(y)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    selYear === y ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >{y}</button>
              ))}
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {MONTHS_SHORT.map((name, idx) => (
                <button key={idx} onClick={() => setSelMonth(idx)}
                  className={`py-3.5 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                    selMonth === idx ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >{name}</button>
              ))}
            </div>
            <p className="text-center text-xs text-on-surface-variant/60">
              Terpilih: <span className="font-bold text-on-surface">{MONTHS_FULL[selMonth]} {selYear}</span>
            </p>
          </div>
        )}

        {/* YEAR */}
        {mode === "YEAR" && (
          <div className="grid grid-cols-2 gap-3">
            {YEAR_OPTIONS.map(y => (
              <button key={y} onClick={() => setSelYear(y)}
                className={`py-5 rounded-2xl text-lg font-bold transition-colors cursor-pointer ${
                  selYear === y ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >{y}</button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-5 py-4 border-t border-outline-variant/10 flex-shrink-0">
        <button onClick={handleClear}
          className="flex-1 py-3 rounded-full text-sm font-bold text-on-surface-variant border border-outline-variant/25 hover:bg-surface-container transition-colors cursor-pointer"
        >Reset</button>
        <button onClick={handleApply}
          className="flex-1 py-3 rounded-full text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >Terapkan</button>
      </div>
    </div>
  );

  // ── Portal content ─────────────────────────────────────────────────────────
  const portal = open ? (
    isMobile ? (
      <>
        {/* Backdrop */}
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
        />
        {/* Bottom sheet */}
        <div ref={panelRef}
          className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl flex flex-col"
          style={{ zIndex: 9999, maxHeight: "88dvh" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <h3 className="font-headline font-bold text-base">Filter Tanggal</h3>
            <button onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
            </button>
          </div>
          {Body}
        </div>
      </>
    ) : (
      /* Desktop dropdown */
      <div ref={panelRef}
        className="bg-surface border border-outline-variant/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ ...dropdownStyle, maxHeight: "80vh" }}
      >
        {Body}
      </div>
    )
  ) : null;

  return (
    <div className="relative flex-shrink-0">
      <button ref={triggerRef} onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
          isActive
            ? "bg-primary text-on-primary shadow-md shadow-primary/20"
            : "bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low shadow-sm"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
        {getLabel(value)}
        <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {typeof window !== "undefined" && ReactDOM.createPortal(portal, document.body)}
    </div>
  );
}
