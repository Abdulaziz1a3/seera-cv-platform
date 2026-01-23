// Email Verification API
// Verifies email tokens and activates user accounts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/api-rate-limit';

const verifySchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const rateLimitResponse = await enforceRateLimit({
            key: `auth:verify-email:${ip}`,
            limit: 10,
            windowMs: 60 * 60 * 1000,
            message: 'Too many verification attempts. Please try again later.',
        });
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const { token } = verifySchema.parse(body);

        // Find valid verification token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                type: 'EMAIL_VERIFICATION',
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: 'Invalid or expired verification link' },
                { status: 400 }
            );
        }

        const identifier = verificationToken.identifier.trim().toLowerCase();
        const user = await prisma.user.findFirst({
            where: { email: { equals: identifier, mode: 'insensitive' } },
            include: { subscription: { select: { plan: true } } },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already verified
        const portal = user.subscription?.plan === 'GROWTH' || user.subscription?.plan === 'ENTERPRISE'
            ? 'recruiter'
            : 'jobseeker';

        if (user.emailVerified) {
            // Clean up token
            await prisma.verificationToken.delete({
                where: { token: verificationToken.token },
            });

            return NextResponse.json(
                { message: 'Email already verified', alreadyVerified: true, portal },
                { status: 200 }
            );
        }

        // Verify user email and delete token in transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            }),
            prisma.verificationToken.delete({
                where: { token: verificationToken.token },
            }),
            prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'EMAIL_VERIFIED',
                    entity: 'User',
                    entityId: user.id,
                },
            }),
        ]);

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.name || undefined).catch((err) => {
            logger.error('Failed to send welcome email', { userId: user.id, error: err });
        });

        logger.info('Email verified successfully', { userId: user.id, email: user.email });

        return NextResponse.json(
            { message: 'Email verified successfully', portal },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Email verification error', { error: error as Error });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}

// GET endpoint for link verification (when user clicks email link)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(
                new URL('/login?error=missing_token', request.url)
            );
        }

        // Find valid verification token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                type: 'EMAIL_VERIFICATION',
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            return NextResponse.redirect(
                new URL('/login?error=invalid_token', request.url)
            );
        }

        // Find user by email
        const identifier = verificationToken.identifier.trim().toLowerCase();
        const user = await prisma.user.findFirst({
            where: { email: { equals: identifier, mode: 'insensitive' } },
            include: { subscription: { select: { plan: true } } },
        });

        if (!user) {
            return NextResponse.redirect(
                new URL('/login?error=user_not_found', request.url)
            );
        }

        const loginPath = user.subscription?.plan === 'GROWTH' || user.subscription?.plan === 'ENTERPRISE'
            ? '/recruiters/login'
            : '/login';

        // Check if already verified
        if (user.emailVerified) {
            await prisma.verificationToken.delete({
                where: { token: verificationToken.token },
            });

            return NextResponse.redirect(
                new URL(`${loginPath}?verified=already`, request.url)
            );
        }

        // Verify user email and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            }),
            prisma.verificationToken.delete({
                where: { token: verificationToken.token },
            }),
            prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'EMAIL_VERIFIED',
                    entity: 'User',
                    entityId: user.id,
                },
            }),
        ]);

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.name || undefined).catch((err) => {
            logger.error('Failed to send welcome email', { userId: user.id, error: err });
        });

        logger.info('Email verified via link', { userId: user.id, email: user.email });

        return NextResponse.redirect(
            new URL(`${loginPath}?verified=success`, request.url)
        );
    } catch (error) {
        logger.error('Email verification link error', { error: error as Error });
        return NextResponse.redirect(
            new URL('/login?error=verification_failed', request.url)
        );
    }
}
