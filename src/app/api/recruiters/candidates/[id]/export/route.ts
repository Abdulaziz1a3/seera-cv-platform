import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';
import { exportResume } from '@/lib/export/index';
import { createEmptyResume } from '@/lib/resume-schema';
import {
    buildResumeSnapshotFromSections,
    hasResumeContent,
    normalizeResumeSnapshot,
} from '@/lib/resume-snapshot';

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
            contact: true,
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
    const initialSnapshot =
        resumeSnapshot && Object.keys(resumeSnapshot).length > 0
            ? resumeSnapshot
            : fallbackSnapshot;
    let normalizedResume = normalizeResumeSnapshot(initialSnapshot, candidate.resume?.title);

    if (!hasResumeContent(normalizedResume) && fallbackSnapshot) {
        const fallbackNormalized = normalizeResumeSnapshot(fallbackSnapshot, candidate.resume?.title);
        if (hasResumeContent(fallbackNormalized)) {
            normalizedResume = fallbackNormalized;
        }
    }

    if (!hasResumeContent(normalizedResume)) {
        const latestResume = await prisma.resume.findFirst({
            where: { userId: candidate.userId, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
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
        });
        if (latestResume) {
            const latestSnapshot = latestResume.versions[0]?.snapshot as any;
            const latestFallback = buildResumeSnapshotFromSections(latestResume || undefined);
            const latestNormalized = normalizeResumeSnapshot(latestSnapshot, latestResume.title);
            const latestFallbackNormalized = latestFallback
                ? normalizeResumeSnapshot(latestFallback, latestResume.title)
                : null;
            if (hasResumeContent(latestNormalized)) {
                normalizedResume = latestNormalized;
            } else if (hasResumeContent(latestFallbackNormalized)) {
                normalizedResume = latestFallbackNormalized;
            }
        }
    }

    if (!hasResumeContent(normalizedResume)) {
        return NextResponse.json({ error: 'Resume data not available yet' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'docx').toLowerCase();
    if (format !== 'docx' && format !== 'txt') {
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    }

    const baseResume = createEmptyResume(candidate.resume?.title || 'Resume');
    const resumeForExport = normalizedResume || baseResume;
    const exportPayload = {
        ...baseResume,
        ...resumeForExport,
        contact: {
            ...baseResume.contact,
            ...resumeForExport.contact,
            fullName: candidate.contact?.fullName || resumeForExport.contact.fullName || baseResume.contact.fullName,
            email: candidate.contact?.email || resumeForExport.contact.email || baseResume.contact.email,
            phone: candidate.contact?.phone || resumeForExport.contact.phone || baseResume.contact.phone,
            location: candidate.contact?.location || resumeForExport.contact.location || baseResume.contact.location,
            linkedin: candidate.contact?.linkedinUrl || resumeForExport.contact.linkedin || baseResume.contact.linkedin,
            website: candidate.contact?.websiteUrl || resumeForExport.contact.website || baseResume.contact.website,
        },
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
