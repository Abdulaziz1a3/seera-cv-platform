import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Check if user has talent hunter access (super admin for now)
 */
async function hasTalentHunterAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role === 'SUPER_ADMIN';
}

/**
 * GET /api/talent-hunter/candidates/[id]
 * Get detailed candidate profile
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await hasTalentHunterAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Talent Hunter access required' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Fetch candidate profile with resume details
        const candidate = await prisma.talentProfile.findUnique({
            where: { id },
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
            },
        });

        if (!candidate) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        if (!candidate.isVisible) {
            return NextResponse.json(
                { error: 'This candidate profile is not available' },
                { status: 404 }
            );
        }

        // Extract resume data
        const resumeSnapshot = candidate.resume?.versions[0]?.snapshot as any;

        // Build response with privacy controls
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
            desiredSalaryMin: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMin,
            desiredSalaryMax: candidate.hideSalaryHistory ? null : candidate.desiredSalaryMax,
            noticePeriod: candidate.noticePeriod,
            preferredLocations: candidate.preferredLocations,
            preferredIndustries: candidate.preferredIndustries,
            desiredRoles: candidate.desiredRoles,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt,
            // Resume details (with privacy filters)
            resume: resumeSnapshot ? {
                contact: {
                    fullName: resumeSnapshot.contact?.fullName,
                    email: resumeSnapshot.contact?.email,
                    phone: resumeSnapshot.contact?.phone,
                    location: resumeSnapshot.contact?.location,
                    linkedin: resumeSnapshot.contact?.linkedin,
                    website: resumeSnapshot.contact?.website,
                },
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
            } : null,
        };

        return NextResponse.json({ candidate: response });
    } catch (error) {
        console.error('Talent hunter candidate detail error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch candidate details' },
            { status: 500 }
        );
    }
}
