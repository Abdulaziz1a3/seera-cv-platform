import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
    createFastSpringAccountManagementUrl,
    extractFastSpringAccountId,
    getFastSpringSubscription,
    isFastSpringConfigured,
} from '@/lib/fastspring';
import { logger } from '@/lib/logger';

function extractObject(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function toStringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFastSpringConfigured()) {
        return NextResponse.json({ error: 'FastSpring is not configured' }, { status: 503 });
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
        },
    });

    const now = new Date();
    const hasActivePaidSubscription = Boolean(
        subscription
        && subscription.plan === 'PRO'
        && (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
        && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd >= now)
    );

    if (!hasActivePaidSubscription) {
        return NextResponse.json({ error: 'No active FastSpring subscription found' }, { status: 400 });
    }

    const payments = await prisma.paymentTransaction.findMany({
        where: {
            userId: session.user.id,
            provider: 'FASTSPRING' as never,
            purpose: 'SUBSCRIPTION',
            status: 'PAID',
        },
        orderBy: [
            { paidAt: 'desc' },
            { createdAt: 'desc' },
        ],
        select: {
            id: true,
            providerReference: true,
            metadata: true,
        },
        take: 5,
    });

    let accountId: string | undefined;
    let paymentIdToUpdate: string | undefined;

    for (const payment of payments) {
        const metadata = extractObject(payment.metadata);
        const metadataAccountId = toStringValue(metadata?.fastspringAccountId);
        if (metadataAccountId) {
            accountId = metadataAccountId;
            break;
        }

        const subscriptionId =
            toStringValue(metadata?.fastspringSubscriptionId)
            || toStringValue(payment.providerReference);

        if (!subscriptionId) {
            continue;
        }

        try {
            const fastSpringSubscription = await getFastSpringSubscription(subscriptionId);
            const resolvedAccountId = extractFastSpringAccountId(fastSpringSubscription?.account);
            if (!resolvedAccountId) {
                continue;
            }

            accountId = resolvedAccountId;
            paymentIdToUpdate = payment.id;
            break;
        } catch (error) {
            logger.warn('Failed to resolve FastSpring account from subscription', {
                userId: session.user.id,
                subscriptionId,
                error: error as Error,
            });
        }
    }

    if (!accountId) {
        return NextResponse.json({ error: 'Unable to locate FastSpring account for this subscription' }, { status: 404 });
    }

    if (paymentIdToUpdate) {
        const payment = payments.find((entry) => entry.id === paymentIdToUpdate);
        const metadata = extractObject(payment?.metadata) || {};
        await prisma.paymentTransaction.update({
            where: { id: paymentIdToUpdate },
            data: {
                metadata: {
                    ...metadata,
                    fastspringAccountId: accountId,
                },
            },
        }).catch(() => null);
    }

    const url = await createFastSpringAccountManagementUrl(accountId);
    logger.info('FastSpring management portal created', {
        userId: session.user.id,
        accountId,
    });

    return NextResponse.json({ url });
}
