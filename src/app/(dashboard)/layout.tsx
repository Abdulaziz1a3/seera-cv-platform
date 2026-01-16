'use client';

import { useState } from 'react';
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

    const navigation = [
        { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard, isPro: false },
        { name: t.nav.myResumes, href: '/dashboard/resumes', icon: FileText, isPro: false },
        { name: locale === 'ar' ? 'GPS المهني' : 'Career GPS', href: '/dashboard/career', icon: Compass, isPro: true },
        { name: locale === 'ar' ? 'تحضير المقابلة' : 'Interview Prep', href: '/dashboard/interview', icon: Brain, isPro: true },
        { name: locale === 'ar' ? 'مجموعة المواهب' : 'Talent Pool', href: '/dashboard/talent-pool', icon: Users, isPro: false },
        { name: t.nav.seeraLink, href: '/dashboard/seera-link', icon: PenTool, isPro: false },
        { name: locale === 'ar' ? 'وضع التخفي' : 'Stealth Mode', href: '/dashboard/stealth', icon: Shield, isPro: true },
        { name: 'LinkedIn', href: '/dashboard/linkedin', icon: User, isPro: true },
    ];

    const secondaryNav = [
        { name: t.nav.settings, href: '/dashboard/settings', icon: Settings },
        { name: t.nav.help, href: '/dashboard/help', icon: HelpCircle },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    const userInitials = session?.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    return (
        <div className="flex h-screen bg-muted/30">
            <SkipLink />
            {/* Sidebar */}
            <aside
                role="navigation"
                aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
                className={`flex flex-col bg-card border-e transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-2 p-4 h-16 border-b">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-lg font-bold">Seera AI</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!sidebarCollapsed && (
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
                    ))}
                </nav>

                {/* Secondary Nav */}
                <div className="p-2 border-t space-y-1">
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
                            {!sidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center justify-center gap-2 p-3 border-t text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft
                        className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''
                            }`}
                    />
                    {!sidebarCollapsed && (
                        <span className="text-sm">
                            {locale === 'ar' ? 'طي' : 'Collapse'}
                        </span>
                    )}
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex items-center justify-between gap-4 px-6 h-16 bg-card border-b">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={`${t.common.search} ${t.nav.myResumes.toLowerCase()}, ${t.nav.applications.toLowerCase()}...`}
                                className="ps-10 bg-muted/50"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* New Resume Button */}
                        <Button asChild size="sm">
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
                                    <Link href="/dashboard/settings?tab=billing">
                                        <Settings className="h-4 w-4 me-2" />
                                        {t.settings.tabs.billing}
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
                    className="flex-1 overflow-y-auto p-6"
                    tabIndex={-1}
                    role="main"
                    aria-label={locale === 'ar' ? 'المحتوى الرئيسي' : 'Main content'}
                >
                    {children}
                </main>
            </div>

            {/* Onboarding Modal */}
            <WelcomeModal />
        </div>
    );
}
