import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seera-ai.com';

// Static blog slugs — update when new posts are added
const BLOG_SLUGS = [
    'how-to-write-ats-friendly-resume',
    'arabic-resume-tips',
    'resume-mistakes-to-avoid',
    'how-to-use-linkedin',
    'salary-negotiation-tips',
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: APP_URL,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${APP_URL}/pricing`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${APP_URL}/blog`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${APP_URL}/help`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${APP_URL}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${APP_URL}/login`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${APP_URL}/register`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${APP_URL}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.2,
        },
        {
            url: `${APP_URL}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.2,
        },
    ];

    const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
        url: `${APP_URL}/blog/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
}
