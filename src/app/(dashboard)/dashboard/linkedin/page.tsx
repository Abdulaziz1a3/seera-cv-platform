'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Linkedin,
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Loader2,
    User,
    Briefcase,
    Award,
    Target,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Lightbulb,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

interface OptimizedProfile {
    headline: string;
    headlineOptions: string[];
    summary: string;
    experience: Array<{ title: string; company: string; description: string }>;
    skills: string[];
    featuredSkills: string[];
    profileScore: number;
    improvements: string[];
}

export default function LinkedInOptimizerPage() {
    const { locale } = useLocale();
    const { resumes } = useResumes();

    // State
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [tone, setTone] = useState<'professional' | 'creative' | 'executive'>('professional');
    const [targetAudience, setTargetAudience] = useState<'recruiters' | 'clients' | 'networking'>('recruiters');

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [profile, setProfile] = useState<OptimizedProfile | null>(null);
    const [selectedHeadlineIndex, setSelectedHeadlineIndex] = useState(0);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    // Copy to clipboard
    const copyToClipboard = async (text: string, section: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
        toast.success(locale === 'ar' ? 'تم النسخ!' : 'Copied!');
    };

    // Optimize profile
    const optimizeProfile = async () => {
        if (!selectedResumeId) return;

        setIsOptimizing(true);
        try {
            const resumeResponse = await fetch(`/api/resumes/${selectedResumeId}`);
            if (!resumeResponse.ok) {
                throw new Error('Failed to load resume');
            }

            const resumeData = await resumeResponse.json();

            const response = await fetch('/api/linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'full',
                    resume: resumeData,
                    options: { locale, tone, targetAudience },
                }),
            });

            if (await handleAICreditsResponse(response.clone())) {
                return;
            }
            const { result, error } = await response.json();
            if (error) throw new Error(error);

            setProfile(result);
            toast.success(locale === 'ar' ? 'تم تحسين الملف!' : 'Profile optimized!');
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل التحسين' : 'Optimization failed'));
        } finally {
            setIsOptimizing(false);
        }
    };

    // Regenerate section
    const regenerateSection = async (section: 'headlines' | 'about') => {
        if (!selectedResumeId) return;

        try {
            const resumeResponse = await fetch(`/api/resumes/${selectedResumeId}`);
            if (!resumeResponse.ok) {
                throw new Error('Failed to load resume');
            }

            const resumeData = await resumeResponse.json();

            const response = await fetch('/api/linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: section,
                    resume: resumeData,
                    options: { locale, tone, targetAudience },
                }),
            });

            if (await handleAICreditsResponse(response.clone())) {
                return;
            }
            const { result, error } = await response.json();
            if (error) throw new Error(error);

            if (section === 'headlines') {
                setProfile(prev => prev ? { ...prev, headlineOptions: result, headline: result[0] } : null);
            } else {
                setProfile(prev => prev ? { ...prev, summary: result } : null);
            }
            toast.success(locale === 'ar' ? 'تم التجديد!' : 'Regenerated!');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-card px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Linkedin className="h-6 w-6 text-[#0A66C2]" />
                            {locale === 'ar' ? 'محسّن ملف LinkedIn' : 'LinkedIn Profile Optimizer'}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {locale === 'ar'
                                ? 'حوّل سيرتك الذاتية إلى ملف LinkedIn احترافي'
                                : 'Transform your resume into a professional LinkedIn profile'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 sm:p-6">
                {!profile ? (
                    // Setup Phase
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    {locale === 'ar' ? 'ابدأ التحسين' : 'Start Optimization'}
                                </CardTitle>
                                <CardDescription>
                                    {locale === 'ar'
                                        ? 'اختر سيرتك الذاتية وسنحوّلها إلى ملف LinkedIn مثالي'
                                        : 'Select your resume and we\'ll transform it into the perfect LinkedIn profile'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Resume Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'اختر السيرة الذاتية' : 'Select Resume'}
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

                                {/* Tone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'أسلوب الكتابة' : 'Writing Tone'}
                                    </label>
                                    <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">
                                                {locale === 'ar' ? 'مهني' : 'Professional'}
                                            </SelectItem>
                                            <SelectItem value="creative">
                                                {locale === 'ar' ? 'إبداعي' : 'Creative'}
                                            </SelectItem>
                                            <SelectItem value="executive">
                                                {locale === 'ar' ? 'تنفيذي' : 'Executive'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Target Audience */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
                                    </label>
                                    <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recruiters">
                                                {locale === 'ar' ? 'مسؤولو التوظيف' : 'Recruiters'}
                                            </SelectItem>
                                            <SelectItem value="clients">
                                                {locale === 'ar' ? 'العملاء' : 'Clients'}
                                            </SelectItem>
                                            <SelectItem value="networking">
                                                {locale === 'ar' ? 'التواصل المهني' : 'Networking'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    className="w-full h-12"
                                    onClick={optimizeProfile}
                                    disabled={!selectedResumeId || isOptimizing}
                                >
                                    {isOptimizing ? (
                                        <Loader2 className="h-5 w-5 animate-spin me-2" />
                                    ) : (
                                        <Sparkles className="h-5 w-5 me-2" />
                                    )}
                                    {isOptimizing
                                        ? (locale === 'ar' ? 'جارٍ التحسين...' : 'Optimizing...')
                                        : (locale === 'ar' ? 'تحسين ملف LinkedIn' : 'Optimize LinkedIn Profile')
                                    }
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Features Preview */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { icon: User, title: locale === 'ar' ? 'عنوان جذاب' : 'Compelling Headline', desc: locale === 'ar' ? '5 خيارات' : '5 options' },
                                { icon: Briefcase, title: locale === 'ar' ? 'قسم نبذة عني' : 'About Section', desc: locale === 'ar' ? 'قصة مقنعة' : 'Engaging story' },
                                { icon: Award, title: locale === 'ar' ? 'وصف الخبرات' : 'Experience Descriptions', desc: locale === 'ar' ? 'محسّن للبحث' : 'SEO optimized' },
                                { icon: Target, title: locale === 'ar' ? 'ترتيب المهارات' : 'Skills Ranking', desc: locale === 'ar' ? 'حسب الطلب' : 'By demand' },
                            ].map((item) => (
                                <Card key={item.title} className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                                        <item.icon className="h-5 w-5 text-[#0A66C2]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm">{item.title}</h3>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Results Phase
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Score Card */}
                        <Card className="bg-gradient-to-br from-[#0A66C2]/5 to-[#0A66C2]/10 border-[#0A66C2]/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {locale === 'ar' ? 'نتيجة تحسين الملف' : 'Profile Optimization Score'}
                                        </h2>
                                        <p className="text-muted-foreground text-sm">
                                            {locale === 'ar' ? 'بناءً على أفضل ممارسات LinkedIn' : 'Based on LinkedIn best practices'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-4xl font-bold ${getScoreColor(profile.profileScore)}`}>
                                            {profile.profileScore}
                                        </div>
                                        <div className="text-sm text-muted-foreground">/100</div>
                                    </div>
                                </div>

                                <Progress value={profile.profileScore} className="mt-4 h-2" />

                                {profile.improvements.length > 0 && (
                                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                        <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                                            <Lightbulb className="h-4 w-4 inline me-1" />
                                            {locale === 'ar' ? 'اقتراحات للتحسين' : 'Improvement Suggestions'}
                                        </h4>
                                        <ul className="text-sm space-y-1">
                                            {profile.improvements.map((imp, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <ChevronRight className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <span>{imp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Content Tabs */}
                        <Tabs defaultValue="headline">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                                <TabsTrigger value="headline">
                                    {locale === 'ar' ? 'العنوان' : 'Headline'}
                                </TabsTrigger>
                                <TabsTrigger value="about">
                                    {locale === 'ar' ? 'نبذة عني' : 'About'}
                                </TabsTrigger>
                                <TabsTrigger value="experience">
                                    {locale === 'ar' ? 'الخبرات' : 'Experience'}
                                </TabsTrigger>
                                <TabsTrigger value="skills">
                                    {locale === 'ar' ? 'المهارات' : 'Skills'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Headlines */}
                            <TabsContent value="headline" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {locale === 'ar' ? 'خيارات العنوان' : 'Headline Options'}
                                            </CardTitle>
                                            <Button variant="outline" size="sm" onClick={() => regenerateSection('headlines')}>
                                                <RefreshCw className="h-4 w-4 me-1" />
                                                {locale === 'ar' ? 'تجديد' : 'Regenerate'}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {profile.headlineOptions.map((headline, i) => (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedHeadlineIndex === i
                                                        ? 'border-[#0A66C2] bg-[#0A66C2]/5'
                                                        : 'border-muted hover:border-[#0A66C2]/50'
                                                    }`}
                                                onClick={() => setSelectedHeadlineIndex(i)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{headline}</p>
                                                    <div className="flex items-center gap-2">
                                                        {selectedHeadlineIndex === i && (
                                                            <Badge className="bg-[#0A66C2]">
                                                                {locale === 'ar' ? 'مختار' : 'Selected'}
                                                            </Badge>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(headline, `headline-${i}`);
                                                            }}
                                                        >
                                                            {copiedSection === `headline-${i}` ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {headline.length}/120 {locale === 'ar' ? 'حرف' : 'characters'}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* About */}
                            <TabsContent value="about">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {locale === 'ar' ? 'قسم "نبذة عني"' : '"About" Section'}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => regenerateSection('about')}>
                                                    <RefreshCw className="h-4 w-4 me-1" />
                                                    {locale === 'ar' ? 'تجديد' : 'Regenerate'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(profile.summary, 'about')}
                                                >
                                                    {copiedSection === 'about' ? (
                                                        <Check className="h-4 w-4 me-1 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 me-1" />
                                                    )}
                                                    {locale === 'ar' ? 'نسخ' : 'Copy'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            value={profile.summary}
                                            onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                                            className="min-h-[300px] resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {profile.summary.length}/2000 {locale === 'ar' ? 'حرف' : 'characters'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Experience */}
                            <TabsContent value="experience" className="space-y-4">
                                {profile.experience.map((exp, i) => (
                                    <Card key={i}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-base">{exp.title}</CardTitle>
                                                    <CardDescription>{exp.company}</CardDescription>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(exp.description, `exp-${i}`)}
                                                >
                                                    {copiedSection === `exp-${i}` ? (
                                                        <Check className="h-4 w-4 me-1 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 me-1" />
                                                    )}
                                                    {locale === 'ar' ? 'نسخ' : 'Copy'}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                    const newExp = [...profile.experience];
                                                    newExp[i].description = e.target.value;
                                                    setProfile({ ...profile, experience: newExp });
                                                }}
                                                className="min-h-[150px] resize-none"
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            {/* Skills */}
                            <TabsContent value="skills">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {locale === 'ar' ? 'المهارات المرتّبة' : 'Ranked Skills'}
                                        </CardTitle>
                                        <CardDescription>
                                            {locale === 'ar'
                                                ? 'مرتّبة حسب الطلب في السوق'
                                                : 'Ranked by market demand'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Featured Skills */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">
                                                {locale === 'ar' ? 'المهارات المميزة (أعلى 3)' : 'Featured Skills (Top 3)'}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.featuredSkills.map((skill) => (
                                                    <Badge key={skill} className="bg-[#0A66C2] text-white px-3 py-1">
                                                        ⭐ {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* All Skills */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">
                                                {locale === 'ar' ? 'كل المهارات (بالترتيب)' : 'All Skills (Ordered)'}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill, i) => (
                                                    <Badge key={skill} variant="outline" className="px-3 py-1">
                                                        {i + 1}. {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => copyToClipboard(profile.skills.join(', '), 'skills')}
                                        >
                                            {copiedSection === 'skills' ? (
                                                <Check className="h-4 w-4 me-2 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4 me-2" />
                                            )}
                                            {locale === 'ar' ? 'نسخ كل المهارات' : 'Copy All Skills'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setProfile(null)} className="flex-1">
                                {locale === 'ar' ? 'تحسين سيرة أخرى' : 'Optimize Another'}
                            </Button>
                            <Button
                                className="flex-1 bg-[#0A66C2] hover:bg-[#004182]"
                                onClick={() => window.open('https://www.linkedin.com/in/', '_blank')}
                            >
                                <Linkedin className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'فتح LinkedIn' : 'Open LinkedIn'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
