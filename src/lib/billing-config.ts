export type BillingInterval = 'monthly' | 'yearly';
export type BillablePlanId = 'free' | 'pro' | 'enterprise' | 'growth';

export const OFFICIAL_BILLING_CURRENCY = 'USD' as const;
export const GATEWAY_BILLING_CURRENCY = 'SAR' as const;
export const USD_TO_SAR_EXCHANGE_RATE = 3.75;

type PlanPriceMap = Record<BillablePlanId, Record<BillingInterval, number>>;

function roundToTwo(value: number) {
    return Math.round(value * 100) / 100;
}

const gatewayPlanPricesSar: PlanPriceMap = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 19, yearly: 189 },
    enterprise: { monthly: 249, yearly: 1990 },
    growth: { monthly: 199, yearly: 1650 },
};

const officialPlanPricesUsd: PlanPriceMap = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 4.99, yearly: 49.99 },
    enterprise: {
        monthly: roundToTwo(gatewayPlanPricesSar.enterprise.monthly / USD_TO_SAR_EXCHANGE_RATE),
        yearly: roundToTwo(gatewayPlanPricesSar.enterprise.yearly / USD_TO_SAR_EXCHANGE_RATE),
    },
    growth: {
        monthly: roundToTwo(gatewayPlanPricesSar.growth.monthly / USD_TO_SAR_EXCHANGE_RATE),
        yearly: roundToTwo(gatewayPlanPricesSar.growth.yearly / USD_TO_SAR_EXCHANGE_RATE),
    },
};

export function normalizePlanId(planId: string): BillablePlanId {
    const normalized = planId.toLowerCase();
    if (normalized === 'pro' || normalized === 'enterprise' || normalized === 'growth') {
        return normalized;
    }
    return 'free';
}

export function getGatewayPlanPriceSar(
    planId: BillablePlanId,
    interval: BillingInterval
): number {
    return gatewayPlanPricesSar[planId][interval];
}

export function getOfficialPlanPriceUsd(
    planId: BillablePlanId,
    interval: BillingInterval
): number {
    return officialPlanPricesUsd[planId][interval];
}

export function convertSarToUsd(amountSar: number): number {
    return roundToTwo(amountSar / USD_TO_SAR_EXCHANGE_RATE);
}

export function convertUsdToSar(amountUsd: number): number {
    return roundToTwo(amountUsd * USD_TO_SAR_EXCHANGE_RATE);
}

export function formatCurrencyAmount(
    amount: number,
    locale: string,
    currency: 'USD' | 'SAR' = OFFICIAL_BILLING_CURRENCY
): string {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatOfficialPrice(amount: number, locale: string): string {
    return formatCurrencyAmount(amount, locale, OFFICIAL_BILLING_CURRENCY);
}
