/**
 * Debug and Fix Subscription Script
 *
 * This script directly queries and fixes the subscription for a test account
 * Usage: npx ts-node scripts/debug-and-fix-subscription.ts [email]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

async function debugAndFixSubscription(email: string) {
    console.log('\n=== Subscription Diagnostic & Fix Tool ===\n');
    console.log(`Target Email: ${email}\n`);

    try {
        // Step 1: Query user with subscription
        console.log('Step 1: Querying database...');
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: {
                subscription: true,
                talentProfile: true,
                _count: {
                    select: {
                        resumes: true,
                    },
                },
            },
        });

        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found');
        console.log(`   User ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Resumes: ${user._count.resumes}`);
        console.log(`   Has Talent Profile: ${!!user.talentProfile}`);

        // Step 2: Check subscription
        console.log('\nStep 2: Checking subscription status...');
        const now = new Date();

        if (!user.subscription) {
            console.log('❌ No subscription record found');
            console.log('\nStep 3: Creating Pro subscription...');
            await createProSubscription(user.id, email);
            return;
        }

        console.log('✅ Subscription record exists');
        console.log(`   Plan: ${user.subscription.plan}`);
        console.log(`   Status: ${user.subscription.status}`);
        console.log(`   Period Start: ${user.subscription.currentPeriodStart?.toISOString() || 'null'}`);
        console.log(`   Period End: ${user.subscription.currentPeriodEnd?.toISOString() || 'null'}`);

        // Step 3: Run checks
        console.log('\nStep 3: Running subscription checks...');

        const checks = {
            isSuperAdmin: user.role === 'SUPER_ADMIN',
            planNotFree: user.subscription.plan !== 'FREE',
            statusActive: ACTIVE_STATUSES.has(user.subscription.status),
            notExpired: user.subscription.currentPeriodEnd
                ? user.subscription.currentPeriodEnd > now
                : false,
        };

        console.log(`   ✓ Is Super Admin: ${checks.isSuperAdmin ? '✅' : '❌'}`);
        console.log(`   ✓ Plan Not Free: ${checks.planNotFree ? '✅' : '❌'} (${user.subscription.plan})`);
        console.log(`   ✓ Status Active: ${checks.statusActive ? '✅' : '❌'} (${user.subscription.status})`);
        console.log(`   ✓ Not Expired: ${checks.notExpired ? '✅' : '❌'}`);

        if (user.subscription.currentPeriodEnd) {
            const diffMs = user.subscription.currentPeriodEnd.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                console.log(`      → Expires in ${diffDays} days`);
            } else {
                console.log(`      → Expired ${Math.abs(diffDays)} days ago`);
            }
        } else {
            console.log('      → No expiration date set');
        }

        const hasActiveSubscription =
            checks.isSuperAdmin || (checks.planNotFree && checks.statusActive && checks.notExpired);

        console.log(`\n   Final Result: hasActiveSubscription = ${hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}`);

        // Step 4: Fix if needed
        if (!hasActiveSubscription && !checks.isSuperAdmin) {
            console.log('\n❌ Subscription check FAILED');
            console.log('\nStep 4: Fixing subscription...');
            await updateProSubscription(user.id, email);
        } else {
            console.log('\n✅ Subscription check PASSED - No fix needed');
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function createProSubscription(userId: string, email: string) {
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await prisma.subscription.create({
        data: {
            userId,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: oneYearFromNow,
            cancelAtPeriodEnd: false,
        },
    });

    console.log('✅ Pro subscription created successfully');
    console.log(`   Plan: PRO`);
    console.log(`   Status: ACTIVE`);
    console.log(`   Valid Until: ${oneYearFromNow.toISOString()}`);
    console.log(`   Duration: 365 days`);
}

async function updateProSubscription(userId: string, email: string) {
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await prisma.subscription.update({
        where: { userId },
        data: {
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: oneYearFromNow,
            cancelAtPeriodEnd: false,
        },
    });

    console.log('✅ Subscription updated successfully');
    console.log(`   Plan: PRO`);
    console.log(`   Status: ACTIVE`);
    console.log(`   Valid Until: ${oneYearFromNow.toISOString()}`);
    console.log(`   Duration: 365 days`);

    // Verify the fix
    console.log('\nStep 5: Verifying fix...');
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
    });

    if (updatedUser?.subscription) {
        const checks = {
            planNotFree: updatedUser.subscription.plan !== 'FREE',
            statusActive: ACTIVE_STATUSES.has(updatedUser.subscription.status),
            notExpired: updatedUser.subscription.currentPeriodEnd
                ? updatedUser.subscription.currentPeriodEnd > new Date()
                : false,
        };

        const hasActiveSubscription = checks.planNotFree && checks.statusActive && checks.notExpired;

        console.log(`   hasActiveSubscription: ${hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}`);

        if (hasActiveSubscription) {
            console.log('\n✅ SUCCESS! User can now join Talent Pool');
        } else {
            console.log('\n❌ WARNING: Fix may not have worked correctly');
        }
    }
}

// Main execution
const email = process.argv[2] || 'abdulaziz1a3@gmail.com';
debugAndFixSubscription(email)
    .then(() => {
        console.log('\n=== Done ===\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
