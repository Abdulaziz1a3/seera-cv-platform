import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyzeJobMatch } from '@/lib/ai';

const requestSchema = z.object({
    jobDescription: z.string().min(20, 'Job description is too short'),
    resumeId: z.string().min(1, 'Resume ID is required'),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { jobDescription, resumeId } = requestSchema.parse(body);

        const resume = await prisma.resume.findFirst({
            where: {
                id: resumeId,
                userId: session.user.id,
                deletedAt: null,
            },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const resumeData: Record<string, unknown> = {
            id: resume.id,
            title: resume.title,
            targetRole: resume.targetRole,
            language: resume.language,
        };

        resume.sections.forEach((section) => {
            const key = section.type.toLowerCase();
            resumeData[key] = section.content;
        });

        const analysis = await analyzeJobMatch(resumeData, jobDescription);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Analyze match error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : 'Failed to analyze match';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
