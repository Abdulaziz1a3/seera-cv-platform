// Production-Ready Stripe Payment Integration for Seera AI
// Handles subscriptions, payments, usage tracking, and webhook processing

import Stripe from 'stripe';
import crypto from 'crypto';
import { prisma } from './db';
import { logger } from './logger';
import { MIN_RECHARGE_SAR, sarToCredits, recordAICreditTopup } from './ai-credits';
import { sendGiftSubscriptionEmail } from './email';

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
          typescript: true,
      })
    : null;

// Subscription Plans with SAR pricing
export const PLANS = {
    free: {
        id: 'free',
        name: { ar: 'مجاني', en: 'Free' },
        priceMonthly: 0,
        priceYearly: 0,
        features: {
            resumeLimit: 0,
            downloadLimit: 0,
            aiUsageLimit: 0,
            premiumTemplates: false,
            docxExport: false,
            coverLetters: false,
            atsDetails: false,
            interviewPrep: false,
            careerGps: false,
        },
    },
    pro: {
        id: 'pro',
        name: { ar: 'احترافي', en: 'Pro' },
        priceMonthly: 39, // SAR
        priceYearly: 299, // SAR
        stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
        features: {
            resumeLimit: -1, // unlimited
            downloadLimit: -1,
            aiUsageLimit: 100,
            premiumTemplates: true,
            docxExport: true,
            coverLetters: true,
            atsDetails: true,
            interviewPrep: true,
            careerGps: false,
        },
    },
    enterprise: {
        id: 'enterprise',
        name: { ar: 'المؤسسات', en: 'Enterprise' },
        priceMonthly: 249, // SAR
        priceYearly: 1990, // SAR
        stripePriceIdMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
        stripePriceIdYearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
        features: {
            resumeLimit: -1,
            downloadLimit: -1,
            aiUsageLimit: -1, // unlimited
            premiumTemplates: true,
            docxExport: true,
            coverLetters: true,
            atsDetails: true,
            interviewPrep: true,
            careerGps: true,
            teamMembers: true,
            analytics: true,
            customBranding: true,
            prioritySupport: true,
        },
    },
} as const;

export type PlanId = keyof typeof PLANS;
export type PlanFeature = keyof typeof PLANS.pro.features;

const GIFT_CLAIM_WINDOW_DAYS = 90;

// Create a checkout session
export async function createCheckoutSession(
    userId: string,
    planId: 'pro' | 'enterprise',
    billing: 'monthly' | 'yearly',
    returnUrl: string
): Promise<string> {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const plan = PLANS[planId];
    const priceId =
        billing === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
        throw new Error(`Price ID not configured for ${planId} ${billing}`);
    }

    // Get or create Stripe customer
    let customerId: string;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.subscription?.stripeCustomerId) {
        customerId = user.subscription.stripeCustomerId;
    } else {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: { userId },
        });
        customerId = customer.id;

        // Store customer ID without activating subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId },
        });
        if (existingSubscription) {
            await prisma.subscription.update({
                where: { userId },
                data: { stripeCustomerId: customerId },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId,
                    stripeCustomerId: customerId,
                    plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE',
                    status: 'UNPAID',
                },
            });
        }
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
        metadata: {
            userId,
            planId,
            billing,
        },
        subscription_data: {
            metadata: {
                userId,
                planId,
            },
        },
        currency: 'sar',
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        tax_id_collection: { enabled: true },
    });

    logger.paymentEvent('checkout_session_created', userId, plan.priceMonthly, {
        planId,
        billing,
        sessionId: session.id,
    });

    return session.url!;
}

export async function createGiftCheckoutSession(params: {
    buyerId: string;
    planId: 'pro' | 'enterprise';
    interval: 'monthly' | 'yearly';
    recipientEmail?: string;
    message?: string;
    returnUrl: string;
}): Promise<string> {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const plan = PLANS[params.planId];
    const amountSar = params.interval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const amountInHalalah = Math.round(amountSar * 100);

    const buyer = await prisma.user.findUnique({
        where: { id: params.buyerId },
        select: { email: true, name: true },
    });

    if (!buyer) {
        throw new Error('User not found');
    }

    const trimmedMessage = params.message?.trim().slice(0, 300) || '';

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: buyer.email,
        line_items: [
            {
                price_data: {
                    currency: 'sar',
                    product_data: {
                        name: `Gift ${plan.name.en} (${params.interval})`,
                    },
                    unit_amount: amountInHalalah,
                },
                quantity: 1,
            },
        ],
        success_url: `${params.returnUrl}?giftSuccess=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${params.returnUrl}?giftCanceled=true`,
        metadata: {
            type: 'gift_subscription',
            buyerId: params.buyerId,
            planId: params.planId,
            interval: params.interval,
            recipientEmail: params.recipientEmail || '',
            message: trimmedMessage,
        },
        currency: 'sar',
        billing_address_collection: 'required',
    });

    logger.paymentEvent('gift_checkout_created', params.buyerId, amountSar, {
        planId: params.planId,
        interval: params.interval,
        sessionId: session.id,
        recipientEmail: params.recipientEmail,
    });

    return session.url!;
}

// Create one-time checkout session for AI credit top-up
export async function createCreditTopupSession(
    userId: string,
    amountSar: number,
    returnUrl: string
): Promise<string> {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    if (amountSar < MIN_RECHARGE_SAR) {
        throw new Error(`Minimum recharge is ${MIN_RECHARGE_SAR} SAR`);
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: { userId },
        });
        customerId = customer.id;

        if (user.subscription) {
            await prisma.subscription.update({
                where: { userId },
                data: { stripeCustomerId: customerId },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId,
                    stripeCustomerId: customerId,
                    plan: 'FREE',
                    status: 'UNPAID',
                },
            });
        }
    }

    const credits = sarToCredits(amountSar);
    const amountInHalalah = Math.round(amountSar * 100);

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'sar',
                    product_data: {
                        name: 'AI Credits',
                        description: `${credits} credits`,
                    },
                    unit_amount: amountInHalalah,
                },
                quantity: 1,
            },
        ],
        success_url: `${returnUrl}?creditsSuccess=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?creditsCanceled=true`,
        metadata: {
            type: 'ai_credits',
            userId,
            credits: credits.toString(),
            amountSar: amountSar.toFixed(2),
        },
    });

    logger.paymentEvent('credit_topup_session_created', userId, amountSar, {
        sessionId: session.id,
        credits,
    });

    return session.url!;
}

// Create customer portal session
export async function createPortalSession(
    customerId: string,
    returnUrl: string
): Promise<string> {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session.url;
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
    if (!stripe) return null;
    return stripe.subscriptions.retrieve(subscriptionId);
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    return stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    return stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
}

// Check if user has feature access based on plan
export function hasFeatureAccess(userPlan: PlanId, feature: PlanFeature): boolean {
    const plan = PLANS[userPlan];
    const featureValue = plan.features[feature as keyof typeof plan.features];

    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'number') return featureValue > 0 || featureValue === -1;
    return false;
}

// Check if user is within usage limits
export function isWithinLimit(
    userPlan: PlanId,
    limitType: 'resumeLimit' | 'downloadLimit' | 'aiUsageLimit',
    currentUsage: number
): boolean {
    const limit = PLANS[userPlan].features[limitType];
    if (limit === -1) return true; // unlimited
    return currentUsage < limit;
}

// Get plan limits
export function getPlanLimits(planId: PlanId) {
    return PLANS[planId].features;
}

// ==========================================
// AI USAGE TRACKING (Database-Persisted)
// ==========================================

export type UsageType =
    | 'AI_GENERATION'
    | 'AI_CREDIT_TOPUP'
    | 'EXPORT_PDF'
    | 'EXPORT_DOCX'
    | 'RESUME_CREATE'
    | 'JD_ANALYSIS';

// Record usage in database
export async function recordUsage(
    userId: string,
    type: UsageType,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        await prisma.usageRecord.create({
            data: {
                userId,
                type,
                count: 1,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        });

        logger.debug('Usage recorded', { userId, type });
    } catch (error) {
        logger.error('Failed to record usage', {
            error: error as Error,
            userId,
            type,
        });
    }
}

// Get usage count for current billing period
export async function getUsageCount(
    userId: string,
    type: UsageType
): Promise<number> {
    try {
        // Get the start of the current month (billing period)
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const result = await prisma.usageRecord.aggregate({
            where: {
                userId,
                type,
                createdAt: { gte: periodStart },
            },
            _sum: { count: true },
        });

        return result._sum.count || 0;
    } catch (error) {
        logger.error('Failed to get usage count', {
            error: error as Error,
            userId,
            type,
        });
        return 0;
    }
}

// Check if user can perform action based on usage limits
export async function canPerformAction(
    userId: string,
    actionType: UsageType
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
        // Get user's subscription plan
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription || (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING')) {
            return { allowed: false, remaining: 0, limit: 0 };
        }

        const planId = (subscription.plan?.toLowerCase() || 'free') as PlanId;
        const plan = PLANS[planId];

        // Map action type to limit type
        const limitMap: Record<UsageType, keyof typeof plan.features> = {
            AI_GENERATION: 'aiUsageLimit',
            EXPORT_PDF: 'downloadLimit',
            EXPORT_DOCX: 'downloadLimit',
            RESUME_CREATE: 'resumeLimit',
            JD_ANALYSIS: 'aiUsageLimit',
            AI_CREDIT_TOPUP: 'aiUsageLimit',
        };

        const limitKey = limitMap[actionType];
        const limit = plan.features[limitKey] as number;

        // Unlimited
        if (limit === -1) {
            return { allowed: true, remaining: -1, limit: -1 };
        }

        const currentUsage = await getUsageCount(userId, actionType);
        const remaining = Math.max(0, limit - currentUsage);

        return {
            allowed: currentUsage < limit,
            remaining,
            limit,
        };
    } catch (error) {
        logger.error('Failed to check action permission', {
            error: error as Error,
            userId,
            actionType,
        });
        // Fail open for better UX, but log the error
        return { allowed: true, remaining: 100, limit: 100 };
    }
}

// Get remaining AI generations
export async function getRemainingAIGenerations(userId: string): Promise<number> {
    const result = await canPerformAction(userId, 'AI_GENERATION');
    return result.remaining;
}

// Record AI usage (convenience wrapper)
export async function recordAIUsage(userId: string): Promise<void> {
    await recordUsage(userId, 'AI_GENERATION');
}

// ==========================================
// WEBHOOK HANDLING (Full Lifecycle)
// ==========================================

interface WebhookResult {
    success: boolean;
    event: string;
    message?: string;
}

export async function handleWebhook(
    payload: Buffer,
    signature: string
): Promise<WebhookResult> {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed', { error: err as Error });
        throw new Error('Webhook signature verification failed');
    }

    logger.info('Processing Stripe webhook', { eventType: event.type, eventId: event.id });

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.updated':
                await handleCustomerUpdated(event.data.object as Stripe.Customer);
                break;

            default:
                logger.debug('Unhandled webhook event', { eventType: event.type });
        }

        return { success: true, event: event.type };
    } catch (error) {
        logger.error('Webhook handler error', {
            error: error as Error,
            eventType: event.type,
        });
        throw error;
    }
}

// Checkout completed - subscription created
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId as PlanId;

    if (session.mode === 'payment' && session.metadata?.type === 'ai_credits') {
        if (!userId) {
            logger.warn('Credit top-up missing userId', { sessionId: session.id });
            return;
        }
        const amountSar = session.amount_total ? session.amount_total / 100 : 0;
        await recordAICreditTopup({
            userId,
            amountSar,
            source: 'stripe',
            reference: session.id,
        });
        logger.paymentEvent('credit_topup_completed', userId, amountSar, {
            sessionId: session.id,
            credits: session.metadata?.credits,
        });
        return;
    }

    if (session.mode === 'payment' && session.metadata?.type === 'gift_subscription') {
        const buyerId = session.metadata?.buyerId;
        const planValue = session.metadata?.planId;
        const giftPlanId = planValue === 'pro' || planValue === 'enterprise'
            ? planValue
            : undefined;
        const interval = session.metadata?.interval as 'monthly' | 'yearly' | undefined;
        const recipientEmailRaw = session.metadata?.recipientEmail || '';
        const message = session.metadata?.message || '';

        if (!buyerId || !giftPlanId || !interval) {
            logger.warn('Gift checkout missing metadata', { sessionId: session.id });
            return;
        }

        const existingGift = await prisma.giftSubscription.findUnique({
            where: { stripeSessionId: session.id },
        });

        if (existingGift) {
            return;
        }

        const token = crypto.randomBytes(24).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + GIFT_CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const recipientEmail = recipientEmailRaw.trim() || null;

        const gift = await prisma.giftSubscription.create({
            data: {
                token,
                createdByUserId: buyerId,
                recipientEmail,
                message: message || null,
                plan: giftPlanId.toUpperCase() as 'PRO' | 'ENTERPRISE',
                interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
                status: 'PENDING',
                stripeSessionId: session.id,
                amountSar: session.amount_total ? session.amount_total / 100 : undefined,
                expiresAt,
            },
        });

        if (recipientEmail) {
            const buyer = await prisma.user.findUnique({
                where: { id: buyerId },
                select: { name: true },
            });
            sendGiftSubscriptionEmail(recipientEmail, {
                senderName: buyer?.name || undefined,
                planId: giftPlanId,
                interval,
                message: gift.message || undefined,
                token: gift.token,
                expiresAt,
            }).catch((err) => {
                logger.error('Failed to send gift email', { error: err as Error, giftId: gift.id });
            });
        }

        logger.paymentEvent('gift_checkout_completed', buyerId, gift.amountSar ?? undefined, {
            planId: giftPlanId,
            interval,
            giftId: gift.id,
        });
        return;
    }

    if (!userId || !planId) {
        logger.warn('Checkout session missing metadata', { sessionId: session.id });
        return;
    }

    logger.paymentEvent('checkout_completed', userId, undefined, {
        sessionId: session.id,
        planId,
    });
}

// Subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const planId = (subscription.metadata?.planId || 'pro') as PlanId;

    if (!userId) {
        logger.warn('Subscription missing userId metadata', {
            subscriptionId: subscription.id,
        });
        return;
    }

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE',
            status: mapStripeStatus(subscription.status),
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price?.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        update: {
            plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE',
            status: mapStripeStatus(subscription.status),
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price?.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    logger.paymentEvent('subscription_created', userId, undefined, {
        planId,
        subscriptionId: subscription.id,
    });
}

// Subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
        // Try to find user by customer ID
        const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscription.id },
        });
        if (!sub) {
            logger.warn('Cannot find user for subscription update', {
                subscriptionId: subscription.id,
            });
            return;
        }
    }

    // Determine plan from price ID
    let planId: PlanId = 'pro';
    const priceId = subscription.items.data[0]?.price?.id;
    if (priceId) {
        if (
            priceId === process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
        ) {
            planId = 'enterprise';
        }
    }

    await prisma.subscription.updateMany({
        where: {
            OR: [
                { stripeSubscriptionId: subscription.id },
                ...(userId ? [{ userId }] : []),
            ],
        },
        data: {
            plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE',
            status: mapStripeStatus(subscription.status),
            stripePriceId: priceId,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    logger.paymentEvent('subscription_updated', userId || 'unknown', undefined, {
        planId,
        status: subscription.status,
    });
}

// Subscription deleted/canceled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const planId = (subscription.metadata?.planId || 'pro') as PlanId;
    await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            plan: planId.toUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE',
            status: 'CANCELED',
            cancelAtPeriodEnd: false,
        },
    });

    logger.paymentEvent('subscription_deleted', subscription.metadata?.userId || 'unknown');
}

// Payment succeeded
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.paymentEvent(
        'payment_succeeded',
        typeof invoice.customer === 'string' ? invoice.customer : 'unknown',
        invoice.amount_paid / 100
    );
}

// Payment failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : null;

    if (customerId) {
        // Update subscription status
        await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { status: 'PAST_DUE' },
        });

        // TODO: Send payment failed email to user
    }

    logger.paymentEvent('payment_failed', customerId || 'unknown', invoice.amount_due / 100);
}

// Customer updated
async function handleCustomerUpdated(customer: Stripe.Customer) {
    logger.info('Customer updated', { customerId: customer.id });
}

// Map Stripe subscription status to our status enum
function mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' {
    switch (stripeStatus) {
        case 'active':
            return 'ACTIVE';
        case 'past_due':
            return 'PAST_DUE';
        case 'canceled':
            return 'CANCELED';
        case 'unpaid':
            return 'UNPAID';
        case 'trialing':
            return 'TRIALING';
        default:
            return 'ACTIVE';
    }
}

// Get user's current plan
export async function getUserPlan(userId: string): Promise<PlanId> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) return 'free';

        // Check if subscription is still active
        if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
            return 'free';
        }

        // Check if period has expired
        if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
            return 'free';
        }

        return subscription.plan.toLowerCase() as PlanId;
    } catch (error) {
        logger.error('Failed to get user plan', { error: error as Error, userId });
        return 'free';
    }
}

export { stripe };
