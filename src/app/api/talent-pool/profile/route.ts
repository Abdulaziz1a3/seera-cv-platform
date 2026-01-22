import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const profileSchema = z.object({
    resumeId: z.string().min(1),
    isVisible: z.boolean().default(true),
    availabilityStatus: z.string().default('open_to_offers'),
    hideCurrentEmployer: z.boolean().default(false),
    hideSalaryHistory: z.boolean().default(true),
    verifiedCompaniesOnly: z.boolean().default(false),
    desiredRoles: z.array(z.string()).default([]),
    desiredSalaryMin: z.number().int().nonnegative().optional(),
    desiredSalaryMax: z.number().int().nonnegative().optional(),
    noticePeriod: z.string().optional(),
    preferredLocations: z.array(z.string()).default([]),
    preferredIndustries: z.array(z.string()).default([]),
});

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

async function checkSubscription(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            subscription: {
                select: {
                    plan: true,
                    status: true,
                    currentPeriodEnd: true,
                },
            },
        },
    });

    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    const subscription = user.subscription;
    if (!subscription || subscription.plan === 'FREE') return false;
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') return false;
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) return false;

    return true;
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await checkSubscription(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        const profile = await prisma.talentProfile.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Talent pool GET error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await checkSubscription(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        let data;
        try {
            data = profileSchema.parse(body);
        } catch (err) {
            console.error('Validation error:', err);
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const resume = await prisma.resume.findFirst({
            where: { id: data.resumeId, userId: session.user.id },
            include: {
                versions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });

        if (!resume || resume.versions.length === 0) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const snapshot = resume.versions[0].snapshot as any;
        const derived = extractProfileFromSnapshot(snapshot);

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
                desiredSalaryMin: data.desiredSalaryMin,
                desiredSalaryMax: data.desiredSalaryMax,
                isVisible: data.isVisible,
                hideCurrentEmployer: data.hideCurrentEmployer,
                hideSalaryHistory: data.hideSalaryHistory,
                verifiedCompaniesOnly: data.verifiedCompaniesOnly,
                noticePeriod: data.noticePeriod,
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
                desiredSalaryMin: data.desiredSalaryMin,
                desiredSalaryMax: data.desiredSalaryMax,
                isVisible: data.isVisible,
                hideCurrentEmployer: data.hideCurrentEmployer,
                hideSalaryHistory: data.hideSalaryHistory,
                verifiedCompaniesOnly: data.verifiedCompaniesOnly,
                noticePeriod: data.noticePeriod,
                preferredLocations: data.preferredLocations,
                preferredIndustries: data.preferredIndustries,
                desiredRoles: data.desiredRoles,
            },
        });

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Talent pool POST error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
