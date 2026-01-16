import { prisma } from '@/lib/db';

/**
 * Simple database-based rate limiting
 * For production at scale, consider using Redis for better performance
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if a request is allowed based on rate limits
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  try {
    // Clean old records and count in a transaction
    const [, count] = await prisma.$transaction([
      // Clean up old records for this key
      prisma.rateLimitRecord.deleteMany({
        where: {
          key,
          windowStart: { lt: windowStart },
        },
      }),
      // Count recent requests
      prisma.rateLimitRecord.count({
        where: {
          key,
          windowStart: { gte: windowStart },
        },
      }),
    ]);

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
      };
    }

    // Record this request
    await prisma.rateLimitRecord.create({
      data: {
        key,
        endpoint: 'seera-link',
        windowStart: now,
      },
    });

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: windowEnd,
    };
  } catch (error) {
    // On database error, allow the request but log the error
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: limit,
      resetAt: windowEnd,
    };
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Analytics event logging - generous limit
  analytics: {
    limit: 100,
    windowSeconds: 60, // 100 per minute
  },
  // Password verification - strict to prevent brute force
  passwordVerify: {
    limit: 5,
    windowSeconds: 900, // 5 per 15 minutes
  },
  // Profile creation - moderate
  createProfile: {
    limit: 10,
    windowSeconds: 3600, // 10 per hour
  },
  // Public profile access - generous
  profileView: {
    limit: 60,
    windowSeconds: 60, // 60 per minute per IP
  },
  // Slug check - moderate
  slugCheck: {
    limit: 30,
    windowSeconds: 60, // 30 per minute
  },
};

/**
 * Helper to generate rate limit key
 */
export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}
