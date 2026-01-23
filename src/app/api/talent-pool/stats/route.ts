import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasActiveSubscription } from '@/lib/subscription';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hasAccess = await hasActiveSubscription(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }

        const profile = await prisma.talentProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!profile) {
            return NextResponse.json({
                stats: {
                    profileViews: 0,
                    unlocks: 0,
                    searchAppearances: 0,
                    cvDownloads: 0,
                },
            });
        }

        const [profileViews, unlocks, searchAppearances, cvDownloads] = await Promise.all([
            prisma.talentProfileView.count({ where: { candidateId: profile.id } }),
            prisma.cvUnlock.count({ where: { candidateId: profile.id } }),
            prisma.recruiterJobRecommendation.count({ where: { candidateId: profile.id } }),
            prisma.talentProfileDownload.count({ where: { candidateId: profile.id } }),
        ]);

        return NextResponse.json({
            stats: {
                profileViews,
                unlocks,
                searchAppearances,
                cvDownloads,
            },
        });
    } catch (error) {
        console.error('Talent pool stats error:', error);
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }
}
