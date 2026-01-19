import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApplicationStatus } from '@prisma/client';

type UiStatus =
    | 'saved'
    | 'applied'
    | 'screening'
    | 'interview'
    | 'offer'
    | 'accepted'
    | 'rejected'
    | 'withdrawn';

const STATUS_MAP: Record<ApplicationStatus, UiStatus> = {
    SAVED: 'saved',
    APPLIED: 'applied',
    SCREENING: 'screening',
    INTERVIEW: 'interview',
    OFFER: 'offer',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
};

// GET /api/applications - Get all job applications for the current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const applications = await prisma.jobApplication.findMany({
            where: { userId: session.user.id },
            orderBy: [{ appliedAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                notes: { orderBy: { createdAt: 'desc' }, take: 1 },
                jobTarget: {
                    include: {
                        resumes: {
                            include: {
                                resume: {
                                    select: { id: true, title: true },
                                },
                            },
                            take: 1,
                        },
                    },
                },
            },
        });

        const payload = applications.map((application) => {
            const resume = application.jobTarget?.resumes?.[0]?.resume || null;
            return {
                id: application.id,
                company: application.company,
                position: application.jobTitle,
                location: application.location,
                salary: application.salary,
                status: STATUS_MAP[application.status],
                appliedDate: application.appliedAt?.toISOString() ?? null,
                resumeId: resume?.id || null,
                resumeTitle: resume?.title || null,
                notes: application.notes?.[0]?.content || '',
                url: application.url || null,
            };
        });

        return NextResponse.json({ applications: payload });
    } catch (error) {
        console.error('Get applications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
