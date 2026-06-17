/**
 * AI Provider Factory & Registry
 *
 * Cara menambah provider baru:
 * 1. Buat file provider baru di src/lib/ai/ yang mengimplementasikan AIProvider
 * 2. Import dan daftarkan di PROVIDER_REGISTRY di bawah
 * 3. Tambah nama provider ke ProviderName di types.ts
 * 4. Set AI_PROVIDER=nama_provider di .env.local
 */

import type { AIProvider, ProviderName } from './types';
import { NineRouterProvider } from './nineRouterProvider';
import { ClaudeProvider } from './claudeProvider';
import { DeepSeekProvider } from './deepSeekProvider';
import { OpenAIProvider } from './openAIProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Provider Registry
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_REGISTRY: Record<ProviderName, () => AIProvider> = {
  nineRouter: () => new NineRouterProvider(),
  claude: () => new ClaudeProvider(),
  deepSeek: () => new DeepSeekProvider(),
  openAI: () => new OpenAIProvider(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mengembalikan instance AI provider yang aktif.
 *
 * Provider aktif ditentukan oleh env variable `AI_PROVIDER`.
 * Default: 'nineRouter'
 *
 * @param providerOverride - Override provider (untuk testing)
 */
export function getAIProvider(providerOverride?: string): AIProvider {
  const providerName = (providerOverride ?? process.env.AI_PROVIDER ?? 'nineRouter') as ProviderName;

  const factory = PROVIDER_REGISTRY[providerName];
  if (!factory) {
    console.warn(`[AI] Unknown provider "${providerName}", falling back to nineRouter`);
    return new NineRouterProvider();
  }

  return factory();
}

// Re-export types for convenience
export type { AIProvider, ParsedTransaction, HealthCheckResult, ProviderName } from './types';
