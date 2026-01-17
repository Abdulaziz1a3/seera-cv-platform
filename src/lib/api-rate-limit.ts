import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface RateLimitOptions {
    key: string;
    limit: number;
    windowMs: number;
    message?: string;
}

export async function enforceRateLimit(
    options: RateLimitOptions
): Promise<NextResponse | null> {
    const { key, limit, windowMs, message } = options;
    const result = await checkRateLimit(key, limit, windowMs);

    if (result.allowed) return null;

    logger.warn('Rate limit exceeded', {
        key,
        limit,
        windowMs,
        retryAfter: result.retryAfter,
    });

    const headers: Record<string, string> = {
        'Retry-After': String(result.retryAfter || Math.ceil(windowMs / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    };

    return NextResponse.json(
        { error: message || 'Too many requests' },
        { status: 429, headers }
    );
}
