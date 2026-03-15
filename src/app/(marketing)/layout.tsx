import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { SkipLink } from '@/components/accessibility';

// Default metadata for the landing page (child routes override with their own layout)
export const metadata: Metadata = {
    title: 'Seera AI — AI Resume Builder for Arabic & English Job Seekers',
    description:
        'Build a standout, ATS-optimized resume in minutes with Seera AI. Choose from 10+ professional templates, get AI-powered writing assistance, and export in Arabic or English. Trusted by 5,000+ job seekers in Saudi Arabia and across the Arab world.',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Seera AI — AI Resume Builder for Arabic & English Job Seekers',
        description:
            'Build a standout, ATS-optimized resume in minutes. 10+ professional templates, AI writing assistance, Arabic + English support with RTL layout.',
        url: '/',
    },
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <SkipLink />
            <MarketingHeader />
            <main id="main-content" className="flex-1 pt-16" tabIndex={-1}>
                {children}
            </main>
            <MarketingFooter />
        </div>
    );
}
