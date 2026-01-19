import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch pending gifts for the current user's email
export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userEmail = session.user.email.toLowerCase();
        const now = new Date();

        // Find pending gifts targeted to this user's email
        const pendingGifts = await prisma.giftSubscription.findMany({
            where: {
                recipientEmail: {
                    equals: userEmail,
                    mode: 'insensitive',
                },
                status: 'PENDING',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: now } },
                ],
            },
            select: {
                id: true,
                token: true,
                plan: true,
                interval: true,
                message: true,
                expiresAt: true,
                createdAt: true,
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            pendingGifts: pendingGifts.map(gift => ({
                id: gift.id,
                token: gift.token,
                plan: gift.plan,
                interval: gift.interval,
                message: gift.message,
                expiresAt: gift.expiresAt?.toISOString() || null,
                createdAt: gift.createdAt?.toISOString() || null,
                fromName: gift.createdBy?.name || null,
                fromEmail: gift.createdBy?.email || null,
            })),
        });
    } catch (error) {
        console.error('Error fetching pending gifts:', error);
        return NextResponse.json({ error: 'Failed to fetch pending gifts' }, { status: 500 });
    }
}
