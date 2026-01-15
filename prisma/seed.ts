import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Seed Templates
    const templates = [
        {
            name: 'The Executive',
            nameAr: 'التنفيذي',
            slug: 'executive',
            description: 'Classic serif, gold-standard design. Best for Management and C-level positions.',
            descriptionAr: 'كلاسيكي بخط مميز، المعيار الذهبي للإدارة والمناصب القيادية.',
            thumbnail: '/templates/executive-preview.png',
            isPremium: true,
            category: 'corporate',
            config: {
                layout: 'executive',
                defaultTheme: 'obsidian',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['gold-accents', 'centered-layout', 'serif-headings', 'elegant-dividers'],
            },
        },
        {
            name: 'The Modern',
            nameAr: 'العصري',
            slug: 'modern',
            description: 'Clean, sidebar-based layout. Best for Tech, Engineering, and IT roles.',
            descriptionAr: 'نظيف، شريط جانبي. مثالي للتقنية والهندسة وتكنولوجيا المعلومات.',
            thumbnail: '/templates/modern-preview.png',
            isPremium: false,
            category: 'technical',
            config: {
                layout: 'modern',
                defaultTheme: 'oceanic',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['two-column', 'sidebar', 'skill-pills', 'accent-colors'],
            },
        },
        {
            name: 'The Professional',
            nameAr: 'الاحترافي',
            slug: 'professional',
            description: 'Balanced, information-dense design. Best for Business and Finance.',
            descriptionAr: 'متوازن، معلومات مكثفة. مثالي للأعمال والمالية.',
            thumbnail: '/templates/professional-preview.png',
            isPremium: false,
            category: 'corporate',
            config: {
                layout: 'professional',
                defaultTheme: 'slate',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['classic-layout', 'dense-info', 'accent-lines', 'structured-sections'],
            },
        },
        {
            name: 'The Creative',
            nameAr: 'الإبداعي',
            slug: 'creative',
            description: 'Bold headers, unique shapes. Best for Design, Marketing, and Media.',
            descriptionAr: 'ترويس عريض، أشكال فريدة. مثالي للتصميم والتسويق والإعلام.',
            thumbnail: '/templates/creative-preview.png',
            isPremium: true,
            category: 'creative',
            config: {
                layout: 'creative',
                defaultTheme: 'amethyst',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['color-blocks', 'geometric-shapes', 'skill-tags', 'modern-headers'],
            },
        },
        {
            name: 'The Minimalist',
            nameAr: 'البسيط',
            slug: 'minimalist',
            description: 'Ultra-clean, whitespace-heavy. Best for Architecture, Academia, and Research.',
            descriptionAr: 'نظيف جداً، مساحات بيضاء. مثالي للعمارة والأكاديميا والبحث.',
            thumbnail: '/templates/minimalist-preview.png',
            isPremium: false,
            category: 'academic',
            config: {
                layout: 'minimalist',
                defaultTheme: 'slate',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['maximum-whitespace', 'large-typography', 'thin-dividers', 'clean-sections'],
            },
        },
        {
            name: 'The Startup',
            nameAr: 'الريادي',
            slug: 'startup',
            description: 'Skills-forward, high-impact design. Best for Freelancers, Consultants, and Entrepreneurs.',
            descriptionAr: 'التركيز على المهارات، تأثير عالي. مثالي للمستقلين والمستشارين ورواد الأعمال.',
            thumbnail: '/templates/startup-preview.png',
            isPremium: true,
            category: 'creative',
            config: {
                layout: 'startup',
                defaultTheme: 'oceanic',
                supportedThemes: ['obsidian', 'oceanic', 'emerald', 'amethyst', 'slate'],
                features: ['skills-first', 'massive-typography', 'two-column-split', 'high-impact'],
            },
        },
    ];

    console.log('📝 Seeding templates...');

    for (const template of templates) {
        const existing = await prisma.template.findUnique({
            where: { slug: template.slug },
        });

        if (existing) {
            // Update existing template
            await prisma.template.update({
                where: { slug: template.slug },
                data: {
                    name: template.name,
                    description: template.description,
                    thumbnail: template.thumbnail,
                    isPremium: template.isPremium,
                    config: {
                        ...template.config,
                        nameAr: template.nameAr,
                        descriptionAr: template.descriptionAr,
                        category: template.category,
                    },
                    isActive: true,
                },
            });
            console.log(`  ✓ Updated template: ${template.name}`);
        } else {
            // Create new template
            await prisma.template.create({
                data: {
                    name: template.name,
                    slug: template.slug,
                    description: template.description,
                    thumbnail: template.thumbnail,
                    isPremium: template.isPremium,
                    config: {
                        ...template.config,
                        nameAr: template.nameAr,
                        descriptionAr: template.descriptionAr,
                        category: template.category,
                    },
                    isActive: true,
                    usageCount: 0,
                },
            });
            console.log(`  ✓ Created template: ${template.name}`);
        }
    }

    // Seed Feature Flags (optional defaults)
    const featureFlags = [
        {
            key: 'ai_resume_generation',
            name: 'AI Resume Generation',
            description: 'Enable AI-powered resume content generation',
            enabled: true,
            percentage: 100,
        },
        {
            key: 'premium_templates',
            name: 'Premium Templates',
            description: 'Enable premium template features',
            enabled: true,
            percentage: 100,
        },
        {
            key: 'export_docx',
            name: 'DOCX Export',
            description: 'Enable Word document export feature',
            enabled: true,
            percentage: 100,
        },
        {
            key: 'analytics_dashboard',
            name: 'Analytics Dashboard',
            description: 'Enable user analytics in dashboard',
            enabled: true,
            percentage: 100,
        },
    ];

    console.log('🚩 Seeding feature flags...');

    for (const flag of featureFlags) {
        const existing = await prisma.featureFlag.findUnique({
            where: { key: flag.key },
        });

        if (!existing) {
            await prisma.featureFlag.create({
                data: flag,
            });
            console.log(`  ✓ Created feature flag: ${flag.name}`);
        } else {
            console.log(`  - Skipped existing flag: ${flag.name}`);
        }
    }

    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
