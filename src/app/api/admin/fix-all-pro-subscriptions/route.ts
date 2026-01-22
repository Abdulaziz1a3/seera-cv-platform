/**
 * Admin API to fix all broken PRO subscriptions
 * POST /api/admin/fix-all-pro-subscriptions
 *
 * This fixes users created before Jan 20, 2026 who have:
 * - plan: 'PRO'
 * - status: 'UNPAID'
 * - currentPeriodEnd: null or expired
 *
 * Sets them to:
 * - status: 'ACTIVE'
 * - currentPeriodEnd: +1 year from now
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    const session = await auth();

    // Only allow SUPER_ADMIN users
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 });
    }

    try {
        const { dryRun = true } = await request.json();

        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        // Find all broken PRO subscriptions
        const brokenSubscriptions = await prisma.subscription.findMany({
            where: {
                plan: 'PRO',
                OR: [
                    // Status is UNPAID (old bug)
                    { status: 'UNPAID' },
                    // Status is ACTIVE but no expiration date
                    {
                        status: 'ACTIVE',
                        currentPeriodEnd: null,
                    },
                    // Status is ACTIVE but expired
                    {
                        status: 'ACTIVE',
                        currentPeriodEnd: {
                            lt: now,
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        createdAt: true,
                    },
                },
            },
        });

        const results = {
            found: brokenSubscriptions.length,
            fixed: 0,
            skipped: 0,
            dryRun,
            users: [] as Array<{
                email: string;
                name: string | null;
                createdAt: Date;
                oldStatus: string;
                oldPeriodEnd: Date | null;
                action: string;
            }>,
        };

        if (dryRun) {
            // Just report what would be fixed
            results.users = brokenSubscriptions.map((sub) => ({
                email: sub.user.email,
                name: sub.user.name,
                createdAt: sub.user.createdAt,
                oldStatus: sub.status,
                oldPeriodEnd: sub.currentPeriodEnd,
                action: 'Would fix: Set status=ACTIVE, currentPeriodEnd=+1year',
            }));
            results.skipped = brokenSubscriptions.length;
        } else {
            // Actually fix them
            for (const sub of brokenSubscriptions) {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: {
                        status: 'ACTIVE',
                        currentPeriodStart: sub.currentPeriodStart || now,
                        currentPeriodEnd: oneYearFromNow,
                        cancelAtPeriodEnd: false,
                    },
                });

                results.users.push({
                    email: sub.user.email,
                    name: sub.user.name,
                    createdAt: sub.user.createdAt,
                    oldStatus: sub.status,
                    oldPeriodEnd: sub.currentPeriodEnd,
                    action: 'Fixed: Set status=ACTIVE, currentPeriodEnd=+1year',
                });
                results.fixed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: dryRun
                ? `Found ${results.found} broken PRO subscriptions. Run with dryRun=false to fix them.`
                : `Fixed ${results.fixed} broken PRO subscriptions.`,
            results,
        });
    } catch (error) {
        console.error('Fix all pro subscriptions error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fix subscriptions',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
