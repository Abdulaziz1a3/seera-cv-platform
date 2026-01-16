'use client';

import { Shield, Lock, Award, CheckCircle, Users, Star, Zap } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

// Security badges for building trust
export function SecurityBadges({ className }: { className?: string }) {
    const { locale } = useLocale();

    const badges = [
        {
            icon: Lock,
            text: locale === 'ar' ? 'SSL آمن' : 'SSL Secured',
        },
        {
            icon: Shield,
            text: locale === 'ar' ? 'GDPR متوافق' : 'GDPR Compliant',
        },
        {
            icon: Award,
            text: locale === 'ar' ? 'شهادة SOC 2' : 'SOC 2 Certified',
        },
    ];

    return (
        <div className={cn('flex flex-wrap items-center justify-center gap-6', className)}>
            {badges.map((badge, index) => (
                <div
                    key={index}
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                    <badge.icon className="h-4 w-4" />
                    <span>{badge.text}</span>
                </div>
            ))}
        </div>
    );
}

// Stats/social proof numbers
export function SocialProofStats({ className }: { className?: string }) {
    const { locale } = useLocale();

    const stats = [
        {
            value: '50K+',
            label: locale === 'ar' ? 'سيرة ذاتية تم إنشاؤها' : 'Resumes Created',
            icon: Zap,
        },
        {
            value: '10K+',
            label: locale === 'ar' ? 'مستخدم نشط' : 'Active Users',
            icon: Users,
        },
        {
            value: '95%',
            label: locale === 'ar' ? 'معدل نجاح ATS' : 'ATS Pass Rate',
            icon: CheckCircle,
        },
        {
            value: '4.9',
            label: locale === 'ar' ? 'تقييم المستخدمين' : 'User Rating',
            icon: Star,
        },
    ];

    return (
        <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-6', className)}>
            {stats.map((stat, index) => (
                <div key={index} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <stat.icon className="h-5 w-5 text-primary" />
                        <span className="text-3xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}

// Trust bar for checkout/signup pages
export function TrustBar({ className }: { className?: string }) {
    const { locale } = useLocale();

    const items = [
        {
            icon: Lock,
            text: locale === 'ar' ? 'دفع آمن 256-bit' : '256-bit Secure Payment',
        },
        {
            icon: CheckCircle,
            text: locale === 'ar' ? 'ضمان استرداد 30 يوم' : '30-Day Money Back',
        },
        {
            icon: Shield,
            text: locale === 'ar' ? 'خصوصية مضمونة' : 'Privacy Protected',
        },
    ];

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-center gap-4 py-4 px-6 bg-muted/50 rounded-lg',
                className
            )}
        >
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">{item.text}</span>
                </div>
            ))}
        </div>
    );
}

// Company logos / "As featured in" section
export function FeaturedIn({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div className={cn('text-center', className)}>
            <p className="text-sm text-muted-foreground mb-6">
                {locale === 'ar' ? 'موثوق به من قبل محترفين من' : 'Trusted by professionals from'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
                {/* Placeholder for company logos - would be actual logos in production */}
                {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (
                    <div
                        key={company}
                        className="text-lg font-semibold text-muted-foreground"
                        aria-label={company}
                    >
                        {company}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Money-back guarantee badge
export function GuaranteeBadge({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-4 border-2 border-primary/20 rounded-xl bg-primary/5',
                className
            )}
        >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="font-semibold">
                    {locale === 'ar' ? 'ضمان استرداد الأموال' : 'Money-Back Guarantee'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                        ? 'غير راضٍ؟ استرد أموالك بالكامل خلال 30 يومًا.'
                        : 'Not satisfied? Get a full refund within 30 days.'}
                </p>
            </div>
        </div>
    );
}

// User count badge (shows live-ish user count)
export function LiveUserBadge({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-sm',
                className
            )}
        >
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-700 dark:text-green-400 font-medium">
                {locale === 'ar' ? '2,847 مستخدم نشط الآن' : '2,847 users online now'}
            </span>
        </div>
    );
}
