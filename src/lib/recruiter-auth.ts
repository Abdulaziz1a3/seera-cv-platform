import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function requireEnterpriseRecruiter() {
    const session = await auth();
    if (!session?.user?.id) {
        return { allowed: false, status: 401, error: 'Unauthorized' as const };
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { plan: true, status: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
        return { allowed: false, status: 402, error: 'Subscription required' as const };
    }

    if (subscription.plan !== 'ENTERPRISE') {
        return { allowed: false, status: 403, error: 'Enterprise plan required' as const };
    }

    return { allowed: true, userId: session.user.id };
}
