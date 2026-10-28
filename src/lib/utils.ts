import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 50000 -> "Rp 50.000"
 */
export function formatRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);

  return amount < 0 ? `+${formatted}` : formatted;
}

/**
 * Format number to simple integer string with thousand separator (no Rp prefix)
 * Example: 50000 -> "50.000"
 */
export function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.abs(val));
}

