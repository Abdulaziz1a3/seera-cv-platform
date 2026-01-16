import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isCompanyEmail } from '@/lib/company-email';

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

    if (!isCompanyEmail(data.email)) {
        return NextResponse.json(
            { error: 'Please use your company email address.' },
            { status: 400 }
        );
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
        );
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            email: data.email,
            name: data.fullName,
            passwordHash,
            emailVerified: new Date(),
            profile: {
                create: {
                    firstName: data.fullName.split(' ')[0],
                    lastName: data.fullName.split(' ').slice(1).join(' ') || null,
                    phone: data.phone || null,
                },
            },
            subscription: {
                create: {
                    plan: 'ENTERPRISE',
                    status: 'UNPAID',
                },
            },
        },
    });

    return NextResponse.json({ userId: user.id }, { status: 201 });
}
