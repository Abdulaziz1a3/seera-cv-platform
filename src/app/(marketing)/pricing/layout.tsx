import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing — Simple, Transparent Plans',
    description:
        'Start free and upgrade when you need more. Seera AI Pro unlocks 10+ premium resume templates, unlimited AI credits, priority support, and advanced export options. Cancel anytime.',
    alternates: {
        canonical: '/pricing',
    },
    openGraph: {
        title: 'Seera AI Pricing — Simple, Transparent Plans',
        description:
            'Start free. Upgrade to Pro for 10+ premium templates, unlimited AI credits, and priority support. Cancel anytime.',
        url: '/pricing',
    },
    twitter: {
        title: 'Seera AI Pricing — Simple, Transparent Plans',
        description:
            'Start free. Upgrade to Pro for 10+ premium templates, unlimited AI credits, and priority support.',
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
