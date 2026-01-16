import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || '30d';

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const periodMs = now.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodMs);
        const previousEndDate = startDate;

        const [
            totalUsers,
            newUsersThisPeriod,
            newUsersPrevPeriod,
            totalResumes,
            resumesThisPeriod,
            resumesPrevPeriod,
            totalPaidSubscriptions,
            activeSubscriptions,
            paidSubscriptionsThisPeriod,
            paidSubscriptionsPrevPeriod,
            usersWithResumes,
            usersWithExports,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: { deletedAt: null, createdAt: { gte: startDate } },
            }),
            prisma.user.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: previousStartDate, lt: previousEndDate },
                },
            }),
            prisma.resume.count({ where: { deletedAt: null } }),
            prisma.resume.count({
                where: { deletedAt: null, createdAt: { gte: startDate } },
            }),
            prisma.resume.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: previousStartDate, lt: previousEndDate },
                },
            }),
            prisma.subscription.count({
                where: { plan: { in: ['PRO', 'ENTERPRISE'] } },
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: { in: ['PRO', 'ENTERPRISE'] } },
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: { in: ['PRO', 'ENTERPRISE'] },
                    createdAt: { gte: startDate },
                },
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: { in: ['PRO', 'ENTERPRISE'] },
                    createdAt: { gte: previousStartDate, lt: previousEndDate },
                },
            }),
            prisma.user.count({
                where: { deletedAt: null, resumes: { some: {} } },
            }),
            prisma.user.count({
                where: { deletedAt: null, exports: { some: {} } },
            }),
        ]);

        const [planDistribution, activeProCount, activeEnterpriseCount] = await Promise.all([
            prisma.subscription.groupBy({
                by: ['plan'],
                where: { status: 'ACTIVE' },
                _count: true,
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'PRO' },
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'ENTERPRISE' },
            }),
        ]);

        const [newProThisPeriod, newEnterpriseThisPeriod, newProPrevPeriod, newEnterprisePrevPeriod] = await Promise.all([
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: 'PRO',
                    createdAt: { gte: startDate },
                },
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: 'ENTERPRISE',
                    createdAt: { gte: startDate },
                },
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: 'PRO',
                    createdAt: { gte: previousStartDate, lt: previousEndDate },
                },
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: 'ENTERPRISE',
                    createdAt: { gte: previousStartDate, lt: previousEndDate },
                },
            }),
        ]);

        const [dailySignups, dailyResumes] = await Promise.all([
            prisma.$queryRaw<{ date: Date; count: bigint }[]>`
                SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::bigint AS count
                FROM "User"
                WHERE "createdAt" >= ${startDate} AND "deletedAt" IS NULL
                GROUP BY 1
                ORDER BY 1
            `,
            prisma.$queryRaw<{ date: Date; count: bigint }[]>`
                SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::bigint AS count
                FROM "Resume"
                WHERE "createdAt" >= ${startDate} AND "deletedAt" IS NULL
                GROUP BY 1
                ORDER BY 1
            `,
        ]);

        const [aiUsageSummary, aiOperations, aiTopUsers, aiDailyUsage] = await Promise.all([
            prisma.$queryRaw<{ total_requests: bigint; total_tokens: bigint }[]>`
                SELECT
                    COUNT(*)::bigint AS total_requests,
                    COALESCE(SUM((metadata->>'totalTokens')::bigint), 0) AS total_tokens
                FROM "UsageRecord"
                WHERE "type" = 'AI_GENERATION'
                  AND "createdAt" >= ${startDate}
            `,
            prisma.$queryRaw<{ operation: string; requests: bigint; tokens: bigint }[]>`
                SELECT
                    COALESCE(metadata->>'operation', 'unknown') AS operation,
                    COUNT(*)::bigint AS requests,
                    COALESCE(SUM((metadata->>'totalTokens')::bigint), 0) AS tokens
                FROM "UsageRecord"
                WHERE "type" = 'AI_GENERATION'
                  AND "createdAt" >= ${startDate}
                GROUP BY 1
                ORDER BY tokens DESC
                LIMIT 6
            `,
            prisma.$queryRaw<{ id: string; name: string | null; email: string; requests: bigint; tokens: bigint }[]>`
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    COUNT(*)::bigint AS requests,
                    COALESCE(SUM((ur.metadata->>'totalTokens')::bigint), 0) AS tokens
                FROM "UsageRecord" ur
                JOIN "User" u ON u.id = ur."userId"
                WHERE ur."type" = 'AI_GENERATION'
                  AND ur."createdAt" >= ${startDate}
                GROUP BY u.id, u.name, u.email
                ORDER BY tokens DESC
                LIMIT 5
            `,
            prisma.$queryRaw<{ date: Date; requests: bigint; tokens: bigint }[]>`
                SELECT
                    date_trunc('day', "createdAt")::date AS date,
                    COUNT(*)::bigint AS requests,
                    COALESCE(SUM((metadata->>'totalTokens')::bigint), 0) AS tokens
                FROM "UsageRecord"
                WHERE "type" = 'AI_GENERATION'
                  AND "createdAt" >= ${startDate}
                GROUP BY 1
                ORDER BY 1
            `,
        ]);

        const totalActivePlans = planDistribution.reduce((sum, item) => sum + Number(item._count), 0);

        const toGrowth = (current: number, previous: number) =>
            previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

        const totalRevenue = (activeProCount * 39) + (activeEnterpriseCount * 249);
        const revenueThisPeriod = (newProThisPeriod * 39) + (newEnterpriseThisPeriod * 249);
        const revenuePrevPeriod = (newProPrevPeriod * 39) + (newEnterprisePrevPeriod * 249);

        const aiTotals = aiUsageSummary[0] || { total_requests: 0, total_tokens: 0 };
        const aiTotalRequests = Number(aiTotals.total_requests || 0);
        const aiTotalTokens = Number(aiTotals.total_tokens || 0);
        const aiAvgTokensPerRequest = aiTotalRequests > 0 ? aiTotalTokens / aiTotalRequests : 0;

        return NextResponse.json({
            overview: {
                totalUsers,
                newUsersThisPeriod,
                userGrowth: toGrowth(newUsersThisPeriod, newUsersPrevPeriod),
                totalResumes,
                resumesThisPeriod,
                resumeGrowth: toGrowth(resumesThisPeriod, resumesPrevPeriod),
                totalSubscriptions: totalPaidSubscriptions,
                activeSubscriptions,
                subscriptionGrowth: toGrowth(paidSubscriptionsThisPeriod, paidSubscriptionsPrevPeriod),
                totalRevenue,
                revenueThisPeriod,
                revenueGrowth: toGrowth(revenueThisPeriod, revenuePrevPeriod),
            },
            charts: {
                dailySignups: dailySignups.map((row) => ({
                    date: row.date.toISOString(),
                    count: Number(row.count),
                })),
                dailyResumes: dailyResumes.map((row) => ({
                    date: row.date.toISOString(),
                    count: Number(row.count),
                })),
            },
            planDistribution: planDistribution.map((plan) => ({
                plan: plan.plan,
                count: Number(plan._count),
                percentage: totalActivePlans > 0 ? (Number(plan._count) / totalActivePlans) * 100 : 0,
            })),
            conversionFunnel: {
                registeredUsers: totalUsers,
                usersWithResumes,
                exports: usersWithExports,
                activeSubscriptions,
                enterpriseSubscriptions: activeEnterpriseCount,
            },
            aiUsage: {
                totalRequests: aiTotalRequests,
                totalTokens: aiTotalTokens,
                avgTokensPerRequest: aiAvgTokensPerRequest,
                operations: aiOperations.map((row) => ({
                    operation: row.operation,
                    requests: Number(row.requests),
                    tokens: Number(row.tokens),
                })),
                topUsers: aiTopUsers.map((row) => ({
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    requests: Number(row.requests),
                    tokens: Number(row.tokens),
                })),
                daily: aiDailyUsage.map((row) => ({
                    date: row.date.toISOString(),
                    requests: Number(row.requests),
                    tokens: Number(row.tokens),
                })),
            },
            period,
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
