import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description:
        'Read the Seera AI Terms of Service. Understand your rights and responsibilities when using our AI resume builder platform.',
    alternates: {
        canonical: '/terms',
    },
    robots: {
        index: true,
        follow: false,
    },
    openGraph: {
        title: 'Seera AI Terms of Service',
        description: 'Read the Seera AI Terms of Service and usage policies.',
        url: '/terms',
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
