import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Search filters validation schema
const searchSchema = z.object({
    query: z.string().optional(),
    skills: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    availabilityStatus: z.array(z.enum(['actively_looking', 'open_to_offers', 'not_looking'])).optional(),
    minExperience: z.number().int().min(0).optional(),
    maxExperience: z.number().int().min(0).optional(),
    minSalary: z.number().int().min(0).optional(),
    maxSalary: z.number().int().min(0).optional(),
    noticePeriod: z.array(z.string()).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(20),
    sortBy: z.enum(['relevance', 'experience', 'recent']).default('relevance'),
});

/**
 * Check if user has talent hunter access (super admin for now)
 */
async function hasTalentHunterAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true },
    });

    // Only super admin has access for now
    return user?.role === 'SUPER_ADMIN';
}

/**
 * POST /api/talent-hunter/search
 * Search for candidates in the talent pool
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check access
        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const parseResult = searchSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Invalid search parameters', details: parseResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const filters = parseResult.data;
        const skip = (filters.page - 1) * filters.limit;

        // Build where clause
        const whereConditions: Prisma.TalentProfileWhereInput[] = [
            { isVisible: true },
        ];

        // Text search across multiple fields
        if (filters.query && filters.query.trim()) {
            const searchTerm = filters.query.trim();
            whereConditions.push({
                OR: [
                    { displayName: { contains: searchTerm, mode: 'insensitive' } },
                    { currentTitle: { contains: searchTerm, mode: 'insensitive' } },
                    { currentCompany: { contains: searchTerm, mode: 'insensitive' } },
                    { summary: { contains: searchTerm, mode: 'insensitive' } },
                    { skills: { hasSome: [searchTerm] } },
                    { desiredRoles: { hasSome: [searchTerm] } },
                ],
            });
        }

        // Skills filter
        if (filters.skills && filters.skills.length > 0) {
            whereConditions.push({
                skills: { hasSome: filters.skills },
            });
        }

        // Location filter
        if (filters.locations && filters.locations.length > 0) {
            whereConditions.push({
                OR: [
                    { location: { in: filters.locations } },
                    { preferredLocations: { hasSome: filters.locations } },
                ],
            });
        }

        // Availability status filter
        if (filters.availabilityStatus && filters.availabilityStatus.length > 0) {
            whereConditions.push({
                availabilityStatus: { in: filters.availabilityStatus },
            });
        }

        // Experience range filter
        if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
            const expCondition: Prisma.TalentProfileWhereInput = {};
            if (filters.minExperience !== undefined) {
                expCondition.yearsExperience = { gte: filters.minExperience };
            }
            if (filters.maxExperience !== undefined) {
                expCondition.yearsExperience = {
                    ...expCondition.yearsExperience as object,
                    lte: filters.maxExperience,
                };
            }
            whereConditions.push(expCondition);
        }

        // Salary range filter (candidates who fall within recruiter's budget)
        if (filters.minSalary !== undefined || filters.maxSalary !== undefined) {
            const salaryConditions: Prisma.TalentProfileWhereInput[] = [];

            if (filters.maxSalary !== undefined) {
                // Candidate's minimum expectation should be <= recruiter's max budget
                salaryConditions.push({
                    OR: [
                        { desiredSalaryMin: { lte: filters.maxSalary } },
                        { desiredSalaryMin: null },
                    ],
                });
            }

            if (filters.minSalary !== undefined) {
                // Candidate's maximum expectation should be >= recruiter's min budget
                salaryConditions.push({
                    OR: [
                        { desiredSalaryMax: { gte: filters.minSalary } },
                        { desiredSalaryMax: null },
                    ],
                });
            }

            whereConditions.push(...salaryConditions);
        }

        // Notice period filter
        if (filters.noticePeriod && filters.noticePeriod.length > 0) {
            whereConditions.push({
                noticePeriod: { in: filters.noticePeriod },
            });
        }

        // Determine sort order
        let orderBy: Prisma.TalentProfileOrderByWithRelationInput = { updatedAt: 'desc' };
        if (filters.sortBy === 'experience') {
            orderBy = { yearsExperience: 'desc' };
        } else if (filters.sortBy === 'recent') {
            orderBy = { createdAt: 'desc' };
        }

        // Execute search query
        const [candidates, totalCount] = await Promise.all([
            prisma.talentProfile.findMany({
                where: { AND: whereConditions },
                orderBy,
                skip,
                take: filters.limit,
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
                    preferredLocations: true,
                    desiredRoles: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.talentProfile.count({
                where: { AND: whereConditions },
            }),
        ]);

        // Apply privacy filters to the response
        const sanitizedCandidates = candidates.map((candidate) => ({
            ...candidate,
            currentCompany: candidate.hideCurrentEmployer ? null : candidate.currentCompany,
            desiredSalaryMin: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            desiredSalaryMax: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
        }));

        return NextResponse.json({
            candidates: sanitizedCandidates,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / filters.limit),
            },
        });
    } catch (error) {
        console.error('Talent hunter search error:', error);
        return NextResponse.json(
            { error: 'Search failed. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/talent-hunter/search
 * Get search suggestions and stats
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check access
        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        // Get aggregate stats
        const [totalCandidates, activelyLooking, openToOffers] = await Promise.all([
            prisma.talentProfile.count({ where: { isVisible: true } }),
            prisma.talentProfile.count({ where: { isVisible: true, availabilityStatus: 'actively_looking' } }),
            prisma.talentProfile.count({ where: { isVisible: true, availabilityStatus: 'open_to_offers' } }),
        ]);

        // Get top skills
        const allProfiles = await prisma.talentProfile.findMany({
            where: { isVisible: true },
            select: { skills: true },
        });

        const skillCounts: Record<string, number> = {};
        allProfiles.forEach((profile) => {
            profile.skills.forEach((skill) => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        const topSkills = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([skill, count]) => ({ skill, count }));

        // Get location distribution
        const locationCounts: Record<string, number> = {};
        const locProfiles = await prisma.talentProfile.findMany({
            where: { isVisible: true },
            select: { location: true },
        });

        locProfiles.forEach((profile) => {
            if (profile.location) {
                locationCounts[profile.location] = (locationCounts[profile.location] || 0) + 1;
            }
        });

        const topLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([location, count]) => ({ location, count }));

        return NextResponse.json({
            stats: {
                totalCandidates,
                activelyLooking,
                openToOffers,
            },
            topSkills,
            topLocations,
        });
    } catch (error) {
        console.error('Talent hunter stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
