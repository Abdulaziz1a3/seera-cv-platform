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
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Download, Loader2, Layout, Palette } from 'lucide-react';
import { downloadStyledPDF, type TemplateLayout, type ThemeColor, THEMES, LAYOUTS } from '@/lib/pdf-templates';
import type { ResumeData } from '@/components/providers/resume-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TemplatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    resume: ResumeData;
}

export function TemplatePicker({ isOpen, onClose, resume }: TemplatePickerProps) {
    const { locale } = useLocale();
    const [selectedLayout, setSelectedLayout] = useState<TemplateLayout>('executive');
    const [selectedTheme, setSelectedTheme] = useState<ThemeColor>('obsidian');
    const [downloading, setDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('layout');

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadStyledPDF(resume, selectedLayout, selectedTheme);
            onClose();
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {locale === 'ar' ? 'تصميم سيرة ذاتية احترافية' : 'Design Professional Resume'}
                    </DialogTitle>
                    <DialogDescription>
                        {locale === 'ar'
                            ? 'اختر القالب والألوان التي تناسب شخصيتك المهنية'
                            : 'Choose the layout and color theme that fits your professional brand'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="layout" className="flex items-center gap-2">
                            <Layout className="h-4 w-4" />
                            {locale === 'ar' ? '1. اختر التخطيط' : '1. Choose Layout'}
                        </TabsTrigger>
                        <TabsTrigger value="theme" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            {locale === 'ar' ? '2. اختر الألوان' : '2. Choose Theme'}
                        </TabsTrigger>
                    </TabsList>

                    {/* LAYOUT SELECTION */}
                    <TabsContent value="layout" className="py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {LAYOUTS.map((layout) => {
                                const isSelected = selectedLayout === layout.id;
                                return (
                                    <button
                                        key={layout.id}
                                        onClick={() => setSelectedLayout(layout.id)}
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all text-start h-full
                                            ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                                : 'border-muted hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-base">
                                                {locale === 'ar' ? layout.name.ar : layout.name.en}
                                            </h3>
                                            {layout.premium && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-0">
                                                    <Crown className="h-3 w-3 me-1" />
                                                    Pro
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {locale === 'ar' ? layout.description.ar : layout.description.en}
                                        </p>

                                        <div className="mt-4 h-24 bg-muted/20 rounded-md border border-muted/20 flex items-center justify-center p-2">
                                            {/* Abstract Preview of Layout */}
                                            <div className={`w-full h-full bg-white shadow-sm flex flex-col p-2 gap-1 overflow-hidden opacity-80 ${layout.id === 'minimalist' ? '' : ''}`}>
                                                {layout.id === 'modern' && (
                                                    <div className="flex h-full gap-1">
                                                        <div className="w-1/3 h-full bg-slate-200 rounded-[1px]" />
                                                        <div className="w-2/3 h-full flex flex-col gap-1">
                                                            <div className="w-full h-3 bg-slate-200 rounded-[1px]" />
                                                            <div className="w-full h-10 bg-slate-100 rounded-[1px]" />
                                                        </div>
                                                    </div>
                                                )}
                                                {layout.id === 'executive' && (
                                                    <div className="flex flex-col h-full gap-1">
                                                        <div className="w-full h-1 bg-amber-400 rounded-[1px]" />
                                                        <div className="w-full h-4 bg-slate-100 rounded-[1px] mx-auto" />
                                                        <div className="w-full h-px bg-slate-300" />
                                                        <div className="flex-1 bg-slate-50" />
                                                    </div>
                                                )}
                                                {layout.id === 'startup' && (
                                                    <div className="flex flex-col h-full gap-1">
                                                        <div className="w-3/4 h-6 bg-slate-900 rounded-[1px]" />
                                                        <div className="w-full h-6 bg-slate-100 rounded-[1px] flex gap-1 p-1">
                                                            <div className="w-1/4 h-full bg-slate-300 rounded" />
                                                            <div className="w-1/4 h-full bg-slate-300 rounded" />
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Fallback generic preview */}
                                                {!['modern', 'executive', 'startup'].includes(layout.id) && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="w-1/2 h-3 bg-slate-200 rounded-[1px]" />
                                                        <div className="w-full h-2 bg-slate-100 rounded-[1px]" />
                                                        <div className="w-full h-2 bg-slate-100 rounded-[1px]" />
                                                        <div className="w-2/3 h-2 bg-slate-100 rounded-[1px]" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-2 end-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* THEME SELECTION */}
                    <TabsContent value="theme" className="py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(Object.keys(THEMES) as ThemeColor[]).map((themeKey) => {
                                const theme = THEMES[themeKey];
                                const isSelected = selectedTheme === themeKey;

                                return (
                                    <button
                                        key={themeKey}
                                        onClick={() => setSelectedTheme(themeKey)}
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all text-start group
                                            ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                                : 'border-muted hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex -space-x-2 rtl:space-x-reverse">
                                                <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: theme.primary }} />
                                                <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: theme.accent }} />
                                                <div className="w-8 h-8 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: theme.muted }} />
                                            </div>
                                            <div className="text-sm font-medium capitalize">
                                                {themeKey}
                                            </div>
                                        </div>

                                        {/* Color Palette Preview Strip */}
                                        <div className="h-16 w-full rounded-md overflow-hidden flex shadow-sm ring-1 ring-black/5">
                                            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-white/90 font-medium" style={{ backgroundColor: theme.primary }}>Pri</div>
                                            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-white/90 font-medium" style={{ backgroundColor: theme.secondary }}>Sec</div>
                                            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-white/90 font-medium" style={{ backgroundColor: theme.accent }}>Acc</div>
                                            <div className="flex-[2] flex flex-col items-center justify-center text-[10px] text-slate-500 font-medium bg-white border-l">Text & Layout</div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-2 end-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex sm:justify-between items-center mt-6">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                        <span className="font-semibold">{locale === 'ar' ? 'الاختيار:' : 'Selected:'} </span>
                        <span className="capitalize">{selectedLayout}</span> + <span className="capitalize">{selectedTheme}</span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>

                        {activeTab === 'layout' ? (
                            <Button onClick={() => setActiveTab('theme')} className="flex-1 sm:flex-none">
                                {locale === 'ar' ? 'التالي: الألوان' : 'Next: Colors'}
                            </Button>
                        ) : (
                            <Button onClick={handleDownload} disabled={downloading} className="flex-1 sm:flex-none min-w-[140px]">
                                {downloading ? (
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 me-2" />
                                )}
                                {locale === 'ar' ? 'تحميل السيرة الذاتية' : 'Download Resume'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
