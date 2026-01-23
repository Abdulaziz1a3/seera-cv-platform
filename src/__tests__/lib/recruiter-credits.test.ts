/**
 * Recruiter credits tests
 */

const tx = {
    recruiterCreditLedger: {
        aggregate: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    cvUnlock: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('@/lib/db', () => ({
    prisma: {
        recruiterCreditLedger: {
            aggregate: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        cvUnlock: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(tx)),
    },
}));

import { prisma } from '@/lib/db';
import {
    getRecruiterCreditBalance,
    grantMonthlyCredits,
    purchaseCredits,
    unlockCandidateCV,
} from '@/lib/recruiter-credits';

describe('recruiter credits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns recruiter credit balance', async () => {
        (prisma.recruiterCreditLedger.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 8 } });
        const balance = await getRecruiterCreditBalance('recruiter-1');
        expect(balance).toBe(8);
    });

    it('grants monthly credits once per reference', async () => {
        (prisma.recruiterCreditLedger.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });
        await grantMonthlyCredits({ recruiterId: 'recruiter-1', reference: 'sub:1' });
        expect(prisma.recruiterCreditLedger.create).not.toHaveBeenCalled();
    });

    it('purchases credits only once per reference', async () => {
        (prisma.recruiterCreditLedger.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });
        await purchaseCredits({ recruiterId: 'recruiter-1', amount: 10, reference: 'payment:1' });
        expect(prisma.recruiterCreditLedger.create).not.toHaveBeenCalled();
    });

    it('unlocks candidate without double spending', async () => {
        (tx.cvUnlock.findUnique as jest.Mock).mockResolvedValue({ id: 'unlock-1' });
        (tx.recruiterCreditLedger.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 4 } });

        const result = await unlockCandidateCV({ recruiterId: 'recruiter-1', candidateId: 'cand-1' });

        expect(result.alreadyUnlocked).toBe(true);
        expect(result.balance).toBe(4);
        expect(tx.recruiterCreditLedger.create).not.toHaveBeenCalled();
    });

    it('returns insufficient credits error when balance is low', async () => {
        (tx.cvUnlock.findUnique as jest.Mock).mockResolvedValue(null);
        (tx.recruiterCreditLedger.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });

        await expect(unlockCandidateCV({ recruiterId: 'recruiter-1', candidateId: 'cand-1' }))
            .rejects
            .toThrow('INSUFFICIENT_CREDITS');
    });

    it('spends one credit when unlocking a new candidate', async () => {
        (tx.cvUnlock.findUnique as jest.Mock).mockResolvedValue(null);
        (tx.recruiterCreditLedger.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 2 } });
        (tx.cvUnlock.create as jest.Mock).mockResolvedValue({ id: 'unlock-2' });

        const result = await unlockCandidateCV({ recruiterId: 'recruiter-1', candidateId: 'cand-2' });

        expect(result.alreadyUnlocked).toBe(false);
        expect(tx.cvUnlock.create).toHaveBeenCalled();
        expect(tx.recruiterCreditLedger.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    recruiterId: 'recruiter-1',
                    type: 'SPEND_UNLOCK',
                    amount: -1,
                    cvUnlockId: 'unlock-2',
                }),
            })
        );
    });
});
