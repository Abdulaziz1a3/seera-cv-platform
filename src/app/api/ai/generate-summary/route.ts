import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { generateSummary } from '@/lib/ai';

const requestSchema = z.object({
    currentContent: z.string().optional(),
    experience: z.array(z.any()).optional(),
    skills: z.array(z.string()).optional(),
    targetRole: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creditSummary = await getCreditSummary(session.user.id);
        if (creditSummary.availableCredits <= 0) {
            return NextResponse.json(buildCreditErrorPayload(creditSummary), { status: 402 });
        }

        const body = await request.json();
        const { experience = [], skills = [], targetRole } = requestSchema.parse(body);

        // Generate summary
        const summary = await generateSummary(experience, skills, targetRole, {
            userId: session.user.id,
            operation: 'summary',
        });

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Generate summary error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : 'Failed to generate summary';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
