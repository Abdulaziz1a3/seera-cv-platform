'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
    User,
    Mail,
    Lock,
    Bell,
    CreditCard,
    Shield,
    Loader2,
    Save,
    Trash2,
    Eye,
    EyeOff,
    Check,
    X,
    Gift,
    Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/components/providers/locale-provider';

export const dynamic = 'force-dynamic';

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

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const { t, locale } = useLocale();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(session?.user?.name || '');
    const [showPassword, setShowPassword] = useState(false);
    const [notifications, setNotifications] = useState({
        resumeTips: true,
        jobAlerts: true,
        productUpdates: false,
        marketing: false,
    });
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
        if (searchParams.get('giftSuccess')) {
            toast.success(locale === 'ar' ? 'تم شراء الهدية بنجاح!' : 'Gift purchase complete!');
            fetchGifts();
        }
        if (searchParams.get('giftCanceled')) {
            toast.info(locale === 'ar' ? 'تم إلغاء عملية الشراء.' : 'Gift purchase canceled.');
        }
    }, [searchParams, locale]);

    const handleSaveProfile = async () => {
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 1000));
        toast.success(locale === 'ar' ? 'تم حفظ التغييرات' : 'Changes saved successfully');
        setIsLoading(false);
    };

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

    const handleGiftCheckout = async () => {
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
    const formatGiftInterval = (interval: GiftListItem['interval']) => (interval === 'YEARLY' ? (locale === 'ar' ? 'سنة' : 'Yearly') : (locale === 'ar' ? 'شهر' : 'Monthly'));
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t.settings.title}</h1>
                <p className="text-muted-foreground mt-1">{t.settings.description}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.profile}</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.security}</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.notifications}</span>
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.billing}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {t.settings.profile.personalInfo}
                            </CardTitle>
                            <CardDescription>{t.settings.profile.personalInfoDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white">
                                    {session?.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <Button variant="outline" size="sm">
                                        {locale === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, PNG, GIF. Max 2MB
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t.settings.profile.fullName}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.settings.profile.email}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t.settings.profile.emailHint}
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleSaveProfile} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 me-2" />
                                )}
                                {t.settings.profile.saveChanges}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <Trash2 className="h-5 w-5" />
                                {t.settings.profile.dangerZone}
                            </CardTitle>
                            <CardDescription>{t.settings.profile.dangerZoneDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                                <div>
                                    <h4 className="font-medium">{t.settings.profile.deleteAccount}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t.settings.profile.deleteAccountDesc}
                                    </p>
                                </div>
                                <Button variant="destructive">{t.settings.profile.deleteAccount}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                {t.settings.security.password}
                            </CardTitle>
                            <CardDescription>{t.settings.security.passwordDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">{t.settings.security.currentPassword}</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{t.settings.security.newPassword}</Label>
                                    <Input id="new-password" type="password" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">{t.settings.security.confirmPassword}</Label>
                                    <Input id="confirm-password" type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <Button>{t.settings.security.updatePassword}</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {t.settings.security.twoFactor}
                            </CardTitle>
                            <CardDescription>{t.settings.security.twoFactorDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                {t.settings.security.notEnabled}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t.settings.security.protect}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline">{t.settings.security.enable2fa}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                {t.settings.notifications.emailNotifications}
                            </CardTitle>
                            <CardDescription>{t.settings.notifications.emailNotificationsDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                {
                                    id: 'resumeTips',
                                    label: t.settings.notifications.resumeTips,
                                    description: t.settings.notifications.resumeTipsDesc,
                                },
                                {
                                    id: 'jobAlerts',
                                    label: t.settings.notifications.jobAlerts,
                                    description: t.settings.notifications.jobAlertsDesc,
                                },
                                {
                                    id: 'productUpdates',
                                    label: t.settings.notifications.productUpdates,
                                    description: t.settings.notifications.productUpdatesDesc,
                                },
                                {
                                    id: 'marketing',
                                    label: t.settings.notifications.marketing,
                                    description: t.settings.notifications.marketingDesc,
                                },
                            ].map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                >
                                    <div>
                                        <h4 className="font-medium">{notification.label}</h4>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[notification.id as keyof typeof notifications]}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, [notification.id]: checked })
                                        }
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                {t.settings.billing.currentPlan}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold">
                                            {locale === 'ar' ? 'خطة برو' : 'Pro Plan'}
                                        </h3>
                                        <Badge>{t.settings.billing.current}</Badge>
                                    </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {locale === 'ar' ? 'سير ذاتية غير محدودة، 100 توليد AI شهرياً' : 'Unlimited resumes, 100 AI generations/month'}
                                        </p>
                                </div>
                                <Button size="lg" className="shadow-lg">
                                    {t.settings.billing.upgrade}
                                </Button>
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-6">
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
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
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
                                        placeholder={locale === 'ar' ? 'example@email.com' : 'example@email.com'}
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
                                                {t.settings.billing.gifts.recipientLabel}: {gift.recipientEmail || (locale === 'ar' ? 'غير محدد' : 'Not specified')}
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
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t.settings.billing.noPaymentMethod}
                                </p>
                                <Button variant="outline">{t.settings.billing.addPaymentMethod}</Button>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
