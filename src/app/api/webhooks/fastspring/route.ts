import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { convertUsdToSar, getOfficialPlanPriceUsd } from '@/lib/billing-config';
import { sendPaymentReceiptEmail } from '@/lib/email';
import { verifyFastSpringWebhookSignature } from '@/lib/fastspring';

export const dynamic = 'force-dynamic';

type FastSpringPayload = Record<string, unknown>;
type PlanInterval = 'MONTHLY' | 'YEARLY';

function toStringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function extractObject(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function extractEventType(payload: FastSpringPayload) {
    const state = toStringValue(payload.state)?.toLowerCase();
    const status = toStringValue(payload.status)?.toLowerCase();

    if (status === 'successful') return 'subscription.charge.completed';
    if (status === 'failed') return 'subscription.charge.failed';
    if (state === 'canceled' || state === 'cancelled') return 'subscription.canceled';
    if (state === 'deactivated') return 'subscription.deactivated';
    if (state === 'active' || payload.active === true) return 'subscription.activated';
    if (payload.return || payload.refund || payload.refunded === true) return 'return.created';
    return 'order.completed';
}

function extractProductPath(payload: FastSpringPayload) {
    const directProduct = extractObject(payload.product);
    if (directProduct) {
        return toStringValue(directProduct.path) || toStringValue(directProduct.id);
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const item of items) {
        const itemObject = extractObject(item);
        const product = extractObject(itemObject?.product);
        const path = toStringValue(product?.path) || toStringValue(product?.id);
        if (path) return path;
    }

    const order = extractObject(payload.order);
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    for (const item of orderItems) {
        const itemObject = extractObject(item);
        const product = extractObject(itemObject?.product);
        const path = toStringValue(product?.path) || toStringValue(product?.id);
        if (path) return path;
    }

    return undefined;
}

function extractSubscriptionId(payload: FastSpringPayload) {
    const directSubscription = payload.subscription;
    if (typeof directSubscription === 'string') {
        return directSubscription;
    }
    if (extractEventType(payload).startsWith('subscription.')) {
        return toStringValue(payload.id) || toStringValue(payload.subscriptionId);
    }

    const order = extractObject(payload.order);
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    for (const item of orderItems) {
        const itemObject = extractObject(item);
        const subscriptionId = toStringValue(itemObject?.subscription);
        if (subscriptionId) return subscriptionId;
    }

    return undefined;
}

function extractOrderId(payload: FastSpringPayload) {
    const reference = toStringValue(payload.reference);
    if (reference) return reference;

    const order = extractObject(payload.order);
    return toStringValue(order?.id) || toStringValue(payload.id);
}

function extractEmail(payload: FastSpringPayload) {
    const tags = extractObject(payload.tags);
    const tagEmail = toStringValue(tags?.userEmail);
    if (tagEmail) return tagEmail.toLowerCase();

    const paymentContact = extractObject(payload.paymentContact);
    const contactEmail = toStringValue(paymentContact?.email) || toStringValue(paymentContact?.emailAddress);
    if (contactEmail) return contactEmail.toLowerCase();

    const account = extractObject(payload.account);
    const accountContact = extractObject(account?.contact);
    const accountEmail =
        toStringValue(accountContact?.email)
        || toStringValue(account?.email)
        || toStringValue(accountContact?.emailAddress);
    if (accountEmail) return accountEmail.toLowerCase();

    const order = extractObject(payload.order);
    const customer = extractObject(order?.customer);
    const customerEmail = toStringValue(customer?.email);
    return customerEmail?.toLowerCase();
}

function extractUserId(payload: FastSpringPayload) {
    const tags = extractObject(payload.tags);
    return toStringValue(tags?.userId);
}

function extractAmountUsd(payload: FastSpringPayload, interval: PlanInterval) {
    const candidateValues = [
        payload.total,
        payload.value,
        payload.amount,
        extractObject(payload.order)?.total,
    ];

    for (const candidate of candidateValues) {
        if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
        if (typeof candidate === 'string') {
            const parsed = Number(candidate);
            if (Number.isFinite(parsed)) return parsed;
        }
    }

    return getOfficialPlanPriceUsd('pro', interval === 'YEARLY' ? 'yearly' : 'monthly');
}

function resolveInterval(productPath?: string): PlanInterval {
    return productPath === 'pro-yearly' ? 'YEARLY' : 'MONTHLY';
}

function resolvePeriodEnd(payload: FastSpringPayload, interval: PlanInterval, now: Date) {
    return (
        parseDate(payload.next)
        || parseDate(payload.nextChargeDate)
        || parseDate(payload.end)
        || addMonths(now, interval === 'YEARLY' ? 12 : 1)
    );
}

async function findUserForPayload(payload: FastSpringPayload) {
    const taggedUserId = extractUserId(payload);
    if (taggedUserId) {
        const userById = await prisma.user.findUnique({
            where: { id: taggedUserId },
            select: { id: true, email: true, name: true },
        });
        if (userById) return userById;
    }

    const email = extractEmail(payload);
    if (email) {
        const userByEmail = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true },
        });
        if (userByEmail) return userByEmail;
    }

    const subscriptionId = extractSubscriptionId(payload);
    if (!subscriptionId) return null;

    const existingPayment = await prisma.paymentTransaction.findFirst({
        where: {
            provider: 'FASTSPRING' as never,
            providerReference: subscriptionId,
            userId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: {
            user: {
                select: { id: true, email: true, name: true },
            },
        },
    });

    return existingPayment?.user || null;
}

async function createOrUpdatePaymentTransaction(params: {
    orderId?: string;
    subscriptionId?: string;
    userId: string;
    amountUsd: number;
    interval: PlanInterval;
    eventType: string;
    payload: FastSpringPayload;
}) {
    if (!params.orderId) return false;

    const existing = await prisma.paymentTransaction.findUnique({
        where: { providerTransactionId: params.orderId },
        select: { id: true },
    });

    if (existing) {
        return false;
    }

    await prisma.paymentTransaction.create({
        data: {
            provider: 'FASTSPRING' as never,
            status: 'PAID',
            purpose: 'SUBSCRIPTION',
            userId: params.userId,
            amountSar: convertUsdToSar(params.amountUsd),
            currency: 'USD',
            plan: 'PRO',
            interval: params.interval,
            providerTransactionId: params.orderId,
            providerReference: params.subscriptionId,
            metadata: {
                officialAmountUsd: params.amountUsd,
                officialCurrency: 'USD',
                fastspringEventType: params.eventType,
                fastspringPayload: JSON.stringify(params.payload).substring(0, 4000),
            },
            paidAt: new Date(),
        },
    });

    return true;
}

async function upsertSubscription(params: {
    userId: string;
    interval: PlanInterval;
    periodEnd: Date;
    cancelAtPeriodEnd: boolean;
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
    downgradeToFree?: boolean;
}) {
    const now = new Date();
    const data = params.downgradeToFree
        ? {
            plan: 'FREE' as const,
            status: params.status,
            currentPeriodStart: now,
            currentPeriodEnd: params.periodEnd,
            cancelAtPeriodEnd: false,
        }
        : {
            plan: 'PRO' as const,
            status: params.status,
            currentPeriodStart: now,
            currentPeriodEnd: params.periodEnd,
            cancelAtPeriodEnd: params.cancelAtPeriodEnd,
        };

    await prisma.subscription.upsert({
        where: { userId: params.userId },
        update: data,
        create: {
            userId: params.userId,
            ...data,
        },
    });
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'FastSpring webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: Request) {
    const rawBody = await request.text();
    const signatureHeader =
        request.headers.get('x-fs-signature')
        || request.headers.get('x-signature')
        || request.headers.get('x-fastspring-signature');

    if (!verifyFastSpringWebhookSignature(rawBody, signatureHeader)) {
        logger.warn('FastSpring webhook signature mismatch', {
            signatureHeader: signatureHeader || undefined,
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: FastSpringPayload;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = extractEventType(payload);
    const productPath = extractProductPath(payload);
    if (productPath && productPath !== 'pro-monthly' && productPath !== 'pro-yearly') {
        return NextResponse.json({ received: true, ignored: true });
    }

    const interval = resolveInterval(productPath);
    const subscriptionId = extractSubscriptionId(payload);
    const orderId = extractOrderId(payload);
    const now = new Date();
    const user = await findUserForPayload(payload);

    if (!user) {
        logger.warn('FastSpring webhook user could not be resolved', {
            eventType,
            orderId,
            subscriptionId,
        });
        return NextResponse.json({ received: true, ignored: true });
    }

    if (eventType === 'order.completed' || eventType === 'subscription.charge.completed') {
        const amountUsd = extractAmountUsd(payload, interval);
        const createdPayment = await createOrUpdatePaymentTransaction({
            orderId,
            subscriptionId,
            userId: user.id,
            amountUsd,
            interval,
            eventType,
            payload,
        });

        await upsertSubscription({
            userId: user.id,
            interval,
            periodEnd: resolvePeriodEnd(payload, interval, now),
            cancelAtPeriodEnd: false,
            status: 'ACTIVE',
        });

        if (createdPayment) {
            sendPaymentReceiptEmail({
                to: user.email,
                name: user.name || undefined,
                planLabel: 'Pro',
                intervalLabel: interval === 'YEARLY' ? 'Yearly' : 'Monthly',
                amountSar: convertUsdToSar(amountUsd),
                amountUsd,
                paidAt: now,
                receiptId: orderId || subscriptionId || user.id,
            }).catch((error) => {
                logger.error('Failed to send FastSpring payment receipt', {
                    error: error as Error,
                    userId: user.id,
                });
            });
        }
    } else if (eventType === 'subscription.activated') {
        await upsertSubscription({
            userId: user.id,
            interval,
            periodEnd: resolvePeriodEnd(payload, interval, now),
            cancelAtPeriodEnd: false,
            status: 'ACTIVE',
        });
    } else if (eventType === 'subscription.canceled') {
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
            select: { currentPeriodEnd: true },
        });
        await upsertSubscription({
            userId: user.id,
            interval,
            periodEnd: existingSubscription?.currentPeriodEnd || resolvePeriodEnd(payload, interval, now),
            cancelAtPeriodEnd: true,
            status: 'ACTIVE',
        });
    } else if (eventType === 'subscription.deactivated') {
        await upsertSubscription({
            userId: user.id,
            interval,
            periodEnd: now,
            cancelAtPeriodEnd: false,
            status: 'CANCELED',
            downgradeToFree: true,
        });
    } else if (eventType === 'subscription.charge.failed') {
        await upsertSubscription({
            userId: user.id,
            interval,
            periodEnd: resolvePeriodEnd(payload, interval, now),
            cancelAtPeriodEnd: false,
            status: 'PAST_DUE',
        });
    } else {
        logger.info('FastSpring webhook event ignored', { eventType, userId: user.id });
    }

    logger.paymentEvent('fastspring_webhook_processed', user.id, undefined, {
        eventType,
        orderId,
        subscriptionId,
    });

    return NextResponse.json({ received: true, eventType });
}
