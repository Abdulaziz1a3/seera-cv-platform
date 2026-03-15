'use client';

import { Shield, Lock, Award, CheckCircle, Users, Star, Zap } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

export function SecurityBadges({ className }: { className?: string }) {
    const { locale } = useLocale();

    const badges = [
        {
            icon: Lock,
            text: locale === 'ar' ? 'SSL آمن' : 'SSL Secured',
        },
        {
            icon: Shield,
            text: locale === 'ar' ? 'متوافق مع GDPR' : 'GDPR Compliant',
        },
        {
            icon: Award,
            text: locale === 'ar' ? 'شهادة SOC 2' : 'SOC 2 Certified',
        },
    ];

    return (
        <div className={cn('flex flex-wrap items-center justify-center gap-6', className)}>
            {badges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon className="h-4 w-4" />
                    <span>{badge.text}</span>
                </div>
            ))}
        </div>
    );
}

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
        <div className={cn('grid grid-cols-2 gap-6 md:grid-cols-4', className)}>
            {stats.map((stat, index) => (
                <div key={index} className="text-center">
                    <div className="mb-1 flex items-center justify-center gap-2">
                        <stat.icon className="h-5 w-5 text-primary" />
                        <span className="text-3xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}

export function TrustBar({ className }: { className?: string }) {
    const { locale } = useLocale();

    const items = [
        {
            icon: Lock,
            text: locale === 'ar' ? 'دفع آمن 256-bit' : '256-bit Secure Payment',
        },
        {
            icon: CheckCircle,
            text: locale === 'ar' ? 'جميع المبيعات نهائية' : 'All sales final',
        },
        {
            icon: Shield,
            text: locale === 'ar' ? 'الخصوصية محمية' : 'Privacy Protected',
        },
    ];

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-center gap-4 rounded-lg bg-muted/50 px-6 py-4',
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

export function FeaturedIn({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div className={cn('text-center', className)}>
            <p className="mb-6 text-sm text-muted-foreground">
                {locale === 'ar' ? 'موثوق به من قبل محترفين من' : 'Trusted by professionals from'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
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

export function GuaranteeBadge({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4',
                className
            )}
        >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="font-semibold">
                    {locale === 'ar' ? 'سياسة عدم الاسترداد' : 'No Refund Policy'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                        ? 'جميع المدفوعات نهائية وغير قابلة للاسترداد، إلا إذا كان القانون يفرض خلاف ذلك.'
                        : 'All payments are final and non-refundable, except where required by law.'}
                </p>
            </div>
        </div>
    );
}

export function LiveUserBadge({ className }: { className?: string }) {
    const { locale } = useLocale();

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm dark:bg-green-900/30',
                className
            )}
        >
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="font-medium text-green-700 dark:text-green-400">
                {locale === 'ar' ? '2,847 مستخدم نشط الآن' : '2,847 users online now'}
            </span>
        </div>
    );
}
