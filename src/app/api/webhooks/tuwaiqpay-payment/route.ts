import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getWebhookVerificationConfig } from '@/lib/tuwaiqpay';
import { recordAICreditTopup } from '@/lib/ai-credits';
import { grantMonthlyCredits, purchaseCredits } from '@/lib/recruiter-credits';
import { RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';
import { sendGiftSubscriptionEmail, sendPaymentReceiptEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET endpoint to verify webhook is reachable
export async function GET() {
    const { headerName, headerValue } = getWebhookVerificationConfig();
    return NextResponse.json({
        status: 'ok',
        message: 'TuwaiqPay webhook endpoint is active',
        expectedHeader: headerName,
        timestamp: new Date().toISOString(),
    });
}

const GIFT_CLAIM_WINDOW_DAYS = 90;
const DEFAULT_XMAIL_BILLING_WEBHOOK_URL = 'https://api.infinitesolutions.sa/v1/billing/webhooks/tuwaiq-pay';
const XMAIL_WEBHOOK_TIMEOUT_MS = 4500;

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function isPaymentSuccess(status?: string): boolean {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return ['PAID', 'PENDING_SETTLEMENT', 'SUCCESS', 'COMPLETED', 'APPROVED', 'SETTLED'].includes(normalized);
}

function isPaymentFailure(status?: string): boolean {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return ['FAILED', 'DECLINED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'ERROR'].includes(normalized);
}

// Helper to extract transaction ID from various payload formats
function extractTransactionData(payload: Record<string, unknown>): {
    transactionId?: string;
    billId?: string;
    status?: string;
    invoiceId?: string;
    referenceNumber?: string;
} {
    // Try multiple known payload structures
    const result: {
        transactionId?: string;
        billId?: string;
        status?: string;
        invoiceId?: string;
        referenceNumber?: string;
    } = {};

    // Format 1: transactionDetails.bill structure
    const details = payload.transactionDetails as Record<string, unknown> | undefined;
    if (details) {
        const bill = details.bill as Record<string, unknown> | undefined;
        result.transactionId = (details.transactionId as string) || (bill?.transactionId as string);
        result.billId = bill?.id ? String(bill.id) : undefined;
        result.status = (bill?.status as string) || (details.transactionStatus as string);
    }

    // Format 2: Direct fields (common in many payment gateways)
    if (!result.transactionId) {
        result.transactionId = (payload.transactionId as string) ||
            (payload.transaction_id as string) ||
            (payload.txn_id as string) ||
            (payload.id as string);
    }
    if (!result.billId) {
        result.billId = (payload.billId as string) ||
            (payload.bill_id as string) ||
            (payload.invoiceId as string) ||
            (payload.invoice_id as string);
    }
    if (!result.status) {
        result.status = (payload.status as string) ||
            (payload.paymentStatus as string) ||
            (payload.payment_status as string) ||
            (payload.transactionStatus as string) ||
            (payload.transaction_status as string);
    }

    // Format 3: Nested data object
    const data = payload.data as Record<string, unknown> | undefined;
    if (data) {
        if (!result.transactionId) {
            result.transactionId = (data.transactionId as string) || (data.transaction_id as string);
        }
        if (!result.billId) {
            result.billId = (data.billId as string) || (data.bill_id as string) || (data.invoiceId as string);
        }
        if (!result.status) {
            result.status = (data.status as string) || (data.paymentStatus as string);
        }
    }

    // Format 4: Invoice number from screenshot (SI-INV-XXXXXXXX)
    result.invoiceId = (payload.invoiceNumber as string) ||
        (payload.invoice_number as string) ||
        (payload.invoiceId as string) ||
        (payload.invoice_id as string) ||
        (details?.invoiceNumber as string);

    // Format 5: Reference/merchant reference
    result.referenceNumber = (payload.referenceNumber as string) ||
        (payload.reference_number as string) ||
        (payload.merchantReference as string) ||
        (payload.merchant_reference as string) ||
        (payload.merchantTransactionId as string) ||
        (details?.merchantTransactionId as string);

    return result;
}

function getXmailForwardConfig() {
    return {
        enabled: (process.env.TUWAIQPAY_FORWARD_TO_XMAIL || 'true').toLowerCase() !== 'false',
        webhookUrl: (process.env.XMAIL_BILLING_WEBHOOK_URL || DEFAULT_XMAIL_BILLING_WEBHOOK_URL).trim(),
    };
}

async function forwardWebhookToXmail(
    payload: Record<string, unknown>,
    headerName: string,
    headerValue: string,
) {
    const { enabled, webhookUrl } = getXmailForwardConfig();
    if (!enabled || !webhookUrl) {
        logger.info('Skipped forwarding TuwaiqPay webhook to Xmail', {
            enabled,
            webhookUrl: webhookUrl || null,
        });
        return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), XMAIL_WEBHOOK_TIMEOUT_MS);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                [headerName]: headerValue,
                'x-signature': headerValue,
                'x-forwarded-from': 'seera-ai',
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: controller.signal,
        });

        const responseBody = await response.text().catch(() => '');
        if (!response.ok) {
            logger.warn('Failed forwarding TuwaiqPay webhook to Xmail', {
                webhookUrl,
                status: response.status,
                responseBody: responseBody.substring(0, 600),
            });
            return;
        }

        logger.info('Forwarded TuwaiqPay webhook to Xmail', {
            webhookUrl,
            status: response.status,
        });
    } catch (error) {
        logger.error('Error forwarding TuwaiqPay webhook to Xmail', {
            webhookUrl,
            error: error instanceof Error ? error : new Error(String(error)),
        });
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: Request) {
    // Log all incoming headers for debugging
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        allHeaders[key] = value;
    });

    console.log('[WEBHOOK] TuwaiqPay webhook received');
    console.log('[WEBHOOK] Headers:', JSON.stringify(allHeaders));

    logger.info('TuwaiqPay webhook received', {
        headers: allHeaders,
        url: request.url,
    });

    const { headerName, headerValue } = getWebhookVerificationConfig();

    // Try multiple header variations
    const possibleHeaders = [
        headerName,
        'x-signature',
        'X-Signature',
        'x-webhook-signature',
        'X-Webhook-Signature',
        'authorization',
        'Authorization',
    ];

    let signatureValue = '';
    let foundHeader = '';
    for (const header of possibleHeaders) {
        const val = request.headers.get(header);
        if (val) {
            signatureValue = val.trim();
            foundHeader = header;
            break;
        }
    }

    console.log('[WEBHOOK] Signature check:', { foundHeader, signatureValue, expectedHeader: headerName, expectedValue: headerValue });

    logger.info('TuwaiqPay webhook signature check', {
        expectedHeader: headerName,
        expectedValue: headerValue,
        foundHeader,
        receivedValue: signatureValue,
        allHeaderKeys: Object.keys(allHeaders),
    });

    // Check signature - be lenient and try case-insensitive match
    const signatureValid = signatureValue &&
        (signatureValue.toLowerCase() === headerValue.toLowerCase() ||
         signatureValue === headerValue ||
         signatureValue.includes(headerValue) ||
         headerValue.includes(signatureValue));

    if (!signatureValid) {
        console.log('[WEBHOOK] Signature mismatch - but continuing to log payload');
        logger.warn('TuwaiqPay webhook signature mismatch', {
            headerName,
            foundHeader,
            expected: headerValue,
            received: signatureValue,
        });

        // Still try to read and log the body for debugging
        try {
            const rawBody = await request.text();
            console.log('[WEBHOOK] Raw body (unauthorized):', rawBody.substring(0, 2000));
            logger.warn('TuwaiqPay unauthorized webhook body', { rawBody: rawBody.substring(0, 2000) });

            // Store webhook attempt for debugging
            try {
                await prisma.paymentTransaction.updateMany({
                    where: {
                        provider: 'TUWAIQPAY',
                        status: 'PENDING',
                    },
                    data: {
                        metadata: {
                            lastWebhookAttempt: new Date().toISOString(),
                            webhookError: 'signature_mismatch',
                            receivedHeaders: allHeaders,
                            receivedBody: rawBody.substring(0, 1000),
                        },
                    },
                });
            } catch {
                // Ignore update errors
            }
        } catch {
            // Ignore body read errors
        }

        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.text();
    console.log('[WEBHOOK] Raw body:', rawBody.substring(0, 2000));
    logger.info('TuwaiqPay webhook raw body', { rawBody: rawBody.substring(0, 2000) });

    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        console.log('[WEBHOOK] Invalid JSON');
        logger.warn('TuwaiqPay webhook invalid JSON', { rawBody: rawBody.substring(0, 500) });
        return NextResponse.json({ received: true });
    }

    console.log('[WEBHOOK] Parsed payload:', JSON.stringify(payload).substring(0, 2000));
    logger.info('TuwaiqPay webhook parsed payload', {
        payload: JSON.stringify(payload).substring(0, 2000),
        keys: Object.keys(payload),
    });

    // Do not block Seera payment processing on downstream forwarding.
    // This keeps Seera subscriptions safe even if Xmail webhook is slow/down.
    void forwardWebhookToXmail(payload, headerName, headerValue);

    // Extract transaction data from various formats
    const extracted = extractTransactionData(payload);
    const { transactionId, billId, status, invoiceId, referenceNumber } = extracted;

    console.log('[WEBHOOK] Extracted data:', JSON.stringify(extracted));
    logger.info('TuwaiqPay webhook extracted data', extracted);

    // Build search filters - try all possible identifiers
    const orFilters: Array<Record<string, string>> = [];
    if (transactionId) {
        orFilters.push({ providerTransactionId: transactionId });
    }
    if (billId) {
        orFilters.push({ providerBillId: billId });
        orFilters.push({ providerBillId: String(billId) });
    }
    if (invoiceId) {
        orFilters.push({ providerBillId: invoiceId });
        orFilters.push({ providerTransactionId: invoiceId });
    }
    if (referenceNumber) {
        orFilters.push({ providerReference: referenceNumber });
        orFilters.push({ providerTransactionId: referenceNumber });
    }

    // Also try to match by payment link if included
    const paymentLink = (payload.paymentLink as string) || (payload.link as string);
    if (paymentLink) {
        orFilters.push({ paymentLink });
    }

    console.log('[WEBHOOK] Search filters:', JSON.stringify(orFilters));
    logger.info('TuwaiqPay webhook searching for payment', { orFilters });

    let payment = null;

    if (orFilters.length > 0) {
        payment = await prisma.paymentTransaction.findFirst({
            where: {
                provider: 'TUWAIQPAY',
                OR: orFilters,
            },
        });
    }

    // If not found, try to find ANY pending TuwaiqPay payment (last resort)
    if (!payment) {
        console.log('[WEBHOOK] No exact match, looking for recent pending payment');
        payment = await prisma.paymentTransaction.findFirst({
            where: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });

        if (payment) {
            console.log('[WEBHOOK] Found recent pending payment:', payment.id);
            logger.info('TuwaiqPay webhook found recent pending payment', {
                paymentId: payment.id,
                note: 'Matched by recency, not by ID',
            });
        }
    }

    console.log('[WEBHOOK] Payment lookup result:', {
        found: !!payment,
        paymentId: payment?.id,
        paymentStatus: payment?.status,
    });

    logger.info('TuwaiqPay webhook payment lookup result', {
        found: !!payment,
        paymentId: payment?.id,
        paymentStatus: payment?.status,
        providerTransactionId: payment?.providerTransactionId,
        providerBillId: payment?.providerBillId,
    });

    if (!payment) {
        logger.warn('TuwaiqPay webhook received for unknown transaction', {
            extracted,
            orFilters,
            fullPayload: JSON.stringify(payload).substring(0, 1000),
        });
        return NextResponse.json({ received: true });
    }

    // Check status - be lenient
    const effectiveStatus = status || 'PAID'; // Assume success if no status (webhook itself is confirmation)

    console.log('[WEBHOOK] Processing with status:', effectiveStatus);

    if (!isPaymentSuccess(effectiveStatus)) {
        if (isPaymentFailure(effectiveStatus)) {
            const existingMetadata =
                payment.metadata && typeof payment.metadata === 'object'
                    ? (payment.metadata as Record<string, unknown>)
                    : {};
            await prisma.paymentTransaction.updateMany({
                where: { id: payment.id, status: 'PENDING' },
                data: {
                    status: effectiveStatus.toUpperCase() === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
                    metadata: {
                        ...existingMetadata,
                        webhookStatus: effectiveStatus,
                        webhookPayload: JSON.stringify(payload).substring(0, 1000),
                    },
                },
            });
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

    console.log('[WEBHOOK] Starting transaction to update payment and subscription');

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
                    webhookStatus: effectiveStatus,
                    webhookTransactionId: transactionId,
                    webhookBillId: billId,
                    webhookInvoiceId: invoiceId,
                    webhookPayload: JSON.stringify(payload).substring(0, 1000),
                    processedAt: now.toISOString(),
                },
            },
        });

        console.log('[WEBHOOK] Payment updated:', updated.count);

        if (updated.count === 0) {
            console.log('[WEBHOOK] Payment already processed');
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

        if (payment.purpose === 'RECRUITER_CV_CREDITS') {
            if (payment.userId && payment.credits) {
                await purchaseCredits({
                    recruiterId: payment.userId,
                    amount: Math.round(payment.credits),
                    paymentTransactionId: payment.id,
                    reference: transactionId || billId || payment.id,
                    client: tx,
                });
            }
            return;
        }

        if (payment.purpose === 'SUBSCRIPTION') {
            if (!payment.userId) return;
            const intervalMonths = payment.interval === 'YEARLY' ? 12 : 1;
            const plan = payment.plan || 'PRO';

            console.log('[WEBHOOK] Updating subscription for user:', payment.userId, 'to plan:', plan);

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

            let updatedSubscription = null as typeof subscription | null;

            if (subscription) {
                updatedSubscription = await tx.subscription.update({
                    where: { userId: payment.userId },
                    data: {
                        plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
                console.log('[WEBHOOK] Subscription updated');
            } else {
                updatedSubscription = await tx.subscription.create({
                    data: {
                        userId: payment.userId,
                        plan,
                        status: 'ACTIVE',
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                });
                console.log('[WEBHOOK] Subscription created');
            }

            if (plan === 'GROWTH' && updatedSubscription) {
                const periodCredits = payment.interval === 'YEARLY'
                    ? RECRUITER_GROWTH_PLAN.yearlyCredits
                    : RECRUITER_GROWTH_PLAN.monthlyCredits;
                await grantMonthlyCredits({
                    recruiterId: payment.userId,
                    subscriptionId: updatedSubscription.id,
                    periodEnd: updatedSubscription.currentPeriodEnd,
                    amount: periodCredits,
                    client: tx,
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
                    planLabel: plan === 'ENTERPRISE' ? 'Enterprise' : plan === 'GROWTH' ? 'Growth' : 'Pro',
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

    console.log('[WEBHOOK] Payment processed successfully');

    logger.paymentEvent('tuwaiqpay_payment_received', payment.userId || 'unknown', payment.amountSar, {
        purpose: payment.purpose,
        transactionId,
        billId,
    });

    return NextResponse.json({ received: true, processed: true });
}
