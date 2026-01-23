import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';
import { normalizeFieldOfStudy } from '@/lib/education-utils';

function parseList(value: string | null): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}

function computeFitScore(skills: string[], queryTokens: string[]): number {
    if (queryTokens.length === 0) return 70;
    const lowerSkills = skills.map((s) => s.toLowerCase());
    const hits = queryTokens.filter((t) =>
        lowerSkills.some((s) => s.includes(t))
    ).length;
    const ratio = hits / queryTokens.length;
    return Math.max(60, Math.min(98, Math.round(60 + ratio * 38)));
}

export async function GET(request: NextRequest) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('query') || '').trim();
    const location = searchParams.get('location') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const availability = searchParams.get('availability') || undefined;
    const minExp = searchParams.get('minExp');
    const maxExp = searchParams.get('maxExp');
    const minSalary = searchParams.get('minSalary');
    const maxSalary = searchParams.get('maxSalary');
    const skills = parseList(searchParams.get('skills'));
    const degreeLevels = parseList(searchParams.get('degreeLevels'));
    const fieldsOfStudy = parseList(searchParams.get('fieldsOfStudy'));
    const experienceBands = parseList(searchParams.get('experienceBands'));
    const graduationYearMin = searchParams.get('graduationYearMin');
    const graduationYearMax = searchParams.get('graduationYearMax');

    const queryTokens = query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    const where: any = {
        isVisible: true,
        ...(location ? { location } : {}),
        ...(availability ? { availabilityStatus: availability } : {}),
        ...(minExp ? { yearsExperience: { gte: Number(minExp) } } : {}),
        ...(maxExp ? { yearsExperience: { lte: Number(maxExp) } } : {}),
        ...(minSalary ? { desiredSalaryMin: { gte: Number(minSalary) } } : {}),
        ...(maxSalary ? { desiredSalaryMax: { lte: Number(maxSalary) } } : {}),
        ...(industry ? { preferredIndustries: { has: industry } } : {}),
        ...(skills.length ? { skills: { hasSome: skills } } : {}),
        ...(degreeLevels.length ? { highestDegreeLevel: { in: degreeLevels } } : {}),
        ...(experienceBands.length ? { experienceBand: { in: experienceBands } } : {}),
        ...(graduationYearMin ? { graduationYear: { gte: Number(graduationYearMin) } } : {}),
        ...(graduationYearMax ? { graduationYear: { lte: Number(graduationYearMax) } } : {}),
    };

    if (fieldsOfStudy.length) {
        const normalized = fieldsOfStudy
            .map((field) => normalizeFieldOfStudy(field))
            .filter((field): field is string => Boolean(field));
        if (normalized.length) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: normalized.map((field) => ({
                        normalizedFieldOfStudy: { contains: field },
                    })),
                },
            ];
        }
    }

    if (queryTokens.length) {
        where.OR = [
            { displayName: { contains: query, mode: 'insensitive' } },
            { currentTitle: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
            { skills: { hasSome: queryTokens } },
        ];
    }

    const candidates = await prisma.talentProfile.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        take: 50,
    });

    const unlocks = await prisma.cvUnlock.findMany({
        where: {
            recruiterId: guard.userId,
            candidateId: { in: candidates.map((candidate) => candidate.id) },
        },
        select: { candidateId: true },
    });
    const unlockedSet = new Set(unlocks.map((unlock) => unlock.candidateId));

    const results = candidates.map((candidate) => {
        const isUnlocked = unlockedSet.has(candidate.id);
        return ({
        id: candidate.id,
        displayName: isUnlocked
            ? candidate.displayName
            : buildAnonymizedName(candidate.displayName, candidate.id),
        currentTitle: candidate.currentTitle,
        currentCompany: candidate.hideCurrentEmployer ? 'Hidden' : candidate.currentCompany,
        location: candidate.location,
        yearsExperience: candidate.yearsExperience,
        skills: candidate.skills,
        education: candidate.education,
        highestDegreeLevel: candidate.highestDegreeLevel,
        primaryFieldOfStudy: candidate.primaryFieldOfStudy,
        normalizedFieldOfStudy: candidate.normalizedFieldOfStudy,
        graduationYear: candidate.graduationYear,
        graduationDate: candidate.graduationDate,
        experienceBand: candidate.experienceBand,
        internshipCount: candidate.internshipCount,
        projectCount: candidate.projectCount,
        freelanceCount: candidate.freelanceCount,
        trainingFlag: candidate.trainingFlag,
        summary: candidate.summary,
        availabilityStatus: candidate.availabilityStatus,
        desiredSalary: {
            min: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            max: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
        },
        matchScore: computeFitScore(candidate.skills, queryTokens),
        isUnlocked,
    });
    });

    return NextResponse.json({ results });
}
