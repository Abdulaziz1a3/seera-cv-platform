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
    Users,
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
    Shield,
    Crown,
    CreditCard,
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

    const billingHref = '/dashboard/billing';

    const navigation = [
        { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard, isPro: false },
        { name: t.nav.myResumes, href: '/dashboard/resumes', icon: FileText, isPro: false },
        { name: t.nav.seeraLink, href: '/dashboard/seera-link', icon: PenTool, isPro: true },
        { name: locale === 'ar' ? 'تحضير المقابلة' : 'Interview Prep', href: '/dashboard/interview', icon: Brain, isPro: true },
        { name: locale === 'ar' ? 'GPS المهني' : 'Career GPS', href: '/dashboard/career', icon: Compass, isPro: true },
        { name: 'LinkedIn', href: '/dashboard/linkedin', icon: User, isPro: true },
        { name: locale === 'ar' ? 'مجموعة المواهب' : 'Talent Pool', href: '/dashboard/talent-pool', icon: Users, isPro: true },
        { name: locale === 'ar' ? 'وضع التخفي' : 'Stealth Mode', href: '/dashboard/stealth', icon: Shield, isPro: true },
        { name: t.nav.billing, href: billingHref, icon: CreditCard, isPro: false },
    ];

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
            <div className="flex items-center gap-2 p-4 h-16 border-b">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold">Seera AI</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto" onClick={onNavigate}>
                {navigation.map((item) => {
                    const isBillingLink = item.href === billingHref;
                    const isLocked = item.isPro && !isSubscriptionActive && !isBillingLink;
                    const href = isLocked ? billingHref : item.href;

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            aria-disabled={isLocked}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="flex items-center gap-2 flex-1">
                                    {item.name}
                                    {item.isPro && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            PRO
                                        </Badge>
                                    )}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Secondary Nav */}
            <div className="p-2 border-t space-y-1" onClick={onNavigate}>
                {secondaryNav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                ))}
            </div>

            {/* Collapse Toggle */}
            {showCollapseToggle && (
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center justify-center gap-2 p-3 border-t text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft
                        className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''
                            }`}
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
        <div className="flex min-h-[100dvh] bg-muted/30">
            <SkipLink />
            {/* Sidebar */}
            <aside
                role="navigation"
                aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
                className={`hidden lg:flex flex-col bg-card border-e transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
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
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileNavOpen(false)}
                        aria-hidden="true"
                    />
                    <aside
                        role="navigation"
                        aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
                        className="absolute inset-y-0 start-0 w-72 bg-card border-e shadow-xl flex flex-col"
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between bg-card border-b">
                    {/* Search */}
                    <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileNavOpen(true)}
                            aria-label={locale === 'ar' ? 'فتح القائمة' : 'Open menu'}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 sm:max-w-md">
                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={`${t.common.search} ${t.nav.myResumes.toLowerCase()}, ${t.nav.applications.toLowerCase()}...`}
                                    className="ps-10 bg-muted/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                        {/* New Resume Button */}
                        <Button asChild size="sm" className="w-full sm:w-auto">
                            <Link href="/dashboard/resumes/new">
                                <Plus className="h-4 w-4 me-1" />
                                {t.dashboard.newResume}
                            </Link>
                        </Button>

                        {/* Language Switcher */}
                        <LanguageSwitcher variant="dropdown" showLabel={false} />

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>

                        {/* Notifications */}
                        <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                        </Button>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={session?.user?.image || undefined} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">
                                            {session?.user?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {session?.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings">
                                        <User className="h-4 w-4 me-2" />
                                        {t.settings.tabs.profile}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/billing">
                                        <Settings className="h-4 w-4 me-2" />
                                        {t.nav.billing}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-destructive"
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
                        <div className={!isSubscriptionActive && isProRoute ? 'pointer-events-none opacity-50' : undefined}>
                            {children}
                        </div>
                        {!isSubscriptionActive && isProRoute && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="max-w-md w-full rounded-2xl border bg-card p-6 shadow-xl text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                                        <Crown className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-semibold">
                                        {locale === 'ar' ? 'اشترك لتفعيل الحساب' : 'Subscribe to activate your account'}
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {locale === 'ar'
                                            ? 'يلزم الاشتراك في برو أو المؤسسات لتفعيل جميع الميزات.'
                                            : 'A Pro or Enterprise subscription is required to unlock all features.'}
                                    </p>
                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <Button
                                            className="w-full"
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
                                            {locale === 'ar' ? 'برو شهري' : 'Pro Monthly'}
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
                                            {locale === 'ar' ? 'برو سنوي' : 'Pro Yearly'}
                                        </Button>
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {locale === 'ar' ? 'الدفع آمن عبر TuwaiqPay' : 'Secure payment via TuwaiqPay'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Onboarding Modal */}
            <CreditsModal
                isOpen={creditsModalOpen}
                onClose={() => setCreditsModalOpen(false)}
                initialCredits={creditsModalDetail}
            />
            <WelcomeModal />
        </div>
    );
}
