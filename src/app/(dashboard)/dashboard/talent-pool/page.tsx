'use client';

import { useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Eye,
    EyeOff,
    Shield,
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    Building2,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    Bell,
    Settings2,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { GCC_LOCATIONS, INDUSTRIES, INDUSTRIES_AR } from '@/lib/talent-marketplace';

export default function TalentPoolPage() {
    const { locale } = useLocale();
    const { resumes } = useResumes();

    // Pool membership state
    const [isJoined, setIsJoined] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');

    // Settings
    const [isVisible, setIsVisible] = useState(true);
    const [availabilityStatus, setAvailabilityStatus] = useState<string>('open_to_offers');
    const [hideCurrentEmployer, setHideCurrentEmployer] = useState(false);
    const [hideSalaryHistory, setHideSalaryHistory] = useState(true);
    const [verifiedCompaniesOnly, setVerifiedCompaniesOnly] = useState(false);
    const [blockedCompanies, setBlockedCompanies] = useState<string>('');

    // Preferences
    const [desiredRoles, setDesiredRoles] = useState<string>('');
    const [desiredSalaryMin, setDesiredSalaryMin] = useState<string>('');
    const [desiredSalaryMax, setDesiredSalaryMax] = useState<string>('');
    const [willingToRelocate, setWillingToRelocate] = useState(false);
    const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
    const [noticePeriod, setNoticePeriod] = useState<string>('2_weeks');
    const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);

    // Stats (mock)
    const stats = {
        profileViews: 47,
        unlocks: 3,
        messages: 2,
        searchAppearances: 156,
    };

    const selectedResume = resumes.find(r => r.id === selectedResumeId);

    const handleJoinPool = () => {
        if (!selectedResumeId) {
            toast.error(locale === 'ar' ? 'اختر سيرة ذاتية أولاً' : 'Please select a resume first');
            return;
        }
        setIsJoined(true);
        toast.success(locale === 'ar' ? 'تم الانضمام لمجموعة المواهب!' : 'Joined the Talent Pool!');
    };

    const handleSaveSettings = () => {
        toast.success(locale === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            {locale === 'ar' ? 'مجموعة المواهب' : 'Talent Pool'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {locale === 'ar'
                                ? 'اجعل سيرتك الذاتية مرئية لأفضل الشركات في الخليج'
                                : 'Make your resume visible to top GCC companies'}
                        </p>
                    </div>

                    {isJoined && (
                        <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'عضو نشط' : 'Active Member'}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6">
                {!isJoined ? (
                    // Onboarding - Not yet joined
                    <div className="max-w-2xl mx-auto space-y-8">
                        {/* Value Proposition */}
                        <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-900">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
                                <h2 className="text-2xl font-bold">
                                    {locale === 'ar' ? 'انضم لمجموعة المواهب' : 'Join the Talent Pool'}
                                </h2>
                                <p className="mt-2 opacity-90">
                                    {locale === 'ar'
                                        ? 'دع الشركات الكبرى تجدك وتتواصل معك مباشرة'
                                        : 'Let top companies find you and reach out directly'}
                                </p>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                    {[
                                        { icon: Building2, title: locale === 'ar' ? '500+ شركة' : '500+ Companies', desc: locale === 'ar' ? 'تبحث عن مواهب' : 'Actively hiring' },
                                        { icon: Eye, title: locale === 'ar' ? 'ظهور مجاني' : 'Free Visibility', desc: locale === 'ar' ? 'بدون رسوم عليك' : 'No fees for you' },
                                        { icon: Shield, title: locale === 'ar' ? 'خصوصية تامة' : 'Full Privacy', desc: locale === 'ar' ? 'تحكم في ما يظهر' : 'Control what shows' },
                                        { icon: MessageSquare, title: locale === 'ar' ? 'تواصل مباشر' : 'Direct Messages', desc: locale === 'ar' ? 'من مسؤولي التوظيف' : 'From recruiters' },
                                    ].map((item) => (
                                        <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                            <item.icon className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="font-medium text-sm">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {locale === 'ar' ? 'اختر السيرة الذاتية' : 'Select Resume to Share'}
                                        </label>
                                        <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={locale === 'ar' ? 'اختر سيرة ذاتية' : 'Choose a resume'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resumes.map((resume) => (
                                                    <SelectItem key={resume.id} value={resume.id}>
                                                        {resume.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                        onClick={handleJoinPool}
                                    >
                                        <Sparkles className="h-5 w-5 me-2" />
                                        {locale === 'ar' ? 'انضم الآن مجاناً' : 'Join for Free'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How it works */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{locale === 'ar' ? 'كيف تعمل؟' : 'How It Works'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { step: 1, title: locale === 'ar' ? 'انضم' : 'Join', desc: locale === 'ar' ? 'شارك سيرتك الذاتية' : 'Share your resume' },
                                        { step: 2, title: locale === 'ar' ? 'اضبط' : 'Configure', desc: locale === 'ar' ? 'حدد إعدادات الخصوصية' : 'Set privacy preferences' },
                                        { step: 3, title: locale === 'ar' ? 'انتظر' : 'Get Found', desc: locale === 'ar' ? 'الشركات تجدك' : 'Companies discover you' },
                                        { step: 4, title: locale === 'ar' ? 'تواصل' : 'Connect', desc: locale === 'ar' ? 'استقبل العروض' : 'Receive offers' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold text-purple-600">
                                                {item.step}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Dashboard - Already joined
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Eye, label: locale === 'ar' ? 'مشاهدات الملف' : 'Profile Views', value: stats.profileViews, color: 'text-blue-500' },
                                { icon: Users, label: locale === 'ar' ? 'فتح الملف' : 'Unlocks', value: stats.unlocks, color: 'text-green-500' },
                                { icon: MessageSquare, label: locale === 'ar' ? 'رسائل' : 'Messages', value: stats.messages, color: 'text-purple-500' },
                                { icon: TrendingUp, label: locale === 'ar' ? 'ظهور في البحث' : 'Search Appearances', value: stats.searchAppearances, color: 'text-amber-500' },
                            ].map((stat) => (
                                <Card key={stat.label}>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stat.value}</p>
                                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Settings Tabs */}
                        <Tabs defaultValue="visibility">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="visibility">
                                    <Eye className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'الظهور' : 'Visibility'}
                                </TabsTrigger>
                                <TabsTrigger value="privacy">
                                    <Shield className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
                                </TabsTrigger>
                                <TabsTrigger value="preferences">
                                    <Settings2 className="h-4 w-4 me-2" />
                                    {locale === 'ar' ? 'التفضيلات' : 'Preferences'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Visibility Tab */}
                            <TabsContent value="visibility">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'إعدادات الظهور' : 'Visibility Settings'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'تحكم في كيفية ظهورك للشركات' : 'Control how you appear to companies'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Active Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                {isVisible ? (
                                                    <Eye className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <p className="font-medium">
                                                        {locale === 'ar' ? 'ملفي مرئي للشركات' : 'My Profile is Visible'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isVisible
                                                            ? (locale === 'ar' ? 'الشركات يمكنها رؤية ملفك' : 'Companies can see your profile')
                                                            : (locale === 'ar' ? 'ملفك مخفي حالياً' : 'Your profile is hidden')
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                                        </div>

                                        {/* Availability Status */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'حالة التوفر' : 'Availability Status'}
                                            </label>
                                            <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="actively_looking">
                                                        🟢 {locale === 'ar' ? 'أبحث عن عمل بشكل نشط' : 'Actively Looking'}
                                                    </SelectItem>
                                                    <SelectItem value="open_to_offers">
                                                        🟡 {locale === 'ar' ? 'منفتح على العروض' : 'Open to Offers'}
                                                    </SelectItem>
                                                    <SelectItem value="not_looking">
                                                        🔴 {locale === 'ar' ? 'غير متاح حالياً' : 'Not Looking'}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Resume Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'السيرة الذاتية المعروضة' : 'Displayed Resume'}
                                            </label>
                                            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {resumes.map((resume) => (
                                                        <SelectItem key={resume.id} value={resume.id}>
                                                            {resume.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button onClick={handleSaveSettings}>
                                            {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Privacy Tab */}
                            <TabsContent value="privacy">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'تحكم في المعلومات التي تظهر' : 'Control what information is visible'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'إخفاء صاحب العمل الحالي' : 'Hide Current Employer'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'لن يظهر اسم شركتك الحالية' : 'Your current company name won\'t be shown'}
                                                    </p>
                                                </div>
                                                <Switch checked={hideCurrentEmployer} onCheckedChange={setHideCurrentEmployer} />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'إخفاء سجل الراتب' : 'Hide Salary History'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'لن تظهر رواتبك السابقة' : 'Your previous salaries won\'t be shown'}
                                                    </p>
                                                </div>
                                                <Switch checked={hideSalaryHistory} onCheckedChange={setHideSalaryHistory} />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{locale === 'ar' ? 'شركات موثقة فقط' : 'Verified Companies Only'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'فقط الشركات الموثقة يمكنها رؤية ملفك' : 'Only verified companies can see your profile'}
                                                    </p>
                                                </div>
                                                <Switch checked={verifiedCompaniesOnly} onCheckedChange={setVerifiedCompaniesOnly} />
                                            </div>
                                        </div>

                                        {/* Blocked Companies */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'حظر شركات معينة' : 'Block Specific Companies'}
                                            </label>
                                            <Textarea
                                                placeholder={locale === 'ar' ? 'اكتب أسماء الشركات، واحدة في كل سطر' : 'Enter company names, one per line'}
                                                value={blockedCompanies}
                                                onChange={(e) => setBlockedCompanies(e.target.value)}
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {locale === 'ar' ? 'هذه الشركات لن ترى ملفك أبداً' : 'These companies will never see your profile'}
                                            </p>
                                        </div>

                                        <Button onClick={handleSaveSettings}>
                                            {locale === 'ar' ? 'حفظ إعدادات الخصوصية' : 'Save Privacy Settings'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{locale === 'ar' ? 'تفضيلات العمل' : 'Job Preferences'}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'ساعد الشركات على فهم ما تبحث عنه' : 'Help companies understand what you\'re looking for'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Desired Roles */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'المناصب المطلوبة' : 'Desired Job Titles'}
                                            </label>
                                            <Input
                                                placeholder={locale === 'ar' ? 'مثال: مهندس برمجيات، مدير منتجات' : 'e.g., Software Engineer, Product Manager'}
                                                value={desiredRoles}
                                                onChange={(e) => setDesiredRoles(e.target.value)}
                                            />
                                        </div>

                                        {/* Salary Range */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'الراتب المتوقع (ريال شهرياً)' : 'Expected Salary (SAR/month)'}
                                            </label>
                                            <div className="flex gap-4">
                                                <Input
                                                    type="number"
                                                    placeholder={locale === 'ar' ? 'الحد الأدنى' : 'Minimum'}
                                                    value={desiredSalaryMin}
                                                    onChange={(e) => setDesiredSalaryMin(e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder={locale === 'ar' ? 'الحد الأقصى' : 'Maximum'}
                                                    value={desiredSalaryMax}
                                                    onChange={(e) => setDesiredSalaryMax(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Notice Period */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'فترة الإشعار' : 'Notice Period'}
                                            </label>
                                            <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="immediate">{locale === 'ar' ? 'فوري' : 'Immediate'}</SelectItem>
                                                    <SelectItem value="1_week">{locale === 'ar' ? 'أسبوع' : '1 Week'}</SelectItem>
                                                    <SelectItem value="2_weeks">{locale === 'ar' ? 'أسبوعين' : '2 Weeks'}</SelectItem>
                                                    <SelectItem value="1_month">{locale === 'ar' ? 'شهر' : '1 Month'}</SelectItem>
                                                    <SelectItem value="2_months">{locale === 'ar' ? 'شهرين' : '2 Months'}</SelectItem>
                                                    <SelectItem value="3_months">{locale === 'ar' ? '3 أشهر' : '3 Months'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Relocation */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{locale === 'ar' ? 'مستعد للانتقال' : 'Willing to Relocate'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {locale === 'ar' ? 'هل أنت مستعد للانتقال لمدينة أخرى؟' : 'Are you open to relocating to another city?'}
                                                </p>
                                            </div>
                                            <Switch checked={willingToRelocate} onCheckedChange={setWillingToRelocate} />
                                        </div>

                                        {/* Preferred Locations */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {locale === 'ar' ? 'المواقع المفضلة' : 'Preferred Locations'}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {GCC_LOCATIONS.map((loc) => (
                                                    <Badge
                                                        key={loc}
                                                        variant={preferredLocations.includes(loc) ? 'default' : 'outline'}
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setPreferredLocations(prev =>
                                                                prev.includes(loc)
                                                                    ? prev.filter(l => l !== loc)
                                                                    : [...prev, loc]
                                                            );
                                                        }}
                                                    >
                                                        {loc}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <Button onClick={handleSaveSettings}>
                                            {locale === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}
