import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success, errors, handleError } from '@/lib/api-response';
import { getAnalyticsRetentionDays } from '@/lib/seera-link/analytics';
import { hasActiveSubscription } from '@/lib/subscription';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/seera-link/[id]/analytics - Get analytics for profile
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
      return errors.subscriptionRequired('Seera Link');
    }

    const { searchParams } = new URL(request.url);
    const requestedDays = parseInt(searchParams.get('days') || '7', 10);

    // Get user's subscription to determine retention period
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      select: { plan: true },
    });

    const maxDays = getAnalyticsRetentionDays(subscription?.plan || 'FREE');
    const days = Math.min(requestedDays, maxDays);

    // Verify ownership
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });

    if (!profile) {
      return errors.notFound('Profile');
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get aggregated analytics
    const [
      totalViews,
      uniqueViewsResult,
      ctaClicksResult,
      topSourcesResult,
      deviceBreakdown,
    ] = await Promise.all([
      // Total views
      prisma.seeraProfileAnalytics.count({
        where: {
          profileId: id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
        },
      }),

      // Unique views (count distinct visitor hashes)
      prisma.seeraProfileAnalytics.groupBy({
        by: ['visitorHash'],
        where: {
          profileId: id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
        },
      }),

      // CTA clicks by type
      prisma.seeraProfileAnalytics.groupBy({
        by: ['ctaType'],
        where: {
          profileId: id,
          eventType: 'CTA_CLICK',
          createdAt: { gte: since },
          ctaType: { not: null },
        },
        _count: { ctaType: true },
        orderBy: { _count: { ctaType: 'desc' } },
      }),

      // Top UTM sources
      prisma.seeraProfileAnalytics.groupBy({
        by: ['utmSource'],
        where: {
          profileId: id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
          utmSource: { not: null },
        },
        _count: { utmSource: true },
        orderBy: { _count: { utmSource: 'desc' } },
        take: 5,
      }),

      // Device breakdown
      prisma.seeraProfileAnalytics.groupBy({
        by: ['deviceType'],
        where: {
          profileId: id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
        },
        _count: { deviceType: true },
      }),
    ]);

    // Get daily views with raw query for proper date grouping
    const dailyViewsRaw = await prisma.$queryRaw<
      Array<{ date: Date; views: bigint; unique_views: bigint }>
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as views,
        COUNT(DISTINCT "visitorHash") as unique_views
      FROM "seera_profile_analytics"
      WHERE "profileId" = ${id}
        AND "eventType" = 'PAGE_VIEW'
        AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Transform results
    const dailyViews = dailyViewsRaw.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      views: Number(row.views),
      uniqueViews: Number(row.unique_views),
    }));

    // Fill in missing dates with zeros
    const filledDailyViews: typeof dailyViews = [];
    const dateMap = new Map(dailyViews.map((d) => [d.date, d]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      filledDailyViews.push(
        dateMap.get(dateStr) || { date: dateStr, views: 0, uniqueViews: 0 }
      );
    }

    // Calculate top CTA
    const topCta = ctaClicksResult.length > 0
      ? { type: ctaClicksResult[0].ctaType, clicks: ctaClicksResult[0]._count.ctaType }
      : null;

    return success({
      period: days,
      maxPeriod: maxDays,
      totalViews,
      uniqueViews: uniqueViewsResult.length,
      topCta,
      ctaClicks: ctaClicksResult.map((c) => ({
        type: c.ctaType,
        clicks: c._count.ctaType,
      })),
      topSources: topSourcesResult.map((s) => ({
        source: s.utmSource,
        views: s._count.utmSource,
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.deviceType || 'unknown',
        count: d._count.deviceType,
      })),
      dailyViews: filledDailyViews,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return handleError(error);
  }
}
