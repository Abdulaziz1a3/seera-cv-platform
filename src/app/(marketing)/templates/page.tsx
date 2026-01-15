'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Eye,
    Download,
    Star,
    Check,
    Sparkles,
    Briefcase,
    GraduationCap,
    Code,
    Palette,
    Building2,
    Stethoscope,
    RefreshCw,
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
    description: string | null;
    descriptionAr: string | null;
    thumbnail: string | null;
    isPremium: boolean;
    usageCount: number;
    category: string;
    layout: string;
    defaultTheme: string;
    features: string[];
}

interface Category {
    id: string;
    name: string;
    nameAr: string;
    count: number;
}

interface TemplatesData {
    templates: Template[];
    categories: Category[];
    stats: {
        total: number;
        free: number;
        premium: number;
        totalUsage: number;
    };
}

// Color gradients for templates based on category/layout
const templateColors: Record<string, string> = {
    executive: 'from-amber-600 to-amber-800',
    modern: 'from-blue-600 to-cyan-600',
    professional: 'from-slate-600 to-slate-800',
    creative: 'from-purple-600 to-pink-600',
    minimalist: 'from-gray-400 to-gray-600',
    startup: 'from-indigo-600 to-violet-600',
    corporate: 'from-slate-600 to-slate-800',
    technical: 'from-blue-600 to-cyan-600',
    academic: 'from-emerald-600 to-teal-600',
};

// Category icons
const categoryIcons: Record<string, any> = {
    all: Sparkles,
    corporate: Building2,
    creative: Palette,
    technical: Code,
    academic: GraduationCap,
    medical: Stethoscope,
};

export default function TemplatesPage() {
    const { locale, t } = useLocale();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
    const [data, setData] = useState<TemplatesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/templates');
            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = data?.templates
        ? selectedCategory === 'all'
            ? data.templates
            : data.templates.filter((t) => t.category === selectedCategory)
        : [];

    const categories = data?.categories || [
        { id: 'all', name: 'All Templates', nameAr: 'جميع القوالب', count: 0 },
    ];

    const getTemplateColor = (template: Template) => {
        return templateColors[template.layout] || templateColors[template.category] || 'from-primary/60 to-primary';
    };

    const getCategoryIcon = (categoryId: string) => {
        return categoryIcons[categoryId] || Sparkles;
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 via-background to-background overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-6">
                        <Sparkles className="h-4 w-4 me-2" />
                        {loading ? (
                            <Skeleton className="h-4 w-32 inline-block" />
                        ) : (
                            locale === 'ar'
                                ? `${data?.stats.total || 0} قوالب احترافية`
                                : `${data?.stats.total || 0} Professional Templates`
                        )}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        {locale === 'ar' ? (
                            <>
                                قوالب سيرة ذاتية <span className="text-primary">متوافقة مع ATS</span>
                            </>
                        ) : (
                            <>
                                <span className="text-primary">ATS-Friendly</span> Resume Templates
                            </>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        {locale === 'ar'
                            ? 'قوالب احترافية صممها خبراء التوظيف. كل قالب مُحسّن لتجاوز أنظمة تتبع المتقدمين.'
                            : 'Professional templates designed by hiring experts. Every template is optimized to pass Applicant Tracking Systems.'}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                        {[
                            locale === 'ar' ? 'متوافق مع ATS' : 'ATS Compatible',
                            locale === 'ar' ? 'قابل للتخصيص' : 'Fully Customizable',
                            locale === 'ar' ? 'دعم RTL' : 'RTL Support',
                            locale === 'ar' ? 'تصدير متعدد' : 'Multi-format Export',
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-primary" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    {data?.stats && (
                        <div className="flex justify-center gap-8 mt-10 text-center">
                            <div>
                                <p className="text-3xl font-bold text-primary">{data.stats.free}</p>
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'مجانية' : 'Free Templates'}
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-amber-500">{data.stats.premium}</p>
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'مميزة' : 'Premium Templates'}
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{data.stats.totalUsage.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? 'استخدام' : 'Total Uses'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Template Gallery */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-9 w-24" />
                                ))}
                            </>
                        ) : (
                            categories.map((category) => {
                                const Icon = getCategoryIcon(category.id);
                                return (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category.id)}
                                        className="gap-2"
                                    >
                                        <Icon className="h-4 w-4" />
                                        {locale === 'ar' ? category.nameAr : category.name}
                                        {category.id !== 'all' && (
                                            <span className="text-xs opacity-70">({category.count})</span>
                                        )}
                                    </Button>
                                );
                            })
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="overflow-hidden">
                                    <Skeleton className="aspect-[3/4]" />
                                    <CardContent className="p-4 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Button onClick={fetchTemplates}>
                                <RefreshCw className="h-4 w-4 me-2" />
                                {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filteredTemplates.length === 0 && (
                        <div className="text-center py-12">
                            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {locale === 'ar' ? 'لا توجد قوالب' : 'No Templates Found'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {locale === 'ar'
                                    ? 'لم يتم العثور على قوالب في هذه الفئة.'
                                    : 'No templates found in this category.'}
                            </p>
                            <Button variant="outline" onClick={() => setSelectedCategory('all')}>
                                {locale === 'ar' ? 'عرض الكل' : 'View All'}
                            </Button>
                        </div>
                    )}

                    {/* Templates Grid */}
                    {!loading && !error && filteredTemplates.length > 0 && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredTemplates.map((template) => (
                                <Card
                                    key={template.id}
                                    className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                    onMouseEnter={() => setHoveredTemplate(template.id)}
                                    onMouseLeave={() => setHoveredTemplate(null)}
                                >
                                    {/* Preview */}
                                    <div
                                        className={`relative aspect-[3/4] bg-gradient-to-br ${getTemplateColor(template)} flex items-center justify-center`}
                                    >
                                        {/* Premium Badge */}
                                        {template.isPremium && (
                                            <Badge className="absolute top-3 end-3 bg-amber-500 gap-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                PRO
                                            </Badge>
                                        )}

                                        {/* Template Preview Mockup */}
                                        <div className="w-3/4 h-4/5 bg-white rounded-lg shadow-2xl p-4 transform group-hover:scale-105 transition-transform">
                                            <div className="h-full flex flex-col gap-2">
                                                {/* Mockup varies by layout */}
                                                {template.layout === 'modern' ? (
                                                    // Modern: sidebar layout
                                                    <div className="flex gap-2 h-full">
                                                        <div className="w-1/3 bg-slate-700 rounded" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-2 w-3/4 bg-gray-200 rounded" />
                                                            <div className="h-1 w-full bg-gray-100 rounded" />
                                                            <div className="h-1 w-2/3 bg-gray-100 rounded" />
                                                        </div>
                                                    </div>
                                                ) : template.layout === 'executive' ? (
                                                    // Executive: centered header
                                                    <>
                                                        <div className="h-1 w-full bg-amber-400" />
                                                        <div className="h-3 w-1/2 mx-auto bg-gray-300 rounded" />
                                                        <div className="h-1 w-1/3 mx-auto bg-gray-200 rounded" />
                                                        <div className="h-px bg-amber-200 my-1" />
                                                        <div className="space-y-1 flex-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={i} className="h-1 bg-gray-100 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : template.layout === 'creative' ? (
                                                    // Creative: color block header
                                                    <>
                                                        <div className="h-8 w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
                                                        <div className="space-y-1 flex-1 pt-2">
                                                            {[...Array(6)].map((_, i) => (
                                                                <div key={i} className="h-1.5 bg-gray-100 rounded" style={{ width: `${50 + Math.random() * 50}%` }} />
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : template.layout === 'startup' ? (
                                                    // Startup: bold name + skills strip
                                                    <>
                                                        <div className="h-4 w-2/3 bg-gray-300 rounded" />
                                                        <div className="h-2 w-full bg-blue-100 rounded flex gap-1 items-center px-1">
                                                            <div className="h-1 w-4 bg-blue-300 rounded" />
                                                            <div className="h-1 w-6 bg-blue-300 rounded" />
                                                            <div className="h-1 w-5 bg-blue-300 rounded" />
                                                        </div>
                                                        <div className="flex gap-2 flex-1">
                                                            <div className="flex-1 space-y-1">
                                                                {[...Array(4)].map((_, i) => (
                                                                    <div key={i} className="h-1 bg-gray-100 rounded" />
                                                                ))}
                                                            </div>
                                                            <div className="w-1/3 space-y-1">
                                                                <div className="h-1 bg-gray-200 rounded" />
                                                                <div className="h-1 bg-gray-100 rounded" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Default/minimalist/professional
                                                    <>
                                                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                                        <div className="h-2 w-3/4 bg-gray-100 rounded" />
                                                        <div className="h-px bg-gray-200 my-2" />
                                                        <div className="space-y-1 flex-1">
                                                            {[...Array(6)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="h-1.5 bg-gray-100 rounded"
                                                                    style={{ width: `${60 + Math.random() * 40}%` }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover Overlay */}
                                        <div
                                            className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity ${hoveredTemplate === template.id ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        >
                                            <Button size="sm" variant="secondary">
                                                <Eye className="h-4 w-4 me-1" />
                                                {locale === 'ar' ? 'معاينة' : 'Preview'}
                                            </Button>
                                            <Button size="sm" asChild>
                                                <Link href={`/dashboard/resumes/new?template=${template.slug}`}>
                                                    {locale === 'ar' ? 'استخدم' : 'Use'}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold">
                                                {locale === 'ar' ? template.nameAr : template.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {locale === 'ar'
                                                ? template.descriptionAr || template.description
                                                : template.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {template.usageCount.toLocaleString()} {locale === 'ar' ? 'استخدام' : 'uses'}
                                            </span>
                                            {template.isPremium ? (
                                                <Badge variant="outline" className="text-xs">
                                                    {locale === 'ar' ? 'مميز' : 'Premium'}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    {locale === 'ar' ? 'مجاني' : 'Free'}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        {locale === 'ar' ? 'جاهز لبناء سيرتك الذاتية؟' : 'Ready to Build Your Resume?'}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {locale === 'ar'
                            ? 'اختر قالباً وابدأ في إنشاء سيرتك الذاتية الاحترافية في دقائق.'
                            : 'Choose a template and start creating your professional resume in minutes.'}
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/register">
                            {locale === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
