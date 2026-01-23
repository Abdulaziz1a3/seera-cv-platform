import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateShortlistSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
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
 * GET /api/talent-hunter/shortlists/[id]
 * Get a specific shortlist with candidates
 */
export async function GET(
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

        const { id } = await params;

        const shortlist = await prisma.recruiterShortlist.findFirst({
            where: {
                id,
                recruiterId: session.user.id,
            },
            include: {
                candidates: {
                    include: {
                        talentProfile: {
                            select: {
                                id: true,
                                displayName: true,
                                currentTitle: true,
                                currentCompany: true,
                                hideCurrentEmployer: true,
                                location: true,
                                yearsExperience: true,
                                skills: true,
                                education: true,
                                summary: true,
                                availabilityStatus: true,
                                desiredSalaryMin: true,
                                desiredSalaryMax: true,
                                hideSalaryHistory: true,
                                noticePeriod: true,
                                desiredRoles: true,
                            },
                        },
                    },
                    orderBy: { addedAt: 'desc' },
                },
            },
        });

        if (!shortlist) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        // Apply privacy filters
        const sanitizedCandidates = shortlist.candidates.map((c) => ({
            ...c,
            talentProfile: {
                ...c.talentProfile,
                currentCompany: c.talentProfile.hideCurrentEmployer ? null : c.talentProfile.currentCompany,
                desiredSalaryMin: c.talentProfile.hideSalaryHistory ? null : c.talentProfile.desiredSalaryMin,
                desiredSalaryMax: c.talentProfile.hideSalaryHistory ? null : c.talentProfile.desiredSalaryMax,
            },
        }));

        return NextResponse.json({
            shortlist: {
                ...shortlist,
                candidates: sanitizedCandidates,
            },
        });
    } catch (error) {
        console.error('Shortlist GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shortlist' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/talent-hunter/shortlists/[id]
 * Update a shortlist
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

        const { id } = await params;
        const body = await request.json();
        const parseResult = updateShortlistSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.recruiterShortlist.findFirst({
            where: { id, recruiterId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        const shortlist = await prisma.recruiterShortlist.update({
            where: { id },
            data: parseResult.data,
        });

        return NextResponse.json({ shortlist });
    } catch (error) {
        console.error('Shortlist update error:', error);
        return NextResponse.json(
            { error: 'Failed to update shortlist' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/talent-hunter/shortlists/[id]
 * Delete a shortlist
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

        const { id } = await params;

        // Verify ownership
        const existing = await prisma.recruiterShortlist.findFirst({
            where: { id, recruiterId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Shortlist not found' },
                { status: 404 }
            );
        }

        await prisma.recruiterShortlist.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Shortlist delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete shortlist' },
            { status: 500 }
        );
    }
}
