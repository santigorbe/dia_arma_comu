import type { RequestHandler } from 'express';
import { AppError } from './errors.js';

export type RateLimitClass = 'visits' | 'registration' | 'login' | 'verification' | 'admin' | 'integration';

const defaults: Record<RateLimitClass, { windowMs: number; max: number }> = {
  visits: { windowMs: 60_000, max: 60 },
  registration: { windowMs: 60_000, max: 10 },
  login: { windowMs: 60_000, max: 5 },
  verification: { windowMs: 60_000, max: 30 },
  admin: { windowMs: 60_000, max: 120 },
  integration: { windowMs: 60_000, max: 30 }
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(limitClass: RateLimitClass, override = defaults[limitClass]): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    const key = `${limitClass}:${request.ip ?? 'unknown'}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + override.windowMs });
      next();
      return;
    }

    if (bucket.count >= override.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      response.setHeader('retry-after', String(retryAfterSeconds));
      next(new AppError(429, 'rate_limit_exceeded', 'rate_limit_exceeded', { retryAfterSeconds }));
      return;
    }

    bucket.count += 1;
    next();
  };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
