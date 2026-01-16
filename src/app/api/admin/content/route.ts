import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ContentType = 'blog' | 'faq' | 'help';

const toSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { session };
}

export async function GET(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'blog') as ContentType;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    if (type === 'blog') {
        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.blogPost.count({ where }),
        ]);

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }

    const where: any = {};
    if (type === 'faq') {
        where.category = { equals: 'FAQ', mode: 'insensitive' };
    }
    if (type === 'help' && searchParams.get('category')) {
        where.category = searchParams.get('category');
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.knowledgeBaseArticle.findMany({
            where,
            orderBy: [{ category: 'asc' }, { order: 'asc' }, { updatedAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return NextResponse.json({
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function POST(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const type = body.type as ContentType;
    const data = body.data || {};

    if (!type || !data.title) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'blog') {
        const slug = data.slug ? toSlug(data.slug) : toSlug(data.title);
        const existing = await prisma.blogPost.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        }

        const post = await prisma.blogPost.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt || null,
                content: data.content || '',
                coverImage: data.coverImage || null,
                metaTitle: data.metaTitle || null,
                metaDescription: data.metaDescription || null,
                status: data.status || 'DRAFT',
                publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
                authorId: session?.user?.id || null,
                authorName: session?.user?.name || session?.user?.email || null,
                category: data.category || null,
                tags: Array.isArray(data.tags) ? data.tags : [],
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: session?.user?.id || null,
                action: 'content.create',
                entity: 'BlogPost',
                entityId: post.id,
                details: { title: post.title },
            },
        });

        return NextResponse.json({ success: true, item: post });
    }

    const slug = data.slug ? toSlug(data.slug) : toSlug(data.title);
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { slug } });
    if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const article = await prisma.knowledgeBaseArticle.create({
        data: {
            title: data.title,
            slug,
            content: data.content || '',
            category: type === 'faq' ? 'FAQ' : (data.category || 'General'),
            order: data.order ?? 0,
            isPublished: data.isPublished ?? true,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: session?.user?.id || null,
            action: 'content.create',
            entity: 'KnowledgeBaseArticle',
            entityId: article.id,
            details: { title: article.title, category: article.category },
        },
    });

    return NextResponse.json({ success: true, item: article });
}

export async function PUT(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const type = body.type as ContentType;
    const id = body.id as string;
    const data = body.data || {};

    if (!type || !id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'blog') {
        const update: any = {
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            coverImage: data.coverImage,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            category: data.category,
            tags: Array.isArray(data.tags) ? data.tags : undefined,
        };

        if (data.slug) {
            update.slug = toSlug(data.slug);
        }

        if (data.status) {
            update.status = data.status;
            if (data.status === 'PUBLISHED' && !data.publishedAt) {
                update.publishedAt = new Date();
            }
            if (data.status !== 'PUBLISHED') {
                update.publishedAt = null;
            }
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: update,
        });

        await prisma.auditLog.create({
            data: {
                userId: session?.user?.id || null,
                action: 'content.update',
                entity: 'BlogPost',
                entityId: post.id,
                details: { title: post.title },
            },
        });

        return NextResponse.json({ success: true, item: post });
    }

    const update: any = {
        title: data.title,
        content: data.content,
        category: data.category,
        order: data.order,
        isPublished: data.isPublished,
    };
    if (data.slug) {
        update.slug = toSlug(data.slug);
    }

    const article = await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: update,
    });

    await prisma.auditLog.create({
        data: {
            userId: session?.user?.id || null,
            action: 'content.update',
            entity: 'KnowledgeBaseArticle',
            entityId: article.id,
            details: { title: article.title, category: article.category },
        },
    });

    return NextResponse.json({ success: true, item: article });
}

export async function DELETE(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const type = body.type as ContentType;
    const id = body.id as string;

    if (!type || !id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'blog') {
        const post = await prisma.blogPost.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                userId: session?.user?.id || null,
                action: 'content.delete',
                entity: 'BlogPost',
                entityId: id,
                details: { title: post.title },
            },
        });
        return NextResponse.json({ success: true });
    }

    const article = await prisma.knowledgeBaseArticle.delete({ where: { id } });
    await prisma.auditLog.create({
        data: {
            userId: session?.user?.id || null,
            action: 'content.delete',
            entity: 'KnowledgeBaseArticle',
            entityId: id,
            details: { title: article.title, category: article.category },
        },
    });

    return NextResponse.json({ success: true });
}
