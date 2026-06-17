// ─────────────────────────────────────────────────────────────────────────────
// AI Provider abstraction — types & interfaces
// Tambah provider baru: implementasikan AIProvider dan daftarkan di index.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hasil parsing transaksi dari AI.
 * Field bisa null jika AI tidak berhasil mengekstrak nilainya.
 */
export interface ParsedTransaction {
  /** Nominal transaksi dalam rupiah (positif = pengeluaran, negatif = pemasukan) */
  amount: number | null;
  /** Kata kunci kategori dari AI — dicocokkan ke kategori user di client */
  category_hint: string | null;
  /** Catatan transaksi */
  note: string | null;
  /** Tanggal transaksi format YYYY-MM-DD */
  date: string | null;
  /** Tingkat kepercayaan hasil parsing */
  confidence: 'high' | 'medium' | 'low';
  /** Tipe transaksi yang terdeteksi */
  transaction_type: 'expense' | 'income' | null;
}

/**
 * Hasil health check ke AI provider.
 */
export interface HealthCheckResult {
  online: boolean;
  latencyMs?: number;
  provider: string;
  error?: string;
}

/**
 * Interface yang harus diimplementasikan oleh setiap AI provider.
 */
export interface AIProvider {
  /** Nama provider (untuk logging & display) */
  readonly name: string;

  /**
   * Cek apakah provider sedang online dan bisa digunakan.
   * Timeout default: 10 detik.
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Parse teks transcript suara menjadi data transaksi.
   * @param transcript Hasil speech-to-text dari browser
   * @param categoryNames Daftar nama kategori user (untuk category_hint matching)
   */
  parseVoiceTranscript(
    transcript: string,
    categoryNames: string[]
  ): Promise<ParsedTransaction>;

  /**
   * Parse gambar struk/nota menjadi data transaksi.
   * @param base64Image Gambar dalam format base64 (tanpa prefix data:image/...)
   * @param mimeType MIME type gambar (misal: "image/jpeg")
   * @param categoryNames Daftar nama kategori user
   */
  parseReceiptImage(
    base64Image: string,
    mimeType: string,
    categoryNames: string[]
  ): Promise<ParsedTransaction>;
}

/**
 * Nama-nama provider yang tersedia di registry.
 */
export type ProviderName = 'nineRouter' | 'claude' | 'deepSeek' | 'openAI';
