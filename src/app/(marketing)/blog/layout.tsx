import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Career Blog — Resume Tips, Job Search Advice & More',
    description:
        'Expert resume writing tips, ATS optimization guides, job search strategies, and career advice for Arabic and English-speaking professionals. Learn how to get hired faster.',
    alternates: {
        canonical: '/blog',
    },
    openGraph: {
        title: 'Seera AI Career Blog — Resume Tips & Job Search Advice',
        description:
            'Expert resume writing tips, ATS guides, job search strategies, and career advice for professionals in Arabic and English.',
        url: '/blog',
        type: 'website',
    },
    twitter: {
        title: 'Seera AI Career Blog — Resume Tips & Job Search Advice',
        description:
            'Expert resume writing tips, ATS guides, and career advice for professionals in Arabic and English.',
    },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
