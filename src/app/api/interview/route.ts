import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errors } from '@/lib/api-response';
import { buildCreditErrorPayload, getCreditSummary } from '@/lib/ai-credits';
import { hasActiveSubscription } from '@/lib/subscription';
import { prisma } from '@/lib/db';
import {
    generateInterviewQuestions,
    conductInterview,
    evaluateAnswer,
    generateInterviewerVoice,
    generateInterviewSummary,
} from '@/lib/interview-ai';
import type { InterviewContext } from '@/lib/interview-ai';

async function enrichContextWithResume(
    userId: string,
    context: Record<string, any>
): Promise<Record<string, any>> {
    const resumeId = context?.resumeId;
    if (!resumeId) return context;

    const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId, deletedAt: null },
        include: {
            versions: { orderBy: { version: 'desc' }, take: 1 },
        },
    });

    if (!resume || resume.versions.length === 0) return context;

    const snapshot = resume.versions[0].snapshot as any;
    const summaryText = snapshot?.summary?.content || snapshot?.summary || '';
    const skillSet = new Set<string>();

    const addSkill = (skill?: string) => {
        if (!skill) return;
        const cleaned = String(skill).trim();
        if (cleaned) skillSet.add(cleaned);
    };

    const simpleSkills = snapshot?.skills?.simpleList || snapshot?.skills || [];
    if (Array.isArray(simpleSkills)) {
        simpleSkills.forEach((skill: string) => addSkill(skill));
    }

    const categories = snapshot?.skills?.categories;
    if (Array.isArray(categories)) {
        categories.forEach((category: any) => {
            const list = category?.skills || [];
            if (Array.isArray(list)) {
                list.forEach((skill: string) => addSkill(skill));
            }
        });
    }

    const experienceItems = snapshot?.experience?.items || [];
    if (Array.isArray(experienceItems)) {
        experienceItems.forEach((item: any) => {
            const list = item?.skills || [];
            if (Array.isArray(list)) {
                list.forEach((skill: string) => addSkill(skill));
            }
        });
    }

    const projectItems = snapshot?.projects?.items || [];
    if (Array.isArray(projectItems)) {
        projectItems.forEach((item: any) => {
            const list = item?.technologies || [];
            if (Array.isArray(list)) {
                list.forEach((skill: string) => addSkill(skill));
            }
        });
    }

    return {
        ...context,
        resumeSummary: summaryText,
        skills: Array.from(skillSet).slice(0, 30),
        resumeTitle: resume.title,
    };
}

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
        const contextBase = params.context ? { ...params.context, userId: session.user.id } : { userId: session.user.id };
        const enrichedContext = await enrichContextWithResume(session.user.id, contextBase);
        const normalizedExperience =
            enrichedContext.experienceLevel === 'junior' ||
            enrichedContext.experienceLevel === 'mid' ||
            enrichedContext.experienceLevel === 'senior' ||
            enrichedContext.experienceLevel === 'executive'
                ? enrichedContext.experienceLevel
                : 'mid';
        const context: InterviewContext = {
            targetRole: enrichedContext.targetRole || '',
            experienceLevel: normalizedExperience,
            ...enrichedContext,
        };

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
