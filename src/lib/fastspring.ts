import crypto from 'crypto';
import { env } from './env';
import { logger } from './logger';

type FastSpringPlanPath = 'pro-monthly' | 'pro-yearly';

interface CreateFastSpringCheckoutParams {
    productPath: FastSpringPlanPath;
    userId: string;
    userEmail: string;
    userName?: string | null;
    returnUrl: string;
}

interface FastSpringSessionResponse {
    id: string;
}

function getBasicAuthHeader(username: string, password: string) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function normalizeCheckoutUrl(checkoutUrl: string) {
    if (checkoutUrl.startsWith('http://') || checkoutUrl.startsWith('https://')) {
        return checkoutUrl.replace(/\/+$/, '');
    }
    return `https://${checkoutUrl.replace(/\/+$/, '')}`;
}

export function isFastSpringConfigured() {
    const config = env.fastspring;
    return Boolean(
        config.storePath
        && config.username
        && config.password
        && config.webhookSecret
        && config.products.proMonthly
        && config.products.proYearly
        && config.checkoutUrl
    );
}

export function getFastSpringProductPath(interval: 'monthly' | 'yearly'): FastSpringPlanPath {
    const productPath = interval === 'yearly'
        ? env.fastspring.products.proYearly
        : env.fastspring.products.proMonthly;

    if (!productPath) {
        throw new Error(`FastSpring product path is not configured for ${interval}`);
    }

    return productPath as FastSpringPlanPath;
}

export async function createFastSpringCheckoutSession(params: CreateFastSpringCheckoutParams) {
    const config = env.fastspring;
    if (!config.username || !config.password || !config.checkoutUrl) {
        throw new Error('FastSpring is not configured');
    }

    const sessionPayload = {
        items: [
            {
                product: params.productPath,
                quantity: 1,
            },
        ],
        tags: {
            userId: params.userId,
            app: 'seera-ai',
            checkout: 'subscription',
        },
        paymentContact: {
            email: params.userEmail,
        },
        returnUrl: params.returnUrl,
    };

    const response = await fetch('https://api.fastspring.com/sessions', {
        method: 'POST',
        headers: {
            Authorization: getBasicAuthHeader(config.username, config.password),
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(sessionPayload),
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => null) as FastSpringSessionResponse | null;
    if (!response.ok || !payload?.id) {
        logger.error('Failed to create FastSpring session', {
            statusCode: response.status,
            payload: payload || undefined,
        });
        throw new Error('Failed to create FastSpring checkout session');
    }

    const checkoutBaseUrl = normalizeCheckoutUrl(config.checkoutUrl);
    return {
        sessionId: payload.id,
        url: `${checkoutBaseUrl}?sessionId=${encodeURIComponent(payload.id)}`,
    };
}

function safeEqual(candidate: string, expected: string) {
    const candidateBuffer = Buffer.from(candidate);
    const expectedBuffer = Buffer.from(expected);
    return candidateBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function verifyFastSpringWebhookSignature(rawBody: string, signatureHeader: string | null) {
    const secret = env.fastspring.webhookSecret;
    if (!secret || !signatureHeader) {
        return false;
    }

    const computedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const computedBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    const normalized = signatureHeader.trim();
    const candidates = [
        normalized,
        normalized.replace(/^sha256=/i, ''),
        normalized.replace(/^hmac-sha256=/i, ''),
    ];

    return candidates.some((candidate) =>
        safeEqual(candidate, computedHex)
        || safeEqual(candidate, computedBase64)
    );
}
