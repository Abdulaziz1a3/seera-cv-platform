import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createGiftCheckoutSession } from '@/lib/stripe';
import { logger } from '@/lib/logger';

const checkoutSchema = z.object({
    plan: z.enum(['pro', 'enterprise']),
    interval: z.enum(['monthly', 'yearly']),
    recipientEmail: z.string().email().optional().or(z.literal('')),
    message: z.string().max(300).optional().or(z.literal('')),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan, interval, recipientEmail, message } = checkoutSchema.parse(body);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const checkoutUrl = await createGiftCheckoutSession({
            buyerId: session.user.id,
            planId: plan,
            interval,
            recipientEmail: recipientEmail?.trim() || undefined,
            message: message?.trim() || undefined,
            returnUrl: `${baseUrl}/dashboard/settings?tab=billing`,
        });

        logger.info('Gift checkout session created', {
            userId: session.user.id,
            plan,
            interval,
            recipientEmail,
        });

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        logger.error('Gift checkout error', { error: error as Error });
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create gift checkout session' },
            { status: 500 }
        );
    }
}
