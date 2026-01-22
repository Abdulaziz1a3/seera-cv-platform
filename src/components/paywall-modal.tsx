'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: 'ai' | 'template' | 'download' | 'docx' | 'cover-letter';
}

export function PaywallModal({ isOpen, onClose, feature }: PaywallModalProps) {
    const { locale, t } = useLocale();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    const featureMessages: Record<string, { icon: any; ar: string; en: string }> = {
        ai: {
            icon: Sparkles,
            ar: 'لقد استخدمت جميع طلبات الذكاء الاصطناعي المجانية',
            en: 'You\'ve used all your free AI requests',
        },
        template: {
            icon: Crown,
            ar: 'هذا القالب متاح للمشتركين فقط',
            en: 'This template is available for subscribers only',
        },
        download: {
            icon: Download,
            ar: 'لقد استخدمت حد التحميل المجاني',
            en: 'You\'ve used your free download limit',
        },
        docx: {
            icon: FileText,
            ar: 'تصدير Word متاح للمشتركين فقط',
            en: 'Word export is available for subscribers only',
        },
        'cover-letter': {
            icon: FileText,
            ar: 'رسائل التغطية متاحة للمشتركين فقط',
            en: 'Cover letters are available for subscribers only',
        },
    };

    const currentFeature = featureMessages[feature];
    const FeatureIcon = currentFeature.icon;

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const profileRes = await fetch('/api/profile');
            const profile = profileRes.ok ? await profileRes.json() : null;
            if (!profile?.phone) {
                toast.error(locale === 'ar'
                    ? 'يرجى إضافة رقم الهاتف لإتمام الدفع.'
                    : 'Please add your phone number to complete payments.');
                router.push('/dashboard/settings');
                return;
            }

            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: 'pro',
                    interval: billing,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to start checkout');
            }
            if (!payload?.url) {
                throw new Error(locale === 'ar' ? 'رابط الدفع غير متوفر' : 'Checkout URL missing');
            }
            window.location.href = payload.url;
        } catch (error) {
            console.error('Upgrade error:', error);
            const message = error instanceof Error ? error.message : 'Upgrade failed';
            toast.error(locale === 'ar' ? `تعذر بدء الدفع: ${message}` : `Failed to start payment: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const proFeatures = t?.landing?.pricing?.pro?.features ?? [
        locale === 'ar' ? '50 رصيد AI شهرياً' : '50 AI Credits included monthly',
        locale === 'ar' ? '5 سير ذاتية وتصدير PDF/DOCX/TXT متوافق مع ATS' : '5 resumes + ATS-safe PDF/DOCX/TXT exports',
        locale === 'ar' ? 'محاكي ATS مع عرض مسؤول التوظيف ونتيجة القراءة' : 'ATS Simulator with recruiter-view scoring',
        locale === 'ar' ? 'تلخيص ونقاط خبرة بالذكاء الاصطناعي وفق الوظيفة المستهدفة' : 'AI summary & bullet generator for your target role',
        locale === 'ar' ? 'مطابقة الوصف الوظيفي وفجوات الكلمات المفتاحية' : 'Job description match + keyword gap insights',
        locale === 'ar' ? 'GPS مهني لمسارات وظيفية وفجوات مهارات ورواتب السعودية' : 'Career GPS with paths, skill gaps, and Saudi salary ranges',
        locale === 'ar' ? 'تحضير مقابلات مباشر مع مُحاور ذكي' : 'Live Interview Prep with AI interviewer',
        locale === 'ar' ? 'سيرة لينك لصفحة مشاركة احترافية للرابط' : 'Seera Link shareable profile for recruiters',
        locale === 'ar' ? 'تحسين LinkedIn' : 'LinkedIn optimizer',
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <FeatureIcon className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {locale === 'ar' ? 'افتح كل الميزات' : 'Unlock All Features'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {locale === 'ar' ? currentFeature.ar : currentFeature.en}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Billing Toggle */}
                    <div className="flex justify-center gap-2 p-1 bg-muted rounded-lg">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${billing === 'monthly' ? 'bg-white shadow-sm' : ''
                                }`}
                        >
                            {locale === 'ar' ? 'شهري' : 'Monthly'}
                        </button>
                        <button
                            onClick={() => setBilling('yearly')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition relative ${billing === 'yearly' ? 'bg-white shadow-sm' : ''
                                }`}
                        >
                            {locale === 'ar' ? 'سنوي' : 'Yearly'}
                            <Badge className="absolute -top-2 -end-2 text-[10px]">
                                {locale === 'ar' ? 'وفر 17%' : 'Save 17%'}
                            </Badge>
                        </button>
                    </div>

                    {/* Price */}
                    <div className="text-center">
                        <div className="text-4xl font-bold">
                            {billing === 'monthly' ? '39' : '299'}{' '}
                            <span className="text-lg font-normal text-muted-foreground">
                                {locale === 'ar' ? 'ر.س' : 'SAR'}/{billing === 'monthly'
                                    ? (locale === 'ar' ? 'شهر' : 'mo')
                                    : (locale === 'ar' ? 'سنة' : 'yr')
                                }
                            </span>
                        </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                        {proFeatures.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <Button
                        className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        onClick={handleUpgrade}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin me-2" />
                        ) : (
                            <Zap className="h-5 w-5 me-2" />
                        )}
                        {locale === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                    </Button>

                    {/* Trust */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
