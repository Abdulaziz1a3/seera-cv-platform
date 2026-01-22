import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
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

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isAdmin = user.role === 'SUPER_ADMIN';
        const sub = user.subscription;
        const hasActiveSub = sub &&
            sub.plan !== 'FREE' &&
            (sub.status === 'ACTIVE' || sub.status === 'TRIALING') &&
            (!sub.currentPeriodEnd || sub.currentPeriodEnd >= new Date());

        if (!isAdmin && !hasActiveSub) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        const profile = await prisma.talentProfile.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ profile });
    } catch (error: any) {
        console.error('Talent pool GET error:', error?.message || error);
        return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
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

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isAdmin = user.role === 'SUPER_ADMIN';
        const sub = user.subscription;
        const hasActiveSub = sub &&
            sub.plan !== 'FREE' &&
            (sub.status === 'ACTIVE' || sub.status === 'TRIALING') &&
            (!sub.currentPeriodEnd || sub.currentPeriodEnd >= new Date());

        if (!isAdmin && !hasActiveSub) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        // Parse body
        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const resumeId = body?.resumeId;
        if (!resumeId || typeof resumeId !== 'string') {
            return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
        }

        // Find resume
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId: session.user.id },
            include: {
                versions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });

        if (!resume || resume.versions.length === 0) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const snapshot = resume.versions[0].snapshot as any;
        const contact = snapshot?.contact || {};
        const experience = snapshot?.experience?.items || [];
        const education = snapshot?.education?.items || [];
        const skills = snapshot?.skills?.simpleList || [];

        // Calculate years of experience
        let yearsExperience: number | null = null;
        const dates = experience
            .map((exp: any) => exp.startDate)
            .filter(Boolean)
            .map((d: string) => new Date(d).getTime())
            .filter((t: number) => !Number.isNaN(t));
        if (dates.length > 0) {
            const earliest = Math.min(...dates);
            yearsExperience = Math.max(0, Math.round((Date.now() - earliest) / (1000 * 60 * 60 * 24 * 365)));
        }

        const displayName = contact.fullName || 'Talent Profile';
        const currentTitle = experience[0]?.position || snapshot?.targetRole || null;
        const currentCompany = experience[0]?.company || null;
        const location = contact.location || null;
        const educationText = education[0]
            ? `${education[0].degree || ''} ${education[0].field ? 'in ' + education[0].field : ''}`.trim()
            : null;
        const summary = snapshot?.summary?.content || '';

        // Upsert profile
        const profile = await prisma.talentProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                resumeId: resumeId,
                displayName,
                currentTitle,
                currentCompany,
                location,
                yearsExperience,
                skills,
                education: educationText,
                summary,
                availabilityStatus: body.availabilityStatus || 'open_to_offers',
                desiredSalaryMin: body.desiredSalaryMin || null,
                desiredSalaryMax: body.desiredSalaryMax || null,
                isVisible: body.isVisible !== false,
                hideCurrentEmployer: body.hideCurrentEmployer === true,
                hideSalaryHistory: body.hideSalaryHistory !== false,
                verifiedCompaniesOnly: body.verifiedCompaniesOnly === true,
                noticePeriod: body.noticePeriod || null,
                preferredLocations: Array.isArray(body.preferredLocations) ? body.preferredLocations : [],
                preferredIndustries: Array.isArray(body.preferredIndustries) ? body.preferredIndustries : [],
                desiredRoles: Array.isArray(body.desiredRoles) ? body.desiredRoles : [],
            },
            update: {
                resumeId: resumeId,
                displayName,
                currentTitle,
                currentCompany,
                location,
                yearsExperience,
                skills,
                education: educationText,
                summary,
                availabilityStatus: body.availabilityStatus || 'open_to_offers',
                desiredSalaryMin: body.desiredSalaryMin || null,
                desiredSalaryMax: body.desiredSalaryMax || null,
                isVisible: body.isVisible !== false,
                hideCurrentEmployer: body.hideCurrentEmployer === true,
                hideSalaryHistory: body.hideSalaryHistory !== false,
                verifiedCompaniesOnly: body.verifiedCompaniesOnly === true,
                noticePeriod: body.noticePeriod || null,
                preferredLocations: Array.isArray(body.preferredLocations) ? body.preferredLocations : [],
                preferredIndustries: Array.isArray(body.preferredIndustries) ? body.preferredIndustries : [],
                desiredRoles: Array.isArray(body.desiredRoles) ? body.desiredRoles : [],
            },
        });

        return NextResponse.json({ profile });
    } catch (error: any) {
        console.error('Talent pool POST error:', error?.message || error);
        return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
    }
}
