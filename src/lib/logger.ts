/**
 * Dev-only logger. Calls are stripped/silent in production.
 * Usage: logger.log('[Auth]', event) instead of console.log(...)
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
};
