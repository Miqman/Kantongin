/**
 * OpenAI AI Provider — PLACEHOLDER
 *
 * Untuk mengaktifkan:
 * 1. Set AI_PROVIDER=openAI di .env.local
 * 2. Isi OPENAI_API_KEY dan OPENAI_MODEL di .env.local
 * 3. Implementasikan metode di bawah — logika mirip NineRouterProvider
 *    tapi dengan base URL https://api.openai.com
 *
 * Docs: https://platform.openai.com/docs/api-reference/chat
 * Vision: https://platform.openai.com/docs/guides/vision
 */

import type { AIProvider, ParsedTransaction, HealthCheckResult } from './types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openAI';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.openai.com';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

    if (!apiKey) {
      throw new Error('[OpenAIProvider] OPENAI_API_KEY is required in environment variables.');
    }

    this.apiKey = apiKey;
    this.model = model;
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
    // TODO: Implementasikan — logika identik dengan NineRouterProvider
    // Base URL: https://api.openai.com/v1/chat/completions
    // Model yang direkomendasikan: gpt-4o atau gpt-4o-mini
    throw new Error('[OpenAIProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }

  async parseReceiptImage(
    _base64Image: string,
    _mimeType: string,
    _categoryNames: string[]
  ): Promise<ParsedTransaction> {
    // TODO: Gunakan gpt-4o dengan vision (image_url content block)
    // Format identik dengan NineRouterProvider.parseReceiptImage
    throw new Error('[OpenAIProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }
}
