// Script to investigate user subscription and credits
// Run with: npx tsx scripts/check-user.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    const email = 'abdulaziz1a3@gmail.com';

    console.log(`\n=== Investigating User: ${email} ===\n`);

    // Get user with subscription
    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { subscription: true }
    });

    if (!user) {
        console.log('❌ User not found');
        await prisma.$disconnect();
        return;
    }

    console.log('📧 User Info:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.createdAt}`);

    console.log('\n💳 Subscription:');
    if (user.subscription) {
        console.log(`  Plan: ${user.subscription.plan}`);
        console.log(`  Status: ${user.subscription.status}`);
        console.log(`  Period Start: ${user.subscription.currentPeriodStart}`);
        console.log(`  Period End: ${user.subscription.currentPeriodEnd}`);
        console.log(`  Cancel at Period End: ${user.subscription.cancelAtPeriodEnd}`);
    } else {
        console.log('  ❌ No subscription record found');
    }

    // Get AI credit balance
    const creditBalance = await prisma.aICreditBalance.findUnique({
        where: { userId: user.id }
    });

    console.log('\n💰 AI Credits:');
    if (creditBalance) {
        console.log(`  Balance: ${creditBalance.balance}`);
        console.log(`  Total Purchased: ${creditBalance.totalPurchased}`);
        console.log(`  Total Used: ${creditBalance.totalUsed}`);
        console.log(`  Last Updated: ${creditBalance.updatedAt}`);
    } else {
        console.log('  ❌ No credit balance record found');
    }

    // Get recent payment transactions
    const payments = await prisma.paymentTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('\n📝 Recent Payments:');
    if (payments.length > 0) {
        payments.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.purpose} - ${p.status} - ${p.amountSar} SAR (${p.createdAt})`);
        });
    } else {
        console.log('  No payment records found');
    }

    // Check for any AI credit usage
    const creditUsage = await prisma.aICreditUsage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('\n📊 Recent AI Credit Usage:');
    if (creditUsage.length > 0) {
        creditUsage.forEach((u, i) => {
            console.log(`  ${i + 1}. ${u.operation} - ${u.credits} credits (${u.createdAt})`);
        });
    } else {
        console.log('  No usage records found');
    }

    await prisma.$disconnect();
}

checkUser().catch(console.error);
