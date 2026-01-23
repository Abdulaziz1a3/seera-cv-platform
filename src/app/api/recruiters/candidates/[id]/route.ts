import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
    }

    const candidate = await prisma.talentProfile.findUnique({
        where: { id: params.id },
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

    const unlock = await prisma.cvUnlock.findUnique({
        where: {
            recruiterId_candidateId: {
                recruiterId: guard.userId,
                candidateId: candidate.id,
            },
        },
    });

    if (!unlock) {
        return NextResponse.json({
            unlocked: false,
            candidate: {
                id: candidate.id,
                displayName: buildAnonymizedName(candidate.displayName, candidate.id),
                currentTitle: candidate.currentTitle,
                currentCompany: candidate.hideCurrentEmployer ? null : candidate.currentCompany,
                location: candidate.location,
                yearsExperience: candidate.yearsExperience,
                skills: candidate.skills,
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
            },
        });
    }

    const resumeSnapshot = candidate.resume?.versions[0]?.snapshot as any;
    const cvProfile = await prisma.seeraProfile.findFirst({
        where: {
            userId: candidate.userId,
            cvFileUrl: { not: null },
            status: 'PUBLISHED',
        },
        orderBy: { updatedAt: 'desc' },
        select: { cvFileUrl: true },
    });

    return NextResponse.json({
        unlocked: true,
        candidate: {
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
            cvFileUrl: cvProfile?.cvFileUrl || null,
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
                        highlights: Array.isArray(exp.bullets)
                            ? exp.bullets.map((bullet: any) => bullet.content).filter(Boolean)
                            : exp.highlights,
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
        },
    });
}
