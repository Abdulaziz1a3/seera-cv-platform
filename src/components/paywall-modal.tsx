'use client';

import { useState } from 'react';
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
import { Check, Crown, Sparkles, Zap, Shield, FileText, Download, Loader2 } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: 'ai' | 'template' | 'download' | 'docx' | 'cover-letter';
}

export function PaywallModal({ isOpen, onClose, feature }: PaywallModalProps) {
    const { locale } = useLocale();
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
            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: 'pro',
                    interval: billing,
                }),
            });

            const { url, error } = await response.json();
            if (error) throw new Error(error);

            window.location.href = url;
        } catch (error) {
            console.error('Upgrade error:', error);
        } finally {
            setLoading(false);
        }
    };

    const proFeatures = [
        locale === 'ar' ? 'تحميل غير محدود للسير الذاتية' : 'Unlimited resume downloads',
        locale === 'ar' ? '50+ قالب احترافي' : '50+ premium templates',
        locale === 'ar' ? 'مساعد AI غير محدود' : 'Unlimited AI assistant',
        locale === 'ar' ? 'تصدير PDF و Word' : 'PDF & Word export',
        locale === 'ar' ? 'رسائل تغطية بالـ AI' : 'AI cover letters',
        locale === 'ar' ? 'تحليل ATS مفصل' : 'Detailed ATS analysis',
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
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        {locale === 'ar' ? 'ضمان استرداد 7 أيام' : '7-day money-back guarantee'}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
