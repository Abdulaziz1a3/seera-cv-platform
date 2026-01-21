'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import {
    FileText,
    Target,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    Rocket,
} from 'lucide-react';

const ONBOARDING_KEY = 'seera_onboarding_completed';

export function WelcomeModal() {
    const { data: session } = useSession();
    const { locale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    const firstName = session?.user?.name?.split(' ')[0] || '';

    useEffect(() => {
        // Check if user has completed onboarding
        const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
        if (!hasCompleted && session?.user) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setIsOpen(true), 500);
            return () => clearTimeout(timer);
        }
    }, [session]);

    const handleComplete = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setIsOpen(false);
    };

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setIsOpen(false);
    };

    const steps = [
        {
            title: locale === 'ar' ? `مرحباً ${firstName}! 👋` : `Welcome ${firstName}! 👋`,
            description: locale === 'ar'
                ? 'Seera AI يساعدك في إنشاء سيرة ذاتية احترافية تتجاوز أنظمة ATS وتصل إلى مسؤولي التوظيف.'
                : 'Seera AI helps you create professional resumes that pass ATS systems and reach recruiters.',
            icon: Rocket,
        },
        {
            title: locale === 'ar' ? 'إنشاء سيرتك الذاتية' : 'Create Your Resume',
            description: locale === 'ar'
                ? 'ابدأ من الصفر أو استورد سيرتك الحالية. سنساعدك في كل خطوة.'
                : 'Start from scratch or import your existing resume. We\'ll guide you through every step.',
            icon: FileText,
        },
        {
            title: locale === 'ar' ? 'تحسين ATS تلقائي' : 'Automatic ATS Optimization',
            description: locale === 'ar'
                ? 'نحلل سيرتك ونقدم نصائح فورية لتحسين فرصك في تجاوز أنظمة التتبع.'
                : 'We analyze your resume and provide instant tips to improve your chances of passing tracking systems.',
            icon: Target,
        },
        {
            title: locale === 'ar' ? 'مساعد AI الذكي' : 'Smart AI Assistant',
            description: locale === 'ar'
                ? 'استخدم الذكاء الاصطناعي لتوليد نقاط قوية تبرز إنجازاتك.'
                : 'Use AI to generate powerful bullet points that highlight your achievements.',
            icon: Sparkles,
        },
    ];

    const currentStep = steps[step];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <currentStep.icon className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
                    <DialogDescription className="text-base">
                        {currentStep.description}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 my-4">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`h-2 rounded-full transition-all ${i === step
                                ? 'w-6 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                }`}
                        />
                    ))}
                </div>

                <div className="flex gap-2 mt-4">
                    {step < steps.length - 1 ? (
                        <>
                            <Button variant="ghost" onClick={handleSkip} className="flex-1">
                                {locale === 'ar' ? 'تخطي' : 'Skip'}
                            </Button>
                            <Button onClick={() => setStep(step + 1)} className="flex-1">
                                {locale === 'ar' ? 'التالي' : 'Next'}
                                <ArrowRight className="h-4 w-4 ms-2" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={() => {
                                handleComplete();
                                window.location.href = '/dashboard/resumes/new';
                            }}
                        >
                            <CheckCircle2 className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
