import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const claimSchema = z.object({
    token: z.string().min(20),
});

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { token } = claimSchema.parse(body);
        const now = new Date();

        const gift = await prisma.giftSubscription.findUnique({
            where: { token },
        });

        if (!gift) {
            return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
        }

        if (gift.status !== 'PENDING') {
            return NextResponse.json({ error: 'Gift already claimed or inactive' }, { status: 409 });
        }

        if (gift.expiresAt && gift.expiresAt < now) {
            await prisma.giftSubscription.update({
                where: { token },
                data: { status: 'EXPIRED' },
            });
            return NextResponse.json({ error: 'Gift expired' }, { status: 410 });
        }

        if (gift.recipientEmail && gift.recipientEmail.toLowerCase() !== session.user.email.toLowerCase()) {
            return NextResponse.json(
                { error: 'This gift is reserved for a different email' },
                { status: 403 }
            );
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        const hasActivePaidSubscription = subscription
            && subscription.plan !== 'FREE'
            && (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
            && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd >= now);

        const durationMonths = gift.interval === 'YEARLY' ? 12 : 1;
        const baseEnd = hasActivePaidSubscription && subscription?.currentPeriodEnd && subscription.currentPeriodEnd > now
            ? subscription.currentPeriodEnd
            : now;
        const periodStart = hasActivePaidSubscription && subscription?.currentPeriodStart
            ? subscription.currentPeriodStart
            : now;
        const periodEnd = addMonths(baseEnd, durationMonths);

        await prisma.$transaction(async (tx) => {
            if (subscription) {
                await tx.subscription.update({
                    where: { userId: session.user.id },
                    data: {
                        plan: gift.plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                    },
                });
            } else {
                await tx.subscription.create({
                    data: {
                        userId: session.user.id,
                        plan: gift.plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            }

            await tx.giftSubscription.update({
                where: { token },
                data: {
                    status: 'REDEEMED',
                    redeemedAt: now,
                    redeemedByUserId: session.user.id,
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Failed to claim gift' }, { status: 500 });
    }
}
