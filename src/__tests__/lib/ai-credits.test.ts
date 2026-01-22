/**
 * AI Credits Management Tests - Seera AI Production Readiness
 * Tests credit calculation, conversion, and cost functions
 */

// Mock prisma and logger
jest.mock('@/lib/db', () => ({
    prisma: {
        subscription: {
            findUnique: jest.fn(),
        },
        usageRecord: {
            aggregate: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    },
}));

import {
    BASE_MONTHLY_CREDITS,
    PRO_MONTHLY_CREDITS,
    SAR_PER_CREDIT,
    MIN_RECHARGE_SAR,
    MAX_RECHARGE_SAR,
    sarToCredits,
    creditsToSar,
    calculateChatCostUsd,
    calculateTtsCostUsd,
    calculateCreditsFromUsd,
    buildCreditErrorPayload,
    getCreditSummary,
    recordAICreditUsage,
    recordAICreditTopup,
} from '@/lib/ai-credits';

import { prisma } from '@/lib/db';

describe('AI Credits Constants', () => {
    it('has correct base monthly credits', () => {
        expect(BASE_MONTHLY_CREDITS).toBe(10);
    });

    it('has correct pro monthly credits', () => {
        expect(PRO_MONTHLY_CREDITS).toBe(50);
    });

    it('has correct pricing', () => {
        expect(SAR_PER_CREDIT).toBe(0.2);
        expect(MIN_RECHARGE_SAR).toBe(5);
        expect(MAX_RECHARGE_SAR).toBe(10);
    });
});

describe('sarToCredits', () => {
    it('converts SAR to credits correctly', () => {
        // 1 SAR / 0.2 SAR per credit = 5 credits
        expect(sarToCredits(1)).toBe(5);
        expect(sarToCredits(10)).toBe(50);
    });

    it('handles decimal values', () => {
        expect(sarToCredits(0.5)).toBe(2.5);
    });

    it('handles zero', () => {
        expect(sarToCredits(0)).toBe(0);
    });
});

describe('creditsToSar', () => {
    it('converts credits to SAR correctly', () => {
        // 5 credits * 0.2 SAR = 1 SAR
        expect(creditsToSar(5)).toBe(1);
        expect(creditsToSar(50)).toBe(10);
    });

    it('handles decimal values', () => {
        expect(creditsToSar(2.5)).toBe(0.5);
    });

    it('handles zero', () => {
        expect(creditsToSar(0)).toBe(0);
    });
});

describe('calculateChatCostUsd', () => {
    it('calculates cost for gpt-4o-mini', () => {
        const cost = calculateChatCostUsd({
            model: 'gpt-4o-mini',
            promptTokens: 1000,
            completionTokens: 1000,
        });
        // 1k prompt * 0.00015 + 1k completion * 0.0006 = 0.00075
        expect(cost).toBeCloseTo(0.00075, 5);
    });

    it('calculates cost for gpt-4o', () => {
        const cost = calculateChatCostUsd({
            model: 'gpt-4o',
            promptTokens: 1000,
            completionTokens: 1000,
        });
        // 1k prompt * 0.005 + 1k completion * 0.015 = 0.02
        expect(cost).toBeCloseTo(0.02, 5);
    });

    it('falls back to gpt-4o-mini pricing for unknown models', () => {
        const cost = calculateChatCostUsd({
            model: 'unknown-model',
            promptTokens: 1000,
            completionTokens: 1000,
        });
        expect(cost).toBeCloseTo(0.00075, 5);
    });

    it('handles zero tokens', () => {
        const cost = calculateChatCostUsd({
            model: 'gpt-4o-mini',
            promptTokens: 0,
            completionTokens: 0,
        });
        expect(cost).toBe(0);
    });
});

describe('calculateTtsCostUsd', () => {
    it('calculates cost for tts-1', () => {
        const cost = calculateTtsCostUsd({
            model: 'tts-1',
            text: 'a'.repeat(1000),
        });
        // 1k chars * 0.015 = 0.015
        expect(cost).toBeCloseTo(0.015, 5);
    });

    it('calculates cost for tts-1-hd', () => {
        const cost = calculateTtsCostUsd({
            model: 'tts-1-hd',
            text: 'a'.repeat(1000),
        });
        // 1k chars * 0.03 = 0.03
        expect(cost).toBeCloseTo(0.03, 5);
    });

    it('falls back to tts-1 for unknown models', () => {
        const cost = calculateTtsCostUsd({
            model: 'unknown',
            text: 'a'.repeat(1000),
        });
        expect(cost).toBeCloseTo(0.015, 5);
    });

    it('handles empty text', () => {
        const cost = calculateTtsCostUsd({
            model: 'tts-1',
            text: '',
        });
        // Min 1 char
        expect(cost).toBeGreaterThan(0);
    });
});

describe('calculateCreditsFromUsd', () => {
    it('converts USD to SAR and credits', () => {
        const result = calculateCreditsFromUsd(1);
        // 1 USD * 3.75 = 3.75 SAR
        // 3.75 SAR / 0.2 = 18.75 credits
        expect(result.costSar).toBeCloseTo(3.75, 2);
        expect(result.credits).toBeCloseTo(18.75, 2);
    });

    it('handles zero', () => {
        const result = calculateCreditsFromUsd(0);
        expect(result.costSar).toBe(0);
        expect(result.credits).toBe(0);
    });
});

describe('buildCreditErrorPayload', () => {
    it('builds error payload with credit summary', () => {
        const summary = {
            baseCredits: 10,
            topupCredits: 0,
            usedCredits: 10,
            remainingCredits: 0,
            availableCredits: 0,
            resetAt: new Date(),
            minRechargeSar: 5,
            maxRechargeSar: 10,
            sarPerCredit: 0.2,
        };

        const payload = buildCreditErrorPayload(summary);
        expect(payload.error).toBe('AI credits exhausted');
        expect(payload.code).toBe('AI_CREDITS_EXCEEDED');
        expect(payload.credits).toEqual(summary);
    });
});

describe('getCreditSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns free plan credits when no subscription', async () => {
        (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.usageRecord.aggregate as jest.Mock).mockResolvedValue({ _sum: { credits: 0 } });

        const summary = await getCreditSummary('user-123');

        expect(summary.baseCredits).toBe(10);
        expect(summary.remainingCredits).toBe(10);
    });

    it('returns pro plan credits for active PRO subscription', async () => {
        (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 86400000),
        });
        (prisma.usageRecord.aggregate as jest.Mock).mockResolvedValue({ _sum: { credits: 0 } });

        const summary = await getCreditSummary('user-123');

        expect(summary.baseCredits).toBe(50);
    });

    it('calculates remaining credits correctly', async () => {
        (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.usageRecord.aggregate as jest.Mock)
            .mockResolvedValueOnce({ _sum: { credits: 5 } }) // used
            .mockResolvedValueOnce({ _sum: { credits: 10 } }); // topup

        const summary = await getCreditSummary('user-123');

        // 10 base + 10 topup - 5 used = 15
        expect(summary.baseCredits).toBe(10);
        expect(summary.topupCredits).toBe(10);
        expect(summary.usedCredits).toBe(5);
        expect(summary.remainingCredits).toBe(15);
    });

    it('returns zero for negative available credits', async () => {
        (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.usageRecord.aggregate as jest.Mock)
            .mockResolvedValueOnce({ _sum: { credits: 20 } }) // used more than available
            .mockResolvedValueOnce({ _sum: { credits: 0 } });

        const summary = await getCreditSummary('user-123');

        expect(summary.remainingCredits).toBe(0);
        expect(summary.availableCredits).toBe(-10);
    });
});

describe('recordAICreditUsage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates usage record', async () => {
        (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});

        await recordAICreditUsage({
            userId: 'user-123',
            model: 'gpt-4o-mini',
            provider: 'openai',
            operation: 'optimize_resume',
            promptTokens: 500,
            completionTokens: 200,
            totalTokens: 700,
            costUsd: 0.001,
            costSar: 0.00375,
            credits: 0.02,
        });

        expect(prisma.usageRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-123',
                type: 'AI_GENERATION',
                count: 1,
            }),
        });
    });
});

describe('recordAICreditTopup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates topup record and returns credits', async () => {
        (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});

        const credits = await recordAICreditTopup({
            userId: 'user-123',
            amountSar: 10,
            source: 'stripe',
            reference: 'ref-123',
        });

        expect(credits).toBe(50); // 10 SAR / 0.2 = 50 credits
        expect(prisma.usageRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-123',
                type: 'AI_CREDIT_TOPUP',
                credits: 50,
            }),
        });
    });
});
