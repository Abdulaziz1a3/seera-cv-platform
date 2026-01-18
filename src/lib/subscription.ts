import { prisma } from '@/lib/db';

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            subscription: {
                select: {
                    plan: true,
                    status: true,
                    currentPeriodEnd: true,
                },
            },
        },
    });

    if (!user) {
        return false;
    }

    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    const subscription = user.subscription;
    if (!subscription || subscription.plan === 'FREE') {
        return false;
    }

    if (!ACTIVE_STATUSES.has(subscription.status)) {
        return false;
    }

    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
        return false;
    }

    return true;
}
