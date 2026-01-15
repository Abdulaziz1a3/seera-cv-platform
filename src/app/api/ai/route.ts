import { NextRequest, NextResponse } from 'next/server';
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
                result = await generateSummary(params);
                break;

            case 'bullets':
                const { position, company, ...bulletOptions } = params;
                result = await generateBullets(position, company, bulletOptions);
                break;

            case 'skills':
                const { targetRole, existingSkills, ...skillOptions } = params;
                result = await suggestSkills(targetRole, existingSkills, skillOptions);
                break;

            case 'improve':
                const { content, type, ...improveOptions } = params;
                result = await improveContent(content, type, improveOptions);
                break;

            case 'analyze-job':
                const { jobDescription, locale } = params;
                result = await analyzeJobDescription(jobDescription, locale);
                break;

            case 'cover-letter':
                const { resumeData, jobDescription: jd, ...coverOptions } = params;
                result = await generateCoverLetter(resumeData, jd, coverOptions);
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
