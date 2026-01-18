import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/stripe';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { planId, billing, userId } = await request.json();

        if (!planId || !['pro', 'enterprise'].includes(planId)) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        if (!billing || !['monthly', 'yearly'].includes(billing)) {
            return NextResponse.json(
                { error: 'Invalid billing period' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const planConfig = PLANS[planId as 'pro' | 'enterprise'];
        const amountSar = billing === 'yearly' ? planConfig.priceYearly : planConfig.priceMonthly;
        const customer = await getUserPaymentProfile(userId);

        const bill = await createTuwaiqPayBill({
            amountSar,
            description: `Seera AI ${planConfig.name.en} (${billing})`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'SUBSCRIPTION',
                userId,
                amountSar,
                plan: planId.toUpperCase() as 'PRO' | 'ENTERPRISE',
                interval: billing === 'yearly' ? 'YEARLY' : 'MONTHLY',
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                metadata: {
                    interval: billing,
                    planId,
                    billExpiresAt: bill.expireDate,
                },
            },
        });

        return NextResponse.json({ url: bill.link });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
