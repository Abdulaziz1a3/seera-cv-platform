'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Linkedin, Instagram } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

const WhatsappIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
    >
        <path d="M20.52 3.48A11.86 11.86 0 0012 .5C5.65.5.5 5.64.5 12c0 2.11.55 4.17 1.6 5.99L.5 23.5l5.66-1.48A11.47 11.47 0 0012 23.5c6.35 0 11.5-5.15 11.5-11.5 0-3.07-1.2-5.96-3.33-8.02zM12 21.25c-1.82 0-3.61-.49-5.17-1.42l-.37-.22-3.36.88.9-3.28-.24-.39A9.25 9.25 0 012.75 12C2.75 6.89 6.89 2.75 12 2.75c2.47 0 4.79.96 6.53 2.7A9.17 9.17 0 0121.25 12c0 5.11-4.14 9.25-9.25 9.25zm5.07-6.97c-.28-.14-1.66-.82-1.92-.92-.26-.1-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.41-.84-.75-1.41-1.68-1.57-1.96-.16-.28-.02-.44.12-.58.13-.13.28-.33.42-.5.14-.17.19-.28.28-.47.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49l-.54-.01c-.19 0-.5.07-.76.36-.26.28-1  .98-1 2.4s1.02 2.79 1.16 2.98c.14.19 2.01 3.07 4.86 4.3.68.29 1.2.47 1.61.6.68.22 1.3.19 1.79.12.55-.08 1.66-.68 1.89-1.34.23-.66.23-1.23.16-1.34-.07-.11-.26-.18-.54-.32z" />
    </svg>
);

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
        { href: 'https://wa.me/966505752019', icon: WhatsappIcon, label: t.footer.social.whatsapp },
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
