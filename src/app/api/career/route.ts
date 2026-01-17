import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { hasActiveSubscription } from '@/lib/subscription';
import {
    analyzeCareer,
    generateActionPlan,
    getIndustryInsights,
} from '@/lib/career-gps';
import { normalizeResumeForCareer } from '@/lib/resume-normalizer';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
        return errors.subscriptionRequired('Career GPS');
    }

    try {
        const body = await request.json();
        const { action, resume, options = {} } = body;

        const creditSummary = await getCreditSummary(session.user.id);
        if (creditSummary.availableCredits <= 0) {
            return NextResponse.json(buildCreditErrorPayload(creditSummary), { status: 402 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API not configured' },
                { status: 503 }
            );
        }

        const normalizedResume = resume ? normalizeResumeForCareer(resume) : null;
        const trackingOptions = { ...options, userId: session.user.id };

        let result;

        switch (action) {
            case 'analyze':
                if (!normalizedResume) {
                    return NextResponse.json({ error: 'Resume required' }, { status: 400 });
                }
                result = await analyzeCareer(normalizedResume, trackingOptions);
                break;

            case 'action-plan':
                if (!normalizedResume || !body.targetPath) {
                    return NextResponse.json({ error: 'Resume and target path required' }, { status: 400 });
                }
                result = await generateActionPlan(normalizedResume, body.targetPath, trackingOptions);
                break;

            case 'industry-insights':
                if (!body.industry) {
                    return NextResponse.json({ error: 'Industry required' }, { status: 400 });
                }
                result = await getIndustryInsights(body.industry, trackingOptions);
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
