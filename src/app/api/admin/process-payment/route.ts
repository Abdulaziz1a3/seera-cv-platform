// Admin API to manually process a pending payment
// Use this to fix payments that weren't processed by the webhook

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

// GET - List pending payments
export async function GET() {
    const session = await auth();
    if (!session?.user || session.user.email !== process.env.SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingPayments = await prisma.paymentTransaction.findMany({
        where: {
            status: 'PENDING',
            provider: 'TUWAIQPAY',
        },
        include: {
            user: {
                select: {
                    email: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return NextResponse.json({ payments: pendingPayments });
}

// POST - Manually process a payment
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || session.user.email !== process.env.SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, userEmail } = await request.json();

    if (!paymentId && !userEmail) {
        return NextResponse.json(
            { error: 'Either paymentId or userEmail is required' },
            { status: 400 }
        );
    }

    // Find the payment
    let payment;
    if (paymentId) {
        payment = await prisma.paymentTransaction.findUnique({
            where: { id: paymentId },
        });
    } else if (userEmail) {
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        payment = await prisma.paymentTransaction.findFirst({
            where: {
                userId: user.id,
                status: 'PENDING',
                provider: 'TUWAIQPAY',
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'PENDING') {
        return NextResponse.json(
            { error: `Payment already processed with status: ${payment.status}` },
            { status: 400 }
        );
    }

    const now = new Date();

    // Process based on purpose
    if (payment.purpose === 'SUBSCRIPTION') {
        if (!payment.userId) {
            return NextResponse.json({ error: 'Payment has no associated user' }, { status: 400 });
        }

        const intervalMonths = payment.interval === 'YEARLY' ? 12 : 1;
        const plan = payment.plan || 'PRO';

        const subscription = await prisma.subscription.findUnique({
            where: { userId: payment.userId },
        });

        const baseEnd =
            subscription?.currentPeriodEnd && subscription.currentPeriodEnd > now
                ? subscription.currentPeriodEnd
                : now;
        const periodStart =
            subscription?.currentPeriodStart && subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
                ? subscription.currentPeriodStart
                : now;
        const periodEnd = addMonths(baseEnd, intervalMonths);

        await prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.paymentTransaction.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    paidAt: now,
                    metadata: {
                        ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
                        manuallyProcessed: true,
                        processedBy: session.user.email,
                        processedAt: now.toISOString(),
                    },
                },
            });

            // Create or update subscription
            if (subscription) {
                await tx.subscription.update({
                    where: { userId: payment.userId! },
                    data: {
                        plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            } else {
                await tx.subscription.create({
                    data: {
                        userId: payment.userId!,
                        plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            }
        });

        logger.info('Payment manually processed', {
            paymentId: payment.id,
            userId: payment.userId,
            plan,
            processedBy: session.user.email,
        });

        return NextResponse.json({
            success: true,
            message: `User upgraded to ${plan} until ${periodEnd.toISOString()}`,
            payment: {
                id: payment.id,
                status: 'PAID',
            },
            subscription: {
                plan,
                periodEnd: periodEnd.toISOString(),
            },
        });
    }

    return NextResponse.json(
        { error: `Unsupported payment purpose: ${payment.purpose}` },
        { status: 400 }
    );
}
