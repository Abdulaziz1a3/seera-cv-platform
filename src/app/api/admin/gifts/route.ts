import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendGiftSubscriptionEmail, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

const GIFT_CLAIM_WINDOW_DAYS = 90;

const createGiftSchema = z.object({
    recipientEmail: z.string().email(),
    interval: z.enum(['monthly', 'yearly']),
    message: z.string().max(300).optional().or(z.literal('')),
});

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { session };
}

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const where: any = {};
    if (search) {
        where.recipientEmail = { contains: search, mode: 'insensitive' };
    }
    if (status !== 'all') {
        where.status = status;
    }

    const gifts = await prisma.giftSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            createdBy: { select: { name: true, email: true } },
        },
    });

    return NextResponse.json({
        gifts: gifts.map((gift) => ({
            id: gift.id,
            token: gift.token,
            recipientEmail: gift.recipientEmail,
            plan: gift.plan,
            interval: gift.interval,
            status: gift.status,
            createdAt: gift.createdAt,
            expiresAt: gift.expiresAt,
            redeemedAt: gift.redeemedAt,
            createdBy: gift.createdBy?.name || gift.createdBy?.email || null,
        })),
    });
}

export async function POST(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const { recipientEmail, interval, message } = createGiftSchema.parse(body);

        const token = crypto.randomBytes(24).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + GIFT_CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000);

        const gift = await prisma.giftSubscription.create({
            data: {
                token,
                createdByUserId: session.user.id,
                recipientEmail: recipientEmail.trim().toLowerCase(),
                message: message?.trim() || null,
                plan: 'PRO',
                interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
                status: 'PENDING',
                amountSar: 0,
                expiresAt,
            },
        });

        let emailSent = false;
        if (isEmailConfigured()) {
            const emailResult = await sendGiftSubscriptionEmail(recipientEmail, {
                senderName: session.user.name || session.user.email || undefined,
                planId: 'pro',
                interval,
                message: gift.message || undefined,
                token: gift.token,
                expiresAt,
            });
            emailSent = emailResult.success;
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'gift.create',
                entity: 'GiftSubscription',
                entityId: gift.id,
                details: { recipientEmail, interval, plan: 'PRO' },
            },
        });

        return NextResponse.json({ success: true, emailSent, giftId: gift.id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Admin gift create error', error);
        return NextResponse.json({ error: 'Failed to create gift' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const { id, action } = body as { id?: string; action?: string };

        if (!id || action !== 'resend') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const gift = await prisma.giftSubscription.findUnique({ where: { id } });
        if (!gift || !gift.recipientEmail) {
            return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
        }

        if (gift.status !== 'PENDING') {
            return NextResponse.json({ error: 'Gift is not pending' }, { status: 409 });
        }

        if (!isEmailConfigured()) {
            return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
        }

        const interval = gift.interval === 'YEARLY' ? 'yearly' : 'monthly';
        const planId = gift.plan === 'ENTERPRISE' ? 'enterprise' : 'pro';
        const emailResult = await sendGiftSubscriptionEmail(gift.recipientEmail, {
            senderName: session.user.name || session.user.email || undefined,
            planId,
            interval,
            message: gift.message || undefined,
            token: gift.token,
            expiresAt: gift.expiresAt || undefined,
        });

        if (!emailResult.success) {
            return NextResponse.json({ error: emailResult.error || 'Failed to resend' }, { status: 500 });
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'gift.resend',
                entity: 'GiftSubscription',
                entityId: gift.id,
                details: { recipientEmail: gift.recipientEmail },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin gift resend error', error);
        return NextResponse.json({ error: 'Failed to resend gift' }, { status: 500 });
    }
}
