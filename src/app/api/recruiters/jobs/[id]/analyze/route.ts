import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { DegreeLevel } from '@prisma/client';
import { analyzeRecruiterJob, passesEducationRequirements, scoreCandidate } from '@/lib/recruiter-matching';

function allowedDegreeLevels(required: DegreeLevel): DegreeLevel[] {
    const order: DegreeLevel[] = ['DIPLOMA', 'BACHELOR', 'MASTER', 'PHD'];
    const index = order.indexOf(required);
    if (index === -1) return [];
    return order.slice(index);
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const job = await prisma.recruiterJob.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const analysisData = await analyzeRecruiterJob({
        jdText: job.jdText,
        title: job.title,
        location: job.location,
        remoteAllowed: job.remoteAllowed,
    });

    const candidateFilters: Prisma.TalentProfileWhereInput = {
        isVisible: true,
        ...(job.location && !job.remoteAllowed
            ? {
                OR: [
                    { location: job.location },
                    { preferredLocations: { has: job.location } },
                ],
            }
            : {}),
        ...(analysisData.yearsExpMin ? { yearsExperience: { gte: analysisData.yearsExpMin } } : {}),
        ...(analysisData.yearsExpMax ? { yearsExperience: { lte: analysisData.yearsExpMax } } : {}),
    };

    const educationConditions: Prisma.TalentProfileWhereInput[] = [];
    if (analysisData.requiredDegreeLevel) {
        const allowed = allowedDegreeLevels(analysisData.requiredDegreeLevel);
        if (allowed.length > 0) {
            educationConditions.push({ highestDegreeLevel: { in: allowed } });
        }
    }
    if (analysisData.requiredFieldsOfStudy.length > 0) {
        educationConditions.push({
            OR: analysisData.requiredFieldsOfStudy.map((field) => ({
                normalizedFieldOfStudy: { contains: field },
            })),
        });
    }
    if (educationConditions.length > 0) {
        candidateFilters.AND = educationConditions;
    }

    const candidates = await prisma.talentProfile.findMany({
        where: candidateFilters,
        take: 200,
        select: {
            id: true,
            skills: true,
            summary: true,
            currentTitle: true,
            desiredRoles: true,
            yearsExperience: true,
            highestDegreeLevel: true,
            primaryFieldOfStudy: true,
            normalizedFieldOfStudy: true,
        },
    });

    const scored = candidates
        .filter((candidate) =>
            passesEducationRequirements({ candidate, analysis: analysisData })
        )
        .map((candidate) => {
            const scoring = scoreCandidate({
                candidate,
                analysis: analysisData,
                job: { location: job.location, remoteAllowed: job.remoteAllowed },
            });
            return {
                candidateId: candidate.id,
                matchScore: scoring.score,
                reasons: scoring.reasons,
                gaps: scoring.gaps,
                isPriority: scoring.isPriority,
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 50);

    const analysis = await prisma.$transaction(async (tx) => {
        const analysisRecord = await tx.recruiterJobAnalysis.create({
            data: {
                jobId: job.id,
                mustHaveSkills: analysisData.mustHaveSkills,
                niceToHaveSkills: analysisData.niceToHaveSkills,
                roleKeywords: analysisData.roleKeywords,
                yearsExpMin: analysisData.yearsExpMin,
                yearsExpMax: analysisData.yearsExpMax,
                languages: analysisData.languages,
                responsibilities: analysisData.responsibilities,
                redFlags: analysisData.redFlags,
                summary: analysisData.summary,
                requiredDegreeLevel: analysisData.requiredDegreeLevel,
                preferredDegreeLevels: analysisData.preferredDegreeLevels,
                requiredFieldsOfStudy: analysisData.requiredFieldsOfStudy,
                preferredFieldsOfStudy: analysisData.preferredFieldsOfStudy,
                weights: analysisData.weights,
                modelInfo: analysisData.modelInfo,
            },
        });

        await tx.recruiterJobRecommendation.deleteMany({
            where: { jobId: job.id },
        });

        if (scored.length > 0) {
            await tx.recruiterJobRecommendation.createMany({
                data: scored.map((entry, index) => ({
                    jobId: job.id,
                    analysisId: analysisRecord.id,
                    candidateId: entry.candidateId,
                    rank: index + 1,
                    matchScore: entry.matchScore,
                    reasons: entry.reasons,
                    gaps: entry.gaps,
                    isPriority: entry.isPriority,
                })),
            });
        }

        await tx.auditLog.create({
            data: {
                userId: guard.userId,
                action: 'recruiter_job_analysis',
                entity: 'RecruiterJob',
                entityId: job.id,
                details: {
                    analysisId: analysisRecord.id,
                    recommendations: scored.length,
                },
            },
        });

        return analysisRecord;
    });

    return NextResponse.json({
        analysis,
        recommendations: scored.length,
    });
}
