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
            (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date());

        if (!isAdmin && !hasActiveSub) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        const profile = await prisma.talentProfile.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ profile: profile || null });
    } catch (e: any) {
        return NextResponse.json({
            error: 'GET failed',
            message: e?.message || 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date());

        if (!isAdmin && !hasActiveSub) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const resumeId = body?.resumeId;
        if (!resumeId) {
            return NextResponse.json({ error: 'resumeId required' }, { status: 400 });
        }

        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId: session.user.id },
            include: {
                versions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });

        if (!resume || !resume.versions || resume.versions.length === 0) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const snapshot = resume.versions[0].snapshot as any;
        const contact = snapshot?.contact || {};
        const experience = snapshot?.experience?.items || [];
        const education = snapshot?.education?.items || [];
        const skillsList = snapshot?.skills?.simpleList || [];

        let yearsExp: number | null = null;
        const startDates = experience
            .map((e: any) => e?.startDate)
            .filter(Boolean)
            .map((d: string) => new Date(d).getTime())
            .filter((t: number) => !isNaN(t));

        if (startDates.length > 0) {
            const earliest = Math.min(...startDates);
            yearsExp = Math.max(0, Math.round((Date.now() - earliest) / (365 * 24 * 60 * 60 * 1000)));
        }

        const educationStr = education[0]
            ? `${education[0].degree || ''} ${education[0].field ? 'in ' + education[0].field : ''}`.trim() || null
            : null;

        const profileData = {
            resumeId,
            displayName: contact.fullName || 'Talent Profile',
            currentTitle: experience[0]?.position || snapshot?.targetRole || null,
            currentCompany: experience[0]?.company || null,
            location: contact.location || null,
            yearsExperience: yearsExp,
            skills: skillsList,
            education: educationStr,
            summary: snapshot?.summary?.content || '',
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
        };

        const profile = await prisma.talentProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...profileData,
            },
            update: profileData,
        });

        return NextResponse.json({ profile });
    } catch (e: any) {
        return NextResponse.json({
            error: 'POST failed',
            message: e?.message || 'Unknown error'
        }, { status: 500 });
    }
}
