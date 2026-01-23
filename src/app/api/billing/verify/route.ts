// Billing Verification API
// Polls TuwaiqPay to verify payment status and processes successful payments
// This is a fallback when webhooks don't work

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkBillStatus, checkTransactionStatus } from '@/lib/tuwaiqpay';
import { recordAICreditTopup } from '@/lib/ai-credits';
import { grantMonthlyCredits, purchaseCredits } from '@/lib/recruiter-credits';
import { RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';
import { sendGiftSubscriptionEmail } from '@/lib/email';

const GIFT_CLAIM_WINDOW_DAYS = 90;

export const dynamic = 'force-dynamic';

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

// GET /api/billing/verify - Check and process pending payments for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find pending payment for this user
        const pendingPayment = await prisma.paymentTransaction.findFirst({
            where: {
                userId: session.user.id,
                provider: 'TUWAIQPAY',
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!pendingPayment) {
            return NextResponse.json({
                status: 'no_pending',
                message: 'No pending payment found',
            });
        }

        // Try to check status from TuwaiqPay
        let paymentStatus;
        let statusSource = '';

        // First try by bill ID
        if (pendingPayment.providerBillId) {
            try {
                paymentStatus = await checkBillStatus(pendingPayment.providerBillId);
                statusSource = 'billId';
                logger.info('TuwaiqPay bill status check', {
                    billId: pendingPayment.providerBillId,
                    status: paymentStatus.status,
                    isPaid: paymentStatus.isPaid,
                });
            } catch (error) {
                logger.warn('Failed to check bill status', {
                    billId: pendingPayment.providerBillId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        // If bill check failed or returned unknown, try transaction ID
        if (!paymentStatus?.isPaid && pendingPayment.providerTransactionId) {
            try {
                paymentStatus = await checkTransactionStatus(pendingPayment.providerTransactionId);
                statusSource = 'transactionId';
                logger.info('TuwaiqPay transaction status check', {
                    transactionId: pendingPayment.providerTransactionId,
                    status: paymentStatus.status,
                    isPaid: paymentStatus.isPaid,
                });
            } catch (error) {
                logger.warn('Failed to check transaction status', {
                    transactionId: pendingPayment.providerTransactionId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        if (!paymentStatus) {
            return NextResponse.json({
                status: 'check_failed',
                message: 'Could not verify payment status with TuwaiqPay',
                paymentId: pendingPayment.id,
            });
        }

        // If not paid yet, return current status
        if (!paymentStatus.isPaid) {
            return NextResponse.json({
                status: 'pending',
                message: 'Payment is still pending',
                tuwaiqpayStatus: paymentStatus.status,
                paymentId: pendingPayment.id,
            });
        }

        // Payment is confirmed! Process it
        const now = new Date();

        // Handle AI Credits purchase
        if (pendingPayment.purpose === 'AI_CREDITS') {
            await prisma.$transaction(async (tx) => {
                // Update payment status
                await tx.paymentTransaction.update({
                    where: { id: pendingPayment.id },
                    data: {
                        status: 'PAID',
                        paidAt: paymentStatus.paidAt ? new Date(paymentStatus.paidAt) : now,
                        metadata: {
                            ...(typeof pendingPayment.metadata === 'object' && pendingPayment.metadata !== null
                                ? pendingPayment.metadata
                                : {}),
                            verifiedViaPolling: true,
                            pollingSource: statusSource,
                            tuwaiqpayStatus: paymentStatus.status,
                            verifiedAt: now.toISOString(),
                        },
                    },
                });
            });

            // Record AI credit topup (this is outside transaction as it handles its own)
            await recordAICreditTopup({
                userId: session.user.id,
                amountSar: pendingPayment.amountSar,
                source: 'tuwaiqpay',
                reference: pendingPayment.providerTransactionId || pendingPayment.providerBillId || pendingPayment.id,
            });

            logger.paymentEvent('credits_verified_via_polling', session.user.id, pendingPayment.amountSar, {
                credits: pendingPayment.credits,
                statusSource,
            });

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified and credits added',
                credits: pendingPayment.credits,
                amountSar: pendingPayment.amountSar,
            });
        }

        if (pendingPayment.purpose === 'RECRUITER_CV_CREDITS') {
            await prisma.$transaction(async (tx) => {
                await tx.paymentTransaction.update({
                    where: { id: pendingPayment.id },
                    data: {
                        status: 'PAID',
                        paidAt: paymentStatus.paidAt ? new Date(paymentStatus.paidAt) : now,
                        metadata: {
                            ...(typeof pendingPayment.metadata === 'object' && pendingPayment.metadata !== null
                                ? pendingPayment.metadata
                                : {}),
                            verifiedViaPolling: true,
                            pollingSource: statusSource,
                            tuwaiqpayStatus: paymentStatus.status,
                            verifiedAt: now.toISOString(),
                        },
                    },
                });

                if (pendingPayment.userId && pendingPayment.credits) {
                    await purchaseCredits({
                        recruiterId: pendingPayment.userId,
                        amount: Math.round(pendingPayment.credits),
                        paymentTransactionId: pendingPayment.id,
                        reference: pendingPayment.providerTransactionId || pendingPayment.providerBillId || pendingPayment.id,
                        client: tx,
                    });
                }
            });

            logger.paymentEvent('recruiter_credits_verified_via_polling', session.user.id, pendingPayment.amountSar, {
                credits: pendingPayment.credits,
                statusSource,
            });

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified and credits added',
                credits: pendingPayment.credits,
                amountSar: pendingPayment.amountSar,
            });
        }

        if (pendingPayment.purpose === 'SUBSCRIPTION') {
            const intervalMonths = pendingPayment.interval === 'YEARLY' ? 12 : 1;
            const plan = pendingPayment.plan || 'PRO';

            const subscription = await prisma.subscription.findUnique({
                where: { userId: session.user.id },
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
                    where: { id: pendingPayment.id },
                    data: {
                        status: 'PAID',
                        paidAt: paymentStatus.paidAt ? new Date(paymentStatus.paidAt) : now,
                        metadata: {
                            ...(typeof pendingPayment.metadata === 'object' && pendingPayment.metadata !== null
                                ? pendingPayment.metadata
                                : {}),
                            verifiedViaPolling: true,
                            pollingSource: statusSource,
                            tuwaiqpayStatus: paymentStatus.status,
                            verifiedAt: now.toISOString(),
                        },
                    },
                });

                let updatedSubscription = null as typeof subscription | null;

                // Create or update subscription
                if (subscription) {
                    updatedSubscription = await tx.subscription.update({
                        where: { userId: session.user.id },
                        data: {
                            plan,
                            status: 'ACTIVE',
                            currentPeriodStart: periodStart,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd: false,
                        },
                    });
                } else {
                    updatedSubscription = await tx.subscription.create({
                        data: {
                            userId: session.user.id,
                            plan,
                            status: 'ACTIVE',
                            currentPeriodStart: periodStart,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd: false,
                        },
                    });
                }

                if (plan === 'GROWTH' && updatedSubscription) {
                    const periodCredits = pendingPayment.interval === 'YEARLY'
                        ? RECRUITER_GROWTH_PLAN.yearlyCredits
                        : RECRUITER_GROWTH_PLAN.monthlyCredits;
                    await grantMonthlyCredits({
                        recruiterId: session.user.id,
                        subscriptionId: updatedSubscription.id,
                        periodEnd: updatedSubscription.currentPeriodEnd,
                        amount: periodCredits,
                        client: tx,
                    });
                }
            });

            logger.paymentEvent('payment_verified_via_polling', session.user.id, pendingPayment.amountSar, {
                plan,
                interval: pendingPayment.interval,
                statusSource,
            });

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified and subscription activated',
                plan,
                periodEnd: periodEnd.toISOString(),
            });
        }

        // Handle Gift purchase
        if (pendingPayment.purpose === 'GIFT') {
            const token = crypto.randomBytes(24).toString('hex');
            const expiresAt = new Date(now.getTime() + GIFT_CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000);
            const plan = pendingPayment.plan || 'PRO';
            const interval = pendingPayment.interval || 'MONTHLY';

            const gift = await prisma.$transaction(async (tx) => {
                // Update payment status
                await tx.paymentTransaction.update({
                    where: { id: pendingPayment.id },
                    data: {
                        status: 'PAID',
                        paidAt: paymentStatus.paidAt ? new Date(paymentStatus.paidAt) : now,
                        metadata: {
                            ...(typeof pendingPayment.metadata === 'object' && pendingPayment.metadata !== null
                                ? pendingPayment.metadata
                                : {}),
                            verifiedViaPolling: true,
                            pollingSource: statusSource,
                            tuwaiqpayStatus: paymentStatus.status,
                            verifiedAt: now.toISOString(),
                        },
                    },
                });

                // Create gift subscription
                const newGift = await tx.giftSubscription.create({
                    data: {
                        token,
                        createdByUserId: session.user.id,
                        recipientEmail: pendingPayment.recipientEmail || null,
                        message: pendingPayment.message || null,
                        plan,
                        interval,
                        status: 'PENDING',
                        amountSar: pendingPayment.amountSar,
                        expiresAt,
                    },
                });

                // Link gift to payment
                await tx.paymentTransaction.update({
                    where: { id: pendingPayment.id },
                    data: { giftId: newGift.id },
                });

                return newGift;
            });

            // Send email to recipient if provided
            if (gift.recipientEmail) {
                const buyer = await prisma.user.findUnique({
                    where: { id: session.user.id },
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

            logger.paymentEvent('gift_verified_via_polling', session.user.id, pendingPayment.amountSar, {
                plan,
                interval,
                giftId: gift.id,
                statusSource,
            });

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified and gift created',
                giftToken: gift.token,
                recipientEmail: gift.recipientEmail,
            });
        }

        // For other payment types, just mark as paid
        await prisma.paymentTransaction.update({
            where: { id: pendingPayment.id },
            data: {
                status: 'PAID',
                paidAt: paymentStatus.paidAt ? new Date(paymentStatus.paidAt) : now,
                metadata: {
                    ...(typeof pendingPayment.metadata === 'object' && pendingPayment.metadata !== null
                        ? pendingPayment.metadata
                        : {}),
                    verifiedViaPolling: true,
                    pollingSource: statusSource,
                    tuwaiqpayStatus: paymentStatus.status,
                    verifiedAt: now.toISOString(),
                },
            },
        });

        return NextResponse.json({
            status: 'success',
            message: 'Payment verified',
            purpose: pendingPayment.purpose,
        });
    } catch (error) {
        logger.error('Payment verification error', { error: error as Error });
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
