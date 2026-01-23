import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { exportResume } from '@/lib/export';
import { createEmptyResume } from '@/lib/resume-schema';

function buildResumeSnapshotFromSections(resume?: {
    title?: string | null;
    language?: string | null;
    template?: string | null;
    theme?: string | null;
    fontFamily?: string | null;
    targetRole?: string | null;
    sections?: Array<{ type: string; content: any }>;
}) {
    if (!resume?.sections?.length) return null;
    const snapshot: Record<string, any> = {
        title: resume.title || undefined,
        language: resume.language || undefined,
        template: resume.template || undefined,
        theme: resume.theme || undefined,
        fontFamily: resume.fontFamily || undefined,
        targetRole: resume.targetRole || undefined,
    };
    resume.sections.forEach((section) => {
        snapshot[section.type.toLowerCase()] = section.content;
    });
    return snapshot;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    if (!guard.userId) {
        return NextResponse.json({ error: 'Recruiter not found' }, { status: 401 });
    }

    const candidate = await prisma.talentProfile.findUnique({
        where: { id: params.id },
        include: {
            resume: {
                include: {
                    versions: {
                        orderBy: { version: 'desc' },
                        take: 1,
                        select: { snapshot: true },
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        select: { type: true, content: true },
                    },
                },
            },
        },
    });

    if (!candidate || !candidate.isVisible) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const unlock = await prisma.cvUnlock.findUnique({
        where: {
            recruiterId_candidateId: {
                recruiterId: guard.userId,
                candidateId: candidate.id,
            },
        },
    });

    if (!unlock) {
        return NextResponse.json({ error: 'Unlock required' }, { status: 402 });
    }

    const resumeSnapshot = candidate.resume?.versions[0]?.snapshot as any;
    const fallbackSnapshot = buildResumeSnapshotFromSections(candidate.resume || undefined);
    const snapshot =
        resumeSnapshot && Object.keys(resumeSnapshot).length > 0
            ? resumeSnapshot
            : fallbackSnapshot;

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'docx').toLowerCase();
    if (format !== 'docx' && format !== 'txt') {
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    }

    const baseResume = createEmptyResume(candidate.resume?.title || 'Resume');
    const exportPayload = {
        ...baseResume,
        ...snapshot,
        language: snapshot?.language || baseResume.language,
        template: snapshot?.template || baseResume.template,
        contact: snapshot?.contact || baseResume.contact,
    };

    const exportResult = await exportResume(exportPayload, format as 'docx' | 'txt', exportPayload.template);
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
