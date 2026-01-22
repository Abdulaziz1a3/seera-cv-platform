import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
        },
    });

    const plan = subscription?.plan || 'FREE';
    const status = subscription?.status || 'UNPAID';
    // isActive means user has an active PAID subscription (not FREE)
    const isActive = plan !== 'FREE'
        && (status === 'ACTIVE' || status === 'TRIALING')
        && (!subscription?.currentPeriodEnd || subscription.currentPeriodEnd >= new Date());

    return NextResponse.json({
        plan,
        status,
        isActive,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
    });
}
