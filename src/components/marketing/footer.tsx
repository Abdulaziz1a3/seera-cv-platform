'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Linkedin, Instagram } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

export function MarketingFooter() {
    const { t, dir } = useLocale();

    const footerLinks = {
        product: [
            { href: '/pricing', label: t.footer.links.pricing },
            { href: '/blog', label: t.footer.links.blog },
        ],
        resources: [
            { href: '/help', label: t.footer.links.helpCenter },
            { href: '/blog', label: t.footer.links.resumeGuide },
            { href: '/blog', label: t.footer.links.careerTips },
        ],
        company: [
            { href: '/contact', label: t.footer.links.aboutUs },
            { href: '/contact', label: t.footer.links.contact },
        ],
        legal: [
            { href: '/terms', label: t.footer.links.terms },
            { href: '/privacy', label: t.footer.links.privacy },
        ],
    };

    const socialLinks = [
        { href: 'https://x.com/seera_ai', icon: Twitter, label: t.footer.social.twitter },
        { href: 'https://www.linkedin.com/company/seera-ai1', icon: Linkedin, label: t.footer.social.linkedin },
        { href: 'https://www.instagram.com/seera_ai1', icon: Instagram, label: t.footer.social.instagram },
    ];

    return (
        <footer className="bg-muted/30 border-t">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 group mb-4">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                Seera AI
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs mb-6">
                            {t.footer.description}
                        </p>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">{t.footer.product}</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">{t.footer.resources}</h4>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">{t.footer.company}</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">{t.footer.legal}</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        {t.footer.copyright}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            {t.footer.links.terms}
                        </Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            {t.footer.links.privacy}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
