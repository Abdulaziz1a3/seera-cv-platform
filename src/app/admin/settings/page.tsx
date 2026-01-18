'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { defaultAdminSettings } from '@/lib/admin-settings';
import {
    Globe,
    Shield,
    Mail,
    Palette,
    Database,
    Save,
} from 'lucide-react';

export default function AdminSettingsPage() {
    const { locale } = useLocale();
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(defaultAdminSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/admin/settings');
                if (!res.ok) throw new Error('Failed to load settings');
                const json = await res.json();
                setSettings(json.settings || defaultAdminSettings);
            } catch (error) {
                toast.error(locale === 'ar' ? 'فشل تحميل الإعدادات' : 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [locale]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || 'Failed to save settings');
            }
            toast.success(locale === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved successfully');
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: settings.supportEmail }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || 'Failed to send test email');
            }
            toast.success(locale === 'ar' ? 'تم إرسال رسالة اختبار' : 'Test email sent');
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل إرسال رسالة الاختبار' : 'Failed to send test email'));
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64" />
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {locale === 'ar' ? 'إعدادات النظام' : 'System Settings'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === 'ar' ? 'إدارة إعدادات المنصة' : 'Manage platform configuration'}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 me-2" />
                    {isSaving
                        ? locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                        : locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
            </div>

            <Tabs defaultValue="general">
                <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto">
                    <TabsTrigger value="general" className="gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">{locale === 'ar' ? 'عام' : 'General'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">{locale === 'ar' ? 'الأمان' : 'Security'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">{locale === 'ar' ? 'البريد' : 'Email'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="gap-2">
                        <Database className="h-4 w-4" />
                        <span className="hidden sm:inline">{locale === 'ar' ? 'الحدود' : 'Limits'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">{locale === 'ar' ? 'المظهر' : 'Appearance'}</span>
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'إعدادات الموقع الأساسية' : 'Basic site configuration'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'اسم الموقع' : 'Site Name'}</Label>
                                    <Input
                                        value={settings.siteName}
                                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'بريد الدعم' : 'Support Email'}</Label>
                                    <Input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{locale === 'ar' ? 'وصف الموقع' : 'Site Description'}</Label>
                                <Textarea
                                    value={settings.siteDescription}
                                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{locale === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'إيقاف الموقع للزوار' : 'Disable site for visitors'}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'إدارة أمان المنصة' : 'Manage platform security'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{locale === 'ar' ? 'تفعيل التسجيل' : 'Enable Registration'}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'السماح للمستخدمين الجدد بالتسجيل' : 'Allow new users to register'}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.registrationEnabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{locale === 'ar' ? 'التحقق من البريد' : 'Email Verification'}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'طلب تأكيد البريد الإلكتروني' : 'Require email confirmation'}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.emailVerification}
                                    onCheckedChange={(checked) => setSettings({ ...settings, emailVerification: checked })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{locale === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'تفعيل 2FA لجميع المستخدمين' : 'Enable 2FA for all users'}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.twoFactorAuth}
                                    onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email Settings */}
                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'إعدادات البريد' : 'Email Settings'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'إعدادات خادم SMTP' : 'SMTP server configuration'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'خادم SMTP' : 'SMTP Host'}</Label>
                                    <Input
                                        value={settings.smtpHost}
                                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'منفذ SMTP' : 'SMTP Port'}</Label>
                                    <Input
                                        type="number"
                                        value={settings.smtpPort}
                                        onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleTestEmail} disabled={isSaving}>
                                {locale === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Limits Settings */}
                <TabsContent value="limits">
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'حدود الاستخدام' : 'Usage Limits'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'إعدادات حدود المستخدمين' : 'User limit configuration'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'حد API (طلب/دقيقة)' : 'API Rate Limit (req/min)'}</Label>
                                    <Input
                                        type="number"
                                        value={settings.apiRateLimit}
                                        onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'سير لكل مستخدم' : 'Resumes per User'}</Label>
                                    <Input
                                        type="number"
                                        value={settings.maxResumesPerUser}
                                        onChange={(e) => setSettings({ ...settings, maxResumesPerUser: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'ar' ? 'حجم الملف (MB)' : 'Max File Size (MB)'}</Label>
                                    <Input
                                        type="number"
                                        value={settings.maxFileSize}
                                        onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Settings */}
                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>{locale === 'ar' ? 'إعدادات المظهر' : 'Appearance Settings'}</CardTitle>
                            <CardDescription>
                                {locale === 'ar' ? 'تخصيص مظهر المنصة' : 'Customize platform appearance'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>{locale === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="w-16 h-10 p-1"
                                    />
                                    <Input
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{locale === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? 'السماح للمستخدمين بتفعيل الوضع الداكن' : 'Allow users to enable dark mode'}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.allowDarkMode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, allowDarkMode: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
