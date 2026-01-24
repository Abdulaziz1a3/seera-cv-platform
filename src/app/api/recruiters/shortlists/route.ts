import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';
import { z } from 'zod';
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

    try {
        const shortlists = await prisma.recruiterShortlist.findMany({
            where: { recruiterId: guard.userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                candidates: {
                    include: {
                        talentProfile: {
                            include: {
                                user: { select: { profile: { select: { citizenship: true } } } },
                                contact: true,
                            },
                        },
                    },
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
                const { user, contact, ...profile } = candidate.talentProfile;
                return {
                    ...candidate,
                    talentProfile: {
                        ...profile,
                        displayName: isUnlocked
                            ? profile.displayName
                            : buildAnonymizedName(profile.displayName, profile.id),
                        currentCompany: profile.hideCurrentEmployer ? null : profile.currentCompany,
                        citizenship: user?.profile?.citizenship ?? null,
                        contact: isUnlocked && contact
                            ? {
                                  email: contact.email,
                                  phone: contact.phone,
                              }
                            : null,
                    },
                    unlocked: isUnlocked,
                };
            }),
        }));

        return NextResponse.json({ shortlists: sanitizedShortlists });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        if ((error as { code?: string }).code === 'P2021') {
            return NextResponse.json(
                { error: 'Database schema is missing required tables. Please run migrations.' },
                { status: 500 }
            );
        }
        return NextResponse.json({ error: 'Failed to load shortlists' }, { status: 500 });
    }
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
        if ((error as { code?: string }).code === 'P2021') {
            return NextResponse.json(
                { error: 'Database schema is missing required tables. Please run migrations.' },
                { status: 500 }
            );
        }
        return NextResponse.json({ error: 'Failed to create shortlist' }, { status: 500 });
    }
}
