'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles, Building2, ArrowRight } from 'lucide-react';

export default function PricingPage() {
    const { t, locale } = useLocale();
    const [isYearly, setIsYearly] = useState(false);

    const recruiterCreditsLabel = isYearly
        ? (locale === 'ar' ? '240 رصيد CV سنوياً' : '240 CV credits per year')
        : (locale === 'ar' ? '20 رصيد CV شهرياً' : '20 CV credits per month');

    const recruiterFeatures = locale === 'ar'
        ? [
            recruiterCreditsLabel,
            'مطابقة ذكية مع توصيات',
            'مرشحو أولوية',
            'قوائم مختصرة وملاحظات',
            'بحث متقدم بالمرشحين',
        ]
        : [
            recruiterCreditsLabel,
            'AI matching & recommendations',
            'Priority candidates',
            'Shortlists & notes',
            'Advanced talent search',
        ];

    const plans = [
        {
            name: t.landing.pricing.pro.name,
            description: t.landing.pricing.pro.description,
            monthlyPrice: 39,
            yearlyPrice: 299,
            features: t.landing.pricing.pro.features,
            cta: t.landing.pricing.pro.cta,
            href: '/register',
            badge: t.landing.pricing.pro.badge,
            icon: Sparkles,
            popular: true,
            color: 'from-primary to-primary/60',
        },
        {
            name: locale === 'ar' ? 'صائد المواهب - النمو' : 'Talent Hunter - Growth',
            description: locale === 'ar'
                ? 'لوحة مسؤولي التوظيف مع مطابقة ذكية للمواهب'
                : 'Recruiter dashboard with AI matching and talent insights',
            monthlyPrice: 199,
            yearlyPrice: 1650,
            features: recruiterFeatures,
            cta: locale === 'ar' ? 'ابدأ كمسؤول توظيف' : 'Start hiring',
            href: '/recruiters/register',
            icon: Building2,
            popular: false,
            color: 'from-amber-500 to-orange-600',
        },
    ];
    const pricingFaqQuestions = t.landing.faq.questions
        .filter((faq) => faq.q !== 'Is my data secure?' && faq.q !== 'هل بياناتي آمنة؟')
        .slice(-2);

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-6">
                        <Sparkles className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'خطط مرنة' : 'Flexible Plans'}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        {t.landing.pricing.title}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        {t.landing.pricing.subtitle}
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {t.landing.pricing.monthly}
                        </span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {t.landing.pricing.yearly}
                            <Badge variant="secondary" className="ms-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {t.landing.pricing.savePercent}
                            </Badge>
                        </span>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-8 -mt-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular
                                    ? 'border-2 border-primary shadow-lg md:scale-105'
                                    : 'hover:-translate-y-1'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                                )}

                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="px-4 py-1 text-sm shadow-lg">{plan.badge}</Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pt-8">
                                    <div
                                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}
                                    >
                                        <plan.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="text-center">
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold">
                                            {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                        </span>
                                        <span className="text-muted-foreground ms-2">
                                            {locale === 'ar' ? 'ر.س' : 'SAR'}
                                        </span>
                                        <span className="text-muted-foreground ms-2">
                                            /{isYearly ? (locale === 'ar' ? 'سنة' : 'year') : (locale === 'ar' ? 'شهر' : 'mo')}
                                        </span>
                                    </div>

                                    <ul className="space-y-3 text-start mb-8">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full ${plan.popular ? 'shadow-lg' : ''}`}
                                        variant={plan.popular ? 'default' : 'outline'}
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={plan.href}>
                                            {plan.cta}
                                            <ArrowRight className="h-4 w-4 ms-2" />
                                        </Link>
                                    </Button>

                                    {plan.monthlyPrice > 0 && (
                                        <p className="text-xs text-muted-foreground mt-4 text-center">
                                            {locale === 'ar' ? 'دفع آمن عبر TuwaiqPay' : 'Secure payment via TuwaiqPay'}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                        {t.landing.faq.title}
                    </h2>

                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            {pricingFaqQuestions.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-start hover:no-underline">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        {locale === 'ar' ? 'جاهز للبدء؟' : 'Ready to get started?'}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {locale === 'ar'
                            ? 'ابدأ اليوم. لا حاجة لبطاقة ائتمان.'
                            : 'Start today. No credit card required.'}
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/register">
                            {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                            <ArrowRight className="h-4 w-4 ms-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
