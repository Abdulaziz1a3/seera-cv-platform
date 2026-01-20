// Admin API to fix subscription
// POST /api/admin/fix-subscription

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    const session = await auth();

    // Only allow SUPER_ADMIN users - regular users cannot access this
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 });
    }

    try {
        const { email } = await request.json();
        const targetEmail = email || 'abdulaziz1a3@gmail.com';

        const user = await prisma.user.findFirst({
            where: { email: { equals: targetEmail, mode: 'insensitive' } },
            include: { subscription: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Set up Pro subscription for 1 year
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (user.subscription) {
            await prisma.subscription.update({
                where: { userId: user.id },
                data: {
                    plan: 'PRO',
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: oneYearFromNow,
                    cancelAtPeriodEnd: false
                }
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    plan: 'PRO',
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: oneYearFromNow,
                    cancelAtPeriodEnd: false
                }
            });
        }

        // Reset AI credits
        const creditBalance = await prisma.aICreditBalance.findUnique({
            where: { userId: user.id }
        });

        if (creditBalance) {
            await prisma.aICreditBalance.update({
                where: { userId: user.id },
                data: {
                    balance: 1000,
                    totalPurchased: creditBalance.totalPurchased + 1000
                }
            });
        } else {
            await prisma.aICreditBalance.create({
                data: {
                    userId: user.id,
                    balance: 1000,
                    totalPurchased: 1000,
                    totalUsed: 0
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription and credits restored',
            user: {
                email: user.email,
                name: user.name
            },
            subscription: {
                plan: 'PRO',
                validUntil: oneYearFromNow.toISOString()
            },
            credits: 1000
        });

    } catch (error) {
        console.error('Fix subscription error:', error);
        return NextResponse.json({ error: 'Failed to fix subscription' }, { status: 500 });
    }
}
