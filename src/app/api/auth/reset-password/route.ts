// Password Reset API
// Handles password reset with token verification

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/api-rate-limit';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const rateLimitResponse = await enforceRateLimit({
            key: `auth:reset-password:${ip}`,
            limit: 10,
            windowMs: 60 * 60 * 1000,
            message: 'Too many password reset attempts. Please try again later.',
        });
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const { token, password } = resetPasswordSchema.parse(body);

        // Find valid password reset token
        const resetToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                type: 'PASSWORD_RESET',
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Invalid or expired reset link' },
                { status: 400 }
            );
        }

        const identifier = resetToken.identifier.trim().toLowerCase();
        const user = await prisma.user.findFirst({
            where: { email: { equals: identifier, mode: 'insensitive' } },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update password and delete token in transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    // Also verify email if not already verified (user proved email ownership)
                    emailVerified: user.emailVerified || new Date(),
                },
            }),
            prisma.verificationToken.delete({
                where: { token: resetToken.token },
            }),
            prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'PASSWORD_RESET',
                    entity: 'User',
                    entityId: user.id,
                },
            }),
        ]);

        logger.info('Password reset successful', { userId: user.id, email: user.email });

        return NextResponse.json(
            { message: 'Password reset successfully' },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Password reset error', { error: error as Error });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Password reset failed' },
            { status: 500 }
        );
    }
}

// Validate token endpoint (for checking if link is valid before showing form)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        // Find valid password reset token
        const resetToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                type: 'PASSWORD_RESET',
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (!resetToken) {
            return NextResponse.json(
                { valid: false, error: 'Invalid or expired reset link' },
                { status: 400 }
            );
        }

        // Token is valid
        return NextResponse.json(
            { valid: true, email: resetToken.identifier },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Token validation error', { error: error as Error });
        return NextResponse.json(
            { valid: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}
