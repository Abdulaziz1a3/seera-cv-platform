'use client';

import { useState } from 'react';
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
import type { TemplateId, ThemeId } from '@/lib/resume-types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  selectedTheme: ThemeId;
  onTemplateChange: (templateId: TemplateId) => void;
  onThemeChange: (themeId: ThemeId) => void;
}

// Template thumbnail preview component
function TemplatePreview({ templateId, themeId }: { templateId: TemplateId; themeId: ThemeId }) {
  const theme = THEMES[themeId];

  // Render simplified template preview based on layout
  const renderPreview = () => {
    switch (templateId) {
      case 'prestige-executive':
        return (
          <div className="w-full h-full p-2 flex flex-col">
            <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: theme.primary }} />
            <div className="h-0.5 w-8 rounded mb-2" style={{ backgroundColor: theme.accent }} />
            <div className="h-1 w-20 rounded mb-1" style={{ backgroundColor: theme.muted }} />
            <div className="flex-1 space-y-1.5 mt-2">
              <div className="h-0.5 w-full rounded" style={{ backgroundColor: theme.accent }} />
              <div className="h-1 w-full rounded" style={{ backgroundColor: theme.muted + '40' }} />
              <div className="h-1 w-3/4 rounded" style={{ backgroundColor: theme.muted + '40' }} />
            </div>
          </div>
        );
      case 'nordic-minimal':
        return (
          <div className="w-full h-full p-3 flex flex-col">
            <div className="h-2 w-20 rounded mb-1" style={{ backgroundColor: theme.text }} />
            <div className="h-0.5 w-6 rounded mb-3" style={{ backgroundColor: theme.accent }} />
            <div className="flex-1 space-y-2">
              <div className="h-1 w-full rounded" style={{ backgroundColor: theme.muted + '40' }} />
              <div className="h-1 w-2/3 rounded" style={{ backgroundColor: theme.muted + '40' }} />
              <div className="h-1 w-full rounded mt-3" style={{ backgroundColor: theme.muted + '40' }} />
            </div>
          </div>
        );
      case 'metropolitan-split':
        return (
          <div className="w-full h-full flex">
            <div className="w-1/3 h-full p-1.5" style={{ backgroundColor: theme.secondary }}>
              <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: theme.accent + '40' }} />
              <div className="h-0.5 w-full rounded mb-1" style={{ backgroundColor: '#ffffff40' }} />
              <div className="h-0.5 w-3/4 rounded mb-1" style={{ backgroundColor: '#ffffff40' }} />
              <div className="space-y-0.5 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1 w-full rounded" style={{ backgroundColor: '#ffffff20' }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-2">
              <div className="h-1.5 w-12 rounded mb-1" style={{ backgroundColor: theme.text }} />
              <div className="h-1 w-8 rounded mb-2" style={{ backgroundColor: theme.muted }} />
              <div className="space-y-1">
                <div className="h-1 w-full rounded" style={{ backgroundColor: theme.muted + '40' }} />
                <div className="h-1 w-3/4 rounded" style={{ backgroundColor: theme.muted + '40' }} />
              </div>
            </div>
          </div>
        );
      case 'classic-professional':
        return (
          <div className="w-full h-full p-2 flex flex-col items-center">
            <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: theme.text }} />
            <div className="h-0.5 w-12 rounded mb-2" style={{ backgroundColor: theme.muted }} />
            <div className="w-full h-1.5 rounded mb-2" style={{ backgroundColor: theme.primary }} />
            <div className="w-full space-y-1">
              <div className="h-1 w-full rounded" style={{ backgroundColor: theme.muted + '40' }} />
              <div className="h-1 w-2/3 rounded" style={{ backgroundColor: theme.muted + '40' }} />
            </div>
          </div>
        );
      case 'impact-modern':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="h-10 p-2" style={{ backgroundColor: theme.secondary }}>
              <div className="h-0.5 w-1 float-left mr-1 rounded" style={{ backgroundColor: theme.accent }} />
              <div className="h-1.5 w-10 rounded mb-0.5" style={{ backgroundColor: '#ffffff' }} />
              <div className="h-0.5 w-6 rounded" style={{ backgroundColor: theme.accent }} />
            </div>
            <div className="flex-1 p-2">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 px-1 rounded" style={{ backgroundColor: theme.surface }}>
                    <div className="h-0.5 w-3 rounded" style={{ backgroundColor: theme.text }} />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full rounded" style={{ backgroundColor: theme.muted + '40' }} />
                <div className="h-1 w-3/4 rounded" style={{ backgroundColor: theme.muted + '40' }} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded overflow-hidden shadow-inner">
      {renderPreview()}
    </div>
  );
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
  onTemplateChange,
  onThemeChange,
}: TemplateSelectorProps) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  const templateIds = Object.keys(TEMPLATES) as TemplateId[];
  const themeIds = Object.keys(THEMES) as ThemeId[];
  const currentTemplate = TEMPLATES[selectedTemplate];
  const currentTheme = THEME_METADATA[selectedTheme];

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              {locale === 'ar' ? 'القوالب' : 'Templates'}
            </TabsTrigger>
            <TabsTrigger value="colors">
              {locale === 'ar' ? 'الألوان' : 'Colors'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 overflow-auto mt-4">
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
                      <TemplatePreview templateId={templateId} themeId={selectedTheme} />
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
                      <TemplatePreview templateId={selectedTemplate} themeId={selectedTheme} />
                    </div>
                  </CardContent>
                </Card>
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
