import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Help Center — Guides & FAQs',
    description:
        'Find answers to common questions about Seera AI. Learn how to build a resume, use AI suggestions, export to PDF, switch templates, manage your account, and more.',
    alternates: {
        canonical: '/help',
    },
    openGraph: {
        title: 'Seera AI Help Center — Guides & FAQs',
        description:
            'Find answers to common questions. Learn how to build a resume, use AI, export to PDF, and manage your account.',
        url: '/help',
    },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
