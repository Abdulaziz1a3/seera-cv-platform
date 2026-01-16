import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';

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
    };

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

    const results = candidates.map((candidate) => ({
        id: candidate.id,
        displayName: candidate.displayName,
        currentTitle: candidate.currentTitle,
        currentCompany: candidate.hideCurrentEmployer ? 'Hidden' : candidate.currentCompany,
        location: candidate.location,
        yearsExperience: candidate.yearsExperience,
        skills: candidate.skills,
        education: candidate.education,
        summary: candidate.summary,
        availabilityStatus: candidate.availabilityStatus,
        desiredSalary: {
            min: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            max: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
        },
        matchScore: computeFitScore(candidate.skills, queryTokens),
        isUnlocked: false,
    }));

    return NextResponse.json({ results });
}
