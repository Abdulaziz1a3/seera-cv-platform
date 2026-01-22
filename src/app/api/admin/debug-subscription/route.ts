// Admin API to debug subscription issues
// POST /api/admin/debug-subscription

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

export async function POST(request: Request) {
    const session = await auth();

    // Only allow SUPER_ADMIN users
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 });
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Query user with subscription details
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: {
                subscription: true,
                _count: {
                    select: {
                        resumes: true,
                        talentProfile: true
                    }
                }
            }
        });

        // Build diagnostic report
        const diagnostic = {
            timestamp: new Date().toISOString(),
            email,
            userExists: !!user,
            userId: user?.id || null,
            role: user?.role || null,
            subscriptionExists: !!user?.subscription,
            subscription: user?.subscription ? {
                plan: user.subscription.plan,
                status: user.subscription.status,
                currentPeriodStart: user.subscription.currentPeriodStart?.toISOString() || null,
                currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
                cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                stripeCustomerId: user.subscription.stripeCustomerId || null,
                stripeSubscriptionId: user.subscription.stripeSubscriptionId || null,
            } : null,
            resumeCount: user?._count.resumes || 0,
            hasTalentProfile: (user?._count.talentProfile || 0) > 0,
            checks: {} as Record<string, boolean>,
            hasActiveSubscription: false,
            failureReason: [] as string[],
            recommendedFix: '',
        };

        // If user doesn't exist, return early
        if (!user) {
            diagnostic.failureReason.push('User not found');
            diagnostic.recommendedFix = 'User does not exist in database';
            return NextResponse.json(diagnostic, { status: 200 });
        }

        // Run through subscription checks step by step
        const now = new Date();

        // Check 1: Is user SUPER_ADMIN?
        diagnostic.checks.isSuperAdmin = user.role === 'SUPER_ADMIN';
        if (diagnostic.checks.isSuperAdmin) {
            diagnostic.hasActiveSubscription = true;
            diagnostic.recommendedFix = 'No fix needed - SUPER_ADMIN has access';
            return NextResponse.json(diagnostic, { status: 200 });
        }

        // Check 2: Does subscription exist?
        if (!user.subscription) {
            diagnostic.checks.subscriptionExists = false;
            diagnostic.failureReason.push('No subscription record found');
            diagnostic.recommendedFix = 'Call POST /api/admin/fix-subscription with this email to create Pro subscription';
            return NextResponse.json(diagnostic, { status: 200 });
        }

        diagnostic.checks.subscriptionExists = true;

        // Check 3: Is plan not FREE?
        diagnostic.checks.planNotFree = user.subscription.plan !== 'FREE';
        if (user.subscription.plan === 'FREE') {
            diagnostic.failureReason.push(`Plan is FREE (must be PRO or ENTERPRISE)`);
        }

        // Check 4: Is status ACTIVE or TRIALING?
        diagnostic.checks.statusActive = ACTIVE_STATUSES.has(user.subscription.status);
        if (!diagnostic.checks.statusActive) {
            diagnostic.failureReason.push(`Status is ${user.subscription.status} (must be ACTIVE or TRIALING)`);
        }

        // Check 5: Is subscription not expired?
        if (user.subscription.currentPeriodEnd) {
            diagnostic.checks.notExpired = user.subscription.currentPeriodEnd > now;
            if (!diagnostic.checks.notExpired) {
                const daysExpired = Math.floor((now.getTime() - user.subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
                diagnostic.failureReason.push(`Subscription expired ${daysExpired} days ago (expired: ${user.subscription.currentPeriodEnd.toISOString()})`);
            }
        } else {
            diagnostic.checks.notExpired = false;
            diagnostic.failureReason.push('No currentPeriodEnd date set (subscription has no expiration date)');
        }

        // Final result
        diagnostic.hasActiveSubscription =
            diagnostic.checks.planNotFree &&
            diagnostic.checks.statusActive &&
            diagnostic.checks.notExpired;

        // Recommended fix
        if (!diagnostic.hasActiveSubscription) {
            if (diagnostic.failureReason.length > 0) {
                diagnostic.recommendedFix = `Call POST /api/admin/fix-subscription with email="${email}" to set plan=PRO, status=ACTIVE, currentPeriodEnd=+1year`;
            }
        } else {
            diagnostic.recommendedFix = 'No fix needed - all checks pass';
        }

        return NextResponse.json(diagnostic, { status: 200 });

    } catch (error) {
        console.error('Debug subscription error:', error);
        return NextResponse.json({
            error: 'Failed to debug subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
