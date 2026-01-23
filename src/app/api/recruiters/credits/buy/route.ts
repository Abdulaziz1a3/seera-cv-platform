import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { logger } from '@/lib/logger';
import { requireRecruiterAccount } from '@/lib/recruiter-auth';
import { getRecruiterCreditPack, RECRUITER_GROWTH_PLAN, RECRUITER_CREDIT_PACKS } from '@/lib/recruiter-billing';

const requestSchema = z.object({
    pack: z.enum(['single', 'pack10', 'pack50']),
});

export async function POST(request: Request) {
    try {
        const guard = await requireRecruiterAccount({ requireActive: true });
        if (!guard.allowed) {
            return NextResponse.json({ error: guard.error }, { status: guard.status });
        }

        const body = await request.json();
        const { pack } = requestSchema.parse(body);
        const packConfig = getRecruiterCreditPack(pack);

        const customer = await getUserPaymentProfile(guard.userId);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';
        const returnUrl = `${baseUrl}/recruiters/billing?paymentComplete=1&type=cv_credits`;

        const bill = await createTuwaiqPayBill({
            amountSar: packConfig.amountSar,
            description: `Seera AI - CV Credits Pack (${packConfig.credits} credits) - ${packConfig.amountSar} SAR`,
            customerName: customer.customerName,
            customerMobilePhone: customer.customerPhone,
            returnUrl,
        });

        await prisma.paymentTransaction.create({
            data: {
                provider: 'TUWAIQPAY',
                status: 'PENDING',
                purpose: 'RECRUITER_CV_CREDITS',
                userId: guard.userId,
                amountSar: packConfig.amountSar,
                credits: packConfig.credits,
                providerTransactionId: bill.transactionId,
                providerBillId: bill.billId ? bill.billId.toString() : undefined,
                providerReference: bill.merchantTransactionId,
                paymentLink: bill.link,
                metadata: {
                    pack,
                    packCredits: packConfig.credits,
                    packAmountSar: packConfig.amountSar,
                    availablePacks: RECRUITER_CREDIT_PACKS,
                    plan: RECRUITER_GROWTH_PLAN.id,
                },
            },
        });

        logger.paymentEvent('tuwaiqpay_recruiter_credit_bill_created', guard.userId, packConfig.amountSar, {
            pack,
            credits: packConfig.credits,
            billId: bill.billId,
        });

        return NextResponse.json({ url: bill.link });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start credit purchase';
        const status = message === 'Phone number is required for payments' ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
