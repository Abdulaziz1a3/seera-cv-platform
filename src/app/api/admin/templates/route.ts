import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || 'all';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (type === 'premium') {
            where.isPremium = true;
        } else if (type === 'free') {
            where.isPremium = false;
        }

        // Get templates
        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where,
                orderBy: { usageCount: 'desc' },
                skip,
                take: limit
            }),
            prisma.template.count({ where })
        ]);

        // Get stats
        const [totalTemplates, activeTemplates, premiumTemplates, totalUsage] = await Promise.all([
            prisma.template.count(),
            prisma.template.count({ where: { isActive: true } }),
            prisma.template.count({ where: { isPremium: true } }),
            prisma.template.aggregate({ _sum: { usageCount: true } })
        ]);

        return NextResponse.json({
            templates: templates.map(t => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                description: t.description,
                thumbnail: t.thumbnail,
                isPremium: t.isPremium,
                isActive: t.isActive,
                usageCount: t.usageCount,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
            })),
            stats: {
                total: totalTemplates,
                active: activeTemplates,
                premium: premiumTemplates,
                totalUsage: totalUsage._sum.usageCount || 0
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin templates error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, slug, description, thumbnail, config, styles, isPremium } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                name,
                slug,
                description,
                thumbnail,
                config: config || {},
                styles,
                isPremium: isPremium || false,
                isActive: true
            }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'template.create',
                entity: 'Template',
                entityId: template.id,
                details: { name, slug }
            }
        });

        return NextResponse.json({ success: true, template });
    } catch (error) {
        console.error('Create template error:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, action, data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'update':
                result = await prisma.template.update({
                    where: { id },
                    data: {
                        name: data.name,
                        description: data.description,
                        thumbnail: data.thumbnail,
                        config: data.config,
                        styles: data.styles,
                        isPremium: data.isPremium
                    }
                });
                break;

            case 'toggle_active':
                const template = await prisma.template.findUnique({ where: { id } });
                result = await prisma.template.update({
                    where: { id },
                    data: { isActive: !template?.isActive }
                });
                break;

            case 'delete':
                result = await prisma.template.delete({
                    where: { id }
                });
                break;

            case 'duplicate':
                const original = await prisma.template.findUnique({ where: { id } });
                if (!original) {
                    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
                }
                result = await prisma.template.create({
                    data: {
                        name: `${original.name} (Copy)`,
                        slug: `${original.slug}-copy-${Date.now()}`,
                        description: original.description,
                        thumbnail: original.thumbnail,
                        config: original.config as any,
                        styles: original.styles,
                        isPremium: original.isPremium,
                        isActive: false
                    }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `template.${action}`,
                entity: 'Template',
                entityId: id,
                details: { action, data }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Update template error:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}
