'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/providers/locale-provider';
import { X, Gift, Sparkles } from 'lucide-react';

const EXIT_INTENT_KEY = 'seera_exit_intent_shown';
const EXIT_INTENT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

interface ExitIntentProps {
    variant?: 'discount' | 'signup' | 'guide';
}

export function ExitIntentPopup({ variant = 'signup' }: ExitIntentProps) {
    const { locale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleExitIntent = useCallback((e: MouseEvent) => {
        // Only trigger on desktop when mouse leaves viewport from top
        if (e.clientY <= 0) {
            // Check cooldown
            const lastShown = localStorage.getItem(EXIT_INTENT_KEY);
            if (lastShown) {
                const elapsed = Date.now() - parseInt(lastShown, 10);
                if (elapsed < EXIT_INTENT_COOLDOWN) return;
            }

            setIsOpen(true);
            localStorage.setItem(EXIT_INTENT_KEY, Date.now().toString());
            document.removeEventListener('mouseout', handleExitIntent);
        }
    }, []);

    useEffect(() => {
        // Only add listener after a delay (don't show immediately)
        const timer = setTimeout(() => {
            document.addEventListener('mouseout', handleExitIntent);
        }, 5000);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseout', handleExitIntent);
        };
    }, [handleExitIntent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would send to your email service
        setSubmitted(true);
        setTimeout(() => setIsOpen(false), 2000);
    };

    const content = {
        discount: {
            icon: Gift,
            title: locale === 'ar' ? 'انتظر! خصم خاص لك' : 'Wait! Special Offer for You',
            description: locale === 'ar'
                ? 'احصل على خصم 20% على الاشتراك الأول. العرض ينتهي قريباً!'
                : 'Get 20% off your first subscription. Offer expires soon!',
            cta: locale === 'ar' ? 'احصل على الخصم' : 'Claim Discount',
        },
        signup: {
            icon: Sparkles,
            title: locale === 'ar' ? 'قبل أن تذهب...' : 'Before You Go...',
            description: locale === 'ar'
                ? 'احصل على دليل مجاني: 10 أخطاء شائعة في السيرة الذاتية'
                : 'Get our free guide: 10 Common Resume Mistakes to Avoid',
            cta: locale === 'ar' ? 'أرسل لي الدليل' : 'Send Me the Guide',
        },
        guide: {
            icon: Sparkles,
            title: locale === 'ar' ? 'هل تحتاج مساعدة؟' : 'Need Some Help?',
            description: locale === 'ar'
                ? 'دعنا نساعدك في إنشاء سيرة ذاتية احترافية في دقائق'
                : 'Let us help you create a professional resume in minutes',
            cta: locale === 'ar' ? 'ابدأ الآن' : 'Get Started',
        },
    }[variant];

    if (submitted) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-8">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            {locale === 'ar' ? 'شكراً لك!' : 'Thank You!'}
                        </h3>
                        <p className="text-muted-foreground">
                            {locale === 'ar'
                                ? 'تحقق من بريدك الإلكتروني قريباً'
                                : 'Check your email shortly'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <content.icon className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">{content.title}</DialogTitle>
                    <DialogDescription className="text-base">
                        {content.description}
                    </DialogDescription>
                </DialogHeader>

                {variant === 'guide' ? (
                    <div className="mt-4">
                        <Button asChild className="w-full" size="lg">
                            <Link href="/register">
                                {content.cta}
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                        <Input
                            type="email"
                            placeholder={locale === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" size="lg">
                            {content.cta}
                        </Button>
                    </form>
                )}

                <p className="text-xs text-center text-muted-foreground mt-4">
                    {locale === 'ar'
                        ? 'لن نرسل لك رسائل غير مرغوبة. إلغاء الاشتراك في أي وقت.'
                        : 'No spam. Unsubscribe anytime.'}
                </p>
            </DialogContent>
        </Dialog>
    );
}
