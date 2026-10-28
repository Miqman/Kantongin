import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIProvider } from '$lib/server/ai';

let healthCache: { result: object; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    if (healthCache && now < healthCache.expiresAt) {
      return json({ ...healthCache.result, cached: true });
    }

    const provider = getAIProvider();
    const result = await provider.healthCheck();

    healthCache = {
      result,
      expiresAt: now + CACHE_TTL_MS,
    };

    return json(result);
  } catch (err) {
    console.error('[/api/ai/health] Error:', err);
    return json(
      {
        online: false,
        provider: 'unknown',
        error: 'Gagal melakukan health check',
      },
      { status: 200 }
    );
  }
};

