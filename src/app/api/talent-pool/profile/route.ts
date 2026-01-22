import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasActiveSubscription } from '@/lib/subscription';
import { logger } from '@/lib/logger';

// Force dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';

// Validation schema for profile creation/update
const profileSchema = z.object({
    resumeId: z.string().min(1, 'Resume ID is required'),
    isVisible: z.boolean().default(true),
    availabilityStatus: z.enum(['actively_looking', 'open_to_offers', 'not_looking']).default('open_to_offers'),
    hideCurrentEmployer: z.boolean().default(false),
    hideSalaryHistory: z.boolean().default(true),
    verifiedCompaniesOnly: z.boolean().default(false),
    desiredRoles: z.array(z.string()).default([]),
    desiredSalaryMin: z.number().int().nonnegative().optional().nullable(),
    desiredSalaryMax: z.number().int().nonnegative().optional().nullable(),
    noticePeriod: z.enum(['immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months']).optional().nullable(),
    preferredLocations: z.array(z.string()).default([]),
    preferredIndustries: z.array(z.string()).default([]),
});

/**
 * Extract years of experience from resume experience items
 */
function extractYearsExperience(experienceItems: any[] = []): number | null {
    const dates = experienceItems
        .map((exp) => exp.startDate)
        .filter(Boolean)
        .map((d) => new Date(d).getTime())
        .filter((t) => !Number.isNaN(t));

    if (!dates.length) return null;

    const earliest = Math.min(...dates);
    const years = (Date.now() - earliest) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, Math.round(years));
}

/**
 * Extract profile data from resume snapshot
 */
function extractProfileFromSnapshot(snapshot: any) {
    const contact = snapshot?.contact || {};
    const experience = snapshot?.experience?.items || [];
    const education = snapshot?.education?.items || [];
    const skills = snapshot?.skills?.simpleList || [];
    const summary = snapshot?.summary?.content || '';
    const currentRole = experience[0]?.position || snapshot?.targetRole || null;
    const currentCompany = experience[0]?.company || null;
    const educationText = education[0]
        ? `${education[0].degree || ''} ${education[0].field ? 'in ' + education[0].field : ''}`.trim()
        : null;

    return {
        displayName: contact.fullName || 'Talent Profile',
        currentTitle: currentRole,
        currentCompany,
        location: contact.location || null,
        yearsExperience: extractYearsExperience(experience),
        skills,
        education: educationText,
        summary,
    };
}

/**
 * GET /api/talent-pool/profile
 * Fetch the current user's talent pool profile
 */
export async function GET() {
    try {
        // Step 1: Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Step 2: Check for Pro subscription
        let hasAccess = false;
        try {
            hasAccess = await hasActiveSubscription(userId);
        } catch (subError) {
            logger.error('Talent pool subscription check failed:', {
                error: subError as Error,
                userId
            });
            // Return 403 on subscription check failure
            return NextResponse.json(
                { error: 'Subscription check failed. Please try again.' },
                { status: 403 }
            );
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Upgrade to access Talent Pool' },
                { status: 403 }
            );
        }

        // Step 3: Fetch existing profile
        const profile = await prisma.talentProfile.findUnique({
            where: { userId },
            include: {
                resume: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return NextResponse.json({
            profile,
            hasAccess: true,
        });
    } catch (error) {
        const err = error as Error;
        logger.error('Talent pool GET error:', {
            message: err?.message,
            stack: err?.stack,
        });
        return NextResponse.json(
            { error: 'Failed to fetch talent profile. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/talent-pool/profile
 * Create or update the user's talent pool profile
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check for Pro subscription
        const hasAccess = await hasActiveSubscription(session.user.id);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Upgrade to access Talent Pool' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const parseResult = profileSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = parseResult.data;

        // Verify the resume exists and belongs to the user
        const resume = await prisma.resume.findFirst({
            where: {
                id: data.resumeId,
                userId: session.user.id,
                deletedAt: null,
            },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                    select: { snapshot: true },
                },
            },
        });

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume not found or does not belong to you' },
                { status: 404 }
            );
        }

        if (resume.versions.length === 0) {
            return NextResponse.json(
                { error: 'Resume has no saved versions. Please save your resume first.' },
                { status: 400 }
            );
        }

        // Extract profile data from resume
        const snapshot = resume.versions[0].snapshot as any;
        const derived = extractProfileFromSnapshot(snapshot);

        // Create or update the profile
        const profile = await prisma.talentProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                resumeId: data.resumeId,
                displayName: derived.displayName,
                currentTitle: derived.currentTitle,
                currentCompany: derived.currentCompany,
                location: derived.location,
                yearsExperience: derived.yearsExperience,
                skills: derived.skills,
                education: derived.education,
                summary: derived.summary,
                availabilityStatus: data.availabilityStatus,
                desiredSalaryMin: data.desiredSalaryMin ?? undefined,
                desiredSalaryMax: data.desiredSalaryMax ?? undefined,
                isVisible: data.isVisible,
                hideCurrentEmployer: data.hideCurrentEmployer,
                hideSalaryHistory: data.hideSalaryHistory,
                verifiedCompaniesOnly: data.verifiedCompaniesOnly,
                noticePeriod: data.noticePeriod ?? undefined,
                preferredLocations: data.preferredLocations,
                preferredIndustries: data.preferredIndustries,
                desiredRoles: data.desiredRoles,
            },
            update: {
                resumeId: data.resumeId,
                displayName: derived.displayName,
                currentTitle: derived.currentTitle,
                currentCompany: derived.currentCompany,
                location: derived.location,
                yearsExperience: derived.yearsExperience,
                skills: derived.skills,
                education: derived.education,
                summary: derived.summary,
                availabilityStatus: data.availabilityStatus,
                desiredSalaryMin: data.desiredSalaryMin ?? undefined,
                desiredSalaryMax: data.desiredSalaryMax ?? undefined,
                isVisible: data.isVisible,
                hideCurrentEmployer: data.hideCurrentEmployer,
                hideSalaryHistory: data.hideSalaryHistory,
                verifiedCompaniesOnly: data.verifiedCompaniesOnly,
                noticePeriod: data.noticePeriod ?? undefined,
                preferredLocations: data.preferredLocations,
                preferredIndustries: data.preferredIndustries,
                desiredRoles: data.desiredRoles,
            },
        });

        logger.info('Talent profile created/updated', {
            userId: session.user.id,
            profileId: profile.id,
        });

        return NextResponse.json({
            profile,
            success: true,
        });
    } catch (error) {
        logger.error('Talent pool POST error:', { error: error as Error });
        return NextResponse.json(
            { error: 'Failed to save talent profile. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/talent-pool/profile
 * Remove the user from the talent pool
 */
export async function DELETE() {
    try {
        // Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete the profile if it exists
        const deleted = await prisma.talentProfile.deleteMany({
            where: { userId: session.user.id },
        });

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: 'No talent profile found to delete' },
                { status: 404 }
            );
        }

        logger.info('Talent profile deleted', { userId: session.user.id });

        return NextResponse.json({
            success: true,
            message: 'Successfully left the Talent Pool',
        });
    } catch (error) {
        logger.error('Talent pool DELETE error:', { error: error as Error });
        return NextResponse.json(
            { error: 'Failed to leave the Talent Pool. Please try again.' },
            { status: 500 }
        );
    }
}
