import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors } from '@/lib/api-response';
import { hasActiveSubscription } from '@/lib/subscription';

// GET /api/resumes/[id]/export - Export resume data for subscribers
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return errors.unauthorized();
    }

    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
        return errors.subscriptionRequired('Resume export');
    }

    const resume = await prisma.resume.findFirst({
        where: {
            id: params.id,
            userId: session.user.id,
            deletedAt: null,
        },
        include: {
            sections: {
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!resume) {
        return errors.notFound('Resume');
    }

    const resumeData: any = {
        id: resume.id,
        title: resume.title,
        targetRole: resume.targetRole,
        language: resume.language,
        atsScore: resume.atsScore,
        template: resume.template,
        theme: resume.theme,
    };

    resume.sections.forEach((section) => {
        const key = section.type.toLowerCase();
        resumeData[key] = section.content;
    });

    return NextResponse.json(resumeData);
}
