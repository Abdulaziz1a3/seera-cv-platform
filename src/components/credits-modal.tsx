"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatOfficialPrice } from '@/lib/billing-config';

type CreditSummary = {
    baseCredits: number;
    topupCredits: number;
    usedCredits: number;
    remainingCredits: number;
    availableCredits: number;
    resetAt: string | Date;
    minRechargeSar: number;
    maxRechargeSar: number;
    sarPerCredit: number;
    minRechargeUsd: number;
    maxRechargeUsd: number;
    usdPerCredit: number;
    creditsPerUsd: number;
};

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCredits?: Partial<CreditSummary> | null;
}

export function CreditsModal({ isOpen, onClose, initialCredits }: CreditsModalProps) {
    const { locale } = useLocale();
    const router = useRouter();
    const [summary, setSummary] = useState<CreditSummary | null>(initialCredits as CreditSummary | null);
    const [amountUsd, setAmountUsd] = useState<number>(initialCredits?.minRechargeUsd ?? 1.33);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const formattedReset = useMemo(() => {
        if (!summary?.resetAt) return '';
        const date = typeof summary.resetAt === 'string' ? new Date(summary.resetAt) : summary.resetAt;
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
        });
    }, [summary?.resetAt, locale]);

    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;
        const loadCredits = async () => {
            setFetching(true);
            try {
                const res = await fetch('/api/credits');
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                setSummary(data);
                const min = data?.minRechargeUsd || 1.33;
                setAmountUsd((prev) => (prev < min ? min : prev));
            } catch {
                // Ignore - modal still shows
            } finally {
                if (mounted) setFetching(false);
            }
        };
        loadCredits();
        return () => {
            mounted = false;
        };
    }, [isOpen]);

    const handleCheckout = async () => {
        const min = summary?.minRechargeUsd || 1.33;
        const max = summary?.maxRechargeUsd || 2.67;
        if (!amountUsd || Number.isNaN(amountUsd) || amountUsd < min) {
            toast.error(locale === 'ar'
                ? `الحد الأدنى ${formatOfficialPrice(min, locale)}`
                : `Minimum recharge is ${formatOfficialPrice(min, locale)}`);
            return;
        }
        if (amountUsd > max) {
            toast.error(locale === 'ar'
                ? `الحد الأقصى ${formatOfficialPrice(max, locale)}`
                : `Maximum recharge is ${formatOfficialPrice(max, locale)}`);
            return;
        }

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

            const res = await fetch('/api/credits/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountUsd,
                    returnUrl: window.location.href,
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || 'Failed to start recharge');
            }
            window.open(payload.url, '_blank');
            toast.success(locale === 'ar' ? 'تم فتح صفحة الدفع في تبويب جديد' : 'Payment page opened in a new tab');
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start recharge';
            toast.error(locale === 'ar' ? `تعذر إعادة الشحن: ${message}` : `Recharge failed: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const minRecharge = summary?.minRechargeUsd || 1.33;
    const maxRecharge = summary?.maxRechargeUsd || 2.67;
    const displayRemaining = summary ? summary.remainingCredits : 0;
    const displayBase = summary ? summary.baseCredits : 50;
    const estimatedCredits = summary ? Math.round(amountUsd * summary.creditsPerUsd) : 0;
    const presetAmounts = [minRecharge, maxRecharge];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {locale === 'ar' ? 'رصيد الذكاء الاصطناعي' : 'AI Credits'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {locale === 'ar'
                            ? 'لقد انتهى رصيدك. اشحن رصيدك لمواصلة استخدام ميزات الذكاء الاصطناعي.'
                            : 'You are out of credits. Recharge to keep using AI features.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="rounded-lg border p-4 text-center">
                        {fetching ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {displayRemaining} / {displayBase}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {locale === 'ar' ? 'رصيد متاح / الرصيد الشهري' : 'Available / monthly base'}
                                </p>
                                {formattedReset && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {locale === 'ar' ? `يعاد التعيين في ${formattedReset}` : `Resets on ${formattedReset}`}
                                    </p>
                                )}
                                {summary?.topupCredits ? (
                                    <Badge variant="outline" className="mt-2">
                                        {locale === 'ar'
                                            ? `رصيد إضافي ${summary.topupCredits}`
                                            : `Extra credits ${summary.topupCredits}`}
                                    </Badge>
                                ) : null}
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {locale === 'ar' ? 'مبلغ الشحن (USD)' : 'Recharge amount (USD)'}
                        </label>
                        <Input
                            type="number"
                            min={minRecharge}
                            max={maxRecharge}
                            step="0.01"
                            value={amountUsd}
                            onChange={(e) => setAmountUsd(Number(e.target.value))}
                        />
                        <div className="flex gap-2">
                            {presetAmounts.map((amount) => (
                                <Button
                                    key={amount}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmountUsd(amount)}
                                >
                                    {formatOfficialPrice(amount, locale)}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? `شحن تقريبي ${estimatedCredits} رصيد`
                                : `Approximately ${estimatedCredits} credits`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {locale === 'ar'
                                ? `الحد الأدنى ${formatOfficialPrice(minRecharge, locale)} - الحد الأقصى ${formatOfficialPrice(maxRecharge, locale)}`
                                : `Min ${formatOfficialPrice(minRecharge, locale)} - Max ${formatOfficialPrice(maxRecharge, locale)}`}
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin me-2" />
                        ) : null}
                        {locale === 'ar' ? 'اشحن الرصيد' : 'Recharge Credits'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
