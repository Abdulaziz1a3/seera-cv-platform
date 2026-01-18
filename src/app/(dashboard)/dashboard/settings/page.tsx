'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
    User,
    Lock,
    Bell,
    Shield,
    Loader2,
    Save,
    Trash2,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/components/providers/locale-provider';

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const { t, locale } = useLocale();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(session?.user?.name || '');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notifications, setNotifications] = useState({
        resumeTips: true,
        jobAlerts: true,
        productUpdates: false,
        marketing: false,
    });

    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                setName(data?.name || '');
                setPhone(data?.phone || '');
            } catch {
                // Ignore
            }
        };
        loadProfile();
        return () => {
            mounted = false;
        };
    }, []);

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to update profile');
            }
            await update({ name });
            toast.success(locale === 'ar' ? 'تم حفظ التغييرات' : 'Changes saved successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            toast.error(locale === 'ar' ? `تعذر حفظ التغييرات: ${message}` : `Failed to save: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t.settings.title}</h1>
                <p className="text-muted-foreground mt-1">{t.settings.description}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[420px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.profile}</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.security}</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.settings.tabs.notifications}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {t.settings.profile.personalInfo}
                            </CardTitle>
                            <CardDescription>{t.settings.profile.personalInfoDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white">
                                    {session?.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <Button variant="outline" size="sm">
                                        {locale === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, PNG, GIF. Max 2MB
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t.settings.profile.fullName}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.settings.profile.email}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t.settings.profile.emailHint}
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+9665xxxxxxxx"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {locale === 'ar'
                                            ? 'يستخدم الرقم لإتمام عمليات الدفع.'
                                            : 'Required to complete payments.'}
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleSaveProfile} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 me-2" />
                                )}
                                {t.settings.profile.saveChanges}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <Trash2 className="h-5 w-5" />
                                {t.settings.profile.dangerZone}
                            </CardTitle>
                            <CardDescription>{t.settings.profile.dangerZoneDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                                <div>
                                    <h4 className="font-medium">{t.settings.profile.deleteAccount}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t.settings.profile.deleteAccountDesc}
                                    </p>
                                </div>
                                <Button variant="destructive">{t.settings.profile.deleteAccount}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                {t.settings.security.password}
                            </CardTitle>
                            <CardDescription>{t.settings.security.passwordDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">{t.settings.security.currentPassword}</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{t.settings.security.newPassword}</Label>
                                    <Input id="new-password" type="password" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">{t.settings.security.confirmPassword}</Label>
                                    <Input id="confirm-password" type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <Button>{t.settings.security.updatePassword}</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {t.settings.security.twoFactor}
                            </CardTitle>
                            <CardDescription>{t.settings.security.twoFactorDesc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                {t.settings.security.notEnabled}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t.settings.security.protect}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline">{t.settings.security.enable2fa}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                {t.settings.notifications.emailNotifications}
                            </CardTitle>
                            <CardDescription>{t.settings.notifications.emailNotificationsDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                {
                                    id: 'resumeTips',
                                    label: t.settings.notifications.resumeTips,
                                    description: t.settings.notifications.resumeTipsDesc,
                                },
                                {
                                    id: 'jobAlerts',
                                    label: t.settings.notifications.jobAlerts,
                                    description: t.settings.notifications.jobAlertsDesc,
                                },
                                {
                                    id: 'productUpdates',
                                    label: t.settings.notifications.productUpdates,
                                    description: t.settings.notifications.productUpdatesDesc,
                                },
                                {
                                    id: 'marketing',
                                    label: t.settings.notifications.marketing,
                                    description: t.settings.notifications.marketingDesc,
                                },
                            ].map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                >
                                    <div>
                                        <h4 className="font-medium">{notification.label}</h4>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[notification.id as keyof typeof notifications]}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, [notification.id]: checked })
                                        }
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
