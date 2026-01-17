import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import {
    generateSummary,
    generateBullets,
    suggestSkills,
    improveContent,
    analyzeJobDescription,
    generateCoverLetter
} from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creditSummary = await getCreditSummary(session.user.id);
        if (creditSummary.availableCredits <= 0) {
            return NextResponse.json(buildCreditErrorPayload(creditSummary), { status: 402 });
        }

        const body = await request.json();
        const { action, ...params } = body;

        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API not configured' },
                { status: 503 }
            );
        }

        let result;

        switch (action) {
            case 'summary':
                result = await generateSummary({
                    ...params,
                    tracking: { userId: session.user.id, operation: 'summary' },
                });
                break;

            case 'bullets':
                const { position, company, ...bulletOptions } = params;
                result = await generateBullets(position, company, {
                    ...bulletOptions,
                    tracking: { userId: session.user.id, operation: 'bullets' },
                });
                break;

            case 'skills':
                const { targetRole, existingSkills, ...skillOptions } = params;
                result = await suggestSkills(targetRole, existingSkills, {
                    ...skillOptions,
                    tracking: { userId: session.user.id, operation: 'skills' },
                });
                break;

            case 'improve':
                const { content, type, ...improveOptions } = params;
                result = await improveContent(content, type, {
                    ...improveOptions,
                    tracking: { userId: session.user.id, operation: 'improve' },
                });
                break;

            case 'analyze-job':
                const { jobDescription, locale } = params;
                result = await analyzeJobDescription(jobDescription, locale, {
                    userId: session.user.id,
                    operation: 'analyze_job',
                });
                break;

            case 'cover-letter':
                const { resumeData, jobDescription: jd, ...coverOptions } = params;
                result = await generateCoverLetter(resumeData, jd, {
                    ...coverOptions,
                    tracking: { userId: session.user.id, operation: 'cover_letter' },
                });
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('AI API Error:', error);
        const message = error?.message || 'AI generation failed';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
