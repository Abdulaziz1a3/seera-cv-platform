// Script to restore user subscription and credits
// Run with: npx tsx scripts/fix-subscription.ts

import { PrismaClient } from '@prisma/client';

// Hardcoded for this script - avoid env loading issues
// Password: Aziz9595@!@!seera - URL encoded @!@! as %40%21%40%21
const DATABASE_URL = 'postgresql://postgres.vvujueotjtzecbzfrayx:Aziz9595%40%21%40%21seera@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function fixSubscription() {
    const email = 'abdulaziz1a3@gmail.com';

    console.log(`\n=== Fixing Subscription for: ${email} ===\n`);

    try {
        // Get user
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: { subscription: true }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ Found user: ${user.name} (${user.id})`);

        // Set up Pro subscription for 1 year
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (user.subscription) {
            console.log(`Current plan: ${user.subscription.plan}, Status: ${user.subscription.status}`);
            console.log(`Period End: ${user.subscription.currentPeriodEnd}`);

            // Update existing subscription
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
            console.log('✅ Subscription updated to Pro (1 year)');
        } else {
            // Create new subscription
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
            console.log('✅ Created new Pro subscription (1 year)');
        }

        // Reset AI credits
        const creditBalance = await prisma.aICreditBalance.findUnique({
            where: { userId: user.id }
        });

        if (creditBalance) {
            await prisma.aICreditBalance.update({
                where: { userId: user.id },
                data: {
                    balance: 1000, // Give 1000 credits
                    totalPurchased: creditBalance.totalPurchased + 1000
                }
            });
            console.log('✅ Added 1000 AI credits');
        } else {
            await prisma.aICreditBalance.create({
                data: {
                    userId: user.id,
                    balance: 1000,
                    totalPurchased: 1000,
                    totalUsed: 0
                }
            });
            console.log('✅ Created credit balance with 1000 credits');
        }

        console.log('\n🎉 Subscription and credits restored successfully!');
        console.log(`   Plan: Pro`);
        console.log(`   Valid until: ${oneYearFromNow.toLocaleDateString()}`);
        console.log(`   Credits: 1000`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSubscription();
