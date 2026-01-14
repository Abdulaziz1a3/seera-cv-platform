// Billing Checkout API
// Creates Stripe checkout sessions for subscription upgrades

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createCheckoutSession, PLANS } from '@/lib/stripe';
import { logger } from '@/lib/logger';

const checkoutSchema = z.object({
    plan: z.enum(['pro', 'enterprise']),
    interval: z.enum(['monthly', 'yearly']),
});

// POST /api/billing/checkout - Create checkout session
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan, interval } = checkoutSchema.parse(body);

        // Validate plan exists
        const planConfig = PLANS[plan];
        if (!planConfig) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

        const checkoutUrl = await createCheckoutSession(
            session.user.id,
            plan,
            interval,
            `${baseUrl}/dashboard/settings?tab=billing`
        );

        logger.info('Checkout session created', {
            userId: session.user.id,
            plan,
            interval,
        });

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        logger.error('Checkout error', { error: error as Error });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
