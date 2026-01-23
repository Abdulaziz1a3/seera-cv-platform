import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    let subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
        },
    });

    // Auto-downgrade expired subscriptions to FREE
    if (
        subscription
        && (subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE' || subscription.plan === 'GROWTH')
        && subscription.status === 'ACTIVE'
        && subscription.currentPeriodEnd
        && subscription.currentPeriodEnd < now
    ) {
        try {
            subscription = await prisma.subscription.update({
                where: { userId: session.user.id },
                data: {
                    plan: 'FREE',
                    status: 'CANCELED',
                    cancelAtPeriodEnd: false,
                },
                select: {
                    plan: true,
                    status: true,
                    currentPeriodEnd: true,
                    cancelAtPeriodEnd: true,
                },
            });

            logger.info('Auto-downgraded expired subscription', {
                userId: session.user.id,
                expiredAt: subscription.currentPeriodEnd,
            });
        } catch (error) {
            logger.error('Failed to auto-downgrade subscription', {
                error: error as Error,
                userId: session.user.id,
            });
        }
    }

    const status = subscription?.status || 'UNPAID';
    const isActive = (status === 'ACTIVE' || status === 'TRIALING')
        && (!subscription?.currentPeriodEnd || subscription.currentPeriodEnd >= now);

    return NextResponse.json({
        plan: subscription?.plan || 'FREE',
        status,
        isActive,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
    });
}
