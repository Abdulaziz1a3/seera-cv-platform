'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, Copy, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/components/providers/locale-provider';

type GiftListItem = {
    id: string;
    token: string;
    plan: 'PRO' | 'ENTERPRISE';
    interval: 'MONTHLY' | 'YEARLY';
    status: 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'CANCELED';
    recipientEmail?: string | null;
    message?: string | null;
    amountSar?: number | null;
    expiresAt?: string | null;
    createdAt?: string | null;
    redeemedAt?: string | null;
    redeemedBy?: { email?: string | null; name?: string | null } | null;
};

export default function BillingGiftsPage() {
    const { t, locale } = useLocale();
    const router = useRouter();
    const giftParamHandled = useRef(false);

    const [creditsSummary, setCreditsSummary] = useState<{
        baseCredits: number;
        topupCredits: number;
        usedCredits: number;
        remainingCredits: number;
    } | null>(null);
    const [giftForm, setGiftForm] = useState({
        plan: 'pro',
        interval: 'monthly',
        recipientEmail: '',
        message: '',
    });
    const [giftCheckoutLoading, setGiftCheckoutLoading] = useState(false);
    const [giftsLoading, setGiftsLoading] = useState(false);
    const [gifts, setGifts] = useState<GiftListItem[]>([]);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [paymentProfileMissing, setPaymentProfileMissing] = useState(false);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [billingStatus, setBillingStatus] = useState<{
        plan: 'FREE' | 'PRO' | 'ENTERPRISE';
        status: string;
        isActive: boolean;
    } | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/api/credits')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!mounted || !data) return;
                setCreditsSummary({
                    baseCredits: data.baseCredits ?? 50,
                    topupCredits: data.topupCredits ?? 0,
                    usedCredits: data.usedCredits ?? 0,
                    remainingCredits: data.remainingCredits ?? 0,
                });
            })
            .catch(() => null);
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        fetch('/api/profile')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!mounted || !data) return;
                setPaymentProfileMissing(!data.phone);
            })
            .catch(() => null);
        return () => {
            mounted = false;
        };
    }, []);

    const fetchGifts = async () => {
        setGiftsLoading(true);
        try {
            const res = await fetch('/api/gifts/list');
            if (!res.ok) {
                throw new Error('Failed to load gifts');
            }
            const data = await res.json();
            setGifts(Array.isArray(data.gifts) ? data.gifts : []);
        } catch {
            setGifts([]);
        } finally {
            setGiftsLoading(false);
        }
    };

    useEffect(() => {
        fetchGifts();
    }, []);

    useEffect(() => {
        let mounted = true;
        fetch('/api/billing/status')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!mounted || !data) return;
                setBillingStatus({
                    plan: data.plan || 'FREE',
                    status: data.status || 'UNPAID',
                    isActive: Boolean(data.isActive),
                });
            })
            .catch(() => null);
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (giftParamHandled.current || typeof window === 'undefined') {
            return;
        }
        giftParamHandled.current = true;
        const params = new URLSearchParams(window.location.search);
        if (params.get('giftSuccess')) {
            toast.success(locale === 'ar' ? 'تم شراء الهدية بنجاح!' : 'Gift purchase complete!');
            fetchGifts();
        }
        if (params.get('giftCanceled')) {
            toast.info(locale === 'ar' ? 'تم إلغاء عملية الشراء.' : 'Gift purchase canceled.');
        }
    }, [locale]);

    const baseCredits = creditsSummary?.baseCredits ?? 50;
    const topupCredits = creditsSummary?.topupCredits ?? 0;
    const usedCredits = creditsSummary?.usedCredits ?? 0;
    const remainingCredits = creditsSummary?.remainingCredits ?? Math.max(0, baseCredits - usedCredits);
    const totalCredits = baseCredits + topupCredits;
    const creditUsagePercent = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;

    const openCreditsModal = () => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('ai-credits-exceeded', { detail: creditsSummary }));
    };

    const handleUpgrade = async (plan: 'pro' | 'enterprise', interval: 'monthly' | 'yearly') => {
        if (paymentProfileMissing) {
            toast.error(locale === 'ar'
                ? 'يرجى إضافة رقم الهاتف لإتمام الدفع.'
                : 'Please add your phone number to complete payments.');
            router.push('/dashboard/settings');
            return;
        }
        setUpgradeLoading(true);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, interval }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || 'Failed to start checkout');
            }
            if (payload?.url) {
                window.location.href = payload.url;
                return;
            }
            throw new Error(locale === 'ar' ? 'رابط الدفع غير متوفر' : 'Checkout URL missing');
        } catch (error: any) {
            toast.error(error?.message || (locale === 'ar' ? 'تعذر بدء الدفع' : 'Failed to start payment'));
        } finally {
            setUpgradeLoading(false);
        }
    };

    const handleGiftCheckout = async () => {
        if (paymentProfileMissing) {
            toast.error(locale === 'ar'
                ? 'يرجى إضافة رقم الهاتف لإتمام الدفع.'
                : 'Please add your phone number to complete payments.');
            router.push('/dashboard/settings');
            return;
        }
        setGiftCheckoutLoading(true);
        try {
            const response = await fetch('/api/gifts/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: giftForm.plan,
                    interval: giftForm.interval,
                    recipientEmail: giftForm.recipientEmail || undefined,
                    message: giftForm.message || undefined,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = payload?.error || (locale === 'ar' ? 'فشل إنشاء الهدية' : 'Failed to create gift');
                throw new Error(message);
            }

            if (payload?.url) {
                window.location.href = payload.url;
                return;
            }

            throw new Error(locale === 'ar' ? 'رابط الدفع غير متوفر' : 'Checkout URL missing');
        } catch (error: any) {
            toast.error(error?.message || (locale === 'ar' ? 'فشل إنشاء الهدية' : 'Failed to create gift'));
        } finally {
            setGiftCheckoutLoading(false);
        }
    };

    const handleCopyGift = async (token: string) => {
        if (typeof window === 'undefined') return;
        try {
            const url = `${window.location.origin}/gift/${token}`;
            await navigator.clipboard.writeText(url);
            toast.success(locale === 'ar' ? 'تم نسخ رابط الهدية' : 'Gift link copied');
        } catch {
            toast.error(locale === 'ar' ? 'تعذر نسخ الرابط' : 'Failed to copy link');
        }
    };

    const formatGiftPlan = (plan: GiftListItem['plan']) => (plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro');
    const formatGiftInterval = (interval: GiftListItem['interval']) =>
        interval === 'YEARLY' ? (locale === 'ar' ? 'سنوي' : 'Yearly') : (locale === 'ar' ? 'شهري' : 'Monthly');
    const formatGiftStatus = (status: GiftListItem['status']) => {
        if (status === 'PENDING') return locale === 'ar' ? 'جاهزة' : 'Ready';
        if (status === 'REDEEMED') return locale === 'ar' ? 'مستخدمة' : 'Claimed';
        if (status === 'EXPIRED') return locale === 'ar' ? 'منتهية' : 'Expired';
        return locale === 'ar' ? 'غير نشطة' : 'Inactive';
    };
    const formatGiftDate = (value?: string | null) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const currentPlanLabel = (() => {
        const plan = billingStatus?.plan || 'FREE';
        if (plan === 'PRO') return locale === 'ar' ? 'خطة برو' : 'Pro Plan';
        if (plan === 'ENTERPRISE') return locale === 'ar' ? 'خطة المؤسسات' : 'Enterprise Plan';
        return locale === 'ar' ? 'الخطة المجانية' : 'Free Plan';
    })();
    const currentPlanDescription = (() => {
        const plan = billingStatus?.plan || 'FREE';
        if (plan === 'PRO') {
            return locale === 'ar'
                ? 'سير ذاتية غير محدودة، 100 توليد AI شهرياً'
                : 'Unlimited resumes, 100 AI generations/month';
        }
        if (plan === 'ENTERPRISE') {
            return locale === 'ar'
                ? 'سير ذاتية غير محدودة، توليد AI غير محدود، دعم مميز'
                : 'Unlimited resumes, unlimited AI, priority support';
        }
        return locale === 'ar'
            ? 'سيرة ذاتية واحدة، 50 رصيد AI شهرياً'
            : '1 resume, 50 AI credits/month';
    })();
    const upgradeTargetPlan = 'pro';
    const upgradeLabel = (() => {
        const plan = billingStatus?.plan || 'FREE';
        if (plan === 'PRO') return locale === 'ar' ? 'تمديد الاشتراك' : 'Extend subscription';
        if (plan === 'ENTERPRISE') return locale === 'ar' ? 'خطة المؤسسات موقوفة مؤقتاً' : 'Enterprise paused';
        return t.settings.billing.upgrade;
    })();
    const upgradeDisabled = billingStatus?.plan === 'ENTERPRISE';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t.nav.billing}</h1>
                <p className="text-muted-foreground mt-1">
                    {locale === 'ar'
                        ? 'إدارة الاشتراك والرصيد وإهداء الوصول.'
                        : 'Manage your subscription, credits, and gift access.'}
                </p>
            </div>

            <Card>
                {paymentProfileMissing && (
                    <div className="px-6 pt-6">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            {locale === 'ar'
                                ? 'أكمل ملف الدفع بإضافة رقم هاتف سعودي لإتمام عمليات الدفع.'
                                : 'Complete your payment profile by adding a Saudi phone number.'}
                            <Link href="/dashboard/settings" className="ms-2 underline">
                                {locale === 'ar' ? 'تحديث الملف الشخصي' : 'Update profile'}
                            </Link>
                        </div>
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        {t.settings.billing.currentPlan}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold">
                                    {currentPlanLabel}
                                </h3>
                                <Badge>{t.settings.billing.current}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {currentPlanDescription}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
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
                            <Button
                                size="lg"
                                className="shadow-lg"
                                onClick={() => handleUpgrade(upgradeTargetPlan as 'pro' | 'enterprise', billingInterval)}
                                disabled={upgradeLoading || upgradeDisabled}
                            >
                                {upgradeLoading ? (
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                ) : null}
                                {upgradeLabel}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {locale === 'ar'
                                    ? 'الاشتراكات غير متجددة تلقائياً. قم بالتمديد للحفاظ على الوصول.'
                                    : 'Subscriptions are prepaid and do not auto-renew. Extend to keep access active.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <h4 className="font-medium">{t.settings.billing.usageThisMonth}</h4>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{t.settings.billing.resumes}</span>
                                    <span className="font-medium">1 / 1</span>
                                </div>
                                <Progress value={100} className="h-2" />
                            </div>
                            <div className="p-4 rounded-lg border">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{locale === 'ar' ? 'رصيد الذكاء الاصطناعي' : 'AI Credits'}</span>
                                    <span className="font-medium">
                                        {remainingCredits} / {baseCredits}
                                    </span>
                                </div>
                                <Progress value={creditUsagePercent} className="h-2" />
                                {topupCredits > 0 && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {locale === 'ar'
                                            ? `رصيد إضافي: ${topupCredits}`
                                            : `Top-ups: ${topupCredits}`}
                                    </p>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={openCreditsModal}
                                >
                                    {locale === 'ar' ? 'اشحن الرصيد' : 'Recharge credits'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        {t.settings.billing.gifts.title}
                    </CardTitle>
                    <CardDescription>{t.settings.billing.gifts.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{t.settings.billing.gifts.planLabel}</Label>
                            <Select
                                value={giftForm.plan}
                                onValueChange={(value) => setGiftForm((prev) => ({ ...prev, plan: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t.settings.billing.gifts.planLabel} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t.settings.billing.gifts.intervalLabel}</Label>
                            <Select
                                value={giftForm.interval}
                                onValueChange={(value) => setGiftForm((prev) => ({ ...prev, interval: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t.settings.billing.gifts.intervalLabel} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">{locale === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                                    <SelectItem value="yearly">{locale === 'ar' ? 'سنوي' : 'Yearly'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="gift-recipient">{t.settings.billing.gifts.recipientLabel}</Label>
                            <Input
                                id="gift-recipient"
                                type="email"
                                placeholder="example@email.com"
                                value={giftForm.recipientEmail}
                                onChange={(e) => setGiftForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gift-message">{t.settings.billing.gifts.messageLabel}</Label>
                            <Textarea
                                id="gift-message"
                                rows={3}
                                placeholder={t.settings.billing.gifts.messageHint}
                                value={giftForm.message}
                                onChange={(e) => setGiftForm((prev) => ({ ...prev, message: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            {t.settings.billing.gifts.disclaimer}
                        </p>
                        <Button onClick={handleGiftCheckout} disabled={giftCheckoutLoading}>
                            {giftCheckoutLoading ? (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            ) : (
                                <Gift className="h-4 w-4 me-2" />
                            )}
                            {t.settings.billing.gifts.submit}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.billing.gifts.listTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {giftsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading gifts...'}
                        </div>
                    ) : gifts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.settings.billing.gifts.listEmpty}</p>
                    ) : (
                        gifts.map((gift) => (
                            <div
                                key={gift.id}
                                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">
                                            {formatGiftPlan(gift.plan)} · {formatGiftInterval(gift.interval)}
                                        </span>
                                        <Badge variant="outline">{formatGiftStatus(gift.status)}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t.settings.billing.gifts.recipientLabel}:{' '}
                                        {gift.recipientEmail || (locale === 'ar' ? 'غير محدد' : 'Not specified')}
                                    </p>
                                    {gift.expiresAt && gift.status === 'PENDING' && (
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'تنتهي في' : 'Expires'}: {formatGiftDate(gift.expiresAt)}
                                        </p>
                                    )}
                                    {gift.redeemedAt && gift.status === 'REDEEMED' && (
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'تم الاسترداد في' : 'Claimed on'}: {formatGiftDate(gift.redeemedAt)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleCopyGift(gift.token)}>
                                        <Copy className="h-4 w-4 me-2" />
                                        {t.settings.billing.gifts.copyLink}
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/gift/${gift.token}`} target="_blank">
                                            {t.settings.billing.gifts.openLink}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.billing.paymentMethod}</CardTitle>
                    <CardDescription>{t.settings.billing.paymentMethodDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 border rounded-lg border-dashed">
                        <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">
                            {locale === 'ar'
                                ? 'يتم الدفع عبر روابط TuwaiqPay الآمنة ولا توجد بطاقات محفوظة.'
                                : 'Payments use secure TuwaiqPay links; no cards are stored.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? 'استخدم زر الترقية للمتابعة.'
                                : 'Use the upgrade button to continue.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t.settings.billing.billingHistory}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                            {t.settings.billing.noBillingHistory}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
