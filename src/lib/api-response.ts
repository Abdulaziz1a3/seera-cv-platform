// Standardized API Response Helpers for Seera AI
// Provides consistent response format across all API endpoints

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

// Standard API response format
interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        requestId?: string;
        timestamp: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

// Error codes
export const ErrorCodes = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Resource
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Rate Limiting
    RATE_LIMITED: 'RATE_LIMITED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

    // Server
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',

    // Business Logic
    SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    LIMIT_REACHED: 'LIMIT_REACHED',
    PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Success response builder
export function success<T>(
    data: T,
    options?: {
        status?: number;
        headers?: Record<string, string>;
        meta?: Partial<APIResponse['meta']>;
    }
): NextResponse<APIResponse<T>> {
    const requestId = options?.meta?.requestId || getRequestIdFromHeaders();
    const response: APIResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
            ...options?.meta,
        },
    };

    return NextResponse.json(response, {
        status: options?.status || 200,
        headers: options?.headers,
    });
}

// Paginated success response
export function paginated<T>(
    data: T[],
    pagination: {
        page: number;
        limit: number;
        total: number;
    },
    options?: {
        headers?: Record<string, string>;
    }
): NextResponse<APIResponse<T[]>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return success(data, {
        meta: {
            pagination: {
                ...pagination,
                totalPages,
            },
        },
        headers: options?.headers,
    });
}

// Error response builder
export function error(
    code: ErrorCode,
    message: string,
    options?: {
        status?: number;
        details?: unknown;
        headers?: Record<string, string>;
        requestId?: string;
    }
): NextResponse<APIResponse<never>> {
    const requestId = options?.requestId || getRequestIdFromHeaders();
    // Determine status code from error code if not provided
    const status = options?.status || getStatusFromCode(code);

    // Log server errors
    if (status >= 500) {
        logger.error(`API Error: ${code}`, {
            message,
            details: options?.details,
            requestId: options?.requestId,
        });
    }

    const response: APIResponse<never> = {
        success: false,
        error: {
            code,
            message,
            details: options?.details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };

    return NextResponse.json(response, {
        status,
        headers: options?.headers,
    });
}

// Get HTTP status from error code
function getStatusFromCode(code: ErrorCode): number {
    switch (code) {
        case ErrorCodes.UNAUTHORIZED:
        case ErrorCodes.SESSION_EXPIRED:
        case ErrorCodes.INVALID_CREDENTIALS:
            return 401;
        case ErrorCodes.FORBIDDEN:
        case ErrorCodes.SUBSCRIPTION_REQUIRED:
        case ErrorCodes.FEATURE_DISABLED:
            return 403;
        case ErrorCodes.NOT_FOUND:
            return 404;
        case ErrorCodes.ALREADY_EXISTS:
        case ErrorCodes.CONFLICT:
            return 409;
        case ErrorCodes.VALIDATION_ERROR:
        case ErrorCodes.INVALID_INPUT:
        case ErrorCodes.MISSING_REQUIRED_FIELD:
            return 400;
        case ErrorCodes.RATE_LIMITED:
        case ErrorCodes.QUOTA_EXCEEDED:
        case ErrorCodes.LIMIT_REACHED:
            return 429;
        case ErrorCodes.PAYMENT_REQUIRED:
            return 402;
        case ErrorCodes.SERVICE_UNAVAILABLE:
            return 503;
        case ErrorCodes.INTERNAL_ERROR:
        case ErrorCodes.DATABASE_ERROR:
        default:
            return 500;
    }
}

// Convenience error responses
export const errors = {
    unauthorized: (message = 'Authentication required') =>
        error(ErrorCodes.UNAUTHORIZED, message),

    forbidden: (message = 'Access denied') =>
        error(ErrorCodes.FORBIDDEN, message),

    notFound: (resource = 'Resource') =>
        error(ErrorCodes.NOT_FOUND, `${resource} not found`),

    validation: (details: unknown) =>
        error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { details }),

    badRequest: (message: string, details?: unknown) =>
        error(ErrorCodes.INVALID_INPUT, message, { details }),

    conflict: (message: string) =>
        error(ErrorCodes.CONFLICT, message),

    rateLimited: (retryAfter?: number) =>
        error(ErrorCodes.RATE_LIMITED, 'Too many requests', {
            headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
        }),

    quotaExceeded: (message = 'Usage quota exceeded') =>
        error(ErrorCodes.QUOTA_EXCEEDED, message),

    subscriptionRequired: (feature?: string) =>
        error(
            ErrorCodes.SUBSCRIPTION_REQUIRED,
            feature ? `Upgrade to access ${feature}` : 'Subscription required'
        ),

    serverError: (message = 'Internal server error', details?: unknown) =>
        error(ErrorCodes.INTERNAL_ERROR, message, { details }),

    serviceUnavailable: (message = 'Service temporarily unavailable') =>
        error(ErrorCodes.SERVICE_UNAVAILABLE, message),
};

// Handle Zod validation errors
export function handleZodError(err: ZodError): NextResponse<APIResponse<never>> {
    const formattedErrors = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
    }));

    return errors.validation(formattedErrors);
}

// Handle unknown errors safely
export function handleError(err: unknown, requestId?: string): NextResponse<APIResponse<never>> {
    // Log the actual error
    logger.error('Unhandled API error', {
        error: err instanceof Error ? err : String(err),
        requestId,
    });

    // Zod validation errors
    if (err instanceof ZodError) {
        return handleZodError(err);
    }

    // Prisma known errors
    if (isPrismaError(err)) {
        return handlePrismaError(err);
    }

    // Generic error
    const message =
        process.env.NODE_ENV === 'development' && err instanceof Error
            ? err.message
            : 'An unexpected error occurred';

    return errors.serverError(message);
}

function getRequestIdFromHeaders(): string | undefined {
    // Skip headers() call to avoid async issues in Next.js 14+
    // Request ID can be passed explicitly via options if needed
    return undefined;
}

// Prisma error handling
function isPrismaError(err: unknown): err is { code: string; meta?: unknown } {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as any).code === 'string' &&
        (err as any).code.startsWith('P')
    );
}

function handlePrismaError(err: { code: string; meta?: unknown }): NextResponse<APIResponse<never>> {
    switch (err.code) {
        case 'P2002': // Unique constraint violation
            return error(ErrorCodes.ALREADY_EXISTS, 'A record with this value already exists', {
                details: err.meta,
            });
        case 'P2025': // Record not found
            return errors.notFound();
        case 'P2003': // Foreign key constraint
            return error(ErrorCodes.CONFLICT, 'Related record not found');
        default:
            logger.error('Database error', { prismaCode: err.code, meta: err.meta });
            return error(ErrorCodes.DATABASE_ERROR, 'Database operation failed');
    }
}

// Middleware wrapper for API routes
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await handler(...args);
        } catch (err) {
            return handleError(err);
        }
    }) as T;
}

// Type-safe request body parser
export async function parseBody<T>(
    request: Request,
    schema: { parse: (data: unknown) => T }
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<APIResponse<never>> }> {
    try {
        const body = await request.json();
        const data = schema.parse(body);
        return { data, error: null };
    } catch (err) {
        if (err instanceof ZodError) {
            return { data: null, error: handleZodError(err) };
        }
        if (err instanceof SyntaxError) {
            return { data: null, error: errors.badRequest('Invalid JSON body') };
        }
        return { data: null, error: handleError(err) };
    }
}

export default {
    success,
    paginated,
    error,
    errors,
    handleError,
    handleZodError,
    parseBody,
    withErrorHandling,
    ErrorCodes,
};
