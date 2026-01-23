import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';

const updateSchema = z.object({
    title: z.string().min(2).max(120).optional(),
    location: z.string().optional().nullable(),
    remoteAllowed: z.boolean().optional(),
    employmentType: z.string().optional().nullable(),
    seniority: z.string().optional().nullable(),
    salaryMin: z.number().int().optional().nullable(),
    salaryMax: z.number().int().optional().nullable(),
    jdText: z.string().min(20).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const job = await prisma.recruiterJob.findFirst({
        where: { id: params.id, recruiterId: guard.userId },
        include: {
            analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    createdAt: true,
                    mustHaveSkills: true,
                    niceToHaveSkills: true,
                    roleKeywords: true,
                    yearsExpMin: true,
                    yearsExpMax: true,
                    languages: true,
                    responsibilities: true,
                    summary: true,
                    requiredDegreeLevel: true,
                    preferredDegreeLevels: true,
                    requiredFieldsOfStudy: true,
                    preferredFieldsOfStudy: true,
                },
            },
            _count: {
                select: { recommendations: true },
            },
        },
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    try {
        const body = await request.json();
        const data = updateSchema.parse(body);

        const job = await prisma.recruiterJob.updateMany({
            where: { id: params.id, recruiterId: guard.userId },
            data: {
                title: data.title,
                location: data.location,
                remoteAllowed: data.remoteAllowed,
                employmentType: data.employmentType,
                seniority: data.seniority,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                jdText: data.jdText,
                status: data.status,
            },
        });

        if (job.count === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }
}
