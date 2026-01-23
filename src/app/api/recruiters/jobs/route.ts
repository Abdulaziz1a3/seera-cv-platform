import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireEnterpriseRecruiter } from '@/lib/recruiter-auth';

const createSchema = z.object({
    title: z.string().min(2).max(120),
    location: z.string().optional().nullable(),
    remoteAllowed: z.boolean().optional().default(false),
    employmentType: z.string().optional().nullable(),
    seniority: z.string().optional().nullable(),
    salaryMin: z.number().int().optional().nullable(),
    salaryMax: z.number().int().optional().nullable(),
    jdText: z.string().min(20),
    status: z.enum(['DRAFT', 'ACTIVE']).optional().default('DRAFT'),
});

export async function GET() {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const jobs = await prisma.recruiterJob.findMany({
        where: { recruiterId: guard.userId },
        orderBy: { updatedAt: 'desc' },
        include: {
            analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, createdAt: true },
            },
            _count: {
                select: { recommendations: true },
            },
        },
    });

    return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
    const guard = await requireEnterpriseRecruiter();
    if (!guard.allowed) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    try {
        const body = await request.json();
        const data = createSchema.parse(body);

        const job = await prisma.recruiterJob.create({
            data: {
                recruiterId: guard.userId,
                title: data.title,
                location: data.location || null,
                remoteAllowed: data.remoteAllowed ?? false,
                employmentType: data.employmentType || null,
                seniority: data.seniority || null,
                salaryMin: data.salaryMin ?? null,
                salaryMax: data.salaryMax ?? null,
                jdText: data.jdText,
                status: data.status,
            },
        });

        return NextResponse.json({ job }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }
}
