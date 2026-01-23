import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { unlockCandidateCV } from '@/lib/recruiter-credits';

const requestSchema = z.object({
    candidateId: z.string().min(1),
});

export async function POST(request: Request) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
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
            contact: candidate.contact
                ? {
                    fullName: candidate.contact.fullName,
                    email: candidate.contact.email,
                    phone: candidate.contact.phone,
                    location: candidate.contact.location,
                    linkedin: candidate.contact.linkedinUrl,
                    website: candidate.contact.websiteUrl,
                }
                : null,
            resume: resumeSnapshot
                ? {
                    summary: resumeSnapshot.summary?.content,
                    experience: resumeSnapshot.experience?.items?.map((exp: any) => ({
                        company: candidate.hideCurrentEmployer && exp === resumeSnapshot.experience?.items[0]
                            ? 'Confidential'
                            : exp.company,
                        position: exp.position,
                        location: exp.location,
                        startDate: exp.startDate,
                        endDate: exp.endDate,
                        description: exp.description,
                        highlights: exp.highlights,
                    })),
                    education: resumeSnapshot.education?.items?.map((edu: any) => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.field,
                        graduationDate: edu.graduationDate,
                        gpa: edu.gpa,
                    })),
                    skills: resumeSnapshot.skills?.simpleList || [],
                    certifications: resumeSnapshot.certifications?.items,
                    projects: resumeSnapshot.projects?.items,
                    languages: resumeSnapshot.languages?.items,
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
