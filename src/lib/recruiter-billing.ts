export const RECRUITER_GROWTH_PLAN = {
    id: 'growth',
    name: 'Talent Hunter - Growth',
    priceMonthlySar: 199,
    priceYearlySar: 1650,
    monthlyCredits: 20,
    yearlyCredits: 240,
};

export const RECRUITER_CREDIT_PACKS = {
    single: { credits: 1, amountSar: 7 },
    pack10: { credits: 10, amountSar: 50 },
    pack50: { credits: 50, amountSar: 250 },
} as const;

export type RecruiterCreditPackId = keyof typeof RECRUITER_CREDIT_PACKS;

export function getRecruiterCreditPack(packId: RecruiterCreditPackId) {
    return RECRUITER_CREDIT_PACKS[packId];
}
