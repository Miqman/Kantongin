/**
 * DeepSeek AI Provider — PLACEHOLDER
 *
 * DeepSeek menggunakan format OpenAI-compatible, sehingga implementasinya
 * mirip dengan NineRouterProvider tetapi dengan base URL berbeda.
 *
 * Untuk mengaktifkan:
 * 1. Set AI_PROVIDER=deepSeek di .env.local
 * 2. Isi DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL di .env.local
 * 3. Implementasikan metode di bawah (reuse logic dari nineRouterProvider)
 *
 * Docs: https://platform.deepseek.com/api-docs
 */

import type { AIProvider, ParsedTransaction, HealthCheckResult } from './types';

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepSeek';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
    const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';

    if (!apiKey) {
      throw new Error('[DeepSeekProvider] DEEPSEEK_API_KEY is required in environment variables.');
    }

    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;
      return { online: res.ok, latencyMs, provider: this.name };
    } catch (err) {
      return {
        online: false,
        latencyMs: Date.now() - start,
        provider: this.name,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async parseVoiceTranscript(
    _transcript: string,
    _categoryNames: string[]
  ): Promise<ParsedTransaction> {
    // TODO: Implementasikan — logika mirip NineRouterProvider.parseVoiceTranscript
    // Gunakan this.baseUrl + '/v1/chat/completions' dengan Authorization Bearer this.apiKey
    throw new Error('[DeepSeekProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }

  async parseReceiptImage(
    _base64Image: string,
    _mimeType: string,
    _categoryNames: string[]
  ): Promise<ParsedTransaction> {
    // TODO: Gunakan deepseek-vision model jika tersedia
    throw new Error('[DeepSeekProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }
}
