import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
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
                    sections: {
                        orderBy: { order: 'asc' },
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

    let resume: typeof candidate.resume | null = candidate.resume ?? null;
    if (!resume) {
        resume = await prisma.resume.findFirst({
            where: { userId: candidate.userId, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    if (!resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeData: Record<string, unknown> = {
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

    if (candidate.contact) {
        const existingContact = (resumeData.contact as Record<string, unknown>) || {};
        resumeData.contact = {
            ...existingContact,
            fullName: candidate.contact.fullName ?? existingContact.fullName,
            email: candidate.contact.email ?? existingContact.email,
            phone: candidate.contact.phone ?? existingContact.phone,
            location: candidate.contact.location ?? existingContact.location,
            linkedin: candidate.contact.linkedinUrl ?? existingContact.linkedin,
            website: candidate.contact.websiteUrl ?? existingContact.website,
        };
    }

    try {
        await prisma.talentProfileDownload.createMany({
            data: [{ recruiterId: guard.userId, candidateId: candidate.id }],
            skipDuplicates: true,
        });
    } catch (error) {
        console.error('Failed to record talent profile download:', error);
    }

    return NextResponse.json({ data: resumeData });
}
