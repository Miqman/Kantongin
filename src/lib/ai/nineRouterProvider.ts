import type { AIProvider, ParsedTransaction, HealthCheckResult } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// System prompts bilingual (Indonesia + Inggris)
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_VOICE = `You are a financial transaction parser assistant for an Indonesian personal finance app called "Kantongin".

Your job: Parse voice transcript into a structured JSON transaction.

Rules:
- "amount": extract numeric value in Indonesian Rupiah (IDR). Understand Indonesian number words: "ribu" = thousand, "juta" = million, "ratus" = hundred, "lima belas ribu" = 15000, etc. Also handle English: "fifteen thousand" = 15000.
- "transaction_type": "expense" if buying/spending/paying, "income" if receiving/salary/transfer in. Default to "expense" if unclear.
- "category_hint": pick the MOST relevant word from the provided category list. If none match, use a descriptive keyword in Indonesian.
- "note": short descriptive note about the transaction (max 50 chars).
- "date": extract if mentioned (e.g. "kemarin" = yesterday, "hari ini" = today). Use null if not mentioned.
- "confidence": "high" if amount is clearly stated, "medium" if inferred, "low" if very unclear.

Always return valid JSON only. No markdown, no explanation.`;

const SYSTEM_PROMPT_PHOTO = `You are a receipt/invoice OCR and transaction parser for an Indonesian personal finance app called "Kantongin".

Your job: Analyze the receipt/invoice image and extract transaction data as structured JSON.

Rules:
- "amount": extract the TOTAL amount paid (look for "Total", "Grand Total", "Jumlah", "TOTAL BAYAR"). Return as number in IDR.
- "transaction_type": always "expense" for receipts/purchases.
- "category_hint": pick the MOST relevant word from the provided category list based on the merchant/items.
- "note": merchant name or brief description (max 50 chars).
- "date": extract transaction date from receipt if visible (format YYYY-MM-DD). Use null if not visible.
- "confidence": "high" if total is clearly readable, "medium" if partially readable, "low" if unclear.

Always return valid JSON only. No markdown, no explanation.`;

const USER_PROMPT_VOICE = (transcript: string, categoryNames: string[]) =>
  `Voice transcript: "${transcript}"

Available categories: ${categoryNames.join(', ')}

Return JSON:
{
  "amount": <number or null>,
  "transaction_type": <"expense" | "income" | null>,
  "category_hint": <string or null>,
  "note": <string or null>,
  "date": <"YYYY-MM-DD" or null>,
  "confidence": <"high" | "medium" | "low">
}`;

const USER_PROMPT_PHOTO = (categoryNames: string[]) =>
  `Analyze this receipt image.

Available categories: ${categoryNames.join(', ')}

Return JSON:
{
  "amount": <number or null>,
  "transaction_type": "expense",
  "category_hint": <string or null>,
  "note": <string or null>,
  "date": <"YYYY-MM-DD" or null>,
  "confidence": <"high" | "medium" | "low">
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse AI JSON response safely
// ─────────────────────────────────────────────────────────────────────────────

function parseAIResponse(raw: string): ParsedTransaction {
  // 1. Strip markdown fences
  let cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();

  // 2. Extract the first JSON object using regex (handles trailing text/explanations)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[parseAIResponse] Failed to parse JSON. Raw response:', raw);
    throw new Error(`AI response is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    amount: typeof parsed.amount === 'number' ? parsed.amount : null,
    category_hint: typeof parsed.category_hint === 'string' ? parsed.category_hint : null,
    note: typeof parsed.note === 'string' ? parsed.note : null,
    date: typeof parsed.date === 'string' ? parsed.date : null,
    confidence: ['high', 'medium', 'low'].includes(parsed.confidence as string)
      ? (parsed.confidence as ParsedTransaction['confidence'])
      : 'low',
    transaction_type: ['expense', 'income'].includes(parsed.transaction_type as string)
      ? (parsed.transaction_type as ParsedTransaction['transaction_type'])
      : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9router Provider
// ─────────────────────────────────────────────────────────────────────────────

export class NineRouterProvider implements AIProvider {
  readonly name = '9router';

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const baseUrl = process.env.NINE_ROUTER_BASE_URL;
    const apiKey = process.env.NINE_ROUTER_API_KEY;
    const model = process.env.NINE_ROUTER_MODEL ?? 'combo';

    if (!baseUrl || !apiKey) {
      throw new Error('[NineRouterProvider] NINE_ROUTER_BASE_URL and NINE_ROUTER_API_KEY are required in environment variables.');
    }

    this.baseUrl = baseUrl.replace(/\/$/, ''); // trim trailing slash
    this.apiKey = apiKey;
    this.model = model;
  }

  // ── Health Check ──────────────────────────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          online: false,
          latencyMs,
          provider: this.name,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      return { online: true, latencyMs, provider: this.name };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        online: false,
        latencyMs,
        provider: this.name,
        error: message.includes('abort') ? 'Timeout (10s)' : message,
      };
    }
  }

  // ── Internal: call OpenAI-compatible chat endpoint ────────────────────────

  private async callChat(
    messages: { role: 'system' | 'user'; content: string | Array<{ type: string; [key: string]: unknown }> }[],
    timeoutMs = 30_000
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.1,
          max_tokens: 1024,
          stream: false,
          // Note: response_format not used — not all combo models support it.
          // JSON output is enforced via system prompt instructions instead.
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`9router API error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from 9router');
      return content;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout (30s) — 9router tidak merespons');
      }
      throw err;
    }
  }

  // ── Parse Voice Transcript ────────────────────────────────────────────────

  async parseVoiceTranscript(
    transcript: string,
    categoryNames: string[]
  ): Promise<ParsedTransaction> {
    if (!transcript.trim()) {
      return {
        amount: null,
        category_hint: null,
        note: null,
        date: null,
        confidence: 'low',
        transaction_type: null,
      };
    }

    const raw = await this.callChat([
      { role: 'system', content: SYSTEM_PROMPT_VOICE },
      { role: 'user', content: USER_PROMPT_VOICE(transcript, categoryNames) },
    ]);

    return parseAIResponse(raw);
  }

  // ── Parse Receipt Image ───────────────────────────────────────────────────

  async parseReceiptImage(
    base64Image: string,
    mimeType: string,
    categoryNames: string[]
  ): Promise<ParsedTransaction> {
    const raw = await this.callChat([
      { role: 'system', content: SYSTEM_PROMPT_PHOTO },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: USER_PROMPT_PHOTO(categoryNames),
          },
        ],
      },
    ]);

    return parseAIResponse(raw);
  }
}
