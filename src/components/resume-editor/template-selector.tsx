'use client';

import { useMemo, useState } from 'react';
import { Check, Crown, Palette, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { TEMPLATES, THEME_METADATA, THEMES } from '@/lib/templates';
import type { ResumeData, TemplateId, ThemeId } from '@/lib/resume-types';
import { LivePreview } from '@/components/resume-editor/live-preview';
import { getTemplatePreviewData } from '@/components/resume-editor/template-preview-data';
import { TemplateThumbnail } from '@/components/resume-editor/template-thumbnail';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  selectedTheme: ThemeId;
  selectedFont: ResumeData['settings']['fontFamily'];
  onTemplateChange: (templateId: TemplateId) => void;
  onThemeChange: (themeId: ThemeId) => void;
  onFontChange: (fontFamily: ResumeData['settings']['fontFamily']) => void;
  previewResume?: ResumeData;
}

// Theme swatch component
function ThemeSwatch({ themeId, selected, onClick }: { themeId: ThemeId; selected: boolean; onClick: () => void }) {
  const theme = THEMES[themeId];
  const meta = THEME_METADATA[themeId];
  const { locale } = useLocale();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-muted hover:border-muted-foreground/30'
      )}
    >
      {/* Color preview */}
      <div className="flex gap-0.5 rounded-full overflow-hidden">
        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.primary }} />
        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm -ml-2" style={{ backgroundColor: theme.accent }} />
        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm -ml-2" style={{ backgroundColor: theme.secondary }} />
      </div>
      <span className="text-xs font-medium">{meta.name[locale === 'ar' ? 'ar' : 'en']}</span>
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

export function TemplateSelector({
  selectedTemplate,
  selectedTheme,
  selectedFont,
  onTemplateChange,
  onThemeChange,
  onFontChange,
  previewResume,
}: TemplateSelectorProps) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  const templateIds = Object.keys(TEMPLATES) as TemplateId[];
  const themeIds = Object.keys(THEMES) as ThemeId[];
  const currentTemplate = TEMPLATES[selectedTemplate];
  const previewData = useMemo(() => {
    const base = previewResume ?? getTemplatePreviewData(locale);
    return {
      ...base,
      locale,
      template: selectedTemplate,
      theme: selectedTheme,
      settings: {
        ...base.settings,
        fontFamily: selectedFont,
      },
    };
  }, [locale, previewResume, selectedTemplate, selectedTheme, selectedFont]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layout className="h-4 w-4" />
          {currentTemplate.name[locale === 'ar' ? 'ar' : 'en']}
          <div
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: THEMES[selectedTheme].primary }}
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {locale === 'ar' ? 'اختر القالب والألوان' : 'Choose Template & Colors'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">
              {locale === 'ar' ? 'القوالب' : 'Templates'}
            </TabsTrigger>
            <TabsTrigger value="colors">
              {locale === 'ar' ? 'الألوان' : 'Colors'}
            </TabsTrigger>
            <TabsTrigger value="fonts">
              {locale === 'ar' ? 'الخطوط' : 'Fonts'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 overflow-auto mt-4">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {templateIds.map((templateId) => {
                  const template = TEMPLATES[templateId];
                  const isSelected = templateId === selectedTemplate;

                  return (
                    <button
                      key={templateId}
                      onClick={() => onTemplateChange(templateId)}
                      className={cn(
                        'group relative flex flex-col rounded-lg border-2 overflow-hidden transition-all',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-muted hover:border-muted-foreground/30'
                      )}
                    >
                      {/* Template preview */}
                      <div className="aspect-[3/4] w-full bg-muted/30">
                      <TemplateThumbnail templateId={templateId} themeId={selectedTheme} />
                      </div>

                      {/* Template info */}
                      <div className="p-3 text-left bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm">
                            {template.name[locale === 'ar' ? 'ar' : 'en']}
                          </h3>
                          {template.isPremium && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description[locale === 'ar' ? 'ar' : 'en']}
                        </p>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <Card className="hidden lg:block">
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">
                    {locale === 'ar' ? 'معاينة القالب' : 'Template Preview'}
                  </div>
                  <div className="flex justify-center">
                    <LivePreview resume={previewData} scale={0.42} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              {/* Theme grid */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {themeIds.map((themeId) => (
                  <ThemeSwatch
                    key={themeId}
                    themeId={themeId}
                    selected={themeId === selectedTheme}
                    onClick={() => onThemeChange(themeId)}
                  />
                ))}
              </div>

              {/* Preview with selected theme */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">
                  {locale === 'ar' ? 'معاينة' : 'Preview'}
                </h4>
                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-[3/4] max-w-[200px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                      <TemplateThumbnail templateId={selectedTemplate} themeId={selectedTheme} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fonts" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="text-sm font-medium">
                {locale === 'ar' ? 'اختر خط السيرة الذاتية' : 'Choose Resume Font'}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    id: 'jakarta',
                    label: locale === 'ar' ? 'جاكرتا العصري' : 'Plus Jakarta Sans',
                    className: 'font-[var(--font-jakarta)]',
                  },
                  {
                    id: 'merriweather',
                    label: locale === 'ar' ? 'ميريويذر الكلاسيكي' : 'Merriweather Serif',
                    className: 'font-[var(--font-merriweather)]',
                  },
                  {
                    id: 'playfair',
                    label: locale === 'ar' ? 'بلايفير الفاخر' : 'Playfair Display',
                    className: 'font-[var(--font-playfair)]',
                  },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => onFontChange(font.id as ResumeData['settings']['fontFamily'])}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left transition-all',
                      selectedFont === font.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-muted hover:border-muted-foreground/30'
                    )}
                  >
                    <p className={cn('text-sm font-semibold', font.className)}>{font.label}</p>
                    <p className="text-xs text-muted-foreground">Aa Bb Cc 123</p>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with apply button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setOpen(false)}>
            {locale === 'ar' ? 'تطبيق' : 'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelector;
