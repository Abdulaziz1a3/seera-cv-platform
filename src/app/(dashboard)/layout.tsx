'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
    LayoutDashboard,
    FileText,
    Target,
    Brain,
    Compass,
    Settings,
    HelpCircle,
    Menu,
    ChevronLeft,
    Plus,
    Search,
    Moon,
    Sun,
    Bell,
    LogOut,
    User,
    PenTool,
    Crown,
    CreditCard,
    Lock,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/components/providers/locale-provider';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';
import { SkipLink } from '@/components/accessibility';
import { CreditsModal } from '@/components/credits-modal';
import { toast } from 'sonner';
import { formatOfficialPrice, getOfficialPlanPriceUsd } from '@/lib/billing-config';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { t, locale, dir } = useLocale();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [subscriptionState, setSubscriptionState] = useState<{
        isActive: boolean;
        status: string;
        plan: string;
    } | null>(null);
    const [creditsModalOpen, setCreditsModalOpen] = useState(false);
    const [creditsModalDetail, setCreditsModalDetail] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/api/billing/status')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!mounted || !data) return;
                setSubscriptionState({
                    isActive: Boolean(data.isActive),
                    status: data.status || 'UNPAID',
                    plan: data.plan || 'FREE',
                });
            })
            .catch(() => {
                if (!mounted) return;
                setSubscriptionState({ isActive: false, status: 'UNKNOWN', plan: 'FREE' });
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent).detail || null;
            setCreditsModalDetail(detail);
            setCreditsModalOpen(true);
        };
        window.addEventListener('ai-credits-exceeded', handler);
        return () => {
            window.removeEventListener('ai-credits-exceeded', handler);
        };
    }, []);

    const isSubscriptionActive = Boolean(subscriptionState?.isActive && subscriptionState?.plan !== 'FREE');
    const proMonthlyLabel = formatOfficialPrice(getOfficialPlanPriceUsd('pro', 'monthly'), locale);
    const proYearlyLabel = formatOfficialPrice(getOfficialPlanPriceUsd('pro', 'yearly'), locale);

    const billingHref = '/dashboard/billing';

    const baseNavigation = [
        { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard, isPro: false },
        { name: t.nav.myResumes, href: '/dashboard/resumes', icon: FileText, isPro: false },
        { name: t.nav.seeraLink, href: '/dashboard/seera-link', icon: PenTool, isPro: true },
        { name: locale === 'ar' ? 'تحضير المقابلة' : 'Interview Prep', href: '/dashboard/interview', icon: Brain, isPro: true },
        { name: locale === 'ar' ? 'GPS المهني' : 'Career GPS', href: '/dashboard/career', icon: Compass, isPro: true },
        { name: 'LinkedIn', href: '/dashboard/linkedin', icon: User, isPro: true },
        { name: t.nav.billing, href: billingHref, icon: CreditCard, isPro: false },
    ];

    const navigation = baseNavigation;

    const secondaryNav = [
        { name: t.nav.settings, href: '/dashboard/settings', icon: Settings },
        { name: t.nav.help, href: '/dashboard/help', icon: HelpCircle },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    const proRoutes = navigation.filter((item) => item.isPro).map((item) => item.href);
    const isProRoute = proRoutes.some((route) => pathname.startsWith(route));

    const userInitials = session?.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    const renderSidebarContent = ({
        collapsed,
        showCollapseToggle,
        onNavigate,
    }: {
        collapsed: boolean;
        showCollapseToggle: boolean;
        onNavigate?: () => void;
    }) => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 h-16 border-b shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="h-4.5 w-4.5 text-primary-foreground" style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Seera AI
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" onClick={onNavigate}>
                {navigation.map((item) => {
                    const isBillingLink = item.href === billingHref;
                    const isLocked = item.isPro && !isSubscriptionActive && !isBillingLink;
                    const href = isLocked ? billingHref : item.href;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            aria-disabled={isLocked}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                active
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : isLocked
                                    ? 'text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground cursor-not-allowed'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-primary-foreground' : ''}`} style={{ width: '1.125rem', height: '1.125rem' }} />
                            {!collapsed && (
                                <span className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="truncate">{item.name}</span>
                                    {item.isPro && !isSubscriptionActive && (
                                        isLocked ? (
                                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                                                PRO
                                            </Badge>
                                        )
                                    )}
                                    {item.isPro && isSubscriptionActive && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                                            PRO
                                        </Badge>
                                    )}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Upgrade prompt for free users (only when sidebar is expanded) */}
            {!collapsed && !isSubscriptionActive && (
                <div className="mx-2 mb-2 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:border-amber-800/30 dark:from-amber-950/30 dark:to-orange-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            {locale === 'ar' ? 'ترقية للـ Pro' : 'Upgrade to Pro'}
                        </span>
                    </div>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mb-3 leading-relaxed">
                        {locale === 'ar'
                            ? 'افتح جميع الميزات المتقدمة.'
                            : 'Unlock all advanced features.'}
                    </p>
                    <Link href="/dashboard/billing" onClick={onNavigate}>
                        <Button size="sm" className="w-full h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                            {locale === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                        </Button>
                    </Link>
                </div>
            )}

            {/* Secondary Nav */}
            <div className="p-2 border-t space-y-0.5" onClick={onNavigate}>
                {secondaryNav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isActive(item.href)
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                ))}
            </div>

            {/* Collapse Toggle */}
            {showCollapseToggle && (
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center justify-center gap-2 p-3 border-t text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50"
                >
                    <ChevronLeft
                        className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                    />
                    {!collapsed && (
                        <span className="text-sm">
                            {locale === 'ar' ? 'طي' : 'Collapse'}
                        </span>
                    )}
                </button>
            )}
        </>
    );

    return (
        <div className="flex min-h-[100dvh] bg-muted/30" dir={dir}>
            <SkipLink />

            {/* Sidebar */}
            <aside
                role="navigation"
                aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
                className={`hidden lg:flex flex-col bg-card border-e transition-all duration-300 ${
                    sidebarCollapsed ? 'w-[60px]' : 'w-64'
                }`}
            >
                {renderSidebarContent({
                    collapsed: sidebarCollapsed,
                    showCollapseToggle: true,
                })}
            </aside>

            {/* Mobile Sidebar */}
            {mobileNavOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileNavOpen(false)}
                        aria-hidden="true"
                    />
                    <aside
                        role="navigation"
                        aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
                        className="absolute inset-y-0 start-0 w-72 bg-card border-e shadow-2xl flex flex-col"
                    >
                        {renderSidebarContent({
                            collapsed: false,
                            showCollapseToggle: false,
                            onNavigate: () => setMobileNavOpen(false),
                        })}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top Header */}
                <header className="flex flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between bg-card border-b shrink-0">
                    {/* Left: Menu + Search */}
                    <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden shrink-0"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label={locale === 'ar' ? 'فتح القائمة' : 'Open menu'}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 sm:max-w-sm">
                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={`${t.common.search}...`}
                                    className="ps-10 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                        {/* New Resume Button */}
                        <Button asChild size="sm" className="w-full sm:w-auto shadow-sm bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                            <Link href="/dashboard/resumes/new">
                                <Plus className="h-4 w-4 me-1" />
                                {t.dashboard.newResume}
                            </Link>
                        </Button>

                        {/* Divider */}
                        <div className="hidden sm:block h-5 w-px bg-border" />

                        {/* Language Switcher */}
                        <LanguageSwitcher variant="dropdown" showLabel={false} />

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Bell className="h-4 w-4" />
                        </Button>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={session?.user?.image || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-xs font-semibold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel className="font-normal p-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={session?.user?.image || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-xs font-semibold">
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col space-y-0.5 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {session?.user?.name || 'User'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {session?.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    {isSubscriptionActive && (
                                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-900/20">
                                            <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Pro Plan</span>
                                        </div>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="cursor-pointer">
                                        <User className="h-4 w-4 me-2 text-muted-foreground" />
                                        {t.settings.tabs.profile}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/billing" className="cursor-pointer">
                                        <CreditCard className="h-4 w-4 me-2 text-muted-foreground" />
                                        {t.nav.billing}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4 me-2" />
                                    {t.nav.logout}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto p-4 sm:p-6"
                    tabIndex={-1}
                    role="main"
                    aria-label={locale === 'ar' ? 'المحتوى الرئيسي' : 'Main content'}
                >
                    <div className="relative min-h-[60vh]">
                        <div className={!isSubscriptionActive && isProRoute ? 'pointer-events-none opacity-40 blur-[2px]' : undefined}>
                            {children}
                        </div>

                        {!isSubscriptionActive && isProRoute && (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-2xl text-center ring-1 ring-primary/10">
                                    {/* Icon */}
                                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 ring-1 ring-amber-400/30">
                                        <Crown className="h-8 w-8 text-amber-500" />
                                    </div>

                                    <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                                        Pro Feature
                                    </Badge>

                                    <h2 className="text-xl font-bold mb-2">
                                        {locale === 'ar' ? 'اشترك لتفعيل الحساب' : 'Subscribe to Unlock'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                        {locale === 'ar'
                                            ? 'يلزم الاشتراك في برو لتفعيل جميع الميزات المتقدمة والوصول الكامل.'
                                            : 'A Pro subscription is required to unlock all advanced features and full platform access.'}
                                    </p>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Button
                                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
                                            onClick={async () => {
                                                const res = await fetch('/api/billing/checkout', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ plan: 'pro', interval: 'monthly' }),
                                                });
                                                const data = await res.json();
                                                if (data?.url) {
                                                    window.location.href = data.url;
                                                    return;
                                                }
                                                toast.error(data?.error || (locale === 'ar' ? 'تعذر بدء الدفع' : 'Failed to start payment'));
                                            }}
                                        >
                                            <span className="text-sm">
                                                {locale === 'ar' ? `شهري ${proMonthlyLabel}` : `Monthly ${proMonthlyLabel}`}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={async () => {
                                                const res = await fetch('/api/billing/checkout', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ plan: 'pro', interval: 'yearly' }),
                                                });
                                                const data = await res.json();
                                                if (data?.url) {
                                                    window.location.href = data.url;
                                                    return;
                                                }
                                                toast.error(data?.error || (locale === 'ar' ? 'تعذر بدء الدفع' : 'Failed to start payment'));
                                            }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm">
                                                    {locale === 'ar' ? `سنوي ${proYearlyLabel}` : `Yearly ${proYearlyLabel}`}
                                                </span>
                                                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                                    {locale === 'ar' ? 'وفّر ١٦٪' : 'Save 16%'}
                                                </span>
                                            </div>
                                        </Button>
                                    </div>

                                    <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                        <Lock className="h-3 w-3" />
                                        {locale === 'ar' ? 'إتمام شراء آمن عبر بوابة الدفع' : 'Secure checkout · Cancel anytime'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modals */}
            <CreditsModal
                isOpen={creditsModalOpen}
                onClose={() => setCreditsModalOpen(false)}
                initialCredits={creditsModalDetail}
            />
            <WelcomeModal />
        </div>
    );
}
