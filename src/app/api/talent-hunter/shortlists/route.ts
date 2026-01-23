import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createShortlistSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
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
 * GET /api/talent-hunter/shortlists
 * Get all shortlists for the current recruiter
 */
export async function GET() {
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

        const shortlists = await prisma.recruiterShortlist.findMany({
            where: { recruiterId: session.user.id },
            include: {
                candidates: {
                    include: {
                        talentProfile: {
                            select: {
                                id: true,
                                displayName: true,
                                currentTitle: true,
                                location: true,
                                skills: true,
                                availabilityStatus: true,
                            },
                        },
                    },
                    orderBy: { addedAt: 'desc' },
                },
                _count: {
                    select: { candidates: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ shortlists });
    } catch (error) {
        console.error('Shortlists GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shortlists' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/talent-hunter/shortlists
 * Create a new shortlist
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const parseResult = createShortlistSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, description } = parseResult.data;

        const shortlist = await prisma.recruiterShortlist.create({
            data: {
                recruiterId: session.user.id,
                name,
                description,
            },
        });

        return NextResponse.json({ shortlist }, { status: 201 });
    } catch (error) {
        console.error('Shortlist create error:', error);
        return NextResponse.json(
            { error: 'Failed to create shortlist' },
            { status: 500 }
        );
    }
}
