import { NextRequest, NextResponse } from 'next/server';
import {
    generateHeadlines,
    generateAboutSection,
    optimizeExperience,
    optimizeSkills,
    optimizeFullProfile,
} from '@/lib/linkedin-optimizer';
import { normalizeResumeForAI } from '@/lib/resume-normalizer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, resume, options = {} } = body;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API not configured' },
                { status: 503 }
            );
        }

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume data is required' },
                { status: 400 }
            );
        }

        const normalizedResume = normalizeResumeForAI(resume);

        let result;

        switch (action) {
            case 'headlines':
                result = await generateHeadlines(normalizedResume, options);
                break;

            case 'about':
                result = await generateAboutSection(normalizedResume, options);
                break;

            case 'experience':
                result = await optimizeExperience(normalizedResume, options);
                break;

            case 'skills':
                result = await optimizeSkills(normalizedResume, options);
                break;

            case 'full':
                result = await optimizeFullProfile(normalizedResume, options);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('LinkedIn API Error:', error);
        const message = error?.message || 'LinkedIn optimization failed';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
