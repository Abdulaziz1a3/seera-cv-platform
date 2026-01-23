import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';
import { normalizeFieldOfStudy } from '@/lib/education-utils';

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
    degreeLevels: z.array(z.enum(['DIPLOMA', 'BACHELOR', 'MASTER', 'PHD'])).optional(),
    fieldsOfStudy: z.array(z.string()).optional(),
    graduationYearMin: z.number().int().min(1900).optional(),
    graduationYearMax: z.number().int().min(1900).optional(),
    experienceBands: z.array(z.enum(['STUDENT_FRESH', 'JUNIOR', 'MID', 'SENIOR'])).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(20),
    sortBy: z.enum(['relevance', 'experience', 'recent']).default('relevance'),
});

function computeFitScore(skills: string[], queryTokens: string[]): number {
    if (queryTokens.length === 0) return 70;
    const lowerSkills = skills.map((s) => s.toLowerCase());
    const hits = queryTokens.filter((t) =>
        lowerSkills.some((s) => s.includes(t))
    ).length;
    const ratio = hits / queryTokens.length;
    return Math.max(60, Math.min(98, Math.round(60 + ratio * 38)));
}

function buildCaseVariants(values: string[]) {
    const variants = new Set<string>();
    values
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => {
            variants.add(value);
            variants.add(value.toLowerCase());
            variants.add(value.toUpperCase());
            const title = value
                .toLowerCase()
                .split(/\s+/)
                .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
                .join(' ');
            variants.add(title);
        });
    return Array.from(variants);
}

function withinLast12Months(date?: Date | string | null) {
    if (!date) return false;
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return false;
    return Date.now() - value.getTime() <= 1000 * 60 * 60 * 24 * 365;
}

export async function POST(request: NextRequest) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

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
    const queryTokens = (filters.query || '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    const whereConditions: Prisma.TalentProfileWhereInput[] = [
        { isVisible: true },
    ];

    if (filters.query && filters.query.trim()) {
        const searchTerm = filters.query.trim();
        const searchVariants = buildCaseVariants([searchTerm]);
        whereConditions.push({
            OR: [
                { displayName: { contains: searchTerm, mode: 'insensitive' } },
                { currentTitle: { contains: searchTerm, mode: 'insensitive' } },
                { currentCompany: { contains: searchTerm, mode: 'insensitive' } },
                { summary: { contains: searchTerm, mode: 'insensitive' } },
                { skills: { hasSome: searchVariants } },
                { desiredRoles: { hasSome: searchVariants } },
            ],
        });
    }

    if (filters.skills && filters.skills.length > 0) {
        const skillVariants = buildCaseVariants(filters.skills);
        whereConditions.push({
            skills: { hasSome: skillVariants },
        });
    }

    if (filters.locations && filters.locations.length > 0) {
        const locationVariants = buildCaseVariants(filters.locations);
        whereConditions.push({
            OR: [
                { location: { in: locationVariants } },
                { preferredLocations: { hasSome: locationVariants } },
            ],
        });
    }

    if (filters.availabilityStatus && filters.availabilityStatus.length > 0) {
        whereConditions.push({
            availabilityStatus: { in: filters.availabilityStatus },
        });
    }

    if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
        const expCondition: Prisma.TalentProfileWhereInput = {};
        if (filters.minExperience !== undefined) {
            expCondition.yearsExperience = { gte: filters.minExperience };
        }
        if (filters.maxExperience !== undefined) {
            expCondition.yearsExperience = {
                ...(expCondition.yearsExperience as object),
                lte: filters.maxExperience,
            };
        }
        whereConditions.push(expCondition);
    }

    if (filters.minSalary !== undefined || filters.maxSalary !== undefined) {
        const salaryConditions: Prisma.TalentProfileWhereInput[] = [];

        if (filters.maxSalary !== undefined) {
            salaryConditions.push({
                OR: [
                    { desiredSalaryMin: { lte: filters.maxSalary } },
                    { desiredSalaryMin: null },
                ],
            });
        }

        if (filters.minSalary !== undefined) {
            salaryConditions.push({
                OR: [
                    { desiredSalaryMax: { gte: filters.minSalary } },
                    { desiredSalaryMax: null },
                ],
            });
        }

        whereConditions.push(...salaryConditions);
    }

    if (filters.noticePeriod && filters.noticePeriod.length > 0) {
        const noticeVariants = buildCaseVariants(filters.noticePeriod);
        whereConditions.push({
            noticePeriod: { in: noticeVariants },
        });
    }

    if (filters.degreeLevels && filters.degreeLevels.length > 0) {
        whereConditions.push({
            highestDegreeLevel: { in: filters.degreeLevels },
        });
    }

    if (filters.experienceBands && filters.experienceBands.length > 0) {
        whereConditions.push({
            experienceBand: { in: filters.experienceBands },
        });
    }

    if (filters.graduationYearMin !== undefined || filters.graduationYearMax !== undefined) {
        const gradCondition: Prisma.TalentProfileWhereInput = {};
        if (filters.graduationYearMin !== undefined) {
            gradCondition.graduationYear = { gte: filters.graduationYearMin };
        }
        if (filters.graduationYearMax !== undefined) {
            gradCondition.graduationYear = {
                ...(gradCondition.graduationYear as object),
                lte: filters.graduationYearMax,
            };
        }
        whereConditions.push(gradCondition);
    }

    if (filters.fieldsOfStudy && filters.fieldsOfStudy.length > 0) {
        const normalizedFields = filters.fieldsOfStudy
            .map((field) => normalizeFieldOfStudy(field))
            .filter((field): field is string => Boolean(field));
        if (normalizedFields.length > 0) {
            whereConditions.push({
                OR: normalizedFields.map((field) => ({
                    normalizedFieldOfStudy: { contains: field },
                })),
            });
        }
    }

    let orderBy: Prisma.TalentProfileOrderByWithRelationInput = { updatedAt: 'desc' };
    if (filters.sortBy === 'experience') {
        orderBy = { yearsExperience: 'desc' };
    } else if (filters.sortBy === 'recent') {
        orderBy = { createdAt: 'desc' };
    }

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
                highestDegreeLevel: true,
                primaryFieldOfStudy: true,
                normalizedFieldOfStudy: true,
                graduationYear: true,
                graduationDate: true,
                experienceBand: true,
                internshipCount: true,
                projectCount: true,
                freelanceCount: true,
                trainingFlag: true,
            },
        }),
        prisma.talentProfile.count({
            where: { AND: whereConditions },
        }),
    ]);

    const unlocks = await prisma.cvUnlock.findMany({
        where: { recruiterId: guard.userId, candidateId: { in: candidates.map((c) => c.id) } },
        select: { candidateId: true },
    });
    const unlockedSet = new Set(unlocks.map((unlock) => unlock.candidateId));

    const sanitizedCandidates = candidates.map((candidate) => {
        const isUnlocked = unlockedSet.has(candidate.id);
        return {
            ...candidate,
            displayName: isUnlocked
                ? candidate.displayName
                : buildAnonymizedName(candidate.displayName, candidate.id),
            currentCompany: candidate.hideCurrentEmployer ? null : candidate.currentCompany,
            desiredSalaryMin: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            desiredSalaryMax: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
            matchScore: computeFitScore(candidate.skills, queryTokens),
            unlocked: isUnlocked,
            highestDegreeLevel: candidate.highestDegreeLevel,
            primaryFieldOfStudy: candidate.primaryFieldOfStudy,
            normalizedFieldOfStudy: candidate.normalizedFieldOfStudy,
            graduationYear: candidate.graduationYear,
            graduationDate: candidate.graduationDate,
            graduatedWithin12Months: withinLast12Months(candidate.graduationDate),
            experienceBand: candidate.experienceBand,
            internshipCount: candidate.internshipCount,
            projectCount: candidate.projectCount,
            freelanceCount: candidate.freelanceCount,
            trainingFlag: candidate.trainingFlag,
        };
    });

    return NextResponse.json({
        candidates: sanitizedCandidates,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / filters.limit),
        },
    });
}
