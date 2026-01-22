// Environment Configuration & Validation for Seera AI
// Production-ready environment validation with strict type safety

import { z } from 'zod';

// Environment schema with comprehensive validation
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

    // Authentication
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // OpenAI
    OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features'),

    // Stripe (legacy)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
    STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
    STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: z.string().optional(),
    STRIPE_ENTERPRISE_YEARLY_PRICE_ID: z.string().optional(),

    // TuwaiqPay
    TUWAIQPAY_BASE_URL: z.string().url().optional(),
    TUWAIQPAY_USERNAME: z.string().optional(),
    TUWAIQPAY_USER_NAME_TYPE: z.enum(['MOBILE', 'EMAIL']).optional(),
    TUWAIQPAY_PASSWORD: z.string().optional(),
    TUWAIQPAY_WEBHOOK_URL: z.string().url().optional(),
    TUWAIQPAY_WEBHOOK_HEADER_NAME: z.string().optional(),
    TUWAIQPAY_WEBHOOK_HEADER_VALUE: z.string().optional(),
    TUWAIQPAY_LANGUAGE: z.enum(['ar', 'en']).optional(),

    // Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('Seera AI <noreply@seera-ai.com>'),

    // Redis
    REDIS_URL: z.string().url().optional(),

    // Supabase Storage
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET_INTERVIEWS: z.string().optional(),
    SUPABASE_STORAGE_SIGNED_TTL: z.string().transform(Number).optional(),

    // Security
    ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)').optional(),

    // Feature Flags
    ENABLE_AI_GENERATION: z.string().transform(v => v === 'true').default('true'),
    ENABLE_LINKEDIN_IMPORT: z.string().transform(v => v === 'true').default('false'),
    ENABLE_2FA: z.string().transform(v => v === 'true').default('false'),
    MAINTENANCE_MODE: z.string().transform(v => v === 'true').default('false'),

    // App Config
    NEXT_PUBLIC_APP_URL: z.string().url().default('https://seera-ai.com'),
    NEXT_PUBLIC_APP_NAME: z.string().default('Seera AI'),

    // Admin
    SUPER_ADMIN_EMAIL: z.string().email().default('info@seera-ai.com'),

    // Monitoring
    SENTRY_DSN: z.string().url().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),

    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables at startup
function validateEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('Environment validation failed:');
        const errors = parsed.error.flatten().fieldErrors;
        Object.entries(errors).forEach(([key, messages]) => {
            console.error(`  ${key}: ${messages?.join(', ')}`);
        });

        // In production, throw error. In development, warn and continue with defaults
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Invalid environment configuration. Check the logs above.');
        } else {
            console.warn('Running with partial environment configuration in development mode.');
        }
    }

    return parsed.success ? parsed.data : (process.env as unknown as Env);
}

// Lazy initialization to avoid issues during build
let _env: Env | null = null;

export function getEnv(): Env {
    if (!_env) {
        _env = validateEnv();
    }
    return _env;
}

// Export individual env vars for convenience
export const env = {
    get database() {
        return {
            url: process.env.DATABASE_URL!,
        };
    },

    get auth() {
        return {
            url: process.env.NEXTAUTH_URL!,
            secret: process.env.NEXTAUTH_SECRET!,
            superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'info@seera-ai.com',
        };
    },

    get google() {
        return {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        };
    },

    get openai() {
        return {
            apiKey: process.env.OPENAI_API_KEY!,
        };
    },

    get stripe() {
        return {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            prices: {
                proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
                proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
                enterpriseMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
                enterpriseYearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
            },
        };
    },

    get tuwaiqpay() {
        return {
            baseUrl: process.env.TUWAIQPAY_BASE_URL || 'https://onboarding-prod.tuwaiqpay.com.sa',
            username: process.env.TUWAIQPAY_USERNAME,
            userNameType: process.env.TUWAIQPAY_USER_NAME_TYPE || 'MOBILE',
            password: process.env.TUWAIQPAY_PASSWORD,
            webhookUrl: process.env.TUWAIQPAY_WEBHOOK_URL,
            webhookHeaderName: process.env.TUWAIQPAY_WEBHOOK_HEADER_NAME || 'x-signature',
            webhookHeaderValue: process.env.TUWAIQPAY_WEBHOOK_HEADER_VALUE || 'Tuwaiqpay',
            language: process.env.TUWAIQPAY_LANGUAGE || 'en',
        };
    },

    get email() {
        return {
            resendApiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || 'Seera AI <noreply@seera-ai.com>',
        };
    },

    get redis() {
        return {
            url: process.env.REDIS_URL,
        };
    },

    get supabase() {
        return {
            url: process.env.SUPABASE_URL,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            interviewsBucket: process.env.SUPABASE_STORAGE_BUCKET_INTERVIEWS || 'interview-recordings',
            signedTtl: process.env.SUPABASE_STORAGE_SIGNED_TTL
                ? Number(process.env.SUPABASE_STORAGE_SIGNED_TTL)
                : 60 * 60 * 24 * 7,
        };
    },

    get features() {
        return {
            aiGeneration: process.env.ENABLE_AI_GENERATION !== 'false',
            linkedinImport: process.env.ENABLE_LINKEDIN_IMPORT === 'true',
            twoFactor: process.env.ENABLE_2FA === 'true',
            maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        };
    },

    get app() {
        return {
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com',
            name: process.env.NEXT_PUBLIC_APP_NAME || 'Seera AI',
            isDev: process.env.NODE_ENV === 'development',
            isProd: process.env.NODE_ENV === 'production',
        };
    },

    get rateLimit() {
        return {
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        };
    },

    get monitoring() {
        return {
            sentryDsn: process.env.SENTRY_DSN,
            logLevel: process.env.LOG_LEVEL || 'info',
        };
    },
};

// Check if required features are configured
export function checkRequiredServices() {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Critical services
    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is not configured - database will not work');
    }
    if (!process.env.NEXTAUTH_SECRET) {
        errors.push('NEXTAUTH_SECRET is not configured - authentication will fail');
    }

    // Important services
    if (!process.env.OPENAI_API_KEY) {
        warnings.push('OPENAI_API_KEY is not configured - AI features will be disabled');
    }
    if (!process.env.TUWAIQPAY_USERNAME || !process.env.TUWAIQPAY_PASSWORD) {
        warnings.push('TUWAIQPAY credentials are not configured - payments will be disabled');
    }
    if (!process.env.RESEND_API_KEY) {
        warnings.push('RESEND_API_KEY is not configured - emails will not be sent');
    }
    if (!process.env.REDIS_URL) {
        warnings.push('REDIS_URL is not configured - using in-memory rate limiting (not suitable for production)');
    }

    return { errors, warnings };
}
