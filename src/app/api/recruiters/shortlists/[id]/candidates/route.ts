import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { z } from 'zod';

const addSchema = z.object({
    talentProfileId: z.string().min(1),
    note: z.string().max(240).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parseResult = addSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const data = parseResult.data;

    const shortlist = await prisma.recruiterShortlist.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
    });
    if (!shortlist) {
        return NextResponse.json({ error: 'Shortlist not found' }, { status: 404 });
    }

    const unlock = await prisma.cvUnlock.findUnique({
        where: {
            recruiterId_candidateId: {
                recruiterId: guard.userId,
                candidateId: data.talentProfileId,
            },
        },
    });
    if (!unlock) {
        return NextResponse.json({ error: 'Unlock required' }, { status: 403 });
    }

    try {
        const entry = await prisma.recruiterShortlistCandidate.create({
            data: {
                shortlistId: shortlist.id,
                talentProfileId: data.talentProfileId,
                note: data.note,
            },
        });

        return NextResponse.json({ entry }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json({ error: 'Candidate already in shortlist' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const talentProfileId = searchParams.get('talentProfileId');
    if (!talentProfileId) {
        return NextResponse.json({ error: 'talentProfileId is required' }, { status: 400 });
    }

    const shortlist = await prisma.recruiterShortlist.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
    });
    if (!shortlist) {
        return NextResponse.json({ error: 'Shortlist not found' }, { status: 404 });
    }

    await prisma.recruiterShortlistCandidate.deleteMany({
        where: { shortlistId: shortlist.id, talentProfileId },
    });

    return NextResponse.json({ success: true });
}
