import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { logger } from '@/lib/logger';
import { RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';
import { requireRecruiterAccount } from '@/lib/recruiter-auth';

export async function POST(request: Request) {
    try {
        const payload = await request.json().catch(() => ({}));
        const intervalValue = typeof payload?.interval === 'string'
            ? payload.interval.toUpperCase()
            : 'MONTHLY';
        const interval = intervalValue === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
        const amountSar = interval === 'YEARLY'
            ? RECRUITER_GROWTH_PLAN.priceYearlySar
            : RECRUITER_GROWTH_PLAN.priceMonthlySar;
        const intervalLabel = interval === 'YEARLY' ? 'Yearly' : 'Monthly';

        const guard = await requireRecruiterAccount();
        if (!guard.allowed) {
            return NextResponse.json({ error: guard.error }, { status: guard.status });
        }
        if (!guard.userId) {
            return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId: guard.userId },
            select: { id: true, plan: true },
        });

        if (!subscription) {
            await prisma.subscription.create({
                data: {
                    userId: guard.userId,
                    plan: 'GROWTH',
                    status: 'UNPAID',
                },
            });
        }

        const customer = await getUserPaymentProfile(guard.userId);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
        const returnUrl = `${baseUrl}/recruiters/billing?paymentComplete=1`;

        const bill = await createTuwaiqPayBill({
            amountSar,
            description: `Seera AI - ${RECRUITER_GROWTH_PLAN.name} (${intervalLabel}) - ${amountSar} SAR`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
            returnUrl,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'SUBSCRIPTION',
                userId: guard.userId,
                amountSar,
                plan: 'GROWTH',
                interval,
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                metadata: {
                    planId: RECRUITER_GROWTH_PLAN.id,
                    billExpiresAt: bill.expireDate,
                },
            },
        });

        logger.paymentEvent('tuwaiqpay_recruiter_growth_created', guard.userId, amountSar, {
            plan: 'growth',
            billId: bill.billId,
        });

        return NextResponse.json({ url: bill.link });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create checkout session';
        logger.error('Recruiter checkout error', { error: error as Error });
        const status = message === 'Phone number is required for payments' ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
