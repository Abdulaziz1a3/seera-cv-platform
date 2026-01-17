'use client';

import { useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

interface AIGeneratorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'summary' | 'bullets' | 'skills' | 'improve';
    context?: {
        targetRole?: string;
        position?: string;
        company?: string;
        content?: string;
        existingSkills?: string[];
    };
    onInsert: (content: string | string[]) => void;
}

export function AIGeneratorDialog({
    isOpen,
    onClose,
    type,
    context = {},
    onInsert,
}: AIGeneratorDialogProps) {
    const { locale } = useLocale();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | string[] | null>(null);
    const [copied, setCopied] = useState(false);

    const titles: Record<string, { ar: string; en: string }> = {
        summary: { ar: 'إنشاء ملخص مهني', en: 'Generate Professional Summary' },
        bullets: { ar: 'إنشاء نقاط إنجازات', en: 'Generate Achievement Bullets' },
        skills: { ar: 'اقتراح مهارات', en: 'Suggest Skills' },
        improve: { ar: 'تحسين النص', en: 'Improve Text' },
    };

    const generate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: type === 'improve' ? 'improve' : type,
                    locale,
                    ...context,
                }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setResult(data.result);
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل الإنشاء' : 'Generation failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        const text = Array.isArray(result) ? result.join('\n') : result || '';
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(locale === 'ar' ? 'تم النسخ' : 'Copied!');
    };

    const handleInsert = () => {
        if (result) {
            onInsert(result);
            onClose();
            toast.success(locale === 'ar' ? 'تم الإضافة' : 'Inserted!');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {locale === 'ar' ? titles[type].ar : titles[type].en}
                    </DialogTitle>
                    <DialogDescription>
                        {locale === 'ar'
                            ? 'سيقوم الذكاء الاصطناعي بإنشاء محتوى احترافي مناسب للسوق السعودي'
                            : 'AI will generate professional content suitable for the Saudi market'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!result ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            {loading ? (
                                <>
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground">
                                        {locale === 'ar' ? 'جارٍ الإنشاء...' : 'Generating...'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-12 w-12 text-primary mb-4" />
                                    <p className="text-muted-foreground text-center mb-4">
                                        {locale === 'ar'
                                            ? 'اضغط على الزر أدناه لإنشاء المحتوى'
                                            : 'Click the button below to generate content'}
                                    </p>
                                    <Button onClick={generate}>
                                        <Sparkles className="h-4 w-4 me-2" />
                                        {locale === 'ar' ? 'إنشاء' : 'Generate'}
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Array.isArray(result) ? (
                                <ul className="space-y-2">
                                    {result.map((item, i) => (
                                        <li
                                            key={i}
                                            className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2"
                                        >
                                            <span className="text-primary font-bold">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Textarea
                                    value={result}
                                    readOnly
                                    className="min-h-[150px] resize-none"
                                />
                            )}

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCopy}>
                                    {copied ? (
                                        <Check className="h-4 w-4 me-1" />
                                    ) : (
                                        <Copy className="h-4 w-4 me-1" />
                                    )}
                                    {locale === 'ar' ? 'نسخ' : 'Copy'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={generate}>
                                    <RefreshCw className="h-4 w-4 me-1" />
                                    {locale === 'ar' ? 'إعادة' : 'Regenerate'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {result && (
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button onClick={handleInsert}>
                            <Check className="h-4 w-4 me-1" />
                            {locale === 'ar' ? 'إضافة للسيرة' : 'Insert to Resume'}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
