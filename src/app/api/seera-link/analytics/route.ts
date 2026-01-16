import { headers } from 'next/headers';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db';
import { success, handleZodError } from '@/lib/api-response';
import { analyticsEventSchema } from '@/lib/seera-link/schemas';
import { hashVisitor, getDeviceType, getCountryFromIP } from '@/lib/seera-link/analytics';
import { checkRateLimit, getRateLimitKey, getClientIP, rateLimitConfigs } from '@/lib/seera-link/rate-limit';

// POST /api/seera-link/analytics - Log analytics event (public endpoint)
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const ip = getClientIP(headersList);
    const userAgent = headersList.get('user-agent') || '';

    // Rate limit: 100 events per minute per IP
    const rateLimitKey = getRateLimitKey('analytics', ip);
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      rateLimitConfigs.analytics.limit,
      rateLimitConfigs.analytics.windowSeconds
    );

    if (!rateLimit.allowed) {
      // For analytics, silently accept but don't log to prevent abuse
      return success({ logged: false, reason: 'rate_limited' });
    }

    const body = await request.json();
    const data = analyticsEventSchema.parse(body);

    // Verify profile exists and is published (without exposing details)
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: data.profileId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!profile) {
      // Silently fail for invalid profiles (security: don't reveal if profile exists)
      return success({ logged: true });
    }

    // Get country from IP (async, may fail)
    const country = await getCountryFromIP(ip);

    // Create analytics event
    await prisma.seeraProfileAnalytics.create({
      data: {
        profileId: data.profileId,
        eventType: data.eventType,
        ctaType: data.ctaType || null,
        visitorHash: hashVisitor(ip, userAgent),
        deviceType: getDeviceType(userAgent),
        referrer: data.referrer || null,
        country,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
      },
    });

    return success({ logged: true });
  } catch (error) {
    // For analytics, we don't want to expose errors
    // Just log them and return success
    if (error instanceof ZodError) {
      console.warn('Analytics validation error:', error.errors);
    } else {
      console.error('Analytics logging error:', error);
    }

    // Always return success for analytics to prevent information leakage
    return success({ logged: true });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
