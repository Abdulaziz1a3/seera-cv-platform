import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { z } from 'zod';

const createSchema = z.object({
    name: z.string().min(2).max(80),
    filters: z.record(z.any()),
});

export async function GET() {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const saved = await prisma.recruiterSavedSearch.findMany({
        where: { recruiterId: guard.userId },
        orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ saved });
}

export async function POST(request: NextRequest) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const saved = await prisma.recruiterSavedSearch.create({
        data: {
            recruiterId: guard.userId,
            name: data.name,
            filters: data.filters,
        },
    });

    return NextResponse.json({ saved }, { status: 201 });
}
