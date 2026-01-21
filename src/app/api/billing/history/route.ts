import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                userId: session.user.id,
                status: 'PAID',
            },
            orderBy: {
                paidAt: 'desc',
            },
            select: {
                id: true,
                purpose: true,
                amountSar: true,
                plan: true,
                interval: true,
                credits: true,
                paidAt: true,
                providerTransactionId: true,
                providerBillId: true,
                recipientEmail: true,
            },
            take: 50,
        });

        const history = transactions.map((tx) => ({
            id: tx.id,
            purpose: tx.purpose,
            description: getTransactionDescription(tx),
            amountSar: tx.amountSar,
            paidAt: tx.paidAt?.toISOString() || null,
            receiptId: tx.providerBillId || tx.providerTransactionId || tx.id,
            plan: tx.plan,
            interval: tx.interval,
            credits: tx.credits,
            recipientEmail: tx.recipientEmail,
        }));

        return NextResponse.json({ history });
    } catch (error) {
        console.error('Failed to fetch billing history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch billing history' },
            { status: 500 }
        );
    }
}

function getTransactionDescription(tx: {
    purpose: string;
    plan?: string | null;
    interval?: string | null;
    credits?: number | null;
    recipientEmail?: string | null;
}): string {
    switch (tx.purpose) {
        case 'SUBSCRIPTION': {
            const planLabel = tx.plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro';
            const intervalLabel = tx.interval === 'YEARLY' ? 'Yearly' : 'Monthly';
            return `${planLabel} Subscription (${intervalLabel})`;
        }
        case 'AI_CREDITS': {
            const creditsLabel = tx.credits ? `${tx.credits} credits` : 'AI Credits';
            return `AI Credits Top-up (${creditsLabel})`;
        }
        case 'GIFT': {
            const planLabel = tx.plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro';
            const intervalLabel = tx.interval === 'YEARLY' ? 'Yearly' : 'Monthly';
            return `Gift ${planLabel} (${intervalLabel})${tx.recipientEmail ? ` to ${tx.recipientEmail}` : ''}`;
        }
        default:
            return 'Payment';
    }
}
