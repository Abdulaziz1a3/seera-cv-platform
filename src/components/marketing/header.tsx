'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/components/providers/locale-provider';

export function MarketingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { t } = useLocale();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/pricing', label: t.nav.pricing },
        { href: '/blog', label: t.nav.blog },
        { href: '/contact', label: t.nav.contact },
    ];

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
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Seera AI
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <LanguageSwitcher variant="dropdown" showLabel={false} />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {session ? (
                            <Button asChild>
                                <Link href="/dashboard">{t.nav.dashboard}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">{t.nav.signIn}</Link>
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                                    asChild
                                >
                                    <Link href="/register">{t.nav.getStartedFree}</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex md:hidden items-center gap-2">
                        <LanguageSwitcher variant="toggle" showLabel={false} />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative"
                        >
                            <Menu
                                className={`h-5 w-5 transition-all ${
                                    isMobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                                }`}
                            />
                            <X
                                className={`absolute h-5 w-5 transition-all ${
                                    isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                                }`}
                            />
                        </Button>
                    </div>
                </div>

                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ${
                        isMobileMenuOpen ? 'max-h-[420px] pb-6' : 'max-h-0'
                    }`}
                >
                    <div className="flex flex-col gap-2 pt-4 bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="h-px bg-border my-2" />
                        {session ? (
                            <Button asChild className="w-full">
                                <Link href="/dashboard">{t.nav.dashboard}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/login">{t.nav.signIn}</Link>
                                </Button>
                                <Button asChild className="w-full">
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
