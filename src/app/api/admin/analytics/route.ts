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

        const totalActivePlans = planDistribution.reduce((sum, item) => sum + Number(item._count), 0);

        const toGrowth = (current: number, previous: number) =>
            previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

        const totalRevenue = (activeProCount * 39) + (activeEnterpriseCount * 249);
        const revenueThisPeriod = (newProThisPeriod * 39) + (newEnterpriseThisPeriod * 249);
        const revenuePrevPeriod = (newProPrevPeriod * 39) + (newEnterprisePrevPeriod * 249);

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
