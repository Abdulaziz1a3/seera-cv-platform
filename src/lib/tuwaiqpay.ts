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

function normalizeWebhookUrl(url: string | undefined, appUrl: string): string | undefined {
    const baseAppUrl = appUrl.trim().replace(/\/+$/, '');
    const defaultUrl = `${baseAppUrl}/api/webhooks/tuwaiqpay-payment`;

    if (!url) return defaultUrl;

    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed === baseAppUrl) return defaultUrl;
    if (trimmed.endsWith('/api/webhooks/tuwaiqpay')) {
        return `${trimmed.replace(/\/api\/webhooks\/tuwaiqpay$/, '')}/api/webhooks/tuwaiqpay-payment`;
    }
    return trimmed;
}

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

async function parseErrorPayload(response: Response): Promise<{ message: string; rawText: string }> {
    const rawText = await response.text().catch(() => '');
    if (!rawText) {
        return { message: 'Empty response body', rawText: '' };
    }
    try {
        const payload = JSON.parse(rawText) as unknown;
        const message = extractErrorMessage(payload, rawText);
        return { message, rawText };
    } catch {
        return { message: rawText, rawText };
    }
}

function getConfig() {
    const config = env.tuwaiqpay;
    if (!config.username || !config.password) {
        throw new Error('TuwaiqPay credentials are not configured');
    }
    const appUrl = env.app.url || 'https://seera-ai.com';
    const webhookUrl = normalizeWebhookUrl(config.webhookUrl, appUrl);
    const rawType = (config.userNameType || 'MOBILE').trim().toUpperCase();
    const userNameType = rawType === 'EMAIL' || rawType === 'MOBILE' ? rawType : 'MOBILE';
    return {
        ...config,
        baseUrl: config.baseUrl.trim().replace(/\/+$/, ''),
        webhookUrl,
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
        const { message, rawText } = await parseErrorPayload(response);
        const shortRaw = rawText.substring(0, 1000);
        logger.error('TuwaiqPay authentication failed', {
            status: response.status,
            payload: shortRaw,
        });
        throw new Error(`TuwaiqPay authentication failed (${response.status}): ${message}`);
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
    let response = await fetch(url, {
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

    const shouldRetry = await isTokenError(response);
    if (!shouldRetry) {
        return response;
    }

    cachedToken = null;
    const refreshedToken = await authenticate();
    response = await fetch(url, {
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
    return response;
}

async function isTokenError(response: Response): Promise<boolean> {
    if (response.status === 401) return true;
    if (response.status !== 400 && response.status !== 403) return false;
    const clone = response.clone();
    const rawText = await clone.text().catch(() => '');
    if (!rawText) {
        return response.status === 403;
    }
    const text = rawText.toLowerCase();
    return text.includes('token') && (text.includes('expired') || text.includes('invalid'));
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
    const webhookUrl = params.callbackUrl || config.webhookUrl;
    if (webhookUrl) {
        body.callbackUrl = webhookUrl;
        body.webhookUrl = webhookUrl;
    }

    const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const { message, rawText } = await parseErrorPayload(response);
        const shortRaw = rawText.substring(0, 1000);
        logger.error('TuwaiqPay create bill failed', {
            status: response.status,
            payload: shortRaw,
        });
        throw new Error(`Failed to create TuwaiqPay bill (${response.status}): ${message}`);
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
        const { message, rawText } = await parseErrorPayload(response);
        const shortRaw = rawText.substring(0, 1000);
        logger.error('TuwaiqPay check bill status failed', {
            status: response.status,
            billId,
            payload: shortRaw,
        });
        throw new Error(`Failed to check TuwaiqPay bill status (${response.status}): ${message}`);
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
        const { message, rawText } = await parseErrorPayload(response);
        const shortRaw = rawText.substring(0, 1000);
        logger.error('TuwaiqPay check transaction status failed', {
            status: response.status,
            transactionId,
            payload: shortRaw,
        });
        throw new Error(`Failed to check TuwaiqPay transaction status (${response.status}): ${message}`);
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
