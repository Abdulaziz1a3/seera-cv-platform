import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail, isEmailConfigured } from '@/lib/email';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/api-rate-limit';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const rateLimitResponse = await enforceRateLimit({
            key: `auth:register:${ip}`,
            limit: 5,
            windowMs: 15 * 60 * 1000,
            message: 'Too many registration attempts. Please try again later.',
        });
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const { name, email, password } = registerSchema.parse(body);
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Determine if we should auto-verify (when email service not configured)
        const shouldAutoVerify = !isEmailConfigured();

        const now = new Date();
        const pendingGift = await prisma.giftSubscription.findFirst({
            where: {
                recipientEmail: { equals: normalizedEmail, mode: 'insensitive' },
                status: 'PENDING',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });

        const giftDurationMonths = pendingGift?.interval === 'YEARLY' ? 12 : 1;
        const giftPeriodEnd = pendingGift ? addMonths(now, giftDurationMonths) : null;

        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    passwordHash,
                    emailVerified: shouldAutoVerify ? new Date() : null,
                    profile: {
                        create: {
                            firstName: name.split(' ')[0],
                            lastName: name.split(' ').slice(1).join(' ') || null,
                        },
                    },
                    subscription: {
                        create: pendingGift
                            ? {
                                plan: pendingGift.plan,
                                status: 'ACTIVE',
                                currentPeriodStart: now,
                                currentPeriodEnd: giftPeriodEnd,
                                cancelAtPeriodEnd: false,
                                stripeSubscriptionId: null,
                                stripePriceId: null,
                            }
                            : {
                                plan: 'FREE',
                                status: 'ACTIVE',
                            },
                    },
                },
            });

            if (pendingGift) {
                await tx.giftSubscription.update({
                    where: { id: pendingGift.id },
                    data: {
                        status: 'REDEEMED',
                        redeemedAt: now,
                        redeemedByUserId: createdUser.id,
                    },
                });
            }

            return createdUser;
        });

        // Log registration
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                entity: 'User',
                entityId: user.id,
            },
        });

        // Send verification email if email service is configured
        if (!shouldAutoVerify) {
            const token = await generateVerificationToken(normalizedEmail, 'EMAIL_VERIFICATION');
            const emailResult = await sendVerificationEmail(normalizedEmail, token, name);

            if (!emailResult.success) {
                logger.warn('Failed to send verification email', {
                    userId: user.id,
                    email,
                    error: emailResult.error,
                });
            }

            logger.info('User registered - verification email sent', { userId: user.id, email: normalizedEmail });

            return NextResponse.json(
                {
                    message: 'Account created. Please check your email to verify your account.',
                    requiresVerification: true,
                },
                { status: 201 }
            );
        }

        // Auto-verified path (no email service)
        logger.info('User registered - auto-verified', { userId: user.id, email: normalizedEmail });

        return NextResponse.json(
            {
                message: 'Account created successfully. You can now sign in.',
                requiresVerification: false,
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Registration error', { error: error as Error });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
