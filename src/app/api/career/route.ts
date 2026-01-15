import { NextRequest, NextResponse } from 'next/server';
import {
    analyzeCareer,
    generateActionPlan,
    getIndustryInsights,
} from '@/lib/career-gps';
import { normalizeResumeForCareer } from '@/lib/resume-normalizer';

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

        const normalizedResume = resume ? normalizeResumeForCareer(resume) : null;

        let result;

        switch (action) {
            case 'analyze':
                if (!normalizedResume) {
                    return NextResponse.json({ error: 'Resume required' }, { status: 400 });
                }
                result = await analyzeCareer(normalizedResume, options);
                break;

            case 'action-plan':
                if (!normalizedResume || !body.targetPath) {
                    return NextResponse.json({ error: 'Resume and target path required' }, { status: 400 });
                }
                result = await generateActionPlan(normalizedResume, body.targetPath, options);
                break;

            case 'industry-insights':
                if (!body.industry) {
                    return NextResponse.json({ error: 'Industry required' }, { status: 400 });
                }
                result = await getIndustryInsights(body.industry, options);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('Career GPS API Error:', error);
        const message = error?.message || 'Career analysis failed';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
