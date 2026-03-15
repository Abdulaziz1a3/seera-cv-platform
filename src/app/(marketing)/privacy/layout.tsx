import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'Read the Seera AI Privacy Policy. Learn how we collect, use, and protect your personal information when you use our AI resume builder.',
    alternates: {
        canonical: '/privacy',
    },
    robots: {
        index: true,
        follow: false,
    },
    openGraph: {
        title: 'Seera AI Privacy Policy',
        description: 'Learn how Seera AI collects, uses, and protects your personal information.',
        url: '/privacy',
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
