import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { hasActiveSubscription } from '@/lib/subscription';
import {
    generateInterviewQuestions,
    conductInterview,
    evaluateAnswer,
    generateInterviewerVoice,
    generateInterviewSummary,
} from '@/lib/interview-ai';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
        return errors.subscriptionRequired('Interview Prep');
    }

    try {
        const body = await request.json();
        const { action, ...params } = body;

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

        let result;
        const context = params.context ? { ...params.context, userId: session.user.id } : { userId: session.user.id };

        switch (action) {
            case 'generate-questions':
                result = await generateInterviewQuestions(context, params.count);
                break;

            case 'conduct-interview':
                result = await conductInterview(
                    params.messages,
                    context,
                    params.currentQuestion,
                    params.nextQuestion
                );
                break;

            case 'evaluate-answer':
                result = await evaluateAnswer(
                    params.question,
                    params.answer,
                    context
                );
                break;

            case 'generate-summary':
                result = await generateInterviewSummary(params.questions, context);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('Interview API Error:', error);
        const message = error?.message || 'Interview API failed';
        const status = /API_KEY|API key|OpenAI API/i.test(message) ? 503 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
