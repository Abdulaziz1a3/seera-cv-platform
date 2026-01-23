'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Briefcase,
    Search,
    Bookmark,
    CreditCard,
    LogOut,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

const navItems = [
    { name: 'Home', href: '/recruiters', icon: LayoutDashboard },
    { name: 'Jobs & Matching', href: '/recruiters/jobs', icon: Briefcase },
    { name: 'Talent Pool', href: '/recruiters/search', icon: Search },
    { name: 'Shortlists', href: '/recruiters/shortlists', icon: Bookmark },
    { name: 'Billing & Credits', href: '/recruiters/billing', icon: CreditCard },
];

export function RecruiterShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const userInitials = session?.user?.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'R';

    return (
        <div className=\"min-h-[100dvh] bg-muted/30\">
            <div className=\"mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8\">
                <div className=\"flex flex-col gap-6 lg:flex-row\">
                    <aside className=\"w-full lg:w-64\">
                        <Card className=\"p-4\">
                            <div className=\"mb-6 flex items-center gap-3\">
                                <div className=\"h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold\">
                                    SA
                                </div>
                                <div>
                                    <p className=\"text-sm font-semibold\">Seera AI Recruiter</p>
                                    <p className=\"text-xs text-muted-foreground\">Talent Hunter</p>
                                </div>
                            </div>
                            <nav className=\"space-y-2\">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <item.icon className=\"h-4 w-4\" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className=\"mt-6 border-t pt-4\">
                                <Button
                                    variant=\"ghost\"
                                    className=\"w-full justify-start gap-2 text-muted-foreground hover:text-foreground\"
                                    onClick={() => signOut({ callbackUrl: '/recruiters/login' })}
                                >
                                    <LogOut className=\"h-4 w-4\" />
                                    Sign out
                                </Button>
                            </div>
                        </Card>
                    </aside>

                    <main className=\"flex-1 space-y-6\">
                        <header className=\"flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between\">
                            <div>
                                <p className=\"text-sm text-muted-foreground\">Welcome back</p>
                                <h1 className=\"text-2xl font-semibold\">{session?.user?.name || 'Recruiter'}</h1>
                            </div>
                            <div className=\"flex items-center gap-3\">
                                <Button asChild variant=\"outline\">
                                    <Link href=\"/recruiters/jobs\">Create Job</Link>
                                </Button>
                                <div className=\"flex items-center gap-2 rounded-full border px-3 py-1.5\">
                                    <Avatar className=\"h-7 w-7\">
                                        <AvatarFallback className=\"bg-primary text-primary-foreground text-xs\">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className=\"text-sm\">{session?.user?.email}</span>
                                </div>
                            </div>
                        </header>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
