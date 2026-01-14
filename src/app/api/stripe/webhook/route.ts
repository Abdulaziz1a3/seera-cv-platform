import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handleWebhook } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    try {
        const result = await handleWebhook(Buffer.from(body), signature);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook handler failed' },
            { status: 400 }
        );
    }
}

// Stripe requires raw body for webhook verification
export const config = {
    api: {
        bodyParser: false,
    },
};
