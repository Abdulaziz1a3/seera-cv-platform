import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { SkipLink } from '@/components/accessibility';

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
