import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API not configured' },
                { status: 503 }
            );
        }

        let result;

        switch (action) {
            case 'generate-questions':
                result = await generateInterviewQuestions(params.context, params.count);
                break;

            case 'conduct-interview':
                result = await conductInterview(
                    params.messages,
                    params.context,
                    params.currentQuestion
                );
                break;

            case 'evaluate-answer':
                result = await evaluateAnswer(
                    params.question,
                    params.answer,
                    params.context
                );
                break;

            case 'generate-summary':
                result = await generateInterviewSummary(params.questions, params.context);
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
