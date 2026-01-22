import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { MIN_RECHARGE_SAR, MAX_RECHARGE_SAR, sarToCredits } from '@/lib/ai-credits';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const requestSchema = z.object({
    amountSar: z.number().min(MIN_RECHARGE_SAR).max(MAX_RECHARGE_SAR),
    returnUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amountSar } = requestSchema.parse(body);

        const customer = await getUserPaymentProfile(session.user.id);
        const credits = sarToCredits(amountSar);

        // Get base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
        const returnUrl = `${baseUrl}/dashboard/billing?paymentComplete=1&type=credits`;

        const bill = await createTuwaiqPayBill({
            amountSar,
            description: `Seera AI - AI Credits Top-up (${credits} credits) - ${amountSar} SAR`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
            returnUrl,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'AI_CREDITS',
                userId: session.user.id,
                amountSar,
                credits,
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                metadata: {
                    credits,
                    billExpiresAt: bill.expireDate,
                },
            },
        });

        logger.paymentEvent('tuwaiqpay_credit_bill_created', session.user.id, amountSar, {
            credits,
            billId: bill.billId,
        });

        return NextResponse.json({ url: bill.link });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start credit recharge';
        const status = message === 'Phone number is required for payments' ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
