import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const checkoutSchema = z.object({
    plan: z.enum(['pro', 'enterprise']),
    interval: z.enum(['monthly', 'yearly']),
    recipientEmail: z.string().email().optional().or(z.literal('')),
    message: z.string().max(300).optional().or(z.literal('')),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan, interval, recipientEmail, message } = checkoutSchema.parse(body);
        if (plan === 'enterprise') {
            return NextResponse.json(
                { error: 'Enterprise plan is currently unavailable' },
                { status: 400 }
            );
        }

        const planConfig = PLANS[plan];
        const amountSar = interval === 'yearly' ? planConfig.priceYearly : planConfig.priceMonthly;
        const customer = await getUserPaymentProfile(session.user.id);
        const intervalLabel = interval === 'yearly' ? 'Annual' : 'Monthly';
        const bill = await createTuwaiqPayBill({
            amountSar,
            description: `Seera AI - Gift ${planConfig.name.en} Plan (${intervalLabel}) - ${amountSar} SAR`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'GIFT',
                userId: session.user.id,
                amountSar,
                plan: plan.toUpperCase() as 'PRO' | 'ENTERPRISE',
                interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                recipientEmail: recipientEmail?.trim() || undefined,
                message: message?.trim() || undefined,
                metadata: {
                    interval,
                    planId: plan,
                    billExpiresAt: bill.expireDate,
                },
            },
        });

        logger.paymentEvent('tuwaiqpay_gift_bill_created', session.user.id, amountSar, {
            plan,
            interval,
            billId: bill.billId,
            recipientEmail,
        });

        logger.info('Gift checkout session created', {
            userId: session.user.id,
            plan,
            interval,
            recipientEmail,
        });

        return NextResponse.json({ url: bill.link });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create gift checkout session';
        logger.error('Gift checkout error', { error: error as Error });
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        if (message === 'Phone number is required for payments') {
            return NextResponse.json({ error: message }, { status: 400 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
