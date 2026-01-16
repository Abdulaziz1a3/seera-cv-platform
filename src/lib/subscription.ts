import { prisma } from '@/lib/db';

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription || subscription.plan === 'FREE') {
        return false;
    }

    return ACTIVE_STATUSES.has(subscription.status);
}
