'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/components/providers/locale-provider';
import { usePathname } from 'next/navigation';

export function MarketingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { t } = useLocale();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const navLinks = [
        { href: '/pricing', label: t.nav.pricing },
        { href: '/blog', label: t.nav.blog },
        { href: '/contact', label: t.nav.contact },
    ];

    const isActiveLink = (href: string) => pathname === href;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled || isMobileMenuOpen
                    ? 'bg-background/95 backdrop-blur-md shadow-sm border-b'
                    : 'bg-transparent'
            }`}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Seera AI
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                                    isActiveLink(link.href)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <LanguageSwitcher variant="dropdown" showLabel={false} />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full h-9 w-9"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {session ? (
                            <Button asChild size="sm" className="ms-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-sm">
                                <Link href="/dashboard">{t.nav.dashboard}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/login">{t.nav.signIn}</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20"
                                    asChild
                                >
                                    <Link href="/register">{t.nav.getStartedFree}</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile: language + hamburger */}
                    <div className="flex md:hidden items-center gap-2">
                        <LanguageSwitcher variant="toggle" showLabel={false} />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative h-9 w-9"
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            <Menu
                                className={`h-5 w-5 transition-all duration-200 ${
                                    isMobileMenuOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'
                                }`}
                            />
                            <X
                                className={`absolute h-5 w-5 transition-all duration-200 ${
                                    isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'
                                }`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                        isMobileMenuOpen ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="flex flex-col gap-1.5 pt-2 bg-background/98 backdrop-blur-md rounded-2xl p-4 shadow-xl border mt-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                                    isActiveLink(link.href)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="h-px bg-border my-2" />

                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-sm text-muted-foreground">
                                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="h-8 w-8 rounded-full"
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </Button>
                        </div>

                        <div className="h-px bg-border mb-2" />

                        {session ? (
                            <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600">
                                <Link href="/dashboard">{t.nav.dashboard}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/login">{t.nav.signIn}</Link>
                                </Button>
                                <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600">
                                    <Link href="/register">{t.nav.getStartedFree}</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
