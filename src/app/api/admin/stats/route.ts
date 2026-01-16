import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current date info for comparisons
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Total users
        const totalUsers = await prisma.user.count({
            where: { deletedAt: null }
        });

        const usersLastMonth = await prisma.user.count({
            where: {
                deletedAt: null,
                createdAt: { lt: startOfMonth }
            }
        });

        const usersThisMonth = await prisma.user.count({
            where: {
                deletedAt: null,
                createdAt: { gte: startOfMonth }
            }
        });

        const userGrowth = usersLastMonth > 0
            ? ((usersThisMonth / usersLastMonth) * 100).toFixed(1)
            : '100';

        // Total resumes
        const totalResumes = await prisma.resume.count({
            where: { deletedAt: null }
        });

        const resumesLastMonth = await prisma.resume.count({
            where: {
                deletedAt: null,
                createdAt: { gte: startOfLastMonth, lt: startOfMonth }
            }
        });

        const resumesThisMonth = await prisma.resume.count({
            where: {
                deletedAt: null,
                createdAt: { gte: startOfMonth }
            }
        });

        const resumeGrowth = resumesLastMonth > 0
            ? ((resumesThisMonth / resumesLastMonth) * 100 - 100).toFixed(1)
            : '100';

        // Active subscribers (PRO + ENTERPRISE with ACTIVE status)
        const activeSubscribers = await prisma.subscription.count({
            where: {
                status: 'ACTIVE',
                plan: { in: ['PRO', 'ENTERPRISE'] }
            }
        });

        const subscribersLastMonth = await prisma.subscription.count({
            where: {
                status: 'ACTIVE',
                plan: { in: ['PRO', 'ENTERPRISE'] },
                createdAt: { lt: startOfMonth }
            }
        });

        const subscriberGrowth = subscribersLastMonth > 0
            ? (((activeSubscribers - subscribersLastMonth) / subscribersLastMonth) * 100).toFixed(1)
            : '0';

        // Calculate monthly revenue (simplified - based on active subscriptions)
        const proSubscriptions = await prisma.subscription.count({
            where: { status: 'ACTIVE', plan: 'PRO' }
        });

        const enterpriseSubscriptions = await prisma.subscription.count({
            where: { status: 'ACTIVE', plan: 'ENTERPRISE' }
        });

        // Assuming PRO = SAR 39/mo, ENTERPRISE = SAR 249/mo
        const monthlyRevenue = (proSubscriptions * 39) + (enterpriseSubscriptions * 249);

        // Recent users (last 5)
        const recentUsers = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                subscription: {
                    select: { plan: true }
                }
            }
        });

        // Recent activity from audit logs
        const recentActivity = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // Today's stats
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const newUsersToday = await prisma.user.count({
            where: {
                createdAt: { gte: startOfDay }
            }
        });

        return NextResponse.json({
            stats: {
                totalUsers: {
                    value: totalUsers,
                    change: `+${userGrowth}%`,
                    trend: parseFloat(userGrowth) >= 0 ? 'up' : 'down'
                },
                totalResumes: {
                    value: totalResumes,
                    change: `${parseFloat(resumeGrowth) >= 0 ? '+' : ''}${resumeGrowth}%`,
                    trend: parseFloat(resumeGrowth) >= 0 ? 'up' : 'down'
                },
                activeSubscribers: {
                    value: activeSubscribers,
                    change: `${parseFloat(subscriberGrowth) >= 0 ? '+' : ''}${subscriberGrowth}%`,
                    trend: parseFloat(subscriberGrowth) >= 0 ? 'up' : 'down'
                },
                monthlyRevenue: {
                    value: monthlyRevenue.toFixed(2),
                    change: '+0%',
                    trend: 'up'
                }
            },
            recentUsers: recentUsers.map(user => ({
                id: user.id,
                name: user.name || 'Unknown',
                email: user.email,
                plan: user.subscription?.plan || 'FREE',
                createdAt: user.createdAt
            })),
            recentActivity: recentActivity.map(log => ({
                id: log.id,
                action: log.action,
                entity: log.entity,
                user: log.user?.name || log.user?.email || 'System',
                details: log.details,
                createdAt: log.createdAt
            })),
            todayStats: {
                newUsers: newUsersToday
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
