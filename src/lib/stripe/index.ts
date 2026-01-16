import Stripe from 'stripe';
import { prisma } from '@/lib/db';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

// Plan configuration
export const PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        features: {
            resumes: 1,
            aiGenerationsPerMonth: 3,
            templates: ['classic'],
            exports: ['pdf'],
        },
    },
    PRO: {
        name: 'Pro',
        monthlyPriceId: process.env.STRIPE_PRICE_MONTHLY_PRO,
        yearlyPriceId: process.env.STRIPE_PRICE_YEARLY_PRO,
        monthlyPrice: 39,
        yearlyPrice: 299,
        features: {
            resumes: -1, // Unlimited
            aiGenerationsPerMonth: 100,
            templates: 'all',
            exports: ['pdf', 'docx', 'txt'],
            jobTargeting: true,
            coverLetter: true,
            applicationTracker: true,
        },
    },
    ENTERPRISE: {
        name: 'Enterprise',
        monthlyPriceId: process.env.STRIPE_PRICE_MONTHLY_ENTERPRISE,
        yearlyPriceId: process.env.STRIPE_PRICE_YEARLY_ENTERPRISE,
        monthlyPrice: 249,
        yearlyPrice: 1990,
        features: {
            resumes: -1,
            aiGenerationsPerMonth: -1, // Unlimited
            templates: 'all',
            exports: ['pdf', 'docx', 'txt'],
            jobTargeting: true,
            coverLetter: true,
            applicationTracker: true,
            whiteLabel: true,
            teamSeats: 5,
            apiAccess: true,
        },
    },
};

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    name?: string
): Promise<string> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (subscription?.stripeCustomerId) {
        return subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
            userId,
        },
    });

    // Update subscription with customer ID
    await prisma.subscription.upsert({
        where: { userId },
        update: { stripeCustomerId: customer.id },
        create: {
            userId,
            plan: 'FREE',
            status: 'ACTIVE',
            stripeCustomerId: customer.id,
        },
    });

    return customer.id;
}

// Create checkout session
export async function createCheckoutSession(
    userId: string,
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
): Promise<Stripe.Checkout.Session> {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId,
        },
        subscription_data: {
            metadata: {
                userId,
            },
        },
    });

    return session;
}

// Create customer portal session
export async function createPortalSession(
    userId: string,
    returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
        throw new Error('No Stripe customer found');
    }

    return stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
    });
}

// Handle subscription created/updated
export async function handleSubscriptionChange(
    subscription: Stripe.Subscription
): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    const priceId = subscription.items.data[0]?.price.id;

    // Determine plan from price ID
    let plan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE';
    if (priceId === PLANS.PRO.monthlyPriceId || priceId === PLANS.PRO.yearlyPriceId) {
        plan = 'PRO';
    } else if (priceId === PLANS.ENTERPRISE.monthlyPriceId || priceId === PLANS.ENTERPRISE.yearlyPriceId) {
        plan = 'ENTERPRISE';
    }

    // Map Stripe status to our status
    const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING'> = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'UNPAID',
        trialing: 'TRIALING',
    };

    await prisma.subscription.update({
        where: { userId },
        data: {
            plan,
            status: statusMap[subscription.status] || 'ACTIVE',
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    // Log the change
    await prisma.auditLog.create({
        data: {
            userId,
            action: 'SUBSCRIPTION_UPDATED',
            entity: 'Subscription',
            entityId: subscription.id,
            details: {
                plan,
                status: subscription.status,
            },
        },
    });
}

// Handle subscription deleted
export async function handleSubscriptionDeleted(
    subscription: Stripe.Subscription
): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await prisma.subscription.update({
        where: { userId },
        data: {
            plan: 'FREE',
            status: 'CANCELED',
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId,
            action: 'SUBSCRIPTION_CANCELED',
            entity: 'Subscription',
            entityId: subscription.id,
        },
    });
}

// Check if user has feature access
export async function hasFeatureAccess(
    userId: string,
    feature: string
): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription) return false;

    const planFeatures = PLANS[subscription.plan]?.features;
    if (!planFeatures) return false;

    return !!planFeatures[feature as keyof typeof planFeatures];
}

// Get remaining AI generations for the month
export async function getRemainingAIGenerations(userId: string): Promise<number> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    const plan = subscription?.plan || 'FREE';
    const limit = PLANS[plan].features.aiGenerationsPerMonth;

    if (limit === -1) return Infinity; // Unlimited

    // Count this month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usedCount = await prisma.usageRecord.count({
        where: {
            userId,
            type: 'AI_GENERATION',
            createdAt: { gte: startOfMonth },
        },
    });

    return Math.max(0, limit - usedCount);
}

// Record AI generation usage
export async function recordAIUsage(userId: string): Promise<boolean> {
    const remaining = await getRemainingAIGenerations(userId);

    if (remaining <= 0) {
        return false; // User has exceeded limit
    }

    await prisma.usageRecord.create({
        data: {
            userId,
            type: 'AI_GENERATION',
        },
    });

    return true;
}

// Get user's current plan details
export async function getUserPlan(userId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    const plan = subscription?.plan || 'FREE';
    const planDetails = PLANS[plan];

    return {
        plan,
        ...planDetails,
        subscription: subscription ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        } : null,
    };
}
