'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecruiterPortalPage() {
    const { locale } = useLocale();

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
            <Card className="max-w-xl w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {locale === 'ar' ? 'بوابة مسؤولي التوظيف قريباً' : 'Recruiter Portal Coming Soon'}
                    </CardTitle>
                    <CardDescription>
                        {locale === 'ar'
                            ? 'نعمل على إطلاق تجربة التوظيف للشركات قريباً مع بحث ذكي عن المواهب.'
                            : 'We are preparing the recruiter experience with smart talent search.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? 'سجّل اهتمامك وسنبلغك أولاً عند الإطلاق.'
                            : 'Leave your interest and we will notify you when it launches.'}
                    </p>
                    <Button asChild>
                        <Link href="/pricing">
                            {locale === 'ar' ? 'اطّلع على الخطط' : 'View Plans'}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
