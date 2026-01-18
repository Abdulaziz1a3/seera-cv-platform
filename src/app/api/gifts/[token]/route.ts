import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!user || !domain) return '***';
    const prefix = user.slice(0, 1);
    return `${prefix}***@${domain}`;
}

export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    const token = params.token;
    if (!token || token.length < 20) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const gift = await prisma.giftSubscription.findUnique({
        where: { token },
        select: {
            plan: true,
            interval: true,
            status: true,
            recipientEmail: true,
            message: true,
            expiresAt: true,
            redeemedAt: true,
            createdAt: true,
            createdBy: { select: { name: true } },
        },
    });

    if (!gift) {
        return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    if (gift.status === 'PENDING' && gift.expiresAt && gift.expiresAt < new Date()) {
        await prisma.giftSubscription.update({
            where: { token },
            data: { status: 'EXPIRED' },
        });
        return NextResponse.json({ error: 'Gift expired' }, { status: 410 });
    }

    return NextResponse.json({
        gift: {
            plan: gift.plan,
            interval: gift.interval,
            status: gift.status,
            message: gift.message,
            expiresAt: gift.expiresAt,
            redeemedAt: gift.redeemedAt,
            createdAt: gift.createdAt,
            senderName: gift.createdBy?.name || null,
            recipientEmailHint: gift.recipientEmail ? maskEmail(gift.recipientEmail) : null,
            requiresEmailMatch: Boolean(gift.recipientEmail),
        },
    });
}
