'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Search,
    Clock,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';

// Blog posts
const blogPosts = [
    {
        id: '1',
        slug: 'how-to-write-ats-friendly-resume',
        title: {
            en: 'How to Write an ATS-Friendly Resume',
            ar: 'كيف تكتب سيرة ذاتية متوافقة مع ATS',
        },
        excerpt: {
            en: 'Learn the secrets to getting your resume past Applicant Tracking Systems and into the hands of recruiters.',
            ar: 'تعلم أسرار تجاوز أنظمة تتبع المتقدمين والوصول إلى مسؤولي التوظيف.',
        },
        category: { en: 'Resume Tips', ar: 'نصائح السيرة' },
        readTime: 8,
        featured: true,
    },
    {
        id: '2',
        slug: 'top-skills-employers-want',
        title: {
            en: 'Top 10 Skills Employers Want to See',
            ar: 'أهم 10 مهارات يبحث عنها أصحاب العمل',
        },
        excerpt: {
            en: 'Discover the most in-demand skills that can help you stand out in the competitive job market.',
            ar: 'اكتشف المهارات الأكثر طلباً التي يمكن أن تساعدك على التميز في سوق العمل.',
        },
        category: { en: 'Career Advice', ar: 'نصائح مهنية' },
        readTime: 6,
        featured: true,
    },
    {
        id: '3',
        slug: 'perfect-cover-letter-guide',
        title: {
            en: 'The Complete Guide to Writing a Perfect Cover Letter',
            ar: 'الدليل الكامل لكتابة خطاب تقديم مثالي',
        },
        excerpt: {
            en: 'Master the art of writing cover letters that get you noticed by hiring managers.',
            ar: 'أتقن فن كتابة خطابات التقديم التي تلفت انتباه مسؤولي التوظيف.',
        },
        category: { en: 'Cover Letters', ar: 'خطابات التقديم' },
        readTime: 10,
        featured: false,
    },
    {
        id: '4',
        slug: 'interview-preparation-tips',
        title: {
            en: 'Interview Preparation: Questions and Answers',
            ar: 'التحضير للمقابلة: أسئلة وأجوبة',
        },
        excerpt: {
            en: 'Prepare for your next interview with these common questions and expert-approved answers.',
            ar: 'استعد لمقابلتك القادمة مع هذه الأسئلة الشائعة والإجابات المعتمدة من الخبراء.',
        },
        category: { en: 'Interviews', ar: 'المقابلات' },
        readTime: 12,
        featured: false,
    },
    {
        id: '5',
        slug: 'saudi-job-market-trends',
        title: {
            en: 'Saudi Arabia Job Market Trends',
            ar: 'اتجاهات سوق العمل السعودي',
        },
        excerpt: {
            en: 'Explore the latest trends and opportunities in the Saudi job market.',
            ar: 'استكشف أحدث الاتجاهات والفرص في سوق العمل السعودي.',
        },
        category: { en: 'Market Insights', ar: 'رؤى السوق' },
        readTime: 7,
        featured: false,
    },
];

const categories = [
    { en: 'All', ar: 'الكل' },
    { en: 'Resume Tips', ar: 'نصائح السيرة' },
    { en: 'Cover Letters', ar: 'خطابات التقديم' },
    { en: 'Career Advice', ar: 'نصائح مهنية' },
    { en: 'Interviews', ar: 'المقابلات' },
    { en: 'Market Insights', ar: 'رؤى السوق' },
];

export default function BlogPage() {
    const { locale, t } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredPosts = blogPosts.filter((post) => {
        const matchesSearch =
            post.title[locale].toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt[locale].toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === 'All' || post.category.en === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredPosts = blogPosts.filter((p) => p.featured);

    return (
        <div className="space-y-12">
            {/* Hero */}
            <section className="text-center space-y-4">
                <Badge variant="secondary" className="mb-2">
                    {locale === 'ar' ? 'مدونة Seera AI' : 'Seera AI Blog'}
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    {locale === 'ar' ? 'نصائح وإرشادات مهنية' : 'Career Tips & Insights'}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {locale === 'ar'
                        ? 'اكتشف أحدث النصائح والاستراتيجيات لتحسين سيرتك الذاتية والتميز في سوق العمل'
                        : 'Discover the latest tips and strategies to improve your resume and stand out in the job market'}
                </p>

                {/* Search */}
                <div className="max-w-md mx-auto pt-4">
                    <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={locale === 'ar' ? 'البحث في المقالات...' : 'Search articles...'}
                            className="ps-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Featured Posts */}
            {!searchQuery && selectedCategory === 'All' && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        {locale === 'ar' ? 'المقالات المميزة' : 'Featured Articles'}
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {featuredPosts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl opacity-20">📝</span>
                                        </div>
                                        <Badge className="absolute top-3 start-3">
                                            {post.category[locale]}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-5">
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title[locale]}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {post.excerpt[locale]}
                                        </p>
                                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {post.readTime} {locale === 'ar' ? 'د قراءة' : 'min read'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Categories */}
            <section>
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((cat) => (
                        <Button
                            key={cat.en}
                            variant={selectedCategory === cat.en ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.en)}
                        >
                            {cat[locale]}
                        </Button>
                    ))}
                </div>

                {/* All Posts */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {locale === 'ar' ? 'لا توجد مقالات مطابقة' : 'No matching articles found'}
                            </p>
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <Card className="group hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex gap-5">
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-3xl opacity-30">📝</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge variant="secondary" className="mb-2 text-xs">
                                                {post.category[locale]}
                                            </Badge>
                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                {post.title[locale]}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {post.excerpt[locale]}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {post.readTime} {locale === 'ar' ? 'دقيقة قراءة' : 'min read'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center">
                                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="bg-primary/5 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">
                    {locale === 'ar' ? 'اشترك في النشرة الإخبارية' : 'Subscribe to Our Newsletter'}
                </h2>
                <p className="text-muted-foreground mb-6">
                    {locale === 'ar'
                        ? 'احصل على أحدث النصائح المهنية مباشرة في بريدك الإلكتروني'
                        : 'Get the latest career tips delivered directly to your inbox'}
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                        type="email"
                        placeholder={locale === 'ar' ? 'بريدك الإلكتروني' : 'Your email address'}
                        className="flex-1"
                    />
                    <Button>
                        {locale === 'ar' ? 'اشتراك' : 'Subscribe'}
                    </Button>
                </div>
            </section>
        </div>
    );
}
