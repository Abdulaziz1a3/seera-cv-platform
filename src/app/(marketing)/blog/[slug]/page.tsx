'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Clock,
    Share2,
    BookmarkPlus,
    ThumbsUp,
    ArrowRight,
} from 'lucide-react';

// Blog data
const blogPosts: Record<string, {
    title: { en: string; ar: string };
    content: { en: string; ar: string };
    category: { en: string; ar: string };
    readTime: number;
}> = {
    'how-to-write-ats-friendly-resume': {
        title: {
            en: 'How to Write an ATS-Friendly Resume',
            ar: 'كيف تكتب سيرة ذاتية متوافقة مع ATS',
        },
        content: {
            en: `## What is an ATS?

An Applicant Tracking System (ATS) is software used by employers to collect, sort, scan, and rank job applications. Understanding how these systems work is crucial for job seekers.

## Key Tips for ATS Optimization

### 1. Use Standard Formatting
- Stick to common fonts like Arial, Calibri, or Times New Roman
- Use standard section headings (Experience, Education, Skills)
- Avoid tables, graphics, and complex layouts

### 2. Include Relevant Keywords
- Mirror keywords from the job description
- Use both spelled-out terms and acronyms
- Place important keywords in context

### 3. Choose the Right File Format
- PDF is generally safe for most ATS
- Some older systems prefer .docx
- Always follow the employer's instructions

### 4. Optimize Your Contact Information
- Place your name at the top
- Use standard labels for phone and email
- Avoid headers or footers for critical info

## Common ATS Mistakes to Avoid

1. Using creative layouts with multiple columns
2. Submitting image-based resumes
3. Using uncommon fonts or special characters
4. Missing keywords from the job description

## Conclusion

By following these guidelines, you can significantly improve your chances of getting past the ATS and into the hands of a human recruiter.`,
            ar: `## ما هو نظام ATS؟

نظام تتبع المتقدمين (ATS) هو برنامج يستخدمه أصحاب العمل لجمع وفرز ومسح وترتيب طلبات التوظيف. فهم كيفية عمل هذه الأنظمة أمر بالغ الأهمية للباحثين عن عمل.

## نصائح أساسية لتحسين ATS

### 1. استخدم التنسيق القياسي
- التزم بالخطوط الشائعة مثل Arial أو Calibri أو Times New Roman
- استخدم عناوين الأقسام القياسية (الخبرة، التعليم، المهارات)
- تجنب الجداول والرسومات والتخطيطات المعقدة

### 2. تضمين الكلمات المفتاحية ذات الصلة
- انعكس الكلمات المفتاحية من وصف الوظيفة
- استخدم المصطلحات المكتوبة والاختصارات
- ضع الكلمات المفتاحية المهمة في سياقها

### 3. اختر تنسيق الملف الصحيح
- PDF آمن بشكل عام لمعظم أنظمة ATS
- بعض الأنظمة القديمة تفضل .docx
- اتبع دائمًا تعليمات صاحب العمل

## الخلاصة

باتباع هذه الإرشادات، يمكنك تحسين فرصك بشكل كبير في تجاوز ATS والوصول إلى مسؤول التوظيف.`,
        },
        category: { en: 'Resume Tips', ar: 'نصائح السيرة' },
        readTime: 8,
    },
};

const relatedPosts = [
    {
        slug: 'top-skills-employers-want',
        title: { en: 'Top 10 Skills Employers Want', ar: 'أهم 10 مهارات يبحث عنها أصحاب العمل' },
    },
    {
        slug: 'perfect-cover-letter-guide',
        title: { en: 'Writing the Perfect Cover Letter', ar: 'كتابة خطاب تقديم مثالي' },
    },
];

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const { locale, t } = useLocale();
    const post = blogPosts[params.slug];

    if (!post) {
        // For demo purposes, show the first post for any slug
        const demoPost = blogPosts['how-to-write-ats-friendly-resume'];
        return <BlogPostContent post={demoPost} locale={locale} t={t} />;
    }

    return <BlogPostContent post={post} locale={locale} t={t} />;
}

function BlogPostContent({ post, locale, t }: { post: typeof blogPosts[string]; locale: 'en' | 'ar'; t: any }) {
    return (
        <article className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
            >
                <ArrowLeft className="h-4 w-4" />
                {locale === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
            </Link>

            {/* Header */}
            <header className="mb-8">
                <Badge className="mb-4">{post.category[locale]}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title[locale]}</h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} {locale === 'ar' ? 'دقيقة قراءة' : 'min read'}</span>
                </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl mb-8 flex items-center justify-center">
                <span className="text-8xl opacity-20">📝</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-8">
                <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 me-1" />
                    {locale === 'ar' ? 'مشاركة' : 'Share'}
                </Button>
                <Button variant="outline" size="sm">
                    <BookmarkPlus className="h-4 w-4 me-1" />
                    {locale === 'ar' ? 'حفظ' : 'Save'}
                </Button>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                {post.content[locale].split('\n').map((paragraph, i) => {
                    if (paragraph.startsWith('## ')) {
                        return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                    }
                    if (paragraph.startsWith('### ')) {
                        return <h3 key={i} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('- ')) {
                        return <li key={i} className="ms-6">{paragraph.replace('- ', '')}</li>;
                    }
                    if (paragraph.match(/^\d\. /)) {
                        return <li key={i} className="ms-6">{paragraph.replace(/^\d\. /, '')}</li>;
                    }
                    if (paragraph.trim()) {
                        return <p key={i} className="mb-4">{paragraph}</p>;
                    }
                    return null;
                })}
            </div>

            {/* Feedback */}
            <Card className="mb-12">
                <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground mb-4">
                        {locale === 'ar' ? 'هل كان هذا المقال مفيداً؟' : 'Was this article helpful?'}
                    </p>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline">
                            <ThumbsUp className="h-4 w-4 me-1" />
                            {locale === 'ar' ? 'نعم' : 'Yes'}
                        </Button>
                        <Button variant="outline">
                            {locale === 'ar' ? 'لا' : 'No'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Related Posts */}
            <section>
                <h2 className="text-xl font-bold mb-4">
                    {locale === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {relatedPosts.map((related) => (
                        <Link key={related.slug} href={`/blog/${related.slug}`}>
                            <Card className="group hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium group-hover:text-primary transition-colors">
                                            {related.title[locale]}
                                        </h3>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </article>
    );
}
