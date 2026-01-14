'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useLocale } from '@/components/providers/locale-provider';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
    LayoutDashboard,
    Users,
    FileText,
    Palette,
    Settings,
    BarChart3,
    Bell,
    Search,
    Menu,
    ChevronLeft,
    Shield,
    CreditCard,
    MessageSquare,
    Flag,
    LogOut,
} from 'lucide-react';

const adminNavItems = [
    {
        href: '/admin',
        icon: LayoutDashboard,
        label: { en: 'Dashboard', ar: 'لوحة التحكم' },
    },
    {
        href: '/admin/users',
        icon: Users,
        label: { en: 'Users', ar: 'المستخدمين' },
    },
    {
        href: '/admin/templates',
        icon: Palette,
        label: { en: 'Templates', ar: 'القوالب' },
    },
    {
        href: '/admin/content',
        icon: FileText,
        label: { en: 'Content', ar: 'المحتوى' },
    },
    {
        href: '/admin/analytics',
        icon: BarChart3,
        label: { en: 'Analytics', ar: 'التحليلات' },
    },
    {
        href: '/admin/subscriptions',
        icon: CreditCard,
        label: { en: 'Subscriptions', ar: 'الاشتراكات' },
    },
    {
        href: '/admin/support',
        icon: MessageSquare,
        label: { en: 'Support', ar: 'الدعم' },
    },
    {
        href: '/admin/feature-flags',
        icon: Flag,
        label: { en: 'Feature Flags', ar: 'تبديلات الميزات' },
    },
    {
        href: '/admin/settings',
        icon: Settings,
        label: { en: 'Settings', ar: 'الإعدادات' },
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { locale, t } = useLocale();
    const { data: session } = useSession();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <AdminAuthGuard>
            <div className="min-h-screen flex bg-muted/30">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 start-0 z-50 flex flex-col bg-card border-e transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b">
                    {!isSidebarCollapsed && (
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold">Admin</span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={isSidebarCollapsed ? 'mx-auto' : ''}
                    >
                        {isSidebarCollapsed ? (
                            <Menu className="h-5 w-5" />
                        ) : (
                            <ChevronLeft className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                title={isSidebarCollapsed ? item.label[locale] : undefined}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!isSidebarCollapsed && <span>{item.label[locale]}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to App */}
                <div className="p-3 border-t">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${isSidebarCollapsed ? 'justify-center' : ''
                            }`}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isSidebarCollapsed && (
                            <span>{locale === 'ar' ? 'العودة للتطبيق' : 'Back to App'}</span>
                        )}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ms-16' : 'ms-64'
                    }`}
            >
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 bg-card border-b sticky top-0 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                                className="ps-10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-red-500" />
                        </Button>
                        <LanguageSwitcher variant="dropdown" showLabel={false} />
                        <div className="flex items-center gap-2">
                            <Badge variant={session?.user?.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                                {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                            </Badge>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-medium text-white">
                                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
        </AdminAuthGuard>
    );
}
