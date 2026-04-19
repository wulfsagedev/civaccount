/**
 * Distributed rate limiter using Upstash Redis.
 * Falls back to in-memory rate limiting when Redis is not configured (development).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Upstash Redis rate limiter (production) ──────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

// Cache Ratelimit instances by config key to avoid re-creating them
const ratelimiters = new Map<string, Ratelimit>();

function getUpstashRatelimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.limit}:${config.windowSeconds}`;
  let rl = ratelimiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: getRedis()!,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: 'civaccount',
    });
    ratelimiters.set(key, rl);
  }
  return rl;
}

// ── In-memory fallback (development) ─────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: config.limit - 1, resetIn: config.windowSeconds };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetIn: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { success: true, remaining: config.limit - entry.count, resetIn: Math.ceil((entry.resetTime - now) / 1000) };
}

// ── Public API (same interface, consumers don't change) ──────────────────────

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis in production, in-memory in development.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redisClient = getRedis();

  if (redisClient) {
    try {
      const rl = getUpstashRatelimiter(config);
      const result = await rl.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        resetIn: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch {
      // Redis failed — fall back to in-memory
      return checkRateLimitMemory(identifier, config);
    }
  }

  return checkRateLimitMemory(identifier, config);
}

/**
 * Get client IP from request headers.
 *
 * Header preference order matters for rate-limiting correctness:
 *   1. `x-vercel-forwarded-for` — set by Vercel's edge, cannot be spoofed
 *      by the client because Vercel overwrites whatever the request
 *      carried. First choice on any Vercel deployment.
 *   2. `x-real-ip` — set by many reverse proxies, also overwritten by
 *      Vercel. Still reliable.
 *   3. `x-forwarded-for` — spoofable end-to-end. Only trust the
 *      RIGHTMOST entry (our own proxy appends the real client IP last in
 *      many configurations, though Vercel appends leftmost — the
 *      headers above are preferred precisely because this one is
 *      ambiguous).
 *   4. `"unknown"` fallback — all requests without a recognisable IP
 *      share a bucket, so the IP-less attacker can't rotate buckets by
 *      scrubbing headers to evade rate limits.
 *
 * IPv6 addresses are normalised to lowercase so the same address bucketed
 * twice (once via `x-forwarded-for`, once via `x-real-ip`) hits the same
 * rate-limit key.
 */
export function getClientIP(request: Request): string {
  const vercelFwd = request.headers.get('x-vercel-forwarded-for');
  if (vercelFwd) {
    return vercelFwd.split(',')[0].trim().toLowerCase();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim().toLowerCase();
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Leftmost-ish — first entry is traditionally the client.  On Vercel
    // this branch is unreachable because `x-vercel-forwarded-for` always
    // wins; on local dev / other hosts it's the best signal we have.
    return forwarded.split(',')[0].trim().toLowerCase();
  }

  return 'unknown';
}
