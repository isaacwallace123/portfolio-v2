import { NextRequest, NextResponse } from 'next/server';
import { redis } from './redis';
import { getClientIp } from './ip-extractor';

export const RATE_LIMITS = {
  CONTACT_FORM: { limit: 3, window: 3600 },    // 3 per hour
  TESTIMONIAL: { limit: 2, window: 86400 },    // 2 per day
  IMAGE_UPLOAD: { limit: 5, window: 3600 },    // 5 per hour
};

type RateLimitConfig = { limit: number; window: number };

type RateLimitResult = {
  limited: boolean;
  response?: NextResponse;
  remaining?: number;
};

/**
 * Check rate limit for a request using Redis sliding window
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier: string = 'default'
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `ratelimit:${identifier}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.window * 1000;

  try {
    // Ensure Redis is connected
    if (!redis.isOpen) {
      console.warn('Redis not connected, allowing request (fail open)');
      return { limited: false };
    }

    // Remove old entries outside the window
    await redis.zRemRangeByScore(key, 0, windowStart);

    // Count current entries in window
    const count = await redis.zCard(key);

    if (count >= config.limit) {
      // Rate limited
      const oldestEntry = await redis.zRange(key, 0, 0, { REV: false });
      const oldestTimestamp = oldestEntry.length > 0 ? parseInt(oldestEntry[0]) : now;
      const retryAfter = Math.ceil((oldestTimestamp + config.window * 1000 - now) / 1000);

      return {
        limited: true,
        response: NextResponse.json(
          {
            error: 'Too many requests. Please try again later.',
            retryAfter: `${retryAfter} seconds`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': config.limit.toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        ),
      };
    }

    // Add current request timestamp
    await redis.zAdd(key, { score: now, value: now.toString() });

    // Set expiration on key (cleanup)
    await redis.expire(key, config.window);

    return {
      limited: false,
      remaining: config.limit - count - 1,
    };
  } catch (err) {
    // Graceful degradation: if Redis fails, allow request
    console.error('Rate limit check failed, allowing request:', err);
    return { limited: false };
  }
}
