/**
 * Claude (Anthropic) AI Provider — PLACEHOLDER
 *
 * Untuk mengaktifkan:
 * 1. Set AI_PROVIDER=claude di .env.local
 * 2. Isi CLAUDE_API_KEY dan CLAUDE_MODEL di .env.local
 * 3. Implementasikan metode di bawah menggunakan Anthropic Messages API
 *
 * Docs: https://docs.anthropic.com/en/api/messages
 */

import type { AIProvider, ParsedTransaction, HealthCheckResult } from './types';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.anthropic.com';

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    const model = process.env.CLAUDE_MODEL ?? 'claude-opus-4-5';

    if (!apiKey) {
      throw new Error('[ClaudeProvider] CLAUDE_API_KEY is required in environment variables.');
    }

    this.apiKey = apiKey;
    this.model = model;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      // Ping dengan request minimal ke Messages API
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      // 200 atau 400 (bad request) berarti API reachable
      const online = res.status < 500;
      return { online, latencyMs, provider: this.name };
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
    // TODO: Implementasikan menggunakan Anthropic Messages API
    // Gunakan format: { role: 'user', content: '...' }
    // Response: messages[0].content[0].text
    throw new Error('[ClaudeProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }

  async parseReceiptImage(
    _base64Image: string,
    _mimeType: string,
    _categoryNames: string[]
  ): Promise<ParsedTransaction> {
    // TODO: Implementasikan dengan vision (image block dalam content array)
    throw new Error('[ClaudeProvider] Not yet implemented. Set AI_PROVIDER=nineRouter to use the active provider.');
  }
}
