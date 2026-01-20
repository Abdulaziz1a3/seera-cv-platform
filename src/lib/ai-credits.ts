import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const BASE_MONTHLY_CREDITS = 10; // Free plan gets 10 credits
export const PRO_MONTHLY_CREDITS = 50;  // Pro plan gets 50 credits
export const SAR_PER_CREDIT = 0.2; // 10 SAR / 50 credits
export const CREDITS_PER_SAR = 1 / SAR_PER_CREDIT;
export const MIN_RECHARGE_SAR = 5;
export const MAX_RECHARGE_SAR = 10;
const USD_TO_SAR = 3.75;

type ChatPricing = {
    inputUsdPer1k: number;
    outputUsdPer1k: number;
};

const CHAT_PRICING: Record<string, ChatPricing> = {
    'gpt-4o-mini': { inputUsdPer1k: 0.00015, outputUsdPer1k: 0.0006 },
    'gpt-4o': { inputUsdPer1k: 0.005, outputUsdPer1k: 0.015 },
};

const TTS_PRICING_USD_PER_1K_CHARS: Record<string, number> = {
    'tts-1': 0.015,
    'tts-1-hd': 0.03,
};

type CreditSummary = {
    baseCredits: number;
    topupCredits: number;
    usedCredits: number;
    remainingCredits: number;
    availableCredits: number;
    resetAt: Date;
    minRechargeSar: number;
    maxRechargeSar: number;
    sarPerCredit: number;
};

function roundTwo(value: number): number {
    return Math.round(value * 100) / 100;
}

function getPeriodStart(date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getPeriodEnd(date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function usdToSar(usd: number): number {
    return usd * USD_TO_SAR;
}

export function sarToCredits(amountSar: number): number {
    return roundTwo(amountSar * CREDITS_PER_SAR);
}

export function creditsToSar(credits: number): number {
    return roundTwo(credits * SAR_PER_CREDIT);
}

export function calculateChatCostUsd(params: {
    model: string;
    promptTokens: number;
    completionTokens: number;
}): number {
    const pricing = CHAT_PRICING[params.model] || CHAT_PRICING['gpt-4o-mini'];
    const inputCost = (params.promptTokens / 1000) * pricing.inputUsdPer1k;
    const outputCost = (params.completionTokens / 1000) * pricing.outputUsdPer1k;
    return inputCost + outputCost;
}

export function calculateTtsCostUsd(params: { model: string; text: string }): number {
    const per1k = TTS_PRICING_USD_PER_1K_CHARS[params.model] || TTS_PRICING_USD_PER_1K_CHARS['tts-1'];
    const chars = Math.max(params.text.length, 1);
    return (chars / 1000) * per1k;
}

export function calculateCreditsFromUsd(costUsd: number): { costSar: number; credits: number } {
    const costSar = usdToSar(costUsd);
    const credits = sarToCredits(costSar);
    return { costSar: roundTwo(costSar), credits };
}

export async function getCreditSummary(userId: string, now = new Date()): Promise<CreditSummary> {
    const periodStart = getPeriodStart(now);
    const periodEnd = getPeriodEnd(now);

    const [usedAgg, topupAgg] = await Promise.all([
        prisma.usageRecord.aggregate({
            where: { userId, type: 'AI_GENERATION', createdAt: { gte: periodStart, lt: periodEnd } },
            _sum: { credits: true },
        }),
        prisma.usageRecord.aggregate({
            where: { userId, type: 'AI_CREDIT_TOPUP', createdAt: { gte: periodStart, lt: periodEnd } },
            _sum: { credits: true },
        }),
    ]);

    const usedCredits = roundTwo(usedAgg._sum.credits || 0);
    const topupCredits = roundTwo(topupAgg._sum.credits || 0);
    const availableCredits = roundTwo(BASE_MONTHLY_CREDITS + topupCredits - usedCredits);

    return {
        baseCredits: BASE_MONTHLY_CREDITS,
        topupCredits,
        usedCredits,
        remainingCredits: Math.max(0, availableCredits),
        availableCredits,
        resetAt: periodEnd,
        minRechargeSar: MIN_RECHARGE_SAR,
        maxRechargeSar: MAX_RECHARGE_SAR,
        sarPerCredit: SAR_PER_CREDIT,
    };
}

export function buildCreditErrorPayload(summary: CreditSummary) {
    return {
        error: 'AI credits exhausted',
        code: 'AI_CREDITS_EXCEEDED',
        credits: summary,
    };
}

export async function recordAICreditUsage(params: {
    userId: string;
    model: string;
    provider: string;
    operation: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    costSar: number;
    credits: number;
    inputChars?: number;
}): Promise<void> {
    try {
        await prisma.usageRecord.create({
            data: {
                userId: params.userId,
                type: 'AI_GENERATION',
                count: 1,
                credits: params.credits,
                amountSar: params.costSar,
                metadata: {
                    provider: params.provider,
                    model: params.model,
                    operation: params.operation,
                    promptTokens: params.promptTokens,
                    completionTokens: params.completionTokens,
                    totalTokens: params.totalTokens,
                    costUsd: roundTwo(params.costUsd),
                    costSar: params.costSar,
                    credits: params.credits,
                    inputChars: params.inputChars,
                },
            },
        });
    } catch (error) {
        logger.error('Failed to record AI credit usage', {
            error: error as Error,
            userId: params.userId,
        });
    }
}

export async function recordAICreditTopup(params: {
    userId: string;
    amountSar: number;
    source: 'stripe' | 'tuwaiqpay' | 'admin' | 'manual';
    reference?: string;
}): Promise<number> {
    const credits = sarToCredits(params.amountSar);
    try {
        await prisma.usageRecord.create({
            data: {
                userId: params.userId,
                type: 'AI_CREDIT_TOPUP',
                count: 1,
                credits,
                amountSar: roundTwo(params.amountSar),
                metadata: {
                    source: params.source,
                    reference: params.reference,
                    credits,
                },
            },
        });
    } catch (error) {
        logger.error('Failed to record AI credit top-up', {
            error: error as Error,
            userId: params.userId,
        });
    }
    return credits;
}
