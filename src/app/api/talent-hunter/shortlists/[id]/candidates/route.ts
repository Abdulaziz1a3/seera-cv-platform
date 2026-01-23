import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const addCandidateSchema = z.object({
    candidateId: z.string().min(1, 'Candidate ID is required'),
    note: z.string().max(1000).optional(),
});

const updateNoteSchema = z.object({
    candidateId: z.string().min(1),
    note: z.string().max(1000).optional(),
});

/**
 * Check if user has talent hunter access
 */
async function hasTalentHunterAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role === 'SUPER_ADMIN';
}

/**
 * POST /api/talent-hunter/shortlists/[id]/candidates
 * Add a candidate to a shortlist
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        const { id: shortlistId } = await params;
        const body = await request.json();
        const parseResult = addCandidateSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { candidateId, note } = parseResult.data;

        // Verify shortlist ownership
        const shortlist = await prisma.recruiterShortlist.findFirst({
            where: { id: shortlistId, recruiterId: session.user.id },
        });

        if (!shortlist) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        // Verify candidate exists and is visible
        const candidate = await prisma.talentProfile.findFirst({
            where: { id: candidateId, isVisible: true },
        });

        if (!candidate) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        // Check if already in shortlist
        const existing = await prisma.recruiterShortlistCandidate.findUnique({
            where: {
                shortlistId_talentProfileId: {
                    shortlistId,
                    talentProfileId: candidateId,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Candidate is already in this shortlist' },
                { status: 400 }
            );
        }

        // Add to shortlist
        const entry = await prisma.recruiterShortlistCandidate.create({
            data: {
                shortlistId,
                talentProfileId: candidateId,
                note,
            },
            include: {
                talentProfile: {
                    select: {
                        id: true,
                        displayName: true,
                        currentTitle: true,
                        location: true,
                        skills: true,
                    },
                },
            },
        });

        // Update shortlist timestamp
        await prisma.recruiterShortlist.update({
            where: { id: shortlistId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ entry }, { status: 201 });
    } catch (error) {
        console.error('Add to shortlist error:', error);
        return NextResponse.json(
            { error: 'Failed to add candidate to shortlist' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/talent-hunter/shortlists/[id]/candidates
 * Update a candidate's note in the shortlist
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        const { id: shortlistId } = await params;
        const body = await request.json();
        const parseResult = updateNoteSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { candidateId, note } = parseResult.data;

        // Verify shortlist ownership
        const shortlist = await prisma.recruiterShortlist.findFirst({
            where: { id: shortlistId, recruiterId: session.user.id },
        });

        if (!shortlist) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        // Update the note
        const entry = await prisma.recruiterShortlistCandidate.update({
            where: {
                shortlistId_talentProfileId: {
                    shortlistId,
                    talentProfileId: candidateId,
                },
            },
            data: { note },
        });

        return NextResponse.json({ entry });
    } catch (error) {
        console.error('Update shortlist note error:', error);
        return NextResponse.json(
            { error: 'Failed to update note' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/talent-hunter/shortlists/[id]/candidates
 * Remove a candidate from a shortlist
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        const { id: shortlistId } = await params;
        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get('candidateId');

        if (!candidateId) {
            return NextResponse.json(
                { error: 'Candidate ID is required' },
                { status: 400 }
            );
        }

        // Verify shortlist ownership
        const shortlist = await prisma.recruiterShortlist.findFirst({
            where: { id: shortlistId, recruiterId: session.user.id },
        });

        if (!shortlist) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        // Remove from shortlist
        await prisma.recruiterShortlistCandidate.delete({
            where: {
                shortlistId_talentProfileId: {
                    shortlistId,
                    talentProfileId: candidateId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove from shortlist error:', error);
        return NextResponse.json(
            { error: 'Failed to remove candidate from shortlist' },
            { status: 500 }
        );
    }
}
