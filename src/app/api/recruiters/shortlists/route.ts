import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { z } from 'zod';

const createSchema = z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(240).optional(),
});

export async function GET() {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const shortlists = await prisma.recruiterShortlist.findMany({
        where: { recruiterId: guard.userId },
        orderBy: { updatedAt: 'desc' },
        include: {
            candidates: {
                include: { talentProfile: true },
                orderBy: { addedAt: 'desc' },
            },
        },
    });

    return NextResponse.json({ shortlists });
}

export async function POST(request: NextRequest) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const shortlist = await prisma.recruiterShortlist.create({
        data: {
            recruiterId: guard.userId,
            name: data.name,
            description: data.description,
        },
    });

    return NextResponse.json({ shortlist }, { status: 201 });
}
