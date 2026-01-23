import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateVerificationToken, hashPassword } from '@/lib/auth';
import { isCompanyEmail } from '@/lib/company-email';
import { isEmailConfigured, sendVerificationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const registerSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    companyName: z.string().min(2),
    companyWebsite: z.string().url().optional().or(z.literal('')),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    jobTitle: z.string().optional(),
    phone: z.string().optional(),
});

export async function POST(request: Request) {
    const body = await request.json();
    const data = registerSchema.parse(body);
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!isCompanyEmail(normalizedEmail)) {
        return NextResponse.json(
            { error: 'Please use your company email address.' },
            { status: 400 }
        );
    }

    const existingUser = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (existingUser) {
        return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
        );
    }

    const passwordHash = await hashPassword(data.password);
    const shouldAutoVerify = !isEmailConfigured();

    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            name: data.fullName,
            passwordHash,
            emailVerified: shouldAutoVerify ? new Date() : null,
            profile: {
                create: {
                    firstName: data.fullName.split(' ')[0],
                    lastName: data.fullName.split(' ').slice(1).join(' ') || null,
                    phone: data.phone || null,
                },
            },
            subscription: {
                create: {
                    plan: 'GROWTH',
                    status: 'UNPAID',
                },
            },
        },
    });

    if (!shouldAutoVerify) {
        const token = await generateVerificationToken(normalizedEmail, 'EMAIL_VERIFICATION');
        const emailResult = await sendVerificationEmail(normalizedEmail, token, data.fullName, {
            portal: 'recruiter',
        });

        if (!emailResult.success) {
            logger.warn('Failed to send recruiter verification email', {
                userId: user.id,
                email: normalizedEmail,
                error: emailResult.error,
            });
        }

        return NextResponse.json(
            {
                userId: user.id,
                message: 'Account created. Please check your email to verify your account.',
                requiresVerification: true,
            },
            { status: 201 }
        );
    }

    return NextResponse.json(
        {
            userId: user.id,
            message: 'Account created successfully. You can now sign in.',
            requiresVerification: false,
        },
        { status: 201 }
    );
}
