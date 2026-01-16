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

    const body = await request.json();
    const data = addSchema.parse(body);

    const shortlist = await prisma.recruiterShortlist.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
    });
    if (!shortlist) {
        return NextResponse.json({ error: 'Shortlist not found' }, { status: 404 });
    }

    const entry = await prisma.recruiterShortlistCandidate.create({
        data: {
            shortlistId: shortlist.id,
            talentProfileId: data.talentProfileId,
            note: data.note,
        },
    });

    return NextResponse.json({ entry }, { status: 201 });
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
