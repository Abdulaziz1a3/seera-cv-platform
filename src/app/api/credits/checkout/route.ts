import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createCreditTopupSession } from '@/lib/stripe';
import { MIN_RECHARGE_SAR } from '@/lib/ai-credits';

const requestSchema = z.object({
    amountSar: z.number().min(MIN_RECHARGE_SAR),
    returnUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amountSar, returnUrl } = requestSchema.parse(body);

        const origin = request.headers.get('origin') || '';
        const fallbackReturnUrl = origin ? `${origin}/dashboard/settings?tab=billing` : returnUrl;
        const checkoutUrl = await createCreditTopupSession(
            session.user.id,
            amountSar,
            returnUrl || fallbackReturnUrl || 'https://seera-ai.com/dashboard/settings?tab=billing'
        );

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start credit recharge';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
