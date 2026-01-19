import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors } from '@/lib/api-response';
import { hasActiveSubscription } from '@/lib/subscription';
import { exportResume } from '@/lib/export/index';
import { createEmptyResume } from '@/lib/resume-schema';

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
        fontFamily: resume.fontFamily,
    };

    resume.sections.forEach((section) => {
        const key = section.type.toLowerCase();
        resumeData[key] = section.content;
    });

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();

    if (format === 'json') {
        return NextResponse.json(resumeData);
    }

    if (format === 'docx' || format === 'txt') {
        const baseResume = createEmptyResume(resume.title);
        const exportPayload = {
            ...baseResume,
            ...resumeData,
            language: resumeData.language || baseResume.language,
            template: resumeData.template || baseResume.template,
            contact: resumeData.contact || baseResume.contact,
        };

        const exportResult = await exportResume(exportPayload, format as 'docx' | 'txt');
        const body =
            typeof exportResult.data === 'string'
                ? exportResult.data
                : new Uint8Array(exportResult.data);
        const byteLength =
            typeof exportResult.data === 'string'
                ? Buffer.byteLength(exportResult.data, 'utf-8')
                : exportResult.data.length;

        return new NextResponse(body, {
            headers: {
                'Content-Type': exportResult.contentType,
                'Content-Disposition': `attachment; filename="${exportResult.fileName}"`,
                'Content-Length': byteLength.toString(),
            },
        });
    }

    return NextResponse.json(
        { error: 'Unsupported export format' },
        { status: 400 }
    );
}
