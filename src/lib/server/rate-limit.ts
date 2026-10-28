import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });

    if (store.size > 5000) {
      for (const [k, val] of store.entries()) {
        if (now > val.resetAt) store.delete(k);
      }
    }
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(eventOrRequest: RequestEvent | Request): string {
  if ('getClientAddress' in eventOrRequest && typeof eventOrRequest.getClientAddress === 'function') {
    try {
      return eventOrRequest.getClientAddress();
    } catch {
      // Fallback to headers
    }
  }

  const req = 'request' in eventOrRequest ? eventOrRequest.request : eventOrRequest;
  const headers = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      return value.split(',')[0].trim();
    }
  }

  return '127.0.0.1';
}

