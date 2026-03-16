// Billing Checkout API
// Creates TuwaiqPay bill links for subscription upgrades

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getGatewayPlanPriceSar, getOfficialPlanPriceUsd } from '@/lib/billing-config';
import { createFastSpringCheckoutSession, getFastSpringProductPath, isFastSpringConfigured } from '@/lib/fastspring';

const checkoutSchema = z.object({
    plan: z.enum(['pro', 'enterprise']),
    interval: z.enum(['monthly', 'yearly']),
});

// POST /api/billing/checkout - Create checkout session
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan, interval } = checkoutSchema.parse(body);
        if (plan === 'enterprise') {
            return NextResponse.json(
                { error: 'Enterprise plan is currently unavailable' },
                { status: 400 }
            );
        }

        // Validate plan exists
        const planConfig = PLANS[plan];
        if (!planConfig) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // Get base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
        const returnUrl = `${baseUrl}/dashboard/billing?fastspringCheckout=1`;

        if (plan === 'pro' && isFastSpringConfigured()) {
            const checkout = await createFastSpringCheckoutSession({
                productPath: getFastSpringProductPath(interval),
                userId: session.user.id,
                userEmail: session.user.email || '',
                userName: session.user.name,
                returnUrl,
            });

            logger.paymentEvent('fastspring_checkout_created', session.user.id, getOfficialPlanPriceUsd(plan, interval), {
                plan,
                interval,
                sessionId: checkout.sessionId,
            });

            return NextResponse.json({ url: checkout.url });
        }

        const amountSar = getGatewayPlanPriceSar(plan, interval);
        const officialAmountUsd = getOfficialPlanPriceUsd(plan, interval);
        const customer = await getUserPaymentProfile(session.user.id);

        const intervalLabel = interval === 'yearly' ? 'Annual' : 'Monthly';
        const bill = await createTuwaiqPayBill({
            amountSar,
            description: `Seera AI - ${planConfig.name.en} Plan (${intervalLabel}) - Official price $${officialAmountUsd.toFixed(2)} USD (charged ${amountSar} SAR at checkout)`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
            returnUrl,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'SUBSCRIPTION',
                userId: session.user.id,
                amountSar,
                plan: plan.toUpperCase() as 'PRO' | 'ENTERPRISE',
                interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                metadata: {
                    interval,
                    planId: plan,
                    officialAmountUsd,
                    officialCurrency: 'USD',
                    billExpiresAt: bill.expireDate,
                },
            },
        });

        logger.paymentEvent('tuwaiqpay_bill_created', session.user.id, amountSar, {
            plan,
            interval,
            billId: bill.billId,
        });

        logger.info('Checkout session created', {
            userId: session.user.id,
            plan,
            interval,
        });

        return NextResponse.json({ url: bill.link });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create checkout session';
        logger.error('Checkout error', { error: error as Error });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        if (message === 'Phone number is required for payments') {
            return NextResponse.json(
                { error: message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
