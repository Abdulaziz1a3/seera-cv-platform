import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { extractSkillsFromJobDescription } from '@/lib/ai';

const requestSchema = z.object({
    jobDescription: z.string().min(20, 'Job description is too short'),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { jobDescription } = requestSchema.parse(body);

        const skills = await extractSkillsFromJobDescription(jobDescription);

        return NextResponse.json({ skills });
    } catch (error) {
        console.error('Extract skills error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : 'Failed to extract skills';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
