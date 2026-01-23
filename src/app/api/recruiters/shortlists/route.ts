import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';
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
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
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

    const candidateIds = shortlists.flatMap((shortlist) =>
        shortlist.candidates.map((candidate) => candidate.talentProfileId)
    );
    const unlocks = await prisma.cvUnlock.findMany({
        where: { recruiterId: guard.userId, candidateId: { in: candidateIds } },
        select: { candidateId: true },
    });
    const unlockedSet = new Set(unlocks.map((unlock) => unlock.candidateId));

    const sanitizedShortlists = shortlists.map((shortlist) => ({
        ...shortlist,
        candidates: shortlist.candidates.map((candidate) => {
            const isUnlocked = unlockedSet.has(candidate.talentProfileId);
            return {
                ...candidate,
                talentProfile: {
                    ...candidate.talentProfile,
                    displayName: isUnlocked
                        ? candidate.talentProfile.displayName
                        : buildAnonymizedName(candidate.talentProfile.displayName, candidate.talentProfile.id),
                    currentCompany: candidate.talentProfile.hideCurrentEmployer
                        ? null
                        : candidate.talentProfile.currentCompany,
                },
                unlocked: isUnlocked,
            };
        }),
    }));

    return NextResponse.json({ shortlists: sanitizedShortlists });
}

export async function POST(request: NextRequest) {
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

    const parseResult = createSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    try {
        const data = parseResult.data;
        const shortlist = await prisma.recruiterShortlist.create({
            data: {
                recruiterId: guard.userId,
                name: data.name,
                description: data.description,
            },
        });

        return NextResponse.json({ shortlist }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Failed to create shortlist' }, { status: 500 });
    }
}
