import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { hasActiveSubscription } from '@/lib/subscription';
import {
    generateHeadlines,
    generateAboutSection,
    optimizeExperience,
    optimizeSkills,
    optimizeFullProfile,
} from '@/lib/linkedin-optimizer';
import { normalizeResumeForAI } from '@/lib/resume-normalizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
        return errors.subscriptionRequired('LinkedIn Optimizer');
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

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume data is required' },
                { status: 400 }
            );
        }

        const normalizedResume = normalizeResumeForAI(resume);
        const trackingOptions = { ...options, userId: session.user.id };

        let result;

        switch (action) {
            case 'headlines':
                result = await generateHeadlines(normalizedResume, trackingOptions);
                break;

            case 'about':
                result = await generateAboutSection(normalizedResume, trackingOptions);
                break;

            case 'experience':
                result = await optimizeExperience(normalizedResume, trackingOptions);
                break;

            case 'skills':
                result = await optimizeSkills(normalizedResume, trackingOptions);
                break;

            case 'full':
                result = await optimizeFullProfile(normalizedResume, trackingOptions);
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
