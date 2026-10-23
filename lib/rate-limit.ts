import { config } from './config';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple in-memory fixed-window limiter. Swap for Redis/Upstash in production. */
export function rateLimit(key: string): { ok: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
    return { ok: true, retryAfter: 0, remaining: config.rateLimit.max - 1 };
  }

  bucket.count += 1;
  if (bucket.count > config.rateLimit.max) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
      remaining: 0,
    };
  }
  return { ok: true, retryAfter: 0, remaining: config.rateLimit.max - bucket.count };
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}

// Prevent unbounded growth of the map on long-running servers.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  timer.unref?.();
}
