import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createSessionSchema = z.object({
    targetRole: z.string().min(1),
    experienceLevel: z.string().min(1),
    interviewLang: z.string().min(1),
    resumeId: z.string().optional().nullable(),
    overallScore: z.number().min(0).max(10),
    summary: z.any().optional().nullable(),
    results: z.any().optional().nullable(),
    transcript: z.any().optional().nullable(),
});

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam) || 2, 1), 10);

    const sessions = await prisma.interviewSession.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { resume: { select: { id: true, title: true } } },
    });

    const payload = sessions.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        targetRole: item.targetRole,
        experienceLevel: item.experienceLevel,
        interviewLang: item.interviewLang,
        resumeId: item.resumeId,
        resumeTitle: item.resume?.title || null,
        overallScore: item.overallScore,
        summary: item.summary,
        results: item.results,
        transcript: item.transcript,
        recordingAvailable: Boolean(item.recordingPath),
    }));

    return NextResponse.json({ sessions: payload });
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = createSessionSchema.parse(body);

        const created = await prisma.interviewSession.create({
            data: {
                userId: session.user.id,
                resumeId: data.resumeId || null,
                targetRole: data.targetRole,
                experienceLevel: data.experienceLevel,
                interviewLang: data.interviewLang,
                overallScore: data.overallScore,
                summary: data.summary ?? null,
                results: data.results ?? null,
                transcript: data.transcript ?? null,
            },
            include: {
                resume: {
                    select: { id: true, title: true },
                },
            },
        });

        return NextResponse.json({
            session: {
                id: created.id,
                createdAt: created.createdAt.toISOString(),
                targetRole: created.targetRole,
                experienceLevel: created.experienceLevel,
                interviewLang: created.interviewLang,
                resumeId: created.resumeId,
                resumeTitle: created.resume?.title || null,
                overallScore: created.overallScore,
                summary: created.summary,
                results: created.results,
                transcript: created.transcript,
                recordingAvailable: Boolean(created.recordingPath),
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid session payload', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Interview session create error:', error);
        return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    }
}
