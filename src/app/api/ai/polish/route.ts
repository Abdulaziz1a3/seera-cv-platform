import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { improveContent } from '@/lib/openai';

// Schema for request validation
const requestSchema = z.object({
    content: z.string().min(1, "Content cannot be empty").max(2000, "Content too long"),
    instruction: z.enum(['fix_grammar', 'professional', 'concise', 'make_concise', 'expand', 'active_voice']).default('professional'),
    type: z.enum(['summary', 'bullet', 'description']).default('description'),
    locale: z.enum(['en', 'ar']).default('en'),
    context: z.object({
        position: z.string().optional(),
        company: z.string().optional(),
        description: z.string().optional(),
    }).optional(),
});

export async function POST(request: Request) {
    try {
        // 1. Verify Authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creditSummary = await getCreditSummary(session.user.id);
        if (creditSummary.availableCredits <= 0) {
            return NextResponse.json(buildCreditErrorPayload(creditSummary), { status: 402 });
        }

        // 2. Parse Request Body
        const body = await request.json();
        const validation = requestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { content, instruction, type, locale, context } = validation.data;

        // 3. Build context-aware content for polishing
        let contentWithContext = content;
        if (context && (context.position || context.company)) {
            const contextPrefix = `[Context: ${context.position ? `Role: ${context.position}` : ''}${context.position && context.company ? ', ' : ''}${context.company ? `Company: ${context.company}` : ''}]\n\n`;
            contentWithContext = contextPrefix + content;
        }

        // 4. Call OpenAI Service
        const instructionMap: Record<string, string> = {
            fix_grammar: 'fix_grammar',
            professional: 'make_professional',
            concise: 'make_concise',
            make_concise: 'make_concise',
            expand: 'expand',
            active_voice: 'active_voice',
        };

        const promptType = instructionMap[instruction] || type;

        let polishedText = await improveContent(contentWithContext, promptType as any, {
            locale,
            tracking: {
                userId: session.user.id,
                operation: 'polish',
            },
        });

        return NextResponse.json({ polishedText });

    } catch (error) {
        console.error('AI Polisher API Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to polish content';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
