import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public API - no authentication required
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const type = searchParams.get('type'); // 'free' | 'premium' | 'all'

        // Build where clause
        const where: any = {
            isActive: true,
        };

        if (type === 'premium') {
            where.isPremium = true;
        } else if (type === 'free') {
            where.isPremium = false;
        }

        // Get templates
        const templates = await prisma.template.findMany({
            where,
            orderBy: [
                { usageCount: 'desc' },
                { createdAt: 'desc' },
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                thumbnail: true,
                isPremium: true,
                usageCount: true,
                config: true,
                createdAt: true,
            },
        });

        // Transform templates for public consumption
        const publicTemplates = templates.map((t) => {
            const config = t.config as any;
            return {
                id: t.id,
                name: t.name,
                nameAr: config?.nameAr || t.name,
                slug: t.slug,
                description: t.description,
                descriptionAr: config?.descriptionAr || t.description,
                thumbnail: t.thumbnail,
                isPremium: t.isPremium,
                usageCount: t.usageCount,
                category: config?.category || 'general',
                layout: config?.layout || t.slug,
                defaultTheme: config?.defaultTheme || 'obsidian',
                features: config?.features || [],
            };
        });

        // Filter by category if specified
        let filteredTemplates = publicTemplates;
        if (category && category !== 'all') {
            filteredTemplates = publicTemplates.filter(
                (t) => t.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Get category counts
        const categories = [
            { id: 'all', name: 'All Templates', nameAr: 'جميع القوالب', count: publicTemplates.length },
            { id: 'corporate', name: 'Corporate', nameAr: 'شركات', count: publicTemplates.filter(t => t.category === 'corporate').length },
            { id: 'creative', name: 'Creative', nameAr: 'إبداعي', count: publicTemplates.filter(t => t.category === 'creative').length },
            { id: 'technical', name: 'Technical', nameAr: 'تقني', count: publicTemplates.filter(t => t.category === 'technical').length },
            { id: 'academic', name: 'Academic', nameAr: 'أكاديمي', count: publicTemplates.filter(t => t.category === 'academic').length },
        ].filter(c => c.id === 'all' || c.count > 0);

        // Stats
        const stats = {
            total: publicTemplates.length,
            free: publicTemplates.filter(t => !t.isPremium).length,
            premium: publicTemplates.filter(t => t.isPremium).length,
            totalUsage: publicTemplates.reduce((sum, t) => sum + t.usageCount, 0),
        };

        return NextResponse.json({
            templates: filteredTemplates,
            categories,
            stats,
        });
    } catch (error) {
        console.error('Public templates error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}
