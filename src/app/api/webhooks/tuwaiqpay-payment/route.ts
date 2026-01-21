import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getWebhookVerificationConfig } from '@/lib/tuwaiqpay';
import { recordAICreditTopup } from '@/lib/ai-credits';
import { sendGiftSubscriptionEmail, sendPaymentReceiptEmail, sendPaymentFailureEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const GIFT_CLAIM_WINDOW_DAYS = 90;

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function isPaymentSuccess(status?: string): boolean {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return ['PAID', 'PENDING_SETTLEMENT', 'SUCCESS'].includes(normalized);
}

function isPaymentFailure(status?: string): boolean {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return ['FAILED', 'DECLINED', 'CANCELED', 'CANCELLED', 'EXPIRED'].includes(normalized);
}

export async function POST(request: Request) {
    const { headerName, headerValue } = getWebhookVerificationConfig();
    const signature = request.headers.get(headerName);
    const signatureValue = signature ? signature.trim() : '';
    if (!signatureValue || signatureValue.toLowerCase() !== headerValue.toLowerCase()) {
        logger.warn('TuwaiqPay webhook signature mismatch', { headerName });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    if (!payload?.transactionDetails) {
        logger.warn('TuwaiqPay webhook missing transaction details');
        return NextResponse.json({ received: true });
    }

    const details = payload.transactionDetails;
    const bill = details.bill || {};
    const transactionId = details.transactionId || bill.transactionId || undefined;
    const billId = bill.id ? String(bill.id) : undefined;
    const status = bill.status || details.transactionStatus || '';

    const orFilters: Array<{ providerTransactionId?: string; providerBillId?: string }> = [];
    if (transactionId) orFilters.push({ providerTransactionId: transactionId });
    if (billId) orFilters.push({ providerBillId: billId });

    const payment = await prisma.paymentTransaction.findFirst({
        where: {
            provider: 'TUWAIQPAY',
            ...(orFilters.length > 0 ? { OR: orFilters } : {}),
        },
    });

    if (!payment) {
        logger.warn('TuwaiqPay webhook received for unknown transaction', {
            transactionId,
            billId,
        });
        return NextResponse.json({ received: true });
    }

    if (!isPaymentSuccess(status)) {
        if (isPaymentFailure(status)) {
            const existingMetadata =
                payment.metadata && typeof payment.metadata === 'object'
                    ? (payment.metadata as Record<string, unknown>)
                    : {};
            await prisma.paymentTransaction.updateMany({
                where: { id: payment.id, status: 'PENDING' },
                data: {
                    status: status.toUpperCase() === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
                    metadata: {
                        ...existingMetadata,
                        webhookStatus: status,
                    },
                },
            });

            // Send payment failure notification email
            if (payment.userId) {
                const user = await prisma.user.findUnique({
                    where: { id: payment.userId },
                    select: { email: true, name: true },
                });

                if (user?.email) {
                    const planLabel = (() => {
                        if (payment.purpose === 'SUBSCRIPTION') {
                            return payment.plan === 'ENTERPRISE' ? 'Enterprise Subscription' : 'Pro Subscription';
                        }
                        if (payment.purpose === 'AI_CREDITS') {
                            return payment.credits ? `${payment.credits} AI Credits` : 'AI Credits';
                        }
                        if (payment.purpose === 'GIFT') {
                            return `Gift ${payment.plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro'}`;
                        }
                        return 'Payment';
                    })();

                    const reasonMap: Record<string, string> = {
                        'FAILED': 'Payment was declined',
                        'DECLINED': 'Payment was declined by your bank',
                        'CANCELED': 'Payment was canceled',
                        'CANCELLED': 'Payment was canceled',
                        'EXPIRED': 'Payment link expired',
                    };

                    sendPaymentFailureEmail(user.email, {
                        planLabel,
                        amountSar: payment.amountSar,
                        reason: reasonMap[status.toUpperCase()] || 'Payment could not be processed',
                        name: user.name || undefined,
                    }).catch((error) => {
                        logger.error('Failed to send payment failure email', { error, userId: payment.userId });
                    });
                }
            }
        }
        return NextResponse.json({ received: true });
    }

    const now = new Date();
    let receiptPayload: {
        to: string;
        name?: string;
        planLabel: string;
        intervalLabel: string;
        amountSar: number;
        paidAt: Date;
        receiptId?: string;
        description?: string;
        recipientEmail?: string;
    } | null = null;

    await prisma.$transaction(async (tx) => {
        const existingMetadata =
            payment.metadata && typeof payment.metadata === 'object'
                ? (payment.metadata as Record<string, unknown>)
                : {};
        const updated = await tx.paymentTransaction.updateMany({
            where: { id: payment.id, status: 'PENDING' },
            data: {
                status: 'PAID',
                paidAt: now,
                metadata: {
                    ...existingMetadata,
                    webhookStatus: status,
                    transactionId,
                    billId,
                },
            },
        });

        if (updated.count === 0) {
            return;
        }

        if (payment.purpose === 'AI_CREDITS') {
            if (payment.userId) {
                await recordAICreditTopup({
                    userId: payment.userId,
                    amountSar: payment.amountSar,
                    source: 'tuwaiqpay',
                    reference: transactionId || billId || payment.id,
                });

                const user = await tx.user.findUnique({
                    where: { id: payment.userId },
                    select: { email: true, name: true },
                });

                if (user?.email) {
                    const creditsLabel = payment.credits ? ` (${payment.credits} credits)` : '';
                    receiptPayload = {
                        to: user.email,
                        name: user.name || undefined,
                        planLabel: 'AI Credits',
                        intervalLabel: 'One-time',
                        amountSar: payment.amountSar,
                        paidAt: now,
                        receiptId: billId || transactionId || payment.id,
                        description: `AI credits top-up${creditsLabel}`,
                    };
                }
            }
            return;
        }

        if (payment.purpose === 'SUBSCRIPTION') {
            if (!payment.userId) return;
            const intervalMonths = payment.interval === 'YEARLY' ? 12 : 1;
            const plan = payment.plan || 'PRO';
            const subscription = await tx.subscription.findUnique({
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

            if (subscription) {
                await tx.subscription.update({
                    where: { userId: payment.userId },
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
                        userId: payment.userId,
                        plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
            }

            const user = await tx.user.findUnique({
                where: { id: payment.userId },
                select: { email: true, name: true },
            });

            if (user?.email) {
                receiptPayload = {
                    to: user.email,
                    name: user.name || undefined,
                    planLabel: plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro',
                    intervalLabel: payment.interval === 'YEARLY' ? 'Yearly' : 'Monthly',
                    amountSar: payment.amountSar,
                    paidAt: now,
                    receiptId: billId || transactionId || payment.id,
                };
            }
            return;
        }

        if (payment.purpose === 'GIFT') {
            if (!payment.userId) return;
            const existingGift = payment.giftId
                ? await tx.giftSubscription.findUnique({ where: { id: payment.giftId } })
                : null;
            if (existingGift) return;

            const token = crypto.randomBytes(24).toString('hex');
            const expiresAt = new Date(now.getTime() + GIFT_CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000);
            const plan = payment.plan || 'PRO';
            const interval = payment.interval || 'MONTHLY';

            const gift = await tx.giftSubscription.create({
                data: {
                    token,
                    createdByUserId: payment.userId,
                    recipientEmail: payment.recipientEmail || null,
                    message: payment.message || null,
                    plan,
                    interval,
                    status: 'PENDING',
                    amountSar: payment.amountSar,
                    expiresAt,
                },
            });

            await tx.paymentTransaction.update({
                where: { id: payment.id },
                data: { giftId: gift.id },
            });

            if (gift.recipientEmail) {
                const buyer = await tx.user.findUnique({
                    where: { id: payment.userId },
                    select: { name: true },
                });
                sendGiftSubscriptionEmail(gift.recipientEmail, {
                    senderName: buyer?.name || undefined,
                    planId: plan === 'ENTERPRISE' ? 'enterprise' : 'pro',
                    interval: interval === 'YEARLY' ? 'yearly' : 'monthly',
                    message: gift.message || undefined,
                    token: gift.token,
                    expiresAt,
                }).catch((error) => {
                    logger.error('Failed to send gift email', { error, giftId: gift.id });
                });
            }

            const buyer = await tx.user.findUnique({
                where: { id: payment.userId },
                select: { email: true, name: true },
            });

            if (buyer?.email) {
                receiptPayload = {
                    to: buyer.email,
                    name: buyer.name || undefined,
                    planLabel: `Gift ${plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro'}`,
                    intervalLabel: interval === 'YEARLY' ? 'Yearly' : 'Monthly',
                    amountSar: payment.amountSar,
                    paidAt: now,
                    receiptId: billId || transactionId || payment.id,
                    recipientEmail: gift.recipientEmail || undefined,
                    description: 'Gift subscription purchase',
                };
            }
        }
    });

    if (receiptPayload) {
        sendPaymentReceiptEmail(receiptPayload).catch((error) => {
            logger.error('Failed to send payment receipt email', { error, userId: payment.userId || undefined });
        });
    }

    logger.paymentEvent('tuwaiqpay_payment_received', payment.userId || 'unknown', payment.amountSar, {
        purpose: payment.purpose,
        transactionId,
        billId,
    });

    return NextResponse.json({ received: true });
}
