'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Mail,
    MapPin,
    MessageSquare,
    Clock,
} from 'lucide-react';

export default function ContactPage() {
    const { locale } = useLocale();

    const contactInfo = [
        {
            icon: Mail,
            title: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
            value: 'info@seera-sa.com',
            description: locale === 'ar' ? 'نرد خلال 24 ساعة' : 'We respond within 24 hours',
        },
        {
            icon: MapPin,
            title: locale === 'ar' ? 'العنوان' : 'Address',
            value: locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
            description: locale === 'ar' ? 'طريق الملك فهد' : 'King Fahd Road',
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge variant="secondary" className="mb-6">
                        <MessageSquare className="h-4 w-4 me-2" />
                        {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        {locale === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'}
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {locale === 'ar'
                            ? 'فريقنا جاهز للإجابة على أسئلتك ومساعدتك في رحلتك المهنية.'
                            : 'Our team is ready to answer your questions and help you on your career journey.'}
                    </p>
                </div>
            </section>

            {/* Contact Info */}
            <section className="py-12 border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {contactInfo.map((info) => (
                            <Card key={info.title} className="text-center">
                                <CardContent className="pt-6">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <info.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-1">{info.title}</h3>
                                    <p className="text-primary font-medium mb-1">{info.value}</p>
                                    <p className="text-sm text-muted-foreground">{info.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Link */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {locale === 'ar' ? 'تحتاج إجابة سريعة؟' : 'Need a quick answer?'}
                        </span>
                    </div>
                    <Button variant="outline" size="lg" asChild>
                        <a href="/help">
                            {locale === 'ar' ? 'تصفح الأسئلة الشائعة' : 'Browse our FAQ'}
                        </a>
                    </Button>
                </div>
            </section>
        </div>
    );
}
