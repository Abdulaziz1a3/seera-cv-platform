// CLI script to debug subscription issues
// Usage: npx ts-node scripts/debug-subscription.ts <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

async function debugSubscription(email: string) {
    console.log('\n🔍 Subscription Diagnostic Report');
    console.log('=====================================\n');
    console.log(`Email: ${email}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
        // Query user with subscription details
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: {
                subscription: true,
                _count: {
                    select: {
                        resumes: true,
                    }
                }
            }
        });

        // Check if user exists
        if (!user) {
            console.log('❌ User not found\n');
            console.log('💡 Recommended Fix: User does not exist in database');
            process.exit(1);
        }

        console.log(`✅ User found: ${user.id}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Resumes: ${user._count.resumes}\n`);

        // Check if user is SUPER_ADMIN
        if (user.role === 'SUPER_ADMIN') {
            console.log('✅ User is SUPER_ADMIN - has full access\n');
            console.log('💡 No fix needed - SUPER_ADMIN bypasses subscription checks');
            await prisma.$disconnect();
            process.exit(0);
        }

        // Check if subscription exists
        if (!user.subscription) {
            console.log('❌ No subscription record found\n');
            console.log('💡 Recommended Fix:');
            console.log(`   Call: POST /api/admin/fix-subscription`);
            console.log(`   Body: { "email": "${email}" }`);
            await prisma.$disconnect();
            process.exit(1);
        }

        console.log('📋 Subscription Details:');
        console.log(`   Plan: ${user.subscription.plan}`);
        console.log(`   Status: ${user.subscription.status}`);
        console.log(`   Current Period Start: ${user.subscription.currentPeriodStart?.toISOString() || 'N/A'}`);
        console.log(`   Current Period End: ${user.subscription.currentPeriodEnd?.toISOString() || 'N/A'}`);
        console.log(`   Cancel at Period End: ${user.subscription.cancelAtPeriodEnd}`);
        console.log(`   Stripe Customer ID: ${user.subscription.stripeCustomerId || 'N/A'}`);
        console.log(`   Stripe Subscription ID: ${user.subscription.stripeSubscriptionId || 'N/A'}\n`);

        // Run checks
        console.log('🔎 Subscription Checks:');
        const checks = {
            planNotFree: user.subscription.plan !== 'FREE',
            statusActive: ACTIVE_STATUSES.has(user.subscription.status),
            notExpired: user.subscription.currentPeriodEnd ? user.subscription.currentPeriodEnd > new Date() : false
        };

        const failures: string[] = [];

        // Check 1: Plan
        if (checks.planNotFree) {
            console.log(`   ✅ Plan is ${user.subscription.plan} (not FREE)`);
        } else {
            console.log(`   ❌ Plan is FREE (must be PRO or ENTERPRISE)`);
            failures.push('Plan is FREE');
        }

        // Check 2: Status
        if (checks.statusActive) {
            console.log(`   ✅ Status is ${user.subscription.status} (ACTIVE or TRIALING)`);
        } else {
            console.log(`   ❌ Status is ${user.subscription.status} (must be ACTIVE or TRIALING)`);
            failures.push(`Status is ${user.subscription.status}`);
        }

        // Check 3: Expiration
        if (user.subscription.currentPeriodEnd) {
            const now = new Date();
            if (checks.notExpired) {
                const daysRemaining = Math.floor((user.subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                console.log(`   ✅ Not expired (${daysRemaining} days remaining)`);
            } else {
                const daysExpired = Math.floor((now.getTime() - user.subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
                console.log(`   ❌ Expired ${daysExpired} days ago`);
                failures.push(`Expired ${daysExpired} days ago`);
            }
        } else {
            console.log(`   ❌ No expiration date set`);
            failures.push('No currentPeriodEnd date');
        }

        const hasActiveSubscription = checks.planNotFree && checks.statusActive && checks.notExpired;

        console.log('\n📊 Final Result:');
        if (hasActiveSubscription) {
            console.log('   ✅ hasActiveSubscription() = true');
            console.log('   💡 No fix needed - all checks pass\n');
        } else {
            console.log('   ❌ hasActiveSubscription() = false');
            console.log('\n❌ Failure Reasons:');
            failures.forEach(reason => console.log(`   - ${reason}`));
            console.log('\n💡 Recommended Fix:');
            console.log(`   Call: POST /api/admin/fix-subscription`);
            console.log(`   Body: { "email": "${email}" }`);
            console.log('   This will set:');
            console.log('   - plan: PRO');
            console.log('   - status: ACTIVE');
            console.log('   - currentPeriodEnd: +1 year\n');
        }

        await prisma.$disconnect();
        process.exit(hasActiveSubscription ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
    console.error('❌ Usage: npx ts-node scripts/debug-subscription.ts <email>');
    console.error('   Example: npx ts-node scripts/debug-subscription.ts abdulaziz1a3@gmail.com');
    process.exit(1);
}

debugSubscription(email);
