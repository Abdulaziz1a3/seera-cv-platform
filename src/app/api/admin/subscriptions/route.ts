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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const plan = searchParams.get('plan') || 'all';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        if (status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (plan !== 'all') {
            where.plan = plan.toUpperCase();
        }

        // Get subscriptions
        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            }),
            prisma.subscription.count({ where })
        ]);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            activeCount,
            proCount,
            enterpriseCount,
            canceledThisMonth,
            newThisMonth
        ] = await Promise.all([
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: { in: ['PRO', 'ENTERPRISE'] } }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'PRO' }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'ENTERPRISE' }
            }),
            prisma.subscription.count({
                where: {
                    status: 'CANCELED',
                    updatedAt: { gte: startOfMonth }
                }
            }),
            prisma.subscription.count({
                where: {
                    createdAt: { gte: startOfMonth },
                    plan: { in: ['PRO', 'ENTERPRISE'] }
                }
            })
        ]);

        // Calculate revenue
        const monthlyRevenue = (proCount * 39) + (enterpriseCount * 249);
        const arpu = activeCount > 0 ? monthlyRevenue / activeCount : 0;
        const churnRate = activeCount > 0 ? ((canceledThisMonth / activeCount) * 100) : 0;

        // Format subscriptions
        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub.id,
            user: {
                id: sub.user.id,
                name: sub.user.name || 'Unknown',
                email: sub.user.email,
                image: sub.user.image
            },
            plan: sub.plan,
            status: sub.status,
            amount: sub.plan === 'PRO' ? 39 : sub.plan === 'ENTERPRISE' ? 249 : 0,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));

        return NextResponse.json({
            subscriptions: formattedSubscriptions,
            stats: {
                monthlyRevenue: monthlyRevenue.toFixed(2),
                activeSubscribers: activeCount,
                churnRate: churnRate.toFixed(1),
                arpu: arpu.toFixed(2),
                proCount,
                enterpriseCount,
                newThisMonth
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscriptionId, action, data } = body;

        if (!subscriptionId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'cancel':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'CANCELED',
                        cancelAtPeriodEnd: true
                    }
                });
                break;

            case 'reactivate':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        cancelAtPeriodEnd: false
                    }
                });
                break;

            case 'change_plan':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: { plan: data.plan }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `subscription.${action}`,
                entity: 'Subscription',
                entityId: subscriptionId,
                details: { action, data }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Admin subscription update error:', error);
        return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
        );
    }
}
