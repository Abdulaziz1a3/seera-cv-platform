import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { buildAnonymizedName } from '@/lib/recruiter-matching';

function buildResumeSnapshotFromSections(resume?: {
    title?: string | null;
    language?: string | null;
    template?: string | null;
    theme?: string | null;
    fontFamily?: string | null;
    targetRole?: string | null;
    sections?: Array<{ type: string; content: any }>;
}) {
    if (!resume?.sections?.length) return null;
    const snapshot: Record<string, any> = {
        title: resume.title || undefined,
        language: resume.language || undefined,
        template: resume.template || undefined,
        theme: resume.theme || undefined,
        fontFamily: resume.fontFamily || undefined,
        targetRole: resume.targetRole || undefined,
    };
    resume.sections.forEach((section) => {
        snapshot[section.type.toLowerCase()] = section.content;
    });
    return snapshot;
}

function hasResumeContent(snapshot?: any) {
    if (!snapshot) return false;
    const summary = snapshot.summary?.content;
    const experienceCount = snapshot.experience?.items?.length || 0;
    const educationCount = snapshot.education?.items?.length || 0;
    const projectCount = snapshot.projects?.items?.length || 0;
    const certificationsCount = snapshot.certifications?.items?.length || 0;
    const languagesCount = snapshot.languages?.items?.length || 0;
    const skillsCount = snapshot.skills?.simpleList?.length || 0;
    const skillsCategoriesCount = snapshot.skills?.categories?.length || 0;
    return Boolean(summary) ||
        experienceCount > 0 ||
        educationCount > 0 ||
        projectCount > 0 ||
        certificationsCount > 0 ||
        languagesCount > 0 ||
        skillsCount > 0 ||
        skillsCategoriesCount > 0;
}

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
    const fallbackSnapshot = buildResumeSnapshotFromSections(candidate.resume || undefined);
    let snapshot =
        resumeSnapshot && Object.keys(resumeSnapshot).length > 0
            ? resumeSnapshot
            : fallbackSnapshot;

    if (!hasResumeContent(snapshot)) {
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
            const nextSnapshot =
                latestSnapshot && Object.keys(latestSnapshot).length > 0
                    ? latestSnapshot
                    : latestFallback;
            if (hasResumeContent(nextSnapshot)) {
                snapshot = nextSnapshot;
            }
        }
    }
    const resumeContact = snapshot?.contact || {};
    const mergedContact = candidate.contact || resumeContact
        ? {
            fullName: candidate.contact?.fullName || resumeContact.fullName || null,
            email: candidate.contact?.email || resumeContact.email || null,
            phone: candidate.contact?.phone || resumeContact.phone || null,
            location: candidate.contact?.location || resumeContact.location || null,
            linkedin: candidate.contact?.linkedinUrl || resumeContact.linkedin || null,
            website: candidate.contact?.websiteUrl || resumeContact.website || null,
        }
        : null;
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
            contact: mergedContact,
            resume: snapshot
                ? {
                    summary: snapshot.summary?.content,
                    experience: snapshot.experience?.items?.map((exp: any) => ({
                        company: candidate.hideCurrentEmployer && exp === snapshot.experience?.items[0]
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
                    education: snapshot.education?.items?.map((edu: any) => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.field,
                        graduationDate: edu.graduationDate || edu.endDate,
                        gpa: edu.gpa,
                    })),
                    skills: snapshot.skills?.simpleList || [],
                    certifications: snapshot.certifications?.items,
                    projects: snapshot.projects?.items,
                    languages: snapshot.languages?.items,
                }
                : null,
        },
    });
}
