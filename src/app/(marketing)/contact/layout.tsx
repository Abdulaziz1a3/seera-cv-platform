import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us — We\'re Here to Help',
    description:
        'Get in touch with the Seera AI team. We\'re happy to help with any questions about our resume builder, billing, technical issues, or partnership inquiries.',
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        title: 'Contact Seera AI — We\'re Here to Help',
        description:
            'Get in touch with the Seera AI team for support, billing questions, or partnership inquiries.',
        url: '/contact',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
