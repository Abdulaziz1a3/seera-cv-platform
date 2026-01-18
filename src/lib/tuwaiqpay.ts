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

function getConfig() {
    const config = env.tuwaiqpay;
    if (!config.username || !config.password) {
        throw new Error('TuwaiqPay credentials are not configured');
    }
    return {
        ...config,
        baseUrl: config.baseUrl.replace(/\/+$/, ''),
        username: config.username.trim(),
        userNameType: config.userNameType.trim(),
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
        logger.error('TuwaiqPay authentication failed', {
            status: response.status,
            payload,
        });
        throw new Error('TuwaiqPay authentication failed');
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
    const body = {
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

    const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const payload = await response.json().catch(async () => ({
            message: await response.text().catch(() => ''),
        }));
        logger.error('TuwaiqPay create bill failed', {
            status: response.status,
            payload,
        });
        throw new Error('Failed to create TuwaiqPay bill');
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
