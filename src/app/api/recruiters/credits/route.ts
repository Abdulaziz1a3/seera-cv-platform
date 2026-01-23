import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecruiterAccount } from '@/lib/recruiter-auth';
import { getRecruiterCreditBalance } from '@/lib/recruiter-credits';
import { RECRUITER_CREDIT_PACKS, RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';

export async function GET() {
    const guard = await requireRecruiterAccount({ requireActive: true });
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
    }

    const balance = await getRecruiterCreditBalance(guard.userId);
    const ledger = await prisma.recruiterCreditLedger.findMany({
        where: { recruiterId: guard.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return NextResponse.json({
        balance,
        monthlyCredits: RECRUITER_GROWTH_PLAN.monthlyCredits,
        packs: RECRUITER_CREDIT_PACKS,
        ledger,
    });
}
