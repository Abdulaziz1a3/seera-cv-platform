import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { lintResume } from '@/lib/ats-linter';

// Valid template and theme options
const VALID_TEMPLATES = [
    'prestige-executive',
    'metropolitan-split',
    'nordic-minimal',
    'classic-professional',
    'impact-modern',
] as const;

const VALID_THEMES = [
    'obsidian',
    'sapphire',
    'emerald',
    'ruby',
    'amber',
    'slate',
] as const;

// GET /api/resumes/[id] - Get a specific resume
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // Transform sections into resume schema format
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
    } catch (error) {
        console.error('Get resume error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resume' },
            { status: 500 }
        );
    }
}

// PATCH /api/resumes/[id] - Update a resume
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
                deletedAt: null,
            },
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const body = await request.json();
        const { title, targetRole, contact, summary, experience, education, skills, projects, certifications, languages, template, theme, ...otherSections } = body;

        // Validate template and theme if provided
        if (template && !VALID_TEMPLATES.includes(template)) {
            return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
        }
        if (theme && !VALID_THEMES.includes(theme)) {
            return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
        }

        // Calculate ATS score
        const lintResult = lintResume(body, (resume.language || 'en') as 'ar' | 'en');

        const sectionUpdates = [
            { type: 'CONTACT', content: contact },
            { type: 'SUMMARY', content: summary },
            { type: 'EXPERIENCE', content: experience },
            { type: 'EDUCATION', content: education },
            { type: 'SKILLS', content: skills },
            { type: 'PROJECTS', content: projects },
            { type: 'CERTIFICATIONS', content: certifications },
            { type: 'LANGUAGES', content: languages },
        ];

        await prisma.$transaction(async (tx) => {
            await tx.resume.update({
                where: { id: params.id },
                data: {
                    title: title || resume.title,
                    targetRole: targetRole || resume.targetRole,
                    template: template || resume.template,
                    theme: theme || resume.theme,
                    atsScore: lintResult.score,
                    updatedAt: new Date(),
                },
            });

            for (const update of sectionUpdates) {
                if (update.content !== undefined) {
                    await tx.resumeSection.updateMany({
                        where: {
                            resumeId: params.id,
                            type: update.type as any,
                        },
                        data: {
                            content: update.content,
                        },
                    });
                }
            }

            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE_RESUME',
                    entity: 'Resume',
                    entityId: params.id,
                },
            });
        });

        return NextResponse.json({
            success: true,
            atsScore: lintResult.score,
        });
    } catch (error) {
        console.error('Update resume error:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const code = error.code;
            const message = code === 'P2022'
                ? 'Database schema is missing required columns. Please run migrations.'
                : code === 'P2021'
                    ? 'Database schema is missing required tables. Please run migrations.'
                    : 'Database error while updating resume.';
            return NextResponse.json({ error: message }, { status: 500 });
        }

        if (error instanceof Error && error.message) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }
}

// DELETE /api/resumes/[id] - Soft delete a resume
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
                deletedAt: null,
            },
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // Soft delete
        await prisma.resume.update({
            where: { id: params.id },
            data: { deletedAt: new Date() },
        });

        // Log deletion
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'DELETE_RESUME',
                entity: 'Resume',
                entityId: params.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete resume error:', error);
        return NextResponse.json(
            { error: 'Failed to delete resume' },
            { status: 500 }
        );
    }
}
