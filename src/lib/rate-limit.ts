/**
 * Simple in-memory rate limiter.
 * Limits N requests per IP per window (ms).
 *
 * Note: In-memory = per-instance only. Untuk multi-instance (production scale),
 * gunakan Upstash Redis. Untuk free tier + Vercel single-region ini sudah cukup.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Returns { success: true } if under limit, { success: false } if blocked.
 */
export function rateLimit(
  ip: string,
  options: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + options.windowMs;
    store.set(ip, { count: 1, resetAt });
    // Cleanup old keys periodically (simple GC)
    if (store.size > 5000) {
      for (const [key, val] of store.entries()) {
        if (now > val.resetAt) store.delete(key);
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

/**
 * Helper: get client IP from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
  ];

  for (const header of headers) {
    const value = (request as Request & { headers: Headers }).headers.get(header);
    if (value) {
      // x-forwarded-for may contain multiple IPs, take the first
      return value.split(',')[0].trim();
    }
  }

  return '127.0.0.1';
}
