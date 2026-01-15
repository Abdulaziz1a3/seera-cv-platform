import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createJobTargetSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    company: z.string().optional(),
    description: z.string().min(20, 'Job description is too short'),
    resumeId: z.string().min(1, 'Resume ID is required'),
    matchScore: z.number().optional(),
    matchingKeywords: z.array(z.string()).optional(),
    missingKeywords: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const jobTargets = await prisma.jobTarget.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                resumes: {
                    include: {
                        resume: {
                            select: { id: true, title: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(jobTargets);
    } catch (error) {
        console.error('Get job targets error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job targets' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = createJobTargetSchema.parse(body);

        const resume = await prisma.resume.findFirst({
            where: {
                id: data.resumeId,
                userId: session.user.id,
                deletedAt: null,
            },
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const keywords = Array.from(new Set([
            ...(data.matchingKeywords || []),
            ...(data.missingKeywords || []),
        ]));

        const jobTarget = await prisma.jobTarget.create({
            data: {
                userId: session.user.id,
                title: data.title,
                company: data.company,
                description: data.description,
                keywords,
                matchScore: data.matchScore,
                analysisData: {
                    matchingKeywords: data.matchingKeywords || [],
                    missingKeywords: data.missingKeywords || [],
                    suggestions: data.suggestions || [],
                },
                resumes: {
                    create: {
                        resumeId: data.resumeId,
                        matchScore: data.matchScore,
                    },
                },
            },
        });

        return NextResponse.json({ id: jobTarget.id }, { status: 201 });
    } catch (error) {
        console.error('Create job target error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create job target' },
            { status: 500 }
        );
    }
}
