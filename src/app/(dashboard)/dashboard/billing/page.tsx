'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/components/providers/locale-provider';

type BillingStatus = {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    status: string;
    isActive: boolean;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    provider: 'FASTSPRING' | 'TUWAIQPAY' | 'STRIPE' | null;
};

type CreditsSummary = {
    baseCredits: number;
    topupCredits: number;
    usedCredits: number;
    remainingCredits: number;
};

export default function BillingPage() {
    const { t, locale } = useLocale();

    const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
    const [creditsSummary, setCreditsSummary] = useState<CreditsSummary | null>(null);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [manageLoading, setManageLoading] = useState(false);

    const fetchBillingStatus = async () => {
        const response = await fetch('/api/billing/status', { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (!data) return;

        setBillingStatus({
            plan: data.plan || 'FREE',
            status: data.status || 'UNPAID',
            isActive: Boolean(data.isActive),
            currentPeriodEnd: data.currentPeriodEnd || null,
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            provider: data.provider || null,
        });
    };

    const fetchCredits = async () => {
        const response = await fetch('/api/credits', { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (!data) return;

        setCreditsSummary({
            baseCredits: data.baseCredits ?? 50,
            topupCredits: data.topupCredits ?? 0,
            usedCredits: data.usedCredits ?? 0,
            remainingCredits: data.remainingCredits ?? 0,
        });
    };

    useEffect(() => {
        void fetchBillingStatus();
        void fetchCredits();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        if (!params.get('fastspringCheckout')) return;

        let active = true;
        let attempts = 0;

        const pollStatus = async () => {
            while (active && attempts < 10) {
                attempts += 1;
                try {
                    const response = await fetch('/api/billing/status', { cache: 'no-store' });
                    const data = response.ok ? await response.json() : null;
                    if (data) {
                        setBillingStatus({
                            plan: data.plan || 'FREE',
                            status: data.status || 'UNPAID',
                            isActive: Boolean(data.isActive),
                            currentPeriodEnd: data.currentPeriodEnd || null,
                            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
                            provider: data.provider || null,
                        });
                    }

                    if (data?.isActive && data?.plan === 'PRO') {
                        toast.success(
                            locale === 'ar'
                                ? 'تم تفعيل اشتراكك بنجاح!'
                                : 'Your subscription is now active!'
                        );
                        window.history.replaceState({}, '', '/dashboard/billing');
                        return;
                    }
                } catch {
                    // Ignore transient polling errors.
                }

                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            if (active) {
                toast.info(
                    locale === 'ar'
                        ? 'تم استلام الدفع. قد يستغرق التفعيل لحظات قليلة.'
                        : 'Payment received. Activation may take a few moments.'
                );
                window.history.replaceState({}, '', '/dashboard/billing');
            }
        };

        toast.info(
            locale === 'ar'
                ? 'جارٍ تأكيد اشتراكك مع FastSpring...'
                : 'Confirming your subscription with FastSpring...',
            { duration: 5000 }
        );

        void pollStatus();

        return () => {
            active = false;
        };
    }, [locale]);

    const handleUpgrade = async () => {
        setUpgradeLoading(true);
        try {
            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'pro', interval: billingInterval }),
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to start checkout');
            }

            if (!payload?.url) {
                throw new Error(locale === 'ar' ? 'رابط الدفع غير متوفر' : 'Checkout URL missing');
            }

            window.open(payload.url, '_blank');
            toast.success(
                locale === 'ar'
                    ? 'تم فتح صفحة الدفع في تبويب جديد'
                    : 'Checkout opened in a new tab'
            );
        } catch (error: any) {
            toast.error(
                error?.message
                || (locale === 'ar' ? 'تعذر بدء الدفع' : 'Failed to start checkout')
            );
        } finally {
            setUpgradeLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setManageLoading(true);
        try {
            const response = await fetch('/api/billing/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to open subscription management');
            }

            if (!payload?.url) {
                throw new Error(
                    locale === 'ar'
                        ? 'رابط إدارة الاشتراك غير متوفر'
                        : 'Subscription management URL missing'
                );
            }

            window.open(payload.url, '_blank');
            toast.success(
                locale === 'ar'
                    ? 'تم فتح إدارة الاشتراك في تبويب جديد'
                    : 'Subscription management opened in a new tab'
            );
        } catch (error: any) {
            toast.error(
                error?.message
                || (locale === 'ar' ? 'تعذر فتح إدارة الاشتراك' : 'Failed to open subscription management')
            );
        } finally {
            setManageLoading(false);
        }
    };

    const currentPlan = billingStatus?.plan || 'FREE';
    const isFastSpringSubscription = currentPlan === 'PRO'
        && billingStatus?.isActive
        && billingStatus?.provider === 'FASTSPRING';
    const autoRenewEnabled = isFastSpringSubscription && !billingStatus?.cancelAtPeriodEnd;

    const currentPlanLabel = currentPlan === 'PRO'
        ? (locale === 'ar' ? 'خطة برو' : 'Pro Plan')
        : currentPlan === 'ENTERPRISE'
            ? (locale === 'ar' ? 'خطة المؤسسات' : 'Enterprise Plan')
            : (locale === 'ar' ? 'الخطة المجانية' : 'Free Plan');

    const currentPlanDescription = currentPlan === 'PRO'
        ? (locale === 'ar' ? '10 سير ذاتية، 50 رصيد AI شهرياً' : '10 resume slots, 50 AI credits/month')
        : currentPlan === 'ENTERPRISE'
            ? (locale === 'ar' ? 'وصول غير محدود مع دعم مميز' : 'Unlimited access with priority support')
            : (locale === 'ar' ? 'سيرة ذاتية واحدة، 10 أرصدة AI شهرياً' : '1 resume slot, 10 AI credits/month');

    const periodEndLabel = autoRenewEnabled
        ? (locale === 'ar' ? 'يتجدد في' : 'Renews on')
        : (locale === 'ar' ? 'ينتهي في' : 'Ends on');

    const planResumeLimit = currentPlan === 'PRO' ? 10 : currentPlan === 'ENTERPRISE' ? null : 1;
    const planCredits = currentPlan === 'PRO' ? 50 : currentPlan === 'ENTERPRISE' ? null : 10;

    const baseCredits = creditsSummary?.baseCredits ?? planCredits ?? 0;
    const topupCredits = creditsSummary?.topupCredits ?? 0;
    const usedCredits = creditsSummary?.usedCredits ?? 0;
    const remainingCredits = creditsSummary?.remainingCredits ?? Math.max(0, baseCredits - usedCredits);
    const totalCredits = baseCredits + topupCredits;
    const creditUsagePercent = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">{locale === 'ar' ? 'الفوترة' : 'Billing'}</h1>
                <p className="text-muted-foreground mt-1">
                    {locale === 'ar'
                        ? 'إدارة اشتراكك عبر FastSpring ومراجعة حدود خطتك الحالية.'
                        : 'Manage your FastSpring subscription and review your current plan limits.'}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        {t.settings.billing.currentPlan}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6 rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold">{currentPlanLabel}</h3>
                                <Badge>{t.settings.billing.current}</Badge>
                                {billingStatus?.provider === 'FASTSPRING' && (
                                    <Badge variant="outline">FastSpring</Badge>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{currentPlanDescription}</p>
                            {billingStatus?.plan !== 'FREE' && billingStatus?.currentPeriodEnd && (
                                <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                    {periodEndLabel}:{' '}
                                    {new Date(billingStatus.currentPeriodEnd).toLocaleDateString(
                                        locale === 'ar' ? 'ar-SA' : 'en-US',
                                        { year: 'numeric', month: 'long', day: 'numeric' }
                                    )}
                                </p>
                            )}
                            {isFastSpringSubscription && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {autoRenewEnabled
                                        ? (locale === 'ar'
                                            ? 'التجديد التلقائي مفعل حالياً ويمكن إدارته من بوابة FastSpring.'
                                            : 'Auto-renew is currently enabled and can be managed in the FastSpring portal.')
                                        : (locale === 'ar'
                                            ? 'التجديد التلقائي متوقف حالياً ويمكن تشغيله من بوابة FastSpring.'
                                            : 'Auto-renew is currently off and can be changed in the FastSpring portal.')}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                            {isFastSpringSubscription ? (
                                <Button
                                    size="lg"
                                    className="shadow-lg"
                                    onClick={handleManageSubscription}
                                    disabled={manageLoading}
                                >
                                    {manageLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                                    {locale === 'ar' ? 'إدارة الاشتراك' : 'Manage subscription'}
                                </Button>
                            ) : (
                                <>
                                    <Select
                                        value={billingInterval}
                                        onValueChange={(value) => setBillingInterval(value as 'monthly' | 'yearly')}
                                    >
                                        <SelectTrigger className="w-[170px]">
                                            <SelectValue placeholder={locale === 'ar' ? 'المدة' : 'Billing period'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">{locale === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                                            <SelectItem value="yearly">{locale === 'ar' ? 'سنوي' : 'Yearly'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="lg" className="shadow-lg" onClick={handleUpgrade} disabled={upgradeLoading}>
                                        {upgradeLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                                        {t.settings.billing.upgrade}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar'
                                            ? 'يتم فتح الاشتراك عبر FastSpring في صفحة دفع آمنة.'
                                            : 'Subscriptions open in a secure FastSpring checkout page.'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{locale === 'ar' ? 'حدود الخطة الحالية' : 'Current Plan Limits'}</CardTitle>
                    <CardDescription>
                        {locale === 'ar'
                            ? 'يعرض هذا القسم حدود اشتراكك الحالية بدون أي تدفقات دفع قديمة.'
                            : 'This section shows your current subscription limits without any legacy payment flows.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span>{t.settings.billing.resumes}</span>
                            <span className="font-medium">
                                {planResumeLimit === null
                                    ? (locale === 'ar' ? 'غير محدود' : 'Unlimited')
                                    : locale === 'ar'
                                        ? `${planResumeLimit} حد`
                                        : `${planResumeLimit} slots`}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? 'حد إنشاء السير الذاتية المتاح ضمن خطتك الحالية.'
                                : 'Resume creation allowance included with your current plan.'}
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span>{locale === 'ar' ? 'أرصدة الذكاء الاصطناعي' : 'AI Credits'}</span>
                            <span className="font-medium">
                                {planCredits === null
                                    ? (locale === 'ar' ? 'غير محدود' : 'Unlimited')
                                    : `${remainingCredits} / ${baseCredits}`}
                            </span>
                        </div>
                        {planCredits === null ? (
                            <p className="text-xs text-muted-foreground">
                                {locale === 'ar'
                                    ? 'تشمل هذه الخطة استخداماً غير محدوداً للأدوات المدعومة بالذكاء الاصطناعي.'
                                    : 'This plan includes unlimited access to AI-powered tools.'}
                            </p>
                        ) : (
                            <>
                                <Progress value={creditUsagePercent} className="h-2" />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {topupCredits > 0
                                        ? (locale === 'ar'
                                            ? `يشمل ذلك ${topupCredits} رصيداً إضافياً فوق الرصيد الشهري الأساسي.`
                                            : `This includes ${topupCredits} top-up credits in addition to your monthly base.`)
                                        : (locale === 'ar'
                                            ? 'يتم تجديد الرصيد الأساسي مع كل دورة اشتراك نشطة.'
                                            : 'Base credits refresh with each active subscription cycle.')}
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.billing.paymentMethod}</CardTitle>
                    <CardDescription>{t.settings.billing.paymentMethodDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
                        <p className="mb-1 text-sm font-medium">
                            {locale === 'ar'
                                ? 'FastSpring هو مزود الاشتراك الرسمي لمنصة Seera AI.'
                                : 'FastSpring is the official subscription provider for Seera AI.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? 'التجديدات، الإلغاء، والإيصالات تتم من خلال بوابة FastSpring الآمنة.'
                                : 'Renewals, cancellations, and receipts are handled through the secure FastSpring portal.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.billing.billingHistory}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? 'ستتلقى إيصال كل عملية دفع عبر البريد الإلكتروني، ويمكنك مراجعة حالة الاشتراك من FastSpring.'
                            : 'You receive receipts by email for each charge, and subscription activity can be reviewed in FastSpring.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
