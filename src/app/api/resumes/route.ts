import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createEmptyResume } from '@/lib/resume-schema';

const createResumeSchema = z.object({
    title: z.string().min(1).max(100),
    targetRole: z.string().max(100).optional(),
    language: z.enum(['en', 'ar']).default('en'),
    template: z.string().default('prestige-executive'),
    theme: z.string().optional(),
});

// GET /api/resumes - Get all resumes for the current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resumes = await prisma.resume.findMany({
            where: {
                userId: session.user.id,
                deletedAt: null,
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { versions: true, exports: true },
                },
            },
        });

        return NextResponse.json(resumes);
    } catch (error) {
        console.error('Get resumes error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resumes' },
            { status: 500 }
        );
    }
}

// POST /api/resumes - Create a new resume
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = createResumeSchema.parse(body);

        // Check resume limit for free users
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        if (subscription?.plan === 'FREE') {
            const resumeCount = await prisma.resume.count({
                where: { userId: session.user.id, deletedAt: null },
            });

            if (resumeCount >= 1) {
                return NextResponse.json(
                    { error: 'Free plan allows only 1 resume. Upgrade to create more.' },
                    { status: 403 }
                );
            }
        }

        // Create empty resume structure
        const emptyResume = createEmptyResume(data.title);

        // Create resume in database
        const resume = await prisma.resume.create({
            data: {
                userId: session.user.id,
                title: data.title,
                targetRole: data.targetRole,
                language: data.language,
                template: data.template,
                theme: data.theme || 'obsidian',
                sections: {
                    create: [
                        {
                            type: 'CONTACT',
                            title: data.language === 'ar' ? 'معلومات الاتصال' : 'Contact Information',
                            order: 0,
                            content: emptyResume.contact,
                        },
                        {
                            type: 'SUMMARY',
                            title: data.language === 'ar' ? 'الملخص المهني' : 'Professional Summary',
                            order: 1,
                            content: { content: '' },
                        },
                        {
                            type: 'EXPERIENCE',
                            title: data.language === 'ar' ? 'الخبرة العملية' : 'Experience',
                            order: 2,
                            content: { items: [] },
                        },
                        {
                            type: 'EDUCATION',
                            title: data.language === 'ar' ? 'التعليم' : 'Education',
                            order: 3,
                            content: { items: [] },
                        },
                        {
                            type: 'SKILLS',
                            title: data.language === 'ar' ? 'المهارات' : 'Skills',
                            order: 4,
                            content: { categories: [], simpleList: [] },
                        },
                        {
                            type: 'PROJECTS',
                            title: data.language === 'ar' ? 'المشاريع' : 'Projects',
                            order: 5,
                            content: { items: [] },
                        },
                        {
                            type: 'CERTIFICATIONS',
                            title: data.language === 'ar' ? 'الشهادات' : 'Certifications',
                            order: 6,
                            content: { items: [] },
                        },
                        {
                            type: 'LANGUAGES',
                            title: data.language === 'ar' ? 'اللغات' : 'Languages',
                            order: 7,
                            content: { items: [] },
                        },
                    ],
                },
                versions: {
                    create: {
                        version: 1,
                        name: 'Initial version',
                        snapshot: emptyResume,
                    },
                },
            },
        });

        // Log creation
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_RESUME',
                entity: 'Resume',
                entityId: resume.id,
            },
        });

        // Track usage
        await prisma.usageRecord.create({
            data: {
                userId: session.user.id,
                type: 'RESUME_CREATE',
            },
        });

        return NextResponse.json({ id: resume.id }, { status: 201 });
    } catch (error) {
        console.error('Create resume error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create resume' },
            { status: 500 }
        );
    }
}
