import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || '30d';

        // Calculate date range
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

        // Get key metrics
        const [
            totalUsers,
            newUsers,
            totalResumes,
            newResumes,
            totalExports,
            newExports,
            activeSubscribers,
            aiUsage
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: startDate }
                }
            }),
            prisma.resume.count({ where: { deletedAt: null } }),
            prisma.resume.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: startDate }
                }
            }),
            prisma.export.count(),
            prisma.export.count({
                where: { createdAt: { gte: startDate } }
            }),
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    plan: { in: ['PRO', 'ENTERPRISE'] }
                }
            }),
            prisma.usageRecord.count({
                where: {
                    type: 'AI_GENERATION',
                    createdAt: { gte: startDate }
                }
            })
        ]);

        // Get daily user signups for chart
        const dailySignups = await prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
                deletedAt: null
            },
            _count: true,
            orderBy: { createdAt: 'asc' }
        });

        // Get plan distribution
        const planDistribution = await prisma.subscription.groupBy({
            by: ['plan'],
            where: { status: 'ACTIVE' },
            _count: true
        });

        // Get resume creation by day
        const resumesByDay = await prisma.resume.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
                deletedAt: null
            },
            _count: true,
            orderBy: { createdAt: 'asc' }
        });

        // Get export format distribution
        const exportFormats = await prisma.export.groupBy({
            by: ['format'],
            where: { createdAt: { gte: startDate } },
            _count: true
        });

        // Calculate conversion funnel
        const freeUsers = await prisma.subscription.count({
            where: { plan: 'FREE' }
        });

        const paidUsers = await prisma.subscription.count({
            where: {
                status: 'ACTIVE',
                plan: { in: ['PRO', 'ENTERPRISE'] }
            }
        });

        const usersWithResumes = await prisma.user.count({
            where: {
                deletedAt: null,
                resumes: { some: {} }
            }
        });

        const usersWithExports = await prisma.user.count({
            where: {
                deletedAt: null,
                exports: { some: {} }
            }
        });

        // Calculate revenue
        const proCount = planDistribution.find(p => p.plan === 'PRO')?._count || 0;
        const enterpriseCount = planDistribution.find(p => p.plan === 'ENTERPRISE')?._count || 0;
        const monthlyRevenue = (proCount * 29.99) + (enterpriseCount * 99.99);

        return NextResponse.json({
            overview: {
                totalUsers,
                newUsers,
                totalResumes,
                newResumes,
                totalExports,
                newExports,
                activeSubscribers,
                aiUsage,
                monthlyRevenue: monthlyRevenue.toFixed(2)
            },
            charts: {
                dailySignups: dailySignups.map(d => ({
                    date: d.createdAt,
                    count: d._count
                })),
                resumesByDay: resumesByDay.map(r => ({
                    date: r.createdAt,
                    count: r._count
                }))
            },
            distributions: {
                plans: planDistribution.map(p => ({
                    plan: p.plan,
                    count: p._count
                })),
                exportFormats: exportFormats.map(e => ({
                    format: e.format,
                    count: e._count
                }))
            },
            funnel: {
                visitors: totalUsers * 10, // Estimated
                signups: totalUsers,
                resumesCreated: usersWithResumes,
                exports: usersWithExports,
                subscriptions: paidUsers
            },
            period
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
