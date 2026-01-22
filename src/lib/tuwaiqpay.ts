import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

type AuthResponse = {
    data?: {
        access_token?: string;
        userStatus?: string;
        accountType?: string;
    };
    message?: string;
    errors?: string[];
};

type CreateBillResponse = {
    data?: {
        transactionId?: string;
        billId?: number;
        link?: string;
        qrCode?: string;
        expireDate?: string;
        merchantTransactionId?: string;
    };
    message?: string;
    errors?: string[];
};

const TOKEN_TTL_MS = 25 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

function extractErrorMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') return fallback;
    const maybe = payload as { message?: string; error?: string; errors?: string[] };
    if (typeof maybe.message === 'string' && maybe.message.trim()) return maybe.message.trim();
    if (typeof maybe.error === 'string' && maybe.error.trim()) return maybe.error.trim();
    if (Array.isArray(maybe.errors) && maybe.errors.length > 0) {
        return maybe.errors.filter(Boolean).join(', ');
    }
    return fallback;
}

function getConfig() {
    const config = env.tuwaiqpay;
    if (!config.username || !config.password) {
        throw new Error('TuwaiqPay credentials are not configured');
    }
    const rawType = (config.userNameType || 'MOBILE').trim().toUpperCase();
    const userNameType = rawType === 'EMAIL' || rawType === 'MOBILE' ? rawType : 'MOBILE';
    return {
        ...config,
        baseUrl: config.baseUrl.trim().replace(/\/+$/, ''),
        username: config.username.trim(),
        userNameType,
    };
}

async function authenticate(): Promise<string> {
    const config = getConfig();
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now) {
        return cachedToken.value;
    }

    const url = `${config.baseUrl}/api/v1/auth/authenticate`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Language': config.language,
        },
        body: JSON.stringify({
            username: config.username,
            userNameType: config.userNameType,
            password: config.password,
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        const payload = await response.json().catch(async () => ({
            message: await response.text().catch(() => ''),
        }));
        const message = extractErrorMessage(payload, 'TuwaiqPay authentication failed');
        logger.error('TuwaiqPay authentication failed', {
            status: response.status,
            payload,
        });
        throw new Error(message);
    }

    const payload = (await response.json().catch(() => ({}))) as AuthResponse;
    const token = payload?.data?.access_token;
    if (!token) {
        logger.error('TuwaiqPay authentication response missing token', { payload });
        throw new Error('TuwaiqPay authentication failed');
    }

    cachedToken = {
        value: token,
        expiresAt: now + TOKEN_TTL_MS,
    };

    return token;
}

async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
    const token = await authenticate();
    const config = getConfig();
    const response = await fetch(url, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Language': config.language,
        },
        cache: 'no-store',
    });

    if (response.status !== 401) {
        return response;
    }

    cachedToken = null;
    const refreshedToken = await authenticate();
    return fetch(url, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${refreshedToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Language': config.language,
        },
        cache: 'no-store',
    });
}

export async function createTuwaiqPayBill(params: {
    amountSar: number;
    description: string;
    customerName: string;
    customerMobilePhone: string;
    actionDateInDays?: number;
    includeVat?: boolean;
    continueWithMaxCharge?: boolean;
    supportedPaymentMethods?: string[];
    callbackUrl?: string;
    returnUrl?: string;
}): Promise<{
    link: string;
    transactionId?: string;
    billId?: number;
    expireDate?: string;
    qrCode?: string;
    merchantTransactionId?: string;
}> {
    const config = getConfig();
    const url = `${config.baseUrl}/api/v1/integration/bills`;
    const body: Record<string, unknown> = {
        actionDateInDays: params.actionDateInDays ?? 2,
        amount: Number(params.amountSar.toFixed(2)),
        currencyId: 1,
        supportedPaymentMethods: params.supportedPaymentMethods ?? ['VISA', 'MASTER', 'MADA', 'AMEX'],
        description: params.description.slice(0, 200),
        customerName: params.customerName.slice(0, 100),
        customerMobilePhone: params.customerMobilePhone.slice(0, 100),
        includeVat: params.includeVat ?? false,
        continueWithMaxCharge: params.continueWithMaxCharge ?? false,
    };

    // Add return URL if provided - user will be redirected here after payment
    if (params.returnUrl) {
        body.returnUrl = params.returnUrl;
        body.callbackUrl = params.returnUrl;
        body.redirectUrl = params.returnUrl;
        body.successUrl = params.returnUrl;
        body.failureUrl = params.returnUrl;
    }

    // Add callback URL for webhooks if different
    if (params.callbackUrl) {
        body.callbackUrl = params.callbackUrl;
        body.webhookUrl = params.callbackUrl;
    }

    const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const payload = await response.json().catch(async () => ({
            message: await response.text().catch(() => ''),
        }));
        const message = extractErrorMessage(payload, 'Failed to create TuwaiqPay bill');
        logger.error('TuwaiqPay create bill failed', {
            status: response.status,
            payload,
        });
        throw new Error(message);
    }

    const payload = (await response.json().catch(() => ({}))) as CreateBillResponse;
    const data = payload?.data;
    if (!data?.link) {
        logger.error('TuwaiqPay bill response missing link', { payload });
        throw new Error('TuwaiqPay bill link missing');
    }

    return {
        link: data.link,
        transactionId: data.transactionId,
        billId: data.billId,
        expireDate: data.expireDate,
        qrCode: data.qrCode,
        merchantTransactionId: data.merchantTransactionId,
    };
}

export function getWebhookVerificationConfig() {
    const config = env.tuwaiqpay;
    return {
        headerName: (config.webhookHeaderName || 'x-signature').toLowerCase(),
        headerValue: config.webhookHeaderValue || 'Tuwaiqpay',
    };
}

// Check bill status from TuwaiqPay API
export async function checkBillStatus(billId: string | number): Promise<{
    status: string;
    isPaid: boolean;
    transactionId?: string;
    paidAt?: string;
    amount?: number;
    rawResponse?: Record<string, unknown>;
}> {
    const config = getConfig();
    const url = `${config.baseUrl}/api/v1/integration/bills/${billId}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
    });

    if (!response.ok) {
        const payload = await response.json().catch(async () => ({
            message: await response.text().catch(() => ''),
        }));
        const message = extractErrorMessage(payload, 'Failed to check TuwaiqPay bill status');
        logger.error('TuwaiqPay check bill status failed', {
            status: response.status,
            billId,
            payload,
        });
        throw new Error(message);
    }

    const payload = await response.json().catch(() => ({}));
    const data = payload?.data || payload;

    // Extract status - try multiple possible field names
    const status = data?.status || data?.bill?.status || data?.transactionStatus || 'UNKNOWN';
    const normalizedStatus = status.toUpperCase();

    const isPaid = ['PAID', 'PENDING_SETTLEMENT', 'SUCCESS', 'COMPLETED', 'APPROVED', 'SETTLED'].includes(normalizedStatus);

    return {
        status: normalizedStatus,
        isPaid,
        transactionId: data?.transactionId || data?.bill?.transactionId,
        paidAt: data?.paidAt || data?.paymentDate || data?.bill?.eventDate,
        amount: data?.amount || data?.bill?.amount,
        rawResponse: payload,
    };
}

// Check transaction status by transaction ID
export async function checkTransactionStatus(transactionId: string): Promise<{
    status: string;
    isPaid: boolean;
    billId?: string;
    paidAt?: string;
    amount?: number;
    rawResponse?: Record<string, unknown>;
}> {
    const config = getConfig();
    const url = `${config.baseUrl}/api/v1/integration/transactions/${transactionId}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
    });

    if (!response.ok) {
        const payload = await response.json().catch(async () => ({
            message: await response.text().catch(() => ''),
        }));
        const message = extractErrorMessage(payload, 'Failed to check TuwaiqPay transaction status');
        logger.error('TuwaiqPay check transaction status failed', {
            status: response.status,
            transactionId,
            payload,
        });
        throw new Error(message);
    }

    const payload = await response.json().catch(() => ({}));
    const data = payload?.data || payload;

    const status = data?.transactionStatus || data?.status || data?.bill?.status || 'UNKNOWN';
    const normalizedStatus = status.toUpperCase();

    const isPaid = ['PAID', 'PENDING_SETTLEMENT', 'SUCCESS', 'COMPLETED', 'APPROVED', 'SETTLED'].includes(normalizedStatus);

    return {
        status: normalizedStatus,
        isPaid,
        billId: data?.bill?.id ? String(data.bill.id) : undefined,
        paidAt: data?.paymentDate || data?.eventDate,
        amount: data?.bill?.amount,
        rawResponse: payload,
    };
}
