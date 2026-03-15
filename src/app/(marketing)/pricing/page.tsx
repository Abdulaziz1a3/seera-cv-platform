'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import {
    Check,
    Sparkles,
    ArrowRight,
    FileText,
    Brain,
    Compass,
    Users,
    PenTool,
    ScanSearch,
    Shield,
    Zap,
    Globe2,
    Lock,
} from 'lucide-react';
import { formatOfficialPrice, getOfficialPlanPriceUsd } from '@/lib/billing-config';

const featureIcons: Record<string, typeof Check> = {
    0: FileText,
    1: Sparkles,
    2: Brain,
    3: Compass,
    4: Users,
    5: PenTool,
    6: ScanSearch,
};

export default function PricingPage() {
    const { t, locale } = useLocale();
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: t.landing.pricing.pro.name,
            description: t.landing.pricing.pro.description,
            monthlyPrice: getOfficialPlanPriceUsd('pro', 'monthly'),
            yearlyPrice: getOfficialPlanPriceUsd('pro', 'yearly'),
            features: t.landing.pricing.pro.features,
            cta: t.landing.pricing.pro.cta,
            href: '/register',
            badge: t.landing.pricing.pro.badge,
            icon: Sparkles,
            popular: true,
            color: 'from-primary to-purple-600',
        },
    ];

    const pricingFaqQuestions = t.landing.faq.questions
        .filter((faq) => faq.q !== 'Is my data secure?' && faq.q !== 'هل بياناتي آمنة؟')
        .slice(-2);

    const trustItems = [
        { icon: Shield, label: locale === 'ar' ? 'بيانات مشفّرة' : 'Encrypted Data' },
        { icon: Zap, label: locale === 'ar' ? 'وصول فوري' : 'Instant Access' },
        { icon: Globe2, label: locale === 'ar' ? 'عربي وإنجليزي' : 'Arabic & English' },
        { icon: Lock, label: locale === 'ar' ? 'إلغاء في أي وقت' : 'Cancel Anytime' },
    ];

    return (
        <div className="min-h-screen">

            {/* ─── HERO ─── */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
                <div className="absolute inset-0 dot-pattern opacity-20" />

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-6 gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {locale === 'ar' ? 'خطط مرنة' : 'Flexible Plans'}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                        {t.landing.pricing.title}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        {t.landing.pricing.subtitle}
                    </p>

                    {/* Billing toggle */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {t.landing.pricing.monthly}
                        </span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {t.landing.pricing.yearly}
                        </span>
                    </div>
                    {isYearly && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 mb-8">
                            🎉 {t.landing.pricing.savePercent} {locale === 'ar' ? 'مع الخطة السنوية' : 'with yearly billing'}
                        </Badge>
                    )}
                    {!isYearly && <div className="mb-8" />}
                </div>
            </section>

            {/* ─── PRICING CARD ─── */}
            <section className="pb-20 -mt-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-lg mx-auto">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className="relative overflow-hidden border-2 border-primary shadow-2xl shadow-primary/10"
                            >
                                {/* Top gradient bar */}
                                <div className={`absolute top-0 start-0 end-0 h-1 bg-gradient-to-r ${plan.color}`} />

                                {/* Popular badge */}
                                {plan.badge && (
                                    <div className="absolute top-4 end-4">
                                        <Badge className={`bg-gradient-to-r ${plan.color} text-white border-0 shadow-sm`}>
                                            {plan.badge}
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pt-10 pb-6">
                                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                                        <plan.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl mb-1">{plan.name}</CardTitle>
                                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="px-8 pb-8">
                                    {/* Price */}
                                    <div className="text-center mb-8">
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-5xl font-bold">
                                                {formatOfficialPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice, locale)}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                /{isYearly ? (locale === 'ar' ? 'سنة' : 'year') : (locale === 'ar' ? 'شهر' : 'mo')}
                                            </span>
                                        </div>
                                        {isYearly && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {locale === 'ar' ? 'يُدفع سنوياً' : 'Billed annually'}
                                            </p>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        className={`w-full h-12 text-base shadow-lg bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity mb-6`}
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={plan.href}>
                                            {plan.cta}
                                            <ArrowRight className="h-5 w-5 ms-2" />
                                        </Link>
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center mb-8 flex items-center justify-center gap-1.5">
                                        <Lock className="h-3 w-3" />
                                        {locale === 'ar' ? 'دفع آمن عبر بوابة الدفع' : 'Secure checkout · Cancel anytime'}
                                    </p>

                                    {/* Divider */}
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-card px-3 text-xs text-muted-foreground">
                                                {locale === 'ar' ? 'ما يشمله الاشتراك' : "What's included"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features list */}
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => {
                                            const Icon = featureIcons[idx] || Check;
                                            return (
                                                <li key={feature} className="flex items-start gap-3">
                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span className="text-sm leading-relaxed">{feature}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Trust bar */}
                    <div className="mt-12 max-w-2xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-8">
                            {trustItems.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Icon className="h-4 w-4 text-primary" />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                        {t.landing.faq.title}
                    </h2>

                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="space-y-3">
                            {pricingFaqQuestions.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="rounded-xl border bg-card px-5 shadow-sm"
                                >
                                    <AccordionTrigger className="text-start hover:no-underline font-semibold py-5">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* ─── FINAL CTA ─── */}
            <section className="relative py-20 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent" />
                <div className="absolute inset-0 dot-pattern opacity-20" />

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        {locale === 'ar' ? 'جاهز للبدء؟' : 'Ready to get started?'}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {locale === 'ar'
                            ? 'انضم وابدأ بناء سيرتك المهنية الآن.'
                            : 'Join Seera AI and start building your career today.'}
                    </p>
                    <Button
                        size="lg"
                        asChild
                        className="shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-12 px-8"
                    >
                        <Link href="/register">
                            {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                            <ArrowRight className="h-5 w-5 ms-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
