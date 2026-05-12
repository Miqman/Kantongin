"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Props {
  value: string; // category id or 'ALL'
  categories: Category[];
  onChange: (id: string) => void;
}

export default function CategoryFilterPicker({ value, categories, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = categories.find(c => c.id === value);
  const isActive = value !== "ALL";

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Dropdown position (desktop) ────────────────────────────────────────────
  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const w = 280, vw = window.innerWidth;
    let left = rect.left;
    if (left + w > vw - 8) left = vw - w - 8;
    setDropdownStyle({ position: "fixed", top: rect.bottom + 8, left, width: w, zIndex: 9999 });
  }, []);

  // ── Outside click (desktop) ────────────────────────────────────────────────
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

  // ── Body scroll lock (mobile) ──────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, isMobile]);

  const handleOpen = () => {
    if (!isMobile) computePos();
    setOpen(o => !o);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  // ── Category list ──────────────────────────────────────────────────────────
  const CategoryList = (
    <div className="flex flex-col gap-1 p-3">
      {/* All option */}
      <button
        onClick={() => handleSelect("ALL")}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer text-left ${
          value === "ALL"
            ? "bg-primary/10 text-primary"
            : "hover:bg-surface-container text-on-surface-variant"
        }`}
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(var(--app-primary-rgb, 99,102,241), 0.1)" }}
        >
          <span className="material-symbols-outlined text-[18px] text-primary">apps</span>
        </span>
        <span>Semua Kategori</span>
        {value === "ALL" && (
          <span className="ml-auto material-symbols-outlined text-primary text-[18px]">check</span>
        )}
      </button>

      {/* Divider */}
      {categories.length > 0 && (
        <div className="h-px bg-outline-variant/10 mx-2 my-1" />
      )}

      {/* Category items */}
      {categories.map(cat => {
        const isSelected = value === cat.id;
        const iconColor = cat.color ?? "#6366f1";
        const bgColor = `${iconColor}1a`; // ~10% opacity

        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer text-left ${
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-surface-container text-on-surface"
            }`}
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bgColor }}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ color: iconColor }}
              >
                {cat.icon ?? "label"}
              </span>
            </span>
            <span className="flex-1 truncate">{cat.name}</span>
            {isSelected && (
              <span className="ml-auto material-symbols-outlined text-primary text-[18px]">check</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Portal ─────────────────────────────────────────────────────────────────
  const portal = open ? (
    isMobile ? (
      <>
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
        />
        {/* Bottom sheet */}
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl flex flex-col"
          style={{ zIndex: 9999, maxHeight: "70dvh" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <h3 className="font-headline font-bold text-base">Pilih Kategori</h3>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
            </button>
          </div>
          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1 pb-6">
            {CategoryList}
          </div>
        </div>
      </>
    ) : (
      /* Desktop dropdown */
      <div
        ref={panelRef}
        style={{ ...dropdownStyle, maxHeight: "60vh" }}
        className="bg-surface border border-outline-variant/15 rounded-2xl shadow-2xl overflow-y-auto"
      >
        {CategoryList}
      </div>
    )
  ) : null;

  return (
    <div className="relative flex-shrink-0">
      {/* Trigger chip */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
          isActive
            ? "bg-primary text-on-primary shadow-md shadow-primary/20"
            : "bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low shadow-sm"
        }`}
      >
        {isActive && selected?.icon ? (
          <span className="material-symbols-outlined text-[16px]">{selected.icon}</span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">category</span>
        )}
        {isActive ? selected?.name ?? "Kategori" : "Kategori"}
        <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {typeof window !== "undefined" && ReactDOM.createPortal(portal, document.body)}
    </div>
  );
}
