'use client';

import { useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Wand2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

interface AIPolishButtonProps {
    value: string;
    onApply: (newValue: string) => void;
    type?: 'summary' | 'bullet' | 'description';
    className?: string;
    variant?: 'default' | 'ghost' | 'outline' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AIPolishButton({
    value,
    onApply,
    type = 'description',
    className,
    variant = 'ghost',
    size = 'icon'
}: AIPolishButtonProps) {
    const { t, locale } = useLocale();
    const [loading, setLoading] = useState(false);

    const handlePolish = async (instruction: string) => {
        if (!value || value.trim().length < 5) {
            toast.error(locale === 'ar' ? 'النص قصير جداً' : 'Text is too short to polish');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/ai/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: value,
                    instruction: instruction,
                    type: type
                }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to polish content');
            }

            onApply(data.polishedText);
            toast.success(
                locale === 'ar' ? 'تم تحسين النص بنجاح ✨' : 'Content polished successfully ✨'
            );
        } catch (error) {
            console.error('Polish error:', error);
            toast.error(locale === 'ar' ? 'فشل تحسين النص' : 'Failed to polish content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                    disabled={loading}
                    title={locale === 'ar' ? 'تحسين باستخدام الذكاء الاصطناعي' : 'Polish with AI'}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                        <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handlePolish('professional')} disabled={loading}>
                    <Wand2 className="h-4 w-4 me-2 text-blue-500" />
                    {locale === 'ar' ? 'تحويل لأسلوب مهني' : 'Make Professional'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePolish('fix_grammar')} disabled={loading}>
                    <Check className="h-4 w-4 me-2 text-green-500" />
                    {locale === 'ar' ? 'تصحيح الأخطاء' : 'Fix Grammar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePolish('make_concise')} disabled={loading}>
                    <span className="me-2 text-xs border rounded px-1">Short</span>
                    {locale === 'ar' ? 'اختصار النص' : 'Make Concise'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePolish('expand')} disabled={loading}>
                    <span className="me-2 text-xs border rounded px-1">Long</span>
                    {locale === 'ar' ? 'توسيع الشرح' : 'Expand Text'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
