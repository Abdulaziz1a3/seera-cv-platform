'use client';

import { useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { useResumes } from '@/components/providers/resume-provider';
import { normalizeResumeForCareer } from '@/lib/resume-normalizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';
import {
    Compass,
    Map,
    Target,
    TrendingUp,
    Sparkles,
    Loader2,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Clock,
    DollarSign,
    Briefcase,
    GraduationCap,
    Award,
    Zap,
    Users,
    BookOpen,
    Rocket,
    Star,
    ArrowRight,
    RefreshCw,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

// Types from career-gps
interface CareerPath {
    id: string;
    name: string;
    description: string;
    track: string;
    timeline: Array<{
        title: string;
        yearsFromNow: number;
        salaryRange: { min: number; max: number };
        keySkills: string[];
        description: string;
    }>;
    salaryProgression: number[];
    probability: number;
    requirements: string[];
}

interface SkillGap {
    skill: string;
    currentLevel: string;
    requiredLevel: string;
    priority: string;
    resources: Array<{ name: string; type: string }>;
    estimatedTimeToAcquire: string;
}

interface WeeklyAction {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    estimatedHours: number;
    completed: boolean;
}

interface CareerAnalysis {
    currentPosition: {
        title: string;
        level: string;
        yearsExperience: number;
        estimatedSalary: { min: number; max: number; currency: string };
        marketDemand: string;
    };
    careerPaths: CareerPath[];
    skillGaps: SkillGap[];
    strengths: string[];
    weeklyActions: WeeklyAction[];
    careerScore: number;
    industryInsights: {
        trendingSkills: string[];
        hotIndustries: string[];
        saudizationOpportunities: string[];
        salaryTrends: string;
    };
}

export default function CareerGPSPage() {
    const { locale } = useLocale();
    const { resumes } = useResumes();

    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
    const [selectedPathIndex, setSelectedPathIndex] = useState(0);
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

    const parseJsonResponse = async (response: Response) => {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            throw new Error(text);
        }
    };

    // Analyze career
    const analyzeCareer = async () => {
        if (!selectedResumeId) return;

        setIsAnalyzing(true);
        try {
            const resumeResponse = await fetch(`/api/resumes/${selectedResumeId}`);
            if (!resumeResponse.ok) {
                throw new Error('Failed to load resume');
            }

            const resumeData = await resumeResponse.json();
            const normalizedResume = normalizeResumeForCareer(resumeData);

            const response = await fetch('/api/career', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze',
                    resume: normalizedResume,
                    options: { locale },
                }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }

            const payload = await parseJsonResponse(response);
            if (!response.ok) {
                const message = payload?.error || `Request failed (HTTP ${response.status})`;
                throw new Error(message);
            }

            const { result, error } = payload || {};
            if (error) throw new Error(error);

            setAnalysis(result);
            toast.success(locale === 'ar' ? 'تم تحليل المسار الوظيفي!' : 'Career analysis complete!');
        } catch (error: any) {
            toast.error(error.message || (locale === 'ar' ? 'فشل التحليل' : 'Analysis failed'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Toggle action completion
    const toggleAction = (actionId: string) => {
        setCompletedActions(prev => {
            const next = new Set(prev);
            if (next.has(actionId)) {
                next.delete(actionId);
            } else {
                next.add(actionId);
            }
            return next;
        });
    };

    // Format salary
    const formatSalary = (amount: number) => {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-amber-500';
            case 'medium': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    // Get track icon
    const getTrackIcon = (track: string) => {
        switch (track) {
            case 'technical': return Zap;
            case 'management': return Users;
            case 'specialist': return Award;
            case 'entrepreneurial': return Rocket;
            default: return Briefcase;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-transparent px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Compass className="h-6 w-6 text-white" />
                            </div>
                            {locale === 'ar' ? 'نظام GPS المهني' : 'Career GPS'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {locale === 'ar'
                                ? 'خارطة طريق شخصية لمسيرتك المهنية'
                                : 'Your personal roadmap to career success'}
                        </p>
                    </div>

                    {analysis && (
                        <Button variant="outline" onClick={() => setAnalysis(null)}>
                            <RefreshCw className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'تحليل جديد' : 'New Analysis'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6">
                {!analysis ? (
                    // Setup Phase
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Map className="h-5 w-5 text-primary" />
                                    {locale === 'ar' ? 'ابدأ رحلتك المهنية' : 'Start Your Career Journey'}
                                </h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {locale === 'ar'
                                        ? 'اختر سيرتك الذاتية وسنرسم لك مسارات مهنية مخصصة'
                                        : 'Select your resume and we\'ll map out personalized career paths'}
                                </p>
                            </div>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {locale === 'ar' ? 'اختر السيرة الذاتية' : 'Select Resume'}
                                    </label>
                                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                        <SelectTrigger className="h-12">
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
                                    className="w-full h-14 text-lg"
                                    onClick={analyzeCareer}
                                    disabled={!selectedResumeId || isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin me-2" />
                                            {locale === 'ar' ? 'جارٍ تحليل مسيرتك...' : 'Analyzing your career...'}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 me-2" />
                                            {locale === 'ar' ? 'تحليل المسار المهني' : 'Analyze Career Path'}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Feature Preview */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { icon: TrendingUp, title: locale === 'ar' ? 'مسارات مهنية' : 'Career Paths', desc: locale === 'ar' ? 'مسارات واقعية' : 'Realistic paths', color: 'text-blue-500' },
                                { icon: Target, title: locale === 'ar' ? 'فجوات المهارات' : 'Skill Gaps', desc: locale === 'ar' ? 'ما تحتاج تتعلمه' : 'What to learn', color: 'text-amber-500' },
                                { icon: DollarSign, title: locale === 'ar' ? 'توقعات الراتب' : 'Salary Forecast', desc: locale === 'ar' ? 'بناءً على السوق' : 'Market-based', color: 'text-green-500' },
                                { icon: Calendar, title: locale === 'ar' ? 'خطة أسبوعية' : 'Weekly Plan', desc: locale === 'ar' ? 'خطوات عملية' : 'Actionable steps', color: 'text-purple-500' },
                            ].map((item) => (
                                <Card key={item.title} className="p-4 flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                                        <item.icon className="h-5 w-5" />
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
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Career Score & Current Position */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Career Score */}
                            <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="relative inline-flex">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle
                                                    className="text-muted"
                                                    strokeWidth="8"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="56"
                                                    cx="64"
                                                    cy="64"
                                                />
                                                <circle
                                                    className="text-primary"
                                                    strokeWidth="8"
                                                    strokeDasharray={`${analysis.careerScore * 3.52} 352`}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="56"
                                                    cx="64"
                                                    cy="64"
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold">
                                                {analysis.careerScore}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold mt-2">
                                            {locale === 'ar' ? 'نقاط المسيرة' : 'Career Score'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {analysis.careerScore >= 80
                                                ? (locale === 'ar' ? 'ممتاز!' : 'Excellent!')
                                                : analysis.careerScore >= 60
                                                    ? (locale === 'ar' ? 'جيد جداً' : 'Very Good')
                                                    : (locale === 'ar' ? 'يحتاج تطوير' : 'Needs Work')
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Position */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        {locale === 'ar' ? 'موقعك الحالي' : 'Your Current Position'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-2xl font-bold">{analysis.currentPosition.title}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline">{analysis.currentPosition.level}</Badge>
                                                <Badge variant="outline">
                                                    {analysis.currentPosition.yearsExperience} {locale === 'ar' ? 'سنوات' : 'years'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    {locale === 'ar' ? 'الراتب المتوقع' : 'Expected Salary'}
                                                </span>
                                                <span className="font-semibold text-green-600">
                                                    {formatSalary(analysis.currentPosition.estimatedSalary.min)} - {formatSalary(analysis.currentPosition.estimatedSalary.max)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    {locale === 'ar' ? 'الطلب في السوق' : 'Market Demand'}
                                                </span>
                                                <Badge className={`${analysis.currentPosition.marketDemand === 'very_high' ? 'bg-green-500' :
                                                        analysis.currentPosition.marketDemand === 'high' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`}>
                                                    {analysis.currentPosition.marketDemand.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    {analysis.strengths.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm font-medium mb-2">
                                                {locale === 'ar' ? 'نقاط قوتك' : 'Your Strengths'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.strengths.map((strength, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        <Star className="h-3 w-3 me-1 text-amber-500" />
                                                        {strength}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="paths" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="paths" className="gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="hidden sm:inline">{locale === 'ar' ? 'المسارات' : 'Paths'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="skills" className="gap-2">
                                    <Target className="h-4 w-4" />
                                    <span className="hidden sm:inline">{locale === 'ar' ? 'المهارات' : 'Skills'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="actions" className="gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="insights" className="gap-2">
                                    <Zap className="h-4 w-4" />
                                    <span className="hidden sm:inline">{locale === 'ar' ? 'رؤى' : 'Insights'}</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Career Paths */}
                            <TabsContent value="paths" className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Path Selector */}
                                    <div className="space-y-3">
                                        {analysis.careerPaths.map((path, index) => {
                                            const TrackIcon = getTrackIcon(path.track);
                                            return (
                                                <Card
                                                    key={path.id}
                                                    className={`cursor-pointer transition-all ${selectedPathIndex === index
                                                            ? 'border-primary shadow-lg'
                                                            : 'hover:border-primary/50'
                                                        }`}
                                                    onClick={() => setSelectedPathIndex(index)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedPathIndex === index
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-muted'
                                                                }`}>
                                                                <TrackIcon className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <h3 className="font-semibold">{path.name}</h3>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {path.probability}% {locale === 'ar' ? 'احتمال' : 'likely'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {path.timeline.length} {locale === 'ar' ? 'مراحل' : 'stages'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-green-600">
                                                                        <DollarSign className="h-3 w-3" />
                                                                        {formatSalary(path.salaryProgression[path.salaryProgression.length - 1] || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    {/* Path Timeline */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">
                                                {locale === 'ar' ? 'الجدول الزمني' : 'Timeline'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="relative">
                                                {analysis.careerPaths[selectedPathIndex]?.timeline.map((milestone, index) => (
                                                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                                                        {/* Timeline line */}
                                                        <div className="flex flex-col items-center">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${index === 0
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-muted'
                                                                }`}>
                                                                {index + 1}
                                                            </div>
                                                            {index < analysis.careerPaths[selectedPathIndex].timeline.length - 1 && (
                                                                <div className="w-0.5 flex-1 bg-muted mt-2" />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium">{milestone.title}</h4>
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{milestone.yearsFromNow} {locale === 'ar' ? 'سنة' : 'yr'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-sm font-medium text-green-600">
                                                                    {formatSalary(milestone.salaryRange.min)} - {formatSalary(milestone.salaryRange.max)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {milestone.keySkills.slice(0, 3).map((skill, i) => (
                                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                                        {skill}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Skill Gaps */}
                            <TabsContent value="skills" className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {analysis.skillGaps.map((gap, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium flex items-center gap-2">
                                                            {gap.skill}
                                                            <Badge className={`${getPriorityColor(gap.priority)} text-white text-xs`}>
                                                                {gap.priority}
                                                            </Badge>
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-2 text-sm">
                                                            <span className="text-muted-foreground">{gap.currentLevel}</span>
                                                            <ArrowRight className="h-4 w-4" />
                                                            <span className="font-medium text-primary">{gap.requiredLevel}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <p className="text-sm font-medium">{gap.estimatedTimeToAcquire}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {locale === 'ar' ? 'للوصول' : 'to acquire'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {gap.resources.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {locale === 'ar' ? 'موارد مقترحة' : 'Suggested Resources'}
                                                        </p>
                                                        <div className="space-y-1">
                                                            {gap.resources.slice(0, 2).map((resource, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                                    <BookOpen className="h-3 w-3 text-primary" />
                                                                    <span>{resource.name}</span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {resource.type}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Weekly Actions */}
                            <TabsContent value="actions" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {locale === 'ar' ? 'إجراءات هذا الأسبوع' : 'This Week\'s Actions'}
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {completedActions.size} / {analysis.weeklyActions.length} {locale === 'ar' ? 'مكتمل' : 'done'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {analysis.weeklyActions.map((action) => (
                                            <div
                                                key={action.id}
                                                className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${completedActions.has(action.id)
                                                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
                                                        : 'hover:bg-muted/50'
                                                    }`}
                                                onClick={() => toggleAction(action.id)}
                                            >
                                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${completedActions.has(action.id)
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-muted-foreground'
                                                    }`}>
                                                    {completedActions.has(action.id) && (
                                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`font-medium ${completedActions.has(action.id) ? 'line-through text-muted-foreground' : ''}`}>
                                                            {action.title}
                                                        </h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            {action.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {action.estimatedHours}h
                                                        </span>
                                                        <Badge className={`${getPriorityColor(action.priority)} text-white text-xs`}>
                                                            {action.priority}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Industry Insights */}
                            <TabsContent value="insights" className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                {locale === 'ar' ? 'المهارات الرائجة' : 'Trending Skills'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.industryInsights.trendingSkills.map((skill, i) => (
                                                    <Badge key={i} className="bg-gradient-to-r from-primary/80 to-primary text-white">
                                                        🔥 {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Briefcase className="h-5 w-5 text-green-500" />
                                                {locale === 'ar' ? 'القطاعات الناشئة' : 'Hot Industries'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.industryInsights.hotIndustries.map((industry, i) => (
                                                    <Badge key={i} variant="outline" className="border-green-500 text-green-600">
                                                        {industry}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Users className="h-5 w-5 text-amber-500" />
                                                {locale === 'ar' ? 'فرص السعودة' : 'Saudization Opportunities'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {analysis.industryInsights.saudizationOpportunities.map((opp, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        {opp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                {locale === 'ar' ? 'اتجاهات الرواتب' : 'Salary Trends'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm">{analysis.industryInsights.salaryTrends}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}
