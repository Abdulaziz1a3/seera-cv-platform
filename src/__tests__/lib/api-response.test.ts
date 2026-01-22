/**
 * API Response Helpers Tests - Seera AI Production Readiness
 * Tests standardized API response system in src/lib/api-response.ts
 */

import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

// Mock next/headers
jest.mock('next/headers', () => ({
    headers: () => ({
        get: (name: string) => name === 'x-request-id' ? 'test-request-id' : null,
    }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    },
}));

import {
    success,
    paginated,
    error,
    errors,
    ErrorCodes,
    handleZodError,
    handleError,
    parseBody,
} from '@/lib/api-response';

describe('success response', () => {
    it('creates success response with data', async () => {
        const response = success({ message: 'Hello' });
        const body = await response.json();

        expect(body.success).toBe(true);
        expect(body.data).toEqual({ message: 'Hello' });
        expect(body.meta.timestamp).toBeTruthy();
    });

    it('includes custom status code', async () => {
        const response = success({ id: 1 }, { status: 201 });
        expect(response.status).toBe(201);
    });

    it('includes pagination metadata when provided', async () => {
        const response = success([1, 2, 3], {
            meta: {
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 100,
                    totalPages: 10,
                },
            },
        });
        const body = await response.json();
        expect(body.meta.pagination.totalPages).toBe(10);
    });
});

describe('paginated response', () => {
    it('creates paginated response with correct metadata', async () => {
        const data = [{ id: 1 }, { id: 2 }];
        const response = paginated(data, { page: 1, limit: 10, total: 25 });
        const body = await response.json();

        expect(body.success).toBe(true);
        expect(body.data).toEqual(data);
        expect(body.meta.pagination.page).toBe(1);
        expect(body.meta.pagination.limit).toBe(10);
        expect(body.meta.pagination.total).toBe(25);
        expect(body.meta.pagination.totalPages).toBe(3);
    });

    it('calculates totalPages correctly', async () => {
        const response = paginated([], { page: 1, limit: 5, total: 12 });
        const body = await response.json();
        expect(body.meta.pagination.totalPages).toBe(3);
    });
});

describe('error response', () => {
    it('creates error response with code and message', async () => {
        const response = error(ErrorCodes.NOT_FOUND, 'Resource not found');
        const body = await response.json();

        expect(body.success).toBe(false);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toBe('Resource not found');
    });

    it('maps error codes to correct HTTP status', async () => {
        expect(error(ErrorCodes.UNAUTHORIZED, 'test').status).toBe(401);
        expect(error(ErrorCodes.FORBIDDEN, 'test').status).toBe(403);
        expect(error(ErrorCodes.NOT_FOUND, 'test').status).toBe(404);
        expect(error(ErrorCodes.VALIDATION_ERROR, 'test').status).toBe(400);
        expect(error(ErrorCodes.RATE_LIMITED, 'test').status).toBe(429);
        expect(error(ErrorCodes.INTERNAL_ERROR, 'test').status).toBe(500);
    });

    it('includes details when provided', async () => {
        const response = error(ErrorCodes.VALIDATION_ERROR, 'Invalid', {
            details: { field: 'email' },
        });
        const body = await response.json();
        expect(body.error.details).toEqual({ field: 'email' });
    });
});

describe('convenience error responses', () => {
    it('creates unauthorized error', async () => {
        const response = errors.unauthorized();
        const body = await response.json();
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(response.status).toBe(401);
    });

    it('creates forbidden error', async () => {
        const response = errors.forbidden();
        expect(response.status).toBe(403);
    });

    it('creates not found error with resource name', async () => {
        const response = errors.notFound('User');
        const body = await response.json();
        expect(body.error.message).toBe('User not found');
    });

    it('creates validation error with details', async () => {
        const response = errors.validation({ email: 'Invalid format' });
        const body = await response.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.details).toEqual({ email: 'Invalid format' });
    });

    it('creates bad request error', async () => {
        const response = errors.badRequest('Invalid input');
        const body = await response.json();
        expect(body.error.code).toBe('INVALID_INPUT');
    });

    it('creates rate limited error', async () => {
        const response = errors.rateLimited(60);
        expect(response.status).toBe(429);
    });

    it('creates subscription required error', async () => {
        const response = errors.subscriptionRequired('AI Features');
        const body = await response.json();
        expect(body.error.message).toContain('AI Features');
    });

    it('creates server error', async () => {
        const response = errors.serverError();
        expect(response.status).toBe(500);
    });
});

describe('handleZodError', () => {
    it('formats Zod validation errors', async () => {
        const schema = z.object({
            email: z.string().email(),
            age: z.number().min(18),
        });

        try {
            schema.parse({ email: 'invalid', age: 10 });
        } catch (err) {
            if (err instanceof ZodError) {
                const response = handleZodError(err);
                const body = await response.json();

                expect(body.error.code).toBe('VALIDATION_ERROR');
                expect(Array.isArray(body.error.details)).toBe(true);
            }
        }
    });
});

describe('handleError', () => {
    it('handles Zod errors', async () => {
        const schema = z.object({ name: z.string() });
        try {
            schema.parse({ name: 123 });
        } catch (err) {
            const response = handleError(err);
            const body = await response.json();
            expect(body.error.code).toBe('VALIDATION_ERROR');
        }
    });

    it('handles unknown errors gracefully', async () => {
        const response = handleError(new Error('Something went wrong'));
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(response.status).toBe(500);
    });

    it('handles non-Error objects', async () => {
        const response = handleError('string error');
        expect(response.status).toBe(500);
    });
});

describe('parseBody', () => {
    it('parses valid JSON body', async () => {
        const schema = z.object({ name: z.string() });
        const request = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ name: 'Test' }),
        });

        const result = await parseBody(request, schema);
        expect(result.data).toEqual({ name: 'Test' });
        expect(result.error).toBeNull();
    });

    it('returns error for invalid JSON', async () => {
        const schema = z.object({ name: z.string() });
        const request = new Request('http://localhost', {
            method: 'POST',
            body: 'not json',
        });

        const result = await parseBody(request, schema);
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
    });

    it('returns error for validation failure', async () => {
        const schema = z.object({ email: z.string().email() });
        const request = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ email: 'invalid' }),
        });

        const result = await parseBody(request, schema);
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
    });
});

describe('ErrorCodes', () => {
    it('has all expected error codes', () => {
        expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
        expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
        expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
        expect(ErrorCodes.SUBSCRIPTION_REQUIRED).toBe('SUBSCRIPTION_REQUIRED');
        expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
});
