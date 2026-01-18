import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gifts = await prisma.giftSubscription.findMany({
        where: { createdByUserId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            token: true,
            plan: true,
            interval: true,
            status: true,
            recipientEmail: true,
            message: true,
            amountSar: true,
            expiresAt: true,
            createdAt: true,
            redeemedAt: true,
            redeemedBy: {
                select: { email: true, name: true },
            },
        },
    });

    return NextResponse.json({ gifts });
}
