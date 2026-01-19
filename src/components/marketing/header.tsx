'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Menu, X, FileText, Moon, Sun, Building2, User, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/components/providers/locale-provider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function MarketingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { t, locale, dir } = useLocale();

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
    const recruiterLabel = locale === 'ar' ? 'للشركات' : 'For Recruiters';
    const comingSoonLabel = locale === 'ar' ? 'قريباً' : 'Coming soon';

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen
                ? 'bg-background/95 backdrop-blur-md shadow-sm border-b'
                : 'bg-transparent'
                }`}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Seera AI
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-muted ${link.href === '/recruiters'
                                    ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground cursor-not-allowed flex items-center gap-2">
                            <span>{recruiterLabel}</span>
                            <Badge variant="secondary">{comingSoonLabel}</Badge>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Language Switcher */}
                        <LanguageSwitcher variant="dropdown" showLabel={false} />

                        {/* Theme Toggle */}
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
                                {/* Login Dropdown - Separate for Job Seekers and Recruiters */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-1">
                                            {t.nav.signIn}
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href="/login" className="flex items-center gap-2 cursor-pointer">
                                                <User className="h-4 w-4" />
                                                <div>
                                                    <p className="font-medium">
                                                        {locale === 'ar' ? 'باحث عن عمل' : 'Job Seeker'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {locale === 'ar' ? 'تسجيل دخول للوحة التحكم' : 'Login to dashboard'}
                                                    </p>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-not-allowed opacity-60">
                                            <Building2 className="h-4 w-4 text-purple-600" />
                                            <div>
                                                <p className="font-medium text-purple-600">
                                                    {locale === 'ar' ? 'مسؤول توظيف' : 'Recruiter'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {comingSoonLabel}
                                                </p>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Get Started Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 gap-1">
                                            {t.nav.getStartedFree}
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuItem asChild>
                                            <Link href="/register" className="flex items-center gap-3 cursor-pointer py-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {locale === 'ar' ? 'أنا أبحث عن عمل' : "I'm a Job Seeker"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {locale === 'ar' ? 'أنشئ سيرتك الذاتية' : 'Create your resume'}
                                                    </p>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-not-allowed opacity-60">
                                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-purple-600">
                                                    {locale === 'ar' ? 'أنا أوظف مواهب' : "I'm Hiring Talent"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {comingSoonLabel}
                                                </p>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <LanguageSwitcher variant="toggle" showLabel={false} />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="relative"
                        >
                            <Menu
                                className={`h-5 w-5 transition-all ${isMobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                                    }`}
                            />
                            <X
                                className={`absolute h-5 w-5 transition-all ${isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                                    }`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[500px] pb-6' : 'max-h-0'
                        }`}
                >
                    <div className="flex flex-col gap-2 pt-4 bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${link.href === '/recruiters'
                                    ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground cursor-not-allowed flex items-center gap-2">
                            <span>{recruiterLabel}</span>
                            <Badge variant="secondary">{comingSoonLabel}</Badge>
                        </div>
                        <div className="h-px bg-border my-2" />

                        {/* Mobile - Separate buttons */}
                        {session ? (
                            <Button asChild className="w-full">
                                <Link href="/dashboard">{t.nav.dashboard}</Link>
                            </Button>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground px-4 mb-1">
                                    {locale === 'ar' ? 'باحث عن عمل' : 'Job Seekers'}
                                </p>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/login">{t.nav.signIn}</Link>
                                </Button>
                                <Button asChild className="w-full">
                                    <Link href="/register">{t.nav.getStartedFree}</Link>
                                </Button>

                                <div className="h-px bg-border my-2" />

                                <p className="text-xs text-muted-foreground px-4 mb-1">
                                    {locale === 'ar' ? 'للشركات' : 'For Recruiters'}
                                </p>
                                <Button variant="outline" className="w-full border-purple-200 text-purple-600" disabled>
                                    <Building2 className="h-4 w-4 me-2" />
                                    {comingSoonLabel}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
