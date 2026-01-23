import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';

const DEFAULT_MONTHLY_CREDITS = RECRUITER_GROWTH_PLAN.monthlyCredits;

type TxClient = Prisma.TransactionClient | typeof prisma;

async function getBalanceWithClient(recruiterId: string, client: TxClient): Promise<number> {
    const aggregate = await client.recruiterCreditLedger.aggregate({
        where: { recruiterId },
        _sum: { amount: true },
    });
    return aggregate._sum.amount ?? 0;
}

export async function getRecruiterCreditBalance(recruiterId: string): Promise<number> {
    return getBalanceWithClient(recruiterId, prisma);
}

export async function grantMonthlyCredits(params: {
    recruiterId: string;
    subscriptionId?: string | null;
    amount?: number;
    periodEnd?: Date | null;
    reference?: string;
    client?: TxClient;
}): Promise<void> {
    const client = params.client ?? prisma;
    const amount = params.amount ?? DEFAULT_MONTHLY_CREDITS;
    const reference =
        params.reference ||
        `subscription:${params.subscriptionId || 'unknown'}:${params.periodEnd?.toISOString() || 'current'}`;

    const existing = await client.recruiterCreditLedger.findFirst({
        where: {
            recruiterId: params.recruiterId,
            type: 'PERIOD_GRANT',
            reference,
        },
        select: { id: true },
    });

    if (existing) return;

    await client.recruiterCreditLedger.create({
        data: {
            recruiterId: params.recruiterId,
            type: 'PERIOD_GRANT',
            amount,
            subscriptionId: params.subscriptionId || undefined,
            reference,
        },
    });
}

export async function purchaseCredits(params: {
    recruiterId: string;
    amount: number;
    paymentTransactionId?: string | null;
    reference?: string;
    client?: TxClient;
}): Promise<void> {
    const client = params.client ?? prisma;
    const reference = params.reference || (params.paymentTransactionId ? `payment:${params.paymentTransactionId}` : undefined);

    if (reference) {
        const existing = await client.recruiterCreditLedger.findFirst({
            where: {
                recruiterId: params.recruiterId,
                type: 'PURCHASE',
                reference,
            },
            select: { id: true },
        });
        if (existing) return;
    }

    await client.recruiterCreditLedger.create({
        data: {
            recruiterId: params.recruiterId,
            type: 'PURCHASE',
            amount: params.amount,
            paymentTransactionId: params.paymentTransactionId || undefined,
            reference,
        },
    });
}

export async function unlockCandidateCV(params: {
    recruiterId: string;
    candidateId: string;
}): Promise<{ unlockId: string; alreadyUnlocked: boolean; balance: number }> {
    return prisma.$transaction(
        async (tx) => {
            const existing = await tx.cvUnlock.findUnique({
                where: {
                    recruiterId_candidateId: {
                        recruiterId: params.recruiterId,
                        candidateId: params.candidateId,
                    },
                },
            });

            if (existing) {
                const balance = await getBalanceWithClient(params.recruiterId, tx);
                return { unlockId: existing.id, alreadyUnlocked: true, balance };
            }

            const balance = await getBalanceWithClient(params.recruiterId, tx);
            if (balance < 1) {
                throw new Error('INSUFFICIENT_CREDITS');
            }

            const unlock = await tx.cvUnlock.create({
                data: {
                    recruiterId: params.recruiterId,
                    candidateId: params.candidateId,
                },
            });

            await tx.recruiterCreditLedger.create({
                data: {
                    recruiterId: params.recruiterId,
                    type: 'SPEND_UNLOCK',
                    amount: -1,
                    cvUnlockId: unlock.id,
                    reference: `unlock:${unlock.id}`,
                },
            });

            return { unlockId: unlock.id, alreadyUnlocked: false, balance: balance - 1 };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
}
