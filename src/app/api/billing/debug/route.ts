// Debug endpoint to check payment status - TEMPORARY
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkBillStatus, checkTransactionStatus } from '@/lib/tuwaiqpay';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find ALL payments for this user (not just pending)
        const allPayments = await prisma.paymentTransaction.findMany({
            where: {
                userId: session.user.id,
                provider: 'TUWAIQPAY',
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Find pending payments
        const pendingPayments = allPayments.filter(p => p.status === 'PENDING');

        // Check TuwaiqPay status for each pending payment
        const tuwaiqpayStatuses = [];
        for (const payment of pendingPayments) {
            let billStatus = null;
            let transactionStatus = null;

            if (payment.providerBillId) {
                try {
                    billStatus = await checkBillStatus(payment.providerBillId);
                } catch (error) {
                    billStatus = { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            }

            if (payment.providerTransactionId) {
                try {
                    transactionStatus = await checkTransactionStatus(payment.providerTransactionId);
                } catch (error) {
                    transactionStatus = { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            }

            tuwaiqpayStatuses.push({
                paymentId: payment.id,
                purpose: payment.purpose,
                amount: payment.amountSar,
                status: payment.status,
                providerBillId: payment.providerBillId,
                providerTransactionId: payment.providerTransactionId,
                createdAt: payment.createdAt,
                billStatus,
                transactionStatus,
            });
        }

        // Get subscription status
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            user: {
                id: session.user.id,
                email: session.user.email,
            },
            subscription,
            allPaymentsCount: allPayments.length,
            pendingPaymentsCount: pendingPayments.length,
            allPayments: allPayments.map(p => ({
                id: p.id,
                purpose: p.purpose,
                amount: p.amountSar,
                status: p.status,
                providerBillId: p.providerBillId,
                createdAt: p.createdAt,
            })),
            tuwaiqpayStatuses,
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Debug failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
