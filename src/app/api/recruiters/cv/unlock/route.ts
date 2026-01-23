import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { unlockCandidateCV } from '@/lib/recruiter-credits';
import {
    buildResumeSnapshotFromSections,
    hasResumeContent,
    normalizeResumeSnapshot,
} from '@/lib/resume-snapshot';

const requestSchema = z.object({
    candidateId: z.string().min(1),
});

export async function POST(request: Request) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { candidateId } = requestSchema.parse(body);

        const candidate = await prisma.talentProfile.findUnique({
            where: { id: candidateId },
            include: {
            resume: {
                include: {
                    versions: {
                        orderBy: { version: 'desc' },
                        take: 1,
                        select: { snapshot: true },
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        select: { type: true, content: true },
                    },
                },
            },
            contact: true,
        },
    });

        if (!candidate || !candidate.isVisible) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }

        let unlockResult;
        try {
            unlockResult = await unlockCandidateCV({
                recruiterId: guard.userId,
                candidateId,
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
                return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
            throw error;
        }

        if (!unlockResult.alreadyUnlocked) {
            await prisma.auditLog.create({
                data: {
                    userId: guard.userId,
                    action: 'cv_unlocked',
                    entity: 'TalentProfile',
                    entityId: candidate.id,
                    details: {
                        unlockId: unlockResult.unlockId,
                    },
                },
            });
        }

        const resumeSnapshot = candidate.resume?.versions[0]?.snapshot as any;
        const fallbackSnapshot = buildResumeSnapshotFromSections(candidate.resume || undefined);
        const initialSnapshot =
            resumeSnapshot && Object.keys(resumeSnapshot).length > 0
                ? resumeSnapshot
                : fallbackSnapshot;
        let normalizedResume = normalizeResumeSnapshot(initialSnapshot, candidate.resume?.title);

        if (!hasResumeContent(normalizedResume) && fallbackSnapshot) {
            const fallbackNormalized = normalizeResumeSnapshot(fallbackSnapshot, candidate.resume?.title);
            if (hasResumeContent(fallbackNormalized)) {
                normalizedResume = fallbackNormalized;
            }
        }

        if (!hasResumeContent(normalizedResume)) {
            const latestResume = await prisma.resume.findFirst({
                where: { userId: candidate.userId, deletedAt: null },
                orderBy: { updatedAt: 'desc' },
                include: {
                    versions: {
                        orderBy: { version: 'desc' },
                        take: 1,
                        select: { snapshot: true },
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        select: { type: true, content: true },
                    },
                },
            });
            if (latestResume) {
                const latestSnapshot = latestResume.versions[0]?.snapshot as any;
                const latestFallback = buildResumeSnapshotFromSections(latestResume || undefined);
                const latestNormalized = normalizeResumeSnapshot(latestSnapshot, latestResume.title);
                const latestFallbackNormalized = latestFallback
                    ? normalizeResumeSnapshot(latestFallback, latestResume.title)
                    : null;
                if (hasResumeContent(latestNormalized)) {
                    normalizedResume = latestNormalized;
                } else if (hasResumeContent(latestFallbackNormalized)) {
                    normalizedResume = latestFallbackNormalized;
                }
            }
        }
        const resumeSkills = normalizedResume?.skills?.simpleList?.length
            ? normalizedResume.skills.simpleList
            : normalizedResume?.skills?.categories?.flatMap((category) => category.skills || []) || [];

        const resumeContact = normalizedResume?.contact;
        const mergedContact = candidate.contact || resumeContact
            ? {
                fullName: candidate.contact?.fullName || resumeContact?.fullName || null,
                email: candidate.contact?.email || resumeContact?.email || null,
                phone: candidate.contact?.phone || resumeContact?.phone || null,
                location: candidate.contact?.location || resumeContact?.location || null,
                linkedin: candidate.contact?.linkedinUrl || resumeContact?.linkedin || null,
                website: candidate.contact?.websiteUrl || resumeContact?.website || null,
            }
            : null;
        const contactPayload = mergedContact && Object.values(mergedContact).some((value) => Boolean(value))
            ? mergedContact
            : null;

        const response = {
            id: candidate.id,
            displayName: candidate.displayName,
            currentTitle: candidate.currentTitle,
            currentCompany: candidate.hideCurrentEmployer ? null : candidate.currentCompany,
            location: candidate.location,
            yearsExperience: candidate.yearsExperience,
            skills: candidate.skills,
            education: candidate.education,
            summary: candidate.summary,
            availabilityStatus: candidate.availabilityStatus,
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
            desiredSalaryMin: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            desiredSalaryMax: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
            noticePeriod: candidate.noticePeriod,
            preferredLocations: candidate.preferredLocations,
            preferredIndustries: candidate.preferredIndustries,
            desiredRoles: candidate.desiredRoles,
            contact: contactPayload,
            resume: hasResumeContent(normalizedResume)
                ? {
                    summary: normalizedResume?.summary?.content,
                    experience: normalizedResume?.experience?.items?.map((exp: any, index: number) => ({
                        company: candidate.hideCurrentEmployer && index === 0
                            ? 'Confidential'
                            : exp.company,
                        position: exp.position,
                        location: exp.location,
                        startDate: exp.startDate,
                        endDate: exp.endDate,
                        description: exp.description,
                        highlights: Array.isArray(exp.bullets)
                            ? exp.bullets.map((bullet: any) => bullet.content).filter(Boolean)
                            : [],
                    })),
                    education: normalizedResume?.education?.items?.map((edu: any) => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.field,
                        graduationDate: edu.endDate || edu.graduationDate,
                        gpa: edu.gpa,
                    })),
                    skills: resumeSkills,
                    certifications: normalizedResume?.certifications?.items,
                    projects: normalizedResume?.projects?.items,
                    languages: normalizedResume?.languages?.items?.map((lang: any) => ({
                        language: lang.language || lang.name,
                        name: lang.name || lang.language,
                        proficiency: lang.proficiency,
                    })),
                }
                : null,
        };

        return NextResponse.json({
            unlocked: true,
            alreadyUnlocked: unlockResult.alreadyUnlocked,
            balance: unlockResult.balance,
            candidate: response,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to unlock CV' }, { status: 500 });
    }
}
