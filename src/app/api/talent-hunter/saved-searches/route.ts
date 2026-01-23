import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const savedSearchSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    filters: z.object({
        query: z.string().optional(),
        skills: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
        availabilityStatus: z.array(z.string()).optional(),
        minExperience: z.number().optional(),
        maxExperience: z.number().optional(),
        minSalary: z.number().optional(),
        maxSalary: z.number().optional(),
        noticePeriod: z.array(z.string()).optional(),
    }),
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
 * GET /api/talent-hunter/saved-searches
 * Get all saved searches for the current recruiter
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

        const savedSearches = await prisma.recruiterSavedSearch.findMany({
            where: { recruiterId: session.user.id },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ savedSearches });
    } catch (error) {
        console.error('Saved searches GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch saved searches' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/talent-hunter/saved-searches
 * Create a new saved search
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
        const parseResult = savedSearchSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, filters } = parseResult.data;

        // Limit saved searches per user
        const existingCount = await prisma.recruiterSavedSearch.count({
            where: { recruiterId: session.user.id },
        });

        if (existingCount >= 20) {
            return NextResponse.json(
                { error: 'Maximum of 20 saved searches allowed' },
                { status: 400 }
            );
        }

        const savedSearch = await prisma.recruiterSavedSearch.create({
            data: {
                recruiterId: session.user.id,
                name,
                filters,
            },
        });

        return NextResponse.json({ savedSearch }, { status: 201 });
    } catch (error) {
        console.error('Saved search create error:', error);
        return NextResponse.json(
            { error: 'Failed to save search' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/talent-hunter/saved-searches
 * Delete a saved search
 */
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Search ID is required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.recruiterSavedSearch.findFirst({
            where: { id, recruiterId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Saved search not found' },
                { status: 404 }
            );
        }

        await prisma.recruiterSavedSearch.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Saved search delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete saved search' },
            { status: 500 }
        );
    }
}
