'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { LanguageItem } from '@/lib/resume-schema';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Languages as LanguagesIcon } from 'lucide-react';

type Language = LanguageItem;

interface LanguagesEditorProps {
    data: Language[];
    onChange: (data: Language[]) => void;
}

const proficiencyLevels = [
    { value: 'native', labelEn: 'Native', labelAr: 'اللغة الأم' },
    { value: 'fluent', labelEn: 'Fluent', labelAr: 'طلاقة' },
    { value: 'professional', labelEn: 'Professional', labelAr: 'متقدم' },
    { value: 'intermediate', labelEn: 'Intermediate', labelAr: 'متوسط' },
    { value: 'basic', labelEn: 'Basic', labelAr: 'مبتدئ' },
];

const commonLanguages = [
    { name: 'English', nameAr: 'الإنجليزية' },
    { name: 'Arabic', nameAr: 'العربية' },
    { name: 'French', nameAr: 'الفرنسية' },
    { name: 'Spanish', nameAr: 'الإسبانية' },
    { name: 'German', nameAr: 'الألمانية' },
    { name: 'Chinese', nameAr: 'الصينية' },
    { name: 'Japanese', nameAr: 'اليابانية' },
    { name: 'Hindi', nameAr: 'الهندية' },
    { name: 'Portuguese', nameAr: 'البرتغالية' },
    { name: 'Russian', nameAr: 'الروسية' },
];

export function LanguagesEditor({ data, onChange }: LanguagesEditorProps) {
    const { locale } = useLocale();

    const addLanguage = (langName?: string) => {
        const language = langName || '';
        onChange([
            ...data,
            {
                id: crypto.randomUUID(),
                language,
                proficiency: 'intermediate',
            },
        ]);
    };

    const updateLanguage = (id: string, field: keyof Language, value: string) => {
        onChange(
            data.map((lang) =>
                lang.id === id ? { ...lang, [field]: value } : lang
            )
        );
    };

    const removeLanguage = (id: string) => {
        onChange(data.filter((lang) => lang.id !== id));
    };

    const existingNames = data.map((l) => l.language.toLowerCase());
    const availableLanguages = commonLanguages.filter(
        (l) => !existingNames.includes(l.name.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        {locale === 'ar' ? 'اللغات' : 'Languages'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? 'أضف اللغات التي تتحدثها'
                            : 'Add the languages you speak'}
                    </p>
                </div>
                <Button onClick={() => addLanguage()}>
                    <Plus className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إضافة لغة' : 'Add Language'}
                </Button>
            </div>

            {data.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                        <LanguagesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {locale === 'ar'
                                ? 'لم تضف أي لغات بعد'
                                : 'No languages added yet'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {availableLanguages.slice(0, 4).map((lang) => (
                                <Button
                                    key={lang.name}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addLanguage(lang.name)}
                                >
                                    <Plus className="h-3 w-3 me-1" />
                                    {locale === 'ar' ? lang.nameAr : lang.name}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {data.map((lang) => (
                        <Card key={lang.id}>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>{locale === 'ar' ? 'اللغة' : 'Language'}</Label>
                                            <Select
                                                value={lang.language}
                                                onValueChange={(value) => updateLanguage(lang.id, 'language', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={locale === 'ar' ? 'اختر لغة' : 'Select language'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {commonLanguages.map((l) => (
                                                        <SelectItem key={l.name} value={l.name}>
                                                            {locale === 'ar' ? l.nameAr : l.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{locale === 'ar' ? 'المستوى' : 'Proficiency'}</Label>
                                            <Select
                                                value={lang.proficiency}
                                                onValueChange={(value) => updateLanguage(lang.id, 'proficiency', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {proficiencyLevels.map((level) => (
                                                        <SelectItem key={level.value} value={level.value}>
                                                            {locale === 'ar' ? level.labelAr : level.labelEn}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLanguage(lang.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {availableLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            <span className="text-sm text-muted-foreground">
                                {locale === 'ar' ? 'إضافة سريعة:' : 'Quick add:'}
                            </span>
                            {availableLanguages.slice(0, 3).map((lang) => (
                                <Button
                                    key={lang.name}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addLanguage(lang.name)}
                                >
                                    <Plus className="h-3 w-3 me-1" />
                                    {locale === 'ar' ? lang.nameAr : lang.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
