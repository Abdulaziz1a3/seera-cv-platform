import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const job = await prisma.recruiterJob.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
        select: { id: true },
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const recommendations = await prisma.recruiterJobRecommendation.findMany({
        where: { jobId: job.id },
        orderBy: { rank: 'asc' },
        include: {
            candidate: {
                select: {
                    id: true,
                    displayName: true,
                    currentTitle: true,
                    currentCompany: true,
                    hideCurrentEmployer: true,
                    location: true,
                    yearsExperience: true,
                    skills: true,
                    summary: true,
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
            },
        },
    });

    const candidateIds = recommendations.map((rec) => rec.candidateId);
    const unlocks = await prisma.cvUnlock.findMany({
        where: { recruiterId: guard.userId, candidateId: { in: candidateIds } },
        select: { candidateId: true },
    });
    const unlockedSet = new Set(unlocks.map((unlock) => unlock.candidateId));

    const results = recommendations.map((rec) => {
        const candidate = rec.candidate;
        const isUnlocked = unlockedSet.has(candidate.id);
        return {
            id: rec.id,
            rank: rec.rank,
            matchScore: rec.matchScore,
            reasons: rec.reasons,
            gaps: rec.gaps,
            isPriority: rec.isPriority,
            unlocked: isUnlocked,
            candidate: {
                id: candidate.id,
                displayName: isUnlocked
                    ? candidate.displayName
                    : buildAnonymizedName(candidate.displayName, candidate.id),
                currentTitle: candidate.currentTitle,
                currentCompany: candidate.hideCurrentEmployer ? null : candidate.currentCompany,
                location: candidate.location,
                yearsExperience: candidate.yearsExperience,
                skills: candidate.skills,
                summary: candidate.summary,
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
            },
        };
    });

    return NextResponse.json({ recommendations: results });
}
