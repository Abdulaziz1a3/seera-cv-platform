'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Flag,
    Plus,
    Search,
    AlertTriangle,
    Zap,
    Users,
    Code,
    Sparkles,
    Shield,
} from 'lucide-react';

// Mock feature flags
const mockFlags = [
    {
        id: '1',
        name: 'ai_cover_letter',
        label: 'AI Cover Letter Generator',
        description: 'Enable AI-powered cover letter generation for users',
        enabled: true,
        category: 'AI Features',
        rollout: 100,
    },
    {
        id: '2',
        name: 'new_editor_v2',
        label: 'New Resume Editor V2',
        description: 'Beta version of the new drag-and-drop resume editor',
        enabled: false,
        category: 'Beta Features',
        rollout: 10,
    },
    {
        id: '3',
        name: 'linkedin_sync',
        label: 'LinkedIn Profile Sync',
        description: 'Allow users to sync their LinkedIn profile data',
        enabled: true,
        category: 'Integrations',
        rollout: 100,
    },
    {
        id: '4',
        name: 'premium_templates',
        label: 'Premium Templates',
        description: 'Show premium templates to pro users',
        enabled: true,
        category: 'Features',
        rollout: 100,
    },
    {
        id: '5',
        name: 'dark_mode_v2',
        label: 'Dark Mode V2',
        description: 'New dark mode with improved contrast and colors',
        enabled: false,
        category: 'Beta Features',
        rollout: 25,
    },
    {
        id: '6',
        name: 'realtime_ats_scoring',
        label: 'Real-time ATS Scoring',
        description: 'Calculate ATS score as user types',
        enabled: true,
        category: 'AI Features',
        rollout: 100,
    },
];

export default function AdminFeatureFlagsPage() {
    const { locale } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [flags, setFlags] = useState(mockFlags);

    const categories = Array.from(new Set(flags.map((f) => f.category)));

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'AI Features':
                return Sparkles;
            case 'Beta Features':
                return Zap;
            case 'Integrations':
                return Code;
            case 'Features':
                return Flag;
            default:
                return Flag;
        }
    };

    const toggleFlag = (id: string) => {
        setFlags(flags.map((f) => {
            if (f.id === id) {
                const newEnabled = !f.enabled;
                toast.success(
                    locale === 'ar'
                        ? `تم ${newEnabled ? 'تفعيل' : 'تعطيل'} ${f.label}`
                        : `${f.label} ${newEnabled ? 'enabled' : 'disabled'}`
                );
                return { ...f, enabled: newEnabled };
            }
            return f;
        }));
    };

    const filteredFlags = flags.filter((f) =>
        f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إدارة الميزات' : 'Feature Flags'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar'
                            ? 'تحكم في إطلاق الميزات للمستخدمين'
                            : 'Control feature rollout to users'}
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إضافة ميزة' : 'Add Flag'}
                </Button>
            </div>

            {/* Warning */}
            <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <p className="text-sm">
                            {locale === 'ar'
                                ? 'تغيير إعدادات الميزات قد يؤثر على تجربة المستخدمين فوراً.'
                                : 'Changing feature flags may immediately affect the user experience.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={locale === 'ar' ? 'البحث عن ميزة...' : 'Search flags...'}
                    className="ps-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Flags by Category */}
            {categories.map((category) => {
                const categoryFlags = filteredFlags.filter((f) => f.category === category);
                if (categoryFlags.length === 0) return null;

                const CategoryIcon = getCategoryIcon(category);

                return (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CategoryIcon className="h-5 w-5 text-primary" />
                                {category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {categoryFlags.map((flag, index) => (
                                <div key={flag.id}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Label className="font-medium">{flag.label}</Label>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {flag.name}
                                                </code>
                                                {flag.rollout < 100 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {flag.rollout}% {locale === 'ar' ? 'إطلاق' : 'rollout'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {flag.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={flag.enabled}
                                            onCheckedChange={() => toggleFlag(flag.id)}
                                        />
                                    </div>
                                    {index < categoryFlags.length - 1 && <Separator className="mt-4" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}

            {filteredFlags.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {locale === 'ar' ? 'لا توجد ميزات مطابقة' : 'No matching feature flags'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
