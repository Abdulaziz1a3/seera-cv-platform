import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecruiterAccount } from '@/lib/recruiter-auth';

export async function GET() {
    const guard = await requireRecruiterAccount();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const subscription = await prisma.subscription.findUnique({
        where: { userId: guard.userId },
        select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
        },
    });

    return NextResponse.json({
        subscription: subscription || null,
    });
}
